import type { Member, MemberAccount, SaccoPerformanceTargetSettings } from "../types/api";

export type PerformanceTargetLevelColor = "success" | "info" | "warning" | "error" | "default";
export type PerformanceTargetTone = "success" | "neutral" | "warning" | "danger";

export const DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS: SaccoPerformanceTargetSettings = {
    tenant_id: null,
    performance_target_enabled: true,
    performance_target_actual_source: "savings_balance",
    performance_target_default_annual_amount: 50_000_000,
    performance_target_required_amount: 3_200_000,
    performance_target_on_track_percent: 60,
    performance_target_member_target_source: "notes_or_member_field",
    performance_target_configured_at: null,
    performance_target_configured_by: null,
    updated_at: null
};

export interface MemberPerformanceTargetPosition {
    actualDetailAmount: number;
    actualFormAmount: number;
    matchesDetail: boolean;
    requiredAmount: number;
    annualTargetAmount: number;
    remainingAmount: number;
    remainingToTargetAmount: number;
    reachPercent: number;
    remainingPercent: number;
    nextRequiredAmount: number;
    levelLabel: string;
    levelColor: PerformanceTargetLevelColor;
    statusLabel: string;
    statusTone: PerformanceTargetTone;
}

function toMoney(value: unknown, fallback: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return fallback;
    }

    return parsed;
}

function clampPercent(value: unknown, fallback: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return fallback;
    }

    return Math.min(parsed, 1000);
}

function parseMoneyInput(value: string) {
    const parsed = Number(value.replace(/[^\d.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
}

function parsePerformanceTargetFromNotes(notes?: string | null) {
    if (!notes) {
        return 0;
    }

    const match = notes.match(/(?:annual_target|performance_target|target)\s*[:=]\s*([0-9,.]+)/i);
    return match?.[1] ? parseMoneyInput(match[1]) : 0;
}

export function normalizeSaccoPerformanceTargetSettings(
    settings?: Partial<SaccoPerformanceTargetSettings> | null
): SaccoPerformanceTargetSettings {
    return {
        ...DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS,
        ...(settings || {}),
        performance_target_enabled: settings?.performance_target_enabled ?? DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS.performance_target_enabled,
        performance_target_default_annual_amount: toMoney(
            settings?.performance_target_default_annual_amount,
            DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS.performance_target_default_annual_amount
        ),
        performance_target_required_amount: toMoney(
            settings?.performance_target_required_amount,
            DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS.performance_target_required_amount
        ),
        performance_target_on_track_percent: clampPercent(
            settings?.performance_target_on_track_percent,
            DEFAULT_SACCO_PERFORMANCE_TARGET_SETTINGS.performance_target_on_track_percent
        )
    };
}

export function resolveMemberAnnualTarget(member: Member | null | undefined, settings: SaccoPerformanceTargetSettings) {
    const normalized = normalizeSaccoPerformanceTargetSettings(settings);
    const defaultTarget = normalized.performance_target_default_annual_amount;
    const importedTarget = toMoney(member?.performance_target_amount, 0);
    const memberFieldTarget = toMoney(member?.monthly_savings_commitment, 0);
    const notesTarget = parsePerformanceTargetFromNotes(member?.notes);

    if (importedTarget > 0) {
        return importedTarget;
    }

    if (normalized.performance_target_member_target_source === "tenant_default") {
        return defaultTarget;
    }

    if (normalized.performance_target_member_target_source === "member_field_annualized") {
        return memberFieldTarget > 0 ? memberFieldTarget * 12 : defaultTarget;
    }

    if (normalized.performance_target_member_target_source === "member_field") {
        return memberFieldTarget > 0 ? memberFieldTarget : defaultTarget;
    }

    if (notesTarget > 0) {
        return notesTarget;
    }

    return memberFieldTarget > 0 ? memberFieldTarget : defaultTarget;
}

export function summarizePerformanceTargetAccounts(accounts: MemberAccount[], settings: SaccoPerformanceTargetSettings) {
    const balances = accounts.reduce(
        (summary, account) => {
            if (account.status === "closed") {
                return summary;
            }

            const available = Number(account.available_balance || 0);
            const locked = Number(account.locked_balance || 0);
            const total = available + locked;

            if (account.product_type === "savings") {
                summary.savingsBalance += total;
                summary.availableSavings += available;
            }

            if (account.product_type === "shares") {
                summary.shareBalance += total;
            }

            return summary;
        },
        {
            savingsBalance: 0,
            availableSavings: 0,
            shareBalance: 0
        }
    );

    const normalized = normalizeSaccoPerformanceTargetSettings(settings);
    const actualAmount = normalized.performance_target_actual_source === "available_savings"
        ? balances.availableSavings
        : normalized.performance_target_actual_source === "share_balance"
            ? balances.shareBalance
            : normalized.performance_target_actual_source === "savings_plus_shares"
                ? balances.savingsBalance + balances.shareBalance
                : balances.savingsBalance;

    return {
        ...balances,
        actualAmount
    };
}

export function resolvePerformanceTargetLevel(
    reachPercent: number,
    actualAmount: number,
    settings: SaccoPerformanceTargetSettings
): { label: string; color: PerformanceTargetLevelColor; tone: PerformanceTargetTone } {
    const normalized = normalizeSaccoPerformanceTargetSettings(settings);

    if (!normalized.performance_target_enabled) {
        return { label: "Target disabled", color: "default", tone: "neutral" };
    }

    if (reachPercent >= 100) {
        return { label: "Target met", color: "success", tone: "success" };
    }

    if (reachPercent >= normalized.performance_target_on_track_percent) {
        return { label: "On track", color: "info", tone: "neutral" };
    }

    if (reachPercent >= 40) {
        return { label: "Building", color: "warning", tone: "warning" };
    }

    if (actualAmount > 0) {
        return { label: "Needs top-up", color: "error", tone: "danger" };
    }

    return { label: "No activity", color: "default", tone: "neutral" };
}

export function calculateMemberPerformanceTarget(
    member: Member | null | undefined,
    accounts: MemberAccount[],
    settings: SaccoPerformanceTargetSettings
): MemberPerformanceTargetPosition {
    const normalized = normalizeSaccoPerformanceTargetSettings(settings);
    const accountSummary = summarizePerformanceTargetAccounts(accounts, normalized);
    const actualDetailAmount = accountSummary.actualAmount;
    const actualFormAmount = accountSummary.actualAmount;
    const annualTargetAmount = normalized.performance_target_enabled ? resolveMemberAnnualTarget(member, normalized) : 0;
    const remainingAmount = actualDetailAmount - annualTargetAmount;
    const remainingToTargetAmount = Math.max(annualTargetAmount - actualFormAmount, 0);
    const reachPercent = annualTargetAmount > 0 ? (actualFormAmount / annualTargetAmount) * 100 : 0;
    const remainingPercent = reachPercent - 100;
    const requiredAmount = normalized.performance_target_required_amount;
    const nextRequiredAmount = Math.max(0, Math.min(requiredAmount, remainingToTargetAmount));
    const matchesDetail = Math.abs(actualDetailAmount - actualFormAmount) <= 0.005;
    const level = resolvePerformanceTargetLevel(reachPercent, actualFormAmount, normalized);

    return {
        actualDetailAmount,
        actualFormAmount,
        matchesDetail,
        requiredAmount,
        annualTargetAmount,
        remainingAmount,
        remainingToTargetAmount,
        reachPercent,
        remainingPercent,
        nextRequiredAmount,
        levelLabel: level.label,
        levelColor: level.color,
        statusLabel: level.label,
        statusTone: level.tone
    };
}
