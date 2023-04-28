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
    user_id: {
        type: String,
        required: true,
    },
    time: {
        type: Date,
        required: true
    }
});

//创建模型对象
let BlogModel = mongoose.model('Blogs', BlogSchema);

//暴露模型对象
 module.exports = BlogModel;