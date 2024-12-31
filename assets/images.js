(function() {
  const defaultContent = id('image-wrapper').innerHTML;

  let localImages = {};
  let currentOverlayImgId;
  let imageCount = 0;
  let pageCount = 0;
  let imageList = [];
  let pageImages = [];

  let filterText = '';
  let page = 0;
  let pageSize = 30;
  let sortKind = 'timestamp';
  let sortDir = 'asc';

  window.load = (btn, elmId, image) => {
    btn.style.display = "none";
    id(elmId).src = `http://images.atelier801.com/${image}`;
    id(elmId).style.display = null;
  };

  window.page = function(value) {
    page = value;
    update();
    render();
  }
  window.paginate = function(value) {
    page = 0;
    pageSize = value;
    update();
    render();
  }
  window.sortBy = function(value) {
    sortKind = value;
    update();
    render();
  }
  window.sortDirection = function(value) {
    sortDir = value;
    update();
    render();
  }

  window.addPrivate = () => {
    const newImages = JSON.parse('{' + id('add_image_output').value + '}');
    let count = 0;

    for (let id in newImages) {
      if (!allImages[id]) {
        count ++;
      }

      localImages[id] = newImages[id];
    }

    save();
    load();
    update();
    render();

    id('add_image_result').innerHTML = `Added ${count} new images!`;
  }

  // https://stackoverflow.com/questions/45831191/generate-and-download-file-from-js
  function download(filename, data) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  window.export_local = () => {
    download("luahelp-images-local.json", JSON.stringify(localImages, null, '  '));
  }

  id('image_overlay_delete').addEventListener('click', function() {
    if (currentOverlayImgId == null) {
      return;
    }

    if (!localImages[currentOverlayImgId]) {
      return;
    }

    delete localImages[currentOverlayImgId];
    delete allImages[currentOverlayImgId];

    toggle('image_overlay', false);
    save();
    update();
    render();
  });

  load();
  update();
  render();

  id('input_filter').addEventListener('keyup', debounce(() => {
    filterText = id('input_filter').value.trim();
    update();
    render();
  }), 500);

  id('add_image_input').addEventListener('change', function() {
    id('add_image_output').value = [
        ...this.value.replace(/https?\S+/g, '').matchAll(
          /^(\s*(?:img@)?[a-z0-9]{11}(?:\.(?:png|jpg|jpeg|gif))?)?(.+?)?$/mig
        )
      ]
      .map(m => ({
        "image": m[1] && m[1].trim().toLowerCase(),
        "tags": m[2] ? m[2].replace(/[^a-z0-9,\s]+/ig, '').trim().toLowerCase() : null
      }))
      .filter(x => x.tags || x.image)
      .reduce(
        (ret, line) => {
          if (!line.image) {
            ret.__tags = line.tags
            return ret;
          }

          if (line.tags) {
            if (ret.__tags) {
              line.tags = ret.__tags + ', ' + line.tags;
            }
          } else {
            line.tags = ret.__tags || '';
          }

          ret.push(`"${line.image}": "${line.tags}"`)
          
          return ret;
        },
        []
      )
      .join(',\n');
  });


  function filterContent(images) {
    if (!filterText) {
      return images;
    }

    let regs;

    try {
      regs = filterText.split(' ').filter(Boolean).map(
        part => new RegExp(part, 'i')
      );
    }
    catch(err) {
      console.error(err.message);
      return images;
    }

    return images.filter(image => regs.every(reg => allImages[image].match(reg)) || regs.every(reg => image.match(reg)));
  }

  function getImageTimestamp(image) {
    return parseInt(image.indexOf('img@') == 0 ? image.substr(4) : image, 16);
  }

  function renderSingleImage(image, idx) {
    var url = image.indexOf('img@') == 0 ? `https://wsrv.nl/?url=http://avatars.atelier801.com/module/${image.substr(4)}.png` : `http://images.atelier801.com/${image}`;
    return `
<div class="image" id="image-${idx}">
  <div class="image-tags">
    <div>
      <img class="image-img" src="${url}" data-code="${image}" data-islocal="${Boolean(localImages[image])}" loading="lazy" />
      <p class="image-dimensions"></p>
      <p class="image-date">${new Date(getImageTimestamp(image)).toLocaleString()}</p>
      <i>${allImages[image]}</i>
    </div>
  </div>
  <input onclick="copyText(this)" value="${image}" readonly="readonly" />
</div>`;
  }

  function renderPagination(pageCount) {
    id('pagination').innerHTML = (new Array(pageCount)).fill(1).map(
      (_, i) => '<button' + (page == i ? ' class="current-page"': '') + ' onclick="page(' + i + ')">' + (i+1) + '</button>'
    ).join('');
  }

  function render() {
    if (!allImages) {
      return;
    }

    renderPagination(pageCount);

    id('image-wrapper').innerHTML = pageImages.map(
      (image, idx) => renderSingleImage(image, idx)
    ).join('');

    const imageElms = [...document.getElementsByClassName('image-img')];
    imageElms.map(
      elm => {
        elm.addEventListener('load', function() {
          if (this.nextElementSibling.className == "image-dimensions") {
            this.nextElementSibling.innerHTML = `${this.naturalWidth}x${this.naturalHeight}`;
          }
        });
  
        elm.addEventListener('click', function() {
          currentOverlayImgId = this.dataset.code;
          id('image_overlay_delete').style.display = this.dataset.islocal == 'false' ? 'none' : null;
          id('image_overlay_img').src = this.src;
          id('image_overlay').style.display = 'block';
          id('image_overlay_id').value = this.dataset.code;
          id('image_overlay_code').value = `tfm.exec.addImage("${this.dataset.code}", "!1", 0, 30, nil, 1, 1, 0, 1, 0, 0, false)`;
          id('image_overlay_code2').value = `{"${this.dataset.code}", ${this.naturalWidth}, ${this.naturalHeight}},`;
        });
      }
    );
  }

  function errorSet(err) {
    id('image-wrapper').innerHTML = defaultContent;
    id('error').innerHTML = err.stack;
    console.error(err.stack);
  }

  function update() {
    imageList = Object.keys(allImages);
    const images = filterContent(imageList);
    imageCount = images.length;
    pageCount = Math.ceil(imageCount / pageSize);
    images.sort((a, b) => {
      if (sortKind == 'timestamp') {
        if (sortDir == 'asc') {
          return getImageTimestamp(a) - getImageTimestamp(b);
        }
        return getImageTimestamp(b) - getImageTimestamp(a);
      }
    });
    pageImages = filterContent(images.slice(page * pageSize, (page + 1) * pageSize));
  }

  function load() {
    if (!window.localStorage) {
      return;
    }

    const privateCollection = JSON.parse(localStorage.getItem('privateCollection') || '{}');

    if (!Object.keys(privateCollection).length) {
      return;
    }

    localImages = {};

    for (let id in privateCollection) {
      allImages[id] = privateCollection[id] ? ('local, ' + privateCollection[id]) : 'local';
      localImages[id] = privateCollection[id];
    }
  }

  function save() {
    if (!window.localStorage) {
      return;
    }

    if (!Object.keys(localImages).length) {
      localStorage.removeItem('privateCollection');
      return;
    }

    localStorage.setItem('privateCollection', JSON.stringify(localImages));
  }
})();
