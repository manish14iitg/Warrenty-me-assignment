import express from "express";
import { checkAuth, googleAuth, login, logout, signup } from "../controller/auth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/check-auth", verifyToken, checkAuth);

router.get("/google", googleAuth)

router.post("/login", login)

router.post("/signup", signup)

router.post("/logout", logout)

export default router;