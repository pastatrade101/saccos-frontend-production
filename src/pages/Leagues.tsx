import {
    Alert,
    Box,
    Button,
    CardContent,
    Checkbox,
    Chip,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { AppLoader } from "../components/AppLoader";
import { api, getApiErrorMessage } from "../lib/api";
import {
    endpoints,
    type LeagueStandingsResponse,
    type SaccoLeagueSettingsResponse
} from "../lib/endpoints";
import type { Branch, LeagueStandingRow, LeagueTier, SaccoLeagueSettings } from "../types/api";
import { MotionCard } from "../ui/motion";
import { formatCurrency } from "../utils/format";
import { downloadLeagueStaffPdf, loadReportLogoDataUrl } from "../utils/memberStatementPdf";

interface ApiListEnvelope<T> {
    data: T[];
}

const FALLBACK_TIER_COLOR = "#1976d2";

function tierRangeLabel(tier: LeagueTier) {
    if (tier.max_amount === null || tier.max_amount === undefined) {
        return `${formatCurrency(tier.min_amount)}+`;
    }

    return `${formatCurrency(tier.min_amount)} – ${formatCurrency(tier.max_amount)}`;
}

function MovementChip({ row }: { row: LeagueStandingRow }) {
    const change = row.movement?.rank_change || 0;
    if (!change) {
        return <Typography variant="caption" color="text.secondary">—</Typography>;
    }

    return (
        <Chip
            size="small"
            variant="outlined"
            icon={change > 0 ? <TrendingUpRoundedIcon /> : <TrendingDownRoundedIcon />}
            color={change > 0 ? "success" : "warning"}
            label={`${change > 0 ? "+" : ""}${change}`}
        />
    );
}

export function LeaguesPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { selectedTenantId, selectedTenantName, profile } = useAuth();
    const [exporting, setExporting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [standings, setStandings] = useState<LeagueStandingRow[]>([]);
    const [tiers, setTiers] = useState<LeagueTier[]>([]);
    const [totalMembers, setTotalMembers] = useState(0);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [branchFilter, setBranchFilter] = useState<string>("all");
    const [search, setSearch] = useState("");

    const [settings, setSettings] = useState<SaccoLeagueSettings | null>(null);
    const [settingsDraft, setSettingsDraft] = useState<SaccoLeagueSettings | null>(null);
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
    const [settingsError, setSettingsError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!selectedTenantId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [standingsResult, settingsResult, branchesResult] = await Promise.allSettled([
                api.get<LeagueStandingsResponse>(endpoints.leagues.standings(), {
                    params: { tenant_id: selectedTenantId }
                }),
                api.get<SaccoLeagueSettingsResponse>(endpoints.saccoSettings.leagues(), {
                    params: { tenant_id: selectedTenantId }
                }),
                api.get<ApiListEnvelope<Branch>>(endpoints.branches.list(), {
                    params: { tenant_id: selectedTenantId }
                })
            ]);

            if (standingsResult.status === "fulfilled") {
                const payload = standingsResult.value.data.data;
                setStandings(payload.standings || []);
                setTiers(payload.tiers || []);
                setTotalMembers(payload.total_members || 0);
            } else {
                setError(getApiErrorMessage(standingsResult.reason, "Unable to load league standings."));
            }

            if (settingsResult.status === "fulfilled") {
                setSettings(settingsResult.value.data.data);
                setSettingsDraft(settingsResult.value.data.data);
            }

            if (branchesResult.status === "fulfilled") {
                setBranches(branchesResult.value.data.data || []);
            }
        } finally {
            setLoading(false);
        }
    }, [selectedTenantId]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const branchNames = useMemo(
        () => new Map(branches.map((branch) => [branch.id, branch.name])),
        [branches]
    );

    const visibleRows = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return standings.filter((row) => {
            const matchesBranch = branchFilter === "all" || row.branch_id === branchFilter;
            const matchesSearch = !normalizedSearch
                || row.member_name.toLowerCase().includes(normalizedSearch)
                || row.member_no.toLowerCase().includes(normalizedSearch);

            return matchesBranch && matchesSearch;
        });
    }, [branchFilter, search, standings]);

    const rowsByTier = useMemo(() => {
        const groups = new Map<number, LeagueStandingRow[]>();
        visibleRows.forEach((row) => {
            const group = groups.get(row.tier_index) || [];
            group.push(row);
            groups.set(row.tier_index, group);
        });

        return groups;
    }, [visibleRows]);

    const exportPdf = async (includeNames: boolean) => {
        if (!visibleRows.length) {
            return;
        }

        setExporting(true);
        try {
            const logoDataUrl = await loadReportLogoDataUrl();
            downloadLeagueStaffPdf({
                tenantName: selectedTenantName,
                logoDataUrl,
                generatedBy: profile?.full_name || "Branch Manager",
                includeNames,
                totalMembers,
                tiers: tiers.map((tier) => ({ name: tier.name, color: tier.color, member_count: tier.member_count })),
                rows: visibleRows.map((row) => ({
                    tier_index: row.tier_index,
                    tier_name: row.tier_name,
                    tier_rank: row.tier_rank,
                    overall_rank: row.overall_rank,
                    member_no: row.member_no,
                    member_name: row.member_name,
                    branch_name: row.branch_id ? branchNames.get(row.branch_id) || null : null,
                    rank_change: row.movement?.rank_change ?? null,
                    amount: row.amount
                }))
            });
        } finally {
            setExporting(false);
        }
    };

    const updateDraftTier = (index: number, patch: Partial<LeagueTier>) => {
        setSettingsDraft((draft) => {
            if (!draft) {
                return draft;
            }

            const nextTiers = draft.league_tiers.map((tier, tierIndex) =>
                tierIndex === index ? { ...tier, ...patch } : tier);

            return { ...draft, league_tiers: nextTiers };
        });
    };

    const addDraftTier = () => {
        setSettingsDraft((draft) => {
            if (!draft) {
                return draft;
            }

            const lastTier = draft.league_tiers[draft.league_tiers.length - 1];
            const newMin = lastTier
                ? (lastTier.max_amount ?? (lastTier.min_amount * 2 || 10000000))
                : 0;
            const updatedTiers = draft.league_tiers.map((tier, index) =>
                index === draft.league_tiers.length - 1 && tier.max_amount === null
                    ? { ...tier, max_amount: newMin }
                    : tier);

            return {
                ...draft,
                league_tiers: [
                    ...updatedTiers,
                    { name: `League ${draft.league_tiers.length + 1}`, min_amount: newMin, max_amount: null, color: FALLBACK_TIER_COLOR }
                ]
            };
        });
    };

    const removeDraftTier = (index: number) => {
        setSettingsDraft((draft) => {
            if (!draft || draft.league_tiers.length <= 1) {
                return draft;
            }

            return { ...draft, league_tiers: draft.league_tiers.filter((_, tierIndex) => tierIndex !== index) };
        });
    };

    const saveSettings = async () => {
        if (!settingsDraft || !selectedTenantId) {
            return;
        }

        setSavingSettings(true);
        setSettingsMessage(null);
        setSettingsError(null);

        try {
            const { data: response } = await api.patch<SaccoLeagueSettingsResponse>(endpoints.saccoSettings.leagues(), {
                tenant_id: selectedTenantId,
                league_enabled: settingsDraft.league_enabled,
                league_show_amounts_to_members: settingsDraft.league_show_amounts_to_members,
                league_tiers: settingsDraft.league_tiers.map((tier) => ({
                    name: tier.name,
                    min_amount: Number(tier.min_amount) || 0,
                    max_amount: tier.max_amount === null || tier.max_amount === undefined || `${tier.max_amount}` === ""
                        ? null
                        : Number(tier.max_amount),
                    ...(tier.color ? { color: tier.color } : {}),
                    ...(tier.danger ? { danger: true } : {})
                }))
            });

            setSettings(response.data);
            setSettingsDraft(response.data);
            setSettingsMessage("League settings saved.");
            await loadData();
        } catch (saveError) {
            setSettingsError(getApiErrorMessage(saveError, "Unable to save league settings."));
        } finally {
            setSavingSettings(false);
        }
    };

    const tableHeaderSx = {
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        fontSize: 11,
        color: theme.palette.primary.main,
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.14 : 0.08)
    };

    if (loading) {
        return <AppLoader fullscreen={false} minHeight="72vh" message="Loading savings leagues..." />;
    }

    return (
        <Stack spacing={3}>
            <MotionCard variant="outlined">
                <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                        <Box>
                            <Typography variant="h5">Savings Leagues</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }}>
                                Members of {selectedTenantName || "this SACCO"} grouped into savings bands with positions inside each
                                league and overall. Rankings are computed live from savings balances.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="flex-start">
                            <Chip label={`${totalMembers} ranked member(s)`} color="primary" variant="outlined" />
                            {settings ? (
                                <Chip
                                    label={settings.league_enabled ? "Visible to members" : "Hidden from members"}
                                    color={settings.league_enabled ? "success" : "default"}
                                    variant="outlined"
                                />
                            ) : null}
                        </Stack>
                    </Stack>
                </CardContent>
            </MotionCard>

            {error ? <Alert severity="error">{error}</Alert> : null}
            {!selectedTenantId ? <Alert severity="warning">Select a tenant before reviewing leagues.</Alert> : null}

            <Grid container spacing={2}>
                {tiers.map((tier, index) => {
                    const tierColor = tier.color || FALLBACK_TIER_COLOR;
                    return (
                        <Grid key={`${tier.name}-${index}`} size={{ xs: 6, sm: 4, md: 2 }}>
                            <MotionCard variant="outlined" sx={{ height: "100%", borderColor: alpha(tierColor, 0.5) }}>
                                <CardContent sx={{ py: 1.75 }}>
                                    <Typography variant="overline" sx={{ color: tierColor, fontWeight: 700 }} noWrap>
                                        {tier.name}
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                        {tier.member_count ?? (standings.filter((row) => row.tier_index === index).length)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }} noWrap>
                                        {tierRangeLabel(tier)}
                                    </Typography>
                                </CardContent>
                            </MotionCard>
                        </Grid>
                    );
                })}
            </Grid>

            <MotionCard variant="outlined">
                <CardContent sx={{ display: "grid", gap: 2 }}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
                        <Typography variant="h6" sx={{ flex: 1 }}>League Standings</Typography>
                        <TextField
                            label="Search member"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            size="small"
                            sx={{ minWidth: 220 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Branch</InputLabel>
                            <Select
                                label="Branch"
                                value={branchFilter}
                                onChange={(event) => setBranchFilter(event.target.value)}
                            >
                                <MenuItem value="all">All branches</MenuItem>
                                {branches.map((branch) => (
                                    <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<PictureAsPdfRoundedIcon />}
                            onClick={() => void exportPdf(true)}
                            disabled={exporting || !visibleRows.length}
                        >
                            {exporting ? "Preparing..." : "Export PDF (with names)"}
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<PictureAsPdfRoundedIcon />}
                            onClick={() => void exportPdf(false)}
                            disabled={exporting || !visibleRows.length}
                        >
                            Export PDF (IDs only)
                        </Button>
                        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                            {visibleRows.length} member(s) in current view
                        </Typography>
                    </Stack>

                    {[...tiers].map((tier, index) => index).reverse().map((tierIndex) => {
                        const tier = tiers[tierIndex];
                        const rows = rowsByTier.get(tierIndex) || [];
                        const tierColor = tier.color || FALLBACK_TIER_COLOR;

                        return (
                            <Box key={`${tier.name}-standings-${tierIndex}`}>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    sx={{
                                        px: 1.5,
                                        py: 1,
                                        borderRadius: 1.5,
                                        bgcolor: alpha(tierColor, theme.palette.mode === "dark" ? 0.2 : 0.1)
                                    }}
                                >
                                    <EmojiEventsRoundedIcon sx={{ color: tierColor }} fontSize="small" />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: tierColor }}>
                                        {tier.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {tierRangeLabel(tier)}
                                    </Typography>
                                    <Box sx={{ flex: 1 }} />
                                    <Chip size="small" label={`${rows.length} member(s)`} variant="outlined" />
                                </Stack>
                                {rows.length ? (
                                    <TableContainer sx={{ mt: 1, mb: 1.5 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={tableHeaderSx} width={72}>Pos</TableCell>
                                                    <TableCell sx={tableHeaderSx}>Member</TableCell>
                                                    <TableCell sx={tableHeaderSx}>Branch</TableCell>
                                                    <TableCell sx={tableHeaderSx} align="right">Savings</TableCell>
                                                    <TableCell sx={tableHeaderSx} align="right">Overall</TableCell>
                                                    <TableCell sx={tableHeaderSx} align="center">Movement</TableCell>
                                                    <TableCell sx={tableHeaderSx} align="right">Action</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {rows.map((row) => (
                                                    <TableRow key={row.member_id} hover>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={800}>#{row.tier_rank}</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Stack spacing={0.25}>
                                                                <Typography variant="body2" fontWeight={700}>{row.member_name}</Typography>
                                                                <Typography variant="caption" color="text.secondary">{row.member_no}</Typography>
                                                            </Stack>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {row.branch_id ? branchNames.get(row.branch_id) || "—" : "—"}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {row.amount === null ? "—" : formatCurrency(row.amount)}
                                                        </TableCell>
                                                        <TableCell align="right">#{row.overall_rank}</TableCell>
                                                        <TableCell align="center"><MovementChip row={row} /></TableCell>
                                                        <TableCell align="right">
                                                            <Button size="small" variant="text" onClick={() => navigate(`/members/${row.member_id}`)}>
                                                                Open
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 1.5, py: 1 }}>
                                        No members in this league for the current filters.
                                    </Typography>
                                )}
                            </Box>
                        );
                    })}
                </CardContent>
            </MotionCard>

            {settingsDraft ? (
                <MotionCard variant="outlined">
                    <CardContent sx={{ display: "grid", gap: 2 }}>
                        <Box>
                            <Typography variant="h6">League Settings</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Define the savings bands, names, and colors for this SACCO. Members below the first band boundary
                                sit in the danger zone. Changes apply immediately to all dashboards.
                            </Typography>
                        </Box>

                        {settingsMessage ? <Alert severity="success">{settingsMessage}</Alert> : null}
                        {settingsError ? <Alert severity="error">{settingsError}</Alert> : null}

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settingsDraft.league_enabled}
                                        onChange={(event) => setSettingsDraft({ ...settingsDraft, league_enabled: event.target.checked })}
                                    />
                                }
                                label="Show leagues to members"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settingsDraft.league_show_amounts_to_members}
                                        onChange={(event) => setSettingsDraft({ ...settingsDraft, league_show_amounts_to_members: event.target.checked })}
                                    />
                                }
                                label="Members can see each other's amounts"
                            />
                        </Stack>

                        <Stack spacing={1.25}>
                            {settingsDraft.league_tiers.map((tier, index) => (
                                <Stack
                                    key={index}
                                    direction={{ xs: "column", md: "row" }}
                                    spacing={1}
                                    alignItems={{ md: "center" }}
                                    sx={{ p: 1.25, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.divider, 0.9)}` }}
                                >
                                    <TextField
                                        label="League name"
                                        size="small"
                                        value={tier.name}
                                        onChange={(event) => updateDraftTier(index, { name: event.target.value })}
                                        sx={{ minWidth: 180 }}
                                    />
                                    <TextField
                                        label="From (TZS)"
                                        size="small"
                                        type="number"
                                        value={tier.min_amount}
                                        onChange={(event) => updateDraftTier(index, { min_amount: Number(event.target.value) || 0 })}
                                        sx={{ minWidth: 150 }}
                                    />
                                    <TextField
                                        label="Up to (TZS, empty = no limit)"
                                        size="small"
                                        type="number"
                                        value={tier.max_amount ?? ""}
                                        onChange={(event) => updateDraftTier(index, {
                                            max_amount: event.target.value === "" ? null : Number(event.target.value)
                                        })}
                                        sx={{ minWidth: 200 }}
                                    />
                                    <TextField
                                        label="Color"
                                        size="small"
                                        type="color"
                                        value={tier.color || FALLBACK_TIER_COLOR}
                                        onChange={(event) => updateDraftTier(index, { color: event.target.value })}
                                        sx={{ width: 90 }}
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={Boolean(tier.danger)}
                                                onChange={(event) => updateDraftTier(index, { danger: event.target.checked })}
                                            />
                                        }
                                        label="Danger zone"
                                    />
                                    <Box sx={{ flex: 1 }} />
                                    <IconButton
                                        aria-label="Remove league"
                                        onClick={() => removeDraftTier(index)}
                                        disabled={settingsDraft.league_tiers.length <= 1}
                                    >
                                        <DeleteOutlineRoundedIcon />
                                    </IconButton>
                                </Stack>
                            ))}
                        </Stack>

                        <Stack direction="row" spacing={1.5}>
                            <Button startIcon={<AddRoundedIcon />} variant="outlined" onClick={addDraftTier}>
                                Add league
                            </Button>
                            <Box sx={{ flex: 1 }} />
                            <Button
                                variant="text"
                                disabled={savingSettings}
                                onClick={() => {
                                    setSettingsDraft(settings);
                                    setSettingsError(null);
                                    setSettingsMessage(null);
                                }}
                            >
                                Reset
                            </Button>
                            <Button variant="contained" onClick={() => void saveSettings()} disabled={savingSettings}>
                                {savingSettings ? "Saving..." : "Save league settings"}
                            </Button>
                        </Stack>
                    </CardContent>
                </MotionCard>
            ) : null}
        </Stack>
    );
}
