import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    MenuItem,
    Menu,
    Pagination,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";

import { AppLoader } from "../components/AppLoader";
import { useToast } from "../components/Toast";
import { MotionCard } from "../ui/motion";
import { api, getApiErrorMessage } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import { formatDate, formatRole } from "../utils/format";

type AccountStatus = "active" | "dormant" | "inactive" | "never";
type RiskLevel = "low" | "medium" | "high";

interface LoginAccount {
    user_id: string;
    full_name: string;
    role: string;
    account_type: "member" | "staff";
    privileged: boolean;
    member_no: string | null;
    branch_id: string | null;
    branch_name: string | null;
    is_active: boolean;
    first_login_at: string | null;
    last_login_at: string | null;
    days_since_last_login: number | null;
    never_logged_in: boolean;
    status: AccountStatus;
    risk_level: RiskLevel;
    risk_reasons: string[];
    created_at: string;
}

interface Summary {
    total_accounts: number;
    logged_in_today: number;
    never_logged_in: number;
    dormant_over_90: number;
    inactive_over_180: number;
    avg_days_since_last_login: number | null;
    high_risk: number;
    staff_accounts: number;
    truncated?: boolean;
}

interface Insight {
    severity: "info" | "warning" | "critical" | "recommend";
    text: string;
}

interface LoginHistoryResponse {
    data: LoginAccount[];
    summary: Summary;
    insights: Insight[];
}

const PAGE_SIZE = 25;

const STATUS_META: Record<AccountStatus, { label: string; color: string; dot: string }> = {
    active: { label: "Active", color: "#15803d", dot: "🟢" },
    dormant: { label: "Dormant", color: "#b45309", dot: "🟡" },
    inactive: { label: "Inactive", color: "#b91c1c", dot: "🔴" },
    never: { label: "Never", color: "#6b7280", dot: "⚫" }
};
const RISK_META: Record<RiskLevel, { label: string; color: string; bg: string }> = {
    low: { label: "Low", color: "#15803d", bg: "rgba(21,128,61,0.10)" },
    medium: { label: "Medium", color: "#b45309", bg: "rgba(180,83,9,0.12)" },
    high: { label: "High", color: "#b91c1c", bg: "rgba(185,28,28,0.12)" }
};
const RISK_ORDER: Record<RiskLevel, number> = { high: 3, medium: 2, low: 1 };

function ageLabel(days: number | null, never: boolean): string {
    if (never) return "never";
    if (days === null) return "—";
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
}

function csvEscape(value: unknown): string {
    const s = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(filename: string, accounts: LoginAccount[]) {
    const headers = [
        "Name", "Role", "Type", "Branch", "Member No", "Status", "Risk", "Risk Reasons",
        "Days Since Last Login", "First Login", "Last Login", "Created", "Active"
    ];
    const lines = [headers.join(",")];
    for (const a of accounts) {
        lines.push([
            a.full_name, formatRole(a.role), a.account_type, a.branch_name || "", a.member_no || "",
            STATUS_META[a.status].label, RISK_META[a.risk_level].label, a.risk_reasons.join("; "),
            a.never_logged_in ? "never" : a.days_since_last_login,
            a.first_login_at || "", a.last_login_at || "", a.created_at, a.is_active ? "Active" : "Disabled"
        ].map(csvEscape).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

type SortKey = "name" | "first_login" | "last_login" | "risk" | "created";

export function AuditorLoginHistoryPage() {
    const navigate = useNavigate();
    const { pushToast } = useToast();
    const [accounts, setAccounts] = useState<LoginAccount[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);

    // filters
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<"all" | "member" | "staff">("all");
    const [statusFilter, setStatusFilter] = useState<"all" | AccountStatus>("all");
    const [riskFilter, setRiskFilter] = useState<"all" | RiskLevel>("all");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [branchFilter, setBranchFilter] = useState<string>("all");
    const [dormantOnly, setDormantOnly] = useState(false);
    const [privilegedOnly, setPrivilegedOnly] = useState(false);

    // table
    const [sortKey, setSortKey] = useState<SortKey>("last_login");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [page, setPage] = useState(1);

    // dialogs / menus
    const [detail, setDetail] = useState<LoginAccount | null>(null);
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [menuRow, setMenuRow] = useState<LoginAccount | null>(null);
    const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

    useEffect(() => {
        setLoading(true);
        void api
            .get<LoginHistoryResponse>(endpoints.auditor.loginHistory())
            .then(({ data }) => {
                setAccounts(data.data || []);
                setSummary(data.summary);
                setInsights(data.insights || []);
            })
            .catch((error) =>
                pushToast({ type: "error", title: "Unable to load login analytics", message: getApiErrorMessage(error) })
            )
            .finally(() => setLoading(false));
    }, [pushToast]);

    useEffect(() => { setPage(1); }, [search, typeFilter, statusFilter, riskFilter, roleFilter, branchFilter, dormantOnly, privilegedOnly]);

    const roleOptions = useMemo(() => Array.from(new Set(accounts.map((a) => a.role))).sort(), [accounts]);
    const branchOptions = useMemo(() => {
        const map = new Map<string, string>();
        for (const a of accounts) { if (a.branch_id) { map.set(a.branch_id, a.branch_name || a.branch_id); } }
        return Array.from(map.entries()).sort((l, r) => l[1].localeCompare(r[1]));
    }, [accounts]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return accounts.filter((a) =>
            (term === "" || a.full_name.toLowerCase().includes(term) || (a.member_no || "").toLowerCase().includes(term))
            && (typeFilter === "all" || a.account_type === typeFilter)
            && (statusFilter === "all" || a.status === statusFilter)
            && (riskFilter === "all" || a.risk_level === riskFilter)
            && (roleFilter === "all" || a.role === roleFilter)
            && (branchFilter === "all" || a.branch_id === branchFilter)
            && (!dormantOnly || (a.days_since_last_login !== null && a.days_since_last_login > 90))
            && (!privilegedOnly || a.privileged)
        );
    }, [accounts, search, typeFilter, statusFilter, riskFilter, roleFilter, branchFilter, dormantOnly, privilegedOnly]);

    const sorted = useMemo(() => {
        const dir = sortDir === "asc" ? 1 : -1;
        const val = (a: LoginAccount): number | string => {
            switch (sortKey) {
                case "name": return a.full_name.toLowerCase();
                case "first_login": return a.first_login_at ? new Date(a.first_login_at).getTime() : -Infinity;
                case "last_login": return a.last_login_at ? new Date(a.last_login_at).getTime() : -Infinity;
                case "risk": return RISK_ORDER[a.risk_level];
                case "created": return new Date(a.created_at).getTime();
                default: return 0;
            }
        };
        return [...filtered].sort((l, r) => {
            const lv = val(l); const rv = val(r);
            if (lv < rv) return -1 * dir;
            if (lv > rv) return 1 * dir;
            return 0;
        });
    }, [filtered, sortKey, sortDir]);

    const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const setSort = (key: SortKey) => {
        if (sortKey === key) { setSortDir((d) => (d === "asc" ? "desc" : "asc")); }
        else { setSortKey(key); setSortDir(key === "name" ? "asc" : "desc"); }
    };

    const kpis = summary ? [
        { label: "Total Accounts", value: summary.total_accounts, color: undefined },
        { label: "Logged In Today", value: summary.logged_in_today, color: "#15803d" },
        { label: "Never Logged In", value: summary.never_logged_in, color: summary.never_logged_in ? "#6b7280" : undefined },
        { label: "Dormant (>90d)", value: summary.dormant_over_90, color: summary.dormant_over_90 ? "#b45309" : undefined },
        { label: "Inactive (>180d)", value: summary.inactive_over_180, color: summary.inactive_over_180 ? "#b91c1c" : undefined },
        { label: "Avg Days Since Login", value: summary.avg_days_since_last_login ?? "—", color: undefined }
    ] : [];

    const insightIcon = (s: Insight["severity"]) => {
        if (s === "critical") return <ReportProblemRoundedIcon fontSize="small" sx={{ color: "#b91c1c" }} />;
        if (s === "warning") return <WarningAmberRoundedIcon fontSize="small" sx={{ color: "#b45309" }} />;
        if (s === "recommend") return <LightbulbOutlinedIcon fontSize="small" sx={{ color: "#1d4ed8" }} />;
        return <InfoOutlinedIcon fontSize="small" sx={{ color: "#6b7280" }} />;
    };

    if (loading) return <AppLoader />;

    return (
        <Stack spacing={2.5}>
            {summary?.truncated && (
                <MotionCard variant="outlined" sx={{ borderColor: "#b45309" }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1.5 }}>
                        <WarningAmberRoundedIcon fontSize="small" sx={{ color: "#b45309" }} />
                        <Typography variant="body2">
                            This tenant has more accounts than this view loads at once — figures below are a partial sample. Contact support to raise the limit.
                        </Typography>
                    </Stack>
                </MotionCard>
            )}
            {/* KPI cards */}
            <Grid container spacing={2}>
                {kpis.map((kpi) => (
                    <Grid key={kpi.label} size={{ xs: 6, sm: 4, md: 2 }}>
                        <MotionCard variant="outlined" sx={{ height: "100%" }}>
                            <Box sx={{ p: 2 }}>
                                <Typography variant="caption" color="text.secondary">{kpi.label}</Typography>
                                <Typography variant="h5" fontWeight={800} sx={{ color: kpi.color }}>{kpi.value}</Typography>
                            </Box>
                        </MotionCard>
                    </Grid>
                ))}
            </Grid>

            {/* Audit insights */}
            {insights.length > 0 && (
                <MotionCard variant="outlined">
                    <Box sx={{ p: 2 }}>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Audit Insights</Typography>
                        <Stack spacing={1}>
                            {insights.map((insight, index) => (
                                <Stack key={index} direction="row" spacing={1} alignItems="center">
                                    {insightIcon(insight.severity)}
                                    <Typography variant="body2">{insight.text}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Box>
                </MotionCard>
            )}

            {/* Filters + quick chips + export */}
            <MotionCard variant="outlined">
                <Box sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                        <Chip label="Never Logged In" variant={statusFilter === "never" ? "filled" : "outlined"} color={statusFilter === "never" ? "primary" : "default"} onClick={() => setStatusFilter((s) => (s === "never" ? "all" : "never"))} />
                        <Chip label="Dormant (>90d)" variant={dormantOnly ? "filled" : "outlined"} color={dormantOnly ? "warning" : "default"} onClick={() => setDormantOnly((v) => !v)} />
                        <Chip label="High Risk" variant={riskFilter === "high" ? "filled" : "outlined"} color={riskFilter === "high" ? "error" : "default"} onClick={() => setRiskFilter((r) => (r === "high" ? "all" : "high"))} />
                        <Chip label="Staff Only" variant={typeFilter === "staff" ? "filled" : "outlined"} color={typeFilter === "staff" ? "primary" : "default"} onClick={() => setTypeFilter((t) => (t === "staff" ? "all" : "staff"))} />
                        <Chip label="Members Only" variant={typeFilter === "member" ? "filled" : "outlined"} color={typeFilter === "member" ? "primary" : "default"} onClick={() => setTypeFilter((t) => (t === "member" ? "all" : "member"))} />
                        <Chip label="Privileged Accounts" variant={privilegedOnly ? "filled" : "outlined"} color={privilegedOnly ? "secondary" : "default"} onClick={() => setPrivilegedOnly((v) => !v)} />
                    </Stack>
                    <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} alignItems={{ lg: "center" }} flexWrap="wrap" useFlexGap>
                        <TextField size="small" label="Search name / member no." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 220 }} />
                        <TextField size="small" select label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} sx={{ minWidth: 150 }}>
                            <MenuItem value="all">All roles</MenuItem>
                            {roleOptions.map((r) => <MenuItem key={r} value={r}>{formatRole(r)}</MenuItem>)}
                        </TextField>
                        <TextField size="small" select label="Branch" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} sx={{ minWidth: 150 }}>
                            <MenuItem value="all">All branches</MenuItem>
                            {branchOptions.map(([id, name]) => <MenuItem key={id} value={id}>{name}</MenuItem>)}
                        </TextField>
                        <TextField size="small" select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | AccountStatus)} sx={{ minWidth: 140 }}>
                            <MenuItem value="all">All statuses</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="dormant">Dormant</MenuItem>
                            <MenuItem value="inactive">Inactive</MenuItem>
                            <MenuItem value="never">Never</MenuItem>
                        </TextField>
                        <TextField size="small" select label="Risk" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as "all" | RiskLevel)} sx={{ minWidth: 130 }}>
                            <MenuItem value="all">All risk</MenuItem>
                            <MenuItem value="high">High</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="low">Low</MenuItem>
                        </TextField>
                        <Box sx={{ flexGrow: 1 }} />
                        <Button size="small" variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={(e) => setExportAnchor(e.currentTarget)}>Export</Button>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                        Showing {sorted.length} of {accounts.length} accounts
                    </Typography>
                </Box>

                <Divider />

                <TableContainer sx={{ overflowX: "auto" }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sortDirection={sortKey === "name" ? sortDir : false}>
                                    <TableSortLabel active={sortKey === "name"} direction={sortKey === "name" ? sortDir : "asc"} onClick={() => setSort("name")}>Account</TableSortLabel>
                                </TableCell>
                                <TableCell>Type / Branch</TableCell>
                                <TableCell sortDirection={sortKey === "created" ? sortDir : false}>
                                    <TableSortLabel active={sortKey === "created"} direction={sortKey === "created" ? sortDir : "asc"} onClick={() => setSort("created")}>Created</TableSortLabel>
                                </TableCell>
                                <TableCell sortDirection={sortKey === "first_login" ? sortDir : false}>
                                    <TableSortLabel active={sortKey === "first_login"} direction={sortKey === "first_login" ? sortDir : "asc"} onClick={() => setSort("first_login")}>First login</TableSortLabel>
                                </TableCell>
                                <TableCell sortDirection={sortKey === "last_login" ? sortDir : false}>
                                    <TableSortLabel active={sortKey === "last_login"} direction={sortKey === "last_login" ? sortDir : "asc"} onClick={() => setSort("last_login")}>Last login</TableSortLabel>
                                </TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell sortDirection={sortKey === "risk" ? sortDir : false}>
                                    <TableSortLabel active={sortKey === "risk"} direction={sortKey === "risk" ? sortDir : "asc"} onClick={() => setSort("risk")}>Risk</TableSortLabel>
                                </TableCell>
                                <TableCell align="right"></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pageRows.length === 0 ? (
                                <TableRow><TableCell colSpan={8}><Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No accounts match the current filters.</Typography></TableCell></TableRow>
                            ) : pageRows.map((a) => (
                                <TableRow key={a.user_id} hover sx={a.privileged ? { bgcolor: "rgba(29,78,216,0.04)" } : undefined}>
                                    <TableCell>
                                        <Stack spacing={0.25}>
                                            <Stack direction="row" spacing={0.75} alignItems="center">
                                                <Typography variant="body2" fontWeight={a.privileged ? 800 : 600}>{a.full_name}</Typography>
                                                {!a.is_active && <Chip size="small" label="Disabled" color="default" variant="outlined" />}
                                            </Stack>
                                            <Chip size="small" label={formatRole(a.role)} variant={a.privileged ? "filled" : "outlined"} color={a.privileged ? "secondary" : "default"} sx={{ width: "fit-content", height: 20 }} />
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{a.account_type === "member" ? "Member" : "Staff"}</Typography>
                                        <Typography variant="caption" color="text.secondary">{a.branch_name || (a.member_no ? a.member_no : "—")}</Typography>
                                    </TableCell>
                                    <TableCell><Typography variant="body2">{formatDate(a.created_at)}</Typography></TableCell>
                                    <TableCell><Typography variant="body2">{a.first_login_at ? formatDate(a.first_login_at) : "—"}</Typography></TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{a.last_login_at ? formatDate(a.last_login_at) : "—"}</Typography>
                                        <Typography variant="caption" sx={{ color: a.never_logged_in ? "#6b7280" : (a.days_since_last_login || 0) > 90 ? "#b45309" : "text.secondary" }}>
                                            {ageLabel(a.days_since_last_login, a.never_logged_in)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip size="small" label={`${STATUS_META[a.status].dot} ${STATUS_META[a.status].label}`} sx={{ color: STATUS_META[a.status].color, borderColor: STATUS_META[a.status].color }} variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title={a.risk_reasons.length ? a.risk_reasons.join(" · ") : "No risk signals"}>
                                            <Chip size="small" label={RISK_META[a.risk_level].label} sx={{ color: RISK_META[a.risk_level].color, bgcolor: RISK_META[a.risk_level].bg, fontWeight: 700 }} />
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={(e) => { setMenuAnchor(e.currentTarget); setMenuRow(a); }}><MoreVertRoundedIcon fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {pageCount > 1 && (
                    <Stack direction="row" justifyContent="center" sx={{ py: 2 }}>
                        <Pagination count={pageCount} page={page} onChange={(_, value) => setPage(value)} color="primary" />
                    </Stack>
                )}
            </MotionCard>

            {/* Export menu */}
            <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}>
                <MenuItem onClick={() => { downloadCsv("login-analytics-filtered.csv", sorted); setExportAnchor(null); }}>Export current view ({sorted.length})</MenuItem>
                <MenuItem onClick={() => { downloadCsv("login-never-logged-in.csv", accounts.filter((a) => a.never_logged_in)); setExportAnchor(null); }}>Export never logged in</MenuItem>
                <MenuItem onClick={() => { downloadCsv("login-dormant.csv", accounts.filter((a) => a.days_since_last_login !== null && a.days_since_last_login > 90)); setExportAnchor(null); }}>Export dormant (&gt;90d)</MenuItem>
                <MenuItem onClick={() => { downloadCsv("login-high-risk.csv", accounts.filter((a) => a.risk_level === "high")); setExportAnchor(null); }}>Export high risk</MenuItem>
                <MenuItem onClick={() => { downloadCsv("login-staff.csv", accounts.filter((a) => a.account_type === "staff")); setExportAnchor(null); }}>Export staff</MenuItem>
                <MenuItem onClick={() => { downloadCsv("login-privileged.csv", accounts.filter((a) => a.privileged)); setExportAnchor(null); }}>Export privileged</MenuItem>
                <MenuItem onClick={() => { downloadCsv("login-members.csv", accounts.filter((a) => a.account_type === "member")); setExportAnchor(null); }}>Export members</MenuItem>
            </Menu>

            {/* Row action menu */}
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => { setMenuAnchor(null); setMenuRow(null); }}>
                <MenuItem onClick={() => { setDetail(menuRow); setMenuAnchor(null); }}>View account details</MenuItem>
                <MenuItem onClick={() => { setMenuAnchor(null); navigate("/auditor/audit-logs"); }}>View audit trail</MenuItem>
            </Menu>

            {/* Detail dialog */}
            <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} maxWidth="xs" fullWidth>
                {detail && (
                    <>
                        <DialogTitle>{detail.full_name}</DialogTitle>
                        <DialogContent dividers>
                            <Stack spacing={1}>
                                <Row label="Role" value={formatRole(detail.role)} />
                                <Row label="Type" value={detail.account_type === "member" ? "Member" : "Staff"} />
                                <Row label="Branch" value={detail.branch_name || "—"} />
                                {detail.member_no && <Row label="Member No." value={detail.member_no} />}
                                <Row label="Active" value={detail.is_active ? "Active" : "Disabled"} />
                                <Row label="Created" value={formatDate(detail.created_at)} />
                                <Row label="First login" value={detail.first_login_at ? formatDate(detail.first_login_at) : "—"} />
                                <Row label="Last login" value={detail.last_login_at ? `${formatDate(detail.last_login_at)} (${ageLabel(detail.days_since_last_login, detail.never_logged_in)})` : "never"} />
                                <Row label="Status" value={`${STATUS_META[detail.status].dot} ${STATUS_META[detail.status].label}`} />
                                <Row label="Risk" value={RISK_META[detail.risk_level].label} />
                                {detail.risk_reasons.length > 0 && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Risk signals</Typography>
                                        <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                                            {detail.risk_reasons.map((reason, index) => <li key={index}><Typography variant="body2">{reason}</Typography></li>)}
                                        </ul>
                                    </Box>
                                )}
                            </Stack>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDetail(null)}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Stack>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="body2" fontWeight={600} sx={{ textAlign: "right" }}>{value}</Typography>
        </Stack>
    );
}
