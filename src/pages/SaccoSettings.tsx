import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import {
    Alert,
    Box,
    Button,
    CardContent,
    Chip,
    Grid,
    MenuItem,
    Stack,
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
    type SaccoFinancialYearSettingsResponse,
    type UpdateSaccoFinancialYearSettingsRequest
} from "../lib/endpoints";
import type { SaccoFinancialYearSettings } from "../types/api";
import { MotionCard } from "../ui/motion";
import {
    DEFAULT_SACCO_FINANCIAL_YEAR_SETTINGS,
    MONTH_OPTIONS,
    normalizeSaccoFinancialYearSettings,
    resolveFinancialYearPeriod
} from "../utils/financialYear";
import { formatDate } from "../utils/format";

export function SaccoSettingsPage() {
    const { profile, selectedTenantId, selectedTenantName } = useAuth();
    const { pushToast } = useToast();
    const [settings, setSettings] = useState<SaccoFinancialYearSettings>(DEFAULT_SACCO_FINANCIAL_YEAR_SETTINGS);
    const [draft, setDraft] = useState({
        financial_year_start_month: DEFAULT_SACCO_FINANCIAL_YEAR_SETTINGS.financial_year_start_month,
        financial_year_start_day: DEFAULT_SACCO_FINANCIAL_YEAR_SETTINGS.financial_year_start_day
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSetFinancialYear = profile?.role === "super_admin" && !settings.locked;
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
                const { data } = await api.get<SaccoFinancialYearSettingsResponse>(endpoints.saccoSettings.financialYear(), {
                    params: { tenant_id: selectedTenantId }
                });

                if (!isActive) {
                    return;
                }

                const normalized = normalizeSaccoFinancialYearSettings(data.data);
                setSettings(normalized);
                setDraft({
                    financial_year_start_month: normalized.financial_year_start_month,
                    financial_year_start_day: normalized.financial_year_start_day
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
        </Stack>
    );
}
