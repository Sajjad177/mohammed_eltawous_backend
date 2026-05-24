// import csurf from 'csurf';
// app.use(csurf({ cookie: true }));

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import xssClean from 'xss-clean';
import logger from './core/config/logger.js';
import appRouter from './core/app/appRouter.js';
import { globalErrorHandler } from './core/middlewares/globalErrorHandler.js';
import notFound from './core/middlewares/notFound.js';
import { globalLimiter } from './lib/limit.js';
import passport from 'passport';
import expressSession from 'express-session';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  expressSession({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Set up security middleware
app.use(helmet());
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://mohamedeltawous-website.vercel.app',
  'http://secondsight.tech',
  'https://secondsight.tech',
  'https://www.secondsight.tech'
];

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Instead of throwing an error, deny the request gracefully
    logger.warn(`CORS blocked for origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // important for preflight
app.use(xssClean());
app.use(mongoSanitize());

// Set up logging middleware
app.use(morgan('combined'));

// Set up body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Set up rate limiting middleware
app.use(globalLimiter);

// Set up static files middleware
const uploadPath = path.resolve(__dirname, '../uploads');
const publicPath = path.resolve(__dirname, 'public');
app.use('/uploads', express.static(uploadPath));
app.use(express.static(publicPath));

// Set up API routes
app.use('/api/v1', appRouter);

// Dev-only debug endpoints: use these to verify console.log output in your terminal.
// Remove or protect in production.
app.post('/__debug/echo', (req, res) => {
  try {
    console.log('DEBUG POST /__debug/echo body:', JSON.stringify(req.body));
  } catch (e) {
    console.log('DEBUG POST /__debug/echo body (raw):', req.body);
  }
  res.json({ success: true, body: req.body });
});

app.get('/__debug/echo', (req, res) => {
  console.log('DEBUG GET /__debug/echo query:', req.query);
  res.json({ success: true, query: req.query });
});

// Set up 404 error middleware
app.use(notFound);

// Set up error handling middleware
app.use(globalErrorHandler);

logger.info('Middleware stack initialized');

// Initialize payment check cron job (runs every 5 seconds)
// initPaymentCheckCron();

export { app };
