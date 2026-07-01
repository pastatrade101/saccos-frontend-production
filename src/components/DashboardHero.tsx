import type { ReactNode } from "react";
import { Box, CardContent, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { crestGold, displayFontFamily, inkPanel } from "../theme/colors";
import { MotionCard } from "../ui/motion";

interface DashboardHeroProps {
    eyebrow: string;
    title: string;
    subtitle?: ReactNode;
    /** Right-hand area, e.g. status chips. Style children for a dark panel. */
    actions?: ReactNode;
    /** Full-width area under the title row, e.g. quick-action buttons. */
    footer?: ReactNode;
}

/**
 * Ink "passbook cover" header shared by staff dashboards: same gradient and
 * gold ledger ruling as the sign-in panel and the member portal hero, in both
 * color modes.
 */
export function DashboardHero({ eyebrow, title, subtitle, actions, footer }: DashboardHeroProps) {
    return (
        <MotionCard
            inView
            sx={{
                position: "relative",
                overflow: "hidden",
                color: "#fff",
                border: `1px solid ${inkPanel.border}`,
                background: inkPanel.background,
                boxShadow: `0 18px 40px ${alpha("#050338", 0.35)}`,
                "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background: inkPanel.ruling
                }
            }}
        >
            <CardContent sx={{ position: "relative", p: { xs: 2, md: 2.5 } }}>
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                    spacing={2}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            variant="overline"
                            sx={{ color: crestGold.light, letterSpacing: "0.22em", fontWeight: 700 }}
                        >
                            {eyebrow}
                        </Typography>
                        <Typography
                            variant="h4"
                            sx={{
                                mt: 0.5,
                                fontFamily: displayFontFamily,
                                fontWeight: 800,
                                letterSpacing: "-0.01em",
                                fontSize: { xs: "1.5rem", md: "1.85rem" },
                                lineHeight: 1.1,
                                color: "#fff"
                            }}
                        >
                            {title}
                        </Typography>
                        {subtitle ? (
                            <Typography
                                variant="body2"
                                sx={{ mt: 0.75, maxWidth: 760, color: alpha("#FFFFFF", 0.72) }}
                            >
                                {subtitle}
                            </Typography>
                        ) : null}
                    </Box>
                    {actions ? (
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ flexShrink: 0 }}>
                            {actions}
                        </Stack>
                    ) : null}
                </Stack>
                {footer ? <Box sx={{ mt: 2 }}>{footer}</Box> : null}
            </CardContent>
        </MotionCard>
    );
}
