import type { ReactNode } from "react";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import CreditScoreRoundedIcon from "@mui/icons-material/CreditScoreRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";

import { useLanguage } from "../../../ui/LanguageProvider";
import ui from "../MemberContent.module.css";
import styles from "./OverviewSection.module.css";

const RING_SIZE = 112;
const RING_RADIUS = 42;
const RING_CENTRE = RING_SIZE / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export interface OverviewTransactionRow {
    id: string;
    date: string;
    type: string;
    direction: "credit" | "debit";
    amount: string;
    balanceAfter: string;
}

export interface OverviewAlert {
    id: string;
    title: string;
    body: string;
    tone: "info" | "gold" | "danger" | "neutral";
}

export interface OverviewSectionProps {
    nextStep?: {
        title: string;
        note: string;
        primaryLabel: string;
        onPrimary?: () => void;
        primaryDisabled?: boolean;
    } | null;
    hero: {
        totalSavings: string;
        netPositionCompact: string;
        statusLabel: string;
        entriesLabel: string;
        targetPercent: number;
        annualTarget: string;
        remaining: string;
        neededNow: string;
    };
    kpis: Array<{
        id: string;
        label: string;
        value: string;
        valueTitle?: string;
        helper: string;
        chip: string;
        tone: "info" | "ok" | "gold" | "danger";
    }>;
    capacity: {
        headline: string;
        statusChip: string;
        statusTone: "ok" | "warn" | "danger" | "info";
        tiles: Array<{ id: string; label: string; value: string; valueTitle?: string; note?: string; gold?: boolean }>;
        note: string;
    };
    /** The three detail cards, still supplied by the page. */
    detailCards?: ReactNode;
    trendChart: ReactNode;
    alerts: OverviewAlert[];
    league?: {
        tierName: string;
        rankLabel: string;
        note: string;
        onOpen: () => void;
    } | null;
    transactions: OverviewTransactionRow[];
    onViewStatement: () => void;
    onViewTransactions: () => void;
    payAccount?: {
        accountNumber: string;
        accountName?: string | null;
        bankLine?: string | null;
        instructions?: string | null;
        onCopy: () => void;
        copied: boolean;
    } | null;
}

const TONE_CHIP: Record<string, string> = {
    info: ui.chipInfo,
    ok: ui.chipOk,
    gold: ui.chipGold,
    danger: ui.chipDanger,
    warn: ui.chipWarn
};

const TONE_DOT: Record<string, string> = {
    info: ui.dotInfo,
    ok: ui.dotOk,
    gold: ui.dotGold,
    danger: ui.dotDanger
};

const KPI_TONE: Record<string, string> = {
    info: "",
    ok: styles.kpiOk,
    gold: styles.kpiGold,
    danger: styles.kpiDanger
};

const ALERT_TONE: Record<string, string> = {
    info: styles.alertRowInfo,
    gold: styles.alertRowGold,
    danger: styles.alertRowDanger,
    neutral: ""
};

export function OverviewSection({
    nextStep,
    hero,
    kpis,
    capacity,
    detailCards,
    trendChart,
    alerts,
    league,
    transactions,
    onViewStatement,
    onViewTransactions,
    payAccount
}: OverviewSectionProps) {
    const { t } = useLanguage();
    const clampedPercent = Math.min(Math.max(hero.targetPercent, 0), 100);
    // Stroke offset draws the arc clockwise from 12 o'clock (the -90deg rotate).
    const ringOffset = RING_CIRCUMFERENCE * (1 - clampedPercent / 100);

    return (
        <div className={ui.stack}>
            {nextStep ? (
                <section className={styles.nextStep}>
                    <div className={styles.nextStepText}>
                        <span className={ui.labelGold}>{t("Your next step", "Hatua yako inayofuata")}</span>
                        <h2 className={styles.nextStepTitle}>{nextStep.title}</h2>
                        <p className={ui.secondary} style={{ margin: 0 }}>{nextStep.note}</p>
                    </div>
                    <div className={ui.btnRow}>
                        <button
                            type="button"
                            className={ui.btnGold}
                            onClick={nextStep.onPrimary}
                            disabled={nextStep.primaryDisabled || !nextStep.onPrimary}
                        >
                            {nextStep.primaryLabel}
                        </button>
                        <button type="button" className={ui.btnOutline} onClick={onViewTransactions}>
                            {t("View transactions", "Angalia miamala")}
                        </button>
                    </div>
                </section>
            ) : null}

            <section className={styles.hero}>
                <div className={styles.heroGlow} aria-hidden="true" />

                <div className={styles.heroLeft}>
                    <span className={styles.heroLabel}>{t("Total savings", "Jumla ya akiba")}</span>
                    <p className={styles.heroFigure}>{hero.totalSavings}</p>
                    <div className={styles.heroPills}>
                        <span className={styles.glassPill}>
                            {t("Net position", "Hali halisi")} <strong>{hero.netPositionCompact}</strong>
                        </span>
                        <span className={styles.glassPill}>{hero.statusLabel}</span>
                        <span className={styles.glassPill}>{hero.entriesLabel}</span>
                    </div>
                    <div className={ui.btnRow}>
                        <button type="button" className={ui.btnGhostOnNavy} onClick={onViewStatement}>
                            {t("Download statement", "Pakua taarifa")}
                        </button>
                        <button type="button" className={ui.btnGhostOnNavy} onClick={onViewTransactions}>
                            {t("View transactions", "Angalia miamala")}
                        </button>
                    </div>
                </div>

                <div className={styles.heroRight}>
                    <div className={styles.ring}>
                        <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} aria-hidden="true">
                            <circle
                                cx={RING_CENTRE}
                                cy={RING_CENTRE}
                                r={RING_RADIUS}
                                fill="none"
                                stroke="rgba(255,255,255,0.14)"
                                strokeWidth="10"
                            />
                            <circle
                                cx={RING_CENTRE}
                                cy={RING_CENTRE}
                                r={RING_RADIUS}
                                fill="none"
                                stroke="#C9A227"
                                strokeWidth="10"
                                strokeLinecap="round"
                                strokeDasharray={RING_CIRCUMFERENCE}
                                strokeDashoffset={ringOffset}
                                transform={`rotate(-90 ${RING_CENTRE} ${RING_CENTRE})`}
                            />
                        </svg>
                        <div className={styles.ringCentre}>
                            <span className={styles.ringPercent}>{Math.round(clampedPercent)}%</span>
                            <span className={styles.ringCaption}>{t("of target", "ya lengo")}</span>
                        </div>
                    </div>

                    <div className={styles.heroRows}>
                        <div className={styles.heroRow}>
                            <span>{t("Annual target", "Lengo la mwaka")}</span>
                            <span className={styles.heroRowValue}>{hero.annualTarget}</span>
                        </div>
                        <div className={styles.heroRow}>
                            <span>{t("Remaining", "Kilichobaki")}</span>
                            <span className={styles.heroRowValue}>{hero.remaining}</span>
                        </div>
                        <div className={styles.heroRow}>
                            <span>{t("Needed now", "Kinachohitajika sasa")}</span>
                            <span className={`${styles.heroRowValue} ${styles.heroRowGold}`}>{hero.neededNow}</span>
                        </div>
                    </div>
                </div>
            </section>

            <div className={ui.grid4} data-tour="member-portal-stat-grid">
                {kpis.map((kpi) => (
                    <div key={kpi.id} className={`${styles.kpi} ${KPI_TONE[kpi.tone]}`}>
                        <div className={styles.kpiHead}>
                            <span className={styles.kpiLabelRow}>
                                <span className={`${ui.dot} ${TONE_DOT[kpi.tone] || ""}`} />
                                <span className={ui.label}>{kpi.label}</span>
                            </span>
                            <span className={`${ui.chip} ${TONE_CHIP[kpi.tone] || ""}`}>{kpi.chip}</span>
                        </div>
                        <span className={ui.figure} title={kpi.valueTitle}>{kpi.value}</span>
                        <span className={ui.secondary}>{kpi.helper}</span>
                    </div>
                ))}
            </div>

            <section className={ui.section} data-tour="member-portal-borrowing-capacity">
                <div className={ui.sectionHead}>
                    <div style={{ minWidth: 0 }}>
                        <span className={ui.labelGold}>
                            {t("Your borrowing capacity", "Uwezo wako wa kukopa")}
                        </span>
                        <h2 className={ui.sectionTitle} style={{ marginTop: 6 }}>{capacity.headline}</h2>
                    </div>
                    <span className={`${ui.chip} ${TONE_CHIP[capacity.statusTone] || ""}`}>{capacity.statusChip}</span>
                </div>

                <div className={ui.grid4}>
                    {capacity.tiles.map((tile) => (
                        <div key={tile.id} className={`${ui.tile} ${tile.gold ? ui.tileGold : ""}`}>
                            <span className={ui.tileLabel}>{tile.label}</span>
                            <span className={ui.tileValue} title={tile.valueTitle}>{tile.value}</span>
                            {tile.note ? <span className={ui.secondary}>{tile.note}</span> : null}
                        </div>
                    ))}
                </div>

                <p className={ui.secondary} style={{ marginTop: 14, marginBottom: 0 }}>{capacity.note}</p>
            </section>

            {detailCards}

            <div className={styles.trendSplit}>
                <section className={ui.section} data-tour="member-portal-savings-trend">
                    <div className={ui.sectionHead}>
                        <h2 className={ui.sectionTitle}>{t("Savings trend", "Mwenendo wa akiba")}</h2>
                    </div>
                    {trendChart}
                </section>

                <div className={styles.rail}>
                    {alerts.length ? (
                        <section className={ui.card}>
                            <h3 className={ui.cardTitle} style={{ marginBottom: 12 }}>
                                {t("Alerts", "Taarifa")}
                            </h3>
                            <div className={ui.rows}>
                                {alerts.map((alert) => (
                                    <div key={alert.id} className={`${styles.alertRow} ${ALERT_TONE[alert.tone]}`}>
                                        <div style={{ minWidth: 0 }}>
                                            <div className={styles.alertTitle}>{alert.title}</div>
                                            <div className={styles.alertBody}>{alert.body}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {league ? (
                        <button type="button" className={styles.leagueCard} onClick={league.onOpen}>
                            <span className={styles.heroLabel}>{t("Savings league", "Ligi ya akiba")}</span>
                            <span className={styles.leagueRank}>
                                {league.tierName} · {league.rankLabel}
                            </span>
                            <span className={styles.leagueNote}>{league.note}</span>
                        </button>
                    ) : null}
                </div>
            </div>

            <section className={ui.section}>
                <div className={ui.sectionHead}>
                    <h2 className={ui.sectionTitle}>{t("Recent transactions", "Miamala ya karibuni")}</h2>
                    <button type="button" className={ui.btnLink} onClick={onViewTransactions}>
                        {t("View full statement", "Angalia taarifa kamili")} →
                    </button>
                </div>

                {transactions.length ? (
                    <div className={ui.tableWrap}>
                        <table className={ui.table}>
                            <thead>
                                <tr>
                                    <th>{t("Date", "Tarehe")}</th>
                                    <th>{t("Type", "Aina")}</th>
                                    <th>{t("Dr/Cr", "Dr/Cr")}</th>
                                    <th className={ui.alignRight}>{t("Amount", "Kiasi")}</th>
                                    <th className={ui.alignRight}>{t("Balance after", "Salio baada")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((row) => (
                                    <tr key={row.id}>
                                        <td className={ui.num}>{row.date}</td>
                                        <td>
                                            <span className={ui.chip}>{row.type}</span>
                                        </td>
                                        <td>
                                            <span className={`${ui.chip} ${row.direction === "credit" ? ui.chipOk : ui.chipDanger}`}>
                                                {row.direction === "credit" ? "Cr" : "Dr"}
                                            </span>
                                        </td>
                                        <td className={`${ui.alignRight} ${row.direction === "credit" ? ui.credit : ui.debit}`}>
                                            {row.amount}
                                        </td>
                                        <td className={`${ui.alignRight} ${ui.num}`}>{row.balanceAfter}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className={ui.secondary} style={{ margin: 0 }}>
                        {t(
                            "No transactions have been posted to your account yet.",
                            "Bado hakuna miamala iliyowekwa kwenye akaunti yako."
                        )}
                    </p>
                )}
            </section>

            {payAccount ? (
                <section className={styles.payPanel}>
                    <div>
                        <span className={ui.labelGold}>{t("SACCOS account", "Akaunti ya SACCOS")}</span>
                        <h2 className={ui.sectionTitle} style={{ marginTop: 6 }}>
                            {t("Where to pay", "Mahali pa kulipa")}
                        </h2>
                    </div>

                    <div className={styles.payNumberBox}>
                        <span className={styles.payNumber}>{payAccount.accountNumber}</span>
                        <button type="button" className={ui.btnOutline} onClick={payAccount.onCopy}>
                            {payAccount.copied ? t("Copied", "Imenakiliwa") : t("Copy", "Nakili")}
                        </button>
                    </div>

                    <div className={ui.rows}>
                        {payAccount.accountName ? (
                            <div className={ui.row}>
                                <span className={ui.rowLabel}>{t("Account name", "Jina la akaunti")}</span>
                                <span className={ui.rowValue}>{payAccount.accountName}</span>
                            </div>
                        ) : null}
                        {payAccount.bankLine ? (
                            <div className={ui.row}>
                                <span className={ui.rowLabel}>{t("Bank", "Benki")}</span>
                                <span className={ui.rowValue}>{payAccount.bankLine}</span>
                            </div>
                        ) : null}
                    </div>

                    <p className={ui.secondary} style={{ margin: 0 }}>
                        {payAccount.instructions
                            || t(
                                "Use your member number as the payment reference.",
                                "Tumia namba yako ya uanachama kama kumbukumbu ya malipo."
                            )}
                    </p>
                </section>
            ) : null}
        </div>
    );
}

/** Icon tiles used by the three detail cards the page still supplies. */
export const overviewIcons = {
    savings: SavingsRoundedIcon,
    loans: CreditScoreRoundedIcon,
    limit: AccountBalanceRoundedIcon
};
