# WPU 2026 APP – LIVE OP RENDER

Hierdie gids sit die WPU-app aanlyn sodat lede op Android en iPhone een webskakel kan gebruik.

## 1. Supabase (aanbeveel vir regte live inhoud)
1. Skep/open jou Supabase-projek.
2. Voer `setup.sql` uit in SQL Editor.
3. Skep een Admin gebruiker in Authentication.
4. Plaas daardie gebruiker se UUID in `public.admins` volgens die kommentaar onderaan `setup.sql`.
5. Maak `config.js` oop en vervang die twee waardes:
   - `supabaseUrl`
   - `supabaseAnonKey`

## 2. Toets voor jy publiseer
Maak die app via HTTPS oop nadat dit gepubliseer is. Die PWA-installasie en live cloud data werk betroubaar oor HTTPS.

## 3. Render Static Site
1. Gaan na Render en kies **New → Static Site**.
2. Koppel die GitHub repository waarin die inhoud van hierdie gids is.
3. Build command: laat leeg.
4. Publish directory: `wpu_app` (as die repository se root die buitenste gids bevat) of `.` (as jy die inhoud van `wpu_app` direk in die repository plaas).
5. Deploy.
6. Render gee vir jou 'n `onrender.com` webadres.

## 4. Android/iPhone
Open die Render-skakel op die foon.
- Android/Chrome: kies **Add to Home screen / Install app**.
- iPhone/Safari: **Share → Add to Home Screen**.

## 5. Weeklikse live bestuur
Meld by **Admin** aan en laai die wennerfoto, uitslag-PDF en byeenkomste op. Die app verfris cloud-data outomaties ongeveer elke minuut; gebruikers hoef nie 'n nuwe app te installeer vir nuwe weeklikse inhoud nie.

## PDF-fout wat reggestel is
Uitslae en jaarboek-dokumente gebruik nou 'n ingeboude PDF-venster. Plaaslike PDF data-URL's word eers na 'n Blob omgeskakel, wat verhoed dat die browser die data-URL blokkeer. Daar is ook 'n **Open in nuwe venster** opsie.
