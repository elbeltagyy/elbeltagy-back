import expressAsyncHandler from 'express-async-handler';
import { uploadFile } from '../middleware/upload/uploadFiles.js';
import PaymentModel from '../models/PaymentModel.js';
import { getAll, insertOne, deleteOne, updateOne } from './factoryHandler.js';
import InvoiceModel from '../models/InvoiceModel.js';

const paymentsParams = (query) => {
    return [
        { key: "name", value: query.name },
        { key: "description", value: query.description },
        { key: "index", value: query.index },
        { key: "startDate", value: query.startDate },
        { key: "endDate", value: query.endDate },
        { key: "type", value: query.type },
        { key: "user", value: query.user },
        { key: "isActive", value: query.isActive },
        { key: "createdAt", value: query.createdAt },
    ]
}

const getPayments = getAll(PaymentModel, 'payments', paymentsParams)
const createPayment = insertOne(PaymentModel, true)
const updatePayment = updateOne(PaymentModel)

const handelPaymentFile = expressAsyncHandler(async (req, res, next) => {

    const file = req.file
    if (file) {
        const uploadedFile = await uploadFile(file, {
            name: req.body?.name, secure: true
        })
        req.body.file = uploadedFile
    } else {
        delete req.body.file
    }

    next()
})

const removePayment = deleteOne(PaymentModel, [], [
    { model: InvoiceModel, field: 'payment', relatedFiles: ['file'] },
], ['file'])

export { getPayments, updatePayment, createPayment, removePayment, handelPaymentFile };