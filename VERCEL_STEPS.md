# Production Launch Guide: Vercel + Vinetelligence

To launch **Vinetelligence** to production on Vercel while sharing the same database as **Vinea**, follow these steps.

## 1. Vercel Configuration
Ensure your `vercel.json` is configured to handle both the Vite frontend and the Express backend.

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "server.ts",
      "use": "@vercel/node"
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "server.ts"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 2. Environment Variables
You must set the following environment variables in your **Vercel Project Settings > Environment Variables**. 
Use the **EXACT SAME VALUES** as your Vinea project to share the database and services.

### App Target Isolation Variable (CRITICAL)
This variable isolates the build target so that the corresponding application is rendered cleanly:
- **For the `vinetelligence` Vercel project:** Set `VITE_APP_TARGET` = `vinetelligence`
- **For the `vinea-ai` Vercel project:** Set `VITE_APP_TARGET` = `vinea`

| Variable Name | Description |
| :--- | :--- |
| `VITE_APP_TARGET` | Set to `vinetelligence` or `vinea` to isolate the active application project |
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Anonymous Key |
| `SUPABASE_SERVICE_ROLE_KEY` | **CRITICAL:** Service role key for admin ops (Purge/Auth) |
| `STRIPE_SECRET_KEY` | Stripe Secret Key for payments |
| `RESEND_API_KEY` | Resend API Key for neural mail |
| `GEMINI_API_KEY` | Google Gemini API Key |
| `NODE_ENV` | set to `production` |

## 3. Database Migration
Since you are using the same database as Vinea, ensure the existing tables in Supabase are compatible with the Vinetelligence schema. 
- Review `SUPABASE_SETUP.sql` for any new table requirements (e.g., `restaurants`, `bookings`, `campaigns`) that might not exist in the basic Vinea setup.
- Run the SQL script in your Supabase SQL Editor if needed (it uses `IF NOT EXISTS` to be safe).

## 4. Domain Setup
- Add `vinetelligence.live` in the Vercel Dashboard under **Settings > Domains**.
- Update your DNS records as provided by Vercel.

## 5. Deployment
Push your code to a GitHub repository and connect it to Vercel. Vercel will automatically detect the `vercel.json` and build the project.
