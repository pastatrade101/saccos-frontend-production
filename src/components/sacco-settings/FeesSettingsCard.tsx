import { useCallback, useEffect, useState } from "react";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import {
    Alert,
    Box,
    Button,
    CardContent,
    Divider,
    FormControlLabel,
    InputAdornment,
    Stack,
    Switch,
    TextField,
    Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { api, getApiErrorMessage } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";
import { brandColors } from "../../theme/colors";
import { MotionCard } from "../../ui/motion";

type FeeKey = "operation_cost" | "loan_application_fee" | "membership_fee";

interface FeeEntry {
    enabled: boolean;
    amount: number;
    label: string;
}

type FeesMap = Record<FeeKey, FeeEntry>;

interface FeesResponse {
    data?: { fees?: Partial<FeesMap> };
}

const FEE_META: { key: FeeKey; title: string; help: string }[] = [
    {
        key: "operation_cost",
        title: "Gharama ya uendeshaji (Operation cost)",
        help: "Kiasi ambacho mwanachama huchangia kwa ajili ya uendeshaji."
    },
    {
        key: "loan_application_fee",
        title: "Ada ya kuomba mkopo (Loan application fee)",
        help: "Ada inayotozwa wakati mwanachama anawasilisha maombi ya mkopo."
    },
    {
        key: "membership_fee",
        title: "Ada ya uanachama (Membership fee)",
        help: "Ada ya kujiunga inayolipwa wakati wa usajili."
    }
];

const DEFAULTS: FeesMap = {
    operation_cost: { enabled: false, amount: 0, label: "Operation cost" },
    loan_application_fee: { enabled: false, amount: 0, label: "Loan application fee" },
    membership_fee: { enabled: false, amount: 0, label: "Membership fee" }
};

// Per-SACCO configurable fees. Staff with edit rights set whether each fee is
// charged and its amount; the figures feed the member quotes and the UCG
// references minted against them. Hidden on a load error so it never breaks the
// settings page on an older backend.
export function FeesSettingsCard({ tenantId, canEdit }: { tenantId: string | null; canEdit: boolean }) {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === "dark";
    const accent = isDarkMode ? "#7FB2A6" : brandColors.primary[700];
    const [fees, setFees] = useState<FeesMap | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

    const load = useCallback(async () => {
        try {
            const { data } = await api.get<FeesResponse>(endpoints.saccoSettings.fees(), {
                params: { tenant_id: tenantId || undefined }
            });
            const incoming = data?.data?.fees || {};
            setFees({
                operation_cost: { ...DEFAULTS.operation_cost, ...incoming.operation_cost },
                loan_application_fee: { ...DEFAULTS.loan_application_fee, ...incoming.loan_application_fee },
                membership_fee: { ...DEFAULTS.membership_fee, ...incoming.membership_fee }
            });
        } catch {
            setFees(null);
        }
    }, [tenantId]);

    useEffect(() => {
        void load();
    }, [load]);

    if (!fees) {
        return null;
    }

    const setFee = (key: FeeKey, patch: Partial<FeeEntry>) => {
        setFees((current) => (current ? { ...current, [key]: { ...current[key], ...patch } } : current));
    };

    const save = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await api.patch(endpoints.saccoSettings.fees(), { tenant_id: tenantId || undefined, fees });
            setMessage({ tone: "success", text: "Ada zimehifadhiwa." });
            await load();
        } catch (error) {
            setMessage({ tone: "error", text: getApiErrorMessage(error, "Imeshindikana kuhifadhi ada.") });
        } finally {
            setSaving(false);
        }
    };

    return (
        <MotionCard variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: { xs: 1.75, md: 2.5 } }}>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1.25,
                                display: "grid",
                                placeItems: "center",
                                bgcolor: alpha(accent, 0.16),
                                color: accent
                            }}
                        >
                            <PaymentsRoundedIcon fontSize="small" />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                                Ada na gharama
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Weka kiasi na uwashe ada zinazotozwa wanachama.
                            </Typography>
                        </Box>
                    </Stack>

                    {message ? <Alert severity={message.tone}>{message.text}</Alert> : null}

                    <Stack spacing={2.25} divider={<Divider flexItem />}>
                        {FEE_META.map((meta) => {
                            const fee = fees[meta.key];
                            return (
                                <Stack
                                    key={meta.key}
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1.5}
                                    alignItems={{ xs: "flex-start", sm: "center" }}
                                    justifyContent="space-between"
                                >
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography sx={{ fontWeight: 700 }}>{meta.title}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {meta.help}
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <TextField
                                            label="Kiasi"
                                            type="number"
                                            size="small"
                                            value={fee.amount}
                                            disabled={!canEdit || !fee.enabled}
                                            onChange={(event) => setFee(meta.key, { amount: Number(event.target.value) })}
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start">TSh</InputAdornment>
                                            }}
                                            sx={{ width: 170 }}
                                        />
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={fee.enabled}
                                                    disabled={!canEdit}
                                                    onChange={(event) => setFee(meta.key, { enabled: event.target.checked })}
                                                />
                                            }
                                            label={fee.enabled ? "Imewashwa" : "Imezimwa"}
                                        />
                                    </Stack>
                                </Stack>
                            );
                        })}
                    </Stack>

                    {canEdit ? (
                        <Box>
                            <Button variant="contained" onClick={() => void save()} disabled={saving}>
                                {saving ? "Inahifadhi…" : "Hifadhi ada"}
                            </Button>
                        </Box>
                    ) : (
                        <Typography variant="caption" color="text.secondary">
                            Huna ruhusa ya kubadilisha ada. Zinawekwa na super admin au branch manager.
                        </Typography>
                    )}
                </Stack>
            </CardContent>
        </MotionCard>
    );
}
