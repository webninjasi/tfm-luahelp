var transformations = [
  ["\\s+<", "<"],
  ["\\s+$", ""],
  ["([a-zA-Z_]=\".+?\") ", "$1"],
  ["MEDATA=\".+?\"", ""],
  ["<S (.*?)T=\"0\"(.*?)/>", "<S $1$2/>"],
];

compileTransformations();

id('xml_input').addEventListener('change', function() {
  id('xml_output').value = applyTransformations(this.value);
});

function compileTransformations() {
  for (var i = 0; i < transformations.length; i++) {
    transformations[i][0] = new RegExp(transformations[i][0], transformations[i][2] || "g");
  }
}

function applyTransformations(xml) {
  for (var i = 0; i < transformations.length; i++) {
    xml = xml.replace(transformations[i][0], transformations[i][1]);
  }
  return xml;
}
