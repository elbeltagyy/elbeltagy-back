// backend/paymentMethods.js
const axios = require('axios')
const dotenv = require("dotenv");
const createError = require('../createError');
const { FAILED } = require('../statusTexts');
dotenv.config()

async function getPaymentMethods() {
    try {
        const res = await axios.get(
            `${process.env.FAWATERK_BASE}/getPaymentmethods`,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.FAWATERK_TOKEN}`,
                },
            }
        );

        return res.data; // list of payment methods
    } catch (error) {
        console.error("Error fetching payment methods", error.message);
        throw error;
    }
}

//Cancel delete in PaymentPage.jsx
async function createFawaterkTransaction(invoice, payment) {
    try {
        //2 => Visa, 3= Fawry, 4= MobileWallet as fawaterkPaymentId in PyemntModel
        // type = fawaterk
        const userInfo = invoice.userInfo || {}

        const fawaterkBillingBody = {
            payment_method_id: payment.fawaterkPaymentId,
            cartTotal: invoice.price,
            currency: "EGP",
            customer: {
                first_name: userInfo.first_name,
                last_name: userInfo.last_name,
                email: userInfo.email,
                phone: userInfo.phone,
                address: userInfo.state
            },
            redirectionUrls: {
                successUrl: invoice.successUrl,
                failUrl: invoice.successUrl,
                pendingUrl: invoice.successUrl
            },
            cartItems: userInfo.items?.map(i => ({
                name: i.name,
                price: i.amount,
                quantity: i.quantity || 1
            })) || []
        }

        const res = await axios.post(
            `${process.env.FAWATERK_BASE}/invoiceInitPay`,
            fawaterkBillingBody,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.FAWATERK_TOKEN}`,
                },
            }
        );

        const data = res.data.data
        const obj = {
            url: data.payment_data.redirectTo,//Visa

            fawryCode: data.payment_data.fawryCode,

            meezaReference: data.payment_data.meezaReference,
            meezaQrCode: data.payment_data.meezaQrCode
        }
        const hasValidValue = Object.values(obj).some(
            (value) => value !== null && value !== undefined && value !== ""
        );

        if (data.payment_data.error) {
            throw createError('Error creating transaction: ' + data.payment_data.error, 400, FAILED)
        }

        if (!hasValidValue) {
            throw createError('Error creating transaction: No valid payment data received', 400, FAILED)
        }
        return {
            orderId: data.invoice_id, invoice_key: data.invoice_key,
            expireDate: data.payment_data.expireDate,
            ...obj
        };
    } catch (error) {
        console.error("Error creating transaction", error.response?.data || error.message);
        throw createError('Error creating transaction: ' + (error.response?.data?.message || error.message), 400, FAILED);
    }
}


//Resps in Transaction
// { ############## VISA
//     "status": "success",
//     "data": {
//         "invoice_id": 1000428,
//         "invoice_key": "hyU2vcy3USvT5Tg",
//         "payment_data": {
//             "redirectTo": "https://staging.fawaterk.com/link/I0PAH"
//         }
//     }
// }

// {  ############## FAWRY
//     "status": "success",
//     "data": {
//         "invoice_id": 1000425,
//         "invoice_key": "QqgdnAB7Ad2kmIq",
//         "payment_data": {
//             "fawryCode": "981335305",
//             "expireDate": "2021-07-06 15:53:41"
//         }
//     }
// }

// {  ############## MobileWallet 
//     "status": "success",
//     "data": {
//         "invoice_id": 1000427,
//         "invoice_key": "2vX8jSkmqbwJ4Ls",
//         "payment_data": {
//             "meezaReference": 4266311,
//           "meezaQrCode":"00020101021226330016A00000073210000101096100559795204152053038185406106.565802EG5922Fawaterk Test Merchant6004Giza624505063424000105271000311116453477230707528640463047821"
//         }
//     }
// }

module.exports = { getPaymentMethods, createFawaterkTransaction }