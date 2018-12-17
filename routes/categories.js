var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var db = require('monk')('mongodb://alfred:password00@ds249233.mlab.com:49233/msin636');

router.get('/add',auth, function(req, res, next) {
  var categories = db.get('categories');
  categories.find({},{},function(err,categories){
    res.render('addcategory', {title:"Add Category", categories: categories});
  });
});

router.get('/delete/:id',auth, function(req, res, next) {
  var categories = db.get('categories');
    categories.remove({_id: req.params.id})
    req.flash('success', 'Category Deleted');
    res.location('/categories/add');
    res.redirect('/categories/add');
});


router.get('/show/:category', function(req, res, next){
var db = req.db;
var posts = db.get('posts');
posts.find({category: req.params.category},{},  function(err, posts){
  res.render('index', {title: req.params.category, posts: posts})
})

});

router.post('/add',auth, function(req, res, next){
var title = req.body.title;
 req.checkBody('title', 'title field id required').notEmpty();
  var errors = req.validationErrors();
  if(errors){
    var categories = db.get('categories');
    categories.find({},{},function(err,categories){
      res.render('addcategory', {title:"Add Category", errors: errors, categories: categories});
    });
  }else{
    var categories = db.get('categories');
    categories.insert({"title" : title}, function(err,category){
        req.flash('success', 'Category Submitted');
        res.location('/categories/add');
        res.redirect('/categories/add');
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
