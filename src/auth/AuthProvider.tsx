import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type PropsWithChildren
} from "react";
import axios from "axios";
import type { Session, User } from "@supabase/supabase-js";

import { api, getApiErrorMessage } from "../lib/api";
import {
    endpoints,
    type BackendSignInResponse,
    type MemberImpersonationResponse,
    type MeResponse
} from "../lib/endpoints";
import { invalidateCache } from "../lib/apiCache";
import { clearStaleSupabaseSession, supabase } from "../lib/supabase";
import type { ApiErrorPayload, AuthMe } from "../types/api";
import { AuthContext, type AuthContextValue } from "./AuthContext";

interface LastApiError {
    status?: number;
    code: string;
    message: string;
}

interface AuthFlowError extends Error {
    code?: string;
    details?: unknown;
}

const SELECTED_BRANCH_KEY = "saccos:selectedBranchId";
const SELECTED_BRANCH_NAME_KEY = "saccos:selectedBranchName";
// Idle-timeout activity marker owned by SessionTimeoutManager; cleared on sign-out
// so the next login starts a fresh idle clock instead of inheriting a stale one.
const LAST_ACTIVITY_KEY = "saccos:lastActivity";
// Holds the super admin's own session tokens + the target member label while an
// impersonation ("Login as") is active, so the admin can return to their account.
const IMPERSONATION_KEY = "saccos:impersonation";

interface ImpersonationState {
    adminAccessToken: string;
    adminRefreshToken: string;
    member: { full_name: string; member_no: string | null };
}

function readImpersonationState(): ImpersonationState | null {
    try {
        const raw = sessionStorage.getItem(IMPERSONATION_KEY);
        return raw ? (JSON.parse(raw) as ImpersonationState) : null;
    } catch {
        return null;
    }
}

function createAuthFlowError(
    message: string,
    code?: string,
    details?: unknown
): AuthFlowError {
    const error = new Error(message) as AuthFlowError;
    error.code = code;
    error.details = details;
    return error;
}

export function AuthProvider({ children }: PropsWithChildren) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<AuthMe["profile"]>(null);
    const [branchIds, setBranchIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBranchId, setSelectedBranchIdState] = useState<string | null>(
        localStorage.getItem(SELECTED_BRANCH_KEY)
    );
    const [selectedBranchName, setSelectedBranchNameState] = useState<string | null>(
        localStorage.getItem(SELECTED_BRANCH_NAME_KEY)
    );
    const [selectedTenantId, setSelectedTenantIdState] = useState<string | null>(null);
    const [selectedTenantName, setSelectedTenantNameState] = useState<string | null>(null);
    const [lastApiError, setLastApiError] = useState<LastApiError | null>(null);
    const [backendUnavailable, setBackendUnavailable] = useState(false);
    const [impersonatedMember, setImpersonatedMember] = useState<ImpersonationState["member"] | null>(
        () => readImpersonationState()?.member ?? null
    );
    const selectedBranchIdRef = useRef(selectedBranchId);
    const selectedBranchNameRef = useRef(selectedBranchName);
    const sessionRef = useRef<Session | null>(null);
    const refreshProfileRequestIdRef = useRef(0);
    const authBootstrappedRef = useRef(false);

    useEffect(() => {
        selectedBranchIdRef.current = selectedBranchId;
    }, [selectedBranchId]);

    useEffect(() => {
        selectedBranchNameRef.current = selectedBranchName;
    }, [selectedBranchName]);

    useEffect(() => {
        sessionRef.current = session;
    }, [session]);

    const clearAuthState = useCallback(() => {
        refreshProfileRequestIdRef.current += 1;
        setProfile(null);
        setBranchIds([]);
        setSelectedTenantIdState(null);
        setSelectedTenantNameState(null);
        // Drop cached dashboard/read data so a different user signing in on the same
        // tab never sees the previous session's cached values.
        invalidateCache();
        // Clear one-per-session reminder dismissals so the next login re-evaluates them
        // (otherwise a dismissal would survive a sign-out/sign-in in the same tab).
        try {
            for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith("npl-reclass-dismissed:")) {
                    sessionStorage.removeItem(key);
                }
            }
        } catch {
            // sessionStorage may be unavailable (e.g. private mode); ignore.
        }
    }, []);

    const discardInvalidSession = useCallback(async () => {
        try {
            await supabase.auth.signOut({ scope: "local" });
        } catch {
            // Ignore local sign-out failures and still clear stale browser state.
        }

        clearStaleSupabaseSession();
        setSession(null);
        setUser(null);
        setLastApiError(null);
        setBackendUnavailable(false);
        clearAuthState();
    }, [clearAuthState]);

    const refreshProfile = useCallback(async () => {
        const requestId = ++refreshProfileRequestIdRef.current;

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData.session?.access_token;

            if (!accessToken) {
                await discardInvalidSession();
                return;
            }

            const { data } = await api.get<MeResponse>(endpoints.users.me());
            const tenantId = data.data.tenant?.id || data.data.profile?.tenant_id || null;
            const tenantName = data.data.tenant?.name || null;
            if (requestId !== refreshProfileRequestIdRef.current) {
                return;
            }

            setProfile(data.data.profile);
            setBranchIds(data.data.branch_ids || []);
            setSelectedTenantIdState(tenantId);
            setSelectedTenantNameState(tenantName);

            const firstBranch = data.data.branches?.[0];
            setBackendUnavailable(false);

            if (firstBranch) {
                setSelectedBranchIdState(firstBranch.id);
                setSelectedBranchNameState(firstBranch.name);
            } else if (data.data.branch_ids?.length) {
                setSelectedBranchIdState(data.data.branch_ids[0]);
            }
        } catch (error) {
            if (requestId !== refreshProfileRequestIdRef.current) {
                return;
            }

            const message = getApiErrorMessage(error);
            const errorCode =
                typeof error === "object" &&
                error !== null &&
                "response" in error &&
                typeof error.response === "object" &&
                error.response !== null &&
                "data" in error.response
                    ? (error.response as { data?: { error?: { code?: string } } }).data?.error?.code
                    : undefined;

            if (errorCode === "TENANT_ID_REQUIRED" || errorCode === "PROFILE_NOT_FOUND") {
                setBackendUnavailable(false);
                clearAuthState();
                return;
            }

            if (errorCode === "AUTH_TOKEN_MISSING" || errorCode === "AUTH_TOKEN_INVALID") {
                await discardInvalidSession();
                return;
            }

            setLastApiError({
                code: errorCode || "PROFILE_REFRESH_FAILED",
                message
            });
            setBackendUnavailable(true);
            clearAuthState();
        }
    }, [clearAuthState, discardInvalidSession]);

    useEffect(() => {
        const {
            data: { subscription: authSubscription }
        } = supabase.auth.onAuthStateChange((event, nextSession) => {
            const previousSession = sessionRef.current;
            const hadSession = Boolean(previousSession);
            const userChanged = (previousSession?.user?.id ?? null) !== (nextSession?.user?.id ?? null);
            const tokenChanged = (previousSession?.access_token ?? null) !== (nextSession?.access_token ?? null);

            // Only push session/user into state on a real change. Supabase re-emits
            // SIGNED_IN / TOKEN_REFRESHED when the tab regains focus; reflecting an
            // identical session on those events needlessly re-renders the whole app.
            if (tokenChanged || userChanged) {
                setSession(nextSession);
                setUser(nextSession?.user ?? null);
            }

            if (!nextSession) {
                clearAuthState();
                setBackendUnavailable(false);
                authBootstrappedRef.current = true;
                setLoading(false);
                return;
            }

            // Refetch the profile only when it can actually differ: first bootstrap,
            // the initial session, a genuinely new sign-in, or a different user.
            // Without this, redundant focus/refresh events refetched /me and made
            // the portal visibly reload its data on every tab switch.
            const shouldRefreshProfile =
                !authBootstrappedRef.current
                || event === "INITIAL_SESSION"
                || userChanged
                || (event === "SIGNED_IN" && !hadSession);

            if (shouldRefreshProfile) {
                setLoading(true);
                const profileFetch = refreshProfile();
                const bootstrapRequestId = refreshProfileRequestIdRef.current;
                void profileFetch.finally(() => {
                    authBootstrappedRef.current = true;
                    // Two bootstraps run concurrently on refresh (INITIAL_SESSION via
                    // onAuthStateChange + getSession below). Only the latest fetch may clear
                    // loading: otherwise the first to finish flips loading=false while profile
                    // is still null, and the role guard bounces the user to /dashboard.
                    if (bootstrapRequestId === refreshProfileRequestIdRef.current) {
                        setLoading(false);
                    }
                });
            } else {
                authBootstrappedRef.current = true;
                setLoading(false);
            }
        });

        void supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setUser(data.session?.user ?? null);

            if (data.session) {
                setLoading(true);
                const profileFetch = refreshProfile();
                const bootstrapRequestId = refreshProfileRequestIdRef.current;
                void profileFetch.finally(() => {
                    authBootstrappedRef.current = true;
                    if (bootstrapRequestId === refreshProfileRequestIdRef.current) {
                        setLoading(false);
                    }
                });
                return;
            }

            authBootstrappedRef.current = true;
            setBackendUnavailable(false);
            setLoading(false);
        }).catch(async (error) => {
            const message = error instanceof Error ? error.message : "";

            if (message.toLowerCase().includes("invalid refresh token")) {
                await supabase.auth.signOut({ scope: "local" });
                clearStaleSupabaseSession();
            }

            clearAuthState();
            authBootstrappedRef.current = true;
            setBackendUnavailable(false);
            setLoading(false);
        });

        return () => {
            authSubscription.unsubscribe();
        };
    }, [clearAuthState, refreshProfile]);

    useEffect(() => {
        const handleApiError = (event: Event) => {
            const customEvent = event as CustomEvent<LastApiError>;
            setLastApiError(customEvent.detail);
        };

        window.addEventListener("saccos:api-error", handleApiError);

        return () => {
            window.removeEventListener("saccos:api-error", handleApiError);
        };
    }, []);

    const signIn = useCallback(async (
        email: string,
        password: string,
        options?: { totpCode?: string | null; recoveryCode?: string | null }
    ) => {
        setLoading(true);
        clearStaleSupabaseSession();
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        localStorage.removeItem(SELECTED_BRANCH_KEY);
        localStorage.removeItem(SELECTED_BRANCH_NAME_KEY);
        setSelectedBranchIdState(null);
        setSelectedBranchNameState(null);
        clearAuthState();
        setBackendUnavailable(false);

        try {
            const { data } = await api.post<BackendSignInResponse>(endpoints.auth.backendSignIn(), {
                email,
                password,
                totp_code: options?.totpCode || undefined,
                recovery_code: options?.recoveryCode || undefined
            });

            const accessToken = data.session?.access_token;
            const refreshToken = data.session?.refresh_token;

            if (!accessToken || !refreshToken) {
                throw createAuthFlowError(
                    "Authentication session is incomplete.",
                    "SESSION_MISSING"
                );
            }

            const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
            });

            if (error) {
                throw error;
            }
        } catch (error) {
            setLoading(false);
            if (axios.isAxiosError<ApiErrorPayload>(error)) {
                const code = error.response?.data?.error?.code;
                const details = error.response?.data?.error?.details;

                throw createAuthFlowError(
                    getApiErrorMessage(error, "Unable to sign in."),
                    code,
                    details
                );
            }

            if (error instanceof Error) {
                throw createAuthFlowError(error.message);
            }

            throw createAuthFlowError("Unable to sign in.");
        }
    }, [clearAuthState]);

    const signOut = useCallback(async () => {
        sessionStorage.removeItem(IMPERSONATION_KEY);
        setImpersonatedMember(null);
        await supabase.auth.signOut();
        clearStaleSupabaseSession();
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        localStorage.removeItem(SELECTED_BRANCH_KEY);
        localStorage.removeItem(SELECTED_BRANCH_NAME_KEY);
        setSelectedBranchIdState(null);
        setSelectedBranchNameState(null);
        clearAuthState();
        setBackendUnavailable(false);
    }, [clearAuthState]);

    const impersonateMember = useCallback(async (memberId: string) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const adminAccessToken = sessionData.session?.access_token;
        const adminRefreshToken = sessionData.session?.refresh_token;

        if (!adminAccessToken || !adminRefreshToken) {
            throw createAuthFlowError("Your admin session is not available.", "ADMIN_SESSION_MISSING");
        }

        let response: MemberImpersonationResponse;
        try {
            const { data } = await api.post<{ data: MemberImpersonationResponse }>(
                endpoints.members.impersonate(memberId)
            );
            response = data.data;
        } catch (error) {
            if (axios.isAxiosError<ApiErrorPayload>(error)) {
                throw createAuthFlowError(
                    getApiErrorMessage(error, "Unable to log in as this member."),
                    error.response?.data?.error?.code
                );
            }
            throw createAuthFlowError("Unable to log in as this member.");
        }

        const accessToken = response.session?.access_token;
        const refreshToken = response.session?.refresh_token;
        if (!accessToken || !refreshToken) {
            throw createAuthFlowError("Impersonation session is incomplete.", "SESSION_MISSING");
        }

        // Stash the admin session so "Return to admin" can restore it.
        const impersonationState: ImpersonationState = {
            adminAccessToken,
            adminRefreshToken,
            member: response.member
        };
        sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify(impersonationState));
        setImpersonatedMember(response.member);
        setLoading(true);
        clearAuthState();

        const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
        });

        if (error) {
            sessionStorage.removeItem(IMPERSONATION_KEY);
            setImpersonatedMember(null);
            setLoading(false);
            throw error;
        }

        return response.member;
    }, [clearAuthState]);

    const stopImpersonation = useCallback(async () => {
        const state = readImpersonationState();
        sessionStorage.removeItem(IMPERSONATION_KEY);
        setImpersonatedMember(null);

        if (!state) {
            await supabase.auth.signOut();
            return;
        }

        setLoading(true);
        clearAuthState();

        const { error } = await supabase.auth.setSession({
            access_token: state.adminAccessToken,
            refresh_token: state.adminRefreshToken
        });

        if (error) {
            // Admin token could not be restored (e.g. expired) — fall back to a clean sign-out.
            await supabase.auth.signOut();
            setLoading(false);
        }
    }, [clearAuthState]);

    const markPasswordChanged = useCallback(() => {
        const changedAt = new Date().toISOString();
        setProfile((current) => current
            ? {
                ...current,
                must_change_password: false,
                first_login_at: current.first_login_at || changedAt
            }
            : current);
    }, []);

    const setSelectedBranchId = useCallback((value: string | null) => {
        setSelectedBranchIdState(value);

        if (value) {
            localStorage.setItem(SELECTED_BRANCH_KEY, value);
        } else {
            localStorage.removeItem(SELECTED_BRANCH_KEY);
            localStorage.removeItem(SELECTED_BRANCH_NAME_KEY);
            setSelectedBranchNameState(null);
        }
    }, []);

    const isInternalOps = Boolean(
        user?.app_metadata?.platform_role === "internal_ops" ||
        user?.app_metadata?.platform_role === "platform_admin" ||
        user?.app_metadata?.platform_role === "platform_owner" ||
        profile?.role === "platform_admin" ||
        profile?.role === "platform_owner"
    );

    const twoFactorSetupRequired = Boolean(
        !isInternalOps &&
        profile?.two_factor_required &&
        profile?.two_factor_setup_required
    );

    const value = useMemo<AuthContextValue>(() => ({
        session,
        user,
        profile,
        platformRole:
            typeof user?.app_metadata?.platform_role === "string"
                ? user.app_metadata.platform_role
                : profile?.role === "platform_admin" || profile?.role === "platform_owner"
                    ? profile.role
                    : null,
        branchIds,
        loading,
        selectedTenantId,
        selectedBranchId,
        selectedTenantName,
        selectedBranchName,
        lastApiError,
        backendUnavailable,
        twoFactorSetupRequired,
        signIn,
        signOut,
        impersonateMember,
        stopImpersonation,
        impersonatedMember,
        refreshProfile,
        markPasswordChanged,
        setSelectedBranchId,
        isInternalOps
    }), [
        branchIds,
        lastApiError,
        loading,
        profile,
        markPasswordChanged,
        refreshProfile,
        selectedBranchId,
        selectedTenantId,
        selectedTenantName,
        selectedBranchName,
        session,
        signIn,
        signOut,
        impersonateMember,
        stopImpersonation,
        impersonatedMember,
        twoFactorSetupRequired,
        user,
        backendUnavailable,
        setSelectedBranchId,
        isInternalOps
    ]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
