import {
    Alert,
    Box,
    Button,
    CardContent,
    Chip,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from "@mui/material";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import PieChartRoundedIcon from "@mui/icons-material/PieChartRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import RequestQuoteRoundedIcon from "@mui/icons-material/RequestQuoteRounded";
import RuleRoundedIcon from "@mui/icons-material/RuleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { alpha, useTheme } from "@mui/material/styles";
import type { ChartData, ChartOptions } from "chart.js";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";

import { useAuth } from "../auth/AuthContext";
import { ChartPanel } from "../components/ChartPanel";
import { DashboardHero } from "../components/DashboardHero";
import { AlertsPanel } from "../components/teller/AlertsPanel";
import { CashFlowChart } from "../components/teller/CashFlowChart";
import { DistributionChart } from "../components/teller/DistributionChart";
import { KpiCard } from "../components/teller/KpiCard";
import { WaterfallCard } from "../components/teller/WaterfallCard";
import { DataTable, type Column } from "../components/DataTable";
import { crestGold } from "../theme/colors";
import { api, getApiErrorMessage } from "../lib/api";
import { cachedGet } from "../lib/apiCache";
import {
    endpoints,
    type BranchesListResponse,
    type ChargeRevenueSummaryResponse,
    type DailyCashSummaryResponse,
    type LoanApplicationsResponse,
    type LoanSchedulesResponse,
    type LoansResponse,
    type ManualDividendBatchesResponse,
    type MemberAccountsResponse,
    type MemberApplicationsResponse,
    type MembersResponse,
    type PlatformErrorRow,
    type PlatformInfrastructureMetrics,
    type PlatformInfrastructureMetricsResponse,
    type PlatformOperationsOverviewResponse,
    type PlatformSlowEndpointRow,
    type PlatformSystemMetrics,
    type PlatformTenantTrafficRow,
    type SaccoFinancialYearSettingsResponse,
    type SaccoPerformanceTargetSettingsResponse,
    type StatementsResponse,
    type TenantsListResponse,
    type UsersListResponse
} from "../lib/endpoints";
import { buildTellerDashboardData } from "../lib/tellerDashboard";
import { registerCharts } from "../lib/charts";
import type { Branch, ChargeRevenueSummary, DailyCashSummary, Loan, LoanApplication, LoanSchedule, ManualDividendBatch, Member, MemberAccount, MemberApplication, SaccoFinancialYearSettings, SaccoPerformanceTargetSettings, StaffAccessUser, StatementRow, Tenant } from "../types/api";
import { MotionCard, MotionListItem, MotionSection } from "../ui/motion";
import {
    DEFAULT_SACCO_FINANCIAL_YEAR_SETTINGS,
    type FinancialYearPeriod,
    normalizeSaccoFinancialYearSettings,
    resolveFinancialYearPeriod
} from "../utils/financialYear";
import {
    calculateMemberPerformanceTarget,
    DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS,
    normalizeSaccoPerformanceTargetSettings,
    resolvePerformanceTargetStatusId,
    type PerformanceTargetLevelColor,
    type PerformanceTargetStatusId
} from "../utils/performanceTarget";
import { formatCurrency, formatCurrencyCompact, formatDate, formatRole } from "../utils/format";

registerCharts();

interface DashboardState {
    members: Member[];
    memberAccounts: MemberAccount[];
    statements: StatementRow[];
    loans: Loan[];
    schedules: LoanSchedule[];
    loanApplications: LoanApplication[];
    memberApplications: MemberApplication[];
    staffUsers: StaffAccessUser[];
    revenueSummary: ChargeRevenueSummary | null;
    manualDividendBatches: ManualDividendBatch[];
    dailyCashSummary: DailyCashSummary[];
}

interface PlatformState {
    tenants: Tenant[];
    branches: Branch[];
    systemMetrics: PlatformSystemMetrics | null;
    tenantTraffic: PlatformTenantTrafficRow[];
    infrastructure: PlatformInfrastructureMetrics | null;
    errors: PlatformErrorRow[];
    slowEndpoints: PlatformSlowEndpointRow[];
}

interface RoleMetric {
    label: string;
    value: string;
    helper?: string;
}

interface BranchAlertItem {
    id: string;
    severity: "success" | "warning" | "error" | "info";
    title: string;
    description: string;
}

interface FollowUpItem {
    id: string;
    loanId: string;
    label: string;
    dueDate: string;
    principalDue: number;
    interestDue: number;
    severity: "critical" | "warning" | "normal";
    statusLabel: string;
}

interface OperationalQueueItem {
    id: string;
    label: string;
    count: number;
    helper: string;
    route: string;
    tone: "success" | "warning" | "error" | "info";
}

interface StaffPerformanceRow {
    userId: string;
    officerName: string;
    loansIssued: number;
    collectionRate: number;
    applicationsProcessed: number;
}

interface MemberPerformanceRow {
    memberId: string;
    memberName: string;
    memberNo: string;
    actualDetailAmount: number;
    actualFormAmount: number;
    matchesDetail: boolean;
    requiredAmount: number;
    annualTargetAmount: number;
    remainingAmount: number;
    reachPercent: number;
    remainingPercent: number;
    level: string;
    levelColor: PerformanceTargetLevelColor;
}

interface MemberPerformanceSummary {
    totalActualDetail: number;
    totalActualForm: number;
    totalAnnualTarget: number;
    totalRequiredAmount: number;
    totalRemainingAmount: number;
    matchedMembers: number;
    varianceMembers: number;
    reachedMembers: number;
    behindMembers: number;
    averageReachPercent: number;
}

type BranchActivityView = "chart" | "table";
type BranchActivityFilter = "all" | "deposits" | "withdrawals" | "loans" | "dividends" | "other";
type BranchActivityWindow = "7" | "30" | "year";
type BranchActivityCategory = Exclude<BranchActivityFilter, "all">;

interface BranchActivityDailyRow {
    date: string;
    deposits: number;
    withdrawals: number;
    loans: number;
    dividends: number;
    other: number;
    inflow: number;
    outflow: number;
    net: number;
    count: number;
}

const DASHBOARD_ACCOUNTS_PAGE_LIMIT = 100;
type TargetWatchFilter = "needs_action" | "no_activity" | "needs_top_up" | "building" | "on_track" | "target_met" | "variance" | "all";

function resolveTargetWatchStatus(row: MemberPerformanceRow, settings: SaccoPerformanceTargetSettings): PerformanceTargetStatusId {
    return resolvePerformanceTargetStatusId(row.reachPercent, row.actualFormAmount, settings);
}

function matchesTargetWatchFilter(row: MemberPerformanceRow, filter: TargetWatchFilter, settings: SaccoPerformanceTargetSettings) {
    const status = resolveTargetWatchStatus(row, settings);
    const onTrackPercent = settings.performance_target_on_track_percent;

    if (filter === "all") {
        return true;
    }

    if (filter === "variance") {
        return !row.matchesDetail;
    }

    if (filter === "needs_action") {
        return row.annualTargetAmount > 0 && row.reachPercent < onTrackPercent;
    }

    return status === filter;
}

function formatSignedCurrency(value: number) {
    if (value < 0) {
        return `(${formatCurrency(Math.abs(value))})`;
    }

    return formatCurrency(value);
}

function formatSignedCurrencyCompact(value: number) {
    if (value < 0) {
        return `(${formatCurrencyCompact(Math.abs(value))})`;
    }

    return formatCurrencyCompact(value);
}

function formatSignedPercent(value: number) {
    return `${Math.round(value)}%`;
}

async function loadDashboardMemberAccounts(tenantId: string) {
    const pageSize = 500;
    const fetchPage = (page: number) =>
        api.get<MemberAccountsResponse & { pagination?: { total?: number | null; limit: number; page: number } }>(
            endpoints.members.accounts(),
            { params: { tenant_id: tenantId, page, limit: pageSize, include_total: false } }
        );

    const accounts: MemberAccount[] = [];
    for (let page = 1; page <= 20; page += 1) {
        const response = await fetchPage(page);
        const rows = response.data.data || [];
        accounts.push(...rows);

        if (rows.length < pageSize) {
            break;
        }
    }

    return accounts;
}

// Paginate members so snapshot totals (count, savings actual, target, reach) cover
// the whole member base — a single limit:100 fetch silently dropped members beyond
// 100, making every dashboard total undercount.
async function loadDashboardMembers(tenantId: string) {
    const pageSize = 500;
    const fetchPage = (page: number) =>
        api.get<MembersResponse & { pagination?: { total?: number | null; limit: number; page: number } }>(endpoints.members.list(), {
            params: {
                tenant_id: tenantId,
                page,
                limit: pageSize,
                fields: "summary",
                include_total: false
            }
        });

    const members: Member[] = [];
    for (let page = 1; page <= 30; page += 1) {
        const response = await fetchPage(page);
        const rows = response.data.data || [];
        members.push(...rows);

        if (rows.length < pageSize) {
            break;
        }
    }

    return members;
}

// The dashboard only needs RECENT statements (7-day cash-flow chart + today's
// figures); member count and savings totals come from the paginated members/
// accounts. Statements are ordered newest-first, so cap to a few recent pages —
// loading every transaction (now thousands after history imports) made the
// dashboard take ages to load.
const DASHBOARD_STATEMENT_MAX_PAGES = 3;

// Revisiting the dashboard within this window serves cached data instantly and
// refreshes in the background (stale-while-revalidate), instead of re-running every
// paginated read from scratch on each visit.
const DASHBOARD_CACHE_TTL_MS = 60_000;

async function loadDashboardStatements(tenantId: string) {
    const statements: StatementRow[] = [];
    let page = 1;
    while (page <= DASHBOARD_STATEMENT_MAX_PAGES) {
        const { data } = await api.get<StatementsResponse & { pagination?: { total: number; limit: number; page: number } }>(endpoints.finance.statements(), {
            params: { tenant_id: tenantId, page, limit: DASHBOARD_ACCOUNTS_PAGE_LIMIT }
        });
        const rows = data.data || [];
        statements.push(...rows);
        if (data.pagination?.total && statements.length >= data.pagination.total) {
            break;
        }
        if (rows.length < DASHBOARD_ACCOUNTS_PAGE_LIMIT) {
            break;
        }
        page += 1;
    }
    return statements;
}

function groupAmountsByDate(statements: StatementRow[], direction?: "in" | "out") {
    const map = new Map<string, number>();

    statements.forEach((entry) => {
        if (direction && entry.direction !== direction) {
            return;
        }

        const key = entry.transaction_date;
        map.set(key, (map.get(key) || 0) + entry.amount);
    });

    return [...map.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-7);
}

function groupLoansByMonth(loans: Loan[]) {
    const map = new Map<string, number>();

    loans.forEach((loan) => {
        const key = loan.created_at.slice(0, 7);
        map.set(key, (map.get(key) || 0) + loan.principal_amount);
    });

    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-6);
}

function groupSchedulesByBucket(schedules: LoanSchedule[]) {
    const buckets = new Map<string, number>([
        ["Current", 0],
        ["Overdue", 0],
        ["Partial", 0]
    ]);

    schedules.forEach((schedule) => {
        if (schedule.status === "overdue") {
            buckets.set("Overdue", (buckets.get("Overdue") || 0) + 1);
        } else if (schedule.status === "partial") {
            buckets.set("Partial", (buckets.get("Partial") || 0) + 1);
        } else {
            buckets.set("Current", (buckets.get("Current") || 0) + 1);
        }
    });

    return [...buckets.entries()];
}

function calculateAgingSummary(schedules: LoanSchedule[]) {
    const today = new Date();
    const buckets = {
        current: 0,
        d1_30: 0,
        d31_60: 0,
        d60Plus: 0
    };

    let overdueAmount = 0;
    let totalAmount = 0;

    schedules.forEach((schedule) => {
        const pendingAmount = Math.max(schedule.principal_due - schedule.principal_paid, 0) + Math.max(schedule.interest_due - schedule.interest_paid, 0);
        if (pendingAmount <= 0) {
            return;
        }

        totalAmount += pendingAmount;
        const dueDate = new Date(schedule.due_date);
        const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysPastDue <= 0) {
            buckets.current += 1;
            return;
        }

        overdueAmount += pendingAmount;

        if (daysPastDue <= 30) {
            buckets.d1_30 += 1;
        } else if (daysPastDue <= 60) {
            buckets.d31_60 += 1;
        } else {
            buckets.d60Plus += 1;
        }
    });

    return {
        ...buckets,
        total: buckets.current + buckets.d1_30 + buckets.d31_60 + buckets.d60Plus,
        parPercent: totalAmount ? (overdueAmount / totalAmount) * 100 : 0
    };
}

type MetricTone = "primary" | "success" | "info" | "warning";

function resolveMetricVisual(label: string): { Icon: typeof GroupsRoundedIcon; tone: MetricTone } {
    const l = label.toLowerCase();
    if (/(member|user|workspace|people|staff|active)/.test(l)) {
        return { Icon: GroupsRoundedIcon, tone: "primary" };
    }
    if (/(saving|deposit|balance|wallet|cash|revenue|income)/.test(l)) {
        return { Icon: AccountBalanceWalletRoundedIcon, tone: "success" };
    }
    if (/(loan|portfolio|credit|disburse|outstanding)/.test(l)) {
        return { Icon: PaymentsRoundedIcon, tone: "info" };
    }
    if (/(par|overdue|risk|arrear|default|error|variance|signal)/.test(l)) {
        return { Icon: WarningAmberRoundedIcon, tone: "warning" };
    }
    if (/(branch|network|throughput|latency|sms)/.test(l)) {
        return { Icon: PieChartRoundedIcon, tone: "info" };
    }
    return { Icon: InsightsRoundedIcon, tone: "primary" };
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
    const theme = useTheme();
    const { Icon, tone } = resolveMetricVisual(label);
    const toneColor = theme.palette[tone].main;

    return (
        <MotionCard
            variant="outlined"
            inView
            interactive
            sx={{
                height: "100%",
                transition: "box-shadow .25s ease, border-color .25s ease",
                "&::before": {
                    content: "\"\"",
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background: `linear-gradient(180deg, ${toneColor}, ${alpha(toneColor, 0.35)})`
                },
                "&:hover": {
                    borderColor: alpha(toneColor, 0.5),
                    boxShadow: `0 16px 34px ${alpha(toneColor, 0.18)}`
                }
            }}
        >
            <CardContent sx={{ p: 1.75, pl: 2.25, "&:last-child": { pb: 1.75 } }}>
                <Box
                    sx={{
                        width: 34,
                        height: 34,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        color: toneColor,
                        background: `linear-gradient(135deg, ${alpha(toneColor, 0.18)}, ${alpha(toneColor, 0.05)})`,
                        border: `1px solid ${alpha(toneColor, 0.22)}`
                    }}
                >
                    <Icon fontSize="small" />
                </Box>
                <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ mt: 1.25, display: "block", fontWeight: 600, letterSpacing: "0.08em" }}
                >
                    {label}
                </Typography>
                <Typography
                    title={helper}
                    sx={{
                        mt: 0.25,
                        fontSize: "1.4rem",
                        fontWeight: 800,
                        lineHeight: 1.15,
                        letterSpacing: "-0.01em",
                        fontVariantNumeric: "tabular-nums",
                        overflowWrap: "anywhere"
                    }}
                >
                    {value}
                </Typography>
            </CardContent>
        </MotionCard>
    );
}

function RiskStripCard({
    label,
    value,
    helper,
    tone
}: {
    label: string;
    value: string;
    helper: string;
    tone: "green" | "yellow" | "red";
}) {
    const theme = useTheme();
    const toneStyles = tone === "red"
        ? { color: theme.palette.error.main, bg: alpha(theme.palette.error.main, 0.1), border: alpha(theme.palette.error.main, 0.22) }
        : tone === "yellow"
            ? { color: theme.palette.warning.main, bg: alpha(theme.palette.warning.main, 0.12), border: alpha(theme.palette.warning.main, 0.22) }
            : { color: theme.palette.success.main, bg: alpha(theme.palette.success.main, 0.1), border: alpha(theme.palette.success.main, 0.22) };

    return (
        <MotionCard variant="outlined" inView sx={{ height: "100%", borderColor: toneStyles.border, bgcolor: toneStyles.bg }}>
            <CardContent sx={{ p: 1.75 }}>
                <Typography variant="overline" color="text.secondary">
                    {label}
                </Typography>
                <Typography
                    variant="h5"
                    sx={{ mt: 0.25, color: toneStyles.color, fontSize: "1.4rem", fontWeight: 800, lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}
                >
                    {value}
                </Typography>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                >
                    {helper}
                </Typography>
            </CardContent>
        </MotionCard>
    );
}

function OperationalQueueCard({
    item,
    onOpen
}: {
    item: OperationalQueueItem;
    onOpen: (route: string) => void;
}) {
    const theme = useTheme();
    const color = item.tone === "error"
        ? "error"
        : item.tone === "warning"
            ? "warning"
            : item.tone === "success"
                ? "success"
                : theme.palette.mode === "dark"
                    ? "warning"
                    : "primary";

    return (
        <MotionListItem interactive variant="outlined" inView sx={{ p: 1.25, cursor: "pointer" }} onClick={() => onOpen(item.route)}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ width: "100%" }}>
                <Typography variant="subtitle2">{item.label}</Typography>
                <Chip label={String(item.count)} size="small" color={color} />
            </Stack>
        </MotionListItem>
    );
}

function BranchManagerTopCard({
    label,
    value,
    valueTooltip,
    helper,
    status,
    tone,
    icon,
    featured = false,
    footer
}: {
    label: string;
    value: string;
    valueTooltip?: string;
    helper: string;
    status: string;
    tone: "positive" | "negative" | "neutral";
    icon: ReactNode;
    featured?: boolean;
    footer?: ReactNode;
}) {
    const theme = useTheme();
    const neutralAccent = theme.palette.mode === "dark" ? "#D9B273" : theme.palette.primary.main;
    const toneMap = {
        positive: {
            main: theme.palette.success.main,
            soft: alpha(theme.palette.success.main, 0.12)
        },
        negative: {
            main: theme.palette.error.main,
            soft: alpha(theme.palette.error.main, 0.12)
        },
        neutral: {
            main: neutralAccent,
            soft: alpha(neutralAccent, 0.12)
        }
    }[tone];

    return (
        <MotionCard
            variant="outlined"
            inView
            sx={{
                height: "100%",
                position: "relative",
                overflow: "hidden",
                borderColor: alpha(toneMap.main, featured ? 0.28 : 0.18),
                background: featured
                    ? `linear-gradient(135deg, ${alpha(toneMap.main, 0.08)}, ${theme.palette.background.paper})`
                    : theme.palette.background.paper,
                boxShadow: featured ? `0 16px 34px ${alpha(toneMap.main, 0.08)}` : "none",
                transition: "box-shadow .25s ease, border-color .25s ease, transform .25s ease",
                "&::before": {
                    content: "\"\"",
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background: `linear-gradient(180deg, ${toneMap.main}, ${alpha(toneMap.main, 0.35)})`
                },
                "&:hover": {
                    borderColor: alpha(toneMap.main, 0.45),
                    boxShadow: `0 18px 36px ${alpha(toneMap.main, 0.16)}`,
                    transform: "translateY(-2px)"
                }
            }}
        >
            <CardContent sx={{ p: 1.75, pl: 2.25, display: "flex", flexDirection: "column" }}>
                <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                        <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.25 }}>
                            {label}
                        </Typography>
                        <Box
                            sx={{
                                width: 34,
                                height: 34,
                                borderRadius: 2,
                                bgcolor: toneMap.soft,
                                color: toneMap.main,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0
                            }}
                        >
                            {icon}
                        </Box>
                    </Stack>

                    <Typography
                        variant="h5"
                        title={valueTooltip}
                        sx={{
                            lineHeight: 1.15,
                            fontSize: featured ? "1.5rem" : "1.4rem",
                            fontWeight: 800,
                            letterSpacing: "-0.01em",
                            fontVariantNumeric: "tabular-nums",
                            overflowWrap: "anywhere",
                            wordBreak: "normal"
                        }}
                    >
                        {value}
                    </Typography>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5} sx={{ mt: 0.25 }}>
                        <Chip
                            label={status}
                            size="small"
                            variant="outlined"
                            sx={{
                                fontWeight: 700,
                                color: toneMap.main,
                                borderColor: alpha(toneMap.main, 0.2),
                                bgcolor: toneMap.soft
                            }}
                        />
                    </Stack>

                    {footer ? (
                        <Box sx={{ pt: 0.5 }}>
                            {footer}
                        </Box>
                    ) : null}
                </Stack>
            </CardContent>
        </MotionCard>
    );
}

function buildFollowUpItems(schedules: LoanSchedule[], labelByLoanId?: Map<string, string>) {
    const todayMs = Date.now();
    return schedules.slice(0, 6).map((schedule) => {
        const principalDue = Math.max(schedule.principal_due - schedule.principal_paid, 0);
        const interestDue = Math.max(schedule.interest_due - schedule.interest_paid, 0);
        const daysToDue = Math.floor((new Date(schedule.due_date).getTime() - todayMs) / (1000 * 60 * 60 * 24));

        // Classify by the actual due date vs today (and partial payment), not the raw
        // schedule.status — so a past date never reads as "Upcoming due".
        let severity: FollowUpItem["severity"] = "normal";
        let statusLabel = "Upcoming due";
        if (daysToDue < 0) {
            severity = "critical";
            statusLabel = `Overdue ${Math.abs(daysToDue)}d`;
        } else if (schedule.status === "partial") {
            severity = "warning";
            statusLabel = "Partially settled";
        } else if (daysToDue <= 7) {
            severity = "warning";
            statusLabel = daysToDue === 0 ? "Due today" : `Due in ${daysToDue}d`;
        }

        return {
            id: schedule.id,
            loanId: schedule.loan_id,
            label: labelByLoanId?.get(schedule.loan_id) || `Loan ${schedule.loan_id.slice(0, 8)}`,
            dueDate: schedule.due_date,
            principalDue,
            interestDue,
            severity,
            statusLabel
        } satisfies FollowUpItem;
    });
}

function FollowUpPanel({
    title,
    subtitle,
    items,
    onViewAll
}: {
    title: string;
    subtitle: string;
    items: FollowUpItem[];
    onViewAll: () => void;
}) {
    const criticalCount = items.filter((item) => item.severity === "critical").length;
    const warningCount = items.filter((item) => item.severity === "warning").length;
    const totalExposure = items.reduce((sum, item) => sum + item.principalDue + item.interestDue, 0);

    return (
        <MotionCard variant="outlined" inView sx={{ height: "100%" }}>
            <CardContent sx={{ height: "100%" }}>
                <Stack spacing={2.5} sx={{ height: "100%" }}>
                    <Box>
                        <Typography variant="h6">{title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {subtitle}
                        </Typography>
                    </Box>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip label={`${criticalCount} critical`} color={criticalCount ? "error" : "default"} variant="outlined" />
                            <Chip label={`${warningCount} watchlist`} color={warningCount ? "warning" : "default"} variant="outlined" />
                            <Chip label={`${formatCurrency(totalExposure)} exposed`} color="primary" variant="outlined" />
                        </Stack>
                        <Chip
                            label="View all"
                            color="primary"
                            variant="filled"
                            onClick={onViewAll}
                            sx={{ fontWeight: 700, cursor: "pointer" }}
                        />
                    </Stack>

                    {items.length ? (
                        <Stack spacing={1.25} divider={<Divider flexItem />}>
                            {items.map((item, index) => (
                                <MotionListItem
                                    key={item.id}
                                    index={index}
                                    interactive
                                    variant="outlined"
                                    sx={{
                                        p: 1.25,
                                        borderColor: "divider"
                                    }}
                                >
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        justifyContent="space-between"
                                        spacing={1.5}
                                    >
                                        <Stack spacing={0.5}>
                                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                    {item.label}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={item.statusLabel}
                                                    color={
                                                        item.severity === "critical"
                                                            ? "error"
                                                            : item.severity === "warning"
                                                                ? "warning"
                                                                : "success"
                                                    }
                                                    variant={item.severity === "normal" ? "outlined" : "filled"}
                                                />
                                            </Stack>
                                            <Typography variant="body2" color="text.secondary">
                                                Due {formatDate(item.dueDate)} with principal {formatCurrency(item.principalDue)} and interest {formatCurrency(item.interestDue)} pending.
                                            </Typography>
                                        </Stack>
                                        <Stack spacing={0.35} alignItems={{ xs: "flex-start", sm: "flex-end" }}>
                                            <Typography variant="subtitle2">{formatCurrency(item.principalDue + item.interestDue)}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Total outstanding
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </MotionListItem>
                            ))}
                        </Stack>
                    ) : (
                        <Box
                            sx={{
                                flex: 1,
                                display: "grid",
                                placeItems: "center",
                                minHeight: 220,
                                border: `1px dashed`,
                                borderColor: "divider",
                                borderRadius: 2
                            }}
                        >
                            <Stack spacing={0.75} alignItems="center">
                                <Typography variant="subtitle2">No follow-up pressure right now</Typography>
                                <Typography variant="body2" color="text.secondary" align="center">
                                    All visible schedules are current or there are no due loan items in scope.
                                </Typography>
                            </Stack>
                        </Box>
                    )}
                </Stack>
            </CardContent>
        </MotionCard>
    );
}

function StaffPerformancePanel({
    rows
}: {
    rows: StaffPerformanceRow[];
}) {
    return (
        <MotionCard variant="outlined" inView sx={{ height: "100%" }}>
            <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
                <Stack spacing={1.25}>
                    <Typography variant="h6">Staff Performance</Typography>
                    {rows.length ? (
                        <Stack spacing={1} divider={<Divider flexItem />}>
                            {rows.map((row, index) => (
                                <Stack key={row.userId} direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
                                    <Stack spacing={0.2}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                            {index + 1}. {row.officerName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {row.applicationsProcessed} applications processed
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Chip size="small" label={`${row.loansIssued} issued`} color="primary" />
                                        <Chip
                                            size="small"
                                            label={`${row.collectionRate.toFixed(0)}% collection`}
                                            color={row.collectionRate >= 85 ? "success" : row.collectionRate >= 65 ? "warning" : "error"}
                                        />
                                    </Stack>
                                </Stack>
                            ))}
                        </Stack>
                    ) : (
                        <Alert severity="info" variant="outlined">
                            No loan officer performance data is available yet.
                        </Alert>
                    )}
                </Stack>
            </CardContent>
        </MotionCard>
    );
}

function MemberPerformanceTargetPanel({
    rows,
    summary,
    financialYearPeriod
}: {
    rows: MemberPerformanceRow[];
    summary: MemberPerformanceSummary;
    financialYearPeriod: FinancialYearPeriod;
}) {
    const theme = useTheme();
    const cappedBranchProgress = Math.min(Math.max(summary.averageReachPercent, 0), 100);
    const reachHeader = `% Reach By ${financialYearPeriod.endLabel}`;
    const remainingHeader = `% Remaining By ${financialYearPeriod.endLabel}`;
    const columns: Column<MemberPerformanceRow>[] = [
        {
            key: "id",
            header: "ID",
            render: (row) => (
                <Stack spacing={0.25}>
                    <Typography variant="body2" fontWeight={800}>{row.memberNo}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.memberName}</Typography>
                </Stack>
            )
        },
        {
            key: "actual_detail",
            header: "Actual Detail",
            render: (row) => <Typography variant="body2" fontWeight={700}>{formatCurrency(row.actualDetailAmount)}</Typography>
        },
        {
            key: "actual_forms",
            header: "Actual From Forms",
            render: (row) => <Typography variant="body2" fontWeight={700}>{formatCurrency(row.actualFormAmount)}</Typography>
        },
        {
            key: "matches",
            header: "True/False",
            render: (row) => (
                <Chip
                    size="small"
                    label={row.matchesDetail ? "TRUE" : "FALSE"}
                    color={row.matchesDetail ? "success" : "warning"}
                    variant={row.matchesDetail ? "outlined" : "filled"}
                />
            )
        },
        {
            key: "required_amount",
            header: "Needed",
            render: (row) => formatCurrency(row.requiredAmount)
        },
        {
            key: "annual_target",
            header: "Annual Target",
            render: (row) => formatCurrency(row.annualTargetAmount)
        },
        {
            key: "remaining_amount",
            header: "Remaining Amount",
            render: (row) => (
                <Typography variant="body2" color={row.remainingAmount < 0 ? "warning.main" : "success.main"} fontWeight={700}>
                    {formatSignedCurrency(row.remainingAmount)}
                </Typography>
            )
        },
        {
            key: "reach",
            header: reachHeader,
            render: (row) => (
                <Stack spacing={0.75} sx={{ minWidth: 150 }}>
                    <Typography variant="caption" color="text.secondary">
                        {row.reachPercent.toFixed(0)}%
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(Math.max(row.reachPercent, 0), 100)}
                        sx={{
                            height: 8,
                            borderRadius: 999,
                            bgcolor: alpha(theme.palette.text.primary, 0.1),
                            "& .MuiLinearProgress-bar": {
                                bgcolor: row.reachPercent >= 100
                                    ? theme.palette.success.main
                                    : row.reachPercent >= 60
                                        ? theme.palette.info.main
                                        : row.reachPercent >= 40
                                            ? theme.palette.warning.main
                                            : theme.palette.error.main
                            }
                        }}
                    />
                </Stack>
            )
        },
        {
            key: "remaining_percent",
            header: remainingHeader,
            render: (row) => (
                <Typography variant="body2" color={row.remainingPercent < 0 ? "warning.main" : "success.main"} fontWeight={700}>
                    {formatSignedPercent(row.remainingPercent)}
                </Typography>
            )
        }
    ];

    return (
        <Stack spacing={2}>
            <MotionCard variant="outlined" inView>
                <CardContent>
                    <Stack spacing={2}>
                        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.5}>
                            <Box>
                                <Typography variant="h6">Performance Target</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Automatic branch view for the SACCO year from {financialYearPeriod.startLabel} to {financialYearPeriod.endLabel}.
                                </Typography>
                            </Box>
                            <Chip
                                label={`SACCO year ${financialYearPeriod.startLabel} - ${financialYearPeriod.endLabel}`}
                                color="primary"
                                variant="outlined"
                                sx={{ width: "fit-content" }}
                            />
                        </Stack>

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
                                gap: 1.25
                            }}
                        >
                            <Box sx={{ p: 1.35, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                                <Typography variant="caption" color="text.secondary">Average Reach</Typography>
                                <Typography variant="h6">{summary.averageReachPercent.toFixed(0)}%</Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={cappedBranchProgress}
                                    sx={{ mt: 0.75, height: 8, borderRadius: 999 }}
                                />
                            </Box>
                            <Box sx={{ p: 1.35, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                                <Typography variant="caption" color="text.secondary">Total Actual</Typography>
                                <Typography variant="h6">{formatCurrency(summary.totalActualForm)}</Typography>
                            </Box>
                            <Box sx={{ p: 1.35, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                                <Typography variant="caption" color="text.secondary">Total Annual Target</Typography>
                                <Typography variant="h6">
                                    {formatCurrency(summary.totalAnnualTarget)}
                                </Typography>
                            </Box>
                            <Box sx={{ p: 1.35, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                                <Typography variant="caption" color="text.secondary">Remaining Amount</Typography>
                                <Typography variant="h6" color={summary.totalRemainingAmount < 0 ? "warning.main" : "success.main"}>
                                    {formatSignedCurrency(summary.totalRemainingAmount)}
                                </Typography>
                            </Box>
                            <Box sx={{ p: 1.35, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                                <Typography variant="caption" color="text.secondary">Detail Validation</Typography>
                                <Typography variant="h6" color={summary.varianceMembers > 0 ? "warning.main" : "success.main"}>
                                    {summary.matchedMembers} true / {summary.varianceMembers} false
                                </Typography>
                            </Box>
                        </Box>
                    </Stack>
                </CardContent>
            </MotionCard>

            <DataTable
                rows={rows}
                columns={columns}
                emptyMessage="No active members are available for performance target tracking."
                maxHeight={520}
                stickyHeader
            />
        </Stack>
    );
}

function DashboardLoadingState() {
    // Mirror the real dashboard layout (header + 4 KPI cards + 2 charts) with
    // skeletons instead of a centered spinner, so the structure is visible while
    // the data loads and there's no jump when the real content replaces it.
    return (
        <Stack spacing={3}>
            <Skeleton variant="rounded" height={92} sx={{ borderRadius: 2 }} />
            <Grid container spacing={2}>
                {Array.from({ length: 4 }).map((_, index) => (
                    <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
                        <Skeleton variant="rounded" height={150} sx={{ borderRadius: 2 }} />
                    </Grid>
                ))}
            </Grid>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Skeleton variant="rounded" height={340} sx={{ borderRadius: 2 }} />
                </Grid>
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Skeleton variant="rounded" height={340} sx={{ borderRadius: 2 }} />
                </Grid>
            </Grid>
        </Stack>
    );
}

function BranchActivityPanel({
    statements,
    view,
    filter,
    window,
    onViewChange,
    onFilterChange,
    onWindowChange,
    title = "Recent Branch Activity",
    subtitle = "Daily branch movement from visible statements. Filter by posting type, switch the period, or inspect the same data as a table."
}: {
    statements: StatementRow[];
    view: BranchActivityView;
    filter: BranchActivityFilter;
    window: BranchActivityWindow;
    onViewChange: (value: BranchActivityView) => void;
    onFilterChange: (value: BranchActivityFilter) => void;
    onWindowChange: (value: BranchActivityWindow) => void;
    title?: string;
    subtitle?: string;
}) {
    const theme = useTheme();
    const windowedStatements = useMemo(
        () => filterBranchActivityByWindow(statements, window),
        [statements, window]
    );
    const visibleStatements = useMemo(
        () => filterBranchActivityByType(windowedStatements, filter)
            .slice()
            .sort((left, right) =>
                normalizeActivityDate(right.transaction_date).localeCompare(normalizeActivityDate(left.transaction_date))
                || (right.created_at || "").localeCompare(left.created_at || "")
            ),
        [filter, windowedStatements]
    );
    const dailyRows = useMemo(
        () => buildBranchActivityDailyRows(visibleStatements),
        [visibleStatements]
    );
    const activityTotals = useMemo(() => {
        const inflow = visibleStatements
            .filter((entry) => entry.direction === "in")
            .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
        const outflow = visibleStatements
            .filter((entry) => entry.direction === "out")
            .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

        return {
            inflow,
            outflow,
            net: inflow - outflow,
            count: visibleStatements.length
        };
    }, [visibleStatements]);

    const categoryMeta: Record<BranchActivityCategory, { label: string; color: string }> = {
        deposits: { label: "Deposits", color: theme.palette.primary.main },
        withdrawals: { label: "Withdrawals", color: theme.palette.error.main },
        loans: { label: "Loans", color: theme.palette.warning.main },
        dividends: { label: "Dividends", color: theme.palette.info.main },
        other: { label: "Other", color: theme.palette.text.secondary }
    };
    const categoryTotals = BRANCH_ACTIVITY_CATEGORIES.reduce<Record<BranchActivityCategory, number>>((totals, category) => {
        totals[category] = dailyRows.reduce((sum, row) => sum + row[category], 0);
        return totals;
    }, {
        deposits: 0,
        withdrawals: 0,
        loans: 0,
        dividends: 0,
        other: 0
    });
    const chartCategories = (filter === "all"
        ? BRANCH_ACTIVITY_CATEGORIES.filter((category) => categoryTotals[category] > 0)
        : [filter]
    ) as BranchActivityCategory[];
    const categoriesToPlot: BranchActivityCategory[] = chartCategories.length ? chartCategories : ["deposits"];
    const chartData: ChartData<"bar"> = {
        labels: dailyRows.map((row) => formatDate(row.date)),
        datasets: categoriesToPlot.map((category) => ({
            label: categoryMeta[category].label,
            data: dailyRows.map((row) => row[category]),
            backgroundColor: alpha(categoryMeta[category].color, 0.72),
            borderColor: categoryMeta[category].color,
            borderWidth: 1,
            borderRadius: 5
        }))
    };
    const chartOptions: ChartOptions<"bar"> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom"
            },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.dataset.label || "Amount"}: ${formatCurrency(Number(context.parsed.y || 0))}`
                }
            }
        },
        scales: {
            x: {
                stacked: false,
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => formatCurrency(Number(value))
                }
            }
        }
    };
    const tableRows = visibleStatements.slice(0, 40);
    const latestDate = latestActivityDate(visibleStatements);

    return (
        <MotionCard
            variant="outlined"
            inView
            sx={{
                background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.primary.main, 0.025)})`
            }}
        >
            <CardContent>
                <Stack spacing={2}>
                    <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", lg: "flex-start" }} spacing={2}>
                        <Box>
                            <Typography variant="h6">{title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {subtitle}
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent={{ xs: "flex-start", lg: "flex-end" }}>
                            <ToggleButtonGroup
                                size="small"
                                exclusive
                                value={view}
                                onChange={(_, nextView) => {
                                    if (nextView) {
                                        onViewChange(nextView);
                                    }
                                }}
                            >
                                <ToggleButton value="chart">Chart</ToggleButton>
                                <ToggleButton value="table">Table</ToggleButton>
                            </ToggleButtonGroup>
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    label="Type"
                                    value={filter}
                                    onChange={(event) => onFilterChange(event.target.value as BranchActivityFilter)}
                                >
                                    {Object.entries(branchActivityFilterLabels).map(([value, label]) => (
                                        <MenuItem key={value} value={value}>{label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Period</InputLabel>
                                <Select
                                    label="Period"
                                    value={window}
                                    onChange={(event) => onWindowChange(event.target.value as BranchActivityWindow)}
                                >
                                    <MenuItem value="7">Latest 7 days</MenuItem>
                                    <MenuItem value="30">Latest 30 days</MenuItem>
                                    <MenuItem value="year">SACCO year</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip label={`${activityTotals.count} posting(s)`} size="small" color="primary" variant="outlined" />
                        <Chip label={`In ${formatCurrency(activityTotals.inflow)}`} size="small" color="success" variant="outlined" />
                        <Chip label={`Out ${formatCurrency(activityTotals.outflow)}`} size="small" color="error" variant="outlined" />
                        <Chip
                            label={`Net ${formatCurrency(activityTotals.net)}`}
                            size="small"
                            color={activityTotals.net >= 0 ? "success" : "warning"}
                            variant="outlined"
                        />
                        <Chip label={latestDate ? `Latest ${formatDate(latestDate)}` : "No activity yet"} size="small" variant="outlined" />
                    </Stack>

                    {visibleStatements.length ? (
                        view === "table" ? (
                            <Box>
                                <TableContainer sx={{ maxHeight: 380, overflowX: "auto" }}>
                                    <Table size="small" stickyHeader sx={{ minWidth: 980 }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 800 }}>No.</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>Member</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>Direction</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }} align="right">Amount</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>Reference</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {tableRows.map((entry, index) => {
                                                const category = classifyBranchActivity(entry);
                                                const categoryColor = categoryMeta[category].color;

                                                return (
                                                    <TableRow key={`${entry.transaction_id}-${index}`} hover>
                                                        <TableCell>{index + 1}</TableCell>
                                                        <TableCell>{formatDate(entry.transaction_date)}</TableCell>
                                                        <TableCell>
                                                            <Stack spacing={0.2}>
                                                                <Typography variant="body2" fontWeight={700}>{entry.member_name}</Typography>
                                                                <Typography variant="caption" color="text.secondary">{entry.account_number}</Typography>
                                                            </Stack>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={categoryMeta[category].label}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ color: categoryColor, borderColor: alpha(categoryColor, 0.45) }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={entry.direction === "out" ? "Out" : "In"}
                                                                size="small"
                                                                color={entry.direction === "out" ? "error" : "success"}
                                                                variant="outlined"
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Typography variant="body2" fontWeight={800} color={entry.direction === "out" ? "error.main" : "success.main"}>
                                                                {formatCurrency(entry.amount)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {entry.reference || entry.transaction_type}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                {visibleStatements.length > tableRows.length ? (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                                        Showing latest {tableRows.length} of {visibleStatements.length} filtered postings.
                                    </Typography>
                                ) : null}
                            </Box>
                        ) : (
                            <Box sx={{ height: { xs: 320, md: 360 } }}>
                                <Bar data={chartData} options={chartOptions} />
                            </Box>
                        )
                    ) : (
                        <Alert severity="info" variant="outlined">
                            No branch activity matches the selected period and type.
                        </Alert>
                    )}
                </Stack>
            </CardContent>
        </MotionCard>
    );
}

function buildDeltaLabel(current: number, baseline: number, prefix = "vs baseline") {
    if (!baseline && !current) {
        return `Flat ${prefix}`;
    }

    if (!baseline) {
        return `New activity ${prefix}`;
    }

    const deltaPercent = ((current - baseline) / baseline) * 100;

    if (Math.abs(deltaPercent) < 1) {
        return `Flat ${prefix}`;
    }

    const direction = deltaPercent > 0 ? "+" : "";
    return `${direction}${deltaPercent.toFixed(0)}% ${prefix}`;
}

function getDeltaTone(current: number, baseline: number, higherIsGood = true) {
    if (Math.abs(current - baseline) < 1) {
        return "neutral" as const;
    }

    const isPositive = higherIsGood ? current >= baseline : current <= baseline;
    return isPositive ? "positive" as const : "negative" as const;
}

function buildTellerAverageTicketSparkline(statements: StatementRow[]) {
    const allDates = [...new Set(
        statements
            .map((entry) => entry.transaction_date)
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
    const dates = allDates.length
        ? allDates.slice(-7)
        : Array.from({ length: 7 }, (_, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - index));
            return date.toISOString().slice(0, 10);
        });

    return dates.map((date) => {
        const dailyStatements = statements.filter((entry) => entry.transaction_date === date);

        if (!dailyStatements.length) {
            return 0;
        }

        return dailyStatements.reduce((sum, entry) => sum + entry.amount, 0) / dailyStatements.length;
    });
}

function averageSeries(values: number[]) {
    if (!values.length) {
        return 0;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

const BRANCH_ACTIVITY_CATEGORIES: BranchActivityCategory[] = ["deposits", "withdrawals", "loans", "dividends", "other"];
const branchActivityFilterLabels: Record<BranchActivityFilter, string> = {
    all: "All activity",
    deposits: "Savings deposits",
    withdrawals: "Withdrawals",
    loans: "Loan movement",
    dividends: "Dividends",
    other: "Other"
};

function normalizeActivityDate(value?: string | null) {
    return value ? value.slice(0, 10) : "";
}

function shiftIsoDate(value: string, days: number) {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

function latestActivityDate(statements: StatementRow[]) {
    return statements.reduce((latest, entry) => {
        const date = normalizeActivityDate(entry.transaction_date);
        return date && (!latest || date > latest) ? date : latest;
    }, "");
}

function isShareBranchActivity(entry: StatementRow) {
    return (entry.transaction_type || "").toLowerCase().includes("share");
}

function classifyBranchActivity(entry: StatementRow): BranchActivityCategory {
    const transactionType = (entry.transaction_type || "").toLowerCase();

    if (transactionType.includes("dividend")) {
        return "dividends";
    }

    if (transactionType.includes("loan")) {
        return "loans";
    }

    if (entry.direction === "out" || transactionType.includes("withdraw")) {
        return "withdrawals";
    }

    if (entry.direction === "in" || transactionType.includes("deposit")) {
        return "deposits";
    }

    return "other";
}

function filterBranchActivityByWindow(statements: StatementRow[], window: BranchActivityWindow) {
    const savingsOnlyStatements = statements.filter((entry) => !isShareBranchActivity(entry));
    const latest = latestActivityDate(savingsOnlyStatements);

    if (!latest || window === "year") {
        return savingsOnlyStatements;
    }

    const startDate = shiftIsoDate(latest, -(Number(window) - 1));
    return savingsOnlyStatements.filter((entry) => normalizeActivityDate(entry.transaction_date) >= startDate);
}

function filterBranchActivityByType(statements: StatementRow[], filter: BranchActivityFilter) {
    if (filter === "all") {
        return statements;
    }

    return statements.filter((entry) => classifyBranchActivity(entry) === filter);
}

function buildBranchActivityDailyRows(statements: StatementRow[]) {
    const map = new Map<string, BranchActivityDailyRow>();

    statements.forEach((entry) => {
        const date = normalizeActivityDate(entry.transaction_date);

        if (!date) {
            return;
        }

        const category = classifyBranchActivity(entry);
        const current = map.get(date) || {
            date,
            deposits: 0,
            withdrawals: 0,
            loans: 0,
            dividends: 0,
            other: 0,
            inflow: 0,
            outflow: 0,
            net: 0,
            count: 0
        };
        const amount = Number(entry.amount || 0);

        current[category] += amount;
        current.count += 1;

        if (entry.direction === "out") {
            current.outflow += amount;
            current.net -= amount;
        } else {
            current.inflow += amount;
            current.net += amount;
        }

        map.set(date, current);
    });

    return [...map.values()].sort((left, right) => left.date.localeCompare(right.date));
}

export function DashboardPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { profile, selectedTenantId, branchIds, selectedTenantName, isInternalOps } = useAuth();
    const [state, setState] = useState<DashboardState>({
        members: [],
        memberAccounts: [],
        statements: [],
        loans: [],
        schedules: [],
        loanApplications: [],
        memberApplications: [],
        staffUsers: [],
        revenueSummary: null,
        manualDividendBatches: [],
        dailyCashSummary: []
    });
    const [fundingSources, setFundingSources] = useState<import("../lib/endpoints").FundingSourceSummaryData | null>(null);
    const [financialYearSettings, setFinancialYearSettings] = useState<SaccoFinancialYearSettings>(DEFAULT_SACCO_FINANCIAL_YEAR_SETTINGS);
    const [performanceTargetSettings, setPerformanceTargetSettings] = useState<SaccoPerformanceTargetSettings>(DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS);
    const [targetWatchFilter, setTargetWatchFilter] = useState<TargetWatchFilter>("needs_action");
    const [branchActivityView, setBranchActivityView] = useState<BranchActivityView>("chart");
    const [branchActivityFilter, setBranchActivityFilter] = useState<BranchActivityFilter>("all");
    const [branchActivityWindow, setBranchActivityWindow] = useState<BranchActivityWindow>("30");
    const [platformState, setPlatformState] = useState<PlatformState>({
        tenants: [],
        branches: [],
        systemMetrics: null,
        tenantTraffic: [],
        infrastructure: null,
        errors: [],
        slowEndpoints: []
    });
    const [loading, setLoading] = useState(true);
    const [supplementalLoading, setSupplementalLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const branchScopeKey = branchIds.join("|");

    useEffect(() => {
        let isActive = true;

        const loadSupplementalData = async (role: string, tenantId: string, period: FinancialYearPeriod) => {
            if (!["branch_manager", "loan_officer"].includes(role)) {
                if (isActive) {
                    setState((current) => ({
                        ...current,
                        loanApplications: [],
                        memberApplications: [],
                        staffUsers: [],
                        revenueSummary: null,
                        manualDividendBatches: [],
                        dailyCashSummary: []
                    }));
                }
                return;
            }

            if (isActive) {
                setSupplementalLoading(true);
            }

            try {
                const today = new Date().toISOString().slice(0, 10);
                const singleBranchId = branchIds.length === 1 ? branchIds[0] : undefined;

                if (role === "loan_officer") {
                    const [loanApplicationsResponse] = await Promise.all([
                        api.get<LoanApplicationsResponse>(endpoints.loanApplications.list(), {
                            params: { tenant_id: tenantId, page: 1, limit: 50 }
                        })
                    ]);

                    if (isActive) {
                        setState((current) => ({
                            ...current,
                            loanApplications: loanApplicationsResponse.data.data || [],
                            memberApplications: [],
                            staffUsers: [],
                            revenueSummary: null,
                            manualDividendBatches: [],
                            dailyCashSummary: []
                        }));
                    }
                    return;
                }

                const supplemental = await Promise.allSettled([
                    api.get<LoanApplicationsResponse>(endpoints.loanApplications.list(), {
                        params: { tenant_id: tenantId, page: 1, limit: 50 }
                    }),
                    api.get<MemberApplicationsResponse>(endpoints.memberApplications.list(), {
                        params: { tenant_id: tenantId, page: 1, limit: 50 }
                    }),
                    api.get<UsersListResponse>(endpoints.users.list(), {
                        params: { tenant_id: tenantId, page: 1, limit: 50 }
                    }),
                    api.get<ChargeRevenueSummaryResponse>(endpoints.reports.chargeRevenueSummary(), {
                        params: {
                            tenant_id: tenantId,
                            branch_id: singleBranchId,
                            from_date: period.startIso,
                            to_date: period.endIso
                        }
                    }),
                    api.get<ManualDividendBatchesResponse>(endpoints.dividends.manualBatches(), {
                        params: { tenant_id: tenantId, page: 1, limit: 20 }
                    }),
                    api.get<DailyCashSummaryResponse>(endpoints.cashControl.dailySummary(), {
                        params: {
                            date: today,
                            branch_id: singleBranchId
                        }
                    })
                ]);

                if (!isActive) {
                    return;
                }

                setState((current) => ({
                    ...current,
                    loanApplications: supplemental[0].status === "fulfilled" ? supplemental[0].value.data.data || [] : [],
                    memberApplications: supplemental[1].status === "fulfilled" ? supplemental[1].value.data.data || [] : [],
                    staffUsers: supplemental[2].status === "fulfilled" ? supplemental[2].value.data.data.users || [] : [],
                    revenueSummary: supplemental[3].status === "fulfilled" ? supplemental[3].value.data.data : null,
                    manualDividendBatches: supplemental[4].status === "fulfilled" ? supplemental[4].value.data.data || [] : [],
                    dailyCashSummary: supplemental[5].status === "fulfilled" ? supplemental[5].value.data.data || [] : []
                }));
            } finally {
                if (isActive) {
                    setSupplementalLoading(false);
                }
            }
        };

        const loadFinancialYearSettings = async (tenantId: string) => {
            try {
                const { data } = await api.get<SaccoFinancialYearSettingsResponse>(endpoints.saccoSettings.financialYear(), {
                    params: { tenant_id: tenantId }
                });

                const normalized = normalizeSaccoFinancialYearSettings(data.data);

                if (!isActive) {
                    return normalized;
                }

                setFinancialYearSettings(normalized);
                return normalized;
            } catch {
                const fallback = normalizeSaccoFinancialYearSettings({ tenant_id: tenantId });

                if (isActive) {
                    setFinancialYearSettings(fallback);
                }

                return fallback;
            }
        };

        const loadPerformanceTargetSettings = async (tenantId: string) => {
            try {
                const { data } = await api.get<SaccoPerformanceTargetSettingsResponse>(endpoints.saccoSettings.performanceTarget(), {
                    params: { tenant_id: tenantId }
                });

                const normalized = normalizeSaccoPerformanceTargetSettings(data.data);

                if (!isActive) {
                    return normalized;
                }

                setPerformanceTargetSettings(normalized);
                return normalized;
            } catch {
                const fallback = normalizeSaccoPerformanceTargetSettings({ tenant_id: tenantId });

                if (isActive) {
                    setPerformanceTargetSettings(fallback);
                }

                return fallback;
            }
        };

        const loadDashboard = async () => {
            if (isInternalOps) {
                setLoading(true);
                setError(null);

                try {
                    // system + tenant-traffic + slow-endpoints + errors all share the
                    // 60-min window and are served together by the cached operations
                    // overview RPC — one call instead of four uncached scans of the
                    // large api_metrics table. Infrastructure keeps its own 1-min
                    // window ("current" load), so it stays a separate request.
                    const [
                        tenantsResult,
                        branchesResult,
                        overviewResult,
                        infrastructureResult
                    ] = await Promise.allSettled([
                        api.get<TenantsListResponse>(endpoints.tenants.list(), { params: { page: 1, limit: 100 } }),
                        api.get<BranchesListResponse>(endpoints.branches.list(), { params: { page: 1, limit: 100 } }),
                        api.get<PlatformOperationsOverviewResponse>(endpoints.platform.operationsOverview(), {
                            params: { window_minutes: 60 }
                        }),
                        api.get<PlatformInfrastructureMetricsResponse>(endpoints.platform.metricsInfrastructure(), {
                            params: { window_minutes: 1 }
                        })
                    ]);

                    const overview = overviewResult.status === "fulfilled" ? overviewResult.value.data.data : null;

                    if (isActive) {
                        setPlatformState({
                            tenants: tenantsResult.status === "fulfilled" ? tenantsResult.value.data.data || [] : [],
                            branches: branchesResult.status === "fulfilled" ? branchesResult.value.data.data || [] : [],
                            systemMetrics: overview?.system ?? null,
                            tenantTraffic: overview?.tenants ?? [],
                            infrastructure: infrastructureResult.status === "fulfilled" ? infrastructureResult.value.data.data : null,
                            errors: overview?.errors ?? [],
                            slowEndpoints: overview?.slow_endpoints ?? []
                        });
                    }

                    const criticalFailure =
                        tenantsResult.status === "rejected"
                        && branchesResult.status === "rejected"
                        && overviewResult.status === "rejected";

                    if (criticalFailure && isActive) {
                        setError(getApiErrorMessage(tenantsResult.reason));
                    }
                } catch (loadError) {
                    if (isActive) {
                        setError(getApiErrorMessage(loadError));
                    }
                } finally {
                    if (isActive) {
                        setLoading(false);
                    }
                }

                return;
            }

            if (!selectedTenantId) {
                if (isActive) {
                    setState({
                        members: [],
                        memberAccounts: [],
                        statements: [],
                        loans: [],
                        schedules: [],
                        loanApplications: [],
                        memberApplications: [],
                        staffUsers: [],
                        revenueSummary: null,
                        manualDividendBatches: [],
                        dailyCashSummary: []
                    });
                    setLoading(false);
                    setSupplementalLoading(false);
                }
                return;
            }

            setLoading(true);
            setSupplementalLoading(false);
            setError(null);

            const cacheScope = `${selectedTenantId}:${branchScopeKey}`;
            const activeSchedules = (rows: LoanSchedule[]) =>
                rows.filter((schedule) => ["pending", "partial", "overdue"].includes(schedule.status));

            try {
                const [membersList, loansData, schedulesData, memberAccounts] = await Promise.all([
                    cachedGet(
                        `dash:members:${cacheScope}`,
                        () => loadDashboardMembers(selectedTenantId),
                        DASHBOARD_CACHE_TTL_MS,
                        (fresh) => { if (isActive) setState((current) => ({ ...current, members: fresh })); }
                    ),
                    cachedGet(
                        `dash:loans:${cacheScope}`,
                        async () => (await api.get<LoansResponse>(endpoints.finance.loanPortfolio(), {
                            params: { tenant_id: selectedTenantId, page: 1, limit: 100 }
                        })).data.data || [],
                        DASHBOARD_CACHE_TTL_MS,
                        (fresh) => { if (isActive) setState((current) => ({ ...current, loans: fresh })); }
                    ),
                    cachedGet(
                        `dash:schedules:${cacheScope}`,
                        async () => (await api.get<LoanSchedulesResponse>(endpoints.finance.loanSchedules(), {
                            params: { tenant_id: selectedTenantId, page: 1, limit: 100 }
                        })).data.data || [],
                        DASHBOARD_CACHE_TTL_MS,
                        (fresh) => { if (isActive) setState((current) => ({ ...current, schedules: activeSchedules(fresh) })); }
                    ),
                    cachedGet(
                        `dash:accounts:${cacheScope}`,
                        () => loadDashboardMemberAccounts(selectedTenantId),
                        DASHBOARD_CACHE_TTL_MS,
                        (fresh) => { if (isActive) setState((current) => ({ ...current, memberAccounts: fresh })); }
                    )
                ]);

                if (!isActive) {
                    return;
                }

                setState({
                    members: membersList,
                    memberAccounts,
                    statements: [],
                    loans: loansData,
                    schedules: activeSchedules(schedulesData),
                    loanApplications: [],
                    memberApplications: [],
                    staffUsers: [],
                    revenueSummary: null,
                    manualDividendBatches: [],
                    dailyCashSummary: []
                });

                // Core dashboard data is in — render immediately. Everything below is
                // secondary (activity chart, tenant settings, supplemental lists) and loads
                // in the background, so one slow read can never hold the page on the loader.
                if (isActive) {
                    setLoading(false);
                }

                // Recent statements feed only the activity chart + cash-flow tiles and are
                // the heaviest read, so they load on their own and the chart fills in later.
                void cachedGet(
                    `dash:statements:${cacheScope}`,
                    () => loadDashboardStatements(selectedTenantId),
                    DASHBOARD_CACHE_TTL_MS,
                    (fresh) => { if (isActive) setState((current) => ({ ...current, statements: fresh })); }
                )
                    .then((statementsList) => {
                        if (isActive) {
                            setState((current) => ({ ...current, statements: statementsList }));
                        }
                    })
                    .catch(() => {
                        // Activity chart stays empty; the rest of the dashboard is unaffected.
                    });

                void (async () => {
                    const [normalizedFinancialYearSettings] = await Promise.all([
                        loadFinancialYearSettings(selectedTenantId),
                        loadPerformanceTargetSettings(selectedTenantId)
                    ]);
                    if (isActive) {
                        void loadSupplementalData(profile?.role || "", selectedTenantId, resolveFinancialYearPeriod(normalizedFinancialYearSettings));
                    }
                })();
            } catch (loadError) {
                if (isActive) {
                    setError(getApiErrorMessage(loadError));
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        void loadDashboard();

        return () => {
            isActive = false;
        };
    }, [branchScopeKey, isInternalOps, profile?.role, selectedTenantId]);

    // Funding-source breakdown (M-KOBA / NMB / UTT / Loan ...). Self-contained and
    // failure-tolerant so it never blocks the rest of the dashboard.
    useEffect(() => {
        let isActive = true;
        if (!selectedTenantId || profile?.role === "member") {
            setFundingSources(null);
            return;
        }
        (async () => {
            try {
                const data = await cachedGet(
                    `dash:funding:${selectedTenantId}:${branchScopeKey}`,
                    async () => (await api.get<import("../lib/endpoints").FundingSourceSummaryResponse>(
                        endpoints.reports.fundingSources()
                    )).data.data,
                    DASHBOARD_CACHE_TTL_MS,
                    (fresh) => { if (isActive) setFundingSources(fresh); }
                );
                if (isActive) {
                    setFundingSources(data);
                }
            } catch {
                if (isActive) {
                    setFundingSources(null);
                }
            }
        })();
        return () => {
            isActive = false;
        };
    }, [branchScopeKey, profile?.role, selectedTenantId]);

    const financialYearPeriod = useMemo(() => resolveFinancialYearPeriod(financialYearSettings), [financialYearSettings]);

    const metrics = useMemo(() => {
        const branchMembers = branchIds.length
            ? state.members.filter((member) => branchIds.includes(member.branch_id))
            : state.members;
        const branchMemberIds = new Set(branchMembers.map((member) => member.id));
        const activeBranchMemberIds = new Set(
            branchMembers
                .filter((member) => member.status === "active")
                .map((member) => member.id)
        );
        const activeBranchAccounts = state.memberAccounts
            .filter((account) => {
                if (account.status === "closed") {
                    return false;
                }

                if (!activeBranchMemberIds.has(account.member_id)) {
                    return false;
                }

                return !branchIds.length || branchIds.includes(account.branch_id);
            });
        const branchSavingsBalance = activeBranchAccounts
            .filter((account) => account.product_type === "savings")
            .reduce((sum, account) => sum + Number(account.available_balance || 0) + Number(account.locked_balance || 0), 0);
        const totalDeposits = state.statements
            .filter((entry) => entry.direction === "in")
            .reduce((sum, entry) => sum + entry.amount, 0);
        const totalWithdrawals = state.statements
            .filter((entry) => entry.direction === "out")
            .reduce((sum, entry) => sum + entry.amount, 0);
        const activeLoans = state.loans.filter((loan) => ["active", "in_arrears"].includes(loan.status));
        const overdueLoans = state.loans.filter((loan) => loan.status === "in_arrears");
        const overdueSchedules = state.schedules.filter((schedule) => schedule.status === "overdue");
        const branchLoans = branchIds.length
            ? activeLoans.filter((loan) => branchIds.includes(loan.branch_id))
            : activeLoans;
        const branchLoanIds = new Set(branchLoans.map((loan) => loan.id));
        const branchSchedules = state.schedules.filter((schedule) => branchLoanIds.has(schedule.loan_id));
        const branchStatements = state.statements.filter((entry) => !branchIds.length || branchMemberIds.has(entry.member_id));
        const branchYearStatements = branchStatements.filter((entry) =>
            entry.transaction_date >= financialYearPeriod.startIso
            && entry.transaction_date <= financialYearPeriod.endIso
        );
        const branchDepositIntake = branchYearStatements
            .filter((entry) => entry.direction === "in" && !isShareBranchActivity(entry))
            .reduce((sum, entry) => sum + entry.amount, 0);
        const branchWithdrawalOutflow = branchYearStatements
            .filter((entry) => entry.direction === "out" && !isShareBranchActivity(entry))
            .reduce((sum, entry) => sum + entry.amount, 0);
        const branchOverdueOutstanding = branchLoans
            .filter((loan) => loan.status === "in_arrears")
            .reduce((sum, loan) => sum + loan.outstanding_principal + loan.accrued_interest, 0);
        const today = new Date().toISOString().slice(0, 10);
        const branchInflowsToday = branchStatements
            .filter((entry) => entry.transaction_date === today && entry.direction === "in")
            .reduce((sum, entry) => sum + entry.amount, 0);
        const branchOutflowsToday = branchStatements
            .filter((entry) => entry.transaction_date === today && entry.direction === "out")
            .reduce((sum, entry) => sum + entry.amount, 0);
        const branchNetToday = branchInflowsToday - branchOutflowsToday;
        const branchOpeningBalance = (branchDepositIntake - branchWithdrawalOutflow) - branchNetToday;
        const todayCashRows = state.dailyCashSummary.filter((row) => !branchIds.length || branchIds.includes(row.branch_id));
        const branchCashControlInflowToday = todayCashRows.reduce((sum, row) => sum + Number(row.inflow_total ?? row.deposits_total ?? 0), 0);
        const branchCashControlOutflowToday = todayCashRows.reduce((sum, row) => sum + Number(row.outflow_total ?? row.withdrawals_total ?? 0), 0);
        const branchCashControlVarianceToday = todayCashRows.reduce((sum, row) => sum + Number(row.variance_total || 0), 0);
        const branchCashControlReceiptsToday = todayCashRows.reduce((sum, row) => sum + Number(row.receipt_count || 0), 0);
        const branchCashControlOpenSessions = todayCashRows.reduce((sum, row) => sum + (row.has_open_session ? 1 : 0), 0);
        const postedDividendTotal = state.manualDividendBatches
            .filter((batch) => batch.status === "posted")
            .reduce((sum, batch) => sum + Number(batch.total_amount || 0), 0);
        const pendingDividendTotal = state.manualDividendBatches
            .filter((batch) => ["draft", "submitted"].includes(batch.status))
            .reduce((sum, batch) => sum + Number(batch.total_amount || 0), 0);
        const revenueTotals = state.revenueSummary?.totals || null;

        return {
            totalMembers: state.members.length,
            activeMembers: state.members.filter((member) => member.status === "active").length,
            totalDeposits,
            totalWithdrawals,
            activeLoans: activeLoans.length,
            outstandingLoans: activeLoans.reduce((sum, loan) => sum + loan.outstanding_principal, 0),
            accruedInterest: activeLoans.reduce((sum, loan) => sum + loan.accrued_interest, 0),
            overdueLoans: overdueLoans.length,
            overdueSchedules: overdueSchedules.length,
            branchMembers: branchMembers.length,
            branchActiveMembers: branchMembers.filter((member) => member.status === "active").length,
            branchSavings: branchSavingsBalance,
            branchDepositIntake,
            branchWithdrawalOutflow,
            branchOutstanding: branchLoans.reduce((sum, loan) => sum + loan.outstanding_principal, 0),
            branchAccruedInterest: branchLoans.reduce((sum, loan) => sum + loan.accrued_interest, 0),
            branchOverdueLoans: branchLoans.filter((loan) => loan.status === "in_arrears").length,
            branchOverdueSchedules: branchSchedules.filter((schedule) => schedule.status === "overdue").length,
            branchOverdueOutstanding,
            branchInflowsToday,
            branchOutflowsToday,
            branchNetToday,
            branchOpeningBalance,
            branchCashControlInflowToday,
            branchCashControlOutflowToday,
            branchCashControlNetToday: branchCashControlInflowToday - branchCashControlOutflowToday,
            branchCashControlVarianceToday,
            branchCashControlReceiptsToday,
            branchCashControlOpenSessions,
            branchCashControlRows: todayCashRows.length,
            branchGrossRevenue: Number(revenueTotals?.total_revenue || 0),
            branchChargeRevenue: Number(revenueTotals?.charge_revenue || 0),
            branchLoanRevenue: Number(revenueTotals?.loan_revenue || 0),
            branchMixedRevenue: Number(revenueTotals?.mixed_revenue || 0),
            branchRevenuePostedLines: Number(revenueTotals?.posted_lines || 0),
            branchDividendsPosted: postedDividendTotal,
            branchDividendsPending: pendingDividendTotal,
            branchDividendBatchCount: state.manualDividendBatches.length,
            branchStatements: branchYearStatements,
            branchLoans,
            branchSchedules
        };
    }, [branchIds, financialYearPeriod.endIso, financialYearPeriod.startIso, state]);

    const memberPerformanceRows = useMemo<MemberPerformanceRow[]>(() => {
        const branchMembers = branchIds.length
            ? state.members.filter((member) => branchIds.includes(member.branch_id))
            : state.members;
        const activeMembers = branchMembers.filter((member) => member.status === "active");
        const activeMemberIds = new Set(activeMembers.map((member) => member.id));
        const accountsByMember = new Map<string, MemberAccount[]>();

        state.memberAccounts.forEach((account) => {
            if (!activeMemberIds.has(account.member_id) || account.status === "closed") {
                return;
            }

            if (branchIds.length && !branchIds.includes(account.branch_id)) {
                return;
            }

            const memberAccounts = accountsByMember.get(account.member_id) || [];
            memberAccounts.push(account);
            accountsByMember.set(account.member_id, memberAccounts);
        });

        return activeMembers
            .map((member) => {
                const targetPosition = calculateMemberPerformanceTarget(
                    member,
                    accountsByMember.get(member.id) || [],
                    performanceTargetSettings
                );

                return {
                    memberId: member.id,
                    memberName: member.full_name,
                    memberNo: member.member_no || member.id.slice(0, 8),
                    actualDetailAmount: targetPosition.actualDetailAmount,
                    actualFormAmount: targetPosition.actualFormAmount,
                    matchesDetail: targetPosition.matchesDetail,
                    requiredAmount: targetPosition.requiredAmount,
                    annualTargetAmount: targetPosition.annualTargetAmount,
                    remainingAmount: targetPosition.remainingAmount,
                    reachPercent: targetPosition.reachPercent,
                    remainingPercent: targetPosition.remainingPercent,
                    level: targetPosition.levelLabel,
                    levelColor: targetPosition.levelColor
                };
            })
            .sort((left, right) =>
                left.memberNo.localeCompare(right.memberNo, undefined, { numeric: true, sensitivity: "base" })
                || left.memberName.localeCompare(right.memberName)
            );
    }, [branchIds, performanceTargetSettings, state.memberAccounts, state.members]);

    const memberPerformanceSummary = useMemo<MemberPerformanceSummary>(() => {
        const totalActualDetail = memberPerformanceRows.reduce((sum, row) => sum + row.actualDetailAmount, 0);
        const totalActualForm = memberPerformanceRows.reduce((sum, row) => sum + row.actualFormAmount, 0);
        const totalAnnualTarget = memberPerformanceRows.reduce((sum, row) => sum + row.annualTargetAmount, 0);
        const totalRequiredAmount = memberPerformanceRows.reduce((sum, row) => sum + row.requiredAmount, 0);
        const totalRemainingAmount = memberPerformanceRows.reduce((sum, row) => sum + row.remainingAmount, 0);

        return {
            totalActualDetail,
            totalActualForm,
            totalAnnualTarget,
            totalRequiredAmount,
            totalRemainingAmount,
            matchedMembers: memberPerformanceRows.filter((row) => row.matchesDetail).length,
            varianceMembers: memberPerformanceRows.filter((row) => !row.matchesDetail).length,
            reachedMembers: memberPerformanceRows.filter((row) => row.reachPercent >= 100).length,
            behindMembers: memberPerformanceRows.filter((row) => row.reachPercent < 100).length,
            averageReachPercent: totalAnnualTarget > 0 ? (totalActualForm / totalAnnualTarget) * 100 : 0
        };
    }, [memberPerformanceRows]);

    const cashTrend = groupAmountsByDate(state.statements);
    const depositTrend = groupAmountsByDate(state.statements, "in");
    const withdrawalTrend = groupAmountsByDate(state.statements, "out");
    const loanTrend = groupLoansByMonth(state.loans);
    const branchLoanTrend = useMemo(() => groupLoansByMonth(metrics.branchLoans), [metrics.branchLoans]);
    const agingBuckets = groupSchedulesByBucket(state.schedules);
    const branchAgingBuckets = useMemo(() => groupSchedulesByBucket(metrics.branchSchedules), [metrics.branchSchedules]);
    const tellerDashboard = useMemo(() => buildTellerDashboardData(state.statements), [state.statements]);
    const tellerAverageTicketSparkline = useMemo(
        () => buildTellerAverageTicketSparkline(state.statements),
        [state.statements]
    );
    const branchWithdrawalTrend = useMemo(() => groupAmountsByDate(metrics.branchStatements, "out"), [metrics.branchStatements]);
    const branchWithdrawalSeries = branchWithdrawalTrend.map(([, value]) => value);
    const branchWithdrawalAverage = averageSeries(branchWithdrawalSeries);
    const branchNetMovement = metrics.branchDepositIntake - metrics.branchWithdrawalOutflow;
    const branchAlerts = useMemo(() => {
        const alerts: BranchAlertItem[] = [];

        if (memberPerformanceSummary.behindMembers > 0) {
            alerts.push({
                id: "branch-target-gap",
                severity: memberPerformanceSummary.averageReachPercent >= 60 ? "info" : "warning",
                title: "Annual target follow-up needed",
                description: `${memberPerformanceSummary.behindMembers} active member(s) are still below their annual contribution target.`
            });
        }

        if (metrics.branchCashControlVarianceToday !== 0) {
            alerts.push({
                id: "branch-cash-variance",
                severity: "error",
                title: "Cash control variance detected",
                description: `Today's cash-control variance is ${formatSignedCurrency(metrics.branchCashControlVarianceToday)} and needs reconciliation.`
            });
        }

        if (metrics.branchOverdueLoans > 0) {
            alerts.push({
                id: "branch-overdue",
                severity: "warning",
                title: "Overdue portfolio requires follow-up",
                description: `${metrics.branchOverdueLoans} loans and ${metrics.branchOverdueSchedules} schedules need immediate branch collection follow-up.`
            });
        }

        if (metrics.branchWithdrawalOutflow > branchWithdrawalAverage * 1.2 && metrics.branchWithdrawalOutflow > 0) {
            alerts.push({
                id: "branch-withdrawal-pressure",
                severity: "warning",
                title: "Withdrawal pressure rising",
                description: "Savings outflows are above the recent branch operating pattern and should be reviewed."
            });
        }

        if (metrics.branchMixedRevenue > 0) {
            alerts.push({
                id: "branch-mixed-revenue",
                severity: "warning",
                title: "Revenue needs account cleanup",
                description: `${formatCurrency(metrics.branchMixedRevenue)} is posted in mixed income accounts, which weakens source-level reporting.`
            });
        }

        if (!alerts.length) {
            alerts.push({
                id: "branch-stable",
                severity: "info",
                title: "Branch operating within range",
                description: "No material branch-side savings or loan exceptions are visible in the current activity window."
            });
        }

        return alerts.slice(0, 3);
    }, [
        branchWithdrawalAverage,
        memberPerformanceSummary.averageReachPercent,
        memberPerformanceSummary.behindMembers,
        metrics.branchCashControlVarianceToday,
        metrics.branchMixedRevenue,
        metrics.branchOverdueLoans,
        metrics.branchOverdueSchedules,
        metrics.branchWithdrawalOutflow
    ]);
    const loanLabelById = useMemo(() => {
        const memberNameById = new Map(state.members.map((member) => [member.id, member.full_name]));
        const map = new Map<string, string>();
        state.loans.forEach((loan) => {
            const name = memberNameById.get(loan.member_id);
            map.set(loan.id, name ? `${name} · ${loan.loan_number}` : loan.loan_number);
        });
        return map;
    }, [state.loans, state.members]);
    const branchFollowUps = useMemo(() => buildFollowUpItems(metrics.branchSchedules, loanLabelById), [metrics.branchSchedules, loanLabelById]);
    const generalFollowUps = useMemo(() => buildFollowUpItems(state.schedules, loanLabelById), [state.schedules, loanLabelById]);
    const branchLoanAging = useMemo(() => calculateAgingSummary(metrics.branchSchedules), [metrics.branchSchedules]);
    const branchScopedLoanApplications = useMemo(
        () =>
            branchIds.length
                ? state.loanApplications.filter((application) => branchIds.includes(application.branch_id))
                : state.loanApplications,
        [branchIds, state.loanApplications]
    );
    const branchScopedMemberApplications = useMemo(
        () =>
            branchIds.length
                ? state.memberApplications.filter((application) => branchIds.includes(application.branch_id))
                : state.memberApplications,
        [branchIds, state.memberApplications]
    );
    const pendingLoanApprovals = useMemo(
        () => branchScopedLoanApplications.filter((application) => application.status === "appraised").length,
        [branchScopedLoanApplications]
    );
    const pendingLoanApplications = useMemo(
        () =>
            branchScopedLoanApplications.filter((application) =>
                ["submitted", "appraised"].includes(application.status)
            ).length,
        [branchScopedLoanApplications]
    );
    const pendingMemberApprovals = useMemo(
        () =>
            branchScopedMemberApplications.filter((application) =>
                ["submitted", "under_review"].includes(application.status)
            ).length,
        [branchScopedMemberApplications]
    );
    const pendingWithdrawalRequests = 0;
    const hasCashImbalance = metrics.branchNetToday < 0;
    const signOffTasks = pendingLoanApprovals + pendingMemberApprovals + (hasCashImbalance ? 1 : 0);
    // PAR is driven by the loan's FORMAL arrears classification (the same basis as the
    // Overdue Mix donut and Overdue Exposure), not raw schedule due-dates — otherwise
    // imported loans with a backdated single installment and no repayment history all
    // read as "overdue" and produce a misleading 90%+ PAR that contradicts the rest of
    // the dashboard. Once default-detection flags a loan in_arrears, it counts here.
    const par30Percent = metrics.branchOutstanding > 0
        ? (metrics.branchOverdueOutstanding / metrics.branchOutstanding) * 100
        : 0;
    const branchRiskStrip = [
        {
            id: "par30",
            label: "Portfolio at Risk (PAR 30)",
            value: `${par30Percent.toFixed(1)}%`,
            helper: `${metrics.branchOverdueLoans} loan(s) in arrears.`,
            tone: par30Percent >= 15 ? "red" : par30Percent >= 8 ? "yellow" : "green"
        },
        {
            id: "overdue-loans",
            label: "Overdue Loans",
            value: String(metrics.branchOverdueLoans),
            helper: `${formatCurrency(metrics.branchOverdueOutstanding)} exposed in arrears.`,
            tone: metrics.branchOverdueLoans >= 5 ? "red" : metrics.branchOverdueLoans >= 2 ? "yellow" : "green"
        },
        {
            id: "pending-approvals",
            label: "Pending Approvals",
            value: String(pendingLoanApprovals),
            helper: "Appraised facilities waiting branch approval.",
            tone: pendingLoanApprovals >= 8 ? "red" : pendingLoanApprovals >= 3 ? "yellow" : "green"
        },
        {
            id: "cash-imbalance",
            label: "Cash Imbalance Warning",
            value: hasCashImbalance ? "Warning" : "Balanced",
            helper: hasCashImbalance
                ? `Today net change ${formatCurrency(metrics.branchNetToday)} requires branch cash review.`
                : "Branch cash flow is currently within expected operating range.",
            tone: hasCashImbalance ? "red" : "green"
        }
    ] as const;
    // Count loans formally in arrears (consistent with PAR + the Overdue Mix donut).
    const overdueScheduleCount = metrics.branchOverdueLoans;
    const loanOfficerRiskStrip = [
        {
            id: "officer-par30",
            label: "Portfolio at Risk (PAR 30)",
            value: `${par30Percent.toFixed(1)}%`,
            helper: `${overdueScheduleCount} loan(s) in arrears in your book.`,
            tone: par30Percent >= 15 ? "red" : par30Percent >= 8 ? "yellow" : "green"
        },
        {
            id: "officer-overdue-value",
            label: "Overdue Exposure",
            value: formatCurrency(metrics.branchOverdueOutstanding),
            helper: `${metrics.branchOverdueLoans} loan(s) currently in arrears.`,
            tone: metrics.branchOverdueOutstanding > 0 ? "yellow" : "green"
        },
        {
            id: "officer-approvals",
            label: "Pipeline Awaiting Decision",
            value: String(pendingLoanApplications),
            helper: "Submitted and appraised applications waiting your movement.",
            tone: pendingLoanApplications >= 10 ? "red" : pendingLoanApplications >= 4 ? "yellow" : "green"
        },
        {
            id: "officer-followups",
            label: "Collections Follow-up",
            value: String(branchFollowUps.length),
            helper: "Borrowers requiring calls, reminders, or repayment alignment.",
            tone: branchFollowUps.length >= 8 ? "red" : branchFollowUps.length >= 3 ? "yellow" : "green"
        }
    ] as const;
    const loanOfficerQueue: OperationalQueueItem[] = [
        {
            id: "officer-queue-pipeline",
            label: "Loan Application Pipeline",
            count: pendingLoanApplications,
            helper: "New and appraised applications pending officer action.",
            route: "/loans",
            tone: pendingLoanApplications > 0 ? "warning" : "success"
        },
        {
            id: "officer-queue-overdue",
            label: "Overdue Schedules",
            count: overdueScheduleCount,
            helper: "Repayments that have crossed due date and need engagement.",
            route: "/follow-ups",
            tone: overdueScheduleCount > 0 ? "error" : "success"
        },
        {
            id: "officer-queue-contact",
            label: "Member Contact Queue",
            count: branchFollowUps.length,
            helper: "Prioritized borrower follow-up list from active schedules.",
            route: "/follow-ups",
            tone: branchFollowUps.length > 0 ? "warning" : "success"
        },
        {
            id: "officer-queue-book",
            label: "Loans Under Supervision",
            count: metrics.branchLoans.length,
            helper: "Active and recently disbursed facilities in your branch scope.",
            route: "/loans",
            tone: metrics.branchLoans.length > 0 ? "info" : "success"
        }
    ];
    const operationalQueue: OperationalQueueItem[] = [
        {
            id: "queue-loans",
            label: "Pending Loan Applications",
            count: pendingLoanApplications,
            helper: "Submitted/appraised loan requests in branch workflow queue.",
            route: "/loans",
            tone: pendingLoanApplications > 0 ? "warning" : "success"
        },
        {
            id: "queue-withdrawals",
            label: "Pending Withdrawals",
            count: pendingWithdrawalRequests,
            helper: "No pending withdrawal approvals are currently visible.",
            route: "/cash",
            tone: "info"
        },
        {
            id: "queue-members",
            label: "Pending Member Approvals",
            count: pendingMemberApprovals,
            helper: "Member applications requiring branch management decisions.",
            route: "/member-applications",
            tone: pendingMemberApprovals > 0 ? "warning" : "success"
        },
        {
            id: "queue-signoff",
            label: "Tasks Requiring Branch Sign-off",
            count: signOffTasks,
            helper: "Combined approvals and control exceptions needing branch sign-off.",
            route: "/follow-ups",
            tone: signOffTasks > 0 ? "error" : "success"
        }
    ];
    const staffPerformance = useMemo<StaffPerformanceRow[]>(() => {
        const officers = state.staffUsers.filter((user) => user.role === "loan_officer" && user.is_active);

        return officers
            .map((officer) => {
                const officerApplications = branchScopedLoanApplications.filter((application) => application.appraised_by === officer.user_id);
                const issued = officerApplications.filter((application) => ["approved", "disbursed"].includes(application.status)).length;
                const linkedLoanIds = new Set(officerApplications.map((application) => application.loan_id).filter(Boolean) as string[]);
                const linkedLoans = metrics.branchLoans.filter((loan) => linkedLoanIds.has(loan.id));
                const performingLoans = linkedLoans.filter((loan) => loan.status !== "in_arrears").length;
                const collectionRate = linkedLoans.length ? (performingLoans / linkedLoans.length) * 100 : 0;

                return {
                    userId: officer.user_id,
                    officerName: officer.full_name,
                    loansIssued: issued,
                    collectionRate,
                    applicationsProcessed: officerApplications.length
                };
            })
            .sort((left, right) => right.loansIssued - left.loansIssued || right.collectionRate - left.collectionRate)
            .slice(0, 6);
    }, [branchScopedLoanApplications, metrics.branchLoans, state.staffUsers]);
    const tellerDepositAverage = tellerDashboard.timeseries_7d.length
        ? tellerDashboard.kpis.deposit_intake_7d / tellerDashboard.timeseries_7d.length
        : 0;
    const tellerWithdrawalAverage = tellerDashboard.timeseries_7d.length
        ? tellerDashboard.kpis.withdrawal_outflow_7d / tellerDashboard.timeseries_7d.length
        : 0;
    const tellerDailyTicketBaseline = tellerAverageTicketSparkline.length > 1
        ? tellerAverageTicketSparkline.slice(0, -1).reduce((sum, value) => sum + value, 0) / (tellerAverageTicketSparkline.length - 1)
        : 0;
    const tellerNetMovement = tellerDashboard.closing_cash - tellerDashboard.opening_cash;
    const tellerPeakHour = tellerDashboard.hourly_activity.length
        ? tellerDashboard.hourly_activity.slice().sort((left, right) => right.txCount - left.txCount)[0]
        : null;
    const tellerHighTicketCount = tellerDashboard.distribution_today.find((entry) => entry.bucketLabel === "250k+")?.count || 0;
    const tellerAlertCount = tellerDashboard.alerts.filter((alert) => alert.id !== "normal-day").length;
    const tellerCloseChecks =
        (tellerNetMovement < 0 ? 1 : 0)
        + (tellerAlertCount > 0 ? 1 : 0)
        + (tellerHighTicketCount > 0 ? 1 : 0);
    const tellerQueue: OperationalQueueItem[] = [
        {
            id: "teller-queue-high-ticket",
            label: "High Ticket Review",
            count: tellerHighTicketCount,
            helper: "Transactions above TSh 250,000 to validate before end-of-day sign-off.",
            route: "/cash",
            tone: tellerHighTicketCount > 0 ? "warning" : "success"
        },
        {
            id: "teller-queue-alerts",
            label: "Operational Alerts",
            count: tellerAlertCount,
            helper: "Risk and movement alerts generated from today's visible activity.",
            route: "/cash",
            tone: tellerAlertCount > 0 ? "error" : "success"
        },
        {
            id: "teller-queue-counter-pace",
            label: "Counter Throughput",
            count: tellerDashboard.kpis.tx_count_today,
            helper: "Total posted teller transactions today across savings and cash operations.",
            route: "/cash",
            tone: tellerDashboard.kpis.tx_count_today >= 20 ? "warning" : "info"
        },
        {
            id: "teller-queue-close-readiness",
            label: "Close Readiness Checks",
            count: tellerCloseChecks,
            helper: "Outstanding checks from cash movement, high-ticket items, and alert flags.",
            route: "/cash",
            tone: tellerCloseChecks > 0 ? "warning" : "success"
        }
    ];
    const branchTargetReachPercent = memberPerformanceSummary.averageReachPercent;
    const branchTargetProgressValue = Math.min(Math.max(branchTargetReachPercent, 0), 100);
    const targetWatchFilterOptions: Array<{ value: TargetWatchFilter; label: string; count: number }> = [
        {
            value: "needs_action",
            label: "Needs action",
            count: memberPerformanceRows.filter((row) => matchesTargetWatchFilter(row, "needs_action", performanceTargetSettings)).length
        },
        {
            value: "no_activity",
            label: "No activity",
            count: memberPerformanceRows.filter((row) => matchesTargetWatchFilter(row, "no_activity", performanceTargetSettings)).length
        },
        {
            value: "needs_top_up",
            label: "Top-up",
            count: memberPerformanceRows.filter((row) => matchesTargetWatchFilter(row, "needs_top_up", performanceTargetSettings)).length
        },
        {
            value: "building",
            label: "Building",
            count: memberPerformanceRows.filter((row) => matchesTargetWatchFilter(row, "building", performanceTargetSettings)).length
        },
        {
            value: "on_track",
            label: "On track",
            count: memberPerformanceRows.filter((row) => matchesTargetWatchFilter(row, "on_track", performanceTargetSettings)).length
        },
        {
            value: "target_met",
            label: "Met",
            count: memberPerformanceRows.filter((row) => matchesTargetWatchFilter(row, "target_met", performanceTargetSettings)).length
        },
        {
            value: "variance",
            label: "Variance",
            count: memberPerformanceRows.filter((row) => matchesTargetWatchFilter(row, "variance", performanceTargetSettings)).length
        },
        {
            value: "all",
            label: "All",
            count: memberPerformanceRows.length
        }
    ];
    const memberTargetWatchRows = memberPerformanceRows
        .filter((row) => matchesTargetWatchFilter(row, targetWatchFilter, performanceTargetSettings))
        .sort((left, right) => left.reachPercent - right.reachPercent || left.remainingAmount - right.remainingAmount)
        .slice(0, 8);
    const selectedTargetWatchFilter = targetWatchFilterOptions.find((option) => option.value === targetWatchFilter);
    const memberTargetWatchColumns: Column<MemberPerformanceRow>[] = [
        {
            key: "member",
            header: "Member",
            render: (row) => (
                <Stack spacing={0.25}>
                    <Typography variant="body2" fontWeight={800}>{row.memberNo}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.memberName}</Typography>
                </Stack>
            )
        },
        {
            key: "actual",
            header: "Actual",
            render: (row) => formatCurrency(row.actualFormAmount)
        },
        {
            key: "target",
            header: "Annual Target",
            render: (row) => formatCurrency(row.annualTargetAmount)
        },
        {
            key: "level",
            header: "Level",
            render: (row) => (
                <Chip label={row.level} color={row.levelColor} size="small" variant="outlined" />
            )
        },
        {
            key: "remaining",
            header: "Remaining",
            render: (row) => (
                <Typography variant="body2" color={row.remainingAmount < 0 ? "warning.main" : "success.main"} fontWeight={700}>
                    {formatSignedCurrency(row.remainingAmount)}
                </Typography>
            )
        },
        {
            key: "reach",
            header: `% Reach By ${financialYearPeriod.endLabel}`,
            render: (row) => (
                <Stack spacing={0.65} sx={{ minWidth: 130 }}>
                    <Typography variant="caption" color="text.secondary">{row.reachPercent.toFixed(0)}%</Typography>
                    <LinearProgress variant="determinate" value={Math.min(Math.max(row.reachPercent, 0), 100)} sx={{ height: 7, borderRadius: 999 }} />
                </Stack>
            )
        }
    ];
    const branchSavingsPositionTotal = metrics.branchSavings;
    const branchRevenueMixTotal = metrics.branchGrossRevenue;
    const branchSavingsPositionData = {
        labels: branchSavingsPositionTotal > 0 ? ["Savings"] : ["No savings posted"],
        datasets: [{
            data: branchSavingsPositionTotal > 0 ? [metrics.branchSavings] : [1],
            backgroundColor: branchSavingsPositionTotal > 0
                ? [alpha(theme.palette.primary.main, 0.76)]
                : [alpha(theme.palette.text.secondary, 0.18)],
            borderWidth: 0
        }]
    };
    const branchRevenueMixData = {
        labels: branchRevenueMixTotal > 0 ? ["Charges", "Loan income", "Other/mixed"] : ["No revenue posted"],
        datasets: [{
            data: branchRevenueMixTotal > 0
                ? [
                    metrics.branchChargeRevenue,
                    metrics.branchLoanRevenue,
                    Math.max(metrics.branchGrossRevenue - metrics.branchChargeRevenue - metrics.branchLoanRevenue, 0)
                ]
                : [1],
            backgroundColor: branchRevenueMixTotal > 0
                ? [
                    alpha(theme.palette.primary.main, 0.72),
                    alpha(theme.palette.warning.main, 0.72),
                    alpha(theme.palette.secondary.main, 0.72)
                ]
                : [alpha(theme.palette.text.secondary, 0.18)]
        }]
    };

    const commonLineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: "bottom" as const
            }
        },
        scales: {
            x: {
                grid: { display: false }
            },
            y: {
                grid: { color: alpha(theme.palette.text.primary, 0.08) }
            }
        }
    };
    const dashboardAccent = theme.palette.mode === "dark" ? "#D9B273" : theme.palette.primary.main;
    const dashboardAccentStrong = theme.palette.mode === "dark" ? "#C89B52" : theme.palette.primary.dark;

    const role = profile?.role;
    const showPlatformDashboard = isInternalOps;
    const platformMetrics = useMemo(() => {
        return {
            totalTenants: platformState.tenants.length,
            totalBranches: platformState.branches.length,
            requestsPerSec: Number(platformState.systemMetrics?.requests_per_sec || 0),
            p95LatencyMs: Number(platformState.systemMetrics?.p95_latency_ms || 0),
            errorRatePct: Number(platformState.systemMetrics?.error_rate_pct || 0),
            activeUsers: Number(platformState.systemMetrics?.active_users || 0),
            activeTenants: Number(platformState.systemMetrics?.active_tenants || 0),
            smsTotalCount: Number(platformState.systemMetrics?.sms_total_count || 0),
            smsSentCount: Number(platformState.systemMetrics?.sms_sent_count || 0),
            smsFailedCount: Number(platformState.systemMetrics?.sms_failed_count || 0),
            smsDeliveryRatePct: Number(platformState.systemMetrics?.sms_delivery_rate_pct || 0),
            cpuPct: Number(platformState.infrastructure?.cpu_pct || 0),
            memoryPct: Number(platformState.infrastructure?.memory_pct || 0),
            diskPct: Number(platformState.infrastructure?.disk_pct || 0),
            networkMbps: Number(platformState.infrastructure?.network_mbps || 0),
            statusBreakdown: [...platformState.tenants.reduce((accumulator, tenant) => {
                const status = (tenant.status || "active").toLowerCase();
                accumulator.set(status, (accumulator.get(status) || 0) + 1);
                return accumulator;
            }, new Map<string, number>()).entries()].sort(([left], [right]) => left.localeCompare(right)),
            growthTrend: [...platformState.tenants.reduce((accumulator, tenant) => {
                const key = tenant.created_at.slice(0, 7);
                accumulator.set(key, (accumulator.get(key) || 0) + 1);
                return accumulator;
            }, new Map<string, number>()).entries()].sort(([left], [right]) => left.localeCompare(right)).slice(-6),
            topTrafficTenants: platformState.tenantTraffic.slice(0, 6),
            recentErrors: platformState.errors.slice(0, 8),
            slowEndpoints: platformState.slowEndpoints.slice(0, 8)
        };
    }, [platformState]);
    const platformColumns: Column<Tenant>[] = [
        {
            key: "tenant",
            header: "Workspace",
            render: (row) => (
                <Box>
                    <Typography variant="body2" fontWeight={700}>{row.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.registration_number}</Typography>
                </Box>
            )
        },
        {
            key: "status",
            header: "Status",
            render: (row) => (row.status || "active").replace(/_/g, " ")
        },
        {
            key: "branches",
            header: "Branches",
            render: (row) => String(platformState.branches.filter((branch) => branch.tenant_id === row.id).length)
        },
        { key: "created", header: "Created", render: (row) => formatDate(row.created_at) }
    ];
    const platformTrafficColumns: Column<PlatformTenantTrafficRow>[] = [
        {
            key: "tenant_name",
            header: "Workspace",
            render: (row) => (
                <Stack spacing={0.25}>
                    <Typography variant="body2" fontWeight={700}>{row.tenant_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.tenant_id}</Typography>
                </Stack>
            )
        },
        { key: "request_count", header: "Requests", render: (row) => row.request_count.toLocaleString() },
        { key: "error_count", header: "Errors", render: (row) => row.error_count.toLocaleString() },
        {
            key: "sms_usage",
            header: "SMS Sent / Total",
            render: (row) => `${Number(row.sms_sent_count || 0).toLocaleString()} / ${Number(row.sms_total_count || 0).toLocaleString()}`
        },
        {
            key: "sms_failed_count",
            header: "SMS Failed",
            render: (row) => Number(row.sms_failed_count || 0).toLocaleString()
        },
        { key: "avg_latency_ms", header: "Avg Latency", render: (row) => `${row.avg_latency_ms.toFixed(1)} ms` },
        { key: "active_users", header: "Active Users", render: (row) => row.active_users.toLocaleString() }
    ];
    const platformErrorColumns: Column<PlatformErrorRow>[] = [
        { key: "timestamp", header: "Time", render: (row) => formatDate(row.timestamp) },
        { key: "endpoint", header: "Endpoint", render: (row) => row.endpoint },
        {
            key: "status_code",
            header: "Status",
            render: (row) => (
                <Chip
                    size="small"
                    label={String(row.status_code)}
                    color={row.status_code >= 500 ? "error" : "warning"}
                    variant="outlined"
                />
            )
        },
        {
            key: "tenant_id",
            header: "Workspace",
            render: (row) => row.tenant_name || row.tenant_id || "System"
        },
        { key: "message", header: "Error", render: (row) => row.message }
    ];
    const platformSlowColumns: Column<PlatformSlowEndpointRow>[] = [
        { key: "endpoint", header: "Endpoint", render: (row) => row.endpoint },
        { key: "avg_latency_ms", header: "Avg Latency", render: (row) => `${row.avg_latency_ms.toFixed(1)} ms` },
        { key: "calls", header: "Calls", render: (row) => row.calls.toLocaleString() }
    ];

    const roleMetrics: RoleMetric[] = role === "loan_officer"
            ? [
                { label: "Active Loans", value: String(metrics.branchLoans.length) },
                { label: "Overdue Loans", value: String(metrics.branchOverdueLoans) },
                { label: "Outstanding Portfolio", value: formatCurrency(metrics.branchOutstanding) }
            ]
            : role === "branch_manager"
                ? [
                    { label: "Branch Savings", value: formatCurrency(metrics.branchSavings) },
                    { label: "Branch Loan Portfolio", value: formatCurrency(metrics.branchOutstanding) },
                    { label: "Active Members", value: String(metrics.branchActiveMembers) }
                ]
                : role === "auditor"
                    ? [
                        { label: "Members Reviewed", value: String(metrics.totalMembers) },
                        { label: "Overdue Schedules", value: String(metrics.overdueSchedules) },
                        { label: "Accrued Interest", value: formatCurrency(metrics.accruedInterest) }
                    ]
                    : [
                        { label: "Total Members", value: String(metrics.totalMembers) },
                        { label: "Savings Balance", value: formatCurrency(metrics.totalDeposits - metrics.totalWithdrawals) },
                        { label: "Loan Portfolio", value: formatCurrency(metrics.outstandingLoans) },
                        { label: "PAR Signals", value: `${metrics.overdueLoans} overdue loans` }
                    ];
    const branchDashboardCashInToday = metrics.branchCashControlRows ? metrics.branchCashControlInflowToday : metrics.branchInflowsToday;
    const branchDashboardCashOutToday = metrics.branchCashControlRows ? metrics.branchCashControlOutflowToday : metrics.branchOutflowsToday;
    const branchDashboardCashNetToday = metrics.branchCashControlRows ? metrics.branchCashControlNetToday : metrics.branchNetToday;

    if (loading) {
        return <DashboardLoadingState />;
    }

    if (error) {
        return <Alert severity="error" variant="outlined">{error}</Alert>;
    }

    return (
        <Stack spacing={3}>
            <DashboardHero
                eyebrow={showPlatformDashboard ? "Platform oversight" : "Staff workspace"}
                title={`${showPlatformDashboard ? "Platform Owner" : formatRole(role || "staff")} Dashboard`}
                subtitle={showPlatformDashboard
                    ? "Platform oversight for workspace operations, service health, and rollout visibility."
                    : `${selectedTenantName || selectedTenantId} operations summary with branch scope ${branchIds.length || "all"}.`}
                actions={(
                    <>
                        <Chip
                            label={showPlatformDashboard ? "Platform Owner" : role ? formatRole(role) : "Internal Ops"}
                            sx={{
                                bgcolor: alpha(crestGold.main, 0.18),
                                color: crestGold.light,
                                fontWeight: 700,
                                border: `1px solid ${alpha(crestGold.main, 0.35)}`
                            }}
                        />
                        {supplementalLoading ? (
                            <Chip
                                label="Refreshing workflow data..."
                                size="small"
                                sx={{ bgcolor: alpha("#FFFFFF", 0.1), color: alpha("#FFFFFF", 0.8) }}
                            />
                        ) : null}
                    </>
                )}
            />

            {showPlatformDashboard ? (
                <>
                    <MotionSection inView>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <MetricCard label="Total Workspaces" value={String(platformMetrics.totalTenants)} helper="All managed SACCO workspaces in this deployment." />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <MetricCard label="Active Workspaces" value={String(platformMetrics.activeTenants)} helper="Workspaces currently active in the live metrics window." />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <MetricCard label="Network Branches" value={String(platformMetrics.totalBranches)} helper="Operational branches across managed SACCO workspaces." />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <MetricCard label="Active Users" value={String(platformMetrics.activeUsers)} helper="Signed-in users across current workspace activity." />
                        </Grid>
                    </Grid>
                    </MotionSection>

                    <MotionSection inView>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <MetricCard
                                label="API Throughput"
                                value={`${platformMetrics.requestsPerSec.toFixed(2)} req/s`}
                                helper="Current system-wide request rate."
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <MetricCard
                                label="API p95 Latency"
                                value={`${platformMetrics.p95LatencyMs.toFixed(1)} ms`}
                                helper="Current p95 latency from platform telemetry."
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <MetricCard
                                label="Error Rate"
                                value={`${platformMetrics.errorRatePct.toFixed(2)}%`}
                                helper="Server-side API error ratio."
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <MetricCard
                                label="Active Users / Workspaces"
                                value={`${platformMetrics.activeUsers} / ${platformMetrics.activeTenants}`}
                                helper="Real active load in the current metrics window."
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <MetricCard
                                label="SMS Sent / Total"
                                value={`${platformMetrics.smsSentCount.toLocaleString()} / ${platformMetrics.smsTotalCount.toLocaleString()}`}
                                helper="Workspace SMS dispatch volume in the same metrics window."
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <MetricCard
                                label="SMS Delivery Rate"
                                value={`${platformMetrics.smsDeliveryRatePct.toFixed(2)}%`}
                                helper={`${platformMetrics.smsFailedCount.toLocaleString()} failed SMS dispatches.`}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <MetricCard
                                label="CPU Usage"
                                value={`${platformMetrics.cpuPct.toFixed(2)}%`}
                                helper="Host compute utilization."
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <MetricCard
                                label="RAM Usage"
                                value={`${platformMetrics.memoryPct.toFixed(2)}%`}
                                helper="Current memory pressure."
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <MetricCard
                                label="Disk Usage"
                                value={`${platformMetrics.diskPct.toFixed(2)}%`}
                                helper="Persistent storage consumption."
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <MetricCard
                                label="Network Throughput"
                                value={`${platformMetrics.networkMbps.toFixed(2)} Mbps`}
                                helper="Approximate network throughput."
                            />
                        </Grid>
                    </Grid>
                    </MotionSection>

                    <MotionSection inView>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, lg: 7 }}>
                            <ChartPanel
                                title="Workspace Growth"
                                subtitle="Recent onboarding volume across managed SACCO workspaces."
                                type="bar"
                                data={{
                                    labels: platformMetrics.growthTrend.map(([label]) => label),
                                    datasets: [{
                                        label: "Workspaces",
                                        data: platformMetrics.growthTrend.map(([, value]) => value),
                                        backgroundColor: alpha(theme.palette.primary.main, 0.72)
                                    }]
                                }}
                                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, lg: 5 }}>
                            <ChartPanel
                                title="Workspace Status Mix"
                                subtitle="Operational status distribution across managed SACCO workspaces."
                                type="doughnut"
                                data={{
                                    labels: platformMetrics.statusBreakdown.map(([status]) => status.replace(/_/g, " ").toUpperCase()),
                                    datasets: [{
                                        data: platformMetrics.statusBreakdown.map(([, count]) => count),
                                        backgroundColor: [
                                            alpha(theme.palette.grey[500], 0.85),
                                            theme.palette.primary.main,
                                            theme.palette.secondary.main,
                                            alpha(theme.palette.success.main, 0.85),
                                            alpha(theme.palette.warning.main, 0.85),
                                            alpha(theme.palette.error.main, 0.85)
                                        ]
                                    }]
                                }}
                                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }}
                            />
                        </Grid>
                    </Grid>
                    </MotionSection>

                    <MotionCard variant="outlined" inView>
                        <CardContent>
                            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 1 }}>
                                <Typography variant="h6">Workspace Inventory</Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => navigate("/platform/operations")}
                                >
                                    Open Operations Control Room
                                </Button>
                            </Stack>
                            <DataTable
                                rows={platformState.tenants.slice(0, 8)}
                                columns={platformColumns}
                                emptyMessage="No SACCO workspaces available in this deployment."
                            />
                        </CardContent>
                    </MotionCard>

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, xl: 6 }}>
                            <MotionCard variant="outlined" inView>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Top Workspace Traffic</Typography>
                                    <DataTable
                                        rows={platformMetrics.topTrafficTenants}
                                        columns={platformTrafficColumns}
                                        emptyMessage="No workspace traffic metrics available yet."
                                    />
                                </CardContent>
                            </MotionCard>
                        </Grid>
                        <Grid size={{ xs: 12, xl: 6 }}>
                            <MotionCard variant="outlined" inView>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Slow Endpoints</Typography>
                                    <DataTable
                                        rows={platformMetrics.slowEndpoints}
                                        columns={platformSlowColumns}
                                        emptyMessage="No slow endpoint telemetry available."
                                    />
                                </CardContent>
                            </MotionCard>
                        </Grid>
                    </Grid>

                    <MotionCard variant="outlined" inView>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Recent API Errors</Typography>
                            <DataTable
                                rows={platformMetrics.recentErrors}
                                columns={platformErrorColumns}
                                emptyMessage="No recent API errors detected."
                            />
                        </CardContent>
                    </MotionCard>
                </>
            ) : null}

            {!showPlatformDashboard && role === "teller" ? (
                <MotionSection inView>
                <Stack spacing={2}>
                    <MotionCard
                        variant="outlined"
                        inView
                        sx={{
                            borderRadius: 2,
                            color: "text.primary",
                            background: theme.palette.mode === "dark"
                                ? `linear-gradient(135deg, ${alpha("#1B2535", 0.92)}, ${alpha("#D9B273", 0.16)})`
                                : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.background.paper, 0.97)})`
                        }}
                    >
                        <CardContent sx={{ p: { xs: 2.25, md: 2.75 } }}>
                            <Stack spacing={2}>
                                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary">
                                            Teller command center
                                        </Typography>
                                        <Typography variant="h5" sx={{ mt: 0.5 }}>
                                            Counter performance, cash position, and close readiness
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 760 }}>
                                            Monitor today's teller activity, resolve high-risk transaction patterns quickly, and complete close checks with confidence.
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="flex-start">
                                        <Chip
                                            label={`${tellerDashboard.kpis.tx_count_today} transaction(s) today`}
                                            color={tellerDashboard.kpis.tx_count_today >= 20 ? "warning" : "success"}
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={tellerPeakHour ? `Peak ${tellerPeakHour.hour}` : "No peak hour yet"}
                                            color={tellerPeakHour && tellerPeakHour.txCount >= 5 ? "warning" : "default"}
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={tellerNetMovement >= 0 ? `Net +${formatCurrency(tellerNetMovement)}` : `Net ${formatCurrency(tellerNetMovement)}`}
                                            color={tellerNetMovement >= 0 ? "success" : "error"}
                                            variant="outlined"
                                        />
                                    </Stack>
                                </Stack>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                                    <Button
                                        variant="contained"
                                        onClick={() => navigate("/cash")}
                                        startIcon={<PaymentsRoundedIcon />}
                                        sx={theme.palette.mode === "dark" ? { bgcolor: dashboardAccent, color: "#1a1a1a", "&:hover": { bgcolor: dashboardAccentStrong } } : undefined}
                                    >
                                        Post Transaction
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => navigate("/members")}
                                        startIcon={<BadgeRoundedIcon />}
                                        sx={theme.palette.mode === "dark" ? { borderColor: alpha(dashboardAccent, 0.44), color: dashboardAccent, "&:hover": { borderColor: alpha(dashboardAccent, 0.78), bgcolor: alpha(dashboardAccent, 0.1) } } : undefined}
                                    >
                                        Member Lookup
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </MotionCard>

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <KpiCard
                                label="Teller Position"
                                value={tellerDashboard.kpis.teller_position}
                                deltaLabel={buildDeltaLabel(
                                    tellerDashboard.closing_cash,
                                    tellerDashboard.opening_cash,
                                    "vs opening"
                                )}
                                statusLabel={tellerDashboard.closing_cash >= tellerDashboard.opening_cash ? "Positive cash movement" : "Net outflow watch"}
                                sparkline={tellerDashboard.timeseries_7d.map((entry) => entry.deposits - entry.withdrawals)}
                                tone={getDeltaTone(tellerDashboard.closing_cash, tellerDashboard.opening_cash)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <KpiCard
                                label="Deposits Today"
                                value={tellerDashboard.kpis.deposits_today}
                                deltaLabel={buildDeltaLabel(
                                    tellerDashboard.kpis.deposits_today,
                                    tellerDepositAverage,
                                    "vs 7-day avg"
                                )}
                                statusLabel={tellerDashboard.kpis.deposits_today >= tellerDepositAverage ? "Strong intake" : "Below intake run-rate"}
                                sparkline={tellerDashboard.timeseries_7d.map((entry) => entry.deposits)}
                                tone={getDeltaTone(tellerDashboard.kpis.deposits_today, tellerDepositAverage)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <KpiCard
                                label="Withdrawals Today"
                                value={tellerDashboard.kpis.withdrawals_today}
                                deltaLabel={buildDeltaLabel(
                                    tellerDashboard.kpis.withdrawals_today,
                                    tellerWithdrawalAverage,
                                    "vs 7-day avg"
                                )}
                                statusLabel={tellerDashboard.kpis.withdrawals_today <= tellerWithdrawalAverage ? "Managed outflow" : "High withdrawal spike"}
                                sparkline={tellerDashboard.timeseries_7d.map((entry) => entry.withdrawals)}
                                tone={getDeltaTone(
                                    tellerDashboard.kpis.withdrawals_today,
                                    tellerWithdrawalAverage,
                                    false
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <KpiCard
                                label="Avg Ticket Today"
                                value={tellerDashboard.kpis.avg_ticket_today}
                                deltaLabel={buildDeltaLabel(
                                    tellerDashboard.kpis.avg_ticket_today,
                                    tellerDailyTicketBaseline,
                                    "vs recent avg"
                                )}
                                statusLabel={tellerDashboard.kpis.tx_count_today >= 12 ? "Active counter day" : "Moderate transaction pace"}
                                sparkline={tellerAverageTicketSparkline}
                                tone={getDeltaTone(tellerDashboard.kpis.avg_ticket_today, tellerDailyTicketBaseline)}
                            />
                        </Grid>
                    </Grid>
                </Stack>
                </MotionSection>
            ) : role === "loan_officer" ? (
                <MotionSection inView>
                <Stack spacing={2}>
                    <MotionCard
                        variant="outlined"
                        inView
                        sx={{
                            borderRadius: 2,
                            color: "text.primary",
                            background: theme.palette.mode === "dark"
                                ? `linear-gradient(135deg, ${alpha("#1B2535", 0.92)}, ${alpha("#D9B273", 0.16)})`
                                : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.background.paper, 0.97)})`
                        }}
                    >
                        <CardContent sx={{ p: { xs: 2.25, md: 2.75 } }}>
                            <Stack spacing={2}>
                                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary">
                                            Loan officer workspace
                                        </Typography>
                                        <Typography variant="h5" sx={{ mt: 0.5 }}>
                                            Portfolio control, collections, and disbursement execution
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 760 }}>
                                            Focus your day on appraisal pipeline decisions, overdue collection priorities, and timely disbursement follow-through.
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="flex-start">
                                        <Chip
                                            label={`PAR ${par30Percent.toFixed(1)}%`}
                                            color={par30Percent >= 15 ? "error" : par30Percent >= 8 ? "warning" : "success"}
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={`${branchFollowUps.length} follow-up item(s)`}
                                            color={branchFollowUps.length > 0 ? "warning" : "success"}
                                            variant="outlined"
                                        />
                                    </Stack>
                                </Stack>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                                    <Button
                                        variant="contained"
                                        onClick={() => navigate("/loans")}
                                        startIcon={<RequestQuoteRoundedIcon />}
                                        sx={theme.palette.mode === "dark" ? { bgcolor: dashboardAccent, color: "#1a1a1a", "&:hover": { bgcolor: dashboardAccentStrong } } : undefined}
                                    >
                                        Open Loan Pipeline
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => navigate("/follow-ups")}
                                        startIcon={<AssignmentTurnedInRoundedIcon />}
                                        sx={theme.palette.mode === "dark" ? { borderColor: alpha(dashboardAccent, 0.44), color: dashboardAccent, "&:hover": { borderColor: alpha(dashboardAccent, 0.78), bgcolor: alpha(dashboardAccent, 0.1) } } : undefined}
                                    >
                                        Collections Queue
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => navigate("/member-applications")}
                                        startIcon={<BadgeRoundedIcon />}
                                        sx={theme.palette.mode === "dark" ? { borderColor: alpha(dashboardAccent, 0.44), color: dashboardAccent, "&:hover": { borderColor: alpha(dashboardAccent, 0.78), bgcolor: alpha(dashboardAccent, 0.1) } } : undefined}
                                    >
                                        Member Applications
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </MotionCard>

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <BranchManagerTopCard
                                label="Loans Under Management"
                                value={String(metrics.branchLoans.length)}
                                helper="Active and disbursed facilities assigned to your operational scope."
                                status={`${metrics.branchOverdueLoans} overdue loan(s)`}
                                tone={metrics.branchOverdueLoans > 0 ? "negative" : "positive"}
                                icon={<RequestQuoteRoundedIcon fontSize="small" />}
                                featured
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <BranchManagerTopCard
                                label="Outstanding Book"
                                value={formatCurrencyCompact(metrics.branchOutstanding)}
                                valueTooltip={formatCurrency(metrics.branchOutstanding)}
                                helper="Total principal and accrued value currently supervised by loan operations."
                                status={metrics.branchOutstanding > 0 ? "Live portfolio" : "No active exposure"}
                                tone="neutral"
                                icon={<PaymentsRoundedIcon fontSize="small" />}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <BranchManagerTopCard
                                label="Repayment Pressure"
                                value={formatCurrencyCompact(metrics.branchOverdueOutstanding)}
                                valueTooltip={formatCurrency(metrics.branchOverdueOutstanding)}
                                helper="Outstanding from loans formally in arrears that need collection."
                                status={`${overdueScheduleCount} loan(s) in arrears`}
                                tone={overdueScheduleCount > 0 ? "negative" : "positive"}
                                icon={<PieChartRoundedIcon fontSize="small" />}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                            <BranchManagerTopCard
                                label="Pending Appraisals"
                                value={String(pendingLoanApplications)}
                                helper="Submitted and appraised applications still waiting officer movement."
                                status={pendingLoanApplications > 0 ? "Action required" : "Pipeline clear"}
                                tone={pendingLoanApplications > 0 ? "neutral" : "positive"}
                                icon={<BadgeRoundedIcon fontSize="small" />}
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        {loanOfficerRiskStrip.map((item) => (
                            <Grid key={item.id} size={{ xs: 12, sm: 6, xl: 3 }}>
                                <RiskStripCard
                                    label={item.label}
                                    value={item.value}
                                    helper={item.helper}
                                    tone={item.tone}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Stack>
                </MotionSection>
            ) : role === "branch_manager" ? (
                <MotionSection inView>
                <Stack spacing={2}>
                    <MotionCard
                        variant="outlined"
                        inView
                        sx={{
                            borderRadius: 2,
                            color: "text.primary",
                            background: theme.palette.mode === "dark"
                                ? `linear-gradient(135deg, ${alpha("#1B2535", 0.92)}, ${alpha("#D9B273", 0.14)})`
                                : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.background.paper, 0.95)})`
                        }}
                    >
                        <CardContent sx={{ p: 1.75 }}>
                            <Stack spacing={1.75}>
                                <Stack direction={{ xs: "column", lg: "row" }} spacing={2} justifyContent="space-between">
                                    <Stack spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                            <Chip label={`SACCO year ${financialYearPeriod.startLabel} - ${financialYearPeriod.endLabel}`} color="primary" variant="outlined" />
                                            <Chip label={`${metrics.branchActiveMembers}/${metrics.branchMembers} active`} variant="outlined" />
                                            <Chip
                                                label={par30Percent >= 8 ? `PAR ${par30Percent.toFixed(1)}% watch` : `PAR ${par30Percent.toFixed(1)}% healthy`}
                                                color={par30Percent >= 15 ? "error" : par30Percent >= 8 ? "warning" : "success"}
                                                variant="outlined"
                                            />
                                        </Stack>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                            {selectedTenantName || "SACCO"} operating pulse
                                        </Typography>
                                        <Box>
                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-end" spacing={1.5}>
                                                <Typography variant="overline" color="text.secondary">Annual target</Typography>
                                                <Typography
                                                    sx={{
                                                        fontSize: "1.45rem",
                                                        fontVariantNumeric: "tabular-nums",
                                                        fontWeight: 800,
                                                        lineHeight: 1,
                                                        letterSpacing: "-0.02em",
                                                        color: branchTargetReachPercent >= 100
                                                            ? "success.main"
                                                            : branchTargetReachPercent >= 60
                                                                ? "info.main"
                                                                : "warning.main"
                                                    }}
                                                >
                                                    {branchTargetReachPercent.toFixed(0)}%
                                                </Typography>
                                            </Stack>
                                            <LinearProgress
                                                variant="determinate"
                                                value={branchTargetProgressValue}
                                                sx={{
                                                    mt: 1,
                                                    height: 10,
                                                    borderRadius: 999,
                                                    bgcolor: alpha(theme.palette.text.primary, 0.1),
                                                    "& .MuiLinearProgress-bar": {
                                                        bgcolor: branchTargetReachPercent >= 100
                                                            ? theme.palette.success.main
                                                            : branchTargetReachPercent >= 60
                                                                ? theme.palette.info.main
                                                                : theme.palette.warning.main
                                                    }
                                                }}
                                            />
                                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, gap: 2, mt: 2 }}>
                                                {[
                                                    { label: "Actual", value: formatCurrencyCompact(memberPerformanceSummary.totalActualForm), full: formatCurrency(memberPerformanceSummary.totalActualForm), color: "success.main" },
                                                    { label: "Target", value: formatCurrencyCompact(memberPerformanceSummary.totalAnnualTarget), full: formatCurrency(memberPerformanceSummary.totalAnnualTarget), color: "text.primary" },
                                                    {
                                                        label: "Remaining",
                                                        value: formatSignedCurrencyCompact(memberPerformanceSummary.totalRemainingAmount),
                                                        full: formatSignedCurrency(memberPerformanceSummary.totalRemainingAmount),
                                                        color: memberPerformanceSummary.totalRemainingAmount < 0 ? "warning.main" : "text.primary"
                                                    }
                                                ].map((stat) => (
                                                    <Box key={stat.label} sx={{ minWidth: 0 }}>
                                                        <Typography variant="overline" color="text.secondary" sx={{ display: "block", lineHeight: 1.4, letterSpacing: "0.08em" }}>
                                                            {stat.label}
                                                        </Typography>
                                                        <Typography title={stat.full} sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", lineHeight: 1.2, color: stat.color }}>
                                                            {stat.value}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>
                                    </Stack>

                                    <Box
                                        sx={{
                                            flex: { xs: "1 1 auto", lg: "0 0 360px" },
                                            border: "1px solid",
                                            borderColor: "divider",
                                            borderRadius: 1.5,
                                            p: 1.75,
                                            bgcolor: alpha(theme.palette.background.paper, 0.72)
                                        }}
                                    >
                                        <Stack spacing={1.15}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography variant="subtitle2">Cash control today</Typography>
                                                <Chip
                                                    size="small"
                                                    label={metrics.branchCashControlVarianceToday ? "Variance" : "Balanced"}
                                                    color={metrics.branchCashControlVarianceToday ? "error" : "success"}
                                                    variant="outlined"
                                                />
                                            </Stack>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2" color="text.secondary">Cash in</Typography>
                                                <Typography variant="body2" fontWeight={700} title={formatCurrency(branchDashboardCashInToday)}>{formatCurrencyCompact(branchDashboardCashInToday)}</Typography>
                                            </Stack>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2" color="text.secondary">Cash out</Typography>
                                                <Typography variant="body2" fontWeight={700} title={formatCurrency(branchDashboardCashOutToday)}>{formatCurrencyCompact(branchDashboardCashOutToday)}</Typography>
                                            </Stack>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2" color="text.secondary">Net</Typography>
                                                <Typography variant="body2" fontWeight={800} title={formatCurrency(branchDashboardCashNetToday)} color={branchDashboardCashNetToday >= 0 ? "success.main" : "error.main"}>
                                                    {formatCurrencyCompact(branchDashboardCashNetToday)}
                                                </Typography>
                                            </Stack>
                                            <Divider />
                                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                <Chip size="small" label={`${metrics.branchCashControlReceiptsToday} receipt(s)`} variant="outlined" />
                                                <Chip size="small" label={`${metrics.branchCashControlOpenSessions} open session(s)`} color={metrics.branchCashControlOpenSessions ? "warning" : "default"} variant="outlined" />
                                            </Stack>
                                        </Stack>
                                    </Box>
                                </Stack>

                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                                    <Button size="small" variant="contained" onClick={() => navigate("/cash-control")} startIcon={<ReceiptLongRoundedIcon />}>
                                        Cash Control
                                    </Button>
                                    <Button size="small" variant="outlined" onClick={() => navigate("/revenue")} startIcon={<PaymentsRoundedIcon />}>
                                        Revenue
                                    </Button>
                                    <Button size="small" variant="outlined" onClick={() => navigate("/loans")} startIcon={<RequestQuoteRoundedIcon />}>
                                        Loans
                                    </Button>
                                    <Button size="small" variant="outlined" onClick={() => navigate("/dividends")} startIcon={<AccountBalanceWalletRoundedIcon />}>
                                        Dividends
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </MotionCard>

                    <Grid container spacing={2} columns={10}>
                        <Grid size={{ xs: 10, sm: 5, lg: 2 }}>
                            <BranchManagerTopCard
                                label="Savings"
                                value={formatCurrencyCompact(metrics.branchSavings)}
                                valueTooltip={formatCurrency(metrics.branchSavings)}
                                helper="Operational member balance used for targets, borrowing context, and dashboard totals."
                                status="Savings book"
                                tone="positive"
                                icon={<AccountBalanceWalletRoundedIcon fontSize="small" />}
                                featured
                            />
                        </Grid>
                        <Grid size={{ xs: 10, sm: 5, lg: 2 }}>
                            <BranchManagerTopCard
                                label="Gross Revenue"
                                value={formatCurrencyCompact(metrics.branchGrossRevenue)}
                                valueTooltip={formatCurrency(metrics.branchGrossRevenue)}
                                helper="Posted income ledger revenue for the SACCO year."
                                status={`${metrics.branchRevenuePostedLines} posted line(s)`}
                                tone={metrics.branchGrossRevenue > 0 ? "positive" : "neutral"}
                                icon={<PaymentsRoundedIcon fontSize="small" />}
                            />
                        </Grid>
                        <Grid size={{ xs: 10, sm: 5, lg: 2 }}>
                            <BranchManagerTopCard
                                label="Loan Book"
                                value={formatCurrencyCompact(metrics.branchOutstanding)}
                                valueTooltip={formatCurrency(metrics.branchOutstanding)}
                                helper="Outstanding principal under branch supervision."
                                status={`${metrics.branchOverdueLoans} overdue loan(s)`}
                                tone={metrics.branchOverdueLoans > 0 ? "negative" : "neutral"}
                                icon={<RequestQuoteRoundedIcon fontSize="small" />}
                            />
                        </Grid>
                        <Grid size={{ xs: 10, sm: 5, lg: 2 }}>
                            <BranchManagerTopCard
                                label="Dividends"
                                value={formatCurrencyCompact(metrics.branchDividendsPosted)}
                                valueTooltip={formatCurrency(metrics.branchDividendsPosted)}
                                helper="Manual Excel-style dividend batches already posted."
                                status={`${formatCurrency(metrics.branchDividendsPending)} pending`}
                                tone={metrics.branchDividendsPending > 0 ? "neutral" : "positive"}
                                icon={<ReceiptLongRoundedIcon fontSize="small" />}
                            />
                        </Grid>
                        <Grid size={{ xs: 10, sm: 5, lg: 2 }}>
                            <BranchManagerTopCard
                                label="Action Items"
                                value={String(signOffTasks)}
                                helper="Approvals, overdue schedules, and cash exceptions that need action."
                                status={signOffTasks > 0 ? "Action required" : "No blockers"}
                                tone={signOffTasks > 0 ? "negative" : "positive"}
                                icon={<RuleRoundedIcon fontSize="small" />}
                            />
                        </Grid>
                    </Grid>

                    <MotionCard variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Stack spacing={2}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap>
                                    <Box>
                                        <Typography variant="h6" fontWeight={700}>Funding sources</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Inflow by source
                                        </Typography>
                                    </Box>
                                    {fundingSources?.available && fundingSources.total > 0 ? (
                                        <Chip color="primary" label={formatCurrency(fundingSources.total)} />
                                    ) : null}
                                </Stack>

                                {!fundingSources ? (
                                    <Typography variant="body2" color="text.secondary">Loading funding sources…</Typography>
                                ) : !fundingSources.available ? (
                                    <Alert severity="info">
                                        Source tracking isn't enabled yet. Apply migration 104 and re-import history with the <strong>source</strong> column to see the M-KOBA / NMB / UTT / loan breakdown here.
                                    </Alert>
                                ) : fundingSources.sources.length === 0 ? (
                                    <Alert severity="info">
                                        No source-tagged movements yet{fundingSources.untagged_total > 0 ? ` — ${formatCurrency(fundingSources.untagged_total)} posted without a source.` : "."}
                                    </Alert>
                                ) : (
                                    <Stack spacing={1.75}>
                                        {fundingSources.sources.map((s) => (
                                            <Box key={s.code}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="baseline" flexWrap="wrap" useFlexGap>
                                                    <Typography variant="body2" fontWeight={600}>{s.label}</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {formatCurrency(s.total)} · {s.percent}% · {s.count} txn
                                                    </Typography>
                                                </Stack>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={Math.min(s.percent, 100)}
                                                    sx={{ height: 8, borderRadius: 999, mt: 0.5 }}
                                                />
                                            </Box>
                                        ))}
                                        {fundingSources.untagged_total > 0 ? (
                                            <Typography variant="caption" color="text.secondary">
                                                {formatCurrency(fundingSources.untagged_total)} posted without a source tag (imported before source tracking was enabled).
                                            </Typography>
                                        ) : null}
                                    </Stack>
                                )}
                            </Stack>
                        </CardContent>
                    </MotionCard>

                    <Grid container spacing={2}>
                        {branchRiskStrip.map((item) => (
                            <Grid key={item.id} size={{ xs: 12, sm: 6, lg: 3 }}>
                                <RiskStripCard
                                    label={item.label}
                                    value={item.value}
                                    helper={item.helper}
                                    tone={item.tone}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Stack>
                </MotionSection>
            ) : (
                <MotionSection inView>
                <Grid container spacing={2}>
                    {roleMetrics.map((metric) => (
                        <Grid key={metric.label} size={{ xs: 12, sm: 6, md: 3 }}>
                            <MetricCard label={metric.label} value={metric.value} helper={metric.helper} />
                        </Grid>
                    ))}
                </Grid>
                </MotionSection>
            )}

            {!showPlatformDashboard ? (
            <MotionSection inView>
            <Grid container spacing={2}>
                {role === "teller" ? (
                    <>
                        <Grid size={{ xs: 12, lg: 7 }}>
                            <CashFlowChart points={tellerDashboard.timeseries_7d} />
                        </Grid>
                        <Grid size={{ xs: 12, lg: 5 }}>
                            <MotionCard variant="outlined" inView sx={{ height: "100%" }}>
                                <CardContent sx={{ height: "100%" }}>
                                    <Stack spacing={2.25} sx={{ height: "100%" }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography variant="h6">Teller Action Queue</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Priority checks and operational tasks to clear before close.
                                                </Typography>
                                            </Box>
                                            <Button size="small" variant="outlined" onClick={() => navigate("/cash")}>
                                                Open cash desk
                                            </Button>
                                        </Stack>
                                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                            <Chip
                                                icon={<WarningAmberRoundedIcon />}
                                                label={tellerCloseChecks > 0 ? `${tellerCloseChecks} close check(s) open` : "Close checks clear"}
                                                color={tellerCloseChecks > 0 ? "warning" : "success"}
                                                variant="outlined"
                                            />
                                            <Chip
                                                label={tellerPeakHour ? `Peak load ${tellerPeakHour.hour}` : "No peak load detected"}
                                                color={tellerPeakHour && tellerPeakHour.txCount >= 5 ? "warning" : "default"}
                                                variant="outlined"
                                            />
                                        </Stack>
                                        <Grid container spacing={1.25}>
                                            {tellerQueue.map((item) => (
                                                <Grid key={item.id} size={{ xs: 12, sm: 6 }}>
                                                    <OperationalQueueCard item={item} onOpen={(route) => navigate(route)} />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Stack>
                                </CardContent>
                            </MotionCard>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                            <WaterfallCard
                                openingCash={tellerDashboard.opening_cash}
                                deposits={tellerDashboard.kpis.deposits_today}
                                withdrawals={tellerDashboard.kpis.withdrawals_today}
                                closingCash={tellerDashboard.closing_cash}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                            <DistributionChart points={tellerDashboard.distribution_today} />
                        </Grid>
                        <Grid size={{ xs: 12, lg: 4 }}>
                            <AlertsPanel
                                alerts={tellerDashboard.alerts}
                                hourlyActivity={tellerDashboard.hourly_activity}
                            />
                        </Grid>
                    </>
                ) : role === "loan_officer" ? (
                    <>
                        <Grid size={{ xs: 12, lg: 7 }}>
                            <ChartPanel
                                title="Loan Disbursement Trend"
                                subtitle="Monthly disbursement volume across the branch portfolio you supervise."
                                data={{
                                    labels: branchLoanTrend.map(([label]) => label),
                                    datasets: [
                                        {
                                            label: "Loan principal",
                                            data: branchLoanTrend.map(([, value]) => value),
                                            borderColor: theme.palette.primary.main,
                                            backgroundColor: alpha(theme.palette.primary.main, 0.18)
                                        }
                                    ]
                                }}
                                options={commonLineOptions}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, lg: 5 }}>
                            <ChartPanel
                                title="Overdue Mix"
                                type="doughnut"
                                data={{
                                    labels: branchAgingBuckets.map(([label]) => label),
                                    datasets: [{
                                        data: branchAgingBuckets.map(([, value]) => value),
                                        backgroundColor: [
                                            theme.palette.success.main,
                                            theme.palette.error.main,
                                            theme.palette.warning.main
                                        ]
                                    }]
                                }}
                                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, lg: 7 }}>
                            <MotionCard variant="outlined" inView sx={{ height: "100%" }}>
                                <CardContent sx={{ height: "100%" }}>
                                    <Stack spacing={2.25} sx={{ height: "100%" }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography variant="h6">Officer Action Queue</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Prioritized workflow items to clear pipeline and protect portfolio quality.
                                                </Typography>
                                            </Box>
                                            <Button size="small" variant="outlined" onClick={() => navigate("/loans")}>
                                                View loans
                                            </Button>
                                        </Stack>
                                        <Grid container spacing={1.25}>
                                            {loanOfficerQueue.map((item) => (
                                                <Grid key={item.id} size={{ xs: 12, sm: 6 }}>
                                                    <OperationalQueueCard item={item} onOpen={(route) => navigate(route)} />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Stack>
                                </CardContent>
                            </MotionCard>
                        </Grid>
                        <Grid size={{ xs: 12, lg: 5 }}>
                            <MotionCard variant="outlined" inView sx={{ height: "100%" }}>
                                <CardContent sx={{ height: "100%" }}>
                                    <Stack spacing={2} sx={{ height: "100%" }}>
                                        <Box>
                                            <Typography variant="h6">Collections Pressure</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Focus immediate borrower engagement on overdue schedules and repayment risk.
                                            </Typography>
                                        </Box>
                                        <Chip
                                            icon={<WarningAmberRoundedIcon />}
                                            label={overdueScheduleCount > 0 ? `${overdueScheduleCount} overdue schedule(s)` : "No overdue schedules"}
                                            color={overdueScheduleCount > 0 ? "warning" : "success"}
                                            variant="outlined"
                                            sx={{ width: "fit-content" }}
                                        />
                                        <Stack spacing={1.1}>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2" color="text.secondary">Overdue exposure</Typography>
                                                <Typography variant="subtitle2">{formatCurrency(metrics.branchOverdueOutstanding)}</Typography>
                                            </Stack>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2" color="text.secondary">Pending appraisals</Typography>
                                                <Typography variant="subtitle2">{pendingLoanApplications}</Typography>
                                            </Stack>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2" color="text.secondary">PAR 30</Typography>
                                                <Typography variant="subtitle2">{par30Percent.toFixed(1)}%</Typography>
                                            </Stack>
                                        </Stack>
                                        <Divider />
                                        <Button
                                            variant="contained"
                                            startIcon={<AssignmentTurnedInRoundedIcon />}
                                            onClick={() => navigate("/follow-ups")}
                                            sx={theme.palette.mode === "dark" ? { bgcolor: dashboardAccent, color: "#1a1a1a", "&:hover": { bgcolor: dashboardAccentStrong } } : undefined}
                                        >
                                            Open Follow-up List
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </MotionCard>
                        </Grid>
                    </>
                ) : role === "branch_manager" ? (
                    <>
                        <Grid size={{ xs: 12, lg: 4 }}>
                            <ChartPanel
                                title="Savings Position"
                                subtitle="Member savings"
                                type="doughnut"
                                data={branchSavingsPositionData}
                                height={220}
                                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, lg: 4 }}>
                            <ChartPanel
                                title="Revenue Mix"
                                subtitle="This SACCO year"
                                type="doughnut"
                                data={branchRevenueMixData}
                                height={220}
                                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, lg: 4 }}>
                            <ChartPanel
                                title="Loan Aging"
                                subtitle="Overdue by bucket"
                                data={{
                                    labels: ["Current", "1-30", "31-60", "60+"],
                                    datasets: [
                                        {
                                            label: "Schedules",
                                            data: [
                                                branchLoanAging.current,
                                                branchLoanAging.d1_30,
                                                branchLoanAging.d31_60,
                                                branchLoanAging.d60Plus
                                            ],
                                            backgroundColor: [
                                                alpha(theme.palette.success.main, 0.74),
                                                alpha(theme.palette.warning.main, 0.74),
                                                alpha(theme.palette.warning.main, 0.58),
                                                alpha(theme.palette.error.main, 0.74)
                                            ]
                                        }
                                    ]
                                }}
                                type="bar"
                                height={220}
                                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, lg: 7 }}>
                            <MotionCard variant="outlined" inView sx={{ height: "100%" }}>
                                <CardContent sx={{ height: "100%" }}>
                                    <Stack spacing={2} sx={{ height: "100%" }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="h6">Action Queue</Typography>
                                            <Button size="small" variant="outlined" onClick={() => navigate("/approvals")}>
                                                Open approvals
                                            </Button>
                                        </Stack>
                                        <Grid container spacing={1.25}>
                                            {operationalQueue.map((item) => (
                                                <Grid key={item.id} size={{ xs: 12, sm: 6 }}>
                                                    <OperationalQueueCard item={item} onOpen={(route) => navigate(route)} />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Stack>
                                </CardContent>
                            </MotionCard>
                        </Grid>
                        <Grid size={{ xs: 12, lg: 5 }}>
                            <MotionCard variant="outlined" inView sx={{ height: "100%" }}>
                                <CardContent sx={{ height: "100%" }}>
                                    <Stack spacing={1.5} sx={{ height: "100%" }}>
                                        <Typography variant="h6">Risk & Exceptions</Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                            <Chip
                                                color={par30Percent >= 15 ? "error" : par30Percent >= 8 ? "warning" : "success"}
                                                variant="outlined"
                                                label={`PAR ${par30Percent.toFixed(1)}%`}
                                                icon={<RuleRoundedIcon />}
                                            />
                                            <Chip
                                                color={metrics.branchMixedRevenue > 0 ? "warning" : "success"}
                                                variant="outlined"
                                                label={`${formatCurrency(metrics.branchMixedRevenue)} mixed revenue`}
                                            />
                                        </Stack>
                                        {branchAlerts.map((alert) => (
                                            <Alert key={alert.id} severity={alert.severity} variant="outlined">
                                                <Typography variant="subtitle2">{alert.title}</Typography>
                                                <Typography variant="body2">{alert.description}</Typography>
                                            </Alert>
                                        ))}
                                    </Stack>
                                </CardContent>
                            </MotionCard>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Stack spacing={1}>
                                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "flex-start" }} spacing={1.5}>
                                    <Box>
                                        <Typography variant="h6">Target Watchlist</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {selectedTargetWatchFilter?.count || 0} members · {selectedTargetWatchFilter?.label || "all"}
                                        </Typography>
                                    </Box>
                                    <Button variant="outlined" size="small" onClick={() => navigate("/performance-targets")}>
                                        View all targets
                                    </Button>
                                </Stack>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {targetWatchFilterOptions.map((option) => (
                                        <Chip
                                            key={option.value}
                                            label={`${option.label}: ${option.count}`}
                                            size="small"
                                            clickable
                                            color={targetWatchFilter === option.value ? "primary" : "default"}
                                            variant={targetWatchFilter === option.value ? "filled" : "outlined"}
                                            onClick={() => setTargetWatchFilter(option.value)}
                                        />
                                    ))}
                                </Stack>
                                <Box sx={{ "& td": { py: 0.5 }, "& th": { py: 0.75 } }}>
                                    <DataTable
                                        rows={memberTargetWatchRows}
                                        columns={memberTargetWatchColumns}
                                        emptyMessage="No member matches this watchlist filter."
                                        maxHeight={360}
                                        stickyHeader
                                    />
                                </Box>
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <StaffPerformancePanel rows={staffPerformance} />
                        </Grid>
                    </>
                ) : role === "auditor" ? (
                    <>
                        <Grid size={{ xs: 12, lg: 8 }}>
                            <ChartPanel
                                title="Deposit vs Withdrawal Trend"
                                subtitle="Monitor the direction of posted member cash movements."
                                data={{
                                    labels: cashTrend.map(([label]) => label),
                                    datasets: [
                                        {
                                            label: "Deposits",
                                            data: cashTrend.map(([label]) => depositTrend.find(([date]) => date === label)?.[1] || 0),
                                            backgroundColor: alpha(theme.palette.success.main, 0.65)
                                        },
                                        {
                                            label: "Withdrawals",
                                            data: cashTrend.map(([label]) => withdrawalTrend.find(([date]) => date === label)?.[1] || 0),
                                            backgroundColor: alpha(theme.palette.error.main, 0.65)
                                        }
                                    ]
                                }}
                                type="bar"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, lg: 4 }}>
                            <ChartPanel
                                title="Schedule Status"
                                type="doughnut"
                                data={{
                                    labels: agingBuckets.map(([label]) => label),
                                    datasets: [{
                                        data: agingBuckets.map(([, value]) => value),
                                        backgroundColor: [
                                            theme.palette.success.main,
                                            theme.palette.error.main,
                                            theme.palette.warning.main
                                        ]
                                    }]
                                }}
                            />
                        </Grid>
                    </>
                ) : (
                    <>
                        <Grid size={{ xs: 12, lg: 8 }}>
                            <ChartPanel
                                title={role === "super_admin" ? "Savings Growth" : "Deposit vs Withdrawal Trend"}
                                subtitle="Recent movement trend across visible member accounts."
                                data={{
                                    labels: cashTrend.map(([label]) => label),
                                    datasets: [
                                        {
                                            label: "Deposits",
                                            data: cashTrend.map(([label]) => depositTrend.find(([date]) => date === label)?.[1] || 0),
                                            borderColor: theme.palette.primary.main,
                                            backgroundColor: alpha(theme.palette.primary.main, 0.14),
                                            fill: true
                                        },
                                        {
                                            label: "Withdrawals",
                                            data: cashTrend.map(([label]) => withdrawalTrend.find(([date]) => date === label)?.[1] || 0),
                                            borderColor: theme.palette.secondary.main,
                                            backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                                            fill: true
                                        }
                                    ]
                                }}
                                options={commonLineOptions}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, lg: 4 }}>
                            <ChartPanel
                                title="Loan Portfolio Mix"
                                type="doughnut"
                                subtitle="Schedule status and portfolio attention areas."
                                data={{
                                    labels: agingBuckets.map(([label]) => label),
                                    datasets: [{
                                        data: agingBuckets.map(([, value]) => value),
                                        backgroundColor: [
                                            theme.palette.success.main,
                                            theme.palette.error.main,
                                            theme.palette.warning.main
                                        ]
                                    }]
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <ChartPanel
                                title="Loan Portfolio Trend"
                                subtitle="Recent loan origination volume by month."
                                type="bar"
                                data={{
                                    labels: loanTrend.map(([label]) => label),
                                    datasets: [{
                                        label: "Principal amount",
                                        data: loanTrend.map(([, value]) => value),
                                        backgroundColor: alpha(theme.palette.primary.main, 0.72)
                                    }]
                                }}
                                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                            />
                        </Grid>
                    </>
                )}
            </Grid>
            </MotionSection>
            ) : null}

            {!showPlatformDashboard ? (role === "teller" ? (
                state.statements.length ? null : (
                    <Alert severity="info" variant="outlined">
                        No posted teller cash activity is available yet. Use Post Transaction to start counter operations and this dashboard will populate automatically.
                    </Alert>
                )
            ) : role === "branch_manager" ? (
                <MotionSection inView>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <BranchActivityPanel
                            statements={metrics.branchStatements}
                            view={branchActivityView}
                            filter={branchActivityFilter}
                            window={branchActivityWindow}
                            onViewChange={setBranchActivityView}
                            onFilterChange={setBranchActivityFilter}
                            onWindowChange={setBranchActivityWindow}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <FollowUpPanel
                            title="Priority Follow-up"
                            subtitle="Branch loan items that need collections, review, or immediate member contact."
                            items={branchFollowUps}
                            onViewAll={() => navigate("/follow-ups")}
                        />
                    </Grid>
                </Grid>
                </MotionSection>
            ) : role === "loan_officer" ? (
                <MotionSection inView>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <BranchActivityPanel
                            title="Recent Borrower Activity"
                            subtitle="Borrower loan and savings movement across your supervised branch. Filter by posting type, switch the period, or view the same data as a table."
                            statements={metrics.branchStatements}
                            view={branchActivityView}
                            filter={branchActivityFilter}
                            window={branchActivityWindow}
                            onViewChange={setBranchActivityView}
                            onFilterChange={setBranchActivityFilter}
                            onWindowChange={setBranchActivityWindow}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <FollowUpPanel
                            title="Collections Priority Board"
                            subtitle="Loans at highest repayment risk so you can drive daily borrower follow-up."
                            items={branchFollowUps}
                            onViewAll={() => navigate("/follow-ups")}
                        />
                    </Grid>
                </Grid>
                </MotionSection>
            ) : (
                <MotionSection inView>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, lg: 7 }}>
                        <ChartPanel
                            title="Recent Activity"
                            subtitle="Latest savings movements visible to your role."
                            type="bar"
                            data={{
                                labels: state.statements.slice(0, 8).map((entry) => entry.member_name),
                                datasets: [{
                                    label: "Amount",
                                    data: state.statements.slice(0, 8).map((entry) => entry.amount),
                                    backgroundColor: state.statements.slice(0, 8).map((entry) =>
                                        entry.direction === "in"
                                            ? alpha(theme.palette.primary.main, 0.7)
                                            : alpha(theme.palette.error.main, 0.7)
                                    )
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } }
                            }}
                            height={250}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, lg: 5 }}>
                        <FollowUpPanel
                            title="Alerts and Follow-up"
                            subtitle="Visible due items grouped for immediate operational attention."
                            items={generalFollowUps}
                            onViewAll={() => navigate("/follow-ups")}
                        />
                    </Grid>
                </Grid>
                </MotionSection>
            )) : null}
        </Stack>
    );
}
