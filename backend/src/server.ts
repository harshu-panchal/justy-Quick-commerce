import express, { Application, Request, Response } from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { ensureDefaultAdmin } from "./utils/ensureDefaultAdmin";
import { seedHeaderCategories } from "./utils/seedHeaderCategories";
import { initializeSocket } from "./socket/socketService";
import { initializeFirebaseAdmin } from "./services/firebaseAdmin";
import { handleRazorpayWebhook } from "./webhooks/razorpayWebhookHandler";
import cron from "node-cron";
import { syncRazorpaySubscriptionsOnce } from "./cron/razorpaySubscriptionSync";
import { syncRazorpayCustomerSubscriptionsOnce } from "./cron/razorpayCustomerSubscriptionSync";
import { syncRazorpayDeliverySubscriptionsOnce } from "./cron/razorpayDeliverySubscriptionSync";
import SpinAttempt from "./models/SpinAttempt";

/** Drop any unique indexes on SpinAttempt that should NOT be unique */
async function fixSpinAttemptIndexes() {
  try {
    const col = SpinAttempt.collection;
    const indexes = await col.indexes();
    for (const idx of indexes) {
      if (idx.name === "_id_") continue; // never drop _id
      if (idx.unique) {
        console.log(`[SpinAttempt] Dropping incorrect unique index: ${idx.name}`);
        await col.dropIndex(idx.name as string);
      }
    }
    // Ensure correct (non-unique) indexes exist
    await col.createIndex({ campaignId: 1, userType: 1, userId: 1, createdAt: -1 });
    await col.createIndex({ campaignId: 1, createdAt: -1 });
    console.log("[SpinAttempt] Indexes verified.");
  } catch (e: any) {
    console.warn("[SpinAttempt] Index fix warning:", e?.message || e);
  }
}


// Load environment variables
dotenv.config();

const app: Application = express();
const httpServer = createServer(app);

// Simple CORS configuration - Standard and reliable
const allowedOrigins = [
  "https://www.dhakadsnazzy.com",
  "https://dhakadsnazzy.com",
  // Add more origins from environment variable if needed
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",").map(url => url.trim()) : [])
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // In development, allow localhost
    if (process.env.NODE_ENV !== "production") {
      if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
        return callback(null, true);
      }
    }

    // Normalize origin (remove trailing slash)
    const normalizedOrigin = origin.replace(/\/$/, '');

    // Check if origin is in allowed list (exact match or normalized)
    const isAllowed = allowedOrigins.some(allowed => {
      const normalizedAllowed = allowed.replace(/\/$/, '');
      return origin === allowed || normalizedOrigin === normalizedAllowed || origin === normalizedAllowed || normalizedOrigin === allowed;
    });

    if (isAllowed) {
      return callback(null, true);
    }

    // Reject if not allowed - return false instead of error for better handling
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  exposedHeaders: ["Content-Length", "Content-Type"],
  maxAge: 86400,
};

// Apply CORS middleware - This handles everything including preflight
app.use(cors(corsOptions));

// Razorpay webhook must use raw body for signature verification.
// Register BEFORE express.json().
const razorpayWebhookMiddleware = [
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    try {
      const signature = String(req.headers["x-razorpay-signature"] || "");
      const rawBody = req.body as Buffer;
      console.log(`[${new Date().toISOString()}] POST ${req.path} (razorpay webhook)`);
      const result = await handleRazorpayWebhook({ rawBody, signature });
      // Always 200 to stop retries once signature is valid; 400 only when invalid.
      if (!result.ok) {
        return res.status(400).json({ success: false, message: result.message });
      }
      return res.status(200).json({ success: true, message: result.message });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e?.message || "Webhook error" });
    }
  },
];

// Keep both paths so you can use either URL in Razorpay dashboard
app.post("/api/v1/jasti-razorpay-webhooks", ...razorpayWebhookMiddleware);
app.post("/api/v1/webhooks/razorpay", ...razorpayWebhookMiddleware);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Socket.io
const io = initializeSocket(httpServer);
app.set("io", io);

// Routes
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "dhakadsnazzy API Server is running!",
    version: "1.0.0",
    socketIO: "Listening for WebSocket connections",
  });
});

// Debug middleware - log all incoming requests
app.use((req: Request, _res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use("/api/v1", routes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let lastRazorpaySubCronRunAt: Date | null = null;
let lastRazorpaySubCronStats: { checked: number; updated: number; errors: number } | null = null;
let lastRazorpaySubCronError: string | null = null;

async function startServer() {
  // Connect DB then ensure default admin exists
  await connectDB();
  await fixSpinAttemptIndexes();
  await ensureDefaultAdmin();
  await seedHeaderCategories();

  // Initialize Firebase Admin SDK for push notifications
  initializeFirebaseAdmin();

  // Cron: periodic Razorpay subscription sync (backup for missed webhooks)
  // Every 1 minute so seller subscription activates quickly.
  cron.schedule("*/1 * * * *", async () => {
    try {
      const stats = await syncRazorpaySubscriptionsOnce({ limit: 50 });
      lastRazorpaySubCronRunAt = new Date();
      lastRazorpaySubCronStats = stats;
      lastRazorpaySubCronError = null;
      console.log(
        `[${lastRazorpaySubCronRunAt.toISOString()}] cron razorpay-subscriptions: checked=${stats.checked} updated=${stats.updated} errors=${stats.errors}`
      );
    } catch (e: any) {
      lastRazorpaySubCronRunAt = new Date();
      lastRazorpaySubCronError = e?.message || String(e);
    }
  });

  // Cron: customer subscription sync
  cron.schedule("*/1 * * * *", async () => {
    try {
      const stats = await syncRazorpayCustomerSubscriptionsOnce({ limit: 50 });
      console.log(
        `[${new Date().toISOString()}] cron razorpay-customer-subscriptions: checked=${stats.checked} updated=${stats.updated} errors=${stats.errors}`
      );
    } catch {
      // ignore
    }
  });

  // Cron: delivery subscription sync
  cron.schedule("*/1 * * * *", async () => {
    try {
      const stats = await syncRazorpayDeliverySubscriptionsOnce({ limit: 50 });
      console.log(
        `[${new Date().toISOString()}] cron razorpay-delivery-subscriptions: checked=${stats.checked} updated=${stats.updated} errors=${stats.errors}`
      );
    } catch {
      // ignore
    }
  });

  // Handle server errors gracefully (e.g., port already in use)
  httpServer.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n\x1b[31m✗ Port ${PORT} is already in use!\x1b[0m`);
      console.error(`\x1b[33m  → Another instance of the server may be running.\x1b[0m`);
      console.error(`\x1b[33m  → Run: taskkill /f /im node.exe (Windows) or killall node (Mac/Linux)\x1b[0m`);
      console.error(`\x1b[33m  → Or change PORT in .env file\x1b[0m\n`);
      process.exit(1);
    } else {
      console.error('\n\x1b[31m✗ Server error:\x1b[0m', error);
      process.exit(1);
    }
  });

  httpServer.listen(PORT, () => {
    console.log("\n\x1b[32m✓\x1b[0m \x1b[1mdhakadsnazzy Server Started\x1b[0m");
    console.log(`   \x1b[36mPort:\x1b[0m http://localhost:${PORT}`);
    console.log(
      `   \x1b[36mEnvironment:\x1b[0m ${process.env.NODE_ENV || "development"}`
    );
    console.log(`   \x1b[36mSocket.IO:\x1b[0m ✓ Ready for connections\n`);
  });
}

startServer().catch((err) => {
  console.error("\n\x1b[31m✗ Failed to start server\x1b[0m");
  console.error(err);
  process.exit(1);
});

// Cron health endpoint (debug)
app.get("/api/v1/health/razorpay-subscription-cron", (_req: Request, res: Response) => {
  res.json({
    success: true,
    lastRunAt: lastRazorpaySubCronRunAt ? lastRazorpaySubCronRunAt.toISOString() : null,
    lastStats: lastRazorpaySubCronStats,
    lastError: lastRazorpaySubCronError,
  });
});


// Trigger nodemon restart
