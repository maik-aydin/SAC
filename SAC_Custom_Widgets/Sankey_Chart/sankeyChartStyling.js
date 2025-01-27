(function () {
    const depths = 4; // Anzahl der Tiefenebenen
    const defaultSettings = {
        itemColor: "#7fbfb9",
        lineOpacity: 0.6,
        textColor: "#000000",
        layoutIterations: 32, // Standardwert für layoutIterations
    };

    const createDepthHTML = (depth) => `
    <div class="depthSettings">
        <div class="depth">
            <label>Depth ${depth}</label>
        </div>
        <div class="settings">
            <div>
                <label>Color:</label>
                <input id="depth${depth}_itemColor" type="text" name="color" />
            </div>
            <div>
                <label class="lineOpacity">Line Opacity:</label>
                <input id="depth${depth}_lineOpacity" type="text" name="opacity" />
            </div>
            <div>
                <label>Text Color:</label>
                <input id="depth${depth}_textColor" type="text" name="textColor" />
            </div>
            <div>
                <label>Line Color:</label>
                <select id="depth${depth}_lineColor" name="lineColor">
                    <option value="gradient">Gradient</option>
                    <option value="source">Source</option>
                    <option value="target">Target</option>
                </select>
            </div>
        </div>
    </div>
  `;

    const templateHTML = `
        <style>
            .depthSettings { margin: 0.5rem 0; }
            .depth { font-size: 18px; }
            .settings { color: #666; font-size: 14px; }
            .settings label { display: inline-block; line-height: 1.75rem; width: 5.625rem; }
            .settings input { color: #333; line-height: 1.25rem; }
        </style>
        <div>
            ${Array.from({ length: depths }, (_, i) => createDepthHTML(i)).join('')}
            <div class="layoutIterations">
                <label>Layout Iterations:</label>
                <input id="layoutIterations" type="number" name="layoutIterations" min="0" value="${defaultSettings.layoutIterations}" />
            </div>
            <p>Terms of Use</p>
        </div>
    `;

    class SankeyChartStylingPanel extends HTMLElement {
        constructor() {
            super();
            this._shadowRoot = this.attachShadow({ mode: "open" });
            this._shadowRoot.innerHTML = templateHTML;

            this._props = {};

            // Event Listener für alle Tiefenebenen
            Array.from({ length: depths }, (_, index) => `depth${index}`).forEach((depthId, index) => {
                ["itemColor", "lineOpacity", "textColor"].forEach((setting) => {
                    this._shadowRoot.getElementById(`${depthId}_${setting}`).addEventListener("change", this.onDepthSettingsChanged.bind(this, index));
                });
            });

            // Event-Listener für das Dropdown-Menü
            Array.from({ length: depths }, (_, index) => `depth${index}`).forEach((depthId, index) => {
                ["itemColor", "lineOpacity", "textColor"].forEach((setting) => {
                    this._shadowRoot.getElementById(`${depthId}_${setting}`).addEventListener("change", this.onDepthSettingsChanged.bind(this, index));
                });
                this._shadowRoot.getElementById(`${depthId}_lineColor`).addEventListener("change", this.onDepthSettingsChanged.bind(this, index));
            });

            // Event-Listener für layoutIterations
            this._shadowRoot.getElementById("layoutIterations").addEventListener("change", this.onLayoutIterationsChanged.bind(this));
        }

        connectedCallback() {
            this.initializeDefaultValues();
        }

        onCustomWidgetBeforeUpdate(changedProps) {
            this._props = { ...this._props, ...changedProps };
            this.updateFields();
        }

        onCustomWidgetAfterUpdate() {
            this.updateFields();
        }

        initializeDefaultValues() {
            Array.from({ length: depths }, (_, index) => `depth${index}`).forEach((depthId) => {
                const itemColorInput = this._shadowRoot.getElementById(`${depthId}_itemColor`);
                const lineOpacityInput = this._shadowRoot.getElementById(`${depthId}_lineOpacity`);
                const textColorInput = this._shadowRoot.getElementById(`${depthId}_textColor`);

                // Nur initialisieren, wenn leer
                if (!itemColorInput.value) itemColorInput.value = defaultSettings.itemColor;
                if (!lineOpacityInput.value) lineOpacityInput.value = defaultSettings.lineOpacity;
                if (!textColorInput.value) textColorInput.value = defaultSettings.textColor;
            });

            // Initialisieren für layoutIterations
            const layoutIterationsInput = this._shadowRoot.getElementById("layoutIterations");
            if (!layoutIterationsInput.value) layoutIterationsInput.value = defaultSettings.layoutIterations;
        }

        updateFields() {
            Array.from({ length: depths }, (_, index) => `depth${index}`).forEach((depthId) => {
                const settings = this._props[`${depthId}Settings`] || {};

                const itemColorInput = this._shadowRoot.getElementById(`${depthId}_itemColor`);
                const lineOpacityInput = this._shadowRoot.getElementById(`${depthId}_lineOpacity`);
                const textColorInput = this._shadowRoot.getElementById(`${depthId}_textColor`);

                // Werte aus Props übernehmen oder beibehalten
                itemColorInput.value = settings.itemColor !== undefined
                    ? settings.itemColor
                    : itemColorInput.value || defaultSettings.itemColor;

                lineOpacityInput.value = settings.lineOpacity !== undefined
                    ? settings.lineOpacity
                    : itemColorInput.value || defaultSettings.lineOpacity;

                textColorInput.value = settings.textColor !== undefined
                    ? settings.textColor
                    : textColorInput.value || defaultSettings.textColor;
            });

            // Aktualisieren für layoutIterations
            const layoutIterationsInput = this._shadowRoot.getElementById("layoutIterations");
            layoutIterationsInput.value = this._props.layoutIterations !== undefined ? this._props.layoutIterations : defaultSettings.layoutIterations;
        }

        onDepthSettingsChanged(depth, event) {
            const properties = {
                [`depth${depth}Settings`]: {
                    itemColor: this._shadowRoot.getElementById(`depth${depth}_itemColor`).value,
                    lineOpacity: parseFloat(this._shadowRoot.getElementById(`depth${depth}_lineOpacity`).value),
                    textColor: this._shadowRoot.getElementById(`depth${depth}_textColor`).value,
                    lineColor: this._shadowRoot.getElementById(`depth${depth}_lineColor`).value, // Wert des Dropdowns
                },
            };

            this.dispatchEvent(new CustomEvent("propertiesChanged", { detail: { properties } }));
        }

        onLayoutIterationsChanged(event) {
            const layoutIterations = parseInt(event.target.value, 10);
            this.dispatchEvent(new CustomEvent("propertiesChanged", { detail: { properties: { layoutIterations } } }));
        }
    }

    customElements.define("com-sap-sac-sample-echarts-sankey3-styling", SankeyChartStylingPanel);
})();
