import WhatshotRoundedIcon from "@mui/icons-material/WhatshotRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import {
    Alert,
    Box,
    Button,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
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

import { useAuth } from "../auth/AuthContext";
import { AppLoader } from "../components/AppLoader";
import { useToast } from "../components/Toast";
import { api, getApiErrorMessage } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import type {
    WeeklyChallenge,
    WeeklyChallengeBulkRegisterResult,
    WeeklyChallengeStandings
} from "../types/api";
import { MotionCard } from "../ui/motion";
import { formatCurrency, formatDate } from "../utils/format";

interface ApiEnvelope<T> {
    data: T;
}

const STATUS_COLOR: Record<WeeklyChallenge["status"], "default" | "info" | "success" | "warning" | "error"> = {
    draft: "default",
    registration_open: "info",
    active: "success",
    completed: "success",
    cancelled: "error"
};

/// A trophy for every participant once the challenge is over — 1st/2nd/3rd
/// get the numbered medal, everyone else who finished gets a plain trophy for
/// having competed. Null before completion: standings are still moving, and a
/// trophy on an in-progress rank would read as decided when it is not.
function trophyFor(status: WeeklyChallenge["status"], rank: number): string | null {
    if (status !== "completed") return null;
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "🏆";
}

const EMPTY_FORM = {
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    minimum_daily_deposit: "300000",
    minimum_participants: "5",
    gold_reward_amount: "150000",
    silver_reward_amount: "100000",
    bronze_reward_amount: "50000"
};

/// Configures and runs a time-boxed savings-deposit competition.
///
/// Distinct from the tier-based Savings League (/leagues) elsewhere in this
/// app: that one ranks members by their total balance and never expires. A
/// Weekly Challenge is a recurring instance — register, deposit daily, get
/// eliminated or win, trophy at the end.
export function WeeklyChallengesPage() {
    const { profile } = useAuth();
    const { pushToast } = useToast();

    const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [creating, setCreating] = useState(false);

    const [selected, setSelected] = useState<WeeklyChallenge | null>(null);
    const [standings, setStandings] = useState<WeeklyChallengeStandings | null>(null);
    const [standingsLoading, setStandingsLoading] = useState(false);

    const [bulkText, setBulkText] = useState("");
    const [bulkPreview, setBulkPreview] = useState<WeeklyChallengeBulkRegisterResult | null>(null);
    const [bulkBusy, setBulkBusy] = useState(false);

    const canManage = profile?.role === "super_admin" || profile?.role === "branch_manager" || profile?.role === "treasury_officer";

    const loadChallenges = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get<ApiEnvelope<WeeklyChallenge[]>>(endpoints.weeklyChallenges.list());
            setChallenges(data.data || []);
        } catch (loadError) {
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadChallenges();
    }, [loadChallenges]);

    const loadStandings = useCallback(async (challenge: WeeklyChallenge) => {
        setStandingsLoading(true);
        try {
            const { data } = await api.get<ApiEnvelope<WeeklyChallengeStandings>>(endpoints.weeklyChallenges.standings(challenge.id));
            setStandings(data.data);
        } catch (loadError) {
            pushToast({ type: "error", title: "Unable to load standings", message: getApiErrorMessage(loadError) });
        } finally {
            setStandingsLoading(false);
        }
    }, [pushToast]);

    const openChallenge = (challenge: WeeklyChallenge) => {
        setSelected(challenge);
        setBulkText("");
        setBulkPreview(null);
        void loadStandings(challenge);
    };

    const createChallenge = async () => {
        setCreating(true);
        try {
            await api.post(endpoints.weeklyChallenges.create(), {
                name: form.name.trim(),
                description: form.description.trim() || null,
                start_date: form.start_date,
                end_date: form.end_date,
                minimum_daily_deposit: Number(form.minimum_daily_deposit),
                minimum_participants: Number(form.minimum_participants),
                gold_reward_amount: Number(form.gold_reward_amount),
                silver_reward_amount: Number(form.silver_reward_amount),
                bronze_reward_amount: Number(form.bronze_reward_amount)
            });
            pushToast({ type: "success", title: "Weekly Challenge created", message: `${form.name} was saved as a draft.` });
            setCreateOpen(false);
            setForm(EMPTY_FORM);
            await loadChallenges();
        } catch (createError) {
            pushToast({ type: "error", title: "Unable to create the challenge", message: getApiErrorMessage(createError) });
        } finally {
            setCreating(false);
        }
    };

    const openRegistration = async (challenge: WeeklyChallenge) => {
        try {
            await api.post(endpoints.weeklyChallenges.openRegistration(challenge.id));
            pushToast({
                type: "success",
                title: "Registration opened",
                message: "Every member was notified. Registration closes automatically when the challenge starts."
            });
            await loadChallenges();
            if (selected?.id === challenge.id) openChallenge({ ...challenge, status: "registration_open" });
        } catch (openError) {
            pushToast({ type: "error", title: "Unable to open registration", message: getApiErrorMessage(openError) });
        }
    };

    const parsedMemberNos = bulkText
        .split(/[\s,;\n]+/)
        .map((entry) => entry.trim())
        .filter(Boolean);

    const previewBulk = async () => {
        if (!selected || !parsedMemberNos.length) return;
        setBulkBusy(true);
        try {
            const { data } = await api.post<ApiEnvelope<WeeklyChallengeBulkRegisterResult>>(
                endpoints.weeklyChallenges.bulkRegister(selected.id),
                { member_nos: parsedMemberNos, dry_run: true }
            );
            setBulkPreview(data.data);
        } catch (previewError) {
            pushToast({ type: "error", title: "Unable to preview registration", message: getApiErrorMessage(previewError) });
        } finally {
            setBulkBusy(false);
        }
    };

    const confirmBulk = async () => {
        if (!selected || !parsedMemberNos.length) return;
        setBulkBusy(true);
        try {
            const { data } = await api.post<ApiEnvelope<WeeklyChallengeBulkRegisterResult>>(
                endpoints.weeklyChallenges.bulkRegister(selected.id),
                { member_nos: parsedMemberNos, dry_run: false }
            );
            pushToast({
                type: "success",
                title: "Members registered",
                message: `${data.data.registered.length} registered, ${data.data.already_registered.length} already in, ${data.data.skipped.length} skipped.`
            });
            setBulkText("");
            setBulkPreview(null);
            await loadChallenges();
            await loadStandings(selected);
        } catch (confirmError) {
            pushToast({ type: "error", title: "Unable to register members", message: getApiErrorMessage(confirmError) });
        } finally {
            setBulkBusy(false);
        }
    };

    const withdrawParticipant = async (memberId: string) => {
        if (!selected) return;
        try {
            await api.delete(endpoints.weeklyChallenges.withdrawParticipant(selected.id, memberId));
            pushToast({ type: "success", title: "Participant withdrawn", message: "" });
            await loadStandings(selected);
            await loadChallenges();
        } catch (withdrawError) {
            pushToast({ type: "error", title: "Unable to withdraw the participant", message: getApiErrorMessage(withdrawError) });
        }
    };

    if (loading) {
        return <AppLoader message="Loading Weekly Challenges" />;
    }

    return (
        <Stack spacing={2}>
            {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}

            <MotionCard variant="outlined" inView>
                <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" spacing={1.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <WhatshotRoundedIcon color="primary" />
                            <Typography variant="h5">Weekly Challenge</Typography>
                        </Stack>
                        {canManage ? (
                            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)}>
                                New challenge
                            </Button>
                        ) : null}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        A time-boxed savings-deposit competition — distinct from Savings Leagues. Register members, then watch the daily leaderboard until the trophy is decided.
                    </Typography>
                </CardContent>
            </MotionCard>

            <MotionCard variant="outlined" inView>
                <CardContent>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Period</TableCell>
                                    <TableCell align="right">Minimum / day</TableCell>
                                    <TableCell align="right">Participants</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {challenges.map((challenge) => (
                                    <TableRow key={challenge.id} hover selected={selected?.id === challenge.id}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{challenge.name}</Typography>
                                        </TableCell>
                                        <TableCell>{formatDate(challenge.start_date)} – {formatDate(challenge.end_date)}</TableCell>
                                        <TableCell align="right">{formatCurrency(challenge.minimum_daily_deposit)}</TableCell>
                                        <TableCell align="right">
                                            {challenge.participant_count} / {challenge.minimum_participants}
                                        </TableCell>
                                        <TableCell>
                                            <Chip size="small" color={STATUS_COLOR[challenge.status]} label={challenge.status.replace(/_/g, " ")} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                {canManage && challenge.status === "draft" ? (
                                                    <Button size="small" variant="outlined" onClick={() => openRegistration(challenge)}>
                                                        Open registration
                                                    </Button>
                                                ) : null}
                                                <Button size="small" onClick={() => openChallenge(challenge)}>
                                                    Manage
                                                </Button>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!challenges.length ? (
                                    <TableRow>
                                        <TableCell colSpan={6}>
                                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                                                No Weekly Challenges yet.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : null}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </MotionCard>

            {selected ? (
                <MotionCard variant="outlined" inView>
                    <CardContent>
                        <Stack spacing={2}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Stack spacing={0.25}>
                                    <Typography variant="h6">{selected.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {formatDate(selected.start_date)} – {formatDate(selected.end_date)} · minimum {formatCurrency(selected.minimum_daily_deposit)}/day · quorum {selected.minimum_participants}
                                    </Typography>
                                    <Stack direction="row" spacing={0.75} sx={{ mt: 0.5 }}>
                                        <Chip size="small" icon={<EmojiEventsRoundedIcon sx={{ fontSize: 16 }} />} label={`Gold ${formatCurrency(selected.gold_reward_amount)}`} />
                                        <Chip size="small" label={`Silver ${formatCurrency(selected.silver_reward_amount)}`} />
                                        <Chip size="small" label={`Bronze ${formatCurrency(selected.bronze_reward_amount)}`} />
                                    </Stack>
                                </Stack>
                                <IconButton size="small" onClick={() => setSelected(null)}><CloseRoundedIcon /></IconButton>
                            </Stack>

                            {canManage && ["draft", "registration_open"].includes(selected.status) ? (
                                <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                                    <Typography variant="subtitle2" gutterBottom>Register members</Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Paste member numbers (one per line, or separated by commas/spaces) — from a WhatsApp or paper sign-up list.
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={3}
                                        placeholder={"ILS24-F00001\nILS24-F00002\nILS24-F00003"}
                                        value={bulkText}
                                        onChange={(event) => { setBulkText(event.target.value); setBulkPreview(null); }}
                                        sx={{ mb: 1.5 }}
                                    />
                                    <Stack direction="row" spacing={1}>
                                        <Button variant="outlined" disabled={!parsedMemberNos.length || bulkBusy} onClick={previewBulk}>
                                            Preview ({parsedMemberNos.length})
                                        </Button>
                                        <Button variant="contained" disabled={!bulkPreview || bulkBusy} onClick={confirmBulk}>
                                            {bulkBusy ? "Registering…" : "Confirm registration"}
                                        </Button>
                                    </Stack>

                                    {bulkPreview ? (
                                        <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                                            <Typography variant="body2" color="success.main">
                                                {bulkPreview.registered.length} will be registered: {bulkPreview.registered.map((m) => m.full_name || m.member_no).join(", ") || "—"}
                                            </Typography>
                                            {bulkPreview.already_registered.length ? (
                                                <Typography variant="body2" color="text.secondary">
                                                    Already registered: {bulkPreview.already_registered.map((m) => m.full_name || m.member_no).join(", ")}
                                                </Typography>
                                            ) : null}
                                            {bulkPreview.skipped.length ? (
                                                <Typography variant="body2" color="warning.main">
                                                    Skipped: {bulkPreview.skipped.map((m) => `${m.member_no || m.requested} (${m.reason})`).join(", ")}
                                                </Typography>
                                            ) : null}
                                        </Stack>
                                    ) : null}
                                </Box>
                            ) : null}

                            {standingsLoading || !standings ? (
                                <Typography variant="body2" color="text.secondary">Loading standings…</Typography>
                            ) : (
                                <Box sx={{ overflowX: "auto" }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>#</TableCell>
                                                <TableCell>Member</TableCell>
                                                {standings.days.map((day) => (
                                                    <TableCell key={day.date} align="center">{formatDate(day.date)}</TableCell>
                                                ))}
                                                <TableCell align="right">Days won</TableCell>
                                                <TableCell align="right">Status</TableCell>
                                                {canManage ? <TableCell /> : null}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {standings.rows.map((row) => (
                                                <TableRow key={row.member_id} hover>
                                                    <TableCell>
                                                        {row.rank}
                                                        {trophyFor(selected.status, row.rank) ? ` ${trophyFor(selected.status, row.rank)}` : ""}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">{row.full_name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{row.member_no}</Typography>
                                                    </TableCell>
                                                    {row.daily_status.map((cell) => (
                                                        <TableCell key={cell.date} align="center">
                                                            {cell.deposited_amount > 0 || cell.date <= (standings.days.find((d) => d.closed)?.date || "")
                                                                ? (cell.qualified ? "✅" : "❌")
                                                                : "—"}
                                                        </TableCell>
                                                    ))}
                                                    <TableCell align="right">{row.days_won}</TableCell>
                                                    <TableCell align="right">
                                                        {row.eliminated ? <Chip size="small" color="error" variant="outlined" label="Eliminated" /> : <Chip size="small" color="success" variant="outlined" label="In it" />}
                                                    </TableCell>
                                                    {canManage ? (
                                                        <TableCell align="right">
                                                            <Button size="small" color="error" onClick={() => withdrawParticipant(row.member_id)}>Remove</Button>
                                                        </TableCell>
                                                    ) : null}
                                                </TableRow>
                                            ))}
                                            {!standings.rows.length ? (
                                                <TableRow>
                                                    <TableCell colSpan={20}>
                                                        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                                                            No participants registered yet.
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : null}
                                        </TableBody>
                                    </Table>
                                </Box>
                            )}
                        </Stack>
                    </CardContent>
                </MotionCard>
            ) : null}

            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>New Weekly Challenge</DialogTitle>
                <DialogContent>
                    <Grid container spacing={1.5} sx={{ mt: 0.25 }}>
                        <Grid size={{ xs: 12 }}>
                            <TextField fullWidth label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField fullWidth multiline minRows={2} label="Description / rules (shown to members)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField fullWidth type="date" label="Start date" InputLabelProps={{ shrink: true }} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField fullWidth type="date" label="End date" InputLabelProps={{ shrink: true }} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField fullWidth type="number" label="Minimum daily deposit (TZS)" value={form.minimum_daily_deposit} onChange={(e) => setForm({ ...form, minimum_daily_deposit: e.target.value })} />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField fullWidth type="number" label="Minimum participants" value={form.minimum_participants} onChange={(e) => setForm({ ...form, minimum_participants: e.target.value })} />
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                            <TextField fullWidth type="number" label="Gold (TZS)" value={form.gold_reward_amount} onChange={(e) => setForm({ ...form, gold_reward_amount: e.target.value })} />
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                            <TextField fullWidth type="number" label="Silver (TZS)" value={form.silver_reward_amount} onChange={(e) => setForm({ ...form, silver_reward_amount: e.target.value })} />
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                            <TextField fullWidth type="number" label="Bronze (TZS)" value={form.bronze_reward_amount} onChange={(e) => setForm({ ...form, bronze_reward_amount: e.target.value })} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        disabled={creating || !form.name.trim() || !form.start_date || !form.end_date}
                        onClick={createChallenge}
                    >
                        {creating ? "Creating…" : "Create as draft"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}
