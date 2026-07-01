import { Box, Skeleton, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const SIDEBAR_WIDTH = 296;
const TOPBAR_HEIGHT = 68;

// Shown while the member portal loads, in place of a blank spinner. Renders the
// member-workspace shell (sidebar + top bar) with skeleton placeholders so the
// structure is visible and the load feels instant.
export function MemberPortalSkeleton() {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
            {isDesktop ? (
                <Box
                    sx={{
                        width: SIDEBAR_WIDTH,
                        flexShrink: 0,
                        p: 2.5,
                        bgcolor: "background.paper",
                        borderRight: `1px solid ${theme.palette.divider}`
                    }}
                >
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 3 }}>
                        <Skeleton variant="rounded" width={40} height={40} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Skeleton variant="text" width="85%" height={18} />
                            <Skeleton variant="text" width="55%" height={13} />
                        </Box>
                    </Box>

                    <Skeleton variant="rounded" height={72} sx={{ mb: 3, borderRadius: 2 }} />

                    {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton
                            key={index}
                            variant="rounded"
                            height={52}
                            sx={{ mb: 1.25, borderRadius: 2, opacity: 1 - index * 0.09 }}
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
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        bgcolor: "background.paper"
                    }}
                >
                    <Skeleton variant="rounded" width={200} height={22} />
                    <Box sx={{ flex: 1 }} />
                    <Skeleton variant="rounded" width={320} height={40} sx={{ borderRadius: 3, display: { xs: "none", md: "block" } }} />
                    <Skeleton variant="circular" width={38} height={38} />
                    <Skeleton variant="circular" width={38} height={38} />
                </Box>

                <Box sx={{ p: 3, flex: 1 }}>
                    <Skeleton variant="rounded" height={96} sx={{ mb: 3, borderRadius: 2 }} />

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                            gap: 2,
                            mb: 3
                        }}
                    >
                        {Array.from({ length: 3 }).map((_, index) => (
                            <Skeleton key={index} variant="rounded" height={200} sx={{ borderRadius: 2 }} />
                        ))}
                    </Box>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
                            gap: 2
                        }}
                    >
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Skeleton key={index} variant="rounded" height={120} sx={{ borderRadius: 2 }} />
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
