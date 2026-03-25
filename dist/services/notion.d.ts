import type { OutreachRecord, OutreachStatus } from "../types/index.js";
export declare function setupDatabase(): Promise<string>;
export declare function logRecord(record: OutreachRecord): Promise<string>;
export declare function updateStatus(pageId: string, status: OutreachStatus): Promise<void>;
export declare function getFailedRecords(): Promise<Array<{
    pageId: string;
    record: OutreachRecord;
}>>;
//# sourceMappingURL=notion.d.ts.map