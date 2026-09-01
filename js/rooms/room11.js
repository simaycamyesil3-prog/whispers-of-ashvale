"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
BÖLÜM 11 — PEDİATRİ KOĞUŞU (KAPATILMIŞ ÇOCUK SERVİSİ)

UYUMLULUK
- room11.html içindeki gerçek ID'lerle eşleşir.
- AshvaleSave kayıt sistemiyle çalışır.
- AshvaleInventory ortak envanter sistemini kullanır (bu bölümde
  toplanan bir eşya yok, envanter boş kalabilir).
- AshvaleAudio ve AshvaleDialogue varsa bunlara bağlanır.
- Bu sistemler yüklenmese bile temel bölüm akışı çalışmaya devam eder.

BULMACA
- Büyüme çizelgesinde 5 çocuğun adı, yılı, boyu ve hasta numarası
  yazılı: ELİF K., DENİZ Y., KEREM T., ASLI M., MERT B.
- Oyuncak rafında 5 oyuncak var, 4'ünün etiketinde isim yazılı
  (ELİF, DENİZ, KEREM, MERT) - biri (oturan bez bebek) etiketsiz.
- Dosya dolabında 4 kapanış kartı var (ELİF, DENİZ, KEREM, MERT
  için TABURCU/NAKİL kayıtları) - ASLI M. için hiç kart yok.
- Oyuncunun bu üç kaynağı çapraz karşılaştırıp, adı çizelgede
  geçen ama ne oyuncak etiketinde ne de dosya dolabında görünmeyen
  ismin (ASLI M.) eksik dosya olduğunu bulması gerekiyor.
- Kapı kilidi 4 haneli bir kombinasyon istiyor: Aslı'nın büyüme
  çizelgesindeki hasta numarası - "4271".
=========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       SABİTLER
    ===================================================== */

    const CHAPTER_NUMBER = 11;
    const NEXT_CHAPTER_NUMBER = 12;

    const CORRECT_DOOR_CODE = ["4", "2", "7", "1"];

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

    const growthChart = getElement("growthChart");
    const toyShelf = getElement("toyShelf");
    const recordCabinet = getElement("recordCabinet");
    const bed = getElement("bed");
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
       BÜYÜME ÇİZELGESİ / OYUNCAK RAFI / DOSYA DOLABI
    ===================================================== */

    const chartViewer = getElement("chartViewer");
    const closeChartViewer = getElement("closeChartViewer");
    const closeChartFooter = getElement("closeChartFooter");

    const toyViewer = getElement("toyViewer");
    const closeToyViewer = getElement("closeToyViewer");
    const closeToyFooter = getElement("closeToyFooter");

    const cabinetViewer = getElement("cabinetViewer");
    const closeCabinetViewer = getElement("closeCabinetViewer");
    const closeCabinetFooter = getElement("closeCabinetFooter");

    /* =====================================================
       KAPI PANELİ
    ===================================================== */

    const doorPanel = getElement("doorPanel");
    const closeDoorPanel = getElement("closeDoorPanel");
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
        chartRead: false,
        toysRead: false,
        recordsRead: false,
        doorCodeInput: [],
        doorUnlocked: false,
        chapterCompleted: false,
        wrongDoorAttempts: 0,
        modalOpen: false,
        activeHotspot: null,
        playerName: "Oyuncu",
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
        state.chartRead =
            safeGet("chapter11ChartRead", false) === true;

        state.toysRead =
            safeGet("chapter11ToysRead", false) === true;

        state.recordsRead =
            safeGet("chapter11RecordsRead", false) === true;

        state.doorUnlocked =
            safeGet("chapter11DoorUnlocked", false) === true;

        state.chapterCompleted =
            safeGet("chapter11Completed", false) === true;
    }

    function saveState() {
        safeSet("chapter11ChartRead", state.chartRead);
        safeSet("chapter11ToysRead", state.toysRead);
        safeSet("chapter11RecordsRead", state.recordsRead);
        safeSet("chapter11DoorUnlocked", state.doorUnlocked);
        safeSet("chapter11Completed", state.chapterCompleted);
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
                    storageKey: "chapter11Inventory",
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
                    chapter11Ambience: {
                        src: "assets/audio/ambience/chapter2_ambient.mp3",
                        type: "ambience",
                        loop: true,
                        volume: 0.44
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
                audio.playAmbience("chapter11Ambience");
            }
        } catch (error) {
            console.warn("Room11 ses sistemi başlatılamadı.", error);
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
            chartViewer,
            toyViewer,
            cabinetViewer,
            doorPanel,
            dialogElement,
            chapterComplete
        ].some(isVisible);
    }

    function closeAllPanels() {
        hideElement(chartViewer);
        hideElement(toyViewer);
        hideElement(cabinetViewer);
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

        if (state.chartRead) count += 1;
        if (state.toysRead) count += 1;
        if (state.recordsRead) count += 1;

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
                "Pediatri koğuşunun sırrını çözdün.",
                "Aslı M.'nin dosyası hiç kapanmamış."
            );

            updateProgress();
            return;
        }

        if (!state.chartRead) {
            setObjective(
                "Büyüme çizelgesini incele.",
                "Kapatılmış bir çocuk servisi. Duvarda bir büyüme çizelgesi, köşede bir oyuncak rafı, yanında dosyalarla dolu bir dolap var."
            );

            updateProgress();
            return;
        }

        if (!state.toysRead || !state.recordsRead) {
            setObjective(
                "Oyuncak rafını ve dosya dolabını incele.",
                "Çizelgedeki beş isimden hangisinin eksik kaldığını bulmak için diğer kayıtlarla karşılaştırman gerekiyor."
            );

            updateProgress();
            return;
        }

        if (!state.doorUnlocked) {
            setObjective(
                "Eksik dosyanın sahibini bul, hasta numarasını kapıya gir.",
                "Üç kaynağı karşılaştırdın. Adı çizelgede geçen ama ne etikette ne dosyada görünmeyen tek bir isim var."
            );

            updateProgress();
            return;
        }

        updateProgress();
    }

    /* =====================================================
       BÜYÜME ÇİZELGESİ
    ===================================================== */

    function inspectGrowthChart() {
        if (!state.chartRead) {
            state.chartRead = true;
            saveState();
            updateObjective();

            playEffect("paperPickup");
            growthChart?.classList.add("inspected");
        }

        showElement(chartViewer);
    }

    function closeChartView() {
        hideElement(chartViewer);
    }

    /* =====================================================
       OYUNCAK RAFI
    ===================================================== */

    function inspectToyShelf() {
        if (!state.toysRead) {
            state.toysRead = true;
            saveState();
            updateObjective();

            playEffect("paperPickup");
            toyShelf?.classList.add("inspected");
        }

        showElement(toyViewer);
    }

    function closeToyView() {
        hideElement(toyViewer);
    }

    /* =====================================================
       DOSYA DOLABI
    ===================================================== */

    function inspectRecordCabinet() {
        if (!state.recordsRead) {
            state.recordsRead = true;
            saveState();
            updateObjective();

            playEffect("paperPickup");
            recordCabinet?.classList.add("inspected");
        }

        showElement(cabinetViewer);
    }

    function closeCabinetView() {
        hideElement(cabinetViewer);
    }

    /* =====================================================
       YATAK (ATMOSFER — YIRTIK FOTOĞRAF)
    ===================================================== */

    function inspectBed() {
        playDialogue([
            {
                speaker: "Yatak",
                text: "Küçük bir yatak, hâlâ toplanmamış. Üzerinde eski bir oyuncak ayı duruyor - sanki sahibi az önce kalkmış gibi.",
                speed: 20
            },
            {
                speaker: "",
                text: "Yastığın altında yarısı yırtılmış bir fotoğraf var. Kalan yarısında bir çocuğun gülümsemesi ve arkasında tek bir tarih: 1991.",
                speed: 22
            },
            {
                speaker: "",
                text: "O tarihte kendi yaşını hesaplıyorsun - ve rahatsız edici bir şekilde örtüştüğünü fark ediyorsun. Bunun bir tesadüf olup olmadığından emin değilsin.",
                speed: 24
            }
        ]);
    }

    /* =====================================================
       KAPI PANELİ — TUŞ TAKIMI
    ===================================================== */

    function openDoorPanel() {
        if (!state.chartRead || !state.toysRead || !state.recordsRead) {
            showDialogue(
                "Çıkış Kapısı",
                "Kilit dört haneli bir kombinasyon istiyor. Bu numarayı bulmadan denemenin anlamı yok - önce çizelgeyi, rafı ve dolabı incele."
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

            playDialogue([
                {
                    speaker: "Kilit",
                    text: "4271. Aslı M.'nin hasta numarası. Kilit açılıyor.",
                    speed: 20
                },
                {
                    speaker: "",
                    text: "Ama içinde bir rahatsızlık var - dosyası neden hiç kapanmamış, kimse neden bunu fark etmemiş?",
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

        safeSet("chapter11Completed", true);
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
            "room12.html";

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
        if (!state.chartRead) {
            showDialogue(
                "İpucu",
                "Duvardaki büyüme çizelgesini oku - servisteki beş çocuğun adı, tarihi ve hasta numarası orada."
            );

            return;
        }

        if (!state.toysRead || !state.recordsRead) {
            showDialogue(
                "İpucu",
                "Oyuncak rafındaki etiketleri ve dosya dolabındaki kapanış kartlarını incele. Her ikisinde de bir isim eksik olacak - aynı isim mi, dikkat et."
            );

            return;
        }

        if (!state.doorUnlocked) {
            showDialogue(
                "İpucu",
                "Çizelgedeki beş isimden biri - ASLI M. - ne oyuncak etiketinde ne dosya dolabında geçiyor. Onun hasta numarasını çizelgeden tekrar oku ve kapıya gir."
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
            growthChart,
            "Büyüme Çizelgesini İncele",
            inspectGrowthChart
        );

        registerInteraction(
            toyShelf,
            "Oyuncak Rafını İncele",
            inspectToyShelf
        );

        registerInteraction(
            recordCabinet,
            "Dosya Dolabını İncele",
            inspectRecordCabinet
        );

        registerInteraction(
            bed,
            "Yatağı İncele",
            inspectBed
        );

        registerInteraction(
            exitDoor,
            "Çıkış Kapısını İncele",
            inspectExitDoor
        );

        closeChartViewer?.addEventListener("click", closeChartView);
        closeChartFooter?.addEventListener("click", closeChartView);

        closeToyViewer?.addEventListener("click", closeToyView);
        closeToyFooter?.addEventListener("click", closeToyView);

        closeCabinetViewer?.addEventListener("click", closeCabinetView);
        closeCabinetFooter?.addEventListener("click", closeCabinetView);

        closeDoorPanel?.addEventListener("click", closeDoorPanel_handler);

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

        chartViewer?.addEventListener("click", event => {
            if (event.target === chartViewer) {
                closeChartView();
            }
        });

        toyViewer?.addEventListener("click", event => {
            if (event.target === toyViewer) {
                closeToyView();
            }
        });

        cabinetViewer?.addEventListener("click", event => {
            if (event.target === cabinetViewer) {
                closeCabinetView();
            }
        });

        doorPanel?.addEventListener("click", event => {
            if (event.target === doorPanel) {
                closeDoorPanel_handler();
            }
        });

        setupKeyboardInteraction();
    }

    function closeDoorPanel_handler() {
        hideElement(doorPanel);
    }

    /* =====================================================
       KAYITLI GÖRÜNÜMÜ EŞLEŞTİR
    ===================================================== */

    function restoreVisualState() {
        if (state.chartRead) {
            growthChart?.classList.add("inspected");
        }

        if (state.toysRead) {
            toyShelf?.classList.add("inspected");
        }

        if (state.recordsRead) {
            recordCabinet?.classList.add("inspected");
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
        baştan itibaren aydınlık (tavandaki tek ampul dışında).
    */

});
