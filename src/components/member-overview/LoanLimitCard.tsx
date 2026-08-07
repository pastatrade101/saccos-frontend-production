import CreditScoreRoundedIcon from "@mui/icons-material/CreditScoreRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import { Box, CardContent, Chip, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { brandColors } from "../../theme/colors";
import { formatCurrency } from "../../utils/format";
import { MotionCard } from "../../ui/motion";
import type { LoanLimitData } from "./types";

// How much the member can borrow right now — the same ledger-backed figure
// the loan application flow enforces (savings multiplier minus current
// exposure, capped by product and SACCO liquidity).
export function LoanLimitCard({
    borrowLimit,
    contributionLimit,
    currentExposure,
    guarantorExposure,
    eligible,
    poolFrozen,
    hasProblemLoans,
    loading
}: LoanLimitData) {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === "dark";
    const accent = isDarkMode ? "#D9B273" : brandColors.primary[700];

    const status = poolFrozen
        ? { label: "Loan pool frozen", color: brandColors.danger }
        : hasProblemLoans
            ? { label: "Clear arrears first", color: brandColors.danger }
            : eligible
                ? { label: "Eligible", color: brandColors.success }
                : { label: "Limited", color: "#9A6700" };

    return (
        <MotionCard
            variant="outlined"
            sx={{
                width: { xs: "calc(100vw - 20px)", sm: 1 },
                maxWidth: { xs: "calc(100vw - 20px)", sm: "100%" },
                minWidth: 0,
                boxSizing: "border-box",
                borderRadius: 2,
                borderColor: "divider",
                height: "100%",
                minHeight: 260,
                display: "flex"
            }}
        >
            <CardContent sx={{ p: 2.25, width: 1, display: "flex" }}>
                <Stack spacing={1.2} sx={{ width: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                                sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 1.25,
                                    display: "grid",
                                    placeItems: "center",
                                    bgcolor: alpha(accent, 0.14),
                                    color: accent
                                }}
                            >
                                <CreditScoreRoundedIcon fontSize="small" />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Loan Limit
                            </Typography>
                        </Stack>
                        <Chip
                            size="small"
                            label={loading ? "Loading…" : status.label}
                            sx={{
                                borderRadius: 1.2,
                                fontWeight: 700,
                                bgcolor: alpha(status.color, 0.14),
                                color: status.color
                            }}
                        />
                    </Stack>

                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            border: "1px solid",
                            borderColor: alpha(accent, 0.35),
                            bgcolor: alpha(accent, isDarkMode ? 0.12 : 0.07)
                        }}
                    >
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Unaweza kukopa hadi (You can borrow up to)
                        </Typography>
                        <Typography variant="h6" sx={{ mt: 1, fontWeight: 800, lineHeight: 1.2 }}>
                            {loading ? "…" : formatCurrency(borrowLimit)}
                        </Typography>
                    </Box>

                    <Stack spacing={0.9}>
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            spacing={1}
                            sx={{
                                p: 1.2,
                                borderRadius: 1.5,
                                border: "1px solid",
                                borderColor: "divider",
                                bgcolor: (paperTheme) => alpha(paperTheme.palette.background.paper, 0.72)
                            }}
                        >
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <SavingsRoundedIcon fontSize="small" sx={{ color: alpha(brandColors.success, 0.9) }} />
                                <Typography variant="body2" color="text.secondary">
                                    Savings-based limit
                                </Typography>
                            </Stack>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                {loading ? "…" : formatCurrency(contributionLimit)}
                            </Typography>
                        </Stack>
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            spacing={1}
                            sx={{
                                p: 1.2,
                                borderRadius: 1.5,
                                border: "1px solid",
                                borderColor: "divider",
                                bgcolor: (paperTheme) => alpha(paperTheme.palette.background.paper, 0.72)
                            }}
                        >
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <TrendingDownRoundedIcon fontSize="small" sx={{ color: alpha(brandColors.danger, 0.85) }} />
                                <Typography variant="body2" color="text.secondary">
                                    Already borrowed
                                </Typography>
                            </Stack>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                {loading ? "…" : formatCurrency(currentExposure)}
                            </Typography>
                        </Stack>
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            spacing={1}
                            sx={{
                                p: 1.2,
                                borderRadius: 1.5,
                                border: "1px solid",
                                borderColor: "divider",
                                bgcolor: (paperTheme) => alpha(paperTheme.palette.background.paper, 0.72)
                            }}
                        >
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <HandshakeRoundedIcon fontSize="small" sx={{ color: alpha("#9A6700", 0.9) }} />
                                <Typography variant="body2" color="text.secondary">
                                    Pledged as guarantor
                                </Typography>
                            </Stack>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                {loading ? "…" : formatCurrency(guarantorExposure)}
                            </Typography>
                        </Stack>
                    </Stack>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: "auto" }}>
                        Informational — final approval via branch appraisal.
                    </Typography>
                </Stack>
            </CardContent>
        </MotionCard>
    );
}
