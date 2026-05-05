import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Loader2 } from "lucide-react";
import type { CalendarEvent } from "@/types/communication";
import { EVENT_TYPE_OPTIONS } from "./constants";
import { useEventForm } from "./useEventForm";
import { ParticipantSelector } from "./ParticipantSelector";
import { RecurrenceFields } from "./RecurrenceFields";
import { ReminderPills } from "./ReminderPills";
import { ColorPicker } from "./ColorPicker";

interface EventModalProps {
  event?: CalendarEvent;
  defaultDate?: Date;
  onClose: () => void;
}

export default function EventModal({ event, defaultDate, onClose }: EventModalProps) {
  const {
    form: { register, control, setValue, formState: { errors } },
    isEditing,
    isAllDay,
    isRecurring,
    selectedColor,
    submitForm,
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
    isSubmitting,
    isDeleting,
  } = useEventForm({ event, defaultDate, onClose });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 sticky top-0 bg-white rounded-t-xl z-10">
            <h2 className="text-lg font-semibold text-neutral-900">
              {isEditing ? "Editar Evento" : "Novo Evento"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={submitForm} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                {...register("title", { required: "Título é obrigatório" })}
                type="text"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                placeholder="Nome do evento"
              />
              {errors.title && (
                <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Descrição
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors resize-none"
                placeholder="Detalhes do evento"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Tipo
              </label>
              <select
                {...register("eventType")}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors bg-white"
              >
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("isAllDay")}
                className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">Dia inteiro</span>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  {isAllDay ? "Data início" : "Data/Hora início"}
                </label>
                <input
                  {...register("startTime", { required: true })}
                  type={isAllDay ? "date" : "datetime-local"}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  {isAllDay ? "Data fim" : "Data/Hora fim"}
                </label>
                <input
                  {...register("endTime", { required: true })}
                  type={isAllDay ? "date" : "datetime-local"}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Local
              </label>
              <input
                {...register("location")}
                type="text"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                placeholder="Local do evento"
              />
            </div>

            <ColorPicker
              selectedColor={selectedColor}
              onSelect={(color) => setValue("color", color)}
            />

            <RecurrenceFields register={register} isRecurring={isRecurring} />

            <ParticipantSelector
              participants={participants}
              filteredUsers={filteredUsers}
              toggleParticipant={toggleParticipant}
              removeParticipant={removeParticipant}
              userSearch={userSearch}
              setUserSearch={setUserSearch}
              showUserDropdown={showUserDropdown}
              setShowUserDropdown={setShowUserDropdown}
              dropdownRef={dropdownRef}
            />

            <ReminderPills control={control} />

            <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
              <div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Excluir
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isEditing ? "Salvar" : "Criar Evento"}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
