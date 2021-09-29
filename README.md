# ember-runloop-decorators

[![CI](https://github.com/buschtoens/ember-runloop-decorators/workflows/CI/badge.svg)](https://github.com/buschtoens/ember-runloop-decorators/actions)
[![npm version](https://badge.fury.io/js/ember-runloop-decorators.svg)](http://badge.fury.io/js/ember-runloop-decorators)
[![Download Total](https://img.shields.io/npm/dt/ember-runloop-decorators.svg)](http://badge.fury.io/js/ember-runloop-decorators)
[![Ember Observer Score](https://emberobserver.com/badges/ember-runloop-decorators.svg)](https://emberobserver.com/addons/ember-runloop-decorators)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![dependencies](https://img.shields.io/david/buschtoens/ember-runloop-decorators.svg)](https://david-dm.org/buschtoens/ember-runloop-decorators)
[![devDependencies](https://img.shields.io/david/dev/buschtoens/ember-runloop-decorators.svg)](https://david-dm.org/buschtoens/ember-runloop-decorators)

Decorators for [`@ember/runloop`][ember-runloop].

[ember-runloop]: https://api.emberjs.com/ember/release/classes/@ember%2Frunloop

## Installation

```sh
ember install ember-runloop-decorators
```

## Usage

- [`@inRunLoop`](#inRunLoop)
- [`@joinRunLoop`](#joinRunLoop)
- [`@bind`](#bind)
- [`@schedule`](#schedule)
- [`@scheduleOnce`](#scheduleOnce)
- [`@once`](#once)
- [`@later`](#later)
- [`@next`](#next)
- [`@debounce`](#debounce)
- [`@throttle`](#throttle)

### `@inRunLoop`

```ts
class Foo {
  @inRunLoop
  runInRunLoop() {
    // If no run-loop is present, it creates a new one. If a run loop is
    // present, it will queue itself to run on the existing run-loop's
    // `actions` queue.
  }
}
```

### `@joinRunLoop`

```ts
class Foo {
  @joinRunLoop
  runInRunLoop() {
    // If no run-loop is present, it creates a new one. If a run loop is
    // present, it will queue itself to run on the existing run-loop's
    // `actions` queue.
  }
}
```

### `@bind`

```ts
class Foo {
  @bind
  onActionsQueue() {
    // This will be executed in the `actions` queue.
  }
 *
  @bind('sync')
  onActionsQueue() {
    // This will be executed in the `sync` queue.
  }
}
```

### `@schedule`

```ts
class Foo {
  @schedule
  onActionsQueue() {
    // This will be executed in the `actions` queue.
  }
 *
  @schedule('sync')
  onActionsQueue() {
    // This will be executed in the `sync` queue.
  }
}
```

### `@scheduleOnce`

```ts
class Foo {
  @schedule
  onActionsQueue() {
    // This will be executed in the `actions` queue.
  }
 *
  @schedule('sync')
  onActionsQueue() {
    // This will be executed in the `sync` queue.
  }
}
```

### `@once`

```ts
class Foo {
  @once
  onceInCurrentRunLoop() {
    // If no run-loop is present, it creates a new one. If a run loop is
    // present, it will queue itself to run on the existing run-loop's
    // `actions` queue.
  }
}
```

### `@later`

```ts
class Foo {
  @later(100)
  after100ms() {
    // Delay calling the method until the wait period has elapsed.
    // Additional calls enqueue additional executions.
  }
}
```

### `@next`

```ts
class Foo {
  @next
  inRunLoop() {
    // If no run-loop is present, it creates a new one. If a run loop is
    // present, it will queue itself to run on the existing run-loops action
    // queue.
  }
}
```

### `@debounce`

```ts
class Foo {
  @debounce(100)
  after100ms() {
    // Delay calling the method until the debounce period has elapsed with
    // no additional calls. If called again before the specified time has
    // elapsed, the timer is reset and the entire period must pass again
    // before the method is called.
  }
 *
  @debounce(100, true)
  immediatelyAndAfter100ms() {
    // Run the method immediately, but debounce other calls for this method
    // until the wait time has elapsed. If called again before the specified
    // time has elapsed, the timer is reset and the entire period must pass
    // again before the method can be called again.
  }
}
```

### `@throttle`

```ts
class Foo {
  @throttle(100)
  every100ms() {
    // Ensure that the method is never called more frequently than the
    // specified spacing period. The method is called immediately.
  }
 *
  @debounce(100, false)
  delayedByAndEvery100ms() {
    // Ensure that the method is never called more frequently than the
    // specified spacing period. The method is called after the first spacing
    // period has elapsed.
  }
}
```
