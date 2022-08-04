(function() {
  const id = selector => document.getElementById(selector);
  const toggle = (elmId, value) => id(elmId).style.display = (value == null && id(elmId).style.display == "none" || value) ? 'block' : "none";
  const defaultContent = id('image-wrapper').innerHTML;

  window.toggle = toggle;
  window.load = (btn, elmId, image) => {
    btn.style.display = "none";
    id(elmId).src = `http://images.atelier801.com/${image}`;
    id(elmId).style.display = null;
  };

  // Init
  let filterText = '';

  updateContent();

  id('input_filter').addEventListener('keyup', () => {
    filterText = id('input_filter').value.trim();
    filterContent();
  });

  window.selectText = function(elm) {
    elm.select();
  }

  window.copyText = function(elm) {
    elm.select();
    document.execCommand('copy');
  }

  const imageElms = [...document.getElementsByClassName('image-img')];
  imageElms.map(
    elm => {
      elm.addEventListener('load', function() {
        if (this.nextElementSibling.className == "image-dimensions") {
          this.nextElementSibling.innerHTML = `${this.naturalWidth}x${this.naturalHeight}`;
        }
      });

      elm.addEventListener('click', function() {
        id('image_overlay_img').src = this.src;
        id('image_overlay').style.display = 'block';
        id('image_overlay_id').value = this.dataset.code;
        id('image_overlay_code').value = `tfm.exec.addImage("${this.dataset.code}", "!1", 0, 30, nil, 1, 1, 0, 1, 0, 0, false)`;
      });
    }
  );

  id('add_image_input').addEventListener('change', function() {
    id('add_image_output').value = [
        ...this.value.replace(/https?\S+/g, '').matchAll(
          /^(?:(\s*[a-z0-9]+\.[a-z]{3})? +?)?(.+?)$/mig
        )
      ]
      .map(m => ({
        "image": m[1] && m[1].trim(),
        "tags": m[2].replace(/[^a-z0-9,\s]+/ig, '').trim().toLowerCase()
      }))
      .reduce(
        (ret, line) => {
          if (!line.image) {
            ret.__tags = line.tags
            return ret;
          }

          ret.push(`"${line.image}": "${ret.__tags ? ret.__tags + ", " : ""}${line.tags}",`)
          
          return ret;
        },
        []
      )
      .join('\n');
  });

  // Functions
  function filterContent() {
    if (!filterText) {
      const images = [ ...document.getElementsByClassName('image') ];
      images.map(elm => { elm.style.display = ''; });
      return;
    }

    let regs;

    try {
      regs = filterText.split(' ').filter(Boolean).map(
        part => new RegExp(part, 'i')
      );
    }
    catch(err) {
      console.error(err.message);
      return;
    }

    Object.keys(allImages).map((image, idx) => {
      const visible = regs.every(reg => allImages[image].match(reg));

      id('image-' + idx).style.display = visible ? null : 'none';
    });
  }

  function updateContent() {
    if (!allImages) {
      return;
    }

    id('image-wrapper').innerHTML = Object.keys(allImages).map(
      (image, idx) => `
<div class="image" id="image-${idx}">
  <input onclick="copyText(this)" value="${image}" readonly="readonly" />
  <br />
  <div class="image-tags">
    <div>
      <i>${allImages[image]}</i>
      <br />
      <br />
      <img class="image-img" src="http://images.atelier801.com/${image}" data-code="${image}" loading="lazy" />
      <p class="image-dimensions"></p>
    </div>
  </div>
</div>
    `).join('');
  }

  function errorSet(err) {
    id('image-wrapper').innerHTML = defaultContent;
    id('error').innerHTML = err.stack;
    console.error(err.stack);
  };
})();
