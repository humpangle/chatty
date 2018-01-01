import Immutable from 'seamless-immutable';
import { Reducer } from 'redux';
import { AuthType, initialAuth } from '../graphql/types.query';
import { NavigationState } from 'react-navigation';

export enum ActionTypeKeys {
  SET_CURRENT_USER = 'SET_CURRENT_USER',
  LOGOUT = 'LOGOUT',
  REHYDRATE = 'persist/REHYDRATE',
  OTHER_ACTION = '__@chatty_any_other_action__',
}

export interface SetCurrentUserAction {
  type: ActionTypeKeys.SET_CURRENT_USER;
  user: AuthType;
}

export interface LogoutAction {
  type: ActionTypeKeys.LOGOUT;
}

export interface RehydrateAction {
  type: ActionTypeKeys.REHYDRATE;
  payload?: {
    auth: State;
  };
}

export type ActionType = SetCurrentUserAction | RehydrateAction | LogoutAction;

export type State = AuthType;

export type AuthState = Immutable.ImmutableObject<State>;

export interface ReduxState {
  auth: AuthState;
  nav: NavigationState;
}

const initialState: AuthState = Immutable<State>(initialAuth);

const auth: Reducer<AuthState> = (state = initialState, action: ActionType) => {
  switch (action.type) {
    case ActionTypeKeys.REHYDRATE:
      return Immutable((action.payload && action.payload.auth) || state);

    case ActionTypeKeys.SET_CURRENT_USER:
      return state.merge(action.user);

    case ActionTypeKeys.LOGOUT:
      return initialState;

    default:
      return state;
  }
};

export default auth;

export const getUser = (state: ReduxState) => state.auth;
