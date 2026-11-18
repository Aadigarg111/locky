export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          invite_code: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          invite_code: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          invite_code?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: "admin" | "member"
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: "admin" | "member"
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: "admin" | "member"
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      locations: {
        Row: {
          id: string
          user_id: string
          group_id: string
          latitude: number
          longitude: number
          accuracy: number | null
          altitude: number | null
          speed: number | null
          heading: number | null
          battery_level: number | null
          is_charging: boolean | null
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          group_id: string
          latitude: number
          longitude: number
          accuracy?: number | null
          altitude?: number | null
          speed?: number | null
          heading?: number | null
          battery_level?: number | null
          is_charging?: boolean | null
          timestamp?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          group_id?: string
          latitude?: number
          longitude?: number
          accuracy?: number | null
          altitude?: number | null
          speed?: number | null
          heading?: number | null
          battery_level?: number | null
          is_charging?: boolean | null
          timestamp?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      geofences: {
        Row: {
          id: string
          group_id: string
          name: string
          description: string | null
          type: "circle" | "polygon"
          center_lat: number | null
          center_lng: number | null
          radius_meters: number | null
          polygon_coords: Json | null
          created_by: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          description?: string | null
          type: "circle" | "polygon"
          center_lat?: number | null
          center_lng?: number | null
          radius_meters?: number | null
          polygon_coords?: Json | null
          created_by: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          name?: string
          description?: string | null
          type?: "circle" | "polygon"
          center_lat?: number | null
          center_lng?: number | null
          radius_meters?: number | null
          polygon_coords?: Json | null
          created_by?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "geofences_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geofences_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      geofence_events: {
        Row: {
          id: string
          geofence_id: string
          user_id: string
          group_id: string
          event_type: "entry" | "exit"
          latitude: number
          longitude: number
          created_at: string
        }
        Insert: {
          id?: string
          geofence_id: string
          user_id: string
          group_id: string
          event_type: "entry" | "exit"
          latitude: number
          longitude: number
          created_at?: string
        }
        Update: {
          id?: string
          geofence_id?: string
          user_id?: string
          group_id?: string
          event_type?: "entry" | "exit"
          latitude?: number
          longitude?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "geofence_events_geofence_id_fkey"
            columns: ["geofence_id"]
            isOneToOne: false
            referencedRelation: "geofences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geofence_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geofence_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      sos_alerts: {
        Row: {
          id: string
          user_id: string
          group_id: string
          latitude: number
          longitude: number
          accuracy: number | null
          message: string | null
          status: "active" | "resolved" | "cancelled"
          resolved_by: string | null
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          group_id: string
          latitude: number
          longitude: number
          accuracy?: number | null
          message?: string | null
          status?: "active" | "resolved" | "cancelled"
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          group_id?: string
          latitude?: number
          longitude?: number
          accuracy?: number | null
          message?: string | null
          status?: "active" | "resolved" | "cancelled"
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sos_alerts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sos_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: "geofence_entry" | "geofence_exit" | "sos_alert" | "sos_resolved" | "low_battery" | "member_joined" | "member_left"
          title: string
          message: string
          data: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: "geofence_entry" | "geofence_exit" | "sos_alert" | "sos_resolved" | "low_battery" | "member_joined" | "member_left"
          title: string
          message: string
          data?: Json | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: "geofence_entry" | "geofence_exit" | "sos_alert" | "sos_resolved" | "low_battery" | "member_joined" | "member_left"
          title?: string
          message?: string
          data?: Json | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      battery_records: {
        Row: {
          id: string
          user_id: string
          group_id: string
          level: number
          is_charging: boolean
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          group_id: string
          level: number
          is_charging: boolean
          timestamp?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          group_id?: string
          level?: number
          is_charging?: boolean
          timestamp?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "battery_records_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battery_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          share_location: boolean
          location_update_interval: number
          battery_alert_threshold: number
          notifications_enabled: boolean
          push_notifications_enabled: boolean
          email_notifications_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          share_location?: boolean
          location_update_interval?: number
          battery_alert_threshold?: number
          notifications_enabled?: boolean
          push_notifications_enabled?: boolean
          email_notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          share_location?: boolean
          location_update_interval?: number
          battery_alert_threshold?: number
          notifications_enabled?: boolean
          push_notifications_enabled?: boolean
          email_notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invite_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      check_geofence_transition: {
        Args: {
          p_user_id: string
          p_group_id: string
          p_latitude: number
          p_longitude: number
        }
        Returns: {
          geofence_id: string
          event_type: "entry" | "exit"
          geofence_name: string
        }[]
      }
      get_group_members_with_location: {
        Args: {
          p_group_id: string
        }
        Returns: {
          user_id: string
          full_name: string
          email: string
          latitude: number
          longitude: number
          battery_level: number | null
          is_charging: boolean | null
          last_update: string
          is_online: boolean
        }[]
      }
    }
    Enums: {
      member_role: "admin" | "member"
      geofence_type: "circle" | "polygon"
      geofence_event_type: "entry" | "exit"
      sos_status: "active" | "resolved" | "cancelled"
      notification_type: "geofence_entry" | "geofence_exit" | "sos_alert" | "sos_resolved" | "low_battery" | "member_joined" | "member_left"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}