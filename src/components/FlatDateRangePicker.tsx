import flatpickr from "flatpickr";
import type { Instance } from "flatpickr/dist/types/instance";
import "flatpickr/dist/flatpickr.min.css";
import { TextField } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useRef } from "react";

interface FlatDateRangePickerProps {
    label?: string;
    start: string;
    end: string;
    onChange: (start: string, end: string) => void;
    minWidth?: number;
}

// Single-input date-range picker backed by flatpickr, styled as a MUI field.
export function FlatDateRangePicker({ label = "Period", start, end, onChange, minWidth = 250 }: FlatDateRangePickerProps) {
    const theme = useTheme();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const instanceRef = useRef<Instance | null>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {
        if (!inputRef.current) {
            return undefined;
        }
        const instance = flatpickr(inputRef.current, {
            mode: "range",
            dateFormat: "Y-m-d",
            allowInput: false,
            defaultDate: start && end ? [start, end] : start ? [start] : undefined,
            onChange: (selected) => {
                if (selected.length === 2) {
                    const [from, to] = selected;
                    const iso = (date: Date) => flatpickr.formatDate(date, "Y-m-d");
                    onChangeRef.current(iso(from), iso(to));
                } else if (selected.length === 0) {
                    onChangeRef.current("", "");
                }
            }
        });
        instanceRef.current = instance;
        return () => {
            instance.destroy();
            instanceRef.current = null;
        };
        // Intentionally init-once: external value changes are pushed below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const instance = instanceRef.current;
        if (!instance) {
            return;
        }
        const current = instance.selectedDates.map((date) => flatpickr.formatDate(date, "Y-m-d"));
        const next = start && end ? [start, end] : [];
        if (current.join("|") !== next.join("|")) {
            instance.setDate(next, false);
        }
    }, [start, end]);

    return (
        <TextField
            label={label}
            size="small"
            placeholder="Select date range"
            inputRef={inputRef}
            sx={{
                minWidth,
                // flatpickr writes the value directly on the input; keep the
                // MUI label floated so it never overlaps.
                "& .MuiInputBase-input": { cursor: "pointer", caretColor: "transparent" },
                "& .flatpickr-input": { color: theme.palette.text.primary }
            }}
            slotProps={{ inputLabel: { shrink: true } }}
        />
    );
}
