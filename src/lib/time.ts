const dateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const clockFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Shanghai",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function shanghaiDate(now: Date): string {
  return dateFormat.format(now);
}

export function shanghaiDayLabel(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(Date.UTC(year, month - 1, date)));
}

export function shanghaiClock(now: Date): string {
  return clockFormat.format(now);
}

export function addShanghaiDays(day: string, days: number): string {
  const [year, month, date] = day.split("-").map(Number);
  const noonUtc = Date.UTC(year, month - 1, date, 12, 0, 0);
  return shanghaiDate(new Date(noonUtc + days * 24 * 60 * 60 * 1000));
}
