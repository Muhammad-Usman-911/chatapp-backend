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

    // Initialize the system message
    this.chatHistory.push({ role: 'system', content: 'You are a helpful assistant.' });
  }

  async getChatCompletion(prompt: string): Promise<string> {
    try {
      // Add user's message to the chat history
      this.chatHistory.push({ role: 'user', content: prompt });

      // Make the OpenAI API call
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4', // Replace with the correct model
        messages: this.chatHistory,
      });

      const assistantMessage = response.choices[0]?.message?.content || 'No response';

      // Add assistant's response to the chat history
      this.chatHistory.push({ role: 'assistant', content: assistantMessage });

      return assistantMessage;
    } catch (error) {
      console.error('Error with OpenAI API:', error.message);
      throw new Error('Failed to fetch chat completion');
    }
  }

  clearChatHistory(): void {
    // Reset chat history, keeping the system message
    this.chatHistory = [{ role: 'system', content: 'You are a helpful assistant.' }];
  }
}
