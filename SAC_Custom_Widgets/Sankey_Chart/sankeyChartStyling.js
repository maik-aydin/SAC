(function () {
  const depths = 4; // Anzahl der Tiefenebenen
  const defaultSettings = {
      itemColor: "#7fbfb9",
      lineOpacity: 0.6,
      textColor: "#000000",
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
    
  }

  customElements.define("com-sap-sac-sample-echarts-sankey3-styling", SankeyChartStylingPanel);
})();
