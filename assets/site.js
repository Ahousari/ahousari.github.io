(() => {
  'use strict';
  const palettes = {crimson:['#bd2028','#991820','#fbf1f1'],navy:['#23415b','#182f44','#f0f4f8'],forest:['#2c6554','#1b4c3e','#eff6f2']};
  function palette(name) {
    const colors=palettes[name]; if(!colors) return;
    ['--accent','--accent-dark','--tint'].forEach((v,i)=>document.documentElement.style.setProperty(v,colors[i]));
    document.querySelectorAll('[data-palette]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.palette===name)));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',colors[0]);
  }
  const selected = new URLSearchParams(location.search).get('palette')||'navy';
  if(selected) palette(selected);
  document.querySelectorAll('[data-palette]').forEach(b=>b.addEventListener('click',()=>{
    palette(b.dataset.palette); const u=new URL(location.href);u.searchParams.set('palette',b.dataset.palette);history.replaceState(null,'',u);
  }));
  const cards=[...document.querySelectorAll('#all-projects .project-card')];
  let category='all';
  function filter(){
    const q=(document.getElementById('project-search')?.value||'').trim().toLowerCase(); let count=0;
    cards.forEach(c=>{c.hidden=!(category==='all'||c.dataset.category===category)||!c.dataset.search.includes(q);if(!c.hidden)count++;});
    const status=document.getElementById('results-count');if(status)status.textContent=`${count} ${count===1?'project':'projects and collections'}`;
    const empty=document.querySelector('.empty-state');if(empty)empty.hidden=count!==0;
  }
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{
    category=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));filter();
  }));
  document.getElementById('project-search')?.addEventListener('input',filter);
  const homeCards=[...document.querySelectorAll('#home-projects .project-card')];
  document.querySelectorAll('[data-home-filter]').forEach(button=>button.addEventListener('click',()=>{
    const category=button.dataset.homeFilter;
    document.querySelectorAll('[data-home-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    let count=0;
    homeCards.forEach(card=>{card.hidden=category!=='all'&&!card.dataset.homeCategory.split('|').includes(category);if(!card.hidden)count++;});
    const status=document.getElementById('home-results-count');if(status)status.textContent=`${count} ${count===1?'project':'projects'}`;
  }));
  document.querySelectorAll('[data-mace]').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('[data-mace]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    document.querySelectorAll('[data-mace-view]').forEach(v=>v.hidden=b.dataset.mace!=='both'&&b.dataset.mace!==v.dataset.maceView);
    const views=document.getElementById('mace-views');if(views)views.style.gridTemplateColumns=b.dataset.mace==='both'?'':'1fr';
  }));
})();
