const STORAGE_KEY = "ttt:player-token";

/**
 * A per-tab identity used to reclaim the same seat in a room after a page
 * reload or a brief disconnect. sessionStorage (not localStorage) is
 * deliberate: it keeps two tabs on the same machine acting as two distinct
 * players, which is also what makes local multiplayer testing possible.
 */
export function getPlayerToken(): string {
  if (typeof window === "undefined") return "";

  let token = window.sessionStorage.getItem(STORAGE_KEY);
  if (!token) {
    token = crypto.randomUUID();
    window.sessionStorage.setItem(STORAGE_KEY, token);
  }
  return token;
}
