import { MotionCard } from "../ui/motion";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CreditScoreRoundedIcon from "@mui/icons-material/CreditScoreRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import PriceCheckRoundedIcon from "@mui/icons-material/PriceCheckRounded";
import {
    Alert,
    Avatar,
    Box,
    Button,
    CardContent,
    Chip,
    Divider,
    Grid,
    Stack,
    Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { AppLoader } from "../components/AppLoader";
import { DataTable, type Column } from "../components/DataTable";
import { useToast } from "../components/Toast";
import { api, getApiErrorMessage } from "../lib/api";
import {
    endpoints,
    type LoanSchedulesResponse,
    type LoanTransactionsResponse,
    type LoansResponse
} from "../lib/endpoints";
import { loadAllMembers } from "../lib/loadAllMembers";
import type { Loan, LoanSchedule, LoanTransaction, Member } from "../types/api";
import { formatCurrency, formatDate } from "../utils/format";
import { formatMonthlyLoanRate } from "../utils/loanInterest";

// Schedule rows in the table are either real loan_schedules rows or
// client-side projections that extend the schedule to loan completion.
// `carried` marks how much residual principal was moved off a rebuilt row
// into the projected installments for display.
type ScheduleRow = LoanSchedule & { projected?: boolean; carried?: number };

function addMonths(date: Date, count: number) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + count);
    return next;
}

function MetricCard({
    title,
    value,
    helper,
    icon,
    status,
    tone = "neutral"
}: {
    title: string;
    value: string;
    helper: string;
    icon: React.ReactNode;
    status?: string;
    tone?: "positive" | "negative" | "neutral";
}) {
    const theme = useTheme();
    const neutralAccent = theme.palette.mode === "dark" ? "#D9B273" : theme.palette.primary.main;
    const toneColor =
        tone === "positive"
            ? theme.palette.success.main
            : tone === "negative"
                ? theme.palette.error.main
                : neutralAccent;

    return (
        <MotionCard
            variant="outlined"
            sx={{
                height: "100%",
                borderColor: alpha(toneColor, 0.2),
                background: `linear-gradient(140deg, ${alpha(toneColor, 0.08)}, ${theme.palette.background.paper})`
            }}
        >
            <CardContent sx={{ height: "100%", p: 2, "&:last-child": { pb: 2 } }}>
                <Stack spacing={0.75} sx={{ height: "100%" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                {title}
                            </Typography>
                            <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>
                                {value}
                            </Typography>
                        </Box>
                        <Avatar
                            variant="rounded"
                            sx={{
                                width: 34,
                                height: 34,
                                borderRadius: 1.5,
                                bgcolor: alpha(toneColor, 0.12),
                                color: toneColor
                            }}
                        >
                            {icon}
                        </Avatar>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                        {helper}
                    </Typography>
                    {status ? (
                        <Chip
                            label={status}
                            size="small"
                            variant="outlined"
                            sx={{
                                width: "fit-content",
                                mt: "auto",
                                color: toneColor,
                                borderColor: alpha(toneColor, 0.32),
                                bgcolor: alpha(toneColor, 0.1),
                                fontWeight: 700
                            }}
                        />
                    ) : null}
                </Stack>
            </CardContent>
        </MotionCard>
    );
}

export function LoanDetailPage() {
    const theme = useTheme();
    const dashboardAccent = theme.palette.mode === "dark" ? "#D9B273" : theme.palette.primary.main;
    const dashboardAccentStrong = theme.palette.mode === "dark" ? "#C89B52" : theme.palette.primary.dark;
    const darkAccentOutlinedSx = theme.palette.mode === "dark"
        ? {
            borderColor: alpha(dashboardAccent, 0.44),
            color: dashboardAccent,
            "&:hover": { borderColor: alpha(dashboardAccent, 0.78), bgcolor: alpha(dashboardAccent, 0.1) }
        }
        : undefined;
    const darkAccentChipSx = theme.palette.mode === "dark"
        ? {
            borderColor: alpha(dashboardAccent, 0.44),
            color: dashboardAccent,
            bgcolor: alpha(dashboardAccent, 0.1)
        }
        : undefined;
    const darkAccentContainedSx = theme.palette.mode === "dark"
        ? { bgcolor: dashboardAccent, color: "#1a1a1a", "&:hover": { bgcolor: dashboardAccentStrong } }
        : undefined;
    const navigate = useNavigate();
    const { loanId } = useParams<{ loanId: string }>();
    const { pushToast } = useToast();
    const { selectedTenantId } = useAuth();
    const [loan, setLoan] = useState<Loan | null>(null);
    const [member, setMember] = useState<Member | null>(null);
    const [schedules, setSchedules] = useState<LoanSchedule[]>([]);
    const [transactions, setTransactions] = useState<LoanTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadLoanDetails = async () => {
            if (!selectedTenantId || !loanId) {
                setLoading(false);
                return;
            }

            setLoading(true);

            try {
                const [membersList, { data: loansResponse }, { data: schedulesResponse }, { data: transactionsResponse }] = await Promise.all([
                    loadAllMembers(selectedTenantId),
                    api.get<LoansResponse>(endpoints.finance.loanPortfolio(), {
                        params: { tenant_id: selectedTenantId, loan_id: loanId, page: 1, limit: 100 }
                    }),
                    api.get<LoanSchedulesResponse>(endpoints.finance.loanSchedules(), {
                        params: { tenant_id: selectedTenantId, loan_id: loanId, page: 1, limit: 100 }
                    }),
                    api.get<LoanTransactionsResponse>(endpoints.finance.loanTransactions(), {
                        params: { tenant_id: selectedTenantId, loan_id: loanId, page: 1, limit: 100 }
                    })
                ]);

                const resolvedLoan = (loansResponse.data || []).find((entry) => entry.id === loanId) || null;
                const resolvedMember = resolvedLoan
                    ? membersList.find((entry) => entry.id === resolvedLoan.member_id) || null
                    : null;

                setLoan(resolvedLoan);
                setMember(resolvedMember);
                setSchedules(schedulesResponse.data || []);
                setTransactions(transactionsResponse.data || []);
            } catch (error) {
                pushToast({
                    type: "error",
                    title: "Unable to load loan details",
                    message: getApiErrorMessage(error)
                });
            } finally {
                setLoading(false);
            }
        };

        void loadLoanDetails();
    }, [loanId, pushToast, selectedTenantId]);
    const pendingAmount = (schedule: LoanSchedule) =>
        Math.max(schedule.principal_due - schedule.principal_paid, 0) + Math.max(schedule.interest_due - schedule.interest_paid, 0);

    const sortedSchedules = useMemo(
        () =>
            [...schedules].sort((left, right) => {
                if (left.installment_number !== right.installment_number) {
                    return left.installment_number - right.installment_number;
                }
                return new Date(left.due_date).getTime() - new Date(right.due_date).getTime();
            }),
        [schedules]
    );
    // The backend only stores schedule rows for elapsed periods (rebuilt loans
    // carry the residual principal on the current installment), so extend the
    // table with projected installments until the outstanding balance clears.
    // Projection follows the engine's conventions: interest on principal only,
    // one period per month, remainder amortized over the remaining term.
    const projectedSchedules = useMemo<ScheduleRow[]>(() => {
        if (!loan || ["closed", "written_off"].includes(loan.status) || loan.outstanding_principal <= 0.5) {
            return [];
        }
        // Full schedule already exists (untouched loans keep their contractual
        // rows from disbursement) — nothing to project beyond it.
        if (sortedSchedules.length >= loan.term_count) {
            return [];
        }
        const lastRow = sortedSchedules[sortedSchedules.length - 1] || null;

        const monthlyRate = loan.annual_interest_rate / 100 / 12;
        const startNumber = lastRow?.installment_number ?? 0;
        const startDate = lastRow
            ? new Date(lastRow.due_date)
            : loan.disbursed_at
                ? new Date(loan.disbursed_at)
                : new Date();
        const remainingCount = Math.max(loan.term_count - startNumber, 1);
        let balance = loan.outstanding_principal;
        const installment = monthlyRate > 0
            ? (balance * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -remainingCount))
            : balance / remainingCount;

        const rows: ScheduleRow[] = [];
        for (let index = 0; index < remainingCount && balance > 0.5; index += 1) {
            const interest = Math.round(balance * monthlyRate * 100) / 100
                + (index === 0 ? loan.accrued_interest || 0 : 0);
            const isFinal = index === remainingCount - 1;
            const principal = isFinal ? balance : Math.min(balance, Math.max(installment - interest, 0));
            rows.push({
                id: `projected-${startNumber + index + 1}`,
                tenant_id: loan.tenant_id,
                loan_id: loan.id,
                installment_number: startNumber + index + 1,
                due_date: addMonths(startDate, index + 1).toISOString().slice(0, 10),
                principal_due: principal,
                interest_due: interest,
                principal_paid: 0,
                interest_paid: 0,
                status: "pending",
                projected: true
            });
            balance -= principal;
        }
        return rows;
    }, [loan, sortedSchedules]);

    // Rebuilt loans park the entire residual principal on the newest elapsed
    // installment and their per-row paid fields go stale against the ledger.
    // When the projection represents the residual as future installments:
    //  - cap the rebuilt row at its contractual annuity share, and
    //  - re-derive Paid by allocating actual ledger repayments to the elapsed
    //    installments in order (the last one absorbs any surplus, which is
    //    already reflected in the lower outstanding balance the projection
    //    spreads).
    const displaySchedules = useMemo<ScheduleRow[]>(() => {
        if (!loan || !projectedSchedules.length || !sortedSchedules.length) {
            return sortedSchedules;
        }
        const monthlyRate = loan.annual_interest_rate / 100 / 12;
        const annuity = monthlyRate > 0
            ? (loan.principal_amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -loan.term_count))
            : loan.principal_amount / loan.term_count;
        const lastIndex = sortedSchedules.length - 1;
        let cashLeft = transactions
            .filter((entry) => entry.transaction_type === "loan_repayment")
            .reduce((sum, entry) => sum + entry.amount, 0);
        return sortedSchedules.map((row, index) => {
            const isLast = index === lastIndex;
            const contractualPrincipal = Math.max(Math.round((annuity - row.interest_due) * 100) / 100, 0);
            const principalDue = isLast && row.principal_due > contractualPrincipal
                ? contractualPrincipal
                : row.principal_due;
            const carried = isLast ? Math.max(row.principal_due - principalDue, 0) : 0;
            const allocated = isLast ? cashLeft : Math.min(cashLeft, principalDue + row.interest_due);
            cashLeft -= allocated;
            const interestPaid = Math.min(allocated, row.interest_due);
            return {
                ...row,
                principal_due: principalDue,
                interest_paid: interestPaid,
                principal_paid: allocated - interestPaid,
                carried: carried > 0.5 ? carried : undefined
            };
        });
    }, [loan, projectedSchedules.length, sortedSchedules, transactions]);

    const openSchedules = useMemo(
        () =>
            displaySchedules.filter(
                (schedule) =>
                    ["pending", "partial", "overdue"].includes(schedule.status)
                    && pendingAmount(schedule) > 0.5
            ),
        [displaySchedules]
    );
    const overdueSchedules = useMemo(
        () => openSchedules.filter((schedule) => schedule.status === "overdue"),
        [openSchedules]
    );
    const overdueExposure = useMemo(
        () => overdueSchedules.reduce((sum, schedule) => sum + pendingAmount(schedule), 0),
        [overdueSchedules]
    );
    const openWithProjected = useMemo<ScheduleRow[]>(
        () => [...openSchedules, ...projectedSchedules],
        [openSchedules, projectedSchedules]
    );
    const dueWithin7Days = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return openWithProjected.filter((schedule) => {
            const dueDate = new Date(schedule.due_date);
            const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
            const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 7;
        }).length;
    }, [openWithProjected]);
    const nextDueSchedule = useMemo(() => {
        return [...openWithProjected].sort(
            (left, right) => new Date(left.due_date).getTime() - new Date(right.due_date).getTime()
        )[0] || null;
    }, [openWithProjected]);
    const oldestOverdueDays = useMemo(() => {
        if (!overdueSchedules.length) {
            return 0;
        }

        const today = new Date();
        return Math.max(
            ...overdueSchedules.map((schedule) =>
                Math.max(
                    Math.floor((today.getTime() - new Date(schedule.due_date).getTime()) / (1000 * 60 * 60 * 24)),
                    0
                )
            )
        );
    }, [overdueSchedules]);
    const paidInstallments = useMemo(
        () =>
            displaySchedules.filter(
                (schedule) => schedule.status === "paid" || pendingAmount(schedule) <= 0.5
            ).length,
        [displaySchedules]
    );
    const totalInstallmentCount = displaySchedules.length + projectedSchedules.length;
    const progressPercent = totalInstallmentCount ? (paidInstallments / totalInstallmentCount) * 100 : 0;
    const totalRepaidAmount = useMemo(
        () =>
            transactions
                .filter((entry) => entry.transaction_type === "loan_repayment")
                .reduce((sum, entry) => sum + entry.amount, 0),
        [transactions]
    );
    const orderedTransactions = useMemo(
        () =>
            [...transactions].sort(
                (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
            ),
        [transactions]
    );
    const prioritySchedules = useMemo(
        () =>
            openSchedules
                .map((schedule) => ({
                    ...schedule,
                    pending: pendingAmount(schedule)
                }))
                .sort((left, right) => {
                    const leftPriority = left.status === "overdue" ? 0 : left.status === "partial" ? 1 : 2;
                    const rightPriority = right.status === "overdue" ? 0 : right.status === "partial" ? 1 : 2;
                    if (leftPriority !== rightPriority) {
                        return leftPriority - rightPriority;
                    }

                    return new Date(left.due_date).getTime() - new Date(right.due_date).getTime();
                })
                .slice(0, 6),
        [openSchedules]
    );

    const scheduleRowsWithProjection = useMemo<ScheduleRow[]>(
        () => [...displaySchedules, ...projectedSchedules],
        [displaySchedules, projectedSchedules]
    );
    const totalRemainingToPay = useMemo(
        () =>
            scheduleRowsWithProjection.reduce(
                (sum, row) =>
                    sum
                    + Math.max(row.principal_due - row.principal_paid, 0)
                    + Math.max(row.interest_due - row.interest_paid, 0),
                0
            ),
        [scheduleRowsWithProjection]
    );
    const projectedPayoffDate = projectedSchedules.length
        ? projectedSchedules[projectedSchedules.length - 1].due_date
        : null;

    const transactionColumns: Column<LoanTransaction>[] = useMemo(
        () => [
            { key: "created", header: "Date", render: (row) => formatDate(row.created_at) },
            {
                key: "type",
                header: "Type",
                render: (row) =>
                    row.transaction_type === "loan_repayment"
                        ? "Repayment"
                        : row.transaction_type === "loan_disbursement"
                            ? "Disbursement"
                            : "Interest Accrual"
            },
            { key: "amount", header: "Amount", render: (row) => formatCurrency(row.amount) },
            { key: "principal", header: "Principal", render: (row) => formatCurrency(row.principal_component) },
            { key: "interest", header: "Interest", render: (row) => formatCurrency(row.interest_component) },
            { key: "reference", header: "Reference", render: (row) => row.reference || "N/A" }
        ],
        []
    );

    const scheduleColumns: Column<ScheduleRow>[] = useMemo(
        () => [
            { key: "installment", header: "Installment", render: (row) => String(row.installment_number) },
            { key: "due", header: "Due Date", render: (row) => formatDate(row.due_date) },
            { key: "principal", header: "Principal Due", render: (row) => formatCurrency(row.principal_due) },
            { key: "interest", header: "Interest Due", render: (row) => formatCurrency(row.interest_due) },
            {
                key: "total",
                header: "Total to Pay",
                render: (row) => (
                    <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                        {formatCurrency(row.principal_due + row.interest_due)}
                    </Typography>
                )
            },
            {
                key: "paid",
                header: "Paid",
                render: (row) => (row.projected ? "—" : formatCurrency(row.principal_paid + row.interest_paid))
            },
            {
                key: "pending",
                header: "Pending Due",
                render: (row) => {
                    const pending = Math.max(row.principal_due - row.principal_paid, 0) + Math.max(row.interest_due - row.interest_paid, 0);
                    return formatCurrency(pending);
                }
            },
            {
                key: "status",
                header: "Status",
                render: (row) => {
                    if (row.projected) {
                        return (
                            <Chip
                                size="small"
                                label="projected"
                                variant="outlined"
                                sx={{ borderStyle: "dashed", color: "text.secondary" }}
                            />
                        );
                    }

                    const rowPending = Math.max(row.principal_due - row.principal_paid, 0) + Math.max(row.interest_due - row.interest_paid, 0);
                    if (rowPending <= 0.5) {
                        return <Chip size="small" label="paid" color="success" variant="filled" />;
                    }

                    const daysFromToday = Math.floor((new Date(row.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    const label = row.status === "overdue"
                        ? `${Math.abs(daysFromToday)}d overdue`
                        : row.status === "pending" || row.status === "partial"
                            ? daysFromToday >= 0
                                ? `due in ${daysFromToday}d`
                                : `${Math.abs(daysFromToday)}d late`
                            : row.status;

                    return (
                        <Chip
                            size="small"
                            label={label}
                            color={row.status === "paid" ? "success" : row.status === "overdue" ? "error" : row.status === "partial" ? "warning" : "default"}
                            variant={row.status === "paid" ? "filled" : "outlined"}
                        />
                    );
                }
            }
        ],
        []
    );

    if (loading) {
        return <AppLoader message="Loading loan details..." />;
    }

    if (!loan) {
        return (
            <Stack spacing={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Button
                        variant="text"
                        color="inherit"
                        startIcon={<ArrowBackRoundedIcon />}
                        onClick={() => navigate("/loans")}
                    >
                        Back to Loans
                    </Button>
                </Stack>
                <Alert severity="warning" variant="outlined">
                    The selected loan could not be found in your current workspace.
                </Alert>
            </Stack>
        );
    }

    return (
        <Stack spacing={2}>
            <MotionCard
                variant="outlined"
                sx={{
                    borderRadius: 2,
                    background: theme.palette.mode === "dark"
                        ? `linear-gradient(135deg, ${alpha("#1B2535", 0.92)}, ${alpha("#D9B273", 0.16)})`
                        : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.background.paper, 0.95)})`
                }}
            >
                <CardContent sx={{ p: { xs: 2, md: 2.25 }, "&:last-child": { pb: { xs: 2, md: 2.25 } } }}>
                    <Stack spacing={1.5}>
                        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Button
                                    variant="text"
                                    color="inherit"
                                    size="small"
                                    startIcon={<ArrowBackRoundedIcon />}
                                    onClick={() => navigate("/loans")}
                                    sx={{ ml: -1, flexShrink: 0 }}
                                >
                                    Loans
                                </Button>
                                <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                                    {loan.loan_number}
                                </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                                <Chip
                                    size="small"
                                    label={loan.status}
                                    color={loan.status === "active" ? "success" : loan.status === "in_arrears" ? "warning" : "default"}
                                    variant={loan.status === "active" ? "filled" : "outlined"}
                                />
                                <Chip
                                    size="small"
                                    label={nextDueSchedule ? `Next due ${formatDate(nextDueSchedule.due_date)}` : "No open schedule"}
                                    color={nextDueSchedule ? "primary" : "default"}
                                    variant="outlined"
                                    sx={nextDueSchedule ? darkAccentChipSx : undefined}
                                />
                                <Chip
                                    size="small"
                                    label={overdueSchedules.length ? `${overdueSchedules.length} overdue` : "No overdue"}
                                    color={overdueSchedules.length ? "error" : "success"}
                                    variant="outlined"
                                />
                            </Stack>
                        </Stack>

                        <Grid container spacing={1.5}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Box sx={{ p: 1.5, height: "100%", border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                    <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.6 }}>Borrower</Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                        {member?.full_name || "Unknown member"}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" component="p">
                                        {member?.phone || "No phone recorded"}{member?.email ? ` · ${member.email}` : ""}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Box sx={{ p: 1.5, height: "100%", border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                    <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.6 }}>Loan Terms</Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                        {loan.term_count} {loan.repayment_frequency} · {formatMonthlyLoanRate(loan.annual_interest_rate)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" component="p">
                                        Disbursed {formatDate(loan.disbursed_at)}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Box sx={{ p: 1.5, height: "100%", border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                    <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.6 }}>Collections Health</Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                        {progressPercent.toFixed(1)}% repaid · {paidInstallments}/{totalInstallmentCount || 0} settled
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" component="p">
                                        {oldestOverdueDays > 0 ? `Oldest overdue ${oldestOverdueDays} day(s)` : "No delinquency aging"}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Stack>
                </CardContent>
            </MotionCard>

            <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricCard
                        title="Principal"
                        value={formatCurrency(loan.principal_amount)}
                        helper="Original disbursed amount."
                        status="Booked value"
                        tone="neutral"
                        icon={<CreditScoreRoundedIcon fontSize="small" />}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricCard
                        title="Outstanding"
                        value={formatCurrency(loan.outstanding_principal)}
                        helper="Principal still to be settled."
                        status={loan.outstanding_principal > 0 ? "Open balance" : "Fully cleared"}
                        tone={loan.outstanding_principal > 0 ? "neutral" : "positive"}
                        icon={<PaymentsRoundedIcon fontSize="small" />}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricCard
                        title="Overdue Exposure"
                        value={formatCurrency(overdueExposure)}
                        helper={`${overdueSchedules.length} overdue installment(s).`}
                        status={overdueSchedules.length > 0 ? "Action required" : "No overdue exposure"}
                        tone={overdueSchedules.length > 0 ? "negative" : "positive"}
                        icon={<PriceCheckRoundedIcon fontSize="small" />}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricCard
                        title="Total Repaid"
                        value={formatCurrency(totalRepaidAmount)}
                        helper="Cumulative repayments posted."
                        status={`${dueWithin7Days} due in 7 days`}
                        tone={dueWithin7Days > 0 ? "neutral" : "positive"}
                        icon={<CalendarMonthRoundedIcon fontSize="small" />}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, lg: 7 }}>
                    <MotionCard variant="outlined" sx={{ height: "100%" }}>
                        <CardContent sx={{ height: "100%", p: 2, "&:last-child": { pb: 2 } }}>
                            <Stack spacing={1.5} sx={{ height: "100%" }}>
                                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.25}>
                                    <Typography variant="h6">Collections Priority Board</Typography>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => navigate("/follow-ups")}
                                        sx={darkAccentOutlinedSx}
                                    >
                                        Open Follow-ups
                                    </Button>
                                </Stack>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    <Chip
                                        label={`${overdueSchedules.length} overdue`}
                                        color={overdueSchedules.length > 0 ? "error" : "success"}
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={`${dueWithin7Days} due this week`}
                                        color={dueWithin7Days > 0 ? "warning" : "success"}
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={`${formatCurrency(overdueExposure)} exposed`}
                                        color="primary"
                                        variant="outlined"
                                        sx={darkAccentChipSx}
                                    />
                                </Stack>
                                <Divider />
                                {prioritySchedules.length ? (
                                    <Stack spacing={1.1}>
                                        {prioritySchedules.map((schedule) => (
                                            <Button
                                                key={schedule.id}
                                                variant="text"
                                                color="inherit"
                                                onClick={() => navigate("/loans")}
                                                sx={{ px: 0, py: 0.75, justifyContent: "space-between", textTransform: "none" }}
                                            >
                                                <Stack spacing={0.2} sx={{ textAlign: "left", flex: 1 }}>
                                                    <Typography variant="subtitle2">
                                                        Installment {schedule.installment_number} · Due {formatDate(schedule.due_date)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Pending {formatCurrency(schedule.pending)}
                                                    </Typography>
                                                </Stack>
                                                <Chip
                                                    size="small"
                                                    label={schedule.status}
                                                    color={schedule.status === "overdue" ? "error" : schedule.status === "partial" ? "warning" : "default"}
                                                    variant={schedule.status === "overdue" ? "filled" : "outlined"}
                                                />
                                            </Button>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Alert severity="success" variant="outlined">
                                        No pending installment action is currently required for this loan.
                                    </Alert>
                                )}
                            </Stack>
                        </CardContent>
                    </MotionCard>
                </Grid>
                <Grid size={{ xs: 12, lg: 5 }}>
                    <MotionCard variant="outlined" sx={{ height: "100%" }}>
                        <CardContent sx={{ height: "100%", p: 2, "&:last-child": { pb: 2 } }}>
                            <Stack spacing={1.5}>
                                <Typography variant="h6">Repayment Snapshot</Typography>
                                <Stack spacing={1}>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">Open installments</Typography>
                                        <Typography variant="subtitle2">{openWithProjected.length}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">Paid installments</Typography>
                                        <Typography variant="subtitle2">{paidInstallments}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">Total transactions</Typography>
                                        <Typography variant="subtitle2">{orderedTransactions.length}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">Accrued interest</Typography>
                                        <Typography variant="subtitle2">{formatCurrency(loan.accrued_interest)}</Typography>
                                    </Stack>
                                    {projectedPayoffDate ? (
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="body2" color="text.secondary">Projected payoff</Typography>
                                            <Typography variant="subtitle2">{formatDate(projectedPayoffDate)}</Typography>
                                        </Stack>
                                    ) : null}
                                </Stack>
                                <Divider />
                                {overdueSchedules.length > 0 ? (
                                    <Alert severity="warning" variant="outlined">
                                        {overdueSchedules.length} installment(s) are delinquent. Collections outreach should be prioritized.
                                    </Alert>
                                ) : (
                                    <Alert severity="success" variant="outlined">
                                        No installment is currently overdue for this account.
                                    </Alert>
                                )}
                                <Button
                                    variant="contained"
                                    onClick={() => navigate("/loans")}
                                    sx={darkAccentContainedSx}
                                >
                                    Back to Loan Portfolio
                                </Button>
                            </Stack>
                        </CardContent>
                    </MotionCard>
                </Grid>
            </Grid>

            <MotionCard variant="outlined">
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ mb: 1.5 }}>
                        <Typography variant="h6">Amortization Schedule</Typography>
                        {projectedSchedules.length ? (
                            <Typography variant="caption" color="text.secondary">
                                Includes {projectedSchedules.length} projected installment(s) spreading the outstanding {formatCurrency(loan.outstanding_principal)} to payoff.
                                {displaySchedules.some((row) => row.carried) ? " The current installment shows only its contractual share; the remaining balance is carried into the projected rows." : ""}
                                {" "}Actual dues are recomputed at each posting.
                            </Typography>
                        ) : null}
                    </Stack>
                    <DataTable rows={scheduleRowsWithProjection} columns={scheduleColumns} emptyMessage="No amortization schedule found for this loan." />
                    {scheduleRowsWithProjection.length ? (
                        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 1.5 }} alignItems="baseline">
                            <Typography variant="body2" color="text.secondary">
                                Total remaining to pay until payoff:
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                                {formatCurrency(totalRemainingToPay)}
                            </Typography>
                        </Stack>
                    ) : null}
                </CardContent>
            </MotionCard>

            <MotionCard variant="outlined">
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="h6" sx={{ mb: 1.5 }}>Repayment and Activity History</Typography>
                    <DataTable rows={orderedTransactions} columns={transactionColumns} emptyMessage="No loan activity recorded yet." />
                </CardContent>
            </MotionCard>
        </Stack>
    );
}
