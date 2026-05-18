import{a as P,c as E}from"./app-chunk-NI4X3IGS.js";import{a as w,c as _,e as I,j as x}from"./app-chunk-O7N2YSBJ.js";import"./app-chunk-BKOFN7BD.js";import{b as L}from"./app-chunk-3WC2U67L.js";function S(t,e){let n=t?.mastery_threshold;return n?typeof n[e]=="number"?n[e]:n.B??.7:.7}function A(t,e){let n=t?.skip_for_targets;return Array.isArray(n)&&n.includes(e)}function O(t,e,{minChars:n=0,maxChars:i=0}={}){if(!t||!e)return{stop(){}};let s=n||i?`${n}\u2013${i}`:"";function a(){let l=(t.value||"").length;e.textContent=s?`${l} / ${s} merkki\xE4`:`${l} merkki\xE4`,e.classList.toggle("is-met",n>0&&l>=n),e.classList.toggle("is-too-long",i>0&&l>i)}return t.addEventListener("input",a),a(),{stop(){t.removeEventListener("input",a)}}}function b(t){return Math.round((t||0)*6)}var v="lesson-runner-root";function o(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function k(t){return String(t||"").toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ")}function j(t,e,n="es"){let i=e||[],s=k(t);if(s&&i.some(a=>k(a)===s))return{ok:!0,hint:null};for(let a of i){let l=P(t,a,n);if(l.ok)return l}return{ok:!1,hint:null}}function q(t,e,n,i){let s=(t.phases||[]).filter(a=>!A(a,e));return{lesson:t,kurssiKey:n,lessonIndex:i,targetGrade:e,phases:s,currentPhaseIdx:0,currentItemIdx:0,correctInPhase:0,answeredInPhase:0,phaseResults:[],sidePanelOpen:!1,sidePanelOpenMs:0,sidePanelOpenedAt:0,startedAt:Date.now(),finished:!1}}function pe(t,e,n,i){let s=t.pregenerated||t;H(),L("screen-lesson");let a=document.getElementById(v);if(!a)return;let l=q(s,i||"B",e,n);try{sessionStorage.setItem("currentLesson",JSON.stringify({kurssiKey:e,lessonIndex:n,lessonFocus:s.meta?.title||"",lessonType:s.meta?.lesson_type||"",targetGrade:l.targetGrade,isPregenerated:!0}));let c=s.teaching||{},u=String(c.intro_md||"").trim(),r=Array.isArray(c.key_points)?c.key_points:[],d=[u,r.length?`## Avainkohdat
`+r.map(p=>`- ${p}`).join(`
`):""].filter(Boolean).join(`

`);d?sessionStorage.setItem("currentLessonTeachingMd",d):sessionStorage.removeItem("currentLessonTeachingMd")}catch{}N(a,l)}function H(){let t=document.getElementById("screen-lesson");t||(t=document.createElement("div"),t.id="screen-lesson",t.className="screen",document.querySelector(".app-main")?.appendChild(t)||document.body.appendChild(t)),document.getElementById(v)||(t.innerHTML=`<div id="${v}"></div>`)}function N(t,e){let n=e.lesson.meta||{},i=e.lesson.teaching||{},s=M(i.intro_md||""),a=Array.isArray(i.key_points)?i.key_points:[],l=a.length?`<ul class="lr-keypoints">${a.map(c=>`<li>${o(c)}</li>`).join("")}</ul>`:"";t.innerHTML=`
    <div class="lr-shell">
      <button type="button" class="lr-back" id="lr-back">\u2190 Oppimispolku</button>
      <header class="lr-hero">
        <p class="lr-eyebrow">${o(n.course_key||"")} \xB7 Oppitunti ${o(String(n.lesson_index||""))}</p>
        <h1>${o(n.title||"Oppitunti")}</h1>
        ${n.description?`<p class="lr-desc">${o(n.description)}</p>`:""}
      </header>
      <article class="lr-teaching">${s}${l}</article>
      <div class="lr-actions">
        <button type="button" class="btn btn-primary" id="lr-start">Aloita harjoittelu \u2192</button>
        <p class="lr-hint">Voit avata Apua-paneelin milloin tahansa harjoituksen aikana.</p>
      </div>
    </div>`,document.getElementById("lr-back")?.addEventListener("click",()=>{import("./app-curriculum-RXF7CR2W.js").then(c=>c.loadCurriculum())}),document.getElementById("lr-start")?.addEventListener("click",()=>{e.startedAt=Date.now(),y(t,e)})}function y(t,e){let n=e.phases[e.currentPhaseIdx];if(!n)return T(t,e);let i=e.phases.length,s=F(e),a=n.items[e.currentItemIdx];if(!a)return $(t,e,n,"completed");t.innerHTML=`
    <div class="lr-shell lr-shell--exercise">
      <div class="lr-topbar">
        <button type="button" class="lr-exit-btn" id="lr-exit-lesson" aria-label="Takaisin oppimispolulle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          <span>Oppimispolku</span>
        </button>
        <div class="lr-topbar-progress">
          <span class="lr-step-label">Vaihe ${e.currentPhaseIdx+1} / ${i}</span>
          ${s}
        </div>
        <div class="lr-topbar-actions">
          <button type="button" class="lr-help-btn" id="lr-help-toggle" aria-expanded="${e.sidePanelOpen?"true":"false"}" aria-controls="lr-side-panel">\u{1F4D6} Apua</button>
          <button type="button" class="lr-skip-btn" id="lr-skip">Olen valmis t\xE4st\xE4</button>
        </div>
      </div>
      <header class="lr-phase-head">
        <h2 class="lr-phase-title">${o(n.title||"Vaihe")}</h2>
        ${n.instruction?`<p class="lr-phase-instr">${o(n.instruction)}</p>`:""}
        <p class="lr-item-counter">Kysymys ${e.currentItemIdx+1} / ${n.items.length}</p>
      </header>
      <div class="lr-item" id="lr-item">${D(a,e)}</div>
      ${te(e)}
    </div>`,Y(t,e,a)}function F(t){return`<span class="lr-stepper" aria-hidden="true">${t.phases.map((n,i)=>i<t.currentPhaseIdx?'<span class="lr-step lr-step--done" aria-hidden="true">\u25CF</span>':i===t.currentPhaseIdx?'<span class="lr-step lr-step--current" aria-hidden="true">\u25CF</span>':'<span class="lr-step" aria-hidden="true">\u25CB</span>').join("")}</span>`}function D(t,e){switch(t.item_type){case"mc":return R(t);case"typed":return C(t);case"translate":return V(t);case"match":return K(t);case"gap_fill":return z(t);case"writing":return J(t);case"reading_mc":return W(t);default:return`<p class="lr-unsupported">Teht\xE4v\xE4tyyppi\xE4 "${o(t.item_type||"?")}" ei tueta, ohitetaan.</p>
        <button type="button" class="btn btn-primary" data-lr-skip-item>Jatka</button>`}}function R(t){return`
    <div class="lr-mc">
      ${t.context?`<p class="lr-mc-context">${o(t.context)}</p>`:""}
      <p class="lr-mc-stem">${o(t.stem||"")}</p>
      <div class="lr-mc-choices" role="radiogroup">
        ${(t.choices||[]).map((n,i)=>`
          <button type="button" class="lr-mc-choice" data-mc-idx="${i}" role="radio" aria-checked="false">${o(n)}</button>
        `).join("")}
      </div>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function C(t){return`
    <div class="lr-typed">
      <p class="lr-typed-dir">${t.direction==="es_to_fi"?"K\xE4\xE4nn\xE4 suomeksi":"K\xE4\xE4nn\xE4 espanjaksi"}</p>
      <p class="lr-typed-prompt">${o(t.prompt||"")}</p>
      ${t.hint?`<p class="lr-typed-hint">Vihje: ${o(t.hint)}</p>`:""}
      <input type="text" class="lr-typed-input" id="lr-typed-input" autocomplete="off" autocapitalize="off" spellcheck="false" />
      <button type="button" class="btn btn-primary" id="lr-typed-submit">Tarkista</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function V(t){return C({...t,prompt:t.source})}function K(t){let e=(t.pairs||[]).map(i=>i.left),n=se((t.pairs||[]).map(i=>i.right));return`
    <div class="lr-match" data-match>
      <p class="lr-match-instr">Yhdist\xE4 parit klikkaamalla.</p>
      <div class="lr-match-cols">
        <div class="lr-match-col">
          ${e.map((i,s)=>`<button type="button" class="lr-match-cell" data-side="left" data-idx="${s}">${o(i)}</button>`).join("")}
        </div>
        <div class="lr-match-col">
          ${n.map(i=>`<button type="button" class="lr-match-cell" data-side="right" data-val="${o(i)}">${o(i)}</button>`).join("")}
        </div>
      </div>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function z(t){let e=t.sentence_template||"",n=o(e).replace(/\{(\d+)\}/g,(s,a)=>`<input type="text" class="lr-gap-input" data-gap="${a}" autocomplete="off" autocapitalize="off" spellcheck="false" />`),i=Array.isArray(t.word_bank)&&t.word_bank.length?`<div class="lr-gap-bank">${t.word_bank.map(s=>`<span class="lr-gap-chip">${o(s)}</span>`).join("")}</div>`:"";return`
    <div class="lr-gap">
      <p class="lr-gap-sentence">${n}</p>
      ${i}
      <button type="button" class="btn btn-primary" id="lr-gap-submit">Tarkista</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function J(t){let e=Number(t.min_chars)||b(t.min_words),n=Number(t.max_chars)||b(t.max_words);return`
    <div class="lr-writing">
      <p class="lr-writing-prompt">${o(t.prompt||"")}</p>
      <textarea class="lr-writing-input" id="lr-writing-input"
                data-min-chars="${e}" data-max-chars="${n}"
                rows="8"></textarea>
      <p class="lr-writing-char-counter" id="lr-writing-char-counter">0 / ${e}\u2013${n} merkki\xE4</p>
      <button type="button" class="btn btn-primary" id="lr-writing-submit">L\xE4het\xE4</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function W(t){let e=o(t.passage||"").replace(/\n/g,"<br>"),n=(t.questions||[]).map((i,s)=>`
    <fieldset class="lr-reading-q" data-q="${s}">
      <legend>${o(i.question_fi||"")}</legend>
      ${(i.choices||[]).map((a,l)=>`
        <label class="lr-reading-choice"><input type="radio" name="lr-q-${s}" value="${l}"> ${o(a)}</label>
      `).join("")}
    </fieldset>
  `).join("");return`
    <div class="lr-reading">
      <article class="lr-reading-passage">${e}</article>
      <div class="lr-reading-qs">${n}</div>
      <button type="button" class="btn btn-primary" id="lr-reading-submit">Tarkista vastaukset</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function Y(t,e,n){t.__lrState=e,E(t,e.language),document.getElementById("lr-help-toggle")?.addEventListener("click",()=>ne(t,e)),document.getElementById("lr-skip")?.addEventListener("click",()=>Z(t,e)),document.getElementById("lr-exit-lesson")?.addEventListener("click",async()=>{let{confirmDialog:s}=await import("./app-confirmDialog-46K22AFY.js");await s({title:"Lopetetaanko oppitunti?",body:"Edistyminen t\xE4ll\xE4 oppitunnilla ei tallennu jos l\xE4hdet nyt. Voit aloittaa tunnin alusta uudelleen my\xF6hemmin.",confirmLabel:"L\xE4hde takaisin",cancelLabel:"Jatka oppituntia"})&&(await import("./app-curriculum-RXF7CR2W.js")).loadCurriculum()}),t.querySelector("[data-lr-skip-item]")?.addEventListener("click",()=>g(t,e,!0));let i=typeof e.language=="string"&&e.language||"es";if(n.item_type==="mc")t.querySelectorAll(".lr-mc-choice").forEach(s=>{s.addEventListener("click",()=>{let a=Number(s.dataset.mcIdx),l=a===Number(n.correct_index);h(t,l,n.explanation||"",{hint:null,waitForClick:!l}),X(t,n.correct_index,a),f(e,l),l&&m(t,e)})});else if(n.item_type==="typed"||n.item_type==="translate"){let s=document.getElementById("lr-typed-input"),a=document.getElementById("lr-typed-submit"),l=()=>{let c=n.accept||[],{ok:u,hint:r}=j(s.value,c,i),d=c[0]||"";h(t,u,u?"":`Oikea vastaus: ${d}`,{hint:r,waitForClick:!u}),f(e,u),u&&m(t,e)};a?.addEventListener("click",l),s?.addEventListener("keydown",c=>{c.key==="Enter"&&l()}),s?.focus()}else if(n.item_type==="match")U(t,e,n);else if(n.item_type==="gap_fill")document.getElementById("lr-gap-submit")?.addEventListener("click",()=>{let s=t.querySelectorAll(".lr-gap-input"),a=!0,l=[],c=null;s.forEach((u,r)=>{let d=n.answers&&n.answers[r]||[],p=j(u.value,d,i);p.ok||(a=!1),p.hint&&!c&&(c=p.hint),l.push(d[0]||"?")}),h(t,a,a?"":`Oikeat vastaukset: ${l.join(", ")}`,{hint:c,waitForClick:!a}),f(e,a),a&&m(t,e)});else if(n.item_type==="writing"){let s=document.getElementById("lr-writing-input"),a=document.getElementById("lr-writing-char-counter"),l=Number(s?.dataset.minChars)||0,c=Number(s?.dataset.maxChars)||0;s&&a&&O(s,a,{minChars:l,maxChars:c}),document.getElementById("lr-writing-submit")?.addEventListener("click",()=>{let r=(s?.value||"").length,d=r>=l,p=d?"Kirjoituksesi on tallennettu.":`Merkkim\xE4\xE4r\xE4 on ${r}, tavoite v\xE4hint\xE4\xE4n ${l} merkki\xE4. Jatka kirjoitusta.`;h(t,d,p,{hint:null,waitForClick:!d}),f(e,d),d&&m(t,e)})}else n.item_type==="reading_mc"&&document.getElementById("lr-reading-submit")?.addEventListener("click",()=>{let s=0,a=(n.questions||[]).length;(n.questions||[]).forEach((c,u)=>{let r=t.querySelector(`input[name="lr-q-${u}"]:checked`);r&&Number(r.value)===Number(c.correct_index)&&s++});let l=s===a;h(t,l,l?"Kaikki oikein.":`${s}/${a} oikein.`),e.correctInPhase+=s/a,e.answeredInPhase+=1,m(t,e,!1)})}function U(t,e,n){let i=null,s=new Set,a=(n.pairs||[]).length,l=0;t.querySelectorAll(".lr-match-cell").forEach(c=>{c.addEventListener("click",()=>{if(s.has(c))return;if(c.dataset.side==="left")t.querySelectorAll('.lr-match-cell[data-side="left"]').forEach(r=>r.classList.remove("is-active")),c.classList.add("is-active"),i=c;else if(i){let r=Number(i.dataset.idx),d=n.pairs[r]?.right,p=c.dataset.val;d&&p&&k(d)===k(p)?(i.classList.add("is-matched"),c.classList.add("is-matched"),s.add(i),s.add(c),i=null,l++,l===a&&(h(t,!0,"Kaikki parit oikein."),f(e,!0),m(t,e))):(c.classList.add("is-wrong"),setTimeout(()=>c.classList.remove("is-wrong"),600))}})})}var G='<svg class="lr-feedback__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',Q='<svg class="lr-feedback__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';function h(t,e,n,i={}){let s=t.querySelector("#lr-feedback");if(!s)return;let{hint:a=null,waitForClick:l=!1}=i;s.hidden=!1,s.className=`lr-feedback ${e?"is-correct lr-feedback--correct":"is-wrong lr-feedback--wrong"}`,s.setAttribute("role","status"),s.setAttribute("aria-live",e?"polite":"assertive");let c=e?n||"Hyvin meni!":n||"Melkein, yrit\xE4 uudelleen.",u=a?`<p class="lr-feedback__accent-hint">${o(a)}</p>`:"",r=l?'<button type="button" class="lr-feedback__next" id="lr-feedback-next">Seuraava \u2192</button>':"";s.innerHTML=`${e?G:Q}<div class="lr-feedback__body-wrap"><p class="lr-feedback__title ${e?"is-correct":"is-wrong"}">${e?"Oikein":"V\xE4\xE4rin"}</p><p class="lr-feedback__body">${o(c)}</p>${u}${r}</div>`,s.classList.remove("lr-feedback--animate"),s.offsetWidth,s.classList.add("lr-feedback--animate"),l&&s.querySelector("#lr-feedback-next")?.addEventListener("click",()=>{let p=t.__lrState;p&&g(t,p,!1)},{once:!0})}function X(t,e,n){t.querySelectorAll(".lr-mc-choice").forEach(i=>{let s=Number(i.dataset.mcIdx);i.disabled=!0,s===e&&i.classList.add("is-correct"),s===n&&n!==e&&i.classList.add("is-wrong")})}function f(t,e){t.answeredInPhase+=1,e&&(t.correctInPhase+=1)}function m(t,e,n=!0){setTimeout(()=>g(t,e,!1),1100)}function g(t,e,n){let i=e.phases[e.currentPhaseIdx];if(e.currentItemIdx+=1,e.currentItemIdx>=i.items.length)return $(t,e,i,"completed");y(t,e)}function $(t,e,n,i){let s=e.answeredInPhase||n.items.length,a=Math.round(e.correctInPhase),l=s>0?e.correctInPhase/s:0,c=S(n,e.targetGrade),u=i==="skipped",r=!u&&l>=c;e.phaseResults.push({phaseId:n.phase_id,title:n.title,correct:a,total:s,pct:l,threshold:c,mastered:r,skipped:u});let d,p;u?(d="Vaihe ohitettu",p="Sanat palaavat kertaussessioon my\xF6hemmin, niit\xE4 ei j\xE4tet\xE4 unohduksiin."):r?(d="Hallitset t\xE4m\xE4n",p=`Sait ${a} / ${s} oikein, jatketaan seuraavaan vaiheeseen.`):l>=.5?(d="L\xE4hell\xE4, viel\xE4 yksi pyyhk\xE4isy",p=`${a} / ${s} oikein. Sanat joissa horjuit palaavat seuraavissa vaiheissa.`):(d="T\xE4m\xE4 kaipaa toistoa",p=`${a} / ${s} oikein. Et ole yksin, t\xE4m\xE4 rakenne vaatii toistoa, ei eri s\xE4\xE4nt\xF6\xE4.`);let B=e.currentPhaseIdx+1>=e.phases.length;t.innerHTML=`
    <div class="lr-shell lr-shell--banner">
      <div class="lr-banner ${r?"is-mastered":u?"is-skipped":"is-almost"}">
        <p class="lr-banner-eyebrow">${o(n.title||"Vaihe")}</p>
        <h2>${o(d)}</h2>
        <p>${o(p)}</p>
        <button type="button" class="btn btn-primary" id="lr-next">${B?"N\xE4yt\xE4 yhteenveto":"Seuraava vaihe \u2192"}</button>
      </div>
    </div>`,document.getElementById("lr-next")?.addEventListener("click",()=>{e.currentPhaseIdx+=1,e.currentItemIdx=0,e.correctInPhase=0,e.answeredInPhase=0,e.currentPhaseIdx>=e.phases.length?T(t,e):y(t,e)})}function Z(t,e){if(!window.confirm("Ohita t\xE4m\xE4 vaihe? Sanat palaavat kertaussessioon my\xF6hemmin."))return;let i=e.phases[e.currentPhaseIdx];$(t,e,i,"skipped")}function T(t,e){if(e.finished)return;e.finished=!0;let n=e.phaseResults.reduce((r,d)=>r+(d.skipped?0:d.correct),0),i=e.phaseResults.reduce((r,d)=>r+(d.skipped?0:d.total),0),s=Math.max(1,Math.round((Date.now()-e.startedAt)/6e4)),a=e.targetGrade,l=ee(a,e.phaseResults),c=e.lesson.meta?.yo_relevance||"",u=e.phaseResults.map(r=>{let d=r.skipped?"lr-result-skipped":r.mastered?"lr-result-mastered":"lr-result-almost",p=r.skipped?"Ohitettu":r.mastered?"Hallitset":"L\xE4hell\xE4";return`<li class="lr-result-row ${d}">
      <span class="lr-result-title">${o(r.title||"")}</span>
      <span class="lr-result-status">${p}${r.skipped?"":` \xB7 ${r.correct}/${r.total}`}</span>
    </li>`}).join("");t.innerHTML=`
    <div class="lr-shell lr-shell--results">
      <header class="lr-hero">
        <p class="lr-eyebrow">Yhteenveto</p>
        <h1>${o(e.lesson.meta?.title||"Oppitunti")}</h1>
      </header>
      <div class="lr-result-summary">
        <div class="lr-result-stat"><span class="lr-result-num">${n}/${i||0}</span><span class="lr-result-lbl">oikein</span></div>
        <div class="lr-result-stat"><span class="lr-result-num">${s}</span><span class="lr-result-lbl">min</span></div>
      </div>
      <div class="lr-tutor">${o(l)}</div>
      ${c?`<aside class="lr-yo">
        <p class="lr-yo-eyebrow">T\xE4m\xE4 YO-kokeessa</p>
        <p>${o(c)}</p>
      </aside>`:""}
      <ol class="lr-results-list">${u}</ol>
      <div class="lr-actions">
        <button type="button" class="btn btn-primary" id="lr-done">Takaisin oppimispolulle \u2192</button>
      </div>
    </div>`,document.getElementById("lr-done")?.addEventListener("click",()=>{import("./app-curriculum-RXF7CR2W.js").then(r=>r.loadCurriculum())}),_()&&i>0&&x(`${w}/api/curriculum/${encodeURIComponent(e.kurssiKey)}/lesson/${e.lessonIndex}/complete`,{method:"POST",headers:{"Content-Type":"application/json",...I()},body:JSON.stringify({scoreCorrect:n,scoreTotal:i,wrongAnswers:[],reviewItems:[]})}).catch(()=>{})}function ee(t,e){let n=e.filter(a=>a.skipped).length,i=e.filter(a=>!a.skipped&&a.mastered).length,s=e.filter(a=>!a.skipped&&!a.mastered).length;return t==="L"||t==="E"?s===0&&n===0?"L/E-tavoite vaatii ~85\u201395 % YO-kokeessa, t\xE4m\xE4n tunnin sanat ovat sinulla automaattisia. Eteenp\xE4in.":`${s} vaihe${s===1?"":"tta"} j\xE4i alle hallintarajan. L/E-tavoite ei salli horjuvia perusrakenteita, palaa n\xE4ihin huomenna kertauksessa.`:t==="I"||t==="A"?s===0&&n===0?"Hyv\xE4 alku. I/A-tavoite tarvitsee perussanaston tunnistustasolla, olet nyt siell\xE4.":"Et ole yksin. I/A-tavoitteelle riitt\xE4\xE4 tunnistus, ei kaikki sanat tarvitse olla automaattisia heti. Sanat palaavat kertauksessa.":i===e.length?"Tunti meni kuten pitikin. Jatketaan seuraavaan oppituntiin samalla rytmill\xE4.":s>0?`${s} vaihetta j\xE4i alle hallintarajan. Sanat palaavat seuraavassa kertaussessiossa, t\xE4m\xE4 on osa rytmi\xE4, ei takaisku.`:"Tunti suoritettu."}function te(t){let e=t.lesson.side_panel?.tabs||[];if(!e.length)return"";let n=e.map((s,a)=>`
    <button type="button" class="lr-tab ${a===0?"is-active":""}" data-tab="${o(s.id)}">${o(s.title||s.id)}</button>
  `).join(""),i=e.map((s,a)=>`
    <div class="lr-tab-pane ${a===0?"is-active":""}" data-pane="${o(s.id)}">
      ${M(s.content_md||"")}
    </div>
  `).join("");return`
    <aside id="lr-side-panel" class="lr-side-panel ${t.sidePanelOpen?"is-open":""}" aria-hidden="${t.sidePanelOpen?"false":"true"}">
      <div class="lr-side-tabs" role="tablist">${n}</div>
      <div class="lr-side-panes">${i}</div>
    </aside>`}function ne(t,e){e.sidePanelOpen=!e.sidePanelOpen,e.sidePanelOpen?e.sidePanelOpenedAt=Date.now():e.sidePanelOpenedAt&&(e.sidePanelOpenMs+=Date.now()-e.sidePanelOpenedAt,e.sidePanelOpenedAt=0);let n=t.querySelector("#lr-side-panel"),i=t.querySelector("#lr-help-toggle"),s=t.querySelector(".lr-shell--exercise");s&&s.classList.toggle("has-panel-open",e.sidePanelOpen),n&&(n.classList.toggle("is-open",e.sidePanelOpen),n.setAttribute("aria-hidden",e.sidePanelOpen?"false":"true")),i&&(i.setAttribute("aria-expanded",e.sidePanelOpen?"true":"false"),i.textContent=e.sidePanelOpen?"\u2715 Sulje":"\u{1F4D6} Apua"),t.querySelectorAll(".lr-tab").forEach(a=>{a.onclick=()=>{t.querySelectorAll(".lr-tab").forEach(c=>c.classList.toggle("is-active",c===a));let l=a.dataset.tab;t.querySelectorAll(".lr-tab-pane").forEach(c=>c.classList.toggle("is-active",c.dataset.pane===l))}})}function se(t){let e=t.slice();for(let n=e.length-1;n>0;n--){let i=Math.floor(Math.random()*(n+1));[e[n],e[i]]=[e[i],e[n]]}return e}function M(t){if(!t)return"";let e=String(t).split(/\r?\n/),n=[],i=[],s=!1,a=()=>{i.length&&(n.push(`<p>${c(i.join(" "))}</p>`),i=[])},l=()=>{s&&(n.push("</ul>"),s=!1)};function c(u){let r=o(u);return r=r.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),r=r.replace(/\*([^*]+)\*/g,"<em>$1</em>"),r=r.replace(/`([^`]+)`/g,"<code>$1</code>"),r}for(let u of e){let r=u.replace(/\s+$/,"");if(/^#{1,3}\s/.test(r)){a(),l();let d=r.startsWith("### ")?3:r.startsWith("## ")?2:1;n.push(`<h${d}>${c(r.replace(/^#{1,3}\s+/,""))}</h${d}>`)}else/^\s*[-*]\s+/.test(r)?(a(),s||(n.push("<ul>"),s=!0),n.push(`<li>${c(r.replace(/^\s*[-*]\s+/,""))}</li>`)):/^\s*$/.test(r)?(a(),l()):(l(),i.push(r))}return a(),l(),n.join(`
`)}export{pe as runPregeneratedLesson};
//# sourceMappingURL=app-lessonRunner-5Q5UJJ6G.js.map
