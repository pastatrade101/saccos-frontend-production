import type { ReactNode } from "react";

import { useLanguage } from "../../../ui/LanguageProvider";
import ui from "../MemberContent.module.css";
import styles from "./LoanApplicationsPanel.module.css";

export type ApplicationTone = "ok" | "info" | "gold" | "danger";

export interface LoanApplicationCard {
    id: string;
    productName: string;
    amount: string;
    terms: string;
    updated: string;
    statusLabel: string;
    tone: ApplicationTone;
    /** Present on rejected applications. */
    rejectionReason?: string | null;
    notes?: string | null;
    /** Shown on rejected applications, under the reason. */
    guidance?: string | null;
    actions: Array<{
        id: string;
        label: string;
        variant: "primary" | "outline" | "danger";
        disabled?: boolean;
        onClick: () => void;
    }>;
}

export interface LoanApplicationsPanelProps {
    available: boolean;
    openCount: number;
    applications: LoanApplicationCard[];
    /** The full application list, still rendered by the page. */
    tableSlot?: ReactNode;
}

const TONE_CHIP: Record<ApplicationTone, string> = {
    ok: ui.chipOk,
    info: ui.chipInfo,
    gold: ui.chipGold,
    danger: ui.chipDanger
};

export function LoanApplicationsPanel({
    available,
    openCount,
    applications,
    tableSlot
}: LoanApplicationsPanelProps) {
    const { t } = useLanguage();

    if (!available) {
        return (
            <section className={ui.section}>
                <h2 className={ui.sectionTitle}>{t("My loan applications", "Maombi yangu ya mkopo")}</h2>
                <p className={ui.secondary} style={{ marginBottom: 0 }}>
                    {t(
                        "Loan applications are closed at the moment. Your borrowing limit above still applies when they reopen.",
                        "Maombi ya mkopo yamefungwa kwa sasa. Kikomo chako cha kukopa hapo juu bado kitatumika yatakapofunguliwa."
                    )}
                </p>
            </section>
        );
    }

    return (
        <section className={ui.section}>
            <div className={ui.sectionHead}>
                <div style={{ minWidth: 0 }}>
                    <h2 className={ui.sectionTitle}>{t("My loan applications", "Maombi yangu ya mkopo")}</h2>
                    <p className={ui.sectionNote}>
                        {t(
                            "Where each application stands, and what to do next.",
                            "Hali ya kila ombi, na hatua inayofuata."
                        )}
                    </p>
                </div>
                <span className={`${ui.chip} ${openCount ? ui.chipGold : ui.chipOk}`}>
                    {openCount} {t("open", "yanayoendelea")}
                </span>
            </div>

            {applications.length ? (
                <div className={styles.cards}>
                    {applications.map((application) => (
                        <article
                            key={application.id}
                            className={`${styles.card} ${application.tone === "danger" ? styles.cardDanger : ""}`}
                        >
                            <div className={styles.cardHead}>
                                <span className={styles.productName}>{application.productName}</span>
                                <span className={`${ui.chip} ${TONE_CHIP[application.tone]}`}>
                                    {application.statusLabel}
                                </span>
                            </div>

                            <div className={styles.amount}>{application.amount}</div>
                            <div className={ui.secondary}>{application.terms}</div>
                            <div className={styles.updated}>
                                {t("Updated", "Ilisasishwa")} {application.updated}
                            </div>

                            {application.rejectionReason || application.notes ? (
                                <div className={styles.reason}>
                                    {application.rejectionReason ? (
                                        <p className={styles.reasonText}>
                                            <strong>{t("Reason", "Sababu")}:</strong> {application.rejectionReason}
                                        </p>
                                    ) : null}
                                    {application.notes ? (
                                        <p className={styles.reasonNote}>{application.notes}</p>
                                    ) : null}
                                    {application.guidance ? (
                                        <p className={styles.reasonNote}>{application.guidance}</p>
                                    ) : null}
                                </div>
                            ) : null}

                            {application.actions.length ? (
                                <div className={styles.actions}>
                                    {application.actions.map((action) => (
                                        <button
                                            key={action.id}
                                            type="button"
                                            disabled={action.disabled}
                                            onClick={action.onClick}
                                            className={
                                                action.variant === "primary"
                                                    ? ui.btnGold
                                                    : action.variant === "danger"
                                                        ? styles.btnDanger
                                                        : ui.btnOutline
                                            }
                                        >
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </article>
                    ))}
                </div>
            ) : (
                <p className={ui.secondary} style={{ margin: 0 }}>
                    {t(
                        "You have not applied for a loan yet. Your limit and the product terms are above.",
                        "Bado hujaomba mkopo. Kikomo chako na masharti ya bidhaa yapo hapo juu."
                    )}
                </p>
            )}

            {tableSlot ? <div className={styles.tableSlot}>{tableSlot}</div> : null}
        </section>
    );
}
