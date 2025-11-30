const expressAsyncHandler = require("express-async-handler");
const InvoiceModel = require("../models/InvoiceModel");
const { getAll, insertOne, deleteOne, updateOne, deleteMany } = require("./factoryHandler");
const PaymentModel = require("../models/PaymentModel");
const createError = require("../tools/createError");
const { FAILED, SUCCESS, PENDING, PAID, REJECTED } = require("../tools/statusTexts");
const paymentInteg = require("../tools/constants/paymentInteg");
const CouponModel = require("../models/CouponModel");
const { useCoupon } = require("./couponController");
const CourseModel = require("../models/CourseModel");
const LectureModel = require("../models/LectureModel");
const UserCourseModel = require("../models/UserCourseModel");
const UserModel = require("../models/UserModel");
const lockLectures = require("../tools/lockLectures");
const { getAuthToken, createOrder, iframeURL, generatePaymentKey, makeNewPaymob } = require("../tools/payments/paymob");
const governments = require("../tools/constants/governments");
const TagModel = require("../models/TagModel");

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

const validatePreInvoice = expressAsyncHandler(async (req, res, next) => {
    const user = req.user
    const invoice = req.body

    const payment = await PaymentModel.findById(invoice.payment).lean()
    if (!payment) return next(createError('Not Found', 404, FAILED))
    if (!payment.isActive) return next(createError('This method is not available now', 400, FAILED))
    //validate startDate , endDate *_*

    const alreadySubscribedError = createError('انت بالفعل مشترك', 400, FAILED)
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
            userCheck: async () => user.accessLectures?.includes(invoice.lecture),
            // isAsync: true,
        },
    ];

    if (invoice.wallet) {
        const PAIDBefore = await InvoiceModel.findOne({
            user: user._id, wallet: invoice.wallet, status: PENDING
        }).lean().select('_id')
        if (PAIDBefore) {
            return next(createError('هناك طلب شحن بنفس المبلغ, يرجى الانتظار لحين قبول هذا الطلب او شحن المحفظه بمبلغ اخر', 404, FAILED))
        }

        const price = Number(invoice.wallet)
        if (user.wallet + price > 2000) return next(createError('اقصى مبلغ للمحفظه هو 2000', 400, FAILED))
        product.price = price
    } else {
        for (const item of productChecks) {
            if (invoice[item.key]) {
                const PAIDBefore = await InvoiceModel.findOne({
                    user: user._id,
                    [item.key]: invoice[item.key],
                    status: { $ne: FAILED }
                }).select('_id').lean();

                if (PAIDBefore) return next(createError('لقد تم طلب دفع مسبقا', 400, FAILED));

                // const isAlreadySubscribed = item.isAsync
                //     ? item.userCheck()
                //     : await item.userCheck();
                const isAlreadySubscribed = await item.userCheck();

                if (isAlreadySubscribed) return next(alreadySubscribedError);

                product = await item.model.findById(invoice[item.key]).lean();
                break;
            }
        }
    }
    if (!product) return next(createError('Product Not Found', 404, FAILED))

    req.product = product
    req.payment = payment
    if ((product.price === 0 || product.isFree) && payment.type !== paymentInteg.WALLET) { //*_* Not Applied WithCoupons
        return next(createError('هذا المنتج مجانى, يمكنك تفعيله عن طريق وسيله الدفع المحفظه فقط'), 400, FAILED)
    }
    next()
})

const makeInvoice = expressAsyncHandler(async (req, res, next) => {
    const user = req.user
    const invoiceData = req.body
    const product = req.product
    const payment = req.payment

    //new Payment
    //Continue Payment
    let hasPAIDSuccessfully = false
    //Apply coupon

    invoiceData.price = product.price;
    if (invoiceData.coupon && !(invoiceData.coupon === 'undefined' || invoiceData.coupon === 'null')) {
        invoiceData.price = await useCoupon(invoiceData.coupon, user, product, { isWallet: true, isSave: true })
    }

    const invoice = new InvoiceModel({
        ...invoiceData,
        user: user._id,
        status: PENDING,
        price: invoiceData.price
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
            await user.save()
            break;
        case paymentInteg.PAYMOB:

            const billingData = {
                apartment: 'Na',
                email: user.email,
                first_name: user.name.split(' ')[0],
                last_name: user.name.split(' ')[2],

                phone_number: user.phone,
                floor: "NA",
                street: "NA",
                building: "NA",
                shipping_method: "NA",
                postal_code: "NA",
                city: governments.find(i => i.id === user.government)?.governorate_name_ar || 'المنصوره',
                country: "EG",
                state: governments.find(i => i.id === user.government)?.governorate_name_ar || 'المنصوره',
            }

            //######Start New settings
            const { orderId, url } = await makeNewPaymob({ price: invoice.price * 100, items: [], billingData })
            invoice.orderId = orderId
            await invoice.save()
            return res.status(201).json({ values: { redirectUrl: url }, message: 'سيتم تحويلك الي بوابه الدفع', status: SUCCESS })
            // ########  End

            // const token = await getAuthToken();
            // const orderId = await createOrder(token, invoice.price * 100); // 100 EGP

            // const paymentToken = await generatePaymentKey(token, invoice.price * 100, orderId, billingData);
            // invoice.orderId = orderId
            // await invoice.save()
            // const redirectUrl = iframeURL(paymentToken)
            // return res.status(201).json({ values: { redirectUrl }, message: 'سيتم تحويلك الي بوابه الدفع', status: SUCCESS })
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
    response.values.wallet = user.wallet
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
    // console.log('hmac ==>', hmac)
    // console.log('orderId ===>', orderId)

    // if (!isValid) {
    //   console.log('❌ Invalid HMAC!');
    //   return res.sendStatus(403);
    // }
    if (!orderId || !data) return res.status(400).json({ status: FAILED, message: 'Some thing went wrongs' })
    if (data?.success) {
        const invoice = await InvoiceModel.findOne({ orderId }).populate('user')
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

const applySubscription = async (invoice, user, meta = {}) => {
    let response = {};
    let responseValues = {}

    const notModifyRes = meta.notModifyRes || false

    if (invoice.course) {
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
                $pull: { tags: invoice.tag }
            }
        );

        response.message = 'تم إزالة الرابط بنجاح';
    } else if (invoice.lecture) {
        // handle lecture cancellation here
        await UserModel.updateOne(
            { _id: user._id },
            {
                $pull: { accessLectures: invoice.lecture }
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
    validatePreInvoice, makeInvoice, webHookSubscription, webhookPaymob
}