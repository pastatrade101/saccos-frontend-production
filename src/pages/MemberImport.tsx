import { MotionCard, MotionModal } from "../ui/motion";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import FilePresentRoundedIcon from "@mui/icons-material/FilePresentRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControlLabel,
    Grid,
    LinearProgress,
    MenuItem,
    Pagination,
    Stack,
    Switch,
    TextField,
    Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { DataTable, type Column } from "../components/DataTable";
import { useToast } from "../components/Toast";
import { api, getApiErrorMessage } from "../lib/api";
import {
    endpoints,
    type BranchesListResponse,
    type CredentialsLinkResponse,
    type ImportJobResponse,
    type ImportJobRowsResponse,
    type ImportMembersResponse,
    type MemberDividendHistoryImportResponse,
    type MemberLoanHistoryImportResponse,
    type MemberShareHistoryImportResponse,
    type MemberSavingsHistoryImportResponse,
    type MembersResponse
} from "../lib/endpoints";
import type { Branch, ImportJob, ImportJobRow, Member } from "../types/api";
import { downloadFile, getFilenameFromDisposition } from "../utils/downloadFile";
import { formatDate } from "../utils/format";

const schema = z.object({
    default_branch_id: z.string().uuid().optional().or(z.literal("")),
    create_portal_account: z.boolean().default(false),
    update_existing_only: z.boolean().default(false),
    file: z
        .custom<FileList | null>((value) => value instanceof FileList || value === null)
        .refine((value) => value && value.length > 0, "CSV file is required.")
});

type FormValues = z.infer<typeof schema>;

function triggerSignedDownload(url: string) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
}

function SummaryCard({
    label,
    value,
    helper
}: {
    label: string;
    value: string;
    helper: string;
}) {
    return (
        <MotionCard variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
                <Typography variant="overline" color="text.secondary">
                    {label}
                </Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>
                    {value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {helper}
                </Typography>
            </CardContent>
        </MotionCard>
    );
}

export function MemberImportPage() {
    const location = useLocation();
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === "dark";
    const memberAccent = isDarkMode ? "#D9B273" : "#1FA8E6";
    const memberAccentStrong = isDarkMode ? "#C89B52" : "#0A0573";
    const { pushToast } = useToast();
    const { selectedTenantId, selectedBranchId } = useAuth();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [job, setJob] = useState<ImportJob | null>(null);
    const [failedRows, setFailedRows] = useState<ImportJobRow[]>([]);
    const [failedRowsTotal, setFailedRowsTotal] = useState(0);
    const [failedRowsPage, setFailedRowsPage] = useState(1);
    const [failedRowsLimit, setFailedRowsLimit] = useState(10);
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [loadingRows, setLoadingRows] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [historySubmitting, setHistorySubmitting] = useState(false);
    const [historyMemberId, setHistoryMemberId] = useState("");
    const [historyFile, setHistoryFile] = useState<File | null>(null);
    const [historyResult, setHistoryResult] = useState<MemberSavingsHistoryImportResponse["data"] | null>(null);
    const [shareSubmitting, setShareSubmitting] = useState(false);
    const [shareMemberId, setShareMemberId] = useState("");
    const [shareFile, setShareFile] = useState<File | null>(null);
    const [shareResult, setShareResult] = useState<MemberShareHistoryImportResponse["data"] | null>(null);
    const [loanSubmitting, setLoanSubmitting] = useState(false);
    const [loanMemberId, setLoanMemberId] = useState("");
    const [loanFile, setLoanFile] = useState<File | null>(null);
    const [loanResult, setLoanResult] = useState<MemberLoanHistoryImportResponse["data"] | null>(null);
    const [dividendSubmitting, setDividendSubmitting] = useState(false);
    const [dividendMemberId, setDividendMemberId] = useState("");
    const [dividendFile, setDividendFile] = useState<File | null>(null);
    const [dividendResult, setDividendResult] = useState<MemberDividendHistoryImportResponse["data"] | null>(null);
    const [credentialsUrl, setCredentialsUrl] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [importStage, setImportStage] = useState<"idle" | "uploading" | "processing">("idle");
    const [importStartedAt, setImportStartedAt] = useState<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const isUpdateExistingMode = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get("mode") === "update-existing";
    }, [location.search]);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            default_branch_id: selectedBranchId || "",
            create_portal_account: false,
            update_existing_only: isUpdateExistingMode,
            file: null
        }
    });

    const createPortalAccount = form.watch("create_portal_account");
    const updateExistingOnly = form.watch("update_existing_only");
    const selectedDefaultBranchId = form.watch("default_branch_id");
    const selectedFile = form.watch("file");
    const hasSingleBranch = branches.length <= 1;
    const selectedDefaultBranch = branches.find((branch) => branch.id === selectedDefaultBranchId) || branches[0] || null;
    const selectedHistoryMember = members.find((member) => member.id === historyMemberId) || null;
    const selectedShareMember = members.find((member) => member.id === shareMemberId) || null;
    const selectedLoanMember = members.find((member) => member.id === loanMemberId) || null;
    const selectedDividendMember = members.find((member) => member.id === dividendMemberId) || null;

    useEffect(() => {
        if (!submitting || !importStartedAt) {
            setElapsedSeconds(0);
            return;
        }

        const interval = window.setInterval(() => {
            setElapsedSeconds(Math.max(0, Math.floor((Date.now() - importStartedAt) / 1000)));
        }, 1000);

        return () => {
            window.clearInterval(interval);
        };
    }, [importStartedAt, submitting]);

    useEffect(() => {
        if (!selectedTenantId) {
            setBranches([]);
            setMembers([]);
            setLoadingBranches(false);
            setLoadingMembers(false);
            return;
        }

        setLoadingBranches(true);
        void api
            .get<BranchesListResponse>(endpoints.branches.list(), {
                params: { tenant_id: selectedTenantId, page: 1, limit: 100 }
            })
            .then(({ data }) => {
                setBranches(data.data || []);
            })
            .catch((error) => {
                pushToast({
                    type: "error",
                    title: "Branch load failed",
                    message: getApiErrorMessage(error)
                });
                setBranches([]);
            })
            .finally(() => {
                setLoadingBranches(false);
            });

        setLoadingMembers(true);
        void api
            .get<MembersResponse>(endpoints.members.list(), {
                params: {
                    tenant_id: selectedTenantId,
                    page: 1,
                    limit: 100,
                    status: "active"
                }
            })
            .then(({ data }) => {
                setMembers(data.data || []);
            })
            .catch((error) => {
                pushToast({
                    type: "error",
                    title: "Member load failed",
                    message: getApiErrorMessage(error)
                });
                setMembers([]);
            })
            .finally(() => {
                setLoadingMembers(false);
            });
    }, [pushToast, selectedTenantId]);

    useEffect(() => {
        const preferredBranchId = selectedBranchId || branches[0]?.id || "";
        const currentBranchId = form.getValues("default_branch_id");

        if (!currentBranchId && preferredBranchId) {
            form.setValue("default_branch_id", preferredBranchId);
        }
    }, [branches, form, selectedBranchId]);

    useEffect(() => {
        form.setValue("update_existing_only", isUpdateExistingMode);
        if (isUpdateExistingMode) {
            form.setValue("create_portal_account", false);
        }
    }, [form, isUpdateExistingMode]);

    const loadFailedRows = async (jobId: string, page = failedRowsPage, limit = failedRowsLimit) => {
        setLoadingRows(true);

        try {
            const { data } = await api.get<ImportJobRowsResponse>(endpoints.imports.memberJobRows(jobId), {
                params: {
                    status: "failed",
                    page,
                    limit
                }
            });

            setFailedRows(data.data.items || []);
            setFailedRowsTotal(data.data.total || 0);
        } catch (error) {
            pushToast({
                type: "error",
                title: "Failed rows unavailable",
                message: getApiErrorMessage(error)
            });
        } finally {
            setLoadingRows(false);
        }
    };

    useEffect(() => {
        if (!job) {
            return;
        }

        void loadFailedRows(job.id, failedRowsPage, failedRowsLimit);
    }, [failedRowsLimit, failedRowsPage, job]);

    useEffect(() => {
        if (!activeJobId) {
            return;
        }

        let cancelled = false;

        const poll = async () => {
            try {
                const { data } = await api.get<ImportJobResponse>(endpoints.imports.memberJob(activeJobId));

                if (cancelled) {
                    return;
                }

                setJob(data.data);

                if (data.data.status === "completed" || data.data.status === "failed") {
                    setSubmitting(false);
                    setImportStage("idle");
                    setImportStartedAt(null);
                    setActiveJobId(null);

                    if (createPortalAccount && data.data.success_rows > 0) {
                        try {
                            const credentialsResponse = await api.get<CredentialsLinkResponse>(endpoints.imports.memberJobCredentials(activeJobId));
                            const signedUrl = credentialsResponse.data.data.signed_url;
                            setCredentialsUrl(signedUrl);
                            triggerSignedDownload(signedUrl);
                        } catch {
                            setCredentialsUrl(null);
                        }
                    }

                    pushToast({
                        type: data.data.status === "completed" ? "success" : "error",
                        title: data.data.status === "completed" ? "Import completed" : "Import finished with failures",
                        message: `${data.data.success_rows} rows imported successfully. ${data.data.failed_rows} failed.`
                    });
                    return;
                }

                window.setTimeout(() => {
                    void poll();
                }, 1500);
            } catch (error) {
                if (cancelled) {
                    return;
                }

                setSubmitting(false);
                setImportStage("idle");
                setImportStartedAt(null);
                setActiveJobId(null);

                pushToast({
                    type: "error",
                    title: "Import status unavailable",
                    message: getApiErrorMessage(error)
                });
            }
        };

        void poll();

        return () => {
            cancelled = true;
        };
    }, [activeJobId, createPortalAccount, pushToast]);

    const onSubmit = form.handleSubmit(async (values) => {
        const file = values.file?.item(0);

        if (!file) {
            return;
        }

        setSubmitting(true);
        setJob(null);
        setFailedRows([]);
        setFailedRowsTotal(0);
        setCredentialsUrl(null);
        setFailedRowsPage(1);
        setUploadProgress(0);
        setImportStage("uploading");
        setImportStartedAt(Date.now());
        let jobQueued = false;

        try {
            const body = new FormData();
            body.append("file", file);
            body.append("create_portal_account", String(values.create_portal_account));
            body.append("update_existing_only", String(values.update_existing_only));

            if (values.default_branch_id) {
                body.append("default_branch_id", values.default_branch_id);
            }

            const { data } = await api.post<ImportMembersResponse>(endpoints.imports.members(), body, {
                headers: {
                    "Content-Type": "multipart/form-data"
                },
                timeout: 0,
                onUploadProgress: (progressEvent) => {
                    if (!progressEvent.total) {
                        return;
                    }

                    const percent = Math.min(100, Math.round((progressEvent.loaded / progressEvent.total) * 100));
                    setUploadProgress(percent);

                    if (percent >= 100) {
                        setImportStage("processing");
                    }
                }
            });
            setActiveJobId(data.data.job_id);
            setImportStage("processing");
            setUploadProgress(100);
            jobQueued = true;
            pushToast({
                type: "success",
                title: "Import queued",
                message: "The file upload is complete. Member import is now processing in the background."
            });
        } catch (error) {
            setActiveJobId(null);
            pushToast({
                type: "error",
                title: "Import failed",
                message: getApiErrorMessage(error)
            });
        } finally {
            if (!jobQueued) {
                setSubmitting(false);
                setImportStage("idle");
                setImportStartedAt(null);
            }
        }
    });

    const failedRowsColumns = useMemo<Column<ImportJobRow>[]>(
        () => [
            {
                key: "row_number",
                header: "Row",
                render: (row) => row.row_number
            },
            {
                key: "error",
                header: "Error",
                render: (row) => (
                    <Typography variant="body2" sx={{ color: "error.main", fontWeight: 600 }}>
                        {row.error || "Row failed"}
                    </Typography>
                )
            },
            {
                key: "raw",
                header: "Raw data",
                render: (row) => (
                    <Typography variant="body2" color="text.secondary">
                        {Object.entries(row.raw || {})
                            .filter(([, value]) => value)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(" | ")}
                    </Typography>
                )
            }
        ],
        []
    );

    const downloadCredentials = async () => {
        try {
            const signedUrl = credentialsUrl
                ? credentialsUrl
                : (
                    await api.get<CredentialsLinkResponse>(endpoints.imports.memberJobCredentials(job!.id))
                ).data.data.signed_url;

            setCredentialsUrl(signedUrl);
            window.open(signedUrl, "_blank", "noopener,noreferrer");
        } catch (error) {
            pushToast({
                type: "error",
                title: "Credentials download failed",
                message: getApiErrorMessage(error)
            });
        }
    };

    const downloadFailures = async () => {
        if (!job) {
            return;
        }

        try {
            const response = await api.get(endpoints.imports.memberJobFailuresCsv(job.id), {
                responseType: "blob"
            });
            downloadFile(
                response.data as Blob,
                getFilenameFromDisposition(response.headers["content-disposition"], `member-import-${job.id}-failures.csv`)
            );
        } catch (error) {
            pushToast({
                type: "error",
                title: "Failure export failed",
                message: getApiErrorMessage(error)
            });
        }
    };

    const submitSavingsHistory = async () => {
        if (!historyMemberId) {
            pushToast({
                type: "error",
                title: "Choose member",
                message: "Select the member who owns this savings history file."
            });
            return;
        }

        if (!historyFile) {
            pushToast({
                type: "error",
                title: "CSV required",
                message: "Choose a savings history CSV file before importing."
            });
            return;
        }

        setHistorySubmitting(true);
        setHistoryResult(null);

        try {
            const body = new FormData();
            body.append("member_id", historyMemberId);
            body.append("file", historyFile);

            const { data } = await api.post<MemberSavingsHistoryImportResponse>(
                endpoints.imports.memberSavingsHistory(),
                body,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    },
                    timeout: 0
                }
            );

            setHistoryResult(data.data);
            pushToast({
                type: data.data.failed_rows ? "warning" : "success",
                title: data.data.failed_rows ? "History imported with issues" : "Savings history imported",
                message: `${data.data.posted_rows} deposit row(s) posted to the ledger. ${data.data.failed_rows} failed.`
            });
        } catch (error) {
            pushToast({
                type: "error",
                title: "History import failed",
                message: getApiErrorMessage(error)
            });
        } finally {
            setHistorySubmitting(false);
        }
    };

    const submitShareHistory = async () => {
        if (!shareMemberId) {
            pushToast({
                type: "error",
                title: "Choose member",
                message: "Select the member who owns this share history file."
            });
            return;
        }

        if (!shareFile) {
            pushToast({
                type: "error",
                title: "CSV required",
                message: "Choose a share history CSV file before importing."
            });
            return;
        }

        setShareSubmitting(true);
        setShareResult(null);

        try {
            const body = new FormData();
            body.append("member_id", shareMemberId);
            body.append("file", shareFile);

            const { data } = await api.post<MemberShareHistoryImportResponse>(
                endpoints.imports.memberShareHistory(),
                body,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    },
                    timeout: 0
                }
            );

            setShareResult(data.data);
            pushToast({
                type: data.data.failed_rows ? "warning" : "success",
                title: data.data.failed_rows ? "Share history imported with issues" : "Share history imported",
                message: `${data.data.posted_rows} share row(s) posted to the ledger. ${data.data.failed_rows} failed.`
            });
        } catch (error) {
            pushToast({
                type: "error",
                title: "Share import failed",
                message: getApiErrorMessage(error)
            });
        } finally {
            setShareSubmitting(false);
        }
    };

    const submitLoanHistory = async () => {
        if (!loanMemberId) {
            pushToast({
                type: "error",
                title: "Choose member",
                message: "Select the member who owns this loan history file."
            });
            return;
        }

        if (!loanFile) {
            pushToast({
                type: "error",
                title: "CSV required",
                message: "Choose a loan history CSV file before importing."
            });
            return;
        }

        setLoanSubmitting(true);
        setLoanResult(null);

        try {
            const body = new FormData();
            body.append("member_id", loanMemberId);
            body.append("file", loanFile);

            const { data } = await api.post<MemberLoanHistoryImportResponse>(
                endpoints.imports.memberLoanHistory(),
                body,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    },
                    timeout: 0
                }
            );

            setLoanResult(data.data);
            pushToast({
                type: data.data.failed_rows ? "warning" : "success",
                title: data.data.failed_rows ? "Loan import completed with issues" : "Loan history imported",
                message: `${data.data.posted_rows} loan row(s) posted. ${data.data.skipped_rows} skipped. ${data.data.failed_rows} failed.`
            });
        } catch (error) {
            pushToast({
                type: "error",
                title: "Loan import failed",
                message: getApiErrorMessage(error)
            });
        } finally {
            setLoanSubmitting(false);
        }
    };

    const submitDividendHistory = async () => {
        if (!dividendMemberId) {
            pushToast({
                type: "error",
                title: "Choose member",
                message: "Select the member who owns this dividend history file."
            });
            return;
        }

        if (!dividendFile) {
            pushToast({
                type: "error",
                title: "CSV required",
                message: "Choose a dividend history CSV file before importing."
            });
            return;
        }

        setDividendSubmitting(true);
        setDividendResult(null);

        try {
            const body = new FormData();
            body.append("member_id", dividendMemberId);
            body.append("file", dividendFile);

            const { data } = await api.post<MemberDividendHistoryImportResponse>(
                endpoints.imports.memberDividendHistory(),
                body,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    },
                    timeout: 0
                }
            );

            setDividendResult(data.data);
            pushToast({
                type: data.data.failed_rows ? "warning" : "success",
                title: data.data.failed_rows ? "Dividend history imported with issues" : "Dividend history imported",
                message: `${data.data.posted_rows} dividend row(s) posted to the ledger. ${data.data.failed_rows} failed.`
            });
        } catch (error) {
            pushToast({
                type: "error",
                title: "Dividend import failed",
                message: getApiErrorMessage(error)
            });
        } finally {
            setDividendSubmitting(false);
        }
    };

    const totalFailedPages = Math.max(1, Math.ceil(failedRowsTotal / failedRowsLimit));

    return (
        <Stack
            spacing={3}
            sx={
                isDarkMode
                    ? {
                        "& .MuiButton-containedPrimary": {
                            bgcolor: memberAccent,
                            color: "#1a1a1a",
                            "&:hover": { bgcolor: memberAccentStrong }
                        },
                        "& .MuiButton-outlinedPrimary": {
                            borderColor: alpha(memberAccent, 0.42),
                            color: memberAccent
                        }
                    }
                    : undefined
            }
        >
            <MotionCard
                sx={{
                    borderRadius: 2,
                    background: isDarkMode
                        ? `linear-gradient(135deg, ${alpha(memberAccentStrong, 0.92)}, ${alpha(memberAccent, 0.78)})`
                        : "linear-gradient(135deg, rgba(10,5,115,0.98), rgba(31,168,230,0.92))",
                    color: "#fff"
                }}
            >
                <CardContent sx={{ p: 3.5 }}>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={3}>
                        <Box>
                            <Typography variant="overline" sx={{ color: alpha("#fff", 0.8) }}>
                                {isUpdateExistingMode ? "Member Bulk Update" : "Member Bulk Onboarding"}
                            </Typography>
                            <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                                {isUpdateExistingMode
                                    ? "Upload updates for existing members only"
                                    : "Import members and issue secure first-login credentials"}
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1.5, maxWidth: 760, color: alpha("#fff", 0.82) }}>
                                {isUpdateExistingMode
                                    ? "Upload a tenant-scoped CSV to update existing members by member_no/email/phone/tin_number/nin. New members will be rejected in this mode."
                                    : "Upload a tenant-scoped CSV to create or update members, optionally provision member portal access, and issue unique temporary passwords for one-time export only."}
                            </Typography>
                        </Box>
                        <Stack spacing={1.25} alignItems={{ xs: "flex-start", md: "flex-end" }}>
                            <Chip icon={<LockRoundedIcon />} label="Temporary passwords are never stored in Postgres" sx={{ bgcolor: alpha("#fff", 0.16), color: "#fff" }} />
                            <Chip icon={<FilePresentRoundedIcon />} label="Credentials file expires after 10 minutes" sx={{ bgcolor: alpha("#fff", 0.16), color: "#fff" }} />
                        </Stack>
                    </Stack>
                </CardContent>
            </MotionCard>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <SummaryCard
                        label="Current Import"
                        value={job ? job.status.toUpperCase() : "READY"}
                        helper={job ? `Created ${formatDate(job.created_at)}` : "Upload a CSV template to start."}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <SummaryCard
                        label="Success Rows"
                        value={String(job?.success_rows || 0)}
                        helper="Members created or updated successfully."
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <SummaryCard
                        label="Failed Rows"
                        value={String(job?.failed_rows || 0)}
                        helper="Rows needing correction before retry."
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 5 }}>
                    <MotionCard variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Stack spacing={2.5} component="form" onSubmit={onSubmit}>
                                <Box>
                                    <Typography variant="h6" fontWeight={700}>
                                        Upload CSV
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                        Use the provided template. For your current setup, one branch is enough, so you can leave <strong>branch_code</strong> blank and the system will automatically attach imported members to the tenant's default branch.
                                    </Typography>
                                </Box>

                                <Alert severity="warning">
                                    Store any downloaded credentials file securely. After distribution, delete it from local devices.
                                </Alert>

                                {updateExistingOnly ? (
                                    <Alert severity="info">
                                        Update-only mode is enabled. Each row must match an existing member using one of:
                                        <strong> member_no</strong>, <strong>email</strong>, <strong>phone_number</strong>, <strong>tin_number</strong>, or <strong>nin</strong>.
                                        New member creation is blocked in this mode.
                                    </Alert>
                                ) : null}

                                <Alert severity="info">
                                    The current template accepts dated activity fields too: <strong>opening_savings_date</strong>, <strong>withdrawal_date</strong>, <strong>loan_disbursed_at</strong>, and <strong>repayment_date</strong>. Leave <strong>branch_code</strong> blank for a single-branch tenant and use the dates to spread imported activity across past months so dashboards and trends look realistic.
                                </Alert>

                                {submitting ? (
                                    <MotionCard
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 2,
                                            bgcolor: alpha(memberAccent, isDarkMode ? 0.12 : 0.04),
                                            borderColor: alpha(memberAccent, isDarkMode ? 0.28 : 0.2)
                                        }}
                                    >
                                        <CardContent sx={{ p: 2 }}>
                                            <Stack spacing={1.25}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight={700}>
                                                            {importStage === "uploading" ? "Uploading import file" : "Processing imported rows"}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {importStage === "uploading"
                                                                ? "Sending the CSV to the backend."
                                                                : "The backend is validating rows, creating members, posting opening balances, disbursing loans, applying withdrawals and repayments, and provisioning accounts."}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={`${elapsedSeconds}s`}
                                                        variant="outlined"
                                                        sx={{
                                                            borderRadius: 1.5,
                                                            borderColor: alpha(memberAccent, 0.38),
                                                            color: memberAccent
                                                        }}
                                                    />
                                                </Stack>
                                                {importStage === "uploading" ? (
                                                    <>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={uploadProgress}
                                                            sx={{ height: 10, borderRadius: 999 }}
                                                        />
                                                        <Typography variant="caption" color="text.secondary">
                                                            Upload progress: {uploadProgress}%
                                                        </Typography>
                                                    </>
                                                ) : (
                                                    <>
                                                        <LinearProgress
                                                            variant="indeterminate"
                                                            sx={{ height: 10, borderRadius: 999 }}
                                                        />
                                                        <Typography variant="caption" color="text.secondary">
                                                            Processing can take longer for large CSV files, especially when portal accounts and loans are included.
                                                        </Typography>
                                                    </>
                                                )}
                                            </Stack>
                                        </CardContent>
                                    </MotionCard>
                                ) : null}

                                {hasSingleBranch ? (
                                    <TextField
                                        label="Default branch"
                                        fullWidth
                                        value={
                                            selectedDefaultBranch
                                                ? `${selectedDefaultBranch.name}${selectedDefaultBranch.code ? ` (${selectedDefaultBranch.code})` : ""}`
                                                : "Loading branch..."
                                        }
                                        slotProps={{
                                            input: {
                                                readOnly: true
                                            }
                                        }}
                                        InputLabelProps={{ shrink: true }}
                                        helperText="Single-branch tenant detected. The tenant's default branch will be used automatically."
                                    />
                                ) : (
                                    <TextField
                                        select
                                        label="Default branch"
                                        fullWidth
                                        disabled={loadingBranches}
                                        value={selectedDefaultBranchId}
                                        onChange={(event) => form.setValue("default_branch_id", event.target.value, { shouldValidate: true })}
                                        helperText="Used when branch_code is blank in the CSV."
                                    >
                                        <MenuItem value="">Use my assigned branch</MenuItem>
                                        {branches.map((branch) => (
                                            <MenuItem key={branch.id} value={branch.id}>
                                                {branch.name} ({branch.code})
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}

                                <FormControlLabel
                                    control={<Switch checked={createPortalAccount} disabled={updateExistingOnly} onChange={(event) => form.setValue("create_portal_account", event.target.checked)} />}
                                    label="Create member portal accounts"
                                />

                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<UploadFileRoundedIcon />}
                                >
                                    {selectedFile?.item(0)?.name || "Select CSV file"}
                                    <input
                                        hidden
                                        type="file"
                                        accept=".csv,text/csv"
                                        onChange={(event) => form.setValue("file", event.target.files)}
                                    />
                                </Button>
                                {form.formState.errors.file ? (
                                    <Typography variant="body2" color="error.main">
                                        {form.formState.errors.file.message as string}
                                    </Typography>
                                ) : null}

                                <Stack direction="row" spacing={1.5} flexWrap="wrap">
                                    <Button type="submit" variant="contained" disabled={submitting} startIcon={<CloudUploadRoundedIcon />}>
                                        {submitting
                                            ? importStage === "uploading"
                                                ? "Uploading..."
                                                : "Processing..."
                                            : "Start import"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="text"
                                        startIcon={<DownloadRoundedIcon />}
                                        onClick={() => window.open("/member-import-template.csv", "_blank", "noopener,noreferrer")}
                                    >
                                        Download template
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </MotionCard>
                </Grid>

                <Grid size={{ xs: 12, lg: 7 }}>
                    <MotionCard variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
                        <CardContent sx={{ p: 3 }}>
                            <Stack spacing={2.5}>
                                <Box>
                                    <Typography variant="h6" fontWeight={700}>
                                        Import report
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                        Review job results, download one-time credentials, and export failures for correction.
                                    </Typography>
                                </Box>

                                {job ? (
                                    <Stack spacing={2}>
                                        <Stack direction="row" spacing={1} flexWrap="wrap">
                                            <Chip label={`Job ${job.id.slice(0, 8)}`} />
                                            <Chip color={job.status === "completed" ? "success" : job.status === "failed" ? "error" : "warning"} label={job.status.toUpperCase()} />
                                            <Chip label={`Rows ${job.total_rows}`} />
                                        </Stack>

                                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                            <Button
                                                variant="contained"
                                                disabled={!credentialsUrl && !job.credentials_path}
                                                startIcon={<LockRoundedIcon />}
                                                onClick={downloadCredentials}
                                            >
                                                Download credentials CSV
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                disabled={!job.failed_rows}
                                                startIcon={<DownloadRoundedIcon />}
                                                onClick={downloadFailures}
                                            >
                                                Download failures CSV
                                            </Button>
                                            <Button
                                                variant="text"
                                                startIcon={<ReplayRoundedIcon />}
                                                onClick={() => void loadFailedRows(job.id, failedRowsPage, failedRowsLimit)}
                                            >
                                                Refresh failed rows
                                            </Button>
                                        </Stack>

                                        <Alert severity={job.failed_rows ? "warning" : "success"}>
                                            {job.failed_rows
                                                ? `${job.failed_rows} row(s) failed. Review the failed rows below before retrying.`
                                                : "All rows processed successfully."}
                                        </Alert>
                                    </Stack>
                                ) : (
                                    <Alert severity="info">
                                        No import job has been run in this session yet.
                                    </Alert>
                                )}
                            </Stack>
                        </CardContent>
                    </MotionCard>
                </Grid>
            </Grid>

            <MotionCard variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2.5}>
                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                Member savings history
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                Select an existing member and upload dated savings deposits. Each row posts through the finance ledger, then the journal and member statement transaction are backdated to the CSV date.
                            </Typography>
                        </Box>

                        <Alert severity="info">
                            CSV columns: <strong>date</strong>, <strong>amount</strong>, optional <strong>cumulative</strong>, <strong>reference</strong>, and <strong>description</strong>. Dates like <strong>3/4/2024</strong> are treated as month/day/year.
                        </Alert>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 5 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Member"
                                    value={historyMemberId}
                                    disabled={loadingMembers || historySubmitting}
                                    onChange={(event) => {
                                        setHistoryMemberId(event.target.value);
                                        setHistoryResult(null);
                                    }}
                                    helperText={selectedHistoryMember?.member_no ? `Member no: ${selectedHistoryMember.member_no}` : "Choose the member whose deposits are in the file."}
                                >
                                    <MenuItem value="">Select member</MenuItem>
                                    {members.map((member) => (
                                        <MenuItem key={member.id} value={member.id}>
                                            {member.full_name}{member.member_no ? ` (${member.member_no})` : ""}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, md: 7 }}>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<UploadFileRoundedIcon />}
                                        disabled={historySubmitting}
                                    >
                                        {historyFile?.name || "Select savings history CSV"}
                                        <input
                                            hidden
                                            type="file"
                                            accept=".csv,text/csv"
                                            onChange={(event) => {
                                                setHistoryFile(event.target.files?.item(0) || null);
                                                setHistoryResult(null);
                                            }}
                                        />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="text"
                                        startIcon={<DownloadRoundedIcon />}
                                        onClick={() => window.open("/member-savings-history-template.csv", "_blank", "noopener,noreferrer")}
                                    >
                                        Download history template
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
                            <Button
                                variant="contained"
                                disabled={historySubmitting || !historyMemberId || !historyFile}
                                startIcon={<CloudUploadRoundedIcon />}
                                onClick={() => void submitSavingsHistory()}
                            >
                                {historySubmitting ? "Posting history..." : "Post savings history"}
                            </Button>
                            {historySubmitting ? (
                                <Box sx={{ minWidth: 220, flex: 1 }}>
                                    <LinearProgress sx={{ height: 8, borderRadius: 999 }} />
                                </Box>
                            ) : null}
                        </Stack>

                        {historyResult ? (
                            <Stack spacing={1.25}>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    <Chip label={`Member ${historyResult.member.member_no || historyResult.member.full_name}`} />
                                    <Chip color="success" label={`${historyResult.posted_rows} posted`} />
                                    <Chip color={historyResult.failed_rows ? "warning" : "default"} label={`${historyResult.failed_rows} failed`} />
                                    <Chip label={`Total ${Number(historyResult.total_amount || 0).toLocaleString("en-US")}`} />
                                </Stack>

                                {historyResult.failed_rows ? (
                                    <Alert severity="warning">
                                        {historyResult.failures.slice(0, 3).map((failure) => (
                                            <Box key={failure.row_number}>
                                                Row {failure.row_number}: {failure.error}
                                            </Box>
                                        ))}
                                    </Alert>
                                ) : (
                                    <Alert severity="success">
                                        Savings deposit history posted to accounting and member statements successfully.
                                    </Alert>
                                )}
                            </Stack>
                        ) : null}
                    </Stack>
                </CardContent>
            </MotionCard>

            <MotionCard variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2.5}>
                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                Member loan history
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                Select an existing member and upload historical loans. Each row creates a loan through the finance disbursement path, posts the journal, backdates the loan, and shifts the repayment schedule from the imported dates.
                            </Typography>
                        </Box>

                        <Alert severity="info">
                            CSV columns: <strong>date</strong>, <strong>principal_amount</strong>, <strong>monthly_interest_rate</strong>, <strong>term_months</strong>, optional <strong>first_due_date</strong>, <strong>repayment_frequency</strong>, <strong>reference</strong>, and <strong>description</strong>. Use monthly percentage values like <strong>1.5</strong> for 1.5% per month.
                        </Alert>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 5 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Member"
                                    value={loanMemberId}
                                    disabled={loadingMembers || loanSubmitting}
                                    onChange={(event) => {
                                        setLoanMemberId(event.target.value);
                                        setLoanResult(null);
                                    }}
                                    helperText={selectedLoanMember?.member_no ? `Member no: ${selectedLoanMember.member_no}` : "Choose the member whose loan is in the file."}
                                >
                                    <MenuItem value="">Select member</MenuItem>
                                    {members.map((member) => (
                                        <MenuItem key={member.id} value={member.id}>
                                            {member.full_name}{member.member_no ? ` (${member.member_no})` : ""}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, md: 7 }}>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<UploadFileRoundedIcon />}
                                        disabled={loanSubmitting}
                                    >
                                        {loanFile?.name || "Select loan history CSV"}
                                        <input
                                            hidden
                                            type="file"
                                            accept=".csv,text/csv"
                                            onChange={(event) => {
                                                setLoanFile(event.target.files?.item(0) || null);
                                                setLoanResult(null);
                                            }}
                                        />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="text"
                                        startIcon={<DownloadRoundedIcon />}
                                        onClick={() => window.open("/member-loan-history-template.csv", "_blank", "noopener,noreferrer")}
                                    >
                                        Download loan template
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
                            <Button
                                variant="contained"
                                disabled={loanSubmitting || !loanMemberId || !loanFile}
                                startIcon={<CloudUploadRoundedIcon />}
                                onClick={() => void submitLoanHistory()}
                            >
                                {loanSubmitting ? "Posting loan..." : "Post loan history"}
                            </Button>
                            {loanSubmitting ? (
                                <Box sx={{ minWidth: 220, flex: 1 }}>
                                    <LinearProgress sx={{ height: 8, borderRadius: 999 }} />
                                </Box>
                            ) : null}
                        </Stack>

                        {loanResult ? (
                            <Stack spacing={1.25}>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    <Chip label={`Member ${loanResult.member.member_no || loanResult.member.full_name}`} />
                                    <Chip color="success" label={`${loanResult.posted_rows} posted`} />
                                    <Chip color={loanResult.skipped_rows ? "warning" : "default"} label={`${loanResult.skipped_rows} skipped`} />
                                    <Chip color={loanResult.failed_rows ? "warning" : "default"} label={`${loanResult.failed_rows} failed`} />
                                    <Chip label={`Principal ${Number(loanResult.total_amount || 0).toLocaleString("en-US")}`} />
                                </Stack>

                                {loanResult.failed_rows ? (
                                    <Alert severity="warning">
                                        {loanResult.failures.slice(0, 3).map((failure) => (
                                            <Box key={failure.row_number}>
                                                Row {failure.row_number}: {failure.error}
                                            </Box>
                                        ))}
                                    </Alert>
                                ) : (
                                    <Alert severity="success">
                                        Loan history posted to accounting and the repayment schedule successfully.
                                    </Alert>
                                )}
                            </Stack>
                        ) : null}
                    </Stack>
                </CardContent>
            </MotionCard>

            <MotionCard variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2.5}>
                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                Member dividend history
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                Select an existing member and upload dated dividend credits. Each row posts as a dividend allocation into the member savings ledger so historical workbook totals can reconcile.
                            </Typography>
                        </Box>

                        <Alert severity="warning">
                            Do not upload the grand-total cell. Use only dividend amounts. In the Nsanyiwa sheet, <strong>D46</strong> is the grand total, while <strong>J44</strong> is the dividend total.
                        </Alert>

                        <Alert severity="info">
                            CSV columns: <strong>date</strong>, <strong>amount</strong>, optional <strong>reference</strong>, and <strong>description</strong>. Dates like <strong>5/5/2026</strong> are treated as month/day/year.
                        </Alert>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 5 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Member"
                                    value={dividendMemberId}
                                    disabled={loadingMembers || dividendSubmitting}
                                    onChange={(event) => {
                                        setDividendMemberId(event.target.value);
                                        setDividendResult(null);
                                    }}
                                    helperText={selectedDividendMember?.member_no ? `Member no: ${selectedDividendMember.member_no}` : "Choose the member whose dividends are in the file."}
                                >
                                    <MenuItem value="">Select member</MenuItem>
                                    {members.map((member) => (
                                        <MenuItem key={member.id} value={member.id}>
                                            {member.full_name}{member.member_no ? ` (${member.member_no})` : ""}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, md: 7 }}>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<UploadFileRoundedIcon />}
                                        disabled={dividendSubmitting}
                                    >
                                        {dividendFile?.name || "Select dividend history CSV"}
                                        <input
                                            hidden
                                            type="file"
                                            accept=".csv,text/csv"
                                            onChange={(event) => {
                                                setDividendFile(event.target.files?.item(0) || null);
                                                setDividendResult(null);
                                            }}
                                        />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="text"
                                        startIcon={<DownloadRoundedIcon />}
                                        onClick={() => window.open("/member-dividend-history-template.csv", "_blank", "noopener,noreferrer")}
                                    >
                                        Download dividend template
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
                            <Button
                                variant="contained"
                                disabled={dividendSubmitting || !dividendMemberId || !dividendFile}
                                startIcon={<CloudUploadRoundedIcon />}
                                onClick={() => void submitDividendHistory()}
                            >
                                {dividendSubmitting ? "Posting dividends..." : "Post dividend history"}
                            </Button>
                            {dividendSubmitting ? (
                                <Box sx={{ minWidth: 220, flex: 1 }}>
                                    <LinearProgress sx={{ height: 8, borderRadius: 999 }} />
                                </Box>
                            ) : null}
                        </Stack>

                        {dividendResult ? (
                            <Stack spacing={1.25}>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    <Chip label={`Member ${dividendResult.member.member_no || dividendResult.member.full_name}`} />
                                    <Chip color="success" label={`${dividendResult.posted_rows} posted`} />
                                    <Chip color={dividendResult.failed_rows ? "warning" : "default"} label={`${dividendResult.failed_rows} failed`} />
                                    <Chip label={`Total ${Number(dividendResult.total_amount || 0).toLocaleString("en-US")}`} />
                                    {dividendResult.latest_balance !== null ? (
                                        <Chip label={`Latest balance ${Number(dividendResult.latest_balance || 0).toLocaleString("en-US")}`} />
                                    ) : null}
                                </Stack>

                                {dividendResult.failed_rows ? (
                                    <Alert severity="warning">
                                        {dividendResult.failures.slice(0, 3).map((failure) => (
                                            <Box key={failure.row_number}>
                                                Row {failure.row_number}: {failure.error}
                                            </Box>
                                        ))}
                                    </Alert>
                                ) : (
                                    <Alert severity="success">
                                        Dividend history posted to accounting and member statements successfully.
                                    </Alert>
                                )}
                            </Stack>
                        ) : null}
                    </Stack>
                </CardContent>
            </MotionCard>

            <MotionCard variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                        <Stack
                            direction={{ xs: "column", md: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", md: "center" }}
                            spacing={2}
                        >
                            <Box>
                                <Typography variant="h6" fontWeight={700}>
                                    Failed rows
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                    Rows that failed validation or provisioning are listed here with detailed reasons.
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <TextField
                                    select
                                    size="small"
                                    label="Rows per page"
                                    value={failedRowsLimit}
                                    onChange={(event) => {
                                        setFailedRowsLimit(Number(event.target.value));
                                        setFailedRowsPage(1);
                                    }}
                                    sx={{ minWidth: 140 }}
                                >
                                    {[10, 25, 50].map((limit) => (
                                        <MenuItem key={limit} value={limit}>
                                            {limit}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Stack>
                        </Stack>

                        {loadingRows ? (
                            <Alert severity="info">Loading failed rows...</Alert>
                        ) : (
                            <DataTable
                                rows={failedRows}
                                columns={failedRowsColumns}
                                emptyMessage="No failed rows for this import."
                            />
                        )}

                        {failedRowsTotal > 0 ? (
                            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
                                <Typography variant="body2" color="text.secondary">
                                    Showing {(failedRowsPage - 1) * failedRowsLimit + 1}-{Math.min(failedRowsPage * failedRowsLimit, failedRowsTotal)} of {failedRowsTotal} failed row(s)
                                </Typography>
                                <Pagination
                                    page={failedRowsPage}
                                    count={totalFailedPages}
                                    onChange={(_, page) => setFailedRowsPage(page)}
                                    sx={{
                                        "& .MuiPaginationItem-root.Mui-selected": {
                                            bgcolor: alpha(memberAccentStrong, 0.18),
                                            color: memberAccentStrong
                                        }
                                    }}
                                />
                            </Stack>
                        ) : null}
                    </Stack>
                </CardContent>
            </MotionCard>
        </Stack>
    );
}
