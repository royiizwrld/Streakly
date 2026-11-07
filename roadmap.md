# Roadmap

- [x] Fix coach floating button shape (fixed height, round icon)
- [x] Part 1: Public landing page at '/', routing split (public vs _authenticated gate), logged-in redirect, standalone-mode skip to /login
- [x] Part 2: Email/password auth — signup (names, terms checkbox, verification email + resend), login (show password, forgot link), forgot/reset password, logout via AuthContext
- [x] Part 3: /terms and /privacy draft pages, linked from landing footer and signup
- [x] Part 4: Settings profile (name edit, password change, theme/palette saved to profile, terms/privacy links, logout, delete account with DELETE confirm), first name in header and Today
- [x] Part 5: Cloud tables with RLS (verified cross-account), optimistic sync with retry, one-time device import, no sample seeding, coach/bulk add/voice require sign-in and coach reads only the user's stored data in their time zone
- [x] Part 6: Manifest + placeholder icons, guarded service worker (production only, static assets only), offline page, update toast, install banner + iOS steps, Settings install item
- [x] Quality: tests, type check, signed-in end-to-end check (import, check-in persistence, theme across devices, coach, account deletion)
