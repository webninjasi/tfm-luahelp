(function() {
  const styles = {
    A: {
      fill: "#C2C2DA",
    },
    "A:hover": {
      fill: "#2ECF73",
    },
    "A:active": {
      fill: "#E9E654",
    },
    BL: {
      fill: "#6C77C1",
    },
    BV: {
      fill: "#2F7FCC",
    },
    CE: {
      fill: "#E88F4F",
    },
    CEP: {
      fill: "#F0A78E",
    },
    CH: {
      fill: "#98E2EB",
    },
    CS: {
      fill: "#EFCE8F",
    },
    G: {
      fill: "#60608F",
    },
    J: {
      fill: "#BABD2F",
    },
    N: {
      fill: "#C2C2DA",
    },
    N2: {
      fill: "#9292AA",
    },
    PT: {
      fill: "#2EBA7E",
    },
    PS: {
      fill: "#F1C4F6",
    },
    R: {
      fill: "#CB546B",
    },
    ROSE: {
      fill: "#ED67EA",
    },
    S: {
      fill: "#CAA4CF",
    },
    T: {
      fill: "#A4CF9E",
    },
    TD: {
      align: "right",
    },
    TG: {
      align: "left",
    },
    TI: {
      fontSize: 14,
    },
    V: {
      fill: "#009D9D",
    },
    VP: {
      fill: "#2ECF73",
    },
    VI: {
      fill: "#C53DFF",
    },
    D: {
      fill: "#FFD991",
    },
    O: {
      fill: "#F79337",
    },
    CH2: {
      fill: "#FEB1FC",
    },
    FC: {
      fill: "#FF8547",
    },
    CL: {
      fontSize: 11,
    }
  };

  function parseHTML(html) {
    const parser = new DOMParser();
    return parser.parseFromString(html, "text/html");
  }

  function traverse(parent, parentNode) {
    return Array.from(parentNode.childNodes).map(node => {
      if (node.nodeName == '#text') {
        return new Konva.Text({
          text: node.nodeValue,
          align: parent.getAttr("align"),
          fontSize: parent.getAttr("fontSize"),
          fontFamily: parent.getAttr("fontFamily"),
          fill: parent.getAttr("fill"),
        });
      }

      const style = styles[node.nodeName];
      const align = node.nodeName == 'p' && node.getAttribute('align');
      const fill = node.nodeName == 'FONT' && node.getAttribute('color');
      const fontSize = node.nodeName == 'FONT' && node.getAttribute('size');
      const fontFamily = node.nodeName == 'FONT' && node.getAttribute('face');
      const group = new Konva.Group({
        align: align || style && style.align || parent.getAttr("align"),
        fontSize: fontSize || style && style.fontSize || parent.getAttr("fontSize"),
        fontFamily: fontFamily || style && style.fontFamily || parent.getAttr("fontFamily"),
        fill: fill || style && style.fill || parent.getAttr("fill"),
      });
      const children = traverse(group, node);

      children.map((elm, i) => {
        elm.x(children[i-1] ? children[i-1].width() : 0);
        group.add(elm);
      });

      return group;
    });
  }

  function renderHTML({ width, height, html }) {
    const tree = parseHTML(html);
    const group = new Konva.Group({
      width,
      height,
      fontSize: 11,
      fontFamily: 'Verdana',
      fill: '#C2C2DA',
    });
    const children = traverse(group, tree.body);

    children.map((elm, i) => {
      elm.x(children[i-1] ? children[i-1].width() : 0);
      group.add(elm);
    });
    console.log("renderHTML", tree);

    return group;
  }

  window.renderHTML = renderHTML;
})();
