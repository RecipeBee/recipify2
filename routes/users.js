var express = require('express'); // require express framework
var router = express.Router(); // create a route
var multer  = require('multer') // require multer for file uploads
var upload = multer({ dest: 'public/uploads/' }) // point the uploads folder for multer
var User = require('../modules/user'); // require the user.js local module
var nodemailer = require('nodemailer');
var flash= require('connect-flash'); // reiquire connect -flash for flash messages
var session = require('express-session'); // express-session may be needed to work with passport
var passport = require('passport'); // require passport for authentication 
var LocalStrategy = require('passport-local').Strategy //use the local strategy for passport
var server_errors = []; // array for server-error
router.get('/signup', function(req, res, next) {  //when there is a get request for signup page , render 'signup' view and send title variable with the value of "Sign up"
  res.render('signup', { title: 'Sign up' });
});

router.get('/login', function(req, res, next) { //When there is a get request for login page render 'login' view and send title variable with "Login" value
  res.render('login', { title: 'Login' });
});


router.get('/logout', function(req,res){
  req.logout();                                       //Passport: terminate a login session
  req.flash('success', 'You are now logged out');      //connect-flash
  res.redirect('/users/login');
});



router.post('/login', // when there is a post request in login route authenticate locally
  passport.authenticate('local', { failureRedirect: '/users/login', failureFlash: ' Invalid Username or Password'}), // if fails redict and show message
 function(req, res) {
    req.flash('success', 'You are now logged in'); //else  success message and redirect to homepage
    res.redirect('/');
  });

router.post('/signup',upload.single('avatar'), function(req, res, next) { //When there is a post request to signup page, upload a single file from a form field called avatar, then do the callback function
	
    var name = req.body.name;  // assgin value of name field to name variable
    var email = req.body.email; //assign value of email field to email variable
    var username = req.body.username; // assign the value of username to username variable 
    var password = req.body.password; // assign the value of password to password variable
    var password2 = req.body.password2; // assign the value fo password2 to password2 variable
    var name = req.body.name; // duplicate
    
	if(req.file){ // if request has file 
      var profileimage = "/uploads/"+ req.file.filename; // then save it as this filename
      console.log(req.file);
    }else{
      var profileimage = '/uploads/noimage.jpg'; // else use the dummy image profile for picture
    }

    //express expressValidator
    req.checkBody('name', 'Name field is required').notEmpty(); // checking request body for name field it is required and cannot be empty
    req.checkBody('email', 'Email field is required').notEmpty(); // check the email field, it is required and cannot be empty
    req.checkBody('email', 'Email is not valid ').isEmail(); //check the email field again, make sure it is email
    req.checkBody('username', 'Username field is required').notEmpty(); // check the username field and make sure it is not empty
    req.checkBody('password', 'password field is required').notEmpty(); //check the password field and make sure it is not empty
    req.checkBody('password2', 'Password do not match').equals(req.body.password); // check the password2 field and make sure it equals to the password 1
    // check errors
	

		
    var errors = req.validationErrors(); // get the validation errors

    if(errors){ // if there is an error, render signup page, and send these variables errors, server_errors, and title along with their values
      res.render('signup', {errors: errors, server_errors:server_errors, title:'Sign up'})
	  
    }else{
      var newUser = new User({ //else create a new user in database with the following values
        name: name,
        email: email,
        username: username,
        password: password,
        profileimage: profileimage,
        forgotpassword: false  // STEP 3 OF THE INSTRUCTION
      });
	  

      User.createUser(newUser, function(err,user){
        if(err) throw err;
        console.log(user);
      });
      req.flash('success', 'You are now registered and can login in ');
      res.location('/');
      res.redirect('/');
    }
  });


passport.serializeUser(function(user,done){
  done(null, user.id);
});

passport.deserializeUser(function(id,done){
  User.getUserById(id,function(err,user){
    done(err,user);
  });
});

passport.use(new LocalStrategy(function(username, password, done){
  User.getUserByUsername(username, function(err, user){
    if (err) throw err;
    if(!user){
      return done(null, false,{message:'Unkown User'});
    }
    User.comparePassword(password, user.password, function(err,isMatch){
      if(err) return done(err);
      if(isMatch){
        return done(null, user);
      }else {
        return done(null, false, {message:'Invalid Passowrd'});
      }
    });
  });
}));


// STEP 5 OF THE INSTRUCTIONS

router.get('/forgot', function(req, res, next) { //When there is a get request for login page render 'login' view and send title variable with "Login" value
  res.render('forgot', { title: 'Forgotten Info' });
});

router.post('/forgot', function(req,res){
    var email = req.body.email;
    req.checkBody('email', 'Email field is required').notEmpty();
    var errors = req.validationErrors(); 
    console.log(errors);

    if(errors){ // if there is an error, render forgot page, and send these variables errors, server_errors, and title along with their values
           res.render('forgot', {errors: errors, server_errors:server_errors, title:'Forgotten Email Error'})
    }else{
          User.checkEmail(email, function(error,dbemail){
      if(error) return error;
      
      if(dbemail){
              console.log("email exists")
              User.forgotPasswordUpdate(email, function(err, updated){
                if(error) return error;
                console.log("The forgotpassword field has updated to true.");
              });

              // lets create password change link
              User.passwordLinkId(email, function(err, id){
              if(err) throw error;
               var link = 'http://localhost:3000/users/reset/' + id._id;
              console.log(link);
              // Time to send the user an email with the change password link
              // create transport
                           var transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth:{
                                user: 'touro.msin.636@gmail.com',
                                pass: 'tourocollege'
                            }
                        });
                        var mailOptions = {
                            from: "",
                            to: email,
                            subject: "Change Password Request",
                            html:
                               `<html><head></head> <body>
                               <p>Please use this link <a href='${link}'>${link}</a> to recover your password.<br/><br/>
                               Thank you,<br/><br/>Site Webmaster
                            </p>
                            </body>
                            </html>
                            `  };
                        transporter.sendMail(mailOptions, (err, info) => {
                            if(err) console.log("Error sending mail");
                            console.log('mail sent' + info.response);
                        });
                                             
                          //Render the same page back to user with a success message
                          res.render('forgot', { success: `password recovery email has been sent to ${email}, you can check your email now. `,title: 'Password Recovery Mail Sent' });

              });
          
                  
            }else{
                        console.log("No such email");
                        errors=[{msg: 'No such email registerd in our site.'}];
                         res.render('forgot', {errors: errors, server_errors:server_errors,  title:'No Such Email'});
           
                    }


         });
   
          }

  
        });

// STEP 6 OF THE INSTRUCTION
router.get('/reset/:id', function(req,res){
  var id = req.params.id;
  console.log(id);
  User.checkId(id, function(err,doc){
    if(err) throw error;
    if(doc){
      console.log("Id is real");
      console.log(doc.forgotpassword);
          if(doc.forgotpassword){
            console.log("ID is real and forgotpassword is True")  
            res.render('reset', {title:'Password Reset Page'});
          }else{
            console.log("The user is didn't request a password change, somebody is trying to hack");
          }  

    }else{
      console.log("Id is fake")
    }
  });//User.checkId

 



});//router.get

router.post('/reset/:id', function(req,res){
  var id = req.params.id;
  console.log(id);
  User.checkId(id, function(err,doc){
    if(err) throw error;
    if(doc){
      console.log("Id is real");
      console.log(doc.forgotpassword);
          if(doc.forgotpassword){
            console.log("ID is real and forgotpassword is True")  
            var newpassword1 = req.body.newpassword1; // assign the value of password to password variable
            var newpassword2 = req.body.newpassword2; // assign the value fo password2 to password2 variable    
            req.checkBody('newpassword1', 'New password field is required').notEmpty();
            req.checkBody('newpassword2', 'Password do not match').equals(req.body.newpassword1);
            // check errors            
            var errors = req.validationErrors(); // get the validation errors
                        if(errors){
                        res.render('reset', {errors: errors, server_errors:server_errors,  title:'Reset Password Error'});
                        }else{
                          console.log(newpassword1);
                          //Finally, Finally
                          console.log(doc.password)
                          console.log(doc.forgotpassword)
                          User.hashPassword(newpassword1,function(error,hash){
                               console.log(hash);
                               User.updatePassword(id,hash,function(err,data){
                                 if(err) throw error;
                                 
                                 res.render('login',{success:'you have updated your password. Try to login now.',title:'Update Successful'});
                               });
                          });//hash password
                        }
          }else{
            console.log("The user didn't request a password change, somebody is trying to hack");
          }  

    }else{
      console.log("Id is fake")
    }
  });//User.checkId

 



});//router.post

module.exports = router;
