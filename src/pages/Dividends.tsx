import { MotionCard, MotionModal } from "../ui/motion";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import PolicyOutlinedIcon from "@mui/icons-material/PolicyOutlined";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControlLabel,
    Grid,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "../auth/AuthContext";
import { AppLoader } from "../components/AppLoader";
import { DataTable, type Column } from "../components/DataTable";
import { useToast } from "../components/Toast";
import { api, getApiErrorMessage } from "../lib/api";
import {
    endpoints,
    type CreateDividendCycleRequest,
    type CreateManualDividendBatchRequest,
    type DividendApprovalRequest,
    type DividendCycleDetailResponse,
    type DividendCyclesResponse,
    type DividendFormulaTemplate,
    type DividendFormulaTemplatesResponse,
    type DividendOptionsResponse,
    type DividendPaymentRequest,
    type DividendPoolSuggestion,
    type DividendPoolSuggestionResponse,
    type FormulaDividendComponentInput,
    type GenerateFormulaManualDividendBatchRequest,
    type ManualDividendBatchDetailResponse,
    type ManualDividendBatchesResponse,
    type RejectManualDividendBatchRequest
} from "../lib/endpoints";
import type { DividendAllocation, DividendComponent, DividendCycle, DividendSnapshot, ManualDividendBatch, ManualDividendBatchRow } from "../types/api";
import { formatCurrency, formatDate, formatRole } from "../utils/format";

const componentFormSchema = z.object({
    type: z.enum(["share_dividend", "savings_interest_bonus", "patronage_refund"]),
    basis_method: z.enum([
        "end_balance",
        "average_daily_balance",
        "average_monthly_balance",
        "minimum_balance",
        "total_interest_paid",
        "total_fees_paid",
        "transaction_volume"
    ]),
    distribution_mode: z.enum(["rate", "fixed_pool"]),
    rate_percent: z.coerce.number().min(0).max(100).optional(),
    pool_amount: z.coerce.number().min(0).optional(),
    retained_earnings_account_id: z.string().uuid(),
    dividends_payable_account_id: z.string().uuid(),
    payout_account_id: z.string().uuid().optional().or(z.literal("")),
    reserve_account_id: z.string().uuid().optional().or(z.literal("")),
    active_only: z.enum(["true", "false"]).default("true"),
    min_membership_months: z.coerce.number().min(0).default(0),
    minimum_shares: z.coerce.number().min(0).default(0),
    max_par_days: z.coerce.number().min(0).default(0),
    min_contributions_count: z.coerce.number().min(0).default(0),
    require_kyc_completed: z.enum(["true", "false"]).default("false"),
    exclude_suspended_exited: z.enum(["true", "false"]).default("true"),
    rounding_increment: z.coerce.number().min(1).default(1),
    minimum_payout_threshold: z.coerce.number().min(0).default(0),
    max_payout_cap: z.coerce.number().min(0).default(0),
    residual_handling: z.enum(["carry_to_retained_earnings", "allocate_pro_rata", "allocate_to_reserve"]).default("carry_to_retained_earnings")
}).superRefine((value, ctx) => {
    if (value.distribution_mode === "rate" && value.rate_percent === undefined) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["rate_percent"],
            message: "Rate is required for RATE mode."
        });
    }

    if (value.distribution_mode === "fixed_pool" && value.pool_amount === undefined) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["pool_amount"],
            message: "Pool amount is required for FIXED POOL mode."
        });
    }
});

const createCycleSchema = z.object({
    branch_id: z.string().uuid().optional().or(z.literal("")),
    period_label: z.string().min(3),
    start_date: z.string().min(1),
    end_date: z.string().min(1),
    declaration_date: z.string().min(1),
    record_date: z.string().optional().or(z.literal("")),
    payment_date: z.string().optional().or(z.literal("")),
    required_checker_count: z.coerce.number().int().min(1).max(5),
    components: z.array(componentFormSchema).min(1)
});

type CreateCycleFormValues = z.infer<typeof createCycleSchema>;

// Dividend sources are no longer limited to UTT/loan/other — a SACCO invests in
// NMB shares, CRDB shares, bonds, fixed deposits, etc. and distributes that
// income too. These are the curated picks; the backend accepts any label.
const DIVIDEND_SOURCE_OPTIONS = [
    { value: "utt", label: "UTT dividend" },
    { value: "loan", label: "Loan interest" },
    { value: "nmb", label: "NMB shares" },
    { value: "crdb", label: "CRDB shares" },
    { value: "shares", label: "Other shares" },
    { value: "bond", label: "Bonds" },
    { value: "fixed_deposit", label: "Fixed deposit" },
    { value: "other", label: "Other" }
] as const;

const manualDividendRowSchema = z.object({
    member_id: z.string().uuid(),
    dividend_date: z.string().min(1),
    dividend_label: z.string().min(2),
    source_type: z.string().min(1).default("utt"),
    amount: z.coerce.number().positive(),
    reference: z.string().optional().or(z.literal("")),
    destination_account_type: z.enum(["savings", "shares"]).default("savings"),
    notes: z.string().optional().or(z.literal(""))
});

const manualDividendBatchSchema = z.object({
    branch_id: z.string().uuid().optional().or(z.literal("")),
    batch_label: z.string().min(3),
    rows: z.array(manualDividendRowSchema).min(1)
});

type ManualDividendBatchFormValues = z.infer<typeof manualDividendBatchSchema>;

const defaultComponent = (): CreateCycleFormValues["components"][number] => ({
    type: "share_dividend",
    basis_method: "average_daily_balance",
    distribution_mode: "rate",
    rate_percent: 10,
    pool_amount: undefined,
    retained_earnings_account_id: "",
    dividends_payable_account_id: "",
    payout_account_id: "",
    reserve_account_id: "",
    active_only: "true",
    min_membership_months: 0,
    minimum_shares: 0,
    max_par_days: 0,
    min_contributions_count: 0,
    require_kyc_completed: "false",
    exclude_suspended_exited: "true",
    rounding_increment: 1,
    minimum_payout_threshold: 0,
    max_payout_cap: 0,
    residual_handling: "carry_to_retained_earnings"
});

const defaultManualDividendRow = (): ManualDividendBatchFormValues["rows"][number] => ({
    member_id: "",
    dividend_date: "",
    dividend_label: "",
    source_type: "utt",
    amount: 0,
    reference: "",
    destination_account_type: "savings",
    notes: ""
});

const todayDate = () => new Date().toISOString().slice(0, 10);

const defaultFormulaComponent = (): FormulaDividendComponentInput => ({
    key: "POOL-1",
    dividend_label: "Current dividend",
    dividend_date: todayDate(),
    source_type: "utt",
    base_method: "contributions_to_date",
    base_cutoff_date: todayDate(),
    pool_amount: 0
});

const defaultFormulaDraft = () => ({
    branch_id: "",
    batch_label: "Current dividend disbursement",
    template_id: "",
    template_name: "Savings pro-rata dividend",
    save_as_template: true,
    components: [defaultFormulaComponent()]
});

type FormulaDividendDraft = ReturnType<typeof defaultFormulaDraft>;

function MetricCard({
    label,
    value,
    helper,
    icon
}: {
    label: string;
    value: string;
    helper: string;
    icon: React.ReactNode;
}) {
    return (
        <MotionCard variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
                <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Box>
                        <Typography variant="overline" color="text.secondary">
                            {label}
                        </Typography>
                        <Typography variant="h5" sx={{ mt: 0.5 }}>
                            {value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                            {helper}
                        </Typography>
                    </Box>
                    <Box sx={{ color: "primary.main" }}>{icon}</Box>
                </Stack>
            </CardContent>
        </MotionCard>
    );
}

function parseCsv(text: string): Array<Record<string, string>> {
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length < 2) {
        return [];
    }

    const splitCsvLine = (line: string) => {
        const values: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let index = 0; index < line.length; index += 1) {
            const char = line[index];
            const nextChar = line[index + 1];

            if (char === "\"") {
                if (inQuotes && nextChar === "\"") {
                    current += "\"";
                    index += 1;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === "," && !inQuotes) {
                values.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }

        values.push(current.trim());
        return values.map((value) => value.replace(/^"(.*)"$/, "$1").trim());
    };

    const headers = splitCsvLine(lines[0]);

    return lines.slice(1).map((line) => {
        const values = splitCsvLine(line);
        return headers.reduce<Record<string, string>>((record, header, index) => {
            record[header] = values[index] || "";
            return record;
        }, {});
    });
}

interface DistributionPreview {
    as_of_date: string | null;
    member_count: number;
    eligible_count: number;
    without_savings_account: number;
    total_basis: number;
    pool: number;
    allocated_total: number;
    rows: {
        member_id: string;
        member_no: string;
        full_name: string;
        savings_account_id: string | null;
        basis: number;
        share_percent: number;
        amount: number;
    }[];
}

interface DistributionResult {
    reference: string;
    pool: number;
    total_basis: number;
    posted_count: number;
    posted_total: number;
    skipped: { member_no: string; full_name: string; amount: number; reason: string }[];
    failed: { member_no: string; full_name: string; amount: number; reason: string }[];
}

/** "2026-08-31" -> { code: "AUG2026", label: "August 2026" } — the batch
 * reference format already on the book. */
function monthCode(isoDate: string): { code: string; label: string } {
    const short = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const long = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const [year, month] = isoDate.split("-").map(Number);
    const index = (month || 1) - 1;
    return {
        code: `${short[index] ?? "JAN"}${year}`,
        label: `${long[index] ?? "January"} ${year}`
    };
}

export function DividendsPage() {
    const theme = useTheme();
    const { pushToast } = useToast();
    const { profile, selectedTenantId, selectedTenantName } = useAuth();
    const [cycles, setCycles] = useState<DividendCycle[]>([]);
    const [manualBatches, setManualBatches] = useState<ManualDividendBatch[]>([]);
    const [formulaTemplates, setFormulaTemplates] = useState<DividendFormulaTemplate[]>([]);
    const [manualDetail, setManualDetail] = useState<ManualDividendBatchDetailResponse["data"] | null>(null);
    const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
    const [selectedCycleDetail, setSelectedCycleDetail] = useState<DividendCycleDetailResponse["data"] | null>(null);
    const [options, setOptions] = useState<DividendOptionsResponse["data"] | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showManualDialog, setShowManualDialog] = useState(false);
    const [showFormulaDialog, setShowFormulaDialog] = useState(false);
    const [showManualDetailDialog, setShowManualDetailDialog] = useState(false);
    const [actionDialog, setActionDialog] = useState<null | {
        type: "approve" | "reject";
    }>(null);
    const [manualActionDialog, setManualActionDialog] = useState<null | {
        type: "post" | "reject";
        batch: ManualDividendBatch;
    }>(null);
    const [actionNotes, setActionNotes] = useState("");
    const [manualActionNotes, setManualActionNotes] = useState("");
    const [formulaDraft, setFormulaDraft] = useState<FormulaDividendDraft>(() => defaultFormulaDraft());
    const importInputRef = useRef<HTMLInputElement | null>(null);

    const canManageCycles = Boolean(profile?.role === "branch_manager");
    const canApproveAndPay = Boolean(profile?.role === "super_admin");

    const form = useForm<CreateCycleFormValues>({
        resolver: zodResolver(createCycleSchema),
        defaultValues: {
            branch_id: "",
            period_label: "",
            start_date: "",
            end_date: "",
            declaration_date: "",
            record_date: "",
            payment_date: "",
            required_checker_count: 1,
            components: [defaultComponent()]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "components"
    });

    const manualForm = useForm<ManualDividendBatchFormValues>({
        resolver: zodResolver(manualDividendBatchSchema),
        defaultValues: {
            branch_id: "",
            batch_label: "",
            rows: [defaultManualDividendRow()]
        }
    });

    const {
        fields: manualRows,
        append: appendManualRow,
        remove: removeManualRow
    } = useFieldArray({
        control: manualForm.control,
        name: "rows"
    });

    const loadCycles = async () => {
        if (!selectedTenantId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const [{ data: cyclesResponse }, { data: manualBatchesResponse }, { data: formulaTemplatesResponse }, { data: optionsResponse }] = await Promise.all([
                api.get<DividendCyclesResponse>(endpoints.dividends.cycles(), {
                    params: { tenant_id: selectedTenantId, page: 1, limit: 100 }
                }),
                api.get<ManualDividendBatchesResponse>(endpoints.dividends.manualBatches(), {
                    params: { tenant_id: selectedTenantId, page: 1, limit: 100 }
                }),
                api.get<DividendFormulaTemplatesResponse>(endpoints.dividends.formulaTemplates(), {
                    params: { tenant_id: selectedTenantId }
                }),
                api.get<DividendOptionsResponse>(endpoints.dividends.options())
            ]);

            setCycles(cyclesResponse.data || []);
            setManualBatches(manualBatchesResponse.data || []);
            setFormulaTemplates(formulaTemplatesResponse.data || []);
            setOptions(optionsResponse.data);
            setSelectedCycleId((current) => current || cyclesResponse.data?.[0]?.id || null);
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to load dividend workspace",
                message: getApiErrorMessage(error)
            });
        } finally {
            setLoading(false);
        }
    };

    const loadCycleDetail = async (cycleId: string) => {
        try {
            const { data } = await api.get<DividendCycleDetailResponse>(endpoints.dividends.cycle(cycleId));
            setSelectedCycleDetail(data.data);
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to load cycle detail",
                message: getApiErrorMessage(error)
            });
        }
    };

    const loadManualBatchDetail = async (batch: ManualDividendBatch) => {
        try {
            const { data } = await api.get<ManualDividendBatchDetailResponse>(endpoints.dividends.manualBatch(batch.id));
            setManualDetail(data.data);
            setShowManualDetailDialog(true);
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to load manual dividend batch",
                message: getApiErrorMessage(error)
            });
        }
    };

    useEffect(() => {
        void loadCycles();
    }, [selectedTenantId]);

    useEffect(() => {
        if (selectedCycleId) {
            void loadCycleDetail(selectedCycleId);
        } else {
            setSelectedCycleDetail(null);
        }
    }, [selectedCycleId]);

    const accountOptions = options?.accounts || [];
    const branchOptions = options?.branches || [];
    const memberOptions = options?.members || [];

    const branchCodeMap = useMemo(() => new Map(
        branchOptions.map((branch) => [branch.code.trim().toLowerCase(), branch.id])
    ), [branchOptions]);

    const memberLabelMap = useMemo(() => new Map(
        memberOptions.map((member) => [member.id, `${member.member_no || "NO-ID"} - ${member.full_name}`])
    ), [memberOptions]);

    const accountCodeMap = useMemo(() => new Map(
        accountOptions.map((account) => [account.account_code.trim().toLowerCase(), account.id])
    ), [accountOptions]);

    const summary = useMemo(() => ({
        total: cycles.length,
        draft: cycles.filter((cycle) => cycle.status === "draft").length,
        approved: cycles.filter((cycle) => cycle.status === "approved").length,
        paid: cycles.filter((cycle) => cycle.status === "paid" || cycle.status === "closed").length
    }), [cycles]);

    const approvalQueue = useMemo(
        () => cycles.filter((cycle) => cycle.status === "allocated" && cycle.submitted_for_approval_at),
        [cycles]
    );

    const manualSummary = useMemo(() => ({
        draft: manualBatches.filter((batch) => batch.status === "draft").length,
        submitted: manualBatches.filter((batch) => batch.status === "submitted").length,
        posted: manualBatches.filter((batch) => batch.status === "posted").length,
        totalPendingAmount: manualBatches
            .filter((batch) => ["draft", "submitted"].includes(batch.status))
            .reduce((sum, batch) => sum + Number(batch.total_amount || 0), 0)
    }), [manualBatches]);

    const formulaPoolTotal = useMemo(
        () => formulaDraft.components.reduce((sum, component) => sum + Number(component.pool_amount || 0), 0),
        [formulaDraft.components]
    );

    const allocationNameMap = useMemo(() => {
        const map = new Map<string, string>();
        (selectedCycleDetail?.snapshots || []).forEach((snapshot) => {
            const memberName = typeof snapshot.snapshot_json?.member_name === "string"
                ? snapshot.snapshot_json.member_name
                : snapshot.member_id;
            map.set(snapshot.member_id, memberName);
        });
        return map;
    }, [selectedCycleDetail?.snapshots]);

    const cycleColumns: Column<DividendCycle>[] = [
        { key: "period", header: "Period", render: (row) => row.period_label },
        { key: "status", header: "Status", render: (row) => <Chip size="small" label={row.status.toUpperCase()} color={row.status === "approved" ? "success" : row.status === "paid" || row.status === "closed" ? "primary" : "default"} /> },
        { key: "dates", header: "Window", render: (row) => `${formatDate(row.start_date)} - ${formatDate(row.end_date)}` },
        { key: "version", header: "Version", render: (row) => `v${row.config_version}` },
        { key: "action", header: "Action", render: (row) => <Button size="small" variant="outlined" onClick={() => setSelectedCycleId(row.id)}>Open</Button> }
    ];

    const allocationColumns: Column<DividendAllocation>[] = [
        { key: "member", header: "Member", render: (row) => allocationNameMap.get(row.member_id) || row.member_id },
        { key: "basis", header: "Basis", render: (row) => formatCurrency(row.basis_value) },
        { key: "payout", header: "Payout", render: (row) => formatCurrency(row.payout_amount) },
        { key: "status", header: "Status", render: (row) => row.status },
        { key: "paid_at", header: "Paid At", render: (row) => row.paid_at ? formatDate(row.paid_at) : "Pending" }
    ];

    const manualRowColumns: Column<ManualDividendBatchRow>[] = [
        { key: "date", header: "Date", render: (row) => formatDate(row.dividend_date) },
        { key: "member", header: "Member", render: (row) => row.member ? `${row.member.member_no || "NO-ID"} - ${row.member.full_name}` : row.member_id },
        { key: "dividend", header: "Dividend", render: (row) => row.dividend_label },
        { key: "source", header: "Source", render: (row) => row.source_type.toUpperCase() },
        { key: "amount", header: "Amount", render: (row) => formatCurrency(row.amount) },
        { key: "destination", header: "Destination", render: (row) => row.destination_account_type },
        { key: "reference", header: "Reference", render: (row) => row.reference },
        { key: "status", header: "Status", render: (row) => row.status }
    ];

    const submitCreateCycle = form.handleSubmit(async (values) => {
        if (!selectedTenantId) {
            return;
        }

        setSubmitting(true);

        try {
            const payload: CreateDividendCycleRequest = {
                tenant_id: selectedTenantId,
                branch_id: values.branch_id || null,
                period_label: values.period_label,
                start_date: values.start_date,
                end_date: values.end_date,
                declaration_date: values.declaration_date,
                record_date: values.record_date || values.end_date,
                payment_date: values.payment_date || null,
                required_checker_count: values.required_checker_count,
                components: values.components.map((component) => ({
                    type: component.type,
                    basis_method: component.basis_method,
                    distribution_mode: component.distribution_mode,
                    rate_percent: component.distribution_mode === "rate" ? Number(component.rate_percent || 0) : null,
                    pool_amount: component.distribution_mode === "fixed_pool" ? Number(component.pool_amount || 0) : null,
                    retained_earnings_account_id: component.retained_earnings_account_id,
                    dividends_payable_account_id: component.dividends_payable_account_id,
                    payout_account_id: component.payout_account_id || null,
                    reserve_account_id: component.reserve_account_id || null,
                    eligibility_rules_json: {
                        active_only: component.active_only === "true",
                        min_membership_months: Number(component.min_membership_months || 0),
                        minimum_shares: Number(component.minimum_shares || 0),
                        max_par_days: Number(component.max_par_days || 0),
                        min_contributions_count: Number(component.min_contributions_count || 0),
                        require_kyc_completed: component.require_kyc_completed === "true",
                        exclude_suspended_exited: component.exclude_suspended_exited === "true"
                    },
                    rounding_rules_json: {
                        rounding_increment: Number(component.rounding_increment || 1),
                        minimum_payout_threshold: Number(component.minimum_payout_threshold || 0),
                        max_payout_cap: Number(component.max_payout_cap || 0),
                        residual_handling: component.residual_handling
                    }
                }))
            };

            const { data } = await api.post<DividendCycleDetailResponse>(endpoints.dividends.cycles(), payload);
            pushToast({
                type: "success",
                title: "Dividend cycle created",
                message: `${data.data.cycle.period_label} was created in draft mode.`
            });
            setShowCreateDialog(false);
            form.reset({
                branch_id: "",
                period_label: "",
                start_date: "",
                end_date: "",
                declaration_date: "",
                record_date: "",
                payment_date: "",
                required_checker_count: 1,
                components: [defaultComponent()]
            });
            await loadCycles();
            setSelectedCycleId(data.data.cycle.id);
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to create dividend cycle",
                message: getApiErrorMessage(error)
            });
        } finally {
            setSubmitting(false);
        }
    });

    const submitManualDividendBatch = manualForm.handleSubmit(async (values) => {
        if (!selectedTenantId) {
            return;
        }

        setSubmitting(true);

        try {
            const payload: CreateManualDividendBatchRequest = {
                tenant_id: selectedTenantId,
                branch_id: values.branch_id || null,
                batch_label: values.batch_label,
                rows: values.rows.map((row) => ({
                    member_id: row.member_id,
                    dividend_date: row.dividend_date,
                    dividend_label: row.dividend_label,
                    source_type: row.source_type,
                    amount: Number(row.amount || 0),
                    reference: row.reference || null,
                    destination_account_type: row.destination_account_type,
                    notes: row.notes || null
                }))
            };

            const { data } = await api.post<ManualDividendBatchDetailResponse>(endpoints.dividends.manualBatches(), payload);
            pushToast({
                type: "success",
                title: "Manual dividend batch created",
                message: `${data.data.batch.batch_label} was saved as a draft.`
            });
            setShowManualDialog(false);
            manualForm.reset({
                branch_id: "",
                batch_label: "",
                rows: [defaultManualDividendRow()]
            });
            await loadCycles();
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to create manual dividend batch",
                message: getApiErrorMessage(error)
            });
        } finally {
            setSubmitting(false);
        }
    });

    const runCycleAction = async (type: "freeze" | "allocate" | "submit" | "approve" | "reject") => {
        if (!selectedCycleId) {
            return;
        }

        setSubmitting(true);

        try {
            if (type === "freeze") {
                await api.post(endpoints.dividends.freeze(selectedCycleId));
            } else if (type === "allocate") {
                await api.post(endpoints.dividends.allocate(selectedCycleId));
            } else if (type === "submit") {
                await api.post(endpoints.dividends.submit(selectedCycleId));
            } else if (type === "approve") {
                const payload: DividendApprovalRequest = { notes: actionNotes || null };
                await api.post(endpoints.dividends.approve(selectedCycleId), payload);
                const paymentPayload: DividendPaymentRequest = {
                    payment_method: "reinvest_to_shares",
                    reference: `AUTO-DIV-${Date.now()}`,
                    description: actionNotes || "Auto payment triggered immediately after approval."
                };
                await api.post(endpoints.dividends.pay(selectedCycleId), paymentPayload);
                await api.post(endpoints.dividends.close(selectedCycleId));
            } else if (type === "reject") {
                const payload: DividendApprovalRequest = { notes: actionNotes || null };
                await api.post(endpoints.dividends.reject(selectedCycleId), payload);
            }

            pushToast({
                type: "success",
                title: type === "approve" ? "Dividend cycle approved and completed" : "Dividend cycle updated",
                message: type === "approve"
                    ? "Approval, payment posting, and close completed in one step."
                    : `The cycle action ${type} completed successfully.`
            });
            setActionDialog(null);
            setActionNotes("");
            await loadCycles();
            await loadCycleDetail(selectedCycleId);
        } catch (error) {
            pushToast({
                type: "error",
                title: "Dividend action failed",
                message: getApiErrorMessage(error)
            });
        } finally {
            setSubmitting(false);
        }
    };

    const runManualBatchAction = async (batch: ManualDividendBatch, type: "submit" | "post" | "reject") => {
        setSubmitting(true);

        try {
            if (type === "submit") {
                await api.post<ManualDividendBatchDetailResponse>(endpoints.dividends.submitManualBatch(batch.id));
            } else if (type === "post") {
                await api.post<ManualDividendBatchDetailResponse>(endpoints.dividends.postManualBatch(batch.id));
            } else {
                const payload: RejectManualDividendBatchRequest = { notes: manualActionNotes || null };
                await api.post<ManualDividendBatchDetailResponse>(endpoints.dividends.rejectManualBatch(batch.id), payload);
            }

            pushToast({
                type: "success",
                title: type === "post" ? "Manual dividends posted" : "Manual dividend batch updated",
                message: type === "post"
                    ? `${batch.batch_label} was posted to member accounts and ledger.`
                    : `${batch.batch_label} was ${type === "submit" ? "submitted" : "rejected"}.`
            });
            setManualActionDialog(null);
            setManualActionNotes("");
            await loadCycles();
        } catch (error) {
            pushToast({
                type: "error",
                title: "Manual dividend action failed",
                message: getApiErrorMessage(error)
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Share a pool across members in proportion to their position -- the Excel's
    // DJ/total*pool. Preview writes nothing, so the figures can be checked
    // against the spreadsheet before a shilling moves.
    const [showDistributeDialog, setShowDistributeDialog] = useState(false);
    const [distAsOf, setDistAsOf] = useState("");
    const [distPool, setDistPool] = useState("");

    // Income earned since members were last paid. Fetched with no dates so the
    // server anchors the window itself — the period a SACCO wants to share out
    // is almost always "since the last gawio", and that was the one period the
    // screen made you look up and type by hand.
    const [earned, setEarned] = useState<DividendPoolSuggestion | null>(null);
    const [earnedError, setEarnedError] = useState<string | null>(null);

    const [distReference, setDistReference] = useState("");
    const [distDescription, setDistDescription] = useState("");
    const [distPreview, setDistPreview] = useState<DistributionPreview | null>(null);
    const [distBusy, setDistBusy] = useState(false);
    const [distError, setDistError] = useState<string | null>(null);
    const [distResult, setDistResult] = useState<DistributionResult | null>(null);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const { data } = await api.get<DividendPoolSuggestionResponse>(
                    endpoints.dividends.poolSuggestion()
                );
                if (cancelled) return;
                setEarned(data.data);
                setEarnedError(null);

                // Fill the batch fields from the period. The format is already
                // fixed — July's postings carry DIV-LOANS-JUL2026, with the
                // member number appended per row by the posting procedure — so
                // typing it again is transcription, and a typo here is a batch
                // nobody can find afterwards.
                //
                // Only ever fills blanks: anything already typed is the
                // operator's, and a fetch completing must not overwrite it.
                const period = monthCode(data.data.end_date);
                setDistAsOf((current) => current || data.data.end_date);
                setDistReference((current) => current || `DIV-LOANS-${period.code}`);
                setDistDescription(
                    (current) => current || `DIV (Loans ${period.label})`
                );
            } catch (error) {
                // Not a toast: this is a convenience on a screen that works
                // without it, and a red banner on open would suggest the
                // distribution itself is broken.
                if (!cancelled) setEarnedError(getApiErrorMessage(error));
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const openDistributeDialog = () => {
        setShowDistributeDialog(true);
        setDistPreview(null);
        setDistResult(null);
        setDistError(null);
    };

    const runDistributionPreview = async () => {
        setDistBusy(true);
        setDistError(null);
        setDistResult(null);
        try {
            const { data } = await api.get<{ data: DistributionPreview }>(endpoints.dividends.distributionPreview(), {
                params: { as_of_date: distAsOf, pool_amount: Number(distPool) }
            });
            setDistPreview(data.data);
        } catch (previewError) {
            setDistPreview(null);
            setDistError(getApiErrorMessage(previewError));
        } finally {
            setDistBusy(false);
        }
    };

    const commitDistribution = async () => {
        setDistBusy(true);
        setDistError(null);
        try {
            const { data } = await api.post<{ data: DistributionResult }>(endpoints.dividends.distribution(), {
                as_of_date: distAsOf,
                pool_amount: Number(distPool),
                reference: distReference.trim(),
                description: distDescription.trim(),
                value_date: distAsOf
            });
            setDistResult(data.data);
            setDistPreview(null);
            pushToast({
                type: "success",
                title: "Dividend distributed",
                message: `${data.data.posted_count} member(s) credited with ${formatCurrency(data.data.posted_total)}.`
            });
        } catch (commitError) {
            setDistError(getApiErrorMessage(commitError));
        } finally {
            setDistBusy(false);
        }
    };

    const openFormulaDividendDialog = () => {
        setFormulaDraft((current) => ({
            ...current,
            branch_id: current.branch_id || branchOptions[0]?.id || ""
        }));
        setShowFormulaDialog(true);
    };

    const applyFormulaTemplate = (templateId: string) => {
        const template = formulaTemplates.find((item) => item.id === templateId);
        if (!template) {
            setFormulaDraft((current) => ({
                ...current,
                template_id: "",
                components: current.components.length ? current.components : [defaultFormulaComponent()]
            }));
            return;
        }

        setFormulaDraft((current) => ({
            ...current,
            template_id: template.id,
            template_name: template.template_name,
            branch_id: template.branch_id || current.branch_id || branchOptions[0]?.id || "",
            batch_label: template.template_name,
            save_as_template: false,
            components: template.components.length ? template.components.map((component) => ({ ...component })) : [defaultFormulaComponent()]
        }));
    };

    const [poolSuggestionRange, setPoolSuggestionRange] = useState(() => {
        const end = todayDate();
        const start = `${end.slice(0, 7)}-01`;
        return { start, end };
    });
    const [poolSuggestion, setPoolSuggestion] = useState<DividendPoolSuggestion | null>(null);
    const [loadingPoolSuggestion, setLoadingPoolSuggestion] = useState(false);

    const fetchPoolSuggestion = async () => {
        setLoadingPoolSuggestion(true);
        try {
            const { data } = await api.get<DividendPoolSuggestionResponse>(endpoints.dividends.poolSuggestion(), {
                params: { start_date: poolSuggestionRange.start, end_date: poolSuggestionRange.end }
            });
            setPoolSuggestion(data.data);
        } catch (error) {
            pushToast({ type: "error", title: "Unable to load suggested pool", message: getApiErrorMessage(error) });
        } finally {
            setLoadingPoolSuggestion(false);
        }
    };

    const updateFormulaComponent = (
        index: number,
        patch: Partial<FormulaDividendDraft["components"][number]>
    ) => {
        setFormulaDraft((current) => ({
            ...current,
            components: current.components.map((component, componentIndex) => (
                componentIndex === index ? { ...component, ...patch } : component
            ))
        }));
    };

    const addFormulaComponent = () => {
        setFormulaDraft((current) => ({
            ...current,
            components: [
                ...current.components,
                {
                    ...defaultFormulaComponent(),
                    key: `POOL-${current.components.length + 1}`
                }
            ]
        }));
    };

    const removeFormulaComponent = (index: number) => {
        setFormulaDraft((current) => ({
            ...current,
            components: current.components.filter((_, componentIndex) => componentIndex !== index)
        }));
    };

    const generateFormulaDividendBatch = async () => {
        if (!selectedTenantId) {
            return;
        }

        if (!formulaDraft.branch_id) {
            pushToast({
                type: "error",
                title: "Branch required",
                message: "Choose the branch whose active members should receive this formula dividend batch."
            });
            return;
        }

        setSubmitting(true);

        try {
            const payload: GenerateFormulaManualDividendBatchRequest = {
                tenant_id: selectedTenantId,
                branch_id: formulaDraft.branch_id,
                batch_label: formulaDraft.batch_label || "Current dividend disbursement",
                template_id: formulaDraft.template_id || undefined,
                save_as_template: formulaDraft.save_as_template,
                template_name: formulaDraft.save_as_template ? formulaDraft.template_name : undefined,
                components: formulaDraft.components.map((component) => ({
                    key: component.key,
                    dividend_date: component.dividend_date,
                    dividend_label: component.dividend_label,
                    source_type: component.source_type || "other",
                    base_method: component.base_method || "balance_at_cutoff",
                    base_cutoff_date: component.base_cutoff_date,
                    pool_amount: Number(component.pool_amount || 0)
                }))
            };

            const { data } = await api.post<ManualDividendBatchDetailResponse>(endpoints.dividends.formulaManualBatch(), payload);

            setManualDetail(data.data);
            setShowFormulaDialog(false);
            setShowManualDetailDialog(true);
            pushToast({
                type: "success",
                title: "Formula dividend batch generated",
                message: `${data.data.batch.batch_label} created with ${data.data.rows.length} row(s), total ${formatCurrency(data.data.batch.total_amount)}.`
            });
            await loadCycles();
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to generate formula dividends",
                message: getApiErrorMessage(error)
            });
        } finally {
            setSubmitting(false);
        }
    };

    const manualBatchColumns: Column<ManualDividendBatch>[] = [
        { key: "label", header: "Batch", render: (row) => row.batch_label },
        {
            key: "source",
            header: "Source",
            render: (row) => row.source_format === "reusable_formula"
                ? "Reusable formula"
                : row.source_format === "excel_details_sorted_formula"
                    ? "DETAILS formula"
                    : "Manual"
        },
        {
            key: "status",
            header: "Status",
            render: (row) => (
                <Chip
                    size="small"
                    label={row.status.toUpperCase()}
                    color={row.status === "posted" ? "success" : row.status === "submitted" ? "warning" : row.status === "rejected" ? "error" : "default"}
                />
            )
        },
        { key: "rows", header: "Rows", render: (row) => row.row_count },
        { key: "total", header: "Total", render: (row) => formatCurrency(row.total_amount) },
        { key: "created", header: "Created", render: (row) => formatDate(row.created_at) },
        {
            key: "action",
            header: "Action",
            render: (row) => (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button size="small" variant="outlined" onClick={() => void loadManualBatchDetail(row)} disabled={submitting}>
                        Review
                    </Button>
                    {canManageCycles && row.status === "draft" ? (
                        <Button size="small" variant="outlined" onClick={() => void runManualBatchAction(row, "submit")} disabled={submitting}>
                            Submit
                        </Button>
                    ) : null}
                    {canApproveAndPay && row.status === "submitted" ? (
                        <>
                            <Button size="small" variant="contained" onClick={() => setManualActionDialog({ type: "post", batch: row })} disabled={submitting}>
                                Post
                            </Button>
                            <Button size="small" variant="outlined" color="inherit" onClick={() => setManualActionDialog({ type: "reject", batch: row })} disabled={submitting}>
                                Reject
                            </Button>
                        </>
                    ) : null}
                    {row.status === "posted" && row.posted_at ? (
                        <Typography variant="caption" color="text.secondary">
                            Posted {formatDate(row.posted_at)}
                        </Typography>
                    ) : null}
                </Stack>
            )
        }
    ];

    const openImportPicker = () => {
        importInputRef.current?.click();
    };

    const importCsvTemplate = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) {
            return;
        }

        if (!accountOptions.length) {
            pushToast({
                type: "error",
                title: "Dividend options not ready",
                message: "Load the dividend workspace first so account mappings are available."
            });
            return;
        }

        try {
            const text = await file.text();
            const rows = parseCsv(text);

            if (!rows.length) {
                throw new Error("The CSV file does not contain any data rows.");
            }

            const firstRow = rows[0];
            const branchCode = firstRow.branch_code?.trim().toLowerCase() || "";
            const branchId = branchCode ? branchCodeMap.get(branchCode) || "" : "";

            if (branchCode && !branchId) {
                throw new Error(`Branch code "${firstRow.branch_code}" was not found in this tenant.`);
            }

            const importedComponents = rows.map((row, index) => {
                const retainedAccountId = accountCodeMap.get((row.retained_earnings_account_code || "").trim().toLowerCase());
                const dividendsPayableAccountId = accountCodeMap.get((row.dividends_payable_account_code || "").trim().toLowerCase());
                const payoutAccountId = row.payout_account_code
                    ? accountCodeMap.get(row.payout_account_code.trim().toLowerCase()) || ""
                    : "";
                const reserveAccountId = row.reserve_account_code
                    ? accountCodeMap.get(row.reserve_account_code.trim().toLowerCase()) || ""
                    : "";

                if (!retainedAccountId) {
                    throw new Error(`Row ${index + 2}: retained earnings account code "${row.retained_earnings_account_code}" was not found.`);
                }

                if (!dividendsPayableAccountId) {
                    throw new Error(`Row ${index + 2}: dividends payable account code "${row.dividends_payable_account_code}" was not found.`);
                }

                if (row.payout_account_code && !payoutAccountId) {
                    throw new Error(`Row ${index + 2}: payout account code "${row.payout_account_code}" was not found.`);
                }

                if (row.reserve_account_code && !reserveAccountId) {
                    throw new Error(`Row ${index + 2}: reserve account code "${row.reserve_account_code}" was not found.`);
                }

                return {
                    type: row.component_type as CreateCycleFormValues["components"][number]["type"],
                    basis_method: row.basis_method as CreateCycleFormValues["components"][number]["basis_method"],
                    distribution_mode: row.distribution_mode as CreateCycleFormValues["components"][number]["distribution_mode"],
                    rate_percent: row.rate_percent ? Number(row.rate_percent) : undefined,
                    pool_amount: row.pool_amount ? Number(row.pool_amount) : undefined,
                    retained_earnings_account_id: retainedAccountId,
                    dividends_payable_account_id: dividendsPayableAccountId,
                    payout_account_id: payoutAccountId,
                    reserve_account_id: reserveAccountId,
                    active_only: (String(row.active_only || "true").toLowerCase() === "false" ? "false" : "true") as "true" | "false",
                    min_membership_months: Number(row.min_membership_months || 0),
                    minimum_shares: Number(row.minimum_shares || 0),
                    max_par_days: Number(row.max_par_days || 0),
                    min_contributions_count: Number(row.min_contributions_count || 0),
                    require_kyc_completed: (String(row.require_kyc_completed || "false").toLowerCase() === "true" ? "true" : "false") as "true" | "false",
                    exclude_suspended_exited: (String(row.exclude_suspended_exited || "true").toLowerCase() === "false" ? "false" : "true") as "true" | "false",
                    rounding_increment: Number(row.rounding_increment || 1),
                    minimum_payout_threshold: Number(row.minimum_payout_threshold || 0),
                    max_payout_cap: Number(row.max_payout_cap || 0),
                    residual_handling: (row.residual_handling || "carry_to_retained_earnings") as CreateCycleFormValues["components"][number]["residual_handling"]
                };
            });

            form.reset({
                branch_id: branchId,
                period_label: firstRow.period_label || "",
                start_date: firstRow.start_date || "",
                end_date: firstRow.end_date || "",
                declaration_date: firstRow.declaration_date || "",
                record_date: firstRow.record_date || "",
                payment_date: firstRow.payment_date || "",
                required_checker_count: Number(firstRow.required_checker_count || 1),
                components: importedComponents
            });

            setShowCreateDialog(true);
            pushToast({
                type: "success",
                title: "Dividend CSV imported",
                message: `${rows.length} component row(s) loaded into the cycle form.`
            });
        } catch (error) {
            pushToast({
                type: "error",
                title: "Unable to import dividend CSV",
                message: error instanceof Error ? error.message : "The CSV file could not be parsed."
            });
        }
    };

    const selectedCycle = selectedCycleDetail?.cycle;

    return (
        <Stack spacing={3}>
            <MotionCard
                variant="outlined"
                sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.background.paper, 0.94)})`
                }}
            >
                <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                        <Box>
                            <Typography variant="h5">Dividend Administration</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 840 }}>
                                Branch managers prepare dividend cycles and freeze auditable balance snapshots. Tenant super admins approve, pay, and close the cycle under maker-checker control.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                            <input
                                ref={importInputRef}
                                type="file"
                                accept=".csv,text/csv"
                                hidden
                                onChange={(event) => void importCsvTemplate(event)}
                            />
                            {canManageCycles ? (
                                <>
                                    <Button variant="contained" startIcon={<AddCircleOutlineRoundedIcon />} onClick={openDistributeDialog}>
                                        Distribute Dividend
                                    </Button>
                                    <Button variant="outlined" color="secondary" startIcon={<AddCircleOutlineRoundedIcon />} onClick={openFormulaDividendDialog}>
                                        Generate Formula Batch
                                    </Button>
                                </>
                            ) : null}
                            <Chip label={selectedTenantName || "Tenant workspace"} variant="outlined" />
                            <Chip label={`Role: ${profile ? formatRole(profile.role) : "Setup"}`} variant="outlined" />
                        </Stack>
                    </Stack>
                </CardContent>
            </MotionCard>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <MetricCard label="Cycles" value={String(summary.total)} helper="Dividend runs created for this tenant." icon={<PolicyOutlinedIcon />} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <MetricCard label="Draft / Frozen" value={`${summary.draft}`} helper="Cycles still being configured or snapshotted." icon={<MonetizationOnOutlinedIcon />} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <MetricCard label="Approved" value={`${summary.approved}`} helper="Liability declared and waiting payment." icon={<CheckCircleOutlineRoundedIcon />} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <MetricCard label="Paid / Closed" value={`${summary.paid}`} helper="Completed dividend payout cycles." icon={<PaidOutlinedIcon />} />
                </Grid>
            </Grid>

            <MotionCard variant="outlined">
                <CardContent>
                    <Stack spacing={2}>
                        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                            <Box>
                                <Typography variant="h6">Formula Dividend Batches</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    DETAILS (sorted) formula dividends using savings balances at each cutoff date, staged by branch manager before super admin posting.
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip label={`${manualSummary.draft} draft`} variant="outlined" />
                                <Chip label={`${manualSummary.submitted} submitted`} color={manualSummary.submitted ? "warning" : "default"} variant="outlined" />
                                <Chip label={`${manualSummary.posted} posted`} color={manualSummary.posted ? "success" : "default"} variant="outlined" />
                                <Chip label={`${formatCurrency(manualSummary.totalPendingAmount)} pending`} variant="outlined" />
                            </Stack>
                        </Stack>
                        <DataTable rows={manualBatches} columns={manualBatchColumns} emptyMessage="No formula dividend batches yet." />
                    </Stack>
                </CardContent>
            </MotionCard>

            {profile?.role === "super_admin" ? (
                <MotionCard variant="outlined">
                    <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                            <Box>
                                <Typography variant="h6">Approval Queue</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Dividend cycles submitted by branch managers and waiting for tenant super admin review.
                                </Typography>
                            </Box>
                            <Chip label={`${approvalQueue.length} waiting`} color={approvalQueue.length ? "warning" : "default"} />
                        </Stack>
                        <Stack spacing={1.25} sx={{ mt: 2 }}>
                            {approvalQueue.length ? approvalQueue.map((cycle) => (
                                <Box
                                    key={cycle.id}
                                    sx={{
                                        p: 1.5,
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: 2,
                                        display: "flex",
                                        flexDirection: { xs: "column", md: "row" },
                                        alignItems: { xs: "flex-start", md: "center" },
                                        justifyContent: "space-between",
                                        gap: 1.5
                                    }}
                                >
                                    <Box>
                                        <Typography variant="subtitle2">{cycle.period_label}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Submitted {formatDate(cycle.submitted_for_approval_at || cycle.created_at)} • {formatDate(cycle.start_date)} - {formatDate(cycle.end_date)}
                                        </Typography>
                                    </Box>
                                    <Button size="small" variant="outlined" onClick={() => setSelectedCycleId(cycle.id)}>
                                        Review Queue Item
                                    </Button>
                                </Box>
                            )) : (
                                <Alert severity="info" variant="outlined">
                                    No dividend cycles are currently waiting for super admin approval.
                                </Alert>
                            )}
                        </Stack>
                    </CardContent>
                </MotionCard>
            ) : null}

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, xl: 5 }}>
                    <MotionCard variant="outlined">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Dividend Cycles
                            </Typography>
                            {loading ? (
                                <AppLoader fullscreen={false} minHeight={260} message="Loading dividend cycles..." />
                            ) : (
                                <DataTable rows={cycles} columns={cycleColumns} emptyMessage="No dividend cycles yet." />
                            )}
                        </CardContent>
                    </MotionCard>
                </Grid>
                <Grid size={{ xs: 12, xl: 7 }}>
                    <MotionCard variant="outlined" sx={{ height: "100%" }}>
                        <CardContent>
                            {selectedCycle ? (
                                <Stack spacing={2.5}>
                                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                                        <Box>
                                            <Typography variant="h6">{selectedCycle.period_label}</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                {formatDate(selectedCycle.start_date)} - {formatDate(selectedCycle.end_date)} • Version {selectedCycle.config_version}
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                            <Chip label={selectedCycle.status.toUpperCase()} color={selectedCycle.status === "approved" ? "success" : selectedCycle.status === "paid" || selectedCycle.status === "closed" ? "primary" : "default"} />
                                            <Chip label={`${selectedCycle.required_checker_count} checker(s)`} variant="outlined" />
                                            {selectedCycle.status === "allocated" && selectedCycle.submitted_for_approval_at ? (
                                                <Chip label="Waiting for Super Admin Approval" color="warning" variant="filled" />
                                            ) : null}
                                        </Stack>
                                    </Stack>

                                    <Grid container spacing={1.5}>
                                        {[
                                            ["Declaration", formatDate(selectedCycle.declaration_date)],
                                            ["Record", formatDate(selectedCycle.record_date || selectedCycle.end_date)],
                                            ["Payment", selectedCycle.payment_date ? formatDate(selectedCycle.payment_date) : "Planned later"],
                                            ["Config Hash", selectedCycle.config_hash.slice(0, 12)]
                                        ].map(([label, value]) => (
                                            <Grid key={label} size={{ xs: 12, sm: 6 }}>
                                                <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                                                    <Typography variant="body2" sx={{ mt: 0.5 }}>{value}</Typography>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>

                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        {selectedCycle.status === "draft" && canManageCycles ? (
                                            <Button variant="outlined" onClick={() => void runCycleAction("freeze")} disabled={submitting}>
                                                Freeze Snapshot
                                            </Button>
                                        ) : null}
                                        {selectedCycle.status === "frozen" && canManageCycles ? (
                                            <Button variant="outlined" onClick={() => void runCycleAction("allocate")} disabled={submitting}>
                                                Generate Allocations
                                            </Button>
                                        ) : null}
                                        {selectedCycle.status === "allocated" && canManageCycles && !selectedCycle.submitted_for_approval_at ? (
                                            <Button variant="contained" onClick={() => void runCycleAction("submit")} disabled={submitting}>
                                                Submit for Approval
                                            </Button>
                                        ) : null}
                                        {selectedCycle.status === "allocated" && canApproveAndPay ? (
                                            <>
                                                <Button variant="contained" onClick={() => setActionDialog({ type: "approve" })} disabled={submitting}>
                                                    Approve Cycle
                                                </Button>
                                                <Button variant="outlined" color="inherit" onClick={() => setActionDialog({ type: "reject" })} disabled={submitting}>
                                                    Reject For Rework
                                                </Button>
                                            </>
                                        ) : null}
                                    </Stack>

                                    <Divider />

                                    <Box>
                                        <Typography variant="subtitle1">Configured Components</Typography>
                                        <Stack spacing={1.25} sx={{ mt: 1.25 }}>
                                            {(selectedCycleDetail?.components || []).map((component: DividendComponent) => (
                                                <Box key={component.id} sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {component.type}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                        {component.basis_method} • {component.distribution_mode} • {component.distribution_mode === "rate"
                                                            ? `${component.rate_percent}%`
                                                            : formatCurrency(component.pool_amount)}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Box>
                                </Stack>
                            ) : (
                                <Alert severity="info" variant="outlined">
                                    Select a dividend cycle to review snapshots, allocations, approvals, and payment progress.
                                </Alert>
                            )}
                        </CardContent>
                    </MotionCard>
                </Grid>
            </Grid>

            {selectedCycleDetail ? (
                <MotionCard variant="outlined">
                    <CardContent>
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="h6">Allocation Register</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Auditable member allocation results for the selected cycle.
                                </Typography>
                            </Box>
                            <DataTable rows={selectedCycleDetail.allocations} columns={allocationColumns} emptyMessage="No allocations generated yet." />
                        </Stack>
                    </CardContent>
                </MotionCard>
            ) : null}

            <MotionModal open={showDistributeDialog} onClose={distBusy ? undefined : () => setShowDistributeDialog(false)} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Distribute Dividend</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ mt: 0.5 }}>
                        {distError ? <Alert severity="error" variant="outlined">{distError}</Alert> : null}
                        <Alert severity="info" variant="outlined">
                            Each member receives their share of the pool in proportion to their position on the
                            chosen date — lifetime contributions plus dividends already received, net of
                            withdrawals. Nothing is posted until you confirm the preview.
                        </Alert>

                        {earned && earned.loan_interest > 0 ? (
                            <Alert
                                severity="info"
                                variant="outlined"
                                action={
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => {
                                            setDistPool(String(earned.loan_interest));
                                            setDistPreview(null);
                                        }}
                                    >
                                        Use this
                                    </Button>
                                }
                            >
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                    {formatCurrency(earned.loan_interest)} loan interest earned
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {formatDate(earned.start_date)} to {formatDate(earned.end_date)}
                                    {earned.complete_month_only ? " · whole months only, so the current month is not counted" : ""}
                                </Typography>
                                {/* UTT is keyed in by hand, so it is named but never added
                                    into the figure the button posts — a pool should only
                                    ever be filled with something the SACCO actually put
                                    there. */}
                                {earned.treasury_income > 0 ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        UTT/treasury recorded for this period: {formatCurrency(earned.treasury_income)}. Add it to the pool yourself if this gawio includes it.
                                    </Typography>
                                ) : null}
                            </Alert>
                        ) : earned ? (
                            <Alert severity="info" variant="outlined">
                                No loan interest recorded between {formatDate(earned.start_date)} and {formatDate(earned.end_date)}
                                {earned.last_dividend_date ? `, the period since the gawio of ${formatDate(earned.last_dividend_date)}` : ""}.
                            </Alert>
                        ) : earnedError ? (
                            <Alert severity="warning" variant="outlined">
                                Couldn&apos;t work out what has been earned since the last gawio ({earnedError}). Enter the pool by hand.
                            </Alert>
                        ) : null}

                        <Grid container spacing={1.5}>
                            <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                    type="date"
                                    label="Position as at"
                                    value={distAsOf}
                                    onChange={(event) => { setDistAsOf(event.target.value); setDistPreview(null); }}
                                    InputLabelProps={{ shrink: true }}
                                    helperText="Anything posted after this date is ignored"
                                    fullWidth
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                    label="Pool to share (TSh)"
                                    value={distPool}
                                    onChange={(event) => { setDistPool(event.target.value.replace(/[^\d.]/g, "")); setDistPreview(null); }}
                                    inputProps={{ inputMode: "decimal" }}
                                    fullWidth
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                    label="Batch reference"
                                    value={distReference}
                                    onChange={(event) => setDistReference(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
                                    placeholder="DIV-LOANS-JUL2026"
                                    helperText="Each member's posting is tagged with this"
                                    fullWidth
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                    label="Description"
                                    value={distDescription}
                                    onChange={(event) => setDistDescription(event.target.value)}
                                    placeholder="DIV (Loans July 2026)"
                                    fullWidth
                                />
                            </Grid>
                        </Grid>

                        <Box>
                            <Button
                                variant="outlined"
                                onClick={() => void runDistributionPreview()}
                                disabled={distBusy || !distAsOf || !(Number(distPool) > 0)}
                            >
                                {distBusy ? "Working..." : "Preview allocation"}
                            </Button>
                        </Box>

                        {distResult ? (
                            <Alert severity="success" variant="outlined">
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                    {distResult.posted_count} member(s) credited with {formatCurrency(distResult.posted_total)}
                                </Typography>
                                {distResult.skipped.length ? (
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        Skipped {distResult.skipped.length}: {distResult.skipped.slice(0, 3).map((row) => `${row.member_no} (${row.reason})`).join("; ")}
                                        {distResult.skipped.length > 3 ? "…" : ""}
                                    </Typography>
                                ) : null}
                                {distResult.failed.length ? (
                                    <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700 }}>
                                        Failed {distResult.failed.length}: {distResult.failed.slice(0, 3).map((row) => `${row.member_no} (${row.reason})`).join("; ")}
                                    </Typography>
                                ) : null}
                            </Alert>
                        ) : null}

                        {distPreview ? (
                            <>
                                <Grid container spacing={1.5}>
                                    {[
                                        ["Members", String(distPreview.member_count)],
                                        ["Total position", formatCurrency(distPreview.total_basis)],
                                        ["Pool", formatCurrency(distPreview.pool)],
                                        ["Allocated", formatCurrency(distPreview.allocated_total)]
                                    ].map(([label, value]) => (
                                        <Grid key={label} size={{ xs: 6, md: 3 }}>
                                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                                <Typography variant="caption" color="text.secondary">{label}</Typography>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{value}</Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>

                                {distPreview.without_savings_account ? (
                                    <Alert severity="warning" variant="outlined">
                                        {distPreview.without_savings_account} member(s) hold a position but have no open savings
                                        account, so they cannot be credited. They are listed below with their share and will be
                                        reported as skipped.
                                    </Alert>
                                ) : null}

                                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 380 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Member</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>Position</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>Share</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>Dividend</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {distPreview.rows.map((row, index) => (
                                                <TableRow key={row.member_id} hover>
                                                    <TableCell sx={{ color: "text.secondary" }}>{index + 1}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.full_name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {row.member_no}{row.savings_account_id ? "" : " · no savings account"}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>{formatCurrency(row.basis)}</TableCell>
                                                    <TableCell align="right">{row.share_percent.toFixed(4)}%</TableCell>
                                                    <TableCell align="right" sx={{ whiteSpace: "nowrap", fontWeight: 700 }}>{formatCurrency(row.amount)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        ) : null}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDistributeDialog(false)} disabled={distBusy}>Close</Button>
                    <Button
                        variant="contained"
                        onClick={() => void commitDistribution()}
                        disabled={distBusy || !distPreview || !distReference.trim() || distDescription.trim().length < 3}
                    >
                        {distBusy ? "Posting..." : `Post ${distPreview ? formatCurrency(distPreview.allocated_total) : "dividend"}`}
                    </Button>
                </DialogActions>
            </MotionModal>

            <MotionModal open={showFormulaDialog} onClose={submitting ? undefined : () => setShowFormulaDialog(false)} maxWidth="lg" fullWidth>
                <DialogTitle>Generate Dividend Formula Batch</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2.5}>
                        <Alert severity="info" variant="outlined">
                            Formula: member savings balance at cutoff / total branch savings at cutoff * dividend pool. This creates a draft only; Super Admin posting is still required before ledger and member savings are updated.
                        </Alert>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    select
                                    label="Saved formula"
                                    fullWidth
                                    value={formulaDraft.template_id}
                                    onChange={(event) => applyFormulaTemplate(event.target.value)}
                                >
                                    <MenuItem value="">New / one-time formula</MenuItem>
                                    {formulaTemplates.map((template) => (
                                        <MenuItem key={template.id} value={template.id}>
                                            {template.template_name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    label="Batch label"
                                    fullWidth
                                    value={formulaDraft.batch_label}
                                    onChange={(event) => setFormulaDraft((current) => ({ ...current, batch_label: event.target.value }))}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    select
                                    label="Branch scope"
                                    fullWidth
                                    value={formulaDraft.branch_id}
                                    onChange={(event) => setFormulaDraft((current) => ({ ...current, branch_id: event.target.value }))}
                                >
                                    {branchOptions.map((branch) => (
                                        <MenuItem key={branch.id} value={branch.id}>
                                            {branch.code} - {branch.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    label="Formula name"
                                    fullWidth
                                    value={formulaDraft.template_name}
                                    onChange={(event) => setFormulaDraft((current) => ({ ...current, template_name: event.target.value }))}
                                    helperText="Used when saving this formula for later."
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControlLabel
                                    control={(
                                        <Checkbox
                                            checked={formulaDraft.save_as_template}
                                            onChange={(event) => setFormulaDraft((current) => ({
                                                ...current,
                                                save_as_template: event.target.checked,
                                                template_id: event.target.checked ? "" : current.template_id
                                            }))}
                                        />
                                    )}
                                    label="Save this formula for reuse"
                                />
                            </Grid>
                        </Grid>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip label={`${formulaDraft.components.length} pool component(s)`} variant="outlined" />
                            <Chip label={`${formatCurrency(formulaPoolTotal)} total pool`} variant="outlined" color="primary" />
                            <Chip label="Posts to savings accounts" variant="outlined" color="success" />
                        </Stack>

                        <Card variant="outlined">
                            <CardContent>
                                <Stack spacing={1.5}>
                                    <Typography variant="subtitle2">Suggested pool from recorded income</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Loan interest collected plus treasury/UTT income for the period — use it to fill the pool amounts instead of a hand-kept ledger.
                                    </Typography>
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                                        <TextField
                                            label="From"
                                            type="date"
                                            size="small"
                                            value={poolSuggestionRange.start}
                                            onChange={(event) => setPoolSuggestionRange((current) => ({ ...current, start: event.target.value }))}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                        <TextField
                                            label="To"
                                            type="date"
                                            size="small"
                                            value={poolSuggestionRange.end}
                                            onChange={(event) => setPoolSuggestionRange((current) => ({ ...current, end: event.target.value }))}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                        <Button size="small" variant="outlined" onClick={fetchPoolSuggestion} disabled={loadingPoolSuggestion}>
                                            {loadingPoolSuggestion ? "Loading…" : "Fetch income"}
                                        </Button>
                                    </Stack>
                                    {poolSuggestion ? (
                                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                                            <Chip size="small" variant="outlined" label={`Loan interest: ${formatCurrency(poolSuggestion.loan_interest)}`} />
                                            <Chip size="small" variant="outlined" label={`UTT/treasury income: ${formatCurrency(poolSuggestion.treasury_income)}`} />
                                            <Chip size="small" color="primary" label={`Total available: ${formatCurrency(poolSuggestion.total)}`} />
                                        </Stack>
                                    ) : null}
                                </Stack>
                            </CardContent>
                        </Card>

                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1">Dividend Pools</Typography>
                            <Button size="small" variant="outlined" onClick={addFormulaComponent} startIcon={<AddCircleOutlineRoundedIcon />}>
                                Add Pool
                            </Button>
                        </Stack>

                        <Grid container spacing={1.5}>
                            {formulaDraft.components.map((component, index) => (
                                <Grid key={`${component.key || "POOL"}-${index}`} size={{ xs: 12, md: 6 }}>
                                    <Card variant="outlined" sx={{ height: "100%" }}>
                                        <CardContent>
                                            <Stack spacing={1.5}>
                                                <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center">
                                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                        <Chip size="small" label={component.key || `POOL-${index + 1}`} />
                                                        <Chip
                                                            size="small"
                                                            label={component.base_method === "contributions_to_date" ? "Contribution basis" : "Savings basis"}
                                                            variant="outlined"
                                                        />
                                                    </Stack>
                                                    {formulaDraft.components.length > 1 ? (
                                                        <Button size="small" color="inherit" onClick={() => removeFormulaComponent(index)}>
                                                            Remove
                                                        </Button>
                                                    ) : null}
                                                </Stack>

                                                <TextField
                                                    label="Dividend label"
                                                    size="small"
                                                    fullWidth
                                                    value={component.dividend_label || ""}
                                                    onChange={(event) => updateFormulaComponent(index, { dividend_label: event.target.value })}
                                                />

                                                <Grid container spacing={1}>
                                                    <Grid size={{ xs: 12, sm: 6 }}>
                                                        <TextField
                                                            label="Dividend date"
                                                            type="date"
                                                            size="small"
                                                            fullWidth
                                                            value={component.dividend_date || ""}
                                                            onChange={(event) => updateFormulaComponent(index, { dividend_date: event.target.value })}
                                                            slotProps={{ inputLabel: { shrink: true } }}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6 }}>
                                                        <TextField
                                                            label="Pool amount"
                                                            type="number"
                                                            size="small"
                                                            fullWidth
                                                            value={component.pool_amount ?? 0}
                                                            onChange={(event) => updateFormulaComponent(index, { pool_amount: Number(event.target.value || 0) })}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6 }}>
                                                        <TextField
                                                            label="Savings cutoff"
                                                            type="date"
                                                            size="small"
                                                            fullWidth
                                                            value={component.base_cutoff_date || ""}
                                                            onChange={(event) => updateFormulaComponent(index, { base_cutoff_date: event.target.value })}
                                                            slotProps={{ inputLabel: { shrink: true } }}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6 }}>
                                                        <TextField
                                                            select
                                                            label="Dividend source"
                                                            size="small"
                                                            fullWidth
                                                            value={component.source_type || "utt"}
                                                            onChange={(event) => updateFormulaComponent(index, { source_type: event.target.value })}
                                                        >
                                                            {DIVIDEND_SOURCE_OPTIONS.map((option) => (
                                                                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                                            ))}
                                                        </TextField>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6 }}>
                                                        <TextField
                                                            select
                                                            label="Allocation basis"
                                                            size="small"
                                                            fullWidth
                                                            value={component.base_method || "balance_at_cutoff"}
                                                            onChange={(event) => updateFormulaComponent(index, { base_method: event.target.value as FormulaDividendComponentInput["base_method"] })}
                                                        >
                                                            <MenuItem value="contributions_to_date">Total contributions to cutoff</MenuItem>
                                                            <MenuItem value="balance_at_cutoff">Savings balance at cutoff</MenuItem>
                                                        </TextField>
                                                    </Grid>
                                                </Grid>

                                                <Typography variant="caption" color="text.secondary">
                                                    {component.base_method === "contributions_to_date"
                                                        ? `Formula: member contributions up to ${formatDate(component.base_cutoff_date)} / total contributions at cutoff * ${formatCurrency(component.pool_amount || 0)}. Prior dividends are excluded from the basis.`
                                                        : `Formula: member savings at ${formatDate(component.base_cutoff_date)} / total branch savings at cutoff * ${formatCurrency(component.pool_amount || 0)}.`}
                                                </Typography>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowFormulaDialog(false)} disabled={submitting} color="inherit">Cancel</Button>
                    <Button variant="contained" onClick={() => void generateFormulaDividendBatch()} disabled={submitting || !formulaDraft.branch_id}>
                        Generate Draft Batch
                    </Button>
                </DialogActions>
            </MotionModal>

            <MotionModal open={showManualDialog} onClose={submitting ? undefined : () => setShowManualDialog(false)} maxWidth="lg" fullWidth>
                <DialogTitle>Manual Dividend Entry</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={3} sx={{ pt: 0.5 }}>
                        {!memberOptions.length ? (
                            <Alert severity="warning" variant="outlined">
                                No active branch members are available for dividend entry.
                            </Alert>
                        ) : null}
                        <Box component="form" id="manual-dividend-form" onSubmit={submitManualDividendBatch} sx={{ display: "grid", gap: 2 }}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        label="Batch Label"
                                        fullWidth
                                        {...manualForm.register("batch_label")}
                                        error={Boolean(manualForm.formState.errors.batch_label)}
                                        helperText={manualForm.formState.errors.batch_label?.message || "Example: Nsanyiwa UTT and loan dividends"}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        select
                                        label="Branch Scope"
                                        fullWidth
                                        value={manualForm.watch("branch_id") || ""}
                                        onChange={(event) => manualForm.setValue("branch_id", event.target.value, { shouldValidate: true })}
                                    >
                                        <MenuItem value="">Use selected members branch</MenuItem>
                                        {branchOptions.map((branch) => (
                                            <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            </Grid>

                            <Divider />

                            <Stack spacing={2}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="subtitle1">Rows</Typography>
                                    <Button onClick={() => appendManualRow(defaultManualDividendRow())} startIcon={<AddCircleOutlineRoundedIcon />}>
                                        Add Row
                                    </Button>
                                </Stack>

                                {manualRows.map((row, index) => (
                                    <MotionCard key={row.id} variant="outlined">
                                        <CardContent>
                                            <Stack spacing={2}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="subtitle2">Dividend Row {index + 1}</Typography>
                                                    {manualRows.length > 1 ? (
                                                        <Button color="inherit" onClick={() => removeManualRow(index)}>Remove</Button>
                                                    ) : null}
                                                </Stack>
                                                <Grid container spacing={2}>
                                                    <Grid size={{ xs: 12, md: 4 }}>
                                                        <TextField
                                                            select
                                                            label="Member"
                                                            fullWidth
                                                            value={manualForm.watch(`rows.${index}.member_id`) || ""}
                                                            onChange={(event) => manualForm.setValue(`rows.${index}.member_id`, event.target.value, { shouldValidate: true })}
                                                            error={Boolean(manualForm.formState.errors.rows?.[index]?.member_id)}
                                                        >
                                                            {memberOptions.map((member) => (
                                                                <MenuItem key={member.id} value={member.id}>{memberLabelMap.get(member.id)}</MenuItem>
                                                            ))}
                                                        </TextField>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 3 }}>
                                                        <TextField
                                                            label="Date"
                                                            type="date"
                                                            fullWidth
                                                            InputLabelProps={{ shrink: true }}
                                                            {...manualForm.register(`rows.${index}.dividend_date`)}
                                                            error={Boolean(manualForm.formState.errors.rows?.[index]?.dividend_date)}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 5 }}>
                                                        <TextField
                                                            label="Dividend"
                                                            fullWidth
                                                            {...manualForm.register(`rows.${index}.dividend_label`)}
                                                            error={Boolean(manualForm.formState.errors.rows?.[index]?.dividend_label)}
                                                            helperText={manualForm.formState.errors.rows?.[index]?.dividend_label?.message}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 3 }}>
                                                        <TextField
                                                            select
                                                            label="Source"
                                                            fullWidth
                                                            value={manualForm.watch(`rows.${index}.source_type`) || "utt"}
                                                            onChange={(event) => manualForm.setValue(`rows.${index}.source_type`, event.target.value, { shouldValidate: true })}
                                                        >
                                                            {DIVIDEND_SOURCE_OPTIONS.map((option) => (
                                                                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                                            ))}
                                                        </TextField>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 3 }}>
                                                        <TextField
                                                            label="Amount"
                                                            type="number"
                                                            fullWidth
                                                            {...manualForm.register(`rows.${index}.amount`)}
                                                            error={Boolean(manualForm.formState.errors.rows?.[index]?.amount)}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 3 }}>
                                                        <TextField
                                                            select
                                                            label="Destination"
                                                            fullWidth
                                                            value={manualForm.watch(`rows.${index}.destination_account_type`) || "savings"}
                                                            onChange={(event) => manualForm.setValue(`rows.${index}.destination_account_type`, event.target.value as "savings" | "shares", { shouldValidate: true })}
                                                        >
                                                            <MenuItem value="savings">Savings</MenuItem>
                                                            <MenuItem value="shares">Shares</MenuItem>
                                                        </TextField>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 3 }}>
                                                        <TextField label="Reference" fullWidth {...manualForm.register(`rows.${index}.reference`)} />
                                                    </Grid>
                                                    <Grid size={{ xs: 12 }}>
                                                        <TextField label="Notes" fullWidth {...manualForm.register(`rows.${index}.notes`)} />
                                                    </Grid>
                                                </Grid>
                                            </Stack>
                                        </CardContent>
                                    </MotionCard>
                                ))}
                            </Stack>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setShowManualDialog(false)} disabled={submitting} color="inherit">Cancel</Button>
                    <Button form="manual-dividend-form" type="submit" variant="contained" disabled={submitting || !memberOptions.length}>
                        {submitting ? "Saving batch..." : "Save Draft"}
                    </Button>
                </DialogActions>
            </MotionModal>

            <MotionModal open={showManualDetailDialog} onClose={() => setShowManualDetailDialog(false)} maxWidth="lg" fullWidth>
                <DialogTitle>{manualDetail?.batch.batch_label || "Dividend Batch"}</DialogTitle>
                <DialogContent dividers>
                    {manualDetail ? (
                        <Stack spacing={2}>
                            <Grid container spacing={1.5}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                        <Typography variant="caption" color="text.secondary">Status</Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5 }}>{manualDetail.batch.status.toUpperCase()}</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                        <Typography variant="caption" color="text.secondary">Rows</Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5 }}>{manualDetail.batch.row_count}</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                        <Typography variant="caption" color="text.secondary">Total</Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5 }}>{formatCurrency(manualDetail.batch.total_amount)}</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                            {manualDetail.formula ? (
                                <Box>
                                    <Typography variant="subtitle1">Formula Components</Typography>
                                    <Grid container spacing={1.25} sx={{ mt: 1 }}>
                                        {manualDetail.formula.components.map((component) => (
                                            <Grid key={component.key} size={{ xs: 12, md: 6 }}>
                                                <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, height: "100%" }}>
                                                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {component.key} - {component.dividend_label}
                                                        </Typography>
                                                        <Chip size="small" label={component.source_type.toUpperCase()} variant="outlined" />
                                                    </Stack>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                                                        Base {component.base_column} at {formatDate(component.base_cutoff_date)}: {formatCurrency(component.base_total)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                                        Pool {component.pool_cell}: {formatCurrency(component.pool_amount)} across {component.generated_rows} member row(s)
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            ) : null}
                            <DataTable rows={manualDetail.rows} columns={manualRowColumns} emptyMessage="No dividend rows." />
                        </Stack>
                    ) : (
                        <AppLoader fullscreen={false} minHeight={180} message="Loading manual dividend rows..." />
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setShowManualDetailDialog(false)} color="inherit">Close</Button>
                    {manualDetail?.batch.status === "submitted" && canApproveAndPay ? (
                        <Button
                            variant="contained"
                            onClick={() => {
                                setShowManualDetailDialog(false);
                                setManualActionDialog({ type: "post", batch: manualDetail.batch });
                            }}
                        >
                            Post Batch
                        </Button>
                    ) : null}
                </DialogActions>
            </MotionModal>

            <MotionModal open={showCreateDialog} onClose={submitting ? undefined : () => setShowCreateDialog(false)} maxWidth="lg" fullWidth>
                <DialogTitle>Create Dividend Cycle</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={3} sx={{ pt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                            Create a new dividend cycle. After freeze, the configuration becomes immutable and any further change requires a new version.
                        </Typography>
                        <Box component="form" id="dividend-cycle-form" onSubmit={submitCreateCycle} sx={{ display: "grid", gap: 2 }}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField label="Period Label" fullWidth {...form.register("period_label")} error={Boolean(form.formState.errors.period_label)} helperText={form.formState.errors.period_label?.message || "Example: FY2025/2026"} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField select label="Branch Scope" fullWidth value={form.watch("branch_id") || ""} onChange={(event) => form.setValue("branch_id", event.target.value, { shouldValidate: true })} helperText="Optional. Leave blank for tenant-wide cycle.">
                                        <MenuItem value="">Tenant-wide</MenuItem>
                                        {branchOptions.map((branch) => (
                                            <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField label="Start Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...form.register("start_date")} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField label="End Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...form.register("end_date")} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField label="Declaration Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...form.register("declaration_date")} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField label="Record Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...form.register("record_date")} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField label="Planned Payment Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...form.register("payment_date")} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField label="Required Checker Count" type="number" fullWidth {...form.register("required_checker_count")} />
                                </Grid>
                            </Grid>

                            <Divider />

                            <Stack spacing={2}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="subtitle1">Dividend Components</Typography>
                                    <Button onClick={() => append(defaultComponent())} startIcon={<AddCircleOutlineRoundedIcon />}>
                                        Add Component
                                    </Button>
                                </Stack>

                                {fields.map((field, index) => (
                                    <MotionCard key={field.id} variant="outlined">
                                        <CardContent>
                                            <Stack spacing={2}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="subtitle2">Component {index + 1}</Typography>
                                                    {fields.length > 1 ? (
                                                        <Button color="inherit" onClick={() => remove(index)}>Remove</Button>
                                                    ) : null}
                                                </Stack>

                                                <Grid container spacing={2}>
                                                    <Grid size={{ xs: 12, md: 4 }}>
                                                        <TextField select label="Type" fullWidth value={form.watch(`components.${index}.type`)} onChange={(event) => form.setValue(`components.${index}.type`, event.target.value as CreateCycleFormValues["components"][number]["type"], { shouldValidate: true })}>
                                                            <MenuItem value="share_dividend">Share Dividend</MenuItem>
                                                            <MenuItem value="savings_interest_bonus">Savings Interest Bonus</MenuItem>
                                                            <MenuItem value="patronage_refund">Patronage Refund</MenuItem>
                                                        </TextField>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 4 }}>
                                                        <TextField select label="Basis Method" fullWidth value={form.watch(`components.${index}.basis_method`)} onChange={(event) => form.setValue(`components.${index}.basis_method`, event.target.value as CreateCycleFormValues["components"][number]["basis_method"], { shouldValidate: true })}>
                                                            <MenuItem value="end_balance">End Balance</MenuItem>
                                                            <MenuItem value="average_daily_balance">Average Daily Balance</MenuItem>
                                                            <MenuItem value="average_monthly_balance">Average Monthly Balance</MenuItem>
                                                            <MenuItem value="minimum_balance">Minimum Balance</MenuItem>
                                                            <MenuItem value="total_interest_paid">Total Interest Paid</MenuItem>
                                                            <MenuItem value="total_fees_paid">Total Fees Paid</MenuItem>
                                                            <MenuItem value="transaction_volume">Transaction Volume</MenuItem>
                                                        </TextField>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 4 }}>
                                                        <TextField select label="Distribution Mode" fullWidth value={form.watch(`components.${index}.distribution_mode`)} onChange={(event) => form.setValue(`components.${index}.distribution_mode`, event.target.value as CreateCycleFormValues["components"][number]["distribution_mode"], { shouldValidate: true })}>
                                                            <MenuItem value="rate">Rate</MenuItem>
                                                            <MenuItem value="fixed_pool">Fixed Pool</MenuItem>
                                                        </TextField>
                                                    </Grid>
                                                    {form.watch(`components.${index}.distribution_mode`) === "rate" ? (
                                                        <Grid size={{ xs: 12, md: 4 }}>
                                                            <TextField label="Rate %" type="number" fullWidth inputProps={{ min: 0, step: 0.01 }} {...form.register(`components.${index}.rate_percent`)} />
                                                        </Grid>
                                                    ) : (
                                                        <Grid size={{ xs: 12, md: 4 }}>
                                                            <TextField label="Pool Amount" type="number" fullWidth {...form.register(`components.${index}.pool_amount`)} />
                                                        </Grid>
                                                    )}
                                                    <Grid size={{ xs: 12, md: 4 }}>
                                                        <TextField select label="Retained Earnings Account" fullWidth value={form.watch(`components.${index}.retained_earnings_account_id`)} onChange={(event) => form.setValue(`components.${index}.retained_earnings_account_id`, event.target.value, { shouldValidate: true })}>
                                                            {accountOptions.map((account) => (
                                                                <MenuItem key={account.id} value={account.id}>{account.account_code} - {account.account_name}</MenuItem>
                                                            ))}
                                                        </TextField>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 4 }}>
                                                        <TextField select label="Dividends Payable Account" fullWidth value={form.watch(`components.${index}.dividends_payable_account_id`)} onChange={(event) => form.setValue(`components.${index}.dividends_payable_account_id`, event.target.value, { shouldValidate: true })}>
                                                            {accountOptions.map((account) => (
                                                                <MenuItem key={account.id} value={account.id}>{account.account_code} - {account.account_name}</MenuItem>
                                                            ))}
                                                        </TextField>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 4 }}>
                                                        <TextField select label="Payout Account" fullWidth value={form.watch(`components.${index}.payout_account_id`) || ""} onChange={(event) => form.setValue(`components.${index}.payout_account_id`, event.target.value, { shouldValidate: true })}>
                                                            <MenuItem value="">Not required now</MenuItem>
                                                            {accountOptions.map((account) => (
                                                                <MenuItem key={account.id} value={account.id}>{account.account_code} - {account.account_name}</MenuItem>
                                                            ))}
                                                        </TextField>
                                                    </Grid>
                                                </Grid>

                                                <Divider />

                                                <Typography variant="subtitle2">Eligibility & Rounding</Typography>
                                                <Grid container spacing={2}>
                                                    <Grid size={{ xs: 12, md: 3 }}>
                                                        <TextField select label="Active Members Only" fullWidth value={form.watch(`components.${index}.active_only`)} onChange={(event) => form.setValue(`components.${index}.active_only`, event.target.value as "true" | "false", { shouldValidate: true })}>
                                                            <MenuItem value="true">Yes</MenuItem>
                                                            <MenuItem value="false">No</MenuItem>
                                                        </TextField>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 3 }}>
                                                        <TextField label="Min Membership Months" type="number" fullWidth {...form.register(`components.${index}.min_membership_months`)} />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 3 }}>
                                                        <TextField label="Minimum Shares" type="number" fullWidth {...form.register(`components.${index}.minimum_shares`)} />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 3 }}>
                                                        <TextField label="Max PAR Days" type="number" fullWidth {...form.register(`components.${index}.max_par_days`)} />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 3 }}>
                                                        <TextField label="Min Contribution Count" type="number" fullWidth {...form.register(`components.${index}.min_contributions_count`)} />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 3 }}>
                                                        <TextField select label="Require KYC" fullWidth value={form.watch(`components.${index}.require_kyc_completed`)} onChange={(event) => form.setValue(`components.${index}.require_kyc_completed`, event.target.value as "true" | "false", { shouldValidate: true })}>
                                                            <MenuItem value="true">Yes</MenuItem>
                                                            <MenuItem value="false">No</MenuItem>
                                                        </TextField>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 3 }}>
                                                        <TextField select label="Exclude Suspended/Exited" fullWidth value={form.watch(`components.${index}.exclude_suspended_exited`)} onChange={(event) => form.setValue(`components.${index}.exclude_suspended_exited`, event.target.value as "true" | "false", { shouldValidate: true })}>
                                                            <MenuItem value="true">Yes</MenuItem>
                                                            <MenuItem value="false">No</MenuItem>
                                                        </TextField>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 3 }}>
                                                        <TextField label="Rounding Increment" type="number" fullWidth {...form.register(`components.${index}.rounding_increment`)} />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 4 }}>
                                                        <TextField label="Minimum Payout Threshold" type="number" fullWidth {...form.register(`components.${index}.minimum_payout_threshold`)} />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 4 }}>
                                                        <TextField label="Max Payout Cap" type="number" fullWidth {...form.register(`components.${index}.max_payout_cap`)} />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 4 }}>
                                                        <TextField select label="Residual Handling" fullWidth value={form.watch(`components.${index}.residual_handling`)} onChange={(event) => form.setValue(`components.${index}.residual_handling`, event.target.value as CreateCycleFormValues["components"][number]["residual_handling"], { shouldValidate: true })}>
                                                            <MenuItem value="carry_to_retained_earnings">Carry to Retained Earnings</MenuItem>
                                                            <MenuItem value="allocate_pro_rata">Allocate Pro Rata</MenuItem>
                                                            <MenuItem value="allocate_to_reserve">Allocate to Reserve</MenuItem>
                                                        </TextField>
                                                    </Grid>
                                                </Grid>
                                            </Stack>
                                        </CardContent>
                                    </MotionCard>
                                ))}
                            </Stack>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setShowCreateDialog(false)} disabled={submitting} color="inherit">Cancel</Button>
                    <Button form="dividend-cycle-form" type="submit" variant="contained" disabled={submitting}>
                        {submitting ? "Creating cycle..." : "Create Cycle"}
                    </Button>
                </DialogActions>
            </MotionModal>

            <MotionModal open={Boolean(actionDialog)} onClose={submitting ? undefined : () => setActionDialog(null)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {actionDialog?.type === "approve" ? "Approve Dividend Cycle" : "Reject Dividend Cycle"}
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ pt: 0.5 }}>
                        <TextField label="Notes" multiline minRows={4} fullWidth value={actionNotes} onChange={(event) => setActionNotes(event.target.value)} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setActionDialog(null)} disabled={submitting} color="inherit">Cancel</Button>
                    <Button
                        variant="contained"
                        disabled={submitting}
                        onClick={() => {
                            if (actionDialog?.type === "approve") {
                                void runCycleAction("approve");
                            } else if (actionDialog?.type === "reject") {
                                void runCycleAction("reject");
                            }
                        }}
                    >
                        {submitting ? "Working..." : "Confirm"}
                    </Button>
                </DialogActions>
            </MotionModal>

            <MotionModal open={Boolean(manualActionDialog)} onClose={submitting ? undefined : () => setManualActionDialog(null)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {manualActionDialog?.type === "post" ? "Post Manual Dividend Batch" : "Reject Manual Dividend Batch"}
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ pt: 0.5 }}>
                        <Alert severity={manualActionDialog?.type === "post" ? "warning" : "info"} variant="outlined">
                            {manualActionDialog?.type === "post"
                                ? `${manualActionDialog.batch.batch_label} will post ${formatCurrency(manualActionDialog.batch.total_amount)} to member accounts and ledger.`
                                : `${manualActionDialog?.batch.batch_label || "This batch"} will return to rejected status without posting ledger entries.`}
                        </Alert>
                        {manualActionDialog?.type === "reject" ? (
                            <TextField label="Notes" multiline minRows={4} fullWidth value={manualActionNotes} onChange={(event) => setManualActionNotes(event.target.value)} />
                        ) : null}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setManualActionDialog(null)} disabled={submitting} color="inherit">Cancel</Button>
                    <Button
                        variant="contained"
                        disabled={submitting || !manualActionDialog}
                        onClick={() => {
                            if (manualActionDialog?.type === "post") {
                                void runManualBatchAction(manualActionDialog.batch, "post");
                            } else if (manualActionDialog?.type === "reject") {
                                void runManualBatchAction(manualActionDialog.batch, "reject");
                            }
                        }}
                    >
                        {submitting ? "Working..." : "Confirm"}
                    </Button>
                </DialogActions>
            </MotionModal>
        </Stack>
    );
}
