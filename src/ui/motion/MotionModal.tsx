import { Dialog, type DialogProps } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import type { PropsWithChildren } from "react";

import { modal, useReducedMotionSafe } from "./presets";

const MotionContainer = motion.div;

export interface MotionModalProps extends Omit<DialogProps, "children"> {
    open: boolean;
}

export function MotionModal({ open, children, ...props }: PropsWithChildren<MotionModalProps>) {
    const reducedMotion = useReducedMotionSafe();
    const variants = modal(reducedMotion);

    return (
        <Dialog open={open} keepMounted {...props}>
            <AnimatePresence initial={false} mode="wait">
                {open ? (
                    <MotionContainer
                        key="motion-modal-body"
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        // Fill the dialog Paper as a flex column so DialogContent keeps its
                        // flex:1 + scroll behaviour. Without this the wrapper breaks the
                        // dialog's flex layout and tall content can't scroll.
                        style={{ width: "100%", display: "flex", flexDirection: "column", minHeight: 0, flex: "1 1 auto", maxHeight: "100%" }}
                    >
                        {children}
                    </MotionContainer>
                ) : null}
            </AnimatePresence>
        </Dialog>
    );
}
