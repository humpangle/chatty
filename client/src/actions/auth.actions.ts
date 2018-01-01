import { client, wsClient } from '../App';
import {
  SetCurrentUserAction,
  LogoutAction,
  ActionTypeKeys,
} from '../reducers/auth.reducer';
import { AuthType } from '../graphql/types.query';

export const setCurrentUser = (user: AuthType): SetCurrentUserAction => ({
  user,
  type: ActionTypeKeys.SET_CURRENT_USER,
});

export type SetCurrentUserActionFunc = (user: AuthType) => SetCurrentUserAction;

export const logout = (): LogoutAction => {
  client.resetStore();
  wsClient.unsubscribeAll();
  wsClient.close();
  return {
    type: ActionTypeKeys.LOGOUT,
  };
};

export type LogoutActionFunc = () => LogoutAction;
