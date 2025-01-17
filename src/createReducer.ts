import createNextState, { Draft } from 'immer'
import { AnyAction, Action, Reducer } from 'redux'

/**
 * Defines a mapping from action types to corresponding action object shapes.
 */
export type Actions<T extends keyof any = string> = Record<T, Action>

/**
 * An *case reducer* is a reducer function for a specific action type. Case
 * reducers can be composed to full reducers using `createReducer()`.
 *
 * Unlike a normal Redux reducer, a case reducer is never called with an
 * `undefined` state to determine the initial state. Instead, the initial
 * state is explicitly specified as an argument to `createReducer()`.
 *
 * In addition, a case reducer can choose to mutate the passed-in `state`
 * value directly instead of returning a new state. This does not actually
 * cause the store state to be mutated directly; instead, thanks to
 * [immer](https://github.com/mweststrate/immer), the mutations are
 * translated to copy operations that result in a new state.
 */
export type CaseReducer<S = any, A extends Action = AnyAction> = (
  state: Draft<S>,
  action: A
) => S | void

/**
 * A mapping from action types to case reducers for `createReducer()`.
 */
export type CaseReducers<S, AS extends Actions> = {
  [T in keyof AS]: AS[T] extends Action ? CaseReducer<S, AS[T]> : void
}

/**
 * A utility function that allows defining a reducer as a mapping from action
 * type to *case reducer* functions that handle these action types. The
 * reducer's initial state is passed as the first argument.
 *
 * The body of every case reducer is implicitly wrapped with a call to
 * `produce()` from the [immer](https://github.com/mweststrate/immer) library.
 * This means that rather than returning a new state object, you can also
 * mutate the passed-in state object directly; these mutations will then be
 * automatically and efficiently translated into copies, giving you both
 * convenience and immutability.
 *
 * @param initialState The initial state to be returned by the reducer.
 * @param actionsMap A mapping from action types to action-type-specific
 *   case reducers.
 */
export function createReducer<
  S,
  CR extends CaseReducers<S, any> = CaseReducers<S, any>
>(initialState: S, actionsMap: CR): Reducer<S> {
  return function(state = initialState, action): S {
    // @ts-ignore createNextState() produces an Immutable<Draft<S>> rather
    // than an Immutable<S>, and TypeScript cannot find out how to reconcile
    // these two types.
    return createNextState(state, (draft: Draft<S>) => {
      const caseReducer = actionsMap[action.type]
      return caseReducer ? caseReducer(draft, action) : undefined
    })
  }
}
