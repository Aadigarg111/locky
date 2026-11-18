# Family Safety - Minor Project (Group 41)

**B.Tech Information Technology, 7th Semester (2026-27)**
**ADGIPS, Guru Gobind Singh Indraprastha University**

## Project Title
Family/Group Real-Time Location & Safety Application with Geofencing and SOS Alerts

## Group Members (Group 41)
- Aadi (11015603123)
- Mohit Kumar Pandey (12115603123)
- Nitin Yadav (11715603123)
- Debasis Chattaraj (13115603123)

## Supervisor
Ms. Neha Sharma, Department of Information Technology

---

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Maps**: Leaflet.js + React-Leaflet
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **State Management**: React Context + Zustand
- **PWA**: Vite PWA Plugin + Workbox
- **Icons**: Custom SVG icons

---

## Features Implemented

### Core Features (Must-Have)
✅ User Authentication (Signup/Login with Supabase Auth)
✅ Group Management (Create/Join groups with invite codes)
✅ Real-time Location Sharing (Supabase Realtime + Leaflet Map)
✅ Geofencing (Circular zones with entry/exit alerts)
✅ SOS Emergency Alerts (Broadcast location to group)

### Additional Features
✅ Battery Status Monitoring (with low battery alerts)
✅ Push/Browser Notifications (for SOS and geofence alerts)
✅ Location History/Timeline (past locations view)
✅ Responsive Mobile UI (PWA-ready, installable)
✅ Offline Support (Service Worker caching)

---

## Project Structure

```
minor-project/
├── public/
│   ├── manifest.webmanifest    # PWA manifest
│   ├── sw.js                   # Service Worker
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── auth/               # Auth components
│   │   ├── common/             # Shared components (Toast, Loading)
│   │   ├── geofence/           # Geofence components
│   │   ├── groups/             # Group components
│   │   ├── layout/             # Layout components (Layout, AuthLayout)
│   │   ├── map/                # Map components
│   │   ├── notifications/      # Notification components
│   │   └── sos/                # SOS components
│   ├── context/
│   │   ├── AuthContext.tsx     # Authentication state
│   │   ├── GroupContext.tsx    # Group management state
│   │   ├── LocationContext.tsx # Location & geofence state
│   │   └── NotificationContext.tsx # Notification state
│   ├── hooks/                  # Custom React hooks
│   ├── lib/
│   │   └── supabase.ts         # Supabase client
│   ├── pages/
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── Geofences.tsx       # Geofence management
│   │   ├── Groups.tsx          # Group list & creation
│   │   ├── GroupDetail.tsx     # Group details & members
│   │   ├── Login.tsx           # Login page
│   │   ├── MapView.tsx         # Live map view
│   │   ├── Notifications.tsx   # Notification center
│   │   ├── Profile.tsx         # User profile
│   │   ├── Register.tsx        # Registration page
│   │   ├── Settings.tsx        # App settings
│   │   └── SOSAlerts.tsx       # SOS alert management
│   ├── types/
│   │   ├── index.ts            # TypeScript interfaces
│   │   └── database.ts         # Supabase database types
│   ├── utils/
│   │   └── pwa.ts              # PWA utilities
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles + Tailwind
├── supabase/
│   └── schema.sql              # Database schema + RLS policies
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── index.html
```

---

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### 2. Supabase Setup
1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor and run the contents of `supabase/schema.sql`
3. Enable Realtime for tables: locations, geofence_events, sos_alerts, notifications, battery_records
4. Create storage bucket `avatars` (public) for profile pictures
5. Get your Project URL and Anon Key from Settings > API

### 3. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Development Server
```bash
npm run dev
```
Open http://localhost:5173

### 6. Build for Production
```bash
npm run build
```
Output in `dist/` folder

### 7. Preview Production Build
```bash
npm run preview
```

---

## Database Schema Overview

The schema includes 10 main tables with Row Level Security:
- **profiles** - Extended user profiles
- **groups** - Family/safety groups
- **group_members** - Group membership with roles
- **locations** - Real-time location updates
- **geofences** - Safe zone definitions
- **geofence_events** - Entry/exit event logs
- **sos_alerts** - Emergency alerts
- **notifications** - User notifications
- **battery_records** - Battery level history
- **user_settings** - User preferences

Key features:
- Automatic profile/settings creation on signup
- Invite code generation (6-char alphanumeric)
- Geofence transition detection via PostGIS
- Realtime subscriptions for live updates
- Comprehensive RLS policies for data isolation

---

## API Endpoints (Supabase)

All operations use Supabase client directly:
- Auth: `supabase.auth.signUp()`, `signInWithPassword()`, `signOut()`
- Database: `supabase.from('table').select/insert/update/delete()`
- Realtime: `supabase.channel('table').on('postgres_changes', ...)`
- Storage: `supabase.storage.from('avatars').upload/getPublicUrl()`
- RPC: `supabase.rpc('function_name', { params })`

---

## PWA Features

- **Installable**: Add to home screen on mobile/desktop
- **Offline**: Service Worker caches static assets and map tiles
- **Background Sync**: Queues location updates when offline
- **Push Notifications**: SOS and geofence alerts via browser push
- **Responsive**: Mobile-first design with safe area insets

---

## Testing Checklist

### Authentication
- [ ] User registration with email/password
- [ ] User login/logout
- [ ] Session persistence across refresh
- [ ] Profile creation on signup

### Groups
- [ ] Create group with name/description
- [ ] Generate unique invite code
- [ ] Join group via invite code
- [ ] Leave group
- [ ] Delete group (admin only)
- [ ] Member list with roles

### Location Sharing
- [ ] Request location permission
- [ ] Start/stop location sharing
- [ ] Real-time updates on map (Supabase Realtime)
- [ ] Battery level reporting
- [ ] Accuracy circle display

### Map
- [ ] Leaflet map loads with OSM tiles
- [ ] Member markers with names
- [ ] Current user highlighted
- [ ] Geofence circles displayed
- [ ] Locate me button
- [ ] Fit bounds to all members

### Geofencing
- [ ] Create circular geofence (name, radius, center)
- [ ] Map-based center selection
- [ ] Entry/exit detection
- [ ] Real-time alerts to group
- [ ] Geofence list with edit/delete

### SOS Alerts
- [ ] Trigger SOS with current location
- [ ] Optional message
- [ ] Broadcast to all group members
- [ ] Alert appears in real-time
- [ ] Resolve/cancel SOS
- [ ] Alert history

### Notifications
- [ ] Real-time notification delivery
- [ ] Unread count badge
- [ ] Mark as read / mark all read
- [ ] Delete notification
- [ ] Toast popups for critical alerts

### PWA
- [ ] Install prompt appears
- [ ] Works offline (cached assets)
- [ ] Service worker registered
- [ ] Manifest valid

---

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Netlify
1. Connect repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables

### Manual
```bash
npm run build
# Upload dist/ folder to any static hosting
```

---

## License
This is a minor project for academic purposes at ADGIPS, GGSIPU.

---

## Acknowledgments
- Supabase for backend infrastructure
- Leaflet.js for mapping
- OpenStreetMap for map tiles
- Tailwind CSS for styling
- Vite for build tooling