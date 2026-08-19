/**
 * Dev-time warning helper.
 *
 * Every message is emitted at most once per key for the life of the JS context,
 * so a warning raised from a component that re-renders 60 times a second still
 * costs one console line rather than sixty.
 */

const seen = new Set<string>();

/** Emit `message` once for `key`. Subsequent calls with the same key are dropped. */
export function warnOnce(key: string, message: string): void {
  if (seen.has(key)) return;
  seen.add(key);
  console.warn(`[react-native-liquid-glassmorphism] ${message}`);
}

/**
 * Forget every emitted key.
 *
 * Only for tests — a fresh JS context is what resets this in a real app.
 */
export function resetWarnOnce(): void {
  seen.clear();
}
