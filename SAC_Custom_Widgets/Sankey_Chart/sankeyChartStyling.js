(function () {
  const defaultSettings = {
    itemColor: "#7fbfb9",
    lineOpacity: 0.6,
    textColor: "#000000",
    layoutIterations: 25,
  };

  const createDepthHTML = (depth) => `
    <div class="depthSettings">
      <div class="depth">
        <label>Depth ${depth}</label>
      </div>
      <div class="settings">
        <div>
          <label>Color:</label>
          <input id="depth${depth}_itemColor" type="color" name="color" />
        </div>
        <div>
          <label class="lineOpacity">Line Opacity:</label>
          <input id="depth${depth}_lineOpacity" type="text" name="opacity" />
        </div>
        <div>
          <label>Text Color:</label>
          <input id="depth${depth}_textColor" type="color" name="textColor" />
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

  const generateTemplateHTML = (depths) => `
    <style>
      .depthSettings { margin: 0.75rem 0; }
      .depth { font-size: 18px; }
      .settings { color: #666; font-size: 14px; }
      .settings label { display: inline-block; line-height: 1.75rem; width: 5.625rem; }
      .settings input { color: #333; line-height: 1.25rem; }
      .layoutIterations { margin-bottom: 1rem; }
      .orient { margin-bottom: 1rem; }
      .curveness { margin-bottom: 1rem; }
      .labelPosition { margin-bottom: 1rem; }
    </style>
    <div>
      ${Array.from({ length: depths }, (_, i) => createDepthHTML(i)).join('')}
      <div class="layoutIterations">
        <label>Layout Iterations:</label>
        <input id="layoutIterations" type="range" name="layoutIterations" min="0" max="50" step="1" value="25" />
        <span id="layoutIterationsValue">25</span>
      </div>
      <div class="orient">
        <label>Orient:</label>
        <select id="orient" name="orient">
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>
      </div>
      <div class="curveness">
        <label>Curveness:</label>
        <input id="curveness" type="range" name="curveness" min="0" max="1" step="0.1" value="0.7" />
        <span id="curvenessValue">0.7</span>
      </div>
      <div class="labelPosition">
        <label>Label Position:</label>
        <select id="labelPosition" name="labelPosition">
          <option value="top">Top</option>
          <option value="left">Left</option>
          <option value="right" selected>Right</option>
          <option value="bottom">Bottom</option>
          <option value="inside">Inside</option>
          <option value="insideLeft">Inside Left</option>
          <option value="insideRight">Inside Right</option>
          <option value="insideTop">Inside Top</option>
          <option value="insideBottom">Inside Bottom</option>
          <option value="insideTopLeft">Inside Top Left</option>
          <option value="insideBottomLeft">Inside Bottom Left</option>
          <option value="insideTopRight">Inside Top Right</option>
          <option value="insideBottomRight">Inside Bottom Right</option>
        </select>
      </div>
      <p>Terms of Use</p>
    </div>
  `;

  class SankeyChartStylingPanel extends HTMLElement {
    constructor() {
      super();
      this._shadowRoot = this.attachShadow({ mode: "open" });
      this._props = {};
      this.render();
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

    render() {
      const depths = this._props.selectedDimensions ? this._props.selectedDimensions.length : 4;
      this._shadowRoot.innerHTML = generateTemplateHTML(depths);

      // Event Listener for all depth levels
      Array.from({ length: depths }, (_, index) => `depth${index}`).forEach((depthId, index) => {
        ["itemColor", "lineOpacity", "textColor"].forEach((setting) => {
          this._shadowRoot.getElementById(`${depthId}_${setting}`).addEventListener("change", this.onDepthSettingsChanged.bind(this, index));
        });
        this._shadowRoot.getElementById(`${depthId}_lineColor`).addEventListener("change", this.onDepthSettingsChanged.bind(this, index));
      });

      // Event Listener for layoutIterations
      this._shadowRoot.getElementById("layoutIterations").addEventListener("input", this.onLayoutIterationsChanged.bind(this));

      // Event Listener for orient
      this._shadowRoot.getElementById("orient").addEventListener("change", this.onOrientChanged.bind(this));

      // Event Listener for curveness
      this._shadowRoot.getElementById("curveness").addEventListener("input", this.onCurvenessChanged.bind(this));

      // Event Listener for labelPosition
      this._shadowRoot.getElementById("labelPosition").addEventListener("change", this.onLabelPositionChanged.bind(this));
    }

    initializeDefaultValues() {
      // Initialize default values for depth settings
      const depths = this._props.selectedDimensions ? this._props.selectedDimensions.length : 4;
      Array.from({ length: depths }, (_, index) => `depth${index}`).forEach((depthId) => {
        const itemColorInput = this._shadowRoot.getElementById(`${depthId}_itemColor`);
        const lineOpacityInput = this._shadowRoot.getElementById(`${depthId}_lineOpacity`);
        const textColorInput = this._shadowRoot.getElementById(`${depthId}_textColor`);

        if (!itemColorInput.value) itemColorInput.value = this._props[`${depthId}Settings`]?.itemColor || defaultSettings.itemColor;
        if (!lineOpacityInput.value) lineOpacityInput.value = this._props[`${depthId}Settings`]?.lineOpacity || defaultSettings.lineOpacity;
        if (!textColorInput.value) textColorInput.value = this._props[`${depthId}Settings`]?.textColor || defaultSettings.textColor;
      });

      // Initialize layoutIterations
      const layoutIterationsInput = this._shadowRoot.getElementById("layoutIterations");
      if (!layoutIterationsInput.value) layoutIterationsInput.value = this._props.layoutIterations || defaultSettings.layoutIterations;
      this._shadowRoot.getElementById("layoutIterationsValue").innerText = layoutIterationsInput.value;

      // Initialize orient
      const orientInput = this._shadowRoot.getElementById("orient");
      if (!orientInput.value) orientInput.value = this._props.orient || "horizontal";

      // Initialize curveness
      const curvenessInput = this._shadowRoot.getElementById("curveness");
      if (!curvenessInput.value) curvenessInput.value = this._props.curveness || "0.7";
      this._shadowRoot.getElementById("curvenessValue").innerText = curvenessInput.value;

      // Initialize labelPosition
      const labelPositionInput = this._shadowRoot.getElementById("labelPosition");
      if (!labelPositionInput.value) labelPositionInput.value = this._props.labelPosition || "right";
    }

    updateFields() {
      // Update fields for depth settings
      const depths = this._props.selectedDimensions ? this._props.selectedDimensions.length : 4;
      Array.from({ length: depths }, (_, index) => `depth${index}`).forEach((depthId) => {
        const settings = this._props[`${depthId}Settings`] || {};

        const itemColorInput = this._shadowRoot.getElementById(`${depthId}_itemColor`);
        const lineOpacityInput = this._shadowRoot.getElementById(`${depthId}_lineOpacity`);
        const textColorInput = this._shadowRoot.getElementById(`${depthId}_textColor`);

        itemColorInput.value = settings.itemColor !== undefined ? settings.itemColor : itemColorInput.value || defaultSettings.itemColor;
        lineOpacityInput.value = settings.lineOpacity !== undefined ? settings.lineOpacity : itemColorInput.value || defaultSettings.lineOpacity;
        textColorInput.value = settings.textColor !== undefined ? settings.textColor : textColorInput.value || defaultSettings.textColor;
      });

      // Update layoutIterations
      const layoutIterationsInput = this._shadowRoot.getElementById("layoutIterations");
      layoutIterationsInput.value = this._props.layoutIterations !== undefined ? this._props.layoutIterations : defaultSettings.layoutIterations;
      this._shadowRoot.getElementById("layoutIterationsValue").innerText = layoutIterationsInput.value;

      // Update orient
      const orientInput = this._shadowRoot.getElementById("orient");
      orientInput.value = this._props.orient !== undefined ? this._props.orient : "horizontal";

      // Update curveness
      const curvenessInput = this._shadowRoot.getElementById("curveness");
      curvenessInput.value = this._props.curveness !== undefined ? this._props.curveness : "0.7";
      this._shadowRoot.getElementById("curvenessValue").innerText = curvenessInput.value;

      // Update labelPosition
      const labelPositionInput = this._shadowRoot.getElementById("labelPosition");
      labelPositionInput.value = this._props.labelPosition !== undefined ? this._props.labelPosition : "right";
    }

    onDepthSettingsChanged(depth, event) {
      const properties = {
        [`depth${depth}Settings`]: {
          itemColor: this._shadowRoot.getElementById(`depth${depth}_itemColor`).value,
          lineOpacity: parseFloat(this._shadowRoot.getElementById(`depth${depth}_lineOpacity`).value),
          textColor: this._shadowRoot.getElementById(`depth${depth}_textColor`).value,
          lineColor: this._shadowRoot.getElementById(`depth${depth}_lineColor`).value,
        },
      };

      this.dispatchEvent(new CustomEvent("propertiesChanged", { detail: { properties } }));
    }

    onLayoutIterationsChanged(event) {
      const layoutIterations = parseInt(event.target.value, 10);
      this._shadowRoot.getElementById("layoutIterationsValue").innerText = layoutIterations;

      this.dispatchEvent(new CustomEvent("propertiesChanged", { detail: { properties: { layoutIterations } } }));
    }

    onOrientChanged(event) {
      const orient = event.target.value;
      this.dispatchEvent(new CustomEvent("propertiesChanged", { detail: { properties: { orient } } }));
    }

    onCurvenessChanged(event) {
      const curveness = event.target.value;
      this._shadowRoot.getElementById("curvenessValue").innerText = curveness;
      this.dispatchEvent(new CustomEvent("propertiesChanged", { detail: { properties: { curveness } } }));
    }

    onLabelPositionChanged(event) {
      const labelPosition = event.target.value;
      this.dispatchEvent(new CustomEvent("propertiesChanged", { detail: { properties: { labelPosition } } }));
    }
  }

  customElements.define("com-sap-sac-sample-echarts-sankey3-styling", SankeyChartStylingPanel);
})();