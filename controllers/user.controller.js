const UserModel = require('../models/user.model');
const Joi = require('joi');
const async = require('async');
const bcrypt = require('bcrypt-nodejs');
var hash = bcrypt.hashSync("bacon");

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
                    res.send({ 'error': err });
                } else {
                    next();
                }
            });
        },
        function(next){
            
            bcrypt.hash("bacon", null, null, function(err, hash) {
                if(err){
                    res.send({ 'error': err });
                }else{
                    next(null,hash);
                }
            });
        },
        function (hash,next) {
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
            res.send({ 'error': err });
        } else {
            res.status(200).send({
                'message':'user Created successfully',
                'data':result
            });
        }
    });
};


exports.getUser = function (req, res) {
    UserModel.findById(req.params.id, function (err, result) {
        if (err) return next(err);
        res.status(200).send({
            'message':'user Created successfully',
            'data':result
        });
    })
};

exports.login = function(req,res){
    async.waterfall([
        function(next){
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
        function(next){
            UserModel.find({user_name:req.body.user_name}, function (err, result) {
                if (err) return next(err);
                else{
                    next(null,result);
                }
            })
        },
        function(userData,next){
            bcrypt.compare("bacon",userData[0].password, function(err, res) {
                if(err || !res){
                    res.send({ 'error': 'Invalid password' });
                }else{
                    next(null,userData[0]);
                }
            });
        },
        function(userData,next){
            
        }
    ], function (err, result) {
        if (err) {
            res.send({ 'error': err });
        } else {
            res.status(200).send({
                'message':'user Created successfully',
                'data':result
            });
        }
    })
}