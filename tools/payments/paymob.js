const axios = require('axios');
const dotenv = require("dotenv");
const crypto = require('crypto')
dotenv.config()

// const userInfo = {
//     first_name: user.name.split(' ')[0],
//     last_name: user.name.split(' ')[2],
//     email: user.email,
//     phone: user.phone,
//     state: governments.find(i => i.id === user.government)?.governorate_name_ar || 'المنصوره',
//     items: [item]
// }


async function makeNewPaymob({ price, userInfo, successUrl }, payment) { //1st step for create token for user
    try {
        const billingData = {
            apartment: 'Na',
            email: userInfo.email,
            first_name: userInfo.first_name,
            last_name: userInfo.last_name,

            phone_number: userInfo.phone,
            floor: "NA",
            street: "NA",
            building: "NA",
            shipping_method: "NA",
            postal_code: "NA",
            city: userInfo.state,
            country: "EG",
            state: userInfo.state,
        }

        var raw = {
            amount: price,
            redirection_url: successUrl, //ref to Course
            currency: "EGP",
            payment_methods: payment.paymobIntegrationIds || [
                Number(process.env.PAYMOB_INTEGRATION_ID),
                Number(process.env.PAYMOB_INTEGRATION_WALLET),
                // Number(process.env.PAYMOB_INTEGRATION_KIOSK),
            ],
            items: (userInfo.items?.length > 0) ? userInfo.items.map(i => ({
                name: i.name,
                amount: i.amount * 100,
                quantity: i.quantity || 1
            })) : [],
            billing_data: billingData,
            customer: billingData,
            // "extras": {
            //     "ee": 22
            // }
        }

        const response = await axios.post('https://accept.paymob.com/v1/intention/', raw, {
            headers: {
                Authorization: "Token " + process.env.PAYMOB_SECRET_KEY,
                "Content-Type": "application/json",
            },
        });
        // console.log('intention_order_id ==>', response.data.intention_order_id)
        // console.log('response ==>', response.data)
        return {
            orderId: response.data.intention_order_id, url: 'https://accept.paymob.com/unifiedcheckout/?publicKey=' + process.env.PAYMOB_PUBLIC_KEY +
                '&clientSecret=' + response.data.client_secret
        }
    } catch (error) {
        console.log(error.response.data);
        console.log('error from new==>', error.message)
        throw error
    }
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
        .createHmac('sha512', process.env.PAYMOB_HMAC_SECRET)
        .update(joined)
        .digest('hex');

    return hmac === receivedHmac;
}

module.exports = {
    makeNewPaymob, verifyHmac
}
