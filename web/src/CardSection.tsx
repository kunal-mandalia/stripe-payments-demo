/**
* Use the CSS tab above to style your Element's container.
*/
import React from 'react';
import { CardElement } from 'react-stripe-elements';

const style = {
  base: {
    color: "#fff",
    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
    fontSmoothing: "antialiased",
    fontSize: "16px",
    padding: '10px',
    "::placeholder": {
      color: "#aab7c4"
    }
  },
  invalid: {
    color: "#fa755a",
    iconColor: "#fa755a"
  }
};

const cardElementStyle = {
  border: 'solid 2px #a5a5a5',
  padding: '10px'
}

interface CardSectionProps {
  disabled: boolean | undefined;
}

const CardSection = ({ disabled }: CardSectionProps) => {
  return (
    <label>
      <div style={cardElementStyle}>
        <CardElement disabled={disabled} className='MyCardElement' style={style} />
      </div>
    </label>
  );
};

export default CardSection;