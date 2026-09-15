import type { Loan, LoanApplication } from "../types/api";

/**
 * What a top-up actually did, as opposed to what it was booked at.
 *
 * A top-up is written as one facility for the whole amount, but the member
 * never sees most of it: the settlement goes straight back out to clear the
 * loan being replaced, and only the balance reaches them. LN-20260914 was
 * booked at 37,680,000, settled 25,680,000 and paid out 12,000,000 — and every
 * screen showed only the 37,680,000, so the officer could not tell what the
 * member had received or what had been cleared.
 *
 * Null for an ordinary loan, where the principal is the whole story.
 */
export interface TopUpBreakdown {
    /** The whole facility, as booked. */
    principal: number;
    /** Paid straight back out to close the loan being replaced. */
    settlement: number;
    /** What actually reached the member. */
    newCash: number;
    applicationReference: string | null;
}

export function topUpBreakdown(loan: Loan | null | undefined): TopUpBreakdown | null {
    const application = loan?.loan_applications;
    if (!loan || application?.loan_category !== "top_up") return null;

    const settlement = Number(application.top_up_settlement_amount || 0);
    const newCash = Number(application.top_up_new_cash_amount || 0);
    // An application flagged top_up but carrying neither figure predates the
    // split being recorded; showing a breakdown of zeros would assert that the
    // member received nothing.
    if (!settlement && !newCash) return null;

    return {
        principal: Number(loan.principal_amount || 0),
        settlement,
        newCash,
        applicationReference: application.external_reference || null
    };
}

/** Every loan that was closed by this one — more than one after a merge. */
export function predecessorsOf(loan: Loan, memberLoans: Loan[]): Loan[] {
    return memberLoans.filter((entry) => entry.superseded_by_loan_id === loan.id);
}

/**
 * Every loan connected to this one, oldest first.
 *
 * Not a straight line, which is why this returns a set rather than walking a
 * path. Only the forward link is stored — a loan closed by a top-up carries
 * superseded_by_loan_id pointing at its replacement — and several loans can
 * point at the same replacement, because an officer merging a member's legacy
 * facilities closes all of them into one. On the live book LN-20260809-d8c71e68
 * replaced two loans at once and was then itself replaced, alongside a third,
 * by LN-20260914-2638bc16.
 *
 * Walking a single predecessor per loan would therefore have dropped a real
 * facility from the history without saying so. This collects the whole
 * connected group in both directions and orders it by when the money moved, so
 * opening any loan in the group shows the same complete history.
 */
export function buildLoanLineage(loan: Loan | null | undefined, memberLoans: Loan[]): Loan[] {
    if (!loan) return [];

    const byId = new Map(memberLoans.map((entry) => [entry.id, entry]));
    const group = new Map<string, Loan>([[loan.id, loan]]);
    // Breadth-first over both directions; the seen-set also stops a mis-set
    // superseded_by_loan_id pointing back into its own group from looping.
    const queue: Loan[] = [loan];

    while (queue.length) {
        const current = queue.shift() as Loan;

        const successor = current.superseded_by_loan_id ? byId.get(current.superseded_by_loan_id) : undefined;
        if (successor && !group.has(successor.id)) {
            group.set(successor.id, successor);
            queue.push(successor);
        }

        predecessorsOf(current, memberLoans).forEach((predecessor) => {
            if (!group.has(predecessor.id)) {
                group.set(predecessor.id, predecessor);
                queue.push(predecessor);
            }
        });
    }

    // A loan that was never topped up and never replaced anything is not a
    // history, and drawing it as one would imply there is more to see.
    if (group.size < 2) return [];

    const when = (entry: Loan) => entry.disbursed_at || entry.created_at || "";
    return [...group.values()].sort((left, right) => when(left).localeCompare(when(right)));
}

/** True when this loan was closed by a top-up rather than being repaid. */
export function wasClosedByTopUp(loan: Loan | null | undefined): boolean {
    return Boolean(loan?.superseded_by_loan_id) || loan?.closure_reason === "top_up";
}

/**
 * The same split, read off the application rather than the booked loan.
 *
 * The review and disbursement screens work from the application, before a loan
 * exists — and that is precisely where the figure matters most, since it is
 * what an officer approves and a teller pays out against.
 */
export function applicationTopUpBreakdown(
    application: LoanApplication | null | undefined
): { requested: number; settlement: number; newCash: number } | null {
    if (!application || application.loan_category !== "top_up") return null;

    const settlement = Number(application.top_up_settlement_amount || 0);
    const newCash = Number(application.top_up_new_cash_amount || 0);
    // An older application flagged top_up but carrying neither figure predates
    // the split being recorded; a breakdown of zeros would tell the teller to
    // hand over nothing.
    if (!settlement && !newCash) return null;

    return { requested: Number(application.requested_amount || 0), settlement, newCash };
}
