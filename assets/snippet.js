function showSnippet() {
  document.getElementById('snippet_overlay').style.display = 'block';
}

function hideSnippet() {
  document.getElementById('snippet_overlay').style.display = 'none';
}

function generateSnippet() {
  if (!lastRendered) {
    return;
  }

  var code = {};
  var elm, path;
  var showRuntime = document.getElementById('toggle_runtime').checked;

  for (var i=0; i<lastRendered.tree.length; i++) {
    elm = lastRendered.tree[i];

    if (elm.undocumented && !showRuntime) {
      continue;
    }

    path = convertLuaPath(elm.name);
    code[path] = {
      "scope": "lua",
      "prefix": path,
      "body": [
        path,
      ],
    }
  }

  for (var i=0; i<lastRendered.functions.length; i++) {
    elm = lastRendered.functions[i];
    code[elm.name] = {
      "scope": "lua",
      "prefix": elm.name,
      "body": [
        elm.name + "(" +
          (elm.parameters?.list?.map(
            (x, i) => "${" + (i + 1) + ":" + x + "}"
          ).join(', ') || "") +
        ")",
      ],
      "description": elm.descriptions.join('\n'),
    }
  }

  for (var i=0; i<lastRendered.events.length; i++) {
    elm = lastRendered.events[i];

    if (elm.undocumented && !showRuntime) {
      continue;
    }

    if (elm.restricted == "module801" && !document.getElementById('toggle_module801').checked) {
      continue;
    }

    code[elm.name] = {
      "scope": "lua",
      "prefix": elm.name,
      "body": [
        "function " + elm.name + "(" + (elm.parameters?.list?.join(', ') || "") + ")",
        "\t${0}",
        "end",
      ],
      "description": elm.descriptions.join('\n'),
    }
  }

  code = JSON.stringify(code, null, '\t');
  document.getElementById('snippet_code').innerHTML = code;

  return code;
}

function downloadSnippet() {
  var code = document.getElementById('snippet_code').innerHTML;

  if (!code) {
    code = generateSnippet();

    if (!code) {
      return;
    }
  }

  const url = window.URL.createObjectURL(new Blob([code], {type: "application/json"}));
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'tfm-lua-api.code-snippets';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
