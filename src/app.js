const app = document.querySelector('#app');
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const visualTest = new URLSearchParams(location.search).get('visualTest') === '1';
const routeKeys = ['home','scan','visualizer','compare','blends','metallic','products','quote','proposal','lead'];
const routeTitles = {home:'Home Hub',scan:'Room Scan',visualizer:'Live Visualizer',compare:'Compare Finishes',blends:'Flake Blend Studio',metallic:'Metallic Studio',products:'Products & Colors',quote:'Smart Quote',proposal:'Proposal Share',lead:'Onsite Lead Capture'};
const fixture = {
  projects:[
    {id:'fixture-project-1',name:'Residential Garage',address:'1234 Oak Ridge Dr.',squareFeet:1250,status:'Ready to Quote',date:'May 18, 2025',image:'/assets/gallery/garage-flake.jpg'},
    {id:'fixture-project-2',name:'Commercial Showroom',address:'875 Market St.',squareFeet:2100,status:'Draft',date:'May 17, 2025',image:'/assets/gallery/metallic-room.jpg'},
    {id:'fixture-project-3',name:'Outdoor Patio',address:'456 Palm Ave.',squareFeet:640,status:'In Progress',date:'May 16, 2025',image:'/assets/gallery/compare-polished.jpg'}
  ],
  lead:{id:'fixture-lead-1',customerName:'Sarah Johnson',address:'1234 Oak Ridge Dr. • Clearwater, FL 33756',email:'sarah@example.test',phone:'(555) 010-2408',squareFeet:1250,finish:'Nightfall',source:'Onsite Appointment'},
  quote:{id:'fixture-quote-1',projectId:'fixture-project-1',customerName:'John Smith',marginPercent:25,lineItems:[
    {name:'Surface Prep',description:'Diamond Grind',quantity:1250,rate:1.25},
    {name:'Base Coat',description:'Xtreme Epoxy',quantity:1250,rate:1.35},
    {name:'Flake Finish',description:'Nightfall',quantity:1250,rate:2.25},
    {name:'Top Coat',description:'Xtreme Clear Polyaspartic',quantity:1250,rate:2.75},
    {name:'Crack / Joint Repair',description:'Allowance',quantity:100,rate:2.5}
  ]},
  proposal:{id:'PRO-250518-001',quoteId:'fixture-quote-1',customerName:'John Smith',address:'1234 Oak Ridge Dr. • Clearwater, FL 33756',system:'XTREME Flake • Nightfall',timeline:'May 18, 2025 • 3 Days',warranty:'15 Year Limited Warranty',signature:{name:'',status:'not_requested'}}
};

let state = null;
let loading = true;
let error = '';
let current = routeKey();
let drawer = '';
let toastTimer = 0;
let theme = localStorage.getItem('visual-x-theme') || 'dark';
let activeProductTab = 'all';
let searchQuery = '';
let selectedSystem = localStorage.getItem('visual-x-selected-system') || 'flake-epoxy';
let selectedColor = localStorage.getItem('visual-x-selected-color') || 'FB-807';
let selectedBlend = localStorage.getItem('visual-x-selected-blend') || 'FB-807';
let selectedMetallic = localStorage.getItem('visual-x-selected-metallic') || 'CM-124';
let visualMode = 'after';
let compareSelection = 'flake';
let visualControls = JSON.parse(localStorage.getItem('visual-x-controls') || '{"gloss":80,"texture":50,"coverage":100,"opacity":62,"lighting":60,"veining":55,"contrast":72}');
let photoUrl = '';
let photoMeta = null;
let maskPoints = JSON.parse(localStorage.getItem('visual-x-mask-points') || '[[0.08,0.48],[0.55,0.43],[0.99,0.57],[0.98,0.99],[0.01,0.99]]');
let measurementAreas = JSON.parse(localStorage.getItem('visual-x-measurements') || '[{"label":"Main floor","length":25,"width":50}]');
let quoteDraft = null;
let leadDraft = null;
let proposalDraft = null;
let selectedColorCodes = JSON.parse(localStorage.getItem('visual-x-selected-colors') || '["FB-807","CM-124","524"]');
let tasks = JSON.parse(localStorage.getItem('visual-x-tasks') || '[{"label":"Send sample options","done":false},{"label":"Prepare visualization","done":false},{"label":"Follow up with estimate","done":false}]');

const iconPaths = {
  home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V21h5v-6h4v6h5V10.5"/>',
  scan:'<path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"/><path d="m8 11 4-2 4 2v5l-4 2-4-2z"/>',
  compare:'<rect x="3" y="5" width="12" height="14" rx="2"/><rect x="9" y="3" width="12" height="14" rx="2"/>',
  tag:'<path d="M20 13 11 22l-9-9V4h9z"/><circle cx="7" cy="9" r="1.5"/>',
  send:'<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  layers:'<path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  quote:'<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/><path d="M9 13h8M9 17h6"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21h-4v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3v-4h.1a1.7 1.7 0 0 0 1.5-1A1.7 1.7 0 0 0 4.3 7l-.1-.1L7 4.1l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  camera:'<path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="4"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
  ruler:'<path d="m16 3 5 5L8 21l-5-5z"/><path d="m13 6 2 2M10 9l2 2M7 12l2 2"/>',
  wand:'<path d="m15 4 5 5L9 20l-5-5z"/><path d="M6 4V1M4.5 2.5h3M19 16v-3M17.5 14.5h3"/>',
  heart:'<path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6z"/>',
  cube:'<path d="m12 2 9 5-9 5-9-5z"/><path d="m3 7 9 5v10l-9-5zM21 7l-9 5v10l9-5z"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  user:'<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
  download:'<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  link:'<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/>',
  signature:'<path d="M3 17c3-4 4-8 6-8 3 0 0 7 3 7 2 0 3-5 5-5 2 0 0 4 4 4"/><path d="M3 21h18"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
  receipt:'<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  rotate:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  upload:'<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 20h16"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'
};
function icon(name, cls=''){return `<svg class="vx-icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name]||iconPaths.cube}</svg>`;}
function escapeHtml(value=''){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function escapeAttr(value=''){return escapeHtml(value);}
function routeKey(){const queryRoute=new URLSearchParams(location.search).get('route');if(queryRoute&&routeKeys.includes(queryRoute))return queryRoute;const found=location.pathname.split('/').filter(Boolean).pop()||'home'; return routeKeys.includes(found)?found:'home';}
function navigate(key){current=routeKeys.includes(key)?key:'home';drawer='';if(location.protocol==='file:'){const q=new URLSearchParams(location.search);q.set('route',current);if(visualTest)q.set('visualTest','1');history.pushState({},'',`${location.pathname}?${q}`);}else history.pushState({},'',`/app/${current}${visualTest?'?visualTest=1':''}`);render();}
function api(path,options={}){const base=window.__VISUAL_X_API_BASE__||'';return fetch(`${base}${path}`,{headers:{'content-type':'application/json','x-actor':'visual-x-preview-operator',...(options.headers||{})},...options}).then(async r=>{const text=await r.text();let data={};try{data=text?JSON.parse(text):{};}catch{data={error:text||r.statusText};}if(!r.ok)throw new Error(data.error||`Request failed (${r.status})`);return data;});}
function newKey(prefix){return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;}
function hasVerifiedPrice(product){return product?.customerFacingEnabled===true&&product?.verificationStatus==='VERIFIED'&&Number(product?.price)>0;}
function visualProjects(){return visualTest?fixture.projects:(state?.projects||[]);}
function visualLead(){return visualTest?fixture.lead:(state?.leads?.[0]||null);}
function visualQuote(){return visualTest?fixture.quote:(state?.quotes?.[0]||null);}
function visualProposal(){return visualTest?fixture.proposal:(state?.proposals?.[0]||null);}
function statusTone(status=''){const s=status.toLowerCase();return s.includes('ready')?'ready':s.includes('draft')?'draft':s.includes('progress')?'progress':'blocked';}
function toast(message){clearTimeout(toastTimer);let root=document.querySelector('#vx-toast-root');if(!root){root=document.createElement('div');root.id='vx-toast-root';document.querySelector('.vx-screen')?.append(root);}root.innerHTML=`<div class="vx-toast" role="status" aria-live="polite">${escapeHtml(message)}</div>`;toastTimer=setTimeout(()=>{if(root)root.innerHTML='';},3200);}
function saveUi(){localStorage.setItem('visual-x-theme',theme);localStorage.setItem('visual-x-selected-system',selectedSystem);localStorage.setItem('visual-x-selected-color',selectedColor);localStorage.setItem('visual-x-selected-blend',selectedBlend);localStorage.setItem('visual-x-selected-metallic',selectedMetallic);localStorage.setItem('visual-x-controls',JSON.stringify(visualControls));localStorage.setItem('visual-x-mask-points',JSON.stringify(maskPoints));localStorage.setItem('visual-x-measurements',JSON.stringify(measurementAreas));localStorage.setItem('visual-x-selected-colors',JSON.stringify(selectedColorCodes));localStorage.setItem('visual-x-tasks',JSON.stringify(tasks));}

async function idbOpen(){return new Promise((resolve,reject)=>{const req=indexedDB.open('visual-x-assets',1);req.onupgradeneeded=()=>req.result.createObjectStore('files');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function idbSet(key,value){const db=await idbOpen();return new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
async function idbGet(key){const db=await idbOpen();return new Promise((resolve,reject)=>{const tx=db.transaction('files','readonly');const req=tx.objectStore('files').get(key);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}

function navFor(key){
 const maps={
  home:[['home','home','Home'],['visualizer','scan','Visualize'],['products','layers','Products'],['quote','quote','Quotes'],['settings','gear','Settings']],
  scan:[['home','home','Home'],['scan','scan','Scan'],['products','layers','Systems'],['quote','quote','Quote'],['settings','menu','More']],
  visualizer:[['home','home','Home'],['visualizer','scan','Visualize'],['products','layers','Colors'],['quote','quote','Quote'],['settings','gear','Settings']],
  compare:[['home','home','Home'],['compare','compare','Compare'],['products','layers','Products'],['proposal','send','Share'],['settings','menu','More']],
  blends:[['home','home','Home'],['blends','layers','Blends'],['visualizer','scan','Visualize'],['quote','quote','Quote'],['settings','gear','Settings']],
  metallic:[['home','home','Home'],['metallic','wand','Metallic'],['visualizer','scan','Preview'],['proposal','send','Share'],['settings','menu','More']],
  products:[['home','home','Home'],['products','layers','Products'],['visualizer','scan','Visualize'],['quote','quote','Quote'],['settings','gear','Settings']],
  quote:[['home','home','Home'],['quote','quote','Quote'],['products','layers','Products'],['proposal','send','Share'],['settings','gear','Settings']],
  proposal:[['home','home','Home'],['proposal','quote','Proposal'],['share','send','Share'],['sign','signature','Sign'],['settings','menu','More']],
  lead:[['home','home','Home'],['lead','user','Leads'],['visualizer','scan','Visualize'],['tasks','receipt','Tasks'],['settings','gear','Settings']]
 };
 return maps[key]||maps.home;
}
function navHtml(){return `<nav class="vx-nav" aria-label="Visual X primary navigation">${navFor(current).map(([target,ic,label])=>`<button type="button" data-nav="${escapeAttr(target)}" class="${target===current?'active':''}" aria-current="${target===current?'page':'false'}">${icon(ic)}<span>${escapeHtml(label)}</span></button>`).join('')}</nav>`;}
function statusbar(){return `<div class="vx-statusbar" aria-hidden="true"><span>9:41</span><span class="vx-island"></span><span class="vx-status-icons"><span>▮▮▮</span><span>⌁</span><span class="vx-battery"></span></span></div>`;}
function brandbar(){return `<header class="vx-brandbar"><img class="vx-brand-logo" src="/brand/visual-x.svg" alt="Visual X by Xtreme App Factory"><button class="vx-avatar" type="button" data-command="settings" aria-label="Open settings">AF</button></header>`;}
function shell(content){document.documentElement.dataset.theme=theme;document.body.classList.toggle('visual-test',visualTest);return `<div class="vx-stage"><section class="vx-device" aria-label="Visual X application"><span class="vx-side-buttons" aria-hidden="true"></span><div class="vx-screen"><span class="vx-test-banner">TEST FIXTURE VIEW</span>${statusbar()}${brandbar()}<main class="vx-main">${content}</main>${navHtml()}<div id="vx-toast-root"></div>${drawerHtml()}</div></section></div>`;}

function pageHeader(title,subtitle='',action=''){return `<div class="vx-page-header"><div>${subtitle?`<span class="vx-kicker">${escapeHtml(subtitle)}</span>`:''}<h1>${escapeHtml(title)}</h1></div>${action}</div>`;}
function emptyState(title,text,action=''){return `<div class="vx-empty"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span>${action?`<div style="margin-top:12px">${action}</div>`:''}</div>`;}
function provenanceBadge(record){const status=record?.verificationStatus||record?.pricingStatus||'COULD_NOT_VERIFY';return `<span class="vx-chip ${status==='VERIFIED'?'ready':status==='PARTIAL'?'draft':'blocked'}">${escapeHtml(status.replaceAll('_',' '))}</span>`;}
function totalArea(){return measurementAreas.reduce((sum,a)=>sum+(Number(a.length)||0)*(Number(a.width)||0),0);}
function quoteTotals(q=quoteDraft||visualQuote()){if(!q)return{subtotal:0,margin:0,total:0};const subtotal=(q.lineItems||[]).reduce((s,x)=>s+Number(x.quantity||0)*Number(x.rate||0),0);const margin=subtotal*(Number(q.marginPercent||0)/100);return{subtotal,margin,total:subtotal+margin};}
function findColor(code){return state?.colors?.find(c=>c.code===code)||null;}
function colorImage(code){return findColor(code)?.local_image||'/assets/colors/031-fb-807.png';}
function colorHex(code){return findColor(code)?.hex||'#9cff00';}
function colorName(code){const c=findColor(code);return c?.color_name||c?.name||code;}
function systemName(slug){return state?.systems?.find(s=>s.slug===slug)?.name||slug.replaceAll('-',' ');}

function homePage(){
 const projects=visualProjects();
 return `<section class="vx-page vx-page-scroll" data-route="home">
  <div class="home-hero"><img src="/assets/gallery/home-hero-photo.jpg" alt="Glossy finished garage floor"><div class="home-hero-content"><h1>Visualize Floors.<span>Close Jobs Faster.</span></h1><p>Stunning floor previews.<br>Accurate quotes. More wins.</p><button class="vx-btn primary" data-nav="scan">${icon('plus')} New Visualization ${icon('arrow','vx-icon-sm')}</button></div></div>
  <div class="home-actions">
   <button class="home-action" data-nav="scan">${icon('scan','vx-icon-lg')}<span>Scan\nSpace</span></button>
   <button class="home-action" data-nav="compare">${icon('compare','vx-icon-lg')}<span>Compare\nFinishes</span></button>
   <button class="home-action" data-nav="quote">${icon('tag','vx-icon-lg')}<span>Quote\nRange</span></button>
   <button class="home-action" data-command="proposal-share">${icon('send','vx-icon-lg')}<span>Share\nProposal</span></button>
  </div>
  <div class="vx-section-title"><h2>Recent Projects</h2><button data-command="project-list">View All ${icon('arrow','vx-icon-sm')}</button></div>
  ${projects.length?`<section class="vx-card project-list">${projects.slice(0,3).map(p=>`<article class="project-row"><img class="project-thumb" src="${escapeAttr(p.image||'/assets/gallery/garage-flake.jpg')}" alt="${escapeAttr(p.name)}"><div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.address||'Address not recorded')}</p><p>${Number(p.squareFeet||0).toLocaleString()} sq ft</p></div><div class="project-side"><span class="vx-chip ${statusTone(p.status)}">${escapeHtml(p.status||'Draft')}</span><time>${escapeHtml(p.date||new Date(p.updatedAt||Date.now()).toLocaleDateString())}</time></div></article>`).join('')}</section>`:emptyState('No verified projects yet','Create a lead or project to begin. Normal runtime does not invent project records.',`<button class="vx-btn primary compact" data-command="new-project">${icon('plus','vx-icon-sm')} Create Project</button>`)}
  <section class="vx-card vx-stat-row"><div class="vx-stat">${icon('cube')}<strong>${projects.length}</strong><small>Active Visuals</small><em>Verified runtime</em></div><div class="vx-stat">${icon('quote')}<strong>${state?.quotes?.length||0}</strong><small>Draft Quotes</small><em>Audit tracked</em></div><div class="vx-stat">${icon('send')}<strong>${state?.proposals?.length||0}</strong><small>Proposals</small><em>Delivery gated</em></div></section>
 </section>`;
}

function scanPage(){
 const displayPhoto=photoUrl||'/assets/gallery/scan-room.jpg';
 return `<section class="vx-page vx-page-scroll" data-route="scan">
  <div class="vx-photo scan-photo"><img src="${escapeAttr(displayPhoto)}" alt="Room floor ready for manual mask editing"><div class="mask-editor" data-mask-editor><svg viewBox="0 0 1000 600" preserveAspectRatio="none"><polygon points="${maskPoints.map(([x,y])=>`${x*1000},${y*600}`).join(' ')}"></polygon>${maskPoints.map(([x,y],i)=>`<circle cx="${x*1000}" cy="${y*600}" r="12" data-mask-point="${i}"></circle>`).join('')}</svg></div></div>
  <div class="vx-grid scan-tools"><button class="scan-tool" disabled title="Automatic masking requires an approved model">${icon('wand')}<span>Auto<br>Detect</span></button><button class="scan-tool active" data-command="refine-mask">${icon('scan')}<span>Refine<br>Mask</span></button><button class="scan-tool" data-command="draw-area">${icon('edit')}<span>Draw<br>Area</span></button><button class="scan-tool" data-command="measure">${icon('ruler')}<span>Measure<br>Floor</span></button></div>
  <div class="vx-grid scan-presets"><button data-preset="garage" class="active">Garage</button><button data-preset="showroom">Showroom</button><button data-preset="warehouse">Warehouse</button><button data-preset="patio">Patio</button></div>
  <section class="vx-card confidence-card"><div class="confidence-ring"><span>Manual<small>Approved mask</small></span></div><div class="confidence-details"><h3>Floor Area Verification</h3><p class="vx-muted">Automatic detection is disabled. The operator controls every point.</p><small class="vx-muted">Estimated Floor Area</small><strong>${totalArea().toLocaleString()} SQ FT</strong></div></section>
  <input class="sr-only" id="scan-file" type="file" accept="image/png,image/jpeg,image/webp">
  <button class="vx-btn primary" data-command="capture-photo">${icon('camera')} ${photoMeta?'Replace Photo':'Capture New Photo'}</button>
 </section>`;
}

function visualizerPage(){
 const selected=findColor(selectedColor)||findColor(selectedBlend)||state?.colors?.[0];
 const photo=photoUrl||'/assets/gallery/garage-flake.jpg';
 return `<section class="vx-page vx-page-scroll" data-route="visualizer">
  <div class="vx-photo visual-photo"><img src="${escapeAttr(photo)}" alt="Floor visualization preview"><div class="finish-overlay" style="--selected-color:${escapeAttr(selected?.hex||'#a0a0a0')};--finish-opacity:${Number(visualControls.opacity||62)/100}"></div><div class="vx-photo-label">${icon('cube','vx-icon-sm')} ${escapeHtml(visualProjects()[0]?.name||'Unsaved Project')}</div></div>
  <div class="vx-tabbar visual-mode-tabs"><button class="${visualMode==='before'?'active':''}" data-visual-mode="before">Before</button><button class="${visualMode==='after'?'active':''}" data-visual-mode="after">After</button><button class="${visualMode==='split'?'active':''}" data-visual-mode="split">Split View</button></div>
  <span class="vx-kicker">SYSTEM</span>
  <div class="vx-grid system-grid">${[['flake-epoxy','Flake'],['metallic-epoxy','Metallic'],['quartz-system','Quartz'],['polished-concrete','Polished'],['solid-color-epoxy','Solid Color']].map(([slug,label])=>`<button class="system-choice ${selectedSystem===slug?'active':''}" data-system="${slug}">${icon(slug.includes('metal')?'wand':'layers','vx-icon-sm')}<span>${label}</span></button>`).join('')}</div>
  <section class="vx-card visual-controls"><span class="vx-kicker">ADJUST LOOK & PERFORMANCE</span>${rangeRow('gloss','Gloss',visualControls.gloss)}${rangeRow('texture','Texture',visualControls.texture)}${rangeRow('coverage','Coverage',visualControls.coverage)}</section>
  <div class="visual-actions"><button class="vx-btn outline-accent" data-command="save-visualization">${icon('receipt')} Save Visualization</button><button class="vx-btn primary" data-nav="quote">${icon('tag')} Build Quote ${icon('arrow','vx-icon-sm')}</button></div>
  <div class="vx-notice"><strong>Approximate visualization.</strong> Color, gloss, lighting, texture, and final installation may vary.</div>
 </section>`;
}
function rangeRow(key,label,value){return `<label class="vx-range"><span>${icon(key==='gloss'?'sun':key==='texture'?'layers':'cube','vx-icon-sm')} ${label}</span><input type="range" min="0" max="100" value="${Number(value)}" data-control="${key}"><output>${Number(value)}%</output></label>`;}

function comparePage(){
 const options=[
  {key:'flake',title:'Domino Flake',subtitle:'Flake Blend',image:'/assets/gallery/compare-flake.jpg',durability:5,slip:4,install:'1–2 Days',price:'$$'},
  {key:'metallic',title:'Midnight Metallic',subtitle:'Metallic Finish',image:'/assets/gallery/compare-metallic.jpg',durability:4,slip:3,install:'2–3 Days',price:'$$$'},
  {key:'polished',title:'Polished Concrete',subtitle:'Concrete Finish',image:'/assets/gallery/compare-polished.jpg',durability:5,slip:3,install:'3–4 Days',price:'$$'}
 ];
 return `<section class="vx-page vx-page-scroll" data-route="compare">${pageHeader('Compare Floor Finishes','VISUALIZE & COMPARE MULTIPLE FLOOR FINISH OPTIONS SIDE BY SIDE',`<button class="vx-btn outline-accent compact" data-nav="scan">${icon('edit','vx-icon-sm')} Edit Room</button>`)}
  <div class="vx-grid compare-grid">${options.map((o,i)=>`<button class="vx-card compare-option ${compareSelection===o.key?'selected':''}" data-compare="${o.key}">${compareSelection===o.key?'<span class="compare-check">✓</span>':''}<span class="vx-kicker">OPTION ${String.fromCharCode(65+i)}</span><img src="${o.image}" alt="${o.title}"><h3>${o.title}</h3><p>${o.subtitle}</p></button>`).join('')}</div>
  <span class="vx-kicker">COMPARISON OVERVIEW</span>
  <section class="vx-card compare-table"><div></div>${options.map(o=>`<div>${escapeHtml(o.title.split(' ')[0])}</div>`).join('')}<div>Durability</div>${options.map(o=>`<div class="rating">${'★'.repeat(o.durability)}</div>`).join('')}<div>Slip Resistance</div>${options.map(o=>`<div>${'●'.repeat(o.slip)}${'○'.repeat(5-o.slip)}</div>`).join('')}<div>Install Time</div>${options.map(o=>`<div>${o.install}</div>`).join('')}<div>Price Range</div>${options.map(o=>`<div class="vx-accent">${o.price}</div>`).join('')}</section>
  <div class="visual-actions"><button class="vx-btn primary" data-command="compare-fullscreen">${icon('compare')} Compare Fullscreen</button><button class="vx-btn outline-accent" data-command="proposal-share">${icon('send')} Prepare Customer Share</button></div>
 </section>`;
}

function blendsPage(){
 const flakeColors=(state?.colors||[]).filter(c=>String(c.system).toLowerCase().includes('flake')).slice(0,12);
 const chosen=findColor(selectedBlend)||flakeColors[0];
 return `<section class="vx-page vx-page-scroll" data-route="blends">
  <section class="vx-card selected-finish"><img src="${escapeAttr(chosen?.local_image||'/assets/gallery/nightfall-swatch.jpg')}" alt="${escapeAttr(chosen?.color_name||'Selected blend')}"><div><span class="vx-kicker">SELECTED FLAKE BLEND</span><h2>${escapeHtml(chosen?.color_name||'Nightfall')}</h2><p>A bold, modern blend with verified local swatch imagery. Availability requires supplier confirmation.</p><div class="vx-row" style="margin-top:8px">${provenanceBadge(chosen)}<span class="vx-chip ready">Selected</span></div></div><span class="vx-chip ready">✓</span></section>
  <div class="vx-section-title"><span class="vx-kicker">EXPLORE FLAKE BLENDS</span><button data-nav="products">View All ${icon('arrow','vx-icon-sm')}</button></div>
  <div class="swatch-grid">${flakeColors.slice(0,6).map(c=>swatchButton(c,selectedBlend,'blend')).join('')}</div>
  <span class="vx-kicker">PREVIEW YOUR SPACE</span><div class="vx-photo blend-preview"><img src="/assets/gallery/nightfall-room.jpg" alt="Flake finish room preview"><div class="finish-overlay" style="--selected-color:${escapeAttr(chosen?.hex||'#777')};--finish-opacity:.28"></div></div>
  <div class="vx-grid scan-presets"><button class="active">Garage</button><button>Pool Deck</button><button>Basement</button><button>Retail</button></div>
  <span class="vx-kicker">ACTIONS</span><div class="vx-grid studio-actions"><button class="studio-action" data-command="save-favorite">${icon('heart')} Save Favorite</button><button class="studio-action" data-command="use-blend">${icon('cube')} Add to Visual</button><button class="studio-action" data-nav="quote">${icon('quote')} Attach to Quote</button></div>
 </section>`;
}
function swatchButton(c,active,type){return `<button class="swatch ${active===c.code?'active':''}" data-${type}="${escapeAttr(c.code)}"><img src="${escapeAttr(c.local_image)}" alt="${escapeAttr(c.color_name)}"><span>${escapeHtml(c.color_name)}</span></button>`;}

function metallicPage(){
 const metallic=(state?.colors||[]).filter(c=>String(c.system).toLowerCase().includes('metallic')).slice(0,8);
 const chosen=findColor(selectedMetallic)||metallic[0];
 return `<section class="vx-page vx-page-scroll" data-route="metallic">
  <div class="vx-photo metallic-preview"><img src="/assets/gallery/metallic-room.jpg" alt="Metallic floor preview"><div class="finish-overlay" style="--selected-color:${escapeAttr(chosen?.hex||'#777')};--finish-opacity:${Number(visualControls.opacity||62)/100}"></div><div class="vx-photo-label">${icon('wand','vx-icon-sm')} 3D Approximation</div></div>
  <span class="vx-kicker">METALLIC FINISHES</span><div class="swatch-grid metallic-swatches">${metallic.slice(0,6).map(c=>swatchButton(c,selectedMetallic,'metallic')).join('')}</div>
  <span class="vx-kicker">FLOOR CONTROLS</span><section class="vx-card visual-controls"><div class="vx-grid vx-grid-4">${rangeRow('contrast','Contrast',visualControls.contrast)}${rangeRow('veining','Veining',visualControls.veining)}${rangeRow('gloss','Gloss',visualControls.gloss)}${rangeRow('lighting','Lighting',visualControls.lighting)}</div></section>
  <span class="vx-kicker">POPULAR LOOKS</span><div class="vx-grid scene-grid"><button class="scene-card"><img src="/assets/gallery/metallic-room.jpg" alt="Luxe showroom"><strong>Luxe Showroom</strong><small>High contrast • Glossy</small></button><button class="scene-card"><img src="/assets/gallery/compare-metallic.jpg" alt="Modern garage"><strong>Modern Garage</strong><small>Strong veining • Dark</small></button><button class="scene-card"><img src="/assets/gallery/quote-project.jpg" alt="Retail accent"><strong>Retail Accent</strong><small>Soft bronze • Satin</small></button></div>
  <div class="visual-actions"><button class="vx-btn primary" data-command="save-visualization">${icon('receipt')} Save Scene</button><button class="vx-btn outline-accent" data-command="proposal-share">${icon('send')} Share Mockup</button></div>
 </section>`;
}

function productsPage(){
 let products=(state?.products||[]).filter(p=>activeProductTab==='all'||p.systemSlug?.includes(activeProductTab)||p.category?.toLowerCase().includes(activeProductTab));
 if(searchQuery)products=products.filter(p=>`${p.name} ${p.subtitle} ${p.description}`.toLowerCase().includes(searchQuery.toLowerCase()));
 return `<section class="vx-page vx-page-scroll" data-route="products">
  <div class="vx-tabbar product-tabs">${[['all','All Products'],['flake','Flake Blends'],['metallic','Metallics'],['solid','Solid Colors']].map(([k,l])=>`<button class="${activeProductTab===k?'active':''}" data-product-tab="${k}">${l}</button>`).join('')}</div>
  <label class="vx-field"><span class="sr-only">Search products</span><div style="position:relative">${icon('search','vx-icon-sm')}<input id="product-search" value="${escapeAttr(searchQuery)}" placeholder="Search verified local catalog" style="padding-left:42px"></div></label>
  <div class="product-list">${products.length?products.slice(0,4).map(p=>`<article class="vx-card product-row"><div><span class="vx-kicker">${escapeHtml(p.category||'SYSTEM')}</span><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.subtitle||'')}<br>${escapeHtml(p.description||'')}</p><div class="vx-row" style="margin-top:7px">${provenanceBadge(p)}<span class="vx-chip ${hasVerifiedPrice(p)?'ready':'blocked'}">${hasVerifiedPrice(p)?money.format(p.price):'Price verification required'}</span></div></div><div class="product-color-preview"><img src="${escapeAttr(p.image||'/assets/gallery/product-stack.jpg')}" alt="${escapeAttr(p.name)}"><img src="${escapeAttr(colorImage(p.systemSlug?.includes('metal')?selectedMetallic:selectedBlend))}" alt="Selected color"></div><button class="vx-icon-btn" data-product="${escapeAttr(p.id)}" aria-label="Select ${escapeAttr(p.name)}">${icon('arrow','vx-icon-sm')}</button></article>`).join(''):emptyState('No catalog match','Change the search or product category. No product is fabricated.')}</div>
  <span class="vx-kicker">YOUR SELECTIONS</span><section class="vx-card selection-tray">${selectedColorCodes.slice(0,3).map(c=>`<img src="${escapeAttr(colorImage(c))}" alt="${escapeAttr(colorName(c))}">`).join('')}<div><strong>${selectedColorCodes.length} selected</strong><small class="vx-muted" style="display:block">Availability not verified</small></div><button class="vx-btn primary compact" data-command="attach-colors">${icon('cube','vx-icon-sm')} Attach to Visualization</button></section>
 </section>`;
}

function quotePage(){
 const q=quoteDraft||visualQuote(); const project=visualProjects()[0]; const totals=quoteTotals(q);
 if(!q)return `<section class="vx-page vx-page-scroll" data-route="quote">${pageHeader('Smart Quote','DRAFT PRICING WORKSPACE')} ${emptyState('No quote yet','Create a project and enter operator-approved line items. Customer-facing pricing remains disabled until verified.',`<button class="vx-btn primary" data-command="new-quote">${icon('plus')} Create Quote Draft</button>`)}</section>`;
 return `<section class="vx-page vx-page-scroll" data-route="quote">
  <section class="vx-card quote-project"><div><span class="vx-kicker">PROJECT</span><h2>${escapeHtml(project?.name||'Project Draft')}</h2><p>${escapeHtml(project?.address||'Address pending')}</p><p>${Number(project?.squareFeet||totalArea()).toLocaleString()} SQ FT</p><div class="vx-row" style="margin-top:8px"><span class="vx-chip draft">Draft</span><span class="vx-chip blocked">Prices require approval</span></div></div><img src="/assets/gallery/quote-project.jpg" alt="Project floor"></section>
  <div class="vx-section-title"><span class="vx-kicker">LINE ITEMS</span><button class="vx-btn outline-accent compact" data-command="edit-quote">${icon('edit','vx-icon-sm')} Edit Project</button></div>
  <section class="vx-card quote-table"><div class="quote-head"><div>Item</div><div>Qty/SF</div><div>Rate</div><div>Total</div></div>${(q.lineItems||[]).map((item,i)=>`<div class="quote-line"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.description||'')}</small></div><div>${Number(item.quantity).toLocaleString()}</div><div>${money.format(item.rate)}</div><div>${money.format(Number(item.quantity)*Number(item.rate))}</div></div>`).join('')}</section>
  <section class="vx-card quote-summary"><div><span>SUBTOTAL</span><strong>${money.format(totals.subtotal)}</strong></div><div><span>MARGIN</span><strong>${Number(q.marginPercent||0)}% · ${money.format(totals.margin)}</strong></div><div class="total"><span>ESTIMATED TOTAL</span><span>${money.format(totals.total)}</span></div></section>
  <div class="estimate-range"><small>ESTIMATED PRICE RANGE</small><strong>${money.format(totals.total*.92)} – ${money.format(totals.total*1.08)}</strong><small>Range remains an internal estimate until product, labor, tax, and freight sources are approved.</small></div>
  <div class="vx-grid quote-actions"><button class="vx-btn primary" data-command="generate-proposal">${icon('quote')} Generate Proposal ${icon('arrow','vx-icon-sm')}</button><button class="vx-btn outline-accent" data-command="save-quote">${icon('receipt')} Save Draft</button></div>
 </section>`;
}

function proposalPage(){
 const p=proposalDraft||visualProposal(); const q=quoteDraft||visualQuote(); const totals=quoteTotals(q);
 if(!p)return `<section class="vx-page vx-page-scroll" data-route="proposal">${pageHeader('Proposal Share','NON-BINDING PREVIEW')} ${emptyState('No proposal draft','Generate a proposal from a saved quote. Customer delivery and legal e-signature remain disabled.',`<button class="vx-btn primary" data-nav="quote">Open Smart Quote</button>`)}</section>`;
 return `<section class="vx-page vx-page-scroll" data-route="proposal">
  <div class="proposal-cover"><img src="/assets/gallery/proposal-project.jpg" alt="Proposal project"><div class="proposal-cover-content"><div><span class="vx-kicker">PROPOSAL</span><h1>${escapeHtml(p.customerName||'Customer')}</h1><p>${escapeHtml(p.address||'Address pending')}</p></div><div><small>TOTAL PRICE</small><div class="proposal-price">${totals.total?money.format(totals.total):'Pending verification'}</div></div></div></div>
  <section class="vx-card proposal-section"><header><span class="vx-icon-tile">${icon('layers')}</span><div><h3>INCLUDED SYSTEM</h3><p>${escapeHtml(p.system||systemName(selectedSystem))}</p></div></header></section>
  <section class="vx-card proposal-section"><header><span class="vx-icon-tile">${icon('receipt')}</span><div><h3>TIMELINE</h3><p>${escapeHtml(p.timeline||'Schedule pending operator approval')}</p></div></header></section>
  <section class="vx-card proposal-section"><header><span class="vx-icon-tile">${icon('lock')}</span><div><h3>WARRANTY</h3><p>${escapeHtml(p.warranty||'Could not verify. Final contractor terms required.')}</p></div></header></section>
  <section class="vx-card proposal-section"><header><span class="vx-icon-tile">${icon('signature')}</span><div><h3>SIGNATURE</h3><p>Not requested. Legally binding e-signature is disabled pending approval.</p></div></header></section>
  <div class="vx-grid proposal-actions"><button class="proposal-action primary" data-command="copy-proposal-link">${icon('link')} Share Link</button><button class="proposal-action" data-command="download-proposal">${icon('download')} Download PDF</button><button class="proposal-action" disabled title="Legal e-signature is not enabled">${icon('signature')} Request E-Signature</button></div>
  <div class="vx-notice"><strong>Preview only.</strong> Pricing, warranty, product availability, taxes, freight, schedule, and signature terms require final contractor approval.</div>
 </section>`;
}

function leadPage(){
 const lead=leadDraft||visualLead();
 return `<section class="vx-page vx-page-scroll" data-route="lead">
  ${lead?`<section class="vx-card lead-card"><div><span class="vx-kicker">${escapeHtml(lead.source||'LEAD RECORD')}</span><h2>${escapeHtml(lead.customerName)}</h2><p>⌂ ${escapeHtml(lead.address||'Address pending')}</p><p>☎ ${escapeHtml(lead.phone||'Phone not recorded')}</p><p>▣ ${escapeHtml(lead.email||'Email not recorded')}</p><div class="vx-row" style="margin-top:8px"><span class="vx-chip ready">Operator entered</span><span class="vx-chip progress">Lead ${escapeHtml(lead.id||'draft')}</span></div></div><img src="/assets/gallery/lead-house.jpg" alt="Lead property"></section>`:emptyState('No lead selected','Enter verified contact information collected by the operator.',`<button class="vx-btn primary" data-command="new-lead">${icon('plus')} Add Lead</button>`)}
  <div class="vx-section-title"><span class="vx-kicker">SITE PHOTOS</span><button data-command="capture-photo">+ Add Photo</button></div>
  <div class="vx-grid lead-photo-grid"><div class="lead-photo"><img src="${escapeAttr(photoUrl||'/assets/gallery/scan-room.jpg')}" alt="Floor condition"><span>Floor Condition</span></div><div class="lead-photo"><img src="/assets/gallery/garage-flake.jpg" alt="Desired finish"><span>Desired Finish</span></div><div class="lead-photo"><img src="${escapeAttr(colorImage(selectedBlend))}" alt="Color swatch"><span>${escapeHtml(colorName(selectedBlend))}</span></div><button class="lead-photo" data-command="capture-photo">${icon('plus','vx-icon-lg')}<span>Add Photo</span></button></div>
  <div class="vx-section-title"><span class="vx-kicker">FOLLOW-UP TASKS</span><button data-command="tasks">View All Tasks ${icon('arrow','vx-icon-sm')}</button></div>
  <section class="vx-card" style="padding:5px 16px">${tasks.map((t,i)=>`<label class="lead-task"><input type="checkbox" data-task="${i}" ${t.done?'checked':''}><span>${escapeHtml(t.label)}</span><small>${t.done?'Complete':'Pending'}</small></label>`).join('')}</section>
  <section class="vx-card ai-card"><div class="ai-score">${lead?'82':'--'}</div><div><span class="vx-kicker">VIZZY AI</span><h3>${lead?'Next Best Action':'Awaiting verified lead'}</h3><p>${lead?'Prepare a manual visualization and internal estimate.':'No recommendation is generated without operator-entered lead data.'}</p></div><button class="vx-btn outline-accent compact" ${lead?'':'disabled'} data-nav="blends">View Suggestion</button></section>
  <div class="vx-grid lead-actions"><button class="vx-btn primary" data-nav="scan">${icon('wand')} Start Visualization</button><button class="vx-btn outline-accent" data-command="save-lead">${icon('receipt')} Save Lead</button><button class="vx-btn outline-accent" disabled title="Customer messaging is not enabled">${icon('send')} Send Follow-Up</button></div>
 </section>`;
}

function drawerHtml(){if(!drawer)return'';let body='';let title='';
 if(drawer==='settings'){title='Settings & Validation';body=`<div class="vx-drawer-body"><div class="vx-grid vx-grid-2"><button class="vx-btn ${theme==='dark'?'primary':''}" data-theme="dark">${icon('moon')} Dark Mode</button><button class="vx-btn ${theme==='light'?'primary':''}" data-theme="light">${icon('sun')} Light Mode</button></div><section class="vx-card" style="padding:14px"><div class="vx-section-title"><h2>Runtime Status</h2><span class="vx-chip ready">${escapeHtml(state?.meta?.dataMode||'normal')}</span></div><p class="vx-muted">Normal mode contains no demonstration customers, projects, quotes, or proposals. External messaging, payments, legal e-signature, and production connectors are disabled.</p></section><button class="vx-btn outline-accent" data-command="view-receipts">${icon('receipt')} View Audit Receipts (${state?.activityReceipts?.length||0})</button><button class="vx-btn" data-command="export-data">Download Runtime JSON</button><button class="vx-btn" style="border-color:var(--vx-danger);color:var(--vx-danger)" data-command="delete-account">Delete Account</button></div>`;}
 if(drawer==='project'){title='Create Verified Project';body=`<div class="vx-drawer-body"><div class="vx-field"><label for="project-name">Project name</label><input id="project-name" autocomplete="off"></div><div class="vx-field"><label for="project-address">Address</label><input id="project-address" autocomplete="street-address"></div><div class="vx-grid vx-grid-2"><div class="vx-field"><label for="project-sqft">Square feet</label><input id="project-sqft" type="number" min="0"></div><div class="vx-field"><label for="project-status">Status</label><select id="project-status"><option>Draft</option><option>In Progress</option><option>Ready to Quote</option></select></div></div><button class="vx-btn primary" data-command="create-project">Create Project</button></div>`;}
 if(drawer==='lead'){title=leadDraft?.id?'Edit Lead':'Add Verified Lead';body=`<div class="vx-drawer-body"><div class="vx-field"><label for="lead-name">Customer name</label><input id="lead-name" value="${escapeAttr(leadDraft?.customerName||'')}"></div><div class="vx-field"><label for="lead-address">Project address</label><input id="lead-address" value="${escapeAttr(leadDraft?.address||'')}"></div><div class="vx-grid vx-grid-2"><div class="vx-field"><label for="lead-phone">Phone</label><input id="lead-phone" value="${escapeAttr(leadDraft?.phone||'')}"></div><div class="vx-field"><label for="lead-email">Email</label><input id="lead-email" type="email" value="${escapeAttr(leadDraft?.email||'')}"></div></div><div class="vx-grid vx-grid-2"><div class="vx-field"><label for="lead-sqft">Square feet</label><input id="lead-sqft" type="number" min="0" value="${escapeAttr(leadDraft?.squareFeet||'')}"></div><div class="vx-field"><label for="lead-finish">Desired finish</label><input id="lead-finish" value="${escapeAttr(leadDraft?.finish||colorName(selectedBlend))}"></div></div><button class="vx-btn primary" data-command="persist-lead">${icon('receipt')} Save Lead with Audit Receipt</button></div>`;}
 if(drawer==='measurement'){title='Manual Floor Measurement';body=`<div class="vx-drawer-body"><div id="measurement-list">${measurementAreas.map((a,i)=>measurementRow(a,i)).join('')}</div><button class="vx-btn" data-command="add-area">${icon('plus')} Add Floor Area</button><section class="vx-card" style="padding:14px"><div class="vx-between vx-row"><strong>Total area</strong><strong class="vx-accent">${totalArea().toLocaleString()} SQ FT</strong></div></section><button class="vx-btn primary" data-command="save-measurement">Save Human-Approved Measurement</button></div>`;}
 if(drawer==='quote'){const q=quoteDraft||visualQuote()||blankQuote();title='Edit Internal Quote';body=`<div class="vx-drawer-body"><div class="vx-field"><label for="quote-customer">Customer</label><input id="quote-customer" value="${escapeAttr(q.customerName||'')}"></div><div class="vx-field"><label for="quote-margin">Margin percent</label><input id="quote-margin" type="number" min="0" max="1000" value="${Number(q.marginPercent||0)}"></div><div id="quote-lines">${q.lineItems.map((x,i)=>quoteLineEditor(x,i)).join('')}</div><button class="vx-btn" data-command="add-line">${icon('plus')} Add Line Item</button><div class="vx-notice"><strong>Internal draft only.</strong> Rates are entered by the operator and are not represented as current XPS pricing.</div><button class="vx-btn primary" data-command="persist-quote">Save Quote with Audit Receipt</button></div>`;}
 if(drawer==='proposal'){const p=proposalDraft||visualProposal()||{};title='Proposal Draft';body=`<div class="vx-drawer-body"><div class="vx-field"><label for="proposal-customer">Customer</label><input id="proposal-customer" value="${escapeAttr(p.customerName||'')}"></div><div class="vx-field"><label for="proposal-address">Address</label><input id="proposal-address" value="${escapeAttr(p.address||'')}"></div><div class="vx-field"><label for="proposal-system">System</label><input id="proposal-system" value="${escapeAttr(p.system||systemName(selectedSystem))}"></div><div class="vx-field"><label for="proposal-timeline">Timeline</label><input id="proposal-timeline" value="${escapeAttr(p.timeline||'Pending operator approval')}"></div><div class="vx-field"><label for="proposal-warranty">Warranty</label><input id="proposal-warranty" value="${escapeAttr(p.warranty||'Could not verify')}"></div><button class="vx-btn primary" data-command="persist-proposal">Save Non-Binding Proposal Draft</button></div>`;}
 if(drawer==='receipts'){title='Audit Receipts';body=`<div class="vx-drawer-body">${(state?.activityReceipts||[]).length?(state.activityReceipts.slice(0,12).map(r=>`<article class="vx-card" style="padding:12px"><strong>${escapeHtml(r.action)}</strong><small class="vx-muted" style="display:block">${escapeHtml(r.collection||'')} / ${escapeHtml(r.entityId||'')}</small><small class="vx-muted">${escapeHtml(r.createdAt||'')}</small><div class="vx-chip ready" style="margin-top:7px">Rollback ${r.rollback?.supported?'supported':'not available'}</div></article>`).join('')):emptyState('No receipts yet','Create or update a record to produce an audit receipt.')}</div>`;}
 return `<div class="vx-overlay" data-command="close-drawer"><section class="vx-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" data-drawer-panel><header><h2 id="drawer-title">${escapeHtml(title)}</h2><button class="vx-icon-btn" data-command="close-drawer" aria-label="Close">×</button></header>${body}</section></div>`;}
function measurementRow(a,i){return `<section class="vx-card" style="padding:12px;margin-bottom:9px"><div class="vx-grid vx-grid-3"><div class="vx-field"><label>Area label</label><input data-area-label="${i}" value="${escapeAttr(a.label||`Area ${i+1}`)}"></div><div class="vx-field"><label>Length (ft)</label><input data-area-length="${i}" type="number" min=".01" step=".01" value="${Number(a.length||0)}"></div><div class="vx-field"><label>Width (ft)</label><input data-area-width="${i}" type="number" min=".01" step=".01" value="${Number(a.width||0)}"></div></div><div class="vx-between vx-row" style="margin-top:8px"><strong>${((Number(a.length)||0)*(Number(a.width)||0)).toLocaleString()} SQ FT</strong><button class="vx-icon-btn" data-remove-area="${i}" aria-label="Remove area">${icon('trash','vx-icon-sm')}</button></div></section>`;}
function blankQuote(){return{customerName:visualLead()?.customerName||'',projectId:visualProjects()[0]?.id||'',marginPercent:25,lineItems:[{name:'Surface Preparation',description:'Operator-entered allowance',quantity:totalArea(),rate:0},{name:'Floor System',description:systemName(selectedSystem),quantity:totalArea(),rate:0},{name:'Finish',description:colorName(selectedColor),quantity:totalArea(),rate:0}]};}
function quoteLineEditor(x,i){return `<section class="vx-card" style="padding:12px;margin-bottom:9px"><div class="vx-grid vx-grid-2"><div class="vx-field"><label>Item</label><input data-line-name="${i}" value="${escapeAttr(x.name)}"></div><div class="vx-field"><label>Description</label><input data-line-description="${i}" value="${escapeAttr(x.description||'')}"></div><div class="vx-field"><label>Quantity</label><input data-line-quantity="${i}" type="number" min="0" value="${Number(x.quantity||0)}"></div><div class="vx-field"><label>Rate</label><input data-line-rate="${i}" type="number" min="0" step=".01" value="${Number(x.rate||0)}"></div></div><button class="vx-btn ghost compact" data-remove-line="${i}">${icon('trash','vx-icon-sm')} Remove</button></section>`;}

function render(){
 if(loading){app.innerHTML=shell('<div class="vx-loading"><div><div class="vx-spinner"></div><p class="vx-muted">Loading verified runtime…</p></div></div>');return;}
 if(error){app.innerHTML=shell(`<section class="vx-page"><div class="vx-empty"><strong>Runtime unavailable</strong><span>${escapeHtml(error)}</span><div style="margin-top:12px"><button class="vx-btn primary" data-command="reload">Retry</button></div></div></section>`);return;}
 const pages={home:homePage,scan:scanPage,visualizer:visualizerPage,compare:comparePage,blends:blendsPage,metallic:metallicPage,products:productsPage,quote:quotePage,proposal:proposalPage,lead:leadPage};
 app.innerHTML=shell(pages[current]());
}

async function load(){loading=true;error='';render();try{state=await api('/api/state');quoteDraft=structuredClone(visualQuote()||state.quotes?.[0]||null);leadDraft=structuredClone(visualLead()||state.leads?.[0]||null);proposalDraft=structuredClone(visualProposal()||state.proposals?.[0]||null);const stored=await idbGet('latest-photo').catch(()=>null);if(stored?.dataUrl){photoUrl=stored.dataUrl;photoMeta=stored.meta;}loading=false;render();}catch(e){loading=false;error=e.message;render();}}

async function createRecord(collection,payload){const key=newKey(collection);const result=await api(`/api/v2/${collection}`,{method:'POST',headers:{'idempotency-key':key},body:JSON.stringify(payload)});state=await api('/api/state');return result;}
async function updateRecord(collection,id,payload){const result=await api(`/api/v2/${collection}/${id}`,{method:'PATCH',headers:{'idempotency-key':newKey(`${collection}-update`)},body:JSON.stringify(payload)});state=await api('/api/state');return result;}

function syncDrawerInputs(target){
 if(drawer==='lead'){leadDraft||={};if(target.id==='lead-name')leadDraft.customerName=target.value;if(target.id==='lead-address')leadDraft.address=target.value;if(target.id==='lead-phone')leadDraft.phone=target.value;if(target.id==='lead-email')leadDraft.email=target.value;if(target.id==='lead-sqft')leadDraft.squareFeet=Number(target.value);if(target.id==='lead-finish')leadDraft.finish=target.value;}
 if(drawer==='measurement'){const index=Number(target.dataset.areaLabel??target.dataset.areaLength??target.dataset.areaWidth);if(Number.isInteger(index)&&measurementAreas[index]){if(target.dataset.areaLabel!==undefined)measurementAreas[index].label=target.value;if(target.dataset.areaLength!==undefined)measurementAreas[index].length=Number(target.value);if(target.dataset.areaWidth!==undefined)measurementAreas[index].width=Number(target.value);}}
 if(drawer==='quote'){quoteDraft||=blankQuote();if(target.id==='quote-customer')quoteDraft.customerName=target.value;if(target.id==='quote-margin')quoteDraft.marginPercent=Number(target.value);const idx=Number(target.dataset.lineName??target.dataset.lineDescription??target.dataset.lineQuantity??target.dataset.lineRate);if(Number.isInteger(idx)&&quoteDraft.lineItems[idx]){if(target.dataset.lineName!==undefined)quoteDraft.lineItems[idx].name=target.value;if(target.dataset.lineDescription!==undefined)quoteDraft.lineItems[idx].description=target.value;if(target.dataset.lineQuantity!==undefined)quoteDraft.lineItems[idx].quantity=Number(target.value);if(target.dataset.lineRate!==undefined)quoteDraft.lineItems[idx].rate=Number(target.value);}}
 if(drawer==='proposal'){proposalDraft||={};if(target.id==='proposal-customer')proposalDraft.customerName=target.value;if(target.id==='proposal-address')proposalDraft.address=target.value;if(target.id==='proposal-system')proposalDraft.system=target.value;if(target.id==='proposal-timeline')proposalDraft.timeline=target.value;if(target.id==='proposal-warranty')proposalDraft.warranty=target.value;}
}

app.addEventListener('click',async event=>{
 const target=event.target.closest('button,[data-command],[data-nav]');if(!target)return;
 if(target.closest('[data-drawer-panel]')===null&&target.classList.contains('vx-overlay')){drawer='';render();return;}
 if(target.dataset.nav){const key=target.dataset.nav;if(key==='settings'){drawer='settings';render();return;}if(key==='share'){return copyProposalLink();}if(key==='sign'){return toast('Legally binding e-signature is disabled pending external approval.');}if(key==='tasks'){drawer='lead';render();return;}navigate(key);return;}
 if(target.dataset.theme){theme=target.dataset.theme;saveUi();await createThemePreference().catch(()=>{});render();return;}
 if(target.dataset.system){selectedSystem=target.dataset.system;saveUi();render();return;}
 if(target.dataset.compare){compareSelection=target.dataset.compare;render();return;}
 if(target.dataset.blend){selectedBlend=target.dataset.blend;selectedColor=selectedBlend;saveUi();render();return;}
 if(target.dataset.metallic){selectedMetallic=target.dataset.metallic;selectedColor=selectedMetallic;saveUi();render();return;}
 if(target.dataset.productTab){activeProductTab=target.dataset.productTab;render();return;}
 if(target.dataset.product){toast('Product selected for internal visualization. Customer pricing remains disabled until verified.');return;}
 if(target.dataset.visualMode){visualMode=target.dataset.visualMode;const overlay=document.querySelector('.finish-overlay');if(overlay)overlay.style.opacity=visualMode==='before'?'0':visualMode==='after'?'1':'.58';render();return;}
 if(target.dataset.removeArea!==undefined){measurementAreas.splice(Number(target.dataset.removeArea),1);if(!measurementAreas.length)measurementAreas.push({label:'Main floor',length:1,width:1});saveUi();render();return;}
 if(target.dataset.removeLine!==undefined){quoteDraft.lineItems.splice(Number(target.dataset.removeLine),1);render();return;}
 const command=target.dataset.command;if(!command)return;
 try{
  if(command==='settings'){drawer='settings';render();}
  if(command==='close-drawer'){drawer='';render();}
  if(command==='reload')load();
  if(command==='new-project'){drawer='project';render();}
  if(command==='create-project')await createProject();
  if(command==='new-lead'){leadDraft={customerName:'',address:'',phone:'',email:'',squareFeet:0,finish:''};drawer='lead';render();}
  if(command==='save-lead'){drawer='lead';render();}
  if(command==='persist-lead')await persistLead();
  if(command==='capture-photo')document.querySelector('#scan-file')?.click()||document.querySelector('#lead-file')?.click();
  if(command==='refine-mask')toast('Drag the visible mask points to refine the operator-controlled floor area.');
  if(command==='draw-area'){maskPoints=[[.12,.52],[.48,.44],[.88,.5],[.96,.94],[.08,.94]];saveUi();render();toast('Manual polygon reset. Drag points to refine.');}
  if(command==='measure'){drawer='measurement';render();}
  if(command==='add-area'){measurementAreas.push({label:`Area ${measurementAreas.length+1}`,length:1,width:1});render();}
  if(command==='save-measurement')await persistMeasurement();
  if(command==='save-visualization')await persistVisualization();
  if(command==='compare-fullscreen')toast('Comparison is already displayed at the maximum in-app width.');
  if(command==='proposal-share')navigate('proposal');
  if(command==='save-favorite')toast(`${colorName(selectedBlend)} saved as a local operator favorite.`);
  if(command==='use-blend'){selectedColor=selectedBlend;selectedSystem='flake-epoxy';saveUi();navigate('visualizer');}
  if(command==='attach-colors'){selectedColor=selectedColorCodes[0]||selectedColor;saveUi();navigate('visualizer');}
  if(command==='new-quote'){quoteDraft=blankQuote();drawer='quote';render();}
  if(command==='edit-quote'){quoteDraft||=blankQuote();drawer='quote';render();}
  if(command==='add-line'){quoteDraft||=blankQuote();quoteDraft.lineItems.push({name:'New line item',description:'Operator-entered',quantity:0,rate:0});render();}
  if(command==='persist-quote'||command==='save-quote')await persistQuote();
  if(command==='generate-proposal'){await persistQuote();proposalDraft={quoteId:quoteDraft.id,customerName:quoteDraft.customerName||leadDraft?.customerName||'Operator review required',address:visualProjects()[0]?.address||leadDraft?.address||'',system:`${systemName(selectedSystem)} • ${colorName(selectedColor)}`,timeline:'Pending operator approval',warranty:'Could not verify. Final contractor terms required.',signature:{status:'not_requested'}};drawer='proposal';render();}
  if(command==='persist-proposal')await persistProposal();
  if(command==='copy-proposal-link')copyProposalLink();
  if(command==='download-proposal')downloadProposalPdf();
  if(command==='view-receipts'){drawer='receipts';render();}
  if(command==='export-data')download(JSON.stringify(state,null,2),'visual-x-runtime.json','application/json');if(command==='delete-account'){if(confirm('This will permanently delete your account. Continue?')){try{const r=await fetch('/api/auth/me',{method:'DELETE'});if(r.ok){localStorage.clear();location.href='/login';}else throw new Error('Delete failed');}catch(e){toast('Account deletion failed: '+e.message);}}}
  if(command==='project-list')toast(`${visualProjects().length} project record(s) available in the current runtime mode.`);
  if(command==='tasks'){drawer='lead';render();}
 }catch(e){toast(e.message);}
});

app.addEventListener('input',event=>{
 const target=event.target;
 if(target.id==='product-search'){searchQuery=target.value;render();return;}
 if(target.dataset.control){visualControls[target.dataset.control]=Number(target.value);saveUi();const output=target.parentElement.querySelector('output');if(output)output.textContent=`${target.value}%`;const overlay=document.querySelector('.finish-overlay');if(overlay&&target.dataset.control==='opacity')overlay.style.setProperty('--finish-opacity',Number(target.value)/100);return;}
 syncDrawerInputs(target);
});

app.addEventListener('change',async event=>{
 const target=event.target;
 if(target.id==='scan-file'&&target.files?.[0]){const file=target.files[0];if(!['image/jpeg','image/png','image/webp'].includes(file.type))return toast('Only JPEG, PNG, and WebP images are supported.');if(file.size>12_000_000)return toast('The image exceeds the 12 MB preview limit.');const reader=new FileReader();reader.onload=async()=>{photoUrl=String(reader.result);photoMeta={fileName:file.name,mimeType:file.type,sizeBytes:file.size};await idbSet('latest-photo',{dataUrl:photoUrl,meta:photoMeta});render();toast('Photo stored locally in this browser. Save the project to create backend metadata.');};reader.readAsDataURL(file);}
 if(target.dataset.task!==undefined){tasks[Number(target.dataset.task)].done=target.checked;saveUi();toast('Task status saved locally.');}
});

let draggingPoint=null;
app.addEventListener('pointerdown',event=>{const p=event.target.closest('[data-mask-point]');if(p){draggingPoint=Number(p.dataset.maskPoint);p.setPointerCapture?.(event.pointerId);}});
app.addEventListener('pointermove',event=>{if(draggingPoint===null)return;const editor=document.querySelector('[data-mask-editor]');if(!editor)return;const rect=editor.getBoundingClientRect();const x=Math.min(1,Math.max(0,(event.clientX-rect.left)/rect.width));const y=Math.min(1,Math.max(0,(event.clientY-rect.top)/rect.height));maskPoints[draggingPoint]=[x,y];const svg=editor.querySelector('svg');svg.querySelector('polygon').setAttribute('points',maskPoints.map(([px,py])=>`${px*1000},${py*600}`).join(' '));const circle=svg.querySelector(`[data-mask-point="${draggingPoint}"]`);circle.setAttribute('cx',x*1000);circle.setAttribute('cy',y*600);});
app.addEventListener('pointerup',()=>{if(draggingPoint!==null){saveUi();draggingPoint=null;toast('Manual mask point updated.');}});
window.addEventListener('popstate',()=>{current=routeKey();drawer='';render();});

async function createProject(){const name=document.querySelector('#project-name')?.value.trim();if(!name)throw new Error('Project name is required.');const payload={name,address:document.querySelector('#project-address')?.value.trim()||'',squareFeet:Number(document.querySelector('#project-sqft')?.value||0),status:document.querySelector('#project-status')?.value||'Draft',image:'/assets/gallery/garage-flake.jpg'};const result=await createRecord('projects',payload);drawer='';render();toast(`Project created. Receipt ${result.receipt.id}`);}
async function persistLead(){if(!leadDraft?.customerName?.trim())throw new Error('Customer name is required.');let result;if(leadDraft.id&&!String(leadDraft.id).startsWith('fixture-'))result=await updateRecord('leads',leadDraft.id,leadDraft);else result=await createRecord('leads',{customerName:leadDraft.customerName,address:leadDraft.address||'',phone:leadDraft.phone||'',email:leadDraft.email||'',squareFeet:Number(leadDraft.squareFeet||0),finish:leadDraft.finish||'',source:'operator-entered'});leadDraft=structuredClone(result.record);drawer='';render();toast(`Lead saved. Receipt ${result.receipt.id}`);}
async function persistMeasurement(){const project=visualProjects()[0]||state.projects?.[0];if(!project)throw new Error('Create a project before saving a measurement.');if(measurementAreas.some(a=>Number(a.length)<=0||Number(a.width)<=0))throw new Error('Every area requires a positive length and width.');const payload={projectId:project.id,areas:measurementAreas,approved:true,totalSquareFeet:totalArea(),revision:(state.measurements?.length||0)+1};const result=await createRecord('measurements',payload);drawer='';render();toast(`Measurement saved. Receipt ${result.receipt.id}`);}
async function persistPhotoMetadata(projectId){if(!photoMeta)return null;return createRecord('photos',{projectId,fileName:photoMeta.fileName,mimeType:photoMeta.mimeType,sizeBytes:photoMeta.sizeBytes,storage:'indexeddb-preview',orientationVerified:true});}
async function persistMask(projectId,photoId){return createRecord('masks',{projectId,photoId,points:maskPoints.map(([x,y])=>({x,y})),approved:true,method:'manual-operator'});}
async function persistVisualization(){const project=visualProjects()[0]||state.projects?.[0];if(!project)throw new Error('Create a project before saving a visualization.');let photo=state.photos?.[0]||null;if(!photo&&photoMeta)photo=(await persistPhotoMetadata(project.id)).record;if(!photo)throw new Error('Upload a project photo before saving a visualization.');let mask=state.masks?.find(m=>m.photoId===photo.id)||null;if(!mask)mask=(await persistMask(project.id,photo.id)).record;const payload={projectId:project.id,maskId:mask.id,systemSlug:selectedSystem,colorCode:selectedColor,opacity:Number(visualControls.opacity)/100,gloss:Number(visualControls.gloss)/100,texture:Number(visualControls.texture)/100,coverage:Number(visualControls.coverage)/100,approximationLabel:'Approximate visualization. Final installation may vary.',previewAsset:photoMeta?'indexeddb-preview':'/assets/gallery/garage-flake.jpg'};const result=await createRecord('visualizations',payload);render();toast(`Visualization saved. Receipt ${result.receipt.id}`);}
async function persistQuote(){quoteDraft||=blankQuote();const project=visualProjects()[0]||state.projects?.[0];if(!project)throw new Error('Create a project before saving a quote.');if(!quoteDraft.lineItems.length)throw new Error('At least one line item is required.');if(quoteDraft.lineItems.some(x=>Number(x.quantity)<0||Number(x.rate)<0||!x.name.trim()))throw new Error('Line items require a name and non-negative quantity and rate.');const payload={...quoteDraft,projectId:project.id,revision:Number(quoteDraft.revision||0)+1,pricingStatus:'operator-entered-unverified',customerFacingEnabled:false};let result;if(quoteDraft.id&&!String(quoteDraft.id).startsWith('fixture-'))result=await updateRecord('quotes',quoteDraft.id,payload);else result=await createRecord('quotes',payload);quoteDraft=structuredClone(result.record);drawer='';render();toast(`Quote saved. Receipt ${result.receipt.id}`);return result;}
async function persistProposal(){if(!proposalDraft?.customerName?.trim())throw new Error('Customer name is required.');if(!quoteDraft?.id)await persistQuote();const payload={...proposalDraft,quoteId:quoteDraft.id,version:Number(proposalDraft.version||0)+1,status:'draft',deliveryEnabled:false,legalEsignEnabled:false};let result;if(proposalDraft.id&&!String(proposalDraft.id).startsWith('PRO-')&&!String(proposalDraft.id).startsWith('fixture-'))result=await updateRecord('proposals',proposalDraft.id,payload);else result=await createRecord('proposals',payload);proposalDraft=structuredClone(result.record);drawer='';render();toast(`Proposal draft saved. Receipt ${result.receipt.id}`);}
async function createThemePreference(){if(!state)return;const existing=state.themePreferences?.find(x=>x.userId==='preview-operator');if(existing)return updateRecord('theme-preferences',existing.id,{theme});return createRecord('theme-preferences',{userId:'preview-operator',theme});}
function copyProposalLink(){const url=`${location.origin}/app/proposal`;navigator.clipboard?.writeText(url).then(()=>toast('Preview proposal link copied. No customer message was sent.')).catch(()=>toast(url));}
function download(content,name,type){const blob=new Blob([content],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
function downloadProposalPdf(){const p=proposalDraft||visualProposal();const q=quoteDraft||visualQuote();if(!p)return toast('No proposal draft is available.');const totals=quoteTotals(q);const lines=['VISUAL X PROPOSAL PREVIEW',`Proposal: ${p.id||'Draft'}`,`Customer: ${p.customerName||''}`,`Address: ${p.address||''}`,`System: ${p.system||systemName(selectedSystem)}`,`Estimated total: ${totals.total?money.format(totals.total):'Pending verification'}`,'','This document is a non-binding preview.','Pricing, availability, warranty, schedule, taxes, freight, and signatures require final contractor approval.'];const pdf=makePdf(lines);download(pdf,`${p.id||'visual-x-proposal-preview'}.pdf`,'application/pdf');toast('Non-binding PDF preview downloaded.');}
function pdfEscape(s){return String(s).replace(/([\\()])/g,'\\$1').replace(/[^\x20-\x7E]/g,'?');}
function makePdf(lines){const content=['BT','/F1 18 Tf','72 740 Td'];lines.forEach((line,i)=>{if(i===0)content.push(`(${pdfEscape(line)}) Tj`,'0 -28 Td','/F1 11 Tf');else content.push(`(${pdfEscape(line)}) Tj`,'0 -18 Td');});content.push('ET');const stream=content.join('\n');const objects=[null,'<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>',`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>`,`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];let out='%PDF-1.4\n';const offsets=[0];for(let i=1;i<objects.length;i++){offsets[i]=out.length;out+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}const xref=out.length;out+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let i=1;i<objects.length;i++)out+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;out+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return out;}

load();