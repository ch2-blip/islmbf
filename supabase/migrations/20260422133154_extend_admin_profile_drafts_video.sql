/*
  # Extended admin/profile/drafts/video schema

  1. New tables
    - `site_settings` — single-row key/value store for site name and icon URL.
    - `user_permissions` — per-user admin capability flags (for level-2 admins appointed by the root admin).

  2. Profile extensions
    - `profiles.avatar_shape` (text, default 'circle') — 'circle' | 'square' | 'rounded'
    - `profiles.badge_text` (text, default '') — custom badge text for admins (falls back to role name if empty)
    - `profiles.halo_style` (text, default 'none') — 'none' | 'gold' | 'emerald' | 'rose' | 'sky'
    - `profiles.can_post_video` (boolean, default false) — per-user override allowing video posts
    - `profiles.phone` (text, default '') — bound phone number

  3. Articles extension
    - `articles.video_url` (text, default '') — optional video URL when author is permitted to post video

  4. Storage
    - `avatars` public bucket with RLS permitting authenticated users to upload/update/delete their own avatars
    - `site-assets` public bucket for site icons (admin-only write)

  5. Security
    - site_settings: public read; admin-only write
    - user_permissions: user reads own; admin-only write
    - All existing RLS untouched
*/

-- SITE SETTINGS ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
  id integer PRIMARY KEY DEFAULT 1,
  site_name text NOT NULL DEFAULT '静园',
  site_icon_url text NOT NULL DEFAULT '',
  allow_video_posts boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = 1)
);

INSERT INTO site_settings (id, site_name, site_icon_url)
VALUES (1, '静园', '')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site settings public read" ON site_settings;
CREATE POLICY "site settings public read"
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "site settings admin update" ON site_settings;
CREATE POLICY "site settings admin update"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- USER PERMISSIONS (level-2 admin capability flags) -----------------------
CREATE TABLE IF NOT EXISTS user_permissions (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  can_manage_reports boolean NOT NULL DEFAULT false,
  can_manage_content boolean NOT NULL DEFAULT false,
  can_manage_users boolean NOT NULL DEFAULT false,
  can_manage_announcements boolean NOT NULL DEFAULT false,
  can_manage_sensitive boolean NOT NULL DEFAULT false,
  can_manage_taxonomy boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user permissions own read" ON user_permissions;
CREATE POLICY "user permissions own read"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "user permissions admin insert" ON user_permissions;
CREATE POLICY "user permissions admin insert"
  ON user_permissions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "user permissions admin update" ON user_permissions;
CREATE POLICY "user permissions admin update"
  ON user_permissions FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "user permissions admin delete" ON user_permissions;
CREATE POLICY "user permissions admin delete"
  ON user_permissions FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- PROFILE EXTENSIONS ------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_shape') THEN
    ALTER TABLE profiles ADD COLUMN avatar_shape text NOT NULL DEFAULT 'circle'
      CHECK (avatar_shape IN ('circle','square','rounded'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='badge_text') THEN
    ALTER TABLE profiles ADD COLUMN badge_text text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='halo_style') THEN
    ALTER TABLE profiles ADD COLUMN halo_style text NOT NULL DEFAULT 'none'
      CHECK (halo_style IN ('none','gold','emerald','rose','sky'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='can_post_video') THEN
    ALTER TABLE profiles ADD COLUMN can_post_video boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone') THEN
    ALTER TABLE profiles ADD COLUMN phone text NOT NULL DEFAULT '';
  END IF;
END $$;

-- ARTICLES EXTENSION (video support) --------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='articles' AND column_name='video_url') THEN
    ALTER TABLE articles ADD COLUMN video_url text NOT NULL DEFAULT '';
  END IF;
END $$;

-- STORAGE BUCKETS ---------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars public read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars auth upload" ON storage.objects;
CREATE POLICY "avatars auth upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars own update" ON storage.objects;
CREATE POLICY "avatars own update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());

DROP POLICY IF EXISTS "avatars own delete" ON storage.objects;
CREATE POLICY "avatars own delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid());

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "site assets public read" ON storage.objects;
CREATE POLICY "site assets public read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "site assets admin upload" ON storage.objects;
CREATE POLICY "site assets admin upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'site-assets' AND is_admin(auth.uid()));

DROP POLICY IF EXISTS "site assets admin update" ON storage.objects;
CREATE POLICY "site assets admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'site-assets' AND is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'site-assets' AND is_admin(auth.uid()));

DROP POLICY IF EXISTS "site assets admin delete" ON storage.objects;
CREATE POLICY "site assets admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'site-assets' AND is_admin(auth.uid()));
