import{a as C,c as T}from"./app-chunk-N47QBJIH.js";import"./app-chunk-BKOFN7BD.js";import{a as S,c as E,e as A,j as O}from"./app-chunk-NZWTLFMY.js";import{b as j}from"./app-chunk-3WC2U67L.js";function M(t,e){let n=t?.mastery_threshold;return n?typeof n[e]=="number"?n[e]:n.B??.7:.7}function B(t,e){let n=t?.skip_for_targets;return Array.isArray(n)&&n.includes(e)}function q(t,e,{minChars:n=0,maxChars:r=0}={}){if(!t||!e)return{stop(){}};let s=n||r?`${n}\u2013${r}`:"";function a(){let i=(t.value||"").length;e.textContent=s?`${i} / ${s} merkki\xE4`:`${i} merkki\xE4`,e.classList.toggle("is-met",n>0&&i>=n),e.classList.toggle("is-too-long",r>0&&i>r)}return t.addEventListener("input",a),a(),{stop(){t.removeEventListener("input",a)}}}function I(t){return Math.round((t||0)*6)}var g="lesson-runner-root",K="puheo:lessonProgress:",k=new Map;async function J(t){if(!t)return[];if(k.has(t))return k.get(t);try{let{API:e,isLoggedIn:n,authHeader:r,apiFetch:s}=await import("./app-api-54FCZYC2.js"),a=await s(`${e}/api/curriculum/${encodeURIComponent(t)}`,{headers:{...n()?r():{}}});if(!a.ok)return k.set(t,[]),[];let i=await a.json(),c=Array.isArray(i.lessons)?i.lessons.slice().sort((u,l)=>(u.sortOrder||0)-(l.sortOrder||0)):[];return k.set(t,c),c}catch{return[]}}function w(t){let e=t._courseLessons||[];if(e.length===0)return`<aside class="lr-toc" aria-label="Kurssin oppitunnit">
      <p class="lr-toc__head">Oppitunnit</p>
      <p class="lr-toc__loading">Ladataan&hellip;</p>
    </aside>`;let n=t.lessonIndex;return`<aside class="lr-toc" aria-label="Kurssin oppitunnit">
    <p class="lr-toc__head">Oppitunnit</p>
    <ol class="lr-toc__list">${e.map(s=>{let a=s.sortOrder||0,i=a===n,c=!!s.completed&&!i,u=["lr-toc__item",i?"is-current":"",c?"is-done":""].filter(Boolean).join(" "),l=i?"\u2192":c?"\u2713":"";return`<li class="${u}" data-lesson="${o(String(a))}" ${i?"":'tabindex="0"'}>
      <span class="lr-toc__num">${o(String(a))}</span>
      <span class="lr-toc__title">${o(s.title||`Oppitunti ${a}`)}</span>
      <span class="lr-toc__mark" aria-hidden="true">${l}</span>
    </li>`}).join("")}</ol>
  </aside>`}function x(t,e){t.querySelectorAll(".lr-toc__item:not(.is-current)").forEach(n=>{let r=async()=>{let s=Number(n.dataset.lesson);if(!Number.isFinite(s)||s===e.lessonIndex)return;y(e),(await import("./app-curriculum-ASJ5FOA2.js")).openLesson(e.kurssiKey,s)};n.addEventListener("click",r),n.addEventListener("keydown",s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),r())})})}function N(t){let e=t.lesson.meta||{},n=e.kurssi_title||e.course_title||e.course_key||"Kurssi",r=e.lesson_index||t.lessonIndex,s=e.title||"Oppitunti";return`<nav class="lr-breadcrumb" aria-label="Sijainti">
    <a class="lr-breadcrumb__link" href="#/oppimispolku" id="lr-breadcrumb-path">Oppimispolku</a>
    <span class="lr-breadcrumb__sep" aria-hidden="true">/</span>
    <span class="lr-breadcrumb__crumb">${o(n)}</span>
    <span class="lr-breadcrumb__sep" aria-hidden="true">/</span>
    <span class="lr-breadcrumb__crumb is-current" aria-current="page">${o(`${r}. ${s}`)}</span>
  </nav>`}function L(t,e){return`${K}${t}:${e}`}function y(t){if(!(!t||!t.kurssiKey||t.finished)&&!(t.currentPhaseIdx===0&&t.currentItemIdx===0&&t.answeredInPhase===0))try{sessionStorage.setItem(L(t.kurssiKey,t.lessonIndex),JSON.stringify({currentPhaseIdx:t.currentPhaseIdx,currentItemIdx:t.currentItemIdx,correctInPhase:t.correctInPhase,answeredInPhase:t.answeredInPhase,phaseResults:t.phaseResults,targetGrade:t.targetGrade,phaseSignature:t.phases.map(e=>`${e.phase_id}:${e.items.length}`).join("|"),savedAt:Date.now()}))}catch{}}function V(t,e,n){try{let r=sessionStorage.getItem(L(t,e));if(!r)return null;let s=JSON.parse(r);if(!s||typeof s!="object")return null;let a=n.phases.map(i=>`${i.phase_id}:${i.items.length}`).join("|");return s.phaseSignature!==a||s.savedAt&&Date.now()-s.savedAt>1440*60*1e3?null:s}catch{return null}}function z(t,e){try{sessionStorage.removeItem(L(t,e))}catch{}}function o(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function b(t){return String(t||"").toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ")}function H(t,e,n="es"){let r=e||[],s=b(t);if(s&&r.some(a=>b(a)===s))return{ok:!0,hint:null};for(let a of r){let i=C(t,a,n);if(i.ok)return i}return{ok:!1,hint:null}}function Y(t,e,n,r){let s=(t.phases||[]).filter(a=>!B(a,e));return{lesson:t,kurssiKey:n,lessonIndex:r,targetGrade:e,phases:s,currentPhaseIdx:0,currentItemIdx:0,correctInPhase:0,answeredInPhase:0,phaseResults:[],sidePanelOpen:!1,sidePanelOpenMs:0,sidePanelOpenedAt:0,startedAt:Date.now(),finished:!1}}function _e(t,e,n,r){let s=t.pregenerated||t;W(),j("screen-lesson");let a=document.getElementById(g);if(!a)return;let i=Y(s,r||"B",e,n);try{sessionStorage.setItem("currentLesson",JSON.stringify({kurssiKey:e,lessonIndex:n,lessonFocus:s.meta?.title||"",lessonType:s.meta?.lesson_type||"",targetGrade:i.targetGrade,isPregenerated:!0}));let u=s.teaching||{},l=String(u.intro_md||"").trim(),d=Array.isArray(u.key_points)?u.key_points:[],p=[l,d.length?`## Avainkohdat
`+d.map(_=>`- ${_}`).join(`
`):""].filter(Boolean).join(`

`);p?sessionStorage.setItem("currentLessonTeachingMd",p):sessionStorage.removeItem("currentLessonTeachingMd")}catch{}i._courseLessons=[],J(e).then(u=>{i._courseLessons=u;let l=document.querySelector(".lr-shell .lr-toc");if(l&&l.parentElement){let d=document.createElement("div");d.innerHTML=w(i),l.parentElement.replaceChild(d.firstElementChild,l),x(document.getElementById(g),i)}});let c=V(e,n,i);if(c){i.currentPhaseIdx=c.currentPhaseIdx,i.currentItemIdx=c.currentItemIdx,i.correctInPhase=c.correctInPhase||0,i.answeredInPhase=c.answeredInPhase||0,i.phaseResults=Array.isArray(c.phaseResults)?c.phaseResults:[],i.startedAt=Date.now(),$(a,i);return}G(a,i)}function W(){let t=document.getElementById("screen-lesson");t||(t=document.createElement("div"),t.id="screen-lesson",t.className="screen",document.querySelector(".app-main")?.appendChild(t)||document.body.appendChild(t)),document.getElementById(g)||(t.innerHTML=`<div id="${g}"></div>`)}function G(t,e){let n=e.lesson.meta||{},r=e.lesson.teaching||{},s=D(r.intro_md||""),a=Array.isArray(r.key_points)?r.key_points:[],i=a.length?`<ul class="lr-keypoints">${a.map(c=>`<li>${o(c)}</li>`).join("")}</ul>`:"";t.innerHTML=`
    <div class="lr-shell lr-shell--teaching lr-shell--three">
      ${N(e)}
      <button type="button" class="lr-back" id="lr-back">\u2190 Oppimispolku</button>
      ${w(e)}
      <header class="lr-hero">
        <p class="lr-eyebrow">${o(n.course_key||"")} \xB7 Oppitunti ${o(String(n.lesson_index||""))}</p>
        <h1 class="display display--serif">${o(n.title||"Oppitunti")}</h1>
        ${n.description?`<p class="lr-desc">${o(n.description)}</p>`:""}
      </header>
      <article class="lr-teaching">${s}${i}</article>
      <div class="lr-actions">
        <button type="button" class="btn btn-primary" id="lr-start">Aloita harjoittelu \u2192</button>
        <p class="lr-hint">Voit avata Apua-paneelin milloin tahansa harjoituksen aikana.</p>
      </div>
    </div>`,x(t,e),document.getElementById("lr-back")?.addEventListener("click",()=>{import("./app-curriculum-ASJ5FOA2.js").then(c=>c.loadCurriculum())}),document.getElementById("lr-start")?.addEventListener("click",()=>{e.startedAt=Date.now(),$(t,e)})}function $(t,e){let n=e.phases[e.currentPhaseIdx];if(!n)return R(t,e);let r=e.phases.length,s=U(e),a=n.items[e.currentItemIdx];if(!a)return P(t,e,n,"completed");t.innerHTML=`
    <div class="lr-shell lr-shell--exercise lr-shell--three">
      ${N(e)}
      <div class="lr-topbar">
        <button type="button" class="lr-exit-btn" id="lr-exit-lesson" aria-label="Takaisin oppimispolulle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          <span>Oppimispolku</span>
        </button>
        <div class="lr-topbar-progress">
          <span class="lr-step-label">Vaihe ${e.currentPhaseIdx+1} / ${r}</span>
          ${s}
        </div>
        <div class="lr-topbar-actions">
          <button type="button" class="lr-help-btn" id="lr-help-toggle" aria-expanded="${e.sidePanelOpen?"true":"false"}" aria-controls="lr-side-panel">\u{1F4D6} Apua</button>
          <button type="button" class="lr-skip-btn" id="lr-skip">Olen valmis t\xE4st\xE4</button>
        </div>
      </div>
      ${w(e)}
      <header class="lr-phase-head">
        <h2 class="lr-phase-title">${o(n.title||"Vaihe")}</h2>
        ${n.instruction?`<p class="lr-phase-instr">${o(n.instruction)}</p>`:""}
        <p class="lr-item-counter">Kysymys ${e.currentItemIdx+1} / ${n.items.length}</p>
      </header>
      <div class="lr-item" id="lr-item">${X(a,e)}</div>
      ${ue(e)}
    </div>`,re(t,e,a),x(t,e)}function U(t){return`<span class="lr-stepper" aria-hidden="true">${t.phases.map((n,r)=>r<t.currentPhaseIdx?'<span class="lr-step lr-step--done" aria-hidden="true">\u25CF</span>':r===t.currentPhaseIdx?'<span class="lr-step lr-step--current" aria-hidden="true">\u25CF</span>':'<span class="lr-step" aria-hidden="true">\u25CB</span>').join("")}</span>`}function X(t,e){switch(t.item_type){case"mc":return Q(t);case"typed":return F(t);case"translate":return Z(t);case"match":return ee(t);case"gap_fill":return te(t);case"writing":return ne(t);case"reading_mc":return se(t);default:return`<p class="lr-unsupported">Teht\xE4v\xE4tyyppi\xE4 "${o(t.item_type||"?")}" ei tueta, ohitetaan.</p>
        <button type="button" class="btn btn-primary" data-lr-skip-item>Jatka</button>`}}function Q(t){return`
    <div class="lr-mc">
      ${t.context?`<p class="lr-mc-context">${o(t.context)}</p>`:""}
      <p class="lr-mc-stem">${o(t.stem||"")}</p>
      <div class="lr-mc-choices" role="radiogroup">
        ${(t.choices||[]).map((n,r)=>`
          <button type="button" class="lr-mc-choice" data-mc-idx="${r}" role="radio" aria-checked="false">${o(n)}</button>
        `).join("")}
      </div>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function F(t){return`
    <div class="lr-typed">
      <p class="lr-typed-dir">${t.direction==="es_to_fi"?"K\xE4\xE4nn\xE4 suomeksi":"K\xE4\xE4nn\xE4 espanjaksi"}</p>
      <p class="lr-typed-prompt">${o(t.prompt||"")}</p>
      ${t.hint?`<p class="lr-typed-hint">Vihje: ${o(t.hint)}</p>`:""}
      <input type="text" class="lr-typed-input" id="lr-typed-input" autocomplete="off" autocapitalize="off" spellcheck="false" />
      <button type="button" class="btn btn-primary" id="lr-typed-submit">Tarkista</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function Z(t){return F({...t,prompt:t.source})}function ee(t){let e=(t.pairs||[]).map(r=>r.left),n=he((t.pairs||[]).map(r=>r.right));return`
    <div class="lr-match" data-match>
      <p class="lr-match-instr">Yhdist\xE4 parit klikkaamalla.</p>
      <div class="lr-match-cols">
        <div class="lr-match-col">
          ${e.map((r,s)=>`<button type="button" class="lr-match-cell" data-side="left" data-idx="${s}">${o(r)}</button>`).join("")}
        </div>
        <div class="lr-match-col">
          ${n.map(r=>`<button type="button" class="lr-match-cell" data-side="right" data-val="${o(r)}">${o(r)}</button>`).join("")}
        </div>
      </div>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function te(t){let e=t.sentence_template||"",n=o(e).replace(/\{(\d+)\}/g,(s,a)=>`<input type="text" class="lr-gap-input" data-gap="${a}" autocomplete="off" autocapitalize="off" spellcheck="false" />`),r=Array.isArray(t.word_bank)&&t.word_bank.length?`<div class="lr-gap-bank">${t.word_bank.map(s=>`<span class="lr-gap-chip">${o(s)}</span>`).join("")}</div>`:"";return`
    <div class="lr-gap">
      <p class="lr-gap-sentence">${n}</p>
      ${r}
      <button type="button" class="btn btn-primary" id="lr-gap-submit">Tarkista</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function ne(t){let e=Number(t.min_chars)||I(t.min_words),n=Number(t.max_chars)||I(t.max_words);return`
    <div class="lr-writing">
      <p class="lr-writing-prompt">${o(t.prompt||"")}</p>
      <textarea class="lr-writing-input" id="lr-writing-input"
                data-min-chars="${e}" data-max-chars="${n}"
                rows="8"></textarea>
      <p class="lr-writing-char-counter" id="lr-writing-char-counter">0 / ${e}\u2013${n} merkki\xE4</p>
      <button type="button" class="btn btn-primary" id="lr-writing-submit">L\xE4het\xE4</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function se(t){let e=o(t.passage||"").replace(/\n/g,"<br>"),n=(t.questions||[]).map((r,s)=>`
    <fieldset class="lr-reading-q" data-q="${s}">
      <legend>${o(r.question_fi||"")}</legend>
      ${(r.choices||[]).map((a,i)=>`
        <label class="lr-reading-choice"><input type="radio" name="lr-q-${s}" value="${i}"> ${o(a)}</label>
      `).join("")}
    </fieldset>
  `).join("");return`
    <div class="lr-reading">
      <article class="lr-reading-passage">${e}</article>
      <div class="lr-reading-qs">${n}</div>
      <button type="button" class="btn btn-primary" id="lr-reading-submit">Tarkista vastaukset</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function re(t,e,n){t.__lrState=e,T(t,e.language),document.getElementById("lr-help-toggle")?.addEventListener("click",()=>pe(t,e)),document.getElementById("lr-skip")?.addEventListener("click",()=>oe(t,e)),document.getElementById("lr-exit-lesson")?.addEventListener("click",async()=>{let{confirmDialog:s}=await import("./app-confirmDialog-46K22AFY.js");y(e),await s({title:"Lopetetaanko oppitunti?",body:"Tallennamme kohdan johon p\xE4\xE4sit, voit jatkaa t\xE4\xE4lt\xE4 my\xF6hemmin.",confirmLabel:"L\xE4hde takaisin",cancelLabel:"Jatka oppituntia"})&&(await import("./app-curriculum-ASJ5FOA2.js")).loadCurriculum()}),t.querySelector("[data-lr-skip-item]")?.addEventListener("click",()=>v(t,e,!0));let r=typeof e.language=="string"&&e.language||"es";if(n.item_type==="mc")t.querySelectorAll(".lr-mc-choice").forEach(s=>{s.addEventListener("click",()=>{let a=Number(s.dataset.mcIdx),i=a===Number(n.correct_index);h(t,i,n.explanation||"",{hint:null,waitForClick:!i}),ce(t,n.correct_index,a),f(e,i),i&&m(t,e)})});else if(n.item_type==="typed"||n.item_type==="translate"){let s=document.getElementById("lr-typed-input"),a=document.getElementById("lr-typed-submit"),i=()=>{let c=n.accept||[],{ok:u,hint:l}=H(s.value,c,r),d=c[0]||"";h(t,u,u?"":`Oikea vastaus: ${d}`,{hint:l,waitForClick:!u}),f(e,u),u&&m(t,e)};a?.addEventListener("click",i),s?.addEventListener("keydown",c=>{c.key==="Enter"&&i()}),s?.focus()}else if(n.item_type==="match")ae(t,e,n);else if(n.item_type==="gap_fill")document.getElementById("lr-gap-submit")?.addEventListener("click",()=>{let s=t.querySelectorAll(".lr-gap-input"),a=!0,i=[],c=null;s.forEach((u,l)=>{let d=n.answers&&n.answers[l]||[],p=H(u.value,d,r);p.ok||(a=!1),p.hint&&!c&&(c=p.hint),i.push(d[0]||"?")}),h(t,a,a?"":`Oikeat vastaukset: ${i.join(", ")}`,{hint:c,waitForClick:!a}),f(e,a),a&&m(t,e)});else if(n.item_type==="writing"){let s=document.getElementById("lr-writing-input"),a=document.getElementById("lr-writing-char-counter"),i=Number(s?.dataset.minChars)||0,c=Number(s?.dataset.maxChars)||0;s&&a&&q(s,a,{minChars:i,maxChars:c}),document.getElementById("lr-writing-submit")?.addEventListener("click",()=>{let l=(s?.value||"").length,d=l>=i,p=d?"Kirjoituksesi on tallennettu.":`Merkkim\xE4\xE4r\xE4 on ${l}, tavoite v\xE4hint\xE4\xE4n ${i} merkki\xE4. Jatka kirjoitusta.`;h(t,d,p,{hint:null,waitForClick:!d}),f(e,d),d&&m(t,e)})}else n.item_type==="reading_mc"&&document.getElementById("lr-reading-submit")?.addEventListener("click",()=>{let s=0,a=(n.questions||[]).length;(n.questions||[]).forEach((c,u)=>{let l=t.querySelector(`input[name="lr-q-${u}"]:checked`);l&&Number(l.value)===Number(c.correct_index)&&s++});let i=s===a;h(t,i,i?"Kaikki oikein.":`${s}/${a} oikein.`),e.correctInPhase+=s/a,e.answeredInPhase+=1,m(t,e,!1)})}function ae(t,e,n){let r=null,s=new Set,a=(n.pairs||[]).length,i=0;t.querySelectorAll(".lr-match-cell").forEach(c=>{c.addEventListener("click",()=>{if(s.has(c))return;if(c.dataset.side==="left")t.querySelectorAll('.lr-match-cell[data-side="left"]').forEach(l=>l.classList.remove("is-active")),c.classList.add("is-active"),r=c;else if(r){let l=Number(r.dataset.idx),d=n.pairs[l]?.right,p=c.dataset.val;d&&p&&b(d)===b(p)?(r.classList.add("is-matched"),c.classList.add("is-matched"),s.add(r),s.add(c),r=null,i++,i===a&&(h(t,!0,"Kaikki parit oikein."),f(e,!0),m(t,e))):(c.classList.add("is-wrong"),setTimeout(()=>c.classList.remove("is-wrong"),600))}})})}var ie='<svg class="lr-feedback__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',le='<svg class="lr-feedback__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';function h(t,e,n,r={}){let s=t.querySelector("#lr-feedback");if(!s)return;let{hint:a=null,waitForClick:i=!1}=r;s.hidden=!1,s.className=`lr-feedback ${e?"is-correct lr-feedback--correct":"is-wrong lr-feedback--wrong"}`,s.setAttribute("role","status"),s.setAttribute("aria-live",e?"polite":"assertive");let c=e?n||"Hyvin meni!":n||"Melkein, yrit\xE4 uudelleen.",u=a?`<p class="lr-feedback__accent-hint">${o(a)}</p>`:"",l=i?'<button type="button" class="lr-feedback__next" id="lr-feedback-next">Seuraava \u2192</button>':"";s.innerHTML=`${e?ie:le}<div class="lr-feedback__body-wrap"><p class="lr-feedback__title ${e?"is-correct":"is-wrong"}">${e?"Oikein":"V\xE4\xE4rin"}</p><p class="lr-feedback__body">${o(c)}</p>${u}${l}</div>`,s.classList.remove("lr-feedback--animate"),s.offsetWidth,s.classList.add("lr-feedback--animate"),i&&s.querySelector("#lr-feedback-next")?.addEventListener("click",()=>{let p=t.__lrState;p&&v(t,p,!1)},{once:!0})}function ce(t,e,n){t.querySelectorAll(".lr-mc-choice").forEach(r=>{let s=Number(r.dataset.mcIdx);r.disabled=!0,s===e&&r.classList.add("is-correct"),s===n&&n!==e&&r.classList.add("is-wrong")})}function f(t,e){t.answeredInPhase+=1,e&&(t.correctInPhase+=1)}function m(t,e,n=!0){setTimeout(()=>v(t,e,!1),1100)}function v(t,e,n){let r=e.phases[e.currentPhaseIdx];if(e.currentItemIdx+=1,y(e),e.currentItemIdx>=r.items.length)return P(t,e,r,"completed");$(t,e)}function P(t,e,n,r){let s=e.answeredInPhase||n.items.length,a=Math.round(e.correctInPhase),i=s>0?e.correctInPhase/s:0,c=M(n,e.targetGrade),u=r==="skipped",l=!u&&i>=c;e.phaseResults.push({phaseId:n.phase_id,title:n.title,correct:a,total:s,pct:i,threshold:c,mastered:l,skipped:u});let d,p;u?(d="Vaihe ohitettu",p="Sanat palaavat kertaussessioon my\xF6hemmin, niit\xE4 ei j\xE4tet\xE4 unohduksiin."):l?(d="Hallitset t\xE4m\xE4n",p=`Sait ${a} / ${s} oikein, jatketaan seuraavaan vaiheeseen.`):i>=.5?(d="L\xE4hell\xE4, viel\xE4 yksi pyyhk\xE4isy",p=`${a} / ${s} oikein. Sanat joissa horjuit palaavat seuraavissa vaiheissa.`):(d="T\xE4m\xE4 kaipaa toistoa",p=`${a} / ${s} oikein. Et ole yksin, t\xE4m\xE4 rakenne vaatii toistoa, ei eri s\xE4\xE4nt\xF6\xE4.`);let _=e.currentPhaseIdx+1>=e.phases.length;t.innerHTML=`
    <div class="lr-shell lr-shell--banner">
      <div class="lr-banner ${l?"is-mastered":u?"is-skipped":"is-almost"}">
        <p class="lr-banner-eyebrow">${o(n.title||"Vaihe")}</p>
        <h2>${o(d)}</h2>
        <p>${o(p)}</p>
        <button type="button" class="btn btn-primary" id="lr-next">${_?"N\xE4yt\xE4 yhteenveto":"Seuraava vaihe \u2192"}</button>
      </div>
    </div>`,document.getElementById("lr-next")?.addEventListener("click",()=>{e.currentPhaseIdx+=1,e.currentItemIdx=0,e.correctInPhase=0,e.answeredInPhase=0,e.currentPhaseIdx>=e.phases.length?R(t,e):(y(e),$(t,e))})}function oe(t,e){if(!window.confirm("Ohita t\xE4m\xE4 vaihe? Sanat palaavat kertaussessioon my\xF6hemmin."))return;let r=e.phases[e.currentPhaseIdx];P(t,e,r,"skipped")}function R(t,e){if(e.finished)return;e.finished=!0,z(e.kurssiKey,e.lessonIndex);let n=e.phaseResults.reduce((l,d)=>l+(d.skipped?0:d.correct),0),r=e.phaseResults.reduce((l,d)=>l+(d.skipped?0:d.total),0),s=Math.max(1,Math.round((Date.now()-e.startedAt)/6e4)),a=e.targetGrade,i=de(a,e.phaseResults),c=e.lesson.meta?.yo_relevance||"",u=e.phaseResults.map(l=>{let d=l.skipped?"lr-result-skipped":l.mastered?"lr-result-mastered":"lr-result-almost",p=l.skipped?"Ohitettu":l.mastered?"Hallitset":"L\xE4hell\xE4";return`<li class="lr-result-row ${d}">
      <span class="lr-result-title">${o(l.title||"")}</span>
      <span class="lr-result-status">${p}${l.skipped?"":` \xB7 ${l.correct}/${l.total}`}</span>
    </li>`}).join("");t.innerHTML=`
    <div class="lr-shell lr-shell--results">
      <header class="lr-hero">
        <p class="lr-eyebrow">Yhteenveto</p>
        <h1>${o(e.lesson.meta?.title||"Oppitunti")}</h1>
      </header>
      <div class="lr-result-summary">
        <div class="lr-result-stat"><span class="lr-result-num">${n}/${r||0}</span><span class="lr-result-lbl">oikein</span></div>
        <div class="lr-result-stat"><span class="lr-result-num">${s}</span><span class="lr-result-lbl">min</span></div>
      </div>
      <div class="lr-tutor">${o(i)}</div>
      ${c?`<aside class="lr-yo">
        <p class="lr-yo-eyebrow">T\xE4m\xE4 YO-kokeessa</p>
        <p>${o(c)}</p>
      </aside>`:""}
      <ol class="lr-results-list">${u}</ol>
      <div class="lr-actions">
        <button type="button" class="btn btn-primary" id="lr-done">Takaisin oppimispolulle \u2192</button>
      </div>
    </div>`,document.getElementById("lr-done")?.addEventListener("click",()=>{import("./app-curriculum-ASJ5FOA2.js").then(l=>l.loadCurriculum())}),E()&&r>0&&O(`${S}/api/curriculum/${encodeURIComponent(e.kurssiKey)}/lesson/${e.lessonIndex}/complete`,{method:"POST",headers:{"Content-Type":"application/json",...A()},body:JSON.stringify({scoreCorrect:n,scoreTotal:r,wrongAnswers:[],reviewItems:[]})}).catch(()=>{})}function de(t,e){let n=e.filter(a=>a.skipped).length,r=e.filter(a=>!a.skipped&&a.mastered).length,s=e.filter(a=>!a.skipped&&!a.mastered).length;return t==="L"||t==="E"?s===0&&n===0?"L/E-tavoite vaatii ~85\u201395 % YO-kokeessa, t\xE4m\xE4n tunnin sanat ovat sinulla automaattisia. Eteenp\xE4in.":`${s} vaihe${s===1?"":"tta"} j\xE4i alle hallintarajan. L/E-tavoite ei salli horjuvia perusrakenteita, palaa n\xE4ihin huomenna kertauksessa.`:t==="I"||t==="A"?s===0&&n===0?"Hyv\xE4 alku. I/A-tavoite tarvitsee perussanaston tunnistustasolla, olet nyt siell\xE4.":"Et ole yksin. I/A-tavoitteelle riitt\xE4\xE4 tunnistus, ei kaikki sanat tarvitse olla automaattisia heti. Sanat palaavat kertauksessa.":r===e.length?"Tunti meni kuten pitikin. Jatketaan seuraavaan oppituntiin samalla rytmill\xE4.":s>0?`${s} vaihetta j\xE4i alle hallintarajan. Sanat palaavat seuraavassa kertaussessiossa, t\xE4m\xE4 on osa rytmi\xE4, ei takaisku.`:"Tunti suoritettu."}function ue(t){let e=t.lesson.side_panel?.tabs||[];if(!e.length)return"";let n=e.map((s,a)=>`
    <button type="button" class="lr-tab ${a===0?"is-active":""}" data-tab="${o(s.id)}">${o(s.title||s.id)}</button>
  `).join(""),r=e.map((s,a)=>`
    <div class="lr-tab-pane ${a===0?"is-active":""}" data-pane="${o(s.id)}">
      ${D(s.content_md||"")}
    </div>
  `).join("");return`
    <aside id="lr-side-panel" class="lr-side-panel ${t.sidePanelOpen?"is-open":""}" aria-hidden="${t.sidePanelOpen?"false":"true"}">
      <div class="lr-side-tabs" role="tablist">${n}</div>
      <div class="lr-side-panes">${r}</div>
    </aside>`}function pe(t,e){e.sidePanelOpen=!e.sidePanelOpen,e.sidePanelOpen?e.sidePanelOpenedAt=Date.now():e.sidePanelOpenedAt&&(e.sidePanelOpenMs+=Date.now()-e.sidePanelOpenedAt,e.sidePanelOpenedAt=0);let n=t.querySelector("#lr-side-panel"),r=t.querySelector("#lr-help-toggle"),s=t.querySelector(".lr-shell--exercise");s&&s.classList.toggle("has-panel-open",e.sidePanelOpen),n&&(n.classList.toggle("is-open",e.sidePanelOpen),n.setAttribute("aria-hidden",e.sidePanelOpen?"false":"true")),r&&(r.setAttribute("aria-expanded",e.sidePanelOpen?"true":"false"),r.textContent=e.sidePanelOpen?"\u2715 Sulje":"\u{1F4D6} Apua"),t.querySelectorAll(".lr-tab").forEach(a=>{a.onclick=()=>{t.querySelectorAll(".lr-tab").forEach(c=>c.classList.toggle("is-active",c===a));let i=a.dataset.tab;t.querySelectorAll(".lr-tab-pane").forEach(c=>c.classList.toggle("is-active",c.dataset.pane===i))}})}function he(t){let e=t.slice();for(let n=e.length-1;n>0;n--){let r=Math.floor(Math.random()*(n+1));[e[n],e[r]]=[e[r],e[n]]}return e}function D(t){if(!t)return"";let e=String(t).split(/\r?\n/),n=[],r=[],s=!1,a=()=>{r.length&&(n.push(`<p>${c(r.join(" "))}</p>`),r=[])},i=()=>{s&&(n.push("</ul>"),s=!1)};function c(u){let l=o(u);return l=l.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),l=l.replace(/\*([^*]+)\*/g,"<em>$1</em>"),l=l.replace(/`([^`]+)`/g,"<code>$1</code>"),l}for(let u of e){let l=u.replace(/\s+$/,"");if(/^#{1,3}\s/.test(l)){a(),i();let d=l.startsWith("### ")?3:l.startsWith("## ")?2:1;n.push(`<h${d}>${c(l.replace(/^#{1,3}\s+/,""))}</h${d}>`)}else/^\s*[-*]\s+/.test(l)?(a(),s||(n.push("<ul>"),s=!0),n.push(`<li>${c(l.replace(/^\s*[-*]\s+/,""))}</li>`)):/^\s*$/.test(l)?(a(),i()):(i(),r.push(l))}return a(),i(),n.join(`
`)}export{z as clearLessonProgress,_e as runPregeneratedLesson,y as saveLessonProgress};
//# sourceMappingURL=app-lessonRunner-DRXB24YM.js.map
