var
ok = function(a, msg) {
  if (!a) {
    var err = new Error(msg);
    if (typeof process !== 'undefined') {
      console.log(err);
      process.exit(1);
    } else {
      throw err;
    }
  }
},
equal = function(expected, actual) {
  ok(expected === actual, 'expected "' + expected + '"; saw "' + actual + '"')
};

if (typeof createChain === 'undefined') {
  var createChain = require('./').createChain;
}

// Successful pre + post execution
var basic = createChain([
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
var noData = createChain([], function(data, fn) {
  fn(null, 'this is some data')
});

noData(function(errors, data) {
  equal('this is some data', data);
});

// No chain provided
var noChain = createChain(function(data, fn) {
  fn(null, data + ' world');
});

noChain('hello', function(errors, data) {
  equal('hello world', data);
});

// Return from bubbler function
var bubbleReturn = createChain([
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
var cancel = createChain([
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
var captureBubble = createChain([
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
var inner = createChain([
  function (data, next, cancel) {
    next(data + ' inner-capture ', function(data, done) {
      done(null, data + ' inner-bubble ');
    });
  }
], function(data, done) {
  done(null, data+' inner-core ')
});

var outer = createChain([
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
var afterCreation = createChain();
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
var filterNotAFunction = createChain(['abc']);
filterNotAFunction('', function(e, data) {
  ok(e, 'should error');
  ok(!data, 'data is nothing as it wasnt operated on');
});

// optional callback
var testHook = ''
var optionalCallback = createChain();
optionalCallback();

// chain with 2 cores
var inner = createChain([
  function(data, next) {
    next(data + 'icap,', function(outgoingData, done) {
      done(null, outgoingData + 'ibub,');
    });
  }
], function(data, fn) {
  fn(null, data + 'icore,')
})

var outer = createChain([
  function(data, next) {
    next(data + 'ocap,', function(outgoingData, done) {
      done(null, outgoingData + 'obub');
    });
  },
  inner, // add a filterchain into the filterchain.. oh my!

], function(data, fn) {
  fn(null, data + 'ocore,')
});

outer('', function(errors, data) {
  equal('ocap,icap,icore,ibub,ocore,obub', data);
});
