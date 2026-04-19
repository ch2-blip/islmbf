export type UserRole = "user" | "scholar" | "moderator" | "admin"
export type ArticleStatus = "draft" | "published" | "archived"
export type TopicStatus = "published" | "archived"
export type ReactionType = "like" | "bookmark"
export type TargetType = "article" | "topic" | "comment"

export interface Profile {
  id: string
  username: string
  avatar_url: string
  bio: string
  role: UserRole
  is_verified_scholar: boolean
  is_banned: boolean
  post_count: number
  comment_count: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  sort_order: number
}

export interface Board {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  sort_order: number
}

export interface Article {
  id: string
  author_id: string
  category_id: string | null
  title: string
  cover_image: string
  excerpt: string
  content: string
  status: ArticleStatus
  is_featured: boolean
  is_pinned: boolean
  view_count: number
  like_count: number
  comment_count: number
  published_at: string
  created_at: string
  updated_at: string
  author?: Profile
  category?: Category
}

export interface Topic {
  id: string
  author_id: string
  board_id: string | null
  title: string
  content: string
  status: TopicStatus
  is_pinned: boolean
  is_closed: boolean
  view_count: number
  like_count: number
  comment_count: number
  last_reply_at: string
  last_reply_by: string | null
  created_at: string
  updated_at: string
  author?: Profile
  board?: Board
  last_reply_user?: Profile
}

export interface Comment {
  id: string
  author_id: string
  target_type: "article" | "topic"
  target_id: string
  parent_id: string | null
  content: string
  like_count: number
  is_deleted: boolean
  created_at: string
  updated_at: string
  author?: Profile
  replies?: Comment[]
}

export interface Reaction {
  id: string
  user_id: string
  target_type: TargetType
  target_id: string
  reaction_type: ReactionType
  created_at: string
}

export interface Report {
  id: string
  reporter_id: string
  target_type: "article" | "topic" | "comment" | "user"
  target_id: string
  reason: string
  description: string
  status: "pending" | "resolved" | "rejected"
  handled_by: string | null
  handled_at: string | null
  created_at: string
  reporter?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  content: string
  link: string
  is_read: boolean
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface SensitiveWord {
  id: string
  word: string
  severity: "warn" | "block"
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> }
      boards: { Row: Board; Insert: Partial<Board>; Update: Partial<Board> }
      articles: { Row: Article; Insert: Partial<Article>; Update: Partial<Article> }
      topics: { Row: Topic; Insert: Partial<Topic>; Update: Partial<Topic> }
      comments: { Row: Comment; Insert: Partial<Comment>; Update: Partial<Comment> }
      reactions: { Row: Reaction; Insert: Partial<Reaction>; Update: Partial<Reaction> }
      reports: { Row: Report; Insert: Partial<Report>; Update: Partial<Report> }
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> }
      announcements: { Row: Announcement; Insert: Partial<Announcement>; Update: Partial<Announcement> }
      sensitive_words: { Row: SensitiveWord; Insert: Partial<SensitiveWord>; Update: Partial<SensitiveWord> }
    }
  }
}
