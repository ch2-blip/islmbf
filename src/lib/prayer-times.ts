export interface PrayerTimes {
  fajr: string
  sunrise: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
  date: string
  hijri: string
  city: string
}

export const PRAYER_LABELS: Record<keyof Omit<PrayerTimes, "date" | "hijri" | "city" | "sunrise">, string> = {
  fajr: "晨礼 · 法吉尔",
  dhuhr: "晌礼 · 祖哈尔",
  asr: "晡礼 · 阿斯尔",
  maghrib: "昏礼 · 麦格里布",
  isha: "宵礼 · 伊沙",
}

export async function fetchPrayerTimes(
  city = "Beijing",
  country = "China"
): Promise<PrayerTimes | null> {
  try {
    const res = await fetch(
      `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=2`
    )
    if (!res.ok) return null
    const data = await res.json()
    const t = data.data.timings
    return {
      fajr: t.Fajr,
      sunrise: t.Sunrise,
      dhuhr: t.Dhuhr,
      asr: t.Asr,
      maghrib: t.Maghrib,
      isha: t.Isha,
      date: data.data.date.readable,
      hijri: `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year}`,
      city,
    }
  } catch {
    return null
  }
}

export function getNextPrayer(times: PrayerTimes): { name: string; time: string } {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const prayers: Array<[keyof typeof PRAYER_LABELS, string]> = [
    ["fajr", times.fajr],
    ["dhuhr", times.dhuhr],
    ["asr", times.asr],
    ["maghrib", times.maghrib],
    ["isha", times.isha],
  ]
  for (const [key, time] of prayers) {
    const [h, m] = time.split(":").map(Number)
    if (h * 60 + m > currentMinutes) {
      return { name: PRAYER_LABELS[key], time }
    }
  }
  return { name: PRAYER_LABELS.fajr + "（次日）", time: times.fajr }
}
