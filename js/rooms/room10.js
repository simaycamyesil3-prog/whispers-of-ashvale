"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
BÖLÜM 10 — DİNLEME ODASI (SES ARŞİVİ)

UYUMLULUK
- room10.html içindeki gerçek ID'lerle eşleşir.
- AshvaleSave kayıt sistemiyle çalışır.
- AshvaleInventory ortak envanter sistemini kullanır (bu bölümde
  toplanan bir eşya yok, envanter boş kalabilir).
- AshvaleAudio ve AshvaleDialogue varsa bunlara bağlanır.
- Bu sistemler yüklenmese bile temel bölüm akışı çalışmaya devam eder.

BULMACA
- 5 makara var (KAYIT 1-5). Her makara için 3 hız seçeneği var:
  YAVAŞ / NORMAL / HIZLI. Sadece BİRİ doğru - yanlış hızda "ÇAL"a
  basmak parazit/garbled bir mesaj veriyor, doğru hızda ise net
  bir rakam ortaya çıkıyor:
    Kayıt 1 -> NORMAL -> "6"
    Kayıt 2 -> YAVAŞ  -> "3"
    Kayıt 3 -> HIZLI  -> "8"
    Kayıt 4 -> YAVAŞ  -> "2"
    Kayıt 5 -> NORMAL -> "5"
  Katalog defteri hiçbir zaman "YAVAŞ/NORMAL/HIZLI" kelimesini
  doğrudan söylemiyor - sadece kaydın nasıl davrandığını anlatıyor
  (örn. "ancak yavaşlatılırsa anlaşılıyor" -> YAVAŞ).
- Beş makara da çözülünce dip çekmecenin 5 haneli kodu ortaya
  çıkıyor: "63825" (makara sırasına göre 1'den 5'e).
=========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       SABİTLER
    ===================================================== */

    const CHAPTER_NUMBER = 10;
    const NEXT_CHAPTER_NUMBER = 11;

    const CORRECT_SPEED = {
        1: "normal",
        2: "yavas",
        3: "hizli",
        4: "yavas",
        5: "normal"
    };

    const REEL_DIGITS = {
        1: "6",
        2: "3",
        3: "8",
        4: "2",
        5: "5"
    };

    const REVEALED_LINES = {
        1: "Ses net duyuluyor, sakin bir tonla: “...son rakam altı.”",
        2: "Yavaşlatılınca bant içinden bir fısıltı çözülüyor: “...üç...”",
        3: "Hızlandırılan müzik döngüsü bir söze dönüşüyor: “...sekiz...”",
        4: "Yavaşlatılmış ses kesik kesik ilerliyor: “...iki...”",
        5: "Ninni gibi, sakin bir ses tekrarlıyor: “...beş...”"
    };

    const GARBLED_LINES = {
        1: "Bu hızda sadece boğuk bir uğultu var.",
        2: "Bu hızda bant hışırtısından başka bir şey duyulmuyor.",
        3: "Bu hızda döngü anlamsız bir gürültüye dönüşüyor.",
        4: "Bu hızda ses fazla dağınık, hiçbir şey seçilmiyor.",
        5: "Bu hızda ezgi bozuluyor, tanınmaz hale geliyor."
    };

    const CORRECT_DRAWER_CODE = ["6", "3", "8", "2", "5"];
    const REEL_COUNT = 5;

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

    const tapeArchive = getElement("tapeArchive");
    const catalogLog = getElement("catalogLog");
    const dipCekmece = getElement("dipCekmece");
    const deskConsole = getElement("deskConsole");
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
       KATALOG DEFTERİ
    ===================================================== */

    const catalogViewer = getElement("catalogViewer");
    const closeCatalogViewer = getElement("closeCatalogViewer");
    const closeCatalogFooter = getElement("closeCatalogFooter");

    /* =====================================================
       MAKARA DOLABI (TAPE CONSOLE)
    ===================================================== */

    const archivePanel = getElement("archivePanel");
    const closeArchivePanel = getElement("closeArchivePanel");
    const tapeRows = getElement("tapeRows");
    const archiveMessage = getElement("archiveMessage");

    /* =====================================================
       DİP ÇEKMECE
    ===================================================== */

    const drawerPanel = getElement("drawerPanel");
    const closeDrawerPanel = getElement("closeDrawerPanel");
    const drawerCodeSlots = getElement("drawerCodeSlots");
    const drawerCodeButtons = getElement("drawerCodeButtons");
    const drawerCodeMessage = getElement("drawerCodeMessage");

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
        catalogRead: false,
        reelSelectedSpeed: { 1: null, 2: null, 3: null, 4: null, 5: null },
        reelSolved: { 1: false, 2: false, 3: false, 4: false, 5: false },
        archiveSolved: false,
        drawerCodeInput: [],
        drawerOpened: false,
        doorUnlocked: false,
        chapterCompleted: false,
        wrongPlayAttempts: 0,
        wrongDrawerAttempts: 0,
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
        state.catalogRead =
            safeGet("chapter10CatalogRead", false) === true;

        state.archiveSolved =
            safeGet("chapter10ArchiveSolved", false) === true;

        state.drawerOpened =
            safeGet("chapter10DrawerOpened", false) === true;

        state.doorUnlocked =
            safeGet("chapter10DoorUnlocked", false) === true;

        state.chapterCompleted =
            safeGet("chapter10Completed", false) === true;

        const savedSolved = safeGet("chapter10ReelSolved", null);

        if (savedSolved && typeof savedSolved === "object") {
            for (let reelId = 1; reelId <= REEL_COUNT; reelId += 1) {
                state.reelSolved[reelId] = savedSolved[reelId] === true;
            }
        }

        if (state.archiveSolved) {
            for (let reelId = 1; reelId <= REEL_COUNT; reelId += 1) {
                state.reelSolved[reelId] = true;
            }
        }
    }

    function saveState() {
        safeSet("chapter10CatalogRead", state.catalogRead);
        safeSet("chapter10ArchiveSolved", state.archiveSolved);
        safeSet("chapter10DrawerOpened", state.drawerOpened);
        safeSet("chapter10DoorUnlocked", state.doorUnlocked);
        safeSet("chapter10Completed", state.chapterCompleted);
        safeSet("chapter10ReelSolved", state.reelSolved);
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
                    storageKey: "chapter10Inventory",
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
                    chapter10Ambience: {
                        src: "assets/audio/ambience/chapter2_ambient.mp3",
                        type: "ambience",
                        loop: true,
                        volume: 0.48
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
                audio.playAmbience("chapter10Ambience");
            }
        } catch (error) {
            console.warn("Room10 ses sistemi başlatılamadı.", error);
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
            catalogViewer,
            archivePanel,
            drawerPanel,
            dialogElement,
            chapterComplete
        ].some(isVisible);
    }

    function closeAllPanels() {
        hideElement(catalogViewer);
        hideElement(archivePanel);
        hideElement(drawerPanel);
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

        if (state.catalogRead) count += 1;
        if (state.archiveSolved) count += 1;
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
                "Dinleme odasının sırrını çözdün.",
                "Kişisel kaydı dinledin. Ezgi tanıdık geliyordu."
            );

            updateProgress();
            return;
        }

        if (!state.catalogRead) {
            setObjective(
                "Katalog defterini incele.",
                "Eski bir ses-terapi odası. Camlı bölmedeki ses yalıtımlı koltuk, bir zamanlar birinin oturtulup dinlendiğini gösteriyor. Duvardaki bobinli teyp arşivinde, cümlenin yıllar içinde denenmiş farklı biçimleri kayıtlı."
            );

            updateProgress();
            return;
        }

        if (!state.archiveSolved) {
            setObjective(
                "Beş makarayı da doğru hızda çal.",
                "Katalog defteri her kaydın hangi hızda çözüldüğünü doğrudan söylemiyor - kaydın nasıl davrandığını anlatıyor."
            );

            updateProgress();
            return;
        }

        if (!state.doorUnlocked) {
            setObjective(
                "Dip çekmeceyi aç.",
                "Beş makara da çözüldü. Rakamları makara sırasına göre çekmeceye gir."
            );

            updateProgress();
            return;
        }

        updateProgress();
    }

    /* =====================================================
       KATALOG DEFTERİ
    ===================================================== */

    function inspectCatalogLog() {
        if (!state.catalogRead) {
            state.catalogRead = true;
            saveState();
            updateObjective();

            playEffect("paperPickup");
            catalogLog?.classList.add("inspected");
        }

        showElement(catalogViewer);
    }

    function closeCatalogView() {
        hideElement(catalogViewer);
    }

    /* =====================================================
       MAKARA DOLABI (TAPE CONSOLE)
    ===================================================== */

    function inspectTapeArchive() {
        setArchiveMessage("");
        showElement(archivePanel);
    }

    function closeArchiveKeypad() {
        hideElement(archivePanel);
    }

    function setArchiveMessage(text, type = "") {
        if (!archiveMessage) {
            return;
        }

        archiveMessage.textContent = text;
        archiveMessage.classList.remove("error", "is-error", "success", "is-success");

        if (type === "error") {
            archiveMessage.classList.add("error", "is-error");
        }

        if (type === "success") {
            archiveMessage.classList.add("success", "is-success");
        }
    }

    function selectReelSpeed(reelId, speed) {
        if (state.reelSolved[reelId]) {
            return;
        }

        state.reelSelectedSpeed[reelId] = speed;

        const row = tapeRows?.querySelector(`.tape-row[data-reel="${reelId}"]`);

        row
            ?.querySelectorAll(".tape-speed-buttons button")
            .forEach(button => {
                button.classList.toggle("active", button.dataset.speed === speed);
            });
    }

    function playReel(reelId) {
        if (state.reelSolved[reelId]) {
            setArchiveMessage(`Kayıt ${reelId} zaten çözüldü.`);
            return;
        }

        const selected = state.reelSelectedSpeed[reelId];

        if (!selected) {
            setArchiveMessage("Önce bir hız seç, sonra çal.", "error");
            return;
        }

        if (selected === CORRECT_SPEED[reelId]) {
            state.reelSolved[reelId] = true;
            saveState();

            playEffect("keypadSuccess");
            markReelSolved(reelId);
            setArchiveMessage(REVEALED_LINES[reelId], "success");
            checkArchiveComplete();
            return;
        }

        state.wrongPlayAttempts += 1;
        saveState();

        playEffect("keypadError");
        setArchiveMessage(GARBLED_LINES[reelId], "error");

        if (state.wrongPlayAttempts % 4 === 0) {
            triggerLightFlicker();
        }
    }

    function markReelSolved(reelId) {
        const row = tapeRows?.querySelector(`.tape-row[data-reel="${reelId}"]`);

        row?.classList.add("solved");

        const status = row?.querySelector(".tape-status");

        if (status) {
            status.textContent = REEL_DIGITS[reelId];
        }
    }

    function checkArchiveComplete() {
        const allSolved = Object.values(state.reelSolved).every(Boolean);

        if (allSolved && !state.archiveSolved) {
            state.archiveSolved = true;
            saveState();

            tapeArchive?.classList.add("solved");
            updateObjective();

            window.setTimeout(() => {
                setArchiveMessage(
                    "Tüm kayıtlar çözüldü. Dip çekmece artık açılabilir.",
                    "success"
                );
            }, 600);
        }
    }

    /* =====================================================
       SES KONSOLU (ATMOSFER — BULMACA İÇERMİYOR)
    ===================================================== */

    function inspectDeskConsole() {
        playDialogue([
            {
                speaker: "Ses Konsolu",
                text: "Eski bir mikser masası. Kadranların çoğu paslanmış, VU metreler donmuş kalmış.",
                speed: 20
            },
            {
                speaker: "",
                text: "Bir kadranın altına, kazınmış gibi görünen küçük bir not var: “Yükseklik değil, hız gizliyor.”",
                speed: 22
            }
        ]);
    }

    /* =====================================================
       DİP ÇEKMECE — TUŞ TAKIMI
    ===================================================== */

    function openDrawerKeypad() {
        state.drawerCodeInput = [];
        updateDrawerCodeSlotsDisplay();
        setDrawerCodeMessage("");
        showElement(drawerPanel);
    }

    function closeDrawerKeypad() {
        hideElement(drawerPanel);
    }

    function updateDrawerCodeSlotsDisplay() {
        if (!drawerCodeSlots) {
            return;
        }

        const slotElements = drawerCodeSlots.querySelectorAll("span");

        slotElements.forEach((slotElement, index) => {
            const digit = state.drawerCodeInput[index];

            slotElement.textContent = digit || "_";
        });
    }

    function setDrawerCodeMessage(text, type = "") {
        if (!drawerCodeMessage) {
            return;
        }

        drawerCodeMessage.textContent = text;
        drawerCodeMessage.classList.remove("error", "is-error", "success", "is-success");

        if (type === "error") {
            drawerCodeMessage.classList.add("error", "is-error");
        }

        if (type === "success") {
            drawerCodeMessage.classList.add("success", "is-success");
        }
    }

    function pickDigit(digit) {
        if (state.drawerOpened) {
            return;
        }

        const nextIndex = state.drawerCodeInput.length;
        const expectedDigit = CORRECT_DRAWER_CODE[nextIndex];

        if (digit !== expectedDigit) {
            playEffect("keypadError");

            state.wrongDrawerAttempts += 1;
            state.drawerCodeInput = [];
            saveState();

            updateDrawerCodeSlotsDisplay();

            setDrawerCodeMessage(
                "Yanlış kod. Baştan başla.",
                "error"
            );

            if (state.wrongDrawerAttempts === 2) {
                triggerLightFlicker();
            }

            if (state.wrongDrawerAttempts >= 4) {
                triggerScare();
            }

            return;
        }

        playEffect("keypadPress");

        state.drawerCodeInput.push(digit);
        updateDrawerCodeSlotsDisplay();
        setDrawerCodeMessage("");

        if (state.drawerCodeInput.length === CORRECT_DRAWER_CODE.length) {
            completeDrawerCode();
        }
    }

    function completeDrawerCode() {
        state.drawerOpened = true;
        state.doorUnlocked = true;
        saveState();

        playEffect("keypadSuccess");
        playEffect("doorUnlock");

        dipCekmece?.classList.add("solved");
        exitDoor?.classList.add("unlocked");

        setDrawerCodeMessage("KOD DOĞRU — ÇEKMECE AÇILDI", "success");

        triggerLightFlicker();
        updateObjective();

        window.setTimeout(() => {
            hideElement(drawerPanel);

            playDialogue([
                {
                    speaker: "Dip Çekmece",
                    text: "Çekmecenin en dibinde, diğerlerinden farklı bir makara var - üzerinde resmi bir etiket yok, sadece elle yazılmış birkaç kelime: “Sadece onun için.”",
                    speed: 20
                },
                {
                    speaker: "",
                    text: "Makarayı çalıştırıyorsun. İlk saniyeler parazit - sonra bir ezgi başlıyor. Basit, tekrarlayan bir ninni.",
                    speed: 20
                },
                {
                    speaker: "",
                    text: "İlk kez duyduğun bir şey olması gerekirken, ezgiyi biliyormuşsun gibi hissediyorsun. Nereden bildiğini çıkaramıyorsun.",
                    speed: 22
                },
                {
                    speaker: "",
                    text: "Kayıt yarıda kesiliyor. Son not, aynı elle, aceleyle eklenmiş: “...eğer bunu duyuyorsan, çok geç kalmış olabiliriz.”",
                    speed: 24
                }
            ]);
        }, 950);
    }

    /* =====================================================
       DİP ÇEKMECE (HOTSPOT)
    ===================================================== */

    function inspectDipCekmece() {
        if (state.drawerOpened || state.chapterCompleted) {
            playDialogue([
                {
                    speaker: "Dip Çekmece",
                    text: "Çekmece zaten açık.",
                    speed: 20
                }
            ]);

            return;
        }

        if (!state.archiveSolved) {
            showDialogue(
                "Dip Çekmece",
                "Çekmece kilitli. Önce arşivdeki beş kaydı da doğru hızda çal."
            );

            return;
        }

        openDrawerKeypad();
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
            showDialogue(
                "Çıkış Kapısı",
                "Kapı kilitli değil ama çekmeceyi açmadan buradan gitmek istemiyorsun - kayıt yarım kaldı."
            );

            return;
        }

        completeChapter();
    }

    function completeChapter() {
        state.chapterCompleted = true;
        state.doorUnlocked = true;
        saveState();

        safeSet("chapter10Completed", true);
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
            "room11.html";

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
        if (!state.catalogRead) {
            showDialogue(
                "İpucu",
                "Katalog defterini oku - her kaydın hangi hızda çözüldüğüne dair (dolaylı) bir not var."
            );

            return;
        }

        if (!state.archiveSolved) {
            const remaining = Object.keys(state.reelSolved)
                .filter(reelId => !state.reelSolved[reelId]);

            if (remaining.length === REEL_COUNT) {
                showDialogue(
                    "İpucu",
                    "Katalog defterindeki notlar hiçbir zaman “yavaş” ya da “hızlı” kelimesini doğrudan söylemiyor - kaydın nasıl davrandığını anlatıyor. Örneğin “ancak yavaşlatılırsa anlaşılıyor” demek, o kaydı YAVAŞ hızda çalman gerektiği anlamına geliyor."
                );
            } else {
                showDialogue(
                    "İpucu",
                    `Henüz çözülmemiş kayıtlar: ${remaining.join(", ")}. Katalogdaki notu tekrar oku, hangi hızı ima ettiğine dikkat et.`
                );
            }

            return;
        }

        if (!state.doorUnlocked) {
            showDialogue(
                "İpucu",
                "Beş makaradan çıkan rakamları, makara sırasına göre (1'den 5'e) dip çekmecenin tuş takımına gir."
            );

            return;
        }

        showDialogue(
            "İpucu",
            "Çekmece açık - çıkmak için kapıya tekrar tıkla."
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
            tapeArchive,
            "Makara Dolabını İncele",
            inspectTapeArchive
        );

        registerInteraction(
            catalogLog,
            "Katalog Defterini İncele",
            inspectCatalogLog
        );

        registerInteraction(
            dipCekmece,
            "Dip Çekmeceyi İncele",
            inspectDipCekmece
        );

        registerInteraction(
            deskConsole,
            "Ses Konsolunu İncele",
            inspectDeskConsole
        );

        registerInteraction(
            exitDoor,
            "Çıkış Kapısını İncele",
            inspectExitDoor
        );

        closeCatalogViewer?.addEventListener("click", closeCatalogView);
        closeCatalogFooter?.addEventListener("click", closeCatalogView);

        closeArchivePanel?.addEventListener("click", closeArchiveKeypad);

        tapeRows?.addEventListener("click", event => {
            const speedButton = event.target.closest("button[data-speed]");

            if (speedButton) {
                const reelId = Number(speedButton.closest(".tape-row")?.dataset.reel);
                selectReelSpeed(reelId, speedButton.dataset.speed);
                return;
            }

            const playButton = event.target.closest(".tape-play-button");

            if (playButton) {
                playReel(Number(playButton.dataset.reel));
            }
        });

        closeDrawerPanel?.addEventListener("click", closeDrawerKeypad);

        drawerCodeButtons?.addEventListener("click", event => {
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

        catalogViewer?.addEventListener("click", event => {
            if (event.target === catalogViewer) {
                closeCatalogView();
            }
        });

        archivePanel?.addEventListener("click", event => {
            if (event.target === archivePanel) {
                closeArchiveKeypad();
            }
        });

        drawerPanel?.addEventListener("click", event => {
            if (event.target === drawerPanel) {
                closeDrawerKeypad();
            }
        });

        setupKeyboardInteraction();
    }

    /* =====================================================
       KAYITLI GÖRÜNÜMÜ EŞLEŞTİR
    ===================================================== */

    function restoreVisualState() {
        if (state.catalogRead) {
            catalogLog?.classList.add("inspected");
        }

        if (state.archiveSolved) {
            tapeArchive?.classList.add("solved");
        }

        for (let reelId = 1; reelId <= REEL_COUNT; reelId += 1) {
            if (state.reelSolved[reelId]) {
                markReelSolved(reelId);
            }
        }

        if (state.drawerOpened) {
            dipCekmece?.classList.add("solved");
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
        baştan itibaren aydınlık.
    */

});
