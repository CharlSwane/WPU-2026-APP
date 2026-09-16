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
    constitution: ''
  }
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
    docs: Array.isArray(x.docs) ? x.docs : [],
    info: {
      about: x.info?.about || seed.info.about,
      contacts: x.info?.contacts || '',
      management: x.info?.management || '',
      constitution: x.info?.constitution || ''
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
  const fn = {home:home,winners:winPage,results:resultsPage,yearbook:yearbook,events:eventsPage,info:infoPage,admin:adminPage}[page] || home;
  try { fn(a); }
  catch(e) {
    console.error(e);
    a.innerHTML = `<div class="empty"><b>Die bladsy kon nie laai nie.</b><br>${esc(e.message)}</div>`;
  }
}

function home(a){
  const ws = data.winners.slice(0,6);
  a.innerHTML = `
    <section class="hero">
      <img src="assets/wpu-logo.jpg" alt="WPU">
      <div><h1>WPU 2026</h1><p>Jou digitale jaarboek, weeklikse wenners, uitslae en byeenkomste.</p></div>
    </section>
    <h2>🏆 Weeklikse wenners</h2>
    <div class="grid">${ws.map(winnerCard).join('') || empty()}</div>
    <h2>📊 Jongste uitslae</h2>${resultList(data.results.slice(0,5))}
    <h2>📅 Komende / onlangse byeenkomste</h2>
    <div class="grid">${data.events.slice(0,4).map(eventCard).join('') || empty()}</div>`;
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
    <div class="grid">${data.winners.map(winnerCard).join('') || empty()}</div>`;
}

function chips(){
  return `<div class="chips">
    <button class="chip ${cat==='ALL'?'active':''}" onclick="filterCat('ALL')">Alles</button>
    ${cats.map(c=>`<button class="chip ${cat===c?'active':''}" onclick="filterCat('${c}')">${c}</button>`).join('')}
  </div>`;
}

function filterCat(c){ cat=c; render(); }

function resultsPage(a){
  const rs = data.results.filter(r => cat==='ALL' || r.category===cat);
  a.innerHTML = `<h1>Uitslae</h1>${chips()}${resultList(rs) || empty()}`;
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
  const docs = data.docs.filter(d => d.type==='yearbook');
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

function eventsPage(a){
  a.innerHTML = `<h1>Byeenkomste & Funksies</h1>
    <div class="grid">${data.events.map(eventCard).join('') || empty()}</div>`;
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
    <h2>Konstitusie</h2><div>${nl2br(data.info.constitution)}</div></section>`;
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
  return `<section class="admin-card"><h2>Uitslag PDF</h2>
    <div class="formgrid">
      <label>Titel<input id="r_title"></label>
      <label>Kategorie<select id="r_category">${cats.map(c=>`<option>${c}</option>`).join('')}</select></label>
      <label>Datum<input id="r_date" type="date"></label>
      <label>PDF lêer<input id="r_file" type="file" accept="application/pdf,.pdf"></label>
      <label>PDF URL<input id="r_url"></label>
    </div>
    <button class="btn" onclick="addResult()">Stoor uitslag</button>
  </section>`;
}

function adminDocForm(){
  return `<section class="admin-card"><h2>Jaarboek / WPU dokument</h2>
    <div class="formgrid">
      <label>Titel<input id="d_title"></label>
      <label>Tipe<select id="d_type"><option value="yearbook">Jaarboek</option><option value="info">Inligting</option></select></label>
      <label>Datum<input id="d_date" type="date"></label>
      <label>PDF lêer<input id="d_file" type="file" accept="application/pdf,.pdf"></label>
      <label>PDF URL<input id="d_url"></label>
      <label>Nota<input id="d_note"></label>
    </div>
    <button class="btn" onclick="addDoc()">Stoor dokument</button>
  </section>`;
}

function adminInfoForm(){
  return `<section class="admin-card"><h2>WPU inligting</h2>
    <label>Oor die WPU<textarea id="i_about">${esc(data.info.about)}</textarea></label>
    <label>Kontak<textarea id="i_contacts">${esc(data.info.contacts)}</textarea></label>
    <label>Bestuur<textarea id="i_management">${esc(data.info.management)}</textarea></label>
    <label>Konstitusie / nota<textarea id="i_constitution">${esc(data.info.constitution)}</textarea></label>
    <button class="btn" onclick="saveInfo()">Stoor WPU inligting</button>
  </section>`;
}

function adminList(){
  return `<section class="admin-card"><h2>Bestaande inhoud</h2>
    <div class="small">Wenner: ${data.winners.length} • Byeenkomste: ${data.events.length} • Uitslae: ${data.results.length} • Dokumente: ${data.docs.length}</div>
    ${data.winners.map(w=>adminRow('Wenner',w.id,w.name||w.race,'deleteWinner')).join('')}
    ${data.events.map(e=>adminRow('Byeenkoms',e.id,e.title,'deleteEvent')).join('')}
    ${data.results.map(r=>adminRow('Uitslag',r.id,r.title,'deleteResult')).join('')}
    ${data.docs.map(d=>adminRow('Dokument',d.id,d.title,'deleteDoc')).join('')}
  </section>`;
}

function adminRow(type,id,title,fn){
  return `<div class="admin-row"><span><b>${esc(type)}</b> — ${esc(title)}</span>
    <button class="btn danger" onclick='${fn}(${JSON.stringify(id)})'>Verwyder</button></div>`;
}

async function requireAdmin(){
  if(!sb) throw new Error('Supabase is nie gekoppel nie.');
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

function mapCloud(w,e,r,d,i){
  return {
    winners:(w||[]).map(x=>({id:x.id,week:x.week,race:x.race,name:x.name,club:x.club,date:x.date,image:x.image_url,caption:x.caption})),
    events:(e||[]).map(x=>({id:x.id,title:x.title,date:x.date,location:x.location,description:x.description,images:Array.isArray(x.images)?x.images:[]})),
    results:(r||[]).map(x=>({id:x.id,title:x.title,category:x.category,date:x.date,url:x.pdf_url})),
    docs:(d||[]).map(x=>({id:x.id,title:x.title,type:x.type,date:x.date,url:x.url,note:x.note})),
    info:i ? {about:i.about||'',contacts:i.contacts||'',management:i.management||'',constitution:i.constitution||''} : clone(data.info)
  };
}

async function cloudLoad(options={}){
  if(!sb) return false;
  try{
    const [w,e,r,d,i] = await Promise.all([
      sb.from('weekly_winners').select('*').order('created_at',{ascending:false}),
      sb.from('events').select('*').order('created_at',{ascending:false}),
      sb.from('results').select('*').order('created_at',{ascending:false}),
      sb.from('documents').select('*').order('created_at',{ascending:false}),
      sb.from('wpu_info').select('*').eq('id',1).maybeSingle()
    ]);

    const errors = [w,e,r,d,i].filter(x=>x.error);
    if(errors.length){
      cloudOnline=false;
      console.warn('Cloud load error:',errors);
      return false;
    }

    const cloud = mapCloud(w.data,e.data,r.data,d.data,i.data);
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
    data.results.unshift({id:saved.id,title:saved.title,category:saved.category,date:saved.date,url:saved.pdf_url});
    save(); alert('Uitslag gestoor.'); render();
  }catch(e){alert('Kon nie stoor nie: '+e.message);}
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
    data.docs.unshift({id:saved.id,title:saved.title,type:saved.type,date:saved.date,url:saved.url,note:saved.note});
    save(); alert('Dokument gestoor.'); render();
  }catch(e){alert('Kon nie stoor nie: '+e.message);}
}

async function saveInfo(){
  try{
    await requireAdmin();
    const row={
      id:1,
      about:val('i_about'),
      contacts:val('i_contacts'),
      management:val('i_management'),
      constitution:val('i_constitution'),
      updated_at:new Date().toISOString()
    };
    const saved=await cloudUpsert('wpu_info',row);
    data.info={about:saved.about||'',contacts:saved.contacts||'',management:saved.management||'',constitution:saved.constitution||''};
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
  if(!url){alert('Geen PDF-skakel beskikbaar nie.');return;}
  const u=String(url);
  /* Open directly. This is more reliable on phones than an async popup. */
  const a=document.createElement('a');
  a.href=u;
  a.target='_blank';
  a.rel='noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
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

async function restoreBackup(input){
  const file=input?.files?.[0];
  if(!file) return;
  try{
    await requireAdmin();
    const text=await file.text();
    const parsed=JSON.parse(text);
    const incoming=normalizeData(parsed);
    const count=incoming.winners.length+incoming.events.length+incoming.results.length+incoming.docs.length;
    if(!confirm(`Herstel ${count} inhoud-items vanaf hierdie backup?`)) return;

    /* Upsert keeps backup IDs and avoids creating duplicates. */
    for(const w of incoming.winners){
      await cloudUpsert('weekly_winners',{
        id:w.id,week:w.week||'',race:w.race||'',name:w.name||'',club:w.club||null,
        date:w.date||null,image_url:w.image||'',caption:w.caption||''
      });
    }
    for(const e of incoming.events){
      await cloudUpsert('events',{
        id:e.id,title:e.title||'',date:e.date||null,location:e.location||'',
        description:e.description||'',images:Array.isArray(e.images)?e.images:[]
      });
    }
    for(const r of incoming.results){
      await cloudUpsert('results',{
        id:r.id,title:r.title||'',category:r.category||'WPU',date:r.date||null,pdf_url:r.url||''
      });
    }
    for(const d of incoming.docs){
      await cloudUpsert('documents',{
        id:d.id,title:d.title||'',type:d.type||'yearbook',date:d.date||null,url:d.url||'',note:d.note||''
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

    const ok=await cloudLoad({forceEmpty:true});
    if(!ok) throw new Error('Die data is gestoor, maar kon nie daarna geverifieer word nie.');
    alert('Backup is suksesvol na Supabase herstel en geverifieer.');
    render();
  }catch(e){
    alert('Backup herstel het misluk: '+e.message);
  }finally{
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
setInterval(async()=>{
  if(sb && document.visibilityState!=='hidden'){
    const before=JSON.stringify(data);
    const ok=await cloudLoad({forceEmpty:false});
    if(ok && JSON.stringify(data)!==before) render();
  }
},60000);

})();
