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
- Mark demonstration log entries with provenance; coach summaries filter these entries, use the user's local date, and are rebuilt for every message to avoid treating seeded or stale data as personal history.
