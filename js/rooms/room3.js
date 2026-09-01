"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
BÖLÜM 3 — TEDAVİ KANADI

UYUMLULUK
- room3.html içindeki gerçek ID'lerle eşleşir.
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

    const CHAPTER_NUMBER = 3;
    const NEXT_CHAPTER_NUMBER = 4;
    const DOOR_CODE = "83517";

    const CABINET_KEY_ID = "medicine-cabinet-key";
    const MEDICINE_LIST_ID = "medicine-list";

    const CABINET_KEY_ITEM = {
        id: CABINET_KEY_ID,
        name: "İlaç Dolabı Anahtarı",
        description: "Tedavi Kanadı'ndaki kilitli ilaç dolabını açan küçük ve paslı anahtar.",
        icon: "images/ui/inventory/key.png",
        consumable: false
    };

    const MEDICINE_LIST_ITEM = {
        id: MEDICINE_LIST_ID,
        name: "İlaç Eşleştirme Listesi",
        description: "Hastalıkların ilaç numaralarıyla eşleşmesini gösterir: Astım 7, Diyabet 1, Ateş 8, Kalp Yetmezliği 5, Enfeksiyon 3.",
        icon: "images/ui/inventory/medicine-list.png",
        consumable: false
    };

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

    const bedPillow = getElement("bedPillow");
    const medicineCabinet = getElement("medicineCabinet");
    const treatmentBoard = getElement("treatmentBoard");
    const doorKeypad = getElement("doorKeypad");
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
       TEDAVİ PANOSU
    ===================================================== */

    const treatmentBoardViewer = getElement("treatmentBoardViewer");
    const closeTreatmentBoard = getElement("closeTreatmentBoard");
    const closeTreatmentBoardFooter = getElement("closeTreatmentBoardFooter");

    /* =====================================================
       İLAÇ DOLABI VE LİSTE
    ===================================================== */

    const medicineCabinetViewer = getElement("medicineCabinetViewer");
    const closeMedicineCabinet = getElement("closeMedicineCabinet");
    const collectMedicineList = getElement("collectMedicineList");

    const foundMedicineList = getElement("foundMedicineList");
    const closeFoundMedicineList = getElement("closeFoundMedicineList");

    /* =====================================================
       KAPI ŞİFRE PANELİ
    ===================================================== */

    const doorCodePanel = getElement("doorCodePanel");
    const doorCodeDisplay = getElement("doorCodeDisplay");
    const doorKeypadButtons = getElement("doorKeypadButtons");
    const clearDoorCode = getElement("clearDoorCode");
    const submitDoorCode = getElement("submitDoorCode");
    const closeDoorCode = getElement("closeDoorCode");
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
        pillowInspected: false,
        keyCollected: false,
        cabinetUnlocked: false,
        treatmentBoardRead: false,
        medicineListCollected: false,
        doorUnlocked: false,
        chapterCompleted: false,
        wrongDoorAttempts: 0,
        doorCodeInput: "",
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
        state.pillowInspected =
            safeGet("chapter3PillowInspected", false) === true;

        state.keyCollected =
            safeGet("chapter3KeyCollected", false) === true;

        state.cabinetUnlocked =
            safeGet("chapter3CabinetUnlocked", false) === true;

        state.treatmentBoardRead =
            safeGet("chapter3TreatmentBoardRead", false) === true;

        state.medicineListCollected =
            safeGet("chapter3MedicineListCollected", false) === true;

        state.doorUnlocked =
            safeGet("chapter3DoorUnlocked", false) === true;

        state.chapterCompleted =
            safeGet("chapter3Completed", false) === true;

        state.wrongDoorAttempts =
            Number(safeGet("chapter3WrongDoorAttempts", 0)) || 0;
    }

    function saveState() {
        safeSet("chapter3PillowInspected", state.pillowInspected);
        safeSet("chapter3KeyCollected", state.keyCollected);
        safeSet("chapter3CabinetUnlocked", state.cabinetUnlocked);
        safeSet("chapter3TreatmentBoardRead", state.treatmentBoardRead);
        safeSet("chapter3MedicineListCollected", state.medicineListCollected);
        safeSet("chapter3DoorUnlocked", state.doorUnlocked);
        safeSet("chapter3Completed", state.chapterCompleted);
        safeSet("chapter3WrongDoorAttempts", state.wrongDoorAttempts);
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
                    storageKey: "chapter3Inventory",
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

        if (
            state.medicineListCollected &&
            !inventoryHas(MEDICINE_LIST_ID)
        ) {
            inventoryAdd(MEDICINE_LIST_ITEM);
        }

        if (inventoryHas(CABINET_KEY_ID)) {
            state.keyCollected = true;
        }

        if (inventoryHas(MEDICINE_LIST_ID)) {
            state.medicineListCollected = true;
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

        if (state.medicineListCollected) {
            items.push(MEDICINE_LIST_ITEM);
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
                    chapter3Ambience: {
                        src: "assets/audio/ambience/chapter3_ambient.mp3",
                        type: "ambience",
                        loop: true,
                        volume: 0.62
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
                audio.playAmbience("chapter3Ambience");
            }
        } catch (error) {
            console.warn("Room3 ses sistemi başlatılamadı.", error);
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
            treatmentBoardViewer,
            medicineCabinetViewer,
            foundMedicineList,
            doorCodePanel,
            dialogElement,
            chapterComplete
        ].some(isVisible);
    }

    function closeAllPanels() {
        hideElement(foundCabinetKey);
        hideElement(treatmentBoardViewer);
        hideElement(medicineCabinetViewer);
        hideElement(foundMedicineList);
        hideElement(doorCodePanel);
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
                dialogue.show({
                    speaker,
                    text,
                    speed
                });

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

    /*
    Eski modal değeri takılı kalmış olabilir.
    Her tıklamada ekranda gerçekten açık panel var mı
    yeniden kontrol edilir.
    */
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

        if (state.keyCollected) {
            count += 1;
        }

        if (state.cabinetUnlocked) {
            count += 1;
        }

        if (state.treatmentBoardRead) {
            count += 1;
        }

        if (state.medicineListCollected) {
            count += 1;
        }

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

        objectiveProgress?.classList.toggle(
            "completed",
            count >= 4
        );
    }

    function updateObjective() {
        if (state.chapterCompleted) {
            setObjective(
                "Tedavi Kanadı'nın çıkış kapısını açtın.",
                "Hastalarla ilaçları doğru biçimde eşleştirdin. Koridorun ötesinde yeni bir bölüm seni bekliyor."
            );

            updateProgress();
            return;
        }

        if (!state.keyCollected) {
            setObjective(
                "Hasta yatağındaki yastığı incele.",
                "Odada bir şeyin aceleyle saklandığı belli. Yatağın çevresini dikkatlice araştır."
            );

            updateProgress();
            return;
        }

        if (!state.cabinetUnlocked) {
            setObjective(
                "Bulduğun anahtarla ilaç dolabını aç.",
                "Masanın üstündekianahtar, duvardaki kilitli ilaç dolabına ait olabilir."
            );

            updateProgress();
            return;
        }

        if (!state.treatmentBoardRead) {
            setObjective(
                "Duvardaki tedavi kayıt panosunu incele.",
                "İlaçlar numaralandırılmış. Doğru sıralamayı öğrenmek için hasta kayıtlarına bakmalısın."
            );

            updateProgress();
            return;
        }

        if (!state.medicineListCollected) {
            setObjective(
                "İlaç eşleştirme listesini envanterine ekle.",
                "Hasta sırası ile ilaç numaralarını birlikte kullanman gerekecek."
            );

            updateProgress();
            return;
        }

        setObjective(
            "Hasta sırasına göre beş haneli kapı kodunu oluştur.",
            "Pano hastalıkların sırasını, ilaç listesi ise her hastalığın numarasını gösteriyor."
        );

        updateProgress();
    }

    function setObjective(objective, story) {
        if (objectiveText) {
            objectiveText.textContent = objective;
        }

        if (storyText && story) {
            storyText.textContent = story;
        }
    }

    /* =====================================================
       YASTIK VE ANAHTAR
    ===================================================== */

    function inspectPillow() {
        state.pillowInspected = true;
        saveState();

        playEffect("clothMove");

        if (state.keyCollected || inventoryHas(CABINET_KEY_ID)) {
            state.keyCollected = true;
            saveState();

            showDialogue(
                "Hasta Yatağı",
                "Masanın üstü artık boş. Küçük anahtarı daha önce aldın."
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
                    speaker: "İlaç Dolabı Anahtarı",
                    text: "Masanın üstüne saklanmış küçük anahtarı envanterine ekledin.",
                    speed: 20
                },
                {
                    speaker: "",
                    text: "Anahtarın üzerindeki soluk etikette “ECZANE” yazıyor.",
                    speed: 20
                }
            ]);
        } else {
            showDialogue(
                "İlaç Dolabı Anahtarı",
                "Anahtar zaten envanterinde."
            );
        }
    }

    /* =====================================================
       İLAÇ DOLABI
    ===================================================== */

    function inspectMedicineCabinet() {
        if (
            !state.keyCollected &&
            !inventoryHas(CABINET_KEY_ID)
        ) {
            playEffect("cabinetLocked");

            showDialogue(
                "İlaç Dolabı",
                "Metal dolap kilitli. Küçük bir anahtar deliği var."
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
                    speaker: "İlaç Dolabı",
                    text: "Paslı anahtar kilitte güçlükle dönüyor.",
                    speed: 20
                },
                {
                    speaker: "",
                    text: "Kapak açıldığında içeride numaralandırılmış eski bir ilaç listesi görüyorsun.",
                    speed: 20
                }
            ]);
        }

        updateObjective();

        window.setTimeout(() => {
            showElement(medicineCabinetViewer);
            refreshMedicineListButton();
        }, state.cabinetUnlocked ? 180 : 0);
    }

    function closeMedicineViewer() {
        hideElement(medicineCabinetViewer);
    }

    function collectMedicineListItem() {
        if (
            state.medicineListCollected ||
            inventoryHas(MEDICINE_LIST_ID)
        ) {
            state.medicineListCollected = true;
            saveState();
            refreshMedicineListButton();
            hideElement(medicineCabinetViewer);

            showDialogue(
                "İlaç Eşleştirme Listesi",
                "Liste zaten envanterinde. Hastalıkları hasta sırasına göre eşleştir."
            );

            return;
        }

        inventoryAdd(MEDICINE_LIST_ITEM);

        state.medicineListCollected = true;
        saveState();

        playEffect("paperPickup");
        refreshMedicineListButton();
        updateObjective();

        hideElement(medicineCabinetViewer);
        showElement(foundMedicineList);

        window.setTimeout(() => {
            triggerMovingShadow();
            playEffect("footsteps");
        }, 500);
    }

    function refreshMedicineListButton() {
        if (!collectMedicineList) {
            return;
        }

        const collected =
            state.medicineListCollected ||
            inventoryHas(MEDICINE_LIST_ID);

        collectMedicineList.textContent =
            collected
                ? "ENVANTERDE"
                : "ENVANTERE EKLE";

        collectMedicineList.disabled = collected;
    }

    /* =====================================================
       TEDAVİ PANOSU
    ===================================================== */

    function inspectTreatmentBoard() {
        if (!state.treatmentBoardRead) {
            state.treatmentBoardRead = true;
            saveState();
            updateObjective();

            window.setTimeout(() => {
                triggerHallwayFigure();
            }, 650);
        }

        showElement(treatmentBoardViewer);
    }

    function closeTreatmentBoardViewer() {
        hideElement(treatmentBoardViewer);
    }

    /* =====================================================
       KAPI ŞİFRESİ
    ===================================================== */

    function openDoorCodePanel() {
        state.doorCodeInput = "";
        updateDoorCodeDisplay();
        setDoorCodeMessage("");

        if (
            !state.treatmentBoardRead ||
            !state.medicineListCollected
        ) {
            showDialogue(
                "Güvenlik Paneli",
                "Beş haneli kodu çözmek için hem tedavi kayıt panosunu hem de ilaç eşleştirme listesini incelemelisin."
            );

            return;
        }

        showElement(doorCodePanel);
    }

    function addDoorDigit(digit) {
        if (
            state.doorCodeInput.length >= DOOR_CODE.length ||
            !/^\d$/.test(String(digit))
        ) {
            return;
        }

        playEffect("keypadPress");

        state.doorCodeInput += String(digit);
        updateDoorCodeDisplay();
        setDoorCodeMessage("");
    }

    function clearDoorInput() {
        state.doorCodeInput = "";
        updateDoorCodeDisplay();
        setDoorCodeMessage("");
        playEffect("keypadPress");
    }

    function updateDoorCodeDisplay() {
        if (!doorCodeDisplay) {
            return;
        }

        const digitElements =
            doorCodeDisplay.querySelectorAll("span");

        digitElements.forEach((digitElement, index) => {
            digitElement.textContent =
                state.doorCodeInput[index] || "_";
        });
    }

    function setDoorCodeMessage(text, type = "") {
        if (!doorCodeMessage) {
            return;
        }

        doorCodeMessage.textContent = text;
        doorCodeMessage.classList.remove(
            "error",
            "success",
            "is-error",
            "is-success"
        );

        if (type === "error") {
            doorCodeMessage.classList.add("error", "is-error");
        }

        if (type === "success") {
            doorCodeMessage.classList.add("success", "is-success");
        }
    }

    function submitDoorInput() {
        if (state.doorCodeInput.length !== DOOR_CODE.length) {
            playEffect("keypadError");

            setDoorCodeMessage(
                "Kod beş haneli olmalıdır.",
                "error"
            );

            return;
        }

        if (state.doorCodeInput !== DOOR_CODE) {
            state.wrongDoorAttempts += 1;
            state.doorCodeInput = "";
            saveState();

            playEffect("keypadError");
            updateDoorCodeDisplay();

            setDoorCodeMessage(
                "Kod reddedildi. Eşleştirmeyi yeniden kontrol et.",
                "error"
            );

            if (state.wrongDoorAttempts === 2) {
                triggerLightFlicker();
            }

            if (state.wrongDoorAttempts >= 3) {
                triggerScare();
            }

            return;
        }

        unlockDoor();
    }

    function unlockDoor() {
        if (state.doorUnlocked) {
            completeChapter();
            return;
        }

        state.doorUnlocked = true;
        state.chapterCompleted = true;
        saveState();

        playEffect("keypadSuccess");
        playEffect("doorUnlock");

        exitDoor?.classList.add("unlocked");

        setDoorCodeMessage(
            "KOD DOĞRULANDI — KİLİT AÇILDI",
            "success"
        );

        triggerLightFlicker();

        window.setTimeout(() => {
            hideElement(doorCodePanel);
            completeChapter();
        }, 950);
    }

    function inspectExitDoor() {
        if (state.doorUnlocked || state.chapterCompleted) {
            completeChapter();
            return;
        }

        if (
            state.treatmentBoardRead &&
            state.medicineListCollected
        ) {
            openDoorCodePanel();
            return;
        }

        showDialogue(
            "Çıkış Kapısı",
            "Kapı elektronik olarak kilitli. Yanındaki panel beş haneli bir tedavi kodu bekliyor."
        );
    }

    /* =====================================================
       İPUCU
    ===================================================== */

    function showHint() {
        if (!state.keyCollected) {
            showDialogue(
                "İpucu",
                "Hasta yatağındaki yastığın altına dikkatlice bak."
            );

            return;
        }

        if (!state.cabinetUnlocked) {
            showDialogue(
                "İpucu",
                "Bulduğun anahtarın üzerindeki “ECZANE” etiketi hangi kilide ait olduğunu gösteriyor."
            );

            return;
        }

        if (!state.treatmentBoardRead) {
            showDialogue(
                "İpucu",
                "Duvara sabitlenmiş panoda hastalıkların doğru sırası yazıyor."
            );

            return;
        }

        if (!state.medicineListCollected) {
            showDialogue(
                "İpucu",
                "Açtığın ilaç dolabındaki listeyi envanterine ekle."
            );

            return;
        }

        showDialogue(
            "İpucu",
            "Hastaları doğru ilaçlarla eşleştir. Pano sıralamayı, ilaç listesi ise her hastalığın rakamını veriyor."
        );
    }

    /* =====================================================
       ATMOSFER EFEKTLERİ
    ===================================================== */

    function activateTemporaryClass(
        element,
        className,
        duration = 1200
    ) {
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
        activateTemporaryClass(
            roomFlicker,
            "active",
            950
        );

        if (
            window.Effects &&
            typeof window.Effects.flicker === "function"
        ) {
            try {
                window.Effects.flicker("#room", 850);
            } catch {
                // CSS efekti yeterli.
            }
        }
    }

    function triggerMovingShadow() {
        activateTemporaryClass(
            movingShadow,
            "active",
            1700
        );
    }

    function triggerHallwayFigure() {
        activateTemporaryClass(
            hallwayFigure,
            "active",
            1400
        );
    }

    function triggerScare() {
        playEffect("scare");
        triggerLightFlicker();
        triggerHallwayFigure();
        triggerMovingShadow();

        if (
            window.Effects &&
            typeof window.Effects.shake === "function"
        ) {
            try {
                window.Effects.shake("#room", "medium");
            } catch {
                // CSS korku efektleri çalışmaya devam eder.
            }
        }
    }

    function scheduleAtmosphereEvents() {
        const firstTimer = window.setTimeout(() => {
            if (!state.modalOpen && !state.chapterCompleted) {
                triggerLightFlicker();
            }
        }, 9000);

        const secondTimer = window.setTimeout(() => {
            if (!state.modalOpen && !state.chapterCompleted) {
                triggerMovingShadow();
                playEffect("footsteps");
            }
        }, 18000);

        const interval = window.setInterval(() => {
            if (state.modalOpen || state.chapterCompleted) {
                return;
            }

            const random = Math.random();

            if (random < 0.5) {
                triggerLightFlicker();
            } else if (random < 0.82) {
                triggerMovingShadow();
            } else {
                triggerHallwayFigure();
            }
        }, 26000);

        window.addEventListener(
            "beforeunload",
            () => {
                window.clearTimeout(firstTimer);
                window.clearTimeout(secondTimer);
                window.clearInterval(interval);
            },
            { once: true }
        );
    }

    /* =====================================================
       BÖLÜM TAMAMLAMA
    ===================================================== */

    function completeChapter() {
        state.chapterCompleted = true;
        state.doorUnlocked = true;
        saveState();

        safeSet("chapter3Completed", true);
        safeSet("unlockedChapter", Math.max(
            Number(safeGet("unlockedChapter", 1)) || 1,
            NEXT_CHAPTER_NUMBER
        ));
        safeSet("currentChapter", NEXT_CHAPTER_NUMBER);
        safeSet("lastPlayedChapter", NEXT_CHAPTER_NUMBER);

        try {
            if (
                save &&
                typeof save.completeRoom === "function"
            ) {
                save.completeRoom(CHAPTER_NUMBER);
            }

            if (
                save &&
                typeof save.setCurrentRoom === "function"
            ) {
                save.setCurrentRoom(NEXT_CHAPTER_NUMBER);
            }

            if (
                save &&
                typeof save.setCurrentChapter === "function"
            ) {
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
            "room4.html";

        window.location.href = nextPage;
    }

    function returnToMenu() {
        saveState();

        safeSet("currentChapter", CHAPTER_NUMBER);
        safeSet("lastPlayedChapter", CHAPTER_NUMBER);

        try {
            if (
                save &&
                typeof save.setCurrentRoom === "function"
            ) {
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
                    save &&
                    typeof save.getPlayerName === "function"
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
   ROOM 3 ENVANTER EŞYALARINI AÇMA
===================================================== */

function openInventoryItem(itemId) {

    if (itemId === CABINET_KEY_ID) {

        showDialogue(
            "İlaç Dolabı Anahtarı",
            "Masanın üzerindeki dağınık evrakların arasında bulduğun küçük ve paslı anahtar. İlaç dolabının kilidine uyuyor."
        );

        return;
    }

    if (itemId === MEDICINE_LIST_ID) {

        showElement(
            medicineCabinetViewer
        );

        refreshMedicineListButton();

    }

}


function bindInventoryItemClicks() {

    if (!inventorySlots) {
        return;
    }

    inventorySlots.addEventListener(
        "click",
        event => {

            /*
            Ortak envanter sistemi olayı durdursa bile
            tıklamayı önce yakala.
            */
            const clickedSlot =
                event.target.closest(
                    ".inventory-slot, button, [data-item-id]"
                );

            if (
                !clickedSlot ||
                !inventorySlots.contains(clickedSlot)
            ) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const allSlots = [
                ...inventorySlots.children
            ];

            const slotIndex =
                allSlots.indexOf(clickedSlot);

            if (slotIndex === -1) {
                return;
            }

            /*
            1. kutu: İlaç dolabı anahtarı
            */
            if (
                slotIndex === 0 &&
                state.keyCollected
            ) {

                showDialogue(
                    "İlaç Dolabı Anahtarı",
                    "Masanın üzerindeki dağınık evrakların arasında bulduğun küçük ve paslı anahtar. İlaç dolabının kilidine uyuyor."
                );

                return;
            }

            /*
            2. kutu: İlaç listesi
            */
            if (
                slotIndex === 1 &&
                state.medicineListCollected
            ) {

                refreshMedicineListButton();
                showElement(
                    medicineCabinetViewer
                );

            }

        },
        true
    );

}

    /* =====================================================
       EVENT BAĞLANTILARI
    ===================================================== */

    function bindEvents() {
        registerInteraction(
            bedPillow,
            "Masanın Üstüne Bir Göz At",
            inspectPillow
        );

        registerInteraction(
            medicineCabinet,
            "İlaç Dolabını İncele",
            inspectMedicineCabinet
        );

        registerInteraction(
            treatmentBoard,
            "Tedavi Kayıt Panosunu İncele",
            inspectTreatmentBoard
        );

        registerInteraction(
            doorKeypad,
            "Kapı Şifre Panelini İncele",
            openDoorCodePanel
        );

        registerInteraction(
            exitDoor,
            "Çıkış Kapısını İncele",
            inspectExitDoor
        );

        collectCabinetKey?.addEventListener(
            "click",
            collectKey
        );

        closeTreatmentBoard?.addEventListener(
            "click",
            closeTreatmentBoardViewer
        );

        closeTreatmentBoardFooter?.addEventListener(
            "click",
            closeTreatmentBoardViewer
        );

        closeMedicineCabinet?.addEventListener(
            "click",
            closeMedicineViewer
        );

        collectMedicineList?.addEventListener(
            "click",
            collectMedicineListItem
        );

        closeFoundMedicineList?.addEventListener(
            "click",
            () => {
                hideElement(foundMedicineList);

                playDialogue([
                    {
                        speaker: "Tedavi Kayıtları",
                        text: "Panodaki hastalık sırasını, ilaç listesindeki numaralarla eşleştir.",
                        speed: 20
                    },
                    {
                        speaker: "",
                        text: "Beş doğru numara çıkış kapısının kodunu oluşturacak.",
                        speed: 20
                    }
                ]);
            }
        );

        doorKeypadButtons
            ?.querySelectorAll("[data-door-number]")
            .forEach(button => {
                button.addEventListener("click", () => {
                    addDoorDigit(
                        button.dataset.doorNumber
                    );
                });
            });

        clearDoorCode?.addEventListener(
            "click",
            clearDoorInput
        );

        submitDoorCode?.addEventListener(
            "click",
            submitDoorInput
        );

        closeDoorCode?.addEventListener(
            "click",
            () => {
                hideElement(doorCodePanel);
                state.doorCodeInput = "";
                updateDoorCodeDisplay();
                setDoorCodeMessage("");
            }
        );

        hintButton?.addEventListener(
            "click",
            showHint
        );

        dialogContinue?.addEventListener(
            "click",
            nextDialogue
        );

        dialogClose?.addEventListener(
            "click",
            hideDialogue
        );

        nextChapter?.addEventListener(
            "click",
            goToNextChapter
        );

        menuButton?.addEventListener(
            "click",
            returnToMenu
        );

        doorCodePanel?.addEventListener(
            "click",
            event => {
                if (event.target === doorCodePanel) {
                    hideElement(doorCodePanel);
                    state.doorCodeInput = "";
                    updateDoorCodeDisplay();
                    setDoorCodeMessage("");
                }
            }
        );

        treatmentBoardViewer?.addEventListener(
            "click",
            event => {
                if (event.target === treatmentBoardViewer) {
                    closeTreatmentBoardViewer();
                }
            }
        );

        medicineCabinetViewer?.addEventListener(
            "click",
            event => {
                if (event.target === medicineCabinetViewer) {
                    closeMedicineViewer();
                }
            }
        );

        setupKeyboardInteraction();
    }

    /* =====================================================
       KAYITLI GÖRÜNÜMÜ EŞLEŞTİR
    ===================================================== */

    function restoreVisualState() {
        if (state.cabinetUnlocked) {
            medicineCabinet?.classList.add("unlocked");
        }

        if (state.keyCollected) {
            bedPillow?.classList.add("searched");
        }

        if (state.treatmentBoardRead) {
            treatmentBoard?.classList.add("inspected");
        }

        if (state.doorUnlocked || state.chapterCompleted) {
            exitDoor?.classList.add("unlocked");
        }

        refreshMedicineListButton();
        updateDoorCodeDisplay();
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

        bindInventoryItemClicks();

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

    AshvaleFlashlight.start({
    room: "room",
    flashlight: "flashlight",
    interactionPrompt: null,
    smoothing: 0.14,
    swayAmount: 1.6
});

});