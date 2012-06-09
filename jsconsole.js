if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(
            this instanceof fNOP ? this 
              : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
        };
    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();
    return fBound;
  };
}

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

    speed: 500,

    history: [],
    historyPointer: 0,

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

        case 38 :
          this.historyPointer--;
          if(this.historyPointer <= -this.history.length)
            this.historyPointer = -this.history.length;
          if(this.historyPointer < 0)
            this.el.val(this.history[this.history.length + this.historyPointer]);
          else
            this.el.val(this.history[this.historyPointer]);
          this.render();
          setTimeout(function() {
            this.setCaret(this.el.val().length);
          }.bind(this), 10);
          break;
        
        case 40 :
          this.historyPointer++;
          if(this.historyPointer >= this.history.length - 1)
            this.historyPointer = this.history.length - 1;

          if(this.historyPointer < 0)
            this.el.val(this.history[this.history.length + this.historyPointer]);

          else 
            this.el.val(this.history[this.historyPointer]);
          this.render();
          setTimeout(function() {
            this.setCaret(this.el.val().length);
          }.bind(this), 10);
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
      this.history.push(code);
      this.historyPointer = this.history.length;
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

    setCaret: function(pos) {
      var el = this.el.get(0);
      if(el.setSelectionRange) {
        el.focus();
        el.setSelectionRange(pos, pos);
      }
      else if (el.createTextRange) {
        var range = el.createTextRange();
        range.collapse(true);
        range.moveEnd('character', pos);
        range.moveStart('character', pos);
        range.select();
      }
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
