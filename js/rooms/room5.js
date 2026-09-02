"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
BÖLÜM 5 — AMELİYATHANE

UYUMLULUK
- room5.html içindeki gerçek ID'lerle eşleşir.
- AshvaleSave kayıt sistemiyle çalışır.
- AshvaleInventory ortak envanter sistemini kullanır.
- AshvaleAudio ve AshvaleDialogue varsa bunlara bağlanır.
- Bu sistemler yüklenmese bile temel bölüm akışı çalışmaya devam eder.
=========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       SABİTLER
    ===================================================== */

    const CHAPTER_NUMBER = 5;
    const NEXT_CHAPTER_NUMBER = 6;

    const CABINET_KEY_ID = "surgery-cabinet-key";
    const UV_FLASHLIGHT_ID = "uv-flashlight";

    const CABINET_KEY_ITEM = {
        id: CABINET_KEY_ID,
        name: "Alet Dolabı Anahtarı",
        description: "Örtülü sedyenin altında bulunan, alet dolabına ait ince bir anahtar.",
        icon: "images/ui/inventory/surgery-key.png",
        consumable: false
    };

    const UV_FLASHLIGHT_ITEM = {
        id: UV_FLASHLIGHT_ID,
        name: "UV Muayene Feneri",
        description: "Eski bir UV muayene feneri. Envanterden tıklayınca açılıp kapanıyor - normal ışıkta görünmeyen izler duvarlarda ortaya çıkabilir.",
        icon: "images/ui/inventory/uv-flashlight.png",
        consumable: false
    };

    /*
        Duvarlardaki her sembolün altında gizli bir rakam var.
        Kapı kodu, bu dört rakamın güvenlik monitöründe gösterilen
        sembol sırasına göre dizilmiş hâlidir.
    */
    const CORRECT_DOOR_CODE = ["4", "0", "5", "2"];

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

    const room = getElement("room");
    const intro = getElement("chapter-intro");
    const playerNameElement = getElement("playerName");
    const menuButton = getElement("menuButton");

    /* =====================================================
       HOTSPOTLAR
    ===================================================== */

    const operatingTable = getElement("operatingTable");
    const coveredGurney = getElement("coveredGurney");
    const instrumentCabinet = getElement("instrumentCabinet");
    const xrayPanel = getElement("xrayPanel");
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
       ANAHTAR POPUP
    ===================================================== */

    const foundCabinetKey = getElement("foundCabinetKey");
    const collectCabinetKey = getElement("collectCabinetKey");

    /* =====================================================
       ALET DOLABI / UV FENERİ
    ===================================================== */

    const cabinetViewer = getElement("cabinetViewer");
    const closeCabinetViewer = getElement("closeCabinetViewer");
    const collectUvFlashlight = getElement("collectUvFlashlight");

    const foundUvFlashlight = getElement("foundUvFlashlight");
    const closeFoundUvFlashlight = getElement("closeFoundUvFlashlight");

    /* =====================================================
       GÜVENLİK MONİTÖRÜ
    ===================================================== */

    const monitorViewer = getElement("monitorViewer");
    const closeMonitorViewer = getElement("closeMonitorViewer");
    const closeMonitorViewerFooter = getElement("closeMonitorViewerFooter");
    const monitorStatic = getElement("monitorStatic");
    const monitorRevealButton = getElement("monitorRevealButton");

    /* =====================================================
       KAPI TUŞ TAKIMI
    ===================================================== */

    const trayPanel = getElement("trayPanel");
    const closeTrayPanel = getElement("closeTrayPanel");
    const trayButtons = getElement("trayButtons");
    const traySlots = getElement("traySlots");
    const trayMessage = getElement("trayMessage");

    /* =====================================================
       MOR IŞIK (UV) İŞARETLERİ
    ===================================================== */

    const uvOverlay = getElement("uvOverlay");
    const uvMarks = Array.from(document.querySelectorAll(".uv-mark"));

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
        gurneyInspected: false,
        keyCollected: false,
        cabinetUnlocked: false,
        uvFlashlightCollected: false,
        uvActive: false,
        monitorViewed: false,
        doorUnlocked: false,
        chapterCompleted: false,
        wrongCodeAttempts: 0,
        doorCodeInput: [],
        modalOpen: false,
        activeHotspot: null,
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
        state.gurneyInspected =
            safeGet("chapter5GurneyInspected", false) === true;

        state.keyCollected =
            safeGet("chapter5KeyCollected", false) === true;

        state.cabinetUnlocked =
            safeGet("chapter5CabinetUnlocked", false) === true;

        state.uvFlashlightCollected =
            safeGet("chapter5UvFlashlightCollected", false) === true;

        state.monitorViewed =
            safeGet("chapter5MonitorViewed", false) === true;

        state.doorUnlocked =
            safeGet("chapter5DoorUnlocked", false) === true;

        state.chapterCompleted =
            safeGet("chapter5Completed", false) === true;

        state.wrongCodeAttempts =
            Number(safeGet("chapter5WrongCodeAttempts", 0)) || 0;
    }

    function saveState() {
        safeSet("chapter5GurneyInspected", state.gurneyInspected);
        safeSet("chapter5KeyCollected", state.keyCollected);
        safeSet("chapter5CabinetUnlocked", state.cabinetUnlocked);
        safeSet("chapter5UvFlashlightCollected", state.uvFlashlightCollected);
        safeSet("chapter5MonitorViewed", state.monitorViewed);
        safeSet("chapter5DoorUnlocked", state.doorUnlocked);
        safeSet("chapter5Completed", state.chapterCompleted);
        safeSet("chapter5WrongCodeAttempts", state.wrongCodeAttempts);
    }

    /* =====================================================
       ENVANTER YARDIMCILARI
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
                    storageKey: "chapter5Inventory",
                    slots: 6
                });
            } catch (error) {
                console.warn("Ortak envanter başlatılamadı.", error);
            }
        }

        synchronizeInventory();
        renderFallbackInventory();
    }

    function inventoryHas(itemId) {
        if (
            inventory &&
            typeof inventory.has === "function"
        ) {
            try {
                return inventory.has(itemId);
            } catch (error) {
                console.warn("Envanter kontrolü başarısız.", error);
            }
        }

        const currentSave =
            save && typeof save.getSave === "function"
                ? save.getSave()
                : null;

        return Boolean(
            currentSave?.player?.inventory?.some(
                item => item?.id === itemId
            )
        );
    }

    function inventoryAdd(item) {
        if (inventoryHas(item.id)) {
            return false;
        }

        if (
            inventory &&
            typeof inventory.add === "function"
        ) {
            try {
                inventory.add(item);
                renderFallbackInventory();
                return true;
            } catch (error) {
                console.warn("Ortak envantere eşya eklenemedi.", error);
            }
        }

        try {
            const currentSave =
                save && typeof save.getSave === "function"
                    ? save.getSave()
                    : null;

            const existingItems =
                Array.isArray(currentSave?.player?.inventory)
                    ? currentSave.player.inventory
                    : [];

            const nextItems = [
                ...existingItems.filter(
                    existingItem => existingItem?.id !== item.id
                ),
                item
            ];

            if (
                save &&
                typeof save.setInventory === "function"
            ) {
                save.setInventory(nextItems);
            } else {
                safeSet("playerInventory", nextItems);
            }

            renderFallbackInventory();
            return true;
        } catch (error) {
            console.warn("Yedek envantere eşya eklenemedi.", error);
            return false;
        }
    }

    function synchronizeInventory() {
        if (state.keyCollected && !inventoryHas(CABINET_KEY_ID)) {
            inventoryAdd(CABINET_KEY_ITEM);
        }

        if (state.uvFlashlightCollected && !inventoryHas(UV_FLASHLIGHT_ID)) {
            inventoryAdd(UV_FLASHLIGHT_ITEM);
        }

        if (inventoryHas(CABINET_KEY_ID)) {
            state.keyCollected = true;
        }

        if (inventoryHas(UV_FLASHLIGHT_ID)) {
            state.uvFlashlightCollected = true;
        }

        saveState();
    }

    function renderFallbackInventory() {
        if (
            !inventorySlots ||
            (
                inventory &&
                typeof inventory.initialize === "function"
            )
        ) {
            return;
        }

        const items = [];

        if (state.keyCollected) {
            items.push(CABINET_KEY_ITEM);
        }

        if (state.uvFlashlightCollected) {
            items.push(UV_FLASHLIGHT_ITEM);
        }

        inventorySlots.innerHTML = "";

        for (let index = 0; index < 6; index += 1) {
            const slot = document.createElement("button");
            slot.type = "button";
            slot.className = "inventory-slot";

            const item = items[index];

            if (!item) {
                slot.classList.add("inventory-empty");
                slot.disabled = true;
                slot.setAttribute("aria-label", "Boş envanter alanı");
                inventorySlots.appendChild(slot);
                continue;
            }

            slot.dataset.itemId = item.id;
            slot.title = `${item.name}: ${item.description}`;
            slot.setAttribute("aria-label", item.name);

            const image = document.createElement("img");
            image.src = item.icon;
            image.alt = item.name;

            slot.appendChild(image);

            slot.addEventListener("click", () => {
                showDialogue(item.name, item.description);

                if (item.id === UV_FLASHLIGHT_ID) {
                    toggleUvLight();
                }
            });

            inventorySlots.appendChild(slot);
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
                    chapter5Ambience: {
                        src: "assets/audio/ambience/chapter2_ambient.mp3",
                        type: "ambience",
                        loop: true,
                        volume: 0.6
                    },
                    clothMove: {
                        src: "assets/audio/effects/cloth_move.mp3",
                        type: "effect",
                        volume: 0.5
                    },
                    keyPickup: {
                        src: "assets/audio/effects/key_pickup.mp3",
                        type: "effect",
                        volume: 0.58
                    },
                    cabinetLocked: {
                        src: "assets/audio/effects/locked.mp3",
                        type: "effect",
                        volume: 0.58
                    },
                    cabinetOpen: {
                        src: "assets/audio/effects/cabinet.mp3",
                        type: "effect",
                        volume: 0.64
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
                        volume: 0.63
                    },
                    scare: {
                        src: "assets/audio/effects/scare.mp3",
                        type: "effect",
                        volume: 0.76
                    }
                }
            });

            if (typeof audio.playAmbience === "function") {
                audio.playAmbience("chapter5Ambience");
            }
        } catch (error) {
            console.warn("Room5 ses sistemi başlatılamadı.", error);
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
            foundCabinetKey,
            cabinetViewer,
            foundUvFlashlight,
            monitorViewer,
            trayPanel,
            dialogElement,
            chapterComplete
        ].some(isVisible);
    }

    function closeAllPanels() {
        hideElement(foundCabinetKey);
        hideElement(cabinetViewer);
        hideElement(foundUvFlashlight);
        hideElement(monitorViewer);
        hideElement(trayPanel);
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

        if (state.keyCollected) count += 1;
        if (state.uvFlashlightCollected) count += 1;
        if (state.monitorViewed) count += 1;
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
                "Ameliyathane'nin çıkış kapısını açtın.",
                "Duvardaki gizli kodu çözüp kilidi açtın. Koridorun ötesinde yeni bir kanat seni bekliyor."
            );

            updateProgress();
            return;
        }

        if (!state.keyCollected) {
            setObjective(
                "Örtülü sedyeyi incele.",
                "Ameliyathanenin ortasında, üzeri örtülmüş bir sedye duruyor. Örtünün altında bir şey olabilir."
            );

            updateProgress();
            return;
        }

        if (!state.uvFlashlightCollected) {
            setObjective(
                "Bulduğun anahtarla alet dolabını aç.",
                "Duvardaki kilitli alet dolabı, anahtara uyabilir."
            );

            updateProgress();
            return;
        }

        if (!state.monitorViewed) {
            setObjective(
                "Güvenlik monitörünü incele.",
                "Elektrik geri geldiğinden beri monitörlerden biri bozuk bir görüntü gösteriyor."
            );

            updateProgress();
            return;
        }

        if (!state.doorUnlocked) {
            setObjective(
                "Duvarlardaki gizli işaretleri UV feneriyle bul, monitördeki sırayla kapı koduna çevir.",
                "UV fenerini envanterden tıklayıp aç. Normal ışıkta görünmeyen işaretler duvarlarda beliriyor - her birinin yanında bir rakam var. Güvenlik monitöründeki bozuk kayıt, bu işaretlerin doğru sırasını gösteriyor."
            );

            updateProgress();
            return;
        }

        updateProgress();
    }

    /* =====================================================
       SEDYE VE ANAHTAR
    ===================================================== */

    function inspectGurney() {
        state.gurneyInspected = true;
        saveState();

        playEffect("clothMove");

        if (state.keyCollected || inventoryHas(CABINET_KEY_ID)) {
            state.keyCollected = true;
            saveState();

            showDialogue(
                "Örtülü Sedye",
                "Örtünün altı artık boş. Anahtarı daha önce aldın."
            );

            return;
        }

        showElement(foundCabinetKey);
        triggerLightFlicker();
    }

    function collectKey() {
        const added = inventoryAdd(CABINET_KEY_ITEM);

        state.keyCollected = true;
        saveState();
        updateObjective();

        playEffect("keyPickup");
        hideElement(foundCabinetKey);

        if (added) {
            playDialogue([
                {
                    speaker: "Alet Dolabı Anahtarı",
                    text: "Örtünün altında, sıkıca kavranmış gibi duran ince bir anahtar buldun.",
                    speed: 20
                },
                {
                    speaker: "",
                    text: "Örtü hâlâ ılık — sanki üzerinden az önce biri kalkmış.",
                    speed: 20
                }
            ]);
        } else {
            showDialogue(
                "Alet Dolabı Anahtarı",
                "Anahtar zaten envanterinde."
            );
        }
    }

    /* =====================================================
       ALET DOLABI
    ===================================================== */

    function inspectCabinet() {
        if (
            !state.keyCollected &&
            !inventoryHas(CABINET_KEY_ID)
        ) {
            playEffect("cabinetLocked");

            showDialogue(
                "Alet Dolabı",
                "Cam kapaklı dolap kilitli. Küçük bir anahtar deliği var."
            );

            return;
        }

        if (!state.cabinetUnlocked) {
            state.cabinetUnlocked = true;
            saveState();

            playEffect("cabinetOpen");
            triggerLightFlicker();

            playDialogue([
                {
                    speaker: "Alet Dolabı",
                    text: "Anahtar kilitte gıcırdayarak dönüyor.",
                    speed: 20
                },
                {
                    speaker: "",
                    text: "İçeride, aletlerin arasına sıkışmış küçük bir UV muayene feneri duruyor.",
                    speed: 20
                }
            ]);
        }

        updateObjective();

        window.setTimeout(() => {
            showElement(cabinetViewer);
            refreshUvFlashlightButton();
        }, state.cabinetUnlocked ? 180 : 0);
    }

    function closeCabinetView() {
        hideElement(cabinetViewer);
    }

    function collectUvFlashlightItem() {
        if (
            state.uvFlashlightCollected ||
            inventoryHas(UV_FLASHLIGHT_ID)
        ) {
            state.uvFlashlightCollected = true;
            saveState();
            refreshUvFlashlightButton();
            hideElement(cabinetViewer);

            showDialogue(
                "UV Muayene Feneri",
                "Fener zaten envanterinde. Envanterden tıklayıp açabilirsin."
            );

            return;
        }

        inventoryAdd(UV_FLASHLIGHT_ITEM);

        state.uvFlashlightCollected = true;
        saveState();

        playEffect("paperPickup");
        refreshUvFlashlightButton();
        updateObjective();

        hideElement(cabinetViewer);
        showElement(foundUvFlashlight);

        window.setTimeout(() => {
            triggerMovingShadow();
            playEffect("footsteps");
        }, 500);
    }

    function refreshUvFlashlightButton() {
        if (!collectUvFlashlight) {
            return;
        }

        const collected =
            state.uvFlashlightCollected ||
            inventoryHas(UV_FLASHLIGHT_ID);

        collectUvFlashlight.textContent =
            collected ? "ENVANTERDE" : "ENVANTERE EKLE";

        collectUvFlashlight.disabled = collected;
    }

    /* =====================================================
       GÜVENLİK MONİTÖRÜ
    ===================================================== */

    function inspectMonitor() {
        showElement(monitorViewer);

        if (monitorStatic) {
            monitorStatic.classList.remove("monitor-static--cleared");
        }
    }

    function revealMonitorFootage() {
        playEffect("keypadPress");

        monitorStatic?.classList.add("monitor-static--cleared");

        if (!state.monitorViewed) {
            state.monitorViewed = true;
            saveState();
            updateObjective();

            window.setTimeout(() => {
                triggerLightFlicker();
            }, 400);
        }
    }

    function closeMonitorView() {
        hideElement(monitorViewer);
    }

    /* =====================================================
       RÖNTGEN PANOSU (ATMOSFER — BULMACA İÇERMİYOR)
    ===================================================== */

    function inspectXrayPanel() {
        playDialogue([
            {
                speaker: "Röntgen Panosu",
                text: "Duvardaki ışık kutusuna asılı bir film var - bir göğüs röntgeni. Kaburgaların arasında, olmaması gereken bir gölge duruyor.",
                speed: 20
            },
            {
                speaker: "",
                text: "Köşesine küçük harflerle 'A-317' yazılmış. Gölgenin kenarları pürüzsüz değil - sanki büyürken etrafındaki dokuyu da kendine katmış.",
                speed: 20
            }
        ]);
    }

    /* =====================================================
       MOR IŞIK (UV)
    ===================================================== */

    function toggleUvLight() {
        if (!inventoryHas(UV_FLASHLIGHT_ID)) {
            return;
        }

        state.uvActive = !state.uvActive;

        document.body.classList.toggle("uv-active", state.uvActive);

        playEffect("keypadPress");

        if (state.uvActive) {
            showDialogue(
                "UV Muayene Feneri",
                "Işığı açtın. Oda mor bir tonla aydınlanıyor - duvarlara dikkatlice bak."
            );
        }
    }

    function inspectUvMark(mark) {
        if (!state.uvActive) {
            return;
        }

        const symbol = mark.dataset.symbol || "?";
        const digit = mark.dataset.digit || "?";

        mark.classList.add("found");

        showDialogue(
            "Duvardaki İz",
            `Solgun bir ışıkla çizilmiş bir işaret: ${symbol} — yanında tek bir rakam var: ${digit}.`
        );
    }

    /* =====================================================
       KAPI TUŞ TAKIMI
    ===================================================== */

    function openDoorKeypad() {
        state.doorCodeInput = [];
        updateCodeSlotsDisplay();
        setTrayMessage("");
        showElement(trayPanel);
    }

    function closeTray() {
        hideElement(trayPanel);
    }

    function updateCodeSlotsDisplay() {
        if (!traySlots) {
            return;
        }

        const slotElements = traySlots.querySelectorAll("span");

        slotElements.forEach((slotElement, index) => {
            const digit = state.doorCodeInput[index];

            slotElement.textContent = digit || "_";
        });
    }

    function setTrayMessage(text, type = "") {
        if (!trayMessage) {
            return;
        }

        trayMessage.textContent = text;
        trayMessage.classList.remove("error", "is-error", "success", "is-success");

        if (type === "error") {
            trayMessage.classList.add("error", "is-error");
        }

        if (type === "success") {
            trayMessage.classList.add("success", "is-success");
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

            setTrayMessage(
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
        setTrayMessage("");

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

        setTrayMessage("KOD DOĞRU — KİLİT AÇILDI", "success");

        triggerLightFlicker();
        updateObjective();

        window.setTimeout(() => {
            hideElement(trayPanel);

            state.awaitingDoorTransition = true;

            playDialogue([
                {
                    speaker: "Kapı Mekanizması",
                    text: "Kilit açılırken, üstündeki eski bir uyarı levhası da aydınlanıyor: “İŞLEM 3179 — DURDURULDU.”",
                    speed: 20
                },
                {
                    speaker: "",
                    text: "Levhanın altına, elle kazınmış gibi tek bir söz eklenmiş: “Doku ayrılmadı.”",
                    speed: 22
                }
            ]);
        }, 950);
    }

    /* =====================================================
       ÇIKIŞ KAPISI
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

        safeSet("chapter5Completed", true);
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
            "room6.html";

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
        if (!state.keyCollected) {
            showDialogue(
                "İpucu",
                "Odanın ortasındaki örtülü sedyeyi incele."
            );

            return;
        }

        if (!state.uvFlashlightCollected) {
            showDialogue(
                "İpucu",
                "Anahtarı alet dolabında dene."
            );

            return;
        }

        if (!state.monitorViewed) {
            showDialogue(
                "İpucu",
                "Duvarlara bakmadan önce güvenlik monitörünü kontrol et - orada bir sıralama var."
            );

            return;
        }

        if (!state.doorUnlocked) {
            const foundCount =
                uvMarks.filter(mark => mark.classList.contains("found")).length;

            if (foundCount < uvMarks.length) {
                showDialogue(
                    "İpucu",
                    "UV fenerini envanterden tıklayıp aç, sonra duvarları tek tek incele. Normal ışıkta görünmeyen işaretler beliriyor."
                );

                return;
            }

            showDialogue(
                "İpucu",
                "Monitördeki sembol sırasını hatırla; her sembolün altında bulduğun rakamı o sırayla kapı tuş takımına gir."
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
            operatingTable,
            "Ameliyat Masasını İncele",
            () => showDialogue(
                "Ameliyat Masası",
                "Kayışlar hâlâ tokalı, ama kopmamış — ortalarından yırtılmış. Sanki biri dışarıdan değil, içeriden zorlamış."
            )
        );

        registerInteraction(
            coveredGurney,
            "Örtülü Sedyeyi İncele",
            inspectGurney
        );

        registerInteraction(
            instrumentCabinet,
            "Alet Dolabını İncele",
            inspectCabinet
        );

        registerInteraction(
            xrayPanel,
            "Röntgen Panosunu İncele",
            inspectXrayPanel
        );

        registerInteraction(
            securityMonitor,
            "Güvenlik Monitörünü İncele",
            inspectMonitor
        );

        registerInteraction(
            exitDoor,
            "Çıkış Kapısını İncele",
            inspectExitDoor
        );

        collectCabinetKey?.addEventListener("click", collectKey);

        closeCabinetViewer?.addEventListener("click", closeCabinetView);
        collectUvFlashlight?.addEventListener("click", collectUvFlashlightItem);

        closeFoundUvFlashlight?.addEventListener("click", () => {
            hideElement(foundUvFlashlight);

            playDialogue([
                {
                    speaker: "UV Muayene Feneri",
                    text: "Fenerin düğmesine envanterden basınca açılıp kapanıyor.",
                    speed: 20
                },
                {
                    speaker: "",
                    text: "Işığı odanın duvarlarında gezdirmeye değer.",
                    speed: 20
                }
            ]);
        });

        monitorRevealButton?.addEventListener("click", revealMonitorFootage);
        closeMonitorViewer?.addEventListener("click", closeMonitorView);
        closeMonitorViewerFooter?.addEventListener("click", closeMonitorView);

        trayButtons
            ?.querySelectorAll("[data-digit]")
            .forEach(button => {
                button.addEventListener("click", () => {
                    pickDigit(button.dataset.digit);
                });
            });

        uvMarks.forEach(mark => {
            mark.addEventListener("click", () => inspectUvMark(mark));
        });

        window.addEventListener("ashvale:inventory-item-open", event => {
            if (event.detail?.item?.id === UV_FLASHLIGHT_ID) {
                toggleUvLight();
            }
        });

        closeTrayPanel?.addEventListener("click", closeTray);

        hintButton?.addEventListener("click", showHint);

        dialogContinue?.addEventListener("click", nextDialogue);
        dialogClose?.addEventListener("click", hideDialogue);

        nextChapter?.addEventListener("click", goToNextChapter);
        menuButton?.addEventListener("click", returnToMenu);

        cabinetViewer?.addEventListener("click", event => {
            if (event.target === cabinetViewer) {
                closeCabinetView();
            }
        });

        monitorViewer?.addEventListener("click", event => {
            if (event.target === monitorViewer) {
                closeMonitorView();
            }
        });

        trayPanel?.addEventListener("click", event => {
            if (event.target === trayPanel) {
                closeTray();
            }
        });

        setupKeyboardInteraction();
    }

    /* =====================================================
       KAYITLI GÖRÜNÜMÜ EŞLEŞTİR
    ===================================================== */

    function restoreVisualState() {
        if (state.cabinetUnlocked) {
            instrumentCabinet?.classList.add("unlocked");
        }

        if (state.keyCollected) {
            coveredGurney?.classList.add("searched");
        }

        if (state.monitorViewed) {
            securityMonitor?.classList.add("inspected");
        }

        if (state.doorUnlocked || state.chapterCompleted) {
            exitDoor?.classList.add("unlocked");
        }

        refreshUvFlashlightButton();
        updateCodeSlotsDisplay();
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
        Hastanenin elektriği Bölüm 4'ün sonunda geri geldiği için
        Bölüm 5'te el feneri mekaniği kullanılmıyor - oda baştan
        itibaren normal şekilde aydınlık.
    */

});
