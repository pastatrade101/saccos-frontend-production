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
    LinearProgress,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import GridOnRoundedIcon from "@mui/icons-material/GridOnRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import TableViewRoundedIcon from "@mui/icons-material/TableViewRounded";
import type { ChartData, ChartOptions } from "chart.js";
import { Bar } from "react-chartjs-2";
import { useCallback, useEffect, useMemo, useState } from "react";

import { registerCharts } from "../lib/charts";
import { useAuth } from "../auth/AuthContext";
import { AppLoader } from "../components/AppLoader";
import { useToast } from "../components/Toast";
import { api, getApiErrorMessage } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import type { SaccoFinancials, SaccoMilestone, SaccoMilestoneBoard } from "../types/api";
import { MotionCard } from "../ui/motion";
import { formatCurrency } from "../utils/format";
import {
    downloadDashboardExcel,
    downloadDashboardPdf,
    type DashboardSection
} from "../utils/saccoDashboardExport";

registerCharts();

const compactMoney = new Intl.NumberFormat("en-TZ", { notation: "compact", maximumFractionDigits: 1 });

function formatMoneyOrDash(value: number | null | undefined) {
    return value == null ? "—" : formatCurrency(value);
}

interface MilestoneForm {
    id: string | null;
    title: string;
    target_amount: string;
    target_date: string;
    achieved_date: string;
    sort_order: string;
}

const EMPTY_FORM: MilestoneForm = { id: null, title: "", target_amount: "", target_date: "", achieved_date: "", sort_order: "" };

function toDateInput(value: string | null) {
    if (!value) {
        return "";
    }
    return new Date(value).toISOString().slice(0, 10);
}

function formatDate(value: string | null) {
    if (!value) {
        return "No date";
    }
    return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function MilestonesPage() {
    const theme = useTheme();
    const { selectedTenantId, selectedTenantName, profile } = useAuth();
    const { pushToast } = useToast();
    const [board, setBoard] = useState<SaccoMilestoneBoard | null>(null);
    const [financials, setFinancials] = useState<SaccoFinancials | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState<MilestoneForm>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    const loadBoard = useCallback(async () => {
        if (!selectedTenantId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const [boardResult, financialsResult] = await Promise.allSettled([
                api.get<{ data: SaccoMilestoneBoard }>(endpoints.milestones.board(), { params: { tenant_id: selectedTenantId } }),
                api.get<{ data: SaccoFinancials }>(endpoints.saccoDashboard.financials(), { params: { tenant_id: selectedTenantId } })
            ]);

            if (boardResult.status === "fulfilled") {
                setBoard(boardResult.value.data.data);
            } else {
                setError(getApiErrorMessage(boardResult.reason, "Unable to load milestones."));
            }

            if (financialsResult.status === "fulfilled") {
                setFinancials(financialsResult.value.data.data);
            }
        } finally {
            setLoading(false);
        }
    }, [selectedTenantId]);

    useEffect(() => {
        void loadBoard();
    }, [loadBoard]);

    const contributionChart = useMemo<{ data: ChartData<"bar">; options: ChartOptions<"bar"> } | null>(() => {
        const months = financials?.monthly_contributions.months || [];
        if (!months.length) {
            return null;
        }

        const data: ChartData<"bar"> = {
            labels: months.map((month) => month.label),
            datasets: [
                {
                    label: "Contributions",
                    data: months.map((month) => month.amount),
                    backgroundColor: alpha(theme.palette.primary.main, 0.75),
                    hoverBackgroundColor: theme.palette.primary.main,
                    borderRadius: 4,
                    maxBarThickness: 34
                }
            ]
        };

        const percentByLabel = new Map(months.map((month) => [month.label, month.percent]));
        const options: ChartOptions<"bar"> = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const percent = percentByLabel.get(String(ctx.label)) ?? 0;
                            return `${formatCurrency(Number(ctx.parsed.y || 0))} · ${percent.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: { callback: (value) => compactMoney.format(Number(value)) },
                    grid: { color: alpha(theme.palette.text.primary, 0.06) }
                },
                x: {
                    ticks: { maxRotation: 90, minRotation: 45, autoSkip: false, font: { size: 10 } },
                    grid: { display: false }
                }
            }
        };

        return { data, options };
    }, [financials, theme]);

    // Excel-style sections mirroring the SACCO spreadsheet, used for both the
    // on-screen "View" modal and the Excel/PDF exports.
    const sheetSections = useMemo<DashboardSection[]>(() => {
        const sections: DashboardSection[] = [];

        if (financials) {
            sections.push({
                title: "Financial Position",
                head: ["Item", "Amount"],
                rows: [
                    ["MEMBERS", financials.members],
                    ["CASH AT BANK", financials.cash_at_bank == null ? "—" : financials.cash_at_bank],
                    ["TOTAL LOANS", financials.total_loans],
                    ["LOAN INTERESTS", financials.loan_interest],
                    ["ACTIVE LOANS", financials.active_loans_outstanding],
                    ["TOTAL UTT INVESTED", financials.investment_cost == null ? "—" : financials.investment_cost],
                    ["UTT INTEREST", financials.investment_income == null ? "—" : financials.investment_income],
                    ["DIVIDENDS DISTRIBUTED", financials.dividends_distributed == null ? "—" : financials.dividends_distributed],
                    ["DIVIDENDS FROM UTT", financials.dividends_utt == null ? "—" : financials.dividends_utt],
                    ["DIVIDENDS FROM LOANS", financials.dividends_loan == null ? "—" : financials.dividends_loan],
                    ["TOTAL CONTRIBUTIONS", financials.total_contributions],
                    ["INTEREST RATE", financials.interest_rate == null ? "—" : `${financials.interest_rate}%`]
                ]
            });

            if (financials.monthly_contributions.months.length) {
                sections.push({
                    title: "Contributions by Period",
                    head: ["Period", "Amount", "%"],
                    rows: [
                        ...financials.monthly_contributions.months.map((month) => [month.label, month.amount, `${month.percent.toFixed(2)}%`] as (string | number)[]),
                        ["TOTAL", financials.monthly_contributions.total, "100.00%"]
                    ]
                });
            }
        }

        if (board?.milestones.length) {
            sections.push({
                title: "Milestones",
                head: ["Milestone", "Amount", "Expected Date", "Reached Date", "Remaining"],
                rows: board.milestones.map((milestone) => [
                    milestone.title,
                    milestone.target_amount,
                    formatDate(milestone.target_date),
                    milestone.reached ? (milestone.achieved_at ? formatDate(milestone.achieved_at) : "Reached") : "—",
                    milestone.reached ? "—" : milestone.remaining_amount
                ])
            });
        }

        return sections;
    }, [financials, board]);

    const exportPayload = {
        tenantName: selectedTenantName || "SACCO",
        generatedBy: profile?.full_name || "Branch Manager",
        sections: sheetSections
    };

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setDialogOpen(true);
    };

    const openEdit = (milestone: SaccoMilestone) => {
        setForm({
            id: milestone.id,
            title: milestone.title,
            target_amount: String(milestone.target_amount),
            target_date: milestone.target_date || "",
            achieved_date: toDateInput(milestone.achieved_at),
            sort_order: String(milestone.sort_order)
        });
        setDialogOpen(true);
    };

    const saveForm = async () => {
        const amount = Number(form.target_amount.replace(/[^\d.]/g, ""));
        if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0) {
            pushToast({ type: "error", title: "Check the form", message: "A title and a positive target amount are required." });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                tenant_id: selectedTenantId || undefined,
                title: form.title.trim(),
                target_amount: amount,
                target_date: form.target_date || null,
                achieved_date: form.achieved_date || null,
                sort_order: form.sort_order ? Number(form.sort_order) : 0
            };

            if (form.id) {
                await api.patch(endpoints.milestones.detail(form.id), payload);
            } else {
                await api.post(endpoints.milestones.create(), payload);
            }

            pushToast({ type: "success", title: "Saved", message: `Milestone ${form.id ? "updated" : "created"}.` });
            setDialogOpen(false);
            await loadBoard();
        } catch (saveError) {
            pushToast({ type: "error", title: "Save failed", message: getApiErrorMessage(saveError, "Unable to save the milestone.") });
        } finally {
            setSaving(false);
        }
    };

    const removeMilestone = async (milestone: SaccoMilestone) => {
        setBusyId(milestone.id);
        try {
            await api.delete(endpoints.milestones.detail(milestone.id), { params: { tenant_id: selectedTenantId } });
            pushToast({ type: "success", title: "Deleted", message: `"${milestone.title}" removed.` });
            await loadBoard();
        } catch (deleteError) {
            pushToast({ type: "error", title: "Delete failed", message: getApiErrorMessage(deleteError, "Unable to delete the milestone.") });
        } finally {
            setBusyId(null);
        }
    };

    const announce = async (milestone: SaccoMilestone) => {
        setBusyId(milestone.id);
        try {
            const { data } = await api.post<{ data: { notified: number } }>(endpoints.milestones.announce(milestone.id), {
                tenant_id: selectedTenantId || undefined
            });
            pushToast({ type: "success", title: "Announced", message: `${data.data.notified} member(s) notified about "${milestone.title}".` });
            await loadBoard();
        } catch (announceError) {
            pushToast({ type: "error", title: "Announce failed", message: getApiErrorMessage(announceError, "Unable to announce the milestone.") });
        } finally {
            setBusyId(null);
        }
    };

    if (loading) {
        return <AppLoader fullscreen={false} minHeight="72vh" message="Loading milestones..." />;
    }

    return (
        <Stack spacing={3}>
            <MotionCard variant="outlined">
                <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                        <Box>
                            <Typography variant="h5">SACCO Milestones</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
                                The shared fundraising roadmap for {selectedTenantName || "this SACCO"}. Members see this progress in
                                their portal, so the goal belongs to everyone — not just leadership.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ alignSelf: "flex-start" }} flexWrap="wrap" useFlexGap>
                            <Button
                                variant="outlined"
                                startIcon={<TableViewRoundedIcon />}
                                onClick={() => setSheetOpen(true)}
                                disabled={!sheetSections.length}
                            >
                                View as sheet
                            </Button>
                            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
                                Add milestone
                            </Button>
                        </Stack>
                    </Stack>
                </CardContent>
            </MotionCard>

            {error ? <Alert severity="error">{error}</Alert> : null}
            {!selectedTenantId ? <Alert severity="warning">Select a tenant before managing milestones.</Alert> : null}

            {financials ? (
                <MotionCard variant="outlined">
                    <CardContent sx={{ display: "grid", gap: 2 }}>
                        <Box>
                            <Typography variant="h6">Financial Position</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Live figures from the system. Items with no recorded data show a dash.
                            </Typography>
                        </Box>
                        {/* Only figures the milestone roadmap actually needs — member and
                            loan-book stats live on the Dashboard to avoid duplicate numbers. */}
                        <Grid container spacing={1.5}>
                            {[
                                { label: "Total Contributions", value: formatCurrency(financials.total_contributions), sub: "Savings + shares" },
                                { label: "Cash at Bank", value: formatMoneyOrDash(financials.cash_at_bank), sub: "Treasury cash position" },
                                { label: "Loan Interest", value: formatCurrency(financials.loan_interest), sub: "Accrued" },
                                { label: "Total UTT Invested", value: formatMoneyOrDash(financials.investment_cost), sub: "Treasury portfolio" },
                                { label: "UTT Interest", value: formatMoneyOrDash(financials.investment_income), sub: "Investment income" },
                                {
                                    label: "Dividends Distributed",
                                    value: formatMoneyOrDash(financials.dividends_distributed),
                                    sub: `UTT ${formatMoneyOrDash(financials.dividends_utt)} · Loans ${formatMoneyOrDash(financials.dividends_loan)}`
                                }
                            ].map((stat) => (
                                <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
                                    <Box sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.divider, 0.9)}`, height: "100%" }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{stat.label}</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 800, my: 0.25 }}>{stat.value}</Typography>
                                        <Typography variant="caption" color="text.secondary">{stat.sub}</Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </MotionCard>
            ) : null}

            {contributionChart ? (
                <MotionCard variant="outlined">
                    <CardContent sx={{ display: "grid", gap: 1.5 }}>
                        <Box>
                            <Typography variant="h6">Contributions by Period</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Monthly deposit inflow. Total {formatCurrency(financials?.monthly_contributions.total || 0)}.
                            </Typography>
                        </Box>
                        <Box sx={{ height: 320 }}>
                            <Bar data={contributionChart.data} options={contributionChart.options} />
                        </Box>
                    </CardContent>
                </MotionCard>
            ) : null}

            {board ? (
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <MotionCard variant="outlined" sx={{ height: "100%" }}>
                            <CardContent>
                                <Typography variant="overline" color="text.secondary">Total Contributions</Typography>
                                {/* Prefer the financials figure so the same number never renders
                                    twice from two different backend computations on one page. */}
                                <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 800 }}>{formatCurrency(financials?.total_contributions ?? board.total_contributions)}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Savings + shares across the cooperative.
                                </Typography>
                            </CardContent>
                        </MotionCard>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <MotionCard variant="outlined" sx={{ height: "100%" }}>
                            <CardContent>
                                <Typography variant="overline" color="text.secondary">Milestones Reached</Typography>
                                <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 800 }}>{board.achieved_count} / {board.milestone_count}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Targets already achieved.
                                </Typography>
                            </CardContent>
                        </MotionCard>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <MotionCard variant="outlined" sx={{ height: "100%" }}>
                            <CardContent>
                                <Typography variant="overline" color="text.secondary">Next Milestone</Typography>
                                <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 800 }}>
                                    {board.current_milestone ? board.current_milestone.title : "All reached 🎉"}
                                </Typography>
                                {board.current_milestone ? (
                                    <>
                                        <LinearProgress
                                            variant="determinate"
                                            value={Math.min(Math.max(board.current_milestone.progress_percent, 0), 100)}
                                            sx={{ my: 1, height: 8, borderRadius: 999 }}
                                        />
                                        <Typography variant="body2" color="text.secondary">
                                            {formatCurrency(board.current_milestone.remaining_amount)} to go
                                        </Typography>
                                    </>
                                ) : null}
                            </CardContent>
                        </MotionCard>
                    </Grid>
                </Grid>
            ) : null}

            <MotionCard variant="outlined">
                <CardContent sx={{ display: "grid", gap: 1.25 }}>
                    <Typography variant="h6">Roadmap</Typography>
                    {!board?.milestones.length ? (
                        <Alert severity="info" variant="outlined">
                            No milestones yet. Add your first fundraising target to start the roadmap.
                        </Alert>
                    ) : (
                        board.milestones.map((milestone) => (
                            <Stack
                                key={milestone.id}
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1.5}
                                alignItems={{ sm: "center" }}
                                sx={{
                                    p: 1.5,
                                    borderRadius: 1.5,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                                    bgcolor: milestone.is_current ? alpha(theme.palette.primary.main, 0.05) : "transparent"
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: "50%",
                                        display: "grid",
                                        placeItems: "center",
                                        flexShrink: 0,
                                        bgcolor: milestone.reached ? theme.palette.success.main : milestone.is_current ? theme.palette.primary.main : alpha(theme.palette.text.disabled, 0.2),
                                        color: milestone.reached || milestone.is_current ? "#fff" : theme.palette.text.secondary
                                    }}
                                >
                                    {milestone.reached ? <CheckCircleRoundedIcon /> : <FlagRoundedIcon />}
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{milestone.title}</Typography>
                                        {milestone.reached ? (
                                            <Chip size="small" color="success" label={milestone.announced_at ? "Reached · Announced" : "Reached"} />
                                        ) : milestone.is_current ? (
                                            <Chip size="small" color="primary" label="In progress" />
                                        ) : null}
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary">
                                        {formatCurrency(milestone.target_amount)}
                                        {" · Expected "}{formatDate(milestone.target_date)}
                                        {milestone.reached
                                            ? ` · Reached ${milestone.achieved_at ? formatDate(milestone.achieved_at) : "date not set"}`
                                            : ` · ${Math.round(milestone.progress_percent)}% · ${formatCurrency(milestone.remaining_amount)} remaining`}
                                    </Typography>
                                    {!milestone.reached ? (
                                        <LinearProgress
                                            variant="determinate"
                                            value={Math.min(Math.max(milestone.progress_percent, 0), 100)}
                                            sx={{ mt: 0.75, height: 6, borderRadius: 999, maxWidth: 320 }}
                                        />
                                    ) : null}
                                </Box>
                                <Stack direction="row" spacing={0.5}>
                                    {milestone.reached && !milestone.announced_at ? (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="success"
                                            startIcon={<CampaignRoundedIcon />}
                                            disabled={busyId === milestone.id}
                                            onClick={() => void announce(milestone)}
                                        >
                                            Announce
                                        </Button>
                                    ) : null}
                                    <IconButton aria-label="Edit" onClick={() => openEdit(milestone)}>
                                        <EditRoundedIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton aria-label="Delete" disabled={busyId === milestone.id} onClick={() => void removeMilestone(milestone)}>
                                        <DeleteOutlineRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </Stack>
                        ))
                    )}
                </CardContent>
            </MotionCard>

            <Dialog open={sheetOpen} onClose={() => setSheetOpen(false)} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ pr: 6 }}>
                    SACCO Dashboard — Sheet View
                    <IconButton aria-label="Close" onClick={() => setSheetOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
                        <CloseRoundedIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                        <Button variant="contained" startIcon={<GridOnRoundedIcon />} onClick={() => downloadDashboardExcel(exportPayload)}>
                            Export Excel
                        </Button>
                        <Button variant="outlined" startIcon={<PictureAsPdfRoundedIcon />} onClick={() => void downloadDashboardPdf(exportPayload)}>
                            Export PDF
                        </Button>
                    </Stack>

                    <Stack spacing={3}>
                        {sheetSections.map((section) => (
                            <Box key={section.title} sx={{ overflowX: "auto" }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>{section.title}</Typography>
                                <Box
                                    component="table"
                                    sx={{
                                        borderCollapse: "collapse",
                                        width: "100%",
                                        "& th, & td": { border: `1px solid ${alpha(theme.palette.divider, 0.9)}`, px: 1.25, py: 0.75, fontSize: 13 },
                                        "& th": { bgcolor: alpha(theme.palette.primary.main, 0.1), textAlign: "left", fontWeight: 700 }
                                    }}
                                >
                                    <thead>
                                        <tr>
                                            {section.head.map((cell, index) => (
                                                <th key={index} style={{ textAlign: index === 0 ? "left" : "right" }}>{cell}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {section.rows.map((row, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {row.map((cell, cellIndex) => (
                                                    <td key={cellIndex} style={{ textAlign: typeof cell === "number" ? "right" : cellIndex === 0 ? "left" : "right" }}>
                                                        {typeof cell === "number" ? formatCurrency(cell) : cell}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{form.id ? "Edit milestone" : "Add milestone"}</DialogTitle>
                <DialogContent dividers sx={{ display: "grid", gap: 2 }}>
                    <TextField
                        label="Title"
                        value={form.title}
                        onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                        placeholder="e.g. Milestone 6 — 1.5 Bilioni"
                        fullWidth
                        autoFocus
                    />
                    <TextField
                        label="Target amount (TZS)"
                        type="number"
                        value={form.target_amount}
                        onChange={(event) => setForm((prev) => ({ ...prev, target_amount: event.target.value }))}
                        fullWidth
                    />
                    <TextField
                        label="Expected date"
                        type="date"
                        value={form.target_date}
                        onChange={(event) => setForm((prev) => ({ ...prev, target_date: event.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                    />
                    <TextField
                        label="Reached date (optional)"
                        type="date"
                        value={form.achieved_date}
                        onChange={(event) => setForm((prev) => ({ ...prev, achieved_date: event.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        helperText="The actual date this milestone was hit — may differ from the expected date."
                        fullWidth
                    />
                    <TextField
                        label="Sort order (optional)"
                        type="number"
                        value={form.sort_order}
                        onChange={(event) => setForm((prev) => ({ ...prev, sort_order: event.target.value }))}
                        helperText="Milestones are ordered by target amount; use this only to break ties."
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
                    <Button variant="contained" onClick={() => void saveForm()} disabled={saving}>
                        {saving ? "Saving..." : "Save milestone"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}
