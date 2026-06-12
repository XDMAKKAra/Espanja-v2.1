import{a as pe}from"./app-chunk-XYSTN2TU.js";import{b as S,d as le,e as ue}from"./app-chunk-XSJXYF7Z.js";import{b as F}from"./app-chunk-AE7C6F2Z.js";import{b as de}from"./app-chunk-CTTO4TQX.js";import{a as $,c as b,d as D,e as x,j as w}from"./app-chunk-T52YLBP4.js";function it(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function I(e){let t=it(e);return t=t.replace(/`([^`]+)`/g,'<code class="dk__teoria-code">$1</code>'),t=t.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),t=t.replace(/\*([^*\n]+)\*/g,"<em>$1</em>"),t=t.replace(/(^|\s)_([^_\n]+)_(?=\s|[.,;:!?]|$)/g,"$1<em>$2</em>"),t}function _e(e){return/^\s*\|?\s*:?-{2,}:?(\s*\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(e)}function ke(e){return e.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(s=>s.trim())}function rt(e,t){let s=ke(e),n=t.map(ke),a=s.map(o=>`<th>${I(o)}</th>`).join(""),i=n.map(o=>`<tr>${o.map(c=>`<td>${I(c)}</td>`).join("")}</tr>`).join("");return`<div class="dk__bilingual${s.length===2?" dk__bilingual--2col":""}"><table><thead><tr>${a}</tr></thead><tbody>${i}</tbody></table></div>`}function ot(e){return`
    <aside class="dk__obs" role="note" aria-label="Huomio">
      <span class="dk__obs-label">Obs!</span>
      <div class="dk__obs-body">${e.map(n=>n.replace(/^>\s?/,"")).join(" ").trim().split(/\n{2,}|(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ])/g).map(n=>n.trim()).filter(Boolean).map(n=>`<p>${I(n)}</p>`).join("")}</div>
    </aside>`}function ct(e){return`<ul class="dk__teoria-ul">${e.map(s=>`<li>${I(s.replace(/^[-*]\s+/,""))}</li>`).join("")}</ul>`}function he(e){if(!e||typeof e!="string")return"";let t=e.replace(/\r\n?/g,`
`).split(`
`),s=[],n=0,a=!1;for(;n<t.length;){let i=t[n];if(/^\s*$/.test(i)){n++;continue}let r=/^(#{1,6})\s+(.*)$/.exec(i);if(r){let l=r[1].length,c=r[2].trim();if(l===1&&!a){a=!0,n++;continue}l===2?s.push(`<h3 class="dk__teoria-h2">${I(c)}</h3>`):l===3?s.push(`<h4 class="dk__teoria-h3">${I(c)}</h4>`):s.push(`<h${Math.min(l+1,6)} class="dk__teoria-h">${I(c)}</h${Math.min(l+1,6)}>`),n++;continue}if(/^\s*>\s?/.test(i)){let l=[];for(;n<t.length&&/^\s*>\s?/.test(t[n]);)l.push(t[n]),n++;s.push(ot(l));continue}if(/^\s*\|/.test(i)&&n+1<t.length&&_e(t[n+1])){let l=i,c=[];for(n+=2;n<t.length&&/^\s*\|/.test(t[n]);)c.push(t[n]),n++;s.push(rt(l,c));continue}if(/^\s*[-*]\s+/.test(i)){let l=[];for(;n<t.length&&/^\s*[-*]\s+/.test(t[n]);)l.push(t[n]),n++;s.push(ct(l));continue}let o=[i];for(n++;n<t.length&&!/^\s*$/.test(t[n])&&!/^(#{1,6})\s+/.test(t[n])&&!/^\s*>\s?/.test(t[n])&&!/^\s*[-*]\s+/.test(t[n])&&!(/^\s*\|/.test(t[n])&&n+1<t.length&&_e(t[n+1]));)o.push(t[n]),n++;s.push(`<p class="dk__teoria-p">${I(o.join(" "))}</p>`)}return s.join(`
`)}var $e="puheo:dk:sidemenu",T="open",A="collapsed",dt="puheo:dk:progress";function xe(){return`${dt}:${p.lang}:${p.kurssiKey}:${p.lessonIndex}`}function B(){try{return JSON.parse(localStorage.getItem(xe())||"{}")}catch{return{}}}function we(e){try{localStorage.setItem(xe(),JSON.stringify(e))}catch{}}function E(e){if(!e)return;pt(e);let t=B();t[e]!=="done"&&(t[e]="done",we(t),b()&&w(`${$}/api/digikirja/progress`,{method:"POST",headers:{"Content-Type":"application/json",...x()},body:JSON.stringify({lang:p.lang,kurssi:p.kurssiKey,lesson:p.lessonIndex,sivuId:e})}).catch(()=>{}),se())}function se(){let e=B(),t=document.getElementById("dk-sidemenu-list");t&&t.querySelectorAll(".dk__row").forEach(n=>{n.classList.toggle("is-done",e[n.dataset.sivu]==="done")});let s=document.getElementById("dk-progress-chip");if(s){let n=f.filter(a=>e[a.id]==="done").length;s.textContent=`${n} / ${f.length} valmis`,s.dataset.full=n>=f.length?"true":"false"}}var me="",W=null;async function lt(e){try{let t=await w(`${$}/api/curriculum/review-queue?lang=${encodeURIComponent(e||"es")}&limit=8`,{headers:{...x()}});if(!t||!t.ok)return null;let s=await t.json();return s&&!s.locked&&Array.isArray(s.items)&&s.items.length?s:null}catch{return null}}async function ut(e,t){try{if(typeof b=="function"&&!b())return;if(me!==t){me=t;let s=await Promise.race([lt(p.lang),new Promise(i=>setTimeout(()=>i(null),1500))]),n=new Set(["mc","typed","gap_fill","translate"]),a=(s&&Array.isArray(s.items)?s.items:[]).filter(i=>n.has(i.item_type));W=a.length?le({...s,items:a}):null}W&&(e.phases=[W,...Array.isArray(e.phases)?e.phases:[]])}catch{}}function pt(e){if(!b||!b())return;let t=f.find(r=>r.id===e);if(!t||t.kind!=="tehtava")return;let s=L(t),n=Q.get(e);if(!s||!n||!Array.isArray(n.answered))return;let a=Array.isArray(s.items)?s.items:[],i=[];for(let r=0;r<a.length;r++){let o=n.answered[r];!a[r]||!o||i.push(ue(a[r],o,s))}i.length&&w(`${$}/api/curriculum/capture`,{method:"POST",headers:{"Content-Type":"application/json",...x()},body:JSON.stringify({lang:p.lang||"es",gradedItems:i})}).catch(()=>{})}var _t=[[/^YO-tyylinen käännös$/i,"K\xE4\xE4nn\xE4 lauseet"],[/^YO-tason käännös$/i,"K\xE4\xE4nn\xE4 lauseet"],[/^Lyhyt kirjoitus$/i,"Kirjoita lyhyt teksti"],[/^Lauseiden rakentelua$/i,"K\xE4\xE4nn\xE4 lauseet"],[/^Lauseen rakentelua$/i,"K\xE4\xE4nn\xE4 lauseet"],[/Lauseen täydennys\s*[—-]\s*/g,"Lauseen t\xE4ydennys, "],[/Tunnista\s*[—-]\s*/g,"Tunnista "],[/Tuota\s*[—-]\s*/g,"Tuota "],[/Yhdistä\s*[—-]\s*/g,"Yhdist\xE4 "],[/Käännä\s*[—-]\s*/g,"K\xE4\xE4nn\xE4 "]];function kt(e){if(!e)return"";let t=String(e);for(let[s,n]of _t)t=t.replace(s,n);return t=t.replace(/\s+—\s+/g,", "),t}var ht={teoria:"Opetus",tehtava:"Harjoitukset",flashcards:"Kortit",testi:"Testit",itsearviointi:"Itsearvio"};var Se=5,mt="puheo:dk:flashcards",fe={},Ie=!1,p={lang:"es",kurssiKey:"kurssi_2",lessonIndex:3,sivuId:"teoria"},g=null,f=[],H="";function d(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function ft(e){let t=[...e];for(let s=t.length-1;s>0;s--){let n=Math.floor(Math.random()*(s+1));[t[s],t[n]]=[t[n],t[s]]}return t}function vt(){try{return localStorage.getItem($e)===T?T:A}catch{return T}}function gt(e){try{localStorage.setItem($e,e)}catch{}}function yt(e){return e==="fr"?"Ranska":e==="de"?"Saksa":"Espanja"}function Ae(e){let t=/^kurssi_(\d+)$/.exec(String(e||""));return t?`Kurssi ${t[1]}`:e||""}function bt(e){return`/data/courses/${encodeURIComponent(e.lang)}/${encodeURIComponent(e.kurssiKey)}/lesson_${encodeURIComponent(e.lessonIndex)}.json`}async function $t(e){let t=bt(e),s=await fetch(t,{headers:{accept:"application/json"}});if(!s.ok)throw new Error(`lesson fetch ${s.status}`);return s.json()}async function xt(e){if(b())try{let t=`lang=${encodeURIComponent(e.lang)}&kurssi=${encodeURIComponent(e.kurssiKey)}&lesson=${encodeURIComponent(e.lessonIndex)}`,[s,n]=await Promise.all([w(`${$}/api/digikirja/progress?${t}`,{headers:x()}).catch(()=>null),w(`${$}/api/digikirja/itsearvio?${t}`,{headers:x()}).catch(()=>null)]);if(s?.ok){let{sivut:a}=await s.json().catch(()=>({sivut:{}}));if(a&&typeof a=="object"){let i=B();for(let r of Object.keys(a))i[r]||(i[r]="done");we(i)}}if(n?.ok){let{itsearvio:a}=await n.json().catch(()=>({itsearvio:null}));a?.ratings&&(ae()||qe({ratings:a.ratings,submittedAt:a.submittedAt,lang:e.lang,kurssiKey:e.kurssiKey,lessonIndex:e.lessonIndex}))}}catch{}}function wt(e){let t=[];t.push({id:"teoria",kind:"teoria",num:"",title:e?.meta?.title||"Opetus",meta:"Opetussivu"}),(Array.isArray(e?.phases)?e.phases:[]).forEach((o,l)=>{let c=String(l+1),u=kt(o.title)||`Vaihe ${c}`,_=Array.isArray(o.items)?o.items.length:0;t.push({id:`phase-${l}`,kind:"tehtava",num:c,title:u,meta:_?`${_} kohtaa`:"Teht\xE4v\xE4"})});let n=e?.meta?.lesson_type||"vocab",a=new Set(["vocab","mixed"]),i=Array.isArray(e?.vocab)?e.vocab:[],r=Math.min(i.length,Se);return r>0&&a.has(n)&&t.push({id:"kortit-1",kind:"flashcards",num:"",title:`K\xE4\xE4nt\xF6kortit \xB7 ${e?.meta?.title||""}`.trim(),meta:`${r} korttia`}),t}function y(e){let t=f.findIndex(s=>s.id===e);return t>=0?t:0}function St(){let t=(g?.meta||{}).title||"Oppitunti";return`
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
      <h1 class="dk__title">${d(t)}</h1>
      <div class="dk__tools">
        <span class="dk__progress-chip" id="dk-progress-chip" aria-live="polite"></span>
      </div>
    </header>`}function It(){let e=[],t=null;for(let o of f){let l=ht[o.kind]||"Muut";l!==t&&(e.push({title:l,items:[]}),t=l),e[e.length-1].items.push(o)}let s=B(),n=e.map(o=>{let l=`<span class="dk__group-title">${d(o.title)}</span>`,c=o.items.map(u=>{let _=u.id===p.sivuId,k=s[u.id]==="done",h=["dk__row"];_&&h.push("is-active"),k&&h.push("is-done");let m=u.num?`${d(u.num)} `:"";return`
        <button type="button"
                class="${h.join(" ")}"
                data-sivu="${d(u.id)}"
                data-kind="${d(u.kind)}"
                aria-current="${_?"page":"false"}"
                aria-label="${d(u.title)}${k?", suoritettu":""}">
          <span class="dk__row-bullet" aria-hidden="true"></span>
          <span class="dk__row-title">${m}${d(u.title)}</span>
          ${k?'<span class="dk__row-check" aria-hidden="true">\u2713</span>':""}
        </button>`}).join("");return l+c}).join(""),a=(window._userProfile?.nickname||"").trim();if(!a)try{a=(localStorage.getItem("puheo:nickname")||"").trim()}catch{}let i=typeof D=="function"&&D()||"",r=a||i||"Oma sivu";return`
    <aside class="dk__sidemenu" id="dk-sidemenu" aria-label="Oppitunnin sis\xE4llys">
      <div class="dk__sidemenu-top">
        <a class="dk__sidemenu-logo" href="#home" data-dk-nav="home" aria-label="Puheo etusivulle"><span class="brand-wordmark">puheo</span></a>
        <div class="dk__sidemenu-course">${d(yt(p.lang))} \xB7 ${d(Ae(p.kurssiKey))}</div>
      </div>
      <div class="dk__sidemenu-head">
        <span class="dk__sidemenu-eyebrow">Sis\xE4llys</span>
        <span class="dk__sidemenu-count">${f.length} sivua</span>
      </div>
      <nav class="dk__sidemenu-list" id="dk-sidemenu-list">
        ${n}
      </nav>
      <div class="dk__sidemenu-footer">
        <button type="button" class="dk__sidemenu-user" data-dk-nav="profile" title="${d(r)}">
          <span class="dk__sidemenu-user-text">${d(r)}</span>
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
    <div class="dk__sidemenu-backdrop" id="dk-sidemenu-backdrop" aria-hidden="true"></div>`}function At(){let e=document.getElementById("dk-root");e&&e.addEventListener("click",t=>{let s=t.target.closest("[data-dk-nav]");if(!s)return;let n=s.dataset.dkNav;s.tagName==="A"&&t.preventDefault(),n==="home"?document.querySelector('.sidebar-item[data-nav="home"]')?.click()??(location.hash="#home"):n==="settings"?document.querySelector('.sidebar-item[data-nav="settings"]')?.click():n==="profile"?document.querySelector('.sidebar-user[data-nav="profile"], .sidebar-item[data-nav="profile"]')?.click():n==="logout"&&document.getElementById("sidebar-logout")?.click()})}function Ee(){p.sivuId==="teoria"&&E("teoria")}function Et(){let e=g?.teaching||{},t=e.intro_md||"",s=Array.isArray(e.key_points)?e.key_points:[],n=he(t)||`
    <p class="dk__teoria-p">T\xE4ll\xE4 oppitunnilla ei ole viel\xE4 opetusmateriaalia. Voit siirty\xE4 suoraan harjoituksiin sivuvalikosta.</p>`,a=s.length?`<aside class="dk__key-points" aria-label="Ydinpoiminnat">
         <p class="dk__key-points-title">Muista n\xE4m\xE4</p>
         <ol>${s.map(i=>`<li>${d(i)}</li>`).join("")}</ol>
       </aside>`:"";return n+a}function Le(e){let t=fe[e.kind]||fe.flashcards;return`
    <div class="dk__placeholder" data-kind="${d(e.kind)}">
      <p class="dk__placeholder-kind">${d(t.label)}</p>
      <p>${d(t.body)}</p>
    </div>`}var G=new Map;function je(e){let t=e?.testDef;return t?((Array.isArray(g?.phases)?g.phases:[])[t.sourcePhase]?.items||[]).slice(0,t.count).filter(a=>Ot.has(a.item_type)):[]}function Te(e,t){let s=G.get(e);return s||(s={submitted:!1,answers:t.map(n=>n.item_type==="mc"?null:n.item_type==="gap_fill"?new Array((String(n.sentence_template||"").match(/\{\d+\}/g)||[]).length).fill(""):""),results:t.map(()=>null),scoreCorrect:0},G.set(e,s)),s}function Ce(e){let t=je(e);if(t.length===0)return`
      <div class="dk__placeholder" data-kind="testi">
        <p>T\xE4ll\xE4 testill\xE4 ei ole viel\xE4 kohtia.</p>
      </div>`;let s=Te(e.id,t),n=e.testDef?.label||e.title||"Testi",a=t.map((o,l)=>Lt(o,l,s)).join(""),i=s.submitted?jt(t,s):"",r=s.submitted?`<button type="button" class="dk__btn dk__btn--ghost" id="dk-testi-reset">Tee uudelleen</button>
       <button type="button" class="dk__btn dk__btn--primary" id="dk-testi-next-sivu">Seuraava sivu \u2192</button>`:'<button type="button" class="dk__btn dk__btn--primary" id="dk-testi-submit">Tarkista testi</button>';return`
    <section class="dk__testi" data-sivu="${d(e.id)}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Testi \xB7 ${d(n)}</span>
        <span class="dk__exercise-score">${t.length} kohtaa</span>
      </header>
      ${i}
      <ol class="dk__testi-list">${a}</ol>
      <div class="dk__exercise-actions dk__testi-actions">${r}</div>
    </section>`}function Lt(e,t,s){let n=s.submitted,a=s.results[t],i=e.item_type==="translate"?e.source||"":e.item_type==="typed"?e.prompt||"":e.item_type==="gap_fill"?null:e.stem||"",r=n?`<span class="dk__feedback-chip ${a?.correct?"is-correct":"is-wrong"}">${a?.correct?"Oikein":"Viel\xE4 ei"}</span>`:`<span class="dk__testi-itemnum">${t+1}</span>`,o="";switch(e.item_type){case"mc":{let c=n?a?.choiceIndex:s.answers[t]===null?-1:s.answers[t],u=e.correct_index;o=`
        <p class="dk__exercise-stem dk__testi-stem">${d(i)}</p>
        <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
          ${(e.choices||[]).map((_,k)=>{let h=c===k,m=k===u,v=["dk__choice"];return n?h&&m?v.push("is-correct"):h&&!m?v.push("is-wrong"):m&&v.push("is-revealed"):h&&v.push("is-selected"),`
              <li>
                <button type="button" class="${v.join(" ")}"
                        data-testi-item="${t}" data-choice="${k}"
                        ${n?"disabled":""}>
                  <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65+k)}</span>
                  <span class="dk__choice-text">${d(_)}</span>
                </button>
              </li>`}).join("")}
        </ol>`;break}case"typed":case"translate":{let c=n?a?.userAnswer||"":s.answers[t]||"";o=`
        <p class="dk__exercise-stem dk__testi-stem">${d(i)}</p>
        <div class="dk__input-row">
          <label class="dk__input-label" for="dk-testi-input-${t}">Vastauksesi</label>
          <${e.item_type==="translate"?`textarea rows="2" id="dk-testi-input-${t}" class="dk__input dk__input--multiline"`:`input id="dk-testi-input-${t}" type="text" class="dk__input"`}
                  data-testi-item="${t}" autocomplete="off" autocapitalize="off" spellcheck="false"
                  ${n?"disabled":""}${e.item_type==="translate"?`>${d(c)}</textarea>`:` value="${d(c)}">`}
        </div>`;break}case"gap_fill":{let c=String(e.sentence_template||""),u=n?a?.userAnswer||[]:s.answers[t]||[],_=0,k=d(c).replace(/\{(\d+)\}/g,()=>{let m=u[_]||"",v=`dk-testi-${t}-gap-${_}`,q=_;return _++,`<input id="${v}" type="text" class="dk__input dk__input--gap"
                       data-testi-item="${t}" data-testi-gap="${q}"
                       autocomplete="off" spellcheck="false"
                       value="${d(m)}" ${n?"disabled":""}>`}),h=Array.isArray(e.word_bank)&&e.word_bank.length?`<ul class="dk__wordbank" aria-label="Sanapankki">
             ${e.word_bank.map(m=>`<li><span>${d(m)}</span></li>`).join("")}
           </ul>`:"";o=`<p class="dk__exercise-stem dk__exercise-stem--gap dk__testi-stem">${k}</p>${h}`;break}default:o=`<p>${d(i)}</p>`}let l=n?`<div class="dk__testi-reveal">
         ${a?.correct?"":`<p class="dk__feedback-expected"><span>Oikea vastaus:</span> ${d(Xe(e)||"")}</p>`}
         ${e.explanation?`<p class="dk__feedback-text">${d(e.explanation)}</p>`:""}
       </div>`:"";return`
    <li class="dk__testi-item ${n?a?.correct?"is-correct":"is-wrong":""}" data-testi-item="${t}">
      <div class="dk__testi-itemhead">
        ${r}
      </div>
      <div class="dk__testi-itembody">
        ${o}
        ${l}
      </div>
    </li>`}function jt(e,t){let s=e.length,n=t.scoreCorrect,a=s?Math.round(n/s*100):0,i=a>=80?"Hyvin meni.":a>=50?"Hyv\xE4 alku. Kertaa virheelliset kohdat.":"Kertaa viel\xE4 ja yrit\xE4 uudelleen.";return`
    <div class="dk__testi-summary" aria-live="polite">
      <div class="dk__testi-summary-score">
        <span class="dk__testi-summary-num">${n} / ${s}</span>
        <span class="dk__testi-summary-pct">${a}%</span>
      </div>
      <p class="dk__testi-summary-headline">${d(i)}</p>
    </div>`}function Tt(e,t){return e.map((n,a)=>{switch(n.item_type){case"mc":return t.answers[a];case"typed":case"translate":{let i=document.getElementById(`dk-testi-input-${a}`);return i?i.value:""}case"gap_fill":return[...document.querySelectorAll(`[data-testi-item="${a}"][data-testi-gap]`)].map(r=>r.value);default:return null}})}function ve(){let e=y(p.sivuId),t=f[e],s=document.querySelector(".dk__content .dk__testi");if(!s)return;let n=document.createElement("div");n.innerHTML=Ce(t),s.replaceWith(n.firstElementChild),Me()}function Me(){let e=document.querySelector(".dk__testi");if(!e)return;let t=e.dataset.sivu,s=f.find(i=>i.id===t),n=je(s),a=Te(t,n);e.querySelectorAll(".dk__choice[data-testi-item]").forEach(i=>{i.addEventListener("click",()=>{if(a.submitted)return;let r=Number(i.dataset.testiItem),o=Number(i.dataset.choice);a.answers[r]=o,e.querySelector(`.dk__testi-item[data-testi-item="${r}"]`)?.querySelectorAll(".dk__choice").forEach(c=>{c.classList.toggle("is-selected",Number(c.dataset.choice)===o)})})}),document.getElementById("dk-testi-submit")?.addEventListener("click",()=>{if(a.submitted)return;a.answers=Tt(n,a);let i=0;a.results=n.map((r,o)=>{let l=te(r,a.answers[o]);return l.correct&&i++,l}),a.scoreCorrect=i,a.submitted=!0,E(t),ve(),requestAnimationFrame(()=>{document.querySelector(".dk__testi-summary")?.scrollIntoView({block:"start",behavior:"smooth"})})}),document.getElementById("dk-testi-reset")?.addEventListener("click",()=>{G.delete(t),ve()}),document.getElementById("dk-testi-next-sivu")?.addEventListener("click",()=>{let i=y(p.sivuId),r=f[i+1];r&&j(r.id)})}var Ct="puheo:dk:itsearvio",P=[{id:"vocab",text:"Hallitsen t\xE4m\xE4n oppitunnin sanaston."},{id:"grammar",text:"Pystyn k\xE4ytt\xE4m\xE4\xE4n uutta kielioppia omissa lauseissani."},{id:"input",text:"Ymm\xE4rr\xE4n aiheen teksti\xE4 ja keskusteluja."},{id:"output",text:"Voin puhua ja kirjoittaa t\xE4st\xE4 aiheesta espanjaksi."}],Mt=["heikko","vajaa","kohtuu","vahva","hallitsen"];function ne(){return`${Ct}:${p.lang}:${p.kurssiKey}:${p.lessonIndex}`}function ae(){try{return JSON.parse(localStorage.getItem(ne())||"null")}catch{return null}}function qe(e){try{localStorage.setItem(ne(),JSON.stringify(e))}catch{}}var z=new Map;function Ke(e){let t=z.get(e);return t||(t={...ae()?.ratings||{}},z.set(e,t)),t}function Pe(e){let t=Ke(e.id),s=ae(),n=!!s,a=P.map(l=>{let c=n?s.ratings?.[l.id]??0:t[l.id]??0,u=[1,2,3,4,5].map(_=>`
      <button type="button"
              class="dk__arvio-btn ${c===_?"is-chosen":""}"
              data-statement="${d(l.id)}"
              data-value="${_}"
              aria-pressed="${c===_}"
              aria-label="${_}, ${d(Mt[_-1])}"
              ${n?"disabled":""}>
        <span class="dk__arvio-num">${_}</span>
      </button>`).join("");return`
      <div class="dk__arvio-row" data-statement="${d(l.id)}">
        <p class="dk__arvio-statement">${d(l.text)}</p>
        <div class="dk__arvio-scale" role="radiogroup" aria-label="${d(l.text)}">
          ${u}
        </div>
        <div class="dk__arvio-scale-axis" aria-hidden="true">
          <span>1 \xB7 heikko</span>
          <span>5 \xB7 hallitsen</span>
        </div>
      </div>`}).join(""),i=P.every(l=>Number.isInteger(t[l.id])&&t[l.id]>0),r=n?`<button type="button" class="dk__btn dk__btn--ghost" id="dk-arvio-reset">P\xE4ivit\xE4 arvio</button>
       <button type="button" class="dk__btn dk__btn--primary" id="dk-arvio-back">Takaisin oppimispolulle</button>`:`<button type="button" class="dk__btn dk__btn--primary" id="dk-arvio-submit" ${i?"":"disabled"}>Tallenna arvio</button>`,o=n?qt(s):"";return`
    <section class="dk__arvio" data-sivu="${d(e.id)}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Itsearviointi</span>
        <span class="dk__exercise-score">${P.length} v\xE4itt\xE4m\xE4\xE4</span>
      </header>
      <p class="dk__arvio-lede">T\xE4m\xE4 on oma kompassisi, ei arvosana. Ole rehellinen, vastaukset ohjaavat seuraavan oppitunnin tasoa.</p>
      ${o}
      <div class="dk__arvio-list">${a}</div>
      <div class="dk__exercise-actions dk__arvio-actions">${r}</div>
    </section>`}function qt(e){let t=e?.ratings||{},s=P.map(i=>t[i.id]).filter(Number.isInteger);if(s.length===0)return"";let n=s.reduce((i,r)=>i+r,0)/s.length,a=n>=4?"Olet vahvalla pohjalla.":n>=3?"Hyv\xE4, suuntaa ty\xF6 heikoimpiin kohtiin.":"Kannattaa kerrata oppitunti ennen seuraavaa.";return`
    <div class="dk__testi-summary" aria-live="polite">
      <div class="dk__testi-summary-score">
        <span class="dk__testi-summary-num">${n.toFixed(1)} / 5</span>
        <span class="dk__testi-summary-pct">Keskiarvo</span>
      </div>
      <p class="dk__testi-summary-headline">${d(a)}</p>
    </div>`}function ge(){let e=y(p.sivuId),t=f[e],s=document.querySelector(".dk__content .dk__arvio");if(!s)return;let n=document.createElement("div");n.innerHTML=Pe(t),s.replaceWith(n.firstElementChild),Re()}function Re(){let e=document.querySelector(".dk__arvio");if(!e)return;let t=e.dataset.sivu,s=Ke(t);e.querySelectorAll(".dk__arvio-btn").forEach(n=>{n.addEventListener("click",()=>{let a=n.dataset.statement,i=Number(n.dataset.value);s[a]=i,e.querySelector(`.dk__arvio-row[data-statement="${a}"]`)?.querySelectorAll(".dk__arvio-btn").forEach(l=>{let c=Number(l.dataset.value)===i;l.classList.toggle("is-chosen",c),l.setAttribute("aria-pressed",c?"true":"false")});let o=document.getElementById("dk-arvio-submit");if(o){let l=P.every(c=>Number.isInteger(s[c.id])&&s[c.id]>0);o.disabled=!l}})}),document.getElementById("dk-arvio-submit")?.addEventListener("click",()=>{let n={ratings:{...s},submittedAt:new Date().toISOString(),lang:p.lang,kurssiKey:p.kurssiKey,lessonIndex:p.lessonIndex};qe(n),E(t),ge(),b()&&w(`${$}/api/digikirja/itsearvio`,{method:"POST",headers:{"Content-Type":"application/json",...x()},body:JSON.stringify({lang:p.lang,kurssi:p.kurssiKey,lesson:p.lessonIndex,ratings:n.ratings})}).catch(()=>{})}),document.getElementById("dk-arvio-reset")?.addEventListener("click",()=>{try{localStorage.removeItem(ne())}catch{}z.delete(t),ge()}),document.getElementById("dk-arvio-back")?.addEventListener("click",()=>{location.hash=`#/oppimispolku/${p.lang}/${encodeURIComponent(p.kurssiKey)}`})}var X=new Map,C="know",Oe="again";function Z(e){return(Array.isArray(e?.vocab)?e.vocab:[]).slice(0,Se)}function ie(){return`${mt}:${p.lang}:${p.kurssiKey}:${p.lessonIndex}`}function re(){try{let e=localStorage.getItem(ie());return e?JSON.parse(e):{}}catch{return{}}}function Kt(e,t){try{let s=re();s[e]=t,localStorage.setItem(ie(),JSON.stringify(s))}catch{}}function Pt(){try{localStorage.removeItem(ie())}catch{}}function He(e){let t=X.get(e);return t||(t={cardIndex:0,flipped:!1},X.set(e,t)),t}function M(e,t){return e?.es?`${t}:${e.es}`:`${t}`}function Ne(e){let t=Z(g);if(t.length===0)return'<div class="dk__placeholder"><p>T\xE4m\xE4n oppitunnin sanasto on tyhj\xE4.</p></div>';let s=re(),n=t.filter((k,h)=>s[M(k,h)]===C).length;if(n===t.length)return`
      <section class="dk__flashpack" data-sivu="${d(e.id)}" data-done="true">
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
      </section>`;let i=He(e.id),r=Math.min(i.cardIndex,t.length-1),l=Be(t,s,r)[0]??r,c=t[l],u=M(c,l),_=s[u]||null;return`
    <section class="dk__flashpack" data-sivu="${d(e.id)}" data-index="${l}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Kortti ${l+1} / ${t.length}</span>
        <span class="dk__exercise-score" aria-label="Hallinnassa">${n} / ${t.length} hallinnassa</span>
      </header>
      ${Rt(c,u,i.flipped,_)}
      <p class="dk__flash-hint">${i.flipped?"Merkitse kortti hallinnaksi tai palaa siihen my\xF6hemmin.":"Yrit\xE4 muistaa ensin omasta p\xE4\xE4st\xE4si. Sitten k\xE4\xE4nn\xE4 kortti."}</p>
    </section>`}function Be(e,t,s){let n=[];for(let a=s;a<e.length;a++){let i=M(e[a],a);t[i]!==C&&n.push(a)}for(let a=0;a<s;a++){let i=M(e[a],a);t[i]!==C&&n.push(a)}return n}function Rt(e,t,s,n){let a=e.gender?`<span class="dk__flashcard-tag">${d(e.gender==="m"?"Maskuliini":e.gender==="f"?"Feminiini":e.gender)}</span>`:"",i=n===Oe?'<span class="dk__flashcard-tag dk__flashcard-tag--again">Harjoittelussa</span>':n===C?'<span class="dk__flashcard-tag dk__flashcard-tag--know">Hallinnassa</span>':"";return`
    <div class="dk__flashcard ${s?"is-flipped":""}"
         id="dk-flashcard"
         role="button"
         tabindex="0"
         data-card="${d(t)}"
         aria-pressed="${s?"true":"false"}"
         aria-label="${d(s?"N\xE4yt\xE4 etupuoli":"K\xE4\xE4nn\xE4 kortti")}">
      <div class="dk__flashcard-inner">
        <div class="dk__flashcard-face dk__flashcard-face--front">
          <div class="dk__flashcard-meta">
            <span class="dk__flashcard-eyebrow">Etupuoli</span>
            ${a}${i}
          </div>
          <p class="dk__flashcard-word">${d(e.es||"")}</p>
          <p class="dk__flashcard-hint-pad">Yrit\xE4 muistaa, sitten k\xE4\xE4nn\xE4.</p>
        </div>
        <div class="dk__flashcard-face dk__flashcard-face--back">
          <div class="dk__flashcard-meta">
            <span class="dk__flashcard-eyebrow">Takapuoli</span>
            ${i}
          </div>
          <p class="dk__flashcard-word">${d(e.fi||"")}</p>
          ${e.example_es?`<p class="dk__flashcard-example"><span lang="es">${d(e.example_es)}</span></p>`:""}
          ${e.example_fi?`<p class="dk__flashcard-example dk__flashcard-example--fi">${d(e.example_fi)}</p>`:""}
        </div>
      </div>
    </div>
    <div class="dk__exercise-actions dk__flash-actions">
      <button type="button" class="dk__btn dk__btn--ghost" id="dk-flash-again" ${s?"":"hidden"}>Harjoittele viel\xE4</button>
      <button type="button" class="dk__btn dk__btn--primary" id="dk-flash-know" ${s?"":"hidden"}>Tied\xE4n</button>
      <button type="button" class="dk__btn dk__btn--primary" id="dk-flash-flip" ${s?"hidden":""}>K\xE4\xE4nn\xE4 kortti</button>
    </div>`}function U(){let e=y(p.sivuId),t=f[e],s=document.querySelector(".dk__content .dk__flashpack");if(!s)return;let n=document.createElement("div");n.innerHTML=Ne(t),s.replaceWith(n.firstElementChild),Ve()}function Ve(){let e=document.querySelector(".dk__flashpack");if(!e)return;let t=e.dataset.sivu;if(document.getElementById("dk-flash-reset")?.addEventListener("click",()=>{Pt(),X.delete(t),U()}),document.getElementById("dk-flash-next-sivu")?.addEventListener("click",()=>{let l=y(p.sivuId),c=f[l+1];c&&j(c.id)}),e.dataset.done==="true")return;let s=He(t),n=Number(e.dataset.index),a=Z(g)[n];if(!a)return;let i=M(a,n),r=()=>{s.flipped=!s.flipped,U()};document.getElementById("dk-flashcard")?.addEventListener("click",r),document.getElementById("dk-flashcard")?.addEventListener("keydown",l=>{(l.key===" "||l.key==="Enter")&&(l.preventDefault(),r())}),document.getElementById("dk-flash-flip")?.addEventListener("click",r);let o=l=>{Kt(i,l),s.flipped=!1;let c=re(),u=Z(g);u.length>0&&u.every((h,m)=>c[M(h,m)]===C)&&E(t);let k=Be(u,c,n+1<u.length?n+1:0);s.cardIndex=k[0]??n,U()};document.getElementById("dk-flash-again")?.addEventListener("click",()=>o(Oe)),document.getElementById("dk-flash-know")?.addEventListener("click",()=>o(C))}var Q=new Map,Ot=new Set(["mc","typed","gap_fill","translate"]),Ht=new Set(["mc","typed","gap_fill","translate","match"]);function L(e){if(!e||e.kind!=="tehtava")return null;let t=/^phase-(\d+)$/.exec(e.id);if(!t)return null;let s=Number(t[1]);return(Array.isArray(g?.phases)?g.phases:[])[s]||null}function De(e,t){let s=Q.get(e);return s||(s={itemIndex:0,answered:new Array(t.length).fill(null),scoreCorrect:0,scoreTotal:0},Q.set(e,s)),s}function Fe(e){let t=L(e);if(!t)return Le(e);let s=Array.isArray(t.items)?t.items:[];if(s.length===0)return'<div class="dk__placeholder"><p>T\xE4ll\xE4 vaiheella ei ole teht\xE4vi\xE4.</p></div>';let n=s[0].item_type;if(n==="writing")return Ue(e,t,s);if(n==="reading_mc")return Ge(e,t,s);if(!Ht.has(n))return`
      <div class="dk__placeholder" data-kind="tehtava">
        <p class="dk__placeholder-kind">Teht\xE4v\xE4tyyppi "${d(n)}"</p>
        <p>T\xE4m\xE4 teht\xE4v\xE4tyyppi avautuu pian. Voit jatkaa muista vaiheista sivuvalikosta.</p>
      </div>`;let a=De(e.id,s),i=Math.min(a.itemIndex,s.length-1),r=s[i],o=a.answered[i];return`
    <section class="dk__exercise" data-sivu="${d(e.id)}" data-index="${i}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Teht\xE4v\xE4 ${i+1} / ${s.length}</span>
        ${a.scoreTotal>0?`<span class="dk__exercise-score" aria-label="Tulos">${a.scoreCorrect} / ${a.scoreTotal}</span>`:""}
      </header>
      ${Ft(r,o)}
      ${zt(r,o,i,s.length)}
    </section>`}var ye=new Map;function We(e){let t=ye.get(e);return t||(t={promptIdx:0,text:"",submitted:!1,result:null,loading:!1,error:null},ye.set(e,t)),t}function Nt(e,t){return!!(e?.yo_task||e?.is_yo||t?.yo_task)}function Ue(e,t,s){let n=We(e.id),a=s[Math.min(n.promptIdx,s.length-1)]||s[0],i=S(a.min_words||50),r=S(a.max_words||120),o=t.instruction||"",l=Nt(a,t),c=n.submitted&&n.result&&n.result.maxScore!=null?n.result.maxScore:20,u=n.submitted&&n.result&&n.result.finalScore!=null?n.result.finalScore:0,_=s.length>1&&!n.submitted?`<div class="dk__writing-switcher" role="tablist" aria-label="Valitse aihe">
         ${s.map((h,m)=>`
           <button type="button"
                   class="dk__writing-tab ${m===n.promptIdx?"is-active":""}"
                   data-prompt-idx="${m}"
                   role="tab"
                   aria-selected="${m===n.promptIdx}">
             Aihe ${m+1}
           </button>`).join("")}
       </div>`:"",k=n.submitted&&n.result?Vt(n,l):Bt(a,n,i,r,o);return`
    <section class="dk__writing" data-sivu="${d(e.id)}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">${l?"YO-kirjoitusteht\xE4v\xE4":"Kirjoitusteht\xE4v\xE4"}</span>
        <span class="dk__exercise-score" aria-label="Pisteet">${u} / ${c} p</span>
      </header>
      ${_}
      ${k}
    </section>`}function Bt(e,t,s,n,a){let i=d(e.prompt||"").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),r=ee(t.text),o=r>=s&&r<=n?"dk__writing-counter is-ok":r>n?"dk__writing-counter is-over":"dk__writing-counter is-short",l=r<s||t.loading,c=t.loading?"Arvioidaan\u2026":"L\xE4het\xE4 arvioitavaksi",u=a?`<p class="dk__writing-instruction">${d(a)}</p>`:"",_=t.error?`<p class="dk__writing-error" role="alert">${d(t.error)}</p>`:"";return`
    ${u}
    <p class="dk__writing-prompt">${i}</p>
    <div class="dk__writing-composer">
      <label class="dk__input-label" for="dk-writing-input">Vastauksesi</label>
      <textarea id="dk-writing-input"
                class="dk__input dk__input--multiline dk__writing-textarea"
                rows="12"
                autocomplete="off"
                spellcheck="false"
                placeholder="Kirjoita vastauksesi t\xE4h\xE4n\u2026"
                ${t.loading?"disabled":""}>${d(t.text)}</textarea>
      <div class="dk__writing-meta">
        <span class="${o}" aria-live="polite">
          <strong id="dk-writing-chars">${r}</strong> / ${s}\u2013${n} merkki\xE4
        </span>
        <span class="dk__writing-rubric">Arvioidaan YTL-rubriikilla</span>
      </div>
      ${_}
      <div class="dk__exercise-actions">
        <button type="button"
                class="dk__btn dk__btn--primary"
                id="dk-writing-submit"
                ${l?"disabled":""}>
          ${d(c)}
        </button>
      </div>
    </div>`}function Vt(e,t=!1){let s=e.result||{},n=s.finalScore!=null?s.finalScore:"\u2014",a=s.maxScore!=null?s.maxScore:"",i=t&&s.ytlGrade?`<span class="dk__writing-grade">YTL ${d(String(s.ytlGrade))}</span>`:"",r=Array.isArray(s.errors)?s.errors:[],o=Array.isArray(s.annotations)?s.annotations.filter(_=>_?.type==="positive"):[],l=s.overall_feedback_fi?`<p class="dk__writing-overall">${d(s.overall_feedback_fi)}</p>`:"",c=r.length?`<div class="dk__writing-section">
         <h3 class="dk__writing-section-title">Korjattavaa</h3>
         <ul class="dk__writing-errors">
           ${r.slice(0,6).map(_=>`
             <li>
               <span class="dk__writing-error-wrong">${d(_.excerpt||_.original||"")}</span>
               <span aria-hidden="true">\u2192</span>
               <span class="dk__writing-error-right">${d(_.corrected||_.correct||"")}</span>
               ${_.explanation_fi?`<p class="dk__writing-error-expl">${d(_.explanation_fi)}</p>`:""}
             </li>`).join("")}
         </ul>
       </div>`:"",u=o.length?`<div class="dk__writing-section">
         <h3 class="dk__writing-section-title">Hyvin tehty</h3>
         <ul class="dk__writing-positives">
           ${o.slice(0,4).map(_=>`<li>${d(_.comment_fi||"")}</li>`).join("")}
         </ul>
       </div>`:"";return`
    <div class="dk__writing-result">
      <div class="dk__writing-score">
        <span class="dk__writing-score-num">${d(String(n))}</span>
        <span class="dk__writing-score-denom">/ ${d(String(a))}</span>
        ${i}
      </div>
      ${l}
      ${u}
      ${c}
      <div class="dk__exercise-actions">
        <button type="button" class="dk__btn dk__btn--ghost" id="dk-writing-retry">Kirjoita uudestaan</button>
        <button type="button" class="dk__btn dk__btn--primary" id="dk-writing-next">Seuraava sivu \u2192</button>
      </div>
    </div>`}function ee(e){return String(e||"").length}function Dt(e){let t=e.min_words||50,s=e.max_words||120,n=s>=200?"long":"short";return{taskType:n,points:20,charMin:Math.max(60,S(t)),charMax:Math.max(120,S(s)),situation:"",prompt:e.prompt||"",requirements:[],textType:n==="long"?"pidempi kirjoitelma":"lyhyt kirjoitelma"}}function Ye(){let e=document.querySelector(".dk__writing");if(!e)return;let t=e.dataset.sivu,s=f.find(c=>c.id===t);if(!s)return;let n=L(s);if(!n)return;let a=Array.isArray(n.items)?n.items:[],i=We(t);e.querySelectorAll(".dk__writing-tab").forEach(c=>{c.addEventListener("click",()=>{let u=Number(c.dataset.promptIdx);Number.isInteger(u)&&u!==i.promptIdx&&(i.promptIdx=u,i.text="",i.error=null,N(t))})});let r=e.querySelector("#dk-writing-input"),o=e.querySelector("#dk-writing-chars"),l=e.querySelector("#dk-writing-submit");r?.addEventListener("input",()=>{i.text=r.value;let c=ee(i.text);o&&(o.textContent=c);let u=a[i.promptIdx]||a[0],_=S(u.min_words||50),k=S(u.max_words||120);l&&(l.disabled=c<_||i.loading);let h=e.querySelector(".dk__writing-counter");h&&(h.classList.remove("is-ok","is-over","is-short"),c>k?h.classList.add("is-over"):c>=_?h.classList.add("is-ok"):h.classList.add("is-short"))}),l?.addEventListener("click",async()=>{if(i.loading)return;let c=a[i.promptIdx]||a[0],u=S(c.min_words||50);if(!(ee(i.text)<u)){i.loading=!0,i.error=null,N(t);try{let _=Dt(c),k={"Content-Type":"application/json"};b()&&Object.assign(k,x());let h=await w(`${$}/api/grade-writing`,{method:"POST",headers:k,body:JSON.stringify({task:_,studentText:i.text})});if(!h.ok){let v=await h.json().catch(()=>({}));throw new Error(v?.error||`Arvionti ep\xE4onnistui (${h.status})`)}let m=await h.json();if(!m?.result)throw new Error("Ei tulosta palvelimelta");i.result=m.result,i.submitted=!0,E(t)}catch(_){i.error=String(_?.message||"Arvionti ei nyt vastaa, yrit\xE4 hetken p\xE4\xE4st\xE4.")}finally{i.loading=!1,N(t)}}}),e.querySelector("#dk-writing-retry")?.addEventListener("click",()=>{i.submitted=!1,i.result=null,i.text="",N(t)}),e.querySelector("#dk-writing-next")?.addEventListener("click",()=>{let c=y(t),u=f[c+1];u&&j(u.id)})}function N(e){let t=document.querySelector(`.dk__writing[data-sivu="${e}"]`);if(!t)return;let s=f.find(o=>o.id===e),n=L(s);if(!s||!n)return;let a=Array.isArray(n.items)?n.items:[],i=Ue(s,n,a),r=document.createElement("div");r.innerHTML=i,t.replaceWith(r.firstElementChild),Ye()}var be=new Map;function Je(e,t){let s=be.get(e);return s||(s={itemIdx:0,answers:t.map(n=>new Array((n.questions||[]).length).fill(null)),submitted:t.map(()=>!1)},be.set(e,s)),s}function Ge(e,t,s){let n=Je(e.id,s),a=Math.min(n.itemIdx,s.length-1),i=s[a]||{},r=Array.isArray(i.questions)?i.questions:[],o=!!n.submitted[a],l=n.answers[a]||[],c=o?l.reduce((m,v,q)=>m+(v===r[q]?.correct_index?1:0),0):0,u=d(i.passage||"").split(/\n\n+/).map(m=>`<p>${m.replace(/\n/g,"<br>")}</p>`).join(""),_=r.map((m,v)=>{let q=Array.isArray(m.choices)?m.choices:[],oe=l[v],V=m.correct_index;return`
      <div class="dk__reading-q" data-qi="${v}">
        <p class="dk__reading-q-stem">${v+1}. ${d(m.question_fi||"")}</p>
        <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
          ${q.map((st,K)=>{let ce=oe===K,nt=o&&K===V,at=o&&ce&&K!==V,O=["dk__choice"];return at?O.push("is-wrong"):nt?O.push("is-correct"):ce&&!o&&O.push("is-selected"),`
              <li>
                <button type="button"
                        class="${O.join(" ")}"
                        data-qi="${v}" data-ci="${K}"
                        ${o?"disabled":""}>
                  <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65+K)}</span>
                  <span class="dk__choice-text">${d(st)}</span>
                </button>
              </li>`}).join("")}
        </ol>
        ${o&&m.explanation_fi?`<p class="dk__reading-expl ${oe===V?"is-correct":"is-wrong"}">${d(m.explanation_fi)}</p>`:""}
      </div>`}).join(""),k=a>=s.length-1,h=o?`<div class="dk__feedback" aria-live="polite">
         <span class="dk__feedback-chip ${c===r.length?"is-correct":"is-wrong"}">
           ${c} / ${r.length} oikein
         </span>
       </div>
       <div class="dk__exercise-actions">
         <button type="button" class="dk__btn dk__btn--primary" id="dk-reading-next">
           ${k?"Vaihe valmis \u2192":"Seuraava teksti \u2192"}
         </button>
       </div>`:`<div class="dk__exercise-actions">
         <button type="button"
                 class="dk__btn dk__btn--primary"
                 id="dk-reading-submit"
                 ${l.some(m=>m==null)?"disabled":""}>
           Tarkista vastaukset
         </button>
       </div>`;return`
    <section class="dk__reading" data-sivu="${d(e.id)}" data-item="${a}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Teksti ${a+1} / ${s.length}</span>
        <span class="dk__exercise-score" aria-label="Kysymyksi\xE4">${r.length} kysymyst\xE4</span>
      </header>
      <div class="dk__reading-passage">${u}</div>
      <div class="dk__reading-questions">${_}</div>
      ${h}
    </section>`}function ze(){let e=document.querySelector(".dk__reading");if(!e)return;let t=e.dataset.sivu,s=f.find(o=>o.id===t);if(!s)return;let n=L(s);if(!n)return;let a=Array.isArray(n.items)?n.items:[],i=Je(t,a),r=Number(e.dataset.item)||0;e.querySelectorAll(".dk__choice").forEach(o=>{o.addEventListener("click",()=>{if(i.submitted[r])return;let l=Number(o.dataset.qi),c=Number(o.dataset.ci);i.answers[r][l]=c,Y(t)})}),e.querySelector("#dk-reading-submit")?.addEventListener("click",()=>{i.answers[r].some(o=>o==null)||(i.submitted[r]=!0,i.submitted.every(Boolean)&&E(t),Y(t))}),e.querySelector("#dk-reading-next")?.addEventListener("click",()=>{if(r<a.length-1)i.itemIdx=r+1,Y(t);else{let o=y(t),l=f[o+1];l&&j(l.id)}})}function Y(e){let t=document.querySelector(`.dk__reading[data-sivu="${e}"]`);if(!t)return;let s=f.find(o=>o.id===e),n=L(s);if(!s||!n)return;let a=Array.isArray(n.items)?n.items:[],i=Ge(s,n,a),r=document.createElement("div");r.innerHTML=i,t.replaceWith(r.firstElementChild),ze()}function Ft(e,t){switch(e.item_type){case"mc":return Wt(e,t);case"typed":return Ut(e,t);case"gap_fill":return Yt(e,t);case"translate":return Jt(e,t);case"match":return Gt(e,t);default:return`<p class="dk__teoria-p">Teht\xE4v\xE4tyyppi \u201D${d(e.item_type)}\u201D ei ole viel\xE4 k\xE4ytett\xE4viss\xE4.</p>`}}function Wt(e,t){let s=Array.isArray(e.choices)?e.choices:[],n=Number.isInteger(e.correct_index)?e.correct_index:-1,a=!!t,i=t?.choiceIndex;return`
    <p class="dk__exercise-stem">${d(e.stem||"")}</p>
    <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
      ${s.map((r,o)=>{let l=a&&i===o,c=a&&o===n,u=["dk__choice"];return l&&c?u.push("is-correct"):l&&!c?u.push("is-wrong"):a&&c&&u.push("is-revealed"),`
          <li>
            <button type="button" class="${u.join(" ")}"
                    data-choice="${o}"
                    ${a?"disabled":""}>
              <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65+o)}</span>
              <span class="dk__choice-text">${d(r)}</span>
            </button>
          </li>`}).join("")}
    </ol>`}function Ut(e,t){let s=e.hint||"",n=t?.userAnswer||"",a=!!t;return`
    <p class="dk__exercise-stem">${d(e.prompt||"")}</p>
    ${s?`<p class="dk__exercise-hint">${d(s)}</p>`:""}
    <div class="dk__input-row">
      <label class="dk__input-label" for="dk-input">Vastauksesi</label>
      <input id="dk-input" type="text" class="dk__input"
             autocomplete="off" autocapitalize="off" spellcheck="false"
             value="${d(n)}"
             ${a?"disabled":""}>
    </div>`}function Yt(e,t){let s=String(e.sentence_template||""),n=(s.match(/\{(\d+)\}/g)||[]).length,a=t?.userAnswer||new Array(n).fill(""),i=!!t,r=0,o=d(s).replace(/\{(\d+)\}/g,()=>{let c=a[r]||"",u=`dk-gap-${r}`;return r++,`<input id="${u}" type="text" class="dk__input dk__input--gap"
                   data-gap="${r-1}" autocomplete="off" spellcheck="false"
                   value="${d(c)}" ${i?"disabled":""}>`}),l=Array.isArray(e.word_bank)&&e.word_bank.length?`<ul class="dk__wordbank" aria-label="Sanapankki">
         ${e.word_bank.map(c=>`
           <li>
             <button type="button" class="dk__wordbank-chip"
                     data-word="${d(c)}"
                     ${i?"disabled":""}>
               ${d(c)}
             </button>
           </li>`).join("")}
       </ul>`:"";return`
    <p class="dk__exercise-stem dk__exercise-stem--gap">${o}</p>
    ${l}`}function Jt(e,t){let s=e.direction==="es_to_fi"?"espanjasta suomeksi":e.direction==="fi_to_es"?"suomesta espanjaksi":"k\xE4\xE4nn\xF6s",n=t?.userAnswer||"",a=!!t;return`
    <p class="dk__exercise-eyebrow-tag">K\xE4\xE4nn\xF6s, ${d(s)}</p>
    <p class="dk__exercise-stem">${d(e.source||e.prompt||"")}</p>
    <div class="dk__input-row">
      <label class="dk__input-label" for="dk-input">Vastauksesi</label>
      <textarea id="dk-input" class="dk__input dk__input--multiline"
                rows="3" autocomplete="off" spellcheck="false"
                ${a?"disabled":""}>${d(n)}</textarea>
    </div>`}function Gt(e,t){let s=Array.isArray(e.pairs)?e.pairs:[];if(t){let i=(Array.isArray(t.rows)?t.rows:[]).map(r=>`
      <li class="dk__match-result ${r.ok?"is-correct":"is-wrong"}">
        <span class="dk__match-result-left">${d(r.left)}</span>
        <span class="dk__match-result-arrow" aria-hidden="true">\u2192</span>
        <span class="dk__match-result-right">${d(r.studentRight||"\u2014")}</span>
        ${r.ok?"":`<span class="dk__match-result-fix">oikein: ${d(r.correctRight)}</span>`}
      </li>`).join("");return`
      <p class="dk__exercise-stem">Yhdist\xE4misteht\xE4v\xE4</p>
      <p class="dk__match-score">${t.correctCount} / ${t.total} oikein</p>
      <ul class="dk__match-results">${i}</ul>`}let n=ft(s.map(a=>a.right));return`
    <p class="dk__exercise-stem">Valitse vasemmalta sana, sitten sen pari oikealta.</p>
    <div class="dk__match" data-match>
      <div class="dk__match-cols">
        <ul class="dk__match-col" data-col="left"${e.left_label?` aria-label="${d(e.left_label)}"`:""}>
          ${s.map((a,i)=>`
            <li>
              <button type="button" class="dk__match-cell" data-side="left" data-idx="${i}">
                <span class="dk__match-cell-text">${d(a.left)}</span>
                <span class="dk__match-cell-slot" data-slot></span>
              </button>
            </li>`).join("")}
        </ul>
        <ul class="dk__match-col" data-col="right"${e.right_label?` aria-label="${d(e.right_label)}"`:""}>
          ${n.map(a=>`
            <li>
              <button type="button" class="dk__match-cell" data-side="right" data-val="${d(a)}">
                ${d(a)}
              </button>
            </li>`).join("")}
        </ul>
      </div>
    </div>`}function zt(e,t,s,n){if(!t)return`
      <div class="dk__exercise-actions">
        <button type="button" class="dk__btn dk__btn--primary" id="dk-check">Tarkista</button>
      </div>`;let a=t.correct,i=a?"is-correct":"is-wrong",r=a?"Oikein":"Viel\xE4 ei aivan",o=Xt(e,t),l=s>=n-1;return`
    <div class="dk__feedback" aria-live="polite">
      <span class="dk__feedback-chip ${i}">${r}</span>
      ${o}
    </div>
    <div class="dk__exercise-actions">
      <button type="button" class="dk__btn dk__btn--primary" id="dk-next-item">
        ${l?"Vaihe valmis \u2192":"Seuraava \u2192"}
      </button>
    </div>`}function Xt(e,t){let s=Xe(e),n=s?`<p class="dk__feedback-expected"><span>Oikea vastaus:</span> ${d(s)}</p>`:"",a=e.explanation?`<p class="dk__feedback-text">${d(e.explanation)}</p>`:"",i=t?.accentHint?`<p class="dk__feedback-text dk__feedback-hint">${d(t.accentHint)}</p>`:"";return`${n}${i}${a}`}function Xe(e){switch(e.item_type){case"mc":return Array.isArray(e.choices)&&Number.isInteger(e.correct_index)?e.choices[e.correct_index]:"";case"typed":return Array.isArray(e.accept)&&e.accept[0]||"";case"translate":return Array.isArray(e.accept)&&e.accept[0]||"";case"gap_fill":{let t=String(e.sentence_template||""),s=Array.isArray(e.answers)?e.answers:[],n=0;return t.replace(/\{(\d+)\}/g,()=>{let a=s[n++];return Array.isArray(a)&&a[0]||"\u2014"})}case"match":return"";default:return""}}function te(e,t){switch(e.item_type){case"mc":{let s=Number(t);return{correct:s===e.correct_index,choiceIndex:s}}case"typed":case"translate":{let s=String(t||"").trim(),n=Array.isArray(e.accept)?e.accept:[];for(let a of n){let i=F(s,a,p.lang||"es");if(i.ok)return{correct:!0,userAnswer:s,accentHint:i.hint||null}}return{correct:!1,userAnswer:s}}case"gap_fill":{let s=Array.isArray(t)?t:[],n=Array.isArray(e.answers)?e.answers:[],a=!0;for(let i=0;i<n.length;i++){let r=Array.isArray(n[i])?n[i]:[n[i]],o=String(s[i]||"").trim(),l=!1;for(let c of r)if(F(o,String(c),p.lang||"es").ok){l=!0;break}if(!l){a=!1;break}}return{correct:a,userAnswer:s}}case"match":{let s=Array.isArray(e.pairs)?e.pairs:[],n=Array.isArray(t)?t:[],a=0,i=s.map((r,o)=>{let l=n[o]||"",c=pe(r.left,l,r.left,r.right);return c&&a++,{left:r.left,studentRight:l,correctRight:r.right,ok:c}});return{correct:s.length>0&&a===s.length,userAnswer:n,rows:i,correctCount:a,total:s.length}}default:return{correct:!1}}}function Zt(e){let t=document.querySelector(".dk__exercise");if(!t)return null;switch(e.item_type){case"typed":case"translate":{let s=t.querySelector("#dk-input");return s?s.value:""}case"gap_fill":return[...t.querySelectorAll(".dk__input--gap")].map(s=>s.value);case"match":{let s=[];return t.querySelectorAll('.dk__match-cell[data-side="left"]').forEach(n=>{s[Number(n.dataset.idx)]=n.dataset.assigned||""}),s}default:return null}}function J(){let e=y(p.sivuId),t=f[e],s=document.querySelector(".dk__content .dk__exercise");if(!s)return;let n=document.createElement("div");n.innerHTML=Fe(t),s.replaceWith(n.firstElementChild),Ze()}function Ze(){let e=document.querySelector(".dk__exercise");if(!e)return;let t=e.dataset.sivu,s=f.find(c=>c.id===t),n=L(s);if(!n)return;let a=n.items||[],i=Number(e.dataset.index),r=a[i];if(!r)return;let o=De(t,a);if(e.querySelectorAll(".dk__choice").forEach(c=>{c.addEventListener("click",()=>{if(o.answered[i])return;let u=Number(c.dataset.choice),_=te(r,u);o.answered[i]=_,_.correct&&o.scoreCorrect++,o.scoreTotal++,o.scoreTotal>=a.length&&E(t),J()})}),document.getElementById("dk-check")?.addEventListener("click",()=>{if(o.answered[i])return;let c=Zt(r),u=te(r,c);o.answered[i]=u,u.correct&&o.scoreCorrect++,o.scoreTotal++,o.scoreTotal>=a.length&&E(t),J()}),e.querySelector("#dk-input")?.addEventListener("keydown",c=>{c.key==="Enter"&&!c.shiftKey&&!o.answered[i]&&(c.preventDefault(),document.getElementById("dk-check")?.click())}),e.querySelectorAll(".dk__wordbank-chip").forEach(c=>{c.addEventListener("click",()=>{if(o.answered[i])return;let u=c.dataset.word||"",_=[...e.querySelectorAll(".dk__input--gap")],k=_.find(h=>!h.value.trim())||_[_.length-1];k&&(k.value=u,k.focus())})}),r.item_type==="match"&&!o.answered[i]){let c=null,u=k=>{e.querySelectorAll('.dk__match-cell[data-side="left"]').forEach(h=>h.classList.remove("is-active")),k&&k.classList.add("is-active"),c=k},_=k=>{k&&(e.querySelectorAll('.dk__match-cell[data-side="left"]').forEach(h=>{if(h.dataset.assigned===k){delete h.dataset.assigned,h.classList.remove("is-assigned");let m=h.querySelector("[data-slot]");m&&(m.textContent="")}}),e.querySelectorAll('.dk__match-cell[data-side="right"]').forEach(h=>{h.dataset.val===k&&h.classList.remove("is-assigned")}))};e.querySelectorAll('.dk__match-cell[data-side="left"]').forEach(k=>{k.addEventListener("click",()=>{u(k===c?null:k)})}),e.querySelectorAll('.dk__match-cell[data-side="right"]').forEach(k=>{k.addEventListener("click",()=>{if(!c)return;let h=k.dataset.val;_(c.dataset.assigned),_(h),c.dataset.assigned=h,c.classList.add("is-assigned");let m=c.querySelector("[data-slot]");m&&(m.textContent=h),k.classList.add("is-assigned"),u(null)})})}document.getElementById("dk-next-item")?.addEventListener("click",()=>{if(i<a.length-1)o.itemIndex=i+1,J();else{let c=y(p.sivuId),u=f[c+1];u&&j(u.id)}})}function Qe(){let e=g?.meta||{},t=y(p.sivuId),s=f[t],n=t>0?f[t-1]:null,a=t<f.length-1?f[t+1]:null,i=[Ae(e.course_key||p.kurssiKey),`Oppitunti ${e.lesson_index||p.lessonIndex}`].filter(Boolean).join(" \xB7 "),r=s.kind==="teoria"?`<em>${d(s.title)}</em>`:`${s.num?`${d(s.num)} \xB7 `:""}${d(s.title)}`,o=s.kind==="teoria"?Et():s.kind==="tehtava"?Fe(s):s.kind==="flashcards"?Ne(s):s.kind==="testi"?Ce(s):s.kind==="itsearviointi"?Pe(s):Le(s);return`
    <main class="dk__content" id="dk-content" tabindex="-1">
      <p class="dk__page-meta">${d(i)}</p>
      <h2 class="dk__page-title">${r}</h2>
      ${o}
      ${Qt(n,a,"bottom")}
    </main>`}function Qt(e,t,s){let n=`dk__prevnext dk__prevnext--${s}`,a=e?`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" data-sivu="${d(e.id)}">
         <span class="dk__prevnext-dir">\u2190 Edellinen</span>
         <span class="dk__prevnext-label">${d(e.num?e.num+" \xB7 "+e.title:e.title)}</span>
       </button>`:`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" disabled>
         <span class="dk__prevnext-dir">\u2190 Edellinen</span>
         <span class="dk__prevnext-label">Oppitunnin alku</span>
       </button>`,i=t?`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--next" data-sivu="${d(t.id)}">
         <span class="dk__prevnext-dir">Seuraava \u2192</span>
         <span class="dk__prevnext-label">${d(t.num?t.num+" \xB7 "+t.title:t.title)}</span>
       </button>`:`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--next" disabled>
         <span class="dk__prevnext-dir">Seuraava \u2192</span>
         <span class="dk__prevnext-label">Oppitunti valmis</span>
       </button>`;return`<div class="${n}">${a}${i}</div>`}function es(){return`
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
    </div>`}function ts(e){return`
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
            <p>${d(String(e?.message||e||"Tuntematon virhe"))}</p>
            <p>Palaa <a href="#/oppimispolku?lang=${d(p.lang)}">Oppimispolulle</a> ja kokeile toista oppituntia.</p>
          </div>
        </main>
      </div>
    </div>`}function R(e){let t=document.getElementById("dk-root");if(!t)return;t.dataset.sidemenu=e;let s=document.getElementById("dk-toggle-sidemenu");s&&s.setAttribute("aria-pressed",e===A?"true":"false")}function ss(){let e=document.getElementById("dk-toggle-sidemenu"),t=document.getElementById("dk-sidemenu-backdrop");e?.addEventListener("click",()=>{let s=document.getElementById("dk-root");if(window.matchMedia("(max-width: 1023px)").matches){let a=s.dataset.sidemenu===T?A:T;R(a)}else{let a=s.dataset.sidemenu===A?T:A;R(a),gt(a)}}),t?.addEventListener("click",()=>{R(A)})}function j(e){if(!e||e===p.sivuId||f.findIndex(r=>r.id===e)<0)return;p.sivuId=e;let s=`#/oppitunti/${p.lang}/${encodeURIComponent(p.kurssiKey)}/${p.lessonIndex}/${encodeURIComponent(e)}`;location.hash!==s&&history.replaceState(null,"",s);let n=document.getElementById("dk-root");if(!n)return;let a=n.querySelector(".dk__sidemenu-list");a&&a.querySelectorAll(".dk__row").forEach(r=>{let o=r.dataset.sivu===e;r.classList.toggle("is-active",o),r.setAttribute("aria-current",o?"page":"false")});let i=n.querySelector(".dk__content");if(i){let r=document.createElement("div");r.innerHTML=Qe(),i.replaceWith(r.firstElementChild),tt()}window.matchMedia("(max-width: 1023px)").matches&&R(A),et(),Ee(),se(),document.getElementById("dk-content")?.focus({preventScroll:!1})}function ns(){document.getElementById("dk-sidemenu-list")?.addEventListener("click",e=>{let t=e.target.closest(".dk__row");t&&j(t.dataset.sivu)})}function et(){let e=document.getElementById("dk-sidemenu-list");if(!e)return;let t=e.querySelector(".dk__row.is-active");t&&requestAnimationFrame(()=>{try{t.scrollIntoView({block:"nearest",inline:"nearest",behavior:"auto"})}catch{let s=t.offsetTop-e.clientHeight/2+t.clientHeight/2;e.scrollTop=Math.max(0,s)}})}function tt(){document.querySelectorAll(".dk__content .dk__prevnext-btn[data-sivu]").forEach(e=>{e.addEventListener("click",()=>j(e.dataset.sivu))}),Ze(),Ve(),Me(),Re(),Ye(),ze()}function as(){Ie=!0}async function is(e={}){Ie||as(),p.lang=e.lang||p.lang,p.kurssiKey=e.kurssiKey||p.kurssiKey,p.lessonIndex=Number(e.lessonIndex)||p.lessonIndex,p.sivuId=e.sivuId||p.sivuId||"teoria";let t=document.getElementById("screen-digikirja");if(!t)return;t.innerHTML=es(),de("screen-digikirja"),import("./app-sidebarShell-AYWBPBLF.js").then(n=>n.setSidebarMode("book"));let s=`${p.lang}/${p.kurssiKey}/${p.lessonIndex}`;H=s;try{let[n]=await Promise.all([$t(p),xt(p)]);if(H!==s||(g=n,await ut(n,s),H!==s))return;f=wt(n),f.some(r=>r.id===p.sivuId)||(p.sivuId=f[0]?.id||"teoria");let i=window.matchMedia("(max-width: 1023px)").matches?A:vt();t.innerHTML=`
      <div class="dk" id="dk-root" data-sidemenu="${i}">
        ${St()}
        <div class="dk__body">
          ${It()}
          ${Qe()}
        </div>
      </div>`,R(i),ss(),ns(),At(),tt(),et(),Ee(),se()}catch(n){if(H!==s)return;t.innerHTML=ts(n)}}function ks(e){let t=/^#\/oppitunti\/([a-z]{2})\/([^/?#]+)\/(\d+)\/([^/?#]+)/i.exec(e||location.hash);return t?(is({lang:t[1].toLowerCase(),kurssiKey:decodeURIComponent(t[2]),lessonIndex:Number(t[3]),sivuId:decodeURIComponent(t[4])}),!0):!1}export{as as initDigikirja,is as showDigikirja,ks as tryRouteDigikirja};
//# sourceMappingURL=app-digikirja-3ZJGU7RH.js.map
