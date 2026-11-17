import{e,h,l as c,i as m,j as d}from"./index-ols54taE.js";const n="https://mutex.buzz";let r=!1;async function w(){if(!r){r=!0,e("reading the lock from mutex.buzz");try{const[o,l]=await Promise.all([fetch(`${n}/now.json`).then(t=>t.ok?t.json():Promise.reject(new Error(String(t.status)))),fetch(`${n}/lock.spw`).then(t=>t.ok?t.text():Promise.reject(new Error(String(t.status))))]),a=Date.now(),s=h((o==null?void 0:o.holds)??[],a);if(!s){e("mutex.buzz has no hold for this moment");return}const[i,u]=c(s,a);m(`${i}
${u}
${l}`,`${n}/lock.spw`,{ingest:!1}),d(0),e(`${s.title} holds the lock · from mutex.buzz`)}catch{e("mutex.buzz did not answer")}finally{r=!1}}}export{w as consumeMutex};
//# sourceMappingURL=mutex-feed-oc9htvBG.js.map
