# Introduction

ComposerJs allows you to compose models using a number of co-operating _handlers_, where each _handler_ is responsible for defining a number of _properties_ within the model, potentially using other _properties_ as input. This is useful if you need to repeatedly create models with overlapping, but differing functionality.

ComposerJs models have the following facets:

  * The models can have an arbitrary tree structure that can be used to model any domain problems.
  * The shape of the model is described up-front, but is then locked-in during use.
  * Sub-sections of the model can be observed, so that change can be detected, and so that dependent properties can be recalculated.
  * Model updates are atomic in nature, and all reactive property recalculation occurs as part of a single external update.
  * No subscription management code is needed as the number of nodes within the model changes.


## Basic Usage

You can create a model as follows:

```js
var model = require('composerjs').create();
```

after which you can add handlers to the model, such as the following summation handler:

```js
model.addHandler([p('value1'), p('value2')], [p('sum')], function(in, out) {
	out.sum = in.value1 + in.value2;
});
```

The `p()` method here is used to refer to one of the handler nodes properties.

Since composable models are useful precisely because they increase re-usabilty, it will often be the case that the property names used within the model don't correlate with the names used by the handler, in which case the `as()` method can be used for translation, for example:


```js
function summationHandler(in, out) {
	out.sum = in.x + in.y;
}

model.addHandler([p('value1').as('x'), p('value2').as('y')], [p('sum')], summationHandler);
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


## Tree Shaped Models

Tree shaped models can be created using the `addNode()` and `addNodeList()` methods. The `addNode()` method allows a single sub-node to be added to an existing model node, for example:

```js
model.addNode('node');
```

This causes the new model node to be immediately accessible on `model` as `model.node`, allowing handlers to create or depend on the properties of the sub-node, for example:

```js
model.node.addHandler([model.p('value1'), model.p('value2')], [p('product')], function(in, out) {
	out.product = in.value1 * in.value2;
});
```

Notice here how _input-properties_ can optionally be fully-qualified, allowing properties from remote parts of the model to be listened to. This is only possible for input properties, and output properties are always relative to the node on which the handler is being registered.


## Repeated Tree Elements

Quite often, models have multiple nodes with exactly the same shape, but where the number of nodes can vary over the lifetime of the model. When this is the case, the `createNodeList()` method can be used, for example:


```js
model.createList('nodes');
model.nodes.addHandler([], [p('name')], function(in, out) {
	out.name = 'node #' + (in.index + 1);
});
```

Notice here how the node-list handler is provided an implicit `in.index` property that it can optionally make use of, but otherwise exactly the same handlers used for nodes can also be used node-lists.

Also, if you ever need different handlers to provide properties based on the number of nodes within a list, or depending on the index of the item in the list, the `allowMultiplexing()` method will again come to the rescue.

Node-lists have four useful methods that can be used both before and after `seal()` has been invoked:

  * `length()` (the number of nodes within the node-list)
  * `item(index)` (retrieve the node at the given `index`)
  * `addNode(index)` (add a node, optionally at a given `index`)
  * `removeNode(index)` (remove the node at the given `index`)

For example, we can retrieve the `name` property of the first item within the `nodes` node-list as follows:

```js
model.nodes.item(0).get('name')
```

Unlike normal nodes however, nodes within node-lists don't have a `p()` method, so as to prevent nodes that may or may not exist being used as _input-properties_, avoiding the need for complex, error-prone subscription management code. For example, the following code will cause an error:

```js
model.nodes.item(0).p('name'); // this will cause an error
```

Instead, it's possible to listen to all instance of a given property within a node-list, in which case the array of values from all nodes will be retrieved, for example:

```js
model.addHandler([model.nodes.p('name')], [p('allNames')], function(in, out) {
	out.allNames = in.names.join(', ');
});
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

and model observation can be done using the emitter pattern, for example:

```js
model.p('answer').on('change', function(value) {
	console.log("The answer is '" + value + "'.");
});
```


## Atomicity

ComposerJs models only alert listeners once all changes have been made, and this is guaranteed by only informing listeners after the current JavaScript stack exits. This is done performantly by using [ASAP](https://www.npmjs.com/package/asap).


## Serialization

Models can be serialized using the `stringify()` method, for example:

```js
var serializedForm = model.stringify()
```

and de-serialized using the `unstringify()` method:

```js
model.unstringify(serializedForm);
```

The `unstringify()` method can only be used before `seal()` has been invoked, and should be used after `set()` has been invoked to provide any properties that won't be provided by handlers.
