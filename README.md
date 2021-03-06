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
model.addHandler(['p1', 'p2'], ['sum'], function(input, output) {
	output.sum = input.p1 + input.p2;
});
```

where the first two arguments are used to provide the set of input and output properties to be used by the handler.


For example, if our summation handler is defined like this:

```js
function summationHandler(input, output) {
	output.sum = input.x + input.y;
}
summationHandler.inputs = ['x', 'y'];
summationHandler.outputs = ['sum'];
```

then we might make use of this handler as follows:

```js
var p = require('composerjs').p;
model.addHandler([p('p1').as('x'), p('p2').as('y')], summationHandler.outputs,
	summationHandler);
```

In the case where we are happy to use the same names in the model as used by the handler we could write:

```js
model.addHandler(summationHandler.inputs, summationHandler.outputs, summationHandler);
```

or more simply:

```js
model.addHandler(summationHandler);
```

More information about the format of the lists that can be provided to `addHandler()` is available within the [relative-property-specifiers](#relative-property-specifiers) section.


## Sealing The Model

When you've finished adding handlers you can invoke the `seal()` method to permanently lock-down the shape of the model, so that only the values within the model can change after this point. This can done as follows:

```js
model.seal();
```

The `seal()` method performs a number of model verification checks:

  1. It ensures that all _input-properties_ have been provided.
  2. It ensures that _output-properties_ have been provided by at most one handler.
  3. It ensures there are no circular dependencies.

Given that the `seal()` method ensures that all _input-properties_ have been provided, an error would be thrown given the example code written so far, since `p1` and `p2` have yet to be provided.

We could solve this by either adding another handler before invoking `seal()`, for example:

```js
model.addHandler([], ['p1', 'p2'] someHandler);
model.seal();
```

or by invoking the `define()` method, which allows non-handler provided properties to be defined, for example:

```js
model.define('p1', 'some-value');
model.define('p2', 'another-value');
model.seal();
```


## Model Usage

The current value of a property within the model can be retrieved using the `get()` method, for example:

```js
var answer = model.get('answer');
```

and, conversely, can be set using the `set()` method, as follows:

```js
model.set('answer', 42);
```

but where the `set()` method can only be used for properties that were _defined_, and not for properties provided by handlers.

Finally, model observation is supported using the emitter pattern, for example:

```js
model.props(['question', 'answer']).on('change', function(value) {
	console.log("The answer is '" + value + "'.");
});
```


## Handler Functions

Handler functions look like this:

```js
function(input, output, currentInput, currentOutput) {
	// ...
}
```

where `input`, `output`, `currentInput` and `currentOutput` are all maps of properties.

This is how each map works:

  * `input` contains every property required by the handler.
  * `output` starts off empty, and must be populated by the handler.
  * `currentInput` contains the `input` map produced by the handler the last time it was invoked, or an empty map if this is the initial invocation.
  * `currentOutput` contains the `output` map produced by the handler the last time it was invoked, or an empty map if this is the initial invocation.


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

Tree shaped models can be created using the `addNode()` and `addNodeList()` methods.


### Nodes

The `addNode()` method allows a single sub-node to be added to an existing model node, for example:

```js
model.addNode('node');
```

which causes the new model node to be immediately accessible as `model.node`, allowing handlers to be registered on the node, for example:

```js
model.node.addHandler(p('../p1').as('x'), p('../p2').as('y')], ['product'],
	function(input, output) {
		output.product = input.x * input.y;
	}
);
```

and properties to be defined on the node, for example:

```js
model.node.define('some-prop', 'some-value');
```

Notice how in the handler example above, the properties can optionally come from remote parts of the model.

As a short-cut, you can define any properties at the point you create a node by passing a map, like this:

```js
model.addNode('node', {'some-prop': 'some-value'});
```


#### Interacting With Nodes

Now, although `model.node` can be navigated to immediately, the node won't effectively exist (e.g. `get()` can't be invoked) until the model has been sealed. There are precisely three methods available for use with nodes, that can be used once the model has been sealed:

  * `exists()` (whether the node currently exists or not)
  * `create()` (causes the node to come into existence)
  * `dispose()` (causes the node to cease existing)

If you'd prefer the node not to exist at the point `seal()` is invoked, you can use `addDisabledNode()` to create the node, and then invoke `create()` on the node when you're ready for it to come into existence &mdash; though this may prevent you from discovering any circular dependency issues until _use-time_.


### Node Lists

Quite often, models have multiple nodes with exactly the same shape, but where the number of nodes can vary over the lifetime of the model. When this is the case, the `addNodeList()` method can be used, for example:

```js
model.addNodeList('nodes');
model.nodes.addHandler([], ['name'], function(input, output) {
	output.name = 'node #' + (index + 1);
});
```


#### Interacting With Node Lists

Node-lists have a number of useful methods that can be used after `seal()` has been invoked:

  * `length()` (the number of nodes within the node-list)
  * `item(index)` (retrieve the node at the given `index`)
  * `first()` (retrieve the first node in the list)
  * `last()` (retrieve the last node in the list)
  * `addNode(index)` (add a node, optionally at a given `index`)
  * `removeNode(index)` (remove the node at the given `index`, or the last node if no index is provided)


#### Node Lists  & Handlers

Handler functions can refer to local node-list properties &mdash; properties on the node-list to which the handler has been added &mdash; in exactly the same way they refer to node properties, but where the handler will be invoked once per node within the node-list, for example:

```js
nodes.addHandler(['x', 'y'], ['sum'], function(input, output) {
  output.sum = input.x + input.y;
});
```

In this way, the same handlers used with nodes can also be used with node-lists, where this makes sense.

However, handlers can sometimes only function correctly when they are able to contemplate an entire set of properties at the same time, in which case _dotted-property-notation_ can be used, for example:

```js
nodes.addHandler(['list.x'], ['sum'], function(input, output) {
  output.sum = input.list.reduce((total, node) => node.x + total, 0);
});
```

Here, each element of `list` is a map containing any properties prefixed with `list.`, which in this case is just `list.x`.

Handlers are free to mix and match their use of dotted and un-dotted properties, for example:

```js
function handler(input, output) {
  output.x = true;
  for(var node of output.nodes) {
    node.y = true;
  }
}

handler.inputs = [];
handler.outputs = ['x', 'nodes.y'];
```


#### Dotted Property Notation Usage Rules

Here's the definitive set of usage rules regarding the use of dotted properties:

  * Dotted property notation must be used to refer to _foreign-properties_ on node-lists.
  * Dotted property notation can optionally be used to refer to _local-properties_ on node-lists, where otherwise the handler will be invoked once for each item within the node-list.
  * Dotted properties can be mapped to regular node properties, which causes a list with one item to be created.
  * Dotted properties can have some of their values mapped to node-lists and others mapped to nodes, in which case the properties not mapped to a node-list are duplicated within each item of the resultant list.
  * Dotted properties can be mapped to more than node-list provided the node-lists all have the same number of properties.


## Referential Data Structures

The `defineAs()` method allows a node to inherit the non-handler defined properties, handlers, sub-nodes and node-lists of some other node, for example:

```js
model.books.createNode('author');
model.books.author.addHandler(authorBioHandler);
model.essays.createNode('author');
model.essays.author.defineAs(model.books.author);
```

allows the `author` node created for `books` to also be used for `essays`.

Note that `defineAs()` can't be used to _extend_ a node, so you can't invoke `defineAs()` on a node that you've already invoked `define()` or `addHandler()` on, and similarly you can't invoke `define()` or `addHandler()` on a node that you've already invoked `defineAs()` on.


## Self Referential Data Structures

The `defineAs()` method can also be used to create self-referential data structures, like trees and linked-lists. For example, the following code describes a tree data structure, where each node can have up to two leaf nodes:

```js
node.define('value', 1);
node.addDisabledNode('leaf1');
node.addDisabledNode('leaf2');
node.leaf1.defineAs(node);
node.leaf2.defineAs(node);
```

Notice how `addDisabledNode()` is used instead of `addNode()`, since otherwise new leaf nodes would indefinitely be added to the tree until the call-stack overflowed or all the memory was consumed.

After sealing, we can create a small node tree like this:

```js
node.leaf1.create();
node.leaf1.leaf1.create();
node.leaf1.leaf2.create();
node.leaf1.leaf2.leaf2.create();
```

Now, assuming we'd added the following handler to `node` before referring to it with `defineAs()`:

```js
node.addHandler([p('leaf1.value').as('p1'), p('leaf2.value').as('p2')], ['sum'],
	function(input, output) {
		output.sum = (input.p1 || 0) + (input.p2 || 0);
	}
);
```

then each node would now contain a sum of the values for all nodes beneath it.

Notice how the handler has to guard to against `input.p1` and/or `input.p2` being `null`, since nodes may not have any leaf nodes.


## Specialized Types

It's sometimes useful to create node-lists that contain specialized nodes (but where all nodes within the list conform to an agreed base-type), and nodes that can point to one of a number possible sub-types. To enable this, nodes and node-list properties are also functions that can be invoked with a type argument, so that specializations can be created.


### Node List Specialization

To create a specialized node-list we might write:

```js
model.addNodeList('shapes');
model.shapes.define('area', 0); // all shapes have an 'area'
model.shapes('circle').define('radius', 0); // circles also have a 'radius'
model.shapes('triangle').define('type', 'equilateral'); // triangles also have a 'type'
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


### Node Specialization

For regular nodes, the specializations are created in exactly the same way, for example:


```js
model.addDisabledNode('child');
model.child.define('prop', 'some-value');
model.child('foo').define('foo-prop', 'some-value');
model.child('bar').define('bar-prop', 'some-value');
```

but where creation is controlled by passing a type argument to the `create()` method, for example:

```js
model.child.create('foo');
```

The `destroy()` method is not affected by type specialization, and continues to be invoked as:

```js
model.child.destroy();
```


### Specialization Introspection

Specialized nodes have a `nodeType` property that can be used to determine the type of a node, for example:

```
if(node.nodeType == 'circle') {
	// ...
}
```

although, much like `instanceof`, use of `nodeType` may indicate that the types base definition has been incorrectly abstracted.


### Specialized Handlers

As a convenience, you can add handlers that will only be applied for nodes that match a particular sub-type, for example:

```js
model.shapes('triangle').addHandler(triangleHandler);
```

or:

```js
model.child('foo').addHandler(fooHandler);
```

Finally, it's worth noting that handlers that are added to the base-type are free to depend on properties that are only available within some of the specialized types, in which case it's their responsibility to check the shape of `input` before acting.


## Handler Objects

Regular handlers are completely stateless, and this allows handler instances to be re-used throughout the model as necessary. However, handlers that require state can use `addHandlerConstructor()` instead of `addHandler()`, for example:

```js
model.addHandlerConstructor(MessageCountHandler);
```

where `MessageCountHandler` is a constructor for a _handler-object_ rather than a _handler-function_, for example:

```js
function MessageCountHandler(startCount) {
	this._messageCount = startCount || 1;
	this.inputs = MessageCountHandler.inputs;
	this.outputs = MessageCountHandler.outputs;
}

MessageCountHandler.inputs = ['message'];
MessageCountHandler.outputs = ['messageCount'];

MessageCountHandler.prototype.handler = function(input, output) {
	output.messageCount = this._messageCount++;
};

MessageCountHandler.prototype.dispose = function() {
	// no resource de-allocation necessary for this handler
};
```

Notice how the actual handler function is made available using the `handler` property, and that handler objects can also optionally have `dispose()` methods to allow them to perform any resource de-allocation.

The `bind()` method can be used to pre-define the arguments passed into the handler constructor, for example:

```js
model.addHandlerConstructor(MessageCountHandler.bind(null, 999));
```


## Externally Updated Handlers

Some handlers may need to indicate their need to be re-executed &mdash; for example if they receive data from external servers &mdash; and this can be done using `output.hasChanged()`. For example, a `WebSocketHandler` handler might be implemented as follows:

```js
function WebSocketHandler(server) {
	this._connection = new WebSocket(server);
	this.inputs = WebSocketHandler.inputs;
	this.outputs = WebSocketHandler.outputs;
}

WebSocketHandler.inputs = [];
WebSocketHandler.outputs = ['data'];

WebSocketHandler.prototype.handler = function(input, output) {
	output.data = null;

	this._connection.onmessage = function(event) {
		output.data = event.data;
		output.hasChanged();
	};
}

WebSocketHandler.prototype.dispose = function() {
	this._connection.close();
};
```

There are a number of interesting things worth nothing about this code sample:

  1. The handler initially sets the `data` property to `null`, so that downstream handlers know that the property is currently unavailable.
  2. The handler then repeatedly invokes `output.hasChanged()` after each time it updates `output.data`.
  3. The handler provides a `dispose()` method to perform resource de-allocation.


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

Finally, to prevent handlers from using the public API, use of any of the _mutator_ methods (e.g. `set()`) in the _handler-phase_ will cause an error to be thrown, and use of any of the _accessor_ methods (e.g. `get()`) will cause a warning to be logged to the console &mdash; we limit ourselves to logging to the console since developers will often find it useful to introspect the model while they are debugging handlers.

Discouraging handlers from using the public API is desirable since that would significantly reduce handler re-usability, hindering model construction via composition. A side of effect of this limitation is that it's not possible for handlers to add or remove nodes from node-lists, or bring normal nodes in and out of existence, and so these operations must instead be performed by listeners.


## Emitted events

ComposerJs emits the following events, all of which can be registered for using the `on()` method:

  * `change`
  * `mutation`
  * `beforenotify`


### Change Event

The `change` event fires when any of a set of given property value have changed, and is registered for as follows:

```js
model.props(p('prop1'), p('prop2')).on('change', function(node) {
	// ...
});
```

and, in much the same way, can be used to register for node-list properties like this:

```js
model.nodes.props(p('prop1'), p('prop2')).on('change', function(node) {
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


### Before-Notify Event

The `beforenotify` event fires prior to the `change` and `mutation` events firing. It is useful since if `set()`, `addNode()` or `removeNode()` are invoked at this the point, the `change` and `mutation` events won't fire until the handlers have first had a chance to react to any changes.

This event can be registered for as follows:

```js
model.on('beforenotify', function(model) {
	// ...
});
```

where `model` is the root model node.


## Genuine Circular Dependencies

ComposerJs doesn't allow handlers that form circular dependencies, yet there are occasions when this is actually required. In such cases, the `beforenotify` event can be used to create a circular dependency, but where the listener is responsible for ensuring that infinite loops don't occur.

For example:

```js
model.on('beforenotify', function(model) {
	var startProperty = model.get('end-prop1') + model.get('end-prop2');

	if(startProperty != model.get('start-prop')) {
		model.set('start-prop', startProperty);
	}
});
```


## Serialization

Model state can be exported as JSON using the `export()` method, for example:

```js
var json = model.export([p('prop'), p('nodes/child-prop')]);
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


## Relative Property Specifiers

The `addHandler()` method requires two lists of _relative-property-specifiers_ to be provided. Relative property specifiers are just simple Javascript objects having `path`, `name` and `as` properties, for example:

```js
{
	path: [],
	name: 'prop1',
	as: 'x'
}
```

For convenience, these specifiers can be provided using the free floating `p()` method, for example:

```js
p('prop1').as('x');
```

Here are some examples of the _relative-property-specifiers_ the fluent syntax causes to be created:

```js
p('prop1') -> {
	path: [],
	name: 'prop1',
	as: 'prop1'
}

p('prop1').as('x') -> {
	path: [],
	name: 'prop1',
	as: 'x'
}

p('../nodes/child/prop1').as('x') -> {
  path: ['..', 'nodes', 'child'],
	name: 'prop1',
	as: 'x'
}

p('//prop1').as('x') -> {
	path: ['/'],
	name: 'prop1',
	as: 'x'
}
```

Given a mixed list of strings and _relative-property-specifiers_, you can convert these to a pure list of _relative-property-specifiers_ using the `props()` method, for example:

```js
var propertySpecifiers = props(['prop1', p('prop2')]);
```

which is equivalent to writing:

```js
var propertySpecifiers = [p('prop1'), p('prop2')];
```


## Property Specifiers

Given a list of _relative-property-specifiers_, you can convert these to a list of _property-specifiers_ using the `props().resolve()` method, for example:

```js
var properties = props([p('prop1').as('x'), p('../prop2'), 'prop3']).resolve(node);
```

which is equivalent to:

```js
var properties = [{node:node, prop:'prop1'}, {node:node.parent(), prop:'prop2'},
	{node:node, prop:'prop3'}];
```

Property specifiers are used internally within ComposerJs, but the `resolve()` method has been exposed externally since it allows the actual nodes that _relative-property-specifiers_ correspond to to be determined, which may be of use to end-developers.


## Using A Handler Multiple Times

If you need to attach multiple instances of the same handler to a node, you can use `p()` and `as()` to prefix the properties, for example:

```js
model.addHandler([], [p('x-prop1').as('prop1'), p('x-prop2').as('prop2')], hander);
model.addHandler([], [p('y-prop1').as('prop1'), p('y-prop2').as('prop2')], hander);
```

but this becomes inconvenient when the handler has lots of properties that need prefixing. To help with this, the `props()` method can be used to prefix all properties en-masse, as follows:

```js
model.addHandler([], [props(handler.outputs).prefixedWith('x-')], hander);
model.addHandler([], [props(handler.outputs).prefixedWith('y-')], hander);
```

A related feature of `props()` is its `relativeTo()` method, that allows a list of _relative-property-specifiers_ to be made relative to a given node. This is useful for handlers within node-lists where the input-properties for that handler are available in the parent node, or some other node, for example:

```js
model.nodes.addHandler([], [props(handler.outputs).relativeTo(model)], hander);
```

If you don't want all of the properties to be relative to the given node, you can use `for()` or `excluding()` to either whitelist or blacklist which properties will be affected, for example:

```js
props(handler.inputs).relativeTo(model).for('only-this-property');
props(handler.outputs).relativeTo(model).excluding('not-this-property');
```
