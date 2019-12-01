import React from 'react';
import { StripeProvider } from 'react-stripe-elements';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from 'react-router-dom';

import Checkout from './CheckoutContainer';
import ImpersonateCustomer from './ImpersonateCustomer';
import { UserContextProvider } from './UserContext';
import Layout from './Layout';

import './App.css';
import ManagePaymentMethods from './ManagePaymentMethodsContainer';
import { STRIPE_PUBLISHABLE_KEY } from './config';

const App = () => {
  if (!STRIPE_PUBLISHABLE_KEY) {
    throw new Error(`Missing stripe publishable key`);
  }

  return (
    <UserContextProvider>
      <StripeProvider apiKey={STRIPE_PUBLISHABLE_KEY} >
        <Router>
          <div>
            <nav className='nav'>
              <ul>
                <li>
                  <Link to="/checkout">Checkout</Link>
                </li>
                <li>
                  <Link to="/manage-cards">Manage Card</Link>
                </li>
                <li id='impersonate-user'>
                  <ImpersonateCustomer />
                </li>
              </ul>
            </nav>
            <Layout>
              <Switch>
                <Route path="/checkout">
                  <Checkout />
                </Route>
                <Route path="/manage-cards">
                  <ManagePaymentMethods />
                </Route>
                <Route path="/">
                  <Checkout />
                </Route>
              </Switch>
            </Layout>
          </div>
        </Router>
      </StripeProvider>
    </UserContextProvider>
  );
};

export default App;
