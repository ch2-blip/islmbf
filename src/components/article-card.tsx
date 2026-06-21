import { useNavigate } from "react-router-dom"
import type { Article } from "@/lib/database.types"
import { UserAvatar, UserNameWithBadge } from "@/components/user-avatar"
import { Card } from "@/components/ui/card"
import { Eye, MessageCircle, Heart, Pin } from "lucide-react"
import { timeAgo } from "@/lib/hijri"
import { Badge } from "@/components/ui/badge"
import { listThumb } from "@/lib/image-proxy"
import { prefetchArticle, getPrefetchedArticle } from "@/lib/article-prefetch"
import { useCallback, useEffect, useRef } from "react"

export function ArticleCard({ article }: { article: Article }) {
  const navigate = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)

  // Viewport-based prefetch: when card scrolls near visible area, prefetch detail
  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          prefetchArticle(article.id)
          observer.disconnect()  // only need to trigger once
        }
      },
      { rootMargin: "300px" }  // start 300px before card is visible
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [article.id])

  // Prefetch full article detail on hover/touch for instant detail page
  const triggerPrefetch = useCallback(() => {
    prefetchArticle(article.id)
  }, [article.id])

  /**
   * Click handler: ensure full article detail (with content) is cached
   * BEFORE navigating to the detail page. This prevents the flash-of-white
   * that occurs when the detail page has no cached data to render.
   *
   * Flow:
   * 1. If already cached → navigate immediately (0ms)
   * 2. If not cached → wait for static JSON fetch (typically 50-200ms)
   * 3. Timeout after 1.5s → navigate anyway (detail page has its own fallback)
   */
  const handleClick = useCallback(async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()

    // Fast path: already cached with content → navigate immediately
    const cached = getPrefetchedArticle(article.id)
    if (cached) {
      navigate(`/article/${article.id}`)
      return
    }

    // Slow path: fetch then navigate (race with timeout)
    await Promise.race([
      prefetchArticle(article.id),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 1500)),
    ])

    navigate(`/article/${article.id}`)
  }, [article.id, navigate])

  return (
    <div
      ref={cardRef}
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onMouseEnter={triggerPrefetch}
      onTouchStart={triggerPrefetch}
      onKeyDown={(e) => { if (e.key === "Enter") handleClick(e as any) }}
      className="cursor-pointer"
    >
      <Card className="group overflow-hidden border-border/70 hover:border-primary/30 hover:shadow-md transition-colors duration-200">
        {article.cover_image && (
          <div className="relative aspect-[16/7] overflow-hidden bg-muted">
            <img
              src={listThumb(article.cover_image)}
              alt={article.title}
              width={640}
              height={280}
              decoding="async"
              className="h-full w-full object-cover"
              style={{
                objectPosition: `center ${typeof article.cover_focal_y === "number" ? article.cover_focal_y : 50}%`,
              }}
              loading="lazy"
            />
            {article.is_featured && (
              <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground border-0 shadow-sm">
                精选
              </Badge>
            )}
          </div>
        )}
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            {article.is_pinned && (
              <Pin className="h-3.5 w-3.5 text-accent fill-accent/20" />
            )}
            {article.category && (
              <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">
                {article.category.name}
              </Badge>
            )}
          </div>
          <h3 className="font-serif-cn text-lg sm:text-xl font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {article.excerpt}
            </p>
          )}
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2 min-w-0">
              <UserAvatar profile={article.author} size="xs" className="shrink-0" />
              <UserNameWithBadge profile={article.author} className="max-w-[120px]" />
              <span className="text-border">·</span>
              <span>{timeAgo(article.published_at)}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {article.view_count}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {article.like_count}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {article.comment_count}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
