import type { OutreachRecord } from "../types/index.js";
export declare const logToNotionSchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            company: {
                type: string;
                description: string;
            };
            website: {
                type: string;
                description: string;
            };
            email: {
                type: string;
                description: string;
            };
            type: {
                type: string;
                enum: string[];
            };
            status: {
                type: string;
                enum: string[];
            };
            dateSent: {
                type: string;
                description: string;
            };
            notes: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleLogToNotion(args: OutreachRecord): Promise<string>;
//# sourceMappingURL=logToNotion.d.ts.map