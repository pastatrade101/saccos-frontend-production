import { useCallback, useEffect, useState } from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import { Box, Button, CardContent, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { api } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";
import { brandColors } from "../../theme/colors";
import { MotionCard } from "../../ui/motion";
import { formatCurrency } from "../../utils/format";

interface LoanRefResponse {
    data?: {
        reference?: { reference_number?: string | null } | null;
        outstandingBalance?: number | null;
    };
}

interface RefreshResponse {
    data?: { results?: unknown[] };
}

// Per-loan PARTIAL repayment reference. The member pays instalments to this
// number; the amount shown is the current outstanding balance. Hidden on any
// error so it never breaks the loans view.
export function UcgLoanReferenceCard({ loanId, loanNumber, tenantId }: { loanId: string; loanNumber?: string | null; tenantId: string | null }) {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === "dark";
    const accent = isDarkMode ? "#C9A227" : brandColors.primary[700];
    const [reference, setReference] = useState<string | null>(null);
    const [outstanding, setOutstanding] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [note, setNote] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const { data } = await api.get<LoanRefResponse>(endpoints.memberPayments.ucgLoanReference(loanId), {
                params: { tenant_id: tenantId || undefined }
            });
            setReference(data?.data?.reference?.reference_number || null);
            setOutstanding(
                data?.data?.outstandingBalance !== undefined && data?.data?.outstandingBalance !== null
                    ? Number(data.data.outstandingBalance)
                    : null
            );
        } catch {
            setReference(null);
        }
    }, [loanId, tenantId]);

    useEffect(() => {
        void load();
    }, [load]);

    if (!reference) {
        return null;
    }

    const copyReference = async () => {
        try {
            await navigator.clipboard.writeText(reference);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    const checkRepayments = async () => {
        setRefreshing(true);
        setNote(null);
        try {
            const { data } = await api.post<RefreshResponse>(
                endpoints.memberPayments.ucgLoanRefresh(loanId),
                null,
                { params: { tenant_id: tenantId || undefined } }
            );
            const posted = data?.data?.results?.length || 0;
            setNote(posted > 0 ? "Marejesho yako yamehakikiwa na kuingizwa." : "Hakuna malipo mapya kwa sasa.");
            await load();
        } catch {
            setNote("Imeshindikana kukagua kwa sasa. Jaribu tena baadaye.");
        } finally {
            setRefreshing(false);
        }
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
                <Stack spacing={1.4}>
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
                            <PaymentsRoundedIcon fontSize="small" />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                Lipa mkopo {loanNumber ? `· ${loanNumber}` : ""}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Lipa kwa awamu kwa namba hii — kutoka benki au simu yoyote
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        justifyContent="space-between"
                        sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            border: "1px solid",
                            borderColor: alpha(accent, 0.35),
                            bgcolor: (paperTheme) => alpha(paperTheme.palette.background.paper, 0.8)
                        }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Reference
                            </Typography>
                            <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", lineHeight: 1.25, wordBreak: "break-all" }}>
                                {reference}
                            </Typography>
                        </Box>
                        <Tooltip title={copied ? "Imenakiliwa" : "Nakili namba"}>
                            <IconButton onClick={() => void copyReference()} aria-label="Copy loan reference" sx={{ color: copied ? brandColors.success : accent }}>
                                {copied ? <CheckRoundedIcon /> : <ContentCopyRoundedIcon />}
                            </IconButton>
                        </Tooltip>
                    </Stack>

                    {outstanding !== null ? (
                        <Stack direction="row" spacing={1} justifyContent="space-between" flexWrap="wrap" useFlexGap>
                            <Typography variant="body2" color="text.secondary">Baki unaodaiwa</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{formatCurrency(outstanding)}</Typography>
                        </Stack>
                    ) : null}

                    <Typography variant="caption" color="text.secondary">
                        Unaweza kulipa kwa awamu. Malipo ya mwisho yatakamilisha baki lote.
                    </Typography>

                    {note ? (
                        <Typography variant="caption" sx={{ color: accent, fontWeight: 600 }}>
                            {note}
                        </Typography>
                    ) : null}

                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<RefreshRoundedIcon />}
                        onClick={() => void checkRepayments()}
                        disabled={refreshing}
                        sx={{ alignSelf: "flex-start" }}
                    >
                        {refreshing ? "Inakagua…" : "Kagua malipo yangu"}
                    </Button>
                </Stack>
            </CardContent>
        </MotionCard>
    );
}
