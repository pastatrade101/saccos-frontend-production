import { Grid, Stack } from "@mui/material";

import type { StatementRow } from "../../types/api";
import { Alerts } from "./Alerts";
import { FinancialSummary } from "./FinancialSummary";
import { LoanCard } from "./LoanCard";
import { LoanLimitCard } from "./LoanLimitCard";
import { LoanRepaymentProgress } from "./LoanRepaymentProgress";
import { RecentActivityCard } from "./RecentActivityCard";
import { SaccoBankAccountCard, type SaccoBankAccountData } from "./SaccoBankAccountCard";
import { SavingsCard } from "./SavingsCard";
import { SavingsTrendChart, type SavingsTrendPoint } from "./SavingsTrendChart";
import { TransactionsPreview } from "./TransactionsPreview";
import type { FinancialStanding, FinancialSummaryData, LoanExposureData, LoanLimitData, MemberAlertItem, RecentActivityData } from "./types";

interface MemberOverviewProps {
    summary: FinancialSummaryData;
    standing: FinancialStanding;
    savingsCard: {
        totalSavings: number;
        availableBalance: number;
        lockedAmount: number;
    };
    loanExposure: LoanExposureData;
    loanLimit?: LoanLimitData | null;
    bankAccount?: SaccoBankAccountData | null;
    recentActivity: RecentActivityData;
    alerts: MemberAlertItem[];
    savingsTrend: {
        series: SavingsTrendPoint[];
        labels: string[];
        values: number[];
    };
    transactions: StatementRow[];
    onApplyLoan: () => void;
    onMakeContribution: () => void;
    onDownloadStatement: () => void;
    onViewFullStatement: () => void;
}

export function MemberOverview({
    summary,
    standing,
    savingsCard,
    loanExposure,
    loanLimit,
    bankAccount,
    recentActivity,
    alerts,
    savingsTrend,
    transactions,
    onApplyLoan,
    onMakeContribution,
    onDownloadStatement,
    onViewFullStatement
}: MemberOverviewProps) {
    return (
        <Stack spacing={2.5} sx={{ width: "100%", minWidth: 0 }}>
            <FinancialSummary
                summary={summary}
                standing={standing}
                onApplyLoan={onApplyLoan}
                onMakeContribution={onMakeContribution}
                onDownloadStatement={onDownloadStatement}
            />

            <Grid container spacing={2} alignItems="stretch" sx={{ width: "100%", minWidth: 0 }}>
                <Grid size={{ xs: 12, sm: 6, md: loanLimit ? 3 : 4 }} sx={{ display: "flex", minWidth: 0 }}>
                    <SavingsCard {...savingsCard} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: loanLimit ? 3 : 4 }} sx={{ display: "flex", minWidth: 0 }}>
                    <LoanCard {...loanExposure} />
                </Grid>
                {loanLimit ? (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: "flex", minWidth: 0 }}>
                        <LoanLimitCard {...loanLimit} />
                    </Grid>
                ) : null}
                <Grid size={{ xs: 12, sm: 6, md: loanLimit ? 3 : 4 }} sx={{ display: "flex", minWidth: 0 }}>
                    <RecentActivityCard {...recentActivity} />
                </Grid>
            </Grid>

            {bankAccount ? <SaccoBankAccountCard {...bankAccount} /> : null}

            <Alerts alerts={alerts} />

            <Grid container spacing={2} sx={{ width: "100%", minWidth: 0 }}>
                <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }} data-tour="member-portal-savings-trend">
                    <SavingsTrendChart
                        series={savingsTrend.series}
                        fallbackLabels={savingsTrend.labels}
                        fallbackValues={savingsTrend.values}
                    />
                </Grid>
                <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                    <LoanRepaymentProgress progressPercent={loanExposure.loanProgressPercent} />
                </Grid>
            </Grid>

            <TransactionsPreview rows={transactions.slice(0, 5)} onViewFullStatement={onViewFullStatement} />
        </Stack>
    );
}
