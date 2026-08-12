import PieChartRoundedIcon from "@mui/icons-material/PieChartRounded";
import {
    Alert,
    Box,
    Button,
    CardContent,
    Chip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../auth/AuthContext";
import { AppLoader } from "../components/AppLoader";
import { useToast } from "../components/Toast";
import { api, getApiErrorMessage } from "../lib/api";
import {
    endpoints,
    type SavingsToSharesPlan,
    type SavingsToSharesPlanResponse,
    type SavingsToSharesRow,
    type SavingsToSharesRunResponse
} from "../lib/endpoints";
import { MotionCard } from "../ui/motion";
import { formatCurrency } from "../utils/format";

const statusTone: Record<SavingsToSharesRow["status"], "success" | "warning" | "error" | "default"> = {
    ready: "success",
    partial: "warning",
    blocked: "error",
    complete: "default"
};

/**
 * Moves share capital out of members' savings and into their share accounts.
 *
 * ILBORU collected share capital into savings from the beginning, so every
 * member's share account read zero while they held the money in savings. This
 * page posts the correction — and, because it can move a hundred million in one
 * click, it will not post anything until the plan has been looked at.
 */
export function ShareCapitalTransferPage() {
    const { profile, selectedTenantId } = useAuth();
    const { pushToast } = useToast();
    const [plan, setPlan] = useState<SavingsToSharesPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Typed back to confirm a bulk run. A dialog that only needs "OK" is
    // clicked through; a figure that has to be copied is read first.
    const [confirmation, setConfirmation] = useState("");

    const canPost = profile?.role === "super_admin";

    const loadPlan = useCallback(async () => {
        if (!selectedTenantId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data } = await api.get<SavingsToSharesPlanResponse>(
                endpoints.finance.savingsToSharesPlan(),
                { params: { tenant_id: selectedTenantId } }
            );
            setPlan(data.data);
        } catch (loadError) {
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, [selectedTenantId]);

    useEffect(() => {
        void loadPlan();
    }, [loadPlan]);

    const runBulk = async () => {
        if (!selectedTenantId || !plan) return;

        setPosting(true);
        setError(null);

        try {
            const { data } = await api.post<SavingsToSharesRunResponse>(
                endpoints.finance.savingsToSharesBulk(),
                { tenant_id: selectedTenantId, dry_run: false, notify: false }
            );
            pushToast({
                type: data.data.failed ? "error" : "success",
                title: data.data.failed ? "Posted with failures" : "Share capital moved",
                message: `${data.data.posted} member${data.data.posted === 1 ? "" : "s"} · ${formatCurrency(data.data.moved)}`
                    + (data.data.failed ? ` · ${data.data.failed} failed` : "")
            });
            setConfirmation("");
            await loadPlan();
        } catch (postError) {
            setError(getApiErrorMessage(postError));
        } finally {
            setPosting(false);
        }
    };

    const runOne = async (row: SavingsToSharesRow) => {
        if (!selectedTenantId) return;

        setPosting(true);
        setError(null);

        try {
            await api.post(endpoints.finance.savingsToShares(), {
                tenant_id: selectedTenantId,
                member_id: row.member_id,
                amount: row.movable
            });
            pushToast({
                type: "success",
                title: "Share capital moved",
                message: `${row.member_name} · ${formatCurrency(row.movable)}`
            });
            await loadPlan();
        } catch (postError) {
            setError(getApiErrorMessage(postError));
        } finally {
            setPosting(false);
        }
    };

    if (loading) {
        return <AppLoader message="Working out what each member still owes" />;
    }

    const totals = plan?.totals;
    const movableLabel = totals ? String(Math.round(totals.movable)) : "";
    const nothingToDo = !totals || totals.movable <= 0;

    return (
        <Stack spacing={2}>
            {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}

            <MotionCard variant="outlined" inView>
                <CardContent>
                    <Stack spacing={2}>
                        <Stack spacing={0.75}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                <PieChartRoundedIcon color="primary" />
                                <Typography variant="h5">Move Share Capital From Savings</Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                                Share capital has always been collected into savings, so share accounts read zero. This moves each member's share capital across. No cash is involved and no member is notified — the money never leaves their hands, it only changes account.
                            </Typography>
                        </Stack>

                        {totals ? (
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip label={`${totals.members} members`} variant="outlined" />
                                <Chip
                                    label={`${formatCurrency(totals.movable)} to move`}
                                    color={totals.movable > 0 ? "primary" : "default"}
                                    variant="outlined"
                                />
                                <Chip label={`${totals.complete} already complete`} variant="outlined" />
                                {totals.short > 0 ? (
                                    <Chip label={`${totals.short} short or blocked`} color="warning" variant="outlined" />
                                ) : null}
                            </Stack>
                        ) : null}

                        {nothingToDo ? (
                            <Alert severity="success" variant="outlined">
                                Every member's share capital is already in their share account. Nothing to move.
                            </Alert>
                        ) : (
                            <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Post all {plan?.rows.filter((row) => row.movable > 0).length} transfers
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Type <strong>{movableLabel}</strong> to confirm. This posts to the ledger and cannot be undone from this page.
                                </Typography>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
                                    <TextField
                                        size="small"
                                        label="Amount to confirm"
                                        value={confirmation}
                                        onChange={(event) => setConfirmation(event.target.value)}
                                        disabled={!canPost || posting}
                                        sx={{ maxWidth: 220 }}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={runBulk}
                                        disabled={!canPost || posting || confirmation.trim() !== movableLabel}
                                    >
                                        {posting ? "Posting..." : "Post All Transfers"}
                                    </Button>
                                </Stack>
                                {!canPost ? (
                                    <Alert severity="info" variant="outlined" sx={{ mt: 1.5, py: 0.25 }}>
                                        Only a super admin can post these.
                                    </Alert>
                                ) : null}
                            </Box>
                        )}
                    </Stack>
                </CardContent>
            </MotionCard>

            <MotionCard variant="outlined" inView>
                <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                        Member by member
                    </Typography>
                    <Box sx={{ overflowX: "auto" }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Member</TableCell>
                                    <TableCell align="right">Required</TableCell>
                                    <TableCell align="right">In shares</TableCell>
                                    <TableCell align="right">Savings</TableCell>
                                    <TableCell align="right">To move</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(plan?.rows || []).map((row) => (
                                    <TableRow key={row.member_id} hover>
                                        <TableCell>
                                            <Typography variant="body2">{row.member_name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {row.member_no} · {row.required_shares} × {formatCurrency(row.price_per_share)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">{formatCurrency(row.required)}</TableCell>
                                        <TableCell align="right">
                                            {row.share_balance === null ? "—" : formatCurrency(row.share_balance)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {row.savings_balance === null ? "—" : formatCurrency(row.savings_balance)}
                                            {row.encumbered > 0 ? (
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {formatCurrency(row.encumbered)} pledged
                                                </Typography>
                                            ) : null}
                                        </TableCell>
                                        <TableCell align="right">
                                            <strong>{row.movable > 0 ? formatCurrency(row.movable) : "—"}</strong>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={row.status}
                                                color={statusTone[row.status]}
                                                variant="outlined"
                                            />
                                            {row.reason ? (
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {row.reason}
                                                </Typography>
                                            ) : null}
                                        </TableCell>
                                        <TableCell align="right">
                                            {row.movable > 0 ? (
                                                <Button
                                                    size="small"
                                                    onClick={() => runOne(row)}
                                                    disabled={!canPost || posting}
                                                >
                                                    Move
                                                </Button>
                                            ) : null}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                </CardContent>
            </MotionCard>
        </Stack>
    );
}
