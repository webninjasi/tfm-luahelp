const id = selector => document.getElementById(selector);
const defaultContent = id('content').innerHTML;

const replaceTags = html => {
  let treeParent = [];
  let treeLevel = 0;

  return html.replace(/<br\s*\/>/g, "\n")
    .replace("<a href='http://www.lua.org/manual/5.2/manual.html#pdf-debug'>debug</a>", "debug")
    .replace(
      /<D>(.+?)<\/D>/g,
      (_, content) => {
        const id = content.indexOf(' ') == -1 && content;
        return `<D id="${id}">${content}</D>`;
      }
    ).replace(
      /^(\s*)([a-zA-Z]+)$/gm,
      (_, tabs, name) => {
        const level = tabs ? (tabs.length / 2) : 0;
        
        if (level == treeLevel) {
          if (!treeParent.length) {
            treeParent = [name];
          } else {
            treeParent[treeParent.length - 1] = name;
          }
        }
        else if (level > treeLevel) {
          treeParent = [...treeParent, name];
        }
        else {
          treeParent = [...treeParent.slice(0, level), name];
        }

        const id = treeParent.join('_');
        treeLevel = level;

        return `${tabs || ""}<a href="#${id}">${name}</a>`;
      }
    ).replace(
      /<([a-zA-Z]+)(\s*[^>]+?)?>/g,
      (full, tagName, params) => {
        tagName = tagName.toUpperCase();

        if (tagName == 'BR') {
          return full;
        }

        if (tagName == 'D') {
          const id = (params.match(/id="(.+?)"/)?.[1] || "").replace(/\./g, "_");
          return `<a id="${id}" href="#${id}" class="D">`;
        }

        if (tagName == 'A') {
          const href = params.match(/href=(".+?"|'.+?')/)?.[1] || '"#"';
          return `<a href=${href}>`;
        }

        if (tagName == 'P') {
          const align = (params.match(/align=('.+?'|".+?")/)?.[1] || '').replace(/['"]/g, "");
          tagName = align.toLowerCase() == 'right' ? 'TD' : 'TG';
          return `<span class="${tagName}">`;
        }

        if (tagName == 'FONT') {
          const fontSize = parseInt((params.match(/size=('.+?'|".+?")/)?.[1] || "").replace(/['"]/g, "")) || "";
          const color = (params.match(/color=('.+?'|".+?")/)?.[1] || "").replace(/['"]/g, "");
          const css = color ? `color:${color}` : "";
          return `<span class="${tagName}" style="font-size:${fontSize}px;${css}">`;
        }

        return `<span class="${tagName}">`;
      }
    ).replace(
      /<\/([a-zA-Z]+).*?>/g,
      (full, tagName) => {
        tagName = tagName.toUpperCase();

        if (tagName == 'A') {
          return full;
        }

        if (tagName == 'D') {
          return '</a>';
        }

        return `</span>`;
      }
    );
};

const parseSections = html => html.split('<span class="O">').map(
  (section, idx) => (idx ? '<span class="O">' : '') + section.trim()
);

const errorSet = err => {
  id('content').innerHTML = defaultContent;
  id('error').innerHTML = err.stack;
};

const loadVersion = (version, gotoAnchor) => {
  id('current_version').innerHTML = "...";
  id('section_functions').innerHTML = "Loading...";
  id('section_events').innerHTML = "Loading...";
  id('section_lua_tree').innerHTML = "Loading...";

  fetch('raw/' + version)
    .then(data => data.text())
    .then(data => {
      const content = replaceTags(data);
      const sections = parseSections(content);

      id('current_version').innerHTML = sections[0] || version;
      id('section_lua_tree').innerHTML = sections[1] || "";
      id('section_events').innerHTML = sections[2] || "";
      id('section_functions').innerHTML = sections[3] || "";
      id('error').innerHTML = "";

      if (gotoAnchor && window.location.hash) {
        window.location = window.location;
      }
    })
    .catch(err => errorSet(err));
}

fetch('versions')
  .then(data => data.text())
  .then(data => {
    const versions = data.split('\n');
    let currentVersion = versions[0];

    id('versions').innerHTML = versions.map(ver => `<option value="${ver}">${ver}</option>`).join('');
    id('versions').addEventListener('change', () => {
      if (id('versions').value == currentVersion) {
        return;
      }

      currentVersion = id('versions').value;
      loadVersion(currentVersion);
    });

    loadVersion(currentVersion, true);
  })
  .catch(err => errorSet(err));

const updateLuaTreeState = (state) => {
  id('btn_toggle_tree').innerHTML = state ? "Hide Lua Tree" : "Show Lua Tree";
  id('section_lua_tree').style.display = state ? null : 'none';

  if (window.localStorage) {
    localStorage.setItem('hide_lua_tree', JSON.stringify(!state));
  }
}

id('btn_toggle_tree').addEventListener('click', () => {
  const state = id('section_lua_tree').style.display != 'none';
  updateLuaTreeState(!state);
});

if (window.localStorage) {
  const hide = localStorage.getItem('hide_lua_tree') == 'true';

  if (hide) {
    updateLuaTreeState(false);
  }
}
