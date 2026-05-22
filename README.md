# make a*wish* 🎂

A premium, modern birthday-wishing social application built with **Next.js 14/15 (App Router)** and **Supabase**. Discover birthday twins, build wishing streaks, write anonymous or authenticated wishes on public wish walls, and track countdowns to your favorite people's birthdays.

Designed with elegant typography (Fraunces & Outfit), glassmorphism styling, and custom zodiac reveals.

---

## ✨ Features

- **🎂 Live Birthday Feed**: Browse active birthdays for Today, Tomorrow, and This Week.
- **✨ Micro-Interactive Onboarding**: A gorgeous chat-bubble flow that guides new users through setting up their name, city, birth date, and personality vibe.
- **♈ Animated Zodiac Cards**: Automatically reveals the user's zodiac sign, elemental category, dates, key trait, and a fun celestial fact.
- **✉️ Dynamic Wish Wall**: Send anonymous or authenticated wishes. Recipients can "love" wishes and reply directly.
- **🔥 Streaks & Stats**: Track your birthday-wishing streak and see stats (Wishes Sent, Wishes Received, Twins Found).
- **♊ Birthday Twins**: Automatically matches you with users sharing the same birth month and day!
- **🔒 Secure Architecture**: Robust Supabase Row-Level Security (RLS) policies protecting user profiles and inbox interactions.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, dynamic page SSR & Route Handlers)
- **Styling**: Vanilla CSS Modules (harmonious coral, cream, and deep slate theme, premium glassmorphism)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Client-side & Server-side SSR helper clients)
- **Auth Flow**: Secure Email + Password credentials (login is entirely optional to browse and send wishes)
- **Realtime**: PostgreSQL Replication for live wish-wall updates

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
cd borntoday
npm install
```

### 2. Set Up Supabase Database

1. Create a new project on [Supabase Console](https://supabase.com/).
2. Navigate to **SQL Editor** -> **New query**.
3. Copy the contents of [`supabase/schema.sql`](file:///c:/Users/ayush/OneDrive/Desktop/Birthday%20Directory/borntoday/supabase/schema.sql) and paste them into the SQL editor.
4. Click **Run** to set up tables, indexes, views, and RLS policies.

*(Optional)* If you want real-time updates when someone sends a wish, go to **Database -> Replication** in the Supabase Dashboard, and enable the `wishes` and `replies` tables for the `supabase_realtime` publication.

### 3. Configure Environment Variables

Create a file named `.env.local` in the project root (you can copy `.env.local.example`):

```env
# Project URL & Public Key (Found in Supabase -> Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here

# Site URL (Used for auth redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```text
borntoday/
├── public/                 # Static assets (fonts, icons)
├── supabase/
│   └── schema.sql          # Database tables, policies, views & functions
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── api/            # API Route Handlers (users, wishes, replies)
│   │   ├── auth/           # Auth redirect callback handler
│   │   ├── feed/           # Main birthday feed
│   │   ├── join/           # Interactive onboarding chat
│   │   ├── login/          # Custom tabbed Sign In / Sign Up page
│   │   ├── me/             # User's personal dashboard (Inbox, Twins, Stats)
│   │   ├── u/[slug]/       # Public wish wall pages
│   │   ├── globals.css     # Global theme tokens, typography, and utility classes
│   │   └── layout.tsx      # Root layout & Google Fonts integration
│   ├── components/         # Premium modular UI components (ZodiacCard, OnboardingChat, etc.)
│   ├── lib/                # Utility helpers (zodiac calculator, dates, supabase engines)
│   └── types/              # Unified TypeScript definitions (User, Wish, Reply)
```

---

## 🎨 Visual Design System

`makeawish` uses a highly tailored design language:
- **Serif Typography**: `Fraunces` for headings, adding a warm, human, editorial aesthetic.
- **Sans-Serif Typography**: `Outfit` for clean, readable body copy and metrics.
- **Harmonious Palette**:
  - Deep warm charcoal (`#1e1c1b`) and soft warm off-black background.
  - Creamy overlays (`rgba(255, 255, 255, 0.05)`) with backdrop-blur.
  - Vibrant coral accents (`#ff6e54` / `#ff846f`) for primary actions and wishes.
  - Pure golden accents (`#ffd700`) for celebratory elements and stars.
