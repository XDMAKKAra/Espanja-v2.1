import{b as V}from"./app-chunk-AE7C6F2Z.js";import{a as S,c as K,d as R,e as I,j as E}from"./app-chunk-ECRDZOTG.js";import{b as re}from"./app-chunk-3WC2U67L.js";function Qe(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function b(e){let t=Qe(e);return t=t.replace(/`([^`]+)`/g,'<code class="dk__teoria-code">$1</code>'),t=t.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),t=t.replace(/\*([^*\n]+)\*/g,"<em>$1</em>"),t=t.replace(/(^|\s)_([^_\n]+)_(?=\s|[.,;:!?]|$)/g,"$1<em>$2</em>"),t}function oe(e){return/^\s*\|?\s*:?-{2,}:?(\s*\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(e)}function ce(e){return e.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(s=>s.trim())}function et(e,t){let s=ce(e),n=t.map(ce),i=s.map(o=>`<th>${b(o)}</th>`).join(""),a=n.map(o=>`<tr>${o.map(c=>`<td>${b(c)}</td>`).join("")}</tr>`).join("");return`<div class="dk__bilingual${s.length===2?" dk__bilingual--2col":""}"><table><thead><tr>${i}</tr></thead><tbody>${a}</tbody></table></div>`}function tt(e){return`
    <aside class="dk__obs" role="note" aria-label="Huomio">
      <span class="dk__obs-label">Obs!</span>
      <div class="dk__obs-body">${e.map(n=>n.replace(/^>\s?/,"")).join(" ").trim().split(/\n{2,}|(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ])/g).map(n=>n.trim()).filter(Boolean).map(n=>`<p>${b(n)}</p>`).join("")}</div>
    </aside>`}function st(e){return`<ul class="dk__teoria-ul">${e.map(s=>`<li>${b(s.replace(/^[-*]\s+/,""))}</li>`).join("")}</ul>`}function de(e){if(!e||typeof e!="string")return"";let t=e.replace(/\r\n?/g,`
`).split(`
`),s=[],n=0,i=!1;for(;n<t.length;){let a=t[n];if(/^\s*$/.test(a)){n++;continue}let r=/^(#{1,6})\s+(.*)$/.exec(a);if(r){let d=r[1].length,c=r[2].trim();if(d===1&&!i){i=!0,n++;continue}d===2?s.push(`<h3 class="dk__teoria-h2">${b(c)}</h3>`):d===3?s.push(`<h4 class="dk__teoria-h3">${b(c)}</h4>`):s.push(`<h${Math.min(d+1,6)} class="dk__teoria-h">${b(c)}</h${Math.min(d+1,6)}>`),n++;continue}if(/^\s*>\s?/.test(a)){let d=[];for(;n<t.length&&/^\s*>\s?/.test(t[n]);)d.push(t[n]),n++;s.push(tt(d));continue}if(/^\s*\|/.test(a)&&n+1<t.length&&oe(t[n+1])){let d=a,c=[];for(n+=2;n<t.length&&/^\s*\|/.test(t[n]);)c.push(t[n]),n++;s.push(et(d,c));continue}if(/^\s*[-*]\s+/.test(a)){let d=[];for(;n<t.length&&/^\s*[-*]\s+/.test(t[n]);)d.push(t[n]),n++;s.push(st(d));continue}let o=[a];for(n++;n<t.length&&!/^\s*$/.test(t[n])&&!/^(#{1,6})\s+/.test(t[n])&&!/^\s*>\s?/.test(t[n])&&!/^\s*[-*]\s+/.test(t[n])&&!(/^\s*\|/.test(t[n])&&n+1<t.length&&oe(t[n+1]));)o.push(t[n]),n++;s.push(`<p class="dk__teoria-p">${b(o.join(" "))}</p>`)}return s.join(`
`)}var me="puheo:dk:sidemenu",A="open",$="collapsed",nt="puheo:dk:progress";function fe(){return`${nt}:${p.lang}:${p.kurssiKey}:${p.lessonIndex}`}function P(){try{return JSON.parse(localStorage.getItem(fe())||"{}")}catch{return{}}}function ve(e){try{localStorage.setItem(fe(),JSON.stringify(e))}catch{}}function x(e){if(!e)return;let t=P();t[e]!=="done"&&(t[e]="done",ve(t),K()&&E(`${S}/api/digikirja/progress`,{method:"POST",headers:{"Content-Type":"application/json",...I()},body:JSON.stringify({lang:p.lang,kurssi:p.kurssiKey,lesson:p.lessonIndex,sivuId:e})}).catch(()=>{}),Q())}function Q(){let e=P(),t=document.getElementById("dk-sidemenu-list");t&&t.querySelectorAll(".dk__row").forEach(n=>{n.classList.toggle("is-done",e[n.dataset.sivu]==="done")});let s=document.getElementById("dk-progress-chip");if(s){let n=k.filter(i=>e[i.id]==="done").length;s.textContent=`${n} / ${k.length} valmis`,s.dataset.full=n>=k.length?"true":"false"}}var at=[[/^YO-tyylinen käännös$/i,"K\xE4\xE4nn\xE4 lauseet"],[/^YO-tason käännös$/i,"K\xE4\xE4nn\xE4 lauseet"],[/^Lyhyt kirjoitus$/i,"Kirjoita lyhyt teksti"],[/^Lauseiden rakentelua$/i,"K\xE4\xE4nn\xE4 lauseet"],[/^Lauseen rakentelua$/i,"K\xE4\xE4nn\xE4 lauseet"],[/Lauseen täydennys\s*[—-]\s*/g,"Lauseen t\xE4ydennys, "],[/Tunnista\s*[—-]\s*/g,"Tunnista "],[/Tuota\s*[—-]\s*/g,"Tuota "],[/Yhdistä\s*[—-]\s*/g,"Yhdist\xE4 "],[/Käännä\s*[—-]\s*/g,"K\xE4\xE4nn\xE4 "]];function it(e){if(!e)return"";let t=String(e);for(let[s,n]of at)t=t.replace(s,n);return t=t.replace(/\s+—\s+/g,", "),t}var rt={teoria:"Opetus",tehtava:"Harjoitukset",flashcards:"Kortit",testi:"Testit",itsearviointi:"Itsearvio"};var ge=5,ot="puheo:dk:flashcards",le={},ye=!1,p={lang:"es",kurssiKey:"kurssi_2",lessonIndex:3,sivuId:"teoria"},g=null,k=[],F="";function l(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function ct(){try{return localStorage.getItem(me)===A?A:$}catch{return A}}function dt(e){try{localStorage.setItem(me,e)}catch{}}function lt(e){return e==="fr"?"Ranska":e==="de"?"Saksa":"Espanja"}function ut(e){return`/data/courses/${encodeURIComponent(e.lang)}/${encodeURIComponent(e.kurssiKey)}/lesson_${encodeURIComponent(e.lessonIndex)}.json`}async function pt(e){let t=ut(e),s=await fetch(t,{headers:{accept:"application/json"}});if(!s.ok)throw new Error(`lesson fetch ${s.status}`);return s.json()}async function _t(e){if(K())try{let t=`lang=${encodeURIComponent(e.lang)}&kurssi=${encodeURIComponent(e.kurssiKey)}&lesson=${encodeURIComponent(e.lessonIndex)}`,[s,n]=await Promise.all([E(`${S}/api/digikirja/progress?${t}`,{headers:I()}).catch(()=>null),E(`${S}/api/digikirja/itsearvio?${t}`,{headers:I()}).catch(()=>null)]);if(s?.ok){let{sivut:i}=await s.json().catch(()=>({sivut:{}}));if(i&&typeof i=="object"){let a=P();for(let r of Object.keys(i))a[r]||(a[r]="done");ve(a)}}if(n?.ok){let{itsearvio:i}=await n.json().catch(()=>({itsearvio:null}));i?.ratings&&(te()||Ee({ratings:i.ratings,submittedAt:i.submittedAt,lang:e.lang,kurssiKey:e.kurssiKey,lessonIndex:e.lessonIndex}))}}catch{}}function kt(e){let t=[];t.push({id:"teoria",kind:"teoria",num:"",title:e?.meta?.title||"Opetus",meta:"Opetussivu"}),(Array.isArray(e?.phases)?e.phases:[]).forEach((o,d)=>{let c=String(d+1),u=it(o.title)||`Vaihe ${c}`,_=Array.isArray(o.items)?o.items.length:0;t.push({id:`phase-${d}`,kind:"tehtava",num:c,title:u,meta:_?`${_} kohtaa`:"Teht\xE4v\xE4"})});let n=e?.meta?.lesson_type||"vocab",i=new Set(["vocab","mixed"]),a=Array.isArray(e?.vocab)?e.vocab:[],r=Math.min(a.length,ge);return r>0&&i.has(n)&&t.push({id:"kortit-1",kind:"flashcards",num:"",title:`K\xE4\xE4nt\xF6kortit \xB7 ${e?.meta?.title||""}`.trim(),meta:`${r} korttia`}),t}function y(e){let t=k.findIndex(s=>s.id===e);return t>=0?t:0}function ht(){let t=(g?.meta||{}).title||"Oppitunti";return`
    <header class="dk__topbar" role="banner">
      <div class="dk__topbar-left">
        <button type="button" class="dk__tool dk__tool--invert" id="dk-toggle-sidemenu"
                aria-label="Avaa tai sulje sis\xE4llysluettelo"
                aria-pressed="false">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="4" y1="12" x2="14" y2="12"/>
            <line x1="4" y1="18" x2="20" y2="18"/>
          </svg>
        </button>
        <button type="button" class="dk__home" data-dk-nav="home" aria-label="Palaa Aloitukseen">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m3 11 9-8 9 8"/>
            <path d="M5 9v11a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V9"/>
          </svg>
          <span>Aloitus</span>
        </button>
      </div>
      <h1 class="dk__title">${l(t)}</h1>
      <div class="dk__tools">
        <span class="dk__progress-chip" id="dk-progress-chip" aria-live="polite">0 / 0 valmis</span>
        <button type="button" class="dk__tool dk__tool--invert" id="dk-search" aria-label="Etsi" title="Etsi (tulossa)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/>
            <line x1="16.5" y1="16.5" x2="21" y2="21"/>
          </svg>
        </button>
        <button type="button" class="dk__tool dk__tool--invert" id="dk-help" aria-label="Opas" title="Opas (tulossa)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9"/>
            <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.9.4-1.5 1-1.5 2"/>
            <circle cx="12" cy="17" r="0.5"/>
          </svg>
        </button>
      </div>
    </header>`}function mt(){let e=[],t=null;for(let o of k){let d=rt[o.kind]||"Muut";d!==t&&(e.push({title:d,items:[]}),t=d),e[e.length-1].items.push(o)}let s=P(),n=e.map(o=>{let d=`<span class="dk__group-title">${l(o.title)}</span>`,c=o.items.map(u=>{let _=u.id===p.sivuId,f=s[u.id]==="done",h=["dk__row"];_&&h.push("is-active"),f&&h.push("is-done");let m=u.num?`${l(u.num)} `:"";return`
        <button type="button"
                class="${h.join(" ")}"
                data-sivu="${l(u.id)}"
                data-kind="${l(u.kind)}"
                aria-current="${_?"page":"false"}"
                aria-label="${l(u.title)}${f?", suoritettu":""}">
          <span class="dk__row-bullet" aria-hidden="true"></span>
          <span class="dk__row-title">${m}${l(u.title)}</span>
          ${f?'<span class="dk__row-check" aria-hidden="true">\u2713</span>':""}
        </button>`}).join("");return d+c}).join(""),i=(window._userProfile?.nickname||"").trim();if(!i)try{i=(localStorage.getItem("puheo:nickname")||"").trim()}catch{}let a=typeof R=="function"&&R()||"",r=i||a||"Oma sivu";return`
    <aside class="dk__sidemenu" id="dk-sidemenu" aria-label="Oppitunnin sis\xE4llys">
      <div class="dk__sidemenu-top">
        <a class="dk__sidemenu-logo" href="#home" data-dk-nav="home" aria-label="Puheo etusivulle">Puhe<span>o</span></a>
        <div class="dk__sidemenu-course">${l(lt(p.lang))} \xB7 ${l(p.kurssiKey||"")}</div>
      </div>
      <div class="dk__sidemenu-head">
        <span class="dk__sidemenu-eyebrow">Sis\xE4llys</span>
        <span class="dk__sidemenu-count">${k.length} sivua</span>
      </div>
      <nav class="dk__sidemenu-list" id="dk-sidemenu-list">
        ${n}
      </nav>
      <div class="dk__sidemenu-footer">
        <button type="button" class="dk__sidemenu-user" data-dk-nav="profile" title="${l(r)}">
          <span class="dk__sidemenu-user-text">${l(r)}</span>
        </button>
        <button type="button" class="dk__sidemenu-action" data-dk-nav="settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
          <span>Asetukset</span>
        </button>
        <button type="button" class="dk__sidemenu-action" data-dk-nav="logout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
          <span>Kirjaudu ulos</span>
        </button>
      </div>
    </aside>
    <div class="dk__sidemenu-backdrop" id="dk-sidemenu-backdrop" aria-hidden="true"></div>`}function ft(){let e=document.getElementById("dk-root");e&&e.addEventListener("click",t=>{let s=t.target.closest("[data-dk-nav]");if(!s)return;let n=s.dataset.dkNav;s.tagName==="A"&&t.preventDefault(),n==="home"?document.querySelector('.sidebar-item[data-nav="home"]')?.click()??(location.hash="#home"):n==="settings"?document.querySelector('.sidebar-item[data-nav="settings"]')?.click():n==="profile"?document.querySelector('.sidebar-user[data-nav="profile"], .sidebar-item[data-nav="profile"]')?.click():n==="logout"&&document.getElementById("sidebar-logout")?.click()})}function be(){p.sivuId==="teoria"&&x("teoria")}function vt(){let e=g?.teaching||{},t=e.intro_md||"",s=Array.isArray(e.key_points)?e.key_points:[],n=de(t)||`
    <p class="dk__teoria-p">T\xE4ll\xE4 oppitunnilla ei ole viel\xE4 opetusmateriaalia. Voit siirty\xE4 suoraan harjoituksiin sivuvalikosta.</p>`,i=s.length?`<aside class="dk__key-points" aria-label="Ydinpoiminnat">
         <p class="dk__key-points-title">Muista n\xE4m\xE4</p>
         <ol>${s.map(a=>`<li>${l(a)}</li>`).join("")}</ol>
       </aside>`:"";return n+i}function $e(e){let t=le[e.kind]||le.flashcards;return`
    <div class="dk__placeholder" data-kind="${l(e.kind)}">
      <p class="dk__placeholder-kind">${l(t.label)}</p>
      <p>${l(t.body)}</p>
    </div>`}var Y=new Map;function xe(e){let t=e?.testDef;return t?((Array.isArray(g?.phases)?g.phases:[])[t.sourcePhase]?.items||[]).slice(0,t.count).filter(i=>Oe.has(i.item_type)):[]}function we(e,t){let s=Y.get(e);return s||(s={submitted:!1,answers:t.map(n=>n.item_type==="mc"?null:n.item_type==="gap_fill"?new Array((String(n.sentence_template||"").match(/\{\d+\}/g)||[]).length).fill(""):""),results:t.map(()=>null),scoreCorrect:0},Y.set(e,s)),s}function Se(e){let t=xe(e);if(t.length===0)return`
      <div class="dk__placeholder" data-kind="testi">
        <p>T\xE4ll\xE4 testill\xE4 ei ole viel\xE4 kohtia.</p>
      </div>`;let s=we(e.id,t),n=e.testDef?.label||e.title||"Testi",i=t.map((o,d)=>gt(o,d,s)).join(""),a=s.submitted?yt(t,s):"",r=s.submitted?`<button type="button" class="dk__btn dk__btn--ghost" id="dk-testi-reset">Tee uudelleen</button>
       <button type="button" class="dk__btn dk__btn--primary" id="dk-testi-next-sivu">Seuraava sivu \u2192</button>`:'<button type="button" class="dk__btn dk__btn--primary" id="dk-testi-submit">Tarkista testi</button>';return`
    <section class="dk__testi" data-sivu="${l(e.id)}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Testi \xB7 ${l(n)}</span>
        <span class="dk__exercise-score">${t.length} kohtaa</span>
      </header>
      ${a}
      <ol class="dk__testi-list">${i}</ol>
      <div class="dk__exercise-actions dk__testi-actions">${r}</div>
    </section>`}function gt(e,t,s){let n=s.submitted,i=s.results[t],a=e.item_type==="translate"?e.source||"":e.item_type==="typed"?e.prompt||"":e.item_type==="gap_fill"?null:e.stem||"",r=n?`<span class="dk__feedback-chip ${i?.correct?"is-correct":"is-wrong"}">${i?.correct?"Oikein":"Viel\xE4 ei"}</span>`:`<span class="dk__testi-itemnum">${t+1}</span>`,o="";switch(e.item_type){case"mc":{let c=n?i?.choiceIndex:s.answers[t]===null?-1:s.answers[t],u=e.correct_index;o=`
        <p class="dk__exercise-stem dk__testi-stem">${l(a)}</p>
        <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
          ${(e.choices||[]).map((_,f)=>{let h=c===f,m=f===u,v=["dk__choice"];return n?h&&m?v.push("is-correct"):h&&!m?v.push("is-wrong"):m&&v.push("is-revealed"):h&&v.push("is-selected"),`
              <li>
                <button type="button" class="${v.join(" ")}"
                        data-testi-item="${t}" data-choice="${f}"
                        ${n?"disabled":""}>
                  <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65+f)}</span>
                  <span class="dk__choice-text">${l(_)}</span>
                </button>
              </li>`}).join("")}
        </ol>`;break}case"typed":case"translate":{let c=n?i?.userAnswer||"":s.answers[t]||"";o=`
        <p class="dk__exercise-stem dk__testi-stem">${l(a)}</p>
        <div class="dk__input-row">
          <label class="dk__input-label" for="dk-testi-input-${t}">Vastauksesi</label>
          <${e.item_type==="translate"?`textarea rows="2" id="dk-testi-input-${t}" class="dk__input dk__input--multiline"`:`input id="dk-testi-input-${t}" type="text" class="dk__input"`}
                  data-testi-item="${t}" autocomplete="off" autocapitalize="off" spellcheck="false"
                  ${n?"disabled":""}${e.item_type==="translate"?`>${l(c)}</textarea>`:` value="${l(c)}">`}
        </div>`;break}case"gap_fill":{let c=String(e.sentence_template||""),u=n?i?.userAnswer||[]:s.answers[t]||[],_=0,f=l(c).replace(/\{(\d+)\}/g,()=>{let m=u[_]||"",v=`dk-testi-${t}-gap-${_}`,C=_;return _++,`<input id="${v}" type="text" class="dk__input dk__input--gap"
                       data-testi-item="${t}" data-testi-gap="${C}"
                       autocomplete="off" spellcheck="false"
                       value="${l(m)}" ${n?"disabled":""}>`}),h=Array.isArray(e.word_bank)&&e.word_bank.length?`<ul class="dk__wordbank" aria-label="Sanapankki">
             ${e.word_bank.map(m=>`<li><span>${l(m)}</span></li>`).join("")}
           </ul>`:"";o=`<p class="dk__exercise-stem dk__exercise-stem--gap dk__testi-stem">${f}</p>${h}`;break}default:o=`<p>${l(a)}</p>`}let d=n?`<div class="dk__testi-reveal">
         ${i?.correct?"":`<p class="dk__feedback-expected"><span>Oikea vastaus:</span> ${l(We(e)||"")}</p>`}
         ${e.explanation?`<p class="dk__feedback-text">${l(e.explanation)}</p>`:""}
       </div>`:"";return`
    <li class="dk__testi-item ${n?i?.correct?"is-correct":"is-wrong":""}" data-testi-item="${t}">
      <div class="dk__testi-itemhead">
        ${r}
      </div>
      <div class="dk__testi-itembody">
        ${o}
        ${d}
      </div>
    </li>`}function yt(e,t){let s=e.length,n=t.scoreCorrect,i=s?Math.round(n/s*100):0,a=i>=80?"Hyvin meni.":i>=50?"Hyv\xE4 alku. Kertaa virheelliset kohdat.":"Kertaa viel\xE4 ja yrit\xE4 uudelleen.";return`
    <div class="dk__testi-summary" aria-live="polite">
      <div class="dk__testi-summary-score">
        <span class="dk__testi-summary-num">${n} / ${s}</span>
        <span class="dk__testi-summary-pct">${i}%</span>
      </div>
      <p class="dk__testi-summary-headline">${l(a)}</p>
    </div>`}function bt(e,t){return e.map((n,i)=>{switch(n.item_type){case"mc":return t.answers[i];case"typed":case"translate":{let a=document.getElementById(`dk-testi-input-${i}`);return a?a.value:""}case"gap_fill":return[...document.querySelectorAll(`[data-testi-item="${i}"][data-testi-gap]`)].map(r=>r.value);default:return null}})}function ue(){let e=y(p.sivuId),t=k[e],s=document.querySelector(".dk__content .dk__testi");if(!s)return;let n=document.createElement("div");n.innerHTML=Se(t),s.replaceWith(n.firstElementChild),Ie()}function Ie(){let e=document.querySelector(".dk__testi");if(!e)return;let t=e.dataset.sivu,s=k.find(a=>a.id===t),n=xe(s),i=we(t,n);e.querySelectorAll(".dk__choice[data-testi-item]").forEach(a=>{a.addEventListener("click",()=>{if(i.submitted)return;let r=Number(a.dataset.testiItem),o=Number(a.dataset.choice);i.answers[r]=o,e.querySelector(`.dk__testi-item[data-testi-item="${r}"]`)?.querySelectorAll(".dk__choice").forEach(c=>{c.classList.toggle("is-selected",Number(c.dataset.choice)===o)})})}),document.getElementById("dk-testi-submit")?.addEventListener("click",()=>{if(i.submitted)return;i.answers=bt(n,i);let a=0;i.results=n.map((r,o)=>{let d=Z(r,i.answers[o]);return d.correct&&a++,d}),i.scoreCorrect=a,i.submitted=!0,x(t),ue(),requestAnimationFrame(()=>{document.querySelector(".dk__testi-summary")?.scrollIntoView({block:"start",behavior:"smooth"})})}),document.getElementById("dk-testi-reset")?.addEventListener("click",()=>{Y.delete(t),ue()}),document.getElementById("dk-testi-next-sivu")?.addEventListener("click",()=>{let a=y(p.sivuId),r=k[a+1];r&&w(r.id)})}var $t="puheo:dk:itsearvio",q=[{id:"vocab",text:"Hallitsen t\xE4m\xE4n oppitunnin sanaston."},{id:"grammar",text:"Pystyn k\xE4ytt\xE4m\xE4\xE4n uutta kielioppia omissa lauseissani."},{id:"input",text:"Ymm\xE4rr\xE4n aiheen teksti\xE4 ja keskusteluja."},{id:"output",text:"Voin puhua ja kirjoittaa t\xE4st\xE4 aiheesta espanjaksi."}],xt=["heikko","vajaa","kohtuu","vahva","hallitsen"];function ee(){return`${$t}:${p.lang}:${p.kurssiKey}:${p.lessonIndex}`}function te(){try{return JSON.parse(localStorage.getItem(ee())||"null")}catch{return null}}function Ee(e){try{localStorage.setItem(ee(),JSON.stringify(e))}catch{}}var J=new Map;function Ae(e){let t=J.get(e);return t||(t={...te()?.ratings||{}},J.set(e,t)),t}function Le(e){let t=Ae(e.id),s=te(),n=!!s,i=q.map(d=>{let c=n?s.ratings?.[d.id]??0:t[d.id]??0,u=[1,2,3,4,5].map(_=>`
      <button type="button"
              class="dk__arvio-btn ${c===_?"is-chosen":""}"
              data-statement="${l(d.id)}"
              data-value="${_}"
              aria-pressed="${c===_}"
              aria-label="${_}, ${l(xt[_-1])}"
              ${n?"disabled":""}>
        <span class="dk__arvio-num">${_}</span>
      </button>`).join("");return`
      <div class="dk__arvio-row" data-statement="${l(d.id)}">
        <p class="dk__arvio-statement">${l(d.text)}</p>
        <div class="dk__arvio-scale" role="radiogroup" aria-label="${l(d.text)}">
          ${u}
        </div>
        <div class="dk__arvio-scale-axis" aria-hidden="true">
          <span>1 \xB7 heikko</span>
          <span>5 \xB7 hallitsen</span>
        </div>
      </div>`}).join(""),a=q.every(d=>Number.isInteger(t[d.id])&&t[d.id]>0),r=n?`<button type="button" class="dk__btn dk__btn--ghost" id="dk-arvio-reset">P\xE4ivit\xE4 arvio</button>
       <button type="button" class="dk__btn dk__btn--primary" id="dk-arvio-back">Takaisin oppimispolulle</button>`:`<button type="button" class="dk__btn dk__btn--primary" id="dk-arvio-submit" ${a?"":"disabled"}>Tallenna arvio</button>`,o=n?wt(s):"";return`
    <section class="dk__arvio" data-sivu="${l(e.id)}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Itsearviointi</span>
        <span class="dk__exercise-score">${q.length} v\xE4itt\xE4m\xE4\xE4</span>
      </header>
      <p class="dk__arvio-lede">T\xE4m\xE4 on oma kompassisi, ei arvosana. Ole rehellinen, vastaukset ohjaavat seuraavan oppitunnin tasoa.</p>
      ${o}
      <div class="dk__arvio-list">${i}</div>
      <div class="dk__exercise-actions dk__arvio-actions">${r}</div>
    </section>`}function wt(e){let t=e?.ratings||{},s=q.map(a=>t[a.id]).filter(Number.isInteger);if(s.length===0)return"";let n=s.reduce((a,r)=>a+r,0)/s.length,i=n>=4?"Olet vahvalla pohjalla.":n>=3?"Hyv\xE4, suuntaa ty\xF6 heikoimpiin kohtiin.":"Kannattaa kerrata oppitunti ennen seuraavaa.";return`
    <div class="dk__testi-summary" aria-live="polite">
      <div class="dk__testi-summary-score">
        <span class="dk__testi-summary-num">${n.toFixed(1)} / 5</span>
        <span class="dk__testi-summary-pct">Keskiarvo</span>
      </div>
      <p class="dk__testi-summary-headline">${l(i)}</p>
    </div>`}function pe(){let e=y(p.sivuId),t=k[e],s=document.querySelector(".dk__content .dk__arvio");if(!s)return;let n=document.createElement("div");n.innerHTML=Le(t),s.replaceWith(n.firstElementChild),je()}function je(){let e=document.querySelector(".dk__arvio");if(!e)return;let t=e.dataset.sivu,s=Ae(t);e.querySelectorAll(".dk__arvio-btn").forEach(n=>{n.addEventListener("click",()=>{let i=n.dataset.statement,a=Number(n.dataset.value);s[i]=a,e.querySelector(`.dk__arvio-row[data-statement="${i}"]`)?.querySelectorAll(".dk__arvio-btn").forEach(d=>{let c=Number(d.dataset.value)===a;d.classList.toggle("is-chosen",c),d.setAttribute("aria-pressed",c?"true":"false")});let o=document.getElementById("dk-arvio-submit");if(o){let d=q.every(c=>Number.isInteger(s[c.id])&&s[c.id]>0);o.disabled=!d}})}),document.getElementById("dk-arvio-submit")?.addEventListener("click",()=>{let n={ratings:{...s},submittedAt:new Date().toISOString(),lang:p.lang,kurssiKey:p.kurssiKey,lessonIndex:p.lessonIndex};Ee(n),x(t),pe(),K()&&E(`${S}/api/digikirja/itsearvio`,{method:"POST",headers:{"Content-Type":"application/json",...I()},body:JSON.stringify({lang:p.lang,kurssi:p.kurssiKey,lesson:p.lessonIndex,ratings:n.ratings})}).catch(()=>{})}),document.getElementById("dk-arvio-reset")?.addEventListener("click",()=>{try{localStorage.removeItem(ee())}catch{}J.delete(t),pe()}),document.getElementById("dk-arvio-back")?.addEventListener("click",()=>{location.hash=`#/oppimispolku/${p.lang}/${encodeURIComponent(p.kurssiKey)}`})}var G=new Map,L="know",Te="again";function z(e){return(Array.isArray(e?.vocab)?e.vocab:[]).slice(0,ge)}function se(){return`${ot}:${p.lang}:${p.kurssiKey}:${p.lessonIndex}`}function ne(){try{let e=localStorage.getItem(se());return e?JSON.parse(e):{}}catch{return{}}}function St(e,t){try{let s=ne();s[e]=t,localStorage.setItem(se(),JSON.stringify(s))}catch{}}function It(){try{localStorage.removeItem(se())}catch{}}function Ce(e){let t=G.get(e);return t||(t={cardIndex:0,flipped:!1},G.set(e,t)),t}function j(e,t){return e?.es?`${t}:${e.es}`:`${t}`}function Me(e){let t=z(g);if(t.length===0)return'<div class="dk__placeholder"><p>T\xE4m\xE4n oppitunnin sanasto on tyhj\xE4.</p></div>';let s=ne(),n=t.filter((f,h)=>s[j(f,h)]===L).length;if(n===t.length)return`
      <section class="dk__flashpack" data-sivu="${l(e.id)}" data-done="true">
        <header class="dk__exercise-head">
          <span class="dk__exercise-eyebrow">K\xE4\xE4nt\xF6kortit</span>
          <span class="dk__exercise-score">${n} / ${t.length}</span>
        </header>
        <div class="dk__flashdone">
          <p class="dk__flashdone-headline">Pakka k\xE4yty l\xE4pi.</p>
          <p class="dk__flashdone-sub">Voit palata kortteihin my\xF6hemmin, tai nollata edistymisesi ja harjoitella uudelleen.</p>
          <div class="dk__exercise-actions">
            <button type="button" class="dk__btn dk__btn--ghost" id="dk-flash-reset">Aloita alusta</button>
            <button type="button" class="dk__btn dk__btn--primary" id="dk-flash-next-sivu">Seuraava sivu \u2192</button>
          </div>
        </div>
      </section>`;let a=Ce(e.id),r=Math.min(a.cardIndex,t.length-1),d=Ke(t,s,r)[0]??r,c=t[d],u=j(c,d),_=s[u]||null;return`
    <section class="dk__flashpack" data-sivu="${l(e.id)}" data-index="${d}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Kortti ${d+1} / ${t.length}</span>
        <span class="dk__exercise-score" aria-label="Hallinnassa">${n} / ${t.length} hallinnassa</span>
      </header>
      ${Et(c,u,a.flipped,_)}
      <p class="dk__flash-hint">${a.flipped?"Merkitse kortti hallinnaksi tai palaa siihen my\xF6hemmin.":"Yrit\xE4 muistaa ensin omasta p\xE4\xE4st\xE4si. Sitten k\xE4\xE4nn\xE4 kortti."}</p>
    </section>`}function Ke(e,t,s){let n=[];for(let i=s;i<e.length;i++){let a=j(e[i],i);t[a]!==L&&n.push(i)}for(let i=0;i<s;i++){let a=j(e[i],i);t[a]!==L&&n.push(i)}return n}function Et(e,t,s,n){let i=e.gender?`<span class="dk__flashcard-tag">${l(e.gender==="m"?"Maskuliini":e.gender==="f"?"Feminiini":e.gender)}</span>`:"",a=n===Te?'<span class="dk__flashcard-tag dk__flashcard-tag--again">Harjoittelussa</span>':n===L?'<span class="dk__flashcard-tag dk__flashcard-tag--know">Hallinnassa</span>':"";return`
    <div class="dk__flashcard ${s?"is-flipped":""}"
         id="dk-flashcard"
         role="button"
         tabindex="0"
         data-card="${l(t)}"
         aria-pressed="${s?"true":"false"}"
         aria-label="${l(s?"N\xE4yt\xE4 etupuoli":"K\xE4\xE4nn\xE4 kortti")}">
      <div class="dk__flashcard-inner">
        <div class="dk__flashcard-face dk__flashcard-face--front">
          <div class="dk__flashcard-meta">
            <span class="dk__flashcard-eyebrow">Etupuoli</span>
            ${i}${a}
          </div>
          <p class="dk__flashcard-word">${l(e.es||"")}</p>
          <p class="dk__flashcard-hint-pad">Yrit\xE4 muistaa, sitten k\xE4\xE4nn\xE4.</p>
        </div>
        <div class="dk__flashcard-face dk__flashcard-face--back">
          <div class="dk__flashcard-meta">
            <span class="dk__flashcard-eyebrow">Takapuoli</span>
            ${a}
          </div>
          <p class="dk__flashcard-word">${l(e.fi||"")}</p>
          ${e.example_es?`<p class="dk__flashcard-example"><span lang="es">${l(e.example_es)}</span></p>`:""}
          ${e.example_fi?`<p class="dk__flashcard-example dk__flashcard-example--fi">${l(e.example_fi)}</p>`:""}
        </div>
      </div>
    </div>
    <div class="dk__exercise-actions dk__flash-actions">
      <button type="button" class="dk__btn dk__btn--ghost" id="dk-flash-again" ${s?"":"hidden"}>Harjoittele viel\xE4</button>
      <button type="button" class="dk__btn dk__btn--primary" id="dk-flash-know" ${s?"":"hidden"}>Tied\xE4n</button>
      <button type="button" class="dk__btn dk__btn--primary" id="dk-flash-flip" ${s?"hidden":""}>K\xE4\xE4nn\xE4 kortti</button>
    </div>`}function D(){let e=y(p.sivuId),t=k[e],s=document.querySelector(".dk__content .dk__flashpack");if(!s)return;let n=document.createElement("div");n.innerHTML=Me(t),s.replaceWith(n.firstElementChild),qe()}function qe(){let e=document.querySelector(".dk__flashpack");if(!e)return;let t=e.dataset.sivu;if(document.getElementById("dk-flash-reset")?.addEventListener("click",()=>{It(),G.delete(t),D()}),document.getElementById("dk-flash-next-sivu")?.addEventListener("click",()=>{let d=y(p.sivuId),c=k[d+1];c&&w(c.id)}),e.dataset.done==="true")return;let s=Ce(t),n=Number(e.dataset.index),i=z(g)[n];if(!i)return;let a=j(i,n),r=()=>{s.flipped=!s.flipped,D()};document.getElementById("dk-flashcard")?.addEventListener("click",r),document.getElementById("dk-flashcard")?.addEventListener("keydown",d=>{(d.key===" "||d.key==="Enter")&&(d.preventDefault(),r())}),document.getElementById("dk-flash-flip")?.addEventListener("click",r);let o=d=>{St(a,d),s.flipped=!1;let c=ne(),u=z(g);u.length>0&&u.every((h,m)=>c[j(h,m)]===L)&&x(t);let f=Ke(u,c,n+1<u.length?n+1:0);s.cardIndex=f[0]??n,D()};document.getElementById("dk-flash-again")?.addEventListener("click",()=>o(Te)),document.getElementById("dk-flash-know")?.addEventListener("click",()=>o(L))}var _e=new Map,Oe=new Set(["mc","typed","gap_fill","translate"]);function T(e){if(!e||e.kind!=="tehtava")return null;let t=/^phase-(\d+)$/.exec(e.id);if(!t)return null;let s=Number(t[1]);return(Array.isArray(g?.phases)?g.phases:[])[s]||null}function Be(e,t){let s=_e.get(e);return s||(s={itemIndex:0,answered:new Array(t.length).fill(null),scoreCorrect:0,scoreTotal:0},_e.set(e,s)),s}function He(e){let t=T(e);if(!t)return $e(e);let s=Array.isArray(t.items)?t.items:[];if(s.length===0)return'<div class="dk__placeholder"><p>T\xE4ll\xE4 vaiheella ei ole teht\xE4vi\xE4.</p></div>';let n=s[0].item_type;if(n==="writing")return Ne(e,t,s);if(n==="reading_mc")return Fe(e,t,s);if(!Oe.has(n)){let d=n==="match"?"Yhdist\xE4misteht\xE4v\xE4":`Teht\xE4v\xE4tyyppi "${n}"`;return`
      <div class="dk__placeholder" data-kind="tehtava">
        <p class="dk__placeholder-kind">${l(d)}</p>
        <p>T\xE4m\xE4 teht\xE4v\xE4tyyppi avautuu pian. Voit jatkaa muista vaiheista sivuvalikosta.</p>
      </div>`}let i=Be(e.id,s),a=Math.min(i.itemIndex,s.length-1),r=s[a],o=i.answered[a];return`
    <section class="dk__exercise" data-sivu="${l(e.id)}" data-index="${a}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Teht\xE4v\xE4 ${a+1} / ${s.length}</span>
        <span class="dk__exercise-score" aria-label="Tulos">${i.scoreCorrect} / ${i.scoreTotal}</span>
      </header>
      ${Tt(r,o)}
      ${Ot(r,o,a,s.length)}
    </section>`}var ke=new Map;function Pe(e){let t=ke.get(e);return t||(t={promptIdx:0,text:"",submitted:!1,result:null,loading:!1,error:null},ke.set(e,t)),t}function Ne(e,t,s){let n=Pe(e.id),i=s[Math.min(n.promptIdx,s.length-1)]||s[0],a=i.min_words||50,r=i.max_words||120,o=t.instruction||"",d=s.length>1&&!n.submitted?`<div class="dk__writing-switcher" role="tablist" aria-label="Valitse aihe">
         ${s.map((u,_)=>`
           <button type="button"
                   class="dk__writing-tab ${_===n.promptIdx?"is-active":""}"
                   data-prompt-idx="${_}"
                   role="tab"
                   aria-selected="${_===n.promptIdx}">
             Aihe ${_+1}
           </button>`).join("")}
       </div>`:"",c=n.submitted&&n.result?Lt(n):At(i,n,a,r,o);return`
    <section class="dk__writing" data-sivu="${l(e.id)}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Kirjoitusteht\xE4v\xE4</span>
        <span class="dk__exercise-score" aria-label="Tavoite">${a}\u2013${r} sanaa</span>
      </header>
      ${d}
      ${c}
    </section>`}function At(e,t,s,n,i){let a=l(e.prompt||"").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),r=X(t.text),o=r>=s&&r<=n?"dk__writing-counter is-ok":r>n?"dk__writing-counter is-over":"dk__writing-counter is-short",d=r<s||t.loading,c=t.loading?"Arvioidaan\u2026":"L\xE4het\xE4 arvioitavaksi",u=i?`<p class="dk__writing-instruction">${l(i)}</p>`:"",_=t.error?`<p class="dk__writing-error" role="alert">${l(t.error)}</p>`:"";return`
    ${u}
    <p class="dk__writing-prompt">${a}</p>
    <div class="dk__writing-composer">
      <label class="dk__input-label" for="dk-writing-input">Vastauksesi</label>
      <textarea id="dk-writing-input"
                class="dk__input dk__input--multiline dk__writing-textarea"
                rows="12"
                autocomplete="off"
                spellcheck="false"
                placeholder="Kirjoita vastauksesi t\xE4h\xE4n\u2026"
                ${t.loading?"disabled":""}>${l(t.text)}</textarea>
      <div class="dk__writing-meta">
        <span class="${o}" aria-live="polite">
          <strong id="dk-writing-words">${r}</strong> / ${s}\u2013${n} sanaa
        </span>
        <span class="dk__writing-rubric">Arvioidaan YTL-rubriikilla</span>
      </div>
      ${_}
      <div class="dk__exercise-actions">
        <button type="button"
                class="dk__btn dk__btn--primary"
                id="dk-writing-submit"
                ${d?"disabled":""}>
          ${l(c)}
        </button>
      </div>
    </div>`}function Lt(e){let t=e.result||{},s=t.finalScore!=null?t.finalScore:"\u2014",n=t.maxScore!=null?t.maxScore:"",i=t.ytlGrade?`<span class="dk__writing-grade">YTL ${l(String(t.ytlGrade))}</span>`:"",a=Array.isArray(t.errors)?t.errors:[],r=Array.isArray(t.annotations)?t.annotations.filter(u=>u?.type==="positive"):[],o=t.overall_feedback_fi?`<p class="dk__writing-overall">${l(t.overall_feedback_fi)}</p>`:"",d=a.length?`<div class="dk__writing-section">
         <h3 class="dk__writing-section-title">Korjattavaa</h3>
         <ul class="dk__writing-errors">
           ${a.slice(0,6).map(u=>`
             <li>
               <span class="dk__writing-error-wrong">${l(u.excerpt||u.original||"")}</span>
               <span aria-hidden="true">\u2192</span>
               <span class="dk__writing-error-right">${l(u.corrected||u.correct||"")}</span>
               ${u.explanation_fi?`<p class="dk__writing-error-expl">${l(u.explanation_fi)}</p>`:""}
             </li>`).join("")}
         </ul>
       </div>`:"",c=r.length?`<div class="dk__writing-section">
         <h3 class="dk__writing-section-title">Hyvin tehty</h3>
         <ul class="dk__writing-positives">
           ${r.slice(0,4).map(u=>`<li>${l(u.comment_fi||"")}</li>`).join("")}
         </ul>
       </div>`:"";return`
    <div class="dk__writing-result">
      <div class="dk__writing-score">
        <span class="dk__writing-score-num">${l(String(s))}</span>
        <span class="dk__writing-score-denom">/ ${l(String(n))}</span>
        ${i}
      </div>
      ${o}
      ${c}
      ${d}
      <div class="dk__exercise-actions">
        <button type="button" class="dk__btn dk__btn--ghost" id="dk-writing-retry">Kirjoita uudestaan</button>
        <button type="button" class="dk__btn dk__btn--primary" id="dk-writing-next">Seuraava sivu \u2192</button>
      </div>
    </div>`}function X(e){let t=String(e||"").trim();return t?t.split(/\s+/).filter(Boolean).length:0}function jt(e){let t=e.min_words||50,s=e.max_words||120,n=s>=200?"long":"short";return{taskType:n,points:n==="long"?99:33,charMin:Math.max(60,Math.round(t*6)),charMax:Math.max(120,Math.round(s*6)),situation:"",prompt:e.prompt||"",requirements:[],textType:n==="long"?"pidempi kirjoitelma":"lyhyt kirjoitelma"}}function Re(){let e=document.querySelector(".dk__writing");if(!e)return;let t=e.dataset.sivu,s=k.find(c=>c.id===t);if(!s)return;let n=T(s);if(!n)return;let i=Array.isArray(n.items)?n.items:[],a=Pe(t);e.querySelectorAll(".dk__writing-tab").forEach(c=>{c.addEventListener("click",()=>{let u=Number(c.dataset.promptIdx);Number.isInteger(u)&&u!==a.promptIdx&&(a.promptIdx=u,a.text="",a.error=null,H(t))})});let r=e.querySelector("#dk-writing-input"),o=e.querySelector("#dk-writing-words"),d=e.querySelector("#dk-writing-submit");r?.addEventListener("input",()=>{a.text=r.value;let c=X(a.text);o&&(o.textContent=c);let u=i[a.promptIdx]||i[0],_=u.min_words||50,f=u.max_words||120;d&&(d.disabled=c<_||a.loading);let h=e.querySelector(".dk__writing-counter");h&&(h.classList.remove("is-ok","is-over","is-short"),c>f?h.classList.add("is-over"):c>=_?h.classList.add("is-ok"):h.classList.add("is-short"))}),d?.addEventListener("click",async()=>{if(a.loading)return;let c=i[a.promptIdx]||i[0],u=c.min_words||50;if(!(X(a.text)<u)){a.loading=!0,a.error=null,H(t);try{let _=jt(c),f={"Content-Type":"application/json"};K()&&Object.assign(f,I());let h=await E(`${S}/api/grade-writing`,{method:"POST",headers:f,body:JSON.stringify({task:_,studentText:a.text})});if(!h.ok){let v=await h.json().catch(()=>({}));throw new Error(v?.error||`Arvionti ep\xE4onnistui (${h.status})`)}let m=await h.json();if(!m?.result)throw new Error("Ei tulosta palvelimelta");a.result=m.result,a.submitted=!0,x(t)}catch(_){a.error=String(_?.message||"Arvionti ei nyt vastaa, yrit\xE4 hetken p\xE4\xE4st\xE4.")}finally{a.loading=!1,H(t)}}}),e.querySelector("#dk-writing-retry")?.addEventListener("click",()=>{a.submitted=!1,a.result=null,a.text="",H(t)}),e.querySelector("#dk-writing-next")?.addEventListener("click",()=>{let c=y(t),u=k[c+1];u&&w(u.id)})}function H(e){let t=document.querySelector(`.dk__writing[data-sivu="${e}"]`);if(!t)return;let s=k.find(o=>o.id===e),n=T(s);if(!s||!n)return;let i=Array.isArray(n.items)?n.items:[],a=Ne(s,n,i),r=document.createElement("div");r.innerHTML=a,t.replaceWith(r.firstElementChild),Re()}var he=new Map;function Ve(e,t){let s=he.get(e);return s||(s={itemIdx:0,answers:t.map(n=>new Array((n.questions||[]).length).fill(null)),submitted:t.map(()=>!1)},he.set(e,s)),s}function Fe(e,t,s){let n=Ve(e.id,s),i=Math.min(n.itemIdx,s.length-1),a=s[i]||{},r=Array.isArray(a.questions)?a.questions:[],o=!!n.submitted[i],d=n.answers[i]||[],c=o?d.reduce((m,v,C)=>m+(v===r[C]?.correct_index?1:0),0):0,u=l(a.passage||"").split(/\n\n+/).map(m=>`<p>${m.replace(/\n/g,"<br>")}</p>`).join(""),_=r.map((m,v)=>{let C=Array.isArray(m.choices)?m.choices:[],ae=d[v],N=m.correct_index;return`
      <div class="dk__reading-q" data-qi="${v}">
        <p class="dk__reading-q-stem">${v+1}. ${l(m.question_fi||"")}</p>
        <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
          ${C.map((ze,M)=>{let ie=ae===M,Xe=o&&M===N,Ze=o&&ie&&M!==N,B=["dk__choice"];return Ze?B.push("is-wrong"):Xe?B.push("is-correct"):ie&&!o&&B.push("is-selected"),`
              <li>
                <button type="button"
                        class="${B.join(" ")}"
                        data-qi="${v}" data-ci="${M}"
                        ${o?"disabled":""}>
                  <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65+M)}</span>
                  <span class="dk__choice-text">${l(ze)}</span>
                </button>
              </li>`}).join("")}
        </ol>
        ${o&&m.explanation_fi?`<p class="dk__reading-expl ${ae===N?"is-correct":"is-wrong"}">${l(m.explanation_fi)}</p>`:""}
      </div>`}).join(""),f=i>=s.length-1,h=o?`<div class="dk__feedback" aria-live="polite">
         <span class="dk__feedback-chip ${c===r.length?"is-correct":"is-wrong"}">
           ${c} / ${r.length} oikein
         </span>
       </div>
       <div class="dk__exercise-actions">
         <button type="button" class="dk__btn dk__btn--primary" id="dk-reading-next">
           ${f?"Vaihe valmis \u2192":"Seuraava teksti \u2192"}
         </button>
       </div>`:`<div class="dk__exercise-actions">
         <button type="button"
                 class="dk__btn dk__btn--primary"
                 id="dk-reading-submit"
                 ${d.some(m=>m==null)?"disabled":""}>
           Tarkista vastaukset
         </button>
       </div>`;return`
    <section class="dk__reading" data-sivu="${l(e.id)}" data-item="${i}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Teksti ${i+1} / ${s.length}</span>
        <span class="dk__exercise-score" aria-label="Kysymyksi\xE4">${r.length} kysymyst\xE4</span>
      </header>
      <div class="dk__reading-passage">${u}</div>
      <div class="dk__reading-questions">${_}</div>
      ${h}
    </section>`}function De(){let e=document.querySelector(".dk__reading");if(!e)return;let t=e.dataset.sivu,s=k.find(o=>o.id===t);if(!s)return;let n=T(s);if(!n)return;let i=Array.isArray(n.items)?n.items:[],a=Ve(t,i),r=Number(e.dataset.item)||0;e.querySelectorAll(".dk__choice").forEach(o=>{o.addEventListener("click",()=>{if(a.submitted[r])return;let d=Number(o.dataset.qi),c=Number(o.dataset.ci);a.answers[r][d]=c,W(t)})}),e.querySelector("#dk-reading-submit")?.addEventListener("click",()=>{a.answers[r].some(o=>o==null)||(a.submitted[r]=!0,a.submitted.every(Boolean)&&x(t),W(t))}),e.querySelector("#dk-reading-next")?.addEventListener("click",()=>{if(r<i.length-1)a.itemIdx=r+1,W(t);else{let o=y(t),d=k[o+1];d&&w(d.id)}})}function W(e){let t=document.querySelector(`.dk__reading[data-sivu="${e}"]`);if(!t)return;let s=k.find(o=>o.id===e),n=T(s);if(!s||!n)return;let i=Array.isArray(n.items)?n.items:[],a=Fe(s,n,i),r=document.createElement("div");r.innerHTML=a,t.replaceWith(r.firstElementChild),De()}function Tt(e,t){switch(e.item_type){case"mc":return Ct(e,t);case"typed":return Mt(e,t);case"gap_fill":return Kt(e,t);case"translate":return qt(e,t);default:return`<p class="dk__teoria-p">Teht\xE4v\xE4tyyppi \u201D${l(e.item_type)}\u201D ei ole viel\xE4 k\xE4ytett\xE4viss\xE4.</p>`}}function Ct(e,t){let s=Array.isArray(e.choices)?e.choices:[],n=Number.isInteger(e.correct_index)?e.correct_index:-1,i=!!t,a=t?.choiceIndex;return`
    <p class="dk__exercise-stem">${l(e.stem||"")}</p>
    <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
      ${s.map((r,o)=>{let d=i&&a===o,c=i&&o===n,u=["dk__choice"];return d&&c?u.push("is-correct"):d&&!c?u.push("is-wrong"):i&&c&&u.push("is-revealed"),`
          <li>
            <button type="button" class="${u.join(" ")}"
                    data-choice="${o}"
                    ${i?"disabled":""}>
              <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65+o)}</span>
              <span class="dk__choice-text">${l(r)}</span>
            </button>
          </li>`}).join("")}
    </ol>`}function Mt(e,t){let s=e.hint||"",n=t?.userAnswer||"",i=!!t;return`
    <p class="dk__exercise-stem">${l(e.prompt||"")}</p>
    ${s?`<p class="dk__exercise-hint">${l(s)}</p>`:""}
    <div class="dk__input-row">
      <label class="dk__input-label" for="dk-input">Vastauksesi</label>
      <input id="dk-input" type="text" class="dk__input"
             autocomplete="off" autocapitalize="off" spellcheck="false"
             value="${l(n)}"
             ${i?"disabled":""}>
    </div>`}function Kt(e,t){let s=String(e.sentence_template||""),n=(s.match(/\{(\d+)\}/g)||[]).length,i=t?.userAnswer||new Array(n).fill(""),a=!!t,r=0,o=l(s).replace(/\{(\d+)\}/g,()=>{let c=i[r]||"",u=`dk-gap-${r}`;return r++,`<input id="${u}" type="text" class="dk__input dk__input--gap"
                   data-gap="${r-1}" autocomplete="off" spellcheck="false"
                   value="${l(c)}" ${a?"disabled":""}>`}),d=Array.isArray(e.word_bank)&&e.word_bank.length?`<ul class="dk__wordbank" aria-label="Sanapankki">
         ${e.word_bank.map(c=>`
           <li>
             <button type="button" class="dk__wordbank-chip"
                     data-word="${l(c)}"
                     ${a?"disabled":""}>
               ${l(c)}
             </button>
           </li>`).join("")}
       </ul>`:"";return`
    <p class="dk__exercise-stem dk__exercise-stem--gap">${o}</p>
    ${d}`}function qt(e,t){let s=e.direction==="es_to_fi"?"espanjasta suomeksi":e.direction==="fi_to_es"?"suomesta espanjaksi":"k\xE4\xE4nn\xF6s",n=t?.userAnswer||"",i=!!t;return`
    <p class="dk__exercise-eyebrow-tag">K\xE4\xE4nn\xF6s, ${l(s)}</p>
    <p class="dk__exercise-stem">${l(e.source||e.prompt||"")}</p>
    <div class="dk__input-row">
      <label class="dk__input-label" for="dk-input">Vastauksesi</label>
      <textarea id="dk-input" class="dk__input dk__input--multiline"
                rows="3" autocomplete="off" spellcheck="false"
                ${i?"disabled":""}>${l(n)}</textarea>
    </div>`}function Ot(e,t,s,n){if(!t)return`
      <div class="dk__exercise-actions">
        <button type="button" class="dk__btn dk__btn--primary" id="dk-check">Tarkista</button>
      </div>`;let i=t.correct,a=i?"is-correct":"is-wrong",r=i?"Oikein":"Viel\xE4 ei aivan",o=Bt(e,t),d=s>=n-1;return`
    <div class="dk__feedback" aria-live="polite">
      <span class="dk__feedback-chip ${a}">${r}</span>
      ${o}
    </div>
    <div class="dk__exercise-actions">
      <button type="button" class="dk__btn dk__btn--primary" id="dk-next-item">
        ${d?"Vaihe valmis \u2192":"Seuraava \u2192"}
      </button>
    </div>`}function Bt(e,t){let s=We(e),n=s?`<p class="dk__feedback-expected"><span>Oikea vastaus:</span> ${l(s)}</p>`:"",i=e.explanation?`<p class="dk__feedback-text">${l(e.explanation)}</p>`:"",a=t?.accentHint?`<p class="dk__feedback-text dk__feedback-hint">${l(t.accentHint)}</p>`:"";return`${n}${a}${i}`}function We(e){switch(e.item_type){case"mc":return Array.isArray(e.choices)&&Number.isInteger(e.correct_index)?e.choices[e.correct_index]:"";case"typed":return Array.isArray(e.accept)&&e.accept[0]||"";case"translate":return Array.isArray(e.accept)&&e.accept[0]||"";case"gap_fill":{let t=String(e.sentence_template||""),s=Array.isArray(e.answers)?e.answers:[],n=0;return t.replace(/\{(\d+)\}/g,()=>{let i=s[n++];return Array.isArray(i)&&i[0]||"\u2014"})}default:return""}}function Z(e,t){switch(e.item_type){case"mc":{let s=Number(t);return{correct:s===e.correct_index,choiceIndex:s}}case"typed":case"translate":{let s=String(t||"").trim(),n=Array.isArray(e.accept)?e.accept:[];for(let i of n){let a=V(s,i,p.lang||"es");if(a.ok)return{correct:!0,userAnswer:s,accentHint:a.hint||null}}return{correct:!1,userAnswer:s}}case"gap_fill":{let s=Array.isArray(t)?t:[],n=Array.isArray(e.answers)?e.answers:[],i=!0;for(let a=0;a<n.length;a++){let r=Array.isArray(n[a])?n[a]:[n[a]],o=String(s[a]||"").trim(),d=!1;for(let c of r)if(V(o,String(c),p.lang||"es").ok){d=!0;break}if(!d){i=!1;break}}return{correct:i,userAnswer:s}}default:return{correct:!1}}}function Ht(e){let t=document.querySelector(".dk__exercise");if(!t)return null;switch(e.item_type){case"typed":case"translate":{let s=t.querySelector("#dk-input");return s?s.value:""}case"gap_fill":return[...t.querySelectorAll(".dk__input--gap")].map(s=>s.value);default:return null}}function U(){let e=y(p.sivuId),t=k[e],s=document.querySelector(".dk__content .dk__exercise");if(!s)return;let n=document.createElement("div");n.innerHTML=He(t),s.replaceWith(n.firstElementChild),Ue()}function Ue(){let e=document.querySelector(".dk__exercise");if(!e)return;let t=e.dataset.sivu,s=k.find(c=>c.id===t),n=T(s);if(!n)return;let i=n.items||[],a=Number(e.dataset.index),r=i[a];if(!r)return;let o=Be(t,i);e.querySelectorAll(".dk__choice").forEach(c=>{c.addEventListener("click",()=>{if(o.answered[a])return;let u=Number(c.dataset.choice),_=Z(r,u);o.answered[a]=_,_.correct&&o.scoreCorrect++,o.scoreTotal++,o.scoreTotal>=i.length&&x(t),U()})}),document.getElementById("dk-check")?.addEventListener("click",()=>{if(o.answered[a])return;let c=Ht(r),u=Z(r,c);o.answered[a]=u,u.correct&&o.scoreCorrect++,o.scoreTotal++,o.scoreTotal>=i.length&&x(t),U()}),e.querySelector("#dk-input")?.addEventListener("keydown",c=>{c.key==="Enter"&&!c.shiftKey&&!o.answered[a]&&(c.preventDefault(),document.getElementById("dk-check")?.click())}),e.querySelectorAll(".dk__wordbank-chip").forEach(c=>{c.addEventListener("click",()=>{if(o.answered[a])return;let u=c.dataset.word||"",_=[...e.querySelectorAll(".dk__input--gap")],f=_.find(h=>!h.value.trim())||_[_.length-1];f&&(f.value=u,f.focus())})}),document.getElementById("dk-next-item")?.addEventListener("click",()=>{if(a<i.length-1)o.itemIndex=a+1,U();else{let c=y(p.sivuId),u=k[c+1];u&&w(u.id)}})}function Ye(){let e=g?.meta||{},t=y(p.sivuId),s=k[t],n=t>0?k[t-1]:null,i=t<k.length-1?k[t+1]:null,a=[e.course_key||p.kurssiKey,`Oppitunti ${e.lesson_index||p.lessonIndex}`].filter(Boolean).join(" \xB7 "),r=s.kind==="teoria"?`<em>${l(s.title)}</em>`:`${s.num?`${l(s.num)} \xB7 `:""}${l(s.title)}`,o=s.kind==="teoria"?vt():s.kind==="tehtava"?He(s):s.kind==="flashcards"?Me(s):s.kind==="testi"?Se(s):s.kind==="itsearviointi"?Le(s):$e(s);return`
    <main class="dk__content" id="dk-content" tabindex="-1">
      <p class="dk__page-meta">${l(a)}</p>
      <h2 class="dk__page-title">${r}</h2>
      ${o}
      ${Pt(n,i,"bottom")}
    </main>`}function Pt(e,t,s){let n=`dk__prevnext dk__prevnext--${s}`,i=e?`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" data-sivu="${l(e.id)}">
         <span class="dk__prevnext-dir">\u2190 Edellinen</span>
         <span class="dk__prevnext-label">${l(e.num?e.num+" \xB7 "+e.title:e.title)}</span>
       </button>`:`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" disabled>
         <span class="dk__prevnext-dir">\u2190 Edellinen</span>
         <span class="dk__prevnext-label">Oppitunnin alku</span>
       </button>`,a=t?`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--next" data-sivu="${l(t.id)}">
         <span class="dk__prevnext-dir">Seuraava \u2192</span>
         <span class="dk__prevnext-label">${l(t.num?t.num+" \xB7 "+t.title:t.title)}</span>
       </button>`:`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--next" disabled>
         <span class="dk__prevnext-dir">Seuraava \u2192</span>
         <span class="dk__prevnext-label">Oppitunti valmis</span>
       </button>`;return`<div class="${n}">${i}${a}</div>`}function Nt(){return`
    <div class="dk" id="dk-root" data-sidemenu="open">
      <header class="dk__topbar" role="banner">
        <span></span>
        <span class="dk__title" style="font-style: normal; color: var(--ed-ink-muted);">Ladataan oppituntia\u2026</span>
        <span></span>
      </header>
      <div class="dk__body">
        <aside class="dk__sidemenu"><div class="dk__sidemenu-head"><span class="dk__sidemenu-eyebrow">Sis\xE4llys</span></div></aside>
        <main class="dk__content">
          <div class="dk__loading">Haetaan oppituntia palvelimelta\u2026</div>
        </main>
      </div>
    </div>`}function Rt(e){return`
    <div class="dk" id="dk-root" data-sidemenu="open">
      <header class="dk__topbar" role="banner">
        <nav class="dk__breadcrumb">
          <a href="#/aloitus">Etusivu</a>
        </nav>
        <span class="dk__title">Oppitunti ei latautunut</span>
        <span></span>
      </header>
      <div class="dk__body">
        <aside class="dk__sidemenu"></aside>
        <main class="dk__content">
          <div class="dk__error">
            <strong>Oppituntia ei l\xF6ytynyt.</strong>
            <p>${l(String(e?.message||e||"Tuntematon virhe"))}</p>
            <p>Palaa <a href="#/oppimispolku?lang=${l(p.lang)}">Oppimispolulle</a> ja kokeile toista oppituntia.</p>
          </div>
        </main>
      </div>
    </div>`}function O(e){let t=document.getElementById("dk-root");if(!t)return;t.dataset.sidemenu=e;let s=document.getElementById("dk-toggle-sidemenu");s&&s.setAttribute("aria-pressed",e===$?"true":"false")}function Vt(){let e=document.getElementById("dk-toggle-sidemenu"),t=document.getElementById("dk-sidemenu-backdrop");e?.addEventListener("click",()=>{let s=document.getElementById("dk-root");if(window.matchMedia("(max-width: 1023px)").matches){let i=s.dataset.sidemenu===A?$:A;O(i)}else{let i=s.dataset.sidemenu===$?A:$;O(i),dt(i)}}),t?.addEventListener("click",()=>{O($)})}function w(e){if(!e||e===p.sivuId||k.findIndex(r=>r.id===e)<0)return;p.sivuId=e;let s=`#/oppitunti/${p.lang}/${encodeURIComponent(p.kurssiKey)}/${p.lessonIndex}/${encodeURIComponent(e)}`;location.hash!==s&&history.replaceState(null,"",s);let n=document.getElementById("dk-root");if(!n)return;let i=n.querySelector(".dk__sidemenu-list");i&&i.querySelectorAll(".dk__row").forEach(r=>{let o=r.dataset.sivu===e;r.classList.toggle("is-active",o),r.setAttribute("aria-current",o?"page":"false")});let a=n.querySelector(".dk__content");if(a){let r=document.createElement("div");r.innerHTML=Ye(),a.replaceWith(r.firstElementChild),Ge()}window.matchMedia("(max-width: 1023px)").matches&&O($),Je(),be(),Q(),document.getElementById("dk-content")?.focus({preventScroll:!1})}function Ft(){document.getElementById("dk-sidemenu-list")?.addEventListener("click",e=>{let t=e.target.closest(".dk__row");t&&w(t.dataset.sivu)})}function Je(){let e=document.getElementById("dk-sidemenu-list");if(!e)return;let t=e.querySelector(".dk__row.is-active");t&&requestAnimationFrame(()=>{try{t.scrollIntoView({block:"nearest",inline:"nearest",behavior:"auto"})}catch{let s=t.offsetTop-e.clientHeight/2+t.clientHeight/2;e.scrollTop=Math.max(0,s)}})}function Ge(){document.querySelectorAll(".dk__content .dk__prevnext-btn[data-sivu]").forEach(e=>{e.addEventListener("click",()=>w(e.dataset.sivu))}),Ue(),qe(),Ie(),je(),Re(),De()}function Dt(){ye=!0}async function Wt(e={}){ye||Dt(),p.lang=e.lang||p.lang,p.kurssiKey=e.kurssiKey||p.kurssiKey,p.lessonIndex=Number(e.lessonIndex)||p.lessonIndex,p.sivuId=e.sivuId||p.sivuId||"teoria";let t=document.getElementById("screen-digikirja");if(!t)return;t.innerHTML=Nt(),re("screen-digikirja"),import("./app-sidebarShell-35FFUWZH.js").then(n=>n.setSidebarMode("book"));let s=`${p.lang}/${p.kurssiKey}/${p.lessonIndex}`;F=s;try{let[n]=await Promise.all([pt(p),_t(p)]);if(F!==s)return;g=n,k=kt(n),k.some(r=>r.id===p.sivuId)||(p.sivuId=k[0]?.id||"teoria");let a=window.matchMedia("(max-width: 1023px)").matches?$:ct();t.innerHTML=`
      <div class="dk" id="dk-root" data-sidemenu="${a}">
        ${ht()}
        <div class="dk__body">
          ${mt()}
          ${Ye()}
        </div>
      </div>`,O(a),Vt(),Ft(),ft(),Ge(),Je(),be(),Q()}catch(n){if(F!==s)return;t.innerHTML=Rt(n)}}function Xt(e){let t=/^#\/oppitunti\/([a-z]{2})\/([^/?#]+)\/(\d+)\/([^/?#]+)/i.exec(e||location.hash);return t?(Wt({lang:t[1].toLowerCase(),kurssiKey:decodeURIComponent(t[2]),lessonIndex:Number(t[3]),sivuId:decodeURIComponent(t[4])}),!0):!1}export{Dt as initDigikirja,Wt as showDigikirja,Xt as tryRouteDigikirja};
//# sourceMappingURL=app-digikirja-VNY6G3UH.js.map
