import { useEffect, useMemo, useState } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import { Alert, Box, Button, Collapse, IconButton, Paper, Stack, Typography } from "@mui/material";

const DISMISS_KEY = "saccos-pwa-install-dismissed";

function isStandaloneDisplayMode() {
    return typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;
}

export function PwaInstallPrompt() {
    const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(isStandaloneDisplayMode);
    const [dismissed, setDismissed] = useState(() => {
        if (typeof window === "undefined") {
            return false;
        }

        return window.sessionStorage.getItem(DISMISS_KEY) === "1";
    });

    useEffect(() => {
        const handleBeforeInstallPrompt = (event: Event) => {
            const installEvent = event as BeforeInstallPromptEvent;
            installEvent.preventDefault();

            if (window.sessionStorage.getItem(DISMISS_KEY) === "1") {
                return;
            }

            setPromptEvent(installEvent);
        };

        const handleInstalled = () => {
            window.sessionStorage.removeItem(DISMISS_KEY);
            setPromptEvent(null);
            setDismissed(false);
            setIsInstalled(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
        window.addEventListener("appinstalled", handleInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
            window.removeEventListener("appinstalled", handleInstalled);
        };
    }, []);

    const open = useMemo(() => !isInstalled && !dismissed && Boolean(promptEvent), [dismissed, isInstalled, promptEvent]);

    if (!open) {
        return null;
    }

    const dismissPrompt = () => {
        window.sessionStorage.setItem(DISMISS_KEY, "1");
        setDismissed(true);
    };

    const handleInstall = async () => {
        if (!promptEvent) {
            return;
        }

        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;

        setPromptEvent(null);

        if (choice.outcome !== "accepted") {
            dismissPrompt();
        }
    };

    return (
        <Collapse in={open}>
            <Paper
                elevation={0}
                sx={{
                    position: "fixed",
                    right: 20,
                    bottom: 20,
                    zIndex: 1600,
                    width: "min(420px, calc(100vw - 24px))",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "rgba(10, 5, 115, 0.14)",
                    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.12)",
                    overflow: "hidden"
                }}
            >
                <Box
                    sx={{
                        px: 2.25,
                        py: 1.5,
                        background: "linear-gradient(135deg, rgba(10,5,115,0.96), rgba(31,168,230,0.96))",
                        color: "#fff"
                    }}
                >
                    <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={1.25} alignItems="center">
                            <DownloadRoundedIcon fontSize="small" />
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                Install SMART SACCOS
                            </Typography>
                        </Stack>
                        <IconButton size="small" onClick={dismissPrompt} sx={{ color: "#fff" }} aria-label="Dismiss install prompt">
                            <CloseRoundedIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                </Box>
                <Stack spacing={1.5} sx={{ px: 2.25, py: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Install the app for faster launch, home screen access, and a cleaner full-screen workspace.
                    </Typography>
                    <Alert
                        icon={<WifiOffRoundedIcon fontSize="inherit" />}
                        severity="info"
                        sx={{
                            alignItems: "center",
                            borderRadius: 1.5
                        }}
                    >
                        Offline mode is limited to the app shell. Member balances, approvals, and payments still require a live connection.
                    </Alert>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} justifyContent="flex-end">
                        <Button variant="text" color="inherit" onClick={dismissPrompt}>
                            Not now
                        </Button>
                        <Button variant="contained" onClick={() => void handleInstall()} startIcon={<DownloadRoundedIcon />} sx={{ borderRadius: 1.5 }}>
                            Install app
                        </Button>
                    </Stack>
                </Stack>
            </Paper>
        </Collapse>
    );
}
