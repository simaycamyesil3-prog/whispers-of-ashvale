"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
BÖLÜM 12 — PERSONEL SIĞINAĞI

UYUMLULUK
- room12.html içindeki gerçek ID'lerle eşleşir.
- AshvaleSave kayıt sistemiyle çalışır.
- AshvaleInventory ortak envanter sistemini kullanır (bu bölümde
  toplanan bir eşya yok, envanter boş kalabilir).
- AshvaleAudio ve AshvaleDialogue varsa bunlara bağlanır.
- Bu sistemler yüklenmese bile temel bölüm akışı çalışmaya devam eder.

BULMACA
- Duvarda 5 yırtık not parçası var, kronolojik sırada asılı DEĞİL.
  Her parça, ne zaman yazıldığını ele veren bir zaman ifadesi
  taşıyor (başlangıçta / ilk aylarda / ikinci yılın sonunda /
  üç yıl sonra / son notum) ve kenarında tek bir rakam var.
- Masadaki günlük, notların zaman sırasına göre okunması
  gerektiğini ima ediyor (rakamları vermeden).
- Doğru kronolojik sıra: başlangıçta(3) → ilk aylarda(7) →
  ikinci yılın sonunda(9) → üç yıl sonra(2) → son notum(4).
- Kapı kilidi 5 haneli bir kombinasyon istiyor: 37924.
=========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       SABİTLER
    ===================================================== */

    const CHAPTER_NUMBER = 12;
    const NEXT_CHAPTER_NUMBER = 13;

    const CORRECT_DOOR_CODE = ["3", "7", "9", "2", "4"];

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

    const wallNotes = getElement("wallNotes");
    const deskJournal = getElement("deskJournal");
    const cabinet = getElement("cabinet");
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
       NOT / GÜNLÜK GÖRÜNTÜLEYİCİLERİ
    ===================================================== */

    const notesViewer = getElement("notesViewer");
    const closeNotesViewer = getElement("closeNotesViewer");
    const closeNotesFooter = getElement("closeNotesFooter");

    const journalViewer = getElement("journalViewer");
    const closeJournalViewer = getElement("closeJournalViewer");
    const closeJournalFooter = getElement("closeJournalFooter");

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
        notesRead: false,
        journalRead: false,
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
        state.notesRead =
            safeGet("chapter12NotesRead", false) === true;

        state.journalRead =
            safeGet("chapter12JournalRead", false) === true;

        state.doorUnlocked =
            safeGet("chapter12DoorUnlocked", false) === true;

        state.chapterCompleted =
            safeGet("chapter12Completed", false) === true;
    }

    function saveState() {
        safeSet("chapter12NotesRead", state.notesRead);
        safeSet("chapter12JournalRead", state.journalRead);
        safeSet("chapter12DoorUnlocked", state.doorUnlocked);
        safeSet("chapter12Completed", state.chapterCompleted);
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
                    storageKey: "chapter12Inventory",
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
                    chapter12Ambience: {
                        src: "assets/audio/ambience/chapter2_ambient.mp3",
                        type: "ambience",
                        loop: true,
                        volume: 0.42
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
                audio.playAmbience("chapter12Ambience");
            }
        } catch (error) {
            console.warn("Room12 ses sistemi başlatılamadı.", error);
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
            notesViewer,
            journalViewer,
            doorPanel,
            dialogElement,
            chapterComplete
        ].some(isVisible);
    }

    function closeAllPanels() {
        hideElement(notesViewer);
        hideElement(journalViewer);
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

        if (state.notesRead) count += 1;
        if (state.journalRead) count += 1;

        return count;
    }

    function updateProgress() {
        const count = getProgressCount();
        const percentage = Math.min(100, (count / 2) * 100);

        if (recordProgress) {
            recordProgress.textContent = `${count} / 2`;
        }

        if (recordProgressBar) {
            recordProgressBar.style.width = `${percentage}%`;
        }

        objectiveProgress?.classList.toggle("completed", count >= 2);
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
                "Personel sığınağının sırrını çözdün.",
                "Üçüncü yöntem bir tedavi değil - bir seçim."
            );

            updateProgress();
            return;
        }

        if (!state.notesRead) {
            setObjective(
                "Duvardaki yırtık notları incele.",
                "Her şeyin dağıldığı geceden kalma bir sığınak. Duvarda yırtık notlar, masada açık bir günlük, köşede eski bir dolap var."
            );

            updateProgress();
            return;
        }

        if (!state.journalRead) {
            setObjective(
                "Masadaki günlüğü incele.",
                "Notlar dağınık ve tarih sırasına göre asılı değil. Belki masadaki günlük bir şeyi netleştirir."
            );

            updateProgress();
            return;
        }

        if (!state.doorUnlocked) {
            setObjective(
                "Notları doğru zaman sırasına koy, rakamları kapıya gir.",
                "Notlar kronolojik sırada değil. Her birindeki zaman ifadesine dikkat etmen gerekiyor."
            );

            updateProgress();
            return;
        }

        updateProgress();
    }

    /* =====================================================
       DUVARDAKİ NOTLAR
    ===================================================== */

    function inspectWallNotes() {
        if (!state.notesRead) {
            state.notesRead = true;
            saveState();
            updateObjective();

            playEffect("paperPickup");
            wallNotes?.classList.add("inspected");
        }

        showElement(notesViewer);
    }

    function closeNotesView() {
        hideElement(notesViewer);
    }

    /* =====================================================
       MASADAKİ GÜNLÜK
    ===================================================== */

    function inspectDeskJournal() {
        if (!state.journalRead) {
            state.journalRead = true;
            saveState();
            updateObjective();

            playEffect("paperPickup");
            deskJournal?.classList.add("inspected");
        }

        showElement(journalViewer);
    }

    function closeJournalView() {
        hideElement(journalViewer);
    }

    /* =====================================================
       DOLAP (ATMOSFER)
    ===================================================== */

    function inspectCabinet() {
        playDialogue([
            {
                speaker: "Dolap",
                text: "Kavanozlarda kağıt ruloları ve kurutulmuş bitkiler var - sığınakta kalanların idare etmeye çalıştığının izleri.",
                speed: 20
            },
            {
                speaker: "",
                text: "En altta birkaç ilaç şişesi, hepsi boş. Etiketlerinden biri hâlâ okunuyor: Sessizlik Serumu.",
                speed: 22
            }
        ]);
    }

    /* =====================================================
       YATAK (ATMOSFER)
    ===================================================== */

    function inspectBed() {
        playDialogue([
            {
                speaker: "Yatak",
                text: "Demir çerçeveli, sade bir yatak. Kimse burada uzun süre kalmamış gibi - battaniyeler hâlâ katlı.",
                speed: 20
            },
            {
                speaker: "",
                text: "Yastığın yanındaki küçük sehpada bir kitap duruyor. Sığınağa gelenlerden biri, son gecesinde okumaya çalışmış gibi.",
                speed: 22
            }
        ]);
    }

    /* =====================================================
       KAPI PANELİ — TUŞ TAKIMI
    ===================================================== */

    function openDoorPanel() {
        if (!state.notesRead || !state.journalRead) {
            showDialogue(
                "Çıkış Kapısı",
                "Kilit beş haneli bir kombinasyon istiyor. Bu numarayı bulmadan denemenin anlamı yok - önce duvardaki notları ve günlüğü incele."
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
                    text: "3-7-9-2-4. Kilit açılıyor.",
                    speed: 20
                },
                {
                    speaker: "",
                    text: "Üçüncü yöntem bir tedavi değil - bir seçim. Doku büyümesini durduran şey hiçbir zaman bir ilaç olmamış; onu taşıyan kişinin, bilerek verdiği bir karardı.",
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

        safeSet("chapter12Completed", true);
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
            "room13.html";

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
        if (!state.notesRead) {
            showDialogue(
                "İpucu",
                "Duvara iğnelenmiş yırtık kağıtları oku - her biri geçmişten bir parça."
            );

            return;
        }

        if (!state.journalRead) {
            showDialogue(
                "İpucu",
                "Masadaki açık günlüğü de incele."
            );

            return;
        }

        if (!state.doorUnlocked) {
            showDialogue(
                "İpucu",
                "Notlar zaman sırasına göre asılı değil. Her birinde geçen ifadeye dikkat et: 'başlangıçta', 'ilk aylarda', 'ikinci yılın sonunda', 'üç yıl sonra', 'son notum'. Bu sırayla oku, kenarındaki rakamları aynı sırayla kapıya gir."
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
            wallNotes,
            "Duvardaki Notları İncele",
            inspectWallNotes
        );

        registerInteraction(
            deskJournal,
            "Günlüğü İncele",
            inspectDeskJournal
        );

        registerInteraction(
            cabinet,
            "Dolabı İncele",
            inspectCabinet
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

        closeNotesViewer?.addEventListener("click", closeNotesView);
        closeNotesFooter?.addEventListener("click", closeNotesView);

        closeJournalViewer?.addEventListener("click", closeJournalView);
        closeJournalFooter?.addEventListener("click", closeJournalView);

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

        notesViewer?.addEventListener("click", event => {
            if (event.target === notesViewer) {
                closeNotesView();
            }
        });

        journalViewer?.addEventListener("click", event => {
            if (event.target === journalViewer) {
                closeJournalView();
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
        if (state.notesRead) {
            wallNotes?.classList.add("inspected");
        }

        if (state.journalRead) {
            deskJournal?.classList.add("inspected");
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
