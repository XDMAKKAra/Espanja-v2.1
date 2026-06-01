import{b as T}from"./app-chunk-BSBZXMKL.js";import{b as C}from"./app-chunk-AE7C6F2Z.js";import"./app-chunk-2SASPNNN.js";import{a as E,c as S,e as A,j as O}from"./app-chunk-M4LELO7W.js";import{b as j}from"./app-chunk-PXMVMW5B.js";function M(e,t){let s=e?.mastery_threshold;return s?typeof s[t]=="number"?s[t]:s.B??.7:.7}function B(e,t){let s=e?.skip_for_targets;return Array.isArray(s)&&s.includes(t)}function q(e,t,{minChars:s=0,maxChars:a=0}={}){if(!e||!t)return{stop(){}};let n=s||a?`${s}\u2013${a}`:"";function i(){let r=(e.value||"").length;t.textContent=n?`${r} / ${n} merkki\xE4`:`${r} merkki\xE4`,t.classList.toggle("is-met",s>0&&r>=s),t.classList.toggle("is-too-long",a>0&&r>a)}return e.addEventListener("input",i),i(),{stop(){e.removeEventListener("input",i)}}}function _(e){return Math.round((e||0)*6)}var y="lesson-runner-root",V="puheo:lessonProgress:";function N(e){let t=e&&typeof e.language=="string"&&e.language||"es",s=e&&e.kurssiKey?encodeURIComponent(e.kurssiKey):"",a=s?`#/oppimispolku/${t}/${s}`:`#/oppimispolku?lang=${t}`;location.hash!==a&&(location.hash=a)}var v=new Map;async function z(e){if(!e)return[];if(v.has(e))return v.get(e);try{let{API:t,isLoggedIn:s,authHeader:a,apiFetch:n}=await import("./app-api-FMQT44G4.js"),i=await n(`${t}/api/curriculum/${encodeURIComponent(e)}`,{headers:{...s()?a():{}}});if(!i.ok)return v.set(e,[]),[];let r=await i.json(),l=Array.isArray(r.lessons)?r.lessons.slice().sort((o,c)=>(o.sortOrder||0)-(c.sortOrder||0)):[];return v.set(e,l),l}catch{return[]}}function w(e){let t=Array.isArray(e.phases)?e.phases:[];if(t.length===0)return`<aside class="lr-toc" aria-label="Teht\xE4v\xE4t">
      <p class="lr-toc__head">Teht\xE4v\xE4t</p>
      <p class="lr-toc__loading">Ei vaiheita.</p>
    </aside>`;let s=e.currentPhaseIdx,a=new Set((e.phaseResults||[]).filter(i=>!i.skipped&&i.mastered).map(i=>i.phaseId));return`<aside class="lr-toc" aria-label="Teht\xE4v\xE4t">
    <p class="lr-toc__head">Teht\xE4v\xE4t</p>
    <ol class="lr-toc__list">${t.map((i,r)=>{let l=r===s,o=a.has(i.phase_id)&&!l,c=["lr-toc__item",l?"is-current":"",o?"is-done":""].filter(Boolean).join(" "),d=l?"\u2192":o?"\u2713":"",p=i.title||`Vaihe ${r+1}`;return`<li class="${c}" data-phase="${r}" ${l?"":'tabindex="0"'}>
      <span class="lr-toc__num">${r+1}</span>
      <span class="lr-toc__title">${u(p)}</span>
      <span class="lr-toc__mark" aria-hidden="true">${d}</span>
    </li>`}).join("")}</ol>
  </aside>`}function x(e,t){e.querySelectorAll(".lr-toc__item:not(.is-current)").forEach(s=>{let a=()=>{let n=Number(s.dataset.phase);!Number.isFinite(n)||n===t.currentPhaseIdx||(k(t),t.currentPhaseIdx=n,t.currentItemIdx=0,t.correctInPhase=0,t.answeredInPhase=0,k(t),b(e,t))};s.addEventListener("click",a),s.addEventListener("keydown",n=>{(n.key==="Enter"||n.key===" ")&&(n.preventDefault(),a())})})}function R(e){let t=e.lesson.meta||{},s=t.kurssi_title||t.course_title||t.course_key||"Kurssi",a=t.lesson_index||e.lessonIndex,n=t.title||"Oppitunti";return`<nav class="lr-breadcrumb" aria-label="Sijainti">
    <a class="lr-breadcrumb__link" href="#/oppimispolku" id="lr-breadcrumb-path">Oppimispolku</a>
    <span class="lr-breadcrumb__sep" aria-hidden="true">/</span>
    <span class="lr-breadcrumb__crumb">${u(s)}</span>
    <span class="lr-breadcrumb__sep" aria-hidden="true">/</span>
    <span class="lr-breadcrumb__crumb is-current" aria-current="page">${u(`${a}. ${n}`)}</span>
  </nav>`}function L(e,t){return`${V}${e}:${t}`}function k(e){if(!(!e||!e.kurssiKey||e.finished)&&!(e.currentPhaseIdx===0&&e.currentItemIdx===0&&e.answeredInPhase===0))try{sessionStorage.setItem(L(e.kurssiKey,e.lessonIndex),JSON.stringify({currentPhaseIdx:e.currentPhaseIdx,currentItemIdx:e.currentItemIdx,correctInPhase:e.correctInPhase,answeredInPhase:e.answeredInPhase,phaseResults:e.phaseResults,targetGrade:e.targetGrade,phaseSignature:e.phases.map(t=>`${t.phase_id}:${t.items.length}`).join("|"),savedAt:Date.now()}))}catch{}}function J(e,t,s){try{let a=sessionStorage.getItem(L(e,t));if(!a)return null;let n=JSON.parse(a);if(!n||typeof n!="object")return null;let i=s.phases.map(r=>`${r.phase_id}:${r.items.length}`).join("|");return n.phaseSignature!==i||n.savedAt&&Date.now()-n.savedAt>1440*60*1e3?null:n}catch{return null}}function Y(e,t){try{sessionStorage.removeItem(L(e,t))}catch{}}function u(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function $(e){return String(e||"").toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ")}function H(e,t,s="es"){let a=t||[],n=$(e);if(n&&a.some(i=>$(i)===n))return{ok:!0,hint:null};for(let i of a){let r=C(e,i,s);if(r.ok)return r}return{ok:!1,hint:null}}function U(e,t,s,a){let n=(e.phases||[]).filter(i=>!B(i,t));return{lesson:e,kurssiKey:s,lessonIndex:a,targetGrade:t,phases:n,currentPhaseIdx:0,currentItemIdx:0,correctInPhase:0,answeredInPhase:0,phaseResults:[],sidePanelOpen:!1,sidePanelOpenMs:0,sidePanelOpenedAt:0,startedAt:Date.now(),finished:!1}}function _e(e,t,s,a){let n=e.pregenerated||e;W(),j("screen-lesson");let i=document.getElementById(y);if(!i)return;let r=U(n,a||"B",t,s);try{sessionStorage.setItem("currentLesson",JSON.stringify({kurssiKey:t,lessonIndex:s,lessonFocus:n.meta?.title||"",lessonType:n.meta?.lesson_type||"",targetGrade:r.targetGrade,isPregenerated:!0}));let o=n.teaching||{},c=String(o.intro_md||"").trim(),d=Array.isArray(o.key_points)?o.key_points:[],p=[c,d.length?`## Avainkohdat
`+d.map(h=>`- ${h}`).join(`
`):""].filter(Boolean).join(`

`);p?sessionStorage.setItem("currentLessonTeachingMd",p):sessionStorage.removeItem("currentLessonTeachingMd")}catch{}r._courseLessons=[],z(t).then(o=>{r._courseLessons=o;let c=document.querySelector(".lr-shell .lr-toc");if(c&&c.parentElement){let d=document.createElement("div");d.innerHTML=w(r),c.parentElement.replaceChild(d.firstElementChild,c),x(document.getElementById(y),r)}});let l=J(t,s,r);if(l){r.currentPhaseIdx=l.currentPhaseIdx,r.currentItemIdx=l.currentItemIdx,r.correctInPhase=l.correctInPhase||0,r.answeredInPhase=l.answeredInPhase||0,r.phaseResults=Array.isArray(l.phaseResults)?l.phaseResults:[],r.startedAt=Date.now(),b(i,r);return}G(i,r)}function W(){let e=document.getElementById("screen-lesson");e||(e=document.createElement("div"),e.id="screen-lesson",e.className="screen",document.querySelector(".app-main")?.appendChild(e)||document.body.appendChild(e)),document.getElementById(y)||(e.innerHTML=`<div id="${y}"></div>`)}function G(e,t){let s=t.lesson.meta||{},a=t.lesson.teaching||{},n=K(a.intro_md||""),i=Array.isArray(a.key_points)?a.key_points:[],r=i.length?`<ul class="lr-keypoints">${i.map(l=>`<li>${u(l)}</li>`).join("")}</ul>`:"";e.innerHTML=`
    <div class="lr-shell lr-shell--teaching lr-shell--three">
      ${R(t)}
      <button type="button" class="lr-back" id="lr-back">\u2190 Oppimispolku</button>
      ${w(t)}
      <header class="lr-hero">
        <p class="lr-eyebrow">${u(s.course_key||"")} \xB7 Oppitunti ${u(String(s.lesson_index||""))}</p>
        <h1 class="display display--serif">${u(s.title||"Oppitunti")}</h1>
        ${s.description?`<p class="lr-desc">${u(s.description)}</p>`:""}
      </header>
      <article class="lr-teaching">${n}${r}</article>
      <div class="lr-actions">
        <button type="button" class="btn btn-primary" id="lr-start">Aloita harjoittelu \u2192</button>
        <p class="lr-hint">Voit avata Apua-paneelin milloin tahansa harjoituksen aikana.</p>
      </div>
    </div>`,x(e,t),document.getElementById("lr-back")?.addEventListener("click",()=>{N(t)}),document.getElementById("lr-start")?.addEventListener("click",()=>{t.startedAt=Date.now(),b(e,t)})}function b(e,t){let s=t.phases[t.currentPhaseIdx];if(!s)return D(e,t);let a=t.phases.length,n=X(t),i=s.items[t.currentItemIdx];if(!i)return P(e,t,s,"completed");e.innerHTML=`
    <div class="lr-shell lr-shell--exercise lr-shell--three">
      ${R(t)}
      <div class="lr-topbar">
        <button type="button" class="lr-exit-btn" id="lr-exit-lesson" aria-label="Takaisin oppimispolulle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          <span>Oppimispolku</span>
        </button>
        <div class="lr-topbar-progress">
          <span class="lr-step-label">Vaihe ${t.currentPhaseIdx+1} / ${a}</span>
          ${n}
        </div>
        <div class="lr-topbar-actions">
          <button type="button" class="lr-help-btn" id="lr-help-toggle" aria-expanded="${t.sidePanelOpen?"true":"false"}" aria-controls="lr-side-panel">\u{1F4D6} Apua</button>
          <button type="button" class="lr-skip-btn" id="lr-skip">Olen valmis t\xE4st\xE4</button>
        </div>
      </div>
      ${w(t)}
      <header class="lr-phase-head">
        <h2 class="lr-phase-title">${u(s.title||"Vaihe")}</h2>
        ${s.instruction?`<p class="lr-phase-instr">${u(s.instruction)}</p>`:""}
        <p class="lr-item-counter">Kysymys ${t.currentItemIdx+1} / ${s.items.length}</p>
      </header>
      <div class="lr-item" id="lr-item">${Q(i,t)}</div>
      ${pe(t)}
    </div>`,ae(e,t,i),x(e,t)}function X(e){return`<span class="lr-stepper" aria-hidden="true">${e.phases.map((s,a)=>a<e.currentPhaseIdx?'<span class="lr-step lr-step--done" aria-hidden="true">\u25CF</span>':a===e.currentPhaseIdx?'<span class="lr-step lr-step--current" aria-hidden="true">\u25CF</span>':'<span class="lr-step" aria-hidden="true">\u25CB</span>').join("")}</span>`}function Q(e,t){switch(e.item_type){case"mc":return Z(e);case"typed":return F(e);case"translate":return ee(e);case"match":return te(e);case"gap_fill":return se(e);case"writing":return ne(e);case"reading_mc":return re(e);default:return`<p class="lr-unsupported">Teht\xE4v\xE4tyyppi\xE4 "${u(e.item_type||"?")}" ei tueta, ohitetaan.</p>
        <button type="button" class="btn btn-primary" data-lr-skip-item>Jatka</button>`}}function Z(e){return`
    <div class="lr-mc">
      ${e.context?`<p class="lr-mc-context">${u(e.context)}</p>`:""}
      <p class="lr-mc-stem">${u(e.stem||"")}</p>
      <div class="lr-mc-choices" role="radiogroup">
        ${(e.choices||[]).map((s,a)=>`
          <button type="button" class="lr-mc-choice" data-mc-idx="${a}" role="radio" aria-checked="false">${u(s)}</button>
        `).join("")}
      </div>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function F(e){return`
    <div class="lr-typed">
      <p class="lr-typed-dir">${e.direction==="es_to_fi"?"K\xE4\xE4nn\xE4 suomeksi":"K\xE4\xE4nn\xE4 espanjaksi"}</p>
      <p class="lr-typed-prompt">${u(e.prompt||"")}</p>
      ${e.hint?`<p class="lr-typed-hint">Vihje: ${u(e.hint)}</p>`:""}
      <input type="text" class="lr-typed-input" id="lr-typed-input" autocomplete="off" autocapitalize="off" spellcheck="false" />
      <button type="button" class="btn btn-primary" id="lr-typed-submit">Tarkista</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function ee(e){return F({...e,prompt:e.source})}function te(e){let t=(e.pairs||[]).map(a=>a.left),s=me((e.pairs||[]).map(a=>a.right));return`
    <div class="lr-match" data-match>
      <p class="lr-match-instr">Yhdist\xE4 parit klikkaamalla.</p>
      <div class="lr-match-cols">
        <div class="lr-match-col">
          ${t.map((a,n)=>`<button type="button" class="lr-match-cell" data-side="left" data-idx="${n}">${u(a)}</button>`).join("")}
        </div>
        <div class="lr-match-col">
          ${s.map(a=>`<button type="button" class="lr-match-cell" data-side="right" data-val="${u(a)}">${u(a)}</button>`).join("")}
        </div>
      </div>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function se(e){let t=e.sentence_template||"",s=(e.answers||e.accepts||[]).reduce((r,l)=>Math.max(r,String(l||"").length),8),a=Math.min(Math.max(s,6),18),n=u(t).replace(/\{(\d+)\}/g,(r,l)=>`<input type="text" class="lr-gap-input" data-gap="${l}" size="${a}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="T\xE4yt\xE4 kohta ${l}" />`),i=Array.isArray(e.word_bank)&&e.word_bank.length?`<div class="lr-gap-bank" role="group" aria-label="Sanapankki">
        ${e.word_bank.map(r=>`<button type="button" class="lr-gap-chip" data-word="${u(r)}">${u(r)}</button>`).join("")}
       </div>`:"";return`
    <div class="lr-gap">
      <p class="lr-gap-sentence">${n}</p>
      ${i}
      <button type="button" class="btn btn-primary" id="lr-gap-submit">Tarkista</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function ne(e){let t=Number(e.min_chars)||_(e.min_words),s=Number(e.max_chars)||_(e.max_words);return`
    <div class="lr-writing">
      <p class="lr-writing-prompt">${u(e.prompt||"")}</p>
      <textarea class="lr-writing-input" id="lr-writing-input"
                data-min-chars="${t}" data-max-chars="${s}"
                rows="8"></textarea>
      <p class="lr-writing-char-counter" id="lr-writing-char-counter">0 / ${t}\u2013${s} merkki\xE4</p>
      <button type="button" class="btn btn-primary" id="lr-writing-submit">L\xE4het\xE4</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function re(e){let t=u(e.passage||"").replace(/\n/g,"<br>"),s=(e.questions||[]).map((a,n)=>`
    <fieldset class="lr-reading-q" data-q="${n}">
      <legend>${u(a.question_fi||"")}</legend>
      ${(a.choices||[]).map((i,r)=>`
        <label class="lr-reading-choice"><input type="radio" name="lr-q-${n}" value="${r}"> ${u(i)}</label>
      `).join("")}
    </fieldset>
  `).join("");return`
    <div class="lr-reading">
      <article class="lr-reading-passage">${t}</article>
      <div class="lr-reading-qs">${s}</div>
      <button type="button" class="btn btn-primary" id="lr-reading-submit">Tarkista vastaukset</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function ae(e,t,s){e.__lrState=t,T(e,t.language),document.getElementById("lr-help-toggle")?.addEventListener("click",()=>he(e,t)),document.getElementById("lr-skip")?.addEventListener("click",()=>de(e,t)),document.getElementById("lr-exit-lesson")?.addEventListener("click",async()=>{k(t),location.hash="#/aloitus"}),e.querySelector("[data-lr-skip-item]")?.addEventListener("click",()=>I(e,t,!0));let a=typeof t.language=="string"&&t.language||"es";if(s.item_type==="mc")e.querySelectorAll(".lr-mc-choice").forEach(n=>{n.addEventListener("click",()=>{let i=Number(n.dataset.mcIdx),r=i===Number(s.correct_index);m(e,r,s.explanation||"",{hint:null,waitForClick:!r}),oe(e,s.correct_index,i),g(t,r),r&&f(e,t)})});else if(s.item_type==="typed"||s.item_type==="translate"){let n=document.getElementById("lr-typed-input"),i=document.getElementById("lr-typed-submit"),r=()=>{let l=s.accept||[],{ok:o,hint:c}=H(n.value,l,a),d=l[0]||"";m(e,o,o?"":`Oikea vastaus: ${d}`,{hint:c,waitForClick:!o}),g(t,o),o&&f(e,t)};i?.addEventListener("click",r),n?.addEventListener("keydown",l=>{l.key==="Enter"&&r()}),n?.focus()}else if(s.item_type==="match")ie(e,t,s);else if(s.item_type==="gap_fill"){let n=null,i=e.querySelectorAll(".lr-gap-input");i.forEach(r=>{r.addEventListener("focus",()=>{n=r})}),i[0]?.focus(),e.querySelectorAll(".lr-gap-chip").forEach(r=>{r.addEventListener("click",()=>{let l=r.dataset.word||r.textContent||"",o=n&&n.value===""?n:Array.from(i).find(c=>!c.value)||n||i[0];o&&(o.value=l,o.classList.add("is-filled"),r.classList.add("is-used"),(Array.from(i).find(d=>!d.value)||o).focus())})}),i.forEach(r=>{r.addEventListener("input",()=>{r.classList.toggle("is-filled",!!r.value),e.querySelectorAll(".lr-gap-chip.is-used").forEach(l=>{let o=l.dataset.word||l.textContent||"",c=Array.from(i).some(d=>d.value===o);l.classList.toggle("is-used",c)})})}),document.getElementById("lr-gap-submit")?.addEventListener("click",()=>{let r=!0,l=[],o=null;i.forEach((c,d)=>{let p=s.answers&&s.answers[d]||[],h=H(c.value,p,a);h.ok||(r=!1),h.hint&&!o&&(o=h.hint),l.push(p[0]||"?"),c.classList.toggle("is-wrong",!h.ok),c.classList.toggle("is-correct",h.ok)}),m(e,r,r?"":`Oikeat vastaukset: ${l.join(", ")}`,{hint:o,waitForClick:!r}),g(t,r),r&&f(e,t)})}else if(s.item_type==="writing"){let n=document.getElementById("lr-writing-input"),i=document.getElementById("lr-writing-char-counter"),r=Number(n?.dataset.minChars)||0,l=Number(n?.dataset.maxChars)||0;n&&i&&q(n,i,{minChars:r,maxChars:l}),document.getElementById("lr-writing-submit")?.addEventListener("click",()=>{let c=(n?.value||"").length,d=c>=r,p=d?"Kirjoituksesi on tallennettu.":`Merkkim\xE4\xE4r\xE4 on ${c}, tavoite v\xE4hint\xE4\xE4n ${r} merkki\xE4. Jatka kirjoitusta.`;m(e,d,p,{hint:null,waitForClick:!d}),g(t,d),d&&f(e,t)})}else s.item_type==="reading_mc"&&document.getElementById("lr-reading-submit")?.addEventListener("click",()=>{let n=0,i=(s.questions||[]).length;(s.questions||[]).forEach((l,o)=>{let c=e.querySelector(`input[name="lr-q-${o}"]:checked`);c&&Number(c.value)===Number(l.correct_index)&&n++});let r=n===i;m(e,r,r?"Kaikki oikein.":`${n}/${i} oikein.`),t.correctInPhase+=n/i,t.answeredInPhase+=1,f(e,t,!1)})}function ie(e,t,s){let a=null,n=new Set,i=(s.pairs||[]).length,r=0;e.querySelectorAll(".lr-match-cell").forEach(l=>{l.addEventListener("click",()=>{if(n.has(l))return;if(l.dataset.side==="left")e.querySelectorAll('.lr-match-cell[data-side="left"]').forEach(c=>c.classList.remove("is-active")),l.classList.add("is-active"),a=l;else if(a){let c=Number(a.dataset.idx),d=s.pairs[c]?.right,p=l.dataset.val;d&&p&&$(d)===$(p)?(a.classList.add("is-matched"),l.classList.add("is-matched"),n.add(a),n.add(l),a=null,r++,r===i&&(m(e,!0,"Kaikki parit oikein."),g(t,!0),f(e,t))):(l.classList.add("is-wrong"),setTimeout(()=>l.classList.remove("is-wrong"),600))}})})}var le='<svg class="lr-feedback__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',ce='<svg class="lr-feedback__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';function m(e,t,s,a={}){let n=e.querySelector("#lr-feedback");if(!n)return;let{hint:i=null,waitForClick:r=!1}=a;n.hidden=!1,n.className=`lr-feedback ${t?"is-correct lr-feedback--correct":"is-wrong lr-feedback--wrong"}`,n.setAttribute("role","status"),n.setAttribute("aria-live",t?"polite":"assertive");let l=t?s||"Hyvin meni!":s||"Melkein, yrit\xE4 uudelleen.",o=i?`<p class="lr-feedback__accent-hint">${u(i)}</p>`:"",c=r?'<button type="button" class="lr-feedback__next" id="lr-feedback-next">Seuraava \u2192</button>':"";n.innerHTML=`${t?le:ce}<div class="lr-feedback__body-wrap"><p class="lr-feedback__title ${t?"is-correct":"is-wrong"}">${t?"Oikein":"V\xE4\xE4rin"}</p><p class="lr-feedback__body">${u(l)}</p>${o}${c}</div>`,n.classList.remove("lr-feedback--animate"),n.offsetWidth,n.classList.add("lr-feedback--animate"),r&&n.querySelector("#lr-feedback-next")?.addEventListener("click",()=>{let p=e.__lrState;p&&I(e,p,!1)},{once:!0})}function oe(e,t,s){e.querySelectorAll(".lr-mc-choice").forEach(a=>{let n=Number(a.dataset.mcIdx);a.disabled=!0,n===t&&a.classList.add("is-correct"),n===s&&s!==t&&a.classList.add("is-wrong")})}function g(e,t){e.answeredInPhase+=1,t&&(e.correctInPhase+=1)}function f(e,t,s=!0){setTimeout(()=>I(e,t,!1),1100)}function I(e,t,s){let a=t.phases[t.currentPhaseIdx];if(t.currentItemIdx+=1,k(t),t.currentItemIdx>=a.items.length)return P(e,t,a,"completed");b(e,t)}function P(e,t,s,a){let n=t.answeredInPhase||s.items.length,i=Math.round(t.correctInPhase),r=n>0?t.correctInPhase/n:0,l=M(s,t.targetGrade),o=a==="skipped",c=!o&&r>=l;t.phaseResults.push({phaseId:s.phase_id,title:s.title,correct:i,total:n,pct:r,threshold:l,mastered:c,skipped:o});let d,p;o?(d="Vaihe ohitettu",p="Sanat palaavat kertaussessioon my\xF6hemmin, niit\xE4 ei j\xE4tet\xE4 unohduksiin."):c?(d="Hallitset t\xE4m\xE4n",p=`Sait ${i} / ${n} oikein, jatketaan seuraavaan vaiheeseen.`):r>=.5?(d="L\xE4hell\xE4, viel\xE4 yksi pyyhk\xE4isy",p=`${i} / ${n} oikein. Sanat joissa horjuit palaavat seuraavissa vaiheissa.`):(d="T\xE4m\xE4 kaipaa toistoa",p=`${i} / ${n} oikein. Et ole yksin, t\xE4m\xE4 rakenne vaatii toistoa, ei eri s\xE4\xE4nt\xF6\xE4.`);let h=t.currentPhaseIdx+1>=t.phases.length;e.innerHTML=`
    <div class="lr-shell lr-shell--banner">
      <div class="lr-banner ${c?"is-mastered":o?"is-skipped":"is-almost"}">
        <p class="lr-banner-eyebrow">${u(s.title||"Vaihe")}</p>
        <h2>${u(d)}</h2>
        <p>${u(p)}</p>
        <button type="button" class="btn btn-primary" id="lr-next">${h?"N\xE4yt\xE4 yhteenveto":"Seuraava vaihe \u2192"}</button>
      </div>
    </div>`,document.getElementById("lr-next")?.addEventListener("click",()=>{t.currentPhaseIdx+=1,t.currentItemIdx=0,t.correctInPhase=0,t.answeredInPhase=0,t.currentPhaseIdx>=t.phases.length?D(e,t):(k(t),b(e,t))})}function de(e,t){if(!window.confirm("Ohita t\xE4m\xE4 vaihe? Sanat palaavat kertaussessioon my\xF6hemmin."))return;let a=t.phases[t.currentPhaseIdx];P(e,t,a,"skipped")}function D(e,t){if(t.finished)return;t.finished=!0,Y(t.kurssiKey,t.lessonIndex);let s=t.phaseResults.reduce((c,d)=>c+(d.skipped?0:d.correct),0),a=t.phaseResults.reduce((c,d)=>c+(d.skipped?0:d.total),0),n=Math.max(1,Math.round((Date.now()-t.startedAt)/6e4)),i=t.targetGrade,r=ue(i,t.phaseResults),l=t.lesson.meta?.yo_relevance||"",o=t.phaseResults.map(c=>{let d=c.skipped?"lr-result-skipped":c.mastered?"lr-result-mastered":"lr-result-almost",p=c.skipped?"Ohitettu":c.mastered?"Hallitset":"L\xE4hell\xE4";return`<li class="lr-result-row ${d}">
      <span class="lr-result-title">${u(c.title||"")}</span>
      <span class="lr-result-status">${p}${c.skipped?"":` \xB7 ${c.correct}/${c.total}`}</span>
    </li>`}).join("");e.innerHTML=`
    <div class="lr-shell lr-shell--results">
      <header class="lr-hero">
        <p class="lr-eyebrow">Yhteenveto</p>
        <h1>${u(t.lesson.meta?.title||"Oppitunti")}</h1>
      </header>
      <div class="lr-result-summary">
        <div class="lr-result-stat"><span class="lr-result-num">${s}/${a||0}</span><span class="lr-result-lbl">oikein</span></div>
        <div class="lr-result-stat"><span class="lr-result-num">${n}</span><span class="lr-result-lbl">min</span></div>
      </div>
      <div class="lr-tutor">${u(r)}</div>
      ${l?`<aside class="lr-yo">
        <p class="lr-yo-eyebrow">T\xE4m\xE4 YO-kokeessa</p>
        <p>${u(l)}</p>
      </aside>`:""}
      <ol class="lr-results-list">${o}</ol>
      <div class="lr-actions">
        <button type="button" class="btn btn-primary" id="lr-done">Takaisin oppimispolulle \u2192</button>
      </div>
    </div>`,document.getElementById("lr-done")?.addEventListener("click",()=>{N(t)}),S()&&a>0&&O(`${E}/api/curriculum/${encodeURIComponent(t.kurssiKey)}/lesson/${t.lessonIndex}/complete`,{method:"POST",headers:{"Content-Type":"application/json",...A()},body:JSON.stringify({scoreCorrect:s,scoreTotal:a,wrongAnswers:[],reviewItems:[]})}).catch(()=>{})}function ue(e,t){let s=t.filter(i=>i.skipped).length,a=t.filter(i=>!i.skipped&&i.mastered).length,n=t.filter(i=>!i.skipped&&!i.mastered).length;return e==="L"||e==="E"?n===0&&s===0?"L/E-tavoite vaatii ~85\u201395 % YO-kokeessa, t\xE4m\xE4n tunnin sanat ovat sinulla automaattisia. Eteenp\xE4in.":`${n} vaihe${n===1?"":"tta"} j\xE4i alle hallintarajan. L/E-tavoite ei salli horjuvia perusrakenteita, palaa n\xE4ihin huomenna kertauksessa.`:e==="I"||e==="A"?n===0&&s===0?"Hyv\xE4 alku. I/A-tavoite tarvitsee perussanaston tunnistustasolla, olet nyt siell\xE4.":"Et ole yksin. I/A-tavoitteelle riitt\xE4\xE4 tunnistus, ei kaikki sanat tarvitse olla automaattisia heti. Sanat palaavat kertauksessa.":a===t.length?"Tunti meni kuten pitikin. Jatketaan seuraavaan oppituntiin samalla rytmill\xE4.":n>0?`${n} vaihetta j\xE4i alle hallintarajan. Sanat palaavat seuraavassa kertaussessiossa, t\xE4m\xE4 on osa rytmi\xE4, ei takaisku.`:"Tunti suoritettu."}function pe(e){let t=e.lesson.side_panel?.tabs||[];if(!t.length)return"";let s=t.map((n,i)=>`
    <button type="button" class="lr-tab ${i===0?"is-active":""}" data-tab="${u(n.id)}">${u(n.title||n.id)}</button>
  `).join(""),a=t.map((n,i)=>`
    <div class="lr-tab-pane ${i===0?"is-active":""}" data-pane="${u(n.id)}">
      ${K(n.content_md||"")}
    </div>
  `).join("");return`
    <aside id="lr-side-panel" class="lr-side-panel ${e.sidePanelOpen?"is-open":""}" aria-hidden="${e.sidePanelOpen?"false":"true"}">
      <div class="lr-side-tabs" role="tablist">${s}</div>
      <div class="lr-side-panes">${a}</div>
    </aside>`}function he(e,t){t.sidePanelOpen=!t.sidePanelOpen,t.sidePanelOpen?t.sidePanelOpenedAt=Date.now():t.sidePanelOpenedAt&&(t.sidePanelOpenMs+=Date.now()-t.sidePanelOpenedAt,t.sidePanelOpenedAt=0);let s=e.querySelector("#lr-side-panel"),a=e.querySelector("#lr-help-toggle"),n=e.querySelector(".lr-shell--exercise");n&&n.classList.toggle("has-panel-open",t.sidePanelOpen),s&&(s.classList.toggle("is-open",t.sidePanelOpen),s.setAttribute("aria-hidden",t.sidePanelOpen?"false":"true")),a&&(a.setAttribute("aria-expanded",t.sidePanelOpen?"true":"false"),a.textContent=t.sidePanelOpen?"\u2715 Sulje":"\u{1F4D6} Apua"),e.querySelectorAll(".lr-tab").forEach(i=>{i.onclick=()=>{e.querySelectorAll(".lr-tab").forEach(l=>l.classList.toggle("is-active",l===i));let r=i.dataset.tab;e.querySelectorAll(".lr-tab-pane").forEach(l=>l.classList.toggle("is-active",l.dataset.pane===r))}})}function me(e){let t=e.slice();for(let s=t.length-1;s>0;s--){let a=Math.floor(Math.random()*(s+1));[t[s],t[a]]=[t[a],t[s]]}return t}function K(e){if(!e)return"";let t=String(e).split(/\r?\n/),s=[],a=[],n=!1,i=()=>{a.length&&(s.push(`<p>${l(a.join(" "))}</p>`),a=[])},r=()=>{n&&(s.push("</ul>"),n=!1)};function l(o){let c=u(o);return c=c.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),c=c.replace(/\*([^*]+)\*/g,"<em>$1</em>"),c=c.replace(/`([^`]+)`/g,"<code>$1</code>"),c}for(let o of t){let c=o.replace(/\s+$/,"");if(/^#{1,3}\s/.test(c)){i(),r();let d=c.startsWith("### ")?3:c.startsWith("## ")?2:1;s.push(`<h${d}>${l(c.replace(/^#{1,3}\s+/,""))}</h${d}>`)}else/^\s*[-*]\s+/.test(c)?(i(),n||(s.push("<ul>"),n=!0),s.push(`<li>${l(c.replace(/^\s*[-*]\s+/,""))}</li>`)):/^\s*$/.test(c)?(i(),r()):(r(),a.push(c))}return i(),r(),s.join(`
`)}export{Y as clearLessonProgress,_e as runPregeneratedLesson,k as saveLessonProgress};
//# sourceMappingURL=app-lessonRunner-F7U5XLJB.js.map
