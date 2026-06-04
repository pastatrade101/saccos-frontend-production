import CreditScoreRoundedIcon from "@mui/icons-material/CreditScoreRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { Box, Button, CardContent, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { brandColors } from "../../theme/colors";
import { formatCurrency, formatDate } from "../../utils/format";
import { MotionCard } from "../../ui/motion";
import type { FinancialStanding, FinancialStandingTone, FinancialSummaryData } from "./types";

interface FinancialSummaryProps {
    summary: FinancialSummaryData;
    standing: FinancialStanding;
    onApplyLoan: () => void;
    onMakeContribution: () => void;
    onDownloadStatement: () => void;
}

function getToneStyles(tone: FinancialStandingTone, accent: string) {
    if (tone === "danger") {
        return {
            color: brandColors.danger,
            bg: alpha(brandColors.danger, 0.12),
            border: alpha(brandColors.danger, 0.32)
        };
    }

    if (tone === "warning") {
        return {
            color: "#9A6700",
            bg: alpha(brandColors.warning, 0.16),
            border: alpha(brandColors.warning, 0.36)
        };
    }

    if (tone === "success") {
        return {
            color: brandColors.success,
            bg: alpha(brandColors.success, 0.12),
            border: alpha(brandColors.success, 0.32)
        };
    }

    return {
        color: accent,
        bg: alpha(accent, 0.1),
        border: alpha(accent, 0.24)
    };
}

function formatRemaining(amount: number) {
    if (amount <= 0) {
        return "Target met";
    }

    return formatCurrency(amount);
}

export function FinancialSummary({
    summary,
    standing,
    onApplyLoan,
    onMakeContribution,
    onDownloadStatement
}: FinancialSummaryProps) {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === "dark";
    const accent = isDarkMode ? "#D9B273" : brandColors.info;
    const progress = Math.min(Math.max(summary.targetProgressPercent, 0), 100);
    const targetStyles = getToneStyles(summary.targetStatusTone, accent);
    const standingStyles = getToneStyles(standing.tone, accent);
    const primaryMetrics = [
        {
            label: "Savings",
            value: formatCurrency(summary.totalSavings),
            helper: "Current posted savings balance",
            icon: SavingsRoundedIcon,
            color: brandColors.success,
            bg: alpha(brandColors.success, 0.12)
        },
        {
            label: "Dividends",
            value: formatCurrency(summary.totalDividends),
            helper: "Posted dividend allocations",
            icon: TrendingUpRoundedIcon,
            color: accent,
            bg: alpha(accent, 0.12)
        },
        {
            label: "Loan",
            value: formatCurrency(summary.outstandingLoan),
            helper: standing.label,
            icon: CreditScoreRoundedIcon,
            color: summary.outstandingLoan > 0 ? brandColors.danger : brandColors.success,
            bg: summary.outstandingLoan > 0 ? alpha(brandColors.danger, 0.12) : alpha(brandColors.success, 0.12)
        }
    ];
    const targetFacts = [
        { label: "% reached", value: `${Math.round(summary.targetProgressPercent)}%` },
        { label: "Annual target", value: formatCurrency(summary.annualSavingsTarget) },
        { label: "Remaining", value: formatRemaining(summary.targetRemainingAmount) },
        { label: "Needed now", value: summary.nextRequiredAmount > 0 ? formatCurrency(summary.nextRequiredAmount) : "Clear" }
    ];
    const nextLoanText = summary.nextInstallmentDueDate
        ? `${formatDate(summary.nextInstallmentDueDate)} · ${formatCurrency(summary.nextInstallmentAmount)}`
        : "No due installment";

    return (
        <MotionCard
            variant="outlined"
            data-tour="member-portal-overview-actions"
            sx={{
                width: { xs: "calc(100vw - 20px)", sm: "100%" },
                maxWidth: { xs: "calc(100vw - 20px)", sm: "100%" },
                minWidth: 0,
                boxSizing: "border-box",
                borderRadius: 2,
                borderColor: "divider",
                boxShadow: "0 6px 18px rgba(15, 23, 42, 0.05)"
            }}
        >
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                <Stack spacing={2}>
                    <Stack direction={{ xs: "column", lg: "row" }} spacing={2} justifyContent="space-between">
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                <Typography variant="overline" color="text.secondary">
                                    Current Financial Level
                                </Typography>
                                <Chip
                                    label={summary.targetStatusLabel}
                                    size="small"
                                    sx={{
                                        borderRadius: 1.3,
                                        color: targetStyles.color,
                                        bgcolor: targetStyles.bg,
                                        border: `1px solid ${targetStyles.border}`,
                                        fontWeight: 800
                                    }}
                                />
                            </Stack>
                            <Typography
                                variant="h4"
                                sx={{
                                    mt: 0.75,
                                    fontWeight: 800,
                                    lineHeight: 1.08,
                                    fontSize: { xs: "1.9rem", sm: "2.15rem", md: "2.35rem" },
                                    overflowWrap: "anywhere"
                                }}
                            >
                                {formatCurrency(summary.totalSavings)} saved
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6, overflowWrap: "anywhere" }}>
                                Against {formatCurrency(summary.annualSavingsTarget)} annual performance target. Net position is {formatCurrency(summary.netPosition)} after visible loans.
                            </Typography>
                        </Box>
                        <Stack spacing={1} sx={{ width: { xs: "100%", lg: 390 }, minWidth: 0 }}>
                            {standing.showChip !== false ? (
                                <Chip
                                    label={standing.label}
                                    sx={{
                                        alignSelf: { xs: "flex-start", lg: "flex-end" },
                                        borderRadius: 1.5,
                                        color: standingStyles.color,
                                        bgcolor: standingStyles.bg,
                                        border: `1px solid ${standingStyles.border}`,
                                        fontWeight: 700
                                    }}
                                />
                            ) : null}
                            <Box
                                sx={{
                                    p: 1.35,
                                    borderRadius: 1.5,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    bgcolor: (theme) => alpha(theme.palette.background.paper, 0.72)
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" spacing={1}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                        Target progress
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                        {Math.round(summary.targetProgressPercent)}%
                                    </Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={progress}
                                    sx={{
                                        mt: 0.9,
                                        height: 8,
                                        borderRadius: 999,
                                        bgcolor: alpha(targetStyles.color, 0.14),
                                        "& .MuiLinearProgress-bar": {
                                            borderRadius: 999,
                                            bgcolor: targetStyles.color
                                        }
                                    }}
                                />
                            </Box>
                        </Stack>
                    </Stack>

                    <Box
                        sx={{
                            display: "grid",
                            gap: 1.2,
                            gridTemplateColumns: {
                                xs: "minmax(0, 1fr)",
                                sm: "repeat(2, minmax(0, 1fr))",
                                lg: "repeat(4, minmax(0, 1fr))"
                            }
                        }}
                    >
                        {targetFacts.map((item) => (
                            <Box
                                key={item.label}
                                sx={{
                                    minWidth: 0,
                                    p: 1.25,
                                    borderRadius: 1.5,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    bgcolor: (theme) => alpha(theme.palette.background.paper, 0.72)
                                }}
                            >
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                    {item.label}
                                </Typography>
                                <Typography variant="subtitle1" sx={{ mt: 0.35, fontWeight: 800, overflowWrap: "anywhere" }}>
                                    {item.value}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    <Box
                        sx={{
                            display: "grid",
                            gap: 1.4,
                            gridTemplateColumns: {
                                xs: "minmax(0, 1fr)",
                                md: "repeat(2, minmax(0, 1fr))",
                                xl: "repeat(3, minmax(0, 1fr))"
                            }
                        }}
                    >
                        {primaryMetrics.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Box
                                    key={item.label}
                                    sx={{
                                        minWidth: 0,
                                        p: 1.35,
                                        borderRadius: 1.5,
                                        border: "1px solid",
                                        borderColor: "divider",
                                        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.72)
                                    }}
                                >
                                    <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                                {item.label}
                                            </Typography>
                                            <Typography variant="h6" sx={{ mt: 0.4, fontWeight: 800, lineHeight: 1.2, overflowWrap: "anywhere" }}>
                                                {item.value}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.4, overflowWrap: "anywhere" }}>
                                                {item.helper}
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={{
                                                width: 30,
                                                height: 30,
                                                flexShrink: 0,
                                                borderRadius: 1.25,
                                                display: "grid",
                                                placeItems: "center",
                                                bgcolor: item.bg,
                                                color: item.color
                                            }}
                                        >
                                            <Icon sx={{ fontSize: 17 }} />
                                        </Box>
                                    </Stack>
                                </Box>
                            );
                        })}
                    </Box>

                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={1.2}
                        justifyContent="space-between"
                        alignItems={{ xs: "stretch", md: "center" }}
                    >
                        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                Next loan installment
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, overflowWrap: "anywhere" }}>
                                {nextLoanText}
                            </Typography>
                        </Stack>
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            useFlexGap
                            flexWrap="wrap"
                            sx={{ "& > *": { width: { xs: "100%", sm: "auto" } } }}
                        >
                            <Button
                                variant="contained"
                                onClick={onMakeContribution}
                                startIcon={<SavingsRoundedIcon />}
                                sx={{
                                    borderRadius: 1.5,
                                    fontWeight: 700,
                                    ...(isDarkMode
                                        ? { bgcolor: accent, color: "#1a1a1a", "&:hover": { bgcolor: "#E6C88A" } }
                                        : {})
                                }}
                            >
                                Make Contribution
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={onApplyLoan}
                                startIcon={<PaidRoundedIcon />}
                                sx={{
                                    borderRadius: 1.5,
                                    fontWeight: 700,
                                    ...(isDarkMode
                                        ? {
                                            borderColor: alpha(accent, 0.4),
                                            color: accent,
                                            "&:hover": { borderColor: alpha(accent, 0.72), bgcolor: alpha(accent, 0.08) }
                                        }
                                        : {})
                                }}
                            >
                                Apply for Loan
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={onDownloadStatement}
                                startIcon={<DownloadRoundedIcon />}
                                sx={{
                                    borderRadius: 1.5,
                                    fontWeight: 700,
                                    ...(isDarkMode
                                        ? {
                                            borderColor: alpha(accent, 0.4),
                                            color: accent,
                                            "&:hover": { borderColor: alpha(accent, 0.72), bgcolor: alpha(accent, 0.08) }
                                        }
                                        : {})
                                }}
                            >
                                Statement
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>
            </CardContent>
        </MotionCard>
    );
}
