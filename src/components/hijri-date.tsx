import { useEffect, useState } from "react"
import { toHijri, formatGregorian } from "@/lib/hijri"
import { Moon } from "lucide-react"

export function HijriDate({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const hijri = toHijri(now)
  const gregorian = formatGregorian(now)

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Moon className="h-3 w-3 text-accent" />
        <span className="font-serif-cn">{hijri.formatted}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Moon className="h-4 w-4 text-accent" />
      <span className="text-muted-foreground">{gregorian}</span>
      <span className="text-border">·</span>
      <span className="text-foreground/80 font-serif-cn">{hijri.formatted}</span>
    </div>
  )
}
