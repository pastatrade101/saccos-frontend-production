import PieChartRoundedIcon from "@mui/icons-material/PieChartRounded";
import {
    Alert,
    Autocomplete,
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
    type SavingsToSharesRunResponse,
    type SharesToSavingsResponse
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
    // Single-member transfer: any member, any amount, independent of whether
    // they still owe share capital.
    const [oneMember, setOneMember] = useState<SavingsToSharesRow | null>(null);
    const [oneAmount, setOneAmount] = useState("");
    // The reverse movement: share capital back out into savings. Separate state
    // from the forward form on purpose — these are opposite postings and a
    // shared amount field would let a mis-click send the figure the wrong way.
    const [backMember, setBackMember] = useState<SavingsToSharesRow | null>(null);
    const [backAmount, setBackAmount] = useState("");
    const [backReason, setBackReason] = useState("");

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

    /// Posts one member's transfer.
    ///
    /// The amount is a parameter rather than always row.movable: the table
    /// moves the shortfall, while the single-member form moves whatever figure
    /// was typed — which is how a member converts extra savings into shares
    /// once their requirement is already met.
    const postTransfer = async (member: SavingsToSharesRow, amount: number) => {
        if (!selectedTenantId) return;

        setPosting(true);
        setError(null);

        try {
            await api.post(endpoints.finance.savingsToShares(), {
                tenant_id: selectedTenantId,
                member_id: member.member_id,
                amount
            });
            pushToast({
                type: "success",
                title: "Share capital moved",
                message: `${member.member_name} · ${formatCurrency(amount)}`
            });
            setOneMember(null);
            setOneAmount("");
            await loadPlan();
        } catch (postError) {
            setError(getApiErrorMessage(postError));
        } finally {
            setPosting(false);
        }
    };

    /// Posts one member's release: share account down, savings up.
    ///
    /// The reason travels with it because the server requires one. It is the
    /// only thing that will explain a fall in share capital to whoever reads
    /// the ledger later.
    const postRelease = async () => {
        if (!selectedTenantId || !backMember) return;

        setPosting(true);
        setError(null);

        try {
            const { data } = await api.post<SharesToSavingsResponse>(endpoints.finance.sharesToSavings(), {
                tenant_id: selectedTenantId,
                member_id: backMember.member_id,
                amount: Number(backAmount),
                reason: backReason.trim()
            });
            const left = data.data.share_capital_required === null
                ? null
                : data.data.share_capital_required - data.data.share_balance;
            pushToast({
                type: "success",
                title: "Share capital returned to savings",
                // The shortfall it created, said out loud. A release that leaves
                // a member short is allowed here, but it should not be quiet.
                message: `${data.data.member_name} · ${formatCurrency(data.data.amount)}`
                    + (left !== null && left > 0 ? ` · now ${formatCurrency(left)} short of the requirement` : "")
            });
            setBackMember(null);
            setBackAmount("");
            setBackReason("");
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

    // Mirrors what the server will refuse, so the button explains itself rather
    // than failing after the click. The server remains the authority — these
    // balances are as of the last plan load.
    const oneAmountValue = Number(oneAmount);
    const oneAvailable = oneMember
        ? Math.max(0, (oneMember.savings_balance ?? 0) - (oneMember.encumbered || 0))
        : 0;
    const oneAmountError = (() => {
        if (!oneMember || oneAmount.trim() === "") return null;
        if (!Number.isFinite(oneAmountValue) || oneAmountValue <= 0) return "Enter an amount above zero.";
        if (oneMember.savings_balance === null) return "This member has no active savings account.";
        if (oneAmountValue > oneAvailable) return `Only ${formatCurrency(oneAvailable)} can be moved.`;
        return null;
    })();

    // Same idea for the reverse form. Nothing is checked against the
    // requirement: moving a member below it is permitted, so the requirement is
    // shown rather than enforced.
    const backAmountValue = Number(backAmount);
    const backHeld = backMember?.share_balance ?? 0;
    const backAmountError = (() => {
        if (!backMember || backAmount.trim() === "") return null;
        if (!Number.isFinite(backAmountValue) || backAmountValue <= 0) return "Enter an amount above zero.";
        if (backMember.share_balance === null) return "This member has no active share account.";
        if (backMember.savings_balance === null) return "This member has no active savings account.";
        if (backAmountValue > backHeld) return `Only ${formatCurrency(backHeld)} is held in shares.`;
        return null;
    })();
    const backReasonError = backReason.trim() !== "" && backReason.trim().length < 3
        ? "Give a reason of at least three characters."
        : null;
    // What the member would be left short by. Computed for the warning only.
    const backShortfallAfter = backMember && !backAmountError && backAmountValue > 0
        ? Math.max(0, backMember.required - (backHeld - backAmountValue))
        : 0;
    const backReady = Boolean(
        canPost && !posting && backMember && backAmountValue > 0
        && !backAmountError && backReason.trim().length >= 3
    );

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
                    <Stack spacing={1.5}>
                        <Stack spacing={0.5}>
                            <Typography variant="subtitle2">Transfer for one member</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Pick a member and type the amount. This is not limited to what they still owe — it moves whatever you enter from their savings into their share account.
                            </Typography>
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "flex-start" }}>
                            <Autocomplete
                                size="small"
                                sx={{ minWidth: 300, flexGrow: 1 }}
                                options={plan?.rows || []}
                                value={oneMember}
                                getOptionLabel={(option) => `${option.member_name} (${option.member_no})`}
                                isOptionEqualToValue={(option, current) => option.member_id === current.member_id}
                                onChange={(_event, option) => {
                                    setOneMember(option);
                                    // Their shortfall is the likeliest figure, so it is offered
                                    // — but only as a starting value, still editable.
                                    setOneAmount(option && option.movable > 0 ? String(Math.round(option.movable)) : "");
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Member" placeholder="Search by name or number" />
                                )}
                            />
                            <TextField
                                size="small"
                                type="number"
                                label="Amount (TZS)"
                                value={oneAmount}
                                onChange={(event) => setOneAmount(event.target.value)}
                                disabled={!oneMember || !canPost || posting}
                                sx={{ maxWidth: { md: 200 } }}
                                error={Boolean(oneAmountError)}
                                helperText={oneAmountError || " "}
                            />
                            <Button
                                variant="contained"
                                onClick={() => oneMember && postTransfer(oneMember, oneAmountValue)}
                                disabled={!canPost || posting || !oneMember || !oneAmountValue || Boolean(oneAmountError)}
                                sx={{ mt: { md: 0.1 } }}
                            >
                                {posting ? "Posting..." : "Move To Shares"}
                            </Button>
                        </Stack>

                        {oneMember ? (
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip size="small" variant="outlined" label={`Savings ${oneMember.savings_balance === null ? "—" : formatCurrency(oneMember.savings_balance)}`} />
                                <Chip size="small" variant="outlined" label={`In shares ${oneMember.share_balance === null ? "—" : formatCurrency(oneMember.share_balance)}`} />
                                <Chip size="small" variant="outlined" label={`Required ${formatCurrency(oneMember.required)}`} />
                                {oneMember.encumbered > 0 ? (
                                    <Chip size="small" variant="outlined" color="warning" label={`${formatCurrency(oneMember.encumbered)} pledged as guarantee`} />
                                ) : null}
                            </Stack>
                        ) : null}

                        {!canPost ? (
                            <Alert severity="info" variant="outlined" sx={{ py: 0.25 }}>
                                Only a super admin can post these.
                            </Alert>
                        ) : null}
                    </Stack>
                </CardContent>
            </MotionCard>

            <MotionCard variant="outlined" inView>
                <CardContent>
                    <Stack spacing={1.5}>
                        <Stack spacing={0.5}>
                            <Typography variant="subtitle2">Return share capital to savings</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Moves money the other way — out of a member's share account and back into their savings. No cash is involved; the money stays with the member, it only changes account. Use this to undo a transfer posted in error, or to release share capital to a member who is staying on.
                            </Typography>
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "flex-start" }}>
                            <Autocomplete
                                size="small"
                                sx={{ minWidth: 260, flexGrow: 1 }}
                                options={(plan?.rows || []).filter((row) => (row.share_balance ?? 0) > 0)}
                                value={backMember}
                                getOptionLabel={(option) => `${option.member_name} (${option.member_no})`}
                                isOptionEqualToValue={(option, current) => option.member_id === current.member_id}
                                onChange={(_event, option) => {
                                    setBackMember(option);
                                    // No figure is offered. The forward form can
                                    // suggest the shortfall because there is one
                                    // right answer; here there is none, and a
                                    // prefilled amount would get posted.
                                    setBackAmount("");
                                    setBackReason("");
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Member" placeholder="Only members holding shares" />
                                )}
                            />
                            <TextField
                                size="small"
                                type="number"
                                label="Amount (TZS)"
                                value={backAmount}
                                onChange={(event) => setBackAmount(event.target.value)}
                                disabled={!backMember || !canPost || posting}
                                sx={{ maxWidth: { md: 180 } }}
                                error={Boolean(backAmountError)}
                                helperText={backAmountError || " "}
                            />
                            <TextField
                                size="small"
                                label="Reason"
                                value={backReason}
                                onChange={(event) => setBackReason(event.target.value)}
                                disabled={!backMember || !canPost || posting}
                                sx={{ minWidth: { md: 220 }, flexGrow: 1 }}
                                error={Boolean(backReasonError)}
                                helperText={backReasonError || "Required — kept in the audit log"}
                            />
                            <Button
                                variant="outlined"
                                color="warning"
                                onClick={postRelease}
                                disabled={!backReady}
                                sx={{ mt: { md: 0.1 } }}
                            >
                                {posting ? "Posting..." : "Return To Savings"}
                            </Button>
                        </Stack>

                        {backMember ? (
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip size="small" variant="outlined" label={`In shares ${formatCurrency(backHeld)}`} />
                                <Chip size="small" variant="outlined" label={`Required ${formatCurrency(backMember.required)}`} />
                                <Chip size="small" variant="outlined" label={`Savings ${backMember.savings_balance === null ? "—" : formatCurrency(backMember.savings_balance)}`} />
                                {backAmountValue > 0 && !backAmountError ? (
                                    <Chip
                                        size="small"
                                        variant="outlined"
                                        color="primary"
                                        label={`Shares after ${formatCurrency(backHeld - backAmountValue)}`}
                                    />
                                ) : null}
                            </Stack>
                        ) : null}

                        {backShortfallAfter > 0 ? (
                            <Alert severity="warning" variant="outlined">
                                This leaves {backMember?.member_name} {formatCurrency(backShortfallAfter)} short of their
                                required share capital of {formatCurrency(backMember?.required ?? 0)}. The posting is
                                allowed and will go through — check it is what your by-laws permit for a member who is
                                staying on. Their share balance is also what the minimum-shares rule for dividends is
                                measured against.
                            </Alert>
                        ) : null}

                        {!canPost ? (
                            <Alert severity="info" variant="outlined" sx={{ py: 0.25 }}>
                                Only a super admin can post these.
                            </Alert>
                        ) : null}
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
                                                    onClick={() => postTransfer(row, row.movable)}
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
