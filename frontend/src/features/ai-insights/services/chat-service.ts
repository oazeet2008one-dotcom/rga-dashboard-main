import { apiClient } from '@/services/api-client';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
}

export interface ChatSession {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messages?: ChatMessage[];
    _count?: {
        messages: number;
    };
}

export const chatService = {
    // Get all sessions for a user
    getSessions: async (userId: string) => {
        const response = await apiClient.get<ChatSession[]>(`/chat/sessions?userId=${userId}`);
        return response.data;
        // Note: interceptor unwraps .data, but if it returns the full axios response, we need .data.
        // Looking at api-client.ts, the interceptor effectively unwraps `response.data = responseData.data`.
        // BUT axios itself wraps everything in { data, status, headers... }.
        // So `response.data` IS the actual payload.
        // However, if the interceptor logic is confusing, I should double check.
        // In api-client: "response.data = responseData.data;" -> This modifies the axios response object's data property.
        // So `await apiClient.get(...)` returns the AxiosResponse object.
        // We trigger `.data` to get the payload.
    },

    // Get a single session with messages
    getSession: async (sessionId: string) => {
        const response = await apiClient.get<ChatSession>(`/chat/sessions/${sessionId}`);
        return response.data;
    },

    // Create a new session
    createSession: async (title: string) => {
        const response = await apiClient.post<ChatSession>('/chat/sessions', { title });
        return response.data;
    },

    // Send a message
    sendMessage: async (sessionId: string, role: 'user' | 'assistant', content: string) => {
        const response = await apiClient.post<ChatMessage>('/chat/messages', { sessionId, role, content });
        return response.data;
    },

    // Delete a session
    deleteSession: async (sessionId: string) => {
        const response = await apiClient.delete<{ success: boolean }>(`/chat/sessions/${sessionId}`);
        return response.data;
    },

    // Update session title
    updateSession: async (sessionId: string, title: string) => {
        const response = await apiClient.patch<ChatSession>(`/chat/sessions/${sessionId}`, { title });
        return response.data;
    },
};
