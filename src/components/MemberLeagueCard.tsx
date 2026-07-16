import {
    Box,
    Button,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    LinearProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import LeaderboardRoundedIcon from "@mui/icons-material/LeaderboardRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import type { ChartData, ChartOptions, Plugin } from "chart.js";
import { Line } from "react-chartjs-2";
import { useEffect, useMemo, useState } from "react";

import { registerCharts } from "../lib/charts";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";
import {
    endpoints,
    type LeagueStandingsResponse,
    type MyLeaguePositionResponse
} from "../lib/endpoints";
import type { LeagueStandingRow, LeagueTier, MyLeaguePosition } from "../types/api";
import { MotionCard } from "../ui/motion";
import { formatCurrency } from "../utils/format";
import { downloadLeagueStandingsPdf, loadReportLogoDataUrl } from "../utils/memberStatementPdf";

registerCharts();

interface SavingsSeriesPoint {
    date: number;
    balance: number;
}

interface MemberLeagueCardProps {
    tenantId: string | null;
    savingsSeries?: SavingsSeriesPoint[];
}

const FALLBACK_TIER_COLOR = "#1976d2";

const compactMoney = new Intl.NumberFormat("en-TZ", { notation: "compact", maximumFractionDigits: 1 });

function monthLabel(date: Date) {
    return new Intl.DateTimeFormat("en-TZ", { month: "short", year: "2-digit" }).format(date);
}

function buildMonthlyBalances(series: SavingsSeriesPoint[]) {
    const now = new Date();
    const buckets: Array<{ end: number; label: string }> = [];
    for (let i = 11; i >= 0; i -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets.push({
            end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999).getTime(),
            label: monthLabel(date)
        });
    }

    const sorted = [...series].sort((left, right) => left.date - right.date);
    let cursor = 0;
    let last: number | null = null;

    return buckets.map((bucket) => {
        while (cursor < sorted.length && sorted[cursor].date <= bucket.end) {
            last = sorted[cursor].balance;
            cursor += 1;
        }
        return { label: bucket.label, value: last };
    });
}

export function MemberLeagueCard({ tenantId, savingsSeries = [] }: MemberLeagueCardProps) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const { profile, selectedTenantName, selectedBranchName } = useAuth();
    const [position, setPosition] = useState<MyLeaguePosition | null>(null);
    const [standingsOpen, setStandingsOpen] = useState(false);
    const [standingsLoading, setStandingsLoading] = useState(false);
    const [standingsError, setStandingsError] = useState<string | null>(null);
    const [leagueRows, setLeagueRows] = useState<LeagueStandingRow[]>([]);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const loadPosition = async () => {
            if (!tenantId) {
                return;
            }

            try {
                const { data: response } = await api.get<MyLeaguePositionResponse>(endpoints.leagues.me(), {
                    params: { tenant_id: tenantId }
                });

                if (!cancelled) {
                    setPosition(response.data || null);
                }
            } catch {
                if (!cancelled) {
                    setPosition(null);
                }
            }
        };

        void loadPosition();
        return () => {
            cancelled = true;
        };
    }, [tenantId]);

    const openStandings = async () => {
        if (!tenantId || position?.tier == null) {
            return;
        }

        setStandingsOpen(true);
        setStandingsLoading(true);
        setStandingsError(null);

        try {
            const { data: response } = await api.get<LeagueStandingsResponse>(endpoints.leagues.standings(), {
                params: { tenant_id: tenantId }
            });
            const tierIndex = position.tier.index;
            const rows = (response.data.standings || [])
                .filter((row) => row.tier_index === tierIndex)
                .sort((left, right) => left.tier_rank - right.tier_rank);
            setLeagueRows(rows);
        } catch {
            setStandingsError("Unable to load the league table right now.");
        } finally {
            setStandingsLoading(false);
        }
    };

    const exportStandingsPdf = async () => {
        if (!position?.tier) {
            return;
        }

        setExporting(true);
        try {
            const logoDataUrl = await loadReportLogoDataUrl();
            downloadLeagueStandingsPdf({
                leagueName: position.tier.name,
                tierColor: position.tier.color,
                memberNo: position.member_id ? leagueRows.find((row) => row.member_id === position.member_id)?.member_no : null,
                tierRank: position.tier_rank || 0,
                tierSize: position.tier_size || leagueRows.length,
                overallRank: position.overall_rank || 0,
                totalMembers: position.total_members || 0,
                tenantName: selectedTenantName,
                branchName: selectedBranchName,
                logoDataUrl,
                generatedBy: profile?.full_name || "Member Portal",
                showAmounts: leagueRows.some((row) => row.amount !== null),
                rows: leagueRows.map((row) => ({
                    tier_rank: row.tier_rank,
                    member_no: row.member_no,
                    rank_change: row.movement?.rank_change ?? null,
                    amount: row.amount,
                    is_self: row.member_id === position.member_id
                }))
            });
        } finally {
            setExporting(false);
        }
    };

    const tiers: LeagueTier[] = position?.tiers || [];
    const monthlyBalances = useMemo(() => buildMonthlyBalances(savingsSeries), [savingsSeries]);
    const hasTrendData = monthlyBalances.some((point) => point.value !== null);

    if (!position?.league_enabled || !position.tier) {
        return null;
    }

    const tier = position.tier;
    const tierColor = tier.color || FALLBACK_TIER_COLOR;
    const nextTier = position.next_tier || null;
    const amount = Number(position.amount || 0);
    const spanStart = tier.min_amount;
    const spanEnd = nextTier ? nextTier.min_amount : Math.max(amount, tier.min_amount + 1);
    const progressPercent = Math.min(
        Math.max(((amount - spanStart) / Math.max(spanEnd - spanStart, 1)) * 100, 0),
        100
    );
    const movement = position.movement || null;
    const rankChange = movement?.rank_change || 0;
    const promoted = (movement?.tier_change || 0) > 0;
    const climb = position.position_race?.climb || null;
    const defend = position.position_race?.defend || null;
    const showAmountsInModal = leagueRows.some((row) => row.amount !== null);

    // Trending chart: savings journey with league boundaries drawn as guide lines.
    const trendData: ChartData<"line"> = {
        labels: monthlyBalances.map((point) => point.label),
        datasets: [
            {
                label: "Savings",
                data: monthlyBalances.map((point) => point.value),
                borderColor: tierColor,
                backgroundColor: alpha(tierColor, 0.16),
                fill: true,
                tension: 0.4,
                spanGaps: true,
                pointRadius: 2,
                pointHoverRadius: 5,
                borderWidth: 2.5
            }
        ]
    };

    const trendOptions: ChartOptions<"line"> = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => `Savings: ${formatCurrency(Number(ctx.parsed.y || 0))}`
                }
            }
        },
        scales: {
            y: {
                ticks: { callback: (value) => compactMoney.format(Number(value)) },
                grid: { color: alpha(theme.palette.text.primary, 0.06) }
            },
            x: { grid: { display: false } }
        }
    };

    const tierBandsPlugin: Plugin<"line"> = {
        id: "leagueTierBands",
        afterDraw(chart) {
            const { ctx, chartArea, scales } = chart;
            const yScale = scales.y;
            if (!yScale) {
                return;
            }

            tiers.forEach((band) => {
                if (!band.min_amount || band.min_amount <= 0) {
                    return;
                }

                const yPos = yScale.getPixelForValue(band.min_amount);
                if (yPos < chartArea.top || yPos > chartArea.bottom) {
                    return;
                }

                const bandColor = band.color || FALLBACK_TIER_COLOR;
                ctx.save();
                ctx.strokeStyle = alpha(bandColor, 0.55);
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(chartArea.left, yPos);
                ctx.lineTo(chartArea.right, yPos);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = bandColor;
                ctx.font = "600 10px Inter, sans-serif";
                ctx.textBaseline = "bottom";
                ctx.fillText(band.name, chartArea.left + 4, yPos - 2);
                ctx.restore();
            });
        }
    };

    return (
        <>
            <MotionCard
                variant="outlined"
                data-tour="member-portal-league"
                onClick={() => void openStandings()}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        void openStandings();
                    }
                }}
                sx={{
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                    borderColor: alpha(tierColor, 0.4),
                    transition: "transform 140ms ease, box-shadow 140ms ease",
                    "&:hover": { transform: "translateY(-2px)", boxShadow: `0 18px 40px ${alpha(tierColor, 0.28)}` }
                }}
            >
                {/* Coloured hero band */}
                <Box
                    sx={{
                        px: { xs: 2.25, md: 2.75 },
                        py: 2,
                        background: `linear-gradient(135deg, ${alpha(tierColor, isDark ? 0.55 : 0.92)}, ${alpha(tierColor, isDark ? 0.28 : 0.62)})`,
                        color: "#fff"
                    }}
                >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5} flexWrap="wrap" useFlexGap>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                                sx={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: "16px",
                                    display: "grid",
                                    placeItems: "center",
                                    bgcolor: alpha("#ffffff", 0.22),
                                    border: `1px solid ${alpha("#ffffff", 0.5)}`
                                }}
                            >
                                {tier.danger ? <WarningAmberRoundedIcon sx={{ color: "#fff" }} /> : <EmojiEventsRoundedIcon sx={{ color: "#fff", fontSize: 28 }} />}
                            </Box>
                            <Box>
                                <Typography variant="overline" sx={{ color: alpha("#fff", 0.85), letterSpacing: "0.16em", lineHeight: 1.4 }}>
                                    Savings League
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.05, color: "#fff" }}>
                                    {tier.name}
                                </Typography>
                            </Box>
                        </Stack>
                        <Stack spacing={0.75} alignItems="flex-end">
                            <Chip
                                size="small"
                                label={`#${position.tier_rank} of ${position.tier_size} in league`}
                                sx={{ fontWeight: 800, bgcolor: "#fff", color: tierColor }}
                            />
                            <Chip
                                size="small"
                                label={`Overall #${position.overall_rank} of ${position.total_members}`}
                                sx={{ fontWeight: 700, bgcolor: alpha("#fff", 0.2), color: "#fff" }}
                            />
                            {rankChange !== 0 ? (
                                <Chip
                                    size="small"
                                    icon={rankChange > 0 ? <TrendingUpRoundedIcon sx={{ color: "#fff !important" }} /> : <TrendingDownRoundedIcon sx={{ color: "#fff !important" }} />}
                                    label={rankChange > 0
                                        ? `Up ${rankChange} position${rankChange === 1 ? "" : "s"}`
                                        : `Down ${Math.abs(rankChange)} position${Math.abs(rankChange) === 1 ? "" : "s"}`}
                                    sx={{
                                        fontWeight: 800,
                                        color: "#fff",
                                        bgcolor: alpha(rankChange > 0 ? theme.palette.success.dark : theme.palette.warning.dark, 0.9)
                                    }}
                                />
                            ) : null}
                        </Stack>
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 800, mt: 1.5, color: "#fff" }}>
                        {formatCurrency(amount)}
                    </Typography>
                </Box>

                <CardContent sx={{ p: { xs: 2.25, md: 2.75 } }}>
                    <Stack spacing={1.75}>
                        {promoted && movement ? (
                            <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                                🎉 Hongera! Umepanda kutoka {movement.previous_tier_name} kwenda {tier.name}.
                            </Typography>
                        ) : null}

                        {nextTier ? (
                            <Box>
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Progress to {nextTier.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: tierColor }}>
                                        {formatCurrency(nextTier.amount_needed)} to go
                                    </Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={progressPercent}
                                    sx={{
                                        height: 9,
                                        borderRadius: 999,
                                        bgcolor: alpha(tierColor, 0.14),
                                        "& .MuiLinearProgress-bar": { bgcolor: tierColor, borderRadius: 999 }
                                    }}
                                />
                            </Box>
                        ) : (
                            <Typography variant="body2" sx={{ fontWeight: 700, color: tierColor }}>
                                You are in the highest league. Defend your position! 🏆
                            </Typography>
                        )}

                        {climb || defend ? (
                            <Stack spacing={0.75} sx={{ p: 1.25, borderRadius: 1.5, bgcolor: alpha(isDark ? "#ffffff" : "#000000", 0.03) }}>
                                {climb ? (
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <ArrowUpwardRoundedIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                                        <Typography variant="body2">
                                            {climb.amount_needed > 0
                                                ? <>Save <b>{formatCurrency(climb.amount_needed)}</b> to climb to #{climb.overall_rank}.</>
                                                : <>You are tied for #{climb.overall_rank} — one more deposit to climb!</>}
                                        </Typography>
                                    </Stack>
                                ) : (
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <EmojiEventsRoundedIcon fontSize="small" sx={{ color: tierColor }} />
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            You are #1 in the whole SACCO. Everyone is chasing you!
                                        </Typography>
                                    </Stack>
                                )}
                                {defend ? (
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <ArrowDownwardRoundedIcon
                                            fontSize="small"
                                            sx={{ color: defend.amount_buffer <= 0 ? theme.palette.error.main : theme.palette.warning.main }}
                                        />
                                        <Typography variant="body2" color="text.secondary">
                                            {defend.amount_buffer > 0
                                                ? <>#{defend.overall_rank} is <b>{formatCurrency(defend.amount_buffer)}</b> behind — keep saving to stay ahead.</>
                                                : <>#{defend.overall_rank} has caught up. Save now to defend your spot!</>}
                                        </Typography>
                                    </Stack>
                                ) : null}
                            </Stack>
                        ) : null}

                        <Button
                            variant="text"
                            startIcon={<LeaderboardRoundedIcon />}
                            onClick={(event) => {
                                event.stopPropagation();
                                void openStandings();
                            }}
                            sx={{ alignSelf: "flex-start", color: tierColor, fontWeight: 700, px: 0 }}
                        >
                            View league table & trend
                        </Button>
                    </Stack>
                </CardContent>
            </MotionCard>

            <Dialog open={standingsOpen} onClose={() => setStandingsOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ pr: 6 }}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "12px",
                                display: "grid",
                                placeItems: "center",
                                bgcolor: alpha(tierColor, 0.16),
                                color: tierColor
                            }}
                        >
                            <EmojiEventsRoundedIcon />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: tierColor, lineHeight: 1.15 }}>
                                {tier.name} League
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {position.tier_size} member(s) · you are #{position.tier_rank}
                            </Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ position: "absolute", right: 8, top: 8 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DownloadRoundedIcon />}
                            onClick={() => void exportStandingsPdf()}
                            disabled={standingsLoading || exporting || !leagueRows.length}
                            sx={{ color: tierColor, borderColor: alpha(tierColor, 0.5) }}
                        >
                            {exporting ? "Exporting..." : "Export PDF"}
                        </Button>
                        <IconButton aria-label="Close" onClick={() => setStandingsOpen(false)}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent dividers>
                    {hasTrendData ? (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Your savings journey
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                                Last 12 months. Dashed lines mark each league's entry level.
                            </Typography>
                            <Box sx={{ height: 220 }}>
                                <Line data={trendData} options={trendOptions} plugins={[tierBandsPlugin]} />
                            </Box>
                        </Box>
                    ) : null}

                    <Divider sx={{ mb: 1.5 }} />

                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        League standings
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                        Members are shown by ID only to protect privacy.
                    </Typography>

                    {standingsLoading ? (
                        <Stack alignItems="center" sx={{ py: 4 }}>
                            <CircularProgress size={28} />
                        </Stack>
                    ) : standingsError ? (
                        <Typography variant="body2" color="error.main" sx={{ py: 2 }}>
                            {standingsError}
                        </Typography>
                    ) : (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Pos</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Member ID</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="center">Trend</TableCell>
                                    {showAmountsInModal ? (
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Savings</TableCell>
                                    ) : null}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {leagueRows.map((row) => {
                                    const isSelf = row.member_id === position.member_id;
                                    return (
                                        <TableRow
                                            key={row.member_id}
                                            sx={isSelf ? { bgcolor: alpha(tierColor, 0.12) } : undefined}
                                        >
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={isSelf ? 800 : 600}>
                                                    #{row.tier_rank}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={0.75} alignItems="center">
                                                    <Typography variant="body2" fontWeight={isSelf ? 800 : 500}>
                                                        {row.member_no}
                                                    </Typography>
                                                    {isSelf ? (
                                                        <Chip label="You" size="small" sx={{ height: 18, bgcolor: tierColor, color: "#fff" }} />
                                                    ) : null}
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="center">
                                                {row.movement && row.movement.rank_change > 0 ? (
                                                    <Stack direction="row" spacing={0.25} alignItems="center" justifyContent="center" sx={{ color: "success.main" }}>
                                                        <ArrowUpwardRoundedIcon sx={{ fontSize: 16 }} />
                                                        <Typography variant="caption" fontWeight={700}>{row.movement.rank_change}</Typography>
                                                    </Stack>
                                                ) : row.movement && row.movement.rank_change < 0 ? (
                                                    <Stack direction="row" spacing={0.25} alignItems="center" justifyContent="center" sx={{ color: "warning.main" }}>
                                                        <ArrowDownwardRoundedIcon sx={{ fontSize: 16 }} />
                                                        <Typography variant="caption" fontWeight={700}>{Math.abs(row.movement.rank_change)}</Typography>
                                                    </Stack>
                                                ) : (
                                                    <Typography variant="caption" color="text.secondary">—</Typography>
                                                )}
                                            </TableCell>
                                            {showAmountsInModal ? (
                                                <TableCell align="right">
                                                    {row.amount === null ? "—" : formatCurrency(row.amount)}
                                                </TableCell>
                                            ) : null}
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
