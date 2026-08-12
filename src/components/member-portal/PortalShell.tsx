import { useEffect, useState, type ReactNode } from "react";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

import { useLanguage } from "../../ui/LanguageProvider";
import styles from "./PortalShell.module.css";

const LANGUAGES = ["EN", "SW"] as const;

export interface PortalNavItem {
    id: string;
    label: string;
    /** Swahili label; falls back to `label` when absent. */
    labelSw?: string;
}

export interface PortalPayAccount {
    accountNumber: string;
    accountName?: string | null;
    bankName?: string | null;
    bankBranch?: string | null;
    instructions?: string | null;
}

interface PortalShellProps {
    sections: PortalNavItem[];
    activeSection: string;
    onSectionChange: (id: string) => void;
    title: string;
    subtitle: string;
    memberName: string;
    memberNo?: string | null;
    avatarUrl?: string | null;
    /** League tier name, e.g. "Spinel". Hidden when the league is off. */
    leagueLabel?: string | null;
    statusLabel: string;
    payAccount?: PortalPayAccount | null;
    branchLine?: string | null;
    lastSyncedLabel?: string | null;
    theme: "light" | "dark";
    onToggleTheme: () => void;
    /** The notification bell and its panel. */
    notificationSlot?: ReactNode;
    /** The avatar button and its profile menu. */
    profileMenuSlot?: ReactNode;
    onHelp?: () => void;
    onRules?: () => void;
    onContact?: () => void;
    children: ReactNode;
}

function initialOf(name: string) {
    return (name.trim().charAt(0) || "M").toUpperCase();
}

export function PortalShell({
    sections,
    activeSection,
    onSectionChange,
    title,
    subtitle,
    memberName,
    memberNo,
    avatarUrl,
    leagueLabel,
    statusLabel,
    payAccount,
    branchLine,
    lastSyncedLabel,
    theme,
    onToggleTheme,
    notificationSlot,
    profileMenuSlot,
    onHelp,
    onRules,
    onContact,
    children
}: PortalShellProps) {
    const { lang, setLang, t } = useLanguage();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    // Alternating class names restart the fade on every section change; a single
    // class would not re-trigger because the element is never remounted.
    const [fadeToggle, setFadeToggle] = useState(false);

    useEffect(() => {
        setFadeToggle((current) => !current);
        setDrawerOpen(false);
    }, [activeSection]);

    useEffect(() => {
        if (!copied) {
            return;
        }
        const id = window.setTimeout(() => setCopied(false), 1600);
        return () => window.clearTimeout(id);
    }, [copied]);

    const copyAccountNumber = async () => {
        if (!payAccount?.accountNumber) {
            return;
        }
        try {
            await navigator.clipboard.writeText(payAccount.accountNumber);
            setCopied(true);
        } catch {
            // Clipboard blocked (insecure context or denied permission): the
            // number is on screen, so the member can still copy it by hand.
        }
    };

    const sidebar = (
        <aside className={`${styles.sidebar} ${drawerOpen ? styles.sidebarOpen : ""}`}>
            <div className={styles.brand}>
                <span className={styles.brandLogo}>
                    <img src="/icon-ilboru.png" alt="" />
                </span>
                <span className={styles.brandNames}>
                    <span className={styles.brandName}>ILBORU ALUMNI</span>
                    <span className={styles.brandSub}>SACCOS LTD</span>
                </span>
            </div>

            <div className={styles.memberCard}>
                <div className={styles.memberIdentity}>
                    <span className={styles.memberAvatar}>
                        {avatarUrl ? <img src={avatarUrl} alt="" /> : initialOf(memberName)}
                    </span>
                    <span className={styles.memberText}>
                        <span className={styles.memberName}>{memberName}</span>
                        {memberNo ? <span className={styles.memberNo}>{memberNo}</span> : null}
                    </span>
                </div>
                <div className={styles.memberPills}>
                    {leagueLabel ? <span className={styles.pillGold}>{leagueLabel}</span> : null}
                    <span className={styles.pillOk}>{statusLabel}</span>
                </div>
            </div>

            <div className={styles.navScroll}>
                <div className={styles.navLabel}>{t("Workspace", "Eneo la kazi")}</div>
                {/* The feature tour anchors a step on this element. */}
                <nav className={styles.nav} style={{ marginTop: 8 }} data-tour="member-portal-nav">
                    {sections.map((section) => {
                        const active = section.id === activeSection;
                        return (
                            <button
                                key={section.id}
                                type="button"
                                aria-current={active ? "page" : undefined}
                                className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                                onClick={() => onSectionChange(section.id)}
                            >
                                <span className={styles.navDot} aria-hidden="true" />
                                {lang === "SW" && section.labelSw ? section.labelSw : section.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {payAccount?.accountNumber ? (
                <div className={styles.payCard}>
                    <span className={styles.payLabel}>{t("How to pay", "Jinsi ya kulipa")}</span>
                    <span className={styles.payNumber}>{payAccount.accountNumber}</span>
                    {/* Kept to two lines so the rail never needs to scroll — the
                        full instructions live once, on the Overview pay panel. */}
                    {payAccount.bankName ? (
                        <span className={styles.payLine}>
                            {payAccount.bankName}
                            {payAccount.bankBranch ? ` · ${payAccount.bankBranch}` : ""}
                        </span>
                    ) : null}
                    <button className={styles.payCopy} type="button" onClick={() => void copyAccountNumber()}>
                        {copied ? t("Copied", "Imenakiliwa") : t("Copy number", "Nakili namba")}
                    </button>
                </div>
            ) : null}

            <div className={styles.sidebarFooter}>
                <span className={styles.sidebarFooterTitle}>
                    {t("Secure member session", "Kikao salama cha mwanachama")}
                </span>
                <span className={styles.sidebarFooterNote}>
                    {t("Encrypted · real-time", "Imesimbwa · wakati halisi")}
                </span>
            </div>
        </aside>
    );

    return (
        <div className={`member-surface ${styles.shell}`}>
            {sidebar}
            {drawerOpen ? (
                <button
                    type="button"
                    className={styles.scrim}
                    aria-label={t("Close menu", "Funga menyu")}
                    onClick={() => setDrawerOpen(false)}
                />
            ) : null}

            <div className={styles.main}>
                <header className={styles.topbar} data-tour="member-portal-header">
                    <div className={styles.topbarLeft}>
                        <button
                            type="button"
                            className={`${styles.iconButton} ${styles.menuButton}`}
                            aria-label={t("Open menu", "Fungua menyu")}
                            onClick={() => setDrawerOpen((current) => !current)}
                        >
                            <MenuRoundedIcon fontSize="small" />
                        </button>
                        <div style={{ minWidth: 0 }}>
                            <h1 className={styles.pageTitle}>{title}</h1>
                            <p className={styles.pageSubtitle}>{subtitle}</p>
                        </div>
                    </div>

                    <div className={styles.topbarRight}>
                        <div className={styles.search}>
                            <SearchRoundedIcon fontSize="small" />
                            <input
                                className={styles.searchInput}
                                type="search"
                                placeholder={t("Search…", "Tafuta…")}
                                aria-label={t("Search the member workspace", "Tafuta kwenye eneo la mwanachama")}
                            />
                        </div>

                        {notificationSlot}

                        <div className={styles.langPill} role="group" aria-label={t("Language", "Lugha")}>
                            {LANGUAGES.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    className={`${styles.langOption} ${lang === option ? styles.langOptionActive : ""}`}
                                    aria-pressed={lang === option}
                                    onClick={() => setLang(option)}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            className={styles.iconButton}
                            aria-label={t("Toggle colour mode", "Badilisha mwonekano")}
                            onClick={onToggleTheme}
                        >
                            {theme === "dark" ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
                        </button>

                        {profileMenuSlot}
                    </div>
                </header>

                <main className={`${styles.content} ${fadeToggle ? styles.contentFadeA : styles.contentFadeB}`}>
                    {children}
                </main>

                <footer className={styles.footer}>
                    <div className={styles.footerBlock}>
                        <span className={styles.footerStrong}>Ilboru Alumni SACCOS Ltd</span>
                        {branchLine ? <span>{branchLine}</span> : null}
                    </div>

                    <div className={styles.footerLinks}>
                        <button type="button" className={styles.footerLink} onClick={onHelp}>
                            {t("Msaada (Help)", "Msaada")}
                        </button>
                        <button type="button" className={styles.footerLink} onClick={onRules}>
                            {t("Sheria za SACCOS", "Sheria za SACCOS")}
                        </button>
                        <button type="button" className={styles.footerLink} onClick={onContact}>
                            {t("Wasiliana nasi", "Wasiliana nasi")}
                        </button>
                    </div>

                    <div className={`${styles.footerBlock} ${styles.footerRight}`}>
                        <span>
                            © {new Date().getFullYear()}
                            {lastSyncedLabel ? ` · ${lastSyncedLabel}` : ""}
                        </span>
                        <span className={styles.footerCredit}>
                            {t("Powered by", "Imewezeshwa na")} <strong>Makutano Digital</strong>
                        </span>
                    </div>
                </footer>
            </div>
        </div>
    );
}
