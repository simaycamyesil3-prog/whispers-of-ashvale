"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const saveSystem = window.AshvaleSave;

    if (
        !saveSystem ||
        typeof saveSystem.getSave !== "function"
    ) {
        console.error(
            "AshvaleSave kayıt sistemi bulunamadı."
        );

        window.location.href = "index.html";
        return;
    }

    const save = saveSystem.getSave();

    if (!save) {
        window.location.href = "index.html";
        return;
    }


    /* =====================================================
       HTML ELEMANLARI
       ===================================================== */

    const chapterIntro =
        document.getElementById("chapter-intro");

    const room =
        document.getElementById("room");

    const hudPlayer =
        document.getElementById("hud-player");

    const inventoryList =
        document.getElementById("inventory-list");

    const menuButton =
        document.getElementById("menu-button");

    const hintButton =
        document.getElementById("hint-button");

    const storyText =
        document.getElementById("story-text");

    const objectiveText =
        document.getElementById("objectiveText");

    const progressCount =
        document.getElementById("progress-count");

    const progressBar =
        document.getElementById("progress-bar");

    const interactionPrompt =
        document.getElementById("interactionPrompt");

    const whisperMessage =
        document.getElementById("whisperMessage");

    const hallwayFigure =
        document.getElementById("hallwayFigure");

    const movingShadow =
        document.getElementById("movingShadow");

    const flashlight =
        document.getElementById("flashlight");

    const screenFlash =
        document.getElementById("screenFlash");

    const chapterComplete =
        document.getElementById("chapterComplete");

    const clueDialog =
        document.getElementById("clue-dialog");

    const clueKicker =
        document.getElementById("clue-kicker");

    const clueTitle =
        document.getElementById("clue-title");

    const clueVisual =
        document.getElementById("clue-visual");

    const clueText =
        document.getElementById("clue-text");

    const collectButton =
        document.getElementById("collect-button");

    const closeClue =
        document.getElementById("close-clue");

    const dialogXButton =
        document.getElementById("dialog-x-button");

    const codeArea =
        document.getElementById("code-area");

    const doorCode =
        document.getElementById("door-code");

    const submitCodeButton =
        document.getElementById(
            "submit-code-button"
        );

    const codeFeedback =
        document.getElementById("code-feedback");

    const roomAmbience =
        document.getElementById("roomAmbience");

    const fluorescentSound =
        document.getElementById("fluorescentSound");

    const metalSound =
        document.getElementById("metalSound");

    const whisperSound =
        document.getElementById("whisperSound");

    const doorSound =
        document.getElementById("doorSound");


    /* =====================================================
       OYUN DURUMU
       ===================================================== */

    let currentCollectAction = null;

    let firstScarePlayed =
        Boolean(
            saveSystem.getStoryFlag(
                "room1FirstScarePlayed",
                false
            )
        );

    let wheelchairInspected =
        Boolean(
            saveSystem.getStoryFlag(
                "room1WheelchairInspected",
                false
            )
        );

    let symbolInspected =
        Boolean(
            saveSystem.getStoryFlag(
                "room1SymbolInspected",
                false
            )
        );

    let roomCompleted = false;


    /* =====================================================
       BAŞLANGIÇ
       ===================================================== */

    initializeRoom();

    function updateObjective() {
    const progressCount =
        document.getElementById("progress-count");

    const progressBar =
        document.getElementById("progress-bar");

    const hasPatientPage =
        saveSystem.hasInventoryItem(
            "patient-page"
        );

    if (objectiveText) {
        objectiveText.textContent =
            hasPatientPage
                ? "Amaç: Hasta formundaki rakamları güvenlik kapısında kullan."
                : "Amaç: Güvenlik kapısının şifresini bul.";
    }

    if (progressCount) {
        progressCount.textContent =
            hasPatientPage
                ? "1 / 1"
                : "0 / 1";
    }

    if (progressBar) {
        progressBar.style.width =
            hasPatientPage
                ? "100%"
                : "0%";
    }
}


    function initializeRoom() {
        hudPlayer.textContent =
            save.player?.name || "Oyuncu";

        renderInventory();

        updateObjective();

        hideChapterIntro();

        setupFlashlight();

        setupHotspots();

        setupControls();

        scheduleAtmosphereEvents();

        document.addEventListener(
            "click",
            startRoomAudio,
            {
                once: true
            }
        );
    }


    /* =====================================================
       GİRİŞ EKRANI
       ===================================================== */

    function hideChapterIntro() {
        window.setTimeout(() => {
            chapterIntro?.classList.add(
                "chapter-intro--hidden"
            );

            chapterIntro?.setAttribute(
                "aria-hidden",
                "true"
            );

            window.setTimeout(() => {
                if (chapterIntro) {
                    chapterIntro.style.display =
                        "none";
                }
            }, 1000);

            updateStory(
                "Koridorun sonundaki güvenlik kapısı kilitli. Resepsiyon masasındaki eski dosya hâlâ açık duruyor."
            );
        }, 2500);
    }


    /* =====================================================
       SESLER
       ===================================================== */

    function startRoomAudio() {
        const settings =
            saveSystem.getSettings();

        if (settings.muted) {
            return;
        }

        setAudioVolume(
            roomAmbience,
            settings.musicVolume / 100
        );

        setAudioVolume(
            fluorescentSound,
            settings.effectsVolume / 100
        );

        setAudioVolume(
            metalSound,
            settings.effectsVolume / 100
        );

        setAudioVolume(
            whisperSound,
            settings.effectsVolume / 100
        );

        setAudioVolume(
            doorSound,
            settings.effectsVolume / 100
        );

        playAudio(roomAmbience);
        playAudio(fluorescentSound);
    }


    function setAudioVolume(audio, volume) {
        if (!audio) {
            return;
        }

        audio.volume = Math.min(
            1,
            Math.max(0, Number(volume) || 0)
        );
    }


    function playAudio(
        audio,
        restart = false
    ) {
        if (!audio) {
            return;
        }

        const settings =
            saveSystem.getSettings();

        if (settings.muted) {
            return;
        }

        try {
            if (restart) {
                audio.currentTime = 0;
            }

            audio
                .play()
                ?.catch?.(() => {});
        } catch {
            // Ses dosyası eksik olsa bile oyun çalışır.
        }
    }


    /* =====================================================
       EL FENERİ
       ===================================================== */

   function setupFlashlight() {
    if (
        !room ||
        !flashlight
    ) {
        return;
    }

    let targetX = room.clientWidth / 2;
    let targetY = room.clientHeight / 2;

    let currentX = targetX;
    let currentY = targetY;

    let animationFrameId = null;

    room.classList.add(
        "flashlight-idle"
    );


    function updateFlashlightPosition() {
        currentX +=
            (targetX - currentX) * 0.14;

        currentY +=
            (targetY - currentY) * 0.14;

        flashlight.style.left =
            `${currentX}px`;

        flashlight.style.top =
            `${currentY}px`;

        room.style.setProperty(
            "--flashlight-x",
            `${currentX}px`
        );

        room.style.setProperty(
            "--flashlight-y",
            `${currentY}px`
        );

        animationFrameId =
            window.requestAnimationFrame(
                updateFlashlightPosition
            );
    }


    room.addEventListener(
        "mousemove",
        (event) => {
            const rect =
                room.getBoundingClientRect();

            targetX =
                event.clientX - rect.left;

            targetY =
                event.clientY - rect.top;

            room.classList.remove(
                "flashlight-idle"
            );

            
        }
    );


    room.addEventListener(
        "mouseenter",
        () => {
            room.classList.remove(
                "flashlight-idle"
            );
        }
    );


    room.addEventListener(
        "mouseleave",
        () => {
            room.classList.add(
                "flashlight-idle"
            );
        }
    );


    window.addEventListener(
        "resize",
        () => {
            const rect =
                room.getBoundingClientRect();

            targetX = Math.min(
                targetX,
                rect.width
            );

            targetY = Math.min(
                targetY,
                rect.height
            );
        }
    );


    updateFlashlightPosition();


    window.addEventListener(
        "beforeunload",
        () => {
            if (animationFrameId) {
                window.cancelAnimationFrame(
                    animationFrameId
                );
            }
        }
    );
}


    /* =====================================================
       HOTSPOTLAR
       ===================================================== */

    function setupHotspots() {
        document
            .querySelectorAll(".hotspot")
            .forEach((button) => {
                button.addEventListener(
                    "mouseenter",
                    () => {
                        interactionPrompt.textContent =
                            button.dataset.label ||
                            "İncele";

                        interactionPrompt.classList.add(
                            "interaction-prompt--visible"
                        );

                        interactionPrompt.setAttribute(
                            "aria-hidden",
                            "false"
                        );
                    }
                );

                button.addEventListener(
                    "mouseleave",
                    () => {
                        interactionPrompt.classList.remove(
                            "interaction-prompt--visible"
                        );

                        interactionPrompt.setAttribute(
                            "aria-hidden",
                            "true"
                        );
                    }
                );

                button.addEventListener(
                    "click",
                    () => {
                        interactionPrompt.classList.remove(
                            "interaction-prompt--visible"
                        );

                        inspectAction(
                            button.dataset.action
                        );
                    }
                );
            });
    }


    function inspectAction(action) {
        if (action === "register") {
            inspectRegister();
        }

        if (action === "door") {
            inspectDoor();
        }

        if (action === "symbol") {
            inspectSymbol();
        }

        if (action === "wheelchair") {
            inspectWheelchair();
        }
    }


    /* =====================================================
       DİYALOG
       ===================================================== */

    function resetDialog() {
        clueKicker.textContent = "";
        clueTitle.textContent = "";
        clueVisual.textContent = "";
        clueVisual.className = "clue-visual";
        clueText.textContent = "";

        collectButton.hidden = true;
        codeArea.hidden = true;

        doorCode.value = "";
        codeFeedback.textContent = "";
        codeFeedback.style.color = "";

        currentCollectAction = null;
    }


    function openClue({
        kicker,
        title,
        visual,
        visualClass = "",
        text,
        collectAction = null,
        showCode = false
    }) {
        resetDialog();

        clueKicker.textContent = kicker;
        clueTitle.textContent = title;
        clueVisual.textContent = visual;
        clueText.textContent = text;

        if (visualClass) {
            clueVisual.classList.add(
                visualClass
            );
        }

        if (collectAction) {
            collectButton.hidden = false;
            currentCollectAction =
                collectAction;
        }

        codeArea.hidden = !showCode;

        if (
            typeof clueDialog.showModal ===
            "function"
        ) {
            clueDialog.showModal();
        } else {
            clueDialog.setAttribute(
                "open",
                ""
            );
        }

        if (showCode) {
            window.setTimeout(() => {
                doorCode.focus();
            }, 120);
        }
    }


    function closeDialog() {
        if (
            typeof clueDialog.close ===
            "function"
        ) {
            clueDialog.close();
        } else {
            clueDialog.removeAttribute(
                "open"
            );
        }
    }


    /* =====================================================
       HASTA DOSYASI
       ===================================================== */

    function inspectRegister() {
        const alreadyHasPage =
            saveSystem.hasInventoryItem(
                "patient-page"
            );

        openClue({
            kicker:
                "RESEPSİYON MASASI",

            title:
                "Hasta Kayıt Formu",

            visual:
                "17 MART 1987\n\nHasta: E. Varlık\nOda: 3-1\nSeans: 7\nKontrol: 9",

            visualClass:
                "note",

            text: alreadyHasPage
                ? "Formun üzerinde 3, 1, 7 ve 9 rakamları özellikle işaretlenmiş."
                : "Kâğıdın dört farklı bölümünde 3, 1, 7 ve 9 rakamları kırmızı kalemle daire içine alınmış.",

            collectAction:
                alreadyHasPage
                    ? null
                    : collectPatientPage
        });

        updateStory(
            "Dosyanın üzerindeki dört rakam tesadüf gibi görünmüyor."
        );

        if (!firstScarePlayed) {
            window.setTimeout(
                triggerFirstScare,
                700
            );
        }
    }


    function collectPatientPage() {
        try {
            saveSystem.addInventoryItem({
                id:
                    "patient-page",

                name:
                    "Hasta Kayıt Formu",

                description:
                    "İşaretlenmiş rakamlar: 3, 1, 7, 9",

                quantity:
                    1
            });

            saveSystem.incrementStatistic(
                "notesFound",
                1
            );

            renderInventory();

            collectButton.hidden = true;

            clueText.textContent =
                "Hasta kayıt formu envantere eklendi.";

            updateObjective();
        } catch (error) {
            console.error(error);

            clueText.textContent =
                "Dosya envantere eklenemedi.";
        }
    }


    /* =====================================================
       DUVAR SEMBOLÜ
       ===================================================== */

    function inspectSymbol() {
        symbolInspected = true;

        try {
            saveSystem.setStoryFlag(
                "room1SymbolInspected",
                true
            );
        } catch (error) {
            console.error(error);
        }

        openClue({
            kicker:
                "DOĞU DUVARI",

            title:
                "Mühürlenmiş Ruh Sembolü",

            visual:
                "⛧",

            visualClass:
                "symbol",

            text:
                "Sembol aceleyle çizilmiş. Çevresindeki dört kesik, içerideki bir şeyin dışarı çıkmasını engellemek için yapılmış olabilir."
        });

        updateStory(
            "Sembolün altındaki kazınmış yazı okunuyor: “Dördüncü kapıyı açma.”"
        );
    }


    /* =====================================================
       TEKERLEKLİ SANDALYE
       ===================================================== */

    function inspectWheelchair() {
        wheelchairInspected = true;

        try {
            saveSystem.setStoryFlag(
                "room1WheelchairInspected",
                true
            );
        } catch (error) {
            console.error(error);
        }

        openClue({
            kicker:
                "KORİDORUN SAĞ TARAFI",

            title:
                "Terk Edilmiş Tekerlekli Sandalye",

            visual:
                "♿",

            visualClass:
                "wheelchair-clue",

            text:
                "Sandalyenin deri kısmında yeni oluşmuş bir çöküntü var. Birkaç saniye önce burada biri oturuyormuş gibi sıcak."
        });

        updateStory(
            "Sandalyenin tekerleklerinden biri yavaşça kendi kendine dönüyor."
        );

        triggerShadowPass();
    }


    /* =====================================================
       KAPI
       ===================================================== */

    function inspectDoor() {
        const hasPage =
            saveSystem.hasInventoryItem(
                "patient-page"
            );

        openClue({
            kicker:
                "KORİDOR SONU",

            title:
                "Paslı Güvenlik Kapısı",

            visual:
                "B-17",

            text: hasPage
                ? "Tuş takımının üzerinde dört haneli bir şifre alanı bulunuyor. Hasta formundaki işaretli rakamlar burada kullanılabilir."
                : "Kapı dört haneli bir kod istiyor. Şifreye dair bir ipucu bulmalısın.",

            showCode:
                true
        });

        updateStory(
            "Kapının arkasından düzenli aralıklarla metal sürtünme sesi geliyor."
        );
    }


    function solveDoor() {
        if (roomCompleted) {
            return;
        }

        const enteredCode =
            doorCode.value.trim();

        if (enteredCode === "3179") {
            roomCompleted = true;

            codeFeedback.style.color =
                "#8fbea5";

            codeFeedback.textContent =
                "Kod kabul edildi. Kilit açılıyor...";

            playAudio(
                doorSound,
                true
            );

            try {
                saveSystem.setStoryFlag(
                    "room1DoorSolved",
                    true
                );

                saveSystem.incrementStatistic(
                    "puzzlesSolved",
                    1
                );

                saveSystem.completeChapter(
                    1
                );
            } catch (error) {
                console.error(
                    "Bölüm kaydedilemedi:",
                    error
                );
            }

            window.setTimeout(() => {
                closeDialog();

                screenFlash.classList.add(
                    "screen-flash--active"
                );

                window.setTimeout(() => {
                    chapterComplete.classList.add(
                        "chapter-complete--visible"
                    );

                    chapterComplete.setAttribute(
                        "aria-hidden",
                        "false"
                    );
                }, 450);
            }, 800);

           window.setTimeout(() => {

    try {
        saveSystem.setCurrentChapter(2);
    } catch (e) {
        console.warn(e);
    }

    window.location.href = "room2.html";

}, 5200);

            return;
        }

        codeFeedback.style.color =
            "#bf7070";

        codeFeedback.textContent =
            "Yanlış kod. Koridorun ışıkları bir anlığına söndü.";

        doorCode.select();

        triggerWrongCodeScare();
    }


    /* =====================================================
       KORKU SAHNELERİ
       ===================================================== */

    function triggerFirstScare() {
        if (firstScarePlayed) {
            return;
        }

        firstScarePlayed = true;

        try {
            saveSystem.setStoryFlag(
                "room1FirstScarePlayed",
                true
            );
        } catch (error) {
            console.error(error);
        }

        playAudio(
            metalSound,
            true
        );

        hallwayFigure.classList.remove(
            "hallway-figure--visible"
        );

        void hallwayFigure.offsetWidth;

        hallwayFigure.classList.add(
            "hallway-figure--visible"
        );

        whisperMessage.textContent =
            "Buraya gelmemeliydin...";

        whisperMessage.classList.remove(
            "whisper-message--visible"
        );

        void whisperMessage.offsetWidth;

        whisperMessage.classList.add(
            "whisper-message--visible"
        );

        playAudio(
            whisperSound,
            true
        );
    }


    function triggerShadowPass() {
        movingShadow.classList.remove(
            "corridor-shadow--move"
        );

        void movingShadow.offsetWidth;

        movingShadow.classList.add(
            "corridor-shadow--move"
        );

        playAudio(
            metalSound,
            true
        );
    }


    function triggerWrongCodeScare() {
        screenFlash.classList.remove(
            "screen-flash--active"
        );

        void screenFlash.offsetWidth;

        screenFlash.classList.add(
            "screen-flash--active"
        );

        triggerShadowPass();

        whisperMessage.textContent =
            "Yanlış kapı...";

        whisperMessage.classList.remove(
            "whisper-message--visible"
        );

        void whisperMessage.offsetWidth;

        whisperMessage.classList.add(
            "whisper-message--visible"
        );
    }


    function scheduleAtmosphereEvents() {
        window.setTimeout(() => {
            if (!roomCompleted) {
                triggerShadowPass();
            }
        }, 14000);

        window.setTimeout(() => {
            if (!roomCompleted) {
                whisperMessage.textContent =
                    "Simay...";

                whisperMessage.classList.add(
                    "whisper-message--visible"
                );

                playAudio(
                    whisperSound,
                    true
                );
            }
        }, 25000);
    }


    /* =====================================================
       ENVANTER
       ===================================================== */

    function renderInventory() {
    inventoryList.innerHTML = "";

    const inventory =
        saveSystem.getInventory();

    if (inventory.length === 0) {
        const emptyItem =
            document.createElement("li");

        emptyItem.textContent =
            "Envanter boş";

        emptyItem.classList.add(
            "inventory-empty"
        );

        inventoryList.appendChild(
            emptyItem
        );

        return;
    }

    inventory.forEach((item) => {
        const listItem =
            document.createElement("li");

        listItem.textContent =
            Number(item.quantity) > 1
                ? `${item.name} ×${item.quantity}`
                : item.name;

        listItem.title =
            item.description ||
            "İncelemek için tıkla";

        listItem.tabIndex = 0;
        listItem.setAttribute(
            "role",
            "button"
        );

        listItem.dataset.inventoryId =
            item.id;

        listItem.addEventListener(
            "click",
            () => {
                inspectInventoryItem(item);
            }
        );

        listItem.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();
                    inspectInventoryItem(item);
                }
            }
        );

        inventoryList.appendChild(
            listItem
        );
    });
}

function inspectInventoryItem(item) {
    if (!item) {
        return;
    }

    if (item.id === "patient-page") {
        openClue({
            kicker:
                "ENVANTER ÖĞESİ",

            title:
                item.name ||
                "Hasta Kayıt Formu",

            visual:
                "17 MART 1987\n\nHasta: E. Varlık\nOda: 3-1\nSeans: 7\nKontrol: 9",

            visualClass:
                "note",

            text:
                item.description ||
                "İşaretlenmiş rakamlar: 3, 1, 7, 9"
        });

        return;
    }

    openClue({
        kicker:
            "ENVANTER ÖĞESİ",

        title:
            item.name ||
            "Bilinmeyen Eşya",

        visual:
            "◆",

        text:
            item.description ||
            "Bu eşya hakkında henüz ek bilgi bulunmuyor."
    });
}

    /* =====================================================
       HİKÂYE METNİ
       ===================================================== */

    function updateStory(message) {
        storyText.textContent =
            message;
    }


    /* =====================================================
       KONTROLLER
       ===================================================== */

    function setupControls() {
        collectButton.addEventListener(
            "click",
            () => {
                if (
                    typeof currentCollectAction ===
                    "function"
                ) {
                    currentCollectAction();
                }
            }
        );

        closeClue.addEventListener(
            "click",
            closeDialog
        );

        dialogXButton.addEventListener(
            "click",
            closeDialog
        );

        menuButton.addEventListener(
            "click",
            returnToMenu
        );

        hintButton.addEventListener(
            "click",
            showHint
        );

        submitCodeButton.addEventListener(
            "click",
            solveDoor
        );

        doorCode.addEventListener(
            "input",
            () => {
                doorCode.value =
                    doorCode.value
                        .replace(/\D/g, "")
                        .slice(0, 4);
            }
        );

        doorCode.addEventListener(
            "keydown",
            (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    solveDoor();
                }
            }
        );

        clueDialog.addEventListener(
            "click",
            (event) => {
                if (
                    event.target ===
                    clueDialog
                ) {
                    closeDialog();
                }
            }
        );
    }


    function showHint() {
        const hasPage =
            saveSystem.hasInventoryItem(
                "patient-page"
            );

        if (!hasPage) {
            alert(
                "İpucu: Resepsiyon masasındaki açık hasta dosyasını incele."
            );

            return;
        }

        if (!symbolInspected) {
            alert(
                "İpucu: Hasta formundaki işaretlenmiş rakamları soldan sağa sırala."
            );

            return;
        }

        if (!wheelchairInspected) {
            alert(
                "İpucu: Kapı şifresi hasta formundaki dört rakamdan oluşuyor."
            );

            return;
        }

        alert(
            "İpucu: Güvenlik kapısında 3179 kodunu dene."
        );
    }


    function returnToMenu() {
        try {
            saveSystem.touchLastPlayed();
        } catch (error) {
            console.error(error);
        }

        window.location.href =
            "index.html";
    }
});