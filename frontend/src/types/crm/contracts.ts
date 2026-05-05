// Kanban Column types

export interface KanbanColumn {
  id: string;
  name: string;
  slug: string;
  color: string;
  order: number;
  isFinal: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    leads: number;
  };
}

export interface CreateKanbanColumnData {
  name: string;
  color?: string;
  isFinal?: boolean;
}

export interface UpdateKanbanColumnData {
  name?: string;
  color?: string;
  isFinal?: boolean;
}

export interface ReorderKanbanColumnsData {
  columns: { id: string; order: number }[];
}

export interface DeleteKanbanColumnData {
  targetColumnId?: string;
}
