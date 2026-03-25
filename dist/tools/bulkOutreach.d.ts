import type { UserProfile, CompanyResearch, TypeConfirmations } from "../types/index.js";
export declare const bulkOutreachSchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            company_urls: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
                maxItems: number;
            };
            profile: {
                type: string;
                description: string;
                properties: {
                    role: {
                        type: string;
                    };
                    skills: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    experience: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    strengths: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                };
                required: string[];
            };
            confirmations: {
                type: string;
                description: string;
                additionalProperties: {
                    type: string;
                    enum: string[];
                };
            };
            researched_companies: {
                type: string;
                description: string;
                items: {
                    type: string;
                };
            };
        };
        required: string[];
    };
};
export declare function handleBulkOutreach(args: {
    company_urls: string[];
    profile: UserProfile;
    confirmations?: TypeConfirmations;
    researched_companies?: CompanyResearch[];
}): Promise<string>;
//# sourceMappingURL=bulkOutreach.d.ts.map