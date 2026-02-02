import React from "react";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to strip HTML tags from a string
export function stripHtml(html: string): string {
  const stripped = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  
  return stripped;
}

// Helper function to parse server messages from Frappe API responses
export function parseServerMessages(serverMessages: string): string[] {
  try {
    const messagesArray = JSON.parse(serverMessages);
    if (Array.isArray(messagesArray)) {
      return messagesArray.map((msgStr: string) => {
        try {
          const parsed = JSON.parse(msgStr);
          const message = parsed.message || "";
          // Strip HTML tags from the message
          return stripHtml(message);
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

// Enhanced API response handler for consistent error/success message handling
export function handleApiResponse(
  response: any,
  error: any,
  defaultSuccessMessage: string,
  defaultErrorMessage: string
): { success: boolean; messages: string[]; fallbackMessage: string } {
  const messages: string[] = [];
  let fallbackMessage = defaultErrorMessage;
  let success = false;

  // Handle successful response
  if (response && !error) {
    success = true;
    fallbackMessage = defaultSuccessMessage;

    // Check for server messages in successful response
    const serverMessages = response.data?._server_messages;
    if (serverMessages) {
      const parsedMessages = parseServerMessages(serverMessages);
      if (parsedMessages.length > 0) {
        messages.push(...parsedMessages);
      }
    }
  }
  // Handle error response
  else if (error) {
    success = false;
    fallbackMessage = defaultErrorMessage;

    // Check for server messages in error response
    const serverMessages = error.response?.data?._server_messages;
    if (serverMessages) {
      const parsedMessages = parseServerMessages(serverMessages);
      if (parsedMessages.length > 0) {
        messages.push(...parsedMessages);
      }
    } else {
      // Fallback to exception or error message
      fallbackMessage = error.response?.data?.exception || error.message || defaultErrorMessage;
    }
  }

  return { success, messages, fallbackMessage };
}

// Ultra-simple API response handler - returns formatted messages for toast
export function getApiMessages(
  response: any,
  error: any,
  defaultSuccessMessage: string | null,
  defaultErrorMessage: string,
  customErrorHandler?: (error: any) => string
): { success: boolean; message: string; description?: string } {
  const result = handleApiResponse(response, error, defaultSuccessMessage || defaultErrorMessage, defaultErrorMessage);

  if (result.success) {
    if (result.messages.length > 0) {
      return { success: true, message: result.messages[0], description: result.messages.slice(1).join("\n") || undefined };
    } else {
      return { success: true, message: result.fallbackMessage };
    }
  } else {
    if (result.messages.length > 0) {
      return { success: false, message: defaultErrorMessage, description: result.messages.join("\n") };
    } else {
      const finalMessage = customErrorHandler ? customErrorHandler(error) : result.fallbackMessage;
      return { success: false, message: defaultErrorMessage, description: finalMessage };
    }
  }
}

// lib/utils.tsx (Add these functions)

/**
 * Formats a date string into a compact, human-readable "Time Ago" format.
 * Mimics Frappe's list view timestamps.
 */
export function formatTimeAgo(dateString: string | undefined): string {
  if (!dateString) return "—";

  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;

  // For older dates, show "Day Month" (e.g., 2 Feb)
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Returns a full localized string for tooltips.
 */
export function formatFullTimestamp(dateString: string | undefined): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
