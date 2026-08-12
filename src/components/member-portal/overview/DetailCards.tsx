import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import CreditScoreRoundedIcon from "@mui/icons-material/CreditScoreRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";

import { useLanguage } from "../../../ui/LanguageProvider";
import ui from "../MemberContent.module.css";
import styles from "./OverviewSection.module.css";

export interface DetailCardsProps {
    savings: {
        total: string;
        available: string;
        locked: string;
        shareCapital: string;
        /**
         * Where the share capital actually sits and what it was priced at.
         * Absent when the SACCOS has recorded no share price, in which case
         * the figure stands on its own as it always did.
         */
        shareCapitalNote?: string;
    };
    loan: {
        outstanding: string;
        nextInstallmentDate: string;
        monthlyInstallment: string;
        lastPayment: string;
        progressPercent: number;
    };
    limit: {
        borrowLimit: string;
        savingsBasedLimit: string;
        alreadyBorrowed: string;
        pledged: string;
    };
}

/**
 * The three detail cards under the borrowing-capacity block: savings, loan
 * exposure and loan limit. Each states its figures once — the summary numbers
 * live in the hero and KPI row above and are deliberately not repeated here.
 */
export function DetailCards({ savings, loan, limit }: DetailCardsProps) {
    const { t } = useLanguage();

    return (
        <div className={ui.grid3}>
            <section className={`${ui.card} ${ui.cardHover}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
                    <span className={ui.iconTile}>
                        <SavingsRoundedIcon fontSize="small" />
                    </span>
                    <h3 className={ui.cardTitle}>{t("Savings", "Akiba")}</h3>
                </div>
                <div className={ui.rows}>
                    <div className={ui.row}>
                        <span className={ui.rowLabel}>{t("Total savings", "Jumla ya akiba")}</span>
                        <span className={ui.rowValue}>{savings.total}</span>
                    </div>
                    <div className={ui.row}>
                        <span className={ui.rowLabel}>{t("Available", "Inayopatikana")}</span>
                        <span className={ui.rowValue}>{savings.available}</span>
                    </div>
                    <div className={ui.row}>
                        <span className={ui.rowLabel}>{t("Locked / pledged", "Imezuiliwa / imedhaminiwa")}</span>
                        <span className={ui.rowValue}>{savings.locked}</span>
                    </div>
                    <div className={ui.row}>
                        <span className={ui.rowLabel}>{t("Share capital", "Mtaji wa hisa")}</span>
                        <span className={ui.rowValue}>{savings.shareCapital}</span>
                    </div>
                    {savings.shareCapitalNote ? (
                        <p className={ui.secondary} style={{ margin: "2px 0 0" }}>
                            {savings.shareCapitalNote}
                        </p>
                    ) : null}
                </div>
            </section>

            <section className={`${ui.card} ${ui.cardHover}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
                    <span className={`${ui.iconTile} ${ui.iconTileDanger}`}>
                        <CreditScoreRoundedIcon fontSize="small" />
                    </span>
                    <h3 className={ui.cardTitle}>{t("Loan exposure", "Deni la mkopo")}</h3>
                </div>
                <div className={ui.rows}>
                    <div className={ui.row}>
                        <span className={ui.rowLabel}>{t("Outstanding", "Deni lililobaki")}</span>
                        <span className={ui.rowValue}>{loan.outstanding}</span>
                    </div>
                    <div className={ui.row}>
                        <span className={ui.rowLabel}>{t("Next installment", "Malipo yajayo")}</span>
                        <span className={ui.rowValue}>{loan.nextInstallmentDate}</span>
                    </div>
                    <div className={ui.row}>
                        <span className={ui.rowLabel}>{t("Monthly installment", "Malipo ya mwezi")}</span>
                        <span className={ui.rowValue}>{loan.monthlyInstallment}</span>
                    </div>
                    <div className={ui.row}>
                        <span className={ui.rowLabel}>{t("Last payment", "Malipo ya mwisho")}</span>
                        <span className={ui.rowValue}>{loan.lastPayment}</span>
                    </div>
                </div>
                <div style={{ marginTop: 14 }}>
                    <div className={ui.row} style={{ marginBottom: 6 }}>
                        <span className={ui.rowLabel}>{t("Repayment progress", "Maendeleo ya marejesho")}</span>
                        <span className={ui.rowValue}>{Math.round(loan.progressPercent)}%</span>
                    </div>
                    <div className={ui.bar}>
                        <div
                            className={ui.barFill}
                            style={{ width: `${Math.min(Math.max(loan.progressPercent, 0), 100)}%` }}
                        />
                    </div>
                </div>
            </section>

            <section className={`${ui.card} ${ui.cardHover}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
                    <span className={`${ui.iconTile} ${ui.iconTileGold}`}>
                        <AccountBalanceRoundedIcon fontSize="small" />
                    </span>
                    <h3 className={ui.cardTitle}>{t("Loan limit", "Kikomo cha mkopo")}</h3>
                </div>

                <div className={`${ui.tile} ${ui.tileGold}`} style={{ marginBottom: 14 }}>
                    <span className={ui.tileLabel}>{t("You can borrow up to", "Unaweza kukopa hadi")}</span>
                    <span className={ui.tileValue}>{limit.borrowLimit}</span>
                </div>

                <div className={ui.rows}>
                    <div className={ui.row}>
                        <span className={ui.rowLabel}>{t("Savings-based limit", "Kikomo cha akiba")}</span>
                        <span className={ui.rowValue}>{limit.savingsBasedLimit}</span>
                    </div>
                    <div className={ui.row}>
                        <span className={ui.rowLabel}>{t("Already borrowed", "Ulichokopa")}</span>
                        <span className={ui.rowValue}>{limit.alreadyBorrowed}</span>
                    </div>
                    <div className={ui.row}>
                        <span className={ui.rowLabel}>{t("Pledged as guarantor", "Uliyodhamini")}</span>
                        <span className={ui.rowValue}>{limit.pledged}</span>
                    </div>
                </div>

                <p className={ui.secondary} style={{ marginTop: 12, marginBottom: 0 }}>
                    {t(
                        "Informational — final approval is made at branch appraisal.",
                        "Kwa taarifa tu — uamuzi wa mwisho hufanywa na tathmini ya tawi."
                    )}
                </p>
            </section>
        </div>
    );
}

export { styles as detailCardStyles };
