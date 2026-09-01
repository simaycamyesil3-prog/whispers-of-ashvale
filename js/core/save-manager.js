"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
UNIFIED SAVE MANAGER
=========================================================
*/

window.AshvaleSaveManager = (() => {

    const SAVE_KEY = "ashvale_save_v2";
    const SAVE_VERSION = 2;

    /*
    =====================================================
    YARDIMCI FONKSİYONLAR
    =====================================================
    */

    function clone(data) {

        if (
            data === undefined ||
            data === null
        ) {
            return data;
        }

        if (
            typeof structuredClone ===
            "function"
        ) {

            try {

                return structuredClone(data);

            } catch {

                // JSON yöntemine geçilir.

            }

        }

        return JSON.parse(
            JSON.stringify(data)
        );

    }

    function isObject(value) {

        return (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        );

    }

    function clamp(
        value,
        min,
        max
    ) {

        return Math.min(
            max,
            Math.max(
                min,
                value
            )
        );

    }

    function normalizePlayerName(name) {

        return String(name || "")
            .trim()
            .slice(0, 20);

    }

    function normalizeRoom(roomNumber) {

        const parsed =
            Number.parseInt(
                roomNumber,
                10
            );

        if (
            !Number.isFinite(parsed)
        ) {
            return 1;
        }

        return clamp(
            parsed,
            1,
            20
        );

    }

    /*
    =====================================================
    VARSAYILAN AYARLAR
    =====================================================
    */

    function createDefaultSettings() {

        return {

            musicEnabled: true,
            effectsEnabled: true,
            ambienceEnabled: true,

            rainEnabled: true,
            flickerEnabled: true,
            screenShakeEnabled: true,
            filmGrainEnabled: true,
            cameraMotionEnabled: true,

            highContrast: false,
            muted: false,

            masterVolume: 1,
            musicVolume: 0.6,
            effectsVolume: 0.8,
            ambienceVolume: 0.7,

            language: "tr"

        };

    }

    function normalizeSettings(settings) {

        const defaults =
            createDefaultSettings();

        if (!isObject(settings)) {
            return defaults;
        }

        return {

            ...defaults,

            ...clone(settings),

            musicEnabled:
                settings.musicEnabled !==
                false,

            effectsEnabled:
                settings.effectsEnabled !==
                false,

            ambienceEnabled:
                settings.ambienceEnabled !==
                false,

            rainEnabled:
                settings.rainEnabled !==
                false,

            flickerEnabled:
                settings.flickerEnabled !==
                false,

            screenShakeEnabled:
                settings.screenShakeEnabled !==
                false,

            filmGrainEnabled:
                settings.filmGrainEnabled !==
                false,

            cameraMotionEnabled:
                settings.cameraMotionEnabled !==
                false,

            highContrast:
                settings.highContrast ===
                true,

            muted:
                settings.muted ===
                true,

            language:
                String(
                    settings.language ||
                    "tr"
                ),

            masterVolume:
                clamp(
                    Number(
                        settings.masterVolume ??
                        defaults.masterVolume
                    ),
                    0,
                    1
                ),

            musicVolume:
                clamp(
                    Number(
                        settings.musicVolume ??
                        defaults.musicVolume
                    ),
                    0,
                    1
                ),

            effectsVolume:
                clamp(
                    Number(
                        settings.effectsVolume ??
                        defaults.effectsVolume
                    ),
                    0,
                    1
                ),

            ambienceVolume:
                clamp(
                    Number(
                        settings.ambienceVolume ??
                        defaults.ambienceVolume
                    ),
                    0,
                    1
                )

        };

    }

    /*
    =====================================================
    BOŞ KAYIT
    =====================================================
    */

    function createEmptySave() {

        const now =
            Date.now();

        return {

            version:
                SAVE_VERSION,

            player: {

                name:
                    "",

                inventory:
                    []

            },

            currentRoom:
                1,

            currentChapter:
                1,

            completedRooms:
                [],

            completedChapters:
                [],

            rooms:
                {},

            flags:
                {},

            storyFlags:
                {},

            statistics: {

                notesFound:
                    0,

                puzzlesSolved:
                    0,

                roomsCompleted:
                    0,

                playTime:
                    0

            },

            settings:
                createDefaultSettings(),

            createdAt:
                now,

            updatedAt:
                now,

            lastPlayedAt:
                now

        };

    }

    let saveData =
        createEmptySave();

    /*
    =====================================================
    NORMALLEŞTİRME
    =====================================================
    */

    function normalizeInventory(inventory) {

        if (!Array.isArray(inventory)) {
            return [];
        }

        return inventory
            .filter(item => item)
            .map(item => {

                if (
                    typeof item ===
                    "string"
                ) {

                    return {

                        id:
                            item,

                        name:
                            item,

                        description:
                            "",

                        quantity:
                            1

                    };

                }

                return {

                    ...clone(item),

                    id:
                        String(
                            item.id ||
                            item.name ||
                            ""
                        ),

                    name:
                        String(
                            item.name ||
                            item.id ||
                            "Eşya"
                        ),

                    description:
                        String(
                            item.description ||
                            ""
                        ),

                    quantity:
                        Math.max(
                            1,
                            Number(
                                item.quantity
                            ) || 1
                        )

                };

            })
            .filter(item => item.id);

    }

    function normalizeSave(data) {

        const empty =
            createEmptySave();

        if (!isObject(data)) {
            return empty;
        }

        const incomingPlayer =
            isObject(data.player)
                ? data.player
                : {};

        const currentRoom =
            normalizeRoom(
                data.currentRoom ??
                data.currentChapter ??
                1
            );

        const completedRooms =
            Array.isArray(
                data.completedRooms
            )
                ? data.completedRooms
                    .map(normalizeRoom)
                : Array.isArray(
                    data.completedChapters
                )
                    ? data.completedChapters
                        .map(normalizeRoom)
                    : [];

        const uniqueCompletedRooms =
            [
                ...new Set(
                    completedRooms
                )
            ].sort(
                (a, b) => a - b
            );

        return {

            ...empty,

            ...clone(data),

            version:
                SAVE_VERSION,

            player: {

                ...empty.player,

                ...clone(
                    incomingPlayer
                ),

                name:
                    normalizePlayerName(
                        incomingPlayer.name ||
                        data.playerName ||
                        ""
                    ),

                inventory:
                    normalizeInventory(
                        incomingPlayer.inventory ??
                        data.inventory ??
                        []
                    )

            },

            currentRoom,

            currentChapter:
                currentRoom,

            completedRooms:
                uniqueCompletedRooms,

            completedChapters:
                [...uniqueCompletedRooms],

            rooms:
                isObject(data.rooms)
                    ? clone(data.rooms)
                    : {},

            flags:
                isObject(data.flags)
                    ? clone(data.flags)
                    : {},

            storyFlags:
                isObject(data.storyFlags)
                    ? clone(data.storyFlags)
                    : isObject(data.flags)
                        ? clone(data.flags)
                        : {},

            statistics: {

                ...empty.statistics,

                ...(
                    isObject(
                        data.statistics
                    )
                        ? clone(
                            data.statistics
                        )
                        : {}
                )

            },

            settings:
                normalizeSettings(
                    data.settings
                ),

            createdAt:
                Number(
                    data.createdAt
                ) || empty.createdAt,

            updatedAt:
                Number(
                    data.updatedAt
                ) || Date.now(),

            lastPlayedAt:
                Number(
                    data.lastPlayedAt
                ) || Date.now()

        };

    }

    function touch() {

        saveData.updatedAt =
            Date.now();

    }

    function dispatch(
        eventName,
        detail = null
    ) {

        window.dispatchEvent(
            new CustomEvent(
                eventName,
                {
                    detail:
                        detail ??
                        getData()
                }
            )
        );

    }

    /*
    =====================================================
    TEMEL KAYIT İŞLEMLERİ
    =====================================================
    */

    function reset() {

        saveData =
            createEmptySave();

        return getData();

    }

    function clear() {

        return deleteSave();

    }

    function destroy() {

        reset();

    }

    function hasSave() {

        return (
            localStorage.getItem(
                SAVE_KEY
            ) !== null
        );

    }

    function getData() {

        return clone(saveData);

    }

    function getSave() {

        if (hasSave()) {

            loadFromStorage();

            return getData();

        }

        return null;

    }

    function setData(data) {

        if (!isObject(data)) {

            reset();

            return false;

        }

        saveData =
            normalizeSave(data);

        touch();

        return true;

    }

    function get(
        key,
        defaultValue = null
    ) {

        if (
            !Object.prototype
                .hasOwnProperty
                .call(
                    saveData,
                    key
                )
        ) {

            return defaultValue;

        }

        return clone(
            saveData[key]
        );

    }

    function set(
        key,
        value
    ) {

        if (!key) {
            return false;
        }

        saveData[key] =
            clone(value);

        touch();

        return true;

    }

    function remove(key) {

        if (
            !Object.prototype
                .hasOwnProperty
                .call(
                    saveData,
                    key
                )
        ) {

            return false;

        }

        delete saveData[key];

        touch();

        return true;

    }

    /*
    =====================================================
    OYUNCU
    =====================================================
    */

    function setPlayerName(name) {

        saveData.player.name =
            normalizePlayerName(name);

        touch();

        return saveData.player.name;

    }

    function getPlayerName() {

        return saveData.player.name;

    }

    /*
    =====================================================
    ENVANTER
    =====================================================
    */

    function getInventory() {

        return clone(
            saveData.player.inventory
        );

    }

    function setInventory(inventory) {

        saveData.player.inventory =
            normalizeInventory(inventory);

        touch();

        saveToStorage();

        return getInventory();

    }

    function hasInventoryItem(itemId) {

        const normalizedId =
            String(itemId);

        return saveData.player.inventory
            .some(
                item =>
                    String(item.id) ===
                    normalizedId
            );

    }

    function getInventoryItem(itemId) {

        const normalizedId =
            String(itemId);

        const item =
            saveData.player.inventory
                .find(
                    inventoryItem =>
                        String(
                            inventoryItem.id
                        ) ===
                        normalizedId
                );

        return item
            ? clone(item)
            : null;

    }

    function addInventoryItem(item) {

        if (!item) {
            return false;
        }

        const normalizedItem =
            normalizeInventory(
                [item]
            )[0];

        if (!normalizedItem) {
            return false;
        }

        const existingItem =
            saveData.player.inventory
                .find(
                    inventoryItem =>
                        inventoryItem.id ===
                        normalizedItem.id
                );

        if (existingItem) {

            existingItem.quantity =
                Math.max(
                    1,
                    Number(
                        existingItem.quantity
                    ) || 1
                ) +
                Math.max(
                    1,
                    Number(
                        normalizedItem.quantity
                    ) || 1
                );

            touch();

            saveToStorage();

            return true;

        }

        saveData.player.inventory.push(
            normalizedItem
        );

        touch();

        saveToStorage();

        return true;

    }

    function removeInventoryItem(
        itemId,
        quantity = null
    ) {

        const normalizedId =
            String(itemId);

        const itemIndex =
            saveData.player.inventory
                .findIndex(
                    item =>
                        String(item.id) ===
                        normalizedId
                );

        if (itemIndex < 0) {
            return false;
        }

        const item =
            saveData.player.inventory[
                itemIndex
            ];

        if (
            quantity !== null &&
            Number(quantity) > 0 &&
            Number(item.quantity) >
                Number(quantity)
        ) {

            item.quantity -=
                Number(quantity);

        } else {

            saveData.player.inventory.splice(
                itemIndex,
                1
            );

        }

        touch();

        saveToStorage();

        return true;

    }

    /*
    =====================================================
    ODA VE BÖLÜM
    =====================================================
    */

    function setCurrentRoom(roomNumber) {

        const normalizedRoom =
            normalizeRoom(roomNumber);

        saveData.currentRoom =
            normalizedRoom;

        saveData.currentChapter =
            normalizedRoom;

        touch();

        return normalizedRoom;

    }

    function getCurrentRoom() {

        return saveData.currentRoom;
    }

    function setCurrentChapter(
        chapterNumber
    ) {

        return setCurrentRoom(
            chapterNumber
        );

    }

    function getCurrentChapter() {

        return getCurrentRoom();

    }

    function completeRoom(roomNumber) {

        return completeChapter(
            roomNumber
        );

    }

    function completeChapter(
        chapterNumber
    ) {

        const completedChapter =
            normalizeRoom(
                chapterNumber
            );

        if (
            !saveData.completedRooms
                .includes(
                    completedChapter
                )
        ) {

            saveData.completedRooms.push(
                completedChapter
            );

            saveData.completedRooms.sort(
                (a, b) => a - b
            );

            saveData.completedChapters =
                [
                    ...saveData.completedRooms
                ];

            incrementStatistic(
                "roomsCompleted",
                1,
                false
            );

        }

        if (
            completedChapter < 20
        ) {

            setCurrentRoom(
                completedChapter + 1
            );

        }

        touch();

        saveToStorage();

        dispatch(
            "ashvale:chapter-completed",
            {
                chapter:
                    completedChapter,

                nextChapter:
                    saveData.currentRoom,

                save:
                    getData()
            }
        );

        return getData();

    }

    function isRoomCompleted(
        roomNumber
    ) {

        return saveData.completedRooms
            .includes(
                normalizeRoom(
                    roomNumber
                )
            );

    }

    function isChapterCompleted(
        chapterNumber
    ) {

        return isRoomCompleted(
            chapterNumber
        );

    }

    function getCompletedRooms() {

        return [
            ...saveData.completedRooms
        ];

    }

    function getCompletedChapters() {

        return getCompletedRooms();

    }

    function saveRoom(room) {

        if (
            !room ||
            !room.id ||
            typeof room.exportState !==
                "function"
        ) {

            return false;

        }

        saveData.rooms[room.id] =
            clone(
                room.exportState()
            );

        touch();

        return true;

    }

    function loadRoom(room) {

        if (
            !room ||
            !room.id ||
            typeof room.importState !==
                "function"
        ) {

            return false;

        }

        const roomState =
            saveData.rooms[room.id];

        if (!roomState) {
            return false;
        }

        room.importState(
            clone(roomState)
        );

        return true;

    }

    function setRoomState(
        roomId,
        state
    ) {

        if (!roomId) {
            return false;
        }

        saveData.rooms[
            String(roomId)
        ] = clone(
            state || {}
        );

        touch();

        return true;

    }

    function getRoomState(roomId) {

        if (!roomId) {
            return null;
        }

        const state =
            saveData.rooms[
                String(roomId)
            ];

        return state
            ? clone(state)
            : null;

    }

    /*
    =====================================================
    HİKÂYE BAYRAKLARI
    =====================================================
    */

    function setFlag(
        flagName,
        value = true
    ) {

        if (!flagName) {
            return false;
        }

        saveData.flags[
            String(flagName)
        ] = clone(value);

        saveData.storyFlags[
            String(flagName)
        ] = clone(value);

        touch();

        saveToStorage();

        return true;

    }

    function getFlag(
        flagName,
        defaultValue = false
    ) {

        const key =
            String(flagName);

        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    saveData.storyFlags,
                    key
                )
        ) {

            return clone(
                saveData.storyFlags[key]
            );

        }

        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    saveData.flags,
                    key
                )
        ) {

            return clone(
                saveData.flags[key]
            );

        }

        return defaultValue;

    }

    function removeFlag(flagName) {

        const key =
            String(flagName);

        const existed =
            Object.prototype
                .hasOwnProperty
                .call(
                    saveData.flags,
                    key
                ) ||
            Object.prototype
                .hasOwnProperty
                .call(
                    saveData.storyFlags,
                    key
                );

        delete saveData.flags[key];
        delete saveData.storyFlags[key];

        if (existed) {

            touch();

            saveToStorage();

        }

        return existed;

    }

    function setStoryFlag(
        flagName,
        value = true
    ) {

        return setFlag(
            flagName,
            value
        );

    }

    function getStoryFlag(
        flagName,
        defaultValue = false
    ) {

        return getFlag(
            flagName,
            defaultValue
        );

    }

    function removeStoryFlag(
        flagName
    ) {

        return removeFlag(
            flagName
        );

    }

    /*
    =====================================================
    İSTATİSTİKLER
    =====================================================
    */

    function getStatistics() {

        return clone(
            saveData.statistics
        );

    }

    function getStatistic(
        statisticName,
        defaultValue = 0
    ) {

        if (
            !Object.prototype
                .hasOwnProperty
                .call(
                    saveData.statistics,
                    statisticName
                )
        ) {

            return defaultValue;

        }

        return Number(
            saveData.statistics[
                statisticName
            ]
        ) || 0;

    }

    function setStatistic(
        statisticName,
        value
    ) {

        if (!statisticName) {
            return false;
        }

        saveData.statistics[
            statisticName
        ] = Number(value) || 0;

        touch();

        saveToStorage();

        return saveData.statistics[
            statisticName
        ];

    }

    function incrementStatistic(
        statisticName,
        amount = 1,
        shouldSave = true
    ) {

        if (!statisticName) {
            return false;
        }

        const currentValue =
            Number(
                saveData.statistics[
                    statisticName
                ]
            ) || 0;

        const increment =
            Number(amount) || 0;

        saveData.statistics[
            statisticName
        ] =
            currentValue +
            increment;

        touch();

        if (shouldSave) {
            saveToStorage();
        }

        return saveData.statistics[
            statisticName
        ];

    }

    /*
    =====================================================
    AYARLAR
    =====================================================
    */

    function loadSettings() {

        saveData.settings =
            normalizeSettings(
                saveData.settings
            );

        return clone(
            saveData.settings
        );

    }

    function getSettings() {

        return loadSettings();

    }

    function saveSettings(
        newSettings = null
    ) {

        const incomingSettings =
            isObject(newSettings)
                ? newSettings
                : {};

        saveData.settings =
            normalizeSettings({

                ...saveData.settings,

                ...clone(
                    incomingSettings
                )

            });

        touch();

        saveToStorage();

        const settings =
            loadSettings();

        dispatch(
            "ashvale:settings-updated",
            settings
        );

        return settings;

    }

    function setSetting(
        settingName,
        value
    ) {

        if (!settingName) {
            return false;
        }

        return saveSettings({

            [settingName]:
                value

        });

    }

    function getSetting(
        settingName,
        defaultValue = null
    ) {

        const settings =
            loadSettings();

        if (
            !Object.prototype
                .hasOwnProperty
                .call(
                    settings,
                    settingName
                )
        ) {

            return defaultValue;

        }

        return clone(
            settings[settingName]
        );

    }

    function resetSettings() {

        saveData.settings =
            createDefaultSettings();

        touch();

        saveToStorage();

        const settings =
            loadSettings();

        dispatch(
            "ashvale:settings-updated",
            settings
        );

        return settings;

    }

    /*
    =====================================================
    YENİ OYUN VE DEVAM ET
    =====================================================
    */

    /*
        Bazı bölümler (örn. Bölüm 4) kendi bulmaca durumunu
        ana kayıt sisteminden bağımsız, ham localStorage
        anahtarlarıyla saklıyor. Yeni oyun başlatıldığında bu
        eski/bağımsız anahtarlar da temizlenmezse, önceki bir
        oyundan kalan durum (örn. "kablolar zaten bulundu",
        "elektrik zaten geldi") yeni oyuna sızabiliyor. Yeni
        oyuna başlarken bunları da temizliyoruz.
    */
    const LEGACY_ROOM_KEYS = [
        "woa-room4",
        "woa-room4-completed",
        "woa-current-room"
    ];

    function clearLegacyRoomKeys() {

        LEGACY_ROOM_KEYS.forEach(function (key) {

            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.warn(
                    "Ashvale Save Manager: Eski anahtar temizlenemedi.",
                    key,
                    error
                );
            }

        });

    }

    function startNewGame(
        playerName = ""
    ) {

        reset();

        clearLegacyRoomKeys();

        setPlayerName(
            playerName
        );

        setCurrentRoom(1);

        saveData.lastPlayedAt =
            Date.now();

        saveToStorage();

        dispatch(
            "ashvale:new-save",
            getData()
        );

        return getData();

    }

    function createNewSave(
        playerName = ""
    ) {

        return startNewGame(
            playerName
        );

    }

    function loadSave() {

        const loaded =
            loadFromStorage();

        if (!loaded) {
            return null;
        }

        return getData();

    }

    function touchLastPlayed() {

        saveData.lastPlayedAt =
            Date.now();

        touch();

        saveToStorage();

        return saveData.lastPlayedAt;

    }

    /*
    =====================================================
    LOCAL STORAGE
    =====================================================
    */

    function saveToStorage() {

        touch();

        try {

            localStorage.setItem(
                SAVE_KEY,
                JSON.stringify(
                    saveData
                )
            );

            dispatch(
                "ashvale:save-updated",
                getData()
            );

            return true;

        } catch (error) {

            console.error(
                "Ashvale Save Manager: Kayıt kaydedilemedi.",
                error
            );

            return false;

        }

    }

    function loadFromStorage() {

        try {

            const raw =
                localStorage.getItem(
                    SAVE_KEY
                );

            if (!raw) {

                reset();

                return false;

            }

            const parsed =
                JSON.parse(raw);

            saveData =
                normalizeSave(parsed);

            return true;

        } catch (error) {

            console.error(
                "Ashvale Save Manager: Kayıt yüklenemedi.",
                error
            );

            reset();

            return false;

        }

    }

    function deleteSave() {

        localStorage.removeItem(
            SAVE_KEY
        );

        reset();

        dispatch(
            "ashvale:save-deleted",
            null
        );

        return true;

    }

    /*
    =====================================================
    OTOMATİK KAYIT
    =====================================================
    */

    function autoSave(
        room = null
    ) {

        if (room) {

            saveRoom(room);

        }

        saveData.lastPlayedAt =
            Date.now();

        return saveToStorage();

    }

    /*
    =====================================================
    DIŞA VE İÇE AKTAR
    =====================================================
    */

    function exportSave() {

        return JSON.stringify(
            saveData,
            null,
            2
        );

    }

    function importSave(json) {

        try {

            const parsed =
                JSON.parse(json);

            saveData =
                normalizeSave(parsed);

            saveToStorage();

            dispatch(
                "ashvale:save-imported",
                getData()
            );

            return true;

        } catch (error) {

            console.error(
                "Ashvale Save Manager: Kayıt içe aktarılamadı.",
                error
            );

            return false;

        }

    }

    /*
    =====================================================
    PUBLIC API
    =====================================================
    */

    const api = {

        reset,
        clear,
        destroy,

        hasSave,

        getData,
        getSave,
        setData,

        get,
        set,
        remove,

        setPlayerName,
        getPlayerName,

        getInventory,
        setInventory,
        getInventoryItem,
        addInventoryItem,
        removeInventoryItem,
        hasInventoryItem,

        setCurrentRoom,
        getCurrentRoom,

        setCurrentChapter,
        getCurrentChapter,

        completeRoom,
        completeChapter,

        isRoomCompleted,
        isChapterCompleted,

        getCompletedRooms,
        getCompletedChapters,

        saveRoom,
        loadRoom,

        setRoomState,
        getRoomState,

        setFlag,
        getFlag,
        removeFlag,

        setStoryFlag,
        getStoryFlag,
        removeStoryFlag,

        getStatistics,
        getStatistic,
        setStatistic,
        incrementStatistic,

        loadSettings,
        getSettings,
        saveSettings,
        setSetting,
        getSetting,
        resetSettings,

        startNewGame,
        createNewSave,
        loadSave,
        touchLastPlayed,

        saveToStorage,
        loadFromStorage,
        deleteSave,
        autoSave,

        exportSave,
        importSave

    };

    /*
    =====================================================
    ESKİ VE YENİ DOSYA UYUMLULUĞU
    =====================================================
    */

    window.AshvaleSave =
        api;

    window.SaveSystem =
        api;

    window.Save =
        api;

    /*
    Sayfa açıldığında mevcut kayıt varsa
    belleğe otomatik yüklenir.
    */

    if (hasSave()) {

        loadFromStorage();

    }

    return api;

})();