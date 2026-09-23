/* WPU 2026 APP - stable version
   Supabase + PWA
   Keeps local data when cloud is empty/unavailable.
*/
(() => {
'use strict';

const CONFIG = window.WPU_CONFIG || {};
let sb = null;
let currentUser = null;
let cloudOnline = false;
let cloudSnapshot = null;

try {
  if (CONFIG.supabaseUrl && CONFIG.supabaseAnonKey && window.supabase) {
    sb = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
  }
} catch (e) {
  console.warn('Supabase init failed:', e);
}

const cats = ['POTCH','KOSH','SNU','VRYSTAAT','JUNIORS','WPU'];

const seed = {
  winners: [],
  events: [],
  results: [],
  docs: [],
  info: {
    about: 'Welkom by die Westelike Posduif Unie se 2026 digitale jaarboek.',
    contacts: '',
    management: '',
    constitution: '',
    constitution_url: ''
  },
  overalls: []
};

let data = loadLocal();
let page = 'home';
let cat = 'ALL';

function clone(x){ return JSON.parse(JSON.stringify(x)); }

function loadLocal(){
  try {
    const raw = localStorage.getItem('wpu_data');
    if (!raw) return clone(seed);
    const parsed = JSON.parse(raw);
    return normalizeData(parsed);
  } catch(e) {
    console.warn('Local data error:', e);
    return clone(seed);
  }
}

function normalizeData(raw){
  const x = raw && raw.data ? raw.data : raw || {};
  return {
    winners: Array.isArray(x.winners) ? x.winners : [],
    events: Array.isArray(x.events) ? x.events : [],
    results: Array.isArray(x.results) ? x.results : [],
    overalls: Array.isArray(x.overalls) ? x.overalls : [],
    docs: Array.isArray(x.docs) ? x.docs : [],
    info: {
      about: x.info?.about || seed.info.about,
      contacts: x.info?.contacts || '',
      management: x.info?.management || '',
      constitution: x.info?.constitution || '',
      constitution_url: x.info?.constitution_url || ''
    }
  };
}

function save(){
  localStorage.setItem('wpu_data', JSON.stringify(data));
}

function esc(s){
  return String(s ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}

function val(id){
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function setVal(id, value){
  const el = document.getElementById(id);
  if (el) el.value = value ?? '';
}

function empty(msg='Geen items beskikbaar nie.') {
  return `<div class="empty">${esc(msg)}</div>`;
}

function imgOrLogo(src, cls){
  return src
    ? `<img class="${cls}" src="${esc(src)}" alt="" loading="lazy">`
    : `<img class="${cls} placeholder" src="assets/wpu-logo.jpg" alt="WPU">`;
}

function nav(){
  const el = document.querySelector('#nav');
  if (!el) return;
  const items = [
    ['home','Tuis'],
    ['winners','Weeklikse wenners'],
    ['results','Uitslae'],
    ['yearbook','Jaarboek 2026'],
    ['documents','Dokumente'],
    ['events','Byeenkomste'],
    ['info','WPU Inligting'],
    ['admin','Admin']
  ];
  el.innerHTML = items.map(([p,label]) =>
    `<button class="navbtn ${page===p?'active':''}" onclick="go('${p}')">${label}</button>`
  ).join('');
}

function go(p){
  page = p;
  cat = 'ALL';
  render();
  window.scrollTo(0,0);
}

function render(){
  nav();
  const a = document.querySelector('#app');
  if (!a) return;
  const fn = {home:home,winners:winPage,results:resultsPage,yearbook:yearbook,documents:documentsPage,events:eventsPage,info:infoPage,admin:adminPage}[page] || home;
  try { fn(a); }
  catch(e) {
    console.error(e);
    a.innerHTML = `<div class="empty"><b>Die bladsy kon nie laai nie.</b><br>${esc(e.message)}</div>`;
  }
}

function sortByDateNewest(list){
  return [...(list||[])].sort((a,b)=>{
    const ad=String(a?.date||'');
    const bd=String(b?.date||'');
    if(ad!==bd) return bd.localeCompare(ad);
    const ac=String(a?.created_at||'');
    const bc=String(b?.created_at||'');
    return bc.localeCompare(ac);
  });
}

function home(a){
  const ws = sortByDateNewest(data.winners).slice(0,6);
  a.innerHTML = `
    <section class="hero">
      <img src="assets/wpu-logo.jpg" alt="WPU">
      <div><h1>WPU 2026</h1><p>Jou digitale jaarboek, weeklikse wenners, uitslae en byeenkomste.</p></div>
    </section>
    <h2>🏆 Weeklikse wenners</h2>
    <div class="grid">${ws.map(winnerCard).join('') || empty()}</div>
    <h2>📊 Jongste uitslae</h2>${resultList(sortByDateNewest(data.results).slice(0,5))}
    <h2>📅 Komende / onlangse byeenkomste</h2>
    <div class="grid">${sortByDateNewest(data.events).slice(0,4).map(eventCard).join('') || empty()}</div>`;
}

function winnerCard(w){
  return `<article class="card winner-card">
    ${imgOrLogo(w.image,'winner-img')}
    <div class="body">
      <div class="meta">${esc(w.week)} • ${esc(w.date)}</div>
      <h3>${esc(w.race)}</h3>
      <b>${esc(w.name)}</b>
      <div class="meta">${esc(w.club)}</div>
      <p>${esc(w.caption||'')}</p>
    </div>
  </article>`;
}

function winPage(a){
  a.innerHTML = `<h1>Weeklikse wenners</h1>
    <div class="grid">${sortByDateNewest(data.winners).map(winnerCard).join('') || empty()}</div>`;
}

function chips(){
  return `<div class="chips">
    <button class="chip ${cat==='ALL'?'active':''}" onclick="filterCat('ALL')">Alles</button>
    ${cats.map(c=>`<button class="chip ${cat===c?'active':''}" onclick="filterCat('${c}')">${c}</button>`).join('')}
  </div>`;
}

function filterCat(c){ cat=c; render(); }

function resultsPage(a){
  const rs = sortByDateNewest(data.results.filter(r => cat==='ALL' || r.category===cat));
  const os = sortByDateNewest(data.overalls.filter(o => cat==='ALL' || o.category===cat));
  a.innerHTML = `<h1>Uitslae</h1>${chips()}${overallList(os)}${resultList(rs) || empty()}`;
}

function overallList(items){
  if(!items.length) return '';
  return `<h2>🏆 Algehele kampioen & Beste duif</h2><div class="overall-grid">${items.map(o=>`<article class="overall-card">
    <div class="overall-head"><b>${esc(o.category)}</b><span class="meta">Week: ${esc(o.date||'')}</span></div>
    <div class="overall-person">${o.champion_image_url?imgOrLogo(o.champion_image_url,'overall-img'):''}<div><div class="meta">Algehele Kampioen</div><h3>${esc(o.champion_name||'—')}</h3></div></div>
    <div class="overall-person">${o.best_bird_image_url?imgOrLogo(o.best_bird_image_url,'overall-img'):''}<div><div class="meta">Algehele Beste Duif</div><h3>${esc(o.best_bird_name||'—')}</h3></div></div>
  </article>`).join('')}</div>`;
}

function resultList(rs){
  if (!rs.length) return '';
  return rs.map(r=>`
    <div class="pdf">
      <div class="ico">📄</div>
      <div><b>${esc(r.title)}</b><div class="meta">${esc(r.category)} • ${esc(r.date||'')}</div></div>
      ${r.url ? `<div class="actions">
        <button class="btn" type="button" onclick='openPdf(${JSON.stringify(r.url)},${JSON.stringify(r.title)})'>Maak PDF oop</button>
        <a class="btn secondary" href="${esc(r.url)}" target="_blank" rel="noopener">Open direk</a>
      </div>` : ''}
    </div>`).join('');
}

function yearbook(a){
  const docs = sortByDateNewest(data.docs.filter(d => d.type==='yearbook'));
  a.innerHTML = `<h1>Jaarboek 2026</h1>${docs.length ? docs.map(docCard).join('') : empty('Laai die 2026 jaarboek in by Admin.')}`;
}

function docCard(d){
  return `<div class="pdf">
    <div class="ico">📘</div>
    <div><b>${esc(d.title)}</b><div class="meta">${esc(d.date||'')} • ${esc(d.note||'')}</div></div>
    ${d.url ? `<div class="actions">
      <button class="btn" type="button" onclick='openPdf(${JSON.stringify(d.url)},${JSON.stringify(d.title)})'>Maak PDF oop</button>
      <a class="btn secondary" href="${esc(d.url)}" target="_blank" rel="noopener">Open direk</a>
    </div>` : ''}
  </div>`;
}

function documentsPage(a){
  const docs = sortByDateNewest(data.docs.filter(d => d.type!=='yearbook' && d.type!=='constitution'));
  a.innerHTML = `<h1>Dokumente</h1>${docs.length ? docs.map(docCard).join('') : empty('Geen dokumente is tans beskikbaar nie.')}`;
}

function eventsPage(a){
  a.innerHTML = `<h1>Byeenkomste & Funksies</h1>
    <div class="grid">${sortByDateNewest(data.events).map(eventCard).join('') || empty()}</div>`;
}

function eventCard(e){
  const imgs = Array.isArray(e.images) ? e.images : [];
  return `<article class="card event-card">
    ${imgs[0] ? `<img class="event-img" src="${esc(imgs[0])}" onclick='viewEvent(${JSON.stringify(e.id)})' alt="" loading="lazy">`
      : `<div class="event-img placeholder"></div>`}
    <div class="body">
      <div class="meta">${esc(e.date)}${e.location?' • '+esc(e.location):''}</div>
      <h3>${esc(e.title)}</h3>
      <p>${mapsHtml(e.description||'')}</p>
      ${imgs.length>1 ? `<button class="btn secondary" type="button" onclick='viewEvent(${JSON.stringify(e.id)})'>View ${imgs.length} foto’s</button>` : ''}
    </div>
  </article>`;
}

function mapsHtml(text){
  const raw = String(text||'');
  const urls = [];
  raw.replace(/https?:\/\/[^\s"'<>]+/gi, u => {
    urls.push(u.replace(/[),.;]+$/,''));
    return u;
  });
  let clean = raw.replace(/<iframe[\s\S]*?<\/iframe>/gi,'').replace(/<[^>]+>/g,'');
  clean = esc(clean).replace(/https?:\/\/[^\s<]+/gi,'');
  const links = [...new Set(urls)].map(u =>
    `<a href="${esc(u)}" target="_blank" rel="noopener" class="maplink">📍 Maak kaart oop</a>`).join(' ');
  return (clean.trim()?clean+' ':'') + links;
}

function viewEvent(id){
  const e = data.events.find(x=>String(x.id)===String(id));
  if(!e) return;
  const imgs = Array.isArray(e.images) ? e.images : [];
  const html = `<div class="modal-backdrop" onclick="closeModal(event)">
    <div class="modal" onclick="event.stopPropagation()">
      <button class="modal-close" onclick="closeModal()">×</button>
      <h2>${esc(e.title)}</h2>
      <div class="meta">${esc(e.date||'')} ${e.location?'• '+esc(e.location):''}</div>
      <p>${mapsHtml(e.description||'')}</p>
      <div class="gallery">${imgs.map(u=>`<img src="${esc(u)}" alt="" loading="lazy">`).join('')}</div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend',html);
}

function closeModal(ev){
  if(ev && ev.target && !ev.target.classList.contains('modal-backdrop')) return;
  document.querySelectorAll('.modal-backdrop').forEach(x=>x.remove());
}

function infoPage(a){
  a.innerHTML = `<h1>WPU Inligting</h1>
    <section class="info"><h2>Oor die WPU</h2><div>${nl2br(data.info.about)}</div>
    <h2>Kontak</h2><div>${nl2br(data.info.contacts)}</div>
    <h2>Bestuur</h2><div>${nl2br(data.info.management)}</div>
    <h2>Konstitusie</h2><div>${nl2br(data.info.constitution)}</div>
    ${data.info.constitution_url ? `<div class="actions"><button class="btn" type="button" onclick='openPdf(${JSON.stringify(data.info.constitution_url)},"WPU Konstitusie")'>Maak Konstitusie oop</button><a class="btn secondary" href="${esc(data.info.constitution_url)}" target="_blank" rel="noopener">Open direk</a></div>` : ''}
    </section>`;
}

function nl2br(s){
  return esc(s).replace(/\r?\n/g,'<br>');
}

function adminPage(a){
  if(!sb){
    a.innerHTML = `<h1>Admin</h1><div class="empty">Supabase is nie gekoppel nie. Kontroleer config.js.</div>`;
    return;
  }
  if(!currentUser){
    a.innerHTML = `<h1>Admin</h1>
      <section class="admin-card">
        <h2>Admin aanmelding</h2>
        <label>E-posadres<input id="ae" type="email" autocomplete="username"></label>
        <label>Wagwoord<input id="ap" type="password" autocomplete="current-password"></label>
        <button class="btn" onclick="loginAdmin()">Teken aan</button>
      </section>`;
    return;
  }

  a.innerHTML = `<h1>Admin</h1>
    <p><b>Aangemeld:</b> ${esc(currentUser.email||'')}</p>
    <div class="admin-actions">
      <button class="btn" onclick="logoutAdmin()">Teken uit</button>
      <button class="btn secondary" onclick="refreshCloud()">Herlaai uit Supabase</button>
      <button class="btn secondary" onclick="downloadBackup()">Laai backup af</button>
      <label class="btn secondary filebtn">Herstel backup
        <input type="file" accept=".json,application/json" onchange="restoreBackup(this)" hidden>
      </label>
    </div>
    ${adminWinnerForm()}
    ${adminEventForm()}
    ${adminResultForm()}
    ${adminDocForm()}
    ${adminInfoForm()}
    ${adminList()}`;
}

function adminWinnerForm(){
  return `<section class="admin-card"><h2>Weeklikse wenner</h2>
    <div class="formgrid">
      <label>Week<input id="w_week"></label>
      <label>Wedvlug<input id="w_race"></label>
      <label>Naam<input id="w_name"></label>
      <label>Klub<input id="w_club"></label>
      <label>Datum<input id="w_date" type="date"></label>
      <label>Foto<input id="w_file" type="file" accept="image/*"></label>
      <label>Foto URL<input id="w_image"></label>
      <label>Byskrif<input id="w_caption"></label>
    </div>
    <button class="btn" onclick="addWinner()">Stoor wenner</button>
  </section>`;
}

function adminEventForm(){
  return `<section class="admin-card"><h2>Byeenkoms / funksie</h2>
    <div class="formgrid">
      <label>Naam<input id="e_title"></label>
      <label>Datum<input id="e_date" type="date"></label>
      <label>Plek<input id="e_location"></label>
      <label>Hooffoto<input id="e_file" type="file" accept="image/*"></label>
      <label>Hooffoto URL<input id="e_image"></label>
      <label>Meer foto’s<input id="e_files" type="file" accept="image/*" multiple></label>
    </div>
    <label>Beskrywing / Google Maps skakel<textarea id="e_desc"></textarea></label>
    <button class="btn" onclick="addEvent()">Stoor byeenkoms</button>
  </section>`;
}

function adminResultForm(){
  return `<section class="admin-card admin-wide"><h2>Uitslae & weeklikse algehele wenners</h2>
    <div class="admin-subsection"><h3>Uitslag PDF</h3>
      <div class="formgrid formgrid-wide">
        <label>Titel<input id="r_title" placeholder="bv. WPU Wedvlugte Week 12"></label>
        <label>Kategorie<select id="r_category">${cats.map(c=>`<option>${c}</option>`).join('')}</select></label>
        <label>Datum<input id="r_date" type="date"></label>
        <label>PDF lêer<input id="r_file" type="file" accept="application/pdf,.pdf"></label>
        <label>PDF URL<input id="r_url" placeholder="Opsioneel indien PDF reeds aanlyn is"></label>
      </div>
      <button class="btn" onclick="addResult()">Stoor uitslag</button>
    </div>
    <div class="admin-subsection overall-admin">
      <h3>Algehele Kampioen & Algehele Beste Duif</h3>
      <p class="small">Hierdie rekord word <b>oorgeskryf</b> wanneer jy dit weer vir dieselfde kategorie stoor. Dus bly daar net die nuutste week se Kampioen en Beste Duif vir WPU, KOSH, SNU, VRYSTAAT, POTCH of JUNIORS.</p>
      <div class="formgrid formgrid-wide">
        <label>Kategorie<select id="o_category">${cats.map(c=>`<option>${c}</option>`).join('')}</select></label>
        <label>Week / datum<input id="o_date" type="date"></label>
        <label>Algehele Kampioen<input id="o_champion" placeholder="Naam van kampioen"></label>
        <label>Kampioen foto<input id="o_champion_file" type="file" accept="image/*"></label>
        <label>Algehele Beste Duif<input id="o_best" placeholder="Naam / ringnommer"></label>
        <label>Beste duif foto<input id="o_best_file" type="file" accept="image/*"></label>
      </div>
      <button class="btn" onclick="saveOverall()">Stoor / Oorskryf week se algehele wenners</button>
    </div>
  </section>`;
}

function adminDocForm(){
  return `<section class="admin-card"><h2>Dokumente</h2>
    <p class="small">Gebruik hierdie afdeling vir inskrywingslyste, kennisgewings, vorms, jaarboek-PDF's en ander WPU-dokumente.</p>
    <div class="formgrid">
      <label>Titel<input id="d_title" placeholder="bv. Inskrywingslys 2026"></label>
      <label>Tipe<select id="d_type"><option value="info">Algemene dokument</option><option value="yearbook">Jaarboek 2026</option><option value="entry">Inskrywingslys</option><option value="notice">Kennisgewing</option><option value="form">Vorm</option></select></label>
      <label>Datum<input id="d_date" type="date"></label>
      <label>PDF lêer<input id="d_file" type="file" accept="application/pdf,.pdf"></label>
      <label>PDF URL<input id="d_url" placeholder="Opsioneel"></label>
      <label>Nota<input id="d_note" placeholder="Kort beskrywing"></label>
    </div>
    <button class="btn" onclick="addDoc()">Stoor dokument</button>
  </section>`;
}

function adminInfoForm(){
  return `<section class="admin-card admin-wide"><h2>WPU Inligting & Konstitusie</h2>
    <div class="formgrid formgrid-wide">
      <label>Oor die WPU<textarea id="i_about">${esc(data.info.about)}</textarea></label>
      <label>Kontak<textarea id="i_contacts">${esc(data.info.contacts)}</textarea></label>
      <label>Bestuur<textarea id="i_management">${esc(data.info.management)}</textarea></label>
      <label>Konstitusie nota / beskrywing<textarea id="i_constitution">${esc(data.info.constitution)}</textarea></label>
    </div>
    <div class="admin-subsection constitution-upload">
      <h3>WPU Konstitusie PDF</h3>
      <p class="small">Die Konstitusie word as 'n spesiale dokument gestoor. Dit hoef dus nie die <code>constitution_url</code> kolom in <code>wpu_info</code> te gebruik nie.</p>
      <label>Laai Konstitusie PDF op<input id="i_constitution_file" type="file" accept="application/pdf,.pdf"></label>
      ${data.info.constitution_url ? `<div class="small">Huidige Konstitusie: <a href="${esc(data.info.constitution_url)}" target="_blank" rel="noopener">Maak oop</a></div>` : ''}
    </div>
    <button class="btn" onclick="saveInfo()">Stoor WPU inligting</button>
  </section>`;
}

function adminList(){
  return `<section class="admin-card"><h2>Bestaande inhoud</h2>
    <div class="small">Wenner: ${data.winners.length} • Byeenkomste: ${data.events.length} • Uitslae: ${data.results.length} • Dokumente: ${data.docs.length}</div>
    ${sortByDateNewest(data.winners).map(w=>adminRow('Wenner',w.id,w.name||w.race,w.date,'deleteWinner')).join('')}
    ${sortByDateNewest(data.events).map(e=>adminRow('Byeenkoms',e.id,e.title,e.date,'deleteEvent')).join('')}
    ${sortByDateNewest(data.results).map(r=>adminRow('Uitslag',r.id,r.title,r.date,'deleteResult')).join('')}
    ${sortByDateNewest(data.docs).map(d=>adminRow('Dokument',d.id,d.title,d.date,'deleteDoc')).join('')}
  </section>`;
}

function adminRow(type,id,title,date,fn){
  return `<div class="admin-row"><span><b>${esc(type)}</b> — ${esc(title)}${date ? `<div class="meta">${esc(date)}</div>` : ''}</span>
    <button class="btn danger" onclick='${fn}(${JSON.stringify(id)})'>Verwyder</button></div>`;
}

async function requireAdmin(){
  if(!sb) throw new Error('Supabase is nie gekoppel nie.');

  // currentUser is only UI state. For an RLS-protected write we must
  // confirm that the Supabase client actually has a live Auth session.
  const {data:sessionData,error:sessionError}=await sb.auth.getSession();
  if(sessionError) throw sessionError;

  let session=sessionData?.session||null;
  if(!session){
    const {data:userData,error:userError}=await sb.auth.getUser();
    if(userError||!userData?.user){
      throw new Error('Geen aktiewe Supabase Admin-sessie nie. Teken asseblief weer aan.');
    }
    currentUser=userData.user;
  }else{
    currentUser=session.user;
  }

  // Refresh the token when Supabase reports that the session is expiring.
  if(session && session.expires_at && (session.expires_at*1000-Date.now())<60000){
    const {data:refreshData,error:refreshError}=await sb.auth.refreshSession();
    if(refreshError) throw refreshError;
    if(refreshData?.session) currentUser=refreshData.session.user;
  }

  if(!currentUser) throw new Error('Teken eers as admin aan.');
}

async function uploadMedia(file){
  if(!file) return '';
  await requireAdmin();
  const ext = (file.name.split('.').pop()||'bin').toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const {error} = await sb.storage.from('wpu-media').upload(path,file,{upsert:false,contentType:file.type||undefined});
  if(error) throw error;
  return sb.storage.from('wpu-media').getPublicUrl(path).data.publicUrl;
}

async function cloudInsert(table,row){
  await requireAdmin();
  const {data:res,error} = await sb.from(table).insert(row).select().single();
  if(error) throw error;
  return res;
}

async function cloudUpsert(table,row){
  await requireAdmin();
  const {data:res,error} = await sb.from(table).upsert(row,{onConflict:'id'}).select().single();
  if(error) throw error;
  return res;
}

function mapCloud(w,e,r,d,i,o){
  return {
    winners:(w||[]).map(x=>({id:x.id,week:x.week,race:x.race,name:x.name,club:x.club,date:x.date,image:x.image_url,caption:x.caption,created_at:x.created_at})),
    events:(e||[]).map(x=>({id:x.id,title:x.title,date:x.date,location:x.location,description:x.description,images:Array.isArray(x.images)?x.images:[],created_at:x.created_at})),
    results:(r||[]).map(x=>({id:x.id,title:x.title,category:x.category,date:x.date,url:x.pdf_url,created_at:x.created_at})),
    docs:(d||[]).map(x=>({id:x.id,title:x.title,type:x.type,date:x.date,url:x.url,note:x.note,created_at:x.created_at})),
    info:i ? {about:i.about||'',contacts:i.contacts||'',management:i.management||'',constitution:i.constitution||'',constitution_url:((d||[]).find(x=>x.type==='constitution')?.url || i.constitution_url || '')} : clone(data.info),
    overalls:(o||[]).map(x=>({id:x.id,category:x.category,date:x.date,champion_name:x.champion_name,champion_image_url:x.champion_image_url,best_bird_name:x.best_bird_name,best_bird_image_url:x.best_bird_image_url,updated_at:x.updated_at}))
  };
}

async function cloudLoad(options={}){
  if(!sb) return false;
  try{
    const [w,e,r,d,i,o] = await Promise.all([
      sb.from('weekly_winners').select('*').order('created_at',{ascending:false}),
      sb.from('events').select('*').order('created_at',{ascending:false}),
      sb.from('results').select('*').order('created_at',{ascending:false}),
      sb.from('documents').select('*').order('created_at',{ascending:false}),
      sb.from('wpu_info').select('*').eq('id',1).maybeSingle(),
      sb.from('weekly_overalls').select('*').order('updated_at',{ascending:false})
    ]);

    const errors = [w,e,r,d,i,o].filter(x=>x.error);
    if(errors.length){
      cloudOnline=false;
      console.warn('CLOUD LOAD ERROR DETAILS:', errors.map(x => ({
        message: x.error?.message,
        code: x.error?.code,
        details: x.error?.details,
        hint: x.error?.hint
      })));
      return false;
    }

    const cloud = mapCloud(w.data,e.data,r.data,d.data,i.data,o.data);
    const cloudCount = cloud.winners.length + cloud.events.length + cloud.results.length + cloud.docs.length;

    /* Never erase useful local content just because Supabase is empty. */
    const localCount = data.winners.length + data.events.length + data.results.length + data.docs.length;
    if(!options.forceEmpty && cloudCount===0 && localCount>0){
      cloudOnline=true;
      return true;
    }

    data = cloud;
    cloudSnapshot = clone(cloud);
    cloudOnline=true;
    save();
    return true;
  }catch(e){
    cloudOnline=false;
    console.warn('Cloud load failed:',e);
    return false;
  }
}

async function refreshCloud(){
  const ok = await cloudLoad({forceEmpty:false});
  alert(ok ? 'Inhoud is herlaai.' : 'Supabase kon nie herlaai word nie. Plaaslike inhoud is behou.');
  render();
}

async function loginAdmin(){
  if(!sb){alert('Cloud is nie gekonfigureer nie.');return;}
  const email=val('ae'), password=val('ap');
  if(!email || !password){alert('Vul e-pos en wagwoord in.');return;}
  const {data:res,error}=await sb.auth.signInWithPassword({email,password});
  if(error){alert(error.message);return;}
  currentUser=res.user;

  const {data:sessionData,error:sessionError}=await sb.auth.getSession();
  if(sessionError || !sessionData?.session){
    currentUser=null;
    await sb.auth.signOut();
    alert('Aanmelding het gewerk, maar Supabase kon nie die sessie bevestig nie. Probeer asseblief weer.');
    render();
    return;
  }

  await cloudLoad({forceEmpty:false});
  alert('Admin aangemeld.');
  render();
}

async function logoutAdmin(){
  if(sb) await sb.auth.signOut();
  currentUser=null;
  render();
}

async function addWinner(){
  try{
    await requireAdmin();
    const row={
      week:val('w_week'),race:val('w_race'),name:val('w_name'),club:val('w_club'),
      date:val('w_date')||null,image_url:val('w_image'),caption:val('w_caption')
    };
    if(!row.week||!row.race||!row.name){alert('Week, wedvlug en naam is verpligtend.');return;}
    const file=document.getElementById('w_file')?.files?.[0];
    if(file) row.image_url=await uploadMedia(file);
    const saved=await cloudInsert('weekly_winners',row);
    data.winners.unshift({id:saved.id,week:saved.week,race:saved.race,name:saved.name,club:saved.club,date:saved.date,image:saved.image_url,caption:saved.caption});
    save(); alert('Weeklikse wenner gestoor.'); render();
  }catch(e){alert('Kon nie stoor nie: '+e.message);}
}

async function addEvent(){
  try{
    await requireAdmin();
    const images=[];
    const mainFile=document.getElementById('e_file')?.files?.[0];
    if(mainFile) images.push(await uploadMedia(mainFile));
    else if(val('e_image')) images.push(val('e_image'));
    const files=[...(document.getElementById('e_files')?.files||[])];
    for(const f of files) images.push(await uploadMedia(f));
    const row={title:val('e_title'),date:val('e_date')||null,location:val('e_location'),description:val('e_desc'),images};
    if(!row.title){alert('Naam van byeenkoms is verpligtend.');return;}
    const saved=await cloudInsert('events',row);
    data.events.unshift({id:saved.id,title:saved.title,date:saved.date,location:saved.location,description:saved.description,images:saved.images||[]});
    save(); alert('Byeenkoms gestoor.'); render();
  }catch(e){alert('Kon nie stoor nie: '+e.message);}
}

async function addResult(){
  try{
    await requireAdmin();
    let url=val('r_url');
    const file=document.getElementById('r_file')?.files?.[0];
    if(file) url=await uploadMedia(file);
    const row={title:val('r_title'),category:val('r_category'),date:val('r_date')||null,pdf_url:url};
    if(!row.title){alert('Titel is verpligtend.');return;}
    if(!url){alert('Kies ’n PDF of plaas ’n PDF URL.');return;}
    const saved=await cloudInsert('results',row);
    data.results.unshift({id:saved.id,title:saved.title,category:saved.category,date:saved.date,url:saved.pdf_url,created_at:saved.created_at});
    save(); alert('Uitslag gestoor.'); render();
  }catch(e){alert('Kon nie stoor nie: '+e.message);}
}

async function saveOverall(){
  try{
    await requireAdmin();
    const category=val('o_category')||'WPU';
    const date=val('o_date')||new Date().toISOString().slice(0,10);
    let championImage=(data.overalls.find(x=>x.category===category)||{}).champion_image_url||'';
    let bestBirdImage=(data.overalls.find(x=>x.category===category)||{}).best_bird_image_url||'';
    const cf=document.getElementById('o_champion_file')?.files?.[0];
    const bf=document.getElementById('o_best_file')?.files?.[0];
    if(cf) championImage=await uploadMedia(cf);
    if(bf) bestBirdImage=await uploadMedia(bf);
    const existing=data.overalls.find(x=>x.category===category);
    const row={
      id:existing?.id || crypto.randomUUID(),
      category,date,
      champion_name:val('o_champion'), champion_image_url:championImage,
      best_bird_name:val('o_best'), best_bird_image_url:bestBirdImage,
      updated_at:new Date().toISOString()
    };
    if(!row.champion_name || !row.best_bird_name){ alert('Vul asseblief die Algehele Kampioen en Algehele Beste Duif in.'); return; }
    const {data:saved,error}=await sb.from('weekly_overalls').upsert(row,{onConflict:'category'}).select().single();
    if(error) throw error;
    data.overalls=(data.overalls||[]).filter(x=>x.category!==category);
    data.overalls.unshift(saved);
    save(); alert(`${category}: Algehele Kampioen en Beste Duif is opgedateer.`); render();
  }catch(e){ alert('Kon nie algehele wenners stoor nie: '+e.message); }
}

async function addDoc(){
  try{
    await requireAdmin();
    let url=val('d_url');
    const file=document.getElementById('d_file')?.files?.[0];
    if(file) url=await uploadMedia(file);
    const row={title:val('d_title'),type:val('d_type'),date:val('d_date')||null,url,note:val('d_note')};
    if(!row.title){alert('Titel is verpligtend.');return;}
    if(!url){alert('Kies ’n PDF of plaas ’n PDF URL.');return;}
    const saved=await cloudInsert('documents',row);
    data.docs.unshift({id:saved.id,title:saved.title,type:saved.type,date:saved.date,url:saved.url,note:saved.note,created_at:saved.created_at});
    save(); alert('Dokument gestoor.'); render();
  }catch(e){alert('Kon nie stoor nie: '+e.message);}
}

async function saveInfo(){
  try{
    await requireAdmin();
    const constitutionFile=document.getElementById('i_constitution_file')?.files?.[0];
    let constitutionUrl=data.info.constitution_url||'';
    if(constitutionFile) constitutionUrl=await uploadMedia(constitutionFile);
    const row={
      id:1,
      about:val('i_about'),
      contacts:val('i_contacts'),
      management:val('i_management'),
      constitution:val('i_constitution'),
      updated_at:new Date().toISOString()
    };
    const saved=await cloudUpsert('wpu_info',row);
    if(constitutionFile || constitutionUrl){
      const existing=(data.docs||[]).find(d=>d.type==='constitution');
      const doc={
        id: existing?.id || crypto.randomUUID(),
        title:'WPU Konstitusie', type:'constitution', date:new Date().toISOString().slice(0,10),
        url:constitutionUrl, note:'Amptelike WPU Konstitusie'
      };
      const docSaved=await cloudUpsert('documents',doc);
      data.docs=(data.docs||[]).filter(d=>d.type!=='constitution');
      data.docs.unshift({id:docSaved.id,title:docSaved.title,type:docSaved.type,date:docSaved.date,url:docSaved.url,note:docSaved.note,created_at:docSaved.created_at});
    }
    data.info={about:saved.about||'',contacts:saved.contacts||'',management:saved.management||'',constitution:saved.constitution||'',constitution_url:constitutionUrl};
    save(); alert('WPU inligting gestoor.'); render();
  }catch(e){alert('Kon nie inligting stoor nie: '+e.message);}
}

async function deleteFrom(table,id,label){
  try{
    await requireAdmin();
    if(!confirm(`Verwyder ${label}?`)) return;
    const {error}=await sb.from(table).delete().eq('id',id);
    if(error) throw error;
    if(table==='weekly_winners') data.winners=data.winners.filter(x=>x.id!==id);
    if(table==='events') data.events=data.events.filter(x=>x.id!==id);
    if(table==='results') data.results=data.results.filter(x=>x.id!==id);
    if(table==='documents') data.docs=data.docs.filter(x=>x.id!==id);
    save(); render();
  }catch(e){alert('Kon nie verwyder nie: '+e.message);}
}
const deleteWinner=id=>deleteFrom('weekly_winners',id,'die wenner');
const deleteEvent=id=>deleteFrom('events',id,'die byeenkoms');
const deleteResult=id=>deleteFrom('results',id,'die uitslag');
const deleteDoc=id=>deleteFrom('documents',id,'die dokument');

async function openPdf(url,title='PDF'){
  if(!url){
    alert('Geen PDF-skakel beskikbaar nie.');
    return;
  }

  try{
    let u=String(url).trim();
    if(!u) throw new Error('Leë PDF-skakel.');

    // Older backups may contain a PDF as a data URL.
    if(u.startsWith('data:application/pdf')){
      const parts=u.split(',');
      const bin=atob(parts[1]||'');
      const bytes=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
      u=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
      setTimeout(()=>URL.revokeObjectURL(u),10*60*1000);
    }

    if(!/^https?:|^blob:|^data:/.test(u)){
      throw new Error('Die PDF-skakel is ongeldig.');
    }

    // Use a normal anchor rather than window.open(): this works more reliably
    // with Android/iPhone browsers and installed PWAs.
    const a=document.createElement('a');
    a.href=u;
    a.target='_blank';
    a.rel='noopener noreferrer';
    a.setAttribute('aria-label',`Open ${title||'PDF'}`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }catch(e){
    console.error('PDF open error:',e);
    alert('Die PDF kon nie oopgemaak word nie. Gebruik “Open direk” of laai die PDF weer in by Admin.');
  }
}

function downloadBackup(){
  try{
    const payload={
      version:4,
      exported_at:new Date().toISOString(),
      source:'WPU 2026 App',
      data:clone(data)
    };
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='WPU-2026-backup-'+new Date().toISOString().slice(0,10)+'.json';
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(e){alert('Backup kon nie geskep word nie: '+e.message);}
}
function restoreId(table, oldId){
  const id = String(oldId ?? '').trim();

  // Behou bestaande geldige UUID's
  if(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)){
    return id;
  }

  // Verander ou IDs soos w1, w2, e1, r1, d1
  // na 'n geldige, stabiele UUID.
  const source = `${table}:${id}`;

  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  let h3 = 0x85ebca6b;
  let h4 = 0xc2b2ae35;

  for(let i=0;i<source.length;i++){
    const c=source.charCodeAt(i);

    h1=Math.imul(h1^c,16777619);
    h2=Math.imul(h2^c,2246822519);
    h3=Math.imul(h3^c,3266489917);
    h4=Math.imul(h4^c,668265263);
  }

  const hex=n=>(n>>>0).toString(16).padStart(8,'0');

  let x=hex(h1)+hex(h2)+hex(h3)+hex(h4);

  x=x.slice(0,12)+'4'+x.slice(13,16)+
    ((parseInt(x.slice(16,18),16)&0x3f)|0x80)
      .toString(16).padStart(2,'0')+
    x.slice(18);

  return `${x.slice(0,8)}-${x.slice(8,12)}-${x.slice(12,16)}-${x.slice(16,20)}-${x.slice(20,32)}`;
}
async function restoreBackup(input){
  const file=input?.files?.[0];
  if(!file) return;

  try{
    restoreInProgress=true;
    await requireAdmin();

    const text=await file.text();
    const parsed=JSON.parse(text);
    const incoming=normalizeData(parsed);

    const count=incoming.winners.length+incoming.events.length+incoming.results.length+incoming.docs.length;
    if(!confirm(`Herstel ${count} inhoud-items vanaf hierdie backup?`)) return;

    // Confirm the actual Supabase Auth session immediately before protected writes.
    await requireAdmin();

    for(const w of incoming.winners){
      await cloudUpsert('weekly_winners',{
        id:restoreId('weekly_winners',w.id),
        week:w.week||'',
        race:w.race||'',
        name:w.name||'',
        club:w.club||null,
        date:w.date||null,
        image_url:w.image||'',
        caption:w.caption||''
      });
    }

    for(const e of incoming.events){
      await cloudUpsert('events',{
        id:restoreId('events',e.id),
        title:e.title||'',
        date:e.date||null,
        location:e.location||'',
        description:e.description||'',
        images:Array.isArray(e.images)?e.images:[]
      });
    }

    for(const r of incoming.results){
      await cloudUpsert('results',{
        id:restoreId('results',r.id),
        title:r.title||'',
        category:r.category||'WPU',
        date:r.date||null,
        pdf_url:r.url||''
      });
    }

    for(const d of incoming.docs){
      await cloudUpsert('documents',{
        id:restoreId('documents',d.id),
        title:d.title||'',
        type:d.type||'yearbook',
        date:d.date||null,
        url:d.url||'',
        note:d.note||''
      });
    }

    for(const o of (incoming.overalls||[])){
      await cloudUpsert('weekly_overalls',{
        id:restoreId('weekly_overalls',o.id), category:o.category||'WPU', date:o.date||null,
        champion_name:o.champion_name||'', champion_image_url:o.champion_image_url||'',
        best_bird_name:o.best_bird_name||'', best_bird_image_url:o.best_bird_image_url||'',
        updated_at:o.updated_at||new Date().toISOString()
      });
    }

    await cloudUpsert('wpu_info',{
      id:1,
      about:incoming.info.about||'',
      contacts:incoming.info.contacts||'',
      management:incoming.info.management||'',
      constitution:incoming.info.constitution||'',
      updated_at:new Date().toISOString()
    });

    // Only after all writes have succeeded do we replace the visible data
    // with the cloud copy. A failed restore therefore cannot wipe the app.
    const ok=await cloudLoad({forceEmpty:true});
    if(!ok) throw new Error('Die data is gestoor, maar Supabase kon dit nie daarna bevestig nie.');

    const expected={
      winners:incoming.winners.length,
      events:incoming.events.length,
      results:incoming.results.length,
      docs:incoming.docs.length
    };
    const actual={
      winners:data.winners.length,
      events:data.events.length,
      results:data.results.length,
      docs:data.docs.length
    };

    if(expected.winners!==actual.winners ||
       expected.events!==actual.events ||
       expected.results!==actual.results ||
       expected.docs!==actual.docs){
      throw new Error('Supabase het nie dieselfde aantal rekords as die backup teruggestuur nie. Die herstel is nie as volledig bevestig nie.');
    }

    save();
    render();
    alert('Backup is suksesvol na Supabase herstel en geverifieer.');
  }catch(e){
    console.error('Backup restore error:',e);
    alert('Backup herstel het misluk: '+(e.message||e));
  }finally{
    restoreInProgress=false;
    if(input) input.value='';
  }
}

window.go=go;
window.filterCat=filterCat;
window.openPdf=openPdf;
window.viewEvent=viewEvent;
window.closeModal=closeModal;
window.loginAdmin=loginAdmin;
window.logoutAdmin=logoutAdmin;
window.refreshCloud=refreshCloud;
window.downloadBackup=downloadBackup;
window.restoreBackup=restoreBackup;
window.addWinner=addWinner;
window.addEvent=addEvent;
window.addResult=addResult;
window.saveOverall=saveOverall;
window.addDoc=addDoc;
window.saveInfo=saveInfo;
window.deleteWinner=deleteWinner;
window.deleteEvent=deleteEvent;
window.deleteResult=deleteResult;
window.deleteDoc=deleteDoc;

if(sb){
  sb.auth.getSession().then(async ({data:res})=>{
    currentUser=res.session?.user||null;
    await cloudLoad({forceEmpty:false});
    render();
  }).catch(()=>render());
  sb.auth.onAuthStateChange((_event,session)=>{
    currentUser=session?.user||null;
    if(currentUser) cloudLoad({forceEmpty:false}).then(render);
    else render();
  });
}

render();

/* Keep the app current, but do not wipe useful local data when cloud is empty. */
let restoreInProgress=false;

setInterval(async()=>{
  if(sb && document.visibilityState!=='hidden' && !restoreInProgress){
    try{
      const {data:sessionData}=await sb.auth.getSession();
      if(!sessionData?.session) return;

      const before=JSON.stringify(data);
      const ok=await cloudLoad({forceEmpty:false});
      if(ok && JSON.stringify(data)!==before) render();
    }catch(e){
      console.warn('Background cloud refresh skipped:',e);
    }
  }
},60000);

})();
