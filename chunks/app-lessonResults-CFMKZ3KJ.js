import{a as L,b as k,c as I,d as g}from"./app-chunk-3IJFD23J.js";import{c as r}from"./app-chunk-2SASPNNN.js";import{a as b,c as T,e as v,j as h}from"./app-chunk-T52YLBP4.js";import{b as $}from"./app-chunk-PXMVMW5B.js";var w="screen-lesson-results",f="lesson-results-root";function E(e=null){let t=r.language==="de"||r.language==="fr"?r.language:"es",n=e?`#/oppimispolku/${t}/${encodeURIComponent(e)}`:"#/oppimispolku";if(location.hash===n){e?import("./app-courseDetail-5VLYUAO5.js").then(a=>a.loadCourseDetail?.(t,e)).catch(()=>{}):import("./app-oppimispolkuIndex-BPBVILBQ.js").then(a=>a.loadOppimispolkuIndex?.(t)).catch(()=>{});return}location.hash=n}function l(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function M(){let e=document.getElementById(w);return e||(e=document.createElement("div"),e.id=w,e.className="screen",document.querySelector(".app-main")?.appendChild(e)||document.body.appendChild(e)),document.getElementById(f)||(e.innerHTML=`<div id="${f}"></div>`),document.getElementById(f)}async function F(e){let t=M();$(w);let{kurssiKey:n,lessonIndex:a,lessonFocus:s,scoreCorrect:o,scoreTotal:i}=e,c=i>0?Math.round(o/i*100):0,y=c>=80?"good":c>=60?"warn":"low";if(I()){g(!1),t.innerHTML=H({scoreCorrect:o,scoreTotal:i,pct:c,lessonFocus:s}),document.getElementById("lr-deepen-back")?.addEventListener("click",()=>p());return}if(t.innerHTML=N({scoreCorrect:o,scoreTotal:i,pct:c,tone:y,lessonFocus:s}),!T()){x(t,e);return}let m=null;try{let u=await h(`${b}/api/curriculum/${encodeURIComponent(n)}/lesson/${a}/complete`,{method:"POST",headers:{"Content-Type":"application/json",...v()},body:JSON.stringify({scoreCorrect:o,scoreTotal:i,wrongAnswers:e.wrongAnswers||[],reviewItems:e.reviewItems||[],lessonType:e.lessonType})});if(!u.ok)throw new Error("Tallennus ep\xE4onnistui");m=await u.json()}catch(u){O(t,e,u.message||"Ei yhteytt\xE4, tulokset n\xE4ytet\xE4\xE4n, mutta tallennus ep\xE4onnistui.");return}A(t,e,m)}function H({scoreCorrect:e,scoreTotal:t,pct:n,lessonFocus:a}){return`
    <article class="lr-card lr-card--deepen" aria-live="polite">
      <header class="lr-head">
        <p class="lr-eyebrow">Syvennys suoritettu</p>
        <h1 class="lr-focus">${l(a||"")}</h1>
      </header>
      <section class="lr-score lr-score--good" aria-label="Syvennyksen tulos">
        <div class="lr-score-num"><span class="lr-score-correct">${e}</span><span class="lr-score-divider"> / </span><span class="lr-score-total">${t}</span></div>
        <div class="lr-score-label">syvennyksess\xE4 oikein${t>0?" \xB7 "+n+" %":""}</div>
      </section>
      <section class="lr-tutor">
        <p class="lr-tutor-msg">L-tavoite: 4 vaativampaa lis\xE4teht\xE4v\xE4\xE4 on tehty. Aihe on automatisoitumassa.</p>
      </section>
      <section class="lr-actions">
        <button type="button" class="btn btn-primary lr-cta-primary" id="lr-deepen-back">Jatka oppimispolkua \u2192</button>
      </section>
    </article>`}function N({scoreCorrect:e,scoreTotal:t,pct:n,tone:a,lessonFocus:s}){return`
    <article class="lr-card" aria-live="polite">
      <header class="lr-head">
        <p class="lr-eyebrow">Oppitunti suoritettu</p>
        <h1 class="lr-focus">${l(s||"")}</h1>
      </header>
      <section class="lr-score lr-score--${a}" aria-label="Tulos">
        <div class="lr-score-num"><span class="lr-score-correct">${e}</span><span class="lr-score-divider"> / </span><span class="lr-score-total">${t}</span></div>
        <div class="lr-score-label">oikein${t>0?" \xB7 "+n+" %":""}</div>
        <div class="lr-bar" role="progressbar"
             aria-label="Tuloksen edistyminen, ${n} % oikein"
             aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="100">
          <div class="lr-bar-fill" style="width:${n}%"></div>
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
    </article>`}function A(e,t,n){let a=document.getElementById("lr-meta"),s=document.getElementById("lr-tutor"),o=document.getElementById("lr-actions");if(!a||!s||!o)return;a.innerHTML=`<p class="lr-meta-prompt">${l(n.metacognitivePrompt||"")}</p>`,s.innerHTML=`<p class="lr-tutor-msg">${l(n.tutorMessage||"")}</p>`,R(s,n.reviewSummary);let c=L()?.targetGrade||"B",y=t.scoreTotal>0?t.scoreCorrect/t.scoreTotal:0,m=t.lessonType==="vocab"||t.lessonType==="grammar"||t.lessonType==="mixed",B=c==="L"&&y>=.85&&m&&!n.kurssiComplete?`<div class="lr-deepen" role="region" aria-label="L-tason syvent\xE4v\xE4t harjoitukset">
         <h3 class="lr-deepen__title">Syvenn\xE4 taitoasi</h3>
         <p class="lr-deepen__body">L-tavoitteena halutaan t\xE4ydellinen hallinta. 4 lis\xE4teht\xE4v\xE4\xE4 samasta aiheesta vaativammilla ehdoilla, tee ne nyt kun aihe on tuore.</p>
         <div class="lr-deepen__row">
           <button type="button" class="btn btn-primary" id="btn-deepen-yes">Tee 4 lis\xE4teht\xE4v\xE4\xE4 (~6 min)</button>
           <button type="button" class="btn btn-secondary" id="btn-deepen-skip">Ohita t\xE4ll\xE4 kertaa</button>
         </div>
       </div>`:"",_=n.fastTrack?`<div class="lr-fasttrack" role="alert" aria-label="Nopea eteneminen">
         <span class="lr-fasttrack-icon" aria-hidden="true">\u26A1</span>
         <p class="lr-fasttrack-text">T\xE4m\xE4 vaikuttaa tutulta, tehd\xE4\xE4nk\xF6 suoraan kertaustesti?</p>
         <div class="lr-fasttrack-row">
           <button type="button" class="btn btn-primary" id="lr-fasttrack-yes">Siirry kertaustestiin \u2192</button>
           <button type="button" class="btn btn-secondary" id="lr-fasttrack-no">Jatka j\xE4rjestyksess\xE4</button>
         </div>
       </div>`:"",S=n.kurssiComplete&&n.nextKurssiKey,C=`
    ${_}
    ${B}
    <button type="button" class="btn btn-primary lr-cta-primary" id="lr-cta-back">Jatka oppimispolkua \u2192</button>
    ${S?`<button type="button" class="btn btn-secondary lr-cta-secondary" id="lr-cta-next-kurssi">Aloita ${l(n.nextKurssiTitle||n.nextKurssiKey)} \u2192</button>`:""}
  `;o.innerHTML=C,document.getElementById("lr-cta-back")?.addEventListener("click",()=>p()),document.getElementById("lr-cta-next-kurssi")?.addEventListener("click",()=>p(n.nextKurssiKey)),document.getElementById("lr-fasttrack-yes")?.addEventListener("click",()=>D(t.kurssiKey)),document.getElementById("lr-fasttrack-no")?.addEventListener("click",()=>{let d=document.querySelector(".lr-fasttrack");d&&d.remove()}),document.getElementById("btn-deepen-yes")?.addEventListener("click",()=>j(t)),document.getElementById("btn-deepen-skip")?.addEventListener("click",()=>{let d=document.querySelector(".lr-deepen");d&&d.remove()})}async function j(e){if(g(!0),r.batchNumber=0,r.totalCorrect=0,r.totalAnswered=0,r.recentVocabHeadwords=[],r.sessionStartTime=Date.now(),e.lessonType==="vocab"){let n=await import("./app-vocab-43KIZGVM.js");r.mode="vocab",r.topic="general vocabulary",r.level="B",r.startLevel="B",r.peakLevel="B",history.replaceState(null,"","#/sanasto"),n.loadNextBatch();return}let t=await import("./app-grammar-IZVWAYJX.js");r.mode="grammar",r.grammarTopic="mixed",r.grammarLevel="C",history.replaceState(null,"","#/puheoppi"),t.loadGrammarDrill()}async function D(e){k();try{sessionStorage.removeItem("dashTutorMsg")}catch{}let t=null;try{let a=await h(`${b}/api/curriculum/${encodeURIComponent(e)}`,{headers:v()});if(a.ok){let{lessons:s}=await a.json();Array.isArray(s)&&s.length>0&&(t=s[s.length-1].sortOrder??s.length)}}catch{}let n=await import("./app-curriculum-RLQF7Q2Y.js");if(t&&typeof n.openLesson=="function")try{await n.openLesson(e,t);return}catch{}E(e)}function R(e,t){if(!Array.isArray(t)||t.length===0)return;let n=document.createElement("section");n.className="lr-review-summary",n.setAttribute("role","region"),n.setAttribute("aria-label","Kertaus t\xE4ss\xE4 sessiossa");let a=t.slice(0,3).map(s=>{let o=`${s.correct}/${s.total}`;return`
        <li class="lr-review-summary__row">
          <span class="lr-review-summary__headline">${l(s.headline||"")}</span>
          <span class="lr-review-summary__label">${l(s.label||s.topic_key||"")}</span>
          <span class="lr-review-summary__score" aria-label="${s.correct} oikein, ${s.total} yhteens\xE4">${l(o)}</span>
        </li>`}).join("");n.innerHTML=`
    <h3 class="lr-review-summary__title">Kertasit my\xF6s t\xE4t\xE4</h3>
    <ul class="lr-review-summary__list">${a}</ul>
  `,e.parentNode?.insertBefore(n,e.nextSibling)}function x(e,t){let n=document.getElementById("lr-meta"),a=document.getElementById("lr-tutor"),s=document.getElementById("lr-actions");n&&(n.innerHTML='<p class="lr-meta-prompt">Kirjaudu sis\xE4\xE4n tallentaaksesi suoritus.</p>'),a&&(a.innerHTML=""),s&&(s.innerHTML='<a class="btn btn-primary" href="/app.html#kirjaudu">Kirjaudu sis\xE4\xE4n</a>')}function O(e,t,n){let a=document.getElementById("lr-meta"),s=document.getElementById("lr-tutor"),o=document.getElementById("lr-actions");a&&(a.innerHTML=""),s&&(s.innerHTML=`<p class="lr-tutor-msg lr-tutor-msg--err">${l(n)}</p>`),o&&(o.innerHTML='<button type="button" class="btn btn-primary" id="lr-cta-back">Jatka oppimispolkua \u2192</button>',document.getElementById("lr-cta-back")?.addEventListener("click",()=>p()))}async function p(e=null,t=null){k();try{sessionStorage.removeItem("dashTutorMsg")}catch{}if(e&&Number.isInteger(t))try{let n=await import("./app-curriculum-RLQF7Q2Y.js");if(typeof n.openLesson=="function"){await n.openLesson(e,t);return}}catch{}E(e)}export{F as showLessonResults};
//# sourceMappingURL=app-lessonResults-CFMKZ3KJ.js.map
