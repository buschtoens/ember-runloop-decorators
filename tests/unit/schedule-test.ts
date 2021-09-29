import { EmberRunTimer, run, cancel } from '@ember/runloop';
import { schedule } from 'ember-runloop-decorators';
import { module, test } from 'qunit';

// Default queue order: `Ember.run.backburner.queueNames`
// => actions, routerTransitions, render, afterRender, destroy

module('Unit | @schedule', function (hooks) {
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

    @schedule('actions')
    actions(arg?: string): EmberRunTimer {
      this.assert.step(arg ? `actions:${arg}` : 'actions');
      return undefined as unknown as EmberRunTimer;
    }

    @schedule('routerTransitions')
    routerTransitions(arg?: string): EmberRunTimer {
      this.assert.step(arg ? `routerTransitions:${arg}` : 'routerTransitions');
      return undefined as unknown as EmberRunTimer;
    }

    @schedule('render')
    render(arg?: string): EmberRunTimer {
      this.assert.step(arg ? `render:${arg}` : 'render');
      return undefined as unknown as EmberRunTimer;
    }

    @schedule('afterRender')
    afterRender(arg?: string): EmberRunTimer {
      this.assert.step(arg ? `afterRender:${arg}` : 'afterRender');
      return undefined as unknown as EmberRunTimer;
    }

    @schedule('destroy')
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
      foo.destroy('foo');
      foo.afterRender('bar');
      foo.render();
      foo.routerTransitions();
      foo.actions();
      foo.actions();
      foo.routerTransitions();
      foo.render('qux');
      foo.afterRender();
      foo.destroy();
      assert.verifySteps([], 'no methods are called immediately');
    });

    assert.verifySteps(
      [
        'actions',
        'actions',
        'routerTransitions',
        'routerTransitions',
        'render',
        'render:qux',
        'afterRender:bar',
        'afterRender',
        'destroy:foo',
        'destroy',
      ],
      'methods are called in queue order'
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
    });

    assert.verifySteps(
      ['actions', 'actions', 'destroy', 'destroy'],
      'no canceled methods are called'
    );
  });
});
