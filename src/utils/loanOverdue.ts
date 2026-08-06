import type { Loan } from "../types/api";

const PERIODS_PER_YEAR: Record<Loan["repayment_frequency"], number> = {
    daily: 365,
    weekly: 52,
    monthly: 12
};

export function loanPeriodDueDate(disbursed: Date, index: number, frequency: Loan["repayment_frequency"]) {
    const due = new Date(disbursed);
    if (frequency === "monthly") {
        due.setMonth(due.getMonth() + index);
    } else {
        due.setDate(due.getDate() + (frequency === "weekly" ? 7 : 1) * index);
    }
    return due;
}

function periodRate(loan: Loan) {
    return loan.annual_interest_rate / 100 / (PERIODS_PER_YEAR[loan.repayment_frequency] || 12);
}

/** Contractual annuity payment per period over the loan's full term. */
export function contractualInstallment(loan: Loan) {
    if (!loan.term_count) {
        return 0;
    }
    const rate = periodRate(loan);
    return rate > 0
        ? (loan.principal_amount * rate) / (1 - Math.pow(1 + rate, -loan.term_count))
        : loan.principal_amount / loan.term_count;
}

/** First contractual due date strictly after `after`; null once past maturity. */
export function nextContractualDueDate(loan: Loan, after: Date = new Date()) {
    if (!loan.disbursed_at || !loan.term_count) {
        return null;
    }
    const disbursed = new Date(loan.disbursed_at);
    for (let index = 1; index <= loan.term_count; index += 1) {
        const due = loanPeriodDueDate(disbursed, index, loan.repayment_frequency);
        if (due.getTime() > after.getTime()) {
            return due;
        }
    }
    return null;
}

/**
 * Overdue balance = how far the borrower is behind the contractual
 * reducing-balance schedule: expected principal repaid by now (annuity over
 * the full term) minus actual principal repaid (principal − outstanding,
 * which tracks the ledger), plus charged-but-unpaid interest.
 *
 * Derived from the loans table alone because stored schedule rows on rebuilt
 * loans park the entire residual on one past-due installment and overstate
 * arrears (see backend migration 157).
 */
export function computeLoanOverdueBalance(loan: Loan, now: Date = new Date()) {
    if (!["active", "in_arrears"].includes(loan.status)) {
        return 0;
    }
    const unpaidInterest = Math.max(loan.accrued_interest, 0);
    if (!loan.disbursed_at || !loan.term_count) {
        return Math.round(unpaidInterest);
    }
    const disbursed = new Date(loan.disbursed_at);
    let elapsed = 0;
    for (let index = 1; index <= loan.term_count; index += 1) {
        if (loanPeriodDueDate(disbursed, index, loan.repayment_frequency).getTime() <= now.getTime()) {
            elapsed = index;
        } else {
            break;
        }
    }
    const principal = loan.principal_amount;
    const rate = periodRate(loan);
    let expectedPaid = 0;
    if (elapsed >= loan.term_count) {
        expectedPaid = principal;
    } else if (elapsed > 0) {
        if (rate > 0) {
            const annuity = contractualInstallment(loan);
            const growth = Math.pow(1 + rate, elapsed);
            expectedPaid = Math.max(principal - (principal * growth - annuity * ((growth - 1) / rate)), 0);
        } else {
            expectedPaid = (principal * elapsed) / loan.term_count;
        }
    }
    const actualPaid = Math.max(principal - loan.outstanding_principal, 0);
    return Math.round(Math.max(expectedPaid - actualPaid, 0) + unpaidInterest);
}
