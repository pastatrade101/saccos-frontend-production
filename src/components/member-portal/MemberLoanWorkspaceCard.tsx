import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
    Alert,
    Box,
    Button,
    CardContent,
    Chip,
    Divider,
    Grid,
    LinearProgress,
    MenuItem,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import { alpha, useTheme, type SxProps, type Theme } from "@mui/material/styles";
import { useMemo } from "react";

import { MotionCard } from "../../ui/motion";
import type { Loan, LoanSchedule, LoanTransaction, PaymentOrder } from "../../types/api";
import { brandColors } from "../../theme/colors";
import { formatCurrency, formatDate } from "../../utils/format";
import { formatMonthlyLoanRate } from "../../utils/loanInterest";

interface MemberLoanWorkspaceCardProps {
    selectedLoan: Loan | null;
    loans: Loan[];
    loanSchedules: LoanSchedule[];
    loanTransactions: LoanTransaction[];
    loanDetailId: string;
    onLoanChange: (value: string) => void;
    latestLoanRepaymentPaymentOrder: PaymentOrder | null;
    loanRepaymentEnabled: boolean;
    canShowLoanRepaymentOption: boolean;
    hasRepaymentLoanOption: boolean;
    submittingContribution: boolean;
    onRepay: () => void;
    onDownloadStatement: () => void;
    onPrint: () => void;
    prepaymentAmount: number;
    onPrepaymentAmountChange: (value: number) => void;
    prepaymentProjection: {
        newOutstanding: number;
        termsReduced: number;
    } | null;
    repayButtonSx?: SxProps<Theme>;
}

const MIN_MEANINGFUL_LOAN_OUTSTANDING = 1;

function getDaysUntil(dateString?: string | null) {
    if (!dateString) {
        return null;
    }

    const target = new Date(dateString);
    const now = new Date();
    const ms = target.getTime() - now.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function getRepaymentFrequencyLabel(frequency: Loan["repayment_frequency"]) {
    if (frequency === "daily") {
        return "Daily";
    }

    if (frequency === "weekly") {
        return "Weekly";
    }

    return "Monthly";
}

function getScheduleOutstanding(schedule: LoanSchedule) {
    const principalOutstanding = Math.max(Number(schedule.principal_due || 0) - Number(schedule.principal_paid || 0), 0);
    const interestOutstanding = Math.max(Number(schedule.interest_due || 0) - Number(schedule.interest_paid || 0), 0);

    return {
        principalOutstanding,
        interestOutstanding,
        totalOutstanding: principalOutstanding + interestOutstanding
    };
}

function hasMeaningfulOutstanding(schedule: LoanSchedule) {
    return getScheduleOutstanding(schedule).totalOutstanding >= MIN_MEANINGFUL_LOAN_OUTSTANDING;
}

function estimatePenaltyForSchedule(schedule: LoanSchedule) {
    if (schedule.status !== "overdue") {
        return 0;
    }

    return getScheduleOutstanding(schedule).totalOutstanding * 0.02;
}

function formatLoanStatusLabel(status: Loan["status"]) {
    return status.replace(/_/g, " ");
}

function LoanMiniMetric({
    icon: Icon,
    label,
    value,
    helper,
    tone = "primary"
}: {
    icon: typeof AutoGraphRoundedIcon;
    label: string;
    value: string;
    helper: string;
    tone?: "primary" | "success" | "warning";
}) {
    const theme = useTheme();
    const toneColor = tone === "success"
        ? brandColors.success
        : tone === "warning"
            ? brandColors.warning
            : brandColors.primary[700];

    return (
        <Box
            sx={{
                p: 1.6,
                borderRadius: 1.5,
                border: `1px solid ${alpha(toneColor, theme.palette.mode === "dark" ? 0.28 : 0.18)}`,
                bgcolor: theme.palette.mode === "dark"
                    ? alpha(toneColor, 0.08)
                    : alpha(toneColor, 0.04),
                height: "100%"
            }}
        >
            <Stack direction="row" spacing={1.1} alignItems="flex-start">
                <Box
                    sx={{
                        width: 34,
                        height: 34,
                        borderRadius: 1.25,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: alpha(toneColor, theme.palette.mode === "dark" ? 0.2 : 0.12),
                        color: toneColor,
                        flexShrink: 0
                    }}
                >
                    <Icon fontSize="small" />
                </Box>
                <Stack spacing={0.4} sx={{ minWidth: 0 }}>
                    <Typography variant="overline" sx={{ color: "text.secondary", lineHeight: 1.2 }}>
                        {label}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        {value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {helper}
                    </Typography>
                </Stack>
            </Stack>
        </Box>
    );
}

function DetailList({
    title,
    description,
    items
}: {
    title: string;
    description: string;
    items: Array<{ label: string; value: string }>;
}) {
    return (
        <Box
            sx={{
                p: 2,
                borderRadius: 1.75,
                border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                bgcolor: (theme) => theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.02) : alpha("#FFFFFF", 0.85),
                height: "100%"
            }}
        >
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
                {description}
            </Typography>
            <Stack spacing={1}>
                {items.map((item) => (
                    <Stack key={item.label} direction="row" justifyContent="space-between" spacing={1.5} alignItems="flex-start">
                        <Typography variant="body2" color="text.secondary">
                            {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, textAlign: "right" }}>
                            {item.value}
                        </Typography>
                    </Stack>
                ))}
            </Stack>
        </Box>
    );
}

export function MemberLoanWorkspaceCard({
    selectedLoan,
    loans,
    loanSchedules,
    loanTransactions,
    loanDetailId,
    onLoanChange,
    latestLoanRepaymentPaymentOrder,
    loanRepaymentEnabled,
    canShowLoanRepaymentOption,
    hasRepaymentLoanOption,
    submittingContribution,
    onRepay,
    onDownloadStatement,
    onPrint,
    prepaymentAmount,
    onPrepaymentAmountChange,
    prepaymentProjection,
    repayButtonSx
}: MemberLoanWorkspaceCardProps) {
    const theme = useTheme();
    const selectedLoanSchedules = useMemo(
        () =>
            selectedLoan
                ? loanSchedules
                    .filter((schedule) => schedule.loan_id === selectedLoan.id)
                    .sort((left, right) => new Date(left.due_date).getTime() - new Date(right.due_date).getTime())
                : [],
        [loanSchedules, selectedLoan]
    );
    const selectedLoanTransactions = useMemo(
        () =>
            selectedLoan
                ? loanTransactions
                    .filter((transaction) => transaction.loan_id === selectedLoan.id)
                    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
                : [],
        [loanTransactions, selectedLoan]
    );

    const actionableSchedules = selectedLoanSchedules.filter(hasMeaningfulOutstanding);
    const nextDueSchedule = actionableSchedules[0] || null;
    const nextDueAmount = nextDueSchedule ? getScheduleOutstanding(nextDueSchedule).totalOutstanding : 0;
    const overdueSchedules = actionableSchedules.filter((schedule) => schedule.due_date < new Date().toISOString().slice(0, 10));
    const overdueAmount = overdueSchedules.reduce((sum, schedule) => sum + getScheduleOutstanding(schedule).totalOutstanding, 0);
    const penaltyEstimate = selectedLoanSchedules.reduce((sum, schedule) => sum + estimatePenaltyForSchedule(schedule), 0);
    const paidInstallments = selectedLoanSchedules.filter((schedule) => !hasMeaningfulOutstanding(schedule)).length;
    const remainingInstallments = actionableSchedules.length;
    const lastRepayment = selectedLoanTransactions.find((transaction) => transaction.transaction_type === "loan_repayment") || null;
    const totalOutstanding = Math.max(Number(selectedLoan?.outstanding_principal || 0), 0) + Math.max(Number(selectedLoan?.accrued_interest || 0), 0);
    const principalProgressPercent = selectedLoan && selectedLoan.principal_amount > 0
        ? ((selectedLoan.principal_amount - selectedLoan.outstanding_principal) / selectedLoan.principal_amount) * 100
        : 0;
    const daysUntilNextDue = getDaysUntil(nextDueSchedule?.due_date || null);
    const dueNowAmount = overdueAmount > 0 ? overdueAmount : nextDueAmount;

    const snapshotTone = !selectedLoan
        ? "info"
        : selectedLoan.status === "written_off"
            ? "error"
            : selectedLoan.status === "in_arrears" || overdueSchedules.length
                ? "warning"
                : totalOutstanding <= 0 || selectedLoan.status === "closed"
                    ? "success"
                    : "info";

    const snapshotTitle = !selectedLoan
        ? "No loan selected"
        : selectedLoan.status === "written_off"
            ? "This loan has been written off"
            : selectedLoan.status === "in_arrears" || overdueSchedules.length
                ? "This loan needs attention"
            : totalOutstanding <= 0 || selectedLoan.status === "closed"
                    ? "This loan is fully cleared"
                    : !nextDueSchedule
                        ? "No installment is currently due"
                    : daysUntilNextDue !== null && daysUntilNextDue <= 0 && nextDueAmount > 0
                        ? "An installment is due now"
                        : daysUntilNextDue !== null && daysUntilNextDue <= 7
                            ? "Your next installment is coming up soon"
                            : "This loan is currently in good standing";

    const snapshotMessage = !selectedLoan
        ? "Pick a loan facility to review balances, next due amounts, and repayment history."
        : selectedLoan.status === "written_off"
            ? "Branch operations have marked this facility as written off. Contact your branch for the latest recovery guidance."
            : selectedLoan.status === "in_arrears" || overdueSchedules.length
                ? `${overdueSchedules.length} installment(s) are overdue. About ${formatCurrency(dueNowAmount)} needs attention now, and penalties are estimated at ${formatCurrency(penaltyEstimate)}.`
                : totalOutstanding <= 0 || selectedLoan.status === "closed"
                    ? "The visible balance is cleared. Keep your statement for audit and branch confirmation."
                    : !nextDueSchedule
                        ? `${formatCurrency(totalOutstanding)} remains outstanding, but there is no unpaid installment open right now. The schedule may already be covered up to the next cycle.`
                    : daysUntilNextDue !== null && daysUntilNextDue <= 0 && nextDueAmount > 0
                        ? `${formatCurrency(nextDueAmount)} is currently due on this facility. Repay now to keep the loan in good standing.`
                        : nextDueSchedule
                            ? `${formatCurrency(totalOutstanding)} remains outstanding. Your next installment of ${formatCurrency(nextDueAmount)} is due on ${formatDate(nextDueSchedule.due_date)}.`
                            : `${formatCurrency(totalOutstanding)} remains outstanding and there are no unpaid schedule lines visible yet.`;

    return (
        <MotionCard
            variant="outlined"
            sx={{
                width: { xs: "calc(100vw - 20px)", sm: "100%" },
                maxWidth: { xs: "calc(100vw - 20px)", sm: "100%" },
                minWidth: 0,
                boxSizing: "border-box",
                borderRadius: 2,
                borderColor: "divider",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)"
            }}
        >
            <CardContent sx={{ p: { xs: 2, md: 2.4 } }}>
                <Grid container spacing={2.25} alignItems="stretch">
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Stack spacing={2}>
                            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ md: "center" }}>
                                <Stack spacing={0.8}>
                                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                        Current loan snapshot
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        See the current facility in a nutshell before you dive into schedules and repayment history.
                                    </Typography>
                                </Stack>
                                <TextField
                                    select
                                    size="small"
                                    label="Loan Facility"
                                    value={selectedLoan?.id || loanDetailId || ""}
                                    onChange={(event) => onLoanChange(event.target.value)}
                                    sx={{ minWidth: { xs: 0, md: 280 } }}
                                >
                                    {loans.length ? (
                                        loans.map((loan) => (
                                            <MenuItem key={loan.id} value={loan.id}>
                                                {loan.loan_number} • {formatCurrency(loan.principal_amount)}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem value="" disabled>
                                            No loans in selected range
                                        </MenuItem>
                                    )}
                                </TextField>
                            </Stack>

                            <Alert severity={snapshotTone} variant="outlined" iconMapping={{
                                success: <TaskAltRoundedIcon fontSize="inherit" />,
                                info: <AutoGraphRoundedIcon fontSize="inherit" />,
                                warning: <WarningAmberRoundedIcon fontSize="inherit" />,
                                error: <WarningAmberRoundedIcon fontSize="inherit" />
                            }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.35 }}>
                                    {snapshotTitle}
                                </Typography>
                                <Typography variant="body2">
                                    {snapshotMessage}
                                </Typography>
                            </Alert>

                            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                <Chip
                                    label={selectedLoan ? formatLoanStatusLabel(selectedLoan.status) : "No active selection"}
                                    color={selectedLoan?.status === "in_arrears" ? "warning" : selectedLoan?.status === "closed" ? "success" : "default"}
                                    variant={selectedLoan?.status === "active" ? "outlined" : "filled"}
                                    sx={{ textTransform: "capitalize" }}
                                />
                                {selectedLoan ? (
                                    <>
                                        <Chip label={`Rate ${formatMonthlyLoanRate(selectedLoan.annual_interest_rate)}`} variant="outlined" />
                                        <Chip label={`${getRepaymentFrequencyLabel(selectedLoan.repayment_frequency)} repayment`} variant="outlined" />
                                        <Chip label={`Penalty est. ${formatCurrency(penaltyEstimate)}`} color={penaltyEstimate > 0 ? "warning" : "default"} variant="outlined" />
                                    </>
                                ) : null}
                            </Stack>

                            <Grid container spacing={1.5}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <LoanMiniMetric
                                        icon={AccountBalanceWalletRoundedIcon}
                                        label="Total outstanding"
                                        value={formatCurrency(totalOutstanding)}
                                        helper={selectedLoan ? `Principal ${formatCurrency(selectedLoan.outstanding_principal)} + interest ${formatCurrency(selectedLoan.accrued_interest)}` : "Choose a facility to view balances."}
                                        tone={totalOutstanding > 0 ? "primary" : "success"}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <LoanMiniMetric
                                        icon={PaymentsRoundedIcon}
                                        label="Due now"
                                        value={dueNowAmount > 0 ? formatCurrency(dueNowAmount) : "No amount due"}
                                        helper={overdueSchedules.length ? `${overdueSchedules.length} overdue installment(s)` : nextDueSchedule ? `Next due ${formatDate(nextDueSchedule.due_date)}` : "No unpaid installment detected"}
                                        tone={overdueSchedules.length || dueNowAmount > 0 ? "warning" : "success"}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <LoanMiniMetric
                                        icon={ScheduleRoundedIcon}
                                        label="Remaining term"
                                        value={selectedLoan ? `${remainingInstallments} of ${selectedLoan.term_count}` : "No schedule"}
                                        helper={selectedLoan ? `${paidInstallments} installment(s) already settled` : "Installment schedule unavailable."}
                                        tone="primary"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <LoanMiniMetric
                                        icon={CalendarTodayRoundedIcon}
                                        label="Last repayment"
                                        value={lastRepayment ? formatCurrency(lastRepayment.amount) : "Not posted yet"}
                                        helper={lastRepayment ? `${formatDate(lastRepayment.created_at)} · principal ${formatCurrency(lastRepayment.principal_component)}` : "No repayment posted on this facility yet."}
                                        tone="success"
                                    />
                                </Grid>
                            </Grid>

                            <Grid container spacing={1.5}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <DetailList
                                        title="Facility details"
                                        description="Loan setup and contractual terms for the currently selected facility."
                                        items={[
                                            { label: "Loan number", value: selectedLoan?.loan_number || "Not available" },
                                            { label: "Disbursed on", value: formatDate(selectedLoan?.disbursed_at || selectedLoan?.created_at || null) },
                                            { label: "Original principal", value: formatCurrency(selectedLoan?.principal_amount || 0) },
                                            { label: "Interest rate", value: formatMonthlyLoanRate(selectedLoan?.annual_interest_rate || 0) },
                                            { label: "Repayment frequency", value: selectedLoan ? getRepaymentFrequencyLabel(selectedLoan.repayment_frequency) : "Not available" },
                                            { label: "Term length", value: selectedLoan ? `${selectedLoan.term_count} installment(s)` : "Not available" }
                                        ]}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box sx={{ height: "100%" }}>
                                        <DetailList
                                            title="Repayment position"
                                            description="Current exposure, schedule pressure, and the next unpaid repayment checkpoint."
                                            items={[
                                                { label: "Outstanding principal", value: formatCurrency(selectedLoan?.outstanding_principal || 0) },
                                                { label: "Posted accrued interest", value: formatCurrency(selectedLoan?.accrued_interest || 0) },
                                                { label: "Penalty estimate", value: formatCurrency(penaltyEstimate) },
                                                { label: "Next unpaid due date", value: nextDueSchedule ? formatDate(nextDueSchedule.due_date) : "Not scheduled" },
                                                { label: "Next unpaid due amount", value: nextDueSchedule ? formatCurrency(nextDueAmount) : "Not scheduled" },
                                                { label: "Days to next unpaid due", value: daysUntilNextDue === null ? "Not scheduled" : `${daysUntilNextDue} day(s)` }
                                            ]}
                                        />
                                        {(selectedLoan?.annual_interest_rate || 0) > 0 ? (
                                            <Alert severity="info" variant="outlined" sx={{ mt: 1.25, alignItems: "flex-start" }}>
                                                <Typography variant="body2">
                                                    <strong>Posted accrued interest</strong> is the accounting balance already posted by the backend accrual process. It can stay at {formatCurrency(0)} until the scheduled accrual job posts the next interest run, even when the loan carries interest.
                                                </Typography>
                                            </Alert>
                                        ) : null}
                                    </Box>
                                </Grid>
                            </Grid>
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Stack spacing={1.5} sx={{ height: "100%" }}>
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 1.75,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                                    bgcolor: theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.03) : alpha("#FFFFFF", 0.85)
                                }}
                            >
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                    Action center
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Repay, export the statement, or print the current view once you understand the facility position.
                                </Typography>
                                <Stack spacing={1} sx={{ mt: 2 }}>
                                    {!loanRepaymentEnabled ? (
                                        <Alert severity="info" variant="outlined">
                                            Mobile money self-service loan repayment is currently turned off by the tenant super admin.
                                        </Alert>
                                    ) : null}
                                    {canShowLoanRepaymentOption ? (
                                        <Button
                                            variant="contained"
                                            onClick={onRepay}
                                            disabled={submittingContribution || !hasRepaymentLoanOption}
                                            sx={repayButtonSx}
                                        >
                                            Repay with Mobile Money
                                        </Button>
                                    ) : null}
                                    <Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={onDownloadStatement} disabled={!selectedLoan}>
                                        Download Loan Statement PDF
                                    </Button>
                                    <Button variant="outlined" startIcon={<PrintRoundedIcon />} onClick={onPrint}>
                                        Printable View
                                    </Button>
                                </Stack>
                            </Box>

                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 1.75,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                                    bgcolor: theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.03) : alpha("#FFFFFF", 0.85)
                                }}
                            >
                                <Stack spacing={1}>
                                    <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="baseline">
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                            Principal repayment progress
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: brandColors.primary[700] }}>
                                            {Math.max(Math.min(principalProgressPercent, 100), 0).toFixed(0)}%
                                        </Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.max(Math.min(principalProgressPercent, 100), 0)}
                                        sx={{
                                            height: 8,
                                            borderRadius: 999,
                                            bgcolor: alpha(brandColors.primary[500], 0.12),
                                            "& .MuiLinearProgress-bar": {
                                                borderRadius: 999,
                                                bgcolor: brandColors.primary[700]
                                            }
                                        }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        {selectedLoan
                                            ? `${formatCurrency(Math.max(selectedLoan.principal_amount - selectedLoan.outstanding_principal, 0))} of principal has been cleared.`
                                            : "Select a loan to see repayment progress."}
                                    </Typography>
                                </Stack>
                            </Box>

                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 1.75,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                                    bgcolor: theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.03) : alpha("#FFFFFF", 0.85)
                                }}
                            >
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                    Prepayment simulation
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Test how an extra principal payment would change the remaining balance before you initiate repayment.
                                </Typography>
                                <TextField
                                    size="small"
                                    type="number"
                                    label="Prepay amount"
                                    value={prepaymentAmount}
                                    onChange={(event) => onPrepaymentAmountChange(Number(event.target.value) || 0)}
                                    fullWidth
                                    sx={{ mt: 1.5 }}
                                />
                                <Divider sx={{ my: 1.5 }} />
                                <Stack spacing={0.75}>
                                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                                        <Typography variant="body2" color="text.secondary">
                                            Projected outstanding
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                            {formatCurrency(prepaymentProjection?.newOutstanding || (selectedLoan?.outstanding_principal || 0))}
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                                        <Typography variant="body2" color="text.secondary">
                                            Estimated term reduction
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                            {prepaymentProjection?.termsReduced || 0} installment(s)
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>

                {latestLoanRepaymentPaymentOrder ? (
                    <Alert
                        severity={
                            latestLoanRepaymentPaymentOrder.status === "posted"
                                ? "success"
                                : latestLoanRepaymentPaymentOrder.status === "failed"
                                    ? "error"
                                    : latestLoanRepaymentPaymentOrder.status === "expired"
                                        ? "warning"
                                        : "info"
                        }
                        variant="outlined"
                        sx={{ mt: 2.25, alignItems: "flex-start" }}
                    >
                        <Stack spacing={0.5}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                {latestLoanRepaymentPaymentOrder.status === "posted"
                                    ? "Latest repayment posted"
                                    : latestLoanRepaymentPaymentOrder.status === "paid"
                                        ? "Payment received, posting in progress"
                                        : latestLoanRepaymentPaymentOrder.status === "pending"
                                            ? "Awaiting member approval"
                                            : latestLoanRepaymentPaymentOrder.status === "failed"
                                                ? "Repayment failed"
                                                : latestLoanRepaymentPaymentOrder.status === "expired"
                                                    ? "Repayment expired"
                                                    : `Order ${latestLoanRepaymentPaymentOrder.status.replace(/_/g, " ")}`}
                            </Typography>
                            <Typography variant="body2">
                                {formatCurrency(latestLoanRepaymentPaymentOrder.amount)} via {latestLoanRepaymentPaymentOrder.provider.toUpperCase()} · Ref {latestLoanRepaymentPaymentOrder.provider_ref || latestLoanRepaymentPaymentOrder.external_id}
                            </Typography>
                            <Typography variant="body2">
                                Loan: {latestLoanRepaymentPaymentOrder.loan_number || latestLoanRepaymentPaymentOrder.loan_id || "Unknown loan"}
                            </Typography>
                            {latestLoanRepaymentPaymentOrder.journal_id ? (
                                <Typography variant="body2">Journal posted: {latestLoanRepaymentPaymentOrder.journal_id}</Typography>
                            ) : null}
                            {latestLoanRepaymentPaymentOrder.error_message ? (
                                <Typography variant="body2">{latestLoanRepaymentPaymentOrder.error_message}</Typography>
                            ) : null}
                        </Stack>
                    </Alert>
                ) : null}
            </CardContent>
        </MotionCard>
    );
}
