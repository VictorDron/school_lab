import { prisma } from '../config/database.js';

// Types
export interface CreateColumnData {
  name: string;
  color?: string;
  isFinal?: boolean;
}

export interface UpdateColumnData {
  name?: string;
  color?: string;
  isFinal?: boolean;
}

export interface ReorderColumnData {
  id: string;
  order: number;
}

/**
 * Generate a URL-safe slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Find all kanban columns ordered by position
 */
export async function findAll() {
  return prisma.kanbanColumn.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { leads: true } },
    },
  });
}

/**
 * Find a kanban column by ID
 */
export async function findById(id: string) {
  return prisma.kanbanColumn.findUnique({
    where: { id },
    include: {
      _count: { select: { leads: true } },
    },
  });
}

/**
 * Create a new kanban column
 */
export async function create(data: CreateColumnData) {
  // Get all columns ordered
  const columns = await prisma.kanbanColumn.findMany({
    orderBy: { order: 'asc' },
  });

  // Find the first final column to insert before it
  const firstFinalIndex = columns.findIndex(c => c.isFinal);
  const insertOrder = firstFinalIndex === -1 ? columns.length : firstFinalIndex;

  // Shift orders for columns at or after insertOrder
  if (firstFinalIndex !== -1) {
    await prisma.kanbanColumn.updateMany({
      where: { order: { gte: insertOrder } },
      data: { order: { increment: 1 } },
    });
  }

  // Generate unique slug
  let baseSlug = generateSlug(data.name);
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.kanbanColumn.findUnique({ where: { slug } })) {
    slug = `${baseSlug}_${counter}`;
    counter++;
  }

  return prisma.kanbanColumn.create({
    data: {
      name: data.name,
      slug,
      color: data.color || '#3B82F6',
      order: insertOrder,
      isFinal: data.isFinal || false,
      isDefault: false,
    },
    include: {
      _count: { select: { leads: true } },
    },
  });
}

/**
 * Update a kanban column
 */
export async function update(id: string, data: UpdateColumnData) {
  const column = await prisma.kanbanColumn.findUnique({ where: { id } });

  if (!column) {
    throw new Error('COLUMN_NOT_FOUND');
  }

  return prisma.kanbanColumn.update({
    where: { id },
    data,
    include: {
      _count: { select: { leads: true } },
    },
  });
}

/**
 * Reorder multiple kanban columns
 */
export async function reorder(columns: ReorderColumnData[]) {
  // Validate all column IDs exist
  const existingColumns = await prisma.kanbanColumn.findMany({
    where: { id: { in: columns.map(c => c.id) } },
  });

  if (existingColumns.length !== columns.length) {
    throw new Error('COLUMNS_NOT_FOUND');
  }

  // Update orders in a transaction
  await prisma.$transaction(
    columns.map(col =>
      prisma.kanbanColumn.update({
        where: { id: col.id },
        data: { order: col.order },
      })
    )
  );

  // Fetch updated columns
  return prisma.kanbanColumn.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { leads: true } },
    },
  });
}

/**
 * Delete a kanban column with optional lead migration
 */
export async function remove(id: string, targetColumnId?: string) {
  const column = await prisma.kanbanColumn.findUnique({
    where: { id },
    include: {
      _count: { select: { leads: true } },
    },
  });

  if (!column) {
    throw new Error('COLUMN_NOT_FOUND');
  }

  // Cannot delete default columns
  if (column.isDefault) {
    throw new Error('CANNOT_DELETE_DEFAULT');
  }

  // If column has leads, require targetColumnId
  if (column._count.leads > 0) {
    if (!targetColumnId) {
      throw new Error('REQUIRES_TARGET_COLUMN');
    }

    // Verify target column exists
    const targetColumn = await prisma.kanbanColumn.findUnique({
      where: { id: targetColumnId },
    });

    if (!targetColumn) {
      throw new Error('TARGET_COLUMN_NOT_FOUND');
    }

    // Cannot migrate to itself
    if (targetColumnId === column.id) {
      throw new Error('CANNOT_MIGRATE_TO_SELF');
    }

    // Migrate leads to target column
    await prisma.lead.updateMany({
      where: { columnId: column.id },
      data: { columnId: targetColumnId },
    });
  }

  // Delete the column
  await prisma.kanbanColumn.delete({ where: { id } });

  // Reorder remaining columns to fill the gap
  const remainingColumns = await prisma.kanbanColumn.findMany({
    orderBy: { order: 'asc' },
  });

  for (let i = 0; i < remainingColumns.length; i++) {
    if (remainingColumns[i].order !== i) {
      await prisma.kanbanColumn.update({
        where: { id: remainingColumns[i].id },
        data: { order: i },
      });
    }
  }

  return { column, leadsMigrated: column._count.leads };
}
