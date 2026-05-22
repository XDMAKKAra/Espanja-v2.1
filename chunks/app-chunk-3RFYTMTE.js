import{b as P}from"./app-chunk-HNFMJGBX.js";import{e as I}from"./app-chunk-J5WMHQ7F.js";import{r as M}from"./app-chunk-X6JAGYOW.js";import{g as A}from"./app-chunk-GS5SCRNH.js";import{c as u}from"./app-chunk-BKOFN7BD.js";import{a as $,c as w,e as _,j as E}from"./app-chunk-ECRDZOTG.js";import{b as L}from"./app-chunk-PXMVMW5B.js";var x="curr-root",S="curr-lesson-root",f={kurssit:null,expanded:null};function me(e){typeof e=="string"&&e.length>0&&(f.expanded=e)}function V(e){return{vocab:"Sanasto",grammar:"Kielioppi",reading:"Luetun ymm\xE4rt\xE4minen",writing:"Kirjoittaminen",mixed:"Yhdistelm\xE4",test:"Kertaustesti"}[e]||"Harjoitus"}function p(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function Y(e){if(!e)return"";let t=e.split(/\r?\n/),n=[],r=[],s=!1,i=[],c=!1,a=[],d=()=>{if(r.length===0)return;let g=b(r.join(" "));n.push(`<p>${g}</p>`),r=[]},o=()=>{if(c){if(a.length===0){c=!1;return}n.push("<ul>"+a.map(g=>`<li>${b(g)}</li>`).join("")+"</ul>"),c=!1,a=[]}},l=()=>{if(!s)return;if(i.length===0){s=!1;return}let g=i.map(y=>y.split("|").map(v=>v.trim()).filter((v,T,F)=>!(T===0&&v==="")&&!(T===F.length-1&&v===""))).filter(y=>y.length>0&&!y.every(v=>/^-+$/.test(v)));if(g.length===0){s=!1,i=[];return}let m=g[0],k=g.slice(1);n.push("<table>"),n.push("<thead><tr>"+m.map(y=>`<th>${b(y)}</th>`).join("")+"</tr></thead>"),k.length&&n.push("<tbody>"+k.map(y=>"<tr>"+y.map(v=>`<td>${b(v)}</td>`).join("")+"</tr>").join("")+"</tbody>"),n.push("</table>"),s=!1,i=[]},h=()=>{d(),l(),o()};function b(g){let m=p(g);return m=m.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),m=m.replace(/\*([^*]+)\*/g,"<em>$1</em>"),m=m.replace(/`([^`]+)`/g,"<code>$1</code>"),m}for(let g of t){let m=g.replace(/\s+$/,"");if(/^#{1,3}\s/.test(m)){h();let k=m.startsWith("### ")?3:m.startsWith("## ")?2:1,y=m.replace(/^#{1,3}\s+/,"");n.push(`<h${k}>${b(y)}</h${k}>`)}else/^>\s/.test(m)?(h(),n.push(`<blockquote>${b(m.replace(/^>\s+/,""))}</blockquote>`)):/^\|/.test(m)?(d(),o(),s=!0,i.push(m)):/^\s*[-*]\s+/.test(m)?(d(),l(),c=!0,a.push(m.replace(/^\s*[-*]\s+/,""))):/^\s*$/.test(m)?h():(l(),o(),r.push(m))}return h(),n.join(`
`)}function z(e){e.innerHTML=`
    <div class="curr">
      <div class="curr-head">
        <h2>Oppimispolku</h2>
        <p class="curr-sub">8 kurssia \xB7 YO-koevalmiiksi</p>
      </div>
      <div class="curr-skeleton" aria-busy="true" aria-label="Ladataan oppimispolkua">
        ${Array.from({length:8},()=>'<div class="curr-skeleton-card" aria-hidden="true"></div>').join("")}
      </div>
    </div>`}function N(e,t,n){e.innerHTML=`
    <div class="curr">
      <div class="curr-head">
        <h2>Oppimispolku</h2>
      </div>
      <div class="curr-error" role="alert">
        <p>${p(t||"Ei yhteytt\xE4, yrit\xE4 uudelleen.")}</p>
        <button type="button" class="btn-primary" id="curr-retry">Yrit\xE4 uudelleen</button>
      </div>
    </div>`;let r=e.querySelector("#curr-retry");r&&r.addEventListener("click",()=>n&&n())}function K(e){return e.isUnlocked?e.kertausPassed?{label:"Suoritettu \u2713",icon:null}:e.lessonsCompleted>0?{label:"Jatka \u2192",icon:null}:{label:"Aloita \u2192",icon:null}:{label:"Lukittu",icon:"\u{1F512}"}}function G(e){let t=["curr-card"];return e.isUnlocked?e.kertausPassed?t.push("is-done"):e.lessonsCompleted>0&&t.push("is-current"):t.push("is-locked"),e.isUnlocked&&t.push("is-clickable"),t.join(" ")}function D(e){let t=f.kurssit;if(!t||t.length===0){N(e,"Kursseja ei l\xF6ytynyt.",()=>C());return}let n=!w(),r=`
    <div class="curr">
      <div class="curr-head">
        <h2>Oppimispolku</h2>
        <p class="curr-sub">8 kurssia \xB7 YO-koevalmiiksi \xB7 ${p(`${t.filter(s=>s.kertausPassed).length} / ${t.length} suoritettu`)}</p>
      </div>
      ${n?`
        <div class="curr-empty">
          <p>Rekister\xF6idy n\xE4hd\xE4ksesi oma polkusi ja suorituksesi.</p>
          <a class="btn-primary" href="/app.html#rekisteroidy">Rekister\xF6idy \u2192</a>
        </div>`:""}
      <ol class="curr-list" aria-label="Kurssit">
        ${t.map((s,i)=>J(s,i+1)).join("")}
      </ol>
    </div>
  `;e.innerHTML=r,W(e)}function J(e,t){let n=K(e),r=e.lessonsCompleted||0,s=e.lessonCount||1,i=Math.min(100,Math.round(r/s*100)),c=f.expanded===e.key,a=e.kertausPassed?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>':e.isUnlocked?String(t):'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',d=!e.isUnlocked&&t>1?`Suorita ensin Kurssi ${t-1} (kertaustestiss\xE4 \u2265 80 %).`:"",o=d?` data-tooltip="${p(d)}"`:"",l=e.isUnlocked?"":' tabindex="0"',h=`${r} / ${s} oppituntia`;return`
    <li class="${G(e)}${c?" is-expanded":""}"
        data-kurssi="${p(e.key)}"${o}
        ${e.isUnlocked?'tabindex="0" aria-expanded="'+(c?"true":"false")+'"':'aria-disabled="true"'+l}>
      <div class="curr-step" aria-hidden="true">${a}</div>
      <div class="curr-body">
        <div class="curr-title-row">
          <h3 class="curr-title">${p(`${t}. ${e.title}`)}</h3>
          <span class="curr-chip" aria-label="${p("Taso "+e.level)}">${p(e.level)}</span>
        </div>
        <div class="curr-progress">
          <div class="curr-progress-bar" role="progressbar" aria-label="${p(h)}" aria-valuenow="${i}" aria-valuemin="0" aria-valuemax="100">
            <div class="curr-progress-fill" style="width:${i}%"></div>
          </div>
          <span>${p(h)}</span>
        </div>
      </div>
      <div class="curr-status">${p(n.label)}</div>
      ${c?X(e.key):""}
    </li>`}function W(e){e.querySelectorAll(".curr-card.is-clickable").forEach(t=>{let n=r=>{if(r.target.closest(".curr-lessons"))return;let s=t.dataset.kurssi;j(s)};t.addEventListener("click",n),t.addEventListener("keydown",r=>{if(r.key==="Enter"||r.key===" "){r.preventDefault();let s=t.dataset.kurssi;j(s)}})})}async function j(e){let t=f.expanded===e;f.expanded=t?null:e;let n=document.getElementById(x);n&&(D(n),U(),t||await R(e))}var B=new Map;async function R(e){let t=document.querySelector(`.curr-bento[data-kurssi="${Q(e)}"]`);if(!t)return;let n=B.get(e);if(n&&Date.now()-n.ts<6e4){H(t,e,n.lessons);return}try{let r=await E(`${$}/api/curriculum/${encodeURIComponent(e)}`,{headers:{..._()}});if(!r.ok)throw new Error("Oppituntien lataus ep\xE4onnistui");let s=await r.json(),i=Array.isArray(s.lessons)?s.lessons:[];B.set(e,{lessons:i,ts:Date.now()}),H(t,e,i)}catch(r){t.innerHTML=`<p class="curr-bento-error" role="alert">${p(r.message||"Ei yhteytt\xE4, yrit\xE4 uudelleen.")}</p>`}}function Q(e){return String(e).replace(/"/g,'\\"')}function X(e){return`<div class="curr-bento curr-bento--loading" data-kurssi="${p(e)}" aria-busy="true" aria-label="Ladataan oppitunteja">
    <div class="curr-bento-loading">
      <span class="curr-bento-loading__dot"></span>
      <p class="curr-bento-loading__label">Avataan kurssia\u2026</p>
    </div>
  </div>`}function H(e,t,n){if(!n||n.length===0){e.removeAttribute("aria-busy"),e.innerHTML='<p class="curr-bento-empty">Oppitunteja ei viel\xE4 julkaistu t\xE4lle kurssille.</p>';return}let r=n.slice().sort((o,l)=>(o.sortOrder||0)-(l.sortOrder||0)),s=r.find(o=>!o.completed)||null,i=r.filter(o=>o.completed).length,c=r.length,a=`<div class="curr-bento-grid" role="list">${r.map(o=>Z(t,o,s)).join("")}</div>`;e.removeAttribute("aria-busy"),e.innerHTML=a,e.querySelectorAll(".curr-bento-card").forEach(o=>{if(o.getAttribute("aria-disabled")==="true")return;let l=Number(o.dataset.lesson);o.addEventListener("click",h=>{h.stopPropagation(),Number.isFinite(l)&&q(t,l)})}),e.querySelectorAll(".curr-bento-strip__dot").forEach(o=>{o.addEventListener("click",l=>{l.stopPropagation();let h=e.querySelector(`.curr-bento-card[data-lesson="${o.dataset.lesson}"]`);h&&(h.scrollIntoView({behavior:"smooth",block:"nearest"}),h.focus({preventScroll:!0}))})});let d=e.querySelector(".curr-bento-card--feature");d&&"IntersectionObserver"in window&&new IntersectionObserver((l,h)=>{l.forEach(b=>{b.isIntersecting&&(d.classList.add("is-pulsing"),h.disconnect())})},{threshold:.4}).observe(d)}function Z(e,t,n){let r=!!t.completed,s=n&&t.sortOrder===n.sortOrder,i=["curr-bento-card"];s?i.push("curr-bento-card--feature"):r&&i.push("curr-bento-card--done");let c=String(t.sortOrder).padStart(2,"0"),a=String(t.focus||`Oppitunti ${t.sortOrder}`),d=V(t.type),o=r?"suoritettu":s?"vuorossa":"tulossa",l=`Oppitunti ${t.sortOrder}: ${a}. ${d}. Tila: ${o}.`,h=r?'<span class="curr-bento-card__mark" aria-hidden="true">\u2713</span>':s?'<span class="curr-bento-card__mark curr-bento-card__mark--next" aria-hidden="true">\u2192</span>':'<span class="curr-bento-card__mark" aria-hidden="true"></span>';return`
    <button type="button"
            class="${i.join(" ")}"
            data-lesson="${t.sortOrder}"
            role="listitem"
            aria-label="${p(l)}">
      ${h}
      <div class="curr-bento-card__body">
        <span class="curr-bento-num">${p(c)} &middot; ${p(d)}</span>
        <h4 class="curr-bento-title">${p(a)}</h4>
      </div>
    </button>`}async function C(){ee();let e=document.getElementById(x);if(!e)return;L("screen-path"),import("./app-teachingPanel-3SDRI6FH.js").then(i=>i.refreshTeachingPanel?.()).catch(()=>{});let t=u.language==="de"||u.language==="fr"?u.language:"es",n="_curriculumResolved_"+t,r=n+"_at";window[n]&&Date.now()-(window[r]||0)<3e4||z(e);try{let i="_curriculumCache_"+t;(!window[i]||Date.now()-(window[i+"_at"]||0)>3e4)&&(window[i]=E(`${$}/api/curriculum?lang=${encodeURIComponent(t)}`,{headers:{...w()?_():{}}}).then(async l=>({ok:l.ok,status:l.status,data:l.ok?await l.json().catch(()=>null):null})),window[i+"_at"]=Date.now());let c=await window[i];if(c.ok&&c.data&&(window[n]=c.data,window[r]=Date.now()),!c.ok)throw c.status===401?new Error("Kirjaudu sis\xE4\xE4n n\xE4hd\xE4ksesi polun."):c.status===403?new Error("T\xE4m\xE4 kieli ei ole viel\xE4 k\xE4yt\xF6ss\xE4."):c.status===404?new Error("Polkup\xE4\xE4tepistett\xE4 ei l\xF6ytynyt, yrit\xE4 uudelleen."):c.status>=500?new Error(`Palvelinvirhe (${c.status}), yrit\xE4 uudelleen.`):new Error(`Polun lataus ep\xE4onnistui (HTTP ${c.status}).`);let a={ok:!0,status:200,json:async()=>c.data};if(!a.ok)throw a.status===401?new Error("Kirjaudu sis\xE4\xE4n n\xE4hd\xE4ksesi polun."):a.status===403?new Error("T\xE4m\xE4 kieli ei ole viel\xE4 k\xE4yt\xF6ss\xE4."):a.status===404?new Error("Polkup\xE4\xE4tepistett\xE4 ei l\xF6ytynyt, yrit\xE4 uudelleen."):a.status>=500?new Error(`Palvelinvirhe (${a.status}), yrit\xE4 uudelleen.`):new Error(`Polun lataus ep\xE4onnistui (HTTP ${a.status}).`);let d;try{d=await a.json()}catch{throw new Error("Polun vastaus oli virheellinen, yrit\xE4 uudelleen.")}if(!d||typeof d!="object")throw new Error("Polun vastaus oli tyhj\xE4, yrit\xE4 uudelleen.");if(d.available===!1)throw new Error(d.message||"Sis\xE4lt\xF6\xE4 ei viel\xE4 julkaistu t\xE4lle kielelle.");f.kurssit=Array.isArray(d.kurssit)?d.kurssit.filter(l=>l&&typeof l.key=="string"):[];let o=f.expanded?f.kurssit.find(l=>l.key===f.expanded):null;if(!o||!o.isUnlocked||o.kertausPassed){let l=f.kurssit.find(h=>h.isUnlocked&&!h.kertausPassed)||f.kurssit.find(h=>h.isUnlocked);f.expanded=l?l.key:null}D(e),U(),f.expanded&&R(f.expanded)}catch(i){N(e,i.message||"Jokin meni pieleen",()=>C())}}function U(){let e=document.getElementById("path-toc-list");if(!e)return;let t=f.kurssit||[];if(t.length===0){e.innerHTML='<li class="path-toc__loading">Kursseja ei l\xF6ytynyt.</li>',e.removeAttribute("aria-busy");return}let n=t.map((r,s)=>{let i=s+1,c=f.expanded===r.key,a=!!r.kertausPassed,d=!r.isUnlocked,o=["path-toc__item",a?"is-done":"",d?"is-locked":"",c?"is-active":""].filter(Boolean).join(" "),l=a?'<span class="path-toc__mark" aria-hidden="true">\u2713</span>':d?'<span class="path-toc__mark" aria-hidden="true">\u{1F512}</span>':'<span class="path-toc__mark" aria-hidden="true">\u2192</span>';return`<li class="${o}" data-kurssi="${p(r.key)}" ${d?'aria-disabled="true"':'tabindex="0"'}>
      <span class="path-toc__num">${i}</span>
      <span class="path-toc__title">${p(r.title)}</span>
      ${l}
    </li>`}).join("");e.innerHTML=n,e.removeAttribute("aria-busy"),e.querySelectorAll(".path-toc__item:not(.is-locked)").forEach(r=>{let s=()=>{let i=r.dataset.kurssi;i&&j(i)};r.addEventListener("click",s),r.addEventListener("keydown",i=>{(i.key==="Enter"||i.key===" ")&&(i.preventDefault(),s())})})}function ee(){let e=document.getElementById("path-courses-root");e&&(document.getElementById(x)||(e.innerHTML=`<div id="${x}"></div>`))}async function q(e,t){te();let n=document.getElementById(S);if(n){try{sessionStorage.setItem("currentLesson",JSON.stringify({kurssiKey:e,lessonIndex:t}))}catch{}L("screen-lesson"),n.innerHTML=`<div class="curr-lesson-page curr-lesson-page--loading" aria-busy="true">
    <button type="button" class="curr-back" id="curr-lesson-back">\u2190 Oppimispolku</button>
    <div class="curr-lesson-loading">
      <span class="curr-lesson-loading__dot"></span>
      <p class="curr-lesson-loading__label">Avataan oppituntia\u2026</p>
    </div>
  </div>`,document.getElementById("curr-lesson-back")?.addEventListener("click",O);try{let r=await E(`${$}/api/curriculum/${encodeURIComponent(e)}/lesson/${t}`,{headers:{...w()?_():{}}});if(!r.ok)throw new Error("Oppitunnin lataus ep\xE4onnistui");let s=await r.json();if(s&&s.pregenerated&&Array.isArray(s.pregenerated.phases)){let a=String(s.lessonContext?.targetGrade||"B");(await import("./app-lessonRunner-725FBCD2.js")).runPregeneratedLesson(s,e,t,a);return}let i=Number(s?.lessonContext?.exerciseCount)||Number(s?.lesson?.exerciseCount)||null,c=String(s?.lessonContext?.targetGrade||"B");try{sessionStorage.setItem("currentLesson",JSON.stringify({kurssiKey:e,lessonIndex:t,lessonFocus:s?.lesson?.focus||"",lessonType:s?.lesson?.type||"",lessonExerciseCount:i,targetGrade:c}));let a=s?.teachingPage?.contentMd||"";a?sessionStorage.setItem("currentLessonTeachingMd",a):sessionStorage.removeItem("currentLessonTeachingMd")}catch{}ie(n,e,s)}catch(r){n.innerHTML=`<div class="curr-lesson-page">
      <button type="button" class="curr-back" id="curr-lesson-back">\u2190 Oppimispolku</button>
      <div class="curr-error" role="alert">
        <p>${p(r.message||"Ei yhteytt\xE4, yrit\xE4 uudelleen.")}</p>
        <button type="button" class="btn-primary" id="curr-lesson-retry">Yrit\xE4 uudelleen</button>
      </div>
    </div>`,document.getElementById("curr-lesson-back")?.addEventListener("click",O),document.getElementById("curr-lesson-retry")?.addEventListener("click",()=>q(e,t))}}}function te(){let e=document.getElementById("screen-lesson");e||(e=document.createElement("div"),e.id="screen-lesson",e.className="screen",document.querySelector(".app-main")?.appendChild(e)||document.body.appendChild(e)),document.getElementById(S)||(e.innerHTML=`<div id="${S}"></div>`)}function re(e,t){let n=Number(e)||1,r=t||"vocab";return r==="writing"?Math.max(20,18+Math.round(n*2)):r==="reading"?Math.max(15,12+Math.round(n*1.5)):r==="test"?35:r==="grammar"?Math.max(12,10+Math.round(n*.8)):Math.max(10,8+Math.round(n*.6))}function ne(e,t){let n=Number(t?.exerciseCount)||e.exerciseCount||8,r=re(n,e.type);return e.type==="test"?`Aloita kertaustesti (${n} kysymyst\xE4, ~${r} min) \u2192`:e.type==="reading"?`Aloita luetun ymm\xE4rt\xE4minen (~${r} min) \u2192`:e.type==="writing"?`Aloita kirjoittaminen (~${r} min) \u2192`:`Aloita harjoittelu (${n} teht\xE4v\xE4\xE4, ~${r} min) \u2192`}function se(e){let t=/^kurssi_(\d+)$/.exec(String(e||""));return t?Number(t[1]):null}function ie(e,t,n){let{lesson:r,teachingPage:s,lessonContext:i}=n,c=s?.contentMd?Y(s.contentMd):null,a=se(t),d=a!=null?`Kurssi ${a} \xB7 Oppitunti ${r.sortOrder}`:`Oppitunti ${r.sortOrder}`,o=c?`<article class="curr-teaching" id="curr-teaching" aria-label="Opetussivu">${c}</article>`:r.teachingSnippet?`<p class="curr-snippet">${p(r.teachingSnippet)}</p>`:"";e.innerHTML=`
    <div class="curr-lesson-page">
      <button type="button" class="curr-back" id="curr-lesson-back">\u2190 Oppimispolku</button>
      <header class="curr-lesson-hero">
        <p class="curr-eyebrow">${p(d)}</p>
        <h1>${p(r.focus)}</h1>
      </header>
      ${o}
      <div class="curr-actions">
        <button type="button" class="btn btn-primary" id="curr-start">${p(ne(r,i))}</button>
        <p class="curr-actions-hint">Voit aina palata t\xE4h\xE4n opetussivuun harjoituksen aikana.</p>
      </div>
    </div>`,document.getElementById("curr-lesson-back")?.addEventListener("click",O),document.getElementById("curr-start")?.addEventListener("click",()=>ae(t,r))}function ae(e,t){let{type:n}=t;if(u.sessionStartTime=Date.now(),n==="vocab"){u.mode="vocab",u.topic="general vocabulary",u.level="B",u.startLevel="B",u.peakLevel="B",u.batchNumber=0,u.totalCorrect=0,u.totalAnswered=0,u.recentVocabHeadwords=[],history.replaceState(null,"","#/sanasto"),M();return}if(n==="grammar"||n==="mixed"||n==="test"){u.mode="grammar",u.grammarTopic="mixed",u.grammarLevel="C",history.replaceState(null,"","#/puheoppi"),I();return}if(n==="reading"){u.mode="reading",u.readingTopic="animals and nature",u.readingLevel="C",history.replaceState(null,"","#/luetun"),P();return}if(n==="writing"){u.mode="writing",u.writingTaskType="short",u.writingTopic="general",history.replaceState(null,"","#/kirjoitus"),A();return}u.mode="vocab",u.topic="general vocabulary",u.level="B",u.batchNumber=0,u.totalCorrect=0,u.totalAnswered=0,history.replaceState(null,"","#/sanasto"),M()}function O(){C()}export{me as a,Y as b,C as c,q as d};
//# sourceMappingURL=app-chunk-3RFYTMTE.js.map
