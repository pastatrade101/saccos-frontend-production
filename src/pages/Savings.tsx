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
const accountPageSizeOptions = [10, 25, 50, 100];
const activityPageSizeOptions = [10, 25, 50, 100];

type AccountStatusFilter = "all" | MemberAccount["status"];
type ActivityTypeFilter = "all" | "deposit" | "withdrawal";

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

function savingsBalance(account: MemberAccount) {
    return Number(account.available_balance || 0) + Number(account.locked_balance || 0);
}

function activityDate(value: StatementRow) {
    return value.transaction_date?.slice(0, 10) || "";
}

function isWithdrawal(row: StatementRow) {
    return row.transaction_type === "withdrawal" || row.transaction_type === "withdraw";
}

function isSavingsActivity(row: StatementRow) {
    return row.transaction_type === "deposit" || isWithdrawal(row);
}

async function loadAllPages<T>(url: string, params: Record<string, string | number | undefined>) {
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
        if (!response.pagination || pageRows.length === 0 || (total > 0 && rows.length >= total)) {
            break;
        }
    }

    return rows;
}

export function SavingsPage() {
    const theme = useTheme();
    const { selectedTenantId, profile } = useAuth();
    const [members, setMembers] = useState<Member[]>([]);
    const [savingsAccounts, setSavingsAccounts] = useState<MemberAccount[]>([]);
    const [transactions, setTransactions] = useState<StatementRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [accountSearch, setAccountSearch] = useState("");
    const [accountStatus, setAccountStatus] = useState<AccountStatusFilter>("all");
    const [accountPage, setAccountPage] = useState(0);
    const [accountRowsPerPage, setAccountRowsPerPage] = useState(25);
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
                        tenant_id: selectedTenantId
                    }),
                    loadAllPages<MemberAccount>(endpoints.members.accounts(), {
                        tenant_id: selectedTenantId,
                        product_type: "savings"
                    }),
                    loadAllPages<StatementRow>(endpoints.finance.statements(), {
                        tenant_id: selectedTenantId
                    })
                ]);

                const visibleMemberIds = new Set(visibleMembers.map((member) => member.id));
                const accountRows = visibleAccounts
                    .filter((account) => account.product_type === "savings" && visibleMemberIds.has(account.member_id))
                    .sort((left, right) => {
                        const leftMember = visibleMembers.find((member) => member.id === left.member_id)?.member_no || "";
                        const rightMember = visibleMembers.find((member) => member.id === right.member_id)?.member_no || "";
                        return leftMember.localeCompare(rightMember) || left.account_number.localeCompare(right.account_number);
                    });
                const visibleAccountIds = new Set(accountRows.map((account) => account.id));
                const savingsRows = statementRows
                    .filter((entry) =>
                        visibleMemberIds.has(entry.member_id) &&
                        visibleAccountIds.has(entry.account_id) &&
                        isSavingsActivity(entry)
                    )
                    .sort((left, right) =>
                        activityDate(right).localeCompare(activityDate(left)) ||
                        (right.created_at || "").localeCompare(left.created_at || "")
                    );

                setMembers(visibleMembers);
                setSavingsAccounts(accountRows);
                setTransactions(savingsRows);
            } catch (loadError) {
                setError(getApiErrorMessage(loadError));
            } finally {
                setLoading(false);
            }
        };

        void loadData();
    }, [selectedTenantId]);

    useEffect(() => {
        setAccountPage(0);
    }, [accountSearch, accountStatus, accountRowsPerPage]);

    useEffect(() => {
        setActivityPage(0);
    }, [activitySearch, activityType, activityFromDate, activityToDate, activityRowsPerPage]);

    const memberById = useMemo(
        () => new Map(members.map((member) => [member.id, member])),
        [members]
    );

    const activityStatsByAccountId = useMemo(() => {
        const stats = new Map<string, {
            deposits: number;
            withdrawals: number;
            count: number;
            lastDate: string | null;
        }>();

        transactions.forEach((entry) => {
            const current = stats.get(entry.account_id) || {
                deposits: 0,
                withdrawals: 0,
                count: 0,
                lastDate: null
            };

            if (entry.transaction_type === "deposit") {
                current.deposits += Number(entry.amount || 0);
            }

            if (isWithdrawal(entry)) {
                current.withdrawals += Number(entry.amount || 0);
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
        const depositRows = transactions.filter((entry) => entry.transaction_type === "deposit");
        const withdrawalRows = transactions.filter(isWithdrawal);
        const activeSaverIds = new Set(depositRows.map((entry) => entry.member_id));
        const monthSeries = new Map<string, { deposits: number; withdrawals: number }>();

        transactions.forEach((entry) => {
            const key = monthKey(entry.transaction_date);
            const point = monthSeries.get(key) || { deposits: 0, withdrawals: 0 };

            if (entry.transaction_type === "deposit") {
                point.deposits += Number(entry.amount || 0);
            }

            if (isWithdrawal(entry)) {
                point.withdrawals += Number(entry.amount || 0);
            }

            monthSeries.set(key, point);
        });

        const orderedSeries = [...monthSeries.entries()]
            .sort(([left], [right]) => left.localeCompare(right))
            .slice(-6);

        return {
            totalSavingsBalance: savingsAccounts.reduce((sum, account) => sum + savingsBalance(account), 0),
            totalAvailable: savingsAccounts.reduce((sum, account) => sum + Number(account.available_balance || 0), 0),
            totalLocked: savingsAccounts.reduce((sum, account) => sum + Number(account.locked_balance || 0), 0),
            totalDeposits: depositRows.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
            totalWithdrawals: withdrawalRows.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
            activeSavers: activeSaverIds.size,
            series: orderedSeries
        };
    }, [savingsAccounts, transactions]);

    const filteredAccounts = useMemo(() => {
        const search = normalizeSearch(accountSearch);

        return savingsAccounts.filter((account) => {
            const member = memberById.get(account.member_id);
            const searchable = [
                account.account_number,
                account.account_name,
                member?.member_no,
                member?.full_name,
                member?.phone
            ].filter(Boolean).join(" ").toLowerCase();
            const matchesSearch = !search || searchable.includes(search);
            const matchesStatus = accountStatus === "all" || account.status === accountStatus;

            return matchesSearch && matchesStatus;
        });
    }, [accountSearch, accountStatus, memberById, savingsAccounts]);

    const paginatedAccounts = useMemo(
        () => filteredAccounts.slice(accountPage * accountRowsPerPage, accountPage * accountRowsPerPage + accountRowsPerPage),
        [accountPage, accountRowsPerPage, filteredAccounts]
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
            const matchesType = activityType === "all" || (activityType === "withdrawal" ? isWithdrawal(entry) : entry.transaction_type === activityType);
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

    const clearAccountFilters = () => {
        setAccountSearch("");
        setAccountStatus("all");
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
                            <Typography variant="overline" color="text.secondary">Savings Balance</Typography>
                            <Typography variant="h4" sx={{ mt: 1 }}>{formatCurrency(metrics.totalSavingsBalance)}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Available plus locked balances across savings accounts visible to {profile?.role === "branch_manager" ? "this branch" : "this workspace"}.
                            </Typography>
                        </CardContent>
                    </MotionCard>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <MotionCard variant="outlined" sx={{ height: "100%" }}>
                        <CardContent>
                            <Typography variant="overline" color="text.secondary">Deposits Posted</Typography>
                            <Typography variant="h4" sx={{ mt: 1 }}>{formatCurrency(metrics.totalDeposits)}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Member cash deposited into savings accounts in the loaded ledger history.
                            </Typography>
                        </CardContent>
                    </MotionCard>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <MotionCard variant="outlined" sx={{ height: "100%" }}>
                        <CardContent>
                            <Typography variant="overline" color="text.secondary">Withdrawals Paid</Typography>
                            <Typography variant="h4" sx={{ mt: 1 }}>{formatCurrency(metrics.totalWithdrawals)}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Cash released from savings accounts in the loaded ledger history.
                            </Typography>
                        </CardContent>
                    </MotionCard>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <MotionCard variant="outlined" sx={{ height: "100%" }}>
                        <CardContent>
                            <Typography variant="overline" color="text.secondary">Active Savers</Typography>
                            <Typography variant="h4" sx={{ mt: 1 }}>{metrics.activeSavers}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Members with savings deposits in the visible history.
                            </Typography>
                        </CardContent>
                    </MotionCard>
                </Grid>
            </Grid>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <ChartPanel
                        title="Savings Movement Trend"
                        subtitle="Monthly deposits versus withdrawals."
                        data={{
                            labels: metrics.series.map(([label]) => label),
                            datasets: [
                                {
                                    label: "Deposits",
                                    data: metrics.series.map(([, point]) => point.deposits),
                                    borderColor: theme.palette.success.main,
                                    backgroundColor: alpha(theme.palette.success.main, 0.18),
                                    fill: true
                                },
                                {
                                    label: "Withdrawals",
                                    data: metrics.series.map(([, point]) => point.withdrawals),
                                    borderColor: theme.palette.error.main,
                                    backgroundColor: alpha(theme.palette.error.main, 0.18),
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
                            <Typography variant="h6" gutterBottom>Savings Oversight</Typography>
                            <Stack spacing={1.5}>
                                <Alert severity="info" variant="outlined">
                                    This page is read-only and loads all visible account and statement pages before calculating totals.
                                </Alert>
                                <Alert severity="success" variant="outlined">
                                    Savings balances include locked amounts so totals match the dashboard and member portal.
                                </Alert>
                                <Alert severity="warning" variant="outlined">
                                    Teller and finance teams still post deposits and withdrawals through cash-control workflows.
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
                            <Typography variant="h6">Savings Accounts</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                Numbered member savings accounts with available, locked, and total balances.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip label={`${filteredAccounts.length} of ${savingsAccounts.length} accounts`} size="small" color="primary" variant="outlined" />
                            <Chip label={`Total ${formatCurrency(filteredAccounts.reduce((sum, account) => sum + savingsBalance(account), 0))}`} size="small" variant="outlined" />
                            <Chip label={`Locked ${formatCurrency(metrics.totalLocked)}`} size="small" variant="outlined" />
                        </Stack>
                    </Stack>

                    <Grid container spacing={1.5} alignItems="center">
                        <Grid size={{ xs: 12, md: 7 }}>
                            <TextField
                                label="Search savings accounts"
                                placeholder="Member name, member number, phone, or account number"
                                value={accountSearch}
                                onChange={(event) => setAccountSearch(event.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    label="Status"
                                    value={accountStatus}
                                    onChange={(event) => setAccountStatus(event.target.value as AccountStatusFilter)}
                                >
                                    <MenuItem value="all">All statuses</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="dormant">Dormant</MenuItem>
                                    <MenuItem value="closed">Closed</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <Button variant="outlined" fullWidth onClick={clearAccountFilters}>
                                Clear
                            </Button>
                        </Grid>
                    </Grid>

                    {loading ? (
                        <AppLoader fullscreen={false} minHeight={240} message="Loading savings accounts..." />
                    ) : !filteredAccounts.length ? (
                        <Alert severity="info" variant="outlined">
                            No savings accounts match the current filters.
                        </Alert>
                    ) : (
                        <Box>
                            <TableContainer sx={{ maxHeight: 560, overflowX: "auto" }}>
                                <Table size="small" stickyHeader sx={{ minWidth: 1160 }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={tableHeaderSx}>No.</TableCell>
                                            <TableCell sx={tableHeaderSx}>Member</TableCell>
                                            <TableCell sx={tableHeaderSx}>Account</TableCell>
                                            <TableCell sx={tableHeaderSx}>Status</TableCell>
                                            <TableCell sx={tableHeaderSx} align="right">Savings Balance</TableCell>
                                            <TableCell sx={tableHeaderSx} align="right">Available</TableCell>
                                            <TableCell sx={tableHeaderSx} align="right">Locked</TableCell>
                                            <TableCell sx={tableHeaderSx} align="right">Deposits</TableCell>
                                            <TableCell sx={tableHeaderSx} align="right">Withdrawals</TableCell>
                                            <TableCell sx={tableHeaderSx}>Last Activity</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedAccounts.map((account, index) => {
                                            const member = memberById.get(account.member_id);
                                            const stats = activityStatsByAccountId.get(account.id);
                                            const rowNumber = accountPage * accountRowsPerPage + index + 1;

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
                                                                {account.account_name || "Savings"}
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
                                                            {formatCurrency(savingsBalance(account))}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">{formatCurrency(account.available_balance)}</TableCell>
                                                    <TableCell align="right">{formatCurrency(account.locked_balance)}</TableCell>
                                                    <TableCell align="right">{formatCurrency(stats?.deposits || 0)}</TableCell>
                                                    <TableCell align="right">{formatCurrency(stats?.withdrawals || 0)}</TableCell>
                                                    <TableCell>{stats?.lastDate ? formatDate(stats.lastDate) : "N/A"}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                component="div"
                                count={filteredAccounts.length}
                                page={accountPage}
                                rowsPerPage={accountRowsPerPage}
                                rowsPerPageOptions={accountPageSizeOptions}
                                onPageChange={(_, nextPage) => setAccountPage(nextPage)}
                                onRowsPerPageChange={(event) => {
                                    setAccountRowsPerPage(Number(event.target.value));
                                    setAccountPage(0);
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
                            <Typography variant="h6">Savings Activity</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                Filtered savings-ledger entries for deposits and withdrawals.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip label={`${filteredTransactions.length} of ${transactions.length} entries`} size="small" color="primary" variant="outlined" />
                            <Chip label={formatCurrency(filteredActivityAmount)} size="small" variant="outlined" />
                            <Chip label={`Available ${formatCurrency(metrics.totalAvailable)}`} size="small" variant="outlined" />
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
                                    <MenuItem value="deposit">Deposits</MenuItem>
                                    <MenuItem value="withdrawal">Withdrawals</MenuItem>
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
                        <AppLoader fullscreen={false} minHeight={240} message="Loading savings activity..." />
                    ) : !filteredTransactions.length ? (
                        <Alert severity="info" variant="outlined">
                            No savings activity matches the current filters.
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
                                            const withdrawal = isWithdrawal(row);

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
                                                            label={withdrawal ? "Withdrawal" : "Deposit"}
                                                            color={withdrawal ? "error" : "success"}
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
