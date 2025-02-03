const asyncHandler = require("express-async-handler");
const { makeMatch } = require("../tools/makeMatch");
const statusTexts = require("../tools/statusTexts");
const SessionModel = require("../models/SessionModel");

const crypto = require('crypto')
const UAParser = require('ua-parser-js');
const ms = require("ms");
const createError = require("../tools/createError");
const { generateRefreshToken } = require("../middleware/generateRefreshToken.js");
const { generateAccessToken } = require("../middleware/generateAccessToken.js");
const codeConstants = require("../tools/constants/codeConstants.js");
const { user_roles } = require("../tools/constants/rolesConstants.js");
const expressAsyncHandler = require("express-async-handler");

const dotenv = require("dotenv")
// config
dotenv.config()

exports.getAll = (Model, docName, params = [], isModernSort = true, populate = '') =>
    asyncHandler(async (req, res) => {

        const query = req.query

        //pagination
        const limit = query.limit || 10000
        const page = query.page || 1
        const skip = (page - 1) * limit

        // search && filter
        const match = {}
        if (params.length > 0) {
            makeMatch(match, params(query))
        }

        //find({course: {$in: [90, 80, 40]}})
        //sort 
        const sort = {}
        query.sortkey ? sort[query.sortkey] = query.sortValue : null
        sort.createdAt = isModernSort ? -1 : 1
        query.sortkey === 'createdAt' ? sort.createdAt = query.sortValue : null
        query.sortkey === 'updatedAt' ? sort.updatedAt = query.sortValue : null

        //select
        const select = query.select ? query.select : ""

        // //populate
        populate = req.query.populate || populate

        const docs = await Model.find(match)
            .select(select)
            .populate(populate)
            .limit(limit).skip(skip)
            .sort(sort).lean()

        const count = await Model.countDocuments(match)

        let values = {}
        values[`${docName}`] = docs
        values.count = count

        return res.status(200).json({ status: statusTexts.SUCCESS, values })

    });


exports.getOne = (Model, populate = '') =>
    asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const query = req.query

        //populate
        populate = req.query?.populate || populate


        //select
        const select = query.select ? query.select : ""

        const doc = await Model.findById(id).populate(populate).select(select).lean();

        if (!doc) {
            return next('error');
        }

        return res.status(200).json({ status: statusTexts.SUCCESS, values: doc })

    });

exports.insertOne = (Model, withIndex = false) =>
    asyncHandler(async (req, res) => {

        if (withIndex) {
            const lastDoc = await Model.findOne().sort({ createdAt: -1 })
            const index = lastDoc?.index + 1 || 1
            req.body.index = index
            const doc = await Model.create(req.body);
            return res.status(201).json({ status: statusTexts.SUCCESS, values: doc, message: 'تم الانشاء بنجاح' })
        }
        const doc = await Model.create(req.body);
        return res.status(201).json({ status: statusTexts.SUCCESS, values: doc, message: 'تم الانشاء بنجاح' })
    });

exports.updateOne = (Model) =>
    asyncHandler(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!doc) {
            return next('error');
        }
        await doc.save();
        return res.status(200).json({ status: statusTexts.SUCCESS, values: doc, message: 'تم التعديل بنجاح' })
    });

exports.deleteOne = (Model) =>
    asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        // console.log('id ==>', id)
        const document = await Model.findByIdAndDelete(id);

        if (!document) {
            return next('لم يوجد');
        }

        // Trigger "remove" event when update document
        // await document.remove();
        return res.status(200).json({ status: statusTexts.SUCCESS, message: 'تمت الازاله بنجاح' })
    });

exports.getDocCount = (Model, params = []) =>
    asyncHandler(async (req, res) => {

        const query = req.query

        // search && filter
        const match = {}
        makeMatch(match, params(query))

        const count = await Model.countDocuments(match)
        return res.status(200).json({ status: statusTexts.SUCCESS, values: { count } })
    });


exports.filterById = (Model, params = [], idName) =>
    asyncHandler(async (req, res, next) => {
        const query = req.query
        // search && filter
        const match = {}
        if (params.length > 0) {
            makeMatch(match, params(query))
        }
        if (Object.entries(match).length > 0) {
            const filteredId = await Model.findOne(match).select('_id').lean()
            req.query[idName] = filteredId?._id
        }
        next()
    })

exports.makeLoginSession = () => {
    return asyncHandler(async (req, res, next) => {
        const user = req.user
        const deviceIdSignedCookie = '_mev1' + '_' + user.userName //v1

        // recorded devices
        let deviceId = req.cookies[deviceIdSignedCookie]  //true or false //signedCookies
        if (!deviceId) {
            deviceId = req.ip || crypto.randomUUID()
        }

        // if never login => !deviceId = true + || if logged before but invalid deviceId
        if (!user?.devicesRegistered?.includes(deviceId)) {

            if (user.devicesRegistered.length === user.devicesAllowed) {
                return next(createError("لقد تجاوزت عدد الاجهزه المسموح بالتسجيل بها", 401, statusTexts.FAILED))
            }
            user.devicesRegistered = [...user.devicesRegistered, deviceId]
            await user.save()

            res.cookie(deviceIdSignedCookie, deviceId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',  // Secure only in production
                sameSite: process.env.host === 'server' ? 'lax' : 'none', // lax for local dev
                maxAge: ms('2y') //signed
            })
        }

        if (!user?.devicesRegistered?.includes(deviceId)) {
            return next(createError("حدث خطأ فى التعرف على جهازك, من فضلك تواصل مع الدعم , إذا كنت تعتقد أن هناك خطأ ؛ تواصل مع الدعم", 400, statusTexts.FAILED))
        }
        const userDoc = user._doc
        delete userDoc.password

        // Get the user-agent string from the request headers
        const userAgent = req.headers['user-agent'];

        // Parse the user-agent string
        const parser = new UAParser();
        const result = parser.setUA(userAgent).getResult();

        // logout from other sessions
        if (user.role !== user_roles.ADMIN && process.env.NODE_ENV === 'production') {
            await SessionModel.updateMany({
                logout: { $exists: false },
                user: user._id
            }, {
                logout: new Date(),
                isLoggedOutAutomatic: true
            })
        }

        //Create New Session
        const session = {
            user: userDoc._id,
            // refreshToken,
            deviceId,
            expiresAt: new Date(Date.now() + ms(process.env.REFRESH_TOKEN_LIFE)),
            ip: req.ip,

            browserName: result?.browser?.name || userAgent,
            browserVersion: result?.browser?.version,
            deviceType: result?.os?.name,
            deviceName: result?.os?.version
        }
        const newSession = await SessionModel.create(session)
        //session
        const refreshToken = generateRefreshToken({ sessionId: newSession._id })
        const accessToken = generateAccessToken({ sessionId: newSession._id })
        newSession.refreshToken = refreshToken
        await newSession.save()

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',  // Secure only in production
            sameSite: process.env.host === 'server' ? 'lax' : 'none', // lax for local dev
            maxAge: ms(process.env.REFRESH_TOKEN_LIFE), // signed = true
        })

        return res.status(200).json({ status: statusTexts.SUCCESS, values: { ...userDoc, token: accessToken }, message: "تم تسجيل الدخول بنجاح." })
    });
}

exports.useCode = async (code = null, user) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!code) return reject(createError("هذا الكود غير صالح", 400, statusTexts.FAILED))
            if (code?.numbers === 0 || !code.isActive) return reject(createError("هذا الكود غير صالح", 400, statusTexts.FAILED))
            if (code.usedBy.includes(user._id)) return reject(createError("الكود يستخدم مره واحده لكل مستخدم", 400, statusTexts.FAILED))

            let message = ''
            switch (code.type) {
                case codeConstants.WALLET:
                    if (user.role === user_roles.INREVIEW) {
                        user.role = user_roles.ONLINE
                    }
                    if ((user.wallet + code.price) >= 2000) return reject(createError("اقصى مبلغ للمحفظه 2000 جنيه", 400, statusTexts.FAILED))

                    const before = user.wallet
                    user.wallet = user.wallet + code.price
                    message = `Your wallet was ${before} and became ${user.wallet}, + ${code.price}`
                    break;
                case codeConstants.CENTER:
                    user.role = user_roles.STUDENT
                    message = `انت الان اصبحت طالب سنتر`
                    break;
                default: // activate
                    user.role = user_roles.ONLINE
                    message = true
            }
            code.usedBy.push(user._id)
            code.numbers = code.numbers - 1

            await Promise.all([await user.save(), await code.save()])
            return resolve(message)
        } catch (error) {
            return reject(createError(error.message, 400, statusTexts.FAILED))
        }
    })
}


// in route('/', getAll) return as object so no middleware Fc
// in route('/', getAll()) return from parent Fc

// const activeSessions = await SessionModel.countDocuments({ user: userDoc._id, expiresAt: { $lt: new Date() }, logout: null })
// if (activeSessions > user.devicesAllowed) return next(createError("حسابك تحت المراجعه, سيتم تفعيله فى اقل من 24 ساعه", 401, statusTexts.FAILED))