"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
ORTAK TAM EKRAN SİSTEMİ

Bu dosya bütün bölümlerde kullanılacaktır.

Görevleri:
- Tam ekran API'sini düzgün destekleyen tarayıcılarda (masaüstü,
  Android Chrome vb.) gerçek tam ekranı açıp kapatan bir buton eklemek
- iOS Safari gibi tam ekran API'sinin çalışmadığı tarayıcılarda
  kullanıcıya "Ana Ekrana Ekle" ipucunu göstermek
- Oyun zaten Ana Ekran'dan (standalone modda) açılmışsa
  butonu hiç göstermemek
=========================================================
*/

window.AshvaleFullscreen = (() => {
    function isStandalone() {
        return window.navigator.standalone === true ||
            (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
    }

    function isIOS() {
        const ua = window.navigator.userAgent || "";
        const isAppleTouch = /iPad|iPhone|iPod/.test(ua);
        const isIpadOSDesktopMode = window.navigator.platform === "MacIntel" &&
            window.navigator.maxTouchPoints > 1;
        return isAppleTouch || isIpadOSDesktopMode;
    }

    function fullscreenApiSupported() {
        return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
    }

    function isFullscreenActive() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement);
    }

    function requestFullscreen(element) {
        if (element.requestFullscreen) {
            return element.requestFullscreen();
        }
        if (element.webkitRequestFullscreen) {
            return element.webkitRequestFullscreen();
        }
        return Promise.reject(new Error("Tam ekran API'si desteklenmiyor"));
    }

    function exitFullscreen() {
        if (document.exitFullscreen) {
            return document.exitFullscreen();
        }
        if (document.webkitExitFullscreen) {
            return document.webkitExitFullscreen();
        }
        return Promise.reject(new Error("Tam ekran API'si desteklenmiyor"));
    }

    function buildTip() {
        const tip = document.createElement("div");
        tip.id = "fullscreenTip";
        tip.className = "fullscreen-tip";
        tip.setAttribute("aria-hidden", "true");

        const box = document.createElement("div");
        box.className = "fullscreen-tip__box";

        const p1 = document.createElement("p");
        p1.textContent = "iPhone'da tam ekran oynamak için:";

        const p2 = document.createElement("p");
        p2.innerHTML = "<strong>Paylaş</strong> düğmesine dokun, sonra <strong>“Ana Ekrana Ekle”</strong> seçeneğini seç. Oyunu oradan açtığında tarayıcı çubuğu olmadan oynayabilirsin.";

        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "fullscreen-tip__close";
        closeButton.textContent = "Anladım";
        closeButton.addEventListener("click", () => {
            tip.setAttribute("aria-hidden", "true");
        });

        box.appendChild(p1);
        box.appendChild(p2);
        box.appendChild(closeButton);
        tip.appendChild(box);

        tip.addEventListener("click", (event) => {
            if (event.target === tip) {
                tip.setAttribute("aria-hidden", "true");
            }
        });

        document.body.appendChild(tip);
        return tip;
    }

    function init() {
        if (isStandalone()) {
            return;
        }

        const hudRight = document.querySelector(".hud-right");
        if (!hudRight) {
            return;
        }

        const button = document.createElement("button");
        button.id = "fullscreenButton";
        button.type = "button";
        button.className = "menu-button fullscreen-button";
        button.setAttribute("aria-label", "Tam ekran");

        const icon = document.createElement("span");
        icon.className = "fullscreen-button__icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "⛶";

        const label = document.createElement("span");
        label.className = "fullscreen-button__label";
        label.textContent = "TAM EKRAN";

        button.appendChild(icon);
        button.appendChild(label);

        hudRight.insertBefore(button, hudRight.firstChild);

        const canUseRealFullscreen = fullscreenApiSupported() && !isIOS();

        if (canUseRealFullscreen) {
            const target = document.documentElement;

            const syncLabel = () => {
                const active = isFullscreenActive();
                label.textContent = active ? "TAM EKRANDAN ÇIK" : "TAM EKRAN";
                button.setAttribute("aria-label", active ? "Tam ekrandan çık" : "Tam ekran");
            };

            button.addEventListener("click", () => {
                if (isFullscreenActive()) {
                    exitFullscreen().catch(() => {});
                } else {
                    requestFullscreen(target).catch(() => {});
                }
            });

            document.addEventListener("fullscreenchange", syncLabel);
            document.addEventListener("webkitfullscreenchange", syncLabel);
        } else {
            const tip = buildTip();
            button.addEventListener("click", () => {
                tip.setAttribute("aria-hidden", "false");
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    return { init: init };
})();
