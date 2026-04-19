const HIJRI_MONTHS = [
  "穆哈兰姆", "色法尔", "赖比尔·敖外鲁", "赖比尔·阿色尼",
  "主马达·敖外鲁", "主马达·阿色尼", "赖哲卜", "舍尔巴乃",
  "莱麦丹", "闪瓦鲁", "都尔喀尔德", "都尔黑哲",
]

export function toHijri(date: Date = new Date()): {
  year: number
  month: number
  day: number
  monthName: string
  formatted: string
} {
  const jd = gregorianToJD(date.getFullYear(), date.getMonth() + 1, date.getDate())
  const { year, month, day } = jdToHijri(jd)
  return {
    year,
    month,
    day,
    monthName: HIJRI_MONTHS[month - 1],
    formatted: `${year} 年 ${HIJRI_MONTHS[month - 1]} ${day} 日`,
  }
}

function gregorianToJD(year: number, month: number, day: number): number {
  if (month < 3) {
    year -= 1
    month += 12
  }
  const a = Math.floor(year / 100)
  const b = 2 - a + Math.floor(a / 4)
  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day + b - 1524.5
  )
}

function jdToHijri(jd: number): { year: number; month: number; day: number } {
  jd = Math.floor(jd) + 0.5
  const year = Math.floor((30 * (jd - 1948439.5) + 10646) / 10631)
  const month = Math.min(
    12,
    Math.ceil((jd - (29 + hijriToJD(year, 1, 1))) / 29.5) + 1
  )
  const day = Math.floor(jd - hijriToJD(year, month, 1)) + 1
  return { year, month, day }
}

function hijriToJD(year: number, month: number, day: number): number {
  return (
    day +
    Math.ceil(29.5 * (month - 1)) +
    (year - 1) * 354 +
    Math.floor((3 + 11 * year) / 30) +
    1948439.5 -
    1
  )
}

export function formatGregorian(date: Date = new Date()): string {
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"]
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d} 周${weekdays[date.getDay()]}`
}

export function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return "刚刚"
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 2592000) return `${Math.floor(diff / 86400)} 天前`
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} 个月前`
  return `${Math.floor(diff / 31536000)} 年前`
}
