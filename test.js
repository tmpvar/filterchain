var
fc = require('./'),
ok = function(a, msg) {
  if (!a) {
    console.log(new Error(msg));
    process.exit(1);
  }
},
equal = function(expected, actual) {
  ok(expected === actual, 'expected "' + expected + '"; saw "' + actual + '"')
};

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

basic({ hello : 'world' }, function(errors, data) {
  equal(null, errors)
  equal('pre-world-post', data.hello);
});

// No provided data
var noData = fc.createChain([], function(data, fn) {
  fn(null, 'this is some data')
});

noData(function(errors, data) {
  equal('this is some data', data);
});

// No chain provided
var noChain = fc.createChain(function(data, fn) {
  fn(null, data + ' world');
});

noChain('hello', function(errors, data) {
  equal('hello world', data);
});

// Return from bubbler function
var bubbleReturn = fc.createChain([
  function(data, next, cancel) {
    next('hello', function(data, done) {
      return data + ' world';
    })
  }
]);

bubbleReturn('', function(errors, data) {
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

cancel('', function(errors, data) {
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

captureBubble('', function(errors, data) {
  equal(null, errors);
  equal('capture--core--bubble', data);
});


// Composable chains
var inner = fc.createChain([
  function (data, next, cancel) {
    next(data + ' inner-capture ', function(data, done) {
      done(null, data + ' inner-bubble ');
    });
  }
], function(data, done) {
  done(null, data+' inner-core ')
});

var outer = fc.createChain([
  function (data, next, cancel) {

    next(data + ' outer-capture ', function(data, done) {
      done(null, data + ' outer-bubble ');
    });
  },
  inner
], function(data, done) {
  done(null, data + ' outer-core ')
});

outer('', function(errors, data) {
  equal(null, errors);
  equal(' outer-capture  inner-capture  inner-core  inner-bubble  outer-core  outer-bubble ', data);
});


// Manipulate filterchain after creation
var afterCreation = fc.createChain();
afterCreation.layers.push(function(data, next, cancel) {
  next('made it');
});

afterCreation.core = function(data, fn) {
  fn(null, data + ' + core');
};

afterCreation('', function(errors, data) {
  equal(null, errors);
  equal('made it + core', data);
});

// User error
var filterNotAFunction = fc.createChain(['abc']);
filterNotAFunction('', function(e, data) {
  ok(e, 'should error');
  ok(!data, 'data is nothing as it wasnt operated on');
});

// optional callback
var testHook = ''
var optionalCallback = fc.createChain();
optionalCallback();

