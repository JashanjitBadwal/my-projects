# Recipe Manager

A full-stack recipe manager with user accounts, recipe CRUD, search/filtering, and favorites.

- **Frontend**: React + Vite (`client/`)
- **Backend**: Express + SQLite (via `better-sqlite3`) (`server/`)
- **Auth**: JWT-based, passwords hashed with bcrypt

## Getting started

### 1. Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

The API runs on `http://localhost:4000`. SQLite database file is created automatically at `server/data/recipes.db`.

To populate the database with some sample recipes (desserts plus a few popular main dishes/appetizers), run:

```bash
npm run seed
```

This creates a demo user (`chef@example.com` / `password123`) that owns the seeded recipes.

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

The app runs on `http://localhost:5173` and proxies `/api` requests to the backend.

## Features

- Register / log in (JWT auth)
- Browse all recipes, search by title/description, filter by category
- View recipe details (ingredients, steps, prep time, author)
- Create, edit, and delete your own recipes
- Save/unsave favorites and view your favorites list
- View "My Recipes"

## API overview

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/recipes` | List recipes (supports `search`, `category`, `mine`, `favorites` query params) |
| GET | `/api/recipes/categories` | List distinct categories |
| GET | `/api/recipes/:id` | Get a single recipe |
| POST | `/api/recipes` | Create a recipe (auth required) |
| PUT | `/api/recipes/:id` | Update your recipe (auth required) |
| DELETE | `/api/recipes/:id` | Delete your recipe (auth required) |
| POST | `/api/recipes/:id/favorite` | Add to favorites (auth required) |
| DELETE | `/api/recipes/:id/favorite` | Remove from favorites (auth required) |
