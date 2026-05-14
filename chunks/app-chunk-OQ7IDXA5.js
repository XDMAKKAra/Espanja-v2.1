var e=null,a=null,o=null;function c(t){return String(t??"").replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}function u(){return e||(e=document.createElement("div"),e.id="confirm-dialog-root",e.className="confirm-dialog-root",e.hidden=!0,document.body.appendChild(e),e)}function r(t){if(!e)return;e.classList.remove("is-open"),document.removeEventListener("keydown",d),setTimeout(()=>{e&&!e.classList.contains("is-open")&&(e.hidden=!0,e.innerHTML="")},200),o&&typeof o.focus=="function"&&o.focus(),o=null;let n=a;a=null,n&&n(t)}function d(t){if(t.key==="Escape"){t.preventDefault(),r(!1);return}if(t.key==="Tab"&&e){let n=e.querySelectorAll("button");if(n.length===0)return;let i=n[0],l=n[n.length-1];t.shiftKey&&document.activeElement===i?(t.preventDefault(),l.focus()):!t.shiftKey&&document.activeElement===l&&(t.preventDefault(),i.focus())}}function f({title:t,body:n,confirmLabel:i="Vahvista",cancelLabel:l="Peruuta"}={}){return new Promise(s=>{u(),a=s,o=document.activeElement,e.innerHTML=`
      <div class="confirm-dialog__backdrop" data-close="1" aria-hidden="true"></div>
      <div class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <h2 class="confirm-dialog__title" id="confirm-dialog-title">${c(t||"Vahvista")}</h2>
        ${n?`<p class="confirm-dialog__body">${c(n)}</p>`:""}
        <div class="confirm-dialog__actions">
          <button type="button" class="confirm-dialog__btn confirm-dialog__btn--secondary" id="confirm-dialog-cancel">${c(l)}</button>
          <button type="button" class="confirm-dialog__btn confirm-dialog__btn--primary" id="confirm-dialog-confirm">${c(i)}</button>
        </div>
      </div>
    `,e.hidden=!1,e.offsetHeight,e.classList.add("is-open"),e.querySelector(".confirm-dialog__backdrop").addEventListener("click",()=>r(!1)),e.querySelector("#confirm-dialog-cancel").addEventListener("click",()=>r(!1)),e.querySelector("#confirm-dialog-confirm").addEventListener("click",()=>r(!0)),document.addEventListener("keydown",d),e.querySelector("#confirm-dialog-cancel").focus()})}export{f as a};
//# sourceMappingURL=app-chunk-OQ7IDXA5.js.map
