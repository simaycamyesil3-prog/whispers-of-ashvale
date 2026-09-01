"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
BÖLÜM 8 — BAŞ HEKİM OFİSİ (DÖNÜM NOKTASI)

UYUMLULUK
- room8.html içindeki gerçek ID'lerle eşleşir.
- AshvaleSave kayıt sistemiyle çalışır.
- AshvaleInventory ortak envanter sistemini kullanır (bu bölümde
  toplanan bir eşya yok, envanter boş kalabilir).
- AshvaleAudio ve AshvaleDialogue varsa bunlara bağlanır.
- Bu sistemler yüklenmese bile temel bölüm akışı çalışmaya devam eder.

BULMACA
- Günlükte 8 vaka dosyası var (#journal içindeki .case-file'lar).
  7 tanesi gerçek - fenomenin hallmark'ı olan "göğüste doku / fısıltı"
  detayını içeriyor. 1 tanesi (2007-065, kalp yetmezliği) tamamen
  alakasız bir dosya - decoy.
- Dosyalar HTML'de KARIŞIK sırada listelenmiş (tarihe göre değil).
  Oyuncu gerçek 7 dosyayı bulup en eskiden en yeniye sıralamalı,
  sonra her birinin dosya numarasının SON rakamını bu sırayla
  kasadaki 7 haneli tuş takımına girmeli.
- Doğru sıralama (tarih): 1987-033, 1991-111, 1996-087, 2003-029,
  2011-042, 2015-104, 2019-018 -> son rakamlar: 3,1,7,9,2,4,8
  Kasa kodu: 3179248 (ilk dört rakam kasıtlı olarak "3179" - oyuncu
  fark ederse güzel bir "aha" anı olsun diye).
=========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       SABİTLER
    ===================================================== */

    const CHAPTER_NUMBER = 8;
    const NEXT_CHAPTER_NUMBER = 9;

    const CORRECT_SAFE_CODE = ["3", "1", "7", "9", "2", "4", "8"];

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

    const journal = getElement("journal");
    const safe = getElement("safe");
    const portrait = getElement("portrait");
    const bookshelf = getElement("bookshelf");
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
       GÜNLÜK / VAKA ARŞİVİ
    ===================================================== */

    const journalViewer = getElement("journalViewer");
    const closeJournalViewer = getElement("closeJournalViewer");
    const closeJournalFooter = getElement("closeJournalFooter");

    /* =====================================================
       KASA
    ===================================================== */

    const safePanel = getElement("safePanel");
    const closeSafePanel = getElement("closeSafePanel");
    const safeCodeSlots = getElement("safeCodeSlots");
    const safeCodeButtons = getElement("safeCodeButtons");
    const safeCodeMessage = getElement("safeCodeMessage");

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
        journalRead: false,
        safeCodeInput: [],
        safeSolved: false,
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
        state.journalRead =
            safeGet("chapter8JournalRead", false) === true;

        state.safeSolved =
            safeGet("chapter8SafeSolved", false) === true;

        state.doorUnlocked =
            safeGet("chapter8DoorUnlocked", false) === true;

        state.chapterCompleted =
            safeGet("chapter8Completed", false) === true;

        state.wrongCodeAttempts =
            Number(safeGet("chapter8WrongCodeAttempts", 0)) || 0;
    }

    function saveState() {
        safeSet("chapter8JournalRead", state.journalRead);
        safeSet("chapter8SafeSolved", state.safeSolved);
        safeSet("chapter8DoorUnlocked", state.doorUnlocked);
        safeSet("chapter8Completed", state.chapterCompleted);
        safeSet("chapter8WrongCodeAttempts", state.wrongCodeAttempts);
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
                    storageKey: "chapter8Inventory",
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
                    chapter8Ambience: {
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
                audio.playAmbience("chapter8Ambience");
            }
        } catch (error) {
            console.warn("Room8 ses sistemi başlatılamadı.", error);
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
            journalViewer,
            safePanel,
            dialogElement,
            chapterComplete
        ].some(isVisible);
    }

    function closeAllPanels() {
        hideElement(journalViewer);
        hideElement(safePanel);
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

        if (state.journalRead) count += 1;
        if (state.safeSolved) count += 1;
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
                "Baş hekim ofisinin sırrını çözdün.",
                "Kasadaki son emri okudun. Kapının ardında yeni bir kat seni bekliyor."
            );

            updateProgress();
            return;
        }

        if (!state.journalRead) {
            setObjective(
                "Baş hekimin günlüğünü incele.",
                "Baş hekimin ofisi, hastanenin geri kalanından tuhaf bir şekilde bakımlı. Masada açık bir günlük, duvarda kilitli bir kasa var."
            );

            updateProgress();
            return;
        }

        if (!state.safeSolved) {
            setObjective(
                "Kasanın kodunu çöz.",
                "Sekiz dosyadan yedisi gerçek, biri alakasız. Gerçekleri tarih sırasına diz, dosya numaralarının son rakamlarını sırayla kasaya gir."
            );

            updateProgress();
            return;
        }

        if (!state.doorUnlocked) {
            setObjective(
                "Ofis kapısını aç.",
                "Kasanın kilidi açıldı."
            );

            updateProgress();
            return;
        }

        updateProgress();
    }

    /* =====================================================
       GÜNLÜK / VAKA ARŞİVİ
    ===================================================== */

    function inspectJournal() {
        if (!state.journalRead) {
            state.journalRead = true;
            saveState();
            updateObjective();

            playEffect("paperPickup");
            journal?.classList.add("inspected");
        }

        showElement(journalViewer);
    }

    function closeJournalView() {
        hideElement(journalViewer);
    }

    /* =====================================================
       DİPLOMA DUVARI (ATMOSFER — BULMACA İÇERMİYOR)
    ===================================================== */

    function inspectPortrait() {
        playDialogue([
            {
                speaker: "Diploma Duvarı",
                text: "Duvarda başhekimin diploma ve sertifikaları asılı. En eskisi 1979 tarihli. Yanında küçük, siyah beyaz bir fotoğraf - resmi bir tören görüntüsü.",
                speed: 20
            },
            {
                speaker: "",
                text: "Fotoğraftaki yüzlerden biri, nedenini bilemediğin bir şekilde tanıdık geliyor. Gözlerini kaçırıyorsun.",
                speed: 22
            }
        ]);
    }

    /* =====================================================
       DOSYA RAFI (ATMOSFER — BULMACA İÇERMİYOR)
    ===================================================== */

    function inspectBookshelf() {
        playDialogue([
            {
                speaker: "Dosya Rafı",
                text: "Rafların çoğu tıka basa dolu - hasta dosyaları, eski protokoller, yıllık raporlar. Bazı ciltler yere düşmüş, sayfaları dağılmış.",
                speed: 20
            },
            {
                speaker: "",
                text: "Bir dosyanın sırtında el yazısıyla tek kelime var: “DURDURULAMADI.”",
                speed: 22
            }
        ]);
    }

    /* =====================================================
       KASA TUŞ TAKIMI
    ===================================================== */

    function openSafeKeypad() {
        state.safeCodeInput = [];
        updateCodeSlotsDisplay();
        setSafeCodeMessage("");
        showElement(safePanel);
    }

    function closeSafe() {
        hideElement(safePanel);
    }

    function updateCodeSlotsDisplay() {
        if (!safeCodeSlots) {
            return;
        }

        const slotElements = safeCodeSlots.querySelectorAll("span");

        slotElements.forEach((slotElement, index) => {
            const digit = state.safeCodeInput[index];

            slotElement.textContent = digit || "_";
        });
    }

    function setSafeCodeMessage(text, type = "") {
        if (!safeCodeMessage) {
            return;
        }

        safeCodeMessage.textContent = text;
        safeCodeMessage.classList.remove("error", "is-error", "success", "is-success");

        if (type === "error") {
            safeCodeMessage.classList.add("error", "is-error");
        }

        if (type === "success") {
            safeCodeMessage.classList.add("success", "is-success");
        }
    }

    function pickDigit(digit) {
        if (state.safeSolved) {
            return;
        }

        const nextIndex = state.safeCodeInput.length;
        const expectedDigit = CORRECT_SAFE_CODE[nextIndex];

        if (digit !== expectedDigit) {
            playEffect("keypadError");

            state.wrongCodeAttempts += 1;
            state.safeCodeInput = [];
            saveState();

            updateCodeSlotsDisplay();

            setSafeCodeMessage(
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

        state.safeCodeInput.push(digit);
        updateCodeSlotsDisplay();
        setSafeCodeMessage("");

        if (state.safeCodeInput.length === CORRECT_SAFE_CODE.length) {
            completeSafeCode();
        }
    }

    function completeSafeCode() {
        state.safeSolved = true;
        state.doorUnlocked = true;
        saveState();

        playEffect("keypadSuccess");
        playEffect("doorUnlock");

        safe?.classList.add("solved");
        exitDoor?.classList.add("unlocked");

        setSafeCodeMessage("KOD DOĞRU — KASA AÇILDI", "success");

        triggerLightFlicker();
        updateObjective();

        window.setTimeout(() => {
            hideElement(safePanel);

            playDialogue([
                {
                    speaker: "Kasa",
                    text: "İçeride tek bir klasör var. Üstünde kırmızı bir damga: “PROGRAM SONLANDIRILACAK.”",
                    speed: 20
                },
                {
                    speaker: "",
                    text: "Emir kısa: “Bu gece, Denek 3179 için işlem durdurulacak. Serum ve cerrahi girişim başarısız oldu - üçüncü bir yöntem denenmeyecek.”",
                    speed: 20
                },
                {
                    speaker: "",
                    text: "Klasörün en altında, farklı bir el yazısıyla, aceleyle eklenmiş tek bir cümle var: “Denenmeyecek değil - denenemedi. Vakit yoktu.”",
                    speed: 22
                },
                {
                    speaker: "",
                    text: "Sayfanın kenarına, başka bir notla: “3179 bir isim değil. Aynı rolü oynayan yedi farklı insan. Sekizincisi kim olacak?”",
                    speed: 24
                }
            ]);
        }, 950);
    }

    /* =====================================================
       KASA (HOTSPOT)
    ===================================================== */

    function inspectSafe() {
        if (state.safeSolved || state.chapterCompleted) {
            playDialogue([
                {
                    speaker: "Kasa",
                    text: "Kasa zaten açık.",
                    speed: 20
                }
            ]);

            return;
        }

        openSafeKeypad();
    }

    /* =====================================================
       OFİS KAPISI (ÇIKIŞ)
    ===================================================== */

    function inspectExitDoor() {
        if (state.chapterCompleted) {
            completeChapter();
            return;
        }

        if (!state.doorUnlocked) {
            showDialogue(
                "Ofis Kapısı",
                "Kapı kilitli değil ama sanki bir şey seni içeride tutuyor - kasayı açmadan gitmek istemiyorsun."
            );

            return;
        }

        completeChapter();
    }

    function completeChapter() {
        state.chapterCompleted = true;
        state.doorUnlocked = true;
        saveState();

        safeSet("chapter8Completed", true);
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
            "room9.html";

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
        if (!state.journalRead) {
            showDialogue(
                "İpucu",
                "Baş hekimin günlüğünü ve vaka dosyalarını oku."
            );

            return;
        }

        if (!state.safeSolved) {
            showDialogue(
                "İpucu",
                "Dosyalardan biri bu fenomenle ilgisiz - göğüs dokusundan, fısıltıdan hiç bahsetmiyor. Onu ayıkla. Kalan yedi dosyayı tarihe göre en eskiden en yeniye sırala, her birinin dosya numarasının SON rakamını bu sırayla kasaya gir."
            );

            return;
        }

        if (!state.doorUnlocked) {
            showDialogue(
                "İpucu",
                "Kasa açık - kapıya dön."
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
            journal,
            "Baş Hekimin Günlüğünü İncele",
            inspectJournal
        );

        registerInteraction(
            safe,
            "Kasayı İncele",
            inspectSafe
        );

        registerInteraction(
            portrait,
            "Diploma Duvarını İncele",
            inspectPortrait
        );

        registerInteraction(
            bookshelf,
            "Dosya Rafını İncele",
            inspectBookshelf
        );

        registerInteraction(
            exitDoor,
            "Ofis Kapısını İncele",
            inspectExitDoor
        );

        closeJournalViewer?.addEventListener("click", closeJournalView);
        closeJournalFooter?.addEventListener("click", closeJournalView);

        closeSafePanel?.addEventListener("click", closeSafe);

        safeCodeButtons?.addEventListener("click", event => {
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

        journalViewer?.addEventListener("click", event => {
            if (event.target === journalViewer) {
                closeJournalView();
            }
        });

        safePanel?.addEventListener("click", event => {
            if (event.target === safePanel) {
                closeSafe();
            }
        });

        setupKeyboardInteraction();
    }

    /* =====================================================
       KAYITLI GÖRÜNÜMÜ EŞLEŞTİR
    ===================================================== */

    function restoreVisualState() {
        if (state.journalRead) {
            journal?.classList.add("inspected");
        }

        if (state.safeSolved) {
            safe?.classList.add("solved");
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
        Bu bölümde el feneri ve UV mekaniği kullanılmıyor - ofis
        elektrikli, oda baştan itibaren aydınlık.
    */

});
