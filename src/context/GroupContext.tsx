import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Group, GroupMember, CreateGroupData, JoinGroupData } from '../types'

interface GroupContextType {
  currentGroup: Group | null
  groups: Group[]
  members: GroupMember[]
  loading: boolean
  createGroup: (data: CreateGroupData) => Promise<{ error: Error | null; group?: Group }>
  joinGroup: (data: JoinGroupData) => Promise<{ error: Error | null }>
  leaveGroup: (groupId: string) => Promise<{ error: Error | null }>
  deleteGroup: (groupId: string) => Promise<{ error: Error | null }>
  updateGroup: (groupId: string, data: Partial<Group>) => Promise<{ error: Error | null }>
  setCurrentGroup: (group: Group | null) => void
  fetchGroups: () => Promise<void>
  fetchMembers: (groupId: string) => Promise<void>
  generateInviteCode: () => Promise<string>
}

const GroupContext = createContext<GroupContextType | undefined>(undefined)

export function GroupProvider({ children }: { children: ReactNode }) {
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(false)

  const fetchGroups = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_members!inner(user_id)
      `)
      .eq('group_members.user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching groups:', error)
      return
    }

    setGroups(data || [])
  }

  const fetchMembers = async (groupId: string) => {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true })

    if (error) {
      console.error('Error fetching members:', error)
      return
    }

    setMembers(data || [])
  }

  const createGroup = async (data: CreateGroupData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    // Generate invite code
    const { data: inviteCode } = await supabase.rpc('generate_invite_code')

    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        name: data.name,
        description: data.description,
        invite_code: inviteCode,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) return { error }

    // Add creator as admin member
    await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'admin',
      })

    // Create default settings for user
    await supabase
      .from('user_settings')
      .insert({
        user_id: user.id,
        share_location: true,
        location_update_interval: 30,
        battery_alert_threshold: 20,
        notifications_enabled: true,
        push_notifications_enabled: true,
        email_notifications_enabled: false,
      })
      .select()

    setGroups(prev => [group, ...prev])
    return { error: null, group }
  }

  const joinGroup = async (data: JoinGroupData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    // Find group by invite code
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', data.invite_code.toUpperCase())
      .single()

    if (groupError || !group) {
      return { error: new Error('Invalid invite code') }
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return { error: new Error('Already a member of this group') }
    }

    // Add as member
    const { error } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'member',
      })

    if (error) return { error }

    // Create default settings
    await supabase
      .from('user_settings')
      .insert({
        user_id: user.id,
        share_location: true,
        location_update_interval: 30,
        battery_alert_threshold: 20,
        notifications_enabled: true,
        push_notifications_enabled: true,
        email_notifications_enabled: false,
      })

    setGroups(prev => [...prev, group])
    return { error: null }
  }

  const leaveGroup = async (groupId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id)

    if (error) return { error }

    setGroups(prev => prev.filter(g => g.id !== groupId))
    if (currentGroup?.id === groupId) {
      setCurrentGroup(null)
    }
    return { error: null }
  }

  const deleteGroup = async (groupId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    // Check if user is admin
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return { error: new Error('Only group admin can delete the group') }
    }

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId)

    if (error) return { error }

    setGroups(prev => prev.filter(g => g.id !== groupId))
    if (currentGroup?.id === groupId) {
      setCurrentGroup(null)
    }
    return { error: null }
  }

  const updateGroup = async (groupId: string, data: Partial<Group>) => {
    const { error } = await supabase
      .from('groups')
      .update(data)
      .eq('id', groupId)

    if (error) return { error }

    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...data } : g))
    if (currentGroup?.id === groupId) {
      setCurrentGroup(prev => prev ? { ...prev, ...data } : null)
    }
    return { error: null }
  }

  const generateInviteCode = async () => {
    const { data } = await supabase.rpc('generate_invite_code')
    return data || ''
  }

  // Fetch groups on mount
  useEffect(() => {
    fetchGroups()
  }, [])

  // Fetch members when current group changes
  useEffect(() => {
    if (currentGroup) {
      fetchMembers(currentGroup.id)
    } else {
      setMembers([])
    }
  }, [currentGroup])

  return (
    <GroupContext.Provider value={{
      currentGroup,
      groups,
      members,
      loading,
      createGroup,
      joinGroup,
      leaveGroup,
      deleteGroup,
      updateGroup,
      setCurrentGroup,
      fetchGroups,
      fetchMembers,
      generateInviteCode,
    }}>
      {children}
    </GroupContext.Provider>
  )
}

export function useGroup() {
  const context = useContext(GroupContext)
  if (!context) {
    throw new Error('useGroup must be used within a GroupProvider')
  }
  return context
}