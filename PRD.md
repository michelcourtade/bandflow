PROMPT START

Role: You are a Senior Full Stack Engineer and Product Manager specialized in building SaaS PWAs.
Task: Build the "BandFlow" application based on the detailed PRD below.
Constraint: Follow the Tech Stack and Data Model strictly.
🎸 BANDFLOW — FINAL PRODUCT REQUIREMENTS DOCUMENT
1. TECHNICAL ARCHITECTURE (STRICT)

To ensure rapid MVP delivery and code stability, use this specific stack:

    Framework: Next.js 14+ (App Router, TypeScript).

    Styling: Tailwind CSS + shadcn/ui (component library) + Lucide React (icons).

    Database & Auth: Supabase (PostgreSQL).

    State Management: TanStack Query (React Query) for server state, Zustand for local state.

    Form Management: React Hook Form + Zod (validation).

    Deployment Target: Vercel.

2. PRODUCT VISION

BandFlow is a collaborative SaaS PWA for music bands to centralize repertoire, rehearsals, concerts, and setlists. It replaces spreadsheets with a specialized tool focusing on organization and structure.

Key Value Proposition:

    Centralized Repository: One place for all songs and versions.

    Status Tracking: Know exactly which songs are "Ready Live" vs "To Learn".

    Setlist Builder: Drag-and-drop creation of concert lists.

3. DATABASE SCHEMA (SUPABASE / POSTGRES)

Use UUID for all IDs. Enable Row Level Security (RLS).
3.1 Users & Auth

Managed via Supabase Auth.

    Table: public.profiles (Syncs with auth.users via trigger)

        id (uuid, pk, references auth.users)

        email (text)

        full_name (text)

        avatar_url (text)

3.2 Groups

    Table: groups

        id (uuid, pk, default gen_random_uuid())

        name (text, not null)

        created_by (uuid, references profiles.id)

        created_at (timestamptz)

3.3 Memberships

    Table: memberships

        id (uuid, pk)

        user_id (uuid, references profiles.id)

        group_id (uuid, references groups.id on delete cascade)

        role (text check: 'admin', 'member')

        Constraint: Unique (user_id, group_id)

3.4 Songs (Global Library)

    Table: songs

        id (uuid, pk)

        title (text, not null)

        artist (text)

        default_bpm (int)

        default_key (text)

        created_by (uuid, references profiles.id)

        is_public (bool, default false)

3.5 Group Songs (Contextual)

    Table: group_songs

        id (uuid, pk)

        group_id (uuid, references groups.id on delete cascade)

        song_id (uuid, references songs.id)

        status (text check: 'proposal', 'to_learn', 'rehearsing', 'ready_live')

        bpm_override (int)

        key_override (text)

        lead_vocal (uuid, references profiles.id)

        note (text)

        Constraint: Unique (group_id, song_id)

3.6 Concerts

    Table: concerts

        id (uuid, pk)

        group_id (uuid, references groups.id on delete cascade)

        name (text)

        date (timestamptz)

        venue (text)

3.7 Setlists

    Table: setlists

        id (uuid, pk)

        group_id (uuid, references groups.id on delete cascade)

        concert_id (uuid, references concerts.id, nullable)

        name (text)

3.8 Setlist Items

    Table: setlist_items

        id (uuid, pk)

        setlist_id (uuid, references setlists.id on delete cascade)

        group_song_id (uuid, references group_songs.id)

        position (int, not null)

4. CORE FEATURES & USER FLOWS
4.1 Onboarding & Multi-tenancy

    Landing Page: Login/Register.

    Group Selection: After login, user sees list of their groups or "Create Group".

    Dashboard: Once a group is selected, all views are scoped to that group_id.

4.2 Repertoire Management (Songs)

    View: List of songs with columns: Title, Artist, Status (Badge), Key, BPM.

    Filters: Filter by Status (e.g., show only "Ready Live").

    Add Song Flow:

        User searches Global Library.

        If found -> Add to Group.

        If not found -> Create new Global Song -> Auto-add to Group.

4.3 Setlist Builder

    UI: Split screen or Drawer.

        Left/Main: The Setlist (draggable list).

        Right/Modal: Available group_songs.

    Logic: Dragging a song into the setlist creates a setlist_item.

    Stats: Auto-sum duration at the bottom of the setlist.

4.4 Concerts

    Simple CRUD for events.

    Linking a Setlist to a Concert is optional but recommended.

5. UI/UX GUIDELINES

    Mobile First: All tables must be responsive (turn into cards on mobile).

    Theme: Dark mode default (music industry standard). Use Slate/Zinc colors with a primary accent color (e.g., Indigo or Violet).

    Navigation:

        Mobile: Bottom Tab Bar (Dashboard, Songs, Setlists, Profile).

        Desktop: Sidebar.

    Components: Use shadcn/ui components for:

        DataTable (for song lists).

        Dialog (for adding songs).

        Badge (for song statuses).

        Card (for dashboard widgets).

6. SECURITY RULES (RLS)

CRITICAL: Every table linked to a group (group_songs, concerts, setlists) must have an RLS policy:
code SQL

USING (
  group_id IN (
    SELECT group_id FROM memberships WHERE user_id = auth.uid()
  )
)

7. FILE STRUCTURE SUGGESTION (NEXT.JS APP ROUTER)
code Code

/app
  /(auth)/login/page.tsx
  /(dashboard)/[groupId]/layout.tsx  <-- Handles Group Context
  /(dashboard)/[groupId]/page.tsx    <-- Dashboard
  /(dashboard)/[groupId]/songs/page.tsx
  /(dashboard)/[groupId]/setlists/page.tsx
  /(dashboard)/[groupId]/concerts/page.tsx
/components
  /ui/       <-- shadcn components
  /songs/    <-- SongList, SongCard
  /setlists/ <-- SetlistBuilder
/lib
  /supabase/ <-- Client & Server clients
  /types/    <-- Database definitions

END OF PRD