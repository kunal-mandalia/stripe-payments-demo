# stripe-payments-demo

## Demo
![App demo](/stripe-payments-demo.gif)

## Run locally
###  web
1. Configure environment variables in `./web/src/config.ts`
2. Run using `npm run start:web`

### api
1. Configure environment variables in `./api/.env`
2. Run using `npm run start:api`


## Scenarios covered
A. As a new customer I would like to purchase a product

B. As a returning customer I would like to purchase a product without the hassle of providing card details everytime
  1. if my card has expired then I would like to update it

C. As an existing customer I would like to manage cards held on file
  1. remove existing cards
  2. add new payment method
