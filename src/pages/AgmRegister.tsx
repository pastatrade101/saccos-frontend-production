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

type StatusFilter = "attending" | "not_attending" | "unanswered" | null;

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
    // Which of the three figures the branch manager clicked, if any.
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(null);

    const canRecord = profile?.role === "branch_manager" || profile?.role === "super_admin";

    // The whole register, loaded once. The server sends up to 500 rows and the
    // SACCOS has fewer than 200, so searching and filtering happen here.
    //
    // Searching used to refetch, and refetching started by refetching the
    // BOARD — so every keystroke's worth of Search re-asked which meeting was
    // open, and a null answer (a slow call, a blink of the rsvp window) ran
    // `setRows([])`. The register appeared and vanished while nobody had
    // changed anything. Nothing about the meeting can change between one
    // search and the next, so nothing needs re-asking.
    const load = useCallback(async () => {
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
                { params: { tenant_id: selectedTenantId } }
            );
            setRows(data.data.data || []);
        } catch (error) {
            pushToast({ type: "error", title: "Could not load the register", message: getApiErrorMessage(error) });
        } finally {
            setLoading(false);
        }
    }, [selectedTenantId, pushToast]);

    useEffect(() => {
        void load();
    }, [load]);

    // Always the whole register, never the filtered view. Counted off the
    // visible rows, the totals fell to "1 / 0 / 0" the moment somebody
    // searched for one member — the three figures the branch reports to the
    // board, quietly rewritten by a search box.
    const counts = useMemo(() => ({
        attending: rows.filter((row) => row.status === "attending").length,
        notAttending: rows.filter((row) => row.status === "not_attending").length,
        unanswered: rows.filter((row) => !row.status).length
    }), [rows]);

    const visibleRows = useMemo(() => {
        const term = search.trim().toLowerCase();
        return rows.filter((row) => {
            if (statusFilter === "attending" && row.status !== "attending") return false;
            if (statusFilter === "not_attending" && row.status !== "not_attending") return false;
            if (statusFilter === "unanswered" && row.status) return false;
            if (!term) return true;
            return row.full_name.toLowerCase().includes(term)
                || (row.member_no || "").toLowerCase().includes(term)
                || (row.phone || "").includes(term);
        });
    }, [rows, search, statusFilter]);

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
                        {/* The three figures are the question the branch asks
                            first — "who are the 28?" — so they are the control
                            that answers it. Clicking one filters the register
                            to those members; clicking it again clears it. */}
                        <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
                            {([
                                ["Attending", counts.attending, "success.main", "attending"],
                                ["Not attending", counts.notAttending, "text.primary", "not_attending"],
                                ["No answer yet", counts.unanswered, "warning.main", "unanswered"]
                            ] as Array<[string, number, string, Exclude<StatusFilter, null>]>).map(
                                ([label, value, color, filter]) => {
                                    const active = statusFilter === filter;
                                    return (
                                        <Box
                                            key={label}
                                            component="button"
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() => setStatusFilter(active ? null : filter)}
                                            sx={{
                                                px: 2,
                                                py: 1,
                                                textAlign: "left",
                                                cursor: "pointer",
                                                borderRadius: 2,
                                                bgcolor: active ? "action.selected" : "transparent",
                                                border: (muiTheme) => `1px solid ${active ? muiTheme.palette.text.primary : muiTheme.palette.divider}`,
                                                "&:hover": { bgcolor: "action.hover" }
                                            }}
                                        >
                                            <Typography variant="h5" sx={{ fontVariantNumeric: "tabular-nums" }} color={color}>
                                                {value}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">{label}</Typography>
                                        </Box>
                                    );
                                }
                            )}
                        </Stack>
                        {statusFilter ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2" color="text.secondary">
                                    {`Showing ${visibleRows.length} ${statusFilter === "attending"
                                        ? "attending"
                                        : statusFilter === "not_attending"
                                            ? "not attending"
                                            : "with no answer yet"}`}
                                </Typography>
                                <Button size="small" onClick={() => setStatusFilter(null)}>Show everyone</Button>
                            </Stack>
                        ) : null}
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                            {/* Filters the rows already in hand, so it answers
                                as it is typed and cannot empty the register. */}
                            <TextField
                                size="small"
                                fullWidth
                                label="Find a member by name, number or phone"
                                value={search}
                                onChange={(changeEvent) => setSearch(changeEvent.target.value)}
                            />
                            <Button variant="outlined" onClick={() => void load()} disabled={loading}>
                                {loading ? "Refreshing…" : "Refresh"}
                            </Button>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>

            <DataTable
                rows={visibleRows}
                columns={columns}
                emptyMessage={loading ? "Loading the register..." : "No members match that search."}
            />
        </Stack>
    );
}
