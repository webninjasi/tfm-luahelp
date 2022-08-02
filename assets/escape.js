(function() {
  // https://stackoverflow.com/questions/5499078/fastest-method-to-escape-html-tags-as-html-entities
  var escape = document.createElement('textarea');

  window.escapeHTML = function(html) {
    escape.textContent = html;
    return escape.innerHTML;
  }
  
  window.unescapeHTML = function(html) {
    escape.innerHTML = html;
    return escape.textContent;
  }
})();