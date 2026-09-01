"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
BÖLÜM 7 — ARŞİV & MORG

UYUMLULUK
- room7.html içindeki gerçek ID'lerle eşleşir.
- AshvaleSave kayıt sistemiyle çalışır.
- AshvaleInventory ortak envanter sistemini kullanır (bu bölümde
  toplanan bir eşya yok, envanter boş kalabilir).
- AshvaleAudio ve AshvaleDialogue varsa bunlara bağlanır.
- Bu sistemler yüklenmese bile temel bölüm akışı çalışmaya devam eder.

BULMACA
- Ses kayıt cihazında 5 parça var (Kayıt 1-5). 4 tanesi nöbetçinin
  panikle tek tek söylediği birer rakam içeriyor, 1 tanesi (Kayıt 3)
  tamamen parazit - hiçbir rakam vermiyor (decoy).
- Oyuncu, parazitli parçayı atlayarak kalan dört kaydın rakamlarını
  kayıt numarası sırasına göre birleştirip 4 haneli kapı kodunu elde
  ediyor: 6 (Kayıt 1) - 2 (Kayıt 2) - 9 (Kayıt 4) - 0 (Kayıt 5).
- Kod, room5'teki gibi çıkış kapısındaki tuş takımına giriliyor.
=========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       SABİTLER
    ===================================================== */

    const CHAPTER_NUMBER = 7;
    const NEXT_CHAPTER_NUMBER = 8;

    const CORRECT_DOOR_CODE = ["6", "2", "9", "0"];

    const DECOY_SEGMENT = "3";

    const TAPE_SEGMENTS = {
        "1": [
            {
                speaker: "Kayıt 1 — 00:02",
                text: "Gece nöbeti başladı. Her şey sakin, defterdeki gibi. Soğuk hava dolapları mühürlü.",
                speed: 20
            },
            {
                speaker: "",
                text: "Arka bölmenin acil kodu varmış, üstüme yazayım dedim ki unutmayayım: ilk rakam altı. Altı.",
                speed: 22
            }
        ],
        "2": [
            {
                speaker: "Kayıt 2 — 00:47",
                text: "Az önce bir ses duydum, koridordan. Muhtemelen borulardır - kendimi böyle ikna ediyorum.",
                speed: 20
            },
            {
                speaker: "",
                text: "Kodun ikinci rakamını da söylüyorum, boşuna değil: iki.",
                speed: 22
            }
        ],
        "3": [
            {
                speaker: "Kayıt 3 — 01:15",
                text: "[PARAZİT] ...emin değilim... [PARAZİT] ...burada olmaması gereken...",
                speed: 24
            },
            {
                speaker: "",
                text: "[UZUN PARAZİT] ...duyuyor musun beni... [KAYIT BOZUK — DEVAMI YOK]",
                speed: 24
            }
        ],
        "4": [
            {
                speaker: "Kayıt 4 — 01:52",
                text: "Tamam. Sakin ol. Sakin.",
                speed: 20
            },
            {
                speaker: "",
                text: "Rakamı söylüyorum - hangisiydi bu artık bilmiyorum ama söylüyorum: dokuz. Dokuz.",
                speed: 22
            }
        ],
        "5": [
            {
                speaker: "Kayıt 5 — 02:30",
                text: "Çekmece kapaklarından biri kendi kendine açıldı. Gördüm. Gerçekten gördüm.",
                speed: 20
            },
            {
                speaker: "",
                text: "Son rakam sıfır. SIFIR. Kim bulursa bu kaydı, arka bölmeye girmesin. Sadece...",
                speed: 22
            },
            {
                speaker: "",
                text: "[KAYIT SONU]",
                speed: 30
            }
        ]
    };

    /* =====================================================
       ORTAK SİSTEMLER
    ===================================================== */

    const save = window.AshvaleSave || window.AshvaleSaveManager;
    const inventory = window.AshvaleInventory;
    const audio = window.AshvaleAudio;
    const dialogue = window.AshvaleDialogue;

    if (!save) {
        console.error("AshvaleSave kayıt sistemi bulunamadı.");
    }

    /* =====================================================
       ELEMENT YARDIMCISI
    ===================================================== */

    const getElement = id => document.getElementById(id);

    /* =====================================================
       ANA ELEMENTLER
    ===================================================== */

    const intro = getElement("chapter-intro");
    const playerNameElement = getElement("playerName");
    const menuButton = getElement("menuButton");

    /* =====================================================
       HOTSPOTLAR
    ===================================================== */

    const registryLog = getElement("registryLog");
    const coldStorage = getElement("coldStorage");
    const tapeRecorder = getElement("tapeRecorder");
    const guardDesk = getElement("guardDesk");
    const exitDoor = getElement("exitDoor");

    /* =====================================================
       ETKİLEŞİM BİLDİRİMİ
    ===================================================== */

    const interactionPrompt = getElement("interactionPrompt");
    const promptText = getElement("promptText");

    /* =====================================================
       HİKÂYE VE GÖREV
    ===================================================== */

    const storyText = getElement("story-text");
    const objectiveText = getElement("objectiveText");
    const objectiveProgress = getElement("objectiveProgress");
    const recordProgress = getElement("recordProgress");
    const recordProgressBar = getElement("recordProgressBar");
    const hintButton = getElement("hintButton");

    /* =====================================================
       ENVANTER
    ===================================================== */

    const inventorySlots = getElement("inventorySlots");

    /* =====================================================
       ÖLÜM KAYIT DEFTERİ
    ===================================================== */

    const registryLogViewer = getElement("registryLogViewer");
    const closeRegistryLogViewer = getElement("closeRegistryLogViewer");
    const closeRegistryLogFooter = getElement("closeRegistryLogFooter");

    /* =====================================================
       SES KAYIT CİHAZI
    ===================================================== */

    const tapeRecorderViewer = getElement("tapeRecorderViewer");
    const closeTapeRecorderViewer = getElement("closeTapeRecorderViewer");
    const closeTapeRecorderFooter = getElement("closeTapeRecorderFooter");
    const tapeSegmentButtons = Array.from(document.querySelectorAll(".tape-segment"));

    /* =====================================================
       ARKA BÖLME TUŞ TAKIMI
    ===================================================== */

    const exitCodePanel = getElement("exitCodePanel");
    const closeExitCodePanel = getElement("closeExitCodePanel");
    const exitCodeSlots = getElement("exitCodeSlots");
    const exitCodeButtons = getElement("exitCodeButtons");
    const exitCodeMessage = getElement("exitCodeMessage");

    /* =====================================================
       DİYALOG
    ===================================================== */

    const dialogElement = getElement("dialog");
    const dialogTitle = getElement("dialogTitle");
    const dialogText = getElement("dialogText");
    const dialogContinue = getElement("dialogContinue");
    const dialogClose = getElement("dialog-x-button");

    /* =====================================================
       BÖLÜM TAMAMLAMA
    ===================================================== */

    const chapterComplete = getElement("chapterComplete");
    const nextChapter = getElement("nextChapter");

    /* =====================================================
       ATMOSFER
    ===================================================== */

    const roomFlicker = getElement("roomFlicker");
    const movingShadow = getElement("movingShadow");
    const hallwayFigure = getElement("hallwayFigure");

    /* =====================================================
       OYUN DURUMU
    ===================================================== */

    const state = {
        registryRead: false,
        listenedSegments: [],
        tapeFullyListened: false,
        doorCodeInput: [],
        doorUnlocked: false,
        chapterCompleted: false,
        wrongCodeAttempts: 0,
        modalOpen: false,
        activeHotspot: null,
        dialogueQueue: [],
        dialogueIndex: 0
    };

    /* =====================================================
       KAYIT YARDIMCILARI
    ===================================================== */

    function safeGet(key, fallback = null) {
        try {
            if (save && typeof save.get === "function") {
                const value = save.get(key);
                return value === undefined || value === null
                    ? fallback
                    : value;
            }
        } catch (error) {
            console.warn(`Kayıt okunamadı: ${key}`, error);
        }

        return fallback;
    }

    function safeSet(key, value) {
        try {
            if (save && typeof save.set === "function") {
                save.set(key, value);
                return true;
            }
        } catch (error) {
            console.warn(`Kayıt yazılamadı: ${key}`, error);
        }

        return false;
    }

    function loadState() {
        state.registryRead =
            safeGet("chapter7RegistryRead", false) === true;

        const storedSegments = safeGet("chapter7ListenedSegments", []);

        state.listenedSegments =
            Array.isArray(storedSegments) ? storedSegments.slice() : [];

        state.tapeFullyListened =
            safeGet("chapter7TapeFullyListened", false) === true;

        state.doorUnlocked =
            safeGet("chapter7DoorUnlocked", false) === true;

        state.chapterCompleted =
            safeGet("chapter7Completed", false) === true;

        state.wrongCodeAttempts =
            Number(safeGet("chapter7WrongCodeAttempts", 0)) || 0;
    }

    function saveState() {
        safeSet("chapter7RegistryRead", state.registryRead);
        safeSet("chapter7ListenedSegments", state.listenedSegments);
        safeSet("chapter7TapeFullyListened", state.tapeFullyListened);
        safeSet("chapter7DoorUnlocked", state.doorUnlocked);
        safeSet("chapter7Completed", state.chapterCompleted);
        safeSet("chapter7WrongCodeAttempts", state.wrongCodeAttempts);
    }

    /* =====================================================
       ENVANTER (bu bölümde toplanan eşya yok)
    ===================================================== */

    function initializeInventory() {
        if (
            inventory &&
            typeof inventory.initialize === "function"
        ) {
            try {
                inventory.initialize({
                    element: "inventorySlots",
                    save,
                    storageKey: "chapter7Inventory",
                    slots: 6
                });
            } catch (error) {
                console.warn("Ortak envanter başlatılamadı.", error);
            }
        }
    }

    /* =====================================================
       SES SİSTEMİ
    ===================================================== */

    function initializeAudio() {
        if (
            !audio ||
            typeof audio.initialize !== "function"
        ) {
            return;
        }

        try {
            audio.initialize({
                sounds: {
                    chapter7Ambience: {
                        src: "assets/audio/ambience/chapter2_ambient.mp3",
                        type: "ambience",
                        loop: true,
                        volume: 0.5
                    },
                    paperPickup: {
                        src: "assets/audio/effects/paper_pickup.mp3",
                        type: "effect",
                        volume: 0.54
                    },
                    keypadPress: {
                        src: "assets/audio/effects/keypad_press.mp3",
                        type: "effect",
                        volume: 0.48
                    },
                    keypadError: {
                        src: "assets/audio/effects/keypad_error.mp3",
                        type: "effect",
                        volume: 0.62
                    },
                    keypadSuccess: {
                        src: "assets/audio/effects/keypad_success.mp3",
                        type: "effect",
                        volume: 0.66
                    },
                    doorUnlock: {
                        src: "assets/audio/effects/door_unlock.mp3",
                        type: "effect",
                        volume: 0.72
                    },
                    footsteps: {
                        src: "assets/audio/effects/footsteps.mp3",
                        type: "effect",
                        volume: 0.6
                    },
                    scare: {
                        src: "assets/audio/effects/scare.mp3",
                        type: "effect",
                        volume: 0.74
                    }
                }
            });

            if (typeof audio.playAmbience === "function") {
                audio.playAmbience("chapter7Ambience");
            }
        } catch (error) {
            console.warn("Room7 ses sistemi başlatılamadı.", error);
        }
    }

    function playEffect(soundName) {
        if (
            !audio ||
            typeof audio.playEffect !== "function"
        ) {
            return;
        }

        try {
            audio.playEffect(soundName);
        } catch (error) {
            console.warn(`Ses oynatılamadı: ${soundName}`, error);
        }
    }

    /* =====================================================
       ELEMENT GÖSTER / GİZLE
    ===================================================== */

    function showElement(element) {
        if (!element) {
            return;
        }

        element.classList.remove("hidden");
        element.setAttribute("aria-hidden", "false");
        state.modalOpen = true;

        const firstFocusable =
            element.querySelector(
                "button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])"
            );

        window.setTimeout(() => {
            firstFocusable?.focus?.();
        }, 40);
    }

    function hideElement(element) {
        if (!element) {
            return;
        }

        element.classList.add("hidden");
        element.setAttribute("aria-hidden", "true");
        state.modalOpen = isAnyModalOpen();
    }

    function isVisible(element) {
        return Boolean(
            element &&
            !element.classList.contains("hidden") &&
            element.getAttribute("aria-hidden") !== "true"
        );
    }

    function isAnyModalOpen() {
        return [
            registryLogViewer,
            tapeRecorderViewer,
            exitCodePanel,
            dialogElement,
            chapterComplete
        ].some(isVisible);
    }

    function closeAllPanels() {
        hideElement(registryLogViewer);
        hideElement(tapeRecorderViewer);
        hideElement(exitCodePanel);
        hideDialogue();
        hidePrompt();

        state.modalOpen = false;
        state.activeHotspot = null;
    }

    /* =====================================================
       DİYALOG
    ===================================================== */

    function initializeDialogue() {
        if (
            dialogue &&
            typeof dialogue.initialize === "function"
        ) {
            try {
                dialogue.initialize({
                    container: "dialog",
                    speaker: "dialogTitle",
                    text: "dialogText"
                });
            } catch (error) {
                console.warn("Ortak diyalog sistemi başlatılamadı.", error);
            }
        }
    }

    function showDialogue(speaker, text, speed = 20) {
        if (
            dialogue &&
            typeof dialogue.show === "function"
        ) {
            try {
                dialogue.show({ speaker, text, speed });
                state.modalOpen = true;
                return;
            } catch (error) {
                console.warn("Ortak diyalog açılamadı.", error);
            }
        }

        if (dialogTitle) {
            dialogTitle.textContent = speaker || "İnceleme";
        }

        if (dialogText) {
            dialogText.textContent = text || "";
        }

        if (dialogElement) {
            dialogElement.classList.add("dialog--visible");
            dialogElement.setAttribute("aria-hidden", "false");
            state.modalOpen = true;
        }
    }

    function playDialogue(dialogueList) {
        if (!Array.isArray(dialogueList) || dialogueList.length === 0) {
            return;
        }

        if (
            dialogue &&
            typeof dialogue.play === "function"
        ) {
            try {
                dialogue.play(dialogueList);
                state.modalOpen = true;
                return;
            } catch (error) {
                console.warn("Ortak diyalog sırası oynatılamadı.", error);
            }
        }

        state.dialogueQueue = dialogueList;
        state.dialogueIndex = 0;
        showFallbackDialogueEntry();
    }

    function showFallbackDialogueEntry() {
        const entry = state.dialogueQueue[state.dialogueIndex];

        if (!entry) {
            hideDialogue();
            return;
        }

        showDialogue(
            entry.speaker || "İnceleme",
            entry.text || "",
            entry.speed || 20
        );
    }

    function nextDialogue() {
        if (
            dialogue &&
            typeof dialogue.next === "function"
        ) {
            dialogue.next();
            return;
        }

        state.dialogueIndex += 1;
        showFallbackDialogueEntry();
    }

    function hideDialogue() {
        if (
            dialogue &&
            typeof dialogue.clearQueue === "function"
        ) {
            try {
                dialogue.clearQueue();
            } catch {
                // Diyalog yine kapatılır.
            }
        }

        if (
            dialogue &&
            typeof dialogue.hide === "function"
        ) {
            try {
                dialogue.hide();
            } catch {
                // Yedek kapatma uygulanır.
            }
        }

        dialogElement?.classList.remove("dialog--visible");
        dialogElement?.setAttribute("aria-hidden", "true");

        state.dialogueQueue = [];
        state.dialogueIndex = 0;
        state.modalOpen = isAnyModalOpen();
    }

    /* =====================================================
       ETKİLEŞİM SİSTEMİ
    ===================================================== */

    function showPrompt(text, hotspot = null) {
        if (
            !interactionPrompt ||
            !promptText ||
            state.modalOpen
        ) {
            return;
        }

        promptText.textContent = text || "İncele";
        interactionPrompt.classList.remove("hidden");
        interactionPrompt.setAttribute("aria-hidden", "false");
        state.activeHotspot = hotspot;
    }

    function hidePrompt() {
        if (!interactionPrompt) {
            return;
        }

        interactionPrompt.classList.add("hidden");
        interactionPrompt.setAttribute("aria-hidden", "true");
    }

    function registerInteraction(element, label, action) {
        if (!element) {
            return;
        }

        const resolvedLabel =
            label ||
            element.dataset.text ||
            element.getAttribute("aria-label") ||
            "İncele";

        element.addEventListener("mouseenter", () => {
            showPrompt(resolvedLabel, element);
        });

        element.addEventListener("mouseleave", () => {
            if (state.activeHotspot === element) {
                state.activeHotspot = null;
            }

            hidePrompt();
        });

        element.addEventListener("focus", () => {
            showPrompt(resolvedLabel, element);
        });

        element.addEventListener("blur", () => {
            if (state.activeHotspot === element) {
                state.activeHotspot = null;
            }

            hidePrompt();
        });

        element.addEventListener("click", event => {
            event.preventDefault();
            hidePrompt();

            state.modalOpen = isAnyModalOpen();

            if (state.modalOpen) {
                return;
            }

            action();
        });
    }

    function setupKeyboardInteraction() {
        document.addEventListener("keydown", event => {
            if (
                event.key.toLowerCase() === "e" &&
                state.activeHotspot &&
                !state.modalOpen
            ) {
                event.preventDefault();
                state.activeHotspot.click();
                return;
            }

            if (event.key !== "Escape") {
                return;
            }

            if (isVisible(chapterComplete)) {
                return;
            }

            closeAllPanels();
        });
    }

    /* =====================================================
       GÖREV İLERLEMESİ
    ===================================================== */

    function getProgressCount() {
        let count = 0;

        if (state.registryRead) count += 1;
        if (state.tapeFullyListened) count += 1;
        if (state.doorUnlocked) count += 1;

        return count;
    }

    function updateProgress() {
        const count = getProgressCount();
        const percentage = Math.min(100, (count / 3) * 100);

        if (recordProgress) {
            recordProgress.textContent = `${count} / 3`;
        }

        if (recordProgressBar) {
            recordProgressBar.style.width = `${percentage}%`;
        }

        objectiveProgress?.classList.toggle("completed", count >= 3);
    }

    function setObjective(objective, story) {
        if (objectiveText) {
            objectiveText.textContent = objective;
        }

        if (storyText && story) {
            storyText.textContent = story;
        }
    }

    function updateObjective() {
        if (state.chapterCompleted) {
            setObjective(
                "Arka bölmenin kilidini açtın.",
                "Nöbetçinin son kaydındaki rakamları buldun. Kapının ardında yeni bir kat seni bekliyor."
            );

            updateProgress();
            return;
        }

        if (!state.registryRead) {
            setObjective(
                "Ölüm kayıt defterini incele.",
                "Arşiv ve morg, bodrumun en soğuk köşesinde. Havada metal ve eski kağıt kokusu var."
            );

            updateProgress();
            return;
        }

        if (!state.tapeFullyListened) {
            setObjective(
                "Ses kayıt cihazındaki tüm parçaları dinle.",
                "Teyp üzerinde beşe ayrılmış, elle numaralanmış bir kayıt şeridi var. Nöbetçinin son gecesine ait."
            );

            updateProgress();
            return;
        }

        if (!state.doorUnlocked) {
            setObjective(
                "Arka bölme kapısının kodunu çöz.",
                "Nöbetçinin kayıtlarında bıraktığı rakamları, kayıt sırasına göre bir araya getir."
            );

            updateProgress();
            return;
        }

        updateProgress();
    }

    /* =====================================================
       ÖLÜM KAYIT DEFTERİ
    ===================================================== */

    function inspectRegistryLog() {
        if (!state.registryRead) {
            state.registryRead = true;
            saveState();
            updateObjective();

            playEffect("paperPickup");
            registryLog?.classList.add("inspected");
        }

        showElement(registryLogViewer);
    }

    function closeRegistryLogView() {
        hideElement(registryLogViewer);
    }

    /* =====================================================
       SOĞUK HAVA DOLAPLARI (ATMOSFER — BULMACA İÇERMİYOR)
    ===================================================== */

    function inspectColdStorage() {
        playDialogue([
            {
                speaker: "Soğuk Hava Dolapları",
                text: "Sıra sıra çelik kapaklar. Bazılarının üzerinde “HASTA” etiketi var - ama kapağı araladığın an, içerideki rayın tertemiz olduğunu görüyorsun. Sanki hiç kullanılmamış gibi.",
                speed: 20
            },
            {
                speaker: "",
                text: "Etiketlerden birine dokunuyorsun. Metal olmasına rağmen, hafif ama fark edilir şekilde ılık.",
                speed: 22
            }
        ]);
    }

    /* =====================================================
       SES KAYIT CİHAZI (BULMACA)
    ===================================================== */

    function inspectTapeRecorder() {
        showElement(tapeRecorderViewer);
    }

    function closeTapeRecorderView() {
        hideElement(tapeRecorderViewer);
    }

    function playTapeSegment(segmentId) {
        const lines = TAPE_SEGMENTS[segmentId];

        if (!lines) {
            return;
        }

        if (!state.listenedSegments.includes(segmentId)) {
            state.listenedSegments.push(segmentId);
            saveState();
            checkTapeCompletion();
        }

        markTapeSegmentButtons();

        playEffect("keypadPress");
        playDialogue(lines);
    }

    function checkTapeCompletion() {
        const allSegmentIds = Object.keys(TAPE_SEGMENTS);
        const allListened = allSegmentIds.every(id =>
            state.listenedSegments.includes(id)
        );

        if (allListened && !state.tapeFullyListened) {
            state.tapeFullyListened = true;
            saveState();
            updateObjective();

            tapeRecorder?.classList.add("fully-listened");
        }
    }

    function markTapeSegmentButtons() {
        tapeSegmentButtons.forEach(button => {
            const segmentId = button.dataset.segment;
            const listened = state.listenedSegments.includes(segmentId);

            button.classList.toggle("listened", listened);
            button.classList.toggle(
                "decoy-revealed",
                listened && segmentId === DECOY_SEGMENT
            );
        });
    }

    /* =====================================================
       NÖBETÇİ MASASI (ATMOSFER — BULMACA İÇERMİYOR)
    ===================================================== */

    function inspectGuardDesk() {
        playDialogue([
            {
                speaker: "Nöbetçi Panosu",
                text: "Duvara asılı pandaki kağıtlar sararmış. Çoğu rutin nöbet çizelgesi - ama birinin üzerine, acele yazılmış bir not iliştirilmiş: “Üçüncüsü bozuk çıktı, boşuna dinleme.”",
                speed: 20
            },
            {
                speaker: "",
                text: "Notun altına, daha da aceleyle eklenmiş: “Sırayla say, atlama.”",
                speed: 22
            }
        ]);
    }

    /* =====================================================
       ARKA BÖLME TUŞ TAKIMI
    ===================================================== */

    function openDoorKeypad() {
        state.doorCodeInput = [];
        updateCodeSlotsDisplay();
        setExitCodeMessage("");
        showElement(exitCodePanel);
    }

    function closeExitCode() {
        hideElement(exitCodePanel);
    }

    function updateCodeSlotsDisplay() {
        if (!exitCodeSlots) {
            return;
        }

        const slotElements = exitCodeSlots.querySelectorAll("span");

        slotElements.forEach((slotElement, index) => {
            const digit = state.doorCodeInput[index];

            slotElement.textContent = digit || "_";
        });
    }

    function setExitCodeMessage(text, type = "") {
        if (!exitCodeMessage) {
            return;
        }

        exitCodeMessage.textContent = text;
        exitCodeMessage.classList.remove("error", "is-error", "success", "is-success");

        if (type === "error") {
            exitCodeMessage.classList.add("error", "is-error");
        }

        if (type === "success") {
            exitCodeMessage.classList.add("success", "is-success");
        }
    }

    function pickDigit(digit) {
        if (state.doorUnlocked) {
            return;
        }

        const nextIndex = state.doorCodeInput.length;
        const expectedDigit = CORRECT_DOOR_CODE[nextIndex];

        if (digit !== expectedDigit) {
            playEffect("keypadError");

            state.wrongCodeAttempts += 1;
            state.doorCodeInput = [];
            saveState();

            updateCodeSlotsDisplay();

            setExitCodeMessage(
                "Yanlış kod. Baştan başla.",
                "error"
            );

            if (state.wrongCodeAttempts === 2) {
                triggerLightFlicker();
            }

            if (state.wrongCodeAttempts >= 3) {
                triggerScare();
            }

            return;
        }

        playEffect("keypadPress");

        state.doorCodeInput.push(digit);
        updateCodeSlotsDisplay();
        setExitCodeMessage("");

        if (state.doorCodeInput.length === CORRECT_DOOR_CODE.length) {
            completeDoorCode();
        }
    }

    function completeDoorCode() {
        state.doorUnlocked = true;
        saveState();

        playEffect("keypadSuccess");
        playEffect("doorUnlock");

        exitDoor?.classList.add("unlocked");

        setExitCodeMessage("KOD DOĞRU — KİLİT AÇILDI", "success");

        triggerLightFlicker();
        updateObjective();

        window.setTimeout(() => {
            hideElement(exitCodePanel);

            playDialogue([
                {
                    speaker: "Kapı Mekanizması",
                    text: "Kilit açılırken içeriden hafif bir hava akımı geliyor - soğuk, metalik, biraz da tanıdık.",
                    speed: 20
                },
                {
                    speaker: "",
                    text: "Kapının üstündeki eski etikette tek bir satır var: “Arka Bölme — Sadece Yetkili Personel.” Altı, elle karalanmış.",
                    speed: 22
                }
            ]);
        }, 950);
    }

    /* =====================================================
       ARKA BÖLME KAPISI (ÇIKIŞ)
    ===================================================== */

    function inspectExitDoor() {
        if (state.doorUnlocked || state.chapterCompleted) {
            completeChapter();
            return;
        }

        openDoorKeypad();
    }

    function completeChapter() {
        state.chapterCompleted = true;
        state.doorUnlocked = true;
        saveState();

        safeSet("chapter7Completed", true);
        safeSet("unlockedChapter", Math.max(
            Number(safeGet("unlockedChapter", 1)) || 1,
            NEXT_CHAPTER_NUMBER
        ));
        safeSet("currentChapter", NEXT_CHAPTER_NUMBER);
        safeSet("lastPlayedChapter", NEXT_CHAPTER_NUMBER);

        try {
            if (save && typeof save.completeRoom === "function") {
                save.completeRoom(CHAPTER_NUMBER);
            }

            if (save && typeof save.setCurrentRoom === "function") {
                save.setCurrentRoom(NEXT_CHAPTER_NUMBER);
            }

            if (save && typeof save.setCurrentChapter === "function") {
                save.setCurrentChapter(NEXT_CHAPTER_NUMBER);
            }
        } catch (error) {
            console.warn("Bölüm ilerlemesi ortak kayıt sistemine yazılamadı.", error);
        }

        updateObjective();
        closeAllPanels();
        hidePrompt();

        exitDoor?.classList.add("unlocked");
        showElement(chapterComplete);
        chapterComplete?.classList.add("chapter-complete--visible");
        chapterComplete?.setAttribute("aria-hidden", "false");
    }

    function goToNextChapter() {
        completeChapter();

        const nextPage =
            nextChapter?.dataset.href ||
            "room8.html";

        window.location.href = nextPage;
    }

    function returnToMenu() {
        saveState();

        safeSet("currentChapter", CHAPTER_NUMBER);
        safeSet("lastPlayedChapter", CHAPTER_NUMBER);

        try {
            if (save && typeof save.setCurrentRoom === "function") {
                save.setCurrentRoom(CHAPTER_NUMBER);
            }
        } catch {
            // Eski kayıt anahtarları zaten yazıldı.
        }

        const menuPage =
            menuButton?.dataset.href ||
            "index.html";

        window.location.href = menuPage;
    }

    /* =====================================================
       İPUCU
    ===================================================== */

    function showHint() {
        if (!state.registryRead) {
            showDialogue(
                "İpucu",
                "Arşivdeki ölüm kayıt defterini oku - orada bir tuhaflık var."
            );

            return;
        }

        if (!state.tapeFullyListened) {
            showDialogue(
                "İpucu",
                "Ses kayıt cihazındaki beş parçayı da dinle. Biri tamamen parazit - hiçbir rakam vermiyor. Hangisi olduğunu ancak dinleyerek anlarsın."
            );

            return;
        }

        if (!state.doorUnlocked) {
            showDialogue(
                "İpucu",
                "Parazitli kaydı (Kayıt 3) atla. Kalan dört kaydın rakamlarını, kayıt numarası sırasına göre yan yana yaz - bu, arka bölmenin dört haneli kodu."
            );

            return;
        }

        showDialogue(
            "İpucu",
            "Kapının kilidi açık - çıkmak için tekrar tıkla."
        );
    }

    /* =====================================================
       ATMOSFER EFEKTLERİ
    ===================================================== */

    function activateTemporaryClass(element, className, duration = 1200) {
        if (!element) {
            return;
        }

        element.classList.remove(className);
        void element.offsetWidth;
        element.classList.add(className);

        window.setTimeout(() => {
            element.classList.remove(className);
        }, duration);
    }

    function triggerLightFlicker() {
        activateTemporaryClass(roomFlicker, "active", 950);

        if (window.Effects && typeof window.Effects.flicker === "function") {
            try {
                window.Effects.flicker("#room", 850);
            } catch {
                // CSS efekti yeterli.
            }
        }
    }

    function triggerMovingShadow() {
        activateTemporaryClass(movingShadow, "active", 1700);
    }

    function triggerHallwayFigure() {
        activateTemporaryClass(hallwayFigure, "active", 1400);
    }

    function triggerScare() {
        playEffect("scare");
        triggerLightFlicker();
        triggerHallwayFigure();
        triggerMovingShadow();

        if (window.Effects && typeof window.Effects.shake === "function") {
            try {
                window.Effects.shake("#room", "medium");
            } catch {
                // CSS korku efektleri çalışmaya devam eder.
            }
        }
    }

    function scheduleAtmosphereEvents() {
        window.setTimeout(() => {
            if (!state.modalOpen && !state.chapterCompleted) {
                triggerLightFlicker();
            }
        }, 8000);

        window.setTimeout(() => {
            if (!state.modalOpen && !state.chapterCompleted) {
                triggerMovingShadow();
                playEffect("footsteps");
            }
        }, 16000);

        window.setInterval(() => {
            if (state.modalOpen || state.chapterCompleted) {
                return;
            }

            const random = Math.random();

            if (random < 0.45) {
                triggerLightFlicker();
            } else if (random < 0.8) {
                triggerMovingShadow();
            } else {
                triggerHallwayFigure();
            }
        }, 22000);
    }

    /* =====================================================
       OLAY BAĞLAMA
    ===================================================== */

    function bindEvents() {
        registerInteraction(
            registryLog,
            "Ölüm Kayıt Defterini İncele",
            inspectRegistryLog
        );

        registerInteraction(
            coldStorage,
            "Soğuk Hava Dolaplarını İncele",
            inspectColdStorage
        );

        registerInteraction(
            tapeRecorder,
            "Ses Kayıt Cihazını İncele",
            inspectTapeRecorder
        );

        registerInteraction(
            guardDesk,
            "Nöbetçi Panosunu İncele",
            inspectGuardDesk
        );

        registerInteraction(
            exitDoor,
            "Arka Bölme Kapısını İncele",
            inspectExitDoor
        );

        closeRegistryLogViewer?.addEventListener("click", closeRegistryLogView);
        closeRegistryLogFooter?.addEventListener("click", closeRegistryLogView);

        closeTapeRecorderViewer?.addEventListener("click", closeTapeRecorderView);
        closeTapeRecorderFooter?.addEventListener("click", closeTapeRecorderView);

        tapeSegmentButtons.forEach(button => {
            button.addEventListener("click", () => {
                playTapeSegment(button.dataset.segment);
            });
        });

        closeExitCodePanel?.addEventListener("click", closeExitCode);

        exitCodeButtons?.addEventListener("click", event => {
            const button = event.target.closest("button[data-digit]");

            if (!button) {
                return;
            }

            pickDigit(button.dataset.digit);
        });

        hintButton?.addEventListener("click", showHint);

        dialogContinue?.addEventListener("click", nextDialogue);
        dialogClose?.addEventListener("click", hideDialogue);

        nextChapter?.addEventListener("click", goToNextChapter);
        menuButton?.addEventListener("click", returnToMenu);

        registryLogViewer?.addEventListener("click", event => {
            if (event.target === registryLogViewer) {
                closeRegistryLogView();
            }
        });

        tapeRecorderViewer?.addEventListener("click", event => {
            if (event.target === tapeRecorderViewer) {
                closeTapeRecorderView();
            }
        });

        exitCodePanel?.addEventListener("click", event => {
            if (event.target === exitCodePanel) {
                closeExitCode();
            }
        });

        setupKeyboardInteraction();
    }

    /* =====================================================
       KAYITLI GÖRÜNÜMÜ EŞLEŞTİR
    ===================================================== */

    function restoreVisualState() {
        if (state.registryRead) {
            registryLog?.classList.add("inspected");
        }

        if (state.tapeFullyListened) {
            tapeRecorder?.classList.add("fully-listened");
        }

        markTapeSegmentButtons();

        if (state.doorUnlocked || state.chapterCompleted) {
            exitDoor?.classList.add("unlocked");
        }
    }

    /* =====================================================
       OYUNCU ADI
    ===================================================== */

    function loadPlayerName() {
        let playerName = "Oyuncu";

        try {
            const currentSave =
                save && typeof save.getSave === "function"
                    ? save.getSave()
                    : null;

            playerName =
                currentSave?.player?.name ||
                (
                    save && typeof save.getPlayerName === "function"
                        ? save.getPlayerName()
                        : ""
                ) ||
                "Oyuncu";
        } catch {
            playerName = "Oyuncu";
        }

        if (playerNameElement) {
            playerNameElement.textContent = playerName;
        }
    }

    /* =====================================================
       BÖLÜM GİRİŞİ
    ===================================================== */

    function playChapterIntro() {
        if (!intro) {
            return;
        }

        intro.classList.remove("hidden");
        intro.setAttribute("aria-hidden", "false");

        window.setTimeout(() => {
            intro.classList.add("chapter-intro--hidden");
            intro.setAttribute("aria-hidden", "true");

            window.setTimeout(() => {
                intro.style.display = "none";
            }, 900);
        }, 2500);
    }

    /* =====================================================
       BAŞLATMA
    ===================================================== */

    function initializeRoom() {
        loadState();
        loadPlayerName();

        initializeInventory();
        initializeDialogue();
        initializeAudio();

        restoreVisualState();
        updateObjective();
        bindEvents();
        playChapterIntro();
        scheduleAtmosphereEvents();

        if (state.chapterCompleted) {
            exitDoor?.classList.add("unlocked");
        }
    }

    initializeRoom();

    /*
        Bu bölümde el feneri ve UV mekaniği kullanılmıyor - morg
        bodrum katı elektrikli, oda baştan itibaren aydınlık.
    */

});
