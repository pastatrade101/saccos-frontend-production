import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
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
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from "@mui/material";
import { alpha, useTheme, type SxProps, type Theme } from "@mui/material/styles";
import { useMemo } from "react";

import { MotionCard } from "../../ui/motion";
import type { Loan, LoanSchedule, LoanTransaction, PaymentOrder } from "../../types/api";
import { brandColors } from "../../theme/colors";
import { formatCurrency, formatCurrencyCompact, formatDate } from "../../utils/format";
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

/**
 * Amount without the repeated "TSh " prefix. In a six-column schedule table the
 * prefix on every cell costs more width than it adds meaning, so the unit is
 * stated once in the column header instead.
 */
function formatAmountBare(value: number | null | undefined) {
    return formatCurrency(Number(value || 0)).replace(/^TSh\s*/, "");
}

/**
 * Status chip for one schedule line. Mirrors the mobile loan detail screen so a
 * member reading the phone and the portal sees the same four words.
 */
function getScheduleStatusChip(schedule: LoanSchedule) {
    if (!hasMeaningfulOutstanding(schedule)) {
        return { label: "Paid", color: brandColors.success };
    }

    if (schedule.due_date < new Date().toISOString().slice(0, 10)) {
        return { label: "Overdue", color: brandColors.danger };
    }

    if (Number(schedule.principal_paid || 0) + Number(schedule.interest_paid || 0) > 0) {
        return { label: "Part paid", color: brandColors.warning };
    }

    return { label: "Pending", color: null };
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
    valueTitle,
    helper,
    tone = "primary"
}: {
    icon: typeof AutoGraphRoundedIcon;
    label: string;
    value: string;
    valueTitle?: string;
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
                    <Typography title={valueTitle} variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2, fontVariantNumeric: "tabular-nums", overflowWrap: "anywhere" }}>
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

    // Newest first: a history is scanned from the top for "did my payment land",
    // not read forwards like a ledger. Repayments only — disbursement and
    // interest accrual rows are not payments the member made.
    const repaymentHistory = useMemo(
        () => selectedLoanTransactions.filter((transaction) => transaction.transaction_type === "loan_repayment"),
        [selectedLoanTransactions]
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
    const nextStepTitle = !selectedLoan
        ? "Choose a loan to continue"
        : selectedLoan.status === "written_off"
            ? "Contact the branch"
            : totalOutstanding <= 0 || selectedLoan.status === "closed"
                ? "No repayment needed"
                : dueNowAmount > 0
                    ? `Pay ${formatCurrency(dueNowAmount)}`
                    : nextDueSchedule
                        ? `Next due ${formatDate(nextDueSchedule.due_date)}`
                        : "Review the statement";
    const nextStepMessage = !selectedLoan
        ? "Select a facility first so the system can show repayment status and available actions."
        : selectedLoan.status === "written_off"
            ? "This account needs branch guidance before member self-service repayment."
            : totalOutstanding <= 0 || selectedLoan.status === "closed"
                ? "The visible loan balance is cleared. Keep the statement for your records."
                : dueNowAmount > 0
                    ? overdueSchedules.length
                        ? "This amount is overdue. Pay it first to bring the loan back toward good standing."
                        : "This amount is currently due. Use repayment if you want to settle it now."
                    : nextDueSchedule
                        ? `${formatCurrency(nextDueAmount)} is expected on the next unpaid installment.`
                        : "No unpaid installment is visible, but the statement can confirm the latest posting position.";
    const repaymentButtonLabel = dueNowAmount > 0
        ? "Pay Due Amount"
        : totalOutstanding > 0
            ? "Make Repayment"
            : "No Repayment Due";

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
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                    Current loan snapshot
                                </Typography>
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
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }}>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.25 }}>
                                            {snapshotTitle}
                                        </Typography>
                                        <Typography variant="body2">
                                            {snapshotMessage}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={selectedLoan ? formatLoanStatusLabel(selectedLoan.status) : "No loan"}
                                        color={selectedLoan?.status === "in_arrears" ? "warning" : selectedLoan?.status === "closed" ? "success" : "default"}
                                        variant={selectedLoan?.status === "active" ? "outlined" : "filled"}
                                        sx={{ textTransform: "capitalize", alignSelf: { xs: "flex-start", sm: "center" } }}
                                    />
                                </Stack>
                            </Alert>

                            <Grid container spacing={1.5}>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <LoanMiniMetric
                                        icon={PaymentsRoundedIcon}
                                        label="Pay now"
                                        value={dueNowAmount > 0 ? formatCurrencyCompact(dueNowAmount) : "Nothing due"}
                                        valueTitle={dueNowAmount > 0 ? formatCurrency(dueNowAmount) : undefined}
                                        helper={overdueSchedules.length ? `${overdueSchedules.length} overdue` : nextDueSchedule ? `Next due ${formatDate(nextDueSchedule.due_date)}` : "No installment due"}
                                        tone={overdueSchedules.length || dueNowAmount > 0 ? "warning" : "success"}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <LoanMiniMetric
                                        icon={AccountBalanceWalletRoundedIcon}
                                        label="Still owed"
                                        value={formatCurrencyCompact(totalOutstanding)}
                                        valueTitle={formatCurrency(totalOutstanding)}
                                        helper={selectedLoan ? `Principal ${formatCurrencyCompact(selectedLoan.outstanding_principal)} · interest ${formatCurrencyCompact(selectedLoan.accrued_interest)}` : "Select a facility"}
                                        tone={totalOutstanding > 0 ? "primary" : "success"}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <LoanMiniMetric
                                        icon={ScheduleRoundedIcon}
                                        label="Schedule"
                                        value={selectedLoan ? `${remainingInstallments} open` : "No schedule"}
                                        helper={selectedLoan ? `${paidInstallments}/${selectedLoan.term_count} settled` : "Schedule unavailable"}
                                        tone="primary"
                                    />
                                </Grid>
                            </Grid>

                            <Box
                                sx={{
                                    p: 1.5,
                                    borderRadius: 1.75,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                                    bgcolor: theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.03) : alpha("#FFFFFF", 0.85)
                                }}
                            >
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                                    Loan terms
                                </Typography>
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                    <Chip label={selectedLoan?.loan_number || "No loan number"} variant="outlined" />
                                    <Chip label={`Original ${formatCurrency(selectedLoan?.principal_amount || 0)}`} variant="outlined" />
                                    <Chip label={`Rate ${formatMonthlyLoanRate(selectedLoan?.annual_interest_rate || 0)}`} variant="outlined" />
                                    <Chip label={selectedLoan ? `${getRepaymentFrequencyLabel(selectedLoan.repayment_frequency)} repayment` : "Repayment unavailable"} variant="outlined" />
                                    <Chip label={selectedLoan ? `${selectedLoan.term_count} installment(s)` : "Term unavailable"} variant="outlined" />
                                    {penaltyEstimate > 0 ? (
                                        <Chip label={`Penalty est. ${formatCurrency(penaltyEstimate)}`} color="warning" variant="outlined" />
                                    ) : null}
                                    {lastRepayment ? (
                                        <Chip label={`Last paid ${formatCurrency(lastRepayment.amount)} on ${formatDate(lastRepayment.created_at)}`} color="success" variant="outlined" />
                                    ) : null}
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
                                            ? `${formatCurrency(Math.max(selectedLoan.principal_amount - selectedLoan.outstanding_principal, 0))} of principal has been cleared. Principal is cleared in full on the final installment.`
                                            : "Select a loan to see repayment progress."}
                                    </Typography>
                                </Stack>
                            </Box>
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Stack spacing={1.5}>
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 1.75,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                                    bgcolor: theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.03) : alpha("#FFFFFF", 0.85)
                                }}
                            >
                                <Stack spacing={1.25}>
                                    <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="overline" color="text.secondary">
                                                Next step
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.15, mt: 0.25, overflowWrap: "anywhere" }}>
                                                {nextStepTitle}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            size="small"
                                            label={dueNowAmount > 0 ? "Action" : totalOutstanding > 0 ? "Upcoming" : "Clear"}
                                            color={dueNowAmount > 0 ? "warning" : totalOutstanding > 0 ? "default" : "success"}
                                        />
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary">
                                        {nextStepMessage}
                                    </Typography>
                                    <Divider />
                                    <Stack spacing={0.8}>
                                        <Stack direction="row" justifyContent="space-between" spacing={1}>
                                            <Typography variant="body2" color="text.secondary">Due date</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 800, textAlign: "right" }}>
                                                {nextDueSchedule ? formatDate(nextDueSchedule.due_date) : "No unpaid due"}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" justifyContent="space-between" spacing={1}>
                                            <Typography variant="body2" color="text.secondary">Penalty estimate</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 800, textAlign: "right" }}>
                                                {formatCurrency(penaltyEstimate)}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" justifyContent="space-between" spacing={1}>
                                            <Typography variant="body2" color="text.secondary">Last repayment</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 800, textAlign: "right" }}>
                                                {lastRepayment ? formatDate(lastRepayment.created_at) : "None posted"}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                    {!loanRepaymentEnabled ? (
                                        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                                            Self-service repayment is turned off.
                                        </Alert>
                                    ) : null}
                                    {canShowLoanRepaymentOption ? (
                                        <Button
                                            variant="contained"
                                            onClick={onRepay}
                                            disabled={submittingContribution || !hasRepaymentLoanOption || totalOutstanding <= 0}
                                            sx={repayButtonSx}
                                        >
                                            {repaymentButtonLabel}
                                        </Button>
                                    ) : null}
                                    <Stack direction={{ xs: "column", sm: "row", lg: "column" }} spacing={1}>
                                        <Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={onDownloadStatement} disabled={!selectedLoan}>
                                            Statement PDF
                                        </Button>
                                        <Button variant="outlined" startIcon={<PrintRoundedIcon />} onClick={onPrint}>
                                            Print View
                                        </Button>
                                    </Stack>
                                </Stack>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>

                {/* The per-installment schedule and the repayment trail. Both arrays
                    were already being fetched and then collapsed into counters —
                    `selectedLoanSchedules` into "N open / M settled" and
                    `selectedLoanTransactions` into a single "last paid" chip — so the
                    detail a member actually reconciles against a paper receipt never
                    reached the page. Matches the mobile loan detail screen. */}
                {selectedLoan ? (
                    <>
                        <Divider sx={{ my: 2.5 }} />
                        <Grid container spacing={2.25}>
                            <Grid size={{ xs: 12, lg: 7 }}>
                                <Stack spacing={1.1}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                            Repayment schedule
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {paidInstallments}/{selectedLoanSchedules.length || selectedLoan.term_count} settled
                                        </Typography>
                                    </Stack>
                                    {selectedLoanSchedules.length ? (
                                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 360 }}>
                                            <Table size="small" stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>Due</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Principal (TSh)</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Interest (TSh)</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Total (TSh)</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Status</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {selectedLoanSchedules.map((schedule) => {
                                                        const chip = getScheduleStatusChip(schedule);

                                                        return (
                                                            <TableRow key={schedule.id} hover>
                                                                <TableCell>{schedule.installment_number}</TableCell>
                                                                <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(schedule.due_date)}</TableCell>
                                                                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                                                                    {formatAmountBare(schedule.principal_due)}
                                                                </TableCell>
                                                                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                                                                    {formatAmountBare(schedule.interest_due)}
                                                                </TableCell>
                                                                <TableCell align="right" sx={{ whiteSpace: "nowrap", fontWeight: 700 }}>
                                                                    {formatAmountBare(Number(schedule.principal_due || 0) + Number(schedule.interest_due || 0))}
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <Chip
                                                                        size="small"
                                                                        label={chip.label}
                                                                        variant="outlined"
                                                                        sx={chip.color
                                                                            ? { color: chip.color, borderColor: alpha(chip.color, 0.5), fontWeight: 700 }
                                                                            : { fontWeight: 700 }}
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    ) : (
                                        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                                            No schedule lines have been generated for this loan yet.
                                        </Alert>
                                    )}
                                    <Typography variant="caption" color="text.secondary">
                                        The principal and interest split is why an early payment can barely move what you owe.
                                    </Typography>
                                </Stack>
                            </Grid>
                            <Grid size={{ xs: 12, lg: 5 }}>
                                <Stack spacing={1.1}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                            Repayment history
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {repaymentHistory.length} posted
                                        </Typography>
                                    </Stack>
                                    {repaymentHistory.length ? (
                                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 360 }}>
                                            <Table size="small" stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Paid (TSh)</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Left (TSh)</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {repaymentHistory.map((transaction) => (
                                                        <TableRow key={transaction.id} hover>
                                                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                                                                {formatDate(transaction.created_at)}
                                                                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                                                    {formatCurrency(transaction.principal_component)} principal · {formatCurrency(transaction.interest_component)} interest
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ whiteSpace: "nowrap", fontWeight: 700, color: brandColors.success }}>
                                                                {formatAmountBare(transaction.amount)}
                                                            </TableCell>
                                                            {/* The balance the SACCOS recorded after this payment, not one
                                                                the page re-derives — it is what reconciles to a receipt. */}
                                                            <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                                                                {formatAmountBare(
                                                                    Number(transaction.running_principal_balance || 0)
                                                                    + Number(transaction.running_interest_balance || 0)
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    ) : (
                                        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                                            No repayment has been posted against this loan yet.
                                        </Alert>
                                    )}
                                </Stack>
                            </Grid>
                        </Grid>
                    </>
                ) : null}

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
