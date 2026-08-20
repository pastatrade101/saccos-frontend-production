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
    // Single-member transfer: any member, any amount, independent of whether
    // they still owe share capital.
    const [oneMember, setOneMember] = useState<SavingsToSharesRow | null>(null);
    const [oneAmount, setOneAmount] = useState("");

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
