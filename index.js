(function() {
  module.exports = {
    createChain : function(chain, coreFn) {
      if (typeof chain === 'function' && !coreFn) {
        coreFn = chain;
        chain = [];
      } else {
        chain = chain || [];
      }

      var chainInstance = function(data, fn) {
        if (typeof data === 'function' && !fn) {
          fn = data;
          data = null;
        }

        var
        index = -1,
        errors = [],
        bubbles = [],
        current,
        capture = function(data) {
          index++;

          if (index>=chain.length) {
            if (coreFn) {
              coreFn(data, function(err, data) {
                if (err) {
                  errors.push(err);
                }
                // called when the core of the chain is complete
                bubble(data);
              });
            } else {
              bubble(data);
            }
          } else if (typeof chain[index] === 'function') {
            chain[index](data, function next(data, bubbleFn) {
              if (typeof bubbleFn === 'function') {
                bubbles.push(bubbleFn);
              } else if (bubbleFn) {
                // handle the case where flows are being composed
                // data is the errors
                if (data) {
                  errors.push(err)
                  return bubble(data);
                }
                data = bubbleFn;
              }

              capture(data)
            }, function cancel(err, data) {
              if (err) {
                errors.push(err)
              }
              bubble(data);
            });
          } else {
            errors.push(new Error('user error! A link in the chain was not a function'))
            bubble(data);
          }

        }, bubble = function(data) {

          if (bubbles.length < 1) {
            if (fn) {
              fn((errors.length) ? errors : null, data);
            }
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

        capture(data);
      };

      chainInstance.chain = chain;

      return chainInstance;
    }
  }

})();