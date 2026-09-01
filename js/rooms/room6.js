"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
BÖLÜM 6 — ECZANE / İLAÇ DEPOSU

UYUMLULUK
- room6.html içindeki gerçek ID'lerle eşleşir.
- AshvaleSave kayıt sistemiyle çalışır.
- AshvaleInventory ortak envanter sistemini kullanır (bu bölümde
  toplanan bir eşya yok, envanter boş kalabilir).
- AshvaleAudio ve AshvaleDialogue varsa bunlara bağlanır.
- Bu sistemler yüklenmese bile temel bölüm akışı çalışmaya devam eder.

BULMACA
- Depo Kayıt Defteri standart üretim oranını gösterir: A:B:C = 2:5:3.
- Parti Kayıtları'nda 3 parti listelenir, her birinin kendi toplam
  hacmi var. Oyuncu, standart orana göre her partinin beklenen
  A/B/C değerlerini hesaplayıp bu değerlere uymayan (standart dışı)
  partiyi bulup üzerine tıklamalı.
- Doğru parti: 111 (toplam 30ml -> beklenen 6/15/9, kayıtlı C=10,
  yani standart dışı). Doğru seçim doğrudan depo kafesinin kilidini
  açar - room5'teki gibi ekstra bir kod girme adımı yok.
=========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       SABİTLER
    ===================================================== */

    const CHAPTER_NUMBER = 6;
    const NEXT_CHAPTER_NUMBER = 7;

    const CORRECT_BATCH = "111";

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

    const storageLog = getElement("storageLog");
    const batchRecords = getElement("batchRecords");
    const mixingBench = getElement("mixingBench");
    const securityMonitor = getElement("securityMonitor");
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
       DEPO KAYIT DEFTERİ
    ===================================================== */

    const storageLogViewer = getElement("storageLogViewer");
    const closeStorageLogViewer = getElement("closeStorageLogViewer");
    const closeStorageLogFooter = getElement("closeStorageLogFooter");

    /* =====================================================
       PARTİ KAYITLARI
    ===================================================== */

    const batchRecordsViewer = getElement("batchRecordsViewer");
    const closeBatchRecordsViewer = getElement("closeBatchRecordsViewer");
    const closeBatchRecordsFooter = getElement("closeBatchRecordsFooter");
    const batchRows = Array.from(document.querySelectorAll(".batch-row"));
    const batchMessage = getElement("batchMessage");

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
        logRead: false,
        batchOpened: false,
        batchSolved: false,
        doorUnlocked: false,
        chapterCompleted: false,
        wrongBatchAttempts: 0,
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
        state.logRead =
            safeGet("chapter6LogRead", false) === true;

        state.batchOpened =
            safeGet("chapter6BatchOpened", false) === true;

        state.batchSolved =
            safeGet("chapter6BatchSolved", false) === true;

        state.doorUnlocked =
            safeGet("chapter6DoorUnlocked", false) === true;

        state.chapterCompleted =
            safeGet("chapter6Completed", false) === true;

        state.wrongBatchAttempts =
            Number(safeGet("chapter6WrongBatchAttempts", 0)) || 0;
    }

    function saveState() {
        safeSet("chapter6LogRead", state.logRead);
        safeSet("chapter6BatchOpened", state.batchOpened);
        safeSet("chapter6BatchSolved", state.batchSolved);
        safeSet("chapter6DoorUnlocked", state.doorUnlocked);
        safeSet("chapter6Completed", state.chapterCompleted);
        safeSet("chapter6WrongBatchAttempts", state.wrongBatchAttempts);
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
                    storageKey: "chapter6Inventory",
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
                    chapter6Ambience: {
                        src: "assets/audio/ambience/chapter2_ambient.mp3",
                        type: "ambience",
                        loop: true,
                        volume: 0.55
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
                audio.playAmbience("chapter6Ambience");
            }
        } catch (error) {
            console.warn("Room6 ses sistemi başlatılamadı.", error);
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
            storageLogViewer,
            batchRecordsViewer,
            dialogElement,
            chapterComplete
        ].some(isVisible);
    }

    function closeAllPanels() {
        hideElement(storageLogViewer);
        hideElement(batchRecordsViewer);
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

        if (state.logRead) count += 1;
        if (state.batchSolved) count += 1;
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
                "Eczane deposunun kafesini açtın.",
                "Standart dışı partiyi bulup kafesin kilidini açtın. Merdivenlerin ötesinde yeni bir kat seni bekliyor."
            );

            updateProgress();
            return;
        }

        if (!state.logRead) {
            setObjective(
                "Depo kayıt defterini incele.",
                "Bodrumdaki eczane deposu, tozlu raflar ve kapalı bir kafesle çevrili. Havada keskin bir kimyasal koku var."
            );

            updateProgress();
            return;
        }

        if (!state.batchSolved) {
            setObjective(
                "Parti kayıtlarını incele, standart dışı partiyi bul.",
                "Depo kayıt defterindeki standart orana (2:5:3) göre, parti kayıtlarındaki üç partiden hangisinin bileşenleri uymuyor?"
            );

            updateProgress();
            return;
        }

        if (!state.doorUnlocked) {
            setObjective(
                "Depo kafesini aç.",
                "Standart dışı partiyi buldun. Kafesin kilidi artık açık olmalı."
            );

            updateProgress();
            return;
        }

        updateProgress();
    }

    /* =====================================================
       DEPO KAYIT DEFTERİ
    ===================================================== */

    function inspectStorageLog() {
        if (!state.logRead) {
            state.logRead = true;
            saveState();
            updateObjective();

            playEffect("paperPickup");
            storageLog?.classList.add("inspected");
        }

        showElement(storageLogViewer);
    }

    function closeStorageLogView() {
        hideElement(storageLogViewer);
    }

    /* =====================================================
       PARTİ KAYITLARI
    ===================================================== */

    function inspectBatchRecords() {
        if (!state.batchOpened) {
            state.batchOpened = true;
            saveState();
        }

        setBatchMessage("");
        showElement(batchRecordsViewer);

        if (state.batchSolved) {
            markSolvedBatchRow();
        }
    }

    function closeBatchRecordsView() {
        hideElement(batchRecordsViewer);
    }

    function setBatchMessage(text, type = "") {
        if (!batchMessage) {
            return;
        }

        batchMessage.textContent = text;
        batchMessage.classList.remove("error", "is-error", "success", "is-success");

        if (type === "error") {
            batchMessage.classList.add("error", "is-error");
        }

        if (type === "success") {
            batchMessage.classList.add("success", "is-success");
        }
    }

    function markSolvedBatchRow() {
        batchRows.forEach(row => {
            row.classList.toggle("correct", row.dataset.batch === CORRECT_BATCH);
        });

        setBatchMessage(
            `PARTİ ${CORRECT_BATCH} STANDART DIŞI — KİLİT AÇILDI`,
            "success"
        );
    }

    function handleBatchRowClick(row) {
        if (state.batchSolved) {
            return;
        }

        const isCorrect = row.dataset.correct === "true";

        if (!isCorrect) {
            playEffect("keypadError");

            state.wrongBatchAttempts += 1;
            saveState();

            row.classList.remove("wrong-flash");
            void row.offsetWidth;
            row.classList.add("wrong-flash");

            setBatchMessage(
                "Bu partinin değerleri standarda uyuyor. Tekrar hesapla.",
                "error"
            );

            if (state.wrongBatchAttempts === 2) {
                triggerLightFlicker();
            }

            if (state.wrongBatchAttempts >= 3) {
                triggerScare();
            }

            return;
        }

        playEffect("keypadSuccess");

        state.batchSolved = true;
        state.doorUnlocked = true;
        saveState();

        markSolvedBatchRow();
        batchRecords?.classList.add("solved");
        exitDoor?.classList.add("unlocked");

        triggerLightFlicker();
        updateObjective();

        window.setTimeout(() => {
            hideElement(batchRecordsViewer);

            playDialogue([
                {
                    speaker: "Parti 111",
                    text: "Kayıtlı hacim 30 ml — standart orana göre C bileşeni 9 ml olmalıydı. Ama etikette 10 ml yazıyor.",
                    speed: 20
                },
                {
                    speaker: "",
                    text: "Sandığın kapağının iç yüzüne, elle karalanmış bir not var: “Biliyorduk. Yine de gönderdik.”",
                    speed: 22
                }
            ]);
        }, 900);
    }

    /* =====================================================
       KARIŞTIRMA TEZGAHI (ATMOSFER — BULMACA İÇERMİYOR)
    ===================================================== */

    function inspectMixingBench() {
        playDialogue([
            {
                speaker: "Karıştırma Tezgahı",
                text: "Paslı bir terazi ve birkaç boş şişe. Üzerinde kuru kalmış, eski bir sıvı lekesi var.",
                speed: 20
            },
            {
                speaker: "",
                text: "Terazinin kefesi hâlâ hafif eğik duruyor - sanki son tarttığı şey hiç dengeye gelmemiş.",
                speed: 20
            }
        ]);
    }

    /* =====================================================
       GÜVENLİK MONİTÖRÜ (ATMOSFER — BULMACA İÇERMİYOR)
    ===================================================== */

    function inspectSecurityMonitor() {
        playDialogue([
            {
                speaker: "Güvenlik Monitörü",
                text: "Ekran parazitli ama tamamen kararmamış. Köşesinde donmuş bir zaman damgası yanıp sönüyor: 03:17.",
                speed: 20
            },
            {
                speaker: "",
                text: "Hastanenin her yerinde aynı saatle karşılaşıyorsun - sanki zaman bir kere kırılmış ve bir daha toparlanamamış.",
                speed: 20
            }
        ]);
    }

    /* =====================================================
       DEPO KAFESİ (ÇIKIŞ)
    ===================================================== */

    function inspectExitDoor() {
        if (state.doorUnlocked || state.chapterCompleted) {
            completeChapter();
            return;
        }

        showDialogue(
            "Depo Kafesi",
            "Ağır tel örgülü kafes kilitli. Kilit, hangi partinin standart dışı olduğunu bilen birini bekliyor gibi duruyor."
        );
    }

    function completeChapter() {
        state.chapterCompleted = true;
        state.doorUnlocked = true;
        saveState();

        safeSet("chapter6Completed", true);
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
            "room7.html";

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
        if (!state.logRead) {
            showDialogue(
                "İpucu",
                "Depo kayıt defterini oku - orada standart bir oran yazıyor."
            );

            return;
        }

        if (!state.batchSolved) {
            showDialogue(
                "İpucu",
                "Standart oran 2:5:3. Her parti kaydının kendi toplam hacmine göre beklenen A/B/C değerlerini hesapla (toplamı 10 parçaya böl, her parçayı orana göre çarp). Kayıtlı değer bu hesaba uymayan partiyi seç."
            );

            return;
        }

        showDialogue(
            "İpucu",
            "Kafesin kilidi açık - çıkmak için tekrar tıkla."
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
            storageLog,
            "Depo Kayıt Defterini İncele",
            inspectStorageLog
        );

        registerInteraction(
            batchRecords,
            "Parti Kayıtlarını İncele",
            inspectBatchRecords
        );

        registerInteraction(
            mixingBench,
            "Karıştırma Tezgahını İncele",
            inspectMixingBench
        );

        registerInteraction(
            securityMonitor,
            "Güvenlik Monitörünü İncele",
            inspectSecurityMonitor
        );

        registerInteraction(
            exitDoor,
            "Depo Kafesini İncele",
            inspectExitDoor
        );

        closeStorageLogViewer?.addEventListener("click", closeStorageLogView);
        closeStorageLogFooter?.addEventListener("click", closeStorageLogView);

        closeBatchRecordsViewer?.addEventListener("click", closeBatchRecordsView);
        closeBatchRecordsFooter?.addEventListener("click", closeBatchRecordsView);

        batchRows.forEach(row => {
            row.addEventListener("click", () => handleBatchRowClick(row));

            row.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleBatchRowClick(row);
                }
            });
        });

        hintButton?.addEventListener("click", showHint);

        dialogContinue?.addEventListener("click", nextDialogue);
        dialogClose?.addEventListener("click", hideDialogue);

        nextChapter?.addEventListener("click", goToNextChapter);
        menuButton?.addEventListener("click", returnToMenu);

        storageLogViewer?.addEventListener("click", event => {
            if (event.target === storageLogViewer) {
                closeStorageLogView();
            }
        });

        batchRecordsViewer?.addEventListener("click", event => {
            if (event.target === batchRecordsViewer) {
                closeBatchRecordsView();
            }
        });

        setupKeyboardInteraction();
    }

    /* =====================================================
       KAYITLI GÖRÜNÜMÜ EŞLEŞTİR
    ===================================================== */

    function restoreVisualState() {
        if (state.logRead) {
            storageLog?.classList.add("inspected");
        }

        if (state.batchSolved) {
            batchRecords?.classList.add("solved");
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
        Bu bölümde el feneri ve UV mekaniği kullanılmıyor - depo
        elektrikli, oda baştan itibaren normal şekilde aydınlık.
    */

});
