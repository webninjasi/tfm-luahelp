function showSnippet() {
  document.getElementById('advanced_menu').open = false;
  document.getElementById('snippet_overlay').showModal();
  generateSnippet();
}

function hideSnippet() {
  document.getElementById('snippet_overlay').close();
}

function snippetDescription(texts) {
  return flattenText(texts).map(unescapeHTML).join('\n');
}

function generateSnippet() {
  var output = document.getElementById('snippet_code');
  var stats = document.getElementById('snippet_stats');
  var note = document.getElementById('snippet_note');
  var isDiff = !!lastRendered?.isDiff;

  note.hidden = !isDiff;
  document.getElementById('btn_snippet_copy').disabled = isDiff;
  document.getElementById('btn_snippet_download').disabled = isDiff;
  output.value = '';
  stats.textContent = '';

  if (!lastRendered || isDiff) {
    return;
  }

  var code = {};
  var elm, path;
  var showRuntime = document.getElementById('toggle_runtime').checked;

  if (document.getElementById('snippet_tree').checked) {
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
  }

  if (document.getElementById('snippet_functions').checked) {
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
        "description": snippetDescription(elm.descriptions),
      }
    }
  }

  if (document.getElementById('snippet_events').checked) {
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
        "description": snippetDescription(elm.descriptions),
      }
    }
  }

  var count = Object.keys(code).length;

  stats.textContent = count + ' snippets';
  document.getElementById('btn_snippet_copy').disabled = !count;
  document.getElementById('btn_snippet_download').disabled = !count;

  if (!count) {
    return '';
  }

  code = JSON.stringify(code, null, '\t');
  output.value = code;

  return code;
}

function copySnippet() {
  var output = document.getElementById('snippet_code');

  if (output.value) {
    copyText(output);
    showToast('Copied ' + document.getElementById('snippet_stats').textContent);
  }
}

function downloadSnippet() {
  var code = document.getElementById('snippet_code').value;

  if (!code) {
    return;
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

['snippet_functions', 'snippet_events', 'snippet_tree'].forEach(function(elmId) {
  document.getElementById(elmId).addEventListener('change', generateSnippet);
});

document.getElementById('snippet_overlay').addEventListener('click', function(e) {
  if (e.target == this) {
    hideSnippet();
  }
});
