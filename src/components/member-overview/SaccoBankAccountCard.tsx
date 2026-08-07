import { useState } from "react";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import { Box, CardContent, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { brandColors } from "../../theme/colors";
import { MotionCard } from "../../ui/motion";

export interface SaccoBankAccountData {
    accountName?: string | null;
    bankName?: string | null;
    bankBranch?: string | null;
    accountNumber?: string | null;
    swiftCode?: string | null;
    instructions?: string | null;
}

// The account members pay into. Rendered for every member — no feature flag —
// and hidden only when the SACCO has not configured an account number yet.
export function SaccoBankAccountCard({
    accountName,
    bankName,
    bankBranch,
    accountNumber,
    swiftCode,
    instructions
}: SaccoBankAccountData) {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === "dark";
    const accent = isDarkMode ? "#D9B273" : brandColors.primary[700];
    const [copied, setCopied] = useState(false);

    if (!accountNumber) {
        return null;
    }

    const copyAccountNumber = async () => {
        try {
            await navigator.clipboard.writeText(accountNumber);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard is blocked in some mobile webviews; the number stays
            // selectable on screen so the member can still copy it by hand.
            setCopied(false);
        }
    };

    const bankLine = [bankName, bankBranch].filter(Boolean).join(" — ");

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
                            <AccountBalanceRoundedIcon fontSize="small" />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                Akaunti ya SACCOS
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Tumia namba hii kuweka michango yako
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
                                Account number
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
                                {accountNumber}
                            </Typography>
                        </Box>
                        <Tooltip title={copied ? "Imenakiliwa" : "Nakili namba"}>
                            <IconButton
                                onClick={() => void copyAccountNumber()}
                                aria-label="Copy account number"
                                sx={{ color: copied ? brandColors.success : accent }}
                            >
                                {copied ? <CheckRoundedIcon /> : <ContentCopyRoundedIcon />}
                            </IconButton>
                        </Tooltip>
                    </Stack>

                    <Stack spacing={0.5}>
                        {accountName ? (
                            <Stack direction="row" spacing={1} justifyContent="space-between" flexWrap="wrap" useFlexGap>
                                <Typography variant="body2" color="text.secondary">Jina la akaunti</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{accountName}</Typography>
                            </Stack>
                        ) : null}
                        {bankLine ? (
                            <Stack direction="row" spacing={1} justifyContent="space-between" flexWrap="wrap" useFlexGap>
                                <Typography variant="body2" color="text.secondary">Benki</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{bankLine}</Typography>
                            </Stack>
                        ) : null}
                        {swiftCode ? (
                            <Stack direction="row" spacing={1} justifyContent="space-between" flexWrap="wrap" useFlexGap>
                                <Typography variant="body2" color="text.secondary">SWIFT</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{swiftCode}</Typography>
                            </Stack>
                        ) : null}
                    </Stack>

                    <Typography variant="caption" color="text.secondary">
                        {instructions
                            || "Weka jina lako kamili au namba ya uanachama kwenye maelezo ya malipo ili mchango wako utambulike haraka."}
                    </Typography>
                </Stack>
            </CardContent>
        </MotionCard>
    );
}
