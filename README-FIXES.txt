WPU 2026 APP – FIXES

1. PDF results now open directly in a new browser/PDF viewer instead of relying only on an embedded iframe. A second "Open direk" button is also shown.
2. Events now support a main/cover photo plus multiple additional photos. Users can open an event and view the full photo gallery.
3. Events, winners, results and documents can be edited or deleted from Admin.
4. Google Maps links pasted into the event description are detected and shown as a clickable "Maak kaart oop" link. Google Maps iframe/embed HTML is also handled safely.
5. Winner photos use contain/center so the full winner image stays inside its card without being badly cropped.
6. Service-worker cache version was increased so deployed users receive the new files.
7. The app remains a PWA and can be installed on Android and iPhone once deployed on HTTPS.

IMPORTANT FOR LIVE USE
- Configure Supabase in config.js with the real project URL and anon key.
- Run setup.sql in Supabase.
- Create the admin Auth user and add the UUID to public.admins as described in setup.sql.
- Deploy the wpu_app folder to an HTTPS host such as Render/Netlify/Cloudflare Pages/Vercel.
- Users then open the HTTPS app address and install it from their phone browser.
