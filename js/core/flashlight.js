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

        const roomRect =
            room.getBoundingClientRect();

        let targetX =
            startAtCenter
                ? roomRect.width / 2
                : 0;

        let targetY =
            startAtCenter
                ? roomRect.height / 2
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

            targetX =
                clamp(
                    clientX -
                    rect.left,
                    0,
                    rect.width
                );

            targetY =
                clamp(
                    clientY -
                    rect.top,
                    0,
                    rect.height
                );

            if (interactionPrompt) {
                interactionPrompt.style.left =
                    `${clientX}px`;

                interactionPrompt.style.top =
                    `${clientY}px`;
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
            const rect =
                room.getBoundingClientRect();

            targetX =
                clamp(
                    targetX,
                    0,
                    rect.width
                );

            targetY =
                clamp(
                    targetY,
                    0,
                    rect.height
                );

            currentX =
                clamp(
                    currentX,
                    0,
                    rect.width
                );

            currentY =
                clamp(
                    currentY,
                    0,
                    rect.height
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
                const rect =
                    room.getBoundingClientRect();

                targetX =
                    clamp(
                        x,
                        0,
                        rect.width
                    );

                targetY =
                    clamp(
                        y,
                        0,
                        rect.height
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