import React, { FormEvent, useState, useEffect, useContext } from 'react';
import { injectStripe, ReactStripeElements } from 'react-stripe-elements';

import CardSection from './CardSection';
import { API_URL } from './config';
import { UserContext, User } from './UserContext';

import './App.css';
import { PaymentMethod } from './ManagePaymentMethods';
import { Link } from 'react-router-dom';

interface IProps extends ReactStripeElements.InjectedStripeProps { }

export type Status = 'idle' | 'loading' | 'success' | 'error';

interface CheckoutAsUserProps {
  handleSubmit: (evt: FormEvent<Element>) => void;
  paymentMethod: PaymentMethod,
  status: Status,
}

interface NewCardProps {
  handleSubmit: (evt: FormEvent<Element>) => void;
  setEmail?: (email: string) => void;
  email?: string,
  status: Status,
}

export interface ConfirmPaymentButtonProps {
  status: Status
}

export function ConfirmPaymentButton({ status }: ConfirmPaymentButtonProps) {
  if (status === 'idle') {
    return <button className='confirm-payment idle' type='submit'>Confirm</button>
  }
  if (status === 'loading') {
    return <button className='confirm-payment loading' disabled onClick={() => { }}>Processing...</button>
  }
  if (status === 'success') {
    return <button className='confirm-payment success' disabled onClick={() => { }}>Success</button>
  }
  if (status === 'error') {
    return <button className='confirm-payment error' disabled onClick={() => { }}>Something Went Wrong</button>
  }
  return null;
}

export function NewCard({ handleSubmit, status, email, setEmail }: NewCardProps) {
  return <form onSubmit={handleSubmit} className={status === 'idle' ? 'idle' : 'busy'}>
    {setEmail &&
      <input
        disabled={status !== 'idle'}
        className='text-input'
        required
        type='email'
        onChange={(e) => { setEmail(e.target.value) }}
        value={email}
        placeholder='Email'
      />
    }
    <CardSection disabled={status !== 'idle'} />
    <ConfirmPaymentButton status={status} />
  </form>
}

function CheckoutAsUser({ handleSubmit, status, paymentMethod }: CheckoutAsUserProps) {
  return (
    <form onSubmit={handleSubmit}>
      <p className='checkout-description'>Pay using {paymentMethod.card!.brand} / {paymentMethod.card!.last4} or <Link to='manage-cards'>change card</Link></p>
      <ConfirmPaymentButton status={status} />
    </ form>
  )
}

function Checkout(props: IProps) {
  const { user, loading, error, setUser } = useContext(UserContext);
  const [clientSecret, setClientSecret] = useState<null | string>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [email, setEmail] = useState('');
  const [widgetPrice, setWidgetPrice] = useState<undefined | number>(undefined);

  const getPaymentMethod = (user: User) => {
    if (user.paymentMethods.length === 0) return undefined;
    if (user.paymentMethods.length === 1) return user.paymentMethods[0];
    if (user.customer.metadata.default_payment_method) {
      const defaultPm = user.paymentMethods.find(pm => pm.id === user.customer.metadata.default_payment_method);
      if (defaultPm) return defaultPm;
    }
    return user.paymentMethods.reduce((latestPm, currentPm) => {
      return (currentPm.created > latestPm!.created) ? currentPm : latestPm;
    })
  }

  useEffect(() => {
    fetch(`${API_URL}/widgetprice`, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => res.json())
      .then(({ price }) => {
        setWidgetPrice(price / 100);
      })
  })

  useEffect(() => {
    fetch(`${API_URL}/paymentintent`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerId: (user && user.customer && user.customer.id) ? user.customer.id : undefined,
        paymentMethodId: user && user.paymentMethods && user.paymentMethods.length > 0 ? getPaymentMethod(user)!.id : undefined
      })
    })
      .then(res => res.json())
      .then(({ paymentIntent }) => {
        setClientSecret(paymentIntent.client_secret);
      })
  }, [user])

  const pay = (ev: FormEvent) => {
    ev.preventDefault();
    setStatus('loading');
    // @ts-ignore
    props.stripe!.confirmCardPayment(clientSecret!, {
      payment_method: getPaymentMethod(user!)!.id
    })
      .then((res: any) => {
        if (res.error) {
          setStatus('error');
        } else {
          setStatus('success');
        }
      })
      .catch((e: any) => {
        setStatus('error');
      })
  }

  const setupCard = (ev: FormEvent) => {
    ev.preventDefault();
    setStatus('loading');

    // @ts-ignore
    const cardElement = props.elements.getElement('card');

    // @ts-ignore
    props.stripe!.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          email
        }
      },
      setup_future_usage: 'on_session'
    })
      .then((res: any) => {
        if (res.error) {
          setStatus('error');
        } else {
          const paymentMethodId = res.paymentIntent.payment_method;
          // TODO: handle server side
          if (user) {
            // attach payment method to existing customer
            return fetch(`${API_URL}/paymentmethod/${user.customer.id}/${paymentMethodId}`, {
              method: 'post',
              headers: {
                'Content-Type': 'application/json'
              },
            })
              .then((res: any) => res.json())
              .then((data: any) => {
                setUser(data);
                setStatus('success');
              })
          } else {
            // new customer
            return fetch(`${API_URL}/customer`, {
              method: 'post',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                email,
                paymentMethodId
              })
            })
              .then((res: any) => res.json())
              .then((data: any) => {
                setUser(data);
                setStatus('success');
              })
          }
        }
      })
      .catch((e: any) => {
        setStatus('error');
      })
  }

  if (loading) {
    return <div><h1>Loading</h1></div>
  }

  if (error) {
    return <div><h1>Error</h1></div>
  }

  const hasPaymentMethod = user && user.paymentMethods && user.paymentMethods.length > 0;

  return (
    <div>
      <h2>Purchase widget for £{widgetPrice}</h2>
      {hasPaymentMethod ?
        <CheckoutAsUser
          status={status}
          handleSubmit={pay}
          paymentMethod={getPaymentMethod(user!)!}
        />
        : <NewCard status={status} handleSubmit={setupCard} email={email} setEmail={setEmail} />}
    </div>
  )
}

export default injectStripe(Checkout);