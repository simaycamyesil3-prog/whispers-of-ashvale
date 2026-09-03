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

    function applyScale(size) {
        const scale = Math.min(
            size.width / DESIGN_WIDTH,
            size.height / DESIGN_HEIGHT
        );
        document.documentElement.style.setProperty("--ashvale-mobile-scale", scale);
    }

    function measure() {
        const size = viewportSize();
        return { size: size, isPortrait: size.height > size.width };
    }

    // El feneri gibi diğer script'lerin, sayfanın şu an hangi oranda
    // küçültüldüğünü öğrenmesi için: küçültme aktif değilse her zaman 1
    // döner, aktifse şu an uygulanan gerçek oranı verir.
    function getScale() {
        if (!document.documentElement.classList.contains("mobile-scale-active")) {
            return 1;
        }
        const raw = getComputedStyle(document.documentElement)
            .getPropertyValue("--ashvale-mobile-scale");
        const parsed = parseFloat(raw);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    }

    // ------------------------------------------------------------------
    // GEÇİCİ TEŞHİS PANELİ — ekranın neden küçük kaldığını gerçek
    // telefonda görebilmek için. Sorun çözülünce kaldırılacak.
    // ------------------------------------------------------------------
    function buildDebugPanel() {
        const panel = document.createElement("div");
        panel.id = "ashvaleDebugPanel";
        panel.style.cssText =
            "position:fixed;top:6px;left:6px;z-index:999999;" +
            "background:rgba(0,0,0,.85);color:#7CFC7C;" +
            "font:10px/1.4 monospace;padding:6px 8px;border-radius:6px;" +
            "pointer-events:none;white-space:pre;max-width:90vw;overflow:auto;";
        document.documentElement.appendChild(panel);
        return panel;
    }

    function updateDebugPanel(panel, size) {
        if (!panel) {
            return;
        }
        const vv = window.visualViewport;
        const bodyEl = document.body;
        const bodyRect = bodyEl ? bodyEl.getBoundingClientRect() : null;
        const lines = [
            "DEBUG (gecici)",
            "vv: " + (vv ? vv.width.toFixed(0) + "x" + vv.height.toFixed(0) : "yok"),
            "inner: " + window.innerWidth + "x" + window.innerHeight,
            "screen: " + screen.width + "x" + screen.height,
            "orient: " + (screen.orientation ? screen.orientation.type : "?"),
            "dpr: " + window.devicePixelRatio,
            "used size: " + size.width.toFixed(0) + "x" + size.height.toFixed(0),
            "scale: " + getScale().toFixed(3),
            "bodyRect: " + (bodyRect ? bodyRect.width.toFixed(0) + "x" + bodyRect.height.toFixed(0) +
                " @" + bodyRect.left.toFixed(0) + "," + bodyRect.top.toFixed(0) : "yok")
        ];
        panel.textContent = lines.join("\n");
    }

    function update(rotateOverlay, debugPanel) {
        const measured = measure();

        if (measured.isPortrait) {
            document.documentElement.classList.remove("mobile-scale-active");
            rotateOverlay.setAttribute("aria-hidden", "false");
        } else {
            rotateOverlay.setAttribute("aria-hidden", "true");
            document.documentElement.classList.add("mobile-scale-active");
            applyScale(measured.size);
        }

        updateDebugPanel(debugPanel, measured.size);
    }

    function init() {
        if (!isPhoneLikeDevice()) {
            return;
        }

        const rotateOverlay = buildRotateOverlay();
        const debugPanel = buildDebugPanel();

        let pendingFrame = null;
        let settleTimers = [];

        function clearSettleTimers() {
            settleTimers.forEach((id) => clearTimeout(id));
            settleTimers = [];
        }

        function runUpdate() {
            update(rotateOverlay, debugPanel);
        }

        // Telefonu çevirdikten sonra Safari'nin adres/sekme çubuğu bir
        // animasyonla yerleşiyor ve görünür alan birkaç yüz milisaniye
        // boyunca değişmeye devam edebiliyor (özellikle çok sekme açıkken
        // görünen sekme şeridiyle). Tek bir anlık ölçüm yanlış (fazla küçük)
        // bir oran hesaplayıp öyle kalabiliyor. Bunu önlemek için ilk tepkiden
        // sonra birkaç kez daha ölçüp en son (yerleşmiş) değeri uyguluyoruz.
        function scheduleSettleChecks() {
            clearSettleTimers();
            [80, 200, 400, 700, 1100].forEach((delay) => {
                settleTimers.push(
                    setTimeout(runUpdate, delay)
                );
            });
        }

        function onChange() {
            if (pendingFrame) {
                cancelAnimationFrame(pendingFrame);
            }
            pendingFrame = requestAnimationFrame(runUpdate);
            scheduleSettleChecks();
        }

        runUpdate();
        scheduleSettleChecks();

        // Güvenlik ağı: yukarıdaki olay dinleyicilerinin hiçbiri tetiklenmese
        // veya visualViewport bir süre boyunca eski değer verse bile, sayfa
        // açık kaldığı sürece ölçü her yarım saniyede bir tazeleniyor. Maliyeti
        // önemsiz (birkaç sayı okuma + değişmediyse hiçbir DOM yazımı yok gibi)
        // ama telefonun her zaman doğru boyutta kalmasını garantiliyor.
        setInterval(runUpdate, 500);

        window.addEventListener("resize", onChange);
        window.addEventListener("orientationchange", onChange);
        window.addEventListener("pageshow", onChange);
        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) {
                onChange();
            }
        });
        if (window.visualViewport) {
            window.visualViewport.addEventListener("resize", onChange);
        }
        if (window.ResizeObserver) {
            const observer = new ResizeObserver(onChange);
            observer.observe(document.documentElement);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    return { init: init, getScale: getScale };
})();
