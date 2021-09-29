import { EmberRunTimer, run, cancel } from '@ember/runloop';
import { once } from 'ember-runloop-decorators';
import { module, test } from 'qunit';

// Default queue order: `Ember.run.backburner.queueNames`
// => actions, routerTransitions, render, afterRender, destroy

module('Unit | @once', function (hooks) {
  class Foo {
    constructor(private assert: Assert) {}

    @once()
    bar(arg?: string): EmberRunTimer {
      this.assert.step(arg ? `bar:${arg}` : 'bar');
      return undefined as unknown as EmberRunTimer;
    }

    @once()
    qux(arg?: string): EmberRunTimer {
      this.assert.step(arg ? `qux:${arg}` : 'qux');
      return undefined as unknown as EmberRunTimer;
    }

    @once()
    zap(arg?: string): EmberRunTimer {
      this.assert.step(arg ? `zap:${arg}` : 'zap');
      return undefined as unknown as EmberRunTimer;
    }
  }

  let foo: Foo;

  hooks.beforeEach((assert) => {
    foo = new Foo(assert);
    assert.verifySteps([], 'no method is called during initialization');
  });

  test('it works', async function (assert) {
    run(() => {
      foo.zap();
      foo.bar();
      foo.qux();
      foo.bar();
      foo.qux();
      foo.zap();
      assert.verifySteps([], 'no methods are called immediately');
    });

    assert.verifySteps(
      ['zap', 'bar', 'qux'],
      'methods are called once in queue order'
    );
  });

  test('it cancels', async function (assert) {
    let timers!: EmberRunTimer[];

    run(() => {
      timers = [foo.bar(), foo.qux()];

      foo.bar();
      foo.qux();
      foo.zap();

      assert.verifySteps([], 'no methods are called immediately');

      for (const timer of timers) cancel(timer);
    });

    assert.verifySteps(
      ['zap'],
      'no canceled methods are called and timer reference is shared'
    );

    run(() => {
      foo.zap();
      foo.qux();
      foo.qux();
      foo.zap();
    });

    assert.verifySteps(
      ['zap', 'qux'],
      'no canceled methods are called and timer reference is shared'
    );
  });

  test('it ignores passed arguments for deduplication', function (assert) {
    run(() => {
      foo.zap('a');
      foo.bar('b');
      foo.qux('c');
      foo.zap();
      foo.qux('e');
      foo.bar('d');

      assert.verifySteps([], 'no methods are called immediately');
    });

    assert.verifySteps(
      ['zap', 'bar:d', 'qux:e'],
      'methods are called once in queue order with the respective latest arguments'
    );
  });
});
