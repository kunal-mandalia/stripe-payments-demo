import * as express from 'express';
import * as Stripe from 'stripe';
import * as bodyParser from 'body-parser';

require('dotenv').config();

const app = express();
const port = 3030;
console.log('process.env.STRIPE_SECRET_KEY', process.env.STRIPE_SECRET_KEY)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function calculateProductPrice() {
  return 2500;
}

async function getCustomerWithPaymentMethods(customerId: string) {
  const customer = await stripe.customers.retrieve(customerId);
  if (!customer) {
    throw new Error(`Customer not found`);
  }

  const paymentMethods = await stripe.paymentMethods.list({
    customer: customer.id,
    type: 'card'
  })

  return {
    customer,
    paymentMethods: paymentMethods.data
  }
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With')
  next();
});

app.use(bodyParser.json());

app.get('/widgetprice', (req, res) => {
  return res.status(200).json({ price: calculateProductPrice() });
})

app.post('/setupintent', async (req, res) => {
  const setupIntent = await stripe.setupIntents.create({
    usage: 'on_session', // The default usage is off_session
  });
  return res.status(200).json({ setupIntent });
})

app.post('/paymentintent', async (req, res) => {
  const { customerId, paymentMethodId } = req.body;

  let withPaymentMethod = {};

  if (customerId && paymentMethodId) {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (paymentMethod.customer !== customerId) {
      return res.status(400).json({ error: `Unexpected customer associated with payment method` });
    }

    withPaymentMethod = {
      setup_future_usage: 'on_session',
      payment_method: paymentMethodId,
      payment_method_types: ['card'],
      customer: customerId,
      off_session: false
    }
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateProductPrice(),
    currency: 'gbp',
    ...withPaymentMethod
  });
  return res.json({ paymentIntent });
})

app.get('/customers', async (req, res) => {
  const customers = await stripe.customers.list();
  return res.json({ customers });
})

app.get('/customer/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await getCustomerWithPaymentMethods(id);
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
})

/**
 * Create customer with an associated payment method (card)
 */
app.post('/customer', async (req, res) => {
  const { email, paymentMethodId } = req.body;
  try {
    const customer = await stripe.customers.create({
      email,
      payment_method: paymentMethodId,
      metadata: {
        default_payment_method: paymentMethodId
      }
    });
    const user = await getCustomerWithPaymentMethods(customer.id);
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
})

app.get('/paymentmethods', async (req, res) => {
  const { customerId } = req.query;
  if (!customerId) res.status(400).json({ error: `Expected customerId but received ${customerId}` });
  try {
    const { data } = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    return res.status(200).json({
      paymentMethods: data
    });
  } catch (error) {
    return res.status(500).json({ error });
  }
});

app.delete('/paymentmethod/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: `Expected id but received ${id}` });

  try {
    const data = await stripe.paymentMethods.detach(id);
    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
})

/**
 * attach payment method to customer
 */
app.post('/paymentmethod/:customerId/:paymentMethodId', async (req, res) => {
  const { customerId, paymentMethodId } = req.params;
  if (!customerId || !paymentMethodId) return res.status(400).json({ error: `Expected customerId and paymentMethodId but got ${customerId}, ${paymentMethodId}` });

  try {
    await stripe.paymentMethods.attach(
      paymentMethodId,
      { customer: customerId }
    );
    await stripe.customers.update(customerId, {
      metadata: {
        default_payment_method: paymentMethodId
      }
    });
    const user = await getCustomerWithPaymentMethods(customerId);
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
})

/**
 * Set a default payment method
 * This isn't part of stripe's api OOTB as we use metadata on customer to associate the
 * payment method at the customer level
 */
app.post('/defaultpaymentmethod/:customerId/:paymentMethodId', async (req, res) => {
  const { customerId, paymentMethodId } = req.params;
  if (!customerId || !paymentMethodId) return res.status(400).json({ error: `Missing customer id or payment method id` });

  const customer = await stripe.customers.retrieve(customerId);
  if (!customer) return res.status(400).json({ error: `Customer ${customerId} not found` });

  if (customer.metadata.default_payment_method === paymentMethodId) return res.status(400).json({ error: `Payment method unchanged` });

  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  if (!paymentMethod) return res.status(400).json({ error: `Payment method ${paymentMethodId} not found` });

  const result = await stripe.customers.update(customerId, {
    metadata: {
      default_payment_method: paymentMethodId
    }
  });
  const user = await getCustomerWithPaymentMethods(result.id);
  return res.status(200).json(user);
})

app.listen(port, () => {
  console.log(`API running on port ${port}`)
})
