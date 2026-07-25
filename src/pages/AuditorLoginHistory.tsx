import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Chip,
    FormControlLabel,
    Grid,
    Pagination,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from "@mui/material";

import { AppLoader } from "../components/AppLoader";
import { useToast } from "../components/Toast";
import { MotionCard } from "../ui/motion";
import { api, getApiErrorMessage } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import { formatDate, formatRole } from "../utils/format";
import pageStyles from "./Pages.module.css";

interface LoginHistoryRow {
    user_id: string;
    full_name: string;
    role: string;
    account_type: "member" | "staff";
    member_no: string | null;
    is_active: boolean;
    first_login_at: string | null;
    last_login_at: string | null;
    never_logged_in: boolean;
    created_at: string;
}

interface LoginHistorySummary {
    total_accounts: number;
    never_logged_in: number;
}

interface LoginHistoryResponse {
    data: LoginHistoryRow[];
    pagination: { page: number; limit: number; total: number };
    summary: LoginHistorySummary;
}

const LIMIT = 20;

export function AuditorLoginHistoryPage() {
    const { pushToast } = useToast();
    const [rows, setRows] = useState<LoginHistoryRow[]>([]);
    const [total, setTotal] = useState(0);
    const [summary, setSummary] = useState<LoginHistorySummary>({ total_accounts: 0, never_logged_in: 0 });
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [accountType, setAccountType] = useState<"all" | "member" | "staff">("all");
    const [neverOnly, setNeverOnly] = useState(false);
    const [loading, setLoading] = useState(true);

    // Reset to page 1 whenever the filters change.
    useEffect(() => {
        setPage(1);
    }, [search, accountType, neverOnly]);

    useEffect(() => {
        const handle = window.setTimeout(() => {
            setLoading(true);
            void api
                .get<LoginHistoryResponse>(endpoints.auditor.loginHistory(), {
                    params: {
                        page,
                        limit: LIMIT,
                        search: search.trim() || undefined,
                        account_type: accountType === "all" ? undefined : accountType,
                        never_logged_in: neverOnly ? true : undefined
                    }
                })
                .then(({ data }) => {
                    setRows(data.data);
                    setTotal(data.pagination.total);
                    setSummary(data.summary);
                })
                .catch((error) =>
                    pushToast({
                        type: "error",
                        title: "Unable to load login history",
                        message: getApiErrorMessage(error)
                    })
                )
                .finally(() => setLoading(false));
        }, 250);
        return () => window.clearTimeout(handle);
    }, [page, search, accountType, neverOnly, pushToast]);

    const pageCount = useMemo(() => Math.max(1, Math.ceil(total / LIMIT)), [total]);

    return (
        <Stack spacing={2.5} className={pageStyles.page}>
            <Box>
                <Typography variant="h5" fontWeight={800}>Login History</Typography>
                <Typography variant="body2" color="text.secondary">
                    First and last login for every account — members and staff. Spot dormant or never-accessed logins.
                </Typography>
            </Box>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MotionCard variant="outlined"><Box sx={{ p: 2 }}>
                        <Typography variant="caption" color="text.secondary">Accounts</Typography>
                        <Typography variant="h5" fontWeight={800}>{summary.total_accounts}</Typography>
                    </Box></MotionCard>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MotionCard variant="outlined"><Box sx={{ p: 2 }}>
                        <Typography variant="caption" color="text.secondary">Never logged in</Typography>
                        <Typography variant="h5" fontWeight={800} color={summary.never_logged_in ? "warning.main" : "text.primary"}>
                            {summary.never_logged_in}
                        </Typography>
                    </Box></MotionCard>
                </Grid>
            </Grid>

            <MotionCard variant="outlined">
                <Box sx={{ p: 2 }}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} sx={{ mb: 2 }}>
                        <TextField
                            size="small"
                            label="Search name or member no."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            sx={{ minWidth: 260 }}
                        />
                        <ToggleButtonGroup
                            size="small"
                            exclusive
                            value={accountType}
                            onChange={(_, next) => { if (next) { setAccountType(next); } }}
                        >
                            <ToggleButton value="all">All</ToggleButton>
                            <ToggleButton value="member">Members</ToggleButton>
                            <ToggleButton value="staff">Staff</ToggleButton>
                        </ToggleButtonGroup>
                        <FormControlLabel
                            control={<Switch checked={neverOnly} onChange={(event) => setNeverOnly(event.target.checked)} />}
                            label="Never logged in only"
                        />
                    </Stack>

                    {loading ? (
                        <AppLoader />
                    ) : (
                        <TableContainer sx={{ overflowX: "auto" }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Role</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Member No.</TableCell>
                                        <TableCell>First login</TableCell>
                                        <TableCell>Last login</TableCell>
                                        <TableCell>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7}>
                                                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                                    No accounts match the current filters.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        rows.map((row) => (
                                            <TableRow key={row.user_id} hover>
                                                <TableCell><Typography variant="body2" fontWeight={700}>{row.full_name}</Typography></TableCell>
                                                <TableCell>{formatRole(row.role)}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={row.account_type === "member" ? "Member" : "Staff"}
                                                        color={row.account_type === "member" ? "primary" : "default"}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>{row.member_no || "—"}</TableCell>
                                                <TableCell>{row.first_login_at ? formatDate(row.first_login_at) : "—"}</TableCell>
                                                <TableCell>
                                                    {row.last_login_at
                                                        ? formatDate(row.last_login_at)
                                                        : <Typography variant="body2" color="warning.main">never logged in</Typography>}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={row.is_active ? "Active" : "Inactive"}
                                                        color={row.is_active ? "success" : "default"}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {pageCount > 1 && (
                        <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
                            <Pagination count={pageCount} page={page} onChange={(_, value) => setPage(value)} color="primary" />
                        </Stack>
                    )}
                </Box>
            </MotionCard>
        </Stack>
    );
}
