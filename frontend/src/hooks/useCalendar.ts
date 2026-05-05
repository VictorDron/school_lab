import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del } from '@/lib/api';
import type { CalendarEvent } from '@/types/communication';

export function useCalendarEvents(startDate: string, endDate: string, channelId?: string) {
  return useQuery({
    queryKey: ['calendarEvents', startDate, endDate, channelId],
    queryFn: () => {
      let url = `/calendar?startDate=${startDate}&endDate=${endDate}`;
      if (channelId) url += `&channelId=${channelId}`;
      return get<CalendarEvent[]>(url);
    },
    enabled: !!startDate && !!endDate,
    select: (data) => data.data || [],
  });
}

export function useUpcomingEvents(limit = 5) {
  return useQuery({
    queryKey: ['upcomingEvents', limit],
    queryFn: () => get<CalendarEvent[]>(`/calendar/upcoming?limit=${limit}`),
    select: (data) => data.data || [],
  });
}

export function useCalendarEvent(eventId: string | null) {
  return useQuery({
    queryKey: ['calendarEvent', eventId],
    queryFn: () => get<CalendarEvent>(`/calendar/${eventId}`),
    enabled: !!eventId,
    select: (data) => data.data,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      eventType?: string;
      startTime: string;
      endTime: string;
      isAllDay?: boolean;
      location?: string;
      color?: string;
      channelId?: string;
      isRecurring?: boolean;
      recurrenceFrequency?: string;
      recurrenceInterval?: number;
      recurrenceEndDate?: string;
      participantIds?: string[];
      reminderMinutes?: number[];
    }) => post('/calendar', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendarEvents'] });
      qc.invalidateQueries({ queryKey: ['upcomingEvents'] });
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, ...data }: { eventId: string; [key: string]: any }) =>
      patch(`/calendar/${eventId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendarEvents'] });
      qc.invalidateQueries({ queryKey: ['upcomingEvents'] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => del(`/calendar/${eventId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendarEvents'] });
      qc.invalidateQueries({ queryKey: ['upcomingEvents'] });
    },
  });
}

export function useRespondToEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: string }) =>
      post(`/calendar/${eventId}/rsvp`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendarEvents'] });
      qc.invalidateQueries({ queryKey: ['calendarEvent'] });
    },
  });
}
