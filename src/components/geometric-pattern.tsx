import { cn } from "@/lib/utils"

export function GeometricPattern({ className }: { className?: string }) {
  return (
    <svg
      className={cn("pointer-events-none select-none", className)}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern id="islamic-star" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          <path
            d="M25 5 L29 20 L45 20 L32 30 L37 45 L25 36 L13 45 L18 30 L5 20 L21 20 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            opacity="0.5"
          />
          <circle cx="25" cy="25" r="2" fill="currentColor" opacity="0.3" />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#islamic-star)" />
    </svg>
  )
}

export function ArabesqueDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3 text-accent/60", className)}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent/30" />
      <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path
          d="M20 2 L24 10 L20 18 L16 10 Z M4 10 L12 10 M28 10 L36 10"
          stroke="currentColor"
          strokeWidth="1"
          fill="currentColor"
          fillOpacity="0.2"
        />
        <circle cx="20" cy="10" r="2" fill="currentColor" />
      </svg>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-accent/30" />
    </div>
  )
}

export function EightPointStar({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2 L14 7 L19 5 L17 10 L22 12 L17 14 L19 19 L14 17 L12 22 L10 17 L5 19 L7 14 L2 12 L7 10 L5 5 L10 7 Z"
        fill="currentColor"
      />
    </svg>
  )
}
