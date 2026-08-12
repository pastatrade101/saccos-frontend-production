import { useEffect, useRef, type ReactNode } from "react";

import styles from "./PortalPanel.module.css";

interface PortalPanelProps {
    open: boolean;
    onClose: () => void;
    label: string;
    children: ReactNode;
}

/**
 * The dropdown shell shared by the notification panel and the profile menu.
 *
 * Closes on outside click and on Escape. Because a click on the *other*
 * trigger counts as an outside click here, the two panels are mutually
 * exclusive without either needing to know the other exists.
 */
export function PortalPanel({ open, onClose, label, children }: PortalPanelProps) {
    const panelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onPointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            // The trigger sits outside the panel, so ignore clicks that land on
            // it — its own handler toggles the panel closed.
            if (panelRef.current?.parentElement?.contains(target)) {
                return;
            }
            onClose();
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [onClose, open]);

    if (!open) {
        return null;
    }

    return (
        <div className={styles.panel} role="dialog" aria-label={label} ref={panelRef}>
            {children}
        </div>
    );
}
