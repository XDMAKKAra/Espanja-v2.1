import{a as $,b as h,c as E,d as g}from"./app-chunk-X5FNXJFC.js";import{c as a}from"./app-chunk-U4GCB5Y4.js";import{a as b,c as T,e as v,i as k}from"./app-chunk-FQ6ADMMO.js";import{b as L}from"./app-chunk-6FS5BSBG.js";var w="screen-lesson-results",f="lesson-results-root";function l(s){return String(s??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function S(){let s=document.getElementById(w);return s||(s=document.createElement("div"),s.id=w,s.className="screen",document.querySelector(".app-main")?.appendChild(s)||document.body.appendChild(s)),document.getElementById(f)||(s.innerHTML=`<div id="${f}"></div>`),document.getElementById(f)}async function G(s){let t=S();L(w);let{kurssiKey:e,lessonIndex:r,lessonFocus:n,scoreCorrect:o,scoreTotal:i}=s,c=i>0?Math.round(o/i*100):0,y=c>=80?"good":c>=60?"warn":"low";if(E()){g(!1),t.innerHTML=M({scoreCorrect:o,scoreTotal:i,pct:c,lessonFocus:n}),document.getElementById("lr-deepen-back")?.addEventListener("click",()=>p());return}if(t.innerHTML=H({scoreCorrect:o,scoreTotal:i,pct:c,tone:y,lessonFocus:n}),!T()){D(t,s);return}let m=null;try{let u=await k(`${b}/api/curriculum/${encodeURIComponent(e)}/lesson/${r}/complete`,{method:"POST",headers:{"Content-Type":"application/json",...v()},body:JSON.stringify({scoreCorrect:o,scoreTotal:i,wrongAnswers:s.wrongAnswers||[],reviewItems:s.reviewItems||[],lessonType:s.lessonType})});if(!u.ok)throw new Error("Tallennus ep\xE4onnistui");m=await u.json()}catch(u){R(t,s,u.message||"Ei yhteytt\xE4 \u2014 tulokset n\xE4ytet\xE4\xE4n, mutta tallennus ep\xE4onnistui.");return}K(t,s,m)}function M({scoreCorrect:s,scoreTotal:t,pct:e,lessonFocus:r}){return`
    <article class="lr-card lr-card--deepen" aria-live="polite">
      <header class="lr-head">
        <p class="lr-eyebrow">Syvennys suoritettu</p>
        <h1 class="lr-focus">${l(r||"")}</h1>
      </header>
      <section class="lr-score lr-score--good" aria-label="Syvennyksen tulos">
        <div class="lr-score-num"><span class="lr-score-correct">${s}</span><span class="lr-score-divider"> / </span><span class="lr-score-total">${t}</span></div>
        <div class="lr-score-label">syvennyksess\xE4 oikein${t>0?" \xB7 "+e+" %":""}</div>
      </section>
      <section class="lr-tutor">
        <p class="lr-tutor-msg">L-tavoite: 4 vaativampaa lis\xE4teht\xE4v\xE4\xE4 on tehty. Aihe on automatisoitumassa.</p>
      </section>
      <section class="lr-actions">
        <button type="button" class="btn btn-primary lr-cta-primary" id="lr-deepen-back">Jatka oppimispolkua \u2192</button>
      </section>
    </article>`}function H({scoreCorrect:s,scoreTotal:t,pct:e,tone:r,lessonFocus:n}){return`
    <article class="lr-card" aria-live="polite">
      <header class="lr-head">
        <p class="lr-eyebrow">Oppitunti suoritettu</p>
        <h1 class="lr-focus">${l(n||"")}</h1>
      </header>
      <section class="lr-score lr-score--${r}" aria-label="Tulos">
        <div class="lr-score-num"><span class="lr-score-correct">${s}</span><span class="lr-score-divider"> / </span><span class="lr-score-total">${t}</span></div>
        <div class="lr-score-label">oikein${t>0?" \xB7 "+e+" %":""}</div>
        <div class="lr-bar" role="progressbar"
             aria-label="Tuloksen edistyminen, ${e} % oikein"
             aria-valuenow="${e}" aria-valuemin="0" aria-valuemax="100">
          <div class="lr-bar-fill" style="width:${e}%"></div>
        </div>
      </section>
      <section class="lr-meta" id="lr-meta">
        <div class="lr-skeleton-line" aria-busy="true"></div>
      </section>
      <section class="lr-tutor" id="lr-tutor">
        <div class="lr-skeleton-line" aria-busy="true"></div>
        <div class="lr-skeleton-line lr-skeleton-line--short"></div>
      </section>
      <section class="lr-actions" id="lr-actions"></section>
    </article>`}function K(s,t,e){let r=document.getElementById("lr-meta"),n=document.getElementById("lr-tutor"),o=document.getElementById("lr-actions");if(!r||!n||!o)return;r.innerHTML=`<p class="lr-meta-prompt">${l(e.metacognitivePrompt||"")}</p>`,n.innerHTML=`<p class="lr-tutor-msg">${l(e.tutorMessage||"")}</p>`,j(n,e.reviewSummary);let c=$()?.targetGrade||"B",y=t.scoreTotal>0?t.scoreCorrect/t.scoreTotal:0,m=t.lessonType==="vocab"||t.lessonType==="grammar"||t.lessonType==="mixed",I=c==="L"&&y>=.85&&m&&!e.kurssiComplete?`<div class="lr-deepen" role="region" aria-label="L-tason syvent\xE4v\xE4t harjoitukset">
         <h3 class="lr-deepen__title">Syvenn\xE4 taitoasi</h3>
         <p class="lr-deepen__body">L-tavoitteena halutaan t\xE4ydellinen hallinta. 4 lis\xE4teht\xE4v\xE4\xE4 samasta aiheesta vaativammilla ehdoilla \u2014 tee ne nyt kun aihe on tuore.</p>
         <div class="lr-deepen__row">
           <button type="button" class="btn btn-primary" id="btn-deepen-yes">Tee 4 lis\xE4teht\xE4v\xE4\xE4 (~6 min)</button>
           <button type="button" class="btn btn-secondary" id="btn-deepen-skip">Ohita t\xE4ll\xE4 kertaa</button>
         </div>
       </div>`:"",B=e.fastTrack?`<div class="lr-fasttrack" role="alert" aria-label="Nopea eteneminen">
         <span class="lr-fasttrack-icon" aria-hidden="true">\u26A1</span>
         <p class="lr-fasttrack-text">T\xE4m\xE4 vaikuttaa tutulta \u2014 tehd\xE4\xE4nk\xF6 suoraan kertaustesti?</p>
         <div class="lr-fasttrack-row">
           <button type="button" class="btn btn-primary" id="lr-fasttrack-yes">Siirry kertaustestiin \u2192</button>
           <button type="button" class="btn btn-secondary" id="lr-fasttrack-no">Jatka j\xE4rjestyksess\xE4</button>
         </div>
       </div>`:"",_=e.kurssiComplete&&e.nextKurssiKey,C=`
    ${B}
    ${I}
    <button type="button" class="btn btn-primary lr-cta-primary" id="lr-cta-back">Jatka oppimispolkua \u2192</button>
    ${_?`<button type="button" class="btn btn-secondary lr-cta-secondary" id="lr-cta-next-kurssi">Aloita ${l(e.nextKurssiTitle||e.nextKurssiKey)} \u2192</button>`:""}
  `;o.innerHTML=C,document.getElementById("lr-cta-back")?.addEventListener("click",()=>p()),document.getElementById("lr-cta-next-kurssi")?.addEventListener("click",()=>p(e.nextKurssiKey)),document.getElementById("lr-fasttrack-yes")?.addEventListener("click",()=>A(t.kurssiKey)),document.getElementById("lr-fasttrack-no")?.addEventListener("click",()=>{let d=document.querySelector(".lr-fasttrack");d&&d.remove()}),document.getElementById("btn-deepen-yes")?.addEventListener("click",()=>N(t)),document.getElementById("btn-deepen-skip")?.addEventListener("click",()=>{let d=document.querySelector(".lr-deepen");d&&d.remove()})}async function N(s){if(g(!0),a.batchNumber=0,a.totalCorrect=0,a.totalAnswered=0,a.recentVocabHeadwords=[],a.sessionStartTime=Date.now(),s.lessonType==="vocab"){let e=await import("./app-vocab-A4XBAA42.js");a.mode="vocab",a.topic="general vocabulary",a.level="B",a.startLevel="B",a.peakLevel="B",history.replaceState(null,"","#/sanasto"),e.loadNextBatch();return}let t=await import("./app-grammar-Z6CVOGOS.js");a.mode="grammar",a.grammarTopic="mixed",a.grammarLevel="C",history.replaceState(null,"","#/puheoppi"),t.loadGrammarDrill()}async function A(s){h();try{sessionStorage.removeItem("dashTutorMsg")}catch{}let t=null;try{let r=await k(`${b}/api/curriculum/${encodeURIComponent(s)}`,{headers:v()});if(r.ok){let{lessons:n}=await r.json();Array.isArray(n)&&n.length>0&&(t=n[n.length-1].sortOrder??n.length)}}catch{}let e=await import("./app-curriculum-SQ4OPGMF.js");if(t&&typeof e.openLesson=="function")try{await e.openLesson(s,t);return}catch{}await e.loadCurriculum()}function j(s,t){if(!Array.isArray(t)||t.length===0)return;let e=document.createElement("section");e.className="lr-review-summary",e.setAttribute("role","region"),e.setAttribute("aria-label","Kertaus t\xE4ss\xE4 sessiossa");let r=t.slice(0,3).map(n=>{let o=`${n.correct}/${n.total}`;return`
        <li class="lr-review-summary__row">
          <span class="lr-review-summary__headline">${l(n.headline||"")}</span>
          <span class="lr-review-summary__label">${l(n.label||n.topic_key||"")}</span>
          <span class="lr-review-summary__score" aria-label="${n.correct} oikein, ${n.total} yhteens\xE4">${l(o)}</span>
        </li>`}).join("");e.innerHTML=`
    <h3 class="lr-review-summary__title">Kertasit my\xF6s t\xE4t\xE4</h3>
    <ul class="lr-review-summary__list">${r}</ul>
  `,s.parentNode?.insertBefore(e,s.nextSibling)}function D(s,t){let e=document.getElementById("lr-meta"),r=document.getElementById("lr-tutor"),n=document.getElementById("lr-actions");e&&(e.innerHTML='<p class="lr-meta-prompt">Kirjaudu sis\xE4\xE4n tallentaaksesi suoritus.</p>'),r&&(r.innerHTML=""),n&&(n.innerHTML='<a class="btn btn-primary" href="/app.html#kirjaudu">Kirjaudu sis\xE4\xE4n</a>')}function R(s,t,e){let r=document.getElementById("lr-meta"),n=document.getElementById("lr-tutor"),o=document.getElementById("lr-actions");r&&(r.innerHTML=""),n&&(n.innerHTML=`<p class="lr-tutor-msg lr-tutor-msg--err">${l(e)}</p>`),o&&(o.innerHTML='<button type="button" class="btn btn-primary" id="lr-cta-back">Jatka oppimispolkua \u2192</button>',document.getElementById("lr-cta-back")?.addEventListener("click",()=>p()))}async function p(s=null,t=null){h();try{sessionStorage.removeItem("dashTutorMsg")}catch{}let e=await import("./app-curriculum-SQ4OPGMF.js");if(s&&Number.isInteger(t)){await e.loadCurriculum();return}await e.loadCurriculum()}export{G as showLessonResults};
//# sourceMappingURL=app-lessonResults-NFASBZJR.js.map
