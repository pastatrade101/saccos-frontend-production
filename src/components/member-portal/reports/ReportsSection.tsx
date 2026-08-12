import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";

import { useLanguage } from "../../../ui/LanguageProvider";
import ui from "../MemberContent.module.css";
import styles from "./ReportsSection.module.css";

const TREND_MONTHS = 6;
const HEATMAP_MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export interface MonthlyRow {
    month: string;
    amount: number;
}

export interface DividendStatementRow {
    date: string;
    label: string;
    source: string;
    amount: number;
    runningTotal: number;
}

export interface OperationsRow {
    month: string;
    opening: number;
    income: number;
    expenses: number;
    closing: number;
}

export interface ReportsSectionProps {
    loading: boolean;
    hasData: boolean;
    money: (value: number) => string;
    monthLabel: (month: string) => string;
    monthly: MonthlyRow[];
    monthlyTotal: number;
    target: {
        amount: number;
        percent: number;
        reached: number;
        remaining: number;
        monthsLeft: number;
        suggestedTopUp: number;
    };
    standing: Array<{ id: string; label: string; value: string; gold?: boolean }>;
    dividends: DividendStatementRow[];
    dividendTotal: number;
    utt: {
        invested: number;
        income: number;
        grandTotal: number;
        deposits: Array<{ date: string; reference: string; amount: number }>;
        incomeRows: Array<{ date: string; type: string; description: string | null; amount: number }>;
    } | null;
    operations: {
        rows: OperationsRow[];
        totals: { income: number; expenses: number; balance: number };
    } | null;
    onExport: () => void;
    onPrint: () => void;
}

export function ReportsSection({
    loading,
    hasData,
    money,
    monthLabel,
    monthly,
    monthlyTotal,
    target,
    standing,
    dividends,
    dividendTotal,
    utt,
    operations,
    onExport,
    onPrint
}: ReportsSectionProps) {
    const { t } = useLanguage();

    if (loading && !hasData) {
        return (
            <div className={ui.section}>
                <p className={ui.secondary} style={{ margin: 0 }}>
                    {t("Loading your reports…", "Inapakia ripoti zako…")}
                </p>
            </div>
        );
    }

    if (!hasData) {
        return (
            <div className={ui.section}>
                <h2 className={ui.sectionTitle}>{t("My reports", "Ripoti zangu")}</h2>
                <p className={ui.secondary} style={{ marginBottom: 0 }}>
                    {t(
                        "Your reports are not available right now. Try again shortly.",
                        "Ripoti zako hazipatikani kwa sasa. Jaribu tena baadaye."
                    )}
                </p>
            </div>
        );
    }

    const trend = monthly.slice(-TREND_MONTHS);
    const trendMax = trend.reduce((max, row) => Math.max(max, row.amount), 0) || 1;
    const previous = trend.length > 1 ? trend[trend.length - 2].amount : 0;
    const latest = trend.length ? trend[trend.length - 1].amount : 0;
    const growth = previous > 0 ? ((latest - previous) / previous) * 100 : null;

    // Heatmap intensity is log-scaled: contributions span two orders of
    // magnitude, so a linear ramp would render every ordinary month identically
    // pale next to a single large one.
    const heatMax = monthly.reduce((max, row) => Math.max(max, row.amount), 0);
    const heatDenominator = heatMax > 1 ? Math.log10(heatMax) : 1;
    const byYear = new Map<number, Map<number, number>>();
    for (const row of monthly) {
        const [yearText, monthText] = row.month.split("-");
        const year = Number(yearText);
        const monthIndex = Number(monthText) - 1;
        if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) {
            continue;
        }
        const months = byYear.get(year) ?? new Map<number, number>();
        months.set(monthIndex, (months.get(monthIndex) ?? 0) + row.amount);
        byYear.set(year, months);
    }
    const years = [...byYear.keys()].sort((a, b) => a - b);
    const currentYear = years.length ? years[years.length - 1] : null;

    return (
        <div className={ui.stack} data-tour="member-portal-reports">
            <div className={styles.toolbar}>
                <div style={{ minWidth: 0 }}>
                    <span className={ui.label}>{t("Your data only", "Taarifa zako pekee")}</span>
                    <p className={ui.secondary} style={{ margin: "4px 0 0" }}>
                        {t(
                            "Everything on this page is your own record, plus the cooperative registers every member may see.",
                            "Kila kitu hapa ni rekodi yako mwenyewe, pamoja na daftari za ushirika zinazoonekana kwa kila mwanachama."
                        )}
                    </p>
                </div>
                <div className={ui.btnRow}>
                    <button type="button" className={styles.btnSmall} onClick={onExport}>
                        <DownloadRoundedIcon fontSize="small" />
                        {t("Export statement", "Pakua taarifa")}
                    </button>
                    <button type="button" className={styles.btnSmall} onClick={onPrint}>
                        <PrintRoundedIcon fontSize="small" />
                        {t("Printable view", "Chapisha")}
                    </button>
                </div>
            </div>

            <div className={styles.trendSplit}>
                <section className={ui.section}>
                    <div className={ui.sectionHead}>
                        <div style={{ minWidth: 0 }}>
                            <h2 className={ui.sectionTitle}>{t("Contribution trend", "Mwenendo wa michango")}</h2>
                            <p className={ui.sectionNote}>
                                {t("What you deposited each of the last six months.", "Ulichoweka kila mwezi katika miezi sita iliyopita.")}
                            </p>
                        </div>
                        {growth !== null ? (
                            <span className={`${ui.chip} ${growth >= 0 ? ui.chipOk : ui.chipDanger}`}>
                                {growth >= 0 ? "▲" : "▼"} {Math.abs(Math.round(growth))}%{" "}
                                {t("vs previous month", "dhidi ya mwezi uliopita")}
                            </span>
                        ) : null}
                    </div>

                    <div className={styles.bars}>
                        {trend.map((row, index) => (
                            <div className={styles.barCol} key={row.month}>
                                <span className={styles.barTrack}>
                                    <span
                                        className={`${styles.bar} ${index === trend.length - 1 ? styles.barLatest : ""}`}
                                        style={{ height: `${Math.max((row.amount / trendMax) * 100, 2)}%` }}
                                        title={`${monthLabel(row.month)} · ${money(row.amount)}`}
                                    />
                                </span>
                                <span className={styles.barLabel}>{monthLabel(row.month)}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={ui.section}>
                    <div className={ui.sectionHead}>
                        <h2 className={ui.sectionTitle}>{t("Annual target", "Lengo la mwaka")}</h2>
                    </div>

                    <div className={ui.figureLg}>{money(target.amount)}</div>
                    <div className={ui.secondary} style={{ margin: "6px 0 12px" }}>
                        {t("Reached", "Umefikia")} {target.percent.toFixed(1)}% — {money(target.reached)}
                    </div>
                    <div className={ui.bar}>
                        <div
                            className={ui.barFill}
                            style={{ width: `${Math.min(Math.max(target.percent, 0), 100)}%` }}
                        />
                    </div>

                    {target.remaining > 0 ? (
                        <div className={styles.targetBox}>
                            <span className={ui.labelGold}>{t("Still to go", "Kilichobaki")}</span>
                            <span className={ui.tileValue}>{money(target.remaining)}</span>
                            {target.monthsLeft > 0 ? (
                                <span className={ui.secondary}>
                                    {t("About", "Takriban")} {money(target.remaining / target.monthsLeft)}{" "}
                                    {t("a month for", "kwa mwezi kwa miezi")} {target.monthsLeft}{" "}
                                    {t("months", "")}
                                </span>
                            ) : null}
                            {target.suggestedTopUp > 0 ? (
                                <span className={ui.secondary}>
                                    {t("Next suggested top-up", "Mchango unaopendekezwa")}: {money(target.suggestedTopUp)}
                                </span>
                            ) : null}
                        </div>
                    ) : null}
                </section>
            </div>

            <section className={ui.section}>
                <div className={ui.sectionHead}>
                    <h2 className={ui.sectionTitle}>{t("My standing", "Hali yangu")}</h2>
                </div>
                <div className={ui.grid4}>
                    {standing.map((tile) => (
                        <div key={tile.id} className={`${ui.tile} ${tile.gold ? ui.tileGold : ""}`}>
                            <span className={ui.tileLabel}>{tile.label}</span>
                            <span className={ui.tileValue}>{tile.value}</span>
                        </div>
                    ))}
                </div>
            </section>

            {dividends.length ? (
                <section className={ui.section}>
                    <div className={ui.sectionHead}>
                        <div style={{ minWidth: 0 }}>
                            <h2 className={ui.sectionTitle}>{t("My dividend statement", "Taarifa ya gawio langu")}</h2>
                            <p className={ui.sectionNote}>
                                {dividends.length} {t("allocations", "migawanyo")} · {money(dividendTotal)} {t("total", "jumla")}
                            </p>
                        </div>
                    </div>
                    <div className={ui.tableWrap}>
                        <table className={ui.table}>
                            <thead>
                                <tr>
                                    <th>{t("Date", "Tarehe")}</th>
                                    <th>{t("Distribution", "Mgawanyo")}</th>
                                    <th>{t("Source", "Chanzo")}</th>
                                    <th className={ui.alignRight}>{t("Amount", "Kiasi")}</th>
                                    <th className={ui.alignRight}>{t("Running total", "Jumla inayoendelea")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dividends.slice(0, 9).map((row) => (
                                    <tr key={`${row.date}-${row.label}`}>
                                        <td className={ui.num}>{row.date}</td>
                                        <td>{row.label}</td>
                                        <td>
                                            <span
                                                className={`${ui.chip} ${
                                                    row.source.toUpperCase().includes("LOAN") ? ui.chipGold : ui.chipInfo
                                                }`}
                                            >
                                                {row.source.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className={`${ui.alignRight} ${ui.credit}`}>{money(row.amount)}</td>
                                        <td className={`${ui.alignRight} ${ui.num}`}>{money(row.runningTotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            ) : null}

            {years.length ? (
                <section className={ui.section}>
                    <div className={ui.sectionHead}>
                        <div style={{ minWidth: 0 }}>
                            <h2 className={ui.sectionTitle}>
                                {t("Contribution consistency", "Uthabiti wa michango")}
                            </h2>
                            <p className={ui.sectionNote}>
                                {t("Darker means a larger contribution that month.", "Rangi nzito humaanisha mchango mkubwa zaidi.")}
                            </p>
                        </div>
                    </div>

                    <div className={styles.heatRow} aria-hidden="true">
                        <span className={styles.heatYear} />
                        {HEATMAP_MONTHS.map((label, index) => (
                            <span key={`${label}-${index}`} className={styles.heatYear} style={{ textAlign: "center" }}>
                                {label}
                            </span>
                        ))}
                    </div>

                    {years.map((year) => {
                        const months = byYear.get(year);
                        return (
                            <div className={styles.heatRow} key={year}>
                                <span className={styles.heatYear}>{year}</span>
                                {HEATMAP_MONTHS.map((_, monthIndex) => {
                                    const amount = months?.get(monthIndex) ?? 0;
                                    const alpha = amount > 0
                                        ? 0.18 + 0.82 * (Math.log10(Math.max(amount, 1)) / heatDenominator)
                                        : 0;
                                    return (
                                        <span
                                            key={monthIndex}
                                            className={styles.heatCell}
                                            style={amount > 0 ? { background: `rgba(43, 63, 140, ${alpha.toFixed(3)})` } : undefined}
                                            title={amount > 0
                                                ? `${year}-${String(monthIndex + 1).padStart(2, "0")} · ${money(amount)}`
                                                : `${year}-${String(monthIndex + 1).padStart(2, "0")} · ${t("no contribution", "hakuna mchango")}`}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })}

                    <div className={styles.heatLegend}>
                        <span>{t("Less", "Kidogo")}</span>
                        <span className={styles.heatSwatch} style={{ background: "var(--m-line2)" }} />
                        <span className={styles.heatSwatch} style={{ background: "rgba(43, 63, 140, 0.35)" }} />
                        <span className={styles.heatSwatch} style={{ background: "rgba(43, 63, 140, 0.65)" }} />
                        <span className={styles.heatSwatch} style={{ background: "rgba(43, 63, 140, 1)" }} />
                        <span>{t("More", "Zaidi")}</span>
                    </div>
                </section>
            ) : null}

            {monthly.length ? (
                <section className={ui.section}>
                    <div className={ui.sectionHead}>
                        <div style={{ minWidth: 0 }}>
                            <h2 className={ui.sectionTitle}>
                                {t("My monthly contributions", "Michango yangu ya kila mwezi")}
                            </h2>
                            <p className={ui.sectionNote}>
                                {monthly.length} {t("months", "miezi")} · {money(monthlyTotal)} {t("total", "jumla")}
                            </p>
                        </div>
                    </div>
                    <div className={styles.chipGrid}>
                        {monthly.map((row) => {
                            const year = Number(row.month.split("-")[0]);
                            return (
                                <div
                                    key={row.month}
                                    className={`${styles.monthChip} ${year === currentYear ? styles.monthChipCurrent : ""}`}
                                >
                                    <span className={styles.monthChipLabel}>{monthLabel(row.month)}</span>
                                    <span className={styles.monthChipValue}>{money(row.amount)}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>
            ) : null}

            {utt ? (
                <section className={ui.section}>
                    <div className={ui.sectionHead}>
                        <h2 className={ui.sectionTitle}>{t("Our UTT investments", "Uwekezaji wetu wa UTT")}</h2>
                    </div>
                    <div className={ui.grid3}>
                        <div className={ui.tile}>
                            <span className={ui.tileLabel}>{t("Total invested", "Jumla iliyowekezwa")}</span>
                            <span className={ui.tileValue}>{money(utt.invested)}</span>
                        </div>
                        <div className={ui.tile}>
                            <span className={ui.tileLabel}>{t("Fund income", "Mapato ya mfuko")}</span>
                            <span className={ui.tileValue}>{money(utt.income)}</span>
                        </div>
                        <div className={`${ui.tile} ${ui.tileGold}`}>
                            <span className={ui.tileLabel}>{t("Grand total", "Jumla kuu")}</span>
                            <span className={ui.tileValue}>{money(utt.grandTotal)}</span>
                        </div>
                    </div>

                    {utt.deposits.length ? (
                        <div style={{ marginTop: 18 }}>
                            <h3 className={ui.cardTitle} style={{ marginBottom: 10 }}>
                                {t("Deposit register", "Daftari la amana")}
                            </h3>
                            <div className={ui.tableWrap}>
                                <table className={ui.table}>
                                    <thead>
                                        <tr>
                                            <th>{t("Date", "Tarehe")}</th>
                                            <th>{t("Reference", "Kumbukumbu")}</th>
                                            <th className={ui.alignRight}>{t("Amount", "Kiasi")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {utt.deposits.map((row, index) => (
                                            <tr key={`${row.date}-${row.reference}-${index}`}>
                                                <td className={ui.num}>{row.date}</td>
                                                <td>{row.reference}</td>
                                                <td className={`${ui.alignRight} ${ui.num}`}>{money(row.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : null}

                    {utt.incomeRows.length ? (
                        <div style={{ marginTop: 18 }}>
                            <h3 className={ui.cardTitle} style={{ marginBottom: 10 }}>
                                {t("Income register", "Daftari la mapato")}
                            </h3>
                            <div className={ui.tableWrap}>
                                <table className={ui.table}>
                                    <thead>
                                        <tr>
                                            <th>{t("Date", "Tarehe")}</th>
                                            <th>{t("Type", "Aina")}</th>
                                            <th>{t("Description", "Maelezo")}</th>
                                            <th className={ui.alignRight}>{t("Amount", "Kiasi")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {utt.incomeRows.map((row, index) => (
                                            <tr key={`${row.date}-${index}`}>
                                                <td className={ui.num}>{row.date}</td>
                                                <td>{row.type}</td>
                                                <td>{row.description || "—"}</td>
                                                <td className={`${ui.alignRight} ${ui.num}`}>{money(row.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : null}
                </section>
            ) : null}

            {operations ? (
                <section className={ui.section}>
                    <div className={ui.sectionHead}>
                        <div style={{ minWidth: 0 }}>
                            <h2 className={ui.sectionTitle}>{t("Operation account", "Akaunti ya uendeshaji")}</h2>
                            <p className={ui.sectionNote}>
                                {t(
                                    "What the cooperative's running costs come out of, month by month.",
                                    "Gharama za uendeshaji wa ushirika, mwezi baada ya mwezi."
                                )}
                            </p>
                        </div>
                    </div>

                    <div className={ui.grid3}>
                        <div className={ui.tile}>
                            <span className={ui.tileLabel}>{t("Current balance", "Salio la sasa")}</span>
                            <span className={ui.tileValue}>{money(operations.totals.balance)}</span>
                        </div>
                        <div className={ui.tile}>
                            <span className={ui.tileLabel}>{t("Total incomes", "Jumla ya mapato")}</span>
                            <span className={ui.tileValue}>{money(operations.totals.income)}</span>
                        </div>
                        <div className={ui.tile}>
                            <span className={ui.tileLabel}>{t("Total expenditures", "Jumla ya matumizi")}</span>
                            <span className={ui.tileValue}>{money(operations.totals.expenses)}</span>
                        </div>
                    </div>

                    {operations.rows.length ? (
                        <div className={ui.tableWrap} style={{ marginTop: 18 }}>
                            <table className={ui.table}>
                                <thead>
                                    <tr>
                                        <th>{t("Month", "Mwezi")}</th>
                                        <th className={ui.alignRight}>{t("Opening", "Ufunguzi")}</th>
                                        <th className={ui.alignRight}>{t("Incomes", "Mapato")}</th>
                                        <th className={ui.alignRight}>{t("Expenditures", "Matumizi")}</th>
                                        <th className={ui.alignRight}>{t("Closing", "Kufunga")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {operations.rows.map((row) => (
                                        <tr key={row.month}>
                                            <td>{monthLabel(row.month)}</td>
                                            <td className={`${ui.alignRight} ${ui.num}`}>{money(row.opening)}</td>
                                            <td className={`${ui.alignRight} ${ui.num}`}>{money(row.income)}</td>
                                            <td className={`${ui.alignRight} ${row.expenses > 0 ? ui.debit : ui.num}`}>
                                                {money(row.expenses)}
                                            </td>
                                            <td className={`${ui.alignRight} ${row.closing < 0 ? ui.debit : ui.num}`}>
                                                {money(row.closing)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className={styles.totalRow}>
                                        <td>{t("TOTAL", "JUMLA")}</td>
                                        <td className={ui.alignRight}>—</td>
                                        <td className={`${ui.alignRight} ${ui.num}`}>{money(operations.totals.income)}</td>
                                        <td className={`${ui.alignRight} ${ui.num}`}>{money(operations.totals.expenses)}</td>
                                        <td className={`${ui.alignRight} ${ui.num}`}>{money(operations.totals.balance)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </section>
            ) : null}
        </div>
    );
}
