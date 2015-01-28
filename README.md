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

More information about the format of the lists that can be provided to `addHandler()` is available within the [property-specifiers](#property-specifiers) section.


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


## Handlers Objects

Regular handlers are completely stateless, and this allows handler instances to be re-used throughout the model as necessary. However, handlers that require state can use `addHandlerConstructor()` instead of `addHandler()`, for example:

```js
model.addHandlerConstructor(MessageCountHandler);
```

where `MessageCountHandler` is a constructor for a _handler-object_ rather than a _handler-function_, for example:

```js
function MessageCountHandler(startCount) {
  this._messageCount = startCount || 1;
}

MessageCountHandler.prototype.handler = function(input, output) {
  output.messageCount = this._messageCount++;
};

MessageCountHandler.prototype.dispose = function() {
  // no resource de-allocation necessary for this handler
};

MessageCountHandler.prototype.inputs = ['message'];
MessageCountHandler.prototype.outputs = ['messageCount'];
```

Notice how the actual handler function is made available using the `handler` property, and that handler objects can also optionally have `dispose()` methods to allow them to perform any resource de-allocation.

The `bind()` method can be used to pre-define the arguments passed into the handler constructor, for example:

```js
model.addHandlerConstructor(MessageCountHandler.bind(null, 999));
```


## Property Specifiers

The `addHandler()` method requires two lists of relative _property-specifiers_ to be provided. Property specifiers are just simple Javascript objects having a `path` and an `as` property, for example:

```js
{
  path: 'prop1',
  as: 'x'
}
```

For convenience, these specifiers can be provided using the free floating `p()` method, for example:

```js
p('prop1').as('x');
```

Here are some examples of the _property-specifiers_ the fluent syntax causes to be created:

```js
p('prop1') -> {
  path: 'prop1',
  as: 'prop1'
}

p('prop1').as('x') -> {
  path: 'prop1',
  as: 'x'
}

p('../prop1').as('x') -> {
  path: '../prop1',
  as: 'x'
}

p('nodes/child/prop1').as('x') -> {
  path: 'nodes/child/prop1',
  as: 'x'
}
```

Given a mixed list of strings and _property-specifiers_, you can convert these to a pure list of _property-specifiers_ using the `props()` method, for example:

```js
var propertySpecifiers = node.props(['prop1', p('prop2')]);
```

which is equivalent to writing:

```js
var propertySpecifiers = [p('prop1'), p('prop2')];
```

Furthermore, given a list of _property-specifiers_, you can convert these to a list of properties using the `props().resolve()` method, for example:

```js
var properties = node.props([p('prop1').as('x'), p('../prop2'), 'prop3']).resolve();
```

is equivalent to:

```js
var properties = [node.p('prop1'), node.parent().p('prop2'), node.p('prop3')];
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

Tree shaped models can be created using the `addOptionalNode()` and `addNodeList()` methods.


### Optional Nodes

The `addOptionalNode()` method allows a single sub-node to be added to an existing model node, for example:

```js
model.addOptionalNode('node');
```

which causes the new model node to be immediately accessible as `model.node`, allowing handlers to be registered on the node, for example:

```js
model.node.addHandler(p('../value1').as('x'), p('../value2').as('y')], ['product'], function(input, output, current) {
	output.product = input.x * input.y;
});
```

and initial values to be set, for example:

```js
model.node.set('some-prop', 'some-value');
```

Notice how in the handler example above, the properties can optionally come from remote parts of the model.


#### Interacting With Optional Nodes

Now, although `model.node` can be navigated to immediately, the node won't effectively exist (e.g. `get()` can't be invoked yet) until the model has been sealed and `create()` has been invoked.

There are precisely three methods available for use with optional nodes:

  * `exists()` (whether the node currently exists or not)
  * `create()` (causes the node to come into existence)
  * `dispose()` (causes the node to cease existing)


### Node Lists

Quite often, models have multiple nodes with exactly the same shape, but where the number of nodes can vary over the lifetime of the model. When this is the case, the `addNodeList()` method can be used, for example:

```js
model.addNodeList('nodes');
model.nodes.addHandler([], ['name'], function(input, output, current, index) {
	output.name = 'node #' + (index + 1);
});
```

Notice here how the node-list handler is provided an additional `index` parameter that it can optionally make use of, and `current` is now a list of maps, but otherwise exactly the same handlers used for nodes can also be used for node-lists. Again, as with node handlers, it's also possible to refer to properties on remote parts of the model, but the `index` property always relates to the node on which `addHandler()` was invoked on.


#### Interacting With Node Lists

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


#### Node List Properties

Unlike normal nodes, nodes within node-lists don't have a `p()` method, and `p()` is available on the node-list instead, allowing you to abstractly refer to all properties within the node-list, for example:

```js
model.nodes.p('some-prop');
```

In much the same way, _property-specifiers_ can also only ever refer to the entire list of properites, for example:

```js
p('nodes/some-prop');
```

When used as an input-property for a handler, the handler receives an array containing the values for all nodes within the node-list, for example:

```js
model.addHandler([p('nodes/name').as('names')], ['allNames'], function(input, output, current) {
  output.allNames = input.names.join(', ');
```
In addition to listening to properties directly on the nodes within a node-list, it's also possible to listen to properties that are on a sub-node within these nodes, for example:

```js
p('nodes/childNode/prop');
```

plus node-lists can be navigated to via other node-lists, for example:

```js
p('nodes/morenodes/prop');
```

Alternatively, when used as an output-property, the handler is provided an `index` parameter and `current` becomes an array, as described earlier. Note, however, that output-properties can only specify properties for the node-list to which the handler is being added.


## Specialized Types

It's sometimes useful to create node-lists that contain specialized nodes, but where all nodes within the list conform to an agreed base-type, and optional nodes that can point to one of a number possible sub-types. To enable this, optional nodes and node-list properties are also functions that can be invoked with a type argument, so that specializations can be created.


### Node List Specialization

To create a specialized node-list we might write:

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


### Optional Node Specialization

For optional nodes, the specializations are created in exactly the same way, for example:


```js
model.addOptionalNode('child');
model.child.set('prop', 'some-value');
model.child('foo').set('foo-prop', 'some-value');
model.child('bar').set('bar-prop', 'some-value');
```

but where creation is handled with the `create()` method, for example:

```js
model.child.create('foo');
```

The `destroy()` method is not affected by type specialization, and continues to be invoked as:

```js
model.child.destroy();
```

### Specialized Handlers

As a convenience, you can add handlers that will only be applied for nodes that match a particular sub-type, for example:

```js
model.shapes('triangle').addHandler(triangleHandler);
```

or:

```js
model.child('foo').addHandler(fooHandler);
```

Finally, it's worth noting that handlers that are added to the base-type are still free to depend on properties that are only available within some of the specialized types, in which case it's their responsibility to check the shape of `input`, or alternatively to perform type any checking, for example:

```js
model.nodes.addHandler(['area', 'radius', 'type'], [p('../prop')], function(input, output, current, index) {
  if(model.nodes.item(index).nodeType == 'circle') {
    // ...
  }
  else if(model.nodes.item(index).nodeType == 'triangle') {
    // ...
  }
  else {
    // ...
  }
};
```


### Specialization Introspection

Specialized nodes have a `nodeType` property that can be used to determine the type of a node, for example:

```
if(node.nodeType == 'circle') {
  // ...
}
```

although, much like `instanceof`, use of `nodeType` may indicate that the types base definition has been incorrectly abstracted.


## Externally Updated Handlers

Some handlers may need to indicate their need to be re-executed &mdash; for example if they receive data from external servers &mdash; and this can be done using `output.markAsUpdated()`. For example, a `WebSocketHandler` handler might be implemented as follows:

```js
function WebSocketHandler(server) {
  this._connection = new WebSocket(server);
}

WebSocketHandler.prototype.handler = function(input, output, current) {
  output.data = null;

  this._connection.onmessage = function(event) {
    output.data = event.data;
    output.markAsUpdated();
  };
}

WebSocketHandler.prototype.dispose = function() {
  this._connection.close();
};

WebSocketHandler.prototype.inputs = [];
WebSocketHandler.prototype.outputs = ['data'];
```

There are a number of interesting things worth nothing about this code sample:

  1. The handler initially sets the `data` property to `null`, so that downstream handlers know that the property is currently unavailable.
  2. The handler then repeatedly invokes `output.markAsUpdated()` after each time it updates `output.data`.
  3. The handler provides a `dispose()` method to perform resource de-allocation.


## Using A Handler Multiple Times

If you need to attach multiple instances of the same handler to a node, you can use `p()` and `as()` to prefix the properties, for example:

```js
model.addHandler([], [p('x-prop1').as('prop1'), p('x-prop2').as('prop2')], hander);
model.addHandler([], [p('y-prop1').as('prop1'), p('y-prop2').as('prop2')], hander);
```

but this becomes inconvenient when the handler has lots of properties that need prefixing. To help with this, the `props()` method can be used to prefix all properties en-masse, as follows:

```js
model.addHandler([], [model.props(handler.outputs).prefixedWith('x-')], hander);
model.addHandler([], [model.props(handler.outputs).prefixedWith('y-')], hander);
```

A related feature of `props()` is its `relativeTo()` method, that allows a list of property definitions to be made relative to some node, as though they had been specified with `node.p()`. This is useful for handlers within node-lists where the input-properties for that handler are available in the parent node, or some other node, for example:

```js
model.nodes.addHandler([], [model.props(handler.outputs).relativeTo(model)], hander);
```

If you don't want all of the properties to be relative to the given node, you can use `for()` or `excluding()` to either whitelist or blacklist which properties will be affected, for example:

```js
model.props(handler.inputs).relativeTo(model).for('only-this-property');
model.props(handler.outputs).relativeTo(model).exluding('not-this-property');
```

Finally, the `normalize()` method can be used to up-convert a list of _strings_, _properties_ and _property-specifiers_ to a list containing only _property-specifiers_, for example:

```js
model.props(['prop1', p('../prop2'), p('prop3').as('x')]).normalize(node);
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

Additionally, it's also possible to register for atomic change events affecting a set of properties, like this:

```js
model.props(p('prop1'), p('prop2')).on('change', function() {
  // ...
});
```


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

Model state can be exported as JSON using the `export()` method, for example:

```js
var json = model.export([model.p('prop'), model.nodes.p('child-prop')]);
```

or if all properties are required, then simply:

```js
var json = model.export();
```

and re-imported using the `set()` method, for example:

```js
model.set(json);
```

JSON blobs are useful because they can be used to satisfy a number of requirements:

1. They allow models to easily be debugged (e.g. `console.log(model.export())`).
2. They allow model state to be traversed and introspected (e.g. `for(key in model.export() {...}`).
3. They still allow models to be serialized (e.g. `JSON.stringify(model.export())`).

When used for serialization/deserialization you should ensure that any default values are _set_ before the serialized state is _set_.


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


## Recursion

Optional nodes can be used to define recursive data structures with the help of the `defineAs()` method. For example, a tree of nodes could be defined like this:

```js
node.addOptionalNode('leaf1');
node.addOptionalNode('leaf2');
node.leaf1.defineAs(node);
node.leaf2.defineAs(node);
```

After sealing, we could create a small tree of actual nodes using code similar to this:

```js
node.leaf1.create();
node.leaf1.leaf1.create();
node.leaf1.leaf2.create();
```

Finally, we could require that each node has a `value` property unique to it, and a `sum` property containing the sum of all values beneath it in the tree, for example:

```js
node.addOptionalNode('leaf1');
node.addOptionalNode('leaf2');
node.set('value', 1);
node.addHandler([p('leaf1.value').as('value1'), p('leaf2.value').as('value2')], ['sum'], function(input, output) {
  output.sum = (input.value1 || 0) + (input.value2 || 0);
});
node.leaf1.defineAs(node);
node.leaf2.defineAs(node);
```

Notice here how the handler has guard to against `input.value1` and `input.value2`, both or either of which may be `null`.

### Recursive Circular Dependency Detection

Although optional nodes don't exist by default when the model is sealed, for the purposes of _circular-dependency_ detection we assume that they will exist. However, for nodes defined using `defineAs()` it's non-trivial to do, as there may be complex forms of mutual recursion and type specialization.

Therefore, models using `defineAs()` may throw a `CircularDependencyError` while invoking `create()`, as the handler evaluation order is re-calculated.
