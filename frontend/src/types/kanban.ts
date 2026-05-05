/**
 * Shared primitives for the generic Kanban components.
 *
 * Entities rendered on a Kanban board must expose at least a stable id and
 * a columnId (the column they currently belong to). Columns are described
 * by a lean definition the Kanban layout consumes directly.
 */

export interface KanbanCardBase {
  id: string;
  columnId: string;
}

export interface KanbanColumnDef {
  id: string;
  name: string;
  color: string;
  isFinal?: boolean;
  /**
   * Optional per-column empty-state content. When set, the Kanban
   * column renders `emptyIcon` above `emptyLabel` instead of the
   * single generic `emptyColumnLabel` string passed to the view.
   */
  emptyLabel?: string;
  emptyIcon?: import('react').ReactNode;
}
