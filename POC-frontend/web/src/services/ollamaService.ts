import { api } from "./api";

export const OllamaService = {
     sendMsg: async (msg: string, model = 'llama2') => {
        try {
          const payload = { content: msg, model };
          const response = await api.post("/api/ollama/chat", payload );
          return response.data;
        } catch (error) {
          console.error("Error sending message to Ollama:", error);
          throw error;
        }
      },
}