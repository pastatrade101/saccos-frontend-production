// CSV is opened in Excel far more often than it is parsed by a program, and
// Excel decides what a cell MEANS from its first character. A member name or
// payment reference beginning with = + - @ is executed as a formula on open,
// so every exported string is neutralised here rather than at each call site.
//
// Two details the obvious version gets wrong:
//   - Leading whitespace is not protection. " =cmd" is still treated as a
//     formula by some spreadsheet apps, so the test runs on the trimmed value
//     while the apostrophe is prefixed to the original.
//   - A lone CR inside a field splits the record in CRLF-reading parsers, and
//     the text after it then starts a fresh row whose first cell is attacker
//     chosen. Quoting every string closes that, along with embedded commas,
//     quotes and newlines.
//
// Numbers are written bare so Excel still reads them as numbers — a negative
// amount legitimately starts with "-".
const FORMULA_START = /^[=+\-@\t\r]/;

export function escapeCsvCell(value: string | number | null | undefined): string {
    if (typeof value !== "string") {
        return String(value ?? "");
    }
    const guarded = FORMULA_START.test(value.trimStart()) ? `'${value}` : value;
    return `"${guarded.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
    return [headers, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}
