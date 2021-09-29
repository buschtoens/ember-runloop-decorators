import { cancel, EmberRunTimer, run } from '@ember/runloop';
import settled from '@ember/test-helpers/settled';
import { debounce } from 'ember-runloop-decorators';
import { module, test } from 'qunit';

module('Unit | @debounce', function (hooks) {
  class Foo {
    constructor(private assert: Assert) {}

    @debounce(10)
    default(): EmberRunTimer {
      this.assert.step('default');
      return undefined as unknown as EmberRunTimer;
    }

    @debounce(10, true)
    immediate(): EmberRunTimer {
      this.assert.step('immediate');
      return undefined as unknown as EmberRunTimer;
    }

    @debounce(10, false)
    notImmediate(): EmberRunTimer {
      this.assert.step('notImmediate');
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
      foo.default();
      foo.immediate();
      foo.notImmediate();
      assert.verifySteps(
        ['immediate'],
        'immediate method is called immediately'
      );
    });
    assert.verifySteps(
      [],
      'non-immediate methods are not called right after run-loop'
    );

    await settled();
    assert.verifySteps(
      ['default', 'notImmediate'],
      'non-immediate methods are called after wait period'
    );
  });

  test('it debounces', async function (assert) {
    run(() => {
      foo.default();
      foo.default();
      foo.immediate();
      foo.immediate();
      foo.notImmediate();
      foo.notImmediate();
      assert.verifySteps(
        ['immediate'],
        'immediate method is called once immediately'
      );
    });
    assert.verifySteps(
      [],
      'non-immediate methods are not called right after run-loop'
    );

    run(() => {
      foo.default();
      foo.immediate();
      foo.notImmediate();
      assert.verifySteps(
        [],
        'immediate method is not called immediately, because of debounce period'
      );
    });
    assert.verifySteps(
      [],
      'non-immediate methods are not called right after run-loop, because of debounce period'
    );

    await settled();
    assert.verifySteps(
      ['default', 'notImmediate'],
      'non-immediate methods are called after wait period'
    );

    run(() => {
      foo.default();
      foo.default();
      foo.immediate();
      foo.immediate();
      foo.notImmediate();
      foo.notImmediate();
      assert.verifySteps(
        ['immediate'],
        'immediate method is called once again immediately, after previous debounce period elapsed'
      );
    });
    assert.verifySteps(
      [],
      'non-immediate methods are not called right after run-loop'
    );

    await settled();
    assert.verifySteps(
      ['default', 'notImmediate'],
      'non-immediate methods are called once again, after previous debounce period elapsed'
    );
  });

  test('it cancels', async function (assert) {
    let timers!: EmberRunTimer[];

    run(() => {
      timers = [foo.default(), foo.notImmediate()];
    });
    assert.verifySteps(
      [],
      'non-immediate methods are not called right after run-loop'
    );

    for (const timer of timers) cancel(timer);

    await settled();
    assert.verifySteps(
      [],
      'non-immediate methods are not called after wait period, because they were canceled'
    );
  });
});
