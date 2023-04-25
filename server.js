const express = require('express')
const jwt = require('jsonwebtoken')
const UserModel = require('./models/UserModel');
const SECRET = 'SECRET';

//导入 mongoose
const mongoose = require('mongoose');
const {DBHOST, DBPORT, DBNAME} = require('./config/config');
//连接 mongodb服务
mongoose.connect(`mongodb://${DBHOST}:${DBPORT}/${DBNAME}`);

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

app.post('/api/register', async(req, res) => {
    if(await UserModel.findOne({
        email: req.body.email
    })){
        return res.status(422).send({
            message: '该邮箱已被注册'
        })
    }
    if(await UserModel.findOne({
        nickname: req.body.nickname
    })){
        return res.status(422).send({
            message: '该昵称已被使用'
        })
    }
    const user = await UserModel.create({
        email: req.body.email,
        password: req.body.password,
        nickname: req.body.nickname
    })
    res.send(user);
});

app.post('/api/login', async(req, res) => {
    const user = await UserModel.findOne({
        email: req.body.email
    })
    if(!user){
        return res.status(422).send({
            message: '用户名不存在'
        })
    }
    const isPasswordValid = require('bcrypt').compareSync(
        req.body.password,
        user.password
    )
    if(!isPasswordValid){
        return res.status(422).send({
            message: '密码无效'
        })
    }
    const token = jwt.sign({
        id: String(user._id)
    }, SECRET)
    res.send({
        user,
        token: token
    })
})

app.get('/api/profile', async(req, res) => {
    const raw = String(req.headers.authorization).split(' ').pop();
    const {id} = jwt.verify(raw, SECRET);
    const user = await UserModel.findById(id);
    res.send(user);
})

app.listen(3000, () => {
    console.log('ok');
});