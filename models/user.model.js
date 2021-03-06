const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let UserSchema = new Schema({
    first_name: {type: String, required: true, max: 20},
    last_name: {type: String, required: true, max: 20},
    age: {type: Number, required: true},
    user_name: {type: String, required: true, max: 20,unique:true},
    password: {type: String, required: true, max: 20},
    created_at:{type:Date,default:new Date()},
    updated_at:{type:Date,default:new Date()}
});


// Export the model
module.exports = mongoose.model('User', UserSchema);