import {
    Alert,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    Paper,
    Stack,
    Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import type { LoanCapacitySummary } from "../../types/api";
import { formatCurrency } from "../../utils/format";

/// Mirrors DEFAULT_UNBOUNDED_PRODUCT_LIMIT on the server: what a product
/// carries when it has no maximum of its own.
const UNBOUNDED_PRODUCT_LIMIT = 9999999999999;

interface LoanEligibilitySummaryProps {
    summary?: LoanCapacitySummary | null;
    loading?: boolean;
    error?: string | null;
    title?: string;
    helperText?: string;
    compact?: boolean;
    /** What the member is asking for, so the guarantee consequence can be named. */
    requestedAmount?: number;
    /** Balance an open loan would settle; excluded on a top-up, which settles it. */
    openLoanSettlement?: number;
    isTopUp?: boolean;
}

function MetricCard({
    label,
    value,
    emphasize = false,
    compact = false
}: {
    label: string;
    value: string;
    emphasize?: boolean;
    compact?: boolean;
}) {
    return (
        <Box
            sx={(theme) => ({
                p: compact ? 1.15 : 1.5,
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                backgroundColor: emphasize ? alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.08) : "background.paper"
            })}
        >
            <Typography variant="caption" color="text.secondary">
                {label}
            </Typography>
            <Typography variant={compact ? "body2" : "body1"} sx={{ fontWeight: emphasize ? 800 : 700, mt: 0.35 }}>
                {value}
            </Typography>
        </Box>
    );
}

export function LoanEligibilitySummary({
    summary,
    loading = false,
    error = null,
    title = "Loan Eligibility",
    helperText = "These indicators are calculated from your savings balance, the selected product rules, and current SACCO branch liquidity.",
    compact = false,
    requestedAmount = 0,
    openLoanSettlement = 0,
    isTopUp = false
}: LoanEligibilitySummaryProps) {
    const theme = useTheme();
    // The server's own formula, from the server's own figures: what the loan
    // asks for, less the member's money that is free to secure it.
    const securedByOwnMoney = Math.max(
        0,
        Number(summary?.guarantee_base_amount ?? summary?.total_contributions ?? 0)
            - (isTopUp ? 0 : openLoanSettlement)
    );
    const requiredGuarantee = requestedAmount > 0
        ? Math.max(0, Math.ceil(requestedAmount - securedByOwnMoney))
        : 0;

    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 1.1,
                borderColor: alpha(theme.palette.primary.main, 0.18)
            }}
        >
            <CardContent sx={{ display: "grid", gap: compact ? 1.15 : 1.5 }}>
                <Box>
                    <Typography variant={compact ? "subtitle1" : "h6"} sx={{ fontWeight: 800 }}>
                        {title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {helperText}
                    </Typography>
                </Box>

                {loading ? (
                    <Stack direction="row" spacing={1.25} alignItems="center">
                        <CircularProgress size={18} />
                        <Typography variant="body2" color="text.secondary">
                            Calculating current borrowing capacity...
                        </Typography>
                    </Stack>
                ) : null}

                {!loading && error ? (
                    <Alert severity="warning" variant="outlined">
                        {error}
                    </Alert>
                ) : null}

                {!loading && !error && summary ? (
                    <>
                        {summary.loan_pool_frozen ? (
                            <Alert severity="warning" variant="outlined">
                                SACCO loan pool temporarily exhausted. Please try again later.
                            </Alert>
                        ) : null}
                        {summary.has_problem_loans ? (
                            // Whether the arrears block anything is the SACCO's policy,
                            // reported by the server; saying "not accepted" when the
                            // application would go through sends the member away.
                            (summary.problem_loans_block_application ?? true) ? (
                                <Alert severity="error" variant="outlined">
                                    You have an overdue loan. New loan applications are not accepted until the overdue amount is cleared.
                                </Alert>
                            ) : (
                                <Alert severity="warning" variant="outlined">
                                    You have an overdue loan. You can still apply — the loan officer will see it during appraisal.
                                </Alert>
                            )
                        ) : null}
                        <Grid container spacing={1.5}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <MetricCard label="Member Savings Balance" value={formatCurrency(summary.total_contributions)} compact={compact} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <MetricCard
                                    label={summary.guarantor_exposure > 0
                                        ? "Savings Borrow Limit ((savings − guarantees given) × multiplier)"
                                        : "Savings Borrow Limit (savings × multiplier)"}
                                    value={formatCurrency(summary.contribution_limit)}
                                    compact={compact}
                                />
                            </Grid>
                            {summary.current_loan_exposure > 0 ? (
                                <>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <MetricCard
                                            label="Existing Loan Balance (deducted)"
                                            value={`− ${formatCurrency(summary.current_loan_exposure)}`}
                                            compact={compact}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <MetricCard
                                            label="Savings Rule Headroom"
                                            value={formatCurrency(summary.contribution_headroom
                                                ?? Math.max(0, summary.contribution_limit - summary.current_loan_exposure))}
                                            compact={compact}
                                        />
                                    </Grid>
                                </>
                            ) : null}
                            <Grid size={{ xs: 12, md: 6 }}>
                                {/* A product with no ceiling of its own carries
                                    a sentinel of 9,999,999,999,999.99, and it
                                    was being printed at a member as "TSh
                                    10,000,000,000,000" — a figure that tells
                                    them nothing except that something is
                                    wrong. */}
                                <MetricCard
                                    label="Loan Product Limit"
                                    value={summary.product_limit >= UNBOUNDED_PRODUCT_LIMIT
                                        ? "No cap on this product"
                                        : formatCurrency(summary.product_limit)}
                                    compact={compact}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <MetricCard label="SACCO Liquidity Limit" value={formatCurrency(summary.liquidity_limit)} compact={compact} />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Box
                                    sx={{
                                        p: compact ? { xs: 1.5, md: 1.75 } : { xs: 2, md: 2.3 },
                                        borderRadius: 1.1,
                                        border: `1px solid ${alpha(theme.palette.success.main, theme.palette.mode === "dark" ? 0.34 : 0.22)}`,
                                        background: theme.palette.mode === "dark"
                                            ? `linear-gradient(180deg, ${alpha(theme.palette.success.main, 0.18)} 0%, ${alpha(theme.palette.success.main, 0.1)} 100%)`
                                            : `linear-gradient(180deg, ${alpha(theme.palette.success.main, 0.12)} 0%, ${alpha(theme.palette.success.light, 0.18)} 100%)`,
                                        textAlign: "center"
                                    }}
                                >
                                    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.14em" }}>
                                        Maximum You Can Borrow
                                    </Typography>
                                    <Typography
                                        variant={compact ? "h5" : "h4"}
                                        sx={{
                                            mt: compact ? 0.55 : 0.9,
                                            fontWeight: 900,
                                            letterSpacing: "-0.03em",
                                            color: theme.palette.mode === "dark" ? "#F0FFF4" : theme.palette.success.dark
                                        }}
                                    >
                                        {formatCurrency(summary.borrow_limit)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        The lowest of the three ceilings above
                                        {summary.current_loan_exposure > 0
                                            ? ", after deducting what you still owe on existing loans."
                                            : ", based on your savings, product rules, and SACCO liquidity."}
                                    </Typography>
                                    {/* The second gate, named on the same panel as
                                        the first. "Maximum you can borrow" reads as
                                        permission to go ahead, and a member who
                                        clears it by a wide margin is then stopped
                                        by a requirement this screen never
                                        mentioned. Being allowed to borrow and
                                        having the loan secured are different
                                        questions, and only one of them was here. */}
                                    {requiredGuarantee > 0 ? (
                                        <Typography variant="body2" sx={{ mt: 1.2, fontWeight: 700 }} color="warning.main">
                                            {`Being allowed to borrow it is not the same as having it secured. At ${formatCurrency(requestedAmount)}, ${formatCurrency(requiredGuarantee)} sits above your own money and needs guarantors.`}
                                        </Typography>
                                    ) : null}
                                </Box>
                            </Grid>
                        </Grid>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: compact ? 1.3 : 1.7,
                                borderRadius: 1,
                                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.08 : 0.03)
                            }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                SACCO Loan Pool Available
                            </Typography>
                            <Typography variant="h6" sx={{ mt: 0.4, fontWeight: 800 }}>
                                {formatCurrency(summary.available_for_loans)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
                                Current funds available for issuing new loans.
                            </Typography>
                        </Paper>
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                            <Box
                                sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: "50%",
                                    display: "grid",
                                    placeItems: "center",
                                    fontSize: 12,
                                    fontWeight: 800,
                                    bgcolor: alpha(theme.palette.info.main, theme.palette.mode === "dark" ? 0.18 : 0.1),
                                    color: theme.palette.info.main,
                                    mt: 0.15
                                }}
                            >
                                i
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Applying within your borrowing capacity improves approval chances. Final approval still follows branch appraisal.
                            </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                            Minimum loan size for this product: {formatCurrency(summary.minimum_loan_amount)}.
                        </Typography>
                    </>
                ) : null}
            </CardContent>
        </Card>
    );
}
