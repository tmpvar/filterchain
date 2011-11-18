# filterchain

Perform work before and/or after an operation.

## Disclaimer

This is not meant to be used as async flow control, but is merely a way to dynamically upgrade the functionality of getters and setters.

This also means that errors will not stop the chain of events here, you must specifically cancel the current layer in order to avoid performing the `core` action.

## Learn by example

The basic operation of filterchain goes something like this:

```javascript
var chain = require('filterchain').createChain([
  function(data, next, cancel) {
    // forward to the next layer
    next('override');
  } // you can add more functions here
]);

chain('initial data', function(data) {
  console.log(data); // outputs 'override'
});

```

and here is the outer api


```javascript
// Create a chain with no layers and no core function
var chain = filterchain.createChain(/* layers */, /* core */);
```

Where `chain` is a function that accepts an optional `data` and a optional `callback` with the arguments `errors` and `data`.  The `callback` is called after the filter chain has been executed.

`data` can be any javascript value

```javascript
// Excerpt to show what the chain callback looks like.
// `errors` is either null (no errors) or an array
chain('some optional data', function(errors, data) {})
```

And `layers` is an array of functions

```javascript
var chain = require('filterchain').createChain([
  function(data, next, cancel) {

    // just forward the data, this is basically a no-op
    next(data);
  }
], core);
```
`next` is a function with the signature `next(data[, bubbleFunction])`
`cancel` is a function with the signature `cancel([error])`

And `core` is the function that will be run after the capture phase but before the bubble phase. The `core` method should accept `data` and `fn`.

```javascript
var chain = require('filterchain').createChain([], function(data, fn) {

  // send the incoming back the same way it came
  if (data === true) {
    fn(null, 'tricked ya!')
  } else {
    fn('error!')
  }

});

chain(true, function(errors, data) {
  console.log(data); // outputs: 'tricked ya!'
});

chain(false, function(errors, data) {
  console.log(errors[0]); // outputs: 'error!'
  console.log(data); // outputs: undefined
});

```

## What (else) does it do?

In a sense, filter chains are similar to onions. Passing data into the outer husk causes it to flow down through each layer toward the core. Each function (aka: layer) along the path as a chance to either manipulate or validate the data before forwarding it onto the next layer or canceling it.

### Manipulate and forward data

```javascript
var chain = require('filterchain').createChain([
  function(data, next, cancel) {

    // ignore the incoming data and forward something more
    // to our liking
    next('pass this along');
  }
]);

chain(function(errors, data) {
  console.log(data);  // outputs 'pass this along'
});
```

### Cancel + bubble

Cancelling causes the flow of the chain to be reversed immediately.

```javascript
var chain = require('filterchain').createChain([
  function(data, next, cancel) {

    // the first argument to cancel is an optional error.  The error
    // will be collected and sent to the final callback for processing
    cancel('fat chance');
  }
], function(data, fn) {

  // this is never called
  fn('some other thing');
});

chain(function(errors, data) {
  console.log(errors[0]); // ouputs 'fat chance'
});

```

### Post process data

Passing a function as the second argument to `next` will cause the filter chain to call that method during the bubble phase

```javascript
var fc = require('filterchain');
var chain = fc.createChain([
  function(data, next, cancel) {
    next(data, function(data, done) {
      // You can return a value here or perform
      // an async operation and send the result through done
      done(null, data + ' + post processing')
    });
  }
]);

chain('initial value', function(errors, data) {
  console.log(data); // outputs 'initial value + post processing'
});

```

The first argument to `done` is an error and the second is the data that will be bubbled back out to the outer husk of the filter chain.

### Compose filter chains

```javascript

var inner = require('filterchain').createChain([
  function(data, next) {
    next(data + ' (inner capture ->', function(outgoingData, done) {
      done(null, outgoingData + ' inner bubble)');
    });
  }
], function(data, fn) {
  fn(null, data + '[inner core] ->')
})

var outer = require('filterchain').createChain([
  function(data, next) {
    next(data + 'outer capture ->', function(outgoingData, done) {
      done(null, outgoingData + ' outer bubble');
    });
  },
  inner, // add a filterchain into the filterchain.. oh my!

], function(data, fn) {
  fn(null, data + ' [outer core] ->')
});

outer('run: ', function(errors, data) {
  // outputs: 'run: outer capture -> (inner capture ->[inner core] -> inner bubble) [outer core] -> outer bubble'
  console.log(data);
})
```

## Contrived Use Cases

### User creation example

```javascript
var createUser = require('filterchain').createChain([
  function unique(username, next, cancel) {
    db.exists({ username : username }, function(err, result) {
      if (err) {
        cancel(err);
      } else if (result === true) {
        cancel('sorry, that username already exists')
      } else {
        next(username);
      }
    });
  }
], function(data, fn) {
  db.save({ username : username }, fn);
});

createUser('tmpvar', function(errors, data) {
  console.log(errors[0]); // outputs 'sorry, that username already exists'
});

createUser('tmpvar-not-taken', function(errors, data) {
  console.log(errors); // outputs null
  console.log(data); // outputs '{ _id : 2, username: "tmpvar-not-taken" }'
});
```

### Calculated attributes in backbone

__note__: this is purely conceptual

```javascript

var Rectangle = Backbone.Model.extend({
  initialize : function() {
    this.calculatedAttributes = {
      area : filterchain.createChain(function(data, fn) {
        // Not only is the return value calculated, but you
        // can add filters and post processing to your values.
        //
        // Simply add filters to the chain during creation or
        // chain.layers.push(function(data, next, cancel) {});

        fn(data.width * data.height);
      });
    }
  },
  get : function(key) {
    var that = this;

    if (this.calculatedAttributes[key]) {
      this.calculatedAttributes[key](that.toJSON(), function(result) {
        value = result;
      });

      if (typeof value !== 'undefined') {
        return value;
      }
    }

    // fall back to the default backbone behavior
    return Backbone.Model.prototype.get.call(this, key);
  }
});

var a = new Rectangle({ x: 10, y : 4 });
console.log(a.get('area')); // outputs '40'

```

## Install

### Node.js

    npm install filterchain

### Browser

works with a plain ol' script tag and access it via `window.createChain`
