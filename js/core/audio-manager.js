"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
AUDIO MANAGER

Görevleri:
- Ambiyans, müzik ve efekt seslerini yönetme
- Sesleri önceden kaydetme
- Aynı efekti üst üste oynatabilme
- Genel, müzik ve efekt ses seviyelerini yönetme
- Sessize alma
- Kullanıcı ayarlarını localStorage içinde saklama
=========================================================
*/

window.AshvaleAudio = (() => {

    const STORAGE_KEY = "ashvaleAudioSettings";

    const sounds = new Map();

    let currentAmbience = null;
    let currentMusic = null;

    let initialized = false;

    /*
    =====================================================
    KATMANLAR (LAYERS)
    Tek seferde sadece bir ambiyans + bir müzik çalabiliyoruz.
    Ama "harmanlanmış" korku fon sesi (yağmur + fısıltı, üstüne
    ara sıra gök gürültüsü) için bunlardan bağımsız, aynı anda
    çalabilen ek katmanlar gerekiyor. layers Map'i bunun için.
    =====================================================
    */

    const layers = new Map();

    const GLOBAL_LAYER_SOUNDS = {
        __ambientRainLayer: {
            src: "audio/rain.mp3",
            type: "ambience",
            loop: true,
            volume: 0.42
        },
        __ambientWhisperLayer: {
            src: "audio/whisper.mp3",
            type: "ambience",
            loop: true,
            volume: 0.24
        },
        __ambientThunderStrike: {
            src: "audio/thunder.mp3",
            type: "effect",
            volume: 0.55
        }
    };

    let thunderTimerId = null;

    const settings = {
        masterVolume: 1,
        effectsVolume: 0.8,
        ambienceVolume: 0.45,
        musicVolume: 0.5,
        muted: false
    };

    /*
    =====================================================
    HELPERS
    =====================================================
    */

    function clamp(value, min = 0, max = 1) {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return min;
        }

        return Math.min(
            max,
            Math.max(min, number)
        );

    }

    function getFinalVolume(type, customVolume = 1) {

        if (settings.muted) {
            return 0;
        }

        let categoryVolume = 1;

        if (type === "effect") {
            categoryVolume =
                settings.effectsVolume;
        }

        if (type === "ambience") {
            categoryVolume =
                settings.ambienceVolume;
        }

        if (type === "music") {
            categoryVolume =
                settings.musicVolume;
        }

        return clamp(
            settings.masterVolume *
            categoryVolume *
            customVolume
        );

    }

    function saveSettings() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(settings)
            );

        } catch (error) {

            console.warn(
                "AshvaleAudio: Ses ayarları kaydedilemedi.",
                error
            );

        }

    }

    function loadSettings() {

        try {

            const savedSettings =
                localStorage.getItem(
                    STORAGE_KEY
                );

            if (!savedSettings) {
                return;
            }

            const parsed =
                JSON.parse(savedSettings);

            settings.masterVolume =
                clamp(
                    parsed.masterVolume ??
                    settings.masterVolume
                );

            settings.effectsVolume =
                clamp(
                    parsed.effectsVolume ??
                    settings.effectsVolume
                );

            settings.ambienceVolume =
                clamp(
                    parsed.ambienceVolume ??
                    settings.ambienceVolume
                );

            settings.musicVolume =
                clamp(
                    parsed.musicVolume ??
                    settings.musicVolume
                );

            settings.muted =
                Boolean(parsed.muted);

        } catch (error) {

            console.warn(
                "AshvaleAudio: Ses ayarları okunamadı.",
                error
            );

        }

    }

    /*
    =====================================================
    REGISTER
    =====================================================
    */

    function register(name, options = {}) {

        if (!name || !options.src) {

            console.warn(
                "AshvaleAudio: Ses adı ve yolu gereklidir."
            );

            return false;
        }

        sounds.set(name, {
            name,
            src: options.src,
            type: options.type || "effect",
            loop: Boolean(options.loop),
            volume: clamp(
                options.volume ?? 1
            )
        });

        return true;

    }

    function registerMany(soundList = {}) {

        Object.entries(soundList)
            .forEach(([name, options]) => {

                register(name, options);

            });

    }

    function has(name) {

        return sounds.has(name);

    }

    /*
    =====================================================
    AUDIO CREATION
    =====================================================
    */

    function createAudio(sound) {

        const audio =
            new Audio(sound.src);

        audio.loop =
            sound.loop;

        audio.preload =
            "auto";

        audio.volume =
            getFinalVolume(
                sound.type,
                sound.volume
            );

        return audio;

    }

    /*
    =====================================================
    EFFECTS
    =====================================================
    */

    function playEffect(
        name,
        options = {}
    ) {

        const sound =
            sounds.get(name);

        if (!sound) {

            console.warn(
                `AshvaleAudio: "${name}" adlı efekt bulunamadı.`
            );

            return null;
        }

        const audio =
            createAudio({
                ...sound,
                type: "effect",
                loop: false,
                volume:
                    clamp(
                        options.volume ??
                        sound.volume
                    )
            });

        audio.currentTime =
            Number(options.startTime) || 0;

        audio.play()
            .catch(() => {
                // Tarayıcı, kullanıcı etkileşimi
                // olmadan sesi engelleyebilir.
            });

        return audio;

    }

    /*
    =====================================================
    AMBIENCE
    =====================================================
    */

    function playAmbience(
        name,
        options = {}
    ) {

        const sound =
            sounds.get(name);

        if (!sound) {

            console.warn(
                `AshvaleAudio: "${name}" adlı ambiyans bulunamadı.`
            );

            return null;
        }

        if (
            currentAmbience &&
            currentAmbience.dataset.soundName === name &&
            !currentAmbience.paused
        ) {
            return currentAmbience;
        }

        stopAmbience();

        currentAmbience =
            createAudio({
                ...sound,
                type: "ambience",
                loop:
                    options.loop ??
                    true,
                volume:
                    clamp(
                        options.volume ??
                        sound.volume
                    )
            });

        currentAmbience.dataset.soundName =
            name;

        currentAmbience.play()
            .catch(() => {
                // İlk kullanıcı etkileşiminde
                // tekrar başlatılacaktır.
            });

        return currentAmbience;

    }

    function stopAmbience() {

        if (!currentAmbience) {
            return;
        }

        currentAmbience.pause();

        currentAmbience.currentTime = 0;

        currentAmbience = null;

    }

    /*
    =====================================================
    LAYERS
    playAmbience/playMusic gibi tek slotlu değil - aynı anda
    birden fazla katman (ör. yağmur + fısıltı) çalabilir.
    =====================================================
    */

    function playLayer(
        name,
        options = {}
    ) {

        const sound =
            sounds.get(name);

        if (!sound) {

            console.warn(
                `AshvaleAudio: "${name}" adlı katman bulunamadı.`
            );

            return null;
        }

        const existing =
            layers.get(name);

        if (existing && !existing.paused) {
            return existing;
        }

        const layerAudio =
            createAudio({
                ...sound,
                type: options.type || sound.type,
                loop:
                    options.loop ??
                    sound.loop,
                volume:
                    clamp(
                        options.volume ??
                        sound.volume
                    )
            });

        layerAudio.dataset.soundName =
            name;

        layers.set(name, layerAudio);

        layerAudio.play()
            .catch(() => {
                // İlk kullanıcı etkileşiminde
                // tekrar başlatılacaktır.
            });

        return layerAudio;

    }

    function stopLayer(name) {

        const layerAudio =
            layers.get(name);

        if (!layerAudio) {
            return;
        }

        layerAudio.pause();

        layerAudio.currentTime = 0;

        layers.delete(name);

    }

    function stopAllLayers() {

        layers.forEach((layerAudio) => {
            layerAudio.pause();
            layerAudio.currentTime = 0;
        });

        layers.clear();

    }

    /*
    =====================================================
    ARKA PLAN KORKU MÜZİĞİ (harmanlanmış katmanlar)
    Yağmur + fısıltı sürekli düşük seviyede çalıyor, üstüne
    rastgele aralıklarla (35-70sn) bir gök gürültüsü vuruyor.
    Bölümün kendi ambiyansıyla birlikte, ondan bağımsız olarak
    çalışır.
    =====================================================
    */

    function startAmbientHorrorScore() {

        registerMany(GLOBAL_LAYER_SOUNDS);

        playLayer("__ambientRainLayer");
        playLayer("__ambientWhisperLayer");

        scheduleThunderStrike();

    }

    function scheduleThunderStrike() {

        stopThunderSchedule();

        const delay =
            35000 + Math.random() * 35000;

        thunderTimerId =
            window.setTimeout(() => {

                playEffect("__ambientThunderStrike");

                scheduleThunderStrike();

            }, delay);

    }

    function stopThunderSchedule() {

        if (thunderTimerId !== null) {
            window.clearTimeout(thunderTimerId);
            thunderTimerId = null;
        }

    }

    /*
    =====================================================
    MUSIC
    =====================================================
    */

    function playMusic(
        name,
        options = {}
    ) {

        const sound =
            sounds.get(name);

        if (!sound) {

            console.warn(
                `AshvaleAudio: "${name}" adlı müzik bulunamadı.`
            );

            return null;
        }

        if (
            currentMusic &&
            currentMusic.dataset.soundName === name &&
            !currentMusic.paused
        ) {
            return currentMusic;
        }

        stopMusic();

        currentMusic =
            createAudio({
                ...sound,
                type: "music",
                loop:
                    options.loop ??
                    true,
                volume:
                    clamp(
                        options.volume ??
                        sound.volume
                    )
            });

        currentMusic.dataset.soundName =
            name;

        currentMusic.play()
            .catch(() => {});

        return currentMusic;

    }

    function stopMusic() {

        if (!currentMusic) {
            return;
        }

        currentMusic.pause();

        currentMusic.currentTime = 0;

        currentMusic = null;

    }

    /*
    =====================================================
    GLOBAL CONTROL
    =====================================================
    */

    function stopAll() {

        stopAmbience();
        stopMusic();
        stopAllLayers();
        stopThunderSchedule();

    }

    function pauseAll() {

        currentAmbience?.pause();
        currentMusic?.pause();

        layers.forEach((layerAudio) => {
            layerAudio.pause();
        });

    }

    function resumeAll() {

        if (!settings.muted) {

            currentAmbience
                ?.play()
                .catch(() => {});

            currentMusic
                ?.play()
                .catch(() => {});

            layers.forEach((layerAudio) => {
                layerAudio
                    .play()
                    .catch(() => {});
            });

        }

    }

    /*
    =====================================================
    VOLUME SETTINGS
    =====================================================
    */

    function refreshActiveVolumes() {

        if (currentAmbience) {

            const soundName =
                currentAmbience.dataset.soundName;

            const sound =
                sounds.get(soundName);

            currentAmbience.volume =
                getFinalVolume(
                    "ambience",
                    sound?.volume ?? 1
                );

        }

        if (currentMusic) {

            const soundName =
                currentMusic.dataset.soundName;

            const sound =
                sounds.get(soundName);

            currentMusic.volume =
                getFinalVolume(
                    "music",
                    sound?.volume ?? 1
                );

        }

        layers.forEach((layerAudio) => {

            const soundName =
                layerAudio.dataset.soundName;

            const sound =
                sounds.get(soundName);

            layerAudio.volume =
                getFinalVolume(
                    sound?.type || "ambience",
                    sound?.volume ?? 1
                );

        });

    }

    function setMasterVolume(value) {

        settings.masterVolume =
            clamp(value);

        refreshActiveVolumes();
        saveSettings();

    }

    function setEffectsVolume(value) {

        settings.effectsVolume =
            clamp(value);

        saveSettings();

    }

    function setAmbienceVolume(value) {

        settings.ambienceVolume =
            clamp(value);

        refreshActiveVolumes();
        saveSettings();

    }

    function setMusicVolume(value) {

        settings.musicVolume =
            clamp(value);

        refreshActiveVolumes();
        saveSettings();

    }

    function mute() {

        settings.muted = true;

        refreshActiveVolumes();
        saveSettings();

    }

    function unmute() {

        settings.muted = false;

        refreshActiveVolumes();
        resumeAll();
        saveSettings();

    }

    function toggleMute() {

        if (settings.muted) {
            unmute();
        } else {
            mute();
        }

        return settings.muted;

    }

    function getSettings() {

        return {
            ...settings
        };

    }

    /*
    =====================================================
    BROWSER AUTOPLAY FIX
    =====================================================
    */

    function enableAfterInteraction() {

        const resumeAudio = () => {

            if (
                currentAmbience &&
                currentAmbience.paused &&
                !settings.muted
            ) {

                currentAmbience
                    .play()
                    .catch(() => {});

            }

            document.removeEventListener(
                "pointerdown",
                resumeAudio
            );

            document.removeEventListener(
                "keydown",
                resumeAudio
            );

        };

        document.addEventListener(
            "pointerdown",
            resumeAudio,
            { once: true }
        );

        document.addEventListener(
            "keydown",
            resumeAudio,
            { once: true }
        );

    }

    /*
    =====================================================
    INITIALIZE
    =====================================================
    */

    function initialize(options = {}) {

        if (initialized) {
            return true;
        }

        loadSettings();

        if (options.sounds) {
            registerMany(options.sounds);
        }

        enableAfterInteraction();

        initialized = true;

        if (options.ambientHorrorScore !== false) {
            startAmbientHorrorScore();
        }

        return true;

    }

    /*
    =====================================================
    PUBLIC API
    =====================================================
    */

    return {

        initialize,

        register,
        registerMany,
        has,

        playEffect,

        playAmbience,
        stopAmbience,

        playMusic,
        stopMusic,

        playLayer,
        stopLayer,
        stopAllLayers,

        stopAll,
        pauseAll,
        resumeAll,

        setMasterVolume,
        setEffectsVolume,
        setAmbienceVolume,
        setMusicVolume,

        mute,
        unmute,
        toggleMute,

        getSettings

    };

})();