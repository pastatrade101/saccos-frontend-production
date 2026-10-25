import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
    Box,
    Button,
    Chip,
    IconButton,
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
import { useState } from "react";

import { formatCurrency } from "../../utils/format";

export interface BankExposureRow {
    id: string;
    counterparty: string;
    deposit_amount: number;
    loan_amount: number;
    as_of: string;
    notes: string | null;
    /// Carried forward from an earlier date rather than struck for this one.
    stale: boolean;
}

export interface BankExposureSection {
    key: string;
    label: string;
    rows: BankExposureRow[];
    deposits: number;
    loans: number;
}

interface Props {
    sections: BankExposureSection[];
    asOf: string;
    canEdit: boolean;
    busy: boolean;
    onSave: (entry: { section: string; counterparty: string; deposit_amount: number; loan_amount: number }) => Promise<void>;
    onRemove: (row: BankExposureRow) => Promise<void>;
}

/// MSP3_11's register: one line per counterparty, grouped into the blocks the
/// Commission divides the sheet into.
///
/// Editable, because nothing in the system holds these figures — the ledger
/// has a single cash account and the bank accounts table carries payment
/// instructions without balances. Someone has to type them, so the return is
/// where they get typed.
export function BankExposureRegister({ sections, asOf, canEdit, busy, onSave, onRemove }: Props) {
    const [openSection, setOpenSection] = useState<string | null>(null);
    const [draft, setDraft] = useState({ counterparty: "", deposit_amount: "", loan_amount: "" });

    const startAdding = (sectionKey: string) => {
        setOpenSection(sectionKey);
        setDraft({ counterparty: "", deposit_amount: "", loan_amount: "" });
    };

    const save = async (sectionKey: string) => {
        if (!draft.counterparty.trim()) return;
        await onSave({
            section: sectionKey,
            counterparty: draft.counterparty.trim(),
            deposit_amount: Number(draft.deposit_amount) || 0,
            loan_amount: Number(draft.loan_amount) || 0
        });
        setOpenSection(null);
    };

    return (
        <Stack spacing={2.5}>
            {sections.map((section) => (
                <Box key={section.key}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" spacing={1}>
                        <Typography variant="subtitle2">{section.label}</Typography>
                        {canEdit ? (
                            <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => startAdding(section.key)}>
                                Add line
                            </Button>
                        ) : null}
                    </Stack>

                    <TableContainer sx={{ overflowX: "auto", mt: 0.5 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name of Bank or Financial Institution</TableCell>
                                    <TableCell align="right">Deposit Amounts (TZS)</TableCell>
                                    <TableCell align="right">Loan Amount (TZS)</TableCell>
                                    {canEdit ? <TableCell sx={{ width: 48 }} /> : null}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {section.rows.map((row) => (
                                    <TableRow key={`${section.key}-${row.counterparty}`} hover>
                                        <TableCell>
                                            {row.counterparty}
                                            {row.stale ? (
                                                // The figure is the latest recorded, but it was struck
                                                // for an earlier date. On a return filed for a specific
                                                // date, that distinction matters.
                                                <Tooltip title={`Last recorded ${row.as_of}, carried forward`} arrow>
                                                    <Chip size="small" variant="outlined" color="warning" label={row.as_of} sx={{ ml: 0.75 }} />
                                                </Tooltip>
                                            ) : null}
                                            {row.notes ? (
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {row.notes}
                                                </Typography>
                                            ) : null}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                                            {formatCurrency(row.deposit_amount)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                                            {formatCurrency(row.loan_amount)}
                                        </TableCell>
                                        {canEdit ? (
                                            <TableCell>
                                                <IconButton
                                                    size="small"
                                                    disabled={busy}
                                                    onClick={() => onRemove(row)}
                                                    aria-label={`Remove ${row.counterparty}`}
                                                >
                                                    <DeleteOutlineRoundedIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        ) : null}
                                    </TableRow>
                                ))}

                                {openSection === section.key ? (
                                    <TableRow>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                autoFocus
                                                placeholder="NMB, Mwanga Hakika, MPESA…"
                                                value={draft.counterparty}
                                                onChange={(event) => setDraft({ ...draft, counterparty: event.target.value })}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={draft.deposit_amount}
                                                onChange={(event) => setDraft({ ...draft, deposit_amount: event.target.value })}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={draft.loan_amount}
                                                onChange={(event) => setDraft({ ...draft, loan_amount: event.target.value })}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={0.5}>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    disabled={busy || !draft.counterparty.trim()}
                                                    onClick={() => save(section.key)}
                                                >
                                                    Save
                                                </Button>
                                                <Button size="small" onClick={() => setOpenSection(null)}>Cancel</Button>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ) : null}

                                {!section.rows.length && openSection !== section.key ? (
                                    <TableRow>
                                        <TableCell colSpan={canEdit ? 4 : 3}>
                                            <Typography variant="body2" color="text.secondary" sx={{ py: 1.5, textAlign: "center" }}>
                                                Nothing recorded for {asOf}.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : null}

                                {section.rows.length ? (
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Section total</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                                            {formatCurrency(section.deposits)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                                            {formatCurrency(section.loans)}
                                        </TableCell>
                                        {canEdit ? <TableCell /> : null}
                                    </TableRow>
                                ) : null}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            ))}
        </Stack>
    );
}
