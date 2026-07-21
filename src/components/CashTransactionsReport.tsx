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
import { endpoints, type StatementsResponse } from "../lib/endpoints";
import type { StatementRow } from "../types/api";
import { downloadFile } from "../utils/downloadFile";
import { formatCurrency, formatDate } from "../utils/format";

const PAGE_SIZE = 20;

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

// Date-ranged report over all posted teller activity (member statements feed).
// Used on the Cash Desk page and as the standalone teller Transactions Report.
export function CashTransactionsReport({ tenantId }: { tenantId: string | null }) {
    const theme = useTheme();
    const [range, setRange] = useState(currentMonthRange);
    const [rows, setRows] = useState<StatementRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [typeFilter, setTypeFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

    useEffect(() => {
        if (!tenantId) {
            return;
        }
        let active = true;
        setLoading(true);
        setError(null);
        // The statements endpoint caps limit at 100 — page through until a
        // short page (bounded at 20 pages / 2000 rows for one period).
        (async () => {
            const collected: StatementRow[] = [];
            for (let pageNumber = 1; pageNumber <= 20; pageNumber += 1) {
                const { data } = await api.get<StatementsResponse>(endpoints.finance.statements(), {
                    params: {
                        tenant_id: tenantId,
                        page: pageNumber,
                        limit: 100,
                        ...(range.start ? { from_date: range.start } : {}),
                        ...(range.end ? { to_date: range.end } : {})
                    }
                });
                const batch = data.data || [];
                collected.push(...batch);
                if (batch.length < 100) {
                    break;
                }
            }
            return collected;
        })()
            .then((collected) => {
                if (active) {
                    setRows(collected);
                    setPage(1);
                }
            })
            .catch((loadError) => {
                if (active) {
                    setRows([]);
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
                || (row.reference || "").toLowerCase().includes(needle)
                || (row.description || "").toLowerCase().includes(needle)
            );
        });
    }, [rows, typeFilter, search]);
    const totals = useMemo(() => {
        let moneyIn = 0;
        let moneyOut = 0;
        for (const row of filtered) {
            if (row.direction === "out") {
                moneyOut += Number(row.amount || 0);
            } else {
                moneyIn += Number(row.amount || 0);
            }
        }
        return { moneyIn, moneyOut, net: moneyIn - moneyOut, count: filtered.length };
    }, [filtered]);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

    const columns: Column<StatementRow>[] = [
        { key: "date", header: "Date", render: (row) => formatDate(row.transaction_date) },
        { key: "member", header: "Member", render: (row) => row.member_name },
        { key: "type", header: "Type", render: (row) => row.transaction_type.replace(/_/g, " ") },
        {
            key: "description",
            header: "Description",
            render: (row) => (
                <Typography variant="body2" sx={{ maxWidth: 260 }} noWrap title={row.description || undefined}>
                    {row.description || "—"}
                </Typography>
            )
        },
        {
            key: "amount",
            header: "Amount",
            render: (row) => (
                <Typography
                    component="span"
                    variant="body2"
                    sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color: row.direction === "out" ? "error.main" : "success.main" }}
                >
                    {row.direction === "out" ? "−" : "+"}{formatCurrency(row.amount)}
                </Typography>
            )
        },
        { key: "balance", header: "Balance", render: (row) => formatCurrency(row.running_balance) },
        { key: "reference", header: "Reference", render: (row) => row.reference || "N/A" }
    ];

    const exportReport = async (format: "csv" | "excel" | "pdf") => {
        setExportAnchor(null);
        const title = `Cash Transactions ${range.start || ""} – ${range.end || ""}`;
        const headers = ["Date", "Member", "Type", "Description", "Direction", "Amount", "Balance", "Reference"];
        const body = filtered.map((row) => [
            (row.transaction_date || "").slice(0, 10),
            row.member_name,
            row.transaction_type,
            row.description || "",
            row.direction,
            row.direction === "out" ? -Number(row.amount) : Number(row.amount),
            Number(row.running_balance),
            row.reference || ""
        ] as (string | number)[]);
        body.push(["", "TOTAL", "", "", "", totals.net, "", `${totals.count} transactions`]);

        if (format === "csv") {
            const escape = (value: string | number) => {
                const text = String(value ?? "");
                return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
            };
            const csv = [headers.map(escape).join(","), ...body.map((row) => row.map(escape).join(","))].join("\n");
            downloadFile(new Blob([csv], { type: "text/csv;charset=utf-8" }), "cash-transactions.csv");
            return;
        }
        if (format === "excel") {
            const XLSX = await import("xlsx");
            const sheet = XLSX.utils.aoa_to_sheet([[title], [], headers, ...body]);
            sheet["!cols"] = headers.map((header) => ({ wch: Math.max(header.length + 2, 16) }));
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, sheet, "Cash Transactions");
            XLSX.writeFile(workbook, "cash-transactions.xlsx");
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
            `In ${formatCurrency(totals.moneyIn)} · Out ${formatCurrency(totals.moneyOut)} · Net ${formatCurrency(totals.net)} — amounts in TZS`,
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
        doc.save("cash-transactions.pdf");
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
                        <Typography variant="h6">Cash Transactions Report</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            All posted teller activity for the selected period.
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
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="all">All types</MenuItem>
                            {types.map((type) => (
                                <MenuItem key={type} value={type}>{type.replace(/_/g, " ")}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            size="small"
                            label="Search"
                            placeholder="Member, description, reference"
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            sx={{ minWidth: 200 }}
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
                        { label: "Money In", value: formatCurrency(totals.moneyIn), color: "success.main" },
                        { label: "Money Out", value: formatCurrency(totals.moneyOut), color: "error.main" },
                        { label: "Net", value: formatCurrency(totals.net), color: totals.net >= 0 ? "success.main" : "error.main" },
                        { label: "Transactions", value: String(totals.count), color: "text.primary" }
                    ].map((tile) => (
                        <Grid key={tile.label} size={{ xs: 6, md: 3 }}>
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
                {loading ? (
                    <AppLoader fullscreen={false} minHeight={260} message="Loading cash movements..." />
                ) : (
                    <Stack spacing={2}>
                        <DataTable rows={paginated} columns={columns} emptyMessage="No cash transactions in this period." />
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
