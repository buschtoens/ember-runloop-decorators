import { EmberRunTimer, run, cancel } from '@ember/runloop';
import { scheduleOnce } from 'ember-runloop-decorators';
import { module, test } from 'qunit';

// Default queue order: `Ember.run.backburner.queueNames`
// => actions, routerTransitions, render, afterRender, destroy

module('Unit | @scheduleOnce', function (hooks) {
  class Foo {
    constructor(private assert: Assert) {}

    // FIXME: Optional parameter support
    // @schedule() // actions
    // FIXME: No parameter support
    // @schedule // actions
    // default(arg?: string): EmberRunTimer {
    //   this.assert.step(arg ? `default:${arg}` : 'default');
    //   return undefined as unknown as EmberRunTimer;
    // }

    @scheduleOnce('actions')
    actions(arg?: string): EmberRunTimer {
      this.assert.step(arg ? `actions:${arg}` : 'actions');
      return undefined as unknown as EmberRunTimer;
    }

    @scheduleOnce('routerTransitions')
    routerTransitions(arg?: string): EmberRunTimer {
      this.assert.step(arg ? `routerTransitions:${arg}` : 'routerTransitions');
      return undefined as unknown as EmberRunTimer;
    }

    @scheduleOnce('render')
    render(arg?: string): EmberRunTimer {
      this.assert.step(arg ? `render:${arg}` : 'render');
      return undefined as unknown as EmberRunTimer;
    }

    @scheduleOnce('afterRender')
    afterRender(arg?: string): EmberRunTimer {
      this.assert.step(arg ? `afterRender:${arg}` : 'afterRender');
      return undefined as unknown as EmberRunTimer;
    }

    @scheduleOnce('destroy')
    destroy(arg?: string): EmberRunTimer {
      this.assert.step(arg ? `destroy:${arg}` : 'destroy');
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
      // foo.default();
      foo.destroy();
      foo.afterRender();
      foo.render();
      foo.routerTransitions();
      foo.actions();
      foo.actions();
      foo.routerTransitions();
      foo.render();
      foo.afterRender();
      foo.destroy();
      assert.verifySteps([], 'no methods are called immediately');
    });

    assert.verifySteps(
      ['actions', 'routerTransitions', 'render', 'afterRender', 'destroy'],
      'methods are called once in queue order'
    );
  });

  test('it cancels', async function (assert) {
    let timers!: EmberRunTimer[];

    run(() => {
      timers = [
        // foo.default(),
        foo.destroy(),
        foo.afterRender(),
        foo.render(),
        foo.routerTransitions(),
        foo.actions(),
      ];

      foo.destroy();
      foo.actions();
      foo.destroy();
      foo.actions();

      assert.verifySteps([], 'no methods are called immediately');

      for (const timer of timers) cancel(timer);

      foo.actions();
      foo.actions();
    });

    assert.verifySteps(
      ['actions'],
      'no canceled methods are called and timer reference is shared'
    );
  });

  test('it ignores passed arguments for deduplication', function (assert) {
    run(() => {
      // foo.default();
      foo.destroy('foo');
      foo.afterRender('qux');
      foo.render();
      foo.routerTransitions();
      foo.actions('baz');
      foo.actions();
      foo.routerTransitions();
      foo.render('quax');
      foo.afterRender();
      foo.destroy('bar');
      assert.verifySteps([], 'no methods are called immediately');
    });

    assert.verifySteps(
      [
        'actions',
        'routerTransitions',
        'render:quax',
        'afterRender',
        'destroy:bar',
      ],
      'methods are called once in queue order with the respective latest arguments'
    );
  });
});
