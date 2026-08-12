import { useEffect, useState, type ReactNode } from "react";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

import { useLanguage } from "../../../ui/LanguageProvider";
import ui from "../MemberContent.module.css";
import styles from "./TransactionsSection.module.css";

const ROWS_PER_PAGE = 10;

export interface LedgerRow {
    id: string;
    date: string;
    reference: string;
    type: string;
    direction: "credit" | "debit";
    amount: string;
    runningBalance: string;
    flagged: boolean;
}

export interface TransactionsSectionProps {
    filters: Array<{ id: string; label: string; labelSw: string }>;
    activeFilter: string;
    onFilterChange: (id: string) => void;
    search: string;
    onSearchChange: (value: string) => void;
    onExport: () => void;
    onPrint: () => void;
    kpis: Array<{
        id: string;
        label: string;
        value: string;
        helper: string;
        chip?: string;
        tone: "info" | "ok" | "gold" | "danger";
    }>;
    trendChart: ReactNode;
    rows: LedgerRow[];
    validationLabel: string;
    validationOk: boolean;
    onToggleFlag: (id: string) => void;
}

const TONE_CHIP: Record<string, string> = {
    info: ui.chipInfo,
    ok: ui.chipOk,
    gold: ui.chipGold,
    danger: ui.chipDanger
};

const TONE_DOT: Record<string, string> = {
    info: ui.dotInfo,
    ok: ui.dotOk,
    gold: ui.dotGold,
    danger: ui.dotDanger
};

export function TransactionsSection({
    filters,
    activeFilter,
    onFilterChange,
    search,
    onSearchChange,
    onExport,
    onPrint,
    kpis,
    trendChart,
    rows,
    validationLabel,
    validationOk,
    onToggleFlag
}: TransactionsSectionProps) {
    const { t, lang } = useLanguage();
    const [page, setPage] = useState(0);

    const pageCount = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
    // Filtering can shrink the list under the current page; clamp rather than
    // render an empty page the member cannot navigate out of.
    useEffect(() => {
        setPage((current) => Math.min(current, pageCount - 1));
    }, [pageCount]);

    const start = page * ROWS_PER_PAGE;
    const visible = rows.slice(start, start + ROWS_PER_PAGE);

    return (
        <div className={ui.stack} data-tour="member-portal-transactions">
            <div className={styles.toolbar}>
                <div className={styles.filterPills}>
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            type="button"
                            aria-pressed={filter.id === activeFilter}
                            className={`${styles.pill} ${filter.id === activeFilter ? styles.pillActive : ""}`}
                            onClick={() => {
                                onFilterChange(filter.id);
                                setPage(0);
                            }}
                        >
                            {lang === "SW" ? filter.labelSw : filter.label}
                        </button>
                    ))}
                </div>

                <div className={styles.toolbarRight}>
                    <div className={styles.search}>
                        <SearchRoundedIcon fontSize="small" />
                        <input
                            className={styles.searchInput}
                            type="search"
                            value={search}
                            placeholder={t("Search by reference", "Tafuta kwa kumbukumbu")}
                            aria-label={t("Search transactions by reference", "Tafuta miamala kwa kumbukumbu")}
                            onChange={(event) => {
                                onSearchChange(event.target.value);
                                setPage(0);
                            }}
                        />
                    </div>
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

            <div className={ui.grid4}>
                {kpis.map((kpi) => (
                    <div key={kpi.id} className={ui.card}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                                <span className={`${ui.dot} ${TONE_DOT[kpi.tone] || ""}`} />
                                <span className={ui.label}>{kpi.label}</span>
                            </span>
                            {kpi.chip ? (
                                <span className={`${ui.chip} ${TONE_CHIP[kpi.tone] || ""}`}>{kpi.chip}</span>
                            ) : null}
                        </div>
                        <div className={ui.figure}>{kpi.value}</div>
                        <div className={ui.secondary} style={{ marginTop: 6 }}>{kpi.helper}</div>
                    </div>
                ))}
            </div>

            <section className={ui.section}>
                <div className={ui.sectionHead}>
                    <h2 className={ui.sectionTitle}>{t("Balance trend", "Mwenendo wa salio")}</h2>
                </div>
                {trendChart}
            </section>

            <section className={ui.section}>
                <div className={ui.sectionHead}>
                    <div style={{ minWidth: 0 }}>
                        <h2 className={ui.sectionTitle}>{t("Posted transactions", "Miamala iliyowekwa")}</h2>
                        <p className={ui.sectionNote}>
                            {t(
                                "Every entry posted to your account, newest first.",
                                "Kila muamala uliowekwa kwenye akaunti yako, mpya kwanza."
                            )}
                        </p>
                    </div>
                    <span className={`${ui.chip} ${validationOk ? ui.chipOk : ui.chipGold}`}>{validationLabel}</span>
                </div>

                {rows.length ? (
                    <>
                        <div className={ui.tableWrap}>
                            <table className={ui.table}>
                                <thead>
                                    <tr>
                                        <th>{t("Date", "Tarehe")}</th>
                                        <th>{t("Reference", "Kumbukumbu")}</th>
                                        <th>{t("Type", "Aina")}</th>
                                        <th>{t("Dr/Cr", "Dr/Cr")}</th>
                                        <th className={ui.alignRight}>{t("Amount", "Kiasi")}</th>
                                        <th className={ui.alignRight}>{t("Running balance", "Salio linaloendelea")}</th>
                                        <th className={ui.alignRight}>{t("Flag", "Alama")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visible.map((row) => (
                                        <tr key={row.id}>
                                            <td className={ui.num}>{row.date}</td>
                                            <td className={styles.reference}>{row.reference}</td>
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
                                            <td className={`${ui.alignRight} ${ui.num}`}>{row.runningBalance}</td>
                                            <td className={ui.alignRight}>
                                                <button
                                                    type="button"
                                                    className={`${styles.flagButton} ${row.flagged ? styles.flagButtonOn : ""}`}
                                                    aria-pressed={row.flagged}
                                                    onClick={() => onToggleFlag(row.id)}
                                                >
                                                    {row.flagged ? t("Flagged", "Imealamishwa") : t("Flag", "Alamisha")}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className={styles.pager}>
                            <span className={ui.secondary}>
                                {t("Rows per page", "Safu kwa ukurasa")} {ROWS_PER_PAGE} ·{" "}
                                <span className={ui.num}>
                                    {start + 1}–{Math.min(start + ROWS_PER_PAGE, rows.length)} {t("of", "kati ya")} {rows.length}
                                </span>
                            </span>
                            <div className={styles.pagerControls}>
                                <button
                                    type="button"
                                    className={styles.pagerButton}
                                    aria-label={t("Previous page", "Ukurasa uliopita")}
                                    disabled={page === 0}
                                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                                >
                                    <ChevronLeftRoundedIcon fontSize="small" />
                                </button>
                                <button
                                    type="button"
                                    className={styles.pagerButton}
                                    aria-label={t("Next page", "Ukurasa unaofuata")}
                                    disabled={page >= pageCount - 1}
                                    onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
                                >
                                    <ChevronRightRoundedIcon fontSize="small" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <p className={ui.secondary} style={{ margin: 0 }}>
                        {t(
                            "No transactions match the current filter.",
                            "Hakuna miamala inayolingana na kichujio hiki."
                        )}
                    </p>
                )}
            </section>
        </div>
    );
}
