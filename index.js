const express = require('express');
const path = require('path');
const mongoose = require('mongoose')
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf')
const flash = require('connect-flash')
const {v4: uuidv4} = require('uuid')
const multer = require('multer')
require('dotenv').config()

const adminRouters = require('./routes/admin');
const shopRouters = require('./routes/shop');
const authRouters = require('./routes/auth')

const errorController = require('./controllers/error');
const User = require('./models/User')

//--------------------Setup MINE Type--------------------
const MINE_TYPE_MAP = {
    "image/jpg" : "jpg",
    "imagejpeg" : "jpeg",
    "image/png" : "png",
    "image/gif" : "gif",
}

//--------------------Setups--------------------
const app = express();
const store = new MongoDBStore({
    uri: process.env.MONGODB_URL,
    collection: 'sessions'
})
const csrfProtection = csrf()
app.use(express.urlencoded({extended:false}));

// parse the request body into readable data (from multipartform)
app.use(multer({
    limits: 5000000, // bytes
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/images')
        },
        filename: (req, file, cb) => {
            const ext = MINE_TYPE_MAP[file.mimetype]
            cb(null, uuidv4() + '.' + ext) // e.g.) smdcaoiheorbv.jpg
        }
    }),
    fileFilter: (req, file, cb) => {
        const isValid = !!MINE_TYPE_MAP[file.mimetype]
        let error = isValid ? null : new Error("In valid MINE type")
        cb(error, isValid)
    }
}).single('image')) // --> inputのname。 edit-product.ejsのやつ

//app.set = allows us to set any values globally on our express application
app.set('view engine', 'ejs');
//views is set to default path of views but I am just implicitly showing
app.set('views','views');

//serve file statically
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads', 'images')))
app.use(express.static(path.join(__dirname, 'public')))
app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    store: store
}))
app.use(csrfProtection)
app.use(flash())


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