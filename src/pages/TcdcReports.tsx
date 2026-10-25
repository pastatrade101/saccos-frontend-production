import AssuredWorkloadRoundedIcon from "@mui/icons-material/AssuredWorkloadRounded";
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
    Typography
} from "@mui/material";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { TCDC_SECTORS, TCDC_SUBMISSION_NOTE, tcdcFormBySlug, type TcdcFormDef } from "../features/tcdc/forms";
import { MotionCard } from "../ui/motion";

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

    // Defaults to the month just ended: a return is filed after its period
    // closes, so the current month is almost never the one being prepared.
    const [asOf, setAsOf] = useState(() => {
        const now = new Date();
        const previous = new Date(now.getFullYear(), now.getMonth(), 0);
        return previous.toISOString().slice(0, 10);
    });

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

            <Alert severity="info">
                The sheet below is the Commission's own layout, row numbers and wording. The figures are not
                wired to the ledger yet — each line is being connected one return at a time.
            </Alert>

            <MotionCard variant="outlined" inView>
                <CardContent>
                    <FormSheet definition={definition} />
                </CardContent>
            </MotionCard>

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

/// A return is either a fixed list of numbered lines, the same measures
/// repeated down the sector list, a free register of named rows, or the
/// council breakdown. The first three only differ in where the row labels
/// come from, so they share a renderer.
function FormSheet({ definition }: { definition: TcdcFormDef }) {
    const valueColumns = useMemo(
        () => definition.columns ?? ["Amount (TZS)"],
        [definition.columns]
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
                                {valueColumns.map((column) => (
                                    <TableCell
                                        key={column}
                                        align="right"
                                        sx={{
                                            color: "text.disabled",
                                            fontVariantNumeric: "tabular-nums",
                                            bgcolor: isSection ? "action.hover" : undefined
                                        }}
                                    >
                                        {isSection ? "" : PENDING}
                                    </TableCell>
                                ))}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
            <Divider sx={{ mt: 1 }} />
        </TableContainer>
    );
}
