(function() {
  window.id = selector => document.getElementById(selector);

  window.toggle = (elmId, value) => {
    const elm = id(elmId);
    const display = value == null && elm.style.display == "none" || value;
    elm.style.display = display ? 'block' : "none";
  };

  window.selectText = function(elm) {
    elm.select();
  }

  window.copyText = function(elm) {
    elm.select();
    document.execCommand('copy');
  }
})();
