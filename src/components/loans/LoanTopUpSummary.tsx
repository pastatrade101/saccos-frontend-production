import { Box, Chip, Stack, Typography, useTheme } from "@mui/material";
import CallSplitRoundedIcon from "@mui/icons-material/CallSplitRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";

import type { Loan } from "../../types/api";
import { formatCurrency, formatDate } from "../../utils/format";
import { buildLoanLineage, predecessorsOf, topUpBreakdown } from "../../utils/loanLineage";

/**
 * What a top-up settled, what it paid out, and the chain it belongs to.
 *
 * Both halves answer questions the loan screens could not: a member with a
 * 12,000,000 loan who tops up to 37,680,000 saw only the 37,680,000, with no
 * sign that 25,680,000 of it went straight back out — and the loans it replaced
 * had simply vanished from view, since a topped-up loan is closed.
 *
 * Renders nothing for an ordinary loan with no history, so it can be dropped
 * into any loan screen unconditionally.
 */
export interface LoanTopUpSummaryProps {
    loan: Loan | null | undefined;
    /** Every loan belonging to this member, for walking the chain. */
    memberLoans: Loan[];
    /** Called with a loan id when a chain entry is clicked, where navigable. */
    onOpenLoan?: (loanId: string) => void;
    /** Softer wording for the member's own view. */
    audience?: "staff" | "member";
}

export function LoanTopUpSummary({ loan, memberLoans, onOpenLoan, audience = "staff" }: LoanTopUpSummaryProps) {
    const theme = useTheme();
    const breakdown = topUpBreakdown(loan);
    const lineage = buildLoanLineage(loan, memberLoans);

    if (!breakdown && !lineage.length) return null;

    const border = `1px solid ${theme.palette.divider}`;

    return (
        <Stack spacing={1.5}>
            {breakdown ? (
                <Box sx={{ p: 1.75, border, borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
                        <CallSplitRoundedIcon fontSize="small" color="primary" />
                        <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            How this top-up was made up
                        </Typography>
                    </Stack>

                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.25}
                        divider={<Box sx={{ borderLeft: { sm: border }, borderTop: { xs: border, sm: "none" } }} />}
                    >
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary">Facility booked</Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                {formatCurrency(breakdown.principal)}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                {audience === "member" ? "Cleared your old loan" : "Settled the previous loan"}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                −{formatCurrency(breakdown.settlement)}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                {audience === "member" ? "Paid to you" : "Released to the member"}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.success.main }}>
                                {formatCurrency(breakdown.newCash)}
                            </Typography>
                        </Box>
                    </Stack>

                    <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.25 }}>
                        {audience === "member"
                            ? "Interest is charged on the whole facility, not only the amount paid to you."
                            : "Interest accrues on the whole facility. Only the released amount left the SACCO as cash."}
                        {breakdown.applicationReference ? ` · ${breakdown.applicationReference}` : ""}
                    </Typography>
                </Box>
            ) : null}

            {lineage.length ? (
                <Box sx={{ p: 1.75, border, borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
                        <HistoryRoundedIcon fontSize="small" color="primary" />
                        <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            Loan history — {lineage.length} facilities
                        </Typography>
                    </Stack>

                    <Stack spacing={0.75}>
                        {lineage.map((entry, index) => {
                            const isCurrent = entry.id === loan?.id;
                            const entryBreakdown = topUpBreakdown(entry);
                            const clickable = Boolean(onOpenLoan) && !isCurrent;
                            // More than one predecessor means an officer merged
                            // several facilities into this one, not a plain top-up.
                            const replacedCount = predecessorsOf(entry, memberLoans).length;

                            return (
                                <Box
                                    key={entry.id}
                                    onClick={clickable ? () => onOpenLoan?.(entry.id) : undefined}
                                    sx={{
                                        p: 1.25,
                                        borderRadius: 1.5,
                                        cursor: clickable ? "pointer" : "default",
                                        border: isCurrent
                                            ? `1px solid ${theme.palette.primary.main}`
                                            : border,
                                        "&:hover": clickable ? { borderColor: theme.palette.primary.main } : undefined
                                    }}
                                >
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={{ xs: 0.5, sm: 1.5 }}
                                        alignItems={{ sm: "center" }}
                                        justifyContent="space-between"
                                    >
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                {index + 1}. {entry.loan_number}
                                            </Typography>
                                            {isCurrent ? <Chip size="small" color="primary" label="Viewing" /> : null}
                                            <Chip
                                                size="small"
                                                variant="outlined"
                                                color={entry.superseded_by_loan_id ? "default" : undefined}
                                                label={entry.superseded_by_loan_id ? "Replaced by a top-up" : entry.status}
                                            />
                                            {replacedCount > 1 ? (
                                                <Chip
                                                    size="small"
                                                    variant="outlined"
                                                    color="info"
                                                    label={`Merged ${replacedCount} loans`}
                                                />
                                            ) : null}
                                        </Stack>

                                        <Typography variant="body2" color="text.secondary">
                                            {formatCurrency(entry.principal_amount)}
                                            {entryBreakdown ? ` · ${formatCurrency(entryBreakdown.newCash)} released` : ""}
                                            {entry.disbursed_at ? ` · ${formatDate(entry.disbursed_at)}` : ""}
                                        </Typography>
                                    </Stack>
                                </Box>
                            );
                        })}
                    </Stack>

                    <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.25 }}>
                        A topped-up loan is closed by the facility that replaced it, not by the member repaying it.
                        Where several were merged, they all closed into the one that replaced them.
                    </Typography>
                </Box>
            ) : null}
        </Stack>
    );
}
