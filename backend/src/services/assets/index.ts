import { prisma } from '../../config/database.js';

export type {
  AssetFilters,
  AssetPagination,
  CheckInventoryItemData,
  CompleteMaintenanceData,
  CreateAssetData,
  CreateMaintenanceData,
  UpdateAssetData,
} from './types.js';

export {
  listAssets,
  getAssetById,
  createAsset,
  moveAsset,
  assignAsset,
  updateAsset,
  decommissionAsset,
} from './operations.js';

export {
  getUpcomingMaintenance,
  getOverdueMaintenance,
  getMaintenanceHistory,
  createMaintenance,
  completeMaintenance,
} from './maintenance.js';

export {
  listInventorySessions,
  createInventorySession,
  getInventorySession,
  startInventory,
  checkInventoryItem,
  completeInventory,
} from './inventory.js';

export {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from './config.js';

// ==================== STATS ====================

export async function getStatsOverview() {
  const [total, available, inUse, maintenance] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.count({ where: { status: 'AVAILABLE' } }),
    prisma.asset.count({ where: { status: 'IN_USE' } }),
    prisma.asset.count({ where: { status: 'MAINTENANCE' } }),
  ]);

  const byCategory = await prisma.asset.groupBy({
    by: ['categoryId'],
    _count: { id: true },
  });

  return { total, available, inUse, maintenance, byCategory };
}
