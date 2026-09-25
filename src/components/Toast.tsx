import { Alert, Button, Snackbar, Stack } from "@mui/material";
import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
    id: number;
    title: string;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    pushToast: (toast: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const AUTO_DISMISS_MS = 4500;

/**
 * Whether a toast waits to be acknowledged instead of timing itself out.
 *
 * Everything used to vanish after 4.5 seconds, including the message telling a
 * member why their loan application was refused. A member who looked away, or
 * whose eye was still on the form, was left with a form that had not worked
 * and no reason given — and there is no way to ask for the message back.
 *
 * So anything that reports a failure or a warning now stays until the person
 * presses OK. A success or a note still leaves on its own: those confirm what
 * somebody just did, and holding them on screen would only make them press OK
 * to clear their own good news.
 */
const requiresAcknowledgement = (type: ToastType) => type === "error" || type === "warning";

export function ToastProvider({ children }: PropsWithChildren) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const dismiss = useCallback((id: number) => {
        setToasts((current) => current.filter((item) => item.id !== id));
    }, []);

    const value = useMemo<ToastContextValue>(() => ({
        pushToast: (toast) => {
            const id = Date.now() + Math.random();
            setToasts((current) => [...current, { ...toast, id }]);

            if (!requiresAcknowledgement(toast.type)) {
                window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
            }
        }
    }), [dismiss]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            {/* One Snackbar holding the stack, rather than one per toast: the
                separate Snackbars were all anchored to the same corner and sat
                on top of each other. That was survivable while each cleared
                itself after a few seconds; it is not, now that an error waits
                for the reader. */}
            <Snackbar
                open={toasts.length > 0}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                sx={{ maxWidth: "100%" }}
            >
                <Stack spacing={1} sx={{ width: { xs: "calc(100vw - 32px)", sm: 380 }, maxWidth: "100%" }}>
                    {toasts.map((toast) => {
                        const sticky = requiresAcknowledgement(toast.type);
                        return (
                            <Alert
                                key={toast.id}
                                severity={toast.type}
                                variant="filled"
                                sx={{ width: "100%" }}
                                onClose={sticky ? undefined : () => dismiss(toast.id)}
                                action={sticky ? (
                                    <Button
                                        size="small"
                                        color="inherit"
                                        variant="outlined"
                                        onClick={() => dismiss(toast.id)}
                                        sx={{ fontWeight: 700, alignSelf: "center" }}
                                    >
                                        OK
                                    </Button>
                                ) : undefined}
                            >
                                <strong>{toast.title}</strong>
                                <div>{toast.message}</div>
                            </Alert>
                        );
                    })}
                </Stack>
            </Snackbar>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }

    return context;
}
