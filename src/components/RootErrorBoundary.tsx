import { Component, type ErrorInfo, type ReactNode } from "react";

import { AppLoader } from "./AppLoader";

// Records the last automatic reload so a genuinely broken build can't loop.
const RELOAD_KEY = "saccos:chunk-reload-at";
const RELOAD_COOLDOWN_MS = 10000;

/**
 * A failed dynamic import (lazy route) throws an error like
 * "Failed to fetch dynamically imported module" or "Loading chunk N failed".
 * This happens to tabs opened before a new deploy: their index.html references
 * chunk filenames that no longer exist on the server.
 */
function isChunkLoadError(error: unknown): boolean {
    const text = error instanceof Error ? `${error.name} ${error.message}` : String(error);
    return /loading chunk|loading css chunk|dynamically imported module|importing a module script failed|chunkloaderror|failed to fetch dynamically/i.test(
        text
    );
}

interface State {
    error: Error | null;
    reloading: boolean;
}

/**
 * Catches render/load errors below it. For stale-chunk failures (typically after
 * a deploy) it forces a single full reload to pull fresh assets — fixing the
 * blank screen users would otherwise see on lazy routes such as /signin after
 * signing out. For any other error it shows a recoverable fallback.
 */
export class RootErrorBoundary extends Component<{ children: ReactNode }, State> {
    state: State = { error: null, reloading: false };

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { error };
    }

    componentDidCatch(error: Error, _info: ErrorInfo) {
        if (!isChunkLoadError(error)) {
            return;
        }

        // Only auto-reload if we haven't just done so, so a truly broken deploy
        // surfaces the fallback instead of reloading forever.
        let last = 0;
        try {
            last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
        } catch {
            last = 0;
        }

        if (Date.now() - last > RELOAD_COOLDOWN_MS) {
            try {
                sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
            } catch {
                // Ignore storage failures and still attempt the reload.
            }
            this.setState({ reloading: true });
            window.location.reload();
        }
    }

    handleReload = () => {
        try {
            sessionStorage.removeItem(RELOAD_KEY);
        } catch {
            // Ignore — the reload below is what matters.
        }
        window.location.reload();
    };

    render() {
        const { error, reloading } = this.state;

        if (!error) {
            return this.props.children;
        }

        // A reload is already in flight for a stale-chunk error.
        if (reloading || isChunkLoadError(error)) {
            return <AppLoader message="Updating to the latest version..." />;
        }

        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1rem",
                    padding: "2rem",
                    textAlign: "center",
                    fontFamily: "system-ui, sans-serif"
                }}
            >
                <h2 style={{ margin: 0 }}>Something went wrong</h2>
                <p style={{ margin: 0, color: "#64748b", maxWidth: 420 }}>
                    The page failed to load. Please reload to continue.
                </p>
                <button
                    type="button"
                    onClick={this.handleReload}
                    style={{
                        padding: "0.6rem 1.4rem",
                        borderRadius: "0.6rem",
                        border: "none",
                        background: "#1d4ed8",
                        color: "#fff",
                        fontWeight: 600,
                        cursor: "pointer"
                    }}
                >
                    Reload
                </button>
            </div>
        );
    }
}
