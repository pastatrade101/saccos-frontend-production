import { useLanguage } from "../../../ui/LanguageProvider";
import ui from "../MemberContent.module.css";
import styles from "./SaccoSection.module.css";

/** Deployment-split colours, in the order the handoff lists them. */
export const DEPLOYMENT_COLOURS = ["#2B3F8C", "#C9A227", "#1E8A5F", "#8E7BB5", "#B03060", "#4A9BB5"];

export interface DeploymentSlice {
    id: string;
    name: string;
    amount: number;
    formatted: string;
    colour: string;
    /** Optional detail line, e.g. a fund's income and expenditure totals. */
    note?: string;
}

export interface SaccoMilestoneRow {
    id: string;
    title: string;
    meta: string;
    reached: boolean;
    isCurrent: boolean;
    progressPercent: number;
}

export interface SaccoSectionProps {
    loading: boolean;
    hero: {
        totalSavings: string;
        /** Savings and share capital named separately under the combined total. */
        breakdown?: string;
        note: string;
        yourSavings: string;
        yourSharePercent: string;
        averagePerMember: string;
        yourRank: string;
    } | null;
    deployment: {
        totalFormatted: string;
        slices: DeploymentSlice[];
    } | null;
    figures: Array<{ id: string; label: string; value: string; helper?: string }>;
    milestone: {
        title: string;
        percent: number;
        detail: string;
    } | null;
    milestones: SaccoMilestoneRow[];
}

export function SaccoSection({ loading, hero, deployment, figures, milestone, milestones }: SaccoSectionProps) {
    const { t } = useLanguage();

    if (loading && !hero) {
        return (
            <div className={ui.section}>
                <p className={ui.secondary} style={{ margin: 0 }}>
                    {t("Loading the cooperative position…", "Inapakia hali ya ushirika…")}
                </p>
            </div>
        );
    }

    if (!hero) {
        return (
            <div className={ui.section}>
                <h2 className={ui.sectionTitle}>{t("Cooperative position", "Hali ya ushirika")}</h2>
                <p className={ui.secondary} style={{ marginBottom: 0 }}>
                    {t(
                        "The cooperative-wide figures are not available right now. Try again shortly.",
                        "Takwimu za ushirika hazipatikani kwa sasa. Jaribu tena baadaye."
                    )}
                </p>
            </div>
        );
    }

    const deployedTotal = deployment?.slices.reduce((sum, slice) => sum + slice.amount, 0) || 0;

    return (
        <div className={ui.stack}>
            <section className={styles.hero}>
                <div className={styles.heroGlow} aria-hidden="true" />
                <span className={styles.heroLabel} style={{ position: "relative" }}>
                    {t("Total member funds", "Jumla ya fedha za wanachama")}
                </span>
                <p className={styles.heroFigure}>{hero.totalSavings}</p>
                {hero.breakdown ? <p className={styles.heroNote}>{hero.breakdown}</p> : null}
                <p className={styles.heroNote}>{hero.note}</p>

                <div className={styles.heroStats}>
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatValue}>{hero.yourSavings}</span>
                        <span className={styles.heroStatLabel}>{t("Your holdings", "Ulichonacho")}</span>
                    </div>
                    <div className={styles.heroStat}>
                        <span className={`${styles.heroStatValue} ${styles.heroStatGold}`}>{hero.yourSharePercent}</span>
                        <span className={styles.heroStatLabel}>{t("Your share of the pool", "Sehemu yako")}</span>
                    </div>
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatValue}>{hero.averagePerMember}</span>
                        <span className={styles.heroStatLabel}>{t("Average per member", "Wastani kwa mwanachama")}</span>
                    </div>
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatValue}>{hero.yourRank}</span>
                        <span className={styles.heroStatLabel}>{t("Your rank", "Nafasi yako")}</span>
                    </div>
                </div>
            </section>

            {deployment && deployment.slices.length ? (
                <section className={ui.section}>
                    <div className={ui.sectionHead}>
                        <div style={{ minWidth: 0 }}>
                            <h2 className={ui.sectionTitle}>
                                {t("Where the money is working", "Fedha zilipo kazini")}
                            </h2>
                            <p className={ui.sectionNote}>
                                {t("Total deployed", "Jumla iliyowekezwa")} {deployment.totalFormatted}
                            </p>
                        </div>
                        <span className={`${ui.chip} ${ui.chipOk}`}>
                            {t("All funds accounted", "Fedha zote zimehesabika")}
                        </span>
                    </div>

                    <div className={styles.stackedBar}>
                        {deployment.slices.map((slice) => (
                            <span
                                key={slice.id}
                                className={styles.stackedSegment}
                                style={{
                                    width: `${deployedTotal > 0 ? (slice.amount / deployedTotal) * 100 : 0}%`,
                                    background: slice.colour
                                }}
                                title={`${slice.name} · ${slice.formatted}`}
                            />
                        ))}
                    </div>

                    <div className={ui.grid4}>
                        {deployment.slices.map((slice) => (
                            <div key={slice.id} className={styles.legendCard} style={{ color: slice.colour }}>
                                <span className={styles.legendHead}>
                                    <span className={styles.legendSwatch} />
                                    <span className={styles.legendName}>{slice.name}</span>
                                </span>
                                <span className={styles.legendValue}>{slice.formatted}</span>
                                <span className={styles.legendShare}>
                                    {deployedTotal > 0 ? ((slice.amount / deployedTotal) * 100).toFixed(1) : "0.0"}%
                                </span>
                                {slice.note ? <span className={ui.secondary}>{slice.note}</span> : null}
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}

            {figures.length ? (
                <section className={ui.section}>
                    <div className={ui.sectionHead}>
                        <h2 className={ui.sectionTitle}>{t("Key figures", "Takwimu muhimu")}</h2>
                    </div>
                    <div className={ui.grid3}>
                        {figures.map((figure) => (
                            <div key={figure.id} className={ui.tile}>
                                <span className={ui.tileLabel}>{figure.label}</span>
                                <span className={ui.tileValue}>{figure.value}</span>
                                {figure.helper ? <span className={ui.secondary}>{figure.helper}</span> : null}
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}

            {milestone ? (
                <section className={styles.milestoneHero}>
                    <div className={styles.milestoneHeadRow}>
                        <div style={{ minWidth: 0 }}>
                            <span className={ui.labelGold}>{t("Next milestone", "Hatua inayofuata")}</span>
                            <h2 className={ui.sectionTitle} style={{ marginTop: 6 }}>{milestone.title}</h2>
                        </div>
                        <span className={styles.milestonePercent}>{Math.round(milestone.percent)}%</span>
                    </div>
                    <div className={styles.milestoneBar}>
                        <div
                            className={styles.milestoneBarFill}
                            style={{ width: `${Math.min(Math.max(milestone.percent, 0), 100)}%` }}
                        />
                    </div>
                    <p className={ui.secondary} style={{ margin: 0 }}>{milestone.detail}</p>
                </section>
            ) : null}

            {milestones.length ? (
                <section className={ui.section}>
                    <div className={ui.sectionHead}>
                        <h2 className={ui.sectionTitle}>{t("Our shared milestones", "Hatua zetu za pamoja")}</h2>
                    </div>
                    <div className={ui.rows}>
                        {milestones.map((row) => (
                            <div
                                key={row.id}
                                className={`${styles.milestoneRow} ${row.isCurrent ? styles.milestoneRowCurrent : ""}`}
                            >
                                <span
                                    className={`${styles.milestoneBadge} ${row.reached ? "" : styles.milestoneBadgeUpcoming}`}
                                    aria-hidden="true"
                                >
                                    {row.reached ? "✓" : "▲"}
                                </span>
                                <span className={styles.milestoneText}>
                                    <span className={styles.milestoneTitle}>{row.title}</span>
                                    <span className={styles.milestoneMeta}>{row.meta}</span>
                                </span>
                                <span className={`${ui.chip} ${row.reached ? ui.chipOk : ui.chipGold}`}>
                                    {row.reached
                                        ? t("Reached", "Imefikiwa")
                                        : `${Math.round(row.progressPercent)}%`}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}
        </div>
    );
}
