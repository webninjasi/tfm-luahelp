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

const getPathParent = (name) => name.split('.').slice(0, -1).join('.')
const getPathLast = (name) => name.split('.').slice(-1)[0]
const convertLuaPath = (name) => name.split('.').map(
  (key, idx) => key.match(/^[a-z_][a-z0-9_]*$/i) ? (
    idx ? `.${key}` : key
  ) : (
    `${idx ? '' : '_G'}[${isNaN(parseInt(key)) ? `"${key}"` : key}]`
  )
).join('')

// obj1: raw data
// obj2: help data
const mergeObjects = (obj1, obj2) => {
  if (typeof(obj1) == 'object' && typeof(obj2) == 'object') {
    if (Array.isArray(obj1)) {
      if (typeof(obj1[0]) != 'object') {
        if (obj2.replace) {
          return obj2.list;
        } else {
          return [
            ...obj1,
            ...obj2,
          ];
        }
      }

      const nameMap1 = obj1.reduce((ret, x) => ({ ...ret, [x.name]: x }), {});
      const nameMap2 = obj2.reduce((ret, x) => ({ ...ret, [x.name]: x }), {});

      return [
        ...obj1.filter(x => !nameMap2[x.name]),
        ...obj2.filter(x => !nameMap1[x.name]),
        ...obj1.filter(x => nameMap2[x.name]).map(
          x => mergeObjects(x, nameMap2[x.name])
        ),
      ];
    }

    return {
      ...Object.keys(obj1).reduce(
        (ret, key) => ({ ...ret, [key]: mergeObjects(obj1[key], obj2[key]) }),
        {}
      ),
      ...Object.keys(obj2).reduce(
        (ret, key) => ({ ...ret, [key]: mergeObjects(obj1[key], obj2[key]) }),
        {}
      ),
    };
  }

  return obj2 || obj1;
}

const compareObjects = (obj1, obj2, filter) => {
  if (obj1 == obj2) {
    return obj1;
  }

  if (typeof(obj1) == 'object' && typeof(obj2) == 'object') {
    if (!obj1 || !obj2) {
      return {
        "added": obj1,
        "removed": obj2,
        "diff": true,
      };
    }

    if (Array.isArray(obj1)) {
      if (typeof(obj1[0]) != 'object') {
        // Hopefully they don't change order of parameters
        const ret = [
          ...obj1.slice(0, Math.min(obj2.length, obj1.length)).map((x, i) => compareObjects(x, obj2[i])),
          ...obj2.slice(obj1.length).map(x => compareObjects(null, x)),
          ...obj1.slice(obj2.length).map(x => compareObjects(x, null)),
        ];

        if (ret.filter((x, i) => obj1[i] != x).length == 0) {
          return obj1;
        }

        return ret;
      }

      const nameMap1 = obj1.reduce((ret, x) => ({ ...ret, [x.name]: x }), {});
      const nameMap2 = obj2.reduce((ret, x) => ({ ...ret, [x.name]: x }), {});

      if (filter) {
        return [
          ...obj1.filter(x => !nameMap2[x.name]).map(
            x => ({ ...x, diff: "added" })
          ),
          ...obj2.filter(x => !nameMap1[x.name]).map(
            x => ({ ...x, diff: "removed" })
          ),
          ...obj1.filter(x => nameMap2[x.name]).map(
            x => compareObjects(x, nameMap2[x.name])
          ).filter(x => x != nameMap1[x.name]),
        ];
      }

      let ret = [
        ...obj1.filter(x => !nameMap2[x.name]).map(
          x => compareObjects(x, null)
        ),
        ...obj2.filter(x => !nameMap1[x.name]).map(
          x => compareObjects(null, x)
        ),
        ...obj1.filter(x => nameMap2[x.name]).map(
          x => compareObjects(x, nameMap2[x.name])
        ),
      ];

      if (ret.filter(x => x != nameMap1[x.name]).length == 0) {
        return obj1;
      }

      return ret;
    }

    const keys = [
      ...Object.keys(obj1),
      ...Object.keys(obj2),
    ];
    let ret = keys.reduce(
      (ret, key) => ({ ...ret, [key]: compareObjects(obj1[key], obj2[key]) }),
      {}
    );

    if (keys.filter(key => ret[key] != obj1[key]).length == 0) {
      return obj1;
    }

    return ret;
  }

  return {
    "added": obj1,
    "removed": obj2,
    "diff": true,
  };
}

// v1 is latest version
const compareVersions = (v1, v2) => {
  const version = v2.version;
  const tree = compareObjects(v1.tree, v2.tree, true);
  const events = compareObjects(v1.events, v2.events, true);
  const functions = compareObjects(v1.functions, v2.functions, true);

  return {
    version,
    tree,
    events,
    functions,
  }
}

const cmpPathParent = (pathParent, cmpParent, tree) => {
  if (cmpParent) {
    return pathParent == cmpParent;
  }

  return tree.filter(x => x.name == pathParent).length == 0;
}

const copyPath = (elm, path) => {
  const value = convertLuaPath(path);
  return copyText(elm, value);
}

const renderDiff = x => `
${x.added ? ('<span class="item-added">' + x.added + '</span> ') : ''}
${x.removed ? ('<span class="item-removed">' + x.removed + '</span>') : ''}
${!x.added && !x.removed ? x : ''}
`.trim();

const renderLuaTreeItem = (tree, elm) => `
  <tr class="luatree-elm" id="${elm.name}">
    <td>
      <button class="btn-small" onclick="copyPath('luatree_input', '${elm.name}')">Copy</button>
    </td>
    <td>
      ${elm.diff == 'added' ? '<span class="item-added">+</span>' : ''}
      ${elm.diff == 'removed' ? '<span class="item-removed">-</span>' : ''}
      <a href="${elm.href ? elm.href : `#${elm.name}`}">${getPathLast(elm.name)}</a>
    </td>
    <td class="G">
      ${elm.value ? renderDiff(elm.value) : renderLuaTreeTable(tree, elm.name)}
    </td>
  </tr>
`;

const renderLuaTreeTable = (tree, parent) => `<table class="parameter-table">
<tbody>
${
  tree.filter(
    x => getPathParent(x.name) == parent
  ).map(x => renderLuaTreeItem(tree, x)).join('')
}
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

// Examples doesn't handle diffs since it doesn't apply extras on diff view
const renderEventExamples = elm => `
<textarea onclick="copyText(this)" readonly="readonly">function ${elm.name}(${elm.parameters.list.join(', ')})

end</textarea>
`;

const renderFunctionExamples = elm => `
  <input type="text" value="${elm.name}(${elm.parameters ? elm.parameters.list.join(', ') : ''})" onclick="copyText(this)" readonly="readonly" />
  <br />
  <br />

  <label>Defaults</label>
  <br />
  <input type="text" value="${elm.name}(${
    elm.parameters ? elm.parameters.list.map(
      (param, i) => elm.parameters.details[i]?.default_value || param
    ).join(', ') : ''
  })" onclick="copyText(this)" readonly="readonly" />

  ${elm.examples?.length ? `
  <br />
  <br />

  ${elm.examples.map((example, idx) => `
  <label>Example ${idx + 1}</label>
  <br />
  <input type="text" value="${elm.name}(${
    elm.parameters ? elm.parameters.list.map(
      (param, i) => example[i] || elm.parameters.details[i]?.default_value || param
    ).join(', ') : ''
  })" onclick="copyText(this)" readonly="readonly" />
  `)}
  ` : ''}
`;

const renderParameter = type => (param, idx) => `
<tr>
  <td class="J">${idx + 1}</td>
  <td class="V">${param.name}</td>
  <td class="BL">${renderDiff(param.type)}</td>
  ${type == "functions" ? `<td class="G">${renderDiff(param.default_value || '-')}</td>` : ''}
  <td>
    ${param.descriptions.slice(0, 1).map(renderDiff).join('')}
    ${param.descriptions.length > 1 ? `
      <br />
      <span class="BL">
      ${param.descriptions.slice(1).map(renderDiff).join('<br />')}
      </span>
    ` : ''}
  </td>
</tr>
`

const renderReturn = (param, idx) => `
<tr>
  <td class="R">${idx + 1}</td>
  <td class="R">Returns</td>
  <td class="BL">${param.type || "-"}</td>
  <td class="G">-</td>
  <td>${renderDiff(param.description || "")}</td>
</tr>
`

const renderRestriction = restriction => {
  if (restriction == "modules") {
    return `<span class="ROSE">Only available for</span> <span class="FC">FunCorp</span>/<span class="MT">Module Team</span><br />`;
  }

  if (restriction == "events") {
    return `<span class="ROSE">Only available for</span> <span class="ES">Event Modules</span><br />`;
  }

  return '';
}

const renderFunction = type => elm => `
<div class="${type}-elm" id="${type}_${elm.name}">
  ${elm.diff == "added" ? '<span class="item-added">+</span>' : ''}
  ${elm.diff == "removed" ? '<span class="item-removed">-</span>' : ''}
  <a id="${elm.name}" href="#${elm.name}" class="D">${elm.name}</a>
  <span class="N">
    (<span class="V">
    ${
      elm.parameters ? elm.parameters.list.map(renderDiff).join('</span>, <span class="V">') : ''
    }
    </span>)
  </span>
  <br />
  ${renderRestriction(elm.restricted)}
  <span class="N">
  ${
    elm.descriptions ? elm.descriptions.map(renderDiff).join('<br />') : ''
  }
  </span>
  <br />
  <br />

  <button onclick="toggle('code_${elm.name}')">Code</button>

  <div id="code_${elm.name}" style="display: none">
    <br />
    ${type == 'functions' ? renderFunctionExamples(elm) : renderEventExamples(elm)}
  </div>

  ${elm.parameters?.details?.length ? `
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
    ${elm.parameters?.details?.map(renderParameter(type)).join('')}
    ${elm.returns ? renderReturn(elm.returns, elm.parameters?.details?.length || 0) : ''}
  </tbody>
  </table>
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

  id('section_luatree').section = sections.tree;
  id('section_luatree').parentIndex = sections.parentIndex;
  id('section_luatree').innerHTML = renderLuaTree(sections.tree);
  id('section_luatree').sectionElements = sections.tree.reduce(
    (ret, item) => ({
      ...ret,
      [item.name]: byClass('luatree-elm').filter(x => x.id == item.name)[0]
    }),
    {}
  );

  id('section_events').section = sections.events;
  id('section_events').innerHTML = renderEvents(sections.events);
  id('section_events').sectionElements = sections.events.reduce(
    (ret, item) => ({
      ...ret,
      [item.name]: id('events_' + item.name)
    }),
    {}
  );

  id('section_functions').section = sections.functions;
  id('section_functions').innerHTML = renderFunctions(sections.functions);
  id('section_functions').sectionElements = sections.functions.reduce(
    (ret, item) => ({
      ...ret,
      [item.name]: id('functions_' + item.name)
    }),
    {}
  );

  id('error').innerHTML = "";
  id('input_filter').value = "";
}

const errorSet = err => {
  id('content').innerHTML = defaultContent;
  id('error').innerHTML = err.stack;
  console.error(err.stack);
};

let latestVersion;
let loadedVersions = {};

const applyReplacements = tree => tree.map(item => ({
  ...item,
  "name": item.name.split('.').map(
    part => luatreeReplacements[part] || part
  ).join('.'),
  "value": item.value && luatreeReplacements[item.value] || item.value,
}));

// This is required to make diff keep parents in lua tree
const scanTree = tree => tree.map(item => {
  item.children = tree.filter(x => getPathParent(x.name) == item.name);
  return item;
});

const createParentIndex = (sections) => {
  sections.parentIndex = {};
  sections.tree.map((item, index) => {
    sections.tree.filter(
      x => getPathParent(x.name) == item.name
    ).map(
      x => sections.parentIndex[x.name] = index
    );
  });
  console.log("parentIndex", sections.parentIndex);
}

const loadVersion = (version, initial, errorCallback) => {
  id('current_version').innerHTML = "...";
  id('section_functions').innerHTML = "Loading...";
  id('section_events').innerHTML = "Loading...";
  id('section_luatree').innerHTML = "Loading...";

  const isExtra = version == 'latest+';
  const versionPath = (isExtra || version == latestVersion) ? 'latest' : version;

  function render(sections) {
    if (versionPath == 'latest') {
      if (isExtra) {
        sections = mergeObjects(sections, customHelpData);
        sections.tree = applyReplacements(sections.tree);
        console.log("merged", sections);
      }
    } else {
      sections = compareVersions(loadedVersions["latest"], sections);
      console.log("diff", version, sections);
    }

    createParentIndex(sections);
    renderSections(sections);

    if (initial) {
      loadToggles();

      if (window.location.hash) {
        window.location = window.location;
      }
    }
  }

  if (loadedVersions[versionPath]) {
    try {
      render(loadedVersions[versionPath]);
    }
    catch (err) {
      errorCallback(err);
    }

    return;
  }

  fetch('parsed/' + versionPath)
    .then(resp => {
      if (resp.status != 200) {
        throw new Error('Something went wrong try again!')
      }
      return resp;
    })
    .then(data => data.json())
    .then(sections => {
      sections.version = sections.version || versionPath;
      scanTree(sections.tree);
      console.log("loaded", versionPath, sections);
      loadedVersions[versionPath] = sections;
      render(sections);
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
    const defaultVersion = 'latest+';
    let currentVersion = defaultVersion;
    latestVersion = versions[0];

    id('versions').innerHTML = ['latest+', ...versions].map(
      (ver, idx) => `
        <option value="${ver}"${ver == currentVersion ? "selected" : ""}>
          ${idx == 0 ? ver : ''}
          ${idx == 1 ? `latest (${ver})` : ''}
          ${idx >= 2 ? `latest vs ${ver}` : ''}
        </option>
      `.trim()
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
      () => loadVersion(defaultVersion, true, (err) => errorSet(err))
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
  const parentIndex = id(elmId).parentIndex;
  const sectionElements = id(elmId).sectionElements;

  if (!section) {
    return;
  }

  section.map(item => {
    const cond = (
      !!item.name.match(reg) || // alternatively getPathLast can be applied
      item.parameters?.list && item.parameters.list.some(
        param => !!param.match(reg)
      ) ||
      item.value && !!item.value.match(reg)
    );

    sectionElements[item.name].style.display = cond ? null : "none";

    if (cond && parentIndex) {
      let index = parentIndex[item.name];

      while (index != null) {
        sectionElements[section[index].name].style.display = null;
        index = parentIndex[section[index].name];
      }
    }
  });
};

id('input_filter').addEventListener('keyup', () => {
  const value = id('input_filter').value.trim();
  const reg = new RegExp(value, 'i');

  filterContent('luatree-elm', 'section_luatree', value, reg);
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

function loadToggles() {
  if (window.localStorage) {
    const state = localStorage.getItem('row_mode') == 'true';
  
    if (state) {
      updateRowcol(true);
    }
  
    // Load toggles
    const toggles = getToggles();
    Object.keys(toggles).map(elmId => {
      const elm = id("toggle_" + elmId.split('_', 2)[1]);

      if (elm) {
        elm.checked = toggles[elmId];
        id(elmId).style.display = toggles[elmId] ? null : "none";
      }
    });
  }
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

id('toggle_luatree').addEventListener('change', function() {
  saveToggle('section_luatree', this.checked);
});
