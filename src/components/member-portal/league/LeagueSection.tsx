import { useLanguage } from "../../../ui/LanguageProvider";
import ui from "../MemberContent.module.css";
import styles from "./LeagueSection.module.css";

/** Fallback tier colours, used when a tier carries no colour of its own. */
export const LEAGUE_COLOURS: Record<string, string> = {
    "red zone": "#C0492F",
    bronze: "#A9743B",
    silver: "#7A8296",
    gold: "#C9A227",
    pearl: "#8E7BB5",
    emerald: "#1E8A5F",
    spinel: "#C0492F",
    saphire: "#2B3F8C",
    sapphire: "#2B3F8C",
    ruby: "#B03060",
    platinum: "#5A6480",
    tanzanite: "#3E5BA9",
    diamond: "#4A9BB5"
};

export function leagueColour(name: string, provided?: string | null) {
    return provided || LEAGUE_COLOURS[name.trim().toLowerCase()] || "#5A6480";
}

export interface AroundYouRow {
    id: string;
    rank: number;
    /** Withheld for other members: their member number, not their name. */
    label: string;
    gap: string;
    amount: string;
    isYou: boolean;
}

export interface LadderRow {
    id: string;
    name: string;
    colour: string;
    band: string;
    count: number;
    isYours: boolean;
}

export interface LeagueSectionProps {
    tierName: string;
    tierColour: string;
    amount: string;
    showAmounts: boolean;
    tierRankLabel: string;
    overallRankLabel: string;
    movement: { label: string; direction: "up" | "down" | "same" } | null;
    nextTier: { name: string; percent: number; toGo: string } | null;
    /** Split so the amount can be emphasised without injecting markup. */
    guidance: Array<{ id: string; before: string; amount: string; after: string }>;
    aroundYou: AroundYouRow[];
    ladder: LadderRow[];
    climb: { previousRank: number; currentRank: number; change: number } | null;
    howToClimb: Array<{ id: string; title: string; detail: string }>;
    onContribute?: () => void;
}

export function LeagueSection({
    tierName,
    tierColour,
    amount,
    showAmounts,
    tierRankLabel,
    overallRankLabel,
    movement,
    nextTier,
    guidance,
    aroundYou,
    ladder,
    climb,
    howToClimb,
    onContribute
}: LeagueSectionProps) {
    const { t } = useLanguage();
    // Bars are sized against the biggest tier, so the widest row fills the track.
    const maxCount = ladder.reduce((max, row) => Math.max(max, row.count), 0) || 1;

    return (
        <div className={ui.stack}>
            <section className={styles.hero}>
                <div className={styles.heroGlow} aria-hidden="true" />

                <div className={styles.heroTop}>
                    <h2 className={styles.tierName} style={{ color: tierColour }}>{tierName}</h2>
                    <span className={ui.label} style={{ color: "#8fa0c4" }}>
                        {t("Your league", "Ligi yako")}
                    </span>
                </div>

                {showAmounts ? <p className={styles.heroFigure}>{amount}</p> : null}

                <div className={styles.heroChips}>
                    <span className={styles.glassPill}>{tierRankLabel}</span>
                    <span className={styles.glassPill}>{overallRankLabel}</span>
                    {movement ? (
                        <span
                            className={`${styles.glassPill} ${
                                movement.direction === "up"
                                    ? styles.pillUp
                                    : movement.direction === "down"
                                        ? styles.pillDown
                                        : ""
                            }`}
                        >
                            {movement.label}
                        </span>
                    ) : null}
                </div>

                {nextTier ? (
                    <div className={styles.progressBlock}>
                        <div className={styles.progressLabels}>
                            <span>{t("Progress to", "Maendeleo hadi")} {nextTier.name}</span>
                            <span><strong>{nextTier.toGo}</strong> {t("to go", "kubaki")}</span>
                        </div>
                        <div className={styles.progressTrack}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${Math.min(Math.max(nextTier.percent, 0), 100)}%` }}
                            />
                        </div>
                    </div>
                ) : null}

                {guidance.length ? (
                    <div className={styles.guidance}>
                        {guidance.map((line) => (
                            <span key={line.id}>
                                {line.before}
                                <strong>{line.amount}</strong>
                                {line.after}
                            </span>
                        ))}
                    </div>
                ) : null}
            </section>

            {aroundYou.length ? (
                <section className={ui.section}>
                    <div className={ui.sectionHead}>
                        <div style={{ minWidth: 0 }}>
                            <h2 className={ui.sectionTitle}>{t("Around you", "Walio karibu nawe")}</h2>
                            <p className={ui.sectionNote}>
                                {t(
                                    "Names are withheld — members are shown by member number.",
                                    "Majina hayaonyeshwi — wanachama wanatambuliwa kwa namba."
                                )}
                            </p>
                        </div>
                    </div>
                    <div className={ui.rows}>
                        {aroundYou.map((row) => (
                            <div
                                key={row.id}
                                className={`${styles.aroundRow} ${row.isYou ? styles.aroundRowYou : ""}`}
                            >
                                <span className={`${styles.rankTile} ${row.isYou ? styles.rankTileYou : ""}`}>
                                    {row.rank}
                                </span>
                                <span className={styles.aroundWho}>
                                    <span className={styles.aroundName}>{row.label}</span>
                                    <span className={styles.aroundGap}>{row.gap}</span>
                                </span>
                                {showAmounts ? <span className={styles.aroundAmount}>{row.amount}</span> : null}
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}

            {ladder.length ? (
                <section className={ui.section}>
                    <div className={ui.sectionHead}>
                        <div style={{ minWidth: 0 }}>
                            <h2 className={ui.sectionTitle}>{t("The ladder", "Ngazi za ligi")}</h2>
                            <p className={ui.sectionNote}>
                                {t("Every league and how many members sit in it.", "Kila ligi na idadi ya wanachama.")}
                            </p>
                        </div>
                    </div>
                    <div>
                        {ladder.map((row) => (
                            <div key={row.id} className={styles.ladderRow} style={{ color: row.colour }}>
                                <span className={styles.ladderName}>{row.name}</span>
                                <span className={styles.ladderBand}>{row.band}</span>
                                <span className={styles.ladderBarWrap}>
                                    <span
                                        className={styles.ladderBar}
                                        style={{ width: `${(row.count / maxCount) * 100}%` }}
                                    />
                                </span>
                                <span className={styles.ladderCount}>{row.count}</span>
                                {row.isYours ? (
                                    <span className={styles.ladderHere}>{t("You are here", "Uko hapa")}</span>
                                ) : (
                                    <span className={styles.ladderHerePlaceholder} aria-hidden="true" />
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}

            <section className={ui.section}>
                <div className={ui.sectionHead}>
                    <h2 className={ui.sectionTitle}>{t("Your climb", "Kupanda kwako")}</h2>
                </div>
                {climb ? (
                    <div className={ui.rows}>
                        <div className={styles.climbRow}>
                            <span className={styles.climbLabel}>{t("Previous", "Iliyopita")}</span>
                            <span className={styles.climbBarWrap}>
                                <span
                                    className={styles.climbBar}
                                    style={{ width: `${rankWidth(climb.previousRank, climb)}%` }}
                                />
                            </span>
                            <span className={styles.climbRank}>#{climb.previousRank}</span>
                        </div>
                        <div className={styles.climbRow}>
                            <span className={styles.climbLabel}>{t("Now", "Sasa")}</span>
                            <span className={styles.climbBarWrap}>
                                <span
                                    className={styles.climbBar}
                                    style={{ width: `${rankWidth(climb.currentRank, climb)}%` }}
                                />
                            </span>
                            <span className={styles.climbRank}>#{climb.currentRank}</span>
                        </div>
                        <div className={ui.row}>
                            <span className={ui.rowLabel}>{t("Change", "Mabadiliko")}</span>
                            <span
                                className={`${ui.chip} ${
                                    climb.change > 0 ? ui.chipOk : climb.change < 0 ? ui.chipDanger : ""
                                }`}
                            >
                                {climb.change > 0
                                    ? `+${climb.change}`
                                    : climb.change < 0
                                        ? String(climb.change)
                                        : t("No change", "Hakuna mabadiliko")}
                            </span>
                        </div>
                    </div>
                ) : (
                    <p className={ui.secondary} style={{ margin: 0 }}>
                        {t(
                            "This is your first ranked period, so there is no movement to show yet.",
                            "Hiki ni kipindi chako cha kwanza kupangwa, hakuna mabadiliko ya kuonyesha bado."
                        )}
                    </p>
                )}
            </section>

            {howToClimb.length ? (
                <section className={styles.climbCard}>
                    <div>
                        <span className={ui.labelGold}>{t("How to climb", "Jinsi ya kupanda")}</span>
                        <h2 className={ui.sectionTitle} style={{ marginTop: 6 }}>
                            {t("What it takes from here", "Kinachohitajika kuanzia hapa")}
                        </h2>
                    </div>

                    <div className={styles.climbGoals}>
                        {howToClimb.map((goal) => (
                            <div key={goal.id} className={styles.climbGoal}>
                                <span className={ui.tileLabel}>{goal.title}</span>
                                <span className={ui.secondary}>{goal.detail}</span>
                            </div>
                        ))}
                    </div>

                    {onContribute ? (
                        <div className={ui.btnRow}>
                            <button type="button" className={ui.btnGold} onClick={onContribute}>
                                {t("Make a contribution", "Fanya mchango")}
                            </button>
                        </div>
                    ) : null}
                </section>
            ) : null}
        </div>
    );
}

/** A better rank is a longer bar, so the two rows read as progress. */
function rankWidth(rank: number, climb: { previousRank: number; currentRank: number }) {
    const worst = Math.max(climb.previousRank, climb.currentRank, 1);
    return Math.max(8, ((worst - rank + 1) / worst) * 100);
}
