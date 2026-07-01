import { Box, Skeleton, useMediaQuery } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { fintechGradient } from "../theme/colors";

const DRAWER_WIDTH = 280;
const TOPBAR_HEIGHT = 76;

// Shown while the session/profile is loading, in place of a blank full-screen
// spinner. It renders the app's actual shell (sidebar + branded top bar) with
// skeleton placeholders so the system stays visible and the load feels instant.
export function AppShellSkeleton() {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
    const onDark = (opacity: number) => ({ bgcolor: alpha("#ffffff", opacity) });

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
            {isDesktop ? (
                <Box
                    sx={{
                        width: DRAWER_WIDTH,
                        flexShrink: 0,
                        p: 2.5,
                        bgcolor: "background.paper",
                        borderRight: `1px solid ${theme.palette.divider}`
                    }}
                >
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 4 }}>
                        <Skeleton variant="rounded" width={40} height={40} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Skeleton variant="text" width="80%" height={20} />
                            <Skeleton variant="text" width="50%" height={14} />
                        </Box>
                    </Box>

                    <Skeleton variant="rounded" height={64} sx={{ mb: 3, borderRadius: 2 }} />

                    {Array.from({ length: 7 }).map((_, index) => (
                        <Skeleton
                            key={index}
                            variant="rounded"
                            height={40}
                            sx={{ mb: 1.25, borderRadius: 1.5, opacity: 1 - index * 0.08 }}
                        />
                    ))}
                </Box>
            ) : null}

            <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                <Box
                    sx={{
                        height: TOPBAR_HEIGHT,
                        px: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        background: fintechGradient
                    }}
                >
                    <Skeleton variant="rounded" width={220} height={26} sx={onDark(0.28)} />
                    <Box sx={{ flex: 1 }} />
                    <Skeleton
                        variant="rounded"
                        width={300}
                        height={40}
                        sx={{ borderRadius: 2, display: { xs: "none", md: "block" }, ...onDark(0.18) }}
                    />
                    <Skeleton variant="circular" width={36} height={36} sx={onDark(0.28)} />
                </Box>

                <Box sx={{ p: 3, flex: 1 }}>
                    <Skeleton variant="rounded" height={92} sx={{ mb: 3, borderRadius: 2 }} />

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
                            gap: 2,
                            mb: 3
                        }}
                    >
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Skeleton key={index} variant="rounded" height={150} sx={{ borderRadius: 2 }} />
                        ))}
                    </Box>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
                            gap: 2
                        }}
                    >
                        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 2 }} />
                        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 2 }} />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
