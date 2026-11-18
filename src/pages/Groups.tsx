import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGroup } from '../context/GroupContext'
import { useNotification } from '../context/NotificationContext'
import { PlusIcon, CopyIcon, CheckIcon, UsersIcon, LinkIcon } from '../components/layout/Layout'

export default function Groups() {
  const { groups, createGroup, joinGroup, deleteGroup, fetchGroups, setCurrentGroup } = useGroup()
  const { showToast } = useNotification()
  const navigate = useNavigate()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createName.trim()) return

    setLoading(true)
    const { error, group } = await createGroup({
      name: createName.trim(),
      description: createDescription.trim() || undefined,
    })

    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('Group created successfully!', 'success')
      setShowCreateModal(false)
      setCreateName('')
      setCreateDescription('')
      if (group) {
        setCurrentGroup(group)
        navigate('/dashboard')
      }
    }
    setLoading(false)
  }

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return

    setLoading(true)
    const { error } = await joinGroup({ invite_code: joinCode.trim().toUpperCase() })

    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('Joined group successfully!', 'success')
      setShowJoinModal(false)
      setJoinCode('')
      fetchGroups()
    }
    setLoading(false)
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return

    const { error } = await deleteGroup(groupId)
    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('Group deleted', 'success')
    }
  }

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    showToast('Invite code copied!', 'success')
  }

  const handleSelectGroup = (group: any) => {
    setCurrentGroup(group)
    navigate('/dashboard')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <p className="mt-1 text-gray-600">Manage your family and safety groups</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowJoinModal(true)}
            className="btn-outline"
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            Join Group
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Group
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="card p-12 text-center">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
          <p className="text-gray-500 mb-6">Create your first family group or join an existing one using an invite code</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowJoinModal(true)}
              className="btn-outline"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Join Group
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Group
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map(group => (
            <div key={group.id} className="card hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{group.name}</h3>
                    {group.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{group.description}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <UsersIcon className="w-6 h-6 text-primary-600" />
                  </div>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Invite Code</span>
                    <div className="flex items-center gap-2">
                      <code className="font-mono bg-white px-2 py-1 rounded border border-gray-200 text-primary-700">{group.invite_code}</code>
                      <button
                        onClick={() => copyInviteCode(group.invite_code)}
                        className="p-1.5 text-gray-400 hover:text-gray-600"
                        aria-label="Copy invite code"
                      >
                        <CopyIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectGroup(group)}
                    className="btn-primary flex-1"
                  >
                    Open Group
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="btn-outline text-danger-600 border-danger-200 hover:bg-danger-50"
                    aria-label="Delete group"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Create New Group</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label htmlFor="createName" className="label">Group Name</label>
                <input
                  id="createName"
                  type="text"
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  className="input"
                  placeholder="e.g., Family, Travel Group, Elder Care"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="createDescription" className="label">Description (optional)</label>
                <textarea
                  id="createDescription"
                  value={createDescription}
                  onChange={e => setCreateDescription(e.target.value)}
                  className="input min-h-[80px] resize-y"
                  placeholder="Describe your group..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading || !createName.trim()} className="btn-primary flex-1">
                  {loading ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowJoinModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Join a Group</h2>
              <button onClick={() => setShowJoinModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div>
                <label htmlFor="joinCode" className="label">Invite Code</label>
                <input
                  id="joinCode"
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  className="input font-mono text-center tracking-widest"
                  placeholder="ABC123"
                  required
                  autoFocus
                  maxLength={6}
                />
                <p className="mt-1 text-xs text-gray-500">Enter the 6-character invite code shared by the group admin</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowJoinModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading || !joinCode.trim()} className="btn-primary flex-1">
                  {loading ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}