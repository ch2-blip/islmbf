/**
 * generate-static-data.mjs
 *
 * Generates static JSON snapshots of public content for first-visit speed.
 * Uses Supabase anon key (same as frontend) — RLS ensures only published data.
 *
 * Usage:
 *   node scripts/generate-static-data.mjs
 *
 * Environment:
 *   VITE_SUPABASE_URL       — Supabase project URL (reads from .env / .env.local)
 *   VITE_SUPABASE_ANON_KEY  — Supabase anon key
 *   STATIC_DATA_OUT_DIR     — (optional) output directory, defaults to public/static-data/
 *                             For VPS cron: set to the live site's static-data directory
 */

import { createClient } from "@supabase/supabase-js"
import { writeFileSync, renameSync, mkdirSync, existsSync, unlinkSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { config } from "dotenv"

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, "..")

// Load .env / .env.local
config({ path: resolve(projectRoot, ".env.local") })
config({ path: resolve(projectRoot, ".env") })

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY")
  process.exit(1)
}

const supabase = createClient(url, anonKey)

// Output directory: env override or default to public/static-data
const outDir = process.env.STATIC_DATA_OUT_DIR || resolve(projectRoot, "public", "static-data")

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

/**
 * Atomic write: write to .tmp first, then rename.
 * Prevents live site from reading a half-written JSON file.
 */
function atomicWriteJSON(filePath, data) {
  ensureDir(dirname(filePath))
  const json = JSON.stringify(data)
  const tmpPath = filePath + ".tmp"
  try {
    writeFileSync(tmpPath, json, "utf-8")
    // Verify the tmp file is valid JSON before replacing
    JSON.parse(json)
    renameSync(tmpPath, filePath)
    const sizeKB = (Buffer.byteLength(json) / 1024).toFixed(1)
    console.log(`  ✅ ${filePath} (${sizeKB} KB)`)
  } catch (err) {
    // Clean up tmp file on failure
    try { unlinkSync(tmpPath) } catch { /* ignore */ }
    throw err
  }
}

/** Strip fields that shouldn't be in public JSON — list view (no content) */
function sanitizeArticleForList(a) {
  return {
    id: a.id,
    title: a.title,
    excerpt: a.excerpt,
    cover_image: a.cover_image,
    cover_focal_y: a.cover_focal_y,
    excerpt_enabled: a.excerpt_enabled,
    is_pinned: a.is_pinned,
    is_featured: a.is_featured,
    sort_order: a.sort_order ?? 0,
    view_count: a.view_count,
    like_count: a.like_count,
    comment_count: a.comment_count,
    published_at: a.published_at,
    updated_at: a.updated_at,
    video_url: a.video_url,
    author: a.author ? {
      id: a.author.id,
      username: a.author.username,
      display_name: a.author.display_name,
      avatar_url: a.author.avatar_url,
      role: a.author.role,
      badge_text: a.author.badge_text,
      badge_color: a.author.badge_color,
    } : null,
    category: a.category ? {
      id: a.category.id,
      slug: a.category.slug,
      name: a.category.name,
    } : null,
  }
}

function sanitizeTopicForList(t) {
  return {
    id: t.id,
    title: t.title,
    content: t.content,
    is_pinned: t.is_pinned,
    is_closed: t.is_closed,
    view_count: t.view_count,
    like_count: t.like_count,
    comment_count: t.comment_count,
    last_reply_at: t.last_reply_at,
    created_at: t.created_at,
    updated_at: t.updated_at,
    author: t.author ? {
      id: t.author.id,
      username: t.author.username,
      display_name: t.author.display_name,
      avatar_url: t.author.avatar_url,
      role: t.author.role,
      badge_text: t.author.badge_text,
      badge_color: t.author.badge_color,
    } : null,
    board: t.board ? {
      id: t.board.id,
      slug: t.board.slug,
      name: t.board.name,
    } : null,
  }
}

/** Full article detail — includes content */
function sanitizeArticleDetail(a) {
  return {
    ...sanitizeArticleForList(a),
    content: a.content,
    author_id: a.author_id,
    category_id: a.category_id,
    status: a.status,
    created_at: a.created_at,
  }
}

/** Sanitize a comment for public JSON */
function sanitizeComment(c) {
  return {
    id: c.id,
    content: c.content,
    target_type: c.target_type,
    target_id: c.target_id,
    parent_id: c.parent_id,
    is_deleted: c.is_deleted,
    created_at: c.created_at,
    updated_at: c.updated_at,
    author: c.author ? {
      id: c.author.id,
      username: c.author.username,
      display_name: c.author.display_name,
      avatar_url: c.author.avatar_url,
      role: c.author.role,
      badge_text: c.author.badge_text,
      badge_color: c.author.badge_color,
    } : null,
  }
}

/** Full topic detail — includes content + author_id */
function sanitizeTopicDetail(t) {
  return {
    ...sanitizeTopicForList(t),
    author_id: t.author_id,
    board_id: t.board_id,
    status: t.status,
    last_reply_by: t.last_reply_by,
  }
}

async function main() {
  const startTime = Date.now()
  console.log("🚀 Generating static data...")
  console.log(`   Output directory: ${outDir}`)
  console.log(`   Supabase URL: ${url}`)

  const now = new Date().toISOString()

  // ── 1. Fetch articles ──
  console.log("\n📄 Fetching published articles...")
  const { data: articles, error: arErr } = await supabase
    .from("articles")
    .select("*, author:profiles!articles_author_id_fkey(*), category:categories(*)")
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("sort_order", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(30)

  if (arErr) {
    console.error("❌ Articles fetch failed:", arErr.message)
    process.exit(1)
  }
  console.log(`   ✓ Found ${articles.length} published articles`)

  // ── 2. Fetch topics ──
  console.log("\n💬 Fetching published topics...")
  const { data: topics, error: tpErr } = await supabase
    .from("topics")
    .select("*, author:profiles!topics_author_id_fkey(*), board:boards(*)")
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("last_reply_at", { ascending: false })
    .limit(30)

  if (tpErr) {
    console.error("❌ Topics fetch failed:", tpErr.message)
    process.exit(1)
  }
  console.log(`   ✓ Found ${topics.length} published topics`)

  // ── 3. Fetch announcement ──
  console.log("\n📢 Fetching active announcement...")
  const { data: announcement, error: anErr } = await supabase
    .from("announcements")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (anErr) {
    console.error("⚠️ Announcement fetch failed (non-fatal):", anErr.message)
  }
  console.log(`   ${announcement ? "✓ Found active announcement" : "– No active announcement"}`)

  // ── 3.5. Fetch site settings ──
  console.log("\n⚙️  Fetching site settings...")
  let siteSettings = null
  const { data: ssData, error: ssErr } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle()

  if (ssErr) {
    console.error("⚠️ Site settings fetch failed (non-fatal):", ssErr.message)
  } else if (ssData) {
    siteSettings = ssData
    console.log(`   ✓ Site name: ${ssData.site_name || "(empty)"}`)
  } else {
    console.log("   – No site settings found")
  }

  // ── 3.6. Write site-settings.json (atomic) ──
  if (siteSettings) {
    console.log("\n📦 Writing site-settings.json...")
    atomicWriteJSON(resolve(outDir, "site-settings.json"), {
      ...siteSettings,
      generatedAt: now,
    })
  }

  // ── 4. Write home.json (atomic) ──
  console.log("\n📦 Writing home.json...")
  const homeData = {
    articles: articles.map(sanitizeArticleForList),
    topics: topics.map(sanitizeTopicForList),
    announcement: announcement || null,
    generatedAt: now,
  }
  atomicWriteJSON(resolve(outDir, "home.json"), homeData)

  // ── 5. Write individual article detail JSONs (atomic) ──
  console.log("\n📦 Writing article detail JSONs...")
  ensureDir(resolve(outDir, "articles"))
  let articleCount = 0
  for (const a of articles) {
    const detail = sanitizeArticleDetail(a)
    atomicWriteJSON(resolve(outDir, "articles", `${a.id}.json`), detail)
    articleCount++
  }

  // ── 6. Fetch comments for each topic and write topic detail JSONs ──
  console.log("\n📦 Writing topic detail JSONs (with comments)...")
  ensureDir(resolve(outDir, "topics"))
  let topicCount = 0
  for (const t of topics) {
    // Fetch first page of comments for this topic
    const { data: topicComments } = await supabase
      .from("comments")
      .select("*, author:profiles!comments_author_id_fkey(*)")
      .eq("target_type", "topic")
      .eq("target_id", t.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
      .limit(50)

    const topicDetail = {
      topic: sanitizeTopicDetail(t),
      comments: (topicComments ?? []).map(sanitizeComment),
      generatedAt: now,
    }
    atomicWriteJSON(resolve(outDir, "topics", `${t.id}.json`), topicDetail)
    topicCount++
  }

  // ── 7. Write version.json (atomic, LAST — so readers see it only after all files are ready) ──
  console.log("\n📦 Writing version.json...")
  const versionData = {
    version: now,
    homeVersion: now,
    articlesVersion: now,
    topicsVersion: now,
    siteSettingsVersion: now,
    articleCount: articles.length,
    topicCount: topics.length,
  }
  atomicWriteJSON(resolve(outDir, "version.json"), versionData)

  // ── Summary ──
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log("\n" + "─".repeat(50))
  console.log("✅ Static data generation complete!")
  console.log(`   Site settings:     ${siteSettings ? "✓" : "–"}`)
  console.log(`   Articles (list):   ${articles.length}`)
  console.log(`   Articles (detail): ${articleCount} JSON files`)
  console.log(`   Topics (list):     ${topics.length}`)
  console.log(`   Topics (detail):   ${topicCount} JSON files (with comments)`)
  console.log(`   Output directory:  ${outDir}`)
  console.log(`   Version:           ${now}`)
  console.log(`   Elapsed:           ${elapsed}s`)
  console.log("─".repeat(50))
}

main().catch((err) => {
  console.error("❌ Fatal error:", err.message || err)
  process.exit(1)
})
