import type { SaccoFinancialYearSettings } from "../types/api";

export const MONTH_OPTIONS = [
    { value: 1, label: "January", shortLabel: "Jan" },
    { value: 2, label: "February", shortLabel: "Feb" },
    { value: 3, label: "March", shortLabel: "Mar" },
    { value: 4, label: "April", shortLabel: "Apr" },
    { value: 5, label: "May", shortLabel: "May" },
    { value: 6, label: "June", shortLabel: "Jun" },
    { value: 7, label: "July", shortLabel: "Jul" },
    { value: 8, label: "August", shortLabel: "Aug" },
    { value: 9, label: "September", shortLabel: "Sept" },
    { value: 10, label: "October", shortLabel: "Oct" },
    { value: 11, label: "November", shortLabel: "Nov" },
    { value: 12, label: "December", shortLabel: "Dec" }
];

export const DEFAULT_SACCO_FINANCIAL_YEAR_SETTINGS: SaccoFinancialYearSettings = {
    tenant_id: null,
    financial_year_start_month: 10,
    financial_year_start_day: 1,
    financial_year_configured_at: null,
    financial_year_configured_by: null,
    locked: false,
    updated_at: null
};

export interface FinancialYearPeriod {
    startDate: Date;
    endDate: Date;
    startIso: string;
    endIso: string;
    startLabel: string;
    endLabel: string;
}

export function clampNumber(value: number, min: number, max: number, fallback: number) {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(Math.max(Math.trunc(value), min), max);
}

export function normalizeSaccoFinancialYearSettings(settings?: Partial<SaccoFinancialYearSettings> | null): SaccoFinancialYearSettings {
    return {
        ...DEFAULT_SACCO_FINANCIAL_YEAR_SETTINGS,
        ...(settings || {}),
        financial_year_start_month: clampNumber(
            Number(settings?.financial_year_start_month ?? DEFAULT_SACCO_FINANCIAL_YEAR_SETTINGS.financial_year_start_month),
            1,
            12,
            DEFAULT_SACCO_FINANCIAL_YEAR_SETTINGS.financial_year_start_month
        ),
        financial_year_start_day: clampNumber(
            Number(settings?.financial_year_start_day ?? DEFAULT_SACCO_FINANCIAL_YEAR_SETTINGS.financial_year_start_day),
            1,
            31,
            DEFAULT_SACCO_FINANCIAL_YEAR_SETTINGS.financial_year_start_day
        ),
        locked: Boolean(settings?.locked || settings?.financial_year_configured_at)
    };
}

export function dateIso(value: Date) {
    return value.toISOString().slice(0, 10);
}

export function getShortMonthName(month: number) {
    return MONTH_OPTIONS.find((option) => option.value === month)?.shortLabel || String(month);
}

export function formatFinancialYearDate(date: Date) {
    return `${date.getDate()} ${getShortMonthName(date.getMonth() + 1)} ${String(date.getFullYear()).slice(-2)}`;
}

export function resolveFinancialYearPeriod(settings: SaccoFinancialYearSettings, now = new Date()): FinancialYearPeriod {
    const normalized = normalizeSaccoFinancialYearSettings(settings);
    const yearStartMonthIndex = normalized.financial_year_start_month - 1;
    let startYear = now.getFullYear();
    const candidateStart = new Date(startYear, yearStartMonthIndex, normalized.financial_year_start_day);

    if (now.getTime() < candidateStart.getTime()) {
        startYear -= 1;
    }

    const startDate = new Date(startYear, yearStartMonthIndex, normalized.financial_year_start_day);
    const nextStartDate = new Date(startDate);
    nextStartDate.setFullYear(startDate.getFullYear() + 1);
    const endDate = new Date(nextStartDate);
    endDate.setDate(nextStartDate.getDate() - 1);

    return {
        startDate,
        endDate,
        startIso: dateIso(startDate),
        endIso: dateIso(endDate),
        startLabel: formatFinancialYearDate(startDate),
        endLabel: formatFinancialYearDate(endDate)
    };
}
