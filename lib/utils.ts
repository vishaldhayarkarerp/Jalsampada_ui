import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to parse server messages from Frappe API responses
export function parseServerMessages(serverMessages: string): string[] {
  try {
    const messagesArray = JSON.parse(serverMessages);
    if (Array.isArray(messagesArray)) {
      return messagesArray.map((msgStr: string) => {
        try {
          const parsed = JSON.parse(msgStr);
          return parsed.message || "";
        } catch {
          return "";
        }
      }).filter(Boolean);
    }
  } catch (e) {
    console.error("Failed to parse server messages:", e);
  }
  return [];
}
