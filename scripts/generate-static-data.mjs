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
 *   STATIC_DATA_OUT_DIR     — (optional) output directory override for VPS cron
 */

import { createClient } from "@supabase/supabase-js"
import { writeFileSync, mkdirSync, existsSync } from "fs"
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

function writeJSON(filePath, data) {
  ensureDir(dirname(filePath))
  writeFileSync(filePath, JSON.stringify(data), "utf-8")
  const sizeKB = (Buffer.byteLength(JSON.stringify(data)) / 1024).toFixed(1)
  console.log(`  ✅ ${filePath} (${sizeKB} KB)`)
}

/** Strip fields that shouldn't be in public JSON */
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
    content: t.content, // topics are short, keep content
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

function sanitizeArticleDetail(a) {
  return {
    ...sanitizeArticleForList(a),
    content: a.content, // full content for detail page
    author_id: a.author_id,
    category_id: a.category_id,
    status: a.status,
    created_at: a.created_at,
  }
}

async function main() {
  console.log("🚀 Generating static data...")
  console.log(`   Output: ${outDir}`)

  const now = new Date().toISOString()

  // ── 1. Fetch articles ──
  console.log("\n📄 Fetching articles...")
  const { data: articles, error: arErr } = await supabase
    .from("articles")
    .select("*, author:profiles!articles_author_id_fkey(*), category:categories(*)")
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(30)

  if (arErr) {
    console.error("❌ Articles fetch failed:", arErr.message)
    process.exit(1)
  }
  console.log(`   Found ${articles.length} published articles`)

  // ── 2. Fetch topics ──
  console.log("\n💬 Fetching topics...")
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
  console.log(`   Found ${topics.length} published topics`)

  // ── 3. Fetch announcement ──
  console.log("\n📢 Fetching announcement...")
  const { data: announcement } = await supabase
    .from("announcements")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  console.log(`   ${announcement ? "Found active announcement" : "No active announcement"}`)

  // ── 4. Write home.json ──
  console.log("\n📦 Writing home.json...")
  const homeData = {
    articles: articles.map(sanitizeArticleForList),
    topics: topics.map(sanitizeTopicForList),
    announcement: announcement || null,
    generatedAt: now,
  }
  writeJSON(resolve(outDir, "home.json"), homeData)

  // ── 5. Write individual article detail JSONs ──
  console.log("\n📦 Writing article detail JSONs...")
  ensureDir(resolve(outDir, "articles"))
  for (const a of articles) {
    const detail = sanitizeArticleDetail(a)
    writeJSON(resolve(outDir, "articles", `${a.id}.json`), detail)
  }

  // ── 6. Write version.json ──
  console.log("\n📦 Writing version.json...")
  const versionData = {
    version: now,
    homeVersion: now,
    articlesVersion: now,
    topicsVersion: now,
    articleCount: articles.length,
    topicCount: topics.length,
  }
  writeJSON(resolve(outDir, "version.json"), versionData)

  console.log("\n✅ Static data generation complete!")
  console.log(`   ${articles.length} articles, ${topics.length} topics`)
  console.log(`   Version: ${now}`)
}

main().catch((err) => {
  console.error("❌ Fatal error:", err)
  process.exit(1)
})
