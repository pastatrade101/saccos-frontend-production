import { useCallback, useEffect, useState } from "react";
import {
    Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, Typography
} from "@mui/material";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";

import { api, getApiErrorMessage } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";
import { useToast } from "../Toast";
import { formatDate } from "../../utils/format";

export interface AgmBoard {
    event: {
        id: string;
        title: string;
        event_date: string;
        start_time?: string | null;
        venue?: string | null;
        description?: string | null;
        rsvp_open: boolean;
    } | null;
    my_response: { status: "attending" | "not_attending"; responded_at: string; recorded_on_behalf: boolean } | null;
    counts: {
        total_members: number;
        attending: number;
        not_attending: number;
        no_response: number;
    } | null;
    attending: Array<{ member_id: string; full_name: string; member_no: string | null; recorded_on_behalf: boolean }>;
    not_attending: Array<{ member_id: string; full_name: string; member_no: string | null; recorded_on_behalf: boolean }>;
}

/**
 * The meeting, the member's own answer, and who else is coming.
 *
 * The list of names is there because the SACCOS asked for it, and because it
 * is what a member actually weighs: whether to travel depends partly on who
 * else will be in the room. A register nobody can see is a register nobody
 * trusts — and a count with no names behind it is a number to argue with.
 *
 * Nothing financial appears here. Attendance is the whole of it.
 */
export function AgmAttendanceCard({
    tenantId,
    tr
}: {
    tenantId: string;
    tr: (english: string, swahili: string) => string;
}) {
    const { pushToast } = useToast();
    const [board, setBoard] = useState<AgmBoard | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showNames, setShowNames] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get<{ data: AgmBoard }>(endpoints.agm.board(), {
                params: { tenant_id: tenantId }
            });
            setBoard(data.data);
        } catch {
            setBoard(null);
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        void load();
    }, [load]);

    const respond = async (status: "attending" | "not_attending") => {
        if (!board?.event) return;
        setSaving(true);
        try {
            const { data } = await api.post<{ data: AgmBoard }>(
                endpoints.agm.responses(board.event.id),
                { tenant_id: tenantId, status }
            );
            setBoard(data.data);
            pushToast({
                type: "success",
                title: status === "attending"
                    ? tr("You are on the list", "Umo kwenye orodha")
                    : tr("Noted", "Imepokelewa"),
                message: status === "attending"
                    ? tr("The SACCOS will plan for you.", "Chama kitakupangia nafasi.")
                    : tr("You can change this any time before the meeting.", "Unaweza kubadilisha wakati wowote kabla ya mkutano.")
            });
        } catch (error) {
            pushToast({ type: "error", title: tr("Could not save", "Imeshindikana"), message: getApiErrorMessage(error) });
        } finally {
            setSaving(false);
        }
    };

    if (loading || !board?.event) {
        return null;
    }

    const { event, counts, my_response: mine } = board;
    const attending = mine?.status === "attending";
    const declined = mine?.status === "not_attending";

    return (
        <Card variant="outlined" sx={{ borderRadius: "var(--m-radius-card)" }}>
            <CardContent sx={{ p: { xs: 2, md: 2.25 }, "&:last-child": { pb: { xs: 2, md: 2.25 } } }}>
                <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.25} alignItems="flex-start">
                        <EventAvailableRoundedIcon sx={{ color: "var(--m-gold-ink)", mt: 0.25 }} />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>{event.title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {formatDate(event.event_date)}
                                {event.start_time ? ` · ${event.start_time}` : ""}
                                {event.venue ? ` · ${event.venue}` : ""}
                            </Typography>
                        </Box>
                        {mine ? (
                            <Chip
                                size="small"
                                color={attending ? "success" : "default"}
                                variant={attending ? "filled" : "outlined"}
                                label={attending
                                    ? tr("You are attending", "Utahudhuria")
                                    : tr("You are not attending", "Hutahudhuria")}
                            />
                        ) : null}
                    </Stack>

                    {event.description ? (
                        <Typography variant="body2" color="text.secondary">{event.description}</Typography>
                    ) : null}

                    {/* Recorded by the office, not by them. Said plainly, because
                        a member who finds themselves on a list they never joined
                        must be able to see how they got there. */}
                    {mine?.recorded_on_behalf ? (
                        <Alert severity="info" variant="outlined" sx={{ py: 0.35 }}>
                            {tr(
                                "The SACCOS office recorded this answer for you. You can change it yourself below.",
                                "Ofisi ya chama ndiyo iliyojibu kwa niaba yako. Unaweza kubadilisha mwenyewe hapa chini."
                            )}
                        </Alert>
                    ) : null}

                    {event.rsvp_open ? (
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Button
                                variant={attending ? "contained" : "outlined"}
                                color="success"
                                disabled={saving}
                                onClick={() => void respond("attending")}
                            >
                                {tr("I will attend", "Nitahudhuria")}
                            </Button>
                            <Button
                                variant={declined ? "contained" : "outlined"}
                                color="inherit"
                                disabled={saving}
                                onClick={() => void respond("not_attending")}
                            >
                                {tr("I cannot attend", "Siwezi kuhudhuria")}
                            </Button>
                        </Stack>
                    ) : (
                        <Alert severity="info" variant="outlined" sx={{ py: 0.35 }}>
                            {tr("Responses for this meeting are closed.", "Majibu ya mkutano huu yamefungwa.")}
                        </Alert>
                    )}

                    {counts ? (
                        <>
                            <Divider />
                            <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
                                {[
                                    [tr("Attending", "Watahudhuria"), counts.attending, "success.main"],
                                    [tr("Not attending", "Hawatahudhuria"), counts.not_attending, "text.primary"],
                                    // Counted apart from a refusal on purpose: for a
                                    // meeting that needs a quorum, silence and "no"
                                    // are different problems.
                                    [tr("Not answered yet", "Hawajajibu"), counts.no_response, "warning.main"]
                                ].map(([label, value, color]) => (
                                    <Box key={String(label)} sx={{ minWidth: 104 }}>
                                        <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }} color={color as string}>
                                            {String(value)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                                    </Box>
                                ))}
                                <Box sx={{ minWidth: 104 }}>
                                    <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }} color="text.secondary">
                                        {counts.total_members}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {tr("Members in total", "Wanachama wote")}
                                    </Typography>
                                </Box>
                            </Stack>

                            {board.attending.length ? (
                                <>
                                    <Button
                                        size="small"
                                        variant="text"
                                        sx={{ alignSelf: "flex-start", px: 0.5 }}
                                        onClick={() => setShowNames((current) => !current)}
                                    >
                                        {showNames
                                            ? tr("Hide who is coming", "Ficha wanaokuja")
                                            : tr(`See who is coming (${board.attending.length})`, `Ona wanaokuja (${board.attending.length})`)}
                                    </Button>
                                    {showNames ? (
                                        <Stack spacing={0.25} sx={{ maxHeight: 260, overflowY: "auto", pr: 0.5 }}>
                                            {board.attending.map((row) => (
                                                <Stack key={row.member_id} direction="row" spacing={1} justifyContent="space-between">
                                                    <Typography variant="body2">{row.full_name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{row.member_no}</Typography>
                                                </Stack>
                                            ))}
                                        </Stack>
                                    ) : null}
                                </>
                            ) : null}
                        </>
                    ) : null}
                </Stack>
            </CardContent>
        </Card>
    );
}
