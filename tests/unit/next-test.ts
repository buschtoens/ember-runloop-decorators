import { cancel, EmberRunTimer, run } from '@ember/runloop';
import settled from '@ember/test-helpers/settled';
import { next } from 'ember-runloop-decorators';
import { module, test } from 'qunit';

module('Unit | @next', function (hooks) {
  class Foo {
    constructor(private assert: Assert) {}

    @next
    foo(): EmberRunTimer {
      this.assert.step('foo');
      return undefined as unknown as EmberRunTimer;
    }

    @next
    bar(): EmberRunTimer {
      this.assert.step('bar');
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
      foo.foo();
      foo.foo();
      foo.bar();
      foo.bar();
      foo.foo();
      assert.verifySteps([], 'no method is called immediately');
    });
    assert.verifySteps([], 'no method is called right after run-loop');

    await settled();

    assert.verifySteps(
      ['foo', 'foo', 'bar', 'bar', 'foo'],
      'methods are called in order after wait period'
    );
  });

  test('it cancels', async function (assert) {
    let timers!: EmberRunTimer[];

    run(() => {
      foo.bar();
      timers = [foo.foo(), foo.bar()];
      foo.bar();
      assert.verifySteps([], 'no method is called immediately');
    });
    assert.verifySteps([], 'no method is called right after run-loop');

    for (const timer of timers) cancel(timer);

    await settled();
    assert.verifySteps(['bar', 'bar'], 'canceled methods are not executed');
  });
});
