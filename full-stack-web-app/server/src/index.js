// Entry point for the Recipe Manager API server.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import recipesRouter from './routes/recipes.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Allow the frontend (running on a different port during development) to call this API.
app.use(cors());
// Parse incoming JSON request bodies into req.body.
app.use(express.json());

// Simple health check endpoint, useful for verifying the server is up.
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Mount the auth routes (register/login) under /api/auth.
app.use('/api/auth', authRouter);
// Mount the recipe routes (CRUD + favorites) under /api/recipes.
app.use('/api/recipes', recipesRouter);

// Catch-all error handler: logs unexpected errors and returns a generic 500.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
