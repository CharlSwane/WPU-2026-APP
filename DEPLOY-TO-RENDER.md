# WPU 2026 – Render Deployment

Sien **DEPLOY-NUWE-VERSIE-AFRIKAANS.md** vir die volledige stap-vir-stap Supabase + GitHub + Render proses.

Kort weergawe:
- Supabase: run `RLS-FIX.sql` in SQL Editor.
- GitHub: plaas die inhoud van hierdie folder direk in die repository root.
- Render: **New -> Static Site**, branch `main`, Build Command leeg, Publish Directory `.`.
- Na deploy: Admin -> Teken aan -> Toets Supabase.
