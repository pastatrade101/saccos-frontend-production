import {
    Alert,
    Box,
    Button,
    Checkbox,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Grid,
    MenuItem,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { api, getApiErrorCode, getApiErrorMessage } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";
import type { LoanProduct, Member } from "../../types/api";
import { MotionModal } from "../../ui/motion";
import { formatCurrency } from "../../utils/format";
import { annualToMonthlyRate } from "../../utils/loanInterest";
import { SearchableSelect } from "../SearchableSelect";

/**
 * Record a loan that was paid out and never entered.
 *
 * The backend books it exactly as the CSV importer would — backdated journal,
 * ledger and schedule — and brings its interest and arrears up to date. What
 * this form owes the officer is to be plain that it skips appraisal and
 * approval, and to catch the second person entering the same forgotten loan.
 */
export interface RecordedHistoricalLoan {
    reference: string;
    member: { id: string; full_name: string; member_no: string | null };
    loan: {
        id: string;
        loan_number: string;
        principal_amount?: number;
        outstanding_principal?: number;
        accrued_interest?: number;
        status?: string;
    };
}

interface HistoricalLoanDialogProps {
    open: boolean;
    onClose: () => void;
    tenantId: string | null;
    members: Member[];
    products: LoanProduct[];
    onRecorded: (result: RecordedHistoricalLoan) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

function digits(value: string) {
    return Number(value.replace(/[^\d.]/g, "")) || 0;
}

const EMPTY = {
    memberId: "",
    productId: "",
    principal: "",
    monthlyRate: "",
    termMonths: "",
    disbursedAt: "",
    firstDueDate: "",
    frequency: "monthly" as "monthly" | "weekly" | "daily",
    reference: "",
    reason: ""
};

export function HistoricalLoanDialog({ open, onClose, tenantId, members, products, onRecorded }: HistoricalLoanDialogProps) {
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Set when the server has flagged a likely duplicate; the officer has to
    // tick the box before the same request is allowed through.
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
    const [confirmDuplicate, setConfirmDuplicate] = useState(false);

    useEffect(() => {
        if (open) {
            setForm(EMPTY);
            setError(null);
            setDuplicateWarning(null);
            setConfirmDuplicate(false);
        }
    }, [open]);

    const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
        // Changing the loan invalidates a duplicate confirmation given for the
        // previous figures.
        if (["memberId", "principal", "disbursedAt"].includes(key)) {
            setDuplicateWarning(null);
            setConfirmDuplicate(false);
        }
    };

    const memberOptions = useMemo(
        () => members.map((member) => ({
            value: member.id,
            label: member.full_name,
            secondary: member.member_no || undefined
        })),
        [members]
    );

    const principal = digits(form.principal);
    const monthlyRate = Number(form.monthlyRate) || 0;
    const termMonths = Math.round(Number(form.termMonths) || 0);

    const problems = [
        !form.memberId && "Choose the member.",
        principal <= 0 && "Enter the amount that was paid out.",
        monthlyRate <= 0 && "Enter the monthly interest rate.",
        termMonths <= 0 && "Enter the term in months.",
        !form.disbursedAt && "Enter the date the money was paid out.",
        form.disbursedAt > today() && "The payout date cannot be in the future.",
        form.firstDueDate && form.disbursedAt && form.firstDueDate <= form.disbursedAt
            && "The first repayment date must be after the payout date.",
        form.reason.trim().length < 5 && "Say why this loan is being entered late."
    ].filter(Boolean) as string[];

    const chooseProduct = (productId: string) => {
        const product = products.find((entry) => entry.id === productId);
        setForm((current) => ({
            ...current,
            productId,
            // The product only prefills the rate; the officer enters what was
            // actually agreed, which for an old loan may not be today's tier.
            monthlyRate: product ? String(annualToMonthlyRate(product.annual_interest_rate)) : current.monthlyRate
        }));
    };

    const submit = async () => {
        if (!tenantId || problems.length) return;
        setSaving(true);
        setError(null);
        try {
            const { data } = await api.post<{ data: RecordedHistoricalLoan }>(endpoints.imports.historicalLoanEntry(), {
                member_id: form.memberId,
                principal_amount: principal,
                monthly_interest_rate: monthlyRate,
                term_months: termMonths,
                disbursed_at: form.disbursedAt,
                first_due_date: form.firstDueDate || undefined,
                repayment_frequency: form.frequency,
                reference: form.reference.trim() || undefined,
                reason: form.reason.trim(),
                confirm_duplicate: confirmDuplicate || undefined
            });
            onRecorded(data.data);
        } catch (caught) {
            if (getApiErrorCode(caught) === "HISTORICAL_LOAN_POSSIBLE_DUPLICATE") {
                setDuplicateWarning(getApiErrorMessage(caught));
            } else {
                setError(getApiErrorMessage(caught));
            }
        } finally {
            setSaving(false);
        }
    };

    const selectedMember = members.find((member) => member.id === form.memberId);

    return (
        <MotionModal open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Record a past loan</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2}>
                    <Alert severity="warning" variant="outlined">
                        For a loan that was already paid out but never entered. It is booked on the payout date,
                        skips appraisal and approval, and is recorded against your name with the reason you give.
                        Use the normal application for anything not yet paid out.
                    </Alert>

                    <SearchableSelect
                        label="Member"
                        value={form.memberId}
                        options={memberOptions}
                        onChange={(value) => set("memberId", value)}
                        placeholder="Search by name or member number"
                    />

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Amount paid out"
                                fullWidth
                                inputMode="numeric"
                                value={form.principal}
                                onChange={(event) => set("principal", event.target.value)}
                                helperText={principal > 0 ? formatCurrency(principal) : " "}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Date paid out"
                                type="date"
                                fullWidth
                                value={form.disbursedAt}
                                onChange={(event) => set("disbursedAt", event.target.value)}
                                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today() } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                select
                                label="Loan product (fills the rate)"
                                fullWidth
                                value={form.productId}
                                onChange={(event) => chooseProduct(event.target.value)}
                            >
                                <MenuItem value="">—</MenuItem>
                                {products.map((product) => (
                                    <MenuItem key={product.id} value={product.id}>{product.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Interest % per month"
                                fullWidth
                                inputMode="decimal"
                                value={form.monthlyRate}
                                onChange={(event) => set("monthlyRate", event.target.value)}
                                helperText={principal > 0 && monthlyRate > 0
                                    ? `${formatCurrency(principal * monthlyRate / 100)} in the first month`
                                    : " "}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="Term (months)"
                                fullWidth
                                inputMode="numeric"
                                value={form.termMonths}
                                onChange={(event) => set("termMonths", event.target.value)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                select
                                label="Repayment"
                                fullWidth
                                value={form.frequency}
                                onChange={(event) => set("frequency", event.target.value as typeof form.frequency)}
                            >
                                <MenuItem value="monthly">Monthly</MenuItem>
                                <MenuItem value="weekly">Weekly</MenuItem>
                                <MenuItem value="daily">Daily</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="First repayment (optional)"
                                type="date"
                                fullWidth
                                value={form.firstDueDate}
                                onChange={(event) => set("firstDueDate", event.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }}
                                helperText="Blank: one period after payout"
                            />
                        </Grid>
                    </Grid>

                    <TextField
                        label="Reference on the original paperwork (optional)"
                        fullWidth
                        value={form.reference}
                        onChange={(event) => set("reference", event.target.value)}
                        helperText="Entering the same reference twice is refused, so a slip or voucher number protects against double entry."
                    />

                    <TextField
                        label="Why is this being entered now?"
                        fullWidth
                        multiline
                        minRows={2}
                        value={form.reason}
                        onChange={(event) => set("reason", event.target.value)}
                        placeholder="e.g. Paid out at the branch on 15 August; the entry was missed."
                    />

                    {duplicateWarning ? (
                        <Alert severity="error">
                            <Typography variant="body2" sx={{ mb: 1 }}>{duplicateWarning}</Typography>
                            <FormControlLabel
                                control={<Checkbox checked={confirmDuplicate} onChange={(event) => setConfirmDuplicate(event.target.checked)} />}
                                label="This is a separate loan — record it anyway"
                            />
                        </Alert>
                    ) : null}

                    {error ? <Alert severity="error">{error}</Alert> : null}

                    {selectedMember && principal > 0 && form.disbursedAt && !problems.length ? (
                        <Box sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 2 }}>
                            <Typography variant="body2">
                                {formatCurrency(principal)} to <strong>{selectedMember.full_name}</strong> on {form.disbursedAt},
                                {" "}{monthlyRate}% a month over {termMonths} month(s).
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Interest for the months already passed is added straight away, and the loan shows as
                                in arrears if repayments that fell due have not been recorded.
                            </Typography>
                        </Box>
                    ) : problems.length && (form.memberId || form.principal) ? (
                        <Typography variant="caption" color="text.secondary">{problems[0]}</Typography>
                    ) : null}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={saving}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={() => void submit()}
                    disabled={saving || Boolean(problems.length) || (Boolean(duplicateWarning) && !confirmDuplicate)}
                >
                    {saving ? "Recording..." : "Record loan"}
                </Button>
            </DialogActions>
        </MotionModal>
    );
}
