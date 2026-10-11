import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import {
    Alert,
    Box,
    Button,
    CardContent,
    Grid,
    Menu,
    MenuItem,
    Pagination,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";

import { MotionCard } from "../ui/motion";
import { AppLoader } from "./AppLoader";
import { DataTable, type Column } from "./DataTable";
import { FlatDateRangePicker } from "./FlatDateRangePicker";
import { api, getApiErrorMessage } from "../lib/api";
import { endpoints, type LoanTransactionsWithContextPage } from "../lib/endpoints";
import type { LoanTransactionWithContext } from "../types/api";
import { downloadFile } from "../utils/downloadFile";
import { formatCurrency, formatDate } from "../utils/format";

const PAGE_SIZE = 20;
const FETCH_LIMIT = 100;
const MAX_PAGES = 20;

// An accrual books interest the SACCO has earned but not received, so it never
// belongs in a cash total. CORR- adjustments restate the principal/interest
// split and already carry amount 0, so they fall out of the cash sums on their
// own. A reversal pair (…_reversed in + …_reversal out) nets itself to zero.
const NON_CASH_TYPES = ["interest_accrual"];

// A disbursement's principal_component is the principal LENT, not principal
// recovered, so it is the one type kept out of the collection split (it still
// counts as cash out). Every other type contributes its components signed: a
// reversal carries them negative, so it cancels the row it reverses. The
// invariant this preserves is principal + interest === collected.
const LENDING_TYPES = ["loan_disbursement"];

// A reversal and the row it cancels are a matched pair, so neither leg is cash.
// Counting them inflates BOTH gross figures by the same amount — the reversed
// receipt lands in Collected and its counter-entry in Disbursed — while the
// signed split correctly cancels to zero. Net Cash is the same either way.
const REVERSED_CASH_TYPES = ["loan_repayment_reversed", "loan_repayment_reversal"];

function currentMonthRange() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const last = new Date(year, month + 1, 0);
    return {
        start: `${year}-${String(month + 1).padStart(2, "0")}-01`,
        end: `${year}-${String(month + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`
    };
}

// value_date is the day the money moved; created_at is only when it was keyed.
function effectiveDate(row: LoanTransactionWithContext) {
    return String(row.value_date || row.created_at || "").slice(0, 10);
}

// Date-ranged report over the loan ledger (loan_account_transactions). This is a
// separate ledger from the member statements the Cash Transactions Report reads,
// so disbursements and repayments appear here and nowhere else.
export function LoanTransactionsReport({ tenantId }: { tenantId: string | null }) {
    const theme = useTheme();
    const [range, setRange] = useState(currentMonthRange);
    const [rows, setRows] = useState<LoanTransactionWithContext[]>([]);
    const [loading, setLoading] = useState(false);
    const [typeFilter, setTypeFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [truncated, setTruncated] = useState(false);
    const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

    useEffect(() => {
        if (!tenantId) {
            return;
        }
        let active = true;
        setLoading(true);
        setError(null);
        // The endpoint caps limit at 100 — page through until a short page,
        // bounded at MAX_PAGES so one wide period can't spin forever.
        (async () => {
            const collected: LoanTransactionWithContext[] = [];
            let reportedTotal = 0;
            for (let pageNumber = 1; pageNumber <= MAX_PAGES; pageNumber += 1) {
                const { data } = await api.get<LoanTransactionsWithContextPage>(
                    endpoints.finance.loanTransactions(),
                    {
                        params: {
                            tenant_id: tenantId,
                            include_context: true,
                            page: pageNumber,
                            limit: FETCH_LIMIT,
                            ...(range.start ? { from_date: range.start } : {}),
                            ...(range.end ? { to_date: range.end } : {})
                        }
                    }
                );
                const batch = data.data || [];
                reportedTotal = data.pagination?.total ?? reportedTotal;
                collected.push(...batch);
                if (batch.length < FETCH_LIMIT) {
                    break;
                }
            }
            return { collected, reportedTotal };
        })()
            .then(({ collected, reportedTotal }) => {
                if (active) {
                    setRows(collected);
                    setTruncated(reportedTotal > collected.length);
                    setPage(1);
                }
            })
            .catch((loadError) => {
                if (active) {
                    setRows([]);
                    setTruncated(false);
                    setError(getApiErrorMessage(loadError));
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });
        return () => {
            active = false;
        };
    }, [tenantId, range.start, range.end]);

    const types = useMemo(() => [...new Set(rows.map((row) => row.transaction_type))].sort(), [rows]);
    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return rows.filter((row) => {
            if (typeFilter !== "all" && row.transaction_type !== typeFilter) {
                return false;
            }
            if (!needle) {
                return true;
            }
            return (
                (row.member_name || "").toLowerCase().includes(needle)
                || (row.member_no || "").toLowerCase().includes(needle)
                || (row.loan_number || "").toLowerCase().includes(needle)
                || (row.reference || "").toLowerCase().includes(needle)
            );
        });
    }, [rows, typeFilter, search]);

    const totals = useMemo(() => {
        let disbursed = 0;
        let collected = 0;
        let principal = 0;
        let interest = 0;
        for (const row of filtered) {
            if (NON_CASH_TYPES.includes(row.transaction_type)) {
                continue;
            }
            const amount = Number(row.amount || 0);
            if (!REVERSED_CASH_TYPES.includes(row.transaction_type)) {
                if (row.direction === "out") {
                    disbursed += amount;
                } else {
                    collected += amount;
                }
            }
            if (LENDING_TYPES.includes(row.transaction_type)) {
                continue;
            }
            principal += Number(row.principal_component || 0);
            interest += Number(row.interest_component || 0);
        }
        return {
            disbursed,
            collected,
            principal,
            interest,
            net: collected - disbursed,
            count: filtered.length
        };
    }, [filtered]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

    const signedAmount = (row: LoanTransactionWithContext) => (
        <Typography
            component="span"
            variant="body2"
            sx={{
                fontVariantNumeric: "tabular-nums",
                fontWeight: 700,
                color: row.direction === "out" ? "error.main" : "success.main"
            }}
        >
            {row.direction === "out" ? "−" : "+"}{formatCurrency(row.amount)}
        </Typography>
    );

    const columns: Column<LoanTransactionWithContext>[] = [
        { key: "date", header: "Date", render: (row) => formatDate(effectiveDate(row)) },
        {
            key: "member",
            header: "Member",
            render: (row) => (
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={row.member_name || undefined}>
                        {row.member_name || "—"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
                        {row.member_no || "—"}
                    </Typography>
                </Box>
            )
        },
        {
            key: "loan",
            header: "Loan",
            render: (row) => (
                <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }} noWrap>
                    {row.loan_number || "—"}
                </Typography>
            )
        },
        { key: "type", header: "Type", render: (row) => row.transaction_type.replace(/_/g, " ") },
        { key: "amount", header: "Amount", render: signedAmount },
        {
            key: "principal",
            header: "Principal",
            render: (row) => (
                <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatCurrency(row.principal_component)}
                </Typography>
            )
        },
        {
            key: "interest",
            header: "Interest",
            render: (row) => (
                <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatCurrency(row.interest_component)}
                </Typography>
            )
        },
        {
            key: "balance",
            header: "Principal Balance",
            render: (row) => (
                <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatCurrency(row.running_principal_balance)}
                </Typography>
            )
        },
        {
            key: "reference",
            header: "Reference",
            render: (row) => (
                <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap title={row.reference || undefined}>
                    {row.reference || "N/A"}
                </Typography>
            )
        }
    ];

    const exportReport = async (format: "csv" | "excel" | "pdf") => {
        setExportAnchor(null);
        const title = `Loan Transactions ${range.start || ""} – ${range.end || ""}`;
        const headers = [
            "Date", "Member", "Member No", "Loan", "Type", "Direction",
            "Amount", "Principal", "Interest", "Principal Balance", "Reference"
        ];
        const body = filtered.map((row) => [
            effectiveDate(row),
            row.member_name || "",
            row.member_no || "",
            row.loan_number || "",
            row.transaction_type,
            row.direction,
            row.direction === "out" ? -Number(row.amount) : Number(row.amount),
            Number(row.principal_component || 0),
            Number(row.interest_component || 0),
            Number(row.running_principal_balance || 0),
            row.reference || ""
        ] as (string | number)[]);
        body.push([
            "", "TOTAL", "", "", "", "",
            totals.net, totals.principal, totals.interest, "",
            `${totals.count} transactions`
        ]);

        if (format === "csv") {
            const escape = (value: string | number) => {
                const text = String(value ?? "");
                return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
            };
            const csv = [headers.map(escape).join(","), ...body.map((row) => row.map(escape).join(","))].join("\n");
            downloadFile(new Blob([csv], { type: "text/csv;charset=utf-8" }), "loan-transactions.csv");
            return;
        }
        if (format === "excel") {
            const XLSX = await import("xlsx");
            const sheet = XLSX.utils.aoa_to_sheet([[title], [], headers, ...body]);
            sheet["!cols"] = headers.map((header) => ({ wch: Math.max(header.length + 2, 16) }));
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, sheet, "Loan Transactions");
            XLSX.writeFile(workbook, "loan-transactions.xlsx");
            return;
        }
        const { jsPDF } = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");
        const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(title, 40, 42);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120);
        doc.text(
            `Disbursed ${formatCurrency(totals.disbursed)} · Collected ${formatCurrency(totals.collected)} · `
            + `Principal ${formatCurrency(totals.principal)} · Interest ${formatCurrency(totals.interest)} — amounts in TZS`,
            40,
            58
        );
        autoTable(doc, {
            startY: 72,
            head: [headers],
            body: body.map((row) => row.map((cell) => (typeof cell === "number" ? cell.toLocaleString("en-US") : cell))),
            styles: { fontSize: 7.5, cellPadding: 3 },
            headStyles: { fillColor: [26, 35, 126], fontStyle: "bold" },
            alternateRowStyles: { fillColor: [245, 247, 252] }
        });
        doc.save("loan-transactions.pdf");
    };

    return (
        <MotionCard variant="outlined" sx={{ borderRadius: 2, boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)" }}>
            <CardContent>
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                    spacing={1.5}
                    sx={{ mb: 2 }}
                >
                    <Box>
                        <Typography variant="h6">Loan Transactions Report</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Every disbursement and repayment posted to the loan ledger for the selected period.
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <FlatDateRangePicker
                            label="Period"
                            start={range.start}
                            end={range.end}
                            onChange={(start, end) => setRange({ start, end })}
                            minWidth={230}
                        />
                        <TextField
                            select
                            size="small"
                            label="Type"
                            value={typeFilter}
                            onChange={(event) => {
                                setTypeFilter(event.target.value);
                                setPage(1);
                            }}
                            sx={{ minWidth: 170 }}
                        >
                            <MenuItem value="all">All types</MenuItem>
                            {types.map((type) => (
                                <MenuItem key={type} value={type}>{type.replace(/_/g, " ")}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            size="small"
                            label="Search"
                            placeholder="Member, loan number, reference"
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            sx={{ minWidth: 220 }}
                        />
                        <Button
                            variant="outlined"
                            startIcon={<DownloadRoundedIcon />}
                            onClick={(event) => setExportAnchor(event.currentTarget)}
                            disabled={loading || !filtered.length}
                        >
                            Export
                        </Button>
                        <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}>
                            <MenuItem onClick={() => void exportReport("excel")}>Excel (.xlsx)</MenuItem>
                            <MenuItem onClick={() => void exportReport("pdf")}>PDF</MenuItem>
                            <MenuItem onClick={() => void exportReport("csv")}>CSV</MenuItem>
                        </Menu>
                    </Stack>
                </Stack>

                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                    {[
                        { label: "Disbursed", value: formatCurrency(totals.disbursed), color: "error.main" },
                        { label: "Collected", value: formatCurrency(totals.collected), color: "success.main" },
                        { label: "Net Cash", value: formatCurrency(totals.net), color: totals.net >= 0 ? "success.main" : "error.main" },
                        { label: "Principal Recovered", value: formatCurrency(totals.principal), color: "text.primary" },
                        { label: "Interest Earned", value: formatCurrency(totals.interest), color: "text.primary" },
                        { label: "Transactions", value: String(totals.count), color: "text.primary" }
                    ].map((tile) => (
                        <Grid key={tile.label} size={{ xs: 6, md: 4 }}>
                            <Box sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.66rem" }}>
                                    {tile.label}
                                </Typography>
                                <Typography sx={{ fontWeight: 800, fontVariantNumeric: "tabular-nums", color: tile.color }}>
                                    {tile.value}
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                {error ? <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>{error}</Alert> : null}
                {truncated ? (
                    <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
                        Showing the first {MAX_PAGES * FETCH_LIMIT} transactions for this period. Narrow the date range to see the rest.
                    </Alert>
                ) : null}
                {loading ? (
                    <AppLoader fullscreen={false} minHeight={260} message="Loading loan movements..." />
                ) : (
                    <Stack spacing={2}>
                        <DataTable rows={paginated} columns={columns} emptyMessage="No loan transactions in this period." />
                        {filtered.length > PAGE_SIZE ? (
                            <Stack direction="row" justifyContent="flex-end">
                                <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} color="primary" />
                            </Stack>
                        ) : null}
                    </Stack>
                )}
            </CardContent>
        </MotionCard>
    );
}
