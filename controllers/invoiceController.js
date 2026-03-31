const expressAsyncHandler = require("express-async-handler");
const InvoiceModel = require("../models/InvoiceModel");
const { getAll, insertOne, deleteOne, updateOne, deleteMany } = require("./factoryHandler");
const PaymentModel = require("../models/PaymentModel");
const createError = require("../tools/createError");
const { FAILED, SUCCESS, PENDING, PAID, REJECTED, CANCELLED } = require("../tools/statusTexts");
const paymentInteg = require("../tools/constants/paymentInteg");

const { useCoupon } = require("./couponController");
const CourseModel = require("../models/CourseModel");
const LectureModel = require("../models/LectureModel");
const UserCourseModel = require("../models/UserCourseModel");
const UserModel = require("../models/UserModel");
const lockLectures = require("../tools/lockLectures");
const { makeNewPaymob } = require("../tools/payments/paymob");
const governments = require("../tools/constants/governments");
const TagModel = require("../models/TagModel");
const { createFawaterkTransaction } = require("../tools/payments/fawaterk");
const crypto = require('crypto');
 
const createInvoiceInstructions = (invoice) => invoice.fawryCode ? `يرجي استخدام كود فوري ${invoice.fawryCode} لدفع الفاتوره قبل ${new Date(invoice.expireDate).toLocaleString("ar-EG")}`
    : invoice.meezaQrCode ? 'افتح تطبيق (فودافون كاش - اتصالات كاش - اورنج موني) وامسح رمز الاستجابة السريعة - ثم قم باعاده تحميل الصفحه بعد الدفع لتأكيد العملية' :
        invoice.redirectUrl && ' يرجى الضغط على الرابط التالي لإتمام عملية الدفع:'


function generateHashKey(secretKey, queryParams) {
    const hash = crypto.createHmac('sha256', secretKey)
        .update(queryParams)
        .digest('hex');
    return hash;
}

const cancelOtherInvoices = async (user, key, value) => {
    await InvoiceModel.updateMany({
        user, [key]: value, status: PENDING,
    }, {
        status: CANCELLED, message: 'تم رفض هذا الطلب لوجود طلب اخر لنفس المنتج تحت المراجعه'
    })
}

const invoiceParams = (query) => {
    return [
        { key: "name", value: query.name },
        { key: "description", value: query.description },
        { key: "note", value: query.note },
        { key: "sendFrom", value: query.sendFrom },
        { key: "orderId", value: query.orderId },
        { key: "trnxId", value: query.trnxId },
        { key: "price", value: query.price },
        { key: "payment", value: query.payment },
        { key: "status", value: query.status },
        { key: "message", value: query.message },
        { key: "user", value: query.user },
        { key: "createdAt", value: query.createdAt },
    ]
}



const getInvoices = getAll(InvoiceModel, 'invoices', invoiceParams)
const createInvoice = insertOne(InvoiceModel, true)
const updateInvoice = updateOne(InvoiceModel)

const deleteManyInvoices = deleteMany(InvoiceModel, invoiceParams, [], [], 'file')
const removeInvoice = deleteOne(InvoiceModel, [], [], 'file')
const alreadySubscribedError = createError('انت بالفعل مشترك', 400, FAILED)

const validatePreInvoice = expressAsyncHandler(async (req, res, next) => {
    const user = req.user
    const invoice = req.body
    const couponBody = req.body.coupon
    const coupon = (couponBody === 'undefined' || couponBody === 'null') ? null : couponBody

    const payment = await PaymentModel.findById(invoice.payment).lean()
    if (!payment) return next(createError('Payment Not Found', 404, FAILED))
    if (!payment.isActive) return next(createError('This method is not available now', 400, FAILED))

    //validate startDate , endDate *_*
    let product = {};

    //define product => course, tag, lecture
    //check if has PAID or
    const productChecks = [
        {
            key: 'course',
            model: CourseModel,
            userCheck: async () => UserCourseModel.findOne({ user: user._id, course: invoice.course }).select('_id').lean(),
            // isAsync: false,
        },
        {
            key: 'tag',
            model: TagModel,
            userCheck: async () => user.tags.includes(invoice.tag),
            // isAsync: true,
        },
        {
            key: 'lecture',
            model: LectureModel,
            userCheck: async () => user.accessLectures.includes(invoice.lecture),
            // isAsync: true,
        },
    ];

    //i want to Reject ==> manually repeated
    if (invoice.wallet) {
        const PAIDBefore = await InvoiceModel.findOne({
            user: user._id, wallet: invoice.wallet, status: PENDING,
            paymentType: 'manual'
        }).lean().select('_id')

        if (PAIDBefore) return next(createError('هناك طلب شحن بنفس المبلغ, يرجى الانتظار لحين قبول هذا الطلب او شحن المحفظه بمبلغ اخر', 400, FAILED))
        if (coupon) return next(createError('لا يمكن استعمال كوبون مع المحفظه', 400, FAILED))

        const price = Number(invoice.wallet)
        if (user.wallet + price > 2000) return next(createError('اقصى مبلغ للمحفظه هو 2000', 400, FAILED))

        product.price = price
    } else {
        for (const item of productChecks) {
            if (invoice[item.key]) {
                // const PAIDBefore = await InvoiceModel.findOne({
                //     user: user._id,
                //     [item.key]: invoice[item.key],
                //     // status: { $ne: FAILED },
                //     paymentType: 'manual'
                // }).select('_id').lean();

                // if (PAIDBefore) return next(createError('لقد تم طلب دفع مسبقا', 400, FAILED));
                const isAlreadySubscribed = await item.userCheck();
                if (isAlreadySubscribed) return next(alreadySubscribedError);

                product = await item.model.findById(invoice[item.key]).lean();
                product.key = item.key
                break;
            }
        }
    }
    if (!product) return next(createError('Product Not Found', 404, FAILED))
    product.successUrl = req.body.successUrl
    req.product = product
    req.payment = payment

    if (coupon) {
        product.price = await useCoupon(coupon, user, product, { isWallet: payment.type === paymentInteg.WALLET, isSave: false })
    }

    if (product.price === 0 || product.isFree) {
        payment.type = paymentInteg.WALLET
    }
    next()
})

const makeInvoice = expressAsyncHandler(async (req, res, next) => {
    const user = req.user
    const invoiceData = req.body
    const product = req.product
    const payment = req.payment
    const coupon = invoiceData.coupon

    //new Payment
    //Continue Payment
    let hasPAIDSuccessfully = false
    invoiceData.price = product.price;

    const item = {
        name: invoiceData.description,
        amount: invoiceData.price, //amount for paymob - price => fawaterk
        quantity: '1'
    }

    const userInfo = {
        first_name: user.name.split(' ')[0],
        last_name: user.name.split(' ')[2],
        email: user.email,
        phone: user.phone,
        state: governments.find(i => i.id === user.government)?.governorate_name_ar || 'المنصوره',
        items: [item]
    }

    const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); //after 5 days
    const invoice = new InvoiceModel({
        ...invoiceData,
        user: user._id,
        status: PENDING, paymentType: payment.type || 'manual',
        price: invoiceData.price, userInfo, expireDate: expiresAt
    });
    await invoice.validate(); // throws if invalid


    //Transfer Money if true || webhook =>
    switch (payment.type) {
        case paymentInteg.WALLET:
            if (invoice.price > user.wallet) {
                return next(createError('المحفظه لا تكفى, بالرجاء شحن مبلغ ' + (invoice.price - user.wallet) + ' جنيه', 400, FAILED))
            }
            user.wallet = user.wallet - invoice.price
            hasPAIDSuccessfully = true

            if (invoice[product.key]) { await cancelOtherInvoices(user._id, product.key, invoice[product.key]) }
            await user.save()
            if (coupon) await useCoupon(coupon, user, product, { isSave: true })
            break;

        case paymentInteg.PAYMOB:

            const { orderId, url } = await makeNewPaymob({ price: invoice.price * 100, userInfo, successUrl: product.successUrl }, payment)
            invoice.orderId = orderId
            if (invoice[product.key]) { await cancelOtherInvoices(user._id, product.key, invoice[product.key]) }
            await invoice.save()
            if (coupon) useCoupon(coupon, user, product, { isSave: true })
            return res.status(201).json({ values: { redirectUrl: url }, message: 'سيتم تحويلك الي بوابه الدفع', status: SUCCESS })

        case paymentInteg.FAWATERK:

            invoice.fawaterkPaymentId = payment.fawaterkPaymentId
            const fawResp = await createFawaterkTransaction({ price: invoice.price, successUrl: product.successUrl, userInfo }, payment)

            invoice.redirectUrl = fawResp.url
            invoice.orderId = fawResp.orderId
            invoice.trnxId = fawResp.invoice_key
            invoice.fawryCode = fawResp.fawryCode
            invoice.expireDate = fawResp.expireDate
            invoice.meezaQrCode = fawResp.meezaQrCode
            invoice.meezaReference = fawResp.meezaReference
            invoice.instructions = createInvoiceInstructions(invoice)

            if (invoice[product.key]) { await cancelOtherInvoices(user._id, product.key, invoice[product.key]) }
            await invoice.save()
            if (coupon) useCoupon(coupon, user, product, { isSave: true })

            //complete Payment
            return res.status(201).json({
                values: { invoice, redirectUrl: invoice.redirectUrl },
                message: invoice.instructions, status: SUCCESS
            })
        default:
            // Normal as Cashes pending
            await invoice.save()
            return res.status(201).json({ values: { invoice }, message: 'لقد تم ارسال طلب الدفع, واصبح تحت المراجعه', status: SUCCESS })
    }

    //Apply subscription
    if (!hasPAIDSuccessfully) {
        return next(createError('عذرا حدث خطا ما, ولم تتم عمليه الدفع', 400, FAILED))
    }
    await invoice.save()
    const response = await applySubscription(invoice, user)

    //Create Invoice
    invoice.status = PAID
    await invoice.save()

    response.values.invoice = invoice
    response.values = { ...response.values, user: { wallet: user.wallet } }
    res.status(200).json({ status: SUCCESS, values: response.values, message: response.message })
})

const webHookSubscription = expressAsyncHandler(async (req, res, next) => {
    // const user = req.user ===> Tokenized *_*
    //Validation => subscribedBefore || more than one for same product
    const invoiceData = req.body

    const invoice = await InvoiceModel.findById(req.params.id).populate('user')
    const user = invoice.user
    if (!invoice || !user) return next(createError('هناك خطا فى البيانات المرسله', 400, FAILED))

    if (invoiceData.status === REJECTED) {
        let response = {}
        if (invoice.status === REJECTED) return next(createError('الطلب مرفوض بالفعل', 400, FAILED))
        if (invoice.status === PAID) {
            response = await revokeSubscription(invoice, user)
        }
        if (response?.error) return next(createError(response.error, 400, FAILED))

        invoice.status = REJECTED
        await invoice.save()
        return res.status(200).json({ status: SUCCESS, values: invoice, message: response.message })
    }

    if (invoice.status === PAID) return next(createError('تم بالفعل الموافقه على الطلب', 400, FAILED))

    const response = await applySubscription(invoice, user, { notModifyRes: true })
    invoice.status = PAID
    await invoice.save()

    res.status(200).json({ status: SUCCESS, values: invoice, message: response.message })
})

const webhookPaymob = expressAsyncHandler(async (req, res, next) => {
    const data = req.body?.obj
    //check if accepted by Admin
    const hmac = req.query.hmac || req.body.hmac;
    const orderId = data.order?.id

    // const isValid = verifyHmac(data, hmac);
    // console.log('from hmac ==>', isValid)

    // if (!isValid) {
    //   console.log('❌ Invalid HMAC!');
    //   return res.sendStatus(403);
    // }
    if (!orderId || !data) return res.status(400).json({ status: FAILED, message: 'Some thing went wrong' })
    if (data?.success) {
        const invoice = await InvoiceModel.findOne({ orderId }).populate('user')
        if (invoice.status === PAID) throw createError('Duplicate Apply Subscription ' + invoice._id, 400, FAILED)

        await applySubscription(invoice, invoice.user, { notModifyRes: true })
        invoice.status = PAID
        invoice.trnxId = data.id
        await invoice.save()

        return res.status(204).json({ status: SUCCESS })
    } else {
        const message = data?.data?.message || "Unknown error";
        await InvoiceModel.updateOne({ orderId }, {
            status: FAILED,
            message
        })
        return res.status(204).json({})
    }

})

const webhookFawaterk = expressAsyncHandler(async (req, res, next) => {
    const response = req.body
    const orderId = response?.invoice_id
    const status = response?.invoice_status
    const hashKey = response.hashKey

    const queryParam = `InvoiceId=${response.invoice_id}&InvoiceKey=${response.invoice_key}&PaymentMethod=${response.payment_method}`;
    const generatedHashKey = generateHashKey(process.env.FAWATERK_TOKEN, queryParam);
    if (hashKey !== generatedHashKey) return next(createError('Invalid hash key', 400, FAILED, true))
    if (status !== 'paid') return next(createError('Invoice not paid status ==>', status, 400, FAILED))

    const invoice = await InvoiceModel.findOne({ orderId }).populate('user')
    if (!invoice) return next(createError('Invoice not found', 404, FAILED))
    if (invoice.status === PAID) throw createError('Duplicate Apply Subscription ' + invoice._id, 400, FAILED)

    invoice.status = PAID
    await Promise.all([
        applySubscription(invoice, invoice.user, { notModifyRes: true }),
        invoice.save()
    ])

    return res.status(204).json({ status: SUCCESS })
})

const webhookFawaterkCancelled = expressAsyncHandler(async (req, res, next) => {
    const data = req.body
    const orderId = data?.transactionId
    const hashKey = data.hashKey
    const errorMessage = data?.errorMessage || 'Expired Invoice'

    const queryParam = `referenceId=${data.referenceId}&PaymentMethod=${data.paymentMethod}`;
    const generatedHashKey = generateHashKey(process.env.FAWATERK_TOKEN, queryParam);
    if (hashKey !== generatedHashKey) return next(createError('Invalid hash key', 400, FAILED, true))

    await Promise.all([
        InvoiceModel.updateOne({ orderId }, { status: CANCELLED, message: errorMessage })
    ])

    return res.status(204).json({ status: SUCCESS })
})

const webhookFawaterkFailed = expressAsyncHandler(async (req, res, next) => {
    const data = req.body
    const orderId = data?.invoice_id
    const hashKey = data.hashKey
    const errorMessage = data?.errorMessage

    const queryParam = `InvoiceId=${data.invoice_id}&InvoiceKey=${data.invoice_key}&PaymentMethod=${data.payment_method}`;
    const generatedHashKey = generateHashKey(process.env.FAWATERK_TOKEN, queryParam);
    if (hashKey !== generatedHashKey) return next(createError('Invalid hash key', 400, FAILED, true))

    await Promise.all([
        InvoiceModel.updateOne({ orderId }, { status: FAILED, message: errorMessage })
    ])

    return res.status(204).json({ status: SUCCESS })
})


const applySubscription = async (invoice, user, meta = {}) => {
    let response = {};
    let responseValues = {}

    const notModifyRes = meta.notModifyRes || false

    if (invoice.course) {
        const isSubscribedBefore = await UserCourseModel.findOne({ user: user._id, course: invoice.course }).select('_id').lean()
        if (isSubscribedBefore) throw createError('الطالب مشترك بالفعل', 400, FAILED)

        const [userCourse, foundCourse] = await Promise.all([
            UserCourseModel.create({
                user: user._id,
                course: invoice.course,
                payment: invoice.price
            }),
            CourseModel.findById(invoice.course).lean(),
            UserModel.updateOne(
                { _id: user._id },
                {
                    $push: { courses: invoice.course },
                    $set: { wallet: user.wallet }
                }
            )
        ])
        response.message = 'تم الاشتراك بنجاح فى كورس ' + foundCourse.name;

        if (notModifyRes) {
            return response
        }
        const [course, lectures] = await lockLectures(foundCourse, userCourse);
        responseValues = {
            course,
            lectures,
            currentIndex: userCourse.currentIndex || 1,
            wallet: user.wallet
        };
    } else if (invoice.tag) {
        await UserModel.updateOne(
            { _id: user._id },
            {
                $push: { tags: invoice.tag },
            }
        )

        response.message = 'تم ايضافه الرابط بنجاح'
        responseValues = { tag: invoice.tag }
        // handle tag
    } else if (invoice.lecture) {
        // handle lecture
        if (user.accessLectures?.includes(invoice.lecture)) throw createError('الطالب مشترك بالفعل', 400, FAILED)
        await UserModel.updateOne(
            { _id: user._id },
            {
                $push: { accessLectures: invoice.lecture },
            }
        )

        response.message = 'تم ايضافه المحاضره للطالب بنجاح'
        responseValues = { lecture: { ...invoice.lecture, isPaid: true } }
    } else if (invoice.wallet) {
        user.wallet = user.wallet + invoice.price
        await UserModel.updateOne(
            { _id: user._id },
            {
                $set: { wallet: user.wallet }
            }
        )
        response.message = 'تم قبول الطلب وتم شحن المحفظه بمبلغ ' + invoice.price;
    }

    if (notModifyRes) {
        delete response.values
        return response
    } else {
        response.values = responseValues
    }
    return response
}

const revokeSubscription = async (invoice, user) => {
    let response = {};
    if (invoice.course) {
        const [userCourse] = await Promise.all([
            UserCourseModel.findOneAndDelete({
                user: user._id,
                course: invoice.course
            }),
            UserModel.updateOne(
                { _id: user._id },
                {
                    $pull: { courses: invoice.course }
                }
            )
        ]);
        const foundCourse = await CourseModel.findById(invoice.course).lean().select('name');

        response.message = 'تم إلغاء الاشتراك في الكورس ' + foundCourse?.name;

        if (!userCourse) {
            response.error = 'لم يتم العثور على اشتراك لإلغاءه';
        }
    } else if (invoice.tag) {
        await UserModel.updateOne(
            { _id: user._id },
            {
                $pull: {
                    tags: Array.isArray(invoice.tag)
                        ? { $in: invoice.tag }
                        : invoice.tag
                }
            }
        );

        response.message = 'تم إزالة الرابط بنجاح';
    } else if (invoice.lecture) {
        // handle lecture cancellation here
        await UserModel.updateOne(
            { _id: user._id },
            {
                $pull: {
                    accessLectures: Array.isArray(invoice.lecture)
                        ? { $in: invoice.lecture }
                        : invoice.lecture
                }
            }
        );

        response.message = 'المحاضره لم تعد متاحه للطالب';
    } else if (invoice.wallet) {
        user.wallet = user.wallet - invoice.price;
        await UserModel.updateOne(
            { _id: user._id },
            {
                $set: { wallet: user.wallet }
            }
        );

        response.message = `تم خصم ${invoice.price} من المحفظة بنجاح`;
    } else {
        response.error = 'نوع الاشتراك غير معروف ولا يمكن إلغاءه';
    }
    return response;
};

module.exports = {
    getInvoices, updateInvoice, createInvoice, removeInvoice, deleteManyInvoices,
    validatePreInvoice, makeInvoice,
    webHookSubscription, webhookPaymob, webhookFawaterk, webhookFawaterkCancelled, webhookFawaterkFailed
}