import { useCallback, useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { api, getApiErrorMessage } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "./Toast";

interface NplStatus {
    due: boolean;
    npl_loans: number;
    target_suspense: number | string;
    current_suspense: number | string;
    to_suspend: number | string;
    as_of: string;
}

// Only these roles get the month-end reminder popup. The "Run" action is gated to
// super_admin (it posts GL); a branch manager is reminded but asked to have an admin run it.
const REMINDER_ROLES = ["super_admin", "branch_manager"];

function currentPeriod(): string {
    return new Date().toISOString().slice(0, 7);
}

function dismissKey(period: string): string {
    return `npl-reclass-dismissed:${period}`;
}

function formatTzs(value: number | string): string {
    const amount = Math.round(Number(value) || 0);
    return `TZS ${new Intl.NumberFormat("en-US").format(amount)}`;
}

// Month-end reminder that the NPL interest -> suspense reclassification is due. Shows once
// per browser session (dismissible), reappears next login until the reclassification is run
// (at which point the backend reports due=false and it stops).
export function PeriodEndReclassDialog() {
    const { profile } = useAuth();
    const { pushToast } = useToast();
    const [status, setStatus] = useState<NplStatus | null>(null);
    const [open, setOpen] = useState(false);
    const [running, setRunning] = useState(false);

    const role = profile?.role;
    const tenantId = profile?.tenant_id;
    const canRun = role === "super_admin";
    const period = currentPeriod();

    useEffect(() => {
        if (!tenantId || !role || !REMINDER_ROLES.includes(role)) {
            return;
        }
        if (sessionStorage.getItem(dismissKey(period))) {
            return;
        }
        let active = true;
        (async () => {
            try {
                const res = await api.get(endpoints.finance.nplReclassStatus());
                const data = res.data?.data as NplStatus | undefined;
                if (active && data?.due) {
                    setStatus(data);
                    setOpen(true);
                }
            } catch {
                // A reminder popup must never block the app; stay silent on error.
            }
        })();
        return () => {
            active = false;
        };
    }, [tenantId, role, period]);

    const dismiss = useCallback(() => {
        sessionStorage.setItem(dismissKey(period), "1");
        setOpen(false);
    }, [period]);

    const runReclass = useCallback(async () => {
        setRunning(true);
        try {
            const res = await api.post(endpoints.finance.nplReclassRun(), {});
            const data = res.data?.data;
            const moved = data?.reclassified ?? data?.to_suspend ?? 0;
            pushToast({
                type: "success",
                title: "Reclassification posted",
                message: data?.code === "NO_CHANGE"
                    ? "Nothing to reclassify — suspense is already up to date."
                    : `Moved ${formatTzs(moved)} of NPL interest to suspense.`
            });
            sessionStorage.setItem(dismissKey(period), "1");
            setOpen(false);
        } catch (error) {
            pushToast({ type: "error", title: "Reclassification failed", message: getApiErrorMessage(error) });
        } finally {
            setRunning(false);
        }
    }, [period, pushToast]);

    if (!open || !status) {
        return null;
    }

    return (
        <Dialog open={open} onClose={dismiss} maxWidth="xs" fullWidth>
            <DialogTitle>Month-end task due</DialogTitle>
            <DialogContent>
                <DialogContentText component="div">
                    The <strong>NPL interest reclassification</strong> is due for {period}.
                    <Box sx={{ mt: 1.5 }}>
                        {formatTzs(status.to_suspend)} of interest on {status.npl_loans}{" "}
                        non-performing loan{status.npl_loans === 1 ? "" : "s"} should be moved to
                        interest-in-suspense before closing the month.
                    </Box>
                    {!canRun && (
                        <Box sx={{ mt: 1.5, fontStyle: "italic" }}>
                            Please have an administrator run it from Finance.
                        </Box>
                    )}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={dismiss} color="inherit" disabled={running}>
                    {canRun ? "Remind me later" : "Got it"}
                </Button>
                {canRun && (
                    <Button
                        onClick={runReclass}
                        variant="contained"
                        disabled={running}
                        startIcon={running ? <CircularProgress size={16} color="inherit" /> : undefined}
                    >
                        {running ? "Running…" : "Run reclassification"}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
