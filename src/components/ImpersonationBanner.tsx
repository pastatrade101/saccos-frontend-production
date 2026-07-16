import { Box, Button, Stack, Typography } from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

export function ImpersonationBanner() {
    const { impersonatedMember, stopImpersonation } = useAuth();
    const navigate = useNavigate();
    const [returning, setReturning] = useState(false);

    if (!impersonatedMember) {
        return null;
    }

    const handleReturn = async () => {
        setReturning(true);
        try {
            await stopImpersonation();
            navigate("/members");
        } finally {
            setReturning(false);
        }
    };

    return (
        <Box
            sx={{
                position: "sticky",
                top: 0,
                zIndex: (theme) => theme.zIndex.appBar + 2,
                bgcolor: "#7b1fa2",
                color: "#fff",
                px: 2,
                py: 1
            }}
        >
            <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                justifyContent="center"
                flexWrap="wrap"
                useFlexGap
            >
                <VisibilityRoundedIcon fontSize="small" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    You are viewing as {impersonatedMember.full_name}
                    {impersonatedMember.member_no ? ` (${impersonatedMember.member_no})` : ""} — read and act with care.
                </Typography>
                <Button
                    size="small"
                    variant="contained"
                    color="inherit"
                    startIcon={<LogoutRoundedIcon />}
                    onClick={() => void handleReturn()}
                    disabled={returning}
                    sx={{ color: "#7b1fa2", bgcolor: "#fff", "&:hover": { bgcolor: "#f3e5f5" } }}
                >
                    {returning ? "Returning..." : "Return to admin"}
                </Button>
            </Stack>
        </Box>
    );
}
