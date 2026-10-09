(function() {
  const sceneWidth = 1600;
  const sceneHeight = 1200;

  // fixed textarea priority: ~
  const tfmPriorityList = [ '?', '_', '+', '$', '%', '=', '#', '!', 'ta', ':', '~', '&' ];

  // Setup stage
  const stage = new Konva.Stage({
    container: 'scene',
    width: sceneWidth,
    height: sceneHeight,
  });

  // Create default layers
  const luaLayer = new Konva.Layer({ draggable: false });
  const toolLayer = new Konva.Layer({ draggable: false });
  const gameuiLayer = new Konva.Layer({ draggable: false });

  stage.add(luaLayer);
  stage.add(toolLayer);
  stage.add(gameuiLayer);

  function sortLuaLayer() {
    const children = luaLayer.getChildren();

    children
      .sort((a, b) => {
        const pa = a.getAttr("tfmPriority") || -1;
        const pb = b.getAttr("tfmPriority") || -1;
        if (pa !== pb) {
          return pa - pb;
        }
        return (a.getAttr("editorOrder") || 0) - (b.getAttr("editorOrder") || 0);
      })
      .map((x, i) => x.zIndex(i));
    luaLayer.draw();
  }

  // Setup transformers
  function boundBoxFunc(oldBox, newBox) {
    if (newBox.width < 8 || newBox.height < 8) {
      return oldBox;
    }

    return newBox;
  }

  const taTransformer = new Konva.Transformer({
    nodes: [],
    ignoreStroke: true,
    rotateEnabled: false,
    padding: 10,
    boundBoxFunc,
  });

  const imgTransformer = new Konva.Transformer({
    nodes: [],
    ignoreStroke: true,
    rotateEnabled: true,
    padding: 10,
    boundBoxFunc,
  });

  const multiTransformer = new Konva.Transformer({
    nodes: [],
    ignoreStroke: true,
    rotateEnabled: true,
    keepRatio: true,
    padding: 10,
    boundBoxFunc,
  });

  toolLayer.add(taTransformer);
  toolLayer.add(imgTransformer);
  toolLayer.add(multiTransformer);

  function detachTransformers() {
    taTransformer.nodes().map(elm => elm.draggable(false));
    imgTransformer.nodes().map(elm => elm.draggable(false));
    multiTransformer.nodes().map(elm => elm.draggable(false));
    taTransformer.detach();
    imgTransformer.detach();
    multiTransformer.detach();
    toolLayer.draw();
  }

  function isTextAreaNode(node) {
    return node.getClassName() === 'Group';
  }

  function getNodeEntry(type, id) {
    if (type === 'textarea') {
      const list = controls.get('textarea_' + id);
      return list ? { node: list[3], type } : null;
    }
    if (type === 'image') {
      const list = controls.get('image_' + id);
      return list ? { node: list[0], type } : null;
    }
    return null;
  }

  function setNodeEditorState(type, id, { locked, hidden }) {
    const entry = getNodeEntry(type, id);
    if (!entry) {
      return;
    }

    const { node } = entry;

    if (locked != null) {
      node.setAttr('editorLocked', locked);
      if (locked) {
        node.draggable(false);
      }
    }

    if (hidden != null) {
      node.setAttr('editorHidden', hidden);
      node.visible(!hidden);
      node.listening(!hidden && !node.getAttr('editorLocked'));
    }

    if (!hidden && !node.getAttr('editorLocked')) {
      node.listening(true);
    }

    luaLayer.draw();
  }

  function attachSelection(nodes) {
    detachTransformers();

    if (!nodes.length) {
      return;
    }

    const unlocked = nodes.filter(n => !n.getAttr('editorLocked') && !n.getAttr('editorHidden'));

    if (!unlocked.length) {
      return;
    }

    if (unlocked.length === 1) {
      const node = unlocked[0];
      node.draggable(true);
      if (isTextAreaNode(node)) {
        taTransformer.nodes([ node ]);
      } else {
        imgTransformer.nodes([ node ]);
      }
    } else {
      const allImages = unlocked.every(n => !isTextAreaNode(n));
      multiTransformer.rotateEnabled(allImages);
      multiTransformer.keepRatio(true);
      unlocked.forEach(n => n.draggable(true));
      multiTransformer.nodes(unlocked);
    }

    toolLayer.draw();
  }

  stage.on('click', function(evt) {
    if (evt.target == stage || evt.target == innerBorder) {
      detachTransformers();
    }
  });

  // Setup game ui
  const innerBorder = new Konva.Rect({
    x: 0,
    y: 0,
    width: 800,
    height: 400,
    stroke: '#0ba4d6',
    strokeWidth: 1,
  });
  const gameuiTop = new Konva.Rect({
    x: 0,
    y: 0,
    width: 800,
    height: 21,
    listening: false,
    cornerRadius: 6,
    fill: '#324650',
    shadowEnabled: true,
    shadowOffsetY: 1,
    shadowBlur: 1,
    shadowColor: '#000000',
  });
  const gameuiBottom = new Konva.Rect({
    x: 0,
    y: 400,
    width: 800,
    height: 198,
    cornerRadius: 6,
    fill: '#324650',
    shadowEnabled: true,
    shadowOffsetX: 1,
    shadowBlur: 1,
    shadowColor: '#000000',
  });
  let gameuiBarText;

  luaLayer.add(innerBorder);
  gameuiLayer.add(gameuiTop);
  gameuiLayer.add(gameuiBottom);

  function toggleGameUI() {
    if (gameuiLayer.isVisible()) {
      gameuiLayer.hide();
    } else {
      gameuiLayer.show();
    }
  }

  function updateBarText(textHTML) {
    if (gameuiBarText) {
      gameuiBarText.destroy();
    }

    gameuiBarText = renderHTML({
      html: textHTML
    });
    gameuiBarText.setAttrs({
      x: 10,
      y: 5,
      listening: false,
    });
    gameuiLayer.add(gameuiBarText);
  }

  // Scaling
  function centerLayer() {
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    const offX = -(containerWidth / 2) / stage.scaleX() + 800 / 2;
    const offY = -(containerHeight / 2)  / stage.scaleY() + 600 / 2;

    luaLayer.offsetX(offX);
    luaLayer.offsetY(offY);
    luaLayer.draw();

    toolLayer.offsetX(offX);
    toolLayer.offsetY(offY);
    toolLayer.draw();

    gameuiLayer.offsetX(offX);
    gameuiLayer.offsetY(offY);
    gameuiLayer.draw();
  }

  function rescaleStage() {
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;

    stage.width(containerWidth);
    stage.height(containerHeight);

    centerLayer();
  }

  rescaleStage();
  window.addEventListener('resize', rescaleStage);

  // EventEmitter
  const EventEmitter = (function() {
    const callbackMapping = {};
    const emitter = {};

    emitter.on = function(type, callback) {
      if (!callbackMapping[type]) {
        callbackMapping[type] = [];
      }

      callbackMapping[type].push(callback);

      return emitter;
    }

    emitter.off = function(type, callback) {
      if (!callbackMapping[type]) {
        return emitter;
      }

      const index = callbackMapping[type].indexOf(callback);

      if (index != -1) {
        callbackMapping[type].splice(index, 1);
      }

      return emitter;
    }

    emitter.emit = function(type, ...params) {
      if (!callbackMapping[type]) {
        return emitter;
      }

      for (let i=0; i<callbackMapping[type].length; i++) {
        callbackMapping[type][i](...params);
      }

      return emitter;
    }

    return emitter;
  });

  // Controls API
  const controls = (function() {
    const elements = {};

    function add(id, elementList) {
      if (typeof(id) != 'string') {
        throw Error("Control id must be a string.");
      }

      if (!Array.isArray(elementList)) {
        throw Error("Control elementList must be an array.");
      }

      remove(id);
      elements[id] = elementList;
    }

    function remove(id) {
      const elementList = elements[id];

      if (!elementList) {
        return;
      }

      for (let i = 0; i < elementList.length; i ++) {
        if (elementList[i].destroy) {
          elementList[i].destroy();
        }
      }

      delete elements[id];
    }

    function get(id) {
      return elements[id];
    }

    function addButton({ id, x, y, width, text, disabled }) {
      const button = new Konva.Label({
        x, y,
        width,
      });
      const textelm = new Konva.Text({
        text,
        width,
        fontFamily: 'Verdana',
        fontSize: 12,
        padding: 5,
        fill: disabled ? '#828CA5' : '#b0b8ca',
        align: "center",
        verticalAlign: "middle",
      });
      const tag = new Konva.Tag({
        cornerRadius: 5,
        fill: '#3c5064',
        lineJoin: 'round',
        shadowColor: 'black',
        shadowBlur: 1,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowOpacity: 1
      });

      add(id, [ tag, textelm, button ]);

      button.add(tag);
      button.add(textelm);
      gameuiLayer.add(button);

      const emitter = EventEmitter();

      if (!disabled) {
        button.on('mouseover', function () {
          document.body.style.cursor = 'pointer';
          textelm.fill('#032346');
        });
        button.on('mouseout', function () {
          document.body.style.cursor = 'default';
          textelm.fill('#b0b8ca');
        });
        button.on('mousedown', function () {
          textelm.move({ y: 1 });
        });
        button.on('mouseup', function () {
          textelm.move({ y: -1 });
        });
        button.on('click', () => {
          emitter.emit('click', id, text);
        });
      }

      return emitter;
    }

    function addSeparator({ id, x, y, height }) {
      const line = new Konva.Line({
        points: [x, y, x, y + height],
        stroke: '#212f36',
        strokeWidth: 1,
      });
      const line2 = new Konva.Line({
        points: [x + 2, y, x + 2, y + height],
        stroke: '#5b7f92',
        strokeWidth: 1,
      });

      add(id, [ line, line2 ]);

      gameuiLayer.add(line);
      gameuiLayer.add(line2);
    }

    function addTextEdit({ id, x, y, disabled, width, height, label, text }) {
      text = text != null ? text : '';

      const textName = new Konva.Text({
        x: x,
        y: y,
        text: label + ' : ',
        listening: false,
        fontFamily: 'Verdana',
        fontSize: 12,
        fill: '#C2C2DA',
      });
      const textValue = new Konva.Text({
        x: x + textName.width(),
        y: y,
        text: text,
        height: height == null ? 12 : height,
        listening: true,
        fontFamily: 'Verdana',
        fontSize: 12,
        fill: disabled ? '#828CA5' : '#009D9D',
      });
      textValue.width(Math.max(30, Math.min(textValue.width(), width)));

      add(id, [ textName, textValue ]);

      gameuiLayer.add(textName);
      gameuiLayer.add(textValue);

      const emitter = EventEmitter();

      textValue.on('click', () => {
        emitter.emit('click', id, text, textValue);
      });

      return emitter;
    }

    function updateTextEdit({ id, text, width }) {
      const list = get(id);

      if (!list) {
        return;
      }

      const [ textName, textValue ] = list;

      textValue.width(null);
      textValue.text(text.toString());
      textValue.width(Math.max(30, Math.min(textValue.width(), width || 180)));
    }

    return {
      get,
      add,
      remove,
      addButton,
      addSeparator,
      addTextEdit,
      updateTextEdit,
    };
  })();

  // Lua API
  const lua = (function() {
    function removeTextArea(id, target) {
      id = parseInt(id) || 0;

      detachTransformers();
      controls.remove('textarea_' + id);
    }

    function addTextArea(id, text, target, x, y, width, height, bg, br, alpha, fixed) {
      if (typeof(text) != "string" || text.length > 2000) {
        return false;
      }

      if (id == null || text == null || text === false) {
        return false;
      }

      x = x == null ? 50 : x;
      y = y == null ? 50 : y;
      x = ((parseInt(x) || 0) % 65536);
      y = ((parseInt(y) || 0) % 65536);
      width = parseInt(width);
      height = parseInt(height);
      if (isNaN(width)) width = null;
      if (isNaN(height)) height = null;
      bg = parseInt(bg) || 0;
      br = parseInt(br) || 0;

      const prev = controls.get('textarea_' + id);

      if (prev) {
        const [ border, textarea, textfield, group, emitter ] = prev;

        group.setAttrs({
          x,
          y,
        });
        textarea.setAttrs({
          opacity: (bg || br) ? alpha : 0,
          fill: bg == 0 ? '#324650' : decimalToHexString(bg),
        });
        border.setAttrs({
          opacity: (bg || br) ? alpha : 0,
          stroke: br == 0 ? '#000000' : decimalToHexString(br),
        });

        if (textfield.getAttr('text') != text) {
          textfield.setAttrs({
            text,
          });
        }

        setSize(group, textarea, border, textfield, width, height);

        group.setAttrs({
          tfmPriority: fixed ? tfmPriorityList.indexOf('~') : tfmPriorityList.indexOf('ta'),
        });
        setSize(group, textarea, border, textfield, width, height);
        sortLuaLayer();
        return emitter;
      }

      const group = new Konva.Group({
        x,
        y,
      });

      const textarea = new Konva.Rect({
        x: -4,
        y: -3,
        cornerRadius: 5,
        fill: bg == 0 ? '#324650' : decimalToHexString(bg),
        opacity: (bg || br) ? alpha : 0,
      });

      const border = new Konva.Rect({
        x: -4,
        y: -3,
        cornerRadius: 5,
        listening: false,
        strokeEnabled: true,
        stroke: br == 0 ? '#000000' : decimalToHexString(br),
        strokeWidth: 2,
        strokeScaleEnabled: false,
      });

      const textfield = new Konva.Text({
        text,
        x: 2,
        y: 5,
        fontSize: 11,
        fontFamily: 'Verdana',
        fill: '#C2C2DA',
      });

      const emitter = EventEmitter();

      controls.add('textarea_' + id, [ border, textarea, textfield, group, emitter ]);

      group.setAttrs({
        tfmPriority: fixed ? tfmPriorityList.indexOf('~') : tfmPriorityList.indexOf('ta'),
      });
      group.add(textarea);
      group.add(border);
      group.add(textfield);
      luaLayer.add(group);
      sortLuaLayer();
      setSize(group, textarea, border, textfield, width, height);

      function setSize(group, textarea, border, textfield, width, height) {
        if (width != null && height != null) {
          width = Math.max(width, 1);
          height = Math.max(height, 1);

          textfield.setAttrs({
            width,
            height,
          });
        }
        else if (width) {
          textfield.setAttrs({
            width,
            height: 'auto',
          });
        }
        else {
          textfield.setAttrs({
            width: 'auto',
            height: 'auto',
          });
        }

        group.setAttrs({
          width: textfield.width(),
          height: textfield.height(),
          scaleX: 1,
          scaleY: 1,
        });
        textarea.setAttrs({
          width: textfield.width() + 8,
          height: textfield.height() + 8,
        });
        border.setAttrs({
          width: textfield.width() + 8,
          height: textfield.height() + 8,
        });
      }

      group.on('transform', () => {
        setSize(group, textarea, border, textfield, group.width() * group.scaleX(), group.height() * group.scaleY());
        emitter.emit(
          'update', id,
          Math.floor(group.x()), Math.floor(group.y()),
          Math.floor(textfield.width()), Math.floor(textfield.height())
        );
      });
      group.on('dragmove', () => {
        emitter.emit(
          'move', id,
          Math.floor(group.x()), Math.floor(group.y())
        );
      });
      group.on('click', (evt) => {
        if (group.getAttr('editorHidden') || group.getAttr('editorLocked')) {
          return;
        }
        emitter.emit('click', id, evt);
      });

      return emitter;
    }

    function removeImage(id, targetPlayer) {
      id = parseInt(id) || 0;

      detachTransformers();
      controls.remove('image_' + id);
    }

    function addImage(_id, imageId, target, x, y, targetPlayer, scaleX, scaleY, rotation, alpha, anchorX, anchorY, fadeIn) {
      if (_id == null) {
        return false;
      }

      if (typeof(imageId) != 'string') {
        return false;
      }

      if (typeof(target) != 'string') {
        return false;
      }

      let imageURL;

      if (imageId.startsWith('http') || imageId.startsWith('data:')) {
        imageURL = imageId;
      }
      else if (imageId.length == 15) {
        imageURL = `http://images.atelier801.com/${imageId}`;
      }
      else {
        imageURL = `https://i.imgur.com/${imageId}`;
      }

      x = x || 0;
      y = y || 0;
      scaleX = scaleX == null ? 1 : scaleX;
      scaleY = scaleY == null ? 1 : scaleY;
      rotation = ((rotation || 0) / Math.PI * 180).toFixed(2); // convert to degrees
      alpha = alpha == null ? 1 : alpha;
      anchorX = anchorX || 0;
      anchorY = anchorY || 0;
      fadeIn = Boolean(fadeIn);

      const prev = controls.get('image_' + _id);

      if (prev) {
        const [ image, emitter ] = prev;
        const imageObj = image.image();

        imageObj.anchorX = anchorX;
        imageObj.anchorY = anchorY;
        image.setAttrs({
          x,
          y,
          scaleX,
          scaleY,
          rotation,
          opacity: alpha,
          tfmPriority: target.length ? tfmPriorityList.indexOf(target[0]) : -1,
        });
        sortLuaLayer();

        if (imageObj) {
          imageObj.src = imageURL;
        }

        return emitter;
      }

      const image = new Konva.Image({
        x,
        y,
        scaleX,
        scaleY,
        rotation,
        opacity: alpha,
        tfmPriority: target.length ? tfmPriorityList.indexOf(target[0]) : -1,
      });
      luaLayer.add(image);
      sortLuaLayer();

      const emitter = EventEmitter();
      let imageObj = new Image();
      let skipLoad;

      controls.add('image_' + _id, [ image, emitter ]);

      image.on('transform', () => {
        const scaleX = image.scaleX().toFixed(2);
        const scaleY = image.scaleY().toFixed(2);
        const rotation = image.rotation().toFixed(2);

        image.setAttrs({
          scaleX,
          scaleY,
          rotation,
        });
        emitter.emit(
          'update', _id,
          Math.floor(image.x()), Math.floor(image.y()),
          scaleX, scaleY,
          rotation
        );
      });
      image.on('dragmove', () => {
        emitter.emit(
          'move', _id,
          Math.floor(image.x()), Math.floor(image.y())
        );
      });
      image.on('click', (evt) => {
        if (image.getAttr('editorHidden') || image.getAttr('editorLocked')) {
          return;
        }
        emitter.emit('click', _id, evt);
      });

      imageObj.onload = function() {
        image.image(imageObj);
        image.setAttrs({
          offsetX: imageObj.anchorX * image.width(),
          offsetY: imageObj.anchorY * image.height(),
        });

        if (!skipLoad) {
          emitter.emit('load', _id, imageObj.src);
        } else {
          skipLoad = false;
        }
      }

      imageObj.onerror = function() {
        emitter.emit('loadfail', _id, imageObj.src);

        if (skipLoad) {
          skipLoad = false;
          imageObj.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAAJCAIAAAAU11OLAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACGSURBVDhPzZRRCsAgDEPdzuXt3b22sJQSM5R99n1IkioEBY8xRqsGOt0CLVbCkKj9al2TDEmGqYFpcLLZ9UJt2EitamWVA+S999S5jZqj6FSK6ISCWd/Yj0LN+id2HPDaprcDtMoqB5qv9myw44AtC7+dwZsMM6Mj1YrlaiHyejRX6v1PrT273tlK9q+v2gAAAABJRU5ErkJggg==';
          return;
        }

        skipLoad = true;
        imageObj.src = imageObj.prevSrc;
      }

      imageObj.anchorX = anchorX;
      imageObj.anchorY = anchorY;
      imageObj.prevSrc = imageURL;
      imageObj.src = imageURL;

      return emitter;
    }

    return {
      addTextArea,
      removeTextArea,
      addImage,
      removeImage,
    };
  })();

  // In-place edit APIs
  const inplace = (function() {
    const overlay = document.getElementById('inplace-overlay');
    let onClose = null;

    function close() {
      if (onClose) {
        onClose();
        onClose = null;
      }
      if (overlay) {
        overlay.innerHTML = '';
      }
    }

    function konvaToScreen(konvaNode) {
      const stageRef = konvaNode.getStage();
      const pos = konvaNode.getAbsolutePosition();
      const container = stageRef.container().getBoundingClientRect();
      return {
        left: container.left + pos.x,
        top: container.top + pos.y,
        width: Math.max(konvaNode.width() || 0, 30),
        height: Math.max(konvaNode.height() || 12, 14),
      };
    }

    function positionElement(el, konvaNode, extraWidth) {
      const rect = konvaToScreen(konvaNode);
      el.style.left = rect.left + 'px';
      el.style.top = rect.top + 'px';
      if (extraWidth) {
        el.style.minWidth = Math.max(rect.width, extraWidth) + 'px';
      }
    }

    function bindDismiss(input) {
      const dismiss = (evt) => {
        if (evt.target.closest('#inplace-overlay')) {
          return;
        }
        close();
        document.removeEventListener('mousedown', dismiss);
      };
      setTimeout(() => document.addEventListener('mousedown', dismiss), 0);
      input.addEventListener('keydown', (evt) => {
        if (evt.key === 'Escape') {
          close();
          document.removeEventListener('mousedown', dismiss);
        } else if (evt.key === 'Enter') {
          input.blur();
        }
      });
    }

    function showField({ konvaNode, value, type, min, max, step, live, onChange, onDone }) {
      close();
      if (!overlay || !konvaNode) {
        return;
      }

      const input = document.createElement('input');
      input.className = 'inplace-input';
      input.type = type || 'text';
      if (min != null) input.min = min;
      if (max != null) input.max = max;
      if (step != null) input.step = step;
      input.value = value != null ? value : '';

      overlay.appendChild(input);
      positionElement(input, konvaNode);
      input.focus();
      input.select();

      const commit = () => {
        if (onDone) {
          onDone(input.value);
        }
        close();
      };

      if (live) {
        input.addEventListener('input', () => onChange && onChange(input.value));
      }
      input.addEventListener('change', commit);
      input.addEventListener('blur', commit);
      bindDismiss(input);
    }

    function parseColorValue(val) {
      val = val.trim();
      if (val.startsWith('#')) {
        return parseInt(val.slice(1), 16);
      }
      if (val.startsWith('0x') || val.startsWith('0X')) {
        return parseInt(val.slice(2), 16);
      }
      return parseInt(val, 10);
    }

    function colorToHex(num) {
      if (num < 0) {
        num = 0xFFFFFFFF + num + 1;
      }
      return '#' + num.toString(16).padStart(6, '0');
    }

    function showColor({ konvaNode, value, onChange, onDone }) {
      close();
      if (!overlay || !konvaNode) {
        return;
      }

      const panel = document.createElement('div');
      panel.className = 'inplace-panel';

      const hexInput = document.createElement('input');
      hexInput.className = 'inplace-input';
      hexInput.type = 'text';
      hexInput.value = colorToHex(value);
      hexInput.style.position = 'static';
      hexInput.style.minWidth = '5.5em';

      const intInput = document.createElement('input');
      intInput.className = 'inplace-input';
      intInput.type = 'text';
      intInput.value = value;
      intInput.style.position = 'static';
      intInput.style.minWidth = '4em';

      const picker = document.createElement('input');
      picker.type = 'color';
      picker.value = colorToHex(value);

      panel.appendChild(hexInput);
      panel.appendChild(intInput);
      panel.appendChild(picker);
      overlay.appendChild(panel);

      const rect = konvaToScreen(konvaNode);
      panel.style.left = rect.left + 'px';
      panel.style.top = rect.top + 'px';

      // Sync the other inputs but never rewrite the one being typed in.
      const apply = (num, source) => {
        if (isNaN(num)) {
          return;
        }
        if (source !== hexInput) hexInput.value = colorToHex(num);
        if (source !== intInput) intInput.value = num;
        if (source !== picker && num >= 0 && num <= 0xFFFFFF) picker.value = colorToHex(num);
        onChange && onChange(num);
      };

      hexInput.addEventListener('input', () => apply(parseColorValue(hexInput.value), hexInput));
      intInput.addEventListener('input', () => apply(parseInt(intInput.value, 10), intInput));
      picker.addEventListener('input', () => apply(parseColorValue(picker.value), picker));

      const finish = () => {
        const num = parseColorValue(hexInput.value);
        if (!isNaN(num) && onDone) {
          onDone(num);
        }
        close();
      };

      [hexInput, intInput].forEach(input => input.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter') finish();
      }));
      hexInput.focus();
      hexInput.select();
      bindDismiss(hexInput);
    }

    return { showField, showColor, close, konvaToScreen };
  })();

  const editText = (function() {
    function editFunc(options) {
      if (!options) {
        inplace.close();
        return;
      }

      const { konvaNode, name, type, min, max, step, value, callback, waitChange } = options;

      inplace.showField({
        konvaNode,
        value,
        type,
        min,
        max,
        step,
        live: !waitChange,
        onChange: callback,
        onDone: callback,
      });
    }

    return editFunc;
  })();

  const editHTML = (function() {
    const valueElement = document.getElementById('input');
    let callbackFunc;

    valueElement.addEventListener("input", function() {
      if (callbackFunc) {
        callbackFunc(valueElement.value);
      }
    });

    function editFunc(options) {
      if (options) {
        const { value, callback } = options;

        callbackFunc = callback;
        valueElement.value = value != null ? value : '';
        document.querySelector('.ui-editor-text').style.display = "flex";
        valueElement.focus();
      } else {
        callbackFunc = null;
        document.querySelector('.ui-editor-text').style.display = null;
      }
    }

    return editFunc;
  })();


  // Stage Event Emitter
  const stageEmitter = EventEmitter();
  const stageContainer = stage.container();

  stage.on('click', function(evt) {
    if (evt.target == stage || evt.target == innerBorder) {
      stageEmitter.emit('click');
    }
  });

  stageContainer.tabIndex = 1;
  stageContainer.addEventListener('keydown', function (event) {
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      stageEmitter.emit('key', 'selectAll');
      event.preventDefault();
      return;
    }

    if (event.keyCode === 37) {
      stageEmitter.emit('key', 'left');
    } else if (event.keyCode === 38) {
      stageEmitter.emit('key', 'up');
    } else if (event.keyCode === 39) {
      stageEmitter.emit('key', 'right');
    } else if (event.keyCode === 40) {
      stageEmitter.emit('key', 'down');
    } else if (event.keyCode === 46) {
      stageEmitter.emit('key', 'delete');
    } else {
      return;
    }

    event.preventDefault();
  });

  // Expose APIs
  window.editorAPI = {
    controls,
    lua,
    edit: editText,
    editHTML,
    inplace,
    selection: {
      attach: attachSelection,
      detach: detachTransformers,
      getNode: getNodeEntry,
      setState: setNodeEditorState,
    },
    gameUI: {
      toggle: toggleGameUI,
      updateHeader: updateBarText,
    },
    stage: stageEmitter,
    sortLuaLayer,
  };

  // Helper Functions
  function decimalToHexString(number) {
    if (number < 0) {
      number = 0xFFFFFFFF + number + 1;
    }

    return '#' + number.toString(16).padStart(6, '0').toUpperCase();
  }
})();
