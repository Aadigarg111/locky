import React, { useEffect } from 'react'
import { useNotification } from '../context/NotificationContext'
import { formatDistanceToNow } from 'date-fns'
import { CheckIcon, BellIcon, MapPinIcon, AlertTriangleIcon, BatteryIcon, UsersIcon, XIcon } from '../components/layout/Layout'

const notificationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  geofence_entry: MapPinIcon,
  geofence_exit: MapPinIcon,
  sos_alert: AlertTriangleIcon,
  sos_resolved: CheckIcon,
  low_battery: BatteryIcon,
  member_joined: UsersIcon,
  member_left: UsersIcon,
}

const notificationColors: Record<string, string> = {
  geofence_entry: 'text-primary-600 bg-primary-100',
  geofence_exit: 'text-warning-600 bg-warning-100',
  sos_alert: 'text-danger-600 bg-danger-100',
  sos_resolved: 'text-success-600 bg-success-100',
  low_battery: 'text-warning-600 bg-warning-100',
  member_joined: 'text-primary-600 bg-primary-100',
  member_left: 'text-gray-600 bg-gray-100',
}

const notificationTitles: Record<string, string> = {
  geofence_entry: 'Safe Zone Entry',
  geofence_exit: 'Safe Zone Exit',
  sos_alert: 'SOS Alert',
  sos_resolved: 'SOS Resolved',
  low_battery: 'Low Battery',
  member_joined: 'Member Joined',
  member_left: 'Member Left',
}

export default function Notifications() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotification()

  useEffect(() => {
    // Notifications are fetched automatically via context
  }, [])

  const groupedNotifications = notifications.reduce((acc, notification) => {
    const date = new Date(notification.created_at).toDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(notification)
    return acc
  }, {} as Record<string, typeof notifications>)

  const sortedDates = Object.keys(groupedNotifications).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  const IconComponent = notificationIcons.geofence_entry

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-gray-600">Stay updated with all alerts and activities</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="btn-primary"
          >
            <CheckIcon className="w-4 h-4 mr-2" />
            Mark All Read ({unreadCount})
          </button>
        )}
      </div>

      {loading ? (
        <div className="card p-8 text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
          <p className="text-gray-500">You'll receive alerts for geofence events, SOS alerts, and group activities here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date} className="card">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-medium text-gray-700">
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {groupedNotifications[date].map(notification => {
                  const Icon = notificationIcons[notification.type] || BellIcon
                  const colorClass = notificationColors[notification.type] || 'text-gray-600 bg-gray-100'
                  const title = notificationTitles[notification.type] || 'Notification'

                  return (
                    <div
                      key={notification.id}
                      className={`p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50/50' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass} flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-gray-900">{title}</p>
                            <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                            {notification.data && (
                              <p className="text-xs text-gray-400 mt-1 font-mono">
                                {JSON.stringify(notification.data).slice(0, 100)}
                              </p>
                            )}
                          </div>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            aria-label="Mark as read"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-gray-400 hover:text-danger-600 rounded-lg hover:bg-gray-100"
                          aria-label="Delete notification"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}