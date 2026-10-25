import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import {
    Alert,
    Autocomplete,
    Button,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
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
import type { Member } from "../types/api";
import { MotionCard } from "../ui/motion";
import { formatCurrency, formatDate } from "../utils/format";

interface Option {
    code: string;
    label: string;
}

interface ComplaintRow {
    id: string;
    member_id: string | null;
    member_no: string | null;
    complainant: string | null;
    nature: string;
    nature_label: string;
    summary: string;
    value_amount: number;
    received_on: string;
    resolved_on: string | null;
    resolved_by: string | null;
    referred_to: string | null;
    resolution_notes: string | null;
    open: boolean;
}

interface RegisterResponse {
    natures: Option[];
    referrals: Option[];
    complaints: ComplaintRow[];
    open_count: number;
}

const EMPTY_FORM = {
    member_id: "",
    complainant_name: "",
    nature: "repayments",
    summary: "",
    value_amount: "0",
    received_on: new Date().toISOString().slice(0, 10),
    resolved_on: "",
    resolved_by: "institution",
    referred_to: "",
    resolution_notes: ""
};

/// The complaints register behind MSP3_10.
///
/// The Commission reads that return as a consumer protection measure: how
/// many complaints came in, how many the SACCOS settled itself, and how many
/// its members had to take to the Bank of Tanzania, TCDC, the Fair
/// Competition Commission or the courts. None of it existed before, so this
/// is where a complaint gets written down in the first place.
export function TcdcComplaintsPage() {
    const { pushToast } = useToast();

    const [data, setData] = useState<RegisterResponse | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<ComplaintRow | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [register, memberList] = await Promise.all([
                api.get<{ data: RegisterResponse }>(endpoints.tcdcReturns.complaintRegister()),
                api.get<{ data: Member[] }>(endpoints.members.list(), { params: { page_size: 500 } })
            ]);
            setData(register.data.data);
            setMembers(memberList.data.data || []);
        } catch (loadError) {
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const startNew = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setOpen(true);
    };

    const startEdit = (row: ComplaintRow) => {
        setEditing(row);
        setForm({
            member_id: row.member_id ?? "",
            complainant_name: row.member_id ? "" : (row.complainant ?? ""),
            nature: row.nature,
            summary: row.summary,
            value_amount: String(row.value_amount),
            received_on: row.received_on,
            resolved_on: row.resolved_on ?? "",
            resolved_by: row.resolved_by ?? "institution",
            referred_to: row.referred_to ?? "",
            resolution_notes: row.resolution_notes ?? ""
        });
        setOpen(true);
    };

    const save = async () => {
        setSaving(true);
        try {
            const payload = {
                member_id: form.member_id || null,
                complainant_name: form.member_id ? null : form.complainant_name.trim() || null,
                nature: form.nature,
                summary: form.summary.trim(),
                value_amount: Number(form.value_amount) || 0,
                received_on: form.received_on,
                resolved_on: form.resolved_on || null,
                resolved_by: form.resolved_on ? form.resolved_by : null,
                // A settled complaint is not sitting with anybody — the sheet
                // counts referrals among the unresolved only.
                referred_to: form.resolved_on ? null : (form.referred_to || null),
                resolution_notes: form.resolution_notes.trim() || null
            };
            if (editing) {
                await api.patch(endpoints.tcdcReturns.updateComplaint(editing.id), payload);
            } else {
                await api.post(endpoints.tcdcReturns.complaintRegister(), payload);
            }
            setOpen(false);
            await load();
        } catch (saveError) {
            pushToast({ type: "error", title: "Unable to save the complaint", message: getApiErrorMessage(saveError) });
        } finally {
            setSaving(false);
        }
    };

    if (loading && !data) {
        return <AppLoader message="Loading the complaints register" />;
    }

    const selectedMember = members.find((member) => member.id === form.member_id) ?? null;

    return (
        <Stack spacing={2}>
            {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}

            <MotionCard variant="outlined" inView>
                <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" spacing={1.5}>
                        <Stack spacing={0.5}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <SupportAgentRoundedIcon color="primary" />
                                <Typography variant="h5">Complaints</Typography>
                                {data ? <Chip size="small" color={data.open_count ? "warning" : "default"} label={`${data.open_count} open`} /> : null}
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                                Every complaint, what it was about, who settled it, and where it went if nobody did.
                                MSP3_10 is counted from this register.
                            </Typography>
                        </Stack>
                        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={startNew}>
                            Record a complaint
                        </Button>
                    </Stack>
                </CardContent>
            </MotionCard>

            <MotionCard variant="outlined" inView>
                <CardContent>
                    <TableContainer sx={{ overflowX: "auto" }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Received</TableCell>
                                    <TableCell>Complainant</TableCell>
                                    <TableCell>Nature</TableCell>
                                    <TableCell>Summary</TableCell>
                                    <TableCell align="right">Value</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data?.complaints.map((row) => (
                                    <TableRow key={row.id} hover selected={row.open}>
                                        <TableCell>{formatDate(row.received_on)}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{row.complainant || "—"}</Typography>
                                            {row.member_no ? (
                                                <Typography variant="caption" color="text.secondary">{row.member_no}</Typography>
                                            ) : null}
                                        </TableCell>
                                        <TableCell>{row.nature_label}</TableCell>
                                        <TableCell sx={{ maxWidth: 320 }}>
                                            <Typography variant="body2">{row.summary}</Typography>
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                                            {row.value_amount ? formatCurrency(row.value_amount) : "—"}
                                        </TableCell>
                                        <TableCell>
                                            {row.open ? (
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                    <Chip size="small" color="warning" variant="outlined" label="Open" />
                                                    {row.referred_to ? (
                                                        <Chip
                                                            size="small"
                                                            color="error"
                                                            variant="outlined"
                                                            label={(data.referrals.find((entry) => entry.code === row.referred_to) || {}).label ?? row.referred_to}
                                                        />
                                                    ) : null}
                                                </Stack>
                                            ) : (
                                                <Chip
                                                    size="small"
                                                    color="success"
                                                    variant="outlined"
                                                    label={row.resolved_by === "other_party" ? "Settled elsewhere" : "Settled by us"}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button size="small" onClick={() => startEdit(row)}>Edit</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {data && !data.complaints.length ? (
                                    <TableRow>
                                        <TableCell colSpan={7}>
                                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                                                No complaints recorded. MSP3_10 will file as nil until one is.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : null}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </MotionCard>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editing ? "Edit complaint" : "Record a complaint"}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={1.5} sx={{ mt: 0.25 }}>
                        <Grid size={{ xs: 12 }}>
                            <Autocomplete
                                size="small"
                                options={members}
                                getOptionLabel={(option) => `${option.full_name} (${option.member_no})`}
                                value={selectedMember}
                                onChange={(_, next) => setForm({ ...form, member_id: next ? next.id : "" })}
                                renderInput={(params) => <TextField {...params} label="Member (optional)" />}
                            />
                        </Grid>
                        {!form.member_id ? (
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Complainant name"
                                    helperText="A complaint can come from someone who has already left the register."
                                    value={form.complainant_name}
                                    onChange={(event) => setForm({ ...form, complainant_name: event.target.value })}
                                />
                            </Grid>
                        ) : null}
                        <Grid size={{ xs: 12, sm: 7 }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Nature"
                                value={form.nature}
                                onChange={(event) => setForm({ ...form, nature: event.target.value })}
                            >
                                {(data?.natures ?? []).map((nature) => (
                                    <MenuItem key={nature.code} value={nature.code}>{nature.label}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 5 }}>
                            <TextField
                                fullWidth
                                size="small"
                                type="date"
                                label="Received on"
                                InputLabelProps={{ shrink: true }}
                                value={form.received_on}
                                onChange={(event) => setForm({ ...form, received_on: event.target.value })}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                multiline
                                minRows={2}
                                size="small"
                                label="What the complaint is about"
                                value={form.summary}
                                onChange={(event) => setForm({ ...form, summary: event.target.value })}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Value (TZS)"
                                helperText="Nil where it is about process, not money."
                                value={form.value_amount}
                                onChange={(event) => setForm({ ...form, value_amount: event.target.value })}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                size="small"
                                type="date"
                                label="Resolved on"
                                InputLabelProps={{ shrink: true }}
                                value={form.resolved_on}
                                onChange={(event) => setForm({ ...form, resolved_on: event.target.value })}
                            />
                        </Grid>
                        {form.resolved_on ? (
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Settled by"
                                    value={form.resolved_by}
                                    onChange={(event) => setForm({ ...form, resolved_by: event.target.value })}
                                >
                                    <MenuItem value="institution">The SACCOS</MenuItem>
                                    <MenuItem value="other_party">Another party (courts, TCDC…)</MenuItem>
                                </TextField>
                            </Grid>
                        ) : (
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Referred to (if escalated)"
                                    value={form.referred_to}
                                    onChange={(event) => setForm({ ...form, referred_to: event.target.value })}
                                >
                                    <MenuItem value=""><em>Not referred</em></MenuItem>
                                    {(data?.referrals ?? []).map((referral) => (
                                        <MenuItem key={referral.code} value={referral.code}>{referral.label}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        )}
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                multiline
                                minRows={2}
                                size="small"
                                label="Resolution notes"
                                value={form.resolution_notes}
                                onChange={(event) => setForm({ ...form, resolution_notes: event.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        disabled={
                            saving
                            || !form.summary.trim()
                            || !form.received_on
                            || (!form.member_id && !form.complainant_name.trim())
                        }
                        onClick={save}
                    >
                        {saving ? "Saving…" : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}
