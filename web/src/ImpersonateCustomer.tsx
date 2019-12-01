import React, { useEffect, useState, useContext } from 'react';
import { API_URL } from './config';
import { UserContext } from './UserContext';
import { PaymentMethod } from './ManagePaymentMethods';

interface Customer {
  id: string,
  email: string,
}

type CustomerDetails = {
  customer: Customer,
  paymentMethods: PaymentMethod[]
}

function ImpersonateCustomer() {
  const { user, setUser, setLoading, setError } = useContext(UserContext);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const handleSelectUser = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!event.target.value) {
      setUser(undefined);
      return;
    }

    setLoading(true);
    const customerId = event.target.value;
    fetch(`${API_URL}/customer/${customerId}`, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => res.json())
      .then(user => {
        setUser(user);
        setLoading(false);
      }).catch(e => {
        setError(true);
      })
  }

  useEffect(() => {
    fetch(`${API_URL}/customers`)
      .then(res => res.json())
      .then(({ customers: { data } }) => {
        setCustomers(data);
      })
  }, [])

  return <select
    value={user && user.customer && user.customer.id}
    onChange={handleSelectUser}>
    <option value={''}>Select a user to impersonate</option>
    {customers.map(c => <option key={c.id} value={c.id}>{c.email}</option>)}
  </select>
}

export default ImpersonateCustomer
