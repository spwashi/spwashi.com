import {readFileSync} from 'node:fs';
import * as h from '../../../scripts/lib/chrome-headless-harness.mjs';
const root=h.ROOT+'/';
const css='@layer tokens {'+readFileSync(root+'public/css/tokens/core.css','utf8')+'}'+readFileSync(root+'public/css/themes/packs.css','utf8');
const port=await h.pickFreePort(), chrome=await h.openChrome(await h.resolveChrome(),await h.createChromeProfileDir(),port);
let session;
try {
 const target=await h.newPageTarget(port); session=new h.CdpSession(target.webSocketDebuggerUrl); await session.open();
 await h.evaluateProbe(session,`document.head.innerHTML='<style>'+${JSON.stringify(css)}+'</style>'; document.body.innerHTML='<div id="probe">Theme text</div>'`);
 const result=await h.evaluateProbe(session,`(() => {
 const packs=['neutral-paper','ritual-vellum','oxide-ledger','electric-studio','copper-brace','glass-console','banked-ember'];
 const canvas=document.createElement('canvas'); canvas.width=canvas.height=1; const ctx=canvas.getContext('2d');
 const rgba=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v)};
 const blend=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3]));
 const lum=a=>a.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const el=document.getElementById('probe'), out=[];
 const color=token=>{el.style.color='var('+token+')';return rgba(getComputedStyle(el).color)};
 for(const pack of packs)for(const mode of ['light','dark']){
 document.documentElement.dataset.spwThemePack=pack;document.documentElement.dataset.spwColorMode=mode;
 const base=color('--bg');let min=99,worst='';
 for(const surface of ['--bg','--paper','--surface','--surface-panel','--surface-matte','--surface-contrast'])for(const ink of ['--ink-soft','--ink-mid','--ink-muted']){
 const bg=blend(color(surface),base), fg=blend(color(ink),bg); const x=lum(bg),y=lum(fg),ratio=(Math.max(x,y)+.05)/(Math.min(x,y)+.05);
 if(ratio<min){min=ratio;worst=ink+' on '+surface;}
 }
 out.push({pack,mode,min:+min.toFixed(2),worst});
 }return out;
 })()`);
 console.log(JSON.stringify(result,null,2));
 if(result.some(row=>row.min<4.5)) process.exitCode=1;
}finally{session?.close();h.killProcessTree(chrome)}
