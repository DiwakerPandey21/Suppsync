# SuppSync — AI Supplement Tracker 💊⚡

SuppSync is a premium, AI-powered progressive web app (PWA) designed to track supplements, optimize biohacking stacks, and monitor health goals. Built with Next.js, Supabase, and Tailwind CSS, it transforms basic supplement tracking into a deeply personalized health companion.

## Features (V1 - V8)
Over 60+ features shipped across 8 major iterations.

### 🎨 Premium UI & Dashboard
- **Glassmorphism Design**: Frosted glass cards with animated gradients and backdrop-blur.
- **Animated Stats**: Smooth easing counters for XP, adherence, and streaks.
- **Supplement Timeline**: Hour-by-hour scrollable timeline showing exactly when supplements were taken.
- **Consistency Heatmap**: GitHub-style adherence contribution graph.
- **Progress Ring**: Visual daily completion tracker with confetti bursts.

### 🧠 Advanced Intelligence
- **AI Chat Assistant**: Context-aware supplement coach powered by Gemini AI.
- **Smart Recommendations**: Daily actionable AI tips based on user's current stack and recent logging history.
- **Weekly AI Report**: AI-generated summary of the last 7 days of logs, scores, and adherence.
- **Interaction Matrix**: AI-powered grid analyzing pairwise supplement synergies, cautions, and warnings.
- **Supplement Comparison**: Side-by-side AI evaluation of benefits, side effects, and timing.

### 🎮 Gamification 2.0
- **XP & Leveling System**: Earn XP for logging supplements and completing challenges. Progress from Rookie to Legend.
- **Daily Challenges**: Rotating micro-goals with XP rewards.
- **Global Leaderboard**: Ranked user boards with gold, silver, and bronze highlighting.
- **Streak Freeze**: Protect streaks during rest days or travel using freeze tokens.

### 🎯 Deep Personalization
- **Goal Tracker**: Set and monitor long-term fitness, sleep, energy, and focus goals.
- **Mood & Symptom Logger**: Track daily mood and record symptoms (fatigue, brain fog, etc.) to correlate with stack changes.
- **Supplement Journal**: Add timestamped notes to individual supplements.
- **Progress Photos**: Visual transformation tracking with gallery and before/after capabilities.
- **Subjective Scoring**: Daily 1-10 scoring for energy, focus, and sleep to train the AI.

### 🛡️ Core Infrastructure
- **Full PWA Support**: Installable on Android/iOS with offline capabilities.
- **User Authentication**: Secure auth backed by Supabase.
- **Stock & Expiry Tracking**: Low-stock alerts and expiration date warnings.
- **Smartwatch Companion Tab**: Minimalist UI for Wear OS and Apple Watch browsers.
- **Real-time Notifications**: Web push capabilities.

## Tech Stack
- **Frontend**: Next.js 15+ (App Router), React, Tailwind CSS v4, Framer Motion
- **Backend / DB**: Supabase (PostgreSQL), Server Actions, RLS Policies
- **AI Engine**: Google Gemini API
- **Icons**: Lucide React

## Setup & Local Development
1. Clone the repository: `git clone https://github.com/DiwakerPandey21/Suppsync.git`
2. Install dependencies: `npm install`
3. Setup variables in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
4. Run migrations from the `supabase/` folder in your Supabase SQL editor.
5. Run the dev server: `npm run dev`
