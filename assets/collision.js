var categoryList = [
  {
    value: 32,
    label: "Non-colliding",
    collidesWith: [],
  },
  {
    value: 1,
    label: "Mouse (default)",
    collidesWith: [ 2, 3, 5 ],
  },
  {
    value: 2,
    label: "Colliding Mouse",
    collidesWith: [ 1, 2, 3, 5 ],
  },
  {
    value: 4,
    label: "Ground/Shaman Object",
    collidesWith: [ 1, 2, 3, 4 ],
  },
  {
    value: 8,
    label: "Ghost Object/Ground",
    collidesWith: [ 3, 4 ],
  },
  {
    value: 16,
    label: "Only Mice Colliding Ground",
    collidesWith: [ 1, 2 ],
  },
];

for (var i=6; i<32; i++) {
  var bits = Math.pow(2, i);
  categoryList.push({
    value: bits,
    label: "Custom Category (2^" + i + " = " + bits + ")",
    collidesWith: [],
  });
}

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
    checkbox.value = i;
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
  var collisionList = [];

  if (categoryList[categoryType]) {
    collisionList = categoryList[categoryType].collidesWith.map(x => categoryList[x].label) || [];
  }
  else if (categoryType == -1) {
    var category = categoryBits.map(x => categoryList[x]).reduce((ret, x) => ret + x.value, 0);
    collisionList = maskBits.map(x => categoryList[x]).filter(
      x => x.collidesWith.reduce((ret, x) => ret + categoryList[x].value, 0) & category
    ).map(
      x => x.label
    );
  }

  if (categoryType != -1) {
    categoryBits = "";
    maskBits = "";
  } else {
    categoryBits = categoryBits.reduce((ret, x) => ret + categoryList[x].value, 0);
    maskBits = maskBits.reduce((ret, x) => ret + categoryList[x].value, 0);
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

  document.getElementById('collision-list').innerHTML = collisionList.join('<br>');
}

var categoryBits = [];
var maskBits = [];

renderOptions('collision-type', [
  ...categoryList.slice(0, 6).map((x, index) => ({
    value: index,
    label: x.label,
  })),
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

renderCheckboxes('collision-category', categoryList, function(options) {
  categoryBits = options.map(x => parseInt(x));
  updateValues(-1, categoryBits, maskBits);
});

renderCheckboxes('collision-mask', categoryList, function(options) {
  maskBits = options.map(x => parseInt(x));
  updateValues(-1, categoryBits, maskBits);
});
