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
    const pageSize = Number(extraParams.limit || 500);
    while (page <= 50) {
        const { data } = await api.get<MembersResponse & { pagination?: { total?: number | null } }>(
            endpoints.members.list(),
            {
                params: {
                    tenant_id: tenantId,
                    page,
                    limit: pageSize,
                    fields: "lookup",
                    include_total: false,
                    ...extraParams
                }
            }
        );
        const rows = data.data || [];
        members.push(...rows);
        const total = Number(data.pagination?.total || 0);
        if ((total > 0 && members.length >= total) || rows.length < pageSize) {
            break;
        }
        page += 1;
    }
    return members;
}
