//导入 mongoose
const mongoose = require('mongoose');    
//设置集合中文档的属性
let UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        set(val) {
            return require('bcrypt').hashSync(val, 10)
        }
    },
    nickname: {
        type: String,
        required: true,
    }
});

//创建模型对象
let UserModel = mongoose.model('Users', UserSchema);

//暴露模型对象
 module.exports = UserModel;