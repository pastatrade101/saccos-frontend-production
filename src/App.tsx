import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";

import { useAuth } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppLayout } from "./components/Layout";
import { AppLoader } from "./components/AppLoader";
import { AppShellSkeleton } from "./components/AppShellSkeleton";
// import { PwaInstallPrompt } from "./components/PwaInstallPrompt"; // hidden: PWA install prompt disabled
import { RootErrorBoundary } from "./components/RootErrorBoundary";
import { SessionTimeoutManager } from "./components/SessionTimeoutManager";

// Route pages are code-split so each one is downloaded on demand instead of
// shipping the entire app (admin + member portal + every page) in one bundle.
const SignInPage = lazy(() => import("./pages/SignIn").then((m) => ({ default: m.SignInPage })));
const SignupPage = lazy(() => import("./pages/Signup").then((m) => ({ default: m.SignupPage })));
const SetupSuperAdminPage = lazy(() => import("./pages/SetupSuperAdmin").then((m) => ({ default: m.SetupSuperAdminPage })));
const DashboardPage = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.DashboardPage })));
const AuditorDashboardPage = lazy(() => import("./pages/AuditorDashboard").then((m) => ({ default: m.AuditorDashboardPage })));
const AuditorWorkbenchPage = lazy(() => import("./pages/AuditorWorkbench").then((m) => ({ default: m.AuditorWorkbenchPage })));
const AuditorExceptionsPage = lazy(() => import("./pages/AuditorExceptions").then((m) => ({ default: m.AuditorExceptionsPage })));
const AuditorJournalsPage = lazy(() => import("./pages/AuditorJournals").then((m) => ({ default: m.AuditorJournalsPage })));
const AuditorAuditLogsPage = lazy(() => import("./pages/AuditorAuditLogs").then((m) => ({ default: m.AuditorAuditLogsPage })));
const AuditorReportsPage = lazy(() => import("./pages/AuditorReports").then((m) => ({ default: m.AuditorReportsPage })));
const AccessDeniedPage = lazy(() => import("./pages/AccessDenied").then((m) => ({ default: m.AccessDeniedPage })));
const StaffUsersPage = lazy(() => import("./pages/StaffUsers").then((m) => ({ default: m.StaffUsersPage })));
const MembersPage = lazy(() => import("./pages/Members").then((m) => ({ default: m.MembersPage })));
const MemberApplicationsPage = lazy(() => import("./pages/MemberApplications").then((m) => ({ default: m.MemberApplicationsPage })));
const CashPage = lazy(() => import("./pages/Cash").then((m) => ({ default: m.CashPage })));
const CashControlPage = lazy(() => import("./pages/CashControl").then((m) => ({ default: m.CashControlPage })));
const ContributionsPage = lazy(() => import("./pages/Contributions").then((m) => ({ default: m.ContributionsPage })));
const PaymentsPage = lazy(() => import("./pages/Payments").then((m) => ({ default: m.PaymentsPage })));
const DividendsPage = lazy(() => import("./pages/Dividends").then((m) => ({ default: m.DividendsPage })));
const SavingsPage = lazy(() => import("./pages/Savings").then((m) => ({ default: m.SavingsPage })));
const ChargeRevenuePage = lazy(() => import("./pages/ChargeRevenue").then((m) => ({ default: m.ChargeRevenuePage })));
const FollowUpsPage = lazy(() => import("./pages/FollowUps").then((m) => ({ default: m.FollowUpsPage })));
const ApprovalsPage = lazy(() => import("./pages/Approvals").then((m) => ({ default: m.ApprovalsPage })));
const LoansPage = lazy(() => import("./pages/Loans").then((m) => ({ default: m.LoansPage })));
const LoanDetailPage = lazy(() => import("./pages/LoanDetail").then((m) => ({ default: m.LoanDetailPage })));
const ProductCatalogPage = lazy(() => import("./pages/ProductCatalog").then((m) => ({ default: m.ProductCatalogPage })));
const ReportsPage = lazy(() => import("./pages/Reports").then((m) => ({ default: m.ReportsPage })));
const SaccoSettingsPage = lazy(() => import("./pages/SaccoSettings").then((m) => ({ default: m.SaccoSettingsPage })));
const PerformanceTargetsPage = lazy(() => import("./pages/PerformanceTargets").then((m) => ({ default: m.PerformanceTargetsPage })));
const TreasuryPage = lazy(() => import("./pages/Treasury").then((m) => ({ default: m.TreasuryPage })));
const TreasuryPolicySettingsPage = lazy(() => import("./pages/TreasuryPolicySettings").then((m) => ({ default: m.TreasuryPolicySettingsPage })));
const MemberPortalPage = lazy(() => import("./pages/MemberPortal").then((m) => ({ default: m.MemberPortalPage })));
const MemberImportPage = lazy(() => import("./pages/MemberImport").then((m) => ({ default: m.MemberImportPage })));
const ChangePasswordPage = lazy(() => import("./pages/ChangePassword").then((m) => ({ default: m.ChangePasswordPage })));
const SecuritySettingsPage = lazy(() => import("./pages/SecuritySettings").then((m) => ({ default: m.SecuritySettingsPage })));
const NotificationsPage = lazy(() => import("./pages/Notifications").then((m) => ({ default: m.NotificationsPage })));
const ResetPasswordPage = lazy(() => import("./pages/ResetPassword").then((m) => ({ default: m.ResetPasswordPage })));
const ServiceUnavailablePage = lazy(() => import("./pages/ServiceUnavailable").then((m) => ({ default: m.ServiceUnavailablePage })));
const PrivacyPolicyPage = lazy(() => import("./pages/LegalPages").then((m) => ({ default: m.PrivacyPolicyPage })));
const TermsAgreementPage = lazy(() => import("./pages/LegalPages").then((m) => ({ default: m.TermsAgreementPage })));

function WorkspaceRedirect() {
    const { session, profile, backendUnavailable, isInternalOps, twoFactorSetupRequired, loading } = useAuth();

    if (loading || (session && !profile && !isInternalOps && !backendUnavailable && !twoFactorSetupRequired)) {
        return <AppShellSkeleton />;
    }

    if (backendUnavailable) {
        return <Navigate to="/service-unavailable" replace />;
    }

    if (profile?.must_change_password) {
        return <Navigate to="/change-password" replace />;
    }

    if (twoFactorSetupRequired) {
        return <Navigate to="/security" replace />;
    }

    if (profile?.role === "member") {
        return <Navigate to="/portal" replace />;
    }

    if (isInternalOps) {
        return <Navigate to="/dashboard" replace />;
    }

    if (!profile) {
        return <Navigate to="/setup/super-admin" replace />;
    }

    if (profile.role === "auditor") {
        return <Navigate to="/dashboard" replace />;
    }

    if (profile.role === "treasury_officer") {
        return <Navigate to="/treasury" replace />;
    }

    return <Navigate to="/dashboard" replace />;
}

function DashboardEntryRoute() {
    const { profile, isInternalOps } = useAuth();

    if (profile?.role === "auditor") {
        return <AuditorDashboardPage />;
    }

    if (
        isInternalOps ||
        profile?.role === "super_admin" ||
        profile?.role === "branch_manager" ||
        profile?.role === "treasury_officer" ||
        profile?.role === "loan_officer" ||
        profile?.role === "teller"
    ) {
        return profile?.role === "treasury_officer"
            ? <Navigate to="/treasury" replace />
            : <DashboardPage />;
    }

    return <Navigate to="/access-denied" replace />;
}

function PublicHomePage() {
    const { session, loading } = useAuth();

    if (loading) {
        return <AppLoader message="Loading workspace..." />;
    }

    if (!session) {
        return <Navigate to="/signin" replace />;
    }

    return <WorkspaceRedirect />;
}

function SignInRoute() {
    const { session, loading } = useAuth();

    if (session && loading) {
        return <AppLoader message="Loading workspace..." />;
    }

    if (session) {
        return <WorkspaceRedirect />;
    }

    return <SignInPage />;
}

function SignupRoute() {
    const { session, loading } = useAuth();

    if (session && loading) {
        return <AppLoader message="Loading workspace..." />;
    }

    if (session) {
        return <WorkspaceRedirect />;
    }

    return <SignupPage />;
}

function SetupRouteGuard({ children }: { children: ReactNode }) {
    const { session, profile, backendUnavailable, isInternalOps, loading } = useAuth();

    if (loading || (session && !profile && !isInternalOps && !backendUnavailable)) {
        return <AppLoader message="Loading workspace..." />;
    }

    if (backendUnavailable) {
        return <Navigate to="/service-unavailable" replace />;
    }

    if (profile) {
        return <Navigate
            to={
                profile.role === "member"
                    ? "/portal"
                    : profile.role === "treasury_officer"
                        ? "/treasury"
                        : "/dashboard"
            }
            replace
        />;
    }

    return <>{children}</>;
}

export default function App() {
    return (
        <>
            <RootErrorBoundary>
            <Suspense fallback={<AppLoader message="Loading workspace..." />}>
            <Routes>
                <Route path="/" element={<PublicHomePage />} />
                <Route path="/signin" element={<SignInRoute />} />
                <Route path="/signup" element={<SignupRoute />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms-and-agreement" element={<TermsAgreementPage />} />
                <Route path="/access-denied" element={<AccessDeniedPage />} />
                <Route path="/service-unavailable" element={<ServiceUnavailablePage />} />
                <Route
                    element={
                        <ProtectedRoute
                            allowedRoles={["platform_admin", "platform_owner", "super_admin", "branch_manager", "treasury_officer", "loan_officer", "teller", "auditor", "member"]}
                        />
                    }
                >
                    <Route path="/change-password" element={<ChangePasswordPage />} />
                    <Route path="/security" element={<SecuritySettingsPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={["member"]} />}>
                    <Route path="/portal" element={<MemberPortalPage />} />
                </Route>

                <Route element={<ProtectedRoute allowWithoutProfile />}>
                        <Route element={<AppLayout />}>
                            <Route path="/setup/super-admin" element={<SetupRouteGuard><SetupSuperAdminPage /></SetupRouteGuard>} />
                        <Route
                            element={
                                <ProtectedRoute
                                    allowedRoles={["platform_admin", "platform_owner", "super_admin", "branch_manager", "treasury_officer", "loan_officer", "teller", "auditor"]}
                                />
                            }
                        >
                            <Route path="/dashboard" element={<DashboardEntryRoute />} />
                        </Route>
                        <Route
                            element={
                                <ProtectedRoute allowedRoles={["auditor"]} allowInternalOps={false} />
                            }
                        >
                            <Route path="/auditor/exceptions" element={<AuditorExceptionsPage />} />
                            <Route path="/auditor/workbench" element={<AuditorWorkbenchPage />} />
                            <Route path="/auditor/journals" element={<AuditorJournalsPage />} />
                            <Route path="/auditor/journals/:id" element={<AuditorJournalsPage />} />
                            <Route path="/auditor/audit-logs" element={<AuditorAuditLogsPage />} />
                            <Route path="/auditor/reports" element={<AuditorReportsPage />} />
                        </Route>
                        <Route
                            element={
                                <ProtectedRoute
                                    allowedRoles={["super_admin", "branch_manager", "treasury_officer", "loan_officer", "teller"]}
                                />
                            }
                        >
                            <Route path="/follow-ups" element={<FollowUpsPage />} />
                            <Route path="/approvals" element={<ApprovalsPage />} />
                        </Route>
                        <Route
                            element={
                                <ProtectedRoute allowedRoles={["super_admin", "branch_manager"]} allowInternalOps={false} />
                            }
                        >
                            <Route path="/staff-users" element={<StaffUsersPage />} />
                            <Route path="/settings/sacco-year" element={<SaccoSettingsPage />} />
                            <Route path="/performance-targets" element={<PerformanceTargetsPage />} />
                        </Route>
                        <Route
                            element={
                                <ProtectedRoute allowedRoles={["branch_manager"]} allowInternalOps={false} />
                            }
                        >
                            <Route path="/products" element={<ProductCatalogPage />} />
                        </Route>
                        <Route
                            element={
                                <ProtectedRoute
                                    allowedRoles={["super_admin", "branch_manager", "teller"]}
                                    allowInternalOps={false}
                                />
                            }
                        >
                            <Route path="/members" element={<MembersPage />} />
                            <Route path="/members/:memberId" element={<MembersPage />} />
                        </Route>
                        <Route
                            element={
                                <ProtectedRoute
                                    allowedRoles={["super_admin", "branch_manager", "treasury_officer", "auditor"]}
                                    allowInternalOps={false}
                                />
                            }
                        >
                            <Route path="/member-applications" element={<MemberApplicationsPage />} />
                        </Route>
                        <Route
                            element={
                                <ProtectedRoute
                                    allowedRoles={["branch_manager"]}
                                    allowInternalOps={false}
                                />
                            }
                        >
                            <Route path="/members/import" element={<MemberImportPage />} />
                        </Route>
                        <Route
                            element={
                                <ProtectedRoute allowedRoles={["branch_manager"]} allowInternalOps={false} />
                            }
                        >
                            <Route path="/contributions" element={<ContributionsPage />} />
                            <Route path="/savings" element={<SavingsPage />} />
                            <Route path="/payments" element={<PaymentsPage />} />
                            <Route path="/revenue" element={<ChargeRevenuePage />} />
                            <Route path="/charge-revenue" element={<ChargeRevenuePage />} />
                        </Route>
                        <Route
                            element={
                                <ProtectedRoute allowedRoles={["super_admin", "branch_manager"]} allowInternalOps={false} />
                            }
                        >
                            <Route path="/dividends" element={<DividendsPage />} />
                        </Route>
                        <Route
                            element={
                                <ProtectedRoute allowedRoles={["teller"]} allowInternalOps={false} />
                            }
                        >
                            <Route path="/cash" element={<CashPage />} />
                        </Route>
                        <Route
                            element={
                                <ProtectedRoute allowedRoles={["branch_manager"]} allowInternalOps={false} />
                            }
                        >
                            <Route path="/cash-control" element={<CashControlPage />} />
                        </Route>
                        <Route
                            element={
                                <ProtectedRoute allowedRoles={["branch_manager", "loan_officer", "teller"]} allowInternalOps={false} />
                            }
                        >
                            <Route path="/loans" element={<LoansPage />} />
                            <Route path="/loans/:loanId" element={<LoanDetailPage />} />
                        </Route>
                        <Route
                            element={
                                <ProtectedRoute
                                    allowedRoles={["super_admin", "branch_manager", "treasury_officer", "loan_officer"]}
                                    allowInternalOps={false}
                                />
                            }
                        >
                            <Route path="/reports" element={<ReportsPage />} />
                        </Route>
                        <Route
                            element={
                                <ProtectedRoute
                                    allowedRoles={["super_admin", "branch_manager", "treasury_officer", "auditor"]}
                                    allowInternalOps={false}
                                />
                            }
                        >
                            <Route path="/treasury" element={<TreasuryPage />} />
                        </Route>
                        <Route
                            element={
                                <ProtectedRoute
                                    allowedRoles={["super_admin", "branch_manager"]}
                                    allowInternalOps={false}
                                />
                            }
                        >
                            <Route path="/treasury/policy-settings" element={<TreasuryPolicySettingsPage />} />
                        </Route>
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
            </RootErrorBoundary>
            {/* <PwaInstallPrompt /> — hidden: PWA install prompt disabled */}
            <SessionTimeoutManager />
        </>
    );
}
