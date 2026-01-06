export type RNFirebaseAuthErrorCode = string;

export type RNFirebaseAuthError = {
  code: RNFirebaseAuthErrorCode;
  message?: string;
  nativeErrorMessage?: string;
  userInfo?: unknown;
};

export function isRNFirebaseAuthError(err: unknown): err is RNFirebaseAuthError {
  if (typeof err !== 'object' || err === null) return false;
  const rec = err as Record<string, unknown>;
  return typeof rec.code === 'string';
}

export function getAuthErrorCode(err: unknown): RNFirebaseAuthErrorCode | undefined {
  return isRNFirebaseAuthError(err) ? err.code : undefined;
}
