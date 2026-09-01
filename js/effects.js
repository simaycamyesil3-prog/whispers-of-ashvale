// =============================================
// WHISPERS OF ASHVALE - ORTAK EFEKT SİSTEMİ
// Dosya: js/effects.js
// =============================================

window.Effects = (() => {
    "use strict";

    const createdElements = new Map();

    function getElement(target) {
        if (!target) return document.body;

        if (typeof target === "string") {
            return document.querySelector(target);
        }

        return target;
    }

    function ensureElement(id, className, parent = document.body) {
        let element = document.getElementById(id);

        if (!element) {
            element = document.createElement("div");
            element.id = id;
            element.className = className;
            parent.appendChild(element);
            createdElements.set(id, element);
        }

        return element;
    }

    function removeAfter(element, duration) {
        window.setTimeout(() => {
            element.classList.remove("is-active");
        }, duration);
    }

    function flash({
        color = "rgba(255,255,255,0.9)",
        duration = 180,
        opacity = 1
    } = {}) {
        const overlay = ensureElement(
            "effect-flash-overlay",
            "effect-overlay effect-flash-overlay"
        );

        overlay.style.background = color;
        overlay.style.opacity = String(opacity);
        overlay.classList.add("is-active");

        removeAfter(overlay, duration);
    }

    function flashRed(duration = 240) {
        flash({
            color: "rgba(140,0,0,0.85)",
            duration
        });
    }

    function blackout(duration = 1000) {
        return new Promise((resolve) => {
            const overlay = ensureElement(
                "effect-blackout-overlay",
                "effect-overlay effect-blackout-overlay"
            );

            overlay.classList.add("is-active");

            window.setTimeout(() => {
                overlay.classList.remove("is-active");
                resolve();
            }, duration);
        });
    }

    function fadeOut(duration = 600) {
        return new Promise((resolve) => {
            const overlay = ensureElement(
                "effect-fade-overlay",
                "effect-overlay effect-fade-overlay"
            );

            overlay.style.transitionDuration = `${duration}ms`;
            overlay.classList.add("is-active");

            window.setTimeout(resolve, duration);
        });
    }

    function fadeIn(duration = 600) {
        return new Promise((resolve) => {
            const overlay = ensureElement(
                "effect-fade-overlay",
                "effect-overlay effect-fade-overlay"
            );

            overlay.style.transitionDuration = `${duration}ms`;
            overlay.classList.add("is-active");

            requestAnimationFrame(() => {
                overlay.classList.remove("is-active");
            });

            window.setTimeout(resolve, duration);
        });
    }

    function shake(target = "#room", intensity = "medium", duration = 500) {
        const element = getElement(target);

        if (!element) return;

        const className = `effect-shake-${intensity}`;

        element.classList.remove(
            "effect-shake-light",
            "effect-shake-medium",
            "effect-shake-heavy"
        );

        void element.offsetWidth;

        element.classList.add(className);

        window.setTimeout(() => {
            element.classList.remove(className);
        }, duration);
    }

    function flicker(
        target = "#room",
        {
            count = 5,
            speed = 110,
            minOpacity = 0.35
        } = {}
    ) {
        const element = getElement(target);

        if (!element) return Promise.resolve();

        return new Promise((resolve) => {
            let step = 0;
            const originalOpacity = element.style.opacity;

            const interval = window.setInterval(() => {
                element.style.opacity =
                    step % 2 === 0 ? String(minOpacity) : "1";

                step++;

                if (step >= count * 2) {
                    window.clearInterval(interval);
                    element.style.opacity = originalOpacity || "1";
                    resolve();
                }
            }, speed);
        });
    }

    function blur(target = "#room", amount = 5, duration = 1000) {
        const element = getElement(target);

        if (!element) return;

        element.style.transition = "filter 180ms ease";
        element.style.filter = `blur(${amount}px)`;

        window.setTimeout(() => {
            element.style.filter = "";
        }, duration);
    }

    function zoom(target = "#room", scale = 1.04, duration = 700) {
        const element = getElement(target);

        if (!element) return;

        const previousTransition = element.style.transition;
        const previousTransform = element.style.transform;

        element.style.transition = `transform ${duration}ms ease`;
        element.style.transform = `${previousTransform} scale(${scale})`;

        window.setTimeout(() => {
            element.style.transform = previousTransform;
            element.style.transition = previousTransition;
        }, duration);
    }

    function vignette(show = true) {
        const overlay = ensureElement(
            "effect-vignette-overlay",
            "effect-vignette-overlay"
        );

        overlay.classList.toggle("is-active", show);
    }

    function blood(show = true, duration = null) {
        const overlay = ensureElement(
            "effect-blood-overlay",
            "effect-blood-overlay"
        );

        overlay.classList.toggle("is-active", show);

        if (show && duration) {
            removeAfter(overlay, duration);
        }
    }

    function staticNoise(duration = 500) {
        const overlay = ensureElement(
            "effect-static-overlay",
            "effect-static-overlay"
        );

        overlay.classList.add("is-active");
        removeAfter(overlay, duration);
    }

    function heartbeat(duration = 1800) {
        const target = getElement("#room") || document.body;

        target.classList.add("effect-heartbeat");

        window.setTimeout(() => {
            target.classList.remove("effect-heartbeat");
        }, duration);
    }

    function shadow({
        target = document.body,
        duration = 1400,
        className = "effect-shadow-figure"
    } = {}) {
        const parent = getElement(target) || document.body;

        const figure = document.createElement("div");
        figure.className = className;

        parent.appendChild(figure);

        requestAnimationFrame(() => {
            figure.classList.add("is-active");
        });

        window.setTimeout(() => {
            figure.classList.remove("is-active");

            window.setTimeout(() => {
                figure.remove();
            }, 400);
        }, duration);
    }

    function jumpscare({
        image = "",
        duration = 700,
        sound = null
    } = {}) {
        const overlay = ensureElement(
            "effect-jumpscare-overlay",
            "effect-jumpscare-overlay"
        );

        overlay.innerHTML = "";

        if (image) {
            const img = document.createElement("img");
            img.src = image;
            img.alt = "";
            overlay.appendChild(img);
        }

        if (sound) {
            try {
                if (window.AudioManager?.playEffect) {
                    window.AudioManager.playEffect(sound);
                } else if (window.Sound?.play) {
                    window.Sound.play(sound);
                }
            } catch (error) {
                console.warn("Jumpscare sesi oynatılamadı:", error);
            }
        }

        overlay.classList.add("is-active");
        shake("#room", "heavy", duration);

        window.setTimeout(() => {
            overlay.classList.remove("is-active");
            overlay.innerHTML = "";
        }, duration);
    }

    function removeCreatedElements() {
        createdElements.forEach((element) => {
            element.remove();
        });

        createdElements.clear();
    }

    return {
        flash,
        flashRed,
        blackout,
        fadeOut,
        fadeIn,
        shake,
        flicker,
        blur,
        zoom,
        vignette,
        blood,
        staticNoise,
        heartbeat,
        shadow,
        jumpscare,
        cleanup: removeCreatedElements
    };
})();