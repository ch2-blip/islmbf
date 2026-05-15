import { useEffect, useLayoutEffect, useRef } from "react"
import { useNavigationType } from "react-router-dom"

const SS_PREFIX = "scrollY:"

/**
 * Save scroll position on unmount; restore on POP navigation (browser back).
 * On PUSH navigation (clicking a link), scrolls to top.
 *
 * @param key  unique identifier for the page (e.g. "home", "discover")
 * @param ready  true once the page content has rendered enough to scroll to
 */
export function useScrollRestore(key: string, ready: boolean) {
  const navType = useNavigationType()
  const done = useRef(false)

  /* Save current scroll when leaving the page */
  useEffect(() => {
    done.current = false
    return () => {
      try {
        sessionStorage.setItem(SS_PREFIX + key, String(Math.round(window.scrollY)))
      } catch { /* ignore */ }
    }
  }, [key])

  /* Restore (POP) or reset (PUSH) before paint */
  useLayoutEffect(() => {
    if (!ready || done.current) return
    done.current = true

    if (navType === "POP") {
      const raw = sessionStorage.getItem(SS_PREFIX + key)
      if (raw) {
        const y = parseInt(raw, 10)
        if (!isNaN(y) && y > 0) {
          requestAnimationFrame(() => {
            const max = document.documentElement.scrollHeight - window.innerHeight
            window.scrollTo(0, Math.min(y, Math.max(0, max)))
          })
        }
      }
    } else {
      window.scrollTo(0, 0)
    }
  }, [key, ready, navType])
}
