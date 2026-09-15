# WPU 2026 – app

Hierdie is 'n **installeerbare PWA** vir Android én iPhone. Dit kan op 'n webadres oopgemaak word en daarna op die foon se tuisskerm geïnstalleer word.

## Belangrik
Die app bevat twee vlakke:
1. **Plaaslike modus:** werk onmiddellik en stoor inhoud op die toestel/browser.
2. **Cloud-modus:** aanbeveel vir die werklike WPU-app, sodat jy vanaf jou rekenaar nuwe wenners, foto's en PDF's kan laai en almal se fone dit sien. Gebruik Supabase.

## Supabase cloud
1. Skep 'n Supabase-projek.
2. Maak `setup.sql` oop en voer dit in Supabase SQL Editor uit.
3. Maak `config.example.js` 'n kopie genaamd `config.js` en plaas jou Supabase Project URL en anon key daarin.
4. Plaas die hele gids op 'n HTTPS webhostingdiens (bv. Netlify, Cloudflare Pages, Vercel of jou bestaande Render-webhosting).
5. Skep een admin-gebruiker in Supabase Auth. Die SQL bevat 'n admin-profielstap.

## Wat die finale app bevat
- WPU-logo en WPU 2026 handelsmerk
- Home-skerm met weeklikse wenners eerste
- Wennerfoto's en wedvlugnaam
- Uitslae met Potch, KOSH, SNU, Vrystaat, Juniors en WPU
- PDF's per seksie en unie
- 2026 Jaarboek
- Byeenkomste/funksies met foto's
- WPU inligting, kontakpersone, voorsitter/dagbestuur en konstitusie
- Admin-inhoudbestuur
- PWA installasie op Android en iPhone
- Offline cache vir die app shell
- JSON rugsteun/restore
