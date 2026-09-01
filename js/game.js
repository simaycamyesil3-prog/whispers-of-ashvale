"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
GAME MANAGER
=========================================================
*/

window.AshvaleGame = (() => {

    const Save =
        window.AshvaleSaveManager ||
        window.SaveSystem ||
        window.Save;

    const roomFiles = {

        1: "room1.html",
        2: "room2.html",
        3: "room3.html",
        4: "room4.html",
        5: "room5.html",
        6: "room6.html",
        7: "room7.html",
        8: "room8.html",
        9: "room9.html",
        10: "room10.html",
        11: "room11.html",
        12: "room12.html",
        13: "room13.html",
        14: "room14.html",
        15: "room15.html"

    };

    /*
    =====================================
    AYARLARI UYGULA
    =====================================
    */

    function applySettings() {

        if (
            !Save ||
            typeof Save.loadSettings !==
                "function"
        ) {

            return {};

        }

        const settings =
            Save.loadSettings();

        document.body.classList.toggle(
            "rain-disabled",
            settings.rainEnabled === false
        );

        document.body.classList.toggle(
            "flicker-disabled",
            settings.flickerEnabled === false
        );

        document.body.classList.toggle(
            "high-contrast",
            settings.highContrast === true
        );

        document.body.classList.toggle(
            "film-grain-disabled",
            settings.filmGrainEnabled === false
        );

        document.body.classList.toggle(
            "camera-motion-disabled",
            settings.cameraMotionEnabled === false
        );

        return settings;

    }

    /*
    =====================================
    ODAYA GİT
    =====================================
    */

    function goToRoom(roomNumber) {

        const normalizedRoom =
            Math.min(
                20,
                Math.max(
                    1,
                    Number(roomNumber) || 1
                )
            );

        const roomFile =
            roomFiles[normalizedRoom];

        if (!roomFile) {

            console.error(
                "Bölüm bulunamadı:",
                normalizedRoom
            );

            return false;

        }

        if (Save) {

            Save.setCurrentRoom(
                normalizedRoom
            );

            Save.saveToStorage();

        }

        window.location.href =
            roomFile;

        return true;

    }

    /*
    =====================================
    BÖLÜM BAŞLAT
    =====================================
    */

    function startChapter(
        roomNumber,
        options = {}
    ) {

        return goToRoom(
            roomNumber
        );

    }

    /*
    =====================================
    OYUN BAŞLAT
    =====================================
    */

    function startGame(
        options = {}
    ) {

        const roomNumber =
            options.chapter ||
            options.room ||
            options.save?.currentRoom ||
            Save?.getCurrentRoom?.() ||
            1;

        return goToRoom(
            roomNumber
        );

    }

    /*
    =====================================
    YENİ OYUN
    =====================================
    */

    function startNewGame(
        playerName = ""
    ) {

        if (!Save) {

            console.error(
                "Game: Kayıt sistemi bulunamadı."
            );

            return false;

        }

        const save =
            Save.startNewGame(
                playerName
            );

        return goToRoom(
            save.currentRoom || 1
        );

    }

    /*
    =====================================
    DEVAM ET
    =====================================
    */

    function continueGame() {

        if (
            !Save ||
            !Save.hasSave()
        ) {

            return false;

        }

        Save.loadFromStorage();

        const save =
            Save.getData();

        return goToRoom(
            save.currentRoom || 1
        );

    }

    /*
    =====================================
    PUBLIC API
    =====================================
    */

    return {

        applySettings,

        goToRoom,

        startChapter,

        startGame,

        startNewGame,

        continueGame

    };

})();

/*
Eski kodlar Game ismini kullanıyorsa
aynı yöneticiye bağlanır.
*/

window.Game =
    window.AshvaleGame;

window.AshvaleGame.applySettings();