import { Stack, Typography } from "@mui/material";

import { useAuth } from "../auth/AuthContext";
import { LoanTransactionsReport } from "../components/LoanTransactionsReport";

// Standalone loan-ledger report. The Cash Transactions Report reads the member
// statement ledger, which holds no loan movements at all, so these two reports
// cover two separate ledgers and neither duplicates the other.
export function LoanTransactionsPage() {
    const { selectedTenantId } = useAuth();
    return (
        <Stack spacing={2.5}>
            <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.16em", fontWeight: 700 }}>
                Loan Reports
            </Typography>
            <LoanTransactionsReport tenantId={selectedTenantId} />
        </Stack>
    );
}
