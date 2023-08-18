const copyText = (elm, value) => {
  if (typeof(elm) == "string") {
    elm = document.getElementById(elm);
  }

  if (value) {
    elm.value = value;
  }

  elm.select();
  document.execCommand('copy');
};

function renderOptions(id, list, callback) {
  var container = document.getElementById(id);

  for (var i=0; i<list.length; i ++) {
    var option = document.createElement('option');
    option.value = list[i].value;
    option.innerHTML = list[i].label;
    container.appendChild(option);

    var breakline = document.createElement('br');
    container.appendChild(breakline);
  }

  container.addEventListener('change', function() {
    callback(container.value);
  });
}

function renderCheckboxes(id, list, callback) {
  var container = document.getElementById(id);

  function update() {
    var checkboxes = container.getElementsByTagName('input');
    var options = [...checkboxes].filter(x => x.checked).map(x => x.value);
    callback(options);
  }

  for (var i=0; i<list.length; i ++) {
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id + '_checkbox_' + i;
    checkbox.value = list[i].value;
    checkbox.addEventListener('change', update);
    container.appendChild(checkbox);

    var label = document.createElement('label');
    label.htmlFor = id + '_checkbox_' + i;
    label.innerHTML = list[i].label;
    container.appendChild(label);

    var breakline = document.createElement('br');
    container.appendChild(breakline);
  }
}

function updateValues(categoryType, categoryBits, maskBits) {
  if (categoryType != -1) {
    categoryBits = "";
    maskBits = "";
  }

  document.getElementById('output').value = [
    categoryType,
    categoryBits,
    maskBits
  ].map(x => x.toString()).filter(x => x.length).join(' ');
  document.getElementById('code_output').value = "tfm.exec.setPlayerCollision(" + [
    "playerName",
    categoryType,
    categoryBits,
    maskBits,
  ].map(x => x.toString()).filter(x => x.length).join(', ') + ")";
}

var categoryBits = 0;
var maskBits = 0;

renderOptions('collision-type', [
  {
    value: 0,
    label: "No collision",
  },
  {
    value: 1,
    label: "Collide with grounds only (normal)",
  },
  {
    value: 2,
    label: "Collide with grounds and mice",
  },
  {
    value: 3,
    label: "Collide with everything including ghost objects",
  },
  {
    value: 4,
    label: "Collide with everything but mice",
  },
  {
    value: 5,
    label: "Collide with mice only",
  },
  {
    value: -1,
    label: "Custom",
  },
], function(value) {
  updateValues(value, categoryBits, maskBits);

  if (value == -1) {
    document.getElementById('collision-category').style.display = '';
    document.getElementById('collision-mask').style.display = '';
  } else {
    document.getElementById('collision-category').style.display = 'none';
    document.getElementById('collision-mask').style.display = 'none';
  }
});

updateValues(0, 0, 0);

var categoryList = [
  {
    value: 1,
    label: "Mouse",
    collidesWith: [
      "Colliding Mouse",
      "Ground/Shaman Objects",
    ],
  },
  {
    value: 2,
    label: "Colliding Mouse",
    collidesWith: [
      "Mouse",
      "Colliding Mouse",
      "Ground/Shaman Objects",
    ],
  },
  {
    value: 4,
    label: "Ground/Shaman Object",
    collidesWith: [
      "Mouse",
      "Colliding Mouse",
      "Ground/Shaman Objects",
      "Ghost Object/Ground",
    ],
  },
  {
    value: 8,
    label: "Ghost Object/Ground",
    collidesWith: [
      "Ground/Shaman Objects",
      "Ghost Object/Ground",
    ],
  },
];

for (var i=4; i<32; i++) {
  var bits = Math.pow(2, i);
  categoryList.push({
    value: bits,
    label: "Custom Category (2^" + i + " = " + bits + ")",
    collidesWith: [],
  });
}

renderCheckboxes('collision-category', categoryList, function(options) {
  categoryBits = options.reduce((ret, x) => ret + parseInt(x), 0);
  updateValues(-1, categoryBits, maskBits);
});

renderCheckboxes('collision-mask', categoryList, function(options) {
  maskBits = options.reduce((ret, x) => ret + parseInt(x), 0);
  updateValues(-1, categoryBits, maskBits);
});
