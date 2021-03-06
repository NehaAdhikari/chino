var reqProduct = require('../app/models/reqProd');
var users = require('../app/models/user');
var Cart = require('../app/models/cart');


var Product = require('../app/models/product');
var Order = require('../app/models/order');

module.exports = function(app, passport) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs',{
            user : req.user
        });
    });

    app.get('/contact', function(req, res) {
        res.render('contact.ejs',{
            user : req.user
        });
    });

    app.get('/product', function(req, res) {
    var successMsg = req.flash('success')[0];
    var addedMsg = req.flash('addedtocart')[0];
    Product.find(function(err, docs) {
    var productChunks = [];
    var chunkSize = 3;
    for (var i = 0; i < docs.length; i += chunkSize) {
      productChunks.push(docs.slice(i, i + chunkSize));
    }
        res.render('product.ejs',{
            title: 'Products',
            user : req.user,
            products: productChunks,
            addedMsg: addedMsg,
            noaddedMsg: !addedMsg,
            successMsg: successMsg,
            noMessages: !successMsg
        });
    });
});

    app.get('/add-to-cart/:id', function(req, res, next) {
      var productId = req.params.id;
      var cart = new Cart(req.session.cart ? req.session.cart : {});


      Product.findById(productId, function(err, product) {
        if (err) {
          return res.redirect('/product');
        }
        cart.add(product, product.id);
        req.session.cart = cart;
        req.flash('addedtocart', 'Added to cart.');
        res.redirect('/product');
      });
    });

    app.get('/reduce/:id', function(req, res, next) {
      var productId = req.params.id;
      var cart = new Cart(req.session.cart ? req.session.cart : {});

      cart.reduceByOne(productId);
      req.session.cart = cart;
      res.redirect('/shopping-cart');
    });

    app.get('/remove/:id', function(req, res, next) {
      var productId = req.params.id;
      var cart = new Cart(req.session.cart ? req.session.cart : {});

      cart.removeItem(productId);
      req.session.cart = cart;
      res.redirect('/shopping-cart');
    });

    app.get('/shopping-cart', function(req, res, next) {
      if (!req.session.cart) {
        return res.render('shopping-cart.ejs', {
          user : req.user,
          products: null
        });
      }
      var cart = new Cart(req.session.cart);
      res.render('shopping-cart.ejs', {
        products: cart.generateArray(),
         user : req.user,
        totalPrice: cart.totalPrice
      });
    });

    app.get('/checkout', isLoggedIn, function(req, res, next) {
      if (!req.session.cart) {
        return res.redirect('/shopping-cart');
      }
      var cart = new Cart(req.session.cart);
      var errMsg = req.flash('error')[0];
      res.render('checkout.ejs', {
        total: cart.totalPrice,
        user: req.user,
        errMsg: errMsg,
        noError: !errMsg
      });
    });

    app.post('/checkout', isLoggedIn, function(req, res, next) {
      if (!req.session.cart) {
        return res.redirect('/shopping-cart');
      }
      var cart = new Cart(req.session.cart);


        var order = new Order({
          user: req.user,
          cart: cart,
          address: req.body.address,
          name: req.body.name,
          contact: req.body.contact,
          email: req.body.email

        });
        order.save(function(err, result) {
          req.flash('success', 'Successfully bought the product.');
          req.session.cart = null;
          res.redirect('/product');
        });

    });





    app.get('/about', function(req, res) {
        res.render('about.ejs',{
            user : req.user
        });
    });

    app.get('/partials/header', function(req, res) {
        res.render('header.ejs',{
            user : req.user
        });
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user
        });
    });

    // PROFILE SECTION =========================
    app.get('/orderedList/:id', isLoggedIn, function(req, res) {
        /*res.render('orderedList.ejs', {
            reqprod : req.reqprod,
            user : req.user
        });*/

            // mongoose operations are asynchronous, so you need to wait 
        reqProduct.find({userID : req.params.id}, function(err, data) {
        Order.find({user : req.params.id}, function(err, orderdata) {
            var cart;
            orderdata.forEach(function(order) {
            cart =  new Cart(order.cart);
            order.items = cart.generateArray();
            });
        // note that data is an array of objects, not a single object!
        res.render('orderedList.ejs', {
            user : req.user,
            reqproduct: data,
            directorder: orderdata,
            /* orderitems : cart.generateArray()*/
        });
    });
        // note that data is an array of objects, not a single object
    });
    });

    app.get('/userview', isLoggedIn, function(req, res) {
         users.find({}, function(err, data) {
        // note that data is an array of objects, not a single object!
        res.render('userview.ejs', {
            user : req.user,
            /*reqproduct: data,*/
            users : data
        });
    });
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/indext', function(req,res){
        res.render('indext.ejs',{
            user : req.user
        })
    })

            app.get('/ourtemplate', function(req,res){
        res.render('ourtemplate.ejs',{
            user : req.user
        });
    })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', isNotLoggedIn, function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage'),
            user : req.user });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', isNotLoggedIn, function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage'),
            user : req.user });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/auth/facebook', passport.authenticate('facebook', { scope : ['public_profile', 'email'] }));

        // handle the callback after facebook has authenticated the user
        app.get('/auth/facebook/callback',
            passport.authenticate('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

        // handle the callback after twitter has authenticated the user
        app.get('/auth/twitter/callback',
            passport.authenticate('twitter', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));


    // google ---------------------------------

        // send to google to do the authentication
        app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

        // the callback after google has authenticated the user
        app.get('/auth/google/callback',
            passport.authenticate('google', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // locally --------------------------------
        app.get('/connect/local', function(req, res) {
            res.render('connect-local.ejs', { message: req.flash('loginMessage') });
        });
        app.post('/connect/local', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/connect/facebook', passport.authorize('facebook', { scope : ['public_profile', 'email'] }));

        // handle the callback after facebook has authorized the user
        app.get('/connect/facebook/callback',
            passport.authorize('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

        // handle the callback after twitter has authorized the user
        app.get('/connect/twitter/callback',
            passport.authorize('twitter', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));


    // google ---------------------------------

        // send to google to do the authentication
        app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

        // the callback after google has authorized the user
        app.get('/connect/google/callback',
            passport.authorize('google', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // twitter --------------------------------
    app.get('/unlink/twitter', isLoggedIn, function(req, res) {
        var user           = req.user;
        user.twitter.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // google ---------------------------------
    app.get('/unlink/google', isLoggedIn, function(req, res) {
        var user          = req.user;
        user.google.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });


};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/login');
}

function isNotLoggedIn(req, res, next) {
    if (!req.isAuthenticated())
        return next();

    res.redirect('/');
}
