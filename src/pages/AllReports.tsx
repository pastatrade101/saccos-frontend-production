import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Grid,
    Menu,
    MenuItem,
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { FlatDateRangePicker } from "../components/FlatDateRangePicker";
import { api, getApiErrorMessage } from "../lib/api";
import { endpoints, type MembersResponse } from "../lib/endpoints";
import type { Member } from "../types/api";
import { downloadFile } from "../utils/downloadFile";
import { formatCurrency, formatDate } from "../utils/format";

type ReportKey = "contributions" | "monthly" | "dividends" | "positions" | "member-statement" | "utt";

const REPORTS: { key: ReportKey; label: string; description: string }[] = [
    { key: "contributions", label: "Contributions Summary", description: "Per member: savings, shares and social contributions with withdrawals netted." },
    { key: "monthly", label: "Monthly Contributions", description: "Member-by-month contribution matrix for the selected period." },
    { key: "dividends", label: "Dividend Distributions", description: "Every distribution: date, source, pool and member allocations." },
    { key: "positions", label: "Member Positions", description: "Contributions + dividends = cumulative position, ranked." },
    { key: "member-statement", label: "Member Profit Statement", description: "A single member's dividend history with running total." },
    { key: "utt", label: "UTT Investments", description: "UTT register: deposits, fund income, position and funding sources." }
];

interface ContributionsSummaryData {
    rows: { member_no: string | null; full_name: string; savings: number; shares: number; social: number; withdrawals: number; total: number }[];
    totals: { savings: number; shares: number; social: number; withdrawals: number; total: number };
}

interface MonthlyContributionsData {
    months: string[];
    rows: { member_no: string | null; full_name: string; values: number[]; total: number }[];
    month_totals: number[];
    grand_total: number;
}

interface DividendDistributionsData {
    rows: {
        label: string;
        source: string;
        date: string;
        member_count: number;
        total: number;
        allocations?: { member_no: string | null; full_name: string; amount: number; date: string }[];
    }[];
    totals: { distributions: number; utt: number; loan: number; total: number };
}

interface MemberPositionsData {
    rows: { rank: number; member_no: string | null; full_name: string; contributions: number; dividends: number; cumulative: number }[];
    totals: { contributions: number; dividends: number; cumulative: number };
}

interface MemberProfitStatementData {
    member: { id: string; member_no: string | null; full_name: string };
    rows: { date: string; label: string; source: string; amount: number; running_total: number }[];
    totals: { utt: number; loan: number; total: number };
}

interface UttInvestmentsData {
    deposits: { date: string; reference: string; amount: number }[];
    income: { date: string; type: string; description: string | null; amount: number }[];
    position: { total_cost: number; current_market_value: number } | null;
    totals: { invested: number; income: number; grand_total: number };
    funding_sources: { source: string; amount: number }[];
}

function exportCsv(filename: string, headers: string[], rows: (string | number | null)[][]) {
    const escape = (value: string | number | null) => {
        const text = value == null ? "" : String(value);
        return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const csv = [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
    downloadFile(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename);
}

function StatTiles({ items }: { items: { label: string; value: string; helper?: string }[] }) {
    const theme = useTheme();
    return (
        <Grid container spacing={1.5}>
            {items.map((item) => (
                <Grid key={item.label} size={{ xs: 6, sm: 4, md: "auto" }} sx={{ minWidth: { md: 170 } }}>
                    <Box
                        sx={{
                            px: 1.75,
                            py: 1.25,
                            height: "100%",
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.08 : 0.03)
                        }}
                    >
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: "0.66rem" }}>
                            {item.label}
                        </Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", fontVariantNumeric: "tabular-nums", lineHeight: 1.4 }}>
                            {item.value}
                        </Typography>
                        {item.helper ? (
                            <Typography variant="caption" color="text.secondary">{item.helper}</Typography>
                        ) : null}
                    </Box>
                </Grid>
            ))}
        </Grid>
    );
}

// Money cell: zeros render as a muted dash so real figures stand out.
function Money({ value, bold = false }: { value: number; bold?: boolean }) {
    if (!value) {
        return <Typography component="span" variant="body2" color="text.disabled">—</Typography>;
    }
    return (
        <Typography component="span" variant="body2" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: bold ? 700 : 400 }}>
            {formatCurrency(value)}
        </Typography>
    );
}

function MemberCell({ memberNo, name }: { memberNo: string | null; name: string }) {
    return (
        <Stack spacing={0}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>{name}</Typography>
            {memberNo ? (
                <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>{memberNo}</Typography>
            ) : null}
        </Stack>
    );
}

const SOURCE_COLORS: Record<string, "primary" | "success" | "default"> = { utt: "primary", loan: "success" };

function SourceChip({ source }: { source: string }) {
    return <Chip size="small" label={source.toUpperCase()} color={SOURCE_COLORS[source] || "default"} variant="outlined" sx={{ fontWeight: 700 }} />;
}

export function AllReportsPage() {
    const theme = useTheme();
    const { report } = useParams<{ report: ReportKey }>();
    const navigate = useNavigate();
    const activeKey: ReportKey = (REPORTS.some((entry) => entry.key === report) ? report : "contributions") as ReportKey;
    const activeReport = REPORTS.find((entry) => entry.key === activeKey)!;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    // Payload is tagged with the report it belongs to: on navigation the
    // component re-renders with the new key BEFORE the fetch effect runs, and
    // rendering the new report's branch against the old report's shape crashes.
    const [loadedReport, setLoadedReport] = useState<{ key: ReportKey; payload: unknown } | null>(null);
    const data = loadedReport && loadedReport.key === activeKey ? loadedReport.payload : null;
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [search, setSearch] = useState("");
    const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

    // Back to the first page whenever the report, its data or the search changes.
    useEffect(() => {
        setPage(0);
    }, [activeKey, data, search]);

    useEffect(() => {
        setSearch("");
    }, [activeKey]);

    const paginate = <T,>(rows: T[]) => (rowsPerPage > 0 ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : rows);

    // Case-insensitive member filter on name and member number.
    const matchesSearch = (memberNo: string | null, name: string) => {
        if (!search.trim()) {
            return true;
        }
        const needle = search.trim().toLowerCase();
        return name.toLowerCase().includes(needle) || (memberNo || "").toLowerCase().includes(needle);
    };

    const paginationBar = (count: number) => (
        <TablePagination
            component="div"
            count={count}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            onRowsPerPageChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setPage(0);
            }}
            rowsPerPageOptions={[25, 50, 100, { label: "All", value: -1 }]}
            labelRowsPerPage="Members per page"
        />
    );

    const headCellSx = {
        bgcolor: theme.palette.mode === "dark" ? "background.default" : alpha(theme.palette.primary.main, 0.06),
        fontWeight: 700,
        whiteSpace: "nowrap" as const
    };
    const zebraSx = {
        "& tbody tr:nth-of-type(even)": { bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.05 : 0.02) },
        "& tbody tr:hover": { bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.12 : 0.06) }
    };
    const totalRowSx = {
        "& td": {
            borderTop: `2px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.1 : 0.05)
        }
    };

    const load = useCallback(async () => {
        if (activeKey === "member-statement" && !selectedMember) {
            setLoadedReport(null);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, string> = {};
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            let response;
            if (activeKey === "contributions") {
                response = await api.get<{ data: ContributionsSummaryData }>(endpoints.allReports.contributionsSummary(), { params });
            } else if (activeKey === "monthly") {
                response = await api.get<{ data: MonthlyContributionsData }>(endpoints.allReports.monthlyContributions(), { params });
            } else if (activeKey === "dividends") {
                response = await api.get<{ data: DividendDistributionsData }>(endpoints.allReports.dividendDistributions(), {
                    params: { include_allocations: "true" }
                });
            } else if (activeKey === "positions") {
                response = await api.get<{ data: MemberPositionsData }>(endpoints.allReports.memberPositions());
            } else if (activeKey === "member-statement") {
                response = await api.get<{ data: MemberProfitStatementData }>(endpoints.allReports.memberProfitStatement(), {
                    params: { member_id: selectedMember!.id }
                });
            } else {
                response = await api.get<{ data: UttInvestmentsData }>(endpoints.allReports.uttInvestments());
            }
            setLoadedReport({ key: activeKey, payload: response.data.data });
        } catch (loadError) {
            setError(getApiErrorMessage(loadError));
            setLoadedReport(null);
        } finally {
            setLoading(false);
        }
    }, [activeKey, startDate, endDate, selectedMember]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        if (activeKey !== "member-statement" || members.length) {
            return;
        }
        void api
            .get<MembersResponse>(endpoints.members.list(), { params: { limit: 1000 } })
            .then((response) => setMembers(response.data.data || []))
            .catch(() => setMembers([]));
    }, [activeKey, members.length]);

    const showDateFilters = activeKey === "contributions" || activeKey === "monthly";

    const getExportData = (): { name: string; title: string; headers: string[]; rows: (string | number | null)[][] } | null => {
        if (!data) return null;
        if (activeKey === "contributions") {
            const typed = data as ContributionsSummaryData;
            return {
                name: "contributions-summary",
                title: "Contributions Summary",
                headers: ["Member No", "Member", "Savings", "Shares", "Social", "Withdrawals", "Total"],
                rows: [
                    ...typed.rows.map((row) => [row.member_no, row.full_name, row.savings, row.shares, row.social, row.withdrawals, row.total] as (string | number | null)[]),
                    ["", "TOTAL", typed.totals.savings, typed.totals.shares, typed.totals.social, typed.totals.withdrawals, typed.totals.total]
                ]
            };
        }
        if (activeKey === "monthly") {
            const typed = data as MonthlyContributionsData;
            return {
                name: "monthly-contributions",
                title: "Monthly Contributions",
                headers: ["Member No", "Member", ...typed.months, "Total"],
                rows: [
                    ...typed.rows.map((row) => [row.member_no, row.full_name, ...row.values, row.total] as (string | number | null)[]),
                    ["", "TOTAL", ...typed.month_totals, typed.grand_total]
                ]
            };
        }
        if (activeKey === "dividends") {
            const typed = data as DividendDistributionsData;
            return {
                name: "dividend-distributions",
                title: "Dividend Distributions",
                headers: ["Date", "Distribution", "Source", "Members", "Total"],
                rows: [
                    ...typed.rows.map((row) => [row.date, row.label, row.source, row.member_count, row.total] as (string | number | null)[]),
                    ["", "TOTAL", "", typed.totals.distributions, typed.totals.total]
                ]
            };
        }
        if (activeKey === "positions") {
            const typed = data as MemberPositionsData;
            return {
                name: "member-positions",
                title: "Member Positions",
                headers: ["Rank", "Member No", "Member", "Contributions", "Dividends", "Cumulative"],
                rows: [
                    ...typed.rows.map((row) => [row.rank, row.member_no, row.full_name, row.contributions, row.dividends, row.cumulative] as (string | number | null)[]),
                    ["", "", "TOTAL", typed.totals.contributions, typed.totals.dividends, typed.totals.cumulative]
                ]
            };
        }
        if (activeKey === "member-statement") {
            const typed = data as MemberProfitStatementData;
            return {
                name: `profit-statement-${typed.member.member_no || "member"}`,
                title: `Member Profit Statement — ${typed.member.full_name} (${typed.member.member_no || ""})`,
                headers: ["Date", "Distribution", "Source", "Amount", "Running Total"],
                rows: typed.rows.map((row) => [row.date, row.label, row.source, row.amount, row.running_total])
            };
        }
        const typed = data as UttInvestmentsData;
        return {
            name: "utt-investments",
            title: "UTT Investments",
            headers: ["Date", "Entry", "Amount"],
            rows: [
                ...typed.deposits.map((row) => [row.date, `Deposit ${row.reference}`, row.amount] as (string | number | null)[]),
                ...typed.income.map((row) => [row.date, `Income: ${row.description || row.type}`, row.amount] as (string | number | null)[]),
                ["", "TOTAL INVESTED", typed.totals.invested],
                ["", "TOTAL INCOME", typed.totals.income],
                ["", "GRAND TOTAL", typed.totals.grand_total]
            ]
        };
    };

    const handleExport = async (format: "csv" | "excel" | "pdf") => {
        setExportAnchor(null);
        const exportData = getExportData();
        if (!exportData) return;
        if (format === "csv") {
            exportCsv(`${exportData.name}.csv`, exportData.headers, exportData.rows);
            return;
        }
        if (format === "excel") {
            const XLSX = await import("xlsx");
            const sheet = XLSX.utils.aoa_to_sheet([[exportData.title], [], exportData.headers, ...exportData.rows]);
            sheet["!cols"] = exportData.headers.map((header, index) => ({
                wch: Math.max(header.length + 2, index < 3 ? 24 : 14)
            }));
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, sheet, exportData.title.slice(0, 31));
            XLSX.writeFile(workbook, `${exportData.name}.xlsx`);
            return;
        }
        const { jsPDF } = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");
        const wide = exportData.headers.length > 8;
        const doc = new jsPDF({ orientation: wide ? "landscape" : "portrait", unit: "pt", format: "a4" });
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(exportData.title, 40, 42);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120);
        doc.text(`Generated ${new Date().toLocaleDateString("en-GB")} — amounts in TZS`, 40, 58);
        autoTable(doc, {
            startY: 72,
            head: [exportData.headers],
            body: exportData.rows.map((row) => row.map((cell) => (typeof cell === "number" ? cell.toLocaleString("en-US") : cell ?? ""))),
            styles: { fontSize: wide ? 6.5 : 8.5, cellPadding: 3 },
            headStyles: { fillColor: [26, 35, 126], fontStyle: "bold" },
            alternateRowStyles: { fillColor: [245, 247, 252] },
            didParseCell: (hook) => {
                if (typeof exportData.rows[hook.row.index]?.[hook.column.index] === "number") {
                    hook.cell.styles.halign = "right";
                }
            }
        });
        doc.save(`${exportData.name}.pdf`);
    };

    const monthLabel = (month: string) => {
        const [year, mm] = month.split("-");
        return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(mm) - 1]} ${year.slice(2)}`;
    };

    const body = useMemo(() => {
        if (loading) {
            return (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress />
                </Box>
            );
        }
        if (error) {
            return <Alert severity="error" variant="outlined">{error}</Alert>;
        }
        if (!data) {
            return activeKey === "member-statement"
                ? <Alert severity="info" variant="outlined">Select a member to view their profit statement.</Alert>
                : null;
        }

        if (activeKey === "contributions") {
            const typed = data as ContributionsSummaryData;
            const filtered = typed.rows.filter((row) => matchesSearch(row.member_no, row.full_name));
            const shown = search.trim()
                ? filtered.reduce(
                    (acc, row) => ({
                        savings: acc.savings + row.savings,
                        shares: acc.shares + row.shares,
                        social: acc.social + row.social,
                        withdrawals: acc.withdrawals + row.withdrawals,
                        total: acc.total + row.total
                    }),
                    { savings: 0, shares: 0, social: 0, withdrawals: 0, total: 0 }
                )
                : typed.totals;
            return (
                <Stack spacing={2}>
                    <StatTiles items={[
                        { label: "Members", value: String(filtered.length) },
                        { label: "Savings", value: formatCurrency(shown.savings) },
                        { label: "Shares", value: formatCurrency(shown.shares) },
                        { label: "Social", value: formatCurrency(shown.social) },
                        { label: "Total", value: formatCurrency(shown.total) }
                    ]} />
                    <TableContainer sx={{ maxHeight: 560, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                        <Table size="small" stickyHeader sx={zebraSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={headCellSx}>Member</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Savings</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Shares</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Social</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Withdrawals</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginate(filtered).map((row) => (
                                    <TableRow key={`${row.member_no}-${row.full_name}`}>
                                        <TableCell><MemberCell memberNo={row.member_no} name={row.full_name} /></TableCell>
                                        <TableCell align="right"><Money value={row.savings} /></TableCell>
                                        <TableCell align="right"><Money value={row.shares} /></TableCell>
                                        <TableCell align="right"><Money value={row.social} /></TableCell>
                                        <TableCell align="right"><Money value={row.withdrawals} /></TableCell>
                                        <TableCell align="right"><Money value={row.total} bold /></TableCell>
                                    </TableRow>
                                ))}
                                <TableRow sx={totalRowSx}>
                                    <TableCell><Typography variant="body2" sx={{ fontWeight: 800 }}>TOTAL — {filtered.length} members</Typography></TableCell>
                                    <TableCell align="right"><Money value={shown.savings} bold /></TableCell>
                                    <TableCell align="right"><Money value={shown.shares} bold /></TableCell>
                                    <TableCell align="right"><Money value={shown.social} bold /></TableCell>
                                    <TableCell align="right"><Money value={shown.withdrawals} bold /></TableCell>
                                    <TableCell align="right"><Money value={shown.total} bold /></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {paginationBar(filtered.length)}
                </Stack>
            );
        }

        if (activeKey === "monthly") {
            const typed = data as MonthlyContributionsData;
            const stickySx = { position: "sticky" as const, left: 0, zIndex: 1, bgcolor: "background.paper" };
            const filtered = typed.rows.filter((row) => matchesSearch(row.member_no, row.full_name));
            const shownMonthTotals = search.trim()
                ? typed.months.map((_, index) => filtered.reduce((sum, row) => sum + row.values[index], 0))
                : typed.month_totals;
            const shownGrand = search.trim()
                ? filtered.reduce((sum, row) => sum + row.total, 0)
                : typed.grand_total;
            return (
                <Stack spacing={2}>
                    <StatTiles items={[
                        { label: "Months", value: String(typed.months.length) },
                        { label: "Members", value: String(filtered.length) },
                        { label: "Grand total", value: formatCurrency(shownGrand) }
                    ]} />
                    <TableContainer sx={{ maxHeight: 560, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                        <Table size="small" stickyHeader sx={zebraSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ ...headCellSx, ...stickySx, zIndex: 3 }}>Member</TableCell>
                                    {typed.months.map((month) => (
                                        <TableCell key={month} align="right" sx={headCellSx}>{monthLabel(month)}</TableCell>
                                    ))}
                                    <TableCell align="right" sx={headCellSx}>Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginate(filtered).map((row) => (
                                    <TableRow key={`${row.member_no}-${row.full_name}`}>
                                        <TableCell sx={stickySx}><MemberCell memberNo={row.member_no} name={row.full_name} /></TableCell>
                                        {row.values.map((value, index) => (
                                            <TableCell key={typed.months[index]} align="right"><Money value={value} /></TableCell>
                                        ))}
                                        <TableCell align="right"><Money value={row.total} bold /></TableCell>
                                    </TableRow>
                                ))}
                                <TableRow sx={totalRowSx}>
                                    <TableCell sx={stickySx}><Typography variant="body2" sx={{ fontWeight: 800 }}>TOTAL</Typography></TableCell>
                                    {shownMonthTotals.map((value, index) => (
                                        <TableCell key={typed.months[index]} align="right"><Money value={value} bold /></TableCell>
                                    ))}
                                    <TableCell align="right"><Money value={shownGrand} bold /></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {paginationBar(filtered.length)}
                </Stack>
            );
        }

        if (activeKey === "dividends") {
            const typed = data as DividendDistributionsData;
            return (
                <Stack spacing={2}>
                    <StatTiles items={[
                        { label: "Distributions", value: String(typed.totals.distributions) },
                        { label: "From UTT", value: formatCurrency(typed.totals.utt) },
                        { label: "From loans", value: formatCurrency(typed.totals.loan) },
                        { label: "Total shared", value: formatCurrency(typed.totals.total) }
                    ]} />
                    <TableContainer sx={{ maxHeight: 560, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                        <Table size="small" stickyHeader sx={zebraSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={headCellSx}>Date</TableCell>
                                    <TableCell sx={headCellSx}>Distribution</TableCell>
                                    <TableCell sx={headCellSx}>Source</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Members</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Total</TableCell>
                                    <TableCell sx={headCellSx} />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {typed.rows.map((row) => {
                                    const batchKey = `${row.label}|${row.source}`;
                                    const expanded = expandedBatch === batchKey;
                                    return [
                                        <TableRow key={batchKey}>
                                            <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(row.date)}</TableCell>
                                            <TableCell>{row.label}</TableCell>
                                            <TableCell><SourceChip source={row.source} /></TableCell>
                                            <TableCell align="right">{row.member_count}</TableCell>
                                            <TableCell align="right"><Money value={row.total} bold /></TableCell>
                                            <TableCell align="right">
                                                <Button size="small" variant={expanded ? "contained" : "text"} onClick={() => setExpandedBatch(expanded ? null : batchKey)}>
                                                    {expanded ? "Hide" : "Members"}
                                                </Button>
                                            </TableCell>
                                        </TableRow>,
                                        expanded ? (
                                            <TableRow key={`${batchKey}-detail`}>
                                                <TableCell colSpan={6} sx={{ py: 0, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                                                    <Box sx={{ maxHeight: 280, overflow: "auto", my: 1.5, mx: 2, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
                                                        <Table size="small">
                                                            <TableBody>
                                                                {(row.allocations || []).map((allocation) => (
                                                                    <TableRow key={`${batchKey}-${allocation.member_no}-${allocation.full_name}`}>
                                                                        <TableCell sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>{allocation.member_no}</TableCell>
                                                                        <TableCell>{allocation.full_name}</TableCell>
                                                                        <TableCell align="right"><Money value={allocation.amount} /></TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ) : null
                                    ];
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
            );
        }

        if (activeKey === "positions") {
            const typed = data as MemberPositionsData;
            const filtered = typed.rows.filter((row) => matchesSearch(row.member_no, row.full_name));
            const shown = search.trim()
                ? filtered.reduce(
                    (acc, row) => ({
                        contributions: acc.contributions + row.contributions,
                        dividends: acc.dividends + row.dividends,
                        cumulative: acc.cumulative + row.cumulative
                    }),
                    { contributions: 0, dividends: 0, cumulative: 0 }
                )
                : typed.totals;
            return (
                <Stack spacing={2}>
                    <StatTiles items={[
                        { label: "Members", value: String(filtered.length) },
                        { label: "Contributions", value: formatCurrency(shown.contributions) },
                        { label: "Dividends", value: formatCurrency(shown.dividends) },
                        { label: "Cumulative", value: formatCurrency(shown.cumulative) }
                    ]} />
                    <TableContainer sx={{ maxHeight: 560, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                        <Table size="small" stickyHeader sx={zebraSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={headCellSx}>#</TableCell>
                                    <TableCell sx={headCellSx}>Member</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Contributions</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Dividends</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Cumulative</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginate(filtered).map((row) => (
                                    <TableRow key={`${row.rank}-${row.member_no}`}>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={row.rank}
                                                color={row.rank <= 3 ? "primary" : "default"}
                                                variant={row.rank <= 3 ? "filled" : "outlined"}
                                                sx={{ fontWeight: 700, minWidth: 40 }}
                                            />
                                        </TableCell>
                                        <TableCell><MemberCell memberNo={row.member_no} name={row.full_name} /></TableCell>
                                        <TableCell align="right"><Money value={row.contributions} /></TableCell>
                                        <TableCell align="right"><Money value={row.dividends} /></TableCell>
                                        <TableCell align="right"><Money value={row.cumulative} bold /></TableCell>
                                    </TableRow>
                                ))}
                                <TableRow sx={totalRowSx}>
                                    <TableCell colSpan={2}><Typography variant="body2" sx={{ fontWeight: 800 }}>TOTAL</Typography></TableCell>
                                    <TableCell align="right"><Money value={shown.contributions} bold /></TableCell>
                                    <TableCell align="right"><Money value={shown.dividends} bold /></TableCell>
                                    <TableCell align="right"><Money value={shown.cumulative} bold /></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {paginationBar(filtered.length)}
                </Stack>
            );
        }

        if (activeKey === "member-statement") {
            const typed = data as MemberProfitStatementData;
            return (
                <Stack spacing={2}>
                    <StatTiles items={[
                        { label: "Member", value: typed.member.full_name, helper: typed.member.member_no || undefined },
                        { label: "From UTT", value: formatCurrency(typed.totals.utt) },
                        { label: "From loans", value: formatCurrency(typed.totals.loan) },
                        { label: "Total earned", value: formatCurrency(typed.totals.total) }
                    ]} />
                    <TableContainer sx={{ maxHeight: 560, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                        <Table size="small" stickyHeader sx={zebraSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={headCellSx}>Date</TableCell>
                                    <TableCell sx={headCellSx}>Distribution</TableCell>
                                    <TableCell sx={headCellSx}>Source</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Amount</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Running total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {typed.rows.map((row) => (
                                    <TableRow key={`${row.date}-${row.label}-${row.amount}`}>
                                        <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(row.date)}</TableCell>
                                        <TableCell>{row.label}</TableCell>
                                        <TableCell><SourceChip source={row.source} /></TableCell>
                                        <TableCell align="right"><Money value={row.amount} /></TableCell>
                                        <TableCell align="right"><Money value={row.running_total} bold /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
            );
        }

        const typed = data as UttInvestmentsData;
        return (
            <Stack spacing={2}>
                <StatTiles items={[
                    { label: "Invested", value: formatCurrency(typed.totals.invested) },
                    { label: "Fund income", value: formatCurrency(typed.totals.income) },
                    { label: "Grand total", value: formatCurrency(typed.totals.grand_total) }
                ]} />
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Deposits into UTT</Typography>
                        <TableContainer sx={{ maxHeight: 420, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                            <Table size="small" stickyHeader sx={zebraSx}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={headCellSx}>Date</TableCell>
                                        <TableCell sx={headCellSx}>Reference</TableCell>
                                        <TableCell align="right" sx={headCellSx}>Amount</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {typed.deposits.map((row) => (
                                        <TableRow key={row.reference}>
                                            <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(row.date)}</TableCell>
                                            <TableCell sx={{ color: "text.secondary" }}>{row.reference}</TableCell>
                                            <TableCell align="right"><Money value={row.amount} /></TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow sx={totalRowSx}>
                                        <TableCell colSpan={2}><Typography variant="body2" sx={{ fontWeight: 800 }}>TOTAL INVESTED</Typography></TableCell>
                                        <TableCell align="right"><Money value={typed.totals.invested} bold /></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Fund income</Typography>
                        <TableContainer sx={{ maxHeight: 300, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                            <Table size="small" stickyHeader sx={zebraSx}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={headCellSx}>Date</TableCell>
                                        <TableCell sx={headCellSx}>Description</TableCell>
                                        <TableCell align="right" sx={headCellSx}>Amount</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {typed.income.map((row, index) => (
                                        <TableRow key={`${row.date}-${index}`}>
                                            <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(row.date)}</TableCell>
                                            <TableCell>{row.description || row.type}</TableCell>
                                            <TableCell align="right"><Money value={row.amount} /></TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow sx={totalRowSx}>
                                        <TableCell colSpan={2}><Typography variant="body2" sx={{ fontWeight: 800 }}>TOTAL INCOME</Typography></TableCell>
                                        <TableCell align="right"><Money value={typed.totals.income} bold /></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 700 }}>Contributions by funding source</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {typed.funding_sources.map((row) => (
                                <Chip key={row.source} label={`${row.source}: ${formatCurrency(row.amount)}`} variant="outlined" />
                            ))}
                        </Stack>
                    </Grid>
                </Grid>
            </Stack>
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeKey, data, error, expandedBatch, loading, theme, page, rowsPerPage, search]);

    return (
        <Stack spacing={2.5}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2}>
                <Box>
                    <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.16em", fontWeight: 700 }}>
                        All Reports
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                        {activeReport.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {activeReport.description}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <TextField
                        select
                        size="small"
                        label="Report"
                        value={activeKey}
                        onChange={(event) => navigate(`/all-reports/${event.target.value}`)}
                        sx={{ minWidth: 230 }}
                    >
                        {REPORTS.map((entry) => (
                            <MenuItem key={entry.key} value={entry.key}>{entry.label}</MenuItem>
                        ))}
                    </TextField>
                    <Button
                        variant="contained"
                        startIcon={<DownloadRoundedIcon />}
                        onClick={(event) => setExportAnchor(event.currentTarget)}
                        disabled={!data || loading}
                    >
                        Export
                    </Button>
                    <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}>
                        <MenuItem onClick={() => void handleExport("excel")}>Excel (.xlsx)</MenuItem>
                        <MenuItem onClick={() => void handleExport("pdf")}>PDF</MenuItem>
                        <MenuItem onClick={() => void handleExport("csv")}>CSV</MenuItem>
                    </Menu>
                </Stack>
            </Stack>

            <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                    <Stack spacing={2}>
                        {showDateFilters || activeKey === "member-statement" || activeKey === "positions" ? (
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} flexWrap="wrap" useFlexGap>
                                {activeKey === "contributions" || activeKey === "monthly" || activeKey === "positions" ? (
                                    <TextField
                                        label="Search member"
                                        size="small"
                                        placeholder="Name or member no."
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        sx={{ minWidth: 220 }}
                                    />
                                ) : null}
                                {showDateFilters ? (
                                    <>
                                        <FlatDateRangePicker
                                            label="Period"
                                            start={startDate}
                                            end={endDate}
                                            onChange={(from, to) => {
                                                setStartDate(from);
                                                setEndDate(to);
                                            }}
                                        />
                                        {startDate && endDate ? (
                                            <Button size="small" color="inherit" onClick={() => { setStartDate(""); setEndDate(""); }}>
                                                Clear
                                            </Button>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">
                                                Showing all time — pick a range to filter.
                                            </Typography>
                                        )}
                                    </>
                                ) : null}
                                {activeKey === "member-statement" ? (
                                    <Autocomplete
                                        options={members}
                                        value={selectedMember}
                                        onChange={(_, value) => setSelectedMember(value)}
                                        getOptionLabel={(member) => `${member.member_no ? `${member.member_no} — ` : ""}${member.full_name}`}
                                        isOptionEqualToValue={(left, right) => left.id === right.id}
                                        renderInput={(params) => <TextField {...params} label="Member" size="small" />}
                                        sx={{ minWidth: 320, maxWidth: 420, flex: 1 }}
                                    />
                                ) : null}
                            </Stack>
                        ) : null}
                        {body}
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
}
