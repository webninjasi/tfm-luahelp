(function() {
  const id = selector => document.getElementById(selector);
  const escapeLuaString = (str) => str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t');

  // https://stackoverflow.com/a/13538245
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

  const textareas = { _lastId: 0 };
  const images = { _lastId: 0  };

  let lastTACount;
  let lastImgCount;

  let selectType;
  let selectedId;

  window.toggleGameUI = editorAPI.gameUI.toggle;
  window.copyText = (elm) => {
    elm.select();
    document.execCommand('copy');
  }
  window.toggleCode = () => {
    const code = document.querySelector('.ui-editor-code');

    if (!code.style.display) {
      code.style.display = 'block';
    } else {
      code.style.display = null;
    }
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

    for (let key in textareas) {
      if (key == '_lastId') {
        continue;
      }

      taCount ++;
      obj = textareas[key];
      lines.push(`ui.addTextArea(${obj.id}, "${escapeLuaString(obj.text)}", targetPlayer, ${obj.x}, ${obj.y}, ${obj.width || 'nil'}, ${obj.height || 'nil'}, ${decimalToHex(obj.bg)}, ${decimalToHex(obj.br)}, ${obj.alpha}, ${obj.fixed})`);
    }

    for (let key in images) {
      if (key == '_lastId') {
        continue;
      }

      imgCount ++;
      obj = images[key];
      let idStr = obj.imageId;
      if (idStr.startsWith('data:')) {
        if (obj.fileName) {
          idStr = `<uploaded_${obj.fileName}>`;
        } else {
          idStr = `<uploaded_${obj._id}>`;
        }
      }
      lines.push(`tfm.exec.addImage("${escapeLuaString(idStr)}", "${escapeLuaString(obj.target)}", ${obj.x}, ${obj.y}, targetPlayer, ${obj.scaleX}, ${obj.scaleY}, ${(obj.rotation / 180 * Math.PI).toFixed(2)}, ${obj.alpha}, ${obj.anchorX}, ${obj.anchorY}, ${obj.fadeIn})`);
    }

    output.innerHTML = lines.join('\n');

    if (lastTACount == taCount && lastImgCount == imgCount) {
      return;
    }

    lastTACount = taCount;
    lastImgCount = imgCount;

    editorAPI.gameUI.updateHeader(`<V>Textareas <G>: <N>${taCount} <BL>| <V>Images <G>: <N>${imgCount}`);
  }

  disableRemoveButton();
  editorAPI.controls.addButton({
    id: "add_textarea",
    x: 20,
    y: 420 + 30 * 1,
    width: 180,
    text: "Add Textarea",
  }).on('click', function() {
    newTextArea();
  });
  editorAPI.controls.addButton({
    id: "add_image",
    x: 20,
    y: 420 + 30 * 2,
    width: 180,
    text: "Add Image",
  }).on('click', function() {
    newImage();
  });
  editorAPI.controls.addButton({
    id: "upload_image",
    x: 20,
    y: 420 + 30 * 3,
    width: 180,
    text: "Upload Image",
  }).on('click', function() {
    const fileInput = id('image_upload');
    if (fileInput) {
      fileInput.click();
    }
  });

  editorAPI.controls.addSeparator({
    id: "sep1",
    x: 220,
    y: 420,
    height: 160
  });
  editorAPI.stage.on('click', onUnselect);
  editorAPI.stage.on('key', onStageKey);

  function enableRemoveButton() {
    editorAPI.controls.addButton({
      id: "remove",
      x: 20,
      y: 420,
      width: 180,
      text: "Remove",
    }).on('click', function() {
      if (selectedId == null) {
        return;
      }

      if (selectType == 'textarea') {
        delete textareas[selectedId];
        editorAPI.lua.removeTextArea(selectedId);
      }
      else if (selectType == 'image') {
        delete images[selectedId];
        editorAPI.lua.removeImage(selectedId);
      }

      updateOutput();
      onUnselect();
    });
  }

  function disableRemoveButton() {
    editorAPI.controls.addButton({
      id: "remove",
      x: 20,
      y: 420,
      width: 180,
      disabled: true,
      text: "Remove",
    });
  }

  function onStageKey(key) {
    if (selectedId == null) {
      return;
    }

    if (key == 'delete') {
      if (selectType == 'textarea') {
        delete textareas[selectedId];
        editorAPI.lua.removeTextArea(selectedId);
      }
      else if (selectType == 'image') {
        delete images[selectedId];
        editorAPI.lua.removeImage(selectedId);
      }

      updateOutput();
      onUnselect();
      return;
    }

    if (selectType == 'textarea') {
      const ta = textareas[selectedId];
  
      if (!ta) {
        return;
      }
  
      if (key == 'left') {
        ta.x --;
      }
      else if (key == 'up') {
        ta.y --;
      }
      else if (key == 'right') {
        ta.x ++;
      }
      else if (key == 'down') {
        ta.y ++;
      }
      else {
        return;
      }
  
      editorAPI.controls.updateTextEdit({
        id: 'ui_x',
        text: ta.x,
      });
      editorAPI.controls.updateTextEdit({
        id: 'ui_y',
        text: ta.y,
      });

      updateTextArea(ta);
    }
    else if (selectType == 'image') {
      const img = images[selectedId];

      if (!img) {
        return;
      }
  
      if (key == 'left') {
        img.x --;
      }
      else if (key == 'up') {
        img.y --;
      }
      else if (key == 'right') {
        img.x ++;
      }
      else if (key == 'down') {
        img.y ++;
      }
      else {
        return;
      }

      editorAPI.controls.updateTextEdit({
        id: 'ui_x',
        text: img.x,
      });
      editorAPI.controls.updateTextEdit({
        id: 'ui_y',
        text: img.y,
      });

      updateImage(img);
    }
  }

  function onUnselect() {
    if (selectedId == null) {
      return;
    }

    selectedId = null;

    disableRemoveButton();
    editorAPI.edit();
    editorAPI.editHTML();

    if (selectType == 'textarea') {
      editorAPI.controls.remove("ui_id");
      editorAPI.controls.remove("ui_text");
      editorAPI.controls.remove("ui_x");
      editorAPI.controls.remove("ui_y");
      editorAPI.controls.remove("ui_width");
      editorAPI.controls.remove("ui_height");
      editorAPI.controls.remove("ui_bgcolor");
      editorAPI.controls.remove("ui_brcolor");
      editorAPI.controls.remove("ui_alpha");
      editorAPI.controls.remove("ui_fixed");
    }
    else if (selectType == 'image') {
      editorAPI.controls.remove("ui_id");
      editorAPI.controls.remove("ui_image_id");
      editorAPI.controls.remove("ui_target");
      editorAPI.controls.remove("ui_x");
      editorAPI.controls.remove("ui_y");
      editorAPI.controls.remove("ui_target_player");
      editorAPI.controls.remove("ui_scale_x");
      editorAPI.controls.remove("ui_scale_y");
      editorAPI.controls.remove("ui_rotation");
      editorAPI.controls.remove("ui_alpha");
      editorAPI.controls.remove("ui_anchor_x");
      editorAPI.controls.remove("ui_anchor_y");
    }
  }

  // Create/Edit Image

  function updateImage(img) {
    images[img._id] = img;
    updateOutput();

    return editorAPI.lua.addImage(
      img._id,
      img.imageId,
      img.target,
      img.x,
      img.y,
      img.targetPlayer,
      img.scaleX,
      img.scaleY,
      img.rotation / 180 * Math.PI, // convert to radian
      img.alpha,
      img.anchorX,
      img.anchorY,
      img.fadeIn
    );
  }

  function newImage(img) {
    img = img || {
      _id: images._lastId ++,
      imageId: 'PzeZAHw.png',
      target: '!0',
      x: 0,
      y: 0,
      targetPlayer: null,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      alpha: 1,
      anchorX: 0,
      anchorY: 0,
      fadeIn: false,
    };
  
    const obj = updateImage(img);

    obj.on('click', onSelectImage)
      .on('move', onMoveImage)
      .on('update', onUpdateImage)
      .on('load', (_id, url) => {
        errorSet('');
      })
      .on('loadfail', (_id, url) => {
        errorSet(`Failed to load image for ${_id}: ${url.escape()}`);
      });

    onSelectImage(img._id);
  }

  function onSelectImage(_id) {
    const img = images[_id];

    if (!img) {
      console.error("Invalid image selected:", _id);
      return;
    }

    onUnselect();
    selectType = 'image';
    selectedId = _id;
    enableRemoveButton();

    let x = 240;
    let y = 420;

    editorAPI.controls.addTextEdit({
      id: "ui_id",
      x,
      y,
      width: 180,
      label: 'ID',
      text: img._id,
      disabled: true,
    });

    y += 15;
    editorAPI.controls.addTextEdit({
      id: "ui_image_id",
      x,
      y,
      width: 180,
      label: 'Image',
      text: img.imageId.startsWith('data:') ? '[Uploaded Image]' : img.imageId,
    }).on('click', () => {
      editorAPI.edit({
        name: "Image",
        type: 'text',
        value: img.imageId,
        waitChange: true,
        callback: (val) => {
          img.imageId = val;
          editorAPI.controls.updateTextEdit({
            id: 'ui_image_id',
            text: val.startsWith('data:') ? '[Uploaded Image]' : val,
          });
          updateImage(img);
        }
      });
    });

    y += 15;
    editorAPI.controls.addTextEdit({
      id: "ui_target",
      x,
      y,
      width: 180,
      label: 'Target',
      text: img.target,
    }).on('click', () => {
      editorAPI.edit({
        name: "Target",
        type: 'text',
        value: img.target,
        callback: (val) => {
          img.target = val;
          editorAPI.controls.updateTextEdit({
            id: 'ui_target',
            text: val,
          });
          updateImage(img);
        }
      });
    });

    y += 15;
    editorAPI.controls.addTextEdit({
      id: "ui_x",
      x,
      y,
      width: 180,
      label: 'X',
      text: img.x,
    }).on('click', function() {
      editorAPI.edit({
        name: "X",
        type: 'number',
        value: img.x,
        callback: function(val) {
          val = parseInt(val);
    
          if (isNaN(val)) {
            return;
          }

          img.x = val;
          editorAPI.controls.updateTextEdit({
            id: 'ui_x',
            text: val,
          });
          updateImage(img);
        }
      });
    });

    y += 15;
    editorAPI.controls.addTextEdit({
      id: "ui_y",
      x,
      y,
      width: 180,
      label: 'Y',
      text: img.y,
    }).on('click', function() {
      editorAPI.edit({
        name: "Y",
        type: 'number',
        value: img.y,
        callback: function(val) {
          val = parseInt(val);
    
          if (isNaN(val)) {
            return;
          }

          img.y = val;
          editorAPI.controls.updateTextEdit({
            id: 'ui_y',
            text: val,
          });
          updateImage(img);
        }
      });
    });

    y += 15;
    editorAPI.controls.addTextEdit({
      id: "ui_scale_x",
      x,
      y,
      width: 180,
      label: 'Scale X',
      text: img.scaleX,
    }).on('click', function() {
      editorAPI.edit({
        name: "Scale X",
        type: 'number',
        step: 0.1,
        min: -1,
        max: 1,
        value: img.scaleX,
        callback: function(val) {
          val = parseFloat(val);
    
          if (isNaN(val)) {
            return;
          }

          img.scaleX = val;
          editorAPI.controls.updateTextEdit({
            id: 'ui_scale_x',
            text: val,
          });
          updateImage(img);
        }
      });
    });

    y += 15;
    editorAPI.controls.addTextEdit({
      id: "ui_scale_y",
      x,
      y,
      width: 180,
      label: 'Scale Y',
      text: img.scaleY,
    }).on('click', function() {
      editorAPI.edit({
        name: "Scale Y",
        type: 'number',
        step: 0.1,
        min: -1,
        max: 1,
        value: img.scaleY,
        callback: function(val) {
          val = parseFloat(val);
    
          if (isNaN(val)) {
            return;
          }

          img.scaleY = val;
          editorAPI.controls.updateTextEdit({
            id: 'ui_scale_y',
            text: val,
          });
          updateImage(img);
        }
      });
    });

    y += 15;
    editorAPI.controls.addTextEdit({
      id: "ui_rotation",
      x,
      y,
      width: 180,
      label: 'Rotation',
      text: img.rotation,
    }).on('click', function() {
      editorAPI.edit({
        name: "Rotation",
        type: 'number',
        value: img.rotation,
        callback: function(val) {
          val = parseInt(val);
    
          if (isNaN(val)) {
            return;
          }

          img.rotation = val;
          editorAPI.controls.updateTextEdit({
            id: 'ui_rotation',
            text: val,
          });
          updateImage(img);
        }
      });
    });

    y += 15;
    editorAPI.controls.addTextEdit({
      id: "ui_alpha",
      x,
      y,
      width: 180,
      label: 'Alpha',
      text: img.alpha,
    }).on('click', function() {
      editorAPI.edit({
        name: "Alpha",
        type: 'number',
        min: 0,
        max: 1,
        step: 0.1,
        value: img.alpha,
        callback: function(val) {
          val = parseFloat(val);
    
          if (isNaN(val)) {
            return;
          }

          img.alpha = val;
          editorAPI.controls.updateTextEdit({
            id: 'ui_alpha',
            text: val,
          });
          updateImage(img);
        }
      });
    });

    y += 15;
    editorAPI.controls.addTextEdit({
      id: "ui_anchor_x",
      x,
      y,
      width: 180,
      label: 'Anchor X',
      text: img.anchorX,
    }).on('click', function() {
      editorAPI.edit({
        name: "Anchor X",
        type: 'number',
        step: 0.1,
        min: -1,
        max: 1,
        value: img.anchorX,
        callback: function(val) {
          val = parseFloat(val);
    
          if (isNaN(val)) {
            return;
          }

          img.anchorX = val;
          editorAPI.controls.updateTextEdit({
            id: 'ui_anchor_x',
            text: val,
          });
          updateImage(img);
        }
      });
    });

    y += 15;
    editorAPI.controls.addTextEdit({
      id: "ui_anchor_y",
      x,
      y,
      width: 180,
      label: 'Anchor Y',
      text: img.anchorY,
    }).on('click', function() {
      editorAPI.edit({
        name: "Anchor Y",
        type: 'number',
        step: 0.1,
        min: -1,
        max: 1,
        value: img.anchorY,
        callback: function(val) {
          val = parseFloat(val);
    
          if (isNaN(val)) {
            return;
          }

          img.anchorY = val;
          editorAPI.controls.updateTextEdit({
            id: 'ui_anchor_y',
            text: val,
          });
          updateImage(img);
        }
      });
    });
  }

  function onMoveImage(_id, x, y) {
    const img = images[_id];

    if (!img) {
      console.error("Invalid image moved:", _id);
      return;
    }

    img.x = x;
    img.y = y;

    editorAPI.controls.updateTextEdit({
      id: 'ui_x',
      text: x,
    });
    editorAPI.controls.updateTextEdit({
      id: 'ui_y',
      text: y,
    });

    updateOutput();
  }

  function onUpdateImage(_id, x, y, scaleX, scaleY, rotation) {
    const img = images[_id];
  
    if (!img) {
      console.error("Invalid image updated:", _id);
      return;
    }

    img.x = x;
    img.y = y;
    img.scaleX = scaleX;
    img.scaleY = scaleY;
    img.rotation = rotation; // in degrees

    editorAPI.controls.updateTextEdit({
      id: 'ui_x',
      text: x,
    });
    editorAPI.controls.updateTextEdit({
      id: 'ui_y',
      text: y,
    });
    editorAPI.controls.updateTextEdit({
      id: 'ui_scale_x',
      text: scaleX,
    });
    editorAPI.controls.updateTextEdit({
      id: 'ui_scale_y',
      text: scaleY,
    });
    editorAPI.controls.updateTextEdit({
      id: 'ui_rotation',
      text: rotation,
    });

    updateOutput();
  }

  // TextArea Create/Edit

  function updateTextArea(ta) {
    textareas[ta.id] = ta;
    updateOutput();

    return editorAPI.lua.addTextArea(
      ta.id,
      ta.text,
      ta.target,
      ta.x,
      ta.y,
      ta.width,
      ta.height,
      ta.bg,
      ta.br,
      ta.alpha,
      ta.fixed
    );
  }

  function newTextArea(ta) {
    ta = ta || {
      id: textareas._lastId ++,
      text: "ta" + (textareas._lastId - 1),
      target: null,
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      bg: 0xffffff,
      br: 1,
      alpha: 1,
      fixed: false,
    };

    const obj = updateTextArea(ta);

    obj.on('click', onSelectTextArea)
       .on('move', onMoveTextArea)
       .on('update', onUpdateTextArea);

    onSelectTextArea(ta.id);
  }

  function onSelectTextArea(id) {
    const ta = textareas[id];

    if (!ta) {
      console.error("Invalid textarea selected:", id);
      return;
    }

    onUnselect();
    selectType = 'textarea';
    selectedId = id;
    enableRemoveButton();

    let x = 240;
    let y = 420;

    editorAPI.controls.addTextEdit({
      id: "ui_id",
      x,
      y,
      width: 180,
      label: 'ID',
      text: ta.id,
      disabled: true,
    });

    y += 15;
    editorAPI.controls.addTextEdit({
      id: "ui_text",
      x,
      y,
      width: 180,
      label: 'Text',
      text: ta.text,
    }).on('click', function() {
      editorAPI.editHTML({
        value: ta.text,
        callback: function(val) {
          ta.text = val.substr(0, 2000);
          editorAPI.controls.updateTextEdit({
            id: 'ui_text',
            text: val,
          });
          updateTextArea(ta);
        }
      });
    });

    y += 15;
    editorAPI.controls.addTextEdit({
      id: "ui_x",
      x,
      y,
      width: 180,
      label: 'X',
      text: ta.x,
    }).on('click', function() {
      editorAPI.edit({
        name: "X",
        type: 'number',
        value: ta.x,
        callback: function(val) {
          val = parseInt(val);
    
          if (isNaN(val)) {
            return;
          }

          ta.x = val;
          editorAPI.controls.updateTextEdit({
            id: 'ui_x',
            text: val,
          });
          updateTextArea(ta);
        }
      });
    });

    y += 15;
    editorAPI.controls.addTextEdit({
      id: "ui_y",
      x,
      y,
      width: 180,
      label: 'Y',
      text: ta.y,
    }).on('click', function() {
      editorAPI.edit({
        name: "Y",
        type: 'number',
        value: ta.y,
        callback: function(val) {
          val = parseInt(val);
    
          if (isNaN(val)) {
            return;
          }

          ta.y = val;
          editorAPI.controls.updateTextEdit({
            id: 'ui_y',
            text: val,
          });
          updateTextArea(ta);
        }
      });
    });

    y += 15;
    editorAPI.controls.addTextEdit({
      id: "ui_width",
      x,
      y,
      width: 180,
      label: 'Width',
      text: ta.width,
    }).on('click', function() {
      editorAPI.edit({
        name: "Width",
        type: 'number',
        value: ta.width,
        callback: function(val) {
          val = parseInt(val);
    
          if (isNaN(val)) {
            return;
          }

          ta.width = val;
          editorAPI.controls.updateTextEdit({
            id: 'ui_width',
            text: val,
          });
          updateTextArea(ta);
        }
      });
    });

    y += 15;
    editorAPI.controls.addTextEdit({
      id: "ui_height",
      x,
      y,
      width: 180,
      label: 'Height',
      text: ta.height,
    }).on('click', function() {
      editorAPI.edit({
        name: "Height",
        type: 'number',
        value: ta.height,
        callback: function(val) {
          val = parseInt(val);
    
          if (isNaN(val)) {
            return;
          }

          ta.height = val;
          editorAPI.controls.updateTextEdit({
            id: 'ui_height',
            text: val,
          });
          updateTextArea(ta);
        }
      });
    });

    y += 15;
    editorAPI.controls.addTextEdit({
      id: "ui_bgcolor",
      x,
      y,
      width: 180,
      label: 'Background Color',
      text: '#' + ta.bg.toString(16).padStart(6, '0'),
    }).on('click', function() {
      editorAPI.edit({
        name: "Background Color",
        type: 'color',
        value: '#' + ta.bg.toString(16).padStart(6, '0'),
        callback: function(val) {
          val = parseInt(val.substr(1), 16);

          if (isNaN(val)) {
            return;
          }

          ta.bg = val;
          editorAPI.controls.updateTextEdit({
            id: 'ui_bgcolor',
            text: val,
          });
          updateTextArea(ta);
        }
      });
    });

    y += 15;
    editorAPI.controls.addTextEdit({
      id: "ui_brcolor",
      x,
      y,
      width: 180,
      label: 'Border Color',
      text: '#' + ta.br.toString(16).padStart(6, '0'),
    }).on('click', function() {
      editorAPI.edit({
        name: "Border Color",
        type: 'color',
        value: '#' + ta.br.toString(16).padStart(6, '0'),
        callback: function(val) {
          val = parseInt(val.substr(1), 16);

          if (isNaN(val)) {
            return;
          }

          ta.br = val;
          editorAPI.controls.updateTextEdit({
            id: 'ui_brcolor',
            text: val,
          });
          updateTextArea(ta);
        }
      });
    });

    y += 15;
    editorAPI.controls.addTextEdit({
      id: "ui_alpha",
      x,
      y,
      width: 180,
      label: 'Alpha',
      text: ta.alpha,
    }).on('click', function() {
      editorAPI.edit({
        name: "Alpha",
        type: 'number',
        min: 0,
        max: 1,
        step: 0.1,
        value: ta.alpha,
        callback: function(val) {
          val = parseFloat(val);
    
          if (isNaN(val)) {
            return;
          }

          ta.alpha = val;
          editorAPI.controls.updateTextEdit({
            id: 'ui_alpha',
            text: val,
          });
          updateTextArea(ta);
        }
      });
    });

    y += 15;
    editorAPI.controls.addTextEdit({
      id: "ui_fixed",
      x,
      y,
      width: 180,
      label: 'Fixed',
      text: Boolean(ta.fixed),
    }).on('click', function() {
      ta.fixed = !ta.fixed;
      editorAPI.controls.updateTextEdit({
        id: 'ui_fixed',
        text: Boolean(ta.fixed),
      });
      updateTextArea(ta);
    });
  }

  function onMoveTextArea(id, x, y) {
    if (!textareas[id]) {
      console.error("Invalid textarea moved:", id);
      return;
    }

    const ta = textareas[id];

    ta.x = x;
    ta.y = y;

    editorAPI.controls.updateTextEdit({
      id: 'ui_x',
      text: x,
    });
    editorAPI.controls.updateTextEdit({
      id: 'ui_y',
      text: y,
    });

    updateOutput();
  }

  function onUpdateTextArea(id, x, y, width, height) {
    if (!textareas[id]) {
      console.error("Invalid textarea updated:", id);
      return;
    }

    const ta = textareas[id];

    ta.x = x;
    ta.y = y;
    ta.width = width;
    ta.height = height;

    editorAPI.controls.updateTextEdit({
      id: 'ui_x',
      text: x,
    });
    editorAPI.controls.updateTextEdit({
      id: 'ui_y',
      text: y,
    });
    editorAPI.controls.updateTextEdit({
      id: 'ui_width',
      text: width,
    });
    editorAPI.controls.updateTextEdit({
      id: 'ui_height',
      text: height,
    });

    updateOutput();
  }

  // Helper Functions
  function decimalToHex(number) {
    if (number < 0) {
      number = 0xFFFFFFFF + number + 1;
    }

    return '0x' + number.toString(16).toUpperCase();
  }

  // Image Upload and Drag & Drop Handlers
  function handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const dataURL = event.target.result;
      newImage({
        _id: images._lastId ++,
        imageId: dataURL,
        fileName: file.name,
        target: '!0',
        x: 0,
        y: 0,
        targetPlayer: null,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        alpha: 1,
        anchorX: 0,
        anchorY: 0,
        fadeIn: false,
      });
    };
    reader.onerror = function(err) {
      errorSet("Failed to read file: " + err);
    };
    reader.readAsDataURL(file);
  }

  const fileInput = id('image_upload');
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      if (this.files && this.files.length > 0) {
        Array.from(this.files).forEach(file => {
          if (file.type.startsWith('image/')) {
            handleImageFile(file);
          }
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
    if (dropOverlay) {
      dropOverlay.classList.add('active');
    }
  });

  window.addEventListener('dragleave', function(e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      if (dropOverlay) {
        dropOverlay.classList.remove('active');
      }
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
    if (dropOverlay) {
      dropOverlay.classList.remove('active');
    }

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => {
        if (file.type.startsWith('image/')) {
          handleImageFile(file);
        }
      });
    }
  });

  // Export/Import State via JSON
  window.exportJSON = function() {
    const state = { textareas, images };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = "tfm_lua_ui.json";
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  function clearEditor() {
    onUnselect();
    
    // Clear textareas
    for (let key in textareas) {
      if (key !== '_lastId') {
        editorAPI.lua.removeTextArea(key);
        delete textareas[key];
      }
    }
    textareas._lastId = 0;
    
    // Clear images
    for (let key in images) {
      if (key !== '_lastId') {
        editorAPI.lua.removeImage(key);
        delete images[key];
      }
    }
    images._lastId = 0;
    
    updateOutput();
  }

  function importState(state) {
    clearEditor();
    
    if (state.textareas) {
      textareas._lastId = state.textareas._lastId || 0;
      for (let key in state.textareas) {
        if (key === '_lastId') continue;
        const ta = state.textareas[key];
        newTextArea(ta);
      }
    }
    
    if (state.images) {
      images._lastId = state.images._lastId || 0;
      for (let key in state.images) {
        if (key === '_lastId') continue;
        const img = state.images[key];
        newImage(img);
      }
    }
    
    onUnselect();
    updateOutput();
  }

  const jsonImportInput = id('json_import_input');
  if (jsonImportInput) {
    jsonImportInput.addEventListener('change', function(e) {
      if (this.files && this.files.length > 0) {
        const file = this.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
          try {
            const state = JSON.parse(event.target.result);
            importState(state);
          } catch (err) {
            errorSet("Failed to parse JSON file: " + err.message);
          }
        };
        reader.readAsText(file);
        this.value = '';
      }
    });
  }
})();
