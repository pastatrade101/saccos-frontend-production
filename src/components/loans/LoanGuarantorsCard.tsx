import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
    DialogTitle, IconButton, Stack, TextField, Typography
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import { api, getApiErrorMessage } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";
import { useToast } from "../Toast";
import { formatCurrency, formatDate } from "../../utils/format";
import type { Loan, LoanApplication } from "../../types/api";

interface GuarantorRow {
    member_id: string;
    member_no: string;
    full_name: string;
    amount: string;
}

interface SearchHit {
    member_id: string;
    member_no: string;
    full_name: string;
}

/**
 * The guarantors behind a loan, and — for a branch manager — a way to record
 * the ones that only exist on paper.
 *
 * Most of ILBORU's live loans predate the software or were keyed in from a
 * file, and their signed guarantee forms never reached the system. Until they
 * do, the guarantee is invisible: it does not reduce the guarantor's own
 * borrowing room, it does not stop them withdrawing the savings that are
 * pledged, and if the loan sours there is nothing on record to claim against.
 *
 * Recording is not asking. The people named here signed before this screen
 * existed, so their rows are stored as already accepted and each of them gets
 * a message saying so — which matters, because from that moment their savings
 * are encumbered.
 */
export function LoanGuarantorsCard({
    loan,
    tenantId,
    canEdit
}: {
    loan: Loan;
    tenantId: string;
    canEdit: boolean;
}) {
    const { pushToast } = useToast();
    const [application, setApplication] = useState<LoanApplication | null>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState<GuarantorRow[]>([]);
    const [reason, setReason] = useState("");
    const [lookup, setLookup] = useState("");
    const [lookupBusy, setLookupBusy] = useState(false);
    const [saving, setSaving] = useState(false);

    const outstanding = Number(loan.outstanding_principal || 0);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get<{ data: LoanApplication[] }>(endpoints.loanApplications.list(), {
                params: { tenant_id: tenantId, loan_id: loan.id, limit: 1 }
            });
            setApplication(data.data?.[0] || null);
        } catch {
            setApplication(null);
        } finally {
            setLoading(false);
        }
    }, [tenantId, loan.id]);

    useEffect(() => {
        void load();
    }, [load]);

    const guarantors = useMemo(() => application?.loan_guarantors || [], [application]);
    const recorded = useMemo(
        () => guarantors.reduce((sum, row) => sum + Number(row.guaranteed_amount || 0), 0),
        [guarantors]
    );
    const allocated = useMemo(
        () => rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
        [rows]
    );

    const openDialog = () => {
        setRows(guarantors.map((row) => ({
            member_id: row.member_id,
            member_no: row.members?.member_no || "",
            full_name: row.members?.full_name || row.guarantor_name || "Member",
            amount: String(Math.round(Number(row.guaranteed_amount || 0)))
        })));
        setReason("");
        setLookup("");
        setOpen(true);
    };

    const addByMemberNo = async () => {
        const term = lookup.trim();
        if (!term) return;
        setLookupBusy(true);
        try {
            const { data } = await api.get<{ data: SearchHit[] }>(endpoints.loanApplications.guarantorSearch(), {
                params: { tenant_id: tenantId, q: term }
            });
            const hit = data.data?.[0];
            if (!hit) {
                pushToast({ type: "error", title: "Not found", message: `No member matches "${term}".` });
                return;
            }
            if (hit.member_id === loan.member_id) {
                pushToast({ type: "error", title: "Not allowed", message: "A member cannot guarantee their own loan." });
                return;
            }
            if (rows.some((row) => row.member_id === hit.member_id)) {
                pushToast({ type: "error", title: "Already listed", message: `${hit.member_no} is already on this loan.` });
                return;
            }
            const remaining = Math.max(0, Math.round(outstanding - allocated));
            setRows((prev) => [...prev, {
                member_id: hit.member_id,
                member_no: hit.member_no,
                full_name: hit.full_name,
                amount: remaining > 0 ? String(remaining) : ""
            }]);
            setLookup("");
        } catch (error) {
            pushToast({ type: "error", title: "Lookup failed", message: getApiErrorMessage(error) });
        } finally {
            setLookupBusy(false);
        }
    };

    const save = async () => {
        setSaving(true);
        try {
            await api.post(endpoints.loanApplications.loanGuarantors(loan.id), {
                reason: reason.trim(),
                guarantors: rows.map((row) => ({
                    member_id: row.member_id,
                    guaranteed_amount: Number(row.amount) || 0
                }))
            });
            pushToast({
                type: "success",
                title: "Guarantors recorded",
                message: "Each guarantor has been told that their guarantee is now on the system."
            });
            setOpen(false);
            await load();
        } catch (error) {
            pushToast({ type: "error", title: "Could not record", message: getApiErrorMessage(error) });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography variant="h6">Guarantors</Typography>
                        {canEdit ? (
                            <Button size="small" variant="outlined" onClick={openDialog} disabled={loading}>
                                {guarantors.length ? "Edit guarantors" : "Record guarantors"}
                            </Button>
                        ) : null}
                    </Stack>

                    {loading ? (
                        <Typography variant="body2" color="text.secondary">Loading…</Typography>
                    ) : guarantors.length ? (
                        <Stack spacing={1}>
                            {guarantors.map((row) => (
                                <Stack
                                    key={row.member_id}
                                    direction="row"
                                    spacing={1}
                                    justifyContent="space-between"
                                    alignItems="baseline"
                                    flexWrap="wrap"
                                    useFlexGap
                                >
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            {row.members?.full_name || row.guarantor_name || "Member"}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {row.members?.member_no || "—"}
                                            {row.consented_at ? ` · recorded ${formatDate(row.consented_at)}` : ""}
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                                            {formatCurrency(Number(row.accepted_amount ?? row.guaranteed_amount))}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            variant="outlined"
                                            color={row.consent_status === "accepted" ? "success" : row.consent_status === "rejected" ? "error" : "warning"}
                                            label={row.consent_status}
                                        />
                                    </Stack>
                                </Stack>
                            ))}
                            <Typography variant="caption" color="text.secondary">
                                {`${formatCurrency(recorded)} guaranteed against ${formatCurrency(outstanding)} still owed.`}
                            </Typography>
                        </Stack>
                    ) : (
                        <Alert severity="warning" variant="outlined">
                            No guarantor is on record for this loan. If a guarantee form was signed, nothing on
                            this system knows about it — the guarantors' savings are not held, and there is
                            nothing to claim against if the loan is not repaid.
                        </Alert>
                    )}
                </Stack>
            </CardContent>

            <Dialog open={open} onClose={saving ? undefined : () => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Record the guarantors on {loan.loan_number}</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={1.75} sx={{ pt: 0.5 }}>
                        <Alert severity="info" variant="outlined">
                            This records an agreement that already exists. Each person named is stored as having
                            accepted, and is sent a message saying their guarantee is now on the system — from
                            that moment their savings are held against this loan.
                        </Alert>

                        <TextField
                            label="Where these names come from"
                            placeholder="Signed guarantee form, file 2026/014"
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            size="small"
                            fullWidth
                            multiline
                            minRows={2}
                        />

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Member number or name"
                                value={lookup}
                                onChange={(event) => setLookup(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        void addByMemberNo();
                                    }
                                }}
                            />
                            <Button variant="outlined" onClick={() => void addByMemberNo()} disabled={lookupBusy || !lookup.trim()}>
                                {lookupBusy ? "Checking…" : "Add"}
                            </Button>
                        </Stack>

                        {rows.map((row, index) => (
                            <Stack key={row.member_id} direction="row" spacing={1} alignItems="center">
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.full_name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{row.member_no}</Typography>
                                </Box>
                                <TextField
                                    size="small"
                                    type="number"
                                    label="Amount"
                                    value={row.amount}
                                    sx={{ width: 150 }}
                                    onChange={(event) => setRows((prev) => prev.map((item, position) => (
                                        position === index ? { ...item, amount: event.target.value } : item
                                    )))}
                                />
                                <IconButton
                                    size="small"
                                    onClick={() => setRows((prev) => prev.filter((_, position) => position !== index))}
                                >
                                    <CloseRoundedIcon fontSize="small" />
                                </IconButton>
                            </Stack>
                        ))}

                        <Typography
                            variant="caption"
                            color={allocated > outstanding ? "error.main" : "text.secondary"}
                            sx={{ fontWeight: 700 }}
                        >
                            {`${formatCurrency(allocated)} of ${formatCurrency(outstanding)} still owed`}
                            {allocated > outstanding ? " — more than the loan can lose" : ""}
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => void save()}
                        disabled={saving || !rows.length || reason.trim().length < 5 || rows.some((row) => !(Number(row.amount) > 0))}
                    >
                        {saving ? "Recording…" : "Record"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
}
