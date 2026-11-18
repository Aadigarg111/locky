import React, { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, LayerGroup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useLocation } from '../context/LocationContext'
import { useGroup } from '../context/GroupContext'
import { useAuth } from '../context/AuthContext'
import { formatDistanceToNow } from 'date-fns'

// Fix for Leaflet default marker icons
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

// Custom marker component for group members
function MemberMarker({ location, user, isCurrentUser, isSOS, isLowBattery, onClick }: {
  location: { latitude: number; longitude: number }
  user: { id: string; full_name: string; email: string }
  isCurrentUser: boolean
  isSOS?: boolean
  isLowBattery?: boolean
  onClick: () => void
}) {
  const position = [location.latitude, location.longitude] as [number, number]

  return (
    <Marker position={position} onClick={onClick}>
      <div
        className={`custom-marker ${isCurrentUser ? 'bg-primary-600' : isSOS ? 'bg-danger-500 animate-pulse-sos' : isLowBattery ? 'bg-warning-500' : 'bg-success-600'}`}
        style={{
          width: isCurrentUser ? '36px' : '32px',
          height: isCurrentUser ? '36px' : '32px',
          fontSize: isCurrentUser ? '14px' : '12px',
          zIndex: isCurrentUser ? 1000 : isSOS ? 900 : 800,
        }}
        title={user.full_name}
      >
        {user.full_name?.charAt(0).toUpperCase()}
      </div>
      <Popup offset={[0, -16]}>
        <div className="p-1 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center`}>
              <span className="text-primary-700 font-medium text-sm">
                {user.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user.full_name}</p>
              <p className="text-xs text-gray-500">{isCurrentUser ? 'You' : 'Group Member'}</p>
            </div>
          </div>
          <div className="space-y-1 text-xs text-gray-600">
            <p><span className="font-medium">Lat:</span> {location.latitude.toFixed(6)}</p>
            <p><span className="font-medium">Lng:</span> {location.longitude.toFixed(6)}</p>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

// Geofence circle component
function GeofenceCircle({ geofence }: { geofence: any }) {
  if (geofence.type === 'circle' && geofence.center_lat && geofence.center_lng && geofence.radius_meters) {
    return (
      <Circle
        center={[geofence.center_lat, geofence.center_lng]}
        radius={geofence.radius_meters}
        pathOptions={{
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          weight: 2,
          dashArray: '5, 5',
        }}
      >
        <Popup>
          <div className="p-1">
            <p className="font-semibold text-primary-700">{geofence.name}</p>
            <p className="text-sm text-gray-600">Radius: {Math.round(geofence.radius_meters)}m</p>
            {geofence.description && <p className="text-sm text-gray-500 mt-1">{geofence.description}</p>}
          </div>
        </Popup>
      </Circle>
    )
  }
  return null
}

// Locate control for finding user
function LocateControl() {
  const map = useMap()
  const { currentLocation, startLocationSharing, currentGroup } = useLocation()
  const { user } = useAuth()

  const handleLocate = useCallback(async () => {
    if (currentGroup && !currentLocation) {
      await startLocationSharing(currentGroup.id)
    }
    if (currentLocation) {
      map.flyTo([currentLocation.latitude, currentLocation.longitude], 16)
    }
  }, [currentGroup, currentLocation, startLocationSharing, map])

  return (
    <div className="leaflet-control leaflet-bar" style={{ marginTop: '8px' }}>
      <button
        onClick={handleLocate}
        className="leaflet-control-zoom-in"
        style={{
          width: '36px',
          height: '36px',
          backgroundColor: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Find my location"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
        </svg>
      </button>
    </div>
  )
}

// Map component with proper height
function MapComponent({ center, zoom, children }: { center: [number, number]; zoom: number; children: React.ReactNode }) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="map-container"
      zoomControl={false}
      scrollWheelZoom={true}
      attributionControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      {children}
      <LocateControl />
    </MapContainer>
  )
}

export default function MapView() {
  const { currentGroup, groups } = useGroup()
  const { memberLocations, currentLocation, geofences, isSharing, startLocationSharing } = useLocation()
  const { user } = useAuth()
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.2090]) // Default to Delhi
  const [mapZoom, setMapZoom] = useState(12)
  const [selectedMember, setSelectedMember] = useState<{ id: string; location: any } | null>(null)

  // Update map center when current location changes
  useEffect(() => {
    if (currentLocation) {
      setMapCenter([currentLocation.latitude, currentLocation.longitude])
    } else if (memberLocations.size > 0) {
      const first = memberLocations.values().next().value
      if (first) {
        setMapCenter([first.latitude, first.longitude])
      }
    } else if (currentGroup) {
      // Center on group's last known location or default
      setMapCenter([28.6139, 77.2090])
    }
  }, [currentLocation, memberLocations, currentGroup])

  // Auto-start location sharing when entering map view
  useEffect(() => {
    if (currentGroup && !isSharing && !currentLocation) {
      startLocationSharing(currentGroup.id)
    }
  }, [currentGroup, isSharing, currentLocation, startLocationSharing])

  const handleMemberClick = (memberId: string, location: any) => {
    setSelectedMember({ id: memberId, location })
    setMapCenter([location.latitude, location.longitude])
    setMapZoom(16)
  }

  const onlineMembers = Array.from(memberLocations.values()).filter(
    loc => new Date(loc.timestamp).getTime() > Date.now() - 5 * 60 * 1000
  )

  const getBounds = () => {
    const locations = Array.from(memberLocations.values())
    if (locations.length === 0) return null

    let minLat = locations[0].latitude
    let maxLat = locations[0].latitude
    let minLng = locations[0].longitude
    let maxLng = locations[0].longitude

    locations.forEach(loc => {
      minLat = Math.min(minLat, loc.latitude)
      maxLat = Math.max(maxLat, loc.latitude)
      minLng = Math.min(minLng, loc.longitude)
      maxLng = Math.max(maxLng, loc.longitude)
    })

    return [[minLat, minLng], [maxLat, maxLng]] as [[number, number], [number, number]]
  }

  if (!currentGroup) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Group</h2>
          <p className="text-gray-500 mb-6">Choose a group from the sidebar to view the live map</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map(group => (
              <button
                key={group.id}
                onClick={() => window.location.href = `/groups/${group.id}`}
                className="card p-5 hover:shadow-md transition-shadow text-left"
              >
                <h3 className="font-semibold text-gray-900">{group.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Tap to open map</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const bounds = getBounds()

  return (
    <div className="h-[calc(100vh-200px)] min-h-[500px]">
      <MapComponent center={mapCenter} zoom={mapZoom}>
        {/* Geofences */}
        {geofences.map(geofence => (
          <GeofenceCircle key={geofence.id} geofence={geofence} />
        ))}

        {/* Member Markers */}
        {Array.from(memberLocations.entries()).map(([memberId, location]) => {
          const memberUser = location.user || { id: memberId, full_name: 'Unknown', email: '' }
          const isCurrentUser = memberId === user?.id
          const isOnline = new Date(location.timestamp).getTime() > Date.now() - 5 * 60 * 1000
          const isLowBattery = location.battery_level !== null && location.battery_level !== undefined && location.battery_level <= 20 && !location.is_charging

          // Check if this member has active SOS
          const isSOS = false // Would need to check SOS alerts context

          if (!isOnline) return null

          return (
            <MemberMarker
              key={memberId}
              location={{ latitude: location.latitude, longitude: location.longitude }}
              user={memberUser}
              isCurrentUser={isCurrentUser}
              isSOS={isSOS}
              isLowBattery={isLowBattery}
              onClick={() => handleMemberClick(memberId, location)}
            />
          )
        })}

        {/* Current user accuracy circle */}
        {currentLocation && currentLocation.accuracy && (
          <Circle
            center={[currentLocation.latitude, currentLocation.longitude]}
            radius={currentLocation.accuracy}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
              weight: 1,
              dashArray: '2, 4',
            }}
          />
        )}
      </MapComponent>

      {/* Bottom info panel */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 md:bottom-4 z-20">
        <div className="card p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Map Legend</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-gray-700">You (Current User)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-success-600 rounded-full flex items-center justify-center text-white text-xs font-bold">M</div>
              <span className="text-gray-700">Group Member (Online)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">M</div>
              <span className="text-gray-700">Group Member (Offline)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-danger-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">!</div>
              <span className="text-gray-700">SOS Alert Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-warning-500 rounded-full flex items-center justify-center text-white text-xs font-bold">⚡</div>
              <span className="text-gray-700">Low Battery (< 20%)</span>
            </div>
            <div className="flex items-center gap-2 border-t pt-2">
              <div className="w-8 h-8 border-2 border-dashed border-primary-500 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 border border-primary-500 rounded-full" style={{ borderWidth: '2px' }}></div>
              </div>
              <span className="text-gray-700">Geofence Zone</span>
            </div>
            <div className="flex items-center gap-2 border-t pt-2">
              <div className="w-8 h-8 border-2 border-dashed border-blue-500 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 border border-blue-500 rounded-full" style={{ borderWidth: '2px', opacity: 0.3 }}></div>
              </div>
              <span className="text-gray-700">Location Accuracy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Member detail panel when selected */}
      {selectedMember && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 md:bottom-72 z-20">
          <div className="card p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Member Details</h3>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Name:</span> {selectedMember.location.user?.full_name || 'Unknown'}</p>
              <p><span className="font-medium">Status:</span> <span className="badge badge-success">Online</span></p>
              <p><span className="font-medium">Location:</span> {selectedMember.location.latitude.toFixed(6)}, {selectedMember.location.longitude.toFixed(6)}</p>
              <p><span className="font-medium">Accuracy:</span> {selectedMember.location.accuracy ? `${Math.round(selectedMember.location.accuracy)}m` : 'N/A'}</p>
              <p><span className="font-medium">Battery:</span> {selectedMember.location.battery_level !== null && selectedMember.location.battery_level !== undefined ? `${selectedMember.location.battery_level}%` : 'N/A'} {selectedMember.location.is_charging ? '⚡' : ''}</p>
              <p><span className="font-medium">Last Update:</span> {formatDistanceToNow(new Date(selectedMember.location.timestamp), { addSuffix: true })}</p>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="btn-primary flex-1 text-sm">Navigate to Member</button>
              <button className="btn-outline flex-1 text-sm" onClick={() => setSelectedMember(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}