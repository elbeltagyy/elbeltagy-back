const asyncHandler = require("express-async-handler");
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
const { uploadFile, deleteFile } = require("../middleware/upload/uploadFiles.js");

const dotenv = require("dotenv");
const parseFilters = require("../tools/fcs/matchGPT.js");
const UserModel = require("../models/UserModel.js");
const convertToObjectIdBySchema = require("../tools/fcs/convertToObjectIdBySchema.js");
dotenv.config()

const getMonthRange = (value) => {
    const date = new Date(value)
    const year = date.getFullYear();
    const month = date.getMonth();

    const start = new Date(year, month, 1);          // Month start
    const end = new Date(year, month + 1, 1);        // Next month start

    return { $gte: start, $lt: end };
}

exports.analysisByKeys = (Model, params) => asyncHandler(async (req, res, next) => {
    const matchStage = params ? parseFilters(params((convertToObjectIdBySchema(req.query, Model)))) : {}
    const filterByTime = req.query.filterByTime || null
    filterByTime ? matchStage.createdAt = getMonthRange(filterByTime) : ''

    const counts = await Model.countDocuments(matchStage)
    const total = await Model.estimatedDocumentCount()
    const series = [(total - counts), counts]
    return res.status(200).json({ values: { series } })
})

exports.analysisMonthly = (Model, params = null) => asyncHandler(async (req, res, next) => {
    const startYear = req.query.start ? Number(req.query.start) : null;
    const endYear = req.query.end ? Number(req.query.end) : null;

    // const match = parseFilters(params((convertToObjectIdBySchema(req.query, VideoStatisticsModel))))
    /* ----------------------------------------------------------- *
     * 1. Aggregate counts per { year, month }                     *
     * ----------------------------------------------------------- */
    const matchStage = params ? parseFilters(params((convertToObjectIdBySchema(req.query, Model)))) : {}

    if (startYear || endYear) {
        matchStage.createdAt = {};
        if (startYear) {
            matchStage.createdAt.$gte = new Date(Date.UTC(startYear, 0, 1));
        }
        if (endYear) {
            matchStage.createdAt.$lt = new Date(Date.UTC(endYear + 1, 0, 1));
        }
    }

    const pipeline = [
        Object.keys(matchStage).length && { $match: matchStage },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" } // 1‑12
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ].filter(Boolean);

    const raw = await Model.aggregate(pipeline);
    /* ----------------------------------------------------------- *
 * 2. Shape result into [{ name, series[12] }]                 *
 * ----------------------------------------------------------- */
    const yearMap /* { [year]: number[12] } */ = {};

    raw.forEach(({ _id: { year, month }, count }) => {
        if (!yearMap[year]) yearMap[year] = Array(12).fill(0);
        yearMap[year][month - 1] = count; // 0‑based index
    });

    // Fill missing years within range (optional convenience)
    if (startYear !== null && endYear !== null) {
        for (let y = startYear; y <= endYear; y++) {
            yearMap[y] = yearMap[y] ?? Array(12).fill(0);
        }
    }
    const result = Object.entries(yearMap)
        .sort(([a], [b]) => a - b)
        .map(([year, data]) => ({ name: year, data }));

    const categories = ['يناير', "فبراير", "مارس", "ابريل", "مايو", "يونيو", "يوليو", "اغسطس", "سبتمبر", "اكتوبر", "نوفبمر", "ديسمبر"]

    res.json({ values: { result, categories }, status: statusTexts.SUCCESS });
})

//analysisUsers ==> matching - anaMethod (strict - monthly - yearly) - by (default - roles)
exports.handelOneFile = (fileKey) =>
    asyncHandler(async (req, res, next) => {
        const file = req.file || null;
        if (file) {
            const fileData = await uploadFile(file, { name: file?.originalname, secure: true }) //req.body?.name || 
            req.body[fileKey] = fileData
        } else {
            delete req.body[fileKey]
        }
        next()
    });

exports.deleteFromBody = (keys = []) => {
    return asyncHandler(async (req, res, next) => {
        keys.map(key => {
            delete req.body[key]
        })
        next()
    })
}

exports.getAll = (Model, docName, params = [], isModernSort = true, populate = '', embedFc = false) =>
    asyncHandler(async (req, res) => {
        const query = req.query

        if (req.query.isModernSort) {
            isModernSort = req.query.isModernSort === true || req.query.isModernSort === 'true' ? true : false
        }
        //pagination
        const limit = query.limit || 10000
        const page = query.page || 1
        const skip = (page - 1) * limit

        // search && filter
        let match = parseFilters(params(query))

        // console.log(match)
        //find({course: {$in: [90, 80, 40]}})
        //sort 
        const sort = {}
        query.sortkey ? sort[query.sortkey] = Number(query.sortValue) : null
        sort.createdAt = isModernSort ? -1 : 1
        query.sortkey === 'createdAt' ? sort.createdAt = Number(query.sortValue) : null
        query.sortkey === 'updatedAt' ? sort.updatedAt = Number(query.sortValue) : null

        //select
        const select = query.select ? query.select : ""
        sort._id = -1 // *_*
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
        if (embedFc) {
            values = await embedFc(req, values)
        }
        // console.log(values)
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

exports.insertOne = (Model, withIndex = false, populate = '') =>
    asyncHandler(async (req, res) => {

        if (withIndex) {
            const lastDoc = await Model.findOne().sort({ createdAt: -1 })
            const index = lastDoc?.index + 1 || 1
            req.body.index = index
        }

        const doc = await Model.create(req.body);
        if (populate) {
            await doc.populate(populate)
        }
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


exports.deleteOne = (Model, relatedDocs = [], relatedModels = [], relatedFile) =>
    asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        // console.log('id ==>', id)
        const document = await Model.findByIdAndDelete(id);

        if (!document) {
            return next('لم يوجد');
        }

        if (relatedDocs.length > 0) {
            await deleteOtherDocs(relatedDocs, id)
        }

        if (relatedModels.length > 0) {
            await deleteOtherModels(relatedModels, id)
        }
        let isFoundFileAndDeleted = false
        if (relatedFile && document[relatedFile]) {
            isFoundFileAndDeleted = await deleteFile(document[relatedFile])
        }

        let message = 'تمت الازاله بنجاح'
        if (isFoundFileAndDeleted) {
            message += ' , ' + 'تم حذف الملف بنجاح'
        }
        return res.status(200).json({ status: statusTexts.SUCCESS, message })
    });

exports.deleteMany = (Model, params = [], relatedDocs = [], relatedModels = [], relatedFiles, specificFilters = {}) =>
    asyncHandler(async (req, res, next) => {
        const { ids = [] } = req.body;
        const query = req.query

        let match = {}
        if (Array.isArray(ids) && ids.length > 0) {
            match = { _id: { $in: ids } }
        } else if (params.length > 0) {
            match = parseFilters(params(query))
        } else {
            return next(createError('حدث خطا', 400, statusTexts.FAILED))
        }
        if (Object.keys(match).length === 0) {
            return next(createError('لا يمكن ازاله كل العناصر', 400, statusTexts.FAILED))
        }

        // Ensure relatedFiles is always an array
        if (!Array.isArray(relatedFiles)) {
            relatedFiles = [relatedFiles].filter(Boolean);
        }

        const BATCH_SIZE = 1000
        let totalDeleted = 0
        while (true) {
            const docs = await Model.find({ ...match, ...specificFilters }).lean().limit(BATCH_SIZE);
            if (docs.length === 0) break;
            // totalDeleted = docs.length
            // break
            const batchIds = docs.map(doc => doc._id);

            // Collect promises for parallel execution
            const tasks = [];

            if (relatedDocs.length > 0) {
                tasks.push(deleteOtherDocs(relatedDocs, batchIds));
            }
            if (relatedModels.length > 0) {
                tasks.push(deleteOtherModels(relatedModels, batchIds));
            }

            // Delete related files for each doc
            if (relatedFiles.length > 0) {
                docs.forEach(doc => {
                    relatedFiles.forEach(field => {
                        const filePath = doc[field];
                        if (filePath) {
                            tasks.push(deleteFile(filePath));
                        }
                    });
                });
            }
            await Promise.all(tasks);
            // Delete actual docs from Model
            const result = await Model.deleteMany({ _id: { $in: batchIds } });
            totalDeleted += result.deletedCount;
        }

        let message = 'تمت ازاله' + ' ' + totalDeleted + ' ' + 'بنجاح'
        return res.status(200).json({ status: statusTexts.SUCCESS, message })
    });

exports.getDocCount = (Model, params = []) =>
    asyncHandler(async (req, res) => {

        const query = req.query

        // search && filter
        const match = parseFilters(params(query))

        const count = await Model.countDocuments(match)
        return res.status(200).json({ status: statusTexts.SUCCESS, values: { count } })
    });


exports.filterById = (Model, params = [], idName) =>
    asyncHandler(async (req, res, next) => {
        const query = req.query
        // search && filter
        const match = parseFilters(params(query))

        if (Object.entries(match).length > 0) {
            const filteredId = await Model.findOne(match).select('_id').lean()
            req.query[idName] = filteredId?._id || 'emptyArray'
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
        // if (!user?.devicesRegistered?.includes(deviceId)) {

        //     if (user.devicesRegistered.length === user.devicesAllowed) {
        //         return next(createError("لقد تجاوزت عدد الاجهزه المسموح بالتسجيل بها", 401, statusTexts.FAILED))
        //     }
        //     user.devicesRegistered = [...user.devicesRegistered, deviceId]
        //     await user.save()

        //     res.cookie(deviceIdSignedCookie, deviceId, {
        //         httpOnly: true,
        //         secure: process.env.NODE_ENV === 'production',  // Secure only in production
        //         sameSite: process.env.host === 'server' ? 'lax' : 'none', // lax for local dev
        //         maxAge: ms('2y') //signed
        //     })
        // }

        // if (!user?.devicesRegistered?.includes(deviceId)) {
        //     return next(createError("حدث خطأ فى التعرف على جهازك, من فضلك تواصل مع الدعم , إذا كنت تعتقد أن هناك خطأ ؛ تواصل مع الدعم", 400, statusTexts.FAILED))
        // }
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
                case codeConstants.LECTURES:
                    if (user.role === user_roles.INREVIEW) {
                        user.role = user_roles.ONLINE
                    }
                    message = 'تم ايضافه محاضراتك بنجاح, يمكنك الوصول اليها من الصفحه الرئيسيه'
                    break;
                default: // activate
                    user.role = user_roles.ONLINE
                    message = true
            }
            code.usedBy.push(user._id)
            code.numbers = code.numbers - 1

            await Promise.all([user.save(), code.save()])
            return resolve(message)
        } catch (error) {
            return reject(createError(error.message, 400, statusTexts.FAILED))
        }
    })
}

exports.pushToModel = (Model) => {
    return asyncHandler(async (req, res, next) => {
        const targetId = req.params.id

        const { field, value, id, ids = [], action = 'push' } = req.body;

        //U can check if req.body is Array
        const targetIds = [];

        if (!field || !value) {
            return next(createError('Field and value are required', 400, statusTexts.FAILED));
        }

        // Normalize users input
        if (id) targetIds.push(id);
        if (targetId) targetIds.push(targetId);
        if (Array.isArray(ids)) targetIds.push(...ids);

        if (targetIds.length === 0) {
            return next(createError('No Data provided', 400, statusTexts.FAILED));
        }

        // Create dynamic update object
        const update = action === 'push' ? 
        { $addToSet: {
            [field]: Array.isArray(value)
                ? { $each: value }
                : value
        }} :  action === 'save' ? 
            { $set: {
                [field]: Array.isArray(value) ? value : [value]
            }}
        : { $pull: {
          [field]: Array.isArray(value)
            ? { $in: value }
            : value
        }
        }
        // field: 'tags', ids: chosenUsers, value: tag._id, action: 'pull'
        // console.log(update, targetIds)
        await Model.updateMany(
            { _id: { $in: targetIds } },
            update
        );

        res.status(200).json({
            message: (action === 'push' ? ' تمت الإضافه بنجاح' : action === 'save' ? 'تم حفظ العناصر المختاره فقط' : ' تمت الإزاله بنجاح'),
            status: statusTexts.SUCCESS
        });
    })
}

const deleteOtherDocs = async (relatedDocs, id) => {
    //    [{ model: UserModel, fields: ['groups'] },]
    const ids = Array.isArray(id) ? id : [id];

    try {
        const updateTasks = relatedDocs.map(({ model, fields }) =>
            fields.map(field =>
                model.updateMany(
                    { [field]: { $in: ids } },
                    { $pull: { [field]: { $in: ids } } }
                )
            )
        ).flat();
        await Promise.all(updateTasks);
    } catch (error) {
        console.log('error from deleteOtherDocs ==>', error.message)
    }
}

const deleteOtherModels = async (relatedModels, id) => {
    //    { model: UserModel, field: 'group', relatedFiles: ['String] },
    const ids = Array.isArray(id) ? id : [id];
    try {

        relatedModels.forEach(async ({ model, field, relatedFiles }) => {
            if (!Array.isArray(relatedFiles)) {
                relatedFiles = [relatedFiles].filter(Boolean);
            }

            const docs = await model.find({ [field]: { $in: ids } }).lean();

            let fileTasks = []
            if (relatedFiles.length > 0) {
                docs.forEach(doc => {
                    relatedFiles.forEach(fileField => {
                        const filePath = doc[fileField];
                        if (filePath) {
                            fileTasks.push(deleteFile(filePath));
                        }
                    });
                });
            }

            await Promise.all([
                ...fileTasks,
                model.deleteMany({ [field]: { $in: ids } })
            ]);
        });

    } catch (error) {
        console.log('error from deleteOtherModels ==>', deleteOtherModels)
    }
}

// in route('/', getAll) return as object so no middleware Fc
// in route('/', getAll()) return from parent Fc