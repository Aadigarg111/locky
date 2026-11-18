import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGroup } from '../context/GroupContext'
import { useLocation } from '../context/LocationContext'
import { useNotification } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { AlertTriangleIcon, MapPinIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '../components/layout/Layout'

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

function SOSMap({ alert, memberLocations }: { alert: any; memberLocations: Map<string, any> }) {
  const map = useMap()

  useEffect(() => {
    if (alert?.latitude && alert?.longitude) {
      map.setView([alert.latitude, alert.longitude], 15)
    }
  }, [alert, map])

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {alert && (
        <>
          <Circle
            center={[alert.latitude, alert.longitude]}
            radius={alert.accuracy || 50}
            pathOptions={{
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: 0.15,
              weight: 2,
            }}
          >
            <Popup>
              <div className="p-1">
                <p className="font-semibold text-danger-700">SOS Location</p>
                <p className="text-sm text-gray-600">Accuracy: {alert.accuracy ? `${Math.round(alert.accuracy)}m` : 'N/A'}</p>
              </div>
            </Popup>
          </Circle>
          <Marker position={[alert.latitude, alert.longitude]}>
            <div className="w-10 h-10 bg-danger-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center animate-pulse">
              <AlertTriangleIcon className="w-5 h-5 text-white" />
            </div>
            <Popup>
              <div className="p-1">
                <p className="font-semibold text-danger-700">🚨 SOS ALERT</p>
                <p className="text-sm text-gray-600">Triggered by {alert.user?.full_name || 'Member'}</p>
                <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}</p>
              </div>
            </Popup>
          </Marker>
        </>
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

export default function SOSAlerts() {
  const { groupId } = useParams<{ groupId: string }>()
  const { currentGroup } = useGroup()
  const { sosAlerts, fetchSOSAlerts, createSOS, resolveSOS, cancelSOS, subscribeToSOSAlerts, memberLocations, currentLocation, startLocationSharing } = useLocation()
  const { showToast } = useNotification()
  const { user } = useAuth()

  const [showSOSModal, setShowSOSModal] = useState(false)
  const [sosMessage, setSosMessage] = useState('')
  const [triggering, setTriggering] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<any>(null)

  useEffect(() => {
    if (groupId) {
      fetchSOSAlerts(groupId)
      const unsubscribe = subscribeToSOSAlerts(groupId)
      return unsubscribe
    }
  }, [groupId, fetchSOSAlerts, subscribeToSOSAlerts])

  const handleTriggerSOS = async () => {
    if (!currentGroup || !currentLocation) {
      showToast('Location not available. Please enable location sharing first.', 'error')
      return
    }

    setTriggering(true)
    const { error, alert } = await createSOS({
      group_id: currentGroup.id,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      accuracy: currentLocation.accuracy,
      message: sosMessage.trim() || undefined,
    })

    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('SOS ALERT TRIGGERED! Emergency services and group notified.', 'error')
      setShowSOSModal(false)
      setSosMessage('')
      if (alert) {
        setSelectedAlert(alert)
      }
    }
    setTriggering(false)
  }

  const handleResolve = async (alertId: string) => {
    const { error } = await resolveSOS(alertId)
    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('SOS alert resolved', 'success')
      setSelectedAlert(null)
    }
  }

  const handleCancel = async (alertId: string) => {
    if (!confirm('Cancel this SOS alert?')) return
    const { error } = await cancelSOS(alertId)
    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('SOS alert cancelled', 'success')
      setSelectedAlert(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-danger animate-pulse">🚨 ACTIVE</span>
      case 'resolved':
        return <span className="badge badge-success">✓ Resolved</span>
      case 'cancelled':
        return <span className="badge badge-gray">✗ Cancelled</span>
      default:
        return <span className="badge badge-gray">{status}</span>
    }
  }

  const activeAlerts = sosAlerts.filter(a => a.status === 'active')
  const resolvedAlerts = sosAlerts.filter(a => a.status === 'resolved')
  const cancelledAlerts = sosAlerts.filter(a => a.status === 'cancelled')

  if (!currentGroup) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <p className="text-gray-500">Select a group to view SOS alerts</p>
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
            <h1 className="text-2xl font-bold text-gray-900">SOS Alerts</h1>
            <p className="mt-1 text-gray-600">Emergency alerts for {currentGroup.name}</p>
          </div>
          <button
            onClick={() => {
              if (!currentLocation) {
                showToast('Please enable location sharing first from Dashboard', 'warning')
                startLocationSharing(currentGroup!.id)
                return
              }
              setShowSOSModal(true)
            }}
            className="btn-danger animate-pulse-sos"
            disabled={triggering}
          >
            <AlertTriangleIcon className="w-4 h-4 mr-2" />
            {triggering ? 'Triggering...' : 'TRIGGER SOS'}
          </button>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Emergency Alerts ({activeAlerts.length})</h2>
          <div className="space-y-4">
            {activeAlerts.map(alert => (
              <div
                key={alert.id}
                className="card border-danger-200 bg-danger-50 p-5"
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-danger-100 rounded-xl flex items-center justify-center animate-pulse">
                      <AlertTriangleIcon className="w-6 h-6 text-danger-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{alert.user?.full_name || 'Unknown'}</p>
                        {getStatusBadge(alert.status)}
                      </div>
                      <p className="text-sm text-gray-500">
                        Triggered {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                        {alert.message && ` • "${alert.message}"`}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">
                        Lat: {alert.latitude.toFixed(6)}, Lng: {alert.longitude.toFixed(6)}
                        {alert.accuracy && ` • Acc: ${Math.round(alert.accuracy)}m`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.user_id === user?.id ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCancel(alert.id)
                        }}
                        className="btn-outline text-danger-600 border-danger-200 hover:bg-danger-50 text-sm"
                      >
                        <XCircleIcon className="w-4 h-4 mr-1" />
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleResolve(alert.id)
                        }}
                        className="btn-success text-sm"
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert History */}
      <div className="card">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Alert History</h2>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <CheckCircleIcon className="w-4 h-4 text-success-600" />
              {resolvedAlerts.length} Resolved
            </span>
            <span className="flex items-center gap-1">
              <XCircleIcon className="w-4 h-4 text-gray-400" />
              {cancelledAlerts.length} Cancelled
            </span>
          </div>
        </div>

        {(resolvedAlerts.length + cancelledAlerts.length) === 0 ? (
          <div className="p-8 text-center">
            <ClockIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alert history</h3>
            <p className="text-gray-500">SOS alerts will appear here after being resolved or cancelled</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {[...resolvedAlerts, ...cancelledAlerts]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map(alert => (
                <div key={alert.id} className="p-5 hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      alert.status === 'resolved' ? 'bg-success-100' : 'bg-gray-100'
                    }`}>
                      {alert.status === 'resolved' ? (
                        <CheckCircleIcon className="w-5 h-5 text-success-600" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{alert.user?.full_name || 'Unknown'}</p>
                        {getStatusBadge(alert.status)}
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                        {alert.resolved_at && ` • Resolved ${formatDistanceToNow(new Date(alert.resolved_at), { addSuffix: true })}`}
                        {alert.message && ` • "${alert.message}"`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-mono">
                      Lat: {alert.latitude.toFixed(6)}, Lng: {alert.longitude.toFixed(6)}
                    </p>
                    {alert.resolved_by && alert.user?.id === alert.resolved_by && (
                      <p className="text-xs text-gray-400">Resolved by you</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Selected Alert Map */}
        {selectedAlert && (
          <div className="border-t border-gray-100">
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Alert Location</h3>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="h-64 rounded-lg overflow-hidden">
                <MapContainer className="h-full w-full" zoomControl={false}>
                  <SOSMap alert={selectedAlert} memberLocations={memberLocations} />
                </MapContainer>
              </div>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                <p><span className="font-medium">Triggered by:</span> {selectedAlert.user?.full_name || 'Unknown'}</p>
                <p><span className="font-medium">Time:</span> {formatDistanceToNow(new Date(selectedAlert.created_at), { addSuffix: true })}</p>
                <p><span className="font-medium">Location:</span> {selectedAlert.latitude.toFixed(6)}, {selectedAlert.longitude.toFixed(6)}</p>
                {selectedAlert.accuracy && <p><span className="font-medium">Accuracy:</span> {Math.round(selectedAlert.accuracy)}m</p>}
                {selectedAlert.message && <p><span className="font-medium">Message:</span> "{selectedAlert.message}"</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SOS Trigger Modal */}
      {showSOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowSOSModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangleIcon className="w-8 h-8 text-danger-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">Trigger SOS Alert?</h2>
            <p className="text-gray-500 text-center mb-6">
              This will immediately notify all group members with your current location.
              Only use in genuine emergencies.
            </p>

            <form onSubmit={handleTriggerSOS} className="space-y-4">
              <div>
                <label htmlFor="sosMessage" className="label">Message (optional)</label>
                <textarea
                  id="sosMessage"
                  value={sosMessage}
                  onChange={e => setSosMessage(e.target.value)}
                  className="input min-h-[80px] resize-y"
                  placeholder="Any additional info for responders..."
                  rows={3}
                />
              </div>

              {currentLocation && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="font-medium text-gray-900">Your Location Will Be Sent</p>
                  <p className="text-gray-500 font-mono">
                    {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  </p>
                  {currentLocation.accuracy && (
                    <p className="text-gray-500">Accuracy: {Math.round(currentLocation.accuracy)}m</p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSOSModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={triggering || !currentLocation}
                  className="btn-danger flex-1 animate-pulse-sos"
                >
                  {triggering ? 'Triggering...' : '🚨 TRIGGER SOS ALERT 🚨'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}