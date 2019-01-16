

exports.sendData= function(data,res){
    res.json({
        success: true,
        message: 'Operation successful',
        data: data
    });
}

exports.sendError= function(err,res){
    res.json({
        success: false,
        message: 'Operation failed',
        errors: err
    });
}