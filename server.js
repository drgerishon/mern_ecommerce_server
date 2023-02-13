const express = require("express");
const bodyParser = require('body-parser')
const morgan = require("morgan");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const {} = require('dotenv/config')
const cors = require('cors')
const fs = require('fs')
const {getConversionRate} = require("./helpers/dollar-scraper");
const {log} = require("nodemon/lib/utils");
const RandomFunction = require("./helpers/currency-converter");
const {chooseRandomFunction} = require("./helpers/currency-converter");
const controller = require("./controllers/dollar");

const app = express()

//db

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
}
const intervalInMilliseconds = 40 * 60 * 1000;


setInterval(controller.chooseRandomFunction, intervalInMilliseconds);



mongoose.set("strictQuery", false);
mongoose.connect(process.env.DATABASE_URL, options)
    .then(() => {
        console.log('Database connection established')
    })
    .catch((error) => console.log(error))

//middleware
app.use(morgan('dev'))
app.use(cookieParser())
app.use(express.json({limit: '2mb'}));
app.use(bodyParser.urlencoded({limit: "2mb", extended: true}));


//cors

app.use(cors())

// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*')
//     res.header(
//         'Access-Control-Allow-Headers',
//         'Origin,X-Requested-With,Content-Type,Accept,Authorization')

//     if (req.method === 'OPTIONS') {
//         res.header('Access-Control-Allow-Methods', 'PUT,PATCH,POST,OPTIONS,DELETE,GET')
//         return res.status(200).json({})
//     }
//     next()
// })


// port
const port = process.env.PORT || 8000


fs.readdirSync('./routes/').map(r => app.use('/api', require(`./routes/${r}`)))

process.on('uncaughtException', function (exception) {
    console.log(exception); // to see your exception details in the console
    // if you are on production, maybe you can send the exception details to your
    // email as well ?
});


const server = app.listen(port, `0.0.0.0`, () => {
    setTimeout(() => {
        console.log(`Your backend REST api endpoint is at
           Local:            http://localhost:${port}/api
        `)
    }, 1000);

});


require('./modules/socket').init(server);