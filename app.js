require('dotenv').config({silent: true})
var express = require('express')
var path = require('path')
var debug = require('debug')
var logger = require('morgan')
var mongoose = require('mongoose')
var bodyParser = require('body-parser')
var expressLayouts = require('express-ejs-layouts')
var app = express()
var router = express.Router()
var methodOverride = require('method-override')
var passport = require('passport')

// to set up session-saving for flash purposes
var session = require('express-session')
var flash = require('connect-flash')
var cookieParser = require('cookie-parser')
var MongoStore = require('connect-mongo')(session)

mongoose.connect(process.env.MONGODB_URI)
mongoose.Promise = global.Promise

app.use(express.static('public'))

app.use(cookieParser(process.env.SESSION_SECRET))
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: { maxAge: 360000 },
  resave: false,
  saveUninitialized: true,
  store: new MongoStore({
    url: process.env.MONGODB_URI,
    autoReconnect: true
  })
}))

app.use(passport.initialize())
app.use(passport.session())
require('./config/passportConfig')(passport)

app.use(flash())
app.use(methodOverride('_method'))
app.use(logger('dev'))
app.use(bodyParser.urlencoded({ extended: true }))
app.set('views', path.join(__dirname, 'views'))
app.use(expressLayouts)
app.set('view engine', 'ejs')

// All routes will now have users' data if there is any. Accesses users' DB.
app.use(function (req, res, next) {
  res.locals.user = req.user
  res.locals.isAuthenticated = req.isAuthenticated()
  next()
})

// require all routers
// const authRouter = require('./routes/auth_router')
// app.use('/', authRouter)

const issueRouter = require('./routes/issue_router')
app.use('/', issueRouter)

// render default homepage
app.get('/', function (req, res) {
  res.render('home')
})

// Development error + Port listener handler
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500)
    res.render('error', {
      message: err.message,
      error: err
    })
  })
}
const port = 5000
app.listen(port, function () {
  console.log('CityFix App is running on localhost://' + port)
})