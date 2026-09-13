# Kuro Shelf

Kuro Shelf is a backend-driven anime and manga discovery, tracking, and community platform.
It uses Supabase (PostgreSQL + Auth) for secure data storage and automated catalog synchronization from Jikan.

## Setup Instructions

### 1. Connect Supabase
1. Create a project at [Supabase](https://supabase.com).
2. Go to **Project Settings > API** to find your keys.
3. In this AI Studio project, open the **Settings** menu and add the following Environment Variables:
   - \`VITE_SUPABASE_URL\`: Your Supabase Project URL.
   - \`VITE_SUPABASE_ANON_KEY\`: Your Supabase public 'anon' key.
   - \`SUPABASE_SERVICE_ROLE_KEY\`: Your Supabase secret 'service_role' key (Required for the backend ingestion worker).

### 2. Run Database Migrations
1. In your Supabase dashboard, go to the **SQL Editor**.
2. Copy the contents of \`supabase/migrations/0000_init.sql\` from this repository.
3. Paste the SQL and click **Run**. This provisions all required tables, indexes, and Row Level Security (RLS) policies.

### 3. Configure Google OAuth
1. In Google Cloud Console, create OAuth 2.0 Client credentials.
2. Add your Supabase project's callback URL (e.g., \`https://<project>.supabase.co/auth/v1/callback\`).
3. In Supabase Dashboard, go to **Authentication > Providers > Google**.
4. Enable Google and enter your Google Client ID and Client Secret.

### 4. Run the Catalog Importer
The backend contains an automated ingestion service.
1. The service automatically runs periodically via the Express server's internal cron job (\`server.ts\`).
2. Alternatively, you can trigger a manual sync via the frontend Admin Monitor.

### 5. Run & Inspect Sync Jobs
1. Sign in to Kuro Shelf.
2. Navigate to the **Admin** tab.
3. Use the "Sync Airing" or "Sync Popular" buttons to trigger a job.
4. View the job history table to monitor ingestion records, failures, and execution times.

### 6. Verify Authentication & DB Connectivity
1. Open the preview app.
2. Click **Sign In** and authenticate using Email or Google OAuth.
3. Click "Add to Shelf" on an anime. If the UI updates and the data persists across reloads, Supabase is correctly connected.
