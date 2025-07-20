const { body } = require('express-validator');


const loginSchema = () => {
    return [
        body('userName', 'اسم المستخدم غير صالح')
            .notEmpty().escape()
            .isLength({ min: 6, max: 100 }).withMessage('يجب ان تكون اكبر من او تساوى 6 عناصر'),
        body('password', 'كلمه السر غير صالحه')
            .notEmpty().escape()
            .isLength({ min: 6, max: 100 }).withMessage('يجب ان تكون اكبر من او تساوى 6 عناصر')
    ]
}

const signupSchema = () => {
    return [
        body('name', 'الاسم غير صالح')
            .notEmpty().trim().escape()
            .isLength({ min: 6, max: 100 }).withMessage('يجب ان تكون اكبر من او تساوى 6 عناصر')
            .custom((value) => {
                // console.log('here')
                const words = value.split(/\s+/);
                // Check if there are exactly 3 words
                if (words.length !== 3) {
                    throw new Error('يجب ان يكون الاسم ثلاثى');
                }
                return true;
            }),
        body('email', 'الايميل غير صالح')
            .trim().escape()
            .isLength({ min: 6, max: 100 }).withMessage('يجب ان تكون اكبر من او تساوى 6 عناصر')
            .isEmail().withMessage('يجب ادخال ايميل صالح'),

        body('phone', 'الرقم غير صالح')
            .notEmpty().trim()
            .isLength({ min: 6, max: 100 }).withMessage('يجب ان تكون اكبر من او تساوى 6 عناصر')
            .matches(/^\d{11}$/).withMessage('يجب ان يكون 11 رقم'),
        body('familyPhone', 'الاسم غير صالح')
            .notEmpty().trim()
            .matches(/^\d{11}$/).withMessage('يجب ان يكون 11 رقم')
            .custom((value, { req }) => {
                if (value === req.body.phone) {
                    throw new Error('مينفعش هاتف ولى الامر يبقا رقمك');
                }
                return true;
            }),
        body('grade', 'يجب اختيار صف دراسى')
            .notEmpty().trim().escape().isLength({ max: 100 }).withMessage('يجب ان تكون اقل من او تساوى 100 عناصر'),

        body('government', 'يجب اختيار  محافظه')
            .notEmpty().trim().escape().isLength({ max: 100 }).withMessage('يجب ان تكون اقل من او تساوى 100 عناصر'),
        body('code')
            .trim()
            .optional()  // Only validate if this field exists in the request
            .isLength({ max: 20 }).withMessage('يجب ان تكون اقل من او تساوى 15 عناصر'),
        body('password', 'كلمه السر غير صالحه')
            .notEmpty()
            .isLength({ min: 6, max: 100 }).withMessage('يجب ان تكون اكبر من او تساوى 6 عناصر')
    ]
}


module.exports = {
    loginSchema, signupSchema
}