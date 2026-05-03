import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Move } from "lucide-react"

interface Props {
  src: string
  value: number
  onChange: (v: number) => void
  aspect?: number
  className?: string
}

export function CoverFocalPicker({ src, value, onChange, aspect = 16 / 7, className }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [boxW, setBoxW] = useState(0)
  const dragging = useRef(false)

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setBoxW(el.clientWidth))
    ro.observe(el)
    setBoxW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const boxH = boxW / aspect
  const imgH = natural && boxW ? (boxW * natural.h) / natural.w : 0
  const scrollRange = Math.max(0, imgH - boxH)
  const topOffset = -(value / 100) * scrollRange

  function pointerMove(e: PointerEvent) {
    if (!dragging.current || !natural || scrollRange <= 0 || !boxRef.current) return
    const rect = boxRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const pct = Math.max(0, Math.min(100, (y / rect.height) * 100))
    onChange(Math.round(pct))
  }
  function pointerUp() {
    dragging.current = false
    window.removeEventListener("pointermove", pointerMove)
    window.removeEventListener("pointerup", pointerUp)
  }
  function pointerDown(e: React.PointerEvent) {
    e.preventDefault()
    dragging.current = true
    if (natural && scrollRange > 0 && boxRef.current) {
      const rect = boxRef.current.getBoundingClientRect()
      const y = e.clientY - rect.top
      const pct = Math.max(0, Math.min(100, (y / rect.height) * 100))
      onChange(Math.round(pct))
    }
    window.addEventListener("pointermove", pointerMove)
    window.addEventListener("pointerup", pointerUp)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        ref={boxRef}
        onPointerDown={pointerDown}
        className="relative w-full select-none overflow-hidden rounded-lg border border-border bg-muted touch-none"
        style={{ aspectRatio: `${aspect}` }}
      >
        {natural ? (
          <img
            src={src}
            alt=""
            draggable={false}
            className="absolute left-0 w-full pointer-events-none"
            style={{ top: `${topOffset}px`, height: `${imgH}px`, maxWidth: "100%" }}
          />
        ) : (
          <img
            src={src}
            alt=""
            className="hidden"
            onLoad={(e) => {
              const img = e.currentTarget
              setNatural({ w: img.naturalWidth, h: img.naturalHeight })
            }}
          />
        )}

        {natural && (
          <img
            src={src}
            alt=""
            aria-hidden
            onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            className="hidden"
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-full ring-2 ring-inset ring-primary/70 rounded-lg" />
        <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-background/80 p-1 ring-1 ring-border text-foreground">
          <Move className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        拖动图片可调整首页卡片显示的重点区域（仅 16:7 卡片预览使用）
      </p>
    </div>
  )
}
