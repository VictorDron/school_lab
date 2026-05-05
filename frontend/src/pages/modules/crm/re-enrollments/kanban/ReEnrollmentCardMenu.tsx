import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { InviteGateActions } from '../detail/InviteGateActions';
import { isTerminal, type ReEnrollmentGateStatus } from '@/lib/re-enrollment-transitions';

interface ReEnrollmentCardMenuProps {
  inviteId: string;
  gateStatus: ReEnrollmentGateStatus;
}

const DROPDOWN_WIDTH = 240;
const DROPDOWN_HEIGHT_ESTIMATE = 160;

/**
 * Compact gate-transition menu mounted on each Kanban card. Always
 * visible on mobile; hidden until the card is hovered on desktop,
 * keeping the board visually quiet in the common read-only case.
 *
 * The dropdown panel is portaled into document.body with fixed
 * positioning so it can escape the Kanban column's overflow clipping
 * and the app shell's stacking context. Clicks on the trigger button
 * stop propagation so the card's click-to-open navigation does not
 * fire when the operator wanted to advance the gate instead.
 */
export function ReEnrollmentCardMenu({ inviteId, gateStatus }: ReEnrollmentCardMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const { hasModuleAccess } = useAuthStore();
  const canEdit = hasModuleAccess('CRM', 'EDIT') || hasModuleAccess('STUDENT_MANAGEMENT', 'EDIT');

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    // Default: open below-right. If there's not enough room on the right
    // (card is near the right edge of the viewport), flip to open left.
    let left = rect.right - DROPDOWN_WIDTH;
    if (left < 8) left = rect.left;
    let top = rect.bottom + 4;
    if (top + DROPDOWN_HEIGHT_ESTIMATE > window.innerHeight) {
      top = rect.top - DROPDOWN_HEIGHT_ESTIMATE - 4;
    }
    setCoords({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        panelRef.current && !panelRef.current.contains(t) &&
        triggerRef.current && !triggerRef.current.contains(t)
      ) {
        setOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  if (!canEdit || isTerminal(gateStatus)) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Ações do convite"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => e.stopPropagation()}
        className="p-1 rounded hover:bg-neutral-100 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <MoreHorizontal className="w-3.5 h-3.5 text-neutral-500" />
      </button>

      {open && coords &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-neutral-200 p-2"
            style={{ top: coords.top, left: coords.left, width: DROPDOWN_WIDTH }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 px-1">
              Avançar etapa
            </p>
            <InviteGateActions
              inviteId={inviteId}
              currentGate={gateStatus}
              size="sm"
              onTransitioned={() => setOpen(false)}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
