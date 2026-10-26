# Roadmap

- [x] Fix coach floating button shape (fixed height, round icon)
- [x] Part 1: Public landing page at '/', routing split (public vs _authenticated gate), logged-in redirect, standalone-mode skip to /login
- [x] Part 2: Email/password auth — signup (names, terms checkbox, verification email + resend), login (show password, forgot link), forgot/reset password, logout via AuthContext
- [x] Part 3: /terms and /privacy draft pages, linked from landing footer and signup
- [~] Part 4: profiles table + signup trigger done (first/last name, theme, palette, timezone, terms acceptance). Still to do: settings profile section (edit name, save theme to profile, change password, delete account with DELETE confirm), first name in header
- [ ] Part 5: Cloud data + sync — tables with RLS, rewrite data layer, optimistic updates, one-time localStorage import, no sample seeding for accounts, coach requires auth
- [ ] Part 6: PWA — manifest, icons, vite-plugin-pwa (prod only, never preview), offline fallback, update toast, install banner + iOS steps + Settings install item
- [ ] Quality: mobile checks, offline/failed-save messaging, final test + build verification
