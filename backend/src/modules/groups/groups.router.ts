import { Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";
import {
  validateBody,
  validateParams,
} from "@/middlewares/validate.middleware";
import { groupsController } from "./groups.controller";
import {
  addMemberSchema,
  createGroupSchema,
  groupIdSchema,
  memberIdSchema,
  updateGroupSchema,
  joinByCodeSchema,
  joinRequestActionSchema,
  joinRequestIdSchema,
} from "./groups.schema";

const router = Router();

router.use(authMiddleware);
router.get("/", groupsController.list);
router.post("/", validateBody(createGroupSchema), groupsController.create);

// Join by invite code (must be before /:id routes)
router.post("/join", validateBody(joinByCodeSchema), groupsController.joinByCode);

router.get("/:id", validateParams(groupIdSchema), groupsController.getById);
router.patch(
  "/:id",
  validateParams(groupIdSchema),
  validateBody(updateGroupSchema),
  groupsController.update,
);
router.delete("/:id", validateParams(groupIdSchema), groupsController.delete);
router.post(
  "/:id/members",
  validateParams(groupIdSchema),
  validateBody(addMemberSchema),
  groupsController.addMember,
);
router.delete(
  "/:id/members/:memberId",
  validateParams(memberIdSchema),
  groupsController.removeMember,
);

// Invite code
router.post(
  "/:id/invite-code",
  validateParams(groupIdSchema),
  groupsController.generateInviteCode,
);

// Join requests
router.get(
  "/:id/join-requests",
  validateParams(groupIdSchema),
  groupsController.listJoinRequests,
);
router.patch(
  "/:id/join-requests/:requestId",
  validateParams(joinRequestIdSchema),
  validateBody(joinRequestActionSchema),
  groupsController.handleJoinRequest,
);

export default router;
