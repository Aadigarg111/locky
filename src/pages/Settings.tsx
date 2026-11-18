import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { supabase } from '../lib/supabase'
import { BellIcon, BatteryIcon, MapPinIcon, ShieldIcon, MoonIcon, SunIcon, GlobeIcon } from '../components/layout/Layout'

export default function Settings() {
  const { user, updateProfile } = useAuth()
  const { showToast } = useNotification()

  const [settings, setSettings] = useState({
    share_location: true,
    location_update_interval: 30,
    battery_alert_threshold: 20,
    notifications_enabled: true,
    push_notifications_enabled: true,
    email_notifications_enabled: false,
    dark_mode: false,
    language: 'en',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'notifications' | 'appearance'>('general')

  useEffect(() => {
    if (user) {
      fetchSettings()
    }
  }, [user])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching settings:', error)
      } else if (data) {
        setSettings(prev => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
        })

      if (error) throw error

      showToast('Settings saved successfully!', 'success')
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-8 text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-600">Manage your preferences and account settings</p>
      </div>

      {/* Tab Navigation */}
      <div className="card mb-6">
        <div className="border-b border-gray-100">
          <nav className="flex gap-8 px-5" aria-label="Settings tabs">
            {[
              { id: 'general', label: 'General', icon: GlobeIcon },
              { id: 'privacy', label: 'Privacy & Location', icon: MapPinIcon },
              { id: 'notifications', label: 'Notifications', icon: BellIcon },
              { id: 'appearance', label: 'Appearance', icon: MoonIcon },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="card">
        <div className="p-5">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fullName" className="label">Full Name</label>
                    <input
                      id="fullName"
                      type="text"
                      value={user?.full_name || ''}
                      onChange={e => updateProfile({ full_name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="label">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      className="input bg-gray-50"
                      disabled
                    />
                    <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">App Preferences</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">Language</label>
                    <select
                      value={settings.language}
                      onChange={e => updateSetting('language', e.target.value)}
                      className="input"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <button onClick={saveSettings} disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Privacy & Location Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Sharing</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Share My Location</p>
                      <p className="text-sm text-gray-500">Allow group members to see your real-time location</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={settings.share_location}
                      onClick={() => updateSetting('share_location', !settings.share_location)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        settings.share_location ? 'bg-primary-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                          settings.share_location ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="label">Location Update Interval</label>
                    <select
                      value={settings.location_update_interval}
                      onChange={e => updateSetting('location_update_interval', parseInt(e.target.value))}
                      className="input w-auto"
                    >
                      <option value={10}>Every 10 seconds (High accuracy)</option>
                      <option value={30}>Every 30 seconds (Balanced)</option>
                      <option value={60}>Every 1 minute (Battery saver)</option>
                      <option value={300}>Every 5 minutes (Low power)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">How often your location is sent to the server</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Battery Alerts</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">Low Battery Threshold</label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={settings.battery_alert_threshold}
                      onChange={e => updateSetting('battery_alert_threshold', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>5%</span>
                      <span className="font-medium text-gray-900">{settings.battery_alert_threshold}%</span>
                      <span>50%</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Get notified when your battery drops below this level</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Data & Privacy</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>• Location data is encrypted in transit and at rest</p>
                  <p>• Only group members can see your location</p>
                  <p>• Location history is stored for 30 days</p>
                  <p>• You can delete your account and all data anytime</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <button onClick={saveSettings} disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  {[
                    { key: 'notifications_enabled', label: 'Enable Notifications', description: 'Receive all types of notifications' },
                    { key: 'push_notifications_enabled', label: 'Push Notifications', description: 'Browser push notifications for alerts' },
                    { key: 'email_notifications_enabled', label: 'Email Notifications', description: 'Email alerts for important events' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={settings[item.key as keyof typeof settings]}
                        onClick={() => updateSetting(item.key as keyof typeof settings, !settings[item.key as keyof typeof settings])}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                          settings[item.key as keyof typeof settings] ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                            settings[item.key as keyof typeof settings] ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Types</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-danger-500 rounded-full"></span> SOS Alerts - Always enabled for safety</p>
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-warning-500 rounded-full"></span> Geofence Exit Alerts</p>
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-primary-500 rounded-full"></span> Geofence Entry Alerts</p>
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-warning-500 rounded-full"></span> Low Battery Alerts</p>
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-success-500 rounded-full"></span> SOS Resolved Alerts</p>
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-gray-400 rounded-full"></span> Member Join/Leave</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <button onClick={saveSettings} disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => updateSetting('dark_mode', false)}
                    className={`p-4 rounded-xl border-2 transition-colors text-left ${
                      !settings.dark_mode
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                        <SunIcon className="w-5 h-5 text-warning-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Light Mode</p>
                        <p className="text-sm text-gray-500">Bright interface</p>
                      </div>
                    </div>
                    {!settings.dark_mode && (
                      <div className="ml-auto w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                        <CheckIcon className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => updateSetting('dark_mode', true)}
                    className={`p-4 rounded-xl border-2 transition-colors text-left ${
                      settings.dark_mode
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                        <MoonIcon className="w-5 h-5 text-gray-300" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Dark Mode</p>
                        <p className="text-sm text-gray-500">Dark interface (Coming Soon)</p>
                      </div>
                    </div>
                    {settings.dark_mode && (
                      <div className="ml-auto w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                        <CheckIcon className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <button onClick={saveSettings} disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-8 card border-danger-200">
        <div className="p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldIcon className="w-5 h-5 text-danger-600" />
            Danger Zone
          </h3>
          <p className="text-gray-600 mb-4">These actions are irreversible. Please proceed with caution.</p>
          <div className="flex gap-3">
            <button className="btn-outline text-danger-600 border-danger-200 hover:bg-danger-50">
              Export My Data
            </button>
            <button className="btn-outline text-danger-600 border-danger-200 hover:bg-danger-50">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}