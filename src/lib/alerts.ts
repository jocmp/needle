export const ALERTS = {
  "invalid-credentials": "Invalid email or password",
  "passwords-mismatch": "Passwords do not match",
  "email-taken": "Email already registered",
  "invalid-input": "Invalid input",
  "registration-disabled": "Registration is not available",
  "account-not-found":
    "This account could not be located. The proprietor may not have enabled federation.",
  "feed-error": "Error fetching feed",
  "invalid-handle": "Invalid handle",
  "refresh-error": "Error refreshing feed",
} as const;

export type AlertCode = keyof typeof ALERTS;

export function getAlert(code: string | undefined): string | undefined {
  if (!code) return undefined;
  return ALERTS[code as AlertCode];
}

export function alertUrl(path: string, code: AlertCode): string {
  return `${path}?alert=${code}`;
}
