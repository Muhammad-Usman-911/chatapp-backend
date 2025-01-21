import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenaiService {
  private openai: OpenAI;
  private chatHistory: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your .env file
    });

    // Initialize the system message for chatbot functionality
    this.chatHistory.push({ role: 'system', content: 'You are a helpful assistant.' });
  }

  async getChatCompletion(prompt: string): Promise<string> {
    try {
      // Add user's message to the chat history
      this.chatHistory.push({ role: 'user', content: prompt });

      // Make the OpenAI API call
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: this.chatHistory,
        max_tokens: 50, // Limit the response length to approximately 2-3 lines
      });

      const assistantMessage = response.choices[0]?.message?.content?.trim() || 'No response';

      // Add assistant's response to the chat history
      this.chatHistory.push({ role: 'assistant', content: assistantMessage });

      return assistantMessage;
    } catch (error) {
      console.error('Error with OpenAI API:', error.message);
      throw new Error('Failed to fetch chat completion');
    }
  }

  async getSuggestedMessage(message: string): Promise<string> {
    try {
      const prompt = `You are an assistant. Suggest a polite, concise, and well-phrased response (2-3 lines) to the following message: "${message}".`;
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50, // Limit the response length to approximately 2-3 lines
      });

      return response.choices[0]?.message?.content?.trim() || 'No suggestion available.';
    } catch (error) {
      console.error('Error with OpenAI API:', error.message);
      throw new Error('Failed to fetch suggested message');
    }
  }

  clearChatHistory(): void {
    // Reset chat history, keeping the system message
    this.chatHistory = [{ role: 'system', content: 'You are a helpful assistant.' }];
  }
}
