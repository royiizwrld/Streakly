# 📈 Streakly

Streakly is a modern, responsive daily habit and routine tracker web application built to help you build habits that stick, maintain honest streaks, and adjust without judgment. Complete with a daily checklist, calendar heatmaps, flexible routines, offline-first synchronization, PWA installation support, and an AI-powered coach.

## Key Features

### Daily Checklist & Habit Management
* **Responsive Habit Tracking:** Track habits with custom icons, colors, categories, and flexible frequencies—daily, specific weekdays, or a set number of times per week.
* **One-Tap Check-Offs:** Quick check-ins with undo support, grouped by routine or category, accompanied by a daily progress ring and celebratory completion moments.
* **Streaks & Goals:** Current and longest streaks that respect your custom schedule, paired with target goals (e.g., 30 days of reading).
* **Calendar Heatmap:** A comprehensive monthly view showing your completion history, both overall and broken down per habit.

### AI Habit Coach & Smart Bulk Add
* **Smart AI Assistant:** Ask questions like "Why do I keep missing my gym days?" and receive small, practical adjustments based on your real history.
* **Secure & Private AI:** The AI coach only reads a summary of your own history when you chat with it, ensuring advice reflects your actual patterns.
* **Smart Bulk Add:** Paste your whole routine in plain words to automatically get structured habits back, ready to edit.

### Offline-First & Multi-Device Sync
* **Local Snapshot Cache:** Instant app startup with cached local data so the app opens immediately even with no internet connection.
* **Offline Mutation Outbox:** Automatically queues check-ins, notes, edits, and deletions made offline with retry counters and timestamps.
* **Auto-Sync Replay:** Seamlessly replays queued actions to the cloud database upon reconnection, keeping your history up to date across all devices.

### PWA & Mobile Installation
* **Installable App (PWA):** Install directly to your device home screen for a full-screen, native-app experience without browser bars.
* **Offline Fallback & Updates:** Built-in service worker caching for seamless offline usage, alongside friendly update notifications when a new version drops.

### Account & Privacy Controls
* **Secure Authentication:** Easy sign-up and sign-in with password reset flows and session protection.
* **Granular Account Settings:** Update your name, manage your email (royfrank028@gmail.com), view Terms and Privacy policies, and securely delete your account and all data at any time.

## Tech Stack
* **Frontend:** React, TypeScript, Vite, Tailwind CSS, Radix UI / Shadcn UI components.
* **State & Offline Sync:** React Context, Local Storage / IndexedDB Snapshot Cache, Outbox Queue.
* **PWA Support:** Service Worker, Web App Manifest, offline fallback handling.

## License
Distributed under the MIT License. See LICENSE for more information.

Contact: royfrank028@gmail.com
