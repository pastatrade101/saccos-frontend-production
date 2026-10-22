import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CardContent,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";

import { api, getApiErrorMessage } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";
import { MotionCard } from "../../ui/motion";
import { formatCurrency } from "../../utils/format";

interface UcgReferenceRow {
    referenceNumber: string;
    memberName: string | null;
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
}

const PURPOSE_LABELS: Record<string, string> = {
    savings_deposit: "Akiba",
    share_contribution: "Hisa",
    membership_fee: "Ada ya uanachama",
    loan_repayment: "Marejesho ya mkopo",
    operation_cost: "Gharama za uendeshaji"
};

// The gateway taking a payment and the SACCO posting it are two separate events.
// A missing webhook (or a sync that quietly failed) leaves money sitting at the
// bank with nothing in our ledger, so the shortfall is what this table leads on.
function shortfallOf(row: UcgReferenceRow) {
    const paid = row.totalPaid ?? 0;
    const posted = row.postedAmount ?? 0;
    return Math.max(paid - posted, 0);
}

// Every UCG reference the SACCO has minted: what the gateway reports as paid,
// what we posted, and a button to pull in anything the gateway never told us
// about. Hidden on error so it ships safely while UCG is still off.
export function UcgReferencesTable() {
    const [rows, setRows] = useState<UcgReferenceRow[]>([]);
    const [busy, setBusy] = useState<string | null>(null);
    const [note, setNote] = useState<{ severity: "success" | "error"; text: string } | null>(null);

    const load = useCallback(async () => {
        try {
            const { data } = await api.get<UcgReferencesResponse>(endpoints.memberPayments.ucgReferences());
            return data?.data || [];
        } catch {
            return [];
        }
    }, []);

    useEffect(() => {
        let active = true;
        void load().then((loaded) => {
            if (active) {
                setRows(loaded);
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

    if (!rows.length) {
        return null;
    }

    const unreconciled = rows.filter((row) => shortfallOf(row) > 0);
    const shortfallTotal = unreconciled.reduce((sum, row) => sum + shortfallOf(row), 0);

    return (
        <MotionCard>
            <CardContent>
                <Stack spacing={1.5}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        References za UCG
                    </Typography>

                    {unreconciled.length ? (
                        <Alert severity="warning" variant="outlined">
                            References <b>{unreconciled.length}</b> zina malipo ya{" "}
                            <b>{formatCurrency(shortfallTotal)}</b> kwenye gateway ambayo hayajaingia kwenye mfumo.
                            Bonyeza <b>Ingiza</b> kwenye safu husika ili kuyavuta.
                        </Alert>
                    ) : null}

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
                                    const chip = shortfall > 0
                                        ? { label: "Haijaingia", color: "error" as const }
                                        : paid === 0
                                            ? { label: "Haijalipwa", color: "default" as const }
                                            : { label: "Imeingia", color: "success" as const };
                                    return (
                                        <TableRow
                                            key={row.referenceNumber}
                                            sx={shortfall > 0 ? { bgcolor: "error.light", opacity: 0.96 } : undefined}
                                        >
                                            <TableCell sx={{ fontFamily: "monospace" }}>{row.referenceNumber}</TableCell>
                                            <TableCell>{row.memberName || "—"}</TableCell>
                                            <TableCell>{PURPOSE_LABELS[row.purpose] || row.purpose}</TableCell>
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
                                                <Button
                                                    size="small"
                                                    variant={shortfall > 0 ? "contained" : "text"}
                                                    color={shortfall > 0 ? "error" : "inherit"}
                                                    disabled={busy !== null}
                                                    onClick={() => void pullIn(row.referenceNumber)}
                                                >
                                                    {busy === row.referenceNumber ? "Inavuta…" : "Ingiza"}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </Box>
                </Stack>
            </CardContent>
        </MotionCard>
    );
}
