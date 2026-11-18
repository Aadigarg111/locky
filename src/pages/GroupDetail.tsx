import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGroup } from '../context/GroupContext'
import { useLocation } from '../context/LocationContext'
import { useNotification } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { CopyIcon, UsersIcon, MapPinIcon, AlertTriangleIcon, BellIcon, CogIcon, TrashIcon, EditIcon } from '../components/layout/Layout'

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>()
  const { groups, currentGroup, setCurrentGroup, fetchMembers, members, leaveGroup, deleteGroup, updateGroup } = useGroup()
  const { subscribeToLocations } = useLocation()
  const { showToast } = useNotification()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [loading, setLoading] = useState(false)

  // Find the group
  const group = groups.find(g => g.id === groupId) || currentGroup

  useEffect(() => {
    if (groupId) {
      if (!currentGroup || currentGroup.id !== groupId) {
        const foundGroup = groups.find(g => g.id === groupId)
        if (foundGroup) {
          setCurrentGroup(foundGroup)
        }
      }
      fetchMembers(groupId)
    }
  }, [groupId, groups, currentGroup, setCurrentGroup, fetchMembers])

  // Subscribe to location updates
  useEffect(() => {
    if (groupId) {
      const unsubscribe = subscribeToLocations(groupId)
      return unsubscribe
    }
  }, [groupId, subscribeToLocations])

  const handleEdit = async () => {
    if (!group) return
    setLoading(true)
    const { error } = await updateGroup(group.id, {
      name: editName,
      description: editDescription,
    })
    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('Group updated', 'success')
      setShowEditModal(false)
    }
    setLoading(false)
  }

  const handleLeave = async () => {
    if (!group) return
    setLoading(true)
    const { error } = await leaveGroup(group.id)
    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('Left group', 'success')
      navigate('/groups')
    }
    setLoading(false)
    setShowLeaveConfirm(false)
  }

  const handleDelete = async () => {
    if (!group) return
    setLoading(true)
    const { error } = await deleteGroup(group.id)
    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('Group deleted', 'success')
      navigate('/groups')
    }
    setLoading(false)
    setShowDeleteConfirm(false)
  }

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    showToast('Invite code copied!', 'success')
  }

  const isAdmin = members.find(m => m.user_id === user?.id)?.role === 'admin'

  if (!group) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <p className="text-gray-500">Loading group...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            <p className="mt-1 text-gray-600">{group.description || 'No description'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditName(group.name)
                setEditDescription(group.description || '')
                setShowEditModal(true)
              }}
              className="btn-outline"
            >
              <EditIcon className="w-4 h-4 mr-2" />
              Edit
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-outline text-danger-600 border-danger-200 hover:bg-danger-50"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </button>
            )}
            {!isAdmin && (
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="btn-outline text-danger-600 border-danger-200 hover:bg-danger-50"
              >
                Leave Group
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invite Code Card */}
      <div className="card p-5 mb-8 bg-primary-50 border-primary-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <LinkIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Invite Code</h3>
              <p className="text-sm text-gray-500">Share this code with family members to join</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <code className="font-mono text-2xl font-bold text-primary-700 tracking-widest bg-white px-4 py-2 rounded-lg border border-primary-200">{group.invite_code}</code>
            <button
              onClick={() => copyInviteCode(group.invite_code)}
              className="btn-primary"
            >
              <CopyIcon className="w-4 h-4 mr-2" />
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Link to="/map" className="card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <MapPinIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Live Map</h3>
              <p className="text-sm text-gray-500">View real-time locations</p>
            </div>
          </div>
        </Link>

        <Link to="/geofences" className="card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
              <MapPinIcon className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Geofences</h3>
              <p className="text-sm text-gray-500">Safe zones & alerts</p>
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
              <p className="text-sm text-gray-500">Emergency management</p>
            </div>
          </div>
        </Link>

        <Link to="/notifications" className="card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
              <BellIcon className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-500">All alerts & updates</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Members */}
      <div className="card">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Members ({members.length})</h2>
          {isAdmin && (
            <span className="text-sm text-gray-500">Admin: {members.filter(m => m.role === 'admin').length} • Members: {members.filter(m => m.role === 'member').length}</span>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {members.map(member => {
            const isCurrentUser = member.user_id === user?.id
            const isMemberAdmin = member.role === 'admin'

            return (
              <div key={member.id} className="p-5 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 font-medium">
                      {member.user?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {member.user?.full_name || 'Unknown'} {isCurrentUser && '(You)'}
                      </p>
                      {isMemberAdmin && (
                        <span className="badge badge-primary">Admin</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{member.user?.email}</p>
                    <p className="text-xs text-gray-400">Joined: {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}</p>
                  </div>
                </div>
                {isAdmin && !isCurrentUser && (
                  <select
                    defaultValue={member.role}
                    onChange={(e) => {
                      // Role change would need backend support
                    }}
                    className="input w-auto py-1.5 text-sm"
                    disabled
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Group Settings</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Location sharing enabled for all members</p>
            <p>• Geofence alerts sent to all members</p>
            <p>• SOS alerts notify entire group</p>
            <p>• Battery status visible to group</p>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Link to="/map" className="btn-outline w-full justify-start">View Live Map</Link>
            <Link to="/geofences" className="btn-outline w-full justify-start">Manage Geofences</Link>
            <Link to="/sos" className="btn-outline w-full justify-start">SOS Alert History</Link>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Group</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label htmlFor="editName" className="label">Group Name</label>
                <input
                  id="editName"
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label htmlFor="editDescription" className="label">Description</label>
                <textarea
                  id="editDescription"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="input min-h-[80px] resize-y"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Confirm */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowLeaveConfirm(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Leave Group?</h2>
            <p className="text-gray-500 mb-6">You will no longer receive location updates or alerts from this group. You can rejoin later with the invite code.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLeaveConfirm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleLeave} disabled={loading} className="btn-danger flex-1">
                {loading ? 'Leaving...' : 'Leave Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="w-6 h-6 text-danger-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">Delete Group?</h2>
            <p className="text-gray-500 mb-6 text-center">This will permanently delete the group and all its data (locations, geofences, alerts). This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} disabled={loading} className="btn-danger flex-1">
                {loading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}