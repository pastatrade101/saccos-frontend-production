import {
    Autocomplete,
    CircularProgress,
    ListItemText,
    TextField,
    createFilterOptions,
    type TextFieldProps
} from "@mui/material";

export interface SearchableOption {
    value: string;
    label: string;
    secondary?: string;
}

interface SearchableSelectProps {
    value: string;
    options: SearchableOption[];
    placeholder?: string;
    onChange: (value: string) => void;
    label?: string;
    helperText?: React.ReactNode;
    error?: boolean;
    size?: TextFieldProps["size"];
    disabled?: boolean;
    loading?: boolean;
    /** @deprecated placement is now handled automatically by the dropdown. */
    dropdownDirection?: "down" | "up";
}

const filterOptions = createFilterOptions<SearchableOption>({
    stringify: (option) => `${option.label} ${option.secondary ?? ""}`,
    limit: 100
});

export function SearchableSelect({
    value,
    options,
    placeholder = "Search and select...",
    onChange,
    label,
    helperText,
    error = false,
    size = "medium",
    disabled = false,
    loading = false
}: SearchableSelectProps) {
    const selectedOption = options.find((option) => option.value === value) || null;

    return (
        <Autocomplete<SearchableOption>
            fullWidth
            autoHighlight
            blurOnSelect
            disabled={disabled}
            loading={loading}
            value={selectedOption}
            options={options}
            filterOptions={filterOptions}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, selected) => option.value === selected.value}
            noOptionsText={loading ? "Loading…" : "No matches found."}
            onChange={(_event, option) => onChange(option ? option.value : "")}
            renderOption={(props, option) => {
                const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key?: string };
                return (
                    <li key={option.value ?? key} {...rest}>
                        <ListItemText primary={option.label} secondary={option.secondary} />
                    </li>
                );
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    placeholder={placeholder}
                    helperText={helperText}
                    error={error}
                    size={size}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading ? <CircularProgress color="inherit" size={18} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        )
                    }}
                />
            )}
        />
    );
}
