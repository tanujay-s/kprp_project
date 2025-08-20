const session = require("express-session");
require ('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const user_routes = require('./routes/api');
const admin_routes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // change to true if using HTTPS
}));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(()=>{
  console.log("----Database Connected----");
}).catch((err)=>{
  console.error("Mongodb connection error: ",err);
})

app.use((req, res, next) => {
  res.locals.isAdmin = req.session.isAdmin || false;
  next();
});

app.get('/', (req, res) => {
  res.render('index');
});
app.get('/family', (req, res) => {
  res.render('family'); 
});

app.use("/", user_routes);
app.use("/admin", admin_routes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});