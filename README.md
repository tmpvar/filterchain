# filterchain

Perform work before and/or after an operation.

## API Signature

```javascript
// Create a chain with no layers and no core function
var chain = require('filterchain').createChain(/* layers */, /* core */);
```

Where `chain` is a function that accepts an optional `data` and a required `callback` with the arguments `errors` and `data`.  The `callback` is called after the filter chain has been executed.

`data` can be any javascript value

```javascript
// Except to show what the chain callback looks like
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

## What does it do?

In a sense, filter chains are similar to onions. Passing data into the outer husk causes it to flow down through each layer toward the core. Each function (aka: layer) along the path as a chance to either manipulate or validate the data before forwarding it onto the next layer or canceling it.

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

The core of the filter chain is an optional function.

```javascript
var fc = require('filterchain');
var chain = fc.createChain([

])

```

## Basic Usage

The basic operation of filterchain goes something like this:

```javascript
var fc =  require('filterchain');
var chain = fc.createChain([
  function(data, next, cancel) {
    next('override');
  } // you can add more functions here
]);

chain('initial data', function(data) {
  console.log(data); // outputs 'override'
});

```

## More interesting examples


```javascript
var fc =  require('filterchain');
var chain = fc.createChain();

```



## Install

### Node.js

    npm install filterchain

### Browser

works with just a script tag or an asynchronous module loading system like [require.js](http://requirejs.org/)


