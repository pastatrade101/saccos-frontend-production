import { useEffect, useState } from "react";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import { Box, CardContent, Grid, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { api } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";
import { brandColors } from "../../theme/colors";
import { MotionCard } from "../../ui/motion";
import { formatCurrency } from "../../utils/format";

interface UcgStatistics {
    summary?: { totalGenerated?: number; active?: number; used?: number; expired?: number; cancelled?: number };
    amounts?: {
        totalAmount?: number;
        collectedAmount?: number;
        pendingAmount?: number;
        expiredAmount?: number;
        currency?: string;
    };
    trends?: { generatedToday?: number; collectedToday?: number; averagePerDay?: number; collectionRate?: string | number };
}

interface UcgStatisticsResponse {
    data?: UcgStatistics;
}

function Figure({ label, value, helper }: { label: string; value: string; helper?: string }) {
    return (
        <Stack spacing={0.25}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {label}
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", lineHeight: 1.2 }}>{value}</Typography>
            {helper ? (
                <Typography variant="caption" color="text.secondary">
                    {helper}
                </Typography>
            ) : null}
        </Stack>
    );
}

// Treasurer's collection snapshot over GET /ucg/statistics. Hidden on any error
// (UCG not enabled, older backend) so it can ship ahead of the gateway going live.
export function UcgCollectionsCard() {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === "dark";
    const accent = isDarkMode ? "#7FB2A6" : brandColors.primary[700];
    const [stats, setStats] = useState<UcgStatistics | null>(null);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const { data } = await api.get<UcgStatisticsResponse>(endpoints.memberPayments.ucgStatistics());
                if (active) {
                    setStats(data?.data || null);
                }
            } catch {
                if (active) {
                    setStats(null);
                }
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    if (!stats) {
        return null;
    }

    const amounts = stats.amounts || {};
    const summary = stats.summary || {};
    const trends = stats.trends || {};
    const rate = trends.collectionRate !== undefined && trends.collectionRate !== null
        ? `${Number(trends.collectionRate).toFixed(0)}%`
        : "—";

    return (
        <MotionCard
            variant="outlined"
            sx={{
                borderRadius: 2,
                borderColor: alpha(accent, 0.4),
                bgcolor: alpha(accent, isDarkMode ? 0.1 : 0.06)
            }}
        >
            <CardContent sx={{ p: 2.25 }}>
                <Stack spacing={1.6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                            sx={{
                                width: 28,
                                height: 28,
                                borderRadius: 1.25,
                                display: "grid",
                                placeItems: "center",
                                bgcolor: alpha(accent, 0.16),
                                color: accent
                            }}
                        >
                            <AccountBalanceWalletRoundedIcon fontSize="small" />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                UCG collections
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Reference-based deposits via bank and mobile money
                            </Typography>
                        </Box>
                    </Stack>

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Figure label="Collected" value={formatCurrency(amounts.collectedAmount || 0)} />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Figure label="Pending" value={formatCurrency(amounts.pendingAmount || 0)} />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Figure label="Collection rate" value={rate} helper={`${summary.used || 0} of ${summary.totalGenerated || 0} used`} />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Figure label="Active references" value={String(summary.active || 0)} helper={`${trends.collectedToday || 0} paid today`} />
                        </Grid>
                    </Grid>
                </Stack>
            </CardContent>
        </MotionCard>
    );
}
