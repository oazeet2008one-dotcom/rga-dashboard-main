import { apiClient } from "./api-client";

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
    sessionId: string;
}

export interface ChatSession {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messages: ChatMessage[];
}

export const chatService = {
    getSessions: async (): Promise<ChatSession[]> => {
        const response = await apiClient.get<ChatSession[]>('/chat/sessions');
        return response.data;
    },

    getSession: async (id: string): Promise<ChatSession> => {
        const response = await apiClient.get<ChatSession>(`/chat/sessions/${id}`);
        return response.data;
    },

    createSession: async (title: string): Promise<ChatSession> => {
        const response = await apiClient.post<ChatSession>('/chat/sessions', { title });
        return response.data;
    },

    sendMessage: async (sessionId: string, content: string, role: 'user' | 'assistant'): Promise<ChatMessage> => {
        const response = await apiClient.post<ChatMessage>(`/chat/sessions/${sessionId}/messages`, {
            content,
            role,
        });
        return response.data;
    },

    deleteSession: async (id: string): Promise<void> => {
        await apiClient.delete(`/chat/sessions/${id}`);
    }
};
