import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import {
    Alert,
    CardContent,
    Chip,
    LinearProgress,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import { AppLoader } from "../components/AppLoader";
import { useToast } from "../components/Toast";
import { api, getApiErrorMessage } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import { MotionCard } from "../ui/motion";
import { formatCurrency, formatDate } from "../utils/format";

interface SectorOption {
    code: string;
    label: string;
}

interface LoanSectorRow {
    loan_id: string;
    loan_number: string;
    member_no: string | null;
    full_name: string | null;
    status: string;
    disbursed_at: string | null;
    outstanding: number;
    tcdc_sector: string | null;
    sector_label: string;
}

interface ClassificationResponse {
    sectors: SectorOption[];
    loans: LoanSectorRow[];
    unclassified_count: number;
    unclassified_outstanding: number;
    total_outstanding: number;
}

/// Puts a TCDC economic sector on every live loan.
///
/// Three returns — MSP3_03, MSP3_04 and MSP3_05 — break the book down by the
/// Commission's 19 sectors, and nothing in the system recorded one until now.
/// New applications capture it going in; this is how the loans already on the
/// book get classified, which is the half that the next filing reports on.
export function TcdcLoanSectorsPage() {
    const { pushToast } = useToast();

    const [data, setData] = useState<ClassificationResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [savingLoanId, setSavingLoanId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<{ data: ClassificationResponse }>(
                endpoints.tcdcReturns.loanSectorClassification()
            );
            setData(response.data.data);
        } catch (loadError) {
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const setSector = async (row: LoanSectorRow, code: string) => {
        if (!data) return;
        const next = code || null;
        setSavingLoanId(row.loan_id);
        try {
            const response = await api.patch<{ data: LoanSectorRow }>(
                endpoints.tcdcReturns.setLoanSector(row.loan_id),
                { tcdc_sector: next }
            );
            // Patch the row in place rather than reloading. Classifying a book
            // is dozens of small edits in a row, and a reload after each one
            // would re-sort the table under the person doing them.
            const saved = response.data.data;
            setData((current) => current && {
                ...current,
                loans: current.loans.map((entry) => (
                    entry.loan_id === row.loan_id
                        ? { ...entry, tcdc_sector: saved.tcdc_sector, sector_label: saved.sector_label }
                        : entry
                ))
            });
        } catch (saveError) {
            pushToast({ type: "error", title: "Unable to set the sector", message: getApiErrorMessage(saveError) });
        } finally {
            setSavingLoanId(null);
        }
    };

    if (loading && !data) {
        return <AppLoader message="Loading the loan book" />;
    }

    // Counted off the rows rather than the response, so the figures move as
    // sectors are set instead of going stale until the next reload.
    const unclassified = data ? data.loans.filter((row) => !row.tcdc_sector) : [];
    const unclassifiedValue = unclassified.reduce((sum, row) => sum + row.outstanding, 0);
    const classifiedShare = data && data.total_outstanding > 0
        ? ((data.total_outstanding - unclassifiedValue) / data.total_outstanding) * 100
        : 0;

    return (
        <Stack spacing={2}>
            {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}

            <MotionCard variant="outlined" inView>
                <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <CategoryRoundedIcon color="primary" />
                        <Typography variant="h5">Loan sectors</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        MSP3_03, MSP3_04 and MSP3_05 break the loan book down by the Commission's 19 economic
                        sectors. New applications now ask for one; these are the loans already on the book.
                    </Typography>
                </CardContent>
            </MotionCard>

            {data ? (
                <MotionCard variant="outlined" inView>
                    <CardContent>
                        <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                            <Stack>
                                <Typography variant="caption" color="text.secondary">Still unclassified</Typography>
                                <Typography variant="h6">{unclassified.length} of {data.loans.length}</Typography>
                            </Stack>
                            <Stack>
                                <Typography variant="caption" color="text.secondary">Value unclassified</Typography>
                                <Typography variant="h6">{formatCurrency(unclassifiedValue)}</Typography>
                            </Stack>
                            <Stack>
                                <Typography variant="caption" color="text.secondary">Book classified</Typography>
                                <Typography variant="h6">{classifiedShare.toFixed(1)}%</Typography>
                            </Stack>
                        </Stack>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(100, Math.max(0, classifiedShare))}
                            color={classifiedShare >= 100 ? "success" : "primary"}
                            sx={{ height: 8, borderRadius: 1 }}
                        />
                        {unclassified.length ? (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                                Those three returns stay incomplete until every loan carries a sector.
                            </Typography>
                        ) : (
                            <Typography variant="caption" color="success.main" sx={{ mt: 1, display: "block" }}>
                                The whole book is classified — MSP3_03, MSP3_04 and MSP3_05 can be filed.
                            </Typography>
                        )}
                    </CardContent>
                </MotionCard>
            ) : null}

            <MotionCard variant="outlined" inView>
                <CardContent>
                    <TableContainer sx={{ overflowX: "auto" }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Member</TableCell>
                                    <TableCell>Loan</TableCell>
                                    <TableCell>Disbursed</TableCell>
                                    <TableCell align="right">Outstanding</TableCell>
                                    <TableCell sx={{ minWidth: 240 }}>TCDC sector</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data?.loans.map((row) => (
                                    <TableRow key={row.loan_id} hover selected={!row.tcdc_sector}>
                                        <TableCell>
                                            <Typography variant="body2">{row.full_name || "—"}</Typography>
                                            <Typography variant="caption" color="text.secondary">{row.member_no || "—"}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" sx={{ fontFamily: "monospace" }}>{row.loan_number}</Typography>
                                            {row.status === "in_arrears" ? (
                                                <Chip size="small" color="error" variant="outlined" label="in arrears" sx={{ ml: 0.5 }} />
                                            ) : null}
                                        </TableCell>
                                        <TableCell>{row.disbursed_at ? formatDate(row.disbursed_at) : "—"}</TableCell>
                                        <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                                            {formatCurrency(row.outstanding)}
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                select
                                                fullWidth
                                                size="small"
                                                value={row.tcdc_sector ?? ""}
                                                disabled={savingLoanId === row.loan_id}
                                                onChange={(event) => setSector(row, event.target.value)}
                                            >
                                                <MenuItem value="">
                                                    <em>Unclassified</em>
                                                </MenuItem>
                                                {data.sectors.map((sector) => (
                                                    <MenuItem key={sector.code} value={sector.code}>
                                                        {sector.label}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {data && !data.loans.length ? (
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                                                No loans are open, so there is nothing to classify.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : null}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </MotionCard>
        </Stack>
    );
}
