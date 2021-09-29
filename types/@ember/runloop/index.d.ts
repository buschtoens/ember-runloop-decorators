/**
 * Improved type definitions for `@ember/runloop`. Based on the official
 * DefinitelyTyped definitions in `@types/ember__runloop`.
 */

// Type definitions for non-npm package @ember/runloop 3.16
// Project: https://emberjs.com/api/ember/3.16/modules/@ember%2Frunloop
// Definitions by: Mike North <https://github.com/mike-north>
//                 Steve Calvert <https://github.com/scalvert>
//                 Chris Krycho <https://github.com/chriskrycho>
//                 Dan Freeman <https://github.com/dfreeman>
//                 James C. Davis <https://github.com/jamescdavis>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.7

import type { EmberRunQueues } from '@ember/runloop/-private/types';
import type { EmberRunTimer } from '@ember/runloop/types';
import type {} from '@ember/runloop/-private/backburner';

import type { ConditionalKeys, ValueOf } from 'type-fest';

export type { EmberRunQueues, EmberRunTimer };

export interface RunNamespace {
  /**
   * Runs the passed target and method inside of a RunLoop, ensuring any
   * deferred actions including bindings and views updates are flushed at the
   * end.
   *
   * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/run?anchor=run}
   */
  <T extends (...args: any[]) => any>(
    method: T,
    ...args: Parameters<T>
  ): ReturnType<T>;
  <Target, T extends (this: Target, ...args: any[]) => any>(
    target: Target,
    method: T,
    ...args: Parameters<T>
  ): ReturnType<T>;
  <
    Target,
    MethodName extends ConditionalKeys<
      Target,
      (this: Target, ...args: any[]) => any
    >
  >(
    target: Target,
    method: MethodName,
    ...args: Parameters<Target[MethodName]>
  ): ReturnType<Target[MethodName]>;

  /**
   * If no run-loop is present, it creates a new one. If a run loop is
   * present it will queue itself to run on the existing run-loops action
   * queue.
   *
   * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/join?anchor=join}
   */
  join<T extends (...args: any[]) => any>(
    method: T,
    ...args: Parameters<T>
  ): ReturnType<T> | undefined;
  join<Target, T extends (this: Target, ...args: any[]) => any>(
    target: Target,
    method: T,
    ...args: Parameters<T>
  ): ReturnType<T> | undefined;
  join<
    Target,
    MethodName extends ConditionalKeys<
      Target,
      (this: Target, ...args: any[]) => any
    >
  >(
    target: Target,
    method: MethodName,
    ...args: Parameters<Target[MethodName]>
  ): ReturnType<Target[MethodName]> | undefined;

  /**
   * Allows you to specify which context to call the specified function in while
   * adding the execution of that function to the Ember run loop. This ability
   * makes this method a great way to asynchronously integrate third-party libraries
   * into your Ember application.
   *
   * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/bind?anchor=bind}
   */
  bind<
    Target,
    T extends (this: Target, ...args: any[]) => any,
    BoundArgs extends unknown[],
    CallArgs extends unknown[]
  >(
    target: Target,
    method: T & ((this: Target, ...args: [...BoundArgs, ...CallArgs]) => any),
    ...args: BoundArgs
  ): (...args: CallArgs) => ReturnType<T>;

  bind<
    Target,
    MethodName extends ConditionalKeys<Target, (...args: any[]) => any>
  >(
    target: Target,
    method: MethodName,
    ...args: Parameters<Target[MethodName]>
  ): () => ReturnType<Target[MethodName]>;
  bind<
    Target,
    MethodName extends ConditionalKeys<Target, (...args: any[]) => any>
  >(
    target: Target,
    method: MethodName
  ): (
    ...args: Parameters<Target[MethodName]>
  ) => ReturnType<Target[MethodName]>;
  bind<
    Target,
    MethodName extends ConditionalKeys<Target, (...args: any[]) => any>
  >(
    target: Target,
    method: MethodName,
    ...args: ValueOf<Parameters<Target[MethodName]>>[]
  ): (
    ...args: ValueOf<Parameters<Target[MethodName]>>[]
  ) => ReturnType<Target[MethodName]>;

  /**
   * Begins a new RunLoop. Any deferred actions invoked after the begin will
   * be buffered until you invoke a matching call to `run.end()`. This is
   * a lower-level way to use a RunLoop instead of using `run()`.
   *
   * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/begin?anchor=begin}
   */
  begin(): void;

  /**
   * Ends a RunLoop. This must be called sometime after you call
   * `run.begin()` to flush any deferred actions. This is a lower-level way
   * to use a RunLoop instead of using `run()`.
   *
   * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/end?anchor=end}
   */
  end(): void;

  /**
   * Cancels a scheduled item. Must be a value returned by `run.later()`,
   * `run.once()`, `run.scheduleOnce()`, `run.next()`, `run.debounce()`, or
   * `run.throttle()`.
   *
   * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/cancel?anchor=cancel}
   */
  cancel(timer: EmberRunTimer): boolean;

  /**
   * Adds the passed target/method and any optional arguments to the named
   * queue to be executed at the end of the RunLoop. If you have not already
   * started a RunLoop when calling this method one will be started for you
   * automatically.
   *
   * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/schedule?anchor=schedule}
   */
  schedule<T extends (...args: any[]) => any>(
    queue: EmberRunQueues,
    method: T,
    ...args: Parameters<T>
  ): EmberRunTimer;
  schedule<Target, T extends (this: Target, ...args: any[]) => any>(
    queue: EmberRunQueues,
    target: Target,
    method: T,
    ...args: Parameters<T>
  ): EmberRunTimer;
  schedule<
    Target,
    MethodName extends ConditionalKeys<
      Target,
      (this: Target, ...args: any[]) => any
    >
  >(
    queue: EmberRunQueues,
    target: Target,
    method: MethodName,
    ...args: Parameters<Target[MethodName]>
  ): EmberRunTimer;

  /**
   * Schedules a function to run one time in a given queue of the current RunLoop.
   * Calling this method with the same queue/target/method combination will have
   * no effect (past the initial call).
   *
   * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/scheduleOnce?anchor=scheduleOnce}
   */
  scheduleOnce<T extends (...args: any[]) => any>(
    queue: EmberRunQueues,
    method: T,
    ...args: Parameters<T>
  ): EmberRunTimer;
  scheduleOnce<Target, T extends (this: Target, ...args: any[]) => any>(
    queue: EmberRunQueues,
    target: Target,
    method: T,
    ...args: Parameters<T>
  ): EmberRunTimer;
  scheduleOnce<
    Target,
    MethodName extends ConditionalKeys<
      Target,
      (this: Target, ...args: any[]) => any
    >
  >(
    queue: EmberRunQueues,
    target: Target,
    method: MethodName,
    ...args: Parameters<Target[MethodName]>
  ): EmberRunTimer;

  /**
   * Schedule a function to run one time during the current RunLoop. This is equivalent
   * to calling `scheduleOnce` with the "actions" queue.
   *
   * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/once?anchor=once}
   */
  once<T extends (...args: any[]) => any>(
    method: T,
    ...args: Parameters<T>
  ): EmberRunTimer;
  once<Target, T extends (this: Target, ...args: any[]) => any>(
    target: Target,
    method: T,
    ...args: Parameters<T>
  ): EmberRunTimer;
  once<
    Target,
    MethodName extends ConditionalKeys<
      Target,
      (this: Target, ...args: any[]) => any
    >
  >(
    target: Target,
    method: MethodName,
    ...args: Parameters<Target[MethodName]>
  ): EmberRunTimer;

  /**
   * Invokes the passed target/method and optional arguments after a specified
   * period of time. The last parameter of this method must always be a number
   * of milliseconds.
   *
   * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/later?anchor=later}
   *
   * {@link https://github.com/BackburnerJS/backburner.js/blob/v2.7.0/lib/index.ts#L92-L122}
   * {@link https://github.com/BackburnerJS/backburner.js/blob/v2.7.0/lib/index.ts#L35-L74}
   */
  later<T extends (...args: any[]) => any>(
    method: T,
    ...params: [...args: Parameters<T>, wait: number]
  ): EmberRunTimer;
  later<Target, T extends (this: Target, ...args: any[]) => any>(
    target: Target,
    method: T,
    ...params: [...args: Parameters<T>, wait: number]
  ): EmberRunTimer;
  later<
    Target,
    MethodName extends ConditionalKeys<
      Target,
      (this: Target, ...args: any[]) => any
    >
  >(
    target: Target,
    method: MethodName,
    ...params: [...args: Parameters<Target[MethodName]>, wait: number]
  ): EmberRunTimer;

  /**
   * Schedules an item to run from within a separate run loop, after
   * control has been returned to the system. This is equivalent to calling
   * `run.later` with a wait time of 1ms.
   *
   * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/next?anchor=next}
   */
  next<T extends (...args: any[]) => any>(
    method: T,
    ...args: Parameters<T>
  ): EmberRunTimer;
  next<Target, T extends (this: Target, ...args: any[]) => any>(
    target: Target,
    method: T,
    ...args: Parameters<T>
  ): EmberRunTimer;
  next<
    Target,
    MethodName extends ConditionalKeys<
      Target,
      (this: Target, ...args: any[]) => any
    >
  >(
    target: Target,
    method: MethodName,
    ...args: Parameters<Target[MethodName]>
  ): EmberRunTimer;

  /**
   * Delay calling the target method until the debounce period has elapsed
   * with no additional debounce calls. If `debounce` is called again before
   * the specified time has elapsed, the timer is reset and the entire period
   * must pass again before the target method is called.
   *
   * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/debounce?anchor=debounce}
   *
   * {@link https://github.com/BackburnerJS/backburner.js/blob/v2.7.0/lib/index.ts#L92-L122}
   * {@link https://github.com/BackburnerJS/backburner.js/blob/v2.7.0/lib/index.ts#L35-L74}
   */
  debounce<T extends (...args: any[]) => any>(
    method: T,
    ...params: [...args: Parameters<T>, wait: number, immediate?: boolean]
  ): EmberRunTimer;
  debounce<Target, T extends (this: Target, ...args: any[]) => any>(
    target: Target,
    method: T,
    ...params: [...args: Parameters<T>, wait: number, immediate?: boolean]
  ): EmberRunTimer;
  debounce<
    Target,
    MethodName extends ConditionalKeys<
      Target,
      (this: Target, ...args: any[]) => any
    >
  >(
    target: Target,
    method: MethodName,
    ...params: [
      ...args: Parameters<Target[MethodName]>,
      wait: number,
      immediate?: boolean
    ]
  ): EmberRunTimer;

  /**
   * Ensure that the target method is never called more frequently than
   * the specified spacing period. The target method is called immediately.
   *
   * {@link https://api.emberjs.com/ember/release/classes/@ember%2Frunloop/methods/throttle?anchor=throttle}
   *
   * {@link https://github.com/BackburnerJS/backburner.js/blob/v2.7.0/lib/index.ts#L444-L481}
   * {@link https://github.com/BackburnerJS/backburner.js/blob/v2.7.0/lib/index.ts#L92-L122}
   * {@link https://github.com/BackburnerJS/backburner.js/blob/v2.7.0/lib/index.ts#L35-L74}
   */
  throttle(
    method: (...args: any[]) => any,
    spacing: number,
    immediate?: boolean
  ): EmberRunTimer;
  throttle<T extends (...args: any[]) => any>(
    method: T,
    ...params: [...args: Parameters<T>, spacing: number, immediate?: boolean]
  ): EmberRunTimer;
  throttle<Target, T extends (this: Target, ...args: any[]) => any>(
    target: Target,
    method: T,
    ...params: [...args: Parameters<T>, spacing: number, immediate?: boolean]
  ): EmberRunTimer;
  throttle<
    Target,
    MethodName extends ConditionalKeys<
      Target,
      (this: Target, ...args: any[]) => any
    >
  >(
    target: Target,
    method: MethodName,
    ...params: [
      ...args: Parameters<Target[MethodName]>,
      spacing: number,
      immediate?: boolean
    ]
  ): EmberRunTimer;

  queues: EmberRunQueues[];
}

export const run: RunNamespace;
export const join: typeof run.join;
export const bind: typeof run.bind;

export const begin: typeof run.begin;
export const end: typeof run.end;
export const cancel: typeof run.cancel;

export const schedule: typeof run.schedule;
export const scheduleOnce: typeof run.scheduleOnce;
export const once: typeof run.once;

export const later: typeof run.later;
export const next: typeof run.next;

export const debounce: typeof run.debounce;
export const throttle: typeof run.throttle;
