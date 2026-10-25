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

import { TCDC_SECTORS, TCDC_SUBMISSION_NOTE, tcdcFormBySlug, type TcdcFormDef } from "../features/tcdc/forms";
import { api, getApiErrorMessage } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import { MotionCard } from "../ui/motion";
import { formatCurrency } from "../utils/format";

/// One line of a return as the backend answers it, keyed by the Commission's
/// own row number. `source` names where the figure came from, which is what
/// separates a zero that was posted from a zero the books cannot produce.
interface TcdcLine {
    sno: string;
    amount: number;
    source: string;
}

interface TcdcValidation {
    rule: string;
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
    booked: number;
    shortfall: number;
    npl_ratio: number;
}

interface TcdcReturn {
    code: string;
    as_of: string;
    lines: TcdcLine[];
    validations?: TcdcValidation[];
    reconciliation?: TcdcReconciliation[];
    provisioning?: TcdcProvisioning;
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
    const definition = tcdcFormBySlug(slug);

    // Today, not the month just ended. A manager opening this is usually
    // checking where the SACCO stands now; a filing date is a deliberate
    // change, and defaulting to a closed period would quietly answer a
    // different question than the one being asked.
    const [asOf, setAsOf] = useState(() => new Date().toISOString().slice(0, 10));
    const [data, setData] = useState<TcdcReturn | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Only MSP3_01 is wired so far; the rest render their sheet unfilled.
    const endpoint = definition?.slug === "financial-position"
        ? endpoints.tcdcReturns.financialPosition()
        : null;

    const load = useCallback(async () => {
        if (!endpoint) {
            setData(null);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<{ data: TcdcReturn }>(endpoint, { params: { as_of: asOf } });
            setData(response.data.data);
        } catch (loadError) {
            setError(getApiErrorMessage(loadError));
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [endpoint, asOf]);

    useEffect(() => {
        void load();
    }, [load]);

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
                        <TextField
                            size="small"
                            type="date"
                            label="As at"
                            InputLabelProps={{ shrink: true }}
                            value={asOf}
                            onChange={(event) => setAsOf(event.target.value)}
                        />
                    </Stack>
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

            <MotionCard variant="outlined" inView>
                <CardContent>
                    <FormSheet definition={definition} lines={data?.lines} loading={loading} />
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
    const failed = validations.filter((check) => !check.ok);
    if (!failed.length) {
        return (
            <Alert severity="success" icon={<CheckCircleRoundedIcon fontSize="inherit" />}>
                {validations.map((check) => check.rule).join(", ")} — balanced at {formatCurrency(validations[0].left)}.
            </Alert>
        );
    }
    return (
        <Alert severity="error" icon={<ErrorRoundedIcon fontSize="inherit" />}>
            <Stack spacing={0.25}>
                {failed.map((check) => (
                    <Typography key={check.rule} variant="body2">
                        <strong>{check.rule}</strong> does not hold: {formatCurrency(check.left)} against{" "}
                        {formatCurrency(check.right)}, out by {formatCurrency(check.difference)}.
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
            <Typography variant="caption" color="text.secondary">
                Non-performing loans are {provisioning.npl_ratio}% of the book.
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

    if (definition.shape === "geography") {
        return (
            <Alert severity="info" sx={{ mb: 0 }}>
                This return breaks every figure down by council. It is driven by the members' own
                region and district, so it is built from that data rather than from a fixed sheet —
                wiring it is part of implementing MSP3_07.
            </Alert>
        );
    }

    const labelHeading = definition.shape === "sector-matrix" ? "Sector" : "Particulars";
    const rows: { key: string; sno: string; label: string; kind: string }[] =
        definition.shape === "sector-matrix"
            ? TCDC_SECTORS.map((sector, index) => ({
                key: sector,
                sno: String(index + 1),
                label: sector,
                kind: "input"
            }))
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
                                {valueColumns.map((column) => {
                                    const value = byRow.get(row.sno);
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
                                            {isSection ? "" : value ? (
                                                <Tooltip title={value.source} placement="left" arrow>
                                                    <span>{formatCurrency(value.amount)}</span>
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
