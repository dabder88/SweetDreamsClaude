# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PsyDream** is a React + TypeScript web application for psychological dream analysis using Google's Gemini AI. The app allows users to describe their dreams, provide context, select a psychological analysis method (Jungian, Freudian, Gestalt, Cognitive, Existential, or Auto), and receive AI-generated interpretations with symbolism analysis and visualization.

## Development Commands

### Local Development
```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
```

### Environment Setup
Create `.env` file in root with:
```
# Gemini API Key
VITE_API_KEY=your_gemini_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Critical:**
- API keys MUST have `VITE_` prefix for Vite to expose them to the client
- Get Gemini keys from [Google AI Studio](https://ai.studio)
- Get Supabase credentials from [Supabase Dashboard](https://app.supabase.com)

## Architecture & Data Flow

### View System
The app uses a view-based routing system (no router library) controlled by `AppView` type:
- `landing` → Landing page with app introduction
- `auth` → **NEW:** Login/registration page (Supabase authentication)
- `wizard` → 4-step dream analysis wizard (description → context → method → results)
- `dashboard` → User cabinet with recent dreams and quick actions (protected)
- `journal` → Dream history with search/filter (protected)
- `analytics` → Dream statistics and trends (protected)
- `settings` → User preferences (protected)
- `archetypes` → Placeholder for future feature (protected)

Navigation is handled via `navigateTo(view: AppView)` function in [App.tsx](App.tsx).

**Protected Routes:** If Supabase is configured, dashboard/journal/analytics/settings/archetypes require authentication. Unauthenticated users are redirected to the `auth` view.

### Dream Analysis Flow

1. **User Input (Steps 1-3):**
   - Step 1: Dream description text
   - Step 2: Emotional/life context (8 fields: emotion, life situation, associations, recurring flag, day residue, character types, dream role, physical sensations)
   - Step 3: Method selection (PsychMethod enum)

2. **AI Analysis ([geminiService.ts](services/geminiService.ts)):**
   - **Two-stage process:**
     - Stage 1: Single request for summary, main analysis, advice, questions, and symbol names (uses `gemini-2.5-flash`)
     - Stage 2: Parallel requests for each symbol's detailed meaning (3-5 concurrent calls)
   - Uses structured JSON output with schema validation
   - Includes robust JSON parsing with auto-repair for truncated responses

3. **Storage (Hybrid System):**
   - **Primary:** [supabaseStorageService.ts](services/supabaseStorageService.ts) - Cloud storage with Supabase
     - Stores dream entries in `dream_entries` table
     - Each entry includes: id, user_id, timestamp, dreamData, analysis, optional imageUrl, optional notes
     - Protected by Row Level Security (RLS) - users can only access their own data
   - **Fallback:** [storageService.ts](services/storageService.ts) - localStorage (if Supabase not configured)
     - All dream entries saved to `localStorage` under key `mindscape_journal_v1`
     - Automatic migration to Supabase on first login

### Image Generation

Function `visualizeDream()` uses `gemini-2.0-flash-exp` model with `generateContent()` (not the restricted `imagen-3.0` API). Returns base64 data URL from `inlineData` response part.

### Key Technical Patterns

**API Key Retrieval:**
The `getApiKey()` function in [geminiService.ts](services/geminiService.ts:7-27) has multi-fallback logic:
1. Try `import.meta.env.VITE_API_KEY` (Vite standard)
2. Fall back to `process.env.VITE_API_KEY` or `process.env.API_KEY` (legacy/server)
3. Return empty string if both fail

This prevents crashes in different runtime environments (Vite dev, Vercel production, Node).

**Error Handling:**
- API key validation happens inside functions (not at module level) to avoid initialization errors
- JSON parsing includes repair logic for unclosed quotes/brackets (common with AI truncation)
- All AI calls wrapped in try-catch with user-friendly error messages

**State Management:**
No Redux/Zustand. All state in App.tsx via `useState`:
- `view` (current page)
- `step` (wizard progress, 1-4)
- `dreamData` (user's dream input)
- `mobileMenuOpen` (sidebar toggle)
- `user` (authenticated user object, null if not logged in)
- `authLoading` (loading state during authentication check)

**Authentication Flow:**
1. On app mount, check for existing Supabase session
2. Subscribe to auth state changes (login/logout)
3. Auto-migrate localStorage entries to Supabase on first login
4. Protect private routes (redirect to auth if not logged in)

## Important File Locations

- **Main App Logic:** [App.tsx](App.tsx) - routing, layout switching, state management, authentication
- **AI Service:** [services/geminiService.ts](services/geminiService.ts) - Gemini API integration
- **Storage Services:**
  - [services/supabaseStorageService.ts](services/supabaseStorageService.ts) - Supabase database CRUD operations
  - [services/storageService.ts](services/storageService.ts) - localStorage fallback
- **Authentication:**
  - [services/supabaseClient.ts](services/supabaseClient.ts) - Supabase client initialization
  - [services/authService.ts](services/authService.ts) - Authentication functions (signUp, signIn, signOut, etc.)
- **Type Definitions:** [types.ts](types.ts) - all interfaces and enums (includes User, updated JournalEntry)
- **Method Metadata:** [constants.ts](constants.ts) - UI data for psychological methods
- **UI Components:**
  - [components/](components/) - individual React components
  - [components/Auth.tsx](components/Auth.tsx) - Login/registration forms
  - [components/Sidebar.tsx](components/Sidebar.tsx) - Navigation with user info and logout
- **Prompt Templates:** [prompts/](prompts/) - markdown files with method-specific prompts (currently unused)

## Deployment (Vercel)

1. Import GitHub repo to Vercel
2. Framework: **Vite**
3. Environment Variables:
   - `VITE_API_KEY` = your Gemini key
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon/public key
4. Auto-deploy on push to main branch

**Security Note:** Gemini API key is exposed on client side (acceptable for personal/prototype use). Supabase uses Row Level Security (RLS) to protect user data - anon key is safe to expose.

## Known Limitations

- Model rate limits: `gemini-2.5-flash` has 15 RPM free tier limit
- Image generation availability depends on Gemini model access (some regions restricted)
- Russian language only (hardcoded in prompts and UI)
- Email verification required for Supabase sign-ups (configurable in Supabase dashboard)

## Common Development Patterns

### Adding a New Psychological Method

1. Add enum value to `PsychMethod` in [types.ts](types.ts:2-9)
2. Add method metadata to `PSYCH_METHODS` array in [constants.ts](constants.ts:4-59)
3. Add switch case in `analyzeDream()` in [geminiService.ts](services/geminiService.ts:89-111)

### Adding a New View

1. Add view name to `AppView` type in [types.ts](types.ts:57)
2. Create component in [components/](components/)
3. Add route case in `renderCabinetLayout()` or create new layout in [App.tsx](App.tsx)
4. Add navigation button in [Sidebar.tsx](components/Sidebar.tsx) or other nav component
5. If view should be protected, add it to `privateViews` array in `navigateTo()` function

## Supabase Database Setup

To enable multi-user authentication and cloud storage, set up Supabase:

### 1. Create Supabase Project

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Copy `Project URL` and `anon public` key to `.env` file

### 2. Run SQL Schema

Execute this SQL in Supabase SQL Editor to create the database schema:

```sql
-- Table for dream entries
CREATE TABLE dream_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp BIGINT NOT NULL,
  dream_data JSONB NOT NULL,
  analysis JSONB,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE dream_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own dreams
CREATE POLICY "Users can view own dreams"
  ON dream_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dreams"
  ON dream_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dreams"
  ON dream_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dreams"
  ON dream_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_dream_entries_user_id ON dream_entries(user_id);
CREATE INDEX idx_dream_entries_timestamp ON dream_entries(timestamp DESC);
```

### 3. Configure Authentication

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Enable **Email** provider (enabled by default)
3. Optional: Configure email templates for better UX
4. Optional: Enable OAuth providers (Google, GitHub, etc.)

### 4. Email Settings (Optional)

By default, Supabase sends confirmation emails. To customize:
- Go to **Authentication** → **Email Templates**
- Edit confirmation, password reset, and magic link templates
- Or disable email confirmation in **Authentication** → **Settings** for development

### 5. Test Authentication

1. Start the app: `npm run dev`
2. Navigate to login/registration page
3. Create a test account
4. Verify email (check spam folder if needed)
5. Login and test dream creation
6. Check Supabase dashboard → **Table Editor** → `dream_entries` to see stored data

### Migration from localStorage

The app automatically migrates localStorage entries to Supabase on first login:
- Existing dreams in `localStorage` are uploaded to user's cloud account
- Migration happens once per user (checks if user already has cloud entries)
- Original localStorage data remains intact as backup