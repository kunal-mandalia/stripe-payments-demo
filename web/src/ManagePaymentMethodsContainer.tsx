
import React from 'react';
import { Elements } from 'react-stripe-elements';

import InjectedManagePaymentMethodsForm from './ManagePaymentMethods';

class Container extends React.Component {
  render() {
    return (
      <Elements>
        <InjectedManagePaymentMethodsForm />
      </Elements>
    );
  }
}

export default Container;