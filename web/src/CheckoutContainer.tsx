
import React from 'react';
import { Elements } from 'react-stripe-elements';

import InjectedCheckoutForm from './CheckoutForm';

class Container extends React.Component {
  render() {
    return (
      <Elements>
        <InjectedCheckoutForm />
      </Elements>
    );
  }
}

export default Container;