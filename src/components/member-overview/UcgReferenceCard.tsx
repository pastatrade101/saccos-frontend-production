import { useEffect, useState } from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import { Box, CardContent, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { api } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";
import { HowToPayHelp } from "../member-portal/HowToPayHelp";
import { brandColors } from "../../theme/colors";
import { MotionCard } from "../../ui/motion";
import { formatCurrency } from "../../utils/format";

interface UcgReferenceRow {
    reference_number?: string | null;
    payment_option?: string | null;
    status?: string | null;
    purpose?: string | null;
    amount?: number | string | null;
    min_payment_amount?: number | string | null;
}

interface UcgReferenceResponse {
    data?: { reference?: UcgReferenceRow | null; created?: boolean };
}

const PURPOSE_LABEL: Record<string, string> = {
    savings_deposit: "Akiba (Savings)",
    share_contribution: "Hisa (Share capital)",
    membership_fee: "Ada ya uanachama",
    loan_repayment: "Marejesho ya mkopo",
    operation_cost: "Gharama ya uendeshaji"
};

// The member's personal UCG payment reference. They pay it from any bank or
// mobile wallet and the deposit posts to their savings automatically — no slip,
// no office typing. Rendered only once a reference is available; on any error
// (UCG not enabled, no savings account, older backend) the card stays hidden so
// the portal is never broken by it.
export function UcgReferenceCard({ kind = "savings" }: { kind?: "savings" | "shares" | "operation_cost" }) {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === "dark";
    const accent = isDarkMode ? "#7FB2A6" : brandColors.primary[700];
    const [row, setRow] = useState<UcgReferenceRow | null>(null);
    const [copied, setCopied] = useState(false);
    const endpoint = kind === "shares"
        ? endpoints.memberPayments.ucgSharesReference()
        : kind === "operation_cost"
            ? endpoints.memberPayments.ucgOperationCostReference()
            : endpoints.memberPayments.ucgReference();
    const heading = kind === "shares"
        ? "Namba ya kununua hisa"
        : kind === "operation_cost"
            ? "Namba ya gharama ya uendeshaji"
            : "Namba yako ya malipo";

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const { data } = await api.get<UcgReferenceResponse>(endpoint);
                if (active) {
                    setRow(data?.data?.reference || null);
                }
            } catch {
                // Hidden on failure by design — see component note above.
                if (active) {
                    setRow(null);
                }
            }
        })();
        return () => {
            active = false;
        };
    }, [endpoint]);

    const reference = row?.reference_number || null;
    if (!reference) {
        return null;
    }

    const isPerpetual = (row?.payment_option || "") === "PERPETUAL";
    const purposeLabel = PURPOSE_LABEL[row?.purpose || ""] || "Malipo";
    const suggested = Number(row?.amount || 0);
    const minimum = Number(row?.min_payment_amount || 0);

    const copyReference = async () => {
        try {
            await navigator.clipboard.writeText(reference);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard is blocked in some mobile webviews; the reference stays
            // selectable on screen so the member can copy it by hand.
            setCopied(false);
        }
    };

    return (
        <MotionCard
            variant="outlined"
            sx={{
                width: { xs: "calc(100vw - 20px)", sm: 1 },
                maxWidth: { xs: "calc(100vw - 20px)", sm: "100%" },
                minWidth: 0,
                boxSizing: "border-box",
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
                            <QrCode2RoundedIcon fontSize="small" />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                {heading}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Lipia kwa namba hii kutoka benki au mtandao wowote wa simu
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
                            <Typography
                                sx={{
                                    fontWeight: 800,
                                    fontSize: "1.35rem",
                                    lineHeight: 1.25,
                                    letterSpacing: "0.04em",
                                    fontVariantNumeric: "tabular-nums",
                                    userSelect: "all",
                                    wordBreak: "break-all"
                                }}
                            >
                                {reference}
                            </Typography>
                        </Box>
                        <Tooltip title={copied ? "Imenakiliwa" : "Nakili namba"}>
                            <IconButton
                                onClick={() => void copyReference()}
                                aria-label="Copy payment reference"
                                sx={{ color: copied ? brandColors.success : accent }}
                            >
                                {copied ? <CheckRoundedIcon /> : <ContentCopyRoundedIcon />}
                            </IconButton>
                        </Tooltip>
                        {/* Beside the number, because that is where the member
                            is looking when they ask what to do with it. */}
                        <HowToPayHelp size="medium" />
                    </Stack>

                    <Stack spacing={0.5}>
                        <Stack direction="row" spacing={1} justifyContent="space-between" flexWrap="wrap" useFlexGap>
                            <Typography variant="body2" color="text.secondary">Unalipia</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{purposeLabel}</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} justifyContent="space-between" flexWrap="wrap" useFlexGap>
                            <Typography variant="body2" color="text.secondary">Kiasi</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, textAlign: "right" }}>
                                {isPerpetual
                                    ? `Chochote${suggested > 0 ? ` (pendekezo ${formatCurrency(suggested)})` : ""}`
                                    : formatCurrency(suggested)}
                            </Typography>
                        </Stack>
                        {minimum > 0 ? (
                            <Stack direction="row" spacing={1} justifyContent="space-between" flexWrap="wrap" useFlexGap>
                                <Typography variant="body2" color="text.secondary">Kiwango cha chini</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(minimum)}</Typography>
                            </Stack>
                        ) : null}
                    </Stack>

                    <Typography variant="caption" color="text.secondary">
                        Namba hii ni yako binafsi na haibadiliki. Malipo yako yataingia
                        moja kwa moja kwenye akiba yako bila kupeleka risiti ofisini.
                    </Typography>
                </Stack>
            </CardContent>
        </MotionCard>
    );
}
