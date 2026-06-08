import{a as H,b as E,c as N,d as R}from"./app-chunk-XSJXYF7Z.js";import{b as B}from"./app-chunk-BSBZXMKL.js";import{b as q}from"./app-chunk-AE7C6F2Z.js";import{c as L}from"./app-chunk-2SASPNNN.js";import{b as M}from"./app-chunk-CTTO4TQX.js";import{a as w,c as y,e as x,j as P}from"./app-chunk-T52YLBP4.js";function F(t,e){let s=t?.mastery_threshold;return s?typeof s[e]=="number"?s[e]:s.B??.7:.7}function D(t,e){let s=t?.skip_for_targets;return Array.isArray(s)&&s.includes(e)}function g(t){return String(t||"").toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ")}function S(t,e,s="es"){let a=e||[],n=g(t);if(n&&a.some(i=>g(i)===n))return{ok:!0,hint:null};for(let i of a){let r=q(t,i,s);if(r.ok)return r}return{ok:!1,hint:null}}var I="lesson-runner-root",W="puheo:lessonProgress:";function V(t){let e=t&&typeof t.language=="string"&&t.language||"es",s=t&&t.kurssiKey?encodeURIComponent(t.kurssiKey):"",a=s?`#/oppimispolku/${e}/${s}`:`#/oppimispolku?lang=${e}`;location.hash!==a&&(location.hash=a)}var $=new Map;async function Y(t){if(!t)return[];if($.has(t))return $.get(t);try{let{API:e,isLoggedIn:s,authHeader:a,apiFetch:n}=await import("./app-api-GLA7PASW.js"),i=await n(`${e}/api/curriculum/${encodeURIComponent(t)}`,{headers:{...s()?a():{}}});if(!i.ok)return $.set(t,[]),[];let r=await i.json(),l=Array.isArray(r.lessons)?r.lessons.slice().sort((d,c)=>(d.sortOrder||0)-(c.sortOrder||0)):[];return $.set(t,l),l}catch{return[]}}function O(t){let e=Array.isArray(t.phases)?t.phases:[];if(e.length===0)return`<aside class="lr-toc" aria-label="Teht\xE4v\xE4t">
      <p class="lr-toc__head">Teht\xE4v\xE4t</p>
      <p class="lr-toc__loading">Ei vaiheita.</p>
    </aside>`;let s=t.currentPhaseIdx,a=new Set((t.phaseResults||[]).filter(i=>!i.skipped&&i.mastered).map(i=>i.phaseId));return`<aside class="lr-toc" aria-label="Teht\xE4v\xE4t">
    <p class="lr-toc__head">Teht\xE4v\xE4t</p>
    <ol class="lr-toc__list">${e.map((i,r)=>{let l=r===s,d=a.has(i.phase_id)&&!l,c=["lr-toc__item",l?"is-current":"",d?"is-done":""].filter(Boolean).join(" "),o=l?"\u2192":d?"\u2713":"",p=i.title||`Vaihe ${r+1}`;return`<li class="${c}" data-phase="${r}" ${l?"":'tabindex="0"'}>
      <span class="lr-toc__num">${r+1}</span>
      <span class="lr-toc__title">${u(p)}</span>
      <span class="lr-toc__mark" aria-hidden="true">${o}</span>
    </li>`}).join("")}</ol>
  </aside>`}function C(t,e){t.querySelectorAll(".lr-toc__item:not(.is-current)").forEach(s=>{let a=()=>{let n=Number(s.dataset.phase);!Number.isFinite(n)||n===e.currentPhaseIdx||(b(e),e.currentPhaseIdx=n,e.currentItemIdx=0,e.correctInPhase=0,e.answeredInPhase=0,b(e),v(t,e))};s.addEventListener("click",a),s.addEventListener("keydown",n=>{(n.key==="Enter"||n.key===" ")&&(n.preventDefault(),a())})})}function z(t){let e=t.lesson.meta||{},s=e.kurssi_title||e.course_title||e.course_key||"Kurssi",a=e.lesson_index||t.lessonIndex,n=e.title||"Oppitunti";return`<nav class="lr-breadcrumb" aria-label="Sijainti">
    <a class="lr-breadcrumb__link" href="#/oppimispolku" id="lr-breadcrumb-path">Oppimispolku</a>
    <span class="lr-breadcrumb__sep" aria-hidden="true">/</span>
    <span class="lr-breadcrumb__crumb">${u(s)}</span>
    <span class="lr-breadcrumb__sep" aria-hidden="true">/</span>
    <span class="lr-breadcrumb__crumb is-current" aria-current="page">${u(`${a}. ${n}`)}</span>
  </nav>`}function j(t,e){return`${W}${t}:${e}`}function b(t){if(!(!t||!t.kurssiKey||t.finished)&&!(t.currentPhaseIdx===0&&t.currentItemIdx===0&&t.answeredInPhase===0))try{sessionStorage.setItem(j(t.kurssiKey,t.lessonIndex),JSON.stringify({currentPhaseIdx:t.currentPhaseIdx,currentItemIdx:t.currentItemIdx,correctInPhase:t.correctInPhase,answeredInPhase:t.answeredInPhase,phaseResults:t.phaseResults,targetGrade:t.targetGrade,phaseSignature:t.phases.map(e=>`${e.phase_id}:${e.items.length}`).join("|"),savedAt:Date.now()}))}catch{}}function G(t,e,s){try{let a=sessionStorage.getItem(j(t,e));if(!a)return null;let n=JSON.parse(a);if(!n||typeof n!="object")return null;let i=s.phases.map(r=>`${r.phase_id}:${r.items.length}`).join("|");return n.phaseSignature!==i||n.savedAt&&Date.now()-n.savedAt>1440*60*1e3?null:n}catch{return null}}function Q(t,e){try{sessionStorage.removeItem(j(t,e))}catch{}}function u(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function X(t,e,s,a){let n=(t.phases||[]).filter(i=>!D(i,e));return{lesson:t,kurssiKey:s,lessonIndex:a,targetGrade:e,language:typeof L.language=="string"&&L.language||"es",phases:n,currentPhaseIdx:0,currentItemIdx:0,correctInPhase:0,answeredInPhase:0,gradedItems:[],phaseResults:[],sidePanelOpen:!1,sidePanelOpenMs:0,sidePanelOpenedAt:0,startedAt:Date.now(),finished:!1}}async function Z(t){try{let e=await P(`${w}/api/curriculum/review-queue?lang=${encodeURIComponent(t||"es")}&limit=8`,{headers:{...x()}});if(!e||!e.ok)return null;let s=await e.json();return s&&!s.locked&&Array.isArray(s.items)&&s.items.length?s:null}catch{return null}}async function ee(t){try{if(typeof y=="function"&&!y())return;let e=await Promise.race([Z(t.language),new Promise(s=>setTimeout(()=>s(null),1500))]);e&&Array.isArray(e.items)&&e.items.length&&(t.phases=[R(e),...t.phases])}catch{}}async function Ce(t,e,s,a){let n=t.pregenerated||t;te(),M("screen-lesson");let i=document.getElementById(I);if(!i)return;let r=X(n,a||"B",e,s);try{sessionStorage.setItem("currentLesson",JSON.stringify({kurssiKey:e,lessonIndex:s,lessonFocus:n.meta?.title||"",lessonType:n.meta?.lesson_type||"",targetGrade:r.targetGrade,isPregenerated:!0}));let d=n.teaching||{},c=String(d.intro_md||"").trim(),o=Array.isArray(d.key_points)?d.key_points:[],p=[c,o.length?`## Avainkohdat
`+o.map(h=>`- ${h}`).join(`
`):""].filter(Boolean).join(`

`);p?sessionStorage.setItem("currentLessonTeachingMd",p):sessionStorage.removeItem("currentLessonTeachingMd")}catch{}r._courseLessons=[],Y(e).then(d=>{r._courseLessons=d;let c=document.querySelector(".lr-shell .lr-toc");if(c&&c.parentElement){let o=document.createElement("div");o.innerHTML=O(r),c.parentElement.replaceChild(o.firstElementChild,c),C(document.getElementById(I),r)}}),await ee(r);let l=G(e,s,r);if(l){r.currentPhaseIdx=l.currentPhaseIdx,r.currentItemIdx=l.currentItemIdx,r.correctInPhase=l.correctInPhase||0,r.answeredInPhase=l.answeredInPhase||0,r.phaseResults=Array.isArray(l.phaseResults)?l.phaseResults:[],r.startedAt=Date.now(),v(i,r);return}se(i,r)}function te(){let t=document.getElementById("screen-lesson");t||(t=document.createElement("div"),t.id="screen-lesson",t.className="screen",document.querySelector(".app-main")?.appendChild(t)||document.body.appendChild(t)),document.getElementById(I)||(t.innerHTML=`<div id="${I}"></div>`)}function se(t,e){let s=e.lesson.meta||{},a=e.lesson.teaching||{},n=U(a.intro_md||""),i=Array.isArray(a.key_points)?a.key_points:[],r=i.length?`<ul class="lr-keypoints">${i.map(l=>`<li>${u(l)}</li>`).join("")}</ul>`:"";t.innerHTML=`
    <div class="lr-shell lr-shell--teaching lr-shell--three">
      ${z(e)}
      <button type="button" class="lr-back" id="lr-back">\u2190 Oppimispolku</button>
      ${O(e)}
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
    </div>`,C(t,e),document.getElementById("lr-back")?.addEventListener("click",()=>{V(e)}),document.getElementById("lr-start")?.addEventListener("click",()=>{e.startedAt=Date.now(),v(t,e)})}function v(t,e){let s=e.phases[e.currentPhaseIdx];if(!s)return J(t,e);let a=e.phases.length,n=ne(e),i=s.items[e.currentItemIdx];if(!i)return T(t,e,s,"completed");t.innerHTML=`
    <div class="lr-shell lr-shell--exercise lr-shell--three">
      ${z(e)}
      <div class="lr-topbar">
        <button type="button" class="lr-exit-btn" id="lr-exit-lesson" aria-label="Takaisin oppimispolulle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          <span>Oppimispolku</span>
        </button>
        <div class="lr-topbar-progress">
          <span class="lr-step-label">Vaihe ${e.currentPhaseIdx+1} / ${a}</span>
          ${n}
        </div>
        <div class="lr-topbar-actions">
          <button type="button" class="lr-help-btn" id="lr-help-toggle" aria-expanded="${e.sidePanelOpen?"true":"false"}" aria-controls="lr-side-panel">\u{1F4D6} Apua</button>
          <button type="button" class="lr-skip-btn" id="lr-skip">Olen valmis t\xE4st\xE4</button>
        </div>
      </div>
      ${O(e)}
      <header class="lr-phase-head">
        <h2 class="lr-phase-title">${u(s.title||"Vaihe")}</h2>
        ${s.instruction?`<p class="lr-phase-instr">${u(s.instruction)}</p>`:""}
        <p class="lr-item-counter">Kysymys ${e.currentItemIdx+1} / ${s.items.length}</p>
      </header>
      <div class="lr-item" id="lr-item">${re(i,e)}</div>
      ${be(e)}
    </div>`,ue(t,e,i),C(t,e)}function ne(t){return`<span class="lr-stepper" aria-hidden="true">${t.phases.map((s,a)=>a<t.currentPhaseIdx?'<span class="lr-step lr-step--done" aria-hidden="true">\u25CF</span>':a===t.currentPhaseIdx?'<span class="lr-step lr-step--current" aria-hidden="true">\u25CF</span>':'<span class="lr-step" aria-hidden="true">\u25CB</span>').join("")}</span>`}function re(t,e){switch(t.item_type){case"mc":return ae(t);case"typed":return K(t);case"translate":return ie(t);case"match":return le(t);case"gap_fill":return ce(t);case"writing":return oe(t);case"reading_mc":return de(t);default:return`<p class="lr-unsupported">Teht\xE4v\xE4tyyppi\xE4 "${u(t.item_type||"?")}" ei tueta, ohitetaan.</p>
        <button type="button" class="btn btn-primary" data-lr-skip-item>Jatka</button>`}}function ae(t){return`
    <div class="lr-mc">
      ${t.context?`<p class="lr-mc-context">${u(t.context)}</p>`:""}
      <p class="lr-mc-stem">${u(t.stem||"")}</p>
      <div class="lr-mc-choices" role="radiogroup">
        ${(t.choices||[]).map((s,a)=>`
          <button type="button" class="lr-mc-choice" data-mc-idx="${a}" role="radio" aria-checked="false">${u(s)}</button>
        `).join("")}
      </div>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function K(t){return`
    <div class="lr-typed">
      <p class="lr-typed-dir">${t.direction==="es_to_fi"?"K\xE4\xE4nn\xE4 suomeksi":"K\xE4\xE4nn\xE4 espanjaksi"}</p>
      <p class="lr-typed-prompt">${u(t.prompt||"")}</p>
      ${t.hint?`<p class="lr-typed-hint">Vihje: ${u(t.hint)}</p>`:""}
      <input type="text" class="lr-typed-input" id="lr-typed-input" autocomplete="off" autocapitalize="off" spellcheck="false" />
      <button type="button" class="btn btn-primary" id="lr-typed-submit">Tarkista</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function ie(t){return K({...t,prompt:t.source})}function le(t){let e=(t.pairs||[]).map(a=>a.left),s=ye((t.pairs||[]).map(a=>a.right));return`
    <div class="lr-match" data-match>
      <p class="lr-match-instr">Yhdist\xE4 parit klikkaamalla.</p>
      <div class="lr-match-cols">
        <div class="lr-match-col">
          ${e.map((a,n)=>`<button type="button" class="lr-match-cell" data-side="left" data-idx="${n}">${u(a)}</button>`).join("")}
        </div>
        <div class="lr-match-col">
          ${s.map(a=>`<button type="button" class="lr-match-cell" data-side="right" data-val="${u(a)}">${u(a)}</button>`).join("")}
        </div>
      </div>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function ce(t){let e=t.sentence_template||"",s=(t.answers||t.accepts||[]).reduce((r,l)=>Math.max(r,String(l||"").length),8),a=Math.min(Math.max(s,6),18),n=u(e).replace(/\{(\d+)\}/g,(r,l)=>`<input type="text" class="lr-gap-input" data-gap="${l}" size="${a}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="T\xE4yt\xE4 kohta ${l}" />`),i=Array.isArray(t.word_bank)&&t.word_bank.length?`<div class="lr-gap-bank" role="group" aria-label="Sanapankki">
        ${t.word_bank.map(r=>`<button type="button" class="lr-gap-chip" data-word="${u(r)}">${u(r)}</button>`).join("")}
       </div>`:"";return`
    <div class="lr-gap">
      <p class="lr-gap-sentence">${n}</p>
      ${i}
      <button type="button" class="btn btn-primary" id="lr-gap-submit">Tarkista</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function oe(t){let e=Number(t.min_chars)||E(t.min_words),s=Number(t.max_chars)||E(t.max_words);return`
    <div class="lr-writing">
      <p class="lr-writing-prompt">${u(t.prompt||"")}</p>
      <textarea class="lr-writing-input" id="lr-writing-input"
                data-min-chars="${e}" data-max-chars="${s}"
                rows="8"></textarea>
      <p class="lr-writing-char-counter" id="lr-writing-char-counter">0 / ${e}\u2013${s} merkki\xE4</p>
      <button type="button" class="btn btn-primary" id="lr-writing-submit">L\xE4het\xE4</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function de(t){let e=u(t.passage||"").replace(/\n/g,"<br>"),s=(t.questions||[]).map((a,n)=>`
    <fieldset class="lr-reading-q" data-q="${n}">
      <legend>${u(a.question_fi||"")}</legend>
      ${(a.choices||[]).map((i,r)=>`
        <label class="lr-reading-choice"><input type="radio" name="lr-q-${n}" value="${r}"> ${u(i)}</label>
      `).join("")}
    </fieldset>
  `).join("");return`
    <div class="lr-reading">
      <article class="lr-reading-passage">${e}</article>
      <div class="lr-reading-qs">${s}</div>
      <button type="button" class="btn btn-primary" id="lr-reading-submit">Tarkista vastaukset</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function ue(t,e,s){t.__lrState=e,B(t,e.language),document.getElementById("lr-help-toggle")?.addEventListener("click",()=>ve(t,e)),document.getElementById("lr-skip")?.addEventListener("click",()=>ge(t,e)),document.getElementById("lr-exit-lesson")?.addEventListener("click",async()=>{b(e),location.hash="#/aloitus"}),t.querySelector("[data-lr-skip-item]")?.addEventListener("click",()=>_(t,e,!0));let a=typeof e.language=="string"&&e.language||"es";if(s.item_type==="mc")t.querySelectorAll(".lr-mc-choice").forEach(n=>{n.addEventListener("click",()=>{let i=Number(n.dataset.mcIdx),r=i===Number(s.correct_index);m(t,r,s.explanation||"",{hint:null,waitForClick:!r}),fe(t,s.correct_index,i),k(e,r),A(e,s,r,s.choices?.[i],s.choices?.[Number(s.correct_index)]),r&&f(t,e)})});else if(s.item_type==="typed"||s.item_type==="translate"){let n=document.getElementById("lr-typed-input"),i=document.getElementById("lr-typed-submit"),r=()=>{let l=s.accept||[],{ok:d,hint:c}=S(n.value,l,a),o=l[0]||"";m(t,d,d?"":`Oikea vastaus: ${o}`,{hint:c,waitForClick:!d}),k(e,d),A(e,s,d,n.value,o),d&&f(t,e)};i?.addEventListener("click",r),n?.addEventListener("keydown",l=>{l.key==="Enter"&&r()}),n?.focus()}else if(s.item_type==="match")pe(t,e,s);else if(s.item_type==="gap_fill"){let n=null,i=t.querySelectorAll(".lr-gap-input");i.forEach(r=>{r.addEventListener("focus",()=>{n=r})}),i[0]?.focus(),t.querySelectorAll(".lr-gap-chip").forEach(r=>{r.addEventListener("click",()=>{let l=r.dataset.word||r.textContent||"",d=n&&n.value===""?n:Array.from(i).find(c=>!c.value)||n||i[0];d&&(d.value=l,d.classList.add("is-filled"),r.classList.add("is-used"),(Array.from(i).find(o=>!o.value)||d).focus())})}),i.forEach(r=>{r.addEventListener("input",()=>{r.classList.toggle("is-filled",!!r.value),t.querySelectorAll(".lr-gap-chip.is-used").forEach(l=>{let d=l.dataset.word||l.textContent||"",c=Array.from(i).some(o=>o.value===d);l.classList.toggle("is-used",c)})})}),document.getElementById("lr-gap-submit")?.addEventListener("click",()=>{let r=!0,l=[],d=null;i.forEach((c,o)=>{let p=s.answers&&s.answers[o]||[],h=S(c.value,p,a);h.ok||(r=!1),h.hint&&!d&&(d=h.hint),l.push(p[0]||"?"),c.classList.toggle("is-wrong",!h.ok),c.classList.toggle("is-correct",h.ok)}),m(t,r,r?"":`Oikeat vastaukset: ${l.join(", ")}`,{hint:d,waitForClick:!r}),k(e,r),A(e,s,r,null,l.join(", ")),r&&f(t,e)})}else if(s.item_type==="writing"){let n=document.getElementById("lr-writing-input"),i=document.getElementById("lr-writing-char-counter"),r=Number(n?.dataset.minChars)||0,l=Number(n?.dataset.maxChars)||0;n&&i&&H(n,i,{minChars:r,maxChars:l}),document.getElementById("lr-writing-submit")?.addEventListener("click",()=>{let c=(n?.value||"").length,o=c>=r,p=o?"Kirjoituksesi on tallennettu.":`Merkkim\xE4\xE4r\xE4 on ${c}, tavoite v\xE4hint\xE4\xE4n ${r} merkki\xE4. Jatka kirjoitusta.`;m(t,o,p,{hint:null,waitForClick:!o}),k(e,o),o&&f(t,e)})}else s.item_type==="reading_mc"&&document.getElementById("lr-reading-submit")?.addEventListener("click",()=>{let n=0,i=(s.questions||[]).length;(s.questions||[]).forEach((l,d)=>{let c=t.querySelector(`input[name="lr-q-${d}"]:checked`);c&&Number(c.value)===Number(l.correct_index)&&n++});let r=n===i;m(t,r,r?"Kaikki oikein.":`${n}/${i} oikein.`),e.correctInPhase+=n/i,e.answeredInPhase+=1,f(t,e,!1)})}function pe(t,e,s){let a=null,n=new Set,i=(s.pairs||[]).length,r=0;t.querySelectorAll(".lr-match-cell").forEach(l=>{l.addEventListener("click",()=>{if(n.has(l))return;if(l.dataset.side==="left")t.querySelectorAll('.lr-match-cell[data-side="left"]').forEach(c=>c.classList.remove("is-active")),l.classList.add("is-active"),a=l;else if(a){let c=Number(a.dataset.idx),o=s.pairs[c]?.right,p=l.dataset.val;o&&p&&g(o)===g(p)?(a.classList.add("is-matched"),l.classList.add("is-matched"),n.add(a),n.add(l),a=null,r++,r===i&&(m(t,!0,"Kaikki parit oikein."),k(e,!0),f(t,e))):(l.classList.add("is-wrong"),setTimeout(()=>l.classList.remove("is-wrong"),600))}})})}var he='<svg class="lr-feedback__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',me='<svg class="lr-feedback__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';function m(t,e,s,a={}){let n=t.querySelector("#lr-feedback");if(!n)return;let{hint:i=null,waitForClick:r=!1}=a;n.hidden=!1,n.className=`lr-feedback ${e?"is-correct lr-feedback--correct":"is-wrong lr-feedback--wrong"}`,n.setAttribute("role","status"),n.setAttribute("aria-live",e?"polite":"assertive");let l=e?s||"Hyvin meni!":s||"Melkein, yrit\xE4 uudelleen.",d=i?`<p class="lr-feedback__accent-hint">${u(i)}</p>`:"",c=r?'<button type="button" class="lr-feedback__next" id="lr-feedback-next">Seuraava \u2192</button>':"";n.innerHTML=`${e?he:me}<div class="lr-feedback__body-wrap"><p class="lr-feedback__title ${e?"is-correct":"is-wrong"}">${e?"Oikein":"V\xE4\xE4rin"}</p><p class="lr-feedback__body">${u(l)}</p>${d}${c}</div>`,n.classList.remove("lr-feedback--animate"),n.offsetWidth,n.classList.add("lr-feedback--animate"),r&&n.querySelector("#lr-feedback-next")?.addEventListener("click",()=>{let p=t.__lrState;p&&_(t,p,!1)},{once:!0})}function fe(t,e,s){t.querySelectorAll(".lr-mc-choice").forEach(a=>{let n=Number(a.dataset.mcIdx);a.disabled=!0,n===e&&a.classList.add("is-correct"),n===s&&s!==e&&a.classList.add("is-wrong")})}function k(t,e){t.answeredInPhase+=1,e&&(t.correctInPhase+=1)}function A(t,e,s,a,n){if(!e)return;let i=t.phases[t.currentPhaseIdx]||{},r=String(e.prompt||e.source||e.stem||e.sentence_template||e.question||i.title||"").trim().slice(0,300);r&&t.gradedItems.push({itemType:e.item_type||"unknown",correct:!!s,question:r,studentAnswer:a!=null?String(a).slice(0,200):"",correctAnswer:n!=null?String(n).slice(0,200):"",explanation:String(e.explanation||"").slice(0,300),phaseType:i.phase_type||"",topics:Array.isArray(e.topics)&&e.topics.length?e.topics.slice(0,3):e._concept?[e._concept]:[]})}function f(t,e,s=!0){setTimeout(()=>_(t,e,!1),1100)}function _(t,e,s){let a=e.phases[e.currentPhaseIdx];if(e.currentItemIdx+=1,b(e),e.currentItemIdx>=a.items.length)return T(t,e,a,"completed");v(t,e)}function T(t,e,s,a){let n=e.answeredInPhase||s.items.length,i=Math.round(e.correctInPhase),r=n>0?e.correctInPhase/n:0,l=F(s,e.targetGrade),d=a==="skipped",c=!d&&r>=l;e.phaseResults.push({phaseId:s.phase_id,title:s.title,correct:i,total:n,pct:r,threshold:l,mastered:c,skipped:d});let o,p;d?(o="Vaihe ohitettu",p="Sanat palaavat kertaussessioon my\xF6hemmin, niit\xE4 ei j\xE4tet\xE4 unohduksiin."):c?(o="Hallitset t\xE4m\xE4n",p=`Sait ${i} / ${n} oikein, jatketaan seuraavaan vaiheeseen.`):r>=.5?(o="L\xE4hell\xE4, viel\xE4 yksi pyyhk\xE4isy",p=`${i} / ${n} oikein. Sanat joissa horjuit palaavat seuraavissa vaiheissa.`):(o="T\xE4m\xE4 kaipaa toistoa",p=`${i} / ${n} oikein. Et ole yksin, t\xE4m\xE4 rakenne vaatii toistoa, ei eri s\xE4\xE4nt\xF6\xE4.`);let h=e.currentPhaseIdx+1>=e.phases.length;t.innerHTML=`
    <div class="lr-shell lr-shell--banner">
      <div class="lr-banner ${c?"is-mastered":d?"is-skipped":"is-almost"}">
        <p class="lr-banner-eyebrow">${u(s.title||"Vaihe")}</p>
        <h2>${u(o)}</h2>
        <p>${u(p)}</p>
        <button type="button" class="btn btn-primary" id="lr-next">${h?"N\xE4yt\xE4 yhteenveto":"Seuraava vaihe \u2192"}</button>
      </div>
    </div>`,document.getElementById("lr-next")?.addEventListener("click",()=>{e.currentPhaseIdx+=1,e.currentItemIdx=0,e.correctInPhase=0,e.answeredInPhase=0,e.currentPhaseIdx>=e.phases.length?J(t,e):(b(e),v(t,e))})}function ge(t,e){if(!window.confirm("Ohita t\xE4m\xE4 vaihe? Sanat palaavat kertaussessioon my\xF6hemmin."))return;let a=e.phases[e.currentPhaseIdx];T(t,e,a,"skipped")}function J(t,e){if(e.finished)return;e.finished=!0,Q(e.kurssiKey,e.lessonIndex);let s=e.phaseResults.filter(o=>o.phaseId!==N),a=s.reduce((o,p)=>o+(p.skipped?0:p.correct),0),n=s.reduce((o,p)=>o+(p.skipped?0:p.total),0),i=Math.max(1,Math.round((Date.now()-e.startedAt)/6e4)),r=e.targetGrade,l=ke(r,e.phaseResults),d=e.lesson.meta?.yo_relevance||"",c=e.phaseResults.map(o=>{let p=o.skipped?"lr-result-skipped":o.mastered?"lr-result-mastered":"lr-result-almost",h=o.skipped?"Ohitettu":o.mastered?"Hallitset":"L\xE4hell\xE4";return`<li class="lr-result-row ${p}">
      <span class="lr-result-title">${u(o.title||"")}</span>
      <span class="lr-result-status">${h}${o.skipped?"":` \xB7 ${o.correct}/${o.total}`}</span>
    </li>`}).join("");t.innerHTML=`
    <div class="lr-shell lr-shell--results">
      <header class="lr-hero">
        <p class="lr-eyebrow">Yhteenveto</p>
        <h1>${u(e.lesson.meta?.title||"Oppitunti")}</h1>
      </header>
      <div class="lr-result-summary">
        <div class="lr-result-stat"><span class="lr-result-num">${a}/${n||0}</span><span class="lr-result-lbl">oikein</span></div>
        <div class="lr-result-stat"><span class="lr-result-num">${i}</span><span class="lr-result-lbl">min</span></div>
      </div>
      <div class="lr-tutor">${u(l)}</div>
      ${d?`<aside class="lr-yo">
        <p class="lr-yo-eyebrow">T\xE4m\xE4 YO-kokeessa</p>
        <p>${u(d)}</p>
      </aside>`:""}
      <ol class="lr-results-list">${c}</ol>
      <div class="lr-actions">
        <button type="button" class="btn btn-primary" id="lr-done">Takaisin oppimispolulle \u2192</button>
      </div>
    </div>`,document.getElementById("lr-done")?.addEventListener("click",()=>{V(e)}),y()&&n>0&&P(`${w}/api/curriculum/${encodeURIComponent(e.kurssiKey)}/lesson/${e.lessonIndex}/complete`,{method:"POST",headers:{"Content-Type":"application/json",...x()},body:JSON.stringify({lang:typeof e.language=="string"&&e.language||"es",scoreCorrect:a,scoreTotal:n,wrongAnswers:[],reviewItems:[],gradedItems:e.gradedItems.slice(0,80)})}).catch(()=>{})}function ke(t,e){let s=e.filter(i=>i.skipped).length,a=e.filter(i=>!i.skipped&&i.mastered).length,n=e.filter(i=>!i.skipped&&!i.mastered).length;return t==="L"||t==="E"?n===0&&s===0?"L/E-tavoite vaatii ~85\u201395 % YO-kokeessa, t\xE4m\xE4n tunnin sanat ovat sinulla automaattisia. Eteenp\xE4in.":`${n} vaihe${n===1?"":"tta"} j\xE4i alle hallintarajan. L/E-tavoite ei salli horjuvia perusrakenteita, palaa n\xE4ihin huomenna kertauksessa.`:t==="I"||t==="A"?n===0&&s===0?"Hyv\xE4 alku. I/A-tavoite tarvitsee perussanaston tunnistustasolla, olet nyt siell\xE4.":"Et ole yksin. I/A-tavoitteelle riitt\xE4\xE4 tunnistus, ei kaikki sanat tarvitse olla automaattisia heti. Sanat palaavat kertauksessa.":a===e.length?"Tunti meni kuten pitikin. Jatketaan seuraavaan oppituntiin samalla rytmill\xE4.":n>0?`${n} vaihetta j\xE4i alle hallintarajan. Sanat palaavat seuraavassa kertaussessiossa, t\xE4m\xE4 on osa rytmi\xE4, ei takaisku.`:"Tunti suoritettu."}function be(t){let e=t.lesson.side_panel?.tabs||[];if(!e.length)return"";let s=e.map((n,i)=>`
    <button type="button" class="lr-tab ${i===0?"is-active":""}" data-tab="${u(n.id)}">${u(n.title||n.id)}</button>
  `).join(""),a=e.map((n,i)=>`
    <div class="lr-tab-pane ${i===0?"is-active":""}" data-pane="${u(n.id)}">
      ${U(n.content_md||"")}
    </div>
  `).join("");return`
    <aside id="lr-side-panel" class="lr-side-panel ${t.sidePanelOpen?"is-open":""}" aria-hidden="${t.sidePanelOpen?"false":"true"}">
      <div class="lr-side-tabs" role="tablist">${s}</div>
      <div class="lr-side-panes">${a}</div>
    </aside>`}function ve(t,e){e.sidePanelOpen=!e.sidePanelOpen,e.sidePanelOpen?e.sidePanelOpenedAt=Date.now():e.sidePanelOpenedAt&&(e.sidePanelOpenMs+=Date.now()-e.sidePanelOpenedAt,e.sidePanelOpenedAt=0);let s=t.querySelector("#lr-side-panel"),a=t.querySelector("#lr-help-toggle"),n=t.querySelector(".lr-shell--exercise");n&&n.classList.toggle("has-panel-open",e.sidePanelOpen),s&&(s.classList.toggle("is-open",e.sidePanelOpen),s.setAttribute("aria-hidden",e.sidePanelOpen?"false":"true")),a&&(a.setAttribute("aria-expanded",e.sidePanelOpen?"true":"false"),a.textContent=e.sidePanelOpen?"\u2715 Sulje":"\u{1F4D6} Apua"),t.querySelectorAll(".lr-tab").forEach(i=>{i.onclick=()=>{t.querySelectorAll(".lr-tab").forEach(l=>l.classList.toggle("is-active",l===i));let r=i.dataset.tab;t.querySelectorAll(".lr-tab-pane").forEach(l=>l.classList.toggle("is-active",l.dataset.pane===r))}})}function ye(t){let e=t.slice();for(let s=e.length-1;s>0;s--){let a=Math.floor(Math.random()*(s+1));[e[s],e[a]]=[e[a],e[s]]}return e}function U(t){if(!t)return"";let e=String(t).split(/\r?\n/),s=[],a=[],n=!1,i=()=>{a.length&&(s.push(`<p>${l(a.join(" "))}</p>`),a=[])},r=()=>{n&&(s.push("</ul>"),n=!1)};function l(d){let c=u(d);return c=c.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),c=c.replace(/\*([^*]+)\*/g,"<em>$1</em>"),c=c.replace(/`([^`]+)`/g,"<code>$1</code>"),c}for(let d of e){let c=d.replace(/\s+$/,"");if(/^#{1,3}\s/.test(c)){i(),r();let o=c.startsWith("### ")?3:c.startsWith("## ")?2:1;s.push(`<h${o}>${l(c.replace(/^#{1,3}\s+/,""))}</h${o}>`)}else/^\s*[-*]\s+/.test(c)?(i(),n||(s.push("<ul>"),n=!0),s.push(`<li>${l(c.replace(/^\s*[-*]\s+/,""))}</li>`)):/^\s*$/.test(c)?(i(),r()):(r(),a.push(c))}return i(),r(),s.join(`
`)}export{Q as clearLessonProgress,Ce as runPregeneratedLesson,b as saveLessonProgress};
//# sourceMappingURL=app-lessonRunner-VRZXLNTG.js.map
