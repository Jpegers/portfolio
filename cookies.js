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
  margin-top: 14px;

  display: flex;
  justify-content: flex-start; /* выравниваем всё влево */
  align-items: center;         /* выравниваем по одной линии */
  gap: 14px;                   /* расстояние между кнопками */
}

#cookie-accept {
  background: #0ea5e9;
  border: none;
  padding: 8px 18px;
  border-radius: 999px;
  cursor: pointer;

  color: #ffffff;              /* белый текст */
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

.cookie-link {
  color: #38bdf8;
  font-size: 14px;
  text-decoration: underline dotted;
  opacity: .85;

  margin-left: 0;
}

.cookie-link:hover {
  opacity: 1;
}

.cookie-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 14px;
}

/* Кнопка "Хорошо" — теперь первая */
#cookie-accept {
  order: 1;
}

/* Кнопка "Подробнее" — теперь вторая */
.cookie-link {
  order: 2;
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
    flex-direction: column;
    align-items: stretch;   /* чтобы кнопка “Хорошо” была широкой */
    gap: 10px;
  }

  #cookie-accept {
    order: 1;
    width: 100%;            /* широкая кнопка наверху */
    text-align: center;
  }

  .cookie-link {
    order: 2;
    text-align: center;     /* снизу, по центру */
    width: 100%;
  }
}
}

  `;
  document.head.appendChild(style);

  document.getElementById("cookie-accept").addEventListener("click", () => {
    localStorage.setItem("cookieConsent", "accepted");
    banner.remove();
  });
})();
