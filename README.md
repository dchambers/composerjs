# Introduction

ComposerJs allows you to compose models using a number of co-operating _handlers_, where each _handler_ is responsible for defining a number of _properties_ within the model, potentially using other _properties_ as input. This is useful if you need to repeatedly create models with overlapping, but differing functionality.

ComposerJs models have the following attributes:

  * The models can have an arbitrary tree structure that can be used to model any domain problems.
  * The shape of the model is described up-front, but is then locked-in during use.
  * Sub-sections of the model can be observed, so that change can be detected, and so that dependent properties can be recalculated.
  * Model updates are atomic in nature, and all reactive property recalculation occurs as part of a single external update.
  * No subscription management code is needed as the number of nodes within the model changes.
  * Usage of the model is prevented when it's in an incoherent state, to prevent subtle bugs.


## Basic Usage

You can create a model as follows:

```js
var composerjs = require('composerjs');
var model = composerjs.create();
```

after which you can add handlers to the model, such as the following summation handler:

```js
var p = composerjs.p;
model.addHandler([p('value1'), p('value2')], [p('sum')], function(in, out) {
	out.sum = in.value1 + in.value2;
});
```

Here, `p()` denotes _property_, and is used to indicate the set of _input-properties_ (the first argument) and the set of _output-properties_ (the second argument) to be used by the handler.

Since composable models are useful precisely because they increase re-usabilty, it will often be the case that the property names used within the model don't correlate with the names used by the handler, in which case the `as()` method can be used for translation.

For example, if our summation handler is defined like this:

```js
function summationHandler(in, out) {
	out.sum = in.x + in.y;
}
summationHandler.inputs = [p('x'), p('y')];
summationHandler.outputs = [p('sum')];
```

then we might make use of this handler as follows:

```js
model.addHandler([p('value1').as('x'), p('value2').as('y')], summationHandler.outputs, summationHandler);
```

In the case where we are happy to use the same names in the model as used by the handler we could write:

```js
model.addHandler(summationHandler.inputs, summationHandler.outputs, summationHandler);
```

or more simply:

```js
model.addHandler(summationHandler);
```

## Sealing The Model

When you've finished adding handlers you can invoke the `seal()` method to permanently lock-down the shape of the model, so that only the values within the model can change after this point. This can done as follows:

```js
model.seal();
```

The `seal()` method performs a number of model verification checks:

  1. It ensures that all _input-properties_ have been provided.
  2. It ensures that _output-properties_ have been provided by at most one handler.
  3. It ensures there are no circular dependencies.

Given that the `seal()` method ensures that all _input-properties_ have been provided, an error would be thrown given the example code written so far, since `value1` and `value2` have yet to be provided.

We could solve this by either adding another handler before invoking `seal()`, for example:

```js
model.addHandler([], [p('value1'), p('value2')] someHandler);
model.seal();
```

or by invoking the `set()` method, which allows entirely new properties to be defined if invoked prior to `seal()`, for example:

```js
model.set('value1', 'some-value');
model.set('value2', 'another-value');
model.seal();
```


## Multiplexing

Although the `seal()` method ensures that _output-properties_ have been provided by at most one handler, this is not always desirable, in which case the `allowMultiplexing()` method can be invoked prior to `seal()` to loosen this restriction, as follows:

```js
model.p('sum').allowMultiplexing();
```


## External Model Usage

The current value of a property within the model can be retrieved using the `get()` method, for example:

```js
var answer = model.get('answer');
```

and, conversely, can be set using the `set()` method, as follows:

```js
model.set('answer', 42);
```

and model observation is supported using the emitter pattern, for example:

```js
model.p('answer').on('change', function(value) {
	console.log("The answer is '" + value + "'.");
});
```


## Tree Shaped Models

Tree shaped models can be created using the `addNode()` and `addNodeList()` methods. The `addNode()` method allows a single sub-node to be added to an existing model node, for example:

```js
model.addNode('node');
```

which causes the new model node to be immediately accessible as `model.node`, allowing handlers to create or depend on the properties of the sub-node, for example:

```js
model.node.addHandler([model.p('value1'), model.p('value2')], [p('product')], function(in, out) {
	out.product = in.value1 * in.value2;
});
```

Notice here how the properties can optionally be fully-qualified, allowing properties from remote parts of the model to be listened to or updated.


## Repeated Tree Elements

Quite often, models have multiple nodes with exactly the same shape, but where the number of nodes can vary over the lifetime of the model. When this is the case, the `createNodeList()` method can be used, for example:


```js
model.createNodeList('nodes');
model.nodes.addHandler([], [p('name')], function(in, out, index) {
	out.name = 'node #' + (index + 1);
});
```

Notice here how the node-list handler is provided an additional `index` parameter that it can optionally make use of, but otherwise exactly the same handlers used for nodes can also be used for node-lists. Again, as with node handlers, it's also possible to optionally fully-qualify the input or output properties, allowing remote parts of the model to be listened to or updated, but the `index` property always relates to the node on which `addHandler()` was invoked on.


### Interacting With NodeLists

Node-lists have four useful methods that can be used both before and after `seal()` has been invoked:

  * `length()` (the number of nodes within the node-list)
  * `item(index)` (retrieve the node at the given `index`)
  * `addNode(index)` (add a node, optionally at a given `index`)
  * `removeNode(index)` (remove the node at the given `index`)

For example, we can retrieve the `name` property of the last item within the `nodes` node-list as follows:

```js
model.nodes.item(model.nodes.length()).get('name');
```

or add a new node to the end of a node-list like this:

```js
model.nodes.addNode();
```


### NodeList Properties

Unlike normal nodes, nodes within node-lists don't have a `p()` method, and the `p()` method is available on the node-list instead. When used to request an input-property, the input-property received is an array containing every property-value for a given property name across an entire node-list, for example:

```js
model.addHandler([model.nodes.p('name').as('names')], [p('allNames')], function(in, out) {
	out.allNames = in.names.join(', ');
});
```

Here, node-list properties can't be used as output-properties.

In addition to listening to properties directly on the nodes within a node-list, it's also possible to listen to properties that are on a sub-node within these nodes, for example:

```js
model.nodes.childNode.p('prop');
```

or even properties on grandchild nodes, for example:

```js
model.nodes.morenodes.p('prop');
```


### Specialized Types

It's sometimes useful to create node-lists that contain specialized nodes, but where all nodes within the list conform to an agreed base-type. To enable this, node-list properties are also functions that can be invoked with a type argument, so that specializations can be created, for example:

```js
model.createNodeList('shapes');
model.nodes.set('area', 0); // all shapes have an 'area'
model.nodes('circle').set('radius', 0); // circles also have a 'radius'
model.nodes('triangle').set('type', 'equilateral'); // triangles also have a 'type'
model.seal();
```

We can then either create standard or specialized versions of nodes depending on whether `addNode()` is invoked with a `type` argument or not:

```js
model.nodes.addNode(); // first node only has an 'area' property
model.nodes.addNode('circle');
model.nodes.addNode('triangle');
```

If we later need to add a 'triangle' node to the beginning of the list, we can do this as follows:

```js
model.nodes.addNode('triangle', 0);
```

In this example, while `model.nodes.p('area')` could be used to refer to the `area` property that all shape nodes have, `model.nodes.p('radius')` could not be used to refer to the `radius` property, since not all shape nodes have a `radius` property.


## Externally Updated Handlers

Some handlers may need to indicate their need to be re-executed &mdash; for example if they receive data from external servers &mdash; and this can be done using the handlers' `reExecute()` method. For example, a `WebSocketHandler` class might be implemented as follows:

```js
function WebSocketHandler(server) {
  var data;

  var handler = function(in, out) {
    if(!data) {
      return false;
    }
    else {
      out.data = data;
    }
  }

  handler.dispose = function() {
    connection.close();
  };

  var connection = new WebSocket(server);
  connection.onmessage = function(event) {
    data = event.data;
    handler.reExecute();
  };

  this.handler = handler;
}
```

There are a number of interesting things worth nothing about this code sample:

  1. The handler returns `false` if data has yet to be received, and it's currently unable to provide it's designated output-properties.
  2. The handler has chosen to provide a `dispose()` method that enables it to perform any resource de-allocation.
  3. The handler itself has not provided a `reExecute()` method, and instead the model automatically adds this method when `addHandler()` is invoked.


## Atomicity

There are three phases of action within the model:

  1. The external API is used to update state, or an externally updated handler indicates the need to be re-executed.
  2. Any implicated handlers are re-executed.
  3. External listeners are notified.

ComposerJs only notifies external listeners once all changes have been made, and achieves this by using [ASAP](https://www.npmjs.com/package/asap) to delay steps _2_ and _3_ until after the current call-stack has exited. However, in cases where step _1_ involves use of the `get()` method, than step _2_ will be performed early, so that the model is in a consistent state.

To prevent the need for all testing code to be asynchronous, and to cope with situations where programs may need external listeners to be notified early, a `notfiyListeners()` method is provided, and which can be used as follows:

```js
model.notifyListeners();
```

Finally, to prevent handlers from using the public API (e.g. `get()` and `set()`) such methods will throw an error if invoked while any other part of the public API is still being invoked.


## Emitted events

ComposerJs emits the following events, all of which can be registered for using the `on()` method:

  * `change`
  * `mutation`
  * `pending`
  * `resumed`
  * `ready`


### Change Event

The `change` event fires when a properties value has changed, and is registered for as follows:

```js
model.p('prop').on('change', function(value) {
  // ...
});
```

Here, `value` is the new value of the property after the change.


### Mutation Event

The `mutation` event fires if nodes are either added or removed from a node-list, and is registered for as follows:

```js
model.nodes.on('mutation', function(nodes) {
  // ...
});
```

Here, `nodes` is the array of nodes after the change.


### Pending, Resumed & Ready Events

The `pending` event fires if any of the handlers are temporarily unable to provide their output-properties, while the `resumed` event fires as soon as normal service has been resumed. These events can be registered for as follows:

```js
model.on('pending', function(handler) {
  // ...
});
```

and:

```js
model.on('resumed', function() {
    // ...
});
```

Handlers signify their inability to provide their output-properties by returning `false`. Since using the model while it's in this _incoherent_ state will cause an error, models that have handlers that can get into this state should perform all model updates within a `ready` call-back, for example:

```js
model.on('ready', function() {
  model.set('prop', 'some-value');
});
```

The `ready` event is unique in that it only ever fires once, and in that it fires immediately if the model is currently in a _ready_ state.



## Serialization

Models can be serialized using the `stringify()` method, for example:

```js
var serializedForm = model.stringify()
```

and de-serialized using the `unstringify()` method:

```js
model.unstringify(serializedForm);
```

The `unstringify()` method should be used _after_ `set()` has been invoked to provide any properties that won't be provided by handlers.
