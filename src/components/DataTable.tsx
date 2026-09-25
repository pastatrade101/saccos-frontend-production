import { Box, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { brandColors } from "../theme/colors";
import { MotionCard } from "../ui/motion";
import { AppLoader } from "./AppLoader";

export interface Column<T> {
    key: string;
    header: ReactNode;
    render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
    rows: T[];
    columns: Column<T>[];
    emptyMessage?: ReactNode;
    maxHeight?: number | string;
    stickyHeader?: boolean;
}

export function DataTable<T>({
    rows,
    columns,
    emptyMessage = "No records available.",
    maxHeight,
    stickyHeader = false
}: DataTableProps<T>) {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === "dark";
    const accent = isDarkMode ? "#D9B273" : theme.palette.primary.main;
    const isPhone = useMediaQuery(theme.breakpoints.down("sm"));

    if (!rows.length) {
        if (typeof emptyMessage === "string" && /^loading\b/i.test(emptyMessage.trim())) {
            return (
                <MotionCard variant="outlined" sx={{ p: 2, borderStyle: "dashed" }}>
                    <AppLoader fullscreen={false} minHeight={220} message={emptyMessage} size={110} />
                </MotionCard>
            );
        }

        return (
            <MotionCard variant="outlined" sx={{ p: 4, textAlign: "center", borderStyle: "dashed" }}>
                <Typography variant="body2" color="text.secondary">
                    {emptyMessage}
                </Typography>
            </MotionCard>
        );
    }

    // On a phone the table used to keep its 680px minimum and scroll
    // sideways inside a 390px screen, so a member saw the first two columns
    // of six and had to drag the rest into view a piece at a time. Every
    // table in the portal is this component, so every one of them did it.
    //
    // Below `sm` each row becomes a card instead: the column headers are the
    // labels, stacked, nothing cropped and nothing to scroll horizontally.
    // The cells render exactly as they do in the table — same chips, same
    // buttons, same progress lines — because they are the same renderers.
    if (isPhone) {
        return (
            <Stack spacing={1.25}>
                {rows.map((row, index) => (
                    <MotionCard key={index} variant="outlined" inView sx={{ p: 1.75 }}>
                        <Stack spacing={1.25}>
                            {columns.map((column) => {
                                const value = column.render(row);
                                // A column with nothing in it earns no label.
                                if (value === null || value === undefined || value === "") {
                                    return null;
                                }
                                return (
                                    <Box key={column.key}>
                                        <Typography
                                            component="div"
                                            sx={{
                                                textTransform: "uppercase",
                                                letterSpacing: "0.08em",
                                                fontSize: 10.5,
                                                fontWeight: 700,
                                                color: accent,
                                                mb: 0.35
                                            }}
                                        >
                                            {column.header}
                                        </Typography>
                                        <Box sx={{ fontSize: 14, minWidth: 0, overflowWrap: "anywhere" }}>
                                            {value}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </MotionCard>
                ))}
            </Stack>
        );
    }

    return (
        <MotionCard variant="outlined" inView sx={{ overflow: "hidden" }}>
            <TableContainer
                component="div"
                sx={{
                    maxHeight,
                    overflowX: "auto",
                    overflowY: maxHeight ? "auto" : undefined
                }}
            >
                <Table size="small" stickyHeader={stickyHeader} sx={{ minWidth: { xs: 680, md: "100%" } }}>
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <TableCell
                                    key={column.key}
                                    sx={{
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em",
                                        fontSize: 11,
                                        color: accent,
                                        bgcolor: isDarkMode ? alpha(accent, 0.12) : brandColors.primary[100],
                                        borderBottomColor: "divider"
                                    }}
                                >
                                    {column.header}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row, index) => (
                            <TableRow
                                key={index}
                                hover
                                sx={{
                                    "&:hover td": {
                                        bgcolor: isDarkMode ? alpha(accent, 0.08) : "rgba(31, 168, 230, 0.04)"
                                    }
                                }}
                            >
                                {columns.map((column) => (
                                    <TableCell key={column.key}>{column.render(row)}</TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </MotionCard>
    );
}
