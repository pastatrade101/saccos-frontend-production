import { MotionCard, MotionModal, easeOutFast, springSoft, useReducedMotionSafe } from "../ui/motion";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import ContactPhoneRoundedIcon from "@mui/icons-material/ContactPhoneRounded";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";
import CardMembershipRoundedIcon from "@mui/icons-material/CardMembershipRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import ApprovalRoundedIcon from "@mui/icons-material/ApprovalRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import CreditScoreRoundedIcon from "@mui/icons-material/CreditScoreRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import NorthEastRoundedIcon from "@mui/icons-material/NorthEastRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import TipsAndUpdatesRoundedIcon from "@mui/icons-material/TipsAndUpdatesRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import WalletRoundedIcon from "@mui/icons-material/WalletRounded";
import WorkspacesRoundedIcon from "@mui/icons-material/WorkspacesRounded";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Divider,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Chip,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Drawer,
    FormControlLabel,
    Grid,
    IconButton,
    InputBase,
    List,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    LinearProgress,
    Skeleton,
    Stack,
    Step,
    StepLabel,
    Stepper,
    Switch,
    Tab,
    Tabs,
    TablePagination,
    ToggleButton,
    ToggleButtonGroup,
    TextField,
    Typography,
    useMediaQuery
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "../auth/AuthContext";
import { ChartPanel } from "../components/ChartPanel";
import { ConfirmModal } from "../components/ConfirmModal";
import { DataTable, type Column } from "../components/DataTable";
import type { MemberAlertItem } from "../components/member-overview";
import { MemberPortalFeatureTour } from "../components/member-portal/MemberPortalFeatureTour";
import { PortalShell } from "../components/member-portal/PortalShell";
import { MemberNotificationBell } from "../components/member-portal/MemberNotificationBell";
import { MemberProfileMenu } from "../components/member-portal/MemberProfileMenu";
import { DetailCards } from "../components/member-portal/overview/DetailCards";
import { OverviewSection } from "../components/member-portal/overview/OverviewSection";
import { DEPLOYMENT_COLOURS, SaccoSection } from "../components/member-portal/sacco/SaccoSection";
import { LeagueSection, leagueColour } from "../components/member-portal/league/LeagueSection";
import { TransactionsSection } from "../components/member-portal/transactions/TransactionsSection";
import { AccountsSection } from "../components/member-portal/accounts/AccountsSection";
import { LoanStatusDonut, LoansHero } from "../components/member-portal/loans/LoansHero";
import { LoanApplicationsPanel } from "../components/member-portal/loans/LoanApplicationsPanel";
import { EmptyState } from "../components/member-portal/EmptyState";
import loanLayoutStyles from "../components/member-portal/loans/LoansHero.module.css";
import { ReportsSection } from "../components/member-portal/reports/ReportsSection";
import memberContentStyles from "../components/member-portal/MemberContent.module.css";
import { SavingsTrendChart } from "../components/member-overview/SavingsTrendChart";
import { MemberLoanWorkspaceCard } from "../components/member-portal/MemberLoanWorkspaceCard";
import { LoanTermsCard } from "../components/member-portal/LoanTermsCard";
import { LoanSchedulePreview } from "../components/member-portal/LoanSchedulePreview";
import { HeirsSection } from "../components/member-portal/HeirsSection";
import { PaymentReceiptDialog } from "../components/member-portal/PaymentReceiptDialog";
import { LoanEligibilitySummary } from "../components/loan-capacity/LoanEligibilitySummary";
import { SaccoBankAccountCard } from "../components/member-overview/SaccoBankAccountCard";
import { SearchableSelect } from "../components/SearchableSelect";
import { useToast } from "../components/Toast";
import { ProfileAvatarUploader } from "../components/ProfileAvatarUploader";
import { MemberPortalSkeleton } from "../components/MemberPortalSkeleton";
import { findLocationByName, useTanzaniaLocations } from "../hooks/useTanzaniaLocations";
import { api, getApiErrorCode, getApiErrorDetails, getApiErrorMessage } from "../lib/api";
import {
    endpoints,
    type CreateLoanApplicationRequest,
    type UpdateLoanApplicationRequest,
    type LoanApplicationResponse,
    type LoanApplicationsResponse,
    type BestLoanCapacityResponse,
    type LoanCapacityResponse,
    type LoanProductsResponse,
    type LoansResponse,
    type LoanSchedulesResponse,
    type LoanTransactionsResponse,
    type MemberAccountsResponse,
    type MemberMonthlyCommitmentStatus,
    type MemberMonthlyCommitmentStatusResponse,
    type MembersResponse,
    type MemberPortalPaymentControlsResponse,
    type UpdateOwnMemberProfileCompletionRequest,
    type UpdateOwnMemberProfileCompletionResponse,
    type MemberApplicationResponse,
    type StatementsResponse,
    type GuarantorCapacityLookup,
    type GuarantorCapacityResponse,
    type GuarantorSearchHit,
    type GuarantorSearchResponse,
    type TopUpQuote,
    type TopUpQuoteResponse,
    type GuarantorConsentRequest,
    type GuarantorRequestItem,
    type GuarantorRequestsResponse,
    type InitiateContributionPaymentRequest,
    type InitiateContributionPaymentResponse,
    type PaymentOrdersResponse,
    type PaymentOrderStatusResponse,
    type ReconcilePaymentOrderResponse,
    type SaccoFinancialYearSettingsResponse,
    type SaccoPerformanceTargetSettingsResponse,
    type ShareCapitalSettingsResponse,
    type MemberShareRequirement
} from "../lib/endpoints";
import { brandColors, crestGold, darkThemeColors, displayFontFamily, inkPanel } from "../theme/colors";
import { useLanguage } from "../ui/LanguageProvider";
import { useUI } from "../ui/UIProvider";
import type { LeagueStandings, Loan, LoanApplication, MyLeaguePosition, LoanCapacitySummary, LoanProduct, LoanSchedule, LoanTransaction, Member, MemberAccount, MemberApplication, MemberApplicationStatus, MemberPortalPaymentControls, PaymentOrder, SaccoFinancialYearSettings, SaccoMilestoneBoard, OperationsStatement,  SaccoOverview, SaccoPerformanceTargetSettings, StatementRow } from "../types/api";
import { downloadLoanStatementPdf, downloadMemberStatementPdf, loadReportLogoDataUrl } from "../utils/memberStatementPdf";
import { memberApplicationStatusLabels } from "../utils/member-application-status";
import {
    formatNextOfKinRelationship,
    isLegacyNextOfKinRelationship,
    isSupportedNextOfKinRelationship,
    LEGACY_NEXT_OF_KIN_RELATIONSHIP_VALUES,
    NEXT_OF_KIN_RELATIONSHIP_OPTIONS,
    NEXT_OF_KIN_RELATIONSHIP_VALUES
} from "../utils/nextOfKin";
import { formatCurrency, formatCurrencyCompact, formatDate, formatRole } from "../utils/format";
import { annualToMonthlyRate, formatMonthlyLoanRate } from "../utils/loanInterest";
import { computeLoanOverdueBalance, contractualInstallment, nextContractualDueDate } from "../utils/loanOverdue";
import { projectLoanSchedule } from "../utils/loanSchedule";
import { DEFAULT_SACCO_FINANCIAL_YEAR_SETTINGS, resolveFinancialYearPeriod } from "../utils/financialYear";
import {
    calculateMemberPerformanceTarget,
    DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS,
    normalizeSaccoPerformanceTargetSettings
} from "../utils/performanceTarget";

type LoanRepaymentFrequency = "daily" | "weekly" | "monthly";

const SUPPORTED_LOAN_REPAYMENT_FREQUENCIES: LoanRepaymentFrequency[] = ["daily", "weekly", "monthly"];
const loanReferencePattern = /^[A-Za-z0-9_-]+$/;

function stripHtml(value: string) {
    return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " ");
}

function normalizeWhitespace(value: string) {
    return value.replace(/\s+/g, " ").trim();
}

function sanitizeLoanPurpose(value: string) {
    return normalizeWhitespace(stripHtml(value || ""));
}

function sanitizeLoanReference(value: string) {
    return normalizeWhitespace(stripHtml(value || ""));
}

function toPositiveNumber(value: unknown, fallback: number | null) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return fallback;
    }
    return parsed;
}

function getNumericDetail(details: unknown, key: string) {
    if (!details || typeof details !== "object") {
        return null;
    }

    const value = Number((details as Record<string, unknown>)[key]);
    return Number.isFinite(value) ? value : null;
}

function getLoanEligibilityRuleNumber(rules: Record<string, unknown> | undefined, keys: string[], fallback: number | null) {
    for (const key of keys) {
        if (rules && Object.prototype.hasOwnProperty.call(rules, key)) {
            const parsed = toPositiveNumber(rules[key], fallback);
            if (parsed !== null) {
                return parsed;
            }
        }
    }

    return fallback;
}

function resolveLoanAllowedFrequencies(product?: LoanProduct | null) {
    const rules = product?.eligibility_rules_json;
    const candidates = [
        rules?.allowed_repayment_frequencies,
        rules?.allowedRepaymentFrequencies,
        rules?.repayment_frequencies,
        rules?.repaymentFrequencies
    ];

    for (const candidate of candidates) {
        if (!Array.isArray(candidate)) {
            continue;
        }

        const frequencies = candidate
            .map((value) => String(value || "").trim().toLowerCase())
            .filter((value): value is LoanRepaymentFrequency => SUPPORTED_LOAN_REPAYMENT_FREQUENCIES.includes(value as LoanRepaymentFrequency));

        if (frequencies.length) {
            return Array.from(new Set(frequencies));
        }
    }

    return [...SUPPORTED_LOAN_REPAYMENT_FREQUENCIES];
}

function resolveLoanEligibilityPolicy(product?: LoanProduct | null) {
    const rules = product?.eligibility_rules_json;

    return {
        savingsMultiplier: getLoanEligibilityRuleNumber(rules, [
            "savings_multiplier",
            "savingsMultiplier",
            "savings_balance_multiplier",
            "savingsBalanceMultiplier",
            "savings_eligibility_multiplier",
            "savingsEligibilityMultiplier"
        ], 1) ?? 1,
        sharesMultiplier: 0,
        baseEligibilityAmount: getLoanEligibilityRuleNumber(rules, [
            "base_eligibility_amount",
            "baseEligibilityAmount"
        ], 0) ?? 0,
        eligibilityCapAmount: getLoanEligibilityRuleNumber(rules, [
            "eligibility_cap_amount",
            "eligibilityCapAmount",
            "max_eligible_amount",
            "maxEligibleAmount"
        ], null),
        allowedRepaymentFrequencies: resolveLoanAllowedFrequencies(product)
    };
}

function formatWholeNumber(value: number | string | null | undefined) {
    const digits = String(value ?? "").replace(/[^\d]/g, "");
    if (!digits) {
        return "";
    }

    return new Intl.NumberFormat("en-TZ").format(Number(digits));
}

function parseMoneyValue(value: string) {
    const parsed = Number(value.replace(/[^\d.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
}

function parseSavingsTargetFromNotes(notes?: string | null) {
    if (!notes) {
        return 0;
    }

    const match = notes.match(/(?:annual_target|performance_target|target)\s*[:=]\s*([0-9,.]+)/i);
    return match?.[1] ? parseMoneyValue(match[1]) : 0;
}

function resolveMemberSavingsTarget(member?: Member | null) {
    const notesTarget = parseSavingsTargetFromNotes(member?.notes);
    if (notesTarget > 0) {
        return notesTarget;
    }

    const configuredTarget = Number(member?.monthly_savings_commitment || 0);
    if (Number.isFinite(configuredTarget) && configuredTarget > 0) {
        return configuredTarget;
    }

    return DEFAULT_MEMBER_ANNUAL_SAVINGS_TARGET;
}

function resolveMemberFinancialLevel(progressPercent: number, actualAmount: number) {
    if (progressPercent >= 100) {
        return { label: "Target met", tone: "success" as const };
    }

    if (progressPercent >= 60) {
        return { label: "On track", tone: "neutral" as const };
    }

    if (progressPercent >= 40) {
        return { label: "Building", tone: "warning" as const };
    }

    if (actualAmount > 0) {
        return { label: "Needs top-up", tone: "danger" as const };
    }

    return { label: "No activity", tone: "neutral" as const };
}

function getRepaymentPeriodsPerYear(frequency: LoanRepaymentFrequency) {
    if (frequency === "daily") {
        return 365;
    }

    if (frequency === "weekly") {
        return 52;
    }

    return 12;
}

function getRepaymentFrequencyLabel(frequency: LoanRepaymentFrequency) {
    if (frequency === "daily") {
        return "Daily";
    }

    if (frequency === "weekly") {
        return "Weekly";
    }

    return "Monthly";
}

function estimateInstallment(amount: number, annualRate: number, termCount: number, frequency: LoanRepaymentFrequency) {
    if (!(amount > 0) || !(termCount > 0)) {
        return null;
    }

    const ratePerPeriod = annualRate > 0 ? (annualRate / 100) / getRepaymentPeriodsPerYear(frequency) : 0;

    let installment = amount / termCount;
    if (ratePerPeriod > 0) {
        installment = amount * ratePerPeriod / (1 - Math.pow(1 + ratePerPeriod, -termCount));
    }

    const totalRepayment = installment * termCount;
    return {
        installment,
        totalRepayment
    };
}

const loanApplicationSchema = z.object({
    product_id: z.string().uuid("Select a loan product."),
    // Free text. Members write in Swahili and English, with hyphens, brackets
    // and apostrophes, so the only rules are "say something" and an upper bound
    // that keeps a runaway paste out of the column. sanitizeLoanPurpose still
    // strips HTML and collapses whitespace.
    purpose: z.string()
        .transform((value) => sanitizeLoanPurpose(value))
        .refine((value) => value.length >= 1, "Say what the loan is for.")
        .refine((value) => value.length <= 2000, "Loan purpose cannot exceed 2000 characters"),
    requested_amount: z.coerce.number().min(10000, "Requested amount must be at least TZS 10,000"),
    requested_term_count: z.coerce.number().int("Loan term must be a whole number").min(1, "Loan term must be at least 1 month"),
    requested_repayment_frequency: z.enum(["daily", "weekly", "monthly"]).default("monthly"),
    requested_interest_rate: z.coerce.number().min(0).max(100),
    external_reference: z.string()
        .transform((value) => sanitizeLoanReference(value))
        .refine((value) => !value || value.length <= 100, "Application reference cannot exceed 100 characters")
        .refine((value) => !value || loanReferencePattern.test(value), "Reference may contain only letters, numbers, dashes, and underscores")
        .optional()
        .or(z.literal("")),
    payout_method: z.enum(["cash", "direct_deposit", "bank_transfer"]).default("cash"),
    repayment_mode: z.enum(["check_off", "standing_order"]).default("check_off"),
    loan_category: z.enum(["new", "top_up"]).default("new"),
    top_up_of_loan_id: z.string().optional().or(z.literal("")),
    deposit_purchase_amount: z.coerce.number().min(0).default(0),
    application_fee_paid: z.boolean().default(false),
    payout_bank_name: z.string().trim().max(120).optional().or(z.literal("")),
    payout_bank_branch: z.string().trim().max(120).optional().or(z.literal("")),
    payout_account_name: z.string().trim().max(120).optional().or(z.literal("")),
    payout_account_number: z.string().trim().max(50).optional().or(z.literal("")),
    confirmation_checked: z.boolean().refine((value) => value, {
        message: "Confirm the application details before submission."
    }),
    declaration_accepted: z.boolean().refine((value) => value, {
        message: "You must accept the declaration and CRB consent to apply."
    }),
    terms_accepted: z.boolean().default(false)
});

type LoanApplicationValues = z.infer<typeof loanApplicationSchema>;

const contributionPaymentSchema = z.object({
    account_id: z.string().uuid("Select an account.").optional().or(z.literal("")),
    loan_id: z.string().uuid("Select a loan.").optional().or(z.literal("")),
    amount: z.coerce.number().positive("Enter a contribution amount.").multipleOf(0.01, "Use up to two decimal places."),
    provider: z.enum(["airtel", "vodacom", "tigo", "halopesa"]),
    msisdn: z.string().trim().min(9, "Phone number is required.").max(20, "Phone number is too long."),
    description: z.string().trim().max(255).optional().or(z.literal(""))
});

type ContributionPaymentValues = z.infer<typeof contributionPaymentSchema>;
type MemberPaymentPurpose = "share_contribution" | "savings_deposit" | "membership_fee" | "loan_repayment";
type DateRangePreset = "month" | "quarter" | "year" | "custom";

// Tanzania mobile (2556/2557 normalized) OR an international E.164 number with a
// leading + — the SACCO has diaspora members (+254, +61, +44, +1, ...) whose real
// numbers must not block profile completion.
const memberProfileCompletionPhonePattern = /^(?:255[67]\d{8}|\+[1-9]\d{6,14})$/;
// Coerce stored phone formats (07XXXXXXXX, +2557XXXXXXXX, 7XXXXXXXX) into the
// 2557XXXXXXXX shape the form expects; non-Tanzanian numbers keep their + prefix.
function normalizePortalPhone(value?: string | null) {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) {
        return "";
    }
    if (digits.startsWith("255")) {
        return digits.slice(0, 12);
    }
    if (digits.startsWith("0") && /^0[67]/.test(digits)) {
        return `255${digits.slice(1)}`.slice(0, 12);
    }
    if (digits.length === 9 && /^[67]/.test(digits)) {
        return `255${digits}`;
    }
    // Diaspora / international number — keep it in + format.
    return `+${digits}`;
}
function isAdultPortalDate(value: string) {
    const today = new Date();
    const dob = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(dob.getTime())) {
        // Don't block saving on an unparseable / legacy stored date.
        return true;
    }
    const minimumBirthDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return dob <= minimumBirthDate;
}

// Optional free-text field that, WHEN filled, must meet the backend's minimum length —
// so the member sees the problem inline (highlighted field) instead of a server
// "Request validation failed" with no explanation.
const optionalText = (min: number, max: number, label: string) =>
    z.string().trim().max(max, `${label} is too long.`).optional().or(z.literal(""))
        .refine((value) => !value || value.trim().length >= min, `${label} must be at least ${min} characters.`);

const memberProfileCompletionSchema = z.object({
    full_name: z.string().trim().min(3, "Full name is required.").max(120, "Full name is too long."),
    dob: z.string().optional().or(z.literal(""))
        .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), "Use date format YYYY-MM-DD.")
        .refine((value) => !value || isAdultPortalDate(value), "Member must be at least 18 years old."),
    phone: z.string().trim().optional().or(z.literal("")).refine(
        (value) => !value || memberProfileCompletionPhonePattern.test(value),
        "Use 2557XXXXXXXX / 2556XXXXXXXX, or an international number starting with + (e.g. +2547...)."
    ),
    email: z.string().trim().optional().or(z.literal("")).refine(
        (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        "Enter a valid email address."
    ),
    gender: z.enum(["male", "female"]).or(z.literal("")),
    marital_status: z.enum(["single", "married", "divorced", "widowed"]).or(z.literal("")),
    occupation: optionalText(2, 160, "Occupation"),
    employer: optionalText(2, 160, "Employer name"),
    id_type: z.enum(["nida", "voter", "license", "passport"]).default("nida"),
    national_id: optionalText(5, 50, "ID number"),
    nida_no: z.string().trim().max(50, "NIDA number is too long.").optional().or(z.literal("")),
    tin_no: z.string().trim().max(50, "TIN number is too long.").optional().or(z.literal("")),
    region_id: z.string().uuid().optional().or(z.literal("")),
    district_id: z.string().uuid().optional().or(z.literal("")),
    ward_id: z.string().uuid().optional().or(z.literal("")),
    village_id: z.string().uuid().optional().or(z.literal("")),
    region: optionalText(2, 120, "Region"),
    district: optionalText(2, 120, "District"),
    ward: optionalText(2, 120, "Ward"),
    street_or_village: optionalText(2, 160, "Street or village"),
    residential_address: optionalText(3, 255, "Residential address"),
    next_of_kin_name: optionalText(3, 120, "Next of kin name"),
    next_of_kin_phone: optionalText(7, 30, "Next of kin phone"),
    next_of_kin_relationship: optionalText(2, 80, "Relationship"),
    next_of_kin_address: optionalText(3, 255, "Next of kin address"),
    next_of_kin_region_id: z.string().uuid().optional().or(z.literal("")),
    next_of_kin_district_id: z.string().uuid().optional().or(z.literal("")),
    next_of_kin_ward_id: z.string().uuid().optional().or(z.literal("")),
    next_of_kin_village_id: z.string().uuid().optional().or(z.literal("")),
    next_of_kin_street: optionalText(2, 160, "Next of kin street"),
    // By-law fields so existing members can complete the same data as new applicants.
    ilboru_completion_year: z.union([z.literal(""), z.coerce.number().int().min(1980, "Year must be 1980–2022.").max(2022, "Year must be 1980–2022.")]).optional(),
    heir_name: optionalText(3, 120, "Heir name"),
    heir_phone: optionalText(7, 30, "Heir phone"),
    heir_relationship: optionalText(2, 80, "Heir relationship"),
    heir_address: optionalText(3, 255, "Heir address"),
    legitimate_income_declared: z.boolean().optional(),
    no_conflicting_business_declared: z.boolean().optional()
}).superRefine((value, ctx) => {
    // "Complete Member Profile" must actually be complete — enforce the same fields
    // the completeness check flags, so an empty form can't save as a success.
    const requireText = (field: keyof typeof value, label: string) => {
        const current = value[field];
        if (current === undefined || current === null || String(current).trim() === "") {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: `${label} is required.` });
        }
    };

    requireText("dob", "Date of birth");
    requireText("gender", "Gender");
    requireText("marital_status", "Marital status");
    requireText("occupation", "Occupation");
    requireText("phone", "Phone number");
    requireText("national_id", "Identity number");
    requireText("region_id", "Region");
    requireText("district_id", "District");
    requireText("ward_id", "Ward");
    requireText("residential_address", "Residential address");
    requireText("next_of_kin_name", "Next of kin name");
    requireText("next_of_kin_phone", "Next of kin phone");
    requireText("next_of_kin_relationship", "Next of kin relationship");

    // Next-of-kin address hierarchy is optional, but must be complete when started
    // — same structured format as the member's own address.
    const nokHierarchy = [value.next_of_kin_region_id, value.next_of_kin_district_id, value.next_of_kin_ward_id];
    const nokPresent = nokHierarchy.filter((entry) => String(entry || "").trim() !== "").length;
    if (nokPresent > 0 && nokPresent < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["next_of_kin_region_id"], message: "Select next of kin region, district, and ward together." });
    }
    if (String(value.next_of_kin_village_id || "").trim() !== "" && nokPresent < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["next_of_kin_village_id"], message: "Select region, district, and ward before the village." });
    }

    requireText("ilboru_completion_year", "Year completed Ilboru Secondary");
    requireText("heir_name", "Heir name (Mrithi)");
    requireText("heir_phone", "Heir phone");
    requireText("heir_relationship", "Heir relationship");

    if (!value.legitimate_income_declared) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["legitimate_income_declared"], message: "Confirm your legitimate source of income (by-laws §10c)." });
    }
    if (!value.no_conflicting_business_declared) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["no_conflicting_business_declared"], message: "Confirm you have no conflicting savings or lending business (by-laws §10f)." });
    }

    // NIDA / National ID is a 20-digit number; other ID types are free-form.
    // Accept the dashed format printed on NIDA slips (8-5-5-2) — separators are
    // stripped here and again before the payload is sent.
    const idNumber = (value.national_id || "").replace(/[\s-]/g, "");
    if (value.id_type === "nida" && idNumber && !/^\d{20}$/.test(idNumber)) {
        ctx.addIssue({ path: ["national_id"], code: z.ZodIssueCode.custom, message: "NIDA / National ID must be exactly 20 digits." });
    }
    // TIN is always a 9-digit number when provided.
    const tin = (value.tin_no || "").replace(/[\s-]/g, "");
    if (tin && !/^\d{9}$/.test(tin)) {
        ctx.addIssue({ path: ["tin_no"], code: z.ZodIssueCode.custom, message: "TIN number must be exactly 9 digits." });
    }
});

type MemberProfileCompletionValues = z.infer<typeof memberProfileCompletionSchema>;

interface DateRangeState {
    preset: DateRangePreset;
    from: string;
    to: string;
}

function groupBalances(statements: StatementRow[]) {
    return statements
        .slice()
        .reverse()
        .slice(-8)
        .map((entry) => ({
            label: formatDate(entry.transaction_date),
            balance: entry.running_balance,
            amount: entry.amount
        }));
}

function amountToWords(value: number): string {
    const num = Math.floor(Math.max(0, Number(value) || 0));
    if (num === 0) {
        return "Zero";
    }
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const scales = ["", "Thousand", "Million", "Billion", "Trillion"];

    const threeDigits = (n: number): string => {
        let str = "";
        if (n >= 100) {
            str += `${ones[Math.floor(n / 100)]} Hundred`;
            n %= 100;
            if (n) str += " ";
        }
        if (n >= 20) {
            str += tens[Math.floor(n / 10)];
            if (n % 10) str += ` ${ones[n % 10]}`;
        } else if (n > 0) {
            str += ones[n];
        }
        return str;
    };

    const groups: number[] = [];
    let remaining = num;
    while (remaining > 0) {
        groups.push(remaining % 1000);
        remaining = Math.floor(remaining / 1000);
    }

    const parts: string[] = [];
    for (let i = groups.length - 1; i >= 0; i -= 1) {
        if (groups[i] === 0) continue;
        parts.push(`${threeDigits(groups[i])}${scales[i] ? ` ${scales[i]}` : ""}`);
    }
    return parts.join(" ");
}

function groupSavingsByMonth(statements: StatementRow[]) {
    const monthly = new Map<string, { label: string; balance: number; date: number }>();

    statements.forEach((entry) => {
        const date = new Date(entry.created_at || entry.transaction_date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const existing = monthly.get(key);
        const timestamp = date.getTime();

        if (!existing || existing.date < timestamp) {
            monthly.set(key, {
                label: new Intl.DateTimeFormat("en-TZ", { month: "short", year: "2-digit" }).format(date),
                balance: entry.running_balance,
                date: timestamp
            });
        }
    });

    return Array.from(monthly.values())
        .sort((a, b) => a.date - b.date)
        .slice(-6);
}

function getDaysUntil(dateString?: string | null) {
    if (!dateString) {
        return null;
    }

    const target = new Date(dateString);
    const now = new Date();
    const ms = target.getTime() - now.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function toDateInputValue(date: Date) {
    return date.toISOString().slice(0, 10);
}

function parseDateValue(value: string) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T00:00:00`);
    }

    return new Date(value);
}

function getPresetRange(preset: DateRangePreset) {
    const now = new Date();
    const from = new Date(now);

    if (preset === "month") {
        from.setMonth(from.getMonth() - 1);
    } else if (preset === "quarter") {
        from.setMonth(from.getMonth() - 3);
    } else if (preset === "year") {
        from.setFullYear(from.getFullYear() - 1);
    }

    return {
        from: toDateInputValue(from),
        to: toDateInputValue(now)
    };
}

function isWithinDateRange(value: string | null | undefined, range: DateRangeState) {
    if (!value) {
        return false;
    }

    const date = parseDateValue(value).getTime();
    if (Number.isNaN(date)) {
        return false;
    }

    const fromDate = range.from ? parseDateValue(range.from) : null;
    const toDate = range.to ? parseDateValue(range.to) : null;

    if (fromDate) {
        fromDate.setHours(0, 0, 0, 0);
    }

    if (toDate) {
        toDate.setHours(23, 59, 59, 999);
    }

    const lower = fromDate ? fromDate.getTime() : Number.NEGATIVE_INFINITY;
    const upper = toDate ? toDate.getTime() : Number.POSITIVE_INFINITY;
    const min = Math.min(lower, upper);
    const max = Math.max(lower, upper);

    return date >= min && date <= max;
}

function formatTxType(type: string) {
    return type.replace(/_/g, " ");
}

function formatPaymentPurpose(purpose: string) {
    return purpose === "savings_deposit"
        ? "Savings deposit"
        : purpose === "share_contribution"
            ? "Legacy contribution"
            : purpose === "membership_fee"
                ? "Membership fee"
                : purpose === "loan_repayment"
                    ? "Loan repayment"
                : purpose.replace(/_/g, " ");
}

function formatPaymentStatus(status: string) {
    return status.replace(/_/g, " ");
}

function getAuditReference(row: StatementRow) {
    return row.reference || `AUD-${row.transaction_id.slice(0, 8).toUpperCase()}`;
}

function getMemberApplicationMessage(status: MemberApplicationStatus) {
    switch (status) {
        case "draft":
            return "Complete and submit your application so the branch can start the review.";
        case "submitted":
        case "under_review":
            return "Your application is under review. You will receive a notification once the branch responds.";
        case "approved_pending_payment":
            return "You are approved. Please complete the membership fee payment to unlock your accounts.";
        case "approved":
            return "Your application is approved and your membership is being activated.";
        case "rejected":
            return "Your application was rejected. Please reach out to your branch for next steps.";
        case "cancelled":
            return "Your application was cancelled. Contact your branch to reopen it or start a new request.";
        default:
            return "Your application is being processed. We will update you soon.";
    }
}

function estimatePenaltyForSchedule(schedule: LoanSchedule) {
    if (schedule.status !== "overdue") {
        return 0;
    }

    const outstanding = Math.max(schedule.principal_due - schedule.principal_paid, 0) + Math.max(schedule.interest_due - schedule.interest_paid, 0);
    return outstanding * 0.02;
}

function getLoanScheduleOutstanding(schedule: LoanSchedule) {
    const principalOutstanding = Math.max(Number(schedule.principal_due || 0) - Number(schedule.principal_paid || 0), 0);
    const interestOutstanding = Math.max(Number(schedule.interest_due || 0) - Number(schedule.interest_paid || 0), 0);

    return {
        principalOutstanding,
        interestOutstanding,
        totalOutstanding: principalOutstanding + interestOutstanding
    };
}

const MIN_MEANINGFUL_LOAN_OUTSTANDING = 1;

function hasMeaningfulLoanScheduleOutstanding(schedule: LoanSchedule) {
    return getLoanScheduleOutstanding(schedule).totalOutstanding >= MIN_MEANINGFUL_LOAN_OUTSTANDING;
}

function buildRepaymentInsights(loan: Loan | null, schedules: LoanSchedule[], amount: number) {
    const normalizedAmount = Math.max(Number(amount || 0), 0);
    const orderedSchedules = [...schedules].sort(
        (left, right) =>
            new Date(left.due_date).getTime() - new Date(right.due_date).getTime()
            || left.installment_number - right.installment_number
    );
    const actionableSchedules = orderedSchedules.filter(hasMeaningfulLoanScheduleOutstanding);
    const today = new Date().toISOString().slice(0, 10);
    const overdueSchedules = actionableSchedules.filter((schedule) => schedule.due_date < today);
    const nextDueSchedule = actionableSchedules[0] || null;
    const overdueAmount = overdueSchedules.reduce((sum, schedule) => sum + getLoanScheduleOutstanding(schedule).totalOutstanding, 0);
    const nextDueAmount = nextDueSchedule ? getLoanScheduleOutstanding(nextDueSchedule).totalOutstanding : 0;
    const scheduledInterestOutstanding = actionableSchedules.reduce((sum, schedule) => sum + getLoanScheduleOutstanding(schedule).interestOutstanding, 0);
    const scheduledPrincipalOutstanding = actionableSchedules.reduce((sum, schedule) => sum + getLoanScheduleOutstanding(schedule).principalOutstanding, 0);
    // Exposure is the reducing-balance settle-today figure the engine maintains:
    // outstanding_principal + accrued_interest (matches the ILBORU register). The
    // schedule table is NOT re-amortized on prepayment yet, so its interest total is
    // the stale fixed-annuity figure — never let it inflate the payable interest.
    const payableInterest = Number(loan?.accrued_interest || 0);
    const outstandingBalance = Number(loan?.outstanding_principal || 0) + payableInterest;
    const dueNowAmount = overdueAmount > 0 ? overdueAmount : nextDueAmount;
    const recommendedAmount = dueNowAmount > 0 ? Math.min(dueNowAmount, outstandingBalance) : outstandingBalance;
    const interestAllocation = Math.min(normalizedAmount, payableInterest);
    const principalAllocation = Math.min(Math.max(normalizedAmount - interestAllocation, 0), Number(loan?.outstanding_principal || 0));
    const excessOverOutstanding = Math.max(normalizedAmount - outstandingBalance, 0);
    const shortfallAmount = dueNowAmount > 0 ? Math.max(dueNowAmount - normalizedAmount, 0) : 0;
    const extraAmount = dueNowAmount > 0 ? Math.max(normalizedAmount - dueNowAmount, 0) : 0;

    return {
        overdueSchedules,
        nextDueSchedule,
        overdueAmount,
        nextDueAmount,
        dueNowAmount,
        scheduledInterestOutstanding,
        scheduledPrincipalOutstanding,
        payableInterest,
        outstandingBalance,
        recommendedAmount,
        interestAllocation,
        principalAllocation,
        excessOverOutstanding,
        shortfallAmount,
        extraAmount,
        enteredAmount: normalizedAmount,
        matchesDueNow: dueNowAmount > 0 && Math.abs(normalizedAmount - dueNowAmount) < 0.005
    };
}

const contributionProviderOptions: Array<{ value: ContributionPaymentValues["provider"]; label: string; helper: string }> = [
    { value: "vodacom", label: "Vodacom M-Pesa", helper: "Best for members paying with M-Pesa." },
    { value: "airtel", label: "Airtel Money", helper: "Use Airtel Money on the registered phone number." },
    { value: "tigo", label: "Mixx by Yas (Tigo)", helper: "Use Mixx by Yas on numbers previously registered with Tigo." },
    { value: "halopesa", label: "HaloPesa", helper: "Use HaloPesa when your phone is registered there." }
];

const PAYMENT_APPROVAL_EXPECTATION_MS = 90 * 1000;
const PAYMENT_PENDING_POLL_MS = 4000;
const PAYMENT_HANDSET_RESPONSE_POLL_MS = 2000;
const MEMBER_PORTAL_TOUR_STORAGE_KEY = "saccos.member-portal-tour.v1";
// The guided tour is switched off while the portal redesign settles — its steps
// still point at the old layout. Set this back to `true` to bring it back: the
// auto-start, the profile-menu entry and the footer Help link all read it.
const MEMBER_PORTAL_TOUR_ENABLED = false;
const DEFAULT_MEMBER_ANNUAL_SAVINGS_TARGET = 50_000_000;
const DEFAULT_MEMBER_REQUIRED_TOP_UP = 3_200_000;
const DEFAULT_MEMBER_PORTAL_PAYMENT_CONTROLS: MemberPortalPaymentControls = {
    tenant_id: null,
    share_contribution_enabled: true,
    savings_deposit_enabled: true,
    loan_repayment_enabled: true,
    updated_at: null
};
const DEFAULT_MEMBER_MONTHLY_CONTRIBUTION_AMOUNT = 100_000;

const portalSections = [
    {
        id: "member-overview",
        label: "Overview",
        labelSw: "Muhtasari",
        subtitle: "Balances and financial position.",
        subtitleSw: "Salio na hali yako ya kifedha.",
        icon: AutoGraphRoundedIcon
    },
    {
        // Promoted out of the old My Dashboard / SACCOS Overview toggle so the
        // cooperative-wide view is reachable in one click.
        id: "member-sacco",
        label: "SACCOS overview",
        labelSw: "Muhtasari wa SACCOS",
        subtitle: "Where the cooperative's money is working.",
        subtitleSw: "Fedha za ushirika zilipo na zinavyofanya kazi.",
        icon: AccountBalanceRoundedIcon
    },
    {
        id: "member-league",
        label: "Savings league",
        labelSw: "Ligi ya akiba",
        subtitle: "Your league, rank and how to climb.",
        subtitleSw: "Ligi yako, nafasi na jinsi ya kupanda.",
        icon: EmojiEventsRoundedIcon
    },
    {
        id: "member-accounts",
        label: "Accounts",
        labelSw: "Akaunti",
        subtitle: "Savings and share accounts.",
        subtitleSw: "Akaunti za akiba na hisa.",
        icon: WalletRoundedIcon
    },
    {
        id: "member-loans",
        label: "Loans",
        labelSw: "Mikopo",
        subtitle: "Facilities and repayment.",
        subtitleSw: "Mikopo na marejesho.",
        icon: CreditScoreRoundedIcon
    },
    {
        id: "member-transactions",
        label: "Transactions",
        labelSw: "Miamala",
        subtitle: "Transaction activity and balances.",
        subtitleSw: "Miamala na salio.",
        icon: TimelineRoundedIcon
    },
    {
        id: "member-contributions",
        label: "Contributions",
        labelSw: "Michango",
        subtitle: "Monitor share contributions and dividend allocations credited to you.",
        subtitleSw: "Fuatilia michango ya hisa na gawio ulilopewa.",
        icon: AccountBalanceWalletRoundedIcon
    },
    {
        id: "member-payments",
        label: "Payments",
        labelSw: "Malipo",
        subtitle: "Track Mobile Money requests, failures, and posted mobile money receipts.",
        subtitleSw: "Fuatilia maombi ya malipo ya simu na risiti zilizowekwa.",
        icon: WorkspacesRoundedIcon
    },
    {
        id: "member-reports",
        label: "My reports",
        labelSw: "Ripoti zangu",
        subtitle: "Your contributions, dividends and standing — your data only.",
        subtitleSw: "Michango, gawio na hali yako — taarifa zako pekee.",
        icon: TimelineRoundedIcon
    }
] as const;

const contentCardSx = {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    borderRadius: 2,
    borderColor: "divider",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)"
} as const;
const DARK_MEMBER_ACCENT = "#D9B273";
const DARK_MEMBER_ACCENT_DEEP = "#C89B52";
// Crest Gold + ink indigo: the passbook identity shared with the auth pages.
const CREST_GOLD = crestGold.main;
const CREST_GOLD_LIGHT = crestGold.light;
const PORTAL_DISPLAY_FONT = displayFontFamily;

type PortalSectionId = (typeof portalSections)[number]["id"];

interface MetricCardProps {
    icon: typeof WalletRoundedIcon;
    label: string;
    value: string | number;
    valueTitle?: string;
    helper: string;
    tone: "primary" | "success" | "warning" | "danger";
    delta?: string;
}

function getToneStyles(tone: MetricCardProps["tone"], mode: "light" | "dark") {
    if (tone === "success") {
        return {
            color: brandColors.success,
            bg: alpha(brandColors.success, mode === "dark" ? 0.16 : 0.1),
            softBg: mode === "dark" ? darkThemeColors.paper : "#FFFFFF",
            border: alpha(brandColors.success, mode === "dark" ? 0.24 : 0.16),
            shadow: mode === "dark"
                ? `0 14px 28px ${alpha(brandColors.success, 0.08)}`
                : `0 14px 28px ${alpha(brandColors.success, 0.09)}`,
            glow: alpha(brandColors.success, mode === "dark" ? 0.18 : 0.12)
        };
    }

    if (tone === "warning") {
        return {
            color: brandColors.warning,
            bg: alpha(brandColors.warning, mode === "dark" ? 0.18 : 0.12),
            softBg: mode === "dark" ? darkThemeColors.paper : "#FFFFFF",
            border: alpha(brandColors.warning, mode === "dark" ? 0.24 : 0.16),
            shadow: mode === "dark"
                ? `0 14px 28px ${alpha(brandColors.warning, 0.08)}`
                : `0 14px 28px ${alpha(brandColors.warning, 0.1)}`,
            glow: alpha(brandColors.warning, mode === "dark" ? 0.2 : 0.12)
        };
    }

    if (tone === "danger") {
        return {
            color: brandColors.danger,
            bg: alpha(brandColors.danger, mode === "dark" ? 0.16 : 0.1),
            softBg: mode === "dark" ? darkThemeColors.paper : "#FFFFFF",
            border: alpha(brandColors.danger, mode === "dark" ? 0.22 : 0.15),
            shadow: mode === "dark"
                ? `0 14px 28px ${alpha(brandColors.danger, 0.08)}`
                : `0 14px 28px ${alpha(brandColors.danger, 0.08)}`,
            glow: alpha(brandColors.danger, mode === "dark" ? 0.18 : 0.1)
        };
    }

    const primaryTone = mode === "dark" ? DARK_MEMBER_ACCENT : brandColors.primary[700];
    const primaryTint = mode === "dark" ? DARK_MEMBER_ACCENT : brandColors.primary[500];

    return {
        color: primaryTone,
        bg: mode === "dark"
            ? alpha(DARK_MEMBER_ACCENT, 0.2)
            : alpha(brandColors.primary[500], 0.1),
        softBg: mode === "dark" ? darkThemeColors.paper : "#FFFFFF",
        border: alpha(primaryTint, mode === "dark" ? 0.24 : 0.16),
        shadow: mode === "dark"
            ? `0 14px 28px ${alpha(primaryTint, 0.08)}`
            : `0 14px 28px ${alpha(primaryTint, 0.1)}`,
        glow: alpha(primaryTint, mode === "dark" ? 0.2 : 0.12)
    };
}

function MetricCard({ icon: Icon, label, value, valueTitle, helper, tone, delta }: MetricCardProps) {
    const theme = useTheme();
    const toneStyles = getToneStyles(tone, theme.palette.mode);

    return (
        <MotionCard
            variant="outlined"
            sx={{
                ...contentCardSx,
                overflow: "hidden",
                position: "relative",
                background: toneStyles.softBg,
                borderColor: toneStyles.border,
                boxShadow: toneStyles.shadow,
                "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: `linear-gradient(90deg, ${toneStyles.color}, ${toneStyles.glow})`
                }
            }}
        >
            <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
                    <Box
                        sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 2.2,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: toneStyles.bg,
                            color: toneStyles.color,
                            border: `1px solid ${toneStyles.border}`,
                            boxShadow: `inset 0 1px 0 ${alpha("#FFFFFF", theme.palette.mode === "dark" ? 0.02 : 0.5)}`
                        }}
                    >
                        <Icon fontSize="small" />
                    </Box>
                    <Typography
                        variant="caption"
                        sx={{
                            fontWeight: 700,
                            color: toneStyles.color,
                            bgcolor: alpha(toneStyles.color, theme.palette.mode === "dark" ? 0.14 : 0.08),
                            px: 1,
                            py: 0.45,
                            borderRadius: 99,
                            border: `1px solid ${alpha(toneStyles.color, theme.palette.mode === "dark" ? 0.18 : 0.12)}`
                        }}
                    >
                        {delta || "Live"}
                    </Typography>
                </Stack>
                <Typography variant="h5" title={valueTitle} sx={{ mt: 0.75, mb: 0, fontWeight: 800, fontSize: "1.5rem", fontVariantNumeric: "tabular-nums", lineHeight: 1.15 }}>
                    {value}
                </Typography>
                <Typography variant="overline" color="text.secondary" sx={{ display: "block", lineHeight: 1.3 }}>
                    {label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                    {helper}
                </Typography>
            </CardContent>
        </MotionCard>
    );
}

function AccountSummaryCard({ icon: Icon, label, value, valueTitle, helper, tone, delta }: MetricCardProps) {
    const theme = useTheme();
    const toneStyles = getToneStyles(tone, theme.palette.mode);

    return (
        <MotionCard
            variant="outlined"
            sx={{
                ...contentCardSx,
                height: "100%",
                overflow: "hidden",
                background: toneStyles.softBg,
                borderColor: toneStyles.border,
                boxShadow: toneStyles.shadow,
                position: "relative",
                "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: "0 auto 0 0",
                    width: 4,
                    background: `linear-gradient(180deg, ${toneStyles.color}, ${toneStyles.glow})`
                }
            }}
        >
            <CardContent sx={{ p: 1.5, height: "100%", display: "flex", "&:last-child": { pb: 1.5 } }}>
                <Stack spacing={0.9} sx={{ width: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Chip
                            size="small"
                            label={delta || "Live"}
                            sx={{
                                borderRadius: 1.25,
                                bgcolor: toneStyles.bg,
                                color: toneStyles.color,
                                fontWeight: 700,
                                border: `1px solid ${toneStyles.border}`
                            }}
                        />
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1.5,
                                display: "grid",
                                placeItems: "center",
                                bgcolor: toneStyles.bg,
                                color: toneStyles.color,
                                border: `1px solid ${toneStyles.border}`
                            }}
                        >
                            <Icon fontSize="small" />
                        </Box>
                    </Stack>

                    <Typography title={valueTitle} sx={{ fontWeight: 800, lineHeight: 1.15, fontSize: "1.4rem", fontVariantNumeric: "tabular-nums", overflowWrap: "anywhere" }}>
                        {value}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {label}
                    </Typography>

                    <Box sx={{ mt: "auto", height: 4, borderRadius: 999, bgcolor: alpha(toneStyles.color, 0.18) }}>
                        <Box sx={{ height: 1, width: "56%", borderRadius: 999, bgcolor: toneStyles.color }} />
                    </Box>
                </Stack>
            </CardContent>
        </MotionCard>
    );
}

function titleCase(value?: string | null) {
    if (!value) {
        return null;
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function ProfileField({ label, value }: { label: string; value?: string | number | null }) {
    const hasValue = value === 0 || Boolean(value);
    return (
        <Box>
            <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", textTransform: "uppercase", letterSpacing: 0.5, fontSize: 10.5, fontWeight: 700 }}
            >
                {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: "break-word" }}>
                {hasValue ? value : "—"}
            </Typography>
        </Box>
    );
}

export function MemberPortalPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const { profile, selectedTenantName, selectedBranchName, signOut, user, twoFactorSetupRequired, refreshProfile } = useAuth();
    const { pushToast } = useToast();
    const { theme: themeMode, toggleTheme } = useUI();
    const prefersReducedMotion = useReducedMotionSafe();
    const [memberRecord, setMemberRecord] = useState<Member | null>(null);
    const [memberApplication, setMemberApplication] = useState<MemberApplication | null>(null);
    const [accounts, setAccounts] = useState<MemberAccount[]>([]);
    const [memberId, setMemberId] = useState("");
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loanSchedules, setLoanSchedules] = useState<LoanSchedule[]>([]);
    const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
    const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([]);
    const [guarantorRequests, setGuarantorRequests] = useState<GuarantorRequestItem[]>([]);
    const [processingGuarantorRequestId, setProcessingGuarantorRequestId] = useState<string | null>(null);
    const [guarantorAcceptTarget, setGuarantorAcceptTarget] = useState<GuarantorRequestItem | null>(null);
    const [guarantorAcceptAmount, setGuarantorAcceptAmount] = useState("");
    const [guarantorDrafts, setGuarantorDrafts] = useState<Array<{
        member_id: string;
        member_no: string;
        full_name: string;
        available_amount: number | null;
        guaranteed_amount: number;
    }>>([]);
    const [guarantorLookupNo, setGuarantorLookupNo] = useState("");
    const [guarantorLookupBusy, setGuarantorLookupBusy] = useState(false);
    const [guarantorMaxCount, setGuarantorMaxCount] = useState(5);
    const [guarantorSuggestions, setGuarantorSuggestions] = useState<GuarantorSearchHit[]>([]);
    // An empty result and a failed request used to look identical here — both
    // rendered nothing at all, so a member typing a name that plainly exists
    // had no way to tell "not found" from "the lookup broke".
    const [guarantorSearchState, setGuarantorSearchState] = useState<"idle" | "searching" | "done" | "error">("idle");
    const [guarantorSearchError, setGuarantorSearchError] = useState("");
    const [manageGuarantorsTarget, setManageGuarantorsTarget] = useState<LoanApplication | null>(null);
    const [savingGuarantorPlan, setSavingGuarantorPlan] = useState(false);
    const [statements, setStatements] = useState<StatementRow[]>([]);
    // Authoritative monthly-commitment status from the backend (same SQL the
    // loan-submit guard enforces with). "error" is a distinct state so a failed
    // fetch is never presented as "you have not paid".
    const [monthlyCommitmentStatus, setMonthlyCommitmentStatus] = useState<MemberMonthlyCommitmentStatus | null>(null);
    const [monthlyCommitmentState, setMonthlyCommitmentState] = useState<"loading" | "ready" | "error">("loading");
    const [loanTransactions, setLoanTransactions] = useState<LoanTransaction[]>([]);
    const [memberPortalPaymentControls, setMemberPortalPaymentControls] = useState<MemberPortalPaymentControls>(DEFAULT_MEMBER_PORTAL_PAYMENT_CONTROLS);
    const [shareRequirement, setShareRequirement] = useState<MemberShareRequirement | null>(null);
    // Prose built in this file rather than inside a component still has to
    // follow the member's language choice; `t` is read here because several of
    // those strings are assembled well above where the page reads `lang`.
    const { t: tr } = useLanguage();
    const [financialYearSettings, setFinancialYearSettings] = useState<SaccoFinancialYearSettings>(DEFAULT_SACCO_FINANCIAL_YEAR_SETTINGS);
    const [performanceTargetSettings, setPerformanceTargetSettings] = useState<SaccoPerformanceTargetSettings>(DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<string | null>(null);
    const [showProfileCompletionDialog, setShowProfileCompletionDialog] = useState(false);
    const [showMemberProfileDialog, setShowMemberProfileDialog] = useState(false);
    const [memberProfileTab, setMemberProfileTab] = useState(0);
    const [savingProfileCompletion, setSavingProfileCompletion] = useState(false);
    const [showApplyDialog, setShowApplyDialog] = useState(false);
    const [editingLoanApplicationId, setEditingLoanApplicationId] = useState<string | null>(null);
    const [deletingLoanApplicationId, setDeletingLoanApplicationId] = useState<string | null>(null);
    const [pendingDraftDeletion, setPendingDraftDeletion] = useState<LoanApplication | null>(null);
    const [loanFormStep, setLoanFormStep] = useState(0);
    const [loanDocuments, setLoanDocuments] = useState<{ national_id: File | null; supporting_document: File | null; guarantor_id: File | null }>({
        national_id: null,
        supporting_document: null,
        guarantor_id: null
    });
    const [loanCapacity, setLoanCapacity] = useState<LoanCapacitySummary | null>(null);
    const [loanCapacityLoading, setLoanCapacityLoading] = useState(false);
    const [loanCapacityError, setLoanCapacityError] = useState<string | null>(null);
    const [topUpQuote, setTopUpQuote] = useState<TopUpQuote | null>(null);
    const [topUpNewCashInput, setTopUpNewCashInput] = useState("");
    const [dashboardLoanCapacity, setDashboardLoanCapacity] = useState<LoanCapacitySummary | null>(null);
    const [dashboardCapacityProductName, setDashboardCapacityProductName] = useState<string | null>(null);
    const [dashboardLoanCapacityLoading, setDashboardLoanCapacityLoading] = useState(false);
    const [dashboardLoanCapacityError, setDashboardLoanCapacityError] = useState<string | null>(null);
    const [showContributionDialog, setShowContributionDialog] = useState(false);
    const [submittingApplication, setSubmittingApplication] = useState(false);
    const [submittingContribution, setSubmittingContribution] = useState(false);
    const [reconcilingPayment, setReconcilingPayment] = useState(false);
    const [checkingPaymentStatus, setCheckingPaymentStatus] = useState(false);
    const [phoneCancellationRequested, setPhoneCancellationRequested] = useState(false);
    const [paymentFlowPurpose, setPaymentFlowPurpose] = useState<MemberPaymentPurpose>("savings_deposit");
    const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);
    const [paymentOrders, setPaymentOrders] = useState<PaymentOrder[]>([]);
    const [lastPaymentToastStatus, setLastPaymentToastStatus] = useState<PaymentOrder["status"] | null>(null);
    const [activeContributionOrderId, setActiveContributionOrderId] = useState<string | null>(null);
    const autoBackgroundedPaymentOrderIdRef = useRef<string | null>(null);
    const [selectedPaymentReceipt, setSelectedPaymentReceipt] = useState<PaymentOrder | null>(null);
    const [activeSection, setActiveSection] = useState<PortalSectionId>(portalSections[0].id);
    // The member's league standing, loaded once. Drives the sidebar league pill
    // and whether the Savings league nav entry appears at all.
    const [leaguePosition, setLeaguePosition] = useState<MyLeaguePosition | null>(null);
    const [leagueStandings, setLeagueStandings] = useState<LeagueStandings | null>(null);
    const [saccoOverview, setSaccoOverview] = useState<SaccoOverview | null>(null);
    const [saccoOverviewLoading, setSaccoOverviewLoading] = useState(false);
    const [milestoneBoard, setMilestoneBoard] = useState<SaccoMilestoneBoard | null>(null);
    const [operationsFund, setOperationsFund] = useState<OperationsStatement | null>(null);

    interface MyReportsData {
        position: { rank: number | null; total_ranked_members: number; contributions: number; dividends: number; cumulative: number };
        statement: { rows: { date: string; label: string; source: string; amount: number; running_total: number }[] };
        monthly: { rows: { month: string; amount: number }[]; grand_total: number };
        utt: {
            deposits: { date: string; reference: string; amount: number }[];
            income: { date: string; type: string; description: string | null; amount: number }[];
            totals: { invested: number; income: number; grand_total: number };
        } | null;
        operations: {
            rows: {
                month: string;
                opening: number;
                income: number;
                expenses: number;
                net: number;
                closing: number;
                income_lines: { date: string | null; label: string; amount: number }[];
                expense_lines: { date: string | null; label: string; amount: number }[];
            }[];
            totals: { income: number; expenses: number; balance: number };
        } | null;
        loans: {
            rows: {
                loan_number: string;
                date_applied: string;
                principal: number;
                interest: number;
                total_due: number;
                paid: number;
                balance: number;
                status: string;
                progress_percent: number;
                principal_paid: number;
                interest_paid: number;
                next_due: { installment: number; due_date: string; amount: number; overdue: boolean } | null;
                schedule: { installment: number; due_date: string; principal_due: number; interest_due: number; total_due: number; principal_paid: number; interest_paid: number; status: string }[];
                repayments?: { date: string; amount: number; balance: number }[];
            }[];
        } | null;
    }
    const [myReports, setMyReports] = useState<MyReportsData | null>(null);
    const [myReportsLoading, setMyReportsLoading] = useState(false);
    // Clicked month on the Operation Account card — the dialog lists the
    // entries behind the incomes or expenditures figure.

    // Lazy-load the member's self-scoped reports when they open My Reports.
    // The first three endpoints resolve the member from the session server-side;
    // the UTT register is cooperative-wide aggregates (fetched best-effort).
    useEffect(() => {
        if (activeSection !== "member-reports" || myReports) {
            return;
        }
        let active = true;
        setMyReportsLoading(true);
        Promise.all([
            api.get<{ data: MyReportsData["position"] }>(endpoints.allReports.myPosition()),
            api.get<{ data: MyReportsData["statement"] }>(endpoints.allReports.myStatement()),
            api.get<{ data: MyReportsData["monthly"] }>(endpoints.allReports.myMonthly()),
            api.get<{ data: NonNullable<MyReportsData["utt"]> }>(endpoints.allReports.uttInvestments()).catch(() => null),
            api.get<{ data: NonNullable<MyReportsData["loans"]> }>(endpoints.allReports.myLoans()).catch(() => null),
            api.get<{ data: NonNullable<MyReportsData["operations"]> }>(endpoints.allReports.operationsStatement()).catch(() => null)
        ])
            .then(([positionRes, statementRes, monthlyRes, uttRes, loansRes, operationsRes]) => {
                if (active) {
                    setMyReports({
                        position: positionRes.data.data,
                        statement: statementRes.data.data,
                        monthly: monthlyRes.data.data,
                        utt: uttRes?.data.data ?? null,
                        loans: loansRes?.data.data ?? null,
                        operations: operationsRes?.data.data ?? null
                    });
                }
            })
            .catch(() => {
                if (active) {
                    setMyReports(null);
                }
            })
            .finally(() => {
                if (active) {
                    setMyReportsLoading(false);
                }
            });
        return () => {
            active = false;
        };
    }, [activeSection, myReports]);

    // League standing. Loaded up front rather than on section entry, because the
    // sidebar shows the member's tier and the nav entry itself is gated on the
    // tenant's league flag. A failure leaves the section hidden, not broken.
    useEffect(() => {
        const tenantId = profile?.tenant_id;
        if (!tenantId) {
            return;
        }
        let active = true;
        api
            .get<{ data: MyLeaguePosition }>(endpoints.leagues.me(), { params: { tenant_id: tenantId } })
            .then((res) => {
                if (active) {
                    setLeaguePosition(res.data?.data ?? null);
                }
            })
            .catch(() => {
                if (active) {
                    setLeaguePosition(null);
                }
            });
        return () => {
            active = false;
        };
    }, [profile?.tenant_id]);

    // Full standings, for the "Around you" rows and the tier ladder. Loaded only
    // when the member opens the league section.
    useEffect(() => {
        const tenantId = profile?.tenant_id;
        if (activeSection !== "member-league" || leagueStandings || !tenantId) {
            return;
        }
        let active = true;
        api
            .get<{ data: LeagueStandings }>(endpoints.leagues.standings(), { params: { tenant_id: tenantId } })
            .then((res) => {
                if (active) {
                    setLeagueStandings(res.data?.data ?? null);
                }
            })
            .catch(() => {
                if (active) {
                    setLeagueStandings(null);
                }
            });
        return () => {
            active = false;
        };
    }, [activeSection, leagueStandings, profile?.tenant_id]);

    // Lazy-load the curated SACCOS overview only when the member opens that view.
    useEffect(() => {
        if (activeSection !== "member-sacco" || saccoOverview) {
            return;
        }
        let active = true;
        setSaccoOverviewLoading(true);
        api
            .get(endpoints.members.saccoOverview())
            .then((res) => {
                if (active) {
                    setSaccoOverview(res.data?.data ?? null);
                }
            })
            .catch(() => {
                if (active) {
                    setSaccoOverview(null);
                }
            })
            .finally(() => {
                if (active) {
                    setSaccoOverviewLoading(false);
                }
            });
        return () => {
            active = false;
        };
    }, [activeSection, saccoOverview]);

    // Shared milestone roadmap — the collective goal every member is working towards.
    useEffect(() => {
        if (activeSection !== "member-sacco" || milestoneBoard) {
            return;
        }
        let active = true;
        api
            .get<{ data: SaccoMilestoneBoard }>(endpoints.milestones.board())
            .then((res) => {
                if (active) {
                    setMilestoneBoard(res.data?.data ?? null);
                }
            })
            .catch(() => {
                if (active) {
                    setMilestoneBoard(null);
                }
            });
        return () => {
            active = false;
        };
    }, [activeSection, milestoneBoard]);

    // The fund the cooperative's running costs come out of. Members are allowed
    // this report — it carries monthly aggregates only, with member fees summed
    // into a single line server-side.
    useEffect(() => {
        if (activeSection !== "member-sacco" || operationsFund) {
            return;
        }
        let active = true;
        api
            .get<{ data: OperationsStatement }>(endpoints.allReports.operationsStatement())
            .then((res) => {
                if (active) {
                    setOperationsFund(res.data?.data ?? null);
                }
            })
            .catch(() => {
                if (active) {
                    setOperationsFund(null);
                }
            });
        return () => {
            active = false;
        };
    }, [activeSection, operationsFund]);
    const [runFeatureTour, setRunFeatureTour] = useState(false);
    const [transactionsRange] = useState<DateRangeState>({ preset: "custom", from: "", to: "" });
    const [contributionsRange] = useState<DateRangeState>({ preset: "custom", from: "", to: "" });
    const [loansRange] = useState<DateRangeState>({ preset: "custom", from: "", to: "" });
    const [accountsRange] = useState<DateRangeState>({ preset: "custom", from: "", to: "" });
    const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>("all");
    const [transactionSearch, setTransactionSearch] = useState("");
    const [disputedTransactionIds, setDisputedTransactionIds] = useState<string[]>([]);
    const [contributionsPage, setContributionsPage] = useState(0);
    const [contributionsRowsPerPage, setContributionsRowsPerPage] = useState(10);
    const [paymentsPage, setPaymentsPage] = useState(0);
    const [paymentsRowsPerPage, setPaymentsRowsPerPage] = useState(10);
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
    const [paymentPurposeFilter, setPaymentPurposeFilter] = useState<string>("all");
    const [loanSchedulePage, setLoanSchedulePage] = useState(0);
    const [loanScheduleRowsPerPage, setLoanScheduleRowsPerPage] = useState(10);
    const [loanDetailId, setLoanDetailId] = useState<string>("");
    const [requestedAmountInput, setRequestedAmountInput] = useState("");
    const loanApplicationForm = useForm<LoanApplicationValues>({
        resolver: zodResolver(loanApplicationSchema),
        mode: "onChange",
        reValidateMode: "onChange",
        defaultValues: {
            product_id: "",
            purpose: "",
            requested_amount: 0,
            requested_term_count: 12,
            requested_repayment_frequency: "monthly",
            requested_interest_rate: 0,
            external_reference: "",
            payout_method: "cash",
            repayment_mode: "check_off",
            loan_category: "new",
            top_up_of_loan_id: "",
            deposit_purchase_amount: 0,
            application_fee_paid: false,
            payout_bank_name: "",
            payout_bank_branch: "",
            payout_account_name: "",
            payout_account_number: "",
            confirmation_checked: false,
            declaration_accepted: false,
            terms_accepted: false
        }
    });
    const contributionPaymentForm = useForm<ContributionPaymentValues>({
        resolver: zodResolver(contributionPaymentSchema),
        defaultValues: {
            account_id: "",
            loan_id: "",
            amount: 0,
            provider: "vodacom",
            msisdn: profile?.phone || "",
            description: ""
        }
    });
    const shareContributionSelfServiceEnabled = false;
    const savingsDepositSelfServiceEnabled = memberPortalPaymentControls.savings_deposit_enabled;
    const loanRepaymentSelfServiceEnabled = memberPortalPaymentControls.loan_repayment_enabled;
    const canUsePortalDeposits = savingsDepositSelfServiceEnabled;
    const memberProfileCompletionForm = useForm<MemberProfileCompletionValues>({
        resolver: zodResolver(memberProfileCompletionSchema),
        mode: "onChange",
        defaultValues: {
            full_name: "",
            dob: "",
            phone: "",
            email: "",
            gender: "",
            marital_status: "",
            occupation: "",
            employer: "",
            id_type: "nida",
            national_id: "",
            tin_no: "",
            region_id: "",
            district_id: "",
            ward_id: "",
            village_id: "",
            region: "",
            district: "",
            ward: "",
            street_or_village: "",
            residential_address: "",
            next_of_kin_name: "",
            next_of_kin_phone: "",
            next_of_kin_relationship: "",
            next_of_kin_address: "",
            next_of_kin_region_id: "",
            next_of_kin_district_id: "",
            next_of_kin_ward_id: "",
            next_of_kin_village_id: "",
            next_of_kin_street: "",
            ilboru_completion_year: "",
            heir_name: "",
            heir_phone: "",
            heir_relationship: "",
            heir_address: "",
            legitimate_income_declared: false,
            no_conflicting_business_declared: false
        }
    });
    const requiresMembershipFeePayment = memberApplication?.status === "approved_pending_payment";
    const canUsePortalPayments = canUsePortalDeposits || loanRepaymentSelfServiceEnabled || requiresMembershipFeePayment;
    const membershipFeeOutstanding = Math.max(
        Number(memberApplication?.membership_fee_amount || 0) - Number(memberApplication?.membership_fee_paid || 0),
        0
    );
    const canShowMembershipFeePaymentOption = requiresMembershipFeePayment && membershipFeeOutstanding > 0;
    const memberProfileMissingFields = useMemo(() => {
        if (!memberRecord) {
            return [];
        }

        const missing: string[] = [];

        if (!memberRecord.dob) missing.push("date of birth");
        if (!memberRecord.gender) missing.push("gender");
        if (!memberRecord.marital_status) missing.push("marital status");
        if (!memberRecord.occupation) missing.push("occupation");
        if (!memberRecord.phone) missing.push("phone number");
        if (!memberRecord.national_id && !memberRecord.nida_no) missing.push("identity number");
        if (!memberRecord.region) missing.push("region");
        if (!memberRecord.district) missing.push("district");
        if (!memberRecord.ward) missing.push("ward");
        if (!memberRecord.residential_address && !memberRecord.address_line1) missing.push("residential address");
        if (!memberRecord.next_of_kin_name || !memberRecord.next_of_kin_phone || !memberRecord.next_of_kin_relationship) {
            missing.push("next of kin details");
        }
        if (!memberRecord.ilboru_completion_year) missing.push("Ilboru completion year");
        if (!memberRecord.heir_name || !memberRecord.heir_phone || !memberRecord.heir_relationship) {
            missing.push("nominated heir (Mrithi)");
        }
        if (!memberRecord.legitimate_income_declared || !memberRecord.no_conflicting_business_declared) {
            missing.push("membership declarations");
        }

        return missing;
    }, [memberRecord]);
    const memberProfileNeedsCompletion = Boolean(memberRecord && memberProfileMissingFields.length);
    const memberProfileRegionId = memberProfileCompletionForm.watch("region_id");
    const memberProfileDistrictId = memberProfileCompletionForm.watch("district_id");
    const memberProfileWardId = memberProfileCompletionForm.watch("ward_id");
    // Inline error binding for the completion form — every required field must turn
    // red with its message, or members experience a blocked save as "it doesn't save".
    const completionFormErrors = memberProfileCompletionForm.formState.errors;
    const completionFieldError = (name: keyof MemberProfileCompletionValues, fallbackHelper?: string) => {
        const fieldError = completionFormErrors[name] as { message?: string } | undefined;
        return { error: Boolean(fieldError), helperText: fieldError?.message || fallbackHelper };
    };
    const {
        regions,
        districts,
        wards,
        villages,
        regionOptions,
        districtOptions,
        wardOptions,
        villageOptions,
        loadingRegions,
        loadingDistricts,
        loadingWards,
        loadingVillages
    } = useTanzaniaLocations({
        regionId: memberProfileRegionId,
        districtId: memberProfileDistrictId,
        wardId: memberProfileWardId
    });
    // Second, independent cascade for the next-of-kin address — same structured
    // format as the member's own (requirement: consistent record keeping).
    const nokRegionId = memberProfileCompletionForm.watch("next_of_kin_region_id");
    const nokDistrictId = memberProfileCompletionForm.watch("next_of_kin_district_id");
    const nokWardId = memberProfileCompletionForm.watch("next_of_kin_ward_id");
    const {
        regionOptions: nokRegionOptions,
        districtOptions: nokDistrictOptions,
        wardOptions: nokWardOptions,
        villageOptions: nokVillageOptions,
        loadingRegions: nokLoadingRegions,
        loadingDistricts: nokLoadingDistricts,
        loadingWards: nokLoadingWards,
        loadingVillages: nokLoadingVillages
    } = useTanzaniaLocations({
        regionId: nokRegionId,
        districtId: nokDistrictId,
        wardId: nokWardId
    });
    const memberProfileLegacyLocationSummary = useMemo(() => {
        const parts = [
            memberProfileCompletionForm.getValues("region"),
            memberProfileCompletionForm.getValues("district"),
            memberProfileCompletionForm.getValues("ward"),
            memberProfileCompletionForm.getValues("street_or_village")
        ]
            .map((value) => String(value || "").trim())
            .filter(Boolean);

        return parts.length ? parts.join(" / ") : null;
    }, [
        memberProfileCompletionForm.watch("region"),
        memberProfileCompletionForm.watch("district"),
        memberProfileCompletionForm.watch("ward"),
        memberProfileCompletionForm.watch("street_or_village")
    ]);
    const selectedLoanProductId = loanApplicationForm.watch("product_id");
    const requestedLoanTerm = loanApplicationForm.watch("requested_term_count");
    const requestedLoanAmount = loanApplicationForm.watch("requested_amount");
    const requestedLoanFrequency = loanApplicationForm.watch("requested_repayment_frequency");
    const selectedLoanProduct = useMemo(
        () => loanProducts.find((product) => product.id === selectedLoanProductId) || null,
        [loanProducts, selectedLoanProductId]
    );
    const activeLoanProducts = useMemo(
        () => loanProducts.filter((product) => product.status === "active"),
        [loanProducts]
    );
    // Projected repayment schedule shown before the member submits, so they know
    // the monthly instalment and due dates up front.
    const loanScheduleProjection = useMemo(() => {
        const amount = Number(requestedLoanAmount) || 0;
        const term = Number(requestedLoanTerm) || 0;
        if (!selectedLoanProduct || amount <= 0 || term <= 0) {
            return null;
        }

        return projectLoanSchedule({
            principal: amount,
            annualInterestRate: Number(selectedLoanProduct.annual_interest_rate) || 0,
            termCount: term,
            termUnit: selectedLoanProduct.term_unit === "weeks" ? "weeks" : "months",
            method: selectedLoanProduct.interest_method === "reducing_balance" ? "reducing_balance" : "flat"
        });
    }, [requestedLoanAmount, requestedLoanTerm, selectedLoanProduct]);
    const selectedLoanBranchId = memberRecord?.branch_id || profile?.branch_id || "";
    const selectedLoanPolicy = useMemo(
        () => resolveLoanEligibilityPolicy(selectedLoanProduct),
        [selectedLoanProduct]
    );

    const latestStatementBalanceByAccountId = useMemo(() => {
        const latestBalances = new Map<string, { createdAt: number; runningBalance: number }>();

        for (const row of statements) {
            const createdAt = new Date(row.created_at || row.transaction_date || 0).getTime();
            const current = latestBalances.get(row.account_id);

            if (!current || createdAt >= current.createdAt) {
                latestBalances.set(row.account_id, {
                    createdAt,
                    runningBalance: Number(row.running_balance || 0)
                });
            }
        }

        return new Map(
            Array.from(latestBalances.entries()).map(([accountId, entry]) => [accountId, entry.runningBalance])
        );
    }, [statements]);
    // Dividends credited to this member (UTT + loan interest distributions).
    // Reversals post as direction 'out' with the same transaction type — net
    // them so a reversed distribution contributes zero.
    const myDividends = useMemo(() => {
        let total = 0;
        let count = 0;
        let lastDate: string | null = null;
        for (const row of statements) {
            if (row.transaction_type !== "dividend_allocation") {
                continue;
            }
            if (row.direction === "out") {
                total -= Number(row.amount || 0);
                count -= 1;
                continue;
            }
            total += Number(row.amount || 0);
            count += 1;
            const date = row.transaction_date || null;
            if (date && (!lastDate || date > lastDate)) {
                lastDate = date;
            }
        }
        return { total: Math.max(total, 0), count: Math.max(count, 0), lastDate };
    }, [statements]);
    const savingsEligibilityBalance = useMemo(
        () => accounts
            .filter((account) => account.status === "active" && account.product_type === "savings")
            .reduce(
                (sum, account) => sum + (
                    latestStatementBalanceByAccountId.has(account.id)
                        ? Number(latestStatementBalanceByAccountId.get(account.id) || 0)
                        : Number(account.available_balance || 0)
                ),
                0
            ),
        [accounts, latestStatementBalanceByAccountId]
    );
    const selectedLoanEligibleAmount = useMemo(() => {
        if (!selectedLoanProduct) {
            return 0;
        }

        let eligibleAmount = selectedLoanPolicy.baseEligibilityAmount
            + savingsEligibilityBalance * selectedLoanPolicy.savingsMultiplier;

        if (selectedLoanPolicy.eligibilityCapAmount !== null) {
            eligibleAmount = Math.min(eligibleAmount, selectedLoanPolicy.eligibilityCapAmount);
        }

        if (selectedLoanProduct.max_amount) {
            eligibleAmount = Math.min(eligibleAmount, Number(selectedLoanProduct.max_amount));
        }

        return Math.max(0, eligibleAmount);
    }, [selectedLoanPolicy, selectedLoanProduct, savingsEligibilityBalance]);
    const selectedLoanMinimumAmount = useMemo(
        () => Math.max(10000, Number(loanCapacity?.minimum_loan_amount ?? selectedLoanProduct?.min_amount ?? 0)),
        [loanCapacity, selectedLoanProduct]
    );
    const selectedLoanBorrowLimit = useMemo(
        () => loanCapacity?.borrow_limit ?? selectedLoanEligibleAmount,
        [loanCapacity, selectedLoanEligibleAmount]
    );
    const selectedLoanPoolFrozen = Boolean(loanCapacity?.loan_pool_frozen);
    const requestedBorrowUtilizationPercent = useMemo(() => {
        if (!selectedLoanBorrowLimit || selectedLoanBorrowLimit <= 0) {
            return null;
        }

        return (Number(requestedLoanAmount || 0) / selectedLoanBorrowLimit) * 100;
    }, [requestedLoanAmount, selectedLoanBorrowLimit]);
    const requestedBorrowUtilizationTone = useMemo(() => {
        if (requestedBorrowUtilizationPercent === null) {
            return brandColors.success;
        }

        if (requestedBorrowUtilizationPercent > 100) {
            return brandColors.danger;
        }

        if (requestedBorrowUtilizationPercent >= 80) {
            return brandColors.warning;
        }

        return brandColors.success;
    }, [requestedBorrowUtilizationPercent]);
    const selectedLoanLiquidityRatio = useMemo(
        () => (loanCapacity && loanCapacity.total_deposits > 0
            ? loanCapacity.available_for_loans / loanCapacity.total_deposits
            : 0),
        [loanCapacity]
    );
    const selectedLoanMinimumTerm = useMemo(
        () => Math.max(1, Number(selectedLoanProduct?.min_term_count || 1)),
        [selectedLoanProduct]
    );
    const selectedLoanMaximumTerm = useMemo(
        () => (selectedLoanProduct?.max_term_count ? Number(selectedLoanProduct.max_term_count) : null),
        [selectedLoanProduct]
    );
    const selectedLoanConflict = useMemo(
        () => loanApplications.find((application) =>
            application.id !== editingLoanApplicationId
            && ["submitted", "appraised", "approved"].includes(application.status)
        ) || null,
        [editingLoanApplicationId, loanApplications]
    );
    const editingLoanApplication = useMemo(
        () => loanApplications.find((application) => application.id === editingLoanApplicationId) || null,
        [editingLoanApplicationId, loanApplications]
    );
    const selectedLoanDraft = useMemo(
        () => loanApplications.find((application) =>
            application.id !== editingLoanApplicationId
            && application.status === "draft"
        ) || null,
        [editingLoanApplicationId, loanApplications]
    );
    const isEditingDraftLoanApplication = editingLoanApplication?.status === "draft";
    const isEditingRejectedLoanApplication = editingLoanApplication?.status === "rejected";
    const isDeletingActiveLoanApplicationDraft = Boolean(
        deletingLoanApplicationId &&
        editingLoanApplicationId &&
        deletingLoanApplicationId === editingLoanApplicationId
    );
    const memberHasProblemLoan = useMemo(
        () => loans.some((loan) => ["in_arrears", "written_off"].includes(loan.status)),
        [loans]
    );
    // View model for the monthly mandatory savings status. States:
    //   loading — first fetch in flight; show nothing, gate nothing client-side
    //   error   — status could not be verified; say so, never claim "unpaid"
    //   none    — member has no commitment configured
    //   due     — commitment exists and this month is not fully paid
    //   met     — commitment exists and this month is paid
    const monthlyCommitment = useMemo(() => {
        const monthLabel = new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" });

        if (monthlyCommitmentState !== "ready" || !monthlyCommitmentStatus) {
            return {
                state: monthlyCommitmentState === "error" ? ("error" as const) : ("loading" as const),
                amount: 0,
                paid: 0,
                remaining: 0,
                met: true,
                monthLabel,
                progressPercent: 0
            };
        }

        const amount = Number(monthlyCommitmentStatus.commitment_amount) || 0;
        const paid = Number(monthlyCommitmentStatus.paid_this_month) || 0;
        const remaining = Number(monthlyCommitmentStatus.remaining_amount) || 0;
        const met = Boolean(monthlyCommitmentStatus.met);

        return {
            state: amount > 0 ? (met ? ("met" as const) : ("due" as const)) : ("none" as const),
            amount,
            paid,
            remaining,
            met,
            monthLabel,
            progressPercent: amount > 0 ? Math.min(100, (paid / amount) * 100) : 100
        };
    }, [monthlyCommitmentState, monthlyCommitmentStatus]);

    // A capacity failure caused by the product itself is not an advisory. The
    // capacity check and the submission both resolve the product the same way and
    // both 404 with LOAN_PRODUCT_NOT_FOUND, so telling the member "you can still
    // submit" would be a promise the next request breaks.
    const selectedLoanProductUnavailable = Boolean(
        selectedLoanProduct && loanCapacityError && /product was not found/i.test(loanCapacityError)
    );

    const loanSubmissionLocks = useMemo(() => {
        const locks: string[] = [];

        if (!selectedLoanProduct) {
            locks.push("Select a loan product to continue.");
        }

        if (selectedLoanProductUnavailable) {
            locks.push("The selected loan product is no longer available for new applications.");
        }

        if (memberRecord?.status !== "active") {
            locks.push("Your member profile is not active, so loan submission is locked.");
        }

        if (memberHasProblemLoan) {
            locks.push("You have an in-arrears or written-off loan that must be resolved first.");
        }

        if (selectedLoanConflict) {
            locks.push(`You already have a ${selectedLoanConflict.status} loan application in progress.`);
        }

        if (monthlyCommitment.state === "due") {
            locks.push(`Deposit the remaining ${formatCurrency(monthlyCommitment.remaining)} of this month's mandatory savings first.`);
        }

        return locks;
    }, [
        memberHasProblemLoan,
        memberRecord?.status,
        monthlyCommitment,
        selectedLoanConflict,
        selectedLoanProduct,
        selectedLoanProductUnavailable
    ]);
    const loanCapacityLimitingFactor = useMemo(() => {
        if (!loanCapacity) {
            return null;
        }

        const limits = [
            { label: "member savings", value: Number(loanCapacity.contribution_limit || 0) },
            { label: "loan product cap", value: Number(loanCapacity.product_limit || 0) },
            { label: "SACCO liquidity", value: Number(loanCapacity.liquidity_limit || 0) }
        ].filter((entry) => Number.isFinite(entry.value));

        if (!limits.length) {
            return null;
        }

        return limits.reduce((lowest, entry) => (entry.value < lowest.value ? entry : lowest), limits[0]);
    }, [loanCapacity]);
    const loanCapacityWarnings = useMemo(() => {
        const warnings: string[] = [];

        if (selectedLoanProductUnavailable) {
            warnings.push("This loan product is no longer available. Pick another product to continue.");
        } else if (selectedLoanProduct && loanCapacityError) {
            warnings.push("Your live borrowing limit could not be loaded. You can still submit — the branch re-checks it during review.");
        }

        if (selectedLoanPoolFrozen) {
            warnings.push("Loan pool liquidity is currently constrained. New requests may take longer to review and may not clear until liquidity improves.");
        }

        if (selectedLoanProduct && loanCapacity && selectedLoanBorrowLimit < selectedLoanMinimumAmount) {
            const limitingCopy = loanCapacityLimitingFactor
                ? ` Current limiting factor: ${loanCapacityLimitingFactor.label} (${formatCurrency(loanCapacityLimitingFactor.value)}).`
                : "";
            warnings.push(`Your current maximum borrow limit of ${formatCurrency(selectedLoanBorrowLimit)} is below this product minimum of ${formatCurrency(selectedLoanMinimumAmount)}.${limitingCopy}`);
        }

        return warnings;
    }, [
        loanCapacity,
        loanCapacityError,
        loanCapacityLimitingFactor,
        selectedLoanBorrowLimit,
        selectedLoanMinimumAmount,
        selectedLoanPoolFrozen,
        selectedLoanProduct,
        selectedLoanProductUnavailable
    ]);
    const requestedAmountExceedsBorrowLimit = useMemo(
        () => Boolean(selectedLoanProduct && loanCapacity && requestedLoanAmount > selectedLoanBorrowLimit),
        [loanCapacity, requestedLoanAmount, selectedLoanBorrowLimit, selectedLoanProduct]
    );
    const requestedAmountCapacityWarning = useMemo(() => {
        if (!requestedAmountExceedsBorrowLimit) {
            return null;
        }

        return `Requested amount exceeds your recommended borrowing capacity. Recommended maximum: ${formatCurrency(selectedLoanBorrowLimit)}.`;
    }, [requestedAmountExceedsBorrowLimit, selectedLoanBorrowLimit]);
    const liquidityApproachingFreeze = useMemo(() => {
        if (!loanCapacity || selectedLoanPoolFrozen || loanCapacity.total_deposits <= 0) {
            return false;
        }

        const warningThreshold = Math.min(1, Number(loanCapacity.auto_loan_freeze_threshold || 0) + 0.1);
        return selectedLoanLiquidityRatio > 0 && selectedLoanLiquidityRatio <= warningThreshold;
    }, [loanCapacity, selectedLoanLiquidityRatio, selectedLoanPoolFrozen]);
    const loanLiquidityNotice = useMemo(() => {
        if (!liquidityApproachingFreeze) {
            return null;
        }

        return "Loan pool liquidity is currently limited. Loan approvals may take longer.";
    }, [liquidityApproachingFreeze]);
    // Labels only. Each step used to carry a description that restated its own
    // name — "Product" / "Choose the loan product and review its configured
    // terms." — which cost a line of the dialog on every step and told nobody
    // anything. The fields themselves say what to enter.
    const loanApplicationSteps = [
        { label: "Product" },
        { label: "Eligibility" },
        { label: "Details" },
        { label: "Review" }
    ] as const;
    const loanStepProgressPercent = ((loanFormStep + 1) / loanApplicationSteps.length) * 100;
    const isLoanProductStep = loanFormStep === 0;
    const isLoanEligibilityStep = loanFormStep === 1;
    const isLoanDetailsStep = loanFormStep === 2;
    const isLoanReviewStep = loanFormStep === loanApplicationSteps.length - 1;
    const visibleLoanFormErrors = useMemo(
        () =>
            Object.values(loanApplicationForm.formState.errors)
                .map((entry) => entry?.message)
                .filter((message): message is string => Boolean(message)),
        [loanApplicationForm.formState.errors]
    );
    const installmentPreview = useMemo(
        () => estimateInstallment(
            Number(requestedLoanAmount || 0),
            Number(selectedLoanProduct?.annual_interest_rate || 0),
            Number(requestedLoanTerm || 0),
            requestedLoanFrequency
        ),
        [requestedLoanAmount, requestedLoanFrequency, requestedLoanTerm, selectedLoanProduct]
    );

    const getSupabaseErrorMessage = (value: unknown, fallback: string) => {
        if (value && typeof value === "object" && "message" in value && typeof value.message === "string") {
            return value.message;
        }

        return fallback;
    };

    // What the member owes today — a member with any open loan may only apply
    // as a top-up, and the new facility has to settle that balance first.
    useEffect(() => {
        let cancelled = false;

        if (!showApplyDialog || !profile?.tenant_id) {
            setTopUpQuote(null);
            return () => {
                cancelled = true;
            };
        }

        void api.get<TopUpQuoteResponse>(endpoints.loanApplications.topUpQuote(), {
            params: { tenant_id: profile.tenant_id }
        })
            .then(({ data }) => {
                if (!cancelled) {
                    setTopUpQuote(data.data || null);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setTopUpQuote(null);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [showApplyDialog, profile?.tenant_id]);

    useEffect(() => {
        let cancelled = false;

        if (!showApplyDialog || !profile?.tenant_id || !memberRecord?.id || !selectedLoanProductId || !selectedLoanBranchId) {
            setLoanCapacity(null);
            setLoanCapacityError(null);
            setLoanCapacityLoading(false);
            return () => {
                cancelled = true;
            };
        }

        setLoanCapacityLoading(true);
        setLoanCapacityError(null);

        void api.get<LoanCapacityResponse>(endpoints.loanCapacity.capacity(), {
            params: {
                tenant_id: profile.tenant_id,
                member_id: memberRecord.id,
                loan_product_id: selectedLoanProductId,
                branch_id: selectedLoanBranchId
            }
        })
            .then(({ data }) => {
                if (cancelled) {
                    return;
                }

                setLoanCapacity(data.data || null);
            })
            .catch((capacityError) => {
                if (cancelled) {
                    return;
                }

                setLoanCapacity(null);
                setLoanCapacityError(getApiErrorMessage(capacityError, "Unable to load current borrowing capacity."));
            })
            .finally(() => {
                if (!cancelled) {
                    setLoanCapacityLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [memberRecord?.id, profile?.tenant_id, selectedLoanBranchId, selectedLoanProductId, showApplyDialog]);

    // The dashboard limit is judged across EVERY active loan product and the
    // best tier wins — scoring only the tier of the member's current loan
    // would cap a 94M-savings member at that old tier's product maximum. The
    // backend does the scan in one call and audits just the winning product.
    useEffect(() => {
        let cancelled = false;

        if (!profile?.tenant_id || !memberRecord?.id || !selectedLoanBranchId) {
            setDashboardLoanCapacity(null);
            setDashboardCapacityProductName(null);
            setDashboardLoanCapacityError(null);
            setDashboardLoanCapacityLoading(false);
            return () => {
                cancelled = true;
            };
        }

        setDashboardLoanCapacityLoading(true);
        setDashboardLoanCapacityError(null);

        void api.get<BestLoanCapacityResponse>(endpoints.loanCapacity.bestCapacity(), {
            params: {
                tenant_id: profile.tenant_id,
                member_id: memberRecord.id,
                branch_id: selectedLoanBranchId
            }
        })
            .then(({ data }) => {
                if (cancelled) {
                    return;
                }

                setDashboardLoanCapacity(data.data?.summary || null);
                setDashboardCapacityProductName(data.data?.loan_product?.name || null);
            })
            .catch((capacityError) => {
                if (cancelled) {
                    return;
                }

                setDashboardLoanCapacity(null);
                setDashboardCapacityProductName(null);
                setDashboardLoanCapacityError(getApiErrorMessage(capacityError, "Unable to load borrowing capacity summary."));
            })
            .finally(() => {
                if (!cancelled) {
                    setDashboardLoanCapacityLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [memberRecord?.id, profile?.tenant_id, selectedLoanBranchId]);

    useEffect(() => {
        if (!selectedLoanProduct) {
            loanApplicationForm.setValue("requested_interest_rate", 0, { shouldDirty: false, shouldValidate: false });
            return;
        }

        loanApplicationForm.setValue("requested_interest_rate", annualToMonthlyRate(selectedLoanProduct.annual_interest_rate || 0), {
            shouldDirty: false,
            shouldValidate: false
        });

        const nextAllowedFrequencies = selectedLoanPolicy.allowedRepaymentFrequencies;
        if (!nextAllowedFrequencies.includes(requestedLoanFrequency)) {
            loanApplicationForm.setValue("requested_repayment_frequency", nextAllowedFrequencies[0] || "monthly", {
                shouldDirty: true,
                shouldValidate: true
            });
        }
    }, [loanApplicationForm, requestedLoanFrequency, selectedLoanPolicy.allowedRepaymentFrequencies, selectedLoanProduct]);

    const normalizeContributionOrder = (order: PaymentOrder) => {
        if ((order.posted_at || order.journal_id) && order.status !== "posted") {
            return {
                ...order,
                status: "posted" as const
            };
        }

        return order;
    };

    const mergePaymentOrder = (nextOrder: PaymentOrder, markAsLatest = true) => {
        const normalizedOrder = normalizeContributionOrder(nextOrder);
        setPaymentOrders((current) => {
            const next = [normalizedOrder, ...current.filter((entry) => entry.id !== normalizedOrder.id)];
            next.sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());
            return next;
        });
        if (markAsLatest) {
            setPaymentOrder(normalizedOrder);
        } else {
            setPaymentOrder((current) => (current?.id === normalizedOrder.id ? normalizedOrder : current));
        }
        setSelectedPaymentReceipt((current) => (current?.id === normalizedOrder.id ? normalizedOrder : current));
        return normalizedOrder;
    };

    const normalizedPaymentOrder = paymentOrder ? normalizeContributionOrder(paymentOrder) : null;
    const normalizedPaymentOrders = useMemo(() => paymentOrders.map((order) => normalizeContributionOrder(order)), [paymentOrders]);
    const latestSharePaymentOrder = normalizedPaymentOrders.find((order) => order.purpose === "share_contribution") || null;
    const latestSavingsPaymentOrder = normalizedPaymentOrders.find((order) => order.purpose === "savings_deposit") || null;
    const latestMembershipFeePaymentOrder = normalizedPaymentOrders.find((order) => order.purpose === "membership_fee") || null;
    const latestLoanRepaymentPaymentOrder = normalizedPaymentOrders.find((order) => order.purpose === "loan_repayment") || null;
    const latestAccountsDepositPaymentOrder = latestSavingsPaymentOrder;
    const trackedContributionOrder = useMemo(() => {
        if (!activeContributionOrderId) {
            return null;
        }

        return (
            normalizedPaymentOrders.find((order) => order.id === activeContributionOrderId) ||
            (normalizedPaymentOrder?.id === activeContributionOrderId ? normalizedPaymentOrder : null)
        );
    }, [activeContributionOrderId, normalizedPaymentOrder, normalizedPaymentOrders]);
    const activePaymentPurpose = trackedContributionOrder?.purpose === "savings_deposit"
        || trackedContributionOrder?.purpose === "membership_fee"
        || trackedContributionOrder?.purpose === "share_contribution"
        || trackedContributionOrder?.purpose === "loan_repayment"
        ? trackedContributionOrder.purpose
        : paymentFlowPurpose;
    // The deposit wording is the default and the fallback both, so it is named
    // once rather than written out twice and left to drift.
    const savingsDepositCopy = {
        noun: tr("savings deposit", "kuweka akiba"),
        title: tr("Savings Deposit", "Kuweka Akiba"),
        accountLabel: tr("Savings Account", "Akaunti ya Akiba"),
        amountLabel: tr("Deposit Amount", "Kiasi cha Kuweka"),
        helperText: tr("Amount to push to your phone.", "Kiasi kitakachotumwa kwenye simu yako."),
        emptyAccountMessage: tr(
            "A savings account will be prepared automatically when this deposit starts.",
            "Akaunti ya akiba itaandaliwa yenyewe utakapoanza kuweka fedha."
        )
    };
    const activePaymentCopy = activePaymentPurpose === "membership_fee"
        ? {
            noun: tr("membership fee payment", "malipo ya ada ya uanachama"),
            title: tr("Membership Fee", "Ada ya Uanachama"),
            accountLabel: tr("Savings Account", "Akaunti ya Akiba"),
            amountLabel: tr("Membership Fee Amount", "Kiasi cha Ada ya Uanachama"),
            helperText: tr(
                "This amount settles the outstanding membership fee.",
                "Kiasi hiki kinamaliza ada ya uanachama inayodaiwa."
            ),
            emptyAccountMessage: tr(
                "A savings account will be prepared automatically when the membership fee payment starts.",
                "Akaunti ya akiba itaandaliwa yenyewe malipo ya ada yatakapoanza."
            )
        }
        : activePaymentPurpose === "loan_repayment"
            ? {
                noun: tr("loan repayment", "kulipa mkopo"),
                title: tr("Loan Repayment", "Kulipa Mkopo"),
                accountLabel: tr("Loan Facility", "Mkopo"),
                amountLabel: tr("Repayment Amount", "Kiasi cha Kulipa"),
                helperText: tr(
                    "Enter any amount up to the outstanding balance. The system allocates interest first, then principal.",
                    "Weka kiasi chochote hadi kufikia deni lililobaki. Mfumo hulipa riba kwanza, kisha mtaji."
                ),
                emptyAccountMessage: tr(
                    "No repayable loan is linked to this member profile right now.",
                    "Kwa sasa hakuna mkopo unaoweza kulipwa uliounganishwa na wasifu wako."
                )
            }
            : savingsDepositCopy;
    const contributionFlowState = submittingContribution ? "initiating" : trackedContributionOrder?.status || null;
    const pendingOrderCreatedMs = trackedContributionOrder?.created_at ? Date.parse(trackedContributionOrder.created_at) : Number.NaN;
    const pendingOrderExpiryMs = trackedContributionOrder?.expires_at ? Date.parse(trackedContributionOrder.expires_at) : Number.NaN;
    const pendingOrderElapsedMs = Number.isFinite(pendingOrderCreatedMs)
        ? Math.max(Date.now() - pendingOrderCreatedMs, 0)
        : 0;
    const pendingOrderMinutesRemaining = Number.isFinite(pendingOrderExpiryMs)
        ? Math.max(Math.ceil((pendingOrderExpiryMs - Date.now()) / 60000), 0)
        : null;
    const pendingOrderExpiryLabel = trackedContributionOrder?.expires_at ? formatDate(trackedContributionOrder.expires_at) : null;
    const gatewayStillConfirming = contributionFlowState === "pending"
        && ["AZAMPAY_TIMEOUT", "SNIPPE_TIMEOUT"].includes(String(trackedContributionOrder?.error_code || ""));
    const paymentApprovalTakingLongerThanExpected = contributionFlowState === "pending"
        && !phoneCancellationRequested
        && !gatewayStillConfirming
        && pendingOrderElapsedMs >= PAYMENT_APPROVAL_EXPECTATION_MS;
    const contributionFlowProgress = contributionFlowState === "initiating"
        ? 18
        : contributionFlowState === "pending"
            ? 48
            : contributionFlowState === "paid"
                ? 78
                : contributionFlowState === "posted"
                    ? 100
                    : contributionFlowState === "failed" || contributionFlowState === "expired"
                        ? 100
                        : 0;
    const contributionFlowTone = contributionFlowState === "posted"
        ? "success"
        : contributionFlowState === "failed"
            ? "error"
            : contributionFlowState === "expired"
                ? "warning"
                : "info";
    const contributionFlowTitle = contributionFlowState === "initiating"
        ? "Contacting Mobile Money"
        : contributionFlowState === "pending"
            ? phoneCancellationRequested
                ? "Listening for cancellation callback"
                : gatewayStillConfirming
                    ? "Gateway still confirming"
                    : paymentApprovalTakingLongerThanExpected
                        ? "Approval is taking longer than usual"
                        : "Waiting for phone approval"
            : contributionFlowState === "paid"
                ? "Payment received"
                : contributionFlowState === "posted"
                    ? activePaymentPurpose === "savings_deposit"
                        ? "Savings posted"
                        : activePaymentPurpose === "loan_repayment"
                            ? "Loan repayment posted"
                        : "Contribution posted"
                    : contributionFlowState === "failed"
                        ? "Payment failed"
                        : contributionFlowState === "expired"
                            ? "Payment expired"
                            : `Make ${activePaymentCopy.title}`;
    const contributionFlowMessage = contributionFlowState === "initiating"
        ? "The portal is creating the Mobile Money request and waiting for the gateway to acknowledge it."
        : contributionFlowState === "pending"
            ? phoneCancellationRequested
                ? `You indicated that you cancelled on the phone. The source of truth is the provider callback, and the portal is polling for it now. If the provider confirms cancellation, this screen will update automatically. The provider window${pendingOrderMinutesRemaining !== null ? ` still remains open for about ${pendingOrderMinutesRemaining} more minute(s)` : " remains open"} only as a fallback expiry if no callback arrives.`
                : gatewayStillConfirming
                    ? "Mobile Money did not answer before the timeout, but the order is still open and being tracked. If you already approved on your phone, keep this dialog open while callback confirmation arrives."
                    : paymentApprovalTakingLongerThanExpected
                    ? `Most phone approvals arrive within about 1 minute. The portal is still listening for the provider callback${pendingOrderMinutesRemaining !== null ? ` while the provider window stays open for about ${pendingOrderMinutesRemaining} more minute(s)` : ""}, but you do not need to stay on this screen. Use Check Status if you already responded on your phone, or close and track it later from Payments.`
                        : `Waiting for approval on your phone. Approve the request to complete payment. If you cancel, this screen will update automatically.${pendingOrderMinutesRemaining !== null ? ` If no action is taken, the request expires in about ${pendingOrderMinutesRemaining} minute(s).` : ""}`
            : contributionFlowState === "paid"
                ? activePaymentPurpose === "savings_deposit"
                    ? "Mobile Money confirmed the payment. The backend is now posting the savings deposit into your account."
                    : activePaymentPurpose === "membership_fee"
                        ? "Mobile Money confirmed the payment. The backend is now posting the membership fee and activating your membership."
                        : activePaymentPurpose === "loan_repayment"
                            ? "Mobile Money confirmed the payment. The backend is now allocating the repayment into interest and principal."
                    : "Mobile Money confirmed the payment. The backend is now posting the contribution into your share account."
                : contributionFlowState === "posted"
                    ? activePaymentPurpose === "savings_deposit"
                        ? "The savings deposit is now reflected in your account and statement history."
                        : activePaymentPurpose === "membership_fee"
                            ? "The membership fee is posted and your membership is being activated."
                            : activePaymentPurpose === "loan_repayment"
                                ? "The repayment is now posted against your loan schedule and statement history."
                        : "The contribution is now reflected in your account and statement history."
                    : contributionFlowState === "failed"
                        ? trackedContributionOrder?.error_message || "Mobile Money reported a payment failure."
                        : contributionFlowState === "expired"
                            ? trackedContributionOrder?.error_message || "The mobile money request expired before approval."
                            : `Start a ${activePaymentCopy.noun} request and follow the progress here.`;
    const contributionRequestStepState = submittingContribution
        ? "active"
        : trackedContributionOrder
            ? "complete"
            : "idle";
    const contributionApprovalStepState = contributionFlowState === "pending"
        ? "active"
        : contributionFlowState === "paid" || contributionFlowState === "posted"
            ? "complete"
            : "idle";
    const contributionPostingStepState = contributionFlowState === "paid"
        ? "active"
        : contributionFlowState === "posted"
            ? "complete"
            : "idle";
    const showBackgroundActivity = contributionFlowState === "initiating" || contributionFlowState === "pending" || contributionFlowState === "paid";
    const backgroundActivityMessage = contributionFlowState === "initiating"
        ? "Creating the Mobile Money request..."
        : contributionFlowState === "pending"
            ? phoneCancellationRequested
                ? "Listening for the provider callback after handset cancellation..."
                : "Waiting for approval on your phone. This screen checks for webhook and status updates automatically..."
            : activePaymentPurpose === "membership_fee"
                ? "Payment is confirmed. Posting the membership fee in the background..."
                : activePaymentPurpose === "loan_repayment"
                    ? "Payment is confirmed. Posting the loan repayment in the background..."
                : "Payment is confirmed. Posting the deposit in the background...";

    const m3MenuTokens = useMemo(() => {
        const surfaceContainerHighest = theme.palette.background.paper;
        const surfaceVariant = theme.palette.mode === "dark"
            ? alpha(theme.palette.common.white, 0.04)
            : alpha(theme.palette.common.black, 0.02);

        return {
            surfaceContainerHighest,
            surfaceVariant,
            shapeExtraLarge: "4px"
        };
    }, [theme]);
    const isDarkMode = theme.palette.mode === "dark";
    const memberAccent = isDarkMode ? DARK_MEMBER_ACCENT : brandColors.primary[700];
    const memberAccentStrong = isDarkMode ? DARK_MEMBER_ACCENT_DEEP : brandColors.primary[900];
    const memberAccentAlt = isDarkMode ? "#E6C88A" : brandColors.accent[700];
    const memberAccentSoftBg = alpha(memberAccent, isDarkMode ? 0.18 : 0.12);
    const portalLogoSrc = "/icon-ilboru.png";
    const memberPortalTourSeen = typeof window !== "undefined"
        ? window.localStorage.getItem(MEMBER_PORTAL_TOUR_STORAGE_KEY) === "done"
        : true;

    const completeMemberPortalTour = () => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem(MEMBER_PORTAL_TOUR_STORAGE_KEY, "done");
        }

        setRunFeatureTour(false);
        setActiveSection("member-overview");
    };

    const startMemberPortalTour = () => {
        if (!MEMBER_PORTAL_TOUR_ENABLED) {
            return;
        }
        setShowContributionDialog(false);
        setShowApplyDialog(false);
        setActiveSection("member-overview");
        setRunFeatureTour(true);
    };

    useEffect(() => {
        if (
            !MEMBER_PORTAL_TOUR_ENABLED
            || loading
            || runFeatureTour
            || memberPortalTourSeen
            || showContributionDialog
            || showApplyDialog
            || showProfileCompletionDialog
        ) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setActiveSection("member-overview");
            setRunFeatureTour(true);
        }, 900);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loading, memberPortalTourSeen, runFeatureTour, showApplyDialog, showContributionDialog, showProfileCompletionDialog]);

    const openDepositDialog = (purpose: MemberPaymentPurpose = "savings_deposit", loanId?: string | null) => {
        if (purpose === "share_contribution" && !shareContributionSelfServiceEnabled) {
            pushToast({
                title: tr("Contribution unavailable", "Mchango haupatikani"),
                message: tr("This SACCO uses savings deposits as the operational member contribution source.", "SACCOS hii inatumia amana za akiba kama chanzo cha michango ya wanachama."),
                type: "error"
            });
            return;
        }

        if (purpose === "savings_deposit" && !savingsDepositSelfServiceEnabled) {
            pushToast({
                title: tr("Savings deposit unavailable", "Kuweka akiba hakupatikani"),
                message: tr("Tenant super admin has turned off self-service savings deposits for members.", "Msimamizi mkuu amezima uwezo wa wanachama kuweka akiba wenyewe."),
                type: "error"
            });
            return;
        }

        if (purpose === "loan_repayment" && !loanRepaymentSelfServiceEnabled) {
            pushToast({
                title: tr("Loan repayment unavailable", "Kulipa mkopo hakupatikani"),
                message: tr("Tenant super admin has turned off self-service loan repayments for members.", "Msimamizi mkuu amezima uwezo wa wanachama kulipa mkopo wenyewe."),
                type: "error"
            });
            return;
        }

        if (purpose !== "membership_fee" && !canUsePortalPayments) {
            pushToast({
                title: tr("Deposits unavailable", "Kuweka fedha hakupatikani"),
                message: tr("Mobile-money deposit integration is not currently available for this workspace.", "Muunganisho wa malipo ya simu haupatikani kwa sasa."),
                type: "error"
            });
            return;
        }

        if (purpose === "loan_repayment" && !portalRepaymentLoans.length) {
            pushToast({
                title: tr("No active loan", "Huna mkopo unaoendelea"),
                message: tr("There is no active or in-arrears loan available for self-service repayment.", "Hakuna mkopo unaoendelea au uliochelewa unaoweza kulipwa hapa."),
                type: "error"
            });
            return;
        }

        setPaymentFlowPurpose(purpose);
        setPhoneCancellationRequested(false);
        const latestOrder = purpose === "savings_deposit"
            ? latestSavingsPaymentOrder
            : purpose === "membership_fee"
                ? latestMembershipFeePaymentOrder
                : purpose === "loan_repayment"
                    ? latestLoanRepaymentPaymentOrder
                : latestSharePaymentOrder;
        if (latestOrder && ["pending", "paid"].includes(latestOrder.status)) {
            setActiveContributionOrderId(latestOrder.id);
        } else {
            setActiveContributionOrderId(null);
        }
        if (purpose === "membership_fee") {
            contributionPaymentForm.setValue("amount", membershipFeeOutstanding, { shouldValidate: true });
            contributionPaymentForm.setValue("description", "Membership fee payment", { shouldValidate: true });
            contributionPaymentForm.setValue("loan_id", "", { shouldValidate: false });
        } else if (purpose === "loan_repayment") {
            setLoanRepaymentDefaults(loanId);
            contributionPaymentForm.setValue("account_id", "", { shouldValidate: false });
        } else {
            contributionPaymentForm.setValue("loan_id", "", { shouldValidate: false });
        }
        setShowContributionDialog(true);
    };

    const setLoanRepaymentDefaults = (loanIdOverride?: string | null) => {
        const nextLoan =
            (loanIdOverride ? portalRepaymentLoans.find((loan) => loan.id === loanIdOverride) : null)
            || selectedRepaymentLoan
            || portalRepaymentLoans[0]
            || null;
        const nextSchedules = loanSchedules.filter((schedule) => schedule.loan_id === nextLoan?.id && schedule.status !== "paid");
        const nextInsights = buildRepaymentInsights(nextLoan, nextSchedules, 0);

        contributionPaymentForm.reset({
            account_id: "",
            loan_id: nextLoan?.id || "",
            amount: nextInsights.recommendedAmount > 0 ? Number(nextInsights.recommendedAmount.toFixed(2)) : 0,
            provider: contributionPaymentForm.getValues("provider") || "vodacom",
            msisdn: contributionPaymentForm.getValues("msisdn") || profile?.phone || "",
            description: nextLoan ? `Loan repayment for ${nextLoan.loan_number}` : ""
        });
    };

    const prepareAnotherContribution = () => {
        setActiveContributionOrderId(null);
        setPhoneCancellationRequested(false);
        if (paymentFlowPurpose === "loan_repayment") {
            setLoanRepaymentDefaults(contributionPaymentForm.getValues("loan_id"));
            return;
        }

        contributionPaymentForm.reset({
            account_id: contributionPaymentForm.getValues("account_id"),
            loan_id: "",
            amount: 0,
            provider: contributionPaymentForm.getValues("provider") || "vodacom",
            msisdn: contributionPaymentForm.getValues("msisdn") || profile?.phone || "",
            description: ""
        });
    };

    const handleStopTrackingPayment = () => {
        const openOrder = trackedContributionOrder;
        setShowContributionDialog(false);
        pushToast({
            title: tr("Tracking continues in background", "Ufuatiliaji unaendelea nyuma"),
            message: openOrder?.status === "pending"
                ? "This payment request is still being tracked in the background. You can reopen it from Payments, and the portal will notify you when the provider confirms a final result."
                : "The payment progress dialog has been closed.",
            type: "info"
        });
    };

    const openProfileCompletionDialog = () => {
        memberProfileCompletionForm.reset({
            full_name: memberRecord?.full_name || "",
            dob: (memberRecord?.dob || "").slice(0, 10),
            phone: normalizePortalPhone(memberRecord?.phone),
            email: memberRecord?.email || "",
            gender: memberRecord?.gender === "male" || memberRecord?.gender === "female" ? memberRecord.gender : "",
            marital_status: memberRecord?.marital_status || "",
            occupation: memberRecord?.occupation || "",
            employer: memberRecord?.employer || "",
            id_type: ((memberRecord as { id_type?: string } | null | undefined)?.id_type as "nida" | "voter" | "license" | "passport") || "nida",
            national_id: memberRecord?.national_id || memberRecord?.nida_no || "",
            nida_no: memberRecord?.nida_no || "",
            tin_no: memberRecord?.tin_no || "",
            region_id: memberRecord?.region_id || "",
            district_id: memberRecord?.district_id || "",
            ward_id: memberRecord?.ward_id || "",
            village_id: memberRecord?.village_id || "",
            region: memberRecord?.region || "",
            district: memberRecord?.district || "",
            ward: memberRecord?.ward || "",
            street_or_village: memberRecord?.street_or_village || "",
            residential_address: memberRecord?.residential_address || memberRecord?.address_line1 || "",
            next_of_kin_name: memberRecord?.next_of_kin_name || "",
            next_of_kin_phone: memberRecord?.next_of_kin_phone || "",
            next_of_kin_relationship: memberRecord?.next_of_kin_relationship || "",
            next_of_kin_address: memberRecord?.next_of_kin_address || "",
            next_of_kin_region_id: memberRecord?.next_of_kin_region_id || "",
            next_of_kin_district_id: memberRecord?.next_of_kin_district_id || "",
            next_of_kin_ward_id: memberRecord?.next_of_kin_ward_id || "",
            next_of_kin_village_id: memberRecord?.next_of_kin_village_id || "",
            // Legacy records only have free text — surface it in the street box so
            // nothing typed before the structured format disappears from the form.
            next_of_kin_street: memberRecord?.next_of_kin_street
                || (memberRecord?.next_of_kin_region_id ? "" : memberRecord?.next_of_kin_address)
                || "",
            ilboru_completion_year: memberRecord?.ilboru_completion_year || "",
            heir_name: memberRecord?.heir_name || "",
            heir_phone: memberRecord?.heir_phone || "",
            heir_relationship: memberRecord?.heir_relationship || "",
            heir_address: memberRecord?.heir_address || "",
            legitimate_income_declared: Boolean(memberRecord?.legitimate_income_declared),
            no_conflicting_business_declared: Boolean(memberRecord?.no_conflicting_business_declared)
        });
        setShowProfileCompletionDialog(true);
    };

    useEffect(() => {
        if (!showProfileCompletionDialog || memberProfileCompletionForm.getValues("region_id") || !regions.length) {
            return;
        }

        const match = findLocationByName(regions, memberProfileCompletionForm.getValues("region"));
        if (match) {
            memberProfileCompletionForm.setValue("region_id", match.id, { shouldValidate: false });
        }
    }, [showProfileCompletionDialog, regions, memberProfileCompletionForm]);

    useEffect(() => {
        if (!showProfileCompletionDialog || memberProfileCompletionForm.getValues("district_id") || !districts.length) {
            return;
        }

        const match = findLocationByName(districts, memberProfileCompletionForm.getValues("district"));
        if (match) {
            memberProfileCompletionForm.setValue("district_id", match.id, { shouldValidate: false });
        }
    }, [showProfileCompletionDialog, districts, memberProfileCompletionForm]);

    useEffect(() => {
        if (!showProfileCompletionDialog || memberProfileCompletionForm.getValues("ward_id") || !wards.length) {
            return;
        }

        const match = findLocationByName(wards, memberProfileCompletionForm.getValues("ward"));
        if (match) {
            memberProfileCompletionForm.setValue("ward_id", match.id, { shouldValidate: false });
        }
    }, [showProfileCompletionDialog, wards, memberProfileCompletionForm]);

    useEffect(() => {
        if (!showProfileCompletionDialog || memberProfileCompletionForm.getValues("village_id") || !villages.length) {
            return;
        }

        const match = findLocationByName(
            villages,
            memberProfileCompletionForm.getValues("street_or_village") || memberProfileCompletionForm.getValues("residential_address")
        );
        if (match) {
            memberProfileCompletionForm.setValue("village_id", match.id, { shouldValidate: false });
        }
    }, [showProfileCompletionDialog, villages, memberProfileCompletionForm]);

    const toNullableProfileValue = (value?: string | null) => {
        const normalized = String(value || "").trim();
        return normalized ? normalized : null;
    };

    const refreshMemberContributionData = async (targetMemberId = memberId) => {
        if (!profile?.tenant_id) {
            return;
        }

        const [membersResult, applicationResult] = await Promise.allSettled([
            api.get<MembersResponse>(endpoints.members.list(), {
                params: {
                    tenant_id: profile.tenant_id,
                    page: 1,
                    limit: 100,
                    include_total: false
                }
            }),
            api.get<MemberApplicationResponse>(endpoints.memberApplications.me(), {
                params: {
                    tenant_id: profile.tenant_id
                }
            })
        ]);

        let resolvedMemberId = targetMemberId;

        if (membersResult.status === "fulfilled") {
            const refreshedMember =
                (membersResult.value.data.data || []).find((member: Member) => member.user_id === (user?.id || "")) ||
                membersResult.value.data.data?.[0] ||
                null;
            setMemberRecord(refreshedMember);
            setMemberId(refreshedMember?.id || "");
            resolvedMemberId = refreshedMember?.id || resolvedMemberId;
        }

        if (applicationResult.status === "fulfilled") {
            setMemberApplication(applicationResult.value.data.data || null);
        }

        if (!resolvedMemberId) {
            setAccounts([]);
            setStatements([]);
            setLoanTransactions([]);
            return;
        }

        const [accountsResult, loansResult, schedulesResult, statementsResult, loanTransactionsResult] = await Promise.allSettled([
            api.get<MemberAccountsResponse>(endpoints.members.accounts(), {
                params: {
                    tenant_id: profile.tenant_id,
                    page: 1,
                    limit: 100,
                    include_total: false
                }
            }),
            api.get<LoansResponse>(endpoints.finance.loanPortfolio(), {
                params: {
                    tenant_id: profile.tenant_id,
                    member_id: resolvedMemberId,
                    page: 1,
                    limit: 100
                }
            }),
            api.get<LoanSchedulesResponse>(endpoints.finance.loanSchedules(), {
                params: {
                    tenant_id: profile.tenant_id,
                    page: 1,
                    limit: 100
                }
            }),
            api.get<StatementsResponse>(endpoints.finance.statements(), {
                params: {
                    tenant_id: profile.tenant_id,
                    member_id: resolvedMemberId,
                    page: 1,
                    limit: 100
                }
            }),
            api.get<LoanTransactionsResponse>(endpoints.finance.loanTransactions(), {
                params: {
                    tenant_id: profile.tenant_id,
                    page: 1,
                    limit: 100
                }
            })
        ]);

        if (accountsResult.status === "fulfilled") {
            setAccounts(accountsResult.value.data.data || []);
        }

        if (loansResult.status === "fulfilled") {
            setLoans(loansResult.value.data.data || []);
        }

        if (schedulesResult.status === "fulfilled") {
            setLoanSchedules(schedulesResult.value.data.data || []);
        }

        if (statementsResult.status === "fulfilled") {
            setStatements(statementsResult.value.data.data || []);
        }

        if (loanTransactionsResult.status === "fulfilled") {
            setLoanTransactions(loanTransactionsResult.value.data.data || []);
        }

        // A rejected refresh must be loud: stale statements after a confirmed
        // deposit would otherwise show the member as still owing this month's
        // savings with no hint that anything failed.
        const rejected = [accountsResult, loansResult, schedulesResult, statementsResult, loanTransactionsResult]
            .filter((result): result is PromiseRejectedResult => result.status === "rejected");
        if (rejected.length) {
            pushToast({
                type: "error",
                title: tr("Some data did not refresh", "Baadhi ya taarifa hazikusasishwa"),
                message: getApiErrorMessage(rejected[0].reason, "Part of your workspace could not be refreshed. Reload the page if figures look out of date.")
            });
        }
    };

    const refreshMonthlyCommitment = async () => {
        try {
            const { data } = await api.get<MemberMonthlyCommitmentStatusResponse>(
                endpoints.members.monthlyCommitment()
            );
            setMonthlyCommitmentStatus(data.data);
            setMonthlyCommitmentState("ready");
        } catch {
            // Distinct "error" state: the banner says the status could not be
            // verified instead of claiming the member has not paid.
            setMonthlyCommitmentState("error");
        }
    };

    useEffect(() => {
        if (!profile?.tenant_id) {
            return;
        }
        // statements is in the deps so a confirmed deposit (which refreshes the
        // statement list) re-checks the commitment automatically.
        void refreshMonthlyCommitment();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.tenant_id, statements]);

    const submitProfileCompletion = memberProfileCompletionForm.handleSubmit(async (values) => {
        setSavingProfileCompletion(true);
        try {
            const payload: UpdateOwnMemberProfileCompletionRequest = {
                full_name: toNullableProfileValue(values.full_name),
                dob: toNullableProfileValue(values.dob),
                phone: toNullableProfileValue(values.phone),
                email: toNullableProfileValue(values.email),
                gender: values.gender || null,
                marital_status: values.marital_status || null,
                occupation: toNullableProfileValue(values.occupation),
                employer: toNullableProfileValue(values.employer),
                id_type: values.id_type,
                // NIDA is digits-only (strip the dashed slip format); other ID types may
                // legitimately contain dashes, so only strip whitespace for those.
                national_id: toNullableProfileValue(
                    values.id_type === "nida"
                        ? values.national_id?.replace(/[\s-]/g, "")
                        : values.national_id?.replace(/\s/g, "")
                ),
                // NIDA number and National ID are the same value in Tanzania; mirror the
                // single ID field into nida_no when the chosen ID type is NIDA/National ID.
                nida_no: values.id_type === "nida" ? toNullableProfileValue(values.national_id?.replace(/[\s-]/g, "")) : null,
                // The backend identity-code pattern has no whitespace; the form validates the
                // cleaned TIN, so send the cleaned value too or valid input 400s server-side.
                tin_no: toNullableProfileValue(values.tin_no?.replace(/[\s-]/g, "")),
                region_id: toNullableProfileValue(values.region_id),
                district_id: toNullableProfileValue(values.district_id),
                ward_id: toNullableProfileValue(values.ward_id),
                village_id: toNullableProfileValue(values.village_id),
                region: toNullableProfileValue(values.region),
                district: toNullableProfileValue(values.district),
                ward: toNullableProfileValue(values.ward),
                street_or_village: toNullableProfileValue(values.street_or_village),
                residential_address: toNullableProfileValue(values.residential_address),
                address_line1: toNullableProfileValue(values.residential_address),
                city: toNullableProfileValue(values.district),
                state: toNullableProfileValue(values.region),
                country: memberRecord?.country || "Tanzania",
                next_of_kin_name: toNullableProfileValue(values.next_of_kin_name),
                next_of_kin_phone: toNullableProfileValue(values.next_of_kin_phone),
                next_of_kin_relationship: toNullableProfileValue(values.next_of_kin_relationship),
                next_of_kin_address: toNullableProfileValue(values.next_of_kin_address),
                next_of_kin_region_id: toNullableProfileValue(values.next_of_kin_region_id),
                next_of_kin_district_id: toNullableProfileValue(values.next_of_kin_district_id),
                next_of_kin_ward_id: toNullableProfileValue(values.next_of_kin_ward_id),
                next_of_kin_village_id: toNullableProfileValue(values.next_of_kin_village_id),
                next_of_kin_street: toNullableProfileValue(values.next_of_kin_street),
                heir_name: toNullableProfileValue(values.heir_name),
                heir_phone: toNullableProfileValue(values.heir_phone),
                heir_relationship: toNullableProfileValue(values.heir_relationship),
                heir_address: toNullableProfileValue(values.heir_address),
                ilboru_completion_year: values.ilboru_completion_year ? Number(values.ilboru_completion_year) : null,
                legitimate_income_declared: Boolean(values.legitimate_income_declared),
                no_conflicting_business_declared: Boolean(values.no_conflicting_business_declared)
            };

            const { data } = await api.patch<UpdateOwnMemberProfileCompletionResponse>(
                endpoints.members.profileCompletion(),
                payload
            );

            setMemberRecord(data.data || null);
            setShowProfileCompletionDialog(false);
            pushToast({
                type: "success",
                title: tr("Profile updated", "Wasifu umehifadhiwa"),
                message: tr("Your member profile details were saved and your branch will now see the completed compliance information.", "Taarifa zako zimehifadhiwa na tawi lako sasa litaona taarifa zilizokamilika.")
            });
            await refreshMemberContributionData(data.data?.id || memberId);
        } catch (error) {
            pushToast({
                type: "error",
                title: tr("Unable to update profile", "Imeshindikana kuhifadhi wasifu"),
                message: getApiErrorMessage(error)
            });
        } finally {
            setSavingProfileCompletion(false);
        }
    }, (errors) => {
        // The profile only saves once every required by-law field is filled, so an
        // empty form can no longer save silently. Surface how many are outstanding and
        // the first one to fix.
        const messages = Object.values(errors)
            .map((entry) => (entry as { message?: string })?.message)
            .filter((message): message is string => Boolean(message));
        pushToast({
            type: "error",
            title: tr("Complete the required fields", "Jaza sehemu zinazohitajika"),
            message: messages.length > 1
                ? `${messages.length} fields still need attention — start with: ${messages[0]}`
                : messages[0] || "Some details are invalid. Please review the required fields."
        });
    });

    const handleMarkCancelledOnPhone = () => {
        setPhoneCancellationRequested(true);
        void refreshTrackedPaymentOrder(false);
        setShowContributionDialog(false);
        pushToast({
            title: tr("Phone cancellation noted", "Umeghairi kwenye simu"),
            message: tr("The dialog is closed, but the portal is still checking in the background. If the provider confirms cancellation, you will see the final status automatically in Payments.", "Dirisha limefungwa, lakini portal bado inaangalia nyuma. Mtoa huduma akithibitisha kughairi, utaona hali ya mwisho kwenye Malipo."),
            type: "info"
        });
    };

    const refreshTrackedPaymentOrder = async (manual = false) => {
        const trackedOrderId = trackedContributionOrder?.id || activeContributionOrderId;
        if (!trackedOrderId) {
            return null;
        }

        if (manual) {
            setCheckingPaymentStatus(true);
        }

        try {
            const { data } = await api.get<PaymentOrderStatusResponse>(
                endpoints.memberPayments.orderStatus(trackedOrderId)
            );
            const nextOrder = mergePaymentOrder(data.data.order, false);

            if (nextOrder.status === "paid" && lastPaymentToastStatus !== "paid") {
                setLastPaymentToastStatus("paid");
                pushToast({
                    title: tr("Payment confirmed", "Malipo yamethibitishwa"),
                    message: nextOrder.purpose === "savings_deposit"
                        ? "Mobile Money marked the order as paid. The system is now posting it into your savings account."
                        : nextOrder.purpose === "membership_fee"
                            ? "Mobile Money marked the order as paid. The system is now posting the membership fee and activating your profile."
                            : nextOrder.purpose === "loan_repayment"
                                ? "Mobile Money marked the order as paid. The system is now allocating the repayment into your loan."
                                : "Mobile Money marked the order as paid. The system is now posting it into your share account.",
                    type: "success"
                });
            }

            if (nextOrder.status === "posted" && lastPaymentToastStatus !== "posted") {
                setLastPaymentToastStatus("posted");
                await refreshMemberContributionData(nextOrder.member_id);
                pushToast({
                    title: nextOrder.purpose === "savings_deposit"
                        ? "Savings posted"
                        : nextOrder.purpose === "membership_fee"
                            ? "Membership activated"
                            : nextOrder.purpose === "loan_repayment"
                                ? "Repayment posted"
                                : "Contribution posted",
                    message: nextOrder.purpose === "savings_deposit"
                        ? "Your mobile money savings deposit is now reflected in the system."
                        : nextOrder.purpose === "membership_fee"
                            ? "Your membership fee is posted and your member profile is now active."
                            : nextOrder.purpose === "loan_repayment"
                                ? "Your loan repayment is now reflected in the system."
                                : "Your mobile money contribution is now reflected in the system.",
                    type: "success"
                });
            }

            if (nextOrder.status === "failed" && lastPaymentToastStatus !== "failed") {
                setLastPaymentToastStatus("failed");
                pushToast({
                    title: tr("Payment failed", "Malipo yameshindikana"),
                    message: nextOrder.error_message || "Mobile Money reported a payment failure.",
                    type: "error"
                });
            }

            if (nextOrder.status === "expired" && lastPaymentToastStatus !== "expired") {
                setLastPaymentToastStatus("expired");
                pushToast({
                    title: tr("Payment expired", "Malipo yamepitwa na wakati"),
                    message: nextOrder.error_message || "The payment session expired before completion.",
                    type: "error"
                });
            }

            if (manual && nextOrder.status === "pending") {
                pushToast({
                    title: tr("Still waiting for provider response", "Bado tunasubiri jibu la mtoa huduma"),
                    message: tr("The request is still pending with the provider. This screen will keep checking automatically, and the request will expire only if no terminal callback or status update arrives.", "Ombi bado lipo kwa mtoa huduma. Skrini hii itaendelea kuangalia yenyewe, na ombi litapita muda tu kama hakuna jibu la mwisho litakalofika."),
                    type: "info"
                });
            }

            return nextOrder;
        } catch (error) {
            if (manual) {
                pushToast({
                    title: tr("Status check failed", "Kuangalia hali kumeshindikana"),
                    message: getApiErrorMessage(error, "Unable to refresh the payment status right now."),
                    type: "error"
                });
            } else {
                console.warn("[member-portal] payment status poll failed", error);
            }
            return null;
        } finally {
            if (manual) {
                setCheckingPaymentStatus(false);
            }
        }
    };

    const handleReconcilePaymentOrder = async () => {
        if (!trackedContributionOrder) {
            return;
        }

        setReconcilingPayment(true);
        try {
            const { data } = await api.post<ReconcilePaymentOrderResponse>(
                endpoints.memberPayments.reconcile(trackedContributionOrder.id)
            );
            const nextOrder = mergePaymentOrder(data.data.order);

                if (data.data.reconciled && nextOrder.status === "posted") {
                    setLastPaymentToastStatus("posted");
                    await refreshMemberContributionData(nextOrder.member_id);
                    pushToast({
                        title: nextOrder.purpose === "savings_deposit"
                            ? "Savings posted"
                            : nextOrder.purpose === "membership_fee"
                                ? "Membership activated"
                                : nextOrder.purpose === "loan_repayment"
                                    ? "Repayment posted"
                                : "Contribution posted",
                        message: nextOrder.purpose === "savings_deposit"
                            ? "The paid Mobile Money order has been posted into your savings account."
                            : nextOrder.purpose === "membership_fee"
                                ? "The paid Mobile Money order has posted the membership fee and activated your member profile."
                                : nextOrder.purpose === "loan_repayment"
                                    ? "The paid Mobile Money order has been posted into your loan and statements."
                                : "The paid Mobile Money order has been posted into your share account.",
                        type: "success"
                    });
                    return;
                }

            pushToast({
                title: tr("No new posting yet", "Bado hakuna muamala mpya"),
                message:
                    nextOrder.status === "paid"
                        ? "The order is paid but could not be posted yet. Try again shortly."
                        : `This order is currently ${nextOrder.status.replace(/_/g, " ")}.`,
                type: nextOrder.status === "failed" ? "error" : "success"
            });
        } catch (error) {
            pushToast({
                title: tr("Reconcile failed", "Ulinganishaji umeshindikana"),
                message: getApiErrorMessage(error, "Unable to reconcile this payment order."),
                type: "error"
            });
        } finally {
            setReconcilingPayment(false);
        }
    };

    const submitContributionPayment = contributionPaymentForm.handleSubmit(async (values) => {
        if (!profile?.tenant_id) {
            pushToast({
                title: tr("Tenant missing", "Hakuna SACCOS iliyochaguliwa"),
                message: tr("Select a tenant before initiating a contribution payment.", "Chagua SACCOS kabla ya kuanzisha malipo ya mchango."),
                type: "error"
            });
            return;
        }

        setSubmittingContribution(true);
        try {
            const payload: InitiateContributionPaymentRequest = {
                tenant_id: profile.tenant_id,
                account_id: paymentFlowPurpose === "loan_repayment" ? undefined : values.account_id || undefined,
                loan_id: paymentFlowPurpose === "loan_repayment" ? values.loan_id || undefined : undefined,
                amount: Number(values.amount),
                provider: values.provider,
                msisdn: values.msisdn.trim(),
                description: values.description?.trim() || undefined
            };

            const { data } = await api.post<InitiateContributionPaymentResponse>(
                paymentFlowPurpose === "savings_deposit"
                    ? endpoints.memberPayments.initiateSavings()
                    : paymentFlowPurpose === "membership_fee"
                        ? endpoints.memberPayments.initiateMembershipFee()
                        : paymentFlowPurpose === "loan_repayment"
                            ? endpoints.memberPayments.initiateLoanRepayment()
                        : endpoints.memberPayments.initiateContribution(),
                payload,
                { timeout: 70000 }
            );
            const nextOrder = mergePaymentOrder(data.data.order);
            const pendingConfirmation = data.data.processing_state === "pending_confirmation";
            setActiveContributionOrderId(nextOrder.id);
            setPhoneCancellationRequested(false);
            setLastPaymentToastStatus(nextOrder.status);
            if (paymentFlowPurpose === "loan_repayment") {
                setLoanRepaymentDefaults(values.loan_id);
            } else {
                contributionPaymentForm.reset({
                    account_id: values.account_id,
                    loan_id: "",
                    amount: paymentFlowPurpose === "membership_fee" ? membershipFeeOutstanding : 0,
                    provider: values.provider,
                    msisdn: values.msisdn,
                    description: ""
                });
            }
            pushToast({
                title: pendingConfirmation
                    ? "Mobile Money still processing"
                    : paymentFlowPurpose === "savings_deposit"
                        ? "Savings payment initiated"
                        : paymentFlowPurpose === "membership_fee"
                            ? "Membership fee initiated"
                            : paymentFlowPurpose === "loan_repayment"
                                ? "Loan repayment initiated"
                            : "Payment initiated",
                message: pendingConfirmation
                    ? "Mobile Money did not respond in time, but the order is still being tracked. Keep the dialog open while callback confirmation arrives."
                    : paymentFlowPurpose === "savings_deposit"
                        ? "Approve the Mobile Money prompt on your phone. The savings deposit will post automatically after confirmation."
                        : paymentFlowPurpose === "membership_fee"
                            ? "Approve the Mobile Money prompt on your phone. The membership fee will post automatically after confirmation."
                            : paymentFlowPurpose === "loan_repayment"
                                ? "Approve the Mobile Money prompt on your phone. The repayment will post automatically into your loan after confirmation."
                        : "Approve the Mobile Money prompt on your phone. The contribution will post automatically after confirmation.",
                type: "success"
            });
        } catch (error) {
            pushToast({
                title: paymentFlowPurpose === "savings_deposit"
                    ? "Savings payment failed"
                    : paymentFlowPurpose === "membership_fee"
                        ? "Membership fee payment failed"
                        : paymentFlowPurpose === "loan_repayment"
                            ? "Loan repayment failed"
                        : "Payment initiation failed",
                message: getApiErrorMessage(
                    error,
                    paymentFlowPurpose === "savings_deposit"
                        ? "Unable to start the Mobile Money savings deposit."
                        : paymentFlowPurpose === "membership_fee"
                            ? "Unable to start the Mobile Money membership fee payment."
                            : paymentFlowPurpose === "loan_repayment"
                                ? "Unable to start the Mobile Money loan repayment."
                        : "Unable to start the Mobile Money contribution."
                ),
                type: "error"
            });
        } finally {
            setSubmittingContribution(false);
        }
    });

    useEffect(() => {
        const loadPortal = async () => {
            if (!profile) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            setWarning(null);

            try {
                try {
                    const { data: paymentControlsResponse } = await api.get<MemberPortalPaymentControlsResponse>(
                        endpoints.memberPortalSettings.paymentControls(),
                        {
                            params: { tenant_id: profile.tenant_id }
                        }
                    );
                    setMemberPortalPaymentControls(paymentControlsResponse.data || {
                        ...DEFAULT_MEMBER_PORTAL_PAYMENT_CONTROLS,
                        tenant_id: profile.tenant_id
                    });
                } catch {
                    setMemberPortalPaymentControls({
                        ...DEFAULT_MEMBER_PORTAL_PAYMENT_CONTROLS,
                        tenant_id: profile.tenant_id
                    });
                }

                try {
                    const { data: financialYearResponse } = await api.get<SaccoFinancialYearSettingsResponse>(
                        endpoints.saccoSettings.financialYear(),
                        {
                            params: { tenant_id: profile.tenant_id }
                        }
                    );
                    setFinancialYearSettings(financialYearResponse.data || {
                        ...DEFAULT_SACCO_FINANCIAL_YEAR_SETTINGS,
                        tenant_id: profile.tenant_id
                    });
                } catch {
                    setFinancialYearSettings({
                        ...DEFAULT_SACCO_FINANCIAL_YEAR_SETTINGS,
                        tenant_id: profile.tenant_id
                    });
                }

                try {
                    const { data: performanceTargetResponse } = await api.get<SaccoPerformanceTargetSettingsResponse>(
                        endpoints.saccoSettings.performanceTarget(),
                        {
                            params: { tenant_id: profile.tenant_id }
                        }
                    );
                    setPerformanceTargetSettings(normalizeSaccoPerformanceTargetSettings(performanceTargetResponse.data || {
                        ...DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS,
                        tenant_id: profile.tenant_id
                    }));
                } catch {
                    setPerformanceTargetSettings(normalizeSaccoPerformanceTargetSettings({
                        ...DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS,
                        tenant_id: profile.tenant_id
                    }));
                }

                try {
                    const { data: shareCapitalResponse } = await api.get<ShareCapitalSettingsResponse>(
                        endpoints.saccoSettings.shareCapital(),
                        {
                            params: { tenant_id: profile.tenant_id }
                        }
                    );
                    setShareRequirement(shareCapitalResponse.data?.member_requirement || null);
                } catch {
                    // Left null. Share capital then reads as it did before this
                    // existed, rather than the portal refusing to load over a
                    // settings read.
                    setShareRequirement(null);
                }

                let applicationData: MemberApplication | null = null;
                try {
                    const { data: applicationResponse } = await api.get<MemberApplicationResponse>(endpoints.memberApplications.me(), {
                        params: { tenant_id: profile.tenant_id }
                    });
                    applicationData = applicationResponse.data || null;
                } catch (applicationError) {
                    setMemberApplication(null);
                    setWarning(getApiErrorMessage(applicationError, "Unable to load your membership application."));
                }

                const { data: membersResponse } = await api.get<MembersResponse>(endpoints.members.list(), {
                    params: {
                        tenant_id: profile.tenant_id,
                        page: 1,
                        limit: 100,

                        include_total: false
                    }
                });
                const memberRecord =
                    (membersResponse.data || []).find((member: Member) => member.user_id === (user?.id || "")) ||
                    membersResponse.data?.[0];

                if (!memberRecord?.id) {
                    setMemberRecord(null);
                    setMemberId("");
                    setAccounts([]);
                    setLoans([]);
                    setLoanSchedules([]);
                    setLoanProducts([]);
                    setLoanApplications([]);
                    setGuarantorRequests([]);
                    setStatements([]);
                    setLoanTransactions([]);
                    setPaymentOrders([]);
                    setPaymentOrder(null);
                    setMemberApplication(applicationData);
                    return;
                }

                setMemberRecord(memberRecord);
                setMemberId(memberRecord.id);
                setMemberApplication(applicationData);

                const results = await Promise.allSettled([
                    api.get<MemberAccountsResponse>(endpoints.members.accounts(), {
                        params: {
                            tenant_id: profile.tenant_id,
                            page: 1,
                            limit: 100,
                            include_total: false
                        }
                    }),
                    api.get<LoansResponse>(endpoints.finance.loanPortfolio(), {
                        params: {
                            tenant_id: profile.tenant_id,
                            member_id: memberRecord.id,
                            page: 1,
                            limit: 100
                        }
                    }),
                    api.get<LoanSchedulesResponse>(endpoints.finance.loanSchedules(), {
                        params: {
                            tenant_id: profile.tenant_id,
                            page: 1,
                            limit: 100
                        }
                    }),
                    api.get<LoanProductsResponse>(endpoints.products.loans()),
                    api.get<LoanApplicationsResponse>(endpoints.loanApplications.list(), {
                        params: {
                            tenant_id: profile.tenant_id,
                            page: 1,
                            limit: 100
                        }
                    }),
                    api.get<GuarantorRequestsResponse>(endpoints.loanApplications.guarantorRequests(), {
                        params: {
                            tenant_id: profile.tenant_id,
                            page: 1,
                            limit: 100
                        }
                    }),
                    api.get<StatementsResponse>(endpoints.finance.statements(), {
                        params: { tenant_id: profile.tenant_id, member_id: memberRecord.id, page: 1, limit: 100 }
                    }),
                    api.get<LoanTransactionsResponse>(endpoints.finance.loanTransactions(), {
                        params: { tenant_id: profile.tenant_id, page: 1, limit: 100 }
                    }),
                    api.get<PaymentOrdersResponse>(endpoints.memberPayments.listOrders(), {
                        params: { tenant_id: profile.tenant_id, page: 1, limit: 100 }
                    })
                ]);

                const [accountsResult, loansResult, schedulesResult, productsResult, applicationsResult, guarantorRequestsResult, statementsResult, loanTransactionsResult, paymentOrdersResult] = results;
                const issues: string[] = [];

                if (accountsResult.status === "fulfilled") {
                    setAccounts(accountsResult.value.data.data || []);
                } else {
                    setAccounts([]);
                    issues.push(getApiErrorMessage(accountsResult.reason, "Accounts unavailable."));
                }

                if (loansResult.status === "fulfilled") {
                    setLoans(loansResult.value.data.data || []);
                } else {
                    setLoans([]);
                    issues.push(getApiErrorMessage(loansResult.reason, "Loans unavailable."));
                }

                if (schedulesResult.status === "fulfilled") {
                    setLoanSchedules(schedulesResult.value.data.data || []);
                } else {
                    setLoanSchedules([]);
                    issues.push(getApiErrorMessage(schedulesResult.reason, "Loan schedules unavailable."));
                }

                if (productsResult.status === "fulfilled") {
                    // Active products only. GET /products/loans filters on
                    // deleted_at but not on status, so inactive products came
                    // through and the picker offered them. Every downstream
                    // lookup requires status = 'active' — loan capacity 404s with
                    // LOAN_PRODUCT_NOT_FOUND and so does submission — so offering
                    // one is setting the member up to fail. Mobile already filters
                    // here for the same reason.
                    setLoanProducts((productsResult.value.data.data || []).filter((product) => product.status === "active"));
                } else {
                    setLoanProducts([]);
                    issues.push(getApiErrorMessage(productsResult.reason, "Loan products unavailable."));
                }

                if (applicationsResult.status === "fulfilled") {
                    setLoanApplications(applicationsResult.value.data.data || []);
                } else {
                    setLoanApplications([]);
                    issues.push(getApiErrorMessage(applicationsResult.reason, "Loan applications unavailable."));
                }

                if (guarantorRequestsResult.status === "fulfilled") {
                    setGuarantorRequests(guarantorRequestsResult.value.data.data || []);
                } else {
                    setGuarantorRequests([]);
                    issues.push(getApiErrorMessage(guarantorRequestsResult.reason, "Guarantor requests unavailable."));
                }

                if (statementsResult.status === "fulfilled") {
                    setStatements(statementsResult.value.data.data || []);
                } else {
                    setStatements([]);
                    issues.push(getApiErrorMessage(statementsResult.reason, "Transactions unavailable."));
                }

                if (loanTransactionsResult.status === "fulfilled") {
                    setLoanTransactions(loanTransactionsResult.value.data.data || []);
                } else {
                    setLoanTransactions([]);
                    issues.push(getApiErrorMessage(loanTransactionsResult.reason, "Loan transactions unavailable."));
                }

                if (paymentOrdersResult.status === "fulfilled" && paymentOrdersResult.value) {
                    const nextPaymentOrders = (paymentOrdersResult.value.data.data?.data || []).map((order) => normalizeContributionOrder(order));
                    setPaymentOrders(nextPaymentOrders);
                    setPaymentOrder((current) => {
                        if (current) {
                            return nextPaymentOrders.find((order) => order.id === current.id) || current;
                        }
                        return nextPaymentOrders[0] || null;
                    });
                } else if (paymentOrdersResult.status === "rejected") {
                    setPaymentOrders([]);
                    issues.push(getApiErrorMessage(paymentOrdersResult.reason, "Payment history unavailable."));
                }

                if (issues.length) {
                    setWarning(issues.join(" "));
                }
            } catch (portalError) {
                setMemberRecord(null);
                setMemberPortalPaymentControls({
                    ...DEFAULT_MEMBER_PORTAL_PAYMENT_CONTROLS,
                    tenant_id: profile.tenant_id
                });
                setError(getApiErrorMessage(portalError));
            } finally {
                setLoading(false);
            }
        };

        void loadPortal();
    }, [profile?.tenant_id, user?.id]);

    useEffect(() => {
        if (profile?.phone && !contributionPaymentForm.getValues("msisdn")) {
            contributionPaymentForm.setValue("msisdn", profile.phone);
        }
    }, [profile?.phone]);

    useEffect(() => {
        const canShowPaymentHistorySection = canUsePortalPayments || paymentOrders.length > 0;

        if ((!canShowPaymentHistorySection && activeSection === "member-payments") || activeSection === "member-contributions") {
            setActiveSection("member-overview");
        }

        if (!canUsePortalPayments && showContributionDialog) {
            setShowContributionDialog(false);
        }
    }, [activeSection, canUsePortalPayments, paymentOrders.length, showContributionDialog]);

    const savingsAccounts = useMemo(() => accounts.filter((account) => account.product_type === "savings"), [accounts]);
    const totalSavings = useMemo(
        () => savingsAccounts.reduce((sum, account) => sum + account.available_balance + account.locked_balance, 0),
        [savingsAccounts]
    );
    const availableSavings = useMemo(
        () => savingsAccounts.reduce((sum, account) => sum + account.available_balance, 0),
        [savingsAccounts]
    );
    const lockedSavings = useMemo(
        () => savingsAccounts.reduce((sum, account) => sum + account.locked_balance, 0),
        [savingsAccounts]
    );
    // One loan at a time: a member who already carries a loan applies for a
    // top-up, whose total is what they owe today plus the cash they want.
    const isTopUpApplication = Boolean(topUpQuote?.top_up_required);
    const topUpSettlement = Number(topUpQuote?.settlement_amount || 0);
    const topUpNewCash = Number(topUpNewCashInput.replace(/[^\d]/g, "")) || 0;

    useEffect(() => {
        if (!isTopUpApplication) {
            return;
        }

        const total = topUpSettlement + topUpNewCash;
        setRequestedAmountInput(formatWholeNumber(String(total)));
        loanApplicationForm.setValue("requested_amount", total, { shouldValidate: true, shouldDirty: true });
    }, [isTopUpApplication, topUpSettlement, topUpNewCash, loanApplicationForm]);

    // Board process: only the portion of the loan above the member's own savings
    // needs guaranteed amounts; a fully self-covered loan takes nominal guarantors.
    const requiredGuaranteeAmount = useMemo(
        () => Math.max(0, Math.round(((Number(requestedLoanAmount) || 0) - totalSavings) * 100) / 100),
        [requestedLoanAmount, totalSavings]
    );
    const allocatedGuaranteeAmount = useMemo(
        () => Math.round(guarantorDrafts.reduce((sum, row) => sum + (Number(row.guaranteed_amount) || 0), 0) * 100) / 100,
        [guarantorDrafts]
    );
    const remainingGuaranteeAmount = Math.max(0, Math.round((requiredGuaranteeAmount - allocatedGuaranteeAmount) * 100) / 100);
    // When the "Manage Guarantors" dialog is open, coverage is measured against
    // THAT application's required amount instead of the apply-form draft.
    const activeRequiredGuarantee = manageGuarantorsTarget
        ? Math.max(0, Math.round(Number(
            manageGuarantorsTarget.required_guarantee_amount
            ?? (manageGuarantorsTarget.requested_amount - totalSavings)
        ) * 100) / 100)
        : requiredGuaranteeAmount;
    const activeRemainingGuarantee = Math.max(0, Math.round((activeRequiredGuarantee - allocatedGuaranteeAmount) * 100) / 100);
    // Share capital has always been collected into savings; no member's share
    // account has ever been credited, which is why this was hardcoded to zero
    // and every screen quoting it showed "TSh 0".
    //
    // What a member holds is what the SACCOS required of them at the price in
    // force when they joined. The share *account* balance is still zero and is
    // shown as such on the accounts list — this is the holding, not the
    // account, and the portal says where the money actually sits.
    // What the share account itself actually holds. Zero for every ILBORU
    // member, and the figure the accounts list shows, because the money was
    // never posted here.
    const shareAccountCapital = accounts
        .filter((account) => account.product_type === "shares")
        .reduce((sum, account) => sum + Number(account.available_balance || 0) + Number(account.locked_balance || 0), 0);
    const shareCapitalHeldInSavings = shareRequirement?.total_required ?? 0;
    const totalShareCapital = Math.max(shareAccountCapital, shareCapitalHeldInSavings);
    // Says where the money is and what it was priced at. Members who joined
    // before the rise see a smaller figure than the SACCOS now charges, and
    // without this that reads as their account being wrong.
    // The "still in savings" sentence is true only until the money is actually
    // moved across. Once the share account holds it, saying so would be plainly
    // wrong to a member looking at a share balance that is no longer zero.
    const shareCapitalStillInSavings = shareCapitalHeldInSavings > shareAccountCapital;
    const shareCapitalNote = shareRequirement
        ? `${shareRequirement.required_shares} ${tr("shares at", "hisa kwa")} ${formatCurrency(shareRequirement.price_per_share)}`
            + `${shareRequirement.is_historic_price
                ? tr(" — the price when you joined", " — bei ya ulipojiunga")
                : ""}`
            + (shareCapitalStillInSavings
                ? tr(
                    ". Held inside your savings, not yet moved to your share account.",
                    ". Zipo ndani ya akiba yako, hazijahamishiwa kwenye akaunti yako ya hisa."
                )
                : ".")
        : undefined;
    const performanceTargetPosition = useMemo(
        () => calculateMemberPerformanceTarget(memberRecord, accounts, performanceTargetSettings),
        [accounts, memberRecord, performanceTargetSettings]
    );
    const annualSavingsTarget = performanceTargetPosition.annualTargetAmount;
    const savingsTargetProgress = performanceTargetPosition.reachPercent;
    const savingsTargetRemaining = performanceTargetPosition.remainingToTargetAmount;
    const savingsTargetNextRequired = performanceTargetPosition.nextRequiredAmount;
    const savingsTargetLevel = {
        label: performanceTargetPosition.statusLabel,
        tone: performanceTargetPosition.statusTone
    };
    const shareAccounts = useMemo(() => [], []);
    const portalRepaymentLoans = useMemo(
        () => loans.filter((loan) => ["active", "in_arrears"].includes(loan.status) && (loan.outstanding_principal + loan.accrued_interest) > 0),
        [loans]
    );
    const canShowLoanRepaymentOption = loanRepaymentSelfServiceEnabled && portalRepaymentLoans.length > 0;
    const paymentTargetAccounts = paymentFlowPurpose === "loan_repayment"
            ? []
            : savingsAccounts;
    const paymentAccountOptions = useMemo(
        () =>
            paymentTargetAccounts.map((account) => ({
                value: account.id,
                label: account.account_name || account.account_number,
                secondary: `${account.account_number} · Balance ${formatCurrency(account.available_balance + account.locked_balance)}`
            })),
        [paymentTargetAccounts]
    );
    const watchedContributionAmount = contributionPaymentForm.watch("amount");
    const selectedContributionAccountId = contributionPaymentForm.watch("account_id");
    const selectedContributionAccount = useMemo(
        () => paymentTargetAccounts.find((account) => account.id === selectedContributionAccountId) || paymentTargetAccounts[0] || null,
        [paymentTargetAccounts, selectedContributionAccountId]
    );
    const selectedRepaymentLoanId = contributionPaymentForm.watch("loan_id");
    const selectedRepaymentLoan = useMemo(
        () => portalRepaymentLoans.find((loan) => loan.id === selectedRepaymentLoanId) || portalRepaymentLoans[0] || null,
        [portalRepaymentLoans, selectedRepaymentLoanId]
    );
    const selectedRepaymentSchedules = useMemo(
        () => loanSchedules.filter((schedule) => schedule.loan_id === selectedRepaymentLoan?.id && schedule.status !== "paid"),
        [loanSchedules, selectedRepaymentLoan?.id]
    );
    const repaymentInsights = useMemo(
        () => buildRepaymentInsights(selectedRepaymentLoan, selectedRepaymentSchedules, watchedContributionAmount),
        [selectedRepaymentLoan, selectedRepaymentSchedules, watchedContributionAmount]
    );
    const repaymentLoanOptions = useMemo(
        () =>
            portalRepaymentLoans.map((loan) => ({
                value: loan.id,
                label: loan.loan_number,
                secondary: `${formatCurrency(loan.outstanding_principal + loan.accrued_interest)} outstanding`
            })),
        [portalRepaymentLoans]
    );
    const selectedContributionProvider = contributionProviderOptions.find(
        (option) => option.value === contributionPaymentForm.watch("provider")
    ) || contributionProviderOptions[0];

    useEffect(() => {
        if (!canShowMembershipFeePaymentOption && paymentFlowPurpose === "membership_fee") {
            setPaymentFlowPurpose(savingsDepositSelfServiceEnabled ? "savings_deposit" : loanRepaymentSelfServiceEnabled ? "loan_repayment" : "savings_deposit");
            setActiveContributionOrderId(null);
        }
    }, [canShowMembershipFeePaymentOption, loanRepaymentSelfServiceEnabled, paymentFlowPurpose, savingsDepositSelfServiceEnabled]);

    useEffect(() => {
        if (!shareContributionSelfServiceEnabled && paymentFlowPurpose === "share_contribution") {
            setPaymentFlowPurpose(savingsDepositSelfServiceEnabled ? "savings_deposit" : canShowMembershipFeePaymentOption ? "membership_fee" : loanRepaymentSelfServiceEnabled ? "loan_repayment" : "savings_deposit");
            setActiveContributionOrderId(null);
        }
    }, [canShowMembershipFeePaymentOption, loanRepaymentSelfServiceEnabled, paymentFlowPurpose, savingsDepositSelfServiceEnabled, shareContributionSelfServiceEnabled]);

    useEffect(() => {
        if (!savingsDepositSelfServiceEnabled && paymentFlowPurpose === "savings_deposit") {
            setPaymentFlowPurpose(canShowMembershipFeePaymentOption ? "membership_fee" : loanRepaymentSelfServiceEnabled ? "loan_repayment" : "savings_deposit");
            setActiveContributionOrderId(null);
        }
    }, [canShowMembershipFeePaymentOption, loanRepaymentSelfServiceEnabled, paymentFlowPurpose, savingsDepositSelfServiceEnabled, shareContributionSelfServiceEnabled]);

    useEffect(() => {
        if (!canShowLoanRepaymentOption && paymentFlowPurpose === "loan_repayment") {
            setPaymentFlowPurpose(savingsDepositSelfServiceEnabled ? "savings_deposit" : canShowMembershipFeePaymentOption ? "membership_fee" : "savings_deposit");
            setActiveContributionOrderId(null);
        }
    }, [canShowLoanRepaymentOption, canShowMembershipFeePaymentOption, paymentFlowPurpose, savingsDepositSelfServiceEnabled, shareContributionSelfServiceEnabled]);

    useEffect(() => {
        if (contributionFlowState || paymentFlowPurpose === "loan_repayment") {
            return;
        }

        const currentAccountId = contributionPaymentForm.getValues("account_id");
        const hasCurrentAccount = paymentTargetAccounts.some((account) => account.id === currentAccountId);

        if (hasCurrentAccount) {
            return;
        }

        contributionPaymentForm.setValue("account_id", paymentTargetAccounts[0]?.id || "", { shouldValidate: true });
    }, [contributionFlowState, contributionPaymentForm, paymentFlowPurpose, paymentTargetAccounts]);
    useEffect(() => {
        if (contributionFlowState || paymentFlowPurpose !== "loan_repayment") {
            return;
        }

        const currentLoanId = contributionPaymentForm.getValues("loan_id");
        const hasCurrentLoan = portalRepaymentLoans.some((loan) => loan.id === currentLoanId);

        if (hasCurrentLoan) {
            return;
        }

        contributionPaymentForm.setValue("loan_id", portalRepaymentLoans[0]?.id || "", { shouldValidate: true });
    }, [contributionFlowState, contributionPaymentForm, paymentFlowPurpose, portalRepaymentLoans]);
    const filteredPaymentOrders = useMemo(
        () =>
            normalizedPaymentOrders.filter((order) => {
                if (paymentStatusFilter !== "all" && order.status !== paymentStatusFilter) {
                    return false;
                }

                if (paymentPurposeFilter !== "all" && order.purpose !== paymentPurposeFilter) {
                    return false;
                }

                return true;
            }),
        [normalizedPaymentOrders, paymentPurposeFilter, paymentStatusFilter]
    );
    const paginatedPaymentOrders = useMemo(
        () => filteredPaymentOrders.slice(paymentsPage * paymentsRowsPerPage, paymentsPage * paymentsRowsPerPage + paymentsRowsPerPage),
        [filteredPaymentOrders, paymentsPage, paymentsRowsPerPage]
    );
    const successfulPaymentCount = useMemo(
        () => normalizedPaymentOrders.filter((order) => order.status === "posted").length,
        [normalizedPaymentOrders]
    );
    const pendingPaymentCount = useMemo(
        () => normalizedPaymentOrders.filter((order) => ["pending", "paid"].includes(order.status)).length,
        [normalizedPaymentOrders]
    );
    const failedPaymentCount = useMemo(
        () => normalizedPaymentOrders.filter((order) => ["failed", "expired"].includes(order.status)).length,
        [normalizedPaymentOrders]
    );
    const totalMobileMoneyAmount = useMemo(
        () => normalizedPaymentOrders.reduce((sum, order) => sum + order.amount, 0),
        [normalizedPaymentOrders]
    );
    const totalDividends = useMemo(
        () =>
            statements
                .filter((statement) => statement.transaction_type === "dividend_allocation")
                // Reversals post as direction "out" — net them so a reversed
                // distribution contributes zero instead of doubling.
                .reduce((sum, statement) => sum + (statement.direction === "out" ? -statement.amount : statement.amount), 0),
        [statements]
    );
    const contributionHistory = useMemo(
        () => statements.filter((statement) => ["share_contribution", "dividend_allocation"].includes(statement.transaction_type)),
        [statements]
    );
    const totalOutstandingLoans = useMemo(
        () => loans.reduce((sum, loan) => sum + loan.outstanding_principal + loan.accrued_interest, 0),
        [loans]
    );
    // SACCO collection account, shown to every member for deposits.
    const saccoBankAccount = useMemo(
        () => (memberPortalPaymentControls.bank_account_number
            ? {
                accountName: memberPortalPaymentControls.bank_account_name,
                bankName: memberPortalPaymentControls.bank_name,
                bankBranch: memberPortalPaymentControls.bank_branch,
                accountNumber: memberPortalPaymentControls.bank_account_number,
                swiftCode: memberPortalPaymentControls.bank_swift_code,
                instructions: memberPortalPaymentControls.bank_instructions
            }
            : null),
        [memberPortalPaymentControls]
    );
    // Savings × the product multiplier, already net of savings pledged as
    // guarantees for other members.
    const dashboardSavingsBasedLimit = useMemo(
        () => Math.max(0, Number(dashboardLoanCapacity?.contribution_limit || 0)),
        [dashboardLoanCapacity]
    );
    // borrow_limit is ALREADY net of what is currently borrowed (the backend
    // subtracts exposure inside contribution_headroom) — never subtract it a
    // second time here.
    const dashboardMaximumBorrowable = useMemo(
        () => Math.max(0, Number(dashboardLoanCapacity?.borrow_limit || 0)),
        [dashboardLoanCapacity]
    );
    const dashboardCurrentLoanExposure = useMemo(
        () => Math.max(0, Number(dashboardLoanCapacity?.current_loan_exposure || totalOutstandingLoans || 0)),
        [dashboardLoanCapacity, totalOutstandingLoans]
    );
    const dashboardGuarantorExposure = useMemo(
        () => Math.max(0, Number(dashboardLoanCapacity?.guarantor_exposure || 0)),
        [dashboardLoanCapacity]
    );
    const dashboardLiquidityStatus = useMemo(() => {
        if (!dashboardLoanCapacity) {
            return null;
        }

        if (dashboardLoanCapacity.loan_pool_frozen) {
            return "Frozen";
        }

        const totalDeposits = Number(dashboardLoanCapacity.total_deposits || 0);
        const liquidityRatio = totalDeposits > 0
            ? Number(dashboardLoanCapacity.available_for_loans || 0) / totalDeposits
            : 0;

        if (liquidityRatio > 0.4) {
            return "Healthy";
        }

        if (liquidityRatio >= 0.2) {
            return "Warning";
        }

        return "Risk";
    }, [dashboardLoanCapacity]);
    const hasNoVisibleFinancialData = accounts.length === 0 && loans.length === 0 && statements.length === 0;
    const activeLoanIds = useMemo(
        () => loans.filter((loan) => ["active", "in_arrears"].includes(loan.status)).map((loan) => loan.id),
        [loans]
    );
    const nextLoanInstallment = useMemo(() => {
        if (!activeLoanIds.length) {
            return null;
        }

        const pending = loanSchedules
            .filter((schedule) => activeLoanIds.includes(schedule.loan_id) && schedule.status !== "paid")
            .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

        return pending[0] || null;
    }, [loanSchedules, activeLoanIds]);
    // Ledger-aware: if the earliest unpaid schedule row is past due but the
    // loan is actually on/ahead of contract (stale rebuilt row), roll the due
    // date forward to the next contractual period end.
    const nextPaymentDue = useMemo(() => {
        if (!nextLoanInstallment) {
            return null;
        }
        const loan = loans.find((entry) => entry.id === nextLoanInstallment.loan_id);
        const today = new Date().toISOString().slice(0, 10);
        if (loan && nextLoanInstallment.due_date < today && computeLoanOverdueBalance(loan) <= 0) {
            const rolled = nextContractualDueDate(loan);
            if (rolled) {
                return rolled.toISOString().slice(0, 10);
            }
        }
        return nextLoanInstallment.due_date;
    }, [nextLoanInstallment, loans]);
    const daysUntilDue = useMemo(() => getDaysUntil(nextPaymentDue), [nextPaymentDue]);
    const activeLoanCount = useMemo(() => loans.filter((loan) => ["active", "in_arrears"].includes(loan.status)).length, [loans]);
    const pendingLoanApplications = useMemo(
        () => loanApplications.filter((application) => !["rejected", "cancelled", "disbursed"].includes(application.status)),
        [loanApplications]
    );
    const pendingGuarantorRequests = useMemo(
        () => guarantorRequests.filter((request) => request.consent_status === "pending"),
        [guarantorRequests]
    );
    const leagueEnabled = Boolean(leaguePosition?.league_enabled && leaguePosition.tier);
    const { lang: portalLang } = useLanguage();
    const [payAccountCopied, setPayAccountCopied] = useState(false);

    const copyPayAccountNumber = useCallback(async () => {
        const accountNumber = saccoBankAccount?.accountNumber;
        if (!accountNumber) {
            return;
        }
        try {
            await navigator.clipboard.writeText(accountNumber);
            setPayAccountCopied(true);
            window.setTimeout(() => setPayAccountCopied(false), 1600);
        } catch {
            // Clipboard unavailable: the number is on screen to copy by hand.
        }
    }, [saccoBankAccount?.accountNumber]);

    // The single action the overview leads with. Derived from this month's
    // savings commitment, falling back to the annual target when no monthly
    // commitment is configured.
    const overviewNextStep = useMemo(() => {
        if (monthlyCommitment.state === "loading" || monthlyCommitment.state === "error") {
            return null;
        }

        if (monthlyCommitment.state === "due" && monthlyCommitment.remaining > 0) {
            return {
                title: `Contribute ${formatCurrency(monthlyCommitment.remaining)} this month`,
                note: `This clears your ${monthlyCommitment.monthLabel} commitment and keeps you on pace for ${formatCurrency(annualSavingsTarget)}.`,
                primaryLabel: "Make a contribution",
                onPrimary: canUsePortalDeposits ? () => openDepositDialog("savings_deposit") : undefined,
                primaryDisabled: !canUsePortalDeposits
            };
        }

        if (monthlyCommitment.state === "met") {
            return {
                title: `${monthlyCommitment.monthLabel} commitment paid in full`,
                note: savingsTargetRemaining > 0
                    ? `${formatCurrency(savingsTargetRemaining)} still to go before you reach ${formatCurrency(annualSavingsTarget)}.`
                    : "You have reached your annual savings target.",
                primaryLabel: "Make a contribution",
                onPrimary: canUsePortalDeposits ? () => openDepositDialog("savings_deposit") : undefined,
                primaryDisabled: !canUsePortalDeposits
            };
        }

        if (savingsTargetNextRequired > 0) {
            return {
                title: `Contribute ${formatCurrency(savingsTargetNextRequired)} this month`,
                note: `This keeps you on pace for ${formatCurrency(annualSavingsTarget)} by the end of the savings year.`,
                primaryLabel: "Make a contribution",
                onPrimary: canUsePortalDeposits ? () => openDepositDialog("savings_deposit") : undefined,
                primaryDisabled: !canUsePortalDeposits
            };
        }

        return null;
    }, [
        annualSavingsTarget,
        canUsePortalDeposits,
        monthlyCommitment,
        openDepositDialog,
        savingsTargetNextRequired,
        savingsTargetRemaining
    ]);
    const visiblePortalSections = useMemo(
        () => portalSections.filter((section) => {
            if (section.id === "member-contributions") {
                return false;
            }

            // The league is a per-tenant feature flag; hide the nav entry when
            // the SACCO has not switched it on.
            if (section.id === "member-league") {
                return leagueEnabled;
            }

            return (canUsePortalPayments || paymentOrders.length > 0) || section.id !== "member-payments";
        }),
        [canUsePortalPayments, leagueEnabled, paymentOrders.length]
    );
    const financialYearPeriod = useMemo(() => resolveFinancialYearPeriod(financialYearSettings), [financialYearSettings]);
    const transactionCount = statements.length;
    const balanceTrend = groupBalances(statements);
    const monthlySavingsTrend = useMemo(() => groupSavingsByMonth(statements), [statements]);
    const savingsTrendSeries = useMemo(
        () =>
            statements
                .map((entry) => ({
                    date: new Date(entry.created_at || entry.transaction_date).getTime(),
                    balance: Number(entry.running_balance)
                }))
                .filter((point) => Number.isFinite(point.date) && Number.isFinite(point.balance)),
        [statements]
    );
    const currentView = visiblePortalSections.find((section) => section.id === activeSection) || visiblePortalSections[0];
    // Overview greets the member by name; every other section uses its own label.
    const portalPageTitle = activeSection === "member-overview"
        ? `${portalLang === "SW" ? "Habari" : "Hi"}, ${(profile?.full_name || "Member").split(" ")[0]}`
        : (portalLang === "SW" && currentView?.labelSw ? currentView.labelSw : currentView?.label) || "Overview";
    const portalPageSubtitle = activeSection === "member-overview"
        ? [memberRecord?.member_no ? `Member No. ${memberRecord.member_no}` : null, "Ilboru Alumni SACCOS Ltd"]
            .filter(Boolean)
            .join(" · ")
        : (portalLang === "SW" && currentView?.subtitleSw ? currentView.subtitleSw : currentView?.subtitle) || "";
    // Savings plus share capital: what the member actually holds in the SACCOS.
    //
    // This was savings alone, which was right while share capital sat inside
    // savings. Moving it to share accounts left every member's portal showing
    // 1,000,000 less than they hold — 3,000,000 for a new member — and dragged
    // net position and the loan-cover donut down with it, for a posting that
    // took nothing from anyone.
    const totalHoldings = totalSavings + totalShareCapital;
    const totalVisibleCapital = totalHoldings;
    const netPosition = totalVisibleCapital - totalOutstandingLoans;
    // Ledger-aware: the DB flag can be stale on rebuilt loans (residual parked
    // on a past-due schedule row); only alert when the member is genuinely
    // behind the contractual schedule.
    const hasOverdueLoan = useMemo(
        () => loans.some((loan) => loan.status === "in_arrears" && computeLoanOverdueBalance(loan) > 0),
        [loans]
    );
    const chartLabels = balanceTrend.map((entry) => entry.label);
    const chartValues = balanceTrend.map((entry) => entry.balance);
    const savingsTrendLabels = monthlySavingsTrend.map((entry) => entry.label);
    const savingsTrendValues = monthlySavingsTrend.map((entry) => entry.balance);
    // Cap the schedule row's pending at the contractual annuity — rebuilt rows
    // can carry the whole remaining balance and read as one giant installment.
    const monthlyInstallment = useMemo(() => {
        if (!nextLoanInstallment) {
            return 0;
        }
        const pending = Math.max(
            nextLoanInstallment.principal_due +
            nextLoanInstallment.interest_due -
            nextLoanInstallment.principal_paid -
            nextLoanInstallment.interest_paid,
            0
        );
        const loan = loans.find((entry) => entry.id === nextLoanInstallment.loan_id);
        if (!loan) {
            return pending;
        }
        const contractual = contractualInstallment(loan);
        return contractual > 0 ? Math.min(pending, Math.round(contractual)) : pending;
    }, [nextLoanInstallment, loans]);
    const totalOriginalLoanAmount = useMemo(() => loans.reduce((sum, loan) => sum + loan.principal_amount, 0), [loans]);
    const loanProgressPercent = totalOriginalLoanAmount > 0 ? ((totalOriginalLoanAmount - totalOutstandingLoans) / totalOriginalLoanAmount) * 100 : 0;
    const lastContribution = useMemo(
        () => statements.find((statement) => ["share_contribution", "dividend_allocation"].includes(statement.transaction_type)) || null,
        [statements]
    );
    const lastLoanPayment = useMemo(
        () => statements.find((statement) => ["loan_repayment", "loan_repay"].includes(statement.transaction_type)) || null,
        [statements]
    );
    const standing = useMemo(() => {
        if (hasOverdueLoan) {
            return {
                label: tr("Overdue", "Umechelewa"),
                tone: "danger" as const,
                details: tr(
                    "One or more installments are overdue. Please settle immediately.",
                    "Angalau malipo moja yamechelewa. Tafadhali lipa mara moja."
                )
            };
        }

        if (activeLoanCount > 0 && daysUntilDue !== null) {
            return {
                label: `${tr("Installment due in", "Malipo yanaisha baada ya")} ${Math.max(daysUntilDue, 0)} ${tr(
                    Math.abs(daysUntilDue) === 1 ? "day" : "days",
                    Math.abs(daysUntilDue) === 1 ? "siku" : "siku"
                )}`,
                tone: daysUntilDue <= 3 ? ("warning" as const) : ("neutral" as const),
                details: tr(
                    "Keep your repayment schedule current to maintain good standing.",
                    "Endelea kulipa kwa wakati ili uendelee kuwa na rekodi nzuri."
                )
            };
        }

        if (activeLoanCount === 0) {
            return {
                label: tr("No active loans", "Huna mkopo unaoendelea"),
                tone: "neutral" as const,
                details: tr(
                    "Your account currently has no active loan obligations.",
                    "Kwa sasa huna deni lolote la mkopo."
                ),
                showChip: false
            };
        }

        return {
            label: tr("In good standing", "Upo vizuri"),
            tone: "success" as const,
            details: tr("All visible obligations are current.", "Madeni yote yanayoonekana yapo sawa.")
        };
    }, [activeLoanCount, daysUntilDue, hasOverdueLoan, tr]);
    const memberAlerts = useMemo<MemberAlertItem[]>(() => {
        const alerts: MemberAlertItem[] = [];

        if (hasOverdueLoan) {
            alerts.push({
                id: "overdue-loan",
                severity: "error",
                title: tr("Overdue installment", "Malipo yaliyochelewa"),
                message: tr(
                    "An overdue loan installment was detected. Pay the due amount to avoid further penalties.",
                    "Kuna malipo ya mkopo yaliyochelewa. Lipa kiasi kinachodaiwa ili kuepuka adhabu zaidi."
                )
            });
        } else if (activeLoanCount > 0 && daysUntilDue !== null && daysUntilDue <= 7) {
            alerts.push({
                id: "installment-due",
                severity: "warning",
                title: tr("Installment due soon", "Malipo yanakaribia"),
                message: `${tr("Your next installment is due in", "Malipo yako yajayo yanaisha baada ya")} ${Math.max(daysUntilDue, 0)} ${tr("day(s).", "siku.")}`
            });
        }

        if (lastContribution?.transaction_type === "dividend_allocation") {
            alerts.push({
                id: "dividend-posted",
                severity: "info",
                title: tr("Dividend posted", "Gawio limewekwa"),
                message: `Dividend allocation of ${formatCurrency(lastContribution.amount)} was posted to your account.`
            });
        }

        return alerts;
    }, [activeLoanCount, daysUntilDue, hasOverdueLoan, lastContribution, tr]);

    const sortedStatements = useMemo(
        () =>
            statements
                .slice()
                .sort((left, right) => new Date(right.created_at || right.transaction_date).getTime() - new Date(left.created_at || left.transaction_date).getTime()),
        [statements]
    );
    const filteredTransactions = useMemo(() => {
        const normalizedSearch = transactionSearch.trim().toLowerCase();

        return sortedStatements.filter((row) => {
            if (!isWithinDateRange(row.created_at || row.transaction_date, transactionsRange)) {
                return false;
            }

            if (transactionTypeFilter !== "all") {
                if (transactionTypeFilter === "loan" && !row.transaction_type.includes("loan")) {
                    return false;
                }
                if (transactionTypeFilter === "deposit" && row.transaction_type !== "deposit") {
                    return false;
                }
                if (transactionTypeFilter === "withdrawal" && row.transaction_type !== "withdrawal") {
                    return false;
                }
                if (transactionTypeFilter === "contribution" && row.transaction_type !== "share_contribution") {
                    return false;
                }
                if (transactionTypeFilter === "dividend" && row.transaction_type !== "dividend_allocation") {
                    return false;
                }
            }

            if (normalizedSearch) {
                const reference = getAuditReference(row).toLowerCase();
                return reference.includes(normalizedSearch);
            }

            return true;
        });
    }, [sortedStatements, transactionSearch, transactionTypeFilter, transactionsRange]);
    const runningBalanceMismatches = useMemo(() => {
        // Ledger-health check. Runs on the full transaction set (NOT the filtered view) so
        // hiding rows with a filter never breaks the chain and raises phantom mismatches.
        const TOLERANCE = 1;
        const signedOf = (row: StatementRow) => (row.direction === "in" ? row.amount : -row.amount);
        const timestampOf = (row: StatementRow) => new Date(row.created_at || row.transaction_date).getTime();

        const grouped = new Map<string, StatementRow[]>();
        statements.forEach((row) => {
            const key = row.account_id || "global";
            const list = grouped.get(key) || [];
            list.push(row);
            grouped.set(key, list);
        });

        let mismatches = 0;

        grouped.forEach((rows) => {
            const ordered = rows.slice().sort((left, right) => timestampOf(left) - timestampOf(right));

            // Bucket rows that share the same timestamp. The stored ledger ordered same-instant
            // rows by an internal sequence we can't see here, so we validate each bucket by
            // reconstructing a consistent chain rather than trusting display order.
            const ticks: StatementRow[][] = [];
            let currentKey: number | null = null;
            ordered.forEach((row) => {
                const ts = timestampOf(row);
                if (currentKey === null || ts !== currentKey) {
                    ticks.push([row]);
                    currentKey = ts;
                } else {
                    ticks[ticks.length - 1].push(row);
                }
            });

            let previousBalance: number | null = null;

            ticks.forEach((tick) => {
                let entry: number;
                if (previousBalance !== null) {
                    entry = previousBalance;
                } else {
                    // First tick of the account: opening balance is whichever row is not
                    // preceded by another row in the same instant.
                    const opener = tick.find((candidate) => {
                        const candidateEntry = candidate.running_balance - signedOf(candidate);
                        return !tick.some(
                            (other) => other !== candidate
                                && Math.abs(other.running_balance - candidateEntry) <= TOLERANCE
                        );
                    }) || tick[0];
                    entry = opener.running_balance - signedOf(opener);
                }

                // Greedily rebuild the chain: repeatedly consume the row whose stored balance
                // equals current + its signed amount. Order-independent within the instant.
                let current = entry;
                const remaining = tick.slice();
                while (remaining.length) {
                    const index = remaining.findIndex(
                        (row) => Math.abs(row.running_balance - (current + signedOf(row))) <= TOLERANCE
                    );
                    if (index === -1) {
                        // No row fits — a genuine break in the ledger.
                        mismatches += remaining.length;
                        current = Number(
                            (current + remaining.reduce((sum, row) => sum + signedOf(row), 0)).toFixed(2)
                        );
                        break;
                    }
                    current = remaining[index].running_balance;
                    remaining.splice(index, 1);
                }

                previousBalance = current;
            });
        });

        return mismatches;
    }, [statements]);

    const filteredContributions = useMemo(
        () => contributionHistory.filter((row) => isWithinDateRange(row.created_at || row.transaction_date, contributionsRange)),
        [contributionHistory, contributionsRange]
    );
    const saccoYearContributions = useMemo(
        () =>
            contributionHistory.filter((row) =>
                isWithinDateRange(row.transaction_date || row.created_at, {
                    preset: "custom",
                    from: financialYearPeriod.startIso,
                    to: financialYearPeriod.endIso
                })
            ),
        [contributionHistory, financialYearPeriod.endIso, financialYearPeriod.startIso]
    );
    const saccoYearContributionRows = useMemo(
        () =>
            saccoYearContributions
                .filter((row) => row.transaction_type === "share_contribution")
                .sort((left, right) => new Date(right.transaction_date || right.created_at).getTime() - new Date(left.transaction_date || left.created_at).getTime()),
        [saccoYearContributions]
    );
    const saccoYearDividendRows = useMemo(
        () => saccoYearContributions.filter((row) => row.transaction_type === "dividend_allocation"),
        [saccoYearContributions]
    );
    const contributionActual = useMemo(
        () => saccoYearContributionRows.reduce((sum, row) => sum + row.amount, 0),
        [saccoYearContributionRows]
    );
    const contributionEntriesCount = filteredContributions.filter((row) => row.transaction_type === "share_contribution").length;
    const dividendEntriesCount = filteredContributions.reduce(
        (count, row) => (row.transaction_type === "dividend_allocation" ? count + (row.direction === "out" ? -1 : 1) : count),
        0
    );
    const contributionBaselineMonthly = DEFAULT_MEMBER_MONTHLY_CONTRIBUTION_AMOUNT;
    const targetActualAmount = performanceTargetPosition.actualFormAmount;
    const contributionExpected = performanceTargetPosition.annualTargetAmount;
    const contributionComplianceRatio = performanceTargetPosition.reachPercent;
    const contributionComplianceStatus = performanceTargetPosition.statusLabel;
    const dividendHistoryByYear = useMemo(() => {
        const grouped = new Map<string, number>();
        filteredContributions
            .filter((row) => row.transaction_type === "dividend_allocation")
            .forEach((row) => {
                const year = new Date(row.transaction_date).getFullYear().toString();
                const signed = row.direction === "out" ? -row.amount : row.amount;
                grouped.set(year, (grouped.get(year) || 0) + signed);
            });

        return Array.from(grouped.entries())
            .sort(([left], [right]) => right.localeCompare(left))
            .map(([year, amount]) => ({ year, amount }));
    }, [filteredContributions]);
    // Deliberately the share ACCOUNT balance, not the holding shown elsewhere.
    //
    // This divides dividends by share capital. While the account read zero the
    // rate was always 0.00%; switching it to the holding would have produced a
    // real-looking figure computed from the wrong base, because ILBORU's
    // dividends are allocated on savings, not on shares. A member told their
    // "effective dividend rate" is 200% would be worse served than one told
    // 0.00%. Left as it was until the board says what base it should use.
    const effectiveDividendRate = useMemo(
        () => (shareAccountCapital > 0 ? (totalDividends / shareAccountCapital) * 100 : 0),
        [totalDividends, shareAccountCapital]
    );
    const nextContributionDue = useMemo(() => {
        const latest = saccoYearContributionRows[0] || null;
        if (!latest) {
            return financialYearPeriod.startDate.toISOString();
        }
        const due = new Date(latest.transaction_date);
        due.setMonth(due.getMonth() + 1);

        if (due.getTime() > financialYearPeriod.endDate.getTime()) {
            return null;
        }

        return due.toISOString();
    }, [financialYearPeriod.endDate, financialYearPeriod.startDate, saccoYearContributionRows]);
    const contributionScheduleStatus = useMemo(() => {
        if (!nextContributionDue) {
            return "No schedule";
        }

        const days = getDaysUntil(nextContributionDue);
        if (days === null) {
            return "No schedule";
        }
        if (days < 0) {
            return "Overdue";
        }
        if (days <= 5) {
            return "Due soon";
        }

        return "Scheduled";
    }, [nextContributionDue]);
    const contributionRunningTotal = useMemo(
        () => filteredContributions.reduce((sum, row) => sum + row.amount, 0),
        [filteredContributions]
    );
    const paginatedContributions = useMemo(
        () =>
            filteredContributions.slice(
                contributionsPage * contributionsRowsPerPage,
                contributionsPage * contributionsRowsPerPage + contributionsRowsPerPage
            ),
        [contributionsPage, contributionsRowsPerPage, filteredContributions]
    );
    const contributionMonthlyTrend = useMemo(() => {
        const grouped = new Map<string, { label: string; contribution: number; dividend: number; sortOrder: number }>();

        filteredContributions.forEach((row) => {
            const sourceDate = row.created_at || row.transaction_date;
            const date = new Date(sourceDate);
            if (Number.isNaN(date.getTime())) {
                return;
            }

            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            const existing = grouped.get(key) || {
                label: new Intl.DateTimeFormat("en-TZ", { month: "short", year: "2-digit" }).format(date),
                contribution: 0,
                dividend: 0,
                sortOrder: new Date(date.getFullYear(), date.getMonth(), 1).getTime()
            };

            if (row.transaction_type === "share_contribution") {
                existing.contribution += row.amount;
            }

            if (row.transaction_type === "dividend_allocation") {
                existing.dividend += row.direction === "out" ? -row.amount : row.amount;
            }

            grouped.set(key, existing);
        });

        return Array.from(grouped.values())
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .slice(-8);
    }, [filteredContributions]);
    const contributionTrendLabels = contributionMonthlyTrend.map((point) => point.label);
    const contributionTrendContributions = contributionMonthlyTrend.map((point) => point.contribution);
    const contributionTrendDividends = contributionMonthlyTrend.map((point) => point.dividend);

    const filteredAccounts = useMemo(
        () => accounts.filter((account) => isWithinDateRange(account.created_at, accountsRange)),
        [accounts, accountsRange]
    );
    const filteredInterestHistory = useMemo(
        () =>
            sortedStatements.filter(
                (row) => row.transaction_type.includes("interest") && isWithinDateRange(row.created_at || row.transaction_date, accountsRange)
            ),
        [accountsRange, sortedStatements]
    );
    const filteredDividendMapping = useMemo(
        () =>
            sortedStatements.filter(
                (row) => row.transaction_type === "dividend_allocation" && isWithinDateRange(row.created_at || row.transaction_date, accountsRange)
            ),
        [accountsRange, sortedStatements]
    );
    const accountDormancyCount = useMemo(
        () => filteredAccounts.filter((account) => account.status === "dormant").length,
        [filteredAccounts]
    );
    const filteredLoans = useMemo(
        () =>
            loans.filter((loan) => isWithinDateRange(loan.disbursed_at || loan.created_at, loansRange)),
        [loans, loansRange]
    );
    const filteredLoansOutstanding = useMemo(
        () => filteredLoans.reduce((sum, loan) => sum + loan.outstanding_principal + loan.accrued_interest, 0),
        [filteredLoans]
    );
    const filteredActiveLoanCount = useMemo(
        () => filteredLoans.filter((loan) => ["active", "in_arrears"].includes(loan.status)).length,
        [filteredLoans]
    );
    const transactionTrend = useMemo(() => groupBalances(filteredTransactions), [filteredTransactions]);
    const transactionTrendLabels = transactionTrend.map((entry) => entry.label);
    const transactionTrendValues = transactionTrend.map((entry) => entry.balance);
    const latestFilteredTransaction = filteredTransactions[0] || null;

    useEffect(() => {
        if (paymentFlowPurpose === "loan_repayment") {
            return;
        }

        if (paymentTargetAccounts.length && !paymentTargetAccounts.some((account) => account.id === contributionPaymentForm.getValues("account_id"))) {
            contributionPaymentForm.setValue("account_id", paymentTargetAccounts[0].id, { shouldValidate: true });
        }
    }, [contributionPaymentForm, paymentFlowPurpose, paymentTargetAccounts]);

    useEffect(() => {
        if (!trackedContributionOrder?.id || !["pending", "paid"].includes(trackedContributionOrder.status)) {
            return undefined;
        }

        const nextPollDelay = trackedContributionOrder.status === "pending"
            ? (phoneCancellationRequested ? PAYMENT_HANDSET_RESPONSE_POLL_MS : PAYMENT_PENDING_POLL_MS)
            : 2500;

        let cancelled = false;
        let timeoutId: number | undefined;

        const poll = async () => {
            await refreshTrackedPaymentOrder(false);

            if (cancelled) {
                return;
            }

            timeoutId = window.setTimeout(poll, nextPollDelay);
        };

        timeoutId = window.setTimeout(poll, nextPollDelay);

        return () => {
            cancelled = true;
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [trackedContributionOrder?.id, trackedContributionOrder?.status, phoneCancellationRequested, lastPaymentToastStatus]);

    useEffect(() => {
        if (trackedContributionOrder?.status !== "pending") {
            setPhoneCancellationRequested(false);
        }
    }, [trackedContributionOrder?.id, trackedContributionOrder?.status]);

    useEffect(() => {
        if (!showContributionDialog || !trackedContributionOrder || !["failed", "expired"].includes(trackedContributionOrder.status)) {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            setShowContributionDialog(false);
            setActiveContributionOrderId(null);
        }, phoneCancellationRequested ? 250 : 1200);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [showContributionDialog, trackedContributionOrder?.id, trackedContributionOrder?.status, phoneCancellationRequested]);

    useEffect(() => {
        if (
            !showContributionDialog
            || !trackedContributionOrder
            || trackedContributionOrder.status !== "pending"
            || !paymentApprovalTakingLongerThanExpected
            || autoBackgroundedPaymentOrderIdRef.current === trackedContributionOrder.id
        ) {
            return;
        }

        autoBackgroundedPaymentOrderIdRef.current = trackedContributionOrder.id;
        setShowContributionDialog(false);
        pushToast({
            title: tr("Payment still pending", "Malipo bado yanasubiri"),
            message: tr("The provider is still holding this request open, so tracking has moved to the background. Reopen it from Payments if you need to watch it live.", "Mtoa huduma bado ameshikilia ombi hili, kwa hiyo ufuatiliaji umehamia nyuma. Lifungue tena kwenye Malipo ukitaka kuliona moja kwa moja."),
            type: "info"
        });
    }, [
        showContributionDialog,
        trackedContributionOrder?.id,
        trackedContributionOrder?.status,
        paymentApprovalTakingLongerThanExpected,
        pushToast
    ]);

    useEffect(() => {
        setContributionsPage(0);
    }, [contributionsRange.from, contributionsRange.to]);

    useEffect(() => {
        setPaymentsPage(0);
    }, [paymentPurposeFilter, paymentStatusFilter]);

    useEffect(() => {
        setLoanSchedulePage(0);
    }, [loansRange.from, loansRange.to, loanDetailId]);

    useEffect(() => {
        if (!filteredLoans.length) {
            if (loanDetailId) {
                setLoanDetailId("");
            }
            return;
        }

        const existsInFiltered = filteredLoans.some((loan) => loan.id === loanDetailId);
        if (!existsInFiltered) {
            setLoanDetailId(filteredLoans[0].id);
        }
    }, [filteredLoans, loanDetailId]);

    const selectedLoan = useMemo(
        () => filteredLoans.find((loan) => loan.id === loanDetailId) || filteredLoans[0] || null,
        [filteredLoans, loanDetailId]
    );
    const filteredLoanSchedules = useMemo(
        () =>
            loanSchedules
                .filter(
                    (schedule) =>
                        (!selectedLoan || schedule.loan_id === selectedLoan.id) &&
                        isWithinDateRange(schedule.due_date, loansRange)
                )
                .sort((left, right) => new Date(left.due_date).getTime() - new Date(right.due_date).getTime()),
        [loanSchedules, loansRange, selectedLoan]
    );
    const paginatedLoanSchedules = useMemo(
        () =>
            filteredLoanSchedules.slice(
                loanSchedulePage * loanScheduleRowsPerPage,
                loanSchedulePage * loanScheduleRowsPerPage + loanScheduleRowsPerPage
            ),
        [filteredLoanSchedules, loanSchedulePage, loanScheduleRowsPerPage]
    );
    const loanRepaymentHistory = useMemo(
        () =>
            sortedStatements.filter(
                (row) =>
                    row.transaction_type.includes("loan_repay") &&
                    isWithinDateRange(row.created_at || row.transaction_date, loansRange)
            ),
        [loansRange, sortedStatements]
    );
    const selectedLoanNextDue = useMemo(
        () => filteredLoanSchedules.find(hasMeaningfulLoanScheduleOutstanding) || null,
        [filteredLoanSchedules]
    );
    const accountColumns: Column<MemberAccount>[] = [
        { key: "account", header: "Account", render: (row) => row.account_number },
        { key: "product", header: "Product", render: (row) => row.product_type },
        {
            key: "status",
            header: "Status",
            render: (row) => (
                <Chip
                    size="small"
                    label={row.status}
                    color={row.status === "active" ? "success" : row.status === "dormant" ? "warning" : "default"}
                    variant="outlined"
                />
            )
        },
        { key: "opened", header: "Opened", render: (row) => formatDate(row.created_at) },
        { key: "balance", header: "Balance", render: (row) => formatCurrency(row.available_balance) }
    ];

    const toggleDisputeFlag = (transactionId: string) => {
        setDisputedTransactionIds((current) =>
            current.includes(transactionId) ? current.filter((id) => id !== transactionId) : [...current, transactionId]
        );
    };

    const statementColumns: Column<StatementRow>[] = [
        { key: "date", header: "Date", render: (row) => formatDate(row.transaction_date) },
        { key: "reference", header: "Reference", render: (row) => getAuditReference(row) },
        { key: "type", header: "Type", render: (row) => formatTxType(row.transaction_type) },
        {
            key: "direction",
            header: "Dr/Cr",
            render: (row) => (
                <Chip
                    size="small"
                    label={row.direction === "in" ? "Credit" : "Debit"}
                    color={row.direction === "in" ? "success" : "error"}
                    variant={row.direction === "in" ? "filled" : "outlined"}
                />
            )
        },
        { key: "amount", header: "Amount", render: (row) => formatCurrency(row.amount) },
        { key: "balance", header: "Running Balance", render: (row) => formatCurrency(row.running_balance) },
        {
            key: "dispute",
            header: "Dispute",
            render: (row) => (
                <Button
                    size="small"
                    variant={disputedTransactionIds.includes(row.transaction_id) ? "contained" : "outlined"}
                    color={disputedTransactionIds.includes(row.transaction_id) ? "warning" : "inherit"}
                    onClick={() => toggleDisputeFlag(row.transaction_id)}
                    startIcon={<FlagRoundedIcon fontSize="small" />}
                    sx={
                        disputedTransactionIds.includes(row.transaction_id)
                            ? undefined
                            : {
                                borderColor: alpha(memberAccent, 0.34),
                                color: memberAccent,
                                "&:hover": { borderColor: alpha(memberAccent, 0.56), bgcolor: alpha(memberAccent, 0.08) }
                            }
                    }
                >
                    {disputedTransactionIds.includes(row.transaction_id) ? "Flagged" : "Flag"}
                </Button>
            )
        }
    ];

    const paymentOrderColumns: Column<PaymentOrder>[] = [
        {
            key: "purpose",
            header: "Payment",
            render: (row) => (
                <Stack spacing={0.35}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatPaymentPurpose(row.purpose)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {row.purpose === "loan_repayment"
                            ? row.loan_number || row.loan_id || "Loan target pending"
                            : row.account_name || row.account_number || row.account_id}
                    </Typography>
                </Stack>
            )
        },
        {
            key: "amount",
            header: "Amount",
            render: (row) => formatCurrency(row.amount)
        },
        {
            key: "provider",
            header: "Channel",
            render: (row) => row.provider.toUpperCase()
        },
        {
            key: "status",
            header: "Status",
            render: (row) => (
                <Chip
                    size="small"
                    label={formatPaymentStatus(row.status)}
                    color={row.status === "posted" ? "success" : row.status === "failed" ? "error" : row.status === "expired" ? "warning" : "info"}
                    variant={row.status === "posted" ? "filled" : "outlined"}
                />
            )
        },
        {
            key: "date",
            header: "Initiated",
            render: (row) => formatDate(row.created_at)
        },
        {
            key: "reference",
            header: "Reference",
            render: (row) => row.provider_ref || row.external_id
        },
        {
            key: "receipt",
            header: "Receipt",
            render: (row) => (
                <Button size="small" variant="outlined" onClick={() => setSelectedPaymentReceipt(row)}>
                    View Receipt
                </Button>
            )
        }
    ];

    const loanColumns: Column<Loan>[] = [
        { key: "loan", header: "Loan", render: (row) => row.loan_number },
        { key: "status", header: "Status", render: (row) => row.status },
        { key: "rate", header: "Rate", render: (row) => formatMonthlyLoanRate(row.annual_interest_rate) },
        { key: "principal", header: "Outstanding", render: (row) => formatCurrency(row.outstanding_principal) },
        { key: "interest", header: "Accrued Interest", render: (row) => formatCurrency(row.accrued_interest) }
    ];

    const loanApplicationColumns: Column<LoanApplication>[] = [
        {
            key: "product",
            header: "Product",
            render: (row) => row.loan_products?.name || "Loan product"
        },
        {
            key: "amount",
            header: "Requested",
            render: (row) => formatCurrency(row.requested_amount)
        },
        {
            key: "status",
            header: "Status",
            render: (row) =>
                row.status === "rejected" ? (
                    <Stack spacing={0.35}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Rejected
                        </Typography>
                        {row.rejection_reason ? (
                            <Typography variant="caption" color="error.main">
                                Reason: {row.rejection_reason}
                            </Typography>
                        ) : null}
                        {row.approval_notes ? (
                            <Typography variant="caption" color="text.secondary">
                                Notes: {row.approval_notes}
                            </Typography>
                        ) : null}
                    </Stack>
                ) : (
                    row.status.replace(/_/g, " ")
                )
        },
        {
            key: "guarantors",
            header: "Guarantors",
            render: (row) => {
                const guarantors = row.loan_guarantors || [];
                if (!guarantors.length) {
                    return "—";
                }
                const readiness = row.guarantor_readiness;
                const accepted = guarantors.filter((item) => item.consent_status === "accepted").length;
                const rejected = guarantors.filter((item) => item.consent_status === "rejected").length;
                const requiredAmount = Number(readiness?.required_amount ?? row.required_guarantee_amount ?? 0);
                return (
                    <Stack spacing={0.35}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {accepted}/{guarantors.length} accepted
                        </Typography>
                        {guarantors.map((item) => (
                            <Typography
                                key={item.member_id}
                                variant="caption"
                                color={item.consent_status === "accepted" ? "success.main" : item.consent_status === "rejected" ? "error.main" : "text.secondary"}
                            >
                                {(item.members?.full_name || item.guarantor_name || "Member")}
                                {Number(item.guaranteed_amount) > 0 ? ` · ${formatCurrency(Number(item.accepted_amount ?? item.guaranteed_amount))}` : ""}
                                {" — "}{item.consent_status === "accepted" ? "amekubali" : item.consent_status === "rejected" ? "amekataa" : "anasubiri"}
                            </Typography>
                        ))}
                        {requiredAmount > 0 && readiness ? (
                            <Typography variant="caption" color={readiness.complete ? "success.main" : "warning.main"}>
                                {formatCurrency(readiness.accepted_amount)} / {formatCurrency(requiredAmount)} guaranteed
                            </Typography>
                        ) : null}
                        {row.status === "submitted" && (rejected > 0 || (readiness && !readiness.complete && readiness.pending_count === 0)) ? (
                            <Typography variant="caption" color="error.main">
                                Update your guarantors to continue.
                            </Typography>
                        ) : null}
                    </Stack>
                );
            }
        },
        {
            key: "updated",
            header: "Last Update",
            render: (row) => formatDate(row.updated_at)
        },
        {
            key: "actions",
            header: "Actions",
            render: (row) =>
                row.status === "rejected" ? (
                    <Button size="small" variant="outlined" onClick={() => openLoanApplicationEditor(row)}>
                        Edit & Resubmit
                    </Button>
                ) : row.status === "draft" ? (
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        <Button size="small" variant="outlined" onClick={() => openLoanApplicationEditor(row)}>
                            Continue Draft
                        </Button>
                        <Button
                            size="small"
                            variant="text"
                            color="error"
                            onClick={() => setPendingDraftDeletion(row)}
                            disabled={deletingLoanApplicationId === row.id}
                        >
                            {deletingLoanApplicationId === row.id ? "Deleting..." : "Delete Draft"}
                        </Button>
                    </Stack>
                ) : (
                    row.status === "submitted" && (row.loan_guarantors || []).length ? (
                        <Stack spacing={0.5} alignItems="flex-start">
                            <Chip
                                size="small"
                                variant="outlined"
                                label={row.guarantor_readiness?.complete ? "In review" : "Awaiting guarantors"}
                                color={row.guarantor_readiness?.complete ? "default" : "warning"}
                            />
                            <Button size="small" variant="text" onClick={() => openManageGuarantorsDialog(row)}>
                                Manage Guarantors
                            </Button>
                        </Stack>
                    ) : (
                        <Chip size="small" variant="outlined" label={row.status === "submitted" ? "In review" : row.status.replace(/_/g, " ")} />
                    )
                )
        }
    ];

    const guarantorRequestColumns: Column<GuarantorRequestItem>[] = [
        {
            key: "borrower",
            header: "Borrower",
            render: (row) => row.borrower?.full_name || row.loan_application?.id || "Unknown"
        },
        {
            key: "amount",
            header: "Amount Requested",
            render: (row) => row.guaranteed_amount > 0 ? formatCurrency(row.guaranteed_amount) : "Witness only"
        },
        {
            key: "accepted_amount",
            header: "You Agreed",
            render: (row) => row.consent_status === "accepted"
                ? (Number(row.accepted_amount ?? row.guaranteed_amount) > 0
                    ? formatCurrency(Number(row.accepted_amount ?? row.guaranteed_amount))
                    : "Witness only")
                : "—"
        },
        {
            key: "application_status",
            header: "Application",
            render: (row) => row.loan_application?.status?.replace(/_/g, " ") || "Unknown"
        },
        {
            key: "consent_status",
            header: "Your Consent",
            render: (row) => row.consent_status.replace(/_/g, " ")
        },
        {
            key: "actions",
            header: "Actions",
            render: (row) =>
                row.consent_status === "pending" ? (
                    <Stack direction="row" spacing={1}>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                                if (row.guaranteed_amount > 0) {
                                    setGuarantorAcceptTarget(row);
                                    setGuarantorAcceptAmount(String(row.guaranteed_amount));
                                } else {
                                    void respondGuarantorRequest(row, "accepted");
                                }
                            }}
                            disabled={processingGuarantorRequestId === row.id}
                        >
                            Accept
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => void respondGuarantorRequest(row, "rejected")}
                            disabled={processingGuarantorRequestId === row.id}
                        >
                            Reject
                        </Button>
                    </Stack>
                ) : (
                    <Chip size="small" label={row.consent_status.toUpperCase()} />
                )
        }
    ];

    const getApplicationTone = (status: LoanApplication["status"]) => {
        if (status === "approved") {
            return {
                icon: ApprovalRoundedIcon,
                color: brandColors.success,
                bg: alpha(brandColors.success, 0.12),
                label: tr("Approved", "Imeidhinishwa")
            };
        }

        if (status === "appraised") {
            return {
                icon: TaskAltRoundedIcon,
                color: memberAccent,
                bg: alpha(memberAccent, 0.14),
                label: tr("Appraised", "Imetathminiwa")
            };
        }

        if (status === "rejected") {
            return {
                icon: HighlightOffRoundedIcon,
                color: brandColors.danger,
                bg: alpha(brandColors.danger, 0.12),
                label: tr("Rejected", "Imekataliwa")
            };
        }

        if (status === "disbursed") {
            return {
                icon: CreditScoreRoundedIcon,
                color: memberAccent,
                bg: alpha(memberAccent, 0.14),
                label: tr("Disbursed", "Imetolewa")
            };
        }

        return {
            icon: HourglassTopRoundedIcon,
            color: brandColors.warning,
            bg: alpha(brandColors.warning, 0.12),
            label: status === "submitted" ? "Submitted" : "In progress"
        };
    };

    const loanProductOptions = loanProducts.map((product) => ({
        value: product.id,
        label: product.name,
        secondary: `${formatMonthlyLoanRate(product.annual_interest_rate)} · ${formatCurrency(product.min_amount)} min · ${product.max_term_count || "Open"} term`
    }));

    const canApplyForLoan = true;

    const reloadLoanApplications = async (tenantId: string) => {
        const { data: applicationsResponse } = await api.get<LoanApplicationsResponse>(endpoints.loanApplications.list(), {
            params: { tenant_id: tenantId, page: 1, limit: 100 }
        });
        setLoanApplications(applicationsResponse.data || []);
    };

    const openLoanApplicationEditor = (application?: LoanApplication | null) => {
        setLoanFormStep(0);
        setLoanDocuments({ national_id: null, supporting_document: null, guarantor_id: null });

        if (application) {
            setEditingLoanApplicationId(application.id);
            setRequestedAmountInput(formatWholeNumber(application.requested_amount));
            setGuarantorDrafts((application.loan_guarantors || []).map((row) => ({
                member_id: row.member_id,
                member_no: row.members?.member_no || "",
                full_name: row.members?.full_name || row.guarantor_name || "Member",
                available_amount: null,
                guaranteed_amount: Number(row.guaranteed_amount || 0)
            })));
            loanApplicationForm.reset({
                product_id: application.product_id,
                purpose: application.purpose,
                requested_amount: application.requested_amount,
                requested_term_count: application.requested_term_count,
                requested_repayment_frequency: application.requested_repayment_frequency,
                requested_interest_rate: annualToMonthlyRate(application.requested_interest_rate ?? 0),
                external_reference: application.external_reference || "",
                payout_method: application.payout_method || "cash",
                repayment_mode: application.repayment_mode || "check_off",
                loan_category: application.loan_category || "new",
                top_up_of_loan_id: application.top_up_of_loan_id || "",
                deposit_purchase_amount: application.deposit_purchase_amount || 0,
                application_fee_paid: Boolean(application.application_fee_paid),
                payout_bank_name: application.payout_bank_name || "",
                payout_bank_branch: application.payout_bank_branch || "",
                payout_account_name: application.payout_account_name || "",
                payout_account_number: application.payout_account_number || "",
                confirmation_checked: false,
                declaration_accepted: Boolean(application.declaration_accepted),
                terms_accepted: false
            });
        } else {
            setEditingLoanApplicationId(null);
            setRequestedAmountInput("");
            setGuarantorDrafts([]);
            loanApplicationForm.reset({
                product_id: "",
                purpose: "",
                requested_amount: 0,
                requested_term_count: 12,
                requested_repayment_frequency: "monthly",
                requested_interest_rate: 0,
                external_reference: "",
                payout_method: "cash",
                repayment_mode: "check_off",
                loan_category: "new",
                top_up_of_loan_id: "",
                deposit_purchase_amount: 0,
                application_fee_paid: false,
                payout_bank_name: "",
                payout_bank_branch: "",
                payout_account_name: "",
                payout_account_number: "",
                confirmation_checked: false,
                declaration_accepted: false,
                terms_accepted: false
            });
        }

        setShowApplyDialog(true);
    };

    const openLoanApplicationDraft = () => {
        // Block only on a confirmed unpaid month; when the status is unknown the
        // member may proceed and the backend guard remains the enforcement point.
        if (monthlyCommitment.state === "due") {
            pushToast({
                type: "error",
                title: tr("Monthly savings due", "Akiba ya mwezi inadaiwa"),
                message: `Deposit the remaining ${formatCurrency(monthlyCommitment.remaining)} of your ${monthlyCommitment.monthLabel} mandatory savings before applying for a loan.`
            });
            handleSectionSelect("member-contributions");
            return;
        }

        if (selectedLoanDraft) {
            openLoanApplicationEditor(selectedLoanDraft);
            return;
        }

        openLoanApplicationEditor();
    };

    const closeLoanApplicationDialog = () => {
        setShowApplyDialog(false);
        setEditingLoanApplicationId(null);
        setPendingDraftDeletion(null);
        setRequestedAmountInput("");
        setLoanFormStep(0);
        setGuarantorDrafts([]);
        setGuarantorLookupNo("");
        setTopUpNewCashInput("");
        loanApplicationForm.reset();
    };

    const confirmDeleteLoanApplicationDraft = async () => {
        if (!profile || !pendingDraftDeletion || pendingDraftDeletion.status !== "draft") {
            return;
        }

        setDeletingLoanApplicationId(pendingDraftDeletion.id);
        try {
            await api.delete(endpoints.loanApplications.detail(pendingDraftDeletion.id));
            if (editingLoanApplicationId === pendingDraftDeletion.id) {
                closeLoanApplicationDialog();
            }
            setPendingDraftDeletion(null);
            await reloadLoanApplications(profile.tenant_id);
            pushToast({
                type: "success",
                title: tr("Draft loan application deleted", "Rasimu ya maombi imefutwa"),
                message: tr("The draft was removed from your loan applications.", "Rasimu imeondolewa kwenye maombi yako ya mkopo.")
            });
        } catch (deleteError) {
            pushToast({
                type: "error",
                title: tr("Unable to delete draft", "Imeshindikana kufuta rasimu"),
                message: getApiErrorMessage(deleteError)
            });
        } finally {
            setDeletingLoanApplicationId(null);
        }
    };

    /**
     * Product-fit rules: minimum amount, term inside the product's own range, and
     * a repayment frequency the product actually offers. These used to run only
     * inside persistLoanApplication, so a member could pass the Details step with
     * a 3-month term on a 6-month-minimum product, fill in payout details and
     * guarantors on Review, press Submit, and only then be told about the term.
     * Both the Details step and the submit call this, so the error lands on the
     * field that caused it. Returns true when something is wrong.
     */
    const applyLoanProductFitErrors = (values: z.infer<typeof loanApplicationSchema>) => {
        const allowedFrequencies = resolveLoanAllowedFrequencies(
            loanProducts.find((product) => product.id === values.product_id) || null
        );
        let hasProductFitError = false;

        if (values.requested_amount < selectedLoanMinimumAmount) {
            loanApplicationForm.setError("requested_amount", {
                message: `Requested amount must be at least ${formatCurrency(selectedLoanMinimumAmount)}`
            });
            hasProductFitError = true;
        }

        if (values.requested_term_count < selectedLoanMinimumTerm || (selectedLoanMaximumTerm && values.requested_term_count > selectedLoanMaximumTerm)) {
            loanApplicationForm.setError("requested_term_count", {
                message: `Loan term must be between ${selectedLoanMinimumTerm} and ${selectedLoanMaximumTerm || selectedLoanMinimumTerm} months`
            });
            hasProductFitError = true;
        }

        if (!allowedFrequencies.includes(values.requested_repayment_frequency)) {
            loanApplicationForm.setError("requested_repayment_frequency", {
                message: tr("Selected repayment frequency is not available for this loan product.", "Mzunguko wa marejesho uliouchagua haupatikani kwa bidhaa hii ya mkopo.")
            });
            hasProductFitError = true;
        }

        return hasProductFitError;
    };

    const handleAdvanceLoanFormStep = async () => {
        if (isLoanProductStep) {
            if (!loanApplicationForm.watch("product_id")) {
                loanApplicationForm.setError("product_id", { message: "Select a loan product." });
                return;
            }

            setLoanFormStep(1);
            return;
        }

        if (isLoanEligibilityStep) {
            setLoanFormStep(2);
            return;
        }

        if (isLoanDetailsStep) {
            const detailsValid = await loanApplicationForm.trigger([
                "purpose",
                "requested_amount",
                "requested_term_count",
                "requested_repayment_frequency"
            ]);

            // The zod schema only knows the generic floor (TZS 10,000, term >= 1).
            // The product's own limits are checked here so they surface on this
            // step rather than after Review is filled in.
            if (detailsValid && !applyLoanProductFitErrors(loanApplicationForm.getValues())) {
                setLoanFormStep(3);
            }
        }
    };

    const handleRetreatLoanFormStep = () => {
        setLoanFormStep((current) => Math.max(0, current - 1));
    };

    const persistLoanApplication = async (
        values: z.infer<typeof loanApplicationSchema>,
        options: { submitAfterSave: boolean }
    ) => {
        if (!profile) {
            return;
        }

        const sanitizedPurpose = sanitizeLoanPurpose(values.purpose);
        const selectedProduct = loanProducts.find((product) => product.id === values.product_id) || null;
        let hasClientValidationError = false;

        loanApplicationForm.clearErrors();

        if (!selectedProduct) {
            loanApplicationForm.setError("product_id", { message: "Select a loan product." });
            return;
        }

        if (options.submitAfterSave && memberRecord?.status !== "active") {
            pushToast({
                type: "error",
                title: tr("Member not eligible", "Hustahili kuomba"),
                message: tr("Only active members can submit loan applications.", "Ni wanachama walio hai pekee wanaoweza kuomba mkopo.")
            });
            return;
        }

        if (options.submitAfterSave && memberHasProblemLoan) {
            pushToast({
                type: "error",
                title: tr("Loan blocked", "Maombi yamezuiliwa"),
                message: tr("You cannot submit a new loan application while you have in-arrears or written-off loans.", "Huwezi kuomba mkopo mpya ukiwa na mkopo uliochelewa au uliofutwa.")
            });
            return;
        }

        if (options.submitAfterSave && selectedLoanConflict) {
            pushToast({
                type: "error",
                title: tr("Existing application in progress", "Una maombi yanayoendelea"),
                message: tr("You already have another open loan application. Complete or resolve it before starting a new one.", "Tayari una maombi mengine ya mkopo yaliyo wazi. Yamalize kabla ya kuanza mapya.")
            });
            return;
        }

        if (!sanitizedPurpose.length) {
            loanApplicationForm.setError("purpose", { message: "Say what the loan is for." });
            hasClientValidationError = true;
        } else if (sanitizedPurpose.length > 2000) {
            loanApplicationForm.setError("purpose", { message: "Loan purpose cannot exceed 2000 characters" });
            hasClientValidationError = true;
        }

        if (applyLoanProductFitErrors(values)) {
            hasClientValidationError = true;
        }

        if (selectedLoanProduct?.terms_and_conditions && !values.terms_accepted) {
            loanApplicationForm.setError("terms_accepted", {
                message: tr("Please read and accept the Terms & Conditions.", "Tafadhali soma na ukubali Vigezo na Masharti.")
            });
            hasClientValidationError = true;
        }

        if (hasClientValidationError) {
            return;
        }

        // Guarantor plan checks (board process): at least one guarantor on
        // submission; the excess above savings must be exactly covered.
        if (options.submitAfterSave) {
            if (loanCapacity?.has_problem_loans) {
                pushToast({
                    type: "error",
                    title: tr("Overdue loan", "Mkopo uliochelewa"),
                    message: tr("Clear your overdue loan first — new applications are not accepted while a loan is overdue.", "Maliza kwanza mkopo wako uliochelewa — maombi mapya hayapokelewi wakati mkopo umechelewa.")
                });
                return;
            }
            if (!guarantorDrafts.length) {
                pushToast({
                    type: "error",
                    title: tr("Guarantor required", "Mdhamini anahitajika"),
                    message: tr("Add at least one guarantor before submitting your application.", "Ongeza angalau mdhamini mmoja kabla ya kuwasilisha maombi yako.")
                });
                return;
            }
            if (requiredGuaranteeAmount > 0 && Math.abs(allocatedGuaranteeAmount - requiredGuaranteeAmount) > 0.01) {
                pushToast({
                    type: "error",
                    title: allocatedGuaranteeAmount < requiredGuaranteeAmount ? "Guarantee not fully covered" : "Guarantee amounts too high",
                    message: allocatedGuaranteeAmount < requiredGuaranteeAmount
                        ? `Your guarantors must cover ${formatCurrency(requiredGuaranteeAmount)} in total — ${formatCurrency(remainingGuaranteeAmount)} is still missing.`
                        : `Guarantee requests must not exceed ${formatCurrency(requiredGuaranteeAmount)} in total.`
                });
                return;
            }
        }

        setSubmittingApplication(true);
        try {
            const payload: CreateLoanApplicationRequest = {
                tenant_id: profile.tenant_id,
                branch_id: profile.branch_id || undefined,
                product_id: values.product_id,
                purpose: sanitizedPurpose,
                requested_amount: values.requested_amount,
                requested_term_count: values.requested_term_count,
                requested_repayment_frequency: values.requested_repayment_frequency,
                requested_interest_rate: selectedProduct.annual_interest_rate,
                payout_method: values.payout_method,
                payout_bank_name: values.payout_bank_name || undefined,
                payout_bank_branch: values.payout_bank_branch || undefined,
                payout_account_name: values.payout_account_name || undefined,
                payout_account_number: values.payout_account_number || undefined,
                declaration_accepted: values.declaration_accepted,
                repayment_mode: values.repayment_mode,
                // One loan at a time: when the member already carries a loan the
                // backend only accepts a top-up, whatever the form defaulted to.
                loan_category: isTopUpApplication ? "top_up" : values.loan_category,
                top_up_of_loan_id: isTopUpApplication
                    ? (topUpQuote?.loans?.[0]?.loan_id || null)
                    : (values.loan_category === "top_up" ? (values.top_up_of_loan_id || null) : null),
                deposit_purchase_amount: values.deposit_purchase_amount || 0,
                application_fee_paid: values.application_fee_paid,
                guarantors: guarantorDrafts.map((row) => ({
                    member_id: row.member_id,
                    guaranteed_amount: requiredGuaranteeAmount > 0 ? row.guaranteed_amount : 0
                }))
            };

            const applicationId = editingLoanApplicationId
                ? (
                    await api.patch<LoanApplicationResponse>(
                        endpoints.loanApplications.update(editingLoanApplicationId),
                        payload as UpdateLoanApplicationRequest
                    )
                ).data.data.id
                : (
                    await api.post<LoanApplicationResponse>(endpoints.loanApplications.list(), payload)
                ).data.data.id;

            const hasDocuments = loanDocuments.national_id || loanDocuments.supporting_document || loanDocuments.guarantor_id;
            if (hasDocuments) {
                const documentBody = new FormData();
                if (loanDocuments.national_id) documentBody.append("national_id", loanDocuments.national_id);
                if (loanDocuments.supporting_document) documentBody.append("supporting_document", loanDocuments.supporting_document);
                if (loanDocuments.guarantor_id) documentBody.append("guarantor_id", loanDocuments.guarantor_id);
                try {
                    await api.post(endpoints.loanApplications.attachments(applicationId), documentBody, {
                        headers: { "Content-Type": "multipart/form-data" },
                        timeout: 60000
                    });
                } catch (documentError) {
                    pushToast({
                        type: "info",
                        title: tr("Application saved", "Maombi yamehifadhiwa"),
                        message: tr("Your application was saved but the documents could not be uploaded. You can re-upload them by editing the application.", "Maombi yako yamehifadhiwa lakini hati hazikupakiwa. Unaweza kuzipakia tena kwa kuhariri maombi.")
                    });
                }
            }

            if (options.submitAfterSave) {
                await api.post<LoanApplicationResponse>(endpoints.loanApplications.submit(applicationId), {});
            }

            pushToast({
                type: "success",
                title: options.submitAfterSave
                    ? editingLoanApplicationId
                        ? "Loan application updated"
                        : "Loan application submitted"
                    : "Draft loan application saved",
                message: options.submitAfterSave
                    ? editingLoanApplicationId
                        ? "Your corrected application has been resubmitted for appraisal."
                        : "Your application is now waiting for appraisal."
                    : "Your draft changes were saved. You can submit the application once the current lock is cleared."
            });
            closeLoanApplicationDialog();
            await reloadLoanApplications(profile.tenant_id);
        } catch (loanApplicationError) {
            const errorCode = getApiErrorCode(loanApplicationError);
            const errorDetails = getApiErrorDetails<Record<string, unknown>>(loanApplicationError);
            const allowedLimit = getNumericDetail(errorDetails, "allowed_limit");
            const minimumAmount = getNumericDetail(errorDetails, "minimum_amount");
            let errorMessage = getApiErrorMessage(loanApplicationError);

            if (errorCode === "LOAN_BORROW_LIMIT_EXCEEDED" && allowedLimit !== null) {
                const formattedLimit = formatCurrency(allowedLimit);
                loanApplicationForm.setError("requested_amount", {
                    message: `Requested amount exceeds your current borrow limit of ${formattedLimit}`
                });
                errorMessage = `Requested amount exceeds your current borrow limit of ${formattedLimit}.`;
            } else if (errorCode === "LOAN_AMOUNT_BELOW_MINIMUM" && minimumAmount !== null) {
                loanApplicationForm.setError("requested_amount", {
                    message: `Requested amount must be at least ${formatCurrency(minimumAmount)}`
                });
                errorMessage = `Requested amount must be at least ${formatCurrency(minimumAmount)}.`;
            } else if (errorCode === "LOAN_POOL_TEMPORARILY_EXHAUSTED") {
                errorMessage = "SACCO loan pool temporarily exhausted. Please try again later.";
            } else if (errorCode === "LOAN_TOPUP_REQUIRED") {
                const settlement = getNumericDetail(errorDetails, "settlement_amount");
                errorMessage = `You already have a loan${settlement !== null ? ` with a balance of ${formatCurrency(settlement)}` : ""}. Reopen this form to apply as a top-up — your balance is settled out of the new loan.`;
            } else if (errorCode === "TOPUP_AMOUNT_TOO_LOW") {
                const settlement = getNumericDetail(errorDetails, "settlement_amount");
                errorMessage = `A top-up must be more than the ${settlement !== null ? formatCurrency(settlement) : "amount"} you currently owe — enter the extra cash you want on top of it.`;
            } else if (errorCode === "GUARANTOR_CAPACITY_INSUFFICIENT") {
                errorMessage = "One of your guarantors no longer has enough guarantee capacity. Review the amounts or choose another guarantor.";
            } else if (errorCode === "GUARANTOR_COVERAGE_SHORT") {
                const shortfall = getNumericDetail(errorDetails, "shortfall");
                errorMessage = `Your guarantors must cover the full amount above your savings${shortfall !== null ? ` — ${formatCurrency(shortfall)} is still missing` : ""}.`;
            } else if (errorCode === "GUARANTOR_COVERAGE_EXCESS") {
                errorMessage = "Guarantee requests must not exceed the amount that needs guaranteeing.";
            } else if (errorCode === "GUARANTOR_REQUIRED") {
                errorMessage = "Add at least one guarantor before submitting your application.";
            } else if (errorCode === "GUARANTOR_LIMIT_EXCEEDED") {
                errorMessage = `You can select at most ${guarantorMaxCount} guarantors.`;
            } else if (errorCode === "MONTHLY_SAVINGS_COMMITMENT_UNPAID") {
                const remainingDue = getNumericDetail(errorDetails, "remaining_amount");
                errorMessage = `This month's mandatory savings is not yet complete${remainingDue !== null ? ` — ${formatCurrency(remainingDue)} remaining` : ""}. Deposit the balance, then submit again.`;
                // Re-sync the banner/locks with what the backend just enforced.
                void refreshMonthlyCommitment();
            }

            pushToast({
                type: "error",
                title: options.submitAfterSave
                    ? editingLoanApplicationId
                        ? "Unable to resubmit application"
                        : "Unable to submit application"
                    : "Unable to save draft",
                message: errorMessage
            });
        } finally {
            setSubmittingApplication(false);
        }
    };

    const submitLoanApplication = loanApplicationForm.handleSubmit(async (values) => {
        await persistLoanApplication(values, { submitAfterSave: true });
    });

    const saveLoanApplicationDraft = loanApplicationForm.handleSubmit(async (values) => {
        await persistLoanApplication(values, { submitAfterSave: false });
    });

    const respondGuarantorRequest = async (
        request: GuarantorRequestItem,
        decision: "accepted" | "rejected",
        acceptedAmount?: number
    ) => {
        if (!profile) {
            return;
        }

        setProcessingGuarantorRequestId(request.id);
        try {
            const payload: GuarantorConsentRequest = {
                tenant_id: profile.tenant_id,
                decision,
                accepted_amount: decision === "accepted"
                    ? (typeof acceptedAmount === "number" ? acceptedAmount : request.guaranteed_amount)
                    : null
            };

            await api.post<LoanApplicationResponse>(
                endpoints.loanApplications.guarantorConsent(request.application_id),
                payload
            );

            setGuarantorRequests((prev) =>
                prev.map((item) =>
                    item.id === request.id
                        ? {
                            ...item,
                            consent_status: decision,
                            accepted_amount: decision === "accepted"
                                ? (typeof acceptedAmount === "number" ? acceptedAmount : request.guaranteed_amount)
                                : null,
                            consented_at: new Date().toISOString()
                        }
                        : item
                )
            );
            setGuarantorAcceptTarget(null);

            pushToast({
                type: "success",
                title: decision === "accepted" ? "Guarantor request accepted" : "Guarantor request rejected",
                message: decision === "accepted"
                    ? "Branch loan officers can now continue processing this application once all guarantors accept."
                    : "The application team has been notified that you rejected this guarantee request."
            });
        } catch (error) {
            pushToast({
                type: "error",
                title: tr("Unable to update guarantor response", "Imeshindikana kuhifadhi jibu la mdhamini"),
                message: getApiErrorMessage(error)
            });
        } finally {
            setProcessingGuarantorRequestId(null);
        }
    };

    // Type-ahead: search active members by name or member number as the
    // applicant types, so nobody needs to know member numbers by heart.
    useEffect(() => {
        const query = guarantorLookupNo.trim();
        if (query.length < 2 || !profile) {
            setGuarantorSuggestions([]);
            setGuarantorSearchState("idle");
            setGuarantorSearchError("");
            return;
        }

        let cancelled = false;
        setGuarantorSearchState("searching");
        const timer = window.setTimeout(async () => {
            try {
                const { data } = await api.get<GuarantorSearchResponse>(endpoints.loanApplications.guarantorSearch(), {
                    params: { tenant_id: profile.tenant_id, q: query }
                });
                if (!cancelled) {
                    const chosen = new Set(guarantorDrafts.map((row) => row.member_id));
                    setGuarantorSuggestions((data.data || []).filter((hit) => !chosen.has(hit.member_id)));
                    setGuarantorSearchState("done");
                    setGuarantorSearchError("");
                }
            } catch (searchError) {
                if (!cancelled) {
                    setGuarantorSuggestions([]);
                    setGuarantorSearchState("error");
                    setGuarantorSearchError(getApiErrorMessage(searchError, "Member lookup failed."));
                }
            }
        }, 350);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
        // guarantorDrafts intentionally read fresh inside the timer via closure;
        // re-running on draft changes just re-filters the list.
    }, [guarantorLookupNo, profile, guarantorDrafts]);

    const lookupGuarantorByMemberNo = async (hit?: GuarantorSearchHit) => {
        const memberNo = guarantorLookupNo.trim();
        if ((!memberNo && !hit) || !profile) {
            return;
        }
        if (guarantorDrafts.length >= guarantorMaxCount) {
            pushToast({
                type: "error",
                title: tr("Guarantor limit reached", "Kikomo cha wadhamini kimefikiwa"),
                message: `You can select at most ${guarantorMaxCount} guarantors.`
            });
            return;
        }

        setGuarantorLookupBusy(true);
        try {
            const { data } = await api.get<GuarantorCapacityResponse>(endpoints.loanApplications.guarantorCapacity(), {
                params: hit
                    ? { tenant_id: profile.tenant_id, member_id: hit.member_id }
                    : { tenant_id: profile.tenant_id, member_no: memberNo }
            });
            const lookup: GuarantorCapacityLookup = data.data;
            setGuarantorMaxCount(lookup.policy.max_guarantors_per_application || 5);

            if (guarantorDrafts.some((row) => row.member_id === lookup.member_id)) {
                pushToast({ type: "error", title: "Already selected", message: `${lookup.full_name} is already on your guarantor list.` });
                return;
            }
            if (!lookup.is_active) {
                pushToast({ type: "error", title: "Member not eligible", message: `${lookup.full_name} is not an active member.` });
                return;
            }
            if (activeRequiredGuarantee > 0 && lookup.available_amount <= 0) {
                pushToast({
                    type: "error",
                    title: tr("No guarantee capacity", "Hana uwezo wa kudhamini"),
                    message: `${lookup.full_name} has no remaining guarantee capacity right now, so they cannot be selected.`
                });
                return;
            }

            const suggested = activeRequiredGuarantee > 0
                ? Math.min(lookup.available_amount, activeRemainingGuarantee)
                : 0;
            setGuarantorDrafts((prev) => [...prev, {
                member_id: lookup.member_id,
                member_no: lookup.member_no,
                full_name: lookup.full_name,
                available_amount: lookup.available_amount,
                guaranteed_amount: Math.max(0, Math.round(suggested * 100) / 100)
            }]);
            setGuarantorLookupNo("");
            setGuarantorSuggestions([]);
        } catch (error) {
            pushToast({
                type: "error",
                title: tr("Guarantor lookup failed", "Kumtafuta mdhamini kumeshindikana"),
                message: getApiErrorMessage(error, "No member was found with that member number.")
            });
        } finally {
            setGuarantorLookupBusy(false);
        }
    };

    const openManageGuarantorsDialog = (application: LoanApplication) => {
        setManageGuarantorsTarget(application);
        setGuarantorLookupNo("");
        setGuarantorDrafts((application.loan_guarantors || [])
            .filter((row) => row.consent_status !== "rejected")
            .map((row) => ({
                member_id: row.member_id,
                member_no: row.members?.member_no || "",
                full_name: row.members?.full_name || row.guarantor_name || "Member",
                available_amount: null,
                guaranteed_amount: Number(row.guaranteed_amount || 0)
            })));
    };

    const closeManageGuarantorsDialog = () => {
        setManageGuarantorsTarget(null);
        setGuarantorDrafts([]);
        setGuarantorLookupNo("");
    };

    const saveGuarantorPlan = async () => {
        if (!profile || !manageGuarantorsTarget) {
            return;
        }
        if (activeRequiredGuarantee > 0 && Math.abs(allocatedGuaranteeAmount - activeRequiredGuarantee) > 0.01) {
            pushToast({
                type: "error",
                title: allocatedGuaranteeAmount < activeRequiredGuarantee ? "Guarantee not fully covered" : "Guarantee amounts too high",
                message: `Your guarantors must cover exactly ${formatCurrency(activeRequiredGuarantee)} in total.`
            });
            return;
        }
        if (!guarantorDrafts.length) {
            pushToast({ type: "error", title: "Guarantor required", message: "Keep at least one guarantor on the application." });
            return;
        }

        setSavingGuarantorPlan(true);
        try {
            await api.patch<LoanApplicationResponse>(
                endpoints.loanApplications.update(manageGuarantorsTarget.id),
                {
                    tenant_id: profile.tenant_id,
                    guarantors: guarantorDrafts.map((row) => ({
                        member_id: row.member_id,
                        guaranteed_amount: activeRequiredGuarantee > 0 ? row.guaranteed_amount : 0
                    }))
                } as UpdateLoanApplicationRequest
            );
            pushToast({
                type: "success",
                title: tr("Guarantors updated", "Wadhamini wamesasishwa"),
                message: tr("New or changed guarantors will receive a fresh request to accept.", "Wadhamini wapya au waliobadilishwa watapokea ombi jipya la kukubali.")
            });
            closeManageGuarantorsDialog();
            await reloadLoanApplications(profile.tenant_id);
        } catch (error) {
            pushToast({
                type: "error",
                title: tr("Unable to update guarantors", "Imeshindikana kusasisha wadhamini"),
                message: getApiErrorMessage(error)
            });
        } finally {
            setSavingGuarantorPlan(false);
        }
    };

    // PortalShell closes its own mobile drawer when the section changes.
    const handleSectionSelect = (sectionId: PortalSectionId) => {
        setActiveSection(sectionId);
    };

    const handleDownloadStatement = async () => {
        if (!statements.length) {
            pushToast({
                type: "error",
                title: tr("No statement data", "Hakuna taarifa ya miamala"),
                message: tr("No posted transactions are available to export yet.", "Bado hakuna miamala iliyowekwa ya kutoa.")
            });
            return;
        }

        const logoDataUrl = await loadReportLogoDataUrl(portalLogoSrc);
        downloadMemberStatementPdf({
            memberName: profile?.full_name || "Member",
            memberEmail: user?.email || null,
            tenantName: selectedTenantName,
            branchName: selectedBranchName,
            logoDataUrl,
            generatedBy: profile?.full_name || user?.email || "Member Portal",
            totalSavings,
            shareCapital: totalShareCapital,
            outstandingLoan: totalOutstandingLoans,
            netPosition,
            statements
        });
    };

    const handleDownloadFilteredStatement = async (rows: StatementRow[], title: string) => {
        if (!rows.length) {
            pushToast({
                type: "error",
                title: tr("No records to export", "Hakuna rekodi za kutoa"),
                message: `No ${title.toLowerCase()} records available in the selected range.`
            });
            return;
        }

        const logoDataUrl = await loadReportLogoDataUrl(portalLogoSrc);
        downloadMemberStatementPdf({
            memberName: profile?.full_name || "Member",
            memberEmail: user?.email || null,
            tenantName: selectedTenantName,
            branchName: selectedBranchName,
            logoDataUrl,
            generatedBy: profile?.full_name || user?.email || "Member Portal",
            totalSavings,
            shareCapital: totalShareCapital,
            outstandingLoan: totalOutstandingLoans,
            netPosition,
            statements: rows
        });
    };

    const handleDownloadLoanStatement = async () => {
        if (!selectedLoan) {
            pushToast({
                type: "error",
                title: tr("No loan selected", "Hakuna mkopo uliochaguliwa"),
                message: tr("Select a loan facility before exporting the statement.", "Chagua mkopo kabla ya kutoa taarifa.")
            });
            return;
        }

        const selectedLoanTransactions = loanTransactions
            .filter((transaction) => transaction.loan_id === selectedLoan.id && isWithinDateRange(transaction.created_at, loansRange))
            .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());

        if (!filteredLoanSchedules.length && !selectedLoanTransactions.length) {
            pushToast({
                type: "error",
                title: tr("No loan statement data", "Hakuna taarifa ya mkopo"),
                message: tr("No schedules or loan transactions are available for the selected loan in the current range.", "Hakuna ratiba wala miamala ya mkopo uliouchagua katika kipindi hiki.")
            });
            return;
        }

        const logoDataUrl = await loadReportLogoDataUrl(portalLogoSrc);
        downloadLoanStatementPdf({
            memberName: profile?.full_name || "Member",
            memberEmail: user?.email || null,
            tenantName: selectedTenantName,
            branchName: selectedBranchName,
            logoDataUrl,
            generatedBy: profile?.full_name || user?.email || "Member Portal",
            loan: selectedLoan,
            schedules: filteredLoanSchedules,
            transactions: selectedLoanTransactions
        });
    };

    // Monthly mandatory savings status: keeps demanding until the month is paid,
    // then flips to a slim "Active" confirmation. A failed status fetch renders
    // an explicit "couldn't verify" card — never a false "still due".
    const renderMonthlyCommitmentBanner = () => {
        if (monthlyCommitment.state === "none" || monthlyCommitment.state === "loading") {
            return null;
        }

        if (monthlyCommitment.state === "error") {
            return (
                <MotionCard variant="outlined" sx={contentCardSx}>
                    <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                        <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, display: "grid", placeItems: "center", bgcolor: alpha(brandColors.info, 0.12), color: brandColors.info, flexShrink: 0 }}>
                                    <HourglassTopRoundedIcon fontSize="small" />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                        Monthly savings status unavailable
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        We could not verify this month's savings commitment. This does not mean you owe anything — check again in a moment.
                                    </Typography>
                                </Box>
                            </Stack>
                            <Button size="small" variant="outlined" onClick={() => void refreshMonthlyCommitment()}>
                                Check again
                            </Button>
                        </Stack>
                    </CardContent>
                </MotionCard>
            );
        }

        if (monthlyCommitment.state === "met") {
            return (
                <MotionCard
                    variant="outlined"
                    sx={{
                        ...contentCardSx,
                        borderColor: alpha(brandColors.success, 0.35),
                        bgcolor: alpha(brandColors.success, isDarkMode ? 0.1 : 0.05)
                    }}
                >
                    <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                        <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, display: "grid", placeItems: "center", bgcolor: alpha(brandColors.success, 0.16), color: brandColors.success, flexShrink: 0 }}>
                                    <TaskAltRoundedIcon fontSize="small" />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                        Monthly savings active
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {monthlyCommitment.monthLabel} commitment of {formatCurrency(monthlyCommitment.amount)} is fully paid.
                                    </Typography>
                                </Box>
                            </Stack>
                            <Chip
                                label="Active"
                                size="small"
                                sx={{ bgcolor: alpha(brandColors.success, 0.16), color: brandColors.success, fontWeight: 800 }}
                            />
                        </Stack>
                    </CardContent>
                </MotionCard>
            );
        }

        return (
            <MotionCard
                variant="outlined"
                data-tour="member-portal-monthly-commitment"
                sx={{
                    ...contentCardSx,
                    borderColor: alpha(brandColors.warning, 0.5),
                    bgcolor: alpha(brandColors.warning, isDarkMode ? 0.12 : 0.07)
                }}
            >
                <CardContent sx={{ p: { xs: 1.75, md: 2 }, "&:last-child": { pb: { xs: 1.75, md: 2 } } }}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ md: "center" }}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0, flex: 1 }}>
                            <Box sx={{ width: 40, height: 40, borderRadius: 1.6, display: "grid", placeItems: "center", bgcolor: alpha(brandColors.warning, 0.2), color: "#9A6700", flexShrink: 0 }}>
                                <HourglassTopRoundedIcon fontSize="small" />
                            </Box>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography variant="overline" sx={{ color: "#9A6700", letterSpacing: "0.16em", fontWeight: 700 }}>
                                    Monthly mandatory savings · {monthlyCommitment.monthLabel}
                                </Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.25 }}>
                                    {formatCurrency(monthlyCommitment.remaining)} still due
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                    Paid {formatCurrency(monthlyCommitment.paid)} of {formatCurrency(monthlyCommitment.amount)}. Loan applications stay locked until this month's savings is complete.
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={monthlyCommitment.progressPercent}
                                    sx={{
                                        mt: 1,
                                        height: 7,
                                        borderRadius: 999,
                                        bgcolor: alpha(brandColors.warning, 0.18),
                                        "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: brandColors.warning }
                                    }}
                                />
                            </Box>
                        </Stack>
                        <Button
                            variant="contained"
                            onClick={() => handleSectionSelect("member-contributions")}
                            sx={{
                                flexShrink: 0,
                                bgcolor: CREST_GOLD,
                                color: "#050338",
                                fontWeight: 800,
                                boxShadow: "none",
                                "&:hover": { bgcolor: CREST_GOLD_LIGHT, boxShadow: "none" }
                            }}
                        >
                            Deposit now
                        </Button>
                    </Stack>
                </CardContent>
            </MotionCard>
        );
    };

    const renderSaccoOverview = () => {
        const tzs = (value: number) => `TZS ${new Intl.NumberFormat("en-US").format(Math.round(Number(value) || 0))}`;

        if (!saccoOverview) {
            return <SaccoSection loading={saccoOverviewLoading} hero={null} deployment={null} figures={[]} milestone={null} milestones={[]} />;
        }

        const poolSavings = Number(saccoOverview.total_savings || 0);
        // Savings plus share capital. Savings alone was the whole of it while
        // share capital sat inside savings; moving it across took 152.9M off
        // this headline overnight without a shilling leaving the cooperative,
        // and every member's share of it moved with it.
        const poolShares = Number(saccoOverview.total_shares || 0);
        const poolMemberFunds = poolSavings + poolShares;
        const memberCount = Number(saccoOverview.total_members || 0);

        // Where the cooperative's money currently sits. Per-asset holdings, the
        // loan book and the operation fund — deliberately NOT the savings pool,
        // which is the source of these, not a separate destination.
        const assetSlices = (saccoOverview.investments_by_asset?.length
            ? saccoOverview.investments_by_asset.filter((asset) => asset.invested > 0).map((asset) => ({
                id: asset.asset_id,
                name: asset.asset_name,
                amount: Number(asset.invested || 0)
            }))
            : saccoOverview.utt_invested
                ? [{ id: "investments", name: "Investments", amount: Number(saccoOverview.utt_invested || 0) }]
                : []);

        const slices = [
            ...assetSlices,
            { id: "loan-book", name: "Loan book", amount: Number(saccoOverview.loan_book || 0) },
            ...(operationsFund
                ? [{
                    id: "operations",
                    name: "Operation fund",
                    amount: Number(operationsFund.totals.balance || 0),
                    // The full monthly ledger lives in My reports; these totals
                    // keep the summary reachable from here in the meantime.
                    note: `${tzs(operationsFund.totals.income)} in · ${tzs(operationsFund.totals.expenses)} out`
                }]
                : [])
        ]
            .filter((slice) => slice.amount > 0)
            .sort((a, b) => b.amount - a.amount)
            .map((slice, index) => ({
                ...slice,
                formatted: tzs(slice.amount),
                colour: DEPLOYMENT_COLOURS[index % DEPLOYMENT_COLOURS.length]
            }));

        const deployedTotal = slices.reduce((sum, slice) => sum + slice.amount, 0);

        const milestoneRows = (milestoneBoard?.milestones ?? []).map((entry) => ({
            id: entry.id,
            title: entry.title,
            meta: entry.reached
                ? `${tzs(entry.target_amount)}${entry.achieved_at ? ` · reached ${formatDate(entry.achieved_at)}` : ""}`
                : `${tzs(entry.target_amount)} · ${tzs(entry.remaining_amount)} to go`,
            reached: entry.reached,
            isCurrent: entry.is_current,
            progressPercent: entry.progress_percent
        }));

        const current = milestoneBoard?.current_milestone ?? null;

        return (
            <SaccoSection
                loading={saccoOverviewLoading}
                hero={{
                    totalSavings: tzs(poolMemberFunds),
                    breakdown: `${tr("Savings", "Akiba")} ${formatCurrencyCompact(poolSavings)} · ${tr("Share capital", "Mtaji wa hisa")} ${formatCurrencyCompact(poolShares)}`,
                    note: `${tr("Contributed by", "Imechangwa na")} ${memberCount} ${tr("members of", "wanachama wa")} ${selectedTenantName || "the SACCOS"}. ${tr("Every figure below is the cooperative's position, not yours alone.", "Kila namba hapa chini ni hali ya ushirika, si yako peke yako.")}`,
                    // The member's own side is measured the same way, or their
                    // percentage would be their savings over everyone's savings
                    // plus shares — a share that shrinks the moment their own
                    // share capital is moved out of savings.
                    yourSavings: formatCurrencyCompact(totalHoldings),
                    yourSharePercent: poolMemberFunds > 0 ? `${((totalHoldings / poolMemberFunds) * 100).toFixed(2)}%` : "—",
                    averagePerMember: memberCount > 0 ? tzs(poolMemberFunds / memberCount) : "—",
                    yourRank: leaguePosition?.overall_rank
                        ? `#${leaguePosition.overall_rank} of ${leaguePosition.total_members ?? memberCount}`
                        : "—"
                }}
                deployment={slices.length ? { totalFormatted: tzs(deployedTotal), slices } : null}
                figures={[
                    {
                        id: "members",
                        label: tr("Total members", "Jumla ya wanachama"),
                        value: String(saccoOverview.total_members ?? 0),
                        helper: `${saccoOverview.active_members ?? 0} ${tr("active", "hai")}`
                    },
                    {
                        id: "shares",
                        label: tr("Share capital", "Mtaji wa hisa"),
                        value: tzs(saccoOverview.total_shares)
                    },
                    ...(saccoOverview.dividends_distributed
                        ? [{
                            id: "dividends",
                            label: tr("Dividends shared", "Gawio lililogawiwa"),
                            value: tzs(saccoOverview.dividends_distributed),
                            helper: `UTT ${tzs(saccoOverview.dividends_utt ?? 0)} · ${tr("Loans", "Mikopo")} ${tzs(saccoOverview.dividends_loan ?? 0)}`
                        }]
                        : [])
                ]}
                milestone={current
                    ? {
                        title: current.title,
                        percent: current.progress_percent,
                        detail: `${tzs(milestoneBoard?.total_contributions ?? 0)} ${tr("of", "kati ya")} ${tzs(current.target_amount)} · ${tzs(current.remaining_amount)} ${tr("to go", "zimebaki")}${current.target_date ? ` ${tr("by", "ifikapo")} ${formatDate(current.target_date)}` : ""}`
                    }
                    : null}
                milestones={milestoneRows}
            />
        );
    };

    const renderOverviewView = () => (
        <OverviewSection
            nextStep={overviewNextStep}
            hero={{
                totalSavings: formatCurrency(totalHoldings),
                breakdown: totalShareCapital > 0
                    ? `${tr("Savings", "Akiba")} ${formatCurrencyCompact(totalSavings)} · ${tr("Share capital", "Mtaji wa hisa")} ${formatCurrencyCompact(totalShareCapital)}`
                    : undefined,
                // Only when a loan makes it different. With nothing owed it is
                // the total again, and a pill repeating the figure above it
                // sends the reader looking for a difference that is not there.
                netPositionCompact: totalOutstandingLoans > 0
                    ? formatCurrencyCompact(netPosition)
                    : undefined,
                statusLabel: savingsTargetLevel.label,
                entriesLabel: `${transactionCount} ${tr("entries", "miamala")}`,
                targetPercent: savingsTargetProgress,
                annualTarget: formatCurrency(annualSavingsTarget),
                remaining: savingsTargetRemaining > 0 ? formatCurrency(savingsTargetRemaining) : "Target met",
                neededNow: savingsTargetNextRequired > 0 ? formatCurrency(savingsTargetNextRequired) : "Clear"
            }}
            kpis={[
                {
                    id: "holdings",
                    label: tr("Total holdings", "Jumla ya ulichonacho"),
                    value: formatCurrencyCompact(totalHoldings),
                    valueTitle: formatCurrency(totalHoldings),
                    helper: `${tr("Savings", "Akiba")} ${formatCurrencyCompact(totalSavings)} · ${tr("Shares", "Hisa")} ${formatCurrencyCompact(totalShareCapital)}`,
                    chip: tr("Savings + shares", "Akiba + hisa"),
                    tone: "ok"
                },
                // Holdings less what is owed. Identical to holdings for a member
                // with no loan, and two cards showing the same figure invite the
                // reader to hunt for a difference that is not there — so it is
                // shown only when there is a debt for it to net off.
                ...(totalOutstandingLoans > 0 ? [{
                    id: "net",
                    label: tr("Net position", "Hali yako kwa ujumla"),
                    value: formatCurrencyCompact(netPosition),
                    valueTitle: formatCurrency(netPosition),
                    helper: `${transactionCount} ${tr("entries on record", "miamala iliyoandikwa")}`,
                    chip: netPosition >= 0 ? tr("Positive", "Chanya") : tr("Negative", "Hasi"),
                    tone: "info" as const
                }] : []),
                {
                    id: "savings",
                    label: tr("Savings", "Akiba"),
                    value: formatCurrencyCompact(totalSavings),
                    valueTitle: formatCurrency(totalSavings),
                    helper: `${Math.round(savingsTargetProgress)}% ${tr("of", "ya")} ${formatCurrencyCompact(annualSavingsTarget)} ${tr("target", "lengo")}`,
                    chip: savingsTargetLevel.label,
                    tone: "ok"
                },
                {
                    id: "dividends",
                    label: tr("Dividends", "Gawio"),
                    value: formatCurrencyCompact(totalDividends),
                    valueTitle: formatCurrency(totalDividends),
                    helper: tr("Allocations posted", "Mgao uliowekwa"),
                    chip: totalDividends > 0 ? tr("Credited", "Umepokea") : tr("Building", "Bado linajengwa"),
                    tone: "gold"
                },
                {
                    id: "shares",
                    label: tr("Share capital", "Mtaji wa hisa"),
                    value: formatCurrencyCompact(totalShareCapital),
                    valueTitle: formatCurrency(totalShareCapital),
                    helper: shareRequirement
                        ? `${shareRequirement.required_shares} ${tr("shares at", "hisa kwa")} ${formatCurrencyCompact(shareRequirement.price_per_share)}`
                        : tr("Your holding in the SACCOS", "Umiliki wako kwenye SACCOS"),
                    chip: shareCapitalStillInSavings
                        ? tr("In savings", "Ipo kwenye akiba")
                        : tr("Paid up", "Imekamilika"),
                    tone: "gold"
                },
                {
                    id: "loans",
                    label: tr("Loans", "Mikopo"),
                    value: formatCurrencyCompact(totalOutstandingLoans),
                    valueTitle: formatCurrency(totalOutstandingLoans),
                    helper: activeLoanCount ? `${activeLoanCount} ${tr("active", "hai")}` : tr("No exposure", "Huna deni"),
                    chip: activeLoanCount ? tr("Monitor", "Fuatilia") : tr("Clear", "Safi"),
                    tone: "danger"
                }
            ]}
            capacity={{
                headline: dashboardLoanCapacityLoading
                    ? tr("Refreshing current limits\u2026", "Inasasisha vikomo\u2026")
                    : dashboardCapacityProductName
                        ? `${tr("Best available", "Bora inayopatikana")}: ${dashboardCapacityProductName}`
                        : tr("Current lending position", "Hali yako ya kukopa sasa"),
                statusChip: dashboardLiquidityStatus
                    || (dashboardLoanCapacityError ? tr("Capacity unavailable", "Uwezo haupatikani") : tr("Live capacity", "Uwezo wa sasa")),
                statusTone: dashboardLiquidityStatus === "Healthy"
                    ? "ok"
                    : dashboardLiquidityStatus === "Warning"
                        ? "warn"
                        : dashboardLiquidityStatus === "Risk" || dashboardLiquidityStatus === "Frozen"
                            ? "danger"
                            : "info",
                tiles: [
                    {
                        id: "savings-limit",
                        label: tr("Savings-based limit", "Kikomo cha akiba"),
                        value: formatCurrencyCompact(dashboardSavingsBasedLimit),
                        valueTitle: formatCurrency(dashboardSavingsBasedLimit)
                    },
                    {
                        id: "exposure",
                        label: tr("Current loan exposure", "Deni ulilonalo sasa"),
                        value: formatCurrencyCompact(dashboardCurrentLoanExposure),
                        valueTitle: formatCurrency(dashboardCurrentLoanExposure)
                    },
                    {
                        id: "guarantor",
                        label: tr("Pledged as guarantor", "Uliyodhamini"),
                        value: formatCurrencyCompact(dashboardGuarantorExposure),
                        valueTitle: formatCurrency(dashboardGuarantorExposure),
                        note: dashboardGuarantorExposure > 0 ? "Uliyowadhamini wenzako" : "Hujadhamini mtu"
                    },
                    {
                        id: "available",
                        label: tr("New loan available now", "Mkopo mpya unaoweza kupata sasa"),
                        value: formatCurrencyCompact(dashboardMaximumBorrowable),
                        valueTitle: formatCurrency(dashboardMaximumBorrowable),
                        gold: true
                    }
                ],
                note: dashboardLoanCapacityError
                    || (dashboardMaximumBorrowable < dashboardSavingsBasedLimit && dashboardSavingsBasedLimit > 0
                        ? `Akiba yako inaruhusu ${formatCurrency(dashboardSavingsBasedLimit)}, lakini kikomo cha bidhaa/ukwasi wa SACCO kinaishia ${formatCurrency(dashboardMaximumBorrowable)}. Informational \u2014 final approval via branch appraisal.`
                        : "Informational \u2014 final approval via branch appraisal.")
            }}
            detailCards={(
                <DetailCards
                    savings={{
                        total: formatCurrency(totalSavings),
                        available: formatCurrency(availableSavings),
                        locked: formatCurrency(lockedSavings),
                        shareCapital: formatCurrency(shareCapitalHeldInSavings),
                        shareCapitalNote
                    }}
                    loan={{
                        outstanding: formatCurrency(totalOutstandingLoans),
                        nextInstallmentDate: nextPaymentDue ? formatDate(nextPaymentDue) : "N/A",
                        monthlyInstallment: formatCurrency(monthlyInstallment),
                        lastPayment: lastLoanPayment ? formatDate(lastLoanPayment.transaction_date) : "None yet",
                        progressPercent: loanProgressPercent
                    }}
                    limit={{
                        borrowLimit: formatCurrency(dashboardMaximumBorrowable),
                        savingsBasedLimit: formatCurrency(dashboardSavingsBasedLimit),
                        alreadyBorrowed: formatCurrency(dashboardCurrentLoanExposure),
                        pledged: formatCurrency(dashboardGuarantorExposure)
                    }}
                />
            )}
            trendChart={(
                <SavingsTrendChart
                    series={savingsTrendSeries}
                    fallbackLabels={savingsTrendLabels.length ? savingsTrendLabels : chartLabels}
                    fallbackValues={savingsTrendValues.length ? savingsTrendValues : chartValues}
                    bare
                />
            )}
            alerts={memberAlerts.map((alert) => ({
                id: alert.id,
                title: alert.title,
                body: alert.message,
                tone: alert.severity === "error"
                    ? "danger"
                    : alert.severity === "warning"
                        ? "gold"
                        : alert.severity === "info"
                            ? "info"
                            : "neutral"
            }))}
            league={leagueEnabled && leaguePosition?.tier
                ? {
                    tierName: leaguePosition.tier.name,
                    rankLabel: leaguePosition.overall_rank
                        ? `#${leaguePosition.overall_rank} of ${leaguePosition.total_members ?? 0}`
                        : "Unranked",
                    note: leaguePosition.next_tier
                        ? `${formatCurrency(leaguePosition.next_tier.amount_needed)} to reach ${leaguePosition.next_tier.name}.`
                        : "You are in the top league.",
                    onOpen: () => handleSectionSelect("member-league")
                }
                : null}
            transactions={statements.slice(0, 5).map((row, index) => ({
                id: row.transaction_id || `${row.transaction_date}-${index}`,
                date: formatDate(row.transaction_date),
                type: formatTxType(row.transaction_type),
                direction: row.direction === "in" ? "credit" : "debit",
                amount: formatCurrency(Number(row.amount || 0)),
                balanceAfter: formatCurrency(Number(row.running_balance || 0))
            }))}
            onViewStatement={handleDownloadStatement}
            onViewTransactions={() => handleSectionSelect("member-transactions")}
            payAccount={saccoBankAccount?.accountNumber
                ? {
                    accountNumber: saccoBankAccount.accountNumber,
                    accountName: saccoBankAccount.accountName,
                    bankLine: [saccoBankAccount.bankName, saccoBankAccount.bankBranch].filter(Boolean).join(" \u00b7 ") || null,
                    instructions: saccoBankAccount.instructions,
                    onCopy: () => void copyPayAccountNumber(),
                    copied: payAccountCopied
                }
                : null}
        />
    );

    const renderLeagueView = () => {
        const tzs = (value: number) => `TSh ${new Intl.NumberFormat("en-US").format(Math.round(Number(value) || 0))}`;
        const tier = leaguePosition?.tier;

        if (!leaguePosition?.league_enabled || !tier) {
            return (
                <MotionCard variant="outlined" sx={contentCardSx}>
                    <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Savings league</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            The savings league is not switched on for this SACCO yet.
                        </Typography>
                    </CardContent>
                </MotionCard>
            );
        }

        const showAmounts = leagueStandings?.show_amounts_to_members ?? false;
        const myRank = leaguePosition.overall_rank ?? 0;
        const myAmount = Number(leaguePosition.amount || 0);
        const rows = leagueStandings?.standings ?? [];

        // Ranks either side of the member. Names are withheld by design — other
        // members appear as their member number only.
        const aroundYou = rows
            .filter((row) => Math.abs(row.overall_rank - myRank) <= 2)
            .sort((left, right) => left.overall_rank - right.overall_rank)
            .map((row) => {
                const isYou = row.overall_rank === myRank;
                const gapAmount = Number(row.amount || 0) - myAmount;
                return {
                    id: `${row.overall_rank}-${row.member_no}`,
                    rank: row.overall_rank,
                    label: isYou ? "You" : `Member ${row.member_no}`,
                    gap: isYou
                        ? "Your position"
                        : !showAmounts
                            ? gapAmount > 0 ? "Ahead of you" : "Behind you"
                            : gapAmount > 0
                                ? `${tzs(gapAmount)} ahead of you`
                                : `${tzs(Math.abs(gapAmount))} behind you`,
                    amount: tzs(Number(row.amount || 0)),
                    isYou
                };
            });

        // Highest league first, matching the handoff's Diamond-down ordering.
        const ladderTiers = leagueStandings?.tiers ?? leaguePosition.tiers ?? [];
        const ladder = [...ladderTiers]
            .map((entry, index) => ({ entry, index }))
            .sort((left, right) => right.index - left.index)
            .map(({ entry, index }) => ({
                id: `${index}-${entry.name}`,
                name: entry.name,
                colour: leagueColour(entry.name, entry.color),
                band: entry.max_amount
                    ? `${tzs(entry.min_amount)} – ${tzs(entry.max_amount)}`
                    : `${tzs(entry.min_amount)}+`,
                count: Number(entry.member_count || 0),
                isYours: index === tier.index
            }));

        const movementInfo = leaguePosition.movement;
        const rankChange = movementInfo?.rank_change ?? 0;

        const climbRace = leaguePosition.position_race?.climb ?? null;
        const defendRace = leaguePosition.position_race?.defend ?? null;
        const nextTier = leaguePosition.next_tier ?? null;

        const guidance = [
            ...(climbRace
                ? [{
                    id: "climb",
                    before: "Add ",
                    amount: tzs(climbRace.amount_needed),
                    after: ` to climb to #${climbRace.overall_rank}.`
                }]
                : []),
            ...(defendRace
                ? [{
                    id: "defend",
                    before: `#${defendRace.overall_rank} is `,
                    amount: tzs(defendRace.amount_buffer),
                    after: " behind you."
                }]
                : [])
        ];

        // Four months is the pace the handoff quotes for the next tier.
        const monthsToNextTier = 4;

        return (
            <LeagueSection
                tierName={tier.name}
                tierColour={leagueColour(tier.name, tier.color)}
                amount={tzs(myAmount)}
                showAmounts={showAmounts}
                tierRankLabel={leaguePosition.tier_rank && leaguePosition.tier_size
                    ? `#${leaguePosition.tier_rank} of ${leaguePosition.tier_size} in league`
                    : tier.name}
                overallRankLabel={myRank ? `Overall #${myRank} of ${leaguePosition.total_members ?? 0}` : "Unranked"}
                movement={movementInfo
                    ? {
                        label: rankChange > 0
                            ? `Up ${rankChange} position${rankChange === 1 ? "" : "s"}`
                            : rankChange < 0
                                ? `Down ${Math.abs(rankChange)} position${Math.abs(rankChange) === 1 ? "" : "s"}`
                                : "Holding position",
                        direction: rankChange > 0 ? "up" : rankChange < 0 ? "down" : "same"
                    }
                    : null}
                nextTier={nextTier
                    ? {
                        name: nextTier.name,
                        percent: nextTier.min_amount > 0 ? (myAmount / nextTier.min_amount) * 100 : 0,
                        toGo: tzs(nextTier.amount_needed)
                    }
                    : null}
                guidance={guidance}
                aroundYou={aroundYou}
                ladder={ladder}
                climb={movementInfo
                    ? {
                        previousRank: movementInfo.previous_overall_rank,
                        currentRank: myRank,
                        change: rankChange
                    }
                    : null}
                howToClimb={[
                    ...(climbRace
                        ? [{
                            id: "rank",
                            title: `Reach #${climbRace.overall_rank}`,
                            detail: `${tzs(climbRace.amount_needed)} more in savings takes the next position.`
                        }]
                        : []),
                    ...(nextTier
                        ? [{
                            id: "tier",
                            title: `Enter ${nextTier.name}`,
                            detail: `${tzs(nextTier.amount_needed)} more — about ${tzs(nextTier.amount_needed / monthsToNextTier)} a month for ${monthsToNextTier} months.`
                        }]
                        : [])
                ]}
                onContribute={canUsePortalDeposits ? () => openDepositDialog("savings_deposit") : undefined}
            />
        );
    };

    const renderAccountsView = () => {
        // The share account's own balance, which is genuinely zero for every
        // member: share capital was always collected into savings and never
        // posted across. Kept so the figure can be compared with the holding.
        const shareAccountBalance = filteredAccounts
            .filter((account) => account.product_type === "shares")
            .reduce((sum, account) => sum + Number(account.available_balance || 0) + Number(account.locked_balance || 0), 0);
        const shareCapital = Math.max(shareAccountBalance, shareCapitalHeldInSavings);

        return (
            <AccountsSection
                kpis={[
                    {
                        id: "savings",
                        label: tr("Savings balance", "Salio la akiba"),
                        value: formatCurrencyCompact(totalSavings),
                        helper: tr("Visible savings accounts combined.", "Akaunti zote za akiba zinazoonekana kwa pamoja."),
                        tone: "ok"
                    },
                    {
                        id: "accounts",
                        label: tr("Visible accounts", "Akaunti zinazoonekana"),
                        value: String(filteredAccounts.length),
                        helper: tr("Accounts held in your name.", "Akaunti zilizo kwa jina lako."),
                        tone: "info"
                    },
                    {
                        id: "dividends",
                        label: tr("My dividends", "Gawio langu"),
                        value: formatCurrencyCompact(totalDividends),
                        helper: tr("Allocations credited to you.", "Mgao ulioingizwa kwako."),
                        tone: "gold"
                    },
                    {
                        id: "shares",
                        label: tr("Share capital", "Mtaji wa hisa"),
                        value: formatCurrencyCompact(shareCapital),
                        helper: shareCapital > shareAccountBalance
                            ? tr("Held inside your savings, not yet moved across.", "Zipo ndani ya akiba yako, hazijahamishwa bado.")
                            : tr("Held in your share account.", "Zipo kwenye akaunti yako ya hisa."),
                        tone: "info"
                    }
                ]}
                accounts={filteredAccounts.map((account) => ({
                    id: account.id,
                    accountNumber: account.account_number,
                    accountName: account.account_name,
                    product: account.product_type === "savings"
                        ? tr("Savings", "Akiba")
                        : account.product_type === "shares"
                            ? tr("Shares", "Hisa")
                            : tr("Fixed deposit", "Amana ya muda maalum"),
                    status: titleCase(account.status) || account.status,
                    statusTone: account.status === "active" ? "ok" : account.status === "dormant" ? "gold" : "danger",
                    opened: formatDate(account.created_at),
                    balance: formatCurrency(Number(account.available_balance || 0) + Number(account.locked_balance || 0))
                }))}
                onExport={() => handleDownloadFilteredStatement(sortedStatements, "Account statement")}
                onPrint={() => window.print()}
                rules={[
                    tr("Savings minimum balance: TSh 50,000", "Salio la chini la akiba: TSh 50,000"),
                    tr("Withdrawal limit: branch teller-review threshold", "Kikomo cha kutoa: kiwango kinachohitaji ukaguzi wa tawi"),
                    tr("Dormant: no qualifying movement in the period", "Imelala: hakuna muamala uliokidhi katika kipindi hicho"),
                    canUsePortalDeposits
                        ? tr("Self-service deposits are switched on for members", "Wanachama wanaruhusiwa kuweka fedha wenyewe")
                        : tr(
                            "Self-service deposits are switched off — pay into the SACCOS bank account",
                            "Kuweka fedha wewe mwenyewe kumezimwa — lipa kwenye akaunti ya benki ya SACCOS"
                        )
                ]}
                health={[
                    { id: "active", label: tr("Active", "Hai"), value: String(filteredAccounts.length - accountDormancyCount) },
                    { id: "dormant", label: tr("Dormant", "Imelala"), value: String(accountDormancyCount) },
                    { id: "interest", label: tr("Interest postings", "Riba iliyowekwa"), value: String(filteredInterestHistory.length) },
                    { id: "dividends", label: tr("Dividend mappings", "Mgao wa gawio"), value: String(filteredDividendMapping.length) }
                ]}
                interestPostings={filteredInterestHistory.length}
                dividends={filteredDividendMapping.map((row) => ({
                    id: row.transaction_id,
                    date: formatDate(row.transaction_date),
                    reference: getAuditReference(row),
                    direction: row.direction === "in" ? "credit" : "debit",
                    amount: formatCurrency(row.amount),
                    runningBalance: formatCurrency(row.running_balance)
                }))}
                dividendTotalCount={filteredDividendMapping.length}
                depositSlot={canUsePortalDeposits ? (
                    <section className={memberContentStyles.section}>
                        <div className={memberContentStyles.sectionHead}>
                            <div style={{ minWidth: 0 }}>
                                <h2 className={memberContentStyles.sectionTitle}>Make a savings deposit</h2>
                                <p className={memberContentStyles.sectionNote}>
                                    Pay from your registered mobile money number. The deposit posts to your savings account once approved.
                                </p>
                            </div>
                            <button
                                type="button"
                                className={memberContentStyles.btnGold}
                                onClick={() => openDepositDialog("savings_deposit")}
                                disabled={submittingContribution}
                            >
                                Start a deposit
                            </button>
                        </div>
                        {latestAccountsDepositPaymentOrder ? (
                            <p className={memberContentStyles.secondary} style={{ margin: 0 }}>
                                Latest request: {formatCurrency(latestAccountsDepositPaymentOrder.amount)} via{" "}
                                {latestAccountsDepositPaymentOrder.provider.toUpperCase()} ·{" "}
                                {latestAccountsDepositPaymentOrder.status.replace(/_/g, " ")}
                            </p>
                        ) : null}
                    </section>
                ) : null}
            />
        );
    };

    const renderLoansView = () => (
        <Stack spacing={3}>
            <LoansHero
                borrowLimit={formatCurrency(dashboardMaximumBorrowable)}
                explanation={
                    canApplyForLoan
                        ? "Your limit is based on your savings and the SACCO's current lending capacity. The rate and repayment terms are shown before you submit — final approval is made at branch appraisal."
                        : "Loan applications are currently unavailable. Your limit is shown so you know where you stand."
                }
                canApply={canApplyForLoan}
                applyLabel="Apply for a loan"
                onApply={canApplyForLoan ? openLoanApplicationDraft : undefined}
                figures={[
                    { id: "active", label: "Active loans", value: String(filteredActiveLoanCount) },
                    { id: "outstanding", label: "Outstanding", value: formatCurrencyCompact(filteredLoansOutstanding) },
                    { id: "due", label: "Next due", value: nextPaymentDue ? formatDate(nextPaymentDue) : "N/A" },
                    { id: "pledged", label: tr("Pledged as guarantor", "Uliyodhamini"), value: formatCurrencyCompact(dashboardGuarantorExposure) }
                ]}
            />

            {activeLoanProducts.length ? (
                <MotionCard variant="outlined" sx={contentCardSx}>
                    <CardContent sx={{ p: { xs: 1.75, md: 2.25 } }}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>Loan Products &amp; Terms</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, mb: 2 }}>
                            Understand each loan&apos;s amount, interest rate, maximum repayment time, and guarantor requirements before you apply.
                        </Typography>
                        {memberPortalPaymentControls.loan_application_guide ? (
                            <Accordion defaultExpanded disableGutters elevation={0} sx={{ mb: 2, bgcolor: "transparent", border: "1px solid", borderColor: "divider", borderRadius: 2, "&:before": { display: "none" } }}>
                                <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>How to apply for a loan</Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 0 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                                        {memberPortalPaymentControls.loan_application_guide}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        ) : null}
                        <Grid container spacing={2}>
                            {activeLoanProducts.map((product) => (
                                <Grid key={product.id} size={{ xs: 12, lg: 6 }}>
                                    <LoanTermsCard
                                        product={product}
                                        recommended={Boolean(
                                            dashboardCapacityProductName
                                            && product.name === dashboardCapacityProductName
                                        )}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </MotionCard>
            ) : null}

            <LoanApplicationsPanel
                available={canApplyForLoan}
                openCount={pendingLoanApplications.length}
                applications={loanApplications.slice(0, 3).map((application) => {
                    const tone = getApplicationTone(application.status);
                    const applicationTone: "ok" | "info" | "gold" | "danger" =
                        application.status === "approved"
                            ? "ok"
                            : application.status === "rejected"
                                ? "danger"
                                : application.status === "appraised"
                                    ? "gold"
                                    : "info";

                    return {
                        id: application.id,
                        productName: application.loan_products?.name || "Loan application",
                        amount: formatCurrency(application.requested_amount),
                        terms: `${application.requested_term_count} term${application.requested_term_count === 1 ? "" : "s"}`,
                        updated: formatDate(application.updated_at),
                        statusLabel: tone.label,
                        tone: applicationTone,
                        rejectionReason: application.status === "rejected" ? application.rejection_reason : null,
                        notes: application.status === "rejected" ? application.approval_notes : null,
                        guidance: application.status === "rejected"
                            ? "You can add more savings as guarantee, or ask another member to guarantee you, then resubmit."
                            : null,
                        actions: application.status === "rejected"
                            ? [{
                                id: "resubmit",
                                label: tr("Edit and resubmit", "Hariri na uwasilishe tena"),
                                variant: "primary" as const,
                                onClick: () => openLoanApplicationEditor(application)
                            }]
                            : application.status === "draft"
                                ? [
                                    {
                                        id: "continue",
                                        label: tr("Continue draft", "Endelea na rasimu"),
                                        variant: "outline" as const,
                                        onClick: () => openLoanApplicationEditor(application)
                                    },
                                    {
                                        id: "delete",
                                        label: deletingLoanApplicationId === application.id ? "Deleting…" : "Delete draft",
                                        variant: "danger" as const,
                                        disabled: deletingLoanApplicationId === application.id,
                                        onClick: () => setPendingDraftDeletion(application)
                                    }
                                ]
                                : []
                    };
                })}
                tableSlot={canApplyForLoan ? (
                    <DataTable
                        rows={loanApplications}
                        columns={loanApplicationColumns}
                        emptyMessage="No loan applications submitted yet."
                    />
                ) : null}
            />

            {guarantorRequests.length ? (
                <section className={memberContentStyles.section}>
                    <div className={memberContentStyles.sectionHead}>
                        <div style={{ minWidth: 0 }}>
                            <h2 className={memberContentStyles.sectionTitle}>Guarantor requests</h2>
                            <p className={memberContentStyles.sectionNote}>
                                Other members have asked you to guarantee their loan. Their application cannot proceed until you respond.
                            </p>
                        </div>
                        <span
                            className={`${memberContentStyles.chip} ${
                                pendingGuarantorRequests.length ? memberContentStyles.chipGold : memberContentStyles.chipOk
                            }`}
                        >
                            {pendingGuarantorRequests.length} pending
                        </span>
                    </div>
                    <DataTable
                        rows={guarantorRequests}
                        columns={guarantorRequestColumns}
                        emptyMessage="No guarantor requests assigned to your member profile."
                    />
                </section>
            ) : null}

            <Dialog
                open={Boolean(guarantorAcceptTarget)}
                onClose={() => setGuarantorAcceptTarget(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Accept Guarantee Request</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ pt: 0.5 }}>
                        <Typography variant="body2">
                            {guarantorAcceptTarget?.borrower?.full_name || "The borrower"} asked you to guarantee{" "}
                            <strong>{formatCurrency(guarantorAcceptTarget?.guaranteed_amount || 0)}</strong>.
                            You can accept the full amount or enter the amount you are able to cover.
                        </Typography>
                        <TextField
                            fullWidth
                            type="number"
                            label="Amount you agree to guarantee"
                            value={guarantorAcceptAmount}
                            onChange={(event) => setGuarantorAcceptAmount(event.target.value)}
                            helperText={`Maximum ${formatCurrency(guarantorAcceptTarget?.guaranteed_amount || 0)}. This amount stays locked in your savings until the loan is repaid.`}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setGuarantorAcceptTarget(null)}>Cancel</Button>
                    <Button
                        variant="contained"
                        disabled={
                            !guarantorAcceptTarget
                            || processingGuarantorRequestId === guarantorAcceptTarget.id
                            || !(Number(guarantorAcceptAmount) > 0)
                            || Number(guarantorAcceptAmount) > Number(guarantorAcceptTarget.guaranteed_amount || 0)
                        }
                        onClick={() => {
                            if (guarantorAcceptTarget) {
                                void respondGuarantorRequest(guarantorAcceptTarget, "accepted", Number(guarantorAcceptAmount));
                            }
                        }}
                    >
                        Accept Guarantee
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={Boolean(manageGuarantorsTarget)}
                onClose={savingGuarantorPlan ? undefined : closeManageGuarantorsDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Manage Guarantors</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={1.5} sx={{ pt: 0.5 }}>
                        <Alert severity="info" variant="outlined">
                            {activeRequiredGuarantee > 0
                                ? `Your guarantors must cover ${formatCurrency(activeRequiredGuarantee)} in total. Guarantors who declined have been removed — replace them or adjust amounts, and changed guarantors will be asked to accept again.`
                                : "This loan is fully covered by your savings — guarantors are witnesses only."}
                        </Alert>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Search guarantor by name or member number"
                                value={guarantorLookupNo}
                                onChange={(event) => setGuarantorLookupNo(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        void lookupGuarantorByMemberNo(guarantorSuggestions[0]);
                                    }
                                }}
                            />
                            <Button
                                variant="outlined"
                                onClick={() => void lookupGuarantorByMemberNo(guarantorSuggestions[0])}
                                disabled={guarantorLookupBusy || !guarantorLookupNo.trim() || guarantorDrafts.length >= guarantorMaxCount}
                                sx={{ whiteSpace: "nowrap" }}
                            >
                                {guarantorLookupBusy ? "Checking..." : "Add"}
                            </Button>
                        </Stack>
                        {guarantorSuggestions.length ? (
                            <Paper variant="outlined" sx={{ borderRadius: 1 }}>
                                {guarantorSuggestions.map((hit) => (
                                    <Button
                                        key={hit.member_id}
                                        fullWidth
                                        onClick={() => void lookupGuarantorByMemberNo(hit)}
                                        disabled={guarantorLookupBusy}
                                        sx={{ justifyContent: "space-between", textTransform: "none", px: 1.5 }}
                                    >
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{hit.full_name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{hit.member_no}</Typography>
                                    </Button>
                                ))}
                            </Paper>
                        ) : guarantorSearchState === "searching" ? (
                            <Typography variant="caption" color="text.secondary">
                                Searching members...
                            </Typography>
                        ) : guarantorSearchState === "error" ? (
                            <Alert severity="error" variant="outlined" sx={{ py: 0.35 }}>
                                {guarantorSearchError}
                            </Alert>
                        ) : guarantorSearchState === "done" ? (
                            <Typography variant="caption" color="text.secondary">
                                No other active member matches "{guarantorLookupNo.trim()}". Try a surname or the full member number — you cannot guarantee your own loan, so your own name will not appear.
                            </Typography>
                        ) : null}
                        {guarantorDrafts.map((row, index) => (
                            <Paper key={row.member_id} variant="outlined" sx={{ p: 1.25, borderRadius: 1 }}>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} justifyContent="space-between">
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.full_name}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {row.member_no}{row.available_amount !== null && activeRequiredGuarantee > 0
                                                ? ` · can guarantee up to ${formatCurrency(row.available_amount)}`
                                                : ""}
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        {activeRequiredGuarantee > 0 ? (
                                            <TextField
                                                size="small"
                                                type="number"
                                                label="Amount"
                                                value={row.guaranteed_amount || ""}
                                                onChange={(event) => {
                                                    const nextValue = Number(event.target.value) || 0;
                                                    setGuarantorDrafts((prev) => prev.map((item, itemIndex) =>
                                                        itemIndex === index ? { ...item, guaranteed_amount: nextValue } : item));
                                                }}
                                                sx={{ width: 150 }}
                                            />
                                        ) : (
                                            <Chip size="small" variant="outlined" label="Witness" />
                                        )}
                                        <IconButton
                                            size="small"
                                            onClick={() => setGuarantorDrafts((prev) => prev.filter((item) => item.member_id !== row.member_id))}
                                            aria-label="Remove guarantor"
                                        >
                                            <CloseRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </Stack>
                            </Paper>
                        ))}
                        {activeRequiredGuarantee > 0 ? (
                            <Stack spacing={0.5}>
                                <LinearProgress
                                    variant="determinate"
                                    value={Math.min(100, activeRequiredGuarantee ? (allocatedGuaranteeAmount / activeRequiredGuarantee) * 100 : 0)}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                                <Typography variant="caption" color={activeRemainingGuarantee > 0 ? "warning.main" : "success.main"}>
                                    {formatCurrency(allocatedGuaranteeAmount)} / {formatCurrency(activeRequiredGuarantee)} allocated
                                    {activeRemainingGuarantee > 0 ? ` — ${formatCurrency(activeRemainingGuarantee)} remaining` : " — fully covered"}
                                </Typography>
                            </Stack>
                        ) : null}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeManageGuarantorsDialog} disabled={savingGuarantorPlan}>Cancel</Button>
                    <Button variant="contained" onClick={() => void saveGuarantorPlan()} disabled={savingGuarantorPlan}>
                        {savingGuarantorPlan ? "Saving..." : "Save Guarantors"}
                    </Button>
                </DialogActions>
            </Dialog>

            <MemberLoanWorkspaceCard
                selectedLoan={selectedLoan}
                loans={filteredLoans}
                loanSchedules={loanSchedules}
                loanTransactions={loanTransactions}
                loanDetailId={loanDetailId}
                onLoanChange={setLoanDetailId}
                latestLoanRepaymentPaymentOrder={latestLoanRepaymentPaymentOrder}
                loanRepaymentEnabled={loanRepaymentSelfServiceEnabled}
                canShowLoanRepaymentOption={canShowLoanRepaymentOption}
                hasRepaymentLoanOption={Boolean(portalRepaymentLoans.length)}
                submittingContribution={submittingContribution}
                onRepay={() => openDepositDialog("loan_repayment", selectedLoan?.id || portalRepaymentLoans[0]?.id || null)}
                onDownloadStatement={handleDownloadLoanStatement}
                onPrint={() => window.print()}
                repayButtonSx={
                    isDarkMode
                        ? { bgcolor: memberAccent, color: "#1a1a1a", "&:hover": { bgcolor: memberAccentAlt } }
                        : undefined
                }
            />


            <LoanStatusDonut
                outstanding={Math.max(filteredLoansOutstanding, 0)}
                buffer={Math.max(totalVisibleCapital - filteredLoansOutstanding, 0)}
                outstandingLabel={formatCurrency(Math.max(filteredLoansOutstanding, 0))}
                bufferLabel={formatCurrency(Math.max(totalVisibleCapital - filteredLoansOutstanding, 0))}
            />

            <MotionCard variant="outlined" sx={contentCardSx}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        My Loans
                    </Typography>
                    <DataTable rows={filteredLoans} columns={loanColumns} emptyMessage="No loan records found for selected date range." />
                </CardContent>
            </MotionCard>

            <div className={loanLayoutStyles.scheduleSplit}>
                <section className={memberContentStyles.section}>
                    <div className={memberContentStyles.sectionHead}>
                        <div style={{ minWidth: 0 }}>
                            <h2 className={memberContentStyles.sectionTitle}>Amortization schedule</h2>
                            <p className={memberContentStyles.sectionNote}>
                                What falls due on each installment, and what has been settled.
                            </p>
                        </div>
                    </div>
                    {filteredLoanSchedules.length ? (
                        <>
                            <DataTable
                                rows={paginatedLoanSchedules.map((schedule) => ({
                                    ...schedule,
                                    penalty_estimate: estimatePenaltyForSchedule(schedule)
                                }))}
                                columns={[
                                    { key: "no", header: "Installment", render: (row) => String(row.installment_number) },
                                    { key: "due", header: "Due Date", render: (row) => formatDate(row.due_date) },
                                    { key: "principal", header: "Principal", render: (row) => formatCurrency(row.principal_due) },
                                    { key: "interest", header: "Interest", render: (row) => formatCurrency(row.interest_due) },
                                    { key: "penalty", header: "Penalty", render: (row: LoanSchedule & { penalty_estimate: number }) => formatCurrency(row.penalty_estimate) },
                                    { key: "status", header: "Status", render: (row) => row.status }
                                ]}
                            />
                            <TablePagination
                                component="div"
                                count={filteredLoanSchedules.length}
                                page={loanSchedulePage}
                                onPageChange={(_, value) => setLoanSchedulePage(value)}
                                rowsPerPage={loanScheduleRowsPerPage}
                                onRowsPerPageChange={(event) => {
                                    setLoanScheduleRowsPerPage(Number(event.target.value));
                                    setLoanSchedulePage(0);
                                }}
                                rowsPerPageOptions={[5, 10, 20]}
                            />
                        </>
                    ) : (
                        <EmptyState
                            icon={<EventRoundedIcon />}
                            title="No repayment schedule yet"
                            body="A schedule is generated when a loan is disbursed. It lists every installment, its due date, and how much of it is principal, interest and any penalty."
                            tone="info"
                            action={canApplyForLoan
                                ? { label: "Apply for a loan", onClick: openLoanApplicationDraft }
                                : undefined}
                        />
                    )}
                </section>

                <section className={memberContentStyles.section}>
                    <div className={memberContentStyles.sectionHead}>
                        <div style={{ minWidth: 0 }}>
                            <h2 className={memberContentStyles.sectionTitle}>Loan document vault</h2>
                            <p className={memberContentStyles.sectionNote}>
                                Agreement copies and annexes, linked by branch operations for audit-ready access.
                            </p>
                        </div>
                    </div>

                    <EmptyState
                        icon={<DescriptionRoundedIcon />}
                        title="Agreement copy unavailable"
                        body="No signed agreement has been linked to your record yet. The branch can give you a copy for your own files."
                        tone="gold"
                        action={{
                            label: tr("Request document from branch", "Omba hati kutoka tawini"),
                            onClick: () => pushToast({
                                type: "success",
                                title: tr("How to get your copy", "Jinsi ya kupata nakala yako"),
                                message: tr("Ask your branch for a copy of your loan agreement — they can email or print it for you.", "Omba tawi lako nakala ya mkataba wako wa mkopo — wanaweza kukutumia kwa barua pepe au kukuchapishia.")
                            })
                        }}
                    />

                    {!loanRepaymentSelfServiceEnabled ? (
                        <p className={memberContentStyles.secondary} style={{ marginTop: 14, marginBottom: 0 }}>
                            Self-service loan repayment is switched off. Repay at the branch or by bank transfer, using your member number as the reference.
                        </p>
                    ) : null}
                </section>
            </div>

            <section className={memberContentStyles.section}>
                <div className={memberContentStyles.sectionHead}>
                    <div style={{ minWidth: 0 }}>
                        <h2 className={memberContentStyles.sectionTitle}>Repayment history</h2>
                        <p className={memberContentStyles.sectionNote}>
                            Every repayment posted against your loans, partial payments included.
                        </p>
                    </div>
                </div>
                {loanRepaymentHistory.length ? (
                    <DataTable rows={loanRepaymentHistory.slice(0, 20)} columns={statementColumns} />
                ) : (
                    <EmptyState
                        icon={<ReceiptLongRoundedIcon />}
                        title="No repayments posted yet"
                        body="Once you start repaying a loan, every payment appears here with the balance it left behind — including part payments."
                    />
                )}
            </section>
        </Stack>
    );

    const renderTransactionsView = () => (
        <TransactionsSection
            filters={[
                { id: "all", label: "All", labelSw: "Yote" },
                { id: "deposit", label: "Deposits", labelSw: "Amana" },
                { id: "withdrawal", label: "Withdrawals", labelSw: "Matoleo" },
                { id: "contribution", label: "Contributions", labelSw: "Michango" },
                { id: "dividend", label: "Dividends", labelSw: "Gawio" },
                { id: "loan", label: "Loans", labelSw: "Mikopo" }
            ]}
            activeFilter={transactionTypeFilter}
            onFilterChange={setTransactionTypeFilter}
            search={transactionSearch}
            onSearchChange={setTransactionSearch}
            onExport={() => handleDownloadFilteredStatement(filteredTransactions, "Transaction statement")}
            onPrint={() => window.print()}
            kpis={[
                {
                    id: "count",
                    label: tr("Transactions on record", "Miamala iliyoandikwa"),
                    value: String(filteredTransactions.length),
                    helper: transactionTypeFilter === "all"
                        ? "All posted entries."
                        : "Entries matching the current filter.",
                    tone: "info"
                },
                {
                    id: "balance",
                    label: tr("Latest balance", "Salio la mwisho"),
                    value: formatCurrencyCompact(latestFilteredTransaction?.running_balance || 0),
                    helper: tr("Most recent running balance.", "Salio la karibuni zaidi."),
                    tone: "ok"
                },
                {
                    id: "disputed",
                    label: tr("Disputed flags", "Miamala uliyopinga"),
                    value: String(disputedTransactionIds.length),
                    helper: disputedTransactionIds.length
                        ? tr("Raise these with the branch.", "Wasilisha hii kwa tawi.")
                        : tr("Nothing flagged for review.", "Hakuna kilichowekwa alama."),
                    tone: disputedTransactionIds.length ? "danger" : "info"
                },
                {
                    id: "validation",
                    label: tr("Balance validation", "Uhakiki wa salio"),
                    value: runningBalanceMismatches
                        ? `${runningBalanceMismatches} mismatch${runningBalanceMismatches === 1 ? "" : "es"}`
                        : tr("Validated", "Imehakikiwa"),
                    helper: tr("Running balance checked against each entry.", "Salio linalokwenda limehakikiwa kwa kila muamala."),
                    chip: runningBalanceMismatches ? tr("Check required", "Inahitaji ukaguzi") : tr("Validated", "Imehakikiwa"),
                    tone: runningBalanceMismatches ? "gold" : "ok"
                }
            ]}
            trendChart={(
                <ChartPanel
                    bare
                    title="Balance trend"
                    height={260}
                    data={{
                        labels: balanceTrend.map((entry) => entry.label),
                        datasets: [
                            {
                                label: tr("Running balance", "Salio linalokwenda"),
                                data: balanceTrend.map((entry) => entry.balance),
                                borderColor: "#2B3F8C",
                                backgroundColor: "rgba(43, 63, 140, 0.12)",
                                fill: true,
                                tension: 0.3,
                                pointRadius: 3,
                                pointHoverRadius: 5,
                                pointBackgroundColor: "#2B3F8C"
                            }
                        ]
                    }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                    }}
                />
            )}
            rows={filteredTransactions.map((row) => ({
                id: row.transaction_id,
                date: formatDate(row.transaction_date),
                reference: getAuditReference(row),
                type: formatTxType(row.transaction_type),
                direction: row.direction === "in" ? "credit" : "debit",
                amount: formatCurrency(row.amount),
                runningBalance: formatCurrency(row.running_balance),
                flagged: disputedTransactionIds.includes(row.transaction_id)
            }))}
            validationLabel={runningBalanceMismatches
                ? `${runningBalanceMismatches} mismatch${runningBalanceMismatches === 1 ? "" : "es"}`
                : "Balances validated"}
            validationOk={!runningBalanceMismatches}
            onToggleFlag={toggleDisputeFlag}
        />
    );

    const renderContributionsView = () => {
        const complianceCapped = Math.min(Math.max(contributionComplianceRatio, 0), 100);
        const targetToneColor = performanceTargetPosition.statusTone === "danger"
            ? brandColors.danger
            : performanceTargetPosition.statusTone === "warning"
                ? "#9A6700"
                : performanceTargetPosition.statusTone === "success"
                    ? brandColors.success
                    : memberAccent;
        const contributionScheduleToneColor = contributionScheduleStatus === "Overdue"
            ? brandColors.danger
            : contributionScheduleStatus === "Due soon"
                ? "#9A6700"
                : contributionScheduleStatus === "Scheduled"
                    ? brandColors.success
                    : memberAccent;

        return (
            <Stack spacing={3}>
                {saccoBankAccount ? <SaccoBankAccountCard {...saccoBankAccount} /> : null}
                <MotionCard
                    variant="outlined"
                    sx={{
                        ...contentCardSx,
                        background: theme.palette.mode === "dark"
                            ? `linear-gradient(135deg, ${alpha(memberAccentStrong, 0.42)}, ${alpha(memberAccentAlt, 0.2)})`
                            : `linear-gradient(135deg, ${alpha(brandColors.primary[900], 0.96)}, ${alpha(brandColors.warning, 0.86)})`,
                        color: "#fff",
                        borderColor: "transparent",
                        boxShadow: "0 18px 38px rgba(10, 5, 115, 0.16)"
                    }}
                >
                    <CardContent sx={{ p: { xs: 2.5, md: 3.25 } }}>
                        <Grid container spacing={2.5} alignItems="center">
                            <Grid size={{ xs: 12, lg: 8 }}>
                                <Stack spacing={1.2}>
                                    <Typography variant="overline" sx={{ color: alpha("#FFFFFF", 0.74), letterSpacing: 1.4 }}>
                                        Member contributions workspace
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.08, maxWidth: 760 }}>
                                        Track contribution discipline and dividend credit transparency in one audited view.
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: alpha("#FFFFFF", 0.84), maxWidth: 780 }}>
                                        Monitor expected vs posted contribution performance, schedule health, annual dividends, and
                                        detailed journal-linked references for every entry.
                                    </Typography>
                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ pt: 0.5 }}>
                                        <Chip
                                            size="small"
                                            label={`${filteredContributions.length} visible entries`}
                                            sx={{ bgcolor: alpha("#FFFFFF", 0.16), color: "#fff", fontWeight: 700 }}
                                        />
                                        <Chip
                                            size="small"
                                            label={`${contributionEntriesCount} contributions`}
                                            sx={{ bgcolor: alpha("#FFFFFF", 0.16), color: "#fff", fontWeight: 700 }}
                                        />
                                        <Chip
                                            size="small"
                                            label={`${dividendEntriesCount} dividends`}
                                            sx={{ bgcolor: alpha("#FFFFFF", 0.16), color: "#fff", fontWeight: 700 }}
                                        />
                                    </Stack>
                                </Stack>
                            </Grid>
                            <Grid size={{ xs: 12, lg: 4 }}>
                                <Stack spacing={1.2}>
                                    <Button
                                        variant="contained"
                                        startIcon={<DownloadRoundedIcon />}
                                        onClick={() => handleDownloadFilteredStatement(filteredContributions, "Contribution statement")}
                                        sx={{
                                            bgcolor: "#fff",
                                            color: memberAccentStrong,
                                            fontWeight: 700,
                                            "&:hover": { bgcolor: alpha("#fff", 0.92) }
                                        }}
                                    >
                                        Download Contribution PDF
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<PrintRoundedIcon />}
                                        onClick={() => window.print()}
                                        sx={{ borderColor: alpha("#fff", 0.44), color: "#fff" }}
                                    >
                                        Printable View
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </CardContent>
                </MotionCard>

                {shareContributionSelfServiceEnabled ? (
                    <MotionCard variant="outlined" data-tour="member-portal-contribution-flow" sx={contentCardSx}>
                    <CardContent sx={{ p: { xs: 2.25, md: 2.75 } }}>
                        <Grid container spacing={2.5} alignItems="center">
                            <Grid size={{ xs: 12, md: 7 }}>
                                <Stack spacing={1.15}>
                                    <Typography variant="overline" sx={{ color: isDarkMode ? CREST_GOLD_LIGHT : crestGold.onLight, letterSpacing: "0.18em", fontWeight: 700 }}>
                                        Mobile Money Deposits
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                                        {savingsDepositSelfServiceEnabled
                                            ? "Use one deposit flow for contributions and savings."
                                            : "Post share contributions from the member portal."}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {savingsDepositSelfServiceEnabled
                                            ? "Choose whether the money should land in your share contribution account or your savings account, approve on your phone, and let the backend post it automatically after Mobile Money confirms success."
                                            : "Approve a Mobile Money prompt on your phone and let the backend post the contribution directly into your share account after confirmation."}
                                    </Typography>
                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                        <Chip label={`${shareAccounts.length} share account(s)`} variant="outlined" />
                                        {savingsDepositSelfServiceEnabled ? (
                                            <Chip label={`${savingsAccounts.length} savings account(s)`} variant="outlined" />
                                        ) : null}
                                        <Chip
                                            label={
                                                latestSharePaymentOrder || latestSavingsPaymentOrder
                                                    ? `Latest order ${(latestSharePaymentOrder || latestSavingsPaymentOrder)?.status.replace(/_/g, " ")}`
                                                    : "No active deposit order"
                                            }
                                            variant="outlined"
                                        />
                                    </Stack>
                                </Stack>
                            </Grid>
                            <Grid size={{ xs: 12, md: 5 }}>
                                <Stack spacing={1.1} alignItems={{ xs: "stretch", md: "flex-end" }}>
                                    <Button
                                        variant="contained"
                                        onClick={() => openDepositDialog("share_contribution")}
                                        disabled={submittingContribution}
                                        sx={
                                            isDarkMode
                                                ? { bgcolor: memberAccent, color: "#1a1a1a", "&:hover": { bgcolor: memberAccentAlt } }
                                                : undefined
                                        }
                                    >
                                        Open Deposit
                                    </Button>
                                    {latestSharePaymentOrder?.status === "paid" && !latestSharePaymentOrder.posted_at ? (
                                        <Button
                                            variant="outlined"
                                            onClick={() => void handleReconcilePaymentOrder()}
                                            disabled={reconcilingPayment}
                                        >
                                            {reconcilingPayment ? "Reconciling..." : "Reconcile Payment"}
                                        </Button>
                                    ) : null}
                                </Stack>
                            </Grid>
                        </Grid>
                        {!shareAccounts.length ? (
                            <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
                                No share account is linked to this portal login yet. A branch manager must provision a share account before members can contribute from the portal.
                            </Alert>
                        ) : null}
                        {latestSharePaymentOrder ? (
                            <Alert
                                severity={
                                    latestSharePaymentOrder.status === "posted"
                                        ? "success"
                                        : latestSharePaymentOrder.status === "failed"
                                            ? "error"
                                            : latestSharePaymentOrder.status === "expired"
                                                ? "warning"
                                                : "info"
                                }
                                variant="outlined"
                                sx={{ mt: 2, alignItems: "flex-start" }}
                            >
                                <Stack spacing={0.5}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                        {latestSharePaymentOrder.status === "posted"
                                            ? "Contribution completed"
                                            : latestSharePaymentOrder.status === "paid"
                                                ? "Payment received, posting in progress"
                                                : latestSharePaymentOrder.status === "pending"
                                                    ? "Awaiting member approval"
                                                    : latestSharePaymentOrder.status === "failed"
                                                        ? "Payment failed"
                                                        : latestSharePaymentOrder.status === "expired"
                                                            ? "Payment expired"
                                                            : `Order ${latestSharePaymentOrder.status.replace(/_/g, " ")}`}
                                    </Typography>
                                    <Typography variant="body2">
                                        {formatCurrency(latestSharePaymentOrder.amount)} via {latestSharePaymentOrder.provider.toUpperCase()} · Ref {latestSharePaymentOrder.provider_ref || latestSharePaymentOrder.external_id}
                                    </Typography>
                                    {latestSharePaymentOrder.journal_id ? (
                                        <Typography variant="body2">Journal posted: {latestSharePaymentOrder.journal_id}</Typography>
                                    ) : null}
                                    {latestSharePaymentOrder.error_message ? (
                                        <Typography variant="body2">{latestSharePaymentOrder.error_message}</Typography>
                                    ) : null}
                                </Stack>
                            </Alert>
                        ) : null}
                    </CardContent>
                    </MotionCard>
                ) : null}
                {!shareContributionSelfServiceEnabled ? (
                    <Alert severity="info" variant="outlined">
                        Tenant super admin has turned off self-service share contributions for members.
                    </Alert>
                ) : null}

                <Grid container spacing={2} alignItems="stretch">
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ display: "flex" }}>
                        <AccountSummaryCard
                            icon={SavingsRoundedIcon}
                            label="Share Capital"
                            value={formatCurrency(totalShareCapital)}
                            helper={shareRequirement
                                ? `${shareRequirement.required_shares} ${tr("shares at", "hisa kwa")} ${formatCurrency(shareRequirement.price_per_share)}${shareCapitalStillInSavings ? tr(", held inside your savings.", ", zipo ndani ya akiba yako.") : "."}`
                                : tr("Current visible share capital balance.", "Salio la mtaji wa hisa linaloonekana sasa.")}
                            tone="warning"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ display: "flex" }}>
                        <AccountSummaryCard
                            icon={TrendingUpRoundedIcon}
                            label="Target Actual"
                            value={formatCurrency(targetActualAmount)}
                            helper={`Annual target ${formatCurrency(contributionExpected)} from ${financialYearPeriod.startLabel} to ${financialYearPeriod.endLabel}.`}
                            tone={contributionComplianceRatio >= 100 ? "success" : "warning"}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ display: "flex" }}>
                        <AccountSummaryCard
                            icon={AccountBalanceWalletRoundedIcon}
                            label="Dividend Credits"
                            value={formatCurrency(saccoYearDividendRows.reduce((sum, row) => sum + row.amount, 0))}
                            helper={`SACCO year credits. Effective rate ${effectiveDividendRate.toFixed(2)}% on capital base.`}
                            tone="success"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ display: "flex" }}>
                        <MotionCard variant="outlined" sx={{ ...contentCardSx, height: "100%", width: 1 }}>
                            <CardContent sx={{ p: 2.25, height: "100%", display: "flex" }}>
                                <Stack spacing={1.4} sx={{ width: 1 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Box
                                            sx={{
                                                width: 38,
                                                height: 38,
                                                borderRadius: 1.5,
                                                display: "grid",
                                                placeItems: "center",
                                                bgcolor: alpha(targetToneColor, 0.14),
                                                color: targetToneColor
                                            }}
                                        >
                                            <TaskAltRoundedIcon fontSize="small" />
                                        </Box>
                                        <Chip
                                            size="small"
                                            label={contributionComplianceStatus}
                                            sx={{
                                                borderRadius: 1.2,
                                                bgcolor: alpha(contributionComplianceRatio >= 100 ? brandColors.success : "#9A6700", 0.14),
                                                color: contributionComplianceRatio >= 100 ? brandColors.success : "#9A6700",
                                                fontWeight: 700
                                            }}
                                        />
                                    </Stack>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                        Performance Target
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {contributionComplianceRatio.toFixed(1)}% reached against the configured annual target.
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={contributionExpected > 0 ? complianceCapped : 0}
                                        sx={{
                                            height: 8,
                                            borderRadius: 999,
                                            bgcolor: alpha(memberAccent, 0.14),
                                            "& .MuiLinearProgress-bar": {
                                                bgcolor: contributionComplianceRatio >= 100 ? brandColors.success : brandColors.warning
                                            }
                                        }}
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: "auto" }}>
                                        Remaining: <Box component="span" sx={{ color: targetToneColor, fontWeight: 700 }}>{formatCurrency(savingsTargetRemaining)}</Box>
                                        {savingsTargetNextRequired > 0 ? ` • needed now ${formatCurrency(savingsTargetNextRequired)}` : ""}
                                        <Box component="span" sx={{ display: "block" }}>
                                            SACCO year {financialYearPeriod.startLabel} - {financialYearPeriod.endLabel}
                                        </Box>
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </MotionCard>
                    </Grid>
                </Grid>

                <ChartPanel
                    title="Contribution vs Dividend Trend"
                    subtitle="Monthly posted share contributions against credited dividends in this filtered window."
                    data={{
                        labels: contributionTrendLabels.length ? contributionTrendLabels : chartLabels,
                        datasets: [
                            {
                                label: tr("Contributions", "Michango"),
                                data: contributionTrendLabels.length ? contributionTrendContributions : new Array(chartLabels.length).fill(0),
                                borderColor: memberAccent,
                                backgroundColor: alpha(memberAccent, 0.14),
                                fill: true,
                                tension: 0.35
                            },
                            {
                                label: tr("Dividends", "Gawio"),
                                data: contributionTrendLabels.length ? contributionTrendDividends : new Array(chartLabels.length).fill(0),
                                borderColor: memberAccentAlt,
                                backgroundColor: alpha(memberAccentAlt, 0.12),
                                fill: true,
                                tension: 0.35
                            }
                        ]
                    }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: "bottom" } }
                    }}
                />

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <MotionCard variant="outlined" sx={contentCardSx}>
                            <CardContent sx={{ p: 1.75 }}>
                                <Stack spacing={1.4}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Box
                                            sx={{
                                                width: 30,
                                                height: 30,
                                                borderRadius: 1.25,
                                                display: "grid",
                                                placeItems: "center",
                                                bgcolor: memberAccentSoftBg,
                                                color: memberAccent
                                            }}
                                        >
                                            <TimelineRoundedIcon fontSize="small" />
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            Running Total Summary
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                        <Chip label={`${contributionEntriesCount} contributions`} variant="outlined" />
                                        <Chip label={`${dividendEntriesCount} dividend entries`} variant="outlined" />
                                        <Chip
                                            label={`Total posted ${formatCurrency(contributionRunningTotal)}`}
                                            variant="outlined"
                                            sx={{
                                                borderColor: alpha(memberAccent, 0.32),
                                                color: memberAccent
                                            }}
                                        />
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary">
                                        Expected contribution base: {formatCurrency(contributionExpected)} (baseline {formatCurrency(contributionBaselineMonthly)} per month).
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </MotionCard>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <MotionCard variant="outlined" sx={contentCardSx}>
                            <CardContent sx={{ p: 1.75 }}>
                                <Stack spacing={1.4}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Box
                                            sx={{
                                                width: 30,
                                                height: 30,
                                                borderRadius: 1.25,
                                                display: "grid",
                                                placeItems: "center",
                                                bgcolor: alpha(brandColors.success, 0.12),
                                                color: brandColors.success
                                            }}
                                        >
                                            <StarRoundedIcon fontSize="small" />
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            Dividend Calculation Transparency
                                        </Typography>
                                    </Stack>
                                    <Stack spacing={1}>
                                        <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 1.4 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Base capital used
                                            </Typography>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                {formatCurrency(totalShareCapital)}
                                            </Typography>
                                        </Paper>
                                        <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 1.4 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Dividend credits posted
                                            </Typography>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                {formatCurrency(totalDividends)}
                                            </Typography>
                                        </Paper>
                                        <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 1.4 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Effective dividend rate
                                            </Typography>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                {effectiveDividendRate.toFixed(2)}%
                                            </Typography>
                                        </Paper>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </MotionCard>
                    </Grid>
                </Grid>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <MotionCard variant="outlined" sx={contentCardSx}>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Dividend History by Year
                                </Typography>
                                <DataTable
                                    rows={dividendHistoryByYear}
                                    columns={[
                                        { key: "year", header: "Year", render: (row) => row.year },
                                        { key: "amount", header: "Amount", render: (row) => formatCurrency(row.amount) }
                                    ]}
                                    emptyMessage="No dividend entries for selected period."
                                />
                            </CardContent>
                        </MotionCard>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <MotionCard variant="outlined" sx={contentCardSx}>
                            <CardContent sx={{ p: 1.75 }}>
                                <Stack spacing={1.2}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Box
                                            sx={{
                                                width: 30,
                                                height: 30,
                                                borderRadius: 1.25,
                                                display: "grid",
                                                placeItems: "center",
                                                bgcolor: alpha(contributionScheduleToneColor, 0.12),
                                                color: contributionScheduleToneColor
                                            }}
                                        >
                                            <EventRoundedIcon fontSize="small" />
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            Contribution Schedule
                                        </Typography>
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary">
                                        Status: <Box component="span" sx={{ color: contributionScheduleToneColor, fontWeight: 700 }}>{contributionScheduleStatus}</Box>
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Next expected SACCO-year contribution: {formatDate(nextContributionDue)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        SACCO year: {financialYearPeriod.startLabel} - {financialYearPeriod.endLabel}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Monthly baseline: {formatCurrency(contributionBaselineMonthly)}
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </MotionCard>
                    </Grid>
                </Grid>

                <MotionCard variant="outlined" sx={contentCardSx}>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.2} sx={{ mb: 2 }}>
                            <Typography variant="h6">
                                Share Contributions & Dividends
                            </Typography>
                            <Chip
                                size="small"
                                label={`${filteredContributions.length} records`}
                                sx={{
                                    borderRadius: 1.2,
                                    bgcolor: alpha(memberAccent, 0.12),
                                    color: memberAccent,
                                    fontWeight: 700
                                }}
                            />
                        </Stack>
                        <DataTable
                            rows={paginatedContributions}
                            columns={statementColumns}
                            emptyMessage="No share contributions or dividends posted in this period."
                        />
                        <TablePagination
                            component="div"
                            count={filteredContributions.length}
                            page={contributionsPage}
                            onPageChange={(_, value) => setContributionsPage(value)}
                            rowsPerPage={contributionsRowsPerPage}
                            onRowsPerPageChange={(event) => {
                                setContributionsRowsPerPage(Number(event.target.value));
                                setContributionsPage(0);
                            }}
                            rowsPerPageOptions={[10, 25, 50]}
                        />
                    </CardContent>
                </MotionCard>
            </Stack>
        );
    };

    const renderPaymentsView = () => (
        <Stack spacing={3}>
            <MotionCard
                variant="outlined"
                sx={{
                    ...contentCardSx,
                    background: theme.palette.mode === "dark"
                        ? `linear-gradient(135deg, ${alpha(memberAccentStrong, 0.4)}, ${alpha("#0B5E55", 0.28)})`
                        : `linear-gradient(135deg, ${alpha(brandColors.primary[900], 0.96)}, ${alpha(brandColors.success, 0.82)})`,
                    color: "#fff",
                    borderColor: "transparent"
                }}
            >
                <CardContent sx={{ p: { xs: 2.5, md: 3.25 } }}>
                    <Stack spacing={1.2}>
                        <Typography variant="overline" sx={{ color: alpha("#FFFFFF", 0.74), letterSpacing: 1.4 }}>
                            Member payment history
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.08, maxWidth: 760 }}>
                            Review every Mobile Money request like a receipt ledger, including failed and expired attempts.
                        </Typography>
                        <Typography variant="body2" sx={{ color: alpha("#FFFFFF", 0.84), maxWidth: 780 }}>
                            Track initiated amounts, approval outcomes, posted journals, timeout cases, and payment references in one member-facing timeline.
                        </Typography>
                    </Stack>
                </CardContent>
            </MotionCard>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <AccountSummaryCard
                        icon={WalletRoundedIcon}
                        label="Total Attempts"
                        value={normalizedPaymentOrders.length}
                        helper="All mobile money payment requests."
                        tone="primary"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <AccountSummaryCard
                        icon={TaskAltRoundedIcon}
                        label="Posted"
                        value={successfulPaymentCount}
                        helper="Payments fully posted into the ledger."
                        tone="success"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <AccountSummaryCard
                        icon={HourglassTopRoundedIcon}
                        label="In Progress"
                        value={pendingPaymentCount}
                        helper="Still waiting for approval or posting."
                        tone="warning"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <AccountSummaryCard
                        icon={HighlightOffRoundedIcon}
                        label="Failed / Expired"
                        value={failedPaymentCount}
                        helper={`Tracked amount ${formatCurrency(totalMobileMoneyAmount)}.`}
                        tone="danger"
                    />
                </Grid>
            </Grid>

            <MotionCard variant="outlined" data-tour="member-portal-payments-ledger" sx={contentCardSx}>
                <CardContent>
                    <Stack spacing={2}>
                        <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={1.5}
                            justifyContent="space-between"
                            alignItems={{ xs: "stretch", md: "center" }}
                        >
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                    Payment Receipts
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Every mobile money attempt is visible here, whether it posted successfully or not.
                                </Typography>
                            </Box>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                                <TextField
                                    select
                                    label="Purpose"
                                    value={paymentPurposeFilter}
                                    onChange={(event) => setPaymentPurposeFilter(event.target.value)}
                                    sx={{ minWidth: { xs: 0, sm: 180 } }}
                                >
                                    <MenuItem value="all">All payments</MenuItem>
                                    <MenuItem value="share_contribution">Share contributions</MenuItem>
                                    <MenuItem value="savings_deposit">Savings deposits</MenuItem>
                                    <MenuItem value="membership_fee">Membership fees</MenuItem>
                                    <MenuItem value="loan_repayment">Loan repayments</MenuItem>
                                </TextField>
                                <TextField
                                    select
                                    label="Status"
                                    value={paymentStatusFilter}
                                    onChange={(event) => setPaymentStatusFilter(event.target.value)}
                                    sx={{ minWidth: { xs: 0, sm: 180 } }}
                                >
                                    <MenuItem value="all">All statuses</MenuItem>
                                    <MenuItem value="posted">Posted</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="paid">Paid</MenuItem>
                                    <MenuItem value="failed">Failed</MenuItem>
                                    <MenuItem value="expired">Expired</MenuItem>
                                </TextField>
                            </Stack>
                        </Stack>
                        <DataTable
                            rows={paginatedPaymentOrders}
                            columns={paymentOrderColumns}
                            emptyMessage="No payment receipts match the selected filters."
                        />
                        <TablePagination
                            component="div"
                            count={filteredPaymentOrders.length}
                            page={paymentsPage}
                            onPageChange={(_, value) => setPaymentsPage(value)}
                            rowsPerPage={paymentsRowsPerPage}
                            onRowsPerPageChange={(event) => {
                                setPaymentsRowsPerPage(Number(event.target.value));
                                setPaymentsPage(0);
                            }}
                            rowsPerPageOptions={[10, 25, 50]}
                        />
                    </Stack>
                </CardContent>
            </MotionCard>
        </Stack>
    );

    const renderMyReportsView = () => {
        const tzsFull = (value: number) => `TZS ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(value) || 0)}`;
        const monthName = (month: string) => {
            const [year, mm] = month.split("-");
            return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(mm) - 1]} ${year}`;
        };

        const monthlyRows = myReports?.monthly.rows ?? [];
        // Months left in the savings year, so the suggested monthly pace is
        // against the time actually remaining rather than a flat twelve.
        const monthsLeft = Math.max(1, 12 - (new Date().getMonth() + 1));

        return (
            <ReportsSection
                loading={myReportsLoading}
                hasData={Boolean(myReports)}
                money={tzsFull}
                monthLabel={monthName}
                monthly={monthlyRows}
                monthlyTotal={myReports?.monthly.grand_total ?? 0}
                target={{
                    amount: annualSavingsTarget,
                    percent: savingsTargetProgress,
                    reached: totalSavings,
                    remaining: savingsTargetRemaining,
                    monthsLeft,
                    suggestedTopUp: savingsTargetNextRequired
                }}
                standing={[
                    { id: "contributions", label: "My contributions", value: tzsFull(myReports?.position.contributions ?? 0) },
                    { id: "dividends", label: tr("My dividends", "Gawio langu"), value: tzsFull(myReports?.position.dividends ?? 0) },
                    { id: "total", label: "My total position", value: tzsFull(myReports?.position.cumulative ?? 0), gold: true },
                    {
                        id: "rank",
                        label: tr("My rank", "Nafasi yangu"),
                        value: myReports?.position.rank
                            ? `#${myReports.position.rank} of ${myReports.position.total_ranked_members}`
                            : "Unranked"
                    }
                ]}
                dividends={(myReports?.statement.rows ?? []).map((row) => ({
                    date: row.date,
                    label: row.label,
                    source: row.source,
                    amount: row.amount,
                    runningTotal: row.running_total
                }))}
                dividendTotal={myReports?.position.dividends ?? 0}
                utt={myReports?.utt
                    ? {
                        invested: myReports.utt.totals.invested,
                        income: myReports.utt.totals.income,
                        grandTotal: myReports.utt.totals.grand_total,
                        deposits: myReports.utt.deposits,
                        incomeRows: myReports.utt.income
                    }
                    : null}
                operations={myReports?.operations
                    ? {
                        rows: myReports.operations.rows.map((row) => ({
                            month: row.month,
                            opening: row.opening,
                            income: row.income,
                            expenses: row.expenses,
                            closing: row.closing
                        })),
                        totals: myReports.operations.totals
                    }
                    : null}
                onExport={handleDownloadStatement}
                onPrint={() => window.print()}
            />
        );
    };

    const renderActiveView = () => {
        switch (activeSection) {
            case "member-sacco":
                return renderSaccoOverview();
            case "member-league":
                return renderLeagueView();
            case "member-accounts":
                return renderAccountsView();
            case "member-loans":
                return renderLoansView();
            case "member-transactions":
                return renderTransactionsView();
            case "member-contributions":
                return renderContributionsView();
            case "member-payments":
                return renderPaymentsView();
            case "member-reports":
                return renderMyReportsView();
            default:
                return renderOverviewView();
        }
    };


    if (loading) {
        return <MemberPortalSkeleton />;
    }

    if (error) {
        return (
            <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", px: 3 }}>
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <PortalShell
            sections={visiblePortalSections.map((section) => ({
                id: section.id,
                label: section.label,
                labelSw: section.labelSw
            }))}
            activeSection={activeSection}
            onSectionChange={(id) => handleSectionSelect(id as PortalSectionId)}
            title={portalPageTitle}
            subtitle={portalPageSubtitle}
            memberName={profile?.full_name || "Member"}
            memberNo={memberRecord?.member_no || null}
            avatarUrl={profile?.avatar_url}
            leagueLabel={leagueEnabled ? leaguePosition?.tier?.name : null}
            statusLabel={hasNoVisibleFinancialData ? "Awaiting activity" : "Active"}
            payAccount={saccoBankAccount?.accountNumber
                ? {
                    accountNumber: saccoBankAccount.accountNumber,
                    accountName: saccoBankAccount.accountName,
                    bankName: saccoBankAccount.bankName,
                    bankBranch: saccoBankAccount.bankBranch,
                    instructions: saccoBankAccount.instructions
                }
                : null}
            branchLine={selectedBranchName}
            theme={themeMode}
            onToggleTheme={toggleTheme}
            notificationSlot={<MemberNotificationBell tenantId={profile?.tenant_id || null} />}
            profileMenuSlot={(
                <MemberProfileMenu
                    name={profile?.full_name || "Member"}
                    email={user?.email || ""}
                    avatarUrl={profile?.avatar_url}
                    verified={Boolean((user as { email_confirmed_at?: string | null } | null)?.email_confirmed_at)}
                    details={[
                        { id: "role", label: "Role", value: formatRole(profile?.role || "member") },
                        { id: "member-no", label: "Member No.", value: memberRecord?.member_no || "—" },
                        {
                            id: "since",
                            label: tr("Member since", "Mwanachama tangu"),
                            value: formatDate(memberRecord?.membership_started_on || profile?.created_at || user?.created_at || null)
                        },
                        ...(leagueEnabled && leaguePosition?.tier
                            ? [{ id: "league", label: "League", value: leaguePosition.tier.name }]
                            : [])
                    ]}
                    theme={themeMode}
                    onToggleTheme={toggleTheme}
                    twoFactor={{
                        enabled: Boolean(profile?.two_factor_enabled && profile?.two_factor_verified),
                        available: profile?.two_factor_workspace_enabled !== false,
                        onManage: () => navigate(
                            profile?.two_factor_enabled && profile?.two_factor_verified
                                ? "/security"
                                : "/security?intent=setup"
                        )
                    }}
                    onProfile={() => {
                        setMemberProfileTab(0);
                        setShowMemberProfileDialog(true);
                    }}
                    onDownloadStatement={handleDownloadStatement}
                    onChangePassword={() => navigate("/change-password")}
                    onSignOut={() => { void signOut(); }}
                    onFeatureTour={MEMBER_PORTAL_TOUR_ENABLED ? startMemberPortalTour : undefined}
                />
            )}
            onHelp={MEMBER_PORTAL_TOUR_ENABLED ? startMemberPortalTour : undefined}
            onRules={() => navigate("/terms-and-agreement")}
            onContact={() => { window.location.href = "mailto:support@ias.co.tz"; }}
        >
            <Box
                component="div"
                sx={{
                    minWidth: 0,
                    width: "100%",
                    boxSizing: "border-box"
                }}
            >


                <MotionModal
                    open={showMemberProfileDialog}
                    onClose={() => setShowMemberProfileDialog(false)}
                    maxWidth="sm"
                    fullWidth
                    fullScreen={isMobile}
                >
                    <DialogTitle sx={{ pb: 1, pr: 6 }}>
                        <IconButton
                            aria-label="Close"
                            onClick={() => setShowMemberProfileDialog(false)}
                            sx={{ position: "absolute", right: 8, top: 8, color: "text.secondary" }}
                        >
                            <CloseRoundedIcon fontSize="small" />
                        </IconButton>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                                src={profile?.avatar_url || undefined}
                                sx={{ width: 48, height: 48, bgcolor: alpha(memberAccent, 0.16), color: memberAccent, fontWeight: 800 }}
                            >
                                {(profile?.full_name || "M").slice(0, 1).toUpperCase()}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }} noWrap>
                                    {memberRecord?.full_name || profile?.full_name || "Member"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                    {memberRecord?.member_no ? `Member No. ${memberRecord.member_no}` : (memberRecord?.email || user?.email || "")}
                                </Typography>
                            </Box>
                        </Stack>
                    </DialogTitle>
                    <Tabs
                        value={memberProfileTab}
                        onChange={(_event, value) => setMemberProfileTab(value)}
                        variant={isMobile ? "scrollable" : "fullWidth"}
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        sx={{ px: 1, borderBottom: 1, borderColor: "divider", minHeight: 0 }}
                    >
                        <Tab icon={<PersonRoundedIcon fontSize="small" />} iconPosition="start" label="Personal" sx={{ minHeight: 44, textTransform: "none" }} />
                        <Tab icon={<ContactPhoneRoundedIcon fontSize="small" />} iconPosition="start" label="Contact" sx={{ minHeight: 44, textTransform: "none" }} />
                        <Tab icon={<Diversity3RoundedIcon fontSize="small" />} iconPosition="start" label="Kin & Heir" sx={{ minHeight: 44, textTransform: "none" }} />
                        <Tab icon={<CardMembershipRoundedIcon fontSize="small" />} iconPosition="start" label="Membership" sx={{ minHeight: 44, textTransform: "none" }} />
                    </Tabs>
                    <DialogContent dividers sx={{ minHeight: 280 }}>
                        {memberProfileTab === 0 ? (
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Full name" value={memberRecord?.full_name || profile?.full_name} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Member No." value={memberRecord?.member_no} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Date of birth" value={memberRecord?.dob ? formatDate(memberRecord.dob) : null} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Gender" value={titleCase(memberRecord?.gender)} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Marital status" value={titleCase(memberRecord?.marital_status)} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Occupation" value={memberRecord?.occupation} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Ilboru completion year" value={memberRecord?.ilboru_completion_year} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="National ID (NIDA)" value={memberRecord?.national_id || memberRecord?.nida_no} /></Grid>
                            </Grid>
                        ) : null}
                        {memberProfileTab === 1 ? (
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Phone" value={memberRecord?.phone} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Email" value={memberRecord?.email || user?.email} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Region" value={memberRecord?.region} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="District" value={memberRecord?.district} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Ward" value={memberRecord?.ward} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Street / village" value={memberRecord?.street_or_village} /></Grid>
                                <Grid size={{ xs: 12 }}><ProfileField label="Residential address" value={memberRecord?.residential_address || memberRecord?.address_line1} /></Grid>
                            </Grid>
                        ) : null}
                        {memberProfileTab === 2 ? (
                            <Stack spacing={2}>
                                <Typography variant="overline" color="text.secondary">Next of kin</Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Name" value={memberRecord?.next_of_kin_name} /></Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Relationship" value={memberRecord?.next_of_kin_relationship ? formatNextOfKinRelationship(memberRecord.next_of_kin_relationship) : null} /></Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Phone" value={memberRecord?.next_of_kin_phone} /></Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Address" value={memberRecord?.next_of_kin_address} /></Grid>
                                </Grid>
                                <Divider />
                                <Typography variant="overline" color="text.secondary">Nominated heir (Mrithi)</Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Name" value={memberRecord?.heir_name} /></Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Relationship" value={memberRecord?.heir_relationship ? formatNextOfKinRelationship(memberRecord.heir_relationship) : null} /></Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Phone" value={memberRecord?.heir_phone} /></Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Address" value={memberRecord?.heir_address} /></Grid>
                                </Grid>
                                <Divider />
                                <HeirsSection memberStatus={memberRecord?.status} />
                            </Stack>
                        ) : null}
                        {memberProfileTab === 3 ? (
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Membership type" value={titleCase(memberRecord?.membership_type)} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Status" value={titleCase(memberRecord?.status)} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Initial shares" value={memberRecord?.initial_share_amount != null ? formatCurrency(memberRecord.initial_share_amount) : null} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Monthly savings" value={memberRecord?.monthly_savings_commitment != null ? formatCurrency(memberRecord.monthly_savings_commitment) : null} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="Legitimate income" value={memberRecord?.legitimate_income_declared ? "Confirmed" : "Not confirmed"} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><ProfileField label="No conflicting business" value={memberRecord?.no_conflicting_business_declared ? "Confirmed" : "Not confirmed"} /></Grid>
                            </Grid>
                        ) : null}
                    </DialogContent>
                    <DialogActions sx={{ px: 2.5, py: 1.5 }}>
                        <Button color="inherit" onClick={() => setShowMemberProfileDialog(false)}>Close</Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                setShowMemberProfileDialog(false);
                                openProfileCompletionDialog();
                            }}
                        >
                            Edit profile
                        </Button>
                    </DialogActions>
                </MotionModal>

                {/* PortalShell owns the page gutters and max width; this box only
                    guards against wide children forcing a horizontal scroll. */}
                <Box
                    sx={{
                        width: "100%",
                        minWidth: 0,
                        boxSizing: "border-box",
                        overflowX: "clip"
                    }}
                >
                    <Stack spacing={3}>
                        {warning ? (
                            <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                {warning}
                            </Alert>
                        ) : null}
                        {hasNoVisibleFinancialData ? (
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                No posted member financial activity is visible yet for this login. The dashboard will populate after this member has linked savings accounts, deposits, loans, or statement activity.
                            </Alert>
                        ) : null}
                        {memberApplication && (!memberRecord || memberApplication.status === "approved_pending_payment") ? (
                            <MotionCard variant="outlined" sx={contentCardSx}>
                                <CardContent>
                                    <Stack spacing={1.25}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                    Membership Application Status
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Application {memberApplication.application_no}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                size="small"
                                                label={memberApplicationStatusLabels[memberApplication.status]}
                                                sx={{ borderRadius: 1.25 }}
                                            />
                                        </Stack>
                                        <Divider />
                                        <Stack spacing={0.35}>
                                            <Typography variant="body2">
                                                <strong>Status:</strong> {memberApplicationStatusLabels[memberApplication.status]}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Branch:</strong>{" "}
                                                {memberApplication.branch_name || selectedBranchName || "Branch pending"}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Membership Fee:</strong> {formatCurrency(memberApplication.membership_fee_amount || 0)}
                                            </Typography>
                                            {memberApplication.membership_fee_paid ? (
                                                <Typography variant="body2">
                                                    <strong>Paid:</strong> {formatCurrency(memberApplication.membership_fee_paid)}
                                                </Typography>
                                            ) : null}
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            {getMemberApplicationMessage(memberApplication.status)}
                                        </Typography>
                                        {memberApplication.request_more_info_reason && ["submitted", "under_review"].includes(memberApplication.status) ? (
                                            <Alert severity="warning" variant="outlined" sx={{ mt: 0.75 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.35 }}>
                                                    Branch manager requested more information
                                                </Typography>
                                                <Typography variant="body2">
                                                    {memberApplication.request_more_info_reason}
                                                </Typography>
                                                {memberApplication.requested_more_info_at ? (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Requested on {formatDate(memberApplication.requested_more_info_at)}
                                                    </Typography>
                                                ) : null}
                                            </Alert>
                                        ) : null}
                                        {memberApplication.status === "approved_pending_payment" ? (
                                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.1} sx={{ pt: 0.5 }}>
                                                <Button
                                                    variant="contained"
                                                    onClick={() => openDepositDialog("membership_fee")}
                                                    disabled={submittingContribution || membershipFeeOutstanding <= 0}
                                                >
                                                    Pay Membership Fee
                                                </Button>
                                                <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
                                                    Outstanding: {formatCurrency(membershipFeeOutstanding)}
                                                </Typography>
                                            </Stack>
                                        ) : null}
                                    </Stack>
                                </CardContent>
                            </MotionCard>
                        ) : null}
                        {memberRecord && memberProfileNeedsCompletion ? (
                            <MotionCard
                                variant="outlined"
                                sx={{
                                    ...contentCardSx,
                                    borderColor: alpha(theme.palette.warning.main, isDarkMode ? 0.34 : 0.24),
                                    bgcolor: alpha(theme.palette.warning.main, isDarkMode ? 0.1 : 0.04)
                                }}
                            >
                                <CardContent>
                                    <Stack spacing={1.4}>
                                        <Stack
                                            direction={{ xs: "column", md: "row" }}
                                            justifyContent="space-between"
                                            alignItems={{ xs: "flex-start", md: "center" }}
                                            spacing={1.25}
                                        >
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                                    Complete your member profile
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                                                    Some identity and contact details are still missing from your member record. Complete them now so branch reviews and future servicing do not get delayed.
                                                </Typography>
                                            </Box>
                                            <Button
                                                variant="contained"
                                                onClick={openProfileCompletionDialog}
                                                sx={
                                                    isDarkMode
                                                        ? { bgcolor: memberAccent, color: "#1a1a1a", "&:hover": { bgcolor: memberAccentAlt } }
                                                        : undefined
                                                }
                                            >
                                                Complete profile
                                            </Button>
                                        </Stack>
                                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                            {memberProfileMissingFields.slice(0, 5).map((field) => (
                                                <Chip
                                                    key={field}
                                                    size="small"
                                                    color="warning"
                                                    variant="outlined"
                                                    label={field}
                                                    sx={{ borderRadius: 1.2 }}
                                                />
                                            ))}
                                            {memberProfileMissingFields.length > 5 ? (
                                                <Chip
                                                    size="small"
                                                    variant="outlined"
                                                    label={`+${memberProfileMissingFields.length - 5} more`}
                                                    sx={{ borderRadius: 1.2 }}
                                                />
                                            ) : null}
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </MotionCard>
                        ) : null}
                        <Box sx={{ display: "grid", gap: 3, width: "100%", maxWidth: "100%", minWidth: 0 }}>
                                {/* Overview states each figure once, in OverviewSection;
                                    the commitment banner is for the other sections. */}
                                {activeSection !== "member-overview" ? renderMonthlyCommitmentBanner() : null}
                                {renderActiveView()}
                        </Box>
                    </Stack>
                </Box>
            </Box>

            <MemberPortalFeatureTour
                run={runFeatureTour}
                canUsePortalPayments={canUsePortalPayments}
                onNavigateSection={setActiveSection}
                onFinish={completeMemberPortalTour}
            />

            <MotionModal open={showContributionDialog} onClose={submittingContribution ? undefined : () => setShowContributionDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ pb: 1.25 }}>
                    <Stack spacing={0.6}>
                        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                            {contributionFlowState ? `${activePaymentCopy.title} Payment Progress` : `Start ${activePaymentCopy.title}`}
                        </Typography>
                        {!contributionFlowState ? (
                            <Typography variant="body2" color="text.secondary">
                                {paymentFlowPurpose === "membership_fee"
                                    ? "Approve the mobile money prompt and let the system post the membership fee automatically after confirmation."
                                    : paymentFlowPurpose === "loan_repayment"
                                        ? "Choose the loan, review the repayment split, approve the mobile money prompt, and let the system post the repayment automatically."
                                    : "Choose where the money should land, approve the mobile money prompt, and let the system post it automatically."}
                            </Typography>
                        ) : null}
                    </Stack>
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ pt: 0.5 }}>
                        <Alert severity={contributionFlowTone} variant="outlined">
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.4 }}>
                                {contributionFlowTitle}
                            </Typography>
                            <Typography variant="body2">{contributionFlowMessage}</Typography>
                        </Alert>
                        {paymentFlowPurpose !== "loan_repayment" && !paymentTargetAccounts.length ? (
                            <Alert severity="info" variant="outlined">
                                {activePaymentCopy.emptyAccountMessage}
                            </Alert>
                        ) : null}
                        {paymentFlowPurpose === "loan_repayment" && !portalRepaymentLoans.length ? (
                            <Alert severity="info" variant="outlined">
                                {activePaymentCopy.emptyAccountMessage}
                            </Alert>
                        ) : null}
                        {contributionFlowState ? (
                            <Stack spacing={1.5}>
                                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                                    <Stack spacing={1.2}>
                                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                            <Chip
                                                label={submittingContribution ? "1. Contacting gateway" : "1. Request created"}
                                                color={contributionRequestStepState === "complete" ? "success" : contributionRequestStepState === "active" ? "primary" : "default"}
                                                variant={contributionRequestStepState === "idle" ? "outlined" : "filled"}
                                            />
                                            <Chip
                                                label="2. Member approves on phone"
                                                color={contributionApprovalStepState === "complete" ? "success" : contributionApprovalStepState === "active" ? "primary" : "default"}
                                                variant={contributionApprovalStepState === "idle" ? "outlined" : "filled"}
                                            />
                                            <Chip
                                                label={
                                                    activePaymentPurpose === "membership_fee"
                                                        ? "3. System posts fee"
                                                        : activePaymentPurpose === "loan_repayment"
                                                            ? "3. System posts repayment"
                                                            : "3. System posts deposit"
                                                }
                                                color={contributionPostingStepState === "complete" ? "success" : contributionPostingStepState === "active" ? "primary" : "default"}
                                                variant={contributionPostingStepState === "idle" ? "outlined" : "filled"}
                                            />
                                        </Stack>
                                        <LinearProgress
                                            variant={contributionFlowState === "pending" || contributionFlowState === "paid" ? "indeterminate" : "determinate"}
                                            value={contributionFlowProgress}
                                            sx={{ height: 9, borderRadius: 999 }}
                                        />
                                        {showBackgroundActivity ? (
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "text.secondary" }}>
                                                <CircularProgress size={16} thickness={5} />
                                                <Typography variant="body2">
                                                    {backgroundActivityMessage}
                                                </Typography>
                                            </Stack>
                                        ) : null}
                                        {paymentApprovalTakingLongerThanExpected ? (
                                            <Alert severity="warning" variant="outlined">
                                                This approval is taking longer than expected. The provider can keep the request open for several more minutes, but you can safely close this dialog and check it later from Payments.
                                            </Alert>
                                        ) : null}
                                        {trackedContributionOrder ? (
                                            <Stack spacing={0.6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Amount: {formatCurrency(trackedContributionOrder.amount)} via {trackedContributionOrder.provider.toUpperCase()}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Reference: {trackedContributionOrder.provider_ref || trackedContributionOrder.external_id}
                                                </Typography>
                                                {trackedContributionOrder.status === "pending" && trackedContributionOrder.expires_at ? (
                                                    <Typography variant="body2" color={phoneCancellationRequested ? "warning.main" : "text.secondary"}>
                                                        {phoneCancellationRequested ? "Fallback expiry if no callback arrives" : "Provider window closes"}: {formatDate(trackedContributionOrder.expires_at)}
                                                        {pendingOrderMinutesRemaining !== null ? ` · about ${pendingOrderMinutesRemaining} minute(s) remaining` : ""}
                                                    </Typography>
                                                ) : null}
                                                {trackedContributionOrder.purpose === "loan_repayment" ? (
                                                    <Typography variant="body2" color="text.secondary">
                                                        Loan: {trackedContributionOrder.loan_number || trackedContributionOrder.loan_id || "Unknown loan"}
                                                    </Typography>
                                                ) : null}
                                                {trackedContributionOrder.journal_id ? (
                                                    <Typography variant="body2" color="text.secondary">
                                                        Journal: {trackedContributionOrder.journal_id}
                                                    </Typography>
                                                ) : null}
                                                {trackedContributionOrder.error_message ? (
                                                    <Typography variant="body2" color="error.main">
                                                        {trackedContributionOrder.error_message}
                                                    </Typography>
                                                ) : null}
                                            </Stack>
                                        ) : null}
                                    </Stack>
                                </Paper>
                            </Stack>
                        ) : (
                            <Box component="form" id="member-contribution-form" onSubmit={submitContributionPayment} sx={{ display: "grid", gap: 2 }}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: { xs: 1.5, md: 1.75 },
                                        borderRadius: 2,
                                        bgcolor: alpha(memberAccent, isDarkMode ? 0.08 : 0.04),
                                        borderColor: alpha(memberAccent, isDarkMode ? 0.3 : 0.16)
                                    }}
                                >
                                    <Grid container spacing={2} alignItems="start">
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                select
                                                label="Payment Type"
                                                fullWidth
                                                size="small"
                                                value={paymentFlowPurpose}
                                                onChange={(event) => {
                                                    const nextPurpose = event.target.value as MemberPaymentPurpose;
                                                    setPaymentFlowPurpose(nextPurpose);
                                                    setActiveContributionOrderId(null);
                                                    if (nextPurpose === "membership_fee") {
                                                        contributionPaymentForm.setValue("amount", membershipFeeOutstanding, { shouldValidate: true });
                                                        contributionPaymentForm.setValue("description", "Membership fee payment", { shouldValidate: true });
                                                        contributionPaymentForm.setValue("loan_id", "", { shouldValidate: false });
                                                    } else if (nextPurpose === "loan_repayment") {
                                                        const nextLoan = selectedLoan || portalRepaymentLoans[0] || null;
                                                        const nextSchedules = loanSchedules.filter((schedule) => schedule.loan_id === nextLoan?.id && schedule.status !== "paid");
                                                        const nextInsights = buildRepaymentInsights(nextLoan, nextSchedules, 0);
                                                        contributionPaymentForm.setValue("account_id", "", { shouldValidate: false });
                                                        contributionPaymentForm.setValue("loan_id", nextLoan?.id || "", { shouldValidate: true });
                                                        contributionPaymentForm.setValue("amount", Number(nextInsights.recommendedAmount.toFixed(2)), { shouldValidate: true });
                                                        contributionPaymentForm.setValue("description", nextLoan ? `Loan repayment for ${nextLoan.loan_number}` : "", { shouldValidate: true });
                                                    }
                                                }}
                                            >
                                                {savingsDepositSelfServiceEnabled ? (
                                                    <MenuItem value="savings_deposit">Savings</MenuItem>
                                                ) : null}
                                                {canShowMembershipFeePaymentOption ? (
                                                    <MenuItem value="membership_fee">Membership fee</MenuItem>
                                                ) : null}
                                                {canShowLoanRepaymentOption ? (
                                                    <MenuItem value="loan_repayment">Loan repayment</MenuItem>
                                                ) : null}
                                            </TextField>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 8 }}>
                                            {paymentFlowPurpose === "loan_repayment" ? (
                                                !repaymentLoanOptions.length ? (
                                                    <Alert severity="info" variant="outlined" sx={{ height: "100%", display: "flex", alignItems: "center" }}>
                                                        No active or in-arrears loan is available for self-service repayment right now.
                                                    </Alert>
                                                ) : (
                                                    <SearchableSelect
                                                        value={contributionPaymentForm.watch("loan_id") || ""}
                                                        options={repaymentLoanOptions}
                                                        onChange={(value) => {
                                                            const nextLoan = portalRepaymentLoans.find((loan) => loan.id === value) || null;
                                                            const nextSchedules = loanSchedules.filter((schedule) => schedule.loan_id === nextLoan?.id && schedule.status !== "paid");
                                                            const nextInsights = buildRepaymentInsights(nextLoan, nextSchedules, 0);
                                                            contributionPaymentForm.setValue("loan_id", value, { shouldValidate: true });
                                                            contributionPaymentForm.setValue("amount", Number(nextInsights.recommendedAmount.toFixed(2)), { shouldValidate: true });
                                                            contributionPaymentForm.setValue("description", nextLoan ? `Loan repayment for ${nextLoan.loan_number}` : "", { shouldValidate: true });
                                                        }}
                                                        label={activePaymentCopy.accountLabel}
                                                        size="small"
                                                        error={Boolean(contributionPaymentForm.formState.errors.loan_id)}
                                                        helperText={
                                                            contributionPaymentForm.formState.errors.loan_id?.message
                                                            || "Choose the loan that should receive this repayment."
                                                        }
                                                        placeholder="Search loan facility..."
                                                    />
                                                )
                                            ) : !paymentAccountOptions.length ? (
                                                <Alert severity="info" variant="outlined" sx={{ height: "100%", display: "flex", alignItems: "center" }}>
                                                    {paymentFlowPurpose === "membership_fee"
                                                        ? "The backend will resolve or create the savings account for this membership-fee payment automatically."
                                                        : paymentFlowPurpose === "savings_deposit"
                                                            ? "The backend will resolve or create the savings account for this deposit automatically."
                                                            : "The backend will resolve or create the share account for this contribution automatically."}
                                                </Alert>
                                            ) : (
                                                <SearchableSelect
                                                    value={contributionPaymentForm.watch("account_id") || ""}
                                                    options={paymentAccountOptions}
                                                    onChange={(value) => contributionPaymentForm.setValue("account_id", value, { shouldValidate: true })}
                                                    label={activePaymentCopy.accountLabel}
                                                    size="small"
                                                    error={Boolean(contributionPaymentForm.formState.errors.account_id)}
                                                    helperText={
                                                        contributionPaymentForm.formState.errors.account_id?.message
                                                        || (paymentFlowPurpose === "membership_fee"
                                                            ? "Choose the savings account used to anchor this membership fee payment."
                                                            : paymentFlowPurpose === "savings_deposit"
                                                                ? "Choose the exact savings account that should receive this deposit."
                                                                : "Choose the exact share account that should receive this contribution.")
                                                    }
                                                    placeholder={`Search ${activePaymentCopy.accountLabel.toLowerCase()}...`}
                                                />
                                            )}
                                        </Grid>
                                        {paymentFlowPurpose === "loan_repayment" && selectedRepaymentLoan ? (
                                            <Grid size={{ xs: 12 }}>
                                                <Stack spacing={1.4}>
                                                    <Stack
                                                        direction={{ xs: "column", sm: "row" }}
                                                        spacing={1}
                                                        useFlexGap
                                                        sx={{
                                                            mt: 0.5,
                                                            p: 1.5,
                                                            borderRadius: 2,
                                                            background: isDarkMode
                                                                ? `linear-gradient(135deg, ${alpha(DARK_MEMBER_ACCENT, 0.28)}, ${alpha(theme.palette.background.paper, 0.82)})`
                                                                : `linear-gradient(135deg, ${alpha(memberAccent, 0.12)}, ${alpha("#ffffff", 0.95)})`,
                                                            border: `1px solid ${alpha(memberAccent, isDarkMode ? 0.28 : 0.18)}`
                                                        }}
                                                    >
                                                        <Chip
                                                            size="small"
                                                            label={selectedRepaymentLoan.status === "in_arrears" ? "In arrears" : "Active loan"}
                                                            color={selectedRepaymentLoan.status === "in_arrears" ? "warning" : "default"}
                                                            sx={{
                                                                fontWeight: 800,
                                                                alignSelf: "flex-start",
                                                                bgcolor: alpha(memberAccent, isDarkMode ? 0.2 : 0.14),
                                                                color: memberAccentStrong
                                                            }}
                                                        />
                                                        <Stack spacing={0.15} sx={{ minWidth: 0, flex: 1 }}>
                                                            <Typography
                                                                variant="subtitle1"
                                                                sx={{
                                                                    fontWeight: 800,
                                                                    color: memberAccentStrong,
                                                                    lineHeight: 1.15
                                                                }}
                                                            >
                                                                {selectedRepaymentLoan.loan_number}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                                Outstanding principal {formatCurrency(selectedRepaymentLoan.outstanding_principal)} · Accrued interest {formatCurrency(selectedRepaymentLoan.accrued_interest)}
                                                            </Typography>
                                                        </Stack>
                                                        <Box
                                                            sx={{
                                                                px: 1.4,
                                                                py: 0.9,
                                                                borderRadius: 1.5,
                                                                minWidth: { xs: "100%", sm: 210 },
                                                                bgcolor: alpha(memberAccentStrong, isDarkMode ? 0.18 : 0.1),
                                                                border: `1px solid ${alpha(memberAccentStrong, isDarkMode ? 0.3 : 0.16)}`
                                                            }}
                                                        >
                                                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 0.4 }}>
                                                                OUTSTANDING
                                                            </Typography>
                                                            <Typography
                                                                variant="h6"
                                                                sx={{
                                                                    fontWeight: 900,
                                                                    color: memberAccentStrong,
                                                                    lineHeight: 1.1
                                                                }}
                                                            >
                                                                {formatCurrency(repaymentInsights.outstandingBalance)}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                    <Grid container spacing={1.25}>
                                                        <Grid size={{ xs: 12, md: 4 }}>
                                                            <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 1.5, height: "100%" }}>
                                                                <Typography variant="caption" color="text.secondary">Due now</Typography>
                                                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                                                    {formatCurrency(repaymentInsights.dueNowAmount)}
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Next due {formatDate(repaymentInsights.nextDueSchedule?.due_date || null)}
                                                                </Typography>
                                                            </Paper>
                                                        </Grid>
                                                        <Grid size={{ xs: 12, md: 4 }}>
                                                            <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 1.5, height: "100%" }}>
                                                                <Typography variant="caption" color="text.secondary">Interest to clear first</Typography>
                                                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                                                    {formatCurrency(repaymentInsights.payableInterest)}
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Principal outstanding {formatCurrency(selectedRepaymentLoan.outstanding_principal)}
                                                                </Typography>
                                                            </Paper>
                                                        </Grid>
                                                        <Grid size={{ xs: 12, md: 4 }}>
                                                            <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 1.5, height: "100%" }}>
                                                                <Typography variant="caption" color="text.secondary">Recommended amount</Typography>
                                                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                                                    {formatCurrency(repaymentInsights.recommendedAmount)}
                                                                </Typography>
                                                                <Stack direction="row" spacing={0.75} sx={{ mt: 0.8 }}>
                                                                    <Button
                                                                        size="small"
                                                                        variant="outlined"
                                                                        onClick={() => contributionPaymentForm.setValue("amount", Number(repaymentInsights.dueNowAmount.toFixed(2)), { shouldValidate: true })}
                                                                        disabled={repaymentInsights.dueNowAmount <= 0}
                                                                    >
                                                                        Use Due Now
                                                                    </Button>
                                                                    <Button
                                                                        size="small"
                                                                        variant="outlined"
                                                                        onClick={() => contributionPaymentForm.setValue("amount", Number(repaymentInsights.outstandingBalance.toFixed(2)), { shouldValidate: true })}
                                                                    >
                                                                        Clear Loan
                                                                    </Button>
                                                                </Stack>
                                                            </Paper>
                                                        </Grid>
                                                    </Grid>
                                                </Stack>
                                            </Grid>
                                        ) : selectedContributionAccount ? (
                                            <Grid size={{ xs: 12 }}>
                                                <Stack
                                                    direction={{ xs: "column", sm: "row" }}
                                                    spacing={1}
                                                    useFlexGap
                                                    sx={{
                                                        mt: 0.5,
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        background: isDarkMode
                                                            ? `linear-gradient(135deg, ${alpha(DARK_MEMBER_ACCENT, 0.28)}, ${alpha(theme.palette.background.paper, 0.82)})`
                                                            : `linear-gradient(135deg, ${alpha(memberAccent, 0.12)}, ${alpha("#ffffff", 0.95)})`,
                                                        border: `1px solid ${alpha(memberAccent, isDarkMode ? 0.28 : 0.18)}`
                                                    }}
                                                >
                                                    <Chip
                                                        size="small"
                                                        label={activePaymentCopy.title}
                                                        sx={{
                                                            fontWeight: 800,
                                                            alignSelf: "flex-start",
                                                            bgcolor: alpha(memberAccent, isDarkMode ? 0.2 : 0.14),
                                                            color: memberAccentStrong
                                                        }}
                                                    />
                                                    <Stack spacing={0.15} sx={{ minWidth: 0, flex: 1 }}>
                                                        <Typography
                                                            variant="subtitle1"
                                                            sx={{
                                                                fontWeight: 800,
                                                                color: memberAccentStrong,
                                                                lineHeight: 1.15
                                                            }}
                                                        >
                                                            {selectedContributionAccount.account_name}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                            {selectedContributionAccount.account_number}
                                                        </Typography>
                                                    </Stack>
                                                    <Box
                                                        sx={{
                                                            px: 1.4,
                                                            py: 0.9,
                                                            borderRadius: 1.5,
                                                            minWidth: { xs: "100%", sm: 210 },
                                                            bgcolor: alpha(memberAccentStrong, isDarkMode ? 0.18 : 0.1),
                                                            border: `1px solid ${alpha(memberAccentStrong, isDarkMode ? 0.3 : 0.16)}`
                                                        }}
                                                    >
                                                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 0.4 }}>
                                                            BALANCE
                                                        </Typography>
                                                        <Typography
                                                            variant="h6"
                                                            sx={{
                                                                fontWeight: 900,
                                                                color: memberAccentStrong,
                                                                lineHeight: 1.1
                                                            }}
                                                        >
                                                            {formatCurrency(selectedContributionAccount.available_balance + selectedContributionAccount.locked_balance)}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </Grid>
                                        ) : null}
                                    </Grid>
                                </Paper>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <TextField
                                            label={activePaymentCopy.amountLabel}
                                            type="number"
                                            fullWidth
                                            {...contributionPaymentForm.register("amount")}
                                            disabled={paymentFlowPurpose === "membership_fee"}
                                            error={Boolean(contributionPaymentForm.formState.errors.amount)}
                                            helperText={
                                                contributionPaymentForm.formState.errors.amount?.message
                                                || (paymentFlowPurpose === "loan_repayment"
                                                    ? repaymentInsights.excessOverOutstanding > 0
                                                        ? `Entered amount exceeds the outstanding balance by ${formatCurrency(repaymentInsights.excessOverOutstanding)}.`
                                                        : activePaymentCopy.helperText
                                                    : activePaymentCopy.helperText)
                                            }
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <TextField
                                            select
                                            label="Mobile Provider"
                                            fullWidth
                                            value={contributionPaymentForm.watch("provider")}
                                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                                contributionPaymentForm.setValue(
                                                    "provider",
                                                    event.target.value as ContributionPaymentValues["provider"],
                                                    { shouldValidate: true }
                                                )
                                            }
                                        >
                                            {contributionProviderOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <TextField
                                            label="Phone Number"
                                            fullWidth
                                            {...contributionPaymentForm.register("msisdn")}
                                            error={Boolean(contributionPaymentForm.formState.errors.msisdn)}
                                            helperText={contributionPaymentForm.formState.errors.msisdn?.message || "Number that receives the payment prompt."}
                                        />
                                    </Grid>
                                </Grid>
                                {paymentFlowPurpose === "loan_repayment" && selectedRepaymentLoan ? (
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 1.25,
                                            borderRadius: 1.5,
                                            bgcolor: alpha(theme.palette.info.main, isDarkMode ? 0.1 : 0.04),
                                            borderColor: alpha(theme.palette.info.main, isDarkMode ? 0.24 : 0.14)
                                        }}
                                    >
                                        <Stack spacing={1}>
                                            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} useFlexGap>
                                                <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 140 }}>
                                                    Repayment allocation
                                                </Typography>
                                                <Stack spacing={0.45}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Interest component: {formatCurrency(repaymentInsights.interestAllocation)}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Principal component: {formatCurrency(repaymentInsights.principalAllocation)}
                                                    </Typography>
                                                    {repaymentInsights.shortfallAmount > 0 ? (
                                                        <Typography variant="body2" color="warning.main">
                                                            Shortfall against current due amount: {formatCurrency(repaymentInsights.shortfallAmount)}
                                                        </Typography>
                                                    ) : null}
                                                    {repaymentInsights.extraAmount > 0 && repaymentInsights.excessOverOutstanding <= 0 ? (
                                                        <Typography variant="body2" color="success.main">
                                                            Extra over current due: {formatCurrency(repaymentInsights.extraAmount)} and it will reduce principal early.
                                                        </Typography>
                                                    ) : null}
                                                    {repaymentInsights.matchesDueNow && repaymentInsights.dueNowAmount > 0 ? (
                                                        <Typography variant="body2" color="success.main">
                                                            Entered amount matches the amount currently due.
                                                        </Typography>
                                                    ) : null}
                                                </Stack>
                                            </Stack>
                                        </Stack>
                                    </Paper>
                                ) : null}
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 1.25,
                                        borderRadius: 1.5,
                                        bgcolor: alpha(theme.palette.info.main, isDarkMode ? 0.12 : 0.05),
                                        borderColor: alpha(theme.palette.info.main, isDarkMode ? 0.28 : 0.14)
                                    }}
                                >
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={0.8} useFlexGap>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: "info.main", minWidth: 92 }}>
                                            Provider note
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {selectedContributionProvider.helper}
                                        </Typography>
                                    </Stack>
                                </Paper>
                                <TextField
                                    label="Narration (optional)"
                                    fullWidth
                                    multiline
                                    minRows={1}
                                    {...contributionPaymentForm.register("description")}
                                    error={Boolean(contributionPaymentForm.formState.errors.description)}
                                    helperText={contributionPaymentForm.formState.errors.description?.message || `Optional note shown on the posted ${activePaymentCopy.noun}.`}
                                />
                            </Box>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    {contributionFlowState ? (
                        <>
                            {trackedContributionOrder?.status === "pending" && !phoneCancellationRequested ? (
                                <Button onClick={handleMarkCancelledOnPhone} disabled={checkingPaymentStatus}>
                                    I Cancelled on Phone
                                </Button>
                            ) : null}
                            {trackedContributionOrder?.status === "pending" ? (
                                <Button
                                    variant={paymentApprovalTakingLongerThanExpected ? "contained" : "text"}
                                    onClick={() => void refreshTrackedPaymentOrder(true)}
                                    disabled={checkingPaymentStatus}
                                >
                                    {checkingPaymentStatus ? "Checking..." : "Check Status"}
                                </Button>
                            ) : null}
                            {trackedContributionOrder?.status === "pending" ? (
                                <Button
                                    variant={paymentApprovalTakingLongerThanExpected ? "outlined" : "text"}
                                    onClick={handleStopTrackingPayment}
                                    disabled={checkingPaymentStatus || submittingContribution}
                                >
                                    {paymentApprovalTakingLongerThanExpected ? "Close and Track Later" : "Stop Tracking"}
                                </Button>
                            ) : null}
                            {trackedContributionOrder?.status === "paid" && !trackedContributionOrder.posted_at ? (
                                <Button onClick={() => void handleReconcilePaymentOrder()} disabled={reconcilingPayment}>
                                    {reconcilingPayment ? "Reconciling..." : "Reconcile Payment"}
                                </Button>
                            ) : null}
                            {trackedContributionOrder && ["posted", "failed", "expired"].includes(trackedContributionOrder.status) ? (
                                <Button onClick={prepareAnotherContribution}>Start Another</Button>
                            ) : null}
                            <Button onClick={() => setShowContributionDialog(false)} disabled={submittingContribution}>
                                {trackedContributionOrder?.status === "posted" ? "Done" : "Close"}
                            </Button>
                        </>
                    ) : (
                        <>
                                <Button onClick={() => setShowContributionDialog(false)}>Cancel</Button>
                            <Button
                                variant="contained"
                                type="submit"
                                form="member-contribution-form"
                                disabled={
                                    submittingContribution
                                    || (paymentFlowPurpose === "loan_repayment" && (!selectedRepaymentLoan || repaymentInsights.excessOverOutstanding > 0))
                                }
                                sx={
                                    isDarkMode
                                        ? { bgcolor: memberAccent, color: "#1a1a1a", "&:hover": { bgcolor: memberAccentAlt } }
                                        : undefined
                                }
                            >
                                {submittingContribution
                                    ? "Starting..."
                                    : paymentFlowPurpose === "membership_fee"
                                        ? "Start Membership Fee Payment"
                                        : paymentFlowPurpose === "loan_repayment"
                                            ? "Start Loan Repayment"
                                        : paymentFlowPurpose === "savings_deposit"
                                            ? "Start Savings Deposit"
                                            : "Start Share Contribution"}
                            </Button>
                        </>
                    )}
                </DialogActions>
            </MotionModal>

            <PaymentReceiptDialog
                receipt={selectedPaymentReceipt}
                open={Boolean(selectedPaymentReceipt)}
                onClose={() => setSelectedPaymentReceipt(null)}
                formatPaymentPurpose={formatPaymentPurpose}
                formatPaymentStatus={formatPaymentStatus}
            />

            <MotionModal
                open={showApplyDialog}
                onClose={submittingApplication || isDeletingActiveLoanApplicationDraft ? undefined : closeLoanApplicationDialog}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        width: "100%",
                        maxWidth: { xs: "calc(100vw - 16px)", sm: "calc(100vw - 32px)", md: "960px" },
                        maxHeight: { xs: "calc(100vh - 16px)", md: "calc(100vh - 32px)" },
                        minHeight: { md: 620 },
                        display: "flex",
                        overflow: "hidden"
                    }
                }}
            >
                <DialogTitle>
                    {isEditingDraftLoanApplication
                        ? "Continue Draft Loan Application"
                        : isEditingRejectedLoanApplication
                            ? "Edit Rejected Loan Application"
                            : "Apply for Loan"}
                </DialogTitle>
                <DialogContent
                    dividers
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        py: 1.5
                    }}
                >
                    <Stack spacing={1.25} sx={{ pt: 0.25, minHeight: 0, flex: 1 }}>
                        {/* Only on the first step. It explains what the whole dialog does,
                            which is not news by the time you are entering an amount. The
                            inactive-profile, problem-loan and in-progress-application
                            warnings that used to sit here are all already listed under
                            "Submission is currently locked" below. */}
                        {isLoanProductStep ? (
                            <Alert severity="info" variant="outlined" sx={{ py: 0.35 }}>
                                {isEditingDraftLoanApplication
                                    ? "Continue your saved draft — you can save changes now and submit later."
                                    : isEditingRejectedLoanApplication
                                        ? "Update the rejected details, then resubmit for appraisal."
                                        : "No money moves until a teller disburses an approved application."}
                            </Alert>
                        ) : null}
                        {loanSubmissionLocks.length ? (
                            <Alert severity="warning" variant="outlined" sx={{ py: 0.35 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    Submission is currently locked
                                </Typography>
                                <Stack spacing={0.35}>
                                    {loanSubmissionLocks.map((reason) => (
                                        <Typography key={reason} variant="body2">
                                            • {reason}
                                        </Typography>
                                    ))}
                                </Stack>
                                {selectedLoanDraft && !isEditingDraftLoanApplication ? (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        sx={{ mt: 1.25, alignSelf: "flex-start" }}
                                        onClick={() => openLoanApplicationEditor(selectedLoanDraft)}
                                    >
                                        Continue Existing Draft
                                    </Button>
                                ) : null}
                            </Alert>
                        ) : null}
                        {/* A single warning reads as a sentence, not as a headed bullet list. */}
                        {loanCapacityWarnings.length ? (
                            <Alert severity="warning" variant="outlined" sx={{ py: 0.35 }}>
                                {loanCapacityWarnings.length === 1 ? (
                                    <Typography variant="body2">{loanCapacityWarnings[0]}</Typography>
                                ) : (
                                    <Stack spacing={0.35}>
                                        {loanCapacityWarnings.map((reason) => (
                                            <Typography key={reason} variant="body2">
                                                • {reason}
                                            </Typography>
                                        ))}
                                    </Stack>
                                )}
                            </Alert>
                        ) : null}
                        {loanLiquidityNotice ? (
                            <Alert severity="info" variant="outlined" sx={{ py: 0.35 }}>
                                {loanLiquidityNotice}
                            </Alert>
                        ) : null}
                        <Box
                            component="form"
                            id="member-loan-application-form"
                            onSubmit={submitLoanApplication}
                            sx={{ display: "flex", flexDirection: "column", gap: 1.35, minHeight: 0, flex: 1 }}
                        >
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: { xs: 0.95, sm: 1.1, md: 1.4 },
                                    borderRadius: 1.25,
                                    bgcolor: alpha(memberAccent, isDarkMode ? 0.08 : 0.03),
                                    borderColor: alpha(memberAccent, 0.2)
                                }}
                            >
                                <Stack spacing={0.9}>
                                    {isMobile ? (
                                        // The chips are numbered, so a "Step 3 of 4" chip and a
                                        // percentage read-out alongside them said the same thing
                                        // three ways. The chips and the progress bar are enough.
                                        <Stack spacing={0.85}>
                                            <Stack direction="row" spacing={0.75} sx={{ overflowX: "auto", pb: 0.25, "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none" }}>
                                                {loanApplicationSteps.map((step, index) => {
                                                    const isActive = index === loanFormStep;
                                                    const isCompleted = index < loanFormStep;

                                                    return (
                                                        <Chip
                                                            key={step.label}
                                                            label={`${index + 1}. ${step.label}`}
                                                            size="small"
                                                            variant={isActive ? "filled" : "outlined"}
                                                            sx={{
                                                                flexShrink: 0,
                                                                borderRadius: 1.1,
                                                                fontWeight: 700,
                                                                bgcolor: isActive ? memberAccent : isCompleted ? alpha(memberAccentStrong, 0.1) : "transparent",
                                                                color: isActive ? "#fff" : isCompleted ? memberAccentStrong : "text.secondary",
                                                                borderColor: isActive ? memberAccent : alpha(memberAccent, 0.2)
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </Stack>
                                        </Stack>
                                    ) : (
                                        <Stepper
                                            activeStep={loanFormStep}
                                            alternativeLabel
                                            sx={{
                                                "& .MuiStepLabel-root": {
                                                    px: 0
                                                },
                                                "& .MuiStepConnector-line": {
                                                    borderColor: alpha(memberAccent, 0.2)
                                                },
                                                "& .MuiStepLabel-label": {
                                                    fontWeight: 700,
                                                    mt: 0.35,
                                                    fontSize: { xs: "0.82rem", sm: "0.9rem" }
                                                },
                                                "& .MuiStepLabel-label.Mui-active": {
                                                    color: "text.primary"
                                                },
                                                "& .MuiStepLabel-label.Mui-completed": {
                                                    color: "text.secondary"
                                                },
                                                "& .MuiStepIcon-root": {
                                                    color: alpha(memberAccent, 0.2),
                                                    fontSize: "1.55rem"
                                                },
                                                "& .MuiStepIcon-root.Mui-active": {
                                                    color: memberAccent
                                                },
                                                "& .MuiStepIcon-root.Mui-completed": {
                                                    color: memberAccentStrong
                                                }
                                            }}
                                        >
                                            {loanApplicationSteps.map((step) => (
                                                <Step key={step.label}>
                                                    <StepLabel>{step.label}</StepLabel>
                                                </Step>
                                            ))}
                                        </Stepper>
                                    )}
                                    <Box
                                        sx={{
                                            height: 4,
                                            borderRadius: 999,
                                            bgcolor: alpha(memberAccent, 0.12),
                                            overflow: "hidden"
                                        }}
                                    >
                                        <Box
                                            component={motion.div}
                                            animate={{ width: `${loanStepProgressPercent}%` }}
                                            transition={prefersReducedMotion ? easeOutFast : springSoft}
                                            sx={{
                                                height: "100%",
                                                borderRadius: 999,
                                                bgcolor: memberAccent
                                            }}
                                        />
                                    </Box>
                                </Stack>
                            </Paper>

                            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", mx: -0.5, px: 0.5 }}>
                            <AnimatePresence mode="wait" initial={false}>
                                <Box
                                    key={loanFormStep}
                                    component={motion.div}
                                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.992 }}
                                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.992 }}
                                    transition={prefersReducedMotion ? easeOutFast : springSoft}
                                    style={{ width: "100%" }}
                                >
                                    {isLoanProductStep ? (
                                        <Stack spacing={2} sx={{ width: "100%", minWidth: 0 }}>
                                    <Box>
                                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>
                                            Loan Product
                                        </Typography>
                                        <SearchableSelect
                                            value={loanApplicationForm.watch("product_id")}
                                            options={loanProductOptions}
                                            onChange={(value) => loanApplicationForm.setValue("product_id", value, { shouldValidate: true })}
                                            placeholder="Search loan product..."
                                            dropdownDirection="up"
                                        />
                                        {loanApplicationForm.formState.errors.product_id ? (
                                            <Typography variant="caption" color="error.main">
                                                {loanApplicationForm.formState.errors.product_id.message}
                                            </Typography>
                                        ) : null}
                                    </Box>
                                    {selectedLoanProduct ? (
                                        <Card
                                            variant="outlined"
                                            sx={{
                                                width: "100%",
                                                minWidth: 0,
                                                maxWidth: "100%",
                                                boxSizing: "border-box",
                                                borderRadius: 1.1,
                                                borderColor: alpha(memberAccent, 0.24),
                                                bgcolor: alpha(memberAccent, isDarkMode ? 0.14 : 0.05)
                                            }}
                                        >
                                            {/* Facts only, three across. The product name used to be
                                                repeated as an h6 directly under the dropdown that already
                                                shows it, followed by the author-entered description — which
                                                on the live products reads "stored as 36% annual for the
                                                existing loan engine". None of that helps a member choose. */}
                                            <CardContent sx={{ display: "grid", gap: 1.5, minWidth: 0 }}>
                                                <Grid container spacing={1.5} sx={{ minWidth: 0 }}>
                                                    <Grid size={{ xs: 12, sm: 4 }}>
                                                        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1, width: "100%", minWidth: 0, boxSizing: "border-box", height: "100%" }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Interest
                                                            </Typography>
                                                            <Typography variant="body1" sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>
                                                                {formatMonthlyLoanRate(selectedLoanProduct.annual_interest_rate)}
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 4 }}>
                                                        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1, width: "100%", minWidth: 0, boxSizing: "border-box", height: "100%" }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                You can borrow
                                                            </Typography>
                                                            <Typography variant="body1" sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>
                                                                {formatCurrency(selectedLoanMinimumAmount)} to {selectedLoanProduct.max_amount ? formatCurrency(selectedLoanProduct.max_amount) : "No capped max"}
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 4 }}>
                                                        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1, width: "100%", minWidth: 0, boxSizing: "border-box", height: "100%" }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Repay
                                                            </Typography>
                                                            <Typography variant="body1" sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>
                                                                {selectedLoanPolicy.allowedRepaymentFrequencies.map((frequency) => getRepaymentFrequencyLabel(frequency)).join(", ")}
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    ) : null}
                                        </Stack>
                                    ) : null}

                                    {isLoanEligibilityStep ? (
                                        selectedLoanProduct ? (
                                            <Box
                                                component={motion.div}
                                                initial={prefersReducedMotion ? false : { opacity: 0.96, y: 6 }}
                                                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                                                transition={prefersReducedMotion ? undefined : springSoft}
                                            >
                                                <LoanEligibilitySummary
                                                    summary={loanCapacity}
                                                    loading={loanCapacityLoading}
                                                    error={loanCapacityError}
                                                    title="Loan Eligibility"
                                                    compact
                                                />
                                            </Box>
                                        ) : (
                                            <Alert severity="info" variant="outlined">
                                                Select a loan product first to view your live eligibility summary.
                                            </Alert>
                                        )
                                    ) : null}

                                    {isLoanDetailsStep ? (
                                        <Stack spacing={2}>
                                    {isTopUpApplication ? (
                                        <Alert severity="info" variant="outlined">
                                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                                                This is a top-up — you already have a loan
                                            </Typography>
                                            <Typography variant="body2">
                                                Your current balance of {formatCurrency(topUpSettlement)} is settled out of the new loan, so you keep only one loan. Enter the extra cash you want below; you will receive that amount, and the new loan will be {formatCurrency(topUpSettlement + topUpNewCash)}.
                                            </Typography>
                                            <Stack spacing={0.25} sx={{ mt: 1 }}>
                                                {(topUpQuote?.loans || []).map((loan) => (
                                                    <Typography key={loan.loan_id} variant="caption" color="text.secondary">
                                                        {loan.loan_number} — {formatCurrency(loan.settle_amount)}{loan.status === "in_arrears" ? " (overdue)" : ""}
                                                    </Typography>
                                                ))}
                                            </Stack>
                                        </Alert>
                                    ) : loanCapacity?.has_problem_loans ? (
                                        <Alert severity="error" variant="outlined">
                                            You have an overdue loan. New applications are not accepted until the overdue amount is cleared.
                                        </Alert>
                                    ) : null}
                                    {isTopUpApplication ? (
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, md: 4 }}>
                                                <TextField
                                                    label="Extra cash you want (TZS) *"
                                                    fullWidth
                                                    value={topUpNewCashInput}
                                                    onChange={(event) => setTopUpNewCashInput(formatWholeNumber(event.target.value.replace(/[^\d]/g, "")))}
                                                    helperText="What you actually receive at the counter."
                                                    inputProps={{ inputMode: "numeric" }}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 4 }}>
                                                <TextField
                                                    label="Settling your current loan(s)"
                                                    fullWidth
                                                    value={formatWholeNumber(String(topUpSettlement))}
                                                    InputProps={{ readOnly: true }}
                                                    helperText="Cleared out of the new loan — no cash needed from you."
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 4 }}>
                                                <TextField
                                                    label="New loan total"
                                                    fullWidth
                                                    value={formatWholeNumber(String(topUpSettlement + topUpNewCash))}
                                                    InputProps={{ readOnly: true }}
                                                    helperText="This is the amount the branch appraises and your guarantors cover."
                                                />
                                            </Grid>
                                        </Grid>
                                    ) : null}
                                    {selectedLoanBorrowLimit > 0 && Number(requestedLoanAmount || 0) > selectedLoanBorrowLimit ? (
                                        <Alert severity="warning" variant="outlined">
                                            {formatCurrency(Number(requestedLoanAmount || 0))} is above your current limit of {formatCurrency(selectedLoanBorrowLimit)} — you are {formatCurrency(Number(requestedLoanAmount || 0) - selectedLoanBorrowLimit)} over it. Lower the amount or choose a product that allows more.
                                        </Alert>
                                    ) : null}
                                    <TextField
                                        label="Loan Purpose *"
                                        placeholder="e.g. farming inputs, business expansion, school fees"
                                        fullWidth
                                        multiline
                                        // Fixed rows, not minRows/maxRows: the autosize textarea
                                        // mis-measures inside this dialog's flex + overflow content
                                        // area and blows up to full height.
                                        rows={3}
                                        {...loanApplicationForm.register("purpose")}
                                        error={Boolean(loanApplicationForm.formState.errors.purpose)}
                                        helperText={loanApplicationForm.formState.errors.purpose?.message || "Write it however you like, in English or Swahili."}
                                    />
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                label={isTopUpApplication ? "Requested Amount (settlement + extra cash)" : "Requested Amount (TZS) *"}
                                                fullWidth
                                                value={requestedAmountInput}
                                                InputProps={{ readOnly: isTopUpApplication }}
                                                onChange={(event) => {
                                                    if (isTopUpApplication) {
                                                        return;
                                                    }
                                                    const digits = event.target.value.replace(/[^\d]/g, "");
                                                    setRequestedAmountInput(formatWholeNumber(digits));
                                                    loanApplicationForm.setValue("requested_amount", digits ? Number(digits) : 0, { shouldValidate: true, shouldDirty: true });
                                                }}
                                                error={Boolean(loanApplicationForm.formState.errors.requested_amount)}
                                                helperText={
                                                    loanApplicationForm.formState.errors.requested_amount?.message
                                                    || (selectedLoanProduct
                                                        ? `Maximum recommended amount: ${formatCurrency(selectedLoanBorrowLimit)} · Product minimum ${formatCurrency(selectedLoanMinimumAmount)}`
                                                        : "Use Tanzanian Shillings only.")
                                                }
                                                inputProps={{ inputMode: "numeric" }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                label="Requested Loan Term (Months) *"
                                                type="number"
                                                fullWidth
                                                {...loanApplicationForm.register("requested_term_count")}
                                                error={Boolean(loanApplicationForm.formState.errors.requested_term_count)}
                                                helperText={
                                                    loanApplicationForm.formState.errors.requested_term_count?.message
                                                    || (selectedLoanProduct
                                                        ? `Min ${selectedLoanMinimumTerm} month(s)${selectedLoanMaximumTerm ? ` · Max ${selectedLoanMaximumTerm} month(s)` : ""}`
                                                        : "Enter a whole number of months.")
                                                }
                                                inputProps={{ min: 1, step: 1 }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                label="Interest Rate (% per month)"
                                                fullWidth
                                                value={annualToMonthlyRate(selectedLoanProduct?.annual_interest_rate ?? 0)}
                                                helperText="Automatically pulled from the selected loan product."
                                                InputProps={{ readOnly: true }}
                                            />
                                        </Grid>
                                        {selectedLoanProduct && requestedBorrowUtilizationPercent !== null && requestedLoanAmount > 0 ? (
                                            <Grid size={{ xs: 12 }}>
                                                <Paper
                                                    variant="outlined"
                                                    sx={{
                                                        p: 1.6,
                                                        borderRadius: 1,
                                                        bgcolor: alpha(requestedBorrowUtilizationTone, isDarkMode ? 0.12 : 0.05),
                                                        borderColor: alpha(requestedBorrowUtilizationTone, 0.22)
                                                    }}
                                                >
                                                    <Stack spacing={1}>
                                                        <Stack
                                                            direction={{ xs: "column", sm: "row" }}
                                                            justifyContent="space-between"
                                                            spacing={0.75}
                                                        >
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                                                Borrow Utilization
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 700, color: requestedBorrowUtilizationTone }}>
                                                                {Math.round(requestedBorrowUtilizationPercent)}% of your borrowing capacity
                                                            </Typography>
                                                        </Stack>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={Math.min(requestedBorrowUtilizationPercent, 100)}
                                                            sx={{
                                                                height: 10,
                                                                borderRadius: 999,
                                                                bgcolor: alpha(requestedBorrowUtilizationTone, 0.16),
                                                                "& .MuiLinearProgress-bar": {
                                                                    borderRadius: 999,
                                                                    bgcolor: requestedBorrowUtilizationTone
                                                                }
                                                            }}
                                                        />
                                                    </Stack>
                                                </Paper>
                                            </Grid>
                                        ) : null}
                                        {requestedAmountCapacityWarning ? (
                                            <Grid size={{ xs: 12 }}>
                                                <Alert severity="warning" variant="outlined">
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.4 }}>
                                                        Requested amount exceeds your recommended borrowing capacity.
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        Recommended maximum: {formatCurrency(selectedLoanBorrowLimit)}
                                                    </Typography>
                                                </Alert>
                                            </Grid>
                                        ) : null}
                                        {loanScheduleProjection && selectedLoanProduct ? (
                                            <Grid size={{ xs: 12 }}>
                                                <LoanSchedulePreview
                                                    projection={loanScheduleProjection}
                                                    interestMethod={selectedLoanProduct.interest_method === "reducing_balance" ? "reducing_balance" : "flat"}
                                                />
                                            </Grid>
                                        ) : null}
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <TextField
                                                select
                                                label="Repayment Frequency *"
                                                fullWidth
                                                value={loanApplicationForm.watch("requested_repayment_frequency")}
                                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                                    loanApplicationForm.setValue(
                                                        "requested_repayment_frequency",
                                                        event.target.value as LoanApplicationValues["requested_repayment_frequency"],
                                                        { shouldValidate: true }
                                                    )
                                                }
                                                error={Boolean(loanApplicationForm.formState.errors.requested_repayment_frequency)}
                                                helperText={loanApplicationForm.formState.errors.requested_repayment_frequency?.message}
                                            >
                                                {selectedLoanPolicy.allowedRepaymentFrequencies.map((frequency) => (
                                                    <MenuItem key={frequency} value={frequency}>
                                                        {getRepaymentFrequencyLabel(frequency)}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 1, height: "100%" }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Application Reference
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.35 }}>
                                                    {editingLoanApplicationId && loanApplicationForm.getValues("external_reference")
                                                        ? loanApplicationForm.getValues("external_reference")
                                                        : "Generated automatically on save"}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    The system creates a unique reference for every loan application.
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                        </Stack>
                                    ) : null}

                                    {isLoanReviewStep ? (
                                        <Stack spacing={2}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            borderRadius: 1.1,
                                            bgcolor: isDarkMode ? alpha(memberAccent, 0.08) : alpha(memberAccent, 0.04)
                                        }}
                                    >
                                        <Stack spacing={0.9}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                                Estimated Installment
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Principal: {formatCurrency(requestedLoanAmount || 0)} · Interest: {formatMonthlyLoanRate(selectedLoanProduct?.annual_interest_rate ?? 0)} · Term: {requestedLoanTerm || 0} months
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                                {selectedLoanProduct?.interest_method === "reducing_balance" ? "First" : "Monthly"} payment: {formatCurrency(loanScheduleProjection?.monthlyInstalment ?? installmentPreview?.installment ?? 0)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Total repayment: {formatCurrency(loanScheduleProjection?.totalRepayable ?? installmentPreview?.totalRepayment ?? 0)}
                                            </Typography>
                                        </Stack>
                                    </Paper>
                                    {loanScheduleProjection && selectedLoanProduct ? (
                                        <LoanSchedulePreview
                                            projection={loanScheduleProjection}
                                            interestMethod={selectedLoanProduct.interest_method === "reducing_balance" ? "reducing_balance" : "flat"}
                                        />
                                    ) : null}
                                    <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 1.1 }}>
                                        <Grid container spacing={1.5}>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Loan product
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.35 }}>
                                                    {selectedLoanProduct?.name || "Not selected"}
                                                </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Requested amount
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.35 }}>
                                                    {formatCurrency(requestedLoanAmount || 0)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25, fontStyle: "italic", overflowWrap: "anywhere" }}>
                                                    {amountToWords(requestedLoanAmount || 0)} Tanzanian Shillings only
                                                </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Requested term
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.35 }}>
                                                    {requestedLoanTerm || 0} month(s)
                                                </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Repayment frequency
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.35 }}>
                                                    {getRepaymentFrequencyLabel(requestedLoanFrequency)}
                                                </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Purpose
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.45 }}>
                                                    {loanApplicationForm.watch("purpose") || "No purpose entered yet."}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                    <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 1.1 }}>
                                        <Stack spacing={1.5}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                                Repayment &amp; loan type
                                            </Typography>
                                            <Grid container spacing={1.5}>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <TextField
                                                        select
                                                        fullWidth
                                                        label="Repayment mode"
                                                        value={loanApplicationForm.watch("repayment_mode") || "check_off"}
                                                        onChange={(event) =>
                                                            loanApplicationForm.setValue("repayment_mode", event.target.value as "check_off" | "standing_order", { shouldDirty: true })
                                                        }
                                                    >
                                                        <MenuItem value="check_off">Check-off (salary deduction)</MenuItem>
                                                        <MenuItem value="standing_order">Standing order</MenuItem>
                                                    </TextField>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <TextField
                                                        select
                                                        fullWidth
                                                        label="Loan type"
                                                        value={loanApplicationForm.watch("loan_category") || "new"}
                                                        onChange={(event) =>
                                                            loanApplicationForm.setValue("loan_category", event.target.value as "new" | "top_up", { shouldDirty: true })
                                                        }
                                                    >
                                                        <MenuItem value="new">New loan</MenuItem>
                                                        <MenuItem value="top_up" disabled={!portalRepaymentLoans.length}>Top-up an existing loan</MenuItem>
                                                    </TextField>
                                                </Grid>
                                                {loanApplicationForm.watch("loan_category") === "top_up" ? (
                                                    <Grid size={{ xs: 12 }}>
                                                        <TextField
                                                            select
                                                            fullWidth
                                                            label="Loan to top up"
                                                            value={loanApplicationForm.watch("top_up_of_loan_id") || ""}
                                                            onChange={(event) =>
                                                                loanApplicationForm.setValue("top_up_of_loan_id", event.target.value, { shouldDirty: true })
                                                            }
                                                            helperText="The existing loan this top-up adds to. The branch settles it manually."
                                                        >
                                                            <MenuItem value="">Select a loan</MenuItem>
                                                            {portalRepaymentLoans.map((loan) => (
                                                                <MenuItem key={loan.id} value={loan.id}>
                                                                    {loan.loan_number || loan.id.slice(0, 8)} · {formatCurrency(loan.outstanding_principal + loan.accrued_interest)} outstanding
                                                                </MenuItem>
                                                            ))}
                                                        </TextField>
                                                    </Grid>
                                                ) : null}
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        type="number"
                                                        label="Deposit purchase amount (optional)"
                                                        value={loanApplicationForm.watch("deposit_purchase_amount") || ""}
                                                        onChange={(event) =>
                                                            loanApplicationForm.setValue("deposit_purchase_amount", Number(event.target.value) || 0, { shouldDirty: true })
                                                        }
                                                        helperText="Extra deposits you commit to buy in for this loan, if any."
                                                    />
                                                </Grid>
                                            </Grid>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={loanApplicationForm.watch("application_fee_paid")}
                                                        onChange={(event) =>
                                                            loanApplicationForm.setValue("application_fee_paid", event.target.checked, { shouldDirty: true })
                                                        }
                                                    />
                                                }
                                                label="I have paid the loan application fee (attach the receipt under Supporting documents)."
                                            />
                                        </Stack>
                                    </Paper>
                                    <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 1.1 }}>
                                        <Stack spacing={1.5}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                                How should the loan be paid out?
                                            </Typography>
                                            <TextField
                                                select
                                                fullWidth
                                                label="Payout method"
                                                value={loanApplicationForm.watch("payout_method") || "cash"}
                                                onChange={(event) =>
                                                    loanApplicationForm.setValue("payout_method", event.target.value as "cash" | "direct_deposit" | "bank_transfer", { shouldDirty: true })
                                                }
                                            >
                                                <MenuItem value="cash">Cash at the branch (teller)</MenuItem>
                                                <MenuItem value="direct_deposit">Direct deposit to my account</MenuItem>
                                                <MenuItem value="bank_transfer">Bank transfer (IFT / EFT / RTGS)</MenuItem>
                                            </TextField>
                                            {loanApplicationForm.watch("payout_method") !== "cash" ? (
                                                <Grid container spacing={1.5}>
                                                    <Grid size={{ xs: 12, sm: 6 }}>
                                                        <TextField fullWidth label="Bank name" {...loanApplicationForm.register("payout_bank_name")} />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6 }}>
                                                        <TextField fullWidth label="Branch" {...loanApplicationForm.register("payout_bank_branch")} />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6 }}>
                                                        <TextField fullWidth label="Account name" {...loanApplicationForm.register("payout_account_name")} />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6 }}>
                                                        <TextField fullWidth label="Account number" {...loanApplicationForm.register("payout_account_number")} />
                                                    </Grid>
                                                </Grid>
                                            ) : null}
                                            <Typography variant="caption" color="text.secondary">
                                                Disbursement is processed manually by the teller — these details tell them how to pay you.
                                            </Typography>
                                        </Stack>
                                    </Paper>
                                    <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 1.1 }}>
                                        <Stack spacing={1.5}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                                Guarantors
                                            </Typography>
                                            {requiredGuaranteeAmount > 0 ? (
                                                <Alert severity="info" variant="outlined">
                                                    Your savings ({formatCurrency(totalSavings)}) cover part of this loan. Guarantors must cover the remaining {formatCurrency(requiredGuaranteeAmount)}. Each guarantor will approve their amount in their own portal before the loan is processed.
                                                </Alert>
                                            ) : (
                                                <Alert severity="success" variant="outlined">
                                                    This loan is fully covered by your own savings. Add at least one guarantor as a witness — no amounts are needed from them.
                                                </Alert>
                                            )}
                                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    label="Search guarantor by name or member number"
                                                    placeholder="e.g. Erick or ILS24-F00002"
                                                    value={guarantorLookupNo}
                                                    onChange={(event) => setGuarantorLookupNo(event.target.value)}
                                                    onKeyDown={(event) => {
                                                        if (event.key === "Enter") {
                                                            event.preventDefault();
                                                            void lookupGuarantorByMemberNo(guarantorSuggestions[0]);
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    variant="outlined"
                                                    onClick={() => void lookupGuarantorByMemberNo(guarantorSuggestions[0])}
                                                    disabled={guarantorLookupBusy || !guarantorLookupNo.trim() || guarantorDrafts.length >= guarantorMaxCount}
                                                    sx={{ whiteSpace: "nowrap" }}
                                                >
                                                    {guarantorLookupBusy ? "Checking..." : "Add Guarantor"}
                                                </Button>
                                            </Stack>
                                            {guarantorSuggestions.length ? (
                                                <Paper variant="outlined" sx={{ borderRadius: 1 }}>
                                                    {guarantorSuggestions.map((hit) => (
                                                        <Button
                                                            key={hit.member_id}
                                                            fullWidth
                                                            onClick={() => void lookupGuarantorByMemberNo(hit)}
                                                            disabled={guarantorLookupBusy}
                                                            sx={{ justifyContent: "space-between", textTransform: "none", px: 1.5 }}
                                                        >
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{hit.full_name}</Typography>
                                                            <Typography variant="caption" color="text.secondary">{hit.member_no}</Typography>
                                                        </Button>
                                                    ))}
                                                </Paper>
                                            ) : guarantorSearchState === "searching" ? (
                                                <Typography variant="caption" color="text.secondary">
                                                    Searching members...
                                                </Typography>
                                            ) : guarantorSearchState === "error" ? (
                                                <Alert severity="error" variant="outlined" sx={{ py: 0.35 }}>
                                                    {guarantorSearchError}
                                                </Alert>
                                            ) : guarantorSearchState === "done" ? (
                                                <Typography variant="caption" color="text.secondary">
                                                    No other active member matches "{guarantorLookupNo.trim()}". Try a surname or the full member number — you cannot guarantee your own loan, so your own name will not appear.
                                                </Typography>
                                            ) : null}
                                            {guarantorDrafts.length ? (
                                                <Stack spacing={1}>
                                                    {guarantorDrafts.map((row, index) => (
                                                        <Paper key={row.member_id} variant="outlined" sx={{ p: 1.25, borderRadius: 1 }}>
                                                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} justifyContent="space-between">
                                                                <Box sx={{ minWidth: 0 }}>
                                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                                        {row.full_name}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {row.member_no}{row.available_amount !== null && requiredGuaranteeAmount > 0
                                                                            ? ` · can guarantee up to ${formatCurrency(row.available_amount)}`
                                                                            : ""}
                                                                    </Typography>
                                                                </Box>
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    {requiredGuaranteeAmount > 0 ? (
                                                                        <TextField
                                                                            size="small"
                                                                            type="number"
                                                                            label="Amount"
                                                                            value={row.guaranteed_amount || ""}
                                                                            onChange={(event) => {
                                                                                const nextValue = Number(event.target.value) || 0;
                                                                                setGuarantorDrafts((prev) => prev.map((item, itemIndex) =>
                                                                                    itemIndex === index ? { ...item, guaranteed_amount: nextValue } : item));
                                                                            }}
                                                                            error={row.available_amount !== null && row.guaranteed_amount > row.available_amount}
                                                                            helperText={row.available_amount !== null && row.guaranteed_amount > row.available_amount
                                                                                ? "Exceeds their capacity"
                                                                                : undefined}
                                                                            sx={{ width: 160 }}
                                                                        />
                                                                    ) : (
                                                                        <Chip size="small" variant="outlined" label="Witness" />
                                                                    )}
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => setGuarantorDrafts((prev) => prev.filter((item) => item.member_id !== row.member_id))}
                                                                        aria-label="Remove guarantor"
                                                                    >
                                                                        <CloseRoundedIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Stack>
                                                            </Stack>
                                                        </Paper>
                                                    ))}
                                                    {requiredGuaranteeAmount > 0 ? (
                                                        <Stack spacing={0.5}>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={Math.min(100, (allocatedGuaranteeAmount / requiredGuaranteeAmount) * 100)}
                                                                sx={{ height: 8, borderRadius: 4 }}
                                                            />
                                                            <Typography variant="caption" color={remainingGuaranteeAmount > 0 ? "warning.main" : "success.main"}>
                                                                {formatCurrency(allocatedGuaranteeAmount)} / {formatCurrency(requiredGuaranteeAmount)} allocated
                                                                {remainingGuaranteeAmount > 0 ? ` — ${formatCurrency(remainingGuaranteeAmount)} remaining` : " — fully covered"}
                                                            </Typography>
                                                        </Stack>
                                                    ) : null}
                                                </Stack>
                                            ) : (
                                                <Typography variant="caption" color="text.secondary">
                                                    No guarantors added yet. You can add up to {guarantorMaxCount}.
                                                </Typography>
                                            )}
                                        </Stack>
                                    </Paper>
                                    <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 1.1 }}>
                                        <Stack spacing={1}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                                Supporting documents (optional)
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Attach National ID, supporting docs, and guarantor IDs — JPG, PNG or PDF, up to 5MB each.
                                            </Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                {([
                                                    { key: "national_id", label: "National ID" },
                                                    { key: "supporting_document", label: "Supporting doc" },
                                                    { key: "guarantor_id", label: "Guarantor ID" }
                                                ] as const).map((doc) => {
                                                    const file = loanDocuments[doc.key];
                                                    return (
                                                        <Button
                                                            key={doc.key}
                                                            component="label"
                                                            size="small"
                                                            variant={file ? "contained" : "outlined"}
                                                            color={file ? "success" : "primary"}
                                                            startIcon={file ? <CheckRoundedIcon fontSize="small" /> : <UploadFileRoundedIcon fontSize="small" />}
                                                            sx={{ textTransform: "none", maxWidth: 220, "& .MuiButton-startIcon": { mr: 0.5 } }}
                                                        >
                                                            <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                {file ? file.name : doc.label}
                                                            </Box>
                                                            <input
                                                                hidden
                                                                type="file"
                                                                accept="image/jpeg,image/png,application/pdf"
                                                                onChange={(event) =>
                                                                    setLoanDocuments((prev) => ({ ...prev, [doc.key]: event.target.files?.[0] || null }))
                                                                }
                                                            />
                                                        </Button>
                                                    );
                                                })}
                                            </Stack>
                                        </Stack>
                                    </Paper>
                                    {!loanSubmissionLocks.length && visibleLoanFormErrors.length ? (
                                        <Alert severity="info" variant="outlined">
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                                                Complete these items before submitting
                                            </Typography>
                                            <Stack spacing={0.35}>
                                                {visibleLoanFormErrors.map((message) => (
                                                    <Typography key={message} variant="body2">
                                                        • {message}
                                                    </Typography>
                                                ))}
                                            </Stack>
                                        </Alert>
                                    ) : null}
                                    {selectedLoanProduct?.terms_and_conditions ? (
                                        <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 1.1 }}>
                                            <Stack spacing={1}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                                    Terms &amp; Conditions
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        maxHeight: 200,
                                                        overflowY: "auto",
                                                        p: 1.25,
                                                        borderRadius: 1,
                                                        border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                                                        bgcolor: isDarkMode ? alpha("#FFFFFF", 0.03) : alpha("#000000", 0.02),
                                                        whiteSpace: "pre-wrap",
                                                        fontSize: 13
                                                    }}
                                                >
                                                    {selectedLoanProduct.terms_and_conditions}
                                                </Box>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={loanApplicationForm.watch("terms_accepted")}
                                                            onChange={(event) =>
                                                                loanApplicationForm.setValue("terms_accepted", event.target.checked, { shouldValidate: true, shouldDirty: true })
                                                            }
                                                        />
                                                    }
                                                    label="I have read and agree to the Terms & Conditions."
                                                />
                                                {loanApplicationForm.formState.errors.terms_accepted ? (
                                                    <Typography variant="caption" color="error.main">
                                                        {loanApplicationForm.formState.errors.terms_accepted.message}
                                                    </Typography>
                                                ) : null}
                                            </Stack>
                                        </Paper>
                                    ) : null}
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={loanApplicationForm.watch("confirmation_checked")}
                                                onChange={(event) =>
                                                    loanApplicationForm.setValue("confirmation_checked", event.target.checked, { shouldValidate: true, shouldDirty: true })
                                                }
                                            />
                                        }
                                        label="I confirm the information provided in this loan application is accurate."
                                    />
                                    {loanApplicationForm.formState.errors.confirmation_checked ? (
                                        <Typography variant="caption" color="error.main">
                                            {loanApplicationForm.formState.errors.confirmation_checked.message}
                                        </Typography>
                                    ) : null}
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={loanApplicationForm.watch("declaration_accepted")}
                                                onChange={(event) =>
                                                    loanApplicationForm.setValue("declaration_accepted", event.target.checked, { shouldValidate: true, shouldDirty: true })
                                                }
                                            />
                                        }
                                        label="I authorize ILBORU Alumni SACCOS to verify my credit information with a Credit Reference Bureau (CRB) and to list defaults, I authorize repayment deductions (including interest) from my income or account, and I agree to abide by the Society's by-laws."
                                    />
                                    {loanApplicationForm.formState.errors.declaration_accepted ? (
                                        <Typography variant="caption" color="error.main">
                                            {loanApplicationForm.formState.errors.declaration_accepted.message}
                                        </Typography>
                                    ) : null}
                                        </Stack>
                                    ) : null}
                                </Box>
                            </AnimatePresence>
                            </Box>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions
                    sx={{
                        flexDirection: { xs: "column-reverse", sm: "row" },
                        alignItems: { xs: "stretch", sm: "center" },
                        gap: { xs: 1, sm: 0.5 },
                        px: { xs: 2, sm: 3 },
                        pb: { xs: 2, sm: 1.5 }
                    }}
                >
                    {isEditingDraftLoanApplication ? (
                        <Button
                            color="error"
                            onClick={() => editingLoanApplication && setPendingDraftDeletion(editingLoanApplication)}
                            disabled={submittingApplication || isDeletingActiveLoanApplicationDraft}
                        >
                            {isDeletingActiveLoanApplicationDraft ? "Deleting Draft..." : "Delete Draft"}
                        </Button>
                    ) : null}
                    <Button
                        onClick={closeLoanApplicationDialog}
                        disabled={isDeletingActiveLoanApplicationDraft}
                    >
                        Cancel
                    </Button>
                    {loanFormStep > 0 ? (
                        <Button
                            onClick={handleRetreatLoanFormStep}
                            startIcon={<ChevronLeftRoundedIcon />}
                            disabled={isDeletingActiveLoanApplicationDraft}
                        >
                            Back
                        </Button>
                    ) : null}
                    {isLoanReviewStep ? (
                        <>
                            {isEditingDraftLoanApplication ? (
                                <Button
                                    variant="outlined"
                                    onClick={() => void saveLoanApplicationDraft()}
                                    disabled={submittingApplication || isDeletingActiveLoanApplicationDraft}
                                    fullWidth={isMobile}
                                >
                                    {submittingApplication ? "Saving..." : "Save Draft Changes"}
                                </Button>
                            ) : null}
                            <Button
                                variant="contained"
                                type="submit"
                                form="member-loan-application-form"
                                disabled={submittingApplication || isDeletingActiveLoanApplicationDraft || loanSubmissionLocks.length > 0}
                                fullWidth={isMobile}
                                sx={
                                    isDarkMode
                                        ? { bgcolor: memberAccent, color: "#1a1a1a", "&:hover": { bgcolor: memberAccentAlt } }
                                        : undefined
                                }
                            >
                                {submittingApplication
                                    ? "Submitting..."
                                    : isEditingRejectedLoanApplication
                                        ? "Save & Resubmit"
                                        : "Submit Application"}
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={() => void handleAdvanceLoanFormStep()}
                            disabled={submittingApplication || isDeletingActiveLoanApplicationDraft || (isLoanProductStep && !selectedLoanProduct)}
                            fullWidth={isMobile}
                            sx={
                                isDarkMode
                                    ? { bgcolor: memberAccent, color: "#1a1a1a", "&:hover": { bgcolor: memberAccentAlt } }
                                    : undefined
                            }
                        >
                            Continue
                        </Button>
                    )}
                </DialogActions>
            </MotionModal>

            <MotionModal
                open={showProfileCompletionDialog}
                onClose={savingProfileCompletion ? undefined : () => setShowProfileCompletionDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Complete Member Profile</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ mt: 0.25 }}>
                        <Alert severity="info" variant="outlined">
                            Fill the missing identity, address, and next-of-kin information on your member profile. Branch-controlled items such as membership type, share commitments, and KYC decisions remain managed by your branch.
                        </Alert>

                        {memberProfileMissingFields.length ? (
                            <Alert severity="warning" variant="outlined">
                                Missing now: {memberProfileMissingFields.join(", ")}.
                            </Alert>
                        ) : null}

                        <Box component="form" id="member-profile-completion-form" onSubmit={submitProfileCompletion}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12 }}>
                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                        <Stack spacing={1.4}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                                Identity and contact
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField fullWidth label="Full name" {...memberProfileCompletionForm.register("full_name")} {...completionFieldError("full_name")} />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 3 }}>
                                                    <TextField
                                                        fullWidth
                                                        type="date"
                                                        label="Date of birth"
                                                        InputLabelProps={{ shrink: true }}
                                                        {...memberProfileCompletionForm.register("dob")}
                                                        error={Boolean(memberProfileCompletionForm.formState.errors.dob)}
                                                        helperText={memberProfileCompletionForm.formState.errors.dob?.message}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 3 }}>
                                                    <TextField
                                                        select
                                                        fullWidth
                                                        label="Gender"
                                                        InputLabelProps={{ shrink: true }}
                                                        value={memberProfileCompletionForm.watch("gender") ?? ""}
                                                        {...memberProfileCompletionForm.register("gender")}
                                                        {...completionFieldError("gender")}
                                                    >
                                                        <MenuItem value="">Not set</MenuItem>
                                                        <MenuItem value="male">Male</MenuItem>
                                                        <MenuItem value="female">Female</MenuItem>
                                                    </TextField>
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="Phone number"
                                                        placeholder="2557XXXXXXXX or +2547XXXXXXXX"
                                                        {...memberProfileCompletionForm.register("phone")}
                                                        error={Boolean(memberProfileCompletionForm.formState.errors.phone)}
                                                        helperText={memberProfileCompletionForm.formState.errors.phone?.message || "Tanzania format starting with 255, or an international number starting with +."}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="Email"
                                                        {...memberProfileCompletionForm.register("email")}
                                                        error={Boolean(memberProfileCompletionForm.formState.errors.email)}
                                                        helperText={memberProfileCompletionForm.formState.errors.email?.message}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <TextField
                                                        select
                                                        fullWidth
                                                        label="Marital status"
                                                        InputLabelProps={{ shrink: true }}
                                                        value={memberProfileCompletionForm.watch("marital_status") ?? ""}
                                                        {...memberProfileCompletionForm.register("marital_status")}
                                                        {...completionFieldError("marital_status")}
                                                    >
                                                        <MenuItem value="">Not set</MenuItem>
                                                        <MenuItem value="single">Single</MenuItem>
                                                        <MenuItem value="married">Married</MenuItem>
                                                        <MenuItem value="divorced">Divorced</MenuItem>
                                                        <MenuItem value="widowed">Widowed</MenuItem>
                                                    </TextField>
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <TextField fullWidth label="Occupation" {...memberProfileCompletionForm.register("occupation")} {...completionFieldError("occupation")} />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <TextField fullWidth label="Employer name" {...memberProfileCompletionForm.register("employer")} {...completionFieldError("employer")} />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <TextField
                                                        select
                                                        fullWidth
                                                        label="ID type"
                                                        InputLabelProps={{ shrink: true }}
                                                        value={memberProfileCompletionForm.watch("id_type") ?? "nida"}
                                                        {...memberProfileCompletionForm.register("id_type")}
                                                    >
                                                        <MenuItem value="nida">NIDA / National ID</MenuItem>
                                                        <MenuItem value="voter">Voter ID</MenuItem>
                                                        <MenuItem value="license">Driver's license</MenuItem>
                                                        <MenuItem value="passport">Passport</MenuItem>
                                                    </TextField>
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <TextField
                                                        fullWidth
                                                        label={memberProfileCompletionForm.watch("id_type") === "nida" ? "NIDA / National ID number" : "ID number"}
                                                        {...memberProfileCompletionForm.register("national_id")}
                                                        error={Boolean(memberProfileCompletionForm.formState.errors.national_id)}
                                                        helperText={memberProfileCompletionForm.formState.errors.national_id?.message
                                                            || (memberProfileCompletionForm.watch("id_type") === "nida" ? "20 digits" : undefined)}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="TIN number"
                                                        {...memberProfileCompletionForm.register("tin_no")}
                                                        error={Boolean(memberProfileCompletionForm.formState.errors.tin_no)}
                                                        helperText={memberProfileCompletionForm.formState.errors.tin_no?.message || "9 digits"}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Stack>
                                    </Paper>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                                        <Stack spacing={1.4}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                                Residential address
                                            </Typography>
                                            {!memberProfileCompletionForm.watch("region_id") && memberProfileLegacyLocationSummary ? (
                                                <Alert severity="info" variant="outlined">
                                                    Existing location record: {memberProfileLegacyLocationSummary}. Select the structured hierarchy below to normalize it.
                                                </Alert>
                                            ) : null}
                                            <SearchableSelect
                                                value={memberProfileCompletionForm.watch("region_id") || ""}
                                                options={regionOptions}
                                                label="Region"
                                                loading={loadingRegions}
                                                placeholder={loadingRegions ? "Loading regions..." : "Search region..."}
                                                error={Boolean(completionFormErrors.region_id)}
                                                helperText={completionFormErrors.region_id?.message || "Select the member's region."}
                                                onChange={(value) => {
                                                    const selectedRegion = regions.find((item) => item.id === value);
                                                    memberProfileCompletionForm.setValue("region_id", value, { shouldValidate: true });
                                                    memberProfileCompletionForm.setValue("district_id", "", { shouldValidate: false });
                                                    memberProfileCompletionForm.setValue("ward_id", "", { shouldValidate: false });
                                                    memberProfileCompletionForm.setValue("village_id", "", { shouldValidate: false });
                                                    memberProfileCompletionForm.setValue("region", selectedRegion?.name || "", { shouldValidate: true });
                                                    memberProfileCompletionForm.setValue("district", "", { shouldValidate: false });
                                                    memberProfileCompletionForm.setValue("ward", "", { shouldValidate: false });
                                                    memberProfileCompletionForm.setValue("street_or_village", "", { shouldValidate: false });
                                                }}
                                            />
                                            <SearchableSelect
                                                value={memberProfileCompletionForm.watch("district_id") || ""}
                                                options={districtOptions}
                                                label="District"
                                                disabled={!memberProfileRegionId}
                                                loading={loadingDistricts}
                                                placeholder={memberProfileRegionId ? (loadingDistricts ? "Loading districts..." : "Search district...") : "Select a region first"}
                                                error={Boolean(completionFormErrors.district_id)}
                                                helperText={completionFormErrors.district_id?.message || "Districts are filtered by the selected region."}
                                                onChange={(value) => {
                                                    const selectedDistrict = districts.find((item) => item.id === value);
                                                    memberProfileCompletionForm.setValue("district_id", value, { shouldValidate: true });
                                                    memberProfileCompletionForm.setValue("ward_id", "", { shouldValidate: false });
                                                    memberProfileCompletionForm.setValue("village_id", "", { shouldValidate: false });
                                                    memberProfileCompletionForm.setValue("district", selectedDistrict?.name || "", { shouldValidate: true });
                                                    memberProfileCompletionForm.setValue("ward", "", { shouldValidate: false });
                                                    memberProfileCompletionForm.setValue("street_or_village", "", { shouldValidate: false });
                                                }}
                                            />
                                            <SearchableSelect
                                                value={memberProfileCompletionForm.watch("ward_id") || ""}
                                                options={wardOptions}
                                                label="Ward"
                                                disabled={!memberProfileDistrictId}
                                                loading={loadingWards}
                                                placeholder={memberProfileDistrictId ? (loadingWards ? "Loading wards..." : "Search ward...") : "Select a district first"}
                                                error={Boolean(completionFormErrors.ward_id)}
                                                helperText={completionFormErrors.ward_id?.message || "Wards are filtered by the selected district."}
                                                onChange={(value) => {
                                                    const selectedWard = wards.find((item) => item.id === value);
                                                    memberProfileCompletionForm.setValue("ward_id", value, { shouldValidate: true });
                                                    memberProfileCompletionForm.setValue("village_id", "", { shouldValidate: false });
                                                    memberProfileCompletionForm.setValue("ward", selectedWard?.name || "", { shouldValidate: true });
                                                    memberProfileCompletionForm.setValue("street_or_village", "", { shouldValidate: false });
                                                }}
                                            />
                                            <SearchableSelect
                                                value={memberProfileCompletionForm.watch("village_id") || ""}
                                                options={villageOptions}
                                                label="Village / Mtaa"
                                                disabled={!memberProfileWardId}
                                                loading={loadingVillages}
                                                placeholder={memberProfileWardId ? (loadingVillages ? "Loading villages..." : "Search village or mtaa...") : "Select a ward first"}
                                                helperText="Choose the official village or mtaa. Code omitted."
                                                onChange={(value) => {
                                                    const selectedVillage = villages.find((item) => item.id === value);
                                                    memberProfileCompletionForm.setValue("village_id", value, { shouldValidate: true });
                                                    memberProfileCompletionForm.setValue("street_or_village", selectedVillage?.name || "", { shouldValidate: true });
                                                    if (!memberProfileCompletionForm.getValues("residential_address")) {
                                                        memberProfileCompletionForm.setValue("residential_address", selectedVillage?.name || "", { shouldValidate: true });
                                                    }
                                                }}
                                            />
                                            <TextField
                                                fullWidth
                                                multiline
                                                minRows={2}
                                                maxRows={3}
                                                label="Residential address"
                                                {...memberProfileCompletionForm.register("residential_address")}
                                                {...completionFieldError("residential_address", "Add house number, plot, landmark, or extra address detail.")}
                                            />
                                        </Stack>
                                    </Paper>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                                        <Stack spacing={1.4}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                                Next of kin
                                            </Typography>
                                            <TextField fullWidth label="Next of kin name" {...memberProfileCompletionForm.register("next_of_kin_name")} {...completionFieldError("next_of_kin_name")} />
                                            <TextField
                                                select
                                                fullWidth
                                                label="Relationship"
                                                value={memberProfileCompletionForm.watch("next_of_kin_relationship")}
                                                onChange={(event) => memberProfileCompletionForm.setValue("next_of_kin_relationship", event.target.value, { shouldValidate: true })}
                                                {...completionFieldError("next_of_kin_relationship")}
                                            >
                                                <MenuItem value="">Select relationship</MenuItem>
                                                {NEXT_OF_KIN_RELATIONSHIP_OPTIONS.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                                {memberProfileCompletionForm.watch("next_of_kin_relationship") &&
                                                !isSupportedNextOfKinRelationship(memberProfileCompletionForm.watch("next_of_kin_relationship")) ? (
                                                    <MenuItem value={memberProfileCompletionForm.watch("next_of_kin_relationship")}>
                                                        {formatNextOfKinRelationship(memberProfileCompletionForm.watch("next_of_kin_relationship"))}
                                                        {isLegacyNextOfKinRelationship(memberProfileCompletionForm.watch("next_of_kin_relationship")) ? " (legacy)" : " (current)"}
                                                    </MenuItem>
                                                ) : null}
                                            </TextField>
                                            <TextField fullWidth label="Phone number" {...memberProfileCompletionForm.register("next_of_kin_phone")} {...completionFieldError("next_of_kin_phone")} />
                                            {/* Same structured address format as the member's own: pick the
                                                hierarchy from dropdowns, type only the unique street detail. */}
                                            <SearchableSelect
                                                value={memberProfileCompletionForm.watch("next_of_kin_region_id") || ""}
                                                options={nokRegionOptions}
                                                label="Region"
                                                loading={nokLoadingRegions}
                                                placeholder={nokLoadingRegions ? "Loading regions..." : "Search region..."}
                                                error={Boolean(completionFormErrors.next_of_kin_region_id)}
                                                helperText={completionFormErrors.next_of_kin_region_id?.message || "Select the next of kin's region."}
                                                onChange={(value) => {
                                                    memberProfileCompletionForm.setValue("next_of_kin_region_id", value, { shouldValidate: true });
                                                    memberProfileCompletionForm.setValue("next_of_kin_district_id", "", { shouldValidate: false });
                                                    memberProfileCompletionForm.setValue("next_of_kin_ward_id", "", { shouldValidate: false });
                                                    memberProfileCompletionForm.setValue("next_of_kin_village_id", "", { shouldValidate: false });
                                                }}
                                            />
                                            <SearchableSelect
                                                value={memberProfileCompletionForm.watch("next_of_kin_district_id") || ""}
                                                options={nokDistrictOptions}
                                                label="District"
                                                disabled={!nokRegionId}
                                                loading={nokLoadingDistricts}
                                                placeholder={nokRegionId ? (nokLoadingDistricts ? "Loading districts..." : "Search district...") : "Select a region first"}
                                                error={Boolean(completionFormErrors.next_of_kin_district_id)}
                                                helperText={completionFormErrors.next_of_kin_district_id?.message}
                                                onChange={(value) => {
                                                    memberProfileCompletionForm.setValue("next_of_kin_district_id", value, { shouldValidate: true });
                                                    memberProfileCompletionForm.setValue("next_of_kin_ward_id", "", { shouldValidate: false });
                                                    memberProfileCompletionForm.setValue("next_of_kin_village_id", "", { shouldValidate: false });
                                                }}
                                            />
                                            <SearchableSelect
                                                value={memberProfileCompletionForm.watch("next_of_kin_ward_id") || ""}
                                                options={nokWardOptions}
                                                label="Ward"
                                                disabled={!nokDistrictId}
                                                loading={nokLoadingWards}
                                                placeholder={nokDistrictId ? (nokLoadingWards ? "Loading wards..." : "Search ward...") : "Select a district first"}
                                                error={Boolean(completionFormErrors.next_of_kin_ward_id)}
                                                helperText={completionFormErrors.next_of_kin_ward_id?.message}
                                                onChange={(value) => {
                                                    memberProfileCompletionForm.setValue("next_of_kin_ward_id", value, { shouldValidate: true });
                                                    memberProfileCompletionForm.setValue("next_of_kin_village_id", "", { shouldValidate: false });
                                                }}
                                            />
                                            <SearchableSelect
                                                value={memberProfileCompletionForm.watch("next_of_kin_village_id") || ""}
                                                options={nokVillageOptions}
                                                label="Village / Mtaa"
                                                disabled={!nokWardId}
                                                loading={nokLoadingVillages}
                                                placeholder={nokWardId ? (nokLoadingVillages ? "Loading villages..." : "Search village or mtaa...") : "Select a ward first"}
                                                error={Boolean(completionFormErrors.next_of_kin_village_id)}
                                                helperText={completionFormErrors.next_of_kin_village_id?.message}
                                                onChange={(value) => {
                                                    memberProfileCompletionForm.setValue("next_of_kin_village_id", value, { shouldValidate: true });
                                                }}
                                            />
                                            <TextField
                                                fullWidth
                                                label="Street / unique detail"
                                                {...memberProfileCompletionForm.register("next_of_kin_street")}
                                                {...completionFieldError("next_of_kin_street", "House number, plot, landmark, or extra detail only.")}
                                            />
                                        </Stack>
                                    </Paper>
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                        <Stack spacing={1.4}>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                                    Membership eligibility &amp; heir
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Required by the SACCO by-laws so your record is complete.
                                                </Typography>
                                            </Box>
                                            <Grid container columnSpacing={1.5} rowSpacing={1.5}>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <TextField
                                                        select
                                                        fullWidth
                                                        label="Year completed Ilboru Secondary"
                                                        value={memberProfileCompletionForm.watch("ilboru_completion_year") ?? ""}
                                                        onChange={(event) => memberProfileCompletionForm.setValue("ilboru_completion_year", event.target.value === "" ? "" : Number(event.target.value), { shouldValidate: true })}
                                                        error={Boolean(memberProfileCompletionForm.formState.errors.ilboru_completion_year)}
                                                        helperText={memberProfileCompletionForm.formState.errors.ilboru_completion_year?.message || "Common bond (by-laws §5)."}
                                                    >
                                                        <MenuItem value="">Select year</MenuItem>
                                                        {Array.from({ length: 2022 - 1980 + 1 }, (_unused, index) => 2022 - index).map((year) => (
                                                            <MenuItem key={year} value={year}>{year}</MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <TextField fullWidth label="Heir name (Mrithi)" {...memberProfileCompletionForm.register("heir_name")} {...completionFieldError("heir_name")} />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <TextField
                                                        select
                                                        fullWidth
                                                        label="Heir relationship"
                                                        value={memberProfileCompletionForm.watch("heir_relationship")}
                                                        onChange={(event) => memberProfileCompletionForm.setValue("heir_relationship", event.target.value, { shouldValidate: true })}
                                                        {...completionFieldError("heir_relationship")}
                                                    >
                                                        <MenuItem value="">Select relationship</MenuItem>
                                                        {NEXT_OF_KIN_RELATIONSHIP_OPTIONS.map((option) => (
                                                            <MenuItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <TextField fullWidth label="Heir phone" {...memberProfileCompletionForm.register("heir_phone")} {...completionFieldError("heir_phone")} />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 8 }}>
                                                    <TextField fullWidth label="Heir address" {...memberProfileCompletionForm.register("heir_address")} />
                                                </Grid>
                                            </Grid>
                                            <Box>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={Boolean(memberProfileCompletionForm.watch("legitimate_income_declared"))}
                                                            onChange={(event) => memberProfileCompletionForm.setValue("legitimate_income_declared", event.target.checked, { shouldValidate: true })}
                                                        />
                                                    }
                                                    label="I confirm I have a legitimate source of income (by-laws §10c)."
                                                />
                                                {completionFormErrors.legitimate_income_declared ? (
                                                    <Typography variant="caption" color="error" display="block" sx={{ ml: 4 }}>
                                                        {completionFormErrors.legitimate_income_declared.message}
                                                    </Typography>
                                                ) : null}
                                            </Box>
                                            <Box>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={Boolean(memberProfileCompletionForm.watch("no_conflicting_business_declared"))}
                                                            onChange={(event) => memberProfileCompletionForm.setValue("no_conflicting_business_declared", event.target.checked, { shouldValidate: true })}
                                                        />
                                                    }
                                                    label="I confirm I have no conflicting savings or lending business (by-laws §10f)."
                                                />
                                                {completionFormErrors.no_conflicting_business_declared ? (
                                                    <Typography variant="caption" color="error" display="block" sx={{ ml: 4 }}>
                                                        {completionFormErrors.no_conflicting_business_declared.message}
                                                    </Typography>
                                                ) : null}
                                            </Box>
                                        </Stack>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowProfileCompletionDialog(false)} disabled={savingProfileCompletion}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        type="submit"
                        form="member-profile-completion-form"
                        disabled={savingProfileCompletion}
                        sx={
                            isDarkMode
                                ? { bgcolor: memberAccent, color: "#1a1a1a", "&:hover": { bgcolor: memberAccentAlt } }
                                : undefined
                        }
                    >
                        {savingProfileCompletion ? "Saving..." : "Save profile details"}
                    </Button>
                </DialogActions>
            </MotionModal>

            <ConfirmModal
                open={Boolean(pendingDraftDeletion)}
                title="Delete Draft Loan Application"
                summary={
                    <Stack spacing={1.25}>
                        <Alert severity="warning" variant="outlined">
                            This will permanently remove the draft loan application. Submitted or approved applications cannot be deleted here.
                        </Alert>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">Product</Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {pendingDraftDeletion?.loan_products?.name || "Loan application"}
                            </Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">Requested amount</Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {formatCurrency(pendingDraftDeletion?.requested_amount || 0)}
                            </Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">Last updated</Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {pendingDraftDeletion?.updated_at ? formatDate(pendingDraftDeletion.updated_at) : "Unknown"}
                            </Typography>
                        </Box>
                    </Stack>
                }
                confirmLabel="Delete Draft"
                cancelLabel="Keep Draft"
                loading={Boolean(pendingDraftDeletion && deletingLoanApplicationId === pendingDraftDeletion.id)}
                onCancel={() => setPendingDraftDeletion(null)}
                onConfirm={() => void confirmDeleteLoanApplicationDraft()}
            />

        </PortalShell>
    );
}
