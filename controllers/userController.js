import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';
import UserModel from '../models/UserModel.js';
import bcrypt from 'bcryptjs';
import statusTexts from '../tools/statusTexts.js';
import createError from '../tools/createError.js';

import { addToCloud } from '../middleware/upload/cloudinary.js';
import { user_roles } from '../tools/constants/rolesConstants.js';
import { getAll, analysisMonthly, pushToModel, deleteMany, deleteOne } from './factoryHandler.js';
import { uploadFile, deleteFile } from '../middleware/upload/uploadFiles.js';
import UserCourseModel from '../models/UserCourseModel.js';
import AttemptModel from '../models/AttemptModel.js';
import CodeModel from '../models/CodeModel.js';
import CouponModel from '../models/CouponModel.js';
import SessionModel from '../models/SessionModel.js';
import NotificationModel from '../models/NotificationModel.js';
import VideoStatisticsModel from '../models/VideoStatisticsModel.js';
import expressAsyncHandler from 'express-async-handler';
import InvoiceModel from '../models/InvoiceModel.js';
import AnswerModel from '../models/AnswerModel.js';
import FeedBackModel from '../models/FeedBackModel.js';


const userParams = (query) => {
    return [
        { key: "role", value: query.role },
        { key: "name", value: query.name },
        { key: "userName", value: query.userName },
        { key: "email", value: query.email },
        { key: "phone", value: query.phone },
        { key: "familyPhone", value: query.familyPhone },
        { key: "devicesAllowed", value: query.devicesAllowed, type: 'number' },
        { key: "wallet", value: query.wallet, type: 'number' },
        { key: "isActive", value: query.isActive, type: "boolean" },
        { key: "grade", value: query.grade },
        { key: "government", value: query.government, type: "number", },
        { key: "totalPoints", value: query.totalPoints, type: "number", },
        { key: "marks", value: query.marks, type: "number", },
        { key: "exam_marks", value: query.exam_marks, type: "number", },
        { key: "groups", value: query.groups, type: 'array' },
        { key: "tags", value: query.tags },
        { key: "courses", value: query.courses},
        { key: "exams", value: query.exams, type: "array" },
        { key: "lectures", value: query.lectures, type: "array" },
        { key: "books", value: query.books },
        { key: "accessLectures", value: query.accessLectures },
        { key: "createdAt", value: query.createdAt },
    ]
} //modify it to be more frontend

const userRefFields = [
    { model: CodeModel, fields: ['usedBy'] },
    { model: CouponModel, fields: ['usedBy'] },
];

const userDependentModels = [
    { model: FeedBackModel, field: 'user' },
    { model: UserCourseModel, field: 'user' },
    { model: AttemptModel, field: 'user' },
    { model: AnswerModel, field: 'user' },
    { model: FeedBackModel, field: 'user' },
    { model: VideoStatisticsModel, field: 'user' },
    { model: SessionModel, field: 'user' },
    { model: NotificationModel, field: 'user' },
    { model: InvoiceModel, field: 'user', relatedFiles: ['file'] },
];


// @desc get all user
// @route GET /users
// @access Private
const getUsers = getAll(UserModel, 'users', userParams)
const deleteUser = deleteOne(UserModel, userRefFields, userDependentModels, ['avatar', 'fileConfirm'])
const deleteManyUsers = deleteMany(UserModel, userParams, userRefFields, userDependentModels, ['avatar', 'fileConfirm'], { role: { $ne: user_roles.ADMIN } })

// @desc get one user
// @route GET /users/:id
// @access Private
const getByUserName = asyncHandler(async (req, res, next) => {

    const query = req.query
    const userName = req.params.userName

    //select
    const select = query.select ? query.select : ""

    if (userName) {
        const user = await UserModel.findOne({ userName }).select(select)
        return res.status(200).json({ status: statusTexts.SUCCESS, values: user })

    } else {
        const error = createError('Not found', 404, statusTexts.FAILED)
        return next(error)
    }

})

// @desc create user
// @route POST /users
// @access Private
const createUser = asyncHandler(async (req, res, next) => {

    const user = req.body

    if (user.userName) {
        const foundUser = await UserModel.findOne({ userName: user.userName })
        const hasPhone = await UserModel.findOne({ phone: user.phone })
        // for exsiting user ----
        if (foundUser || hasPhone) {
            const error = createError("المستخدم موجود", 400, statusTexts.FAILED)
            return next(error)
        }
    } else {
        const error = createError("Bad data", 400, statusTexts.FAILED)
        return next(error)
    }

    // ------
    const hashedPassword = bcrypt.hashSync(user.password, 10)

    user.password = hashedPassword
    const createdUser = await UserModel.create({ ...user })

    res.status(201).json({ status: statusTexts.SUCCESS, values: createdUser, message: "تم انشاء المستخدم بنجاح" })
})

// @desc update user // user profile 
// @route POST /users
// @access private   ==> admin/subAdmin
const updateUser = asyncHandler(async (req, res, next) => {

    const id = req.params.id
    const { grade, name, userName, email, password, phone, familyPhone, isActive, role, government, devicesAllowed, devicesRegistered } = req.body

    const user = await UserModel.findById(id) //.select(select) populate
    if (!user) return next(createError("No users found ..!", 404, statusTexts.FAILED))

    if (userName) {
        const searchedUser = await UserModel.findOne({ userName, _id: { $ne: id } }).lean().select('_id')
        if (searchedUser) return next(createError("هناك مستخدم موجود بالفعل ", 400, statusTexts.FAILED))
    }

    if (phone) {
        const userHasPhone = await UserModel.findOne({ phone, _id: { $ne: id } }).lean().select('_id')
        if (userHasPhone) return next(createError("هناك مستخدم موجود بالفعل ", 400, statusTexts.FAILED))
    }

    user.grade = grade || user.grade
    user.name = name || user.name
    user.userName = userName || user.userName
    user.phone = phone || user.phone

    user.email = email || user.email
    user.familyPhone = familyPhone || user.familyPhone
    user.devicesAllowed = devicesAllowed || user.devicesAllowed
    user.devicesRegistered = devicesRegistered || user.devicesRegistered
    user.government = government || user.government

    if ((user.role !== user_roles.ADMIN || user.role !== user_roles.SUBADMIN) && (role === user_roles.ADMIN || role === user_roles.SUBADMIN)) return next(createError('لا يمكن تغيير حاله المستخدم الي ادمن او مشرف'))

    if (user.role === user_roles.ADMIN && !isActive) return next(createError('لا يمكن الغاء تفعيل الادمن .'))
    if (user.role === user_roles.ADMIN && role !== user_roles.ADMIN) return next(createError('لا يمكن الغاء تفعيل الادمن .'))

    user.isActive = typeof isActive === "boolean" ? isActive : user.isActive
    user.role = role || user.role

    if (password === 'reset') {
        user.isResetPassword = true
        const hashedPassword = bcrypt.hashSync(user.userName, 10)
        user.password = hashedPassword

    } else if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10)
        user.password = hashedPassword
    }

    await user.save()


    return res.status(200).json({ status: statusTexts.SUCCESS, values: user, message: "تم تعديل البيانات بنجاح" })

})

// @desc update user // user profile 
// @route PUT /users
// @access Public   ==> admin/user/subAdmin
const updateUserProfile = asyncHandler(async (req, res, next) => {

    const id = req.params.id
    const { userName, name, email, password, phone, familyPhone, role, grade } = req.body

    //select
    const user = await UserModel.findById(id)

    const file = req.file

    let avatar = {}

    if (file) {
        avatar = await uploadFile(file, {
            name: userName,
            secure: true
        })
        delete user.avatar
        user.avatar = avatar
    }

    if (userName) {
        const searchedUser = await UserModel.findOne({ userName, _id: { $ne: id } }).lean().select('_id')
        if (searchedUser) return next(createError("هناك مستخدم موجود بالفعل ", 400, statusTexts.FAILED))
        user.userName = userName || user.userName
    }

    if (phone) {
        const userHasPhone = await UserModel.findOne({ phone, _id: { $ne: id } }).lean().select('_id')
        if (userHasPhone) return next(createError("هناك مستخدم موجود بالفعل ", 400, statusTexts.FAILED))
        user.phone = phone || user.phone
    }

    user.name = name || user.name
    user.email = email || user.email
    user.familyPhone = familyPhone || user.familyPhone
    user.role = role ?? user.role

    if (password) {
        user.isResetPassword = false
        const hashedPassword = bcrypt.hashSync(password, 10)
        user.password = hashedPassword
    }
    await user.save()
    return res.status(200).json({ status: statusTexts.SUCCESS, values: user, message: "تم تعديل البيانات بنجاح" })
})

// @desc update user // user profile 
// @route POST /users
// @access Private   ==> admin
const checkDeleteUser = asyncHandler(async (req, res, next) => {

    const { id } = req.params

    const user = await UserModel.findById(id)
    // console.log(user)
    if (user.role === user_roles.ADMIN) {
        const error = createError("admin can`t be deleted", 400, statusTexts.FAILED)
        return next(error)
    }
    return next()
})

const addToUsers = pushToModel(UserModel)

export { getUsers, getByUserName, createUser, updateUserProfile, updateUser, deleteUser, userParams, addToUsers, deleteManyUsers, checkDeleteUser };