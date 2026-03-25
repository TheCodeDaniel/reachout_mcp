import type { UserProfile, CompanyResearch, EmailType } from "../types/index.js";
export declare const generateEmailSchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
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
            company: {
                type: string;
                description: string;
                properties: {
                    url: {
                        type: string;
                    };
                    name: {
                        type: string;
                    };
                    email: {
                        type: string;
                    };
                    summary: {
                        type: string;
                    };
                    problems: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    suggestions: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    recommendedType: {
                        type: string;
                    };
                    reason: {
                        type: string;
                    };
                };
                required: string[];
            };
            type: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleGenerateEmail(args: {
    profile: UserProfile;
    company: CompanyResearch;
    type: EmailType;
}): Promise<string>;
//# sourceMappingURL=generateEmail.d.ts.map