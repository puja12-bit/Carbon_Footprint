import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

// ─── Security: HTTP headers ───────────────────────────────────────────────────

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    // Explicitly deny cross-domain policy files (Flash/PDF)
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
  }),
);

// Additional headers not covered by helmet defaults
app.use((_req: Request, res: Response, next: NextFunction) => {
  // Limit referrer info sent to external sites
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Prevent cross-origin reads of this API's responses
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  // Isolate the browsing context to prevent cross-origin window attacks
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  // Disable unused browser features that could be abused
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  );
  next();
});

// ─── Security: CORS ───────────────────────────────────────────────────────────

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["*"];

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? (origin, callback) => {
            if (
              !origin ||
              allowedOrigins.includes("*") ||
              allowedOrigins.includes(origin)
            ) {
              callback(null, true);
            } else {
              callback(new Error("Not allowed by CORS"));
            }
          }
        : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── Security: Rate limiting ──────────────────────────────────────────────────

/** Global limiter — applied to every route. */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

/** Stricter limiter for the AI-backed estimation endpoint. */
const estimateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Estimation rate limit reached, please slow down." },
});

app.use(globalLimiter);

// ─── Logging ──────────────────────────────────────────────────────────────────

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          // Strip query strings to avoid logging sensitive params
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ─── Body parsing ─────────────────────────────────────────────────────────────

// Enforce size limits to prevent denial-of-service via large payloads
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/api/carbon/estimate", estimateLimiter);
app.use("/api", router);

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// ─── Global error handler ─────────────────────────────────────────────────────

// Must have 4 parameters for Express to treat as an error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  req.log.error({ err }, "Unhandled error");
  const status =
    (err as NodeJS.ErrnoException & { status?: number }).status ?? 500;
  res.status(status).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

export default app;
