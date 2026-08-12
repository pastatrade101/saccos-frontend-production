import { useMemo, useState } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { ChartOptions } from "chart.js";

import { ChartPanel } from "../ChartPanel";
import { brandColors } from "../../theme/colors";

export interface SavingsTrendPoint {
    date: number;
    balance: number;
}

type TrendMode = "monthly" | "quarterly" | "year";

interface SavingsTrendChartProps {
    series: SavingsTrendPoint[];
    fallbackLabels?: string[];
    fallbackValues?: number[];
    /** Drop the card and title when the caller supplies its own section chrome. */
    bare?: boolean;
}

const MODE_META: Record<TrendMode, { toggle: string; range: string; axis: string }> = {
    monthly: { toggle: "Monthly", range: "Last 12 months", axis: "Month" },
    quarterly: { toggle: "Quarterly", range: "Last 8 quarters", axis: "Quarter" },
    year: { toggle: "SACCO Year", range: "This SACCO year to date", axis: "Month" }
};

const compactNumber = new Intl.NumberFormat("en-TZ", {
    notation: "compact",
    maximumFractionDigits: 1
});

const fullNumber = new Intl.NumberFormat("en-TZ", {
    maximumFractionDigits: 0
});

function monthLabel(date: Date) {
    return new Intl.DateTimeFormat("en-TZ", { month: "short", year: "2-digit" }).format(date);
}

function endOfMonth(year: number, monthIndex: number) {
    return new Date(year, monthIndex + 1, 0, 23, 59, 59, 999).getTime();
}

interface TrendBucket {
    end: number;
    label: string;
}

function buildBuckets(mode: TrendMode, now: Date): TrendBucket[] {
    const buckets: TrendBucket[] = [];

    if (mode === "monthly") {
        for (let i = 11; i >= 0; i -= 1) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            buckets.push({ end: endOfMonth(date.getFullYear(), date.getMonth()), label: monthLabel(date) });
        }
        return buckets;
    }

    if (mode === "quarterly") {
        const currentQuarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        for (let i = 7; i >= 0; i -= 1) {
            const quarterStart = new Date(now.getFullYear(), currentQuarterStartMonth - i * 3, 1);
            const quarter = Math.floor(quarterStart.getMonth() / 3) + 1;
            buckets.push({
                end: endOfMonth(quarterStart.getFullYear(), quarterStart.getMonth() + 2),
                label: `Q${quarter} '${String(quarterStart.getFullYear()).slice(-2)}`
            });
        }
        return buckets;
    }

    // SACCO year: from January of the current financial year up to the current month.
    for (let month = 0; month <= now.getMonth(); month += 1) {
        const date = new Date(now.getFullYear(), month, 1);
        buckets.push({ end: endOfMonth(date.getFullYear(), date.getMonth()), label: monthLabel(date) });
    }
    return buckets;
}

function buildTrend(series: SavingsTrendPoint[], mode: TrendMode) {
    const buckets = buildBuckets(mode, new Date());
    const sorted = [...series].sort((a, b) => a.date - b.date);

    let cursor = 0;
    let lastBalance: number | null = null;
    const rows = buckets.map((bucket) => {
        while (cursor < sorted.length && sorted[cursor].date <= bucket.end) {
            lastBalance = sorted[cursor].balance;
            cursor += 1;
        }
        return { label: bucket.label, balance: lastBalance, hasData: lastBalance !== null };
    });

    const firstWithData = rows.findIndex((row) => row.hasData);
    if (firstWithData === -1) {
        return { labels: [], values: [] };
    }

    const trimmed = rows.slice(firstWithData);
    return {
        labels: trimmed.map((row) => row.label),
        values: trimmed.map((row) => row.balance ?? 0)
    };
}

export function SavingsTrendChart({ series, fallbackLabels, fallbackValues, bare = false }: SavingsTrendChartProps) {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === "dark";
    const accent = isDarkMode ? "#D9B273" : brandColors.primary[700];
    const [mode, setMode] = useState<TrendMode>("monthly");

    const trend = useMemo(() => {
        if (series.length) {
            return buildTrend(series, mode);
        }
        return {
            labels: fallbackLabels ?? [],
            values: fallbackValues ?? []
        };
    }, [series, mode, fallbackLabels, fallbackValues]);

    const hasData = trend.values.length > 0;
    const meta = MODE_META[mode];

    const options: ChartOptions<"line"> = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: (items) => items[0]?.label ?? "",
                    label: (item) => `Balance: TSh ${fullNumber.format(Number(item.parsed.y) || 0)}`
                }
            }
        },
        scales: {
            x: {
                title: { display: true, text: meta.axis },
                grid: { display: false }
            },
            y: {
                title: { display: true, text: "Balance (TZS)" },
                ticks: {
                    callback: (value) => compactNumber.format(Number(value))
                }
            }
        }
    };

    return (
        <ChartPanel
            bare={bare}
            title="Savings Trend"
            subtitle={
                hasData
                    ? `Posted savings balance · ${meta.range}.`
                    : "No posted savings activity yet for the selected range."
            }
            height={300}
            actions={
                <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={mode}
                    onChange={(_event, next: TrendMode | null) => {
                        if (next) {
                            setMode(next);
                        }
                    }}
                    sx={{ flexShrink: 0 }}
                >
                    {(Object.keys(MODE_META) as TrendMode[]).map((key) => (
                        <ToggleButton key={key} value={key} sx={{ px: 1.5, textTransform: "none" }}>
                            {MODE_META[key].toggle}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            }
            data={{
                labels: trend.labels,
                datasets: [
                    {
                        label: "Savings balance",
                        data: trend.values,
                        borderColor: accent,
                        backgroundColor: alpha(accent, 0.12),
                        fill: true,
                        tension: 0.3,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        pointBackgroundColor: accent,
                        spanGaps: true
                    }
                ]
            }}
            options={options as ChartOptions<"line" | "bar" | "doughnut">}
        />
    );
}
