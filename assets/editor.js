(function() {
  const id = selector => document.getElementById(selector);
  const escapeLuaString = (str) => str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t');

  String.prototype.escape = function() {
    var tagsToReplace = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;'
    };
    return this.replace(/[&<>]/g, function(tag) {
      return tagsToReplace[tag] || tag;
    });
  };

  // Lua-style number handling: fields keep the raw text the user typed,
  // rendering uses the parsed number (or a default when it can't be parsed).
  const LUA_DEC = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;
  const LUA_HEX = /^([-+]?)0[xX]([0-9a-fA-F]+)$/;

  function toNum(v, def) {
    if (typeof v === 'number') return isFinite(v) ? v : def;
    if (typeof v !== 'string') return def;
    const t = v.trim();
    let m = LUA_HEX.exec(t);
    if (m) return (m[1] === '-' ? -1 : 1) * parseInt(m[2], 16);
    if (LUA_DEC.test(t)) return parseFloat(t);
    return def;
  }

  function fmtLua(v) {
    if (typeof v === 'string') {
      const t = v.trim();
      return t === '' ? 'nil' : t;
    }
    return v == null ? 'nil' : v;
  }

  const textareas = { _lastId: 0 };
  const images = { _lastId: 0 };
  const objectOrder = [];

  let lastTACount;
  let lastImgCount;

  const selection = new Set();
  let scaleLinked = true;
  let anchorLinked = true;
  let lastShiftAnchor = null;

  window.toggleGameUI = editorAPI.gameUI.toggle;
  window.copyText = (elm) => {
    elm.select();
    document.execCommand('copy');
  };
  window.toggleCode = () => {
    const code = document.querySelector('.ui-editor-code');
    if (!code.style.display) {
      code.style.display = 'block';
    } else {
      code.style.display = null;
    }
  };

  function objectKey(type, objId) {
    return type + ':' + objId;
  }

  function parseKey(key) {
    const idx = key.indexOf(':');
    return { type: key.slice(0, idx), id: parseInt(key.slice(idx + 1), 10) };
  }

  function getObject(type, objId) {
    if (type === 'textarea') return textareas[objId];
    if (type === 'image') return images[objId];
    return null;
  }

  function objectLabel(type, obj) {
    if (type === 'textarea') {
      return 'TA #' + obj.id + ' "' + (obj.text || '').slice(0, 20) + '"';
    }
    const name = obj.imageId.startsWith('data:') ? (obj.fileName || 'uploaded') : obj.imageId;
    return 'Img #' + obj._id + ' ' + name;
  }

  function ensureDefaults(obj, type) {
    if (obj.locked == null) obj.locked = false;
    if (obj.hidden == null) obj.hidden = false;
    if (obj.editorOrder == null) {
      obj.editorOrder = objectOrder.length;
    }
  }

  function registerObject(type, obj) {
    ensureDefaults(obj, type);
    const key = objectKey(type, type === 'textarea' ? obj.id : obj._id);
    if (!objectOrder.includes(key)) {
      objectOrder.push(key);
    }
    applyObjectState(type, type === 'textarea' ? obj.id : obj._id);
    syncEditorOrder();
  }

  function addObject(type, obj, select) {
    if (type === 'textarea') {
      const emitter = updateTextArea(obj);
      registerObject('textarea', obj);
      emitter.on('click', (objId, evt) => handleObjectClick('textarea', objId, evt))
        .on('move', onMoveTextArea)
        .on('update', onUpdateTextArea);
      if (select !== false) {
        setSelection([objectKey('textarea', obj.id)]);
        refreshSidebar();
      }
      return emitter;
    }

    const emitter = updateImage(obj);
    registerObject('image', obj);
    emitter.on('click', (_id, evt) => handleObjectClick('image', _id, evt))
      .on('move', onMoveImage)
      .on('update', onUpdateImage)
      .on('load', () => errorSet(''))
      .on('loadfail', (_id, url) => errorSet(`Failed to load image for ${_id}: ${url.escape()}`));
    if (select !== false) {
      setSelection([objectKey('image', obj._id)]);
      refreshSidebar();
    }
    return emitter;
  }

  function applyObjectState(type, objId) {
    const obj = getObject(type, objId);
    if (!obj) return;
    editorAPI.selection.setState(type, objId, {
      locked: obj.locked,
      hidden: obj.hidden,
    });
  }

  function syncEditorOrder() {
    objectOrder.forEach((key, index) => {
      const { type, id } = parseKey(key);
      const obj = getObject(type, id);
      if (obj) {
        obj.editorOrder = index;
        const entry = editorAPI.selection.getNode(type, id);
        if (entry) {
          entry.node.setAttr('editorOrder', index);
        }
      }
    });
    editorAPI.sortLuaLayer();
  }

  function errorSet(err) {
    if (err.stack) {
      id('error').innerHTML = err.stack;
      console.error(err.stack);
    } else {
      id('error').innerHTML = err;
    }
  }

  function updateOutput() {
    const output = id('output');
    const lines = [];
    let obj;
    let taCount = 0;
    let imgCount = 0;

    objectOrder.forEach(key => {
      const { type, id: objId } = parseKey(key);
      obj = getObject(type, objId);
      if (!obj) return;

      if (type === 'textarea') {
        taCount++;
        lines.push(`ui.addTextArea(${obj.id}, "${escapeLuaString(obj.text)}", targetPlayer, ${fmtLua(obj.x)}, ${fmtLua(obj.y)}, ${fmtLua(obj.width)}, ${fmtLua(obj.height)}, ${decimalToHex(obj.bg)}, ${decimalToHex(obj.br)}, ${fmtLua(obj.alpha)}, ${obj.fixed})`);
        return;
      }

      imgCount++;
      let idStr = obj.imageId;
      if (idStr.startsWith('data:')) {
        idStr = obj.fileName ? `<uploaded_${obj.fileName}>` : `<uploaded_${obj._id}>`;
      }
      let rot = toNum(obj.rotation, null);
      rot = rot == null ? fmtLua(obj.rotation) : (rot / 180 * Math.PI).toFixed(2);
      lines.push(`tfm.exec.addImage("${escapeLuaString(idStr)}", "${escapeLuaString(obj.target)}", ${fmtLua(obj.x)}, ${fmtLua(obj.y)}, targetPlayer, ${fmtLua(obj.scaleX)}, ${fmtLua(obj.scaleY)}, ${rot}, ${fmtLua(obj.alpha)}, ${fmtLua(obj.anchorX)}, ${fmtLua(obj.anchorY)}, ${obj.fadeIn})`);
    });

    output.innerHTML = lines.join('\n');

    if (lastTACount == taCount && lastImgCount == imgCount) {
      return;
    }

    lastTACount = taCount;
    lastImgCount = imgCount;
    editorAPI.gameUI.updateHeader(`<V>Textareas <G>: <N>${taCount} <BL>| <V>Images <G>: <N>${imgCount}`);
  }

  function getSelectedObjects() {
    return Array.from(selection).map(key => {
      const { type, id } = parseKey(key);
      return { type, id, obj: getObject(type, id), key };
    }).filter(x => x.obj);
  }

  function isSelected(type, objId) {
    return selection.has(objectKey(type, objId));
  }

  function setSelection(keys) {
    selection.clear();
    keys.forEach(k => selection.add(k));
    refreshSelection();
  }

  function toggleInSelection(key) {
    if (selection.has(key)) {
      selection.delete(key);
    } else {
      selection.add(key);
    }
    refreshSelection();
  }

  function rangeSelectTo(key) {
    if (!lastShiftAnchor || !objectOrder.includes(lastShiftAnchor)) {
      setSelection([key]);
      return;
    }
    const a = objectOrder.indexOf(lastShiftAnchor);
    const b = objectOrder.indexOf(key);
    if (a === -1 || b === -1) {
      setSelection([key]);
      return;
    }
    const start = Math.min(a, b);
    const end = Math.max(a, b);
    setSelection(objectOrder.slice(start, end + 1));
  }

  function handleObjectClick(type, objId, evt) {
    const obj = getObject(type, objId);
    if (!obj || obj.hidden || obj.locked) {
      return;
    }

    const key = objectKey(type, objId);
    const e = evt && evt.evt;

    if (e && e.shiftKey) {
      rangeSelectTo(key);
    } else if (e && (e.ctrlKey || e.metaKey)) {
      toggleInSelection(key);
      lastShiftAnchor = key;
    } else {
      if (!selection.has(key)) {
        setSelection([key]);
      }
      lastShiftAnchor = key;
    }
  }

  function refreshSelection() {
    refreshSidebar();
    refreshPropertyPanel();

    const nodes = getSelectedObjects()
      .filter(x => !x.obj.hidden && !x.obj.locked)
      .map(x => editorAPI.selection.getNode(x.type, x.id))
      .filter(Boolean)
      .map(x => x.node);

    editorAPI.selection.attach(nodes);

    if (selection.size === 0) {
      disableRemoveButton();
      editorAPI.edit();
      editorAPI.editHTML();
    } else {
      enableRemoveButton();
    }
  }

  function clearSelection() {
    selection.clear();
    editorAPI.selection.detach();
    refreshSelection();
  }

  function selectAllObjects() {
    const keys = objectOrder.filter(key => {
      const { type, id } = parseKey(key);
      const obj = getObject(type, id);
      return obj && !obj.hidden && !obj.locked;
    });
    setSelection(keys);
  }

  // Sidebar
  const sidebar = id('sidebar');
  const objectList = id('object-list');

  function toggleSidebar(show) {
    if (show == null) {
      sidebar.classList.toggle('open');
    } else if (show) {
      sidebar.classList.add('open');
    } else {
      sidebar.classList.remove('open');
    }
  }

  id('sidebar-toggle').addEventListener('click', () => toggleSidebar());
  id('sidebar-close').addEventListener('click', () => toggleSidebar(false));

  function refreshSidebar() {
    if (!objectList) return;

    objectList.innerHTML = '';

    for (let i = objectOrder.length - 1; i >= 0; i--) {
      const key = objectOrder[i];
      const { type, id } = parseKey(key);
      const obj = getObject(type, id);
      if (!obj) continue;

      const li = document.createElement('li');
      li.className = 'ui-object-item';
      if (isSelected(type, id)) li.classList.add('selected');
      if (obj.hidden) li.classList.add('hidden-item');
      if (obj.locked) li.classList.add('locked-item');

      const label = document.createElement('span');
      label.className = 'ui-object-label';
      label.textContent = objectLabel(type, obj);

      const actions = document.createElement('div');
      actions.className = 'ui-object-actions';

      const upBtn = document.createElement('button');
      upBtn.type = 'button';
      upBtn.title = 'Move up';
      upBtn.textContent = '↑';
      upBtn.addEventListener('click', (e) => { e.stopPropagation(); moveObjectOrder(key, 1); });

      const downBtn = document.createElement('button');
      downBtn.type = 'button';
      downBtn.title = 'Move down';
      downBtn.textContent = '↓';
      downBtn.addEventListener('click', (e) => { e.stopPropagation(); moveObjectOrder(key, -1); });

      const lockBtn = document.createElement('button');
      lockBtn.type = 'button';
      lockBtn.title = 'Lock';
      lockBtn.textContent = '🔒';
      if (obj.locked) lockBtn.classList.add('active');
      lockBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleLock(type, id); });

      const hideBtn = document.createElement('button');
      hideBtn.type = 'button';
      hideBtn.title = 'Hide';
      hideBtn.textContent = '👁';
      if (obj.hidden) hideBtn.classList.add('active');
      hideBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleHide(type, id); });

      actions.append(upBtn, downBtn, lockBtn, hideBtn);
      li.append(label, actions);

      li.addEventListener('click', (e) => {
        const fakeEvt = { evt: e };
        if (e.shiftKey) {
          rangeSelectTo(key);
        } else if (e.ctrlKey || e.metaKey) {
          toggleInSelection(key);
          lastShiftAnchor = key;
        } else {
          setSelection([key]);
          lastShiftAnchor = key;
        }
      });

      objectList.appendChild(li);
    }
  }

  function moveObjectOrder(key, delta) {
    const idx = objectOrder.indexOf(key);
    if (idx === -1) return;
    const newIdx = idx + delta;
    if (newIdx < 0 || newIdx >= objectOrder.length) return;
    objectOrder.splice(idx, 1);
    objectOrder.splice(newIdx, 0, key);
    syncEditorOrder();
    refreshSidebar();
    refreshPropertyPanel();
  }

  function moveSelectionOrder(delta) {
    if (selection.size === 0) return;
    const selected = Array.from(selection).sort((a, b) => objectOrder.indexOf(a) - objectOrder.indexOf(b));
    if (delta > 0) {
      selected.reverse();
    }
    selected.forEach(key => moveObjectOrder(key, delta));
  }

  function toggleLock(type, objId) {
    const obj = getObject(type, objId);
    if (!obj) return;
    obj.locked = !obj.locked;
    if (obj.locked) {
      selection.delete(objectKey(type, objId));
    }
    applyObjectState(type, objId);
    refreshSelection();
  }

  function toggleHide(type, objId) {
    const obj = getObject(type, objId);
    if (!obj) return;
    obj.hidden = !obj.hidden;
    if (obj.hidden) {
      selection.delete(objectKey(type, objId));
    }
    applyObjectState(type, objId);
    refreshSelection();
  }

  // Property panel helpers
  function clearPropertyControls() {
    [
      'ui_id', 'ui_text', 'ui_x', 'ui_y', 'ui_width', 'ui_height',
      'ui_bgcolor', 'ui_brcolor', 'ui_alpha', 'ui_fixed',
      'ui_image_id', 'ui_target', 'ui_scale_x', 'ui_scale_y', 'ui_scale_link',
      'ui_rotation', 'ui_anchor_x', 'ui_anchor_y', 'ui_anchor_link',
      'ui_order_up', 'ui_order_down', 'ui_sel_count'
    ].forEach(name => editorAPI.controls.remove(name));
  }

  function mixedValue(values) {
    const first = values[0];
    for (let i = 1; i < values.length; i++) {
      if (values[i] !== first) return '';
    }
    return first;
  }

  function addPropField({ id: ctrlId, x, y, width, label, text, disabled, onClick }) {
    const emitter = editorAPI.controls.addTextEdit({
      id: ctrlId, x, y, width, label, text: text != null ? text : '', disabled,
    });
    if (onClick) {
      emitter.on('click', onClick);
    }
    return y + 15;
  }

  // Free-form text editing of a Lua number; the raw text is stored as typed.
  function editNumber(konvaNode, label, value, ctrlId, applyAll) {
    editorAPI.edit({
      konvaNode,
      name: label,
      type: 'text',
      value,
      callback(val) {
        applyAll(val);
        editorAPI.controls.updateTextEdit({ id: ctrlId, text: val });
        updateOutput();
      }
    });
  }

  function refreshPropertyPanel() {
    clearPropertyControls();
    editorAPI.edit();
    editorAPI.editHTML();

    const selected = getSelectedObjects();
    if (selected.length === 0) return;

    let x = 240;
    let y = 420;

    if (selected.length > 1) {
      y = addPropField({
        id: 'ui_sel_count', x, y, width: 180, label: 'Selected', text: selected.length, disabled: true,
      });
    }

    y = addPropField({
      id: 'ui_order_up', x, y, width: 85, label: 'Order', text: '↑ Up',
      onClick: () => moveSelectionOrder(1),
    });
    editorAPI.controls.addTextEdit({
      id: 'ui_order_down', x: x + 95, y: y - 15, width: 85, label: '', text: '↓ Down',
    }).on('click', () => moveSelectionOrder(-1));

    y += 15;

    if (selected.length === 1) {
      const { type, obj } = selected[0];
      if (type === 'textarea') {
        showTextAreaProperties(x, y, obj);
      } else {
        showImageProperties(x, y, obj);
      }
    } else {
      const allImages = selected.every(s => s.type === 'image');
      const allTextareas = selected.every(s => s.type === 'textarea');
      if (allImages) {
        showImageGroupProperties(x, y, selected);
      } else if (allTextareas) {
        showTextAreaGroupProperties(x, y, selected);
      } else {
        y = addXYFields(x, y, selected);
        addAlphaField(x, y, selected);
      }
    }
  }

  function addXYFields(x, y, selected) {
    const xs = selected.map(s => s.obj.x);
    const ys = selected.map(s => s.obj.y);

    y = addPropField({
      id: 'ui_x', x, y, width: 180, label: 'X', text: mixedValue(xs),
      onClick: (_id, _text, konvaNode) => editNumber(konvaNode, 'X', mixedValue(xs), 'ui_x', (val) => {
        selected.forEach(s => {
          s.obj.x = val;
          updateObjectVisual(s.type, s);
        });
      }),
    });

    y = addPropField({
      id: 'ui_y', x, y, width: 180, label: 'Y', text: mixedValue(ys),
      onClick: (_id, _text, konvaNode) => editNumber(konvaNode, 'Y', mixedValue(ys), 'ui_y', (val) => {
        selected.forEach(s => {
          s.obj.y = val;
          updateObjectVisual(s.type, s);
        });
      }),
    });

    return y;
  }

  function addAlphaField(x, y, selected) {
    const alphas = selected.map(s => s.obj.alpha);

    y = addPropField({
      id: 'ui_alpha', x, y, width: 180, label: 'Alpha', text: mixedValue(alphas),
      onClick: (_id, _text, konvaNode) => editNumber(konvaNode, 'Alpha', mixedValue(alphas), 'ui_alpha', (val) => {
        selected.forEach(s => {
          s.obj.alpha = val;
          updateObjectVisual(s.type, s);
        });
      }),
    });

    return y;
  }

  function showTextAreaGroupProperties(x, startY, selected) {
    let y = addXYFields(x, startY, selected);

    y = addPropField({
      id: 'ui_width', x, y, width: 180, label: 'Width', text: mixedValue(selected.map(s => s.obj.width)),
      onClick: (_id, _text, konvaNode) => editNumber(konvaNode, 'Width', mixedValue(selected.map(s => s.obj.width)), 'ui_width', (val) => {
        selected.forEach(s => { s.obj.width = val; updateTextArea(s.obj); });
      }),
    });

    y = addPropField({
      id: 'ui_height', x, y, width: 180, label: 'Height', text: mixedValue(selected.map(s => s.obj.height)),
      onClick: (_id, _text, konvaNode) => editNumber(konvaNode, 'Height', mixedValue(selected.map(s => s.obj.height)), 'ui_height', (val) => {
        selected.forEach(s => { s.obj.height = val; updateTextArea(s.obj); });
      }),
    });

    y = addAlphaField(x, y, selected);

    addPropField({
      id: 'ui_fixed', x, y, width: 180, label: 'Fixed', text: mixedValue(selected.map(s => s.obj.fixed)),
      onClick: () => {
        const next = !selected.every(s => s.obj.fixed);
        selected.forEach(s => { s.obj.fixed = next; updateTextArea(s.obj); });
        refreshPropertyPanel();
      },
    });
  }

  function updateObjectVisual(type, entry) {
    const obj = entry.obj;
    if (type === 'textarea') {
      updateTextArea(obj);
    } else {
      updateImage(obj);
    }
  }

  function showTextAreaProperties(x, startY, ta) {
    let y = startY;

    y = addPropField({
      id: 'ui_id', x, y, width: 180, label: 'ID', text: ta.id, disabled: true,
    });

    y = addPropField({
      id: 'ui_text', x, y, width: 180, label: 'Text', text: ta.text,
      onClick: () => {
        editorAPI.editHTML({
          value: ta.text,
          callback(val) {
            ta.text = val.substr(0, 2000);
            editorAPI.controls.updateTextEdit({ id: 'ui_text', text: ta.text });
            updateTextArea(ta);
            refreshSidebar();
          }
        });
      },
    });

    y = addXYFields(x, y, [{ type: 'textarea', obj: ta }]);

    y = addPropField({
      id: 'ui_width', x, y, width: 180, label: 'Width', text: ta.width,
      onClick: (_id, _text, konvaNode) => editNumber(konvaNode, 'Width', ta.width, 'ui_width', (val) => {
        ta.width = val;
        editorAPI.controls.updateTextEdit({ id: 'ui_width', text: val });
        updateTextArea(ta);
      }),
    });

    y = addPropField({
      id: 'ui_height', x, y, width: 180, label: 'Height', text: ta.height,
      onClick: (_id, _text, konvaNode) => editNumber(konvaNode, 'Height', ta.height, 'ui_height', (val) => {
        ta.height = val;
        editorAPI.controls.updateTextEdit({ id: 'ui_height', text: val });
        updateTextArea(ta);
      }),
    });

    y = addPropField({
      id: 'ui_bgcolor', x, y, width: 180, label: 'Background Color', text: '#' + ta.bg.toString(16).padStart(6, '0'),
      onClick: (_id, _text, konvaNode) => {
        editorAPI.inplace.showColor({
          konvaNode,
          value: ta.bg,
          onChange(num) {
            ta.bg = num;
            updateTextArea(ta);
            editorAPI.controls.updateTextEdit({
              id: 'ui_bgcolor',
              text: '#' + num.toString(16).padStart(6, '0'),
            });
          },
          onDone(num) {
            ta.bg = num;
            updateTextArea(ta);
            editorAPI.controls.updateTextEdit({
              id: 'ui_bgcolor',
              text: '#' + num.toString(16).padStart(6, '0'),
            });
          },
        });
      },
    });

    y = addPropField({
      id: 'ui_brcolor', x, y, width: 180, label: 'Border Color', text: '#' + ta.br.toString(16).padStart(6, '0'),
      onClick: (_id, _text, konvaNode) => {
        editorAPI.inplace.showColor({
          konvaNode,
          value: ta.br,
          onChange(num) {
            ta.br = num;
            updateTextArea(ta);
            editorAPI.controls.updateTextEdit({
              id: 'ui_brcolor',
              text: '#' + num.toString(16).padStart(6, '0'),
            });
          },
          onDone(num) {
            ta.br = num;
            updateTextArea(ta);
            editorAPI.controls.updateTextEdit({
              id: 'ui_brcolor',
              text: '#' + num.toString(16).padStart(6, '0'),
            });
          },
        });
      },
    });

    y = addAlphaField(x, y, [{ type: 'textarea', obj: ta }]);

    addPropField({
      id: 'ui_fixed', x, y, width: 180, label: 'Fixed', text: Boolean(ta.fixed),
      onClick: () => {
        ta.fixed = !ta.fixed;
        editorAPI.controls.updateTextEdit({ id: 'ui_fixed', text: Boolean(ta.fixed) });
        updateTextArea(ta);
      },
    });
  }

  function showImageProperties(x, startY, img) {
    let y = startY;

    y = addPropField({
      id: 'ui_id', x, y, width: 180, label: 'ID', text: img._id, disabled: true,
    });

    y = addPropField({
      id: 'ui_image_id', x, y, width: 180, label: 'Image',
      text: img.imageId.startsWith('data:') ? '[Uploaded Image]' : img.imageId,
      onClick: (_id, _text, konvaNode) => {
        editorAPI.edit({
          konvaNode,
          name: 'Image',
          type: 'text',
          value: img.imageId,
          waitChange: true,
          callback(val) {
            img.imageId = val;
            editorAPI.controls.updateTextEdit({
              id: 'ui_image_id',
              text: val.startsWith('data:') ? '[Uploaded Image]' : val,
            });
            updateImage(img);
            refreshSidebar();
          },
        });
      },
    });

    y = addPropField({
      id: 'ui_target', x, y, width: 180, label: 'Target', text: img.target,
      onClick: (_id, _text, konvaNode) => {
        editorAPI.edit({
          konvaNode,
          name: 'Target',
          type: 'text',
          value: img.target,
          callback(val) {
            img.target = val;
            editorAPI.controls.updateTextEdit({ id: 'ui_target', text: val });
            updateImage(img);
          },
        });
      },
    });

    y = addXYFields(x, y, [{ type: 'image', obj: img }]);
    y = addImageScaleAnchorFields(x, y, img);
  }

  function showImageGroupProperties(x, startY, selected) {
    const img = selected[0].obj;
    const y = addXYFields(x, startY, selected);
    addImageScaleAnchorFields(x, y, img, selected);
  }

  function addImageScaleAnchorFields(x, startY, img, selected) {
    const targets = selected || [{ type: 'image', obj: img }];
    let y = startY;

    y = addPropField({
      id: 'ui_scale_x', x, y, width: 80, label: 'Scale X', text: mixedValue(targets.map(t => t.obj.scaleX)),
      onClick: (_id, _text, konvaNode) => editNumber(konvaNode, 'Scale X', img.scaleX, 'ui_scale_x', (val) => {
        targets.forEach(t => {
          t.obj.scaleX = val;
          if (scaleLinked) t.obj.scaleY = val;
          updateImage(t.obj);
        });
        if (scaleLinked) editorAPI.controls.updateTextEdit({ id: 'ui_scale_y', text: val });
      }),
    });

    editorAPI.controls.addTextEdit({
      id: 'ui_scale_link', x: x + 85, y: y - 15, width: 20, label: '', text: scaleLinked ? '🔗' : '⛓',
    }).on('click', () => {
      scaleLinked = !scaleLinked;
      refreshPropertyPanel();
    });

    y = addPropField({
      id: 'ui_scale_y', x: x + 110, y: y - 15, width: 70, label: 'Y', text: mixedValue(targets.map(t => t.obj.scaleY)),
      onClick: (_id, _text, konvaNode) => editNumber(konvaNode, 'Scale Y', img.scaleY, 'ui_scale_y', (val) => {
        targets.forEach(t => {
          t.obj.scaleY = val;
          if (scaleLinked) t.obj.scaleX = val;
          updateImage(t.obj);
        });
        if (scaleLinked) editorAPI.controls.updateTextEdit({ id: 'ui_scale_x', text: val });
      }),
    });

    y += 15;

    y = addPropField({
      id: 'ui_rotation', x, y, width: 180, label: 'Rotation', text: mixedValue(targets.map(t => t.obj.rotation)),
      onClick: (_id, _text, konvaNode) => editNumber(konvaNode, 'Rotation', img.rotation, 'ui_rotation', (val) => {
        targets.forEach(t => {
          t.obj.rotation = val;
          updateImage(t.obj);
        });
      }),
    });

    y = addAlphaField(x, y, targets);

    y = addPropField({
      id: 'ui_anchor_x', x, y, width: 80, label: 'Anchor X', text: mixedValue(targets.map(t => t.obj.anchorX)),
      onClick: (_id, _text, konvaNode) => editNumber(konvaNode, 'Anchor X', img.anchorX, 'ui_anchor_x', (val) => {
        targets.forEach(t => {
          t.obj.anchorX = val;
          if (anchorLinked) t.obj.anchorY = val;
          updateImage(t.obj);
        });
        if (anchorLinked) editorAPI.controls.updateTextEdit({ id: 'ui_anchor_y', text: val });
      }),
    });

    editorAPI.controls.addTextEdit({
      id: 'ui_anchor_link', x: x + 85, y: y - 15, width: 20, label: '', text: anchorLinked ? '🔗' : '⛓',
    }).on('click', () => {
      anchorLinked = !anchorLinked;
      refreshPropertyPanel();
    });

    addPropField({
      id: 'ui_anchor_y', x: x + 110, y: y - 15, width: 70, label: 'Y', text: mixedValue(targets.map(t => t.obj.anchorY)),
      onClick: (_id, _text, konvaNode) => editNumber(konvaNode, 'Anchor Y', img.anchorY, 'ui_anchor_y', (val) => {
        targets.forEach(t => {
          t.obj.anchorY = val;
          if (anchorLinked) t.obj.anchorX = val;
          updateImage(t.obj);
        });
        if (anchorLinked) editorAPI.controls.updateTextEdit({ id: 'ui_anchor_x', text: val });
      }),
    });
  }

  // Toolbar buttons
  disableRemoveButton();
  editorAPI.controls.addButton({
    id: "add_textarea", x: 20, y: 420 + 30 * 1, width: 180, text: "Add Textarea",
  }).on('click', () => newTextArea());

  editorAPI.controls.addButton({
    id: "add_image", x: 20, y: 420 + 30 * 2, width: 180, text: "Add Image",
  }).on('click', () => newImage());

  editorAPI.controls.addButton({
    id: "upload_image", x: 20, y: 420 + 30 * 3, width: 180, text: "Upload Image",
  }).on('click', () => id('image_upload') && id('image_upload').click());

  editorAPI.controls.addSeparator({ id: "sep1", x: 220, y: 420, height: 160 });
  editorAPI.stage.on('click', clearSelection);
  editorAPI.stage.on('key', onStageKey);

  function enableRemoveButton() {
    editorAPI.controls.addButton({
      id: "remove", x: 20, y: 420, width: 180, text: "Remove",
    }).on('click', removeSelected);
  }

  function disableRemoveButton() {
    editorAPI.controls.addButton({
      id: "remove", x: 20, y: 420, width: 180, disabled: true, text: "Remove",
    });
  }

  function removeSelected() {
    getSelectedObjects().forEach(({ type, id: objId }) => {
      if (type === 'textarea') {
        delete textareas[objId];
        editorAPI.lua.removeTextArea(objId);
        objectOrder.splice(objectOrder.indexOf(objectKey(type, objId)), 1);
      } else {
        delete images[objId];
        editorAPI.lua.removeImage(objId);
        objectOrder.splice(objectOrder.indexOf(objectKey(type, objId)), 1);
      }
    });
    updateOutput();
    clearSelection();
    refreshSidebar();
  }

  function moveSelected(dx, dy) {
    getSelectedObjects().forEach(({ type, obj }) => {
      obj.x = toNum(obj.x, 0) + dx;
      obj.y = toNum(obj.y, 0) + dy;
      updateObjectVisual(type, { obj });
    });
    refreshPropertyPanel();
    updateOutput();
  }

  function onStageKey(key) {
    if (key === 'selectAll') {
      selectAllObjects();
      return;
    }

    if (selection.size === 0) return;

    if (key === 'delete') {
      removeSelected();
      return;
    }

    if (key === 'left') moveSelected(-1, 0);
    else if (key === 'up') moveSelected(0, -1);
    else if (key === 'right') moveSelected(1, 0);
    else if (key === 'down') moveSelected(0, 1);
  }

  // Image CRUD
  function updateImage(img) {
    images[img._id] = img;
    updateOutput();
    return editorAPI.lua.addImage(
      img._id, img.imageId, img.target, toNum(img.x, 0), toNum(img.y, 0), img.targetPlayer,
      toNum(img.scaleX, 1), toNum(img.scaleY, 1), toNum(img.rotation, 0) / 180 * Math.PI,
      toNum(img.alpha, 1), toNum(img.anchorX, 0), toNum(img.anchorY, 0), img.fadeIn
    );
  }

  function newImage(img, select) {
    img = img || {
      _id: images._lastId++,
      imageId: 'PzeZAHw.png',
      target: '!0',
      x: 0, y: 0,
      targetPlayer: null,
      scaleX: 1, scaleY: 1,
      rotation: 0, alpha: 1,
      anchorX: 0, anchorY: 0,
      fadeIn: false,
      locked: false, hidden: false,
    };

    images[img._id] = img;
    return addObject('image', img, select);
  }

  function onMoveImage(_id, x, y) {
    const img = images[_id];
    if (!img) return;

    img.x = x;
    img.y = y;
    refreshPropertyPanel();
    updateOutput();
  }

  function onUpdateImage(_id, x, y, scaleX, scaleY, rotation) {
    const img = images[_id];
    if (!img) return;

    img.x = x;
    img.y = y;
    img.scaleX = scaleX;
    img.scaleY = scaleY;
    img.rotation = rotation;

    refreshPropertyPanel();
    updateOutput();
  }

  // TextArea CRUD
  function updateTextArea(ta) {
    textareas[ta.id] = ta;
    updateOutput();
    return editorAPI.lua.addTextArea(
      ta.id, ta.text, ta.target, toNum(ta.x, 50), toNum(ta.y, 50),
      toNum(ta.width, null), toNum(ta.height, null), ta.bg, ta.br, toNum(ta.alpha, 1), ta.fixed
    );
  }

  function newTextArea(ta, select) {
    ta = ta || {
      id: textareas._lastId++,
      text: "ta" + (textareas._lastId - 1),
      target: null,
      x: 50, y: 50,
      width: 100, height: 100,
      bg: 0xffffff, br: 1,
      alpha: 1, fixed: false,
      locked: false, hidden: false,
    };

    textareas[ta.id] = ta;
    return addObject('textarea', ta, select);
  }

  function onMoveTextArea(objId, x, y) {
    const ta = textareas[objId];
    if (!ta) return;

    ta.x = x;
    ta.y = y;
    refreshPropertyPanel();
    updateOutput();
  }

  function onUpdateTextArea(objId, x, y, width, height) {
    const ta = textareas[objId];
    if (!ta) return;

    ta.x = x;
    ta.y = y;
    ta.width = width;
    ta.height = height;
    refreshPropertyPanel();
    updateOutput();
  }

  function decimalToHex(number) {
    if (number < 0) {
      number = 0xFFFFFFFF + number + 1;
    }
    return '0x' + number.toString(16).toUpperCase();
  }

  // Image upload
  function handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      newImage({
        _id: images._lastId++,
        imageId: event.target.result,
        fileName: file.name,
        target: '!0',
        x: 0, y: 0,
        targetPlayer: null,
        scaleX: 1, scaleY: 1,
        rotation: 0, alpha: 1,
        anchorX: 0, anchorY: 0,
        fadeIn: false,
        locked: false, hidden: false,
      });
    };
    reader.onerror = function(err) {
      errorSet("Failed to read file: " + err);
    };
    reader.readAsDataURL(file);
  }

  const fileInput = id('image_upload');
  if (fileInput) {
    fileInput.addEventListener('change', function() {
      if (this.files && this.files.length > 0) {
        Array.from(this.files).forEach(file => {
          if (file.type.startsWith('image/')) handleImageFile(file);
        });
        this.value = '';
      }
    });
  }

  const dropOverlay = id('drop-overlay');
  let dragCounter = 0;

  window.addEventListener('dragenter', function(e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter++;
    if (dropOverlay) dropOverlay.classList.add('active');
  });

  window.addEventListener('dragleave', function(e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      if (dropOverlay) dropOverlay.classList.remove('active');
    }
  });

  window.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
  });

  window.addEventListener('drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter = 0;
    if (dropOverlay) dropOverlay.classList.remove('active');
    if (e.dataTransfer && e.dataTransfer.files) {
      Array.from(e.dataTransfer.files).forEach(file => {
        if (file.type.startsWith('image/')) handleImageFile(file);
      });
    }
  });

  // Export/Import
  window.exportJSON = function() {
    const state = { textareas, images, objectOrder };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "tfm_lua_ui.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  function clearEditor() {
    clearSelection();
    for (let key in textareas) {
      if (key !== '_lastId') {
        editorAPI.lua.removeTextArea(key);
        delete textareas[key];
      }
    }
    textareas._lastId = 0;
    for (let key in images) {
      if (key !== '_lastId') {
        editorAPI.lua.removeImage(key);
        delete images[key];
      }
    }
    images._lastId = 0;
    objectOrder.length = 0;
    updateOutput();
    refreshSidebar();
  }

  function importState(state) {
    clearEditor();
    if (state.textareas) {
      textareas._lastId = state.textareas._lastId || 0;
      for (let key in state.textareas) {
        if (key === '_lastId') continue;
        newTextArea(state.textareas[key], false);
      }
    }
    if (state.images) {
      images._lastId = state.images._lastId || 0;
      for (let key in state.images) {
        if (key === '_lastId') continue;
        newImage(state.images[key], false);
      }
    }
    if (state.objectOrder && state.objectOrder.length) {
      objectOrder.length = 0;
      state.objectOrder.forEach(k => {
        const { type, id: objId } = parseKey(k);
        if (getObject(type, objId) && !objectOrder.includes(k)) {
          objectOrder.push(k);
        }
      });
      objectOrder.forEach((k, i) => {
        const { type, id: objId } = parseKey(k);
        const obj = getObject(type, objId);
        if (obj) obj.editorOrder = i;
      });
      syncEditorOrder();
    }
    clearSelection();
    updateOutput();
    refreshSidebar();
  }

  const jsonImportInput = id('json_import_input');
  if (jsonImportInput) {
    jsonImportInput.addEventListener('change', function() {
      if (this.files && this.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(event) {
          try {
            importState(JSON.parse(event.target.result));
          } catch (err) {
            errorSet("Failed to parse JSON file: " + err.message);
          }
        };
        reader.readAsText(this.files[0]);
        this.value = '';
      }
    });
  }

  refreshSidebar();
})();
