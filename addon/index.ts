import { assert, warn } from '@ember/debug';
import * as RunLoop from '@ember/runloop';
import type { EmberRunQueues, EmberRunTimer } from '@ember/runloop';
import {
  decoratorWithParams,
  decoratorWithRequiredParams,
} from '@ember-decorators/utils/decorator';
import type { Class, ConditionalKeys } from 'type-fest';

type MethodDescriptor<
  T extends (...args: any[]) => any = (...args: any[]) => any
> = TypedPropertyDescriptor<T>;

type MethodDecorator = <
  Target extends Class<any>,
  Key extends ConditionalKeys<Target, (...args: any[]) => any>
>(
  target: Object,
  propertyKey: Key,
  descriptor: MethodDescriptor<Target[Key]>
) => MethodDescriptor<Target[Key]> | void;

/**
 * @note Scheduling in the `afterRender` queue is bad for performance.
 *
 * @see https://github.com/ember-lifeline/ember-lifeline/blob/9842853ae600c0652531962f679a0900ba289eec/addon/run-task.ts#L128-L131
 */
export type RunLoopQueue =
  | Exclude<EmberRunQueues, 'afterRender'>
  | ('afterRender' & {});

/**
 * Runs the method inside of a run-loop, ensuring any deferred actions
 * including bindings and views updates are flushed at the end.
 *
 * @note Normally you should not need to invoke this yourself. However if you
 * are implementing raw event handlers when interfacing with other libraries or
 * plugins, you should probably wrap all of your code with this decorator.
 *
 * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/run?anchor=run}
 * {@link https://github.com/BackburnerJS/backburner.js/blob/v2.7.0/lib/index.ts#L324-L331}
 *
 * @example
 * ```ts
 * class Foo {
 *   @inRunLoop
 *   runInRunLoop() {
 *     // If no run-loop is present, it creates a new one. If a run loop is
 *     // present, it will queue itself to run on the existing run-loop's
 *     // `actions` queue.
 *   }
 * }
 * ```
 */
export const inRunLoop = decoratorWithParams(function inRunLoop<
  Target extends Class<any>,
  Method extends (...args: any[]) => EmberRunTimer
>(
  _target: Target,
  _key: keyof Target,
  desc: MethodDescriptor<Method>,
  args: unknown[]
) {
  assert(
    `The '@inRunLoop' decorator must be invoked without arguments and parentheses.'`,
    args.length === 0
  );

  const { value } = desc;
  assert(
    `The '@inRunLoop' decorator can only be used on methods.`,
    typeof value === 'function'
  );

  return {
    ...desc,
    value(this: InstanceType<Target>, ...args: Parameters<Method>) {
      return RunLoop.run(this, value, ...args);
    },
  };
}) as MethodDecorator;

/**
 * Join the method with an existing queue and execute immediately, if there
 * isn't one use `run`.
 *
 * The `@joinRunLoop` decorator (`join`) is like the `@inRunLoop` decorator
 * (`run`), except that it will schedule into an existing queue, if one already
 * exists.
 *
 * In either case, the `@joinRunLoop` decorator will immediately execute the
 * decorated method and return its result.
 *
 * @note The above (from `backburner.js`) conflicted the Ember.js API docs:
 * If no run-loop is present, it creates a new one. If a run-loop is present,
 * it will queue itself to run on the existing run-loop's `actions` queue.
 * When called within an existing loop, no return value is possible.
 *
 * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/join?anchor=join}
 * {@link https://github.com/BackburnerJS/backburner.js/blob/v2.7.0/lib/index.ts#L333-L354}
 *
 * @example
 * ```ts
 * class Foo {
 *   @joinRunLoop
 *   runInRunLoop() {
 *     // If no run-loop is present, it creates a new one. If a run loop is
 *     // present, it will queue itself to run on the existing run-loop's
 *     // `actions` queue.
 *   }
 * }
 * ```
 */
export const joinRunLoop = decoratorWithParams(function joinRunLoop<
  Target extends Class<any>,
  Method extends (...args: any[]) => EmberRunTimer
>(
  _target: Target,
  _key: keyof Target,
  desc: MethodDescriptor<Method>,
  args: unknown[]
) {
  assert(
    `The '@joinRunLoop' decorator must be invoked without arguments and parentheses.'`,
    args.length === 0
  );

  const { value } = desc;
  assert(
    `The '@joinRunLoop' decorator can only be used on methods.`,
    typeof value === 'function'
  );

  return {
    ...desc,
    value(this: InstanceType<Target>, ...args: Parameters<Method>) {
      return RunLoop.join(this, value, ...args);
    },
  };
}) as MethodDecorator;

const BOUND = Symbol('@bind');

const getContext = <Target extends Class<any>, Context>(
  instance: InstanceType<Target>,
  args: [context?: Context | ((instance: InstanceType<Target>) => Context)]
) =>
  args.length > 0
    ? typeof args[0] === 'function'
      ? (args[0] as (instance: InstanceType<Target>) => Context)(instance)
      : args[0]
    : instance;

/**
 * Allows you to specify which context to call the decorated method on, while
 * adding the execution of that method to the Ember run-loop. This ability
 * makes this method a great way to asynchronously integrate third-party
 * libraries into your Ember application.
 *
 * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/bind?anchor=bind}
 *
 * @example
 * ```ts
 * class Foo {
 *   @bind
 *   onActionsQueue() {
 *     // This will be executed in the `actions` queue.
 *   }
 *
 *   @bind('sync')
 *   onActionsQueue() {
 *     // This will be executed in the `sync` queue.
 *   }
 * }
 * ```
 */
export const bind = decoratorWithParams<
  Class<any>,
  [context?: any | ((instance: InstanceType<Class<any>>) => any)]
>(function bind<
  Target extends Class<any>,
  Method extends (...args: any[]) => EmberRunTimer,
  Context extends {}
>(
  _target: Target,
  key: keyof Target,
  desc: MethodDescriptor<Method>,
  args: [context?: Context | ((instance: InstanceType<Target>) => Context)]
) {
  assert(
    `'@bind' must be invoked with no arguments or a single context.`,
    args.length <= 1
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { value, writable, ...descriptor } = desc;
  assert(
    `The '@bind' decorator can only be used on methods.`,
    typeof value === 'function'
  );

  return {
    ...descriptor,
    get(this: InstanceType<Target>) {
      if (!this[BOUND]) this[BOUND] = {};
      if (!this[BOUND][key])
        this[BOUND][key] = RunLoop.bind(getContext(this, args), value);

      return this[BOUND][key];
    },
  };
});

/**
 * Adds the method call to the named `queue` to be executed at the end of the
 * run-loop. If you have not already started a run-loop when calling this
 * method one will be started for you automatically.
 *
 * At the end of a run-loop, any methods scheduled in this way will be invoked.
 * Methods will be invoked in an order matching the named queues defined in the
 * `run.queues` property.
 *
 * @param [queue='actions'] The name of the queue to schedule against. Default
 * is `actions`.
 * @returns {EmberRunTimer} Timer information for use in canceling, see
 * `cancel` from `@ember/runloop`.
 *
 * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/schedule?anchor=schedule}
 * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/cancel?anchor=cancel}
 *
 * @example
 * ```ts
 * class Foo {
 *   @schedule
 *   onActionsQueue() {
 *     // This will be executed in the `actions` queue.
 *   }
 *
 *   @schedule('sync')
 *   onActionsQueue() {
 *     // This will be executed in the `sync` queue.
 *   }
 * }
 * ```
 */
export const schedule = decoratorWithRequiredParams(function schedule<
  Target extends Class<any>,
  Method extends (...args: any[]) => EmberRunTimer
>(
  _target: Target,
  _key: keyof Target,
  desc: MethodDescriptor<Method>,
  // FIXME: Optional / no parameter invocation: `@schedule` / `@schedule()`
  [queue = 'actions']: [queue?: RunLoopQueue]
) {
  assert(
    `'queue' must be a valid \`@ember/runloop\` queue name. Received instead: '${queue}'`,
    typeof queue === 'string' && queue.length > 0
  );
  warn(
    `Using the 'afterRender' queue is bad for performance.`,
    queue !== 'afterRender',
    { id: 'ember-runloop-decorators.queues.afterRender' }
  );

  const { value } = desc;
  assert(
    `The '@schedule' decorator can only be used on methods.`,
    typeof value === 'function'
  );

  return {
    ...desc,
    value(this: InstanceType<Target>, ...args: Parameters<Method>) {
      return RunLoop.schedule(queue, this, value, ...args);
    },
  };
});

/**
 * Schedules the method call to run one time in a given `queue` of the current
 * run-loop.
 *
 * Calling a decorated method with the same arguments combination will have no
 * effect (past the initial call). Although you can pass optional arguments,
 * these will not be considered when looking for duplicates. New arguments will
 * replace previous calls.
 *
 * At the end of a run-loop, any methods scheduled in this way will be invoked.
 * Methods will be invoked in an order matching the named queues defined in the
 * `run.queues` property.
 *
 * @param [queue='actions'] The name of the queue to schedule against. Default
 * is `actions`.
 * @returns {EmberRunTimer} Timer information for use in canceling, see
 * `cancel` from `@ember/runloop`.
 *
 * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/scheduleOnce?anchor=scheduleOnce}
 * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/cancel?anchor=cancel}
 *
 * @example
 * ```ts
 * class Foo {
 *   @schedule
 *   onActionsQueue() {
 *     // This will be executed in the `actions` queue.
 *   }
 *
 *   @schedule('sync')
 *   onActionsQueue() {
 *     // This will be executed in the `sync` queue.
 *   }
 * }
 * ```
 */
export const scheduleOnce = decoratorWithRequiredParams(function scheduleOnce<
  Target extends Class<any>,
  Method extends (...args: any[]) => EmberRunTimer
>(
  _target: Target,
  _key: keyof Target,
  desc: MethodDescriptor<Method>,
  [queue = 'actions']: [queue?: RunLoopQueue]
) {
  assert(
    `'queue' must be a valid \`@ember/runloop\` queue name. Received instead: '${queue}'`,
    typeof queue === 'string' && queue.length > 0
  );
  warn(
    `Using the 'afterRender' queue is bad for performance.`,
    queue !== 'afterRender',
    { id: 'ember-runloop-decorators.queues.afterRender' }
  );

  const { value } = desc;
  assert(
    `The '@scheduleOnce' decorator can only be used on methods.`,
    typeof value === 'function'
  );

  return {
    ...desc,
    value(this: InstanceType<Target>, ...args: Parameters<Method>) {
      return RunLoop.scheduleOnce(queue, this, value, ...args);
    },
  };
});

/**
 * Schedule the method to run one time during the current run-loop. This is
 * equivalent to calling `scheduleOnce` with the `actions` queue.
 *
 * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/once?anchor=once}
 *
 * @example
 * ```ts
 * class Foo {
 *   @once
 *   onceInCurrentRunLoop() {
 *     // If no run-loop is present, it creates a new one. If a run loop is
 *     // present, it will queue itself to run on the existing run-loop's
 *     // `actions` queue.
 *   }
 * }
 * ```
 */
export const once = decoratorWithParams(function once<
  Target extends Class<any>,
  Method extends (...args: any[]) => EmberRunTimer
>(
  _target: Target,
  _key: keyof Target,
  desc: MethodDescriptor<Method>,
  args: unknown[]
) {
  assert(
    `The '@once' decorator must be invoked without arguments and parentheses.'`,
    args.length === 0
  );

  const { value } = desc;
  assert(
    `The '@once' decorator can only be used on methods.`,
    typeof value === 'function'
  );

  return {
    ...desc,
    value(this: InstanceType<Target>, ...args: Parameters<Method>) {
      return RunLoop.once(this, value, ...args);
    },
  };
});

/**
 * Invokes the decorated method after a specified period of time.
 *
 * @remarks You should use this decorator whenever you need to run some action
 * after a period of time instead of using `setTimeout()`. This method will
 * ensure that items that expire during the same script execution cycle and all
 * execute together, which is often more efficient than using a real
 * `setTimeout()`.
 *
 * @param wait Number of milliseconds to wait.
 * @returns {EmberRunTimer} Timer information for use in canceling, see
 * `cancel` from `@ember/runloop`.
 *
 * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/later?anchor=later}
 * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/cancel?anchor=cancel}
 *
 * @example
 * ```ts
 * class Foo {
 *   @later(100)
 *   after100ms() {
 *     // Delay calling the method until the wait period has elapsed.
 *     // Additional calls enqueue additional executions.
 *   }
 * }
 * ```
 */
export const later = decoratorWithRequiredParams(function later<
  Target extends Class<any>,
  Method extends (...args: any[]) => EmberRunTimer
>(
  _target: Target,
  _key: keyof Target,
  desc: MethodDescriptor<Method>,
  [wait]: [wait: number]
) {
  assert(
    `'wait' must be a positive integer. Received instead: '${wait}'`,
    Number.isSafeInteger(wait) && wait >= 0
  );

  const { value } = desc;
  assert(
    `The '@later' decorator can only be used on methods.`,
    typeof value === 'function'
  );

  return {
    ...desc,
    value(this: InstanceType<Target>, ...args: Parameters<Method>) {
      return RunLoop.later(this, value, ...args, wait);
    },
  };
});

/**
 * If no run-loop is present, it creates a new one. If a run loop is present it
 * will queue itself to run on the existing run-loop's `action` queue.
 *
 * @note This is not for normal usage, and should be used sparingly.
 *
 * @returns {unknown} Return value from invoking the decorated method. Please
 * note, when called within an existing loop, no return value is possible.
 *
 * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/next?anchor=next}
 *
 * @example
 * ```ts
 * class Foo {
 *   @next
 *   inRunLoop() {
 *     // If no run-loop is present, it creates a new one. If a run loop is
 *     // present, it will queue itself to run on the existing run-loops action
 *     // queue.
 *   }
 * }
 * ```
 */
export const next = decoratorWithParams(function next<
  Target extends Class<any>,
  Method extends (...args: any[]) => EmberRunTimer
>(
  _target: Target,
  _key: keyof Target,
  desc: MethodDescriptor<Method>,
  args: unknown[]
) {
  assert(
    `The '@next' decorator must be invoked without arguments and parentheses.'`,
    args.length === 0
  );

  const { value } = desc;
  assert(
    `The '@next' decorator can only be used on methods.`,
    typeof value === 'function'
  );

  return {
    ...desc,
    value(this: InstanceType<Target>, ...args: Parameters<Method>) {
      return RunLoop.next(this, value, ...args);
    },
  };
})();

/**
 * @param wait Number of milliseconds to wait.
 * @param [immediate=false] Trigger on the leading edge instead of the trailing
 * edge of the wait interval. Defaults to `false`.
 * @returns {EmberRunTimer}
 *
 * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/debounce?anchor=debounce}
 *
 * @example
 * ```ts
 * class Foo {
 *   @debounce(100)
 *   after100ms() {
 *     // Delay calling the method until the debounce period has elapsed with
 *     // no additional calls. If called again before the specified time has
 *     // elapsed, the timer is reset and the entire period must pass again
 *     // before the method is called.
 *   }
 *
 *   @debounce(100, true)
 *   immediatelyAndAfter100ms() {
 *     // Run the method immediately, but debounce other calls for this method
 *     // until the wait time has elapsed. If called again before the specified
 *     // time has elapsed, the timer is reset and the entire period must pass
 *     // again before the method can be called again.
 *   }
 * }
 * ```
 */
export const debounce = decoratorWithRequiredParams(function debounce<
  Target extends Class<any>,
  Method extends (...args: any[]) => EmberRunTimer
>(
  _target: Target,
  _key: keyof Target,
  desc: MethodDescriptor<Method>,
  [wait, immediate = false]: [wait: number, immediate?: boolean]
) {
  assert(
    `'wait' must be a positive integer. Received instead: '${wait}'`,
    Number.isSafeInteger(wait) && wait >= 0
  );
  assert(
    `'immediate' must be a boolean. Received instead: '${immediate}'`,
    typeof immediate === 'boolean'
  );

  const { value } = desc;
  assert(
    `The '@debounce' decorator can only be used on methods.`,
    typeof value === 'function'
  );

  return {
    ...desc,
    value(this: InstanceType<Target>, ...args: Parameters<Method>) {
      return RunLoop.debounce(this, value, ...args, wait, immediate);
    },
  };
});

/**
 * Ensure that the target method is never called more frequently than the
 * specified spacing period. The target method is called immediately.
 *
 * @param spacing Number of milliseconds to space out requests.
 * @param [immediate=true] Trigger on the leading edge instead of the trailing
 * edge of the spacing interval. Defaults to `true`.
 * @returns {EmberRunTimer}
 *
 * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/throttle?anchor=throttle}
 *
 * @example
 * ```ts
 * class Foo {
 *   @throttle(100)
 *   every100ms() {
 *     // Ensure that the method is never called more frequently than the
 *     // specified spacing period. The method is called immediately.
 *   }
 *
 *   @debounce(100, false)
 *   delayedByAndEvery100ms() {
 *     // Ensure that the method is never called more frequently than the
 *     // specified spacing period. The method is called after the first spacing
 *     // period has elapsed.
 *   }
 * }
 * ```
 */
export const throttle = decoratorWithRequiredParams(function throttle<
  Target extends Class<any>,
  Method extends (...args: any[]) => EmberRunTimer
>(
  _target: Target,
  _key: keyof Target,
  desc: MethodDescriptor<Method>,
  [spacing, immediate = true]: [spacing: number, immediate?: boolean]
) {
  assert(
    `'spacing' must be a positive integer. Received instead: '${spacing}'`,
    Number.isSafeInteger(spacing) && spacing >= 0
  );
  assert(
    `'immediate' must be a boolean. Received instead: '${immediate}'`,
    typeof immediate === 'boolean'
  );

  const { value } = desc;
  assert(
    `The '@throttle' decorator can only be used on methods.`,
    typeof value === 'function'
  );

  return {
    ...desc,
    value(this: InstanceType<Target>, ...args: Parameters<Method>) {
      return RunLoop.throttle(this, value, ...args, spacing, immediate);
    },
  };
});
