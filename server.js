const express = require('express')
const moment = require('moment');
const jwt = require('jsonwebtoken')
const UserModel = require('./models/UserModel');
const BlogModel = require('./models/BlogModel');
const SECRET = 'SECRET';

//导入 mongoose
const mongoose = require('mongoose');
const {DBHOST, DBPORT, DBNAME} = require('./config/config');
//连接 mongodb服务
mongoose.connect(`mongodb://${DBHOST}:${DBPORT}/${DBNAME}`);

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
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
    }, SECRET, { expiresIn: '7d' })
    res.send({
        user,
        token: token
    })
})

app.get('/api/blog/showall', async(req, res) => {
    const allblogs = await BlogModel.find().sort({time: -1})
    res.send(allblogs);
})

app.post('/api/blog/add', async(req, res) => {
    const blog = await BlogModel.create({
        ...req.body,
        time: { $currentDate: { $type: "date" } },
      })
    res.send(blog); 
})

app.delete('/api/blog/:id', async(req, res) => {
    let id = req.params.id;
    await BlogModel.deleteOne({_id: id});
    res.send('删除成功');
})

app.patch('/api/blog/:id', async(req, res) => {
    let {id} = req.params;
    const blog = BlogModel.updateOne({_id: id}, {...req.body, time: { $currentDate: { $type: "date" }}});
    res.send(blog);
  });

app.listen(3000, () => {
    console.log('ok');
});