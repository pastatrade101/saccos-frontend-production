import { Stack, Typography } from "@mui/material";

import { useAuth } from "../auth/AuthContext";
import { CashTransactionsReport } from "../components/CashTransactionsReport";

// Standalone teller-facing transactions report (also embedded on Cash Desk).
export function CashTransactionsPage() {
    const { selectedTenantId } = useAuth();
    return (
        <Stack spacing={2.5}>
            <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.16em", fontWeight: 700 }}>
                Teller Reports
            </Typography>
            <CashTransactionsReport tenantId={selectedTenantId} />
        </Stack>
    );
}
