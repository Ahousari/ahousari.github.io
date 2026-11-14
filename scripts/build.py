"""Build a dependency-light static portfolio. Only explicitly selected media is copied."""
from pathlib import Path
import argparse, html, json, math, shutil, sys, wave, struct

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'src'))
from content import PROJECTS, EXPERIENCE
import presentation as pp
PROJECTS.sort(key=lambda p: pp.CAREER_ORDER.index(p['slug']))

parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default=json.loads((ROOT/'site.json').read_text(encoding='utf-8')).get('base_url','') if (ROOT/'site.json').exists() else '')
args = parser.parse_args()
BASE = args.base_url.rstrip('/')
OUT = ROOT/'build'
if OUT.exists():
    assert OUT.resolve().parent == ROOT.resolve() and OUT.name == 'build'
    shutil.rmtree(OUT)
OUT.mkdir(exist_ok=True)
ASSETS = OUT/'assets'
ASSETS.mkdir(exist_ok=True)
e = html.escape

def write(path, text):
    dest=OUT/path
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(text,encoding='utf-8')

shutil.copytree(ROOT/'public', OUT, dirs_exist_ok=True)

for filename in ['style.css','site.js','rotation.js','demos.js']:
    source=ROOT/'src'/filename
    if source.exists(): shutil.copyfile(source,ASSETS/filename)

def svg(inner, title='Project illustration'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 390" role="img" aria-label="{e(title)}"><rect width="640" height="390" fill="#f5f5f3"/>{inner}</svg>'

def rect(x,y,w,h,fill='#fff',stroke='#c8c8c8',rx=2):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}"/>'
def text(x,y,s,size=14,fill='#555',weight='normal',anchor='start'):
    return f'<text x="{x}" y="{y}" font-family="Arial,sans-serif" font-size="{size}" fill="{fill}" font-weight="{weight}" text-anchor="{anchor}">{e(str(s))}</text>'
def line(x1,y1,x2,y2,c='#aaa',w=2):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="{w}"/>'

def preview(p):
    kind=p['demo']; a='#bd2028'
    inner=rect(38,33,564,326)+rect(38,33,564,33,'#ececeb')
    inner+=text(55,54,p['title'],11,'#555','bold')
    if kind=='rotation':
        inner+=rect(39,67,117,291,'#262626','#262626')+text(53,98,'MY ROTATION',12,'#fff','bold')
        for i,s in enumerate(['All songs','Playlists','Downloads']): inner+=text(54,143+35*i,s,11,'#ddd')
        inner+=text(181,110,'A little something for the day.',17,'#282828','bold')
        for i,s in enumerate(['First Light','Night Drive','Quiet Orbit']):
            y=137+56*i; inner+=rect(181,y,32,32,a,a)+text(192,y+22,'▶',12,'#fff')+text(226,y+13,s,12,'#333','bold')+text(226,y+29,'Portfolio sessions',10,'#888')+text(527,y+22,f'{i+1}×',12,a)+line(181,y+45,575,y+45,'#e5e5e5',1)
        inner+=rect(157,311,444,47,'#f8f8f8')+text(179,338,'▶     First Light',12,'#333')+line(338,335,551,335,'#ccc',3)+line(338,335,420,335,a,3)
    elif kind=='circuit':
        inner+=text(64,100,'VOLTAGE DIVIDER',10,a,'bold')
        inner+=line(100,145,310,145,'#777')+line(310,145,310,176,'#777')+rect(298,176,24,45,'#fff','#555')+line(310,221,310,248,'#777')+rect(298,248,24,45,'#fff','#555')+line(310,293,310,315,'#777')+line(100,145,100,315,'#777')+line(100,315,310,315,'#777')
        inner+='<circle cx="100" cy="226" r="24" fill="#fff" stroke="#555" stroke-width="2"/>'
        inner+=text(100,232,'5 V',14,'#444',anchor='middle')+line(310,235,376,235,a,3)+text(330,199,'R₁',14)+text(330,277,'R₂',14)+text(403,202,'OUTPUT',10,a,'bold')+text(403,241,'2.50 V',33,'#333','bold')+text(403,270,'Change. Calculate. Inspect.',10)
    elif kind in ['audio','control']:
        inner+=text(65,102,'SIGNAL WORKSPACE' if kind=='audio' else 'CONTROLLER RESPONSE',10,a,'bold')
        for yy in [140,190,240,290]:inner+=line(70,yy,570,yy,'#e7e7e7',1)
        for j,c in enumerate(['#aaa',a]):
            pts=[]
            for i in range(500):
                v=(math.sin(i*.055)*(30+10*math.sin(i*.015))+ (math.sin(i*.7)*10 if j==0 else 0)) if kind=='audio' else (math.exp(-i/120)*math.sin(i*.025)*(60-j*28))
                pts.append(f'{70+i},{210+v+j*9:.2f}')
            inner+=f'<polyline points="{" ".join(pts)}" fill="none" stroke="{c}" stroke-width="2"/>'
        inner+=text(73,332,'Original / processed' if kind=='audio' else 'PI feedback / road preview',11)
    elif kind=='reader':
        inner+=rect(64,88,146,247,'#ece9e2','#ddd')+text(137,160,'FOLIO',24,'#5d5548','bold','middle')+text(137,193,'Read. Listen.',12,'#777',anchor='middle')+text(137,214,'Pick up where you left off.',9,'#777',anchor='middle')
        inner+=text(239,117,'A page, a voice, a place to return.',16,'#333','bold')
        for i,w in enumerate([315,287,300,250,290,310,220]): inner+=rect(239,142+i*20,w,3,'#c7c4be','#c7c4be',0)
        inner+=rect(239,289,135,28,a,a)+text(257,307,'Continue reading',10,'#fff')+text(396,308,'Passage 2 of 4',10)
    elif kind=='transfer':
        inner+=rect(104,95,110,211,'#fff','#555',12)+rect(116,115,86,162,'#f5f5f5','#ddd')+text(159,185,'report.pdf',10,'#444',anchor='middle')+text(159,208,'Ready to send',9,'#888',anchor='middle')
        inner+=rect(345,126,188,126,'#fff','#555',4)+line(439,252,439,277,'#555',6)+line(396,279,482,279,'#555',5)+line(236,200,320,200,a,3)+text(275,185,'SEND',10,a,'bold','middle')+text(439,183,'Incoming file',14,'#333','bold','middle')+text(439,211,'Phone → computer',10,'#777',anchor='middle')
    elif kind=='game':
        inner=rect(0,0,640,390,'#f1ebd9','#f1ebd9',0)
        inner+='<path d="M0 220L100 140L200 205L320 115L440 190L550 120L640 180V390H0Z" fill="#bec9b3"/><path d="M0 290Q130 195 260 278T640 250V390H0Z" fill="#819878"/><path d="M300 390Q400 280 355 234" stroke="#d6c49d" stroke-width="55" fill="none"/>'
        for xx,yy in [(110,247),(510,232),(430,290)]: inner+=line(xx,yy,xx,yy-60,'#6a5946',6)+rect(xx-11,yy-65,22,28,'#e7b866','#6a5946',3)
        inner+=text(320,77,'LANTERN VALE',28,'#4d5d42','bold','middle')+text(320,105,'A small light. A wider world.',13,'#6d725b',anchor='middle')
    elif kind in ['grid','hmi']:
        nodes=[(95,170),(190,120),(275,180),(365,130),(465,190),(545,120),(170,280),(370,280),(535,280)]
        for i,j in [(0,1),(1,2),(2,3),(3,4),(4,5),(0,6),(6,2),(2,7),(7,4),(4,8),(7,8)]:inner+=line(*nodes[i],*nodes[j],'#929c9d',3)
        for i,(x,y) in enumerate(nodes): inner+=f'<circle cx="{x}" cy="{y}" r="{12 if i==4 else 7}" fill="{a if i==4 else "#fff"}" stroke="{a if i==4 else "#6a7d81"}" stroke-width="2"/>'+text(x+10,y-10,f'B{i+1}',9)
        inner+=text(63,96,'DISTURBANCE EXPLORER' if kind=='grid' else 'DC MICROGRID · CONCEPT',10,a,'bold')+text(60,338,'Scenario playback / recorded channels' if kind=='grid' else 'Normal  ·  Outage  ·  Disconnect',11)
    elif kind=='cpu':
        inner+=rect(69,120,97,61,'#f9f9f9','#8b8b8b')+text(117,147,'PROGRAM',11,'#444','bold','middle')+text(117,165,'COUNTER',11,'#444','bold','middle')+rect(236,120,164,61,'#fff','#777')+text(318,155,'INSTRUCTION DECODER',11,'#444','bold','middle')+line(166,150,236,150,a,3)+line(318,181,318,223,a,3)
        inner+=rect(236,223,164,90,'#fff','#777')+text(318,260,'8-BIT ALU',21,'#333','bold','middle')+text(318,283,'ADD · SUB · AND · OR',9,'#777',anchor='middle')
        for i in range(4):inner+=rect(457,116+i*48,85,33,'#fafafa','#aaa')+text(499,137+i*48,f'R{i}   {12-i*3:02X}',12,'#444',anchor='middle')
        inner+=line(400,264,440,264,a,3)+line(440,264,440,132,a,3)+line(440,132,457,132,a,3)+text(68,95,'A MACHINE YOU CAN FOLLOW',10,a,'bold')
    elif kind in ['vision','dataset','ocr']:
        inner+=rect(66,92,314,238,'#e6e9e1','#ddd')
        for i,(x,y) in enumerate([(104,141),(203,125),(288,150)]):
            inner+=f'<circle cx="{x+17}" cy="{y}" r="13" fill="#b8ad99"/>'+rect(x,y+16,34,86,'#8a9691','#8a9691',10)+rect(x-9,y-23,52,142,'none',a)
            inner+=text(x-8,y-30,['person','track 02','region'][i],9,a)
        inner+=text(406,115,'INSPECT',10,a,'bold')
        for i,s in enumerate(['Input image','Prediction','Evidence','Evaluation']):inner+=text(407,156+i*39,s,12,'#555')+line(407,168+i*39,564,168+i*39,'#ddd',1)
    elif kind=='embedded':
        inner+=rect(121,108,398,187,'#e6e3dd','#a49e91',5)+rect(145,133,285,92,'#252b29','#252b29')+text(287,198,'07:30',58,'#bd2028','bold','middle')+f'<circle cx="473" cy="176" r="24" fill="#f4f4f4" stroke="#8b8b8b" stroke-width="3"/>'+text(145,263,'CLOCK / SET / ALARM',12,'#666')+f'<circle cx="473" cy="257" r="7" fill="{a}"/>'
    elif kind=='documents':
        for j in [0,1,2]:
            xx=112+j*145; yy=110+abs(j-1)*17
            inner+=rect(xx,yy,118,176,'#fff','#aaa')+rect(xx+15,yy+23,73,6,a,a)
            for k in range(5):inner+=rect(xx+15,yy+49+k*17,83-(k%2)*12,3,'#ccc','#ccc')
        inner+=text(320,326,'DATA + TEMPLATE → DOCUMENTS',12,'#666','bold','middle')
    else: inner+=text(320,210,p['title'],20,'#555','bold','middle')
    return svg(inner,p['title']+' — project illustration')

for p in PROJECTS:
    (ASSETS/f"{p['slug']}.svg").write_text(preview(p),encoding='utf-8')

def header(active=''):
    links=[('/projects/','Projects','projects'),('/about/','About','about'),('/assets/Abdurrahman-Housari-Resume-October-2026.pdf','Résumé','resume'),('/contact/','Contact','contact')]
    nav=''.join(f'<a href="{u}" class="{"active" if key==active else "contact-link" if key=="contact" else ""}" {"aria-current=page" if key==active else ""}>{label}</a>' for u,label,key in links)
    return '<a href="#main" class="skip">Skip to content</a><header class="site-header"><div class="wrap header-inner"><a class="brand" href="/" aria-label="Abdurrahman Housari home"><img class="brand-portrait" src="/assets/portrait-close.jpg" alt="" width="44" height="44"><span class="brand-name">Abdurrahman Housari<small>Engineering &amp; projects</small></span></a><nav class="site-nav" aria-label="Main navigation">'+nav+'</nav></div></header>'

def footer():
    return '<footer class="site-footer"><div class="wrap footer-inner"><div>© 2026 Abdurrahman Housari · Engineering projects & software.</div><div class="footer-links"><a href="https://www.linkedin.com/in/ahousari/">LinkedIn</a><a href="https://github.com/Ahousari">GitHub</a><a href="/share/">Project QR links</a><a href="/contact/">Get in touch</a></div></div></footer>'

def page(title,body,path='/',active='',description='',image='/assets/social-home.png',extra=''):
    title_full=title+' | Abdurrahman Housari' if title else 'Abdurrahman Housari | Engineering & Selected Projects'
    description=description or 'Electrical engineering, software, and hands-on projects by Abdurrahman Housari. Explore circuits, computer vision, controls, applications, and interactive demonstrations.'
    url=(BASE+path) if BASE else path
    graph=(BASE+image) if BASE else image
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title_full)}</title><meta name="description" content="{e(description)}"><meta name="theme-color" content="#23415b"><link rel="canonical" href="{e(url)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Abdurrahman Housari"><meta property="og:title" content="{e(title_full)}"><meta property="og:description" content="{e(description)}"><meta property="og:url" content="{e(url)}"><meta property="og:image" content="{e(graph)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/assets/avatar-icon.png" type="image/png"><link rel="stylesheet" href="/assets/style.css"><script src="/assets/site.js" defer></script>{extra}</head><body>{header(active)}{body}{footer()}</body></html>'''

def card(p):
    slug=p['slug']
    media=pp.COVERS.get(slug,slug+'.svg')
    if not (ASSETS/media).exists(): media=slug+'.svg'
    logo_cover=slug in pp.LOGOS and slug not in pp.COVERS
    if logo_cover: media=pp.LOGOS[slug]
    cover_class='card-media logo-cover' if logo_cover else 'card-media'
    skills=' · '.join(pp.SKILLS.get(slug,p['tags']))
    return f'''<article class="project-card" data-category="{e(p['category'])}" data-search="{e((p['title']+' '+p['summary']+' '+skills).lower())}"><a href="/projects/{slug}/" class="{cover_class}" tabindex="-1" aria-hidden="true"><img src="/assets/{media}" alt="" loading="lazy" width="640" height="390"></a><div class="card-body"><div class="card-category">{e(pp.CONTEXT.get(slug,p['category']))}</div><h3><a href="/projects/{slug}/">{pp.logo(slug)}<span>{e(p['title'])}</span></a></h3><p>{e(pp.DESCRIPTIONS.get(slug,p['summary']))}</p><p class="work-skills"><strong>Skills:</strong> {e(skills)}</p><div class="card-footer"><a href="/projects/{slug}/">Project details</a><a href="/play/{slug}/">Try in browser →</a></div></div></article>'''

def palette_toolbar():
    return '''<div class="palette-toolbar" aria-label="Compare color palettes"><span class="palette-label">Homepage color study</span><button type="button" data-palette="crimson" aria-pressed="true"><i style="background:#bd2028"></i>Crimson<span class="palette-code">#BD2028</span></button><button type="button" data-palette="navy" aria-pressed="false"><i style="background:#23415b"></i>Navy<span class="palette-code">#23415B</span></button><button type="button" data-palette="forest" aria-pressed="false"><i style="background:#2c6554"></i>Forest<span class="palette-code">#2C6554</span></button></div>'''

def home(design=False):
    return (palette_toolbar() if design else '')+pp.render_home(PROJECTS,card)

write(Path('index.html'),page('',home()))
write(Path('design/index.html'),page('Homepage color study',home(True),'/design/'))
categories=list(dict.fromkeys(p['category'] for p in PROJECTS))
filters='<button type="button" data-filter="all" aria-pressed="true">All projects</button>'+''.join(f'<button type="button" data-filter="{e(c)}" aria-pressed="false">{e(c)}</button>' for c in categories)
body=f'''<main id="main" class="wrap"><div class="page-heading"><div class="eyebrow">The project collection</div><h1>Projects</h1><p>Engineering projects, applications, and smaller experiments. The skills used are listed with each project.</p></div><label for="project-search" class="demo-label">Find a project or technology</label><br><input id="project-search" class="project-search" type="search" placeholder="Search projects, tools, or methods…"><div class="filter-bar" role="group" aria-label="Project categories">{filters}</div><p class="results-count" id="results-count" aria-live="polite">{len(PROJECTS)} projects and collections</p><div class="project-grid" id="all-projects">{''.join(card(p) for p in PROJECTS)}<p class="empty-state" hidden>No projects match. Try a different search or category.</p></div></main>'''
write(Path('projects/index.html'),page('Projects',body,'/projects/','projects'))

def demo_markup(p):
    if p['demo']=='game':
        return '<iframe class="game-embed" src="/play/lantern-vale/opening/" title="Lantern Vale original playable opening demo" allow="fullscreen" loading="lazy"></iframe><p class="demo-instructions" style="padding:14px 18px;margin:0">Actual opening demo · keyboard and touch controls · <a href="/play/lantern-vale/opening/" target="_blank" rel="noopener">Open game in its own tab ↗</a></p>'
    if p['demo']=='mace':
        return '<div class="demo-tabs" role="group" aria-label="Mace views"><button data-mace="both" aria-pressed="true">Side by side</button><button data-mace="cad" aria-pressed="false">CAD design</button><button data-mace="finished" aria-pressed="false">Finished piece</button></div><div class="gallery-grid" id="mace-views"><figure class="media-figure" data-mace-view="cad"><img src="/assets/mace-cad.jpg" alt="CAD model of the ceremonial mace with its presentation stand"><figcaption>CAD design.</figcaption></figure><figure class="media-figure" data-mace-view="finished"><img src="/assets/mace-finished.jpg" alt="Finished brass and aluminum Greenville Technical College ceremonial mace"><figcaption>Finished ceremonial mace.</figcaption></figure></div>'
    return f'<div class="demo-mount" data-demo="{p["demo"]}" aria-label="{e(p["demo_title"])}"><img src="/assets/{p["slug"]}.svg" alt="Project overview illustration"><noscript><p>Enable JavaScript to try the interactive demonstration. The case study remains readable below.</p></noscript></div>'

def evidence(p):
    slug=p['slug']
    if slug=='pedestrian-device-detection':
        return '<section class="project-evidence"><h2>Saved model predictions</h2><p>Two crops from a saved V4 small validation-output image. The original boxes and confidence labels are retained; these are model predictions, not ground-truth labels.</p><div class="prediction-gallery"><figure><img src="/assets/prediction-walker.jpg" alt="Saved YOLO output assigning the walker class with a 0.8 confidence label"><figcaption><strong>Predicted: walker</strong><br>Course label for no visible device use.</figcaption></figure><figure><img src="/assets/prediction-zombie.jpg" alt="Saved YOLO output assigning the zombie class with a 0.8 confidence label"><figcaption><strong>Predicted: zombie</strong><br>Course label for using a phone.</figcaption></figure></div><p class="image-credit">Source frames: <a href="https://data.nvision2.eecs.yorku.ca/JAAD_dataset/">JAAD dataset — Rasouli, Kotseruba &amp; Tsotsos</a>. Predictions and crops are from this project. <a href="/assets/saved-validation-predictions.jpg">View the complete saved output.</a></p></section>'
    if slug in ['circuit-studio','smart-grid-analysis','computer-vision']:
        image={'circuit-studio':'original-circuit-workbench.jpg','smart-grid-analysis':'original-grid.jpg','computer-vision':'cookie-board.jpg'}[slug]
        caption={'circuit-studio':'CircuitStudio’s original circuit workbench, shown before running a simulation.','smart-grid-analysis':'The original IEEE 68-bus Grid Explorer displaying a supplied recorded scenario.','computer-vision':'The cookie-project photo setup on the printer testbed.'}[slug]
        return f'<figure class="project-evidence"><img src="/assets/{image}" alt="{e(caption)}"><figcaption>{e(caption)}</figcaption></figure>'
    return ''

for p in PROJECTS:
    path=f'/projects/{p["slug"]}/'
    facts=''.join(f'<div><dt>{e(k)}</dt><dd>{e(v)}</dd></div>' for k,v in p['facts'])
    parts=''.join(f'<h3>{e(t)}</h3><p>{e(d)}</p>' for t,d in p['parts'])
    points=''.join(f'<li>{e(s)}</li>' for s in p['highlights'])
    decisions=''.join(f'<li>{e(s)}</li>' for s in p['decisions'])
    tags=''.join(f'<span class="tag">{e(t)}</span>' for t in pp.SKILLS.get(p['slug'],p['tags']))
    gallery=''
    if p['slug']=='my-rotation':
        gallery='<h2 id="gallery">From the application</h2><figure class="media-figure"><img src="/assets/my-rotation-original.jpg" alt="My Rotation desktop interface with a disposable sample library" loading="lazy"><figcaption>The actual application, shown with a sample library.</figcaption></figure>'
    if p['slug']=='ceremonial-mace':
        gallery='<p><a href="https://sites.google.com/view/gtc-mace-project">Visit the original GTC mace project page ↗</a></p>'
    linkedin=p['contribution']+' '+p['summary']
    aside=f'<section class="launch-panel"><h3>Use this project</h3><p>Open the browser experience on a computer or phone.</p><a class="button primary" href="/play/{p["slug"]}/">Launch browser experience →</a><img class="project-qr" src="/assets/qr-{p["slug"]}.svg" alt="QR code opening this project’s browser experience"><a href="/assets/qr-{p["slug"]}.png" download>Save QR code</a></section>'+'<section class="aside-section"><h3>At a glance</h3><p>'+e(p['summary'])+'</p></section><section class="aside-section"><h3>Tools & methods</h3><div class="expertise">'+tags+'</div></section>'
    if p['slug']=='logisim-cpu': aside+='<section class="aside-section"><h3>Original design</h3><p>Open the original circuit in Logisim to inspect the complete datapath.</p><a class="button small" href="/assets/logisim-cpu.circ" download>Download Logisim circuit</a></section>'
    aside+=f'<section class="aside-section"><h3>Project media</h3><p>A project card and concise summary for sharing this work.</p><div class="media-download"><a class="button small" href="/assets/social-{p["slug"]}.png" download>Download image</a><a class="button small" href="/assets/{p["slug"]}-summary.txt" download>Project summary</a></div></section>'
    body=f'''<main id="main" class="wrap"><div class="page-heading"><div class="breadcrumb"><a href="/projects/">Projects</a> / {e(p['title'])}</div><div class="project-intro"><div><div class="eyebrow">{e(p['category'])}</div><h1 class="project-title">{pp.logo(p['slug'])}{e(p['title'])}</h1><p class="project-summary">{e(pp.DESCRIPTIONS.get(p['slug'],p['summary']))}</p><div class="skills-label">Skills used</div><div class="project-tags">{tags}</div><div class="actions"><a class="button primary" href="/play/{p['slug']}/">Try in your browser →</a><a href="#overview">Read the project story</a></div></div><dl class="project-meta">{facts}</dl></div></div><nav class="page-jumps" aria-label="On this project page"><a href="#demo">Try the sample</a><a href="#overview">The project</a><a href="#build">Development</a><a href="#scope">Scope & results</a></nav>{evidence(p)}<section class="demo-section" id="demo"><div class="section-kicker">Explore the project</div><h2>{e(p['demo_title'])}</h2><p class="demo-description">{e(p['demo_description'])}</p><div class="demo-shell"><div class="demo-titlebar"><strong class="demo-app-title">{pp.logo(p['slug'])}{e(p['title'])}</strong><span>{'Project photographs' if p['demo']=='mace' else 'Interactive portfolio sample'}</span></div><div class="demo-body">{demo_markup(p)}</div><div class="demo-note">{'Original project images supplied by Abdurrahman Housari.' if p['demo']=='mace' else 'A self-contained sample. Full-project capabilities and sample limitations are described below.'}</div></div></section><div class="case-columns"><article class="prose"><h2 id="overview">What I built</h2><p>{e(p['overview'])}</p><h2 id="build">My contribution</h2><p>{e(p['contribution'])}</p><ul>{points}</ul><h2>Components</h2>{parts}<h2>Design choices</h2><ul>{decisions}</ul><h2 id="scope">Scope & results</h2><p>{e(p['limits'])}</p>{gallery}</article><aside>{aside}</aside></div><div class="page-end"><a href="/projects/">← All projects</a><a href="/contact/">Ask me about this project →</a></div></main>'''
    write(Path('projects')/p['slug']/'index.html',page(p['title'],body,path,'projects',p['summary'],f'/assets/social-{p["slug"]}.png',extra='<script src="/assets/rotation.js" defer></script><script src="/assets/demos.js" defer></script>'))
    focused=f'<main id="main" class="wrap focused-demo"><div class="breadcrumb"><a href="/projects/{p["slug"]}/">← {e(p["title"])} case study</a></div><h1 style="font-size:32px">{e(p["title"])}</h1><p class="demo-description">{e(p["demo_description"])}</p><div class="demo-shell"><div class="demo-titlebar"><strong>{e(p["demo_title"])}</strong><span>Browser experience</span></div><div class="demo-body">{demo_markup(p)}</div></div><div class="notice">{e(p["limits"])}</div><div class="actions"><a class="button" href="/projects/{p["slug"]}/">Read the full project story</a><a href="/projects/">Explore other projects →</a></div></main>'
    write(Path('play')/p['slug']/'index.html',page(p['title']+' — Browser experience',focused,f'/play/{p["slug"]}/','projects',p['summary'],f'/assets/social-{p["slug"]}.png',extra='<script src="/assets/rotation.js" defer></script><script src="/assets/demos.js" defer></script>'))
    (ASSETS/f'{p["slug"]}-summary.txt').write_text(p['title']+'\n\n'+p['summary']+'\n\n'+p['contribution']+'\n\n'+p['limits']+'\n',encoding='utf-8')

timeline=''.join(f'<li><strong>{e(role)} · {e(org)}</strong><div class="when">{e(when)}</div><p>{e(desc)}</p></li>' for org,role,when,desc in EXPERIENCE)
about=f'''<main id="main" class="wrap"><div class="page-heading"><div class="eyebrow">About me</div><h1>About Abdurrahman</h1></div><div class="about-layout"><div><img src="/assets/portrait-outdoors.jpg" alt="Abdurrahman Housari outdoors with a mountain landscape" width="240" height="300"><div class="photo-source">Abdurrahman Housari</div><div class="actions"><a class="button" href="/assets/Abdurrahman-Housari-Resume-October-2026.pdf">View résumé</a></div></div><article class="prose"><p>I’m an electrical engineering honors student at Clemson University, graduating in December 2026. I enjoy work that connects physical systems, data, and software—from a circuit on a workbench to an application someone can use.</p><p>My experience spans industrial automation and robotics, thermal imaging and acquisition, CAD and manufacturing, and engineering lab instruction. My projects are a way to keep exploring: sometimes that means a processor in Logisim, sometimes a music application, and sometimes a ceremonial mace.</p><h2>Experience</h2><ul class="timeline">{timeline}</ul><h2>Education</h2><p><strong>Clemson University · Honors College</strong><br>B.S. Electrical Engineering · Expected December 2026</p><p><strong>Greenville Technical College</strong><br>Associate of Science · August 2025</p><h2>Beyond the project list</h2><p>I’ve taught DC circuits and 3D printing, worked with machinists, supported robotic systems, and spent time debugging unfamiliar hardware. Those experiences shape how I approach software too: inspect what is happening, test assumptions, and make the result understandable.</p><div class="actions"><a class="button primary" href="/projects/">Explore the projects</a><a class="button" href="/contact/">Get in touch</a></div></article></div></main>'''
write(Path('about/index.html'),page('About',about,'/about/','about'))
contact='''<main id="main" class="wrap"><div class="page-heading"><div class="eyebrow">Get in touch</div><h1>Contact</h1><p>I’m happy to discuss my projects, engineering opportunities, or a technical problem you’re working through.</p></div><section class="contact-panel"><h2>Abdurrahman Housari</h2><p>Electrical engineering · Clemson University<br>Graduating December 2026 · Greer, South Carolina</p><div class="actions"><a class="button primary" href="mailto:ahousari78@gmail.com">Send an email</a><a class="button" href="https://www.linkedin.com/in/ahousari/">Connect on LinkedIn</a></div><div class="actions"><a href="/assets/Abdurrahman-Housari-Resume-October-2026.pdf">Download my October 2026 résumé</a></div></section></main>'''
write(Path('contact/index.html'),page('Contact',contact,'/contact/','contact'))
write(Path('404.html'),page('Page not found','<main id="main" class="wrap"><div class="page-heading"><h1>That page isn’t here.</h1><p>You can find the full collection on the projects page.</p><a class="button primary" href="/projects/">Browse projects</a></div></main>','/404.html'))
write(Path('robots.txt'),'User-agent: *\nAllow: /\nDisallow: /design/\n'+(f'Sitemap: {BASE}/sitemap.xml\n' if BASE else ''))
routes=['/','/projects/','/about/','/contact/','/share/']+[f'/projects/{p["slug"]}/' for p in PROJECTS]+[f'/play/{p["slug"]}/' for p in PROJECTS]
if BASE: write(Path('sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>{e(BASE+r)}</loc></url>' for r in routes)+'</urlset>')

# Original, deterministic sample audio. No personal library recordings are copied.
sample_rate=8000
sequences=[([60,64,67,72,67,64,62,67],0),([57,60,64,67,64,60,55,59],1),([65,69,72,76,72,69,67,72],2)]
for idx,(notes,_) in enumerate(sequences):
    with wave.open(str(ASSETS/f'sample-{idx+1}.wav'),'wb') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(sample_rate)
        samples=bytearray()
        for i in range(sample_rate*8):
            t=i/sample_rate; step=min(7,int(t)); local=t-step; frequency=440*2**((notes[step]-69)/12)
            envelope=min(1,local*30)*math.exp(-local*2.6)*min(1,(8-t)*4)
            value=.22*envelope*(math.sin(2*math.pi*frequency*t)+.24*math.sin(4*math.pi*frequency*t))
            samples+=struct.pack('<h',round(max(-1,min(1,value))*32767))
        f.writeframes(samples)

# Share cards are explicitly designed project summaries, not screenshots of the full apps.
from PIL import Image, ImageDraw, ImageFont, ImageOps
font_path='C:/Windows/Fonts/arial.ttf'
bold_path='C:/Windows/Fonts/arialbd.ttf'
def font(size,bold=False): return ImageFont.truetype(bold_path if bold else font_path,size)
def wrapped(draw,s,max_width,f):
    result=[]; current=''
    for word in s.split():
        proposed=(current+' '+word).strip()
        if draw.textlength(proposed,font=f)>max_width and current: result.append(current); current=word
        else: current=proposed
    if current: result.append(current)
    return result
for p in PROJECTS+[dict(slug='home',title='Abdurrahman Housari',summary='Electrical engineering, software, and things that bring them together.',category='Engineering & selected projects',tags=['Circuits','Computer vision','Controls','Software'])]:
    im=Image.new('RGB',(1200,630),'white'); d=ImageDraw.Draw(im)
    d.rectangle((0,0,1200,9),fill='#23415b');im.paste(ImageOps.fit(Image.open(ROOT/'public/assets/portrait-close.jpg'),(64,64),centering=(.5,.32)),(68,51));d.text((150,74),'ABDURRAHMAN HOUSARI',font=font(17,True),fill='#333')
    d.text((70,143),p['category'].upper(),font=font(17,True),fill='#23415b')
    yy=190
    for s in wrapped(d,p['title'],1050,font(55,True)): d.text((66,yy),s,font=font(55,True),fill='#242424'); yy+=68
    yy+=20
    for s in wrapped(d,p['summary'],1000,font(25))[:3]: d.text((70,yy),s,font=font(25),fill='#626262'); yy+=39
    d.line((70,526,1130,526),fill='#ddd',width=2)
    d.text((70,553),' · '.join(p['tags'][:4]),font=font(19),fill='#555')
    media=ASSETS/pp.COVERS.get(p['slug'],f'demo-{p["slug"]}.jpg')
    if media.exists():
        im=Image.new('RGB',(1200,630),'white');d=ImageDraw.Draw(im);d.rectangle((0,0,1200,8),fill='#23415b')
        im.paste(ImageOps.fit(Image.open(ROOT/'public/assets/portrait-close.jpg'),(48,48),centering=(.5,.32)),(55,31));d.text((119,47),'Abdurrahman Housari · Engineering & Projects',font=font(19),fill='#444')
        yy=106
        for line in wrapped(d,p['title'],1090,font(37,True))[:2]:d.text((55,yy),line,font=font(37,True),fill='#252525');yy+=47
        thumbnail=Image.open(media).convert('RGB');thumbnail.thumbnail((1090,360));im.paste(thumbnail,((1200-thumbnail.width)//2,yy+13))
        d.line((55,576,1145,576),fill='#ddd',width=1);d.text((55,595),'Project case study + browser experience',font=font(17),fill='#23415b')
    im.save(ASSETS/f'social-{p["slug"]}.png',optimize=True)

write(Path('assets/projects.json'),json.dumps([{k:p[k] for k in ['slug','title','summary','category','tags']} for p in PROJECTS],ensure_ascii=False))
print(f'Built {len(PROJECTS)} project pages and {len(routes)} routes in {OUT}')

# Public project/device links. QR images contain only public URLs, never pairing credentials.
sys.path.insert(0,str(ROOT/'scripts'/'vendor'))
from qrcodegen import QrCode
from PIL import ImageDraw
qr_targets={}
for p in PROJECTS:
    target=(BASE or 'http://127.0.0.1:4173')+f'/play/{p["slug"]}/'
    qr_targets[p['slug']]=target
    qr=QrCode.encode_text(target,QrCode.Ecc.MEDIUM)
    size=qr.get_size(); border=4
    commands=' '.join(f'M{x+border},{y+border}h1v1h-1z' for y in range(size) for x in range(size) if qr.get_module(x,y))
    code=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size+8} {size+8}" shape-rendering="crispEdges" role="img" aria-label="Open {e(p["title"])} on another device"><rect width="100%" height="100%" fill="white"/><path d="{commands}" fill="#111"/></svg>'
    (ASSETS/f'qr-{p["slug"]}.svg').write_text(code,encoding='utf-8')
    im=Image.new('RGB',((size+8)*8,(size+8)*8),'white');d=ImageDraw.Draw(im)
    for y in range(size):
        for x in range(size):
            if qr.get_module(x,y):d.rectangle(((x+4)*8,(y+4)*8,(x+5)*8-1,(y+5)*8-1),fill='#111')
    im.save(ASSETS/f'qr-{p["slug"]}.png')
write(Path('assets/qr-targets.json'),json.dumps(qr_targets,indent=2))
qr_cards=''.join(f'<article class="project-card"><div class="card-body"><h2 style="font-size:20px">{e(p["title"])}</h2><img class="project-qr" src="/assets/qr-{p["slug"]}.svg" alt="QR code for {e(p["title"])}"><p>{e(p["summary"])}</p><a class="button primary" href="/play/{p["slug"]}/">Open browser experience</a></div></article>' for p in PROJECTS)
write(Path('share/index.html'),page('Project links & QR codes','<main id="main" class="wrap"><div class="page-heading"><h1>Open a project on another device.</h1><p>Scan a code or follow a link. Each opens a public browser experience, with its scope explained on the page.</p></div><div class="project-grid">'+qr_cards+'</div></main>','/share/'))
write(Path('.nojekyll'),'')
