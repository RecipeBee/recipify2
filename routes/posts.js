var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var config = require('.././config.js');
var db = require('monk')(databaseString); //monk ODM, instead of mongoose
var multer=require('multer');
var upload = multer({ dest: 'public/images/uploads/' })

router.get('/show/:id', function(req, res, next) {  //shows posts in a single page /posts/show/:id
  var db =req.db;
  var posts= db.get('posts');
  posts.findOne({_id: req.params.id}, function(err,posts){ //finds one posts based on the url id and returns it as an object I beleive
    res.render('show', {post:posts});
  })
});


router.get('/add',auth, function(req, res, next) {     //adds a posts to site /posts/add
  var categories = db.get('categories');

  categories.find({},{}, function(err,categories){ //fetches the categories collection
      res.render('addpost', { title: 'Add Recipe', categories: categories});
  })
});

//Edit post get method
router.get('/edit/:id',auth, function(req, res, next) {  // edit post /posts/edit/:id
                                                         //fetches categories
        var posts = db.get('posts');
        var categories = db.get('categories');
        posts.findOne({_id: req.params.id},function(err,post){
              if(err)throw error;
              categories.find({},{}, function(err,cats){
                  if(err)throw error;
                  res.render('editpost', { title: 'Edit Recipe', categories: cats, post:post});
                  console.log("HERE ARE CATEGORIES: " + cats[0].title);
                  console.log("HERE IS THE POST: " + post._id + " " + post.title + " " + post.body  + " " + post.category  +" " + post.author  +" " +post.date )
              });// find categories
        }); //find posts
}); //router.get for posts/edit/:id

router.post('/edit/:id',upload.single('mainimage'), function(req,res,next){ // post metho for /posts/edit
        //get form values
        var postid = req.params.id
        console.log("Look here!!!");
        console.log(postid);
        var title = req.body.title;
        var body = req.body.body;
        var category = req.body.category;
        var author = req.body.author;
        var date = new Date();
        var currentImage = req.body.currentImage;
        console.log(currentImage);

        if(req.file){
          var mainImageOriginalName = req.file.originalname;
          var mainImageName = req.file.filename;
          var mainImageMime = req.file.mimetype;
          var mainImagePath = req.file.path;
          var mainImageExt = req.file.extension;
          var mainImageSize = req.file.size;
        }else{
          var mainImageName = currentImage;
        }
        req.checkBody('title', 'Title field is requires').notEmpty();
        req.checkBody('body', 'body field is requires').notEmpty();
        var errors = req.validationErrors();
        if(errors){
            var categories = db.get('categories');
            categories.find({},{}, function(err,categories){
              res.render('addpost', {errors:errors, title:title, categories:categories});
            });
        }
        else{
            var posts=db.get('posts');
            posts.findOneAndUpdate({_id:postid},{
                "title":title,
                "body":body,
                "category":category,
                "date":date,
                "author":author,
                "mainimage":mainImageName
            }, function(err,post){
                if(err) {
                  res.send('Error!!');
                }
                else{
                  req.flash('success', 'Post Edited');
                  res.location('/');
                  res.redirect('/');
                }
            });
        }
});

router.get('/delete/:id',auth, function(req, res, next) {
    var posts=db.get('posts');
    posts.remove({_id: req.params.id})
    req.flash('success', 'Post Deleted');
    res.location('/');
    res.redirect('/');
});

router.post('/add',upload.single('mainimage'), function(req,res,next){
  //get form values
  var title = req.body.title;
  var body = req.body.body;
  var category = req.body.category;
  var author = req.body.author;
  var date = new Date();

  if(req.file){
    var mainImageOriginalName = req.file.originalname;
    var mainImageName = req.file.filename;
    var mainImageMime = req.file.mimetype;
    var mainImagePath = req.file.path;
    var mainImageExt = req.file.extension;
    var mainImageSize = req.file.size;
  }else{
    var mainImageName = 'noimage.jpg';
  }

 req.checkBody('title', 'Title field is requires').notEmpty();
 req.checkBody('body', 'body field is requires').notEmpty();
 var errors = req.validationErrors();
 if(errors){
    var categories = db.get('categories');
    categories.find({},{}, function(err,categories){
       res.render('addpost', {errors:errors, title:title, categories:categories})
   })

 }else{
    var posts=db.get('posts');
    posts.insert({
      "title":title,
      "body":body,
      "category":category,
      "date":date,
      "author":author,
      "mainimage":mainImageName
    }, function(err,post){
      if(err) {
        res.send('Error!!');
      }
      else{
        req.flash('success', 'Post Submitted');
        res.location('/');
        res.redirect('/');
      }
    });
 }
})


router.post('/addcomment', function(req,res,next){
  //get form values
  var name = req.body.name;
  var email = req.body.email;
  var body = req.body.body;
  var postid = req.body.postid;
  var commentdate = new Date();
 console.log(name,email,body)
 req.checkBody('name', 'Name field is requires').notEmpty();
 req.checkBody('email', 'Email field is requires').notEmpty();
 req.checkBody('email', 'Email is not formatted correctly').isEmail();
 req.checkBody('body', 'Body field is requires').notEmpty();
 var errors = req.validationErrors();
 if(errors){
        var posts = db.get('posts');
        posts.findOne({_id:postid}, function(err,posts){
          console.log(posts);
           res.render('show', {errors:errors, post:posts})
       });
 }else{
        var comments = {"name":name, "email":email, "body":body, "commentdate":commentdate}
        var posts = db.get('posts');
        posts.update({"_id":postid},{$push:{comments}}, function(err,doc){
                if(err){
                      throw err;
                }else{
                  req.flash('success', 'Comment Added');
                  res.location('/posts/show/'+postid);
                  res.redirect('/posts/show/'+postid);
                }
        });
      }
});

function auth(req,res, next){ // before you try to show user the homepage, check the auth middleware function, if the request .isAuthenticated() property is true, then skip to callback and render index.js
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/users/login'); // Else redirect user to login page
}
module.exports = router;
