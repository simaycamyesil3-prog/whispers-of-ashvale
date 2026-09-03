"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
TELEFONA ÖLÇEKLEME SİSTEMİ

Bu dosya bütün bölümlerde kullanılacaktır.

Görevleri:
- Telefon gibi küçük dokunmatik ekranlarda masaüstü arayüzünü
  YENİDEN DÜZENLEMEK yerine, olduğu gibi (aynı oranlarla) küçültülmüş
  hâlde göstermek — sabit 1440x900 tasarım ölçüsü CSS transform: scale
  ile ekrana sığdırılıyor
- Telefon dikey tutulduğunda oyunu gizleyip "telefonu yan çevir"
  uyarısı göstermek
=========================================================
*/

window.AshvaleMobileScale = (() => {
    const DESIGN_WIDTH = 1440;
    const DESIGN_HEIGHT = 900;

    function viewportSize() {
        // visualViewport ölçüsü gerçek görünür alanı verir; sayfa içeriği
        // yüzünden tarayıcının "layout viewport"u büyütmesi (bazı eski
        // içerik + genişlik zorlayan CSS kombinasyonlarında olabiliyor)
        // bu ölçüyü etkilemiyor, innerWidth/innerHeight'tan daha güvenilir.
        if (window.visualViewport) {
            return { width: window.visualViewport.width, height: window.visualViewport.height };
        }
        return { width: window.innerWidth, height: window.innerHeight };
    }

    function isPhoneLikeDevice() {
        const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
        if (!hasTouch) {
            return false;
        }
        const size = viewportSize();
        const shortSide = Math.min(size.width, size.height);
        const longSide = Math.max(size.width, size.height);
        return shortSide <= 500 && longSide <= 950;
    }

    function buildRotateOverlay() {
        const overlay = document.createElement("div");
        overlay.id = "rotateOverlay";
        overlay.className = "rotate-overlay";
        overlay.setAttribute("aria-hidden", "true");

        const box = document.createElement("div");
        box.className = "rotate-overlay__box";

        const icon = document.createElement("div");
        icon.className = "rotate-overlay__icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "📱";

        const p1 = document.createElement("p");
        p1.textContent = "Whispers of Ashvale, yan çevrilmiş telefon ekranı için tasarlandı.";

        const p2 = document.createElement("p");
        p2.textContent = "Devam etmek için lütfen telefonunu yan çevir.";

        box.appendChild(icon);
        box.appendChild(p1);
        box.appendChild(p2);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        return overlay;
    }

    function applyScale() {
        const size = viewportSize();
        const scale = Math.min(
            size.width / DESIGN_WIDTH,
            size.height / DESIGN_HEIGHT
        );
        document.documentElement.style.setProperty("--ashvale-mobile-scale", scale);
    }

    function update(rotateOverlay) {
        const size = viewportSize();
        const isPortrait = size.height > size.width;

        if (isPortrait) {
            document.documentElement.classList.remove("mobile-scale-active");
            rotateOverlay.setAttribute("aria-hidden", "false");
        } else {
            rotateOverlay.setAttribute("aria-hidden", "true");
            document.documentElement.classList.add("mobile-scale-active");
            applyScale();
        }
    }

    function init() {
        if (!isPhoneLikeDevice()) {
            return;
        }

        const rotateOverlay = buildRotateOverlay();
        update(rotateOverlay);

        let pendingFrame = null;
        function onChange() {
            if (pendingFrame) {
                cancelAnimationFrame(pendingFrame);
            }
            pendingFrame = requestAnimationFrame(() => {
                update(rotateOverlay);
            });
        }

        window.addEventListener("resize", onChange);
        window.addEventListener("orientationchange", onChange);
        if (window.visualViewport) {
            window.visualViewport.addEventListener("resize", onChange);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    return { init: init };
})();
