import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import PieChartRoundedIcon from "@mui/icons-material/PieChartRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
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
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { AppLoader } from "../components/AppLoader";
import { useToast } from "../components/Toast";
import { api, getApiErrorMessage } from "../lib/api";
import {
    endpoints,
    type MemberPerformanceTargetImportResponse,
    type SaccoFinancialYearSettingsResponse,
    type SaccoPerformanceTargetSettingsResponse,
    type SaccoManualImportsSettingsResponse,
    type UpdateSaccoFinancialYearSettingsRequest,
    type UpdateSaccoPerformanceTargetSettingsRequest,
    type UpdateSaccoManualImportsSettingsRequest,
    type GuarantorPolicySettings,
    type GuarantorPolicySettingsResponse,
    type UpdateGuarantorPolicyRequest,
    type LoanMultiplierSettings,
    type LoanMultiplierSettingsResponse,
    type UpdateLoanMultiplierRequest,
    type ShareCapitalSettings,
    type ShareCapitalSettingsResponse,
    type AddSharePriceRequest
} from "../lib/endpoints";
import type { SaccoFinancialYearSettings, SaccoManualImportsSettings, SaccoPerformanceTargetSettings } from "../types/api";
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
    { value: "available_savings", label: "Available savings only", helper: "Excludes locked savings balances." }
] as const;

const performanceMemberTargetSourceOptions = [
    { value: "notes_or_member_field", label: "Imported target, then notes/default", helper: "Uses imported member target first, then notes or profile field, then tenant default." },
    { value: "member_field", label: "Imported/profile target", helper: "Uses imported member target first, then the member profile commitment value." },
    { value: "member_field_annualized", label: "Imported or monthly x 12", helper: "Uses imported member target first, then annualizes monthly commitment." },
    { value: "tenant_default", label: "Imported or tenant default", helper: "Uses imported member target first; members without one use the tenant default." }
] as const;

// A round figure to make the multiple concrete on screen. Nothing reads it back;
// it only illustrates the number being typed.
const LOAN_MULTIPLIER_EXAMPLE_SAVINGS = 1_000_000;

export function SaccoSettingsPage() {
    const { profile, selectedTenantId, selectedTenantName } = useAuth();
    const navigate = useNavigate();
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
    const [manualImports, setManualImports] = useState<SaccoManualImportsSettings | null>(null);
    const [manualImportsDraft, setManualImportsDraft] = useState(true);
    const [savingManualImports, setSavingManualImports] = useState(false);
    const [guarantorPolicy, setGuarantorPolicy] = useState<GuarantorPolicySettings | null>(null);
    const [guarantorDraft, setGuarantorDraft] = useState({
        guarantor_exposure_enforced: true,
        guarantor_max_commitment_percent: 40,
        guarantor_capacity_base: "savings" as "savings" | "savings_shares",
        max_guarantors_per_application: 5,
        guarantor_release_mode: "on_close" as "on_close" | "proportional",
        guarantor_block_encumbered_withdrawals: true
    });
    const [savingGuarantorPolicy, setSavingGuarantorPolicy] = useState(false);
    const [loanMultiplier, setLoanMultiplier] = useState<LoanMultiplierSettings | null>(null);
    const [loanMultiplierDraft, setLoanMultiplierDraft] = useState("");
    const [savingLoanMultiplier, setSavingLoanMultiplier] = useState(false);
    const [shareCapital, setShareCapital] = useState<ShareCapitalSettings | null>(null);
    const [shareDraft, setShareDraft] = useState({
        price_per_share: "",
        required_shares: "",
        effective_from: "",
        note: ""
    });
    const [savingSharePrice, setSavingSharePrice] = useState(false);
    const [savingShareBase, setSavingShareBase] = useState(false);
    const [shareCapitalError, setShareCapitalError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingPerformance, setSavingPerformance] = useState(false);
    const [targetImportFile, setTargetImportFile] = useState<File | null>(null);
    const [importingTargets, setImportingTargets] = useState(false);
    const [targetImportResult, setTargetImportResult] = useState<MemberPerformanceTargetImportResponse["data"] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const canSetFinancialYear = profile?.role === "super_admin" && !settings.locked;
    const canSetPerformanceTarget = profile?.role === "super_admin" || profile?.role === "branch_manager";
    const canSetManualImports = profile?.role === "super_admin";
    // Rewrites the borrowing limit on every product at once, so it stays with
    // the super admin even though a branch manager may set guarantor policy.
    const canSetLoanMultiplier = profile?.role === "super_admin";
    const canSetShareCapital = profile?.role === "super_admin";
    const sharePreview = useMemo(() => {
        const price = Number(shareDraft.price_per_share);
        const shares = Number(shareDraft.required_shares);
        return Number.isFinite(price) && price > 0 && Number.isInteger(shares) && shares > 0
            ? price * shares
            : null;
    }, [shareDraft.price_per_share, shareDraft.required_shares]);
    const loanMultiplierPreview = useMemo(() => {
        const parsed = Number(loanMultiplierDraft);
        return loanMultiplierDraft.trim() && Number.isFinite(parsed) && parsed >= 0
            ? parsed * LOAN_MULTIPLIER_EXAMPLE_SAVINGS
            : null;
    }, [loanMultiplierDraft]);
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
                const [
                    financialYearResult,
                    performanceTargetResult,
                    manualImportsResult,
                    guarantorPolicyResult,
                    loanMultiplierResult,
                    shareCapitalResult
                ] = await Promise.all([
                    api.get<SaccoFinancialYearSettingsResponse>(endpoints.saccoSettings.financialYear(), {
                        params: { tenant_id: selectedTenantId }
                    }),
                    api.get<SaccoPerformanceTargetSettingsResponse>(endpoints.saccoSettings.performanceTarget(), {
                        params: { tenant_id: selectedTenantId }
                    }),
                    api.get<SaccoManualImportsSettingsResponse>(endpoints.saccoSettings.manualImports(), {
                        params: { tenant_id: selectedTenantId }
                    }).catch(() => null),
                    api.get<GuarantorPolicySettingsResponse>(endpoints.saccoSettings.guarantorPolicy(), {
                        params: { tenant_id: selectedTenantId }
                    }).catch(() => null),
                    api.get<LoanMultiplierSettingsResponse>(endpoints.saccoSettings.loanMultiplier(), {
                        params: { tenant_id: selectedTenantId }
                    }).catch(() => null),
                    api.get<ShareCapitalSettingsResponse>(endpoints.saccoSettings.shareCapital(), {
                        params: { tenant_id: selectedTenantId }
                    }).catch((shareError) => {
                        // Not discarded. When this read fails the whole Share
                        // Capital card silently empties — price, history and the
                        // borrowing-base switch all vanish at once — and the
                        // screen looks as though the feature was never built.
                        setShareCapitalError(getApiErrorMessage(shareError));
                        return null;
                    })
                ]);

                if (!isActive) {
                    return;
                }

                const normalized = normalizeSaccoFinancialYearSettings(financialYearResult.data.data);
                const normalizedPerformance = normalizeSaccoPerformanceTargetSettings(performanceTargetResult.data.data);
                setSettings(normalized);
                setPerformanceSettings(normalizedPerformance);
                if (manualImportsResult?.data?.data) {
                    setManualImports(manualImportsResult.data.data);
                    setManualImportsDraft(manualImportsResult.data.data.manual_imports_enabled);
                }
                if (guarantorPolicyResult?.data?.data) {
                    const policyData = guarantorPolicyResult.data.data;
                    setGuarantorPolicy(policyData);
                    setGuarantorDraft({
                        guarantor_exposure_enforced: policyData.guarantor_exposure_enforced,
                        guarantor_max_commitment_percent: Math.round(policyData.guarantor_max_commitment_ratio * 100),
                        guarantor_capacity_base: policyData.guarantor_capacity_base,
                        max_guarantors_per_application: policyData.max_guarantors_per_application,
                        guarantor_release_mode: policyData.guarantor_release_mode,
                        guarantor_block_encumbered_withdrawals: policyData.guarantor_block_encumbered_withdrawals
                    });
                }
                if (loanMultiplierResult?.data?.data) {
                    const multiplierData = loanMultiplierResult.data.data;
                    setLoanMultiplier(multiplierData);
                    // Left blank when products disagree, so the admin has to type
                    // the number they mean rather than accept a prefilled guess.
                    setLoanMultiplierDraft(multiplierData.multiplier === null ? "" : String(multiplierData.multiplier));
                }
                if (shareCapitalResult?.data?.data) {
                    const shareData = shareCapitalResult.data.data;
                    setShareCapital(shareData);
                    setShareCapitalError(null);
                    // The share count carries over — a price rise rarely changes
                    // how many shares a member must hold — but the price and the
                    // date are what the board is here to decide, so they start
                    // blank rather than pre-filled with what is being replaced.
                    setShareDraft({
                        price_per_share: "",
                        required_shares: shareData.current
                            ? String(shareData.current.required_shares)
                            : "",
                        effective_from: "",
                        note: ""
                    });
                }
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

    const saveManualImports = async () => {
        if (!selectedTenantId) {
            setError("Select a tenant before saving SACCO settings.");
            return;
        }

        setSavingManualImports(true);
        setError(null);

        try {
            const payload: UpdateSaccoManualImportsSettingsRequest = {
                tenant_id: selectedTenantId,
                manual_imports_enabled: manualImportsDraft
            };
            const { data } = await api.patch<SaccoManualImportsSettingsResponse>(endpoints.saccoSettings.manualImports(), payload);

            setManualImports(data.data);
            setManualImportsDraft(data.data.manual_imports_enabled);
            pushToast({
                type: "success",
                title: "Manual imports updated",
                message: data.data.manual_imports_enabled
                    ? "Branch managers can use the manual data importers."
                    : "Manual data importers are now hidden from branch managers."
            });
        } catch (saveError) {
            setError(getApiErrorMessage(saveError));
        } finally {
            setSavingManualImports(false);
        }
    };

    const saveGuarantorPolicy = async () => {
        if (!selectedTenantId) {
            setError("Select a tenant before saving SACCO settings.");
            return;
        }

        setSavingGuarantorPolicy(true);
        setError(null);

        try {
            const payload: UpdateGuarantorPolicyRequest = {
                tenant_id: selectedTenantId,
                guarantor_exposure_enforced: guarantorDraft.guarantor_exposure_enforced,
                guarantor_max_commitment_ratio: Math.min(1, Math.max(0.01, guarantorDraft.guarantor_max_commitment_percent / 100)),
                guarantor_capacity_base: guarantorDraft.guarantor_capacity_base,
                max_guarantors_per_application: guarantorDraft.max_guarantors_per_application,
                guarantor_release_mode: guarantorDraft.guarantor_release_mode,
                guarantor_block_encumbered_withdrawals: guarantorDraft.guarantor_block_encumbered_withdrawals
            };
            const { data } = await api.patch<GuarantorPolicySettingsResponse>(endpoints.saccoSettings.guarantorPolicy(), payload);
            setGuarantorPolicy(data.data);
            pushToast({
                type: "success",
                title: "Guarantor policy saved",
                message: `Guarantors can now commit up to ${Math.round(data.data.guarantor_max_commitment_ratio * 100)}% of ${data.data.guarantor_capacity_base === "savings" ? "their savings" : "savings + shares"}.`
            });
        } catch (saveError) {
            setError(getApiErrorMessage(saveError));
        } finally {
            setSavingGuarantorPolicy(false);
        }
    };

    const saveLoanMultiplier = async () => {
        if (!selectedTenantId) {
            setError("Select a tenant before saving SACCO settings.");
            return;
        }

        const parsed = Number(loanMultiplierDraft);
        if (!loanMultiplierDraft.trim() || !Number.isFinite(parsed) || parsed < 0 || parsed > 20) {
            setError("Enter a borrowing multiple between 0 and 20.");
            return;
        }

        setSavingLoanMultiplier(true);
        setError(null);

        try {
            const payload: UpdateLoanMultiplierRequest = { tenant_id: selectedTenantId, multiplier: parsed };
            const { data } = await api.patch<LoanMultiplierSettingsResponse>(endpoints.saccoSettings.loanMultiplier(), payload);
            setLoanMultiplier(data.data);
            setLoanMultiplierDraft(data.data.multiplier === null ? "" : String(data.data.multiplier));
            pushToast({
                type: "success",
                title: "Borrowing multiple saved",
                message: `Members can borrow up to ${parsed}× their savings, across ${data.data.product_count} loan product${data.data.product_count === 1 ? "" : "s"}.`
            });
        } catch (saveError) {
            setError(getApiErrorMessage(saveError));
        } finally {
            setSavingLoanMultiplier(false);
        }
    };

    const addSharePrice = async () => {
        if (!selectedTenantId) {
            setError("Select a tenant before saving SACCO settings.");
            return;
        }

        const price = Number(shareDraft.price_per_share);
        const shares = Number(shareDraft.required_shares);

        if (!Number.isFinite(price) || price <= 0) {
            setError("Enter the price of one share.");
            return;
        }
        if (!Number.isInteger(shares) || shares < 0) {
            setError("Enter how many whole shares a member must hold.");
            return;
        }
        if (!shareDraft.effective_from) {
            setError("Enter the date this price takes effect.");
            return;
        }

        setSavingSharePrice(true);
        setError(null);

        try {
            const payload: AddSharePriceRequest = {
                tenant_id: selectedTenantId,
                price_per_share: price,
                required_shares: shares,
                effective_from: shareDraft.effective_from,
                note: shareDraft.note.trim() || undefined
            };
            const { data } = await api.post<ShareCapitalSettingsResponse>(
                endpoints.saccoSettings.shareCapital(),
                payload
            );
            setShareCapital(data.data);
            setShareDraft({
                price_per_share: "",
                required_shares: String(shares),
                effective_from: "",
                note: ""
            });
            pushToast({
                type: "success",
                title: "Share price recorded",
                message: `${formatCurrency(price)} per share × ${shares} = ${formatCurrency(price * shares)} per member, from ${formatDate(shareDraft.effective_from)}.`
            });
        } catch (saveError) {
            setError(getApiErrorMessage(saveError));
        } finally {
            setSavingSharePrice(false);
        }
    };

    const setShareCountsAsSavings = async (next: boolean) => {
        if (!selectedTenantId) return;

        setSavingShareBase(true);
        setError(null);

        try {
            const { data } = await api.patch<ShareCapitalSettingsResponse>(
                endpoints.saccoSettings.shareCapitalCountsAsSavings(),
                { tenant_id: selectedTenantId, counts_as_savings: next }
            );
            setShareCapital(data.data);
            pushToast({
                type: "success",
                title: next ? "Share capital counts as savings" : "Share capital no longer counts",
                message: next
                    ? "Borrowing limits are unchanged by the move out of savings."
                    : "Every member's limit now drops by their share capital times the loan multiple."
            });
        } catch (saveError) {
            setError(getApiErrorMessage(saveError));
        } finally {
            setSavingShareBase(false);
        }
    };

    const removeSharePrice = async (priceId: string) => {
        if (!selectedTenantId) return;

        setSavingSharePrice(true);
        setError(null);

        try {
            const { data } = await api.delete<ShareCapitalSettingsResponse>(
                endpoints.saccoSettings.shareCapitalPrice(priceId),
                { params: { tenant_id: selectedTenantId } }
            );
            setShareCapital(data.data);
            pushToast({ type: "success", title: "Share price removed", message: "The history has been updated." });
        } catch (saveError) {
            setError(getApiErrorMessage(saveError));
        } finally {
            setSavingSharePrice(false);
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
                { headers: { "Content-Type": "multipart/form-data" }, timeout: 0 }
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

            <MotionCard variant="outlined" inView>
                <CardContent>
                    <Stack spacing={2}>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
                            <Stack spacing={0.75}>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                    <UploadFileRoundedIcon color="primary" />
                                    <Typography variant="h5">Manual Data Imports</Typography>
                                    <Chip
                                        label={manualImportsDraft ? "Visible to branch managers" : "Hidden from branch managers"}
                                        color={manualImportsDraft ? "success" : "default"}
                                        variant="outlined"
                                    />
                                </Stack>
                                <Typography variant="body2" color="text.secondary">
                                    The bulk savings-history, loan-history, loan-repayment, and dividend importers were built to bootstrap legacy data. Turn this off once that migration is complete so branch managers record ongoing activity through the normal forms.
                                </Typography>
                            </Stack>
                            {manualImports?.manual_imports_configured_at ? (
                                <Chip label={`Updated ${formatDate(manualImports.manual_imports_configured_at)}`} variant="outlined" />
                            ) : null}
                        </Stack>

                        <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={manualImportsDraft}
                                        onChange={(event) => setManualImportsDraft(event.target.checked)}
                                        disabled={!canSetManualImports || savingManualImports}
                                    />
                                }
                                label="Allow branch managers to use manual data importers"
                            />
                            <Typography variant="caption" color="text.secondary" display="block">
                                When off, the savings-history, loan-history, loan-repayment, and dividend import cards are hidden from branch managers. Member import stays available, and super admins can always see every importer.
                            </Typography>
                        </Box>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems={{ xs: "stretch", sm: "center" }}>
                            <Button
                                variant="contained"
                                onClick={saveManualImports}
                                disabled={!canSetManualImports || savingManualImports || (manualImports ? manualImportsDraft === manualImports.manual_imports_enabled : false)}
                                sx={{ width: { xs: "100%", sm: "fit-content" } }}
                            >
                                {savingManualImports ? "Saving..." : "Save Import Visibility"}
                            </Button>
                            {!canSetManualImports ? (
                                <Alert severity="info" variant="outlined" sx={{ py: 0.25 }}>
                                    This setting is read-only for your role.
                                </Alert>
                            ) : null}
                        </Stack>
                    </Stack>
                </CardContent>
            </MotionCard>

            <MotionCard variant="outlined" inView>
                <CardContent>
                    <Stack spacing={2}>
                        <Stack spacing={0.75}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                <PieChartRoundedIcon color="primary" />
                                <Typography variant="h5">Share Capital</Typography>
                                <Chip
                                    label={shareCapital?.current
                                        ? `${formatCurrency(shareCapital.current.total_required)} per member`
                                        : "Not set"}
                                    color={shareCapital?.current ? "success" : "warning"}
                                    variant="outlined"
                                />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                                What one share costs and how many a member must hold. Recorded as a dated history, so a member who joined under an older price can still be shown the price that applied to them.
                            </Typography>
                        </Stack>

                        {shareCapital?.current ? (
                            <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    In force since {formatDate(shareCapital.current.effective_from)}
                                </Typography>
                                <Typography variant="body2">
                                    {formatCurrency(shareCapital.current.price_per_share)} per share
                                    {" × "}
                                    {shareCapital.current.required_shares} shares
                                    {" = "}
                                    <strong>{formatCurrency(shareCapital.current.total_required)}</strong> per member
                                </Typography>
                                {shareCapital.last_change ? (
                                    <Typography variant="caption" color="text.secondary">
                                        Rose from {formatCurrency(shareCapital.last_change.from_price)} to {formatCurrency(shareCapital.last_change.to_price)} per share on {formatDate(shareCapital.last_change.effective_from)}.
                                    </Typography>
                                ) : null}
                            </Box>
                        ) : (
                            <Alert severity="warning" variant="outlined">
                                No share price has been recorded, so nothing can quote what a member owes in share capital. Add the current price below.
                            </Alert>
                        )}

                        {shareCapitalError ? (
                            <Alert severity="error" variant="outlined">
                                Couldn't load share capital settings — {shareCapitalError}
                            </Alert>
                        ) : null}

                        {shareCapital ? (
                            <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={shareCapital.counts_as_savings}
                                            onChange={(event) => setShareCountsAsSavings(event.target.checked)}
                                            disabled={!canSetShareCapital || savingShareBase}
                                        />
                                    }
                                    label="Count share capital as savings when working out borrowing limits"
                                />
                                <Typography variant="caption" color="text.secondary" display="block">
                                    {shareCapital.counts_as_savings
                                        ? "On — limits are the same as before share capital was moved out of savings."
                                        : "Off — each member's limit is lower by their share capital times the loan multiple."}
                                </Typography>
                            </Box>
                        ) : null}

                        {shareCapital && shareCapital.upcoming.length > 0 ? (
                            <Alert severity="info" variant="outlined">
                                {shareCapital.upcoming.map((row) => (
                                    <div key={row.id}>
                                        From {formatDate(row.effective_from)}: {formatCurrency(row.price_per_share)} per share × {row.required_shares} = {formatCurrency(row.total_required)} per member.
                                    </div>
                                ))}
                            </Alert>
                        ) : null}

                        {shareCapital && shareCapital.history.length > 0 ? (
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    How the price has moved
                                </Typography>
                                <Stack spacing={0.5}>
                                    {shareCapital.history.map((row) => (
                                        <Stack
                                            key={row.id}
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            flexWrap="wrap"
                                            useFlexGap
                                            sx={{ py: 0.5, borderBottom: "1px dashed", borderColor: "divider" }}
                                        >
                                            <Typography variant="body2" sx={{ minWidth: 110 }}>
                                                {formatDate(row.effective_from)}
                                            </Typography>
                                            <Typography variant="body2" sx={{ flexGrow: 1 }}>
                                                {formatCurrency(row.price_per_share)} × {row.required_shares}
                                                {" = "}
                                                <strong>{formatCurrency(row.total_required)}</strong>
                                                {row.note ? ` — ${row.note}` : ""}
                                            </Typography>
                                            {canSetShareCapital && shareCapital.history.length > 1 ? (
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    disabled={savingSharePrice}
                                                    onClick={() => removeSharePrice(row.id)}
                                                >
                                                    Remove
                                                </Button>
                                            ) : null}
                                        </Stack>
                                    ))}
                                </Stack>
                            </Box>
                        ) : null}

                        <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Move share capital out of savings
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Share capital is collected into savings, so a member's share account stays at zero until it is moved across. The transfer page shows what each member still owes before anything is posted.
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => navigate("/finance/share-capital-transfer")}
                            >
                                Open Share Capital Transfer
                            </Button>
                        </Box>

                        <Typography variant="subtitle2">Raise the price</Typography>
                        <Grid container spacing={1.5}>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Price per share"
                                    value={shareDraft.price_per_share}
                                    onChange={(event) => setShareDraft((prev) => ({
                                        ...prev,
                                        price_per_share: event.target.value
                                    }))}
                                    disabled={!canSetShareCapital || savingSharePrice}
                                    helperText="e.g. 150000"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Shares required"
                                    value={shareDraft.required_shares}
                                    onChange={(event) => setShareDraft((prev) => ({
                                        ...prev,
                                        required_shares: event.target.value
                                    }))}
                                    disabled={!canSetShareCapital || savingSharePrice}
                                    helperText={sharePreview === null ? "Whole shares only" : `= ${formatCurrency(sharePreview)} per member`}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Takes effect from"
                                    value={shareDraft.effective_from}
                                    onChange={(event) => setShareDraft((prev) => ({
                                        ...prev,
                                        effective_from: event.target.value
                                    }))}
                                    disabled={!canSetShareCapital || savingSharePrice}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                    helperText="A future date schedules the rise"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Note (optional)"
                                    value={shareDraft.note}
                                    onChange={(event) => setShareDraft((prev) => ({
                                        ...prev,
                                        note: event.target.value
                                    }))}
                                    disabled={!canSetShareCapital || savingSharePrice}
                                    helperText="e.g. AGM resolution"
                                />
                            </Grid>
                        </Grid>

                        <Button
                            variant="contained"
                            onClick={addSharePrice}
                            disabled={!canSetShareCapital || savingSharePrice}
                            sx={{ width: { xs: "100%", sm: "fit-content" } }}
                        >
                            {savingSharePrice ? "Saving..." : "Record Share Price"}
                        </Button>
                        {!canSetShareCapital ? (
                            <Alert severity="info" variant="outlined" sx={{ py: 0.25 }}>
                                This setting is read-only for your role.
                            </Alert>
                        ) : null}
                    </Stack>
                </CardContent>
            </MotionCard>

            <MotionCard variant="outlined" inView>
                <CardContent>
                    <Stack spacing={2}>
                        <Stack spacing={0.75}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                <TrendingUpRoundedIcon color="primary" />
                                <Typography variant="h5">Borrowing Multiple</Typography>
                                <Chip
                                    label={loanMultiplier?.multiplier != null
                                        ? `${loanMultiplier.multiplier}× savings`
                                        : "Products vary"}
                                    color={loanMultiplier?.multiplier != null ? "success" : "warning"}
                                    variant="outlined"
                                />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                                How many times their savings a member may owe. Saving applies the number to every loan product at once, so the limit the engine enforces and the one the member portal quotes stay the same figure.
                            </Typography>
                        </Stack>

                        <Grid container spacing={1.5} alignItems="flex-start">
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Times savings"
                                    value={loanMultiplierDraft}
                                    onChange={(event) => setLoanMultiplierDraft(event.target.value)}
                                    disabled={!canSetLoanMultiplier || savingLoanMultiplier}
                                    helperText="e.g. 3 = borrow up to three times savings"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 9 }}>
                                <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        What this means for a member
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {loanMultiplierPreview === null
                                            ? "Enter a number to see the limit it produces."
                                            : `A member with ${formatCurrency(LOAN_MULTIPLIER_EXAMPLE_SAVINGS)} in savings could owe up to ${formatCurrency(loanMultiplierPreview)} in total.`}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Savings pledged to guarantee other members are deducted first, and the cap covers everything a member already owes — not each loan separately. Product maximums and branch liquidity can still bring the figure down.
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>

                        {loanMultiplier && !loanMultiplier.is_uniform ? (
                            <Alert severity="warning" variant="outlined">
                                Active loan products currently disagree, so there is no single SACCO rule in force. Saving below sets them all to the same number.
                            </Alert>
                        ) : null}

                        {loanMultiplier && loanMultiplier.products.length > 0 ? (
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Applies to {loanMultiplier.product_count} loan product{loanMultiplier.product_count === 1 ? "" : "s"}
                                </Typography>
                                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                    {loanMultiplier.products.map((product) => (
                                        <Chip
                                            key={product.id}
                                            size="small"
                                            variant="outlined"
                                            color={product.status === "active" ? "default" : "warning"}
                                            label={`${product.name} · ${product.effective_multiplier}×`}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        ) : null}

                        <Button
                            variant="contained"
                            onClick={saveLoanMultiplier}
                            disabled={!canSetLoanMultiplier || savingLoanMultiplier || !loanMultiplier}
                            sx={{ width: { xs: "100%", sm: "fit-content" } }}
                        >
                            {savingLoanMultiplier ? "Saving..." : "Save Borrowing Multiple"}
                        </Button>
                        {!canSetLoanMultiplier ? (
                            <Alert severity="info" variant="outlined" sx={{ py: 0.25 }}>
                                This setting is read-only for your role.
                            </Alert>
                        ) : null}
                    </Stack>
                </CardContent>
            </MotionCard>

            <MotionCard variant="outlined" inView>
                <CardContent>
                    <Stack spacing={2}>
                        <Stack spacing={0.75}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                <Diversity3RoundedIcon color="primary" />
                                <Typography variant="h5">Guarantor Policy</Typography>
                                <Chip
                                    label={guarantorDraft.guarantor_exposure_enforced ? "Enforced" : "Not enforced"}
                                    color={guarantorDraft.guarantor_exposure_enforced ? "success" : "warning"}
                                    variant="outlined"
                                />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                                Loan applicants tag guarantors who must accept in their portal before verification. A guarantor's capacity is limited to the percentage below of their {guarantorDraft.guarantor_capacity_base === "savings" ? "savings" : "savings + shares"}, minus what they already guarantee for others.
                            </Typography>
                        </Stack>

                        <Grid container spacing={1.5}>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Capacity percentage (%)"
                                    value={guarantorDraft.guarantor_max_commitment_percent}
                                    onChange={(event) => setGuarantorDraft((prev) => ({
                                        ...prev,
                                        guarantor_max_commitment_percent: Number(event.target.value) || 0
                                    }))}
                                    helperText="e.g. 40 = a guarantor may commit up to 40%"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Capacity base"
                                    value={guarantorDraft.guarantor_capacity_base}
                                    onChange={(event) => setGuarantorDraft((prev) => ({
                                        ...prev,
                                        guarantor_capacity_base: event.target.value as "savings" | "savings_shares"
                                    }))}
                                >
                                    <MenuItem value="savings">Savings only</MenuItem>
                                    <MenuItem value="savings_shares">Savings + shares</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Max guarantors per loan"
                                    value={guarantorDraft.max_guarantors_per_application}
                                    onChange={(event) => setGuarantorDraft((prev) => ({
                                        ...prev,
                                        max_guarantors_per_application: Math.min(10, Math.max(1, Number(event.target.value) || 1))
                                    }))}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Commitment released"
                                    value={guarantorDraft.guarantor_release_mode}
                                    onChange={(event) => setGuarantorDraft((prev) => ({
                                        ...prev,
                                        guarantor_release_mode: event.target.value as "on_close" | "proportional"
                                    }))}
                                >
                                    <MenuItem value="on_close">When the loan is fully repaid</MenuItem>
                                    <MenuItem value="proportional">Gradually as the loan reduces</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>

                        <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={guarantorDraft.guarantor_block_encumbered_withdrawals}
                                        onChange={(event) => setGuarantorDraft((prev) => ({
                                            ...prev,
                                            guarantor_block_encumbered_withdrawals: event.target.checked
                                        }))}
                                        disabled={savingGuarantorPolicy}
                                    />
                                }
                                label="Block withdrawals that would drop savings below guaranteed amounts"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={guarantorDraft.guarantor_exposure_enforced}
                                        onChange={(event) => setGuarantorDraft((prev) => ({
                                            ...prev,
                                            guarantor_exposure_enforced: event.target.checked
                                        }))}
                                        disabled={savingGuarantorPolicy}
                                    />
                                }
                                label="Enforce guarantor capacity limits"
                            />
                        </Box>

                        <Button
                            variant="contained"
                            onClick={saveGuarantorPolicy}
                            disabled={!canSetPerformanceTarget || savingGuarantorPolicy || !guarantorPolicy}
                            sx={{ width: { xs: "100%", sm: "fit-content" } }}
                        >
                            {savingGuarantorPolicy ? "Saving..." : "Save Guarantor Policy"}
                        </Button>
                    </Stack>
                </CardContent>
            </MotionCard>
        </Stack>
    );
}
