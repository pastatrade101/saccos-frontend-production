import type { Member } from "../types/api";

/**
 * The membership in the registrar's own template.
 *
 * These thirteen column names, in this order and this spelling, are not ours —
 * they are the cooperative registrar's import format, so the sheet can be filed
 * as it comes out. That is why the headers are camelCase while everything else
 * in this codebase is snake_case, and why the member number is absent even
 * though it is the SACCO's own handle on a person: the template has no column
 * for it. Do not "tidy" these names.
 */
const HEADERS = [
    "firstName",
    "middleName",
    "lastName",
    "phoneNumber",
    "tinNumber",
    "address",
    "dateOfBirth",
    "savingAmount",
    "noOfShares",
    "email",
    "gender",
    "nin",
    "registrationType"
] as const;

/**
 * Founder or joined later.
 *
 * The distinction lives in the member number and nowhere else: ILS24-F##### was
 * issued to the founding membership, ILS24-M##### to everyone admitted after
 * the SACCO opened — 151 and 13 of them respectively. membership_started_on
 * looks like the field to ask, and mostly agrees (every founder carrying one is
 * dated 1 October 2024), but it is missing on some records while the member
 * number is set on every single one.
 */
export type MemberCohort = "founder" | "new" | "unknown";

export function memberCohort(member: Pick<Member, "member_no">): MemberCohort {
    const number = (member.member_no || "").toUpperCase();
    if (/-F\d/.test(number)) return "founder";
    if (/-M\d/.test(number)) return "new";
    return "unknown";
}

export const COHORT_LABEL: Record<MemberCohort, string> = {
    founder: "Founder members",
    new: "Members who joined later",
    unknown: "Unclassified"
};

/**
 * First / middle / last, however the record happens to hold the name.
 *
 * Every member on the book today has the split columns filled, but they were
 * added after the first import and a CSV import can still create a record with
 * only a full_name. Where the split columns are populated they win, because
 * somebody entered them deliberately; otherwise the full name is divided on
 * whitespace, first token to first, last token to last, anything between them
 * to middle — so a new import cannot silently produce a sheet of blank names.
 */
export function splitMemberName(member: Pick<Member, "first_name" | "middle_name" | "last_name" | "full_name">) {
    const first = (member.first_name || "").trim();
    const last = (member.last_name || "").trim();
    if (first || last) {
        return {
            firstName: first,
            middleName: (member.middle_name || "").trim(),
            lastName: last
        };
    }

    const parts = (member.full_name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return { firstName: "", middleName: "", lastName: "" };
    if (parts.length === 1) return { firstName: parts[0], middleName: "", lastName: "" };

    return {
        firstName: parts[0],
        lastName: parts[parts.length - 1],
        middleName: parts.slice(1, -1).join(" ")
    };
}

/**
 * A National Identification Number is twenty digits.
 *
 * national_id is not reliably one: across the book it also holds passport
 * numbers (TAE1606440), TINs, placeholders like 11111111 and the REH- markers
 * above. Filing any of those as a NIN would put a wrong identifier against a
 * real person's name, so anything that is not twenty digits is left blank for
 * the SACCO to complete.
 */
function nationalIdNumber(member: Pick<Member, "nida_no" | "national_id">): string {
    const candidates = [member.nida_no, member.national_id];
    const match = candidates.find((value) => /^\d{20}$/.test(String(value || "").trim()));
    return match ? String(match).trim() : "";
}

/** Spreadsheet cells are one line; some addresses were typed with breaks. */
function flatten(value: string | null | undefined): string {
    return String(value || "").replace(/\s+/g, " ").trim();
}

function isoDate(value: string | null | undefined): string {
    if (!value) return "";
    // Already an ISO day from the API; guard anyway so a timestamp cannot leak
    // a time component into a date column.
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toISOString().slice(0, 10);
}

function stamp() {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
}

export interface MemberRegistryExportPayload {
    members: Member[];
    cohort: MemberCohort | "all";
    /**
     * Shares each member is required to hold, from the SACCO's share capital
     * settings rather than a literal in this file — the board has changed the
     * price twice already and will change the count eventually.
     */
    requiredShares: number;
    /**
     * All-time savings per member number, as the Contributions Summary reports
     * it — contributions in, less withdrawals and reversals. Keyed by member
     * number rather than id because that is what the report returns, and it is
     * unique within a tenant.
     *
     * Optional: the report is restricted to super admins, branch managers and
     * auditors, so a caller without that access exports the sheet with the
     * column blank rather than not at all.
     */
    savingsByMemberNo?: Map<string, number>;
    tenantName?: string | null;
}

export function buildMemberRegistryRows(payload: MemberRegistryExportPayload): (string | number)[][] {
    const { members, cohort, requiredShares, savingsByMemberNo } = payload;

    const selected = cohort === "all"
        ? members
        : members.filter((member) => memberCohort(member) === cohort);

    return selected
        .slice()
        .sort((left, right) => (left.member_no || "").localeCompare(right.member_no || ""))
        .map((member) => {
            const { firstName, middleName, lastName } = splitMemberName(member);
            return [
                firstName,
                middleName,
                lastName,
                member.phone || "",
                member.tin_no || "",
                flatten(member.residential_address || member.address_line1),
                isoDate(member.dob),
                // Left as a number, not a formatted string, so the recipient can
                // sum and sort the column. A member with nothing saved gets a
                // real 0 rather than a gap, which is the answer to the question
                // the column asks; a blank means the figure was unavailable.
                savingsByMemberNo
                    ? Number(savingsByMemberNo.get(member.member_no || "") || 0)
                    : "",
                requiredShares,
                member.email || "",
                (member.gender || "").toUpperCase(),
                nationalIdNumber(member),
                "MEMBER"
            ];
        });
}

export async function downloadMemberRegistryExcel(payload: MemberRegistryExportPayload) {
    const XLSX = await import("xlsx");

    const rows = buildMemberRegistryRows(payload);

    // Header row first, with no title or subtitle above it: this sheet is read
    // by the registrar's importer, which expects the column names on row 1.
    const sheet = XLSX.utils.aoa_to_sheet([[...HEADERS], ...rows]);

    sheet["!cols"] = [
        { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 16 }, { wch: 14 },
        { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 26 },
        { wch: 10 }, { wch: 22 }, { wch: 18 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Members");

    const scope = payload.cohort === "all" ? "all" : payload.cohort;
    XLSX.writeFile(workbook, `members-${scope}-${stamp()}.xlsx`);
}

export { HEADERS as MEMBER_REGISTRY_HEADERS };
