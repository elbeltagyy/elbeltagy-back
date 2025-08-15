const axios = require('axios');
const dotenv = require("dotenv");
dotenv.config()


async function getAuthToken() { //1st step for create token for user
    const response = await axios.post('https://accept.paymob.com/api/auth/tokens', {
        api_key: process.env.PAYMOB_API_KEY
    });
    return response.data.token;
}


async function createOrder(token, amountCents, items = [], data = {}) {
    const response = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
        auth_token: token,
        delivery_needed: false,
        amount_cents: amountCents, // e.g. 1000 = 10.00 EGP
        currency: "EGP",
        items, data
    });
    return response.data.id;
}

async function generatePaymentKey(token, amountCents, orderId, billingData) {
    const response = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
        auth_token: token,
        amount_cents: amountCents,
        integration_id: parseInt(process.env.PAYMOB_INTEGRATION_ID), // Card, Wallet, etc.

        expiration: 3600,
        order_id: orderId,
        billing_data: billingData,
        currency: "EGP",
        lock_order_when_paid: true
    });
    return response.data.token;
}
const iframeURL = (paymentToken) => {
    return `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;//
}

// Utility to verify HMAC
function verifyHmac(data, receivedHmac) {
    const keys = [
        'amount_cents',
        'created_at',
        'currency',
        'error_occured',
        'has_parent_transaction',
        'id',
        'integration_id',
        'is_3d_secure',
        'is_auth',
        'is_capture',
        'is_refunded',
        'is_standalone_payment',
        'is_voided',
        'order',
        'owner',
        'pending',
        'source_data.pan',
        'source_data.sub_type',
        'source_data.type',
        'success'
    ];

    const flattened = keys.map(key => {
        const parts = key.split('.');
        let value = data;

        for (let part of parts) {
            value = value ? value[part] : '';
        }

        return value ?? '';
    });

    const joined = flattened.join('');
    const hmac = crypto
        .createHmac('sha512', PAYMOB_HMAC_SECRET)
        .update(joined)
        .digest('hex');

    return hmac === receivedHmac;
}

module.exports = {
    getAuthToken, createOrder, generatePaymentKey, iframeURL
}


const billingData = {
    apartment: "NA",
    email: "customer@example.com",
    floor: "NA",
    first_name: "Mahmoud",
    street: "NA",
    building: "NA",
    phone_number: "+201234567890",
    shipping_method: "NA",
    postal_code: "NA",
    city: "Cairo",
    country: "EG",
    last_name: "Elawady",
    state: "Cairo"
};