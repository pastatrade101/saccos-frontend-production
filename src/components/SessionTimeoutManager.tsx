import { useCallback, useEffect, useRef, useState } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    LinearProgress,
    Stack,
    Typography
} from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";

import { useAuth } from "../auth/AuthContext";
import { useToast } from "./Toast";

// How long a signed-in user can stay idle before being signed out, and how long
// the warning countdown runs before that happens. Both are tunable per-deploy
// via Vite env vars without a code change.
const IDLE_MINUTES = Number(import.meta.env.VITE_SESSION_IDLE_MINUTES) || 15;
const WARNING_SECONDS = Number(import.meta.env.VITE_SESSION_WARNING_SECONDS) || 60;

const IDLE_LIMIT_MS = Math.max(60, IDLE_MINUTES * 60) * 1000;
// Warning can never exceed the idle window itself.
const WARNING_MS = Math.min(Math.max(10, WARNING_SECONDS), IDLE_MINUTES * 60 - 5) * 1000;
const WARNING_TOTAL_SECONDS = Math.round(WARNING_MS / 1000);

// Shared across tabs so activity (or a sign-out) in one tab keeps the others in sync.
const ACTIVITY_KEY = "saccos:lastActivity";
const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"] as const;

function readStoredActivity(): number {
    try {
        const value = Number(localStorage.getItem(ACTIVITY_KEY));
        return Number.isFinite(value) && value > 0 ? value : 0;
    } catch {
        return 0;
    }
}

function writeStoredActivity(value: number): void {
    try {
        localStorage.setItem(ACTIVITY_KEY, String(value));
    } catch {
        // Private-mode or quota errors: fall back to the in-memory ref only.
    }
}

/**
 * Watches for user inactivity and, for every signed-in user, shows a countdown
 * warning in the final {WARNING_SECONDS} before automatically signing them out.
 * Mounted once near the app root so it covers staff, auditors and members alike.
 */
export function SessionTimeoutManager() {
    const { session, signOut } = useAuth();
    const { pushToast } = useToast();

    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

    const lastActivityRef = useRef<number>(Date.now());
    const lastRecordedRef = useRef<number>(0);
    const warningActiveRef = useRef<boolean>(false);
    const loggingOutRef = useRef<boolean>(false);

    // Record activity, throttled to once per second. Ignored while the warning is
    // up so the dialog must be acknowledged explicitly (a stray mousemove won't
    // silently dismiss it).
    const recordActivity = useCallback(() => {
        if (warningActiveRef.current) {
            return;
        }
        const now = Date.now();
        // If the session has already been idle past the limit (e.g. the laptop just
        // woke from an overnight sleep), a stray mousemove must NOT revive it — let
        // the interval finalize the sign-out on its next tick.
        if (now - lastActivityRef.current >= IDLE_LIMIT_MS) {
            return;
        }
        if (now - lastRecordedRef.current < 1000) {
            return;
        }
        lastRecordedRef.current = now;
        lastActivityRef.current = now;
        writeStoredActivity(now);
    }, []);

    const extendSession = useCallback(() => {
        warningActiveRef.current = false;
        const now = Date.now();
        lastActivityRef.current = now;
        lastRecordedRef.current = now;
        writeStoredActivity(now);
        setSecondsLeft(null);
    }, []);

    const signOutNow = useCallback((dueToInactivity: boolean) => {
        if (loggingOutRef.current) {
            return;
        }
        loggingOutRef.current = true;
        warningActiveRef.current = false;
        setSecondsLeft(null);
        if (dueToInactivity) {
            pushToast({
                type: "info",
                title: "Signed out",
                message: "You were signed out because the session was idle. Please sign in again."
            });
        }
        void signOut();
    }, [pushToast, signOut]);

    useEffect(() => {
        if (!session?.user?.id) {
            // Reset everything when there is no active session.
            warningActiveRef.current = false;
            loggingOutRef.current = false;
            setSecondsLeft(null);
            return;
        }

        loggingOutRef.current = false;
        // Honour the last recorded activity so an idle gap survives page reloads,
        // token refreshes, and sleep/wake. Only start fresh ("now") when there is
        // no stored timestamp at all (a clean login clears it on sign-out). Using
        // Math.max(now, stored) here was the bug: stored is always in the past, so
        // it reset the clock to "now" on every token refresh and the session never
        // expired after the laptop slept overnight.
        const stored = readStoredActivity();
        lastActivityRef.current = stored > 0 ? stored : Date.now();
        writeStoredActivity(lastActivityRef.current);

        ACTIVITY_EVENTS.forEach((evt) =>
            window.addEventListener(evt, recordActivity, { passive: true })
        );

        const interval = window.setInterval(() => {
            if (loggingOutRef.current) {
                return;
            }

            // Honour activity from any tab via the shared timestamp.
            const stored = readStoredActivity();
            if (stored > lastActivityRef.current && !warningActiveRef.current) {
                lastActivityRef.current = stored;
            }

            const remaining = IDLE_LIMIT_MS - (Date.now() - lastActivityRef.current);

            if (remaining <= 0) {
                signOutNow(true);
                return;
            }

            if (remaining <= WARNING_MS) {
                warningActiveRef.current = true;
                setSecondsLeft(Math.max(1, Math.ceil(remaining / 1000)));
            } else if (warningActiveRef.current) {
                warningActiveRef.current = false;
                setSecondsLeft(null);
            }
        }, 1000);

        return () => {
            window.clearInterval(interval);
            ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, recordActivity));
        };
        // Keyed on the user identity, NOT the whole session object: Supabase emits a
        // brand-new session on every silent token refresh (and on wake), and
        // re-running this effect then would reset the idle clock. The user id is
        // stable across refreshes, so the idle timer keeps counting through them.
    }, [session?.user?.id, recordActivity, signOutNow]);

    const open = secondsLeft !== null;
    const progress = secondsLeft === null
        ? 0
        : Math.min(100, Math.max(0, (secondsLeft / WARNING_TOTAL_SECONDS) * 100));

    return (
        <Dialog
            open={open}
            // Force an explicit choice — no backdrop/escape dismissal.
            onClose={() => undefined}
            disableEscapeKeyDown
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AccessTimeRoundedIcon color="warning" />
                Session about to expire
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                        You&apos;ve been inactive for a while. For your security you&apos;ll be
                        signed out automatically when the timer reaches zero.
                    </Typography>
                    <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h3" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
                            {secondsLeft ?? 0}s
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            color={secondsLeft !== null && secondsLeft <= 10 ? "error" : "warning"}
                            sx={{ mt: 1, height: 8, borderRadius: 1 }}
                        />
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button color="inherit" onClick={() => signOutNow(false)}>
                    Sign out now
                </Button>
                <Button variant="contained" onClick={extendSession} autoFocus>
                    Stay signed in
                </Button>
            </DialogActions>
        </Dialog>
    );
}
