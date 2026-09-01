import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControlLabel,
    Grid,
    Menu,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    Paper,
    TableContainer,
    TableFooter,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { FlatDateRangePicker } from "../components/FlatDateRangePicker";
import { api, getApiErrorMessage } from "../lib/api";
import { useToast } from "../components/Toast";
import { endpoints, type MembersResponse } from "../lib/endpoints";
import type { Member } from "../types/api";
import { downloadFile } from "../utils/downloadFile";
import { formatCurrency, formatDate } from "../utils/format";

type ReportKey = "funds-position" | "contributions" | "monthly" | "dividends" | "positions" | "member-statement" | "utt" | "performance-targets" | "commitments" | "summary-sorted" | "loans" | "loan-income" | "operations" | "operations-statement" | "gawio";

const REPORTS: { key: ReportKey; label: string; description: string }[] = [
    { key: "funds-position", label: "Summary Report", description: "The committee's SUMMARY REPORT sheet: bank, UTT and NMB-share investments, loans, dividends and charges — total amount available." },
    { key: "contributions", label: "Contributions Summary", description: "Per member: savings, shares and social contributions with withdrawals netted." },
    { key: "monthly", label: "Monthly Contributions", description: "Member-by-month contribution matrix for the selected period." },
    { key: "dividends", label: "Dividend Distributions", description: "Every distribution: date, source, pool and member allocations." },
    { key: "positions", label: "Member Positions", description: "Paid in, less withdrawals and the operations sweep, plus dividends — and where it sits today." },
    { key: "member-statement", label: "Member Profit Statement", description: "A single member's dividend history with running total." },
    { key: "utt", label: "UTT Investments", description: "UTT register: deposits, fund income, position and funding sources." },
    { key: "performance-targets", label: "Performance Targets", description: "Each member's annual target vs actual savings — % reached, remaining, position." },
    { key: "commitments", label: "Monthly Commitments", description: "Shares and monthly savings commitment compliance per member: expected vs paid, arrears and status." },
    { key: "summary-sorted", label: "Sorted Summary", description: "The full member schedule: entry fee, shares, monthly plan, needed to date, surplus/deficit and UTT flag — ranked by actual." },
    { key: "loans", label: "Loans (MIKOPO)", description: "Every loan: amount, interest, total due, repayment trail with running balance, guarantors, collateral and status." },
    { key: "loan-income", label: "Loan Income Reconciliation", description: "Interest the SACCO earned in a period, traced to the repayment that produced it — for checking against the monthly GAWIO sheet." },
    { key: "operations", label: "Operations Fund", description: "Running-cost ledger: member operations fees by month, other income, expenses and the fund's net." },
    { key: "operations-statement", label: "Operation Account (Monthly)", description: "Operation account statement: opening balance, incomes, expenditures and closing balance for every month. Visible to members." },
    { key: "gawio", label: "Gawio Summary (Monthly)", description: "The monthly GAWIO sheet: every loan dividend numbered in sequence, the month's UTT dividend and total gawio." }
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

interface MemberPositionRow {
    rank: number;
    member_no: string | null;
    full_name: string;
    /** Gross paid in, before anything was taken back out. */
    deposits: number;
    withdrawn: number;
    /** Swept to the SACCOS operations fund — not taken out by the member. */
    operations: number;
    /** deposits − withdrawn − operations. */
    contributions: number;
    dividends: number;
    cumulative: number;
    /** Where the cumulative position sits today. The two add up to it. */
    savings_balance: number;
    share_balance: number;
}

interface MemberPositionsData {
    rows: MemberPositionRow[];
    totals: Omit<MemberPositionRow, "rank" | "member_no" | "full_name">;
}

interface MemberProfitStatementData {
    member: { id: string; member_no: string | null; full_name: string };
    rows: { date: string; label: string; source: string; amount: number; running_total: number }[];
    totals: { utt: number; loan: number; total: number };
}

interface PerformanceTargetsData {
    settings: { enabled: boolean; default_annual_amount: number; required_amount: number; on_track_percent: number };
    rows: { position: number; member_no: string | null; full_name: string; actual: number; target: number; remaining: number; percent: number; on_track: boolean }[];
    totals: { actual: number; target: number; remaining: number; on_track_count: number };
}

interface CommitmentComplianceData {
    rows: {
        position: number;
        member_no: string | null;
        full_name: string;
        actual: number;
        shares: number;
        commitment: number;
        start_month: string | null;
        months_due: number;
        expected: number;
        paid: number;
        needed: number;
        months_behind: number;
        status: string;
    }[];
    totals: { actual: number; shares: number; expected: number; paid: number; needed: number; behind_count: number };
}

interface LoanIncomeData {
    start_date: string | null;
    end_date: string | null;
    loans: {
        loan_id: string;
        loan_number: string | null;
        member_no: string | null;
        member_name: string | null;
        monthly_rate_percent: number | null;
        interest_total: number;
        principal_total: number;
        paid_total: number;
        payment_count: number;
        last_payment_at: string;
        payments: {
            transaction_id: string;
            posted_at: string;
            amount: number;
            interest_component: number;
            principal_component: number;
            principal_balance_after: number;
            reference: string | null;
            is_top_up_settlement: boolean;
            is_correction: boolean;
            corrects_transaction_id: string | null;
            posted_by: string | null;
        }[];
    }[];
    investment_income: { id: string; income_type: string; amount: number; received_date: string; description: string | null }[];
    totals: {
        loan_interest: number;
        investment_income: number;
        grand_total: number;
        payment_count: number;
        loan_count: number;
        top_up_settlement_interest: number;
    };
}

interface LoansReportData {
    rows: {
        index: number;
        loan_number: string;
        date_applied: string;
        member_no: string | null;
        member_name: string;
        principal: number;
        interest: number;
        /** Interest the loan carries inside the chosen window; null when no range is set. */
        period_interest: number | null;
        contractual_interest: number;
        total_due: number;
        due_date: string | null;
        paid: number;
        balance: number;
        guarantors: string;
        collateral: number;
        status: string;
        repayments?: { date: string; amount: number; balance: number }[];
        schedule?: {
            installment: number;
            due_date: string;
            principal_due: number;
            interest_due: number;
            total_due: number;
            principal_paid: number;
            interest_paid: number;
            status: string;
        }[];
    }[];
    totals: { count: number; principal: number; interest: number; total: number; paid: number; balance: number; period_interest: number | null };
    period: { start_date: string | null; end_date: string | null } | null;
}

interface OperationsTransferRow {
    member_id: string;
    member_no?: string | null;
    full_name: string;
    reason?: "insufficient_balance" | "no_savings_account" | "guarantee_encumbrance" | "posting_failed";
    available_balance?: number;
    shortfall?: number;
    encumbered_amount?: number;
    amount?: number;
    new_balance?: number;
    transferred_amount?: number;
    transferred_on?: string | null;
    /** Database message when the posting itself failed — shown so a failure explains itself. */
    error?: string | null;
}

interface OperationsTransferResult {
    dry_run: boolean;
    eligible?: OperationsTransferRow[];
    transferred?: OperationsTransferRow[];
    skipped: OperationsTransferRow[];
    /** Members already levied in the same month — excluded so a repeat run cannot double-charge. */
    already_transferred?: OperationsTransferRow[];
    totals: {
        amount_per_member: number;
        month?: string;
        selected_count?: number;
        eligible_count: number;
        eligible_total: number;
        skipped_count: number;
        already_count?: number;
        already_total?: number;
        transferred_count?: number;
        transferred_total?: number;
    };
}

const TRANSFER_SKIP_REASONS: Record<string, string> = {
    already_transferred: "Tayari amehamishiwa mwezi huu",
    insufficient_balance: "Akiba haitoshi",
    no_savings_account: "Hana akaunti ya akiba",
    guarantee_encumbrance: "Akiba imefungwa na dhamana ya mkopo",
    posting_failed: "Imeshindikana kupost"
};

interface OperationsFundData {
    months: string[];
    member_rows: { member_id: string; member_no: string | null; full_name: string; values: number[]; total: number }[];
    line_rows: { id: string; source?: string; entry_type: string; label: string; date: string; month: string; amount: number }[];
    month_totals: number[];
    totals: { member_fees: number; other_income: number; expenses: number; net: number };
}

interface SummarySortedData {
    months: string[];
    config: { kiingilio: number; shares_required: number; monthly_required: number; needed: number };
    rows: { position: number; member_no: string | null; full_name: string; actual: number; utt: boolean; status_amount: number }[];
    totals: { actual: number; above_needed: number; utt_count: number };
}

interface UttInvestmentsData {
    deposits: { date: string; reference: string; amount: number }[];
    income: { date: string; type: string; description: string | null; amount: number }[];
    position: { total_cost: number; current_market_value: number } | null;
    totals: { invested: number; income: number; grand_total: number };
    funding_sources: { source: string; amount: number }[];
}

interface OperationsStatementLine {
    date: string | null;
    label: string;
    amount: number;
}

interface OperationsStatementData {
    rows: {
        month: string;
        opening: number;
        income: number;
        expenses: number;
        net: number;
        closing: number;
        income_lines: OperationsStatementLine[];
        expense_lines: OperationsStatementLine[];
    }[];
    totals: { income: number; expenses: number; balance: number };
}

interface GawioSummaryData {
    months: {
        month: string;
        loan_lines: { sequence: number; member_name: string; date: string; amount: number }[];
        loan_total: number;
        utt_lines: { label: string; date: string; amount: number }[];
        utt_total: number;
        total: number;
    }[];
    totals: { loan: number; utt: number; gawio: number };
}

interface FundsPositionData {
    figures: { bank_balance: number | null; updated_at: string | null };
    rows: {
        bank_balance: number;
        utt_invested: number;
        shares_invested: number;
        loans_outstanding: number;
        interest_expected: number;
        utt_dividends: number;
        loan_interest_collected: number;
        operation_account: number;
        balance_charges: number;
    };
    total_available: number;
}

const FULL_MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

function fullMonthLabel(month: string) {
    const [year, mm] = month.split("-");
    return `${FULL_MONTHS[Number(mm) - 1]} ${year}`;
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
    const { pushToast } = useToast();
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    // The loans report answers "what interest does the book carry this month",
    // so it opens on the current month instead of all time. Cleared ranges are
    // remembered per visit — this only seeds the first time the report is shown.
    const seededLoansPeriod = useRef(false);
    useEffect(() => {
        if (activeKey !== "loans" || seededLoansPeriod.current) {
            return;
        }
        seededLoansPeriod.current = true;
        if (startDate || endDate) {
            return;
        }
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const iso = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
        setStartDate(iso(monthStart));
        setEndDate(iso(monthEnd));
    }, [activeKey, startDate, endDate]);
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
    // Sorted Summary schedule start (YYYY-MM); empty = first contribution month.
    const [scheduleStart, setScheduleStart] = useState("2024-10");
    const { profile } = useAuth();
    const canManageOperations = ["super_admin", "branch_manager"].includes(profile?.role || "");
    // Operations Fund entry dialog.
    const [entryOpen, setEntryOpen] = useState(false);
    const [entrySubmitting, setEntrySubmitting] = useState(false);
    const [entryError, setEntryError] = useState<string | null>(null);
    const [entryForm, setEntryForm] = useState({
        entry_type: "member_fee" as "member_fee" | "income" | "expense",
        member: null as Member | null,
        label: "",
        amount: "15000",
        entry_date: new Date().toISOString().slice(0, 10)
    });

    const submitEntry = async () => {
        setEntrySubmitting(true);
        setEntryError(null);
        try {
            await api.post(endpoints.operations.entries(), {
                entry_type: entryForm.entry_type,
                member_id: entryForm.entry_type === "member_fee" ? entryForm.member?.id : undefined,
                label: entryForm.label || undefined,
                amount: Number(entryForm.amount),
                entry_date: entryForm.entry_date
            });
            setEntryOpen(false);
            setEntryForm((current) => ({ ...current, member: null, label: "", amount: current.entry_type === "member_fee" ? "15000" : "" }));
            await load();
        } catch (submitError) {
            setEntryError(getApiErrorMessage(submitError));
        } finally {
            setEntrySubmitting(false);
        }
    };

    // Savings → Operations transfer (single or bulk levy). Always previews
    // (dry run) before the real run so the officer sees who will be skipped.
    const [transferOpen, setTransferOpen] = useState(false);
    const [transferSubmitting, setTransferSubmitting] = useState(false);
    const [transferError, setTransferError] = useState<string | null>(null);
    const [transferForm, setTransferForm] = useState({
        amount: "200000",
        entry_date: new Date().toISOString().slice(0, 10),
        all_active: true,
        members: [] as Member[],
        notes: ""
    });
    const [transferPreview, setTransferPreview] = useState<OperationsTransferResult | null>(null);
    const [transferResult, setTransferResult] = useState<OperationsTransferResult | null>(null);

    const openTransferDialog = () => {
        setTransferError(null);
        setTransferPreview(null);
        setTransferResult(null);
        setTransferOpen(true);
    };

    const runTransfer = async (dryRun: boolean) => {
        setTransferSubmitting(true);
        setTransferError(null);
        try {
            const response = await api.post<{ data: OperationsTransferResult }>(endpoints.operations.savingsTransfers(), {
                amount: Number(transferForm.amount),
                entry_date: transferForm.entry_date,
                all_active: transferForm.all_active || undefined,
                member_ids: transferForm.all_active ? undefined : transferForm.members.map((member) => member.id),
                notes: transferForm.notes.trim() || undefined,
                dry_run: dryRun || undefined
            });
            if (dryRun) {
                setTransferPreview(response.data.data);
            } else {
                setTransferResult(response.data.data);
                setTransferPreview(null);
                await load();
            }
        } catch (submitError) {
            setTransferError(getApiErrorMessage(submitError));
        } finally {
            setTransferSubmitting(false);
        }
    };

    const reverseOperationsEntry = async (id: string) => {
        try {
            await api.post(endpoints.operations.reverse(id), {});
            await load();
        } catch (reverseError) {
            setError(getApiErrorMessage(reverseError));
        }
    };

    // Assign an unattributed loan-fee line to a member (moves it into the grid).
    const [assignRow, setAssignRow] = useState<{ id: string; label: string } | null>(null);
    const [assignMember, setAssignMember] = useState<Member | null>(null);
    const [assignSubmitting, setAssignSubmitting] = useState(false);
    const [assignError, setAssignError] = useState<string | null>(null);

    const submitAssign = async () => {
        if (!assignRow || !assignMember) return;
        setAssignSubmitting(true);
        setAssignError(null);
        try {
            await api.post(endpoints.operations.assignLoanFee(assignRow.id.replace(/^loanfee-/, "")), {
                member_id: assignMember.id
            });
            setAssignRow(null);
            setAssignMember(null);
            await load();
        } catch (submitError) {
            setAssignError(getApiErrorMessage(submitError));
        } finally {
            setAssignSubmitting(false);
        }
    };

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
            } else if (activeKey === "performance-targets") {
                response = await api.get<{ data: PerformanceTargetsData }>(endpoints.allReports.performanceTargets());
            } else if (activeKey === "commitments") {
                response = await api.get<{ data: CommitmentComplianceData }>(endpoints.allReports.commitments());
            } else if (activeKey === "summary-sorted") {
                response = await api.get<{ data: SummarySortedData }>(endpoints.allReports.summarySorted(), {
                    params: scheduleStart ? { start_month: scheduleStart } : {}
                });
            } else if (activeKey === "loans") {
                response = await api.get<{ data: LoansReportData }>(endpoints.allReports.loans(), {
                    params: {
                        include_repayments: "true",
                        ...(startDate ? { start_date: startDate } : {}),
                        ...(endDate ? { end_date: endDate } : {})
                    }
                });
            } else if (activeKey === "loan-income") {
                response = await api.get<{ data: LoanIncomeData }>(endpoints.allReports.loanIncome(), { params });
            } else if (activeKey === "operations") {
                response = await api.get<{ data: OperationsFundData }>(endpoints.allReports.operationsFund());
            } else if (activeKey === "funds-position") {
                response = await api.get<{ data: FundsPositionData }>(endpoints.allReports.fundsPosition());
            } else if (activeKey === "operations-statement") {
                response = await api.get<{ data: OperationsStatementData }>(endpoints.allReports.operationsStatement());
            } else if (activeKey === "gawio") {
                response = await api.get<{ data: GawioSummaryData }>(endpoints.allReports.gawioSummary());
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
    }, [activeKey, startDate, endDate, selectedMember, scheduleStart]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        if (!["member-statement", "operations"].includes(activeKey) || members.length) {
            return;
        }
        void api
            .get<MembersResponse>(endpoints.members.list(), { params: { limit: 1000 } })
            .then((response) => setMembers(response.data.data || []))
            .catch(() => setMembers([]));
    }, [activeKey, members.length]);

    // Clicked month on the Operation Account statement — the dialog lists the
    // entries behind the incomes or expenditures figure.
    const [opDetail, setOpDetail] = useState<{ title: string; lines: OperationsStatementLine[]; total: number } | null>(null);

    // Treasurer-entered NMB bank balance — the only summary figure the system
    // can't derive. A blank field clears the stored figure.
    const [figuresOpen, setFiguresOpen] = useState(false);
    const [figuresSaving, setFiguresSaving] = useState(false);
    const [figuresForm, setFiguresForm] = useState({ bank: "" });

    const openFiguresDialog = (figures: FundsPositionData["figures"]) => {
        setFiguresForm({
            bank: figures.bank_balance == null ? "" : String(figures.bank_balance)
        });
        setFiguresOpen(true);
    };

    const submitFigures = async () => {
        const parse = (raw: string, label: string): number | null | undefined => {
            if (!raw.trim()) return null;
            const value = Number(raw.replace(/,/g, ""));
            if (!Number.isFinite(value) || value < 0) {
                pushToast({ type: "error", title: "Invalid amount", message: `${label} must be a positive amount.` });
                return undefined;
            }
            return Math.round(value * 100) / 100;
        };
        const bank = parse(figuresForm.bank, "Bank balance");
        if (bank === undefined) return;
        setFiguresSaving(true);
        try {
            await api.patch(endpoints.allReports.fundsPositionFigures(), {
                funds_bank_balance: bank
            });
            pushToast({ type: "success", title: "Figures saved", message: "The funds position has been updated." });
            setFiguresOpen(false);
            await load();
        } catch (saveError) {
            pushToast({ type: "error", title: "Could not save", message: getApiErrorMessage(saveError) });
        } finally {
            setFiguresSaving(false);
        }
    };

    // Restating a posted interest figure. The dialog carries the recorded value
    // and what the register rule would give, so the officer is choosing between
    // two known numbers rather than typing one from memory.
    const [correctRow, setCorrectRow] = useState<{ id: string; member: string; amount: number; interest: number } | null>(null);
    const [correctInterest, setCorrectInterest] = useState("");
    const [correctReason, setCorrectReason] = useState("");
    const [correctSaving, setCorrectSaving] = useState(false);

    const submitCorrection = async () => {
        if (!correctRow) return;
        const value = Number(correctInterest);
        if (!Number.isFinite(value) || value < 0) {
            pushToast({ type: "error", title: "Invalid amount", message: "Enter the corrected interest." });
            return;
        }
        if (correctReason.trim().length < 3) {
            pushToast({ type: "error", title: "Reason required", message: "Say why the figure is being corrected." });
            return;
        }
        setCorrectSaving(true);
        try {
            await api.post(endpoints.finance.correctLoanInterest(correctRow.id), {
                corrected_interest: value,
                reason: correctReason.trim()
            });
            pushToast({ type: "success", title: "Interest corrected", message: "The split was restated and the loan balance rebuilt." });
            setCorrectRow(null);
            setCorrectInterest("");
            setCorrectReason("");
            await load();
        } catch (correctError) {
            pushToast({ type: "error", title: "Could not correct", message: getApiErrorMessage(correctError) });
        } finally {
            setCorrectSaving(false);
        }
    };

    const showDateFilters = activeKey === "contributions" || activeKey === "monthly" || activeKey === "loan-income" || activeKey === "loans";

    const getExportData = (): { name: string; title: string; headers: string[]; rows: (string | number | null)[][] } | null => {
        if (!data) return null;
        if (activeKey === "funds-position") {
            const typed = data as FundsPositionData;
            return {
                name: "summary-report",
                title: "SUMMARY REPORT",
                headers: ["ITEM", "AMOUNT (TZS)"],
                rows: [
                    ["BANK - NMB", typed.rows.bank_balance],
                    ["TOTAL INVESTED UTT", typed.rows.utt_invested],
                    ["TOTAL AMOUNT INVESTED WITH NMB SHARES", typed.rows.shares_invested],
                    ["TOTAL LOANS", typed.rows.loans_outstanding],
                    ["INTEREST EXPECTED -LOAN", typed.rows.interest_expected],
                    ["TOTAL UTT DIVIDENTS", typed.rows.utt_dividends],
                    ["TOTAL LOANS DIVIDENTS", typed.rows.loan_interest_collected],
                    ["OPERATION ACCOUNT", typed.rows.operation_account],
                    ["BALANCE CHARGES", -typed.rows.balance_charges],
                    ["TOTAL AMOUNT AVAILABLE", typed.total_available]
                ]
            };
        }
        if (activeKey === "gawio") {
            const typed = data as GawioSummaryData;
            const rows: (string | number | null)[][] = [];
            typed.months.forEach((entry) => {
                rows.push([`DIVIDENDS ${fullMonthLabel(entry.month)}`, null]);
                entry.loan_lines.forEach((line) => rows.push([`DIVIDEND ${line.sequence} - ${line.member_name} ${line.date}`, line.amount]));
                rows.push(["TOTAL LOAN DIVIDEND", entry.loan_total]);
                entry.utt_lines.forEach((line) => rows.push([`${line.label} - ${line.date}`, line.amount]));
                rows.push([`TOTAL GAWIO FOR ${fullMonthLabel(entry.month)}`, entry.total]);
            });
            return { name: "gawio-summary", title: "GAWIO SUMMARY", headers: ["ITEM", "AMOUNT"], rows };
        }
        if (activeKey === "operations-statement") {
            const typed = data as OperationsStatementData;
            return {
                name: "operation-account-monthly",
                title: "Operation Account — Monthly Statement",
                headers: ["Month", "Opening Balance", "Incomes", "Expenditures", "Closing Balance"],
                rows: [
                    ...typed.rows.map((row) => [row.month, row.opening, row.income, row.expenses, row.closing] as (string | number | null)[]),
                    ["TOTAL", null, typed.totals.income, typed.totals.expenses, typed.totals.balance]
                ]
            };
        }
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
                headers: [
                    "Rank", "Member No", "Member", "Paid In", "Withdrawn", "To Operations",
                    "Contributions", "Dividends", "Cumulative", "In Savings", "In Shares"
                ],
                rows: [
                    ...typed.rows.map((row) => [
                        row.rank, row.member_no, row.full_name, row.deposits, row.withdrawn, row.operations,
                        row.contributions, row.dividends, row.cumulative, row.savings_balance, row.share_balance
                    ] as (string | number | null)[]),
                    [
                        "", "", "TOTAL", typed.totals.deposits, typed.totals.withdrawn, typed.totals.operations,
                        typed.totals.contributions, typed.totals.dividends, typed.totals.cumulative,
                        typed.totals.savings_balance, typed.totals.share_balance
                    ]
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
        if (activeKey === "operations") {
            const typed = data as OperationsFundData;
            const monthLabel = (month: string) => {
                const [year, mm] = month.split("-");
                return `${["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][Number(mm) - 1]} ${year}`;
            };
            return {
                name: "operations-fund",
                title: "Operations Fund",
                headers: ["Member No", "Member / Line", ...typed.months.map(monthLabel), "Total"],
                rows: [
                    ...typed.member_rows.map((row) => [row.member_no, row.full_name, ...row.values, row.total] as (string | number | null)[]),
                    ...typed.line_rows.map((row) => [
                        "",
                        row.label,
                        ...typed.months.map((month) => (month === row.month ? row.amount : "")),
                        row.amount
                    ] as (string | number | null)[]),
                    ["", "MONTH TOTALS", ...typed.month_totals, typed.totals.net]
                ]
            };
        }
        if (activeKey === "loans") {
            const typed = data as LoansReportData;
            return {
                name: "loans-mikopo",
                title: "Loans (MIKOPO)",
                headers: [
                    "#", "Date", "Member No", "Member", "Loan Amount",
                    ...(typed.period ? ["Interest (period)"] : []),
                    "Interest", "Total + Interest", "Due Date", "Paid", "Balance", "Guarantors", "Collateral", "Status"
                ],
                rows: [
                    ...typed.rows.map((row) => [
                        row.index, row.date_applied, row.member_no, row.member_name, row.principal,
                        ...(typed.period ? [row.period_interest ?? 0] : []),
                        row.interest, row.total_due, row.due_date, row.paid, row.balance, row.guarantors, row.collateral, row.status
                    ] as (string | number | null)[]),
                    [
                        "", "", "", "TOTAL", typed.totals.principal,
                        ...(typed.period ? [typed.totals.period_interest ?? 0] : []),
                        typed.totals.interest, typed.totals.total, "", typed.totals.paid, typed.totals.balance, "", "", `${typed.totals.count} loans`
                    ]
                ]
            };
        }
        if (activeKey === "summary-sorted") {
            const typed = data as SummarySortedData;
            const monthLabelShort = (month: string) => {
                const [year, mm] = month.split("-");
                return `${["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][Number(mm) - 1]} ${year}`;
            };
            return {
                name: "sorted-summary",
                title: "Sorted Summary",
                headers: ["Position", "Member No", "Member", "Actual", "Kiingilio", "Shares", ...typed.months.map(monthLabelShort), "Needed", "Status", "UTT"],
                rows: typed.rows.map((row) => [
                    row.position,
                    row.member_no,
                    row.full_name,
                    row.actual,
                    typed.config.kiingilio,
                    typed.config.shares_required,
                    ...typed.months.map(() => typed.config.monthly_required),
                    typed.config.needed,
                    row.status_amount,
                    row.utt ? "YES" : "NO"
                ] as (string | number | null)[])
            };
        }
        if (activeKey === "performance-targets") {
            const typed = data as PerformanceTargetsData;
            return {
                name: "performance-targets",
                title: "Performance Targets",
                headers: ["Position", "Member No", "Member", "Actual Savings", "Annual Target", "Remaining", "% Reach", "On Track"],
                rows: [
                    ...typed.rows.map((row) => [row.position, row.member_no, row.full_name, row.actual, row.target, row.remaining, `${row.percent}%`, row.on_track ? "YES" : "NO"] as (string | number | null)[]),
                    ["", "", "TOTAL", typed.totals.actual, typed.totals.target, typed.totals.remaining, "", `${typed.totals.on_track_count} on track`]
                ]
            };
        }
        if (activeKey === "commitments") {
            const typed = data as CommitmentComplianceData;
            return {
                name: "monthly-commitments",
                title: "Monthly Commitments",
                headers: ["Position", "Member No", "Member", "Actual", "Shares", "Commitment/Month", "Since", "Months", "Expected", "Paid", "Needed", "Status"],
                rows: [
                    ...typed.rows.map((row) => [row.position, row.member_no, row.full_name, row.actual, row.shares, row.commitment, row.start_month, row.months_due, row.expected, row.paid, row.needed, row.status] as (string | number | null)[]),
                    ["", "", "TOTAL", typed.totals.actual, typed.totals.shares, "", "", "", typed.totals.expected, typed.totals.paid, typed.totals.needed, `${typed.totals.behind_count} behind`]
                ]
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
                        deposits: acc.deposits + row.deposits,
                        withdrawn: acc.withdrawn + row.withdrawn,
                        operations: acc.operations + row.operations,
                        contributions: acc.contributions + row.contributions,
                        dividends: acc.dividends + row.dividends,
                        cumulative: acc.cumulative + row.cumulative,
                        savings_balance: acc.savings_balance + row.savings_balance,
                        share_balance: acc.share_balance + row.share_balance
                    }),
                    {
                        deposits: 0, withdrawn: 0, operations: 0, contributions: 0,
                        dividends: 0, cumulative: 0, savings_balance: 0, share_balance: 0
                    }
                )
                : typed.totals;
            return (
                <Stack spacing={2}>
                    <StatTiles items={[
                        { label: "Members", value: String(filtered.length) },
                        { label: "Contributions", value: formatCurrency(shown.contributions), helper: "Paid in, less withdrawals and the operations sweep" },
                        { label: "Dividends", value: formatCurrency(shown.dividends) },
                        { label: "Cumulative", value: formatCurrency(shown.cumulative) },
                        { label: "Held in savings", value: formatCurrency(shown.savings_balance) },
                        { label: "Held in shares", value: formatCurrency(shown.share_balance) }
                    ]} />
                    <TableContainer sx={{ maxHeight: 560, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                        <Table size="small" stickyHeader sx={zebraSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={headCellSx}>#</TableCell>
                                    <TableCell sx={headCellSx}>Member</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Paid in</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Withdrawn</TableCell>
                                    <TableCell align="right" sx={headCellSx} title="Swept to the SACCOS operations fund">To operations</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Contributions</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Dividends</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Cumulative</TableCell>
                                    <TableCell align="right" sx={headCellSx}>In savings</TableCell>
                                    <TableCell align="right" sx={headCellSx}>In shares</TableCell>
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
                                        <TableCell align="right"><Money value={row.deposits} /></TableCell>
                                        <TableCell align="right"><Money value={row.withdrawn} /></TableCell>
                                        <TableCell align="right"><Money value={row.operations} /></TableCell>
                                        <TableCell align="right"><Money value={row.contributions} /></TableCell>
                                        <TableCell align="right"><Money value={row.dividends} /></TableCell>
                                        <TableCell align="right"><Money value={row.cumulative} bold /></TableCell>
                                        <TableCell align="right"><Money value={row.savings_balance} /></TableCell>
                                        <TableCell align="right"><Money value={row.share_balance} /></TableCell>
                                    </TableRow>
                                ))}
                                <TableRow sx={totalRowSx}>
                                    <TableCell colSpan={2}><Typography variant="body2" sx={{ fontWeight: 800 }}>TOTAL</Typography></TableCell>
                                    <TableCell align="right"><Money value={shown.deposits} bold /></TableCell>
                                    <TableCell align="right"><Money value={shown.withdrawn} bold /></TableCell>
                                    <TableCell align="right"><Money value={shown.operations} bold /></TableCell>
                                    <TableCell align="right"><Money value={shown.contributions} bold /></TableCell>
                                    <TableCell align="right"><Money value={shown.dividends} bold /></TableCell>
                                    <TableCell align="right"><Money value={shown.cumulative} bold /></TableCell>
                                    <TableCell align="right"><Money value={shown.savings_balance} bold /></TableCell>
                                    <TableCell align="right"><Money value={shown.share_balance} bold /></TableCell>
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

        if (activeKey === "operations") {
            const typed = data as OperationsFundData;
            const filtered = typed.member_rows.filter((row) => matchesSearch(row.member_no, row.full_name));
            const stickySx = { position: "sticky" as const, left: 0, zIndex: 1, bgcolor: "background.paper" };
            const monthShort = (month: string) => {
                const [year, mm] = month.split("-");
                return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(mm) - 1]} ${year.slice(2)}`;
            };
            return (
                <Stack spacing={2}>
                    <StatTiles items={[
                        { label: "Member fees", value: formatCurrency(typed.totals.member_fees), helper: `${typed.member_rows.length} member(s) paid` },
                        { label: "Other income", value: formatCurrency(typed.totals.other_income) },
                        { label: "Expenses", value: formatCurrency(Math.abs(typed.totals.expenses)) },
                        { label: "Fund net", value: formatCurrency(typed.totals.net), helper: typed.totals.net < 0 ? "Deficit — costs exceed ops income" : "Surplus" }
                    ]} />

                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Member operations fees</Typography>
                    <TableContainer sx={{ maxHeight: 420, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                        <Table size="small" stickyHeader sx={zebraSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ ...headCellSx, ...stickySx, zIndex: 3 }}>Member</TableCell>
                                    {typed.months.map((month) => (
                                        <TableCell key={month} align="right" sx={headCellSx}>{monthShort(month)}</TableCell>
                                    ))}
                                    <TableCell align="right" sx={headCellSx}>Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginate(filtered).map((row) => (
                                    <TableRow key={row.member_id}>
                                        <TableCell sx={stickySx}><MemberCell memberNo={row.member_no} name={row.full_name} /></TableCell>
                                        {row.values.map((value, index) => (
                                            <TableCell key={typed.months[index]} align="right"><Money value={value} /></TableCell>
                                        ))}
                                        <TableCell align="right"><Money value={row.total} bold /></TableCell>
                                    </TableRow>
                                ))}
                                <TableRow sx={totalRowSx}>
                                    <TableCell sx={stickySx}><Typography variant="body2" sx={{ fontWeight: 800 }}>FEES TOTAL</Typography></TableCell>
                                    <TableCell colSpan={typed.months.length} />
                                    <TableCell align="right"><Money value={typed.totals.member_fees} bold /></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {paginationBar(filtered.length)}

                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Other income & expenses</Typography>
                    <TableContainer sx={{ borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                        <Table size="small" sx={zebraSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={headCellSx}>Date</TableCell>
                                    <TableCell sx={headCellSx}>Line</TableCell>
                                    <TableCell sx={headCellSx}>Type</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Amount</TableCell>
                                    {canManageOperations ? <TableCell sx={headCellSx} /> : null}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {typed.line_rows.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(row.date)}</TableCell>
                                        <TableCell>{row.label}</TableCell>
                                        <TableCell>
                                            <Chip size="small" variant="outlined" label={row.entry_type === "expense" ? "EXPENSE" : "INCOME"} color={row.entry_type === "expense" ? "error" : "success"} sx={{ fontWeight: 700 }} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography component="span" variant="body2" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color: row.amount < 0 ? "error.main" : "success.main" }}>
                                                {formatCurrency(row.amount)}
                                            </Typography>
                                        </TableCell>
                                        {canManageOperations ? (
                                            <TableCell align="right">
                                                {row.source === "loan_fee" ? (
                                                    <Button size="small" onClick={() => setAssignRow({ id: row.id, label: row.label })}>
                                                        Assign member
                                                    </Button>
                                                ) : row.source === "ledger" ? (
                                                    // Swept straight from the GL (4025/5015) because no
                                                    // operations_entries row was ever written for it — a
                                                    // Weekly Challenge prize, or an expense booked through
                                                    // the finance screen. Its id is synthetic, so the
                                                    // reverse endpoint would reject it out of hand; and
                                                    // even with a real id, reversing another module's
                                                    // journal from here is not this screen's business.
                                                    // Reverse it where it was posted.
                                                    <Tooltip title="Posted directly to the ledger by another part of the system. Reverse it where it was created.">
                                                        <Typography variant="caption" sx={{ color: "text.disabled" }}>
                                                            Ledger
                                                        </Typography>
                                                    </Tooltip>
                                                ) : (
                                                    <Button size="small" color="inherit" onClick={() => void reverseOperationsEntry(row.id)}>Reverse</Button>
                                                )}
                                            </TableCell>
                                        ) : null}
                                    </TableRow>
                                ))}
                                <TableRow sx={totalRowSx}>
                                    <TableCell colSpan={3}><Typography variant="body2" sx={{ fontWeight: 800 }}>FUND NET (fees + income − expenses)</Typography></TableCell>
                                    <TableCell align="right">
                                        <Typography component="span" variant="body2" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 800, color: typed.totals.net < 0 ? "error.main" : "success.main" }}>
                                            {formatCurrency(typed.totals.net)}
                                        </Typography>
                                    </TableCell>
                                    {canManageOperations ? <TableCell /> : null}
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
            );
        }

        if (activeKey === "loan-income") {
            const typed = data as LoanIncomeData;
            const filtered = typed.loans.filter((row) => matchesSearch(row.member_no, row.member_name || ""));

            return (
                <Stack spacing={2}>
                    <StatTiles
                        items={[
                            { label: "Loan interest", value: formatCurrency(typed.totals.loan_interest), helper: `${typed.totals.payment_count} payment(s) on ${typed.totals.loan_count} loan(s)` },
                            { label: "Investment income", value: formatCurrency(typed.totals.investment_income), helper: `${typed.investment_income.length} entry(ies)` },
                            { label: "Total income", value: formatCurrency(typed.totals.grand_total), helper: "Loan interest + investments" },
                            { label: "From top-up settlements", value: formatCurrency(typed.totals.top_up_settlement_interest), helper: "Interest realised without cash crossing the counter" }
                        ]}
                    />

                    {typed.totals.top_up_settlement_interest > 0 ? (
                        <Alert severity="info" variant="outlined">
                            {formatCurrency(typed.totals.top_up_settlement_interest)} of this interest came from top-up settlements — the old loan was cleared out of the new facility, so no cash was received at the counter. A hand-kept sheet usually misses these, and it is the first place to look when the two totals disagree.
                        </Alert>
                    ) : null}

                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: 56 }}>#</TableCell>
                                    <TableCell>Member</TableCell>
                                    <TableCell>Loan</TableCell>
                                    <TableCell align="right">Interest earned</TableCell>
                                    <TableCell align="right">Principal repaid</TableCell>
                                    <TableCell align="right">Total paid</TableCell>
                                    <TableCell align="right">Payments</TableCell>
                                    <TableCell>Last payment</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtered.map((row, index) => (
                                    <TableRow key={row.loan_id} hover>
                                        <TableCell sx={{ color: "text.secondary" }}>{index + 1}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.member_name || "—"}</Typography>
                                            <Typography variant="caption" color="text.secondary">{row.member_no || "—"}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption">{row.loan_number || "—"}</Typography>
                                            {row.monthly_rate_percent ? (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                                    {row.monthly_rate_percent}% / month
                                                </Typography>
                                            ) : null}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(row.interest_total)}</TableCell>
                                        <TableCell align="right">{formatCurrency(row.principal_total)}</TableCell>
                                        <TableCell align="right">{formatCurrency(row.paid_total)}</TableCell>
                                        <TableCell align="right">{row.payment_count}</TableCell>
                                        <TableCell>{formatDate(row.last_payment_at)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow sx={{ "& td": { fontWeight: 800, color: "text.primary", borderTop: 2, borderColor: "divider", fontSize: "0.875rem" } }}>
                                    <TableCell />
                                    <TableCell colSpan={2}>
                                        Total — {filtered.length} loan(s)
                                        {filtered.length !== typed.loans.length ? ` of ${typed.loans.length}` : ""}
                                    </TableCell>
                                    <TableCell align="right">
                                        {formatCurrency(filtered.reduce((sum, row) => sum + row.interest_total, 0))}
                                    </TableCell>
                                    <TableCell align="right">
                                        {formatCurrency(filtered.reduce((sum, row) => sum + row.principal_total, 0))}
                                    </TableCell>
                                    <TableCell align="right">
                                        {formatCurrency(filtered.reduce((sum, row) => sum + row.paid_total, 0))}
                                    </TableCell>
                                    <TableCell align="right">
                                        {filtered.reduce((sum, row) => sum + row.payment_count, 0)}
                                    </TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </TableContainer>

                    {/* The working behind every figure above: each payment, when it was
                        posted, who posted it, how it split, and the balance it left. This
                        is what makes a disagreement with the sheet answerable. */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>How each figure was earned</Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 520 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: 90 }}>Fix</TableCell>
                                    <TableCell>Posted</TableCell>
                                    <TableCell>Member</TableCell>
                                    <TableCell align="right">Cash paid</TableCell>
                                    <TableCell align="right">To interest</TableCell>
                                    <TableCell align="right">To principal</TableCell>
                                    <TableCell align="right">Balance after</TableCell>
                                    <TableCell>Reference</TableCell>
                                    <TableCell>By</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtered.flatMap((row) => row.payments.map((payment) => (
                                    <TableRow key={payment.transaction_id} hover>
                                        <TableCell sx={{ width: 90 }}>
                                            {payment.is_correction ? (
                                                <Chip size="small" label="Fixed" color="warning" variant="outlined" />
                                            ) : (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => {
                                                        setCorrectRow({
                                                            id: payment.transaction_id,
                                                            member: row.member_name || row.member_no || "—",
                                                            amount: payment.amount,
                                                            interest: payment.interest_component
                                                        });
                                                        setCorrectInterest(String(payment.interest_component));
                                                        setCorrectReason("");
                                                    }}
                                                >
                                                    Fix
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(payment.posted_at)}</TableCell>
                                        <TableCell>
                                            <Typography variant="caption">{row.member_name || row.member_no || "—"}</Typography>
                                        </TableCell>
                                        <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(payment.interest_component)}</TableCell>
                                        <TableCell align="right">{formatCurrency(payment.principal_component)}</TableCell>
                                        <TableCell align="right">{formatCurrency(payment.principal_balance_after)}</TableCell>
                                        <TableCell>
                                            <Typography variant="caption" sx={{ wordBreak: "break-all" }}>{payment.reference || "—"}</Typography>
                                            {payment.is_top_up_settlement ? (
                                                <Chip size="small" label="Top-up settlement" color="info" variant="outlined" sx={{ ml: 0.5 }} />
                                            ) : null}
                                        </TableCell>
                                        <TableCell><Typography variant="caption">{payment.posted_by || "—"}</Typography></TableCell>
                                    </TableRow>
                                )))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {typed.investment_income.length ? (
                        <>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Investment income</Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Received</TableCell>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Description</TableCell>
                                            <TableCell align="right">Amount</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {typed.investment_income.map((row) => (
                                            <TableRow key={row.id} hover>
                                                <TableCell>{formatDate(row.received_date)}</TableCell>
                                                <TableCell>{row.income_type}</TableCell>
                                                <TableCell>{row.description || "—"}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(row.amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    ) : (
                        <Alert severity="warning" variant="outlined">
                            No investment income is recorded for this period. If the SACCO received a UTT dividend, it has not been entered yet.
                        </Alert>
                    )}
                </Stack>
            );
        }

        if (activeKey === "loans") {
            const typed = data as LoansReportData;
            const filtered = typed.rows.filter((row) => matchesSearch(row.member_no, row.member_name));
            // Tiles must describe the rows on screen: a member search that shows
            // 2 loans alongside the whole portfolio's totals reads as if those
            // two loans carried the entire figure.
            const shownTotals = filtered.length === typed.rows.length
                ? typed.totals
                : filtered.reduce(
                    (sum, row) => ({
                        principal: sum.principal + row.principal,
                        interest: sum.interest + row.interest,
                        paid: sum.paid + row.paid,
                        balance: sum.balance + row.balance,
                        period_interest: sum.period_interest + (row.period_interest || 0)
                    }),
                    { principal: 0, interest: 0, paid: 0, balance: 0, period_interest: 0 }
                );
            const hasPeriod = Boolean(typed.period);
            const periodLabel = typed.period?.start_date && typed.period?.end_date
                ? `Interest ${formatDate(typed.period.start_date)} – ${formatDate(typed.period.end_date)}`
                : "Interest (period)";
            const statusColor = (status: string): "success" | "warning" | "error" | "default" =>
                status === "closed" ? "success" : status === "in_arrears" ? "error" : status === "active" ? "warning" : "default";
            return (
                <Stack spacing={2}>
                    <StatTiles items={[
                        { label: filtered.length === typed.rows.length ? "Loans" : `Loans (of ${typed.rows.length})`, value: String(filtered.length) },
                        { label: "Principal", value: formatCurrency(shownTotals.principal) },
                        ...(hasPeriod
                            ? [{ label: "Interest this period", value: formatCurrency(shownTotals.period_interest ?? 0) }]
                            : []),
                        { label: "Interest charged", value: formatCurrency(shownTotals.interest) },
                        { label: "Paid", value: formatCurrency(shownTotals.paid) },
                        { label: "Outstanding", value: formatCurrency(shownTotals.balance) }
                    ]} />
                    <TableContainer sx={{ maxHeight: 560, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                        <Table size="small" stickyHeader sx={zebraSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={headCellSx}>#</TableCell>
                                    <TableCell sx={headCellSx}>Date</TableCell>
                                    <TableCell sx={headCellSx}>Member</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Loan Amount</TableCell>
                                    {hasPeriod ? <TableCell align="right" sx={headCellSx}>{periodLabel}</TableCell> : null}
                                    <TableCell align="right" sx={headCellSx}>Interest</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Total + Interest</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Paid</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Balance</TableCell>
                                    <TableCell sx={headCellSx}>Guarantors</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Collateral</TableCell>
                                    <TableCell sx={headCellSx}>Status</TableCell>
                                    <TableCell sx={headCellSx} />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginate(filtered).map((row) => {
                                    // One row can open either its schedule or its payment
                                    // trail, so the expansion key carries which of the two.
                                    const paymentsKey = `${row.loan_number}:payments`;
                                    const scheduleKey = `${row.loan_number}:schedule`;
                                    const showingPayments = expandedBatch === paymentsKey;
                                    const showingSchedule = expandedBatch === scheduleKey;
                                    const expanded = showingPayments || showingSchedule;
                                    const batchKey = row.loan_number;
                                    return [
                                        <TableRow key={batchKey}>
                                            <TableCell>{row.index}</TableCell>
                                            <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(row.date_applied)}</TableCell>
                                            <TableCell><MemberCell memberNo={row.member_no} name={row.member_name} /></TableCell>
                                            <TableCell align="right"><Money value={row.principal} bold /></TableCell>
                                            {hasPeriod ? (
                                                <TableCell align="right">
                                                    <Typography component="span" variant="body2" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
                                                        {row.period_interest ? formatCurrency(row.period_interest) : "—"}
                                                    </Typography>
                                                </TableCell>
                                            ) : null}
                                            <TableCell align="right"><Money value={row.interest} /></TableCell>
                                            <TableCell align="right"><Money value={row.total_due} /></TableCell>
                                            <TableCell align="right"><Money value={row.paid} /></TableCell>
                                            <TableCell align="right">
                                                <Typography component="span" variant="body2" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color: row.balance > 0 ? "warning.main" : "success.main" }}>
                                                    {formatCurrency(row.balance)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 180 }}>
                                                <Typography variant="caption">{row.guarantors || "—"}</Typography>
                                            </TableCell>
                                            <TableCell align="right"><Money value={row.collateral} /></TableCell>
                                            <TableCell>
                                                <Chip size="small" label={row.status.replace(/_/g, " ")} color={statusColor(row.status)} variant="outlined" sx={{ fontWeight: 700 }} />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                    <Button
                                                        size="small"
                                                        variant={showingSchedule ? "contained" : "text"}
                                                        onClick={() => setExpandedBatch(showingSchedule ? null : scheduleKey)}
                                                        disabled={!row.schedule?.length}
                                                    >
                                                        {showingSchedule ? "Hide" : `Schedule (${row.schedule?.length || 0})`}
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant={showingPayments ? "contained" : "text"}
                                                        onClick={() => setExpandedBatch(showingPayments ? null : paymentsKey)}
                                                        disabled={!row.repayments?.length}
                                                    >
                                                        {showingPayments ? "Hide" : `Payments (${row.repayments?.length || 0})`}
                                                    </Button>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>,
                                        expanded ? (
                                            <TableRow key={`${batchKey}-detail`}>
                                                <TableCell colSpan={hasPeriod ? 13 : 12} sx={{ py: 0, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                                                    <Box sx={{ maxHeight: 300, overflow: "auto", my: 1.5, mx: 2, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
                                                        {showingSchedule ? (
                                                            <Table size="small" stickyHeader>
                                                                <TableHead>
                                                                    <TableRow>
                                                                        <TableCell sx={headCellSx}>#</TableCell>
                                                                        <TableCell sx={headCellSx}>Due date</TableCell>
                                                                        <TableCell align="right" sx={headCellSx}>Principal</TableCell>
                                                                        <TableCell align="right" sx={headCellSx}>Interest</TableCell>
                                                                        <TableCell align="right" sx={headCellSx}>Installment</TableCell>
                                                                        <TableCell align="right" sx={headCellSx}>Paid</TableCell>
                                                                        <TableCell sx={headCellSx}>Status</TableCell>
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {(row.schedule || []).map((entry) => {
                                                                        const entryPaid = entry.principal_paid + entry.interest_paid;
                                                                        return (
                                                                            <TableRow key={`${batchKey}-inst-${entry.installment}`}>
                                                                                <TableCell>{entry.installment}</TableCell>
                                                                                <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(entry.due_date)}</TableCell>
                                                                                <TableCell align="right"><Money value={entry.principal_due} /></TableCell>
                                                                                <TableCell align="right"><Money value={entry.interest_due} /></TableCell>
                                                                                <TableCell align="right"><Money value={entry.total_due} bold /></TableCell>
                                                                                <TableCell align="right"><Money value={entryPaid} /></TableCell>
                                                                                <TableCell>
                                                                                    <Chip
                                                                                        size="small"
                                                                                        variant="outlined"
                                                                                        label={entry.status.replace(/_/g, " ")}
                                                                                        color={entry.status === "paid" ? "success" : entry.status === "overdue" ? "error" : entry.status === "partial" ? "warning" : "default"}
                                                                                        sx={{ fontWeight: 700 }}
                                                                                    />
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        );
                                                                    })}
                                                                </TableBody>
                                                            </Table>
                                                        ) : (
                                                        <Table size="small">
                                                            <TableBody>
                                                                {(row.repayments || []).map((payment, paymentIndex) => (
                                                                    <TableRow key={`${batchKey}-${paymentIndex}`}>
                                                                        <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(payment.date)}</TableCell>
                                                                        <TableCell align="right"><Money value={payment.amount} /></TableCell>
                                                                        <TableCell align="right">
                                                                            <Typography component="span" variant="body2" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
                                                                                {payment.balance ? formatCurrency(payment.balance) : "—"}
                                                                            </Typography>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ) : null
                                    ];
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {paginationBar(filtered.length)}
                </Stack>
            );
        }

        if (activeKey === "summary-sorted") {
            const typed = data as SummarySortedData;
            const filtered = typed.rows.filter((row) => matchesSearch(row.member_no, row.full_name));
            const stickySx = { position: "sticky" as const, left: 0, zIndex: 1, bgcolor: "background.paper" };
            const monthShort = (month: string) => {
                const [year, mm] = month.split("-");
                return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(mm) - 1]} ${year.slice(2)}`;
            };
            return (
                <Stack spacing={2}>
                    <StatTiles items={[
                        { label: "Members", value: String(filtered.length) },
                        { label: "Needed to date", value: formatCurrency(typed.config.needed), helper: `Kiingilio ${formatCurrency(typed.config.kiingilio)} + shares ${formatCurrency(typed.config.shares_required)} + ${typed.months.length} × ${formatCurrency(typed.config.monthly_required)}` },
                        { label: "Above needed", value: `${typed.totals.above_needed} of ${typed.rows.length}` },
                        { label: "Via UTT", value: String(typed.totals.utt_count) }
                    ]} />
                    <TableContainer sx={{ maxHeight: 560, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                        <Table size="small" stickyHeader sx={zebraSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ ...headCellSx, ...stickySx, zIndex: 3 }}>Member</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Actual</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Kiingilio</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Shares</TableCell>
                                    {typed.months.map((month) => (
                                        <TableCell key={month} align="right" sx={headCellSx}>{monthShort(month)}</TableCell>
                                    ))}
                                    <TableCell align="right" sx={headCellSx}>Needed</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Status</TableCell>
                                    <TableCell sx={headCellSx}>UTT</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginate(filtered).map((row) => (
                                    <TableRow key={`${row.position}-${row.member_no}`}>
                                        <TableCell sx={stickySx}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Chip size="small" label={row.position} color={row.position <= 3 ? "primary" : "default"} variant={row.position <= 3 ? "filled" : "outlined"} sx={{ fontWeight: 700, minWidth: 36 }} />
                                                <MemberCell memberNo={row.member_no} name={row.full_name} />
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="right"><Money value={row.actual} bold /></TableCell>
                                        <TableCell align="right"><Money value={typed.config.kiingilio} /></TableCell>
                                        <TableCell align="right"><Money value={typed.config.shares_required} /></TableCell>
                                        {typed.months.map((month) => (
                                            <TableCell key={month} align="right" sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                                                {new Intl.NumberFormat("en-US").format(typed.config.monthly_required)}
                                            </TableCell>
                                        ))}
                                        <TableCell align="right"><Money value={typed.config.needed} /></TableCell>
                                        <TableCell align="right">
                                            <Typography component="span" variant="body2" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color: row.status_amount >= 0 ? "success.main" : "error.main" }}>
                                                {formatCurrency(row.status_amount)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip size="small" label={row.utt ? "YES" : "NO"} color={row.utt ? "primary" : "default"} variant="outlined" sx={{ fontWeight: 700 }} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {paginationBar(filtered.length)}
                </Stack>
            );
        }

        if (activeKey === "performance-targets") {
            const typed = data as PerformanceTargetsData;
            const filtered = typed.rows.filter((row) => matchesSearch(row.member_no, row.full_name));
            return (
                <Stack spacing={2}>
                    <StatTiles items={[
                        { label: "Members", value: String(filtered.length) },
                        { label: "Total actual", value: formatCurrency(typed.totals.actual) },
                        { label: "Total targets", value: formatCurrency(typed.totals.target) },
                        { label: "On track", value: `${typed.totals.on_track_count} of ${typed.rows.length}`, helper: `≥ ${typed.settings.on_track_percent}% of target` }
                    ]} />
                    <TableContainer sx={{ maxHeight: 560, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                        <Table size="small" stickyHeader sx={zebraSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={headCellSx}>#</TableCell>
                                    <TableCell sx={headCellSx}>Member</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Actual Savings</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Annual Target</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Remaining</TableCell>
                                    <TableCell sx={headCellSx}>Progress</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginate(filtered).map((row) => (
                                    <TableRow key={`${row.position}-${row.member_no}`}>
                                        <TableCell>
                                            <Chip size="small" label={row.position} color={row.position <= 3 ? "primary" : "default"} variant={row.position <= 3 ? "filled" : "outlined"} sx={{ fontWeight: 700, minWidth: 40 }} />
                                        </TableCell>
                                        <TableCell><MemberCell memberNo={row.member_no} name={row.full_name} /></TableCell>
                                        <TableCell align="right"><Money value={row.actual} bold /></TableCell>
                                        <TableCell align="right"><Money value={row.target} /></TableCell>
                                        <TableCell align="right"><Money value={row.remaining} /></TableCell>
                                        <TableCell sx={{ minWidth: 160 }}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Box sx={{ flex: 1, height: 8, borderRadius: 999, bgcolor: "action.hover", overflow: "hidden" }}>
                                                    <Box sx={{ width: `${Math.min(row.percent, 100)}%`, height: "100%", bgcolor: row.on_track ? "success.main" : "warning.main" }} />
                                                </Box>
                                                <Typography variant="caption" sx={{ fontVariantNumeric: "tabular-nums", minWidth: 44, textAlign: "right", fontWeight: 700 }}>
                                                    {row.percent.toFixed(0)}%
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {paginationBar(filtered.length)}
                </Stack>
            );
        }

        if (activeKey === "commitments") {
            const typed = data as CommitmentComplianceData;
            const filtered = typed.rows.filter((row) => matchesSearch(row.member_no, row.full_name));
            return (
                <Stack spacing={2}>
                    <StatTiles items={[
                        { label: "Members", value: String(filtered.length) },
                        { label: "Expected to date", value: formatCurrency(typed.totals.expected) },
                        { label: "Paid", value: formatCurrency(typed.totals.paid) },
                        { label: "Arrears", value: formatCurrency(typed.totals.needed), helper: `${typed.totals.behind_count} member(s) behind` }
                    ]} />
                    {typed.rows.every((row) => row.commitment === 0) ? (
                        <Alert severity="info" variant="outlined">
                            No member has a monthly savings commitment configured yet — set commitments on member profiles for this report to track expected vs paid.
                        </Alert>
                    ) : null}
                    <TableContainer sx={{ maxHeight: 560, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                        <Table size="small" stickyHeader sx={zebraSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={headCellSx}>#</TableCell>
                                    <TableCell sx={headCellSx}>Member</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Actual</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Shares</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Commitment/mo</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Months</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Expected</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Paid</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Needed</TableCell>
                                    <TableCell sx={headCellSx}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginate(filtered).map((row) => (
                                    <TableRow key={`${row.position}-${row.member_no}`}>
                                        <TableCell>{row.position}</TableCell>
                                        <TableCell><MemberCell memberNo={row.member_no} name={row.full_name} /></TableCell>
                                        <TableCell align="right"><Money value={row.actual} bold /></TableCell>
                                        <TableCell align="right"><Money value={row.shares} /></TableCell>
                                        <TableCell align="right"><Money value={row.commitment} /></TableCell>
                                        <TableCell align="right">{row.months_due || "—"}</TableCell>
                                        <TableCell align="right"><Money value={row.expected} /></TableCell>
                                        <TableCell align="right"><Money value={row.paid} /></TableCell>
                                        <TableCell align="right"><Money value={row.needed} /></TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={row.status}
                                                color={row.needed > 0 ? "warning" : "success"}
                                                variant="outlined"
                                                sx={{ fontWeight: 700 }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {paginationBar(filtered.length)}
                </Stack>
            );
        }

        if (activeKey === "operations-statement") {
            const typed = data as OperationsStatementData;
            return (
                <Stack spacing={2}>
                    <StatTiles items={[
                        { label: "Current balance", value: formatCurrency(typed.totals.balance) },
                        { label: "Total incomes", value: formatCurrency(typed.totals.income) },
                        { label: "Total expenditures", value: formatCurrency(typed.totals.expenses) }
                    ]} />
                    <TableContainer sx={{ maxHeight: 560, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}`, maxWidth: 900 }}>
                        <Table size="small" stickyHeader sx={zebraSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={headCellSx}>Month</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Opening Balance</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Incomes</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Expenditures</TableCell>
                                    <TableCell align="right" sx={headCellSx}>Closing Balance</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {typed.rows.map((row) => (
                                    <TableRow key={row.month}>
                                        <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 600 }}>{monthLabel(row.month)}</TableCell>
                                        <TableCell align="right"><Money value={row.opening} /></TableCell>
                                        <TableCell align="right">
                                            {row.income ? (
                                                <Typography
                                                    component="button"
                                                    variant="body2"
                                                    onClick={() => setOpDetail({ title: `${monthLabel(row.month)} — Incomes`, lines: row.income_lines, total: row.income })}
                                                    sx={{ fontVariantNumeric: "tabular-nums", cursor: "pointer", border: 0, background: "none", p: 0, color: "primary.main", textDecoration: "underline", fontWeight: 600 }}
                                                >
                                                    {formatCurrency(row.income)}
                                                </Typography>
                                            ) : <Money value={0} />}
                                        </TableCell>
                                        <TableCell align="right">
                                            {row.expenses ? (
                                                <Typography
                                                    component="button"
                                                    variant="body2"
                                                    onClick={() => setOpDetail({ title: `${monthLabel(row.month)} — Expenditures`, lines: row.expense_lines, total: row.expenses })}
                                                    sx={{ fontVariantNumeric: "tabular-nums", cursor: "pointer", border: 0, background: "none", p: 0, color: "error.main", textDecoration: "underline", fontWeight: 600 }}
                                                >
                                                    ({formatCurrency(row.expenses)})
                                                </Typography>
                                            ) : <Money value={0} />}
                                        </TableCell>
                                        <TableCell align="right"><Money value={row.closing} bold /></TableCell>
                                    </TableRow>
                                ))}
                                <TableRow sx={totalRowSx}>
                                    <TableCell><Typography variant="body2" sx={{ fontWeight: 800 }}>TOTAL</Typography></TableCell>
                                    <TableCell />
                                    <TableCell align="right"><Money value={typed.totals.income} bold /></TableCell>
                                    <TableCell align="right">
                                        <Typography component="span" variant="body2" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "error.main" }}>
                                            ({formatCurrency(typed.totals.expenses)})
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right"><Money value={typed.totals.balance} bold /></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
            );
        }

        if (activeKey === "gawio") {
            const typed = data as GawioSummaryData;
            // The treasurer's GAWIO sheet palette, fixed in both themes.
            const GAWIO = {
                header: "#FBDCC9",
                line: "#B7E1A1",
                loanTotal: "#92D050",
                utt: "#FFFF00",
                total: "#8FAADC"
            };
            const amountText = (value: number) => Math.round(value).toLocaleString("en-US");
            const cellSx = {
                border: "2px solid #000",
                color: "#000",
                fontWeight: 700,
                fontSize: { xs: "0.85rem", sm: "1rem" },
                py: 1,
                fontVariantNumeric: "tabular-nums" as const
            };
            return (
                <Stack spacing={3}>
                    {typed.months.map((entry) => (
                        <TableContainer key={entry.month} sx={{ maxWidth: 900, bgcolor: "#fff", border: "2px solid #000", borderRadius: 0 }}>
                            <Table size="small" sx={{ borderCollapse: "collapse", "& td": cellSx }}>
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: GAWIO.header, fontWeight: 800 }}>DIVIDENDS {fullMonthLabel(entry.month)}</TableCell>
                                        <TableCell align="right" sx={{ bgcolor: GAWIO.header, fontWeight: 800, width: "26%" }}>AMOUNT</TableCell>
                                    </TableRow>
                                    {entry.loan_lines.map((line) => (
                                        <TableRow key={line.sequence}>
                                            <TableCell sx={{ bgcolor: GAWIO.line }}>
                                                DIVIDEND {line.sequence} — {line.member_name} · {formatDate(line.date)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ bgcolor: GAWIO.line }}>{amountText(line.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: GAWIO.loanTotal, fontWeight: 800 }}>TOTAL LOAN DIVIDEND</TableCell>
                                        <TableCell align="right" sx={{ bgcolor: GAWIO.loanTotal, fontWeight: 800 }}>{amountText(entry.loan_total)}</TableCell>
                                    </TableRow>
                                    {entry.utt_lines.map((line, index) => (
                                        <TableRow key={`${line.date}-${index}`}>
                                            <TableCell sx={{ bgcolor: GAWIO.utt }}>
                                                {line.label} · {formatDate(line.date)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ bgcolor: GAWIO.utt }}>{amountText(line.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: GAWIO.total, fontWeight: 800 }}>TOTAL GAWIO FOR {fullMonthLabel(entry.month)}</TableCell>
                                        <TableCell align="right" sx={{ bgcolor: GAWIO.total, fontWeight: 800 }}>{amountText(entry.total)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ))}
                    <Typography variant="caption" color="text.secondary">
                        All-time totals — loan dividends {formatCurrency(typed.totals.loan)}, UTT dividends {formatCurrency(typed.totals.utt)}, gawio {formatCurrency(typed.totals.gawio)}. Months follow the actual payment date, so figures can differ from hand-compiled sheets that cut off mid-month.
                    </Typography>
                </Stack>
            );
        }

        if (activeKey === "funds-position") {
            const typed = data as FundsPositionData;
            // The committee's printed Excel sheet, reproduced exactly — fixed
            // palette and black grid in both themes, blank cells where the
            // sheet leaves blanks.
            const SHEET = {
                violet: "#EAC6EA",
                peach: "#FBDCC9",
                yellow: "#FFFF00",
                green: "#B7E1A1",
                orange: "#E8926F",
                blue: "#7ED0F0"
            };
            const amountText = (value: number) => (value ? Math.round(value).toLocaleString("en-US") : "");
            const missingFigures = typed.figures.bank_balance == null;
            return (
                <Stack spacing={2}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                            {typed.figures.updated_at
                                ? `Bank figures last updated ${formatDate(typed.figures.updated_at)}.`
                                : "Bank figures have not been entered yet."}
                        </Typography>
                        {canManageOperations ? (
                            <Button variant="outlined" size="small" onClick={() => openFiguresDialog(typed.figures)}>
                                Edit bank figures
                            </Button>
                        ) : null}
                    </Stack>
                    {missingFigures && canManageOperations ? (
                        <Alert severity="info" variant="outlined">
                            Enter the NMB bank balance so the total reflects the full position.
                        </Alert>
                    ) : null}
                    <Typography sx={{ fontWeight: 800, letterSpacing: "0.04em", fontSize: "1.1rem" }}>
                        SUMMARY REPORT
                    </Typography>
                    <TableContainer sx={{ maxWidth: 900, bgcolor: "#fff", border: "2px solid #000", borderRadius: 0 }}>
                        <Table
                            size="small"
                            sx={{
                                borderCollapse: "collapse",
                                "& td": {
                                    border: "2px solid #000",
                                    color: "#000",
                                    fontWeight: 700,
                                    fontSize: { xs: "0.85rem", sm: "1rem" },
                                    py: 1.2,
                                    whiteSpace: "nowrap",
                                    fontVariantNumeric: "tabular-nums"
                                }
                            }}
                        >
                            <TableBody>
                                <TableRow>
                                    <TableCell colSpan={2} sx={{ bgcolor: SHEET.violet }}>BANK - NMB</TableCell>
                                    <TableCell align="right" sx={{ bgcolor: SHEET.violet, width: "30%" }}>{amountText(typed.rows.bank_balance)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={2} sx={{ bgcolor: SHEET.peach, fontWeight: 800 }}>TOTAL INVESTED UTT</TableCell>
                                    <TableCell align="right" sx={{ bgcolor: SHEET.peach, fontWeight: 800 }}>{amountText(typed.rows.utt_invested)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={2} sx={{ bgcolor: SHEET.peach, fontWeight: 800, whiteSpace: "normal" }}>TOTAL AMOUNT INVESTED WITH NMB SHARES</TableCell>
                                    <TableCell align="right" sx={{ bgcolor: SHEET.peach, fontWeight: 800 }}>{amountText(typed.rows.shares_invested)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={2} sx={{ bgcolor: SHEET.peach }}>TOTAL LOANS</TableCell>
                                    <TableCell align="right" sx={{ bgcolor: SHEET.peach }}>{amountText(typed.rows.loans_outstanding)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ bgcolor: SHEET.yellow, width: "30%" }}>INTEREST EXPECTED</TableCell>
                                    <TableCell sx={{ bgcolor: SHEET.yellow }}>-LOAN</TableCell>
                                    <TableCell align="right" sx={{ bgcolor: SHEET.yellow }}>{amountText(typed.rows.interest_expected)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={2} sx={{ bgcolor: SHEET.green, py: 1.4 }} />
                                    <TableCell sx={{ bgcolor: SHEET.green }} />
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ bgcolor: SHEET.peach }}>TOTAL UTT DIVIDENTS</TableCell>
                                    <TableCell sx={{ bgcolor: SHEET.peach }} />
                                    <TableCell align="right" sx={{ bgcolor: SHEET.peach }}>{amountText(typed.rows.utt_dividends)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={2} sx={{ bgcolor: SHEET.peach }}>TOTAL LOANS DIVIDENTS</TableCell>
                                    <TableCell align="right" sx={{ bgcolor: SHEET.peach }}>{amountText(typed.rows.loan_interest_collected)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ bgcolor: SHEET.orange }}>OPERATION ACCOUNT</TableCell>
                                    <TableCell sx={{ bgcolor: SHEET.peach }} />
                                    <TableCell align="right" sx={{ bgcolor: SHEET.peach }}>{amountText(typed.rows.operation_account)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={2} sx={{ bgcolor: SHEET.peach }}>BALANCE CHARGES</TableCell>
                                    <TableCell align="right" sx={{ bgcolor: SHEET.peach }}>
                                        {typed.rows.balance_charges ? `(${amountText(typed.rows.balance_charges)})` : ""}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={2} sx={{ bgcolor: "#fff", fontWeight: 800, py: 1.6 }}>TOTAL AMOUNT AVAILABLE</TableCell>
                                    <TableCell align="right" sx={{ bgcolor: SHEET.blue, fontWeight: 800, fontSize: { xs: "0.95rem", sm: "1.1rem" } }}>
                                        {Math.round(typed.total_available).toLocaleString("en-US")}
                                    </TableCell>
                                </TableRow>
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
                        {showDateFilters || ["member-statement", "positions", "performance-targets", "commitments", "summary-sorted", "loans", "loan-income", "operations"].includes(activeKey) ? (
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} flexWrap="wrap" useFlexGap>
                                {activeKey === "operations" && canManageOperations ? (
                                    <>
                                        <Button variant="contained" size="small" onClick={() => setEntryOpen(true)}>
                                            Add entry
                                        </Button>
                                        <Button variant="outlined" size="small" onClick={openTransferDialog}>
                                            Transfer from savings
                                        </Button>
                                    </>
                                ) : null}
                                {["contributions", "monthly", "positions", "performance-targets", "commitments", "summary-sorted", "loans", "loan-income", "operations"].includes(activeKey) ? (
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
                                {activeKey === "summary-sorted" ? (
                                    <TextField
                                        label="Schedule start"
                                        type="month"
                                        size="small"
                                        value={scheduleStart}
                                        onChange={(event) => setScheduleStart(event.target.value)}
                                        helperText="Month the standard plan starts"
                                        slotProps={{ inputLabel: { shrink: true } }}
                                    />
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

            <Dialog open={Boolean(opDetail)} onClose={() => setOpDetail(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>{opDetail?.title}</DialogTitle>
                <DialogContent>
                    <TableContainer sx={{ maxHeight: 420, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell align="right">Amount</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(opDetail?.lines || []).map((line, index) => (
                                    <TableRow key={`${line.label}-${index}`} hover>
                                        <TableCell sx={{ whiteSpace: "nowrap" }}>{line.date ? formatDate(line.date) : "—"}</TableCell>
                                        <TableCell>{line.label}</TableCell>
                                        <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(line.amount)}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell colSpan={2} sx={{ fontWeight: 800 }}>TOTAL</TableCell>
                                    <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 800 }}>{formatCurrency(opDetail?.total || 0)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button color="inherit" onClick={() => setOpDetail(null)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={figuresOpen} onClose={() => !figuresSaving && setFiguresOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Bank figures</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                            The NMB balance comes from the bank statement — the other rows are computed by the system. Leave blank to clear.
                        </Typography>
                        <TextField
                            label="Bank — NMB balance (TZS)"
                            size="small"
                            value={figuresForm.bank}
                            onChange={(event) => setFiguresForm((current) => ({ ...current, bank: event.target.value }))}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button color="inherit" onClick={() => setFiguresOpen(false)} disabled={figuresSaving}>Cancel</Button>
                    <Button variant="contained" onClick={() => void submitFigures()} disabled={figuresSaving}>
                        {figuresSaving ? "Saving…" : "Save figures"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={transferOpen} onClose={() => !transferSubmitting && setTransferOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Transfer from Savings → Operations Fund</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 0.5 }}>
                        {transferError ? <Alert severity="error" variant="outlined">{transferError}</Alert> : null}
                        {transferResult ? (
                            <>
                                <Alert severity="success" variant="outlined">
                                    Wamehamishiwa {transferResult.totals.transferred_count} member{(transferResult.totals.transferred_count || 0) === 1 ? "" : "s"} —
                                    jumla {formatCurrency(transferResult.totals.transferred_total || 0)} imeingia Operations Fund.
                                </Alert>
                                {transferResult.skipped.length ? (
                                    <>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                            Walioruka ({transferResult.skipped.length})
                                        </Typography>
                                        <TableContainer sx={{ maxHeight: 240, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                                            <Table size="small" stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Member</TableCell>
                                                        <TableCell>Sababu</TableCell>
                                                        <TableCell align="right">Akiba iliyopo</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {transferResult.skipped.map((row) => (
                                                        <TableRow key={row.member_id}>
                                                            <TableCell>{row.member_no ? `${row.member_no} — ` : ""}{row.full_name}</TableCell>
                                                            <TableCell>
                                                                {TRANSFER_SKIP_REASONS[row.reason || ""] || row.reason}
                                                                {row.error ? (
                                                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                                                                        {row.error}
                                                                    </Typography>
                                                                ) : null}
                                                            </TableCell>
                                                            <TableCell align="right">{formatCurrency(row.available_balance || 0)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </>
                                ) : null}
                            </>
                        ) : (
                            <>
                                <Typography variant="body2" color="text.secondary">
                                    Inahamisha kiasi ulichoweka kutoka kwenye akiba ya kila member kwenda Operations Fund —
                                    inaonekana kwenye statement ya member kama <b>operations transfer</b>. Hakuna cash inayotoka.
                                </Typography>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                    <TextField
                                        label="Kiasi kwa kila member (TZS)"
                                        size="small"
                                        type="number"
                                        value={transferForm.amount}
                                        onChange={(event) => {
                                            setTransferForm((current) => ({ ...current, amount: event.target.value }));
                                            setTransferPreview(null);
                                        }}
                                        sx={{ flex: 1 }}
                                    />
                                    <TextField
                                        label="Tarehe"
                                        size="small"
                                        type="date"
                                        value={transferForm.entry_date}
                                        onChange={(event) => {
                                            setTransferForm((current) => ({ ...current, entry_date: event.target.value }));
                                            setTransferPreview(null);
                                        }}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ flex: 1 }}
                                    />
                                </Stack>
                                <FormControlLabel
                                    control={(
                                        <Checkbox
                                            checked={transferForm.all_active}
                                            onChange={(event) => {
                                                setTransferForm((current) => ({ ...current, all_active: event.target.checked }));
                                                setTransferPreview(null);
                                            }}
                                        />
                                    )}
                                    label="Members wote walio active"
                                />
                                {!transferForm.all_active ? (
                                    <Autocomplete
                                        multiple
                                        options={members}
                                        value={transferForm.members}
                                        onChange={(_, value) => {
                                            setTransferForm((current) => ({ ...current, members: value }));
                                            setTransferPreview(null);
                                        }}
                                        getOptionLabel={(member) => `${member.member_no ? `${member.member_no} — ` : ""}${member.full_name}`}
                                        isOptionEqualToValue={(left, right) => left.id === right.id}
                                        renderInput={(params) => <TextField {...params} label="Chagua members" size="small" />}
                                    />
                                ) : null}
                                <TextField
                                    label="Notes (optional)"
                                    size="small"
                                    value={transferForm.notes}
                                    onChange={(event) => setTransferForm((current) => ({ ...current, notes: event.target.value }))}
                                />
                                {transferPreview ? (
                                    <>
                                        <Divider />
                                        <Alert severity={transferPreview.totals.eligible_count ? "info" : "warning"} variant="outlined">
                                            Watakaokatwa sasa: <b>{transferPreview.totals.eligible_count}</b> member{transferPreview.totals.eligible_count === 1 ? "" : "s"} ×
                                            {" "}{formatCurrency(transferPreview.totals.amount_per_member)} = <b>{formatCurrency(transferPreview.totals.eligible_total)}</b>
                                        </Alert>
                                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                            <Chip
                                                variant="outlined"
                                                label={`Umewachagua: ${transferPreview.totals.selected_count ?? "—"}`}
                                            />
                                            <Chip
                                                color="success"
                                                variant="outlined"
                                                label={`Tayari wamehamishiwa: ${transferPreview.totals.already_count ?? 0}`}
                                            />
                                            <Chip
                                                color="primary"
                                                variant="outlined"
                                                label={`Bado (watakatwa): ${transferPreview.totals.eligible_count}`}
                                            />
                                            <Chip
                                                color="warning"
                                                variant="outlined"
                                                label={`Watakaoruka: ${transferPreview.totals.skipped_count}`}
                                            />
                                        </Stack>
                                        {transferPreview.totals.already_count ? (
                                            <Alert severity="success" variant="outlined">
                                                <b>{transferPreview.totals.already_count}</b> member{transferPreview.totals.already_count === 1 ? "" : "s"} tayari
                                                walihamishiwa mwezi wa {transferPreview.totals.month} ({formatCurrency(transferPreview.totals.already_total || 0)}).
                                                Wameachwa nje ili wasikatwe mara mbili.
                                            </Alert>
                                        ) : null}
                                        {transferPreview.already_transferred?.length ? (
                                            <TableContainer sx={{ maxHeight: 180, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Tayari amehamishiwa</TableCell>
                                                            <TableCell>Tarehe</TableCell>
                                                            <TableCell align="right">Kiasi</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {transferPreview.already_transferred.map((row) => (
                                                            <TableRow key={row.member_id}>
                                                                <TableCell>{row.member_no ? `${row.member_no} — ` : ""}{row.full_name}</TableCell>
                                                                <TableCell>{row.transferred_on ? formatDate(row.transferred_on) : "—"}</TableCell>
                                                                <TableCell align="right">{formatCurrency(row.transferred_amount || 0)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        ) : null}
                                        {transferPreview.skipped.length ? (
                                            <TableContainer sx={{ maxHeight: 200, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Ataruka</TableCell>
                                                            <TableCell>Sababu</TableCell>
                                                            <TableCell align="right">Akiba iliyopo</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {transferPreview.skipped.map((row) => (
                                                            <TableRow key={row.member_id}>
                                                                <TableCell>{row.member_no ? `${row.member_no} — ` : ""}{row.full_name}</TableCell>
                                                                <TableCell>{TRANSFER_SKIP_REASONS[row.reason || ""] || row.reason}</TableCell>
                                                                <TableCell align="right">{formatCurrency(row.available_balance || 0)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        ) : null}
                                    </>
                                ) : null}
                            </>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button color="inherit" onClick={() => setTransferOpen(false)} disabled={transferSubmitting}>
                        {transferResult ? "Close" : "Cancel"}
                    </Button>
                    {!transferResult ? (
                        transferPreview ? (
                            <Button
                                variant="contained"
                                color="warning"
                                onClick={() => void runTransfer(false)}
                                disabled={transferSubmitting || !transferPreview.totals.eligible_count}
                            >
                                {transferSubmitting ? "Inahamisha…" : `Hamisha ${formatCurrency(transferPreview.totals.eligible_total)}`}
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={() => void runTransfer(true)}
                                disabled={
                                    transferSubmitting
                                    || !Number(transferForm.amount)
                                    || Number(transferForm.amount) <= 0
                                    || (!transferForm.all_active && !transferForm.members.length)
                                }
                            >
                                {transferSubmitting ? "Inakagua…" : "Preview"}
                            </Button>
                        )
                    ) : null}
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(assignRow)} onClose={() => !assignSubmitting && setAssignRow(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Assign Fee to Member</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 0.5 }}>
                        {assignError ? <Alert severity="error" variant="outlined">{assignError}</Alert> : null}
                        <Typography variant="body2" color="text.secondary">{assignRow?.label}</Typography>
                        <Autocomplete
                            options={members}
                            value={assignMember}
                            onChange={(_, value) => setAssignMember(value)}
                            getOptionLabel={(member) => `${member.member_no ? `${member.member_no} — ` : ""}${member.full_name}`}
                            isOptionEqualToValue={(left, right) => left.id === right.id}
                            renderInput={(params) => <TextField {...params} label="Member" size="small" />}
                        />
                        <Typography variant="caption" color="text.secondary">
                            The fee moves into that member&apos;s column in the grid. The ledger is not re-posted — no double count.
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button color="inherit" onClick={() => setAssignRow(null)} disabled={assignSubmitting}>Cancel</Button>
                    <Button variant="contained" onClick={() => void submitAssign()} disabled={assignSubmitting || !assignMember}>
                        {assignSubmitting ? "Assigning…" : "Assign"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={entryOpen} onClose={() => !entrySubmitting && setEntryOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Add Operations Entry</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 0.5 }}>
                        {entryError ? <Alert severity="error" variant="outlined">{entryError}</Alert> : null}
                        <TextField
                            select
                            label="Entry type"
                            size="small"
                            value={entryForm.entry_type}
                            onChange={(event) => {
                                const entryType = event.target.value as typeof entryForm.entry_type;
                                setEntryForm((current) => ({
                                    ...current,
                                    entry_type: entryType,
                                    amount: entryType === "member_fee" ? "15000" : current.amount === "15000" ? "" : current.amount
                                }));
                            }}
                        >
                            <MenuItem value="member_fee">Member operations fee</MenuItem>
                            <MenuItem value="income">Other income (interest, contributions)</MenuItem>
                            <MenuItem value="expense">Expense (charges, costs)</MenuItem>
                        </TextField>
                        {entryForm.entry_type === "member_fee" ? (
                            <Autocomplete
                                options={members}
                                value={entryForm.member}
                                onChange={(_, value) => setEntryForm((current) => ({ ...current, member: value }))}
                                getOptionLabel={(member) => `${member.member_no ? `${member.member_no} — ` : ""}${member.full_name}`}
                                isOptionEqualToValue={(left, right) => left.id === right.id}
                                renderInput={(params) => <TextField {...params} label="Member" size="small" />}
                            />
                        ) : (
                            <TextField
                                label="Description"
                                size="small"
                                placeholder="e.g. Bank charges June"
                                value={entryForm.label}
                                onChange={(event) => setEntryForm((current) => ({ ...current, label: event.target.value }))}
                            />
                        )}
                        <TextField
                            label="Amount (TZS)"
                            size="small"
                            type="number"
                            value={entryForm.amount}
                            onChange={(event) => setEntryForm((current) => ({ ...current, amount: event.target.value }))}
                        />
                        <TextField
                            label="Date"
                            size="small"
                            type="date"
                            value={entryForm.entry_date}
                            onChange={(event) => setEntryForm((current) => ({ ...current, entry_date: event.target.value }))}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            Fees and income post Dr Cash / Cr Operations Income; expenses post Dr Operations Expense / Cr Cash — Cash at Bank updates immediately.
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button color="inherit" onClick={() => setEntryOpen(false)} disabled={entrySubmitting}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => void submitEntry()}
                        disabled={
                            entrySubmitting
                            || !Number(entryForm.amount)
                            || !entryForm.entry_date
                            || (entryForm.entry_type === "member_fee" ? !entryForm.member : !entryForm.label.trim())
                        }
                    >
                        {entrySubmitting ? "Posting…" : "Post entry"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(correctRow)} onClose={() => !correctSaving && setCorrectRow(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Correct Interest Split</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ mt: 0.5 }}>
                        <Alert severity="info" variant="outlined">
                            The cash received does not change — only how it was divided between interest and
                            principal. The original posting stays on the statement and this is recorded beside it
                            as a correction.
                        </Alert>
                        {correctRow ? (
                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                <Stack spacing={0.5}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{correctRow.member}</Typography>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="caption" color="text.secondary">Cash paid</Typography>
                                        <Typography variant="caption">{formatCurrency(correctRow.amount)}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="caption" color="text.secondary">Recorded as interest</Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{formatCurrency(correctRow.interest)}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="caption" color="text.secondary">Would go to principal</Typography>
                                        <Typography variant="caption">
                                            {formatCurrency(Math.max(correctRow.amount - (Number(correctInterest) || 0), 0))}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Paper>
                        ) : null}
                        <TextField
                            label="Corrected interest"
                            value={correctInterest}
                            onChange={(event) => setCorrectInterest(event.target.value.replace(/[^\d.]/g, ""))}
                            inputProps={{ inputMode: "decimal" }}
                            helperText="What the register says this payment's interest should have been."
                            fullWidth
                        />
                        <TextField
                            label="Reason"
                            value={correctReason}
                            onChange={(event) => setCorrectReason(event.target.value)}
                            placeholder="e.g. posted under the old accrual rule; register says 450,000"
                            multiline
                            rows={2}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCorrectRow(null)} disabled={correctSaving}>Cancel</Button>
                    <Button variant="contained" onClick={() => void submitCorrection()} disabled={correctSaving}>
                        {correctSaving ? "Correcting..." : "Post correction"}
                    </Button>
                </DialogActions>
            </Dialog>

        </Stack>
    );
}
