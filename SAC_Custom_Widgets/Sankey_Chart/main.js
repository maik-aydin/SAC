var getScriptPromisify = (src) => {
  const __define = define;
  define = undefined;
  return new Promise((resolve) => {
    $.getScript(src, () => {
      define = __define;
      resolve();
    });
  });
};

(function () {
  const parseMetadata = ({ dimensions: dimensionsMap, mainStructureMembers: measuresMap }) => {
    const mapToArray = (map) => Object.keys(map).map((key) => ({ key, ...map[key] }));
    return {
      dimensions: mapToArray(dimensionsMap),
      measures: mapToArray(measuresMap),
    };
  };

  class Renderer {
    constructor(root) {
      this._root = root;
      this._echart = null;
      this.selectedNode = null; // Aktuell selektierter Knoten
    }

    async render(dataBinding, props) {
      await getScriptPromisify("https://cdnjs.cloudflare.com/ajax/libs/echarts/5.0.0/echarts.min.js");
      this.dispose();

      if (dataBinding.state !== "success") return;

      const { data, metadata } = dataBinding;
      const { dimensions, measures } = this.parseMetadata(metadata);

      // Mehrere Dimensionen und ein Maß extrahieren
      const [measure] = measures;

      // Verarbeitung für mehrere Dimensionen
      const nodes = [];
      const linksMap = new Map();

      const nodeValues = {}; // Zwischenspeicher für aggregierte Werte

      // Hilfsfunktion: Berechne die Tiefe eines Knotens basierend auf Parent-Child-Beziehungen
      const calculateDepth = (label, dimensionKey) => {
        let depth = 0;
        let currentNode = data.find((item) => item[dimensionKey]?.label === label);
        while (currentNode && currentNode[dimensionKey]?.parentId) {
          depth++;
          currentNode = data.find((item) => item[dimensionKey]?.id === currentNode[dimensionKey].parentId);
        }
        return depth;
      };

      data.forEach((d) => {
        dimensions.forEach((dimension, index) => {
          const { label, id, parentId } = d[dimension.key];
          const rawValue = d[measure.key]?.raw || 0;

          // Werte aggregieren
          if (!nodeValues[label]) {
            nodeValues[label] = 0;
          }
          nodeValues[label] += rawValue;

          // Berechne Tiefe basierend auf Parent-Child-Hierarchie
          const depth = calculateDepth(label, dimension.key);

          // Knoten nur einmal hinzufügen
          if (!nodes.find((node) => node.name === label)) {
            nodes.push({ name: label, depth: depth + index });
          }

          // Links zwischen Dimensionen hinzufügen und aggregieren
          if (index > 0) {
            const prevDimension = dimensions[index - 1];
            const prevLabel = d[prevDimension.key]?.label;
            if (prevLabel) {
              const linkKey = `${prevLabel} -> ${label}`;
              if (!linksMap.has(linkKey)) {
                linksMap.set(linkKey, {
                  source: prevLabel,
                  target: label,
                  value: 0,
                });
              }
              linksMap.get(linkKey).value += rawValue;
            }
          }

          // Verknüpfung zu übergeordneten Knoten innerhalb derselben Dimension
          if (parentId) {
            const parent = data.find((item) => item[dimension.key]?.id === parentId);
            if (parent) {
              const parentLabel = parent[dimension.key]?.label;
              const linkKey = `${parentLabel} -> ${label}`;
              if (!linksMap.has(linkKey)) {
                linksMap.set(linkKey, {
                  source: parentLabel,
                  target: label,
                  value: 0,
                });
              }
              linksMap.get(linkKey).value += rawValue;
            }
          }
        });
      });

      // Knotenwerte aktualisieren
      nodes.forEach((node) => {
        node.value = nodeValues[node.name] || 0;
      });

      // Konvertiere linksMap zu einem Array von Links
      const links = Array.from(linksMap.values());

      const maxDepth = Math.max(...nodes.map(node => node.depth));
      const levels = [
        // Dynamische Levels (kann erweitert werden)
        ...Array.from({ length: maxDepth + 1 }).map((_, depth) => ({
          depth,
          itemStyle: {
            color: props[`depth${depth}Settings`]?.itemColor || "#E67364",
          },
          lineStyle: {
            color: props[`depth${depth}Settings`]?.lineColor || "gradient",
            opacity: props[`depth${depth}Settings`]?.lineOpacity || (0.6 - depth * 0.2),
          },
          label: {
            position: props.labelPosition || "right",
            color: props[`depth${depth}Settings`]?.textColor || "#FFFFFF",
            formatter: (params) => {
              const formattedValue = (params.data.value || 0).toLocaleString("de-DE", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              });
              return `${params.data.name}: ${formattedValue}`;
            },
          },
        })),
      ];

      this._echart = echarts.init(this._root);

      this._echart.setOption({
        tooltip: {
          trigger: "item",
          triggerOn: "mousemove",
          formatter: (params) => {
            if (params.dataType === "node") {
              const formattedValue = (params.data.value || 0).toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
              return `${params.data.name}<br/>Value: ${formattedValue}`;
            } else if (params.dataType === "edge") {
              const formattedValue = (params.data.value || 0).toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
              return `${params.data.source} → ${params.data.target}<br/>Value: ${formattedValue}`;
            }
            return "";
          },
        },
        series: [
          {
            type: "sankey",
            data: nodes,
            links: links,
            levels: levels,
            layoutIterations: parseInt(props.layoutIterations -1, 10) || 32, // Sicherstellen, dass es eine Ganzzahl ist
            orient: props.orient || "horizontal",
            lineStyle: { curveness: props.curveness || 0.7 },
            nodeAlign: 'justify',
            emphasis: {
              focus: "adjacency",
              blurScope: "global",
            },
          },
        ],
      });

      // Event-Listener für Selektion und Rücksetzen
      this._echart.getZr().on("click", (event) => {
        const pointInGrid = this._echart.convertFromPixel({ seriesIndex: 0 }, [event.offsetX, event.offsetY]);
        if (!pointInGrid) {
          this.selectedNode = null; // Selektion zurücksetzen
          this.resetFocusEffect(nodes, links, levels); // Levels übergeben

          const linkedAnalysis = props["dataBindings"].getDataBinding("dataBinding").getLinkedAnalysis();
          linkedAnalysis.removeFilters(); // Filter zurücksetzen
          return;
        }
      });

      this._echart.on("click", (params) => {
        const dataType = params.dataType;
        const label = dataType === "node" ? params.data.name : dataType === "edge" ? params.data.target : "";

        const selectedItem = dimensions
          .map((dim) => data.find((item) => item[dim.key]?.label === label))
          .find(Boolean);

        const linkedAnalysis = props["dataBindings"].getDataBinding("dataBinding").getLinkedAnalysis();

        if (selectedItem) {
          const dimensionForSelection = dimensions.find((dim) =>
          selectedItem[dim.key]?.label === label
        );
        
        if (dimensionForSelection) {
          const selection = {
            [dimensionForSelection.id]: selectedItem[dimensionForSelection.key].id,
          };
          linkedAnalysis.setFilters(selection);
        }      

          // Speichern des selektierten Knotens
          this.selectedNode = label;

          // Blass-Darstellung bleibt aktiviert, nur Selektion hervorheben
          this.applyFocusEffect(nodes, links, label);
        }
      });
    }

    applyFocusEffect(nodes, links, selectedLabel) {
      const updatedNodes = nodes.map((node) => ({
        ...node,
        itemStyle: {
          opacity: node.name === selectedLabel ? 1 : 0.3, // Selektierter Knoten bleibt sichtbar
        },
      }));

      const updatedLinks = links.map((link) => ({
        ...link,
        lineStyle: {
          opacity: link.source === selectedLabel || link.target === selectedLabel ? 1 : 0.1,
        },
      }));

      this._echart.setOption({
        series: [
          {
            data: updatedNodes,
            links: updatedLinks,
          },
        ],
      });
    }

    resetFocusEffect(nodes, links, levels) {
      const updatedNodes = nodes.map((node) => ({
        ...node,
        itemStyle: { opacity: 1 }, // Alle Knoten vollständig sichtbar
      }));

      this._echart.setOption({
        series: [
          {
            data: updatedNodes,
            links: links,
            levels: levels, // Levels wiederverwenden
          },
        ],
      });
    }

    dispose() {
      if (this._echart) {
        echarts.dispose(this._echart);
      }
    }

    parseMetadata(metadata) {
      const mapToArray = (map) => Object.keys(map).map((key) => ({ key, ...map[key] }));
      return {
        dimensions: mapToArray(metadata.dimensions),
        measures: mapToArray(metadata.mainStructureMembers),
      };
    }
  }

  class Main extends HTMLElement {
    constructor() {
      super();
      this._shadowRoot = this.attachShadow({ mode: "open" });
      this._shadowRoot.innerHTML = `<div id="root" style="width: 100%; height: 100%;"></div>`;
      this._root = this._shadowRoot.getElementById("root");
      this._props = {};
      this._renderer = new Renderer(this._root);
    }

    onCustomWidgetBeforeUpdate(changedProps) {
      this._props = { ...this._props, ...changedProps };
    }

    onCustomWidgetAfterUpdate() {
      this.render();
    }

    onCustomWidgetResize() {
      this.render();
    }

    onCustomWidgetDestroy() {
      this.dispose();
    }

    render() {
      this._renderer.render(this.dataBinding, this._props);
    }

    dispose() {
      this._renderer.dispose();
    }
  }

  customElements.define("com-sap-sac-sample-echarts-sankey3", Main);
})();
