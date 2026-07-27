import { MotionCard, MotionModal } from "../ui/motion";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import PolicyRoundedIcon from "@mui/icons-material/PolicyRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    MenuItem,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthContext";
import { DataTable } from "../components/DataTable";
import { TwoFactorStepUpDialog, type TwoFactorStepUpPayload } from "../components/TwoFactorStepUpDialog";
import { useToast } from "../components/Toast";
import { api, getApiErrorCode, getApiErrorMessage } from "../lib/api";
import {
    endpoints,
    type BranchesListResponse,
    type DailyCashSummaryResponse,
    type ReceiptPolicyResponse,
    type TellerSessionsResponse,
    type UpdateReceiptPolicyRequest
} from "../lib/endpoints";
import type { Branch, DailyCashSummary, ReceiptPolicy, TellerSession } from "../types/api";
import { downloadFile, getFilenameFromDisposition } from "../utils/downloadFile";
import { crestGold } from "../theme/colors";
import { formatCurrency, formatDate } from "../utils/format";

const controlledTransactionTypes: UpdateReceiptPolicyRequest["enforce_on_types"] = [
    "deposit",
    "withdraw",
    "loan_repay",
    "loan_disburse",
    "fee_revenue",
    "expense_payment"
];

const transactionTypeLabels: Record<UpdateReceiptPolicyRequest["enforce_on_types"][number], string> = {
    deposit: "Savings deposit",
    withdraw: "Savings withdrawal",
    share_contribution: "Legacy contribution",
    loan_repay: "Loan repayment",
    loan_disburse: "Loan disbursement",
    fee_revenue: "Fee / revenue",
    expense_payment: "SACCO expense"
};

function statusChip(status: TellerSession["status"]) {
    if (status === "reviewed") return "success";
    if (status === "closed_pending_review") return "warning";
    return "info";
}

export function CashControlPage() {
    const { pushToast } = useToast();
    const { profile, selectedTenantId, selectedBranchId } = useAuth();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [policy, setPolicy] = useState<ReceiptPolicy | null>(null);
    const [sessions, setSessions] = useState<TellerSession[]>([]);
    const [summary, setSummary] = useState<DailyCashSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPolicyEditor, setShowPolicyEditor] = useState(false);
    const [stepUpOpen, setStepUpOpen] = useState(false);
    const [stepUpHandler, setStepUpHandler] = useState<((payload: TwoFactorStepUpPayload) => Promise<void>) | null>(null);
    const [branchId, setBranchId] = useState<string>(selectedBranchId || "");
    const [policyForm, setPolicyForm] = useState<UpdateReceiptPolicyRequest>({
        branch_id: selectedBranchId || null,
        receipt_required: false,
        required_threshold: 500000,
        max_receipts_per_tx: 3,
        allowed_mime_types: ["image/jpeg", "image/png", "application/pdf"],
        max_file_size_mb: 10,
        enforce_on_types: controlledTransactionTypes
    });

    const editable = profile?.role === "branch_manager" || profile?.role === "super_admin";

    const closeStepUpDialog = () => {
        if (saving) {
            return;
        }

        setStepUpOpen(false);
        setStepUpHandler(null);
    };

    const loadData = async () => {
        if (!selectedTenantId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const branchQuery = branchId || selectedBranchId || undefined;
            const [{ data: branchesResponse }, { data: policyResponse }, { data: sessionsResponse }, { data: summaryResponse }] = await Promise.all([
                api.get<BranchesListResponse>(endpoints.branches.list(), {
                    params: { tenant_id: selectedTenantId, page: 1, limit: 100 }
                }),
                api.get<ReceiptPolicyResponse>(endpoints.cashControl.receiptPolicy(), { params: branchQuery ? { branch_id: branchQuery } : {} }),
                api.get<TellerSessionsResponse>(endpoints.cashControl.sessions(), {
                    params: branchQuery ? { branch_id: branchQuery, page: 1, limit: 100 } : { page: 1, limit: 100 }
                }),
                api.get<DailyCashSummaryResponse>(endpoints.cashControl.dailySummary(), { params: branchQuery ? { branch_id: branchQuery } : {} })
            ]);

            setBranches(branchesResponse.data || []);
            setPolicy(policyResponse.data);
            setSessions(sessionsResponse.data || []);
            setSummary(summaryResponse.data || []);
            if (policyResponse.data) {
                setPolicyForm({
                    branch_id: policyResponse.data.branch_id || null,
                    receipt_required: policyResponse.data.receipt_required,
                    required_threshold: policyResponse.data.required_threshold,
                    max_receipts_per_tx: policyResponse.data.max_receipts_per_tx,
                    allowed_mime_types: policyResponse.data.allowed_mime_types,
                    max_file_size_mb: policyResponse.data.max_file_size_mb,
                    enforce_on_types: policyResponse.data.enforce_on_types
                });
            }
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to load cash control",
                message: getApiErrorMessage(error)
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [selectedTenantId, branchId]);

    const totals = useMemo(() => {
        return summary.reduce(
            (acc, row) => {
                acc.inflow += Number(row.inflow_total ?? row.deposits_total ?? 0);
                acc.outflow += Number(row.outflow_total ?? row.withdrawals_total ?? 0);
                acc.savingsDeposits += Number(row.savings_deposit_total || 0);
                acc.savingsWithdrawals += Number(row.savings_withdrawal_total || 0);
                acc.loanRepayments += Number(row.loan_repayment_total || 0);
                acc.loanDisbursements += Number(row.loan_disbursement_total || 0);
                acc.feeRevenue += Number(row.fee_revenue_total || 0);
                acc.expensePayments += Number(row.expense_payment_total || 0);
                acc.variance += Number(row.variance_total || 0);
                acc.transactions += Number(row.transaction_count || 0);
                acc.receipts += Number(row.receipt_count || 0);
                return acc;
            },
            {
                inflow: 0,
                outflow: 0,
                savingsDeposits: 0,
                savingsWithdrawals: 0,
                loanRepayments: 0,
                loanDisbursements: 0,
                feeRevenue: 0,
                expensePayments: 0,
                variance: 0,
                transactions: 0,
                receipts: 0
            }
        );
    }, [summary]);

    const savePolicy = async (stepUpPayload?: TwoFactorStepUpPayload) => {
        setSaving(true);
        try {
            await api.put(endpoints.cashControl.receiptPolicy(), {
                ...policyForm,
                branch_id: branchId || null,
                two_factor_code: stepUpPayload?.two_factor_code || null,
                recovery_code: stepUpPayload?.recovery_code || null
            });
            pushToast({
                type: "success",
                title: "Policy updated",
                message: "Receipt and teller control policy has been saved."
            });
            setShowPolicyEditor(false);
            await loadData();
        } catch (error) {
            if (getApiErrorCode(error) === "TWO_FACTOR_STEP_UP_REQUIRED") {
                setStepUpHandler(() => async (payload: TwoFactorStepUpPayload) => {
                    await savePolicy(payload);
                    setStepUpOpen(false);
                });
                setStepUpOpen(true);
                return;
            }
            pushToast({
                type: "error",
                title: "Unable to save policy",
                message: getApiErrorMessage(error)
            });
        } finally {
            setSaving(false);
        }
    };

    const downloadReport = async (url: string, fallback: string) => {
        try {
            const response = await api.get(url, {
                params: branchId ? { branch_id: branchId } : {},
                responseType: "blob"
            });

            downloadFile(response.data as Blob, getFilenameFromDisposition(response.headers["content-disposition"], fallback));
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to download report",
                message: getApiErrorMessage(error)
            });
        }
    };

    return (
        <Stack spacing={3}>
            <MotionCard sx={{ color: "#fff", background: "linear-gradient(135deg, #0A0573 0%, #1FA8E6 100%)" }}>
                <CardContent>
                    <Stack spacing={1}>
                        <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.72)" }}>
                            Cash governance
                        </Typography>
                        <Typography variant="h4">Receipt policy, teller balancing, and daily cashbook</Typography>
                        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.82)", maxWidth: 760 }}>
                            Configure evidence requirements for cash movements, review teller sessions, and export branch cash summaries for balancing and oversight.
                        </Typography>
                    </Stack>
                </CardContent>
            </MotionCard>

            <MotionCard variant="outlined" sx={{ borderTop: `4px solid ${crestGold.main}`, borderRadius: 2.5 }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} alignItems={{ md: "flex-start" }}>
                        <Box>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ textTransform: "uppercase", letterSpacing: "0.16em", fontWeight: 700 }}
                            >
                                Net Movement
                            </Typography>
                            <Typography
                                component="p"
                                sx={{
                                    mt: 1,
                                    fontWeight: 800,
                                    fontVariantNumeric: "tabular-nums",
                                    letterSpacing: "-0.02em",
                                    lineHeight: 1.05,
                                    fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)"
                                }}
                            >
                                {formatCurrency(totals.inflow - totals.outflow)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {totals.transactions} posted action(s) · {totals.receipts} confirmed receipt(s)
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                px: 2,
                                py: 1.25,
                                borderRadius: 2,
                                bgcolor: totals.variance === 0 ? "success.main" : "error.main",
                                color: "#fff",
                                textAlign: "right",
                                minWidth: 180
                            }}
                        >
                            <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, opacity: 0.85 }}>
                                Variance
                            </Typography>
                            <Typography sx={{ fontWeight: 800, fontVariantNumeric: "tabular-nums", fontSize: "1.35rem", lineHeight: 1.2 }}>
                                {totals.variance === 0 ? "Balanced" : formatCurrency(totals.variance)}
                            </Typography>
                        </Box>
                    </Stack>
                    <Stack
                        direction="row"
                        spacing={{ xs: 3, md: 5 }}
                        useFlexGap
                        flexWrap="wrap"
                        sx={{ mt: 2.5, pt: 2, borderTop: "1px solid", borderColor: "divider" }}
                    >
                        {[
                            { label: "Cash Inflow", value: formatCurrency(totals.inflow), color: "success.main" },
                            { label: "Cash Outflow", value: formatCurrency(totals.outflow), color: "error.main" }
                        ].map((stat) => (
                            <Box key={stat.label}>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ textTransform: "uppercase", letterSpacing: "0.12em", display: "block" }}
                                >
                                    {stat.label}
                                </Typography>
                                <Typography sx={{ fontWeight: 800, fontVariantNumeric: "tabular-nums", fontSize: "1.25rem", color: stat.color }}>
                                    {stat.value}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </CardContent>
            </MotionCard>

            <Grid container spacing={2.5}>
                {[
                    { label: "Savings In", value: totals.savingsDeposits, direction: "in" },
                    { label: "Savings Out", value: totals.savingsWithdrawals, direction: "out" },
                    { label: "Loan Repayments", value: totals.loanRepayments, direction: "in" },
                    { label: "Fee Revenue", value: totals.feeRevenue, direction: "in" },
                    { label: "Expenses", value: totals.expensePayments, direction: "out" },
                    { label: "Loan Disbursed", value: totals.loanDisbursements, direction: "out" }
                ].map((tile) => (
                    <Grid key={tile.label} size={{ xs: 6, md: 4, xl: 2 }}>
                        <MotionCard variant="outlined" sx={{ borderRadius: 2.5, height: "100%" }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}
                                >
                                    {tile.label}
                                </Typography>
                                <Typography
                                    component="p"
                                    sx={{
                                        mt: 1,
                                        fontWeight: 800,
                                        fontVariantNumeric: "tabular-nums",
                                        lineHeight: 1.15,
                                        fontSize: "clamp(1.2rem, 1.5vw, 1.5rem)"
                                    }}
                                >
                                    {formatCurrency(tile.value)}
                                </Typography>
                                <Typography variant="caption" sx={{ color: tile.direction === "in" ? "success.main" : "error.main", fontWeight: 700 }}>
                                    {tile.direction === "in" ? "↑ Money in" : "↓ Money out"}
                                </Typography>
                            </CardContent>
                        </MotionCard>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 3 }}>
                    <MotionCard variant="outlined">
                        <CardContent>
                            <Typography variant="overline">Branch filter</Typography>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                value={branchId}
                                onChange={(event) => setBranchId(event.target.value)}
                                sx={{ mt: 1 }}
                            >
                                <MenuItem value="">All accessible branches</MenuItem>
                                {branches.map((branch) => (
                                    <MenuItem key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </CardContent>
                    </MotionCard>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 5 }}>
                    <MotionCard variant="outlined">
                        <CardContent>
                            <Stack spacing={2}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <PolicyRoundedIcon color="primary" />
                                    <Box>
                                        <Typography variant="h6">Receipt policy</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Threshold, evidence formats, and enforced transaction types.
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Alert severity="info">
                                    Uploaded receipts become immutable once they are attached to a posted journal entry.
                                </Alert>
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                    <Chip
                                        size="small"
                                        label={policy?.receipt_required ? `Required from ${formatCurrency(policy.required_threshold)}` : "Receipts optional"}
                                        color={policy?.receipt_required ? "primary" : "default"}
                                        variant="outlined"
                                    />
                                    <Chip
                                        size="small"
                                        label={`Max ${policy?.max_receipts_per_tx ?? policyForm.max_receipts_per_tx} receipt(s)`}
                                        variant="outlined"
                                    />
                                    <Chip
                                        size="small"
                                        label={`${policy?.max_file_size_mb ?? policyForm.max_file_size_mb} MB max`}
                                        variant="outlined"
                                    />
                                </Stack>
                                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                                    {(policy?.enforce_on_types || policyForm.enforce_on_types).map((type) => (
                                        <Chip
                                            key={type}
                                            size="small"
                                            label={transactionTypeLabels[type] || type}
                                            color={type === "fee_revenue" ? "success" : "default"}
                                            variant="outlined"
                                        />
                                    ))}
                                </Stack>
                                {editable ? (
                                    showPolicyEditor ? (
                                        <>
                                            <TextField
                                                select
                                                label="Receipt required"
                                                value={String(policyForm.receipt_required)}
                                                onChange={(event) => setPolicyForm((current) => ({ ...current, receipt_required: event.target.value === "true" }))}
                                                fullWidth
                                                disabled={!editable}
                                            >
                                                <MenuItem value="true">Required over threshold</MenuItem>
                                                <MenuItem value="false">Optional</MenuItem>
                                            </TextField>
                                            <TextField
                                                label="Required threshold"
                                                type="number"
                                                value={policyForm.required_threshold}
                                                onChange={(event) => setPolicyForm((current) => ({ ...current, required_threshold: Number(event.target.value) }))}
                                                fullWidth
                                                disabled={!editable}
                                            />
                                            <TextField
                                                label="Max receipts per transaction"
                                                type="number"
                                                value={policyForm.max_receipts_per_tx}
                                                onChange={(event) => setPolicyForm((current) => ({ ...current, max_receipts_per_tx: Number(event.target.value) }))}
                                                fullWidth
                                                disabled={!editable}
                                            />
                                            <TextField
                                                label="Max file size (MB)"
                                                type="number"
                                                value={policyForm.max_file_size_mb}
                                                onChange={(event) => setPolicyForm((current) => ({ ...current, max_file_size_mb: Number(event.target.value) }))}
                                                fullWidth
                                                disabled={!editable}
                                            />
                                            <TextField
                                                label="Allowed MIME types"
                                                value={policyForm.allowed_mime_types.join(", ")}
                                                onChange={(event) => setPolicyForm((current) => ({
                                                    ...current,
                                                    allowed_mime_types: event.target.value.split(",").map((value) => value.trim()).filter(Boolean)
                                                }))}
                                                fullWidth
                                                disabled={!editable}
                                            />
                                            <TextField
                                                label="Enforce on"
                                                select
                                                SelectProps={{ multiple: true }}
                                                value={policyForm.enforce_on_types}
                                                onChange={(event) => setPolicyForm((current) => ({
                                                    ...current,
                                                    enforce_on_types: (Array.isArray(event.target.value)
                                                        ? event.target.value
                                                        : String(event.target.value).split(",")
                                                    )
                                                        .filter((value): value is UpdateReceiptPolicyRequest["enforce_on_types"][number] =>
                                                            controlledTransactionTypes.includes(value as UpdateReceiptPolicyRequest["enforce_on_types"][number])
                                                        )
                                                }))}
                                                fullWidth
                                                disabled={!editable}
                                            >
                                                {controlledTransactionTypes.map((type) => (
                                                    <MenuItem key={type} value={type}>
                                                        {transactionTypeLabels[type]}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                            <Stack direction="row" spacing={1.25}>
                                                <Button variant="contained" onClick={() => void savePolicy()} disabled={saving}>
                                                    {saving ? "Saving..." : "Save policy"}
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    onClick={() => setShowPolicyEditor(false)}
                                                    disabled={saving}
                                                >
                                                    Cancel
                                                </Button>
                                            </Stack>
                                        </>
                                    ) : (
                                        <Button variant="contained" onClick={() => setShowPolicyEditor(true)}>
                                            Edit policy
                                        </Button>
                                    )
                                ) : (
                                    <Chip label="Read only" color="default" />
                                )}
                            </Stack>
                        </CardContent>
                    </MotionCard>
                </Grid>
                <Grid size={{ xs: 12, lg: 7 }}>
                    <MotionCard variant="outlined">
                        <CardContent>
                            <Stack spacing={2}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <PointOfSaleRoundedIcon color="primary" />
                                        <Box>
                                            <Typography variant="h6">Reports</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Export branch cashbook and teller balancing evidence.
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <Stack direction="row" spacing={1}>
                                        <Button startIcon={<FileDownloadRoundedIcon />} variant="outlined" onClick={() => void downloadReport(endpoints.cashControl.dailyCashbookCsv(), "daily-cashbook.csv")}>
                                            Daily cashbook
                                        </Button>
                                        <Button startIcon={<FileDownloadRoundedIcon />} variant="outlined" onClick={() => void downloadReport(endpoints.cashControl.tellerBalancingCsv(), "teller-balancing.csv")}>
                                            Teller balancing
                                        </Button>
                                    </Stack>
                                </Stack>
                                <DataTable
                                    rows={summary}
                                    columns={[
                                        { key: "date", header: "Date", render: (row) => formatDate(row.business_date) },
                                        { key: "actions", header: "Actions", render: (row) => Number(row.transaction_count || 0) },
                                        { key: "receipts", header: "Receipts", render: (row) => Number(row.receipt_count || 0) },
                                        { key: "inflow", header: "Cash Inflow", render: (row) => formatCurrency(row.inflow_total ?? row.deposits_total) },
                                        { key: "outflow", header: "Cash Outflow", render: (row) => formatCurrency(row.outflow_total ?? row.withdrawals_total) },
                                        { key: "savings", header: "Savings", render: (row) => `${formatCurrency(row.savings_deposit_total || 0)} in / ${formatCurrency(row.savings_withdrawal_total || 0)} out` },
                                        { key: "loan_repay", header: "Loan Repay", render: (row) => formatCurrency(row.loan_repayment_total || 0) },
                                        { key: "fee_revenue", header: "Fee Revenue", render: (row) => formatCurrency(row.fee_revenue_total || 0) },
                                        { key: "expense_payment", header: "Expenses", render: (row) => formatCurrency(row.expense_payment_total || 0) },
                                        { key: "loan_disburse", header: "Loan Disbursed", render: (row) => formatCurrency(row.loan_disbursement_total || 0) },
                                        { key: "net", header: "Net", render: (row) => formatCurrency(row.net_movement) },
                                        { key: "variance", header: "Variance", render: (row) => formatCurrency(row.variance_total) }
                                    ]}
                                    emptyMessage={loading ? "Loading daily cash summary..." : "No daily cash data recorded."}
                                />
                            </Stack>
                        </CardContent>
                    </MotionCard>
                </Grid>
            </Grid>

            <MotionCard variant="outlined">
                <CardContent>
                    <Stack spacing={2}>
                        <Typography variant="h6">Teller sessions</Typography>
                        <DataTable
                            rows={sessions}
                            columns={[
                                { key: "opened", header: "Opened", render: (row) => formatDate(row.opened_at) },
                                { key: "opening", header: "Opening cash", render: (row) => formatCurrency(row.opening_cash) },
                                { key: "expected", header: "Expected", render: (row) => formatCurrency(row.expected_cash) },
                                { key: "closing", header: "Closing", render: (row) => row.closing_cash != null ? formatCurrency(row.closing_cash) : "Open" },
                                { key: "variance", header: "Variance", render: (row) => row.variance != null ? formatCurrency(row.variance) : "Pending" },
                                { key: "status", header: "Status", render: (row) => <Chip size="small" color={statusChip(row.status)} label={row.status.replace(/_/g, " ")} /> }
                            ]}
                            emptyMessage={loading ? "Loading teller sessions..." : "No teller sessions recorded."}
                        />
                    </Stack>
                </CardContent>
            </MotionCard>

            <TwoFactorStepUpDialog
                open={stepUpOpen}
                title="Verify receipt policy change"
                description="Updating teller receipt controls requires a fresh authenticator check."
                actionLabel="Verify and save"
                busy={saving}
                onCancel={closeStepUpDialog}
                onConfirm={async (payload) => {
                    if (!stepUpHandler) {
                        return;
                    }

                    await stepUpHandler(payload);
                }}
            />
        </Stack>
    );
}
