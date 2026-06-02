export function annualToMonthlyRate(value: number | string | null | undefined) {
    const annualRate = Number(value || 0);
    if (!Number.isFinite(annualRate)) {
        return 0;
    }
    return Number((annualRate / 12).toFixed(4));
}

export function monthlyToAnnualRate(value: number | string | null | undefined) {
    const monthlyRate = Number(value || 0);
    if (!Number.isFinite(monthlyRate)) {
        return 0;
    }
    return Number((monthlyRate * 12).toFixed(4));
}

export function formatMonthlyLoanRate(value: number | string | null | undefined) {
    return `${annualToMonthlyRate(value).toLocaleString("en-US", {
        maximumFractionDigits: 4
    })}% / month`;
}
