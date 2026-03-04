-- 1. Profiles (Syncs with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Groups
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Memberships
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
    instrument TEXT,
    UNIQUE (user_id, group_id)
);

-- 4. Songs (Global Library)
CREATE TABLE IF NOT EXISTS public.songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    artist TEXT,
    duration_seconds INTEGER,
    default_bpm INTEGER,
    default_key TEXT,
    created_by UUID REFERENCES public.profiles(id),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Group Songs (Contextual)
CREATE TABLE IF NOT EXISTS public.group_songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('proposal', 'to_learn', 'rehearsing', 'ready_live')) DEFAULT 'proposal',
    bpm_override INTEGER,
    duration_seconds INTEGER,
    key_override TEXT,
    lead_vocal UUID REFERENCES public.profiles(id),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (group_id, song_id)
);

-- 6. Concerts
CREATE TABLE IF NOT EXISTS public.concerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    name TEXT,
    date TIMESTAMPTZ,
    venue TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Setlists
CREATE TABLE IF NOT EXISTS public.setlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    concert_id UUID REFERENCES public.concerts(id) ON DELETE SET NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Setlist Items
CREATE TABLE IF NOT EXISTS public.setlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setlist_id UUID REFERENCES public.setlists(id) ON DELETE CASCADE,
    group_song_id UUID REFERENCES public.group_songs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlist_items ENABLE ROW LEVEL SECURITY;

-- CLEANUP OLD POLICIES (if any)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view group memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can view songs" ON public.songs;
DROP POLICY IF EXISTS "Group data access" ON public.group_songs;
DROP POLICY IF EXISTS "Group data access" ON public.concerts;
DROP POLICY IF EXISTS "Group data access" ON public.setlists;
DROP POLICY IF EXISTS "Group data access" ON public.setlist_items;

-- RLS POLICIES

-- Profiles
CREATE POLICY "Profiles are viewable by group members" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM public.memberships m1
            JOIN public.memberships m2 ON m1.group_id = m2.group_id
            WHERE m1.user_id = auth.uid() AND m2.user_id = public.profiles.id
        )
    );

-- Groups
CREATE POLICY "Groups are viewable by members" ON public.groups
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND group_id = public.groups.id)
    );
CREATE POLICY "Any authenticated user can create a group" ON public.groups
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Memberships (FIX RECURSION)
CREATE POLICY "Users can view their own membership" ON public.memberships
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view group-mate memberships" ON public.memberships
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM public.memberships WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add themselves to a group" ON public.memberships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update memberships" ON public.memberships
    FOR UPDATE USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.group_id = memberships.group_id
            AND m.user_id = auth.uid()
            AND m.role = 'admin'
        )
    );

CREATE POLICY "Users can delete memberships" ON public.memberships
    FOR DELETE USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.group_id = memberships.group_id
            AND m.user_id = auth.uid()
            AND m.role = 'admin'
        )
    );

-- Songs
CREATE POLICY "Songs viewable by all if public or by creator" ON public.songs
    FOR SELECT USING (is_public = TRUE OR created_by = auth.uid());
CREATE POLICY "Authenticated users can create songs" ON public.songs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Group Scoped Tables
CREATE POLICY "Group songs access" ON public.group_songs
    FOR ALL USING (group_id IN (SELECT group_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Concerts access" ON public.concerts
    FOR ALL USING (group_id IN (SELECT group_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Setlists access" ON public.setlists
    FOR ALL USING (group_id IN (SELECT group_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Setlist items access" ON public.setlist_items
    FOR ALL USING (
        setlist_id IN (
            SELECT id FROM public.setlists WHERE group_id IN (
                SELECT group_id FROM public.memberships WHERE user_id = auth.uid()
            )
        )
    );

-- TRIGGERS for Profile Sync
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Group Invitations
CREATE TABLE IF NOT EXISTS public.group_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
    invited_by UUID REFERENCES public.profiles(id),
    status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (group_id, email)
);

ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invitations access" ON public.group_invitations
    FOR ALL USING (
        group_id IN (SELECT group_id FROM memberships WHERE user_id = auth.uid())
        OR email IN (SELECT email FROM profiles WHERE id = auth.uid())
    );

-- 10. Documents Tracking (Digital Binder)
CREATE TABLE IF NOT EXISTS public.group_song_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL, -- e.g., 'application/pdf', 'audio/mpeg'
    name TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, song_id, file_path)
);

ALTER TABLE public.group_song_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documents access" ON public.group_song_documents
    FOR ALL USING (
        group_id IN (SELECT group_id FROM public.memberships WHERE user_id = auth.uid())
    );

-- IMPORTANT INSTRUCTIONS FOR SUPABASE STORAGE:
-- Because creating and configuring Storage Buckets requires full superuser privileges
-- that the SQL editor doesn't always have, please do the following in your Supabase Dashboard:
-- 
-- 1. Go to "Storage" in the left sidebar.
-- 2. Click "New Bucket"
-- 3. Name it EXACTLY: "band-documents"
-- 4. Do NOT make it public.
-- 5. Go to "Policies" under Storage.
-- 6. Add these SQL policies (if allowed) or use the UI to recreate them:
-- 
-- CREATE POLICY "Band members can view documents" ON storage.objects
--     FOR SELECT USING (
--         bucket_id = 'band-documents' AND
--         (SELECT auth.uid()) IN (
--             SELECT user_id FROM public.memberships
--             WHERE group_id::text = (string_to_array(name, '/'))[1]
--         )
--     );
-- 
-- CREATE POLICY "Band members can insert documents" ON storage.objects
--     FOR INSERT WITH CHECK (
--         bucket_id = 'band-documents' AND
--         (SELECT auth.uid()) IN (
--             SELECT user_id FROM public.memberships
--             WHERE group_id::text = (string_to_array(name, '/'))[1]
--         )
--     );
-- 
-- CREATE POLICY "Band members can delete documents" ON storage.objects
--     FOR DELETE USING (
--         bucket_id = 'band-documents' AND
--         (SELECT auth.uid()) IN (
--             SELECT user_id FROM public.memberships
--             WHERE group_id::text = (string_to_array(name, '/'))[1]
--         )
--     );
