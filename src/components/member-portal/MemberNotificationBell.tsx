import { useCallback, useState } from "react";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import { useNotificationPreferences } from "../../hooks/useNotificationPreferences";
import { useNotifications } from "../../hooks/useNotifications";
import { useLanguage } from "../../ui/LanguageProvider";
import { useToast } from "../Toast";
import { getNotificationFallbackRoute } from "../notifications/notificationUtils";
import { PortalPanel } from "./PortalPanel";
import ui from "./MemberContent.module.css";
import styles from "./PortalPanel.module.css";
import shell from "./PortalShell.module.css";

interface MemberNotificationBellProps {
    tenantId?: string | null;
}

function relativeTime(iso: string) {
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) {
        return "";
    }
    const minutes = Math.round((Date.now() - then) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(then).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * Member-portal notification panel. Presentation only — the read/unread state
 * and realtime subscription stay in useNotifications, shared with the staff
 * bell in components/notifications.
 */
export function MemberNotificationBell({ tenantId }: MemberNotificationBellProps) {
    const navigate = useNavigate();
    const { profile, twoFactorSetupRequired } = useAuth();
    const { pushToast } = useToast();
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);

    const { items: preferenceItems } = useNotificationPreferences({
        tenantId,
        enabled: !twoFactorSetupRequired
    });

    const { items, unreadCount, loading, error, markRead, markAllRead } = useNotifications({
        tenantId,
        enabled: !twoFactorSetupRequired,
        recipientUserId: profile?.user_id || null,
        recentOnly: true,
        limit: 5,
        onNewNotification: (notification) => {
            const preference = preferenceItems.find((item) => item.event_type === notification.event_type);
            if (!preference?.toast_enabled || !["critical", "warning"].includes(notification.severity)) {
                return;
            }
            pushToast({
                type: notification.severity === "critical" ? "error" : "warning",
                title: notification.title,
                message: notification.message
            });
        }
    });

    const close = useCallback(() => setOpen(false), []);

    if (twoFactorSetupRequired) {
        return null;
    }

    return (
        <div style={{ position: "relative" }}>
            <button
                type="button"
                className={shell.iconButton}
                aria-label={t("Notifications", "Taarifa")}
                aria-expanded={open}
                onClick={() => setOpen((current) => !current)}
            >
                <NotificationsRoundedIcon fontSize="small" />
                {unreadCount > 0 ? (
                    <span className={shell.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
                ) : null}
            </button>

            <PortalPanel open={open} onClose={close} label={t("Notifications", "Taarifa")}>
                <div className={styles.header}>
                    <div style={{ minWidth: 0 }}>
                        <h2 className={styles.headerTitle}>{t("Notifications", "Taarifa")}</h2>
                        <p className={styles.headerNote}>
                            {unreadCount > 0
                                ? `${unreadCount} ${t("unread", "hazijasomwa")}`
                                : t("All caught up", "Umesoma zote")}
                        </p>
                    </div>
                    <button
                        type="button"
                        className={styles.headerAction}
                        disabled={!unreadCount}
                        onClick={() => {
                            void markAllRead().catch((markError) => {
                                pushToast({
                                    type: "error",
                                    title: "Notifications",
                                    message: markError instanceof Error
                                        ? markError.message
                                        : "Unable to mark notifications as read."
                                });
                            });
                        }}
                    >
                        {t("Mark all read", "Soma zote")}
                    </button>
                </div>

                {loading ? (
                    <p className={styles.empty}>{t("Loading…", "Inapakia…")}</p>
                ) : error ? (
                    <p className={styles.empty} style={{ color: "var(--m-danger-ink2)" }}>{error}</p>
                ) : items.length ? (
                    <div className={styles.body}>
                        {items.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={`${styles.row} ${item.status === "unread" ? styles.rowUnread : ""}`}
                                onClick={() => {
                                    close();
                                    if (item.status === "unread") {
                                        void markRead(item.id).catch(() => {
                                            // A failed read-marker must not block navigation.
                                        });
                                    }
                                    navigate(getNotificationFallbackRoute(item, profile?.role === "member"));
                                }}
                            >
                                <span
                                    className={`${styles.dot} ${item.status === "unread" ? styles.dotUnread : ""}`}
                                    aria-hidden="true"
                                />
                                <span className={styles.rowText}>
                                    <span className={styles.rowTitle}>{item.title}</span>
                                    <span className={styles.rowBody}>{item.message}</span>
                                    <span className={styles.rowTime}>{relativeTime(item.created_at)}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className={styles.empty}>
                        {t("No notifications yet.", "Bado hakuna taarifa.")}
                    </p>
                )}

                <div className={styles.footer}>
                    <button
                        type="button"
                        className={ui.btnOutline}
                        style={{ width: "100%" }}
                        onClick={() => {
                            close();
                            navigate("/notifications");
                        }}
                    >
                        {t("View all notifications", "Angalia taarifa zote")}
                    </button>
                </div>
            </PortalPanel>
        </div>
    );
}
