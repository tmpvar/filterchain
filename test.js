var
fc = require('./'),
equal = function(expected, actual) {
  if (expected !== actual) {
    console.log(new Error('expected "' + expected + '"; saw "' + actual + '"'));
    process.exit(1);
  }
}



// Successful pre + post execution
var basic = fc.createChain([
  function(data, next, cancel) {
    data.hello = 'pre-' + data.hello
    next(data, function(data, done) {
      data.hello += '-post';
      done(null, data);
    });
  },
]);

basic.execute({ hello : 'world' }, function(errors, data) {
  equal(null, errors)
  equal('pre-world-post', data.hello);
});


// Return from bubbler function
var bubbleReturn = fc.createChain([
  function(data, next, cancel) {
    next('hello', function(data, done) {
      return data + ' world';
    })
  }
]);

bubbleReturn.execute('', function(errors, data) {
  equal(null, errors);
  equal('hello world', data);
});


// Cancel request
var cancel = fc.createChain([
  function(data, next, cancel) {
    next(data, function(data, done) {
      done(null, data += 'outer');
    });
  },
  function(data, next, cancel) {
    cancel(null, data);
  },
  function(data, next, cancel) {
    data += 'entered center';
    next(data);
  }
]);

cancel.execute('', function(errors, data) {
  equal('outer', data);
});

// Call the core function after capture and before bubble
var captureBubble = fc.createChain([
  function (data, next, cancel) {
    next('capture-'+ data, function(data, done) {
      done(null, data + '-bubble');
    });
  }
], function(data, fn) {
  fn(null, data + '-core-');
});

captureBubble.execute('', function(errors, data) {
  equal(null, errors);
  equal('capture--core--bubble', data);
});