import {
    Box,
    Chip,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import type { LoanScheduleProjection } from "../../utils/loanSchedule";
import { formatCurrency } from "../../utils/format";

interface LoanSchedulePreviewProps {
    projection: LoanScheduleProjection;
    interestMethod: "flat" | "reducing_balance";
    compact?: boolean;
}

function formatDate(value: Date) {
    return value.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function LoanSchedulePreview({ projection, interestMethod, compact = false }: LoanSchedulePreviewProps) {
    const theme = useTheme();
    const { rows, monthlyInstalment, totalInterest, totalRepayable } = projection;
    const lastDue = rows.length ? rows[rows.length - 1].dueDate : null;

    const summary = [
        {
            label: interestMethod === "reducing_balance" ? "First instalment" : "Monthly instalment",
            value: formatCurrency(monthlyInstalment)
        },
        { label: "Total interest", value: formatCurrency(totalInterest) },
        { label: "Total repayable", value: formatCurrency(totalRepayable) },
        { label: "Final due date", value: lastDue ? formatDate(lastDue) : "—" }
    ];

    return (
        <Paper
            variant="outlined"
            sx={{
                p: { xs: 1.5, md: 2 },
                borderRadius: 1.25,
                borderColor: alpha(theme.palette.primary.main, 0.25),
                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.1 : 0.03)
            }}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Repayment schedule preview</Typography>
                <Chip
                    size="small"
                    label={interestMethod === "reducing_balance" ? "Reducing balance" : "Flat rate"}
                    sx={{ fontWeight: 700 }}
                />
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                Estimated from the loan product terms. Exact figures are confirmed at disbursement.
            </Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap: 1, mb: 1.5 }}>
                {summary.map((item) => (
                    <Box key={item.label} sx={{ p: 1, borderRadius: 1, bgcolor: alpha(theme.palette.background.paper, 0.6) }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                            {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{item.value}</Typography>
                    </Box>
                ))}
            </Box>

            {!compact ? (
                <TableContainer sx={{ maxHeight: 260 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Due date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Principal</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Interest</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Total</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Balance</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row) => (
                                <TableRow key={row.installment}>
                                    <TableCell>{row.installment}</TableCell>
                                    <TableCell>{formatDate(row.dueDate)}</TableCell>
                                    <TableCell align="right">{formatCurrency(row.principalDue)}</TableCell>
                                    <TableCell align="right">{formatCurrency(row.interestDue)}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(row.totalDue)}</TableCell>
                                    <TableCell align="right">{formatCurrency(row.balance)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : null}
        </Paper>
    );
}
