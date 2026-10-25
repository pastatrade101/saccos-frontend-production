/// The 11 TCDC Tier 3 regulatory returns, as structure rather than as eleven
/// hand-written pages.
///
/// Every label, row number and cross-form validation below is lifted verbatim
/// from the Commission's own workbook ("FINAL MSP Tier3 Financials Reporting
/// Templates.xls"). They are a filing specification, not our wording: an
/// inspector reads the submitted return against that workbook, so a tidied-up
/// label is a defect even when it reads better. Change one only when TCDC
/// reissues the workbook.
///
/// `sno` is the row number the Commission prints and the validations refer to
/// ("C46=C83" means row 46 must equal row 83 on MSP3_01), which is why it is
/// the key a value is resolved by rather than a slug off the label.

export type TcdcRowKind = "section" | "input" | "computed";

export interface TcdcRow {
    /// The Commission's own row number. Empty on a section heading.
    sno: string;
    kind: TcdcRowKind;
    label: string;
}

export type TcdcShape = "statement" | "sector-matrix" | "register" | "geography";

export interface TcdcFormDef {
    code: string;
    slug: string;
    title: string;
    /// Which field of a returned line each column in `columns` reads. Defaults
    /// to a single "amount" column. MSP3_02 is the reason this exists: the
    /// Commission wants the period and the year to date side by side.
    valueFields?: string[];
    /// What the return is for, in our words — the title alone is the
    /// Commission's and says little to someone opening the page cold.
    blurb: string;
    shape: TcdcShape;
    rows?: TcdcRow[];
    columns?: string[];
    /// The workbook's own cross-checks, kept as written so a mismatch can be
    /// quoted straight back at whoever filed it.
    validations?: string[];
    notes?: string[];
}

/// Shared by MSP3_03, MSP3_04 and MSP3_05 — the Commission uses one sector
/// list across all three and validates the totals against each other.
export const TCDC_SECTORS: string[] = [

    "Agriculture",
    "Fishing and Hunting",
    "Forest",
    "Mining, Quarrying and Gas",
    "Manufacturing",
    "Building and Construction",
    "Real Estate",
    "Financial and Insurance activities",
    "Transport and Communication",
    "Trade",
    "Tourism",
    "Hotels and Restaurants",
    "Warehousing and Storage",
    "Water",
    "Education",
    "Health",
    "Arts, Entertainment and recreation",
    "Other Services",
    "Personal (Consumption and others)",
];


/// Submitted monthly by Category B SACCOS and quarterly by Category A, which
/// is the same cadence for all eleven returns.
export const TCDC_SUBMISSION_NOTE =
    "Monthly for Category B, quarterly for Category A.";

export const TCDC_FORMS: TcdcFormDef[] = [
    {
        code: "MSP3_01",
        slug: "financial-position",
        title: "Statement of Financial Position",
        blurb: "The balance sheet, split the Commission's way: earning assets, non-earning assets, then liabilities and equity.",
        shape: "statement",
        validations: ["C46=C83"],
        notes: [
            "Loan Participations are loans or guarantees to other SACCOS.",
            "Non-Earning Deposit means compulsory savings or cash collateral held against borrowings.",
            "2nd Tier Organization: the apex institution (SCCULT)."
        ],
        rows: [

            { sno: "", kind: "section", label: "Earning Assets  Loans" },
            { sno: "1", kind: "input", label: "Short-term Loans (<= 1 year)" },
            { sno: "2", kind: "input", label: "Medium-term Loans (>1<=3 years)" },
            { sno: "3", kind: "input", label: "Long-term Loans (>3 years)" },
            { sno: "4", kind: "input", label: "Loan Participations*" },
            { sno: "5", kind: "input", label: "(Less the Allowance for Loan Losses)" },
            { sno: "6", kind: "computed", label: "Total Net Loans" },
            { sno: "7", kind: "section", label: "Earning Assets  Investments (sum 21:28)" },
            { sno: "8", kind: "input", label: "Government Securities <= 30 days to maturity" },
            { sno: "9", kind: "input", label: "Government Securities > 30 days to maturity" },
            { sno: "10", kind: "input", label: "Investments in Banks and other Financial Institutions <= 30 days to maturity(FDR)" },
            { sno: "11", kind: "input", label: "Investments in Banks and other Financial Institutions > 30 days to maturity (FDR)" },
            { sno: "12", kind: "input", label: "Investment in other SACCOS or 2nd tier organizations" },
            { sno: "13", kind: "input", label: "Non-Financial Investments" },
            { sno: "14", kind: "input", label: "Other Investments" },
            { sno: "15", kind: "input", label: "(Less the Allowance for Investment Loss)" },
            { sno: "16", kind: "computed", label: "Total Net Earning Assets Investments" },
            { sno: "17", kind: "section", label: "Non-Earning Assets  (Cash and Cash Equivalent)" },
            { sno: "18", kind: "input", label: "Cash on Hand" },
            { sno: "19", kind: "input", label: "Current Accounts with banks and other financial institutions" },
            { sno: "20", kind: "input", label: "Other Non-Interest Earning Deposits with banks and other financial institutions*" },
            { sno: "21", kind: "input", label: "Balances with Mobile Money Networks e.g MPESA, TIGOPESA" },
            { sno: "22", kind: "input", label: "Agent Banking Account Balances (Wakala)" },
            { sno: "23", kind: "computed", label: "Total Non-Earning Assets ( Cash and Cash Equivalent )" },
            { sno: "24", kind: "section", label: "Non-Earning Assets ( Fixed Assets)" },
            { sno: "25", kind: "input", label: "Land (cost)" },
            { sno: "26", kind: "input", label: "Buildings (cost)" },
            { sno: "27", kind: "input", label: "Furniture, Fixtures and Equipment (cost)" },
            { sno: "28", kind: "input", label: "Leasehold Improvements (cost)" },
            { sno: "29", kind: "input", label: "Intangible Assets" },
            { sno: "30", kind: "input", label: "Other Fixed Assets (cost)" },
            { sno: "31", kind: "input", label: "Revaluation of Fixed Assets" },
            { sno: "32", kind: "input", label: "(Less Accumulated Depreciation)" },
            { sno: "33", kind: "computed", label: "Total Net Non-Earning Assets (Fixed Assets)" },
            { sno: "34", kind: "section", label: "Non-Earning Assets (Other Assets)" },
            { sno: "35", kind: "input", label: "Accounts Receivable due in <=30 days" },
            { sno: "36", kind: "input", label: "Accounts Receivable due in > 30 days" },
            { sno: "37", kind: "input", label: "Accrued Income on Loans" },
            { sno: "38", kind: "input", label: "Accrued Income on Investments" },
            { sno: "39", kind: "input", label: "Other Accrued Income" },
            { sno: "40", kind: "input", label: "Prepaid Expenses" },
            { sno: "41", kind: "input", label: "Assets in Liquidation" },
            { sno: "42", kind: "input", label: "Suspense Accounts" },
            { sno: "43", kind: "input", label: "Other Assets" },
            { sno: "44", kind: "input", label: "(Less Allowance for Other Asset Losses)" },
            { sno: "45", kind: "computed", label: "Total Net Non-Earning Assets (Other Assets)" },
            { sno: "46", kind: "computed", label: "TOTAL ASSETS" },
            { sno: "47", kind: "section", label: "Liabilities and Equity" },
            { sno: "48", kind: "section", label: "Borrowings" },
            { sno: "49", kind: "input", label: "Short-Term Borrowings from other SACCOs and 2nd Tier Organizations(< =30 days to  maturity)" },
            { sno: "50", kind: "input", label: "Short-Term Borrowings from Banks and Financial Insititutions(< =30 days to  maturity)" },
            { sno: "51", kind: "input", label: "Long-Term Borrowings from other SACCOs and 2nd Tier Organizations  (> 30 days to maturity)" },
            { sno: "52", kind: "input", label: "Long-Term Borrowings from Banks and Financial Institutions(> 30 days to maturity)" },
            { sno: "53", kind: "input", label: "Other borrowings" },
            { sno: "54", kind: "computed", label: "Total Borrowed Funds" },
            { sno: "55", kind: "section", label: "Interest Bearing  Savings and Deposits" },
            { sno: "56", kind: "input", label: "Compulsory savings" },
            { sno: "57", kind: "input", label: "Term Deposits" },
            { sno: "58", kind: "input", label: "Special Savings" },
            { sno: "59", kind: "input", label: "Other Savings" },
            { sno: "60", kind: "computed", label: "Total Savings and Deposits" },
            { sno: "61", kind: "section", label: "Non-Interest Bearing Liabilities" },
            { sno: "62", kind: "input", label: "Accounts Payable due in < 30 days" },
            { sno: "63", kind: "input", label: "Other Payables" },
            { sno: "64", kind: "input", label: "Accrued Interest Payable on Savings" },
            { sno: "65", kind: "input", label: "Accrued Interest Payable on External Credit" },
            { sno: "66", kind: "input", label: "Taxes Payable" },
            { sno: "67", kind: "input", label: "Suspense Accounts" },
            { sno: "68", kind: "input", label: "Other Liabilities" },
            { sno: "69", kind: "computed", label: "Total Non-Interest Bearing Liabilities" },
            { sno: "70", kind: "computed", label: "Total Liabilities" },
            { sno: "71", kind: "section", label: "Equity" },
            { sno: "72", kind: "input", label: "Member Shares" },
            { sno: "73", kind: "input", label: "Voluntary Shares" },
            { sno: "74", kind: "input", label: "Other Shares" },
            { sno: "75", kind: "input", label: "Fixed Asset Revaluation Reserve" },
            { sno: "76", kind: "input", label: "Transitory Capital" },
            { sno: "77", kind: "input", label: "Capital Donations and Grants" },
            { sno: "78", kind: "input", label: "Statutory reserve Funds" },
            { sno: "79", kind: "input", label: "Other reserves" },
            { sno: "80", kind: "input", label: "Retained Earnings (Profit/Loss for Previous Years)" },
            { sno: "81", kind: "input", label: "Profit/Loss for the Current Year" },
            { sno: "82", kind: "computed", label: "Total Equity (Sum 67:74)" },
            { sno: "83", kind: "computed", label: "Total Liabilities and Equity" },
            { sno: "84", kind: "input", label: "Off Balance Sheet  Other SACCOS Commitments and Obligations such as unfunded member lines of credit and Guarantees." },
        ]
    },
    {
        code: "MSP3_02",
        slug: "comprehensive-income",
        title: "Statement of Comprehensive Income",
        blurb: "Income and expenditure for the period and year to date. Its closing profit must equal the balance sheet's.",
        shape: "statement",
        columns: ["Period (TZS)", "Year to date (TZS)"],
        valueFields: ["amount", "year_to_date"],
        validations: ["D42=MSP3_01C81"],
        notes: ["The income statement itself must be attached to the filing."],
        rows: [

            { sno: "1", kind: "section", label: "Interest Income" },
            { sno: "2", kind: "input", label: "Interest Income - Loans" },
            { sno: "3", kind: "input", label: "Interest Income - Government Securities" },
            { sno: "4", kind: "input", label: "Interest Income - Deposits in Financial Institutions" },
            { sno: "5", kind: "input", label: "Interest Income - Other SACCOS and 2nd Tier organizations" },
            { sno: "6", kind: "input", label: "Interest Income - Other Investments" },
            { sno: "7", kind: "computed", label: "Total Interest Income (Sum 2:6)" },
            { sno: "8", kind: "section", label: "Interest Expense" },
            { sno: "9", kind: "input", label: "Interest Expense on Borrowings" },
            { sno: "10", kind: "input", label: "Interest Expense on Member Savings and Deposit Accounts" },
            { sno: "11", kind: "input", label: "Other Interest Expense" },
            { sno: "12", kind: "computed", label: "Total Interest Expense (Sum 9:11)" },
            { sno: "13", kind: "computed", label: "Net Interest Income = (Total Interest Income Less Total Interest Expense)" },
            { sno: "14", kind: "section", label: "Non Interest Income" },
            { sno: "15", kind: "input", label: "Commissions and Fees" },
            { sno: "16", kind: "input", label: "Penalties" },
            { sno: "17", kind: "input", label: "Income from recovery of written off loans" },
            { sno: "18", kind: "input", label: "Dividends on Equity Investment" },
            { sno: "19", kind: "input", label: "Donations and Grants (cash only)" },
            { sno: "20", kind: "input", label: "Other Non Interest Income" },
            { sno: "21", kind: "computed", label: "Total Non Interest Income (Sum 15:20)" },
            { sno: "22", kind: "computed", label: "Gross Operating Income = (Net Interest Income + Non Interest Income)" },
            { sno: "23", kind: "section", label: "Operating Expenses" },
            { sno: "24", kind: "input", label: "Salaries and Wages" },
            { sno: "25", kind: "input", label: "Other Personnel Costs and Benefits" },
            { sno: "26", kind: "input", label: "Office Occupancy (Rent)" },
            { sno: "27", kind: "input", label: "Professional Fees and Services" },
            { sno: "28", kind: "input", label: "Depreciation" },
            { sno: "29", kind: "input", label: "Maintenance/Repairs" },
            { sno: "30", kind: "input", label: "Audit fees" },
            { sno: "31", kind: "input", label: "Taxes and levy" },
            { sno: "32", kind: "input", label: "Business Licence fees" },
            { sno: "33", kind: "input", label: "Other Operating Expenses (supplies, travel, training, communications, utilities, marketing and other expenses )" },
            { sno: "34", kind: "computed", label: "Total Operating Expenses (Sum 24:33)" },
            { sno: "35", kind: "computed", label: "Net Operating Income (Loss) = (Gross Operating Income-Total Operating Expenses )" },
            { sno: "36", kind: "section", label: "Loan Loss Provisions" },
            { sno: "37", kind: "input", label: "Provision for Loan Losses" },
            { sno: "38", kind: "input", label: "Provisions for Investments and Other Losses (Other than Loans)" },
            { sno: "39", kind: "input", label: "Net Provision for Losses (Sum 37:38)" },
            { sno: "40", kind: "computed", label: "Net Profit Before Tax = ( Net Operating Income +/- Net Provision for Loan Loss)" },
            { sno: "41", kind: "input", label: "Tax Provisions" },
            { sno: "42", kind: "computed", label: "Net Profit After Tax = ( Net Profit Before Tax less Tax Provisions)" },
        ]
    },
    {
        code: "MSP3_03",
        slug: "loan-sectors",
        title: "Sectoral Classification of Loans",
        blurb: "Every outstanding loan placed in an economic sector and aged, with the provision each ageing band attracts.",
        shape: "sector-matrix",
        columns: [
            "Number of Borrowers",
            "Total Outstanding (TZS)",
            "Current",
            "ESM",
            "Substandard",
            "Doubtful",
            "Loss",
            "Write-offs during the quarter"
        ],
        validations: ["D20=MSP3_01(C01+C02+C03+C04)"],
        notes: [
            "Provision rates by days past due: 0-30 nil, 31-90 10%, 91-180 30%, 181-365 50%, over 365 100%.",
            "Compulsory savings and deposits are deducted before the provision is struck."
        ]
    },
    {
        code: "MSP3_04",
        slug: "loan-interest-rates",
        title: "Interest Rates Structure for Loans",
        blurb: "The weighted average rate per sector, plus the lowest and highest nominal rate charged in each.",
        shape: "sector-matrix",
        columns: [
            "Number of Borrowers",
            "Outstanding Loan Amount (TZS)",
            "Weighted Average Interest Rate (% p.a.)",
            "Nominal Rate Lowest (% p.a.)",
            "Nominal Rate Highest (% p.a.)"
        ],
        validations: ["C20=MSP3_03C20", "D20=MSP3_03D20"],
        notes: ["The weighted average is weighted by outstanding loan balance, on a reducing-balance basis."]
    },
    {
        code: "MSP3_05",
        slug: "loans-disbursed",
        title: "Loans Disbursed",
        blurb: "What was lent out during the period, counted and valued, split female and male within each sector.",
        shape: "sector-matrix",
        columns: [
            "Female Number",
            "Female Amount (TZS)",
            "Male Number",
            "Male Amount (TZS)",
            "Total Number",
            "Total Amount (TZS)"
        ]
    },
    {
        code: "MSP3_06",
        slug: "insider-loans",
        title: "Loans to Insiders and Related Parties",
        blurb: "Named loans to board members, the supervisory committee, employees and their immediate family.",
        shape: "register",
        columns: [
            "Name of Borrower",
            "Position",
            "Type of Loan",
            "Borrowed Amount (TZS)",
            "Expiry Date",
            "Interest Rate (% p.a.)",
            "Amount Outstanding (TZS)",
            "Savings, Deposits and Voluntary Shares Guaranteeing the Loan"
        ],
        notes: ["Position is one of: board member, supervisory committee, employee, or an immediate family member of any of those."]
    },
    {
        code: "MSP3_07",
        slug: "geography",
        title: "Geographical Distribution of Branches, Employees and Loans by Age",
        blurb: "Branches, staff, borrowers and loan balances by council, each split female and male, under 35 and over.",
        shape: "geography",
        columns: [
            "Number of Branches (including HQ)",
            "Number of Employees",
            "Borrowers up to 35 — Female",
            "Borrowers up to 35 — Male",
            "Borrowers above 35 — Female",
            "Borrowers above 35 — Male",
            "Loans up to 35 — Female",
            "Loans up to 35 — Male",
            "Loans above 35 — Female",
            "Loans above 35 — Male",
            "Outstanding up to 35 — Female",
            "Outstanding up to 35 — Male",
            "Outstanding above 35 — Female",
            "Outstanding above 35 — Male"
        ],
        validations: [
            "(M213+N213+O213+P213)=MSP3_03D20",
            "(E213+F213+G213+H213)=MSP3_03C20"
        ],
        notes: ["Regions are listed alphabetically; councils carry their CC, MC, DC or TC suffix."]
    },
    {
        code: "MSP3_08",
        slug: "liquid-assets",
        title: "Computation of Liquid Assets",
        blurb: "Liquid assets against short-term liabilities, and whether the 15% regulatory floor is met.",
        shape: "statement",
        notes: ["PEARLS: Protection, Effective financial structure, Asset quality, Rates of return, Liquidity, Signs of growth."],
        rows: [

            { sno: "1", kind: "section", label: "A: AVAILABLE LIQUID ASSETS" },
            { sno: "2", kind: "input", label: "(a) Cash in hand" },
            { sno: "3", kind: "input", label: "(b)Current Accounts with banks and other financial institutions" },
            { sno: "4", kind: "input", label: "(c)Accounts Receivable due in <=30 days" },
            { sno: "5", kind: "input", label: "(d)Government Securities with <= 30 days to maturity" },
            { sno: "6", kind: "input", label: "(e)Investments in banks and other Financial Institutions with <= 30 days to maturity (FDR)" },
            { sno: "7", kind: "input", label: "(f)Balances with Mobile Money Networks e.g MPESA, TIGOPESA" },
            { sno: "8", kind: "input", label: "(g) Agent Banking Account Balances (Wakala)" },
            { sno: "9", kind: "computed", label: "Total Available Liquid Assets" },
            { sno: "10", kind: "section", label: "B:SHORT TERM  LIABILITES" },
            { sno: "11", kind: "computed", label: "Total Savings and Deposits" },
            { sno: "12", kind: "input", label: "Accounts Payable due in < 30 days" },
            { sno: "13", kind: "input", label: "Short-Term Borrowings from other SACCOs and 2nd Tier Organizations(< =30 days to  maturity)" },
            { sno: "14", kind: "input", label: "Short-Term Borrowings from Banks and Financial Insititutions(< =30 days to  maturity)" },
            { sno: "15", kind: "computed", label: "Total Short Term Liabilities" },
            { sno: "16", kind: "input", label: "C:Required Minimum Liquid Assets(15%*C17)" },
            { sno: "17", kind: "input", label: "D:Excess (Deficiency) Liquid Assets (A-C)" },
            { sno: "18", kind: "input", label: "E:Minimum Liquidity Ratio as per regulation (15%)" },
            { sno: "19", kind: "input", label: "E:Minimum Liquidity Ratio as per PEARLS* (15%)" },
        ]
    },
    {
        code: "MSP3_09",
        slug: "capital-adequacy",
        title: "Computation of Capital Adequacy",
        blurb: "Core and institutional capital against total assets, against the 8% and 6% minimums.",
        shape: "statement",
        rows: [

            { sno: "1", kind: "section", label: "A:CORE CAPITAL" },
            { sno: "2", kind: "input", label: "(a)Member Shares" },
            { sno: "3", kind: "input", label: "(b)Statutory reserve Funds" },
            { sno: "4", kind: "input", label: "(c)Retained Earnings (Profit/Loss for Past Years)" },
            { sno: "5", kind: "input", label: "(d)Profit/Loss for the Current Year" },
            { sno: "6", kind: "input", label: "(e) Capital Donations and Grants" },
            { sno: "7", kind: "computed", label: "Total Core Capital (Sum 2 to 6)" },
            { sno: "8", kind: "section", label: "B:INSTITUTIONAL CAPITAL" },
            { sno: "9", kind: "computed", label: "Total Institutional Capital (8 less 2)" },
            { sno: "10", kind: "input", label: "Less: Provision for loan losses adjustments" },
            { sno: "12", kind: "computed", label: "Total Net Institutional Capital" },
            { sno: "13", kind: "section", label: "C:TOTAL ASSETS" },
            { sno: "14", kind: "computed", label: "Total Assets" },
            { sno: "15", kind: "section", label: "D:CAPITAL ADEQUACY RATIOS" },
            { sno: "16", kind: "input", label: "(a)Core Capital Ratio (CoreCapital/Total Assets) 8%" },
            { sno: "17", kind: "input", label: "(b)Institutional Capital Ratio(Institutional Capital/Total Assets) 6%" },
            { sno: "18", kind: "input", label: "(c)Net Institutional Capital Ratio (Net Institutional Capital/Total Assets) 6%" },
        ]
    },
    {
        code: "MSP3_10",
        slug: "complaints",
        title: "Complaint Report",
        blurb: "Complaints opened, resolved and still outstanding, by what they were about and who they were escalated to.",
        shape: "statement",
        columns: [
            "Number",
            "Value (TZS)",
            "Membership Exit",
            "Withdrawal of Deposits/Savings",
            "Repayments",
            "Loan Statement",
            "Loan Processing",
            "Election Process",
            "Others"
        ],
        rows: [

            { sno: "1", kind: "input", label: "Number of complaints at the beginning of the month/quarter" },
            { sno: "2", kind: "input", label: "New complaints received during the month/quarter" },
            { sno: "3", kind: "input", label: "Complaints resolved during the month/quarter by the institution" },
            { sno: "4", kind: "input", label: "Complaints resolved during the month/quarter by other parties (eg Courts, TCDC)" },
            { sno: "5", kind: "input", label: "Unresolved  complaints at the end of the month/quarter (1+2-3-4)" },
            { sno: "6", kind: "input", label: "Unresolved  complaints referred to Bank of Tanzania" },
            { sno: "7", kind: "input", label: "Unresolved  complaints referred to TCDC" },
            { sno: "8", kind: "input", label: "Unresolved  complaints referred to Fair Competition Commission" },
            { sno: "9", kind: "input", label: "Unresolved  complaints referred to Courts" },
            { sno: "10", kind: "input", label: "Unresolved  complaints referred to other parties" },
        ]
    },
    {
        code: "MSP3_11",
        slug: "bank-exposures",
        title: "Deposits and Borrowings from Banks and Financial Institutions",
        blurb: "Where the SACCO's money is held and who it owes — banks, agent banking, mobile money, and other SACCOS.",
        shape: "register",
        columns: ["Name of Bank or Financial Institution", "Deposit Amounts (TZS)", "Loan Amount (TZS)"],
        validations: [
            "C1=MSP3_01C19",
            "D1=MSP3_01(C50+C52)",
            "C16=MSP3_01C22",
            "C25=MSP3_01C21",
            "C43=MSP3_01(C49+C51)"
        ],
        notes: [
            "Net loan exposure: bank borrowings plus lending to other SACCOS, less borrowings from other SACCOS.",
            "Net deposit exposure: bank deposits plus agent banking balances plus mobile money balances."
        ]
    }
];

export function tcdcFormBySlug(slug: string | undefined): TcdcFormDef | undefined {
    return TCDC_FORMS.find((form) => form.slug === slug);
}
