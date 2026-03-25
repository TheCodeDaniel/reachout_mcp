export declare const sendEmailSchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            to: {
                type: string;
                description: string;
            };
            subject: {
                type: string;
                description: string;
            };
            body: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleSendEmail(args: {
    to: string;
    subject: string;
    body: string;
}): Promise<string>;
//# sourceMappingURL=sendEmail.d.ts.map