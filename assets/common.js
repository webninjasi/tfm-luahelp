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

  //http://davidwalsh.name/javascript-debounce-function
  window.debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };
})();
