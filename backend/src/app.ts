import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { env } from "./config/env";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import expertRoutes from "./modules/expert/expert.routes";
import adminRoutes from "./modules/admin/admin.routes";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";
import stocksRoutes from "./modules/stocks/stocks.routes";
import billingRoutes from "./modules/billing/billing.routes";
import { razorpayWebhook } from "./modules/billing/billing.webhook";
import sessionsRoutes from "./modules/sessions/sessions.user";
import supportRoutes from "./modules/support/support.routes";
import homeRoutes from "./modules/home/home.routes";

const app = express();
app.set("trust proxy", 1);

app.use(helmet());
app.use(
    cors({
        origin: env.FRONTEND_URL,
        credentials: true,
    })
);
app.post("/billing/webhook", express.raw({ type: "application/json" }), razorpayWebhook);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/expert", expertRoutes);
app.use("/admin", adminRoutes);
app.use("/stocks", stocksRoutes);
app.use("/billing", billingRoutes);
app.use("/sessions", sessionsRoutes);
app.use("/support", supportRoutes);
app.use("/home", homeRoutes);

// Always last: unknown routes first, then the error handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;