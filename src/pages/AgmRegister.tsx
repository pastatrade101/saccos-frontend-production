import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box, Button, Card, CardContent, Chip, Stack, TextField, Typography
} from "@mui/material";

import { DataTable, type Column } from "../components/DataTable";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";
import { api, getApiErrorMessage } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import { formatDate } from "../utils/format";

interface RegisterRow {
    member_id: string;
    full_name: string;
    member_no: string | null;
    phone: string | null;
    status: "attending" | "not_attending" | null;
    responded_at: string | null;
    recorded_on_behalf: boolean;
}

interface AgmEvent {
    id: string;
    title: string;
    event_date: string;
    venue?: string | null;
    rsvp_open: boolean;
}

/**
 * The attendance register, for the office to finish.
 *
 * Most of a SACCOS does not answer an app. The members least likely to open
 * one are often the ones most likely to attend — they are told about the
 * meeting at church, or by a neighbour, or they ring the branch — so a head
 * count taken from the app alone would cater for the wrong crowd.
 *
 * Unanswered members come first, because that is the list actually being
 * worked. Answers taken here are marked as taken by the office, and the member
 * can still change their own.
 */
export function AgmRegisterPage() {
    const { profile, selectedTenantId } = useAuth();
    const { pushToast } = useToast();
    const [event, setEvent] = useState<AgmEvent | null>(null);
    const [rows, setRows] = useState<RegisterRow[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingMemberId, setSavingMemberId] = useState<string | null>(null);

    const canRecord = profile?.role === "branch_manager" || profile?.role === "super_admin";

    const load = useCallback(async (term: string) => {
        if (!selectedTenantId) return;
        setLoading(true);
        try {
            const { data: boardResponse } = await api.get<{ data: { event: AgmEvent | null } }>(
                endpoints.agm.board(),
                { params: { tenant_id: selectedTenantId } }
            );
            const openEvent = boardResponse.data.event;
            setEvent(openEvent);
            if (!openEvent) {
                setRows([]);
                return;
            }
            const { data } = await api.get<{ data: { data: RegisterRow[] } }>(
                endpoints.agm.register(openEvent.id),
                { params: { tenant_id: selectedTenantId, search: term || undefined } }
            );
            setRows(data.data.data || []);
        } catch (error) {
            pushToast({ type: "error", title: "Could not load the register", message: getApiErrorMessage(error) });
        } finally {
            setLoading(false);
        }
    }, [selectedTenantId, pushToast]);

    useEffect(() => {
        void load("");
    }, [load]);

    const counts = useMemo(() => ({
        attending: rows.filter((row) => row.status === "attending").length,
        notAttending: rows.filter((row) => row.status === "not_attending").length,
        unanswered: rows.filter((row) => !row.status).length
    }), [rows]);

    const record = async (row: RegisterRow, status: "attending" | "not_attending") => {
        if (!event || !selectedTenantId) return;
        setSavingMemberId(row.member_id);
        try {
            await api.post(endpoints.agm.responses(event.id), {
                tenant_id: selectedTenantId,
                member_id: row.member_id,
                status
            });
            setRows((current) => current.map((item) => (
                item.member_id === row.member_id
                    ? { ...item, status, recorded_on_behalf: true, responded_at: new Date().toISOString() }
                    : item
            )));
        } catch (error) {
            pushToast({ type: "error", title: "Could not record", message: getApiErrorMessage(error) });
        } finally {
            setSavingMemberId(null);
        }
    };

    const columns: Column<RegisterRow>[] = [
        {
            key: "member",
            header: "Member",
            render: (row) => (
                <Stack spacing={0.1}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.full_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {row.member_no}{row.phone ? ` · ${row.phone}` : ""}
                    </Typography>
                </Stack>
            )
        },
        {
            key: "status",
            header: "Answer",
            render: (row) => (
                <Stack spacing={0.25} alignItems="flex-start">
                    <Chip
                        size="small"
                        variant={row.status ? "filled" : "outlined"}
                        color={row.status === "attending" ? "success" : row.status === "not_attending" ? "default" : "warning"}
                        label={row.status === "attending"
                            ? "Attending"
                            : row.status === "not_attending"
                                ? "Not attending"
                                : "No answer yet"}
                    />
                    {/* Who gave the answer. A register that cannot tell the
                        member's own word from the office's is not a register. */}
                    {row.status ? (
                        <Typography variant="caption" color="text.secondary">
                            {row.recorded_on_behalf ? "Recorded by the office" : "Answered by the member"}
                            {row.responded_at ? ` · ${formatDate(row.responded_at)}` : ""}
                        </Typography>
                    ) : null}
                </Stack>
            )
        },
        {
            key: "actions",
            header: "Record for them",
            render: (row) => (canRecord ? (
                <Stack direction="row" spacing={1}>
                    <Button
                        size="small"
                        variant={row.status === "attending" ? "contained" : "outlined"}
                        color="success"
                        disabled={savingMemberId === row.member_id || !event?.rsvp_open}
                        onClick={() => void record(row, "attending")}
                    >
                        Attending
                    </Button>
                    <Button
                        size="small"
                        variant={row.status === "not_attending" ? "contained" : "outlined"}
                        color="inherit"
                        disabled={savingMemberId === row.member_id || !event?.rsvp_open}
                        onClick={() => void record(row, "not_attending")}
                    >
                        Not attending
                    </Button>
                </Stack>
            ) : null)
        }
    ];

    if (!loading && !event) {
        return (
            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6">No meeting is taking responses</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Once a general meeting is opened for responses, the register appears here.
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Stack spacing={2}>
            <Card variant="outlined">
                <CardContent>
                    <Stack spacing={1.25}>
                        <Box>
                            <Typography variant="h6">{event?.title || "Attendance register"}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {event ? formatDate(event.event_date) : ""}
                                {event?.venue ? ` · ${event.venue}` : ""}
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={3} useFlexGap flexWrap="wrap">
                            {[
                                ["Attending", counts.attending, "success.main"],
                                ["Not attending", counts.notAttending, "text.primary"],
                                ["No answer yet", counts.unanswered, "warning.main"]
                            ].map(([label, value, color]) => (
                                <Box key={String(label)}>
                                    <Typography variant="h5" sx={{ fontVariantNumeric: "tabular-nums" }} color={color as string}>
                                        {String(value)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                                </Box>
                            ))}
                        </Stack>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                            <TextField
                                size="small"
                                fullWidth
                                label="Find a member by name or number"
                                value={search}
                                onChange={(changeEvent) => setSearch(changeEvent.target.value)}
                                onKeyDown={(keyEvent) => {
                                    if (keyEvent.key === "Enter") {
                                        keyEvent.preventDefault();
                                        void load(search);
                                    }
                                }}
                            />
                            <Button variant="outlined" onClick={() => void load(search)}>Search</Button>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>

            <DataTable
                rows={rows}
                columns={columns}
                emptyMessage={loading ? "Loading the register..." : "No members match that search."}
            />
        </Stack>
    );
}
