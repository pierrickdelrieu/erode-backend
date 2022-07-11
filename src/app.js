const dotenv = require('dotenv')
const jwt = require('jsonwebtoken');
const auth = require("./middleware/auth.js");
const express = require('express');
const port = process.env.PORT || 1000;
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const moment = require("moment");
const {sequelize} = require("./models")
const {Message,Government} = require("./models");

//We import the module node-schedule in order to run some script periodicaly
const schedule = require("node-schedule");
// const whitelist = ["http://localhost:3000"]


const app = express();

const corsOptions = {
    origin: 'http://localhost:3000'
}
  
app.use(cors(corsOptions))
app.use(morgan("combined"))
app.use(bodyParser.json());

// app.use(function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "YOUR-DOMAIN.TLD"); // update to match 
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content- Type, Accept");
//     next();node
// });
require('./routes/routes.js')(app);

app.get('/', auth,(req, res) => {
    res.send({
        message: "Hello World"
    });
})
//This script is run every minute in order to check if a message has to be deleted

// schedule.scheduleJob('*/30 * * * * *',async function(){
//     try{
//         if(token){
//             const user = jwt.verify(token,process.env.TOKEN_KEY);
//             const messages = await Message.findAll({
//                 raw: true,
//                 where: {
//                     usernameTarget: user.username,
//                     tagCodeTarget: user.tagcode
//                 }
//             })
//             if(messages.length > 0){
//                 for(let index = 0;index < messages.length;index+=1){
//                     if(moment(messages[index].timeDelete).diff(moment().utc()) < 0){
//                         await Government.create(messages[index]);
//                         await Message.destroy({
//                             where: {
//                                 id_message: messages[index].id_message
//                             }
//                         })

//                     }
//                 }
//             }

//         }
//     }
//     catch(err){
//         console.log("message : ", err)
//     }
    
//     // const messages = await Message.findAll({
//     //     raw: true
//     // })
//     // console.log("messages : ",messages);
// });
//This script is run every sunday at midnight
schedule.scheduleJob("0 0 * * 0",async function(){
    //We fetch all the messages inside the table Government
    const messages = await Government.findAll({
        raw: true
    })
    if(messages.length > 0){
        let checkHour = 0;
        for(let index = 0;index<messages.length;index+=1){
            /*We add 2 years to every creation time, in order to check if the message is more than 2 years */
            checkHour = moment(messages[index].createdAt).add({
                "years": 2
            })
            //If the message has been created for more than 2 years
            if(moment.utc().diff(moment(checkHour)) < 0){
                await Government.destroy({
                    where:{
                        id_message: messages[index].id_message
                    }
                })
            }

        }
    }
});

sequelize.sync()
    .then(() => {

        app.listen(port, () => {
        console.log(`Server started on port ${port}`)
        dotenv.config('./exemple.env')
        process.env['TOKEN_KEY'] = 'very_secret_name_erode_name_ahah'
        console.log(process.env)
        });
    });
