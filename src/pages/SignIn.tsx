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
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";

import { useAuth } from "../auth/AuthContext";
import { isSessionRemembered, setRememberSession } from "../auth/rememberSession";
import { useToast } from "../components/Toast";
import { api, getApiErrorMessage } from "../lib/api";
import { endpoints, type PasswordSetupLinkSendResponse } from "../lib/endpoints";
import { useLanguage } from "../ui/LanguageProvider";
import { useUI } from "../ui/UIProvider";
import styles from "./SignIn.module.css";

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

// Slides for the right-hand brand panel. The panel is a navy gradient rather
// than photography, so slides carry copy only. Each string is [EN, SW].
const AUTH_SLIDES = [
    {
        id: "savings",
        eyebrow: ["Savings & shares", "Akiba na hisa"],
        title: ["Grow your wealth, together", "Kukuza mali, kwa pamoja"],
        copy: [
            "Track your savings, shares and dividends in one secure place — always up to date.",
            "Fuatilia akiba, hisa na gawio lako mahali pamoja salama — taarifa za wakati halisi."
        ]
    },
    {
        id: "borrowing",
        eyebrow: ["Borrowing", "Mikopo"],
        title: ["Borrow up to three times your savings", "Kopa hadi mara tatu ya akiba yako"],
        copy: [
            "See your limit before you apply, with the rate and repayment terms stated up front.",
            "Ona kikomo chako kabla ya kuomba, pamoja na riba na masharti ya marejesho."
        ]
    },
    {
        id: "transparency",
        eyebrow: ["Transparency", "Uwazi"],
        title: ["Every shilling accounted for", "Kila shilingi inaonekana"],
        copy: [
            "The cooperative position, milestones and dividend allocations are open to every member.",
            "Hali ya ushirika, hatua na mgawanyo wa gawio ziko wazi kwa kila mwanachama."
        ]
    }
] as const;

const AUTH_SLIDE_INTERVAL_MS = 6000;

// Cooperative figures shown on the brand panel. These are static: the sign-in
// screen is unauthenticated and there is no public stats endpoint. Update here,
// or replace with a public read-only endpoint if the SACCO is comfortable
// publishing live totals. The figures themselves never translate.
const SACCO_STATS = [
    { key: "members", label: ["Members", "Wanachama"], value: "151" },
    { key: "savings", label: ["Member savings", "Akiba ya wanachama"], value: "TZS 1.67B" },
    { key: "dividends", label: ["Dividends shared", "Gawio lililogawiwa"], value: "TZS 56.9M" }
] as const;

const SUPPORT_EMAIL = "support@ias.co.tz";

// Deliberately does not say whether the username exists.
const SIGN_IN_ERROR = [
    "We could not match those details. Check your username, or reset your password.",
    "Hatukuweza kuthibitisha taarifa hizo. Angalia jina la mtumiaji au weka upya nywila."
] as const;

const LANGUAGES = ["EN", "SW"] as const;

export function SignInPage() {
    const navigate = useNavigate();
    const { pushToast } = useToast();
    const { signIn } = useAuth();
    const { theme, toggleTheme } = useUI();
    const { lang, setLang, t } = useLanguage();
    // Slide and stat copy are stored as [EN, SW] tuples.
    const langIndex = lang === "SW" ? 1 : 0;
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(isSessionRemembered);
    // Shown in the notice block under the button. Sign-in failures surface here
    // rather than as a toast, so the recovery route sits next to the form. Held
    // as a flag, not a message, so the copy follows a language switch.
    const [signInFailed, setSignInFailed] = useState(false);
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
        const candidateEmail = normalizeLoginIdentifier(setupEmail);
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
        const candidateEmail = normalizeLoginIdentifier(forgotEmail);
        const parsed = z.string().email().safeParse(candidateEmail);

        if (!parsed.success) {
            pushToast({
                type: "error",
                title: "Valid username or email required",
                message: "Enter your username or the email address registered on your account."
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
        setSignInFailed(false);
        setRememberSession(remember);

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

            setSignInFailed(true);
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
        <div className={`member-surface ${styles.shell}`}>
            <div className={styles.card}>
                <section className={styles.formPanel}>
                    <div className={styles.brandRow}>
                        <div className={styles.brandIdentity}>
                            <span className={styles.brandLogo}>
                                <img src="/icon-ilboru.png" alt="" />
                            </span>
                            <span className={styles.brandNames}>
                                <span className={styles.brandName}>ILBORU ALUMNI SACCOS LTD</span>
                                <span className={styles.brandMotto}>Further together</span>
                            </span>
                        </div>
                        <div className={styles.headerControls}>
                            <div className={styles.langPill} role="group" aria-label="Language">
                                {LANGUAGES.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        className={`${styles.langOption} ${lang === option ? styles.langOptionActive : ""}`}
                                        aria-pressed={lang === option}
                                        onClick={() => setLang(option)}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                className={styles.themeToggle}
                                aria-label={t("Toggle colour mode", "Badilisha mwonekano")}
                                onClick={toggleTheme}
                            >
                                {theme === "dark" ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
                            </button>
                        </div>
                    </div>

                    <div className={styles.intro}>
                        <h1 className={styles.heading}>{t("Welcome back", "Karibu tena")}</h1>
                        <p className={styles.subcopy}>
                            {t("Sign in to your member account.", "Ingia kwenye akaunti yako ya uanachama.")}
                        </p>
                    </div>

                    <form className={styles.form} onSubmit={onSubmit}>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="signin-username">
                                {t("Username or email", "Jina la mtumiaji au barua pepe")}
                            </label>
                            <input
                                id="signin-username"
                                className={styles.input}
                                type="text"
                                autoComplete="username"
                                placeholder="firstname.surname"
                                {...form.register("email")}
                            />
                            <span className={styles.hint}>
                                {t(
                                    `@${LOGIN_EMAIL_DOMAIN} is added automatically.`,
                                    `@${LOGIN_EMAIL_DOMAIN} huongezwa kiotomatiki.`
                                )}
                            </span>
                            {form.formState.errors.email?.message ? (
                                <span className={styles.fieldError}>{form.formState.errors.email.message}</span>
                            ) : null}
                        </div>

                        <div className={styles.field}>
                            <div className={styles.labelRow}>
                                <label className={styles.label} htmlFor="signin-password">
                                    {t("Password", "Nywila")}
                                </label>
                                <button
                                    type="button"
                                    className={styles.showToggle}
                                    onClick={() => setShowPassword((current) => !current)}
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? t("Hide", "Ficha") : t("Show", "Onyesha")}
                                </button>
                            </div>
                            <input
                                id="signin-password"
                                className={styles.input}
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                placeholder="••••••••"
                                {...form.register("password")}
                            />
                            {form.formState.errors.password?.message ? (
                                <span className={styles.fieldError}>{form.formState.errors.password.message}</span>
                            ) : null}
                        </div>

                        <div className={styles.optionsRow}>
                            <label className={styles.remember}>
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(event) => {
                                        setRemember(event.target.checked);
                                        setRememberSession(event.target.checked);
                                    }}
                                />
                                <span className={styles.checkbox} aria-hidden="true">
                                    <CheckRoundedIcon />
                                </span>
                                {t("Keep me signed in", "Nikumbuke")}
                            </label>
                            <button
                                className={styles.linkButton}
                                type="button"
                                onClick={() => {
                                    setForgotEmail(form.getValues("email") || "");
                                    setShowForgotPassword(true);
                                }}
                            >
                                {t("Forgot password?", "Umesahau nywila?")}
                            </button>
                        </div>

                        <button className={styles.submit} disabled={submitting} type="submit">
                            {submitting ? t("Signing in…", "Inaingia…") : t("Sign in", "Ingia")}
                        </button>

                        {submitting ? (
                            <div className={`${styles.notice} ${styles.noticeLoading}`} role="status">
                                {t("Checking your details…", "Tunahakiki taarifa zako…")}
                            </div>
                        ) : signInFailed ? (
                            <div className={`${styles.notice} ${styles.noticeError}`} role="alert">
                                {SIGN_IN_ERROR[langIndex]}
                            </div>
                        ) : null}
                    </form>

                    <div className={styles.secondaryActions}>
                        <button
                            className={styles.secondaryCard}
                            type="button"
                            onClick={() => {
                                setSetupEmail(form.getValues("email") || "");
                                setShowFirstTimeSetup(true);
                            }}
                        >
                            <span className={styles.secondaryCardTitle}>
                                {t("First-time user?", "Mara ya kwanza?")}
                            </span>
                            <span className={styles.secondaryCardCopy}>
                                {t(
                                    "Set a password with your member number.",
                                    "Weka nywila kwa namba ya uanachama."
                                )}
                            </span>
                        </button>
                        {registrationEnabled ? (
                            <RouterLink className={styles.secondaryCard} to="/signup">
                                <span className={styles.secondaryCardTitle}>
                                    {t("Apply for membership", "Omba uanachama")}
                                </span>
                                <span className={styles.secondaryCardCopy}>
                                    {t("Open to Ilboru alumni.", "Kwa wahitimu wa Ilboru.")}
                                </span>
                            </RouterLink>
                        ) : null}
                    </div>

                    <div className={styles.footer}>
                        <p className={styles.footerLinks}>
                            <RouterLink className={styles.footerLink} to="/privacy-policy">
                                Privacy Policy
                            </RouterLink>
                            <span aria-hidden="true">·</span>
                            <RouterLink className={styles.footerLink} to="/terms-and-agreement">
                                Terms &amp; Agreement
                            </RouterLink>
                            <span aria-hidden="true">·</span>
                            <span>
                                {t("Need help?", "Msaada?")}{" "}
                                <a className={styles.footerLink} href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                            </span>
                        </p>
                        <p className={styles.footerCredit}>
                            Powered by <strong>Makutano Digital</strong>
                        </p>
                    </div>
                </section>

                <aside className={styles.visual}>
                    <div className={styles.visualGrid} aria-hidden="true" />
                    <div className={styles.visualGlow} aria-hidden="true" />

                    <div className={styles.visualTop}>
                        <span className={styles.visualLabel}>Member portal</span>
                    </div>

                    <div className={styles.visualBody}>
                        <div className={styles.slideCaption} key={`${activeSlide}-${lang}`}>
                            <span className={styles.slideKicker}>{AUTH_SLIDES[activeSlide].eyebrow[langIndex]}</span>
                            <h2 className={styles.slideTitle}>{AUTH_SLIDES[activeSlide].title[langIndex]}</h2>
                            <p className={styles.slideCopy}>{AUTH_SLIDES[activeSlide].copy[langIndex]}</p>
                        </div>
                        <div className={styles.dots} role="tablist" aria-label={t("Highlights", "Vivutio")}>
                            {AUTH_SLIDES.map((slide, index) => (
                                <button
                                    key={slide.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={index === activeSlide}
                                    aria-label={slide.title[langIndex]}
                                    className={`${styles.dot} ${index === activeSlide ? styles.dotActive : ""}`}
                                    onClick={() => setActiveSlide(index)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={styles.visualStats}>
                        {SACCO_STATS.map((stat) => (
                            <div className={styles.visualStat} key={stat.key}>
                                <span className={styles.visualStatValue}>{stat.value}</span>
                                <span className={styles.visualStatLabel}>{stat.label[langIndex]}</span>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>

            {showFirstTimeSetup ? (
                <div className={styles.modalBackdrop} onClick={() => setShowFirstTimeSetup(false)}>
                    <div
                        className={styles.modalCard}
                        role="dialog"
                        aria-modal="true"
                        aria-label="First-time account setup"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <h3>{t("First-time account setup", "Usanidi wa akaunti kwa mara ya kwanza")}</h3>
                            <p>
                                {t(
                                    "Enter your work email. If your member account exists with a registered phone, we will send a one-time setup link by SMS.",
                                    "Weka barua pepe yako ya kazi. Kama akaunti yako ya uanachama ipo na namba ya simu iliyosajiliwa, tutatuma kiungo cha usanidi kwa SMS."
                                )}
                            </p>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="setup-email">
                                {t("Work email", "Barua pepe ya kazi")}
                            </label>
                            <input
                                id="setup-email"
                                className={styles.input}
                                type="email"
                                placeholder="firstname.surname"
                                value={setupEmail}
                                onChange={(event) => setSetupEmail(event.target.value)}
                            />
                            <span className={styles.hint}>
                                {t(
                                    "The destination phone must already be registered on your profile.",
                                    "Namba ya simu inayopokea lazima iwe tayari imesajiliwa kwenye wasifu wako."
                                )}
                            </span>
                        </div>
                        <div className={styles.modalActions}>
                            <button
                                className={styles.modalGhost}
                                type="button"
                                onClick={() => setShowFirstTimeSetup(false)}
                            >
                                {t("Cancel", "Ghairi")}
                            </button>
                            <button
                                className={styles.modalPrimary}
                                type="button"
                                disabled={sendingSetupLink}
                                onClick={() => void handleSendSetupLink()}
                            >
                                {sendingSetupLink
                                    ? t("Sending link…", "Inatuma kiungo…")
                                    : t("Send setup link", "Tuma kiungo cha usanidi")}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {showForgotPassword ? (
                <div className={styles.modalBackdrop} onClick={() => setShowForgotPassword(false)}>
                    <div
                        className={styles.modalCard}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Reset your password"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <h3>{t("Reset your password", "Weka upya nywila yako")}</h3>
                            <p>
                                {t(
                                    "Enter your username or the email address registered on your account. We will send a password reset link to your personal email (SACCO, Gmail, or Yahoo accounts are all supported).",
                                    "Weka jina lako la mtumiaji au barua pepe iliyosajiliwa kwenye akaunti yako. Tutatuma kiungo cha kuweka upya nywila kwenye barua pepe yako binafsi (SACCO, Gmail au Yahoo zote zinakubalika)."
                                )}
                            </p>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="forgot-email">
                                {t("Username or email", "Jina la mtumiaji au barua pepe")}
                            </label>
                            <input
                                id="forgot-email"
                                className={styles.input}
                                type="text"
                                placeholder="username or name@example.com"
                                value={forgotEmail}
                                onChange={(event) => setForgotEmail(event.target.value)}
                            />
                            <span className={styles.hint}>
                                {t(
                                    "The link opens a page where you choose a new password. It expires after a short time.",
                                    "Kiungo hufungua ukurasa wa kuchagua nywila mpya. Muda wake huisha baada ya kitambo."
                                )}
                            </span>
                        </div>
                        <div className={styles.modalActions}>
                            <button
                                className={styles.modalGhost}
                                type="button"
                                onClick={() => setShowForgotPassword(false)}
                            >
                                {t("Cancel", "Ghairi")}
                            </button>
                            <button
                                className={styles.modalPrimary}
                                type="button"
                                disabled={sendingResetEmail}
                                onClick={() => void handleSendResetEmail()}
                            >
                                {sendingResetEmail
                                    ? t("Sending link…", "Inatuma kiungo…")
                                    : t("Send reset link", "Tuma kiungo")}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {twoFactorModalOpen ? (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modalCard} role="dialog" aria-modal="true" aria-label="Two-factor verification">
                        <div className={styles.modalHeader}>
                            <h3>
                                {showRecoveryCode
                                    ? t("Use backup recovery code", "Tumia msimbo wa dharura")
                                    : t("Verify authenticator code", "Thibitisha msimbo wa uthibitishaji")}
                            </h3>
                            <p>
                                {showRecoveryCode
                                    ? t(
                                        "Enter one unused backup code to recover access if your authenticator device is unavailable.",
                                        "Weka msimbo mmoja wa dharura ambao haujatumika ikiwa kifaa chako cha uthibitishaji hakipatikani."
                                    )
                                    : t(
                                        "Open your authenticator app and enter the current 6-digit TOTP code to complete sign in.",
                                        "Fungua programu yako ya uthibitishaji na weka msimbo wa tarakimu 6 ili kukamilisha kuingia."
                                    )}
                            </p>
                        </div>

                        {showRecoveryCode ? (
                            <div className={styles.field}>
                                <label className={styles.label} htmlFor="recovery-code">
                                    {t("Backup recovery code", "Msimbo wa dharura")}
                                </label>
                                <input
                                    id="recovery-code"
                                    className={styles.input}
                                    type="text"
                                    placeholder="8F4K-3P92"
                                    value={recoveryCode}
                                    onChange={(event) => setRecoveryCode(event.target.value.toUpperCase())}
                                />
                            </div>
                        ) : (
                            <div className={styles.field}>
                                <span className={styles.label}>
                                    {t("Authenticator code", "Msimbo wa uthibitishaji")}
                                </span>
                                <div className={styles.otpRow}>
                                    {otpDigits.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(element) => {
                                                otpInputRefs.current[index] = element;
                                            }}
                                            className={styles.otpBox}
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
                                {totpCode && !/^\d{6}$/.test(totpCode) ? (
                                    <span className={styles.fieldError}>
                                        {t("Enter a valid 6-digit code.", "Weka msimbo sahihi wa tarakimu 6.")}
                                    </span>
                                ) : null}
                            </div>
                        )}

                        <p className={styles.modalNote}>
                            {showRecoveryCode
                                ? t(
                                    "Backup codes are single-use. A used code cannot be used again.",
                                    "Misimbo ya dharura hutumika mara moja tu. Msimbo uliotumika hauwezi kutumika tena."
                                )
                                : verifyingTwoFactor
                                    ? t(
                                        "Verifying automatically as soon as the 6-digit code is complete.",
                                        "Uthibitishaji hufanyika mara tu tarakimu 6 zinapokamilika."
                                    )
                                    : t(
                                        "Authenticator apps supported: Google Authenticator, Microsoft Authenticator, Authy, Bitwarden, and 1Password.",
                                        "Programu zinazokubalika: Google Authenticator, Microsoft Authenticator, Authy, Bitwarden na 1Password."
                                    )}
                        </p>

                        <div className={styles.modalActions}>
                            <button
                                className={styles.modalGhost}
                                type="button"
                                onClick={closeTwoFactorModal}
                            >
                                {t("Change credentials", "Badilisha taarifa")}
                            </button>
                            <button
                                className={styles.modalGhost}
                                type="button"
                                onClick={() => setShowRecoveryCode((current) => !current)}
                            >
                                {showRecoveryCode
                                    ? t("Use authenticator code instead", "Tumia msimbo wa programu badala yake")
                                    : t("Use backup recovery code", "Tumia msimbo wa dharura")}
                            </button>
                            {showRecoveryCode ? (
                                <button
                                    className={styles.modalPrimary}
                                    disabled={verifyingTwoFactor}
                                    type="button"
                                    onClick={() => void handleVerifyTwoFactor()}
                                >
                                    {verifyingTwoFactor
                                        ? t("Verifying…", "Inathibitisha…")
                                        : t("Verify & sign in", "Thibitisha na uingie")}
                                </button>
                            ) : (
                                <span className={styles.modalNote}>
                                    {verifyingTwoFactor
                                        ? t("Verifying code…", "Inathibitisha msimbo…")
                                        : t("Code submits automatically.", "Msimbo hutumwa kiotomatiki.")}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
