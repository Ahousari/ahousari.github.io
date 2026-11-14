import {createRequire} from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
const require=createRequire(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/anchor.js'));
const {chromium}=require('playwright');const sharp=require('sharp');
const root=path.resolve(import.meta.dirname,'..');
const projects=JSON.parse(fs.readFileSync(path.join(root,'build/assets/projects.json'),'utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true});
for(const p of projects){
 const context=await browser.newContext({viewport:{width:1280,height:1000},deviceScaleFactor:1});const page=await context.newPage();
 await page.goto('http://127.0.0.1:4173/projects/'+p.slug+'/');
 await page.locator('.demo-shell').scrollIntoViewIfNeeded();
 if(p.slug==='my-rotation')await page.locator('#rotation-tracks tr').first().waitFor();
 if(p.slug==='lantern-vale')await page.frameLocator('.game-embed').locator('#loading').waitFor({state:'hidden'});
 await page.evaluate(async()=>{for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
 const bytes=await page.locator('.demo-shell').screenshot();
 await sharp(bytes).resize({width:1280,withoutEnlargement:true}).jpeg({quality:88}).toFile(path.join(root,'public/assets','demo-'+p.slug+'.jpg'));
 await context.close();
}
await browser.close();console.log(`Captured ${projects.length} browser-experience previews with fresh, sample-only browser state.`);
