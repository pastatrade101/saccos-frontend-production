import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type ClipboardEvent,
    type KeyboardEvent
} from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import { useAuth } from "../auth/AuthContext";
import { FormField } from "../components/FormField";
import { useToast } from "../components/Toast";
import { api, getApiErrorMessage } from "../lib/api";
import { endpoints, type PasswordSetupLinkSendResponse } from "../lib/endpoints";
import { useUI } from "../ui/UIProvider";
import pageStyles from "./Pages.module.css";

// Members log in with a SACCO email account. Accept either the full email or
// just the username (firstname.surname); the domain is appended before submit.
const LOGIN_EMAIL_DOMAIN = (import.meta.env.VITE_LOGIN_EMAIL_DOMAIN || "ias.co.tz")
    .replace(/^@/, "")
    .trim()
    .toLowerCase();

function normalizeLoginIdentifier(value: string) {
    const raw = value.trim().toLowerCase();
    if (!raw || raw.includes("@") || !LOGIN_EMAIL_DOMAIN) {
        return raw;
    }
    return `${raw}@${LOGIN_EMAIL_DOMAIN}`;
}

const schema = z.object({
    email: z.string().trim().min(1, "Enter your username or email.")
        .transform(normalizeLoginIdentifier)
        .pipe(z.string().email("Enter a valid username or email.")),
    password: z.string().min(8, "Password must be at least 8 characters.")
});

type SignInValues = z.infer<typeof schema>;

interface AuthFlowError extends Error {
    code?: string;
    details?: unknown;
}

// Slides for the right-hand visual panel. Drop more images into /public and add
// entries here to extend the carousel.
const AUTH_SLIDES = [
    {
        image: "/13321.jpg",
        eyebrow: "Savings & Shares",
        title: "Grow your wealth, together",
        copy: "Track your savings, shares and dividends in one secure place — always up to date."
    },
    {
        image: "/bk.jpg",
        eyebrow: "Digital SACCOS",
        title: "Banking that moves with you",
        copy: "Apply for loans, follow repayments and manage your account anytime, anywhere."
    }
] as const;

const AUTH_SLIDE_INTERVAL_MS = 6000;

export function SignInPage() {
    const navigate = useNavigate();
    const { pushToast } = useToast();
    const { signIn } = useAuth();
    const { theme, toggleTheme } = useUI();
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);
    const [setupEmail, setSetupEmail] = useState("");
    const [sendingSetupLink, setSendingSetupLink] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [sendingResetEmail, setSendingResetEmail] = useState(false);
    const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);
    const [showRecoveryCode, setShowRecoveryCode] = useState(false);
    const [otpDigits, setOtpDigits] = useState<string[]>(() =>
        Array.from({ length: 6 }, () => "")
    );
    const [recoveryCode, setRecoveryCode] = useState("");
    const [verifyingTwoFactor, setVerifyingTwoFactor] = useState(false);
    const [lastAutoSubmittedOtp, setLastAutoSubmittedOtp] = useState<string | null>(null);
    // Whether an admin has enabled public self-registration. The public branches
    // endpoint only returns branches when registration is on, so a non-empty list
    // means the "Create an account" link should be shown.
    const [registrationEnabled, setRegistrationEnabled] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0);
    const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const totpCode = useMemo(() => otpDigits.join(""), [otpDigits]);

    const form = useForm<SignInValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            email: "",
            password: ""
        }
    });

    useEffect(() => {
        if (AUTH_SLIDES.length <= 1) {
            return;
        }
        const id = window.setInterval(() => {
            setActiveSlide((current) => (current + 1) % AUTH_SLIDES.length);
        }, AUTH_SLIDE_INTERVAL_MS);
        return () => window.clearInterval(id);
    }, []);

    useEffect(() => {
        let isMounted = true;

        // Public registration is enabled when at least one branch is open for it.
        // Stay silent on failure so a backend hiccup never blocks sign-in.
        void api
            .get<{ data?: unknown[] }>(endpoints.public.branches())
            .then((response) => {
                if (isMounted) {
                    setRegistrationEnabled((response.data?.data?.length ?? 0) > 0);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setRegistrationEnabled(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const closeTwoFactorModal = () => {
        setTwoFactorModalOpen(false);
        setShowRecoveryCode(false);
        setOtpDigits(Array.from({ length: 6 }, () => ""));
        setRecoveryCode("");
        setLastAutoSubmittedOtp(null);
    };

    const focusOtpDigit = (index: number) => {
        window.setTimeout(() => {
            otpInputRefs.current[index]?.focus();
            otpInputRefs.current[index]?.select();
        }, 0);
    };

    const handleOtpDigitChange = (index: number, value: string) => {
        const nextDigit = value.replace(/\D/g, "").slice(-1);

        setOtpDigits((current) => {
            const next = [...current];
            next[index] = nextDigit;
            return next;
        });
        setLastAutoSubmittedOtp(null);

        if (nextDigit && index < 5) {
            focusOtpDigit(index + 1);
        }
    };

    const handleOtpDigitKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Backspace") {
            event.preventDefault();

            if (otpDigits[index]) {
                setOtpDigits((current) => {
                    const next = [...current];
                    next[index] = "";
                    return next;
                });
                setLastAutoSubmittedOtp(null);
                return;
            }

            if (index > 0) {
                setOtpDigits((current) => {
                    const next = [...current];
                    next[index - 1] = "";
                    return next;
                });
                setLastAutoSubmittedOtp(null);
                focusOtpDigit(index - 1);
            }

            return;
        }

        if (event.key === "ArrowLeft" && index > 0) {
            event.preventDefault();
            focusOtpDigit(index - 1);
        }

        if (event.key === "ArrowRight" && index < 5) {
            event.preventDefault();
            focusOtpDigit(index + 1);
        }
    };

    const handleOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
        const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

        if (!digits) {
            return;
        }

        event.preventDefault();

        setOtpDigits((current) => {
            const next = [...current];
            digits.split("").forEach((digit, index) => {
                next[index] = digit;
            });
            return next;
        });
        setLastAutoSubmittedOtp(null);
        focusOtpDigit(Math.min(digits.length, 6) - 1);
    };

    const handleSendSetupLink = async () => {
        const candidateEmail = setupEmail.trim().toLowerCase();
        const parsed = z.string().email().safeParse(candidateEmail);

        if (!parsed.success) {
            pushToast({
                type: "error",
                title: "Valid email required",
                message: "Enter a valid work email to continue first-time setup."
            });
            return;
        }

        setSendingSetupLink(true);

        try {
            const { data } = await api.post<PasswordSetupLinkSendResponse>(
                endpoints.auth.passwordSetupLinkSend(),
                {
                    email: candidateEmail
                }
            );

            pushToast({
                type: "success",
                title: "Setup link sent",
                message: data.destination_hint
                    ? `Password setup link sent via SMS to ${data.destination_hint}.`
                    : "If this account exists and has a phone, a setup link has been sent via SMS."
            });
            setShowFirstTimeSetup(false);
            setSetupEmail("");
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to send setup link",
                message: getApiErrorMessage(error, "Try again in a moment.")
            });
        } finally {
            setSendingSetupLink(false);
        }
    };

    const handleSendResetEmail = async () => {
        const candidateEmail = forgotEmail.trim().toLowerCase();
        const parsed = z.string().email().safeParse(candidateEmail);

        if (!parsed.success) {
            pushToast({
                type: "error",
                title: "Valid email required",
                message: "Enter the email address registered on your account."
            });
            return;
        }

        setSendingResetEmail(true);

        try {
            await api.post(endpoints.auth.passwordResetEmailSend(), { email: candidateEmail });

            pushToast({
                type: "success",
                title: "Reset link sent",
                message: "If an account exists for this email, a password reset link has been sent to it. Check your inbox and spam folder."
            });
            setShowForgotPassword(false);
            setForgotEmail("");
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to send reset email",
                message: getApiErrorMessage(error, "Try again in a moment.")
            });
        } finally {
            setSendingResetEmail(false);
        }
    };

    const onSubmit = form.handleSubmit(async (values) => {
        setSubmitting(true);

        try {
            await signIn(values.email, values.password);
            pushToast({
                type: "success",
                title: "Signed in",
                message: "You are now signed in."
            });
            closeTwoFactorModal();
            navigate("/", { replace: true });
        } catch (error) {
            const authFlowError = error as AuthFlowError;

            if (authFlowError.code === "TWO_FACTOR_REQUIRED") {
                setTwoFactorModalOpen(true);
                pushToast({
                    type: "success",
                    title: "Authenticator code required",
                    message: "Enter the code from your authenticator app or use a backup recovery code."
                });
                return;
            }

            pushToast({
                type: "error",
                title: "Sign in failed",
                message: error instanceof Error ? error.message : "Unable to sign in."
            });
        } finally {
            setSubmitting(false);
        }
    });

    const handleVerifyTwoFactor = async () => {
        const values = form.getValues();
        const valid = await form.trigger(["email", "password"]);

        if (!valid) {
            return;
        }

        if (!showRecoveryCode && !/^\d{6}$/.test(totpCode.trim())) {
            pushToast({
                type: "error",
                title: "Invalid code",
                message: "Enter a valid 6-digit authenticator code."
            });
            return;
        }

        if (showRecoveryCode && !recoveryCode.trim()) {
            pushToast({
                type: "error",
                title: "Backup code required",
                message: "Enter one unused backup recovery code."
            });
            return;
        }

        setVerifyingTwoFactor(true);

        try {
            await signIn(values.email, values.password, {
                totpCode: showRecoveryCode ? undefined : totpCode.trim(),
                recoveryCode: showRecoveryCode ? recoveryCode.trim() : undefined
            });
            pushToast({
                type: "success",
                title: "Two-factor verified",
                message: "You are now signed in."
            });
            closeTwoFactorModal();
            navigate("/", { replace: true });
        } catch (error) {
            pushToast({
                type: "error",
                title: "Verification failed",
                message: error instanceof Error ? error.message : "Unable to verify the authenticator code."
            });
        } finally {
            setVerifyingTwoFactor(false);
        }
    };

    useEffect(() => {
        if (!twoFactorModalOpen || showRecoveryCode || verifyingTwoFactor) {
            return;
        }

        if (totpCode.length !== 6 || totpCode === lastAutoSubmittedOtp) {
            return;
        }

        setLastAutoSubmittedOtp(totpCode);
        void handleVerifyTwoFactor();
    }, [handleVerifyTwoFactor, lastAutoSubmittedOtp, showRecoveryCode, totpCode, twoFactorModalOpen, verifyingTwoFactor]);

    useEffect(() => {
        if (twoFactorModalOpen && !showRecoveryCode) {
            focusOtpDigit(0);
        }
    }, [showRecoveryCode, twoFactorModalOpen]);

    return (
        <div className={pageStyles.authShell}>
            <div className={`${pageStyles.authFrame} ${pageStyles.authFrameSplit}`}>
                <section className={`${pageStyles.authPanel} ${pageStyles.authPanelForm}`}>
                    <div className={pageStyles.authBrandRowSplit}>
                        <div className={pageStyles.authBrandIdentity}>
                            <img
                                src="/icon-ilboru.png"
                                alt="ILBORU-ALUMNI logo"
                                className={pageStyles.authBrandLogo}
                            />
                            <div>
                                <span className={pageStyles.authBrandText}>ILBORU ALUMNI SACCOS LTD</span>
                                <span className={pageStyles.authBrandMotto}>Further Together</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className={pageStyles.authThemeToggle}
                            aria-label="Toggle color mode"
                            onClick={toggleTheme}
                        >
                            {theme === "dark" ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
                        </button>
                    </div>

                    <div className={pageStyles.authIntro}>
                        <h1 className={pageStyles.authHeading}>Welcome back</h1>
                        <p className={pageStyles.authSubcopy}>Sign in to your member account.</p>
                    </div>

                    <form className={pageStyles.form} onSubmit={onSubmit}>
                        <FormField label="Username or email" error={form.formState.errors.email?.message}>
                            <input
                                type="text"
                                autoComplete="username"
                                {...form.register("email")}
                                placeholder={`firstname.surname (@${LOGIN_EMAIL_DOMAIN} added automatically)`}
                            />
                        </FormField>
                        <FormField label="Password" error={form.formState.errors.password?.message}>
                            <div className={pageStyles.passwordField}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    {...form.register("password")}
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    className={pageStyles.passwordToggle}
                                    onClick={() => setShowPassword((current) => !current)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                                </button>
                            </div>
                        </FormField>
                        <button
                            className={`primary-button ${pageStyles.authSubmit}`}
                            disabled={submitting}
                            type="submit"
                        >
                            {submitting ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    <div className={pageStyles.authLoginLinks}>
                        <button
                            className={pageStyles.authForgotLink}
                            type="button"
                            onClick={() => {
                                setForgotEmail(form.getValues("email") || "");
                                setShowForgotPassword(true);
                            }}
                        >
                            Forgot password?
                        </button>
                        <button
                            className={pageStyles.authForgotLink}
                            type="button"
                            onClick={() => {
                                setSetupEmail(form.getValues("email") || "");
                                setShowFirstTimeSetup(true);
                            }}
                        >
                            First-time user without password?
                        </button>
                        {registrationEnabled ? (
                            <RouterLink className={pageStyles.authForgotLink} to="/signup">
                                Apply for membership
                            </RouterLink>
                        ) : null}
                    </div>

                    <p className={pageStyles.authLegal}>
                        <RouterLink className={pageStyles.authLegalLink} to="/privacy-policy">
                            Privacy Policy
                        </RouterLink>{" "}
                        <span aria-hidden="true">/</span>{" "}
                        <RouterLink className={pageStyles.authLegalLink} to="/terms-and-agreement">
                            Terms & Agreement
                        </RouterLink>
                    </p>
                </section>

                <aside className={pageStyles.authVisual}>
                    {AUTH_SLIDES.map((slide, index) => (
                        <div
                            key={slide.image}
                            className={`${pageStyles.authSlide} ${index === activeSlide ? pageStyles.authSlideActive : ""}`}
                            style={{ backgroundImage: `url(${slide.image})` }}
                            aria-hidden="true"
                        />
                    ))}
                    <div className={pageStyles.authVisualOverlay} aria-hidden="true" />
                    <div className={pageStyles.authVisualTexture} aria-hidden="true" />
                    <div className={pageStyles.authVisualContent}>
                        <span className={pageStyles.authVisualMotto}>Member portal</span>
                        <div className={pageStyles.authVisualCaption} key={activeSlide}>
                            <span className={pageStyles.authVisualEyebrow}>{AUTH_SLIDES[activeSlide].eyebrow}</span>
                            <h2 className={pageStyles.authVisualTitle}>{AUTH_SLIDES[activeSlide].title}</h2>
                            <p className={pageStyles.authVisualCopy}>{AUTH_SLIDES[activeSlide].copy}</p>
                            {AUTH_SLIDES.length > 1 ? (
                                <div className={pageStyles.authSliderDots} role="tablist" aria-label="Slides">
                                    {AUTH_SLIDES.map((slide, index) => (
                                        <button
                                            key={slide.image}
                                            type="button"
                                            role="tab"
                                            aria-selected={index === activeSlide}
                                            aria-label={`Show slide ${index + 1}`}
                                            className={`${pageStyles.authSliderDot} ${index === activeSlide ? pageStyles.authSliderDotActive : ""}`}
                                            onClick={() => setActiveSlide(index)}
                                        />
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </aside>
            </div>

            {showFirstTimeSetup ? (
                <div className={pageStyles.setupModalBackdrop} onClick={() => setShowFirstTimeSetup(false)}>
                    <div
                        className={pageStyles.setupModalCard}
                        role="dialog"
                        aria-modal="true"
                        aria-label="First-time account setup"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className={pageStyles.setupModalHeader}>
                            <h3>First-time account setup</h3>
                            <p>
                                Enter your work email. If your member account exists with a registered phone,
                                we will send a one-time setup link by SMS.
                            </p>
                        </div>
                        <FormField label="Work email">
                            <input
                                type="email"
                                placeholder="name@saccos.local"
                                value={setupEmail}
                                onChange={(event) => setSetupEmail(event.target.value)}
                            />
                        </FormField>
                        <span className={pageStyles.firstLoginHint}>
                            The destination phone must already be registered on your profile.
                        </span>
                        <div className={pageStyles.setupModalActions}>
                            <button
                                className={pageStyles.otpModalLink}
                                type="button"
                                onClick={() => setShowFirstTimeSetup(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="secondary-button"
                                type="button"
                                disabled={sendingSetupLink}
                                onClick={() => void handleSendSetupLink()}
                            >
                                {sendingSetupLink ? "Sending link..." : "Send setup link"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {showForgotPassword ? (
                <div className={pageStyles.setupModalBackdrop} onClick={() => setShowForgotPassword(false)}>
                    <div
                        className={pageStyles.setupModalCard}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Reset your password"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className={pageStyles.setupModalHeader}>
                            <h3>Reset your password</h3>
                            <p>
                                Enter the email address registered on your account. We will send a
                                password reset link to your personal email.
                            </p>
                        </div>
                        <FormField label="Email address">
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={forgotEmail}
                                onChange={(event) => setForgotEmail(event.target.value)}
                            />
                        </FormField>
                        <span className={pageStyles.firstLoginHint}>
                            The link opens a page where you choose a new password. It expires after a short time.
                        </span>
                        <div className={pageStyles.setupModalActions}>
                            <button
                                className={pageStyles.otpModalLink}
                                type="button"
                                onClick={() => setShowForgotPassword(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="secondary-button"
                                type="button"
                                disabled={sendingResetEmail}
                                onClick={() => void handleSendResetEmail()}
                            >
                                {sendingResetEmail ? "Sending link..." : "Send reset link"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {twoFactorModalOpen ? (
                <div className={pageStyles.otpModalBackdrop}>
                    <div className={pageStyles.otpModalCard} role="dialog" aria-modal="true" aria-label="Two-factor verification">
                        <div className={pageStyles.otpModalHeader}>
                            <h3>{showRecoveryCode ? "Use backup recovery code" : "Verify authenticator code"}</h3>
                            <p>
                                {showRecoveryCode
                                    ? "Enter one unused backup code to recover access if your authenticator device is unavailable."
                                    : "Open your authenticator app and enter the current 6-digit TOTP code to complete sign in."}
                            </p>
                        </div>

                        {showRecoveryCode ? (
                            <FormField label="Backup recovery code">
                                <input
                                    type="text"
                                    placeholder="8F4K-3P92"
                                    value={recoveryCode}
                                    onChange={(event) => setRecoveryCode(event.target.value.toUpperCase())}
                                />
                            </FormField>
                        ) : (
                            <FormField
                                label="Authenticator code"
                                error={totpCode && !/^\d{6}$/.test(totpCode) ? "Enter a valid 6-digit code." : undefined}
                            >
                                <div className={pageStyles.otpDigitsRow}>
                                    {otpDigits.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(element) => {
                                                otpInputRefs.current[index] = element;
                                            }}
                                            className={pageStyles.otpDigitBox}
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            autoComplete={index === 0 ? "one-time-code" : "off"}
                                            maxLength={1}
                                            aria-label={`Authenticator digit ${index + 1}`}
                                            value={digit}
                                            onChange={(event) => handleOtpDigitChange(index, event.target.value)}
                                            onKeyDown={(event) => handleOtpDigitKeyDown(index, event)}
                                            onPaste={handleOtpPaste}
                                        />
                                    ))}
                                </div>
                            </FormField>
                        )}

                        <p className={pageStyles.authCopy}>
                            {showRecoveryCode
                                ? "Backup codes are single-use. A used code cannot be used again."
                                : verifyingTwoFactor
                                    ? "Verifying automatically as soon as the 6-digit code is complete."
                                    : "Authenticator apps supported: Google Authenticator, Microsoft Authenticator, Authy, Bitwarden, and 1Password."}
                        </p>

                        <div className={pageStyles.otpModalActions}>
                            {showRecoveryCode ? (
                                <button
                                    className="secondary-button"
                                    disabled={verifyingTwoFactor}
                                    type="button"
                                    onClick={() => void handleVerifyTwoFactor()}
                                >
                                    {verifyingTwoFactor ? "Verifying..." : "Verify & Sign In"}
                                </button>
                            ) : (
                                <span className={pageStyles.authAssistLabel}>
                                    {verifyingTwoFactor ? "Verifying code..." : "Code submits automatically."}
                                </span>
                            )}
                            <button
                                className={pageStyles.otpModalLink}
                                type="button"
                                onClick={() => setShowRecoveryCode((current) => !current)}
                            >
                                {showRecoveryCode ? "Use authenticator code instead" : "Use backup recovery code"}
                            </button>
                            <button
                                className={pageStyles.otpModalLink}
                                type="button"
                                onClick={closeTwoFactorModal}
                            >
                                Change credentials
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
