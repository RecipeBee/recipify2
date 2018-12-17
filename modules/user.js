
//This is a local module file that will be exported to other parts of the program

var mongoose = require('mongoose'); // require mongoose ORM
var bcrypt = require('bcrypt-nodejs'); // for password encryption

// mongoose.connect('mongodb://alfred:password00@ds249233.mlab.com:49233/msin636',{useNewUrlParser:true});
mongoose.connect('mongodb://olegsaidov:abc123@ds155313.mlab.com:55313/olegdb', {useNewUrlParser: true}); // for database connection

var UserSchema = mongoose.Schema({ // create a user schema, create user table alternative for sql
  username:{type: String},
  password:{type: String},
  email:{type: String},
  name:{type: String },
  profileimage:{type: String},
  forgotpassword:{type: Boolean}  //STEP 2 OF THE INSTRUCTION
  });

var User = module.exports = mongoose.model('User', UserSchema) // createing a user model from UserSchema

module.exports.getUserById=function(id,callback){ // custom property for module.exports to retriev a user by his id
  User.findById(id,callback);
}

module.exports.getUserByUsername = function(username,callback){ // custom property for module.exports to retriev a user by his username
  var query = {username:username};
  User.findOne(query, callback);
}

module.exports.comparePassword = function(canidatePassword, hash, callback){ // custom property for module.exports to compare hashed passwords
  bcrypt.compare(canidatePassword, hash, function(err, res) {
      callback(null,res);
  });

};


module.exports.createUser = function(newUser, callback){                      //custom property for module.exports to create a new user
    bcrypt.hash(newUser.password, null, null, function(err, hash) {
        newUser.password = hash;
        newUser.save(callback);
    });


   

};

// More functions for lost password
module.exports.checkEmail= function(email, callback){
  var query = {email:email};
  User.findOne(query,callback);
}; 
 
module.exports.forgotPasswordUpdate = function(email, callback){
var query ={email:email};  
User.findOneAndUpdate(query, {forgotpassword: true}, callback);

}

module.exports.passwordLinkId = function(email, callback){
  var query = {email:email};
  User.findOne(query, '_id', callback);
}

module.exports.checkId=function(id,callback){ 
  User.findById(id,callback);
}

module.exports.hashPassword = function(pass, callback){
    const saltRounds = 10;
    bcrypt.genSalt(saltRounds,function(error, salt){
      if(error)throw error;
      bcrypt.hash(pass, salt, null, callback)
    });
}

module.exports.updatePassword = function(id, pass, callback){
  var query = {password:pass, forgotpassword:false};
  User.findByIdAndUpdate(id,query, callback);
}