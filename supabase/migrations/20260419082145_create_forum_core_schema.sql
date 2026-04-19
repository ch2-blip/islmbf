/*
  # 华语穆斯林社区核心架构

  ## 概述
  为"静谧清真"社区平台建立完整的数据模型。采用"双轨融合"架构：
  - 文章（articles）用于长文、经训释义、学者文章
  - 话题（topics）用于轻社交、生活分享
  - 评论系统统一（comments 表通过 target_type 区分）

  ## 新建表

  ### 1. profiles - 用户扩展资料
  - id (uuid, 关联 auth.users)
  - username (text, 唯一昵称)
  - avatar_url (text, 头像)
  - bio (text, 个人简介)
  - role (text, 角色: user/scholar/moderator/admin)
  - is_verified_scholar (boolean, 学者认证 V2 预埋)
  - is_banned (boolean, 是否被封禁)
  - post_count, comment_count (integer, 统计)
  - created_at, updated_at

  ### 2. categories - 文章分类
  - id, slug, name, description, icon, sort_order

  ### 3. boards - 话题板块
  - id, slug, name, description, icon, sort_order

  ### 4. articles - 文章（长文）
  - id, author_id, category_id
  - title, slug, cover_image, excerpt, content (markdown)
  - status (draft/published/pinned/archived)
  - view_count, like_count, comment_count
  - is_featured (精选)
  - published_at, created_at, updated_at

  ### 5. topics - 话题/帖子（轻社交）
  - id, author_id, board_id
  - title, content
  - status (published/pinned/closed/archived)
  - view_count, like_count, comment_count, last_reply_at
  - created_at, updated_at

  ### 6. comments - 统一评论表
  - id, author_id
  - target_type (article/topic)
  - target_id (uuid)
  - parent_id (嵌套回复)
  - content, like_count
  - created_at, updated_at

  ### 7. reactions - 点赞/收藏
  - id, user_id, target_type, target_id, reaction_type (like/bookmark)

  ### 8. tags & content_tags - 标签系统
  - tags: id, name, slug
  - content_tags: 关联 articles/topics 与 tags

  ### 9. reports - 举报
  - id, reporter_id, target_type, target_id, reason, status

  ### 10. sensitive_words - 敏感词
  - id, word, severity

  ### 11. notifications - 通知
  - id, user_id, type, content, link, is_read

  ### 12. announcements - 平台公告
  - id, title, content, is_active, created_at

  ## 安全策略
  - 所有表启用 RLS
  - 公开内容（已发布文章/话题）所有人可读
  - 用户只能修改/删除自己的内容
  - 管理员和版主拥有超级权限
  - 通知、举报仅相关用户可见

  ## 辅助函数
  - 自动创建 profile 触发器（新用户注册时）
  - 更新计数的触发器
  - 判断管理员/版主的辅助函数
*/

-- ==========================================
-- 1. profiles 用户资料
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  role text NOT NULL DEFAULT 'user',
  is_verified_scholar boolean DEFAULT false,
  is_banned boolean DEFAULT false,
  post_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT role_check CHECK (role IN ('user', 'scholar', 'moderator', 'admin'))
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ==========================================
-- 辅助函数：判断权限
-- ==========================================
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_moderator_or_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role IN ('moderator', 'admin')
  );
$$;

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ==========================================
-- 2. categories 文章分类
-- ==========================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are public"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Only admins can manage categories insert"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can manage categories update"
  ON categories FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can manage categories delete"
  ON categories FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- ==========================================
-- 3. boards 话题板块
-- ==========================================
CREATE TABLE IF NOT EXISTS boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Boards are public"
  ON boards FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Only admins can insert boards"
  ON boards FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can update boards"
  ON boards FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can delete boards"
  ON boards FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- ==========================================
-- 4. articles 文章
-- ==========================================
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  cover_image text DEFAULT '',
  excerpt text DEFAULT '',
  content text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'published',
  is_featured boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT article_status_check CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published articles are public"
  ON articles FOR SELECT
  TO anon, authenticated
  USING (status = 'published' OR author_id = auth.uid() OR is_moderator_or_admin(auth.uid()));

CREATE POLICY "Authenticated users can create articles"
  ON articles FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own articles"
  ON articles FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() OR is_moderator_or_admin(auth.uid()))
  WITH CHECK (author_id = auth.uid() OR is_moderator_or_admin(auth.uid()));

CREATE POLICY "Authors and mods can delete articles"
  ON articles FOR DELETE
  TO authenticated
  USING (author_id = auth.uid() OR is_moderator_or_admin(auth.uid()));

-- ==========================================
-- 5. topics 话题/帖子
-- ==========================================
CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  board_id uuid REFERENCES boards(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'published',
  is_pinned boolean DEFAULT false,
  is_closed boolean DEFAULT false,
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  last_reply_at timestamptz DEFAULT now(),
  last_reply_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT topic_status_check CHECK (status IN ('published', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_topics_last_reply ON topics(last_reply_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_topics_board ON topics(board_id);
CREATE INDEX IF NOT EXISTS idx_topics_author ON topics(author_id);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published topics are public"
  ON topics FOR SELECT
  TO anon, authenticated
  USING (status = 'published' OR author_id = auth.uid() OR is_moderator_or_admin(auth.uid()));

CREATE POLICY "Authenticated users can create topics"
  ON topics FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own topics"
  ON topics FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() OR is_moderator_or_admin(auth.uid()))
  WITH CHECK (author_id = auth.uid() OR is_moderator_or_admin(auth.uid()));

CREATE POLICY "Authors and mods can delete topics"
  ON topics FOR DELETE
  TO authenticated
  USING (author_id = auth.uid() OR is_moderator_or_admin(auth.uid()));

-- ==========================================
-- 6. comments 评论
-- ==========================================
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  like_count integer DEFAULT 0,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT comment_target_check CHECK (target_type IN ('article', 'topic'))
);

CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are public"
  ON comments FOR SELECT
  TO anon, authenticated
  USING (is_deleted = false OR author_id = auth.uid() OR is_moderator_or_admin(auth.uid()));

CREATE POLICY "Authenticated users can comment"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() OR is_moderator_or_admin(auth.uid()))
  WITH CHECK (author_id = auth.uid() OR is_moderator_or_admin(auth.uid()));

CREATE POLICY "Authors and mods can delete comments"
  ON comments FOR DELETE
  TO authenticated
  USING (author_id = auth.uid() OR is_moderator_or_admin(auth.uid()));

-- ==========================================
-- 7. reactions 点赞与收藏
-- ==========================================
CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reaction_type text NOT NULL DEFAULT 'like',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, target_type, target_id, reaction_type),
  CONSTRAINT reaction_target_check CHECK (target_type IN ('article', 'topic', 'comment')),
  CONSTRAINT reaction_type_check CHECK (reaction_type IN ('like', 'bookmark'))
);

CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(user_id);

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions are viewable by everyone"
  ON reactions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can manage own reactions insert"
  ON reactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own reactions delete"
  ON reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ==========================================
-- 8. reports 举报
-- ==========================================
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  handled_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  handled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT report_target_check CHECK (target_type IN ('article', 'topic', 'comment', 'user')),
  CONSTRAINT report_status_check CHECK (status IN ('pending', 'resolved', 'rejected'))
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own reports, mods see all"
  ON reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid() OR is_moderator_or_admin(auth.uid()));

CREATE POLICY "Authenticated users can report"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Mods can update reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (is_moderator_or_admin(auth.uid()))
  WITH CHECK (is_moderator_or_admin(auth.uid()));

-- ==========================================
-- 9. sensitive_words 敏感词库
-- ==========================================
CREATE TABLE IF NOT EXISTS sensitive_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text UNIQUE NOT NULL,
  severity text NOT NULL DEFAULT 'warn',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT severity_check CHECK (severity IN ('warn', 'block'))
);

ALTER TABLE sensitive_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mods can view sensitive words"
  ON sensitive_words FOR SELECT
  TO authenticated
  USING (is_moderator_or_admin(auth.uid()));

CREATE POLICY "Admins can insert sensitive words"
  ON sensitive_words FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update sensitive words"
  ON sensitive_words FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete sensitive words"
  ON sensitive_words FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- ==========================================
-- 10. notifications 通知
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  content text DEFAULT '',
  link text DEFAULT '',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System inserts notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ==========================================
-- 11. announcements 公告
-- ==========================================
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active announcements are public"
  ON announcements FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR is_moderator_or_admin(auth.uid()));

CREATE POLICY "Admins can insert announcements"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update announcements"
  ON announcements FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete announcements"
  ON announcements FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- ==========================================
-- 触发器：新用户自动创建 profile
-- ==========================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 6)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==========================================
-- 触发器：更新 updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS articles_updated_at ON articles;
CREATE TRIGGER articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS topics_updated_at ON topics;
CREATE TRIGGER topics_updated_at BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS comments_updated_at ON comments;
CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==========================================
-- 触发器：话题新评论更新 last_reply
-- ==========================================
CREATE OR REPLACE FUNCTION update_topic_last_reply()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.target_type = 'topic' THEN
    UPDATE topics
    SET last_reply_at = now(),
        last_reply_by = NEW.author_id,
        comment_count = comment_count + 1
    WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'article' THEN
    UPDATE articles
    SET comment_count = comment_count + 1
    WHERE id = NEW.target_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_inserted ON comments;
CREATE TRIGGER on_comment_inserted
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION update_topic_last_reply();

-- ==========================================
-- 插入默认数据：分类、板块
-- ==========================================
INSERT INTO categories (slug, name, description, icon, sort_order) VALUES
  ('quran-hadith', '经训释义', '古兰经与圣训的学习与解读', 'BookOpen', 1),
  ('life', '生活感悟', '信仰与日常的点滴思考', 'Heart', 2),
  ('culture', '伊斯兰文化', '历史、艺术与文明', 'Landmark', 3),
  ('lectures', '学者讲座', '卧尔兹与讲座整理', 'Mic', 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO boards (slug, name, description, icon, sort_order) VALUES
  ('daily', '生活互助', '日常求助与生活分享', 'Users', 1),
  ('halal-food', '清真美食', '清真餐厅、家常菜谱', 'UtensilsCrossed', 2),
  ('ramadan', '斋月日常', '斋月期间的经验交流', 'Moon', 3),
  ('travel', '旅行朝觐', '朝觐与旅行见闻', 'Plane', 4),
  ('reading', '读书观影', '好书推荐与观影感悟', 'BookMarked', 5),
  ('chat', '闲聊灌水', '轻松随意的日常闲谈', 'MessageCircle', 6)
ON CONFLICT (slug) DO NOTHING;
