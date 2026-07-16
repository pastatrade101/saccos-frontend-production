// Projects a loan repayment schedule for the PREVIEW a member sees before they
// apply. It mirrors the SACCO's real practice (from the Ilboru loan register):
// flat interest charged per month on the original principal, with the principal
// repaid in equal parts across the term, and a due date one interval after each
// period start. This is an estimate — the exact figures are confirmed at
// disbursement — but it lets a member see what they will owe each month up front.

export interface LoanScheduleRow {
    installment: number;
    dueDate: Date;
    principalDue: number;
    interestDue: number;
    totalDue: number;
    balance: number;
}

export interface LoanScheduleProjection {
    rows: LoanScheduleRow[];
    monthlyInstalment: number;
    totalInterest: number;
    totalRepayable: number;
    monthlyInterest: number;
}

export type LoanInterestMethod = "flat" | "reducing_balance";
export type LoanTermUnit = "months" | "weeks";

interface ProjectLoanScheduleParams {
    principal: number;
    annualInterestRate: number;
    termCount: number;
    termUnit?: LoanTermUnit;
    method?: LoanInterestMethod;
    startDate?: Date;
}

function addPeriods(base: Date, count: number, unit: LoanTermUnit) {
    const next = new Date(base.getTime());
    if (unit === "weeks") {
        next.setDate(next.getDate() + count * 7);
    } else {
        next.setMonth(next.getMonth() + count);
    }
    return next;
}

function round2(value: number) {
    return Math.round(value * 100) / 100;
}

export function projectLoanSchedule({
    principal,
    annualInterestRate,
    termCount,
    termUnit = "months",
    method = "flat",
    startDate = new Date()
}: ProjectLoanScheduleParams): LoanScheduleProjection {
    const term = Math.max(1, Math.floor(termCount || 1));
    const amount = Math.max(0, Number(principal) || 0);
    const periodRate = (Number(annualInterestRate) || 0) / 12 / 100;
    const principalPerPeriod = amount / term;

    const rows: LoanScheduleRow[] = [];
    let balance = amount;
    let totalInterest = 0;

    for (let i = 1; i <= term; i += 1) {
        // Flat: interest is charged on the original principal every period, so the
        // monthly interest is constant. Reducing balance: interest follows the
        // outstanding balance, so it declines as the principal is paid down.
        const interestDue = method === "reducing_balance"
            ? round2(balance * periodRate)
            : round2(amount * periodRate);
        const principalDue = round2(i === term ? balance : principalPerPeriod);
        balance = round2(balance - principalDue);
        totalInterest += interestDue;

        rows.push({
            installment: i,
            dueDate: addPeriods(startDate, i, termUnit),
            principalDue,
            interestDue,
            totalDue: round2(principalDue + interestDue),
            balance: Math.max(0, balance)
        });
    }

    const monthlyInterest = round2(amount * periodRate);
    return {
        rows,
        monthlyInterest,
        monthlyInstalment: rows.length ? rows[0].totalDue : 0,
        totalInterest: round2(totalInterest),
        totalRepayable: round2(amount + totalInterest)
    };
}
