import { useLanguage } from "../../../ui/LanguageProvider";
import ui from "../MemberContent.module.css";
import styles from "./LoansHero.module.css";

const DONUT_SIZE = 132;
const DONUT_RADIUS = 52;
const DONUT_CENTRE = DONUT_SIZE / 2;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

export interface LoansHeroProps {
    borrowLimit: string;
    explanation: string;
    canApply: boolean;
    applyLabel: string;
    onApply?: () => void;
    figures: Array<{ id: string; label: string; value: string }>;
}

/** Navy hero: what the member can borrow, and their current exposure at a glance. */
export function LoansHero({ borrowLimit, explanation, canApply, applyLabel, onApply, figures }: LoansHeroProps) {
    const { t } = useLanguage();

    return (
        <section className={styles.hero}>
            <div className={styles.heroGlow} aria-hidden="true" />

            <span className={styles.heroLabel}>{t("You can borrow up to", "Unaweza kukopa hadi")}</span>
            <p className={styles.heroFigure}>{borrowLimit}</p>
            <p className={styles.heroNote}>{explanation}</p>

            {canApply && onApply ? (
                <div className={ui.btnRow} style={{ position: "relative" }}>
                    <button type="button" className={ui.btnGold} onClick={onApply}>
                        {applyLabel}
                    </button>
                </div>
            ) : null}

            <div className={styles.heroStats}>
                {figures.map((figure) => (
                    <div className={styles.heroStat} key={figure.id}>
                        <span className={styles.heroStatValue}>{figure.value}</span>
                        <span className={styles.heroStatLabel}>{figure.label}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

export interface LoanStatusDonutProps {
    outstanding: number;
    buffer: number;
    outstandingLabel: string;
    bufferLabel: string;
}

/**
 * Outstanding versus free borrowing buffer. Drawn as an SVG rather than a chart
 * library so it themes off the token palette and needs no runtime.
 */
export function LoanStatusDonut({ outstanding, buffer, outstandingLabel, bufferLabel }: LoanStatusDonutProps) {
    const { t } = useLanguage();
    const total = Math.max(outstanding + buffer, 0);
    const outstandingShare = total > 0 ? outstanding / total : 0;
    const bufferPercent = total > 0 ? Math.round((buffer / total) * 100) : 100;

    return (
        <section className={ui.section}>
            <div className={ui.sectionHead}>
                <div style={{ minWidth: 0 }}>
                    <h2 className={ui.sectionTitle}>{t("Loan status", "Hali ya mkopo")}</h2>
                    <p className={ui.sectionNote}>
                        {t("Outstanding against your free borrowing buffer.", "Deni dhidi ya nafasi yako ya kukopa.")}
                    </p>
                </div>
            </div>

            <div className={styles.donutRow}>
                <div className={styles.donut}>
                    <svg width={DONUT_SIZE} height={DONUT_SIZE} viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`} aria-hidden="true">
                        <circle
                            cx={DONUT_CENTRE}
                            cy={DONUT_CENTRE}
                            r={DONUT_RADIUS}
                            fill="none"
                            stroke="var(--m-ok-ink)"
                            strokeWidth="20"
                        />
                        {outstandingShare > 0 ? (
                            <circle
                                cx={DONUT_CENTRE}
                                cy={DONUT_CENTRE}
                                r={DONUT_RADIUS}
                                fill="none"
                                stroke="var(--m-danger-ink2)"
                                strokeWidth="20"
                                strokeDasharray={DONUT_CIRCUMFERENCE}
                                strokeDashoffset={DONUT_CIRCUMFERENCE * (1 - outstandingShare)}
                                transform={`rotate(-90 ${DONUT_CENTRE} ${DONUT_CENTRE})`}
                            />
                        ) : null}
                    </svg>
                    <div className={styles.donutCentre}>
                        <span className={styles.donutPercent}>{bufferPercent}%</span>
                        <span className={styles.donutCaption}>{t("free", "huru")}</span>
                    </div>
                </div>

                <div className={styles.donutLegend}>
                    <div className={styles.legendItem}>
                        <span className={styles.legendSwatch} style={{ background: "var(--m-danger-ink2)" }} />
                        <span className={ui.rowLabel}>{t("Outstanding", "Deni")}</span>
                        <span className={ui.rowValue}>{outstandingLabel}</span>
                    </div>
                    <div className={styles.legendItem}>
                        <span className={styles.legendSwatch} style={{ background: "var(--m-ok-ink)" }} />
                        <span className={ui.rowLabel}>{t("Buffer free", "Nafasi iliyobaki")}</span>
                        <span className={ui.rowValue}>{bufferLabel}</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
