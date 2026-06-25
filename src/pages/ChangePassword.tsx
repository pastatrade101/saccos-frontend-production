import { MotionCard, MotionModal } from "../ui/motion";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    IconButton,
    InputAdornment,
    LinearProgress,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";
import { api, getApiErrorMessage } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import { supabase } from "../lib/supabase";

// The current password is only required for a voluntary change. The forced
// first-login reset already authenticated the user with their temp password.
function buildPasswordSchema(requireCurrent: boolean) {
    return z
        .object({
            currentPassword: z.string(),
            password: z
                .string()
                .min(10, "Use at least 10 characters.")
                .regex(/[A-Z]/, "Add an uppercase letter (A–Z).")
                .regex(/[a-z]/, "Add a lowercase letter (a–z).")
                .regex(/[0-9]/, "Add a number (0–9).")
                .regex(/[^A-Za-z0-9]/, "Add a symbol (! @ # $ …)."),
            confirmPassword: z.string().min(10, "Confirm your password.")
        })
        .refine((value) => value.password === value.confirmPassword, {
            path: ["confirmPassword"],
            message: "Passwords do not match."
        })
        .refine((value) => !requireCurrent || value.currentPassword.trim().length > 0, {
            path: ["currentPassword"],
            message: "Enter your current password."
        });
}

type FormValues = z.infer<ReturnType<typeof buildPasswordSchema>>;

function getPasswordChecks(password: string) {
    return [
        { label: "At least 10 characters", met: password.length >= 10 },
        { label: "An uppercase letter (A–Z)", met: /[A-Z]/.test(password) },
        { label: "A lowercase letter (a–z)", met: /[a-z]/.test(password) },
        { label: "A number (0–9)", met: /[0-9]/.test(password) },
        { label: "A symbol (! @ # $ …)", met: /[^A-Za-z0-9]/.test(password) }
    ];
}

const STRENGTH_LEVELS = [
    { label: "Weak", color: "error.main", barColor: "error" as const },
    { label: "Fair", color: "warning.main", barColor: "warning" as const },
    { label: "Strong", color: "success.main", barColor: "success" as const }
];

export function ChangePasswordPage() {
    const navigate = useNavigate();
    const { profile, session, refreshProfile, markPasswordChanged } = useAuth();
    const { pushToast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
    const toggleVisible = (key: "current" | "next" | "confirm") =>
        setVisible((state) => ({ ...state, [key]: !state[key] }));

    // `must_change_password` => forced first-login reset. Otherwise this is a
    // voluntary change a signed-in user started from the profile menu.
    const isForced = Boolean(profile?.must_change_password);
    const schema = useMemo(() => buildPasswordSchema(!isForced), [isForced]);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            currentPassword: "",
            password: "",
            confirmPassword: ""
        }
    });

    if (!session) {
        return <Navigate to="/signin" replace />;
    }

    const onSubmit = form.handleSubmit(async (values) => {
        setSubmitting(true);

        try {
            // Voluntary change: confirm the current password before updating.
            if (!isForced) {
                const email = session.user?.email;
                if (!email) {
                    throw new Error("Unable to determine your account email.");
                }
                const { error: verifyError } = await supabase.auth.signInWithPassword({
                    email,
                    password: values.currentPassword
                });
                if (verifyError) {
                    form.setError("currentPassword", { message: "Current password is incorrect." });
                    setSubmitting(false);
                    return;
                }
            }

            const { error } = await supabase.auth.updateUser({
                password: values.password
            });

            if (error) {
                throw error;
            }

            await api.post(endpoints.users.passwordChanged());
            markPasswordChanged();
            void refreshProfile();
            pushToast({
                type: "success",
                title: "Password updated",
                message: isForced
                    ? "Your portal access is now fully activated."
                    : "Your password has been changed."
            });
            navigate("/", { replace: true });
        } catch (error) {
            pushToast({
                type: "error",
                title: "Password update failed",
                message: getApiErrorMessage(error)
            });
        } finally {
            setSubmitting(false);
        }
    });

    const newPassword = form.watch("password") || "";
    const passwordChecks = getPasswordChecks(newPassword);
    const metCount = passwordChecks.filter((check) => check.met).length;
    const strength = STRENGTH_LEVELS[metCount <= 2 ? 0 : metCount <= 4 ? 1 : 2];

    return (
        <Box
            sx={{
                minHeight: "100vh",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #0A0573, #1FA8E6)",
                px: 2,
                py: 3
            }}
        >
            <MotionCard sx={{ width: "100%", maxWidth: 520, borderRadius: 3, mx: "auto" }}>
                <CardContent sx={{ p: 4 }}>
                    <Stack spacing={3} alignItems="center">
                        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                            <ShieldRoundedIcon color="primary" />
                            <Typography variant="h5" fontWeight={700} textAlign="center">
                                {isForced ? "Secure your first login" : "Change your password"}
                            </Typography>
                        </Stack>
                        <Alert severity="info" icon={<LockResetRoundedIcon />} sx={{ width: "100%" }}>
                            {isForced
                                ? "Your temporary password must be replaced before you can continue."
                                : "Choose a new password you'll use to sign in. You'll stay signed in on this device."}
                        </Alert>
                        <Stack spacing={2} component="form" onSubmit={onSubmit} sx={{ width: "100%", maxWidth: 420, mx: "auto" }}>
                            {!isForced ? (
                                <TextField
                                    label="Current password"
                                    type={visible.current ? "text" : "password"}
                                    autoComplete="current-password"
                                    error={Boolean(form.formState.errors.currentPassword)}
                                    helperText={form.formState.errors.currentPassword?.message}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => toggleVisible("current")}
                                                    edge="end"
                                                    size="small"
                                                    aria-label={visible.current ? "Hide password" : "Show password"}
                                                >
                                                    {visible.current ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    {...form.register("currentPassword")}
                                />
                            ) : null}
                            <TextField
                                label="New password"
                                type={visible.next ? "text" : "password"}
                                autoComplete="new-password"
                                error={Boolean(form.formState.errors.password)}
                                helperText={form.formState.errors.password?.message}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => toggleVisible("next")}
                                                edge="end"
                                                size="small"
                                                aria-label={visible.next ? "Hide password" : "Show password"}
                                            >
                                                {visible.next ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                {...form.register("password")}
                            />
                            {newPassword ? (
                                <Box sx={{ mt: -0.5 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Password strength
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: strength.color }}>
                                            {strength.label}
                                        </Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(metCount / passwordChecks.length) * 100}
                                        color={strength.barColor}
                                        sx={{ height: 6, borderRadius: 999 }}
                                    />
                                    <Stack sx={{ mt: 1 }}>
                                        {passwordChecks.map((check) => (
                                            <Stack key={check.label} direction="row" alignItems="center" spacing={0.5}>
                                                <Checkbox
                                                    checked={check.met}
                                                    color="success"
                                                    size="small"
                                                    disableRipple
                                                    tabIndex={-1}
                                                    inputProps={{ "aria-label": check.label }}
                                                    sx={{ p: 0.25, pointerEvents: "none" }}
                                                />
                                                <Typography
                                                    variant="caption"
                                                    sx={{ color: check.met ? "success.main" : "text.secondary" }}
                                                >
                                                    {check.label}
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </Box>
                            ) : null}
                            <TextField
                                label="Confirm new password"
                                type={visible.confirm ? "text" : "password"}
                                autoComplete="new-password"
                                error={Boolean(form.formState.errors.confirmPassword)}
                                helperText={form.formState.errors.confirmPassword?.message}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => toggleVisible("confirm")}
                                                edge="end"
                                                size="small"
                                                aria-label={visible.confirm ? "Hide password" : "Show password"}
                                            >
                                                {visible.confirm ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                {...form.register("confirmPassword")}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={submitting || metCount < passwordChecks.length}
                            >
                                {submitting ? "Saving password..." : isForced ? "Save new password" : "Update password"}
                            </Button>
                            {!isForced ? (
                                <Button variant="text" onClick={() => navigate(-1)} disabled={submitting}>
                                    Cancel
                                </Button>
                            ) : null}
                        </Stack>
                    </Stack>
                </CardContent>
            </MotionCard>
        </Box>
    );
}
