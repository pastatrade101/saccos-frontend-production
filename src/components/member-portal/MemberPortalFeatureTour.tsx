import { useMemo } from "react";
import { Joyride, STATUS, type EventData, type Step } from "react-joyride";
import { useTheme } from "@mui/material/styles";

import { brandColors } from "../../theme/colors";

type MemberPortalTourSection =
    | "member-overview"
    | "member-accounts"
    | "member-loans"
    | "member-transactions"
    | "member-contributions"
    | "member-payments";

interface MemberPortalFeatureTourProps {
    run: boolean;
    canUsePortalPayments: boolean;
    onNavigateSection: (sectionId: MemberPortalTourSection) => void;
    onFinish: () => void;
}

const TOUR_STEP_WAIT_MS = 260;

function waitForSectionTransition(
    sectionId: MemberPortalTourSection,
    onNavigateSection: (sectionId: MemberPortalTourSection) => void
) {
    return async () => {
        onNavigateSection(sectionId);
        await new Promise((resolve) => window.setTimeout(resolve, TOUR_STEP_WAIT_MS));
    };
}

export function MemberPortalFeatureTour({
    run,
    canUsePortalPayments,
    onNavigateSection,
    onFinish
}: MemberPortalFeatureTourProps) {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === "dark";

    const steps = useMemo<Array<Step>>(() => {
        const baseSteps: Array<Step> = [
            {
                id: "welcome",
                target: "body",
                placement: "center",
                title: "Welcome to your member workspace 👋",
                content: "This is your home for everything in the SACCO — savings, loans, dividends and statements. Here's a quick 60-second tour of the main features. You can skip anytime.",
                before: waitForSectionTransition("member-overview", onNavigateSection)
            },
            {
                id: "workspace-nav",
                target: "[data-tour='member-portal-nav']",
                title: "Find your way around",
                content: "Jump between Overview, Accounts, Loans and Transactions from here. Your current section always stays highlighted.",
                placement: "right"
            },
            {
                id: "overview-hero",
                target: "[data-tour='member-portal-hero']",
                title: "Your financial snapshot",
                content: "A live picture of your total savings, dividends and loan exposure — plus how far you've reached toward your annual savings target.",
                placement: "bottom-start",
                before: waitForSectionTransition("member-overview", onNavigateSection)
            },
            {
                id: "overview-actions",
                target: "[data-tour='member-portal-overview-actions']",
                title: "Get things done fast",
                content: "Apply for a loan, make a contribution, or download your statement — right here, without leaving the overview.",
                placement: "bottom"
            },
            {
                id: "stat-grid",
                target: "[data-tour='member-portal-stat-grid']",
                title: "Key numbers at a glance",
                content: "Savings, dividends and active loans — each drawn from activity that's actually been posted to your account.",
                placement: "top"
            },
            {
                id: "savings-trend",
                target: "[data-tour='member-portal-savings-trend']",
                title: "Watch your savings grow",
                content: "See how your balance has moved over time. Switch the view between monthly, quarterly, or the full SACCO year.",
                placement: "top"
            },
            {
                id: "borrowing-capacity",
                target: "[data-tour='member-portal-borrowing-capacity']",
                title: "Know what you can borrow",
                content: "Your maximum loan, current exposure and remaining capacity — all before you apply. Final approval still goes through branch appraisal.",
                placement: "top"
            },
            {
                id: "accounts",
                target: "[data-tour='member-portal-accounts']",
                title: "Your savings & share accounts",
                content: "Every account linked to your membership, with live balances you can inspect any time.",
                placement: "top",
                before: waitForSectionTransition("member-accounts", onNavigateSection)
            },
            {
                id: "loan-workspace",
                target: "[data-tour='member-portal-loan-workspace']",
                title: "Manage your loans",
                content: "Track active loans, repayment schedules and due dates, and follow new applications through appraisal and approval — all in one place.",
                placement: "bottom-start",
                before: waitForSectionTransition("member-loans", onNavigateSection)
            },
            {
                id: "transactions",
                target: "[data-tour='member-portal-transactions']",
                title: "Every transaction, verified",
                content: "Your full posting history with running balances, search and filters — and an automatic balance check that confirms the ledger ties out.",
                placement: "top",
                before: waitForSectionTransition("member-transactions", onNavigateSection)
            }
        ];

        if (canUsePortalPayments) {
            baseSteps.push(
                {
                    id: "contribution-flow",
                    target: "[data-tour='member-portal-contribution-flow']",
                    title: "Pay by mobile money",
                    content: "Start a contribution here, approve it on your phone, and the system posts it automatically once the provider confirms.",
                    placement: "bottom-start",
                    before: waitForSectionTransition("member-contributions", onNavigateSection)
                },
                {
                    id: "payments-ledger",
                    target: "[data-tour='member-portal-payments-ledger']",
                    title: "Your payment receipts",
                    content: "A clear ledger of every mobile-money request — posted, pending, failed or expired — with provider references and receipts.",
                    placement: "top",
                    before: waitForSectionTransition("member-payments", onNavigateSection)
                }
            );
        }

        baseSteps.push({
            id: "tour-complete",
            target: "body",
            placement: "center",
            title: "You're all set 🎉",
            content: "That's the tour! Explore at your own pace — and you can replay it anytime from the 💡 tips button in the top bar.",
            before: waitForSectionTransition("member-overview", onNavigateSection)
        });

        return baseSteps;
    }, [canUsePortalPayments, onNavigateSection]);

    const handleEvent = (data: EventData) => {
        if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
            onFinish();
        }
    };

    return (
        <Joyride
            run={run}
            steps={steps}
            continuous
            scrollToFirstStep
            options={{
                buttons: ["back", "close", "primary", "skip"],
                showProgress: true,
                overlayClickAction: "close",
                dismissKeyAction: "close",
                zIndex: 1700,
                primaryColor: isDarkMode ? "#D9B273" : brandColors.primary[900],
                backgroundColor: isDarkMode ? "#11203A" : "#FFFFFF",
                textColor: isDarkMode ? "#E2E8F0" : "#0F172A",
                overlayColor: isDarkMode ? "rgba(8, 17, 34, 0.62)" : "rgba(15, 23, 42, 0.22)",
                arrowColor: isDarkMode ? "#11203A" : "#FFFFFF"
            }}
            locale={{
                back: "Back",
                close: "Close",
                last: "Finish tour",
                next: "Next",
                nextWithProgress: "Next ({current}/{total})",
                skip: "Skip tour"
            }}
            styles={{
                tooltip: {
                    borderRadius: 14,
                    boxShadow: isDarkMode
                        ? "0 20px 40px rgba(2, 8, 23, 0.44)"
                        : "0 20px 44px rgba(15, 23, 42, 0.14)"
                },
                buttonPrimary: {
                    borderRadius: 10,
                    fontWeight: 700
                },
                buttonBack: {
                    color: isDarkMode ? "#CBD5E1" : "#334155"
                },
                buttonSkip: {
                    color: isDarkMode ? "#94A3B8" : "#64748B"
                }
            }}
            onEvent={handleEvent}
        />
    );
}
