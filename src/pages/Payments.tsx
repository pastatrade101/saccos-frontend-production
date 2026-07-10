import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import WalletRoundedIcon from "@mui/icons-material/WalletRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import {
    Alert,
    Box,
    Button,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    MenuItem,
    Paper,
    Stack,
    TablePagination,
    TextField,
    Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthContext";
import { AppLoader } from "../components/AppLoader";
import { DataTable, type Column } from "../components/DataTable";
import { useToast } from "../components/Toast";
import { api, getApiErrorMessage } from "../lib/api";
import { endpoints, type ReconcilePaymentOrderResponse } from "../lib/endpoints";
import type { ApiEnvelope, PaginatedResult, PaymentOrder, PaymentOrderStatus, TellerPaymentTransaction } from "../types/api";
import { brandColors } from "../theme/colors";
import { MotionCard } from "../ui/motion";
import { formatCurrency, formatDate } from "../utils/format";

const PAGE_LOAD_LIMIT = 100;
const MAX_PAGE_LOADS = 100;

type PaymentSource = "gateway" | "teller";
type PaymentChannel = "mobile_money" | "cash_desk";
type PaymentDirection = "in" | "out";
type PaymentOperation =
    | "savings_deposit"
    | "savings_withdrawal"
    | "share_contribution"
    | "loan_repayment"
    | "loan_disbursement"
    | "membership_fee"
    | "fee_revenue"
    | "expense_payment";

interface FlatPagedEnvelope<T> {
    data: T[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
    } | null;
}

interface PaymentLogRow {
    id: string;
    row_number?: number;
    source: PaymentSource;
    channel: PaymentChannel;
    channel_label: string;
    provider: string;
    operation: PaymentOperation;
    status: PaymentOrderStatus | "posted";
    direction: PaymentDirection;
    amount: number;
    currency: string;
    member_name: string | null;
    member_no: string | null;
    account_label: string | null;
    loan_number: string | null;
    branch_name: string | null;
    teller_name: string | null;
    reference: string | null;
    description: string | null;
    journal_id: string | null;
    date: string;
    posted_at?: string | null;
    paid_at?: string | null;
    error_message?: string | null;
    receipt_count?: number;
    raw_order?: PaymentOrder;
}

function formatPaymentOperation(operation: string) {
    const labels: Record<string, string> = {
        savings_deposit: "Savings deposit",
        savings_withdrawal: "Savings withdrawal",
        share_contribution: "Legacy contribution",
        loan_repayment: "Loan repayment",
        loan_disbursement: "Loan disbursement",
        membership_fee: "Membership fee",
        fee_revenue: "Fee / revenue",
        expense_payment: "SACCO expense"
    };

    return labels[operation] || operation.replace(/_/g, " ");
}

function formatPaymentStatus(status: string) {
    return status.replace(/_/g, " ");
}

function normalizePaymentOrder(order: PaymentOrder) {
    if ((order.posted_at || order.journal_id) && order.status !== "posted") {
        return {
            ...order,
            status: "posted" as const
        };
    }

    return order;
}

function normalizeOrderOperation(purpose: string): PaymentOperation {
    if (purpose === "loan_repayment") {
        return "loan_repayment";
    }

    if (purpose === "membership_fee") {
        return "membership_fee";
    }

    if (purpose === "share_contribution") {
        return "share_contribution";
    }

    return "savings_deposit";
}

function normalizeTellerOperation(transactionType: TellerPaymentTransaction["transaction_type"]): PaymentOperation {
    if (transactionType === "withdraw") {
        return "savings_withdrawal";
    }

    if (transactionType === "share_contribution") {
        return "share_contribution";
    }

    if (transactionType === "loan_repay") {
        return "loan_repayment";
    }

    if (transactionType === "loan_disburse") {
        return "loan_disbursement";
    }

    if (transactionType === "fee_revenue") {
        return "fee_revenue";
    }

    if (transactionType === "expense_payment") {
        return "expense_payment";
    }

    return "savings_deposit";
}

function orderToLogRow(order: PaymentOrder): PaymentLogRow {
    const normalized = normalizePaymentOrder(order);
    const provider = normalized.provider || "mobile_money";

    return {
        id: `gateway:${normalized.id}`,
        source: "gateway",
        channel: "mobile_money",
        channel_label: provider.toUpperCase(),
        provider,
        operation: normalizeOrderOperation(normalized.purpose),
        status: normalized.status,
        direction: "in",
        amount: Number(normalized.amount || 0),
        currency: normalized.currency || "TZS",
        member_name: normalized.member_name || null,
        member_no: normalized.member_no || null,
        account_label: normalized.account_name || normalized.account_number || normalized.loan_number || normalized.account_id || normalized.loan_id || null,
        loan_number: normalized.loan_number || null,
        branch_name: null,
        teller_name: null,
        reference: normalized.provider_ref || normalized.external_id || null,
        description: normalized.description || normalized.error_message || null,
        journal_id: normalized.journal_id || null,
        date: normalized.created_at,
        paid_at: normalized.paid_at || null,
        posted_at: normalized.posted_at || null,
        error_message: normalized.error_message || null,
        raw_order: normalized
    };
}

function tellerToLogRow(transaction: TellerPaymentTransaction): PaymentLogRow {
    return {
        id: `teller:${transaction.id}`,
        source: "teller",
        channel: "cash_desk",
        channel_label: "Cash desk",
        provider: transaction.payment_method || "cash",
        operation: normalizeTellerOperation(transaction.transaction_type),
        status: "posted",
        direction: transaction.direction,
        amount: Number(transaction.amount || 0),
        currency: "TZS",
        member_name: transaction.member_name || null,
        member_no: transaction.member_no || null,
        account_label: transaction.account_name || transaction.account_number || transaction.loan_number || null,
        loan_number: transaction.loan_number || null,
        branch_name: transaction.branch_name || transaction.branch_code || null,
        teller_name: transaction.teller_name || null,
        reference: transaction.reference || null,
        description: transaction.description || null,
        journal_id: transaction.journal_id || null,
        date: transaction.created_at,
        posted_at: transaction.recorded_at,
        receipt_count: transaction.receipt_count
    };
}

async function loadFlatPages<T>(url: string, params: Record<string, string | number | undefined>) {
    const rows: T[] = [];

    for (let page = 1; page <= MAX_PAGE_LOADS; page += 1) {
        const { data: response } = await api.get<FlatPagedEnvelope<T>>(url, {
            params: {
                ...params,
                page,
                limit: PAGE_LOAD_LIMIT
            }
        });
        const pageRows = response.data || [];
        rows.push(...pageRows);

        const total = Number(response.pagination?.total || 0);
        if (!response.pagination || pageRows.length === 0 || (total > 0 && rows.length >= total)) {
            break;
        }
    }

    return rows;
}

async function loadNestedPages<T>(url: string, params: Record<string, string | number | undefined>) {
    const rows: T[] = [];

    for (let page = 1; page <= MAX_PAGE_LOADS; page += 1) {
        const { data: response } = await api.get<ApiEnvelope<PaginatedResult<T>>>(url, {
            params: {
                ...params,
                page,
                limit: PAGE_LOAD_LIMIT
            }
        });
        const pageRows = response.data?.data || [];
        rows.push(...pageRows);

        const total = Number(response.data?.pagination?.total || 0);
        if (!response.data?.pagination || pageRows.length === 0 || (total > 0 && rows.length >= total)) {
            break;
        }
    }

    return rows;
}

interface MetricCardProps {
    label: string;
    value: string | number;
    helper: string;
    icon: typeof WalletRoundedIcon;
    tone: "primary" | "success" | "warning" | "danger";
}

function MetricCard({ label, value, helper, icon: Icon, tone }: MetricCardProps) {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === "dark";
    const toneColor = tone === "success"
        ? brandColors.success
        : tone === "warning"
            ? brandColors.warning
            : tone === "danger"
                ? brandColors.danger
                : theme.palette.primary.main;

    return (
        <MotionCard variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.2 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: alpha(toneColor, isDarkMode ? 0.2 : 0.12),
                            color: toneColor
                        }}
                    >
                        <Icon fontSize="small" />
                    </Box>
                    <Typography variant="overline" color="text.secondary">
                        {label}
                    </Typography>
                </Stack>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.75 }}>
                    {value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {helper}
                </Typography>
            </CardContent>
        </MotionCard>
    );
}

export function PaymentsPage() {
    const theme = useTheme();
    const { pushToast } = useToast();
    const { selectedTenantId, selectedBranchId, selectedBranchName } = useAuth();
    const [orders, setOrders] = useState<PaymentOrder[]>([]);
    const [tellerTransactions, setTellerTransactions] = useState<TellerPaymentTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [purposeFilter, setPurposeFilter] = useState<string>("all");
    const [channelFilter, setChannelFilter] = useState<string>("all");
    const [sourceFilter, setSourceFilter] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [selectedReceipt, setSelectedReceipt] = useState<PaymentLogRow | null>(null);
    const [reconcilingOrderId, setReconcilingOrderId] = useState<string | null>(null);

    const loadPaymentOperations = async () => {
        if (!selectedTenantId) {
            setOrders([]);
            setTellerTransactions([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [paymentOrders, tellerRows] = await Promise.all([
                loadNestedPages<PaymentOrder>(endpoints.memberPayments.listOrders(), {
                    tenant_id: selectedTenantId,
                    branch_id: selectedBranchId || undefined
                }),
                loadFlatPages<TellerPaymentTransaction>(endpoints.cashControl.transactions(), {
                    branch_id: selectedBranchId || undefined
                })
            ]);
            setOrders(paymentOrders.map((order) => normalizePaymentOrder(order)));
            setTellerTransactions(tellerRows);
        } catch (loadError) {
            setError(getApiErrorMessage(loadError));
            setOrders([]);
            setTellerTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadPaymentOperations();
    }, [selectedBranchId, selectedTenantId]);

    const mergeOrder = (nextOrder: PaymentOrder) => {
        const normalized = normalizePaymentOrder(nextOrder);
        setOrders((current) => {
            const next = [normalized, ...current.filter((entry) => entry.id !== normalized.id)];
            next.sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());
            return next;
        });
        return normalized;
    };

    const allRows = useMemo(() => {
        const rows = [
            ...orders.map(orderToLogRow),
            ...tellerTransactions.map(tellerToLogRow)
        ];

        rows.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
        return rows;
    }, [orders, tellerTransactions]);

    const filteredRows = useMemo(
        () =>
            allRows.filter((row) => {
                if (statusFilter !== "all" && row.status !== statusFilter) {
                    return false;
                }

                if (purposeFilter !== "all" && row.operation !== purposeFilter) {
                    return false;
                }

                if (channelFilter !== "all" && row.channel !== channelFilter) {
                    return false;
                }

                if (sourceFilter !== "all" && row.source !== sourceFilter) {
                    return false;
                }

                if (search.trim()) {
                    const needle = search.trim().toLowerCase();
                    const haystack = [
                        row.member_name,
                        row.member_no,
                        row.account_label,
                        row.loan_number,
                        row.branch_name,
                        row.teller_name,
                        row.reference,
                        row.description,
                        row.journal_id,
                        row.channel_label,
                        row.provider
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                    if (!haystack.includes(needle)) {
                        return false;
                    }
                }

                return true;
            }),
        [allRows, channelFilter, purposeFilter, search, sourceFilter, statusFilter]
    );

    const paginatedRows = useMemo(
        () => filteredRows
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((row, index) => ({
                ...row,
                row_number: page * rowsPerPage + index + 1
            })),
        [filteredRows, page, rowsPerPage]
    );

    const metrics = useMemo(() => {
        const posted = allRows.filter((row) => row.status === "posted").length;
        const inProgress = allRows.filter((row) => ["created", "pending", "paid"].includes(row.status)).length;
        const failed = allRows.filter((row) => ["failed", "expired"].includes(row.status)).length;
        const inflow = allRows.filter((row) => row.direction === "in").reduce((sum, row) => sum + row.amount, 0);
        const outflow = allRows.filter((row) => row.direction === "out").reduce((sum, row) => sum + row.amount, 0);

        return {
            total: allRows.length,
            teller: allRows.filter((row) => row.source === "teller").length,
            gateway: allRows.filter((row) => row.source === "gateway").length,
            posted,
            inProgress,
            failed,
            inflow,
            outflow
        };
    }, [allRows]);

    useEffect(() => {
        setPage(0);
    }, [channelFilter, purposeFilter, rowsPerPage, search, sourceFilter, statusFilter]);

    const handleReconcile = async (row: PaymentLogRow) => {
        const order = row.raw_order;
        if (!order) {
            return;
        }

        setReconcilingOrderId(order.id);
        try {
            const { data } = await api.post<ReconcilePaymentOrderResponse>(endpoints.memberPayments.reconcile(order.id));
            const nextOrder = mergeOrder(data.data.order);
            setSelectedReceipt(order.id === selectedReceipt?.raw_order?.id ? orderToLogRow(nextOrder) : selectedReceipt);
            if (data.data.reconciled && nextOrder.status === "posted") {
                pushToast({
                    title: "Payment posted",
                    message: "The paid mobile money order has been posted successfully.",
                    type: "success"
                });
            } else {
                pushToast({
                    title: "No new posting yet",
                    message: `This order is currently ${formatPaymentStatus(nextOrder.status)}.`,
                    type: nextOrder.status === "failed" ? "error" : "success"
                });
            }
        } catch (reconcileError) {
            pushToast({
                title: "Reconcile failed",
                message: getApiErrorMessage(reconcileError, "Unable to reconcile this payment order."),
                type: "error"
            });
        } finally {
            setReconcilingOrderId(null);
        }
    };

    const columns: Column<PaymentLogRow>[] = [
        {
            key: "no",
            header: "No.",
            render: (row) => row.row_number
        },
        {
            key: "member",
            header: "Member",
            render: (row) => (
                <Stack spacing={0.35}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {row.member_name || "Unknown member"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {row.member_no || "No member number"}
                    </Typography>
                </Stack>
            )
        },
        {
            key: "operation",
            header: "Operation",
            render: (row) => (
                <Stack spacing={0.35}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatPaymentOperation(row.operation)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {row.account_label || row.loan_number || row.journal_id || "No account detail"}
                    </Typography>
                </Stack>
            )
        },
        {
            key: "channel",
            header: "Channel",
            render: (row) => (
                <Stack spacing={0.35}>
                    <Chip
                        size="small"
                        label={row.channel_label}
                        color={row.channel === "cash_desk" ? "primary" : "success"}
                        variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary">
                        {row.source === "teller" ? row.teller_name || "Teller" : "Member portal"}
                    </Typography>
                </Stack>
            )
        },
        {
            key: "amount",
            header: "Amount",
            render: (row) => (
                <Stack spacing={0.25} alignItems="flex-start">
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {formatCurrency(row.amount)}
                    </Typography>
                    <Typography variant="caption" color={row.direction === "out" ? "error.main" : "success.main"}>
                        {row.direction === "out" ? "Outflow" : "Inflow"}
                    </Typography>
                </Stack>
            )
        },
        {
            key: "status",
            header: "Status",
            render: (row) => (
                <Chip
                    size="small"
                    label={formatPaymentStatus(row.status)}
                    color={row.status === "posted" ? "success" : row.status === "failed" ? "error" : row.status === "expired" ? "warning" : "info"}
                    variant={row.status === "posted" ? "filled" : "outlined"}
                />
            )
        },
        {
            key: "reference",
            header: "Reference",
            render: (row) => (
                <Stack spacing={0.25}>
                    <Typography variant="body2" noWrap>
                        {row.reference || "N/A"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                        {row.journal_id ? `Journal ${row.journal_id.slice(0, 8)}...` : "No journal"}
                    </Typography>
                </Stack>
            )
        },
        {
            key: "date",
            header: "Date",
            render: (row) => formatDate(row.date)
        },
        {
            key: "actions",
            header: "Actions",
            render: (row) => (
                <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" onClick={() => setSelectedReceipt(row)}>
                        Detail
                    </Button>
                    {row.raw_order?.status === "paid" && !row.raw_order.posted_at ? (
                        <Button
                            size="small"
                            variant="contained"
                            onClick={() => void handleReconcile(row)}
                            disabled={reconcilingOrderId === row.raw_order.id}
                        >
                            {reconcilingOrderId === row.raw_order.id ? "Reconciling..." : "Reconcile"}
                        </Button>
                    ) : null}
                </Stack>
            )
        }
    ];

    if (loading) {
        return <AppLoader message="Loading payment operations..." />;
    }

    return (
        <Stack spacing={3}>
            <MotionCard
                variant="outlined"
                sx={{
                    background: theme.palette.mode === "dark"
                        ? `linear-gradient(135deg, ${alpha("#0F1A2B", 0.96)}, ${alpha("#124E78", 0.88)})`
                        : `linear-gradient(135deg, ${alpha(brandColors.primary[900], 0.96)}, ${alpha(brandColors.accent[700], 0.88)})`,
                    color: "#fff",
                    borderColor: "transparent"
                }}
            >
                <CardContent>
                    <Stack spacing={1.1}>
                        <Typography variant="overline" sx={{ color: alpha("#fff", 0.72), letterSpacing: 1.3 }}>
                            Branch payment operations
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.08 }}>
                            Track teller cash-desk postings and automated payment orders for {selectedBranchName || "the selected branch"}.
                        </Typography>
                        <Typography variant="body2" sx={{ color: alpha("#fff", 0.84), maxWidth: 920 }}>
                            Manual teller activity is the current operating channel, while member-portal mobile money remains visible for future automation. Both feeds are shown with their posting channel, reference, journal, and status.
                        </Typography>
                    </Stack>
                </CardContent>
            </MotionCard>

            {error ? (
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={() => void loadPaymentOperations()}>
                            Retry
                        </Button>
                    }
                >
                    {error}
                </Alert>
            ) : null}

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <MetricCard icon={ReceiptLongRoundedIcon} label="Total Actions" value={metrics.total} helper={`Inflow ${formatCurrency(metrics.inflow)} · outflow ${formatCurrency(metrics.outflow)}.`} tone="primary" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <MetricCard icon={PointOfSaleRoundedIcon} label="Teller Posted" value={metrics.teller} helper="Cash-desk transactions posted by tellers." tone="success" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <MetricCard icon={HourglassTopRoundedIcon} label="Gateway Orders" value={metrics.gateway} helper={`${metrics.inProgress} pending or paid orders need follow-up.`} tone="warning" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <MetricCard icon={HighlightOffRoundedIcon} label="Exceptions" value={metrics.failed} helper={`${metrics.posted} actions are posted into ledger.`} tone="danger" />
                </Grid>
            </Grid>

            <MotionCard variant="outlined">
                <CardContent>
                    <Stack spacing={2}>
                        <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} justifyContent="space-between">
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                    Payment Action Log
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Use this as the branch operational payment register across teller cash, mobile money, and posted journals.
                                </Typography>
                            </Box>
                            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} flexWrap="wrap" useFlexGap>
                                <TextField
                                    label="Search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Member, account, reference, teller..."
                                    sx={{ minWidth: 240 }}
                                />
                                <TextField select label="Operation" value={purposeFilter} onChange={(event) => setPurposeFilter(event.target.value)} sx={{ minWidth: 190 }}>
                                    <MenuItem value="all">All operations</MenuItem>
                                    <MenuItem value="savings_deposit">Savings deposits</MenuItem>
                                    <MenuItem value="savings_withdrawal">Savings withdrawals</MenuItem>
                                    <MenuItem value="loan_repayment">Loan repayments</MenuItem>
                                    <MenuItem value="loan_disbursement">Loan disbursements</MenuItem>
                                    <MenuItem value="membership_fee">Membership fees</MenuItem>
                                    <MenuItem value="fee_revenue">Fee / revenue</MenuItem>
                                    <MenuItem value="expense_payment">SACCO expenses</MenuItem>
                                </TextField>
                                <TextField select label="Channel" value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)} sx={{ minWidth: 160 }}>
                                    <MenuItem value="all">All channels</MenuItem>
                                    <MenuItem value="cash_desk">Cash desk</MenuItem>
                                    <MenuItem value="mobile_money">Mobile money</MenuItem>
                                </TextField>
                                <TextField select label="Source" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} sx={{ minWidth: 150 }}>
                                    <MenuItem value="all">All sources</MenuItem>
                                    <MenuItem value="teller">Teller</MenuItem>
                                    <MenuItem value="gateway">Gateway</MenuItem>
                                </TextField>
                                <TextField select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} sx={{ minWidth: 160 }}>
                                    <MenuItem value="all">All statuses</MenuItem>
                                    <MenuItem value="posted">Posted</MenuItem>
                                    <MenuItem value="created">Created</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="paid">Paid</MenuItem>
                                    <MenuItem value="failed">Failed</MenuItem>
                                    <MenuItem value="expired">Expired</MenuItem>
                                </TextField>
                            </Stack>
                        </Stack>

                        <DataTable rows={paginatedRows} columns={columns} emptyMessage="No payment actions match the current filters." maxHeight={620} stickyHeader />
                        <TablePagination
                            component="div"
                            count={filteredRows.length}
                            page={page}
                            onPageChange={(_, nextPage) => setPage(nextPage)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(event) => {
                                setRowsPerPage(Number(event.target.value));
                                setPage(0);
                            }}
                            rowsPerPageOptions={[10, 25, 50, 100]}
                        />
                    </Stack>
                </CardContent>
            </MotionCard>

            <Dialog open={Boolean(selectedReceipt)} onClose={() => setSelectedReceipt(null)} fullWidth maxWidth="sm">
                <DialogTitle>Payment Detail</DialogTitle>
                <DialogContent dividers>
                    {selectedReceipt ? (
                        <Stack spacing={2}>
                            <Alert
                                severity={
                                    selectedReceipt.status === "posted"
                                        ? "success"
                                        : selectedReceipt.status === "failed"
                                            ? "error"
                                            : selectedReceipt.status === "expired"
                                                ? "warning"
                                                : "info"
                                }
                                variant="outlined"
                            >
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.35 }}>
                                    {selectedReceipt.member_name || "Payment action"}
                                </Typography>
                                <Typography variant="body2">
                                    {formatPaymentOperation(selectedReceipt.operation)} · {formatPaymentStatus(selectedReceipt.status)} · {selectedReceipt.channel_label}
                                </Typography>
                            </Alert>

                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                <Stack spacing={1.1}>
                                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                        {formatCurrency(selectedReceipt.amount)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {selectedReceipt.direction === "out" ? "Outflow" : "Inflow"} · {selectedReceipt.currency}
                                    </Typography>
                                    <Divider />
                                    <Typography variant="body2"><strong>Channel:</strong> {selectedReceipt.channel_label}</Typography>
                                    <Typography variant="body2"><strong>Source:</strong> {selectedReceipt.source === "teller" ? "Teller cash desk" : "Member portal gateway"}</Typography>
                                    <Typography variant="body2"><strong>Member:</strong> {selectedReceipt.member_name || "N/A"}</Typography>
                                    <Typography variant="body2"><strong>Member No:</strong> {selectedReceipt.member_no || "N/A"}</Typography>
                                    <Typography variant="body2"><strong>Account / Loan:</strong> {selectedReceipt.account_label || selectedReceipt.loan_number || "N/A"}</Typography>
                                    <Typography variant="body2"><strong>Branch:</strong> {selectedReceipt.branch_name || selectedBranchName || "N/A"}</Typography>
                                    {selectedReceipt.teller_name ? <Typography variant="body2"><strong>Teller:</strong> {selectedReceipt.teller_name}</Typography> : null}
                                    <Typography variant="body2"><strong>Reference:</strong> {selectedReceipt.reference || "N/A"}</Typography>
                                    <Typography variant="body2"><strong>Date:</strong> {formatDate(selectedReceipt.date)}</Typography>
                                    {selectedReceipt.paid_at ? <Typography variant="body2"><strong>Paid:</strong> {formatDate(selectedReceipt.paid_at)}</Typography> : null}
                                    {selectedReceipt.posted_at ? <Typography variant="body2"><strong>Posted:</strong> {formatDate(selectedReceipt.posted_at)}</Typography> : null}
                                    {selectedReceipt.journal_id ? <Typography variant="body2"><strong>Journal:</strong> {selectedReceipt.journal_id}</Typography> : null}
                                    {selectedReceipt.receipt_count != null ? <Typography variant="body2"><strong>Receipts:</strong> {selectedReceipt.receipt_count}</Typography> : null}
                                    {selectedReceipt.description ? <Typography variant="body2"><strong>Description:</strong> {selectedReceipt.description}</Typography> : null}
                                    {selectedReceipt.error_message ? (
                                        <Typography variant="body2" color="error.main"><strong>Issue:</strong> {selectedReceipt.error_message}</Typography>
                                    ) : null}
                                </Stack>
                            </Paper>
                        </Stack>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button startIcon={<PrintRoundedIcon />} onClick={() => window.print()}>
                        Print
                    </Button>
                    <Button onClick={() => setSelectedReceipt(null)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}
