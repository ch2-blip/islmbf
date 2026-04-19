import { cn } from "@/lib/utils"
import { ArabesqueDivider } from "./geometric-pattern"

export function Bismillah({ className, showTranslation = false }: { className?: string; showTranslation?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center gap-2 py-4", className)}>
      <p className="font-arabic text-2xl sm:text-3xl text-primary tracking-wide">
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
      </p>
      {showTranslation && (
        <p className="text-xs text-muted-foreground font-serif-cn">
          以普慈特慈的真主之名
        </p>
      )}
      <ArabesqueDivider className="w-full max-w-xs mt-1" />
    </div>
  )
}
