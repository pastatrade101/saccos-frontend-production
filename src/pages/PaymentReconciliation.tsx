import { Stack, Typography } from "@mui/material";

import { UcgReferencesTable } from "../components/member-overview/UcgReferencesTable";

// Reconciliation is its own job, not a footnote under the payment register:
// it is the one place that answers "the bank took this money, where is it?",
// and the list it produces is handed to the bank.
export function PaymentReconciliationPage() {
    return (
        <Stack spacing={2.5}>
            <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.16em", fontWeight: 700 }}>
                Payment Reconciliation
            </Typography>
            <UcgReferencesTable />
        </Stack>
    );
}
