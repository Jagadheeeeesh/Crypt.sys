# Database Setup Guide for Production (Vercel)

Your Vercel deployment currently uses an **in-memory SQLite database**. 
This is why authentication fails:
1. When you Register, the user is saved to a temporary memory storage.
2. When the request finishes (or the server sleeps), that memory is wiped.
3. When you try to Login, the database is empty again, so the user "does not exist".

To fix this **permanently**, you must use a persistent cloud database like **Neon (PostgreSQL)**.

## Step 1: Get a Free PostgreSQL Database

1. Go to [Neon.tech](https://neon.tech) (or Supabase, Render, etc.).
2. Sign up and create a new Project (e.g., `sentinelnet`).
3. Copy the **Connection String** (Postgres URL).  
   It usually looks like: `postgres://user:password@ep-something.aws.neon.tech/neondb?sslmode=require`

## Step 2: Configure Vercel

1. Go to your **Vercel Dashboard**.
2. Select your `SentinelNet` project.
3. Go to **Settings** > **Environment Variables**.
4. Add a new variable:
   - **Key**: `DATABASE_URL`
   - **Value**: (Paste your connection string from Step 1)
   - *Important*: If the URL starts with `postgres://`, our code automatically handles it, but standard is `postgresql://`.
5. Click **Save**.

## Step 3: Redeploy

1. Go to **Deployments** tab in Vercel.
2. Click the three dots on the latest deployment -> **Redeploy**.
3. Once active, your app will automatically connect to the real database.
4. Tables will be created automatically on the first run.

## Troubleshooting

- If you see "Server Error", check the Vercel Function Logs.
- Use `/api/health` endpoint to check if the database is connected.
