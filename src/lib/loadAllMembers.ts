import { api } from "./api";
import { endpoints, type MembersResponse } from "./endpoints";
import type { Member } from "../types/api";

// Pages that resolve member names client-side need every member, but the members
// list endpoint caps a page at 100 rows. This pages through them all so names and
// pickers are complete (no "Unknown member" beyond the first 100).
export async function loadAllMembers(
    tenantId: string,
    extraParams: Record<string, unknown> = {}
): Promise<Member[]> {
    const members: Member[] = [];
    let page = 1;
    while (page <= 50) {
        const { data } = await api.get<MembersResponse & { pagination?: { total: number } }>(
            endpoints.members.list(),
            { params: { tenant_id: tenantId, page, limit: 100, ...extraParams } }
        );
        const rows = data.data || [];
        members.push(...rows);
        if ((data.pagination?.total && members.length >= data.pagination.total) || rows.length < 100) {
            break;
        }
        page += 1;
    }
    return members;
}
