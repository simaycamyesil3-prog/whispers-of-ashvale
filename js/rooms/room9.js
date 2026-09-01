"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
BÖLÜM 9 — İZOLASYON KOĞUŞU

UYUMLULUK
- room9.html içindeki gerçek ID'lerle eşleşir.
- AshvaleSave kayıt sistemiyle çalışır.
- AshvaleInventory ortak envanter sistemini kullanır (bu bölümde
  toplanan bir eşya yok, envanter boş kalabilir).
- AshvaleAudio ve AshvaleDialogue varsa bunlara bağlanır.
- Bu sistemler yüklenmese bile temel bölüm akışı çalışmaya devam eder.

BULMACA
- Üç ayrı obje (kısıtlama yatağı, duvar çizikleri, gözlem çizelgesi)
  her biri İKİ haneli bir kod PARÇASI ve yanında ufak bir SIRA
  işareti (1/2/3) veriyor:
    - Gözlem çizelgesi (kesilen SEANS 09 kaydı, işaret "1")  -> "09"
    - Duvar çizikleri (kazınmış "26", işaret "2")            -> "26"
    - Kısıtlama yatağı (bileklikteki "ODA 15", işaret "3")   -> "15"
  Doğru sıra 1-2-3 olduğu için nihai 6 haneli kod: 09 26 15
  -> ["0","9","2","6","1","5"]
- Zorluk katmanı: çıkış kapısındaki tuş takımı ZAMANLI. Panel
  açılır açılmaz 75 saniyelik geri sayım başlıyor; yanlış rakam
  girmek süreden 8 saniye daha götürüyor. Süre dolarsa panel
  zorla kapanıyor, bir korku anı tetikleniyor ama kalıcı bir ceza
  yok - oyuncu ipuçlarını tazeleyip tekrar deneyebilir. Bu yüzden
  oyuncunun üç parçayı da paneli açmadan ÖNCE toplayıp ezberlemesi
  gerekiyor - "daha fazla düşünmek gerektiren" bulmaca isteğine
  uygun bir katman.
- Duvar çizikleri, kayıtlı oyuncu adını (varsa) doğrudan kullanıyor
  - HİKAYE.md'nin "Bırakılan iz: Hastane oyuncuyu bir yabancı gibi
  değil, tanıdığı biri gibi karşılıyor" notuna sadık.
=========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       SABİTLER
    ===================================================== */

    const CHAPTER_NUMBER = 9;
    const NEXT_CHAPTER_NUMBER = 10;

    const CORRECT_DOOR_CODE = ["0", "9", "2", "6", "1", "5"];
    const DOOR_TIME_LIMIT_SECONDS = 75;
    const WRONG_DIGIT_PENALTY_SECONDS = 8;
    const URGENT_THRESHOLD_SECONDS = 20;

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

    const restraintBed = getElement("restraintBed");
    const wallScratches = getElement("wallScratches");
    const observationChart = getElement("observationChart");
    const medicineCart = getElement("medicineCart");
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
       GÖZLEM ÇİZELGESİ
    ===================================================== */

    const chartViewer = getElement("chartViewer");
    const closeChartViewer = getElement("closeChartViewer");
    const closeChartFooter = getElement("closeChartFooter");

    /* =====================================================
       ZİNCİRLİ KAPI PANELİ
    ===================================================== */

    const doorPanel = getElement("doorPanel");
    const closeDoorPanel = getElement("closeDoorPanel");
    const doorCodeSlots = getElement("doorCodeSlots");
    const doorCodeButtons = getElement("doorCodeButtons");
    const doorCodeMessage = getElement("doorCodeMessage");
    const doorTimerFill = getElement("doorTimerFill");
    const doorTimerText = getElement("doorTimerText");

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
        wallInspected: false,
        bedInspected: false,
        doorCodeInput: [],
        doorUnlocked: false,
        chapterCompleted: false,
        wrongCodeAttempts: 0,
        doorTimeouts: 0,
        doorTimerId: null,
        doorTimerRemaining: DOOR_TIME_LIMIT_SECONDS,
        modalOpen: false,
        activeHotspot: null,
        dialogueQueue: [],
        dialogueIndex: 0,
        playerName: "Oyuncu"
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
            safeGet("chapter9ChartRead", false) === true;

        state.wallInspected =
            safeGet("chapter9WallInspected", false) === true;

        state.bedInspected =
            safeGet("chapter9BedInspected", false) === true;

        state.doorUnlocked =
            safeGet("chapter9DoorUnlocked", false) === true;

        state.chapterCompleted =
            safeGet("chapter9Completed", false) === true;

        state.wrongCodeAttempts =
            Number(safeGet("chapter9WrongCodeAttempts", 0)) || 0;

        state.doorTimeouts =
            Number(safeGet("chapter9DoorTimeouts", 0)) || 0;
    }

    function saveState() {
        safeSet("chapter9ChartRead", state.chartRead);
        safeSet("chapter9WallInspected", state.wallInspected);
        safeSet("chapter9BedInspected", state.bedInspected);
        safeSet("chapter9DoorUnlocked", state.doorUnlocked);
        safeSet("chapter9Completed", state.chapterCompleted);
        safeSet("chapter9WrongCodeAttempts", state.wrongCodeAttempts);
        safeSet("chapter9DoorTimeouts", state.doorTimeouts);
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
                    storageKey: "chapter9Inventory",
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
                    chapter9Ambience: {
                        src: "assets/audio/ambience/chapter2_ambient.mp3",
                        type: "ambience",
                        loop: true,
                        volume: 0.52
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
                        volume: 0.78
                    }
                }
            });

            if (typeof audio.playAmbience === "function") {
                audio.playAmbience("chapter9Ambience");
            }
        } catch (error) {
            console.warn("Room9 ses sistemi başlatılamadı.", error);
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
            doorPanel,
            dialogElement,
            chapterComplete
        ].some(isVisible);
    }

    function closeAllPanels() {
        hideElement(chartViewer);
        stopDoorTimer();
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
        if (state.wallInspected) count += 1;
        if (state.bedInspected) count += 1;
        if (state.doorUnlocked) count += 1;

        return count;
    }

    function updateProgress() {
        const count = getProgressCount();
        const percentage = Math.min(100, (count / 4) * 100);

        if (recordProgress) {
            recordProgress.textContent = `${count} / 4`;
        }

        if (recordProgressBar) {
            recordProgressBar.style.width = `${percentage}%`;
        }

        objectiveProgress?.classList.toggle("completed", count >= 4);
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
                "İzolasyon koğuşunun sırrını çözdün.",
                "Zincir çözüldü. Koridorun ucunda, daha önce hiç görmediğin bir ışık var."
            );

            updateProgress();
            return;
        }

        if (!state.chartRead) {
            setObjective(
                "Gözlem çizelgesini incele.",
                "İzolasyon koğuşu, hastanenin en dip, en izole kanadı. Kısıtlama yatağının kayışları içeriden yırtılmış. Duvarda tuhaf çizikler, ayakucunda bir gözlem çizelgesi var."
            );

            updateProgress();
            return;
        }

        if (!state.wallInspected) {
            setObjective(
                "Duvardaki çizikleri incele.",
                "Çizelgedeki son kayıt yarıda kesilmiş - yanında ufak bir sıra işareti var."
            );

            updateProgress();
            return;
        }

        if (!state.bedInspected) {
            setObjective(
                "Kısıtlama yatağını incele.",
                "Duvardaki çizikler seni rahatsız etti. Yatakta da bir iz olmalı."
            );

            updateProgress();
            return;
        }

        if (!state.doorUnlocked) {
            setObjective(
                "Zincirli kapıyı aç - vaktin sınırlı olacak.",
                "Üç izi de buldun. Tuş takımını açmadan önce sırayı ve rakamları aklında tut - zincir seni beklemiyor."
            );

            updateProgress();
            return;
        }

        updateProgress();
    }

    /* =====================================================
       GÖZLEM ÇİZELGESİ (BULMACA PARÇASI 1 — SIRA "1")
    ===================================================== */

    function inspectObservationChart() {
        if (!state.chartRead) {
            state.chartRead = true;
            saveState();
            updateObjective();

            playEffect("paperPickup");
            observationChart?.classList.add("inspected");
        }

        showElement(chartViewer);
    }

    function closeChartView() {
        hideElement(chartViewer);
    }

    /* =====================================================
       DUVAR ÇİZİKLERİ (BULMACA PARÇASI 2 — SIRA "2")
       Kayıtlı oyuncu adı varsa doğrudan kullanılıyor.
    ===================================================== */

    function inspectWallScratches() {
        const hasCustomName =
            state.playerName &&
            state.playerName.trim() !== "" &&
            state.playerName !== "Oyuncu";

        const firstLine = hasCustomName
            ? `Duvarda, tırnakla kazınmış harfler bir isim gibi diziliyor: “${state.playerName}”. Yanlış okuduğunu düşünüp bir daha bakıyorsun. Değişmiyor.`
            : "Duvarda, tırnakla kazınmış harfler bir isim gibi diziliyor - kendi ismine ne kadar benzediğini fark edince tüylerin diken diken oluyor.";

        playDialogue([
            {
                speaker: "Duvar",
                text: firstLine,
                speed: 22
            },
            {
                speaker: "",
                text: "İsim tek seferde değil, üst üste defalarca kazınmış - biri yazmaktan vazgeçip yeniden başlamış, sonra yine yazmış gibi.",
                speed: 20
            },
            {
                speaker: "",
                text: "Altında, daha kaba çizgilerle iki rakam var: “26”. Yanında, aceleyle çizilmiş iki kısa çentik - bir sıra işareti gibi duruyor: “2”.",
                speed: 22
            }
        ]);

        if (!state.wallInspected) {
            state.wallInspected = true;
            saveState();
            updateObjective();
            wallScratches?.classList.add("inspected");
        }
    }

    /* =====================================================
       KISITLAMA YATAĞI (BULMACA PARÇASI 3 — SIRA "3")
    ===================================================== */

    function inspectRestraintBed() {
        playDialogue([
            {
                speaker: "Kısıtlama Yatağı",
                text: "Deri kayışlar hâlâ tokalı ama ikisi de ortadan yırtılmış - dışarıdan açılmamışlar. Biri bunları içeriden koparmış.",
                speed: 20
            },
            {
                speaker: "",
                text: "Yatağın kenarında plastik bir bileklik asılı kalmış. Üzerinde yarı silinmiş bir yazı: “ODA 15”. Hemen altına, tırnakla kazınmış küçük bir işaret var: “3”.",
                speed: 22
            }
        ]);

        if (!state.bedInspected) {
            state.bedInspected = true;
            saveState();
            updateObjective();
            restraintBed?.classList.add("inspected");
        }
    }

    /* =====================================================
       KÖŞEDEKİ KOLTUK (ATMOSFER — BULMACA İÇERMİYOR)
    ===================================================== */

    function inspectMedicineCart() {
        playDialogue([
            {
                speaker: "Köşedeki Koltuk",
                text: "Ahşap ve deri kayışlarla donatılmış eski bir elektroşok koltuğu. Kayışlar bu odadaki yatağınkilerden daha eski, daha çok kullanılmış görünüyor.",
                speed: 20
            },
            {
                speaker: "",
                text: "Serum işe yaramamıştı, ameliyat başarısız olmuştu - belki de bu, denenen ikinci yöntemdi. Koltuğun köşesine küçük bir künye asılı: “SONUÇSUZ.”",
                speed: 22
            }
        ]);
    }

    /* =====================================================
       ZİNCİRLİ KAPI — ZAMANLI TUŞ TAKIMI
    ===================================================== */

    function openDoorKeypad() {
        state.doorCodeInput = [];
        updateDoorCodeSlotsDisplay();
        setDoorCodeMessage("");
        showElement(doorPanel);
        startDoorTimer();
    }

    function closeDoorKeypad() {
        stopDoorTimer();
        hideElement(doorPanel);
    }

    function startDoorTimer() {
        stopDoorTimer();
        state.doorTimerRemaining = DOOR_TIME_LIMIT_SECONDS;
        renderDoorTimer();

        state.doorTimerId = window.setInterval(tickDoorTimer, 1000);
    }

    function stopDoorTimer() {
        if (state.doorTimerId) {
            window.clearInterval(state.doorTimerId);
            state.doorTimerId = null;
        }
    }

    function tickDoorTimer() {
        state.doorTimerRemaining -= 1;

        if (state.doorTimerRemaining <= 0) {
            state.doorTimerRemaining = 0;
            renderDoorTimer();
            handleDoorTimeout();
            return;
        }

        renderDoorTimer();
    }

    function renderDoorTimer() {
        const percentage = Math.max(
            0,
            Math.min(100, (state.doorTimerRemaining / DOOR_TIME_LIMIT_SECONDS) * 100)
        );

        const isUrgent = state.doorTimerRemaining <= URGENT_THRESHOLD_SECONDS;

        if (doorTimerFill) {
            doorTimerFill.style.width = `${percentage}%`;
            doorTimerFill.classList.toggle("is-urgent", isUrgent);
        }

        if (doorTimerText) {
            doorTimerText.textContent = String(state.doorTimerRemaining);
            doorTimerText.classList.toggle("is-urgent", isUrgent);
        }
    }

    function handleDoorTimeout() {
        stopDoorTimer();

        state.doorCodeInput = [];
        state.doorTimeouts = (state.doorTimeouts || 0) + 1;
        saveState();

        updateDoorCodeSlotsDisplay();
        hideElement(doorPanel);
        triggerScare();

        window.setTimeout(() => {
            playDialogue([
                {
                    speaker: "Zincir",
                    text: "Zincir birden gerildi, tuşlar kilitlendi. Vakit doldu - yeniden dene.",
                    speed: 20
                }
            ]);
        }, 350);
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

            state.wrongCodeAttempts += 1;
            state.doorCodeInput = [];
            saveState();

            updateDoorCodeSlotsDisplay();

            state.doorTimerRemaining = Math.max(
                0,
                state.doorTimerRemaining - WRONG_DIGIT_PENALTY_SECONDS
            );
            renderDoorTimer();

            setDoorCodeMessage(
                "Yanlış rakam. Zincir gerildi, süre azaldı.",
                "error"
            );

            if (state.doorTimerRemaining <= 0) {
                handleDoorTimeout();
                return;
            }

            if (state.wrongCodeAttempts === 2) {
                triggerLightFlicker();
            }

            if (state.wrongCodeAttempts >= 4) {
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
        stopDoorTimer();

        state.doorUnlocked = true;
        saveState();

        playEffect("keypadSuccess");
        playEffect("doorUnlock");

        exitDoor?.classList.add("unlocked");

        setDoorCodeMessage("KOD DOĞRU — ZİNCİR ÇÖZÜLDÜ", "success");

        triggerLightFlicker();
        updateObjective();

        window.setTimeout(() => {
            hideElement(doorPanel);

            playDialogue([
                {
                    speaker: "Zincir",
                    text: "Son halka çözülüyor. Zincir, bir şeyi bırakmak istemiyormuş gibi yavaşça gevşiyor.",
                    speed: 20
                },
                {
                    speaker: "",
                    text: "Kapının ardında, koridorun sonunda tek bir ışık yanıyor - önceki bölümlerde hiç görmediğin bir yön.",
                    speed: 20
                },
                {
                    speaker: "",
                    text: "Arkanda, duvardaki isim hâlâ orada duruyor. Sanki oraya senden önce biri değil, sen bırakmışsın.",
                    speed: 24
                }
            ]);
        }, 950);
    }

    /* =====================================================
       ÇIKIŞ KAPISI (HOTSPOT)
    ===================================================== */

    function inspectExitDoor() {
        if (state.chapterCompleted) {
            completeChapter();
            return;
        }

        if (state.doorUnlocked) {
            completeChapter();
            return;
        }

        openDoorKeypad();
    }

    function completeChapter() {
        state.chapterCompleted = true;
        state.doorUnlocked = true;
        saveState();

        safeSet("chapter9Completed", true);
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
            "room10.html";

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
        const missing = [];

        if (!state.chartRead) missing.push("gözlem çizelgesini");
        if (!state.wallInspected) missing.push("duvardaki çizikleri");
        if (!state.bedInspected) missing.push("kısıtlama yatağındaki bilekliği");

        if (missing.length > 0) {
            showDialogue(
                "İpucu",
                `Henüz incelemediğin izler var: ${missing.join(", ")}.`
            );

            return;
        }

        if (!state.doorUnlocked) {
            if (state.doorTimeouts >= 2 || state.wrongCodeAttempts >= 3) {
                showDialogue(
                    "İpucu",
                    "Sıra şu: önce çizelgedeki kesilen kaydın numarası, sonra duvardaki kazıma, en son yataktaki bileklik. Tuş takımını açmadan önce üçünü de ezberle - panel açılır açılmaz zincir geri saymaya başlıyor."
                );
            } else {
                showDialogue(
                    "İpucu",
                    "Üç izin de yanında ufak bir sıra işareti var - hangisinin önce geldiğine dikkat et. Tuş takımı açılınca vaktin sınırlı olacak, hazırlıksız açma."
                );
            }

            return;
        }

        showDialogue(
            "İpucu",
            "Zincirin kilidi açık - çıkmak için kapıya tekrar tıkla."
        );
    }

    /* =====================================================
       ATMOSFER EFEKTLERİ
       Bu bölümde gerilim zirveye çıkıyor - olaylar diğer
       bölümlere göre biraz daha sık tetikleniyor.
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
        }, 6000);

        window.setTimeout(() => {
            if (!state.modalOpen && !state.chapterCompleted) {
                triggerMovingShadow();
                playEffect("footsteps");
            }
        }, 12000);

        window.setInterval(() => {
            if (state.modalOpen || state.chapterCompleted) {
                return;
            }

            const random = Math.random();

            if (random < 0.4) {
                triggerLightFlicker();
            } else if (random < 0.75) {
                triggerMovingShadow();
            } else {
                triggerHallwayFigure();
            }
        }, 17000);
    }

    /* =====================================================
       OLAY BAĞLAMA
    ===================================================== */

    function bindEvents() {
        registerInteraction(
            restraintBed,
            "Kısıtlama Yatağını İncele",
            inspectRestraintBed
        );

        registerInteraction(
            wallScratches,
            "Duvardaki Çizikleri İncele",
            inspectWallScratches
        );

        registerInteraction(
            observationChart,
            "Gözlem Çizelgesini İncele",
            inspectObservationChart
        );

        registerInteraction(
            medicineCart,
            "Köşedeki Koltuğu İncele",
            inspectMedicineCart
        );

        registerInteraction(
            exitDoor,
            "Zincirli Kapıyı İncele",
            inspectExitDoor
        );

        closeChartViewer?.addEventListener("click", closeChartView);
        closeChartFooter?.addEventListener("click", closeChartView);

        closeDoorPanel?.addEventListener("click", closeDoorKeypad);

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

        doorPanel?.addEventListener("click", event => {
            if (event.target === doorPanel) {
                closeDoorKeypad();
            }
        });

        setupKeyboardInteraction();
    }

    /* =====================================================
       KAYITLI GÖRÜNÜMÜ EŞLEŞTİR
    ===================================================== */

    function restoreVisualState() {
        if (state.chartRead) {
            observationChart?.classList.add("inspected");
        }

        if (state.wallInspected) {
            wallScratches?.classList.add("inspected");
        }

        if (state.bedInspected) {
            restraintBed?.classList.add("inspected");
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
        Bu bölümde el feneri ve UV mekaniği kullanılmıyor - koğuş
        floresan ışıkla (titrek de olsa) aydınlık.
    */

});
