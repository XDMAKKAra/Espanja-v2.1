import{a as $,c as I,e as w,i as x}from"./app-chunk-FQ6ADMMO.js";import{b as _}from"./app-chunk-6FS5BSBG.js";function L(t,e){let n=t?.mastery_threshold;return n?typeof n[e]=="number"?n[e]:n.B??.7:.7}function P(t,e){let n=t?.skip_for_targets;return Array.isArray(n)&&n.includes(e)}var v="lesson-runner-root";function c(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function k(t){return String(t||"").toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ")}function E(t,e){let n=k(t);return n?(e||[]).some(s=>k(s)===n):!1}function T(t,e,n,s){let a=(t.phases||[]).filter(i=>!P(i,e));return{lesson:t,kurssiKey:n,lessonIndex:s,targetGrade:e,phases:a,currentPhaseIdx:0,currentItemIdx:0,correctInPhase:0,answeredInPhase:0,phaseResults:[],sidePanelOpen:!1,sidePanelOpenMs:0,sidePanelOpenedAt:0,startedAt:Date.now(),finished:!1}}function ae(t,e,n,s){let a=t.pregenerated||t;M(),_("screen-lesson");let i=document.getElementById(v);if(!i)return;let o=T(a,s||"B",e,n);try{sessionStorage.setItem("currentLesson",JSON.stringify({kurssiKey:e,lessonIndex:n,lessonFocus:a.meta?.title||"",lessonType:a.meta?.lesson_type||"",targetGrade:o.targetGrade,isPregenerated:!0}));let l=a.teaching||{},p=String(l.intro_md||"").trim(),r=Array.isArray(l.key_points)?l.key_points:[],d=[p,r.length?`## Avainkohdat
`+r.map(u=>`- ${u}`).join(`
`):""].filter(Boolean).join(`

`);d?sessionStorage.setItem("currentLessonTeachingMd",d):sessionStorage.removeItem("currentLessonTeachingMd")}catch{}B(i,o)}function M(){let t=document.getElementById("screen-lesson");t||(t=document.createElement("div"),t.id="screen-lesson",t.className="screen",document.querySelector(".app-main")?.appendChild(t)||document.body.appendChild(t)),document.getElementById(v)||(t.innerHTML=`<div id="${v}"></div>`)}function B(t,e){let n=e.lesson.meta||{},s=e.lesson.teaching||{},a=O(s.intro_md||""),i=Array.isArray(s.key_points)?s.key_points:[],o=i.length?`<ul class="lr-keypoints">${i.map(l=>`<li>${c(l)}</li>`).join("")}</ul>`:"";t.innerHTML=`
    <div class="lr-shell">
      <button type="button" class="lr-back" id="lr-back">\u2190 Oppimispolku</button>
      <header class="lr-hero">
        <p class="lr-eyebrow">${c(n.course_key||"")} \xB7 Oppitunti ${c(String(n.lesson_index||""))}</p>
        <h1>${c(n.title||"Oppitunti")}</h1>
        ${n.description?`<p class="lr-desc">${c(n.description)}</p>`:""}
      </header>
      <article class="lr-teaching">${a}${o}</article>
      <div class="lr-actions">
        <button type="button" class="btn btn-primary" id="lr-start">Aloita harjoittelu \u2192</button>
        <p class="lr-hint">Voit avata Apua-paneelin milloin tahansa harjoituksen aikana.</p>
      </div>
    </div>`,document.getElementById("lr-back")?.addEventListener("click",()=>{import("./app-curriculum-E34BMBHJ.js").then(l=>l.loadCurriculum())}),document.getElementById("lr-start")?.addEventListener("click",()=>{e.startedAt=Date.now(),b(t,e)})}function b(t,e){let n=e.phases[e.currentPhaseIdx];if(!n)return A(t,e);let s=e.phases.length,a=q(e),i=n.items[e.currentItemIdx];if(!i)return y(t,e,n,"completed");t.innerHTML=`
    <div class="lr-shell lr-shell--exercise">
      <div class="lr-topbar">
        <button type="button" class="lr-exit-btn" id="lr-exit-lesson" aria-label="Takaisin oppimispolulle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          <span>Oppimispolku</span>
        </button>
        <div class="lr-topbar-progress">
          <span class="lr-step-label">Vaihe ${e.currentPhaseIdx+1} / ${s}</span>
          ${a}
        </div>
        <div class="lr-topbar-actions">
          <button type="button" class="lr-help-btn" id="lr-help-toggle" aria-expanded="${e.sidePanelOpen?"true":"false"}" aria-controls="lr-side-panel">\u{1F4D6} Apua</button>
          <button type="button" class="lr-skip-btn" id="lr-skip">Olen valmis t\xE4st\xE4</button>
        </div>
      </div>
      <header class="lr-phase-head">
        <h2 class="lr-phase-title">${c(n.title||"Vaihe")}</h2>
        ${n.instruction?`<p class="lr-phase-instr">${c(n.instruction)}</p>`:""}
        <p class="lr-item-counter">Kysymys ${e.currentItemIdx+1} / ${n.items.length}</p>
      </header>
      <div class="lr-item" id="lr-item">${C(i,e)}</div>
      ${Q(e)}
    </div>`,V(t,e,i)}function q(t){return`<span class="lr-stepper" aria-hidden="true">${t.phases.map((n,s)=>s<t.currentPhaseIdx?'<span class="lr-step lr-step--done" aria-hidden="true">\u25CF</span>':s===t.currentPhaseIdx?'<span class="lr-step lr-step--current" aria-hidden="true">\u25CF</span>':'<span class="lr-step" aria-hidden="true">\u25CB</span>').join("")}</span>`}function C(t,e){switch(t.item_type){case"mc":return H(t);case"typed":return S(t);case"translate":return N(t);case"match":return F(t);case"gap_fill":return D(t);case"writing":return R(t);case"reading_mc":return K(t);default:return`<p class="lr-unsupported">Teht\xE4v\xE4tyyppi\xE4 "${c(t.item_type||"?")}" ei tueta \u2014 ohitetaan.</p>
        <button type="button" class="btn btn-primary" data-lr-skip-item>Jatka</button>`}}function H(t){return`
    <div class="lr-mc">
      ${t.context?`<p class="lr-mc-context">${c(t.context)}</p>`:""}
      <p class="lr-mc-stem">${c(t.stem||"")}</p>
      <div class="lr-mc-choices" role="radiogroup">
        ${(t.choices||[]).map((n,s)=>`
          <button type="button" class="lr-mc-choice" data-mc-idx="${s}" role="radio" aria-checked="false">${c(n)}</button>
        `).join("")}
      </div>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function S(t){return`
    <div class="lr-typed">
      <p class="lr-typed-dir">${t.direction==="es_to_fi"?"K\xE4\xE4nn\xE4 suomeksi":"K\xE4\xE4nn\xE4 espanjaksi"}</p>
      <p class="lr-typed-prompt">${c(t.prompt||"")}</p>
      ${t.hint?`<p class="lr-typed-hint">Vihje: ${c(t.hint)}</p>`:""}
      <input type="text" class="lr-typed-input" id="lr-typed-input" autocomplete="off" autocapitalize="off" spellcheck="false" />
      <button type="button" class="btn btn-primary" id="lr-typed-submit">Tarkista</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function N(t){return S({...t,prompt:t.source})}function F(t){let e=(t.pairs||[]).map(s=>s.left),n=Z((t.pairs||[]).map(s=>s.right));return`
    <div class="lr-match" data-match>
      <p class="lr-match-instr">Yhdist\xE4 parit klikkaamalla.</p>
      <div class="lr-match-cols">
        <div class="lr-match-col">
          ${e.map((s,a)=>`<button type="button" class="lr-match-cell" data-side="left" data-idx="${a}">${c(s)}</button>`).join("")}
        </div>
        <div class="lr-match-col">
          ${n.map(s=>`<button type="button" class="lr-match-cell" data-side="right" data-val="${c(s)}">${c(s)}</button>`).join("")}
        </div>
      </div>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function D(t){let e=t.sentence_template||"",n=c(e).replace(/\{(\d+)\}/g,(a,i)=>`<input type="text" class="lr-gap-input" data-gap="${i}" autocomplete="off" autocapitalize="off" spellcheck="false" />`),s=Array.isArray(t.word_bank)&&t.word_bank.length?`<div class="lr-gap-bank">${t.word_bank.map(a=>`<span class="lr-gap-chip">${c(a)}</span>`).join("")}</div>`:"";return`
    <div class="lr-gap">
      <p class="lr-gap-sentence">${n}</p>
      ${s}
      <button type="button" class="btn btn-primary" id="lr-gap-submit">Tarkista</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function R(t){return`
    <div class="lr-writing">
      <p class="lr-writing-prompt">${c(t.prompt||"")}</p>
      <p class="lr-writing-meta">${t.min_words||0}\u2013${t.max_words||0} sanaa</p>
      <textarea class="lr-writing-input" id="lr-writing-input" rows="8"></textarea>
      <button type="button" class="btn btn-primary" id="lr-writing-submit">L\xE4het\xE4</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function K(t){let e=c(t.passage||"").replace(/\n/g,"<br>"),n=(t.questions||[]).map((s,a)=>`
    <fieldset class="lr-reading-q" data-q="${a}">
      <legend>${c(s.question_fi||"")}</legend>
      ${(s.choices||[]).map((i,o)=>`
        <label class="lr-reading-choice"><input type="radio" name="lr-q-${a}" value="${o}"> ${c(i)}</label>
      `).join("")}
    </fieldset>
  `).join("");return`
    <div class="lr-reading">
      <article class="lr-reading-passage">${e}</article>
      <div class="lr-reading-qs">${n}</div>
      <button type="button" class="btn btn-primary" id="lr-reading-submit">Tarkista vastaukset</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`}function V(t,e,n){if(document.getElementById("lr-help-toggle")?.addEventListener("click",()=>X(t,e)),document.getElementById("lr-skip")?.addEventListener("click",()=>U(t,e)),document.getElementById("lr-exit-lesson")?.addEventListener("click",async()=>{let{confirmDialog:s}=await import("./app-confirmDialog-GUM7D5P4.js");await s({title:"Lopetetaanko oppitunti?",body:"Edistyminen t\xE4ll\xE4 oppitunnilla ei tallennu jos l\xE4hdet nyt. Voit aloittaa tunnin alusta uudelleen my\xF6hemmin.",confirmLabel:"L\xE4hde takaisin",cancelLabel:"Jatka oppituntia"})&&(await import("./app-curriculum-E34BMBHJ.js")).loadCurriculum()}),t.querySelector("[data-lr-skip-item]")?.addEventListener("click",()=>g(t,e,!0)),n.item_type==="mc")t.querySelectorAll(".lr-mc-choice").forEach(s=>{s.addEventListener("click",()=>{let a=Number(s.dataset.mcIdx),i=a===Number(n.correct_index);h(t,i,n.explanation||""),Y(t,n.correct_index,a),f(e,i),m(t,e)})});else if(n.item_type==="typed"||n.item_type==="translate"){let s=document.getElementById("lr-typed-input"),a=document.getElementById("lr-typed-submit"),i=()=>{let o=(n.item_type==="translate",n.accept),l=E(s.value,o),p=o&&o[0]||"";h(t,l,l?"":`Oikea vastaus: ${p}`),f(e,l),m(t,e)};a?.addEventListener("click",i),s?.addEventListener("keydown",o=>{o.key==="Enter"&&i()}),s?.focus()}else n.item_type==="match"?z(t,e,n):n.item_type==="gap_fill"?document.getElementById("lr-gap-submit")?.addEventListener("click",()=>{let s=t.querySelectorAll(".lr-gap-input"),a=!0,i=[];s.forEach((o,l)=>{let p=n.answers&&n.answers[l]||[];E(o.value,p)||(a=!1),i.push(p[0]||"?")}),h(t,a,a?"":`Oikeat vastaukset: ${i.join(", ")}`),f(e,a),m(t,e)}):n.item_type==="writing"?document.getElementById("lr-writing-submit")?.addEventListener("click",()=>{let a=((document.getElementById("lr-writing-input")?.value||"").trim().match(/\S+/g)||[]).length,i=a>=(n.min_words||0);h(t,i,i?"Kirjoituksesi on tallennettu.":`Sanam\xE4\xE4r\xE4 on ${a} \u2014 tavoite v\xE4hint\xE4\xE4n ${n.min_words}.`),f(e,i),m(t,e)}):n.item_type==="reading_mc"&&document.getElementById("lr-reading-submit")?.addEventListener("click",()=>{let s=0,a=(n.questions||[]).length;(n.questions||[]).forEach((o,l)=>{let p=t.querySelector(`input[name="lr-q-${l}"]:checked`);p&&Number(p.value)===Number(o.correct_index)&&s++});let i=s===a;h(t,i,i?"Kaikki oikein.":`${s}/${a} oikein.`),e.correctInPhase+=s/a,e.answeredInPhase+=1,m(t,e,!1)})}function z(t,e,n){let s=null,a=new Set,i=(n.pairs||[]).length,o=0;t.querySelectorAll(".lr-match-cell").forEach(l=>{l.addEventListener("click",()=>{if(a.has(l))return;if(l.dataset.side==="left")t.querySelectorAll('.lr-match-cell[data-side="left"]').forEach(r=>r.classList.remove("is-active")),l.classList.add("is-active"),s=l;else if(s){let r=Number(s.dataset.idx),d=n.pairs[r]?.right,u=l.dataset.val;d&&u&&k(d)===k(u)?(s.classList.add("is-matched"),l.classList.add("is-matched"),a.add(s),a.add(l),s=null,o++,o===i&&(h(t,!0,"Kaikki parit oikein."),f(e,!0),m(t,e))):(l.classList.add("is-wrong"),setTimeout(()=>l.classList.remove("is-wrong"),600))}})})}var J='<svg class="lr-feedback__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',W='<svg class="lr-feedback__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';function h(t,e,n){let s=t.querySelector("#lr-feedback");if(!s)return;s.hidden=!1,s.className=`lr-feedback ${e?"is-correct":"is-wrong"}`,s.setAttribute("role","status"),s.setAttribute("aria-live",e?"polite":"assertive");let a=e?n||"Hyvin meni!":n||"Melkein \u2014 yrit\xE4 uudelleen.";s.innerHTML=`${e?J:W}<span class="lr-feedback__text">${c(a)}</span>`,s.classList.remove("lr-feedback--animate"),s.offsetWidth,s.classList.add("lr-feedback--animate")}function Y(t,e,n){t.querySelectorAll(".lr-mc-choice").forEach(s=>{let a=Number(s.dataset.mcIdx);s.disabled=!0,a===e&&s.classList.add("is-correct"),a===n&&n!==e&&s.classList.add("is-wrong")})}function f(t,e){t.answeredInPhase+=1,e&&(t.correctInPhase+=1)}function m(t,e,n=!0){setTimeout(()=>g(t,e,!1),1100)}function g(t,e,n){let s=e.phases[e.currentPhaseIdx];if(e.currentItemIdx+=1,e.currentItemIdx>=s.items.length)return y(t,e,s,"completed");b(t,e)}function y(t,e,n,s){let a=e.answeredInPhase||n.items.length,i=Math.round(e.correctInPhase),o=a>0?e.correctInPhase/a:0,l=L(n,e.targetGrade),p=s==="skipped",r=!p&&o>=l;e.phaseResults.push({phaseId:n.phase_id,title:n.title,correct:i,total:a,pct:o,threshold:l,mastered:r,skipped:p});let d,u;p?(d="Vaihe ohitettu",u="Sanat palaavat kertaussessioon my\xF6hemmin \u2014 niit\xE4 ei j\xE4tet\xE4 unohduksiin."):r?(d="Hallitset t\xE4m\xE4n",u=`Sait ${i} / ${a} oikein \u2014 jatketaan seuraavaan vaiheeseen.`):o>=.5?(d="L\xE4hell\xE4 \u2014 viel\xE4 yksi pyyhk\xE4isy",u=`${i} / ${a} oikein. Sanat joissa horjuit palaavat seuraavissa vaiheissa.`):(d="T\xE4m\xE4 kaipaa toistoa",u=`${i} / ${a} oikein. Et ole yksin \u2014 t\xE4m\xE4 rakenne vaatii toistoa, ei eri s\xE4\xE4nt\xF6\xE4.`);let j=e.currentPhaseIdx+1>=e.phases.length;t.innerHTML=`
    <div class="lr-shell lr-shell--banner">
      <div class="lr-banner ${r?"is-mastered":p?"is-skipped":"is-almost"}">
        <p class="lr-banner-eyebrow">${c(n.title||"Vaihe")}</p>
        <h2>${c(d)}</h2>
        <p>${c(u)}</p>
        <button type="button" class="btn btn-primary" id="lr-next">${j?"N\xE4yt\xE4 yhteenveto":"Seuraava vaihe \u2192"}</button>
      </div>
    </div>`,document.getElementById("lr-next")?.addEventListener("click",()=>{e.currentPhaseIdx+=1,e.currentItemIdx=0,e.correctInPhase=0,e.answeredInPhase=0,e.currentPhaseIdx>=e.phases.length?A(t,e):b(t,e)})}function U(t,e){if(!window.confirm("Ohita t\xE4m\xE4 vaihe? Sanat palaavat kertaussessioon my\xF6hemmin."))return;let s=e.phases[e.currentPhaseIdx];y(t,e,s,"skipped")}function A(t,e){if(e.finished)return;e.finished=!0;let n=e.phaseResults.reduce((r,d)=>r+(d.skipped?0:d.correct),0),s=e.phaseResults.reduce((r,d)=>r+(d.skipped?0:d.total),0),a=Math.max(1,Math.round((Date.now()-e.startedAt)/6e4)),i=e.targetGrade,o=G(i,e.phaseResults),l=e.lesson.meta?.yo_relevance||"",p=e.phaseResults.map(r=>{let d=r.skipped?"lr-result-skipped":r.mastered?"lr-result-mastered":"lr-result-almost",u=r.skipped?"Ohitettu":r.mastered?"Hallitset":"L\xE4hell\xE4";return`<li class="lr-result-row ${d}">
      <span class="lr-result-title">${c(r.title||"")}</span>
      <span class="lr-result-status">${u}${r.skipped?"":` \xB7 ${r.correct}/${r.total}`}</span>
    </li>`}).join("");t.innerHTML=`
    <div class="lr-shell lr-shell--results">
      <header class="lr-hero">
        <p class="lr-eyebrow">Yhteenveto</p>
        <h1>${c(e.lesson.meta?.title||"Oppitunti")}</h1>
      </header>
      <div class="lr-result-summary">
        <div class="lr-result-stat"><span class="lr-result-num">${n}/${s||0}</span><span class="lr-result-lbl">oikein</span></div>
        <div class="lr-result-stat"><span class="lr-result-num">${a}</span><span class="lr-result-lbl">min</span></div>
      </div>
      <div class="lr-tutor">${c(o)}</div>
      ${l?`<aside class="lr-yo">
        <p class="lr-yo-eyebrow">T\xE4m\xE4 YO-kokeessa</p>
        <p>${c(l)}</p>
      </aside>`:""}
      <ol class="lr-results-list">${p}</ol>
      <div class="lr-actions">
        <button type="button" class="btn btn-primary" id="lr-done">Takaisin oppimispolulle \u2192</button>
      </div>
    </div>`,document.getElementById("lr-done")?.addEventListener("click",()=>{import("./app-curriculum-E34BMBHJ.js").then(r=>r.loadCurriculum())}),I()&&s>0&&x(`${$}/api/curriculum/${encodeURIComponent(e.kurssiKey)}/lesson/${e.lessonIndex}/complete`,{method:"POST",headers:{"Content-Type":"application/json",...w()},body:JSON.stringify({scoreCorrect:n,scoreTotal:s,wrongAnswers:[],reviewItems:[]})}).catch(()=>{})}function G(t,e){let n=e.filter(i=>i.skipped).length,s=e.filter(i=>!i.skipped&&i.mastered).length,a=e.filter(i=>!i.skipped&&!i.mastered).length;return t==="L"||t==="E"?a===0&&n===0?"L/E-tavoite vaatii ~85\u201395 % YO-kokeessa \u2014 t\xE4m\xE4n tunnin sanat ovat sinulla automaattisia. Eteenp\xE4in.":`${a} vaihe${a===1?"":"tta"} j\xE4i alle hallintarajan. L/E-tavoite ei salli horjuvia perusrakenteita \u2014 palaa n\xE4ihin huomenna kertauksessa.`:t==="I"||t==="A"?a===0&&n===0?"Hyv\xE4 alku. I/A-tavoite tarvitsee perussanaston tunnistustasolla \u2014 olet nyt siell\xE4.":"Et ole yksin. I/A-tavoitteelle riitt\xE4\xE4 tunnistus, ei kaikki sanat tarvitse olla automaattisia heti. Sanat palaavat kertauksessa.":s===e.length?"Tunti meni kuten pitikin. Jatketaan seuraavaan oppituntiin samalla rytmill\xE4.":a>0?`${a} vaihetta j\xE4i alle hallintarajan. Sanat palaavat seuraavassa kertaussessiossa \u2014 t\xE4m\xE4 on osa rytmi\xE4, ei takaisku.`:"Tunti suoritettu."}function Q(t){let e=t.lesson.side_panel?.tabs||[];if(!e.length)return"";let n=e.map((a,i)=>`
    <button type="button" class="lr-tab ${i===0?"is-active":""}" data-tab="${c(a.id)}">${c(a.title||a.id)}</button>
  `).join(""),s=e.map((a,i)=>`
    <div class="lr-tab-pane ${i===0?"is-active":""}" data-pane="${c(a.id)}">
      ${O(a.content_md||"")}
    </div>
  `).join("");return`
    <aside id="lr-side-panel" class="lr-side-panel ${t.sidePanelOpen?"is-open":""}" aria-hidden="${t.sidePanelOpen?"false":"true"}">
      <div class="lr-side-tabs" role="tablist">${n}</div>
      <div class="lr-side-panes">${s}</div>
    </aside>`}function X(t,e){e.sidePanelOpen=!e.sidePanelOpen,e.sidePanelOpen?e.sidePanelOpenedAt=Date.now():e.sidePanelOpenedAt&&(e.sidePanelOpenMs+=Date.now()-e.sidePanelOpenedAt,e.sidePanelOpenedAt=0);let n=t.querySelector("#lr-side-panel"),s=t.querySelector("#lr-help-toggle"),a=t.querySelector(".lr-shell--exercise");a&&a.classList.toggle("has-panel-open",e.sidePanelOpen),n&&(n.classList.toggle("is-open",e.sidePanelOpen),n.setAttribute("aria-hidden",e.sidePanelOpen?"false":"true")),s&&(s.setAttribute("aria-expanded",e.sidePanelOpen?"true":"false"),s.textContent=e.sidePanelOpen?"\u2715 Sulje":"\u{1F4D6} Apua"),t.querySelectorAll(".lr-tab").forEach(i=>{i.onclick=()=>{t.querySelectorAll(".lr-tab").forEach(l=>l.classList.toggle("is-active",l===i));let o=i.dataset.tab;t.querySelectorAll(".lr-tab-pane").forEach(l=>l.classList.toggle("is-active",l.dataset.pane===o))}})}function Z(t){let e=t.slice();for(let n=e.length-1;n>0;n--){let s=Math.floor(Math.random()*(n+1));[e[n],e[s]]=[e[s],e[n]]}return e}function O(t){if(!t)return"";let e=String(t).split(/\r?\n/),n=[],s=[],a=!1,i=()=>{s.length&&(n.push(`<p>${l(s.join(" "))}</p>`),s=[])},o=()=>{a&&(n.push("</ul>"),a=!1)};function l(p){let r=c(p);return r=r.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),r=r.replace(/\*([^*]+)\*/g,"<em>$1</em>"),r=r.replace(/`([^`]+)`/g,"<code>$1</code>"),r}for(let p of e){let r=p.replace(/\s+$/,"");if(/^#{1,3}\s/.test(r)){i(),o();let d=r.startsWith("### ")?3:r.startsWith("## ")?2:1;n.push(`<h${d}>${l(r.replace(/^#{1,3}\s+/,""))}</h${d}>`)}else/^\s*[-*]\s+/.test(r)?(i(),a||(n.push("<ul>"),a=!0),n.push(`<li>${l(r.replace(/^\s*[-*]\s+/,""))}</li>`)):/^\s*$/.test(r)?(i(),o()):(o(),s.push(r))}return i(),o(),n.join(`
`)}export{ae as runPregeneratedLesson};
//# sourceMappingURL=app-lessonRunner-7OFAMB5F.js.map
