import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/lib/api";
import {
  useCreateEvent,
  useDeleteEvent,
  useUpdateEvent,
} from "@/hooks/useCalendar";
import { useAllUsers, useUserSearch } from "@/hooks/useUserSearch";
import type { CalendarEvent } from "@/types/communication";
import {
  getDefaultTimes,
  parseFormDate,
  toApiDateTime,
  toInputValue,
} from "./helpers";
import type { FormData, UserOption } from "./types";

interface UseEventFormParams {
  event?: CalendarEvent;
  defaultDate?: Date;
  onClose: () => void;
}

/**
 * Owns the entire EventModal data layer: react-hook-form setup with
 * defaults derived from an existing event or sensible new-event times,
 * the all-day ↔ datetime input format sync (re-formats start/end when
 * the all-day toggle flips so the existing value stays meaningful),
 * the participants collection with toggle/remove helpers, the
 * searchable user dropdown with click-outside dismissal, and the
 * submit/delete mutations with their localized toast errors.
 */
export function useEventForm({ event, defaultDate, onClose }: UseEventFormParams) {
  const isEditing = !!event;
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const defaults = getDefaultTimes(defaultDate);

  const form = useForm<FormData>({
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      eventType: event?.eventType || "MEETING",
      startTime: event
        ? toInputValue(event.startTime, event.isAllDay)
        : defaults.startTime,
      endTime: event
        ? toInputValue(event.endTime, event.isAllDay)
        : defaults.endTime,
      isAllDay: event?.isAllDay || false,
      location: event?.location || "",
      color: event?.color || "",
      isRecurring: event?.isRecurring || false,
      recurrenceFrequency: event?.recurrenceFrequency || "WEEKLY",
      recurrenceInterval: event?.recurrenceInterval || 1,
      recurrenceEndDate: event?.recurrenceEndDate
        ? format(parseISO(event.recurrenceEndDate), "yyyy-MM-dd")
        : "",
      reminderMinutes: [],
    },
  });

  const { watch, setValue, handleSubmit, formState } = form;
  const isAllDay = watch("isAllDay");
  const isRecurring = watch("isRecurring");
  const selectedColor = watch("color");
  const startTimeValue = watch("startTime");
  const endTimeValue = watch("endTime");
  const previousIsAllDay = useRef(isAllDay);

  const [participants, setParticipants] = useState<UserOption[]>(
    event?.participants?.map((p) => ({
      id: p.user.id,
      displayName: p.user.displayName,
      email: p.user.email || "",
      avatarUrl: p.user.avatarUrl,
    })) || [],
  );
  const [userSearch, setUserSearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: allUsers = [] } = useAllUsers();
  const { data: searchedUsers } = useUserSearch(userSearch);
  const displayedUsers = userSearch.length >= 1 ? (searchedUsers || []) : allUsers;
  const filteredUsers = displayedUsers.filter(
    (u) => !participants.some((p) => p.id === u.id),
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    if (showUserDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUserDropdown]);

  useEffect(() => {
    if (previousIsAllDay.current === isAllDay) return;

    if (startTimeValue) {
      setValue(
        "startTime",
        format(
          parseFormDate(startTimeValue, previousIsAllDay.current),
          isAllDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm",
        ),
      );
    }

    if (endTimeValue) {
      setValue(
        "endTime",
        format(
          parseFormDate(
            endTimeValue,
            previousIsAllDay.current,
            previousIsAllDay.current,
          ),
          isAllDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm",
        ),
      );
    }

    previousIsAllDay.current = isAllDay;
  }, [endTimeValue, isAllDay, setValue, startTimeValue]);

  function toggleParticipant(user: UserOption) {
    setParticipants((prev) => {
      const exists = prev.some((p) => p.id === user.id);
      if (exists) return prev.filter((p) => p.id !== user.id);
      return [...prev, user];
    });
  }

  function removeParticipant(userId: string) {
    setParticipants((prev) => prev.filter((p) => p.id !== userId));
  }

  async function onSubmit(data: FormData) {
    const startTime = toApiDateTime(data.startTime, data.isAllDay);
    const endTime = toApiDateTime(data.endTime, data.isAllDay, data.isAllDay);

    if (new Date(endTime) < new Date(startTime)) {
      toast.error("A data final precisa ser posterior ao início");
      return;
    }

    const recurrenceEndDate =
      data.isRecurring && data.recurrenceEndDate
        ? toApiDateTime(data.recurrenceEndDate, true, true)
        : undefined;

    if (recurrenceEndDate && new Date(recurrenceEndDate) < new Date(startTime)) {
      toast.error("A recorrência não pode terminar antes do evento começar");
      return;
    }

    const payload = {
      title: data.title.trim(),
      description: data.description.trim() || undefined,
      eventType: data.eventType,
      startTime,
      endTime,
      isAllDay: data.isAllDay,
      location: data.location.trim() || undefined,
      color: data.color || undefined,
      isRecurring: data.isRecurring,
      recurrenceFrequency: data.isRecurring ? data.recurrenceFrequency : undefined,
      recurrenceInterval: data.isRecurring ? data.recurrenceInterval : undefined,
      recurrenceEndDate,
      participantIds: participants.map((p) => p.id),
      reminderMinutes:
        data.reminderMinutes.length > 0 ? data.reminderMinutes : undefined,
    };

    try {
      if (isEditing && event) {
        await updateEvent.mutateAsync({ eventId: event.id, ...payload });
      } else {
        await createEvent.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleDelete() {
    if (!event) return;
    if (!window.confirm("Tem certeza que deseja excluir este evento?")) return;
    try {
      await deleteEvent.mutateAsync(event.id);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return {
    form,
    isEditing,
    isAllDay,
    isRecurring,
    selectedColor,
    submitForm: handleSubmit(onSubmit),
    formState,
    participants,
    toggleParticipant,
    removeParticipant,
    userSearch,
    setUserSearch,
    showUserDropdown,
    setShowUserDropdown,
    dropdownRef,
    filteredUsers,
    handleDelete,
    isSubmitting:
      formState.isSubmitting || createEvent.isPending || updateEvent.isPending,
    isDeleting: deleteEvent.isPending,
  };
}
