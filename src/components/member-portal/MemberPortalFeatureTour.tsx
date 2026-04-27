import { useMemo } from "react";
import { Joyride, STATUS, type EventData, type Step } from "react-joyride";
import { useTheme } from "@mui/material/styles";

import { brandColors } from "../../theme/colors";

type MemberPortalTourSection = "member-overview" | "member-loans" | "member-contributions" | "member-payments";

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
                id: "workspace-header",
                target: "[data-tour='member-portal-header']",
                title: "Member workspace",
                content: "This top bar keeps navigation, alerts, and account controls close by wherever you are in the portal.",
                placement: "bottom-start",
                before: waitForSectionTransition("member-overview", onNavigateSection)
            },
            {
                id: "overview-hero",
                target: "[data-tour='member-portal-hero']",
                title: "Your main summary",
                content: "This hero card gives you the live picture of your savings, loans, and overall member position in the SACCO.",
                placement: "bottom-start",
                before: waitForSectionTransition("member-overview", onNavigateSection)
            },
            {
                id: "overview-actions",
                target: "[data-tour='member-portal-overview-actions']",
                title: "Quick actions",
                content: "Use these shortcuts to start a loan application, make a contribution, or export your statement without leaving the overview.",
                placement: "bottom"
            },
            {
                id: "stat-grid",
                target: "[data-tour='member-portal-stat-grid']",
                title: "Live financial metrics",
                content: "These cards summarize your visible accounts, balances, share capital, and loan exposure from posted member activity.",
                placement: "top"
            },
            {
                id: "borrowing-capacity",
                target: "[data-tour='member-portal-borrowing-capacity']",
                title: "Borrowing capacity",
                content: "This section shows the current lending position and the amount available before branch appraisal and approval.",
                placement: "top"
            },
            {
                id: "loan-workspace",
                target: "[data-tour='member-portal-loan-workspace']",
                title: "Loan workspace",
                content: "Review active facilities, repayment schedules, and loan application progress from this lending section.",
                placement: "bottom-start",
                before: waitForSectionTransition("member-loans", onNavigateSection)
            }
        ];

        if (canUsePortalPayments) {
            baseSteps.push(
                {
                    id: "contribution-flow",
                    target: "[data-tour='member-portal-contribution-flow']",
                    title: "Contribution deposit flow",
                    content: "This card starts the mobile-money contribution flow. Approve on your phone and the backend posts the result after provider confirmation.",
                    placement: "bottom-start",
                    before: waitForSectionTransition("member-contributions", onNavigateSection)
                },
                {
                    id: "payments-ledger",
                    target: "[data-tour='member-portal-payments-ledger']",
                    title: "Payment receipts",
                    content: "This is your receipt ledger for posted, pending, failed, and expired mobile-money requests, including provider references and receipts.",
                    placement: "top",
                    before: waitForSectionTransition("member-payments", onNavigateSection)
                }
            );
        }

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
