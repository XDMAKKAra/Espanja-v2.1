import{a as C,c as T}from"./app-chunk-N47QBJIH.js";import"./app-chunk-BKOFN7BD.js";import{a as E,c as S,e as A,j as O}from"./app-chunk-NZWTLFMY.js";import{b as j}from"./app-chunk-3WC2U67L.js";function M(e,t){let n=e?.mastery_threshold;return n?typeof n[t]=="number"?n[t]:n.B??.7:.7}function B(e,t){let n=e?.skip_for_targets;return Array.isArray(n)&&n.includes(t)}function q(e,t,{minChars:n=0,maxChars:a=0}={}){if(!e||!t)return{stop(){}};let s=n||a?`${n}\u2013${a}`:"";function i(){let r=(e.value||"").length;t.textContent=s?`${r} / ${s} merkki\xE4`:`${r} merkki\xE4`,t.classList.toggle("is-met",n>0&&r>=n),t.classList.toggle("is-too-long",a>0&&r>a)}return e.addEventListener("input",i),i(),{stop(){e.removeEventListener("input",i)}}}function I(e){return Math.round((e||0)*6)}var b="lesson-runner-root",K="puheo:lessonProgress:",g=new Map;async function J(e){if(!e)return[];if(g.has(e))return g.get(e);try{let{API:t,isLoggedIn:n,authHeader:a,apiFetch:s}=await import("./app-api-54FCZYC2.js"),i=await s(`${t}/api/curriculum/${encodeURIComponent(e)}`,{headers:{...n()?a():{}}});if(!i.ok)return g.set(e,[]),[];let r=await i.json(),l=Array.isArray(r.lessons)?r.lessons.slice().sort((o,c)=>(o.sortOrder||0)-(c.sortOrder||0)):[];return g.set(e,l),l}catch{return[]}}function w(e){let t=e._courseLessons||[];if(t.length===0)return`<aside class="lr-toc" aria-label="Kurssin oppitunnit">
      <p class="lr-toc__head">Oppitunnit</p>
      <p class="lr-toc__loading">Ladataan&hellip;</p>
    </aside>`;let n=e.lessonIndex;return`<aside class="lr-toc" aria-label="Kurssin oppitunnit">
    <p class="lr-toc__head">Oppitunnit</p>
    <ol class="lr-toc__list">${t.map(s=>{let i=s.sortOrder||0,r=i===n,l=!!s.completed&&!r,o=["lr-toc__item",r?"is-current":"",l?"is-done":""].filter(Boolean).join(" "),c=r?"\u2192":l?"\u2713":"";return`<li class="${o}" data-lesson="${d(String(i))}" ${r?"":'tabindex="0"'}>
      <span class="lr-toc__num">${d(String(i))}</span>
      <span class="lr-toc__title">${d(s.title||`Oppitunti ${i}`)}</span>
      <span class="lr-toc__mark" aria-hidden="true">${c}</span>
    </li>`}).join("")}</ol>
  </aside>`}function x(e,t){e.querySelectorAll(".lr-toc__item:not(.is-current)").forEach(n=>{let a=async()=>{let s=Number(n.dataset.lesson);if(!Number.isFinite(s)||s===t.lessonIndex)return;$(t),(await import("./app-curriculum-DNRZ2L6Y.js")).openLesson(t.kurssiKey,s)};n.addEventListener("click",a),n.addEventListener("keydown",s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),a())})})}function N(e){let t=e.lesson.meta||{},n=t.kurssi_title||t.course_title||t.course_key||"Kurssi",a=t.lesson_index||e.lessonIndex,s=t.title||"Oppitunti";return`<nav class="lr-breadcrumb" aria-label="Sijainti">
    <a class="lr-breadcrumb__link" href="#/oppimispolku" id="lr-breadcrumb-path">Oppimispolku</a>
    <span class="lr-breadcrumb__sep" aria-hidden="true">/</span>
    <span class="lr-breadcrumb__crumb">${d(n)}</span>
    <span class="lr-breadcrumb__sep" aria-hidden="true">/</span>
    <span class="lr-breadcrumb__crumb is-current" aria-current="page">${d(`${a}. ${s}`)}</span>
  </nav>`}function L(e,t){return`${K}${e}:${t}`}function $(e){if(!(!e||!e.kurssiKey||e.finished)&&!(e.currentPhaseIdx===0&&e.currentItemIdx===0&&e.answeredInPhase===0))try{sessionStorage.setItem(L(e.kurssiKey,e.lessonIndex),JSON.stringify({currentPhaseIdx:e.currentPhaseIdx,currentItemIdx:e.currentItemIdx,correctInPhase:e.correctInPhase,answeredInPhase:e.answeredInPhase,phaseResults:e.phaseResults,targetGrade:e.targetGrade,phaseSignature:e.phases.map(t=>`${t.phase_id}:${t.items.length}`).join("|"),savedAt:Date.now()}))}catch{}}function z(e,t,n){try{let a=sessionStorage.getItem(L(e,t));if(!a)return null;let s=JSON.parse(a);if(!s||typeof s!="object")return null;let i=n.phases.map(r=>`${r.phase_id}:${r.items.length}`).join("|");return s.phaseSignature!==i||s.savedAt&&Date.now()-s.savedAt>1440*60*1e3?null:s}catch{return null}}function V(e,t){try{sessionStorage.removeItem(L(e,t))}catch{}}function d(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function v(e){return String(e||"").toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ")}function H(e,t,n="es"){let a=t||[],s=v(e);if(s&&a.some(i=>v(i)===s))return{ok:!0,hint:null};for(let i of a){let r=C(e,i,n);if(r.ok)return r}return{ok:!1,hint:null}}function Y(e,t,n,a){let s=(e.phases||[]).filter(i=>!B(i,t));return{lesson:e,kurssiKey:n,lessonIndex:a,targetGrade:t,phases:s,currentPhaseIdx:0,currentItemIdx:0,correctInPhase:0,answeredInPhase:0,phaseResults:[],sidePanelOpen:!1,sidePanelOpenMs:0,sidePanelOpenedAt:0,startedAt:Date.now(),finished:!1}}function _e(e,t,n,a){let s=e.pregenerated||e;W(),j("screen-lesson");let i=document.getElementById(b);if(!i)return;let r=Y(s,a||"B",t,n);try{sessionStorage.setItem("currentLesson",JSON.stringify({kurssiKey:t,lessonIndex:n,lessonFocus:s.meta?.title||"",lessonType:s.meta?.lesson_type||"",targetGrade:r.targetGrade,isPregenerated:!0}));let o=s.teaching||{},c=String(o.intro_md||"").trim(),u=Array.isArray(o.key_points)?o.key_points:[],p=[c,u.length?`## Avainkohdat
`+u.map(h=>`- ${h}`).join(`
`):""].filter(Boolean).join(`

`);p?sessionStorage.setItem("currentLessonTeachingMd",p):sessionStorage.removeItem("currentLessonTeachingMd")}catch{}r._courseLessons=[],J(t).then(o=>{r._courseLessons=o;let c=document.querySelector(".lr-shell .lr-toc");if(c&&c.parentElement){let u=document.createElement("div");u.innerHTML=w(r),c.parentElement.replaceChild(u.firstElementChild,c),x(document.getElementById(b),r)}});let l=z(t,n,r);if(l){r.currentPhaseIdx=l.currentPhaseIdx,r.currentItemIdx=l.currentItemIdx,r.correctInPhase=l.correctInPhase||0,r.answeredInPhase=l.answeredInPhase||0,r.phaseResults=Array.isArray(l.phaseResults)?l.phaseResults:[],r.startedAt=Date.now(),_(i,r);return}G(i,r)}function W(){let e=document.getElementById("screen-lesson");e||(e=document.createElement("div"),e.id="screen-lesson",e.className="screen",document.querySelector(".app-main")?.appendChild(e)||document.body.appendChild(e)),document.getElementById(b)||(e.innerHTML=`<div id="${b}"></div>`)}function G(e,t){let n=t.lesson.meta||{},a=t.lesson.teaching||{},s=D(a.intro_md||""),i=Array.isArray(a.key_points)?a.key_points:[],r=i.length?`<ul class="lr-keypoints">${i.map(l=>`<li>${d(l)}</li>`).join("")}</ul>`:"";e.innerHTML=`
    <div class="lr-shell lr-shell--teaching lr-shell--three">
      ${N(t)}
      <button type="button" class="lr-back" id="lr-back">\u2190 Oppimispolku</button>
      ${w(t)}
      <header class="lr-hero">
        <p class="lr-eyebrow">${d(n.course_key||"")} \xB7 Oppitunti ${d(String(n.lesson_index||""))}</p>
        <h1 class="display display--serif">${d(n.title||"Oppitunti")}</h1>
        ${n.description?`<p class="lr-desc">${d(n.description)}</p>`:""}
      </header>
      <article class="lr-teaching">${s}${r}</article>
      <div class="lr-actions">
        <button type="button" class="btn btn-primary" id="lr-start">Aloita harjoittelu \u2192</button>
        <p class="lr-hint">Voit avata Apua-paneelin milloin tahansa harjoituksen aikana.</p>
      </div>
    </div>`,x(e,t),document.getElementById("lr-back")?.addEventListener("click",()=>{import("./app-curriculum-DNRZ2L6Y.js").then(l=>l.loadCurriculum())}),document.getElementById("lr-start")?.addEventListener("click",()=>{t.startedAt=Date.now(),_(e,t)})}function _(e,t){let n=t.phases[t.currentPhaseIdx];if(!n)return R(e,t);let a=t.phases.length,s=U(t),i=n.items[t.currentItemIdx];if(!i)return P(e,t,n,"completed");e.innerHTML=`
    <div class="lr-shell lr-shell--exercise lr-shell--three">
      ${N(t)}
      <div class="lr-topbar">
        <button type="button" class="lr-exit-btn" id="lr-exit-lesson" aria-label="Takaisin oppimispolulle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          <span>Oppimispolku</span>
        </button>
        <div class="lr-topbar-progress">
          <span class="lr-step-label">Vaihe ${t.currentPhaseIdx+1} / ${a}</span>
          ${s}
        </div>
        <div class="lr-topbar-actions">
          <button type="button" class="lr-help-btn" id="lr-help-toggle" aria-expanded="${t.sidePanelOpen?"true":"false"}" aria-controls="lr-side-panel">\u{1F4D6} Apua</button>
          <button type="button" class="lr-skip-btn" id="lr-skip">Olen valmis t\xE4st\xE4</button>
        </div>
      </div>
      ${w(t)}
      <header class="lr-phase-head">
        <h2 class="lr-phase-title">${d(n.title||"Vaihe")}</h2>
        ${n.instruction?`<p class="lr-phase-instr">${d(n.instruction)}</p>`:""}
        <p class="lr-item-counter">Kysymys ${t.currentItemIdx+1} / ${n.items.length}</p>
      </header>
      <div class="lr-item" id="lr-item">${X(i,t)}</div>
      ${ue(t)}
    </div>`,re(e,t,i),x(e,t)}function U(e){return`<span class="lr-stepper" aria-hidden="true">${e.phases.map((n,a)=>a<e.currentPhaseIdx?'<span class="lr-step lr-step--done" aria-hidden="true">\u25CF</span>':a===e.currentPhaseIdx?'<span class="lr-step lr-step--current" aria-hidden="true">\u25CF</span>':'<span class="lr-step" aria-hidden="true">\u25CB</span>').join("")}</span>`}function X(e,t){switch(e.item_type){case"mc":return Q(e);case"typed":return F(e);case"translate":return Z(e);case"match":return ee(e);case"gap_fill":return te(e);case"writing":return se(e);case"reading_mc":return ne(e);default:return`<p class="lr-unsupported">Teht\xE4v\xE4tyyppi\xE4 "${d(e.item_type||"?")}" ei tueta, ohitetaan.</p>
        <button type="button" class="btn btn-primary" data-lr-skip-item>Jatka</button>`}}function Q(e){return`
    <div class="lr-mc">
      ${e.context?`<p class="lr-mc-context">${d(e.context)}</p>`:""}
      <p class="lr-mc-stem">${d(e.stem||"")}</p>
      <div class="lr-mc-choices" role="radiogroup">
        ${(e.choices||[]).map((n,a)=>`
          <button type="button" class="lr-mc-choice" data-mc-idx="${a}" role="radio" aria-checked="false">${d(n)}</button>
        `).join("")}
      </div>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function F(e){return`
    <div class="lr-typed">
      <p class="lr-typed-dir">${e.direction==="es_to_fi"?"K\xE4\xE4nn\xE4 suomeksi":"K\xE4\xE4nn\xE4 espanjaksi"}</p>
      <p class="lr-typed-prompt">${d(e.prompt||"")}</p>
      ${e.hint?`<p class="lr-typed-hint">Vihje: ${d(e.hint)}</p>`:""}
      <input type="text" class="lr-typed-input" id="lr-typed-input" autocomplete="off" autocapitalize="off" spellcheck="false" />
      <button type="button" class="btn btn-primary" id="lr-typed-submit">Tarkista</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function Z(e){return F({...e,prompt:e.source})}function ee(e){let t=(e.pairs||[]).map(a=>a.left),n=he((e.pairs||[]).map(a=>a.right));return`
    <div class="lr-match" data-match>
      <p class="lr-match-instr">Yhdist\xE4 parit klikkaamalla.</p>
      <div class="lr-match-cols">
        <div class="lr-match-col">
          ${t.map((a,s)=>`<button type="button" class="lr-match-cell" data-side="left" data-idx="${s}">${d(a)}</button>`).join("")}
        </div>
        <div class="lr-match-col">
          ${n.map(a=>`<button type="button" class="lr-match-cell" data-side="right" data-val="${d(a)}">${d(a)}</button>`).join("")}
        </div>
      </div>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function te(e){let t=e.sentence_template||"",n=(e.answers||e.accepts||[]).reduce((r,l)=>Math.max(r,String(l||"").length),8),a=Math.min(Math.max(n,6),18),s=d(t).replace(/\{(\d+)\}/g,(r,l)=>`<input type="text" class="lr-gap-input" data-gap="${l}" size="${a}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="T\xE4yt\xE4 kohta ${l}" />`),i=Array.isArray(e.word_bank)&&e.word_bank.length?`<div class="lr-gap-bank" role="group" aria-label="Sanapankki">
        ${e.word_bank.map(r=>`<button type="button" class="lr-gap-chip" data-word="${d(r)}">${d(r)}</button>`).join("")}
       </div>`:"";return`
    <div class="lr-gap">
      <p class="lr-gap-sentence">${s}</p>
      ${i}
      <button type="button" class="btn btn-primary" id="lr-gap-submit">Tarkista</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function se(e){let t=Number(e.min_chars)||I(e.min_words),n=Number(e.max_chars)||I(e.max_words);return`
    <div class="lr-writing">
      <p class="lr-writing-prompt">${d(e.prompt||"")}</p>
      <textarea class="lr-writing-input" id="lr-writing-input"
                data-min-chars="${t}" data-max-chars="${n}"
                rows="8"></textarea>
      <p class="lr-writing-char-counter" id="lr-writing-char-counter">0 / ${t}\u2013${n} merkki\xE4</p>
      <button type="button" class="btn btn-primary" id="lr-writing-submit">L\xE4het\xE4</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function ne(e){let t=d(e.passage||"").replace(/\n/g,"<br>"),n=(e.questions||[]).map((a,s)=>`
    <fieldset class="lr-reading-q" data-q="${s}">
      <legend>${d(a.question_fi||"")}</legend>
      ${(a.choices||[]).map((i,r)=>`
        <label class="lr-reading-choice"><input type="radio" name="lr-q-${s}" value="${r}"> ${d(i)}</label>
      `).join("")}
    </fieldset>
  `).join("");return`
    <div class="lr-reading">
      <article class="lr-reading-passage">${t}</article>
      <div class="lr-reading-qs">${n}</div>
      <button type="button" class="btn btn-primary" id="lr-reading-submit">Tarkista vastaukset</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function re(e,t,n){e.__lrState=t,T(e,t.language),document.getElementById("lr-help-toggle")?.addEventListener("click",()=>pe(e,t)),document.getElementById("lr-skip")?.addEventListener("click",()=>oe(e,t)),document.getElementById("lr-exit-lesson")?.addEventListener("click",async()=>{let{confirmDialog:s}=await import("./app-confirmDialog-46K22AFY.js");$(t),await s({title:"Lopetetaanko oppitunti?",body:"Tallennamme kohdan johon p\xE4\xE4sit, voit jatkaa t\xE4\xE4lt\xE4 my\xF6hemmin.",confirmLabel:"L\xE4hde takaisin",cancelLabel:"Jatka oppituntia"})&&(await import("./app-curriculum-DNRZ2L6Y.js")).loadCurriculum()}),e.querySelector("[data-lr-skip-item]")?.addEventListener("click",()=>y(e,t,!0));let a=typeof t.language=="string"&&t.language||"es";if(n.item_type==="mc")e.querySelectorAll(".lr-mc-choice").forEach(s=>{s.addEventListener("click",()=>{let i=Number(s.dataset.mcIdx),r=i===Number(n.correct_index);m(e,r,n.explanation||"",{hint:null,waitForClick:!r}),ce(e,n.correct_index,i),k(t,r),r&&f(e,t)})});else if(n.item_type==="typed"||n.item_type==="translate"){let s=document.getElementById("lr-typed-input"),i=document.getElementById("lr-typed-submit"),r=()=>{let l=n.accept||[],{ok:o,hint:c}=H(s.value,l,a),u=l[0]||"";m(e,o,o?"":`Oikea vastaus: ${u}`,{hint:c,waitForClick:!o}),k(t,o),o&&f(e,t)};i?.addEventListener("click",r),s?.addEventListener("keydown",l=>{l.key==="Enter"&&r()}),s?.focus()}else if(n.item_type==="match")ae(e,t,n);else if(n.item_type==="gap_fill"){let s=null,i=e.querySelectorAll(".lr-gap-input");i.forEach(r=>{r.addEventListener("focus",()=>{s=r})}),i[0]?.focus(),e.querySelectorAll(".lr-gap-chip").forEach(r=>{r.addEventListener("click",()=>{let l=r.dataset.word||r.textContent||"",o=s&&s.value===""?s:Array.from(i).find(c=>!c.value)||s||i[0];o&&(o.value=l,o.classList.add("is-filled"),r.classList.add("is-used"),(Array.from(i).find(u=>!u.value)||o).focus())})}),i.forEach(r=>{r.addEventListener("input",()=>{r.classList.toggle("is-filled",!!r.value),e.querySelectorAll(".lr-gap-chip.is-used").forEach(l=>{let o=l.dataset.word||l.textContent||"",c=Array.from(i).some(u=>u.value===o);l.classList.toggle("is-used",c)})})}),document.getElementById("lr-gap-submit")?.addEventListener("click",()=>{let r=!0,l=[],o=null;i.forEach((c,u)=>{let p=n.answers&&n.answers[u]||[],h=H(c.value,p,a);h.ok||(r=!1),h.hint&&!o&&(o=h.hint),l.push(p[0]||"?"),c.classList.toggle("is-wrong",!h.ok),c.classList.toggle("is-correct",h.ok)}),m(e,r,r?"":`Oikeat vastaukset: ${l.join(", ")}`,{hint:o,waitForClick:!r}),k(t,r),r&&f(e,t)})}else if(n.item_type==="writing"){let s=document.getElementById("lr-writing-input"),i=document.getElementById("lr-writing-char-counter"),r=Number(s?.dataset.minChars)||0,l=Number(s?.dataset.maxChars)||0;s&&i&&q(s,i,{minChars:r,maxChars:l}),document.getElementById("lr-writing-submit")?.addEventListener("click",()=>{let c=(s?.value||"").length,u=c>=r,p=u?"Kirjoituksesi on tallennettu.":`Merkkim\xE4\xE4r\xE4 on ${c}, tavoite v\xE4hint\xE4\xE4n ${r} merkki\xE4. Jatka kirjoitusta.`;m(e,u,p,{hint:null,waitForClick:!u}),k(t,u),u&&f(e,t)})}else n.item_type==="reading_mc"&&document.getElementById("lr-reading-submit")?.addEventListener("click",()=>{let s=0,i=(n.questions||[]).length;(n.questions||[]).forEach((l,o)=>{let c=e.querySelector(`input[name="lr-q-${o}"]:checked`);c&&Number(c.value)===Number(l.correct_index)&&s++});let r=s===i;m(e,r,r?"Kaikki oikein.":`${s}/${i} oikein.`),t.correctInPhase+=s/i,t.answeredInPhase+=1,f(e,t,!1)})}function ae(e,t,n){let a=null,s=new Set,i=(n.pairs||[]).length,r=0;e.querySelectorAll(".lr-match-cell").forEach(l=>{l.addEventListener("click",()=>{if(s.has(l))return;if(l.dataset.side==="left")e.querySelectorAll('.lr-match-cell[data-side="left"]').forEach(c=>c.classList.remove("is-active")),l.classList.add("is-active"),a=l;else if(a){let c=Number(a.dataset.idx),u=n.pairs[c]?.right,p=l.dataset.val;u&&p&&v(u)===v(p)?(a.classList.add("is-matched"),l.classList.add("is-matched"),s.add(a),s.add(l),a=null,r++,r===i&&(m(e,!0,"Kaikki parit oikein."),k(t,!0),f(e,t))):(l.classList.add("is-wrong"),setTimeout(()=>l.classList.remove("is-wrong"),600))}})})}var ie='<svg class="lr-feedback__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',le='<svg class="lr-feedback__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';function m(e,t,n,a={}){let s=e.querySelector("#lr-feedback");if(!s)return;let{hint:i=null,waitForClick:r=!1}=a;s.hidden=!1,s.className=`lr-feedback ${t?"is-correct lr-feedback--correct":"is-wrong lr-feedback--wrong"}`,s.setAttribute("role","status"),s.setAttribute("aria-live",t?"polite":"assertive");let l=t?n||"Hyvin meni!":n||"Melkein, yrit\xE4 uudelleen.",o=i?`<p class="lr-feedback__accent-hint">${d(i)}</p>`:"",c=r?'<button type="button" class="lr-feedback__next" id="lr-feedback-next">Seuraava \u2192</button>':"";s.innerHTML=`${t?ie:le}<div class="lr-feedback__body-wrap"><p class="lr-feedback__title ${t?"is-correct":"is-wrong"}">${t?"Oikein":"V\xE4\xE4rin"}</p><p class="lr-feedback__body">${d(l)}</p>${o}${c}</div>`,s.classList.remove("lr-feedback--animate"),s.offsetWidth,s.classList.add("lr-feedback--animate"),r&&s.querySelector("#lr-feedback-next")?.addEventListener("click",()=>{let p=e.__lrState;p&&y(e,p,!1)},{once:!0})}function ce(e,t,n){e.querySelectorAll(".lr-mc-choice").forEach(a=>{let s=Number(a.dataset.mcIdx);a.disabled=!0,s===t&&a.classList.add("is-correct"),s===n&&n!==t&&a.classList.add("is-wrong")})}function k(e,t){e.answeredInPhase+=1,t&&(e.correctInPhase+=1)}function f(e,t,n=!0){setTimeout(()=>y(e,t,!1),1100)}function y(e,t,n){let a=t.phases[t.currentPhaseIdx];if(t.currentItemIdx+=1,$(t),t.currentItemIdx>=a.items.length)return P(e,t,a,"completed");_(e,t)}function P(e,t,n,a){let s=t.answeredInPhase||n.items.length,i=Math.round(t.correctInPhase),r=s>0?t.correctInPhase/s:0,l=M(n,t.targetGrade),o=a==="skipped",c=!o&&r>=l;t.phaseResults.push({phaseId:n.phase_id,title:n.title,correct:i,total:s,pct:r,threshold:l,mastered:c,skipped:o});let u,p;o?(u="Vaihe ohitettu",p="Sanat palaavat kertaussessioon my\xF6hemmin, niit\xE4 ei j\xE4tet\xE4 unohduksiin."):c?(u="Hallitset t\xE4m\xE4n",p=`Sait ${i} / ${s} oikein, jatketaan seuraavaan vaiheeseen.`):r>=.5?(u="L\xE4hell\xE4, viel\xE4 yksi pyyhk\xE4isy",p=`${i} / ${s} oikein. Sanat joissa horjuit palaavat seuraavissa vaiheissa.`):(u="T\xE4m\xE4 kaipaa toistoa",p=`${i} / ${s} oikein. Et ole yksin, t\xE4m\xE4 rakenne vaatii toistoa, ei eri s\xE4\xE4nt\xF6\xE4.`);let h=t.currentPhaseIdx+1>=t.phases.length;e.innerHTML=`
    <div class="lr-shell lr-shell--banner">
      <div class="lr-banner ${c?"is-mastered":o?"is-skipped":"is-almost"}">
        <p class="lr-banner-eyebrow">${d(n.title||"Vaihe")}</p>
        <h2>${d(u)}</h2>
        <p>${d(p)}</p>
        <button type="button" class="btn btn-primary" id="lr-next">${h?"N\xE4yt\xE4 yhteenveto":"Seuraava vaihe \u2192"}</button>
      </div>
    </div>`,document.getElementById("lr-next")?.addEventListener("click",()=>{t.currentPhaseIdx+=1,t.currentItemIdx=0,t.correctInPhase=0,t.answeredInPhase=0,t.currentPhaseIdx>=t.phases.length?R(e,t):($(t),_(e,t))})}function oe(e,t){if(!window.confirm("Ohita t\xE4m\xE4 vaihe? Sanat palaavat kertaussessioon my\xF6hemmin."))return;let a=t.phases[t.currentPhaseIdx];P(e,t,a,"skipped")}function R(e,t){if(t.finished)return;t.finished=!0,V(t.kurssiKey,t.lessonIndex);let n=t.phaseResults.reduce((c,u)=>c+(u.skipped?0:u.correct),0),a=t.phaseResults.reduce((c,u)=>c+(u.skipped?0:u.total),0),s=Math.max(1,Math.round((Date.now()-t.startedAt)/6e4)),i=t.targetGrade,r=de(i,t.phaseResults),l=t.lesson.meta?.yo_relevance||"",o=t.phaseResults.map(c=>{let u=c.skipped?"lr-result-skipped":c.mastered?"lr-result-mastered":"lr-result-almost",p=c.skipped?"Ohitettu":c.mastered?"Hallitset":"L\xE4hell\xE4";return`<li class="lr-result-row ${u}">
      <span class="lr-result-title">${d(c.title||"")}</span>
      <span class="lr-result-status">${p}${c.skipped?"":` \xB7 ${c.correct}/${c.total}`}</span>
    </li>`}).join("");e.innerHTML=`
    <div class="lr-shell lr-shell--results">
      <header class="lr-hero">
        <p class="lr-eyebrow">Yhteenveto</p>
        <h1>${d(t.lesson.meta?.title||"Oppitunti")}</h1>
      </header>
      <div class="lr-result-summary">
        <div class="lr-result-stat"><span class="lr-result-num">${n}/${a||0}</span><span class="lr-result-lbl">oikein</span></div>
        <div class="lr-result-stat"><span class="lr-result-num">${s}</span><span class="lr-result-lbl">min</span></div>
      </div>
      <div class="lr-tutor">${d(r)}</div>
      ${l?`<aside class="lr-yo">
        <p class="lr-yo-eyebrow">T\xE4m\xE4 YO-kokeessa</p>
        <p>${d(l)}</p>
      </aside>`:""}
      <ol class="lr-results-list">${o}</ol>
      <div class="lr-actions">
        <button type="button" class="btn btn-primary" id="lr-done">Takaisin oppimispolulle \u2192</button>
      </div>
    </div>`,document.getElementById("lr-done")?.addEventListener("click",()=>{import("./app-curriculum-DNRZ2L6Y.js").then(c=>c.loadCurriculum())}),S()&&a>0&&O(`${E}/api/curriculum/${encodeURIComponent(t.kurssiKey)}/lesson/${t.lessonIndex}/complete`,{method:"POST",headers:{"Content-Type":"application/json",...A()},body:JSON.stringify({scoreCorrect:n,scoreTotal:a,wrongAnswers:[],reviewItems:[]})}).catch(()=>{})}function de(e,t){let n=t.filter(i=>i.skipped).length,a=t.filter(i=>!i.skipped&&i.mastered).length,s=t.filter(i=>!i.skipped&&!i.mastered).length;return e==="L"||e==="E"?s===0&&n===0?"L/E-tavoite vaatii ~85\u201395 % YO-kokeessa, t\xE4m\xE4n tunnin sanat ovat sinulla automaattisia. Eteenp\xE4in.":`${s} vaihe${s===1?"":"tta"} j\xE4i alle hallintarajan. L/E-tavoite ei salli horjuvia perusrakenteita, palaa n\xE4ihin huomenna kertauksessa.`:e==="I"||e==="A"?s===0&&n===0?"Hyv\xE4 alku. I/A-tavoite tarvitsee perussanaston tunnistustasolla, olet nyt siell\xE4.":"Et ole yksin. I/A-tavoitteelle riitt\xE4\xE4 tunnistus, ei kaikki sanat tarvitse olla automaattisia heti. Sanat palaavat kertauksessa.":a===t.length?"Tunti meni kuten pitikin. Jatketaan seuraavaan oppituntiin samalla rytmill\xE4.":s>0?`${s} vaihetta j\xE4i alle hallintarajan. Sanat palaavat seuraavassa kertaussessiossa, t\xE4m\xE4 on osa rytmi\xE4, ei takaisku.`:"Tunti suoritettu."}function ue(e){let t=e.lesson.side_panel?.tabs||[];if(!t.length)return"";let n=t.map((s,i)=>`
    <button type="button" class="lr-tab ${i===0?"is-active":""}" data-tab="${d(s.id)}">${d(s.title||s.id)}</button>
  `).join(""),a=t.map((s,i)=>`
    <div class="lr-tab-pane ${i===0?"is-active":""}" data-pane="${d(s.id)}">
      ${D(s.content_md||"")}
    </div>
  `).join("");return`
    <aside id="lr-side-panel" class="lr-side-panel ${e.sidePanelOpen?"is-open":""}" aria-hidden="${e.sidePanelOpen?"false":"true"}">
      <div class="lr-side-tabs" role="tablist">${n}</div>
      <div class="lr-side-panes">${a}</div>
    </aside>`}function pe(e,t){t.sidePanelOpen=!t.sidePanelOpen,t.sidePanelOpen?t.sidePanelOpenedAt=Date.now():t.sidePanelOpenedAt&&(t.sidePanelOpenMs+=Date.now()-t.sidePanelOpenedAt,t.sidePanelOpenedAt=0);let n=e.querySelector("#lr-side-panel"),a=e.querySelector("#lr-help-toggle"),s=e.querySelector(".lr-shell--exercise");s&&s.classList.toggle("has-panel-open",t.sidePanelOpen),n&&(n.classList.toggle("is-open",t.sidePanelOpen),n.setAttribute("aria-hidden",t.sidePanelOpen?"false":"true")),a&&(a.setAttribute("aria-expanded",t.sidePanelOpen?"true":"false"),a.textContent=t.sidePanelOpen?"\u2715 Sulje":"\u{1F4D6} Apua"),e.querySelectorAll(".lr-tab").forEach(i=>{i.onclick=()=>{e.querySelectorAll(".lr-tab").forEach(l=>l.classList.toggle("is-active",l===i));let r=i.dataset.tab;e.querySelectorAll(".lr-tab-pane").forEach(l=>l.classList.toggle("is-active",l.dataset.pane===r))}})}function he(e){let t=e.slice();for(let n=t.length-1;n>0;n--){let a=Math.floor(Math.random()*(n+1));[t[n],t[a]]=[t[a],t[n]]}return t}function D(e){if(!e)return"";let t=String(e).split(/\r?\n/),n=[],a=[],s=!1,i=()=>{a.length&&(n.push(`<p>${l(a.join(" "))}</p>`),a=[])},r=()=>{s&&(n.push("</ul>"),s=!1)};function l(o){let c=d(o);return c=c.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),c=c.replace(/\*([^*]+)\*/g,"<em>$1</em>"),c=c.replace(/`([^`]+)`/g,"<code>$1</code>"),c}for(let o of t){let c=o.replace(/\s+$/,"");if(/^#{1,3}\s/.test(c)){i(),r();let u=c.startsWith("### ")?3:c.startsWith("## ")?2:1;n.push(`<h${u}>${l(c.replace(/^#{1,3}\s+/,""))}</h${u}>`)}else/^\s*[-*]\s+/.test(c)?(i(),s||(n.push("<ul>"),s=!0),n.push(`<li>${l(c.replace(/^\s*[-*]\s+/,""))}</li>`)):/^\s*$/.test(c)?(i(),r()):(r(),a.push(c))}return i(),r(),n.join(`
`)}export{V as clearLessonProgress,_e as runPregeneratedLesson,$ as saveLessonProgress};
//# sourceMappingURL=app-lessonRunner-FSA3NJQG.js.map
