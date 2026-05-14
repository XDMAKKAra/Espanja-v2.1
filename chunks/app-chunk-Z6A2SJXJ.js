import{a as t,b as l}from"./app-chunk-6FS5BSBG.js";function v(s,i={}){l("screen-loading"),t("loading-text").textContent=s,t("loading-spinner").style.display="";let e=t("loading-subtext"),n=t("loading-retry");e.classList.add("hidden"),n.classList.add("hidden"),i.subtext&&(e.textContent=i.subtext,e.classList.remove("hidden"))}function c(s,i){t("loading-spinner").style.display="none",t("loading-text").textContent="Jokin meni pieleen";let e=t("loading-subtext");e.textContent=s,e.classList.remove("hidden");let n=t("loading-retry");i&&(n.classList.remove("hidden"),n.onclick=i)}var a={exercise:`
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
    </div>`};function k(s,i="exercise"){let e=typeof s=="string"?document.getElementById(s):s;e&&(e.innerHTML=a[i]||a.exercise)}function b(s,{title:i,subtext:e,retryFn:n}={}){let d=typeof s=="string"?document.getElementById(s):s;if(!d)return;d.innerHTML=`
    <div class="fetch-error" role="alert" data-testid="fetch-error">
      <div class="fetch-error-title">${i||"Jokin meni pieleen"}</div>
      ${e?`<div class="fetch-error-sub">${e}</div>`:""}
      <button type="button" class="btn-primary fetch-error-retry" data-testid="fetch-retry">Yrit\xE4 uudelleen</button>
    </div>`;let o=d.querySelector(".fetch-error-retry");o&&typeof n=="function"&&o.addEventListener("click",n)}export{v as a,c as b,k as c,b as d};
//# sourceMappingURL=app-chunk-Z6A2SJXJ.js.map
