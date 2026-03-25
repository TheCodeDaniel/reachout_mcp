export declare const researchCompanySchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            website_url: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleResearchCompany(args: {
    website_url: string;
}): Promise<string>;
//# sourceMappingURL=researchCompany.d.ts.map