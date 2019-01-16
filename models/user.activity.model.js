const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let UserActivitySchema = new Schema({
    user_id: {type: mongoose.Schema.Types.ObjectId, required: true,},
    ip: {type: String, required: true, max: 20},
    created_at:{type:Date,default:new Date()},
    updated_at:{type:Date,default:new Date()}
});


// Export the model
module.exports = mongoose.model('user_activity', UserActivitySchema);