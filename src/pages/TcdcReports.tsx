import AssuredWorkloadRoundedIcon from "@mui/icons-material/AssuredWorkloadRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import RuleRoundedIcon from "@mui/icons-material/RuleRounded";
import {
    Alert,
    Box,
    CardContent,
    Chip,
    Divider,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { BankExposureRegister, type BankExposureSection } from "../features/tcdc/BankExposureRegister";
import { TCDC_SECTORS, TCDC_SUBMISSION_NOTE, tcdcFormBySlug, type TcdcFormDef } from "../features/tcdc/forms";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";
import { api, getApiErrorMessage } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import { MotionCard } from "../ui/motion";
import { formatCurrency, formatDate } from "../utils/format";

/// One line of a return as the backend answers it, keyed by the Commission's
/// own row number. `source` names where the figure came from, which is what
/// separates a zero that was posted from a zero the books cannot produce.
interface TcdcLine {
    sno: string;
    /// Geography rows name their own council — the rows are built from where
    /// the members are, not from a sheet.
    label?: string;
    amount: number;
    /// Present on returns the Commission wants two columns for.
    year_to_date?: number;
    /// Ratio rows carry their regulatory floor with them, so a reader does not
    /// have to remember which minimum applies to which line.
    unit?: "percent";
    minimum?: number;
    meets_minimum?: boolean;
    /// Matrix returns answer one row as many figures at once, keyed by the
    /// field names the form definition's `valueFields` names.
    cells?: Record<string, number>;
    source: string;
}

interface InsiderLoanRow {
    loan_id: string;
    loan_number: string;
    member_no: string | null;
    full_name: string | null;
    position: string | null;
    related_to: string | null;
    loan_type: string;
    borrowed_amount: number;
    expiry_date: string | null;
    interest_rate: number;
    amount_outstanding: number;
    secured_by_savings: number;
}

/// Which returns are wired to the ledger. A slug absent here renders its sheet
/// unfilled rather than failing — the eleven are being connected one at a time.
const ENDPOINT_BY_SLUG: Record<string, string> = {
    "financial-position": endpoints.tcdcReturns.financialPosition(),
    "comprehensive-income": endpoints.tcdcReturns.comprehensiveIncome(),
    "liquid-assets": endpoints.tcdcReturns.liquidAssets(),
    "capital-adequacy": endpoints.tcdcReturns.capitalAdequacy(),
    "loan-sectors": endpoints.tcdcReturns.sectorClassification(),
    "loan-interest-rates": endpoints.tcdcReturns.interestRateStructure(),
    "loans-disbursed": endpoints.tcdcReturns.loansDisbursed(),
    "geography": endpoints.tcdcReturns.geography(),
    "bank-exposures": endpoints.tcdcReturns.bankExposures(),
    "insider-loans": endpoints.tcdcReturns.insiderLoans()
};

interface TcdcValidation {
    rule: string;
    unit?: "percent";
    left: number;
    right: number;
    difference: number;
    ok: boolean;
}

interface TcdcReconciliation {
    label: string;
    ledger: number;
    subledger: number;
    difference: number;
}

interface TcdcProvisioning {
    required: number;
    /// What the ladder would demand without the compulsory-savings deduction.
    before_savings?: number;
    savings_cover?: number;
    booked: number;
    shortfall: number;
    npl_ratio: number;
}

interface TcdcReturn {
    code: string;
    as_of: string;
    period_start?: string;
    year_start?: string;
    lines: TcdcLine[];
    validations?: TcdcValidation[];
    reconciliation?: TcdcReconciliation[];
    provisioning?: TcdcProvisioning;
    /// What the return could not say, in its own words. These are data gaps
    /// the filing carries, not formatting — a reader has to see them before
    /// signing, so they render above the sheet rather than under it.
    notes?: string[];
    caveats?: string[];
    /// MSP3_11 answers as a register grouped into the Commission's blocks
    /// rather than as numbered rows.
    sections?: BankExposureSection[];
    net_exposures?: { net_loan_exposure: number; net_deposit_exposure: number };
    /// MSP3_06 answers as a named register — the Commission reads it to see
    /// who received what, so it is never aggregated.
    rows?: InsiderLoanRow[];
    totals?: { borrowed: number; outstanding: number; secured_by_savings: number };
    /// GL accounts that moved in the period but feed no row of the return.
    /// Always empty on a correct mapping — a non-empty list means income the
    /// SACCO earned would be missing from the filing.
    unassigned?: { account_code: string; year_to_date: number }[];
}

/// Renders any of the eleven TCDC Tier 3 returns from its definition in
/// features/tcdc/forms.ts.
///
/// One page rather than eleven: the returns differ in their rows, not in how
/// a row is laid out, and the rows are a filing specification we transcribe
/// rather than design. Eleven components would be eleven places to drift from
/// the Commission's workbook.
export function TcdcReportsPage() {
    const { form: slug } = useParams();
    const { profile } = useAuth();
    const { pushToast } = useToast();
    const definition = tcdcFormBySlug(slug);
    const canRecord = profile?.role === "super_admin" || profile?.role === "branch_manager";

    // Today, not the month just ended. A manager opening this is usually
    // checking where the SACCO stands now; a filing date is a deliberate
    // change, and defaulting to a closed period would quietly answer a
    // different question than the one being asked.
    const [asOf, setAsOf] = useState(() => new Date().toISOString().slice(0, 10));
    const [data, setData] = useState<TcdcReturn | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recording, setRecording] = useState(false);

    // Monthly for Category B, quarterly for Category A. Only the income
    // statement is struck over a window; the rest are as-at dates.
    const [periodBasis, setPeriodBasis] = useState<"month" | "quarter">("month");

    // Returns wired to the ledger so far. The rest render their sheet unfilled.
    const endpoint = ENDPOINT_BY_SLUG[definition?.slug ?? ""] ?? null;
    // Struck over a window rather than at a date: income earned in a period,
    // and lending done in one.
    const usesPeriod = definition?.slug === "comprehensive-income"
        || definition?.slug === "loans-disbursed";

    const load = useCallback(async () => {
        if (!endpoint) {
            setData(null);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const params = usesPeriod ? { as_of: asOf, period: periodBasis } : { as_of: asOf };
            const response = await api.get<{ data: TcdcReturn }>(endpoint, { params });
            setData(response.data.data);
        } catch (loadError) {
            setError(getApiErrorMessage(loadError));
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [endpoint, asOf, periodBasis, usesPeriod]);

    useEffect(() => {
        void load();
    }, [load]);

    // Recording a figure changes what the Commission's cross-checks compare,
    // so the whole return is reloaded rather than the one row patched: a
    // register that saved but left the checks stale would be worse than one
    // that took a moment longer.
    const recordBalance = async (entry: {
        section: string;
        counterparty: string;
        deposit_amount: number;
        loan_amount: number;
    }) => {
        setRecording(true);
        try {
            await api.put(endpoints.tcdcReturns.bankExposures(), { ...entry, as_of: asOf });
            await load();
        } catch (saveError) {
            pushToast({ type: "error", title: "Unable to record the balance", message: getApiErrorMessage(saveError) });
        } finally {
            setRecording(false);
        }
    };

    const removeBalance = async (row: { id: string; counterparty: string }) => {
        setRecording(true);
        try {
            await api.delete(endpoints.tcdcReturns.deleteBankBalance(row.id));
            await load();
        } catch (removeError) {
            pushToast({ type: "error", title: "Unable to remove the line", message: getApiErrorMessage(removeError) });
        } finally {
            setRecording(false);
        }
    };

    if (!definition) {
        return (
            <Alert severity="warning">
                No TCDC return matches “{slug}”. Pick one from the TCDC Returns menu.
            </Alert>
        );
    }

    return (
        <Stack spacing={2}>
            <MotionCard variant="outlined" inView>
                <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" spacing={1.5}>
                        <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <AssuredWorkloadRoundedIcon color="primary" />
                                <Typography variant="h5">{definition.title}</Typography>
                                <Chip size="small" label={definition.code} />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                                {definition.blurb}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {TCDC_SUBMISSION_NOTE}
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1}>
                            {usesPeriod ? (
                                <TextField
                                    size="small"
                                    select
                                    label="Period"
                                    value={periodBasis}
                                    onChange={(event) => setPeriodBasis(event.target.value as "month" | "quarter")}
                                    sx={{ minWidth: 130 }}
                                    SelectProps={{ native: true }}
                                    InputLabelProps={{ shrink: true }}
                                >
                                    <option value="month">Month</option>
                                    <option value="quarter">Quarter</option>
                                </TextField>
                            ) : null}
                            <TextField
                                size="small"
                                type="date"
                                label="As at"
                                InputLabelProps={{ shrink: true }}
                                value={asOf}
                                onChange={(event) => setAsOf(event.target.value)}
                            />
                        </Stack>
                    </Stack>
                    {data?.period_start ? (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                            Period {data.period_start} to {data.as_of} · financial year from {data.year_start}
                        </Typography>
                    ) : null}
                </CardContent>
            </MotionCard>

            {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}

            {!endpoint ? (
                <Alert severity="info">
                    The sheet below is the Commission's own layout, row numbers and wording. This return is
                    not wired to the ledger yet — they are being connected one at a time.
                </Alert>
            ) : null}

            {data?.validations?.length ? <ValidationBanner validations={data.validations} /> : null}

            {data?.provisioning ? <ProvisioningBanner provisioning={data.provisioning} /> : null}

            {data?.notes?.length ? (
                <Alert severity="warning">
                    <Stack spacing={0.25}>
                        {data.notes.map((note) => (
                            <Typography key={note} variant="body2">{note}</Typography>
                        ))}
                    </Stack>
                </Alert>
            ) : null}

            {data?.caveats?.length ? (
                <Alert severity="info">
                    <Stack spacing={0.25}>
                        {data.caveats.map((caveat) => (
                            <Typography key={caveat} variant="body2">{caveat}</Typography>
                        ))}
                    </Stack>
                </Alert>
            ) : null}

            {data?.unassigned?.length ? (
                <Alert severity="warning">
                    {data.unassigned.length} ledger account
                    {data.unassigned.length === 1 ? "" : "s"} moved this year but feed no row of this return:{" "}
                    {data.unassigned.map((entry) => entry.account_code).join(", ")}. Those figures are missing
                    from the filing until each is mapped to a row.
                </Alert>
            ) : null}

            <MotionCard variant="outlined" inView>
                <CardContent>
                    {data?.rows ? (
                        <InsiderRegister rows={data.rows} totals={data.totals} />
                    ) : data?.sections ? (
                        <>
                            <BankExposureRegister
                                sections={data.sections}
                                asOf={data.as_of}
                                canEdit={canRecord}
                                busy={recording}
                                onSave={recordBalance}
                                onRemove={removeBalance}
                            />
                            {data.net_exposures ? (
                                <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap sx={{ mt: 2.5 }}>
                                    <Stack>
                                        <Typography variant="caption" color="text.secondary">Total net deposit exposure</Typography>
                                        <Typography variant="h6">{formatCurrency(data.net_exposures.net_deposit_exposure)}</Typography>
                                    </Stack>
                                    <Stack>
                                        <Typography variant="caption" color="text.secondary">Total net loan exposure</Typography>
                                        <Typography variant="h6">{formatCurrency(data.net_exposures.net_loan_exposure)}</Typography>
                                    </Stack>
                                </Stack>
                            ) : null}
                        </>
                    ) : (
                        <FormSheet definition={definition} lines={data?.lines} loading={loading} />
                    )}
                </CardContent>
            </MotionCard>

            {data?.reconciliation?.length ? <ReconciliationCard rows={data.reconciliation} /> : null}

            {definition.validations?.length || definition.notes?.length ? (
                <MotionCard variant="outlined" inView>
                    <CardContent>
                        <Stack spacing={1.5}>
                            {definition.validations?.length ? (
                                <Box>
                                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
                                        <RuleRoundedIcon fontSize="small" color="action" />
                                        <Typography variant="subtitle2">Cross-checks the Commission applies</Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                        {definition.validations.map((rule) => (
                                            <Chip key={rule} size="small" variant="outlined" sx={{ fontFamily: "monospace" }} label={rule} />
                                        ))}
                                    </Stack>
                                </Box>
                            ) : null}

                            {definition.notes?.length ? (
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>Notes</Typography>
                                    <Stack component="ul" spacing={0.25} sx={{ pl: 2.5, m: 0 }}>
                                        {definition.notes.map((note) => (
                                            <Typography key={note} component="li" variant="body2" color="text.secondary">
                                                {note}
                                            </Typography>
                                        ))}
                                    </Stack>
                                </Box>
                            ) : null}
                        </Stack>
                    </CardContent>
                </MotionCard>
            ) : null}
        </Stack>
    );
}

const PENDING = "—";

/// The Commission's own cross-checks, run before anyone files. A return that
/// fails one is rejected, so the result belongs at the top of the page rather
/// than in a footnote.
function ValidationBanner({ validations }: { validations: TcdcValidation[] }) {
    const show = (check: TcdcValidation, value: number) =>
        check.unit === "percent" ? `${value.toFixed(2)}%` : formatCurrency(value);

    const failed = validations.filter((check) => !check.ok);
    if (!failed.length) {
        return (
            <Alert severity="success" icon={<CheckCircleRoundedIcon fontSize="inherit" />}>
                <Stack spacing={0.25}>
                    {validations.map((check) => (
                        <Typography key={check.rule} variant="body2">
                            <strong>{check.rule}</strong> — {show(check, check.left)}.
                        </Typography>
                    ))}
                </Stack>
            </Alert>
        );
    }
    return (
        <Alert severity="error" icon={<ErrorRoundedIcon fontSize="inherit" />}>
            <Stack spacing={0.25}>
                {failed.map((check) => (
                    <Typography key={check.rule} variant="body2">
                        <strong>{check.rule}</strong> — {show(check, check.left)} against{" "}
                        {show(check, check.right)}, short by {show(check, Math.abs(check.difference))}.
                    </Typography>
                ))}
            </Stack>
        </Alert>
    );
}

/// The provisioning ladder against what the books carry. A shortfall is an
/// entry waiting to be made, not a reporting choice — it reduces institutional
/// capital on MSP3_09 the moment it is posted.
function ProvisioningBanner({ provisioning }: { provisioning: TcdcProvisioning }) {
    if (provisioning.shortfall < 1) {
        return (
            <Alert severity="success">
                Loan loss allowance is fully provided: {formatCurrency(provisioning.booked)} booked against{" "}
                {formatCurrency(provisioning.required)} required. Non-performing loans are {provisioning.npl_ratio}% of the book.
            </Alert>
        );
    }
    return (
        <Alert severity="warning">
            <Typography variant="body2">
                The Commission's ladder requires an allowance of{" "}
                <strong>{formatCurrency(provisioning.required)}</strong>; the books carry{" "}
                {formatCurrency(provisioning.booked)}. Row 5 reports what is posted, so the sheet still ties to
                the ledger — but <strong>{formatCurrency(provisioning.shortfall)}</strong> is an accounting entry
                waiting to be made, and it reduces institutional capital on MSP3_09 once it is.
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
                Non-performing loans are {provisioning.npl_ratio}% of the book.
                {provisioning.savings_cover ? (
                    <> The members' own savings cover {formatCurrency(provisioning.savings_cover)} of the
                    book, which MSP3_03 deducts before the ladder applies — without it the requirement
                    would be {formatCurrency(provisioning.before_savings ?? 0)}.</>
                ) : null}
            </Typography>
        </Alert>
    );
}

/// Where the ledger and the sub-ledgers disagree. Shown rather than
/// reconciled away: the return follows the ledger, so a gap is something for
/// someone to act on, not something for this page to decide.
function ReconciliationCard({ rows }: { rows: TcdcReconciliation[] }) {
    const live = rows.filter((row) => Math.abs(row.difference) >= 1);
    if (!live.length) return null;

    return (
        <MotionCard variant="outlined" inView>
            <CardContent>
                <Typography variant="subtitle2" gutterBottom>Ledger against sub-ledger</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    This return is built from the general ledger. These balances disagree with the sub-ledgers
                    behind them, so the figures filed will not match what the loan pages show.
                </Typography>
                <TableContainer sx={{ overflowX: "auto" }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Balance</TableCell>
                                <TableCell align="right">General ledger</TableCell>
                                <TableCell align="right">Sub-ledger</TableCell>
                                <TableCell align="right">Difference</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {live.map((row) => (
                                <TableRow key={row.label}>
                                    <TableCell>{row.label}</TableCell>
                                    <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(row.ledger)}</TableCell>
                                    <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(row.subledger)}</TableCell>
                                    <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", color: "warning.main", fontWeight: 700 }}>
                                        {formatCurrency(row.difference)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </MotionCard>
    );
}

/// A return is either a fixed list of numbered lines, the same measures
/// repeated down the sector list, a free register of named rows, or the
/// council breakdown. The first three only differ in where the row labels
/// come from, so they share a renderer.
function FormSheet({
    definition,
    lines,
    loading
}: {
    definition: TcdcFormDef;
    lines?: TcdcLine[];
    loading?: boolean;
}) {
    const valueColumns = useMemo(
        () => definition.columns ?? ["Amount (TZS)"],
        [definition.columns]
    );

    // Keyed by the Commission's row number, which is how the backend answers
    // and how the workbook's own cross-checks refer to a line.
    const byRow = useMemo(
        () => new Map((lines ?? []).map((entry) => [entry.sno, entry])),
        [lines]
    );

    if (definition.shape === "geography" && !lines?.length) {
        return (
            <Alert severity="info" sx={{ mb: 0 }}>
                This return breaks every figure down by council, built from where the members actually
                are rather than from a fixed sheet. {loading ? "Loading…" : "Nothing to show yet."}
            </Alert>
        );
    }

    const labelHeading = definition.shape === "sector-matrix"
        ? "Sector"
        : definition.shape === "geography"
            ? "Council"
            : "Particulars";

    if (definition.shape === "geography") {
        return (
            <TableContainer sx={{ overflowX: "auto" }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>{labelHeading}</TableCell>
                            {valueColumns.map((column) => (
                                <TableCell key={column} align="right">{column}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(lines ?? []).map((row) => {
                            const isTotal = row.sno === "total";
                            return (
                                <TableRow key={row.sno} hover={!isTotal}>
                                    <TableCell sx={{ fontWeight: isTotal ? 700 : 400, bgcolor: isTotal ? "action.hover" : undefined }}>
                                        {row.label}
                                    </TableCell>
                                    {valueColumns.map((column, columnIndex) => {
                                        const field = definition.valueFields?.[columnIndex] ?? "amount";
                                        const figure = row.cells?.[field] ?? 0;
                                        const format = definition.columnFormats?.[columnIndex];
                                        return (
                                            <TableCell
                                                key={column}
                                                align="right"
                                                sx={{
                                                    fontWeight: isTotal ? 700 : 400,
                                                    fontVariantNumeric: "tabular-nums",
                                                    bgcolor: isTotal ? "action.hover" : undefined,
                                                    // A zero in a grid this wide is noise; dimming it
                                                    // lets the figures that matter carry the row.
                                                    color: figure === 0 ? "text.disabled" : "text.primary"
                                                }}
                                            >
                                                {format === "currency" ? formatCurrency(figure) : figure.toLocaleString()}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }

    const rows: { key: string; sno: string; label: string; kind: string }[] =
        definition.shape === "sector-matrix"
            ? [
                ...TCDC_SECTORS.map((sector, index) => ({
                    key: sector,
                    sno: String(index + 1),
                    label: sector,
                    kind: "input"
                })),
                ...(definition.totalRows ?? []).map((row) => ({
                    key: `total-${row.sno}`,
                    sno: row.sno,
                    label: row.label,
                    kind: row.kind
                }))
            ]
            : (definition.rows ?? []).map((row, index) => ({
                key: `${row.sno}-${index}`,
                sno: row.sno,
                label: row.label,
                kind: row.kind
            }));

    if (definition.shape === "register") {
        return (
            <TableContainer sx={{ overflowX: "auto" }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>#</TableCell>
                            {valueColumns.map((column) => (
                                <TableCell key={column}>{column}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={valueColumns.length + 1}>
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                                    Rows are listed one per counterparty — none loaded yet.
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }

    return (
        <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ width: 56 }}>Sno</TableCell>
                        <TableCell>{labelHeading}</TableCell>
                        {valueColumns.map((column) => (
                            <TableCell key={column} align="right">{column}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row) => {
                        const isSection = row.kind === "section";
                        const isComputed = row.kind === "computed";
                        return (
                            <TableRow key={row.key} hover={!isSection}>
                                <TableCell sx={{ color: "text.secondary" }}>{row.sno}</TableCell>
                                <TableCell
                                    sx={{
                                        // A section heading carries the structure of the return;
                                        // a computed line carries its arithmetic. Both outrank the
                                        // plain lines between them, so neither reads as one.
                                        fontWeight: isSection || isComputed ? 700 : 400,
                                        pl: isSection ? 1 : 3,
                                        bgcolor: isSection ? "action.hover" : undefined
                                    }}
                                >
                                    {row.label}
                                </TableCell>
                                {valueColumns.map((column, columnIndex) => {
                                    const value = byRow.get(row.sno);
                                    const field = definition.valueFields?.[columnIndex] ?? "amount";
                                    const figure = !value
                                        ? undefined
                                        : value.cells
                                            ? value.cells[field]
                                            : field === "year_to_date"
                                                ? value.year_to_date
                                                : value.amount;
                                    // An unmapped line is a real zero the books cannot
                                    // produce, not a figure still loading. Dimming it
                                    // and naming the reason on hover keeps the two
                                    // apart for whoever signs the return.
                                    const unmapped = value?.source.startsWith("unmapped");
                                    return (
                                        <TableCell
                                            key={column}
                                            align="right"
                                            sx={{
                                                color: value && !unmapped ? "text.primary" : "text.disabled",
                                                fontWeight: isComputed && value && !unmapped ? 700 : 400,
                                                fontVariantNumeric: "tabular-nums",
                                                bgcolor: isSection ? "action.hover" : undefined
                                            }}
                                        >
                                            {isSection ? "" : value && figure !== undefined ? (
                                                <Tooltip title={value.source} placement="left" arrow>
                                                    <span>
                                                        {/* A row that declares itself a percentage wins over the
                                                            column: MSP3_03's provision-rate row sits in the middle
                                                            of columns that are otherwise shillings. */}
                                                        {value.unit === "percent"
                                                            || definition.columnFormats?.[columnIndex] === "percent" ? (
                                                            // A ratio is only meaningful beside its floor, and
                                                            // whether it clears it is the whole point of the row.
                                                            <>
                                                                <Box
                                                                    component="span"
                                                                    sx={{
                                                                        // Green or red only where a floor is actually
                                                                        // being tested. MSP3_04's interest rates are
                                                                        // percentages with nothing to pass or fail,
                                                                        // and painting them red would invent a
                                                                        // compliance problem that is not there.
                                                                        fontWeight: value.minimum !== undefined ? 700 : 400,
                                                                        color: value.minimum === undefined
                                                                            ? "text.primary"
                                                                            : value.meets_minimum
                                                                                ? "success.main"
                                                                                : "error.main"
                                                                    }}
                                                                >
                                                                    {figure.toFixed(2)}%
                                                                </Box>
                                                                {value.minimum !== undefined && value.unit === "percent" ? (
                                                                    <Typography component="span" variant="caption" color="text.secondary">
                                                                        {" "}/ {value.minimum}%
                                                                    </Typography>
                                                                ) : null}
                                                            </>
                                                        ) : definition.columnFormats?.[columnIndex] === "count"
                                                            ? figure.toLocaleString()
                                                            : formatCurrency(figure)}
                                                    </span>
                                                </Tooltip>
                                            ) : loading ? "…" : PENDING}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
            <Divider sx={{ mt: 1 }} />
        </TableContainer>
    );
}

/// MSP3_06's register. Named rows, never a total standing in for them: the
/// Commission reads this to see whether the people who approve lending are
/// also receiving it, and an aggregate would hide the one thing it asks.
function InsiderRegister({
    rows,
    totals
}: {
    rows: InsiderLoanRow[];
    totals?: { borrowed: number; outstanding: number; secured_by_savings: number };
}) {
    if (!rows.length) {
        return (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                No loans to insiders or related parties.
            </Typography>
        );
    }

    return (
        <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Name of Borrower</TableCell>
                        <TableCell>Position</TableCell>
                        <TableCell>Type of Loan</TableCell>
                        <TableCell align="right">Borrowed Amount (TZS)</TableCell>
                        <TableCell>Expiry Date</TableCell>
                        <TableCell align="right">Interest Rate (% p.a.)</TableCell>
                        <TableCell align="right">Amount Outstanding (TZS)</TableCell>
                        <TableCell align="right">Secured by Savings and Shares (TZS)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row.loan_id} hover>
                            <TableCell>
                                <Typography variant="body2">{row.full_name || "—"}</Typography>
                                <Typography variant="caption" color="text.secondary">{row.member_no || "—"}</Typography>
                            </TableCell>
                            <TableCell>
                                {row.position}
                                {row.related_to ? (
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        of {row.related_to}
                                    </Typography>
                                ) : null}
                            </TableCell>
                            <TableCell>{row.loan_type}</TableCell>
                            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                                {formatCurrency(row.borrowed_amount)}
                            </TableCell>
                            <TableCell>{row.expiry_date ? formatDate(row.expiry_date) : "—"}</TableCell>
                            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                                {row.interest_rate.toFixed(2)}%
                            </TableCell>
                            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                                {formatCurrency(row.amount_outstanding)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                                {formatCurrency(row.secured_by_savings)}
                            </TableCell>
                        </TableRow>
                    ))}
                    {totals ? (
                        <TableRow>
                            <TableCell colSpan={3} sx={{ fontWeight: 700 }}>Total</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                                {formatCurrency(totals.borrowed)}
                            </TableCell>
                            <TableCell colSpan={2} />
                            <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                                {formatCurrency(totals.outstanding)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                                {formatCurrency(totals.secured_by_savings)}
                            </TableCell>
                        </TableRow>
                    ) : null}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
