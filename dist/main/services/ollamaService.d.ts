export interface OllamaModel {
    name: string;
    size: number;
    modified: string;
    details?: string;
}
export interface OllamaResponse {
    model: string;
    created_at: string;
    message?: {
        role: string;
        content: string;
    };
    response?: string;
    done: boolean;
}
export declare class OllamaService {
    private baseUrl;
    constructor();
    getModels(): Promise<OllamaModel[]>;
    chat(model: string, messages: Array<{
        role: string;
        content: string;
    }>): Promise<string>;
    generate(model: string, prompt: string): Promise<string>;
    generateStream(model: string, prompt: string, onData: (chunk: string) => void, onComplete: () => void, onError: (error: Error) => void): Promise<void>;
    chatStream(model: string, messages: Array<{
        role: string;
        content: string;
    }>, onData: (chunk: string) => void, onComplete: () => void, onError: (error: Error) => void, settings?: any): Promise<void>;
}
//# sourceMappingURL=ollamaService.d.ts.map