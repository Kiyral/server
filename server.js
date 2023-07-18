const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const SECRET = 'SECRET';
const mysql = require('mysql');
const { DBHOST, DBPORT, DBNAME, DBUSER, DBPASSWORD } = require('./config/config');

// 创建 MySQL 连接池
const connection = mysql.createConnection({
  host: DBHOST,
  port: DBPORT,
  user: DBUSER,
  password: DBPASSWORD,
  database: DBNAME
});

// 连接到 MySQL 数据库
connection.connect((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
  } else {
    console.log('Connected to MySQL database');
    // 执行其他操作或处理
  }
});

const sequelize = new Sequelize(DBNAME, DBUSER, DBPASSWORD, {
    host: DBHOST,
    port: DBPORT,
    dialect: 'mysql',
    // 其他 Sequelize 配置选项...
  });

const UserModel = sequelize.define('UserModel', {
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    nickname: {
        type: Sequelize.STRING,
        allowNull: false
    }
})

const BlogModel = sequelize.define('BlogModel', {
    content: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    tag: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    nickname: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP')
      }
})

// 同步模型与数据库表
sequelize.sync()
  .then(() => {
    console.log('Models synchronized with database.');
  })
  .catch(error => {
    console.error('Unable to sync models with database:', error);
  });

  BlogModel.beforeCreate((instance, options) => {
    instance.time = new Date();
  });

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:4000', // 允许的请求来源
    methods: ['GET', 'POST', 'DELETE', 'PATCH'], // 允许的请求方法
  }));


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
  });

  app.post('/api/register', (req, res) => {
    const { email, password, nickname } = req.body;
  
    // 检查邮箱是否已被注册
    connection.query(
      'SELECT * FROM usermodels WHERE email = ?',
      [email],
      (error, results) => {
        if (error) {
          console.error('Error executing MySQL query:', error);
          return res.status(500).send({
            message: '服务器内部错误'
          });
        }
        if (results.length > 0) {
          return res.status(422).send({
            message: '该邮箱已被注册'
          });
        }
  
        // 检查昵称是否已被使用
        connection.query(
          'SELECT * FROM usermodels WHERE nickname = ?',
          [nickname],
          (error, results) => {
            if (error) {
              console.error('Error executing MySQL query:', error);
              return res.status(500).send({
                message: '服务器内部错误'
              });
            }
            if (results.length > 0) {
              return res.status(422).send({
                message: '该昵称已被使用'
              });
            }
  
            // 创建新用户
            connection.query(
              'INSERT INTO usermodels (email, password, nickname) VALUES (?, ?, ?)',
              [email, password, nickname],
              (error, results) => {
                if (error) {
                  console.error('Error executing MySQL query:', error);
                  return res.status(500).send({
                    message: '服务器内部错误'
                  });
                }
                const user = {
                  email: req.body.email,
                  password: req.body.password,
                  nickname: req.body.nickname
                };
                res.send(user);
              }
            );
          }
        );
      }
    );
  });

  app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
  
    // 查询用户
    connection.query(
      'SELECT * FROM usermodels WHERE email = ?',
      [email],
      (error, results) => {
        if (error) {
          console.error('Error executing MySQL query:', error);
          return res.status(500).send({
            message: '服务器内部错误'
          });
        }
  
        if (results.length === 0) {
          return res.status(422).send({
            message: '用户名不存在'
          });
        }
  
        const user = results[0];
  
        // 比较密码
        if (password !== user.password) {
          return res.status(422).send({
            message: '密码无效'
          });
        }
  
        // 创建 JWT Token
        const token = jwt.sign({ id: String(user.id) }, SECRET, { expiresIn: '7d' });
  
        res.send({
          user,
          token
        });
      }
    );
  });


  app.post('/api/blogs', (req, res) => {
    const { content, tag, nickname } = req.body;
    const regex = `%${content}%`; // MySQL中的LIKE查询通配符
  
    let query = 'SELECT * FROM blogmodels WHERE';
  
    if (nickname) {
      query += ' nickname = ?';
      connection.query(query, [nickname], (error, results) => {
        if (error) {
          console.error('Error executing MySQL query:', error);
          return res.status(500).send({
            message: '服务器内部错误'
          });
        }
        res.send(results);
      });
    } else {
      query += ' tag = ? AND content LIKE ?';
      connection.query(query, [tag, regex], (error, results) => {
        if (error) {
          console.error('Error executing MySQL query:', error);
          return res.status(500).send({
            message: '服务器内部错误'
          });
        }
        res.send(results);
      });
    }
  });
  

app.post('/api/blog/add', (req, res) => {
    const { content, tag, nickname } = req.body;
  
    const query = 'INSERT INTO blogmodels (content, tag, nickname) VALUES (?, ?, ?)';
    connection.query(query, [content, tag, nickname], (error, results) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        return res.status(500).send({
          message: '服务器内部错误'
        });
      }
  
      const blog = {
        content: req.body.content,
        tag: req.body.tag,
        nickname: req.body.nickname
      };
      res.send(blog);
    });
});

app.post('/api/blog/delete', (req, res) => {
    const { id } = req.body;
  
    const query = 'DELETE FROM blogmodels WHERE id = ?';
    connection.query(query, [id], (error, results) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        return res.status(500).send({
          message: '服务器内部错误'
        });
      }
  
      res.send(results);
    });
  });

  app.post('/api/blog/modify', (req, res) => {
    const { content, id } = req.body;
  
    const query = 'UPDATE blogmodels SET content = ? WHERE id = ?';
    connection.query(query, [content, id], (error, results) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        return res.status(500).send({
          message: '服务器内部错误'
        });
      }
  
      const blog = {
        id: req.body.id,
        content: req.body.content
      };
      res.send(blog);
    });
  });

app.listen(3000, () => {
    console.log('ok');
});