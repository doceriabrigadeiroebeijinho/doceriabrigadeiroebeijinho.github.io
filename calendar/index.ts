let busyUrl: string | undefined;
let busySecret: string | undefined;

export function setCalendarConfig(url?: string, secret?: string) {
  busyUrl = url?.trim() || undefined;
  busySecret = secret?.trim() || undefined;
}

export function getCalendarConfig() {
  return {
    url:
      busyUrl ||
      process.env.GOOGLE_APPS_SCRIPT_URL?.trim() ||
      process.env.GOOGLE_CALENDAR_BUSY_URL?.trim() ||
      undefined,
    secret:
      busySecret ||
      process.env.GOOGLE_APPS_SCRIPT_SECRET?.trim() ||
      process.env.GOOGLE_CALENDAR_BUSY_SECRET?.trim() ||
      undefined,
  };
}
