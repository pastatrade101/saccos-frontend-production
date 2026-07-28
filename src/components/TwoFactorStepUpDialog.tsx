import { useState } from "react";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography
} from "@mui/material";

import { api, getApiErrorMessage } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import { useToast } from "./Toast";

export interface TwoFactorStepUpPayload {
    two_factor_code?: string;
    recovery_code?: string;
    otp_challenge_id?: string;
    otp_code?: string;
}

/** Which second factor the user is presenting. */
type StepUpMethod = "authenticator" | "email" | "sms" | "recovery";

interface TwoFactorStepUpDialogProps {
    open: boolean;
    title: string;
    description: string;
    actionLabel: string;
    busy?: boolean;
    onCancel: () => void;
    onConfirm: (payload: TwoFactorStepUpPayload) => Promise<void>;
}

interface StepUpChallenge {
    challenge_id: string;
    destination_hint: string;
    channel: "email" | "sms";
}

export function TwoFactorStepUpDialog({
    open,
    title,
    description,
    actionLabel,
    busy = false,
    onCancel,
    onConfirm
}: TwoFactorStepUpDialogProps) {
    const { pushToast } = useToast();
    const [method, setMethod] = useState<StepUpMethod>("authenticator");
    const [totpCode, setTotpCode] = useState("");
    const [recoveryCode, setRecoveryCode] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [challenge, setChallenge] = useState<StepUpChallenge | null>(null);
    const [sending, setSending] = useState(false);

    const reset = () => {
        setMethod("authenticator");
        setTotpCode("");
        setRecoveryCode("");
        setOtpCode("");
        setChallenge(null);
    };

    const handleCancel = () => {
        if (busy) {
            return;
        }

        reset();
        onCancel();
    };

    // Asks the server to send a code. The destination is never sent from here —
    // the server reads it off the signed-in account, so a caller cannot point
    // their own second factor at an address they control.
    const sendCode = async (channel: "email" | "sms") => {
        setSending(true);
        try {
            const response = await api.post<{ data: StepUpChallenge }>(
                endpoints.auth.requestStepUpOtp(),
                { channel }
            );
            setChallenge(response.data.data);
            setOtpCode("");
            pushToast({
                type: "success",
                title: "Code sent",
                message: `We sent a code to ${response.data.data.destination_hint}.`
            });
        } catch (error) {
            pushToast({
                type: "error",
                title: "Could not send the code",
                message: getApiErrorMessage(error, "Unable to send a verification code.")
            });
        } finally {
            setSending(false);
        }
    };

    const switchMethod = (next: StepUpMethod) => {
        setMethod(next);
        setTotpCode("");
        setRecoveryCode("");
        setOtpCode("");
        setChallenge(null);
    };

    const buildPayload = (): TwoFactorStepUpPayload | null => {
        if (method === "recovery") {
            if (!recoveryCode.trim()) {
                pushToast({
                    type: "error",
                    title: "Recovery code required",
                    message: "Enter one unused backup recovery code."
                });
                return null;
            }
            return { recovery_code: recoveryCode.trim().toUpperCase() };
        }

        if (method === "authenticator") {
            if (!/^\d{6}$/.test(totpCode.trim())) {
                pushToast({
                    type: "error",
                    title: "Invalid code",
                    message: "Enter a valid 6-digit authenticator code."
                });
                return null;
            }
            return { two_factor_code: totpCode.trim() };
        }

        if (!challenge) {
            pushToast({
                type: "error",
                title: "No code sent yet",
                message: `Tap "Send code" first.`
            });
            return null;
        }

        if (!/^\d{6}$/.test(otpCode.trim())) {
            pushToast({
                type: "error",
                title: "Invalid code",
                message: "Enter the 6-digit code we sent you."
            });
            return null;
        }

        return { otp_challenge_id: challenge.challenge_id, otp_code: otpCode.trim() };
    };

    const handleConfirm = async () => {
        const payload = buildPayload();
        if (!payload) {
            return;
        }

        try {
            await onConfirm(payload);
            reset();
        } catch (error) {
            pushToast({
                type: "error",
                title: "Verification failed",
                message: getApiErrorMessage(error, "Unable to verify this protected action.")
            });
        }
    };

    const sentToThisChannel =
        challenge && (method === "email" || method === "sms") && challenge.channel === method;

    return (
        <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="xs">
            <DialogTitle>{title}</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2}>
                    <Alert severity="info">
                        This financial action requires a fresh verification before the system can continue.
                    </Alert>
                    <Typography variant="body2" color="text.secondary">
                        {description}
                    </Typography>

                    {method !== "recovery" ? (
                        <Tabs
                            value={method}
                            onChange={(_, next: StepUpMethod) => switchMethod(next)}
                            variant="fullWidth"
                            sx={{ minHeight: 40 }}
                        >
                            <Tab value="authenticator" label="Authenticator" sx={{ minHeight: 40 }} />
                            <Tab value="email" label="Email" sx={{ minHeight: 40 }} />
                            <Tab value="sms" label="SMS" sx={{ minHeight: 40 }} />
                        </Tabs>
                    ) : null}

                    {method === "recovery" ? (
                        <TextField
                            autoFocus
                            fullWidth
                            label="Backup recovery code"
                            value={recoveryCode}
                            onChange={(event) => setRecoveryCode(event.target.value.toUpperCase())}
                            helperText="Example: 8F4K-3P92"
                        />
                    ) : method === "authenticator" ? (
                        <TextField
                            autoFocus
                            fullWidth
                            label="Authenticator code"
                            value={totpCode}
                            onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                            inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 6 }}
                            helperText="Enter the 6-digit code from your authenticator app."
                        />
                    ) : (
                        <Stack spacing={1.5}>
                            <Button
                                variant={sentToThisChannel ? "outlined" : "contained"}
                                onClick={() => void sendCode(method)}
                                disabled={sending || busy}
                            >
                                {sending
                                    ? "Sending..."
                                    : sentToThisChannel
                                        ? "Send a new code"
                                        : `Send code by ${method === "email" ? "email" : "SMS"}`}
                            </Button>
                            <TextField
                                fullWidth
                                label="Verification code"
                                value={otpCode}
                                onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                                inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 6 }}
                                disabled={!sentToThisChannel}
                                helperText={
                                    sentToThisChannel
                                        ? `Sent to ${challenge?.destination_hint}. It expires shortly.`
                                        : "Send yourself a code first."
                                }
                            />
                        </Stack>
                    )}

                    <Button
                        variant="text"
                        sx={{ alignSelf: "flex-start" }}
                        onClick={() => switchMethod(method === "recovery" ? "authenticator" : "recovery")}
                    >
                        {method === "recovery"
                            ? "Use another method instead"
                            : "Use a backup recovery code"}
                    </Button>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel} disabled={busy}>
                    Cancel
                </Button>
                <Button onClick={() => void handleConfirm()} variant="contained" disabled={busy}>
                    {busy ? "Verifying..." : actionLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}