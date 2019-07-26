import { isFunction, isThenable } from './utils';
import { State } from './state';

interface Handler<T, U> {
  onFulfilled: OnFulfilled<T, U>;
  onRejected: OnRejected<U>;
}

type OnFulfilled<T, U = any> = (value: T) => U | Thenable<U>;
type OnRejected<U = any> = (reason: any) => U | Thenable<U>;
type OnFinally<U> = () => U | Thenable<U>;

interface Thenable<T> {
  then<U>(
    onFulfilled?: OnFulfilled<T, U>,
    onRejected?: OnRejected<U>,
  ): Thenable<U>;
  then<U>(
    onFulfilled?: OnFulfilled<T, U>,
    onRejected?: (reason: any) => void,
  ): Thenable<U>;
}

type Resolve<R> = (value?: R | Thenable<R>) => void;
type Reject = (value?: any) => void;
type Executor<T> = (resolve: Resolve<T>, reject: Reject) => void;

export class TypedPromise<T> {
  public static resolve<U = any>(value?: U | Thenable<U>): TypedPromise<U> {
    return new TypedPromise<U>(resolve => resolve(value));
  }

  public static reject<U>(reason?: any): TypedPromise<U> {
    return new TypedPromise<U>((_, reject) => reject(reason));
  }

  public static all<U = any>(
    iterable: Array<U | Thenable<U>>,
  ): TypedPromise<U[]> {
    return new TypedPromise((resolve, reject) => {
      if (!Array.isArray(iterable)) {
        return reject(new TypeError('An iterable must be provided.'));
      }

      let counter = iterable.length;
      const result: U[] = [];

      iterable.forEach((item, index) => {
        TypedPromise.resolve(item)
          .then(value => {
            result[index] = value;
            counter -= 1;
            if (counter === 0) {
              resolve(result);
            }
          })
          .catch(reject);
      });
    });
  }

  public static race<U = any>(
    iterable: Array<U | Thenable<U>>,
  ): TypedPromise<U> {
    return new TypedPromise<U>((resolve, reject) => {
      if (!Array.isArray(iterable)) {
        return reject(new TypeError('An iterable must be provided.'));
      }

      iterable.forEach(value => {
        TypedPromise.resolve(value).then(resolve, reject);
      });
    });
  }

  private state: State = State.Pending;
  private handlers: Array<Handler<T, any>> = [];
  private value: T | any;

  constructor(executor: Executor<T>) {
    try {
      executor(this.fulfill, this.reject);
    } catch (e) {
      this.reject(e);
    }
  }

  public then<U>(
    onFulfilled?: OnFulfilled<T, U>,
    onRejected?: OnRejected<U>,
  ): TypedPromise<T | U> {
    return new TypedPromise<U | T>((resolve, reject) => {
      return this.attachHandler({
        onFulfilled: result => {
          if (!isFunction(onFulfilled)) {
            return resolve(result);
          } else {
            try {
              return resolve(onFulfilled(result));
            } catch (error) {
              return reject(error);
            }
          }
        },
        onRejected: reason => {
          if (!isFunction(onRejected)) {
            return reject(reason);
          } else {
            try {
              return resolve(onRejected(reason));
            } catch (error) {
              return reject(error);
            }
          }
        },
      });
    });
  }

  public catch<U>(onRejected: OnRejected<U>): TypedPromise<T | U> {
    return this.then<U>(null, onRejected);
  }

  public finally<U>(onFinally: OnFinally<U>) {
    return this.then(
      (value: T) => {
        return TypedPromise.resolve(onFinally()).then<unknown>(() => value);
      },
      (reason: any) => {
        return TypedPromise.resolve(onFinally()).then(() => {
          throw reason;
        });
      },
    );
  }

  private fulfill = (value: T): void => {
    this.setValueAndState(value, State.Fulfilled);
  };

  private reject = (reason: any): void => {
    this.setValueAndState(reason, State.Rejected);
  };

  private setValueAndState = (value: T | any, state: State) => {
    const set = () => {
      if (this.state !== State.Pending) {
        return null;
      }

      if (isThenable(value)) {
        return (value as Thenable<T>).then(this.fulfill, this.reject);
      }

      this.value = value;
      this.state = state;

      this.executeHandlers();
    };

    setTimeout(set);
    // queueMicrotask(set);
  };

  private executeHandlers = (): void | null => {
    if (this.state === State.Pending) {
      return null;
    }

    this.handlers.forEach(handler => {
      if (this.state === State.Rejected) {
        handler.onRejected(this.value);
      } else {
        handler.onFulfilled(this.value);
      }
    });

    this.handlers = [];
  };

  private attachHandler = (handler: Handler<T, any>): void => {
    this.handlers = [...this.handlers, handler];
    this.executeHandlers();
  };
}
