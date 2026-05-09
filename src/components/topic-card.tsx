import { Link } from "react-router-dom"
import type { Topic } from "@/lib/database.types"
import { UserAvatar, UserNameWithBadge } from "@/components/user-avatar"
import { MessageCircle, Pin, Lock } from "lucide-react"
import { timeAgo } from "@/lib/hijri"
import { Badge } from "@/components/ui/badge"

export function TopicCard({ topic }: { topic: Topic }) {
  return (
    <Link
      to={`/topic/${topic.id}`}
      className="block group border-b border-border/60 last:border-b-0 hover:bg-muted/40 transition-colors"
    >
      <div className="flex items-start gap-3 p-4">
        <UserAvatar profile={topic.author} size="md" className="shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                {topic.is_pinned && <Pin className="h-3 w-3 text-accent fill-accent/30" />}
                {topic.is_closed && <Lock className="h-3 w-3 text-muted-foreground" />}
                <h3 className="font-medium text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {topic.title}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
                <UserNameWithBadge profile={topic.author} className="max-w-[100px]" />
                {topic.board && (
                  <>
                    <span className="text-border">·</span>
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                      {topic.board.name}
                    </Badge>
                  </>
                )}
                <span className="text-border">·</span>
                <span>{timeAgo(topic.last_reply_at)}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <div className="flex items-center gap-1 text-primary font-semibold tabular-nums">
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="text-sm">{topic.comment_count}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
