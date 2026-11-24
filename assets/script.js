const luatreeReplacements = {
  "Tigrounette": "Tigrounette#0001",
  "Pikashu": "Pikashu#0095",
};

// Keys in parsed/runtime.json that are placeholders for dynamic keys
const runtimeKeyReplacements = {
  '["Player#0000"]': 'Tigrounette', // luatreeReplacements turns this into Tigrounette#0001
};

const runtimeFormat = 1;
const module801EventNames = [
  'eventMessageReceive',
  'eventPlayerConnected',
  'eventPlayerDisconnected',
  'eventPlayerJoinRoom',
  'eventPlayerLeaveRoom',
  'eventRoomCreated',
];
const runtimeTypeColors = {
  string: 'T',
  number: 'J',
  boolean: 'CH',
  function: 'VP',
  table: 'BV',
};

let latestVersion;
let lastRendered;
let loadedVersions = {};
let runtimeData; // promise, fetched lazily for 'latest+'
let luaDocsData; // promise, fetched lazily for 'latest+'

const loadRuntime = () => runtimeData = runtimeData || fetch('parsed/runtime.json')
  .then(resp => resp.ok ? resp.json() : null)
  .catch(err => (console.warn('runtime.json not loaded', err), null));

const loadLuaDocs = () => luaDocsData = luaDocsData || fetch('parsed/luadocs.json')
  .then(resp => resp.ok ? resp.json() : null)
  .catch(err => (console.warn('luadocs.json not loaded', err), null));

// /luahelp text can contain literal code, existing entities are kept
const escapeDocText = text => typeof(text) == 'string'
  ? text.replace(/&(?!#?\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  : text;

const escapeDocEntries = entries => entries.forEach(entry => {
  [entry, ...(entry.parameters?.details || [])].forEach(item => {
    if (Array.isArray(item.descriptions)) {
      item.descriptions = item.descriptions.map(escapeDocText);
    }
  });

  if (entry.returns?.description) {
    entry.returns.description = escapeDocText(entry.returns.description);
  }
});

const customTexts = x => Array.isArray(x) ? x : x?.list || [];

// Records which parts of an entry come from data/help.js instead of /luahelp
const createExtra = (base, custom) => {
  const baseParams = new Map((base?.parameters?.details || []).map(x => [x.name, x]));
  const descriptions = new Set(customTexts(custom.descriptions).filter(x => !base?.descriptions?.includes(x)));
  const params = Object.fromEntries(customTexts(custom.parameters?.details).map(param => {
    const baseParam = baseParams.get(param.name);

    return [param.name, {
      texts: new Set(customTexts(param.descriptions).filter(x => !baseParam?.descriptions?.includes(x))),
      default: !!param.default_value && param.default_value != baseParam?.default_value,
      type: !!param.type && param.type != baseParam?.type,
    }];
  }));
  const hasParams = Object.values(params).some(x => x.texts.size || x.default || x.type);
  const extra = {
    isNew: !base,
    descriptions,
    params,
    returns: !!custom.returns,
    examples: !!custom.examples,
    access: !!custom.restricted,
  };

  return !base || descriptions.size || hasParams || extra.returns || extra.examples || extra.access ? extra : null;
};

const annotateExtras = (merged, base, custom) => {
  const annotate = key => merged[key].map(item => {
    const customItem = custom[key].find(x => x.name == item.name);
    const extra = customItem && createExtra(base[key].find(x => x.name == item.name), customItem);
    return extra ? { ...item, extra } : item;
  });

  return { ...merged, functions: annotate('functions'), events: annotate('events'), hasSources: true };
};

const sortByName = items => [...items].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

// "f (a [, b [, c]])" -> ['b', 'c']
const getOptionalParams = signature => {
  const tokens = signature.slice(signature.indexOf('(')).replace(/(&middot;)+/g, '...').replace(/&[a-z]+;/gi, ' ');
  let depth = 0;

  return (tokens.match(/\[|\]|\.\.\.|[a-z_]\w*/gi) || []).filter(token => {
    depth += token == '[' ? 1 : token == ']' ? -1 : 0;
    return depth > 0 && token != '[' && token != ']';
  });
};

// Structured entries replace the raw manual text
const applyLuaGuide = (fn, guide) => guide ? {
  ...fn,
  luaGuide: true,
  descriptions: [escapeDocText(guide.description)],
  parameters: {
    ...fn.parameters,
    details: (guide.params || []).map(([name, type, description, defaultValue]) => ({
      name,
      type,
      descriptions: [escapeDocText(description)],
      ...(defaultValue != null ? { default_value: defaultValue } : {}),
    })),
  },
  ...(guide.returns ? {
    returns: guide.returns.map(([type, description]) => ({ type, description: escapeDocText(description) })),
  } : {}),
  examples: guide.examples || [],
} : fn;

const createLuaFunction = (item, luaDoc) => ({
  name: item.name,
  href: item.href,
  restricted: item.restricted,
  parameters: {
    list: [...luaDoc.params, ...(luaDoc.signature.includes('&middot;') ? ['...'] : [])],
    details: [],
  },
  descriptions: [luaDoc.text],
  optionalParams: getOptionalParams(luaDoc.signature),
  luaDoc,
});

// Adds the functions documented in the Lua manual to the functions section (does not mutate input)
const mergeLuaDocs = (sections, docs, guides) => {
  if (!docs?.entries) {
    return sections;
  }

  const names = new Set(sections.functions.map(x => x.name));
  const added = sections.tree.flatMap(item => {
    const luaDoc = docs.entries[item.href?.split('#pdf-')[1]];
    return luaDoc?.signature?.includes('(') && !names.has(item.name) ? [applyLuaGuide(createLuaFunction(item, luaDoc), guides?.[item.name])] : [];
  });

  return {
    ...sections,
    functions: sortByName([...sections.functions, ...added]),
  };
};

const luaEscapes = {
  '\\': '\\\\',
  '"': '\\"',
  '\x07': '\\a',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\v': '\\v',
};

const escapeLuaChar = char => luaEscapes[char] || `\\${String(char.charCodeAt(0)).padStart(3, '0')}`;
const escapeAttr = value => escapeHTML(value).replace(/"/g, '&quot;');

// Renders a Lua string literal, escape sequences are highlighted
const renderLuaString = value => `"${String(value).split(/([\\"\x00-\x1f\x7f])/).map(
  (part, idx) => idx % 2 ? `<span class="CE">${escapeHTML(escapeLuaChar(part))}</span>` : escapeHTML(part)
).join('')}"`;

// { a: { children: { b: {...} } } } -> [{ name: 'a' }, { name: 'a.b' }]
const flattenRuntime = (nodes, prefix = '') => Object.entries(nodes || {}).flatMap(
  ([key, node]) => {
    const name = prefix + (runtimeKeyReplacements[key] || key);
    return [
      {
        name,
        type: node.type,
        value: node.value,
        java: node.java,
        ref: node.ref,
        childCount: Object.keys(node.children || {}).length,
      },
      ...(node.children ? flattenRuntime(node.children, name + '.') : []),
    ];
  }
);

// Adds runtime info to an already merged 'latest+' sections object (does not mutate input)
const mergeRuntime = (sections, runtime) => {
  if (!runtime || runtime.format != runtimeFormat) {
    return sections;
  }

  const flat = flattenRuntime(runtime.globals);
  const flatByName = new Map(flat.map(r => [r.name, r]));
  const tree = sections.tree.map(x => ({ ...x }));
  const treeByName = new Map(tree.map(x => [x.name, x]));

  // Only API classes identify a function, stdlib classes are shared by many
  const namesByJava = flat.filter(r => r.java?.includes('luapi_')).reduce(
    (ret, r) => ret.set(r.java, [...(ret.get(r.java) || []), r.name]),
    new Map()
  );
  flat.forEach(r => {
    r.aliases = (namesByJava.get(r.java) || []).filter(name => name != r.name);
  });

  flat.forEach(r => {
    const item = treeByName.get(r.name);

    if (!item) {
      tree.push({ name: r.name, runtime: r, undocumented: true });
      return;
    }

    if (r.value != null && item.value && item.value != '-') {
      r.matchesDocs = unescapeHTML(item.value) == String(r.value);

      if (!r.matchesDocs) {
        r.documented = item.value;
      }
    }

    item.runtime = r;
  });

  const eventNames = new Set(sections.events.map(x => x.name));
  const runtimeEvents = (runtime.events || []).filter(name => !eventNames.has(name)).map(name => {
    const isModule801 = module801EventNames.includes(name);

    return {
      name,
      undocumented: true,
      ...(isModule801 ? { restricted: 'module801' } : {}),
      parameters: { list: [], details: [] },
      descriptions: [
        isModule801
          ? 'Likely a leftover from code shared with Module 801, a former framework for building Atelier 801 games. The Lua runtime still looks for this event at startup but never triggers it, so handlers won\'t run. Listed here for reference.'
          : 'Discovered at runtime, not documented in /luahelp yet.',
      ],
    };
  });

  const functions = sections.functions.map(x => flatByName.has(x.name) ? { ...x, runtime: flatByName.get(x.name) } : x);
  const functionNames = new Set(functions.map(x => x.name));

  // Aliases are only known at runtime, they share the data of the documented function
  const aliases = functions.flatMap(x => (x.runtime?.aliases || []).filter(
    name => !functionNames.has(name) && functionNames.add(name)
  ).map(name => ({ ...x, name, runtime: flatByName.get(name), aliasOf: x.name })));

  return {
    ...sections,
    tree,
    events: [...sections.events, ...runtimeEvents],
    functions: sortByName([...functions, ...aliases]),
    runtimeInfo: {
      collectedAt: runtime.collected_at,
      complete: runtime.complete,
      module801: runtimeEvents.filter(x => x.restricted == 'module801').length,
      luahelpVersions: {
        api: treeByName.get('tfm.get.misc.apiVersion')?.value,
        tfm: treeByName.get('tfm.get.misc.transformiceVersion')?.value,
      },
      runtimeVersions: {
        api: flatByName.get('tfm.get.misc.apiVersion')?.value,
        tfm: flatByName.get('tfm.get.misc.transformiceVersion')?.value,
      },
    },
  };
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

  const active = document.activeElement;

  elm.select();
  const copied = document.execCommand('copy');

  if (elm.id == 'code_output') {
    active?.focus?.({ preventScroll: true });
  }

  if (elm.value) {
    showToast(copied ? `Copied: ${elm.value.slice(0, 120)}` : 'Could not copy to clipboard', !copied);
  }
};

let toastTimer;
const showToast = (message, isError) => {
  const toast = id('copy_toast');
  const host = document.querySelector('dialog[open]') || document.body;

  if (toast.parentElement != host) {
    host.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.toggle('error', !!isError);
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2000);
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
        ...obj1.map(x => nameMap2[x.name] ? mergeObjects(x, nameMap2[x.name]) : x),
        ...obj2.filter(x => !nameMap1[x.name]),
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
    isDiff: true,
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

const getExampleCode = (elm, index) => {
  const example = elm.examples[index];

  if (typeof(example) == 'string') {
    return example;
  }

  return `${convertLuaPath(elm.name)}(${elm.parameters?.list?.map(
    (param, i) => example[i] ||
                  elm.parameters?.details?.[i]?.default_value ||
                  param
  ).join(', ')})`;
};

const copyCode = (path, type, codeType, index) => {
  const elm = lastRendered?.[type]?.filter(x => x.name == path)[0];

  if (!elm) {
    return;
  }

  const luaPath = convertLuaPath(path);
  let value = '';

  if (codeType == 'name') {
    value = luaPath;
  }
  else if (codeType == 'params') {
    value = `${luaPath}(${elm.parameters?.list?.join(', ')})`;
  }
  else if (codeType == 'defaults') {
    value = `${luaPath}(${elm.parameters?.list?.map(
      (param, i) => (elm.parameters.details?.[i]?.default_value || param)
    ).join(', ')})`;
  }
  else if (codeType == 'skeleton') {
    value = `function ${luaPath}(${elm.parameters.list.join(', ')})

end`;
  }
  else if (codeType == 'example') {
    if (type == 'functions' && elm.examples?.[index]) {
      value = getExampleCode(elm, index);
    }
  }

  return copyText('code_output', value);
}

const renderDiff = x => `
${x.added ? ('<span class="item-added">' + x.added + '</span> ') : ''}
${x.removed ? ('<span class="item-removed">' + x.removed + '</span>') : ''}
${!x.added && !x.removed ? x : ''}
`.trim();

const renderLuaTreeRestriction = (restriction) => {
  if (restriction == "modules") {
    return ` class="FC" title="Only available for FunCorp & Module Team"`;
  }

  if (restriction == "moduleteam") {
    return ` class="MT" title="Only available for Module Team"`;
  }

  if (restriction == "events") {
    return ` class="ES" title="Only available for Event Modules"`;
  }

  return '';
}

const renderRuntimeDetail = rt => {
  if (rt.ref) {
    return `<a class="V" href="#${escapeAttr(rt.ref)}">&rarr; ${escapeHTML(rt.ref)}</a>`;
  }

  if (rt.java) {
    return `<span class="N2">${escapeHTML(rt.java)}</span>`;
  }

  if (rt.type == 'string') {
    return renderLuaString(rt.value);
  }

  if (rt.value != null) {
    return escapeHTML(String(rt.value));
  }

  return rt.childCount ? `<span class="N2">${rt.childCount} keys</span>` : '';
};

const renderRuntimeChip = rt => `<span class="runtime-chip" title="Runtime data"><span class="${runtimeTypeColors[rt.type] || 'N2'}">${rt.type}</span> ${renderRuntimeDetail(rt)}</span>`;

const renderRuntimeFunction = rt => `
  <div class="runtime-strip${rt.aliases.length ? ' runtime-stacked' : ''}">
    ${renderRuntimeChip(rt)}
    ${rt.aliases.length ? `
      <div class="runtime-aliases">
        <span class="N2">same function as</span>
        ${rt.aliases.map(name => `<a class="D" href="#${name}">${name}</a>`).join(', ')}
      </div>
    ` : ''}
  </div>
`;

const renderVersionValue = (name, value, other) => `
  <span class="BL">${name}</span>
  <span class="${other != null && String(value) != String(other) ? 'O' : 'V'}">${escapeHTML(String(value ?? '-'))}</span>
`;

const renderRuntimeDiffRow = (name, docValue, runtimeCell) => `
  <tr>
    <td><a class="D" href="#${name}">${name}</a></td>
    <td class="G">${docValue}</td>
    <td>${runtimeCell}</td>
  </tr>
`;

const renderRuntimeDiffs = sections => {
  const values = sections.tree.filter(x => x.runtime?.documented != null);
  const entries = sections.tree.filter(x => x.undocumented);
  const events = sections.events.filter(x => x.undocumented && !x.restricted);
  const missing = entries.length + events.length;

  if (!values.length && !missing) {
    return '';
  }

  return `
    <details class="runtime-strip runtime-diffs">
      <summary>
        <span class="N">Runtime data differs from docs:</span>
        ${values.length ? `<span class="O">${values.length} different value${values.length == 1 ? '' : 's'}</span>${missing ? ',' : ''}` : ''}
        ${missing ? `<span class="CE">${missing} new from runtime</span>` : ''}
      </summary>
      <table class="parameter-table">
        <thead>
          <tr>
            <th class="D">name</th>
            <th class="G">docs</th>
            <th class="V">runtime</th>
          </tr>
        </thead>
        <tbody>
          ${values.map(x => renderRuntimeDiffRow(x.name, renderDiff(x.value), renderRuntimeChip(x.runtime))).join('')}
          ${entries.map(x => renderRuntimeDiffRow(x.name, '-', renderRuntimeChip(x.runtime))).join('')}
          ${events.map(x => renderRuntimeDiffRow(x.name, '-', '<span class="runtime-chip" title="Runtime data"><span class="V">event</span></span>')).join('')}
        </tbody>
      </table>
    </details>
  `;
};

const renderRuntimeInfo = sections => {
  const info = sections.runtimeInfo;

  return `
  <div class="runtime-strip luahelp-strip">
    <span class="runtime-label">luahelp</span>
    ${renderVersionValue('API', info.luahelpVersions.api)}
    ${renderVersionValue('TFM', info.luahelpVersions.tfm)}
  </div>
  <div class="runtime-strip">
    <span class="runtime-label">runtime</span>
    ${renderVersionValue('API', info.runtimeVersions.api, info.luahelpVersions.api)}
    ${renderVersionValue('TFM', info.runtimeVersions.tfm, info.luahelpVersions.tfm)}
    ${renderVersionValue('Last updated', new Date(info.collectedAt * 1000).toLocaleString())}
    ${info.complete ? '' : '<span class="R">Partial snapshot</span>'}
  </div>
  ${renderRuntimeDiffs(sections)}
`;
};

const renderLuaTreeValue = (tree, elm) => {
  const chip = elm.runtime && !elm.runtime.matchesDocs ? renderRuntimeChip(elm.runtime) : '';

  if (elm.value == '-' && elm.runtime?.value != null) {
    return `<span class="runtime-off-only">-</span>${chip}`;
  }

  return elm.value
    ? `${renderDiff(elm.value)} ${chip}`
    : `${chip}${renderLuaTreeTable(tree, elm.name)}`;
};

const renderLuaDoc = elm => `
  <div class="lua-doc">
    ${elm.luaDoc.html}
  </div>
`;

const renderLuaTreeItem = (tree, elm) => `
  <tr class="luatree-elm${elm.undocumented ? ' runtime-row' : ''}" id="${elm.name}">
    <td>
      <button class="btn-small" onclick="copyPath('code_output', '${elm.name}')">Copy</button>
    </td>
    <td>
      ${elm.diff == 'added' ? '<span class="item-added">+</span>' : ''}
      ${elm.diff == 'removed' ? '<span class="item-removed">-</span>' : ''}
      ${elm.undocumented ? '<span class="runtime-label" title="Found at runtime, not in /luahelp">runtime</span>' : ''}
      <a href="${elm.href ? elm.href : `#${elm.name}`}"${renderLuaTreeRestriction(elm.restricted)}>${getPathLast(elm.name)}</a>
    </td>
    <td class="G">
      ${renderLuaTreeValue(tree, elm)}
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
${renderLuaTreeTable(tree, '')}
`;

// Examples doesn't handle diffs since it doesn't apply extras on diff view
const renderExamples = (elm, type) => `
  <div class="item-actions">
    <span class="item-copy" role="group" aria-label="Copy ${elm.name}">
      <span class="item-copy-label">Copy</span>
      <button title="Copy the name" onclick="copyCode('${elm.name}', '${type}', 'name')">Name</button>
      <button title="Copy with parameter names" onclick="copyCode('${elm.name}', '${type}', 'params')">Params</button>
      ${type == "functions" ? `
      <button title="Copy with default values" onclick="copyCode('${elm.name}', '${type}', 'defaults')">Defaults</button>
      ` : `
      <button title="Copy an event function skeleton" onclick="copyCode('${elm.name}', '${type}', 'skeleton')">Skeleton</button>
      `}
    </span>
    ${elm.luaDoc ? `
    <button title="Open in the Lua 5.2 manual" onclick="window.open('${elm.href}', '_blank', 'noopener')">Manual</button>
    ` : ''}
  </div>
`;

// Version diffs can wrap a whole entry in { added, removed, diff }
const unwrapDiff = x => x?.diff ? x.added || x.removed : x;

const docTypeColors = {
  string: 'T',
  int: 'J',
  number: 'J',
  float: 'J',
  boolean: 'CH',
  bool: 'CH',
  function: 'VP',
  table: 'BV',
  object: 'BV',
};

const renderType = type => {
  if (type == null) {
    return '-';
  }

  if (typeof(type) != 'string') {
    return renderDiff(type);
  }

  return type.toLowerCase().split('|').map(
    name => `<span class="type-chip ${docTypeColors[name.split(' ')[0]] || 'N2'}">${name}</span>`
  ).join(' ');
};

const docUrlPattern = /\bhttps?:\/\/(?:(?!&(?:lt|gt|quot|#39|#x27);)[^\s<>"'])+/gi;

const linkifyUrl = match => {
  const url = match.replace(/[.,:!?)\]]+$/, '');
  return `<a class="doc-link" href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>${match.slice(url.length)}`;
};

// Expects escaped text, tags from data/help.js and their contents are left alone
const linkifyDocText = html => {
  let insideLink = false;

  return html.split(/(<[^>]*>)/).map((part, idx) => {
    if (idx % 2) {
      insideLink = /^<a\b/i.test(part) || insideLink && !/^<\/a\b/i.test(part);
      return part;
    }

    return insideLink ? part : part.replace(docUrlPattern, linkifyUrl);
  }).join('');
};

const renderDocText = x => linkifyDocText(renderDiff(x));

const extraTitle = 'Added by this site';
const renderExtra = (html, isExtra) => isExtra ? `<span class="extra-text" title="${extraTitle}">${html}</span>` : html;

const renderParamField = (name, fieldType, text) => `
  <li><code>${name}</code> ${renderType(fieldType)}${text ? ` ${text}` : ''}</li>
`;

// Notes are free text, known shapes: "name (Type): text", "value (text)", "a (Type), b (Type)"
const renderParamNote = note => {
  if (typeof(note) != 'string') {
    return `<li>${renderDiff(note)}</li>`;
  }

  const field = note.match(/^([^\s:()]+) \(([^)]+)\): (.*)$/);

  if (field) {
    return renderParamField(field[1], field[2], field[3]);
  }

  const value = note.match(/^([^\s()]+)(?: \(([^()]*)\))?$/);

  if (value) {
    return `<li><code>${value[1]}</code>${value[2] ? ` ${value[2]}` : ''}</li>`;
  }

  const fields = note.split(', ').map(x => x.match(/^(\w+) \(([^)]+)\)(?: (.+))?$/));

  if (fields.length > 1 && fields.every(Boolean)) {
    return fields.map(x => renderParamField(x[1], x[2], x[3])).join('');
  }

  return `<li>${note}</li>`;
};

const renderParameter = (elm, hasDefaults) => item => {
  const param = unwrapDiff(item);
  const extra = elm.extra?.params[param.name];
  const [description, ...notes] = [param.descriptions ?? []].flat();

  return `
<tr>
  <td class="V param-name">
    ${renderDiff(param.name)}
    ${param.default_value || elm.optionalParams?.includes(param.name) ? '<span class="param-optional">optional</span>' : ''}
  </td>
  <td class="param-type">${renderExtra(renderType(param.type), extra?.type)}</td>
  ${hasDefaults ? `
  <td class="N2 param-default${param.default_value ? '' : ' param-no-default'}">
    ${param.default_value ? renderExtra(renderDiff(param.default_value), extra?.default) : '<span class="param-empty">-</span>'}
  </td>
  ` : ''}
  <td class="param-description">
    ${description != null ? renderExtra(renderDocText(description), extra?.texts.has(description)) : ''}
    ${notes.length ? `<ul class="param-notes">${notes.map(note => {
      const html = linkifyDocText(renderParamNote(note));
      return extra?.texts.has(note) ? html.replace(/<li>/g, `<li class="extra-text" title="${extraTitle}">`) : html;
    }).join('')}</ul>` : ''}
  </td>
</tr>
`;
};

const renderReturn = (item, isExtra) => {
  const value = unwrapDiff(item);

  return `
  <div class="item-returns">
    <span class="R">returns</span>
    ${renderType(value.type)}
    ${value.description != null ? renderExtra(renderDocText(value.description), isExtra) : ''}
  </div>
`;
};

const renderParameters = (elm, type) => {
  const details = elm.parameters?.details;

  if (!details?.length) {
    return '';
  }

  const hasDefaults = type == "functions" && details.some(x => unwrapDiff(x).default_value);

  return `
  <table class="params-table" id="table_param_${elm.name}">
  <thead>
    <tr>
      <th class="V">parameter</th>
      <th class="BL">type</th>
      ${hasDefaults ? '<th class="N2">default</th>' : ''}
      <th>description</th>
    </tr>
  </thead>
  <tbody>
    ${details.map(renderParameter(elm, hasDefaults)).join('')}
  </tbody>
  </table>
  `;
};

const renderItemExamples = (elm, type) => {
  if (type != 'functions' || !elm.examples?.length) {
    return '';
  }

  return `
  <div class="item-examples">
    ${renderExtra(elm.examples.length > 1 ? 'Examples' : 'Example', elm.extra?.examples)}
    ${elm.examples.map((_, idx) => `
    <div class="item-example">
      <pre>${escapeHTML(getExampleCode(elm, idx))}</pre>
      <button title="Copy example" onclick="copyCode('${elm.name}', '${type}', 'example', ${idx})">Copy</button>
    </div>
    `).join('')}
  </div>
  `;
};

const renderSignatureParam = elm => param => (
  elm.optionalParams?.includes(param) ? `[${param}]` : renderDiff(param)
);

const restrictionChips = {
  modules: [['FunCorp', 'fc'], ['Module Team', 'mt']],
  moduleteam: [['Module Team', 'mt']],
  events: [['Event Modules', 'es']],
};

const getRestrictionChips = (restriction, isExtra) => {
  if (restriction == "module801") {
    return [['module801']];
  }

  const chips = typeof(restriction) == 'string' && restrictionChips[restriction];

  if (!chips) {
    return [];
  }

  const title = `Only available for ${chips.map(([name]) => name).join(' &amp; ')}${isExtra ? ' (added by this site)' : ''}`;
  return chips.map(([name, key]) => [name, key, title]);
};

const renderItemChip = ([name, key, title]) => `<span class="runtime-label${key ? ` restriction-${key}` : ''}"${title ? ` title="${title}"` : ''}>${name}</span>`;

const renderItemChips = elm => {
  const chips = getRestrictionChips(elm.restricted, elm.extra?.access);

  return chips.length ? `<div class="restriction-chips">${chips.map(renderItemChip).join('')}</div>` : '';
};

const getItemSource = elm => {
  if (elm.luaGuide) {
    return ['Lua manual + this site', 'Based on the Lua 5.2 Reference Manual, organized by this site'];
  }

  if (elm.luaDoc) {
    return ['Lua manual', 'From the Lua 5.2 Reference Manual'];
  }

  if (elm.aliasOf) {
    return ['runtime alias', `Found at runtime, shows the data of ${elm.aliasOf}`];
  }

  if (elm.undocumented) {
    return ['runtime', 'Found at runtime, not in /luahelp'];
  }

  if (elm.extra?.isNew) {
    return ['this site', 'Added by this site'];
  }

  return elm.extra
    ? ['luahelp + this site', 'From the in-game /luahelp command, with parts added by this site']
    : ['luahelp', 'From the in-game /luahelp command'];
};

// Only 'latest+' mixes sources
const renderItemSource = elm => {
  if (!lastRendered?.hasSources) {
    return '';
  }

  const [name, title] = getItemSource(elm);
  return `<span class="item-source" title="${title}">${name}</span>`;
};

const renderFunction = type => elm => `
<div class="${type}-elm${elm.restricted == 'module801' ? ' module801' : elm.undocumented ? ' runtime-event' : ''}" id="${type}_${elm.name}">
  <div class="item-head">
    <div class="item-signature">
      ${elm.diff == "added" ? '<span class="item-added">+</span>' : ''}
      ${elm.diff == "removed" ? '<span class="item-removed">-</span>' : ''}
      <a id="${elm.name}" href="#${elm.name}" class="D">${elm.name}</a>
      <span class="N">
        (<span class="V">
        ${
          elm.parameters ? elm.parameters.list.map(renderSignatureParam(elm)).join('</span>, <span class="V">') : ''
        }
        </span>)
      </span>
    </div>
    ${elm.runtime ? renderRuntimeFunction(elm.runtime) : ''}
    <div class="item-toolbar">
      ${elm.restricted == 'module801' ? '' : renderExamples(elm, type)}
      ${renderItemSource(elm)}
    </div>
  </div>
  ${renderItemChips(elm)}
  ${elm.luaDoc && !elm.luaGuide ? renderLuaDoc(elm) : `
  <div class="N">
  ${
    elm.descriptions ? elm.descriptions.map(x => renderExtra(renderDocText(x), elm.extra?.descriptions.has(x))).join('<br />') : ''
  }
  </div>
  `}

  ${renderItemExamples(elm, type)}
  ${renderParameters(elm, type)}
  ${elm.returns ? [elm.returns].flat().map(x => renderReturn(x, elm.extra?.returns)).join('') : ''}
</div>
`;

const renderFunctions = functions => `<span class="O section-head">Functions</span>
${functions.map(renderFunction('functions')).join('')}
`;

const renderEvents = events => `<span class="O section-head">Events</span>
${events.map(renderFunction('events')).join('')}
`;

const renderSections = sections => {
  lastRendered = sections;
  loadSourceToggles();

  id('current_version').innerHTML = `<div class="V TI">${sections.version}</div>${
    sections.runtimeInfo ? renderRuntimeInfo(sections) : ''
  }`;
  updateRuntimeToggles();

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

  id('page_error').innerHTML = "";
  id('input_filter').value = "";
  applySearch();
}

const errorSet = err => {
  id('content').innerHTML = defaultContent;
  id('page_error').innerHTML = err.stack;
  console.error(err.stack);
};

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

const applyTags = tree => tree.map(item => {
  let tags;
  
  if (item.restricted == "module801") {
    tags = "module801";
  }
  else if (item.restricted == "modules") {
    tags = "funcorp fc moduleteam module team mt modules";
  }
  else if (item.restricted == "moduleteam") {
    tags = "moduleteam module team mt";
  }
  else if (item.restricted == "events") {
    tags = "events event modules eventmodules";
  } else {
    tags = "tribehouse";
  }

  if (item.undocumented) {
    tags += " undocumented runtime";
  }

  if (item.luaDoc) {
    tags += " lua stdlib manual";
  }

  if (item.extra) {
    tags += " added";
  }

  return { ...item, tags };
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

  const getExtras = () => versionPath == 'latest' ? Promise.all([loadRuntime(), loadLuaDocs()]) : Promise.resolve([null, null]);

  function render(sections, [runtime, luaDocs]) {
    if (versionPath == 'latest') {
      if (isExtra) {
        sections = annotateExtras(mergeObjects(sections, customHelpData), sections, customHelpData);
        sections = mergeRuntime(sections, runtime);
        sections = mergeLuaDocs(sections, luaDocs, luaManualData);
        sections.tree = applyReplacements(sections.tree);
        sections.tree = applyTags(sections.tree);
        sections.events = applyTags(sections.events);
        sections.functions = applyTags(sections.functions);
        console.log("merged", sections);
      } else {
        // Plain latest keeps the /luahelp names, extras stay hidden until their chips are enabled
        sections = mergeLuaDocs(mergeRuntime(sections, runtime), luaDocs);
        sections = {
          ...sections,
          tree: applyTags(sections.tree),
          events: applyTags(sections.events),
          functions: applyTags(sections.functions),
          isPlainLatest: true,
          hasSources: true,
        };
      }
    } else {
      sections = compareVersions(loadedVersions["latest"], sections);
      console.log("diff", version, sections);
    }

    createParentIndex(sections);
    renderSections(sections);

    if (initial) {
      loadToggles();
      updateSplitters();
      applySearch();

      if (window.location.hash) {
        window.location = window.location;
      }
    }
  }

  if (loadedVersions[versionPath]) {
    getExtras()
      .then(extras => render(loadedVersions[versionPath], extras))
      .catch(errorCallback);

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
      escapeDocEntries(sections.functions);
      escapeDocEntries(sections.events);
      scanTree(sections.tree);
      console.log("loaded", versionPath, sections);
      loadedVersions[versionPath] = sections;
      return getExtras().then(extras => render(sections, extras));
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
    const versions = data.split('\n').map(x => x.trim()).filter(Boolean);
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

// Search: all terms must match, supports "phrases", -exclusions and field:value
const docSections = ['functions', 'events', 'luatree'];
const searchFields = ['name', 'param', 'type', 'desc', 'value', 'tag'];
const searchIndex = new WeakMap();
const scopeInputs = () => [...document.querySelectorAll('[data-search-scope]')];
const searchSelects = () => ['search_match', 'search_access', 'search_source'].map(id);

// Version diffs wrap changed values in { added, removed, diff }
const flattenText = x => {
  if (x == null) {
    return [];
  }

  if (Array.isArray(x)) {
    return x.flatMap(flattenText);
  }

  if (typeof(x) == 'object') {
    return x.diff ? [...flattenText(x.added), ...flattenText(x.removed)] : [];
  }

  return [String(x)];
};

const normalizeTexts = (...values) => flattenText(values).map(x => unescapeHTML(x).toLowerCase());

const getSearchEntry = item => {
  if (searchIndex.has(item)) {
    return searchIndex.get(item);
  }

  const details = Array.isArray(item.parameters?.details)
    ? item.parameters.details.map(x => x.diff ? x.added || x.removed : x)
    : [];
  const entry = {
    name: normalizeTexts(item.name),
    param: normalizeTexts(item.parameters?.list, details.map(x => x.name), item.luaDoc?.params),
    type: normalizeTexts(details.map(x => x.type), [item.returns].flat().map(x => x?.type)),
    desc: normalizeTexts(
      item.descriptions,
      details.map(x => x.descriptions),
      [item.returns].flat().map(x => x?.description)
    ),
    value: normalizeTexts(item.value, details.map(x => x.default_value)),
    tag: normalizeTexts(item.tags).flatMap(x => x.split(/\s+/)),
    runtime: {
      type: normalizeTexts(item.runtime?.type),
      value: normalizeTexts(item.runtime?.value, item.runtime?.java, item.runtime?.ref),
    },
  };

  searchIndex.set(item, entry);
  return entry;
};

const parseSearch = query => [...query.matchAll(/(-(?=[^\s\d]))?(?:([a-z]+):)?(?:"([^"]*)"?|(\S*))/gi)].flatMap(
  ([, negate, prefix, phrase, word]) => {
    const value = (phrase ?? word ?? '').toLowerCase();
    const field = prefix?.toLowerCase();
    const known = searchFields.includes(field);
    const text = prefix && !known ? `${field}:${value}` : value;

    return !value || text == '-' ? [] : [{ negate: !!negate, field: known ? field : null, text }];
  }
);

const textMatches = (text, term, mode) => {
  if (mode == 'exact') {
    return text == term || getPathLast(text) == term;
  }

  if (mode == 'start') {
    return text.startsWith(term) || getPathLast(text).startsWith(term);
  }

  return text.includes(term);
};

const termMatches = (entry, term, options) => (term.field ? [term.field] : options.scope).some(field => [
  ...entry[field],
  ...(options.showRuntime && entry.runtime[field] || []),
].some(text => textMatches(text, term.text, options.match)));

const matchesAccess = (item, access) => {
  if (access == 'all') {
    return true;
  }

  const restricted = flattenText(item.restricted);
  return access == 'public' ? !restricted.length : restricted.includes(access);
};

const matchesSource = (item, source) => {
  if (source == 'documented') {
    return !item.undocumented && !item.aliasOf;
  }

  if (source == 'undocumented') {
    return !!item.undocumented || !!item.aliasOf;
  }

  return source != 'different' || item.runtime?.documented != null;
};

// Entries that are hidden by the runtime/module801 toggles are not counted
const isItemEnabled = (item, options) => (
  (options.showRuntime || !item.undocumented && !item.aliasOf) &&
  (options.showModule801 || item.restricted != 'module801') &&
  (options.showLua || !item.luaDoc)
);

const getSearchOptions = () => {
  const scope = scopeInputs().filter(x => x.checked).map(x => x.dataset.searchScope);
  const showRuntime = !!lastRendered?.runtimeInfo && id('toggle_runtime').checked;

  return {
    scope: scope.length ? scope : ['name'],
    match: id('search_match').value,
    access: id('search_access').value,
    source: showRuntime ? id('search_source').value : 'all',
    showRuntime: !lastRendered?.runtimeInfo || id('toggle_runtime').checked,
    showModule801: showRuntime && id('toggle_module801').checked,
    showLua: id('toggle_lua').checked,
  };
};

const filterContent = (elmId, terms, options) => {
  const { section, parentIndex, sectionElements } = id(elmId);
  const visible = new Set();
  let shown = 0;
  let total = 0;

  if (!section) {
    return { shown, total };
  }

  section.forEach(item => {
    if (!isItemEnabled(item, options)) {
      return;
    }

    total++;

    if (
      !matchesAccess(item, options.access) ||
      !matchesSource(item, options.source) ||
      !terms.every(term => termMatches(getSearchEntry(item), term, options) != term.negate)
    ) {
      return;
    }

    shown++;
    visible.add(item.name);

    for (let index = parentIndex?.[item.name]; index != null; index = parentIndex[section[index].name]) {
      visible.add(section[index].name);
    }
  });

  section.forEach(item => {
    const elm = sectionElements[item.name];

    if (elm) {
      elm.style.display = visible.has(item.name) ? null : "none";
    }
  });

  return { shown, total };
};

const updateAdvancedCount = options => {
  const count = [
    scopeInputs().some(x => x.checked != x.defaultChecked),
    options.match != 'contains',
    options.access != 'all',
    options.source != 'all',
    options.showModule801,
  ].filter(Boolean).length;

  id('advanced_count').hidden = !count;
  id('advanced_count').textContent = count;
};

function applySearch() {
  const query = id('input_filter').value.trim();
  const terms = parseSearch(query);
  const options = getSearchOptions();
  const sectionResults = docSections.map(name => ({
    name,
    enabled: id('toggle_' + name).checked,
    ...filterContent('section_' + name, terms, options),
  }));
  const results = sectionResults.filter(x => x.enabled);
  const shown = results.reduce((sum, x) => sum + x.shown, 0);
  const total = results.reduce((sum, x) => sum + x.total, 0);

  sectionResults.forEach(x => {
    const button = document.querySelector(`[data-jump="${x.name}"]`);

    button.hidden = !x.enabled;
    button.querySelector('span').textContent = x.shown;
  });
  updateJumpActive();

  id('btn_clear_search').hidden = !id('input_filter').value;
  id('search_count').textContent = shown == total ? `${total} entries` : shown ? `${shown} of ${total}` : 'No results';
  id('search_count').classList.toggle('empty', !shown && !!total);
  updateAdvancedCount(options);
}

const saveSearchOptions = () => {
  if (window.localStorage) {
    localStorage.setItem('search_options', JSON.stringify({
      scope: scopeInputs().filter(x => x.checked).map(x => x.dataset.searchScope),
      selects: Object.fromEntries(searchSelects().map(x => [x.id, x.value])),
    }));
  }
};

const loadSearchOptions = () => {
  let saved;

  try {
    saved = JSON.parse(window.localStorage?.getItem('search_options'));
  } catch (err) {
    console.warn('search options not loaded', err);
  }

  if (!saved) {
    return;
  }

  scopeInputs().forEach(x => x.checked = !!saved.scope?.includes(x.dataset.searchScope));
  searchSelects().forEach(x => {
    x.value = saved.selects?.[x.id];

    if (x.selectedIndex < 0) {
      x.selectedIndex = 0;
    }
  });
};

const clearSearch = () => {
  id('input_filter').value = '';
  applySearch();
  id('input_filter').focus();
};

loadSearchOptions();

id('input_filter').addEventListener('input', applySearch);
id('btn_clear_search').addEventListener('click', clearSearch);

[...scopeInputs(), ...searchSelects()].forEach(x => x.addEventListener('change', () => {
  saveSearchOptions();
  applySearch();
}));

id('btn_reset_search').addEventListener('click', () => {
  scopeInputs().forEach(x => x.checked = x.defaultChecked);
  searchSelects().forEach(x => x.selectedIndex = 0);
  id('toggle_module801').checked = false;
  saveSearchOptions();
  saveRuntimeToggle('show_module801', false);
});

document.addEventListener('click', e => {
  if (!id('advanced_menu').contains(e.target)) {
    id('advanced_menu').open = false;
  }
});

document.addEventListener('keydown', e => {
  const typing = e.target.matches('input:not([type=checkbox]):not([type=radio]), textarea, select');
  const isFocusKey = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() == 'k' ||
    e.key == '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey;

  if (document.querySelector('dialog[open]')) {
    return;
  }

  if (isFocusKey) {
    e.preventDefault();
    id('input_filter').focus();
    id('input_filter').select();
  }
  else if (e.key == 'Escape') {
    if (id('advanced_menu').open) {
      id('advanced_menu').open = false;
    }
    else if (e.target == id('input_filter') && id('input_filter').value) {
      clearSearch();
    }
  }
});

// Docs layout: flat page, or resizable column/row panes
const layoutModes = ['flat', 'col', 'row'];
const narrowLayout = window.matchMedia('(max-width: 760px)');
const minPaneSize = 120;

const getSavedLayout = () => {
  const saved = window.localStorage?.getItem('docs_layout');

  if (layoutModes.includes(saved)) {
    return saved;
  }

  return window.localStorage?.getItem('row_mode') == 'true' ? 'flat' : 'col';
};

const getSavedPaneSizes = () => {
  try {
    return JSON.parse(window.localStorage?.getItem('docs_pane_sizes')) || {};
  } catch (err) {
    return {};
  }
};

let layoutMode = getSavedLayout();
let paneSizes = getSavedPaneSizes();

const getActiveLayout = () => narrowLayout.matches ? 'flat' : layoutMode;
const isSectionVisible = elm => elm?.classList.contains('section') && elm.style.display != 'none';
const visibleSections = () => docSections.map(name => id('section_' + name)).filter(isSectionVisible);
const getPaneSize = elm => parseFloat(elm.style.getPropertyValue('--pane')) || 1;

function updateSplitters() {
  byClass('section-splitter').forEach(x => x.hidden = true);
  visibleSections().slice(1).forEach(x => x.previousElementSibling.hidden = false);
}

const applyLayout = () => {
  const mode = getActiveLayout();

  layoutModes.forEach(x => id('content').classList.toggle('layout-' + x, x == mode));
  docSections.forEach(name => {
    id('section_' + name).style.setProperty('--pane', paneSizes[mode]?.[name] || 1);
  });
  byClass('section-splitter').forEach(x => {
    x.setAttribute('aria-orientation', mode == 'col' ? 'vertical' : 'horizontal');
  });
  updateSplitters();
  updateJumpActive();
};

const setLayout = mode => {
  layoutMode = mode;
  applyLayout();

  if (window.localStorage) {
    localStorage.setItem('docs_layout', mode);
  }
};

const savePaneSizes = () => {
  const mode = getActiveLayout();

  paneSizes[mode] = Object.fromEntries(docSections.map(name => [name, getPaneSize(id('section_' + name))]));

  if (window.localStorage) {
    localStorage.setItem('docs_pane_sizes', JSON.stringify(paneSizes));
  }
};

const getSplitterPanes = splitter => {
  let before = splitter.previousElementSibling;
  let after = splitter.nextElementSibling;

  while (before && !isSectionVisible(before)) {
    before = before.previousElementSibling;
  }

  while (after && !isSectionVisible(after)) {
    after = after.nextElementSibling;
  }

  return before && after ? [before, after] : null;
};

const measurePane = elm => getActiveLayout() == 'col' ? elm.getBoundingClientRect().width : elm.getBoundingClientRect().height;

// Padding and borders are not part of the flex-grow space
const getPaneChrome = elm => {
  const style = getComputedStyle(elm);
  const sides = getActiveLayout() == 'col' ? ['Left', 'Right'] : ['Top', 'Bottom'];

  return sides.reduce((sum, side) => (
    sum + parseFloat(style['padding' + side]) + parseFloat(style[`border${side}Width`])
  ), 0);
};

const startPaneResize = splitter => {
  const panes = getSplitterPanes(splitter);

  if (!panes) {
    return null;
  }

  const startSize = measurePane(panes[0]);
  const pixels = startSize + measurePane(panes[1]);
  const weight = getPaneSize(panes[0]) + getPaneSize(panes[1]);
  const chrome = panes.map(getPaneChrome);
  const space = pixels - chrome[0] - chrome[1];

  return delta => {
    const size = Math.min(Math.max(startSize + delta, Math.min(minPaneSize, pixels / 2)), pixels - Math.min(minPaneSize, pixels / 2));

    panes[0].style.setProperty('--pane', weight * (size - chrome[0]) / space);
    panes[1].style.setProperty('--pane', weight * (pixels - size - chrome[1]) / space);
  };
};

const updateJumpActive = () => {
  if (getActiveLayout() != 'flat') {
    return;
  }

  const content = id('content');
  const sections = visibleSections();
  const top = content.getBoundingClientRect().top + id('section_jump').offsetHeight + 8;
  const atBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 2;
  const current = atBottom ? sections[sections.length - 1] : sections.reduce(
    (ret, x) => x.getBoundingClientRect().top <= top ? x : ret,
    sections[0]
  );

  document.querySelectorAll('[data-jump]').forEach(x => {
    x.classList.toggle('active', 'section_' + x.dataset.jump == current?.id);
  });
};

// Delegated since error handling can recreate the content
id('content').addEventListener('click', e => {
  const button = e.target.closest('[data-jump]');

  if (button) {
    id('section_' + button.dataset.jump).scrollIntoView({ block: 'start' });
  }
});

id('content').addEventListener('scroll', () => requestAnimationFrame(updateJumpActive), { passive: true });

id('content').addEventListener('pointerdown', e => {
  const splitter = e.target.closest('.section-splitter');
  const resize = splitter && startPaneResize(splitter);

  if (!resize) {
    return;
  }

  const axis = getActiveLayout() == 'col' ? 'clientX' : 'clientY';
  const start = e[axis];
  const move = ev => resize(ev[axis] - start);
  const stop = () => {
    splitter.removeEventListener('pointermove', move);
    splitter.removeEventListener('pointerup', stop);
    splitter.removeEventListener('pointercancel', stop);
    splitter.classList.remove('dragging');
    document.body.classList.remove('resizing-panes');
    savePaneSizes();
  };

  e.preventDefault();
  splitter.setPointerCapture(e.pointerId);
  splitter.classList.add('dragging');
  document.body.classList.add('resizing-panes');
  splitter.addEventListener('pointermove', move);
  splitter.addEventListener('pointerup', stop);
  splitter.addEventListener('pointercancel', stop);
});

id('content').addEventListener('dblclick', e => {
  if (e.target.closest('.section-splitter')) {
    docSections.forEach(name => id('section_' + name).style.setProperty('--pane', 1));
    savePaneSizes();
  }
});

id('content').addEventListener('keydown', e => {
  const splitter = e.target.closest('.section-splitter');
  const keys = getActiveLayout() == 'col' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
  const direction = keys.indexOf(e.key);

  if (!splitter || direction == -1) {
    return;
  }

  e.preventDefault();
  startPaneResize(splitter)?.(direction ? 32 : -32);
  savePaneSizes();
});

narrowLayout.addEventListener('change', applyLayout);

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

  updateSplitters();
  applySearch();
}

function loadToggles() {
  if (window.localStorage) {
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


layoutModes.forEach(mode => {
  id('layout_' + mode).checked = mode == layoutMode;
  id('layout_' + mode).addEventListener('change', () => setLayout(mode));
});
applyLayout();

id('toggle_functions').addEventListener('change', function() {
  saveToggle('section_functions', this.checked);
});

id('toggle_events').addEventListener('change', function() {
  saveToggle('section_events', this.checked);
});

id('toggle_luatree').addEventListener('change', function() {
  saveToggle('section_luatree', this.checked);
});

function updateRuntimeToggles() {
  const info = lastRendered?.runtimeInfo;
  const showRuntime = id('toggle_runtime').checked;

  id('runtime_toggle').style.display = info ? null : 'none';
  id('lua_toggle').style.display = lastRendered?.functions.some(x => x.luaDoc) ? null : 'none';
  id('advanced_runtime').hidden = !info;
  id('module801_toggle').style.display = info?.module801 && showRuntime ? null : 'none';
  id('content').classList.toggle('hide-runtime', !showRuntime);
  id('content').classList.toggle('hide-sources', !!lastRendered?.isPlainLatest && !showRuntime && !id('toggle_lua').checked);
  id('sections').classList.toggle('show-module801', id('toggle_module801').checked);
}

const saveRuntimeToggle = (key, value) => {
  updateRuntimeToggles();
  id('snippet_code').value = '';
  applySearch();

  if (window.localStorage) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// Plain latest saves its own state and starts with runtime and Lua manual data off
const getSourceToggleKey = key => lastRendered?.isPlainLatest ? `latest_${key}` : key;

const loadSourceToggles = () => {
  [['toggle_runtime', 'show_runtime'], ['toggle_lua', 'show_lua']].forEach(([elmId, key]) => {
    const saved = window.localStorage?.getItem(getSourceToggleKey(key));
    id(elmId).checked = saved == null ? !lastRendered?.isPlainLatest : saved != 'false';
  });
};

// Runtime data is shown and module801 events are hidden unless changed
id('toggle_runtime').checked = !window.localStorage || localStorage.getItem('show_runtime') != 'false';
id('toggle_module801').checked = !!window.localStorage && localStorage.getItem('show_module801') == 'true';
id('toggle_lua').checked = !window.localStorage || localStorage.getItem('show_lua') != 'false';

id('toggle_runtime').addEventListener('change', function() {
  saveRuntimeToggle(getSourceToggleKey('show_runtime'), this.checked);
});

id('toggle_module801').addEventListener('change', function() {
  saveRuntimeToggle('show_module801', this.checked);
});

id('toggle_lua').addEventListener('change', function() {
  saveRuntimeToggle(getSourceToggleKey('show_lua'), this.checked);
});
