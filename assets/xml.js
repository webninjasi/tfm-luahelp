// isRegex, enabled, pattern, replacement, flags
var defaultTransformations = [
  [true, true, "\\s+<", "<", "g"],
  [true, true, "\\s+$", "", "g"],
  [true, true, "(\\w+)='(.*?)'", "$1=\"$2\"", "g"],
  [true, true, "(\\w+=\".*?\")\\s+", "$1", "g"],
  [true, true, "MEDATA=\".*?\"", "", "g"],
  [true, true, "<S (.*?)T=\"0\"(.*?)/>", "<S $1$2/>", "g"],
  [true, false, "L=\"(10|\\d)\"", "", "g"],
  [true, false, "H=\"(10|\\d)\"", "", "g"],
  [true, true, "(<\\w+)\\s+(/?>)", "$1$2", "g"],
  [true, true, "(<\\w+)\\s+(\\w)", "$1 $2", "g"],
];
var transformations = [];

load();
if (!transformations || !transformations.length) {
  resetDefaults();
} else {
  includeDefaults();
}
renderRules();

id('xml_input').addEventListener('change', updateXMLOutput);

function updateXMLOutput() {
  id('xml_output').value = applyTransformations(id('xml_input').value);
}

function askResetDefaults() {
  if (!confirm("Are you sure you want to reset all rules to default?")) {
    return;
  }

  resetDefaults();
  renderRules();
  save();
}

function resetDefaults() {
  transformations = defaultTransformations.map(function(t) {
    return t.slice();
  });
  compileTransformations();
}

function includeDefaults() {
  for (var i = 0; i < defaultTransformations.length; i++) {
    var found = false;
    // search if pattern exists
    for (var j = 0; j < transformations.length; j++) {
      if (defaultTransformations[i][2] == transformations[j][2]) {
        found = true;
        break;
      }
    }
    if (!found) {
      var rule = defaultTransformations[i].slice();
      rule[1] = false; // disabled by default
      transformations.push(rule);
    }
  }
  compileTransformations();
}

function renderRules() {
  var container = id('xml_rules');
  var row, cell, transform, checkbox, label, input, button, breakline;

  container.innerHTML = "";

  // rules
  for (var i = 0; i < transformations.length; i++) {
    transform = transformations[i];
    row = document.createElement('tr');

    // checkbox for enable
    cell = document.createElement('td');
    checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'enable_checkbox_' + i;
    checkbox.value = i;
    checkbox.checked = transform[1];
    checkbox.addEventListener('change', function() {
      editRule(this.value, 1, this.checked);
      renderRules();
      save();
    });
    cell.appendChild(checkbox);
    row.appendChild(cell);

    // checkbox for regex
    cell = document.createElement('td');
    checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'regex_checkbox_' + i;
    checkbox.value = i;
    checkbox.checked = transform[0];
    checkbox.addEventListener('change', function() {
      editRule(this.value, 0, this.checked);
      renderRules();
      save();
    });
    cell.appendChild(checkbox);
    row.appendChild(cell);

    // input box for pattern
    cell = document.createElement('td');
    input = document.createElement('input');
    input.type = 'text';
    input.id = 'pattern_input_' + i;
    input.index = i;
    input.value = transform[2];
    input.addEventListener('change', function() {
      editRule(this.index, 2, this.value);
      renderRules();
      save();
    });
    cell.appendChild(input);
    row.appendChild(cell);

    // input box for replacement
    cell = document.createElement('td');
    input = document.createElement('input');
    input.type = 'text';
    input.id = 'replacement_input_' + i;
    input.index = i;
    input.value = transform[3];
    input.addEventListener('change', function() {
      editRule(this.index, 3, this.value);
      renderRules();
      save();
    });
    cell.appendChild(input);
    row.appendChild(cell);

    // input box for flags
    cell = document.createElement('td');
    input = document.createElement('input');
    input.type = 'text';
    input.id = 'flags_input_' + i;
    input.index = i;
    input.value = transform[4];
    input.addEventListener('change', function() {
      editRule(this.index, 4, this.value);
      renderRules();
      save();
    });
    cell.appendChild(input);
    row.appendChild(cell);

    // buttons for move up down
    cell = document.createElement('td');
    button = document.createElement('button');
    button.id = 'move_up_button_' + i;
    button.innerHTML = '^';
    button.index = i;
    button.addEventListener('click', function() {
      moveRule(true, this.index);
      renderRules();
      save();
    });
    cell.appendChild(button);

    button = document.createElement('button');
    button.id = 'move_down_button_' + i;
    button.innerHTML = 'v';
    button.index = i;
    button.addEventListener('click', function() {
      moveRule(false, this.index);
      renderRules();
      save();
    });
    cell.appendChild(button);

    row.appendChild(cell);

    // delete button
    cell = document.createElement('td');
    button = document.createElement('button');
    button.id = 'delete_button_' + i;
    button.innerHTML = 'Delete';
    button.index = i;
    button.addEventListener('click', function() {
      deleteRule(this.index);
      renderRules();
      save();
    });
    cell.appendChild(button);
    row.appendChild(cell);

    // Error message
    if (transform[6]) {
      cell = document.createElement('td');
      cell.innerText = transform[6];
      row.appendChild(cell);
    }

    container.appendChild(row);
  }

  updateXMLOutput();
}

function newRule() {
  transformations.push([true, true, "", "", "g"]);
  renderRules();
}

function deleteRule(index) {
  if (index < 0 || index >= transformations.length) {
    return;
  }
  transformations.splice(index, 1);
  renderRules();
  save();
}

function editRule(ruleIndex, index, value) {
  var transform = transformations[ruleIndex];

  transform[index] = value;

  if (transform[0]) {
    try {
      transform[5] = new RegExp(transform[2], transform[4]);
      delete transform[6];
    } catch (e) {
      transform[1] = false;
      transform[6] = e.message;
    }
  }
}

function moveRule(up, index) {
  if (up && index == 0) {
    return;
  }

  if (!up && index == transformations.length - 1) {
    return;
  }

  var index2  = up ? index - 1 : index + 1;
  var tmp = transformations[index];
  transformations[index] = transformations[index2];
  transformations[index2] = tmp;
}

function compileTransformations() {
  for (var i = 0; i < transformations.length; i++) {
    if (transformations[i][0]) {
      try {
        transformations[i][5] = new RegExp(transformations[i][2], transformations[i][4]);
      } catch (e) {
        transformations[i][1] = false;
        transformations[i][6] = e.message;
      }
    }
  }
}

function applyTransformations(xml) {
  for (var i = 0; i < transformations.length; i++) {
    if (transformations[i][1]) {
      xml = xml.replace(transformations[i][transformations[i][0] ? 5 : 2], transformations[i][3]);
    }
  }
  return xml;
}

function load() {
  if (!window.localStorage) {
    return;
  }

  const _transformations = JSON.parse(localStorage.getItem('xml_transformations') || '[]');

  if (!_transformations.length) {
    return;
  }

  transformations = _transformations;
  compileTransformations();
}

function save() {
  if (!window.localStorage) {
    return;
  }

  if (!Object.keys(transformations).length) {
    localStorage.removeItem('xml_transformations');
    return;
  }

  localStorage.setItem('xml_transformations', JSON.stringify(transformations.map(function(t) {
    return [t[0], t[1], t[2], t[3], t[4]];
  })));
}
