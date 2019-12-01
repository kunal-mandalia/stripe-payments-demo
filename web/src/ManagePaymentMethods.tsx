import React, { useContext, useEffect, useState, FormEvent } from 'react';
import { UserContext } from './UserContext';
import { API_URL } from './config';
import { NewCard, Status } from './CheckoutForm';
import { injectStripe, ReactStripeElements } from 'react-stripe-elements';

interface AddPaymentMethodProps {
  handleSubmit: (evt: FormEvent<Element>) => void;
  status: Status,
}

function AddPaymentMethod(props: AddPaymentMethodProps) {
  return <div>
    <h5>Add payment method</h5>
    <NewCard {...props} />
  </div>
}

type Card = {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

export type PaymentMethod = {
  id: string;
  created: number;
  card?: Card
}

interface IPaymentMethodList {
  defaultPaymentMethodId?: string,
  paymentMethods: PaymentMethod[],
  remove: (id: string) => Promise<void>
  setDefault: (id: string) => Promise<void>
}

/**
 * actions: remove, set default payment method
 */
function PaymentMethodList({ paymentMethods, remove, setDefault, defaultPaymentMethodId }: IPaymentMethodList) {
  return <div className='paymentmethod-list'>
    {paymentMethods.map(p => {
      return (
        <div className='paymentmethod' key={p.id}>
          <span className='description'>{p.card!.brand} / {p.card!.last4} <span className='expiry'>(expiry: {p.card!.exp_month} / {p.card!.exp_year})</span></span>
          <span className='actions'>
            <button onClick={() => { remove(p.id) }}>Remove</button>
            <button
              disabled={defaultPaymentMethodId === p.id}
              onClick={() => { setDefault(p.id) }}
            >Set default</button>
          </span>
        </div>
      )
    })}
  </div>
}

interface IProps extends ReactStripeElements.InjectedStripeProps { }

function ManagePaymentMethods(props: IProps) {
  const { user, setUser } = useContext(UserContext);
  // TODO: use paymentMethods from user
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [clientSecret, setClientSecret] = useState<null | string>(null);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    fetch(`${API_URL}/paymentintent`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerId: user ? user.customer.id : undefined,
      })
    })
      .then(res => res.json())
      .then(({ paymentIntent }) => {
        setClientSecret(paymentIntent.client_secret);
      })
  }, [user])

  const removePaymentMethod = async (id: string) => {
    await fetch(`${API_URL}/paymentmethod/${id}`, {
      method: 'delete',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const updatedPaymentMethods = paymentMethods.filter(p => p.id !== id);
    setPaymentMethods(updatedPaymentMethods);
    setUser({
      ...user,
      paymentMethods: updatedPaymentMethods
    })
  }

  const addPaymentMethod = async () => {
    if ((clientSecret === null) || !props.stripe || !user) throw new Error(`Expected clientSecret and Stripe to be available`);
    try {
      const res = await props.stripe.createPaymentMethod('card');
      if (res.error || !res.paymentMethod) {
        return setStatus('error');
      }
      const response = await fetch(`${API_URL}/paymentmethod/${user.customer.id}/${res.paymentMethod.id}`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const updatedUser = await response.json();
      setPaymentMethods([...paymentMethods, res.paymentMethod]);
      setUser(updatedUser);
      return setStatus('success');
    } catch (error) {
      return setStatus('error');
    }
  }

  const setDefaultPaymentMethod = async (paymentMethodId: string) => {
    if ((clientSecret === null) || !props.stripe || !user) throw new Error(`Expected clientSecret and Stripe to be available`);
    try {
      const response = await fetch(`${API_URL}/defaultpaymentmethod/${user.customer.id}/${paymentMethodId}`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const updatedUser = await response.json();
      setPaymentMethods([...updatedUser.paymentMethods]);
      setUser(updatedUser);
    } catch (error) {

    }
  }

  useEffect(() => {
    if (user) {
      fetch(`${API_URL}/paymentmethods?customerId=${user.customer.id}`, {
        method: 'get',
      })
        .then(res => res.json())
        .then(({ paymentMethods }) => {
          setPaymentMethods(paymentMethods);
        })
    }
  }, [user]);

  return (
    <div>
      <h2>Manage payment methods</h2>
      {user && <PaymentMethodList
        defaultPaymentMethodId={user.customer.metadata.default_payment_method}
        paymentMethods={paymentMethods}
        remove={removePaymentMethod}
        setDefault={setDefaultPaymentMethod}
      />}
      <AddPaymentMethod
        handleSubmit={(e: FormEvent<Element>) => { e.preventDefault(); addPaymentMethod(); }}
        status={status}
      />
    </div>
  )
}

export default injectStripe(ManagePaymentMethods);
