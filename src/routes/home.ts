import { Router } from "express";
import { getHomePage } from "../controllers/roomsControllers.js";

const router = Router();

router.get("/", getHomePage);

export default router;
