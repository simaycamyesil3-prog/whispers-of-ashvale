"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
BÖLÜM 14 — KARŞILAŞMA

UYUMLULUK
- room14.html içindeki gerçek ID'lerle eşleşir.
- AshvaleSave kayıt sistemiyle çalışır.
- AshvaleInventory ortak envanter sistemini kullanır (bu
  bölümde toplanan bir eşya yok, envanter boş kalabilir).
- AshvaleAudio ve AshvaleDialogue varsa bunlara bağlanır.
- Bu sistemler yüklenmese bile temel bölüm akışı çalışmaya
  devam eder.

BULMACA
- Klasik tuş takımı / kod bulmacası YOK. Bu bölüm bilinçli
  olarak farklı: yerde dağılmış 4 vaka dosyasından 3'ü,
  geçmiş "3179" vakalarının tepkisine göre nasıl sonuçlandığını
  anlatıyor (panik/inkâr = kötü sonuç, sessizce dinlemek = tek
  "iyi" sonuç), 1'i hasarlı/decoy.
- Figürle konuşma iki turluk bir seçim dizisi. Her turda 3
  seçenek var, ikisi geçmiş vakalardaki kötü tepkileri
  yansıtıyor, biri ("sessizce dinle") doğru. Yanlış seçim
  bölümü bitirmiyor - figür tepki veriyor, oyuncu tekrar dener.
- Doğru iki seçimden sonra figür üçüncü yöntemin eksik
  parçasını veriyor ve kenara çekiliyor - oyuncu tekrar
  tıklayınca bölüm tamamlanıyor.
=========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       SABİTLER
    ===================================================== */

    const CHAPTER_NUMBER = 14;
    const NEXT_CHAPTER_NUMBER = 15;

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

    const scatteredFiles = getElement("scatteredFiles");
    const leftDoor = getElement("leftDoor");
    const rightDoor = getElement("rightDoor");
    const hangingLamp = getElement("hangingLamp");
    const figure = getElement("figure");

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
       DOSYA GÖRÜNTÜLEYİCİ
    ===================================================== */

    const filesViewer = getElement("filesViewer");
    const closeFilesViewer = getElement("closeFilesViewer");
    const closeFilesViewerFooter = getElement("closeFilesViewerFooter");

    /* =====================================================
       SEÇİM PANELİ
    ===================================================== */

    const choicePanel = getElement("choicePanel");
    const choiceOptions = getElement("choiceOptions");
    const choiceMessage = getElement("choiceMessage");

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
        filesRead: false,
        leftDoorInspected: false,
        rightDoorInspected: false,
        lampInspected: false,
        encounterStarted: false,
        encounterActive: false,
        encounterResolved: false,
        encounterStepIndex: 0,
        encounterSteps: [],
        wrongResponseCount: 0,
        scareTriggered: false,
        chapterCompleted: false,
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
        state.filesRead = safeGet("chapter14FilesRead", false) === true;
        state.leftDoorInspected = safeGet("chapter14LeftDoorInspected", false) === true;
        state.rightDoorInspected = safeGet("chapter14RightDoorInspected", false) === true;
        state.lampInspected = safeGet("chapter14LampInspected", false) === true;
        state.encounterStarted = safeGet("chapter14EncounterStarted", false) === true;
        state.encounterResolved = safeGet("chapter14EncounterResolved", false) === true;
        state.chapterCompleted = safeGet("chapter14Completed", false) === true;
    }

    function saveState() {
        safeSet("chapter14FilesRead", state.filesRead);
        safeSet("chapter14LeftDoorInspected", state.leftDoorInspected);
        safeSet("chapter14RightDoorInspected", state.rightDoorInspected);
        safeSet("chapter14LampInspected", state.lampInspected);
        safeSet("chapter14EncounterStarted", state.encounterStarted);
        safeSet("chapter14EncounterResolved", state.encounterResolved);
        safeSet("chapter14Completed", state.chapterCompleted);
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
                    storageKey: "chapter14Inventory",
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
                    chapter14Ambience: {
                        src: "assets/audio/ambience/chapter2_ambient.mp3",
                        type: "ambience",
                        loop: true,
                        volume: 0.35
                    },
                    paperRustle: {
                        src: "assets/audio/effects/paper_pickup.mp3",
                        type: "effect",
                        volume: 0.5
                    },
                    choiceSelect: {
                        src: "assets/audio/effects/keypad_press.mp3",
                        type: "effect",
                        volume: 0.45
                    },
                    choiceWrong: {
                        src: "assets/audio/effects/keypad_error.mp3",
                        type: "effect",
                        volume: 0.55
                    },
                    encounterResolve: {
                        src: "assets/audio/effects/door_unlock.mp3",
                        type: "effect",
                        volume: 0.68
                    },
                    footsteps: {
                        src: "assets/audio/effects/footsteps.mp3",
                        type: "effect",
                        volume: 0.55
                    },
                    scare: {
                        src: "assets/audio/effects/scare.mp3",
                        type: "effect",
                        volume: 0.65
                    }
                }
            });

            if (typeof audio.playAmbience === "function") {
                audio.playAmbience("chapter14Ambience");
            }
        } catch (error) {
            console.warn("Room14 ses sistemi başlatılamadı.", error);
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
            filesViewer,
            choicePanel,
            dialogElement,
            chapterComplete
        ].some(isVisible);
    }

    function closeAllPanels() {
        hideElement(filesViewer);
        hideElement(choicePanel);
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
       DEVAM TUŞU — KARŞILAŞMA SIRASINDA FARKLI DAVRANIR
    ===================================================== */

    function handleDialogContinue() {
        if (state.encounterActive) {
            if (
                dialogue &&
                typeof dialogue.typing === "function" &&
                dialogue.typing()
            ) {
                dialogue.skip();
                return;
            }

            advanceEncounterStep();
            return;
        }

        nextDialogue();
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

        if (state.filesRead) count += 1;
        if (state.encounterStarted) count += 1;
        if (state.encounterResolved) count += 1;

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
                "Karşılaşma sona erdi.",
                "Şimdiki vaka, senin kim olduğunu zaten biliyordu."
            );

            updateProgress();
            return;
        }

        if (!state.filesRead) {
            setObjective(
                "Yerdeki dosyaları incele.",
                "Koridorun ortasında biri duruyor. Kıpırdamıyor. Sadece bekliyor - sanki seni tanıyormuş gibi."
            );

            updateProgress();
            return;
        }

        if (!state.encounterStarted) {
            setObjective(
                "Karşındaki figürle konuş.",
                "Dosyalar aynı şeyi tekrar ediyor: tepki verenler kötü bitirmiş. Belki de mesele hiç tepki vermemek."
            );

            updateProgress();
            return;
        }

        if (!state.encounterResolved) {
            setObjective(
                "Konuşmayı doğru şekilde sürdür.",
                "Figür bekliyor. Nasıl tepki verdiğin, ne söylediğinden daha önemli görünüyor."
            );

            updateProgress();
            return;
        }

        setObjective(
            "Konuşma bitti - figüre tekrar tıkla ve geç.",
            "Şimdiki vaka, senin kim olduğunu zaten biliyordu."
        );

        updateProgress();
    }

    /* =====================================================
       DOSYALAR
    ===================================================== */

    function inspectScatteredFiles() {
        if (!state.filesRead) {
            state.filesRead = true;
            saveState();
            updateObjective();

            playEffect("paperRustle");
            scatteredFiles?.classList.add("inspected");
        }

        showElement(filesViewer);
    }

    function closeFilesViewerPanel() {
        hideElement(filesViewer);
    }

    /* =====================================================
       KAPILAR / LAMBA (ATMOSFER)
    ===================================================== */

    function inspectLeftDoor() {
        if (!state.leftDoorInspected) {
            state.leftDoorInspected = true;
            saveState();
            leftDoor?.classList.add("inspected");
        }

        showDialogue(
            "",
            "Pas tutmuş bir kapı, aralık duruyor. İçerisi tamamen karanlık - kimse yıllardır girmemiş gibi."
        );
    }

    function inspectRightDoor() {
        if (!state.rightDoorInspected) {
            state.rightDoorInspected = true;
            saveState();
            rightDoor?.classList.add("inspected");
        }

        showDialogue(
            "",
            "Bu kapıların çoğu hastaların odalarına açılıyordu. Şimdi hepsi boş - ya da öyle görünüyor."
        );
    }

    function inspectHangingLamp() {
        if (!state.lampInspected) {
            state.lampInspected = true;
            saveState();
            hangingLamp?.classList.add("inspected");
        }

        showDialogue(
            "",
            "Tavandaki tek lamba sürekli titriyor ama hiç sönmüyor. Sanki birinin onu yanık tutmasını istediği gibi."
        );
    }

    /* =====================================================
       KARŞILAŞMA — DİYALOG + SEÇİM DİZİSİ
    ===================================================== */

    function buildEncounterSteps() {
        const name = state.playerName || "Oyuncu";

        return [
            { type: "line", speaker: "?", text: `${name}.`, speed: 32 },
            { type: "line", speaker: "3179", text: "Beni tanımıyorsun. Ama ben seni tanıyorum.", speed: 20 },
            { type: "line", speaker: "3179", text: "Buraya kadar gelen herkes gibi değilsin sanırım - hayır, onlar hep tepki verdi. Bağırdı, kaçtı, inkâr etti.", speed: 18 },
            {
                type: "choice",
                options: [
                    {
                        text: "“Kimsin, ne istiyorsun?”",
                        correct: false,
                        reactText: "O da öyle demişti. 1994'te. Sonra koşmaya başladı."
                    },
                    {
                        text: "“Bunun benimle bir ilgisi yok.”",
                        correct: false,
                        reactText: "2003'te de böyle denenmişti. İşe yaramadı."
                    },
                    {
                        text: "(Sessizce dinle.)",
                        correct: true
                    }
                ]
            },
            { type: "line", speaker: "3179", text: "Dinliyorsun. Bu, buraya kadar hiç olmamıştı.", speed: 20 },
            { type: "line", speaker: "3179", text: "Sana üçüncü yöntemden bahsetmişlerdir - bir seçenek olduğunu.", speed: 20 },
            { type: "line", speaker: "3179", text: "Ama eksik bıraktılar: yöntem sadece susmak değil. Tam olarak duymak, sonra kimseye - hiç kimseye - aktarmamak.", speed: 18 },
            {
                type: "choice",
                options: [
                    {
                        text: "“Anlamıyorum, ne yapmam gerekiyor?”",
                        correct: false,
                        reactText: "Sorular da bir tepki. Sadece daha yavaş bir tanesi."
                    },
                    {
                        text: "“Sen de mi denedin, hiç susabildin mi?”",
                        correct: false,
                        reactText: "Hayır. Ben hiç susamadım. Belki sen susabilirsin."
                    },
                    {
                        text: "(Yine sessizce dinle.)",
                        correct: true
                    }
                ]
            },
            { type: "line", speaker: "3179", text: "İşte bu. Eksik olan parça buydu.", speed: 22 },
            { type: "line", speaker: "3179", text: `${name}, sıra sende. Ben burada kalıyorum - sen geç.`, speed: 20 }
        ];
    }

    function startEncounter() {
        state.encounterSteps = buildEncounterSteps();
        state.encounterStepIndex = 0;
        state.encounterActive = true;

        if (!state.encounterStarted) {
            state.encounterStarted = true;
            saveState();
            updateObjective();
        }

        renderEncounterStep();
    }

    function currentEncounterStep() {
        return state.encounterSteps[state.encounterStepIndex];
    }

    function renderEncounterStep() {
        const step = currentEncounterStep();

        if (!step) {
            resolveEncounter();
            return;
        }

        if (step.type === "line") {
            hideElement(choicePanel);
            showDialogue(step.speaker, step.text, step.speed);
            state.modalOpen = true;
            return;
        }

        if (step.type === "choice") {
            hideDialogue();
            renderChoiceOptions(step);
            showElement(choicePanel);
        }
    }

    function renderChoiceOptions(step) {
        if (!choiceOptions) {
            return;
        }

        choiceOptions.innerHTML = "";

        if (choiceMessage) {
            choiceMessage.textContent = "";
            choiceMessage.classList.remove("error", "is-error", "success", "is-success");
        }

        step.options.forEach((option, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.dataset.index = String(index);
            button.textContent = option.text;
            choiceOptions.appendChild(button);
        });
    }

    function pickChoiceOption(index) {
        const step = currentEncounterStep();

        if (!step || step.type !== "choice") {
            return;
        }

        const option = step.options[index];

        if (!option) {
            return;
        }

        if (option.correct) {
            playEffect("choiceSelect");

            if (choiceMessage) {
                choiceMessage.textContent = "";
                choiceMessage.classList.remove("error", "is-error");
            }

            advanceEncounterStep();
            return;
        }

        playEffect("choiceWrong");
        state.wrongResponseCount += 1;

        if (choiceMessage) {
            choiceMessage.textContent = option.reactText || "Bu doğru tepki değildi.";
            choiceMessage.classList.remove("success", "is-success");
            choiceMessage.classList.add("error", "is-error");
        }

        if (state.wrongResponseCount === 2) {
            triggerLightFlicker();
        }

        if (state.wrongResponseCount >= 4 && !state.scareTriggered) {
            state.scareTriggered = true;
            triggerEncounterScare();
        }
    }

    function advanceEncounterStep() {
        state.encounterStepIndex += 1;
        renderEncounterStep();
    }

    function resolveEncounter() {
        state.encounterActive = false;
        state.encounterResolved = true;
        saveState();

        hideDialogue();
        hideElement(choicePanel);

        playEffect("encounterResolve");

        figure?.classList.add("encounter-resolved");

        updateObjective();

        window.setTimeout(() => {
            completeChapter();
        }, 1200);
    }

    /* =====================================================
       FİGÜR
    ===================================================== */

    function interactFigure() {
        if (state.chapterCompleted) {
            completeChapter();
            return;
        }

        if (state.encounterResolved) {
            completeChapter();
            return;
        }

        if (state.encounterActive) {
            renderEncounterStep();
            return;
        }

        startEncounter();
    }

    /* =====================================================
       BÖLÜM TAMAMLAMA
    ===================================================== */

    function completeChapter() {
        state.chapterCompleted = true;
        saveState();

        safeSet("chapter14Completed", true);
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

        figure?.classList.add("encounter-resolved");
        showElement(chapterComplete);
        chapterComplete?.classList.add("chapter-complete--visible");
        chapterComplete?.setAttribute("aria-hidden", "false");
    }

    function goToNextChapter() {
        completeChapter();

        const nextPage =
            nextChapter?.dataset.href ||
            "room15.html";

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
        if (!state.filesRead) {
            showDialogue(
                "İpucu",
                "Yerdeki dağılmış dosyaları oku - dört ayrı vaka anlatılıyor."
            );

            return;
        }

        if (!state.encounterStarted) {
            showDialogue(
                "İpucu",
                "Karşındaki figürle konuşmayı dene."
            );

            return;
        }

        if (!state.encounterResolved) {
            showDialogue(
                "İpucu",
                "Dosyalardaki vakalar sana bir şey söylüyor: tepkinin şekli önemli. Sessizce dinlemek, diğer ikisinden farklı sonuçlanmıştı."
            );

            return;
        }

        showDialogue(
            "İpucu",
            "Konuşma bitti - figüre tekrar tıkla ve geç."
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

    function triggerEncounterScare() {
        /*
            Bu bölümde koridorun ortasında zaten sabit bir figür
            (3179) duruyor - ek bir "hallwayFigure" efekti burada
            kafa karıştırıcı olur (ikinci bir varlık varmış hissi
            verir). Bu yüzden sadece flicker + ekran sarsıntısı +
            ses kullanılıyor, hallwayFigure tetiklenmiyor.
        */
        playEffect("scare");
        triggerLightFlicker();
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
        }, 9000);

        window.setTimeout(() => {
            if (!state.modalOpen && !state.chapterCompleted) {
                triggerMovingShadow();
                playEffect("footsteps");
            }
        }, 17000);

        window.setInterval(() => {
            if (state.modalOpen || state.chapterCompleted) {
                return;
            }

            if (Math.random() < 0.5) {
                triggerLightFlicker();
            } else {
                triggerMovingShadow();
            }
        }, 23000);
    }

    /* =====================================================
       OLAY BAĞLAMA
    ===================================================== */

    function bindEvents() {
        registerInteraction(
            scatteredFiles,
            "Yerdeki Dosyaları İncele",
            inspectScatteredFiles
        );

        registerInteraction(
            leftDoor,
            "Sol Koğuş Kapısını İncele",
            inspectLeftDoor
        );

        registerInteraction(
            rightDoor,
            "Sağ Koğuş Kapısını İncele",
            inspectRightDoor
        );

        registerInteraction(
            hangingLamp,
            "Tavandaki Lambayı İncele",
            inspectHangingLamp
        );

        registerInteraction(
            figure,
            "Karşındaki Figürle Konuş",
            interactFigure
        );

        closeFilesViewer?.addEventListener("click", closeFilesViewerPanel);
        closeFilesViewerFooter?.addEventListener("click", closeFilesViewerPanel);

        filesViewer?.addEventListener("click", event => {
            if (event.target === filesViewer) {
                closeFilesViewerPanel();
            }
        });

        choiceOptions?.addEventListener("click", event => {
            const button = event.target.closest("button[data-index]");

            if (!button) {
                return;
            }

            pickChoiceOption(Number(button.dataset.index));
        });

        hintButton?.addEventListener("click", showHint);

        dialogContinue?.addEventListener("click", handleDialogContinue);
        dialogClose?.addEventListener("click", () => {
            hideDialogue();
        });

        nextChapter?.addEventListener("click", goToNextChapter);
        menuButton?.addEventListener("click", returnToMenu);

        setupKeyboardInteraction();
    }

    /* =====================================================
       KAYITLI GÖRÜNÜMÜ EŞLEŞTİR
    ===================================================== */

    function restoreVisualState() {
        if (state.filesRead) {
            scatteredFiles?.classList.add("inspected");
        }

        if (state.leftDoorInspected) {
            leftDoor?.classList.add("inspected");
        }

        if (state.rightDoorInspected) {
            rightDoor?.classList.add("inspected");
        }

        if (state.lampInspected) {
            hangingLamp?.classList.add("inspected");
        }

        if (state.encounterResolved || state.chapterCompleted) {
            figure?.classList.add("encounter-resolved");
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
            figure?.classList.add("encounter-resolved");
        }
    }

    initializeRoom();

    /*
        Bu bölümde el feneri ve UV mekaniği kullanılmıyor - koridor
        baştan itibaren tavandaki tek lamba ile aydınlık.
    */

});
