import type { StatementRow } from "../../types/api";

export interface FinancialSummaryData {
    totalSavings: number;
    totalShareCapital: number;
    totalDividends: number;
    outstandingLoan: number;
    availableToWithdraw: number;
    netPosition: number;
    annualSavingsTarget: number;
    targetProgressPercent: number;
    targetRemainingAmount: number;
    nextRequiredAmount: number;
    targetStatusLabel: string;
    targetStatusTone: FinancialStandingTone;
    nextInstallmentDueDate?: string | null;
    nextInstallmentAmount: number;
}

export type FinancialStandingTone = "success" | "warning" | "danger" | "neutral";

export interface FinancialStanding {
    label: string;
    tone: FinancialStandingTone;
    details?: string;
    showChip?: boolean;
}

export interface LoanExposureData {
    outstandingAmount: number;
    nextInstallmentDueDate?: string | null;
    monthlyInstallment: number;
    loanProgressPercent: number;
    activeLoans: number;
}

export interface LoanLimitData {
    borrowLimit: number;
    contributionLimit: number;
    currentExposure: number;
    guarantorExposure: number;
    eligible: boolean;
    poolFrozen: boolean;
    hasProblemLoans: boolean;
    loading?: boolean;
}

export interface MemberAlertItem {
    id: string;
    severity: "success" | "info" | "warning" | "error";
    title: string;
    message: string;
}

export interface RecentActivityData {
    lastTransactionDate?: string | null;
    lastContribution?: StatementRow | null;
    lastLoanPayment?: StatementRow | null;
}
