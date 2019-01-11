const UserModel = require('../models/user.model');
const userActivityModel = require('../models/user.activity.model');
const Joi = require('joi');
const async = require('async');
const bcrypt = require('bcrypt-nodejs');
var hash = bcrypt.hashSync("bacon");
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const requestIp = require('request-ip');

//Simple version, without validation or sanitation
exports.test = function (req, res) {
    res.send('Greetings from the Test controller!');
};


exports.create = function (req, res) {
    async.waterfall([
        function (next) {
            const schema = Joi.object().keys({
                first_name: Joi.string().alphanum().min(3).max(30).required(),
                last_name: Joi.string().alphanum().min(3).max(30).required(),
                user_name: Joi.string().alphanum().min(3).max(30).required(),
                password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/),
                age: Joi.number().integer().min(18).max(70)
            });

            Joi.validate(req.body, schema, function (err, value) {
                if (err) {
                    res.json({
                        success: false,
                        message: 'Operation failed',
                        errors: err
                    });
                } else {
                    next();
                }
            });
        },
        function(next){
            UserModel.find({user_name: req.body.user_name}, function (err, result) {
                if (err || result){
                    res.status(200).json({
                        success:false,
                        'message': 'Username already exists',                        
                    });
                }else{
                    next();
                }                
            })
        },
        function (next) {
            bcrypt.hash("bacon", null, null, function (err, hash) {
                if (err) {
                    res.json({
                        success: false,
                        message: 'Operation failed',
                        errors: err
                    });
                } else {
                    next(null, hash);
                }
            });
        },
        function (hash, next) {
            let user = new UserModel(
                {
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    age: req.body.age,
                    user_name: req.body.user_name,
                    password: hash,
                }
            );

            user.save(function (err, data) {
                next(err, data);
            });
        }
    ], function (err, result) {
        if (err) {
            res.json({
                success: false,
                message: 'Operation failed',
                errors: err
            });
        } else {
            res.status(200).json({
                success: false,
                message: 'Operation successfull',
                data: {
                    first_name: result.first_name,
                    last_name: result.last_name,
                    age: result.age,
                    user_name: result.user_name,
                    id: result._id
                }
            });
        }
    });
};

exports.getUser = function (req, res) {
    UserModel.findById(req.params.id, { first_name: true, last_name: true, user_name: true }, function (err, result) {
        if (err) return res.send({ 'error': err });;
        res.status(200).send({
            'message': 'Operation Successfull',
            'data': result
        });
    })
};

exports.login = function (req, res) {
    async.waterfall([
        function (next) {
            const schema = Joi.object().keys({
                user_name: Joi.string().alphanum().min(3).max(30).required(),
                password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/)
            });

            Joi.validate(req.body, schema, function (err, value) {
                if (err) {
                    res.send({ 'error': err });
                } else {
                    next();
                }
            });
        },
        function (next) {
            UserModel.find({ user_name: req.body.user_name }, function (err, result) {
                if (err) return next(err);
                else {
                    next(null, result);
                }
            })
        },
        function (userData, next) {
            bcrypt.compare("bacon", userData[0].password, function (err, res) {
                if (err || !res) {
                    res.send({ 'error': 'Invalid password' });
                } else {
                    next(null, userData[0]);
                }
            });
        },
        function (userData, next) {
            //save user activity 
            let userActivity = userActivityModel({
                user_id: userData._id,
                ip: requestIp.getClientIp(req)
            });
            userActivity.save(function (err, data) {
                next(err, userData);
            });
        }
    ], function (err, result) {
        if (err) {
            res.send({ 'error': err });
        } else {
            let token = jwt.sign({ username: result.user_name, user_id: result._id },
                config.secret,
                {
                    expiresIn: '24h'
                }
            );
            res.status(200).send({
                'message': 'User Created successfully',
                'data': {
                    first_name: result.first_name,
                    last_name: result.last_name,
                    age: result.age,
                    user_name: result.user_name,
                    id: result._id
                },
                token: token
            });
        }
    })
}

exports.getAllUser = function (req, res) {
    UserModel.find({}, { first_name: true, last_name: true, user_name: true }, function (err, result) {
        if (err) return res.send({ 'error': err });;
        res.status(200).send({
            'message': 'Operation Successfull',
            'data': result
        });
    }).limit(req.body.limit || 10).skip(req.body.offset || 0);
};

exports.validateToken = function (req, res, next) {
    if (!req.headers['authorization']) {
        return res.json({
            success: false,
            message: 'Auth Token required'
        });
    }

    let token = req.headers['authorization'];

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    if (token) {
        jwt.verify(token, config.secret, (err, decoded) => {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Token is not valid'
                });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        return res.json({
            success: false,
            message: 'Auth token is not supplied'
        });
    }
}

exports.update = function (req, res) {
    async.waterfall([
        function (next) {
            UserModel.findByIdAndUpdate(req.params.id,{$set: req.body}, function (err, result) {
                if (err) return res.send({ 'error': 'Invalid user' });
                else {
                    next(null,result);
                }
            })
        },
    ], function (err, result) {
        if (err) {
            res.json({
                success: false,
                message: 'Operation failed',
                errors: err
            });
        } else {
            res.status(200).json({
                success: false,
                message: 'Operation successfull',
            });
        }
    });
}