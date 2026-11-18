export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Group {
  id: string
  name: string
  description?: string
  invite_code: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  user?: User
}

export interface Location {
  id: string
  user_id: string
  group_id: string
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
  speed?: number
  heading?: number
  battery_level?: number
  is_charging?: boolean
  timestamp: string
  created_at: string
}

export interface Geofence {
  id: string
  group_id: string
  name: string
  description?: string
  type: 'circle' | 'polygon'
  center_lat?: number
  center_lng?: number
  radius_meters?: number
  polygon_coords?: { lat: number; lng: number }[]
  created_by: string
  is_active: boolean
  created_at: string
  updated_at: string
  assigned_member_ids?: string[]
}

export interface GeofenceEvent {
  id: string
  geofence_id: string
  user_id: string
  group_id: string
  event_type: 'entry' | 'exit'
  latitude: number
  longitude: number
  created_at: string
  user?: User
  geofence?: Geofence
}

export interface SOSAlert {
  id: string
  user_id: string
  group_id: string
  latitude: number
  longitude: number
  accuracy?: number
  message?: string
  status: 'active' | 'resolved' | 'cancelled'
  resolved_by?: string
  resolved_at?: string
  created_at: string
  user?: User
}

export interface Notification {
  id: string
  user_id: string
  type: 'geofence_entry' | 'geofence_exit' | 'sos_alert' | 'sos_resolved' | 'low_battery' | 'member_joined' | 'member_left'
  title: string
  message: string
  data?: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export interface BatteryRecord {
  id: string
  user_id: string
  group_id: string
  level: number
  is_charging: boolean
  timestamp: string
  created_at: string
}

// Auth types
export interface SignUpData {
  email: string
  password: string
  full_name: string
}

export interface SignInData {
  email: string
  password: string
}

// Group types
export interface CreateGroupData {
  name: string
  description?: string
}

export interface JoinGroupData {
  invite_code: string
}

// Location types
export interface LocationUpdate {
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
  speed?: number
  heading?: number
  battery_level?: number
  is_charging?: boolean
}

// Geofence types
export interface CreateGeofenceData {
  group_id: string
  name: string
  description?: string
  type: 'circle' | 'polygon'
  center_lat?: number
  center_lng?: number
  radius_meters?: number
  polygon_coords?: { lat: number; lng: number }[]
  assigned_member_ids?: string[]
}

// SOS types
export interface CreateSOSData {
  group_id: string
  latitude: number
  longitude: number
  accuracy?: number
  message?: string
}

// Map types
export interface MapMarker {
  id: string
  user: User
  location: Location
  isCurrentUser: boolean
  isSOS?: boolean
  isLowBattery?: boolean
}

// Settings types
export interface UserSettings {
  share_location: boolean
  location_update_interval: number // in seconds
  battery_alert_threshold: number // percentage
  notifications_enabled: boolean
  push_notifications_enabled: boolean
  email_notifications_enabled: boolean
}