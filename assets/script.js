const id = selector => document.getElementById(selector);
const byClass = selector => [...document.getElementsByClassName(selector)];
const defaultContent = id('content').innerHTML;
const toggle = elmId => id(elmId).style.display = id(elmId).style.display == "none" ? null : "none";
const copyText = elm => {
  elm.select();
  document.execCommand('copy');
};

const parseFunctionHelp = html => {
  const lines = html.trim().split('\n');
  const [_, name, paramshtml] = lines[0].match(/<D>(.+?)<\/D>\((?:<V>)?(.*?)(?:<\/V>)?\)/);
  const params = paramshtml.split('</V>, <V>');

  let cond = true;
  let lastIdx = 1;

  const description = lines.slice(1).filter((line, idx) => {
    if (!cond) {
      return;
    }

    cond = line.trim().indexOf('<') !== 0;

    if (cond) {
      lastIdx = idx + 1;
    }

    return cond;
  });

  const details = lines.slice(lastIdx + 1).reduce((ret, line) => {
    line = line.trim()

    const tag = line.trim().match(/^<(.+?)>/m)?.[1];

    if (name == "tfm.exec.newGame") {
      console.log(tag);
    }

    if (tag == "V") {
      const [_, name, type, desc, def, other] = line.match(
        /<V>(.+?)<\/V><G> \((.+?)\)<\/G><BL>\s*(.+?)\s*<\/BL>(?: <G>\(default (.+?)(?:\s+(.+?))?\)<\/G>)?/
      );

      ret.params.push({
        name,
        type,
        desc,
        def,
        subparams: other ? [other] : [],
      });
    }
    else if (tag == "BL") {
      const [_, text] = line.match(
        /<BL>\s*\-?(.+?)<\/BL>/
      );
      const desc = text.trim();

      if (ret.params[ret.params.length - 1]) {

        ret.params[ret.params.length - 1].subparams.push(desc);
      } else {
        ret.others.push(desc);
      }
    }
    else if (tag == "R") {
      const [_, type, desc] = line.match(
        /<R>Returns<\/R> <G>\((.+?)\)<\/G> <BL>\s*(.+?)\s*<\/BL>/
      );

      ret.return = {
        type,
        desc,
      };
    }
    else {
      ret.others.push(line);
    }

    return ret;
  }, { "params": [], "others": [] });

  return {
    name,
    params,
    description,
    details,
  };
}

const parseLuaTree = html => {
  let treeParent = [];
  let treeLevel = 0;

  return html.trim().split('<br />').reduce(
    (ret, line, idx) => {
      const href = line.match(/href='(.+?)'/)?.[1];
      const text = line.replace(/<.+?>/g, '');
      const match = text.match(/^(\s*)(.+?)(?: \: (.+?))?$/);

      if (!match) {
        return ret;
      }

      const [_, indent, key, val] = match;
      const level = indent ? (indent.length / 2) : 0;

      if (level == treeLevel) {
        if (!treeParent.length) {
          treeParent = [key];
        } else {
          treeParent[treeParent.length - 1] = key;
        }
      }
      else if (level > treeLevel) {
        treeParent = [...treeParent, key];
      }
      else {
        treeParent = [...treeParent.slice(0, level), key];
      }

      treeLevel = level;

      return [
        ...ret,
        {
          "keys": treeParent,
          "name": treeParent.map(
            (key, idx) => key.match(/^[a-z_][a-z0-9_]*$/i) ? (
              idx ? `.${key}` : key
            ) : (
              idx ? `[${key}]` : `_G[${key}]`
            )
          ).join(''),
          "value": val,
          "href": href,
          "params": [],
        },
      ];
    },
    []
  );
}

const parseRaw = html => {
  const sections = html.split(new RegExp("<O><font size='20'>.+?</font></O>"));
  const version = sections[0].replace(/<.+?>/g, '').trim();
  const luaTree = parseLuaTree(sections[1]);
  const events = sections[2].trim().split('\n\n').map(parseFunctionHelp);
  const functions = sections[3].trim().split('\n\n').map(parseFunctionHelp);

  return {
    version,
    luaTree,
    events,
    functions,
  }
}

const renderSections = sections => {
  id('current_version').innerHTML = `<div class="V TI">${sections.version}</div>`;

  id('section_lua_tree').section = sections.luaTree;
  id('section_lua_tree').innerHTML = '<span class="O" style="font-size: 20px">Lua Tree</span><br /><br />' +
  sections.luaTree.map(elm => `
    <div class="luatree-elm" id="luatree_${elm.name}">
      <a href="#${elm.name}">${elm.name}</a>${elm.value ? ": " : ""}
      <span class="G">${elm.value || ""}</span>
    </div>
  `).join('');

  id('section_events').section = sections.events;
  id('section_events').innerHTML = '<span class="O" style="font-size: 20px">Events</span><br /><br />' +
  sections.events.map(elm => `
    <div class="events-elm" id="events_${elm.name}">
      <a id="${elm.name}" href="#${elm.name}" class="D">${elm.name}</a>
      <span class="N">
        (<span class="V">${elm.params.join('</span>, <span class="V">')}</span>)
      </span>
      <br />
      <span class="N">${elm.description.join('<br />')}</span>
      <br />

      <button onclick="toggle('code_${elm.name}')">Code</button>

      ${(elm.details.others.length || customHelpData[elm.name]?.extra?.length) ? `
      <button onclick="toggle('others_${elm.name}')">More</button>
      ` : ''}

      <div id="code_${elm.name}" style="display: none">
        <textarea onclick="copyText(this)" readonly="readonly">function ${elm.name}(${elm.params.join(', ')})

end</textarea>
      </div>

      ${elm.details.params.length ? `
      <table class="parameter-table" id="table_param_${elm.name}">
      <thead>
        <tr>
          <th class="J">#</th>
          <th class="V">parameter</th>
          <th class="BL">type</th>
          <th>description</th>
        </tr>
      </thead>
      <tbody>
        ${elm.details.params.map(
          (det, idx) => `
          <tr>
            <td class="J">${idx + 1}</td>
            <td class="V">${det.name}</td>
            <td class="BL">${det.type}</td>
            <td>
              ${det.desc}
              ${det.subparams.length ? `
                <br />
                <span class="BL">
                ${det.subparams.join('<br />')}
                </span>
              ` : ''}
            </td>
          </tr>
          `
        ).join('')}
      </tbody>
      </table>
      ` : ''}

      ${(elm.details.others.length || customHelpData[elm.name]?.extra?.length) ? `
      <p class="G" id="others_${elm.name}" style="display: none">
        ${elm.details.others.join('<br />')}
        <br />
        ${customHelpData[elm.name]?.extra?.join('<br />')}
      </p>
      ` : ''}
    </div>
  `).join('');

  id('section_functions').section = sections.functions;
  id('section_functions').innerHTML = '<span class="O" style="font-size: 20px">Functions</span><br /><br />' +
  sections.functions.map(elm => `
    <div class="functions-elm" id="functions_${elm.name}">
      <a id="${elm.name}" href="#${elm.name}" class="D">${elm.name}</a>
      <span class="N">
        (<span class="V">${elm.params.join('</span>, <span class="V">')}</span>)
      </span>
      <br />
      <span class="N">${elm.description.join('<br />')}</span>
      <br />
      <br />

      <button onclick="toggle('code_${elm.name}')">Code</button>

      ${(elm.details.others.length || customHelpData[elm.name]?.extra?.length) ? `
      <button onclick="toggle('others_${elm.name}')">More</button>
      ` : ''}

      <div id="code_${elm.name}" style="display: none">
        <input type="text" value="${elm.name}(${elm.params.join(', ')})" onclick="copyText(this)" readonly="readonly" />
        <br />

        <label>Defaults</label>
        <br />
        <input type="text" value="${elm.name}(${
          elm.params.map((param, i) => elm.details.params[i]?.def || param).join(', ')
        })" onclick="copyText(this)" readonly="readonly" />

        ${customHelpData[elm.name]?.examples?.length ? `
        <br />

        ${customHelpData[elm.name].examples.map((example, idx) => `
        <label>Example ${idx + 1}</label>
        <br />
        <input type="text" value="${elm.name}(${
          elm.params.map((param, i) => example[i] || elm.details.params[i]?.def || param).join(', ')
        })" onclick="copyText(this)" readonly="readonly" />
        `)}
        ` : ''}
      </div>

      ${elm.details.params.length ? `
      <table class="parameter-table" id="table_param_${elm.name}">
      <thead>
        <tr>
          <th class="J">#</th>
          <th class="V">parameter</th>
          <th class="BL">type</th>
          <th class="G">default</th>
          <th>description</th>
        </tr>
      </thead>
      <tbody>
        ${elm.details.params.map(
          (det, idx) => `
          <tr>
            <td class="J">${idx + 1}</td>
            <td class="V">${det.name}</td>
            <td class="BL">${det.type}</td>
            <td class="G">${det.def || '-'}</td>
            <td>
              ${det.desc}
              ${det.subparams.length ? `
                <br />
                <span class="BL">
                ${det.subparams.join('<br />')}
                </span>
              ` : ''}
            </td>
          </tr>
          `
        ).join('')}
      </tbody>
      </table>
      ` : ''}

      ${(elm.details.others.length || customHelpData[elm.name]?.extra?.length) ? `
      <p class="G" id="others_${elm.name}" style="display: none">
        ${elm.details.others.join('<br />')}
        <br />
        ${customHelpData[elm.name]?.extra?.join('<br />')}
      </p>
      ` : ''}
    </div>
  `).join('');

  id('error').innerHTML = "";
  id('input_filter').value = "";
}

const errorSet = err => {
  id('content').innerHTML = defaultContent;
  id('error').innerHTML = err.stack;
};

const loadVersion = (version, gotoAnchor, errorCallback) => {
  id('current_version').innerHTML = "...";
  id('section_functions').innerHTML = "Loading...";
  id('section_events').innerHTML = "Loading...";
  id('section_lua_tree').innerHTML = "Loading...";

  fetch('raw/' + version)
    .then(resp => {
      if (resp.status != 200) {
        throw new Error('Something went wrong try again!')
      }
      return resp;
    })
    .then(data => data.text())
    .then(data => {
      const sections = parseRaw(data);

      sections.version = sections.version || version;

      console.log(sections);
      renderSections(sections);

      if (gotoAnchor && window.location.hash) {
        window.location = window.location;
      }

      if (window.localStorage) {
        localStorage.setItem('last_version', version);
      }
    })
    .catch(errorCallback);
}

// Load latest version initially
fetch('versions')
  .then(resp => {
    if (resp.status != 200) {
      throw new Error('Something went wrong try again!')
    }
    return resp;
  })
  .then(data => data.text())
  .then(data => {
    const versions = data.split('\n');
    let currentVersion = window.localStorage?.getItem('last_version') || versions[0];

    id('versions').innerHTML = versions.map(
      ver => `<option value="${ver}"${ver == currentVersion ? "selected" : ""}>${ver}</option>`
    ).join('');
    id('versions').addEventListener('change', () => {
      if (id('versions').value == currentVersion) {
        return;
      }

      currentVersion = id('versions').value;
      loadVersion(currentVersion, false, (err) => errorSet(err));
    });

    loadVersion(
      currentVersion,
      true,
      () => loadVersion(versions[0], true, (err) => errorSet(err))
    );
  })
  .catch(err => errorSet(err));

// Lua Tree Toggle
const updateLuaTreeState = (state) => {
  id('btn_toggle_tree').innerHTML = state ? "Hide Lua Tree" : "Show Lua Tree";
  id('section_lua_tree').style.display = state ? null : 'none';

  if (window.localStorage) {
    localStorage.setItem('show_lua_tree', JSON.stringify(state));
  }
}

id('btn_toggle_tree').addEventListener('click', () => {
  const state = id('section_lua_tree').style.display != 'none';
  updateLuaTreeState(!state);
});

if (window.localStorage) {
  const show = localStorage.getItem('show_lua_tree') == 'true';

  if (show) {
    updateLuaTreeState(true);
  }
}

// Filter functions/events
const filterContent = (className, elmId, value, reg) => {
  if (!value) {
    byClass(className).map(elm => elm.style.display = null);
    return;
  }

  const section = id(elmId).section;

  if (!section) {
    return;
  }

  byClass(className)
    .map((elm, idx) => {
      const cond = !!section[idx].name.match(reg) || section[idx].params && section[idx].params.some(
        param => !!param.match(reg)
      );
      elm.style.display = cond ? null : "none";
    });
};

id('input_filter').addEventListener('keyup', () => {
  const value = id('input_filter').value.trim();
  const reg = new RegExp(value, 'i');

  filterContent('luatree-elm', 'section_lua_tree', value, reg);
  filterContent('events-elm', 'section_events', value, reg);
  filterContent('functions-elm', 'section_functions', value, reg);
});

// Toggle between row/column mode
const updateRowcol = (state) => {
  id('btn_toggle_rowcol').innerHTML = state ? "Columns" : "Rows";
  id('sections').style.flexDirection = state ? "column" : null;

  if (window.localStorage) {
    localStorage.setItem('row_mode', JSON.stringify(state));
  }
}

id('btn_toggle_rowcol').addEventListener('click', () => {
  const state = id('sections').style.flexDirection == 'column';
  updateRowcol(!state);
});

if (window.localStorage) {
  const state = localStorage.getItem('row_mode') == 'true';

  if (state) {
    updateRowcol(true);
  }
}
