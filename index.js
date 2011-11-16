(function() {

  function FilterChain(array, op) {
    this._chain = array;
    this._op = op;
  }

  FilterChain.prototype = {
    execute: function(data, fn) {
      var
      index = -1,
      op = this._op,
      that = this,
      chain = this._chain,
      errors = [],
      bubbles = [],
      capture = function(data) {
        index++;

        if (index>=chain.length) {
          if (op) {
            op(data, function(err, data) {
              if (err) {
                errors.push(err);
              }
              // called when the core of the chain is complete
              bubble(data);
            });
          } else {
            bubble(data);
          }
        } else {
          chain[index](data, function next(data, bubbleFn) {
            if (bubbleFn) {
              bubbles.push(bubbleFn);
            }

            capture(data)
          }, function cancel(err, data) {
            if (err) {
              errors.push(err)
            }
            bubble(data);
          });
        }

      }, bubble = function(data) {

        if (bubbles.length < 1) {
          fn((errors.length) ? errors : null, data);
        } else {
          var bubbleFn = bubbles.pop();
          var ret = bubbleFn(data, function done(err, data) {
            if (err) { errors.push(err); }
            bubble(data);
          });
          if (typeof ret !== 'undefined') {
            bubble(ret);
          }
        }
      };

      this._where = 0;
      capture(data);
    }
  };

  module.exports = {
    createChain : function(array, coreFn) {
      var ret = new FilterChain(array, coreFn);
      return ret;
    }
  }

})();