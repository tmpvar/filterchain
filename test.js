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
      done();
    });
  },
]);

basic.execute({ hello : 'world' }, function(errors, data) {
  console.log(errors);
  if (errors) { throw new Error(errors) }
  equal('pre-world-post', data.hello);
});

// Cancel request
var cancel = fc.createChain([
  function(data, next, cancel) {
    next(data, function(data, done) {
      done(data += 'outer');
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
  equal(data, 'outer');
});