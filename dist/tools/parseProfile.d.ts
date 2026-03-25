export declare const parseProfileSchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            input: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleParseProfile(args: {
    input: string;
}): Promise<string>;
//# sourceMappingURL=parseProfile.d.ts.map