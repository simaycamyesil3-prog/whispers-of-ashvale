/* ==========================================================
   WHISPERS OF ASHVALE
   ROOM 4 - ELEKTRİK ODASI
========================================================== */

"use strict";

/* ==========================================================
   STATE
========================================================== */

const room4State = {

    redCable:false,
    blueCable:false,
    greenCable:false,

    accessCard:false,
    cardVerified:false,

    panelVisited:false,

    powerRestored:false

};

/* ==========================================================
   ELEMENTS
========================================================== */

const playerNameElement =
    document.getElementById("playerName");

const room4Save =
    window.AshvaleSave ||
    window.AshvaleSaveManager;


    const electricalPanel =
document.getElementById("electricalPanel");

const room4Inventory =
    window.AshvaleInventory;

const room4Audio =
    window.AshvaleAudio;

const securityMonitors =
document.getElementById("securityMonitors");

const staffDesk =
document.getElementById("staffDesk");

const toolCabinet =
document.getElementById("toolCabinet");

const workbench =
document.getElementById("workbench");

const generator =
document.getElementById("generator");

const exitDoor =
document.getElementById("exitDoor");

const storyText =
document.getElementById("story-text");

const objectiveText =
document.getElementById("objectiveText");

const progressText =
document.getElementById("recordProgress");

const progressBar =
document.getElementById("recordProgressBar");

/* ==========================================================
   POPUPS
========================================================== */

const redPopup =
document.getElementById("foundRedCable");

const bluePopup =
document.getElementById("foundBlueCable");

const greenPopup =
document.getElementById("foundGreenCable");

const accessCardPopup =
document.getElementById("foundAccessCard");

/* ==========================================================
   PANEL
========================================================== */

const electricalPanelWindow =
document.getElementById("electricalPanelWindow");

/* ==========================================================
   BÖLÜM GİRİŞ EKRANI
========================================================== */

function playChapterIntro() {

    const intro = document.getElementById("chapter-intro");

    if (!intro) {
        console.warn("chapter-intro bulunamadı.");
        return;
    }

    intro.style.display = "flex";
    intro.style.opacity = "1";
    intro.style.visibility = "visible";

    window.setTimeout(() => {

        intro.style.opacity = "0";
        intro.style.visibility = "hidden";
        intro.style.pointerEvents = "none";

        window.setTimeout(() => {
            intro.style.display = "none";
        }, 500);

    }, 2500);
}

function loadRoom4PlayerName() {

    let playerName = "Oyuncu";

    try {

        const currentSave =
            room4Save &&
            typeof room4Save.getSave === "function"
                ? room4Save.getSave()
                : null;

        playerName =
            currentSave?.player?.name ||
            (
                room4Save &&
                typeof room4Save.getPlayerName === "function"
                    ? room4Save.getPlayerName()
                    : ""
            ) ||
            localStorage.getItem("playerName") ||
            "Oyuncu";

    } catch (error) {

        console.warn(
            "Oyuncu adı Room4 için okunamadı.",
            error
        );
    }

    if (playerNameElement) {
        playerNameElement.textContent = playerName;
    }
}

function bindRoom4Prompt(element, text) {

    const interactionPrompt =
        document.getElementById("interactionPrompt");

    const promptText =
        document.getElementById("promptText");

    if (!element || !interactionPrompt || !promptText) {
        return;
    }

    const showPrompt = () => {
        promptText.textContent = text;
        interactionPrompt.classList.remove("hidden");
        interactionPrompt.setAttribute("aria-hidden", "false");
    };

    const hidePrompt = () => {
        interactionPrompt.classList.add("hidden");
        interactionPrompt.setAttribute("aria-hidden", "true");
    };

    element.addEventListener("mouseenter", showPrompt);
    element.addEventListener("focus", showPrompt);
    element.addEventListener("mouseleave", hidePrompt);
    element.addEventListener("blur", hidePrompt);
}
/* ==========================================================
   ROOM 4 — EL FENERİ
   Room 3 ile aynı ortak AshvaleFlashlight sistemi
========================================================== */

function startRoom4Flashlight() {

    if (
        !window.AshvaleFlashlight ||
        typeof window.AshvaleFlashlight.start !== "function"
    ) {
        console.warn(
            "AshvaleFlashlight sistemi Room 4 için bulunamadı."
        );
        return;
    }

    window.AshvaleFlashlight.start({
        room: "room",
        flashlight: "flashlight",
        interactionPrompt: null,
        smoothing: 0.14,
        swayAmount: 1.6
    });
}

/* ==========================================================
   ROOM 4 — SES SİSTEMİ
   Diğer bölümler (5 ve sonrası) paylaşılan AshvaleAudio sistemini
   kullanıyor ama Bölüm 4 hiç kablolanmamıştı - oda tamamen
   sessizdi. Aynı kurulum kalıbı burada da uygulandı: hafif bir
   oda ambiyansı + kablo/kart toplama, panel/kart okuyucu ve
   elektrik geri gelme anlarına bağlı efekt sesleri.
========================================================== */

function initializeRoom4Audio() {

    if (
        !room4Audio ||
        typeof room4Audio.initialize !== "function"
    ) {
        return;
    }

    try {
        room4Audio.initialize({
            sounds: {
                chapter4Ambience: {
                    src: "assets/audio/ambience/chapter2_ambient.mp3",
                    type: "ambience",
                    loop: true,
                    volume: 0.55
                },
                itemPickup: {
                    src: "assets/audio/effects/key_pickup.mp3",
                    type: "effect",
                    volume: 0.56
                },
                cardPickup: {
                    src: "assets/audio/effects/paper_pickup.mp3",
                    type: "effect",
                    volume: 0.54
                },
                panelOpen: {
                    src: "assets/audio/effects/cabinet.mp3",
                    type: "effect",
                    volume: 0.6
                },
                keypadError: {
                    src: "assets/audio/effects/keypad_error.mp3",
                    type: "effect",
                    volume: 0.6
                },
                keypadSuccess: {
                    src: "assets/audio/effects/keypad_success.mp3",
                    type: "effect",
                    volume: 0.64
                },
                doorUnlock: {
                    src: "assets/audio/effects/door_unlock.mp3",
                    type: "effect",
                    volume: 0.7
                },
                powerRestore: {
                    src: "assets/audio/effects/computer_boot.mp3",
                    type: "effect",
                    volume: 0.68
                }
            }
        });

        if (typeof room4Audio.playAmbience === "function") {
            room4Audio.playAmbience("chapter4Ambience");
        }
    } catch (error) {
        console.warn("Room4 ses sistemi başlatılamadı.", error);
    }
}

function playRoom4Effect(soundName) {

    if (
        !room4Audio ||
        typeof room4Audio.playEffect !== "function"
    ) {
        return;
    }

    try {
        room4Audio.playEffect(soundName);
    } catch (error) {
        console.warn(`Ses oynatılamadı: ${soundName}`, error);
    }
}

/* ==========================================================
ROOM 4 — ENVANTERİ BAŞLAT
========================================================== */

function initializeRoom4Inventory() {

    if (
        !room4Inventory ||
        typeof room4Inventory.initialize !== "function"
    ) {
        console.warn(
            "AshvaleInventory Room 4 için bulunamadı."
        );

        return;
    }

    try {

        room4Inventory.initialize({
            element: "inventorySlots",
            save: room4Save,
            storageKey: "chapter4Inventory",
            slots: 6,
            load: false
        });

        /*
           Room 4 envanterini mevcut bölüm state'inden
           yeniden oluşturuyoruz.
        */
        if (
            typeof room4Inventory.clear === "function"
        ) {
            room4Inventory.clear({
                save: false
            });
        }

    } catch (error) {

        console.warn(
            "Room 4 envanteri başlatılamadı.",
            error
        );
    }
}

/* ==========================================================
   EVENT BAĞLANTILARI
========================================================== */

function bindEvents() {

    bindRoom4Prompt(
    electricalPanel,
    "Ana Elektrik Panosunu İncele"
);

bindRoom4Prompt(
    securityMonitors,
    "Güvenlik Monitörlerini İncele"
);

bindRoom4Prompt(
    staffDesk,
    "Personel Masasını İncele"
);

bindRoom4Prompt(
    toolCabinet,
    "Alet Dolabını İncele"
);

bindRoom4Prompt(
    workbench,
    "Çalışma Masasını İncele"
);

bindRoom4Prompt(
    generator,
    "Jeneratörü İncele"
);

bindRoom4Prompt(
    exitDoor,
    "Çıkış Kapısını İncele"
);

    if (electricalPanel) {
        electricalPanel.addEventListener("click", handleElectricalPanel);
    }

    if (securityMonitors) {
        securityMonitors.addEventListener("click", handleSecurityMonitors);
    }

    if (staffDesk) {
        staffDesk.addEventListener("click", handleStaffDesk);
    }

    if (toolCabinet) {
        toolCabinet.addEventListener("click", handleToolCabinet);
    }

    if (workbench) {
        workbench.addEventListener("click", handleWorkbench);
    }

    if (generator) {
        generator.addEventListener("click", handleGenerator);
    }

    if (exitDoor) {
        exitDoor.addEventListener("click", handleExitDoor);
    }

    const collectRedCable =
        document.getElementById("collectRedCable");

    const collectBlueCable =
        document.getElementById("collectBlueCable");

    const collectGreenCable =
        document.getElementById("collectGreenCable");

    const closeElectricalPanel =
        document.getElementById("closeElectricalPanel");

    const closeElectricalPanelFooter =
        document.getElementById("closeElectricalPanelFooter");

    if (collectRedCable) {
        collectRedCable.addEventListener(
            "click",
            collectRedPowerCable
        );
    }

    if (collectBlueCable) {
        collectBlueCable.addEventListener(
            "click",
            collectBluePowerCable
        );
    }

    if (collectGreenCable) {
        collectGreenCable.addEventListener(
            "click",
            collectGreenPowerCable
        );
    }

    const collectAccessCard =
        document.getElementById("collectAccessCard");

    if (collectAccessCard) {
        collectAccessCard.addEventListener(
            "click",
            collectAccessCardItem
        );
    }

    if (closeElectricalPanel) {
        closeElectricalPanel.addEventListener(
            "click",
            closeElectricalPanelWindow
        );
    }

    if (closeElectricalPanelFooter) {
        closeElectricalPanelFooter.addEventListener(
            "click",
            closeElectricalPanelWindow
        );
    }

    const closeDoorCardReaderButton =
        document.getElementById("closeDoorCardReader");

    const closeDoorCardReaderFooter =
        document.getElementById("closeDoorCardReaderFooter");

    if (closeDoorCardReaderButton) {
        closeDoorCardReaderButton.addEventListener(
            "click",
            closeDoorCardReader
        );
    }

    if (closeDoorCardReaderFooter) {
        closeDoorCardReaderFooter.addEventListener(
            "click",
            closeDoorCardReader
        );
    }

    const dialogContinue =
        document.getElementById("dialogContinue");

    const dialogClose =
        document.getElementById("dialog-x-button");

    if (dialogContinue) {
        dialogContinue.addEventListener(
            "click",
            closeRoom4Dialog
        );
    }

    if (dialogClose) {
        dialogClose.addEventListener(
            "click",
            closeRoom4Dialog
        );
    }

    const hintButton =
        document.getElementById("hintButton");

    if (hintButton) {
        hintButton.addEventListener(
            "click",
            showRoom4Hint
        );
    }

    const menuButton =
        document.getElementById("menuButton");

    if (menuButton) {
        menuButton.addEventListener(
            "click",
            returnToMainMenu
        );
    }

    document.addEventListener(
        "keydown",
        handleRoom4Keyboard
    );
}

/* ==========================================================
   ELEKTRİK PANOSU
========================================================== */

function handleElectricalPanel() {

    room4State.panelVisited = true;

    if (room4State.powerRestored) {
        showRoom4Dialog(
            "Elektrik Panosu",
            "Sistem çalışıyor. Ana şalter aktif, bağlantılar yerinde duruyor."
        );

        return;
    }

    if (
        room4State.redCable &&
        room4State.blueCable &&
        room4State.greenCable
    ) {
        openElectricalPanelWindow();

        setObjective(
            "Güç kablolarını doğru bağlantılara yerleştir."
        );

        saveRoom4State();
        return;
    }

    openElectricalPanelWindow();

    const missingCableCount =
        getMissingCableCount();

    if (missingCableCount === 3) {
        setObjective(
            "Kırmızı, mavi ve yeşil güç kablolarını bul."
        );
    } else if (missingCableCount === 2) {
        setObjective(
            "Elektrik odasında iki güç kablosu daha bul."
        );
    } else if (missingCableCount === 1) {
        setObjective(
            "Elektrik odasında son güç kablosunu bul."
        );
    }

    saveRoom4State();
}

function openElectricalPanelWindow() {

    if (!electricalPanelWindow) {
        return;
    }

    playRoom4Effect("panelOpen");

    electricalPanelWindow.classList.remove("hidden");
    electricalPanelWindow.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add("modal-open");
}

function closeElectricalPanelWindow() {

    if (!electricalPanelWindow) {
        return;
    }

    electricalPanelWindow.classList.add("hidden");
    electricalPanelWindow.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove("modal-open");
}

/* ==========================================================
   GÜVENLİK MONİTÖRLERİ
========================================================== */

function handleSecurityMonitors() {

    if (room4State.powerRestored) {
        showRoom4Dialog(
            "Güvenlik Sistemi",
            "Elektrik geri geldi. Eski monitörlerden biri bakım kayıtlarına ait bozuk bir görüntü gösteriyor."
        );

        return;
    }

    showRoom4Dialog(
        "Güvenlik Monitörleri",
        "Monitörlerin tamamı kapalı. Elektrik olmadan kamera kayıtlarına erişemezsin."
    );
}

/* ==========================================================
   YETKİSİZ PERSONEL MASASI
========================================================== */

function handleStaffDesk() {

    if (!room4State.accessCard) {
        openItemPopup(accessCardPopup);
        return;
    }

    showRoom4Dialog(
        "Masa",
        "Kağıtları daha önce karıştırdın. Üzerinde işe yarayacak başka bir şey kalmamış."
    );
}

/* ==========================================================
   ALET DOLABI
========================================================== */

function handleToolCabinet() {

    if (room4State.redCable) {
        showRoom4Dialog(
            "Alet Dolabı",
            "Dolabın içini daha önce inceledin. İşine yarayacak başka bir şey kalmamış."
        );

        return;
    }

    openItemPopup(redPopup);
}

/* ==========================================================
   ÇALIŞMA MASASI
========================================================== */

function handleWorkbench() {

    if (room4State.blueCable) {
        showRoom4Dialog(
            "Çalışma Masası",
            "Masanın çekmeceleri boş. Mavi güç kablosunu zaten aldın."
        );

        return;
    }

    openItemPopup(bluePopup);
}

/* ==========================================================
   JENERATÖR
========================================================== */

function handleGenerator() {

    if (room4State.greenCable) {
        showRoom4Dialog(
            "Eski Jeneratör",
            "Jeneratörün arkasında başka kullanılabilir parça görünmüyor."
        );

        return;
    }

    openItemPopup(greenPopup);
}

/* ==========================================================
   ÇIKIŞ KAPISI
========================================================== */

function handleExitDoor() {

    if (room4State.cardVerified) {
        showChapterComplete();
        return;
    }

    if (!room4State.accessCard) {
        showRoom4Dialog(
            "Çıkış Kapısı",
            "Kapıdaki elektronik kilit bir erişim kartı okutulmasını bekliyor. Kapıyı açmadan önce bir personel erişim kartı bulmalısın."
        );

        return;
    }

    if (!room4State.powerRestored) {
        showRoom4Dialog(
            "Çıkış Kapısı",
            "Kart okuyucu tepki vermiyor. Kilidi besleyen ana elektrik hattı hâlâ kesik; önce elektrik akımını geri getirmelisin."
        );

        return;
    }

    openDoorCardReader();
}

/* ==========================================================
   EŞYA POPUPLARI
========================================================== */

function openItemPopup(popupElement) {

    if (!popupElement) {
        return;
    }

    popupElement.classList.remove("hidden");
    popupElement.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add("modal-open");
}

function closeItemPopup(popupElement) {

    if (!popupElement) {
        return;
    }

    popupElement.classList.add("hidden");
    popupElement.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove("modal-open");
}

/* ==========================================================
   DİYALOG
========================================================== */

function showRoom4Dialog(title, text) {

    const dialog =
        document.getElementById("dialog");

    const dialogTitle =
        document.getElementById("dialogTitle");

    const dialogText =
        document.getElementById("dialogText");

    if (!dialog || !dialogTitle || !dialogText) {
        return;
    }

    dialogTitle.textContent = title;
    dialogText.textContent = text;

    dialog.classList.add("show");
    dialog.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add("modal-open");
}

function closeRoom4Dialog() {

    const dialog =
        document.getElementById("dialog");

    if (!dialog) {
        return;
    }

    dialog.classList.remove("show");
    dialog.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove("modal-open");
}

/* ==========================================================
   GÖREV METNİ
========================================================== */

function setObjective(text) {

    if (!objectiveText) {
        return;
    }

    objectiveText.textContent = text;
}

/* ==========================================================
   EKSİK KABLO SAYISI
========================================================== */

function getMissingCableCount() {

    let missing = 0;

    if (!room4State.redCable) {
        missing++;
    }

    if (!room4State.blueCable) {
        missing++;
    }

    if (!room4State.greenCable) {
        missing++;
    }

    return missing;
}
/* ==========================================================
   KABLOLARI TOPLAMA
========================================================== */

function collectRedPowerCable() {

    if (room4State.redCable) return;

    room4State.redCable = true;

    closeItemPopup(redPopup);

    playRoom4Effect("itemPickup");

    addCableToInventory(
        "red-power-cable",
        "Kırmızı Güç Kablosu"
    );

    updateProgress();

    updateRoom4CollectionObjective();

    saveRoom4State();
}

function collectBluePowerCable() {

    if (room4State.blueCable) return;

    room4State.blueCable = true;

    closeItemPopup(bluePopup);

    playRoom4Effect("itemPickup");

    addCableToInventory(
        "blue-power-cable",
        "Mavi Güç Kablosu"
    );

    updateProgress();

    updateRoom4CollectionObjective();

    saveRoom4State();
}

function collectGreenPowerCable() {

    if (room4State.greenCable) return;

    room4State.greenCable = true;

    closeItemPopup(greenPopup);

    playRoom4Effect("itemPickup");

    addCableToInventory(
        "green-power-cable",
        "Yeşil Güç Kablosu"
    );

    updateProgress();

    updateRoom4CollectionObjective();

    saveRoom4State();
}

/* ==========================================================
   ROOM 4 — BAKIM ERİŞİM KARTINI TOPLAMA
========================================================== */

function collectAccessCardItem() {

    if (room4State.accessCard) return;

    room4State.accessCard = true;

    closeItemPopup(accessCardPopup);

    playRoom4Effect("cardPickup");

    addCardToInventory();

    if (staffDesk) {
        staffDesk.classList.add("is-collected");
    }

    updateProgress();

    updateRoom4CollectionObjective();

    saveRoom4State();
}

/* ==========================================================
   ROOM 4 — TOPLAMA SONRASI GÖREV METNİ
========================================================== */

function updateRoom4CollectionObjective() {

    const missingCableCount =
        getMissingCableCount();

    if (missingCableCount === 3) {
        setObjective(
            "Kırmızı, mavi ve yeşil güç kablolarını bul."
        );
        return;
    }

    if (missingCableCount === 2) {
        setObjective(
            "İki güç kablosu daha bul."
        );
        return;
    }

    if (missingCableCount === 1) {
        setObjective(
            "Son güç kablosunu bul."
        );
        return;
    }

    if (!room4State.accessCard) {
        setObjective(
            "Yetkisiz personel yazısının altındaki masayı incele."
        );
        return;
    }

    if (!room4State.powerRestored) {
        setObjective(
            "Elektrik panosunu kontrol et."
        );
        return;
    }

    if (!room4State.cardVerified) {
        setObjective(
            "Çıkış kapısındaki kart okuyucuyu kullan."
        );
        return;
    }

    setObjective(
        "Çıkış kapısını kontrol et."
    );
}

/* ==========================================================
   ROOM 4 — KABLOYU ENVANTERE EKLE
========================================================== */

function addCableToInventory(id, name) {

    if (
        !room4Inventory ||
        typeof room4Inventory.add !== "function"
    ) {
        console.warn(
            "Room 4 envanter sistemi hazır değil."
        );
        return;
    }

    if (
        typeof room4Inventory.has === "function" &&
        room4Inventory.has(id)
    ) {
        return;
    }

    const item = {
        id: id,
        name: name,
        description:
            `${name}, ana elektrik panosundaki güç bağlantısı için gerekli.`,
        consumable: false
    };

    try {

        room4Inventory.add(item);

    } catch (error) {

        console.warn(
            `${name} envantere eklenemedi.`,
            error
        );
    }
}

/* ==========================================================
   ROOM 4 — ERİŞİM KARTINI ENVANTERE EKLE
========================================================== */

function addCardToInventory() {

    if (
        !room4Inventory ||
        typeof room4Inventory.add !== "function"
    ) {
        console.warn(
            "Room 4 envanter sistemi hazır değil."
        );
        return;
    }

    const cardId = "electrical-access-card";

    if (
        typeof room4Inventory.has === "function" &&
        room4Inventory.has(cardId)
    ) {
        return;
    }

    const item = {
        id: cardId,
        name: "Bakım Erişim Kartı",
        description:
            "Ana elektrik panosundaki kart okuyucu için gerekli personel erişim kartı.",
        consumable: false
    };

    try {

        room4Inventory.add(item);

    } catch (error) {

        console.warn(
            "Bakım Erişim Kartı envantere eklenemedi.",
            error
        );
    }
}

/* ==========================================================
   İLERLEME ÇUBUĞU
========================================================== */

function updateProgress(){

    let total=0;

    if(room4State.redCable) total++;
    if(room4State.blueCable) total++;
    if(room4State.greenCable) total++;
    if(room4State.accessCard) total++;

    if(progressText){

        progressText.textContent=total+" / 4";

    }

    if(progressBar){

        progressBar.style.width=(total/4*100)+"%";

    }

}

/* ==========================================================
   ANA GÜÇ KONTROLÜ
========================================================== */

function restorePower(){

    if(
        !room4State.redCable ||
        !room4State.blueCable ||
        !room4State.greenCable
    ){

        showRoom4Dialog(

            "Elektrik Panosu",

            "Bütün güç kabloları takılmadan sistemi çalıştıramazsın."

        );

        return;

    }

    room4State.powerRestored=true;

    playRoom4Effect("powerRestore");

    setObjective(
        room4State.accessCard
            ? "Elektrik geri geldi. Çıkış kapısındaki kart okuyucuyu kullan."
            : "Elektrik geri geldi. Çıkışı açmak için bir erişim kartı bulmalısın."
    );

    storyText.textContent=

    "Elektrik odası yeniden çalışmaya başladı. Koridor boyunca lambalar tek tek yanıyor.";

    saveRoom4State();

    showRoom4Dialog(

        "Elektrik Geldi",

        "Eski hastane tekrar enerji aldı."

    );

    unlockExitDoor();

    disableRoom4Flashlight();

}

/* ==========================================================
   ÇIKIŞ KAPISI — KART OKUYUCU
========================================================== */

function openDoorCardReader() {

    const doorCardReader =
        document.getElementById("doorCardReader");

    if (!doorCardReader) {
        return;
    }

    doorCardReader.classList.remove("hidden");
    doorCardReader.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");
}

function closeDoorCardReader() {

    const doorCardReader =
        document.getElementById("doorCardReader");

    if (!doorCardReader) {
        return;
    }

    doorCardReader.classList.add("hidden");
    doorCardReader.setAttribute("aria-hidden", "true");

    document.body.classList.remove("modal-open");
}

function handleScanAccessCard(){

    if(!room4State.accessCard){

        playRoom4Effect("keypadError");

        showRoom4Dialog(

            "Kart Okuyucu",

            "Kart okuyucu kırmızı yanıyor. Önce bir personel erişim kartı bulman gerekiyor."

        );

        return;

    }

    if(room4State.cardVerified){
        return;
    }

    room4State.cardVerified = true;

    playRoom4Effect("keypadSuccess");

    window.setTimeout(() => {
        playRoom4Effect("doorUnlock");
    }, 350);

    updateCardReaderUi();

    saveRoom4State();

    window.setTimeout(() => {

        closeDoorCardReader();

        showChapterComplete();

    }, 900);

}

function updateCardReaderUi(){

    const cardReaderStatus =
        document.getElementById("cardReaderStatus");

    const cardReaderStatusText =
        document.getElementById("cardReaderStatusText");

    const scanButton =
        document.getElementById("scanAccessCard");

    if(!room4State.cardVerified){
        return;
    }

    if(cardReaderStatus){
        cardReaderStatus.classList.add("verified");
    }

    if(cardReaderStatusText){
        cardReaderStatusText.textContent = "ERİŞİM ONAYLANDI";
    }

    if(scanButton){
        scanButton.classList.add("verified");
        scanButton.textContent = "KART OKUTULDU";
    }
}

/* ==========================================================
   ÇIKIŞ KAPISI
========================================================== */

function unlockExitDoor(){

    if(!exitDoor) return;

    exitDoor.classList.remove("locked");

    exitDoor.classList.add("unlocked");

}

/* ==========================================================
   GÜÇ GERİ GELİNCE EL FENERİNİ KAPAT
========================================================== */

function disableRoom4Flashlight(){

    const roomElement =
        document.getElementById("room");

    if(roomElement){
        roomElement.classList.add("power-restored");
    }

    if(
        window.AshvaleFlashlight &&
        typeof window.AshvaleFlashlight.stop === "function"
    ){

        try {

            window.AshvaleFlashlight.stop();

        } catch (error) {

            console.warn(
                "El feneri sistemi durdurulamadı.",
                error
            );
        }
    }
}

function showChapterComplete(){

    const chapterComplete=

    document.getElementById("chapterComplete");

    if(!chapterComplete) return;

    chapterComplete.classList.remove("hidden");

    chapterComplete.classList.add("chapter-complete--visible");

    chapterComplete.setAttribute(

        "aria-hidden",

        "false"

    );

}

/* ==========================================================
   KAYDETME
========================================================== */

function saveRoom4State(){

    const data={

        redCable:room4State.redCable,

        blueCable:room4State.blueCable,

        greenCable:room4State.greenCable,

        accessCard:room4State.accessCard,

        cardVerified:room4State.cardVerified,

        panelVisited:room4State.panelVisited,

        powerRestored:room4State.powerRestored

    };

    localStorage.setItem(

        "woa-room4",

        JSON.stringify(data)

    );

}

function loadRoom4State(){

    const raw=

    localStorage.getItem("woa-room4");

    if(!raw) return;

    try{

        const data=JSON.parse(raw);

        Object.assign(room4State,data);

        updateProgress();

        if(room4State.powerRestored){

            unlockExitDoor();

            disableRoom4Flashlight();

        }

    }

    catch(e){

        console.error(e);

    }

}

    /* ==========================================================
   İPUCU SİSTEMİ
========================================================== */

function showRoom4Hint() {

    if (!room4State.redCable) {
        showRoom4Dialog(
            "İpucu",
            "Alet dolabının çekmecelerini kontrol et."
        );
        return;
    }

    if (!room4State.blueCable) {
        showRoom4Dialog(
            "İpucu",
            "Çalışma masasının üzerinde ve çekmecelerinde işe yarar bir şey olabilir."
        );
        return;
    }

    if (!room4State.greenCable) {
        showRoom4Dialog(
            "İpucu",
            "Jeneratörün arka tarafına dikkatlice bak."
        );
        return;
    }

    if (!room4State.accessCard) {
        showRoom4Dialog(
            "İpucu",
            "Yetkisiz personel yazısının altındaki masayı kontrol et, orada bir erişim kartı olabilir."
        );
        return;
    }

    if (!room4State.powerRestored) {
        showRoom4Dialog(
            "İpucu",
            "Üç kabloyu da buldun. Şimdi ana elektrik panosunu aç ve bağlantıları tamamla."
        );
        return;
    }

    if (!room4State.cardVerified) {
        showRoom4Dialog(
            "İpucu",
            "Elektrik geri geldi. Çıkış kapısındaki kart okuyucudan erişim kartını geçir."
        );
        return;
    }

    showRoom4Dialog(
        "İpucu",
        "Kart doğrulandı. Çıkış kapısını kontrol et."
    );
}

/* ==========================================================
   KLAVYE KONTROLLERİ
========================================================== */

function handleRoom4Keyboard(event) {

    if (event.key === "Escape") {

        closeElectricalPanelWindow();
        closeRoom4Dialog();

        closeItemPopup(redPopup);
        closeItemPopup(bluePopup);
        closeItemPopup(greenPopup);

        return;
    }

    if (
        event.key.toLowerCase() === "h" &&
        !event.ctrlKey &&
        !event.metaKey
    ) {
        showRoom4Hint();
    }
}

/* ==========================================================
   ANA MENÜ
========================================================== */

function returnToMainMenu() {

    saveRoom4State();

    window.location.href = "../../index.html";
}

/* ==========================================================
   ROOM 5'E GEÇİŞ
========================================================== */

function goToRoom5() {

    if (!room4State.powerRestored) {
        showRoom4Dialog(
            "Kapı Kilitli",
            "Elektrik sistemi hâlâ devre dışı."
        );
        return;
    }

    /*
        Bölüm 4'ü tamamlanmış olarak ana kayıt sistemine
        (AshvaleSaveManager) işliyoruz. Eskiden burada yalnızca
        ham/bağımsız localStorage anahtarları yazılıyordu; bu da
        ana menüdeki "Bölümler" ekranının bölüm 5'i hâlâ kilitli
        göstermesine yol açabiliyordu, çünkü o ekran tamamlanan
        bölümleri room3.js'teki gibi save.completeRoom() ile
        işaretlenmiş olmasını bekliyor.
    */
    try {

        if (
            room4Save &&
            typeof room4Save.completeRoom === "function"
        ) {
            room4Save.completeRoom(4);
        }

        if (
            room4Save &&
            typeof room4Save.setCurrentRoom === "function"
        ) {
            room4Save.setCurrentRoom(5);
        }

        if (
            room4Save &&
            typeof room4Save.setCurrentChapter === "function"
        ) {
            room4Save.setCurrentChapter(5);
        }

        if (
            room4Save &&
            typeof room4Save.saveToStorage === "function"
        ) {
            room4Save.saveToStorage();
        }

    } catch (error) {
        console.warn(
            "Bölüm ilerlemesi ortak kayıt sistemine yazılamadı.",
            error
        );
    }

    window.location.href = "room5.html";
}

/* ==========================================================
   BÖLÜM TAMAMLAMA BUTONU
========================================================== */

function bindChapterCompleteButton() {

    const continueButton =
        document.getElementById("nextChapter");

    if (!continueButton) {
        return;
    }

    continueButton.addEventListener(
        "click",
        goToRoom5
    );
}

/* ==========================================================
   KAYITLI DURUMU EKRANA UYGULAMA
========================================================== */

function applyLoadedRoom4State() {

    if (room4State.redCable) {

        if (toolCabinet) {
            toolCabinet.classList.add(
                "is-collected"
            );
        }

        addCableToInventory(
            "red-power-cable",
            "Kırmızı Güç Kablosu"
        );
    }

    if (room4State.blueCable) {

        if (workbench) {
            workbench.classList.add(
                "is-collected"
            );
        }

        addCableToInventory(
            "blue-power-cable",
            "Mavi Güç Kablosu"
        );
    }

    if (room4State.greenCable) {

        if (generator) {
            generator.classList.add(
                "is-collected"
            );
        }

        addCableToInventory(
            "green-power-cable",
            "Yeşil Güç Kablosu"
        );
    }

    if (room4State.accessCard) {

        if (staffDesk) {
            staffDesk.classList.add(
                "is-collected"
            );
        }

        addCardToInventory();
    }

    if (room4State.cardVerified) {
        updateCardReaderUi();
    }

    if (room4State.powerRestored) {

        unlockExitDoor();

        disableRoom4Flashlight();

        setObjective(
            room4State.cardVerified
                ? "Çıkış kapısını kontrol et."
                : "Elektrik geri geldi. Çıkış kapısındaki kart okuyucuyu kullan."
        );

        if (storyText) {
            storyText.textContent =
                "Elektrik odası yeniden çalışmaya başladı. Koridordaki lambalar tek tek yanıyor.";
        }

        return;
    }

    updateRoom4CollectionObjective();
}

/* ==========================================================
   PANEL BUTONLARI
========================================================== */

function bindElectricalPanelControls() {

    const mainBreaker =
        document.getElementById("mainBreaker");

    if (mainBreaker) {

        mainBreaker.addEventListener(
            "click",
            restorePower
        );
    }

    const scanAccessCard =
        document.getElementById("scanAccessCard");

    if (scanAccessCard) {

        scanAccessCard.addEventListener(
            "click",
            handleScanAccessCard
        );
    }

    const redCableSlot =
        document.getElementById("redCableSlot");

    const blueCableSlot =
        document.getElementById("blueCableSlot");

    const greenCableSlot =
        document.getElementById("greenCableSlot");

    if (redCableSlot) {

        redCableSlot.addEventListener(
            "click",
            function () {

                if (!room4State.redCable) {

                    showRoom4Dialog(
                        "Kırmızı Bağlantı",
                        "Bu bağlantı için kırmızı güç kablosunu bulmalısın."
                    );

                    return;
                }

                redCableSlot.classList.add(
                    "connected"
                );

                checkPanelConnections();
            }
        );
    }

    if (blueCableSlot) {

        blueCableSlot.addEventListener(
            "click",
            function () {

                if (!room4State.blueCable) {

                    showRoom4Dialog(
                        "Mavi Bağlantı",
                        "Bu bağlantı için mavi güç kablosunu bulmalısın."
                    );

                    return;
                }

                blueCableSlot.classList.add(
                    "connected"
                );

                checkPanelConnections();
            }
        );
    }

    if (greenCableSlot) {

        greenCableSlot.addEventListener(
            "click",
            function () {

                if (!room4State.greenCable) {

                    showRoom4Dialog(
                        "Yeşil Bağlantı",
                        "Bu bağlantı için yeşil güç kablosunu bulmalısın."
                    );

                    return;
                }

                greenCableSlot.classList.add(
                    "connected"
                );

                checkPanelConnections();
            }
        );
    }
}

/* ==========================================================
   PANEL BAĞLANTI KONTROLÜ
========================================================== */

function checkPanelConnections() {

    const redCableSlot =
        document.getElementById("redCableSlot");

    const blueCableSlot =
        document.getElementById("blueCableSlot");

    const greenCableSlot =
        document.getElementById("greenCableSlot");

    const mainBreaker =
        document.getElementById("mainBreaker");

    if (
        !redCableSlot ||
        !blueCableSlot ||
        !greenCableSlot ||
        !mainBreaker
    ) {
        return;
    }

    const allConnected =
        redCableSlot.classList.contains("connected") &&
        blueCableSlot.classList.contains("connected") &&
        greenCableSlot.classList.contains("connected");

    if (!allConnected) {
        return;
    }

    mainBreaker.classList.add("active");
    mainBreaker.disabled = false;

    showRoom4Dialog(
        "Bağlantılar Tamamlandı",
        "Üç güç kablosu da yerine takıldı. Ana şalter artık kullanılabilir."
    );
}


/* ==========================================================
   BAŞLATMA
   (Not: bu blok önceden eksikti — hiçbir olay bağlanmıyor,
   kayıtlı durum yüklenmiyor, bölüm giriş ekranı kapanmıyordu.)
========================================================== */

function initializeRoom4() {

    try {
        loadRoom4State();
    } catch (error) {
        console.warn("Room4 kayıtlı durumu yüklenemedi.", error);
    }

    loadRoom4PlayerName();

    /*
        Envanter, "state uygulanmadan" önce başlatılmalı:
        initializeRoom4Inventory() envanteri doğru elemana/
        anahtara bağlayıp sıfırlıyor (clear). Bu adım
        applyLoadedRoom4State()'ten SONRA çalışırsa, state'e
        göre eklenen kablolar/kart daha sonra clear() ile
        siliniyor ve envanterde hiç görünmüyordu.
    */
    initializeRoom4Inventory();

    try {
        applyLoadedRoom4State();
    } catch (error) {
        console.warn("Room4 kayıtlı durumu uygulanamadı.", error);
    }

    bindEvents();
    bindElectricalPanelControls();
    bindChapterCompleteButton();

    initializeRoom4Audio();

    startRoom4Flashlight();
    playChapterIntro();
}

initializeRoom4();
