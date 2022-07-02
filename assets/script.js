
const id = selector => document.getElementById(selector);
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
          return `<a id="${id}" class="D">`;
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
const errorSet = err => {
  id('content').innerHTML = "";
  id('error').innerHTML = err;
};
const loadVersion = (version) => {
  id('content').innerHTML = "Loading...";

  fetch('raw/' + version)
    .then(data => data.text())
    .then(data => {
      const content = replaceTags(data);

      id('content').innerHTML = content;
      id('error').innerHTML = "";
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

    loadVersion(currentVersion);
  })
  .catch(err => errorSet(err));
