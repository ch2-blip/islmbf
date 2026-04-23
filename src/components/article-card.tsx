import { Link } from "react-router-dom"
import type { Article } from "@/lib/database.types"
import { UserAvatar } from "@/components/user-avatar"
import { Card } from "@/components/ui/card"
import { Eye, MessageCircle, Heart, Pin } from "lucide-react"
import { timeAgo } from "@/lib/hijri"
import { Badge } from "@/components/ui/badge"

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link to={`/article/${article.id}`}>
      <Card className="group overflow-hidden border-border/70 hover:border-primary/30 hover:shadow-md transition-all duration-300">
        {article.cover_image && (
          <div className="relative aspect-[16/7] overflow-hidden bg-muted">
            <img
              src={article.cover_image}
              alt={article.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
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
              <UserAvatar profile={article.author} size="xs" />
              <span className="truncate max-w-[120px]">{article.author?.username}</span>
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
    </Link>
  )
}
