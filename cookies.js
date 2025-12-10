(function() {
  if (localStorage.getItem("cookieConsent") === "accepted") return;

  const banner = document.createElement("div");
  banner.id = "cookie-banner";
  banner.innerHTML = `
    <div class="cookie-box">
      <p>Мы используем cookies и Яндекс.Метрику для улучшения работы сайта.</p>
      <div class="cookie-actions">
        <a href="/policy.html" class="cookie-link" target="_blank">Подробнее</a>
        <button id="cookie-accept">Хорошо</button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  const style = document.createElement("style");
  style.textContent = `
    #cookie-banner {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      max-width: 360px;

      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(10px);
      border-radius: 14px;
      padding: 18px 22px;
      color: #fff;
      font-size: 14px;
      line-height: 1.45;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);

      animation: fadeIn 0.25s ease;
    }

    .cookie-actions {
      margin-top: 12px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .cookie-link {
      color: #38bdf8;
      font-size: 13px;
      text-decoration: underline dotted;
      opacity: .85;
    }
    .cookie-link:hover {
      opacity: 1;
    }

    #cookie-accept {
      background: #0ea5e9;
      border: none;
      padding: 8px 16px;
      border-radius: 999px;
      cursor: pointer;
      color: #020617;
      font-weight: 600;
      font-size: 14px;

      box-shadow: 0 0 12px rgba(56,189,248,.35);
      transition: background .15s, box-shadow .2s, transform .12s;
    }
    #cookie-accept:hover {
      background: #38bdf8;
      box-shadow: 0 0 20px rgba(56,189,248,.45);
      transform: translateY(-2px);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ---- MOBILE FIX ---- */
@media (max-width: 480px) {
  #cookie-banner {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    bottom: 16px;

    max-width: 92%;
    width: 92%;

    padding: 16px 18px;
  }

  .cookie-actions {
    flex-direction: column-reverse;
    align-items: stretch;
    gap: 8px;
    margin-top: 14px;
  }

  #cookie-accept {
    width: 100%;
    text-align: center;
  }

  .cookie-link {
    text-align: center;
    display: block;
    width: 100%;
  }
}

  `;
  document.head.appendChild(style);

  document.getElementById("cookie-accept").addEventListener("click", () => {
    localStorage.setItem("cookieConsent", "accepted");
    banner.remove();
  });
})();
