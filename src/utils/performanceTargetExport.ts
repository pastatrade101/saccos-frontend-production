import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { formatCurrency } from "./format";

/**
 * Shareable performance-target report.
 *
 * Deliberately carries no member names or phone numbers: it is meant to be
 * circulated to the whole membership so each person can find their own row.
 * The member number is the only identifier, so a member recognises themselves
 * while nobody learns who the other rows belong to by reading the sheet.
 */
export interface PerformanceTargetExportRow {
    memberNo: string;
    level: string;
    actualAmount: number;
    annualTargetAmount: number;
    remainingToTargetAmount: number;
    nextRequiredAmount: number;
    reachPercent: number;
}

export interface PerformanceTargetExportPayload {
    tenantName: string;
    /** Named so the reader knows whether this is everyone or one category. */
    scopeLabel: string;
    requiredNowAmount: number;
    onTrackPercent: number;
    rows: PerformanceTargetExportRow[];
}

const PRIMARY: [number, number, number] = [10, 5, 115];
const TEXT: [number, number, number] = [17, 24, 39];
const MUTED: [number, number, number] = [107, 114, 128];

/**
 * Category order, worst first. A member opening this looks for their own row,
 * and the sections that need action should be the ones they meet first.
 */
const LEVEL_ORDER = ["No activity", "Needs top-up", "Building", "On track", "Target met"];

function stamp() {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
}

function bare(amount: number) {
    return formatCurrency(amount).replace(/^TSh\s*/, "");
}

export function downloadPerformanceTargetPdf(payload: PerformanceTargetExportPayload) {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 32;

    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, pageWidth, 78, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(payload.tenantName, margin, 32, { maxWidth: pageWidth - margin * 2 });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Member Savings Targets", margin, 50);
    doc.setFontSize(9);
    doc.text(payload.scopeLabel, margin, 66);
    doc.text(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), pageWidth - margin, 32, { align: "right" });
    doc.text(`Expected to date: ${formatCurrency(payload.requiredNowAmount)}`, pageWidth - margin, 50, { align: "right" });
    doc.text(`On-track line: ${payload.onTrackPercent}%`, pageWidth - margin, 66, { align: "right" });

    let cursorY = 100;

    // Counts per category, so the SACCO's overall position is readable without
    // anyone counting rows.
    const byLevel = new Map<string, PerformanceTargetExportRow[]>();
    payload.rows.forEach((row) => {
        const existing = byLevel.get(row.level) || [];
        existing.push(row);
        byLevel.set(row.level, existing);
    });

    const orderedLevels = [...byLevel.keys()].sort(
        (left, right) => {
            const leftRank = LEVEL_ORDER.indexOf(left);
            const rightRank = LEVEL_ORDER.indexOf(right);
            return (leftRank === -1 ? 99 : leftRank) - (rightRank === -1 ? 99 : rightRank);
        }
    );

    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Summary", margin, cursorY);
    cursorY += 8;

    autoTable(doc, {
        startY: cursorY,
        head: [["Category", "Members", "Share"]],
        body: orderedLevels.map((level) => {
            const count = byLevel.get(level)?.length || 0;
            const share = payload.rows.length ? Math.round((count / payload.rows.length) * 100) : 0;
            return [level, String(count), `${share}%`];
        }),
        foot: [["Total", String(payload.rows.length), "100%"]],
        theme: "grid",
        headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: "bold" },
        footStyles: { fillColor: [241, 245, 249], textColor: TEXT, fontStyle: "bold" },
        styles: { font: "helvetica", fontSize: 9, cellPadding: 5, textColor: TEXT },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
        margin: { left: margin, right: margin },
        tableWidth: 260
    });

    cursorY = ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || cursorY) + 24;

    orderedLevels.forEach((level) => {
        const levelRows = byLevel.get(level) || [];

        doc.setTextColor(...TEXT);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`${level} — ${levelRows.length} member(s)`, margin, cursorY);
        cursorY += 8;

        autoTable(doc, {
            startY: cursorY,
            head: [["Member No.", "Saved", "Annual target", "Remaining", "Expected now", "Reach"]],
            body: levelRows
                .slice()
                .sort((left, right) => left.reachPercent - right.reachPercent)
                .map((row) => [
                    row.memberNo,
                    bare(row.actualAmount),
                    bare(row.annualTargetAmount),
                    bare(row.remainingToTargetAmount),
                    bare(row.nextRequiredAmount),
                    `${Math.round(row.reachPercent)}%`
                ]),
            theme: "grid",
            headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: "bold" },
            styles: { font: "helvetica", fontSize: 8.5, cellPadding: 4, textColor: TEXT },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                1: { halign: "right" },
                2: { halign: "right" },
                3: { halign: "right" },
                4: { halign: "right" },
                5: { halign: "right" }
            },
            margin: { left: margin, right: margin }
        });

        cursorY = ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || cursorY) + 22;
    });

    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
        doc.setPage(page);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        doc.text(
            "Amounts in TSh. Find your row by your member number.",
            margin,
            pageHeight - 18
        );
        doc.text(`Page ${page} of ${pages}`, pageWidth - margin, pageHeight - 18, { align: "right" });
    }

    doc.save(`member-targets-${stamp()}.pdf`);
}
