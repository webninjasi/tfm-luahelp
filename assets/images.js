(function() {
  const defaultContent = id('image-wrapper').innerHTML;

  let localImages = {};
  let currentOverlayImgId;
  let imageCount = 0;
  let pageCount = 0;
  let imageList = [];

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

  id('input_filter').addEventListener('keyup', () => {
    filterText = id('input_filter').value.trim();
    render();
  });

  id('add_image_input').addEventListener('change', function() {
    id('add_image_output').value = [
        ...this.value.replace(/https?\S+/g, '').matchAll(
          /^(\s*[a-z0-9]{11}\.(?:png|jpg|jpeg|gif))?(.+?)?$/mig
        )
      ]
      .map(m => ({
        "image": m[1] && m[1].trim(),
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

    return images.map(image => regs.every(reg => allImages[image].match(reg)));
  }

  function renderSingleImage(image, idx) {
    return `
<div class="image" id="image-${idx}">
  <input onclick="copyText(this)" value="${image}" readonly="readonly" />
  <br />
  <div class="image-tags">
    <div>
      <i>${allImages[image]}</i>
      <br />
      <br />
      <img class="image-img" src="http://images.atelier801.com/${image}" data-code="${image}" data-islocal="${Boolean(localImages[image])}" loading="lazy" />
      <p class="image-dimensions"></p>
      <p class="image-date">${new Date(parseInt(image, 16)).toLocaleString()}</p>
    </div>
  </div>
</div>`;
  }

  function renderPagination(pageCount) {
    id('pagination').innerHTML = (new Array(pageCount)).fill(1).map(
      (_, i) => '<button onclick="page(' + i + ')">' + (i+1) + '</button>'
    ).join('');
  }

  function render() {
    if (!allImages) {
      return;
    }

    renderPagination(pageCount);

    const images = filterContent(imageList.slice(page * pageSize, (page + 1) * pageSize));

    id('image-wrapper').innerHTML = images.map(
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
    imageCount = imageList.length;
    pageCount = Math.ceil(imageCount / pageSize);
    imageList.sort((a, b) => {
      if (sortKind == 'timestamp') {
        if (sortDir == 'asc') {
          return parseInt(a, 16) - parseInt(b, 16);
        }
        return parseInt(b, 16) - parseInt(a, 16);
      }
    });
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
