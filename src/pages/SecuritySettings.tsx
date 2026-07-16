import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Stack,
    Switch,
    TextField,
    Typography
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";
import { api, getApiErrorCode, getApiErrorMessage } from "../lib/api";
import {
    endpoints,
    type MemberPortalPaymentControlsResponse,
    type TwoFactorBackupCodesResponse,
    type TwoFactorDisableResponse,
    type TwoFactorSetupResponse,
    type TwoFactorValidateRequest,
    type TwoFactorValidateResponse,
    type TwoFactorVerifyResponse,
    type UpdateMemberPortalPaymentControlsRequest,
    type UpdateWorkspacePublicRegistrationSettingsRequest,
    type UpdateWorkspaceTwoFactorSettingsRequest,
    type WorkspacePublicRegistrationSettingsResponse,
    type WorkspaceTwoFactorSettingsResponse
} from "../lib/endpoints";
import type {
    MemberPortalPaymentControls,
    WorkspacePublicRegistrationSettings,
    WorkspaceTwoFactorSettings
} from "../types/api";

function buildVerificationPayload(totpCode: string, recoveryCode: string): TwoFactorValidateRequest {
    return {
        totp_code: totpCode.trim() || undefined,
        recovery_code: recoveryCode.trim() || undefined
    };
}

export function SecuritySettingsPage() {
    const { session, profile, refreshProfile, twoFactorSetupRequired } = useAuth();
    const { pushToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    // Guards the auto-setup effect so a failed setup (e.g. workspace 2FA disabled
    // by an admin) shows one error instead of retrying forever.
    const autoSetupTriedRef = useRef(false);
    const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
    const [setupCode, setSetupCode] = useState("");
    const [totpCode, setTotpCode] = useState("");
    const [recoveryCode, setRecoveryCode] = useState("");
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [memberPortalPaymentControls, setMemberPortalPaymentControls] = useState<MemberPortalPaymentControls | null>(null);
    const [memberPortalPaymentControlsLoading, setMemberPortalPaymentControlsLoading] = useState(false);
    const [memberPortalPaymentControlsSavingKey, setMemberPortalPaymentControlsSavingKey] = useState<string | null>(null);
    const [workspaceTwoFactorSettings, setWorkspaceTwoFactorSettings] = useState<WorkspaceTwoFactorSettings | null>(null);
    const [workspaceTwoFactorSettingsLoading, setWorkspaceTwoFactorSettingsLoading] = useState(false);
    const [workspaceTwoFactorSettingsSaving, setWorkspaceTwoFactorSettingsSaving] = useState(false);
    const [workspacePublicRegistrationSettings, setWorkspacePublicRegistrationSettings] = useState<WorkspacePublicRegistrationSettings | null>(null);
    const [workspacePublicRegistrationSettingsLoading, setWorkspacePublicRegistrationSettingsLoading] = useState(false);
    const [workspacePublicRegistrationSettingsSaving, setWorkspacePublicRegistrationSettingsSaving] = useState(false);

    if (!session) {
        return <Navigate to="/signin" replace />;
    }

    if (!profile) {
        return (
            <Box sx={{ maxWidth: 920, mx: "auto", p: 3 }}>
                <Alert severity="info">Security settings are available after your user profile is provisioned.</Alert>
            </Box>
        );
    }

    const twoFactorEnabled = Boolean(profile.two_factor_enabled && profile.two_factor_verified);
    const canManageMemberPortalPaymentControls = profile.role === "super_admin" && Boolean(profile.tenant_id);
    const canManageWorkspaceTwoFactor = profile.role === "super_admin" && Boolean(profile.tenant_id);
    const twoFactorWorkspaceEnabled = profile.two_factor_workspace_enabled !== false;
    const backTarget = profile.role === "member"
        ? "/portal"
        : profile.role === "treasury_officer"
            ? "/treasury"
            : "/dashboard";
    const backLabel = profile.role === "member" ? "Back to portal" : "Back to workspace";
    const setupIntent = new URLSearchParams(location.search).get("intent");

    const managementPayload = buildVerificationPayload(totpCode, recoveryCode);

    const loadMemberPortalPaymentControls = async () => {
        if (!canManageMemberPortalPaymentControls || !profile.tenant_id || twoFactorSetupRequired) {
            setMemberPortalPaymentControls(null);
            return;
        }

        setMemberPortalPaymentControlsLoading(true);
        try {
            const { data } = await api.get<MemberPortalPaymentControlsResponse>(
                endpoints.memberPortalSettings.paymentControls(),
                {
                    params: { tenant_id: profile.tenant_id }
                }
            );
            setMemberPortalPaymentControls(data.data || null);
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to load member payment controls",
                message: getApiErrorMessage(error)
            });
        } finally {
            setMemberPortalPaymentControlsLoading(false);
        }
    };

    const loadWorkspaceTwoFactorSettings = async () => {
        if (!canManageWorkspaceTwoFactor || !profile.tenant_id) {
            setWorkspaceTwoFactorSettings(null);
            return;
        }

        setWorkspaceTwoFactorSettingsLoading(true);
        try {
            const { data } = await api.get<WorkspaceTwoFactorSettingsResponse>(
                endpoints.securitySettings.twoFactor(),
                {
                    params: { tenant_id: profile.tenant_id }
                }
            );
            setWorkspaceTwoFactorSettings(data.data || null);
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to load workspace authenticator setting",
                message: getApiErrorMessage(error)
            });
        } finally {
            setWorkspaceTwoFactorSettingsLoading(false);
        }
    };

    const loadWorkspacePublicRegistrationSettings = async () => {
        if (!canManageWorkspaceTwoFactor || !profile.tenant_id) {
            setWorkspacePublicRegistrationSettings(null);
            return;
        }

        setWorkspacePublicRegistrationSettingsLoading(true);
        try {
            const { data } = await api.get<WorkspacePublicRegistrationSettingsResponse>(
                endpoints.securitySettings.publicRegistration(),
                {
                    params: { tenant_id: profile.tenant_id }
                }
            );
            setWorkspacePublicRegistrationSettings(data.data || null);
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to load public registration setting",
                message: getApiErrorMessage(error)
            });
        } finally {
            setWorkspacePublicRegistrationSettingsLoading(false);
        }
    };

    const [loanGuideDraft, setLoanGuideDraft] = useState("");
    const [loanGuideSaving, setLoanGuideSaving] = useState(false);

    useEffect(() => {
        setLoanGuideDraft(memberPortalPaymentControls?.loan_application_guide || "");
    }, [memberPortalPaymentControls?.loan_application_guide]);

    const saveLoanApplicationGuide = async () => {
        if (!canManageMemberPortalPaymentControls || !profile.tenant_id) {
            return;
        }

        setLoanGuideSaving(true);
        try {
            const payload: UpdateMemberPortalPaymentControlsRequest = {
                tenant_id: profile.tenant_id,
                loan_application_guide: loanGuideDraft.trim() || null
            };

            const { data } = await api.patch<MemberPortalPaymentControlsResponse>(
                endpoints.memberPortalSettings.paymentControls(),
                payload
            );

            setMemberPortalPaymentControls(data.data || null);
            pushToast({
                type: "success",
                title: "Loan application guide saved",
                message: loanGuideDraft.trim()
                    ? "Members now see the guide in the portal loan section."
                    : "The guide was cleared — the portal hides the section when it is empty."
            });
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to save the loan application guide",
                message: getApiErrorMessage(error)
            });
        } finally {
            setLoanGuideSaving(false);
        }
    };

    const toggleMemberPortalPaymentControl = async (
        key: "share_contribution_enabled" | "savings_deposit_enabled" | "loan_repayment_enabled",
        enabled: boolean
    ) => {
        if (!canManageMemberPortalPaymentControls || !profile.tenant_id) {
            return;
        }

        setMemberPortalPaymentControlsSavingKey(key);
        try {
            const payload: UpdateMemberPortalPaymentControlsRequest = {
                tenant_id: profile.tenant_id,
                [key]: enabled
            };

            const { data } = await api.patch<MemberPortalPaymentControlsResponse>(
                endpoints.memberPortalSettings.paymentControls(),
                payload
            );

            setMemberPortalPaymentControls(data.data || null);
            pushToast({
                type: "success",
                title: "Member payment control updated",
                message: `${key === "loan_repayment_enabled"
                    ? "Loan repayments"
                    : key === "savings_deposit_enabled"
                        ? "Savings deposits"
                        : "Share contributions"} are now ${enabled ? "enabled" : "disabled"} for member self-service.`
            });
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to update member payment control",
                message: getApiErrorMessage(error)
            });
        } finally {
            setMemberPortalPaymentControlsSavingKey(null);
        }
    };

    const toggleWorkspaceTwoFactor = async (enabled: boolean) => {
        if (!canManageWorkspaceTwoFactor || !profile.tenant_id) {
            return;
        }

        setWorkspaceTwoFactorSettingsSaving(true);
        try {
            const payload: UpdateWorkspaceTwoFactorSettingsRequest = {
                tenant_id: profile.tenant_id,
                two_factor_auth_enabled: enabled
            };

            const { data } = await api.patch<WorkspaceTwoFactorSettingsResponse>(
                endpoints.securitySettings.twoFactor(),
                payload
            );

            setWorkspaceTwoFactorSettings(data.data || null);
            await refreshProfile();
            pushToast({
                type: "success",
                title: "Workspace authenticator setting updated",
                message: enabled
                    ? "Authenticator verification is now required again for roles that use it."
                    : "Authenticator verification is now turned off across this workspace."
            });
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to update workspace authenticator setting",
                message: getApiErrorMessage(error)
            });
        } finally {
            setWorkspaceTwoFactorSettingsSaving(false);
        }
    };

    const toggleWorkspacePublicRegistration = async (enabled: boolean) => {
        if (!canManageWorkspaceTwoFactor || !profile.tenant_id) {
            return;
        }

        setWorkspacePublicRegistrationSettingsSaving(true);
        try {
            const payload: UpdateWorkspacePublicRegistrationSettingsRequest = {
                tenant_id: profile.tenant_id,
                public_registration_enabled: enabled
            };

            const { data } = await api.patch<WorkspacePublicRegistrationSettingsResponse>(
                endpoints.securitySettings.publicRegistration(),
                payload
            );

            setWorkspacePublicRegistrationSettings(data.data || null);
            pushToast({
                type: "success",
                title: "Public registration setting updated",
                message: enabled
                    ? "Public membership registration is now visible again."
                    : "Public membership registration is now hidden for this workspace."
            });
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to update public registration setting",
                message: getApiErrorMessage(error)
            });
        } finally {
            setWorkspacePublicRegistrationSettingsSaving(false);
        }
    };

    const startSetup = async () => {
        setLoadingAction("setup");
        try {
            const { data } = await api.post<TwoFactorSetupResponse>(endpoints.auth.twoFactorSetup());
            setSetupData(data);
            setSetupCode("");
            setBackupCodes([]);
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to start 2FA setup",
                message: getApiErrorMessage(error)
            });
            // If an admin turned 2FA off workspace-wide after this member loaded the
            // page, their cached profile is stale. Refresh it so the page reflects the
            // disabled state instead of offering setup again.
            if (getApiErrorCode(error) === "TWO_FACTOR_DISABLED_BY_WORKSPACE") {
                await refreshProfile();
            }
        } finally {
            setLoadingAction(null);
        }
    };

    const confirmSetup = async () => {
        if (!setupCode.trim()) {
            pushToast({
                type: "error",
                title: "Code required",
                message: "Enter the 6-digit code from your authenticator app."
            });
            return;
        }

        setLoadingAction("verify-setup");
        try {
            const { data } = await api.post<TwoFactorVerifyResponse>(
                endpoints.auth.twoFactorVerify(),
                { totp_code: setupCode.trim() }
            );
            setBackupCodes(data.backup_codes || []);
            setSetupData(null);
            setSetupCode("");
            await refreshProfile();
            pushToast({
                type: "success",
                title: "Two-factor enabled",
                message: "Authenticator-based verification is now active on this account."
            });
        } catch (error) {
            pushToast({
                type: "error",
                title: "Verification failed",
                message: getApiErrorMessage(error)
            });
        } finally {
            setLoadingAction(null);
        }
    };

    const validateNow = async () => {
        setLoadingAction("validate");
        try {
            await api.post<TwoFactorValidateResponse>(
                endpoints.auth.twoFactorValidate(),
                managementPayload
            );
            setTotpCode("");
            setRecoveryCode("");
            await refreshProfile();
            pushToast({
                type: "success",
                title: "Authenticator verified",
                message: "Your recent verification window has been refreshed."
            });
        } catch (error) {
            pushToast({
                type: "error",
                title: "Verification failed",
                message: getApiErrorMessage(error)
            });
        } finally {
            setLoadingAction(null);
        }
    };

    const regenerateCodes = async () => {
        setLoadingAction("backup-regenerate");
        try {
            const { data } = await api.post<TwoFactorBackupCodesResponse>(
                endpoints.auth.twoFactorBackupCodesRegenerate(),
                managementPayload
            );
            setBackupCodes(data.backup_codes || []);
            setTotpCode("");
            setRecoveryCode("");
            pushToast({
                type: "success",
                title: "Backup codes regenerated",
                message: "Save the new codes now. The previous set has been invalidated."
            });
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to regenerate backup codes",
                message: getApiErrorMessage(error)
            });
        } finally {
            setLoadingAction(null);
        }
    };

    const disableTwoFactor = async () => {
        setLoadingAction("disable");
        try {
            await api.post<TwoFactorDisableResponse>(
                endpoints.auth.twoFactorDisable(),
                managementPayload
            );
            setBackupCodes([]);
            setSetupData(null);
            setTotpCode("");
            setRecoveryCode("");
            await refreshProfile();
            pushToast({
                type: "success",
                title: "Two-factor disabled",
                message: "Authenticator verification has been removed from this account."
            });
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to disable 2FA",
                message: getApiErrorMessage(error)
            });
        } finally {
            setLoadingAction(null);
        }
    };

    useEffect(() => {
        if (
            setupIntent !== "setup" ||
            !twoFactorWorkspaceEnabled ||
            twoFactorEnabled ||
            setupData ||
            loadingAction ||
            autoSetupTriedRef.current
        ) {
            return;
        }

        autoSetupTriedRef.current = true;
        void startSetup();
    }, [loadingAction, setupData, setupIntent, twoFactorEnabled, twoFactorWorkspaceEnabled]);

    useEffect(() => {
        void loadMemberPortalPaymentControls();
    }, [canManageMemberPortalPaymentControls, profile.tenant_id, twoFactorSetupRequired]);

    useEffect(() => {
        void loadWorkspaceTwoFactorSettings();
    }, [canManageWorkspaceTwoFactor, profile.tenant_id]);

    useEffect(() => {
        void loadWorkspacePublicRegistrationSettings();
    }, [canManageWorkspaceTwoFactor, profile.tenant_id]);

    return (
        <Box sx={{ maxWidth: 1040, mx: "auto", px: { xs: 2, md: 3 }, py: 3 }}>
            <Stack spacing={3}>
                <Stack spacing={1.25}>
                    <Box>
                        <Button
                            variant="text"
                            startIcon={<ArrowBackRoundedIcon />}
                            onClick={() => navigate(backTarget)}
                            sx={{ px: 0.5, minHeight: 34 }}
                        >
                            {backLabel}
                        </Button>
                    </Box>
                    <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 2 }}>
                        Security
                    </Typography>
                    <Typography variant="h4" fontWeight={800}>
                        Two-Factor Authentication
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 760 }}>
                        Protect this SACCO workspace with authenticator-app based verification compatible with Google Authenticator, Microsoft Authenticator, Authy, Bitwarden, 1Password, and similar TOTP apps. Super admin can also turn this protection on or off for the whole workspace below.
                    </Typography>
                </Stack>

                {twoFactorSetupRequired && (
                    <Alert severity="warning" icon={<ShieldRoundedIcon />}>
                        Your role requires two-factor authentication before you can continue using protected financial modules.
                    </Alert>
                )}

                {!twoFactorWorkspaceEnabled && (
                    <Alert severity="info" icon={<SecurityRoundedIcon />}>
                        Authenticator verification is currently turned off for this workspace by a super admin setting.
                    </Alert>
                )}

                <Box
                    sx={{
                        display: "grid",
                        gap: 2.5,
                        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }
                    }}
                >
                    {canManageWorkspaceTwoFactor && (
                        <Box sx={{ gridColumn: "1 / -1" }}>
                            <Card>
                                <CardContent>
                                    <Stack spacing={2}>
                                        <Stack spacing={0.5}>
                                            <Typography variant="h6" fontWeight={700}>
                                                Workspace Authenticator Policy
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Turn authenticator verification on or off for everyone in this workspace from one place.
                                            </Typography>
                                        </Stack>
                                        <Alert severity="info" variant="outlined">
                                            When this is off, staff and member sign-in no longer ask for authenticator codes and protected actions stop requiring step-up verification.
                                        </Alert>

                                        {workspaceTwoFactorSettingsLoading && !workspaceTwoFactorSettings ? (
                                            <Stack direction="row" spacing={1.2} alignItems="center">
                                                <CircularProgress size={18} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Loading workspace authenticator setting...
                                                </Typography>
                                            </Stack>
                                        ) : null}

                                        {workspaceTwoFactorSettings ? (
                                            <Stack
                                                direction={{ xs: "column", sm: "row" }}
                                                spacing={1.5}
                                                justifyContent="space-between"
                                                alignItems={{ xs: "flex-start", sm: "center" }}
                                            >
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                        Require authenticator verification
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Applies to sign-in enforcement, protected action verification, and new authenticator setup across this workspace.
                                                    </Typography>
                                                </Box>
                                                <Switch
                                                    checked={workspaceTwoFactorSettings.two_factor_auth_enabled}
                                                    onChange={(_, checked) => void toggleWorkspaceTwoFactor(checked)}
                                                    disabled={workspaceTwoFactorSettingsSaving}
                                                />
                                            </Stack>
                                        ) : null}
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Box>
                    )}

                    {canManageWorkspaceTwoFactor && (
                        <Box sx={{ gridColumn: "1 / -1" }}>
                            <Card>
                                <CardContent>
                                    <Stack spacing={2}>
                                        <Stack spacing={0.5}>
                                            <Typography variant="h6" fontWeight={700}>
                                                Public Registration
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Show or hide the public membership application feature for this workspace.
                                            </Typography>
                                        </Stack>
                                        <Alert severity="info" variant="outlined">
                                            When this is off, public visitors no longer see the membership application entry and direct public signup requests are rejected.
                                        </Alert>

                                        {workspacePublicRegistrationSettingsLoading && !workspacePublicRegistrationSettings ? (
                                            <Stack direction="row" spacing={1.2} alignItems="center">
                                                <CircularProgress size={18} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Loading public registration setting...
                                                </Typography>
                                            </Stack>
                                        ) : null}

                                        {workspacePublicRegistrationSettings ? (
                                            <Stack
                                                direction={{ xs: "column", sm: "row" }}
                                                spacing={1.5}
                                                justifyContent="space-between"
                                                alignItems={{ xs: "flex-start", sm: "center" }}
                                            >
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                        Show public membership registration
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Controls whether new applicants can see and use the public registration form.
                                                    </Typography>
                                                </Box>
                                                <Switch
                                                    checked={workspacePublicRegistrationSettings.public_registration_enabled}
                                                    onChange={(_, checked) => void toggleWorkspacePublicRegistration(checked)}
                                                    disabled={workspacePublicRegistrationSettingsSaving}
                                                />
                                            </Stack>
                                        ) : null}
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Box>
                    )}

                    <Box>
                        <Card sx={{ height: "100%" }}>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Stack spacing={0.5}>
                                            <Typography variant="h6" fontWeight={700}>
                                                Current Status
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Staff roles must keep 2FA enabled. Members can enable it optionally.
                                            </Typography>
                                        </Stack>
                                        <Chip
                                            color={!twoFactorWorkspaceEnabled ? "warning" : twoFactorEnabled ? "success" : "default"}
                                            icon={!twoFactorWorkspaceEnabled && twoFactorEnabled
                                                ? <ShieldRoundedIcon />
                                                : twoFactorEnabled
                                                    ? <VerifiedRoundedIcon />
                                                    : <SecurityRoundedIcon />}
                                            label={!twoFactorWorkspaceEnabled
                                                ? (twoFactorEnabled ? "Configured but inactive" : "Disabled by workspace")
                                                : (twoFactorEnabled ? "Enabled" : "Not enabled")}
                                        />
                                    </Stack>

                                    <Divider />

                                    <Stack spacing={1}>
                                        <Typography variant="body2" color="text.secondary">
                                            Required for this role
                                        </Typography>
                                        <Typography variant="body1" fontWeight={700}>
                                            {!twoFactorWorkspaceEnabled ? "Disabled at workspace level" : profile.two_factor_required ? "Yes" : "Optional"}
                                        </Typography>
                                    </Stack>

                                    <Stack spacing={1}>
                                        <Typography variant="body2" color="text.secondary">
                                            Enabled on
                                        </Typography>
                                        <Typography variant="body1" fontWeight={700}>
                                            {profile.two_factor_enabled_at
                                                ? new Date(profile.two_factor_enabled_at).toLocaleString()
                                                : "Not yet enabled"}
                                        </Typography>
                                    </Stack>

                                    <Stack spacing={1}>
                                        <Typography variant="body2" color="text.secondary">
                                            Last verified
                                        </Typography>
                                        <Typography variant="body1" fontWeight={700}>
                                            {profile.two_factor_last_verified_at
                                                ? new Date(profile.two_factor_last_verified_at).toLocaleString()
                                                : "No recent verification"}
                                        </Typography>
                                    </Stack>

                                    {!twoFactorWorkspaceEnabled && twoFactorEnabled && (
                                        <Alert severity="info" variant="outlined">
                                            This account still has an authenticator setup saved, but it is not enforced while the workspace setting is off.
                                        </Alert>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box>
                        <Card sx={{ height: "100%" }}>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Stack spacing={0.5}>
                                        <Typography variant="h6" fontWeight={700}>
                                            Enable or refresh 2FA
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Start setup to get a QR code, then verify a 6-digit authenticator code to activate protection on this account.
                                        </Typography>
                                    </Stack>

                                    {!twoFactorWorkspaceEnabled && (
                                        <Alert severity="info">
                                            Authenticator setup is currently unavailable because the workspace-level authenticator setting is turned off.
                                        </Alert>
                                    )}

                                    {twoFactorWorkspaceEnabled && !twoFactorEnabled && !setupData && (
                                        <Button
                                            variant="contained"
                                            startIcon={<ShieldRoundedIcon />}
                                            onClick={() => void startSetup()}
                                            disabled={loadingAction === "setup"}
                                        >
                                            {loadingAction === "setup" ? "Preparing QR code..." : "Enable two-factor authentication"}
                                        </Button>
                                    )}

                                    {twoFactorWorkspaceEnabled && setupData && (
                                        <Stack spacing={2}>
                                            <Box
                                                component="img"
                                                src={setupData.qr_code}
                                                alt="TOTP QR code"
                                                sx={{
                                                    width: 220,
                                                    maxWidth: "100%",
                                                    alignSelf: "center",
                                                    borderRadius: 2,
                                                    border: (theme) => `1px solid ${theme.palette.divider}`,
                                                    p: 1,
                                                    bgcolor: "#fff"
                                                }}
                                            />
                                            <Alert severity="info">
                                                If you cannot scan the QR code, enter this key manually: <strong>{setupData.manual_entry_key}</strong>
                                            </Alert>
                                            <TextField
                                                label="Authenticator code"
                                                value={setupCode}
                                                onChange={(event) => setSetupCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                                                inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 6 }}
                                                helperText="Enter the 6-digit code from your authenticator app."
                                            />
                                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                                <Button
                                                    variant="contained"
                                                    onClick={() => void confirmSetup()}
                                                    disabled={loadingAction === "verify-setup"}
                                                >
                                                    {loadingAction === "verify-setup" ? "Verifying..." : "Verify and enable"}
                                                </Button>
                                                <Button
                                                    variant="text"
                                                    onClick={() => {
                                                        setSetupData(null);
                                                        setSetupCode("");
                                                    }}
                                                >
                                                    Cancel setup
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    )}

                                    {twoFactorWorkspaceEnabled && twoFactorEnabled && (
                                        <Alert severity="success">
                                            Authenticator verification is enabled. You can refresh your verification window, regenerate backup codes, or disable 2FA below.
                                        </Alert>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Box>

                    {twoFactorWorkspaceEnabled && twoFactorEnabled && (
                        <Box sx={{ gridColumn: "1 / -1" }}>
                            <Card>
                                <CardContent>
                                    <Stack spacing={2}>
                                        <Stack spacing={0.5}>
                                            <Typography variant="h6" fontWeight={700}>
                                                Manage existing 2FA
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Use either a current authenticator code or one unused backup code to validate, regenerate backup codes, or disable 2FA.
                                            </Typography>
                                        </Stack>

                                        <Box
                                            sx={{
                                                display: "grid",
                                                gap: 2,
                                                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }
                                            }}
                                        >
                                            <Box>
                                                <TextField
                                                    fullWidth
                                                    label="Authenticator code"
                                                    value={totpCode}
                                                    onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                                                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 6 }}
                                                />
                                            </Box>
                                            <Box>
                                                <TextField
                                                    fullWidth
                                                    label="Backup recovery code"
                                                    value={recoveryCode}
                                                    onChange={(event) => setRecoveryCode(event.target.value.toUpperCase())}
                                                    helperText="Example: 8F4K-3P92"
                                                />
                                            </Box>
                                        </Box>

                                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                                            <Button
                                                variant="outlined"
                                                startIcon={<SecurityRoundedIcon />}
                                                onClick={() => void validateNow()}
                                                disabled={loadingAction === "validate"}
                                            >
                                                {loadingAction === "validate" ? "Verifying..." : "Verify now"}
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                startIcon={<RefreshRoundedIcon />}
                                                onClick={() => void regenerateCodes()}
                                                disabled={loadingAction === "backup-regenerate"}
                                            >
                                                {loadingAction === "backup-regenerate" ? "Regenerating..." : "Regenerate backup codes"}
                                            </Button>
                                            <Button
                                                color="error"
                                                variant="text"
                                                startIcon={<DeleteOutlineRoundedIcon />}
                                                onClick={() => void disableTwoFactor()}
                                                disabled={loadingAction === "disable"}
                                            >
                                                {loadingAction === "disable" ? "Disabling..." : "Disable 2FA"}
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Box>
                    )}

                    {backupCodes.length > 0 && (
                        <Box sx={{ gridColumn: "1 / -1" }}>
                            <Card>
                                <CardContent>
                                    <Stack spacing={2}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <KeyRoundedIcon color="primary" />
                                            <Typography variant="h6" fontWeight={700}>
                                                Backup recovery codes
                                            </Typography>
                                        </Stack>
                                        <Alert severity="warning">
                                            Save these codes now. Each code works once. For security reasons, hashed backup codes are stored and cannot be displayed again later.
                                        </Alert>
                                        <Box
                                            sx={{
                                                display: "grid",
                                                gap: 1.25,
                                                gridTemplateColumns: {
                                                    xs: "1fr",
                                                    sm: "repeat(2, minmax(0, 1fr))",
                                                    md: "repeat(4, minmax(0, 1fr))"
                                                }
                                            }}
                                        >
                                            {backupCodes.map((code) => (
                                                <Box key={code}>
                                                    <Box
                                                        sx={{
                                                            border: (theme) => `1px solid ${theme.palette.divider}`,
                                                            borderRadius: 2,
                                                            px: 2,
                                                            py: 1.5,
                                                            fontFamily: "monospace",
                                                            fontWeight: 700,
                                                            fontSize: "0.95rem",
                                                            bgcolor: "background.default"
                                                        }}
                                                    >
                                                        {code}
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Box>
                    )}

                    {canManageMemberPortalPaymentControls && !twoFactorSetupRequired && (
                        <Box sx={{ gridColumn: "1 / -1" }}>
                            <Card>
                                <CardContent>
                                    <Stack spacing={2}>
                                        <Stack spacing={0.5}>
                                            <Typography variant="h6" fontWeight={700}>
                                                Member Portal Payment Controls
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Turn member-initiated mobile money flows on or off without affecting back-office staff posting screens.
                                            </Typography>
                                        </Stack>
                                        <Alert severity="info" variant="outlined">
                                            When a control is off, the member portal hides the self-service action and the backend rejects direct initiation attempts for that payment type.
                                        </Alert>

                                        {memberPortalPaymentControlsLoading && !memberPortalPaymentControls ? (
                                            <Stack direction="row" spacing={1.2} alignItems="center">
                                                <CircularProgress size={18} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Loading member portal payment controls...
                                                </Typography>
                                            </Stack>
                                        ) : null}

                                        {memberPortalPaymentControls ? (
                                            <Stack divider={<Divider flexItem />} spacing={0}>
                                                {[
                                                    {
                                                        key: "share_contribution_enabled" as const,
                                                        title: "Share contribution self-service",
                                                        description: "Allow members to initiate mobile money share contributions from the portal."
                                                    },
                                                    {
                                                        key: "savings_deposit_enabled" as const,
                                                        title: "Savings deposit self-service",
                                                        description: "Allow members to initiate mobile money savings deposits from the portal."
                                                    },
                                                    {
                                                        key: "loan_repayment_enabled" as const,
                                                        title: "Loan repayment self-service",
                                                        description: "Allow members to initiate mobile money loan repayments from the portal."
                                                    }
                                                ].map((item) => (
                                                    <Stack
                                                        key={item.key}
                                                        direction={{ xs: "column", sm: "row" }}
                                                        spacing={1.5}
                                                        justifyContent="space-between"
                                                        alignItems={{ xs: "flex-start", sm: "center" }}
                                                        sx={{ py: 1.5 }}
                                                    >
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                                {item.title}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {item.description}
                                                            </Typography>
                                                        </Box>
                                                        <Switch
                                                            checked={Boolean(memberPortalPaymentControls[item.key])}
                                                            onChange={(_, checked) => void toggleMemberPortalPaymentControl(item.key, checked)}
                                                            disabled={memberPortalPaymentControlsSavingKey === item.key}
                                                        />
                                                    </Stack>
                                                ))}
                                            </Stack>
                                        ) : null}

                                        {memberPortalPaymentControls ? (
                                            <>
                                                <Divider />
                                                <Stack spacing={1.5}>
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                            Loan application guide
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Shown to members above the loan products in the portal, so they do not need to ask for
                                                            basic information before applying. Cover the steps, required documents, guarantor
                                                            process, and how approval works. Leave empty to hide the section.
                                                        </Typography>
                                                    </Box>
                                                    <TextField
                                                        multiline
                                                        minRows={6}
                                                        fullWidth
                                                        value={loanGuideDraft}
                                                        onChange={(event) => setLoanGuideDraft(event.target.value)}
                                                        placeholder={"1. Check the loan products below and confirm you meet the requirements.\n2. Gather your documents (ID, payslip or income proof, guarantor details).\n3. Ask the required number of members to stand as your guarantors — they will confirm from their own portal.\n4. Submit the application from this page and track its status under My Loan Applications.\n5. The loan committee reviews applications and you will be notified of the decision."}
                                                    />
                                                    <Box>
                                                        <Button
                                                            variant="contained"
                                                            onClick={() => void saveLoanApplicationGuide()}
                                                            disabled={loanGuideSaving || (loanGuideDraft.trim() || "") === (memberPortalPaymentControls.loan_application_guide || "")}
                                                        >
                                                            {loanGuideSaving ? "Saving…" : "Save guide"}
                                                        </Button>
                                                    </Box>
                                                </Stack>
                                            </>
                                        ) : null}
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Box>
                    )}
                </Box>
            </Stack>
        </Box>
    );
}
