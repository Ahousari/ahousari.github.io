/* Local, dependency-free desktop menu editor. */
(function(){
  'use strict';
  const M=window.MenuModel, $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>v?(/^[\d]+(?:\.\d+)?$/.test(v)?'$'+v:v):'';
  const STORAGE='italian-garden-menu-studio-v1';
  let project=M.initial(), selected=project.sections[0].id, activeTab='content', zoom=.5, undoStack=[], redoStack=[], overflow=[], saveTimer, layoutTimer, toastTimer, lastKey='', lastEdit=0, imageTarget=null, loadedRecovery=false, storageFailure=false, layoutWarnings=[], layoutErrors=[];
  try{const saved=localStorage.getItem(STORAGE);if(saved){project=M.validate(JSON.parse(saved));selected=project.sections[0]?.id;loadedRecovery=true;}}catch(e){storageFailure=true;}
  function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,5000);}
  function persist(){try{localStorage.setItem(STORAGE,JSON.stringify(project));$('#save-status').textContent='Recovery copy saved on this computer';storageFailure=false;}catch(e){storageFailure=true;$('#save-status').textContent='Recovery unavailable · save a project file';}}
  function change(mutator,{key='',panel=false,outline=false}={}){
    const now=Date.now();if(!key||key!==lastKey||now-lastEdit>900){undoStack.push(M.clone(project));if(undoStack.length>60)undoStack.shift();}lastKey=key;lastEdit=now;redoStack=[];
    mutator();$('#save-status').textContent='Saving recovery copy…';clearTimeout(saveTimer);saveTimer=setTimeout(persist,350);
    if(outline)renderOutline();if(panel)renderPanel();updateChrome();scheduleLayout();
  }
  function replace(next){undoStack.push(M.clone(project));redoStack=[];project=next;selected=project.sections[0]?.id;lastKey='';renderAll();persist();}
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
        `<p class="help-text">Automatic sections follow your chosen arrangement. A side or column sets a preferred starting position; longer sections continue into available columns.</p><div class="image-control"><button data-act="section-photo">${s.photo?'Replace':'Add'} food photo</button>${s.photo?'<button data-act="clear-photo">Remove photo</button>':''}</div>`+(s.photo?selectField('Photo crop focus',s.photoPosition||'center','data-section-field="photoPosition"',[['top','Top'],['center','Center'],['bottom','Bottom']]):'')+reviewNote(s,'section')+
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
  function sectionHTML(s,continued=false){return `<h2 class="section-title">${esc(s.name)}${continued?' <small>(continued)</small>':''}</h2>${!continued&&s.photo?`<img class="section-photo" style="object-position:${['top','center','bottom'].includes(s.photoPosition)?s.photoPosition:'center'}" src="${s.photo}" alt="${esc(s.name)}">`:''}${!continued&&s.notes?`<p class="section-notes">${esc(s.notes)}</p>`:''}`;}
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
      if(layoutErrors.length){overflow.push({section:s,items:s.items,continued:false,reason:'The page structure leaves too little usable space.'});continue;}
      const span=Math.min(s.span,l.columns);let p=s.startPage?Math.min(s.startPage-1,l.pages):cursor.p,c=s.startColumn?Math.min(s.startColumn-1,l.columns-1):cursor.c;
      let offset=0,continued=false,finished=false,attempts=0;
      const bestColumn=()=>{let best=0,bestY=Infinity;for(let j=0;j<=l.columns-span;j++){const y=Math.max(...heights[p].slice(j,j+span));if(y<bestY){bestY=y;best=j;}}return best;};
      if(l.flow==='balanced'&&!s.startColumn&&p<pages.length)c=bestColumn();
      const advance=()=>{
        c+=span;if(c+span>l.columns){c=0;p++;}
      };
      while(!finished&&attempts++<200){
        if(c+span>l.columns){c=0;p++;}
        if(p>=pages.length){overflow.push({section:s,items:s.items.slice(offset),continued,reason:'No remaining space on the chosen sides.'});break;}
        const page=pages[p],y=Math.max(...heights[p].slice(c,c+span)),width=widths.slice(c,c+span).reduce((a,b)=>a+b,0)+gap*(span-1);
        const node=document.createElement('section');node.className=`menu-section ${s.id===selected?'is-selected':''} ${s.id==='pizza'?'pizza-section':''}`;node.dataset.section=s.id;
        node.dataset.span=span;node.dataset.innerColumns=s.innerColumns||1;Object.assign(node.style,{left:xs[c]+'px',top:y+'px',width:width+'px'});node.innerHTML=sectionHTML(s,continued)+'<div class="section-items"></div>';page.body.append(node);
        const itemHost=node.querySelector('.section-items');
        let added=0;
        while(offset+added<s.items.length){const item=document.createElement('div');item.innerHTML=dishHTML(s.items[offset+added]);const d=item.firstElementChild;itemHost.append(d);if(node.offsetHeight+y>page.height+.5){d.remove();break;}added++;}
        const fits=node.offsetHeight+y<=page.height+.5;
        if((!added&&s.items.length>offset)||!fits){
          node.remove();
          if(y<.5){overflow.push({section:s,items:s.items.slice(offset),continued,reason:'A dish or section header is too tall for an empty column. Increase section width, shorten text, or enlarge the page.'});finished=true;}
          else advance();
          continue;
        }
        for(let j=c;j<c+span;j++)heights[p][j]=y+node.offsetHeight;
        offset+=added;continued=true;finished=offset>=s.items.length;
        cursor={p,c};if(!finished){advance();cursor={p,c};}
      }
      if(attempts>=200&&!finished)overflow.push({section:s,items:s.items.slice(offset),continued,reason:'Layout could not place this section.'});
    }
    if(available<l.columns*80)layoutWarnings.push('Columns are very narrow. Reduce columns or margins, or use a wider page.');
    const textElements=$$('#pages .dish-name,#pages .dish-price,#pages .dish-description,#pages .dish-extras,#pages .dish-variants,#pages .section-notes,#pages .section-title,#pages .section-title small,#pages .restaurant-subtitle,#pages .restaurant-contact').filter(e=>e.textContent.trim());
    const smallest=textElements.length?Math.min(...textElements.map(e=>parseFloat(getComputedStyle(e).fontSize)*.75)):l.fontSize;
    if(smallest+.01<l.minFont)layoutWarnings.push(`Some menu text uses ${smallest.toFixed(1)} pt type, below your ${l.minFont} pt warning threshold. Page-number footers are excluded from this check.`);
    if(pages.some(p=>p.page.querySelector('.page-header').scrollWidth>usable+1))layoutErrors.push('The restaurant header is clipped. Shorten its text or use a wider page.');
    const clipped=[...new Set($$('#pages .menu-section').filter(s=>[...s.querySelectorAll('.section-items,.dish-top,.dish-variants,.dish-description,.section-notes,.section-title')].some(e=>e.scrollWidth>e.clientWidth+2)).map(s=>project.sections.find(x=>x.id===s.dataset.section)?.name))];
    if(clipped.length)layoutErrors.push('Text extends beyond its section in: '+clipped.join(', ')+'. Shorten long prices or increase section width.');
    if(project.theme.border>m-4)layoutWarnings.push('The frame is close to the content. Increase page margins or reduce frame thickness.');
    const pending=M.issues(project).filter(x=>!x.approved).length,overflowCount=overflow.reduce((a,x)=>a+x.items.length,0),totalItems=project.sections.reduce((a,s)=>a+s.items.length,0);
    $('#summary-bar').classList.toggle('warning',overflow.length>0||layoutErrors.length>0);$('#summary-bar').innerHTML=`<span>${overflow.length?`${overflowCount} dishes / ${overflow.length} section fragments need more space`:layoutErrors.length?'Clipping needs attention':`${totalItems} dishes · all content placed`} · ${pending} owner review questions</span><button data-open-review>Review checks →</button>`;
    $('#layout-status').textContent=overflow.length||layoutErrors.length?'Layout needs attention':layoutWarnings.length?'Readability checks to review':'All content fits';
    const panel=$('#overflow-panel');panel.hidden=!overflow.length;
    panel.innerHTML=overflow.length?`<h3>These dishes still need room</h3><p>They are retained in your project and shown below. PDF export is blocked until every section fits. Try a larger sheet, more sides, wider sections, or different spacing.</p><button data-add-page>Add another side</button> <button data-open-layout>Adjust page layout</button><div id="overflow-content">${overflow.map(o=>`<article><h4>${esc(o.section.name)}${o.continued?' (continued)':''}</h4><p>${esc(o.reason)}</p>${!o.continued&&o.section.notes?`<p>${esc(o.section.notes)}</p>`:''}${o.items.map(dishHTML).join('')}</article>`).join('')}</div>`:'';
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
  async function action(act,itemId,index){
    const s=current(),item=findItem(itemId),keepOpen=itemId;let selectNew=null;
    if(act==='section-delete'){
      if(!await confirmAction('Remove this section?',`This removes ${s.name} and its ${s.items.length} dishes. The owner has asked to retain all original offerings until removals are approved. You can undo this change.`,'Remove section'))return;
      change(()=>{project.sections=project.sections.filter(x=>x!==s);selected=project.sections[0]?.id;},{panel:true,outline:true});return;
    }
    if(act==='delete-dish'&&!await confirmAction('Remove this dish?',`Remove ${item.name}? Retain original dishes unless the owner has approved removal. You can undo this change.`,'Remove dish'))return;
    if(act==='reset'){
      if(await confirmAction('Restore the original draft?','This replaces your current menu with the full original transcription and default design. Save a project file first if you want to keep a separate copy. You can also undo this action.','Restore draft')){replace(M.initial());toast('Original draft restored.');}return;
    }
    if(['section-photo','logo-image','background-image'].includes(act)){imageTarget={kind:act,id:s?.id};$('#image-input').value='';$('#image-input').click();return;}
    change(()=>{
      const pos=s?project.sections.indexOf(s):0,di=s?.items.indexOf(item);
      if(act==='section-up'&&pos>0)[project.sections[pos-1],project.sections[pos]]=[project.sections[pos],project.sections[pos-1]];
      if(act==='section-down'&&pos<project.sections.length-1)[project.sections[pos+1],project.sections[pos]]=[project.sections[pos],project.sections[pos+1]];
      if(act==='clear-photo')s.photo='';if(act==='clear-logo')project.restaurant.logo='';if(act==='clear-background')project.backgroundImage='';
      if(act==='add-dish'){const d={id:M.uid(),name:'New dish',description:'',price:'',extras:'',variants:[],review:'',reviewed:false};s.items.push(d);selectNew=d.id;}
      if(act==='delete-dish')s.items.splice(di,1);
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
    const b=e.target.closest('[data-act]');if(b)action(b.dataset.act,b.dataset.item,b.dataset.index);
  });
  $('#inspector-body').addEventListener('input',e=>{
    const el=e.target;if(el.tagName==='SELECT'||el.type==='checkbox')return;
    if(el.type==='number'&&!el.validity.valid)return;
    updateField(el);
  });
  $('#inspector-body').addEventListener('change',e=>{const el=e.target;if(el.tagName==='SELECT'||el.type==='checkbox')updateField(el);});
  function updateField(el){
    const d=el.dataset,s=current(),val=el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value):el.value;
    if(d.sectionField){const f=d.sectionField;change(()=>{s[f]=['span','startPage','startColumn','innerColumns'].includes(f)?(val==='auto'?null:Number(val)):val;},{key:'s-'+f,outline:f==='name'});}
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
  $('#pages').addEventListener('click',e=>{const s=e.target.closest('[data-section]');if(s){const dish=e.target.closest('[data-dish]');select(s.dataset.section,dish?.dataset.dish);}});
  $('#add-section').addEventListener('click',()=>{change(()=>{const s={id:M.uid(),name:'New section',sourcePage:null,notes:'',items:[],review:'',reviewed:false,span:1,startPage:null,startColumn:null,photo:''};project.sections.push(s);selected=s.id;activeTab='content';},{panel:true,outline:true});});
  function history(redo=false){const from=redo?redoStack:undoStack,to=redo?undoStack:redoStack;if(!from.length)return;to.push(M.clone(project));project=from.pop();if(!current())selected=project.sections[0]?.id;lastKey='';renderAll();persist();}
  $('#undo').addEventListener('click',()=>history());$('#redo').addEventListener('click',()=>history(true));
  document.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey))return;if(e.key.toLowerCase()==='s'){e.preventDefault();saveProject();}if(e.key.toLowerCase()==='z'){e.preventDefault();history(e.shiftKey);}if(e.key.toLowerCase()==='p'){e.preventDefault();printProject();}});
  $('#zoom-out').addEventListener('click',()=>{zoom=Math.max(.18,zoom-.1);applyZoom();});$('#zoom-in').addEventListener('click',()=>{zoom=Math.min(1.5,zoom+.1);applyZoom();});$('#fit').addEventListener('click',fit);
  $('#fit-page').addEventListener('click',()=>{const [w,h]=M.dimensions(project),view=$('#canvas-scroll');zoom=Math.max(.18,Math.min(.85,(view.clientWidth-64)/(w*96),(view.clientHeight-80)/(h*96)));applyZoom();});
  function saveProject(){project.savedAt=new Date().toISOString();const blob=new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(project.name.replace(/[^a-z0-9 -]/gi,'').trim()||'Italian Garden')+'.menu.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),10000);persist();toast('Project file downloaded. Keep it as your editable backup.');}
  $('#save-project').addEventListener('click',saveProject);
  $('#open-project').addEventListener('click',()=>{$('#file-input').value='';$('#file-input').click();});
  $('#file-input').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>25000000)throw Error('Project is larger than 25 MB.');const next=M.validate(JSON.parse(await f.text()));if(await confirmAction('Open this project?','Your workspace will be replaced. Save a project file first if needed. You can undo opening this file.','Open project')){replace(next);toast('Editable menu project opened.');}}catch(err){toast('Could not open project: '+err.message);}});
  $('#image-input').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5000000)return toast('Use a PNG, JPEG, or WebP image smaller than 5 MB.');try{const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=data;});if(img.width*img.height>60000000)return toast('Image is too large. Resize it before adding.');change(()=>{if(imageTarget.kind==='logo-image')project.restaurant.logo=data;else if(imageTarget.kind==='background-image')project.backgroundImage=data;else{const s=project.sections.find(s=>s.id===imageTarget.id);if(s)s.photo=data;}},{panel:true});toast('Image added. Check its sharpness in a full-size proof.');}catch(err){toast('That image could not be read.');}});
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
  window.MenuStudio={getProject:()=>M.clone(project),getLayout:()=>({overflow:overflow.map(o=>({section:o.section.id,items:o.items.map(i=>i.id)})),errors:[...layoutErrors],warnings:[...layoutWarnings]})};
  renderAll();requestAnimationFrame(fit);
  if(loadedRecovery)toast('Recovered your last workspace. Save a project file for a separate backup.');
  if(storageFailure)toast('Recovery storage is unavailable. Use Save project to keep your work.');
})();
