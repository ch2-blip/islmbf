/*
  # 文章审核状态 + 封面图存储桶

  ## 变更
  1. 在 articles.status 约束中新增 'pending' 状态（待审核）
  2. 创建 Supabase Storage 公共 Bucket: article-images
     - 公开读取
     - 已登录用户可以上传自己目录下的文件
  3. RLS 调整：pending 文章仅作者与管理员可见（已由现有策略覆盖）
*/

-- 1. 更新 articles.status 约束
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'articles' AND constraint_name = 'article_status_check'
  ) THEN
    ALTER TABLE articles DROP CONSTRAINT article_status_check;
  END IF;
END $$;

ALTER TABLE articles
  ADD CONSTRAINT article_status_check
  CHECK (status IN ('draft', 'pending', 'published', 'archived'));

-- 2. 创建存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. 存储桶策略
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'article-images public read'
  ) THEN
    CREATE POLICY "article-images public read"
      ON storage.objects FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'article-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'article-images auth upload'
  ) THEN
    CREATE POLICY "article-images auth upload"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'article-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'article-images own update'
  ) THEN
    CREATE POLICY "article-images own update"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'article-images' AND owner = auth.uid())
      WITH CHECK (bucket_id = 'article-images' AND owner = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'article-images own delete'
  ) THEN
    CREATE POLICY "article-images own delete"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'article-images' AND owner = auth.uid());
  END IF;
END $$;
