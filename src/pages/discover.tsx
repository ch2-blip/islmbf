import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import type { Category, Board } from "@/lib/database.types"
import { Card } from "@/components/ui/card"
import { Compass, BookOpen, Users, MessageCircle, ArrowRight } from "lucide-react"
import { Bismillah } from "@/components/bismillah"

export function DiscoverPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [boards, setBoards] = useState<Board[]>([])

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setCategories(data ?? []))
    supabase
      .from("boards")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setBoards(data ?? []))
  }, [])

  return (
    <div className="px-4 pt-4 pb-8 space-y-6">
      <div className="flex items-center gap-2">
        <Compass className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-serif-cn font-semibold">发现</h1>
      </div>

      <Bismillah />

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold font-serif-cn flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-primary" />
            文章分类
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((c) => (
            <Link key={c.id} to={`/category/${c.slug}`}>
              <Card className="p-4 border-primary/15 hover:border-primary/40 hover:bg-primary/5 transition-all group">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-serif-cn font-semibold text-foreground">{c.name}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{c.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold font-serif-cn flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4 text-accent-foreground" />
            话题板块
          </h2>
        </div>
        <Card className="overflow-hidden divide-y divide-border/60">
          {boards.map((b) => (
            <Link
              key={b.id}
              to={`/board/${b.slug}`}
              className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{b.name}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{b.description}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </Card>
      </section>
    </div>
  )
}
