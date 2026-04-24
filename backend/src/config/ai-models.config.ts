export const AI_MODELS_CONFIG = {
    gpt4: {
        name: 'gpt-4',
        provider: 'openai',
        maxTokens: 8000,
    },
    claude3: {
        name: 'claude-3',
        provider: 'anthropic',
        maxTokens: 100000,
    },
    gemini: {
        name: 'gemini-pro',
        provider: 'google',
        maxTokens: 30000,
    },
};