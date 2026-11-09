<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Browser persistence must use the guarded storage helpers so restricted storage cannot disable interaction.
- Pre-optimize dependencies from every route and the Start entry to avoid client chunk invalidation during hydration.
- Load heavy, on-demand features (AI coach chat, markdown renderer) lazily, never from the always-mounted app shell, so every page stays fast to become interactive in the preview.
- Store goals in the existing habit data context and derive progress from logs so edits and undo stay consistent without separate counters.
- Goal completion controls write to the linked habit log, replacing demonstration entries with personal check-ins so all views stay synchronized.
- Coach conversations use guarded browser storage with route-derived thread IDs and lazily mounted chat windows to retain history without slowing the app shell.
- Voice typing records complete WAV audio and streams transcription through a server route; dictated text stays in the composer until explicitly sent.
- Mark demonstration log entries with provenance; coach summaries filter these entries, use the user's local date, and are rebuilt for every message to avoid treating seeded or stale data as personal history.
- Habit data is offline-first: a per-user local cache opens the app instantly, edits become ordered idempotent outbox items persisted locally, and the outbox replays sequentially on reconnect (permanent errors dropped with a notice) before the cloud copy refreshes the cache, so no change is lost offline.
- App API routes verify the caller's bearer token and query as that user, so row-level security limits every AI request to the caller's own data.
- The service worker is registered only from the guarded PWA wrapper (production, non-preview, non-iframe) and precaches static assets, caches pages network-first for offline app-shell loads, and never caches API, auth or database calls.
