import { MotionCard, MotionModal } from "../ui/motion";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import CallMadeRoundedIcon from "@mui/icons-material/CallMadeRounded";
import CallReceivedRoundedIcon from "@mui/icons-material/CallReceivedRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import WalletRoundedIcon from "@mui/icons-material/WalletRounded";
import {
    Alert,
    Box,
    Button,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    InputAdornment,
    InputLabel,
    MenuItem,
    Pagination,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "../auth/AuthContext";
import { AppLoader } from "../components/AppLoader";
import { ConfirmModal } from "../components/ConfirmModal";
import { CashTransactionsReport } from "../components/CashTransactionsReport";
import { DataTable, type Column } from "../components/DataTable";
import { SearchableSelect } from "../components/SearchableSelect";
import { useToast } from "../components/Toast";
import { api, getApiErrorMessage } from "../lib/api";
import {
    endpoints,
    type CashRequest,
    type CashResponse,
    type CloseTellerSessionRequest,
    type DailyCashSummaryResponse,
    type ExpenseAccountsResponse,
    type ExpensePaymentRequest,
    type FeeRulesResponse,
    type LoanRepaymentRequest,
    type LoansResponse,
    type MemberAccountsResponse,
    type MembersResponse,
    type OpenTellerSessionRequest,
    type OperationalBatchRequest,
    type OperationalBatchResponse,
    type OperationalBatchResult,
    type OperationalBatchRowRequest,
    type ReceiptInitResponse,
    type ReceiptPolicyResponse,
    type ShareContributionResponse,
    type StatementsResponse,
    type PendingApprovalPayload,
    type TellerSessionResponse
} from "../lib/endpoints";
import { supabase } from "../lib/supabase";
import type { ApiEnvelope, ChartOfAccountOption, DailyCashSummary, FeeRule, Loan, Member, MemberAccount, ReceiptPolicy, StatementRow, TellerSession, TellerPaymentTransactionType } from "../types/api";
import { formatCurrency, formatDate } from "../utils/format";

const depositKindSchema = z.enum(["savings_deposit", "loan_repayment", "membership_fee", "fee_revenue"]);
const uuidValue = z.string().uuid();

const actionSchema = z.object({
    deposit_kind: depositKindSchema.default("savings_deposit"),
    account_id: z.string().optional().or(z.literal("")),
    loan_id: z.string().optional().or(z.literal("")),
    // Matches the loan officer's Loan Repayment dialog. The counter had no such
    // control, so every teller posting silently used "auto" -- interest first --
    // and a member paying down principal could not be recorded as doing so.
    allocation: z.enum(["auto", "interest_only", "principal_only"]).default("auto"),
    member_id: z.string().optional().or(z.literal("")),
    fee_rule_code: z.string().max(80).optional().or(z.literal("")),
    amount: z.coerce.number().positive("Amount must be greater than zero."),
    reference: z.string().max(80).optional().or(z.literal("")),
    description: z.string().max(255).optional().or(z.literal("")),
    bank_reference: z.string().max(80).optional().or(z.literal("")),
    value_date: z.string().optional().or(z.literal(""))
}).superRefine((values, ctx) => {
    const kind = values.deposit_kind || "savings_deposit";
    if (kind === "savings_deposit" && !uuidValue.safeParse(values.account_id).success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["account_id"], message: "Select a member savings account." });
    }
    if (kind === "loan_repayment" && !uuidValue.safeParse(values.loan_id).success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["loan_id"], message: "Select the active loan being repaid." });
    }
    if (kind === "membership_fee" && !uuidValue.safeParse(values.member_id).success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["member_id"], message: "Select the member paying the membership fee." });
    }
    if (kind === "fee_revenue" && !values.fee_rule_code?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fee_rule_code"], message: "Select the revenue or fee rule." });
    }
});

type CashValues = z.infer<typeof actionSchema>;
type ActionType = "deposit" | "withdraw" | "share_contribution";
type DepositKind = z.infer<typeof depositKindSchema>;
type PendingAction = { type: ActionType; values: CashValues; receiptFile: File | null } | null;

const expenseSchema = z.object({
    expense_account_id: z.string().uuid("Select an expense account."),
    amount: z.coerce.number().positive("Amount must be greater than zero."),
    payee: z.string().max(160).optional().or(z.literal("")),
    reference: z.string().max(80).optional().or(z.literal("")),
    description: z.string().max(255).optional().or(z.literal("")),
    bank_reference: z.string().max(80).optional().or(z.literal("")),
    value_date: z.string().optional().or(z.literal(""))
});

type ExpenseValues = z.infer<typeof expenseSchema>;

// This SACCO runs a savings + dividend model (no separate share ledger), so the
// Share Capital teller action is hidden. Flip to true to re-enable it if shares
// are ever issued per the by-laws.
const SHARE_CAPITAL_ENABLED = false;

// The Quick Transaction Actions card duplicated the Cash Desk header buttons, so
// it's hidden — the header now carries Deposit / Withdrawal / Batch Posting. Flip
// to true to bring the card back.
const SHOW_QUICK_ACTIONS = false;

// Page through a list endpoint (limit is capped at 100 server-side) so the account
// dropdown and member lookup cover the whole member base, not just the first 100.
async function loadAllPaged<T>(fetchPage: (page: number) => Promise<{ rows: T[]; total?: number }>): Promise<T[]> {
    const out: T[] = [];
    let page = 1;
    while (page <= 30) {
        const { rows, total } = await fetchPage(page);
        out.push(...rows);
        if ((total && out.length >= total) || rows.length < 100) {
            break;
        }
        page += 1;
    }
    return out;
}

function loadAllCashAccounts(tenantId: string) {
    return loadAllPaged<MemberAccount>(async (page) => {
        const { data } = await api.get<MemberAccountsResponse & { pagination?: { total: number } }>(
            endpoints.members.accounts(),
            { params: { tenant_id: tenantId, page, limit: 100, include_total: false } }
        );
        return { rows: data.data || [], total: data.pagination?.total };
    });
}

function loadAllCashMembers(tenantId: string) {
    return loadAllPaged<Member>(async (page) => {
        const { data } = await api.get<MembersResponse & { pagination?: { total: number } }>(
            endpoints.members.list(),
            { params: { tenant_id: tenantId, page, limit: 100, fields: "lookup", include_total: false } }
        );
        return { rows: data.data || [], total: data.pagination?.total };
    });
}

function loadAllCashLoans(tenantId: string, branchId?: string | null) {
    return loadAllPaged<Loan>(async (page) => {
        const { data } = await api.get<LoansResponse & { pagination?: { total: number } }>(
            endpoints.finance.loanPortfolio(),
            { params: { tenant_id: tenantId, ...(branchId ? { branch_id: branchId } : {}), page, limit: 100 } }
        );
        return { rows: data.data || [], total: data.pagination?.total };
    });
}

function loadAllCashFeeRules() {
    return loadAllPaged<FeeRule>(async (page) => {
        const { data } = await api.get<FeeRulesResponse & { pagination?: { total: number } }>(
            endpoints.products.fees(),
            { params: { page, limit: 100 } }
        );
        return { rows: data.data || [], total: data.pagination?.total };
    });
}

function loadAllExpenseAccounts(tenantId: string) {
    return loadAllPaged<ChartOfAccountOption>(async (page) => {
        const { data } = await api.get<ExpenseAccountsResponse & { pagination?: { total: number } }>(
            endpoints.finance.expenseAccounts(),
            { params: { tenant_id: tenantId, page, limit: 100 } }
        );
        return { rows: data.data || [], total: data.pagination?.total };
    });
}

function formatWholeMoneyInput(value: string) {
    const digits = value.replace(/[^\d]/g, "");
    if (!digits) {
        return "";
    }

    return new Intl.NumberFormat("en-TZ").format(Number(digits));
}

function generateCashReference(type: ActionType) {
    const prefix = type === "deposit" ? "DEP" : type === "withdraw" ? "WDL" : "SHR";
    const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${stamp}-${suffix}`;
}

function getDepositKindReferencePrefix(kind: DepositKind) {
    if (kind === "loan_repayment") return "LRP";
    if (kind === "membership_fee" || kind === "fee_revenue") return "FEE";
    return "DEP";
}

function generateDepositReference(kind: DepositKind) {
    const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${getDepositKindReferencePrefix(kind)}-${stamp}-${suffix}`;
}

function generateExpenseReference() {
    const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `EXP-${stamp}-${suffix}`;
}

function getActionReceiptType(action: PendingAction): TellerPaymentTransactionType | null {
    if (!action) return null;
    if (action.type === "withdraw") return "withdraw";
    if (action.type === "share_contribution") return "share_contribution";
    if (action.values.deposit_kind === "loan_repayment") return "loan_repay";
    if (action.values.deposit_kind === "membership_fee" || action.values.deposit_kind === "fee_revenue") return "fee_revenue";
    return "deposit";
}

const operationalBatchTemplate = [
    "operation,member_no,email,account_id,loan_number,loan_id,fee_rule_code,amount,reference,receipt_ids,description",
    "savings_deposit,ILS24-F00001,,,,,,100000,,,Monthly savings contribution",
    "share_contribution,ILS24-F00001,,,,,,1000000,,,Share capital contribution",
    "fee_revenue,ILS24-F00001,,,,,LOAN_PROCESSING_FEE,15000,,,Loan application fee",
    "loan_repayment,ILS24-F00001,,,LN-20260603-ABC12345,,,500000,,,Loan repayment"
].join("\n");

function parseCsvRows(text: string) {
    const rows: string[][] = [];
    let current = "";
    let row: string[] = [];
    let quoted = false;

    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        const next = text[index + 1];

        if (char === "\"") {
            if (quoted && next === "\"") {
                current += "\"";
                index += 1;
            } else {
                quoted = !quoted;
            }
            continue;
        }

        if (char === "," && !quoted) {
            row.push(current);
            current = "";
            continue;
        }

        if ((char === "\n" || char === "\r") && !quoted) {
            if (char === "\r" && next === "\n") {
                index += 1;
            }
            row.push(current);
            if (row.some((cell) => cell.trim())) {
                rows.push(row);
            }
            row = [];
            current = "";
            continue;
        }

        current += char;
    }

    row.push(current);
    if (row.some((cell) => cell.trim())) {
        rows.push(row);
    }

    return rows;
}

function parseOperationalBatchCsv(text: string): OperationalBatchRowRequest[] {
    const rows = parseCsvRows(text);
    if (rows.length < 2) {
        return [];
    }

    const headers = rows[0].map((header) => header.trim().toLowerCase());
    const allowedOperations = new Set(["savings_deposit", "share_contribution", "loan_repayment", "fee_revenue"]);

    return rows.slice(1).map((cells) => {
        const record: Record<string, string> = {};
        headers.forEach((header, index) => {
            record[header] = (cells[index] || "").trim();
        });

        const operation = record.operation as OperationalBatchRowRequest["operation"];
        const amountText = record.amount?.replace(/[,\s]/g, "") || "";
        const amount = amountText ? Number(amountText) : undefined;
        if (!allowedOperations.has(operation)) {
            throw new Error(`Unsupported operation "${record.operation}".`);
        }
        if (amountText && Number.isNaN(amount)) {
            throw new Error(`Invalid amount "${record.amount}".`);
        }

        return {
            operation,
            member_no: record.member_no || undefined,
            email: record.email || undefined,
            account_id: record.account_id || undefined,
            loan_number: record.loan_number || undefined,
            loan_id: record.loan_id || undefined,
            fee_rule_code: record.fee_rule_code || undefined,
            amount,
            reference: record.reference || undefined,
            receipt_ids: record.receipt_ids
                ? record.receipt_ids.split(/[|;]/).map((entry) => entry.trim()).filter(Boolean)
                : undefined,
            description: record.description || undefined
        };
    });
}

function downloadOperationalBatchTemplate() {
    const blob = new Blob([operationalBatchTemplate], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "cash-operational-batch-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
}

function MetricCard({
    title,
    value,
    helper,
    icon,
    tone = "neutral"
}: {
    title: string;
    value: string;
    helper: string;
    icon: React.ReactNode;
    tone?: "neutral" | "positive" | "warning" | "negative";
}) {
    const theme = useTheme();
    const neutralAccent = theme.palette.mode === "dark" ? "#D9B273" : theme.palette.primary.main;
    const toneStyles = tone === "positive"
        ? { main: theme.palette.success.main, soft: alpha(theme.palette.success.main, 0.14), border: alpha(theme.palette.success.main, 0.24) }
        : tone === "warning"
            ? { main: theme.palette.warning.main, soft: alpha(theme.palette.warning.main, 0.14), border: alpha(theme.palette.warning.main, 0.24) }
            : tone === "negative"
                ? { main: theme.palette.error.main, soft: alpha(theme.palette.error.main, 0.14), border: alpha(theme.palette.error.main, 0.24) }
                : { main: neutralAccent, soft: alpha(neutralAccent, 0.12), border: alpha(neutralAccent, 0.24) };

    return (
        <MotionCard
            variant="outlined"
            sx={{
                height: "100%",
                borderRadius: 2,
                borderColor: toneStyles.border,
                background: `linear-gradient(180deg, ${toneStyles.soft}, ${theme.palette.background.paper})`
            }}
        >
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                    <Box>
                        <Typography variant="overline" color="text.secondary">
                            {title}
                        </Typography>
                        <Typography variant="h5" sx={{ mt: 0.5 }}>
                            {value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                            {helper}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: toneStyles.soft,
                            color: toneStyles.main
                        }}
                    >
                        {icon}
                    </Box>
                </Stack>
            </CardContent>
        </MotionCard>
    );
}

export function CashPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { pushToast } = useToast();
    const { selectedTenantId, selectedTenantName, selectedBranchId, selectedBranchName, profile } = useAuth();
    // Tellers may also set the transaction date at capture time (keying off a
    // bank statement); the backend enforces the same 7-day window for them.
    const canBackdate = ["branch_manager", "super_admin", "teller"].includes(profile?.role || "");
    const backdateMinDate = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const todayDate = new Date().toISOString().slice(0, 10);
    const [members, setMembers] = useState<Member[]>([]);
    const [accounts, setAccounts] = useState<MemberAccount[]>([]);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [feeRules, setFeeRules] = useState<FeeRule[]>([]);
    const [expenseAccounts, setExpenseAccounts] = useState<ChartOfAccountOption[]>([]);
    const amountInputRef = useRef<HTMLInputElement | null>(null);
    const expenseAmountInputRef = useRef<HTMLInputElement | null>(null);
    const [transactions, setTransactions] = useState<StatementRow[]>([]);
    const [currentSession, setCurrentSession] = useState<TellerSession | null>(null);
    const [receiptPolicy, setReceiptPolicy] = useState<ReceiptPolicy | null>(null);
    const [dailySummary, setDailySummary] = useState<DailyCashSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [actionDialog, setActionDialog] = useState<ActionType | null>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [openingSession, setOpeningSession] = useState(false);
    const [openingCashInput, setOpeningCashInput] = useState("");
    const [closingSession, setClosingSession] = useState(false);
    const [closingCashInput, setClosingCashInput] = useState("");
    const [openSessionDialog, setOpenSessionDialog] = useState(false);
    const [closeSessionDialog, setCloseSessionDialog] = useState(false);
    const [batchDialogOpen, setBatchDialogOpen] = useState(false);
    const [batchPosting, setBatchPosting] = useState(false);
    const [batchFileName, setBatchFileName] = useState("");
    const [batchRows, setBatchRows] = useState<OperationalBatchRowRequest[]>([]);
    const [batchResult, setBatchResult] = useState<OperationalBatchResult | null>(null);
    const [batchParseError, setBatchParseError] = useState<string | null>(null);
    const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
    const [expenseReceiptFile, setExpenseReceiptFile] = useState<File | null>(null);
    const [pendingExpense, setPendingExpense] = useState<ExpenseValues | null>(null);
    const [expenseAmountInput, setExpenseAmountInput] = useState("");
    // Collect Membership Fee: approved applicants awaiting the joining fee. The
    // backend posts the fee to this teller's session and activates the member once
    // the fee is fully paid (collectFeeRevenue + applyMembershipFeePayment).
    const [feeDialogOpen, setFeeDialogOpen] = useState(false);
    const [pendingFeeMembers, setPendingFeeMembers] = useState<Member[]>([]);
    const [loadingPendingFeeMembers, setLoadingPendingFeeMembers] = useState(false);
    const [feeMemberId, setFeeMemberId] = useState("");
    const [feeAmount, setFeeAmount] = useState("");
    const [feeReference, setFeeReference] = useState("");
    const [collectingFee, setCollectingFee] = useState(false);
    const [feeConfirmOpen, setFeeConfirmOpen] = useState(false);
    const [pendingApprovalNotice, setPendingApprovalNotice] = useState<{
        requestId: string;
        payload: CashRequest;
    } | null>(null);
    const [depositAmountInput, setDepositAmountInput] = useState("");
    const [withdrawAmountInput, setWithdrawAmountInput] = useState("");
    const [shareAmountInput, setShareAmountInput] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;


    const defaultAccountId = localStorage.getItem("saccos:selectedAccountId") || "";

    const depositForm = useForm<CashValues>({
        resolver: zodResolver(actionSchema),
        defaultValues: {
            deposit_kind: "savings_deposit",
            account_id: defaultAccountId,
            loan_id: "",
            allocation: "auto",
            member_id: "",
            fee_rule_code: "",
            amount: 0,
            reference: "",
            description: "", bank_reference: ""
        }
    });

    const withdrawForm = useForm<CashValues>({
        resolver: zodResolver(actionSchema),
        defaultValues: {
            deposit_kind: "savings_deposit",
            account_id: defaultAccountId,
            loan_id: "",
            allocation: "auto",
            member_id: "",
            fee_rule_code: "",
            amount: 0,
            reference: "",
            description: "", bank_reference: ""
        }
    });

    const shareForm = useForm<CashValues>({
        resolver: zodResolver(actionSchema),
        defaultValues: {
            deposit_kind: "savings_deposit",
            account_id: "",
            loan_id: "",
            member_id: "",
            fee_rule_code: "",
            amount: 0,
            reference: "",
            description: "", bank_reference: ""
        }
    });

    const expenseForm = useForm<ExpenseValues>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            expense_account_id: "",
            amount: 0,
            payee: "",
            reference: "",
            description: "", bank_reference: "",
            value_date: ""
        }
    });

    const openSessionForm = useForm<OpenTellerSessionRequest>({
        defaultValues: {
            branch_id: selectedBranchId || "",
            opening_cash: 0,
            notes: ""
        }
    });

    const closeSessionForm = useForm<CloseTellerSessionRequest>({
        defaultValues: {
            closing_cash: 0,
            notes: ""
        }
    });
    const depositKind = depositForm.watch("deposit_kind") || "savings_deposit";

    const loadCashData = async () => {
        if (!selectedTenantId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const [
                membersList,
                statementsResponse,
                accountsList,
                loansList,
                feeRulesList,
                expenseAccountsList,
                { data: currentSessionResponse },
                { data: receiptPolicyResponse },
                { data: dailySummaryResponse }
            ] = await Promise.all([
                loadAllCashMembers(selectedTenantId),
                api.get<StatementsResponse>(endpoints.finance.statements(), {
                    params: { tenant_id: selectedTenantId, page: 1, limit: 100 }
                }),
                loadAllCashAccounts(selectedTenantId),
                loadAllCashLoans(selectedTenantId, selectedBranchId),
                loadAllCashFeeRules(),
                loadAllExpenseAccounts(selectedTenantId),
                api.get<TellerSessionResponse>(endpoints.cashControl.currentSession(), {
                    params: selectedBranchId ? { branch_id: selectedBranchId } : {}
                }),
                api.get<ReceiptPolicyResponse>(endpoints.cashControl.receiptPolicy(), {
                    params: selectedBranchId ? { branch_id: selectedBranchId } : {}
                }),
                api.get<DailyCashSummaryResponse>(endpoints.cashControl.dailySummary(), {
                    params: selectedBranchId ? { branch_id: selectedBranchId, page: 1, limit: 100 } : { page: 1, limit: 100 }
                })
            ]);

            setMembers(membersList);
            setTransactions((statementsResponse.data.data || []).slice(0, 40));
            setAccounts(accountsList);
            setLoans(loansList);
            setFeeRules(feeRulesList);
            setExpenseAccounts(expenseAccountsList);
            setCurrentSession(currentSessionResponse.data || null);
            setReceiptPolicy(receiptPolicyResponse.data || null);
            setDailySummary(dailySummaryResponse.data || []);
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to load cash desk",
                message: getApiErrorMessage(error)
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadCashData();
    }, [selectedTenantId, selectedBranchId]);

    useEffect(() => {
        openSessionForm.setValue("branch_id", selectedBranchId || "");
    }, [selectedBranchId]);

    // Load approved-pending-payment members when the fee dialog opens so the teller
    // can pick who is paying their joining fee.
    useEffect(() => {
        const needsMembershipMemberList = feeDialogOpen || (actionDialog === "deposit" && depositKind === "membership_fee");
        if (!needsMembershipMemberList || !selectedTenantId) {
            return;
        }
        let isActive = true;
        setLoadingPendingFeeMembers(true);
        api.get<MembersResponse>(endpoints.members.list(), {
            params: {
                tenant_id: selectedTenantId,
                status: "approved_pending_payment",
                page: 1,
                limit: 100,
                fields: "lookup",
                include_total: false
            }
        })
            .then(({ data }) => {
                if (isActive) {
                    setPendingFeeMembers(data.data || []);
                }
            })
            .catch(() => {
                if (isActive) {
                    setPendingFeeMembers([]);
                }
            })
            .finally(() => {
                if (isActive) {
                    setLoadingPendingFeeMembers(false);
                }
            });
        return () => {
            isActive = false;
        };
    }, [actionDialog, depositKind, feeDialogOpen, selectedTenantId]);

    const collectMembershipFee = async () => {
        if (!selectedTenantId || !feeMemberId) {
            return;
        }
        const trimmedAmount = feeAmount.trim();
        const amountValue = trimmedAmount === "" ? undefined : Number(trimmedAmount);
        if (amountValue !== undefined && (!Number.isFinite(amountValue) || amountValue <= 0)) {
            pushToast({
                type: "error",
                title: "Invalid amount",
                message: "Enter an amount greater than zero, or leave blank to charge the configured membership fee."
            });
            return;
        }

        setCollectingFee(true);
        try {
            await api.post(endpoints.finance.feeRevenue(), {
                tenant_id: selectedTenantId,
                member_id: feeMemberId,
                fee_rule_code: "MEMBERSHIP_FEE",
                ...(amountValue !== undefined ? { amount: amountValue } : {}),
                ...(feeReference.trim() ? { reference: feeReference.trim() } : {})
            });
            pushToast({
                type: "success",
                title: "Membership fee collected",
                message: "The fee was posted to your teller session. The member activates once the fee is fully paid."
            });
            setFeeDialogOpen(false);
            setFeeMemberId("");
            setFeeAmount("");
            setFeeReference("");
            await loadCashData();
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to collect membership fee",
                message: getApiErrorMessage(error)
            });
        } finally {
            setCollectingFee(false);
        }
    };

    const accountOptions = useMemo(
        () =>
            accounts.map((account) => {
                const member = members.find((entry) => entry.id === account.member_id);
                const phone = member?.phone ? ` • ${member.phone}` : "";

                return {
                    value: account.id,
                    // Member name first — tellers search by name/phone, not account number.
                    // Phone is in the secondary so it's both visible and searchable.
                    label: `${member?.full_name || "Unknown member"} — ${account.account_number}`,
                    secondary: `${account.product_type} • ${formatCurrency(account.available_balance)}${phone}`
                };
            }),
        [accounts, members]
    );

    const savingsAccountOptions = useMemo(
        () => accountOptions.filter((option) => option.secondary.toLowerCase().includes("savings")),
        [accountOptions]
    );
    const shareAccountOptions = useMemo(
        () => accountOptions.filter((option) => option.secondary.toLowerCase().includes("shares")),
        [accountOptions]
    );
    const loanRepaymentOptions = useMemo(
        () =>
            loans
                .filter((loan) => ["active", "in_arrears"].includes(loan.status))
                .map((loan) => {
                    const member = members.find((entry) => entry.id === loan.member_id);
                    return {
                        value: loan.id,
                        label: `${member?.full_name || "Unknown member"} — ${loan.loan_number}`,
                        secondary: `${loan.status.replace(/_/g, " ")} • outstanding ${formatCurrency(Number(loan.outstanding_principal || 0) + Number(loan.accrued_interest || 0))}`
                    };
                }),
        [loans, members]
    );
    const membershipMemberOptions = useMemo(() => {
        const rows = [...pendingFeeMembers, ...members];
        const uniqueRows = Array.from(new Map(rows.map((member) => [member.id, member])).values());
        return uniqueRows.map((member) => ({
            value: member.id,
            label: `${member.full_name}${member.member_no ? ` — ${member.member_no}` : ""}`,
            secondary: `${member.status.replace(/_/g, " ")}${member.phone ? ` • ${member.phone}` : ""}`
        }));
    }, [members, pendingFeeMembers]);
    const feeRuleOptions = useMemo(
        () =>
            feeRules
                .filter((rule) => rule.is_active && rule.fee_type !== "membership_fee")
                .map((rule) => ({
                    value: rule.code,
                    label: `${rule.name} — ${rule.code}`,
                    secondary: `${rule.fee_type.replace(/_/g, " ")} • ${rule.calculation_method === "flat" ? formatCurrency(rule.flat_amount) : `${rule.percentage_value}%`}`
                })),
        [feeRules]
    );
    const expenseAccountOptions = useMemo(
        () =>
            expenseAccounts.map((account) => ({
                value: account.id,
                label: `${account.account_name} — ${account.account_code}`,
                secondary: "Expense account"
            })),
        [expenseAccounts]
    );

    const todaySummary = dailySummary[0] || null;
    const latestBusinessDate = useMemo(() => {
        if (!transactions.length) {
            return null;
        }

        return [...new Set(transactions.map((entry) => entry.transaction_date))]
            .filter(Boolean)
            .sort((left, right) => left.localeCompare(right))
            .slice(-1)[0] || null;
    }, [transactions]);
    const deskBusinessDate = todaySummary?.business_date || latestBusinessDate;
    const deskTransactions = useMemo(
        () =>
            deskBusinessDate
                ? transactions.filter((entry) => entry.transaction_date === deskBusinessDate)
                : transactions,
        [deskBusinessDate, transactions]
    );
    const todayDepositTotal = useMemo(
        () => deskTransactions
            .filter((entry) => entry.transaction_type === "deposit")
            .reduce((sum, entry) => sum + entry.amount, 0),
        [deskTransactions]
    );
    const todayWithdrawalTotal = useMemo(
        () => deskTransactions
            .filter((entry) => entry.transaction_type === "withdrawal")
            .reduce((sum, entry) => sum + entry.amount, 0),
        [deskTransactions]
    );
    const visibleMembersWithActivity = useMemo(() => new Set(deskTransactions.map((item) => item.member_id)).size, [deskTransactions]);
    const deskDepositTotal = todaySummary?.deposits_total ?? todayDepositTotal;
    const deskWithdrawalTotal = todaySummary?.withdrawals_total ?? todayWithdrawalTotal;
    const deskNetMovement = todaySummary?.net_movement ?? (deskDepositTotal - deskWithdrawalTotal);
    const deskExpectedCash = todaySummary?.expected_cash_total ?? currentSession?.expected_cash ?? 0;
    const countedOpeningCash = Number(openSessionForm.watch("opening_cash") || 0);
    const countedClosingCash = Number(closeSessionForm.watch("closing_cash") || 0);
    const closingVariance = countedClosingCash - deskExpectedCash;
    const closingVarianceStatus = closingVariance === 0 ? "balanced" : closingVariance > 0 ? "over" : "short";

    useEffect(() => {
        if (!openSessionDialog) {
            return;
        }

        openSessionForm.reset({
            branch_id: selectedBranchId || "",
            opening_cash: 0,
            notes: ""
        });
        setOpeningCashInput(formatWholeMoneyInput("0"));
    }, [openSessionDialog, openSessionForm, selectedBranchId]);

    useEffect(() => {
        if (!closeSessionDialog) {
            return;
        }

        closeSessionForm.reset({
            closing_cash: Number(deskExpectedCash || 0),
            notes: ""
        });
        setClosingCashInput(formatWholeMoneyInput(String(Math.round(Number(deskExpectedCash || 0)))));
    }, [closeSessionDialog, closeSessionForm, deskExpectedCash]);
    const highValueThreshold = Math.max(receiptPolicy?.required_threshold || 0, 250000);
    const highValueTransactions = useMemo(
        () => deskTransactions.filter((entry) => entry.amount >= highValueThreshold).length,
        [deskTransactions, highValueThreshold]
    );
    const receiptThresholdText = receiptPolicy ? formatCurrency(receiptPolicy.required_threshold) : "TSh 0";
    const tellerSessionRequired = Boolean(receiptPolicy) && !currentSession;
    const pendingActionReceiptType = getActionReceiptType(pendingAction);
    const expenseReceiptRequired = Boolean(
        receiptPolicy?.receipt_required
        && receiptPolicy.enforce_on_types.includes("expense_payment")
        && Number(expenseForm.watch("amount") || 0) >= receiptPolicy.required_threshold
    );
    const cashDeskAccent = theme.palette.mode === "dark" ? "#D9B273" : theme.palette.primary.main;
    const cashDeskAccentStrong = theme.palette.mode === "dark" ? "#C89B52" : theme.palette.primary.dark;
    const receiptNeededForPendingAction = Boolean(
        pendingAction
        && receiptPolicy?.receipt_required
        && pendingActionReceiptType
        && receiptPolicy.enforce_on_types.includes(pendingActionReceiptType)
        && pendingAction.values.amount >= receiptPolicy.required_threshold
    );

    const transactionColumns: Column<StatementRow>[] = [
        { key: "date", header: "Date", render: (row) => formatDate(row.transaction_date) },
        { key: "member", header: "Member", render: (row) => row.member_name },
        { key: "type", header: "Type", render: (row) => row.transaction_type.replace(/_/g, " ") },
        {
            key: "amount",
            header: "Amount",
            render: (row) => (
                <Typography
                    component="span"
                    variant="body2"
                    sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color: row.direction === "out" ? "error.main" : "success.main" }}
                >
                    {row.direction === "out" ? "−" : "+"}{formatCurrency(row.amount)}
                </Typography>
            )
        },
        { key: "balance", header: "Balance", render: (row) => formatCurrency(row.running_balance) },
        { key: "reference", header: "Reference", render: (row) => row.reference || "N/A" }
    ];
    const batchResultColumns: Column<OperationalBatchResult["rows"][number]>[] = [
        { key: "row", header: "Row", render: (row) => row.row_number },
        { key: "operation", header: "Operation", render: (row) => row.operation?.replace(/_/g, " ") || "N/A" },
        {
            key: "status",
            header: "Status",
            render: (row) => (
                <Chip
                    label={row.status}
                    color={row.status === "posted" ? "success" : "error"}
                    size="small"
                    variant="outlined"
                />
            )
        },
        { key: "amount", header: "Amount", render: (row) => formatCurrency(row.amount) },
        { key: "reference", header: "Reference", render: (row) => row.reference || "N/A" },
        { key: "message", header: "Message", render: (row) => row.message }
    ];

    const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize));
    const paginatedTransactions = useMemo(
        () => transactions.slice((page - 1) * pageSize, page * pageSize),
        [page, transactions]
    );

    const handleSubmit = (type: ActionType, values: CashValues) => {
        // Enforce the receipt rule inline, then open the confirmation window so the
        // teller reviews the member and the amount before real money posts.
        const receiptTransactionType = getActionReceiptType({ type, values, receiptFile });
        const needsReceipt = Boolean(
            receiptPolicy?.receipt_required
            && receiptTransactionType
            && receiptPolicy.enforce_on_types.includes(receiptTransactionType)
            && values.amount >= receiptPolicy.required_threshold
        );
        if (needsReceipt && !receiptFile) {
            pushToast({
                type: "error",
                title: "Receipt required",
                message: "Attach the receipt proof before posting this transaction."
            });
            return;
        }
        setPendingAction({ type, values, receiptFile });
    };

    const uploadReceiptFile = async ({
        file,
        branchId,
        memberId,
        transactionType
    }: {
        file: File | null;
        branchId: string;
        memberId?: string | null;
        transactionType: TellerPaymentTransactionType;
    }) => {
        if (!file) {
            return [];
        }

        const { data: initResponse } = await api.post<ReceiptInitResponse>(endpoints.cashControl.initReceipt(), {
            branch_id: branchId,
            member_id: memberId || null,
            transaction_type: transactionType,
            file_name: file.name,
            mime_type: file.type || "application/octet-stream",
            file_size_bytes: file.size
        });

        const { receipt, upload } = initResponse.data;
        const { error: uploadError } = await supabase.storage
            .from(receipt.storage_bucket)
            .uploadToSignedUrl(upload.path, upload.token, file);

        if (uploadError) {
            throw uploadError;
        }

        await api.post(endpoints.cashControl.confirmReceipt(receipt.id), {});
        return [receipt.id];
    };

    const uploadReceiptForAction = async (action: PendingAction, branchId: string, memberId?: string | null) => {
        if (!action?.receiptFile) {
            return [];
        }

        return uploadReceiptFile({
            file: action.receiptFile,
            branchId,
            memberId,
            transactionType: getActionReceiptType(action) || "deposit"
        });
    };

    const openSession = openSessionForm.handleSubmit(async (values) => {
        setOpeningSession(true);
        try {
            await api.post<TellerSessionResponse>(endpoints.cashControl.openSession(), values);
            pushToast({
                type: "success",
                title: "Teller session opened",
                message: "You can now post cash transactions for this desk."
            });
            setOpenSessionDialog(false);
            openSessionForm.reset({
                branch_id: selectedBranchId || "",
                opening_cash: 0,
                notes: ""
            });
            setOpeningCashInput(formatWholeMoneyInput("0"));
            await loadCashData();
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to open teller session",
                message: getApiErrorMessage(error)
            });
        } finally {
            setOpeningSession(false);
        }
    });

    const closeSession = closeSessionForm.handleSubmit(async (values) => {
        if (!currentSession) {
            return;
        }

        setClosingSession(true);
        try {
            await api.post<TellerSessionResponse>(endpoints.cashControl.closeSession(currentSession.id), values);
            pushToast({
                type: "success",
                title: "Teller session closed",
                message: "The session is now pending review."
            });
            setCloseSessionDialog(false);
            await loadCashData();
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to close teller session",
                message: getApiErrorMessage(error)
            });
        } finally {
            setClosingSession(false);
        }
    });

    const confirmAction = async (actionInput?: PendingAction) => {
        const action = actionInput ?? pendingAction;
        if (!action) {
            return;
        }

        setProcessing(true);

        try {
            const kind = action.type === "deposit" ? action.values.deposit_kind || "savings_deposit" : "savings_deposit";
            let data: CashResponse | ShareContributionResponse | ApiEnvelope<PendingApprovalPayload>;
            let payload: CashRequest | null = null;
            let successTitle =
                action.type === "deposit"
                    ? "Deposit posted"
                    : action.type === "withdraw"
                        ? "Withdrawal posted"
                        : "Share contribution posted";

            if (action.type === "deposit" && kind === "loan_repayment") {
                const loan = loans.find((entry) => entry.id === action.values.loan_id);
                if (!loan) {
                    throw new Error("Select the active loan being repaid.");
                }
                const receiptIds = await uploadReceiptForAction(action, loan.branch_id, loan.member_id);
                const loanPayload: LoanRepaymentRequest = {
                    tenant_id: selectedTenantId || undefined,
                    loan_id: loan.id,
                    amount: action.values.amount,
                    allocation: action.values.allocation || "auto",
                    reference: action.values.reference || null,
                    description: action.values.description || "Counter loan repayment",
                    receipt_ids: receiptIds
                };
                const response = await api.post<CashResponse>(endpoints.finance.loanRepay(), loanPayload);
                data = response.data;
                successTitle = "Loan repayment posted";
            } else if (action.type === "deposit" && (kind === "membership_fee" || kind === "fee_revenue")) {
                const member = members.find((entry) => entry.id === action.values.member_id);
                const branchId = member?.branch_id || selectedBranchId || undefined;
                if (!branchId) {
                    throw new Error("Select a branch or member before posting SACCO revenue.");
                }
                const feeRuleCode = kind === "membership_fee"
                    ? "MEMBERSHIP_FEE"
                    : action.values.fee_rule_code?.trim().toUpperCase();
                if (!feeRuleCode) {
                    throw new Error("Select the revenue or fee rule.");
                }
                const receiptIds = await uploadReceiptForAction(action, branchId, member?.id || null);
                const response = await api.post<CashResponse>(endpoints.finance.feeRevenue(), {
                    tenant_id: selectedTenantId || undefined,
                    branch_id: branchId,
                    member_id: member?.id,
                    fee_rule_code: feeRuleCode,
                    amount: action.values.amount,
                    reference: action.values.reference || null,
                    description: action.values.description || (kind === "membership_fee" ? "Counter membership fee collection" : "Counter SACCO revenue collection"),
                    receipt_ids: receiptIds
                });
                data = response.data;
                successTitle = kind === "membership_fee" ? "Membership fee posted" : "SACCO revenue posted";
            } else {
                const account = accounts.find((entry) => entry.id === action.values.account_id);
                if (!account) {
                    throw new Error("Select the member account for this transaction.");
                }
                const member = members.find((entry) => entry.id === account.member_id);
                const receiptIds = await uploadReceiptForAction(action, account.branch_id, member?.id || null);

                payload = {
                    tenant_id: selectedTenantId || undefined,
                    account_id: account.id,
                    amount: action.values.amount,
                    reference: action.values.reference || null,
                    description: action.values.description || null,
                    bank_description: action.values.description || null,
                    bank_reference: action.values.bank_reference || null,
                    value_date: (canBackdate && action.values.value_date) ? action.values.value_date : undefined,
                    receipt_ids: receiptIds
                };

                const endpoint =
                    action.type === "deposit"
                        ? endpoints.finance.deposit()
                        : action.type === "withdraw"
                            ? endpoints.finance.withdraw()
                            : endpoints.finance.shareContribution();

                const response = await api.post<CashResponse | ShareContributionResponse | ApiEnvelope<PendingApprovalPayload>>(endpoint, payload);
                data = response.data;
            }

            const maybePending = data.data as Partial<PendingApprovalPayload>;
            if (action.type === "withdraw" && maybePending.approval_required && maybePending.approval_request_id && payload) {
                pushToast({
                    type: "success",
                    title: "Sent for approval",
                    message: `Withdrawal is waiting checker approval (${maybePending.approval_request_id.slice(0, 8)}...).`
                });
                setPendingApprovalNotice({
                    requestId: maybePending.approval_request_id,
                    payload
                });
            } else {
                const financeData = data.data as { journal_id?: string | null; message?: string | null };
                pushToast({
                    type: "success",
                    title: successTitle,
                    message: financeData.journal_id
                        ? `Journal ${financeData.journal_id} posted successfully.`
                        : financeData.message || "Transaction completed."
                });
            }

            setPendingAction(null);
            setActionDialog(null);
            setReceiptFile(null);
            const lastAccountId = payload?.account_id || defaultAccountId;
            depositForm.reset({ deposit_kind: "savings_deposit", account_id: lastAccountId, loan_id: "", member_id: "", fee_rule_code: "", amount: 0, reference: generateDepositReference("savings_deposit"), description: "", bank_reference: "", value_date: "" });
            withdrawForm.reset({ deposit_kind: "savings_deposit", account_id: lastAccountId, loan_id: "", member_id: "", fee_rule_code: "", amount: 0, reference: generateCashReference("withdraw"), description: "", bank_reference: "", value_date: "" });
            shareForm.reset({ deposit_kind: "savings_deposit", account_id: "", loan_id: "", member_id: "", fee_rule_code: "", amount: 0, reference: generateCashReference("share_contribution"), description: "", bank_reference: "", value_date: "" });
            setDepositAmountInput("");
            setWithdrawAmountInput("");
            setShareAmountInput("");
            await loadCashData();
        } catch (error) {
            pushToast({
                type: "error",
                title: "Cash transaction failed",
                message: getApiErrorMessage(error)
            });
        } finally {
            setProcessing(false);
        }
    };

    const executeApprovedWithdrawal = async () => {
        if (!pendingApprovalNotice) {
            return;
        }

        setProcessing(true);
        try {
            const payload: CashRequest = {
                ...pendingApprovalNotice.payload,
                approval_request_id: pendingApprovalNotice.requestId
            };
            const { data } = await api.post<CashResponse>(endpoints.finance.withdraw(), payload);
            pushToast({
                type: "success",
                title: "Withdrawal posted",
                message: data.data.journal_id
                    ? `Journal ${data.data.journal_id} posted successfully.`
                    : data.data.message || "Approved withdrawal executed."
            });
            setPendingApprovalNotice(null);
            await loadCashData();
        } catch (error) {
            pushToast({
                type: "error",
                title: "Execution not ready",
                message: getApiErrorMessage(error, "Approval may still be pending or was rejected.")
            });
        } finally {
            setProcessing(false);
        }
    };

    // Confirmation gate: validate the form, then show the confirm window so the
    // teller re-checks the payee and amount before cash leaves the drawer.
    const requestExpenseConfirm = expenseForm.handleSubmit((values) => {
        if (expenseReceiptRequired && !expenseReceiptFile) {
            pushToast({
                type: "error",
                title: "Receipt required",
                message: "Attach the expense receipt or voucher proof before posting this payment."
            });
            return;
        }
        setPendingExpense(values);
    });

    const postExpensePayment = expenseForm.handleSubmit(async (values) => {
        if (!selectedTenantId) {
            return;
        }
        if (expenseReceiptRequired && !expenseReceiptFile) {
            pushToast({
                type: "error",
                title: "Receipt required",
                message: "Attach the expense receipt or voucher proof before posting this payment."
            });
            return;
        }

        const branchId = selectedBranchId || currentSession?.branch_id || profile?.branch_id || "";
        if (!branchId) {
            pushToast({
                type: "error",
                title: "Branch required",
                message: "Select a branch or open a teller session before recording expenditure."
            });
            return;
        }

        setProcessing(true);
        try {
            const receiptIds = await uploadReceiptFile({
                file: expenseReceiptFile,
                branchId,
                memberId: null,
                transactionType: "expense_payment"
            });
            const payload: ExpensePaymentRequest = {
                tenant_id: selectedTenantId,
                branch_id: branchId,
                expense_account_id: values.expense_account_id,
                amount: values.amount,
                payee: values.payee?.trim() || null,
                reference: values.reference || null,
                description: values.description || null,
                value_date: (canBackdate && values.value_date) ? values.value_date : undefined,
                receipt_ids: receiptIds
            };
            const { data } = await api.post<CashResponse>(endpoints.finance.expensePayment(), payload);
            pushToast({
                type: "success",
                title: "Expense posted",
                message: data.data.journal_id
                    ? `Journal ${data.data.journal_id} posted successfully.`
                    : data.data.message || "SACCO expenditure posted."
            });
            setExpenseDialogOpen(false);
            setExpenseReceiptFile(null);
            setExpenseAmountInput("");
            expenseForm.reset({
                expense_account_id: "",
                amount: 0,
                payee: "",
                reference: generateExpenseReference(),
                description: "", bank_reference: "",
                value_date: ""
            });
            await loadCashData();
        } catch (error) {
            pushToast({
                type: "error",
                title: "Expense posting failed",
                message: getApiErrorMessage(error)
            });
        } finally {
            setProcessing(false);
        }
    });

    const loadOperationalBatchFile = async (file: File | null) => {
        setBatchResult(null);
        setBatchRows([]);
        setBatchFileName(file?.name || "");
        setBatchParseError(null);

        if (!file) {
            return;
        }

        try {
            const text = await file.text();
            const parsedRows = parseOperationalBatchCsv(text);
            if (!parsedRows.length) {
                throw new Error("CSV has no posting rows.");
            }
            setBatchRows(parsedRows);
        } catch (error) {
            setBatchParseError(error instanceof Error ? error.message : "Unable to read CSV.");
        }
    };

    const postOperationalBatch = async () => {
        if (!batchRows.length || !selectedTenantId) {
            return;
        }

        setBatchPosting(true);
        try {
            const payload: OperationalBatchRequest = {
                tenant_id: selectedTenantId,
                branch_id: selectedBranchId || undefined,
                rows: batchRows
            };
            const { data } = await api.post<OperationalBatchResponse>(endpoints.finance.operationalBatch(), payload);
            setBatchResult(data.data);
            pushToast({
                type: data.data.failed_rows ? "warning" : "success",
                title: "Batch posting complete",
                message: `${data.data.posted_rows} posted, ${data.data.skipped_rows ?? 0} skipped (already posted), ${data.data.failed_rows} failed.`
            });
            await loadCashData();
        } catch (error) {
            pushToast({
                type: "error",
                title: "Batch posting failed",
                message: getApiErrorMessage(error)
            });
        } finally {
            setBatchPosting(false);
        }
    };

    const selectedAccount = accounts.find((account) => account.id === pendingAction?.values.account_id);
    const selectedMember = members.find((member) => member.id === selectedAccount?.member_id);
    // Confirmation-window context, resolved per deposit kind so the teller sees the
    // real target (member, loan, or fee rule) next to the amount before posting.
    const pendingDepositKind: DepositKind = pendingAction?.values.deposit_kind || "savings_deposit";
    const pendingLoan = pendingAction?.type === "deposit" && pendingDepositKind === "loan_repayment"
        ? loans.find((loan) => loan.id === pendingAction?.values.loan_id)
        : undefined;
    const pendingLoanMember = pendingLoan ? members.find((member) => member.id === pendingLoan.member_id) : undefined;
    const pendingFeePayer = pendingAction?.type === "deposit" && (pendingDepositKind === "membership_fee" || pendingDepositKind === "fee_revenue")
        ? (pendingFeeMembers.find((member) => member.id === pendingAction?.values.member_id)
            || members.find((member) => member.id === pendingAction?.values.member_id))
        : undefined;
    const pendingFeeRule = pendingAction?.type === "deposit" && pendingDepositKind === "fee_revenue"
        ? feeRules.find((rule) => rule.code === pendingAction?.values.fee_rule_code)
        : undefined;
    const pendingActionTitle = pendingAction?.type === "withdraw"
        ? "Confirm Withdrawal"
        : pendingAction?.type === "share_contribution"
            ? "Confirm Share Contribution"
            : pendingDepositKind === "loan_repayment"
                ? "Confirm Loan Repayment"
                : pendingDepositKind === "membership_fee"
                    ? "Confirm Membership Fee"
                    : pendingDepositKind === "fee_revenue"
                        ? "Confirm Fee / Revenue"
                        : "Confirm Deposit";

    const currentForm =
        actionDialog === "deposit"
            ? depositForm
            : actionDialog === "withdraw"
                ? withdrawForm
                : shareForm;
    const currentActionOptions = actionDialog === "share_contribution" ? shareAccountOptions : savingsAccountOptions;
    const currentActionValue = currentForm.watch("account_id");
    const currentAmountInput =
        actionDialog === "deposit"
            ? depositAmountInput
            : actionDialog === "withdraw"
                ? withdrawAmountInput
                : shareAmountInput;
    const currentActionAccount = accounts.find((account) => account.id === currentActionValue);
    const currentActionMember = members.find((member) => member.id === currentActionAccount?.member_id);
    const currentDepositLoan = loans.find((loan) => loan.id === depositForm.watch("loan_id"));
    const currentDepositLoanMember = members.find((member) => member.id === currentDepositLoan?.member_id);
    const currentDepositMember = members.find((member) => member.id === depositForm.watch("member_id"));
    const currentDepositFeeRule = feeRules.find((rule) => rule.code === depositForm.watch("fee_rule_code"));
    const currentExpenseAccount = expenseAccounts.find((account) => account.id === expenseForm.watch("expense_account_id"));

    const dialogTitle =
        actionDialog === "deposit"
            ? "Post Cash Receipt"
            : actionDialog === "withdraw"
                ? "Start Withdrawal"
                : "Post Share Contribution";

    const openDepositDialog = (kind: DepositKind = "savings_deposit") => {
        setReceiptFile(null);
        setDepositAmountInput("");
        depositForm.reset({
            deposit_kind: kind,
            account_id: kind === "savings_deposit" ? (depositForm.getValues("account_id") || defaultAccountId) : "",
            loan_id: "",
            member_id: "",
            fee_rule_code: "",
            amount: 0,
            reference: generateDepositReference(kind),
            description: "", bank_reference: "",
            value_date: ""
        });
        setActionDialog("deposit");
    };

    useEffect(() => {
        if (!actionDialog) {
            return;
        }

        const form = actionDialog === "deposit" ? depositForm : actionDialog === "withdraw" ? withdrawForm : shareForm;
        form.setValue(
            "reference",
            actionDialog === "deposit" ? generateDepositReference(form.getValues("deposit_kind") || "savings_deposit") : generateCashReference(actionDialog),
            { shouldDirty: false, shouldValidate: true }
        );

        const formattedAmount = formatWholeMoneyInput(String(form.getValues("amount") || ""));
        if (actionDialog === "deposit") {
            setDepositAmountInput(formattedAmount);
        } else if (actionDialog === "withdraw") {
            setWithdrawAmountInput(formattedAmount);
        } else {
            setShareAmountInput(formattedAmount);
        }
    }, [actionDialog, depositForm, withdrawForm, shareForm]);

    return (
        <Stack spacing={3}>
            <MotionCard
                variant="outlined"
                sx={{
                    borderRadius: 2,
                    color: "text.primary",
                    background: theme.palette.mode === "dark"
                        ? `linear-gradient(135deg, ${alpha("#1B2535", 0.92)}, ${alpha("#D9B273", 0.16)})`
                        : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.background.paper, 0.97)})`
                }}
            >
                <CardContent>
                    <Stack spacing={2}>
                        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                            <Box>
                                <Typography variant="overline" color="text.secondary">Teller desk command center</Typography>
                                <Typography variant="h5" sx={{ mt: 0.5 }}>Cash Desk</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 780 }}>
                                    Run day-to-day teller operations faster with clear session status, posting controls, and transaction shortcuts.
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                                <Chip label={selectedTenantName || "Tenant workspace"} variant="outlined" />
                                <Chip
                                    label={currentSession ? "Session open" : "Session not opened"}
                                    color={currentSession ? "success" : "warning"}
                                    variant="outlined"
                                />
                                <Chip
                                    label={deskBusinessDate ? `Business date ${formatDate(deskBusinessDate)}` : "Business date pending"}
                                    variant="outlined"
                                />
                            </Stack>
                        </Stack>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                            <Button
                                variant="contained"
                                startIcon={<CallReceivedRoundedIcon />}
                                onClick={() => openDepositDialog("savings_deposit")}
                                disabled={tellerSessionRequired}
                                sx={theme.palette.mode === "dark" ? { bgcolor: cashDeskAccent, color: "#1a1a1a", "&:hover": { bgcolor: cashDeskAccentStrong } } : undefined}
                            >
                                Start Deposit
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<CallMadeRoundedIcon />}
                                onClick={() => {
                                    setReceiptFile(null);
                                    setActionDialog("withdraw");
                                }}
                                disabled={tellerSessionRequired}
                                sx={theme.palette.mode === "dark" ? { borderColor: alpha("#FF8A80", 0.44), color: "#FFAB91", "&:hover": { borderColor: alpha("#FF8A80", 0.7), bgcolor: alpha("#FF8A80", 0.08) } } : undefined}
                            >
                                Start Withdrawal
                            </Button>
                            <Button
                                variant="outlined"
                                color="warning"
                                startIcon={<WalletRoundedIcon />}
                                onClick={() => {
                                    setExpenseReceiptFile(null);
                                    setExpenseAmountInput("");
                                    expenseForm.reset({
                                        expense_account_id: "",
                                        amount: 0,
                                        payee: "",
                                        reference: generateExpenseReference(),
                                        description: "", bank_reference: "",
                                        value_date: ""
                                    });
                                    setExpenseDialogOpen(true);
                                }}
                                disabled={tellerSessionRequired}
                            >
                                Record Expense
                            </Button>
                            {SHARE_CAPITAL_ENABLED ? (
                            <Button
                                variant="outlined"
                                startIcon={<SavingsRoundedIcon />}
                                onClick={() => {
                                    setReceiptFile(null);
                                    setActionDialog("share_contribution");
                                }}
                                disabled={tellerSessionRequired}
                                sx={theme.palette.mode === "dark" ? { borderColor: alpha(cashDeskAccent, 0.44), color: cashDeskAccent, "&:hover": { borderColor: alpha(cashDeskAccent, 0.78), bgcolor: alpha(cashDeskAccent, 0.1) } } : undefined}
                            >
                                Start Contribution
                            </Button>
                            ) : null}
                            <Button
                                variant="outlined"
                                startIcon={<FileUploadRoundedIcon />}
                                onClick={() => {
                                    setBatchDialogOpen(true);
                                    setBatchResult(null);
                                    setBatchParseError(null);
                                }}
                                disabled={tellerSessionRequired}
                                sx={theme.palette.mode === "dark" ? { borderColor: alpha(cashDeskAccent, 0.44), color: cashDeskAccent, "&:hover": { borderColor: alpha(cashDeskAccent, 0.78), bgcolor: alpha(cashDeskAccent, 0.1) } } : undefined}
                            >
                                Batch Posting
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<WalletRoundedIcon />}
                                onClick={() => openDepositDialog("membership_fee")}
                                disabled={tellerSessionRequired}
                                sx={theme.palette.mode === "dark" ? { borderColor: alpha(cashDeskAccent, 0.44), color: cashDeskAccent, "&:hover": { borderColor: alpha(cashDeskAccent, 0.78), bgcolor: alpha(cashDeskAccent, 0.1) } } : undefined}
                            >
                                Membership Fee
                            </Button>
                            {!currentSession ? (
                                <Button
                                    variant="outlined"
                                    onClick={() => setOpenSessionDialog(true)}
                                    sx={theme.palette.mode === "dark" ? { borderColor: alpha(cashDeskAccent, 0.44), color: cashDeskAccent, "&:hover": { borderColor: alpha(cashDeskAccent, 0.78), bgcolor: alpha(cashDeskAccent, 0.1) } } : undefined}
                                >
                                    Open Session
                                </Button>
                            ) : (
                                <Button
                                    variant="outlined"
                                    color="warning"
                                    onClick={() => setCloseSessionDialog(true)}
                                >
                                    Close Session
                                </Button>
                            )}
                        </Stack>
                    </Stack>
                </CardContent>
            </MotionCard>

            {pendingApprovalNotice ? (
                <Alert
                    severity="info"
                    variant="outlined"
                    action={
                        <Stack direction="row" spacing={1}>
                            <Button size="small" onClick={() => void executeApprovedWithdrawal()} disabled={processing}>
                                Execute Approved
                            </Button>
                            <Button size="small" onClick={() => navigate("/approvals")}>
                                Open Queue
                            </Button>
                            <Button size="small" onClick={() => setPendingApprovalNotice(null)}>
                                Dismiss
                            </Button>
                        </Stack>
                    }
                >
                    Withdrawal submitted for maker-checker approval. Request ID: {pendingApprovalNotice.requestId}
                </Alert>
            ) : null}

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <MetricCard
                        title="Desk Throughput"
                        value={String(deskTransactions.length)}
                        helper={`${visibleMembersWithActivity} member(s) served in this business day.`}
                        icon={<WalletRoundedIcon fontSize="small" />}
                        tone={deskTransactions.length >= 20 ? "warning" : "neutral"}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <MetricCard
                        title="Deposit Intake"
                        value={formatCurrency(deskDepositTotal)}
                        helper="Total deposit inflow posted for the active desk day."
                        icon={<CallReceivedRoundedIcon fontSize="small" />}
                        tone="positive"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <MetricCard
                        title="Withdrawal Outflow"
                        value={formatCurrency(deskWithdrawalTotal)}
                        helper="Total withdrawal amount posted for the active desk day."
                        icon={<CallMadeRoundedIcon fontSize="small" />}
                        tone="negative"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <MetricCard
                        title="Net Movement"
                        value={`${deskNetMovement >= 0 ? "+" : "-"} ${formatCurrency(Math.abs(deskNetMovement))}`}
                        helper={deskNetMovement >= 0 ? "Net inflow position on teller desk." : "Net outflow position on teller desk."}
                        icon={<AccountBalanceWalletRoundedIcon fontSize="small" />}
                        tone={deskNetMovement >= 0 ? "positive" : "warning"}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, xl: 7 }}>
                    <MotionCard
                        variant="outlined"
                        sx={{
                            borderRadius: 2,
                            background: theme.palette.mode === "dark"
                                ? `linear-gradient(180deg, ${alpha("#D9B273", 0.08)}, ${alpha(theme.palette.background.paper, 0.92)})`
                                : undefined
                        }}
                    >
                        <CardContent>
                            <Stack spacing={2}>
                                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
                                    <Box>
                                        <Typography variant="h6">Teller Session</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            Open a session before posting. At close, counted cash is matched against expected desk cash from posted transactions.
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        {currentSession ? (
                                            <Chip color="success" label={`Open · ${formatCurrency(currentSession.opening_cash)}`} />
                                        ) : (
                                            <Chip label="No open session" color="warning" variant="outlined" />
                                        )}
                                        {currentSession ? (
                                            <Chip
                                                label={`Expected ${formatCurrency(deskExpectedCash)}`}
                                                variant="outlined"
                                                sx={theme.palette.mode === "dark" ? { borderColor: alpha(cashDeskAccent, 0.42), color: cashDeskAccent } : undefined}
                                            />
                                        ) : null}
                                    </Stack>
                                </Stack>
                                {currentSession ? (
                                    <Grid container spacing={1.5}>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                                <Typography variant="caption" color="text.secondary">Opened</Typography>
                                                <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>{formatDate(currentSession.opened_at)}</Typography>
                                            </Box>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                                <Typography variant="caption" color="text.secondary">Opening cash</Typography>
                                                <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>{formatCurrency(currentSession.opening_cash)}</Typography>
                                            </Box>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                                <Typography variant="caption" color="text.secondary">Expected cash</Typography>
                                                <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>{formatCurrency(deskExpectedCash)}</Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                ) : (
                                    <Alert severity="warning" variant="outlined">
                                        A teller session is required before you can post cash transactions when cash-control enforcement is active.
                                    </Alert>
                                )}
                            </Stack>
                        </CardContent>
                    </MotionCard>
                </Grid>
                <Grid size={{ xs: 12, xl: 5 }}>
                    <MotionCard
                        variant="outlined"
                        sx={{
                            borderRadius: 2,
                            background: theme.palette.mode === "dark"
                                ? `linear-gradient(180deg, ${alpha("#D9B273", 0.07)}, ${alpha(theme.palette.background.paper, 0.92)})`
                                : undefined
                        }}
                    >
                        <CardContent>
                            <Stack spacing={2}>
                                <Typography variant="h6">Receipt & Control Signals</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Policy status: {receiptPolicy?.receipt_required ? `receipt required from ${receiptThresholdText}` : "receipts optional"}.
                                </Typography>
                                <Grid container spacing={1.5}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                            <Typography variant="caption" color="text.secondary">High-value checks</Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>{highValueTransactions}</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                            <Typography variant="caption" color="text.secondary">High-value threshold</Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>{formatCurrency(highValueThreshold)}</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                            <Typography variant="caption" color="text.secondary">Max receipts</Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>{receiptPolicy?.max_receipts_per_tx ?? 0}</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                            <Typography variant="caption" color="text.secondary">Max file size</Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>{receiptPolicy?.max_file_size_mb ?? 0} MB</Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                                {receiptPolicy?.enforce_on_types?.length ? (
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        {receiptPolicy.enforce_on_types.map((type) => (
                                            <Chip key={type} size="small" label={type.replace(/_/g, " ")} />
                                        ))}
                                    </Stack>
                                ) : null}
                            </Stack>
                        </CardContent>
                    </MotionCard>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                {SHOW_QUICK_ACTIONS ? (
                <Grid size={{ xs: 12, xl: 7 }}>
                    <MotionCard
                        variant="outlined"
                        sx={{
                            height: "100%",
                            borderRadius: 2,
                            background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.success.main, 0.04)})`
                        }}
                    >
                        <CardContent>
                            <Stack spacing={2.5}>
                                <Box>
                                    <Typography variant="h6">Quick Transaction Actions</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                        Start the required cash action, capture details in the modal, then confirm posting before it is committed to the ledger.
                                    </Typography>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: SHARE_CAPITAL_ENABLED ? 3 : 4 }}>
                                        <MotionCard variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
                                            <CardContent>
                                                <Stack spacing={2}>
                                                    <Box>
                                                        <Typography variant="subtitle1">Deposit</Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                            Post member savings deposits with teller confirmation.
                                                        </Typography>
                                                    </Box>
                                                    <Button
                                                        variant="contained"
                                                        startIcon={<CallReceivedRoundedIcon />}
                                                        onClick={() => openDepositDialog("savings_deposit")}
                                                        disabled={tellerSessionRequired}
                                                        fullWidth
                                                        sx={theme.palette.mode === "dark" ? { bgcolor: cashDeskAccent, color: "#1a1a1a", "&:hover": { bgcolor: cashDeskAccentStrong } } : undefined}
                                                    >
                                                        Start Deposit
                                                    </Button>
                                                </Stack>
                                            </CardContent>
                                        </MotionCard>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: SHARE_CAPITAL_ENABLED ? 3 : 4 }}>
                                        <MotionCard variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
                                            <CardContent>
                                                <Stack spacing={2}>
                                                    <Box>
                                                        <Typography variant="subtitle1">Withdraw</Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                            Validate savings balance and post controlled withdrawals.
                                                        </Typography>
                                                    </Box>
                                                    <Button
                                                        variant="contained"
                                                        color="error"
                                                        startIcon={<CallMadeRoundedIcon />}
                                                        onClick={() => {
                                                            setReceiptFile(null);
                                                            setActionDialog("withdraw");
                                                        }}
                                                        disabled={tellerSessionRequired}
                                                        fullWidth
                                                    >
                                                        Start Withdrawal
                                                    </Button>
                                                </Stack>
                                            </CardContent>
                                        </MotionCard>
                                    </Grid>
                                    {SHARE_CAPITAL_ENABLED ? (
                                    <Grid size={{ xs: 12, md: SHARE_CAPITAL_ENABLED ? 3 : 4 }}>
                                        <MotionCard variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
                                            <CardContent>
                                                <Stack spacing={2}>
                                                    <Box>
                                                        <Typography variant="subtitle1">Share Capital</Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                            Record member share contributions into the share ledger.
                                                        </Typography>
                                                    </Box>
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<SavingsRoundedIcon />}
                                                        onClick={() => {
                                                            setReceiptFile(null);
                                                            setActionDialog("share_contribution");
                                                        }}
                                                        disabled={tellerSessionRequired}
                                                        fullWidth
                                                        sx={theme.palette.mode === "dark" ? { borderColor: alpha(cashDeskAccent, 0.44), color: cashDeskAccent, "&:hover": { borderColor: alpha(cashDeskAccent, 0.78), bgcolor: alpha(cashDeskAccent, 0.1) } } : undefined}
                                                    >
                                                        Start Contribution
                                                    </Button>
                                                </Stack>
                                            </CardContent>
                                        </MotionCard>
                                    </Grid>
                                    ) : null}
                                    <Grid size={{ xs: 12, md: SHARE_CAPITAL_ENABLED ? 3 : 4 }}>
                                        <MotionCard variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
                                            <CardContent>
                                                <Stack spacing={2}>
                                                    <Box>
                                                        <Typography variant="subtitle1">Batch Posting</Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                            Upload contributions, repayments, or fee revenue rows.
                                                        </Typography>
                                                    </Box>
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<FileUploadRoundedIcon />}
                                                        onClick={() => {
                                                            setBatchDialogOpen(true);
                                                            setBatchResult(null);
                                                            setBatchParseError(null);
                                                        }}
                                                        disabled={tellerSessionRequired}
                                                        fullWidth
                                                    >
                                                        Upload CSV
                                                    </Button>
                                                    <Button
                                                        variant="text"
                                                        size="small"
                                                        startIcon={<DownloadRoundedIcon />}
                                                        onClick={downloadOperationalBatchTemplate}
                                                        sx={{ alignSelf: "flex-start" }}
                                                    >
                                                        Download template
                                                    </Button>
                                                </Stack>
                                            </CardContent>
                                        </MotionCard>
                                    </Grid>
                                </Grid>
                            </Stack>
                        </CardContent>
                    </MotionCard>
                </Grid>
                ) : null}

                <Grid size={{ xs: 12, xl: SHOW_QUICK_ACTIONS ? 5 : 12 }}>
                    <MotionCard
                        variant="outlined"
                        sx={{
                            height: "100%",
                            borderRadius: 2,
                            background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.warning.main, 0.04)})`
                        }}
                    >
                        <CardContent>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="h6">Desk Priority Board</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                        Keep close-readiness high by resolving session, receipt, and high-value transaction checks before end-of-day sign-off.
                                    </Typography>
                                </Box>

                                <Grid container spacing={1.5}>
                                    {[
                                        ["Session status", currentSession ? "Open and ready for posting" : "Open session before posting"],
                                        ["Receipt threshold", receiptPolicy?.receipt_required ? `Required from ${receiptThresholdText}` : "Receipt optional"],
                                        ["High-value checks", `${highValueTransactions} transaction(s) above ${formatCurrency(highValueThreshold)}`],
                                        ["Expected cash", formatCurrency(deskExpectedCash)]
                                    ].map(([label, value]) => (
                                        <Grid key={label} size={{ xs: 12, sm: 6 }}>
                                            <Box
                                                sx={{
                                                    p: 1.5,
                                                    border: `1px solid ${theme.palette.divider}`,
                                                    borderRadius: 2,
                                                    bgcolor: alpha(theme.palette.background.default, 0.5),
                                                    minHeight: 108
                                                }}
                                            >
                                                <Typography variant="caption" color="text.secondary">
                                                    {label}
                                                </Typography>
                                                <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                                                    {value}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Stack>
                        </CardContent>
                    </MotionCard>
                </Grid>
            </Grid>

            <CashTransactionsReport tenantId={selectedTenantId} />

            <MotionModal
                open={batchDialogOpen}
                onClose={batchPosting ? undefined : () => setBatchDialogOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>Operational Batch Posting</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2.5} sx={{ pt: 0.5 }}>
                        <Alert severity="info" variant="outlined">
                            Rows post through the normal teller procedures, so savings, shares, loan repayments, and fee revenue create journals and teller-session entries.
                        </Alert>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                            <Button
                                startIcon={<DownloadRoundedIcon />}
                                variant="outlined"
                                onClick={downloadOperationalBatchTemplate}
                            >
                                Download Template
                            </Button>
                            <TextField
                                type="file"
                                fullWidth
                                inputProps={{ accept: ".csv,text/csv" }}
                                onChange={(event) => {
                                    const file = (event.target as HTMLInputElement).files?.[0] || null;
                                    void loadOperationalBatchFile(file);
                                }}
                                helperText={batchFileName ? `${batchFileName} selected` : "CSV only"}
                            />
                        </Stack>
                        {batchParseError ? (
                            <Alert severity="error" variant="outlined">
                                {batchParseError}
                            </Alert>
                        ) : null}
                        {batchRows.length ? (
                            <Grid container spacing={1.5}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                        <Typography variant="caption" color="text.secondary">Rows Ready</Typography>
                                        <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 700 }}>{batchRows.length}</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                        <Typography variant="caption" color="text.secondary">Branch</Typography>
                                        <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 700 }}>{selectedBranchName || "Resolved by member"}</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                        <Typography variant="caption" color="text.secondary">Tenant</Typography>
                                        <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 700 }}>{selectedTenantName || "Current SACCO"}</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        ) : null}
                        {batchResult ? (
                            <Stack spacing={1.5}>
                                <Alert severity={batchResult.failed_rows ? "warning" : "success"} variant="outlined">
                                    {batchResult.posted_rows} posted and {batchResult.failed_rows} failed from {batchResult.total_rows} row(s).
                                </Alert>
                                <DataTable
                                    rows={batchResult.rows}
                                    columns={batchResultColumns}
                                    emptyMessage="No batch results yet."
                                />
                            </Stack>
                        ) : null}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setBatchDialogOpen(false)} disabled={batchPosting} color="inherit">
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<FileUploadRoundedIcon />}
                        onClick={() => void postOperationalBatch()}
                        disabled={!batchRows.length || Boolean(batchParseError) || batchPosting}
                    >
                        Post Batch
                    </Button>
                </DialogActions>
            </MotionModal>

            <MotionModal
                open={expenseDialogOpen}
                onClose={processing ? undefined : () => {
                    setExpenseDialogOpen(false);
                    setExpenseReceiptFile(null);
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Record SACCO Expense</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2.5} sx={{ pt: 0.5 }}>
                        <Alert severity="info" variant="outlined">
                            This posts a payment voucher as cash out: debit the selected expense account and credit the SACCO cash control account.
                        </Alert>
                        {expenseReceiptRequired ? (
                            <Alert severity="warning" variant="outlined">
                                This amount requires receipt proof before posting.
                            </Alert>
                        ) : null}
                        <Box component="form" id="expense-payment-form" onSubmit={requestExpenseConfirm} sx={{ display: "grid", gap: 2 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Expense category
                                </Typography>
                                <Box sx={{ mt: 0.75 }}>
                                    <SearchableSelect
                                        value={expenseForm.watch("expense_account_id") || ""}
                                        options={expenseAccountOptions}
                                        placeholder="Search expense account…"
                                        onChange={(value) => {
                                            expenseForm.setValue("expense_account_id", value, { shouldValidate: true });
                                            setTimeout(() => expenseAmountInputRef.current?.focus(), 50);
                                        }}
                                    />
                                </Box>
                                {expenseForm.formState.errors.expense_account_id ? (
                                    <Typography variant="caption" color="error" sx={{ mt: 0.75, display: "block" }}>
                                        {expenseForm.formState.errors.expense_account_id.message}
                                    </Typography>
                                ) : null}
                                {!expenseAccountOptions.length ? (
                                    <Alert severity="warning" variant="outlined" sx={{ mt: 1.25 }}>
                                        No expense accounts are configured. Add expense accounts in the chart of accounts before posting expenditure.
                                    </Alert>
                                ) : null}
                            </Box>

                            {currentExpenseAccount ? (
                                <Alert severity="info" variant="outlined">
                                    Ledger route: debit {currentExpenseAccount.account_name}, credit SACCO cash/bank.
                                </Alert>
                            ) : null}

                            <TextField
                                label="Amount paid"
                                fullWidth
                                inputRef={expenseAmountInputRef}
                                value={expenseAmountInput}
                                onChange={(event) => {
                                    const digits = event.target.value.replace(/[^\d]/g, "");
                                    const formatted = formatWholeMoneyInput(digits);
                                    setExpenseAmountInput(formatted);
                                    expenseForm.setValue("amount", digits ? Number(digits) : 0, { shouldValidate: true, shouldDirty: true });
                                }}
                                error={Boolean(expenseForm.formState.errors.amount)}
                                helperText={expenseForm.formState.errors.amount?.message || "This reduces the teller's expected cash."}
                                inputProps={{ inputMode: "numeric" }}
                                InputProps={{ startAdornment: <InputAdornment position="start">TSh</InputAdornment> }}
                                sx={{ "& .MuiInputBase-input": { fontSize: "1.5rem", fontWeight: 700, py: 1.2 } }}
                            />

                            <TextField
                                label="Payee / vendor (optional)"
                                fullWidth
                                placeholder="Bank, supplier, staff, vendor..."
                                {...expenseForm.register("payee")}
                                error={Boolean(expenseForm.formState.errors.payee)}
                                helperText={expenseForm.formState.errors.payee?.message}
                            />

                            <TextField
                                label="Reference"
                                fullWidth
                                placeholder="Voucher, bank slip, mobile money, or receipt number"
                                {...expenseForm.register("reference")}
                                error={Boolean(expenseForm.formState.errors.reference)}
                                helperText={expenseForm.formState.errors.reference?.message || "Auto-generated if you leave this unchanged."}
                            />

                            {canBackdate ? (
                                <TextField
                                    label="Value date (optional backdate)"
                                    type="date"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{ min: backdateMinDate, max: todayDate }}
                                    {...expenseForm.register("value_date")}
                                    helperText="Backdate up to 7 days when the expenditure happened earlier. The audit timestamp remains the real entry time."
                                />
                            ) : null}

                            <TextField
                                label="Notes (optional)"
                                fullWidth
                                multiline
                                minRows={2}
                                placeholder="Payment voucher details, bank charge note, receipt number..."
                                {...expenseForm.register("description")}
                                error={Boolean(expenseForm.formState.errors.description)}
                                helperText={expenseForm.formState.errors.description?.message}
                            />

                            <Box>
                                <InputLabel shrink htmlFor="expense-receipt-upload">
                                    Receipt / voucher proof
                                </InputLabel>
                                <TextField
                                    id="expense-receipt-upload"
                                    type="file"
                                    fullWidth
                                    inputProps={{
                                        accept: receiptPolicy?.allowed_mime_types?.join(",") || "image/jpeg,image/png,application/pdf"
                                    }}
                                    onChange={(event) => {
                                        const file = (event.target as HTMLInputElement).files?.[0] || null;
                                        setExpenseReceiptFile(file);
                                    }}
                                    helperText={
                                        expenseReceiptFile
                                            ? `${expenseReceiptFile.name} selected`
                                            : `Allowed: ${(receiptPolicy?.allowed_mime_types || []).join(", ") || "image/jpeg, image/png, application/pdf"}`
                                    }
                                />
                            </Box>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => {
                        setExpenseDialogOpen(false);
                        setExpenseReceiptFile(null);
                    }} disabled={processing} color="inherit">
                        Cancel
                    </Button>
                    <Button form="expense-payment-form" type="submit" variant="contained" color="warning" disabled={processing || !expenseAccountOptions.length}>
                        {processing ? "Posting..." : "Post Expense"}
                    </Button>
                </DialogActions>
            </MotionModal>

            <MotionModal
                open={Boolean(actionDialog)}
                onClose={processing ? undefined : () => {
                    setActionDialog(null);
                    setReceiptFile(null);
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2.5} sx={{ pt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                            {actionDialog === "deposit"
                                ? "Choose what the cash receipt is for. Savings, loan repayments, and SACCO revenue are posted through their own ledger procedures."
                                : actionDialog === "withdraw"
                                    ? "Choose the member savings account and confirm the withdrawal details before posting."
                                    : "Choose the member share account and capture the contribution details before posting."}
                        </Typography>
                        {receiptPolicy?.receipt_required ? (
                            <Alert severity="info" variant="outlined">
                                Receipts are required from {receiptThresholdText} for configured transaction types. If your amount crosses the threshold, attach the evidence before review.
                            </Alert>
                        ) : null}

                        <Box
                            component="form"
                            id="cash-action-form"
                            onSubmit={
                                actionDialog === "deposit"
                                    ? depositForm.handleSubmit((values) => handleSubmit("deposit", values))
                                    : actionDialog === "withdraw"
                                        ? withdrawForm.handleSubmit((values) => handleSubmit("withdraw", values))
                                        : shareForm.handleSubmit((values) => handleSubmit("share_contribution", values))
                            }
                            sx={{ display: "grid", gap: 2 }}
                        >
                            {actionDialog === "deposit" ? (
                                <TextField
                                    select
                                    label="Receipt type"
                                    fullWidth
                                    value={depositKind}
                                    onChange={(event) => {
                                        const nextKind = event.target.value as DepositKind;
                                        depositForm.setValue("deposit_kind", nextKind, { shouldValidate: true, shouldDirty: true });
                                        depositForm.setValue("account_id", nextKind === "savings_deposit" ? (depositForm.getValues("account_id") || defaultAccountId) : "", { shouldValidate: false });
                                        depositForm.setValue("loan_id", "", { shouldValidate: false });
                                        depositForm.setValue("member_id", "", { shouldValidate: false });
                                        depositForm.setValue("fee_rule_code", "", { shouldValidate: false });
                                        depositForm.setValue("reference", generateDepositReference(nextKind), { shouldValidate: true });
                                    }}
                                    helperText="This controls the accounting route: member savings, loan repayment, membership fee, or SACCO revenue."
                                >
                                    <MenuItem value="savings_deposit">Normal savings deposit</MenuItem>
                                    <MenuItem value="loan_repayment">Loan repayment</MenuItem>
                                    <MenuItem value="membership_fee">Membership fee</MenuItem>
                                    <MenuItem value="fee_revenue">Other SACCO revenue / fee</MenuItem>
                                </TextField>
                            ) : null}

                            {(actionDialog !== "deposit" || depositKind === "savings_deposit") ? (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Account
                                    </Typography>
                                    <Box sx={{ mt: 0.75 }}>
                                        <SearchableSelect
                                            value={currentForm.watch("account_id") || ""}
                                            options={currentActionOptions}
                                            placeholder="Search by member name, phone, or account…"
                                            onChange={(value) => {
                                                currentForm.setValue("account_id", value, { shouldValidate: true });
                                                // Jump straight to the amount once a member is chosen.
                                                setTimeout(() => amountInputRef.current?.focus(), 50);
                                            }}
                                        />
                                    </Box>
                                    {currentForm.formState.errors.account_id ? (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.75, display: "block" }}>
                                            {currentForm.formState.errors.account_id.message}
                                        </Typography>
                                    ) : null}
                                </Box>
                            ) : null}

                            {actionDialog === "deposit" && depositKind === "loan_repayment" ? (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Pay towards
                                    </Typography>
                                    <ToggleButtonGroup
                                        exclusive
                                        fullWidth
                                        size="small"
                                        value={depositForm.watch("allocation") || "auto"}
                                        onChange={(_, next) => {
                                            if (next) {
                                                depositForm.setValue("allocation", next, { shouldValidate: true });
                                            }
                                        }}
                                        sx={{ mt: 0.75 }}
                                    >
                                        <ToggleButton value="auto">Both (interest first)</ToggleButton>
                                        <ToggleButton value="interest_only">Interest only</ToggleButton>
                                        <ToggleButton value="principal_only">Principal only</ToggleButton>
                                    </ToggleButtonGroup>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
                                        {depositForm.watch("allocation") === "interest_only"
                                            ? "The whole amount clears interest. Principal is untouched."
                                            : depositForm.watch("allocation") === "principal_only"
                                                ? "The whole amount reduces principal. Interest due stays outstanding."
                                                : "Interest is cleared first, then the balance reduces principal."}
                                    </Typography>
                                </Box>
                            ) : null}

                            {actionDialog === "deposit" && depositKind === "loan_repayment" ? (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Loan facility
                                    </Typography>
                                    <Box sx={{ mt: 0.75 }}>
                                        <SearchableSelect
                                            value={depositForm.watch("loan_id") || ""}
                                            options={loanRepaymentOptions}
                                            placeholder="Search by member name or loan number…"
                                            onChange={(value) => {
                                                depositForm.setValue("loan_id", value, { shouldValidate: true });
                                                setTimeout(() => amountInputRef.current?.focus(), 50);
                                            }}
                                        />
                                    </Box>
                                    {depositForm.formState.errors.loan_id ? (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.75, display: "block" }}>
                                            {depositForm.formState.errors.loan_id.message}
                                        </Typography>
                                    ) : null}
                                    {!loanRepaymentOptions.length ? (
                                        <Alert severity="info" variant="outlined" sx={{ mt: 1.25 }}>
                                            No active or in-arrears loans are visible for this branch.
                                        </Alert>
                                    ) : null}
                                </Box>
                            ) : null}

                            {actionDialog === "deposit" && depositKind === "membership_fee" ? (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Member paying membership fee
                                    </Typography>
                                    <Box sx={{ mt: 0.75 }}>
                                        <SearchableSelect
                                            value={depositForm.watch("member_id") || ""}
                                            options={membershipMemberOptions}
                                            placeholder={loadingPendingFeeMembers ? "Loading approved members…" : "Search by member name, number, or phone…"}
                                            onChange={(value) => {
                                                depositForm.setValue("member_id", value, { shouldValidate: true });
                                                setTimeout(() => amountInputRef.current?.focus(), 50);
                                            }}
                                        />
                                    </Box>
                                    {depositForm.formState.errors.member_id ? (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.75, display: "block" }}>
                                            {depositForm.formState.errors.member_id.message}
                                        </Typography>
                                    ) : null}
                                </Box>
                            ) : null}

                            {actionDialog === "deposit" && depositKind === "fee_revenue" ? (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Revenue / fee rule
                                    </Typography>
                                    <Box sx={{ mt: 0.75 }}>
                                        <SearchableSelect
                                            value={depositForm.watch("fee_rule_code") || ""}
                                            options={feeRuleOptions}
                                            placeholder="Search by fee name or code…"
                                            onChange={(value) => {
                                                depositForm.setValue("fee_rule_code", value, { shouldValidate: true });
                                                setTimeout(() => amountInputRef.current?.focus(), 50);
                                            }}
                                        />
                                    </Box>
                                    {depositForm.formState.errors.fee_rule_code ? (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.75, display: "block" }}>
                                            {depositForm.formState.errors.fee_rule_code.message}
                                        </Typography>
                                    ) : null}
                                    {!feeRuleOptions.length ? (
                                        <Alert severity="warning" variant="outlined" sx={{ mt: 1.25 }}>
                                            No active fee or revenue rules are configured. Branch manager must configure one with an income account first.
                                        </Alert>
                                    ) : null}
                                </Box>
                            ) : null}

                            {currentActionAccount ? (
                                <Grid container spacing={1.5}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                border: `1px solid ${theme.palette.divider}`,
                                                borderRadius: 2,
                                                bgcolor: alpha(theme.palette.background.default, 0.45)
                                            }}
                                        >
                                            <Typography variant="caption" color="text.secondary">
                                                Member
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                                                {currentActionMember?.full_name || "Unknown member"}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                border: `1px solid ${theme.palette.divider}`,
                                                borderRadius: 2,
                                                bgcolor: alpha(theme.palette.background.default, 0.45)
                                            }}
                                        >
                                            <Typography variant="caption" color="text.secondary">
                                                Current Balance
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                                                {formatCurrency(currentActionAccount.available_balance)}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            ) : null}

                            {actionDialog === "deposit" && depositKind === "loan_repayment" && currentDepositLoan ? (
                                <Grid container spacing={1.5}>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.45) }}>
                                            <Typography variant="caption" color="text.secondary">Borrower</Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                                                {currentDepositLoanMember?.full_name || "Unknown member"}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.45) }}>
                                            <Typography variant="caption" color="text.secondary">Outstanding</Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                                                {formatCurrency(Number(currentDepositLoan.outstanding_principal || 0) + Number(currentDepositLoan.accrued_interest || 0))}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.45) }}>
                                            <Typography variant="caption" color="text.secondary">Ledger route</Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                                                Cash to loan principal/interest
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            ) : null}

                            {actionDialog === "deposit" && depositKind === "membership_fee" && currentDepositMember ? (
                                <Alert severity="info" variant="outlined">
                                    Membership fee will be posted as SACCO income and linked to {currentDepositMember.full_name}. The member can be activated once the configured fee is fully paid.
                                </Alert>
                            ) : null}

                            {actionDialog === "deposit" && depositKind === "fee_revenue" && currentDepositFeeRule ? (
                                <Alert severity="info" variant="outlined">
                                    This posts to the SACCO cash control account and credits the income account configured on {currentDepositFeeRule.name}.
                                </Alert>
                            ) : null}

                            <TextField
                                label="Amount"
                                fullWidth
                                inputRef={amountInputRef}
                                value={currentAmountInput}
                                onChange={(event) => {
                                    const digits = event.target.value.replace(/[^\d]/g, "");
                                    const formatted = formatWholeMoneyInput(digits);
                                    if (actionDialog === "deposit") {
                                        setDepositAmountInput(formatted);
                                    } else if (actionDialog === "withdraw") {
                                        setWithdrawAmountInput(formatted);
                                    } else {
                                        setShareAmountInput(formatted);
                                    }
                                    currentForm.setValue("amount", digits ? Number(digits) : 0, { shouldValidate: true, shouldDirty: true });
                                }}
                                error={Boolean(currentForm.formState.errors.amount)}
                                helperText={currentForm.formState.errors.amount?.message || "Reference is generated automatically for audit."}
                                inputProps={{ inputMode: "numeric" }}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">TSh</InputAdornment>
                                }}
                                sx={{ "& .MuiInputBase-input": { fontSize: "1.5rem", fontWeight: 700, py: 1.2 } }}
                            />

                            {canBackdate && (actionDialog !== "deposit" || depositKind === "savings_deposit") ? (
                                <TextField
                                    label="Value date (optional backdate)"
                                    type="date"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{ min: backdateMinDate, max: todayDate }}
                                    {...currentForm.register("value_date")}
                                    helperText="Backdate up to 7 days for a deposit received on a past date. Leave blank for today — the audit log always keeps the real entry time."
                                />
                            ) : null}

                            <TextField
                                label="Bank reference number (optional)"
                                fullWidth
                                placeholder="e.g. FT26071234567 from the bank statement"
                                {...currentForm.register("bank_reference")}
                                error={Boolean(currentForm.formState.errors.bank_reference)}
                                helperText={currentForm.formState.errors.bank_reference?.message}
                            />

                            <TextField
                                label="Description (as per bank statement)"
                                fullWidth
                                multiline
                                minRows={2}
                                placeholder={
                                    actionDialog === "deposit" && depositKind === "loan_repayment"
                                        ? "Counter loan repayment"
                                        : actionDialog === "deposit" && depositKind === "membership_fee"
                                            ? "Counter membership fee"
                                            : actionDialog === "deposit" && depositKind === "fee_revenue"
                                                ? "Counter SACCO revenue collection"
                                                : actionDialog === "deposit"
                                                    ? "Counter savings deposit"
                                        : actionDialog === "withdraw"
                                            ? "Member withdrawal"
                                            : "Monthly share capital contribution"
                                }
                                {...currentForm.register("description")}
                                error={Boolean(currentForm.formState.errors.description)}
                                helperText={currentForm.formState.errors.description?.message}
                            />

                            <Box>
                                <InputLabel shrink htmlFor="cash-receipt-upload">
                                    Receipt proof
                                </InputLabel>
                                <TextField
                                    id="cash-receipt-upload"
                                    type="file"
                                    fullWidth
                                    inputProps={{
                                        accept: receiptPolicy?.allowed_mime_types?.join(",") || "image/jpeg,image/png,application/pdf"
                                    }}
                                    onChange={(event) => {
                                        const file = (event.target as HTMLInputElement).files?.[0] || null;
                                        setReceiptFile(file);
                                    }}
                                    helperText={
                                        receiptFile
                                            ? `${receiptFile.name} selected`
                                            : `Allowed: ${(receiptPolicy?.allowed_mime_types || []).join(", ") || "image/jpeg, image/png, application/pdf"}`
                                    }
                                />
                            </Box>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => {
                        setActionDialog(null);
                        setReceiptFile(null);
                    }} disabled={processing} color="inherit">
                        Cancel
                    </Button>
                    <Button form="cash-action-form" type="submit" variant="contained" disabled={processing}>
                        {processing
                            ? "Posting…"
                            : actionDialog === "deposit" && depositKind === "loan_repayment"
                                ? "Post Loan Repayment"
                                : actionDialog === "deposit" && depositKind === "membership_fee"
                                    ? "Post Membership Fee"
                                    : actionDialog === "deposit" && depositKind === "fee_revenue"
                                        ? "Post SACCO Revenue"
                                        : actionDialog === "deposit"
                                            ? "Post Deposit"
                                : actionDialog === "withdraw"
                                    ? "Post Withdrawal"
                                    : "Post Share Contribution"}
                    </Button>
                </DialogActions>
            </MotionModal>

            <MotionModal open={feeDialogOpen} onClose={collectingFee ? undefined : () => setFeeDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Collect membership fee</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ pt: 0.5 }}>
                        <Alert severity="info" variant="outlined">
                            Approved applicants stay pending until the joining fee is received. Collecting it here posts the fee to your teller session and activates the member once fully paid.
                        </Alert>
                        <SearchableSelect
                            label="Applicant awaiting payment"
                            value={feeMemberId}
                            onChange={(value) => setFeeMemberId(value)}
                            options={pendingFeeMembers.map((member) => ({
                                value: member.id,
                                label: `${member.full_name}${member.member_no ? ` — ${member.member_no}` : ""}`,
                                secondary: member.phone || undefined
                            }))}
                        />
                        {!loadingPendingFeeMembers && !pendingFeeMembers.length ? (
                            <Alert severity="success" variant="outlined">
                                No approved applicants are waiting for a membership fee right now.
                            </Alert>
                        ) : null}
                        <TextField
                            fullWidth
                            type="number"
                            label="Amount received"
                            value={feeAmount}
                            onChange={(event) => setFeeAmount(event.target.value)}
                            helperText="Leave blank to charge the SACCO's configured membership fee. Enter a smaller amount for a partial payment."
                        />
                        <TextField
                            fullWidth
                            label="Reference (optional)"
                            value={feeReference}
                            onChange={(event) => setFeeReference(event.target.value)}
                            helperText="Receipt or slip number, if any."
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFeeDialogOpen(false)} disabled={collectingFee}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => setFeeConfirmOpen(true)}
                        disabled={collectingFee || !feeMemberId}
                    >
                        {collectingFee ? "Collecting..." : "Collect Fee"}
                    </Button>
                </DialogActions>
            </MotionModal>

            <ConfirmModal
                open={feeConfirmOpen}
                title="Confirm Membership Fee"
                summary={
                    <Stack spacing={1.25}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">Member</Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {(() => {
                                    const feeMember = pendingFeeMembers.find((member) => member.id === feeMemberId);
                                    return feeMember ? `${feeMember.full_name}${feeMember.member_no ? ` (${feeMember.member_no})` : ""}` : "Unknown";
                                })()}
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 2,
                                px: 1.5,
                                py: 1,
                                borderRadius: 1.5,
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">Amount</Typography>
                            <Typography variant="h5" fontWeight={800} sx={{ fontVariantNumeric: "tabular-nums" }}>
                                {feeAmount.trim() ? formatCurrency(Number(feeAmount)) : "Configured fee"}
                            </Typography>
                        </Box>
                        {!feeAmount.trim() ? (
                            <Typography variant="caption" color="text.secondary">
                                No amount entered — the SACCO's configured membership fee will be charged in full.
                            </Typography>
                        ) : null}
                        {feeReference.trim() ? (
                            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                <Typography variant="body2" color="text.secondary">Reference</Typography>
                                <Typography variant="body2" fontWeight={600}>{feeReference.trim()}</Typography>
                            </Box>
                        ) : null}
                    </Stack>
                }
                confirmLabel="Post Membership Fee"
                loading={collectingFee}
                onCancel={() => setFeeConfirmOpen(false)}
                onConfirm={() => {
                    setFeeConfirmOpen(false);
                    void collectMembershipFee();
                }}
            />

            <MotionModal open={openSessionDialog} onClose={openingSession ? undefined : () => setOpenSessionDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Open teller session</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ pt: 0.5 }}>
                        <Alert severity="info" variant="outlined">
                            Start the teller day with the physical cash currently in hand. Expected cash will begin from this amount and update as deposits and withdrawals post.
                        </Alert>
                        <Grid container spacing={1.5}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box
                                    sx={{
                                        p: 1.5,
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: 2,
                                        bgcolor: alpha(theme.palette.background.default, 0.45)
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary">
                                        Branch
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700 }}>
                                        {selectedBranchName || selectedBranchId || "Active branch"}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box
                                    sx={{
                                        p: 1.5,
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: 2,
                                        bgcolor: alpha(theme.palette.background.default, 0.45)
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary">
                                        Business date
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700 }}>
                                        {deskBusinessDate ? formatDate(deskBusinessDate) : "Today"}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Box
                                    sx={{
                                        p: 1.5,
                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                        borderRadius: 2,
                                        bgcolor: alpha(theme.palette.primary.main, 0.05)
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary">
                                        Opening expected cash
                                    </Typography>
                                    <Typography variant="h6" sx={{ mt: 0.5 }}>
                                        {formatCurrency(countedOpeningCash)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        This becomes the starting point for teller cash balancing until the session is closed.
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                        <TextField
                            label="Opening cash counted"
                            value={openingCashInput}
                            onChange={(event) => {
                                const formatted = formatWholeMoneyInput(event.target.value);
                                setOpeningCashInput(formatted);
                                const numeric = Number(formatted.replace(/,/g, "")) || 0;
                                openSessionForm.setValue("opening_cash", numeric, { shouldDirty: true, shouldValidate: true });
                            }}
                            inputMode="numeric"
                            placeholder="0"
                            InputProps={{
                                startAdornment: <InputAdornment position="start">TSh</InputAdornment>
                            }}
                            helperText="Count the physical cash at the desk before opening the session."
                            error={Boolean(openSessionForm.formState.errors.opening_cash)}
                        />
                        <TextField
                            label="Opening notes"
                            multiline
                            minRows={3}
                            placeholder="Optional handover note, vault drawdown note, or start-of-day remark"
                            {...openSessionForm.register("notes")}
                            helperText="Use notes if this opening cash came from vault issue, previous handover, or any exception."
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setOpenSessionDialog(false)} disabled={openingSession}>Cancel</Button>
                    <Button variant="contained" onClick={() => void openSession()} disabled={openingSession}>
                        {openingSession ? "Opening..." : "Open session"}
                    </Button>
                </DialogActions>
            </MotionModal>

            <MotionModal open={closeSessionDialog} onClose={closingSession ? undefined : () => setCloseSessionDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Close teller session</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ pt: 0.5 }}>
                        <Alert severity="info" variant="outlined">
                            Expected cash currently tracks as {formatCurrency(deskExpectedCash)}.
                        </Alert>
                        <Grid container spacing={1.5}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box
                                    sx={{
                                        p: 1.5,
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: 2,
                                        bgcolor: alpha(theme.palette.background.default, 0.45)
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary">
                                        Opening cash
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700 }}>
                                        {formatCurrency(currentSession?.opening_cash || 0)}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box
                                    sx={{
                                        p: 1.5,
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: 2,
                                        bgcolor: alpha(theme.palette.background.default, 0.45)
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary">
                                        Expected closing cash
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700 }}>
                                        {formatCurrency(deskExpectedCash)}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box
                                    sx={{
                                        p: 1.5,
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: 2,
                                        bgcolor: alpha(theme.palette.background.default, 0.45)
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary">
                                        Cash received
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700, color: theme.palette.success.main }}>
                                        {formatCurrency(deskDepositTotal)}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box
                                    sx={{
                                        p: 1.5,
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: 2,
                                        bgcolor: alpha(theme.palette.background.default, 0.45)
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary">
                                        Cash paid out
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700, color: theme.palette.warning.main }}>
                                        {formatCurrency(deskWithdrawalTotal)}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                        <TextField
                            label="Counted cash"
                            fullWidth
                            value={closingCashInput}
                            onChange={(event) => {
                                const digits = event.target.value.replace(/[^\d]/g, "");
                                setClosingCashInput(formatWholeMoneyInput(digits));
                                closeSessionForm.setValue("closing_cash", digits ? Number(digits) : 0, { shouldValidate: true, shouldDirty: true });
                            }}
                            helperText="Enter the physical cash counted at the desk."
                            inputProps={{ inputMode: "numeric" }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">TSh</InputAdornment>
                            }}
                        />
                        <Box
                            sx={{
                                p: 1.5,
                                border: `1px solid ${
                                    closingVarianceStatus === "balanced"
                                        ? alpha(theme.palette.success.main, 0.32)
                                        : closingVarianceStatus === "over"
                                            ? alpha(theme.palette.warning.main, 0.32)
                                            : alpha(theme.palette.error.main, 0.32)
                                }`,
                                borderRadius: 2,
                                bgcolor:
                                    closingVarianceStatus === "balanced"
                                        ? alpha(theme.palette.success.main, 0.08)
                                        : closingVarianceStatus === "over"
                                            ? alpha(theme.palette.warning.main, 0.08)
                                            : alpha(theme.palette.error.main, 0.08)
                            }}
                        >
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Balancing status
                                    </Typography>
                                    <Typography variant="subtitle1" sx={{ mt: 0.35, fontWeight: 700, textTransform: "capitalize" }}>
                                        {closingVarianceStatus === "balanced"
                                            ? "Balanced"
                                            : closingVarianceStatus === "over"
                                                ? "Cash over"
                                                : "Cash short"}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={formatCurrency(Math.abs(closingVariance))}
                                    color={
                                        closingVarianceStatus === "balanced"
                                            ? "success"
                                            : closingVarianceStatus === "over"
                                                ? "warning"
                                                : "error"
                                    }
                                    variant={closingVarianceStatus === "balanced" ? "outlined" : "filled"}
                                    sx={{ fontWeight: 700 }}
                                />
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Variance is calculated automatically from expected cash and the physical cash counted at close.
                            </Typography>
                        </Box>
                        <TextField
                            label={closingVariance === 0 ? "Closing notes" : "Variance explanation *"}
                            multiline
                            minRows={3}
                            {...closeSessionForm.register("notes")}
                            helperText={closingVariance === 0 ? "Optional shift notes." : "Required because counted cash does not match expected cash."}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCloseSessionDialog(false)} disabled={closingSession}>Cancel</Button>
                    <Button variant="contained" color="warning" onClick={() => void closeSession()} disabled={closingSession}>
                        {closingSession ? "Closing..." : "Close session"}
                    </Button>
                </DialogActions>
            </MotionModal>

            <ConfirmModal
                open={Boolean(pendingExpense)}
                title="Confirm Expense Payment"
                summary={
                    <Stack spacing={1.25}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">Expense account</Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {expenseAccounts.find((account) => account.id === pendingExpense?.expense_account_id)?.account_name || "Unknown"}
                            </Typography>
                        </Box>
                        {pendingExpense?.payee ? (
                            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                <Typography variant="body2" color="text.secondary">Payee</Typography>
                                <Typography variant="body2" fontWeight={600}>{pendingExpense.payee}</Typography>
                            </Box>
                        ) : null}
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 2,
                                px: 1.5,
                                py: 1,
                                borderRadius: 1.5,
                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                border: `1px solid ${alpha(theme.palette.warning.main, 0.35)}`
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">Cash out</Typography>
                            <Typography variant="h5" fontWeight={800} sx={{ fontVariantNumeric: "tabular-nums" }}>
                                {formatCurrency(pendingExpense?.amount)}
                            </Typography>
                        </Box>
                        {pendingExpense?.reference ? (
                            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                <Typography variant="body2" color="text.secondary">Reference</Typography>
                                <Typography variant="body2" fontWeight={600}>{pendingExpense.reference}</Typography>
                            </Box>
                        ) : null}
                    </Stack>
                }
                confirmLabel="Post Expense"
                loading={processing}
                onCancel={() => setPendingExpense(null)}
                onConfirm={() => {
                    setPendingExpense(null);
                    void postExpensePayment();
                }}
            />

            <ConfirmModal
                open={Boolean(pendingAction)}
                title={pendingActionTitle}
                summary={
                    <Stack spacing={1.25}>
                        {pendingAction?.type === "deposit" && pendingDepositKind === "loan_repayment" ? (
                            <>
                                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary">Member</Typography>
                                    <Typography variant="body2" fontWeight={600}>{pendingLoanMember?.full_name || "Unknown"}</Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary">Loan</Typography>
                                    <Typography variant="body2" fontWeight={600}>{pendingLoan?.loan_number || "Unknown"}</Typography>
                                </Box>
                            </>
                        ) : pendingAction?.type === "deposit" && pendingDepositKind === "membership_fee" ? (
                            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                <Typography variant="body2" color="text.secondary">Member</Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {pendingFeePayer ? `${pendingFeePayer.full_name}${pendingFeePayer.member_no ? ` (${pendingFeePayer.member_no})` : ""}` : "Unknown"}
                                </Typography>
                            </Box>
                        ) : pendingAction?.type === "deposit" && pendingDepositKind === "fee_revenue" ? (
                            <>
                                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary">Fee / revenue rule</Typography>
                                    <Typography variant="body2" fontWeight={600}>{pendingFeeRule?.name || pendingAction?.values.fee_rule_code || "Unknown"}</Typography>
                                </Box>
                                {pendingFeePayer ? (
                                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                        <Typography variant="body2" color="text.secondary">Member</Typography>
                                        <Typography variant="body2" fontWeight={600}>{pendingFeePayer.full_name}</Typography>
                                    </Box>
                                ) : null}
                            </>
                        ) : (
                            <>
                                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary">Member</Typography>
                                    <Typography variant="body2" fontWeight={600}>{selectedMember?.full_name || "Unknown"}</Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary">Account</Typography>
                                    <Typography variant="body2" fontWeight={600}>{selectedAccount?.account_number || "Unknown"}</Typography>
                                </Box>
                            </>
                        )}
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 2,
                                px: 1.5,
                                py: 1,
                                borderRadius: 1.5,
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">Amount</Typography>
                            <Typography variant="h5" fontWeight={800} sx={{ fontVariantNumeric: "tabular-nums" }}>
                                {formatCurrency(pendingAction?.values.amount)}
                            </Typography>
                        </Box>
                        {pendingAction?.values.value_date ? (
                            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                <Typography variant="body2" color="text.secondary">Value date (backdated)</Typography>
                                <Typography variant="body2" fontWeight={600} color="warning.main">{formatDate(pendingAction.values.value_date)}</Typography>
                            </Box>
                        ) : null}
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">Reference</Typography>
                            <Typography variant="body2" fontWeight={600}>{pendingAction?.values.reference || "N/A"}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">Receipt</Typography>
                            <Typography variant="body2" fontWeight={600}>{pendingAction?.receiptFile?.name || "No receipt attached"}</Typography>
                        </Box>
                        {receiptNeededForPendingAction && !pendingAction?.receiptFile ? (
                            <Alert severity="warning" variant="outlined">
                                This transaction needs a receipt before it can be posted.
                            </Alert>
                        ) : null}
                    </Stack>
                }
                confirmLabel={
                    pendingAction?.type === "withdraw"
                        ? "Post Withdrawal"
                        : pendingAction?.type === "share_contribution"
                            ? "Post Share Contribution"
                            : pendingDepositKind === "loan_repayment"
                                ? "Post Repayment"
                                : pendingDepositKind === "membership_fee"
                                    ? "Post Membership Fee"
                                    : pendingDepositKind === "fee_revenue"
                                        ? "Post Fee / Revenue"
                                        : "Post Deposit"
                }
                loading={processing}
                onCancel={() => {
                    setPendingAction(null);
                }}
                onConfirm={() => void confirmAction()}
            />
        </Stack>
    );
}
