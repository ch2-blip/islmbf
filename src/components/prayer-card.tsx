import { useEffect, useState } from "react"
import { fetchPrayerTimes, getNextPrayer, PRAYER_LABELS, type PrayerTimes } from "@/lib/prayer-times"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Clock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { EightPointStar } from "./geometric-pattern"

export function PrayerCard() {
  const [times, setTimes] = useState<PrayerTimes | null>(null)
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState("Beijing")

  useEffect(() => {
    const saved = localStorage.getItem("prayer-city") ?? "Beijing"
    setCity(saved)
    fetchPrayerTimes(saved).then((t) => {
      setTimes(t)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <Card className="overflow-hidden border-accent/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="p-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!times) {
    return (
      <Card className="border-accent/20 bg-muted/30">
        <CardContent className="p-4 text-sm text-muted-foreground text-center">
          暂时无法获取礼拜时间
        </CardContent>
      </Card>
    )
  }

  const next = getNextPrayer(times)
  const entries: Array<[keyof typeof PRAYER_LABELS, string]> = [
    ["fajr", times.fajr],
    ["dhuhr", times.dhuhr],
    ["asr", times.asr],
    ["maghrib", times.maghrib],
    ["isha", times.isha],
  ]

  return (
    <Card className="relative overflow-hidden border-primary/15 bg-gradient-to-br from-primary/8 via-background to-accent/8">
      <div className="absolute -right-4 -top-4 text-primary/10">
        <EightPointStar size={96} />
      </div>
      <CardContent className="relative p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{city}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Clock className="h-3 w-3" />
            <span>下一番：{next.name} · {next.time}</span>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {entries.map(([key, t]) => {
            const isNext = PRAYER_LABELS[key] === next.name
            return (
              <div
                key={key}
                className={`rounded-md px-1.5 py-2 text-center transition-colors ${
                  isNext
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-background/60 text-foreground"
                }`}
              >
                <div className="text-[10px] opacity-80 mb-0.5">{PRAYER_LABELS[key].split(" · ")[0]}</div>
                <div className="text-xs font-semibold tabular-nums">{t}</div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
