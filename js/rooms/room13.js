"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
BÖLÜM 13 — ESKİ TEMELLER

UYUMLULUK
- room13.html içindeki gerçek ID'lerle eşleşir.
- AshvaleSave kayıt sistemiyle çalışır.
- AshvaleInventory ortak envanter sistemini kullanır (bu bölümde
  toplanan bir eşya yok, envanter boş kalabilir).
- AshvaleAudio ve AshvaleDialogue varsa bunlara bağlanır.
- Bu sistemler yüklenmese bile temel bölüm akışı çalışmaya devam eder.

BULMACA
- Duvarlarda üç farklı elden, üç farklı döneme ait dört
  haneli kazı var: 3179 / 3172 / 3122.
- Hiçbiri birbirinin aynısı değil, ama hiçbiri de tamamen
  farklı değil. Her basamak için en az iki kazının hemfikir
  olduğu rakam gerçek kabul edilir:
      basamak 1: 3,3,3 -> 3
      basamak 2: 1,1,1 -> 1
      basamak 3: 7,7,2 -> 7
      basamak 4: 9,2,2 -> 2
  Gerçek kod: 3172 (3179'a kasıtlı olarak çok yakın, ama
  aynı değil).
=========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       SABİTLER
    ===================================================== */

    const CHAPTER_NUMBER = 13;
    const NEXT_CHAPTER_NUMBER = 14;

    const CORRECT_DOOR_CODE = ["3", "1", "7", "2"];

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

    const leftWallNumbers = getElement("leftWallNumbers");
    const leftWallTally = getElement("leftWallTally");
    const rightWallCarvings = getElement("rightWallCarvings");
    const roots = getElement("roots");
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
       KAZI GÖRÜNTÜLEYİCİLERİ
    ===================================================== */

    const carvingViewerA = getElement("carvingViewerA");
    const closeCarvingA = getElement("closeCarvingA");
    const closeCarvingAFooter = getElement("closeCarvingAFooter");

    const carvingViewerB = getElement("carvingViewerB");
    const closeCarvingB = getElement("closeCarvingB");
    const closeCarvingBFooter = getElement("closeCarvingBFooter");

    const carvingViewerC = getElement("carvingViewerC");
    const closeCarvingC = getElement("closeCarvingC");
    const closeCarvingCFooter = getElement("closeCarvingCFooter");

    /* =====================================================
       KAPI PANELİ
    ===================================================== */

    const doorPanel = getElement("doorPanel");
    const closeDoorPanelButton = getElement("closeDoorPanel");
    const doorCodeSlots = getElement("doorCodeSlots");
    const doorCodeButtons = getElement("doorCodeButtons");
    const doorCodeMessage = getElement("doorCodeMessage");

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
        numbersRead: false,
        tallyRead: false,
        rightCarvingsRead: false,
        doorCodeInput: [],
        doorUnlocked: false,
        chapterCompleted: false,
        wrongDoorAttempts: 0,
        modalOpen: false,
        activeHotspot: null,
        playerName: "Oyuncu",
        dialogueQueue: [],
        dialogueIndex: 0,
        awaitingDoorTransition: false
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
        state.numbersRead =
            safeGet("chapter13NumbersRead", false) === true;

        state.tallyRead =
            safeGet("chapter13TallyRead", false) === true;

        state.rightCarvingsRead =
            safeGet("chapter13RightCarvingsRead", false) === true;

        state.doorUnlocked =
            safeGet("chapter13DoorUnlocked", false) === true;

        state.chapterCompleted =
            safeGet("chapter13Completed", false) === true;
    }

    function saveState() {
        safeSet("chapter13NumbersRead", state.numbersRead);
        safeSet("chapter13TallyRead", state.tallyRead);
        safeSet("chapter13RightCarvingsRead", state.rightCarvingsRead);
        safeSet("chapter13DoorUnlocked", state.doorUnlocked);
        safeSet("chapter13Completed", state.chapterCompleted);
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
                    storageKey: "chapter13Inventory",
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
                    chapter13Ambience: {
                        src: "assets/audio/ambience/chapter2_ambient.mp3",
                        type: "ambience",
                        loop: true,
                        volume: 0.4
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
                        volume: 0.7
                    }
                }
            });

            if (typeof audio.playAmbience === "function") {
                audio.playAmbience("chapter13Ambience");
            }
        } catch (error) {
            console.warn("Room13 ses sistemi başlatılamadı.", error);
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
            carvingViewerA,
            carvingViewerB,
            carvingViewerC,
            doorPanel,
            dialogElement,
            chapterComplete
        ].some(isVisible);
    }

    function closeAllPanels() {
        hideElement(carvingViewerA);
        hideElement(carvingViewerB);
        hideElement(carvingViewerC);
        hideElement(doorPanel);
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

            if (
                state.awaitingDoorTransition &&
                dialogElement?.getAttribute("aria-hidden") === "true"
            ) {
                state.awaitingDoorTransition = false;
                completeChapter();
            }

            return;
        }

        state.dialogueIndex += 1;
        showFallbackDialogueEntry();

        if (
            state.awaitingDoorTransition &&
            state.dialogueIndex >= state.dialogueQueue.length
        ) {
            state.awaitingDoorTransition = false;
            completeChapter();
        }
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

        if (state.numbersRead) count += 1;
        if (state.tallyRead) count += 1;
        if (state.rightCarvingsRead) count += 1;

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
                "Eski temellerin sırrını çözdün.",
                "Hastane bu şeyin yaratıcısı değil - sadece en son, en dikkatli saklayanı."
            );

            updateProgress();
            return;
        }

        if (!state.numbersRead) {
            setObjective(
                "Duvardaki ilk kazıyı incele.",
                "Hastanenin altında, çok daha eski bir taş yapı var. Duvarlara üç farklı elden, üç farklı dönemden kazılar işlenmiş."
            );

            updateProgress();
            return;
        }

        if (!state.tallyRead) {
            setObjective(
                "Aynı duvardaki ikinci kazıyı da incele.",
                "İlk kazıdaki rakamlar tek başına yeterli değil. Başka bir el de buraya bir şey kazımış."
            );

            updateProgress();
            return;
        }

        if (!state.rightCarvingsRead) {
            setObjective(
                "Karşı duvardaki üçüncü kazıyı da incele.",
                "İki farklı kazı buldun, ama tam olarak aynı değiller. Üçüncüsü karşı duvarda olabilir."
            );

            updateProgress();
            return;
        }

        if (!state.doorUnlocked) {
            setObjective(
                "Üç kazıyı karşılaştır, gerçek rakamları kapıya gir.",
                "Üç kazı da birbirinden farklı - ama hiçbiri tamamen farklı değil."
            );

            updateProgress();
            return;
        }

        updateProgress();
    }

    /* =====================================================
       KAZI A — SOL DUVAR, İLK
    ===================================================== */

    function inspectLeftWallNumbers() {
        if (!state.numbersRead) {
            state.numbersRead = true;
            saveState();
            updateObjective();

            playEffect("paperPickup");
            leftWallNumbers?.classList.add("inspected");
        }

        showElement(carvingViewerA);
    }

    function closeCarvingViewA() {
        hideElement(carvingViewerA);
    }

    /* =====================================================
       KAZI B — SOL DUVAR, İKİNCİ
    ===================================================== */

    function inspectLeftWallTally() {
        if (!state.tallyRead) {
            state.tallyRead = true;
            saveState();
            updateObjective();

            playEffect("paperPickup");
            leftWallTally?.classList.add("inspected");
        }

        showElement(carvingViewerB);
    }

    function closeCarvingViewB() {
        hideElement(carvingViewerB);
    }

    /* =====================================================
       KAZI C — SAĞ DUVAR
    ===================================================== */

    function inspectRightWallCarvings() {
        if (!state.rightCarvingsRead) {
            state.rightCarvingsRead = true;
            saveState();
            updateObjective();

            playEffect("paperPickup");
            rightWallCarvings?.classList.add("inspected");
        }

        showElement(carvingViewerC);
    }

    function closeCarvingViewC() {
        hideElement(carvingViewerC);
    }

    /* =====================================================
       KÖKLER (ATMOSFER)
    ===================================================== */

    function inspectRoots() {
        playDialogue([
            {
                speaker: "Kökler",
                text: "Tavandaki çatlaktan sarkan ince kökler - buranın üstünde, çok daha yakın zamanda bir şey büyümüş.",
                speed: 20
            },
            {
                speaker: "",
                text: "Belki de hastanenin bahçesi. Belki de başka bir şey. Kökler bu kadar derine inmez normalde.",
                speed: 22
            }
        ]);
    }

    /* =====================================================
       KAPI PANELİ — TUŞ TAKIMI
    ===================================================== */

    function openDoorPanel() {
        if (!state.numbersRead || !state.tallyRead || !state.rightCarvingsRead) {
            showDialogue(
                "Kilitli Kapı",
                "Kilit dört haneli bir kombinasyon istiyor. Bu numarayı bulmadan denemenin anlamı yok - önce üç duvar kazısını da incele."
            );

            return;
        }

        state.doorCodeInput = [];
        updateDoorCodeSlotsDisplay();
        setDoorCodeMessage("");
        showElement(doorPanel);
    }

    function updateDoorCodeSlotsDisplay() {
        if (!doorCodeSlots) {
            return;
        }

        const slotElements = doorCodeSlots.querySelectorAll("span");

        slotElements.forEach((slotElement, index) => {
            const digit = state.doorCodeInput[index];

            slotElement.textContent = digit || "_";
        });
    }

    function setDoorCodeMessage(text, type = "") {
        if (!doorCodeMessage) {
            return;
        }

        doorCodeMessage.textContent = text;
        doorCodeMessage.classList.remove("error", "is-error", "success", "is-success");

        if (type === "error") {
            doorCodeMessage.classList.add("error", "is-error");
        }

        if (type === "success") {
            doorCodeMessage.classList.add("success", "is-success");
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

            state.wrongDoorAttempts += 1;
            state.doorCodeInput = [];
            saveState();

            updateDoorCodeSlotsDisplay();

            setDoorCodeMessage(
                "Yanlış kombinasyon. Baştan başla.",
                "error"
            );

            if (state.wrongDoorAttempts === 2) {
                triggerLightFlicker();
            }

            if (state.wrongDoorAttempts >= 4) {
                triggerScare();
            }

            return;
        }

        playEffect("keypadPress");

        state.doorCodeInput.push(digit);
        updateDoorCodeSlotsDisplay();
        setDoorCodeMessage("");

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

        setDoorCodeMessage("KOMBİNASYON DOĞRU — KİLİT AÇILDI", "success");

        triggerLightFlicker();
        updateObjective();

        window.setTimeout(() => {
            hideElement(doorPanel);

            state.awaitingDoorTransition = true;

            playDialogue([
                {
                    speaker: "Kilit",
                    text: "3-1-7-2. 3179'a bu kadar yakın, ama aynı değil.",
                    speed: 20
                },
                {
                    speaker: "",
                    text: "Hastane bu sayıyı icat etmemiş - sadece kendi versiyonunu üretmiş, çok daha eski bir şeyin üzerine.",
                    speed: 22
                }
            ]);
        }, 950);
    }

    /* =====================================================
       ÇIKIŞ KAPISI
    ===================================================== */

    function inspectExitDoor() {
        if (state.chapterCompleted) {
            completeChapter();
            return;
        }

        if (!state.doorUnlocked) {
            openDoorPanel();
            return;
        }

        completeChapter();
    }

    function completeChapter() {
        state.chapterCompleted = true;
        saveState();

        safeSet("chapter13Completed", true);
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
            "room14.html";

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
        if (!state.numbersRead) {
            showDialogue(
                "İpucu",
                "Sol duvardaki ilk kazıyı incele - taşa kaba çizgilerle işlenmiş dört rakam var."
            );

            return;
        }

        if (!state.tallyRead) {
            showDialogue(
                "İpucu",
                "Aynı duvarın devamında, farklı bir elden ikinci bir kazı daha var."
            );

            return;
        }

        if (!state.rightCarvingsRead) {
            showDialogue(
                "İpucu",
                "Karşı duvarda, en yeni görünen üçüncü bir kazı daha var."
            );

            return;
        }

        if (!state.doorUnlocked) {
            showDialogue(
                "İpucu",
                "Üç kazı da birbirinden farklı ama tamamen değil. Her basamak için, en az iki kazının hemfikir olduğu rakamı gerçek kabul et."
            );

            return;
        }

        showDialogue(
            "İpucu",
            "Kilit açık - çıkmak için kapıya tekrar tıkla."
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
            leftWallNumbers,
            "Taşa Kazınmış İlk Sayıyı İncele",
            inspectLeftWallNumbers
        );

        registerInteraction(
            leftWallTally,
            "İkinci Kazıyı İncele",
            inspectLeftWallTally
        );

        registerInteraction(
            rightWallCarvings,
            "Üçüncü Kazıyı İncele",
            inspectRightWallCarvings
        );

        registerInteraction(
            roots,
            "Sarkan Kökleri İncele",
            inspectRoots
        );

        registerInteraction(
            exitDoor,
            "Kilitli Kapıyı İncele",
            inspectExitDoor
        );

        closeCarvingA?.addEventListener("click", closeCarvingViewA);
        closeCarvingAFooter?.addEventListener("click", closeCarvingViewA);

        closeCarvingB?.addEventListener("click", closeCarvingViewB);
        closeCarvingBFooter?.addEventListener("click", closeCarvingViewB);

        closeCarvingC?.addEventListener("click", closeCarvingViewC);
        closeCarvingCFooter?.addEventListener("click", closeCarvingViewC);

        closeDoorPanelButton?.addEventListener("click", closeDoorPanel);

        doorCodeButtons?.addEventListener("click", event => {
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

        carvingViewerA?.addEventListener("click", event => {
            if (event.target === carvingViewerA) {
                closeCarvingViewA();
            }
        });

        carvingViewerB?.addEventListener("click", event => {
            if (event.target === carvingViewerB) {
                closeCarvingViewB();
            }
        });

        carvingViewerC?.addEventListener("click", event => {
            if (event.target === carvingViewerC) {
                closeCarvingViewC();
            }
        });

        doorPanel?.addEventListener("click", event => {
            if (event.target === doorPanel) {
                closeDoorPanel();
            }
        });

        setupKeyboardInteraction();
    }

    function closeDoorPanel() {
        hideElement(doorPanel);
    }

    /* =====================================================
       KAYITLI GÖRÜNÜMÜ EŞLEŞTİR
    ===================================================== */

    function restoreVisualState() {
        if (state.numbersRead) {
            leftWallNumbers?.classList.add("inspected");
        }

        if (state.tallyRead) {
            leftWallTally?.classList.add("inspected");
        }

        if (state.rightCarvingsRead) {
            rightWallCarvings?.classList.add("inspected");
        }

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

        state.playerName = playerName;

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
        Bu bölümde el feneri ve UV mekaniği kullanılmıyor - oda
        baştan itibaren aydınlık (tek gaz lambası dışında).
    */

});
