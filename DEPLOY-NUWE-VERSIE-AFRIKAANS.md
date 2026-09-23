# WPU 2026 – NUWE LIVE WEERGAWE

## BELANGRIKSTE FIX
Die vorige weergawe het 'n stuk CSS per ongeluk NA `</html>` gehad. Dit het veroorsaak dat die bronkode onder aan die webblad as gewone teks gewys word. Hierdie weergawe het daardie CSS teruggeskuif binne die `<style>`-blok.

Die Supabase RLS-fix gebruik die WPU admin Auth UUID:
`11bd15b4-711a-4d04-8307-4c8c01202eb8`

## 1. SUPABASE – DOEN EERSTE
1. Maak jou Supabase-projek oop.
2. Gaan na **SQL Editor**.
3. Open `RLS-FIX.sql` uit hierdie pakket.
4. Kopieer die HELE inhoud.
5. Plak dit in SQL Editor.
6. Klik **Run**.
7. Onder die resultate moet die admin UUID en die gebruiker se e-pos/ID verskyn.
8. As jy 'does not exist in auth.users' kry, is die UUID verkeerd of die Auth-gebruiker is nog nie geskep nie. Moenie voortgaan voordat daardie gebruiker bestaan nie.

## 2. SUPABASE – KONTROLEER DIE ADMIN USER
Gaan na **Authentication -> Users**.
Die gebruiker met hierdie ID moet bestaan:
`11bd15b4-711a-4d04-8307-4c8c01202eb8`

Die e-pos/wagwoord wat jy op die WPU Admin-aanmelding gebruik moet aan DAARDIE gebruiker behoort.

## 3. DEPLOY NA GITHUB
1. Pak hierdie ZIP uit.
2. Die inhoud van `WPU-2026-APP-main` moet die root van jou nuwe GitHub repository wees, sodat `index.html`, `app.js`, `config.js` en `assets/` direk daar is.
3. Vervang die vorige files in die repository met hierdie files.
4. Commit en push na jou `main` branch.

## 4. RENDER
Render kan 'n gewone HTML/CSS/JS webwerf as 'n Static Site publiseer.
- New -> Static Site
- Kies jou GitHub repository
- Branch: `main`
- Root Directory: leeg as die files direk in die repo-root is
- Build Command: leeg
- Publish Directory: `.`
- Klik **Create Static Site / Deploy**

As jou repo nog 'n buitenste gids bevat, stel Root Directory na daardie gids en Publish Directory na `.`.

## 5. NA DIE DEPLOY
1. Wag tot Render sê **Live**.
2. Open die nuwe `onrender.com` URL.
3. Hard-refresh die blad (Ctrl+F5 op Windows).
4. Gaan na **Admin**.
5. Teken aan met die Supabase Auth-gebruiker wat UUID `11bd15b4-711a-4d04-8307-4c8c01202eb8` het.
6. Druk **Toets Supabase**.
7. Dit moet sê **Supabase OK**.
8. Toets eers 'n klein uitslag/PDF.
9. Toets daarna 'n weeklikse wennerfoto en 'n byeenkoms.

## 6. AS RLS WEER FOUT GEE
Die eerste ding om te kontroleer is die Auth UUID. Die gebruiker waarmee jy aangemeld is MOET dieselfde UUID wees as:
`11bd15b4-711a-4d04-8307-4c8c01202eb8`

Die app gebruik die normale Supabase publishable/anon sleutel in `config.js`. MOENIE `service_role` of enige secret key in `config.js` plaas nie.

## 7. MOENIE WEER DIE OU ZIP DEPLOY NIE
Gebruik slegs hierdie nuwe weergawe nadat die Supabase SQL uitgevoer is.
