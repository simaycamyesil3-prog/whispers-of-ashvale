"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
BÖLÜM 2 — KAYIT ODASI
PART 1 / 4

TEMEL SİSTEMLER
- Save
- Element bağlantıları
- State yönetimi
- Envanter
- Ses
- Diyalog
- Popup yönetimi
- Etkileşim sistemi
- Görev ilerlemesi
=========================================================
*/

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
        =================================================
        SABİTLER
        =================================================
        */

        const CHAPTER_NUMBER = 2;
        const NEXT_CHAPTER_NUMBER = 3;

        const DRAWER_CODE = "317";
        const DOOR_CODE = "0317";

        const KEYCARD_ID =
            "treatment-keycard";

        const KEYCARD_ITEM = {
            id: KEYCARD_ID,

            name:
                "Tedavi Kanadı Anahtar Kartı",

            description:
                "Ashvale Hastanesi'nin Tedavi Kanadı'na erişim sağlar.",

            icon:
                "images/ui/inventory/keycard.png",

            consumable:
                false
        };

        const RECORD_ITEMS = {

            "record-a": {
                id:
                    "patient-record-fragment-a",

                name:
                    "Hasta Kaydı — Parça I",

                description:
                    "3179 numaralı hastanın kimlik ve kabul bilgilerini içeriyor.",

                icon:
                    "images/ui/inventory/patient-record.png",

                consumable:
                    false
            },

            "record-b": {
                id:
                    "patient-record-fragment-b",

                name:
                    "Hasta Kaydı — Parça II",

                description:
                    "3179 numaralı hastanın deney sürecine ait doktor notlarını içeriyor.",

                icon:
                    "images/ui/inventory/patient-record.png",

                consumable:
                    false
            },

            "record-c": {
                id:
                    "patient-record-fragment-c",

                name:
                    "Hasta Kaydı — Parça III",

                description:
                    "3179 numaralı hastanın son nakil ve güvenlik kayıtlarını içeriyor.",

                icon:
                    "images/ui/inventory/patient-record.png",

                consumable:
                    false
            }

        };

        const RECORD_DATA = {

            "record-a": {
                title:
                    "Hasta Kaydı — Parça I",

                classification:
                    "KISITLI HASTA KİMLİK KAYDI",

                content: `
                    <p>
                        <strong>HASTA NUMARASI:</strong> 3179
                    </p>

                    <p>
                        <strong>İSİM:</strong> [SİLİNMİŞ]
                    </p>

                    <p>
                        <strong>KABUL TARİHİ:</strong> 17.03.1987
                    </p>

                    <p>
                        <strong>İLK GÖZLEM:</strong>
                        Hasta sürekli olarak duvarların içinden gelen
                        seslerden söz ediyor.
                    </p>

                    <p>
                        <strong>NOT:</strong>
                        Hasta, odasındaki saatin her gece tam
                        03:17'de durduğunu iddia ediyor.
                    </p>
                `
            },

            "record-b": {
                title:
                    "Hasta Kaydı — Parça II",

                classification:
                    "GİZLİ DENEY GÖZLEM RAPORU",

                content: `
                    <p>
                        <strong>DENEY KODU:</strong> A-317
                    </p>

                    <p>
                        <strong>DENEK:</strong> 3179
                    </p>

                    <p>
                        <strong>GÖZLEM:</strong>
                        Denek, tedavi sırasında kendisine ait olmayan
                        anıları tarif etmeye başladı.
                    </p>

                    <p>
                        <strong>DOKTOR NOTU:</strong>
                        “Kapının arkasındaki şey deneği tanıyor.”
                    </p>

                    <p>
                        <strong>GÜVENLİK TALİMATI:</strong>
                        Arşiv çekmecesi üç haneli deney koduyla
                        kilitlenmiştir.
                    </p>
                `
            },

            "record-c": {
                title:
                    "Hasta Kaydı — Parça III",

                classification:
                    "SON NAKİL VE GÜVENLİK KAYDI",

                content: `
                    <p>
                        <strong>SON DURUM:</strong> AKTİF
                    </p>

                    <p>
                        <strong>NAKİL BÖLGESİ:</strong>
                        Tedavi Kanadı — Oda 12
                    </p>

                    <p>
                        <strong>NAKİL SAATİ:</strong> 03:17
                    </p>

                    <p>
                        <strong>ERİŞİM PROTOKOLÜ:</strong>
                        Anahtar kart kullanıldıktan sonra dört haneli
                        saat kodu girilmelidir.
                    </p>

                    <p>
                        <strong>UYARI:</strong>
                        Hasta dosyada “aktif” görünmesine rağmen
                        1987 yılından beri hiçbir fiziksel gözlem
                        kaydı bulunmamaktadır.
                    </p>
                `
            }

        };

        /*
        =================================================
        KAYIT SİSTEMİ
        =================================================
        */
        const save = AshvaleSave;

        /*
        =================================================
        ELEMENT YARDIMCISI
        =================================================
        */

        function getElement(id) {

            return document.getElementById(
                id
            );

        }

        /*
        =================================================
        ANA ELEMENTLER
        =================================================
        */

        const room =
            getElement("room");

        const playerNameElement =
            getElement("playerName");

        const menuButton =
            getElement("menuButton");

        const intro =
            getElement("chapter-intro");

        /*
        =================================================
        ETKİLEŞİM ELEMENTLERİ
        =================================================
        */

        const prompt =
            getElement("interactionPrompt");

        const promptText =
            getElement("promptText");

        const telephone =
            getElement("telephone");

        const computer =
            getElement("computer");

        const chair =
            getElement("chair");

        const papers =
            getElement("papers");

        const lockedDrawer =
            getElement("lockedDrawer");

        const xrayBoard =
            getElement("xrayBoard");

        const wallClock =
            getElement("wallClock");

        const exitDoor =
            getElement("exitDoor");

        const hintButton =
            getElement("hintButton");

        const cabinets = [
            getElement("registerA"),
            getElement("registerB"),
            getElement("registerC"),
            getElement("registerD"),
            getElement("registerE"),
            getElement("registerF")
        ].filter(Boolean);

        /*
        =================================================
        HİKÂYE VE GÖREV ELEMENTLERİ
        =================================================
        */

        const storyText =
            getElement("story-text");

        const objectiveText =
            getElement("objectiveText");

        const objectiveProgress =
            getElement("objectiveProgress");

        const recordProgress =
            getElement("recordProgress");

        const recordProgressBar =
            getElement("recordProgressBar");

        /*
        =================================================
        BİLGİSAYAR ELEMENTLERİ
        =================================================
        */

        const computerScreen =
            getElement("computerScreen");

        const terminalText =
            getElement("terminalText");

        const closeComputer =
            getElement("closeComputer");

        const computerContinue =
            getElement("computerContinue");

        /*
        =================================================
        KAYIT GÖRÜNTÜLEYİCİ ELEMENTLERİ
        =================================================
        */

        const recordViewer =
            getElement("recordViewer");

        const recordTitle =
            getElement("recordTitle");

        const recordClassification =
            getElement("recordClassification");

        const recordContent =
            getElement("recordContent");

        const closeRecordViewer =
            getElement("closeRecordViewer");

        const recordContinue =
            getElement("recordContinue");

        /*
        =================================================
        KAYIT BULUNDU POPUP
        =================================================
        */

        const foundRecord =
            getElement("foundRecord");

        const foundRecordTitle =
            getElement("foundRecordTitle");

        const foundRecordText =
            getElement("foundRecordText");

        const closeFoundRecord =
            getElement("closeFoundRecord");

        /*
        =================================================
        ÇEKMECE PANELİ ELEMENTLERİ
        =================================================
        */

        const drawerLockPanel =
            getElement("drawerLockPanel");

        const drawerCodeDisplay =
            getElement("drawerCodeDisplay");

        const drawerKeypad =
            getElement("drawerKeypad");

        const drawerCodeMessage =
            getElement("drawerCodeMessage");

        const clearDrawerCode =
            getElement("clearDrawerCode");

        const submitDrawerCode =
            getElement("submitDrawerCode");

        const closeDrawerLock =
            getElement("closeDrawerLock");

        /*
        =================================================
        ANAHTAR KART POPUP
        =================================================
        */

        const foundKeycard =
            getElement("foundKeycard");

        const closeFoundKeycard =
            getElement("closeFoundKeycard");

        /*
        =================================================
        KAPI PANELİ ELEMENTLERİ
        =================================================
        */

        const doorCodePanel =
            getElement("doorCodePanel");

        const doorCodeDisplay =
            getElement("doorCodeDisplay");

        const doorKeypad =
            getElement("doorKeypad");

        const doorCodeMessage =
            getElement("doorCodeMessage");

        const clearDoorCode =
            getElement("clearDoorCode");

        const submitDoorCode =
            getElement("submitDoorCode");

        const closeDoorCode =
            getElement("closeDoorCode");

        const keycardStatus =
            getElement("keycardStatus");

        const keycardStatusText =
            getElement("keycardStatusText");

        /*
        =================================================
        DİYALOG ELEMENTLERİ
        =================================================
        */

        const dialogContinue =
            getElement("dialogContinue");

        const dialogClose =
            getElement("dialog-x-button");

        /*
        =================================================
        BÖLÜM TAMAMLAMA ELEMENTLERİ
        =================================================
        */

        const chapterComplete =
            getElement("chapterComplete");

        const nextChapterButton =
            getElement("nextChapter");

        /*
        =================================================
        KORKU EFEKTİ ELEMENTLERİ
        =================================================
        */

        const roomFlicker =
            getElement("roomFlicker");

        const movingShadow =
            getElement("movingShadow");

        const hallwayFigure =
            getElement("hallwayFigure");

        /*
        =================================================
        OYUN DURUMU
        =================================================
        */

        const state = {

            foundRecords:
                [],

            drawerCodeInput:
                "",

            doorCodeInput:
                "",

            drawerUnlocked:
                false,

            keycardCollected:
                false,

            chapterCompleted:
                false,

            wrongCabinetSearches:
                0,

            wrongDrawerAttempts:
                0,

            wrongDoorAttempts:
                0,

            activeRecordId:
                null,

            activePopupRecordId:
                null,

            modalOpen:
                false

        };

        /*
        =================================================
        KAYITLI DURUMU YÜKLE
        =================================================
        */

        function loadState() {

            const savedRecords =
                save.get(
                    "chapter2FoundRecords"
                );

            state.foundRecords =
                Array.isArray(savedRecords)
                    ? savedRecords.filter(
                        recordId =>
                            Object.prototype.hasOwnProperty.call(
                                RECORD_DATA,
                                recordId
                            )
                    )
                    : [];

            state.drawerUnlocked =
                save.get(
                    "chapter2DrawerUnlocked"
                ) === true;

            state.keycardCollected =
                save.get(
                    "chapter2HasKeycard"
                ) === true;

            state.chapterCompleted =
                save.get(
                    "chapter2Completed"
                ) === true;

            state.wrongCabinetSearches =
                Number(
                    save.get(
                        "chapter2WrongCabinetSearches"
                    )
                ) || 0;

            state.wrongDrawerAttempts =
                Number(
                    save.get(
                        "chapter2WrongDrawerAttempts"
                    )
                ) || 0;

            state.wrongDoorAttempts =
                Number(
                    save.get(
                        "chapter2WrongDoorAttempts"
                    )
                ) || 0;

        }

        /*
        =================================================
        DURUMU KAYDET
        =================================================
        */

        function saveState() {

            save.set(
                "chapter2FoundRecords",
                [...state.foundRecords]
            );

            save.set(
                "chapter2DrawerUnlocked",
                state.drawerUnlocked
            );

            save.set(
                "chapter2HasKeycard",
                state.keycardCollected
            );

            save.set(
                "chapter2Completed",
                state.chapterCompleted
            );

            save.set(
                "chapter2WrongCabinetSearches",
                state.wrongCabinetSearches
            );

            save.set(
                "chapter2WrongDrawerAttempts",
                state.wrongDrawerAttempts
            );

            save.set(
                "chapter2WrongDoorAttempts",
                state.wrongDoorAttempts
            );

        }

        loadState();

        /*
        =================================================
        OYUNCU BİLGİSİ
        =================================================
        */

        const currentSave =
            window.AshvaleSave?.getSave?.();

        const playerName =
            currentSave?.player?.name ||
            window.AshvaleSave?.getPlayerName?.() ||
            "Oyuncu";

        if (playerNameElement) {
            playerNameElement.textContent =
                playerName;
     }

        /*
        =================================================
        ENVANTER SİSTEMİ
        =================================================
        */

        AshvaleInventory.initialize({

            element:
                "inventorySlots",

            save,

            storageKey:
                "playerInventory",

            slots:
                6

        });

        /*
        Eski kayıtta bulunan eşyaları
        yeni envanter sistemiyle eşleştir.
        */

        state.foundRecords.forEach(
            recordId => {

                const item =
                    RECORD_ITEMS[
                        recordId
                    ];

                if (
                    item &&
                    !AshvaleInventory.has(
                        item.id
                    )
                ) {

                    AshvaleInventory.add(
                        item
                    );

                }

            }
        );

        if (
            state.keycardCollected &&
            !AshvaleInventory.has(
                KEYCARD_ID
            )
        ) {

            AshvaleInventory.add(
                KEYCARD_ITEM
            );

        }

        function playerHasKeycard() {

            return (
                state.keycardCollected ||
                AshvaleInventory.has(
                    KEYCARD_ID
                )
            );

        }

        /*
        =================================================
        SES SİSTEMİ
        =================================================
        */

        AshvaleAudio.initialize({

            sounds: {

                chapter2Ambience: {
                    src:
                        "assets/audio/ambience/chapter2_ambient.mp3",

                    type:
                        "ambience",

                    loop:
                        true,

                    volume:
                        0.64
                },

                phoneRing: {
                    src:
                        "assets/audio/effects/phone_ring.mp3",

                    type:
                        "effect",

                    volume:
                        0.76
                },

                cabinetOpen: {
                    src:
                        "assets/audio/effects/cabinet.mp3",

                    type:
                        "effect",

                    volume:
                        0.62
                },

                footsteps: {
                    src:
                        "assets/audio/effects/footsteps.mp3",

                    type:
                        "effect",

                    volume:
                        0.72
                },

                computerBoot: {
                    src:
                        "assets/audio/effects/computer_boot.mp3",

                    type:
                        "effect",

                    volume:
                        0.66
                },

                scare: {
                    src:
                        "assets/audio/effects/scare.mp3",

                    type:
                        "effect",

                    volume:
                        0.82
                },

                keypadPress: {
                    src:
                        "assets/audio/effects/keypad_press.mp3",

                    type:
                        "effect",

                    volume:
                        0.48
                },

                keypadError: {
                    src:
                        "assets/audio/effects/keypad_error.mp3",

                    type:
                        "effect",

                    volume:
                        0.62
                },

                keypadSuccess: {
                    src:
                        "assets/audio/effects/keypad_success.mp3",

                    type:
                        "effect",

                    volume:
                        0.66
                },

                drawerOpen: {
                    src:
                        "assets/audio/effects/drawer_open.mp3",

                    type:
                        "effect",

                    volume:
                        0.68
                },

                doorUnlock: {
                    src:
                        "assets/audio/effects/door_unlock.mp3",

                    type:
                        "effect",

                    volume:
                        0.72
                },

                paperPickup: {
                    src:
                        "assets/audio/effects/paper_pickup.mp3",

                    type:
                        "effect",

                    volume:
                        0.54
                }

            }

        });

        AshvaleAudio.playAmbience(
            "chapter2Ambience"
        );

        /*
        =================================================
        SES YARDIMCISI
        =================================================
        */

        function playEffect(
            soundName
        ) {

            try {

                AshvaleAudio.playEffect(
                    soundName
                );

            } catch (error) {

                console.warn(
                    `Ses oynatılamadı: ${soundName}`,
                    error
                );

            }

        }

        /*
        =================================================
        DİYALOG SİSTEMİ
        =================================================
        */

        AshvaleDialogue.initialize({

            container:
                "dialog",

            speaker:
                "dialogTitle",

            text:
                "dialogText"

        });

        dialogContinue
            ?.addEventListener(
                "click",
                () => {

                    AshvaleDialogue.next();

                }
            );

        dialogClose
            ?.addEventListener(
                "click",
                () => {

                    AshvaleDialogue.clearQueue();
                    AshvaleDialogue.hide();

                }
            );

        function showDialogue(
            speaker,
            text,
            speed = 20
        ) {

            AshvaleDialogue.show({

                speaker,
                text,
                speed

            });

        }

        function playDialogue(
            dialogueList
        ) {

            AshvaleDialogue.play(
                dialogueList
            );

        }

        /*
        =================================================
        ELEMENT GÖSTER / GİZLE
        =================================================
        */

        function showElement(
            element
        ) {

            if (!element) {
                return;
            }

            element.classList.remove(
                "hidden"
            );

            element.setAttribute(
                "aria-hidden",
                "false"
            );

            state.modalOpen =
                true;

        }

        function hideElement(
            element
        ) {

            if (!element) {
                return;
            }

            element.classList.add(
                "hidden"
            );

            element.setAttribute(
                "aria-hidden",
                "true"
            );

            state.modalOpen =
                false;

        }

        /*
        =================================================
        ETKİLEŞİM BİLDİRİMİ
        =================================================
        */

        function showPrompt(
            text
        ) {

            if (
                !prompt ||
                !promptText ||
                state.modalOpen
            ) {
                return;
            }

            promptText.textContent =
                text;

            prompt.classList.remove(
                "hidden"
            );

            prompt.setAttribute(
                "aria-hidden",
                "false"
            );

        }

        function hidePrompt() {

            if (!prompt) {
                return;
            }

            prompt.classList.add(
                "hidden"
            );

            prompt.setAttribute(
                "aria-hidden",
                "true"
            );

        }

        function registerInteraction(
            element,
            label,
            action
        ) {

            if (!element) {
                return;
            }

            element.addEventListener(
                "mouseenter",
                () => {

                    showPrompt(
                        label
                    );

                }
            );

            element.addEventListener(
                "mouseleave",
                hidePrompt
            );

            element.addEventListener(
                "focus",
                () => {

                    showPrompt(
                        label
                    );

                }
            );

            element.addEventListener(
                "blur",
                hidePrompt
            );

            element.addEventListener(
                "click",
                () => {

                    hidePrompt();

                    if (
                        state.modalOpen
                    ) {
                        return;
                    }

                    action();

                }
            );

            element.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key !== "Enter" &&
                        event.key !== " "
                    ) {
                        return;
                    }

                    event.preventDefault();
                    hidePrompt();

                    if (
                        state.modalOpen
                    ) {
                        return;
                    }

                    action();

                }
            );

        }

        /*
        =================================================
        POPUP KAPATMA YARDIMCISI
        =================================================
        */

        function closeAllPanels() {

            hideElement(
                computerScreen
            );

            hideElement(
                recordViewer
            );

            hideElement(
                foundRecord
            );

            hideElement(
                drawerLockPanel
            );

            hideElement(
                foundKeycard
            );

            hideElement(
                doorCodePanel
            );

            state.activeRecordId =
                null;

            state.activePopupRecordId =
                null;

            state.modalOpen =
                false;

        }

        /*
        =================================================
        GÖREV VE İLERLEME SİSTEMİ
        =================================================
        */

        function getRecordCount() {

            return state.foundRecords.length;

        }

        function hasAllRecords() {

            return getRecordCount() >= 3;

        }

        function updateProgressBar() {

            const foundCount =
                getRecordCount();

            const percentage =
                Math.min(
                    100,
                    (
                        foundCount /
                        3
                    ) * 100
                );

            if (recordProgress) {

                recordProgress.textContent =
                    `${foundCount} / 3`;

            }

            if (recordProgressBar) {

                recordProgressBar.style.width =
                    `${percentage}%`;

            }

        }

        function updateObjective() {

            const foundCount =
                getRecordCount();

            if (
                state.chapterCompleted
            ) {

                if (objectiveText) {

                    objectiveText.textContent =
                        "Tedavi Kanadı'na erişim sağlandı.";

                }

                return;

            }

            if (
                !hasAllRecords()
            ) {

                if (objectiveText) {

                    objectiveText.textContent =
                        `3179 numaralı hastanın kayıp kayıt parçalarını bul. (${foundCount}/3)`;

                }

                if (storyText) {

                    storyText.textContent =
                        "Eski kayıt odasındaki belgeler parçalanmış. 3179 numaralı hastanın geçmişini öğrenmek için kayıp kayıtları birleştirmen gerekiyor.";

                }

                return;

            }

            if (
                !state.drawerUnlocked
            ) {

                if (objectiveText) {

                    objectiveText.textContent =
                        "Kayıtlardaki ipuçlarını kullanarak kilitli çekmeceyi aç.";

                }

                if (storyText) {

                    storyText.textContent =
                        "Üç kayıt parçası tamamlandı. Belgelerde tekrar eden 317 sayısı, kilitli çekmecenin kodu olabilir.";

                }

                return;

            }

            if (
                !playerHasKeycard()
            ) {

                if (objectiveText) {

                    objectiveText.textContent =
                        "Açılan çekmecedeki anahtar kartını al.";

                }

                return;

            }

            if (objectiveText) {

                objectiveText.textContent =
                    "Anahtar kartı ve hasta kayıtlarındaki kodla çıkış kapısını aç.";

            }

            if (storyText) {

                storyText.textContent =
                    "Anahtar kartı buldun. Son kayıt, Tedavi Kanadı kapısının dört haneli saat koduyla açıldığını söylüyor.";

            }

        }

        function refreshInterface() {

            updateProgressBar();
            updateObjective();

            if (objectiveProgress) {

                objectiveProgress.classList.toggle(
                    "completed",
                    hasAllRecords()
                );

            }

            if (
                keycardStatus &&
                keycardStatusText
            ) {

                const hasKeycard =
                    playerHasKeycard();

                keycardStatus.classList.toggle(
                    "verified",
                    hasKeycard
                );

                keycardStatusText.textContent =
                    hasKeycard
                        ? "ANAHTAR KART DOĞRULANDI"
                        : "ANAHTAR KART BEKLENİYOR";

            }

        }

        refreshInterface();

        /*
        =================================================
        İPUCU
        =================================================
        */

        function showHint() {

            if (
                !hasAllRecords()
            ) {

                showDialogue(
                    "İpucu",
                    "Dosya dolaplarının hepsini tek tek aç. Bazıları boş görünse de üçünde işine yarayacak bir kayıt parçası var."
                );

                return;

            }

            if (
                !state.drawerUnlocked
            ) {

                showDialogue(
                    "İpucu",
                    "Topladığın kayıtlarda aynı sayı defalarca geçiyor. Kilitli çekmecenin şifresi bu olabilir."
                );

                return;

            }

            if (
                !playerHasKeycard()
            ) {

                showDialogue(
                    "İpucu",
                    "Çekmece artık açık. İçindeki anahtar kartı almayı unutma."
                );

                return;

            }

            if (
                !state.chapterCompleted
            ) {

                showDialogue(
                    "İpucu",
                    "Duvardaki bozuk saat tam olarak hangi saatte durduğuna dikkatlice bak. Çıkış kapısının dört haneli kodu bu olabilir."
                );

                return;

            }

            showDialogue(
                "İpucu",
                "Bu bölümde yapacak başka bir şey kalmadı. Çıkış kapısına git."
            );

        }

        hintButton?.addEventListener(
            "click",
            showHint
        );

        /*
        =================================================
        KOD EKRANI YARDIMCISI
        =================================================
        */

        function updateCodeDisplay(
            displayElement,
            currentValue,
            totalLength
        ) {

            if (!displayElement) {
                return;
            }

            const digitElements =
                displayElement.querySelectorAll(
                    "span"
                );

            digitElements.forEach(
                (
                    digitElement,
                    index
                ) => {

                    digitElement.textContent =
                        currentValue[index] ||
                        "_";

                }
            );

            /*
            HTML'deki span sayısı yanlışsa
            konsola uyarı bırak.
            */

            if (
                digitElements.length !==
                totalLength
            ) {

                console.warn(
                    "Şifre ekranındaki hane sayısı beklenenden farklı.",
                    {
                        expected:
                            totalLength,

                        received:
                            digitElements.length
                    }
                );

            }

        }

        function setCodeMessage(
            element,
            text,
            type = ""
        ) {

            if (!element) {
                return;
            }

            element.textContent =
                text;

            element.classList.remove(
                "error",
                "success"
            );

            if (type) {

                element.classList.add(
                    type
                );

            }

        }

        updateCodeDisplay(
            drawerCodeDisplay,
            state.drawerCodeInput,
            3
        );

        updateCodeDisplay(
            doorCodeDisplay,
            state.doorCodeInput,
            4
        );

        /*
        =================================================
        MODAL KAPATMA BUTONLARI
        =================================================
        */

        closeComputer
            ?.addEventListener(
                "click",
                () => {

                    hideElement(
                        computerScreen
                    );

                }
            );

        computerContinue
            ?.addEventListener(
                "click",
                () => {

                    hideElement(
                        computerScreen
                    );

                }
            );

        closeRecordViewer
            ?.addEventListener(
                "click",
                () => {

                    hideElement(
                        recordViewer
                    );

                    state.activeRecordId =
                        null;

                }
            );

        recordContinue
            ?.addEventListener(
                "click",
                () => {

                    hideElement(
                        recordViewer
                    );

                    state.activeRecordId =
                        null;

                }
            );

        closeDrawerLock
            ?.addEventListener(
                "click",
                () => {

                    hideElement(
                        drawerLockPanel
                    );

                    state.drawerCodeInput =
                        "";

                    updateCodeDisplay(
                        drawerCodeDisplay,
                        state.drawerCodeInput,
                        3
                    );

                    setCodeMessage(
                        drawerCodeMessage,
                        ""
                    );

                }
            );

        closeDoorCode
            ?.addEventListener(
                "click",
                () => {

                    hideElement(
                        doorCodePanel
                    );

                    state.doorCodeInput =
                        "";

                    updateCodeDisplay(
                        doorCodeDisplay,
                        state.doorCodeInput,
                        4
                    );

                    setCodeMessage(
                        doorCodeMessage,
                        ""
                    );

                }
            );

        /*
        =================================================
        ESC TUŞU
        =================================================
        */

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key !== "Escape"
                ) {
                    return;
                }

                if (
                    chapterComplete &&
                    !chapterComplete.classList.contains(
                        "hidden"
                    )
                ) {
                    return;
                }

                closeAllPanels();
                AshvaleDialogue.clearQueue();
                AshvaleDialogue.hide();

            }
        );
                /*
        =================================================
        KORKU EFEKTLERİ
        =================================================
        */

        function activateTemporaryClass(
            element,
            className,
            duration = 1200
        ) {

            if (!element) {
                return;
            }

            element.classList.remove(
                className
            );

            void element.offsetWidth;

            element.classList.add(
                className
            );

            window.setTimeout(
                () => {

                    element.classList.remove(
                        className
                    );

                },
                duration
            );

        }

        function triggerLightFlicker() {

            activateTemporaryClass(
                roomFlicker,
                "active",
                900
            );

        }

        function triggerMovingShadow() {

            activateTemporaryClass(
                movingShadow,
                "active",
                1600
            );

        }

        function triggerHallwayFigure() {

            activateTemporaryClass(
                hallwayFigure,
                "active",
                1300
            );

        }

        function triggerScreenShake(
            strength = "medium"
        ) {

            if (
                window.Effects &&
                typeof window.Effects.shake ===
                    "function"
            ) {

                window.Effects.shake(
                    "#room",
                    strength
                );

                return;

            }

            activateTemporaryClass(
                room,
                "room-shake",
                500
            );

        }

        function triggerBlackout(
            duration = 650
        ) {

            if (
                window.Effects &&
                typeof window.Effects.blackout ===
                    "function"
            ) {

                window.Effects.blackout(
                    duration
                );

                return;

            }

            triggerLightFlicker();

        }

        function triggerRandomScare(
            level = 1
        ) {

            if (level === 1) {

                playEffect(
                    "phoneRing"
                );

                triggerLightFlicker();

                return;

            }

            if (level === 2) {

                playEffect(
                    "footsteps"
                );

                triggerMovingShadow();

                return;

            }

            if (level === 3) {

                playEffect(
                    "scare"
                );

                triggerBlackout(
                    700
                );

                triggerHallwayFigure();

                return;

            }

            playEffect(
                "scare"
            );

            triggerScreenShake(
                "medium"
            );

            triggerMovingShadow();
            triggerLightFlicker();

        }

        /*
        =================================================
        KAYIT GÖRÜNTÜLEYİCİ
        =================================================
        */

        function openRecordViewer(
            recordId
        ) {

            const record =
                RECORD_DATA[
                    recordId
                ];

            if (!record) {

                console.warn(
                    "Hasta kayıt verisi bulunamadı:",
                    recordId
                );

                return;

            }

            state.activeRecordId =
                recordId;

            if (recordTitle) {

                recordTitle.textContent =
                    record.title;

            }

            if (recordClassification) {

                recordClassification.textContent =
                    record.classification;

            }

            if (recordContent) {

                recordContent.innerHTML =
                    record.content;

            }

            showElement(
                recordViewer
            );

        }

        /*
        =================================================
        KAYIT BULUNDU POPUP
        =================================================
        */

        function openFoundRecordPopup(
            recordId
        ) {

            const item =
                RECORD_ITEMS[
                    recordId
                ];

            if (!item) {
                return;
            }

            state.activePopupRecordId =
                recordId;

            if (foundRecordTitle) {

                foundRecordTitle.textContent =
                    item.name;

            }

            if (foundRecordText) {

                foundRecordText.textContent =
                    item.description;

            }

            showElement(
                foundRecord
            );

        }

        function closeFoundRecordPopup() {

            const recordId =
                state.activePopupRecordId;

            hideElement(
                foundRecord
            );

            state.activePopupRecordId =
                null;

            if (recordId) {

                openRecordViewer(
                    recordId
                );

            }

        }

        closeFoundRecord
            ?.addEventListener(
                "click",
                closeFoundRecordPopup
            );

        /*
        =================================================
        KAYIT PARÇASI EKLEME
        =================================================
        */

        function collectRecord(
            recordId
        ) {

            if (
                state.foundRecords.includes(
                    recordId
                )
            ) {

                openRecordViewer(
                    recordId
                );

                return;
            }

            const item =
                RECORD_ITEMS[
                    recordId
                ];

            if (!item) {
                return;
            }

            state.foundRecords.push(
                recordId
            );

            AshvaleInventory.add(
                item
            );

            playEffect(
                "paperPickup"
            );

            saveState();
            refreshInterface();

            openFoundRecordPopup(
                recordId
            );

            const foundCount =
                getRecordCount();

            if (
                foundCount === 1
            ) {

                triggerLightFlicker();

            }

            if (
                foundCount === 2
            ) {

                window.setTimeout(
                    () => {

                        playEffect(
                            "footsteps"
                        );

                        triggerMovingShadow();

                    },
                    500
                );

            }

            if (
                foundCount === 3
            ) {

                window.setTimeout(
                    () => {

                        triggerBlackout(
                            750
                        );

                        triggerHallwayFigure();

                    },
                    650
                );

            }

        }

        /*
        =================================================
        DOSYA DOLAPLARI
        =================================================
        */

        function inspectCabinet(
            cabinet
        ) {

            const cabinetId =
                cabinet.id;

            const recordId =
                cabinet.dataset.recordId;

            const cabinetOpenedKey =
                `chapter2CabinetOpened_${cabinetId}`;

            const wasOpened =
                save.get(
                    cabinetOpenedKey
                ) === true;

            playEffect(
                "cabinetOpen"
            );

            save.set(
                cabinetOpenedKey,
                true
            );

            /*
            Kayıt bulunan dolaplar:
            A, B ve C
            */

            if (
                recordId === "record-a" ||
                recordId === "record-b" ||
                recordId === "record-c"
            ) {

                if (
                    state.foundRecords.includes(
                        recordId
                    )
                ) {

                    showDialogue(
                        cabinet.dataset.text ||
                            "Dosya Dolabı",
                        "Bu dolaptaki kayıt parçasını daha önce aldın."
                    );

                    window.setTimeout(
                        () => {

                            openRecordViewer(
                                recordId
                            );

                        },
                        450
                    );

                    return;
                }

                collectRecord(
                    recordId
                );

                return;
            }

            state.wrongCabinetSearches++;

            saveState();

            if (
                wasOpened
            ) {

                showDialogue(
                    cabinet.dataset.text ||
                        "Dosya Dolabı",
                    "Bu dolabı daha önce inceledin. İçinde işe yarar hiçbir şey yok."
                );

                return;
            }

            const emptyCabinetTexts = {

                registerD:
                    "Dolabın içinde rutubetten birbirine yapışmış ölüm raporları var. İsimlerin tamamı karalanmış.",

                registerE:
                    "Dosyaların çoğu boş. Sayfalardan birinin arkasına yalnızca şu yazılmış: “Bizi kayıt altına alma.”",

                registerF:
                    "Dolabın içinde hasta bileklikleri var. Bazılarında tarih yerine aynı saat yazıyor: 03:17."

            };

            showDialogue(
                cabinet.dataset.text ||
                    "Dosya Dolabı",
                emptyCabinetTexts[
                    cabinetId
                ] ||
                    "Bu dolapta okunamayacak durumda eski kayıtlar var."
            );

            triggerRandomScare(
                Math.min(
                    state.wrongCabinetSearches,
                    4
                )
            );

        }

        cabinets.forEach(
    cabinet => {

        const interactionLabel =
            cabinet.id === "registerA"
                ? "Panodaki Kayıt"
                : (
                    cabinet.dataset.text ||
                    "Dosya Dolabı"
                );

        registerInteraction(
            cabinet,
            interactionLabel,
            () => {
                inspectCabinet(
                    cabinet
                );
            }
        );

    }
);

        /*
        =================================================
        BİLGİSAYAR
        =================================================
        */

        function getComputerTerminalText() {

            const foundCount =
                getRecordCount();

            if (
                foundCount === 0
            ) {

                return `SYSTEM STATUS : PARTIAL FAILURE

PATIENT SEARCH : 3179

PATIENT ID     : 3179
NAME           : [REDACTED]
STATUS         : ACTIVE
WARD           : TREATMENT WING
ROOM           : 12

LAST UPDATE    : 03:17 AM
ACCESS LEVEL   : RESTRICTED

WARNING:
PHYSICAL RECORD INCOMPLETE.

THREE RECORD FRAGMENTS REQUIRED.`;

            }

            if (
                foundCount === 1
            ) {

                return `SYSTEM STATUS : PARTIAL FAILURE

PATIENT SEARCH : 3179

RECORD FRAGMENTS FOUND : 1 / 3

RECOVERED ENTRY:
ADMISSION DATE : 17.03.1987

ERROR:
IDENTITY FILE CORRUPTED.

SEARCH PHYSICAL ARCHIVES
FOR REMAINING FRAGMENTS.`;

            }

            if (
                foundCount === 2
            ) {

                return `SYSTEM STATUS : UNSTABLE

PATIENT SEARCH : 3179

RECORD FRAGMENTS FOUND : 2 / 3

RECOVERED EXPERIMENT CODE:
A-317

SECURITY NOTICE:
ARCHIVE DRAWER USES
THREE-DIGIT EXPERIMENT CODE.

WARNING:
UNAUTHORIZED MOVEMENT DETECTED
IN RECORDS ROOM.`;

            }

            if (
                foundCount >= 3 &&
                !state.drawerUnlocked
            ) {

                return `SYSTEM STATUS : CRITICAL

PATIENT SEARCH : 3179

RECORD FRAGMENTS FOUND : 3 / 3

EXPERIMENT CODE : A-317
TRANSFER TIME   : 03:17
WARD            : TREATMENT WING

ARCHIVE DRAWER:
SECURITY CODE REQUIRED.

ERROR:
PATIENT STATUS REMAINS ACTIVE.`;

            }

            if (
                state.drawerUnlocked &&
                !playerHasKeycard()
            ) {

                return `SYSTEM STATUS : CRITICAL

ARCHIVE DRAWER UNLOCKED.

SECURITY ITEM DETECTED:
TREATMENT WING KEYCARD

INSTRUCTION:
COLLECT ACCESS CARD.

DO NOT REMAIN IN RECORDS ROOM.`;

            }

            return `SYSTEM STATUS : SECURITY BREACH

PATIENT 3179
STATUS : ACTIVE

KEYCARD AUTHORIZATION:
VERIFIED

FINAL ACCESS PROTOCOL:
USE FOUR-DIGIT TRANSFER TIME.

TRANSFER TIME:
03:17

WARNING:
DO NOT OPEN ROOM 12.`;

        }

        function openComputer() {

            playEffect(
                "computerBoot"
            );

            if (terminalText) {

                terminalText.textContent =
                    getComputerTerminalText();

            }

            showElement(
                computerScreen
            );

            if (
                getRecordCount() >= 2
            ) {

                window.setTimeout(
                    triggerLightFlicker,
                    550
                );

            }

        }

        registerInteraction(
            computer,
            "Eski Bilgisayar",
            openComputer
        );

        /*
        =================================================
        TELEFON
        =================================================
        */

        function inspectTelephone() {

            playEffect(
                "phoneRing"
            );

            const foundCount =
                getRecordCount();

            if (
                foundCount === 0
            ) {

                playDialogue([

                    {
                        speaker:
                            "Eski Telefon",

                        text:
                            "Telefonun hattı bağlı görünmüyor. Buna rağmen ahizeden kesik bir nefes sesi geliyor.",

                        speed:
                            20
                    },

                    {
                        speaker:
                            "Fısıltı",

                        text:
                            "“Üç... bir... yedi...”",

                        speed:
                            34
                    }

                ]);

                return;
            }

            if (
                foundCount < 3
            ) {

                playDialogue([

                    {
                        speaker:
                            "Eski Telefon",

                        text:
                            "Ahizeyi kaldırdığında karşı tarafta kâğıtların çevrildiğini duyuyorsun.",

                        speed:
                            20
                    },

                    {
                        speaker:
                            "Bilinmeyen Ses",

                        text:
                            "“Dosyayı tamamlama...”",

                        speed:
                            31
                    },

                    {
                        speaker:
                            "",

                        text:
                            "Hat aniden kesiliyor.",

                        speed:
                            20
                    }

                ]);

                triggerMovingShadow();

                return;
            }

            playDialogue([

                {
                    speaker:
                        "Eski Telefon",

                    text:
                        "Ahizeden çocuk gibi ince bir ses geliyor.",

                    speed:
                        20
                },

                {
                    speaker:
                        "Bilinmeyen Ses",

                    text:
                        "“Saat yine 03:17 oldu.”",

                    speed:
                        32
                },

                {
                    speaker:
                        "Bilinmeyen Ses",

                    text:
                        "“Kapıyı açarsan beni bulursun.”",

                    speed:
                        32
                }

            ]);

            triggerLightFlicker();

        }

        registerInteraction(
            telephone,
            "Eski Telefon",
            inspectTelephone
        );

        /*
        =================================================
        DEVRİLMİŞ SANDALYE
        =================================================
        */

        registerInteraction(
            chair,
            "Devrilmiş Sandalye",
            () => {

                if (
                    getRecordCount() < 2
                ) {

                    showDialogue(
                        "Devrilmiş Sandalye",
                        "Sandalye aceleyle devrilmiş. Zemindeki sürüklenme izleri dosya dolaplarının önünden çıkış kapısına kadar uzanıyor."
                    );

                    return;
                }

                showDialogue(
                    "Devrilmiş Sandalye",
                    "Sandalye ayaklarından birine kurumuş bir hasta bilekliği dolanmış. Üzerinde yalnızca “3179” yazıyor."
                );

                triggerMovingShadow();

            }
        );

        /*
        =================================================
        DAĞILMIŞ EVRAKLAR
        =================================================
        */

        registerInteraction(
            papers,
            "Dağılmış Evraklar",
            () => {

                if (
                    typeof AshvaleDialogue.showNote ===
                    "function"
                ) {

                    AshvaleDialogue.showNote(
                        "Yırtılmış Personel Notu",
                        `17 Mart 1987

Denek 3179 tekrar uyandı.

Tedavi Kanadı'na nakledilmeden önce bütün fiziksel kayıtların üç parçaya ayrılması emredildi.

Arşiv çekmecesinin şifresi deney kodudur.

Kapı kodu ise nakil saatidir.`
                    );

                    return;
                }

                showDialogue(
                    "Yırtılmış Personel Notu",
                    "Denek 3179 tekrar uyandı. Fiziksel kayıtlar üç parçaya ayrıldı. Çekmece şifresi deney kodu, kapı şifresi ise nakil saatidir."
                );

            }
        );

        /*
        =================================================
        RÖNTGEN PANOSU
        =================================================
        */

        registerInteraction(
            xrayBoard,
            "Röntgen Panosu",
            () => {

                if (
                    getRecordCount() === 0
                ) {

                    showDialogue(
                        "Röntgen Panosu",
                        "Panoda insan göğsüne benzeyen bir röntgen var. Fakat kaburgaların arasında ikinci bir gölge seçiliyor."
                    );

                    triggerLightFlicker();

                    return;
                }

                if (
                    !hasAllRecords()
                ) {

                    showDialogue(
                        "Röntgen Panosu",
                        "Röntgenin köşesine kırmızı kalemle “A-317” yazılmış. Bu kod hasta dosyalarından biriyle bağlantılı olabilir."
                    );

                    return;
                }

                playDialogue([

                    {
                        speaker:
                            "Röntgen Panosu",

                        text:
                            "Röntgenin köşesindeki kod artık anlamlı geliyor: A-317.",

                        speed:
                            20
                    },

                    {
                        speaker:
                            "",

                        text:
                            "Kayıt parçasındaki notta arşiv çekmecesinin üç haneli deney koduyla kilitlendiği yazıyordu.",

                        speed:
                            20
                    }

                ]);

            }
        );

        /*
        =================================================
        DUVAR SAATİ
        =================================================
        */

        registerInteraction(
            wallClock,
            "Bozuk Duvar Saati",
            () => {

                if (
                    !hasAllRecords()
                ) {

                    showDialogue(
                        "Bozuk Duvar Saati",
                        "Saatin akrebi 3'ü, yelkovanı 17'yi gösteren noktada sıkışmış. Saniye ibresi geriye doğru titriyor."
                    );

                    return;
                }

                playDialogue([

                    {
                        speaker:
                            "Bozuk Duvar Saati",

                        text:
                            "Saat tam 03:17'de durmuş.",

                        speed:
                            20
                    },

                    {
                        speaker:
                            "Hasta Kaydı",

                        text:
                            "Son kayıtta kapı için dört haneli nakil saatinin kullanılması gerektiği yazıyordu.",

                        speed:
                            20
                    },

                    {
                        speaker:
                            "",

                        text:
                            "Kapı kodu 0317 olabilir.",

                        speed:
                            20
                    }

                ]);

                triggerLightFlicker();

            }
        );
                /*
        =================================================
        KİLİTLİ ÇEKMECE
        =================================================
        */

        function openDrawerPanel() {

            if (!hasAllRecords()) {

                showDialogue(
                    "Kilitli Çekmece",
                    "Çekmece sıkıca kilitlenmiş. Önce hasta dosyalarını tamamlamalısın."
                );

                return;
            }

            state.drawerCodeInput = "";

            updateCodeDisplay(
                drawerCodeDisplay,
                state.drawerCodeInput,
                3
            );

            setCodeMessage(
                drawerCodeMessage,
                ""
            );

            showElement(
                drawerLockPanel
            );

        }

        registerInteraction(
            lockedDrawer,
            "Kilitli Çekmece",
            openDrawerPanel
        );
        /*
=================================================
ÇEKMECE TUŞ TAKIMI
=================================================
*/

if (drawerKeypad) {

    drawerKeypad
        .querySelectorAll("[data-drawer-number]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    if (state.drawerCodeInput.length >= 3) {
                        return;
                    }

                    playEffect("keypadPress");

                    state.drawerCodeInput +=
                        button.dataset.drawerNumber;

                    updateCodeDisplay(
                        drawerCodeDisplay,
                        state.drawerCodeInput,
                        3
                    );

                }
            );

        });

}

clearDrawerCode?.addEventListener(
    "click",
    () => {

        playEffect("keypadPress");

        state.drawerCodeInput = "";

        updateCodeDisplay(
            drawerCodeDisplay,
            state.drawerCodeInput,
            3
        );

        setCodeMessage(
            drawerCodeMessage,
            ""
        );

    }
);

submitDrawerCode?.addEventListener(
    "click",
    () => {

        if (
            state.drawerCodeInput !== DRAWER_CODE
        ) {

            playEffect("keypadError");

            state.wrongDrawerAttempts++;

            saveState();

            setCodeMessage(
                drawerCodeMessage,
                "Kod hatalı.",
                "error"
            );

            triggerRandomScare(
                Math.min(
                    state.wrongDrawerAttempts + 1,
                    4
                )
            );

            state.drawerCodeInput = "";

            updateCodeDisplay(
                drawerCodeDisplay,
                state.drawerCodeInput,
                3
            );

            return;

        }

        playEffect("keypadSuccess");

        state.drawerUnlocked = true;

        saveState();

        refreshInterface();

        lockedDrawer?.classList.add(
            "unlocked"
        );

        setCodeMessage(
            drawerCodeMessage,
            "Çekmece açıldı.",
            "success"
        );

        window.setTimeout(
            () => {

                hideElement(
                    drawerLockPanel
                );

                showElement(
                    foundKeycard
                );

                playEffect(
                    "drawerOpen"
                );

            },
            700
        );

    }
);
/*
=================================================
ÇEKMECE AÇILDIKTAN SONRA
=================================================
*/

if (state.drawerUnlocked) {

    lockedDrawer?.classList.add(
        "unlocked"
    );

}

closeFoundKeycard?.addEventListener(
    "click",
    () => {

        hideElement(
            foundKeycard
        );

        if (!playerHasKeycard()) {

            AshvaleInventory.add(
                KEYCARD_ITEM
            );

            state.keycardCollected = true;

            saveState();

            refreshInterface();

        }

        playDialogue([

            {
                speaker:
                    "Anahtar Kart",

                text:
                    "Tedavi Kanadı erişim kartını aldın.",

                speed:
                    20
            },

            {
                speaker:
                    "",

                text:
                    "Hasta kayıtlarında belirtilen saat kodunu kullanarak kapıyı açabilirsin.",

                speed:
                    20
            }

        ]);

    }
);

/*
=================================================
KAPI TUŞ TAKIMINI DÜZELT
=================================================
*/

if (doorKeypad) {

    doorKeypad
        .querySelectorAll("[data-door-number]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    if (state.doorCodeInput.length >= 4) {
                        return;
                    }

                    playEffect(
                        "keypadPress"
                    );

                    state.doorCodeInput +=
                        button.dataset.doorNumber;

                    updateCodeDisplay(
                        doorCodeDisplay,
                        state.doorCodeInput,
                        4
                    );

                }
            );

        });

}

     
        /*
        =================================================
        ANAHTAR KARTI AL
        =================================================
        */

        closeFoundKeycard?.addEventListener(
            "click",
            () => {

                hideElement(
                    foundKeycard
                );

                if (
                    !playerHasKeycard()
                ) {

                    AshvaleInventory.add(
                        KEYCARD_ITEM
                    );

                    state.keycardCollected = true;

                    saveState();

                    refreshInterface();

                }

                playDialogue([

                    {
                        speaker:
                            "Anahtar Kart",

                        text:
                            "Tedavi Kanadı erişim kartını aldın.",

                        speed:
                            20
                    },

                    {
                        speaker:
                            "",

                        text:
                            "Hasta kayıtlarına göre kapı kodu 0317 olmalı.",

                        speed:
                            20
                    }

                ]);

            }
        );

        /*
        =================================================
        ÇIKIŞ KAPISI
        =================================================
        */

        function openDoorPanel() {

            if (
                !playerHasKeycard()
            ) {

                showDialogue(
                    "Tedavi Kanadı Kapısı",
                    "Kart okuyucu kırmızı yanıyor. Anahtar kart gerekiyor."
                );

                return;
            }

            state.doorCodeInput = "";

            updateCodeDisplay(
                doorCodeDisplay,
                state.doorCodeInput,
                4
            );

            setCodeMessage(
                doorCodeMessage,
                ""
            );

            showElement(
                doorCodePanel
            );

        }

        registerInteraction(
            exitDoor,
            "Tedavi Kanadı Kapısı",
            openDoorPanel
        );

       

        clearDoorCode?.addEventListener(
            "click",
            () => {

                playEffect(
                    "keypadPress"
                );

                state.doorCodeInput = "";

                updateCodeDisplay(
                    doorCodeDisplay,
                    state.doorCodeInput,
                    4
                );

                setCodeMessage(
                    doorCodeMessage,
                    ""
                );

            }
        );

        submitDoorCode?.addEventListener(
            "click",
            () => {

                if (
                    state.doorCodeInput !== DOOR_CODE
                ) {

                    playEffect(
                        "keypadError"
                    );

                    state.wrongDoorAttempts++;

                    saveState();

                    setCodeMessage(
                        doorCodeMessage,
                        "Erişim reddedildi.",
                        "error"
                    );

                    triggerRandomScare(
                        4
                    );

                    state.doorCodeInput = "";

                    updateCodeDisplay(
                        doorCodeDisplay,
                        state.doorCodeInput,
                        4
                    );

                    return;
                }

                playEffect(
                    "doorUnlock"
                );

                setCodeMessage(
                    doorCodeMessage,
                    "Kapı açıldı.",
                    "success"
                );

                state.chapterCompleted = true;

                saveState();

                refreshInterface();

                window.setTimeout(
    () => {

        /*
        Bölüm 2'yi ortak kayıt sisteminde tamamla.
        Hata olsa bile Room 3 geçişini engelleme.
        */
        try {

            if (
                typeof AshvaleSave.completeChapter ===
                "function"
            ) {

                AshvaleSave.completeChapter(2);

            }

        } catch (error) {

            console.warn(
                "Bölüm ilerlemesi kaydedilemedi:",
                error
            );

        }

        window.location.replace(
            "room3.html"
        );

    },
    900
);

            }
        );
                /*
        =================================================
        BÖLÜM TAMAMLAMA
        =================================================
        */

        function completeChapter() {

            if (!state.chapterCompleted) {

                state.chapterCompleted = true;

                saveState();

            }

            /*
            Oyuncunun ulaştığı en yüksek bölümü kaydet.
            Eski kayıt daha yüksekse geriye düşürme.
            */

            const currentUnlockedChapter =
                Number(
                    save.get(
                        "unlockedChapter"
                    )
                ) || 1;

            if (
                currentUnlockedChapter <
                NEXT_CHAPTER_NUMBER
            ) {

                save.set(
                    "unlockedChapter",
                    NEXT_CHAPTER_NUMBER
                );

            }

            save.set(
                "currentChapter",
                NEXT_CHAPTER_NUMBER
            );

            save.set(
                `chapter${CHAPTER_NUMBER}Completed`,
                true
            );

            refreshInterface();

            exitDoor?.classList.add(
                "unlocked"
            );

            hidePrompt();

            closeAllPanels();

            showElement(
                chapterComplete
            );

            chapterComplete?.classList.add("chapter-complete--visible");
            chapterComplete?.setAttribute("aria-hidden", "false");

        }

       

        /*
        =================================================
        SONRAKİ BÖLÜME GEÇİŞ
        =================================================
        */

        function goToNextChapter() {

            save.set(
                "currentChapter",
                NEXT_CHAPTER_NUMBER
            );

            save.set(
                "lastPlayedChapter",
                NEXT_CHAPTER_NUMBER
            );

            /*
            HTML butonunda data-href tanımlıysa onu kullanır.
            Örnek:
            data-href="Room3.html"

            Tanımlı değilse Room3.html dosyasına gider.
            */

            const nextPage =
                nextChapterButton?.dataset.href ||
                `room${NEXT_CHAPTER_NUMBER}.html`;

            window.location.href =
                nextPage;

        }

        nextChapterButton
            ?.addEventListener(
                "click",
                goToNextChapter
            );

        /*
        =================================================
        MENÜYE DÖNÜŞ
        =================================================
        */

        function returnToMenu() {

            saveState();

            save.set(
                "currentChapter",
                CHAPTER_NUMBER
            );

            save.set(
                "lastPlayedChapter",
                CHAPTER_NUMBER
            );

            /*
            menuButton içinde data-href varsa onu kullanır.
            Yoksa ana menü için index.html açılır.
            */

            const menuPage =
                menuButton?.dataset.href ||
                "index.html";

            window.location.href =
                menuPage;

        }

        menuButton
            ?.addEventListener(
                "click",
                returnToMenu
            );

        /*
        =================================================
        BÖLÜM GİRİŞİ
        =================================================
        */

        function playChapterIntro(
    onComplete = null
) {

    if (!intro) {

        if (
            typeof onComplete ===
            "function"
        ) {
            onComplete();
        }

        return;
    }

    intro.classList.remove(
        "hidden",
        "intro-fade-out"
    );

    intro.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "intro-active"
    );

    window.setTimeout(
        () => {

            intro.classList.add(
                "intro-fade-out"
            );

        },
        2400
    );

    window.setTimeout(
        () => {

            intro.classList.add(
                "hidden"
            );

            intro.classList.remove(
                "intro-fade-out"
            );

            intro.setAttribute(
                "aria-hidden",
                "true"
            );

            document.body.classList.remove(
                "intro-active"
            );

            /*
            CSS çakışsa bile giriş ekranını
            kesin olarak kapat.
            */
            intro.style.display =
                "none";

            if (
                typeof onComplete ===
                "function"
            ) {
                onComplete();
            }

        },
        3300
    );

}

        /*
        =================================================
        İLK DİYALOG
        =================================================
        */

        function playOpeningDialogue() {

            const introSeen =
                save.get(
                    "chapter2IntroSeen"
                ) === true;

            if (introSeen) {
                return;
            }

            save.set(
                "chapter2IntroSeen",
                true
            );

            window.setTimeout(
                () => {

                    playDialogue([

                        {
                            speaker:
                                playerName,

                            text:
                                "Burası hastanenin kayıt odası olmalı. Dosyaların çoğu parçalanmış.",

                            speed:
                                20
                        },

                        {
                            speaker:
                                "",

                            text:
                                "Eski bilgisayar ekranında tek bir hasta numarası yanıp sönüyor: 3179.",

                            speed:
                                20
                        },

                        {
                            speaker:
                                playerName,

                            text:
                                "Bu dosyayı tamamlamadan Tedavi Kanadı'na ulaşamayacağım.",

                            speed:
                                20
                        }

                    ]);

                },
                3500
            );

        }

        /*
        =================================================
        KAYITLI DURUMA GÖRE ODAYI GÜNCELLE
        =================================================
        */

        function restoreRoomState() {

            /*
            Bulunan hasta kayıtlarının yer aldığı
            dolapları görsel olarak işaretle.
            */

            cabinets.forEach(
                cabinet => {

                    const recordId =
                        cabinet.dataset.recordId;

                    const wasOpened =
                        save.get(
                            `chapter2CabinetOpened_${cabinet.id}`
                        ) === true;

                    if (wasOpened) {

                        cabinet.classList.add(
                            "searched"
                        );

                    }

                    if (
                        recordId &&
                        state.foundRecords.includes(
                            recordId
                        )
                    ) {

                        cabinet.classList.add(
                            "record-collected"
                        );

                    }

                }
            );

            if (
                state.drawerUnlocked
            ) {

                lockedDrawer?.classList.add(
                    "unlocked"
                );

                lockedDrawer?.setAttribute(
                    "aria-label",
                    "Açılmış arşiv çekmecesi"
                );

            }

            if (
                playerHasKeycard()
            ) {

                state.keycardCollected =
                    true;

                exitDoor?.classList.add(
                    "keycard-ready"
                );

            }

            if (
                state.chapterCompleted
            ) {

                exitDoor?.classList.add(
                    "unlocked"
                );

            }

            refreshInterface();

        }

        /*
        =================================================
        KAYIT TAMAMLANDIKTAN SONRA DOLAPLARI GÜNCELLE
        =================================================
        */

        function refreshCabinetVisuals() {

            cabinets.forEach(
                cabinet => {

                    const recordId =
                        cabinet.dataset.recordId;

                    if (
                        recordId &&
                        state.foundRecords.includes(
                            recordId
                        )
                    ) {

                        cabinet.classList.add(
                            "searched",
                            "record-collected"
                        );

                    }

                }
            );

        }

        /*
        Envanter veya kayıt toplama işlemlerinden sonra
        arayüzün güncel kalmasını sağlar.
        */

        const originalRefreshInterface =
            refreshInterface;

        refreshInterface =
            function refreshedInterface() {

                originalRefreshInterface();

                refreshCabinetVisuals();

                if (
                    state.drawerUnlocked
                ) {

                    lockedDrawer?.classList.add(
                        "unlocked"
                    );

                }

                if (
                    playerHasKeycard()
                ) {

                    exitDoor?.classList.add(
                        "keycard-ready"
                    );

                }

                if (
                    state.chapterCompleted
                ) {

                    exitDoor?.classList.add(
                        "unlocked"
                    );

                }

            };

        /*
        =================================================
        SESİ İLK KULLANICI ETKİLEŞİMİNDE AKTİFLEŞTİR
        =================================================
        */

        let audioUnlocked =
            false;

        function unlockAudio() {

            if (audioUnlocked) {
                return;
            }

            audioUnlocked =
                true;

            try {

                if (
                    typeof AshvaleAudio.resume ===
                    "function"
                ) {

                    AshvaleAudio.resume();

                }

                AshvaleAudio.playAmbience(
                    "chapter2Ambience"
                );

            } catch (error) {

                console.warn(
                    "Tarayıcı ses sistemini başlatamadı.",
                    error
                );

            }

            document.removeEventListener(
                "click",
                unlockAudio
            );

            document.removeEventListener(
                "keydown",
                unlockAudio
            );

        }

        document.addEventListener(
            "click",
            unlockAudio
        );

        document.addEventListener(
            "keydown",
            unlockAudio
        );

        /*
        =================================================
        SAYFA KAPANIRKEN KAYDET
        =================================================
        */

        window.addEventListener(
            "beforeunload",
            () => {

                saveState();

            }
        );

        /*
        =================================================
        SEKME GÖRÜNÜRLÜĞÜ
        =================================================
        */

        document.addEventListener(
            "visibilitychange",
            () => {

                if (
                    document.hidden
                ) {

                    if (
                        typeof AshvaleAudio.pauseAmbience ===
                        "function"
                    ) {

                        AshvaleAudio.pauseAmbience();

                    }

                    return;

                }

                if (
                    audioUnlocked
                ) {

                    try {

                        AshvaleAudio.playAmbience(
                            "chapter2Ambience"
                        );

                    } catch (error) {

                        console.warn(
                            "Ortam sesi yeniden başlatılamadı.",
                            error
                        );

                    }

                }

            }
        );

        /*
        =================================================
        BÖLÜM TAMAMLANMIŞSA KAPI DAVRANIŞI
        =================================================
        */

        if (
            state.chapterCompleted
        ) {

            /*
            Oyuncu tamamlanmış bölüme tekrar girerse
            kapıya bastığında şifre istemeden sonuç ekranı açılır.
            */

            exitDoor?.addEventListener(
                "dblclick",
                () => {

                    completeChapter();

                }
            );

        }

        /*
        =================================================
        BAŞLANGIÇ
        =================================================
        */

      playChapterIntro(
    () => {

        if (
            state.chapterCompleted
        ) {

            showDialogue(
                "Sistem",
                "Tedavi Kanadı'nın kapısı açık. Hazır olduğunda sonraki bölüme geçebilirsin."
            );

            return;
        }

        playOpeningDialogue();

    }
);

        AshvaleFlashlight.start({
    room: "room",
    flashlight: "flashlight",
    interactionPrompt: null,
    smoothing: 0.14,
    swayAmount: 1.6
});

    }
);