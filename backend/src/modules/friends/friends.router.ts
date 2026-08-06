import { Router } from "express";
import { friendsController } from "./friends.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/request", friendsController.sendRequest);
router.post("/request/:id/accept", friendsController.acceptRequest);
router.post("/request/:id/reject", friendsController.rejectRequest);
router.get("/requests", friendsController.getRequests);
router.get("/", friendsController.getFriends);

export const friendsRouter = router;
