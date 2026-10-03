import { useEffect, useState } from "react";
import { Box, Chip, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";

import { api } from "../../lib/api";
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

// Every UCG reference the SACCO has minted, with what the gateway reports as paid.
// Hidden on error so it ships safely while UCG is still off.
export function UcgReferencesTable() {
    const [rows, setRows] = useState<UcgReferenceRow[]>([]);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const { data } = await api.get<UcgReferencesResponse>(endpoints.memberPayments.ucgReferences());
                if (active) {
                    setRows(data?.data || []);
                }
            } catch {
                if (active) {
                    setRows([]);
                }
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    if (!rows.length) {
        return null;
    }

    return (
        <MotionCard>
            <CardContent>
                <Stack spacing={1.5}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        References za UCG
                    </Typography>
                    <Box sx={{ overflowX: "auto" }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Reference</TableCell>
                                    <TableCell>Mwanachama</TableCell>
                                    <TableCell>Aina</TableCell>
                                    <TableCell align="right">Kiasi</TableCell>
                                    <TableCell align="right">Kimelipwa (gateway)</TableCell>
                                    <TableCell>Hali</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map((row) => {
                                    const paid = row.totalPaid ?? 0;
                                    const unpaid = paid === 0;
                                    return (
                                        <TableRow key={row.referenceNumber}>
                                            <TableCell sx={{ fontFamily: "monospace" }}>{row.referenceNumber}</TableCell>
                                            <TableCell>{row.memberName || "—"}</TableCell>
                                            <TableCell>{PURPOSE_LABELS[row.purpose] || row.purpose}</TableCell>
                                            <TableCell align="right">
                                                {row.amount != null ? formatCurrency(row.amount) : "—"}
                                            </TableCell>
                                            <TableCell align="right">
                                                {row.totalPaid != null ? formatCurrency(paid) : "—"}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={unpaid ? "Haijalipwa" : "Imelipwa"}
                                                    color={unpaid ? "default" : "success"}
                                                />
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
