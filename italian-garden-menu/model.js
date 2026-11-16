(function (root) {
  'use strict';
  const STYLES = [
    { id: 'original', name: 'Original-inspired', detail: 'Warm tan · garden green', paper: '#fffefa', frame: '#a8997f', accent: '#a52e26', ink: '#38715c', pattern: true, border: 12, font: 'Georgia' },
    { id: 'classic', name: 'Classic Italian', detail: 'Cream · fine green lines', paper: '#fffdf5', frame: '#315944', accent: '#9d3026', ink: '#315944', pattern: false, border: 2, font: 'Georgia' },
    { id: 'garden', name: 'Garden', detail: 'Botanical · fresh & light', paper: '#fbfcf7', frame: '#759274', accent: '#3e6247', ink: '#335744', pattern: true, border: 6, font: 'Georgia' },
    { id: 'modern', name: 'Modern Pizzeria', detail: 'Bold type · clean white', paper: '#ffffff', frame: '#242d28', accent: '#b64728', ink: '#242d28', pattern: false, border: 0, font: 'Arial' },
    { id: 'rustic', name: 'Rustic Trattoria', detail: 'Ivory · earthy terracotta', paper: '#fcf5e8', frame: '#8d563d', accent: '#944c32', ink: '#604a36', pattern: false, border: 7, font: 'Palatino Linotype' },
    { id: 'elegant', name: 'Elegant', detail: 'Double rule · deep burgundy', paper: '#fffdf9', frame: '#66353e', accent: '#66353e', ink: '#3a4038', pattern: false, border: 4, font: 'Georgia' },
    { id: 'simple', name: 'Simple Print', detail: 'Black & white · ink friendly', paper: '#ffffff', frame: '#333333', accent: '#202020', ink: '#202020', pattern: false, border: 0, font: 'Arial' }
  ];
  const PAPER = { letter: [8.5, 11], legal: [8.5, 14], tabloid: [11, 17], a4: [8.2677, 11.6929], a3: [11.6929, 16.5354], large: [12, 18] };
  const clone = x => JSON.parse(JSON.stringify(x));
  const uid = () => 'id-' + (root.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
  const PHOTO_PLACEMENTS=[['banner','Banner below heading'],['above','Above the heading'],['heading-left','Beside heading · left'],['heading-right','Beside heading · right'],['before-dish','Before a dish'],['after-dish','After a dish'],['bottom','Bottom of section']];
  const PHOTO_SHAPES=[['rectangle','Rectangle'],['rounded','Rounded corners'],['circle','Circle / oval'],['natural','Natural / cutout']];
  const PHOTO_BUDGET=80000000;
  function newPhoto(src,name='Food photo',extra={}) { return {id:uid(),src,name,placement:'banner',dishId:null,width:100,height:1.2,fit:'cover',shape:'rectangle',cropX:50,cropY:50,align:'center',caption:'',naturalWidth:0,naturalHeight:0,...extra}; }
  function migratePhotos(s) {
    if(s.photos===undefined)s.photos=s.photo?[newPhoto(s.photo,'Food photo',{cropY:s.photoPosition==='top'?0:s.photoPosition==='bottom'?100:50})]:[];
    delete s.photo;delete s.photoPosition;
    return s;
  }
  function imageBytes(p) { return (p.restaurant.logo?.length||0)+(p.backgroundImage?.length||0)+p.sections.reduce((sum,s)=>sum+(s.photos||[]).reduce((n,p)=>n+p.src.length,0),0); }
  function initial() {
    const theme = clone(STYLES[0]);
    const sections=clone(root.ITALIAN_GARDEN_SEED);sections.forEach(s=>{s.innerColumns=['pizza','coffee','drinks'].includes(s.id)?2:1;migratePhotos(s);});sections.find(s=>s.id==='pizza').span=2;
    return { version: 2, name: 'Italian Garden · Full menu', restaurant: { name: 'Italian Garden', subtitle: 'GREEK & ITALIAN RESTAURANT', contact: '2716 Wade Hampton Blvd. · Greenville, SC 29615 · (864) 509-1702', logo: '' }, layout: { paper: 'large', width: 12, height: 18, orientation: 'portrait', pages: 2, columns: 3, flow: 'balanced', ratios: [1, 1, 1], margin: 0.38, gap: 0.2, fontSize: 10, headingSize: 14, lineHeight: 1.18, itemGap: 4, sectionGap: 12, minFont: 9 }, theme, backgroundImage: '', sections, provenance: 'Original menu.pdf; all source menu sections retained. Transcription requires owner approval before printing.', savedAt: null };
  }
  function dimensions(p) { const a = [p.layout.width, p.layout.height].sort((a,b)=>a-b); return p.layout.orientation === 'landscape' ? a.reverse() : a; }
  function issues(p) {
    return p.sections.flatMap(s => [ ...(s.review ? [{ sectionId: s.id, itemId: null, title: s.name, message: s.review, approved: !!s.reviewed }] : []), ...s.items.filter(i=>i.review).map(i=>({ sectionId: s.id, itemId: i.id, title: i.name, message: i.review, approved: !!i.reviewed })) ]);
  }
  function validate(raw) {
    if (!raw || ![1,2].includes(raw.version) || typeof raw.name !== 'string' || !Array.isArray(raw.sections)) throw Error('This is not a supported Menu Studio project (versions 1 and 2).');
    const str = (v,n,max=20000) => { if (typeof v !== 'string' || v.length>max) throw Error('Invalid '+n); return v; };
    const num = (v,min,max,n) => { if (typeof v!=='number'||!Number.isFinite(v)||v<min||v>max) throw Error('Invalid '+n); };
    const image = v => { if (typeof v!=='string'||(v && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v))||v.length>8000000) throw Error('Invalid or oversized image.'); };
    const l=raw.layout, t=raw.theme, r=raw.restaurant;
    if(!l||!t||!r) throw Error('Missing layout, style, or restaurant information.');
    num(l.width,3,30,'page width');num(l.height,3,30,'page height');num(l.pages,1,20,'page count');num(l.columns,1,5,'columns');
    if(!Number.isInteger(l.pages)||!Number.isInteger(l.columns)||!['portrait','landscape'].includes(l.orientation)) throw Error('Invalid page layout.');
    if(l.flow===undefined)l.flow='columns';
    if(!['balanced','columns'].includes(l.flow))throw Error('Invalid section flow.');
    for(const [k,a,b] of [['margin',.15,1.5],['gap',.05,.8],['fontSize',7,18],['headingSize',10,30],['lineHeight',1,1.8],['itemGap',0,16],['sectionGap',0,32],['minFont',7,14]]) num(l[k],a,b,k);
    if(!Array.isArray(l.ratios)||l.ratios.length!==l.columns) throw Error('Invalid column widths.');
    l.ratios.forEach(x=>num(x,.5,3,'column width'));
    if(!STYLES.some(x=>x.id===t.id)||!['Georgia','Arial','Palatino Linotype','Verdana','Times New Roman'].includes(t.font)) throw Error('Invalid style.');
    for(const k of ['paper','frame','accent','ink']) if(!/^#[a-fA-F0-9]{6}$/.test(t[k])) throw Error('Invalid color.');
    num(t.border,0,24,'border');
    str(r.name,'restaurant name',200);str(r.subtitle,'subtitle',300);str(r.contact,'contact',1000);image(r.logo);image(raw.backgroundImage);
    if(raw.sections.length>100) throw Error('Too many sections.');
    const ids=new Set(); const id=v=>{str(v,'ID',100);if(ids.has(v))throw Error('Duplicate project ID.');ids.add(v);};
    let count=0;
    raw.sections.forEach(s=>{id(s.id);str(s.name,'section name',200);str(s.notes,'section notes');str(s.review||'','review');image(s.photo||'');num(s.span,1,5,'section width');if(!Number.isInteger(s.span))throw Error('Invalid section width.');
      migratePhotos(s);
      if(!Array.isArray(s.photos)||s.photos.length>12)throw Error('Use up to 12 photos per section.');
      s.photos.forEach(p=>{id(p.id);image(p.src);if(!p.src)throw Error('Photo has no image.');str(p.name,'photo name',300);str(p.caption,'caption',500);
        if(!PHOTO_PLACEMENTS.some(x=>x[0]===p.placement)||!PHOTO_SHAPES.some(x=>x[0]===p.shape)||!['cover','contain'].includes(p.fit)||!['left','center','right'].includes(p.align))throw Error('Invalid photo layout.');
        for(const [k,a,b] of [['width',15,100],['height',.35,4],['cropX',0,100],['cropY',0,100],['naturalWidth',0,30000],['naturalHeight',0,30000]])num(p[k],a,b,k);
        if(['before-dish','after-dish'].includes(p.placement)&&!s.items?.some(i=>i.id===p.dishId))throw Error('A photo is attached to a dish that no longer exists.');
      });
      if(s.innerColumns===undefined)s.innerColumns=s.id==='pizza'&&s.span>1?2:1;
      num(s.innerColumns,1,3,'dish columns');if(!Number.isInteger(s.innerColumns))throw Error('Invalid dish columns.');
      if(s.startPage!==null&&s.startPage!==undefined) {num(s.startPage,1,20,'section page');if(!Number.isInteger(s.startPage))throw Error('Invalid section page.');}
      if(s.startColumn!==null&&s.startColumn!==undefined) {num(s.startColumn,1,5,'section column');if(!Number.isInteger(s.startColumn))throw Error('Invalid section column.');}
      if(!Array.isArray(s.items))throw Error('Invalid dishes.');s.items.forEach(i=>{id(i.id);str(i.name,'dish name',300);str(i.description,'description');str(i.price,'price',300);str(i.extras||'','extras');str(i.review||'','review');if(!Array.isArray(i.variants)||i.variants.length>30)throw Error('Invalid variants.');i.variants.forEach(v=>{str(v.label,'variant',100);str(v.price,'variant price',100);});count++;});
    });
    if(count>1500)throw Error('Too many dishes.');
    if(imageBytes(raw)>PHOTO_BUDGET)throw Error('This project contains too much image data. Use smaller files or fewer duplicate photos (60 MB of images maximum).');
    raw.version=2;
    return clone(raw);
  }
  root.MenuModel={ STYLES, PAPER, PHOTO_PLACEMENTS, PHOTO_SHAPES, PHOTO_BUDGET, clone, uid, newPhoto, migratePhotos, imageBytes, initial, dimensions, issues, validate };
  if (typeof module!=='undefined') module.exports=root.MenuModel;
})(typeof window!=='undefined'?window:globalThis);
