(function() {
  let canvasElm = id('shopcanvas');
  let canvasCtx = canvasElm.getContext('2d');
  let objects = [];
  let selected = 0;

  const bgImage = new Image();
  bgImage.src = 'assets/pk-shop.png';
  bgImage.onload = () => {
    canvasElm.width = bgImage.width;
    canvasElm.height = bgImage.height;
    render();
  }

  canvasElm.addEventListener("wheel", function(event) {
    if (selected >= objects.length) return;
    event.preventDefault();
    const obj = objects[selected];
    const delta = event.deltaY < 0 ? 1 : -1; // zoom in or out
    obj.scale = (obj.scale * 10 + delta) / 10;
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
      if (mouseX >= obj.x && mouseX <= obj.x + obj.image.width * obj.scale &&
          mouseY >= obj.y && mouseY <= obj.y + obj.image.height * obj.scale) {
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
    const moveXAmount = mouseX - (obj.x + obj.image.width * obj.scale / 2);
    const moveYAmount = mouseY - (obj.y + obj.image.height * obj.scale / 2);
    obj.x += moveXAmount;
    obj.y += moveYAmount;

    render();
    renderRow(selected);
  });

  function downloadObject(index) {
    const obj = objects[index];
    if (!obj) return;

    let canvas = id("downloadcanvas");
    let ctx = canvas.getContext("2d");
    canvas.width = obj.image.width * obj.scale;
    canvas.height = obj.image.height * obj.scale;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      obj.image,
      0, 0,
      obj.image.width * obj.scale, obj.image.height * obj.scale
    );

    const link = document.createElement('a');
    link.download = obj.name + '.png';
    link.href = canvas.toDataURL();
    link.click();
  }

  function renderRow(index) {
    const obj = objects[index];
    if (!obj) return;
    const tr = id('objects').querySelector('tr:nth-child(' + (index + 1) + ')');
    if (!tr) return;
    tr.querySelector('td:nth-child(1) > input').checked = (index === selected);
    tr.querySelector('td:nth-child(4) > input').value = obj.scale * 100;
    tr.querySelector('td:nth-child(5) > input').value = obj.scale;
    tr.querySelector('td:nth-child(6)').innerText = Math.ceil(obj.width * obj.scale) + " x " + Math.ceil(obj.height * obj.scale);
  }

  function renderList() {
    const tbody = id('objects');
    let obj, tr, td, input, button;

    tbody.innerHTML = '';

    for (var i=0; i<objects.length; i++) {
      obj = objects[i];

      tr = document.createElement('tr');
      tbody.appendChild(tr);

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

      td = document.createElement('td');
      tr.appendChild(td);
      td.innerText = obj.name;

      td = document.createElement('td');
      tr.appendChild(td);
      td.innerText = obj.width + " x " + obj.height;

      td = document.createElement('td');
      tr.appendChild(td);

      input = document.createElement('input');
      td.appendChild(input);
      input.type = "number";
      input.value = obj.scale * 100;
      input.addEventListener('change', function() {
        const index = this.parentNode.parentNode.rowIndex - 1;
        const obj = objects[index];
        obj.scale = parseFloat(this.value) / 100;
        if (isNaN(obj.scale)) obj.scale = 1;
        render();
        renderRow(index);
      });
      td.appendChild(document.createTextNode('%'));

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
        obj.scale = parseFloat(this.value);
        if (isNaN(obj.scale)) obj.scale = 1;
        render();
        renderRow(index);
      });

      td = document.createElement('td');
      tr.appendChild(td);
      td.innerText = obj.width * obj.scale + " x " + obj.height * obj.scale;

      td = document.createElement('td');
      tr.appendChild(td);

      button = document.createElement('button');
      td.appendChild(button);
      button.index = i;
      button.innerHTML = "Delete";
      button.addEventListener('click', function() {
        objects.splice(this.index, 1);
        renderList();
        render();
      });

      button = document.createElement('button');
      td.appendChild(button);
      button.index = i;
      button.innerHTML = "Download";
      button.addEventListener('click', function() {
        downloadObject(this.index);
      });
    }
  }

  function render() {
    canvasCtx.drawImage(bgImage, 0, 0);

    for (var i=0; i<objects.length; i++) {
      const obj = objects[i];
      canvasCtx.drawImage(
        obj.image,
        obj.x, obj.y,
        obj.image.width * obj.scale, obj.image.height * obj.scale
      );
    }
  }

  window.addImageURL = function(url, name) {
    const image = new Image();
    image.src = url;
    image.onload = () => {
      objects.push({
        image,
        name: name ? name.replace(/\.png$/m, "") : url,
        scale: 1,
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
      selected = objects.length - 1;
      render();
      renderList();
    }
  }

  window.addObject = function() {
    const file = id('shopfile').files[0];
    if (!file) {
      return;
    };

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      addImageURL(reader.result, file.name);
    }
  }
})();