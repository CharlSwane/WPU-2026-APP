WPU 2026 – LIVE DATA / MOBILE REFRESH

This version does not depend on an admin login for public refreshes.
The app fetches the latest Supabase content when a content page opens, when the PWA returns to the foreground, when the browser regains focus, and every 15 seconds while visible.
The service worker cache was bumped to v7 and only the app shell is cached; Supabase data is fetched live.

After deploying to Render, users normally see newly uploaded winners, results, events and documents within seconds.
If an installed PWA was open during deployment, closing/reopening it once may be necessary to activate the new service worker.
