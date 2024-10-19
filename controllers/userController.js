const mongoose = require("mongoose")
const asyncHandler = require("express-async-handler")
const UserModel = require("../models/UserModel.js")
const bcrypt = require("bcryptjs")
const statusTexts = require("../tools/statusTexts.js");
const createError = require("../tools/createError.js");

const { addToCloud } = require("../middleware/upload/cloudinary");
const { user_roles } = require("../tools/constants/rolesConstants.js");
const { getAll } = require("./factoryHandler.js");


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
        { key: "grade", value: query.grade, operator: "equal" },
        // { key: "group", value: query.group, operator: "equal" },
        { key: "courses", value: query.courses, type: "array" },
        { key: "exams", value: query.exams, type: "array" },
    ]
} //modify it to be more frontend

// @desc get all user
// @route GET /users
// @access Private
const getUsers = getAll(UserModel, 'users', userParams)


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
        res.status(200).json({ status: statusTexts.SUCCESS, values: user })

    } else {
        const error = createError('Not found', 404, statusTexts.FAILED)
        next(error)
    }

})

// @desc create user
// @route POST /users
// @access Private
const createUser = asyncHandler(async (req, res, next) => {

    const user = req.body

    if (user.userName) {
        const foundUser = await UserModel.findOne({ userName: user.userName })
        // for exsiting user ----
        if (foundUser) {
            const error = createError("found user", 400, statusTexts.FAILED)
            next(error)
        }
    } else {
        const error = createError("no data", 400, statusTexts.FAILED)
        next(error)
    }

    // ------
    const hashedPassword = bcrypt.hashSync(user.password, 10)

    user.password = hashedPassword
    const createdUser = await UserModel.create({ ...user })

    res.status(201).json({ status: statusTexts.SUCCESS, values: createdUser, message: "user has been added successfully" })
})

// @desc update user // user profile 
// @route POST /users
// @access private   ==> admin/subAdmin
const updateUser = asyncHandler(async (req, res, next) => {

    const query = req.query
    const id = req.params.id
    const { grade, name, email, password, phone, familyPhone, isActive, role, paymentId, devicesAllowed, devicesRegistered } = req.body

    //select
    const select = query.select ? query.select : ""

    const user = await UserModel.findById(id) //.select(select) populate
    if (!user) return next(createError("No users found ..!", 404, statusTexts.FAILED))

    user.grade = grade || user.grade
    user.name = name || user.name
    user.email = email || user.email
    user.phone = phone || user.phone
    user.familyPhone = familyPhone || user.familyPhone
    user.devicesAllowed = devicesAllowed || user.devicesAllowed
    user.devicesRegistered = devicesRegistered || user.devicesRegistered

    if (user.role === user_roles.ADMIN && !isActive) return next(createError('لا يمكن الغاء تفعيل الادمن .'))
    if (user.role === user_roles.ADMIN && role !== user_roles.ADMIN) return next(createError('لا يمكن الغاء تفعيل الادمن .'))

    user.isActive = typeof isActive === "boolean" ? isActive : user.isActive
    user.role = role || user.role


    // user.payments.includes(paymentId) ?
    //     user.payments = user.payments.filter(payment => paymentId !== payment) :
    //     user.payments = [...user.payments, paymentId]

    if (password === 'reset') {
        const hashedPassword = bcrypt.hashSync(user.userName, 10)
        user.password = hashedPassword

    } else if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10)
        user.password = hashedPassword
    }

    await user.save()


    return res.status(200).json({ status: statusTexts.SUCCESS, values: user, message: "User edited successfully" })

})

// @desc update user // user profile 
// @route PUT /users
// @access Public   ==> admin/user/subAdmin
const updateUserProfile = asyncHandler(async (req, res, next) => {

    const id = req.params.id
    const { userName, name, email, password, phone, familyPhone } = req.body

    //select
    const user = await UserModel.findById(id)

    const file = req.file

    let avatar = {}

    if (file) {
        avatar = await addToCloud(file, {
            folder: userName,
            resource_type: "auto"
        })
    }
    //avater

    user.name = name || user.name
    user.email = email || user.email
    user.phone = phone || user.phone
    user.familyPhone = familyPhone || user.familyPhone

    if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10)
        user.password = hashedPassword
    }

    if (file && avatar) {
        user.avatar = avatar || user.avatar
    }

    await user.save()
    return res.status(200).json({ status: statusTexts.SUCCESS, values: user, message: "User edited successfully" })

})

// @desc update user // user profile 
// @route POST /users
// @access Private   ==> admin
const deleteUser = asyncHandler(async (req, res, next) => {

    const { id } = req.params

    const user = await UserModel.findById(id)
    // console.log(user)
    if (user.role === user_roles.ADMIN) {
        const error = createError("admin can`t be deleted", 400, statusTexts.FAILED)
        next(error)
    }

    await UserModel.findByIdAndDelete(id)
    res.status(200).json({ status: statusTexts.SUCCESS, message: "User deleted successfuly" })
})


//.findOne ==> __obj
module.exports = { getUsers, getByUserName, createUser, updateUserProfile, updateUser, deleteUser, userParams }