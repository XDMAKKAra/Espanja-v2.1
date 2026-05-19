import{a as A,c as O}from"./app-chunk-XOCPMIVD.js";import{a as P,c as _,e as L,j as S}from"./app-chunk-4KWIHVIN.js";import{b as E}from"./app-chunk-3WC2U67L.js";function j(e,t){let n=e?.mastery_threshold;return n?typeof n[t]=="number"?n[t]:n.B??.7:.7}function C(e,t){let n=e?.skip_for_targets;return Array.isArray(n)&&n.includes(t)}function T(e,t,{minChars:n=0,maxChars:r=0}={}){if(!e||!t)return{stop(){}};let s=n||r?`${n}\u2013${r}`:"";function a(){let i=(e.value||"").length;t.textContent=s?`${i} / ${s} merkki\xE4`:`${i} merkki\xE4`,t.classList.toggle("is-met",n>0&&i>=n),t.classList.toggle("is-too-long",r>0&&i>r)}return e.addEventListener("input",a),a(),{stop(){e.removeEventListener("input",a)}}}function y(e){return Math.round((e||0)*6)}var $="lesson-runner-root",N="puheo:lessonProgress:";function I(e,t){return`${N}${e}:${t}`}function w(e){if(!(!e||!e.kurssiKey||e.finished)&&!(e.currentPhaseIdx===0&&e.currentItemIdx===0&&e.answeredInPhase===0))try{sessionStorage.setItem(I(e.kurssiKey,e.lessonIndex),JSON.stringify({currentPhaseIdx:e.currentPhaseIdx,currentItemIdx:e.currentItemIdx,correctInPhase:e.correctInPhase,answeredInPhase:e.answeredInPhase,phaseResults:e.phaseResults,targetGrade:e.targetGrade,phaseSignature:e.phases.map(t=>`${t.phase_id}:${t.items.length}`).join("|"),savedAt:Date.now()}))}catch{}}function R(e,t,n){try{let r=sessionStorage.getItem(I(e,t));if(!r)return null;let s=JSON.parse(r);if(!s||typeof s!="object")return null;let a=n.phases.map(i=>`${i.phase_id}:${i.items.length}`).join("|");return s.phaseSignature!==a||s.savedAt&&Date.now()-s.savedAt>1440*60*1e3?null:s}catch{return null}}function F(e,t){try{sessionStorage.removeItem(I(e,t))}catch{}}function o(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function k(e){return String(e||"").toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ")}function M(e,t,n="es"){let r=t||[],s=k(e);if(s&&r.some(a=>k(a)===s))return{ok:!0,hint:null};for(let a of r){let i=A(e,a,n);if(i.ok)return i}return{ok:!1,hint:null}}function D(e,t,n,r){let s=(e.phases||[]).filter(a=>!C(a,t));return{lesson:e,kurssiKey:n,lessonIndex:r,targetGrade:t,phases:s,currentPhaseIdx:0,currentItemIdx:0,correctInPhase:0,answeredInPhase:0,phaseResults:[],sidePanelOpen:!1,sidePanelOpenMs:0,sidePanelOpenedAt:0,startedAt:Date.now(),finished:!1}}function ge(e,t,n,r){let s=e.pregenerated||e;K(),E("screen-lesson");let a=document.getElementById($);if(!a)return;let i=D(s,r||"B",t,n);try{sessionStorage.setItem("currentLesson",JSON.stringify({kurssiKey:t,lessonIndex:n,lessonFocus:s.meta?.title||"",lessonType:s.meta?.lesson_type||"",targetGrade:i.targetGrade,isPregenerated:!0}));let u=s.teaching||{},c=String(u.intro_md||"").trim(),d=Array.isArray(u.key_points)?u.key_points:[],p=[c,d.length?`## Avainkohdat
`+d.map(b=>`- ${b}`).join(`
`):""].filter(Boolean).join(`

`);p?sessionStorage.setItem("currentLessonTeachingMd",p):sessionStorage.removeItem("currentLessonTeachingMd")}catch{}let l=R(t,n,i);if(l){i.currentPhaseIdx=l.currentPhaseIdx,i.currentItemIdx=l.currentItemIdx,i.correctInPhase=l.correctInPhase||0,i.answeredInPhase=l.answeredInPhase||0,i.phaseResults=Array.isArray(l.phaseResults)?l.phaseResults:[],i.startedAt=Date.now(),v(a,i);return}J(a,i)}function K(){let e=document.getElementById("screen-lesson");e||(e=document.createElement("div"),e.id="screen-lesson",e.className="screen",document.querySelector(".app-main")?.appendChild(e)||document.body.appendChild(e)),document.getElementById($)||(e.innerHTML=`<div id="${$}"></div>`)}function J(e,t){let n=t.lesson.meta||{},r=t.lesson.teaching||{},s=H(r.intro_md||""),a=Array.isArray(r.key_points)?r.key_points:[],i=a.length?`<ul class="lr-keypoints">${a.map(l=>`<li>${o(l)}</li>`).join("")}</ul>`:"";e.innerHTML=`
    <div class="lr-shell">
      <button type="button" class="lr-back" id="lr-back">\u2190 Oppimispolku</button>
      <header class="lr-hero">
        <p class="lr-eyebrow">${o(n.course_key||"")} \xB7 Oppitunti ${o(String(n.lesson_index||""))}</p>
        <h1>${o(n.title||"Oppitunti")}</h1>
        ${n.description?`<p class="lr-desc">${o(n.description)}</p>`:""}
      </header>
      <article class="lr-teaching">${s}${i}</article>
      <div class="lr-actions">
        <button type="button" class="btn btn-primary" id="lr-start">Aloita harjoittelu \u2192</button>
        <p class="lr-hint">Voit avata Apua-paneelin milloin tahansa harjoituksen aikana.</p>
      </div>
    </div>`,document.getElementById("lr-back")?.addEventListener("click",()=>{import("./app-curriculum-3QMLUVEJ.js").then(l=>l.loadCurriculum())}),document.getElementById("lr-start")?.addEventListener("click",()=>{t.startedAt=Date.now(),v(e,t)})}function v(e,t){let n=t.phases[t.currentPhaseIdx];if(!n)return q(e,t);let r=t.phases.length,s=V(t),a=n.items[t.currentItemIdx];if(!a)return x(e,t,n,"completed");e.innerHTML=`
    <div class="lr-shell lr-shell--exercise">
      <div class="lr-topbar">
        <button type="button" class="lr-exit-btn" id="lr-exit-lesson" aria-label="Takaisin oppimispolulle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          <span>Oppimispolku</span>
        </button>
        <div class="lr-topbar-progress">
          <span class="lr-step-label">Vaihe ${t.currentPhaseIdx+1} / ${r}</span>
          ${s}
        </div>
        <div class="lr-topbar-actions">
          <button type="button" class="lr-help-btn" id="lr-help-toggle" aria-expanded="${t.sidePanelOpen?"true":"false"}" aria-controls="lr-side-panel">\u{1F4D6} Apua</button>
          <button type="button" class="lr-skip-btn" id="lr-skip">Olen valmis t\xE4st\xE4</button>
        </div>
      </div>
      <header class="lr-phase-head">
        <h2 class="lr-phase-title">${o(n.title||"Vaihe")}</h2>
        ${n.instruction?`<p class="lr-phase-instr">${o(n.instruction)}</p>`:""}
        <p class="lr-item-counter">Kysymys ${t.currentItemIdx+1} / ${n.items.length}</p>
      </header>
      <div class="lr-item" id="lr-item">${z(a,t)}</div>
      ${ie(t)}
    </div>`,Z(e,t,a)}function V(e){return`<span class="lr-stepper" aria-hidden="true">${e.phases.map((n,r)=>r<e.currentPhaseIdx?'<span class="lr-step lr-step--done" aria-hidden="true">\u25CF</span>':r===e.currentPhaseIdx?'<span class="lr-step lr-step--current" aria-hidden="true">\u25CF</span>':'<span class="lr-step" aria-hidden="true">\u25CB</span>').join("")}</span>`}function z(e,t){switch(e.item_type){case"mc":return Y(e);case"typed":return B(e);case"translate":return W(e);case"match":return G(e);case"gap_fill":return U(e);case"writing":return X(e);case"reading_mc":return Q(e);default:return`<p class="lr-unsupported">Teht\xE4v\xE4tyyppi\xE4 "${o(e.item_type||"?")}" ei tueta, ohitetaan.</p>
        <button type="button" class="btn btn-primary" data-lr-skip-item>Jatka</button>`}}function Y(e){return`
    <div class="lr-mc">
      ${e.context?`<p class="lr-mc-context">${o(e.context)}</p>`:""}
      <p class="lr-mc-stem">${o(e.stem||"")}</p>
      <div class="lr-mc-choices" role="radiogroup">
        ${(e.choices||[]).map((n,r)=>`
          <button type="button" class="lr-mc-choice" data-mc-idx="${r}" role="radio" aria-checked="false">${o(n)}</button>
        `).join("")}
      </div>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function B(e){return`
    <div class="lr-typed">
      <p class="lr-typed-dir">${e.direction==="es_to_fi"?"K\xE4\xE4nn\xE4 suomeksi":"K\xE4\xE4nn\xE4 espanjaksi"}</p>
      <p class="lr-typed-prompt">${o(e.prompt||"")}</p>
      ${e.hint?`<p class="lr-typed-hint">Vihje: ${o(e.hint)}</p>`:""}
      <input type="text" class="lr-typed-input" id="lr-typed-input" autocomplete="off" autocapitalize="off" spellcheck="false" />
      <button type="button" class="btn btn-primary" id="lr-typed-submit">Tarkista</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function W(e){return B({...e,prompt:e.source})}function G(e){let t=(e.pairs||[]).map(r=>r.left),n=ce((e.pairs||[]).map(r=>r.right));return`
    <div class="lr-match" data-match>
      <p class="lr-match-instr">Yhdist\xE4 parit klikkaamalla.</p>
      <div class="lr-match-cols">
        <div class="lr-match-col">
          ${t.map((r,s)=>`<button type="button" class="lr-match-cell" data-side="left" data-idx="${s}">${o(r)}</button>`).join("")}
        </div>
        <div class="lr-match-col">
          ${n.map(r=>`<button type="button" class="lr-match-cell" data-side="right" data-val="${o(r)}">${o(r)}</button>`).join("")}
        </div>
      </div>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function U(e){let t=e.sentence_template||"",n=o(t).replace(/\{(\d+)\}/g,(s,a)=>`<input type="text" class="lr-gap-input" data-gap="${a}" autocomplete="off" autocapitalize="off" spellcheck="false" />`),r=Array.isArray(e.word_bank)&&e.word_bank.length?`<div class="lr-gap-bank">${e.word_bank.map(s=>`<span class="lr-gap-chip">${o(s)}</span>`).join("")}</div>`:"";return`
    <div class="lr-gap">
      <p class="lr-gap-sentence">${n}</p>
      ${r}
      <button type="button" class="btn btn-primary" id="lr-gap-submit">Tarkista</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function X(e){let t=Number(e.min_chars)||y(e.min_words),n=Number(e.max_chars)||y(e.max_words);return`
    <div class="lr-writing">
      <p class="lr-writing-prompt">${o(e.prompt||"")}</p>
      <textarea class="lr-writing-input" id="lr-writing-input"
                data-min-chars="${t}" data-max-chars="${n}"
                rows="8"></textarea>
      <p class="lr-writing-char-counter" id="lr-writing-char-counter">0 / ${t}\u2013${n} merkki\xE4</p>
      <button type="button" class="btn btn-primary" id="lr-writing-submit">L\xE4het\xE4</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function Q(e){let t=o(e.passage||"").replace(/\n/g,"<br>"),n=(e.questions||[]).map((r,s)=>`
    <fieldset class="lr-reading-q" data-q="${s}">
      <legend>${o(r.question_fi||"")}</legend>
      ${(r.choices||[]).map((a,i)=>`
        <label class="lr-reading-choice"><input type="radio" name="lr-q-${s}" value="${i}"> ${o(a)}</label>
      `).join("")}
    </fieldset>
  `).join("");return`
    <div class="lr-reading">
      <article class="lr-reading-passage">${t}</article>
      <div class="lr-reading-qs">${n}</div>
      <button type="button" class="btn btn-primary" id="lr-reading-submit">Tarkista vastaukset</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function Z(e,t,n){e.__lrState=t,O(e,t.language),document.getElementById("lr-help-toggle")?.addEventListener("click",()=>le(e,t)),document.getElementById("lr-skip")?.addEventListener("click",()=>re(e,t)),document.getElementById("lr-exit-lesson")?.addEventListener("click",async()=>{let{confirmDialog:s}=await import("./app-confirmDialog-46K22AFY.js");w(t),await s({title:"Lopetetaanko oppitunti?",body:"Tallennamme kohdan johon p\xE4\xE4sit, voit jatkaa t\xE4\xE4lt\xE4 my\xF6hemmin.",confirmLabel:"L\xE4hde takaisin",cancelLabel:"Jatka oppituntia"})&&(await import("./app-curriculum-3QMLUVEJ.js")).loadCurriculum()}),e.querySelector("[data-lr-skip-item]")?.addEventListener("click",()=>g(e,t,!0));let r=typeof t.language=="string"&&t.language||"es";if(n.item_type==="mc")e.querySelectorAll(".lr-mc-choice").forEach(s=>{s.addEventListener("click",()=>{let a=Number(s.dataset.mcIdx),i=a===Number(n.correct_index);h(e,i,n.explanation||"",{hint:null,waitForClick:!i}),se(e,n.correct_index,a),f(t,i),i&&m(e,t)})});else if(n.item_type==="typed"||n.item_type==="translate"){let s=document.getElementById("lr-typed-input"),a=document.getElementById("lr-typed-submit"),i=()=>{let l=n.accept||[],{ok:u,hint:c}=M(s.value,l,r),d=l[0]||"";h(e,u,u?"":`Oikea vastaus: ${d}`,{hint:c,waitForClick:!u}),f(t,u),u&&m(e,t)};a?.addEventListener("click",i),s?.addEventListener("keydown",l=>{l.key==="Enter"&&i()}),s?.focus()}else if(n.item_type==="match")ee(e,t,n);else if(n.item_type==="gap_fill")document.getElementById("lr-gap-submit")?.addEventListener("click",()=>{let s=e.querySelectorAll(".lr-gap-input"),a=!0,i=[],l=null;s.forEach((u,c)=>{let d=n.answers&&n.answers[c]||[],p=M(u.value,d,r);p.ok||(a=!1),p.hint&&!l&&(l=p.hint),i.push(d[0]||"?")}),h(e,a,a?"":`Oikeat vastaukset: ${i.join(", ")}`,{hint:l,waitForClick:!a}),f(t,a),a&&m(e,t)});else if(n.item_type==="writing"){let s=document.getElementById("lr-writing-input"),a=document.getElementById("lr-writing-char-counter"),i=Number(s?.dataset.minChars)||0,l=Number(s?.dataset.maxChars)||0;s&&a&&T(s,a,{minChars:i,maxChars:l}),document.getElementById("lr-writing-submit")?.addEventListener("click",()=>{let c=(s?.value||"").length,d=c>=i,p=d?"Kirjoituksesi on tallennettu.":`Merkkim\xE4\xE4r\xE4 on ${c}, tavoite v\xE4hint\xE4\xE4n ${i} merkki\xE4. Jatka kirjoitusta.`;h(e,d,p,{hint:null,waitForClick:!d}),f(t,d),d&&m(e,t)})}else n.item_type==="reading_mc"&&document.getElementById("lr-reading-submit")?.addEventListener("click",()=>{let s=0,a=(n.questions||[]).length;(n.questions||[]).forEach((l,u)=>{let c=e.querySelector(`input[name="lr-q-${u}"]:checked`);c&&Number(c.value)===Number(l.correct_index)&&s++});let i=s===a;h(e,i,i?"Kaikki oikein.":`${s}/${a} oikein.`),t.correctInPhase+=s/a,t.answeredInPhase+=1,m(e,t,!1)})}function ee(e,t,n){let r=null,s=new Set,a=(n.pairs||[]).length,i=0;e.querySelectorAll(".lr-match-cell").forEach(l=>{l.addEventListener("click",()=>{if(s.has(l))return;if(l.dataset.side==="left")e.querySelectorAll('.lr-match-cell[data-side="left"]').forEach(c=>c.classList.remove("is-active")),l.classList.add("is-active"),r=l;else if(r){let c=Number(r.dataset.idx),d=n.pairs[c]?.right,p=l.dataset.val;d&&p&&k(d)===k(p)?(r.classList.add("is-matched"),l.classList.add("is-matched"),s.add(r),s.add(l),r=null,i++,i===a&&(h(e,!0,"Kaikki parit oikein."),f(t,!0),m(e,t))):(l.classList.add("is-wrong"),setTimeout(()=>l.classList.remove("is-wrong"),600))}})})}var te='<svg class="lr-feedback__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',ne='<svg class="lr-feedback__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';function h(e,t,n,r={}){let s=e.querySelector("#lr-feedback");if(!s)return;let{hint:a=null,waitForClick:i=!1}=r;s.hidden=!1,s.className=`lr-feedback ${t?"is-correct lr-feedback--correct":"is-wrong lr-feedback--wrong"}`,s.setAttribute("role","status"),s.setAttribute("aria-live",t?"polite":"assertive");let l=t?n||"Hyvin meni!":n||"Melkein, yrit\xE4 uudelleen.",u=a?`<p class="lr-feedback__accent-hint">${o(a)}</p>`:"",c=i?'<button type="button" class="lr-feedback__next" id="lr-feedback-next">Seuraava \u2192</button>':"";s.innerHTML=`${t?te:ne}<div class="lr-feedback__body-wrap"><p class="lr-feedback__title ${t?"is-correct":"is-wrong"}">${t?"Oikein":"V\xE4\xE4rin"}</p><p class="lr-feedback__body">${o(l)}</p>${u}${c}</div>`,s.classList.remove("lr-feedback--animate"),s.offsetWidth,s.classList.add("lr-feedback--animate"),i&&s.querySelector("#lr-feedback-next")?.addEventListener("click",()=>{let p=e.__lrState;p&&g(e,p,!1)},{once:!0})}function se(e,t,n){e.querySelectorAll(".lr-mc-choice").forEach(r=>{let s=Number(r.dataset.mcIdx);r.disabled=!0,s===t&&r.classList.add("is-correct"),s===n&&n!==t&&r.classList.add("is-wrong")})}function f(e,t){e.answeredInPhase+=1,t&&(e.correctInPhase+=1)}function m(e,t,n=!0){setTimeout(()=>g(e,t,!1),1100)}function g(e,t,n){let r=t.phases[t.currentPhaseIdx];if(t.currentItemIdx+=1,w(t),t.currentItemIdx>=r.items.length)return x(e,t,r,"completed");v(e,t)}function x(e,t,n,r){let s=t.answeredInPhase||n.items.length,a=Math.round(t.correctInPhase),i=s>0?t.correctInPhase/s:0,l=j(n,t.targetGrade),u=r==="skipped",c=!u&&i>=l;t.phaseResults.push({phaseId:n.phase_id,title:n.title,correct:a,total:s,pct:i,threshold:l,mastered:c,skipped:u});let d,p;u?(d="Vaihe ohitettu",p="Sanat palaavat kertaussessioon my\xF6hemmin, niit\xE4 ei j\xE4tet\xE4 unohduksiin."):c?(d="Hallitset t\xE4m\xE4n",p=`Sait ${a} / ${s} oikein, jatketaan seuraavaan vaiheeseen.`):i>=.5?(d="L\xE4hell\xE4, viel\xE4 yksi pyyhk\xE4isy",p=`${a} / ${s} oikein. Sanat joissa horjuit palaavat seuraavissa vaiheissa.`):(d="T\xE4m\xE4 kaipaa toistoa",p=`${a} / ${s} oikein. Et ole yksin, t\xE4m\xE4 rakenne vaatii toistoa, ei eri s\xE4\xE4nt\xF6\xE4.`);let b=t.currentPhaseIdx+1>=t.phases.length;e.innerHTML=`
    <div class="lr-shell lr-shell--banner">
      <div class="lr-banner ${c?"is-mastered":u?"is-skipped":"is-almost"}">
        <p class="lr-banner-eyebrow">${o(n.title||"Vaihe")}</p>
        <h2>${o(d)}</h2>
        <p>${o(p)}</p>
        <button type="button" class="btn btn-primary" id="lr-next">${b?"N\xE4yt\xE4 yhteenveto":"Seuraava vaihe \u2192"}</button>
      </div>
    </div>`,document.getElementById("lr-next")?.addEventListener("click",()=>{t.currentPhaseIdx+=1,t.currentItemIdx=0,t.correctInPhase=0,t.answeredInPhase=0,t.currentPhaseIdx>=t.phases.length?q(e,t):(w(t),v(e,t))})}function re(e,t){if(!window.confirm("Ohita t\xE4m\xE4 vaihe? Sanat palaavat kertaussessioon my\xF6hemmin."))return;let r=t.phases[t.currentPhaseIdx];x(e,t,r,"skipped")}function q(e,t){if(t.finished)return;t.finished=!0,F(t.kurssiKey,t.lessonIndex);let n=t.phaseResults.reduce((c,d)=>c+(d.skipped?0:d.correct),0),r=t.phaseResults.reduce((c,d)=>c+(d.skipped?0:d.total),0),s=Math.max(1,Math.round((Date.now()-t.startedAt)/6e4)),a=t.targetGrade,i=ae(a,t.phaseResults),l=t.lesson.meta?.yo_relevance||"",u=t.phaseResults.map(c=>{let d=c.skipped?"lr-result-skipped":c.mastered?"lr-result-mastered":"lr-result-almost",p=c.skipped?"Ohitettu":c.mastered?"Hallitset":"L\xE4hell\xE4";return`<li class="lr-result-row ${d}">
      <span class="lr-result-title">${o(c.title||"")}</span>
      <span class="lr-result-status">${p}${c.skipped?"":` \xB7 ${c.correct}/${c.total}`}</span>
    </li>`}).join("");e.innerHTML=`
    <div class="lr-shell lr-shell--results">
      <header class="lr-hero">
        <p class="lr-eyebrow">Yhteenveto</p>
        <h1>${o(t.lesson.meta?.title||"Oppitunti")}</h1>
      </header>
      <div class="lr-result-summary">
        <div class="lr-result-stat"><span class="lr-result-num">${n}/${r||0}</span><span class="lr-result-lbl">oikein</span></div>
        <div class="lr-result-stat"><span class="lr-result-num">${s}</span><span class="lr-result-lbl">min</span></div>
      </div>
      <div class="lr-tutor">${o(i)}</div>
      ${l?`<aside class="lr-yo">
        <p class="lr-yo-eyebrow">T\xE4m\xE4 YO-kokeessa</p>
        <p>${o(l)}</p>
      </aside>`:""}
      <ol class="lr-results-list">${u}</ol>
      <div class="lr-actions">
        <button type="button" class="btn btn-primary" id="lr-done">Takaisin oppimispolulle \u2192</button>
      </div>
    </div>`,document.getElementById("lr-done")?.addEventListener("click",()=>{import("./app-curriculum-3QMLUVEJ.js").then(c=>c.loadCurriculum())}),_()&&r>0&&S(`${P}/api/curriculum/${encodeURIComponent(t.kurssiKey)}/lesson/${t.lessonIndex}/complete`,{method:"POST",headers:{"Content-Type":"application/json",...L()},body:JSON.stringify({scoreCorrect:n,scoreTotal:r,wrongAnswers:[],reviewItems:[]})}).catch(()=>{})}function ae(e,t){let n=t.filter(a=>a.skipped).length,r=t.filter(a=>!a.skipped&&a.mastered).length,s=t.filter(a=>!a.skipped&&!a.mastered).length;return e==="L"||e==="E"?s===0&&n===0?"L/E-tavoite vaatii ~85\u201395 % YO-kokeessa, t\xE4m\xE4n tunnin sanat ovat sinulla automaattisia. Eteenp\xE4in.":`${s} vaihe${s===1?"":"tta"} j\xE4i alle hallintarajan. L/E-tavoite ei salli horjuvia perusrakenteita, palaa n\xE4ihin huomenna kertauksessa.`:e==="I"||e==="A"?s===0&&n===0?"Hyv\xE4 alku. I/A-tavoite tarvitsee perussanaston tunnistustasolla, olet nyt siell\xE4.":"Et ole yksin. I/A-tavoitteelle riitt\xE4\xE4 tunnistus, ei kaikki sanat tarvitse olla automaattisia heti. Sanat palaavat kertauksessa.":r===t.length?"Tunti meni kuten pitikin. Jatketaan seuraavaan oppituntiin samalla rytmill\xE4.":s>0?`${s} vaihetta j\xE4i alle hallintarajan. Sanat palaavat seuraavassa kertaussessiossa, t\xE4m\xE4 on osa rytmi\xE4, ei takaisku.`:"Tunti suoritettu."}function ie(e){let t=e.lesson.side_panel?.tabs||[];if(!t.length)return"";let n=t.map((s,a)=>`
    <button type="button" class="lr-tab ${a===0?"is-active":""}" data-tab="${o(s.id)}">${o(s.title||s.id)}</button>
  `).join(""),r=t.map((s,a)=>`
    <div class="lr-tab-pane ${a===0?"is-active":""}" data-pane="${o(s.id)}">
      ${H(s.content_md||"")}
    </div>
  `).join("");return`
    <aside id="lr-side-panel" class="lr-side-panel ${e.sidePanelOpen?"is-open":""}" aria-hidden="${e.sidePanelOpen?"false":"true"}">
      <div class="lr-side-tabs" role="tablist">${n}</div>
      <div class="lr-side-panes">${r}</div>
    </aside>`}function le(e,t){t.sidePanelOpen=!t.sidePanelOpen,t.sidePanelOpen?t.sidePanelOpenedAt=Date.now():t.sidePanelOpenedAt&&(t.sidePanelOpenMs+=Date.now()-t.sidePanelOpenedAt,t.sidePanelOpenedAt=0);let n=e.querySelector("#lr-side-panel"),r=e.querySelector("#lr-help-toggle"),s=e.querySelector(".lr-shell--exercise");s&&s.classList.toggle("has-panel-open",t.sidePanelOpen),n&&(n.classList.toggle("is-open",t.sidePanelOpen),n.setAttribute("aria-hidden",t.sidePanelOpen?"false":"true")),r&&(r.setAttribute("aria-expanded",t.sidePanelOpen?"true":"false"),r.textContent=t.sidePanelOpen?"\u2715 Sulje":"\u{1F4D6} Apua"),e.querySelectorAll(".lr-tab").forEach(a=>{a.onclick=()=>{e.querySelectorAll(".lr-tab").forEach(l=>l.classList.toggle("is-active",l===a));let i=a.dataset.tab;e.querySelectorAll(".lr-tab-pane").forEach(l=>l.classList.toggle("is-active",l.dataset.pane===i))}})}function ce(e){let t=e.slice();for(let n=t.length-1;n>0;n--){let r=Math.floor(Math.random()*(n+1));[t[n],t[r]]=[t[r],t[n]]}return t}function H(e){if(!e)return"";let t=String(e).split(/\r?\n/),n=[],r=[],s=!1,a=()=>{r.length&&(n.push(`<p>${l(r.join(" "))}</p>`),r=[])},i=()=>{s&&(n.push("</ul>"),s=!1)};function l(u){let c=o(u);return c=c.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),c=c.replace(/\*([^*]+)\*/g,"<em>$1</em>"),c=c.replace(/`([^`]+)`/g,"<code>$1</code>"),c}for(let u of t){let c=u.replace(/\s+$/,"");if(/^#{1,3}\s/.test(c)){a(),i();let d=c.startsWith("### ")?3:c.startsWith("## ")?2:1;n.push(`<h${d}>${l(c.replace(/^#{1,3}\s+/,""))}</h${d}>`)}else/^\s*[-*]\s+/.test(c)?(a(),s||(n.push("<ul>"),s=!0),n.push(`<li>${l(c.replace(/^\s*[-*]\s+/,""))}</li>`)):/^\s*$/.test(c)?(a(),i()):(i(),r.push(c))}return a(),i(),n.join(`
`)}export{F as clearLessonProgress,ge as runPregeneratedLesson,w as saveLessonProgress};
//# sourceMappingURL=app-lessonRunner-SKLLDEGA.js.map
