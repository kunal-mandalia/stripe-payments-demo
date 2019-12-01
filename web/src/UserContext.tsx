import React, { useState } from 'react';
import { PaymentMethod } from './ManagePaymentMethods';

export type User = {
  customer: {
    id: string,
    email: string,
    metadata: {
      default_payment_method?: string,
    }
  },
  paymentMethods: PaymentMethod[]
}

interface IUserContext {
  user: User | undefined,
  loading: boolean,
  error: boolean,
  setUser: Function,
  setLoading: Function,
  setError: Function,
}

const noop = () => { };
const initialState = {
  user: undefined,
  loading: false,
  error: false,
  setLoading: noop,
  setError: noop,
  setUser: noop
}

export const UserContext = React.createContext<IUserContext>(initialState);

interface IProps {
  children: React.ReactChild | React.ReactChildren | React.ReactElement[]
}

export function UserContextProvider({ children }: IProps) {
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const value = { user, loading, error, setUser, setLoading, setError };
  // @ts-ignore
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const UserContextConsumer = UserContext.Consumer;
