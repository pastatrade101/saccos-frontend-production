import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    MenuItem,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import { api, getApiErrorMessage } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";
import { formatCurrency, formatDate } from "../../utils/format";
import { useToast } from "../Toast";

interface Nature {
    code: string;
    label: string;
}

interface MyComplaint {
    id: string;
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

/// Swahili for the Commission's categories. The regulator's own wording is
/// written for a filing; a member picking from a list needs the version they
/// would use themselves.
const NATURE_SW: Record<string, string> = {
    membership_exit: "Kujitoa uanachama",
    withdrawal_of_savings: "Kutoa akiba",
    repayments: "Marejesho ya mkopo",
    loan_statement: "Taarifa ya mkopo",
    loan_processing: "Kushughulikiwa kwa mkopo",
    election_process: "Uchaguzi",
    other: "Jambo lingine"
};

/// Where a member says something is wrong.
///
/// Kept to three fields. A member is not filling in a regulatory return —
/// they are raising a problem, and asking them to classify it the way TCDC
/// does is already one question more than they came to answer. Everything
/// else on the complaint is the SACCOS's to record afterwards.
export function ComplaintsCard({ tr }: { tr: (english: string, swahili: string) => string }) {
    const { pushToast } = useToast();

    const [natures, setNatures] = useState<Nature[]>([]);
    const [complaints, setComplaints] = useState<MyComplaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [nature, setNature] = useState("repayments");
    const [summary, setSummary] = useState("");
    const [amount, setAmount] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<{ data: { natures: Nature[]; complaints: MyComplaint[] } }>(
                endpoints.tcdcReturns.myComplaints()
            );
            setNatures(response.data.data.natures || []);
            setComplaints(response.data.data.complaints || []);
        } catch (loadError) {
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const send = async () => {
        setSending(true);
        try {
            await api.post(endpoints.tcdcReturns.myComplaints(), {
                nature,
                summary: summary.trim(),
                value_amount: Number(amount) || 0
            });
            setSummary("");
            setAmount("");
            pushToast({
                type: "success",
                title: tr("Sent", "Imetumwa"),
                message: tr("The SACCOS has it. You will see it below.", "Chama kimepokea. Utaliona hapa chini.")
            });
            await load();
        } catch (sendError) {
            pushToast({
                type: "error",
                title: tr("Could not send", "Imeshindikana"),
                message: getApiErrorMessage(sendError)
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <Card variant="outlined">
            <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <SupportAgentRoundedIcon color="primary" />
                    <Typography variant="h6">{tr("Raise a complaint", "Toa lalamiko")}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {tr(
                        "Tell the SACCOS what went wrong. Every complaint is logged and answered.",
                        "Eleza chama kilichokwenda vibaya. Kila lalamiko linaandikwa na kujibiwa."
                    )}
                </Typography>

                {error ? <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert> : null}

                <Stack spacing={1.5}>
                    <TextField
                        select
                        fullWidth
                        size="small"
                        label={tr("What is it about?", "Ni kuhusu nini?")}
                        value={nature}
                        onChange={(event) => setNature(event.target.value)}
                    >
                        {natures.map((entry) => (
                            <MenuItem key={entry.code} value={entry.code}>
                                {tr(entry.label, NATURE_SW[entry.code] || entry.label)}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        size="small"
                        label={tr("What happened?", "Nini kilitokea?")}
                        value={summary}
                        onChange={(event) => setSummary(event.target.value)}
                    />

                    <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label={tr("Amount involved (optional)", "Kiasi kinachohusika (si lazima)")}
                        helperText={tr(
                            "Leave it empty if no money is involved.",
                            "Acha wazi kama hakuna pesa inayohusika."
                        )}
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                    />

                    <Box>
                        <Button variant="contained" disabled={sending || !summary.trim()} onClick={send}>
                            {sending ? tr("Sending…", "Inatuma…") : tr("Send", "Tuma")}
                        </Button>
                    </Box>
                </Stack>

                {complaints.length ? (
                    <>
                        <Divider sx={{ my: 2.5 }} />
                        <Typography variant="subtitle2" gutterBottom>
                            {tr("What you have raised", "Uliyoyatoa")}
                        </Typography>
                        <Stack spacing={1.25}>
                            {complaints.map((complaint) => (
                                <Box
                                    key={complaint.id}
                                    sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
                                >
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {tr(complaint.nature_label, NATURE_SW[complaint.nature] || complaint.nature_label)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {complaint.summary}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {formatDate(complaint.received_on)}
                                                {complaint.value_amount ? ` · ${formatCurrency(complaint.value_amount)}` : ""}
                                            </Typography>
                                        </Stack>
                                        <Chip
                                            size="small"
                                            variant="outlined"
                                            color={complaint.open ? "warning" : "success"}
                                            label={complaint.open
                                                ? tr("Being handled", "Linashughulikiwa")
                                                : tr("Answered", "Limejibiwa")}
                                        />
                                    </Stack>
                                    {/* A member is entitled to read what was decided about their own
                                        complaint. Without this the status alone says it was dealt
                                        with, which is not the same as being told how. */}
                                    {complaint.resolution_notes ? (
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            <strong>{tr("Answer", "Jibu")}:</strong> {complaint.resolution_notes}
                                        </Typography>
                                    ) : null}
                                </Box>
                            ))}
                        </Stack>
                    </>
                ) : loading ? null : (
                    <>
                        <Divider sx={{ my: 2.5 }} />
                        <Typography variant="body2" color="text.secondary">
                            {tr("You have not raised anything.", "Hujatoa lalamiko lolote.")}
                        </Typography>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
