import { useEffect, useState, type ReactNode } from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";

import { useLanguage } from "../../../ui/LanguageProvider";
import ui from "../MemberContent.module.css";
import styles from "./AccountsSection.module.css";

const ROWS_PER_PAGE = 10;
const DIVIDEND_PREVIEW_ROWS = 5;

export interface AccountRow {
    id: string;
    accountNumber: string;
    accountName: string;
    product: string;
    status: string;
    statusTone: "ok" | "gold" | "danger";
    opened: string;
    balance: string;
}

export interface DividendRow {
    id: string;
    date: string;
    reference: string;
    direction: "credit" | "debit";
    amount: string;
    runningBalance: string;
}

export interface AccountsSectionProps {
    kpis: Array<{ id: string; label: string; value: string; helper: string; tone: "info" | "ok" | "gold" | "danger" }>;
    accounts: AccountRow[];
    onExport: () => void;
    onPrint: () => void;
    rules: string[];
    health: Array<{ id: string; label: string; value: string }>;
    interestPostings: number;
    dividends: DividendRow[];
    dividendTotalCount: number;
    /** Deposit CTA, only when the SACCO allows self-service deposits. */
    depositSlot?: ReactNode;
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

export function AccountsSection({
    kpis,
    accounts,
    onExport,
    onPrint,
    rules,
    health,
    interestPostings,
    dividends,
    dividendTotalCount,
    depositSlot
}: AccountsSectionProps) {
    const { t } = useLanguage();
    const [page, setPage] = useState(0);

    const pageCount = Math.max(1, Math.ceil(accounts.length / ROWS_PER_PAGE));
    useEffect(() => {
        setPage((current) => Math.min(current, pageCount - 1));
    }, [pageCount]);

    const start = page * ROWS_PER_PAGE;
    const visible = accounts.slice(start, start + ROWS_PER_PAGE);

    return (
        <div className={ui.stack} data-tour="member-portal-accounts">
            <div className={ui.grid4}>
                {kpis.map((kpi) => (
                    <div key={kpi.id} className={ui.card}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8, minWidth: 0 }}>
                            <span className={`${ui.dot} ${TONE_DOT[kpi.tone] || ""}`} />
                            <span className={ui.label}>{kpi.label}</span>
                        </div>
                        <div className={ui.figure}>{kpi.value}</div>
                        <div className={ui.secondary} style={{ marginTop: 6 }}>{kpi.helper}</div>
                    </div>
                ))}
            </div>

            <section className={ui.section}>
                <div className={ui.sectionHead}>
                    <div style={{ minWidth: 0 }}>
                        <h2 className={ui.sectionTitle}>{t("My accounts", "Akaunti zangu")}</h2>
                        <p className={ui.sectionNote}>
                            {t(
                                "Every account held in your name at the SACCO.",
                                "Kila akaunti iliyo kwa jina lako kwenye SACCO."
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

                {accounts.length ? (
                    <>
                        <div className={ui.tableWrap}>
                            <table className={ui.table}>
                                <thead>
                                    <tr>
                                        <th>{t("Account", "Akaunti")}</th>
                                        <th>{t("Product", "Bidhaa")}</th>
                                        <th>{t("Status", "Hali")}</th>
                                        <th>{t("Opened", "Ilifunguliwa")}</th>
                                        <th className={ui.alignRight}>{t("Balance", "Salio")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visible.map((row) => (
                                        <tr key={row.id}>
                                            <td>
                                                <span className={styles.accountNumber}>{row.accountNumber}</span>
                                                <span className={styles.accountName}>{row.accountName}</span>
                                            </td>
                                            <td>{row.product}</td>
                                            <td>
                                                <span className={`${ui.chip} ${TONE_CHIP[row.statusTone] || ""}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className={ui.num}>{row.opened}</td>
                                            <td className={`${ui.alignRight} ${ui.num}`} style={{ fontWeight: 700 }}>
                                                {row.balance}
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
                                    {start + 1}–{Math.min(start + ROWS_PER_PAGE, accounts.length)}{" "}
                                    {t("of", "kati ya")} {accounts.length}
                                </span>
                            </span>
                            {pageCount > 1 ? (
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
                            ) : null}
                        </div>
                    </>
                ) : (
                    <p className={ui.secondary} style={{ margin: 0 }}>
                        {t("No accounts are visible yet.", "Bado hakuna akaunti zinazoonekana.")}
                    </p>
                )}
            </section>

            {depositSlot}

            <div className={styles.split}>
                <section className={ui.section}>
                    <div className={ui.sectionHead}>
                        <h2 className={ui.sectionTitle}>{t("Product rules", "Masharti ya bidhaa")}</h2>
                    </div>
                    <div className={ui.rows}>
                        {rules.map((rule) => (
                            <div key={rule} className={styles.ruleRow}>
                                <span className={styles.ruleTick} aria-hidden="true">
                                    <CheckRoundedIcon fontSize="inherit" />
                                </span>
                                <span className={ui.body}>{rule}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={ui.section}>
                    <div className={ui.sectionHead}>
                        <h2 className={ui.sectionTitle}>{t("Account health", "Afya ya akaunti")}</h2>
                    </div>
                    <div className={styles.healthGrid}>
                        {health.map((item) => (
                            <div key={item.id} className={ui.tile}>
                                <span className={ui.tileLabel}>{item.label}</span>
                                <span className={ui.tileValue}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                    {interestPostings === 0 ? (
                        <p className={ui.secondary} style={{ marginTop: 14, marginBottom: 0 }}>
                            {t(
                                "No interest has been posted to your savings. This SACCO shares its earnings as dividends rather than as account interest, so this staying at zero is expected.",
                                "Hakuna riba iliyowekwa kwenye akiba yako. SACCO hii hugawa mapato kama gawio badala ya riba ya akaunti, hivyo sifuri hapa ni kawaida."
                            )}
                        </p>
                    ) : null}
                </section>
            </div>

            {dividends.length ? (
                <section className={ui.section}>
                    <div className={ui.sectionHead}>
                        <div style={{ minWidth: 0 }}>
                            <h2 className={ui.sectionTitle}>
                                {t("Dividend allocation mapping", "Mgawanyo wa gawio")}
                            </h2>
                            <p className={ui.sectionNote}>
                                {t("Showing", "Inaonyesha")} {Math.min(DIVIDEND_PREVIEW_ROWS, dividends.length)}{" "}
                                {t("of", "kati ya")} {dividendTotalCount} {t("allocations", "migawanyo")}
                            </p>
                        </div>
                    </div>
                    <div className={ui.tableWrap}>
                        <table className={ui.table}>
                            <thead>
                                <tr>
                                    <th>{t("Date", "Tarehe")}</th>
                                    <th>{t("Reference", "Kumbukumbu")}</th>
                                    <th>{t("Dr/Cr", "Dr/Cr")}</th>
                                    <th className={ui.alignRight}>{t("Amount", "Kiasi")}</th>
                                    <th className={ui.alignRight}>{t("Running balance", "Salio linaloendelea")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dividends.slice(0, DIVIDEND_PREVIEW_ROWS).map((row) => (
                                    <tr key={row.id}>
                                        <td className={ui.num}>{row.date}</td>
                                        <td className={styles.reference}>{row.reference}</td>
                                        <td>
                                            <span className={`${ui.chip} ${row.direction === "credit" ? ui.chipOk : ui.chipDanger}`}>
                                                {row.direction === "credit" ? "Cr" : "Dr"}
                                            </span>
                                        </td>
                                        <td className={`${ui.alignRight} ${row.direction === "credit" ? ui.credit : ui.debit}`}>
                                            {row.amount}
                                        </td>
                                        <td className={`${ui.alignRight} ${ui.num}`}>{row.runningBalance}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            ) : null}
        </div>
    );
}
