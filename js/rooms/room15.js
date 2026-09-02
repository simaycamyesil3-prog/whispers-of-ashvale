"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
BÖLÜM 15 — ASHVALE'İN KALBİ (FİNAL)

UYUMLULUK
- room15.html içindeki gerçek ID'lerle eşleşir.
- AshvaleSave kayıt sistemiyle çalışır.
- AshvaleInventory ortak envanter sistemini kullanır (bu
  bölümde toplanan bir eşya yok).
- AshvaleAudio ve AshvaleDialogue varsa bunlara bağlanır.

BULMACA / FİNAL SEKANSI
- Klasik bulmaca YOK ama müzik kutusu artık kilitli: oyuncu
  fotoğrafları, çekmeceyi ve yatağı incelemeden müzik kutusu
  tepki vermiyor. Bu üç nesne artık gerçek hikaye parçaları
  veriyor (1987/1994/2011 tarihli "3179" etiketli izler - diğer
  bölümlerdeki (8, 13) izlerle aynı isim, figürün kim/ne olduğuna
  dair önceden ipucu).
- Odayı incele bittikten sonra müzik kutusuna dokununca final
  sekansı başlıyor: hızlı fısıltı korosu (otomatik ilerleyen,
  tıklama gerektirmeyen kısa satırlar) → oda renk/ışık
  titremesiyle "canlanıyor" → figür oyuncuya doğrudan hitap
  ediyor (artık Bölüm 10'daki ninni kaydına da değiniyor) →
  "KONUŞ / SUS" seçimi geliyor.
- İKİNCİ ARKA PLAN KATMANI (#roomBackgroundAlt): yüzleşme
  başlayınca (climax-confront) figürün sırtı dönük ama daha
  yakın olduğu bir görsele (room15_approach.png) yavaşça geçiliyor
  (crossfade). İkinci yanlış KONUŞ seçimindeki büyük korku anında
  (triggerBigScare) aynı katmanın kaynağı ANİDEN figürün artık
  sana döndüğü/baktığı görsele (room15_jumpscare.png) değişiyor -
  katman zaten görünür olduğu için bu geçiş kasıtlı olarak sert/
  ani oluyor (jumpscare hissi). SUS (doğru) seçilince katman
  sıfırlanıp temel görsele dönülüyor.
- KONUŞ yanlış (döngüyü hiç kimse böyle kıramamış) - bölümü
  bitirmiyor, oda daha da yoğunlaşıyor (climax-intense), tekrar
  denenebiliyor.
- SUS doğru - tam ekran flaş + sesin anında kesilmesi, sonra
  oda sakinleşiyor, final diyaloğu ve oyunun bitiş ekranı geliyor.
=========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       SABİTLER
    ===================================================== */

    const CHAPTER_NUMBER = 15;

    const WHISPER_LINES = [
        "1994... hayır, dur, dinleme...",
        "2003... duymadım, duymadım...",
        "2011... sessiz kal, sessiz kal...",
        "Yıllarca aynı oda. Yıllarca aynı ses.",
        "Herkes duydu. Kimse susamadı."
    ];

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
    const roomMain = getElement("room");
    const roomBackgroundAlt = getElement("roomBackgroundAlt");

    /* =====================================================
       HOTSPOTLAR
    ===================================================== */

    const photos = getElement("photos");
    const musicBox = getElement("musicBox");
    const drawer = getElement("drawer");
    const bed = getElement("bed");
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
       DİYALOG
    ===================================================== */

    const dialogElement = getElement("dialog");
    const dialogTitle = getElement("dialogTitle");
    const dialogText = getElement("dialogText");
    const dialogContinue = getElement("dialogContinue");
    const dialogClose = getElement("dialog-x-button");

    /* =====================================================
       SON SEÇİM PANELİ
    ===================================================== */

    const finalChoicePanel = getElement("finalChoicePanel");
    const finalChoiceSpeak = getElement("finalChoiceSpeak");
    const finalChoiceSilent = getElement("finalChoiceSilent");
    const finalChoiceMessage = getElement("finalChoiceMessage");

    /* =====================================================
       FLAŞ / BÖLÜM TAMAMLAMA
    ===================================================== */

    const climaxFlash = getElement("climaxFlash");
    const chapterComplete = getElement("chapterComplete");
    const nextChapter = getElement("nextChapter");

    /* =====================================================
       ATMOSFER
    ===================================================== */

    const roomFlicker = getElement("roomFlicker");
    const movingShadow = getElement("movingShadow");

    /* =====================================================
       OYUN DURUMU
    ===================================================== */

    const state = {
        photosInspected: false,
        drawerInspected: false,
        bedInspected: false,
        figureInspected: false,
        climaxStarted: false,
        climaxResolved: false,
        gameCompleted: false,
        wrongSpeakCount: 0,
        modalOpen: false,
        activeHotspot: null,
        playerName: "Oyuncu",
        dialogueQueue: [],
        dialogueIndex: 0,
        autoAdvanceActive: false,
        explorationQueueActive: false
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
        state.photosInspected = safeGet("chapter15PhotosInspected", false) === true;
        state.drawerInspected = safeGet("chapter15DrawerInspected", false) === true;
        state.bedInspected = safeGet("chapter15BedInspected", false) === true;
        state.figureInspected = safeGet("chapter15FigureInspected", false) === true;
        state.climaxResolved = safeGet("chapter15ClimaxResolved", false) === true;
        state.gameCompleted = safeGet("chapter15Completed", false) === true;
    }

    function saveState() {
        safeSet("chapter15PhotosInspected", state.photosInspected);
        safeSet("chapter15DrawerInspected", state.drawerInspected);
        safeSet("chapter15BedInspected", state.bedInspected);
        safeSet("chapter15FigureInspected", state.figureInspected);
        safeSet("chapter15ClimaxResolved", state.climaxResolved);
        safeSet("chapter15Completed", state.gameCompleted);
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
                    storageKey: "chapter15Inventory",
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
                    chapter15Ambience: {
                        src: "assets/audio/ambience/chapter2_ambient.mp3",
                        type: "ambience",
                        loop: true,
                        volume: 0.3
                    },
                    lullaby: {
                        src: "assets/audio/effects/paper_pickup.mp3",
                        type: "effect",
                        volume: 0.55
                    },
                    whisperRise: {
                        src: "assets/audio/effects/scare.mp3",
                        type: "effect",
                        volume: 0.5
                    },
                    choiceWrong: {
                        src: "assets/audio/effects/keypad_error.mp3",
                        type: "effect",
                        volume: 0.6
                    },
                    finalRelease: {
                        src: "assets/audio/effects/door_unlock.mp3",
                        type: "effect",
                        volume: 0.75
                    },
                    scare: {
                        src: "assets/audio/effects/scare.mp3",
                        type: "effect",
                        volume: 0.65
                    }
                }
            });

            if (typeof audio.playAmbience === "function") {
                audio.playAmbience("chapter15Ambience");
            }
        } catch (error) {
            console.warn("Room15 ses sistemi başlatılamadı.", error);
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

    function stopAllAudio() {
        if (!audio) {
            return;
        }

        try {
            if (typeof audio.stopAll === "function") {
                audio.stopAll();
                return;
            }

            if (typeof audio.stopAmbience === "function") {
                audio.stopAmbience();
            }
        } catch (error) {
            console.warn("Ses durdurulamadı.", error);
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
            finalChoicePanel,
            dialogElement,
            chapterComplete
        ].some(isVisible);
    }

    function closeAllPanels() {
        if (state.climaxStarted && !state.climaxResolved) {
            // Final sekansı ortasında kapatmaya izin verme - oyuncu
            // yanlışlıkla Escape'e basıp sekansı yarıda bırakmasın.
            return;
        }

        hideElement(finalChoicePanel);
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
        state.explorationQueueActive = false;
        state.modalOpen = isAnyModalOpen();
    }

    /* =====================================================
       BASİT ATMOSFER DİYALOĞU (fotoğraf/çekmece/yatak/figür)
    ===================================================== */

    function showSimpleLine(text) {
        showDialogue("", text, 20);
    }

    /* =====================================================
       ÇOK SATIRLI KEŞİF DİYALOĞU (fotoğraf/çekmece/yatak)
       - Tek satır yerine 2-3 satırlık kısa bir hikaye parçası
         gösterir, DEVAM ile ilerler, son satırdan sonra sessizce
         kapanır (climax veya final akışını etkilemez).
    ===================================================== */

    function showExplorationQueue(lines) {
        state.dialogueQueue = lines.map(text => ({
            speaker: "",
            text,
            speed: 22
        }));
        state.dialogueIndex = 0;
        state.explorationQueueActive = true;

        showExplorationEntry();
    }

    function showExplorationEntry() {
        const entry = state.dialogueQueue[state.dialogueIndex];

        if (!entry) {
            state.explorationQueueActive = false;
            hideDialogue();
            return;
        }

        showDialogue(entry.speaker || "", entry.text || "", entry.speed || 20);
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

        const roomExplored =
            state.photosInspected &&
            state.drawerInspected &&
            state.bedInspected;

        if (roomExplored) count += 1;
        if (state.climaxStarted) count += 1;
        if (state.climaxResolved) count += 1;

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
        if (state.gameCompleted) {
            setObjective(
                "Ashvale'den çıktın.",
                "Hastanenin son kaydı, artık yeni bir vaka olmadığı için ilk kez gerçekten kapanıyor."
            );

            updateProgress();
            return;
        }

        if (state.climaxResolved) {
            setObjective(
                "Kapıya git ve Ashvale'den çık.",
                "Sessizlik. İlk kez - gerçek sessizlik."
            );

            updateProgress();
            return;
        }

        if (state.climaxStarted) {
            setObjective(
                "Sessizliğini koru.",
                "Oda seninle konuşuyor. Ya da içindeki her şey birden konuşuyor."
            );

            updateProgress();
            return;
        }

        setObjective(
            "Odayı incele, sonra müzik kutusuna dokun.",
            "Oda 3-1. Diğerleri gibi dağılmamış - burası yıllardır neredeyse bir türbe gibi korunmuş."
        );

        updateProgress();
    }

    /* =====================================================
       ATMOSFER OBJELERİ
    ===================================================== */

    function inspectPhotos() {
        if (!state.photosInspected) {
            state.photosInspected = true;
            saveState();
            photos?.classList.add("inspected");
            updateObjective();
            updateMusicBoxReadiness();
        }

        showExplorationQueue([
            "Üç eski fotoğraf. Altlarında tarihler var: 1987, 1994, 2011.",
            "Farklı yüzler, farklı kıyafetler - ama hepsinin arkasında aynı el yazısıyla tek kelime yazıyor: 3179.",
            "En eski fotoğrafın altında küçük bir not var: \"E. Varlık, Oda 3-1.\" İlk vaka. Ya da öyle sanılan."
        ]);
    }

    function inspectDrawer() {
        if (!state.drawerInspected) {
            state.drawerInspected = true;
            saveState();
            drawer?.classList.add("inspected");
            updateObjective();
            updateMusicBoxReadiness();
        }

        showExplorationQueue([
            "Çekmecede küçük, katlanmış bir kağıt var. Üzerinde tek bir cümle yazılı olmalıydı - ama sayfa bilerek boş bırakılmış.",
            "Kağıdın altında kısa bir not daha var: \"Cümleyi yazma. Sadece dinle, sonra sustur.\"",
            "El yazısı, oda kadar eski. Sanki biri bunu senin için bırakmış - yıllar önce."
        ]);
    }

    function inspectBed() {
        if (!state.bedInspected) {
            state.bedInspected = true;
            saveState();
            bed?.classList.add("inspected");
            updateObjective();
            updateMusicBoxReadiness();
        }

        showExplorationQueue([
            "Yatak diğer odalardaki gibi dağınık değil. Çarşaflar düzgün, sanki birazdan biri yatacakmış gibi.",
            "Yastığın altında küçük bir hasta bilekliği var. Üzerinde bir isim yerine yine aynı etiket yazıyor: 3179.",
            "Tarih 1987. Odanın ilk sahibinden kalma - ya da öyle görünüyor."
        ]);
    }

    function inspectFigure() {
        if (state.climaxStarted) {
            return;
        }

        if (!state.figureInspected) {
            state.figureInspected = true;
            saveState();
            figure?.classList.add("inspected");
        }

        showSimpleLine(
            "Pencerenin önünde biri duruyor. Yarı saydam - neredeyse orada değil. Sana bakmıyor, dışarıyı izliyor."
        );
    }

    /* =====================================================
       FİNAL SEKANSI — MÜZİK KUTUSU
    ===================================================== */

    function interactMusicBox() {
        if (state.gameCompleted) {
            return;
        }

        if (state.climaxResolved) {
            showSimpleLine(
                "Müzik kutusu sustu. Artık söyleyecek bir şeyi yok."
            );

            return;
        }

        if (state.climaxStarted) {
            // Sekans zaten sürüyor, tekrar tetiklemeye gerek yok.
            return;
        }

        if (
            !state.photosInspected ||
            !state.drawerInspected ||
            !state.bedInspected
        ) {
            showSimpleLine(
                "Müzik kutusuna dokunmadan önce odayı iyice incele - fotoğraflar, çekmece, yatak."
            );

            return;
        }

        startClimax();
    }

    function updateMusicBoxReadiness() {
        if (!musicBox) {
            return;
        }

        const ready =
            state.photosInspected &&
            state.drawerInspected &&
            state.bedInspected &&
            !state.climaxStarted;

        musicBox.classList.toggle("ready-to-play", ready);
    }

    function startClimax() {
        state.climaxStarted = true;
        saveState();
        updateObjective();

        musicBox?.classList.add("climax-triggered");
        musicBox?.classList.remove("ready-to-play");
        roomMain?.classList.add("climax-active");

        playEffect("lullaby");
        playEffect("whisperRise");

        playWhisperMontage(0);
    }

    function playWhisperMontage(index) {
        if (index >= WHISPER_LINES.length) {
            window.setTimeout(startFigureConfrontation, 700);
            return;
        }

        state.autoAdvanceActive = true;
        showDialogue("", WHISPER_LINES[index], 12);
        dialogElement?.classList.add("dialog--whisper");

        window.setTimeout(() => {
            playWhisperMontage(index + 1);
        }, 1500);
    }

    /* =====================================================
       ARKA PLAN GEÇİŞLERİ (figür yaklaşıyor/dönüyor)
    ===================================================== */

    function crossfadeToApproach() {
        if (!roomBackgroundAlt) {
            return;
        }

        roomBackgroundAlt.classList.remove("snap");
        roomBackgroundAlt.src = "images/ui/rooms/room15_approach.png";
        roomBackgroundAlt.classList.add("visible");
    }

    function snapToJumpscareImage() {
        if (!roomBackgroundAlt) {
            return;
        }

        // Katman zaten görünür (climax-confront'tan beri) - sadece
        // kaynağı değiştirip ani bir kesim/dönüş hissi veriyoruz.
        roomBackgroundAlt.classList.add("snap", "visible");
        roomBackgroundAlt.src = "images/ui/rooms/room15_jumpscare.png";
    }

    function resetBackgroundLayer() {
        if (!roomBackgroundAlt) {
            return;
        }

        roomBackgroundAlt.classList.remove("visible", "snap");
    }

    function startFigureConfrontation() {
        state.autoAdvanceActive = false;
        dialogElement?.classList.remove("dialog--whisper");
        roomMain?.classList.add("climax-confront");
        crossfadeToApproach();

        const name = state.playerName || "Oyuncu";

        state.dialogueQueue = [
            { speaker: "", text: `${name}, şimdi senin sıran.`, speed: 24 },
            { speaker: "", text: "Bunu daha önce duydun - küçükken, birinin sana söylediği bir ninni gibi.", speed: 22 },
            { speaker: "", text: "O gün hatırlamıyordun. Ama bir parçan hep biliyordu.", speed: 22 },
            { speaker: "", text: "Cümleyi duyacaksın. Sadece bir kez. Tam olarak.", speed: 22 },
            { speaker: "", text: "Ne yapacaksın?", speed: 26 }
        ];
        state.dialogueIndex = 0;

        showFallbackDialogueEntry();
    }

    function showFallbackDialogueEntry() {
        const entry = state.dialogueQueue[state.dialogueIndex];

        if (!entry) {
            showFinalChoice();
            return;
        }

        showDialogue(entry.speaker || "", entry.text || "", entry.speed || 20);
    }

    function handleDialogContinue() {
        if (state.explorationQueueActive) {
            if (
                dialogue &&
                typeof dialogue.typing === "function" &&
                dialogue.typing()
            ) {
                dialogue.skip();
                return;
            }

            state.dialogueIndex += 1;
            showExplorationEntry();
            return;
        }

        if (state.autoAdvanceActive) {
            // Fısıltı korosu otomatik ilerliyor, DEVAM tuşu sadece
            // yazının hızlı bitmesini sağlar.
            if (
                dialogue &&
                typeof dialogue.typing === "function" &&
                dialogue.typing()
            ) {
                dialogue.skip();
            }

            return;
        }

        if (state.climaxStarted && !state.climaxResolved && state.dialogueQueue.length > 0) {
            if (
                dialogue &&
                typeof dialogue.typing === "function" &&
                dialogue.typing()
            ) {
                dialogue.skip();
                return;
            }

            state.dialogueIndex += 1;
            showFallbackDialogueEntry();
            return;
        }

        if (state.climaxResolved && state.dialogueQueue.length > 0) {
            if (
                dialogue &&
                typeof dialogue.typing === "function" &&
                dialogue.typing()
            ) {
                dialogue.skip();
                return;
            }

            state.dialogueIndex += 1;

            const entry = state.dialogueQueue[state.dialogueIndex];

            if (!entry) {
                hideDialogue();
                finishGame();
                return;
            }

            showDialogue(entry.speaker || "", entry.text || "", entry.speed || 20);
            return;
        }

        hideDialogue();
    }

    /* =====================================================
       SON SEÇİM — KONUŞ / SUS
    ===================================================== */

    function showFinalChoice() {
        hideDialogue();

        if (finalChoiceMessage) {
            finalChoiceMessage.textContent = "";
            finalChoiceMessage.classList.remove("error", "is-error");
        }

        showElement(finalChoicePanel);
    }

    function pickSpeak() {
        state.wrongSpeakCount += 1;

        playEffect("choiceWrong");

        if (finalChoiceMessage) {
            finalChoiceMessage.textContent =
                state.wrongSpeakCount === 1
                    ? "Hayır... yapma..."
                    : "Döndü. Artık sana bakıyor.";

            finalChoiceMessage.classList.add("error", "is-error");
        }

        triggerLightFlicker();

        if (state.wrongSpeakCount === 1) {
            roomMain?.classList.add("climax-intense");
            finalChoicePanel?.classList.add("climax-intense");
        }

        if (state.wrongSpeakCount >= 2) {
            triggerBigScare();
        }
    }

    function pickSilent() {
        hideElement(finalChoicePanel);

        state.climaxResolved = true;
        saveState();

        roomMain?.classList.remove("climax-active", "climax-intense", "climax-confront", "climax-jumpscare");
        finalChoicePanel?.classList.remove("climax-intense", "climax-jumpscare");
        musicBox?.classList.remove("climax-triggered");
        resetBackgroundLayer();

        stopAllAudio();
        playEffect("finalRelease");

        climaxFlash?.classList.add("flash-active");

        window.setTimeout(() => {
            climaxFlash?.classList.remove("flash-active");
            updateObjective();
            playFinalCalmDialogue();
        }, 1200);
    }

    function playFinalCalmDialogue() {
        state.dialogueQueue = [
            { speaker: "", text: "Sessizlik. İlk kez - gerçek sessizlik.", speed: 26 },
            { speaker: "", text: "Doku, yavaşça sakinleşiyor. Hemen değil, ama nihayet.", speed: 24 },
            { speaker: "", text: "Şafak sökerken Ashvale'den çıkıyorsun.", speed: 24 }
        ];
        state.dialogueIndex = 0;

        showFallbackDialogueEntry();
    }

    function finishGame() {
        completeChapter();
    }

    /* =====================================================
       BÖLÜM / OYUN TAMAMLAMA
    ===================================================== */

    function completeChapter() {
        state.gameCompleted = true;
        saveState();

        safeSet("chapter15Completed", true);
        safeSet("gameCompleted", true);
        safeSet("lastPlayedChapter", CHAPTER_NUMBER);

        try {
            if (save && typeof save.completeRoom === "function") {
                save.completeRoom(CHAPTER_NUMBER);
            }
        } catch (error) {
            console.warn("Bölüm ilerlemesi ortak kayıt sistemine yazılamadı.", error);
        }

        updateObjective();
        closeAllPanels();
        hidePrompt();

        showElement(chapterComplete);
        chapterComplete?.classList.add("chapter-complete--visible");
        chapterComplete?.setAttribute("aria-hidden", "false");
    }

    function goToMenu() {
        completeChapter();

        const menuPage =
            nextChapter?.dataset.href ||
            "index.html";

        window.location.href = menuPage;
    }

    function returnToMenu() {
        saveState();

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
        if (state.gameCompleted) {
            showSimpleLine("Ashvale'den çıktın. Hikaye burada bitiyor.");
            return;
        }

        if (state.climaxResolved) {
            showSimpleLine("Devam tuşuna basarak sona ulaş.");
            return;
        }

        if (state.climaxStarted) {
            showSimpleLine(
                "Yıllardır kimse başaramadı çünkü hepsi tepki verdi. Sessiz kal."
            );
            return;
        }

        if (!state.photosInspected || !state.drawerInspected || !state.bedInspected) {
            showSimpleLine(
                "Odayı incele - fotoğraflar, çekmece, yatak. Sonra müzik kutusuna dokun."
            );
            return;
        }

        showSimpleLine("Müzik kutusuna dokun.");
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

    function triggerBigScare() {
        playEffect("scare");
        triggerLightFlicker();
        triggerMovingShadow();
        snapToJumpscareImage();

        activateTemporaryClass(roomMain, "climax-jumpscare", 900);
        activateTemporaryClass(finalChoicePanel, "climax-jumpscare", 900);

        if (window.Effects && typeof window.Effects.shake === "function") {
            try {
                window.Effects.shake("#room", "strong");
            } catch {
                // CSS korku efektleri çalışmaya devam eder.
            }
        }
    }

    function scheduleAtmosphereEvents() {
        window.setInterval(() => {
            if (
                state.modalOpen ||
                state.gameCompleted ||
                state.climaxStarted
            ) {
                return;
            }

            if (Math.random() < 0.5) {
                triggerLightFlicker();
            } else {
                triggerMovingShadow();
            }
        }, 24000);
    }

    /* =====================================================
       OLAY BAĞLAMA
    ===================================================== */

    function bindEvents() {
        registerInteraction(
            photos,
            "Duvardaki Fotoğrafları İncele",
            inspectPhotos
        );

        registerInteraction(
            drawer,
            "Sehpanın Çekmecesini Aç",
            inspectDrawer
        );

        registerInteraction(
            bed,
            "Yatağı İncele",
            inspectBed
        );

        registerInteraction(
            figure,
            "Pencere Kenarındaki Figürü İncele",
            inspectFigure
        );

        registerInteraction(
            musicBox,
            "Müzik Kutusuna Dokun",
            interactMusicBox
        );

        finalChoiceSpeak?.addEventListener("click", pickSpeak);
        finalChoiceSilent?.addEventListener("click", pickSilent);

        hintButton?.addEventListener("click", showHint);

        dialogContinue?.addEventListener("click", handleDialogContinue);
        dialogClose?.addEventListener("click", () => {
            if (!state.climaxStarted || state.climaxResolved) {
                hideDialogue();
            }
        });

        nextChapter?.addEventListener("click", goToMenu);
        menuButton?.addEventListener("click", returnToMenu);

        setupKeyboardInteraction();
    }

    /* =====================================================
       KAYITLI GÖRÜNÜMÜ EŞLEŞTİR
    ===================================================== */

    function restoreVisualState() {
        if (state.photosInspected) {
            photos?.classList.add("inspected");
        }

        if (state.drawerInspected) {
            drawer?.classList.add("inspected");
        }

        if (state.bedInspected) {
            bed?.classList.add("inspected");
        }

        if (state.figureInspected) {
            figure?.classList.add("inspected");
        }

        updateMusicBoxReadiness();
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

        if (state.gameCompleted) {
            showElement(chapterComplete);
        }
    }

    initializeRoom();

    /*
        Bu bölümde el feneri ve UV mekaniği kullanılmıyor - oda
        baştan itibaren tavandaki çatlaktan sızan sıcak ışıkla
        aydınlık.
    */

});
