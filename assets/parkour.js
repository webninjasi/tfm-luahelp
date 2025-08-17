(function() {
  let canvasElm = id('shopcanvas');
  let canvasCtx = canvasElm.getContext('2d');
  let objects = [];
  let selected = 0;

  canvasElm.width = 800;
  canvasElm.height = 400;

  const centerX = canvasElm.width / 2;
  const centerY = canvasElm.height / 2;

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
    {
      name: "Small Box",
      image: "small-box.png",
      collision: { x: centerX - 15, y: centerY - 15, w: 31, h: 31 },
      preset: presetForBox(30, 30),
    },
    {
      name: "Big Box",
      image: "big-box.png",
      collision: { x: centerX - 29, y: centerY - 30, w: 61, h: 61 },
      preset: presetForBox(60, 60),
    },
    {
      name: "Trampoline",
      image: "trampoline.png",
      collision: { x: centerX - 48, y: centerY + 3, w: 98, h: 8 },
      preset: presetForBox(100, 20),
    },
    {
      name: "Balloon",
      image: "balloon.png",
      collision: { x: centerX - 1, y: centerY, radius: 14 },
      preset: presetForBox(36, 50),
    },
    {
      name: "Plank",
      image: "plank.png",
      collision: { x: centerX - 50, y: centerY - 6, w: 100, h: 11 },
      preset: presetForBox(100, 10),
    },
    {
      name: "Cloud",
      image: "cloud.png",
      collision: { x: centerX - 30, y: centerY - 14, w: 61, h: 31 },
      preset: presetForBox(85, 58),
    },
    {
      name: "Tombstone",
      image: "tombstone.png",
      collision: { x: centerX - 20, y: centerY - 23, w: 41, h: 46 },
      preset: presetForBox(40, 45),
    },
    {
      name: "Snowball",
      image: "snowball.png",
      collision: { x: centerX, y: centerY, radius: 6 },
      preset: presetForBox(12, 12),
    },
  ];

  shamanObjects.forEach(object => {
    const image = new Image();
    image.src = 'assets/images/' + object.image;
    object.image = image;
  });

  let bgAlpha = 1.0;
  let bgSelected;

  id('bgalpha').addEventListener('input', function() {
    bgAlpha = parseInt(this.value, 10);
    bgAlpha = isNaN(bgAlpha) ? 1.0 : Math.max(0, Math.min(100, bgAlpha)) / 100.0;
    render();
  });

  let drawCollision = false;
  id('drawcollision').addEventListener('change', function() {
    drawCollision = this.checked;
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
    
    for (let i = objects.length - 1; i >= 0; i--) { // check from top to bottom
      const obj = objects[i];
      if (!obj.cached) updateCachedImage(obj);
      if (mouseX >= obj.x && mouseX <= obj.x + obj.cached.width &&
          mouseY >= obj.y && mouseY <= obj.y + obj.cached.height) {
        found = true;
        setSelected(i);
        break;
      }
    }

    if (!found) {
      setSelected(objects.length); // deselect
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

    updateCollision(obj);

    if (obj.collision && bgSelected && bgSelected.collision) {
      if (checkCollision(obj, bgSelected)) {
        clampToBorder(obj, bgSelected);
      }
    }

    render();
    renderRow(selected);
  });

  function clampToBorder(moving, fixed) {
    const a = moving.collision;
    const b = fixed.collision;
  
    // Rect vs Rect
    if (a.w && a.h && b.w && b.h) {
      const dx = (a.x + a.w/2) - (b.x + b.w/2);
      const dy = (a.y + a.h/2) - (b.y + b.h/2);
      const overlapX = (a.w/2 + b.w/2) - Math.abs(dx);
      const overlapY = (a.h/2 + b.h/2) - Math.abs(dy);
  
      if (overlapX > 0 && overlapY > 0) {
        if (overlapX < overlapY) {
          moving.x += dx > 0 ? overlapX : -overlapX;
        } else {
          moving.y += dy > 0 ? overlapY : -overlapY;
        }
        updateCollision(moving);
      }
      return;
    }
  
    // Circle vs Circle
    if (a.radius && b.radius) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const overlap = (a.radius + b.radius) - dist;
  
      if (overlap > 0 && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        moving.x += nx * overlap;
        moving.y += ny * overlap;
        updateCollision(moving);
      }
      return;
    }

    // Circle vs Rect
    if (a.radius && b.w && b.h) {
      clampRectCircle(moving, fixed);
      return;
    }

    // Rect vs Circle
    if (a.w && a.h && b.radius) {
      console.warn("Clamping rect to circle not implemented yet");
      return;
    }
  }

  function clampRectCircle(moving, fixed) {
    const circle = moving.collision;
    const rect = fixed.collision;

    // Find closest point on rectangle to circle center
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));

    // Vector from closest point to circle center
    let dx = circle.x - closestX;
    let dy = circle.y - closestY;
    const distSq = dx * dx + dy * dy;

    // Circle center is inside rectangle
    if (distSq === 0) {
      const distances = [
        { dist: Math.abs(circle.x - rect.x), dx: -1, dy: 0 },               // left
        { dist: Math.abs(circle.x - (rect.x + rect.w)), dx: 1, dy: 0 },    // right
        { dist: Math.abs(circle.y - rect.y), dx: 0, dy: -1 },               // top
        { dist: Math.abs(circle.y - (rect.y + rect.h)), dx: 0, dy: 1 }     // bottom
      ];
      const minDist = distances.reduce((a, b) => a.dist < b.dist ? a : b);
      moving.x += minDist.dx * (circle.radius + minDist.dist);
      moving.y += minDist.dy * (circle.radius + minDist.dist);
      updateCollision(moving);
    } else {
      // Circle overlapping rectangle
      const dist = Math.sqrt(distSq);
      if (dist < circle.radius) {
        const pushDist = circle.radius - dist;
        moving.x += (dx / dist) * pushDist;
        moving.y += (dy / dist) * pushDist;
        updateCollision(moving);
      }
    }
  }

  function centerObject(index, onlyX, onlyY) {
    const obj = objects[index];
    if (!obj) return;
    if (!obj.cached) updateCachedImage(obj);
    if (!onlyX && !onlyY || onlyX) obj.x = centerX - obj.cached.width / 2;
    if (!onlyX && !onlyY || onlyY) obj.y = centerY - obj.cached.height / 2;

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
    tr.querySelector('td:nth-child(5) > input').value = (obj.scale * 100).toFixed(2);
    tr.querySelector('td:nth-child(6) > input').value = obj.scale.toFixed(3);
    tr.querySelector('td:nth-child(7) > input:nth-child(1)').value = (obj.cached?.width || obj.width);
    tr.querySelector('td:nth-child(7) > input:nth-child(2)').value = (obj.cached?.height || obj.height);
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
        setSelected(parseInt(this.value));
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

      if (!obj.collision) {
        shamanObjects.forEach((preset, idx) => {
          option = document.createElement('option');
          option.value = idx;
          option.textContent = preset.name;
          option.selected = obj.anchor == preset;
          select.appendChild(option);
        });

        select.addEventListener('change', function() {
          const index = this.parentNode.parentNode.rowIndex - 1;
          const obj = objects[index];
          const anchor = shamanObjects[parseInt(this.value, 10)];

          if (!anchor) {
            delete obj.anchor;
            return;
          }

          const preset = anchor.preset(obj.image.width / obj.image.height);

          obj.anchor = anchor;
          setScale(obj, Math.min(preset.w / obj.image.width, preset.h / obj.image.height));

          obj.x = centerX - obj.cached.width / 2;
          obj.y = centerY - obj.cached.height / 2;

          setSelected(index);
          render();
          renderRow(index);
        });
      }

      // scale percent
      td = document.createElement('td');
      tr.appendChild(td);

      input = document.createElement('input');
      td.appendChild(input);
      input.type = "number";
      input.value = (obj.scale * 100).toFixed(2);
      input.addEventListener('change', function() {
        const index = this.parentNode.parentNode.rowIndex - 1;
        const obj = objects[index];
        setScale(obj, parseFloat(this.value) / 100);
        setSelected(index);
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
      input.value = obj.scale.toFixed(3);
      input.addEventListener('change', function() {
        const index = this.parentNode.parentNode.rowIndex - 1;
        const obj = objects[index];
        setScale(obj, parseFloat(this.value));
        setSelected(index);
        render();
        renderRow(index);
      });

      // set size
      td = document.createElement('td');
      tr.appendChild(td);

      input = document.createElement('input');
      td.appendChild(input);
      input.type = "number";
      input.step = 1;
      input.value = obj.cached?.width || obj.width;
      input.addEventListener('change', function() {
        const index = this.parentNode.parentNode.rowIndex - 1;
        const obj = objects[index];
        const newScale = parseInt(this.value) / obj.width;
        setScale(obj, newScale);
        setSelected(index);
        render();
        renderRow(index);
      });

      td.appendChild(document.createTextNode(' x '));

      input = document.createElement('input');
      td.appendChild(input);
      input.type = "number";
      input.step = 1;
      input.value = obj.cached?.height || obj.height;
      input.addEventListener('change', function() {
        const index = this.parentNode.parentNode.rowIndex - 1;
        const obj = objects[index];
        const newScale = parseInt(this.value) / obj.height;
        setScale(obj, newScale);
        setSelected(index);
        render();
        renderRow(index);
      });

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
        setSelected(index);
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

    if (bgSelected) {
      canvasCtx.globalAlpha = bgAlpha;
      canvasCtx.drawImage(bgSelected.image, centerX - bgSelected.image.width / 2, centerY - bgSelected.image.height / 2);
      canvasCtx.globalAlpha = 1.0;

      if (drawCollision && bgSelected.collision) {
        if (bgSelected.collision.w && bgSelected.collision.h) {
          canvasCtx.strokeStyle = "#7F4C7F";
          canvasCtx.lineWidth = 2;
          canvasCtx.strokeRect(bgSelected.collision.x, bgSelected.collision.y, bgSelected.collision.w, bgSelected.collision.h);
        } else if (bgSelected.collision.radius) {
          canvasCtx.beginPath();
          canvasCtx.strokeStyle = "#7F4C7F";
          canvasCtx.lineWidth = 2;
          canvasCtx.arc(bgSelected.collision.x, bgSelected.collision.y, bgSelected.collision.radius, 0, 2 * Math.PI);
          canvasCtx.stroke();
        }
      }
    }

    for (var i=0; i<objects.length; i++) {
      const obj = objects[i];
      if (!obj.cached) {
        updateCachedImage(obj);
      }
      canvasCtx.globalAlpha = obj.opacity || 1.0;
      canvasCtx.drawImage(obj.cached, obj.x, obj.y);

      if (drawCollision && obj.collision && obj.collision.radius) {
        updateCollision(obj);
        canvasCtx.beginPath();
        canvasCtx.strokeStyle = "#7F4C7F";
        canvasCtx.lineWidth = 2;
        canvasCtx.arc(obj.collision.x, obj.collision.y, obj.collision.radius, 0, 2 * Math.PI);
        canvasCtx.stroke();
      }
    }
  }

  function rectRectCollide(a, b) {
    return !(a.x + a.w < b.x ||
             a.x > b.x + b.w ||
             a.y + a.h < b.y ||
             a.y > b.y + b.h);
  }
  
  function circleCircleCollide(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    return dist <= (a.radius + b.radius);
  }
  
  function rectCircleCollide(rect, circ) {
    const centerInside = circ.x >= rect.x && circ.x <= rect.x + rect.w &&
                         circ.y >= rect.y && circ.y <= rect.y + rect.h;
    if (centerInside) return true;
  
    const closestX = Math.max(rect.x, Math.min(circ.x, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(circ.y, rect.y + rect.h));
    const dx = circ.x - closestX;
    const dy = circ.y - closestY;
    return (dx*dx + dy*dy) <= (circ.radius * circ.radius);
  }

  function checkCollision(a, b) {
    if (!a.collision || !b.collision) return false;
  
    const ca = a.collision;
    const cb = b.collision;
  
    // rect vs rect
    if (ca.w && ca.h && cb.w && cb.h) return rectRectCollide(ca, cb);
  
    // circle vs circle
    if (ca.radius && cb.radius) return circleCircleCollide(ca, cb);
  
    // rect vs circle
    if (ca.w && ca.h && cb.radius) return rectCircleCollide(ca, cb);
    if (cb.w && cb.h && ca.radius) return rectCircleCollide(cb, ca);
  
    return false;
  }

  function updateCollision(obj) {
    if (!obj.collision || !obj.cached) return;
  
    if (obj.collision.w && obj.collision.h) {
      obj.collision.x = obj.x;
      obj.collision.y = obj.y;
      obj.collision.w = obj.cached.width;
      obj.collision.h = obj.cached.height;
    }
    if (obj.collision.radius) {
      obj.collision.x = obj.x + obj.cached.width / 2 + obj.collision.cx;
      obj.collision.y = obj.y + obj.cached.height / 2 + obj.collision.cy;
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

  function setSelected(index) {
    const obj = objects[index];
    selected = index;

    if (obj && obj.anchor) {
      bgSelected = obj.anchor;
      render();
    }

    if ((selected || selected === 0) && !isNaN(selected) && selected < objects.length) {
      renderRow(selected);
    }
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

  document.addEventListener('dragover', (e) => {
    e.preventDefault()
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault()
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
})();