import {
    Alert,
    Box,
    Button,
    CardContent,
    Chip,
    FormControl,
    Grid,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { AppLoader } from "../components/AppLoader";
import { api, getApiErrorMessage } from "../lib/api";
import {
    endpoints,
    type SaccoPerformanceTargetSettingsResponse
} from "../lib/endpoints";
import type { Member, MemberAccount, SaccoPerformanceTargetSettings } from "../types/api";
import { MotionCard } from "../ui/motion";
import {
    calculateMemberPerformanceTarget,
    calculateRequiredToDate,
    DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS,
    normalizeSaccoPerformanceTargetSettings,
    resolvePerformanceTargetStatusId,
    type PerformanceTargetLevelColor,
    type PerformanceTargetStatusId
} from "../utils/performanceTarget";
import { formatCurrency } from "../utils/format";

const PAGE_LOAD_LIMIT = 100;
const MAX_PAGE_LOADS = 100;
const rowsPerPageOptions = [10, 25, 50, 100];

type StatusFilter = PerformanceTargetStatusId | "needs_action" | "variance" | "all";
type TargetBandFilter = "all" | "under_40" | "under_on_track" | "on_track_to_target" | "met_or_above" | "no_target";
type SortKey = "member_no" | "name" | "reach_asc" | "reach_desc" | "gap_desc" | "actual_desc" | "target_desc";

interface PagedApiEnvelope<T> {
    data: T[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
    } | null;
}

interface PerformanceTargetRow {
    memberId: string;
    memberName: string;
    memberNo: string;
    phone: string | null;
    branchId: string;
    actualDetailAmount: number;
    actualFormAmount: number;
    matchesDetail: boolean;
    requiredAmount: number;
    annualTargetAmount: number;
    remainingAmount: number;
    remainingToTargetAmount: number;
    reachPercent: number;
    remainingPercent: number;
    nextRequiredAmount: number;
    level: string;
    levelColor: PerformanceTargetLevelColor;
    statusId: PerformanceTargetStatusId;
}

const statusFilterOptions: Array<{ value: StatusFilter; label: string }> = [
    { value: "needs_action", label: "Needs action" },
    { value: "no_activity", label: "No activity" },
    { value: "needs_top_up", label: "Needs top-up" },
    { value: "building", label: "Building" },
    { value: "on_track", label: "On track" },
    { value: "target_met", label: "Target met" },
    { value: "variance", label: "Variance" },
    { value: "all", label: "All members" }
];

const targetBandOptions: Array<{ value: TargetBandFilter; label: string }> = [
    { value: "all", label: "All target bands" },
    { value: "under_40", label: "Below 40%" },
    { value: "under_on_track", label: "Below on-track line" },
    { value: "on_track_to_target", label: "On track, not met" },
    { value: "met_or_above", label: "Met or above" },
    { value: "no_target", label: "No target amount" }
];

const sortOptions: Array<{ value: SortKey; label: string }> = [
    { value: "reach_asc", label: "Lowest reach first" },
    { value: "gap_desc", label: "Largest gap first" },
    { value: "member_no", label: "Member number" },
    { value: "name", label: "Member name" },
    { value: "reach_desc", label: "Highest reach first" },
    { value: "actual_desc", label: "Actual amount high to low" },
    { value: "target_desc", label: "Annual target high to low" }
];

function normalizeSearch(value: string) {
    return value.trim().toLowerCase();
}

function percentLabel(value: number) {
    if (!Number.isFinite(value)) {
        return "0%";
    }

    return `${value.toFixed(0)}%`;
}

function actualSourceLabel(settings: SaccoPerformanceTargetSettings) {
    if (settings.performance_target_actual_source === "available_savings") {
        return "Available savings";
    }

    return "Savings balance";
}

function matchesStatus(row: PerformanceTargetRow, filter: StatusFilter, settings: SaccoPerformanceTargetSettings) {
    if (filter === "all") {
        return true;
    }

    if (filter === "variance") {
        return !row.matchesDetail;
    }

    if (filter === "needs_action") {
        return row.annualTargetAmount > 0 && row.reachPercent < settings.performance_target_on_track_percent;
    }

    return row.statusId === filter;
}

function matchesTargetBand(row: PerformanceTargetRow, filter: TargetBandFilter, settings: SaccoPerformanceTargetSettings) {
    if (filter === "all") {
        return true;
    }

    if (filter === "no_target") {
        return row.annualTargetAmount <= 0;
    }

    if (filter === "under_40") {
        return row.annualTargetAmount > 0 && row.reachPercent < 40;
    }

    if (filter === "under_on_track") {
        return row.annualTargetAmount > 0 && row.reachPercent < settings.performance_target_on_track_percent;
    }

    if (filter === "on_track_to_target") {
        return row.reachPercent >= settings.performance_target_on_track_percent && row.reachPercent < 100;
    }

    return row.reachPercent >= 100;
}

function sortTargetRows(rows: PerformanceTargetRow[], sortKey: SortKey) {
    return [...rows].sort((left, right) => {
        if (sortKey === "name") {
            return left.memberName.localeCompare(right.memberName, undefined, { sensitivity: "base" });
        }

        if (sortKey === "reach_asc") {
            return left.reachPercent - right.reachPercent || right.remainingToTargetAmount - left.remainingToTargetAmount;
        }

        if (sortKey === "reach_desc") {
            return right.reachPercent - left.reachPercent || right.actualFormAmount - left.actualFormAmount;
        }

        if (sortKey === "gap_desc") {
            return right.remainingToTargetAmount - left.remainingToTargetAmount || left.reachPercent - right.reachPercent;
        }

        if (sortKey === "actual_desc") {
            return right.actualFormAmount - left.actualFormAmount;
        }

        if (sortKey === "target_desc") {
            return right.annualTargetAmount - left.annualTargetAmount;
        }

        return left.memberNo.localeCompare(right.memberNo, undefined, { numeric: true, sensitivity: "base" })
            || left.memberName.localeCompare(right.memberName, undefined, { sensitivity: "base" });
    });
}

async function loadAllPages<T>(url: string, params: Record<string, string | number | boolean | undefined>) {
    const rows: T[] = [];

    for (let page = 1; page <= MAX_PAGE_LOADS; page += 1) {
        const { data: response } = await api.get<PagedApiEnvelope<T>>(url, {
            params: {
                ...params,
                page,
                limit: PAGE_LOAD_LIMIT
            }
        });

        const pageRows = response.data || [];
        rows.push(...pageRows);

        const total = Number(response.pagination?.total || 0);
        if (!response.pagination || pageRows.length < PAGE_LOAD_LIMIT || (total > 0 && rows.length >= total)) {
            break;
        }
    }

    return rows;
}

export function PerformanceTargetsPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { selectedTenantId, selectedTenantName, branchIds } = useAuth();
    const [members, setMembers] = useState<Member[]>([]);
    const [accounts, setAccounts] = useState<MemberAccount[]>([]);
    const [settings, setSettings] = useState<SaccoPerformanceTargetSettings>(DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("needs_action");
    const [targetBandFilter, setTargetBandFilter] = useState<TargetBandFilter>("all");
    const [reconciliationFilter, setReconciliationFilter] = useState<"all" | "matched" | "variance">("all");
    const [sortKey, setSortKey] = useState<SortKey>("reach_asc");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    useEffect(() => {
        const loadData = async () => {
            if (!selectedTenantId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const [memberRows, accountRows] = await Promise.all([
                    loadAllPages<Member>(endpoints.members.list(), {
                        tenant_id: selectedTenantId,
                        fields: "summary",
                        include_total: false
                    }),
                    loadAllPages<MemberAccount>(endpoints.members.accounts(), {
                        tenant_id: selectedTenantId,
                        include_total: false
                    })
                ]);
                let normalizedSettings = normalizeSaccoPerformanceTargetSettings({ tenant_id: selectedTenantId });

                try {
                    const { data: performanceResponse } = await api.get<SaccoPerformanceTargetSettingsResponse>(endpoints.saccoSettings.performanceTarget(), {
                        params: { tenant_id: selectedTenantId }
                    });
                    normalizedSettings = normalizeSaccoPerformanceTargetSettings(performanceResponse.data);
                } catch (settingsError) {
                    setError(getApiErrorMessage(settingsError, "Unable to load performance target settings. Using defaults."));
                }

                setMembers(memberRows);
                setAccounts(accountRows);
                setSettings(normalizedSettings);
            } catch (loadError) {
                setError(getApiErrorMessage(loadError, "Unable to load performance targets."));
                setSettings(normalizeSaccoPerformanceTargetSettings({ tenant_id: selectedTenantId }));
            } finally {
                setLoading(false);
            }
        };

        void loadData();
    }, [selectedTenantId]);

    useEffect(() => {
        setPage(0);
    }, [search, statusFilter, targetBandFilter, reconciliationFilter, sortKey, rowsPerPage]);

    const rows = useMemo<PerformanceTargetRow[]>(() => {
        const visibleMembers = branchIds.length
            ? members.filter((member) => branchIds.includes(member.branch_id))
            : members;
        const visibleMemberIds = new Set(visibleMembers.map((member) => member.id));
        const accountsByMember = new Map<string, MemberAccount[]>();

        accounts.forEach((account) => {
            if (!visibleMemberIds.has(account.member_id) || account.status === "closed") {
                return;
            }

            const memberAccounts = accountsByMember.get(account.member_id) || [];
            memberAccounts.push(account);
            accountsByMember.set(account.member_id, memberAccounts);
        });

        return visibleMembers
            .filter((member) => member.status === "active")
            .map((member) => {
                const target = calculateMemberPerformanceTarget(member, accountsByMember.get(member.id) || [], settings);

                return {
                    memberId: member.id,
                    memberName: member.full_name,
                    memberNo: member.member_no || member.id.slice(0, 8),
                    phone: member.phone,
                    branchId: member.branch_id,
                    actualDetailAmount: target.actualDetailAmount,
                    actualFormAmount: target.actualFormAmount,
                    matchesDetail: target.matchesDetail,
                    requiredAmount: target.requiredAmount,
                    annualTargetAmount: target.annualTargetAmount,
                    remainingAmount: target.remainingAmount,
                    remainingToTargetAmount: target.remainingToTargetAmount,
                    reachPercent: target.reachPercent,
                    remainingPercent: target.remainingPercent,
                    nextRequiredAmount: target.nextRequiredAmount,
                    level: target.levelLabel,
                    levelColor: target.levelColor,
                    statusId: resolvePerformanceTargetStatusId(target.reachPercent, target.actualFormAmount, settings)
                };
            });
    }, [accounts, branchIds, members, settings]);

    const summary = useMemo(() => {
        const totalActual = rows.reduce((sum, row) => sum + row.actualFormAmount, 0);
        const totalTarget = rows.reduce((sum, row) => sum + row.annualTargetAmount, 0);
        const totalGap = rows.reduce((sum, row) => sum + row.remainingToTargetAmount, 0);
        const needsAction = rows.filter((row) => matchesStatus(row, "needs_action", settings)).length;
        const targetMet = rows.filter((row) => row.statusId === "target_met").length;
        const noActivity = rows.filter((row) => row.statusId === "no_activity").length;
        const variance = rows.filter((row) => !row.matchesDetail).length;

        return {
            totalActual,
            totalTarget,
            totalGap,
            needsAction,
            targetMet,
            noActivity,
            variance,
            averageReach: totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0
        };
    }, [rows, settings]);

    const statusCounts = useMemo(() => {
        const counts = new Map<StatusFilter, number>();
        statusFilterOptions.forEach((option) => counts.set(option.value, 0));

        rows.forEach((row) => {
            counts.set(row.statusId, (counts.get(row.statusId) || 0) + 1);

            if (matchesStatus(row, "needs_action", settings)) {
                counts.set("needs_action", (counts.get("needs_action") || 0) + 1);
            }

            if (!row.matchesDetail) {
                counts.set("variance", (counts.get("variance") || 0) + 1);
            }
        });

        counts.set("all", rows.length);
        return counts;
    }, [rows, settings]);

    const filteredRows = useMemo(() => {
        const normalizedSearch = normalizeSearch(search);
        const filtered = rows.filter((row) => {
            const searchable = [
                row.memberNo,
                row.memberName,
                row.phone,
                row.level
            ].filter(Boolean).join(" ").toLowerCase();
            const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
            const matchesSelectedStatus = matchesStatus(row, statusFilter, settings);
            const matchesSelectedTargetBand = matchesTargetBand(row, targetBandFilter, settings);
            const matchesReconciliation = reconciliationFilter === "all"
                || (reconciliationFilter === "matched" && row.matchesDetail)
                || (reconciliationFilter === "variance" && !row.matchesDetail);

            return matchesSearch && matchesSelectedStatus && matchesSelectedTargetBand && matchesReconciliation;
        });

        return sortTargetRows(filtered, sortKey);
    }, [reconciliationFilter, rows, search, settings, sortKey, statusFilter, targetBandFilter]);

    const hiddenRowCount = rows.length - filteredRows.length;

    // Names the filters actually doing the hiding, so the banner explains itself
    // rather than sending the reader off to hunt for which control is set.
    const activeFilterSummary = useMemo(() => {
        const parts: string[] = [];

        if (statusFilter !== "all") {
            const label = statusFilterOptions.find((option) => option.value === statusFilter)?.label;
            if (label) {
                parts.push(`the "${label}" filter`);
            }
        }

        if (targetBandFilter !== "all") {
            const label = targetBandOptions.find((option) => option.value === targetBandFilter)?.label;
            if (label) {
                parts.push(`target band "${label}"`);
            }
        }

        if (reconciliationFilter !== "all") {
            parts.push(`reconciliation "${reconciliationFilter}"`);
        }

        if (search.trim()) {
            parts.push(`the search "${search.trim()}"`);
        }

        if (!parts.length) {
            return "the current filters";
        }

        if (parts.length === 1) {
            return parts[0];
        }

        return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
    }, [reconciliationFilter, search, statusFilter, targetBandFilter]);

    const paginatedRows = useMemo(
        () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [filteredRows, page, rowsPerPage]
    );

    const filteredGap = useMemo(
        () => filteredRows.reduce((sum, row) => sum + row.remainingToTargetAmount, 0),
        [filteredRows]
    );

    const tableHeaderSx = {
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        fontSize: 11,
        color: theme.palette.primary.main,
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.14 : 0.08)
    };

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("needs_action");
        setTargetBandFilter("all");
        setReconciliationFilter("all");
        setSortKey("reach_asc");
    };

    // Distinct from clearFilters, which returns to the "Needs action" worklist
    // the page opens on. This one really does show everyone.
    const showAllRows = () => {
        setSearch("");
        setStatusFilter("all");
        setTargetBandFilter("all");
        setReconciliationFilter("all");
        setPage(0);
    };

    if (loading) {
        return <AppLoader fullscreen={false} minHeight="72vh" message="Loading performance targets..." />;
    }

    return (
        <Stack spacing={3}>
            <MotionCard variant="outlined">
                <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                        <Box>
                            <Typography variant="h5">Performance Target Control</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }}>
                                Full member watchlist for {selectedTenantName || "this SACCO"} using {actualSourceLabel(settings).toLowerCase()} as the actual source, imported member targets where available, and the tenant default target otherwise.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip label={`${rows.length} active member(s)`} color="primary" variant="outlined" />
                            <Chip label={`On-track line ${percentLabel(settings.performance_target_on_track_percent)}`} variant="outlined" />
                            {/* Same figure the rows use, so the header cannot drift
                                from the table once the monthly rule is on. */}
                            <Chip
                                label={`Needed now ${formatCurrency(calculateRequiredToDate(settings) ?? settings.performance_target_required_amount)}`}
                                variant="outlined"
                            />
                        </Stack>
                    </Stack>
                </CardContent>
            </MotionCard>

            {error ? <Alert severity="error">{error}</Alert> : null}
            {!selectedTenantId ? <Alert severity="warning">Select a tenant before reviewing performance targets.</Alert> : null}

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 3 }}>
                    <MotionCard variant="outlined" sx={{ height: "100%" }}>
                        <CardContent>
                            <Typography variant="overline" color="text.secondary">Overall Reach</Typography>
                            <Typography variant="h4" sx={{ mt: 1 }}>{percentLabel(summary.averageReach)}</Typography>
                            <LinearProgress variant="determinate" value={Math.min(Math.max(summary.averageReach, 0), 100)} sx={{ mt: 1.5, height: 8, borderRadius: 999 }} />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {formatCurrency(summary.totalActual)} actual against {formatCurrency(summary.totalTarget)} target.
                            </Typography>
                        </CardContent>
                    </MotionCard>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <MotionCard variant="outlined" sx={{ height: "100%" }}>
                        <CardContent>
                            <Typography variant="overline" color="text.secondary">Needs Action</Typography>
                            <Typography variant="h4" sx={{ mt: 1 }}>{summary.needsAction}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Members below the configured on-track line.
                            </Typography>
                        </CardContent>
                    </MotionCard>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <MotionCard variant="outlined" sx={{ height: "100%" }}>
                        <CardContent>
                            <Typography variant="overline" color="text.secondary">Target Met</Typography>
                            <Typography variant="h4" sx={{ mt: 1 }}>{summary.targetMet}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Members already at or above annual target.
                            </Typography>
                        </CardContent>
                    </MotionCard>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <MotionCard variant="outlined" sx={{ height: "100%" }}>
                        <CardContent>
                            <Typography variant="overline" color="text.secondary">Filtered Gap</Typography>
                            <Typography variant="h4" sx={{ mt: 1 }}>{formatCurrency(filteredGap)}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Remaining amount for the current filtered list.
                            </Typography>
                        </CardContent>
                    </MotionCard>
                </Grid>
            </Grid>

            <MotionCard variant="outlined">
                <CardContent sx={{ display: "grid", gap: 2 }}>
                    <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", lg: "center" }} spacing={1.5}>
                        <Box>
                            <Typography variant="h6">Member Target List</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                {filteredRows.length} of {rows.length} active member(s) match the current filters. Use this list for follow-up, target correction, and branch-level performance review.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip label={`${summary.noActivity} no activity`} size="small" variant="outlined" />
                            <Chip label={`${summary.variance} variance`} size="small" color={summary.variance ? "warning" : "success"} variant="outlined" />
                            <Chip label={`Total gap ${formatCurrency(summary.totalGap)}`} size="small" variant="outlined" />
                        </Stack>
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {statusFilterOptions.map((option) => (
                            <Chip
                                key={option.value}
                                label={`${option.label}: ${statusCounts.get(option.value) || 0}`}
                                size="small"
                                clickable
                                color={statusFilter === option.value ? "primary" : "default"}
                                variant={statusFilter === option.value ? "filled" : "outlined"}
                                onClick={() => setStatusFilter(option.value)}
                            />
                        ))}
                    </Stack>

                    <Grid container spacing={1.5} alignItems="center">
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                label="Search member"
                                placeholder="Member name, ID, phone, or level"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>Target band</InputLabel>
                                <Select
                                    label="Target band"
                                    value={targetBandFilter}
                                    onChange={(event) => setTargetBandFilter(event.target.value as TargetBandFilter)}
                                >
                                    {targetBandOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>Reconciliation</InputLabel>
                                <Select
                                    label="Reconciliation"
                                    value={reconciliationFilter}
                                    onChange={(event) => setReconciliationFilter(event.target.value as "all" | "matched" | "variance")}
                                >
                                    <MenuItem value="all">All rows</MenuItem>
                                    <MenuItem value="matched">Matched</MenuItem>
                                    <MenuItem value="variance">Variance only</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>Sort</InputLabel>
                                <Select
                                    label="Sort"
                                    value={sortKey}
                                    onChange={(event) => setSortKey(event.target.value as SortKey)}
                                >
                                    {sortOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <Button variant="outlined" fullWidth onClick={clearFilters}>
                                Clear filters
                            </Button>
                        </Grid>
                    </Grid>

                    {/* The page opens on the "Needs action" worklist, so the very first
                        thing a user sees is 98 of 150 members with the reason showing
                        only as a highlighted chip. That reads as missing data. Say what
                        is hidden and why, and offer the way back in the same breath. */}
                    {hiddenRowCount > 0 ? (
                        <Alert
                            severity="info"
                            variant="outlined"
                            action={
                                <Button color="inherit" size="small" onClick={showAllRows}>
                                    Show all {rows.length}
                                </Button>
                            }
                        >
                            Showing {filteredRows.length} of {rows.length} members — {hiddenRowCount} hidden by {activeFilterSummary}. Every active member has a target.
                        </Alert>
                    ) : null}

                    {!filteredRows.length ? (
                        <Alert severity="info" variant="outlined">
                            No member target rows match the selected filters.
                        </Alert>
                    ) : (
                        <Box>
                            <TableContainer sx={{ maxHeight: 620, overflowX: "auto" }}>
                                <Table size="small" stickyHeader sx={{ minWidth: 1180 }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={tableHeaderSx}>No.</TableCell>
                                            <TableCell sx={tableHeaderSx}>Member</TableCell>
                                            <TableCell sx={tableHeaderSx}>Level</TableCell>
                                            <TableCell sx={tableHeaderSx} align="right">Actual</TableCell>
                                            <TableCell sx={tableHeaderSx} align="right">Annual Target</TableCell>
                                            <TableCell sx={tableHeaderSx} align="right">Remaining</TableCell>
                                            <TableCell sx={tableHeaderSx} align="right">Needed Now</TableCell>
                                            <TableCell sx={tableHeaderSx}>Reach</TableCell>
                                            <TableCell sx={tableHeaderSx}>Check</TableCell>
                                            <TableCell sx={tableHeaderSx}>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedRows.map((row, index) => {
                                            const rowNumber = page * rowsPerPage + index + 1;
                                            const progressValue = Math.min(Math.max(row.reachPercent, 0), 100);

                                            return (
                                                <TableRow key={row.memberId} hover>
                                                    <TableCell>{rowNumber}</TableCell>
                                                    <TableCell>
                                                        <Stack spacing={0.25}>
                                                            <Typography variant="body2" fontWeight={800}>
                                                                {row.memberNo}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {row.memberName}
                                                            </Typography>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={row.level} size="small" color={row.levelColor} variant="outlined" />
                                                    </TableCell>
                                                    <TableCell align="right">{formatCurrency(row.actualFormAmount)}</TableCell>
                                                    <TableCell align="right">{formatCurrency(row.annualTargetAmount)}</TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" color={row.remainingToTargetAmount > 0 ? "warning.main" : "success.main"} fontWeight={700}>
                                                            {row.remainingToTargetAmount > 0 ? formatCurrency(row.remainingToTargetAmount) : "Met"}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">{formatCurrency(row.nextRequiredAmount)}</TableCell>
                                                    <TableCell>
                                                        <Stack spacing={0.65} sx={{ minWidth: 150 }}>
                                                            <Stack direction="row" justifyContent="space-between" spacing={1}>
                                                                <Typography variant="caption" color="text.secondary">{percentLabel(row.reachPercent)}</Typography>
                                                                <Typography variant="caption" color={row.remainingPercent >= 0 ? "success.main" : "text.secondary"}>
                                                                    {percentLabel(row.remainingPercent)}
                                                                </Typography>
                                                            </Stack>
                                                            <LinearProgress variant="determinate" value={progressValue} sx={{ height: 7, borderRadius: 999 }} />
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={row.matchesDetail ? "Matched" : "Variance"}
                                                            size="small"
                                                            color={row.matchesDetail ? "success" : "warning"}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button size="small" variant="text" onClick={() => navigate(`/members/${row.memberId}`)}>
                                                            Open
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                component="div"
                                count={filteredRows.length}
                                page={page}
                                rowsPerPage={rowsPerPage}
                                rowsPerPageOptions={rowsPerPageOptions}
                                onPageChange={(_, nextPage) => setPage(nextPage)}
                                onRowsPerPageChange={(event) => {
                                    setRowsPerPage(Number(event.target.value));
                                    setPage(0);
                                }}
                            />
                        </Box>
                    )}
                </CardContent>
            </MotionCard>
        </Stack>
    );
}
