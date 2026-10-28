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

## Project rules
- Frontend-only prototype: all data (products, cart, mock auth, quotes) lives in `src/lib/*` and localStorage; no backend yet, so swap these modules for API calls later.
- All user-facing copy goes through the `useI18n()` dictionaries in `src/lib/i18n.tsx` (EN + ES must stay in sync; ES is typed against EN).
- Shared site chrome (header, footer, cart drawer, auth dialog, WhatsApp button) is mounted once in `src/routes/__root.tsx`.
