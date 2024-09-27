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

// const params = [
//     { key: "role", value: query.role },
//     { key: "name", value: query.name },
//     { key: "userName", value: query.userName },
//     { key: "email", value: query.email },
//     { key: "phone", value: query.phone },
//     { key: "familyPhone", value: query.familyPhone },
//     { key: "isActive", value: query.isActive, type: "boolean" },
//     { key: "grade", value: query.grade, operator: "equal" },
//     { key: "group", value: query.group, operator: "equal" },
// ]
exports.getAll = (Model, docName, params = [], populate = '') =>
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
        console.log(match)
        //find({course: {$in: [90, 80, 40]}})
        //sort 
        const sort = {}
        query.sortkey ? sort[query.sortkey] = query.sortvalue : null

        //select
        const select = query.select ? query.select : ""

        // //populate
        // const populate = req.populate || ""

        const docs = await Model.find(match).select(select).populate(populate).limit(limit).skip(skip).sort(sort)
        const count = await Model.countDocuments(match)

        let values = {}
        values[`${docName}`] = docs
        values.count = count

        return res.status(200).json({ status: statusTexts.SUCCESS, values })

    });


exports.getOne = (Model) =>
    asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const query = req.query

        //populate
        const populate = req.query?.populate || ""

        //select
        const select = query.select ? query.select : ""

        const doc = await Model.findById(id).populate(populate).select(select);
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
            return res.status(201).json({ status: statusTexts.SUCCESS, values: doc, message: 'doc has been created successfully' })
        }
        const doc = await Model.create(req.body);
        return res.status(201).json({ status: statusTexts.SUCCESS, values: doc, message: 'doc has been created successfully' })
    });

exports.updateOne = (Model) =>
    asyncHandler(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!doc) {
            return next('error');
        }
        await doc.save();
        return res.status(200).json({ status: statusTexts.SUCCESS, values: doc, message: 'doc has been updated successfully' })
    });

exports.deleteOne = (Model) =>
    asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const document = await Model.findByIdAndDelete(id);

        if (!document) {
            return next('no docs');
        }

        // Trigger "remove" event when update document
        await document.remove();
        return res.status(200).json({ status: statusTexts.SUCCESS, message: 'doc has been deleted successfully' })
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

exports.makeLoginSession = () => {
    return asyncHandler(async (req, res, next) => {
        const user = req.user
        const deviceIdSignedCookie = '_me' + '_' + user.userName

        // recorded devices
        let deviceId = req.cookies[deviceIdSignedCookie]  //true or false //signedCookies

        // if never login => create device ID
        if (!deviceId || user.devicesRegistered?.length === 0) {

            if (user.devicesRegistered.length === user.devicesAllowed) {
                return next(createError("لقد تجاوزت عدد الاجهزه المسموح بالتسجيل بها", 401, statusTexts.FAILED))
            }
            deviceId = crypto.randomUUID()
            user.devicesRegistered = [...user.devicesRegistered, deviceId]

            await user.save()
            res.cookie(deviceIdSignedCookie, deviceId, {
                maxAge: ms('2y')
                // httpOnly: true, secure: true, sameSite: 'none', maxAge: ms('2y') //signed
            })
        }

        if (!user?.devicesRegistered?.includes(deviceId)) {
            return next(createError("حدث خطأ فى التعرف على جهازك, من فضلك تواصل مع الدعم , إذا كنت تعتقد أن هناك خطأ ؛ تواصل مع الدعم", 400, statusTexts.FAILED))
        }

        const userDoc = user._doc
        delete userDoc.password

        //session
        const refreshToken = generateRefreshToken({ userId: userDoc._id })
        const accessToken = generateAccessToken({ userId: userDoc._id })

        // Get the user-agent string from the request headers
        const userAgent = req.headers['user-agent'];

        // Parse the user-agent string
        const parser = new UAParser();
        const result = parser.setUA(userAgent).getResult();
        const session = {
            user: userDoc._id,
            refreshToken,
            deviceId,
            expiresAt: new Date(Date.now() + ms(process.env.REFRESH_TOKEN_LIFE)),

            browserName: result?.browser?.name || userAgent,
            browserVersion: result?.browser?.version,
            deviceType: result?.os?.name,
            deviceName: result?.os?.version
        }
        await SessionModel.create(session)

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true, secure: true, sameSite: 'none', maxAge: ms(process.env.REFRESH_TOKEN_LIFE), signed: true
        })

        return res.status(200).json({ status: statusTexts.SUCCESS, values: { ...userDoc, token: accessToken }, message: "تم تسجيل الدخول بنجاح." })
    });
}

exports.useCode = async (code, user, next) => {
    try {
        if (code.numbers === 0 || !code.isActive || !code) return next(createError("هذا الكود غير صالح", 400, statusTexts.FAILED))

        switch (code.type) {
            case codeConstants.WALLET:
                user.wallet = user.wallet + code.price
                break;
            case codeConstants.CENTER:
                user.role = user_roles.CENTER
                // user.grade = code.grade || user.grade
                break;
            default: // activate
                user.role = user_roles.ONLINE
        }
        code.usedBy.push(user._id)
        code.numbers = code.numbers - 1

        await Promise.all([await user.save(), await code.save()])
        return true
    } catch (error) {
        return next(createError(error.message, 400, statusTexts.FAILED))
    }
}



// const activeSessions = await SessionModel.countDocuments({ user: userDoc._id, expiresAt: { $lt: new Date() }, logout: null })
// if (activeSessions > user.devicesAllowed) return next(createError("حسابك تحت المراجعه, سيتم تفعيله فى اقل من 24 ساعه", 401, statusTexts.FAILED))