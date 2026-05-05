import { Router } from "express";
import multer from "multer";
import {
  createUser,
  getUsers,
  getUserDirectory,
  getUser,
  updateUser,
  archiveUser,
  deleteUser,
  updateProfile,
  updateAvatar,
  getPendingUsers,
  resetUserPassword,
} from "../controllers/users.controller.js";
import {
  authenticate,
  requireRole,
  requireModuleAccess,
} from "../middlewares/auth.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(authenticate);

// Profile routes (any authenticated user)
router.patch("/profile", updateProfile as any);
router.patch("/avatar", upload.single("avatar"), updateAvatar as any);
router.get(
  "/directory",
  requireModuleAccess("COMMUNICATION", "VIEW"),
  getUserDirectory as any,
);

// Admin routes
router.post("/", requireRole("ADMIN"), createUser as any);
router.get("/", requireRole("ADMIN"), getUsers as any);
router.get("/pending", requireRole("ADMIN"), getPendingUsers as any);
router.get("/:id", requireRole("ADMIN"), getUser as any);
router.patch("/:id", requireRole("ADMIN"), updateUser as any);
router.post(
  "/:id/reset-password",
  requireRole("ADMIN"),
  resetUserPassword as any,
);
router.delete("/:id/permanent", requireRole("ADMIN"), deleteUser as any);
router.delete("/:id", requireRole("ADMIN"), archiveUser as any);

export default router;
