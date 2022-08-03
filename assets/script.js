const luatreeReplacements = {
  "Tigrounette": "Tigrounette#0001",
  "Pikashu": "Pikashu#0095",
};

const id = selector => document.getElementById(selector);
const byClass = selector => [...document.getElementsByClassName(selector)];
const defaultContent = id('content').innerHTML;
const toggle = (elmId, value) => id(elmId).style.display = (value == null && id(elmId).style.display == "none" || value) ? null : "none";
const copyText = (elm, value) => {
  if (typeof(elm) == "string") {
    elm = id(elm);
  }

  if (value) {
    elm.value = value;
  }

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

  const custom = customHelpData[name];

  if (custom) {
    if (custom.extra?.length) {
      details.others = [
        ...details.others,
        ...custom.extra
      ];
    }

    const customParams = custom.params;

    if (customParams) {
      details.params = details.params.map(param => customParams[param.name]?.subparams?.length ? ({
        ...param,
        "subparams": [
          ...param.subparams,
          ...customParams[param.name]?.subparams
        ],
      }) : param);
    }
  }

  return {
    name,
    params,
    description,
    details,
  };
}

const parseLuaTree = html => {
  let tree = {};
  let treeParent = [];
  let treeLevel = 0;

  return Object.keys(customHelpData)
    .filter(key => customHelpData[key].luatree)
    .map(key => {
      // Fill empty fields in custom tree items
      const obj = customHelpData[key].luatree;

      obj.name = obj.name || key;
      obj.keys = obj.keys || obj.name.split('.');
      obj.id = obj.keys.join('.');
      obj.parent = obj.keys.slice(0, -1).join('.');
      obj.children = [];

      return obj;
    })
    .reduce((list, obj) => {
      // Merge custom and parsed tree
      const item = list.filter(it => it.name == obj.name)[0];

      if (item) {
        item.id = obj.id || item.id;
        item.parent = obj.parent || item.parent;
        item.name = obj.name || item.name;
        item.keys = obj.keys || item.keys;
        item.value = obj.value || item.value;
        item.href = obj.href || item.href;
        item.children = [];
      } else {
        list.push(obj);
      }

      return list;
    },
    html.trim().split('<br />').reduce(
      (ret, line) => {
        const href = line.match(/href='(.+?)'/)?.[1];
        const text = line.replace(/<.+?>/g, '');
        const match = text.match(/^(\s*)(.+?)(?: \: (.+?))?$/);

        if (!match) {
          return ret;
        }

        let [_, indent, key, val] = match;
        const level = indent ? (indent.length / 2) : 0;

        key = luatreeReplacements[key] || key;
        val = luatreeReplacements[val] || val;

        // Find parent child table relation using indentation level
        if (level == treeLevel) {
          if (!treeParent.length) {
            treeParent = [key];
          } else {
            treeParent = [...treeParent.slice(0, -1), key];
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
            "parent": treeParent.slice(0, -1).join('.'),
            "id": treeParent.join('.'),
            "name": treeParent.map(
              (key, idx) => key.match(/^[a-z_][a-z0-9_]*$/i) ? (
                idx ? `.${key}` : key
              ) : (
                `${idx ? '' : '_G'}[${isNaN(parseInt(key)) ? `"${key}"` : key}]`
              )
            ).join(''),
            "value": val,
            "href": href,
            "children": [],
          },
        ];
      },
      []
    )).sort((a, b) => a.name.localeCompare(b.name))
    .map((item, idx) => {
      tree[item.id] = item;
      item.index = idx;

      if (tree[item.parent]) {
        tree[item.parent].children.push(item);
        item.parentIndexes = [
          ...(item.parentIndexes || []),
          ...(tree[item.parent].parentIndexes || []),
          tree[item.parent].index,
        ];
      }

      return item;
    });
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

const renderLuaTreeItem = elm => `
  <tr class="luatree-elm" ${(elm.children.length || elm.value) ? `id="${elm.id}"` : ''}>
    <td>
      <button class="btn-small" onclick="copyText('luatree_input', '${elm.name}')">Copy</button>
    </td>
    <td>
      <a href="${elm.href ? elm.href : `#${elm.id}`}">${elm.keys[elm.keys.length - 1]}</a>
    </td>
    <td class="G">
      ${
        elm.children.length ? renderLuaTreeTable(elm.children, elm.id) : (elm.value || "")
      }
    </td>
  </tr>
`;

const renderLuaTreeTable = (tree, parent) => `<table class="parameter-table">
<tbody>
  ${tree.filter(elm => elm.parent == parent).map(renderLuaTreeItem).join('')}
</tbody>
</table>
`;

const renderLuaTree = tree => `<span class="O section-head">Lua Tree</span>
<br />
<br />
<input id="luatree_input" type="text" readonly="readonly" />
<br />
<br />
${renderLuaTreeTable(tree, '')}
`;

const renderEventExamples = elm => `
<textarea onclick="copyText(this)" readonly="readonly">function ${elm.name}(${elm.params.join(', ')})

end</textarea>
`;

const renderFunctionExamples = elm => `
  <input type="text" value="${elm.name}(${elm.params.join(', ')})" onclick="copyText(this)" readonly="readonly" />
  <br />
  <br />

  <label>Defaults</label>
  <br />
  <input type="text" value="${elm.name}(${
    elm.params.map((param, i) => elm.details.params[i]?.def || param).join(', ')
  })" onclick="copyText(this)" readonly="readonly" />

  ${customHelpData[elm.name]?.examples?.length ? `
  <br />
  <br />

  ${customHelpData[elm.name].examples.map((example, idx) => `
  <label>Example ${idx + 1}</label>
  <br />
  <input type="text" value="${elm.name}(${
    elm.params.map((param, i) => example[i] || elm.details.params[i]?.def || param).join(', ')
  })" onclick="copyText(this)" readonly="readonly" />
  `)}
  ` : ''}
`;

const renderParameter = type => (param, idx) => `
<tr>
  <td class="J">${idx + 1}</td>
  <td class="V">${param.name}</td>
  <td class="BL">${param.type}</td>
  ${type == "functions" ? `<td class="G">${param.def || '-'}</td>` : ''}
  <td>
    ${param.desc}
    ${param.subparams.length ? `
      <br />
      <span class="BL">
      ${param.subparams.join('<br />')}
      </span>
    ` : ''}
  </td>
</tr>
`

const renderFunction = type => elm => `
<div class="${type}-elm" id="${type}_${elm.name}">
  <a id="${elm.name}" href="#${elm.name}" class="D">${elm.name}</a>
  <span class="N">
    (<span class="V">${elm.params.join('</span>, <span class="V">')}</span>)
  </span>
  <br />
  <span class="N">${elm.description.join('<br />')}</span>
  <br />
  <br />

  <button onclick="toggle('code_${elm.name}')">Code</button>

  ${elm.details.others.length ? `
  <button onclick="toggle('others_${elm.name}')">More</button>
  ` : ''}

  <div id="code_${elm.name}" style="display: none">
    <br />
    ${type == 'functions' ? renderFunctionExamples(elm) : renderEventExamples(elm)}
  </div>

  ${elm.details.params.length ? `
  <br />
  <br />
  <table class="parameter-table" id="table_param_${elm.name}">
  <thead>
    <tr>
      <th class="J">#</th>
      <th class="V">parameter</th>
      <th class="BL">type</th>
      ${type == "functions" ? '<th class="G">default</th>' : ''}
      <th>description</th>
    </tr>
  </thead>
  <tbody>
    ${elm.details.params.map(renderParameter(type)).join('')}
  </tbody>
  </table>
  ` : ''}

  ${elm.details.others.length ? `
  <p class="G" id="others_${elm.name}" style="display: none">
    ${elm.details.others.join('<br />')}
  </p>
  ` : ''}
</div>
`;

const renderFunctions = functions => `<span class="O section-head">Functions</span>
<br />
<br />
${functions.map(renderFunction('functions')).join('')}
`;

const renderEvents = events => `<span class="O section-head">Events</span>
<br />
<br />
${events.map(renderFunction('events')).join('')}
`;

const renderSections = sections => {
  id('current_version').innerHTML = `<div class="V TI">${sections.version}</div>`;

  id('section_lua_tree').section = sections.luaTree;
  id('section_lua_tree').innerHTML = renderLuaTree(sections.luaTree);

  id('section_events').section = sections.events;
  id('section_events').innerHTML = renderEvents(sections.events);

  id('section_functions').section = sections.functions;
  id('section_functions').innerHTML = renderFunctions(sections.functions);

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

  const elements = byClass(className);

  elements
    .map((elm, idx) => {
      const cond = !!section[idx].name.match(reg) || section[idx].params && section[idx].params.some(
        param => !!param.match(reg)
      );

      elm.style.display = cond ? null : "none";

      if (cond && section[idx].parentIndexes) {
        for (let index of section[idx].parentIndexes) {
          elements[index].style.display = null;
        }
      }
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

// Toggle save/load
const getToggles = () => {
  if (window.localStorage) {
    return JSON.parse(localStorage.getItem('toggles') || "{}");
  }

  return {};
}

const saveToggle = (elmId, value) => {
  toggle(elmId, value);

  if (window.localStorage) {
    localStorage.setItem('toggles', JSON.stringify({
      ...getToggles(),
      [elmId]: value
    }));
  }
}


// Init
if (window.localStorage) {
  const state = localStorage.getItem('row_mode') == 'true';

  if (state) {
    updateRowcol(true);
  }

  // Load toggles
  const toggles = getToggles();
  Object.keys(toggles).map(elmId => {
    id("toggle_" + elmId.split('_')[1]).checked = toggles[elmId];
    id(elmId).style.display = toggles[elmId] ? null : "none";
  });
}

id('btn_toggle_rowcol').addEventListener('click', function() {
  const state = id('sections').style.flexDirection == 'column';
  updateRowcol(!state);
});

id('toggle_functions').addEventListener('change', function() {
  saveToggle('section_functions', this.checked);
});

id('toggle_events').addEventListener('change', function() {
  saveToggle('section_events', this.checked);
});

id('toggle_lua_tree').addEventListener('change', function() {
  saveToggle('section_lua_tree', this.checked);
});
