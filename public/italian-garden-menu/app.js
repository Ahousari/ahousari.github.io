/* Local, dependency-free desktop menu editor. */
(function(){
  'use strict';
  const M=window.MenuModel, $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>v?(/^[\d]+(?:\.\d+)?$/.test(v)?'$'+v:v):'';
  const STORAGE='italian-garden-menu-studio-v1';
  let project=M.initial(), selected=project.sections[0].id, activeTab='content', zoom=.5, undoStack=[], redoStack=[], overflow=[], saveTimer, layoutTimer, toastTimer, lastKey='', lastEdit=0, imageTarget=null, loadedRecovery=false, storageFailure=false, layoutWarnings=[], layoutErrors=[];
  let recoveryDB=null,saveRevision=0,canPersist=false;
  document.body.classList.add('loading');document.querySelectorAll('.studio,.app-header').forEach(e=>e.inert=true);$('#save-status').textContent='Opening your saved workspace…';
  function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,5000);}
  function persist(){
    if(!canPersist)return Promise.resolve(false);
    const revision=++saveRevision;
    const done=ok=>{if(revision!==saveRevision)return;storageFailure=!ok;$('#save-status').textContent=ok?'Recovery copy saved on this computer':'Recovery unavailable · save a project file';};
    if(recoveryDB){try{const tx=recoveryDB.transaction('menus','readwrite');tx.objectStore('menus').put(project,'current');return new Promise(resolve=>{tx.oncomplete=()=>{done(true);resolve(true);};tx.onerror=tx.onabort=()=>{done(false);resolve(false);};});}catch(err){done(false);return Promise.resolve(false);}}
    try{localStorage.setItem(STORAGE,JSON.stringify(project));done(true);return Promise.resolve(true);}catch(e){done(false);return Promise.resolve(false);}
  }
  async function restoreRecovery(){
    let saved;
    try{
      recoveryDB=await new Promise((resolve,reject)=>{const request=indexedDB.open('italian-garden-menu-recovery',1);request.onupgradeneeded=()=>request.result.createObjectStore('menus');request.onsuccess=()=>resolve(request.result);request.onerror=request.onblocked=()=>reject(request.error);});
      saved=await new Promise((resolve,reject)=>{const tx=recoveryDB.transaction('menus','readonly'),request=tx.objectStore('menus').get('current');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    }catch(err){recoveryDB=null;}
    try{
      if(!saved){const legacy=localStorage.getItem(STORAGE);if(legacy)saved=JSON.parse(legacy);}
      if(saved){project=M.validate(saved);selected=project.sections[0]?.id;loadedRecovery=true;canPersist=true;if(recoveryDB&&await persist())localStorage.removeItem(STORAGE);}
    }catch(err){storageFailure=true;}
  }
  function trimHistory(stack){while(stack.length>60||(stack.length>1&&stack.reduce((n,p)=>n+M.imageBytes(p),0)>100000000))stack.shift();}
  function change(mutator,{key='',panel=false,outline=false}={}){
    const now=Date.now();if(!key||key!==lastKey||now-lastEdit>900){undoStack.push(M.clone(project));trimHistory(undoStack);}lastKey=key;lastEdit=now;redoStack=[];
    mutator();$('#save-status').textContent='Saving recovery copy…';clearTimeout(saveTimer);saveTimer=setTimeout(persist,350);
    if(outline)renderOutline();if(panel)renderPanel();updateChrome();scheduleLayout();
  }
  function replace(next){undoStack.push(M.clone(project));trimHistory(undoStack);redoStack=[];project=next;selected=project.sections[0]?.id;lastKey='';renderAll();persist();}
  function scheduleLayout(){clearTimeout(layoutTimer);layoutTimer=setTimeout(renderPages,120);}
  function current(){return project.sections.find(s=>s.id===selected);}
  function findItem(id){return current()?.items.find(i=>i.id===id);}
  function updateChrome(){
    $('#project-title').textContent=project.name;$('#undo').disabled=!undoStack.length;$('#redo').disabled=!redoStack.length;
    const all=M.issues(project),pending=all.filter(i=>!i.approved).length;$('#review-badge').textContent=pending||'';
    const [w,h]=M.dimensions(project);$('#paper-label').textContent=`${+w.toFixed(2)} × ${+h.toFixed(2)} in · ${project.layout.pages} ${project.layout.pages===1?'side':'sides'}`;
    $('#print-size').textContent=`@page { size: ${w}in ${h}in; margin: 0; }`;
    $('#zoom-label').textContent=Math.round(zoom*100)+'%';
  }
  function renderOutline(){
    const query=$('#search').value.toLowerCase();$('#section-count').textContent=project.sections.length;
    $('#section-list').innerHTML=project.sections.map((s,i)=>{if(query&&!`${s.name} ${s.items.map(i=>i.name).join(' ')}`.toLowerCase().includes(query))return '';const pending=(s.review&&!s.reviewed)||s.items.some(i=>i.review&&!i.reviewed);return `<button class="section-link ${s.id===selected?'active':''}" data-select="${esc(s.id)}"><span class="section-number">${String(i+1).padStart(2,'0')}</span><span class="section-name">${esc(s.name)}</span>${pending?'<span class="review-dot" title="Owner review needed"></span>':''}<span class="count">${s.items.length}</span></button>`;}).join('')||'<p class="empty-state">No matching sections.</p>';
  }
  function select(id,itemId){selected=id;activeTab='content';renderOutline();renderPanel();$$('.menu-section').forEach(e=>e.classList.toggle('is-selected',e.dataset.section===id));if(itemId){const d=document.getElementById('edit-'+itemId);if(d){d.open=true;d.scrollIntoView({block:'nearest'});}}}
  function input(label,value,bind,type='text',extra=''){return `<label class="field">${esc(label)}<input type="${type}" value="${esc(value)}" ${bind} ${extra}></label>`;}
  function area(label,value,bind){return `<label class="field">${esc(label)}<textarea ${bind} spellcheck="true">${esc(value)}</textarea></label>`;}
  function selectField(label,value,bind,options){return `<label class="field">${esc(label)}<select ${bind}>${options.map(([v,l])=>`<option value="${esc(v)}" ${String(value)===String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;}
  function title(kicker,name,intro=''){return `<div class="panel-kicker">${esc(kicker)}</div><h1 class="panel-title">${esc(name)}</h1>${intro?`<p class="panel-intro">${esc(intro)}</p>`:''}`;}
  function reviewNote(obj,id){return obj.review?`<div class="review-note ${obj.reviewed?'approved':''}">${esc(obj.review)}<label><input type="checkbox" data-approve="${esc(id)}" ${obj.reviewed?'checked':''}> Owner reviewed this detail</label></div>`:'';}
  function photoEditor(s){
    const bind=(p,k)=>`data-photo="${esc(p.id)}" data-photo-field="${k}"`;
    return `<hr class="panel-divider"><div class="small-heading"><span>Section photos</span><span>${s.photos.length} / 12</span></div><p class="help-text">Mix banners, heading photos, and pictures among the dishes. Each photo has its own position and size.</p>`+
      s.photos.map((p,i)=>`<details class="photo-editor" data-photo-editor="${esc(p.id)}"><summary><img src="${p.src}" alt=""><span><strong>${esc(p.name)}</strong><small>${esc(M.PHOTO_PLACEMENTS.find(x=>x[0]===p.placement)?.[1])}</small></span><span class="photo-chevron">⌄</span></summary><div class="photo-editor-body"><div class="photo-presets"><button data-act="photo-preset" data-photo="${esc(p.id)}" data-preset="banner">Banner</button><button data-act="photo-preset" data-photo="${esc(p.id)}" data-preset="heading">With title</button><button data-act="photo-preset" data-photo="${esc(p.id)}" data-preset="dish" ${!s.items.length?'disabled':''}>By a dish</button><button data-act="photo-preset" data-photo="${esc(p.id)}" data-preset="cutout">Cutout</button></div>`+
      selectField('Photo placement',p.placement,bind(p,'placement'),M.PHOTO_PLACEMENTS)+
      (['before-dish','after-dish'].includes(p.placement)?selectField('Attach to dish',p.dishId,bind(p,'dishId'),s.items.map(d=>[d.id,d.name])):'')+
      `<div class="field-row">${input('Width (%)',p.width,bind(p,'width'),'number','min="15" max="100" step="5"')}${input('Height (inches)',p.height,bind(p,'height'),'number','min="0.35" max="4" step="0.05"')}</div>`+
      selectField('Shape',p.shape,bind(p,'shape'),M.PHOTO_SHAPES)+
      selectField('Fit',p.shape==='natural'?'contain':p.fit,bind(p,'fit')+(p.shape==='natural'?' disabled':''),[['cover','Crop to fill'],['contain','Show whole image']])+
      (p.placement.startsWith('heading-')?'':selectField('Alignment',p.align,bind(p,'align'),[['left','Left'],['center','Center'],['right','Right']]))+
      `<div class="field-row">${input('Focus left → right',p.cropX,bind(p,'cropX'),'number','min="0" max="100" step="5"')}${input('Focus top → bottom',p.cropY,bind(p,'cropY'),'number','min="0" max="100" step="5"')}</div>`+
      input('Caption (optional)',p.caption,bind(p,'caption'),'text','maxlength="500"')+
      (p.shape==='natural'?'<p class="help-text">Natural keeps the whole image visible. Transparent PNGs give the cutout look of the original menu; this does not remove a photo’s background.</p>':'')+
      `<div class="mini-actions"><button data-act="photo-up" data-photo="${esc(p.id)}" ${i===0?'disabled':''} aria-label="Move photo earlier">↑</button><button data-act="photo-down" data-photo="${esc(p.id)}" ${i===s.photos.length-1?'disabled':''} aria-label="Move photo later">↓</button><button data-act="replace-photo" data-photo="${esc(p.id)}">Replace</button><button data-act="duplicate-photo" data-photo="${esc(p.id)}" ${s.photos.length>=12?'disabled':''}>Duplicate</button><button data-act="remove-photo" data-photo="${esc(p.id)}" class="danger">Remove</button></div></div></details>`).join('')+
      `<button class="full-width add-dish" data-act="section-photo" ${s.photos.length>=12?'disabled':''}>＋ Add photos</button><p class="help-text">Select several images at once. Attached pictures follow their dishes. Arrows reorder photos that share a position.</p>`;
  }
  function openPhoto(id){const d=$$('[data-photo-editor]').find(e=>e.dataset.photoEditor===id);if(d){d.open=true;d.scrollIntoView({block:'nearest'});}}
  function renderPanel(){
    $$('.inspector-tabs [data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===activeTab)));
    const host=$('#inspector-body');
    if(activeTab==='content'){
      const s=current();if(!s){host.innerHTML=title('CONTENT','Your menu','Add a section to begin.');return;}
      const idx=project.sections.indexOf(s);
      host.innerHTML=title(`SECTION ${String(idx+1).padStart(2,'0')}`,s.name,`Original menu · page ${s.sourcePage||'—'} · ${s.items.length} dishes`)+
        `<div class="section-actions"><button data-act="section-up" ${idx===0?'disabled':''}>↑ Move up</button><button data-act="section-down" ${idx===project.sections.length-1?'disabled':''}>↓ Down</button><button data-act="section-delete" class="danger" title="Remove section">×</button></div>`+
        input('Section heading',s.name,'data-section-field="name"')+area('Serving notes & section prices',s.notes,'data-section-field="notes"')+
        `<div class="field-row">${selectField('Section width',Math.min(s.span,project.layout.columns),'data-section-field="span"',Array.from({length:project.layout.columns},(_,i)=>[i+1,(i+1)+' column'+(i?'s':'')]))}${selectField('Start on side',s.startPage||'auto','data-section-field="startPage"',[['auto','Automatic'],...Array.from({length:project.layout.pages},(_,i)=>[i+1,'Side '+(i+1)])])}</div>`+
        selectField('Start in column',s.startColumn||'auto','data-section-field="startColumn"',[['auto','Automatic'],...Array.from({length:project.layout.columns},(_,i)=>[i+1,'Column '+(i+1)])])+
        selectField('Dishes across within this section',s.innerColumns||1,'data-section-field="innerColumns"',[[1,'One'],[2,'Two'],[3,'Three']])+
        `<p class="help-text">Automatic sections follow your chosen arrangement. A side or column sets a preferred starting position; longer sections continue into available columns.</p>`+photoEditor(s)+reviewNote(s,'section')+
        `<hr class="panel-divider"><div class="small-heading"><span>Dishes</span><span>${s.items.length}</span></div><div id="dish-list">${s.items.map(dishEditor).join('')}</div><button class="full-width add-dish" data-act="add-dish">＋ Add a dish</button>`;
    }else if(activeTab==='style'){
      const t=project.theme;
      host.innerHTML=title('MAKE IT YOURS','A style for every table','Try all seven looks. Your dishes, prices, and menu order stay with you.')+
      `<div class="theme-grid">${M.STYLES.map(t=>`<button class="theme-card ${project.theme.id===t.id?'selected':''}" data-theme="${t.id}" aria-pressed="${project.theme.id===t.id}"><div class="theme-sample" style="--swatch-frame:${t.frame};--swatch-paper:${t.paper};--swatch-ink:${t.ink};border-width:${t.border?Math.min(8,t.border+2):0}px;${t.id==='elegant'?'border-style:double;':''}"><span class="sample-name" style="font-family:'${t.font}'">Italian Garden</span></div><strong>${t.name}</strong><small>${t.detail}</small></button>`).join('')}</div><p class="help-text">Choosing a style resets the colors, border, and font below.</p><hr class="panel-divider">`+
      `<div class="small-heading">Customize this look</div><div class="field-row">${input('Page background',t.paper,'data-theme-field="paper"','color')}${input('Frame',t.frame,'data-theme-field="frame"','color')}</div><div class="field-row">${input('Headings',t.accent,'data-theme-field="accent"','color')}${input('Dish names & prices',t.ink,'data-theme-field="ink"','color')}</div>`+
      selectField('Menu font',t.font,'data-theme-field="font"',['Georgia','Arial','Palatino Linotype','Verdana','Times New Roman'].map(f=>[f,f]))+
      input('Frame thickness (pixels)',t.border,'data-theme-field="border"','number','min="0" max="24" step="1"')+
      `<label class="field"><input type="checkbox" data-theme-field="pattern" ${t.pattern?'checked':''}> Subtle pattern on the frame</label><div class="image-control"><button data-act="background-image">Add background image</button>${project.backgroundImage?'<button data-act="clear-background">Remove</button>':''}</div><p class="help-text">Background images are kept faint so text stays readable. Use restaurant-owned or licensed photos.</p><hr class="panel-divider">`+
      `<div class="small-heading">Restaurant details</div>`+input('Restaurant name',project.restaurant.name,'data-restaurant="name"')+input('Subtitle',project.restaurant.subtitle,'data-restaurant="subtitle"')+area('Address & telephone',project.restaurant.contact,'data-restaurant="contact"')+
      `<div class="image-control"><button data-act="logo-image">${project.restaurant.logo?'Replace':'Add'} logo</button>${project.restaurant.logo?'<button data-act="clear-logo">Remove</button>':''}</div>`;
    }else if(activeTab==='layout'){
      const l=project.layout;
      host.innerHTML=title('THE PRINTED PAGE','Room to read','Choose the sheet and structure. Content never disappears to make a page fit.')+
      input('Project name',project.name,'data-project-name')+
      selectField('Paper size',l.paper,'data-layout="paper"',[['letter','Letter · 8.5 × 11 in'],['legal','Legal · 8.5 × 14 in'],['tabloid','Tabloid · 11 × 17 in'],['large','Large · 12 × 18 in'],['a4','A4 · 210 × 297 mm'],['a3','A3 · 297 × 420 mm'],['custom','Custom dimensions']])+
      (l.paper==='custom'?`<div class="field-row">${input('Width (inches)',l.width,'data-layout="width"','number','min="3" max="30" step="0.01"')}${input('Height (inches)',l.height,'data-layout="height"','number','min="3" max="30" step="0.01"')}</div>`:'')+
      selectField('Orientation',l.orientation,'data-layout="orientation"',[['portrait','Portrait'],['landscape','Landscape']])+
      selectField('Section arrangement',l.flow,'data-layout="flow"',[['balanced','Balance sections across columns'],['columns','Read down each column in order']])+
      `<div class="field-row">${input('Printed sides / pages',l.pages,'data-layout="pages"','number','min="1" max="20" step="1"')}${input('Columns per side',l.columns,'data-layout="columns"','number','min="1" max="5" step="1"')}</div><p class="help-text">Two pages make one sheet printed front and back. No folding or booklet arrangement is applied.</p>`+
      `<div class="small-heading">Column widths</div>${l.ratios.map((r,i)=>input('Column '+(i+1)+' relative width',r,`data-ratio="${i}"`,'number','min="0.5" max="3" step="0.1"')).join('')}`+
      `<div class="field-row">${input('Margins (inches)',l.margin,'data-layout="margin"','number','min="0.15" max="1.5" step="0.01"')}${input('Column gap (inches)',l.gap,'data-layout="gap"','number','min="0.05" max="0.8" step="0.01"')}</div><hr class="panel-divider"><div class="small-heading">Text & spacing</div>`+
      `<div class="field-row">${input('Dish text (points)',l.fontSize,'data-layout="fontSize"','number','min="7" max="18" step="0.5"')}${input('Headings (points)',l.headingSize,'data-layout="headingSize"','number','min="10" max="30" step="0.5"')}</div>`+
      input('Line spacing',l.lineHeight,'data-layout="lineHeight"','number','min="1" max="1.8" step="0.05"')+
      `<div class="field-row">${input('Dish spacing (pixels)',l.itemGap,'data-layout="itemGap"','number','min="0" max="16" step="1"')}${input('Section spacing (pixels)',l.sectionGap,'data-layout="sectionGap"','number','min="0" max="32" step="1"')}</div>`+
      input('Warn below (points)',l.minFont,'data-layout="minFont"','number','min="7" max="14" step="0.5"')+
      `<div class="tip">Try a larger sheet or an extra side before reducing the text size. Final readability should be checked with a print at actual size.</div>`;
    }else{
      const issues=M.issues(project),pending=issues.filter(i=>!i.approved);
      host.innerHTML=title('BEFORE PRINTING','Owner review',`${pending.length} details to confirm · ${issues.length-pending.length} reviewed`)+
      `<div class="review-warning">All content starts with the original menu. No company promotion, card fee, gratuity rule, or age limit has been added. Spelling and punctuation were cleaned up; business details still need an owner proofread.</div>`+
      `<div class="small-heading">Layout checks</div><div id="review-layout"></div><hr class="panel-divider"><div class="small-heading">Content questions</div>`+
      issues.map(i=>`<article class="review-card"><strong>${i.approved?'✓ ':''}${esc(i.title)}</strong><p>${esc(i.message)}</p><button data-review-select="${esc(i.sectionId)}" data-item="${esc(i.itemId||'')}">Review in editor →</button></article>`).join('')+
      `<div class="tip">Read the entire menu before printing. Review flags cover known source problems; they are not a guarantee that every transcription or business detail is correct.</div><button data-act="reset" class="full-width danger" style="margin-top:22px">Restore original menu draft…</button>`;
      renderReviewLayout();
    }
  }
  function dishEditor(i,index){
    const s=current();return `<details class="dish-editor" id="edit-${esc(i.id)}"><summary><span class="item-summary">${esc(i.name||'Untitled dish')}</span>${i.review&&!i.reviewed?'<span class="review-dot">●</span>':''}<span class="price-summary">${esc(i.price?money(i.price):i.variants.map(v=>money(v.price)).join(' / '))}</span></summary><div class="dish-editor-body">`+
      input('Dish name',i.name,`data-item="${esc(i.id)}" data-item-field="name"`)+
      area('Description',i.description,`data-item="${esc(i.id)}" data-item-field="description"`)+
      input('Price (leave blank for variants / section pricing)',i.price,`data-item="${esc(i.id)}" data-item-field="price"`)+
      area('Extras & substitutions',i.extras,`data-item="${esc(i.id)}" data-item-field="extras"`)+
      `<div class="small-heading">Variants / sizes</div>${i.variants.map((v,n)=>`<div class="variant-row"><input aria-label="Variant name" value="${esc(v.label)}" data-item="${esc(i.id)}" data-variant="${n}" data-variant-field="label"><input aria-label="Variant price" value="${esc(v.price)}" data-item="${esc(i.id)}" data-variant="${n}" data-variant-field="price"><button data-act="delete-variant" data-item="${esc(i.id)}" data-index="${n}" aria-label="Remove variant">×</button></div>`).join('')}<button data-act="add-variant" data-item="${esc(i.id)}" style="font-size:10px;padding:5px 8px">＋ Add variant</button>`+
      reviewNote(i,i.id)+`<div class="mini-actions"><button data-act="dish-up" data-item="${esc(i.id)}" ${index===0?'disabled':''} aria-label="Move dish up">↑</button><button data-act="dish-down" data-item="${esc(i.id)}" ${index===s.items.length-1?'disabled':''} aria-label="Move dish down">↓</button><button data-act="duplicate-dish" data-item="${esc(i.id)}">Duplicate</button><button data-act="delete-dish" data-item="${esc(i.id)}" class="danger">Remove</button></div></div></details>`;
  }
  function dishHTML(i){return `<div class="menu-dish" data-dish="${esc(i.id)}"><div class="dish-top"><span class="dish-name">${esc(i.name)}</span>${i.price?`<span class="dish-price">${esc(money(i.price))}</span>`:''}</div>${i.description?`<div class="dish-description">${esc(i.description)}</div>`:''}${i.variants.length?`<div class="dish-variants">${i.variants.map(v=>`<span>${esc(v.label)} <strong>${esc(money(v.price))}</strong></span>`).join('')}</div>`:''}${i.extras?`<div class="dish-extras">${esc(i.extras)}</div>`:''}</div>`;}
  function photoHTML(p){return `<figure class="menu-photo photo-${p.shape} photo-align-${p.align}" data-photo-id="${esc(p.id)}" style="--photo-width:${p.width}%;--photo-fraction:${p.width/100};--photo-height:${p.height}in"><img class="section-photo" src="${p.src}" alt="${esc(p.caption||p.name)}" style="object-fit:${p.shape==='natural'?'contain':p.fit};object-position:${p.cropX}% ${p.cropY}%">${p.caption?`<figcaption>${esc(p.caption)}</figcaption>`:''}</figure>`;}
  function photoGroup(photos){return photos.length?`<div class="photo-gallery">${photos.map(photoHTML).join('')}</div>`:'';}
  function sectionHTML(s,continued=false){
    const title=`<h2 class="section-title">${esc(s.name)}${continued?' <small>(continued)</small>':''}</h2>`;
    if(continued)return title;
    const left=s.photos.filter(p=>p.placement==='heading-left'),right=s.photos.filter(p=>p.placement==='heading-right');
    return photoGroup(s.photos.filter(p=>p.placement==='above'))+(left.length||right.length?`<div class="section-heading">${left.map(photoHTML).join('')}${title}${right.map(photoHTML).join('')}</div>`:title)+photoGroup(s.photos.filter(p=>p.placement==='banner'))+(s.notes?`<p class="section-notes">${esc(s.notes)}</p>`:'');
  }
  function dishWithPhotos(s,i){return `<div class="menu-dish-bundle">${photoGroup(s.photos.filter(p=>p.placement==='before-dish'&&p.dishId===i.id))}${dishHTML(i)}${photoGroup(s.photos.filter(p=>p.placement==='after-dish'&&p.dishId===i.id))}</div>`;}
  function renderPages(){
    clearTimeout(layoutTimer);const host=$('#pages');host.innerHTML='';overflow=[];layoutWarnings=[];layoutErrors=[];
    const l=project.layout,t=project.theme,[wi,hi]=M.dimensions(project),w=wi*96,h=hi*96,m=l.margin*96,gap=l.gap*96;
    const usable=w-2*m,available=usable-gap*(l.columns-1),total=l.ratios.reduce((a,b)=>a+b,0);
    const widths=l.ratios.map(r=>Math.max(1,available*r/total)),xs=widths.map((v,i)=>widths.slice(0,i).reduce((a,b)=>a+b+gap,0));
    if(usable<96||available<l.columns*48)layoutErrors.push('These page dimensions, margins, and columns leave too little usable space. Enlarge the page or reduce margins and columns.');
    const pages=[], heights=Array.from({length:l.pages},()=>Array(l.columns).fill(0));
    const vars=`--paper:${t.paper};--frame:${t.frame};--accent:${t.accent};--ink:${t.ink};--border:${t.border}px;--menu-font:'${t.font}';--body-size:${l.fontSize}pt;--heading-size:${l.headingSize}pt;--leading:${l.lineHeight};--item-gap:${l.itemGap}px;--section-gap:${l.sectionGap}px;`;
    for(let p=0;p<l.pages;p++){
      const shell=document.createElement('div');shell.className='page-shell';
      shell.innerHTML=`<div class="page-caption"><span>${p===0?'FRONT':p===1?'BACK':'SIDE '+(p+1)}</span><span>${+wi.toFixed(2)} × ${+hi.toFixed(2)} IN</span></div><div class="menu-page style-${t.id} ${t.pattern?'has-pattern':''}" style="${vars}width:${w}px;height:${h}px"><div class="page-frame"></div>${project.backgroundImage?`<div class="page-background" style="background-image:url('${project.backgroundImage}')"></div>`:''}<header class="page-header" style="top:${m}px;left:${m}px;width:${usable}px">${project.restaurant.logo?`<img class="restaurant-logo" src="${project.restaurant.logo}" alt="Restaurant logo">`:''}<h1 class="restaurant-title">${esc(project.restaurant.name)}</h1><div class="restaurant-subtitle">${esc(project.restaurant.subtitle)}</div><div class="restaurant-contact">${esc(project.restaurant.contact)}</div></header><div class="page-body" style="left:${m}px;width:${usable}px"></div><div class="page-footer" style="bottom:${Math.max(12,m/2)}px;left:${m}px;width:${usable}px">${esc(project.restaurant.name)} · ${p+1} / ${l.pages}</div></div>`;
      host.append(shell);const page=shell.querySelector('.menu-page'),header=shell.querySelector('.page-header'),body=shell.querySelector('.page-body');
      const bodyTop=m+header.offsetHeight+15,bodyHeight=Math.max(0,h-bodyTop-m-12);body.style.top=bodyTop+'px';body.style.height=bodyHeight+'px';pages.push({shell,page,body,height:bodyHeight});
    }
    let cursor={p:0,c:0};
    for(const s of project.sections){
      if(layoutErrors.length){overflow.push({section:s,items:s.items,photos:s.photos,continued:false,reason:'The page structure leaves too little usable space.'});continue;}
      const bottomPhotos=s.photos.filter(p=>p.placement==='bottom');
      const bottomRows=[];let row=[],rowWidth=0;
      bottomPhotos.forEach(photo=>{if(row.length&&rowWidth+photo.width>100){bottomRows.push(row);row=[];rowWidth=0;}row.push(photo);rowWidth+=photo.width;});if(row.length)bottomRows.push(row);
      const entries=[...s.items.map(item=>({item})),...bottomRows.map(photos=>({photos}))];
      const span=Math.min(s.span,l.columns);let p=s.startPage?Math.min(s.startPage-1,l.pages):cursor.p,c=s.startColumn?Math.min(s.startColumn-1,l.columns-1):cursor.c;
      let offset=0,continued=false,finished=false,attempts=0;
      const leaveUnplaced=reason=>{const remaining=entries.slice(offset),items=remaining.filter(e=>e.item).map(e=>e.item),ids=new Set(items.map(i=>i.id)),photoIds=new Set(remaining.flatMap(e=>(e.photos||[]).map(p=>p.id)));const photos=s.photos.filter(p=>(!continued&&['banner','above','heading-left','heading-right'].includes(p.placement))||(['before-dish','after-dish'].includes(p.placement)&&ids.has(p.dishId))||photoIds.has(p.id));overflow.push({section:s,items,photos,continued,reason});};
      const bestColumn=()=>{let best=0,bestY=Infinity;for(let j=0;j<=l.columns-span;j++){const y=Math.max(...heights[p].slice(j,j+span));if(y<bestY){bestY=y;best=j;}}return best;};
      if(l.flow==='balanced'&&!s.startColumn&&p<pages.length)c=bestColumn();
      const advance=()=>{
        c+=span;if(c+span>l.columns){c=0;p++;}
      };
      while(!finished&&attempts++<200){
        if(c+span>l.columns){c=0;p++;}
        if(p>=pages.length){leaveUnplaced('No remaining space on the chosen sides.');break;}
        const page=pages[p],y=Math.max(...heights[p].slice(c,c+span)),width=widths.slice(c,c+span).reduce((a,b)=>a+b,0)+gap*(span-1);
        const node=document.createElement('section');node.className=`menu-section ${s.id===selected?'is-selected':''} ${s.id==='pizza'?'pizza-section':''}`;node.dataset.section=s.id;
        node.dataset.span=span;node.dataset.innerColumns=s.innerColumns||1;Object.assign(node.style,{left:xs[c]+'px',top:y+'px',width:width+'px'});node.innerHTML=sectionHTML(s,continued)+'<div class="section-items"></div>';page.body.append(node);
        const itemHost=node.querySelector('.section-items');
        let added=0;
        while(offset+added<entries.length){const entry=entries[offset+added],holder=document.createElement('div');holder.innerHTML=entry.item?dishWithPhotos(s,entry.item):`<div class="section-bottom-photos">${photoGroup(entry.photos)}</div>`;const d=holder.firstElementChild;(entry.item?itemHost:node).append(d);if(node.offsetHeight+y>page.height+.5){d.remove();break;}added++;}
        const fits=node.offsetHeight+y<=page.height+.5;
        if((!added&&entries.length>offset)||!fits){
          node.remove();
          if(y<.5){leaveUnplaced('A photo, dish, or section header is too tall for an empty column. Reduce photo height, increase section width, or enlarge the page.');finished=true;}
          else advance();
          continue;
        }
        for(let j=c;j<c+span;j++)heights[p][j]=y+node.offsetHeight;
        offset+=added;continued=true;finished=offset>=entries.length;
        cursor={p,c};if(!finished){advance();cursor={p,c};}
      }
      if(attempts>=200&&!finished)leaveUnplaced('Layout could not place this section.');
    }
    if(available<l.columns*80)layoutWarnings.push('Columns are very narrow. Reduce columns or margins, or use a wider page.');
    const textElements=$$('#pages .dish-name,#pages .dish-price,#pages .dish-description,#pages .dish-extras,#pages .dish-variants,#pages .section-notes,#pages .section-title,#pages .section-title small,#pages .menu-photo figcaption,#pages .restaurant-subtitle,#pages .restaurant-contact').filter(e=>e.textContent.trim());
    const smallest=textElements.length?Math.min(...textElements.map(e=>parseFloat(getComputedStyle(e).fontSize)*.75)):l.fontSize;
    if(smallest+.01<l.minFont)layoutWarnings.push(`Some menu text uses ${smallest.toFixed(1)} pt type, below your ${l.minFont} pt warning threshold. Page-number footers are excluded from this check.`);
    if(pages.some(p=>p.page.querySelector('.page-header').scrollWidth>usable+1))layoutErrors.push('The restaurant header is clipped. Shorten its text or use a wider page.');
    const clipped=[...new Set($$('#pages .menu-section').filter(s=>[...s.querySelectorAll('.section-items,.section-heading,.photo-gallery,.menu-photo,figcaption,.dish-top,.dish-variants,.dish-description,.section-notes,.section-title')].some(e=>e.scrollWidth>e.clientWidth+2)).map(s=>project.sections.find(x=>x.id===s.dataset.section)?.name))];
    if(clipped.length)layoutErrors.push('Text extends beyond its section in: '+clipped.join(', ')+'. Shorten long prices or increase section width.');
    if(project.theme.border>m-4)layoutWarnings.push('The frame is close to the content. Increase page margins or reduce frame thickness.');
    const photoMap=new Map(project.sections.flatMap(s=>s.photos.map(p=>[p.id,p]))),softPhotos=[];
    $$('#pages .menu-photo').forEach(e=>{const p=photoMap.get(e.dataset.photoId),img=e.querySelector('img'),nw=p?.naturalWidth||img.naturalWidth,nh=p?.naturalHeight||img.naturalHeight;if(!nw||!nh)return;const sx=img.clientWidth/nw,sy=img.clientHeight/nh,scale=p.shape==='natural'||p.fit==='contain'?Math.min(sx,sy):Math.max(sx,sy);if(scale>0&&96/scale<150)softPhotos.push(p.name);});
    if(softPhotos.length)layoutWarnings.push(`${softPhotos.length} photo${softPhotos.length>1?'s may':' may'} look soft in print (below 150 pixels per inch at this size): ${[...new Set(softPhotos)].slice(0,4).join(', ')}. Use a higher-resolution image or reduce its size.`);
    const pending=M.issues(project).filter(x=>!x.approved).length,overflowCount=overflow.reduce((a,x)=>a+x.items.length,0),overflowPhotos=overflow.reduce((a,x)=>a+(x.photos?.length||0),0),totalItems=project.sections.reduce((a,s)=>a+s.items.length,0);
    $('#summary-bar').classList.toggle('warning',overflow.length>0||layoutErrors.length>0);$('#summary-bar').innerHTML=`<span>${overflow.length?`${overflowCount} dishes${overflowPhotos?' + '+overflowPhotos+' photos':''} / ${overflow.length} section fragments need more space`:layoutErrors.length?'Clipping needs attention':`${totalItems} dishes · all content placed`} · ${pending} owner review questions</span><button data-open-review>Review checks →</button>`;
    $('#layout-status').textContent=overflow.length||layoutErrors.length?'Layout needs attention':layoutWarnings.length?'Readability checks to review':'All content fits';
    const panel=$('#overflow-panel');panel.hidden=!overflow.length;
    panel.innerHTML=overflow.length?`<h3>This content still needs room</h3><p>Every dish and photo is retained in your project and shown below. PDF export is blocked until they fit. Try smaller photos, a larger sheet, more sides, or different spacing.</p><button data-add-page>Add another side</button> <button data-open-layout>Adjust page layout</button><div id="overflow-content">${overflow.map(o=>`<article><h4>${esc(o.section.name)}${o.continued?' (continued)':''}</h4><p>${esc(o.reason)}</p>${!o.continued&&o.section.notes?`<p>${esc(o.section.notes)}</p>`:''}${o.items.map(dishHTML).join('')}${(o.photos||[]).length?`<div class="unplaced-photos">${o.photos.map(p=>`<img src="${p.src}" alt="${esc(p.caption||p.name)}">`).join('')}</div>`:''}</article>`).join('')}</div>`:'';
    applyZoom();updateChrome();renderReviewLayout();
  }
  function renderReviewLayout(){const host=$('#review-layout');if(!host)return;host.innerHTML=[...(overflow.length?[`${overflow.length} section fragments do not fit. Export is blocked until all content is placed.`]:[]),...layoutErrors,...layoutWarnings].map(w=>`<div class="review-note">${esc(w)}</div>`).join('')||'<p class="help-text">All content fits within the chosen pages.</p>';}
  function applyZoom(){const [w,h]=M.dimensions(project);$$('.page-shell').forEach(s=>{s.style.width=w*96*zoom+'px';s.style.height=h*96*zoom+22+'px';s.querySelector('.menu-page').style.transform=`scale(${zoom})`;});$('#zoom-label').textContent=Math.round(zoom*100)+'%';}
  function fit(){const [w]=M.dimensions(project);zoom=Math.min(.85,Math.max(.18,($('#canvas-scroll').clientWidth-64)/(w*96)));applyZoom();}
  function renderAll(){updateChrome();renderOutline();renderPanel();renderPages();}
  async function confirmAction(heading,message,label='Continue'){
    $('#modal-content').innerHTML=`<h2>${esc(heading)}</h2><p>${esc(message)}</p>`;$('#modal-confirm').textContent=label;
    $('#modal').returnValue='cancel';$('#modal').showModal();return new Promise(resolve=>$('#modal').addEventListener('close',()=>resolve($('#modal').returnValue==='confirm'),{once:true}));
  }
  async function action(act,itemId,index,photoId,preset){
    const s=current(),item=findItem(itemId),keepOpen=itemId;let selectNew=null;
    if(['photo-preset','photo-up','photo-down','duplicate-photo','remove-photo'].includes(act)){
      const p=s?.photos.find(p=>p.id===photoId);if(!p)return;
      if(act==='duplicate-photo'&&(s.photos.length>=12||M.imageBytes(project)+p.src.length>M.PHOTO_BUDGET))return toast('Photo limit reached. Use fewer photos or smaller image files.');
      let focus=p.id;
      change(()=>{const i=s.photos.indexOf(p);
        if(act==='remove-photo')s.photos.splice(i,1);
        if(act==='duplicate-photo'){const copy={...M.clone(p),id:M.uid(),name:p.name.slice(0,290)+' (copy)'};s.photos.splice(i+1,0,copy);focus=copy.id;}
        if(act==='photo-up'&&i>0)[s.photos[i-1],s.photos[i]]=[s.photos[i],s.photos[i-1]];
        if(act==='photo-down'&&i<s.photos.length-1)[s.photos[i+1],s.photos[i]]=[s.photos[i],s.photos[i+1]];
        if(act==='photo-preset'){
          const presets={banner:{placement:'banner',width:100,height:1.2,shape:'rectangle',fit:'cover',align:'center'},heading:{placement:'heading-right',width:25,height:.8,shape:'natural',fit:'contain',align:'right'},cutout:{placement:'above',width:35,height:1.05,shape:'natural',fit:'contain',align:'right'},dish:{placement:'after-dish',width:100,height:1.05,shape:'rounded',fit:'cover',align:'center',dishId:p.dishId||s.items[0]?.id}};
          if(presets[preset])Object.assign(p,presets[preset]);
        }
      },{panel:true});if(act!=='remove-photo')openPhoto(focus);return;
    }
    if(act==='section-delete'){
      if(!await confirmAction('Remove this section?',`This removes ${s.name} and its ${s.items.length} dishes. The owner has asked to retain all original offerings until removals are approved. You can undo this change.`,'Remove section'))return;
      change(()=>{project.sections=project.sections.filter(x=>x!==s);selected=project.sections[0]?.id;},{panel:true,outline:true});return;
    }
    if(act==='delete-dish'&&!await confirmAction('Remove this dish?',`Remove ${item.name}? Retain original dishes unless the owner has approved removal. ${s.photos.some(p=>p.dishId===itemId)?'Attached photos will move to the bottom of the section. ':''}You can undo this change.`,'Remove dish'))return;
    if(act==='reset'){
      if(await confirmAction('Restore the original draft?','This replaces your current menu with the full original transcription and default design. Save a project file first if you want to keep a separate copy. You can also undo this action.','Restore draft')){replace(M.initial());toast('Original draft restored.');}return;
    }
    if(['section-photo','replace-photo','logo-image','background-image'].includes(act)){imageTarget={kind:act,id:s?.id,photoId};$('#image-input').multiple=act==='section-photo';$('#image-input').value='';$('#image-input').click();return;}
    change(()=>{
      const pos=s?project.sections.indexOf(s):0,di=s?.items.indexOf(item);
      if(act==='section-up'&&pos>0)[project.sections[pos-1],project.sections[pos]]=[project.sections[pos],project.sections[pos-1]];
      if(act==='section-down'&&pos<project.sections.length-1)[project.sections[pos+1],project.sections[pos]]=[project.sections[pos],project.sections[pos+1]];
      if(act==='clear-logo')project.restaurant.logo='';if(act==='clear-background')project.backgroundImage='';
      if(act==='add-dish'){const d={id:M.uid(),name:'New dish',description:'',price:'',extras:'',variants:[],review:'',reviewed:false};s.items.push(d);selectNew=d.id;}
      if(act==='delete-dish'){s.items.splice(di,1);s.photos.filter(p=>p.dishId===itemId).forEach(p=>{p.placement='bottom';p.dishId=null;});}
      if(act==='duplicate-dish'){const copy={...M.clone(item),id:M.uid(),name:item.name+' (copy)'};s.items.splice(di+1,0,copy);selectNew=copy.id;}
      if(act==='dish-up'&&di>0)[s.items[di-1],s.items[di]]=[s.items[di],s.items[di-1]];
      if(act==='dish-down'&&di<s.items.length-1)[s.items[di+1],s.items[di]]=[s.items[di],s.items[di+1]];
      if(act==='add-variant')item.variants.push({label:'New size',price:''});
      if(act==='delete-variant')item.variants.splice(Number(index),1);
    },{panel:true,outline:true});
    const d=document.getElementById('edit-'+(selectNew||keepOpen));if(d){d.open=true;if(selectNew)d.scrollIntoView({block:'nearest'});}
  }
  $('#section-list').addEventListener('click',e=>{const b=e.target.closest('[data-select]');if(b)select(b.dataset.select);});
  $('#search').addEventListener('input',renderOutline);
  $$('.inspector-tabs button').forEach(b=>b.addEventListener('click',()=>{activeTab=b.dataset.tab;renderPanel();}));
  $('#inspector-body').addEventListener('click',e=>{
    const theme=e.target.closest('[data-theme]');if(theme){change(()=>project.theme=M.clone(M.STYLES.find(t=>t.id===theme.dataset.theme)),{panel:true});return;}
    const review=e.target.closest('[data-review-select]');if(review){select(review.dataset.reviewSelect,review.dataset.item);return;}
    const b=e.target.closest('[data-act]');if(b)action(b.dataset.act,b.dataset.item,b.dataset.index,b.dataset.photo,b.dataset.preset);
  });
  $('#inspector-body').addEventListener('input',e=>{
    const el=e.target;if(el.tagName==='SELECT'||el.type==='checkbox')return;
    if(el.type==='number'&&!el.validity.valid)return;
    updateField(el);
  });
  $('#inspector-body').addEventListener('change',e=>{const el=e.target;if(el.tagName==='SELECT'||el.type==='checkbox')updateField(el);});
  function updateField(el){
    const d=el.dataset,s=current(),val=el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value):el.value;
    if(d.photoField){
      const p=s.photos.find(p=>p.id===d.photo);if(!p)return;
      if(d.photoField==='placement'&&['before-dish','after-dish'].includes(val)&&!s.items.length){toast('Add a dish before attaching a photo to it.');renderPanel();openPhoto(p.id);return;}
      change(()=>{p[d.photoField]=val;if(d.photoField==='placement'&&['before-dish','after-dish'].includes(val)&&!s.items.some(i=>i.id===p.dishId))p.dishId=s.items[0].id;},{key:p.id+'-'+d.photoField});
      if(['placement','shape'].includes(d.photoField)){renderPanel();openPhoto(p.id);}
    }
    else if(d.sectionField){const f=d.sectionField;change(()=>{s[f]=['span','startPage','startColumn','innerColumns'].includes(f)?(val==='auto'?null:Number(val)):val;},{key:'s-'+f,outline:f==='name'});}
    else if(d.variantField){change(()=>findItem(d.item).variants[Number(d.variant)][d.variantField]=val,{key:d.item+'-variant-'+d.variant+'-'+d.variantField});}
    else if(d.itemField){change(()=>findItem(d.item)[d.itemField]=val,{key:d.item+'-'+d.itemField});const summary=el.closest('details')?.querySelector('summary');if(summary){const item=findItem(d.item);summary.querySelector('.item-summary').textContent=item.name;summary.querySelector('.price-summary').textContent=item.price?money(item.price):item.variants.map(v=>money(v.price)).join(' / ');}}
    else if(d.themeField){change(()=>project.theme[d.themeField]=val,{key:'theme-'+d.themeField});}
    else if(d.restaurant){change(()=>project.restaurant[d.restaurant]=val,{key:'restaurant-'+d.restaurant});}
    else if('projectName'in d){change(()=>project.name=val,{key:'project-name'});}
    else if('ratio'in d){change(()=>project.layout.ratios[Number(d.ratio)]=val,{key:'ratio-'+d.ratio});}
    else if(d.layout){const f=d.layout;change(()=>{const l=project.layout;l[f]=f==='columns'||f==='pages'?Math.round(Number(val)):val;if(f==='paper'&&M.PAPER[val]){[l.width,l.height]=M.PAPER[val];}if(f==='columns'){l.ratios=Array(l.columns).fill(1);project.sections.forEach(s=>{s.span=Math.min(s.span,l.columns);if(s.startColumn>l.columns)s.startColumn=null;});}if(f==='pages')project.sections.forEach(s=>{if(s.startPage>l.pages)s.startPage=null;});},{key:'layout-'+f,panel:['paper','columns','pages'].includes(f)});}
    else if(d.approve){change(()=>{const obj=d.approve==='section'?s:findItem(d.approve);obj.reviewed=!!val;},{outline:true});el.closest('.review-note').classList.toggle('approved',val);}
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-open-review]')){activeTab='review';renderPanel();}
    if(e.target.closest('[data-open-layout]')){activeTab='layout';renderPanel();}
    if(e.target.closest('[data-add-page]')){if(project.layout.pages>=20)return toast('Maximum 20 sides. Choose a larger page or adjust the content.');change(()=>project.layout.pages++,{panel:activeTab==='layout'});}
  });
  $('#pages').addEventListener('click',e=>{const s=e.target.closest('[data-section]');if(s){const dish=e.target.closest('[data-dish]'),photo=e.target.closest('[data-photo-id]');select(s.dataset.section,dish?.dataset.dish);if(photo)openPhoto(photo.dataset.photoId);}});
  $('#add-section').addEventListener('click',()=>{change(()=>{const s={id:M.uid(),name:'New section',sourcePage:null,notes:'',items:[],review:'',reviewed:false,span:1,startPage:null,startColumn:null,innerColumns:1,photos:[]};project.sections.push(s);selected=s.id;activeTab='content';},{panel:true,outline:true});});
  function history(redo=false){const from=redo?redoStack:undoStack,to=redo?undoStack:redoStack;if(!from.length)return;to.push(M.clone(project));trimHistory(to);project=from.pop();if(!current())selected=project.sections[0]?.id;lastKey='';renderAll();persist();}
  $('#undo').addEventListener('click',()=>history());$('#redo').addEventListener('click',()=>history(true));
  document.addEventListener('keydown',e=>{if(!window.MenuStudio||!(e.ctrlKey||e.metaKey))return;if(e.key.toLowerCase()==='s'){e.preventDefault();saveProject();}if(e.key.toLowerCase()==='z'){e.preventDefault();history(e.shiftKey);}if(e.key.toLowerCase()==='p'){e.preventDefault();printProject();}});
  $('#zoom-out').addEventListener('click',()=>{zoom=Math.max(.18,zoom-.1);applyZoom();});$('#zoom-in').addEventListener('click',()=>{zoom=Math.min(1.5,zoom+.1);applyZoom();});$('#fit').addEventListener('click',fit);
  $('#fit-page').addEventListener('click',()=>{const [w,h]=M.dimensions(project),view=$('#canvas-scroll');zoom=Math.max(.18,Math.min(.85,(view.clientWidth-64)/(w*96),(view.clientHeight-80)/(h*96)));applyZoom();});
  function saveProject(){project.savedAt=new Date().toISOString();const blob=new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(project.name.replace(/[^a-z0-9 -]/gi,'').trim()||'Italian Garden')+'.menu.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),10000);persist();toast('Project file downloaded. Keep it as your editable backup.');}
  $('#save-project').addEventListener('click',saveProject);
  $('#open-project').addEventListener('click',()=>{$('#file-input').value='';$('#file-input').click();});
  $('#file-input').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>100000000)throw Error('Project is larger than 100 MB.');const next=M.validate(JSON.parse(await f.text()));if(await confirmAction('Open this project?','Your workspace will be replaced. Save a project file first if needed. You can undo opening this file.','Open project')){replace(next);toast('Editable menu project opened.');}}catch(err){toast('Could not open project: '+err.message);}});
  let imageBusy=false;
  $('#image-input').addEventListener('change',async e=>{
    const files=[...e.target.files],target={...imageTarget};if(!files.length)return;
    if(imageBusy)return toast('Please wait for the current photos to finish loading.');
    const s=project.sections.find(s=>s.id===target.id);
    if(target.kind==='section-photo'&&(!s||s.photos.length+files.length>12))return toast('Each section can have up to 12 photos.');
    if(files.some(f=>!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>5000000))return toast('Use PNG, JPEG, or WebP images smaller than 5 MB each.');
    imageBusy=true;
    try{
      const loaded=await Promise.all(files.map(async file=>{
        const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});
        const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=data;});
        if(img.width*img.height>60000000||img.width>30000||img.height>30000)throw Error('An image is too large. Resize it before adding.');
        return {data,name:file.name,naturalWidth:img.width,naturalHeight:img.height};
      }));
      const currentSection=project.sections.find(s=>s.id===target.id),oldPhoto=currentSection?.photos.find(p=>p.id===target.photoId);
      if(['section-photo','replace-photo'].includes(target.kind)&&(!currentSection||(target.kind==='replace-photo'&&!oldPhoto)))throw Error('The destination section or photo was removed.');
      const replaced=target.kind==='logo-image'?project.restaurant.logo.length:target.kind==='background-image'?project.backgroundImage.length:oldPhoto?.src.length||0;
      if(M.imageBytes(project)-replaced+loaded.reduce((n,p)=>n+p.data.length,0)>M.PHOTO_BUDGET)throw Error('This project has reached its photo storage limit. Use smaller files or remove duplicate images.');
      if(target.kind==='section-photo'&&currentSection.photos.length+loaded.length>12)throw Error('Each section can have up to 12 photos.');
      let lastPhoto;
      change(()=>{
        if(target.kind==='logo-image')project.restaurant.logo=loaded[0].data;
        else if(target.kind==='background-image')project.backgroundImage=loaded[0].data;
        else if(target.kind==='replace-photo'){const p=loaded[0];Object.assign(oldPhoto,{src:p.data,name:p.name,naturalWidth:p.naturalWidth,naturalHeight:p.naturalHeight});lastPhoto=oldPhoto.id;}
        else loaded.forEach(p=>{const photo=M.newPhoto(p.data,p.name,{naturalWidth:p.naturalWidth,naturalHeight:p.naturalHeight});currentSection.photos.push(photo);lastPhoto=photo.id;});
      },{panel:true});
      if(lastPhoto&&selected===target.id)openPhoto(lastPhoto);
      toast(`${loaded.length===1?'Photo added':'Photos added'}. Choose a position or try a photo preset.`);
    }catch(err){toast(err.message||'That image could not be read.');}finally{imageBusy=false;}
  });
  async function printProject(){
    renderPages();if(overflow.length||layoutErrors.length){activeTab='review';renderPanel();toast('Some content does not fit. Adjust the layout before printing.');return;}
    const pending=M.issues(project).filter(i=>!i.approved).length;
    const ok=await confirmAction('Print or save a PDF',`${pending?pending+' owner review questions remain. This is a draft until those details are confirmed. ':''}${layoutWarnings.length?layoutWarnings.join(' ')+' ':''}In the print dialog, choose Save as PDF or your printer, use 100% / actual size, zero margins, turn off browser headers and footers, and enable background graphics. Choose the matching paper size. For two-sided printing, check flip direction with your printer. This version does not add bleed or crop marks.`,'Open print dialog');
    if(ok){persist();document.title=project.name;window.print();}
  }
  $('#print').addEventListener('click',printProject);
  // The native browser print shortcut/menu must not silently print clipped content.
  window.addEventListener('beforeprint',()=>{renderPages();if(overflow.length||layoutErrors.length){document.body.classList.add('print-blocked');if(!$('#print-blocker')){const b=document.createElement('div');b.id='print-blocker';b.innerHTML='<h1>Menu layout needs attention</h1><p>Some menu content does not fit. Return to Menu Studio and resolve the overflow before printing.</p>';document.body.append(b);}}else document.body.classList.remove('print-blocked');});
  const safePrint=document.createElement('style');safePrint.textContent='#print-blocker{display:none}@media print{body.print-blocked>.studio{display:none!important}body.print-blocked>#print-blocker{display:block!important;position:fixed;inset:0;padding:.15in;font:10pt Arial;overflow:hidden}#print-blocker h1{font: bold 14pt Arial}}';document.head.append(safePrint);
  window.addEventListener('afterprint',()=>{document.title='Italian Garden · Menu Studio';document.body.classList.remove('print-blocked');});
  window.addEventListener('pagehide',persist);
  // Small read-only inspection surface for local verification and troubleshooting.
  async function initialize(){
    await restoreRecovery();canPersist=true;renderAll();requestAnimationFrame(fit);document.body.classList.remove('loading');document.querySelectorAll('.studio,.app-header').forEach(e=>e.inert=false);
    window.MenuStudio={getProject:()=>M.clone(project),getLayout:()=>({overflow:overflow.map(o=>({section:o.section.id,items:o.items.map(i=>i.id),photos:(o.photos||[]).map(p=>p.id)})),errors:[...layoutErrors],warnings:[...layoutWarnings]})};
    if(loadedRecovery)toast('Recovered your last workspace. Existing banner photos are kept. Save a project file for a separate backup.');
    else if(!storageFailure)$('#save-status').textContent='Ready';
    if(storageFailure)toast('Recovery storage is unavailable. Use Save project to keep your work.');
  }
  initialize();
})();
