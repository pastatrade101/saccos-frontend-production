import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { Loan, LoanSchedule, LoanTransaction, StatementRow } from "../types/api";
import { formatMonthlyLoanRate } from "./loanInterest";

interface MemberStatementPdfPayload {
    memberName: string;
    memberEmail?: string | null;
    tenantName?: string | null;
    branchName?: string | null;
    logoDataUrl?: string | null;
    generatedBy?: string | null;
    totalSavings: number;
    shareCapital: number;
    outstandingLoan: number;
    netPosition: number;
    statements: StatementRow[];
}

interface LeagueStandingsPdfRow {
    tier_rank: number;
    member_no: string;
    rank_change: number | null;
    amount: number | null;
    is_self: boolean;
}

interface LeagueStandingsPdfPayload {
    leagueName: string;
    tierColor?: string | null;
    memberNo?: string | null;
    tierRank: number;
    tierSize: number;
    overallRank: number;
    totalMembers: number;
    tenantName?: string | null;
    branchName?: string | null;
    logoDataUrl?: string | null;
    generatedBy?: string | null;
    showAmounts: boolean;
    rows: LeagueStandingsPdfRow[];
}

interface LeagueStaffRow {
    tier_index: number;
    tier_name: string;
    tier_rank: number;
    overall_rank: number;
    member_no: string;
    member_name?: string | null;
    branch_name?: string | null;
    rank_change: number | null;
    amount: number | null;
}

interface LeagueStaffPdfPayload {
    tenantName?: string | null;
    logoDataUrl?: string | null;
    generatedBy?: string | null;
    includeNames: boolean;
    totalMembers: number;
    tiers: Array<{
        name: string;
        color?: string | null;
        member_count?: number;
        range_label?: string | null;
        min_amount?: number | null;
    }>;
    rows: LeagueStaffRow[];
}

interface LoanStatementPdfPayload {
    memberName: string;
    memberEmail?: string | null;
    tenantName?: string | null;
    branchName?: string | null;
    logoDataUrl?: string | null;
    generatedBy?: string | null;
    loan: Loan;
    schedules: LoanSchedule[];
    transactions: LoanTransaction[];
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-TZ", {
        style: "currency",
        currency: "TZS",
        maximumFractionDigits: 0
    }).format(value || 0);
}

function formatDate(value?: string | null) {
    if (!value) {
        return "N/A";
    }

    return new Intl.DateTimeFormat("en-TZ", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(new Date(value));
}

function prettifyType(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatCompactDate(value?: string | null) {
    if (!value) {
        return "N/A";
    }

    return new Intl.DateTimeFormat("en-TZ", {
        dateStyle: "medium"
    }).format(new Date(value));
}

export async function loadReportLogoDataUrl(src = "/icon-ilboru.png") {
    try {
        const response = await fetch(src);
        if (!response.ok) {
            return null;
        }

        const blob = await response.blob();
        return await new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

function resolveBrandName(tenantName?: string | null) {
    return tenantName?.trim() || "SACCOS";
}

function drawReportLogo(doc: jsPDF, logoDataUrl: string | null | undefined, brandName: string, x: number, y: number) {
    if (logoDataUrl) {
        try {
            doc.addImage(logoDataUrl, "PNG", x, y, 34, 34);
            return;
        } catch {
            // Fall back to initials if the browser cannot decode the logo payload.
        }
    }

    const initials = brandName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "S";

    doc.setFillColor(31, 168, 230);
    doc.roundedRect(x, y, 34, 34, 4, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(initials, x + 17, y + 21, { align: "center" });
}

export function downloadMemberStatementPdf(payload: MemberStatementPdfPayload) {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;

    const colors = {
        primary: [10, 5, 115] as [number, number, number],
        accent: [31, 168, 230] as [number, number, number],
        text: [15, 23, 42] as [number, number, number],
        muted: [71, 85, 105] as [number, number, number],
        success: [22, 163, 74] as [number, number, number],
        danger: [220, 38, 38] as [number, number, number]
    };

    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 88, "F");
    doc.setFillColor(...colors.accent);
    doc.rect(0, 78, pageWidth, 10, "F");

    const brandName = resolveBrandName(payload.tenantName);
    drawReportLogo(doc, payload.logoDataUrl, brandName, margin, 18);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text(brandName, margin + 44, 34, { maxWidth: pageWidth / 2 - 44 });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Member Financial Statement", margin + 44, 52);

    const generatedAt = formatDate(new Date().toISOString());
    doc.text(`Generated: ${generatedAt}`, pageWidth - margin, 34, { align: "right" });
    doc.text(`Generated by: ${payload.generatedBy || "Member Portal"}`, pageWidth - margin, 52, { align: "right" });

    doc.setTextColor(...colors.text);
    let cursorY = 118;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Member Details", margin, cursorY);
    cursorY += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.muted);
    doc.text(`Name: ${payload.memberName}`, margin, cursorY);
    doc.text(`Email: ${payload.memberEmail || "N/A"}`, margin + 220, cursorY);
    cursorY += 14;
    doc.text(`SACCOS: ${payload.tenantName || "N/A"}`, margin, cursorY);
    doc.text(`Branch: ${payload.branchName || "N/A"}`, margin + 220, cursorY);
    cursorY += 20;

    const summaryCards = [
        { label: "Total Savings", value: formatCurrency(payload.totalSavings), tone: "success" as const },
        { label: "Outstanding Loan", value: formatCurrency(payload.outstandingLoan), tone: "danger" as const },
        { label: "Net Position", value: formatCurrency(payload.netPosition), tone: payload.netPosition < 0 ? "danger" : "success" as const }
    ];

    const cardGap = 10;
    const cardWidth = (pageWidth - margin * 2 - cardGap * 2) / 3;
    const cardHeight = 62;

    summaryCards.forEach((card, index) => {
        const x = margin + index * (cardWidth + cardGap);
        const y = cursorY;

        const bg = card.tone === "danger" ? [254, 242, 242] : card.tone === "success" ? [240, 253, 244] : [239, 246, 255];
        const border = card.tone === "danger" ? colors.danger : card.tone === "success" ? colors.success : colors.primary;

        doc.setFillColor(bg[0], bg[1], bg[2]);
        doc.roundedRect(x, y, cardWidth, cardHeight, 4, 4, "F");
        doc.setDrawColor(...border);
        doc.setLineWidth(0.7);
        doc.roundedRect(x, y, cardWidth, cardHeight, 4, 4, "S");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...colors.muted);
        doc.text(card.label, x + 10, y + 18);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...colors.text);
        doc.text(card.value, x + 10, y + 40);
    });

    cursorY += cardHeight + 24;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...colors.text);
    doc.text("Recent Transactions", margin, cursorY);
    cursorY += 10;

    const rows = payload.statements
        .slice(0, 250)
        .map((row) => ([
            formatDate(row.created_at || row.transaction_date),
            prettifyType(row.transaction_type),
            row.reference || "-",
            row.direction.toUpperCase(),
            formatCurrency(row.amount),
            formatCurrency(row.running_balance)
        ]));

    autoTable(doc, {
        startY: cursorY,
        head: [["Date", "Type", "Reference", "Direction", "Amount", "Balance After"]],
        body: rows.length ? rows : [["N/A", "No transactions available", "-", "-", "-", "-"]],
        theme: "grid",
        headStyles: {
            fillColor: colors.primary,
            textColor: 255,
            fontStyle: "bold",
            halign: "left"
        },
        styles: {
            font: "helvetica",
            fontSize: 8.5,
            cellPadding: 6,
            textColor: colors.text
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        columnStyles: {
            0: { cellWidth: 92 },
            1: { cellWidth: 100 },
            2: { cellWidth: 98 },
            3: { halign: "center", cellWidth: 62 },
            4: { halign: "right", cellWidth: 85 },
            5: { halign: "right", cellWidth: 95 }
        },
        margin: { left: margin, right: margin }
    });

    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
        doc.setPage(page);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...colors.muted);
        doc.text(
            `${brandName} • Confidential Member Statement • Page ${page} of ${pages}`,
            pageWidth / 2,
            pageHeight - 18,
            { align: "center" }
        );
    }

    const stamp = new Date().toISOString().slice(0, 10);
    doc.save(`member-statement-${stamp}.pdf`);
}

function hexToRgb(hex?: string | null): [number, number, number] {
    const fallback: [number, number, number] = [25, 118, 210];
    if (!hex) {
        return fallback;
    }

    const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!match) {
        return fallback;
    }

    const int = parseInt(match[1], 16);
    return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

export function downloadLeagueStandingsPdf(payload: LeagueStandingsPdfPayload) {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;

    const text: [number, number, number] = [15, 23, 42];
    const muted: [number, number, number] = [71, 85, 105];
    const tierColor = hexToRgb(payload.tierColor);

    doc.setFillColor(...tierColor);
    doc.rect(0, 0, pageWidth, 88, "F");
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 78, pageWidth, 10, "F");

    const brandName = resolveBrandName(payload.tenantName);
    drawReportLogo(doc, payload.logoDataUrl, brandName, margin, 18);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text(brandName, margin + 44, 34, { maxWidth: pageWidth / 2 - 44 });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`${payload.leagueName} League Standings`, margin + 44, 52);

    doc.text(`Generated: ${formatDate(new Date().toISOString())}`, pageWidth - margin, 34, { align: "right" });
    doc.text(`Generated by: ${payload.generatedBy || "Member Portal"}`, pageWidth - margin, 52, { align: "right" });

    doc.setTextColor(...text);
    let cursorY = 118;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`${payload.leagueName} League`, margin, cursorY);
    cursorY += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...muted);
    doc.text(
        `Your position: #${payload.tierRank} of ${payload.tierSize} in league  ·  Overall #${payload.overallRank} of ${payload.totalMembers}`,
        margin,
        cursorY
    );
    cursorY += 14;
    if (payload.memberNo) {
        doc.text(`Member ID: ${payload.memberNo}`, margin, cursorY);
        cursorY += 14;
    }
    doc.text("Members are shown by ID only to protect privacy.", margin, cursorY);
    cursorY += 18;

    const head = payload.showAmounts
        ? [["Pos", "Member ID", "Trend", "Savings"]]
        : [["Pos", "Member ID", "Trend"]];

    const body = payload.rows.map((row) => {
        const trend = row.rank_change == null || row.rank_change === 0
            ? "-"
            : row.rank_change > 0
                ? `Up ${row.rank_change}`
                : `Down ${Math.abs(row.rank_change)}`;
        const label = `#${row.tier_rank}`;
        const memberId = row.is_self ? `${row.member_no} (You)` : row.member_no;

        return payload.showAmounts
            ? [label, memberId, trend, formatCurrency(Number(row.amount || 0))]
            : [label, memberId, trend];
    });

    autoTable(doc, {
        startY: cursorY,
        head,
        body: body.length ? body : [payload.showAmounts ? ["-", "No members", "-", "-"] : ["-", "No members", "-"]],
        theme: "grid",
        headStyles: { fillColor: tierColor, textColor: 255, fontStyle: "bold", halign: "left" },
        styles: { font: "helvetica", fontSize: 9, cellPadding: 6, textColor: text },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: payload.showAmounts
            ? { 0: { cellWidth: 50 }, 1: { cellWidth: 200 }, 2: { halign: "center", cellWidth: 90 }, 3: { halign: "right", cellWidth: 150 } }
            : { 0: { cellWidth: 60 }, 1: { cellWidth: 300 }, 2: { halign: "center", cellWidth: 120 } },
        didParseCell: (data) => {
            const row = payload.rows[data.row.index];
            if (row?.is_self && data.section === "body") {
                data.cell.styles.fontStyle = "bold";
                data.cell.styles.fillColor = [
                    Math.round(tierColor[0] + (255 - tierColor[0]) * 0.82),
                    Math.round(tierColor[1] + (255 - tierColor[1]) * 0.82),
                    Math.round(tierColor[2] + (255 - tierColor[2]) * 0.82)
                ];
            }
        },
        margin: { left: margin, right: margin }
    });

    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
        doc.setPage(page);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...muted);
        doc.text(
            `${brandName} • ${payload.leagueName} League • Page ${page} of ${pages}`,
            pageWidth / 2,
            pageHeight - 18,
            { align: "center" }
        );
    }

    const stamp = new Date().toISOString().slice(0, 10);
    doc.save(`league-${payload.leagueName.toLowerCase().replace(/\s+/g, "-")}-${stamp}.pdf`);
}

export function downloadLeagueStaffPdf(payload: LeagueStaffPdfPayload) {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;

    const primary: [number, number, number] = [10, 5, 115];
    const accent: [number, number, number] = [31, 168, 230];
    const text: [number, number, number] = [15, 23, 42];
    const muted: [number, number, number] = [71, 85, 105];

    doc.setFillColor(...primary);
    doc.rect(0, 0, pageWidth, 88, "F");
    doc.setFillColor(...accent);
    doc.rect(0, 78, pageWidth, 10, "F");

    const brandName = resolveBrandName(payload.tenantName);
    drawReportLogo(doc, payload.logoDataUrl, brandName, margin, 18);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text(brandName, margin + 44, 34, { maxWidth: pageWidth / 2 - 44 });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Savings League Standings", margin + 44, 52);

    doc.text(`Generated: ${formatDate(new Date().toISOString())}`, pageWidth - margin, 34, { align: "right" });
    doc.text(`Generated by: ${payload.generatedBy || "Branch Manager"}`, pageWidth - margin, 52, { align: "right" });

    doc.setTextColor(...text);
    let cursorY = 116;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("League Summary", margin, cursorY);
    cursorY += 8;

    // Strictly ordered by savings range (highest league first) so the reader
    // never jumps between ranges, even if the setup list is out of order.
    // Duplicate tier names in the setup (e.g. "Pearl" listed twice) are
    // collapsed to their first occurrence so no league section repeats.
    const seenTierNames = new Set<string>();
    const tiersByRangeDesc = [...payload.tiers]
        .sort((left, right) => Number(right.min_amount ?? 0) - Number(left.min_amount ?? 0))
        .filter((tier) => {
            const key = tier.name.trim().toLowerCase();
            if (seenTierNames.has(key)) {
                return false;
            }
            seenTierNames.add(key);
            return true;
        });

    autoTable(doc, {
        startY: cursorY,
        head: [["League", "Savings Range", "Members"]],
        body: tiersByRangeDesc.map((tier) => [
            tier.name,
            tier.range_label || "—",
            String(payload.rows.filter((row) => row.tier_name === tier.name).length || tier.member_count || 0)
        ]),
        theme: "grid",
        headStyles: { fillColor: primary, textColor: 255, fontStyle: "bold" },
        styles: { font: "helvetica", fontSize: 9, cellPadding: 5, textColor: text },
        columnStyles: { 1: { halign: "right", cellWidth: 190 }, 2: { halign: "right", cellWidth: 70 } },
        margin: { left: margin, right: margin }
    });

    cursorY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || cursorY;
    cursorY += 20;

    // Highest savings range first — same order as the summary table above.
    const orderedTiers = tiersByRangeDesc.map((tier, index) => ({ tier, index }));

    orderedTiers.forEach(({ tier }) => {
        const tierRows = payload.rows
            .filter((row) => row.tier_name === tier.name)
            .sort((left, right) => left.tier_rank - right.tier_rank);

        if (!tierRows.length) {
            return;
        }

        const tierColor = hexToRgb(tier.color);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...tierColor);
        doc.text(
            `${tier.name} League${tier.range_label ? `  ·  ${tier.range_label}` : ""}  (${tierRows.length})`,
            margin,
            cursorY
        );
        cursorY += 6;

        // Branch and Savings columns intentionally omitted: single-branch SACCO,
        // and exact balances stay off the shared standings sheet.
        const head = payload.includeNames
            ? [["Pos", "Member", "ID", "Trend"]]
            : [["Pos", "Member ID", "Trend"]];

        const body = tierRows.map((row) => {
            const trend = row.rank_change == null || row.rank_change === 0
                ? "-"
                : row.rank_change > 0
                    ? `Up ${row.rank_change}`
                    : `Down ${Math.abs(row.rank_change)}`;

            return payload.includeNames
                ? [`#${row.tier_rank}`, row.member_name || "-", row.member_no, trend]
                : [`#${row.tier_rank}`, row.member_no, trend];
        });

        autoTable(doc, {
            startY: cursorY,
            head,
            body,
            theme: "grid",
            headStyles: { fillColor: tierColor, textColor: 255, fontStyle: "bold", halign: "left" },
            styles: { font: "helvetica", fontSize: 8.5, cellPadding: 5, textColor: text },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: payload.includeNames
                ? { 0: { cellWidth: 40 }, 3: { halign: "center", cellWidth: 80 } }
                : { 0: { cellWidth: 50 }, 2: { halign: "center", cellWidth: 90 } },
            margin: { left: margin, right: margin }
        });

        cursorY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || cursorY;
        cursorY += 18;
    });

    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
        doc.setPage(page);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...muted);
        const privacy = payload.includeNames ? "Internal — contains member names" : "Member IDs only";
        doc.text(
            `${brandName} • Savings Leagues • ${privacy} • Page ${page} of ${pages}`,
            pageWidth / 2,
            pageHeight - 18,
            { align: "center" }
        );
    }

    const stamp = new Date().toISOString().slice(0, 10);
    const suffix = payload.includeNames ? "with-names" : "ids-only";
    doc.save(`league-standings-${suffix}-${stamp}.pdf`);
}

export function downloadLoanStatementPdf(payload: LoanStatementPdfPayload) {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;

    const colors = {
        primary: [10, 5, 115] as [number, number, number],
        accent: [31, 168, 230] as [number, number, number],
        text: [15, 23, 42] as [number, number, number],
        muted: [71, 85, 105] as [number, number, number],
        success: [22, 163, 74] as [number, number, number],
        warning: [245, 158, 11] as [number, number, number],
        danger: [220, 38, 38] as [number, number, number]
    };

    const totalOutstanding = Number(payload.loan.outstanding_principal || 0) + Number(payload.loan.accrued_interest || 0);
    const scheduledPrincipalOutstanding = payload.schedules.reduce(
        (sum, schedule) => sum + Math.max(Number(schedule.principal_due || 0) - Number(schedule.principal_paid || 0), 0),
        0
    );
    const scheduledInterestOutstanding = payload.schedules.reduce(
        (sum, schedule) => sum + Math.max(Number(schedule.interest_due || 0) - Number(schedule.interest_paid || 0), 0),
        0
    );
    const nextDueSchedule = payload.schedules.find((schedule) => schedule.status !== "paid") || null;

    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 88, "F");
    doc.setFillColor(...colors.accent);
    doc.rect(0, 78, pageWidth, 10, "F");

    const brandName = resolveBrandName(payload.tenantName);
    drawReportLogo(doc, payload.logoDataUrl, brandName, margin, 18);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text(brandName, margin + 44, 34, { maxWidth: pageWidth / 2 - 44 });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Loan Statement", margin + 44, 52);

    const generatedAt = formatDate(new Date().toISOString());
    doc.text(`Generated: ${generatedAt}`, pageWidth - margin, 34, { align: "right" });
    doc.text(`Generated by: ${payload.generatedBy || "Member Portal"}`, pageWidth - margin, 52, { align: "right" });

    doc.setTextColor(...colors.text);
    let cursorY = 118;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Member & Loan Details", margin, cursorY);
    cursorY += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.muted);
    doc.text(`Name: ${payload.memberName}`, margin, cursorY);
    doc.text(`Email: ${payload.memberEmail || "N/A"}`, margin + 240, cursorY);
    cursorY += 14;
    doc.text(`SACCOS: ${payload.tenantName || "N/A"}`, margin, cursorY);
    doc.text(`Branch: ${payload.branchName || "N/A"}`, margin + 240, cursorY);
    cursorY += 14;
    doc.text(`Loan Number: ${payload.loan.loan_number}`, margin, cursorY);
    doc.text(`Status: ${prettifyType(payload.loan.status)}`, margin + 240, cursorY);
    cursorY += 14;
    doc.text(`Rate: ${formatMonthlyLoanRate(payload.loan.annual_interest_rate)}`, margin, cursorY);
    doc.text(`Repayment: ${prettifyType(payload.loan.repayment_frequency)}`, margin + 240, cursorY);
    cursorY += 14;
    doc.text(`Disbursed: ${formatCompactDate(payload.loan.disbursed_at || payload.loan.created_at)}`, margin, cursorY);
    doc.text(`Next Due: ${nextDueSchedule ? formatCompactDate(nextDueSchedule.due_date) : "N/A"}`, margin + 240, cursorY);
    cursorY += 24;

    const summaryCards = [
        { label: "Principal", value: formatCurrency(payload.loan.principal_amount), tone: "primary" as const },
        { label: "Outstanding Principal", value: formatCurrency(payload.loan.outstanding_principal), tone: "warning" as const },
        { label: "Accrued Interest", value: formatCurrency(payload.loan.accrued_interest), tone: "danger" as const },
        { label: "Total Outstanding", value: formatCurrency(totalOutstanding), tone: totalOutstanding > 0 ? "danger" as const : "success" as const }
    ];

    const cardGap = 10;
    const cardWidth = (pageWidth - margin * 2 - cardGap * 3) / 4;
    const cardHeight = 62;

    summaryCards.forEach((card, index) => {
        const x = margin + index * (cardWidth + cardGap);
        const y = cursorY;

        const bg = card.tone === "danger"
            ? [254, 242, 242]
            : card.tone === "success"
                ? [240, 253, 244]
                : card.tone === "warning"
                    ? [255, 251, 235]
                    : [239, 246, 255];
        const border = card.tone === "danger"
            ? colors.danger
            : card.tone === "success"
                ? colors.success
                : card.tone === "warning"
                    ? colors.warning
                    : colors.primary;

        doc.setFillColor(bg[0], bg[1], bg[2]);
        doc.roundedRect(x, y, cardWidth, cardHeight, 4, 4, "F");
        doc.setDrawColor(...border);
        doc.setLineWidth(0.7);
        doc.roundedRect(x, y, cardWidth, cardHeight, 4, 4, "S");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...colors.muted);
        doc.text(card.label, x + 10, y + 18);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...colors.text);
        doc.text(card.value, x + 10, y + 40);
    });

    cursorY += cardHeight + 24;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...colors.text);
    doc.text("Loan Schedule Snapshot", margin, cursorY);
    cursorY += 10;

    const scheduleRows = payload.schedules
        .slice(0, 120)
        .map((schedule) => ([
            String(schedule.installment_number),
            formatCompactDate(schedule.due_date),
            formatCurrency(schedule.principal_due),
            formatCurrency(schedule.interest_due),
            formatCurrency(Math.max(Number(schedule.principal_due || 0) - Number(schedule.principal_paid || 0), 0) + Math.max(Number(schedule.interest_due || 0) - Number(schedule.interest_paid || 0), 0)),
            prettifyType(schedule.status)
        ]));

    autoTable(doc, {
        startY: cursorY,
        head: [["Inst.", "Due Date", "Principal", "Interest", "Pending", "Status"]],
        body: scheduleRows.length ? scheduleRows : [["-", "No schedule available", "-", "-", "-", "-"]],
        theme: "grid",
        headStyles: {
            fillColor: colors.primary,
            textColor: 255,
            fontStyle: "bold",
            halign: "left"
        },
        styles: {
            font: "helvetica",
            fontSize: 8.5,
            cellPadding: 6,
            textColor: colors.text
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        columnStyles: {
            0: { cellWidth: 42, halign: "center" },
            1: { cellWidth: 88 },
            2: { cellWidth: 84, halign: "right" },
            3: { cellWidth: 84, halign: "right" },
            4: { cellWidth: 84, halign: "right" },
            5: { cellWidth: 82 }
        },
        margin: { left: margin, right: margin }
    });

    const scheduleTableY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || cursorY + 24;
    cursorY = scheduleTableY + 26;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...colors.text);
    doc.text("Loan Transactions", margin, cursorY);
    cursorY += 10;

    const transactionRows = payload.transactions
        .slice(0, 180)
        .map((row) => ([
            formatDate(row.created_at),
            prettifyType(row.transaction_type),
            row.reference || "-",
            formatCurrency(row.amount),
            formatCurrency(row.principal_component),
            formatCurrency(row.interest_component),
            formatCurrency(row.running_principal_balance),
            formatCurrency(row.running_interest_balance)
        ]));

    autoTable(doc, {
        startY: cursorY,
        head: [["Date", "Type", "Reference", "Amount", "Principal", "Interest", "Principal Bal.", "Interest Bal."]],
        body: transactionRows.length ? transactionRows : [["-", "No loan transactions available", "-", "-", "-", "-", "-", "-"]],
        theme: "grid",
        headStyles: {
            fillColor: colors.primary,
            textColor: 255,
            fontStyle: "bold",
            halign: "left"
        },
        styles: {
            font: "helvetica",
            fontSize: 7.8,
            cellPadding: 5.2,
            textColor: colors.text
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        columnStyles: {
            0: { cellWidth: 88 },
            1: { cellWidth: 72 },
            2: { cellWidth: 72 },
            3: { halign: "right", cellWidth: 58 },
            4: { halign: "right", cellWidth: 62 },
            5: { halign: "right", cellWidth: 58 },
            6: { halign: "right", cellWidth: 68 },
            7: { halign: "right", cellWidth: 64 }
        },
        margin: { left: margin, right: margin }
    });

    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
        doc.setPage(page);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...colors.muted);
        doc.text(
            `${brandName} • Confidential Loan Statement • ${payload.loan.loan_number} • Page ${page} of ${pages}`,
            pageWidth / 2,
            pageHeight - 18,
            { align: "center" }
        );
    }

    const stamp = new Date().toISOString().slice(0, 10);
    const safeLoanNumber = payload.loan.loan_number.replace(/[^A-Za-z0-9_-]+/g, "-");
    doc.save(`loan-statement-${safeLoanNumber}-${stamp}.pdf`);
}
