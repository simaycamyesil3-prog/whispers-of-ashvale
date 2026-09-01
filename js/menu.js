"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
ANA MENÜ YÖNETİCİSİ
=========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    const Save =
        window.AshvaleSaveManager ||
        window.SaveSystem ||
        window.Save;

    const Game = window.AshvaleGame;

    // Şu ana kadar gerçekten inşa edilmiş bölüm sayısı.
    // Yeni bölümler (room6.html, room7.html, ...) eklendikçe bu sayı artırılmalı.
    const BUILT_CHAPTERS = 15;

    const CHAPTER_TITLES = {
        1: "Giriş Koridoru",
        2: "Kayıt Odası",
        3: "Tedavi Kanadı",
        4: "Elektrik Odası",
        5: "Ameliyathane",
        6: "Eczane / İlaç Deposu",
        7: "Arşiv & Morg",
        8: "Baş Hekim Ofisi",
        9: "İzolasyon Koğuşu",
        10: "Dinleme Odası",
        11: "Pediatri Koğuşu",
        12: "Personel Sığınağı",
        13: "Eski Temeller",
        14: "Karşılaşma",
        15: "Ashvale'in Kalbi"
    };

    const TOTAL_CHAPTERS = 15;

    /*
    =====================================================
    ELEMENT REFERANSLARI
    =====================================================
    */

    const loadingScreen = document.getElementById("loadingScreen");
    const loadingBarFill = document.getElementById("loadingBarFill");

    const continueButton = document.getElementById("continueButton");
    const continueDescription = document.getElementById("continueDescription");
    const newGameButton = document.getElementById("newGameButton");
    const chapterButton = document.getElementById("chapterButton");
    const settingsButton = document.getElementById("settingsButton");
    const aboutButton = document.getElementById("aboutButton");

    const saveStatus = document.getElementById("saveStatus");
    const soundToggleButton = document.getElementById("soundToggleButton");

    const newGameModal = document.getElementById("newGameModal");
    const playerNameInput = document.getElementById("playerNameInput");
    const playerNameError = document.getElementById("playerNameError");
    const startNewGameButton = document.getElementById("startNewGameButton");

    const overwriteModal = document.getElementById("overwriteModal");
    const confirmOverwriteButton = document.getElementById("confirmOverwriteButton");

    const chaptersModal = document.getElementById("chaptersModal");
    const chapterGrid = document.getElementById("chapterGrid");

    const settingsModal = document.getElementById("settingsModal");
    const masterVolume = document.getElementById("masterVolume");
    const masterVolumeOutput = document.getElementById("masterVolumeOutput");
    const musicVolume = document.getElementById("musicVolume");
    const musicVolumeOutput = document.getElementById("musicVolumeOutput");
    const effectsVolume = document.getElementById("effectsVolume");
    const effectsVolumeOutput = document.getElementById("effectsVolumeOutput");
    const filmGrainToggle = document.getElementById("filmGrainToggle");
    const rainToggle = document.getElementById("rainToggle");
    const cameraMotionToggle = document.getElementById("cameraMotionToggle");
    const languageSelect = document.getElementById("languageSelect");
    const resetSettingsButton = document.getElementById("resetSettingsButton");
    const saveSettingsButton = document.getElementById("saveSettingsButton");

    const aboutModal = document.getElementById("aboutModal");

    const toastContainer = document.getElementById("toastContainer");

    let pendingPlayerName = "";

    /*
    =====================================================
    YARDIMCI FONKSİYONLAR
    =====================================================
    */

    function toast(message, variant) {

        if (!toastContainer || !message) return;

        const el = document.createElement("div");
        el.className = "toast" + (variant ? " toast--" + variant : "");
        el.textContent = message;

        toastContainer.appendChild(el);

        window.requestAnimationFrame(() => {
            el.classList.add("is-visible");
        });

        window.setTimeout(() => {
            el.classList.remove("is-visible");
            window.setTimeout(() => el.remove(), 400);
        }, 3200);

    }

    function openModal(modalEl) {

        if (!modalEl) return;

        modalEl.classList.add("is-open");
        modalEl.setAttribute("aria-hidden", "false");

    }

    function closeModal(modalEl) {

        if (!modalEl) return;

        modalEl.classList.remove("is-open");
        modalEl.setAttribute("aria-hidden", "true");

    }

    function closeAllModals() {

        document.querySelectorAll(".modal.is-open").forEach((modal) => {
            closeModal(modal);
        });

    }

    /*
    =====================================================
    YÜKLEME EKRANI
    =====================================================
    */

    function hideLoadingScreen() {

        if (!loadingScreen) return;

        if (loadingBarFill) {
            loadingBarFill.style.width = "100%";
        }

        window.setTimeout(() => {
            loadingScreen.classList.add("is-hidden");
            loadingScreen.setAttribute("aria-hidden", "true");
        }, 320);

    }

    if (loadingBarFill) {
        window.requestAnimationFrame(() => {
            loadingBarFill.style.width = "70%";
        });
    }

    window.setTimeout(hideLoadingScreen, 700);

    /*
    =====================================================
    DEVAM ET / KAYIT DURUMU
    =====================================================
    */

    function refreshSaveState() {

        const hasSave =
            Save && typeof Save.hasSave === "function" && Save.hasSave();

        if (continueButton) {
            continueButton.disabled = !hasSave;
        }

        if (hasSave && Save) {

            const data = Save.getData ? Save.getData() : null;
            const playerName = data?.player?.name || "";
            const currentRoom = data?.currentRoom || 1;
            const chapterTitle = CHAPTER_TITLES[currentRoom] || ("Bölüm " + currentRoom);

            if (continueDescription) {
                continueDescription.textContent =
                    (playerName ? playerName + " — " : "") +
                    "Bölüm " + currentRoom + " / " + chapterTitle;
            }

            if (saveStatus) {
                saveStatus.textContent = "Kayıtlı ilerleme bulundu";
            }

        } else {

            if (continueDescription) {
                continueDescription.textContent = "Henüz kayıtlı oyun bulunmuyor";
            }

            if (saveStatus) {
                saveStatus.textContent = "Yerel kayıt sistemi hazır";
            }

        }

    }

    /*
    =====================================================
    SES DÜĞMESİ
    =====================================================
    */

    function refreshSoundToggle() {

        if (!soundToggleButton || !Save) return;

        const muted = Save.getSetting ? Save.getSetting("muted", false) : false;

        soundToggleButton.classList.toggle("is-muted", muted === true);
        soundToggleButton.setAttribute("aria-pressed", muted ? "true" : "false");

    }

    if (soundToggleButton) {

        soundToggleButton.addEventListener("click", () => {

            if (!Save) return;

            const muted = Save.getSetting ? Save.getSetting("muted", false) : false;
            Save.setSetting("muted", !muted);

            refreshSoundToggle();

        });

    }

    /*
    =====================================================
    YENİ OYUN AKIŞI
    =====================================================
    */

    if (newGameButton) {

        newGameButton.addEventListener("click", () => {

            if (playerNameInput) playerNameInput.value = "";
            if (playerNameError) playerNameError.textContent = "";

            openModal(newGameModal);

            window.setTimeout(() => playerNameInput?.focus(), 150);

        });

    }

    function beginNewGame(playerName) {

        closeAllModals();

        if (Game && typeof Game.startNewGame === "function") {
            Game.startNewGame(playerName);
        } else if (Save) {
            Save.startNewGame(playerName);
            window.location.href = "room1.html";
        }

    }

    if (startNewGameButton) {

        startNewGameButton.addEventListener("click", () => {

            const name = (playerNameInput?.value || "").trim();

            if (!name) {

                if (playerNameError) {
                    playerNameError.textContent = "Devam etmek için bir ad yazmalısın.";
                }

                return;

            }

            pendingPlayerName = name;

            const hasExistingSave =
                Save && typeof Save.hasSave === "function" && Save.hasSave();

            if (hasExistingSave) {
                closeModal(newGameModal);
                openModal(overwriteModal);
            } else {
                beginNewGame(pendingPlayerName);
            }

        });

    }

    if (confirmOverwriteButton) {

        confirmOverwriteButton.addEventListener("click", () => {
            beginNewGame(pendingPlayerName);
        });

    }

    /*
    =====================================================
    DEVAM ET DÜĞMESİ
    =====================================================
    */

    if (continueButton) {

        continueButton.addEventListener("click", () => {

            if (continueButton.disabled) return;

            if (Game && typeof Game.continueGame === "function") {
                Game.continueGame();
            } else if (Save) {
                Save.loadFromStorage();
                window.location.href = "room" + (Save.getCurrentRoom() || 1) + ".html";
            }

        });

    }

    /*
    =====================================================
    BÖLÜM SEÇİMİ
    =====================================================
    */

    function buildChapterGrid() {

        if (!chapterGrid) return;

        chapterGrid.innerHTML = "";

        const completedRooms =
            Save && typeof Save.getCompletedRooms === "function"
                ? Save.getCompletedRooms()
                : [];

        for (let chapterNumber = 1; chapterNumber <= TOTAL_CHAPTERS; chapterNumber += 1) {

            const title = CHAPTER_TITLES[chapterNumber] || "?";
            const isBuilt = chapterNumber <= BUILT_CHAPTERS;
            const isCompleted = completedRooms.includes(chapterNumber);
            const isUnlocked =
                chapterNumber === 1 || completedRooms.includes(chapterNumber - 1);

            const playable = isBuilt && isUnlocked;

            let statusText = "KİLİTLİ";
            if (!isBuilt) statusText = "YAKINDA";
            else if (isCompleted) statusText = "TAMAMLANDI";
            else if (isUnlocked) statusText = "OYNANABİLİR";

            const card = document.createElement("button");
            card.type = "button";
            card.className = "chapter-card";
            card.disabled = !playable;

            card.innerHTML =
                '<span class="chapter-card__number">BÖLÜM ' +
                String(chapterNumber).padStart(2, "0") +
                '</span>' +
                '<span class="chapter-card__title">' + title + '</span>' +
                '<span class="chapter-card__status">' + statusText + '</span>';

            if (playable) {

                card.addEventListener("click", () => {

                    closeAllModals();

                    if (Game && typeof Game.goToRoom === "function") {
                        Game.goToRoom(chapterNumber);
                    } else {
                        window.location.href = "room" + chapterNumber + ".html";
                    }

                });

            }

            chapterGrid.appendChild(card);

        }

    }

    if (chapterButton) {

        chapterButton.addEventListener("click", () => {
            buildChapterGrid();
            openModal(chaptersModal);
        });

    }

    /*
    =====================================================
    AYARLAR
    =====================================================
    */

    function populateSettingsForm() {

        if (!Save) return;

        const settings = Save.getSettings ? Save.getSettings() : {};

        if (masterVolume) {
            masterVolume.value = Math.round((settings.masterVolume ?? 1) * 100);
            if (masterVolumeOutput) masterVolumeOutput.textContent = masterVolume.value + "%";
        }

        if (musicVolume) {
            musicVolume.value = Math.round((settings.musicVolume ?? 0.6) * 100);
            if (musicVolumeOutput) musicVolumeOutput.textContent = musicVolume.value + "%";
        }

        if (effectsVolume) {
            effectsVolume.value = Math.round((settings.effectsVolume ?? 0.8) * 100);
            if (effectsVolumeOutput) effectsVolumeOutput.textContent = effectsVolume.value + "%";
        }

        if (filmGrainToggle) filmGrainToggle.checked = settings.filmGrainEnabled !== false;
        if (rainToggle) rainToggle.checked = settings.rainEnabled !== false;
        if (cameraMotionToggle) cameraMotionToggle.checked = settings.cameraMotionEnabled !== false;
        if (languageSelect) languageSelect.value = settings.language || "tr";

    }

    [
        [masterVolume, masterVolumeOutput],
        [musicVolume, musicVolumeOutput],
        [effectsVolume, effectsVolumeOutput]
    ].forEach(([input, output]) => {

        if (!input || !output) return;

        input.addEventListener("input", () => {
            output.textContent = input.value + "%";
        });

    });

    if (settingsButton) {

        settingsButton.addEventListener("click", () => {
            populateSettingsForm();
            openModal(settingsModal);
        });

    }

    if (resetSettingsButton) {

        resetSettingsButton.addEventListener("click", () => {

            if (Save && typeof Save.resetSettings === "function") {
                Save.resetSettings();
            }

            populateSettingsForm();
            refreshSoundToggle();

            toast("Ayarlar varsayılana döndürüldü.");

        });

    }

    if (saveSettingsButton) {

        saveSettingsButton.addEventListener("click", () => {

            if (!Save || typeof Save.saveSettings !== "function") return;

            Save.saveSettings({

                masterVolume: (Number(masterVolume?.value ?? 100)) / 100,
                musicVolume: (Number(musicVolume?.value ?? 60)) / 100,
                effectsVolume: (Number(effectsVolume?.value ?? 80)) / 100,

                filmGrainEnabled: !!filmGrainToggle?.checked,
                rainEnabled: !!rainToggle?.checked,
                cameraMotionEnabled: !!cameraMotionToggle?.checked,

                language: languageSelect?.value || "tr"

            });

            if (Game && typeof Game.applySettings === "function") {
                Game.applySettings();
            }

            closeModal(settingsModal);

            toast("Ayarlar kaydedildi.", "success");

        });

    }

    /*
    =====================================================
    HAKKINDA
    =====================================================
    */

    if (aboutButton) {

        aboutButton.addEventListener("click", () => {
            openModal(aboutModal);
        });

    }

    /*
    =====================================================
    MODAL KAPATMA (delegasyon)
    =====================================================
    */

    document.addEventListener("click", (event) => {

        const closeTarget = event.target.closest("[data-close-modal]");

        if (!closeTarget) return;

        const modalId = closeTarget.getAttribute("data-close-modal");
        const modalEl = modalId ? document.getElementById(modalId) : null;

        closeModal(modalEl);

    });

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {
            closeAllModals();
        }

    });

    /*
    =====================================================
    BAŞLANGIÇ
    =====================================================
    */

    refreshSaveState();
    refreshSoundToggle();

    if (Game && typeof Game.applySettings === "function") {
        Game.applySettings();
    }

});
