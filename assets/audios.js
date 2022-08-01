(function() {
  const url = "https://audio.atelier801.com/sounds.html";

  const id = selector => document.getElementById(selector);
  const defaultContent = id('audio-wrapper').innerHTML;


  // Init
  let audioList = load();
  let refreshing = false;
  let filterText = '';

  if (audioList) {
    updateContent();
  } else {
    refreshCache();
  }

  id('input_filter').addEventListener('keyup', () => {
    filterText = id('input_filter').value.trim();
    filterContent();
  });

  id('btn_refresh').addEventListener('click', () => {
    refreshCache();
  });

  window.copyText = function(elm) {
    elm.select();
    document.execCommand('copy');
  }

  // Functions
  function refreshCache() {
    if (refreshing) {
      return;
    }

    id('audio-wrapper').innerHTML = "Loading...";
    refreshing = true;

    fetch(url)
      .then(resp => resp.text())
      .then(html => {
        audioList = parseAudioList(html, customAudioTags);
        updateContent();
        save(audioList);
        refreshing = false;
      })
      .catch(err => {
        errorSet(err);
        refreshing = false;
      });
  }

  function filterContent() {
    if (!filterText) {
      const audios = [ ...document.getElementsByClassName('audio') ];
      audios.map(elm => { elm.style.display = ''; });
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

    audioList.map((audio, idx) => {
      const visible = regs.every(reg => audio.tags.match(reg));

      id('audio-' + idx).style.display = visible ? null : 'none';
    });
  }

  function updateContent() {
    if (!audioList) {
      return;
    }

    id('audio-wrapper').innerHTML = audioList.map((audio, idx) => `
<div class="audio" id="audio-${idx}">
  <input onclick="copyText(this)" value="${audio.id}" readonly="readonly" />
  <div class="audio-tags"><div><i>${audio.tags}</i></div></div>
  <audio controls preload="none">
    <source src="https://audio.atelier801.com/${audio.url}" type="audio/mp3">
  </audio>
</div>
    `).join('');
  }

  function parseAudioList(html, audios) {
    const list = [
      ...html.matchAll(/^.+?<a href="(.+?\.mp3)">(.+?)<\/a><br>$/gm)
    ];
    return list.map(match => ({
      "id": match[1].substring(2, match[1].length - 4),
      "name": match[2].substring(0, match[2].length - 4),
    })).map(audio => ({
      ...audio,
      "url": audio.id + '.mp3',
      "tags": [
        ...audio.id.split('/'),
        ...(audios[audio.id] || [])
      ].join(', ')
    }));
  }

  function errorSet(err) {
    id('audio-wrapper').innerHTML = defaultContent;
    id('error').innerHTML = err.stack;
    console.error(err.stack);
  };

  function load() {
    if (!window.localStorage) {
      return;
    }
    
    const listStr = localStorage.getItem('luahelp_audiolist');

    if (listStr) {
      try {
        return JSON.parse(listStr);
      }
      catch (err) {
        errorSet(err);
        return;
      }
    }
  }

  function save(list) {
    if (!window.localStorage) {
      return;
    }
    
    return localStorage.setItem('luahelp_audiolist', JSON.stringify(list));
  }
})();
