import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import {
    Alert,
    Box,
    Button,
    CardContent,
    Chip,
    FormControlLabel,
    Grid,
    MenuItem,
    Stack,
    Switch,
    TextField,
    Typography
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthContext";
import { AppLoader } from "../components/AppLoader";
import { useToast } from "../components/Toast";
import { api, getApiErrorMessage } from "../lib/api";
import {
    endpoints,
    type MemberPerformanceTargetImportResponse,
    type SaccoFinancialYearSettingsResponse,
    type SaccoPerformanceTargetSettingsResponse,
    type UpdateSaccoFinancialYearSettingsRequest,
    type UpdateSaccoPerformanceTargetSettingsRequest
} from "../lib/endpoints";
import type { SaccoFinancialYearSettings, SaccoPerformanceTargetSettings } from "../types/api";
import { MotionCard } from "../ui/motion";
import {
    DEFAULT_SACCO_FINANCIAL_YEAR_SETTINGS,
    MONTH_OPTIONS,
    normalizeSaccoFinancialYearSettings,
    resolveFinancialYearPeriod
} from "../utils/financialYear";
import {
    DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS,
    normalizeSaccoPerformanceTargetSettings
} from "../utils/performanceTarget";
import { formatCurrency, formatDate } from "../utils/format";
import type { ChangeEvent } from "react";

const performanceActualSourceOptions = [
    { value: "savings_balance", label: "Savings balance", helper: "Excel actual detail uses member savings only." },
    { value: "available_savings", label: "Available savings only", helper: "Excludes locked savings balances." },
    { value: "share_balance", label: "Share balance", helper: "Use share capital as the target actual." },
    { value: "savings_plus_shares", label: "Savings plus shares", helper: "Use total visible member capital." }
] as const;

const performanceMemberTargetSourceOptions = [
    { value: "notes_or_member_field", label: "Imported target, then notes/default", helper: "Uses imported member target first, then notes or profile field, then tenant default." },
    { value: "member_field", label: "Imported/profile target", helper: "Uses imported member target first, then the member profile commitment value." },
    { value: "member_field_annualized", label: "Imported or monthly x 12", helper: "Uses imported member target first, then annualizes monthly commitment." },
    { value: "tenant_default", label: "Imported or tenant default", helper: "Uses imported member target first; members without one use the tenant default." }
] as const;

export function SaccoSettingsPage() {
    const { profile, selectedTenantId, selectedTenantName } = useAuth();
    const { pushToast } = useToast();
    const [settings, setSettings] = useState<SaccoFinancialYearSettings>(DEFAULT_SACCO_FINANCIAL_YEAR_SETTINGS);
    const [performanceSettings, setPerformanceSettings] = useState<SaccoPerformanceTargetSettings>(DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS);
    const [draft, setDraft] = useState({
        financial_year_start_month: DEFAULT_SACCO_FINANCIAL_YEAR_SETTINGS.financial_year_start_month,
        financial_year_start_day: DEFAULT_SACCO_FINANCIAL_YEAR_SETTINGS.financial_year_start_day
    });
    const [performanceDraft, setPerformanceDraft] = useState({
        performance_target_enabled: DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS.performance_target_enabled,
        performance_target_actual_source: DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS.performance_target_actual_source,
        performance_target_default_annual_amount: DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS.performance_target_default_annual_amount,
        performance_target_required_amount: DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS.performance_target_required_amount,
        performance_target_on_track_percent: DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS.performance_target_on_track_percent,
        performance_target_member_target_source: DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS.performance_target_member_target_source
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingPerformance, setSavingPerformance] = useState(false);
    const [targetImportFile, setTargetImportFile] = useState<File | null>(null);
    const [importingTargets, setImportingTargets] = useState(false);
    const [targetImportResult, setTargetImportResult] = useState<MemberPerformanceTargetImportResponse["data"] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const canSetFinancialYear = profile?.role === "super_admin" && !settings.locked;
    const canSetPerformanceTarget = profile?.role === "super_admin" || profile?.role === "branch_manager";
    const period = useMemo(() => resolveFinancialYearPeriod(settings), [settings]);
    const draftSettings = useMemo(
        () => normalizeSaccoFinancialYearSettings({
            ...settings,
            financial_year_start_month: draft.financial_year_start_month,
            financial_year_start_day: draft.financial_year_start_day
        }),
        [draft.financial_year_start_day, draft.financial_year_start_month, settings]
    );
    const draftPeriod = useMemo(() => resolveFinancialYearPeriod(draftSettings), [draftSettings]);

    useEffect(() => {
        let isActive = true;

        const loadSettings = async () => {
            if (!selectedTenantId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const [financialYearResult, performanceTargetResult] = await Promise.all([
                    api.get<SaccoFinancialYearSettingsResponse>(endpoints.saccoSettings.financialYear(), {
                        params: { tenant_id: selectedTenantId }
                    }),
                    api.get<SaccoPerformanceTargetSettingsResponse>(endpoints.saccoSettings.performanceTarget(), {
                        params: { tenant_id: selectedTenantId }
                    })
                ]);

                if (!isActive) {
                    return;
                }

                const normalized = normalizeSaccoFinancialYearSettings(financialYearResult.data.data);
                const normalizedPerformance = normalizeSaccoPerformanceTargetSettings(performanceTargetResult.data.data);
                setSettings(normalized);
                setPerformanceSettings(normalizedPerformance);
                setDraft({
                    financial_year_start_month: normalized.financial_year_start_month,
                    financial_year_start_day: normalized.financial_year_start_day
                });
                setPerformanceDraft({
                    performance_target_enabled: normalizedPerformance.performance_target_enabled,
                    performance_target_actual_source: normalizedPerformance.performance_target_actual_source,
                    performance_target_default_annual_amount: normalizedPerformance.performance_target_default_annual_amount,
                    performance_target_required_amount: normalizedPerformance.performance_target_required_amount,
                    performance_target_on_track_percent: normalizedPerformance.performance_target_on_track_percent,
                    performance_target_member_target_source: normalizedPerformance.performance_target_member_target_source
                });
            } catch (loadError) {
                if (isActive) {
                    setError(getApiErrorMessage(loadError));
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        void loadSettings();

        return () => {
            isActive = false;
        };
    }, [selectedTenantId]);

    const saveFinancialYear = async () => {
        if (!selectedTenantId) {
            setError("Select a tenant before saving SACCO settings.");
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const payload: UpdateSaccoFinancialYearSettingsRequest = {
                tenant_id: selectedTenantId,
                financial_year_start_month: draft.financial_year_start_month,
                financial_year_start_day: draft.financial_year_start_day
            };
            const { data } = await api.patch<SaccoFinancialYearSettingsResponse>(endpoints.saccoSettings.financialYear(), payload);
            const normalized = normalizeSaccoFinancialYearSettings(data.data);

            setSettings(normalized);
            setDraft({
                financial_year_start_month: normalized.financial_year_start_month,
                financial_year_start_day: normalized.financial_year_start_day
            });
            pushToast({
                type: "success",
                title: "Financial year saved",
                message: "The SACCO financial year is now locked for this tenant."
            });
        } catch (saveError) {
            setError(getApiErrorMessage(saveError));
        } finally {
            setSaving(false);
        }
    };

    const savePerformanceTarget = async () => {
        if (!selectedTenantId) {
            setError("Select a tenant before saving SACCO settings.");
            return;
        }

        setSavingPerformance(true);
        setError(null);

        try {
            const payload: UpdateSaccoPerformanceTargetSettingsRequest = {
                tenant_id: selectedTenantId,
                ...performanceDraft
            };
            const { data } = await api.patch<SaccoPerformanceTargetSettingsResponse>(endpoints.saccoSettings.performanceTarget(), payload);
            const normalized = normalizeSaccoPerformanceTargetSettings(data.data);

            setPerformanceSettings(normalized);
            setPerformanceDraft({
                performance_target_enabled: normalized.performance_target_enabled,
                performance_target_actual_source: normalized.performance_target_actual_source,
                performance_target_default_annual_amount: normalized.performance_target_default_annual_amount,
                performance_target_required_amount: normalized.performance_target_required_amount,
                performance_target_on_track_percent: normalized.performance_target_on_track_percent,
                performance_target_member_target_source: normalized.performance_target_member_target_source
            });
            pushToast({
                type: "success",
                title: "Performance target saved",
                message: "Member target tracking now uses the updated tenant rules."
            });
        } catch (saveError) {
            setError(getApiErrorMessage(saveError));
        } finally {
            setSavingPerformance(false);
        }
    };

    const handleTargetFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        setTargetImportFile(event.target.files?.[0] || null);
        setTargetImportResult(null);
        event.target.value = "";
    };

    const importPerformanceTargets = async () => {
        if (!selectedTenantId) {
            setError("Select a tenant before importing member targets.");
            return;
        }

        if (!targetImportFile) {
            setError("Choose a member performance target CSV file first.");
            return;
        }

        const formData = new FormData();
        formData.append("tenant_id", selectedTenantId);
        formData.append("file", targetImportFile);
        setImportingTargets(true);
        setError(null);
        setTargetImportResult(null);

        try {
            const { data } = await api.post<MemberPerformanceTargetImportResponse>(
                endpoints.imports.memberPerformanceTargets(),
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            setTargetImportResult(data.data);
            setTargetImportFile(null);
            pushToast({
                type: data.data.failed_rows ? "warning" : "success",
                title: "Target import finished",
                message: `${data.data.updated_rows} updated, ${data.data.failed_rows} failed.`
            });
        } catch (importError) {
            setError(getApiErrorMessage(importError));
        } finally {
            setImportingTargets(false);
        }
    };

    if (loading) {
        return <AppLoader fullscreen={false} minHeight="60vh" message="Loading SACCO settings..." />;
    }

    return (
        <Stack spacing={2.5}>
            <MotionCard variant="outlined" inView>
                <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
                        <Stack spacing={0.75}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                <CalendarMonthRoundedIcon color="primary" />
                                <Typography variant="h5">SACCO Financial Year</Typography>
                                <Chip
                                    icon={settings.locked ? <LockRoundedIcon /> : undefined}
                                    label={settings.locked ? "Set once" : "Not locked"}
                                    color={settings.locked ? "success" : "warning"}
                                    variant="outlined"
                                />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                                {selectedTenantName || "Current tenant"} uses {period.startLabel} to {period.endLabel} as the current SACCO year.
                            </Typography>
                        </Stack>
                    </Stack>
                </CardContent>
            </MotionCard>

            {error ? <Alert severity="error" variant="outlined">{error}</Alert> : null}

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, lg: 7 }}>
                    <MotionCard variant="outlined" inView sx={{ height: "100%" }}>
                        <CardContent>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="h6">Year Boundary</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Current dashboard and report year-to-date windows are derived from this boundary.
                                    </Typography>
                                </Box>

                                <Grid container spacing={1.5}>
                                    <Grid size={{ xs: 12, md: 7 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Financial year starts"
                                            value={draft.financial_year_start_month}
                                            onChange={(event) => setDraft((current) => ({
                                                ...current,
                                                financial_year_start_month: Number(event.target.value)
                                            }))}
                                            disabled={!canSetFinancialYear || saving}
                                        >
                                            {MONTH_OPTIONS.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 5 }}>
                                        <TextField
                                            fullWidth
                                            label="Start day"
                                            value={draft.financial_year_start_day}
                                            onChange={(event) => setDraft((current) => ({
                                                ...current,
                                                financial_year_start_day: Math.min(Math.max(Number(event.target.value) || 1, 1), 31)
                                            }))}
                                            disabled={!canSetFinancialYear || saving}
                                            inputProps={{ inputMode: "numeric" }}
                                        />
                                    </Grid>
                                </Grid>

                                <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                                    <Typography variant="caption" color="text.secondary">Resulting current year</Typography>
                                    <Typography variant="h6">
                                        {draftPeriod.startLabel} - {draftPeriod.endLabel}
                                    </Typography>
                                </Box>

                                {profile?.role === "super_admin" ? (
                                    <Button
                                        variant="contained"
                                        onClick={saveFinancialYear}
                                        disabled={!canSetFinancialYear || saving}
                                        sx={{ width: { xs: "100%", sm: "fit-content" } }}
                                    >
                                        {settings.locked ? "Financial Year Locked" : saving ? "Saving..." : "Set Financial Year"}
                                    </Button>
                                ) : (
                                    <Alert severity="info" variant="outlined">
                                        Branch manager view is read-only. The configured year is applied automatically on dashboard and report date presets.
                                    </Alert>
                                )}
                            </Stack>
                        </CardContent>
                    </MotionCard>
                </Grid>

                <Grid size={{ xs: 12, lg: 5 }}>
                    <MotionCard variant="outlined" inView sx={{ height: "100%" }}>
                        <CardContent>
                            <Stack spacing={1.5}>
                                <Typography variant="h6">Governance</Typography>
                                <Stack spacing={1}>
                                    <Stack direction="row" justifyContent="space-between" gap={1.5}>
                                        <Typography variant="body2" color="text.secondary">Current year start</Typography>
                                        <Typography variant="subtitle2">{period.startLabel}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" gap={1.5}>
                                        <Typography variant="body2" color="text.secondary">Current year end</Typography>
                                        <Typography variant="subtitle2">{period.endLabel}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" gap={1.5}>
                                        <Typography variant="body2" color="text.secondary">Configured</Typography>
                                        <Typography variant="subtitle2">
                                            {settings.financial_year_configured_at ? formatDate(settings.financial_year_configured_at) : "Pending"}
                                        </Typography>
                                    </Stack>
                                </Stack>
                                <Alert severity={settings.locked ? "success" : "warning"} variant="outlined">
                                    {settings.locked
                                        ? "This setting is locked. Changing it later should be handled as a controlled financial migration."
                                        : "Set this once before relying on year-to-date dashboards and statutory packs."}
                                </Alert>
                            </Stack>
                        </CardContent>
                    </MotionCard>
                </Grid>
            </Grid>

            <MotionCard variant="outlined" inView>
                <CardContent>
                    <Stack spacing={2.25}>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
                            <Stack spacing={0.75}>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                    <TrackChangesRoundedIcon color="primary" />
                                    <Typography variant="h5">Performance Target Engine</Typography>
                                    <Chip
                                        label={performanceSettings.performance_target_enabled ? "Enabled" : "Disabled"}
                                        color={performanceSettings.performance_target_enabled ? "success" : "default"}
                                        variant="outlined"
                                    />
                                </Stack>
                                <Typography variant="body2" color="text.secondary">
                                    These tenant rules drive the branch performance table and each member portal target status.
                                </Typography>
                            </Stack>
                            <Chip
                                label={`Configured ${performanceSettings.performance_target_configured_at ? formatDate(performanceSettings.performance_target_configured_at) : "with defaults"}`}
                                variant="outlined"
                            />
                        </Stack>

                        <Grid container spacing={1.5}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Actual source"
                                    value={performanceDraft.performance_target_actual_source}
                                    onChange={(event) => setPerformanceDraft((current) => ({
                                        ...current,
                                        performance_target_actual_source: event.target.value as SaccoPerformanceTargetSettings["performance_target_actual_source"]
                                    }))}
                                    disabled={!canSetPerformanceTarget || savingPerformance}
                                    helperText={performanceActualSourceOptions.find((option) => option.value === performanceDraft.performance_target_actual_source)?.helper}
                                >
                                    {performanceActualSourceOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Member target source"
                                    value={performanceDraft.performance_target_member_target_source}
                                    onChange={(event) => setPerformanceDraft((current) => ({
                                        ...current,
                                        performance_target_member_target_source: event.target.value as SaccoPerformanceTargetSettings["performance_target_member_target_source"]
                                    }))}
                                    disabled={!canSetPerformanceTarget || savingPerformance}
                                    helperText={performanceMemberTargetSourceOptions.find((option) => option.value === performanceDraft.performance_target_member_target_source)?.helper}
                                >
                                    {performanceMemberTargetSourceOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="On-track threshold %"
                                    value={performanceDraft.performance_target_on_track_percent}
                                    onChange={(event) => setPerformanceDraft((current) => ({
                                        ...current,
                                        performance_target_on_track_percent: Math.max(Number(event.target.value) || 0, 0)
                                    }))}
                                    disabled={!canSetPerformanceTarget || savingPerformance}
                                    helperText="Excel context uses 60% as on track."
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Default annual target"
                                    value={performanceDraft.performance_target_default_annual_amount}
                                    onChange={(event) => setPerformanceDraft((current) => ({
                                        ...current,
                                        performance_target_default_annual_amount: Math.max(Number(event.target.value) || 0, 0)
                                    }))}
                                    disabled={!canSetPerformanceTarget || savingPerformance}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Needed amount"
                                    value={performanceDraft.performance_target_required_amount}
                                    onChange={(event) => setPerformanceDraft((current) => ({
                                        ...current,
                                        performance_target_required_amount: Math.max(Number(event.target.value) || 0, 0)
                                    }))}
                                    disabled={!canSetPerformanceTarget || savingPerformance}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Box sx={{ height: "100%", p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={performanceDraft.performance_target_enabled}
                                                onChange={(event) => setPerformanceDraft((current) => ({
                                                    ...current,
                                                    performance_target_enabled: event.target.checked
                                                }))}
                                                disabled={!canSetPerformanceTarget || savingPerformance}
                                            />
                                        }
                                        label="Enable member target tracking"
                                    />
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        When enabled, the dashboard, reports, and member portal use this target engine.
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems={{ xs: "stretch", sm: "center" }}>
                            <Button
                                variant="contained"
                                onClick={savePerformanceTarget}
                                disabled={!canSetPerformanceTarget || savingPerformance}
                                sx={{ width: { xs: "100%", sm: "fit-content" } }}
                            >
                                {savingPerformance ? "Saving..." : "Save Performance Target"}
                            </Button>
                            {!canSetPerformanceTarget ? (
                                <Alert severity="info" variant="outlined" sx={{ py: 0.25 }}>
                                    This setting is read-only for your role.
                                </Alert>
                            ) : null}
                        </Stack>

                        <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                            <Stack spacing={1.5}>
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                        Import Member Targets
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Upload CSV targets by member ID. Required columns: member_no and annual_target. Excel-style ID and Annual Target headers are also accepted.
                                    </Typography>
                                </Box>

                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems={{ xs: "stretch", sm: "center" }} flexWrap="wrap" useFlexGap>
                                    <Button
                                        component="label"
                                        variant="outlined"
                                        disabled={!canSetPerformanceTarget || importingTargets}
                                    >
                                        Choose CSV
                                        <input hidden type="file" accept=".csv,text/csv" onChange={handleTargetFileChange} />
                                    </Button>
                                    <Button
                                        variant="text"
                                        onClick={() => window.open("/member-performance-targets-template.csv", "_blank", "noopener,noreferrer")}
                                    >
                                        Download Template
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={importPerformanceTargets}
                                        disabled={!canSetPerformanceTarget || !targetImportFile || importingTargets}
                                    >
                                        {importingTargets ? "Importing..." : "Import Targets"}
                                    </Button>
                                    {targetImportFile ? (
                                        <Chip label={targetImportFile.name} variant="outlined" />
                                    ) : null}
                                </Stack>

                                {targetImportResult ? (
                                    <Stack spacing={1}>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                            <Chip label={`${targetImportResult.updated_rows} updated`} color="success" variant="outlined" />
                                            <Chip label={`${targetImportResult.failed_rows} failed`} color={targetImportResult.failed_rows ? "warning" : "success"} variant="outlined" />
                                            <Chip label={`${targetImportResult.total_rows} total rows`} variant="outlined" />
                                        </Stack>

                                        {targetImportResult.rows.length ? (
                                            <Box sx={{ maxHeight: 260, overflow: "auto", border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                                                {targetImportResult.rows.slice(0, 25).map((row) => (
                                                    <Stack
                                                        key={`${row.row_number}-${row.member_no || "row"}`}
                                                        direction={{ xs: "column", md: "row" }}
                                                        spacing={1}
                                                        justifyContent="space-between"
                                                        sx={{
                                                            px: 1.25,
                                                            py: 1,
                                                            borderBottom: "1px solid",
                                                            borderColor: "divider",
                                                            "&:last-of-type": { borderBottom: 0 }
                                                        }}
                                                    >
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                                                Row {row.row_number} · {row.member_no || "No member no"}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {row.full_name || row.error || "Member target row"}
                                                            </Typography>
                                                        </Box>
                                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                                            {row.status === "success" ? (
                                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                                    {formatCurrency(row.new_target || 0)}
                                                                </Typography>
                                                            ) : (
                                                                <Typography variant="body2" color="error.main" sx={{ fontWeight: 700 }}>
                                                                    {row.error}
                                                                </Typography>
                                                            )}
                                                            <Chip
                                                                size="small"
                                                                label={row.status}
                                                                color={row.status === "success" ? "success" : "warning"}
                                                                variant="outlined"
                                                            />
                                                        </Stack>
                                                    </Stack>
                                                ))}
                                            </Box>
                                        ) : null}
                                    </Stack>
                                ) : null}
                            </Stack>
                        </Box>
                    </Stack>
                </CardContent>
            </MotionCard>
        </Stack>
    );
}
