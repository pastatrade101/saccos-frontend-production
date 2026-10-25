import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import {
    Alert,
    Autocomplete,
    CardContent,
    Chip,
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
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppLoader } from "../components/AppLoader";
import { useToast } from "../components/Toast";
import { api, getApiErrorMessage } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import { MotionCard } from "../ui/motion";

interface PositionOption {
    code: string;
    label: string;
}

interface InsiderRow {
    member_id: string;
    member_no: string | null;
    full_name: string | null;
    status: string;
    insider_position: string | null;
    position_label: string | null;
    related_to_member_id: string | null;
    related_to_name: string | null;
}

interface InsiderResponse {
    positions: PositionOption[];
    members: InsiderRow[];
    insider_count: number;
}

/// Identifies who the Commission counts as an insider.
///
/// MSP3_06 lists every loan to a board member, the supervisory committee, an
/// employee or their immediate family, by name. None of that is inferable:
/// board members are elected rather than given logins, and no member here
/// holds a staff account. Someone has to say who is who.
export function TcdcInsidersPage() {
    const { pushToast } = useToast();

    const [data, setData] = useState<InsiderResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<{ data: InsiderResponse }>(endpoints.tcdcReturns.insiders());
            setData(response.data.data);
        } catch (loadError) {
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const save = async (row: InsiderRow, position: string | null, relatedTo: string | null) => {
        setSavingId(row.member_id);
        try {
            await api.patch(endpoints.tcdcReturns.setInsider(row.member_id), {
                insider_position: position,
                related_to_member_id: relatedTo
            });
            await load();
        } catch (saveError) {
            pushToast({ type: "error", title: "Unable to set the position", message: getApiErrorMessage(saveError) });
        } finally {
            setSavingId(null);
        }
    };

    // Everyone already marked, for the "related to" picker. A family member is
    // related to an insider, not to the membership at large.
    const insiders = useMemo(
        () => (data?.members ?? []).filter((row) => row.insider_position && row.insider_position !== "family_member"),
        [data]
    );

    const visible = useMemo(() => {
        const rows = data?.members ?? [];
        const needle = search.trim().toLowerCase();
        if (!needle) return rows.filter((row) => row.insider_position) .concat(rows.filter((row) => !row.insider_position).slice(0, 40));
        return rows.filter((row) =>
            (row.full_name || "").toLowerCase().includes(needle)
            || (row.member_no || "").toLowerCase().includes(needle));
    }, [data, search]);

    if (loading && !data) {
        return <AppLoader message="Loading the membership" />;
    }

    return (
        <Stack spacing={2}>
            {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}

            <MotionCard variant="outlined" inView>
                <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <GroupsRoundedIcon color="primary" />
                        <Typography variant="h5">Insiders and related parties</Typography>
                        {data ? <Chip size="small" label={`${data.insider_count} marked`} /> : null}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        MSP3_06 names every loan to a board member, the supervisory committee, an employee or
                        their immediate family. Mark them here and the return fills itself.
                    </Typography>
                </CardContent>
            </MotionCard>

            <MotionCard variant="outlined" inView>
                <CardContent>
                    <TextField
                        fullWidth
                        size="small"
                        label="Search by name or member number"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        helperText={
                            search.trim()
                                ? undefined
                                : "Showing everyone already marked, plus the first 40 members. Search to find anyone else."
                        }
                        sx={{ mb: 1.5 }}
                    />

                    <TableContainer sx={{ overflowX: "auto" }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Member</TableCell>
                                    <TableCell sx={{ minWidth: 220 }}>Position</TableCell>
                                    <TableCell sx={{ minWidth: 240 }}>Related to</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {visible.map((row) => (
                                    <TableRow key={row.member_id} hover selected={Boolean(row.insider_position)}>
                                        <TableCell>
                                            <Typography variant="body2">{row.full_name || "—"}</Typography>
                                            <Typography variant="caption" color="text.secondary">{row.member_no || "—"}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                select
                                                fullWidth
                                                size="small"
                                                value={row.insider_position ?? ""}
                                                disabled={savingId === row.member_id}
                                                onChange={(event) => save(row, event.target.value || null, null)}
                                            >
                                                <MenuItem value=""><em>Not an insider</em></MenuItem>
                                                {(data?.positions ?? []).map((position) => (
                                                    <MenuItem key={position.code} value={position.code}>
                                                        {position.label}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </TableCell>
                                        <TableCell>
                                            {row.insider_position === "family_member" ? (
                                                <Autocomplete
                                                    size="small"
                                                    options={insiders}
                                                    getOptionLabel={(option) => `${option.full_name} (${option.position_label})`}
                                                    value={insiders.find((entry) => entry.member_id === row.related_to_member_id) ?? null}
                                                    disabled={savingId === row.member_id}
                                                    onChange={(_, next) => save(row, "family_member", next ? next.member_id : null)}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            placeholder="Which insider?"
                                                            error={!row.related_to_member_id}
                                                            helperText={row.related_to_member_id ? undefined : "Required"}
                                                        />
                                                    )}
                                                />
                                            ) : (
                                                <Typography variant="caption" color="text.disabled">—</Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {!insiders.length ? (
                        <Alert severity="info" sx={{ mt: 1.5 }}>
                            Mark the board and the supervisory committee first. A family member has to be linked
                            to the insider they are related to, and that list is built from whoever is already marked.
                        </Alert>
                    ) : null}
                </CardContent>
            </MotionCard>
        </Stack>
    );
}
