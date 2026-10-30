import{k as l,l as u,n as d,o as g,q as p,u as k,v as m,w,_ as S}from"./index-igw5NEpc.js";async function h(){const{createSimulationRenderPipeline:e}=await S(()=>import("./pipeline-lc3In9Dw.js"),__vite__mapDeps([0,1,2]));return e()}async function f(){var i;const e=l();try{d(u.svg),g({counter:0});const n=await h(),r=n.createScene(e),t=p();n.bindScene(r,t),k();const{tick:c,internalTicker:a}=n.createTicker(r,t);m({tick:c,internalTicker:a}),t.on("tick.render",null),t.on("tick.render",a);const o=document.querySelector("#output");if(!o){e.callbacks.acknowledgeLonging("wondering about output");return}const s=(i=e.workbench)==null?void 0:i.getLatestRun();s?w(s):o.textContent=JSON.stringify(e.parameters,null,2)}catch(n){console.error("Error during reinit:",n),e.callbacks.acknowledgeLonging("Error during reinit")}}export{f as reinit};
//# sourceMappingURL=reinit-YBtAVZKw.js.map
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/pipeline-lc3In9Dw.js","assets/index-igw5NEpc.js","assets/index-GFqw6WUz.css"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}