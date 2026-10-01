import mongoose from 'mongoose';

import UnitModel from './UnitModel.js';
import CourseModel from './CourseModel.js';
import VideoModel from './VideoModel.js';
import sectionConstants from '../tools/constants/sectionConstants.js';
import ExamModel from './ExamModel.js';
import LinkModel from './LinkModel.js';
import FileModel from './FileModel.js';
import GroupModel from './GroupModel.js';


const lectureSchema = new mongoose.Schema({
    grade: { type: Number, required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: CourseModel },
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'chapter' },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'lecture' },
    isSalable: Boolean,

    name: { type: String, required: true },
    description: { type: String, required: true },
    isActive: { type: Boolean, required: true, default: true },
    isCommunity: { type: Boolean, default: true },

    dateStart: { type: Date },
    dateEnd: { type: Date },
    isMust: { type: Boolean, default: false },
    isCenter: { type: Boolean },
    isFree: { type: Boolean, },
    price: Number,

    index: { type: Number, required: true },
    sectionType: { type: String, required: true, enum: [sectionConstants.VIDEO, sectionConstants.EXAM, sectionConstants.LINK, sectionConstants.FILE] },
    video: {
        type: mongoose.Schema.Types.ObjectId, ref: VideoModel
    },
    summary: String,
    exam: { type: mongoose.Schema.Types.ObjectId, ref: ExamModel },
    link: { type: mongoose.Schema.Types.ObjectId, ref: LinkModel },
    file: { type: mongoose.Schema.Types.ObjectId, ref: FileModel },
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: GroupModel }],
    codes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'code' }]
}, {
    timestamps: true,
    versionKey: false
})


// Auto populate 'exam' and 'exam.questions'
function autoPopulateExam(next) {
    this.populate({
        path: 'exam',
        populate: {
            path: 'questions', // inside exam, populate questions too
        }
    });
    next();
}

lectureSchema.pre('find', autoPopulateExam);
lectureSchema.pre('findOne', autoPopulateExam)


const LectureModel = mongoose.model("lecture", lectureSchema)
export default LectureModel;