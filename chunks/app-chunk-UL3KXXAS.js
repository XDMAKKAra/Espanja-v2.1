import{a as i,b as r}from"./app-chunk-PXMVMW5B.js";var l=null;function c(){l&&(clearInterval(l),l=null);let e=i("loading-staged");e&&(e.classList.add("hidden"),e.innerHTML="")}function g(e,d={}){c(),r("screen-loading");let s=i("loading-text");s.classList.remove("hidden"),s.textContent=e,i("loading-spinner").style.display="";let n=i("loading-subtext"),t=i("loading-retry");n.classList.add("hidden"),t.classList.add("hidden"),d.subtext&&(n.textContent=d.subtext,n.classList.remove("hidden"))}function h(e,d={}){c(),r("screen-loading"),i("loading-spinner").style.display="none",i("loading-text").classList.add("hidden"),i("loading-subtext").classList.add("hidden"),i("loading-retry").classList.add("hidden");let s=i("loading-staged");if(!s||!Array.isArray(e)||e.length===0)return()=>{};s.classList.remove("hidden");let n=o=>{s.innerHTML=`<ul class="loading-steps">${e.map((u,v)=>`<li class="loading-step ${v<o?"is-done":v===o?"is-active":"is-pending"}">
        <span class="loading-step__dot" aria-hidden="true"></span>
        <span class="loading-step__label">${u}</span>
      </li>`).join("")}</ul>`},t=0;n(t);let a=d.stepMs||1500;return l=setInterval(()=>{t<e.length-1?(t++,n(t)):(clearInterval(l),l=null)},a),function(){l&&(clearInterval(l),l=null)}}function x(e,d){c(),i("loading-spinner").style.display="none";let s=i("loading-text");s.classList.remove("hidden"),s.textContent="Jokin meni pieleen";let n=i("loading-subtext");n.textContent=e,n.classList.remove("hidden");let t=i("loading-retry");d&&(t.classList.remove("hidden"),t.onclick=d)}var k={exercise:`
    <div class="skeleton-exercise" data-testid="skeleton-exercise" aria-hidden="true">
      <div class="skeleton-bar skeleton-bar-wide"></div>
      <div class="skeleton-bar skeleton-bar-medium"></div>
      <div class="skeleton-options">
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
      </div>
      <div class="skeleton-hint">Etsit\xE4\xE4n sopivaa teht\xE4v\xE4\xE4 sinulle\u2026</div>
    </div>`,vocab:`
    <div class="skeleton-exercise skeleton-exercise--vocab" data-testid="skeleton-exercise" aria-hidden="true">
      <div class="skeleton-bar skeleton-bar-eyebrow"></div>
      <div class="skeleton-bar skeleton-bar-prompt"></div>
      <div class="skeleton-options">
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
      </div>
      <div class="skeleton-hint">Etsit\xE4\xE4n sopivia sanoja sinulle\u2026</div>
    </div>`,grammar:`
    <div class="skeleton-exercise skeleton-exercise--grammar" data-testid="skeleton-exercise" aria-hidden="true">
      <div class="skeleton-bar skeleton-bar-rulechip"></div>
      <div class="skeleton-bar skeleton-bar-wide"></div>
      <div class="skeleton-bar skeleton-bar-medium"></div>
      <div class="skeleton-options">
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
        <div class="skeleton-option"></div>
      </div>
      <div class="skeleton-hint">Mietit\xE4\xE4n seuraavaa rakennetta\u2026</div>
    </div>`,reading:`
    <div class="skeleton-exercise skeleton-exercise--reading" data-testid="skeleton-exercise" aria-hidden="true">
      <div class="skeleton-bar skeleton-bar-title"></div>
      <div class="skeleton-bar skeleton-bar-wide"></div>
      <div class="skeleton-bar skeleton-bar-wide"></div>
      <div class="skeleton-bar skeleton-bar-wide"></div>
      <div class="skeleton-bar skeleton-bar-medium"></div>
      <div class="skeleton-bar skeleton-bar-wide"></div>
      <div class="skeleton-bar skeleton-bar-medium"></div>
      <div class="skeleton-reading-q"></div>
      <div class="skeleton-reading-q"></div>
      <div class="skeleton-reading-q"></div>
      <div class="skeleton-hint">Luetaan teksti valmiiksi sinulle\u2026</div>
    </div>`,"writing-task":`
    <div class="skeleton-exercise" data-testid="skeleton-exercise" aria-hidden="true">
      <div class="skeleton-bar skeleton-bar-wide"></div>
      <div class="skeleton-bar skeleton-bar-wide"></div>
      <div class="skeleton-bar skeleton-bar-medium"></div>
      <div class="skeleton-hint">Generoidaan kirjoitusteht\xE4v\xE4\xE4\u2026</div>
    </div>`};function m(e,d="exercise"){let s=typeof e=="string"?document.getElementById(e):e;s&&(s.innerHTML=k[d]||k.exercise)}function f(e,{title:d,subtext:s,retryFn:n}={}){let t=typeof e=="string"?document.getElementById(e):e;if(!t)return;t.innerHTML=`
    <div class="fetch-error" role="alert" data-testid="fetch-error">
      <div class="fetch-error-title">${d||"Jokin meni pieleen"}</div>
      ${s?`<div class="fetch-error-sub">${s}</div>`:""}
      <button type="button" class="btn-primary fetch-error-retry" data-testid="fetch-retry">Yrit\xE4 uudelleen</button>
    </div>`;let a=t.querySelector(".fetch-error-retry");a&&typeof n=="function"&&a.addEventListener("click",n)}export{g as a,h as b,x as c,m as d,f as e};
//# sourceMappingURL=app-chunk-UL3KXXAS.js.map
