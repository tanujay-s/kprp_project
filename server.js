require ('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(()=>{
  console.log("----Database Connected----");
}).catch((err)=>{
  console.error("Mongodb connection error: ",err);
})

app.get('/', (req, res) => {
  res.send('Server is working!');
});

app.listen(PORT, ()=>{
    console.log(`Server started listening on port :${PORT}`);
})