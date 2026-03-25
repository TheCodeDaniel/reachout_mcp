export declare const retryFailedSchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            subject: {
                type: string;
                description: string;
            };
            body: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
};
export declare function handleRetryFailed(args: {
    subject?: string;
    body?: string;
}): Promise<string>;
//# sourceMappingURL=retryFailed.d.ts.map