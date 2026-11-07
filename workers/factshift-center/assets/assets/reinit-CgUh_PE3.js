import{k as c,l as u,n as l,o as d,q as g,u as p,v as k,w as m,x as w,_ as S}from"./index-ohR_R7_c.js";async function h(){const{createSimulationRenderPipeline:e}=await S(()=>import("./pipeline-Yw5dM31k.js"),__vite__mapDeps([0,1,2]));return e()}async function E(){var i;const e=c();try{l(u.svg),d({counter:0});const n=await h(),r=n.createScene(e),t=g();n.bindScene(r,t),p();const{tick:s,internalTicker:a}=n.createTicker(r,t);if(k({tick:s,internalTicker:a}),t.on("tick.render",null),t.on("tick.render",a),!document.querySelector("#output")){e.callbacks.acknowledgeLonging("wondering about output");return}const o=(i=e.workbench)==null?void 0:i.getLatestRun();o?m(o):w()}catch(n){console.error("Error during reinit:",n),e.callbacks.acknowledgeLonging("Error during reinit")}}export{E as reinit};
//# sourceMappingURL=reinit-CgUh_PE3.js.map
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/pipeline-Yw5dM31k.js","assets/index-ohR_R7_c.js","assets/index-7EuSeWlB.css"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}