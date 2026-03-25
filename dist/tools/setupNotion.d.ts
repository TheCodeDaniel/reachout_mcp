export declare const setupNotionSchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            parent_page_id: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleSetupNotion(args: {
    parent_page_id: string;
}): Promise<string>;
//# sourceMappingURL=setupNotion.d.ts.map