from html import escape as e

CAREER_ORDER = ['circuit-studio','smart-grid-analysis','pedestrian-device-detection','computer-vision','logisim-cpu','ceremonial-mace','electric-echoworks','my-rotation','cruise-control','folio','embedded-hardware','pocket-bridge','lantern-vale','document-automation','ocr-foundations','microgrid-hmi']
LOGOS = {slug:f'logo-{slug}.svg' for slug in ['circuit-studio','my-rotation','electric-echoworks','folio','pocket-bridge']}
COVERS = {'circuit-studio':'circuit-schematic-detail.jpg','smart-grid-analysis':'original-grid.jpg','pedestrian-device-detection':'prediction-pair.jpg','computer-vision':'cookie-board.jpg','ceremonial-mace':'mace-finished.jpg','my-rotation':'my-rotation-original.jpg','lantern-vale':'demo-lantern-vale.jpg'}
SKILLS = {
 'circuit-studio':['Circuit analysis','Python','JavaScript','LTspice'],
 'smart-grid-analysis':['Power systems','Python','Time-series features','ML validation'],
 'logisim-cpu':['Digital logic','ALU design','Instruction sets','Logisim'],
 'pedestrian-device-detection':['YOLO','Dataset preparation','GPU training','Model evaluation'],
 'computer-vision':['OpenCV','Camera calibration','Tracking','Printer interfaces'],
 'cruise-control':['MATLAB','PI control','Predictive control','Simulation'],
 'ceremonial-mace':['CAD','Design for manufacture','Machining collaboration'],
 'embedded-hardware':['C','SPI','Interrupts','Arduino'],
 'electric-echoworks':['React / TypeScript','FastAPI','Python','Audio DSP'],
 'my-rotation':['Python','JavaScript','SQLite','Browser storage'],
 'folio':['Python','OCR','Text-to-speech','Arabic / English'],
 'pocket-bridge':['Node.js','File streaming','Browser storage','PDF scanning'],
 'lantern-vale':['JavaScript','Canvas','Game systems','Save systems'],
 'document-automation':['Python','Flask','pandas','Document templates'],
 'ocr-foundations':['Python','Template matching','Skeletonization','Image classification'],
 'microgrid-hmi':['HMI design','SCADA concepts','Power-system interfaces']}
DESCRIPTIONS = {
 'circuit-studio':'A local circuit workbench that puts the schematic, hand calculations, LTspice results, and report figures in the same place.',
 'smart-grid-analysis':'Tools for inspecting 180 IEEE 68-bus disturbance scenarios, plus an MLP that predicts the event type and affected area.',
 'logisim-cpu':'An 8-bit processor built in Logisim: ALU, eight registers, instruction decoder, program counter, and conditional branches.',
 'pedestrian-device-detection':'A six-class pedestrian detector built around phone and headphone use. I worked on the dataset, Palmetto training runs, and the evaluation tools.',
 'computer-vision':'Photo calibration and design tools for a cookie printer, alongside experiments in tracking, segmentation, pose, and stereo vision.',
 'cruise-control':'MATLAB simulations comparing PI and predictive cruise control over the same changing road profile.',
 'ceremonial-mace':'The ceremonial mace I helped design for Greenville Technical College, from a multi-part CAD model through manufacturing iterations and the finished piece.',
 'embedded-hardware':'An alarm-clock team project using an encoder, SPI display, and interrupts, plus earlier analog-sensor and stepper-motor work.',
 'electric-echoworks':'My audio toolkit: conversion, denoising, frequency experiments, vocal separation, and transcription, with desktop and web interfaces.',
 'my-rotation':'A music application for organizing, processing, and listening to my own library, including downloads and a phone interface.',
 'folio':'A reader that turns English and Arabic books into reading and listening editions, with saved progress and offline exports.',
 'pocket-bridge':'A phone/computer file-transfer tool with photo capture, document scanning, and pending transfers that can be retried.',
 'lantern-vale':'A browser adventure that grew from an opening demo into a larger campaign. The original opening is playable here.',
 'document-automation':'A tool for filling Word templates from spreadsheet rows and producing batches of named documents.',
 'ocr-foundations':'My handwritten-letter OCR toolchain and earlier experiments with regression, MNIST, and CIFAR-10.',
 'microgrid-hmi':'A simulated microgrid display for explaining normal operation, a grid outage, and an emergency disconnect.'}
CONTEXT = {'circuit-studio':'Electronics / software','smart-grid-analysis':'ECE 4160 / power systems','logisim-cpu':'ECE 212 / computer architecture','pedestrian-device-detection':'ECE 4310 Lab 2 / machine learning','computer-vision':'Vision / senior project tools','cruise-control':'Controls / MATLAB','ceremonial-mace':'Greenville Technical College / design & manufacturing','embedded-hardware':'Embedded systems / team project'}

def logo(slug, size=''):
    return f'<img class="app-logo {size}" src="/assets/{LOGOS[slug]}" alt="" width="44" height="44">' if slug in LOGOS else ''

HOME_CATEGORIES = {
    'Circuits & Hardware': ['circuit-studio', 'logisim-cpu', 'embedded-hardware'],
    'Power Systems': ['smart-grid-analysis', 'microgrid-hmi'],
    'Controls': ['cruise-control', 'microgrid-hmi'],
    'Computer Vision & ML': ['pedestrian-device-detection', 'computer-vision', 'ocr-foundations'],
    'Design & Manufacturing': ['ceremonial-mace'],
    'Apps & Audio': ['electric-echoworks', 'my-rotation', 'folio', 'pocket-bridge', 'document-automation'],
    'Games': ['lantern-vale'],
}

def render_home(projects, render_card):
    filters = '<button type="button" data-home-filter="all" aria-pressed="true">All projects</button>' + ''.join(f'<button type="button" data-home-filter="{name}" aria-pressed="false">{name.replace("&", "&amp;")}</button>' for name in HOME_CATEGORIES)
    categories = {p['slug']: '|'.join(name for name, slugs in HOME_CATEGORIES.items() if p['slug'] in slugs) for p in projects}
    cards = ''.join(render_card(p).replace('<article class="project-card"', f'<article class="project-card" data-home-category="{categories[p["slug"]].replace("&", "&amp;")}"', 1) for p in projects)
    return """<main id="main" class="wrap"><section class="hero personal-intro"><div class="hero-main"><h1>Abdurrahman Housari</h1><p class="intro-role">Electrical engineering · Clemson University</p><p class="hero-copy">I’m finishing my electrical engineering degree in December 2026. I’ve worked on thermal PCB inspection at Savannah River National Laboratory, vision-guided robots at Good Sense Automation, and hands-on engineering labs at Greenville Technical College.</p><p class="hero-copy">Here are my projects in circuits, power systems, computer vision, manufacturing, and software. Open a project for the work itself, the skills I used, and a browser experience.</p><div class="actions"><a class="button primary" href="#projects">Projects</a><a class="button" href="/assets/Abdurrahman-Housari-Resume-October-2026.pdf">Résumé · October 2026</a><a href="https://www.linkedin.com/in/ahousari/">LinkedIn ↗</a></div><p class="availability">Available for full-time work from December 17, 2026.</p></div><div class="hero-photo-frame"><img class="hero-photo" src="/assets/portrait-home.jpg" alt="Abdurrahman Housari" width="235" height="270"></div></section><section id="projects" class="homepage-work" aria-labelledby="projects-heading"><div class="section-top"><div><h2 id="projects-heading">Projects</h2><p>Engineering work first, followed by applications and smaller experiments.</p></div><a href="/projects/">Browse by category →</a></div><div class="filter-bar home-filters" role="group" aria-label="Filter projects by category">"""+filters+"""</div><p class="results-count" id="home-results-count" aria-live="polite">16 projects</p><div class="project-grid" id="home-projects">"""+cards+"""</div></section><div class="home-contact"><p>For my experience and education, see <a href="/about/">About</a> or my <a href="/assets/Abdurrahman-Housari-Resume-October-2026.pdf">résumé</a>.</p><a href="/contact/">Contact →</a></div></main>"""
