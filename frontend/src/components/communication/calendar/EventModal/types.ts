export interface FormData {
  title: string;
  description: string;
  eventType: "MEETING" | "DEADLINE" | "REMINDER" | "CUSTOM";
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  location: string;
  color: string;
  isRecurring: boolean;
  recurrenceFrequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  recurrenceInterval: number;
  recurrenceEndDate: string;
  reminderMinutes: number[];
}

export interface UserOption {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
}
