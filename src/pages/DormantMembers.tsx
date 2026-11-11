import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import {
    Alert,
    Box,
    Button,
    CardContent,
    Checkbox,
    Chip,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthContext";
import { AppLoader } from "../components/AppLoader";
import { useToast } from "../components/Toast";
import { api, getApiErrorMessage } from "../lib/api";
import {
    endpoints,
    type BulkMemberStatusResponse,
    type DormantMembers,
    type DormantMemberRow,
    type DormantMembersResponse
} from "../lib/endpoints";
import { MotionCard } from "../ui/motion";
import { formatCurrency } from "../utils/format";

const CATEGORY_LABEL: Record<DormantMemberRow["category"], string> = {
    never_started: "Never started",
    stalled: "Stopped",
    no_deposits_on_record: "No deposits recorded"
};

const CATEGORY_TONE: Record<DormantMemberRow["category"], "error" | "warning" | "default"> = {
    never_started: "error",
    stalled: "warning",
    no_deposits_on_record: "default"
};

/**
 * Members who registered and never started, or who were saving and stopped.
 *
 * The page exists to be acted on, not only read: pick rows, give a reason,
 * suspend. Which is why it is not in All Reports — that suite is read-only.
 *
 * Whether a member may be suspended is decided by the server and arrives in
 * `blockers`. The page renders that verdict and never forms its own, so a row
 * shown as blocked is exactly a row the endpoint would refuse.
 */
export function DormantMembersPage() {
    const { profile, selectedTenantId } = useAuth();
    const { pushToast } = useToast();
    const [data, setData] = useState<DormantMembers | null>(null);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [minDays, setMinDays] = useState("90");
    const [category, setCategory] = useState<"all" | DormantMemberRow["category"]>("all");
    const [selected, setSelected] = useState<string[]>([]);
    const [reason, setReason] = useState("");

    const canSuspend = profile?.role === "super_admin" || profile?.role === "branch_manager";

    const load = useCallback(async () => {
        if (!selectedTenantId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: payload } = await api.get<DormantMembersResponse>(endpoints.members.dormant(), {
                params: {
                    tenant_id: selectedTenantId,
                    min_days: Number(minDays) > 0 ? Number(minDays) : 90,
                    category
                }
            });
            setData(payload.data);
            // Anything selected was selected against the previous list. Keeping
            // it would let a filter change carry a hidden row into a suspension
            // nobody can see on screen.
            setSelected([]);
        } catch (loadError) {
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, [selectedTenantId, minDays, category]);

    useEffect(() => {
        void load();
    }, [load]);

    const rows = data?.rows || [];
    const selectable = useMemo(() => rows.filter((row) => row.blockers.length === 0), [rows]);
    const allSelected = selectable.length > 0 && selected.length === selectable.length;

    const toggleRow = (memberId: string) => {
        setSelected((current) => current.includes(memberId)
            ? current.filter((id) => id !== memberId)
            : [...current, memberId]);
    };

    const toggleAll = () => {
        setSelected(allSelected ? [] : selectable.map((row) => row.member_id));
    };

    const suspend = async () => {
        if (!selectedTenantId || selected.length === 0) return;

        setPosting(true);
        setError(null);

        try {
            const { data: payload } = await api.post<BulkMemberStatusResponse>(endpoints.members.bulkStatus(), {
                tenant_id: selectedTenantId,
                member_ids: selected,
                status: "suspended",
                reason: reason.trim()
            });
            const result = payload.data;
            pushToast({
                type: result.failed_count ? "error" : "success",
                title: result.failed_count ? "Suspended with failures" : "Members suspended",
                message: `${result.updated_count} suspended`
                    + (result.skipped_count ? ` · ${result.skipped_count} skipped` : "")
                    + (result.failed_count ? ` · ${result.failed_count} failed` : "")
            });
            setReason("");
            await load();
        } catch (postError) {
            setError(getApiErrorMessage(postError));
        } finally {
            setPosting(false);
        }
    };

    if (loading) {
        return <AppLoader message="Working out who has stopped depositing" />;
    }

    const totals = data?.totals;
    const reasonError = reason.trim() !== "" && reason.trim().length < 3
        ? "Give a reason of at least three characters."
        : null;
    const ready = Boolean(canSuspend && !posting && selected.length > 0 && reason.trim().length >= 3);

    return (
        <Stack spacing={2}>
            {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}

            <MotionCard variant="outlined" inView>
                <CardContent>
                    <Stack spacing={2}>
                        <Stack spacing={0.75}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                <PersonOffRoundedIcon color="primary" />
                                <Typography variant="h5">Members Who Are Not Saving</Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                                Two groups. <strong>Never started</strong> registered and has never deposited a shilling. <strong>Stopped</strong> was saving and has gone quiet for longer than the window below.
                            </Typography>
                        </Stack>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
                            <TextField
                                select
                                size="small"
                                label="Quiet for at least"
                                value={minDays}
                                onChange={(event) => setMinDays(event.target.value)}
                                sx={{ minWidth: 180 }}
                                helperText="Applies to Stopped only"
                            >
                                <MenuItem value="30">30 days</MenuItem>
                                <MenuItem value="60">60 days</MenuItem>
                                <MenuItem value="90">90 days</MenuItem>
                                <MenuItem value="180">6 months</MenuItem>
                                <MenuItem value="365">1 year</MenuItem>
                            </TextField>
                            <TextField
                                select
                                size="small"
                                label="Show"
                                value={category}
                                onChange={(event) => setCategory(event.target.value as typeof category)}
                                sx={{ minWidth: 200 }}
                                helperText=" "
                            >
                                <MenuItem value="all">Both groups</MenuItem>
                                <MenuItem value="never_started">Never started</MenuItem>
                                <MenuItem value="stalled">Stopped</MenuItem>
                            </TextField>
                        </Stack>

                        {totals ? (
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip label={`${totals.members} members`} variant="outlined" />
                                <Chip label={`${totals.never_started} never started`} color="error" variant="outlined" />
                                <Chip label={`${totals.stalled} stopped`} color="warning" variant="outlined" />
                                <Chip label={`${formatCurrency(totals.balance_held)} sitting idle`} variant="outlined" />
                                {totals.blocked > 0 ? (
                                    <Chip label={`${totals.blocked} cannot be suspended`} variant="outlined" />
                                ) : null}
                            </Stack>
                        ) : null}

                        {rows.length === 0 ? (
                            <Alert severity="success" variant="outlined">
                                Nobody matches. Every member has deposited within the window.
                            </Alert>
                        ) : null}
                    </Stack>
                </CardContent>
            </MotionCard>

            {rows.length > 0 ? (
                <MotionCard variant="outlined" inView>
                    <CardContent>
                        <Stack spacing={1.5}>
                            <Stack spacing={0.5}>
                                <Typography variant="subtitle2">Suspend the selected members</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Suspending bars a member from applying for a loan and drops them from the dividend. It does not stop a teller taking their money — a deposit or a loan repayment posts by account, not by member status. Reinstate by setting the member back to Active on their own page.
                                </Typography>
                            </Stack>

                            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "flex-start" }}>
                                <TextField
                                    size="small"
                                    label="Reason"
                                    value={reason}
                                    onChange={(event) => setReason(event.target.value)}
                                    disabled={!canSuspend || posting}
                                    sx={{ flexGrow: 1 }}
                                    error={Boolean(reasonError)}
                                    helperText={reasonError || "Required — written into each member's status history"}
                                />
                                <Button
                                    variant="outlined"
                                    color="warning"
                                    onClick={suspend}
                                    disabled={!ready}
                                    sx={{ mt: { md: 0.1 } }}
                                >
                                    {posting ? "Suspending..." : `Suspend ${selected.length || ""}`.trim()}
                                </Button>
                            </Stack>

                            {!canSuspend ? (
                                <Alert severity="info" variant="outlined" sx={{ py: 0.25 }}>
                                    Only a super admin or branch manager can suspend members.
                                </Alert>
                            ) : null}
                        </Stack>
                    </CardContent>
                </MotionCard>
            ) : null}

            {rows.length > 0 ? (
                <MotionCard variant="outlined" inView>
                    <CardContent>
                        <Box sx={{ overflowX: "auto" }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                size="small"
                                                checked={allSelected}
                                                indeterminate={selected.length > 0 && !allSelected}
                                                onChange={toggleAll}
                                                disabled={!canSuspend || posting || selectable.length === 0}
                                            />
                                        </TableCell>
                                        <TableCell>Member</TableCell>
                                        <TableCell>Group</TableCell>
                                        <TableCell align="right">Quiet</TableCell>
                                        <TableCell>Last deposit</TableCell>
                                        <TableCell align="right">Balance</TableCell>
                                        <TableCell align="right">Loan</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.map((row) => {
                                        const blocked = row.blockers.length > 0;
                                        return (
                                            <TableRow key={row.member_id} hover selected={selected.includes(row.member_id)}>
                                                <TableCell padding="checkbox">
                                                    <Tooltip title={blocked ? row.blockers.join(" ") : ""}>
                                                        <span>
                                                            <Checkbox
                                                                size="small"
                                                                checked={selected.includes(row.member_id)}
                                                                onChange={() => toggleRow(row.member_id)}
                                                                disabled={!canSuspend || posting || blocked}
                                                            />
                                                        </span>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{row.member_name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {row.member_no}
                                                        {row.status === "approved_pending_payment" ? " · awaiting joining fee" : ""}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        variant="outlined"
                                                        color={CATEGORY_TONE[row.category]}
                                                        label={CATEGORY_LABEL[row.category]}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    {row.days_quiet === null ? "—" : `${row.days_quiet}d`}
                                                </TableCell>
                                                <TableCell>{row.last_deposit_on || "Never"}</TableCell>
                                                <TableCell align="right">{formatCurrency(row.total_balance)}</TableCell>
                                                <TableCell align="right">
                                                    {row.active_loans > 0 ? formatCurrency(row.loan_outstanding) : "—"}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                            Members carrying a loan cannot be suspended from here. Suspending a borrower would cut them from the dividend and close the door on restructuring the loan that is already at risk — handle those one at a time on the member's own page.
                        </Typography>
                    </CardContent>
                </MotionCard>
            ) : null}
        </Stack>
    );
}
