import type { UserProfile } from "../types/index.js";
export declare const discoverCompaniesSchema: {
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
            count: {
                type: string;
                description: string;
            };
            niche: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleDiscoverCompanies(args: {
    profile: UserProfile;
    count?: number;
    niche?: string;
}): Promise<string>;
//# sourceMappingURL=discoverCompanies.d.ts.map