import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Location, LocationUpdate, Geofence, GeofenceEvent, SOSAlert, BatteryRecord } from '../types'

interface LocationContextType {
  // Current user's location
  currentLocation: Location | null
  // All group members' locations
  memberLocations: Map<string, Location>
  // Geofences
  geofences: Geofence[]
  // Geofence events
  geofenceEvents: GeofenceEvent[]
  // SOS alerts
  sosAlerts: SOSAlert[]
  // Battery records
  batteryRecords: Map<string, BatteryRecord>
  // Loading states
  loading: boolean
  // Location sharing
  isSharing: boolean
  startLocationSharing: (groupId: string, interval?: number) => Promise<{ error: Error | null }>
  stopLocationSharing: () => void
  updateLocation: (location: LocationUpdate) => Promise<{ error: Error | null }>
  // Geofence management
  fetchGeofences: (groupId: string) => Promise<void>
  createGeofence: (groupId: string, data: Omit<Geofence, 'id' | 'group_id' | 'created_by' | 'created_at' | 'updated_at'>) => Promise<{ error: Error | null; geofence?: Geofence }>
  updateGeofence: (geofenceId: string, data: Partial<Geofence>) => Promise<{ error: Error | null }>
  deleteGeofence: (geofenceId: string) => Promise<{ error: Error | null }>
  // SOS management
  fetchSOSAlerts: (groupId: string) => Promise<void>
  createSOS: (data: { group_id: string; latitude: number; longitude: number; accuracy?: number; message?: string }) => Promise<{ error: Error | null; alert?: SOSAlert }>
  resolveSOS: (alertId: string) => Promise<{ error: Error | null }>
  cancelSOS: (alertId: string) => Promise<{ error: Error | null }>
  // Battery management
  updateBattery: (level: number, isCharging: boolean) => Promise<{ error: Error | null }>
  // Realtime subscriptions
  subscribeToLocations: (groupId: string) => () => void
  subscribeToGeofenceEvents: (groupId: string) => () => void
  subscribeToSOSAlerts: (groupId: string) => () => void
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

export function LocationProvider({ children }: { children: ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [memberLocations, setMemberLocations] = useState<Map<string, Location>>(new Map())
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [geofenceEvents, setGeofenceEvents] = useState<GeofenceEvent[]>([])
  const [sosAlerts, setSOSAlerts] = useState<SOSAlert[]>([])
  const [batteryRecords, setBatteryRecords] = useState<Map<string, BatteryRecord>>(new Map())
  const [loading, setLoading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  // Refs for intervals and subscriptions
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const subscriptionsRef = useRef<{ unsubscribe: () => void }[]>([])
  const currentGroupIdRef = useRef<string | null>(null)
  const watchIdRef = useRef<number | null>(null)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current)
      locationIntervalRef.current = null
    }
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    subscriptionsRef.current.forEach(sub => sub.unsubscribe())
    subscriptionsRef.current = []
    setIsSharing(false)
    currentGroupIdRef.current = null
  }, [])

  // Get current position
  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      })
    })
  }

  // Watch position for continuous updates
  const watchPosition = (onUpdate: (pos: GeolocationPosition) => void, onError: (err: GeolocationPositionError) => void) => {
    if (!navigator.geolocation) return
    watchIdRef.current = navigator.geolocation.watchPosition(onUpdate, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000,
    })
  }

  // Start location sharing
  const startLocationSharing = async (groupId: string, interval = 30000) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    currentGroupIdRef.current = groupId
    setIsSharing(true)

    // Get initial position
    try {
      const position = await getCurrentPosition()
      await updateLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude ?? undefined,
        speed: position.coords.speed ?? undefined,
        heading: position.coords.heading ?? undefined,
      })
    } catch (error) {
      console.error('Error getting initial position:', error)
    }

    // Watch for position changes
    watchPosition(
      async (position) => {
        await updateLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude ?? undefined,
          speed: position.coords.speed ?? undefined,
          heading: position.coords.heading ?? undefined,
        })
      },
      (error) => {
        console.error('Geolocation watch error:', error)
      }
    )

    // Also set interval as fallback
    locationIntervalRef.current = setInterval(async () => {
      try {
        const position = await getCurrentPosition()
        await updateLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude ?? undefined,
          speed: position.coords.speed ?? undefined,
          heading: position.coords.heading ?? undefined,
        })
      } catch (error) {
        console.error('Interval location update error:', error)
      }
    }, interval)

    return { error: null }
  }

  // Stop location sharing
  const stopLocationSharing = () => {
    cleanup()
  }

  // Update location in database
  const updateLocation = async (location: LocationUpdate) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !currentGroupIdRef.current) return { error: new Error('Not authenticated or no group') }

    const battery = await getBatteryLevel()

    const { data, error } = await supabase
      .from('locations')
      .upsert({
        user_id: user.id,
        group_id: currentGroupIdRef.current,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        altitude: location.altitude,
        speed: location.speed,
        heading: location.heading,
        battery_level: battery.level,
        is_charging: battery.charging,
        timestamp: new Date().toISOString(),
      }, {
        onConflict: 'user_id,group_id',
      })
      .select()
      .single()

    if (error) return { error }

    // Check geofence transitions
    await checkGeofenceTransitions(user.id, currentGroupIdRef.current, location.latitude, location.longitude)

    // Update local state
    const newLocation: Location = {
      ...data,
      battery_level: battery.level,
      is_charging: battery.charging,
    }
    setCurrentLocation(newLocation)
    setMemberLocations(prev => new Map(prev).set(user.id, newLocation))

    return { error: null }
  }

  // Get battery level
  const getBatteryLevel = async (): Promise<{ level: number; charging: boolean }> => {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery()
        return {
          level: Math.round(battery.level * 100),
          charging: battery.charging,
        }
      }
    } catch (e) {
      // Battery API not supported
    }
    return { level: 100, charging: false }
  }

  // Update battery in database
  const updateBattery = async (level: number, isCharging: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !currentGroupIdRef.current) return { error: new Error('Not authenticated or no group') }

    const { error } = await supabase
      .from('battery_records')
      .insert({
        user_id: user.id,
        group_id: currentGroupIdRef.current,
        level,
        is_charging: isCharging,
        timestamp: new Date().toISOString(),
      })

    return { error }
  }

  // Check geofence transitions using database function
  const checkGeofenceTransitions = async (userId: string, groupId: string, latitude: number, longitude: number) => {
    try {
      const { data, error } = await supabase.rpc('check_geofence_transition', {
        p_user_id: userId,
        p_group_id: groupId,
        p_latitude: latitude,
        p_longitude: longitude,
      })

      if (error) throw error

      // Create notifications for transitions
      if (data && data.length > 0) {
        for (const transition of data) {
          await createGeofenceNotification(transition)
        }
      }
    } catch (error) {
      console.error('Geofence check error:', error)
    }
  }

  // Create geofence notification
  const createGeofenceNotification = async (transition: { geofence_id: string; event_type: 'entry' | 'exit'; geofence_name: string }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', currentGroupIdRef.current!)

    if (!members) return

    const notifications = members
      .filter(m => m.user_id !== user.id)
      .map(member => ({
        user_id: member.user_id,
        type: transition.event_type === 'entry' ? 'geofence_entry' : 'geofence_exit',
        title: transition.event_type === 'entry' ? 'Member Entered Safe Zone' : 'Member Exited Safe Zone',
        message: `${user.user_metadata?.full_name || 'A member'} ${transition.event_type === 'entry' ? 'entered' : 'exited'} ${transition.geofence_name}`,
        data: { geofence_id: transition.geofence_id, event_type: transition.event_type },
      }))

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications)
    }
  }

  // Fetch geofences
  const fetchGeofences = async (groupId: string) => {
    const { data, error } = await supabase
      .from('geofences')
      .select('*')
      .eq('group_id', groupId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching geofences:', error)
      return
    }

    setGeofences(data || [])
  }

  // Create geofence
  const createGeofence = async (groupId: string, data: Omit<Geofence, 'id' | 'group_id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    const { data: geofence, error } = await supabase
      .from('geofences')
      .insert({
        ...data,
        group_id: groupId,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) return { error }

    setGeofences(prev => [geofence, ...prev])
    return { error: null, geofence }
  }

  // Update geofence
  const updateGeofence = async (geofenceId: string, data: Partial<Geofence>) => {
    const { error } = await supabase
      .from('geofences')
      .update(data)
      .eq('id', geofenceId)

    if (error) return { error }

    setGeofences(prev => prev.map(g => g.id === geofenceId ? { ...g, ...data } : g))
    return { error: null }
  }

  // Delete geofence
  const deleteGeofence = async (geofenceId: string) => {
    const { error } = await supabase
      .from('geofences')
      .delete()
      .eq('id', geofenceId)

    if (error) return { error }

    setGeofences(prev => prev.filter(g => g.id !== geofenceId))
    return { error: null }
  }

  // Fetch SOS alerts
  const fetchSOSAlerts = async (groupId: string) => {
    const { data, error } = await supabase
      .from('sos_alerts')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching SOS alerts:', error)
      return
    }

    setSOSAlerts(data || [])
  }

  // Create SOS alert
  const createSOS = async (data: { group_id: string; latitude: number; longitude: number; accuracy?: number; message?: string }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    const { data: alert, error } = await supabase
      .from('sos_alerts')
      .insert({
        user_id: user.id,
        group_id: data.group_id,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        message: data.message,
        status: 'active',
      })
      .select()
      .single()

    if (error) return { error }

    // Create notifications for all group members
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', data.group_id)

    if (members) {
      const notifications = members
        .filter(m => m.user_id !== user.id)
        .map(member => ({
          user_id: member.user_id,
          type: 'sos_alert' as const,
          title: '🚨 EMERGENCY SOS ALERT',
          message: `${user.user_metadata?.full_name || 'A member'} triggered an SOS alert!`,
          data: { alert_id: alert.id, latitude: data.latitude, longitude: data.longitude },
        }))

      await supabase.from('notifications').insert(notifications)
    }

    setSOSAlerts(prev => [alert, ...prev])
    return { error: null, alert }
  }

  // Resolve SOS
  const resolveSOS = async (alertId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    const { error } = await supabase
      .from('sos_alerts')
      .update({
        status: 'resolved',
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alertId)

    if (error) return { error }

    setSOSAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'resolved', resolved_by: user.id, resolved_at: new Date().toISOString() } : a))
    return { error: null }
  }

  // Cancel SOS
  const cancelSOS = async (alertId: string) => {
    const { error } = await supabase
      .from('sos_alerts')
      .update({ status: 'cancelled' })
      .eq('id', alertId)

    if (error) return { error }

    setSOSAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'cancelled' } : a))
    return { error: null }
  }

  // Subscribe to real-time location updates
  const subscribeToLocations = (groupId: string) => {
    const channel = supabase
      .channel(`locations:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'locations',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const location = payload.new as Location
            setMemberLocations(prev => new Map(prev).set(location.user_id, location))
          } else if (payload.eventType === 'DELETE') {
            setMemberLocations(prev => {
              const next = new Map(prev)
              next.delete(payload.old.user_id)
              return next
            })
          }
        }
      )
      .subscribe()

    const unsubscribe = () => {
      supabase.removeChannel(channel)
    }

    subscriptionsRef.current.push({ unsubscribe })
    return unsubscribe
  }

  // Subscribe to geofence events
  const subscribeToGeofenceEvents = (groupId: string) => {
    const channel = supabase
      .channel(`geofence_events:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'geofence_events',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const event = payload.new as GeofenceEvent
          setGeofenceEvents(prev => [event, ...prev].slice(0, 100))
        }
      )
      .subscribe()

    const unsubscribe = () => {
      supabase.removeChannel(channel)
    }

    subscriptionsRef.current.push({ unsubscribe })
    return unsubscribe
  }

  // Subscribe to SOS alerts
  const subscribeToSOSAlerts = (groupId: string) => {
    const channel = supabase
      .channel(`sos_alerts:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sos_alerts',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const alert = payload.new as SOSAlert
            setSOSAlerts(prev => [alert, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            const alert = payload.new as SOSAlert
            setSOSAlerts(prev => prev.map(a => a.id === alert.id ? alert : a))
          }
        }
      )
      .subscribe()

    const unsubscribe = () => {
      supabase.removeChannel(channel)
    }

    subscriptionsRef.current.push({ unsubscribe })
    return unsubscribe
  }

  // Listen for battery changes
  useEffect(() => {
    if ('getBattery' in navigator) {
      const handleBatteryChange = async () => {
        const battery = await (navigator as any).getBattery()
        const level = Math.round(battery.level * 100)
        const charging = battery.charging

        if (currentGroupIdRef.current && isSharing) {
          await updateBattery(level, charging)
        }
      }

      const setupBattery = async () => {
        const battery = await (navigator as any).getBattery()
        battery.addEventListener('levelchange', handleBatteryChange)
        battery.addEventListener('chargingchange', handleBatteryChange)
      }

      setupBattery()

      return () => {
        // Cleanup would need reference to battery object
      }
    }
  }, [isSharing])

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  return (
    <LocationContext.Provider value={{
      currentLocation,
      memberLocations,
      geofences,
      geofenceEvents,
      sosAlerts,
      batteryRecords,
      loading,
      isSharing,
      startLocationSharing,
      stopLocationSharing,
      updateLocation,
      fetchGeofences,
      createGeofence,
      updateGeofence,
      deleteGeofence,
      fetchSOSAlerts,
      createSOS,
      resolveSOS,
      cancelSOS,
      updateBattery,
      subscribeToLocations,
      subscribeToGeofenceEvents,
      subscribeToSOSAlerts,
    }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}