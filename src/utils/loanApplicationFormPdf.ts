import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { LoanApplication } from "../types/api";
import { formatMonthlyLoanRate } from "./loanInterest";

/**
 * The completed application, as a form that can be printed or filed.
 *
 * Everything on it was already captured when the member applied — the bank
 * account they want paying into, the term they asked for, who agreed to
 * guarantee them and for how much. It was simply never in one place: the
 * account number surfaced only in the disbursement dialog, the guarantors only
 * in a review panel, and nowhere offered the lot. Officers were ringing
 * members back to ask for details the member had already typed in.
 */
export interface LoanApplicationFormPayload {
    application: LoanApplication;
    tenantName?: string | null;
    branchName?: string | null;
    logoDataUrl?: string | null;
    generatedBy?: string | null;
}

const MARGIN = 14;

function money(value: number | string | null | undefined): string {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount)) return "—";
    return `TSh ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function day(value: string | null | undefined): string {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function text(value: string | null | undefined): string {
    const trimmed = (value ?? "").toString().trim();
    return trimmed.length ? trimmed : "—";
}

/** "pending" -> "Pending", "check_off" -> "Check off". */
function label(value: string | null | undefined): string {
    const raw = (value ?? "").toString().trim();
    if (!raw) return "—";
    const spaced = raw.replace(/_/g, " ");
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function buildLoanApplicationFormPdf(payload: LoanApplicationFormPayload): jsPDF {
    const { application, tenantName, branchName, logoDataUrl, generatedBy } = payload;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    let cursor = MARGIN;

    if (logoDataUrl) {
        try {
            doc.addImage(logoDataUrl, "PNG", MARGIN, cursor, 16, 16);
        } catch {
            // A logo that will not decode must not cost the officer the form.
        }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(text(tenantName) === "—" ? "LOAN APPLICATION" : String(tenantName), logoDataUrl ? MARGIN + 20 : MARGIN, cursor + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Loan Application Form", logoDataUrl ? MARGIN + 20 : MARGIN, cursor + 12);

    doc.setFontSize(9);
    doc.text(text(application.external_reference), pageWidth - MARGIN, cursor + 6, { align: "right" });
    doc.text(label(application.status), pageWidth - MARGIN, cursor + 11, { align: "right" });
    if (branchName) doc.text(String(branchName), pageWidth - MARGIN, cursor + 16, { align: "right" });

    cursor += 22;
    doc.setDrawColor(200);
    doc.line(MARGIN, cursor, pageWidth - MARGIN, cursor);
    cursor += 6;

    const member = application.members;
    const product = application.loan_products;

    const applicant: [string, string][] = [
        ["Member", text(member?.full_name)],
        ["Member number", text(member?.member_no)],
        ["Application date", day(application.submitted_at || application.created_at)],
        ["Purpose", text(application.purpose)]
    ];

    autoTable(doc, {
        startY: cursor,
        head: [["Applicant", ""]],
        body: applicant,
        theme: "grid",
        margin: { left: MARGIN, right: MARGIN },
        headStyles: { fillColor: [26, 35, 126], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 45, fontStyle: "bold" } }
    });
    cursor = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

    // The three the officer was phoning members about: the term, the rate and
    // where the money goes.
    const terms: [string, string][] = [
        ["Product", text(product?.name)],
        ["Amount requested", money(application.requested_amount)],
        ["Repayment period", `${application.requested_term_count ?? "—"} ${label(application.requested_repayment_frequency) === "Monthly" ? "months" : label(application.requested_repayment_frequency)}`],
        ["Interest rate", application.requested_interest_rate
            ? `${formatMonthlyLoanRate(Number(application.requested_interest_rate))} per month`
            : "—"],
        ["Repayment mode", label(application.repayment_mode)],
        ["Application type", application.loan_category === "top_up" ? "Top-up of an existing loan" : "New loan"]
    ];

    autoTable(doc, {
        startY: cursor,
        head: [["Loan terms", ""]],
        body: terms,
        theme: "grid",
        margin: { left: MARGIN, right: MARGIN },
        headStyles: { fillColor: [26, 35, 126], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 45, fontStyle: "bold" } }
    });
    cursor = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

    const payout: [string, string][] = [
        ["Payout method", label(application.payout_method)],
        ["Bank", application.payout_bank_name
            ? `${application.payout_bank_name}${application.payout_bank_branch ? ` — ${application.payout_bank_branch}` : ""}`
            : "—"],
        ["Account name", text(application.payout_account_name)],
        ["Account number", text(application.payout_account_number)]
    ];

    autoTable(doc, {
        startY: cursor,
        head: [["Payout details", ""]],
        body: payout,
        theme: "grid",
        margin: { left: MARGIN, right: MARGIN },
        headStyles: { fillColor: [26, 35, 126], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 45, fontStyle: "bold" } }
    });
    cursor = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

    const guarantors = application.loan_guarantors || [];
    const required = Number(application.required_guarantee_amount ?? 0);
    const accepted = guarantors
        .filter((row) => row.consent_status === "accepted")
        .reduce((sum, row) => sum + Number(row.accepted_amount ?? row.guaranteed_amount ?? 0), 0);

    autoTable(doc, {
        startY: cursor,
        head: [["Guarantor", "Member no.", "Amount", "Consent"]],
        body: guarantors.length
            ? guarantors.map((row) => [
                text(row.members?.full_name),
                text(row.members?.member_no),
                money(row.accepted_amount ?? row.guaranteed_amount),
                label(row.consent_status)
            ])
            : [["No guarantors recorded", "", "", ""]],
        foot: required > 0
            ? [["Accepted", "", money(accepted), `of ${money(required)}`]]
            : undefined,
        theme: "grid",
        margin: { left: MARGIN, right: MARGIN },
        headStyles: { fillColor: [26, 35, 126], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: "bold", fontSize: 9 }
    });
    cursor = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

    // Only the steps that have actually happened. An empty "Approved by ___"
    // on a form that has not been approved invites somebody to fill it in.
    const decisions: [string, string][] = [];
    if (application.appraised_at) decisions.push(["Appraised", day(application.appraised_at)]);
    if (application.risk_rating) decisions.push(["Risk rating", label(application.risk_rating)]);
    if (application.recommended_amount) decisions.push(["Recommended amount", money(application.recommended_amount)]);
    if (application.appraisal_notes) decisions.push(["Appraisal notes", text(application.appraisal_notes)]);
    if (application.approved_at) decisions.push(["Approved", day(application.approved_at)]);
    if (application.approval_notes) decisions.push(["Approval notes", text(application.approval_notes)]);
    if (application.rejected_at) decisions.push(["Rejected", day(application.rejected_at)]);
    if (application.rejection_reason) decisions.push(["Reason", text(application.rejection_reason)]);
    if (application.disbursed_at) decisions.push(["Disbursed", day(application.disbursed_at)]);

    if (decisions.length) {
        autoTable(doc, {
            startY: cursor,
            head: [["SACCOS decisions", ""]],
            body: decisions,
            theme: "grid",
            margin: { left: MARGIN, right: MARGIN },
            headStyles: { fillColor: [26, 35, 126], fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            columnStyles: { 0: { cellWidth: 45, fontStyle: "bold" } }
        });
        cursor = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
    }

    doc.setFontSize(8);
    doc.setTextColor(120);
    const stamp = `Generated ${day(new Date().toISOString())}${generatedBy ? ` by ${generatedBy}` : ""}`;
    doc.text(stamp, MARGIN, doc.internal.pageSize.getHeight() - 10);
    if (application.declaration_accepted) {
        doc.text(
            `Declaration accepted ${day(application.declaration_accepted_at)}`,
            pageWidth - MARGIN,
            doc.internal.pageSize.getHeight() - 10,
            { align: "right" }
        );
    }

    return doc;
}

export function downloadLoanApplicationForm(payload: LoanApplicationFormPayload): void {
    const doc = buildLoanApplicationFormPdf(payload);
    const reference = payload.application.external_reference || payload.application.id;
    const name = payload.application.members?.member_no || "member";
    doc.save(`loan-application-${name}-${reference}.pdf`);
}
