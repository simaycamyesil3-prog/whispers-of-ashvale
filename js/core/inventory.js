
/*
=========================================================
WHISPERS OF ASHVALE
INVENTORY MANAGER

Görevleri:
- Envantere eşya ekleme ve silme
- Eşya seçme ve kullanma
- Sabit sayıda envanter slotu oluşturma
- UI güncelleme
- AshvaleSave ile otomatik kayıt ve yükleme
=========================================================
*/

window.AshvaleInventory = (() => {

    const items = new Map();

    let selectedItem = null;
    let inventoryElement = null;
    let saveManager = null;

    let storageKey = "inventory";
    let slotCount = 6;
    let initialized = false;

    const ITEM_EMOJIS = {

    /* Room 1 */
    "patient-page": "📄",

    /* Room 2 */
    "patient-record-fragment-a": "📋",
    "patient-record-fragment-b": "📋",
    "patient-record-fragment-c": "📋",
    "treatment-keycard": "💳",

    /* Room 3 */
    "medicine-cabinet-key": "🔑",
    "medicine-list": "💊",

    /* Room 4 */
    "red-power-cable": "🔴🔌",
    "blue-power-cable": "🔵🔌",
    "green-power-cable": "🟢🔌",
    "electrical-access-card": "💳",

    /* Room 5 */
    "uv-flashlight": "🔦",

    /* İleride kullanılabilecekler */
    "door-key": "🗝️",
    "note": "📝",
    "document": "📄",
    "medicine": "💊",
    "syringe": "💉",
    "battery": "🔋",
    "flashlight": "🔦",
    "screwdriver": "🪛",
    "wrench": "🔧",
    "cassette": "📼",
    "photo": "🖼️",
    "usb": "💾"
};

    

    function getItemEmoji(item) {

        if (!item) {
            return "❔";
        }

        /*
        Önce doğrudan item ID eşleşmesine bakar.
        */
        if (ITEM_EMOJIS[item.id]) {
            return ITEM_EMOJIS[item.id];
        }

        /*
        Yeni item henüz listeye eklenmediyse
        adından uygun emoji tahmin eder.
        */
        const searchableText =
            `${item.id} ${item.name}`
                .toLocaleLowerCase("tr-TR");

        if (
            searchableText.includes("anahtar kart") ||
            searchableText.includes("keycard") ||
            searchableText.includes("kart")
        ) {
            return "💳";
        }

        if (
            searchableText.includes("anahtar") ||
            searchableText.includes("key")
        ) {
            return "🔑";
        }

        if (
            searchableText.includes("ilaç") ||
            searchableText.includes("medicine") ||
            searchableText.includes("reçete")
        ) {
            return "💊";
        }

        if (
            searchableText.includes("hasta kaydı") ||
            searchableText.includes("kayıt") ||
            searchableText.includes("record")
        ) {
            return "📋";
        }

        if (
            searchableText.includes("not") ||
            searchableText.includes("note")
        ) {
            return "📝";
        }

        if (
            searchableText.includes("belge") ||
            searchableText.includes("liste") ||
            searchableText.includes("sayfa") ||
            searchableText.includes("document")
        ) {
            return "📄";
        }

        if (
            searchableText.includes("pil") ||
            searchableText.includes("battery")
        ) {
            return "🔋";
        }

        if (
            searchableText.includes("fotoğraf") ||
            searchableText.includes("photo")
        ) {
            return "🖼️";
        }

        /*
        Tanımlanmamış eşyalarda kutu yerine
        genel bir eşya simgesi gösterilir.
        */
        return "❔";
    }

    /*
    =====================================================
    HELPERS
    =====================================================
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

    function normalizeItem(item) {

        if (!item || typeof item !== "object") {
            return null;
        }

        if (!item.id) {
            throw new Error(
                "AshvaleInventory: Eşya için id gereklidir."
            );
        }

        return {
            id: String(item.id),

            name:
                String(item.name || item.id),

            description:
                String(item.description || ""),

            icon:
                String(item.icon || ""),

            consumable:
                Boolean(item.consumable),

            data:
                item.data &&
                typeof item.data === "object"
                    ? { ...item.data }
                    : {}
        };
    }

    function connect(elementOrId) {

        inventoryElement =
            getElement(elementOrId);

        if (!inventoryElement) {

            console.warn(
                "AshvaleInventory: Envanter alanı bulunamadı."
            );

            return false;
        }

        render();

        return true;
    }

    /*
    =====================================================
    SAVE SYSTEM
    =====================================================
    */

    function saveState() {

        if (
            !saveManager ||
            typeof saveManager.set !== "function"
        ) {
            return false;
        }

        saveManager.set(
            storageKey,
            exportState()
        );

        return true;
    }

    function loadState() {

        if (
            !saveManager ||
            typeof saveManager.get !== "function"
        ) {
            return false;
        }

        const savedState =
            saveManager.get(storageKey);

        if (!savedState) {
            return false;
        }

        importState(savedState, {
            saveAfterImport: false
        });

        return true;
    }

    /*
    =====================================================
    ITEM MANAGEMENT
    =====================================================
    */

    function add(item, options = {}) {

        const normalizedItem =
            normalizeItem(item);

        if (!normalizedItem) {
            return false;
        }

        if (
            items.has(normalizedItem.id) &&
            options.replace !== true
        ) {
            return false;
        }

        items.set(
            normalizedItem.id,
            normalizedItem
        );

        render();

        if (options.save !== false) {
            saveState();
        }

        return true;
    }

    function remove(itemId, options = {}) {

        const normalizedId =
            String(itemId || "");

        if (!items.has(normalizedId)) {
            return false;
        }

        items.delete(normalizedId);

        if (selectedItem === normalizedId) {
            selectedItem = null;
        }

        render();

        if (options.save !== false) {
            saveState();
        }

        return true;
    }

    function has(itemId) {

        return items.has(
            String(itemId || "")
        );
    }

    function get(itemId) {

        return items.get(
            String(itemId || "")
        ) || null;
    }

    function getAll() {

        return Array.from(
            items.values()
        );
    }

    function count() {

        return items.size;
    }

    function clear(options = {}) {

        items.clear();
        selectedItem = null;

        render();

        if (options.save !== false) {
            saveState();
        }
    }

    /*
    =====================================================
    SELECTION
    =====================================================
    */

    function select(itemId) {

        const normalizedId =
            String(itemId || "");

        if (!items.has(normalizedId)) {
            return false;
        }

        selectedItem = normalizedId;

        render();
        saveState();

        return true;
    }

    function unselect() {

        if (!selectedItem) {
            return false;
        }

        selectedItem = null;

        render();
        saveState();

        return true;
    }

    function toggleSelection(itemId) {

        const normalizedId =
            String(itemId || "");

        if (selectedItem === normalizedId) {
            return unselect();
        }

        return select(normalizedId);
    }

    function getSelected() {

        if (!selectedItem) {
            return null;
        }

        return items.get(selectedItem) || null;
    }

    function isSelected(itemId) {

        return selectedItem ===
            String(itemId || "");
    }

    /*
    =====================================================
    ITEM USE
    =====================================================
    */

    function use(callback, options = {}) {

        const item =
            getSelected();

        if (!item) {
            return false;
        }

        let result = true;

        if (typeof callback === "function") {

            result =
                callback(item) !== false;

        }

        if (
            result &&
            (
                options.consume === true ||
                item.consumable === true
            )
        ) {

            remove(item.id);

        }

        return result;
    }

        /*
    =====================================================
    ITEM BİLGİ PENCERESİ
    =====================================================
    */

    function getOrCreateItemViewer() {

        let viewer =
            document.getElementById(
                "ashvaleInventoryItemViewer"
            );

        if (viewer) {
            return viewer;
        }

        viewer =
            document.createElement("section");

        viewer.id =
            "ashvaleInventoryItemViewer";

        viewer.className =
            "inventory-item-viewer hidden";

        viewer.setAttribute(
            "aria-hidden",
            "true"
        );

        viewer.setAttribute(
            "role",
            "dialog"
        );

        viewer.setAttribute(
            "aria-modal",
            "true"
        );

        viewer.innerHTML = `
            <article class="inventory-item-card">

                <button
                    id="closeInventoryItemViewer"
                    class="inventory-item-close"
                    type="button"
                    aria-label="Eşya bilgisini kapat"
                >
                    ✕
                </button>

                <div
                    id="inventoryItemViewerEmoji"
                    class="inventory-item-large-emoji"
                    aria-hidden="true"
                ></div>

                <span class="inventory-item-label">
                    ENVANTER EŞYASI
                </span>

                <h2 id="inventoryItemViewerName">
                    Eşya
                </h2>

                <p id="inventoryItemViewerDescription">
                    Eşya açıklaması bulunmuyor.
                </p>

                <button
                    id="inventoryItemViewerContinue"
                    class="inventory-item-continue"
                    type="button"
                >
                    KAPAT
                </button>

            </article>
        `;

        document.body.appendChild(
            viewer
        );

        const closeViewer = () => {

            viewer.classList.add(
                "hidden"
            );

            viewer.setAttribute(
                "aria-hidden",
                "true"
            );

        };

        viewer
            .querySelector(
                "#closeInventoryItemViewer"
            )
            ?.addEventListener(
                "click",
                closeViewer
            );

        viewer
            .querySelector(
                "#inventoryItemViewerContinue"
            )
            ?.addEventListener(
                "click",
                closeViewer
            );

        viewer.addEventListener(
            "click",
            event => {

                if (event.target === viewer) {
                    closeViewer();
                }

            }
        );

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape" &&
                    !viewer.classList.contains(
                        "hidden"
                    )
                ) {
                    closeViewer();
                }

            }
        );

        return viewer;
    }


    function openItemViewer(item) {

        if (!item) {
            return;
        }

        const viewer =
            getOrCreateItemViewer();

        const emojiElement =
            viewer.querySelector(
                "#inventoryItemViewerEmoji"
            );

        const nameElement =
            viewer.querySelector(
                "#inventoryItemViewerName"
            );

        const descriptionElement =
            viewer.querySelector(
                "#inventoryItemViewerDescription"
            );

        if (emojiElement) {

            emojiElement.textContent =
                getItemEmoji(item);

        }

        if (nameElement) {

            nameElement.textContent =
                item.name || "İsimsiz Eşya";

        }

        if (descriptionElement) {

            descriptionElement.textContent =
                item.description ||
                "Bu eşya için bir açıklama bulunmuyor.";

        }

        viewer.classList.remove(
            "hidden"
        );

        viewer.setAttribute(
            "aria-hidden",
            "false"
        );

        viewer
            .querySelector(
                "#inventoryItemViewerContinue"
            )
            ?.focus();

    }

    /*
    =====================================================
    UI
    =====================================================
    */

    function createEmptySlot(index) {

        const slot =
            document.createElement("div");

        slot.className =
            "inventory-slot empty";

        slot.dataset.slotIndex =
            String(index);

        slot.setAttribute(
            "aria-hidden",
            "true"
        );

        return slot;
    }

        function createItemSlot(item, index) {

        const slot =
            document.createElement("button");

        slot.type = "button";

        slot.className =
            "inventory-slot";

        slot.dataset.itemId =
            item.id;

        slot.dataset.slotIndex =
            String(index);

        slot.title =
            item.name;

        slot.setAttribute(
            "aria-label",
            `${item.name}. Görüntülemek için tıkla.`
        );

        if (item.id === selectedItem) {

            slot.classList.add(
                "selected"
            );

            slot.setAttribute(
                "aria-pressed",
                "true"
            );

        } else {

            slot.setAttribute(
                "aria-pressed",
                "false"
            );

        }

        const emoji =
            document.createElement("span");

        emoji.className =
            "inventory-item-emoji";

        emoji.textContent =
            getItemEmoji(item);

        emoji.setAttribute(
            "aria-hidden",
            "true"
        );

        slot.appendChild(
            emoji
        );

        /*
        Item adı hover sırasında küçük etiket
        olarak gösterilir.
        */
        const itemName =
            document.createElement("span");

        itemName.className =
            "inventory-item-tooltip";

        itemName.textContent =
            item.name;

        slot.appendChild(
            itemName
        );

        slot.addEventListener(
            "click",
            event => {

                event.preventDefault();

                select(
                    item.id
                );

                openItemViewer(
                    item
                );

                /*
                Odaya özel kodlar ihtiyaç duyarsa
                bu olayı ayrıca dinleyebilir.
                */
                window.dispatchEvent(
                    new CustomEvent(
                        "ashvale:inventory-item-open",
                        {
                            detail: {
                                item
                            }
                        }
                    )
                );

            }
        );

        return slot;
    }
    
    function render() {

        if (!inventoryElement) {
            return false;
        }

        inventoryElement.innerHTML = "";

        const inventoryItems =
            getAll();

        const totalSlots =
            Math.max(
                slotCount,
                inventoryItems.length
            );

        for (
            let index = 0;
            index < totalSlots;
            index++
        ) {

            const item =
                inventoryItems[index];

            const slot =
                item
                    ? createItemSlot(
                        item,
                        index
                    )
                    : createEmptySlot(
                        index
                    );

            inventoryElement.appendChild(
                slot
            );

        }

        return true;
    }

    /*
    =====================================================
    IMPORT / EXPORT
    =====================================================
    */

    function exportState() {

        return {
            items: getAll(),
            selectedItem
        };
    }

    function importState(
        state,
        options = {}
    ) {

        items.clear();
        selectedItem = null;

        if (
            state &&
            Array.isArray(state.items)
        ) {

            state.items.forEach(item => {

                try {

                    const normalizedItem =
                        normalizeItem(item);

                    if (normalizedItem) {

                        items.set(
                            normalizedItem.id,
                            normalizedItem
                        );

                    }

                } catch (error) {

                    console.warn(
                        "AshvaleInventory: Kayıtlı eşya yüklenemedi.",
                        error
                    );

                }

            });

        }

        if (
            state?.selectedItem &&
            items.has(
                String(state.selectedItem)
            )
        ) {

            selectedItem =
                String(state.selectedItem);

        }

        render();

        if (
            options.saveAfterImport !==
            false
        ) {

            saveState();

        }

        return true;
    }

    /*
    =====================================================
    INITIALIZE
    =====================================================
    */

    function initialize(options = {}) {

        /*
        Eski kullanım desteği:
        AshvaleInventory.initialize("inventorySlots")
        */

        if (
            typeof options === "string" ||
            options instanceof HTMLElement
        ) {

            options = {
                element: options
            };

        }

        inventoryElement =
            getElement(
                options.element ||
                options.container ||
                "inventorySlots"
            );

        saveManager =
            options.save || null;

        storageKey =
            String(
                options.storageKey ||
                "inventory"
            );

        slotCount =
            Math.max(
                1,
                Number(options.slots) || 6
            );

        if (!inventoryElement) {

            console.warn(
                "AshvaleInventory: Envanter alanı bulunamadı."
            );

            return false;
        }

        initialized = true;

        if (options.load !== false) {
            loadState();
        }

        render();

        return true;
    }

    function isInitialized() {

        return initialized;
    }

    /*
    =====================================================
    PUBLIC API
    =====================================================
    */

    return {
        initialize,
        isInitialized,

        connect,

        add,
        remove,
        has,
        get,
        getAll,
        count,
        clear,

        select,
        unselect,
        toggleSelection,
        isSelected,
        getSelected,

        use,

        saveState,
        loadState,
        exportState,
        importState,

        render
    };

})();