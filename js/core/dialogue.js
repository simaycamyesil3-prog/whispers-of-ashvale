"use strict";

/*
=========================================================
WHISPERS OF ASHVALE
DIALOGUE MANAGER

Görevleri

- Diyalog kutusunu açma ve kapatma
- Yazı yazma animasyonu
- Diyalog sırası yönetimi
- Yazıyı anında tamamlama
- Not gösterme
=========================================================
*/

window.AshvaleDialogue = (() => {

    let container = null;
    let speakerElement = null;
    let textElement = null;

    let isTyping = false;
    let typingTimer = null;

    let currentText = "";
    let currentSpeed = 25;

    const queue = [];

    /*
    =====================================
    ELEMENT HELPER
    =====================================
    */

    function getElement(elementOrId) {

        if (!elementOrId) {
            return null;
        }

        if (typeof elementOrId === "string") {
            return document.getElementById(elementOrId);
        }

        return elementOrId;
    }

    /*
    =====================================
    INITIALIZE
    =====================================
    */

    function initialize(options = {}) {

        container = getElement(options.container);

        speakerElement = getElement(options.speaker);

        textElement = getElement(options.text);

        if (!container) {
            console.warn(
                "AshvaleDialogue: Diyalog kutusu bulunamadı."
            );
        }

        if (!textElement) {
            console.warn(
                "AshvaleDialogue: Diyalog metin alanı bulunamadı."
            );
        }

        clear();

        return Boolean(container && textElement);
    }

    /*
    =====================================
    TIMER
    =====================================
    */

    function stopTypingTimer() {

        if (!typingTimer) {
            return;
        }

        clearInterval(typingTimer);

        typingTimer = null;
    }

    /*
    =====================================
    TYPEWRITER
    =====================================
    */

    function typeWriter(text, speed = 25) {

        if (!textElement) {
            return false;
        }

        stopTypingTimer();

        currentText = String(text ?? "");
        currentSpeed = Math.max(0, Number(speed) || 0);

        textElement.textContent = "";

        if (currentText.length === 0) {
            isTyping = false;
            return true;
        }

        if (currentSpeed === 0) {
            textElement.textContent = currentText;
            isTyping = false;
            return true;
        }

        let index = 0;

        isTyping = true;

        typingTimer = setInterval(() => {

            textElement.textContent +=
                currentText.charAt(index);

            index++;

            if (index >= currentText.length) {

                stopTypingTimer();

                isTyping = false;

            }

        }, currentSpeed);

        return true;
    }

    /*
    =====================================
    SHOW / HIDE
    =====================================
    */

    function show(options = {}) {

        if (!container || !textElement) {
            return false;
        }

        const speaker =
            String(options.speaker ?? "");

        const text =
            String(options.text ?? "");

        const speed =
            options.speed ?? 25;

        stopTypingTimer();

        container.classList.add("visible");

        container.setAttribute(
            "aria-hidden",
            "false"
        );

        if (speakerElement) {

            speakerElement.textContent =
                speaker;

            speakerElement.style.display =
                speaker
                    ? ""
                    : "none";

        }

        typeWriter(text, speed);

        return true;
    }

    function hide() {

        stopTypingTimer();

        isTyping = false;
        currentText = "";

        if (textElement) {
            textElement.textContent = "";
        }

        if (speakerElement) {

            speakerElement.textContent = "";

            speakerElement.style.display =
                "none";

        }

        if (container) {

            container.classList.remove(
                "visible"
            );

            container.setAttribute(
                "aria-hidden",
                "true"
            );

        }

    }

    function clear() {

        stopTypingTimer();

        isTyping = false;
        currentText = "";

        if (textElement) {
            textElement.textContent = "";
        }

        if (speakerElement) {

            speakerElement.textContent = "";

            speakerElement.style.display =
                "none";

        }

    }

    /*
    =====================================
    TYPING STATUS
    =====================================
    */

    function typing() {

        return isTyping;
    }

    /*
    =====================================
    SKIP
    =====================================
    */

    function skip() {

        if (!isTyping || !textElement) {
            return false;
        }

        stopTypingTimer();

        textElement.textContent =
            currentText;

        isTyping = false;

        return true;
    }

    /*
    =====================================
    DIALOGUE QUEUE
    =====================================
    */

    function enqueue(dialogue) {

        if (!dialogue) {
            return false;
        }

        if (typeof dialogue === "string") {

            queue.push({
                text: dialogue
            });

            return true;
        }

        if (typeof dialogue !== "object") {
            return false;
        }

        queue.push({
            speaker:
                dialogue.speaker ?? "",

            text:
                dialogue.text ?? "",

            speed:
                dialogue.speed ?? 25
        });

        return true;
    }

    function playNext() {

        if (isTyping) {
            return false;
        }

        if (queue.length === 0) {

            hide();

            return false;
        }

        const dialogue =
            queue.shift();

        return show(dialogue);
    }

    function play(dialogues = []) {

        if (!Array.isArray(dialogues)) {
            return false;
        }

        queue.length = 0;

        dialogues.forEach(dialogue => {

            enqueue(dialogue);

        });

        return playNext();
    }

    function next() {

        if (isTyping) {

            return skip();

        }

        if (queue.length > 0) {

            return playNext();

        }

        hide();

        return false;
    }

    function clearQueue() {

        queue.length = 0;
    }

    function queueLength() {

        return queue.length;
    }

    /*
    =====================================
    NOTES
    =====================================
    */

    function showNote(title, text) {

        return show({

            speaker:
                title || "Not",

            text:
                text || "",

            speed:
                15

        });
    }

    /*
    =====================================
    PUBLIC API
    =====================================
    */

    return {

        initialize,

        show,

        hide,

        clear,

        typing,

        skip,

        enqueue,

        play,

        playNext,

        next,

        clearQueue,

        queueLength,

        showNote

    };

})();