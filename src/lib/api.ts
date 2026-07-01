import axios, { AxiosError } from "axios";

import { clearStaleSupabaseSession, supabase } from "./supabase";
import type { ApiErrorPayload } from "../types/api";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
    throw new Error("Missing VITE_API_BASE_URL.");
}

export const api = axios.create({
    baseURL: apiBaseUrl,
    timeout: 30000
});

function emitWindowEvent(name: string, detail?: unknown) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
}

api.interceptors.request.use(async (config) => {
    let accessToken: string | undefined;

    try {
        const { data } = await supabase.auth.getSession();
        accessToken = data.session?.access_token;
    } catch (error) {
        const message = error instanceof Error ? error.message : "";

        if (message.toLowerCase().includes("invalid refresh token")) {
            await supabase.auth.signOut({ scope: "local" });
            clearStaleSupabaseSession();

            if (!window.location.pathname.startsWith("/signin")) {
                window.location.assign("/signin");
            }
        } else {
            throw error;
        }
    }

    config.headers["Cache-Control"] = "no-cache";
    config.headers.Pragma = "no-cache";

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorPayload>) => {
        const status = error.response?.status;
        const apiError = error.response?.data?.error;

        emitWindowEvent("saccos:api-error", {
            status,
            code: apiError?.code || "UNKNOWN_ERROR",
            message: apiError?.message || error.message
        });

        const requestUrl = error.config?.url || "";
        const isAuthBootstrapRequest =
            requestUrl.includes("/auth/signin") ||
            requestUrl.includes("/auth/2fa/setup") ||
            requestUrl.includes("/auth/2fa/verify") ||
            requestUrl.includes("/auth/2fa/validate") ||
            requestUrl.includes("/auth/2fa/recovery") ||
            requestUrl.includes("/auth/2fa/disable") ||
            requestUrl.includes("/auth/2fa/backup-codes/regenerate") ||
            requestUrl.includes("/auth/password-setup/link/send");

        if (status === 401 && !isAuthBootstrapRequest) {
            await supabase.auth.signOut();
            clearStaleSupabaseSession();

            if (!window.location.pathname.startsWith("/signin")) {
                window.location.assign("/signin");
            }
        }

        return Promise.reject(error);
    }
);

const FIELD_LABELS: Record<string, string> = {
    dob: "Date of birth",
    date_of_birth: "Date of birth",
    nida_no: "NIDA number",
    national_id: "National ID",
    tin_no: "TIN number",
    phone: "Phone",
    phone_number: "Phone",
    email: "Email",
    full_name: "Full name",
    occupation: "Occupation",
    employer: "Employer",
    region: "Region",
    district: "District",
    ward: "Ward",
    street_or_village: "Street / Village",
    residential_address: "Residential address",
    address_line1: "Address",
    next_of_kin_name: "Next of kin name",
    next_of_kin_phone: "Next of kin phone",
    next_of_kin_address: "Next of kin address",
    next_of_kin_relationship: "Next of kin relationship",
    heir_name: "Heir name",
    heir_phone: "Heir phone",
    heir_address: "Heir address",
    heir_relationship: "Heir relationship",
    ilboru_completion_year: "Year completed"
};

function humanizeFieldName(field: string) {
    return FIELD_LABELS[field] || field.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

// Zod validation errors arrive as details.issues = { formErrors, fieldErrors }.
// Turn them into a readable per-field message so the user knows exactly what to fix.
function formatFieldErrors(details: unknown): string | null {
    if (!details || typeof details !== "object" || !("issues" in details)) {
        return null;
    }
    const issues = (details as { issues?: unknown }).issues;
    if (!issues || typeof issues !== "object") {
        return null;
    }

    const parts: string[] = [];
    const fieldErrors = (issues as { fieldErrors?: Record<string, string[]> }).fieldErrors;
    if (fieldErrors && typeof fieldErrors === "object") {
        for (const [field, messages] of Object.entries(fieldErrors)) {
            if (Array.isArray(messages) && messages.length > 0) {
                parts.push(`${humanizeFieldName(field)}: ${messages.join(" ")}`);
            }
        }
    }
    const formErrors = (issues as { formErrors?: string[] }).formErrors;
    if (Array.isArray(formErrors)) {
        parts.push(...formErrors.filter((m) => typeof m === "string" && m.length > 0));
    }

    return parts.length > 0 ? parts.join("; ") : null;
}

export function getApiErrorMessage(error: unknown, fallback = "Request failed.") {
    if (axios.isAxiosError<ApiErrorPayload>(error)) {
        const apiError = error.response?.data?.error;
        const details = apiError?.details;

        // Surface per-field validation messages when present.
        const fieldMessage = formatFieldErrors(details);
        if (fieldMessage) {
            return fieldMessage;
        }

        if (details && typeof details === "object") {
            // Zod validation errors (from the validate middleware) arrive as a flattened
            // { issues: { fieldErrors, formErrors } }. Surface the specific field(s) so
            // "Request validation failed." names what to fix instead of staying generic.
            const issues = (details as {
                issues?: { fieldErrors?: Record<string, string[] | undefined>; formErrors?: string[] };
            }).issues;
            if (issues && typeof issues === "object") {
                const parts: string[] = [];
                for (const [field, messages] of Object.entries(issues.fieldErrors || {})) {
                    if (messages && messages.length) {
                        parts.push(`${field}: ${messages[0]}`);
                    }
                }
                if (issues.formErrors?.length) {
                    parts.push(...issues.formErrors);
                }
                if (parts.length) {
                    return `${apiError?.message || fallback} ${parts.slice(0, 4).join("; ")}`;
                }
            }

            const detailedMessage = "message" in details && typeof details.message === "string"
                ? details.message
                : "msg" in details && typeof details.msg === "string"
                    ? details.msg
                    : "error_description" in details && typeof details.error_description === "string"
                        ? details.error_description
                        : null;

            if (detailedMessage) {
                return `${apiError?.message || fallback} ${detailedMessage}`;
            }
        }

        return apiError?.message || error.message || fallback;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return fallback;
}

export function getApiErrorCode(error: unknown) {
    if (axios.isAxiosError<ApiErrorPayload>(error)) {
        return error.response?.data?.error?.code || null;
    }

    return null;
}

export function getApiErrorDetails<T = unknown>(error: unknown) {
    if (axios.isAxiosError<ApiErrorPayload>(error)) {
        return (error.response?.data?.error?.details as T | undefined) ?? null;
    }

    return null;
}
