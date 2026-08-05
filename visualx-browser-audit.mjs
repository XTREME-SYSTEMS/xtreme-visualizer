import { chromium } from 'playwright';
import fs from 'fs';
import crypto from 'crypto';
const base='http://127.0.0.1:5173';
const routes=['/','/projects','/more','/visualizer','/generator','/products','/colors','/leads','/systems','/pricing','/appointments','/receipts','/guardrails','/close','/inbox','/settings','/competitive-pricing','/industry','/lead-generator','/crm','/email-templates','/bid-generator','/app/home','/app/scan','/app/visualizer','/app/compare','/app/blends','/app/metallic','/app/products','/app/quote','/app/proposal','/app/lead'];
const out='/tmp/visualx-browser-audit'; fs.rmSync(out,{recursive:true,force:true}); fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];
for(const viewport of [{name:'mobile',width:430,height:932},{name:'desktop',width:1440,height:1000}]){
 const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1,colorScheme:'dark'});
 for(const route of routes){
  if(viewport.name==='desktop' && route.startsWith('/app/')) continue;
  const page=await context.newPage();
  const consoleErrors=[]; const pageErrors=[]; const failed=[];
  page.on('console',m=>{if(m.type()==='error') consoleErrors.push(m.text())});
  page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText||''}));
  const started=Date.now(); let status=null; let navError='';
  try{const response=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:30000}); status=response?.status()||null; await page.waitForTimeout(1800);}catch(e){navError=String(e)}
  const bodyText=await page.locator('body').innerText().catch(()=> '');
  const title=await page.title().catch(()=> '');
  const headings=await page.locator('h1,h2').allTextContents().catch(()=>[]);
  const buttons=await page.locator('button:visible').count().catch(()=>0);
  const links=await page.locator('a:visible').count().catch(()=>0);
  const images=await page.locator('img:visible').count().catch(()=>0);
  const brokenImages=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute('src'))).catch(()=>[]);
  const unlabeledButtons=await page.locator('button:visible').evaluateAll(btns=>btns.filter(b=>!(b.innerText||'').trim()&&!b.getAttribute('aria-label')&&!b.getAttribute('title')).length).catch(()=>0);
  const horizontalOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+2).catch(()=>false);
  const screenshot=`${viewport.name}-${route==='/'?'home-root':route.replace(/^\//,'').replaceAll('/','-')||'root'}.png`;
  const shotPath=`${out}/${screenshot}`;
  await page.screenshot({path:shotPath,fullPage:true}).catch(()=>{});
  let sha256='',bytes=0,width=0,height=0;
  if(fs.existsSync(shotPath)){const buf=fs.readFileSync(shotPath);sha256=crypto.createHash('sha256').update(buf).digest('hex');bytes=buf.length; const png=buf; if(png.slice(1,4).toString()==='PNG'){width=png.readUInt32BE(16);height=png.readUInt32BE(20);}}
  results.push({viewport:viewport.name,route,status,finalUrl:page.url(),title,loadMs:Date.now()-started,navError,headings:headings.slice(0,12),buttons,links,images,brokenImages:[...new Set(brokenImages)].slice(0,30),unlabeledButtons,horizontalOverflow,bodySnippet:bodyText.slice(0,900),consoleErrors:[...new Set(consoleErrors)].slice(0,30),pageErrors:[...new Set(pageErrors)].slice(0,30),failedRequests:[...new Map(failed.map(x=>[x.url,x])).values()].slice(0,30),screenshot:{file:screenshot,sha256,bytes,width,height}});
  await page.close();
 }
 await context.close();
}
await browser.close();
const summary={generatedAt:new Date().toISOString(),base,routes:routes.length,tests:results.length,routePass:results.filter(r=>r.status===200&&!r.navError&&!r.pageErrors.length&&!/404|page not found/i.test(r.bodySnippet)).length,routeFail:results.filter(r=>r.status!==200||r.navError||r.pageErrors.length||/404|page not found/i.test(r.bodySnippet)).length,consoleErrorTests:results.filter(r=>r.consoleErrors.length).length,brokenImageTests:results.filter(r=>r.brokenImages.length).length,overflowTests:results.filter(r=>r.horizontalOverflow).length,appRoute404s:results.filter(r=>r.viewport==='mobile'&&r.route.startsWith('/app/')&&/404|page not found/i.test(r.bodySnippet)).map(r=>r.route)};
fs.writeFileSync(`${out}/BROWSER_AUDIT.json`,JSON.stringify({summary,results},null,2));
console.log(JSON.stringify(summary,null,2));
for(const r of results.filter(r=>r.viewport==='mobile')) console.log(`${r.route}\t${r.status}\t${r.headings[0]||'(no heading)'}\tpageErr=${r.pageErrors.length}\tconsoleErr=${r.consoleErrors.length}\tbroken=${r.brokenImages.length}\toverflow=${r.horizontalOverflow}\t${r.screenshot.width}x${r.screenshot.height}`);
