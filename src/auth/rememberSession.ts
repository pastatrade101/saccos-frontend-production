/**
 * "Keep me signed in" preference, set on the sign-in screen.
 *
 * The design handoff introduces this checkbox but only specifies it as UI state
 * — it does not say what a remembered session should actually do. Today the
 * app applies one policy to everyone: Supabase persists the session in
 * localStorage (lib/supabase.ts) and SessionTimeoutManager signs a user out
 * after VITE_SESSION_IDLE_MINUTES (default 15) of inactivity.
 *
 * So this module currently records the member's choice and nothing more.
 * `resolveIdleLimitMs` is the single seam where that choice becomes behaviour;
 * see the TODO there.
 */

const REMEMBER_KEY = "saccos:remember-session";

export function setRememberSession(remember: boolean): void {
    try {
        localStorage.setItem(REMEMBER_KEY, String(remember));
    } catch {
        // Private mode or quota errors: fall back to the default policy.
    }
}

export function isSessionRemembered(): boolean {
    try {
        return localStorage.getItem(REMEMBER_KEY) === "true";
    } catch {
        return false;
    }
}

/**
 * Returns the idle window to enforce for the current session.
 *
 * @param baseIdleLimitMs the configured default (VITE_SESSION_IDLE_MINUTES)
 * @returns the idle window in milliseconds
 *
 * TODO(policy): decide what "Keep me signed in" is worth here. Returning
 * `baseIdleLimitMs` unconditionally — the current behaviour — means the
 * checkbox has no effect on session lifetime.
 */
export function resolveIdleLimitMs(baseIdleLimitMs: number): number {
    return baseIdleLimitMs;
}
