export const REQUIRED_ENV = [
  "APP_PASSWORD",
  "SESSION_SECRET",
  "DATABASE_URL",
  "DEEPSEEK_API_KEY",
  "CRON_SECRET",
  "R2_ACCOUNT_ID",
  "R2_BUCKET",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_ENDPOINT",
] as const;

export function missingEnv(source: Record<string, string | undefined>): string[] {
  return REQUIRED_ENV.filter((key) => !source[key]);
}
