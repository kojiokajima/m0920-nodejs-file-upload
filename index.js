const express = require('express');
const path = require('path');
const mongoose = require('mongoose')
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf')
const flash = require('connect-flash')
require('dotenv').config()

const adminRouters = require('./routes/admin');
const shopRouters = require('./routes/shop');
const authRouters = require('./routes/auth')

const errorController = require('./controllers/error');
const User = require('./models/User')

//--------------------Setups--------------------
const app = express();
const store = new MongoDBStore({
    uri: process.env.MONGODB_URL,
    collection: 'sessions'
})
const csrfProtection = csrf()
app.use(express.urlencoded({extended:false}));

//app.set = allows us to set any values globally on our express application
app.set('view engine', 'ejs');
//views is set to default path of views but I am just implicitly showing
app.set('views','views');

//serve file statically
app.use(express.static(path.join(__dirname, 'public')))
app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    store: store
}))
app.use(csrfProtection)
app.use(flash())

// Dummy Auth
app.use((req,res,next) => {
    if(!req.session.user){
        return next()
    }
    User.findById(req.session.user._id).then(user => {
        if(!user){
            return next()
        }
        req.user = user
        next()
    }).catch(err => console.log(err))

})

app.use((req,res,next) => {
    res.locals.csrfToken = req.csrfToken()
    res.locals.isAuth = req.session.isLoggedIn
    next()
})

//--------------------Middleware--------------------
app.use('/admin',adminRouters);
app.use(shopRouters);
app.use(authRouters)

// catch all middleware
app.use(errorController.get404);
//----------------End of Middleware-----------------

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).then(() => {
    console.log("Connected to Database")

    //not necessary for production. Just a dummy auth for id
    // User.findOne().then(user => {
    //     if(!user){
    //         const user = new User({
    //             username: 'Sushi',
    //             email: 'maki@zushi.com'
    //         })
    //         user.save()
    //     }
    // })

    app.listen(5000, () => console.log('Server connected to port 5000'));
}).catch(err => console.log(err))