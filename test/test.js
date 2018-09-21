/* global suite suiteSetup test */
'use strict'

const { assert } = require('chai')

const {
  apply,
  isTraitificationOf,
  wrap,
  unwrap,
  expresses,
  BareTrait,
  Trait,
  Dedupe,
  HasInstance,
  superclass,
  trait,
  traits
} = require('..')

suite('mutrait', () => {
  suite('apply() and isTraitificationOf()', () => {
    test('apply() applies a trait', () => {
      const T = (s) => class extends s {
        test () {
          return true
        }
      }

      class Test extends apply(Object, T) {}

      const i = new Test()
      assert.isTrue(i.test())
    })

    test('isApplication() returns true for a trait applied by apply()', () => {
      const T = (s) => class extends s {}
      assert.isTrue(isTraitificationOf(apply(Object, T).prototype, T))
    })

    test('isApplication() works expressing wrapped traits', () => {
      const T = (s) => class extends s {}
      const Wrapped = wrap(T, (superclass) => apply(superclass, T))
      assert.isTrue(isTraitificationOf(Wrapped(Object).prototype, Wrapped))
    })

    test('isApplication() returns false when it should', () => {
      const T = (s) => class extends s {}
      const U = (s) => class extends s {}
      assert.isFalse(isTraitificationOf(apply(Object, T).prototype, U))
    })
  })

  suite('expresses()', () => {
    test('expresses() returns true for a trait applied by apply()', () => {
      const T = (s) => class extends s {}

      assert.isTrue(expresses(apply(Object, T).prototype, T))
    })
  })

  suite('wrap() and unwrap()', () => {
    test('wrap() sets the prototype', () => {
      const f = (x) => x * x
      f.test = true
      const wrapper = (x) => f(x)
      wrap(f, wrapper)
      assert.isTrue(wrapper.test)
      assert.equal(f, Object.getPrototypeOf(wrapper))
    })

    test('unwrap() returns the wrapped function', () => {
      const f = (x) => x * x
      const wrapper = (x) => f(x)
      wrap(f, wrapper)
      assert.equal(f, unwrap(wrapper))
    })
  })

  suite('BareTrait', () => {
    test('mixin application is on prototype chain', () => {
      const T = BareTrait((s) => class extends s {})

      class C extends T(class {}) {}

      const i = new C()
      assert.isTrue(expresses(i, T))
    })

    test('methods on trait are present', () => {
      const T = BareTrait((s) => class extends s {
        foo () { return 'foo' }
      })

      class C extends T(class {}) {}

      const i = new C()
      assert.deepEqual(i.foo(), 'foo')
    })

    test('fields on trait are present', () => {
      const T = BareTrait((s) => class extends s {
        constructor () {
          super(...arguments)
          this.field = 12
        }
        foo () { return this.field }
      })

      class C extends T(class {}) {}

      const i = new C()
      assert.deepEqual(i.field, 12)
      assert.deepEqual(i.foo(), 12)
    })

    test('properties on trait are present', () => {
      const T = BareTrait((s) => class extends s {
        constructor () {
          super(...arguments)
          this.field = 12
        }
        get foo () { return this.field }
      })

      class C extends T(class {}) {}

      const i = new C()
      assert.deepEqual(i.field, 12)
      assert.deepEqual(i.foo, 12)
    })

    test('fields on superclass are present', () => {
      const T = BareTrait((s) => class extends s {
        constructor () {
          super(...arguments)
          this.superclassField = 12
        }
      })

      class Super {
        foo () { return this.superclassField }
      }

      class C extends T(Super) {}

      const i = new C()
      assert.deepEqual(i.superclassField, 12)
      assert.deepEqual(i.foo(), 12)
    })

    test('methods on subclass are present', () => {
      const T = BareTrait((s) => class extends s {})

      class C extends T(class {}) {
        foo () { return 'foo' }
      }

      const i = new C()
      assert.deepEqual(i.foo(), 'foo')
    })

    test('fields on subclass are present', () => {
      const T = BareTrait((s) => class extends s {})

      class C extends T(class {}) {
        constructor () {
          super(...arguments)
          this.field = 12
        }
        foo () { return 12 }
      }

      const i = new C()
      assert.deepEqual(i.field, 12)
      assert.deepEqual(i.foo(), 12)
    })

    test('methods on trait override superclass', () => {
      const T = BareTrait((s) => class extends s {
        foo () { return 'bar' }
      })

      class Super {
        foo () { return 'foo' }
      }

      class C extends T(Super) {}

      const i = new C()
      assert.deepEqual(i.foo(), 'bar')
    })

    test('fields on trait override superclass', () => {
      const T = BareTrait((s) => class extends s {
        constructor () {
          super(...arguments)
          this.field = 12
        }
        foo () { return this.field }
      })

      class Super {
        constructor () {
          this.field = 13
        }
        foo () { return this.field }
      }

      class C extends T(Super) {}

      const i = new C()
      assert.deepEqual(i.field, 12)
      assert.deepEqual(i.foo(), 12)
    })

    test('methods on trait can call super', () => {
      const T = BareTrait((s) => class extends s {
        foo () { return super.foo() }
      })

      class Super {
        foo () { return 'superfoo' }
      }

      class C extends T(Super) {}

      const i = new C()
      assert.deepEqual(i.foo(), 'superfoo')
    })

    test('methods on subclass override superclass', () => {
      const T = BareTrait((s) => class extends s {})

      class Super {
        foo () { return 'superfoo' }
      }

      class C extends T(Super) {
        foo () { return 'subfoo' }
      }

      const i = new C()
      assert.deepEqual(i.foo(), 'subfoo')
    })

    test('fields on subclass override superclass', () => {
      const T = BareTrait((s) => class extends s {})

      class Super {
        constructor () {
          this.field = 12
        }
        foo () { return 12 }
      }

      class C extends T(Super) {
        constructor () {
          super(...arguments)
          this.field = 13
        }
        foo () { return this.field }
      }

      const i = new C()
      assert.deepEqual(i.field, 13)
      assert.deepEqual(i.foo(), 13)
    })

    test('methods on subclass override mixin', () => {
      const T = BareTrait((s) => class extends s {
        foo () { return 'mixinfoo' }
      })

      class Super {}

      class C extends T(Super) {
        foo () { return 'subfoo' }
      }

      const i = new C()
      assert.deepEqual(i.foo(), 'subfoo')
    })

    test('fields on subclass override trait', () => {
      const T = BareTrait((s) => class extends s {
        constructor () {
          super(...arguments)
          this.field = 12
        }
        foo () { return this.field }
      })

      class Super {}

      class C extends T(Super) {
        constructor () {
          super(...arguments)
          this.field = 13
        }
        foo () { return this.field }
      }

      const i = new C()
      assert.deepEqual(i.field, 13)
      assert.deepEqual(i.foo(), 13)
    })

    test('methods on subclass can call super to superclass', () => {
      const M = BareTrait((s) => class extends s {})

      class S {
        foo () { return 'superfoo' }
      }

      class C extends M(S) {
        foo () { return super.foo() }
      }

      const i = new C()
      assert.deepEqual(i.foo(), 'superfoo')
    })
  })

  suite('Dedupe', () => {
    test('applies the trait the first time', () => {
      const T = Dedupe(BareTrait((s) => class extends s {}))

      class C extends T(class {}) {}

      const i = new C()
      assert.isTrue(expresses(i, T))
    })

    test('doesn\'t apply the trait the second time', () => {
      let applicationCount = 0
      const T = Dedupe(BareTrait((s) => {
        applicationCount++
        return class extends s {}
      }))

      class C extends T(T(Object)) {}

      const i = new C()
      assert.isTrue(expresses(i, T))
      assert.equal(1, applicationCount)
    })
  })

  suite('HasInstance', () => {
    let hasNativeHasInstance = false

    suiteSetup(() => {
      // Enable the @@hasInstance patch in mixwith.HasInstance
      if (!Symbol.hasInstance) {
        Symbol.hasInstance = Symbol('hasInstance')
      }

      class Check {
        static [Symbol.hasInstance] (o) { return true }
      }

      hasNativeHasInstance = 1 instanceof Check
    })

    test('subclasses implement traits', () => {
      const T = HasInstance((s) => class extends s {})

      class C extends T(class {}) {}

      const i = new C()

      if (hasNativeHasInstance) {
        assert.instanceOf(i, C)
      } else {
        assert.isTrue(C[Symbol.hasInstance](i))
      }
    })
  })

  const nthPrototypeOf = (it, n) => {
    if (n < 1) throw new Error('n must be >= 1')
    const proto = Object.getPrototypeOf(it)
    return n === 1 ? proto : nthPrototypeOf(proto, n - 1)
  }

  suite('superclass().expressing()', () => {
    test('applies trait in order expressing superclass', () => {
      const T1 = BareTrait((s) => class extends s {})
      const T2 = BareTrait((t) => class extends t {})

      class Super {}

      class C extends superclass(Super).expressing(T1, T2) {}

      const i = new C()
      assert.isTrue(expresses(i, T1))
      assert.isTrue(expresses(i, T2))
      assert.isTrue(isTraitificationOf(nthPrototypeOf(i, 2), T2))
      assert.isTrue(isTraitificationOf(nthPrototypeOf(i, 3), T1))
      assert.equal(nthPrototypeOf(i, 4), Super.prototype)
    })

    test('applies traits in order expressing no superclass', () => {
      const T1 = BareTrait((s) => class extends s {})
      const T2 = BareTrait((s) => class extends s {})

      class C extends traits(T1, T2) {}

      const i = new C()
      assert.isTrue(expresses(i, T1))
      assert.isTrue(expresses(i, T2))
      assert.isTrue(isTraitificationOf(nthPrototypeOf(i, 2), T2))
      assert.isTrue(isTraitificationOf(nthPrototypeOf(i, 3), T1))
      assert.isNotNull(nthPrototypeOf(i, 4))
      assert.equal(nthPrototypeOf(i, 5), Object.prototype)
      assert.isTrue(nthPrototypeOf(i, 6) === null)
    })

    test('superclass() can omit the superclass', () => {
      const T = BareTrait((s) => class extends s {
        static staticMixinMethod () {
          return 42
        }

        foo () {
          return 'foo'
        }

        snafu () {
          return 'M.snafu'
        }
      })

      class C extends traits(T) {
        static staticClassMethod () {
          return 7
        }

        bar () {
          return 'bar'
        }

        snafu () {
          return 'C.snafu'
        }
      }

      let i = new C()
      assert.isTrue(expresses(i, T), 'expresses')
      assert.isTrue(isTraitificationOf(nthPrototypeOf(i, 2), T), 'isTraitificationOf')
      assert.equal('foo', i.foo())
      assert.equal('bar', i.bar())
      assert.equal('C.snafu', i.snafu())
      assert.equal(42, C.staticMixinMethod())
      assert.equal(7, C.staticClassMethod())
    })

    test('class instanceof trait', () => {
      const T = Trait(c => class extends c {})
      const U = Trait(d => class extends d {})

      class C extends traits(T, U) {}

      const c = new C()
      assert.isTrue(c instanceof C)
      assert.isTrue(expresses(c, T))
      assert.isTrue(expresses(c, U))
      assert.isTrue(c instanceof T)
      assert.isTrue(c instanceof U)
    })
  })

  suite('supertraits', () => {
    test('single supertrait', () => {
      const Supertrait = Trait(s => class extends s {
        foo () { return 'foo' }
      })

      const Subtrait = Trait(s => class extends superclass(s).expressing(Supertrait) {
        bar () { return 'bar' }
      })

      class C extends trait(Subtrait) {
        snafu () { return 'snafu' }
      }
      const c = new C()
      assert.equal(c.foo(), 'foo')
      assert.equal(c.bar(), 'bar')
      assert.equal(c.snafu(), 'snafu')
    })

    test('multiple supertraits', () => {
      const Supertrait1 = Trait(s => class extends s {
        foo1 () { return 'foo1' }
      })

      const Supertrait2 = Trait(s => class extends s {
        foo2 () { return 'foo2' }
      })

      const Subtrait = Trait(s => class extends superclass(s).expressing(Supertrait1, Supertrait2) {
        bar () { return 'bar' }
      })

      class C extends trait(Subtrait) {
        snafu () { return 'snafu' }
      }
      const c = new C()
      assert.equal(c.foo1(), 'foo1')
      assert.equal(c.foo2(), 'foo2')
      assert.equal(c.bar(), 'bar')
      assert.equal(c.snafu(), 'snafu')
    })

    test('single supertrait with correct overrides', () => {
      const Supertrait = Trait(s => class extends s {
        foo () { return 'foo from Supertrait' }
        bar () { return 'bar from Supertrait' }
        snafu () { return 'snafu from Supertrait' }
      })

      const Subtrait = Trait(s => {
        return class extends superclass(s).expressing(Supertrait) {
          bar () { return 'bar from Subtrait' }
          snafu () { return 'snafu from Subtrait' }
        }
      })

      class C extends trait(Subtrait) {
        snafu () { return 'snafu from C' }
      }

      const c = new C()
      assert.equal(c.foo(), 'foo from Supertrait')
      assert.equal(c.bar(), 'bar from Subtrait')
      assert.equal(c.snafu(), 'snafu from C')
    })

    test('multiple supertraits with correct overrides', () => {
      const Supertrait1 = Trait(s => class extends s {
        bleep () { return 'bleep from Supertrait1' }
        foo () { return 'foo from Supertrait1' }
        bar () { return 'bar from Supertrait1' }
        snafu () { return 'snafu from Supertrait1' }
      })

      const Supertrait2 = Trait(s => class extends s {
        foo () { return 'foo from Supertrait2' }
        bar () { return 'bar from Supertrait2' }
        snafu () { return 'snafu from Supertrait2' }
      })

      const Subtrait = Trait(s =>
        class extends superclass(s).expressing(Supertrait1, Supertrait2) {
          bar () { return 'bar from Subtrait' }
          snafu () { return 'snafu from Subtrait' }
        })

      class C extends trait(Subtrait) {
        snafu () { return 'snafu from C' }
      }

      const c = new C()
      assert.equal(c.bleep(), 'bleep from Supertrait1')
      assert.equal(c.foo(), 'foo from Supertrait2')
      assert.equal(c.bar(), 'bar from Subtrait')
      assert.equal(c.snafu(), 'snafu from C')
      assert.isTrue(c instanceof C)
      assert.isTrue(c instanceof Subtrait)
      assert.isTrue(c instanceof Supertrait2)
      assert.isTrue(c instanceof Supertrait1)
    })
  })

  suite('real-world-ish traits', () => {
    test('validation works', () => {
      const Nameable = Trait(superclass => class extends superclass {
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
    })
  })
})
