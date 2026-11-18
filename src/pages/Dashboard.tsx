import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGroup } from '../context/GroupContext'
import { useLocation } from '../context/LocationContext'
import { useNotification } from '../context/NotificationContext'
import { formatDistanceToNow } from 'date-fns'

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function BatteryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.761L3 14.07V17h13v-5.93l8.164-8.165a2 2 0 00-2.828-2.828l-.793.793-4.162 4.163-4.163-4.163a2 2 0 00-2.828 0z" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { groups, currentGroup, setCurrentGroup, fetchGroups } = useGroup()
  const { currentLocation, memberLocations, isSharing, startLocationSharing, stopLocationSharing, subscribeToLocations } = useLocation()
  const { unreadCount } = useNotification()
  const navigate = useNavigate()

  React.useEffect(() => {
    if (currentGroup) {
      const unsubscribe = subscribeToLocations(currentGroup.id)
      return unsubscribe
    }
  }, [currentGroup, subscribeToLocations])

  const handleStartSharing = async () => {
    if (!currentGroup) return
    await startLocationSharing(currentGroup.id)
  }

  const handleStopSharing = () => {
    stopLocationSharing()
  }

  const onlineMembers = Array.from(memberLocations.values()).filter(
    loc => new Date(loc.timestamp).getTime() > Date.now() - 5 * 60 * 1000
  ).length

  const getBatteryColor = (level?: number) => {
    if (level === undefined || level === null) return 'text-gray-400'
    if (level <= 20) return 'text-danger-600'
    if (level <= 50) return 'text-warning-600'
    return 'text-success-600'
  }

  const getBatteryIcon = (level?: number, charging?: boolean) => {
    if (charging) return '⚡'
    if (level === undefined || level === null) return '❓'
    if (level <= 20) return '🔴'
    if (level <= 50) return '🟡'
    return '🟢'
  }

  if (!currentGroup) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.full_name?.split(' ')[0]}!</h1>
          <p className="mt-1 text-gray-600">Select a group to start tracking your family's safety</p>
        </div>

        {groups.length === 0 ? (
          <div className="card p-8 text-center">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
            <p className="text-gray-500 mb-6">Create your first family group or join an existing one</p>
            <Link to="/groups" className="btn-primary inline-flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              Create Group
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Groups</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => {
                      setCurrentGroup(group)
                      navigate('/dashboard')
                    }}
                    className="card p-5 hover:shadow-md transition-shadow text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{group.name}</h3>
                        {group.description && (
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{group.description}</p>
                        )}
                        <p className="mt-2 text-xs text-gray-400">Invite code: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{group.invite_code}</span></p>
                      </div>
                      <MapPinIcon className="w-10 h-10 text-primary-100 text-primary-600 rounded-lg p-2" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <Link to="/groups" className="btn-outline inline-flex items-center gap-2">
                <PlusIcon className="w-4 h-4" />
                Create New Group
              </Link>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentGroup.name}</h1>
            <p className="mt-1 text-gray-600">
              {currentGroup.description || 'Family safety group'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/map" className="btn-primary">
              <MapPinIcon className="w-4 h-4 mr-2" />
              Open Live Map
            </Link>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Group Members</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{memberLocations.size}</p>
            </div>
            <UsersIcon className="w-12 h-12 text-primary-100 text-primary-600" />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Online Now</p>
              <p className="mt-1 text-3xl font-bold text-success-600">{onlineMembers}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🟢</span>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Location Sharing</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{isSharing ? 'Active' : 'Paused'}</p>
            </div>
            <MapPinIcon className={`w-12 h-12 ${isSharing ? 'text-success-100 text-success-600' : 'text-gray-100 text-gray-400'}`} />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Unread Alerts</p>
              <p className="mt-1 text-3xl font-bold text-danger-600">{unreadCount}</p>
            </div>
            <AlertTriangleIcon className="w-12 h-12 text-danger-100 text-danger-600" />
          </div>
        </div>
      </div>

      {/* Location Sharing Controls */}
      <div className="card p-5 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSharing ? 'bg-success-100' : 'bg-gray-100'}`}>
              <MapPinIcon className={`w-6 h-6 ${isSharing ? 'text-success-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Live Location Sharing</h3>
              <p className="text-sm text-gray-500">
                {isSharing
                  ? 'Your location is being shared with the group'
                  : 'Share your real-time location with group members'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isSharing ? (
              <button
                onClick={handleStopSharing}
                className="btn-danger"
              >
                Stop Sharing
              </button>
            ) : (
              <button
                onClick={handleStartSharing}
                className="btn-success"
                disabled={!currentGroup}
              >
                Start Sharing
              </button>
            )}
            <Link to="/map" className="btn-outline">
              View Map
            </Link>
          </div>
        </div>

        {isSharing && currentLocation && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Latitude</p>
                <p className="font-mono text-sm">{currentLocation.latitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Longitude</p>
                <p className="font-mono text-sm">{currentLocation.longitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Accuracy</p>
                <p className="font-mono text-sm">{currentLocation.accuracy ? `${Math.round(currentLocation.accuracy)}m` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Update</p>
                <p className="font-mono text-sm">{formatDistanceToNow(new Date(currentLocation.timestamp), { addSuffix: true })}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Member Locations */}
      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Group Members</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {memberLocations.size === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <UsersIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No location data yet. Members need to start sharing their location.</p>
            </div>
          ) : (
            Array.from(memberLocations.entries()).map(([userId, location]) => {
              const isCurrentUser = userId === user?.id
              const isOnline = new Date(location.timestamp).getTime() > Date.now() - 5 * 60 * 1000
              const batteryLevel = location.battery_level
              const isCharging = location.is_charging

              return (
                <div
                  key={userId}
                  className="p-5 hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-700 font-medium">
                        {location.user?.full_name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {location.user?.full_name || 'Unknown'} {isCurrentUser && '(You)'}
                        </p>
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success-500' : 'bg-gray-400'}`} />
                      </div>
                      <p className="text-sm text-gray-500">
                        {isOnline
                          ? `Last seen ${formatDistanceToNow(new Date(location.timestamp), { addSuffix: true })}`
                          : `Last seen ${formatDistanceToNow(new Date(location.timestamp))}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      <BatteryIcon className="w-4 h-4" />
                      <span className={getBatteryColor(batteryLevel)}>
                        {getBatteryIcon(batteryLevel, isCharging)} {batteryLevel !== null && batteryLevel !== undefined ? `${batteryLevel}%` : 'N/A'}
                      </span>
                    </div>
                    {isOnline && (
                      <span className="badge badge-success">Online</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link to="/geofences" className="card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <MapPinIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Geofences</h3>
              <p className="text-sm text-gray-500">Create safe zones & get alerts</p>
            </div>
          </div>
        </Link>

        <Link to="/sos" className="card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-danger-100 rounded-xl flex items-center justify-center">
              <AlertTriangleIcon className="w-6 h-6 text-danger-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">SOS Alerts</h3>
              <p className="text-sm text-gray-500">Emergency alerts & history</p>
            </div>
          </div>
        </Link>

        <Link to="/notifications" className="card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🔔</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-500">View all alerts & updates</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}