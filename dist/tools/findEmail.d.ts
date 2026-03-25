export declare const findEmailSchema: {
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
export declare function handleFindEmail(args: {
    website_url: string;
}): Promise<string>;
//# sourceMappingURL=findEmail.d.ts.map