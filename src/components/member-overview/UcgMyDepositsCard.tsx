import { useCallback, useEffect, useState } from "react";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { Box, Button, CardContent, Chip, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { api } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";
import { brandColors } from "../../theme/colors";
import { MotionCard } from "../../ui/motion";
import { formatCurrency, formatDate } from "../../utils/format";

interface DepositOrder {
    id: string;
    amount: number;
    status: string;
    purpose: string;
    description?: string | null;
    payment_channel?: string | null;
    paid_at?: string | null;
    posted_at?: string | null;
    created_at: string;
}

interface OrdersResponse {
    data?: { data?: DepositOrder[] };
}

interface RefreshResponse {
    data?: { results?: unknown[] };
}

// Member-facing deposit history + a "check my payments" button. Shows each UCG
// deposit with a status badge so the member can see what is still processing and
// confirm a payment themselves without visiting the office. Hidden on a fetch
// error so it can ship ahead of the backend.
export function UcgMyDepositsCard({ tenantId }: { tenantId: string | null }) {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === "dark";
    const accent = isDarkMode ? "#7FB2A6" : brandColors.primary[700];
    const [orders, setOrders] = useState<DepositOrder[] | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [note, setNote] = useState<string | null>(null);

    const loadOrders = useCallback(async () => {
        try {
            const { data } = await api.get<OrdersResponse>(endpoints.memberPayments.listOrders(), {
                params: { tenant_id: tenantId || undefined, purpose: "savings_deposit", page: 1, limit: 20 }
            });
            setOrders(data?.data?.data || []);
        } catch {
            setOrders(null);
        }
    }, [tenantId]);

    useEffect(() => {
        void loadOrders();
    }, [loadOrders]);

    const checkMyPayments = async () => {
        setRefreshing(true);
        setNote(null);
        try {
            const { data } = await api.post<RefreshResponse>(
                endpoints.memberPayments.ucgReferenceRefreshMine(),
                null,
                { params: { tenant_id: tenantId || undefined } }
            );
            const posted = data?.data?.results?.length || 0;
            setNote(posted > 0 ? "Malipo yako yamehakikiwa na kuingizwa." : "Hakuna malipo mapya kwa sasa.");
            await loadOrders();
        } catch {
            setNote("Imeshindikana kukagua kwa sasa. Jaribu tena baadaye.");
        } finally {
            setRefreshing(false);
        }
    };

    // Hidden only when the fetch failed outright (older backend / UCG off).
    if (orders === null) {
        return null;
    }

    const badgeFor = (status: string): { label: string; color: string } => {
        if (status === "posted") {
            return { label: "Imeingia", color: brandColors.success };
        }
        if (status === "failed") {
            return { label: "Imeshindwa", color: brandColors.danger };
        }
        if (status === "expired") {
            return { label: "Imeisha", color: "#9A6700" };
        }
        return { label: "Inasubiri", color: "#9A6700" };
    };

    return (
        <MotionCard
            variant="outlined"
            sx={{
                borderRadius: 2,
                borderColor: alpha(accent, 0.4),
                bgcolor: alpha(accent, isDarkMode ? 0.1 : 0.06)
            }}
        >
            <CardContent sx={{ p: 2.25 }}>
                <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                                sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 1.25,
                                    display: "grid",
                                    placeItems: "center",
                                    bgcolor: alpha(accent, 0.16),
                                    color: accent
                                }}
                            >
                                <ReceiptLongRoundedIcon fontSize="small" />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                    Malipo yangu
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Deposit zako kupitia namba ya malipo
                                </Typography>
                            </Box>
                        </Stack>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<RefreshRoundedIcon />}
                            onClick={() => void checkMyPayments()}
                            disabled={refreshing}
                            sx={{ whiteSpace: "nowrap" }}
                        >
                            {refreshing ? "Inakagua…" : "Kagua malipo yangu"}
                        </Button>
                    </Stack>

                    {note ? (
                        <Typography variant="caption" sx={{ color: accent, fontWeight: 600 }}>
                            {note}
                        </Typography>
                    ) : null}

                    {orders.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            Bado hujafanya malipo kupitia namba yako ya malipo. Ukilipa, yataonekana hapa
                            na kuingia kwenye akiba yako kiotomatiki.
                        </Typography>
                    ) : (
                        <Stack spacing={1}>
                            {orders.map((order) => {
                                const badge = badgeFor(order.status);
                                const when = order.paid_at || order.posted_at || order.created_at;
                                return (
                                    <Stack
                                        key={order.id}
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                        justifyContent="space-between"
                                        sx={{
                                            p: 1.25,
                                            borderRadius: 1.5,
                                            border: "1px solid",
                                            borderColor: alpha(accent, 0.25),
                                            bgcolor: (paperTheme) => alpha(paperTheme.palette.background.paper, 0.8)
                                        }}
                                    >
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography sx={{ fontWeight: 800 }}>
                                                {formatCurrency(order.amount)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {formatDate(when)}
                                                {order.payment_channel ? ` · ${order.payment_channel}` : ""}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={badge.label}
                                            size="small"
                                            sx={{
                                                fontWeight: 700,
                                                color: badge.color,
                                                bgcolor: alpha(badge.color, 0.14),
                                                border: `1px solid ${alpha(badge.color, 0.4)}`
                                            }}
                                        />
                                    </Stack>
                                );
                            })}
                        </Stack>
                    )}
                </Stack>
            </CardContent>
        </MotionCard>
    );
}
