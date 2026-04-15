import express, { Request, Response } from "express";
import Role from "../models/Role";
import { authenticate, authorize } from "../middleware/auth";
import { ALL_PERMISSIONS } from "../constants/permissions";

const router = express.Router();

/**
 * @route GET /api/v1/admin/roles/permissions
 * @desc Get all available permissions
 * @access Private/Admin
 */
router.get("/permissions", authenticate, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: ALL_PERMISSIONS,
  });
});

/**
 * @route GET /api/v1/admin/roles
 * @desc Get all roles with pagination
 * @access Private/Admin
 */
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const total = await Role.countDocuments({
      name: { $nin: ["Super Admin", "Admin"] },
    });
    const roles = await Role.find({
      name: { $nin: ["Super Admin", "Admin"] },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: roles,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
});

/**
 * @route POST /api/v1/admin/roles
 * @desc Create a new role
 * @access Private/Admin
 */
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { name, description, permissions } = req.body;

    // Check if role name already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: "Role name already exists",
      });
    }

    const role = await Role.create({
      name,
      description,
      permissions,
      type: "Custom",
    });

    return res.status(201).json({
      success: true,
      data: role,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
});

/**
 * @route PUT /api/v1/admin/roles/:id
 * @desc Update a role
 * @access Private/Admin
 */
router.put("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { name, description, permissions } = req.body;
    const roleId = req.params.id;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    if (role.type === "System") {
      return res.status(400).json({
        success: false,
        message: "System roles cannot be modified",
      });
    }

    role.name = name || role.name;
    role.description = description || role.description;
    role.permissions = permissions || role.permissions;

    await role.save();

    return res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
});

/**
 * @route DELETE /api/v1/admin/roles/:id
 * @desc Delete a role
 * @access Private/Admin
 */
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const roleId = req.params.id;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    if (role.type === "System") {
      return res.status(400).json({
        success: false,
        message: "System roles cannot be deleted",
      });
    }

    await role.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
});

export default router;
