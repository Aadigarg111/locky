import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGroup } from '../context/GroupContext'
import { useLocation } from '../context/LocationContext'
import { useNotification } from '../context/NotificationContext'
import { supabase } from '../lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { MapPinIcon, UsersIcon, AlertTriangleIcon, BatteryIcon, BellIcon, CogIcon, EditIcon, CameraIcon } from '../components/layout/Layout'

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const { groups, members } = useGroup()
  const { currentLocation, memberLocations } = useLocation()
  const { showToast } = useNotification()

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [editName, setEditName] = useState('')
  const [showNameEdit, setShowNameEdit] = useState(false)

  useEffect(() => {
    if (user?.full_name) {
      setEditName(user.full_name)
    }
  }, [user])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('File size must be less than 2MB', 'error')
        return
      }
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error')
        return
      }
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleUploadAvatar = async () => {
    if (!avatarFile || !user) return

    setUploading(true)
    try {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const { error: profileError } = await updateProfile({ avatar_url: publicUrl })

      if (profileError) throw profileError

      showToast('Profile picture updated!', 'success')
      setAvatarFile(null)
      setAvatarPreview(null)
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveName = async () => {
    if (!editName.trim() || !user) return

    const { error } = await updateProfile({ full_name: editName.trim() })
    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('Name updated successfully!', 'success')
      setShowNameEdit(false)
    }
  }

  const myGroups = groups
  const myMembershipCount = members.length
  const totalGroups = groups.length

  // Calculate stats
  const totalMembersTracked = memberLocations.size
  const activeGeofences = 0 // Would need to fetch from geofences context
  const totalSOSAlerts = 0 // Would need to fetch from SOS context

  return (
    <div className="max-w-3xl mx-auto">
      {/* Profile Header */}
      <div className="card overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-800" />
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex items-end gap-6 -mt-12">
            <div className="relative">
              <div className="w-28 h-28 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-primary-600">
                    {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
                <CameraIcon className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>
            <div className="flex-1 pt-4">
              <div className="flex items-baseline gap-3">
                {showNameEdit ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="input text-xl font-semibold"
                      autoFocus
                    />
                    <button onClick={handleSaveName} className="btn-primary" disabled={uploading}>
                      Save
                    </button>
                    <button onClick={() => { setShowNameEdit(false); setEditName(user?.full_name || '') }} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900">{user?.full_name}</h1>
                    <button
                      onClick={() => setShowNameEdit(true)}
                      className="btn-outline text-sm"
                    >
                      <EditIcon className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                  </>
                )}
              </div>
              <p className="mt-1 text-gray-500">{user?.email}</p>
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  {totalGroups} Group{totalGroups !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <UsersIcon className="w-4 h-4" />
                  {totalMembersTracked} Member{totalMembersTracked !== 1 ? 's' : ''} Tracked
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Groups</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{totalGroups}</p>
            </div>
            <UsersIcon className="w-12 h-12 text-primary-100 text-primary-600" />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Members Tracked</p>
              <p className="mt-1 text-3xl font-bold text-success-600">{totalMembersTracked}</p>
            </div>
            <MapPinIcon className="w-12 h-12 text-success-100 text-success-600" />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Alerts</p>
              <p className="mt-1 text-3xl font-bold text-danger-600">{totalSOSAlerts}</p>
            </div>
            <AlertTriangleIcon className="w-12 h-12 text-danger-100 text-danger-600" />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Geofences</p>
              <p className="mt-1 text-3xl font-bold text-primary-600">{activeGeofences}</p>
            </div>
            <MapPinIcon className="w-12 h-12 text-primary-100 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Current Location Status */}
      <div className="card p-5 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              currentLocation ? 'bg-success-100' : 'bg-gray-100'
            }`}>
              <MapPinIcon className={`w-6 h-6 ${currentLocation ? 'text-success-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Live Location</h3>
              <p className="text-sm text-gray-500">
                {currentLocation
                  ? `Active • Updated ${formatDistanceToNow(new Date(currentLocation.timestamp), { addSuffix: true })}`
                  : 'Not sharing location'}
              </p>
            </div>
          </div>
          {currentLocation && (
            <div className="text-right text-sm">
              <p className="font-mono text-gray-900">
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </p>
              <p className="text-gray-500">
                Accuracy: {currentLocation.accuracy ? `${Math.round(currentLocation.accuracy)}m` : 'N/A'}
                {currentLocation.battery_level !== null && currentLocation.battery_level !== undefined && (
                  <> • Battery: {currentLocation.battery_level}% {currentLocation.is_charging ? '⚡' : ''}</>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Group Memberships */}
      <div className="card mb-8">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Your Groups ({myGroups.length})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {myGroups.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <UsersIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>You haven't joined any groups yet</p>
            </div>
          ) : (
            myGroups.map(group => {
              const groupMembers = members.filter(m => m.group_id === group.id)
              const isAdmin = groupMembers.find(m => m.user_id === user?.id)?.role === 'admin'

              return (
                <div key={group.id} className="p-5 hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <UsersIcon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{group.name}</h3>
                        {isAdmin && <span className="badge badge-primary">Admin</span>}
                      </div>
                      <p className="text-sm text-gray-500">{groupMembers.length} members • Invite: {group.invite_code}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>Joined {formatDistanceToNow(new Date(groupMembers.find(m => m.user_id === user?.id)?.joined_at || group.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Account Info */}
      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
        </div>
        <div className="p-5 space-y-4 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-gray-500">User ID</p>
              <p className="font-mono text-gray-900">{user?.id}</p>
            </div>
            <div>
              <p className="text-gray-500">Email Verified</p>
              <p className="font-medium text-gray-900 flex items-center gap-1">
                <span className="w-2 h-2 bg-success-500 rounded-full" />
                Yes
              </p>
            </div>
            <div>
              <p className="text-gray-500">Account Created</p>
              <p className="font-medium text-gray-900">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Last Sign In</p>
              <p className="font-medium text-gray-900">
                {user?.last_sign_in_at ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true }) : 'Current session'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}