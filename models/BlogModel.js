//导入 mongoose
const mongoose = require('mongoose');    
//设置集合中文档的属性
let BlogSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
    },
    tag: {
        type: String,
        required: true,
    },
    nickname: {
        type: String,
        required: true,
    },
    time: {
        type: Date,
        required: true,
        default: Date.now
    },
    like: {
        type: Number,
        default: 0
    }
});

//创建模型对象
let BlogModel = mongoose.model('Blogs', BlogSchema);

//暴露模型对象
 module.exports = BlogModel;