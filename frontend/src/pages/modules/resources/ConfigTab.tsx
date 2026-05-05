import { motion } from 'framer-motion';
import { CategoryLocationManager } from '@/components/assets/CategoryLocationManager';
import { tabVariants } from './constants';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConfigTabProps {
  canAdminAssets: boolean;
  canAdminPurchases: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ConfigTab({ canAdminAssets, canAdminPurchases }: ConfigTabProps) {
  if (!canAdminAssets && !canAdminPurchases) return null;

  return (
    <motion.div
      key="config"
      variants={tabVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.2 }}
    >
      <CategoryLocationManager />
    </motion.div>
  );
}
