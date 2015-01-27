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
model.addHandler(['value1', 'value2'], ['sum'], function(input, output, current) {
	output.sum = input.value1 + input.value2;
});
```

where the first two arguments are used to provide the set of input and output properties to be used by the handler.

Since composable models are useful precisely because they increase re-usabilty, it will often be the case that the property names used within the handler don't correlate with the names used by the model, in which case the `from()` method can be used for translation.

For example, if our summation handler is defined like this:

```js
function summationHandler(input, output, current) {
	output.sum = input.x + input.y;
}
summationHandler.inputs = ['x', 'y'];
summationHandler.outputs = ['sum'];
```

then we might make use of this handler as follows:

```js
model.addHandler([model.p('value1').as('x'), model.p('value2').as('y')], summationHandler.outputs, summationHandler);
```

In the case where we are happy to use the same names in the model as used by the handler we could write:

```js
model.addHandler(summationHandler.inputs, summationHandler.outputs, summationHandler);
```

or more simply:

```js
model.addHandler(summationHandler);
```

The `addHandler()` method accepts lists containing:

  * _property-specifiers_ (e.g. `[model.p('prop').as('prop')]`)
  * _properties_ (e.g. `[model.p('prop')]`)
  * _strings_ (e.g. `['prop']`)


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
model.addHandler([], ['value1', 'value2'] someHandler);
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


## Handler Functions

Handler functions normally look like this:

```js
function(input, output, current) {
  // ...
}
```

where `input`, `output` & `current` are maps of properties. The `current` property is very similar to `output`, except that it contains values based on the models state before any of the handlers were executed. It is of most importance to handlers whose output-properties may be updated externally using the `set()` method.


## Stateful Handlers

Regular handlers are completely stateless, and this allows handler instances to be re-used throughout the model as necessary. Handlers that require to state to work can use the `initState()` and `disposeState()` methods, as follows:

```js
function updateCounterHandler(input, output, current, state) {
  output.updateCounter = state.counter++;
}

updateCounterHandler.initState = function(state) {
  state.counter = 1;
};

updateCounterHandler.disposeState = function(state) {
  // nothing to do here
};
```


## Developing Within A Class

Rather than developing your model in ad-hoc fashion, you will typically develop your model within a class, in which case you have two options as to how you create the composable model:

1. `composer.create()`, when you want to keep methods like `set()` as private facets of the model you are building.
2. `composer.mixinTo()`, when you are happy to expose methods like `set()`.

A class using the first approach might look like this:

```js
function MyModel() {
  this._model = composerjs.create();
  this._model.addHandler(summationHandler);
  this._model.seal();
}
```

Whereas a class using the second approach would look like this:

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
model.node.addHandler(model.p('value1').as('x'), model.p('value2').as('y')], ['product'], function(input, output, current) {
	output.product = input.x * input.y;
});
```

Notice here how the properties can optionally come from remote parts of the model.


## Repeated Tree Elements

Quite often, models have multiple nodes with exactly the same shape, but where the number of nodes can vary over the lifetime of the model. When this is the case, the `addNodeList()` method can be used, for example:

```js
model.addNodeList('nodes');
model.nodes.addHandler([], ['name'], function(input, output, current, index) {
	output.name = 'node #' + (index + 1);
});
```

Notice here how the node-list handler is provided an additional `index` parameter that it can optionally make use of, and `current` is now a list of maps, but otherwise exactly the same handlers used for nodes can also be used for node-lists. Again, as with node handlers, it's also possible to refer to properties on remote parts of the model, but the `index` property always relates to the node on which `addHandler()` was invoked on.


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

Unlike normal nodes, nodes within node-lists don't have a `p()` method, and `p()` is available on the node-list instead. When used as an input-property for a handler, the the handler receives an array containing the values for all nodes within the node-list, for example:

```js
model.addHandler([nodes.p('name').as('names')], ['allNames'], function(input, output, current) {
	output.allNames = input.names.join(', ');
});
```

Alternatively, when used as an output-property, the handler is provided an `index` parameter and `current` becomes an array, as described earlier. Note, however, node-list output properties can only used if the handler is being added to the same node-list as the property is for.

In addition to listening to properties directly on the nodes within a node-list, it's also possible to listen to properties that are on a sub-node within these nodes, for example:

```js
model.nodes.childNode.p('prop');
```

plus node-lists can be navigated to via other node-lists, for example:

```js
model.nodes.morenodes.p('prop');
```


### Specialized Types

It's sometimes useful to create node-lists that contain specialized nodes, but where all nodes within the list conform to an agreed base-type. To enable this, node-list properties are also functions that can be invoked with a type argument, so that specializations can be created, for example:

```js
model.addNodeList('shapes');
model.shapes.set('area', 0); // all shapes have an 'area'
model.shapes('circle').set('radius', 0); // circles also have a 'radius'
model.shapes('triangle').set('type', 'equilateral'); // triangles also have a 'type'
model.seal();
```

We can then either create standard or specialized versions of nodes depending on whether `addNode()` is invoked with a `type` argument or not:

```js
model.shapes.addNode(); // first node only has an 'area' property
model.shapes.addNode('circle');
model.shapes.addNode('triangle');
```

If we later need to add a 'triangle' node to the beginning of the list, we can do this as follows:

```js
model.nodes.addNode('triangle', 0);
```

In this example, while `model.shapes.p('area')` could be used to refer to the `area` property that all shape nodes have, `model.shapes.p('radius')` could not be used to refer to the `radius` property, since not all shape nodes have a `radius` property, and `model.shapes('circle').p('radius')` would have to be used instead.


## Externally Updated Handlers

Some handlers may need to indicate their need to be re-executed &mdash; for example if they receive data from external servers &mdash; and this can be done using `output.hasBeenUpdated()`. For example, a `webSocketHandler` handler might be implemented as follows:

```js
function webSocketHandler(server) {
  var handler = function(input, output, current, state) {
    output.data = null;

    state.connection.onmessage = function(event) {
      output.data = event.data;
      output.hasBeenUpdated();
    };
  }

  handler.inputs = [];
  handler.outputs = ['data'];

  handler.initState = function(state) {
    state.connection = new WebSocket(server);
  };

  handler.disposeState = function(state) {
    state.connection.close();
  };

  return handler;
}
```

There are a number of interesting things worth nothing about this code sample:

  1. The handler initially sets the `data` property to `null`, so that downstream handlers know that the property is currently unavailable.
  2. The handler then repeatedly invokes `output.hasBeenUpdated()` after each time it updates `output.data`.
  3. The handler provides `initState()` and `disposeState()` method to perform resource allocation and de-allocation.


## Using A Handler Multiple Times

If you need to attach multiple instances of the same handler to a node, you can use `p()` and `as()` to prefix the properties, for example:

```js
model.addHandler([], [model.p('x-prop1').as('prop1'), model.p('x-prop2').as('prop2')], hander);
model.addHandler([], [model.p('y-prop1').as('prop1'), model.p('y-prop2').as('prop2')], hander);
```

but this becomes inconvenient when the handler has lots of properties that need prefixing. To help with this, the `props()` method can be used to prefix all properties en-masse, as follows:

```js
model.addHandler([], [composerjs.props(handler.outputs).prefixedWith('x-')], hander);
model.addHandler([], [composerjs.props(handler.outputs).prefixedWith('y-')], hander);
```

A related feature of `props()` is its `relativeTo()` method, that allows a list of property definitions to be made relative to some node, as though they had been specified with `node.p()`. This is useful for handlers within node-lists where the input-properties for that handler are available in the parent node, or some other node, for example:

```js
model.nodes.addHandler([], [composerjs.props(handler.outputs).relativeTo(model)], hander);
```

If you don't want all of the properties to be relative to the given node, you can use `for()` or `excluding()` to either whitelist or blacklist which properties will be affected, for example:

```js
composerjs.props(handler.inputs).relativeTo(model).for('only-this-property');
composerjs.props(handler.outputs).relativeTo(model).exluding('not-this-property');
```

Finally, the `normalize()` method can be used to up-convert a list of _strings_, _properties_ and _property-specifiers_ to a list containing only _property-specifiers_, for example:

```js
composerjs.props(['prop1', model.p('prop2'), node.p('prop3').as('x')]).normalize(node);
```


## Atomicity

There are three phases of action within the model:

  1. The external API is used to update state, or an externally updated handler indicates the need to be re-executed.
  2. Any implicated handlers are re-executed.
  3. External listeners are notified.

ComposerJs only notifies external listeners once all changes have been made, and achieves this by using [ASAP](https://www.npmjs.com/package/asap) to delay steps _2_ and _3_ until after the current call-stack has exited. However, in cases where step _1_ involves the use of any of the _accessor_ methods (e.g. `get()`), than step _2_ will be performed early, so that the model is in a consistent state.

To prevent the need for all testing code to be asynchronous, and to cope with situations where programs may need external listeners to be notified early, a `notfiyListeners()` method is provided, which can be used as follows:

```js
model.notifyListeners();
```

Finally, to prevent handlers from using the public API, use of any of the _mutator_ methods  (e.g. `set()`) in the _handler-phase_ will cause an error to be thrown, and use of any of the _accessor_ methods  (e.g. `get()`) will cause a warning to be logged to the console &mdash; we limit ourselves to logging to the console since developers will often find it useful to introspect the model while they are debugging handlers.


## Emitted events

ComposerJs emits the following events, all of which can be registered for using the `on()` method:

  * `change`
  * `mutation`
  * `beforechange`


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


### Before-Change Event

The `beforechange` event fires prior to the `change` and `mutation` events firing. It is useful since if `set()`, `addNode()` or `removeNode()` are invoked at this the point, the `change` and `mutation` events won't fire until the handlers have first had a chance to react to any changes.

This event can be registered for as follows:

```js
model.on('beforechange', function(model) {
  // ...
});
```

where `model` is the root model node.


## Serialization

Models can be serialized using the `stringify()` method, for example:

```js
var serializedForm = model.stringify([model.p('prop'), model.nodes.p('child-prop')]);
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


## Genuine Circular Dependencies

ComposerJs doesn't allow handlers that form circular dependencies, yet there are occasions when this is actually required. In such cases, the `beforechange` event can be used to create a circular dependency, but where the listener is responsible for ensuring that infinite loops don't occur.

For example:

```js
model.on('beforechange', function(model) {
  var startProperty = model.get('end-prop1') + model.get('end-prop2');

  if(startProperty != model.get('start-prop')) {
    model.set('start-prop', startProperty);
  }
});
```
