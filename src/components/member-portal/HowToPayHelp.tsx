import { useEffect, useState } from "react";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import {
    Box, Dialog, DialogContent, DialogTitle, Divider, IconButton,
    Stack, Tooltip, Typography
} from "@mui/material";

import { api } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";

interface PaymentGuideChannel {
    key: string;
    title: string;
    subtitle?: string | null;
    steps?: string[];
    note?: string | null;
}

/**
 * The "?" beside a payment reference, opening the SACCOS's own how-to-pay
 * steps.
 *
 * The steps come from the server, not from this file. They are USSD menu
 * positions in somebody else's bank — "Chagua 95 — Mwanga Hakika Bank" is a
 * slot that moves — and a member following a stale one sends their deposit
 * somewhere nobody can trace. Held here, correcting it would mean a release;
 * held on the tenant, it is an edit that reaches the portal and the app at
 * once.
 *
 * Renders nothing at all when no guide is configured: a help icon that opens
 * an empty sheet is worse than no icon.
 */
export function HowToPayHelp({ size = "small" }: { size?: "small" | "medium" }) {
    const [channels, setChannels] = useState<PaymentGuideChannel[]>([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        api.get<{ data?: { payment_guide?: PaymentGuideChannel[] } }>(
            endpoints.memberPortalSettings.paymentControls()
        )
            .then(({ data }) => {
                if (cancelled) return;
                const guide = data?.data?.payment_guide;
                setChannels(Array.isArray(guide) ? guide : []);
            })
            .catch(() => {
                // The reference is the point of the card; the help is not worth
                // an error toast over.
                if (!cancelled) setChannels([]);
            });
        return () => { cancelled = true; };
    }, []);

    if (!channels.length) {
        return null;
    }

    return (
        <>
            <Tooltip title="Jinsi ya kulipa">
                <IconButton
                    size={size}
                    onClick={() => setOpen(true)}
                    aria-label="Jinsi ya kulipa"
                    sx={{ color: "primary.main" }}
                >
                    <HelpOutlineRoundedIcon fontSize={size === "small" ? "small" : "medium"} />
                </IconButton>
            </Tooltip>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth scroll="paper">
                <DialogTitle sx={{ pb: 0.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Weka akiba yako popote ulipo</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Kila muamala: tumia <strong>Reference Number</strong> yako.
                    </Typography>
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2.5}>
                        {channels.map((channel, index) => (
                            <Box key={channel.key || index}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{channel.title}</Typography>
                                {channel.subtitle ? (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                                        {channel.subtitle}
                                    </Typography>
                                ) : null}

                                {channel.steps?.length ? (
                                    <Stack component="ol" spacing={0.35} sx={{ pl: 2.5, m: 0 }}>
                                        {channel.steps.map((step, stepIndex) => (
                                            <Typography key={stepIndex} component="li" variant="body2">
                                                {step}
                                            </Typography>
                                        ))}
                                    </Stack>
                                ) : null}

                                {channel.note ? (
                                    <Typography variant="body2" sx={{ mt: channel.steps?.length ? 0.75 : 0 }}>
                                        {channel.note}
                                    </Typography>
                                ) : null}

                                {index < channels.length - 1 ? <Divider sx={{ mt: 2 }} /> : null}
                            </Box>
                        ))}
                    </Stack>
                </DialogContent>
            </Dialog>
        </>
    );
}
