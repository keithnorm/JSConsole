(function($) {

  function JSConsole(el, options) {
    this.el = el;
    this.options = options;
    this.initialize();
  }

  JSConsole.prototype = {
    template: '\
      <div class="prompt">\
        $<span class="input">click to start<span class="caret">&nbsp;</span></span>\
        <div class="result"></div>\
      </div>',

    speed: 800,

    initialize: function() {
      this.el
      .css({opacity: 0, height: 1, width: 0, border: 0, position: 'absolute'})
      .before(this.template)
      .keydown(this.onKeydown.bind(this))
      .keyup(this.debounce(this.onKeyup.bind(this), 400));
      this.console = this.el.prev()
      .click(function() {
        this.render();
        this.start();
        this.el.focus();
      }.bind(this));
      this.prompt = this.console.find('.input');
      this.caret = this.prompt.find('.caret');
      this.caretHTML = this.caret.wrap('<div/>').parent().html();
      this.caret.unwrap('<div/>');
    },

    onKeydown: function(e) {
      switch(e.which) {
        case 13 :
          e.preventDefault();
          this.execute();
          break;
        default :
          this.stop();
          setTimeout(function() {
            this.render();
          }.bind(this), 10);
          break;
      }
    },

    onKeyup: function() {
      this.start();
    },

    execute: function() {
      var code = $.trim(this.prompt.text());
      try {
        var result = (new Function('return ' + code)).call(window);
      }
      catch (e) {
        var result = e.toString();
      }
      this.el.val('');
      this.render();
      this.console.find('.result').html(result ? '=> ' + result : '');
    },

    render: function() {
      var text = this.el.val();
      var pointer = this.getCaret();
      var preCaretText = text.substring(0, pointer);
      var caretText = text.substring(pointer, pointer + 1);
      if(caretText == ' ' || caretText == '')
        caretText = '&nbsp;';
      var postCaretText = text.substring(pointer + 1);
      this.prompt.html(preCaretText + this.caretHTML + postCaretText).find('.caret').html(caretText);
      
    },

    blink: function(on) {
      if(this.prompt.find('.caret').length && !on) {
        this.caret = this.prompt.find('.caret').replaceWith(
          this.prompt.find('.caret').text());
      }
      else
        this.render();
    },

    stop: function() {
      clearInterval(this.timer);
    },

    start: function() {
      this.stop();
      this.blink();
      this.timer = setInterval(this.blink.bind(this), this.speed);
    },

    getCaret: function() {
      var el = this.el.get(0);
      if (el.selectionStart) {
        return el.selectionStart;
      } else if (document.selection) {
        el.focus();

        var r = document.selection.createRange();
        if (r == null) {
          return 0;
        }

        var re = el.createTextRange(),
            rc = re.duplicate();
        re.moveToBookmark(r.getBookmark());
        rc.setEndPoint('EndToStart', re);

        return rc.text.length;
      } 
      return 0;
    },

    debounce: function(func, wait, immediate) {
      var timeout;
      return function() {
        var context = this, args = arguments;
        var later = function() {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };
        if (immediate && !timeout) func.apply(context, args);
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
  };

  $.fn.jsconsole = function() {
    return this.each(function(i, el) {
      var $el = $(el);
      var console = new JSConsole($el);
      $el.data('jsconsole', console);
    });
  };
})(jQuery);
