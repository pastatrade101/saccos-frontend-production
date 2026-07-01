import { CardContent, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { ChartData, ChartOptions } from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import type { ReactNode } from "react";

import { registerCharts } from "../lib/charts";
import { MotionCard } from "../ui/motion";

registerCharts();

interface ChartPanelProps {
    title: string;
    subtitle?: string;
    type?: "line" | "bar" | "doughnut";
    data: ChartData<"line" | "bar" | "doughnut">;
    options?: ChartOptions<"line" | "bar" | "doughnut">;
    height?: number;
    actions?: ReactNode;
}

export function ChartPanel({
    title,
    subtitle,
    type = "line",
    data,
    options,
    height = 280,
    actions
}: ChartPanelProps) {
    const theme = useTheme();

    return (
        <MotionCard
            variant="outlined"
            inView
            sx={{
                background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.secondary.main, 0.03)})`
            }}
        >
            <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.25}>
                    <div>
                        <Typography variant="h6">{title}</Typography>
                        {subtitle ? (
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem", lineHeight: 1.3 }}>
                                {subtitle}
                            </Typography>
                        ) : null}
                    </div>
                    {actions}
                </Stack>
                <div style={{ height }}>
                    {type === "bar" ? (
                        <Bar data={data as ChartData<"bar">} options={options as ChartOptions<"bar">} />
                    ) : type === "doughnut" ? (
                        <Doughnut data={data as ChartData<"doughnut">} options={options as ChartOptions<"doughnut">} />
                    ) : (
                        <Line data={data as ChartData<"line">} options={options as ChartOptions<"line">} />
                    )}
                </div>
            </CardContent>
        </MotionCard>
    );
}
