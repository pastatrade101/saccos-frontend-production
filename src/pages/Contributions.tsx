import { MotionCard } from "../ui/motion";
import {
    Alert,
    Box,
    Button,
    CardContent,
    Chip,
    FormControl,
    Grid,
    InputLabel,
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

import { useAuth } from "../auth/AuthContext";
import { AppLoader } from "../components/AppLoader";
import { ChartPanel } from "../components/ChartPanel";
import { api, getApiErrorMessage } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import type { Member, MemberAccount, StatementRow } from "../types/api";
import { formatCurrency, formatDate } from "../utils/format";

const PAGE_LOAD_LIMIT = 100;
const MAX_PAGE_LOADS = 100;
const sharePageSizeOptions = [10, 25, 50, 100];
const activityPageSizeOptions = [10, 25, 50, 100];

type AccountStatusFilter = "all" | MemberAccount["status"];
type ActivityTypeFilter = "all" | "share_contribution" | "dividend_allocation";

interface PagedApiEnvelope<T> {
    data: T[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
    } | null;
}

function monthKey(value: string) {
    return value.slice(0, 7);
}

function normalizeSearch(value: string) {
    return value.trim().toLowerCase();
}

function shareCapitalBalance(account: MemberAccount) {
    return Number(account.available_balance || 0) + Number(account.locked_balance || 0);
}

function activityDate(value: StatementRow) {
    return value.transaction_date?.slice(0, 10) || "";
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

export function ContributionsPage() {
    const theme = useTheme();
    const { selectedTenantId, profile } = useAuth();
    const [members, setMembers] = useState<Member[]>([]);
    const [shareAccounts, setShareAccounts] = useState<MemberAccount[]>([]);
    const [transactions, setTransactions] = useState<StatementRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [shareSearch, setShareSearch] = useState("");
    const [shareStatus, setShareStatus] = useState<AccountStatusFilter>("all");
    const [sharePage, setSharePage] = useState(0);
    const [shareRowsPerPage, setShareRowsPerPage] = useState(25);
    const [activitySearch, setActivitySearch] = useState("");
    const [activityType, setActivityType] = useState<ActivityTypeFilter>("all");
    const [activityFromDate, setActivityFromDate] = useState("");
    const [activityToDate, setActivityToDate] = useState("");
    const [activityPage, setActivityPage] = useState(0);
    const [activityRowsPerPage, setActivityRowsPerPage] = useState(25);

    useEffect(() => {
        const loadData = async () => {
            if (!selectedTenantId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const [visibleMembers, visibleAccounts, statementRows] = await Promise.all([
                    loadAllPages<Member>(endpoints.members.list(), {
                        tenant_id: selectedTenantId,
                        fields: "lookup",
                        include_total: false
                    }),
                    loadAllPages<MemberAccount>(endpoints.members.accounts(), {
                        tenant_id: selectedTenantId,
                        product_type: "shares",
                        include_total: false
                    }),
                    loadAllPages<StatementRow>(endpoints.finance.statements(), {
                        tenant_id: selectedTenantId
                    })
                ]);

                const visibleMemberIds = new Set(visibleMembers.map((member) => member.id));
                const shareAccountRows = visibleAccounts
                    .filter((account) => account.product_type === "shares" && visibleMemberIds.has(account.member_id))
                    .sort((left, right) => {
                        const leftMember = visibleMembers.find((member) => member.id === left.member_id)?.member_no || "";
                        const rightMember = visibleMembers.find((member) => member.id === right.member_id)?.member_no || "";
                        return leftMember.localeCompare(rightMember) || left.account_number.localeCompare(right.account_number);
                    });
                const visibleAccountIds = new Set(shareAccountRows.map((account) => account.id));
                const contributionRows = statementRows
                    .filter((entry) =>
                        visibleMemberIds.has(entry.member_id) &&
                        visibleAccountIds.has(entry.account_id) &&
                        ["share_contribution", "dividend_allocation"].includes(entry.transaction_type)
                    )
                    .sort((left, right) =>
                        activityDate(right).localeCompare(activityDate(left)) ||
                        (right.created_at || "").localeCompare(left.created_at || "")
                    );

                setMembers(visibleMembers);
                setShareAccounts(shareAccountRows);
                setTransactions(contributionRows);
            } catch (loadError) {
                setError(getApiErrorMessage(loadError));
            } finally {
                setLoading(false);
            }
        };

        void loadData();
    }, [selectedTenantId]);

    useEffect(() => {
        setSharePage(0);
    }, [shareSearch, shareStatus, shareRowsPerPage]);

    useEffect(() => {
        setActivityPage(0);
    }, [activitySearch, activityType, activityFromDate, activityToDate, activityRowsPerPage]);

    const memberById = useMemo(
        () => new Map(members.map((member) => [member.id, member])),
        [members]
    );

    const activityStatsByAccountId = useMemo(() => {
        const stats = new Map<string, {
            contributions: number;
            dividends: number;
            count: number;
            lastDate: string | null;
        }>();

        transactions.forEach((entry) => {
            const current = stats.get(entry.account_id) || {
                contributions: 0,
                dividends: 0,
                count: 0,
                lastDate: null
            };

            if (entry.transaction_type === "share_contribution") {
                current.contributions += Number(entry.amount || 0);
            }

            if (entry.transaction_type === "dividend_allocation") {
                current.dividends += Number(entry.amount || 0);
            }

            current.count += 1;
            if (!current.lastDate || activityDate(entry) > current.lastDate) {
                current.lastDate = activityDate(entry);
            }

            stats.set(entry.account_id, current);
        });

        return stats;
    }, [transactions]);

    const metrics = useMemo(() => {
        const contributionRows = transactions.filter((entry) => entry.transaction_type === "share_contribution");
        const dividendRows = transactions.filter((entry) => entry.transaction_type === "dividend_allocation");
        const activeContributorIds = new Set(contributionRows.map((entry) => entry.member_id));
        const monthSeries = new Map<string, { contributions: number; dividends: number }>();

        transactions.forEach((entry) => {
            const key = monthKey(entry.transaction_date);
            const point = monthSeries.get(key) || { contributions: 0, dividends: 0 };

            if (entry.transaction_type === "share_contribution") {
                point.contributions += Number(entry.amount || 0);
            }

            if (entry.transaction_type === "dividend_allocation") {
                point.dividends += Number(entry.amount || 0);
            }

            monthSeries.set(key, point);
        });

        const orderedSeries = [...monthSeries.entries()]
            .sort(([left], [right]) => left.localeCompare(right))
            .slice(-6);

        return {
            totalShareCapital: shareAccounts.reduce((sum, account) => sum + shareCapitalBalance(account), 0),
            totalContributions: contributionRows.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
            totalDividends: dividendRows.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
            activeContributors: activeContributorIds.size,
            series: orderedSeries
        };
    }, [shareAccounts, transactions]);

    const filteredShareAccounts = useMemo(() => {
        const search = normalizeSearch(shareSearch);

        return shareAccounts.filter((account) => {
            const member = memberById.get(account.member_id);
            const searchable = [
                account.account_number,
                account.account_name,
                member?.member_no,
                member?.full_name,
                member?.phone
            ].filter(Boolean).join(" ").toLowerCase();
            const matchesSearch = !search || searchable.includes(search);
            const matchesStatus = shareStatus === "all" || account.status === shareStatus;

            return matchesSearch && matchesStatus;
        });
    }, [memberById, shareAccounts, shareSearch, shareStatus]);

    const paginatedShareAccounts = useMemo(
        () => filteredShareAccounts.slice(sharePage * shareRowsPerPage, sharePage * shareRowsPerPage + shareRowsPerPage),
        [filteredShareAccounts, sharePage, shareRowsPerPage]
    );

    const filteredTransactions = useMemo(() => {
        const search = normalizeSearch(activitySearch);

        return transactions.filter((entry) => {
            const member = memberById.get(entry.member_id);
            const date = activityDate(entry);
            const searchable = [
                entry.member_name,
                member?.member_no,
                entry.account_number,
                entry.reference,
                entry.transaction_type
            ].filter(Boolean).join(" ").toLowerCase();
            const matchesSearch = !search || searchable.includes(search);
            const matchesType = activityType === "all" || entry.transaction_type === activityType;
            const matchesFromDate = !activityFromDate || date >= activityFromDate;
            const matchesToDate = !activityToDate || date <= activityToDate;

            return matchesSearch && matchesType && matchesFromDate && matchesToDate;
        });
    }, [activityFromDate, activitySearch, activityToDate, activityType, memberById, transactions]);

    const paginatedTransactions = useMemo(
        () => filteredTransactions.slice(activityPage * activityRowsPerPage, activityPage * activityRowsPerPage + activityRowsPerPage),
        [activityPage, activityRowsPerPage, filteredTransactions]
    );

    const filteredActivityAmount = useMemo(
        () => filteredTransactions.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
        [filteredTransactions]
    );

    const tableHeaderSx = {
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        fontSize: 11,
        color: theme.palette.primary.main,
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.14 : 0.08)
    };

    const clearShareFilters = () => {
        setShareSearch("");
        setShareStatus("all");
    };

    const clearActivityFilters = () => {
        setActivitySearch("");
        setActivityType("all");
        setActivityFromDate("");
        setActivityToDate("");
    };

    return (
        <Stack spacing={3}>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 3 }}>
                    <MotionCard variant="outlined" sx={{ height: "100%" }}>
                        <CardContent>
                            <Typography variant="overline" color="text.secondary">Share Capital Base</Typography>
                            <Typography variant="h4" sx={{ mt: 1 }}>{formatCurrency(metrics.totalShareCapital)}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Total available plus locked share balance visible to {profile?.role === "branch_manager" ? "this branch" : "this workspace"}.
                            </Typography>
                        </CardContent>
                    </MotionCard>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <MotionCard variant="outlined" sx={{ height: "100%" }}>
                        <CardContent>
                            <Typography variant="overline" color="text.secondary">Contributions Posted</Typography>
                            <Typography variant="h4" sx={{ mt: 1 }}>{formatCurrency(metrics.totalContributions)}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Direct member share subscriptions in the loaded ledger history.
                            </Typography>
                        </CardContent>
                    </MotionCard>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <MotionCard variant="outlined" sx={{ height: "100%" }}>
                        <CardContent>
                            <Typography variant="overline" color="text.secondary">Dividends Reinvested</Typography>
                            <Typography variant="h4" sx={{ mt: 1 }}>{formatCurrency(metrics.totalDividends)}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Approved dividends credited back into share capital.
                            </Typography>
                        </CardContent>
                    </MotionCard>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <MotionCard variant="outlined" sx={{ height: "100%" }}>
                        <CardContent>
                            <Typography variant="overline" color="text.secondary">Active Contributors</Typography>
                            <Typography variant="h4" sx={{ mt: 1 }}>{metrics.activeContributors}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Members with direct share contributions in the visible history.
                            </Typography>
                        </CardContent>
                    </MotionCard>
                </Grid>
            </Grid>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <ChartPanel
                        title="Share Capital Trend"
                        subtitle="Monthly contributions versus dividend credits."
                        data={{
                            labels: metrics.series.map(([label]) => label),
                            datasets: [
                                {
                                    label: "Contributions",
                                    data: metrics.series.map(([, point]) => point.contributions),
                                    borderColor: theme.palette.primary.main,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.18),
                                    fill: true
                                },
                                {
                                    label: "Dividends",
                                    data: metrics.series.map(([, point]) => point.dividends),
                                    borderColor: theme.palette.success.main,
                                    backgroundColor: alpha(theme.palette.success.main, 0.18),
                                    fill: true
                                }
                            ]
                        }}
                        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }}
                    />
                </Grid>
                <Grid size={{ xs: 12, lg: 4 }}>
                    <MotionCard variant="outlined" sx={{ height: "100%" }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Contribution Oversight</Typography>
                            <Stack spacing={1.5}>
                                <Alert severity="info" variant="outlined">
                                    This page is read-only and now loads all visible account and statement pages before calculating totals.
                                </Alert>
                                <Alert severity="success" variant="outlined">
                                    Share account balances include locked balances so capital totals match the member portal and dashboard.
                                </Alert>
                                <Alert severity="warning" variant="outlined">
                                    Direct contributions and reinvested dividends remain separated in the activity table.
                                </Alert>
                            </Stack>
                        </CardContent>
                    </MotionCard>
                </Grid>
            </Grid>

            <MotionCard variant="outlined">
                <CardContent sx={{ display: "grid", gap: 2 }}>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={1.5}>
                        <Box>
                            <Typography variant="h6">Share Accounts</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                Numbered member share accounts with balances and latest share-ledger activity.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip label={`${filteredShareAccounts.length} of ${shareAccounts.length} accounts`} size="small" color="primary" variant="outlined" />
                            <Chip label={formatCurrency(filteredShareAccounts.reduce((sum, account) => sum + shareCapitalBalance(account), 0))} size="small" variant="outlined" />
                        </Stack>
                    </Stack>

                    <Grid container spacing={1.5} alignItems="center">
                        <Grid size={{ xs: 12, md: 7 }}>
                            <TextField
                                label="Search share accounts"
                                placeholder="Member name, member number, phone, or account number"
                                value={shareSearch}
                                onChange={(event) => setShareSearch(event.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    label="Status"
                                    value={shareStatus}
                                    onChange={(event) => setShareStatus(event.target.value as AccountStatusFilter)}
                                >
                                    <MenuItem value="all">All statuses</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="dormant">Dormant</MenuItem>
                                    <MenuItem value="closed">Closed</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <Button variant="outlined" fullWidth onClick={clearShareFilters}>
                                Clear
                            </Button>
                        </Grid>
                    </Grid>

                    {loading ? (
                        <AppLoader fullscreen={false} minHeight={240} message="Loading share accounts..." />
                    ) : !filteredShareAccounts.length ? (
                        <Alert severity="info" variant="outlined">
                            No share accounts match the current filters.
                        </Alert>
                    ) : (
                        <Box>
                            <TableContainer sx={{ maxHeight: 560, overflowX: "auto" }}>
                                <Table size="small" stickyHeader sx={{ minWidth: 1040 }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={tableHeaderSx}>No.</TableCell>
                                            <TableCell sx={tableHeaderSx}>Member</TableCell>
                                            <TableCell sx={tableHeaderSx}>Account</TableCell>
                                            <TableCell sx={tableHeaderSx}>Status</TableCell>
                                            <TableCell sx={tableHeaderSx} align="right">Share Capital</TableCell>
                                            <TableCell sx={tableHeaderSx} align="right">Available</TableCell>
                                            <TableCell sx={tableHeaderSx} align="right">Locked</TableCell>
                                            <TableCell sx={tableHeaderSx} align="right">Direct Contributions</TableCell>
                                            <TableCell sx={tableHeaderSx}>Last Activity</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedShareAccounts.map((account, index) => {
                                            const member = memberById.get(account.member_id);
                                            const stats = activityStatsByAccountId.get(account.id);
                                            const rowNumber = sharePage * shareRowsPerPage + index + 1;

                                            return (
                                                <TableRow key={account.id} hover>
                                                    <TableCell>{rowNumber}</TableCell>
                                                    <TableCell>
                                                        <Stack spacing={0.25}>
                                                            <Typography variant="body2" fontWeight={700}>
                                                                {member?.full_name || "Unknown member"}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {member?.member_no || "No member number"}
                                                            </Typography>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Stack spacing={0.25}>
                                                            <Typography variant="body2" fontWeight={700}>
                                                                {account.account_number}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {account.account_name || "Share Capital"}
                                                            </Typography>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            size="small"
                                                            label={account.status}
                                                            color={account.status === "active" ? "success" : "default"}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" fontWeight={800}>
                                                            {formatCurrency(shareCapitalBalance(account))}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">{formatCurrency(account.available_balance)}</TableCell>
                                                    <TableCell align="right">{formatCurrency(account.locked_balance)}</TableCell>
                                                    <TableCell align="right">{formatCurrency(stats?.contributions || 0)}</TableCell>
                                                    <TableCell>{stats?.lastDate ? formatDate(stats.lastDate) : "N/A"}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                component="div"
                                count={filteredShareAccounts.length}
                                page={sharePage}
                                rowsPerPage={shareRowsPerPage}
                                rowsPerPageOptions={sharePageSizeOptions}
                                onPageChange={(_, nextPage) => setSharePage(nextPage)}
                                onRowsPerPageChange={(event) => {
                                    setShareRowsPerPage(Number(event.target.value));
                                    setSharePage(0);
                                }}
                            />
                        </Box>
                    )}
                </CardContent>
            </MotionCard>

            <MotionCard variant="outlined">
                <CardContent sx={{ display: "grid", gap: 2 }}>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={1.5}>
                        <Box>
                            <Typography variant="h6">Contribution Activity</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                Filtered share-ledger entries for direct member contributions and reinvested dividends.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip label={`${filteredTransactions.length} of ${transactions.length} entries`} size="small" color="primary" variant="outlined" />
                            <Chip label={formatCurrency(filteredActivityAmount)} size="small" variant="outlined" />
                        </Stack>
                    </Stack>

                    <Grid container spacing={1.5} alignItems="center">
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                label="Search activity"
                                placeholder="Member, member number, account, reference"
                                value={activitySearch}
                                onChange={(event) => setActivitySearch(event.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    label="Type"
                                    value={activityType}
                                    onChange={(event) => setActivityType(event.target.value as ActivityTypeFilter)}
                                >
                                    <MenuItem value="all">All activity</MenuItem>
                                    <MenuItem value="share_contribution">Contributions</MenuItem>
                                    <MenuItem value="dividend_allocation">Dividends</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <TextField
                                label="From"
                                type="date"
                                value={activityFromDate}
                                onChange={(event) => setActivityFromDate(event.target.value)}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <TextField
                                label="To"
                                type="date"
                                value={activityToDate}
                                onChange={(event) => setActivityToDate(event.target.value)}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <Button variant="outlined" fullWidth onClick={clearActivityFilters}>
                                Clear
                            </Button>
                        </Grid>
                    </Grid>

                    {loading ? (
                        <AppLoader fullscreen={false} minHeight={240} message="Loading contribution history..." />
                    ) : !filteredTransactions.length ? (
                        <Alert severity="info" variant="outlined">
                            No contribution activity matches the current filters.
                        </Alert>
                    ) : (
                        <Box>
                            <TableContainer sx={{ maxHeight: 600, overflowX: "auto" }}>
                                <Table size="small" stickyHeader sx={{ minWidth: 1120 }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={tableHeaderSx}>No.</TableCell>
                                            <TableCell sx={tableHeaderSx}>Date</TableCell>
                                            <TableCell sx={tableHeaderSx}>Member</TableCell>
                                            <TableCell sx={tableHeaderSx}>Account</TableCell>
                                            <TableCell sx={tableHeaderSx}>Type</TableCell>
                                            <TableCell sx={tableHeaderSx} align="right">Amount</TableCell>
                                            <TableCell sx={tableHeaderSx} align="right">Running Balance</TableCell>
                                            <TableCell sx={tableHeaderSx}>Reference</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedTransactions.map((row, index) => {
                                            const member = memberById.get(row.member_id);
                                            const rowNumber = activityPage * activityRowsPerPage + index + 1;
                                            const isContribution = row.transaction_type === "share_contribution";

                                            return (
                                                <TableRow key={`${row.transaction_id}-${index}`} hover>
                                                    <TableCell>{rowNumber}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {formatDate(row.transaction_date)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Stack spacing={0.25}>
                                                            <Typography variant="body2" fontWeight={700}>
                                                                {row.member_name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {member?.member_no || "No member number"}
                                                            </Typography>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>{row.account_number}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            size="small"
                                                            label={isContribution ? "Contribution" : "Dividend"}
                                                            color={isContribution ? "primary" : "success"}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" fontWeight={800}>
                                                            {formatCurrency(row.amount)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">{formatCurrency(row.running_balance)}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.secondary" noWrap>
                                                            {row.reference || "N/A"}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                component="div"
                                count={filteredTransactions.length}
                                page={activityPage}
                                rowsPerPage={activityRowsPerPage}
                                rowsPerPageOptions={activityPageSizeOptions}
                                onPageChange={(_, nextPage) => setActivityPage(nextPage)}
                                onRowsPerPageChange={(event) => {
                                    setActivityRowsPerPage(Number(event.target.value));
                                    setActivityPage(0);
                                }}
                            />
                        </Box>
                    )}
                </CardContent>
            </MotionCard>
        </Stack>
    );
}
