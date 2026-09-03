"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
ORTAK EL FENERİ SİSTEMİ

Bu dosya bütün bölümlerde kullanılacaktır.

Görevleri:
- Fareyi yumuşak biçimde takip etmek
- Hafif doğal el titremesi oluşturmak
- Dokunmatik ekran desteği sağlamak
- El feneri ışığını daraltıp genişletmek
- Jumpscare sırasında titreme efekti vermek
- İleride pil sistemiyle çalışabilecek altyapıyı sağlamak
=========================================================
*/

window.AshvaleFlashlight = (() => {
    /*
    =====================================================
    AKTİF DURUM
    =====================================================
    */

    let activeController = null;


    /*
    =====================================================
    YARDIMCI FONKSİYONLAR
    =====================================================
    */

    function clamp(
        value,
        minimum,
        maximum
    ) {
        const numericValue =
            Number(value);

        if (!Number.isFinite(numericValue)) {
            return minimum;
        }

        return Math.min(
            maximum,
            Math.max(
                minimum,
                numericValue
            )
        );
    }


    // Telefon yan çevrildiğinde tüm sayfa CSS transform:scale() ile
    // küçültülüyor (bkz. mobile-scale.js). Parmak/fare konumu her zaman
    // GERÇEK ekran pikseli olarak gelir (event.clientX/Y), ama el
    // fenerinin kendi konumu (#flashlight'ın left/top'u) oda elementinin
    // KENDİ (küçültülmeden önceki) yerel piksel uzayındadır. Bu yüzden
    // ekran pikseli farkını mevcut küçültme oranına bölerek yerel
    // piksele çevirmek gerekiyor — yoksa el feneri sadece ekranın sol üst
    // köşesindeki dar bir alanda hareket edebiliyor.
    function currentScale() {
        return window.AshvaleMobileScale &&
            typeof window.AshvaleMobileScale.getScale === "function"
            ? window.AshvaleMobileScale.getScale()
            : 1;
    }


    function getElement(
        elementOrId
    ) {
        if (
            typeof elementOrId ===
            "string"
        ) {
            return document.getElementById(
                elementOrId
            );
        }

        return elementOrId || null;
    }


    function setPosition(
        room,
        flashlight,
        x,
        y
    ) {
        flashlight.style.left =
            `${x}px`;

        flashlight.style.top =
            `${y}px`;

        room.style.setProperty(
            "--flashlight-x",
            `${x}px`
        );

        room.style.setProperty(
            "--flashlight-y",
            `${y}px`
        );
    }


    /*
    =====================================================
    EL FENERİNİ BAŞLAT
    =====================================================
    */

    function start({
        room:
            roomElementOrId,

        flashlight:
            flashlightElementOrId,

        interactionPrompt:
            interactionPromptElementOrId =
                "interactionPrompt",

        smoothing =
            0.12,

        swayAmount =
            2.4,

        swaySpeed =
            900,

        idleClass =
            "flashlight-idle",

        activeClass =
            "flashlight-active",

        touchEnabled =
            true,

        startAtCenter =
            true
    } = {}) {
        
        if (
    activeController &&
    typeof activeController.stop === "function"
) {
    activeController.stop();
}

        const room =
            getElement(
                roomElementOrId
            );

        const flashlight =
            getElement(
                flashlightElementOrId
            );

        const interactionPrompt =
            getElement(
                interactionPromptElementOrId
            );

        if (!room) {
            console.error(
                "El feneri başlatılamadı: oda elementi bulunamadı."
            );

            return null;
        }

        if (!flashlight) {
            console.error(
                "El feneri başlatılamadı: flashlight elementi bulunamadı."
            );

            return null;
        }


        /*
        =================================================
        BAŞLANGIÇ KONUMU
        =================================================
        */

        const roomLocalWidth =
            room.clientWidth ||
            room.getBoundingClientRect().width;

        const roomLocalHeight =
            room.clientHeight ||
            room.getBoundingClientRect().height;

        let targetX =
            startAtCenter
                ? roomLocalWidth / 2
                : 0;

        let targetY =
            startAtCenter
                ? roomLocalHeight / 2
                : 0;

        let currentX =
            targetX;

        let currentY =
            targetY;

        let animationFrameId =
            null;

        let isRunning =
            true;

        let isInsideRoom =
            false;

        let intensity =
            1;

        let radiusMultiplier =
            1;

        let batteryLevel =
            100;

        let batteryEnabled =
            false;

        let batteryDrainRate =
            0;

        let lastFrameTime =
            performance.now();


        /*
        =================================================
        HAREKET AYARLARI
        =================================================
        */

        const safeSmoothing =
            clamp(
                smoothing,
                0.01,
                1
            );

        const safeSwayAmount =
            clamp(
                swayAmount,
                0,
                20
            );

        const safeSwaySpeed =
            clamp(
                swaySpeed,
                100,
                5000
            );


        /*
        =================================================
        POINTER HAREKETİ
        =================================================
        */

        function updateTargetFromClientPosition(
            clientX,
            clientY
        ) {
            const rect =
                room.getBoundingClientRect();

            const scale =
                currentScale();

            const localWidth =
                room.clientWidth ||
                (rect.width / scale);

            const localHeight =
                room.clientHeight ||
                (rect.height / scale);

            targetX =
                clamp(
                    (clientX - rect.left) / scale,
                    0,
                    localWidth
                );

            targetY =
                clamp(
                    (clientY - rect.top) / scale,
                    0,
                    localHeight
                );

            if (interactionPrompt) {
                if (scale !== 1) {
                    // .interaction-prompt position:fixed'dir; küçültme
                    // aktifken konteyner konumu artık <body>'nin kendi
                    // (küçültülmeden önceki) yerel kutusudur.
                    const bodyRect =
                        document.body.getBoundingClientRect();

                    interactionPrompt.style.left =
                        `${(clientX - bodyRect.left) / scale}px`;

                    interactionPrompt.style.top =
                        `${(clientY - bodyRect.top) / scale}px`;
                } else {
                    interactionPrompt.style.left =
                        `${clientX}px`;

                    interactionPrompt.style.top =
                        `${clientY}px`;
                }
            }
        }


        function handlePointerMove(
            event
        ) {
            updateTargetFromClientPosition(
                event.clientX,
                event.clientY
            );

            isInsideRoom =
                true;

            room.classList.remove(
                idleClass
            );

            room.classList.add(
                activeClass
            );
        }


        function handlePointerEnter() {
            isInsideRoom =
                true;

            room.classList.remove(
                idleClass
            );

            room.classList.add(
                activeClass
            );
        }


        function handlePointerLeave() {
            isInsideRoom =
                false;

            room.classList.add(
                idleClass
            );

            room.classList.remove(
                activeClass
            );
        }


        /*
        =================================================
        DOKUNMATİK DESTEK
        =================================================
        */

        function handleTouchStart(
            event
        ) {
            if (!touchEnabled) {
                return;
            }

            const touch =
                event.touches?.[0];

            if (!touch) {
                return;
            }

            updateTargetFromClientPosition(
                touch.clientX,
                touch.clientY
            );

            isInsideRoom =
                true;

            room.classList.remove(
                idleClass
            );

            room.classList.add(
                activeClass
            );
        }


        function handleTouchMove(
            event
        ) {
            if (!touchEnabled) {
                return;
            }

            const touch =
                event.touches?.[0];

            if (!touch) {
                return;
            }

            updateTargetFromClientPosition(
                touch.clientX,
                touch.clientY
            );
        }


        function handleTouchEnd() {
            if (!touchEnabled) {
                return;
            }

            isInsideRoom =
                false;

            room.classList.add(
                idleClass
            );

            room.classList.remove(
                activeClass
            );
        }


        /*
        =================================================
        PENCERE BOYUTU DEĞİŞTİĞİNDE
        =================================================
        */

        function handleResize() {
            const localWidth =
                room.clientWidth ||
                room.getBoundingClientRect().width;

            const localHeight =
                room.clientHeight ||
                room.getBoundingClientRect().height;

            targetX =
                clamp(
                    targetX,
                    0,
                    localWidth
                );

            targetY =
                clamp(
                    targetY,
                    0,
                    localHeight
                );

            currentX =
                clamp(
                    currentX,
                    0,
                    localWidth
                );

            currentY =
                clamp(
                    currentY,
                    0,
                    localHeight
                );
        }


        /*
        =================================================
        PİL SİSTEMİ ALTYAPISI
        =================================================
        */

        function updateBattery(
            deltaTime
        ) {
            if (
                !batteryEnabled ||
                batteryDrainRate <= 0
            ) {
                return;
            }

            batteryLevel -=
                batteryDrainRate *
                (
                    deltaTime /
                    1000
                );

            batteryLevel =
                clamp(
                    batteryLevel,
                    0,
                    100
                );

            const batteryIntensity =
                batteryLevel <= 15
                    ? 0.5 +
                      Math.random() *
                      0.3
                    : 1;

            intensity =
                Math.min(
                    intensity,
                    batteryIntensity
                );

            if (batteryLevel <= 0) {
                room.classList.add(
                    "flashlight-empty"
                );
            } else {
                room.classList.remove(
                    "flashlight-empty"
                );
            }

            window.dispatchEvent(
                new CustomEvent(
                    "ashvale:flashlight-battery",
                    {
                        detail: {
                            level:
                                batteryLevel
                        }
                    }
                )
            );
        }


        /*
        =================================================
        ANİMASYON DÖNGÜSÜ
        =================================================
        */

        function animationLoop(
            currentTime
        ) {
            if (!isRunning) {
                return;
            }

            const deltaTime =
                currentTime -
                lastFrameTime;

            lastFrameTime =
                currentTime;

            updateBattery(
                deltaTime
            );

            currentX +=
                (
                    targetX -
                    currentX
                ) *
                safeSmoothing;

            currentY +=
                (
                    targetY -
                    currentY
                ) *
                safeSmoothing;

            const swayX =
                Math.sin(
                    currentTime /
                    safeSwaySpeed
                ) *
                safeSwayAmount;

            const swayY =
                Math.cos(
                    currentTime /
                    (
                        safeSwaySpeed *
                        1.12
                    )
                ) *
                safeSwayAmount *
                0.72;

            const microShakeX =
                Math.sin(
                    currentTime /
                    83
                ) *
                0.32;

            const microShakeY =
                Math.cos(
                    currentTime /
                    97
                ) *
                0.24;

            const finalX =
                currentX +
                swayX +
                microShakeX;

            const finalY =
                currentY +
                swayY +
                microShakeY;

            setPosition(
                room,
                flashlight,
                finalX,
                finalY
            );

            room.style.setProperty(
                "--flashlight-intensity",
                String(
                    clamp(
                        intensity,
                        0,
                        1
                    )
                )
            );

            room.style.setProperty(
                "--flashlight-radius-scale",
                String(
                    clamp(
                        radiusMultiplier,
                        0.4,
                        2
                    )
                )
            );

            room.style.setProperty(
                "--flashlight-active-state",
                isInsideRoom
                    ? "1"
                    : "0.68"
            );

            animationFrameId =
                window.requestAnimationFrame(
                    animationLoop
                );
        }


        /*
        =================================================
        OLAY DİNLEYİCİLERİ
        =================================================
        */

        room.addEventListener(
            "pointermove",
            handlePointerMove
        );

        room.addEventListener(
            "pointerenter",
            handlePointerEnter
        );

        room.addEventListener(
            "pointerleave",
            handlePointerLeave
        );

        if (touchEnabled) {
            room.addEventListener(
                "touchstart",
                handleTouchStart,
                {
                    passive:
                        true
                }
            );

            room.addEventListener(
                "touchmove",
                handleTouchMove,
                {
                    passive:
                        true
                }
            );

            room.addEventListener(
                "touchend",
                handleTouchEnd,
                {
                    passive:
                        true
                }
            );
        }

        window.addEventListener(
            "resize",
            handleResize
        );


        /*
        =================================================
        BAŞLANGIÇ SINIFLARI
        =================================================
        */

        room.classList.add(
            idleClass
        );

        room.classList.remove(
            activeClass
        );

        setPosition(
            room,
            flashlight,
            currentX,
            currentY
        );

        animationFrameId =
            window.requestAnimationFrame(
                animationLoop
            );


        /*
        =================================================
        CONTROLLER
        =================================================
        */

        const controller = {
            room,
            flashlight,

            setIntensity(
                newIntensity
            ) {
                intensity =
                    clamp(
                        newIntensity,
                        0,
                        1
                    );
            },

            getIntensity() {
                return intensity;
            },

            setRadius(
                newRadiusMultiplier
            ) {
                radiusMultiplier =
                    clamp(
                        newRadiusMultiplier,
                        0.4,
                        2
                    );
            },

            getRadius() {
                return radiusMultiplier;
            },

            moveTo(
                x,
                y,
                immediate = false
            ) {
                const localWidth =
                    room.clientWidth ||
                    room.getBoundingClientRect().width;

                const localHeight =
                    room.clientHeight ||
                    room.getBoundingClientRect().height;

                targetX =
                    clamp(
                        x,
                        0,
                        localWidth
                    );

                targetY =
                    clamp(
                        y,
                        0,
                        localHeight
                    );

                if (immediate) {
                    currentX =
                        targetX;

                    currentY =
                        targetY;

                    setPosition(
                        room,
                        flashlight,
                        currentX,
                        currentY
                    );
                }
            },

            enableBattery({
                level = 100,
                drainRate = 0.15
            } = {}) {
                batteryEnabled =
                    true;

                batteryLevel =
                    clamp(
                        level,
                        0,
                        100
                    );

                batteryDrainRate =
                    Math.max(
                        0,
                        Number(
                            drainRate
                        ) || 0
                    );
            },

            disableBattery() {
                batteryEnabled =
                    false;

                room.classList.remove(
                    "flashlight-empty"
                );
            },

            setBatteryLevel(
                level
            ) {
                batteryLevel =
                    clamp(
                        level,
                        0,
                        100
                    );
            },

            getBatteryLevel() {
                return batteryLevel;
            },

            stop
        };


        activeController =
            controller;

        return controller;


        /*
        =================================================
        TEMİZLEME
        =================================================
        */

        function stop() {
            if (!isRunning) {
                return;
            }

            isRunning =
                false;

            if (animationFrameId) {
                window.cancelAnimationFrame(
                    animationFrameId
                );
            }

            room.removeEventListener(
                "pointermove",
                handlePointerMove
            );

            room.removeEventListener(
                "pointerenter",
                handlePointerEnter
            );

            room.removeEventListener(
                "pointerleave",
                handlePointerLeave
            );

            room.removeEventListener(
                "touchstart",
                handleTouchStart
            );

            room.removeEventListener(
                "touchmove",
                handleTouchMove
            );

            room.removeEventListener(
                "touchend",
                handleTouchEnd
            );

            window.removeEventListener(
                "resize",
                handleResize
            );

            room.classList.remove(
                idleClass,
                activeClass,
                "flashlight-empty",
                "flashlight-flicker",
                "flashlight-pulse"
            );

            if (
                activeController ===
                controller
            ) {
                activeController =
                    null;
            }
        }
    }


    /*
    =====================================================
    AKTİF CONTROLLER
    =====================================================
    */

    function getActive() {
        return activeController;
    }


    /*
    =====================================================
    EL FENERİ TİTREŞİMİ
    =====================================================
    */

    function flicker({
        duration = 900,
        strength = "normal"
    } = {}) {
        const controller =
            activeController;

        if (!controller) {
            return;
        }

        const room =
            controller.room;

        const flashlight =
            controller.flashlight;

        room.classList.remove(
            "flashlight-flicker",
            "flashlight-flicker--strong"
        );

        flashlight.classList.remove(
            "flashlight-flicker",
            "flashlight-flicker--strong"
        );

        void room.offsetWidth;

        const className =
            strength === "strong"
                ? "flashlight-flicker--strong"
                : "flashlight-flicker";

        room.classList.add(
            className
        );

        flashlight.classList.add(
            className
        );

        window.setTimeout(
            () => {
                room.classList.remove(
                    className
                );

                flashlight.classList.remove(
                    className
                );
            },
            duration
        );
    }


    /*
    =====================================================
    EL FENERİ NABIZ EFEKTİ
    =====================================================
    */

    function pulse({
        duration = 1200,
        minimumRadius = 0.72
    } = {}) {
        const controller =
            activeController;

        if (!controller) {
            return;
        }

        const room =
            controller.room;

        const originalRadius =
            controller.getRadius();

        const startTime =
            performance.now();

        function pulseFrame(
            currentTime
        ) {
            const progress =
                clamp(
                    (
                        currentTime -
                        startTime
                    ) /
                    duration,
                    0,
                    1
                );

            const wave =
                Math.sin(
                    progress *
                    Math.PI *
                    2
                );

            const radius =
                originalRadius -
                (
                    1 -
                    minimumRadius
                ) *
                Math.max(
                    0,
                    wave
                );

            controller.setRadius(
                radius
            );

            if (progress < 1) {
                window.requestAnimationFrame(
                    pulseFrame
                );

                return;
            }

            controller.setRadius(
                originalRadius
            );
        }

        room.classList.add(
            "flashlight-pulse"
        );

        window.requestAnimationFrame(
            pulseFrame
        );

        window.setTimeout(
            () => {
                room.classList.remove(
                    "flashlight-pulse"
                );
            },
            duration
        );
    }


    /*
    =====================================================
    EL FENERİ KAPATMA
    =====================================================
    */

    function stop() {
        if (!activeController) {
            return;
        }

        activeController.stop();
    }


    /*
    =====================================================
    DIŞA AÇILAN FONKSİYONLAR
    =====================================================
    */

    return Object.freeze({
        start,
        stop,
        getActive,
        flicker,
        pulse
    });
})();