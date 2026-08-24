import type {
    ApiEnvelope,
    AuthMe,
    Branch,
    FinanceResult,
    Loan,
    LoanSchedule,
    LoanTransaction,
    LoanTransactionWithContext,
    Member,
    StatementRow,
    Tenant,
    UserProfile,
    UserRecord,
    MemberLoginProvisionResult,
    DividendAllocation,
    DividendApproval,
    DividendComponent,
    DividendCycle,
    DividendPayment,
    DividendSnapshot,
    ManualDividendBatch,
    ManualDividendBatchRow,
    PaginatedResult,
    AuditorSummary,
    AuditorException,
    AuditorJournal,
    AuditorJournalDetail,
    AuditLogEntry,
    AuditorCaseAssignee,
    AuditorCaseComment,
    AuditorCaseDetail,
    AuditorCaseEvidence,
    AuditorEvidenceDownload,
    AuditorEvidenceUploadInit,
    AuditorRiskSummary,
    AuditorExceptionTrends,
    AuditorWorkstationOverview,
    MemberApplication,
    ProductBootstrapPayload,
    LoanProduct,
    LoanApplication,
    LoanDisbursementOrder,
    LoanCapacitySummary,
    LoanProductPolicy,
    BranchLiquidityPolicy,
    BranchFundPool,
    LoanCapacityDashboard,
    LoanGuarantor,
    CollateralItem,
    ChartOfAccountOption,
    SavingsProduct,
    ShareProduct,
    FeeRule,
    PenaltyRule,
    PostingRule,
    TellerSession,
    ReceiptPolicy,
    TransactionReceipt,
    DailyCashSummary,
    ApprovalPolicy,
    ApprovalRequest,
    ApprovalOperationKey,
    ApprovalRequestStatus,
    SmsTriggerEventType,
    SmsTriggerSetting,
    MemberPortalPaymentControls,
    WorkspaceTwoFactorSettings,
    WorkspacePublicRegistrationSettings,
    SaccoFinancialYearSettings,
    SaccoPerformanceTargetSettings,
    SaccoManualImportsSettings,
    SaccoLeagueSettings,
    LeagueTier,
    LeagueStandings,
    MyLeaguePosition,
    PaymentOrder,
    TellerPaymentTransaction,
    MobileMoneyProvider,
    NotificationItem,
    NotificationListPayload,
    NotificationPreferenceItem,
    LocationRegion,
    LocationDistrict,
    LocationWard,
    LocationVillage
} from "../types/api";

const routeMap = {
    auth: {
        backendSignIn: "/auth/signin",
        twoFactorSetup: "/auth/2fa/setup",
        twoFactorVerify: "/auth/2fa/verify",
        twoFactorValidate: "/auth/2fa/validate",
        twoFactorRecovery: "/auth/2fa/recovery",
        twoFactorDisable: "/auth/2fa/disable",
        twoFactorBackupCodesRegenerate: "/auth/2fa/backup-codes/regenerate",
        // Sends a step-up code to the signed-in account's own email or phone,
        // for staff without an enrolled authenticator.
        requestStepUpOtp: "/auth/2fa/step-up/request",
        passwordSetupLinkSend: "/auth/password-setup/link/send",
        passwordResetEmailSend: "/auth/password-reset/email/send"
    },
    tenants: {
        create: "/tenants",
        list: "/tenants"
    },
    branches: {
        create: "/branches",
        list: "/branches"
    },
    users: {
        me: "/users/me",
        passwordChanged: "/users/me/password-changed",
        avatar: "/users/me/avatar",
        list: "/users",
        create: "/users",
        update: (userId: string) => `/users/${userId}`,
        temporaryCredential: (userId: string) => `/users/${userId}/temporary-credential`,
        setupSuperAdmin: "/users/setup-super-admin"
    },
    cashControl: {
        sessions: "/cash-control/sessions",
        currentSession: "/cash-control/sessions/current",
        openSession: "/cash-control/sessions/open",
        closeSession: (sessionId: string) => `/cash-control/sessions/${sessionId}/close`,
        reviewSession: (sessionId: string) => `/cash-control/sessions/${sessionId}/review`,
        receiptPolicy: "/cash-control/receipt-policy",
        initReceipt: "/cash-control/receipts/init",
        confirmReceipt: (receiptId: string) => `/cash-control/receipts/${receiptId}/confirm`,
        journalReceipts: (journalId: string) => `/cash-control/journals/${journalId}/receipts`,
        receiptDownload: (receiptId: string) => `/cash-control/receipts/${receiptId}/download`,
        dailySummary: "/cash-control/summary/daily",
        transactions: "/cash-control/transactions",
        dailyCashbookCsv: "/cash-control/reports/daily-cashbook.csv",
        tellerBalancingCsv: "/cash-control/reports/teller-balancing.csv"
    },
    products: {
        bootstrap: "/products/bootstrap",
        loans: "/products/loans",
        savings: "/products/savings",
        shares: "/products/shares",
        fees: "/products/fees",
        penalties: "/products/penalties",
        postingRules: "/products/posting-rules"
    },
    platform: {
        tenants: "/platform/tenants",
        deleteTenant: (tenantId: string) => `/platform/tenants/${tenantId}`,
        metricsSystem: "/platform/metrics/system",
        metricsTenants: "/platform/metrics/tenants",
        metricsInfrastructure: "/platform/metrics/infrastructure",
        metricsSlowEndpoints: "/platform/metrics/slow-endpoints",
        errors: "/platform/errors",
        operationsOverview: "/platform/operations/overview"
    },
    members: {
        list: "/members",
        summary: "/members/summary",
        saccoOverview: "/members/sacco-overview",
        saccoInvestments: "/members/sacco-investments",
        accounts: "/members/accounts",
        create: "/members",
        profileCompletion: "/members/me/profile-completion",
        monthlyCommitment: "/members/me/monthly-commitment",
        bulkDelete: "/members/bulk-delete",
        detail: (memberId: string) => `/members/${memberId}`,
        update: (memberId: string) => `/members/${memberId}`,
        delete: (memberId: string) => `/members/${memberId}`,
        createLogin: (memberId: string) => `/members/${memberId}/create-login`,
        impersonate: (memberId: string) => `/members/${memberId}/impersonate`,
        provisionAccount: (memberId: string) => `/members/${memberId}/accounts/provision`,
        resetPassword: (memberId: string) => `/members/${memberId}/reset-password`,
        temporaryCredential: (memberId: string) => `/members/${memberId}/temporary-credential`
    },
    memberApplications: {
        list: "/member-applications",
        detail: (applicationId: string) => `/member-applications/${applicationId}`,
        setReferrer: (applicationId: string) => `/member-applications/${applicationId}/referrer`,
        submit: (applicationId: string) => `/member-applications/${applicationId}/submit`,
        review: (applicationId: string) => `/member-applications/${applicationId}/review`,
        requestMoreInfo: (applicationId: string) => `/member-applications/${applicationId}/request-more-info`,
        me: "/member-applications/me",
        approve: (applicationId: string) => `/member-applications/${applicationId}/approve`,
        reject: (applicationId: string) => `/member-applications/${applicationId}/reject`
    },
    public: {
        signup: "/public/signup",
        branches: "/public/branches",
        signupReferrers: "/public/signup/referrers"
    },
    locations: {
        regions: "/locations/regions",
        districts: "/locations/districts",
        wards: "/locations/wards",
        villages: "/locations/villages"
    },
    loanApplications: {
        list: "/loan-applications",
        detail: (applicationId: string) => `/loan-applications/${applicationId}`,
        submit: (applicationId: string) => `/loan-applications/${applicationId}/submit`,
        appraise: (applicationId: string) => `/loan-applications/${applicationId}/appraise`,
        approve: (applicationId: string) => `/loan-applications/${applicationId}/approve`,
        reject: (applicationId: string) => `/loan-applications/${applicationId}/reject`,
        disburse: (applicationId: string) => `/loan-applications/${applicationId}/disburse`,
        attachments: (applicationId: string) => `/loan-applications/${applicationId}/attachments`,
        disbursementStatus: (orderId: string) => `/loan-applications/disbursements/${orderId}/status`,
        guarantorRequests: "/loan-applications/guarantor-requests",
        guarantorCapacity: "/loan-applications/guarantor-capacity",
        guarantorSearch: "/loan-applications/guarantor-search",
        topUpQuote: "/loan-applications/top-up-quote",
        mergeLoans: "/loan-applications/merge",
        guarantorConsent: (applicationId: string) => `/loan-applications/${applicationId}/guarantor-consent`
    },
    loanCapacity: {
        capacity: "/loans/capacity",
        productPolicy: (loanProductId: string) => `/loans/products/${loanProductId}/policy`,
        branchLiquidityPolicy: (branchId: string) => `/loans/branches/${branchId}/liquidity-policy`,
        branchFundPool: (branchId: string) => `/loans/branches/${branchId}/fund-pool`,
        dashboard: (branchId: string) => `/loans/branches/${branchId}/dashboard`
    },
    imports: {
        members: "/imports/members",
        memberSavingsHistory: "/imports/members/savings-history",
        memberShareHistory: "/imports/members/share-history",
        memberLoanHistory: "/imports/members/loan-history",
        memberLoanRepayments: "/imports/members/loan-repayments",
        memberDividendHistory: "/imports/members/dividend-history",
        memberPerformanceTargets: "/imports/members/performance-targets",
        memberJob: (jobId: string) => `/imports/members/${jobId}`,
        memberJobRows: (jobId: string) => `/imports/members/${jobId}/rows`,
        memberJobFailuresCsv: (jobId: string) => `/imports/members/${jobId}/failures.csv`,
        memberJobCredentials: (jobId: string) => `/imports/members/${jobId}/credentials`
    },
    finance: {
        deposit: "/deposit",
        withdraw: "/withdraw",
        shareContribution: "/share-contribution",
        savingsToShares: "/savings-to-shares",
        dividendAllocation: "/dividend-allocation",
        loanPortfolio: "/loan/portfolio",
        loanSchedules: "/loan/schedules",
        loanTransactions: "/loan/transactions",
        loanDisburse: "/loan/disburse",
        loanRepay: "/loan/repay",
        feeRevenue: "/fee-revenue",
        expenseAccounts: "/expense-accounts",
        expensePayment: "/expense-payment",
        operationalBatch: "/operational-batch",
        statements: "/statements",
        nplReclassStatus: "/npl-suspense-reclassification/status",
        nplReclassRun: "/npl-suspense-reclassification"
    },
    memberPayments: {
        initiateContribution: "/member-payments/contributions/initiate",
        initiateSavings: "/member-payments/savings/initiate",
        initiateMembershipFee: "/member-payments/membership-fee/initiate",
        initiateLoanRepayment: "/member-payments/loan-repayments/initiate",
        listOrders: "/member-payments/orders",
        orderStatus: (orderId: string) => `/member-payments/orders/${orderId}/status`,
        reconcile: (orderId: string) => `/member-payments/orders/${orderId}/reconcile`
    },
    dividends: {
        options: "/dividends/options",
        manualBatches: "/dividends/manual-batches",
        formulaTemplates: "/dividends/formula-templates",
        formulaManualBatch: "/dividends/manual-batches/formula",
        poolSuggestion: "/dividends/pool-suggestion",
        distributionPreview: "/dividends/distribution/preview",
        distribution: "/dividends/distribution",
        manualBatch: (batchId: string) => `/dividends/manual-batches/${batchId}`,
        submitManualBatch: (batchId: string) => `/dividends/manual-batches/${batchId}/submit`,
        postManualBatch: (batchId: string) => `/dividends/manual-batches/${batchId}/post`,
        rejectManualBatch: (batchId: string) => `/dividends/manual-batches/${batchId}/reject`,
        cycles: "/dividends/cycles",
        cycle: (cycleId: string) => `/dividends/cycles/${cycleId}`,
        freeze: (cycleId: string) => `/dividends/cycles/${cycleId}/freeze`,
        allocate: (cycleId: string) => `/dividends/cycles/${cycleId}/allocate`,
        submit: (cycleId: string) => `/dividends/cycles/${cycleId}/submit`,
        approve: (cycleId: string) => `/dividends/cycles/${cycleId}/approve`,
        reject: (cycleId: string) => `/dividends/cycles/${cycleId}/reject`,
        pay: (cycleId: string) => `/dividends/cycles/${cycleId}/pay`,
        close: (cycleId: string) => `/dividends/cycles/${cycleId}/close`
    },
    auditor: {
        summary: "/auditor/summary",
        riskSummary: "/auditor/risk-summary",
        exceptionTrends: "/auditor/exception-trends",
        workstationOverview: "/auditor/workstation-overview",
        exceptions: "/auditor/exceptions",
        caseAssignees: "/auditor/cases/assignees",
        caseDetail: (caseKey: string) => `/auditor/cases/${caseKey}`,
        updateCase: (caseKey: string) => `/auditor/cases/${caseKey}`,
        addCaseComment: (caseKey: string) => `/auditor/cases/${caseKey}/comments`,
        initCaseEvidenceUpload: (caseKey: string) => `/auditor/cases/${caseKey}/evidence/init`,
        confirmCaseEvidenceUpload: (evidenceId: string) => `/auditor/cases/evidence/${evidenceId}/confirm`,
        downloadCaseEvidence: (evidenceId: string) => `/auditor/cases/evidence/${evidenceId}/download`,
        journals: "/auditor/journals",
        journalDetail: (journalId: string) => `/auditor/journals/${journalId}`,
        auditLogs: "/auditor/audit-logs",
        loginHistory: "/auditor/login-history",
        trialBalanceCsv: "/auditor/reports/trial-balance.csv",
        loanAgingCsv: "/auditor/reports/loan-aging.csv",
        parCsv: "/auditor/reports/par.csv",
        dividendsRegisterCsv: "/auditor/reports/dividends-register.csv"
    },
    reports: {
        trialBalance: "/reports/trial-balance/export",
        balanceSheet: "/reports/balance-sheet/export",
        incomeStatement: "/reports/income-statement/export",
        chargeRevenueSummary: "/reports/revenue/summary",
        fundingSources: "/reports/funding-sources",
        memberStatements: "/reports/member-statements/export",
        par: "/reports/par/export",
        loanAging: "/reports/loan-aging/export",
        auditEvidencePack: "/reports/audit-evidence-pack/export",
        exportJobs: "/reports/export-jobs",
        exportJob: (jobId: string) => `/reports/export-jobs/${jobId}`,
        exportJobDownload: (jobId: string) => `/reports/export-jobs/${jobId}/download`
    },
    approvals: {
        policies: "/approvals/policies",
        policy: (operationKey: ApprovalOperationKey) => `/approvals/policies/${operationKey}`,
        requests: "/approvals/requests",
        request: (requestId: string) => `/approvals/requests/${requestId}`,
        approve: (requestId: string) => `/approvals/requests/${requestId}/approve`,
        reject: (requestId: string) => `/approvals/requests/${requestId}/reject`
    },
    notificationSettings: {
        smsTriggers: "/notification-settings/sms-triggers",
        smsTrigger: (eventType: SmsTriggerEventType) => `/notification-settings/sms-triggers/${eventType}`
    },
    memberPortalSettings: {
        paymentControls: "/member-portal-settings/payment-controls"
    },
    securitySettings: {
        twoFactor: "/security-settings/two-factor",
        publicRegistration: "/security-settings/public-registration"
    },
    saccoSettings: {
        financialYear: "/sacco-settings/financial-year",
        performanceTarget: "/sacco-settings/performance-target",
        manualImports: "/sacco-settings/manual-imports",
        leagues: "/sacco-settings/leagues",
        guarantorPolicy: "/sacco-settings/guarantor-policy",
        loanMultiplier: "/sacco-settings/loan-multiplier",
        shareCapital: "/sacco-settings/share-capital"
    },
    leagues: {
        standings: "/leagues/standings",
        me: "/leagues/me",
        snapshot: "/leagues/snapshot"
    },
    weeklyChallenges: {
        list: "/weekly-challenges",
        create: "/weekly-challenges",
        detail: (id: string) => `/weekly-challenges/${id}`,
        update: (id: string) => `/weekly-challenges/${id}`,
        openRegistration: (id: string) => `/weekly-challenges/${id}/open-registration`,
        bulkRegister: (id: string) => `/weekly-challenges/${id}/participants/bulk`,
        withdrawParticipant: (id: string, memberId: string) => `/weekly-challenges/${id}/participants/${memberId}`,
        standings: (id: string) => `/weekly-challenges/${id}/standings`,
        active: "/weekly-challenges/active",
        register: (id: string) => `/weekly-challenges/${id}/register`,
        me: (id: string) => `/weekly-challenges/${id}/me`
    },
    milestones: {
        board: "/sacco-milestones",
        create: "/sacco-milestones",
        detail: (id: string) => `/sacco-milestones/${id}`,
        announce: (id: string) => `/sacco-milestones/${id}/announce`
    },
    memberHeirs: {
        me: "/member-heirs/me",
        member: (memberId: string) => `/member-heirs/members/${memberId}`
    },
    saccoDashboard: {
        financials: "/sacco-dashboard/financials"
    },
    allReports: {
        contributionsSummary: "/all-reports/contributions-summary",
        monthlyContributions: "/all-reports/monthly-contributions",
        dividendDistributions: "/all-reports/dividend-distributions",
        memberPositions: "/all-reports/member-positions",
        memberProfitStatement: "/all-reports/member-profit-statement",
        uttInvestments: "/all-reports/utt-investments",
        performanceTargets: "/all-reports/performance-targets",
        commitments: "/all-reports/commitments",
        summarySorted: "/all-reports/summary-sorted",
        loans: "/all-reports/loans",
        loanIncome: "/all-reports/loan-income",
        operationsFund: "/all-reports/operations-fund",
        fundsPosition: "/all-reports/funds-position",
        fundsPositionFigures: "/all-reports/funds-position/figures",
        operationsStatement: "/all-reports/operations-statement",
        gawioSummary: "/all-reports/gawio-summary",
        myStatement: "/all-reports/my-statement",
        myMonthly: "/all-reports/my-monthly",
        myPosition: "/all-reports/my-position",
        myLoans: "/all-reports/my-loans"
    },
    notifications: {
        list: "/notifications",
        preferences: "/notifications/preferences",
        preference: (eventType: string) => `/notifications/preferences/${eventType}`,
        markRead: (notificationId: string) => `/notifications/${notificationId}/read`,
        markAllRead: "/notifications/read-all",
        archive: (notificationId: string) => `/notifications/${notificationId}/archive`,
        archiveRead: "/notifications/archive-read"
    },
    treasury: {
        overview: "/treasury/overview",
        liquidity: "/treasury/liquidity",
        policy: "/treasury/policy",
        auditLog: "/treasury/audit-log",
        assets: "/treasury/assets",
        portfolio: "/treasury/portfolio",
        valuation: (assetId: string) => `/treasury/portfolio/${assetId}/valuation`,
        orders: "/treasury/orders",
        reviewOrder: (orderId: string) => `/treasury/orders/${orderId}/review`,
        executeOrder: (orderId: string) => `/treasury/orders/${orderId}/execute`,
        recordOrderPayment: (orderId: string) => `/treasury/orders/${orderId}/payment`,
        transactions: "/treasury/transactions",
        income: "/treasury/income"
    }
} as const;

export const endpoints = {
    auth: {
        backendSignIn: () => routeMap.auth.backendSignIn,
        twoFactorSetup: () => routeMap.auth.twoFactorSetup,
        requestStepUpOtp: () => routeMap.auth.requestStepUpOtp,
        twoFactorVerify: () => routeMap.auth.twoFactorVerify,
        twoFactorValidate: () => routeMap.auth.twoFactorValidate,
        twoFactorRecovery: () => routeMap.auth.twoFactorRecovery,
        twoFactorDisable: () => routeMap.auth.twoFactorDisable,
        twoFactorBackupCodesRegenerate: () => routeMap.auth.twoFactorBackupCodesRegenerate,
        passwordSetupLinkSend: () => routeMap.auth.passwordSetupLinkSend,
        passwordResetEmailSend: () => routeMap.auth.passwordResetEmailSend
    },
    tenants: {
        create: () => routeMap.tenants.create,
        list: () => routeMap.tenants.list
    },
    branches: {
        create: () => routeMap.branches.create,
        list: () => routeMap.branches.list
    },
    users: {
        me: () => routeMap.users.me,
        passwordChanged: () => routeMap.users.passwordChanged,
        avatar: () => routeMap.users.avatar,
        list: () => routeMap.users.list,
        create: () => routeMap.users.create,
        update: (userId: string) => routeMap.users.update(userId),
        temporaryCredential: (userId: string) => routeMap.users.temporaryCredential(userId),
        setupSuperAdmin: () => routeMap.users.setupSuperAdmin
    },
    cashControl: {
        sessions: () => routeMap.cashControl.sessions,
        currentSession: () => routeMap.cashControl.currentSession,
        openSession: () => routeMap.cashControl.openSession,
        closeSession: (sessionId: string) => routeMap.cashControl.closeSession(sessionId),
        reviewSession: (sessionId: string) => routeMap.cashControl.reviewSession(sessionId),
        receiptPolicy: () => routeMap.cashControl.receiptPolicy,
        initReceipt: () => routeMap.cashControl.initReceipt,
        confirmReceipt: (receiptId: string) => routeMap.cashControl.confirmReceipt(receiptId),
        journalReceipts: (journalId: string) => routeMap.cashControl.journalReceipts(journalId),
        receiptDownload: (receiptId: string) => routeMap.cashControl.receiptDownload(receiptId),
        dailySummary: () => routeMap.cashControl.dailySummary,
        transactions: () => routeMap.cashControl.transactions,
        dailyCashbookCsv: () => routeMap.cashControl.dailyCashbookCsv,
        tellerBalancingCsv: () => routeMap.cashControl.tellerBalancingCsv
    },
    products: {
        bootstrap: () => routeMap.products.bootstrap,
        loans: () => routeMap.products.loans,
        savings: () => routeMap.products.savings,
        shares: () => routeMap.products.shares,
        fees: () => routeMap.products.fees,
        penalties: () => routeMap.products.penalties,
        postingRules: () => routeMap.products.postingRules
    },
    platform: {
        tenants: () => routeMap.platform.tenants,
        deleteTenant: (tenantId: string) => routeMap.platform.deleteTenant(tenantId),
        metricsSystem: () => routeMap.platform.metricsSystem,
        metricsTenants: () => routeMap.platform.metricsTenants,
        metricsInfrastructure: () => routeMap.platform.metricsInfrastructure,
        metricsSlowEndpoints: () => routeMap.platform.metricsSlowEndpoints,
        errors: () => routeMap.platform.errors,
        operationsOverview: () => routeMap.platform.operationsOverview
    },
    members: {
        list: () => routeMap.members.list,
        summary: () => routeMap.members.summary,
        saccoOverview: () => routeMap.members.saccoOverview,
        saccoInvestments: () => routeMap.members.saccoInvestments,
        accounts: () => routeMap.members.accounts,
        create: () => routeMap.members.create,
        profileCompletion: () => routeMap.members.profileCompletion,
        monthlyCommitment: () => routeMap.members.monthlyCommitment,
        bulkDelete: () => routeMap.members.bulkDelete,
        detail: (memberId: string) => routeMap.members.detail(memberId),
        update: (memberId: string) => routeMap.members.update(memberId),
        delete: (memberId: string) => routeMap.members.delete(memberId),
        createLogin: (memberId: string) => routeMap.members.createLogin(memberId),
        impersonate: (memberId: string) => routeMap.members.impersonate(memberId),
        provisionAccount: (memberId: string) => routeMap.members.provisionAccount(memberId),
        resetPassword: (memberId: string) => routeMap.members.resetPassword(memberId),
        temporaryCredential: (memberId: string) => routeMap.members.temporaryCredential(memberId)
    },
    memberApplications: {
        list: () => routeMap.memberApplications.list,
        detail: (applicationId: string) => routeMap.memberApplications.detail(applicationId),
        setReferrer: (applicationId: string) => routeMap.memberApplications.setReferrer(applicationId),
        submit: (applicationId: string) => routeMap.memberApplications.submit(applicationId),
        review: (applicationId: string) => routeMap.memberApplications.review(applicationId),
        requestMoreInfo: (applicationId: string) => routeMap.memberApplications.requestMoreInfo(applicationId),
        me: () => routeMap.memberApplications.me,
        approve: (applicationId: string) => routeMap.memberApplications.approve(applicationId),
        reject: (applicationId: string) => routeMap.memberApplications.reject(applicationId)
    },
    public: {
        signup: () => routeMap.public.signup,
        branches: () => routeMap.public.branches,
        signupReferrers: () => routeMap.public.signupReferrers
    },
    locations: {
        regions: () => routeMap.locations.regions,
        districts: () => routeMap.locations.districts,
        wards: () => routeMap.locations.wards,
        villages: () => routeMap.locations.villages
    },
    loanApplications: {
        list: () => routeMap.loanApplications.list,
        detail: (applicationId: string) => routeMap.loanApplications.detail(applicationId),
        update: (applicationId: string) => routeMap.loanApplications.detail(applicationId),
        submit: (applicationId: string) => routeMap.loanApplications.submit(applicationId),
        appraise: (applicationId: string) => routeMap.loanApplications.appraise(applicationId),
        approve: (applicationId: string) => routeMap.loanApplications.approve(applicationId),
        reject: (applicationId: string) => routeMap.loanApplications.reject(applicationId),
        disburse: (applicationId: string) => routeMap.loanApplications.disburse(applicationId),
        attachments: (applicationId: string) => routeMap.loanApplications.attachments(applicationId),
        disbursementStatus: (orderId: string) => routeMap.loanApplications.disbursementStatus(orderId),
        guarantorRequests: () => routeMap.loanApplications.guarantorRequests,
        guarantorCapacity: () => routeMap.loanApplications.guarantorCapacity,
        guarantorSearch: () => routeMap.loanApplications.guarantorSearch,
        topUpQuote: () => routeMap.loanApplications.topUpQuote,
        mergeLoans: () => routeMap.loanApplications.mergeLoans,
        guarantorConsent: (applicationId: string) => routeMap.loanApplications.guarantorConsent(applicationId)
    },
    loanCapacity: {
        capacity: () => routeMap.loanCapacity.capacity,
        bestCapacity: () => `${routeMap.loanCapacity.capacity}/best`,
        productPolicy: (loanProductId: string) => routeMap.loanCapacity.productPolicy(loanProductId),
        branchLiquidityPolicy: (branchId: string) => routeMap.loanCapacity.branchLiquidityPolicy(branchId),
        branchFundPool: (branchId: string) => routeMap.loanCapacity.branchFundPool(branchId),
        dashboard: (branchId: string) => routeMap.loanCapacity.dashboard(branchId)
    },
    imports: {
        members: () => routeMap.imports.members,
        memberSavingsHistory: () => routeMap.imports.memberSavingsHistory,
        memberShareHistory: () => routeMap.imports.memberShareHistory,
        memberLoanHistory: () => routeMap.imports.memberLoanHistory,
        memberLoanRepayments: () => routeMap.imports.memberLoanRepayments,
        memberDividendHistory: () => routeMap.imports.memberDividendHistory,
        memberPerformanceTargets: () => routeMap.imports.memberPerformanceTargets,
        memberJob: (jobId: string) => routeMap.imports.memberJob(jobId),
        memberJobRows: (jobId: string) => routeMap.imports.memberJobRows(jobId),
        memberJobFailuresCsv: (jobId: string) => routeMap.imports.memberJobFailuresCsv(jobId),
        memberJobCredentials: (jobId: string) => routeMap.imports.memberJobCredentials(jobId)
    },
    finance: {
        deposit: () => routeMap.finance.deposit,
        withdraw: () => routeMap.finance.withdraw,
        shareContribution: () => routeMap.finance.shareContribution,
        savingsToShares: () => routeMap.finance.savingsToShares,
        savingsToSharesPlan: () => `${routeMap.finance.savingsToShares}/plan`,
        savingsToSharesBulk: () => `${routeMap.finance.savingsToShares}/bulk`,
        dividendAllocation: () => routeMap.finance.dividendAllocation,
        loanPortfolio: () => routeMap.finance.loanPortfolio,
        loanSchedules: () => routeMap.finance.loanSchedules,
        loanTransactions: () => routeMap.finance.loanTransactions,
        loanDisburse: () => routeMap.finance.loanDisburse,
        loanRepay: () => routeMap.finance.loanRepay,
        feeRevenue: () => routeMap.finance.feeRevenue,
        expenseAccounts: () => routeMap.finance.expenseAccounts,
        expensePayment: () => routeMap.finance.expensePayment,
        operationalBatch: () => routeMap.finance.operationalBatch,
        statements: () => routeMap.finance.statements,
        // No "/finance" segment: routes/index.js mounts financeRoutes at "/", so
        // these live at /api/transactions/... alongside /api/statements and
        // /api/deposit. The extra prefix made every call 404 with ROUTE_NOT_FOUND.
        updateBankMeta: (transactionId: string) => `/transactions/${transactionId}/bank-meta`,
        reverseTransaction: (transactionId: string) => `/transactions/${transactionId}/reverse`,
        correctLoanInterest: (transactionId: string) => `/loan/transactions/${transactionId}/correct-interest`,
        reverseLoanRepayment: (transactionId: string) => `/loan/transactions/${transactionId}/reverse`,
        correctTransactionDate: (transactionId: string) => `/transactions/${transactionId}/value-date`,
        nplReclassStatus: () => routeMap.finance.nplReclassStatus,
        nplReclassRun: () => routeMap.finance.nplReclassRun
    },
    memberPayments: {
        initiateContribution: () => routeMap.memberPayments.initiateContribution,
        initiateSavings: () => routeMap.memberPayments.initiateSavings,
        initiateMembershipFee: () => routeMap.memberPayments.initiateMembershipFee,
        initiateLoanRepayment: () => routeMap.memberPayments.initiateLoanRepayment,
        listOrders: () => routeMap.memberPayments.listOrders,
        orderStatus: (orderId: string) => routeMap.memberPayments.orderStatus(orderId),
        reconcile: (orderId: string) => routeMap.memberPayments.reconcile(orderId)
    },
    dividends: {
        options: () => routeMap.dividends.options,
        manualBatches: () => routeMap.dividends.manualBatches,
        formulaTemplates: () => routeMap.dividends.formulaTemplates,
        formulaManualBatch: () => routeMap.dividends.formulaManualBatch,
        poolSuggestion: () => routeMap.dividends.poolSuggestion,
        distributionPreview: () => routeMap.dividends.distributionPreview,
        distribution: () => routeMap.dividends.distribution,
        manualBatch: (batchId: string) => routeMap.dividends.manualBatch(batchId),
        submitManualBatch: (batchId: string) => routeMap.dividends.submitManualBatch(batchId),
        postManualBatch: (batchId: string) => routeMap.dividends.postManualBatch(batchId),
        rejectManualBatch: (batchId: string) => routeMap.dividends.rejectManualBatch(batchId),
        cycles: () => routeMap.dividends.cycles,
        cycle: (cycleId: string) => routeMap.dividends.cycle(cycleId),
        freeze: (cycleId: string) => routeMap.dividends.freeze(cycleId),
        allocate: (cycleId: string) => routeMap.dividends.allocate(cycleId),
        submit: (cycleId: string) => routeMap.dividends.submit(cycleId),
        approve: (cycleId: string) => routeMap.dividends.approve(cycleId),
        reject: (cycleId: string) => routeMap.dividends.reject(cycleId),
        pay: (cycleId: string) => routeMap.dividends.pay(cycleId),
        close: (cycleId: string) => routeMap.dividends.close(cycleId)
    },
    auditor: {
        summary: () => routeMap.auditor.summary,
        riskSummary: () => routeMap.auditor.riskSummary,
        exceptionTrends: () => routeMap.auditor.exceptionTrends,
        workstationOverview: () => routeMap.auditor.workstationOverview,
        exceptions: () => routeMap.auditor.exceptions,
        caseAssignees: () => routeMap.auditor.caseAssignees,
        caseDetail: (caseKey: string) => routeMap.auditor.caseDetail(caseKey),
        updateCase: (caseKey: string) => routeMap.auditor.updateCase(caseKey),
        addCaseComment: (caseKey: string) => routeMap.auditor.addCaseComment(caseKey),
        initCaseEvidenceUpload: (caseKey: string) => routeMap.auditor.initCaseEvidenceUpload(caseKey),
        confirmCaseEvidenceUpload: (evidenceId: string) => routeMap.auditor.confirmCaseEvidenceUpload(evidenceId),
        downloadCaseEvidence: (evidenceId: string) => routeMap.auditor.downloadCaseEvidence(evidenceId),
        journals: () => routeMap.auditor.journals,
        journalDetail: (journalId: string) => routeMap.auditor.journalDetail(journalId),
        auditLogs: () => routeMap.auditor.auditLogs,
        loginHistory: () => routeMap.auditor.loginHistory,
        trialBalanceCsv: () => routeMap.auditor.trialBalanceCsv,
        loanAgingCsv: () => routeMap.auditor.loanAgingCsv,
        parCsv: () => routeMap.auditor.parCsv,
        dividendsRegisterCsv: () => routeMap.auditor.dividendsRegisterCsv
    },
    reports: {
        trialBalance: () => routeMap.reports.trialBalance,
        balanceSheet: () => routeMap.reports.balanceSheet,
        incomeStatement: () => routeMap.reports.incomeStatement,
        chargeRevenueSummary: () => routeMap.reports.chargeRevenueSummary,
        fundingSources: () => routeMap.reports.fundingSources,
        memberStatements: () => routeMap.reports.memberStatements,
        par: () => routeMap.reports.par,
        loanAging: () => routeMap.reports.loanAging,
        auditEvidencePack: () => routeMap.reports.auditEvidencePack,
        exportJobs: () => routeMap.reports.exportJobs,
        exportJob: (jobId: string) => routeMap.reports.exportJob(jobId),
        exportJobDownload: (jobId: string) => routeMap.reports.exportJobDownload(jobId)
    },
    approvals: {
        policies: () => routeMap.approvals.policies,
        policy: (operationKey: ApprovalOperationKey) => routeMap.approvals.policy(operationKey),
        requests: () => routeMap.approvals.requests,
        request: (requestId: string) => routeMap.approvals.request(requestId),
        approve: (requestId: string) => routeMap.approvals.approve(requestId),
        reject: (requestId: string) => routeMap.approvals.reject(requestId)
    },
    notificationSettings: {
        smsTriggers: () => routeMap.notificationSettings.smsTriggers,
        smsTrigger: (eventType: SmsTriggerEventType) => routeMap.notificationSettings.smsTrigger(eventType)
    },
    memberPortalSettings: {
        paymentControls: () => routeMap.memberPortalSettings.paymentControls
    },
    securitySettings: {
        twoFactor: () => routeMap.securitySettings.twoFactor,
        publicRegistration: () => routeMap.securitySettings.publicRegistration
    },
    saccoSettings: {
        financialYear: () => routeMap.saccoSettings.financialYear,
        performanceTarget: () => routeMap.saccoSettings.performanceTarget,
        manualImports: () => routeMap.saccoSettings.manualImports,
        leagues: () => routeMap.saccoSettings.leagues,
        guarantorPolicy: () => routeMap.saccoSettings.guarantorPolicy,
        loanMultiplier: () => routeMap.saccoSettings.loanMultiplier,
        shareCapital: () => routeMap.saccoSettings.shareCapital,
        shareCapitalPrice: (priceId: string) =>
            `${routeMap.saccoSettings.shareCapital}/${priceId}`,
        shareCapitalCountsAsSavings: () =>
            `${routeMap.saccoSettings.shareCapital}/counts-as-savings`
    },
    leagues: {
        standings: () => routeMap.leagues.standings,
        me: () => routeMap.leagues.me,
        snapshot: () => routeMap.leagues.snapshot
    },
    weeklyChallenges: {
        list: () => routeMap.weeklyChallenges.list,
        create: () => routeMap.weeklyChallenges.create,
        detail: (id: string) => routeMap.weeklyChallenges.detail(id),
        update: (id: string) => routeMap.weeklyChallenges.update(id),
        openRegistration: (id: string) => routeMap.weeklyChallenges.openRegistration(id),
        bulkRegister: (id: string) => routeMap.weeklyChallenges.bulkRegister(id),
        withdrawParticipant: (id: string, memberId: string) => routeMap.weeklyChallenges.withdrawParticipant(id, memberId),
        standings: (id: string) => routeMap.weeklyChallenges.standings(id),
        active: () => routeMap.weeklyChallenges.active,
        register: (id: string) => routeMap.weeklyChallenges.register(id),
        me: (id: string) => routeMap.weeklyChallenges.me(id)
    },
    milestones: {
        board: () => routeMap.milestones.board,
        create: () => routeMap.milestones.create,
        detail: (id: string) => routeMap.milestones.detail(id),
        announce: (id: string) => routeMap.milestones.announce(id)
    },
    memberHeirs: {
        me: () => routeMap.memberHeirs.me,
        member: (memberId: string) => routeMap.memberHeirs.member(memberId)
    },
    saccoDashboard: {
        financials: () => routeMap.saccoDashboard.financials
    },
    operations: {
        entries: () => "/operations/entries",
        reverse: (id: string) => `/operations/entries/${id}/reverse`,
        assignLoanFee: (journalId: string) => `/operations/loan-fees/${journalId}/assign`,
        savingsTransfers: () => "/operations/savings-transfers"
    },
    allReports: {
        contributionsSummary: () => routeMap.allReports.contributionsSummary,
        monthlyContributions: () => routeMap.allReports.monthlyContributions,
        dividendDistributions: () => routeMap.allReports.dividendDistributions,
        memberPositions: () => routeMap.allReports.memberPositions,
        memberProfitStatement: () => routeMap.allReports.memberProfitStatement,
        uttInvestments: () => routeMap.allReports.uttInvestments,
        performanceTargets: () => routeMap.allReports.performanceTargets,
        commitments: () => routeMap.allReports.commitments,
        summarySorted: () => routeMap.allReports.summarySorted,
        loans: () => routeMap.allReports.loans,
        loanIncome: () => routeMap.allReports.loanIncome,
        operationsFund: () => routeMap.allReports.operationsFund,
        fundsPosition: () => routeMap.allReports.fundsPosition,
        fundsPositionFigures: () => routeMap.allReports.fundsPositionFigures,
        operationsStatement: () => routeMap.allReports.operationsStatement,
        gawioSummary: () => routeMap.allReports.gawioSummary,
        myStatement: () => routeMap.allReports.myStatement,
        myMonthly: () => routeMap.allReports.myMonthly,
        myPosition: () => routeMap.allReports.myPosition,
        myLoans: () => routeMap.allReports.myLoans
    },
    notifications: {
        list: () => routeMap.notifications.list,
        preferences: () => routeMap.notifications.preferences,
        preference: (eventType: string) => routeMap.notifications.preference(eventType),
        markRead: (notificationId: string) => routeMap.notifications.markRead(notificationId),
        markAllRead: () => routeMap.notifications.markAllRead,
        archive: (notificationId: string) => routeMap.notifications.archive(notificationId),
        archiveRead: () => routeMap.notifications.archiveRead
    },
    treasury: {
        overview: () => routeMap.treasury.overview,
        liquidity: () => routeMap.treasury.liquidity,
        policy: () => routeMap.treasury.policy,
        auditLog: () => routeMap.treasury.auditLog,
        assets: () => routeMap.treasury.assets,
        portfolio: () => routeMap.treasury.portfolio,
        valuation: (assetId: string) => routeMap.treasury.valuation(assetId),
        orders: () => routeMap.treasury.orders,
        reviewOrder: (orderId: string) => routeMap.treasury.reviewOrder(orderId),
        executeOrder: (orderId: string) => routeMap.treasury.executeOrder(orderId),
        recordOrderPayment: (orderId: string) => routeMap.treasury.recordOrderPayment(orderId),
        transactions: () => routeMap.treasury.transactions,
        income: () => routeMap.treasury.income
    }
};

export interface AuthSessionTokens {
    access_token: string;
    refresh_token: string;
}

export interface TwoFactorSetupResponse {
    qr_code: string;
    manual_entry_key: string;
    issuer: string;
    account_name: string;
}

export interface TwoFactorVerifyResponse {
    success: boolean;
    backup_codes: string[];
    enabled_at: string;
}

export interface TwoFactorValidateRequest {
    totp_code?: string | null;
    recovery_code?: string | null;
}

export interface TwoFactorValidateResponse {
    success: boolean;
    method: "totp" | "recovery_code";
    verified_at: string;
    verified_until: string;
}

export interface TwoFactorDisableResponse {
    success: boolean;
}

export interface TwoFactorBackupCodesResponse {
    success: boolean;
    backup_codes: string[];
}

export interface PasswordSetupLinkSendResponse {
    success: boolean;
    destination_hint?: string;
}

export interface BackendSignInRequest {
    email: string;
    password: string;
    totp_code?: string | null;
    recovery_code?: string | null;
}

export interface BackendSignInResponse {
    session: AuthSessionTokens & Record<string, unknown>;
    user: {
        id: string;
        email?: string;
    };
    profile: UserProfile | null;
}

export interface MemberImpersonationResponse {
    session: AuthSessionTokens & Record<string, unknown>;
    member: {
        id: string;
        full_name: string;
        member_no: string | null;
    };
}

export interface CreateTenantRequest {
    name: string;
    registration_number: string;
    status?: "active" | "inactive" | "suspended";
}

export type CreateTenantResponse = ApiEnvelope<Tenant>;
export type TenantsListResponse = ApiEnvelope<Tenant[]>;

export interface CreateBranchRequest {
    tenant_id: string;
    name: string;
    code: string;
    address_line1: string;
    address_line2?: string | null;
    city: string;
    state: string;
    country: string;
}

export type CreateBranchResponse = ApiEnvelope<Branch>;
export type BranchesListResponse = ApiEnvelope<Branch[]>;

export interface PublicReferrerOption {
    id: string;
    member_no: string | null;
    full_name: string;
}

export interface PublicSignupRequest {
    branch_id: string;
    /// Required: the API rejects a signup that names no referring member.
    referred_by_member_id: string;
    first_name: string;
    last_name: string;
    gender: "male" | "female" | "other";
    marital_status: "single" | "married" | "divorced" | "widowed";
    occupation: string;
    employer_name?: string | null;
    phone: string;
    email: string;
    password: string;
    national_id: string;
    date_of_birth: string;
    region_id: string;
    district_id: string;
    ward_id: string;
    village_id?: string | null;
    region?: string | null;
    district?: string | null;
    ward?: string | null;
    street_or_village?: string | null;
    residential_address: string;
    next_of_kin_name: string;
    relationship:
        | "spouse"
        | "father"
        | "mother"
        | "son"
        | "daughter"
        | "brother"
        | "sister"
        | "guardian"
        | "relative"
        | "friend"
        | "other"
        | "parent"
        | "sibling"
        | "child";
    next_of_kin_phone: string;
    next_of_kin_address?: string | null;
    next_of_kin_region_id?: string | null;
    next_of_kin_district_id?: string | null;
    next_of_kin_ward_id?: string | null;
    next_of_kin_village_id?: string | null;
    next_of_kin_street?: string | null;
    heir_name: string;
    heir_relationship: PublicSignupRequest["relationship"];
    heir_phone: string;
    heir_address?: string | null;
    heir_region_id?: string | null;
    heir_district_id?: string | null;
    heir_ward_id?: string | null;
    heir_village_id?: string | null;
    heir_street?: string | null;
    membership_type: "individual" | "group" | "company";
    ilboru_completion_year: number;
    initial_share_amount: number;
    monthly_savings_commitment: number;
    legitimate_income_declared: true;
    no_conflicting_business_declared: true;
    terms_accepted: true;
    data_processing_consent: true;
}

export interface PublicSignupBranch {
    id: string;
    tenant_id: string;
    name: string;
    code: string;
    membership_fee_amount: number;
    minimum_initial_share_amount: number;
    minimum_monthly_savings_commitment: number;
}

export type PublicSignupResponse = ApiEnvelope<{
    user: {
        id: string;
        email: string;
        phone: string;
        tenant_id: string;
        branch_id: string;
    };
    application: MemberApplication;
}>;

export type PublicSignupBranchesResponse = ApiEnvelope<PublicSignupBranch[]>;

export interface SetupSuperAdminRequest {
    tenant_id: string;
    branch_id?: string | null;
    email: string;
    full_name: string;
    phone?: string | null;
    send_invite?: boolean;
    password?: string | null;
}

export type SetupSuperAdminResponse = ApiEnvelope<{
    user?: {
        id: string;
        email?: string;
    };
    profile?: UserProfile;
    branch_id?: string;
    temporary_password?: string | null;
}>;

export interface CreateUserRequest {
    tenant_id?: string;
    email: string;
    full_name: string;
    phone?: string | null;
    role: "super_admin" | "branch_manager" | "treasury_officer" | "loan_officer" | "teller" | "auditor";
    branch_ids: string[];
    send_invite?: boolean;
    password?: string;
}

export type CreateUserResponse = ApiEnvelope<UserRecord>;
export type UsersListResponse = ApiEnvelope<import("../types/api").StaffAccessPayload>;

export interface UpdateUserRequest {
    full_name?: string;
    phone?: string | null;
    role?: "super_admin" | "branch_manager" | "treasury_officer" | "loan_officer" | "teller" | "auditor";
    is_active?: boolean;
    branch_ids?: string[];
}

export interface MeQuery {
    tenant_id?: string;
}

export type MeResponse = ApiEnvelope<AuthMe>;
export type PlatformTenantsResponse = ApiEnvelope<Tenant[]>;

export interface DeleteTenantRequest {
    confirm_name: string;
}

export interface CreateMemberRequest {
    tenant_id?: string;
    branch_id: string;
    savings_product_id?: string | null;
    share_product_id?: string | null;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    dob?: string | null;
    phone?: string | null;
    email?: string | null;
    member_no?: string | null;
    national_id?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postal_code?: string | null;
    nida_no?: string | null;
    tin_no?: string | null;
    next_of_kin_name?: string | null;
    next_of_kin_phone?: string | null;
    next_of_kin_relationship?: string | null;
    employer?: string | null;
    kyc_status?: "pending" | "verified" | "rejected" | "waived";
    kyc_reason?: string | null;
    notes?: string | null;
    status?: "active" | "suspended" | "exited" | "approved_pending_payment";
    login?: {
        create_login: boolean;
        send_invite?: boolean;
        password?: string | null;
    };
}

export interface ProvisionMemberAccountRequest {
    branch_id?: string | null;
    product_type: "savings" | "shares" | "fixed_deposit";
    savings_product_id?: string | null;
    share_product_id?: string | null;
    account_name?: string | null;
}

export type MembersResponse = ApiEnvelope<Member[]>;
export interface MembersSummaryData {
    total: number;
    active: number;
    linked_logins: number;
    total_savings: number;
}
export type MembersSummaryResponse = ApiEnvelope<MembersSummaryData>;
export type MemberAccountsResponse = ApiEnvelope<import("../types/api").MemberAccount[]>;
export type CreateMemberResponse = ApiEnvelope<{
    member: Member;
    login: MemberLoginProvisionResult | null;
}>;
export type ProvisionMemberAccountResponse = ApiEnvelope<import("../types/api").MemberAccount>;
export interface UpdateMemberRequest {
    branch_id?: string;
    full_name?: string;
    dob?: string | null;
    phone?: string | null;
    email?: string | null;
    gender?: "male" | "female" | "other" | null;
    marital_status?: "single" | "married" | "divorced" | "widowed" | null;
    occupation?: string | null;
    member_no?: string | null;
    national_id?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postal_code?: string | null;
    region_id?: string | null;
    district_id?: string | null;
    ward_id?: string | null;
    village_id?: string | null;
    region?: string | null;
    district?: string | null;
    ward?: string | null;
    street_or_village?: string | null;
    residential_address?: string | null;
    nida_no?: string | null;
    tin_no?: string | null;
    next_of_kin_name?: string | null;
    next_of_kin_phone?: string | null;
    next_of_kin_relationship?: string | null;
    next_of_kin_address?: string | null;
    next_of_kin_region_id?: string | null;
    next_of_kin_district_id?: string | null;
    next_of_kin_ward_id?: string | null;
    next_of_kin_village_id?: string | null;
    next_of_kin_street?: string | null;
    heir_name?: string | null;
    heir_phone?: string | null;
    heir_relationship?: string | null;
    heir_address?: string | null;
    employer?: string | null;
    membership_type?: "individual" | "group" | "company" | null;
    membership_started_on?: string | null;
    school_completion_level?: "form_4" | "form_6" | null;
    school_completion_year?: number | null;
    school_examination_number?: string | null;
    ilboru_completion_year?: number | null;
    legitimate_income_declared?: boolean | null;
    no_conflicting_business_declared?: boolean | null;
    initial_share_amount?: number | null;
    monthly_savings_commitment?: number | null;
    performance_target_amount?: number | null;
    kyc_status?: "pending" | "verified" | "rejected" | "waived";
    kyc_reason?: string | null;
    notes?: string | null;
    status?: "active" | "suspended" | "exited" | "approved_pending_payment";
}
export type UpdateMemberResponse = ApiEnvelope<Member>;

export interface UpdateOwnMemberProfileCompletionRequest {
    full_name?: string | null;
    dob?: string | null;
    phone?: string | null;
    email?: string | null;
    gender?: "male" | "female" | "other" | null;
    marital_status?: "single" | "married" | "divorced" | "widowed" | null;
    occupation?: string | null;
    employer?: string | null;
    id_type?: string | null;
    national_id?: string | null;
    nida_no?: string | null;
    tin_no?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postal_code?: string | null;
    region_id?: string | null;
    district_id?: string | null;
    ward_id?: string | null;
    village_id?: string | null;
    region?: string | null;
    district?: string | null;
    ward?: string | null;
    street_or_village?: string | null;
    residential_address?: string | null;
    next_of_kin_name?: string | null;
    next_of_kin_phone?: string | null;
    next_of_kin_relationship?: string | null;
    next_of_kin_address?: string | null;
    next_of_kin_region_id?: string | null;
    next_of_kin_district_id?: string | null;
    next_of_kin_ward_id?: string | null;
    next_of_kin_village_id?: string | null;
    next_of_kin_street?: string | null;
    heir_name?: string | null;
    heir_phone?: string | null;
    heir_relationship?: string | null;
    heir_address?: string | null;
    ilboru_completion_year?: number | null;
    legitimate_income_declared?: boolean | null;
    no_conflicting_business_declared?: boolean | null;
}
export type UpdateOwnMemberProfileCompletionResponse = ApiEnvelope<Member>;

export interface MemberMonthlyCommitmentStatus {
    commitment_amount: number;
    paid_this_month: number;
    remaining_amount: number;
    month_start: string | null;
    met: boolean;
}

export type MemberMonthlyCommitmentStatusResponse = ApiEnvelope<MemberMonthlyCommitmentStatus>;

export interface BulkDeleteMembersRequest {
    member_ids: string[];
}

export type BulkDeleteMembersResponse = ApiEnvelope<{
    requested: number;
    deleted_count: number;
    failed_count: number;
    deleted_members: Array<{ id: string; full_name: string }>;
    failed_members: Array<{ id: string; code: string; message: string }>;
}>;

export interface CreateMemberApplicationRequest {
    branch_id: string;
    full_name: string;
    dob?: string | null;
    phone?: string | null;
    email?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postal_code?: string | null;
    region_id?: string | null;
    district_id?: string | null;
    ward_id?: string | null;
    village_id?: string | null;
    region?: string | null;
    district?: string | null;
    ward?: string | null;
    street_or_village?: string | null;
    residential_address?: string | null;
    nida_no?: string | null;
    tin_no?: string | null;
    next_of_kin_name?: string | null;
    next_of_kin_phone?: string | null;
    next_of_kin_relationship?: string | null;
    employer?: string | null;
    member_no?: string | null;
    national_id?: string | null;
    notes?: string | null;
    kyc_status?: "pending" | "verified" | "rejected" | "waived";
    kyc_reason?: string | null;
    membership_fee_amount?: number | null;
    membership_fee_paid?: number;
}

export interface ReviewMemberApplicationRequest {
    notes?: string | null;
    kyc_status?: "pending" | "verified" | "rejected" | "waived";
    kyc_reason?: string | null;
}

export interface RequestMoreInfoMemberApplicationRequest {
    reason: string;
}

export interface RejectMemberApplicationRequest {
    reason: string;
}

export type MemberApplicationsResponse = ApiEnvelope<MemberApplication[]>;
export type MemberApplicationResponse = ApiEnvelope<MemberApplication | null>;
export type LocationRegionsResponse = ApiEnvelope<LocationRegion[]>;
export type LocationDistrictsResponse = ApiEnvelope<LocationDistrict[]>;
export type LocationWardsResponse = ApiEnvelope<LocationWard[]>;
export type LocationVillagesResponse = ApiEnvelope<{
    items: LocationVillage[];
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
}>;
export type ProductBootstrapResponse = ApiEnvelope<ProductBootstrapPayload>;
export type LoanProductsResponse = ApiEnvelope<LoanProduct[]>;
export type SavingsProductsResponse = ApiEnvelope<SavingsProduct[]>;
export type ShareProductsResponse = ApiEnvelope<ShareProduct[]>;
export type FeeRulesResponse = ApiEnvelope<FeeRule[]>;
export type PenaltyRulesResponse = ApiEnvelope<PenaltyRule[]>;
export type PostingRulesResponse = ApiEnvelope<PostingRule[]>;
export type ExpenseAccountsResponse = ApiEnvelope<ChartOfAccountOption[]>;

export interface CreateMemberLoginRequest {
    email?: string | null;
    send_invite?: boolean;
    password?: string | null;
}

export interface ResetMemberPasswordRequest {
    password?: string | null;
}

export type LoansResponse = ApiEnvelope<Loan[]>;
export type LoanApplicationResponse = ApiEnvelope<LoanApplication>;
export type LoanApplicationsResponse = ApiEnvelope<LoanApplication[]>;
export type LoanCapacityResponse = ApiEnvelope<LoanCapacitySummary>;

// Best-tier capacity read for the member portal: the winning product's summary
// plus which product it came from. summary is null when no product qualifies.
export interface BestLoanCapacity {
    summary: LoanCapacitySummary | null;
    loan_product: {
        id: string;
        name: string;
        min_amount: number | null;
        max_amount: number | null;
        annual_interest_rate: number | null;
    } | null;
    evaluated_product_count: number;
}

export type BestLoanCapacityResponse = ApiEnvelope<BestLoanCapacity>;
export type LoanProductPolicyResponse = ApiEnvelope<LoanProductPolicy>;
export type BranchLiquidityPolicyResponse = ApiEnvelope<BranchLiquidityPolicy>;
export type BranchFundPoolResponse = ApiEnvelope<BranchFundPool>;
export type LoanCapacityDashboardResponse = ApiEnvelope<LoanCapacityDashboard>;
export type LoanSchedulesResponse = ApiEnvelope<LoanSchedule[]>;
export type LoanTransactionsResponse = ApiEnvelope<LoanTransaction[]>;
export type LoanTransactionsWithContextResponse = ApiEnvelope<LoanTransactionWithContext[]>;
export type GuarantorRequestsResponse = ApiEnvelope<GuarantorRequestItem[]>;
export type TellerSessionsResponse = ApiEnvelope<TellerSession[]>;
export type TellerSessionResponse = ApiEnvelope<TellerSession | null>;
export type ReceiptPolicyResponse = ApiEnvelope<ReceiptPolicy>;
export type TransactionReceiptsResponse = ApiEnvelope<TransactionReceipt[]>;
export type DailyCashSummaryResponse = ApiEnvelope<DailyCashSummary[]>;

export interface OpenTellerSessionRequest {
    branch_id?: string;
    opening_cash: number;
    notes?: string | null;
}

export interface UpdateLoanProductPolicyRequest {
    tenant_id?: string;
    contribution_multiplier?: number;
    max_loan_amount?: number;
    min_loan_amount?: number;
    liquidity_buffer_percent?: number;
    requires_guarantor?: boolean;
    requires_collateral?: boolean;
    two_factor_code?: string | null;
    recovery_code?: string | null;
}

export interface UpdateBranchLiquidityPolicyRequest {
    tenant_id?: string;
    max_lending_ratio?: number;
    minimum_liquidity_reserve?: number;
    auto_loan_freeze_threshold?: number;
    two_factor_code?: string | null;
    recovery_code?: string | null;
}

export interface CreateLoanApplicationRequest {
    tenant_id?: string;
    branch_id?: string;
    member_id?: string;
    product_id: string;
    external_reference?: string | null;
    purpose: string;
    requested_amount: number;
    requested_term_count: number;
    requested_repayment_frequency?: "daily" | "weekly" | "monthly";
    requested_interest_rate?: number | null;
    payout_method?: "cash" | "direct_deposit" | "bank_transfer";
    payout_bank_name?: string;
    payout_bank_branch?: string;
    payout_account_name?: string;
    payout_account_number?: string;
    declaration_accepted?: boolean;
    repayment_mode?: "check_off" | "standing_order";
    loan_category?: "new" | "top_up";
    top_up_of_loan_id?: string | null;
    deposit_purchase_amount?: number | null;
    application_fee_paid?: boolean;
    guarantors?: LoanGuarantor[];
    collateral_items?: CollateralItem[];
}

export type UpdateLoanApplicationRequest = Partial<CreateLoanApplicationRequest>;

export interface AppraiseLoanApplicationRequest {
    recommended_amount: number;
    recommended_term_count: number;
    recommended_interest_rate: number;
    recommended_repayment_frequency: "daily" | "weekly" | "monthly";
    risk_rating: "low" | "medium" | "high";
    appraisal_notes: string;
    guarantors?: LoanGuarantor[];
    collateral_items?: CollateralItem[];
}

export interface ApproveLoanApplicationRequest {
    notes?: string | null;
    two_factor_code?: string | null;
    recovery_code?: string | null;
}

export interface RejectLoanApplicationRequest {
    reason: string;
    notes?: string | null;
}

export interface DisburseApprovedLoanRequest {
    reference?: string | null;
    description?: string | null;
    disbursement_channel?: "cash" | "mobile_money";
    recipient_msisdn?: string | null;
    approval_request_id?: string;
    receipt_ids?: string[];
    two_factor_code?: string | null;
    recovery_code?: string | null;
}

export interface LoanDisbursementActionResult {
    application?: LoanApplication;
    disbursement?: FinanceResult;
    mobile_disbursement?: LoanDisbursementOrder;
    approval_required?: boolean;
    approval_request_id?: string;
    existing_order?: boolean;
    status?: string;
}

export type LoanDisbursementActionResponse = ApiEnvelope<LoanDisbursementActionResult>;
export type LoanDisbursementOrderStatusResponse = ApiEnvelope<{ order: LoanDisbursementOrder }>;

export interface GuarantorConsentRequest {
    tenant_id?: string;
    decision: "accepted" | "rejected";
    accepted_amount?: number | null;
    notes?: string | null;
}

export interface GuarantorCapacityLookup {
    member_id: string;
    full_name: string;
    member_no: string;
    is_active: boolean;
    available_amount: number;
    committed_amount: number;
    eligible: boolean;
    policy: {
        max_commitment_ratio: number;
        capacity_base: "savings" | "savings_shares";
        max_guarantors_per_application: number;
    };
}

export type GuarantorCapacityResponse = ApiEnvelope<GuarantorCapacityLookup>;

export interface GuarantorSearchHit {
    member_id: string;
    full_name: string;
    member_no: string;
}

export type GuarantorSearchResponse = ApiEnvelope<GuarantorSearchHit[]>;

export interface TopUpQuoteLoan {
    loan_id: string;
    loan_number: string;
    status: string;
    outstanding_principal: number;
    accrued_interest: number;
    settle_amount: number;
}

export interface TopUpQuote {
    member_id: string;
    /** True once the member carries any open loan — a new loan is refused. */
    top_up_required: boolean;
    settlement_amount: number;
    loans: TopUpQuoteLoan[];
}

export type TopUpQuoteResponse = ApiEnvelope<TopUpQuote>;

export interface MergeLoansRequest {
    tenant_id?: string;
    member_id: string;
    product_id: string;
    term_count: number;
    repayment_frequency?: "daily" | "weekly" | "monthly";
    reference?: string | null;
    description?: string | null;
    two_factor_code?: string | null;
    recovery_code?: string | null;
}

export interface MergeLoansResult {
    new_loan_id: string;
    merged_principal: number;
    term_count: number;
    annual_interest_rate: number;
    product_name: string;
    settled: Array<{ loan_id: string; loan_number: string; settled_amount: number; journal_id: string | null }>;
    total_settled: number;
    net_cash_movement: number;
}

export type MergeLoansResponse = ApiEnvelope<MergeLoansResult>;

export interface GuarantorPolicySettings {
    tenant_id: string;
    guarantor_exposure_enforced: boolean;
    guarantor_max_commitment_ratio: number;
    guarantor_capacity_base: "savings" | "savings_shares";
    max_guarantors_per_application: number;
    guarantor_release_mode: "on_close" | "proportional";
    guarantor_block_encumbered_withdrawals: boolean;
}

export type GuarantorPolicySettingsResponse = ApiEnvelope<GuarantorPolicySettings>;

export interface UpdateGuarantorPolicyRequest {
    tenant_id?: string;
    guarantor_exposure_enforced?: boolean;
    guarantor_max_commitment_ratio?: number;
    guarantor_capacity_base?: "savings" | "savings_shares";
    max_guarantors_per_application?: number;
    guarantor_release_mode?: "on_close" | "proportional";
    guarantor_block_encumbered_withdrawals?: boolean;
}

export interface LoanMultiplierProduct {
    id: string;
    code: string;
    name: string;
    status: string;
    catalog_multiplier: number;
    /** Null when the product has no capacity-policy row, so the catalog figure applies. */
    policy_multiplier: number | null;
    effective_multiplier: number;
}

export interface LoanMultiplierSettings {
    tenant_id: string;
    /** Null when active products disagree — there is no single SACCO rule to show. */
    multiplier: number | null;
    is_uniform: boolean;
    product_count: number;
    active_product_count: number;
    products: LoanMultiplierProduct[];
}

export type LoanMultiplierSettingsResponse = ApiEnvelope<LoanMultiplierSettings>;

export interface UpdateLoanMultiplierRequest {
    tenant_id?: string;
    multiplier: number;
}

export interface SharePrice {
    id: string;
    price_per_share: number;
    required_shares: number;
    /** price_per_share × required_shares, computed server-side so it cannot disagree. */
    total_required: number;
    effective_from: string;
    note: string | null;
    created_at: string;
}

/**
 * What this member in particular is held to: the price in force on the day
 * they joined, not today's. Returned only when a member is asking.
 *
 * 150 of ILBORU's 151 members joined under the old price, so quoting the
 * current one to all of them would overstate their requirement by two million
 * each.
 */
export interface MemberShareRequirement {
    member_id: string;
    joined_on: string | null;
    price_per_share: number;
    required_shares: number;
    total_required: number;
    effective_from: string;
    /** True when their price is no longer the SACCOS's current one. */
    is_historic_price: boolean;
}

export interface ShareCapitalSettings {
    tenant_id: string;
    /**
     * True while share capital still counts toward a member's borrowing base.
     * Turning it off cuts every member's limit by their share capital times
     * the loan multiple.
     */
    counts_as_savings: boolean;
    member_requirement?: MemberShareRequirement | null;
    /** The price in force today. Null only when nothing has been recorded yet. */
    current: SharePrice | null;
    last_change: {
        from_price: number;
        to_price: number;
        effective_from: string;
    } | null;
    /** Decided but not yet in force — a rise the board has already approved. */
    upcoming: SharePrice[];
    history: SharePrice[];
}

export type ShareCapitalSettingsResponse = ApiEnvelope<ShareCapitalSettings>;

export interface SavingsToSharesRow {
    member_id: string;
    member_no: string;
    member_name: string;
    branch_id: string;
    joined_on: string | null;
    price_per_share: number;
    required_shares: number;
    required: number;
    /** Null when the member has no active account of that kind. */
    share_balance: number | null;
    savings_balance: number | null;
    /** Savings this member has pledged guaranteeing other members' loans. */
    encumbered: number;
    shortfall: number;
    /** What a posting would actually move: the shortfall, capped by free savings. */
    movable: number;
    status: "ready" | "partial" | "blocked" | "complete";
    reason: string | null;
}

export interface SavingsToSharesPlan {
    rows: SavingsToSharesRow[];
    totals: { members: number; movable: number; short: number; complete: number };
}

export type SavingsToSharesPlanResponse = ApiEnvelope<SavingsToSharesPlan>;

export interface SavingsToSharesRun {
    dry_run: boolean;
    considered: number;
    posted: number;
    failed: number;
    moved: number;
    rows: (SavingsToSharesRow & { outcome?: "posted" | "failed"; journal_id?: string; error?: string })[];
}

export type SavingsToSharesRunResponse = ApiEnvelope<SavingsToSharesRun>;

export interface SetShareCapitalCountsAsSavingsRequest {
    tenant_id?: string;
    counts_as_savings: boolean;
}

export interface AddSharePriceRequest {
    tenant_id?: string;
    price_per_share: number;
    required_shares: number;
    effective_from: string;
    note?: string;
}

export interface GuarantorRequestItem {
    id: string;
    application_id: string;
    tenant_id: string;
    member_id: string;
    guaranteed_amount: number;
    accepted_amount?: number | null;
    consent_status: "pending" | "accepted" | "rejected";
    consented_at?: string | null;
    notes?: string | null;
    created_at: string;
    borrower?: Pick<Member, "id" | "full_name" | "member_no"> | null;
    loan_application?: {
        id: string;
        status: LoanApplication["status"];
        purpose: string;
        requested_amount: number;
    } | null;
}

export interface CloseTellerSessionRequest {
    closing_cash: number;
    notes?: string | null;
}

export interface ReviewTellerSessionRequest {
    review_notes?: string | null;
}

export interface UpdateReceiptPolicyRequest {
    branch_id?: string | null;
    receipt_required: boolean;
    required_threshold: number;
    max_receipts_per_tx: number;
    allowed_mime_types: string[];
    max_file_size_mb: number;
    enforce_on_types: Array<"deposit" | "withdraw" | "loan_repay" | "loan_disburse" | "share_contribution" | "fee_revenue" | "expense_payment">;
}

export interface ReceiptInitRequest {
    branch_id: string;
    member_id?: string | null;
    transaction_type: "deposit" | "withdraw" | "loan_repay" | "loan_disburse" | "share_contribution" | "fee_revenue" | "expense_payment";
    file_name: string;
    mime_type: string;
    file_size_bytes: number;
}

export interface ReceiptInitResponseData {
    receipt: TransactionReceipt;
    upload: {
        path: string;
        token: string;
        signedUrl: string;
    };
}

export type ReceiptInitResponse = ApiEnvelope<ReceiptInitResponseData>;
export type ReceiptDownloadResponse = ApiEnvelope<{ signed_url: string; receipt: TransactionReceipt }>;
export type TellerPaymentTransactionsResponse = ApiEnvelope<TellerPaymentTransaction[]>;

export type CreateMemberLoginResponse = ApiEnvelope<MemberLoginProvisionResult>;
export type ResetMemberPasswordResponse = ApiEnvelope<MemberLoginProvisionResult>;
export type TemporaryCredentialResponse = ApiEnvelope<import("../types/api").TemporaryCredential>;

export interface ImportMembersResponseData {
    job_id: string;
    total_rows: number;
    success_rows: number;
    failed_rows: number;
    credentials_download_url?: string | null;
}

export type ImportMembersResponse = ApiEnvelope<ImportMembersResponseData>;
export interface MemberHistoryBulkMemberSummary {
    member_id?: string;
    member_no: string | null;
    full_name?: string;
    account_id?: string;
    resolved: boolean;
    posted_rows: number;
    skipped_rows?: number;
    failed_rows: number;
    total_amount: number;
    latest_balance?: number | null;
}

export interface MemberSavingsHistoryImportResponseData {
    // "single" when targeting one member by id, "bulk" when keyed by member_no.
    mode?: "single" | "bulk";
    member?: {
        id: string;
        full_name: string;
        member_no?: string | null;
    };
    account_id?: string;
    // Bulk-only roll-up fields.
    members_in_file?: number;
    members?: MemberHistoryBulkMemberSummary[];
    total_rows: number;
    posted_rows: number;
    skipped_rows?: number;
    failed_rows: number;
    total_amount: number;
    posted?: Array<{
        row_number: number;
        member_no?: string | null;
        journal_id: string | null;
        reference: string;
        amount: number;
        occurred_at: string;
        funding_source?: string | null;
        cumulative: number | null;
    }>;
    failures: Array<{
        row_number: number;
        member_no?: string | null;
        error: string;
        raw: Record<string, string>;
    }>;
}

export type MemberSavingsHistoryImportResponse = ApiEnvelope<MemberSavingsHistoryImportResponseData>;
export interface MemberShareHistoryImportResponseData extends MemberSavingsHistoryImportResponseData {
    latest_balance?: number | null;
    running_balance_rows_updated?: number;
}

export type MemberShareHistoryImportResponse = ApiEnvelope<MemberShareHistoryImportResponseData>;
export interface MemberLoanHistoryImportResponseData {
    mode?: "single" | "bulk";
    member?: {
        id: string;
        full_name: string;
        member_no?: string | null;
    };
    members_in_file?: number;
    members?: MemberHistoryBulkMemberSummary[];
    total_rows: number;
    posted_rows: number;
    skipped_rows: number;
    failed_rows: number;
    total_amount: number;
    posted: Array<{
        row_number: number;
        loan_id: string | null;
        loan_number: string | null;
        journal_id: string | null;
        reference: string;
        amount: number;
        monthly_interest_rate: number | null;
        annual_interest_rate: number | null;
        term_months: number;
        repayment_frequency: "daily" | "weekly" | "monthly";
        disbursed_at: string | null;
        first_due_date: string | null;
        installment_amount: number | null;
    }>;
    skipped: Array<{
        row_number: number;
        loan_id: string | null;
        loan_number: string | null;
        journal_id: string | null;
        reference: string;
        amount: number;
        monthly_interest_rate: number | null;
        annual_interest_rate: number | null;
        term_months: number;
        repayment_frequency: "daily" | "weekly" | "monthly";
        disbursed_at: string | null;
        first_due_date: string | null;
        installment_amount: number | null;
    }>;
    failures: Array<{
        row_number: number;
        member_no?: string | null;
        error: string;
        raw: Record<string, string>;
    }>;
}

export type MemberLoanHistoryImportResponse = ApiEnvelope<MemberLoanHistoryImportResponseData>;
export interface MemberLoanRepaymentImportResponseData {
    mode?: "bulk";
    total_rows: number;
    posted_rows: number;
    failed_rows: number;
    total_amount: number;
    posted: Array<{
        row_number: number;
        loan_reference: string;
        member_no?: string | null;
        loan_id: string;
        journal_id: string | null;
        amount: number;
        occurred_at: string;
    }>;
    failures: Array<{
        row_number: number;
        member_no?: string | null;
        error: string;
        raw: Record<string, string>;
    }>;
}
export type MemberLoanRepaymentImportResponse = ApiEnvelope<MemberLoanRepaymentImportResponseData>;
export interface MemberDividendHistoryImportResponseData extends Omit<MemberSavingsHistoryImportResponseData, "posted"> {
    latest_balance: number | null;
    running_balance_rows_updated: number;
    posted: Array<{
        row_number: number;
        journal_id: string | null;
        reference: string;
        amount: number;
        occurred_at: string;
    }>;
}

export type MemberDividendHistoryImportResponse = ApiEnvelope<MemberDividendHistoryImportResponseData>;
export interface MemberPerformanceTargetImportResponseData {
    tenant_id: string;
    total_rows: number;
    updated_rows: number;
    failed_rows: number;
    rows: Array<{
        row_number: number;
        member_id?: string | null;
        member_no?: string | null;
        full_name?: string | null;
        old_target: number | null;
        new_target: number | null;
        status: "success" | "failed";
        error?: string | null;
    }>;
}

export type MemberPerformanceTargetImportResponse = ApiEnvelope<MemberPerformanceTargetImportResponseData>;
export type ImportJobResponse = ApiEnvelope<import("../types/api").ImportJob>;
export type ImportJobRowsResponse = ApiEnvelope<{
    items: import("../types/api").ImportJobRow[];
    total: number;
    page: number;
    limit: number;
}>;
export type CredentialsLinkResponse = ApiEnvelope<{ signed_url: string }>;

export interface CashRequest {
    tenant_id?: string;
    account_id: string;
    amount: number;
    reference?: string | null;
    description?: string | null;
    bank_description?: string | null;
    bank_reference?: string | null;
    approval_request_id?: string;
    value_date?: string;
    receipt_ids?: string[];
}

export type CashResponse = ApiEnvelope<FinanceResult>;
export type ShareContributionRequest = CashRequest;
export type ShareContributionResponse = CashResponse;
export type DividendAllocationRequest = CashRequest;
export type DividendAllocationResponse = CashResponse;

export interface OperationalBatchRowRequest {
    operation: "savings_deposit" | "share_contribution" | "loan_repayment" | "fee_revenue";
    member_id?: string;
    member_no?: string;
    email?: string;
    account_id?: string;
    loan_id?: string;
    loan_number?: string;
    fee_rule_code?: string;
    amount?: number;
    reference?: string | null;
    description?: string | null;
    receipt_ids?: string[];
}

export interface OperationalBatchRequest {
    tenant_id?: string;
    branch_id?: string;
    rows: OperationalBatchRowRequest[];
}

export interface OperationalBatchResultRow {
    row_number: number;
    operation: OperationalBatchRowRequest["operation"] | null;
    status: "posted" | "skipped" | "failed";
    reference?: string | null;
    journal_id?: string | null;
    amount: number;
    code?: string;
    message: string;
}

export interface OperationalBatchResult {
    total_rows: number;
    posted_rows: number;
    skipped_rows?: number;
    failed_rows: number;
    rows: OperationalBatchResultRow[];
}

export type OperationalBatchResponse = ApiEnvelope<OperationalBatchResult>;

export interface InitiateContributionPaymentRequest {
    tenant_id?: string;
    account_id?: string;
    loan_id?: string;
    amount: number;
    provider: MobileMoneyProvider;
    msisdn: string;
    description?: string | null;
}

export interface InitiateContributionPaymentResponseData {
    order: PaymentOrder;
    gateway: {
        provider_ref: string | null;
        response: Record<string, unknown>;
    };
    processing_state?: "pending_confirmation";
}

export type InitiateContributionPaymentResponse = ApiEnvelope<InitiateContributionPaymentResponseData>;
export interface PaymentOrderListQuery {
    tenant_id?: string;
    branch_id?: string;
    member_id?: string;
    purpose?: "share_contribution" | "savings_deposit" | "membership_fee" | "loan_repayment";
    status?: "created" | "pending" | "paid" | "failed" | "expired" | "posted";
    page?: number;
    limit?: number;
}
export type PaymentOrdersResponse = ApiEnvelope<PaginatedResult<PaymentOrder>>;

export interface ChargeRevenueSummaryQuery {
    tenant_id?: string;
    branch_id?: string;
    from_date?: string;
    to_date?: string;
}

export type ChargeRevenueSummaryResponse = ApiEnvelope<import("../types/api").ChargeRevenueSummary>;
export interface FundingSourceSummaryData {
    available: boolean;
    total: number;
    untagged_total: number;
    sources: Array<{
        code: string;
        label: string;
        total: number;
        count: number;
        percent: number;
    }>;
}
export type FundingSourceSummaryResponse = ApiEnvelope<FundingSourceSummaryData>;
export type PaymentOrderStatusResponse = ApiEnvelope<{
    order: PaymentOrder;
    order_id?: string;
    status?: "pending" | "completed" | "failed" | "expired";
    gateway_reference?: string | null;
    amount?: number;
    gateway_checked?: boolean;
    gateway_status?: string | null;
}>;
export type ReconcilePaymentOrderResponse = ApiEnvelope<{ reconciled: boolean; order: PaymentOrder }>;
export type NotificationsResponse = ApiEnvelope<NotificationListPayload>;
export type NotificationResponse = ApiEnvelope<NotificationItem>;
export type NotificationsMarkAllReadResponse = ApiEnvelope<{ updated: number }>;
export type NotificationsArchiveResponse = ApiEnvelope<NotificationItem>;
export type NotificationsArchiveReadResponse = ApiEnvelope<{ updated: number }>;
export type NotificationPreferencesResponse = ApiEnvelope<NotificationPreferenceItem[]>;
export type NotificationPreferenceResponse = ApiEnvelope<NotificationPreferenceItem>;

export interface DividendComponentInput {
    type: "share_dividend" | "savings_interest_bonus" | "patronage_refund";
    basis_method:
        | "end_balance"
        | "average_daily_balance"
        | "average_monthly_balance"
        | "minimum_balance"
        | "total_interest_paid"
        | "total_fees_paid"
        | "transaction_volume";
    distribution_mode: "rate" | "fixed_pool";
    rate_percent?: number | null;
    pool_amount?: number | null;
    retained_earnings_account_id: string;
    dividends_payable_account_id: string;
    payout_account_id?: string | null;
    reserve_account_id?: string | null;
    eligibility_rules_json: Record<string, unknown>;
    rounding_rules_json: Record<string, unknown>;
}

export interface CreateDividendCycleRequest {
    tenant_id?: string;
    branch_id?: string | null;
    period_label: string;
    start_date: string;
    end_date: string;
    declaration_date: string;
    record_date?: string | null;
    payment_date?: string | null;
    required_checker_count: number;
    components: DividendComponentInput[];
}

export type UpdateDividendCycleRequest = Partial<CreateDividendCycleRequest>;
export interface DividendApprovalRequest {
    notes?: string | null;
    signature_hash?: string | null;
}

export interface DividendPaymentRequest {
    payment_method: "cash" | "bank" | "mobile_money" | "reinvest_to_shares";
    reference?: string | null;
    description?: string | null;
}

export interface ManualDividendBatchRowInput {
    member_id: string;
    dividend_date: string;
    dividend_label: string;
    source_type: string;
    amount: number;
    reference?: string | null;
    destination_account_type: "savings" | "shares";
    notes?: string | null;
}

export interface CreateManualDividendBatchRequest {
    tenant_id?: string;
    branch_id?: string | null;
    batch_label: string;
    rows: ManualDividendBatchRowInput[];
}

export interface FormulaDividendComponentInput {
    key?: string;
    dividend_date: string;
    dividend_label: string;
    source_type: string;
    base_method?: "balance_at_cutoff" | "contributions_to_date";
    base_cutoff_date: string;
    pool_amount: number;
}

export interface DividendPoolSuggestion {
    start_date: string;
    end_date: string;
    loan_interest: number;
    treasury_income: number;
    total: number;
}

export interface DividendPoolSuggestionResponse {
    data: DividendPoolSuggestion;
}

export interface DividendFormulaTemplate {
    id: string;
    tenant_id: string;
    branch_id?: string | null;
    template_name: string;
    description?: string | null;
    components: FormulaDividendComponentInput[];
    status: "active" | "archived";
    created_at: string;
    updated_at?: string;
}

export type DividendFormulaTemplatesResponse = ApiEnvelope<DividendFormulaTemplate[]>;

export interface SaveDividendFormulaTemplateRequest {
    tenant_id?: string;
    branch_id?: string | null;
    template_name: string;
    description?: string | null;
    components: FormulaDividendComponentInput[];
}

export interface GenerateFormulaManualDividendBatchRequest {
    tenant_id?: string;
    branch_id: string;
    batch_label?: string;
    template_id?: string;
    save_as_template?: boolean;
    template_name?: string;
    components?: FormulaDividendComponentInput[];
}

export interface RejectManualDividendBatchRequest {
    notes?: string | null;
}

export interface DividendOptionsResponse extends ApiEnvelope<{
    branches: Branch[];
    accounts: Array<{
        id: string;
        account_code: string;
        account_name: string;
        account_type: string;
        system_tag?: string | null;
    }>;
    members: Pick<Member, "id" | "tenant_id" | "branch_id" | "full_name" | "member_no" | "status">[];
}> {}

export type ManualDividendBatchesResponse = ApiEnvelope<ManualDividendBatch[]>;
export type ManualDividendBatchDetailResponse = ApiEnvelope<{
    batch: ManualDividendBatch;
    rows: ManualDividendBatchRow[];
    formula?: {
        generated_rows: number;
        total_amount: number;
        template_id?: string | null;
        template_name?: string | null;
        components: Array<{
            key: string;
            dividend_label: string;
            dividend_date: string;
            source_type: string;
            base_column: string;
            base_label: string;
            base_cutoff_date: string;
            base_total: number;
            pool_cell: string;
            pool_amount: number;
            generated_rows: number;
        }>;
    };
    posting?: {
        posted_rows: number;
        total_amount: number;
        recalculated_running_balance_rows: number;
        rows: Array<{
            row_id: string;
            reference: string;
            amount: number;
            destination_account_type: "savings" | "shares";
            declaration_journal_id: string;
            payment_journal_id: string;
        }>;
    };
}>;

export type DividendCyclesResponse = ApiEnvelope<DividendCycle[]>;
export type DividendCycleDetailResponse = ApiEnvelope<{
    cycle: DividendCycle;
    components: DividendComponent[];
    approvals: DividendApproval[];
    allocations: DividendAllocation[];
    snapshots: DividendSnapshot[];
    payments: DividendPayment[];
}>;

export interface LoanDisburseRequest {
    tenant_id?: string;
    member_id: string;
    branch_id: string;
    principal_amount: number;
    annual_interest_rate: number;
    term_count: number;
    repayment_frequency?: "daily" | "weekly" | "monthly";
    reference?: string | null;
    description?: string | null;
}

export type LoanRepaymentAllocation = "auto" | "interest_only" | "principal_only";

export interface LoanRepaymentRequest {
    tenant_id?: string;
    loan_id: string;
    amount: number;
    reference?: string | null;
    description?: string | null;
    allocation?: LoanRepaymentAllocation;
    receipt_ids?: string[];
}

export interface ExpensePaymentRequest {
    tenant_id?: string;
    branch_id?: string;
    expense_account_id: string;
    amount: number;
    payee?: string | null;
    reference?: string | null;
    description?: string | null;
    value_date?: string;
    receipt_ids?: string[];
}

export interface StatementQuery {
    tenant_id?: string;
    member_id?: string;
    account_id?: string;
    from_date?: string;
    to_date?: string;
}

export type StatementsResponse = ApiEnvelope<StatementRow[]>;
export type AuditorSummaryResponse = ApiEnvelope<AuditorSummary>;
export type AuditorRiskSummaryResponse = ApiEnvelope<AuditorRiskSummary>;
export type AuditorExceptionTrendsResponse = ApiEnvelope<AuditorExceptionTrends>;
export type AuditorWorkstationOverviewResponse = ApiEnvelope<AuditorWorkstationOverview>;
export type AuditorExceptionsResponse = ApiEnvelope<PaginatedResult<AuditorException>>;
export type AuditorJournalsResponse = ApiEnvelope<PaginatedResult<AuditorJournal>>;
export type AuditorJournalDetailResponse = ApiEnvelope<AuditorJournalDetail>;
export type AuditorAuditLogsResponse = ApiEnvelope<PaginatedResult<AuditLogEntry>>;
export type AuditorCaseAssigneesResponse = ApiEnvelope<AuditorCaseAssignee[]>;
export type AuditorCaseDetailResponse = ApiEnvelope<AuditorCaseDetail>;
export type AuditorCaseResponse = ApiEnvelope<Pick<
    AuditorException,
    "case_id" | "case_key" | "case_status" | "case_notes" | "case_assignee_user_id" | "case_assignee_name" | "case_resolved_at" | "case_updated_at"
>>;
export type AuditorCaseCommentResponse = ApiEnvelope<AuditorCaseComment>;
export type AuditorEvidenceInitResponse = ApiEnvelope<AuditorEvidenceUploadInit>;
export type AuditorCaseEvidenceResponse = ApiEnvelope<AuditorCaseEvidence>;
export type AuditorEvidenceDownloadResponse = ApiEnvelope<AuditorEvidenceDownload>;

export interface ReportExportJob {
    id: string;
    tenant_id: string;
    created_by: string;
    report_key: string;
    format: "csv" | "pdf";
    query: Record<string, unknown>;
    status: "pending" | "processing" | "completed" | "failed";
    filename?: string | null;
    title?: string | null;
    row_count: number;
    result_path?: string | null;
    content_type?: string | null;
    error_code?: string | null;
    error_message?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
    created_at: string;
}

export interface ReportExportJobCreated {
    job_id: string;
    status: "pending" | "processing" | "completed" | "failed";
    report_key: string;
    format: "csv" | "pdf";
    created_at: string;
}

export interface ReportExportJobDownloadData {
    signed_url: string;
    expires_in_seconds: number;
    filename: string;
    content_type: string;
}

export type ReportExportJobCreateResponse = ApiEnvelope<ReportExportJobCreated>;
export type ReportExportJobsResponse = ApiEnvelope<ReportExportJob[]>;
export type ReportExportJobResponse = ApiEnvelope<ReportExportJob>;
export type ReportExportJobDownloadResponse = ApiEnvelope<ReportExportJobDownloadData>;

export interface PlatformMetricsTimeseriesPoint {
    timestamp: string;
    requests_per_sec: number;
    p95_latency_ms: number;
    error_rate_pct: number;
}

export interface PlatformSystemMetrics {
    requests_per_sec: number;
    p95_latency_ms: number;
    error_rate_pct: number;
    active_users: number;
    active_tenants: number;
    sms_total_count?: number;
    sms_sent_count?: number;
    sms_failed_count?: number;
    sms_delivery_rate_pct?: number;
    window_minutes: number;
    timeseries: PlatformMetricsTimeseriesPoint[];
}

export interface PlatformTenantTrafficRow {
    tenant_id: string;
    tenant_name: string;
    request_count: number;
    error_count: number;
    avg_latency_ms: number;
    active_users: number;
    sms_total_count?: number;
    sms_sent_count?: number;
    sms_failed_count?: number;
    sms_delivery_rate_pct?: number;
}

export interface PlatformInfrastructureMetrics {
    cpu_pct: number;
    memory_pct: number;
    disk_pct: number;
    network_mbps: number;
    sampled_at?: string;
    network_window_minutes?: number;
}

export interface PlatformErrorRow {
    timestamp: string;
    endpoint: string;
    status_code: number;
    tenant_id: string | null;
    tenant_name?: string;
    message: string;
}

export interface PlatformErrorsResponse {
    data: PlatformErrorRow[];
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
}

export interface PlatformSlowEndpointRow {
    endpoint: string;
    avg_latency_ms: number;
    calls: number;
}

export interface PlatformOperationsOverview {
    window_minutes: number;
    scope_tenant_id?: string | null;
    system: PlatformSystemMetrics;
    tenants: PlatformTenantTrafficRow[];
    infrastructure: PlatformInfrastructureMetrics;
    slow_endpoints: PlatformSlowEndpointRow[];
    errors: PlatformErrorRow[];
}

export type PlatformSystemMetricsResponse = ApiEnvelope<PlatformSystemMetrics>;
export type PlatformTenantTrafficResponse = ApiEnvelope<PlatformTenantTrafficRow[]>;
export type PlatformInfrastructureMetricsResponse = ApiEnvelope<PlatformInfrastructureMetrics>;
export type PlatformSlowEndpointsResponse = ApiEnvelope<PlatformSlowEndpointRow[]>;
export type PlatformOperationsOverviewResponse = ApiEnvelope<PlatformOperationsOverview>;

export interface ApprovalPoliciesResponse extends ApiEnvelope<ApprovalPolicy[]> {}

export interface ApprovalRequestsQuery {
    tenant_id?: string;
    branch_id?: string;
    operation_key?: ApprovalOperationKey;
    status?: ApprovalRequestStatus;
    maker_user_id?: string;
    page?: number;
    limit?: number;
}

export interface ApprovalRequestsResponse {
    data: ApprovalRequest[];
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
}

export interface ApprovalRequestResponse extends ApiEnvelope<ApprovalRequest> {}
export interface SmsTriggerSettingsResponse extends ApiEnvelope<SmsTriggerSetting[]> {}
export interface SmsTriggerSettingResponse extends ApiEnvelope<SmsTriggerSetting> {}
export interface MemberPortalPaymentControlsResponse extends ApiEnvelope<MemberPortalPaymentControls> {}
export interface WorkspaceTwoFactorSettingsResponse extends ApiEnvelope<WorkspaceTwoFactorSettings> {}
export interface WorkspacePublicRegistrationSettingsResponse extends ApiEnvelope<WorkspacePublicRegistrationSettings> {}
export interface SaccoFinancialYearSettingsResponse extends ApiEnvelope<SaccoFinancialYearSettings> {}
export interface SaccoPerformanceTargetSettingsResponse extends ApiEnvelope<SaccoPerformanceTargetSettings> {}
export interface SaccoManualImportsSettingsResponse extends ApiEnvelope<SaccoManualImportsSettings> {}
export interface SaccoLeagueSettingsResponse extends ApiEnvelope<SaccoLeagueSettings> {}
export interface LeagueStandingsResponse extends ApiEnvelope<LeagueStandings> {}
export interface MyLeaguePositionResponse extends ApiEnvelope<MyLeaguePosition> {}

export interface UpdateSaccoLeagueSettingsRequest {
    tenant_id?: string;
    league_enabled?: boolean;
    league_show_amounts_to_members?: boolean;
    league_tiers?: LeagueTier[];
}

export interface UpdateApprovalPolicyRequest {
    tenant_id?: string;
    enabled?: boolean;
    threshold_amount?: number;
    required_checker_count?: number;
    allowed_maker_roles?: string[];
    allowed_checker_roles?: string[];
    sla_minutes?: number;
    two_factor_code?: string | null;
    recovery_code?: string | null;
}

export interface ApproveApprovalRequestBody {
    tenant_id?: string;
    notes?: string | null;
    two_factor_code?: string | null;
    recovery_code?: string | null;
}

export interface RejectApprovalRequestBody {
    tenant_id?: string;
    reason: string;
    notes?: string | null;
}

export interface UpdateSmsTriggerRequest {
    tenant_id?: string;
    enabled: boolean;
}

export interface UpdateMemberPortalPaymentControlsRequest {
    tenant_id?: string;
    share_contribution_enabled?: boolean;
    savings_deposit_enabled?: boolean;
    loan_repayment_enabled?: boolean;
    loan_application_guide?: string | null;
    bank_account_name?: string | null;
    bank_name?: string | null;
    bank_branch?: string | null;
    bank_account_number?: string | null;
    bank_swift_code?: string | null;
    bank_instructions?: string | null;
}

export interface UpdateWorkspaceTwoFactorSettingsRequest {
    tenant_id?: string;
    two_factor_auth_enabled: boolean;
}

export interface UpdateWorkspacePublicRegistrationSettingsRequest {
    tenant_id?: string;
    public_registration_enabled: boolean;
}

export interface UpdateSaccoFinancialYearSettingsRequest {
    tenant_id?: string;
    financial_year_start_month: number;
    financial_year_start_day: number;
}

export interface UpdateSaccoManualImportsSettingsRequest {
    tenant_id?: string;
    manual_imports_enabled: boolean;
}

export interface UpdateSaccoPerformanceTargetSettingsRequest {
    tenant_id?: string;
    performance_target_enabled?: boolean;
    performance_target_actual_source?: SaccoPerformanceTargetSettings["performance_target_actual_source"];
    performance_target_default_annual_amount?: number;
    performance_target_required_amount?: number;
    performance_target_on_track_percent?: number;
    performance_target_member_target_source?: SaccoPerformanceTargetSettings["performance_target_member_target_source"];
}

export interface PendingApprovalPayload {
    approval_required: true;
    status: "pending_approval" | "approved";
    operation_key: ApprovalOperationKey;
    approval_request_id: string;
    required_checker_count: number;
    approved_count: number;
    threshold_amount: number;
    requested_amount: number;
}
