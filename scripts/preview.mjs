import {createRequire} from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const require=createRequire(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/anchor.js'));
const {chromium}=require('playwright');
const root=path.resolve(import.meta.dirname,'..');fs.mkdirSync(path.join(root,'.qa'),{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:1100},deviceScaleFactor:1});
for(const name of ['crimson','navy','forest']){
  await page.goto('http://127.0.0.1:4173/design/?palette='+name);await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:path.join(root,'.qa',`homepage-${name}.png`)});
}
await browser.close();
const sharp=require('sharp');
const inputs=[];
for(let i=0;i<3;i++)inputs.push({input:await sharp(path.join(root,'.qa',`homepage-${['crimson','navy','forest'][i]}.png`)).resize(640,550).png().toBuffer(),left:i*640,top:0});
await sharp({create:{width:1920,height:550,channels:3,background:'#ddd'}}).composite(inputs).png().toFile(path.join(root,'.qa','palette-comparison.png'));
console.log('Saved the three homepage palette previews.');
