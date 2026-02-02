
import { GoogleGenAI, Type } from "@google/genai";
import { Task, SubTask, TaskStatus, TaskPriority } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const geminiService = {
  /**
   * Breaks down a complex task into smaller actionable sub-tasks.
   */
  async breakDownTask(taskTitle: string, taskDescription: string): Promise<string[]> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Break down this task into exactly 3-5 specific, actionable sub-tasks: "${taskTitle}" (${taskDescription})`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["subtasks"]
        }
      }
    });

    try {
      const data = JSON.parse(response.text || '{"subtasks":[]}');
      return data.subtasks;
    } catch (e) {
      console.error("Failed to parse AI response", e);
      return [];
    }
  },

  /**
   * Generates productivity insights based on the current task list.
   */
  async getProductivityInsights(tasks: Task[]): Promise<{ summary: string; suggestions: string[]; encouragement: string }> {
    const taskSummary = tasks.map(t => `- [${t.status}] ${t.title} (${t.priority} priority)`).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this todo list and provide productivity coaching:\n${taskSummary}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A brief 1-sentence summary of current progress." },
            suggestions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3 specific tips to improve productivity based on the list."
            },
            encouragement: { type: Type.STRING, description: "A motivational quote or sentence." }
          },
          required: ["summary", "suggestions", "encouragement"]
        }
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      return {
        summary: "You have several active tasks.",
        suggestions: ["Try to focus on one high-priority task at a time.", "Break down large items."],
        encouragement: "Stay focused and keep moving forward!"
      };
    }
  }
};
