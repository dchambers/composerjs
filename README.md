# Introduction

ComposerJs allows you to compose models using a number of co-operating _handlers_, where each _handler_ is responsible for defining a number of _properties_ within the model, potentially using other _properties_ as input. This is useful if you need to repeatedly create models with overlapping, but differing functionality.

ComposerJs models have the following attributes:

  * The models can have an arbitrary tree structure that can be used to model any domain problems.
  * The shape of the model is described up-front, but is then locked-in during use.
  * Sub-sections of the model can be observed, so that change can be detected, and so that dependent properties can be recalculated.
  * Model updates are atomic in nature, and all reactive property recalculation occurs as part of a single external update.
  * No subscription management code is needed as the number of nodes within the model changes.


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


## Handler Objects

Handlers can be either functions or objects, where handler objects make their handler function available using a `handler` property. For example, the `summationHandler` function defined previously could instead be defined as an object as follows:

```js
function SummationHandler() {
  this.inputs = [p('x'), p('y')];
  this.outputs = [p('sum')];
}

SummationHandler.prototype.handler = function(in, out) {
  out.sum = in.x + in.y;
};
```


## Developing Within A Class

Rather than developing your model in ad-hoc fashion, you will typically develop your model within a class, in which case you have two options as to how you create the composable model:

1. `composer.create()`, when you want to keep methods like `set()` as private facets of the model you are building.
2. `composer.mixinTo()`, when you are happy to expose methods like `set()`.

Here's some example code using the second approach:

```js
function MyModel() {
  composerjs.mixinTo(this);
  this.addHandler(summationHandler);
  this.seal();
}
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

Quite often, models have multiple nodes with exactly the same shape, but where the number of nodes can vary over the lifetime of the model. When this is the case, the `addNodeList()` method can be used, for example:


```js
model.addNodeList('nodes');
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
  * `removeNode(index)` (remove the node at the given `index`, or the last node if no index is provided)

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
model.addNodeList('shapes');
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
  var connection;

  var handler = function(in, out) {
    out.data = null;
    connection = new WebSocket(server);

    connection.onmessage = function(event) {
      out.data = event.data;
      out.hasBeenUpdated();
    };
  }

  handler.dispose = function() {
    connection.close();
  };

  this.handler = handler;
}
```

There are a number of interesting things worth nothing about this code sample:

  1. The handler initially sets the `rate` property to `null` so that downstream handlers know that the property is currently unavailable.
  2. The handler then repeatedly invokes `out.hasBeenUpdated()` after each time it updates `out.rate`.
  3. The handler provides a `dispose()` method that enables it to perform any resource de-allocation.


## Using A Handler Multiple Times

If you need to attach multiple instances of the same handler to a node, you can use `p()` to prefix the properties, for example:

```js
model.addHandler([], [p('prop1').as('foo-prop1'), p('prop2').as('foo-prop2')], hander);
model.addHandler([], [p('prop1').as('bar-prop1'), p('prop2').as('bar-prop2')], hander);
```

but this becomes inconvenient when the handler has lots of properties that need prefixing. To help with this, the `ps()` method can be used to prefix all properties en-masse, as follows:

```js
model.addHandler([], [ps(handler.outputs).prefixedWith('foo-')], hander);
model.addHandler([], [ps(handler.outputs).prefixedWith('bar-')], hander);
```

A related feature of `ps()` is its `relativeTo()` method, that allows a list of relative property definitions specified with `p()` to be made relative to some node, as though they had been specified with `node.p()`. This is useful for handlers within node-lists where the input-properties for that handler are available in the parent node, or some other node, for example:

```js
model.nodes.addHandler([], [ps(handler.outputs).relativeTo(model)], hander);
```

If you don't want all of the properties to be relative to the given node, you can use `for()` or `excluding()` to either whitelist or blacklist which properties will be affected, for example:

```js
ps(handler.inputs).relativeTo(model).for('only-this-property');
ps(handler.outputs).relativeTo(model).exluding('not-this-property');
```


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



## Serialization

Models can be serialized using the `stringify()` method, for example:

```js
var serializedForm = model.stringify([model.p('prop1'), model.p('prop2')]);
```

or if all properties are to be serialized, then simply:

```js
var serializedForm = model.stringify();
```

and de-serialized using the `parse()` method, for example:

```js
model.parse(serializedForm);
```

The `parse()` method should be used _after_ `set()` has been invoked to provide any properties that won't be provided by handlers. Additionally, although `stringify()` and `parse()` can be used for serlialization, they can also be used as a convenient way to revert a model back to a known state.
