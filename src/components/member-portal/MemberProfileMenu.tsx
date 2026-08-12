import { useCallback, useState, type ReactNode } from "react";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import TipsAndUpdatesRoundedIcon from "@mui/icons-material/TipsAndUpdatesRounded";

import { useLanguage } from "../../ui/LanguageProvider";
import { PortalPanel } from "./PortalPanel";
import ui from "./MemberContent.module.css";
import styles from "./PortalPanel.module.css";
import shell from "./PortalShell.module.css";

interface ToggleProps {
    on: boolean;
    disabled?: boolean;
    label: string;
    onChange: () => void;
}

function Toggle({ on, disabled, label, onChange }: ToggleProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={label}
            disabled={disabled}
            className={`${styles.toggle} ${on ? styles.toggleOn : ""}`}
            onClick={(event) => {
                event.stopPropagation();
                onChange();
            }}
        >
            <span className={styles.toggleKnob} />
        </button>
    );
}

export interface MemberProfileMenuProps {
    name: string;
    email: string;
    avatarUrl?: string | null;
    verified: boolean;
    details: Array<{ id: string; label: string; value: string }>;
    theme: "light" | "dark";
    onToggleTheme: () => void;
    twoFactor: { enabled: boolean; available: boolean; onManage: () => void };
    onProfile: () => void;
    onDownloadStatement: () => void;
    onChangePassword: () => void;
    onSignOut: () => void;
    /** Only rendered when the guided tour is switched on. */
    onFeatureTour?: () => void;
}

function initialOf(name: string) {
    return (name.trim().charAt(0) || "M").toUpperCase();
}

export function MemberProfileMenu({
    name,
    email,
    avatarUrl,
    verified,
    details,
    theme,
    onToggleTheme,
    twoFactor,
    onProfile,
    onDownloadStatement,
    onChangePassword,
    onSignOut,
    onFeatureTour
}: MemberProfileMenuProps) {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);
    const close = useCallback(() => setOpen(false), []);

    const run = (action: () => void) => () => {
        close();
        action();
    };

    const actionRow = (key: string, icon: ReactNode, label: string, onClick: () => void) => (
        <button key={key} type="button" className={styles.action} onClick={onClick}>
            {icon}
            <span className={styles.actionLabel}>{label}</span>
        </button>
    );

    return (
        <div style={{ position: "relative" }}>
            <button
                type="button"
                className={shell.avatarButton}
                aria-label={t("Open profile menu", "Fungua menyu ya wasifu")}
                aria-expanded={open}
                onClick={() => setOpen((current) => !current)}
            >
                {avatarUrl ? <img src={avatarUrl} alt="" /> : initialOf(name)}
            </button>

            <PortalPanel open={open} onClose={close} label={t("Profile menu", "Menyu ya wasifu")}>
                <div className={styles.profileHead}>
                    <div className={styles.profileIdentity}>
                        <span className={styles.profileAvatar}>
                            {avatarUrl ? <img src={avatarUrl} alt="" /> : initialOf(name)}
                        </span>
                        <span style={{ minWidth: 0 }}>
                            <span className={styles.profileName}>{name}</span>
                            <span className={styles.profileEmail}>{email}</span>
                        </span>
                    </div>
                    <div className={styles.profilePills}>
                        <span className={`${ui.chip} ${ui.chipOk}`}>{t("Active", "Hai")}</span>
                        {verified ? (
                            <span className={`${ui.chip} ${ui.chipInfo}`}>{t("Verified", "Imethibitishwa")}</span>
                        ) : null}
                    </div>
                </div>

                {details.length ? (
                    <div className={styles.detailBlock}>
                        {details.map((detail) => (
                            <div className={styles.detailRow} key={detail.id}>
                                <span className={styles.detailLabel}>{detail.label}</span>
                                <span className={styles.detailValue}>{detail.value}</span>
                            </div>
                        ))}
                    </div>
                ) : null}

                <div className={styles.actions}>
                    {actionRow(
                        "profile",
                        <AccountCircleRoundedIcon fontSize="small" />,
                        t("My profile", "Wasifu wangu"),
                        run(onProfile)
                    )}

                    {onFeatureTour
                        ? actionRow(
                            "tour",
                            <TipsAndUpdatesRoundedIcon fontSize="small" />,
                            t("Take the feature tour", "Tazama mwongozo"),
                            run(onFeatureTour)
                        )
                        : null}

                    {actionRow(
                        "statement",
                        <DownloadRoundedIcon fontSize="small" />,
                        t("Download statement", "Pakua taarifa"),
                        run(onDownloadStatement)
                    )}

                    {actionRow(
                        "password",
                        <ShieldRoundedIcon fontSize="small" />,
                        t("Change password", "Badilisha nywila"),
                        run(onChangePassword)
                    )}

                    <div className={styles.action} style={{ cursor: "default" }}>
                        <ShieldRoundedIcon fontSize="small" />
                        <span className={styles.actionLabel}>
                            {t("Two-factor authentication", "Uthibitishaji wa hatua mbili")}
                            <span className={styles.actionNote}>
                                {!twoFactor.available && !twoFactor.enabled
                                    ? t("Unavailable — disabled by workspace", "Haipatikani — imezimwa na msimamizi")
                                    : twoFactor.enabled
                                        ? t("Enabled", "Imewashwa")
                                        : t("Tap to enable", "Gusa kuwasha")}
                            </span>
                        </span>
                        <Toggle
                            on={twoFactor.enabled}
                            disabled={!twoFactor.available && !twoFactor.enabled}
                            label={t("Two-factor authentication", "Uthibitishaji wa hatua mbili")}
                            onChange={run(twoFactor.onManage)}
                        />
                    </div>

                    <div className={styles.action} style={{ cursor: "default" }}>
                        {theme === "dark" ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
                        <span className={styles.actionLabel}>{t("Dark mode", "Mwonekano wa giza")}</span>
                        <Toggle
                            on={theme === "dark"}
                            label={t("Dark mode", "Mwonekano wa giza")}
                            onChange={onToggleTheme}
                        />
                    </div>

                    <div className={styles.divider} />

                    <button
                        type="button"
                        className={`${styles.action} ${styles.actionDanger}`}
                        onClick={run(onSignOut)}
                    >
                        <LogoutRoundedIcon fontSize="small" />
                        <span className={styles.actionLabel}>{t("Sign out", "Toka")}</span>
                    </button>
                </div>
            </PortalPanel>
        </div>
    );
}
