(function() {
  let canvasElm = id('shopcanvas');
  let canvasCtx = canvasElm.getContext('2d');
  let objects = [];
  let selected = 0;

  function presetForBox(w, h) {
    const defaultAR = w / h;
    return (ar) => {
      if (ar >= defaultAR) {
        return { w: w, h: Math.round(w / ar) };
      } else {
        return { w: Math.round(h * ar), h: h };
      }
    }
  }

  const shamanObjects = [
    { name: "Small Box", x: 16, y: 71, w: 30, h: 30, preset: presetForBox(30, 30) },
    { name: "Big Box", x: 100, y: 43, w: 60, h: 60, preset: presetForBox(60, 60) },
    { name: "Trampoline", x: 216, y: 93, w: 99, h: 10, cx: 266, cy: 93, preset: presetForBox(100, 20) },
    { name: "Balloon", cx: 383, cy: 70, radius: 14, preset: presetForBox(36, 50) },
    { name: "Plank", x: 478, y: 14, w: 10, h: 99, preset: presetForBox(100, 10) },
    { name: "Cloud", x: 588, y: 55, w: 60, h: 30, preset: presetForBox(85, 58) },
    { name: "Tombstone", x: 741, y: 45, w: 40, h: 45, preset: presetForBox(40, 45) },
    { name: "Snowball", cx: 855, cy: 59, radius: 6, preset: presetForBox(12, 12) },
  ];

  shamanObjects.forEach(object => {
    object.cx = object.cx || (object.x + object.w / 2);
    object.cy = object.cy || (object.y + object.h / 2);
  });

  const bgImage = new Image();
  let bgAlpha = 1.0;
  bgImage.src = 'assets/pk-shop.png';
  bgImage.onload = () => {
    canvasElm.width = bgImage.width;
    canvasElm.height = bgImage.height;
    render();
  }

  id('bgalpha').addEventListener('input', function() {
    bgAlpha = parseInt(this.value, 10);
    bgAlpha = isNaN(bgAlpha) ? 1.0 : Math.max(0, Math.min(100, bgAlpha)) / 100.0;
    render();
  });

  canvasElm.addEventListener("wheel", function(event) {
    if (selected >= objects.length) return;
    event.preventDefault();
    const obj = objects[selected];
    const delta = event.deltaY < 0 ? 1 : -1; // zoom in or out
    setScale(obj, (obj.scale * 100 + delta) / 100);
    render();
    renderRow(selected);
  });

  canvasElm.addEventListener("mousedown", function(event) {
    const rect = canvasElm.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    let found = false;
    
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      if (!obj.cached) updateCachedImage(obj);
      if (mouseX >= obj.x && mouseX <= obj.x + obj.cached.width &&
          mouseY >= obj.y && mouseY <= obj.y + obj.cached.height) {
        selected = i;
        found = true;
        break;
      }
    }

    if (!found) {
      selected = objects.length; // deselect
    }

    renderRow(selected);
  });

  canvasElm.addEventListener("mousemove", function(event) {
    if (selected >= objects.length) return;
    if (event.buttons !== 1) return; // Only move when left mouse button is pressed

    const rect = canvasElm.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const obj = objects[selected];
    if (!obj.cached) updateCachedImage(obj);
    const moveXAmount = mouseX - (obj.x + obj.cached.width / 2);
    const moveYAmount = mouseY - (obj.y + obj.cached.height / 2);
    obj.x += moveXAmount;
    obj.y += moveYAmount;

    render();
    renderRow(selected);
  });

  function centerObject(index, onlyX, onlyY) {
    const obj = objects[index];
    if (!obj || !obj.anchor) return;
    if (!obj.cached) updateCachedImage(obj);

    if (!onlyX && !onlyY || onlyX) obj.x = obj.anchor.cx - obj.cached.width / 2;
    if (!onlyX && !onlyY || onlyY) obj.y = obj.anchor.cy - obj.cached.height / 2;

    render();
  }

  function downloadObject(index) {
    const obj = objects[index];
    if (!obj) return;

    if (!obj.cached) updateCachedImage(obj);
  
    let canvas = id("downloadcanvas");
    let ctx = canvas.getContext("2d");
    canvas.width = obj.cached.width;
    canvas.height = obj.cached.height;
    ctx.drawImage(obj.cached, 0, 0);
  
    const link = document.createElement('a');
    link.download = obj.name + '.png';
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function renderRow(index) {
    const obj = objects[index];
    if (!obj) return;
    const tr = id('objects').querySelector('tr:nth-child(' + (index + 1) + ')');
    if (!tr) return;
    tr.querySelector('td:nth-child(1) > input').checked = (index === selected);
    tr.querySelector('td:nth-child(5) > input').value = obj.scale * 100;
    tr.querySelector('td:nth-child(6) > input').value = obj.scale;
    tr.querySelector('td:nth-child(7)').innerText = (obj.cached?.width || obj.width) + " x " + (obj.cached?.height || obj.height);
  }

  function renderList() {
    const tbody = id('objects');
    let obj, tr, td, input, button, select, option;

    tbody.innerHTML = '';

    for (var i=0; i<objects.length; i++) {
      obj = objects[i];

      // row
      tr = document.createElement('tr');
      tbody.appendChild(tr);

      // select
      td = document.createElement('td');
      tr.appendChild(td);

      input = document.createElement('input');
      td.appendChild(input);
      input.type = "radio";
      input.name = "selected_object";
      input.value = i;
      input.checked = (i === selected);
      input.addEventListener('change', function() {
        selected = parseInt(this.value);
      });

      // name
      td = document.createElement('td');
      tr.appendChild(td);
      td.innerText = obj.name;

      // size
      td = document.createElement('td');
      tr.appendChild(td);
      td.innerText = obj.width + " x " + obj.height;

      // scale preset
      td = document.createElement('td');
      tr.appendChild(td);

      select = document.createElement('select');
      td.appendChild(select);

      option = document.createElement('option');
      option.value = "";
      option.textContent = "— Free —";
      select.appendChild(option);

      shamanObjects.forEach((preset, idx) => {
        option = document.createElement('option');
        option.value = idx;
        option.textContent = preset.name;
        option.selected = obj.anchor == preset;
        select.appendChild(option);
      });

      select.addEventListener('change', function() {
        const index = tr.rowIndex - 1;
        const obj = objects[index];
        if (!this.value) return;

        const anchor = shamanObjects[parseInt(this.value, 10)];
        const preset = anchor.preset(obj.image.width / obj.image.height);

        obj.anchor = anchor;
        setScale(obj, Math.min(preset.w / obj.image.width, preset.h / obj.image.height));

        obj.x = anchor.cx - obj.cached.width / 2;
        obj.y = anchor.cy - obj.cached.height / 2;

        render();
        renderRow(index);
      });

      // scale percent
      td = document.createElement('td');
      tr.appendChild(td);

      input = document.createElement('input');
      td.appendChild(input);
      input.type = "number";
      input.value = obj.scale * 100;
      input.addEventListener('change', function() {
        const index = this.parentNode.parentNode.rowIndex - 1;
        const obj = objects[index];
        setScale(obj, parseFloat(this.value) / 100);
        render();
        renderRow(index);
      });
      td.appendChild(document.createTextNode('%'));

      // scale factor
      td = document.createElement('td');
      tr.appendChild(td);
      input = document.createElement('input');
      td.appendChild(input);
      input.type = "number";
      input.step = 0.1;
      input.value = obj.scale;
      input.addEventListener('change', function() {
        const index = this.parentNode.parentNode.rowIndex - 1;
        const obj = objects[index];
        setScale(obj, parseFloat(this.value));
        render();
        renderRow(index);
      });

      // size after scale
      td = document.createElement('td');
      tr.appendChild(td);
      td.innerText = (obj.cached?.width || obj.width) + " x " + (obj.cached?.height || obj.height);

      // opacity
      td = document.createElement('td');
      tr.appendChild(td);

      input = document.createElement('input');
      td.appendChild(input);
      input.type = "number";
      input.value = 100;
      input.min = 0;
      input.max = 100;
      input.addEventListener('input', function() {
        const index = this.parentNode.parentNode.rowIndex - 1;
        const obj = objects[index];
        obj.opacity = parseFloat(this.value) / 100;
        render();
      });

      // actions
      td = document.createElement('td');
      tr.appendChild(td);

      // delete button
      button = document.createElement('button');
      td.appendChild(button);
      button.index = i;
      button.innerHTML = "Delete";
      button.addEventListener('click', function() {
        objects.splice(this.index, 1);
        renderList();
        render();
      });

      // download button
      button = document.createElement('button');
      td.appendChild(button);
      button.index = i;
      button.innerHTML = "Download";
      button.addEventListener('click', function() {
        downloadObject(this.index);
      });

      // center buttons
      button = document.createElement('button');
      td.appendChild(button);
      button.index = i;
      button.innerHTML = "Center";
      button.addEventListener('click', function() {
        centerObject(this.index);
      });

      button = document.createElement('button');
      td.appendChild(button);
      button.index = i;
      button.innerHTML = "Center X";
      button.addEventListener('click', function() {
        centerObject(this.index, true);
      });

      button = document.createElement('button');
      td.appendChild(button);
      button.index = i;
      button.innerHTML = "Center Y";
      button.addEventListener('click', function() {
        centerObject(this.index, false, true);
      });
    }
  }

  function render() {
    canvasCtx.clearRect(0, 0, canvasElm.width, canvasElm.height);
    canvasCtx.globalAlpha = bgAlpha;
    canvasCtx.drawImage(bgImage, 0, 0);
    canvasCtx.globalAlpha = 1.0;

    for (var i=0; i<objects.length; i++) {
      const obj = objects[i];
      if (!obj.cached) {
        updateCachedImage(obj);
      }
      canvasCtx.globalAlpha = obj.opacity || 1.0;
      canvasCtx.drawImage(obj.cached, obj.x, obj.y);
    }
  }

  function computeBBoxAlphaStrict(imageData) {
    const { width: w, height: h, data } = imageData;
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (data[i + 3] > 0) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX || maxY < minY) return null;
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  }

  function cropImage(image) {
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = image.width;
    srcCanvas.height = image.height;
    const ctx = srcCanvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
  
    const imgData = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
    const box = computeBBoxAlphaStrict(imgData) || { x: 0, y: 0, w: image.width, h: image.height };
  
    const out = document.createElement('canvas');
    out.width = box.w;
    out.height = box.h;
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(srcCanvas, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
  
    return out;
  }

  function updateCachedImage(obj) {
    const w = Math.max(1, Math.round(obj.image.width * obj.scale));
    const h = Math.max(1, Math.round(obj.image.height * obj.scale));
  
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(obj.image, 0, 0, w, h);
    obj.cached = canvas;
  }

  function setScale(obj, scale) {
    if (!obj.cached) updateCachedImage(obj);
    const centerX = obj.x + obj.cached.width / 2;
    const centerY = obj.y + obj.cached.height / 2;
    obj.scale = isNaN(scale) ? 1.0 : scale;
    updateCachedImage(obj);
    obj.x = centerX - obj.cached.width / 2; // recenter x
    obj.y = centerY - obj.cached.height / 2; // recenter y
  }

  window.addImageURL = function(url, name, collision) {
    const image = new Image();
    image.src = url;
    image.decode().then(() => {
      const cropped = cropImage(image);
      objects.push({
        image: cropped,
        cached: null,
        collision,
        name: name ? name.replace(/\.png$/m, "") : url,
        scale: 1,
        x: 0,
        y: 0,
        width: cropped.width,
        height: cropped.height,
      });
      selected = objects.length - 1;
      render();
      renderList();
    });
  }

  function addFiles(fileList) {
    for (const file of fileList) {
      if (!file.type.startsWith("image/")) continue;
  
      const reader = new FileReader();
      reader.onload = () => {
        addImageURL(reader.result, file.name);
      };
      reader.readAsDataURL(file);
    }
  }

  const shopFileInput = document.getElementById('shopfile');
  if (shopFileInput) {
    shopFileInput.addEventListener('change', () => {
      if (shopFileInput.files && shopFileInput.files.length > 0) {
        addFiles(shopFileInput.files);
        shopFileInput.value = "";
      }
    });
  }

  const dropArea = document.getElementById('dropArea');
  if (dropArea) {
    ['dragenter', 'dragover'].forEach(evt =>
      dropArea.addEventListener(evt, e => {
        e.preventDefault();
        dropArea.style.background = "#333";
      })
    );

    ['dragleave', 'drop'].forEach(evt =>
      dropArea.addEventListener(evt, e => {
        e.preventDefault();
        dropArea.style.background = "";
      })
    );

    dropArea.addEventListener("drop", e => {
      e.preventDefault();
      const items = e.dataTransfer.items;
      if (items) {
        const files = [];
        for (const it of items) {
          if (it.kind === "file") files.push(it.getAsFile());
        }
        addFiles(files);
      } else {
        addFiles(e.dataTransfer.files);
      }
    });
  }
})();