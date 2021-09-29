import { bind } from 'ember-runloop-decorators';
import { module, test } from 'qunit';

module('Unit | @bind', function (hooks) {
  const reference = {} as { assert: Assert };
  let foo: Foo;

  class Foo {
    constructor(private assert: Assert) {
      reference.assert = assert;
    }

    @bind()
    default(arg?: string) {
      this.assert.step(arg ? `default:${arg}` : 'default');
      this.assert.true(this instanceof Foo);
      return arg;
    }

    // FIXME: Improve type inference by replacing `decoratorWithParams` with
    // specialized util.
    @bind((instance: Foo) => instance.assert)
    fn(arg?: string) {
      (this as unknown as Assert).step(arg ? `fn:${arg}` : 'fn');
      return arg;
    }

    @bind(reference)
    ref(arg?: string) {
      const ref = this as unknown as typeof reference;
      ref.assert.step(arg ? `ref:${arg}` : 'ref');
      ref.assert.strictEqual(ref, reference);
      return arg;
    }
  }

  hooks.beforeEach((assert) => {
    foo = new Foo(assert);
    assert.verifySteps([], 'no method is called during initialization');
  });

  test('@bind', async function (assert) {
    foo.default();
    foo.default('a');
    assert.verifySteps(['default', 'default:a'], 'default is called');
  });

  test('@bind(instance => ...)', async function (assert) {
    foo.fn();
    foo.fn('a');
    assert.verifySteps(['fn', 'fn:a'], 'fn is called');
  });

  test('@bind(reference)', async function (assert) {
    foo.ref();
    foo.ref('a');
    assert.verifySteps(['ref', 'ref:a'], 'ref is called');
  });
});
