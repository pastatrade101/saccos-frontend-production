import { Box, type BoxProps } from "@mui/material";
import { motion } from "framer-motion";
import { useMemo, type PropsWithChildren } from "react";

import { page, useReducedMotionSafe } from "./presets";

export interface MotionSectionProps extends Omit<BoxProps, "component"> {
    inView?: boolean;
    once?: boolean;
    disableMotion?: boolean;
}

export function MotionSection({
    inView = false,
    once = true,
    disableMotion = false,
    children,
    ...props
}: PropsWithChildren<MotionSectionProps>) {
    const reducedMotion = useReducedMotionSafe();
    const variants = useMemo(() => page(reducedMotion), [reducedMotion]);
    const canAnimate = !disableMotion;

    return (
        <motion.div
            variants={canAnimate ? variants : undefined}
            initial={canAnimate ? "hidden" : false}
            animate={!inView && canAnimate ? "visible" : undefined}
            whileInView={inView && canAnimate ? "visible" : undefined}
                /* `amount: "some"` — any sliver, not a percentage. A
                   percentage threshold is unreachable for an element taller
                   than the viewport: 20% of a 9,000px table is 1,800px, more
                   than most screens can show at once, so it never becomes
                   visible and never can. */
            viewport={inView && canAnimate ? { once, amount: "some" } : undefined}
            style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}
        >
            <Box {...props}>{children}</Box>
        </motion.div>
    );
}
