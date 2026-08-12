import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Card,
    CardContent,
    Chip,
    Grid,
    Stack,
    Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PercentRoundedIcon from "@mui/icons-material/PercentRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import type { ReactNode } from "react";

import type { LoanProduct } from "../../types/api";
import { formatCurrency } from "../../utils/format";
import { formatMonthlyLoanRate } from "../../utils/loanInterest";

interface LoanTermsCardProps {
    product: LoanProduct;
    /** The tier the member's savings currently qualify them for. */
    recommended?: boolean;
}

function titleCase(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function termLabel(product: LoanProduct) {
    const unit = product.term_unit === "weeks" ? "week" : "month";
    const min = product.min_term_count || 1;
    const max = product.max_term_count;
    if (!max) {
        return `From ${min} ${unit}${min === 1 ? "" : "s"} (no fixed maximum)`;
    }
    if (max === min) {
        return `${max} ${unit}${max === 1 ? "" : "s"}`;
    }
    return `${min}–${max} ${unit}${max === 1 ? "" : "s"}`;
}

function amountLabel(product: LoanProduct) {
    const min = Number(product.min_amount || 0);
    const max = product.max_amount ? Number(product.max_amount) : null;
    if (!max) {
        return `${formatCurrency(min)} and above`;
    }
    return `${formatCurrency(min)} – ${formatCurrency(max)}`;
}

function processingFeeLabel(product: LoanProduct) {
    if (product.processing_fee_type === "percentage" && product.processing_fee_percent) {
        return `${product.processing_fee_percent}% of the loan`;
    }
    if (product.processing_fee_type === "flat" && product.processing_fee_amount) {
        return formatCurrency(product.processing_fee_amount);
    }
    return "None";
}

function penaltyLabel(product: LoanProduct) {
    const rule = product.penalty_rule;
    if (!rule || rule.is_active === false) {
        return null;
    }
    if (rule.calculation_method === "flat" && Number(rule.flat_amount) > 0) {
        return `${formatCurrency(rule.flat_amount)} per late payment`;
    }
    if (rule.calculation_method === "percentage" && Number(rule.percentage_value) > 0) {
        return `${rule.percentage_value}% of the overdue amount`;
    }
    if (rule.calculation_method === "percentage_per_period" && Number(rule.percentage_value) > 0) {
        return `${rule.percentage_value}% of the overdue amount per period`;
    }
    return null;
}

function TermRow({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
    const theme = useTheme();
    return (
        <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <Box sx={{ color: theme.palette.primary.main, mt: 0.25, display: "flex" }}>{icon}</Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                    {label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{value}</Typography>
            </Box>
        </Stack>
    );
}

export function LoanTermsCard({ product, recommended = false }: LoanTermsCardProps) {
    const theme = useTheme();

    const guarantorsLabel = product.required_guarantors_count > 0
        ? `${product.required_guarantors_count} guarantor${product.required_guarantors_count === 1 ? "" : "s"} required`
        : "No guarantor required";
    const latePenaltyLabel = penaltyLabel(product);

    return (
        <Card
            variant="outlined"
            sx={{
                height: "100%",
                borderRadius: "var(--m-radius-card)",
                borderColor: recommended ? "var(--m-gold)" : "var(--m-line3)",
                borderWidth: recommended ? 2 : 1,
                bgcolor: recommended ? "var(--m-gold-soft)" : "var(--m-surface)"
            }}
        >
            <CardContent sx={{ display: "grid", gap: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} flexWrap="wrap" useFlexGap>
                    <Box sx={{ minWidth: 0 }}>
                        {recommended ? (
                            <Typography
                                variant="caption"
                                sx={{
                                    display: "block",
                                    mb: 0.5,
                                    color: "var(--m-gold-ink)",
                                    fontWeight: 700,
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                    fontSize: "var(--m-fs-label)"
                                }}
                            >
                                Best for you
                            </Typography>
                        ) : null}
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.15 }}>{product.name}</Typography>
                        {product.description ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{product.description}</Typography>
                        ) : null}
                    </Box>
                    <Chip
                        size="small"
                        label={product.interest_method === "flat" ? "Flat rate" : "Reducing balance"}
                        sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}
                    />
                </Stack>

                <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TermRow icon={<AccountBalanceRoundedIcon fontSize="small" />} label="Loan amount" value={amountLabel(product)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TermRow icon={<PercentRoundedIcon fontSize="small" />} label="Interest rate" value={formatMonthlyLoanRate(product.annual_interest_rate)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TermRow icon={<CalendarMonthRoundedIcon fontSize="small" />} label="Maximum repayment time" value={termLabel(product)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TermRow icon={<CalendarMonthRoundedIcon fontSize="small" />} label="Repayment frequency" value={titleCase(product.repayment_frequency)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TermRow icon={<GroupsRoundedIcon fontSize="small" />} label="Guarantors" value={guarantorsLabel} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TermRow icon={<ReceiptLongRoundedIcon fontSize="small" />} label="Processing fee" value={processingFeeLabel(product)} />
                    </Grid>
                    {product.insurance_rate > 0 ? (
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TermRow icon={<ShieldRoundedIcon fontSize="small" />} label="Insurance" value={`${product.insurance_rate}% of the loan`} />
                        </Grid>
                    ) : null}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TermRow
                            icon={<VerifiedUserRoundedIcon fontSize="small" />}
                            label="Borrowing limit"
                            value={product.maximum_loan_multiple > 0 ? `Up to ${product.maximum_loan_multiple}× your savings` : "Set by eligibility rules"}
                        />
                    </Grid>
                    {product.minimum_membership_duration_months > 0 ? (
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TermRow
                                icon={<VerifiedUserRoundedIcon fontSize="small" />}
                                label="Membership required"
                                value={`At least ${product.minimum_membership_duration_months} month${product.minimum_membership_duration_months === 1 ? "" : "s"}`}
                            />
                        </Grid>
                    ) : null}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TermRow
                            icon={<CalendarMonthRoundedIcon fontSize="small" />}
                            label="Early repayment"
                            value={product.allow_early_repayment
                                ? (product.early_settlement_fee_percent ? `Allowed (${product.early_settlement_fee_percent}% fee)` : "Allowed, no penalty")
                                : "Not allowed"}
                        />
                    </Grid>
                    {latePenaltyLabel ? (
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TermRow icon={<ReceiptLongRoundedIcon fontSize="small" />} label="Late payment penalty" value={latePenaltyLabel} />
                        </Grid>
                    ) : null}
                </Grid>

                {product.terms_and_conditions ? (
                    <Accordion disableGutters elevation={0} sx={{ bgcolor: "transparent", "&:before": { display: "none" } }}>
                        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 0, minHeight: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                Full terms &amp; conditions
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 0 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                                {product.terms_and_conditions}
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                ) : null}
            </CardContent>
        </Card>
    );
}
