import type { ReactNode } from "react";

import ui from "./MemberContent.module.css";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    body: string;
    tone?: "neutral" | "info" | "gold";
    action?: { label: string; onClick: () => void; disabled?: boolean };
}

/**
 * An explained empty state rather than a bare "no rows" line: says what would
 * appear here, why it is empty, and what the member can do about it.
 */
export function EmptyState({ icon, title, body, tone = "neutral", action }: EmptyStateProps) {
    return (
        <div className={styles.wrap}>
            <span
                className={`${styles.icon} ${
                    tone === "info" ? styles.iconInfo : tone === "gold" ? styles.iconGold : ""
                }`}
                aria-hidden="true"
            >
                {icon}
            </span>
            <p className={styles.title}>{title}</p>
            <p className={styles.body}>{body}</p>
            {action ? (
                <button
                    type="button"
                    className={ui.btnOutline}
                    onClick={action.onClick}
                    disabled={action.disabled}
                >
                    {action.label}
                </button>
            ) : null}
        </div>
    );
}
