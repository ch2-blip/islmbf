/*
  # 修复 Supabase 安全顾问告警

  ## 变更概述
  1. 为 5 个函数显式设置 search_path，防止搜索路径注入攻击
     - is_admin
     - is_moderator_or_admin
     - handle_new_user
     - set_updated_at
     - update_topic_last_reply
  2. 收紧 notifications 表的 INSERT 策略：
     - 旧策略 WITH CHECK (true) 相当于允许任何登录用户向任何人插入通知
     - 新策略只允许：接收者是自己（允许客户端自发通知），或版主/管理员插入
     - 系统级跨用户通知应通过 service_role 或 Edge Function 绕过 RLS 执行
  3. 移除 article-images 存储桶上过宽的 SELECT 策略：
     - 公共桶通过 public URL 即可直接访问对象，不需要 storage.objects 的 SELECT 权限
     - 删除此策略后仍可以通过 object URL 读取文件，但不能再 LIST 整个桶

  ## 注意
  - 不涉及任何表结构变更，无数据迁移风险
  - "Leaked Password Protection" 是 Supabase Auth 的控制台设置，
    需要在 Supabase Dashboard -> Authentication -> Providers -> Email
    中手动开启 "Leaked Password Protection"，SQL 无法设置
*/

-- ==========================================
-- 1. 重建函数并固定 search_path
-- ==========================================
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_moderator_or_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role IN ('moderator', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_topic_last_reply()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.target_type = 'topic' THEN
    UPDATE public.topics
    SET last_reply_at = now(),
        last_reply_by = NEW.author_id,
        comment_count = comment_count + 1
    WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'article' THEN
    UPDATE public.articles
    SET comment_count = comment_count + 1
    WHERE id = NEW.target_id;
  END IF;
  RETURN NEW;
END;
$$;

-- ==========================================
-- 2. 收紧 notifications INSERT 策略
-- ==========================================
DROP POLICY IF EXISTS "System inserts notifications" ON public.notifications;

CREATE POLICY "Users insert own notifications or mods insert any"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_moderator_or_admin(auth.uid())
  );

-- ==========================================
-- 3. 移除 article-images 过宽 SELECT 策略
--    公共桶通过对象 URL 即可读取，不需要 LIST 权限
-- ==========================================
DROP POLICY IF EXISTS "article-images public read" ON storage.objects;
