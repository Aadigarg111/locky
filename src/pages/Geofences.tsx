import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGroup } from '../context/GroupContext'
import { useLocation } from '../context/LocationContext'
import { useNotification } from '../context/NotificationContext'
import { PlusIcon, MapPinIcon, TrashIcon, EditIcon } from '../components/layout/Layout'

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

// Map picker for selecting geofence center
function MapPicker({ center, onSelect, radius }: { center: [number, number]; onSelect: (lat: number, lng: number) => void; radius?: number }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, 14)
  }, [center, map])

  const handleClick = (e: any) => {
    onSelect(e.latlng.lat, e.latlng.lng)
  }

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {radius && (
        <Circle
          center={center}
          radius={radius}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 5',
          }}
        />
      )}
      <Marker position={center} draggable={true} onDragend={e => onSelect(e.target.getLatLng().lat, e.target.getLatLng().lng)}>
        <div className="w-8 h-8 bg-primary-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/></svg>
        </div>
      </Marker>
    </>
  )
}

function GeofenceMap({ geofence, memberLocations }: { geofence: any; memberLocations: Map<string, any> }) {
  const map = useMap()

  useEffect(() => {
    if (geofence?.center_lat && geofence?.center_lng) {
      map.setView([geofence.center_lat, geofence.center_lng], 14)
    }
  }, [geofence, map])

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {geofence?.type === 'circle' && geofence.center_lat && geofence.center_lng && geofence.radius_meters && (
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
            </div>
          </Popup>
        </Circle>
      )}
      {Array.from(memberLocations.entries()).map(([memberId, location]) => (
        <Marker key={memberId} position={[location.latitude, location.longitude]}>
          <div className="w-6 h-6 bg-success-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">{location.user?.full_name?.charAt(0).toUpperCase() || 'M'}</span>
          </div>
          <Popup>
            <div className="p-1">
              <p className="font-medium">{location.user?.full_name || 'Member'}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

export default function Geofences() {
  const { groupId } = useParams<{ groupId: string }>()
  const { currentGroup } = useGroup()
  const { geofences, fetchGeofences, createGeofence, updateGeofence, deleteGeofence, subscribeToGeofenceEvents } = useLocation()
  const { memberLocations } = useLocation()
  const { showToast } = useNotification()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingGeofence, setEditingGeofence] = useState<any>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.2090])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'circle' as 'circle' | 'polygon',
    radius_meters: 500,
  })
  const [loading, setLoading] = useState(false)
  const [previewCenter, setPreviewCenter] = useState<[number, number] | null>(null)

  useEffect(() => {
    if (groupId) {
      fetchGeofences(groupId)
      const unsubscribe = subscribeToGeofenceEvents(groupId)
      return unsubscribe
    }
  }, [groupId, fetchGeofences, subscribeToGeofenceEvents])

  // Default map center
  useEffect(() => {
    if (currentGroup && memberLocations.size > 0) {
      const first = memberLocations.values().next().value
      if (first) {
        setMapCenter([first.latitude, first.longitude])
      }
    }
  }, [currentGroup, memberLocations])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupId || !formData.name.trim()) return

    setLoading(true)
    const geofenceData: any = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      type: formData.type,
    }

    if (formData.type === 'circle') {
      if (!previewCenter) {
        showToast('Please select a center point on the map', 'error')
        setLoading(false)
        return
      }
      geofenceData.center_lat = previewCenter[0]
      geofenceData.center_lng = previewCenter[1]
      geofenceData.radius_meters = formData.radius_meters
    }

    const { error, geofence } = await createGeofence(groupId, geofenceData)

    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('Geofence created successfully!', 'success')
      setShowCreateModal(false)
      resetForm()
    }
    setLoading(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGeofence || !formData.name.trim()) return

    setLoading(true)
    const geofenceData: any = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    }

    if (formData.type === 'circle' && previewCenter) {
      geofenceData.center_lat = previewCenter[0]
      geofenceData.center_lng = previewCenter[1]
      geofenceData.radius_meters = formData.radius_meters
    }

    const { error } = await updateGeofence(editingGeofence.id, geofenceData)

    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('Geofence updated', 'success')
      setShowEditModal(false)
      setEditingGeofence(null)
      resetForm()
    }
    setLoading(false)
  }

  const handleDelete = async (geofenceId: string) => {
    if (!confirm('Delete this geofence?')) return

    const { error } = await deleteGeofence(geofenceId)
    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('Geofence deleted', 'success')
    }
  }

  const startEditing = (geofence: any) => {
    setEditingGeofence(geofence)
    setFormData({
      name: geofence.name,
      description: geofence.description || '',
      type: geofence.type,
      radius_meters: geofence.radius_meters || 500,
    })
    if (geofence.center_lat && geofence.center_lng) {
      setPreviewCenter([geofence.center_lat, geofence.center_lng])
      setMapCenter([geofence.center_lat, geofence.center_lng])
    }
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'circle',
      radius_meters: 500,
    })
    setPreviewCenter(null)
    setEditingGeofence(null)
  }

  const handleMapClick = (lat: number, lng: number) => {
    setPreviewCenter([lat, lng])
    setMapCenter([lat, lng])
  }

  if (!currentGroup) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <p className="text-gray-500">Select a group to manage geofences</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Geofences</h1>
            <p className="mt-1 text-gray-600">Create safe zones and get entry/exit alerts for {currentGroup.name}</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowCreateModal(true)
            }}
            className="btn-primary"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Geofence
          </button>
        </div>
      </div>

      {/* Map Preview */}
      <div className="card overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Map Preview</h3>
        </div>
        <div className="h-80">
          <MapContainer className="h-full w-full" zoomControl={false}>
            <GeofenceMap geofence={editingGeofence || geofences[0]} memberLocations={memberLocations} />
          </MapContainer>
        </div>
      </div>

      {/* Geofence List */}
      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Your Geofences ({geofences.length})</h2>
        </div>

        {geofences.length === 0 ? (
          <div className="p-8 text-center">
            <MapPinIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No geofences yet</h3>
            <p className="text-gray-500 mb-6">Create safe zones like Home, School, Workplace to get alerts when members enter or exit</p>
            <button
              onClick={() => {
                resetForm()
                setShowCreateModal(true)
              }}
              className="btn-primary"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Your First Geofence
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {geofences.map(gf => (
              <div key={gf.id} className="p-5 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <MapPinIcon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{gf.name}</h3>
                    <p className="text-sm text-gray-500">
                      {gf.type === 'circle'
                        ? `Circle • Radius: ${Math.round(gf.radius_meters || 0)}m`
                        : 'Polygon'}
                      {gf.description && ` • ${gf.description}`}
                    </p>
                    <p className="text-xs text-gray-400">Created {new Date(gf.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEditing(gf)}
                    className="btn-outline text-sm"
                  >
                    <EditIcon className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(gf.id)}
                    className="btn-outline text-sm text-danger-600 border-danger-200 hover:bg-danger-50"
                  >
                    <TrashIcon className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Events */}
        <div className="border-t border-gray-100">
          <div className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <p className="text-sm text-gray-500">Geofence entry/exit events will appear here in real-time</p>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => {
          setShowCreateModal(false)
          setShowEditModal(false)
          resetForm()
        }}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">
                {showCreateModal ? 'Create Geofence' : 'Edit Geofence'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setShowEditModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <form onSubmit={showCreateModal ? handleCreate : handleUpdate} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label htmlFor="gfName" className="label">Geofence Name</label>
                <input
                  id="gfName"
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input"
                  placeholder="e.g., Home, School, Workplace"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="gfDescription" className="label">Description (optional)</label>
                <textarea
                  id="gfDescription"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input min-h-[80px] resize-y"
                  placeholder="Describe this safe zone..."
                  rows={3}
                />
              </div>

              <div>
                <label className="label">Geofence Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gfType"
                      value="circle"
                      checked={formData.type === 'circle'}
                      onChange={e => setFormData(prev => ({ ...prev, type: 'circle' }))}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Circular Zone</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gfType"
                      value="polygon"
                      checked={formData.type === 'polygon'}
                      onChange={e => setFormData(prev => ({ ...prev, type: 'polygon' }))}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Polygon (Coming Soon)</span>
                  </label>
                </div>
              </div>

              {formData.type === 'circle' && (
                <>
                  <div>
                    <label htmlFor="gfRadius" className="label">Radius (meters)</label>
                    <input
                      id="gfRadius"
                      type="number"
                      min="50"
                      max="5000"
                      step="50"
                      value={formData.radius_meters}
                      onChange={e => setFormData(prev => ({ ...prev, radius_meters: parseInt(e.target.value) || 500 }))}
                      className="input"
                    />
                    <p className="mt-1 text-xs text-gray-500">Minimum 50m, Maximum 5000m</p>
                  </div>

                  <div>
                    <label className="label">Center Location</label>
                    <div className="mb-3">
                      <MapContainer
                        center={previewCenter || mapCenter}
                        zoom={14}
                        className="h-64 w-full rounded-lg"
                        zoomControl={false}
                      >
                        <MapPicker
                          center={previewCenter || mapCenter}
                          onSelect={handleMapClick}
                          radius={formData.radius_meters}
                        />
                      </MapContainer>
                    </div>
                    {previewCenter ? (
                      <div className="p-3 bg-success-50 rounded-lg border border-success-200">
                        <p className="text-sm font-medium text-success-800">Center Selected</p>
                        <p className="text-xs text-success-700 font-mono">
                          {previewCenter[0].toFixed(6)}, {previewCenter[1].toFixed(6)}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-warning-50 rounded-lg border border-warning-200">
                        <p className="text-sm font-medium text-warning-800">Click on map to select center point</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setShowEditModal(false)
                    resetForm()
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.name.trim() || (formData.type === 'circle' && !previewCenter)}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Saving...' : showCreateModal ? 'Create Geofence' : 'Update Geofence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}