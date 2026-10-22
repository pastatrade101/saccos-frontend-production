import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    LinearProgress,
    Menu,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";

import { AppLoader } from "../AppLoader";
import { FlatDateRangePicker } from "../FlatDateRangePicker";
import { api, getApiErrorMessage } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";
import { MotionCard } from "../../ui/motion";
import { toCsv } from "../../utils/csv";
import { downloadFile } from "../../utils/downloadFile";
import { formatCurrency, formatDate } from "../../utils/format";

interface UcgReferenceRow {
    referenceNumber: string;
    memberName: string | null;
    memberNo?: string | null;
    memberPhone?: string | null;
    purpose: string;
    status: string;
    amount: number | null;
    currency: string | null;
    totalPaid: number | null;
    paymentCount: number | null;
    /** What we have actually posted to the ledger for this reference. */
    postedAmount?: number | null;
    postedCount?: number | null;
    createdAt: string;
    lastSyncedAt: string | null;
}

interface UcgReferencesResponse {
    data?: UcgReferenceRow[];
    meta?: { gatewayAvailable?: boolean; gatewayError?: string | null };
}

const PURPOSE_LABELS: Record<string, string> = {
    savings_deposit: "Akiba",
    share_contribution: "Hisa",
    membership_fee: "Ada ya uanachama",
    loan_repayment: "Marejesho ya mkopo",
    operation_cost: "Gharama za uendeshaji"
};

const purposeLabel = (purpose: string) => PURPOSE_LABELS[purpose] || purpose;

// References accumulate daily, so the screen opens on the last week rather than
// every reference ever minted. Widen the period to chase something older.
function recentRange() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    const day = (value: Date) => value.toISOString().slice(0, 10);
    return { start: day(start), end: day(end) };
}

// The server sends a stable code, not its internal error text.
const GATEWAY_ERRORS: Record<string, string> = {
    UCG_DISABLED: "gateway imezimwa kwenye server (UCG_ENABLED)",
    UCG_CONFIG_MISSING: "mipangilio ya gateway haijakamilika kwenye server",
    UCG_UNAVAILABLE: "gateway haifikiki"
};

// The gateway taking a payment and the SACCO posting it are two separate events.
// A missing webhook (or a sync that quietly failed) leaves money sitting at the
// bank with nothing in our ledger, so the shortfall is what this table leads on.
function shortfallOf(row: UcgReferenceRow) {
    // No gateway figure means no comparison. Treating a missing totalPaid as 0
    // would quietly report every reference as reconciled.
    if (row.totalPaid == null) {
        return 0;
    }
    return Math.max(row.totalPaid - (row.postedAmount ?? 0), 0);
}

// Every UCG reference the SACCO has minted: what the gateway reports as paid,
// what we posted, and a button to pull in anything the gateway never told us
// about. The unreconciled rows are also exportable, because chasing them is a
// conversation with the bank and the bank needs the member's own identifiers.
export function UcgReferencesTable() {
    const [rows, setRows] = useState<UcgReferenceRow[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [gatewayError, setGatewayError] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [note, setNote] = useState<{ severity: "success" | "error"; text: string } | null>(null);
    const [listOpen, setListOpen] = useState(false);
    const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);
    const [range, setRange] = useState(recentRange);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        const { data } = await api.get<UcgReferencesResponse>(endpoints.memberPayments.ucgReferences(), {
            params: { from_date: range.start || undefined, to_date: range.end || undefined }
        });
        setGatewayError(data?.meta?.gatewayAvailable === false ? data?.meta?.gatewayError || "hawajibu" : null);
        return data?.data || [];
    }, [range.start, range.end]);

    useEffect(() => {
        let active = true;
        // Changing the period refetches, and the first render is not the only
        // time that takes a moment -- without this the table sat there looking
        // finished while a request was still in flight.
        setRefreshing(true);
        void load()
            .then((loaded) => {
                if (active) {
                    setRows(loaded);
                    setLoadError(null);
                }
            })
            .catch((error) => {
                if (active) {
                    setRows([]);
                    setLoadError(getApiErrorMessage(error));
                }
            })
            .finally(() => {
                if (active) {
                    setRefreshing(false);
                }
            });
        return () => {
            active = false;
        };
    }, [load]);

    // Support action: re-read the reference from the gateway and post whatever
    // has settled. Idempotent on the gateway's transaction id, so pressing it
    // twice cannot double-post.
    const pullIn = async (referenceNumber: string) => {
        setBusy(referenceNumber);
        setNote(null);
        try {
            await api.post(endpoints.memberPayments.ucgReferenceRefresh(referenceNumber), null);
            setRows(await load());
            setNote({ severity: "success", text: `${referenceNumber}: imehakikiwa na gateway.` });
        } catch (error) {
            setNote({ severity: "error", text: `${referenceNumber}: ${getApiErrorMessage(error)}` });
        } finally {
            setBusy(null);
        }
    };

    // Rendering nothing while the request is in flight meant a slow gateway
    // showed a blank page for 30 seconds and then an error. Say what is
    // happening instead.
    if (rows === null) {
        return (
            <MotionCard>
                <CardContent>
                    <AppLoader fullscreen={false} minHeight={200} message="Inapakia references..." />
                </CardContent>
            </MotionCard>
        );
    }

    const unreconciled = rows
        .filter((row) => shortfallOf(row) > 0)
        .sort((left, right) => shortfallOf(right) - shortfallOf(left));
    const shortfallTotal = unreconciled.reduce((sum, row) => sum + shortfallOf(row), 0);

    const EXPORT_HEADERS = [
        "Reference", "Mwanachama", "Namba ya mwanachama", "Simu", "Aina",
        "Kimelipwa benki (TSh)", "Kimeingia mfumo (TSh)", "Pungufu (TSh)",
        "Malipo benki", "Reference iliundwa", "Sync ya mwisho"
    ];
    const exportBody = unreconciled.map((row) => [
        row.referenceNumber,
        row.memberName || "",
        row.memberNo || "",
        row.memberPhone || "",
        purposeLabel(row.purpose),
        Number(row.totalPaid ?? 0),
        Number(row.postedAmount ?? 0),
        shortfallOf(row),
        Number(row.paymentCount ?? 0),
        String(row.createdAt || "").slice(0, 10),
        String(row.lastSyncedAt || "").slice(0, 10)
    ] as (string | number)[]);

    const exportList = async (format: "csv" | "excel" | "pdf") => {
        setExportAnchor(null);
        const stamp = new Date().toISOString().slice(0, 10);
        const title = `Malipo yaliyokwama benki — ${stamp}`;
        const body = [...exportBody, ["", "JUMLA", "", "", "", "", "", shortfallTotal, "", "", ""]];

        if (format === "csv") {
            downloadFile(
                new Blob([toCsv(EXPORT_HEADERS, body)], { type: "text/csv;charset=utf-8" }),
                `malipo-yaliyokwama-${stamp}.csv`
            );
            return;
        }
        if (format === "excel") {
            const XLSX = await import("xlsx");
            const sheet = XLSX.utils.aoa_to_sheet([[title], [], EXPORT_HEADERS, ...body]);
            sheet["!cols"] = EXPORT_HEADERS.map((header) => ({ wch: Math.max(header.length + 2, 16) }));
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, sheet, "Yaliyokwama");
            XLSX.writeFile(workbook, `malipo-yaliyokwama-${stamp}.xlsx`);
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
            `References ${unreconciled.length} · jumla ${formatCurrency(shortfallTotal)} — zimelipwa benki, hazijafika kwenye mfumo wa SACCOS.`,
            40,
            58
        );
        autoTable(doc, {
            startY: 72,
            head: [EXPORT_HEADERS],
            body: body.map((row) => row.map((cell) => (typeof cell === "number" ? cell.toLocaleString("en-US") : cell))),
            styles: { fontSize: 7.5, cellPadding: 3 },
            headStyles: { fillColor: [183, 28, 28], fontStyle: "bold" },
            alternateRowStyles: { fillColor: [252, 245, 245] }
        });
        doc.save(`malipo-yaliyokwama-${stamp}.pdf`);
    };

    return (
        <MotionCard>
            <CardContent>
                <Stack spacing={1.5}>
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", md: "center" }}
                        spacing={1}
                    >
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                References za UCG
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Kile benki imekusanya, kikilinganishwa na kile kilichoingia kwenye mfumo.
                            </Typography>
                        </Box>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                        <FlatDateRangePicker
                            label="Period"
                            start={range.start}
                            end={range.end}
                            onChange={(start, end) => setRange({ start, end })}
                            minWidth={230}
                        />
                        <Button
                            variant={unreconciled.length ? "contained" : "outlined"}
                            color={unreconciled.length ? "error" : "inherit"}
                            startIcon={<ReportProblemRoundedIcon />}
                            onClick={() => setListOpen(true)}
                            disabled={!unreconciled.length}
                        >
                            {unreconciled.length
                                ? `Hayajafika kwetu (${unreconciled.length})`
                                : "Yote yamefika"}
                        </Button>
                        </Stack>
                    </Stack>

                    {refreshing ? <LinearProgress sx={{ borderRadius: 1 }} /> : null}

                    {loadError ? (
                        <Alert severity="error" variant="outlined">
                            Imeshindikana kupakia references: {loadError}
                        </Alert>
                    ) : null}

                    {gatewayError ? (
                        <Alert severity="warning" variant="outlined">
                            Gateway haijibu: <b>{GATEWAY_ERRORS[gatewayError] || gatewayError}</b>. Safu ya{" "}
                            <b>Kimelipwa (gateway)</b> haipatikani, kwa hiyo hakuna ulinganisho unaoweza kufanyika
                            na malipo mapya hayawezi kuingia. Rekodi zetu wenyewe zinaonekana hapa chini.
                        </Alert>
                    ) : null}

                    {unreconciled.length ? (
                        <Alert severity="error" variant="outlined">
                            References <b>{unreconciled.length}</b> zina jumla ya{" "}
                            <b>{formatCurrency(shortfallTotal)}</b> iliyolipwa benki ambayo haijafika kwenye mfumo.
                        </Alert>
                    ) : null}

                    {note ? (
                        <Alert severity={note.severity} variant="outlined" onClose={() => setNote(null)}>
                            {note.text}
                        </Alert>
                    ) : null}

                    {!rows.length && !loadError ? (
                        <Typography variant="body2" color="text.secondary">
                            Hakuna reference iliyotengenezwa bado.
                        </Typography>
                    ) : (
                        <Box sx={{ overflowX: "auto" }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Reference</TableCell>
                                        <TableCell>Mwanachama</TableCell>
                                        <TableCell>Aina</TableCell>
                                        <TableCell align="right">Kiasi</TableCell>
                                        <TableCell align="right">Kimelipwa (gateway)</TableCell>
                                        <TableCell align="right">Kimeingia (mfumo)</TableCell>
                                        <TableCell>Hali</TableCell>
                                        <TableCell align="right" />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.map((row) => {
                                        const paid = row.totalPaid ?? 0;
                                        const posted = row.postedAmount ?? 0;
                                        const shortfall = shortfallOf(row);
                                        // With the gateway silent we know what WE posted and
                                        // nothing else, so the row must not claim "Haijalipwa" —
                                        // Abraham Assenga's 100,000 was posted and still read as
                                        // unpaid, which is the opposite of the truth.
                                        const gatewayKnown = row.totalPaid != null;
                                        const chip = shortfall > 0
                                            ? { label: "Haijaingia", color: "error" as const }
                                            : posted > 0
                                                ? { label: "Imeingia", color: "success" as const }
                                                : gatewayKnown
                                                    ? { label: "Haijalipwa", color: "default" as const }
                                                    : { label: "Haijulikani", color: "warning" as const };
                                        return (
                                            <TableRow key={row.referenceNumber} hover>
                                                <TableCell sx={{ fontFamily: "monospace" }}>{row.referenceNumber}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {row.memberName || "—"}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {row.memberNo || "—"}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{purposeLabel(row.purpose)}</TableCell>
                                                <TableCell align="right">
                                                    {row.amount != null ? formatCurrency(row.amount) : "—"}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {row.totalPaid != null ? formatCurrency(paid) : "—"}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: shortfall > 0 ? 800 : 400 }}>
                                                    {formatCurrency(posted)}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip size="small" label={chip.label} color={chip.color} />
                                                </TableCell>
                                                <TableCell align="right">
                                                    {shortfall > 0 ? (
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="error"
                                                            disabled={busy !== null}
                                                            onClick={() => void pullIn(row.referenceNumber)}
                                                        >
                                                            {busy === row.referenceNumber ? "Inavuta…" : "Ingiza"}
                                                        </Button>
                                                    ) : null}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Box>
                    )}
                </Stack>
            </CardContent>

            <Dialog open={listOpen} onClose={() => setListOpen(false)} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>
                    Malipo yaliyokwama benki
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, mt: 0.5 }}>
                        Haya yalilipwa na wanachama na benki inayo, lakini hayajafika kwenye mfumo wa SACCOS.
                        Toa orodha hii na uwapelekee benki, au bonyeza <b>Ingiza</b> kuyavuta sasa.
                    </Typography>
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={1.5}>
                        <Alert severity="error" variant="outlined">
                            Jumla iliyokwama: <b>{formatCurrency(shortfallTotal)}</b> kwenye references{" "}
                            <b>{unreconciled.length}</b>.
                        </Alert>
                        {note ? (
                            <Alert severity={note.severity} variant="outlined" onClose={() => setNote(null)}>
                                {note.text}
                            </Alert>
                        ) : null}
                        <Box sx={{ overflowX: "auto" }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Reference</TableCell>
                                        <TableCell>Mwanachama</TableCell>
                                        <TableCell>Simu</TableCell>
                                        <TableCell>Aina</TableCell>
                                        <TableCell align="right">Kimelipwa benki</TableCell>
                                        <TableCell align="right">Kimeingia mfumo</TableCell>
                                        <TableCell align="right">Pungufu</TableCell>
                                        <TableCell>Sync ya mwisho</TableCell>
                                        <TableCell align="right" />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {unreconciled.map((row) => (
                                        <TableRow key={row.referenceNumber} hover>
                                            <TableCell sx={{ fontFamily: "monospace" }}>{row.referenceNumber}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {row.memberName || "—"}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {row.memberNo || "—"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ fontVariantNumeric: "tabular-nums" }}>
                                                {row.memberPhone || "—"}
                                            </TableCell>
                                            <TableCell>{purposeLabel(row.purpose)}</TableCell>
                                            <TableCell align="right">{formatCurrency(row.totalPaid ?? 0)}</TableCell>
                                            <TableCell align="right">{formatCurrency(row.postedAmount ?? 0)}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 800, color: "error.main" }}>
                                                {formatCurrency(shortfallOf(row))}
                                            </TableCell>
                                            <TableCell>
                                                {row.lastSyncedAt ? formatDate(row.lastSyncedAt) : "—"}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="error"
                                                    disabled={busy !== null}
                                                    onClick={() => void pullIn(row.referenceNumber)}
                                                >
                                                    {busy === row.referenceNumber ? "Inavuta…" : "Ingiza"}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button
                        startIcon={<DownloadRoundedIcon />}
                        onClick={(event) => setExportAnchor(event.currentTarget)}
                        disabled={!unreconciled.length}
                    >
                        Toa orodha
                    </Button>
                    <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}>
                        <MenuItem onClick={() => void exportList("excel")}>Excel (.xlsx)</MenuItem>
                        <MenuItem onClick={() => void exportList("pdf")}>PDF</MenuItem>
                        <MenuItem onClick={() => void exportList("csv")}>CSV</MenuItem>
                    </Menu>
                    <Button variant="contained" onClick={() => setListOpen(false)}>Funga</Button>
                </DialogActions>
            </Dialog>
        </MotionCard>
    );
}
