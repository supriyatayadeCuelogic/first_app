const UserModel = require('../models/user.model');
const userActivityModel = require('../models/user.activity.model');
const Joi = require('joi');
const async = require('async');
const bcrypt = require('bcrypt-nodejs');
var hash = bcrypt.hashSync("bacon");
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const requestIp = require('request-ip');
const responseHandler = require('../util/responseHandler');

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
                    responseHandler.sendError(err, res);
                } else {
                    next();
                }
            });
        },
        function (next) {
            UserModel.find({ user_name: req.body.user_name }, function (err, result) {
                if (err || result) {
                    responseHandler.sendError('Username already exists', res);
                } else {
                    next();
                }
            })
        },
        function (next) {
            bcrypt.hash("bacon", null, null, function (err, hash) {
                if (err) {
                    responseHandler.sendError(err, res);
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
            responseHandler.sendError(err, res);
        } else {
            var data = {
                first_name: result.first_name,
                last_name: result.last_name,
                age: result.age,
                user_name: result.user_name,
                id: result._id
            }
            responseHandler.sendData(data, res);
        }
    });
};

exports.getUser = function (req, res) {
    UserModel.findById(req.params.id, { first_name: true, last_name: true, user_name: true }, function (err, result) {
        if (err) {
            responseHandler.sendError(err, res);
        } else {
            responseHandler.sendData(result, res);
        }

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
                    responseHandler.sendError(err, res);
                } else {
                    next();
                }
            });
        },
        function (next) {
            UserModel.find({ user_name: req.body.user_name }, function (err, result) {
                if (err) {
                    responseHandler.sendError(err, res);
                }
                else {
                    next(null, result);
                }
            })
        },
        function (userData, next) {
            bcrypt.compare("bacon", userData[0].password, function (err, res) {
                if (err || !res) {
                    responseHandler.sendError('Invalid password', res);
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
            return responseHandler.sendError(err, res);
        } else {
            let token = jwt.sign({ username: result.user_name, user_id: result._id },
                config.secret,
                {
                    expiresIn: '24h'
                }
            );
            var user = {
                first_name: result.first_name,
                last_name: result.last_name,
                age: result.age,
                user_name: result.user_name,
                id: result._id
            }
            var data = { user: user, token: token };
        }
        responseHandler.sendData(data, res);
    })
}

exports.getAllUser = function (req, res) {
    UserModel.find({}, { first_name: true, last_name: true, user_name: true }, function (err, result) {
        if (err) {
            responseHandler.sendError(err, res);
        } else if (result) {
            responseHandler.sendData(result, res);
        } else {
            responseHandler.sendError('No record found', res);
        }
    }).limit(req.body.limit || 10).skip(req.body.offset || 0);
};

exports.validateToken = function (req, res, next) {
    if (!req.headers['authorization']) {
        responseHandler.sendError('Auth Token required', res);
    }

    let token = req.headers['authorization'];

    if (token.startsWith('Bearer ') || token.startsWith('bearer ')) {
        token = token.slice(7, token.length);
    }

    if (token) {
        jwt.verify(token, config.secret, (err, decoded) => {
            if (err) {
                responseHandler.sendError('Token is not valid', res);
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        responseHandler.sendError('Auth token is not supplied', res);
    }
};

exports.update = function (req, res) {
    async.waterfall([
        function (next) {
            UserModel.findByIdAndUpdate(req.params.id, { $set: req.body }, function (err, result) {
                if (err) { responseHandler.sendError('Invalid user', res); }
                else {
                    next(null, result);
                }
            })
        },
    ], function (err, result) {
        if (err) {
            responseHandler.sendError(err, res);
        } else {
            responseHandler.sendData({}, res);
        }
    });
};

exports.getLoginUsers = function (req, res) {
    async.waterfall([
        function (next) {
            let dt = new Date();
            userActivityModel.find({ 'created_at': { $lte: dt } }, function (err, result) {
                if (err) {
                    responseHandler.sendError(err, res);
                } else if (result) {
                    responseHandler.sendData(result, res);
                } else {
                    responseHandler.sendError('No record found', res);
                }
            });
        }
    ])
}