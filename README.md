# `mutrait`
(formerly [mixwith.js](https://github.com/justinfagnani/mixwith.js))

A simple and powerful trait library for ES6+.

`mutrait` uses a subclass factory strategy to introduce traits into classes (also known as "mixins"), along with some nice syntax sugar.
It allows classes to override methods coming from not only superclasses, but also traits, and it allows traits to override methods from supertraits.

## Hello, World!

```javascript
const { Trait, trait } = require('mutrait')      // 0

const CanSayHello = Trait(s => class extends s { // 1
  sayHello () {
    return 'Hello, world!'
  }
})

class Person extends trait(CanSayHello) {}       // 2

const person = new Person()

console.log(person.sayHello())                   // 3
// logs 'Hello, world'
```
0: Uses `Trait` & `trait` from `mutrait`

1: Defines a new trait that imparts a `sayHello` method.

2: Defines a class that expresses the `CanSayHello` trait and doesn't extend anything.

3: Invokes the `sayHello` method provided by the `CanSayHello` trait. 

```javascript
class Klingon extends Person {
  sayHello() {
    return 'nuqneH!'                             // 4
  }
}
console.log(new Klingon().sayHello())
// logs 'nuqneH!'
```
4: Demonstrates that classes can override methods provided by traits.

## Expressing Multiple Traits
```javascript
const { Trait, traits } = require('mutrait')               // 0

const CanSayHello = Trait(s => class extends s {           // 1
  sayHello () {
    return 'Hello, world!'
  }
})

const CanSayGoodbye = Trait(s => class extends s {         // 2
  sayGoodbye () {
    return 'Goodbye, world!'
  }
})

class Person extends traits(CanSayHello, CanSayGoodbye) {} // 3

const person = new Person()

console.log(person.sayHello())                             // 4
// logs 'Hello, world'
console.log(person.sayGoodbye())                           // 5
// logs 'Goodbye, world'
```
0: Uses `Trait` & `traits` from `mutrait`

1: Defines a trait that imparts a `sayHello` method

2: Defines a trait that imparts a `sayGoodbye` method

3: Defines a class that expresses the `CanSayHello` & `CanSayGoodbye` traits and doesn't extend anything.

4: Invokes the `sayHello` method provided by `CanSayHello`. 

5: Invokes the `sayGoodbye` method provided by `CanSayGoodbye`.

## More Realistic Example

```javascript
const { Trait, trait } = require('mutrait')

const Nameable = Trait(s => class extends s {
  constructor () {
    super(...arguments)
    this._firstName = ''
    this._lastName = ''
  }

  get fullName () {
    return `${this._firstName} ${this._lastName}`
  }

  set firstName (it) {
    this._firstName = this.checkFirstName(it)
  }

  get firstName () {
    return this._firstName
  }

  checkFirstName (it) {
    return it
  }

  set lastName (it) {
    this._lastName = this.checkLastName(it)
  }

  get lastName () {
    return this._lastName
  }

  checkLastName (it) {
    return it
  }
})

class Person extends trait(Nameable) {
  checkFirstName (it) {
    if (!it) throw new Error('nothing given')
    return it
  }

  checkLastName (it) {
    if (!it) throw new Error('nothing given')
    return it
  }
}

const first = 'Cheeky'
const last = 'Monkey'
const me = new Person()
me.firstName = first
me.lastName = last
assert.equal(first, me._firstName)
assert.equal(last, me._lastName)
assert.equal(first, me.firstName)
assert.equal(last, me.lastName)
assert.equal(`${first} ${last}`, me.fullName)

assert.throws(() => {
  me.firstName = null
})
assert.throws(() => {
  me.lastName = null
})
```

## Features
* `super` Just Works™.
* `instanceof` Just Works™ with classes _and_ traits.
* Traits can have constructors and instance methods & fields that are accessible to any class or trait involved.

### Syntax Sugar
`mutraits` provides helpers `Trait`, `superclass`, `traits`, `trait` & `expressing` that ease in readability in various cases:

* Use `Trait` to define a trait:
```javascript
const MyTrait = Trait(s => class extends s {})
```

* Use `trait` when your class declares no superclass and expresses a single trait:
```javascript
class Thing extends trait(MyTrait) {}
```

* Use `traits` when your class declares no superclass and expresses a multiple traits:
```javascript
class Thing extends traits(MyTrait, MyOtherTrait) {}
```

* Use `superclass() & expressing()` when your class declares a superclass and expresses one or more traits:
```javascript
class Thing extends superclass(MySuper).expressing(MyTrait, MyOtherTrait) {}
```

## Advantages of subclass factory-based traits over typical JavaScript mixins
Subclass factory style mixins preserve the object-oriented inheritance properties that classes provide, like method overriding and `super` calls, while letting you compose classes out of traits without being constrained to a single inheritance hierarchy, and without monkey-patching or copying.

#### Method overriding that just works
Methods in subclasses can naturally override methods in the trait or superclass, and traits can override methods in the superclass or supertraits.
This means that precedence is preserved - the order is: _subclass_ -> _trait__1_ -> ... -> _trait__N_ -> _superclass_.

#### `super` works
Subclasses and traits can use `super` normally, as defined in standard Javascript, and without needing the trait library to do special chaining of functions.

#### Traits can have constructors
Since `super()` works, traits can define constructors.
Combined with ES6 rest arguments and the spread operator, traits can have generic constructors that work with any superconstructor by passing along all arguments.

#### Prototypes and instances are not mutated
Typical JavaScript mixins usually either mutate each instance as created, which can be bad for performance and maintainability, or modify a prototype, which means every object inheriting from that prototype gets the mixin.
Subclass factories don't mutate objects, they define new classes, leaving the original superclass intact.

## Usage

### Defining Traits

The `Trait` decorator function wraps a plain subclass factory to add deduplication, caching and `instanceof` support:

```javascript
const { Trait } = require('mutrait')

const MyTrait = Trait(s => class extends s {

  constructor() {
    super(...argsuments)
    // any further initialization here
  }

  foo() {
    console.log('foo from MyTrait')
    // this will call superclass.foo() if it exists
    super.foo()
  }
})
```

Traits defined with the `mutrait` decorators do not require any helpers to use.
They still work like plain subclass factories.

### Using Traits

Classes use traits in their `extends` clause.
Classes that use traits can define and override constructors, methods & fields as usual.

```javascript
class MyClass extends superclass(MySuperClass).expressing(MyTrait) {

  constructor(a, b) {
    super(a, b); // calls MyTrait(a, b)
  }

  foo() {
    console.log('foo from MyClass');
    super.foo(); // calls MyTrait.foo()
  }
}
```
