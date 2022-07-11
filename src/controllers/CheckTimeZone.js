require('dotenv').config()
const { User,Message } = require('../models')
const jwt = require('jsonwebtoken');
const jwtconfig = require('../config/jwtConfig.js');
const moment = require("moment");

module.exports = {
    async checkAndUpdateUtc(req,res){
        try{
            const {token} = req.body;
            const decoded = jwt.verify(token,process.env.TOKEN_KEY);
            req.user = decoded;
            /*Before connecting the user, we need to ensure whereas 
            he has changed its timezone, its time messages (delete and create)
            have to be changed*/           
            const  messages = await Message.findAll({
                raw: true,
                where:{
                    usernameTarget: req.user.username,
                    tagCodeTarget: req.user.tagcode
                }
            })
            /*We need to fetch every messages and check if there utc is the same 
            as the user's timezone */
            if(messages.length >0){
                let utc_registered = 0;
                //The user's utc
                const utc_user = moment().utcOffset(5).utcOffset()/60;
                //Variable in which we'll store the changed time
                let hour_created_changed = 0;
                let hour_deleted_changed = 0;
                console.log("utc_user : ",utc_user);
                const changing = moment().add({
                    "hours": 24
                })
                for(let index = 0;index < messages.length; index+=1){
                    //Let's store the user's utc
                    //utc_registered = messages[index].createdAt.utcOffset()/60;
                    //if the user's utc is different than its messages utc
                    // utc_registered = moment(messages[index].createdAt).utcOffset()/60;
                    // console.log("utc_registered : ", changing.diff(messages[0].createdAt));
                    // console.log("fez : ",moment(messages[0].createdAt).diff(changing))
                    if(utc_registered !== utc_user){
                        /*We change the hour at which the message has been created
                        according to the user's utc*/

                        console.log("difference : ",)

                        hour_created_changed = moment(messages[index].createdAt).utcOffset(utc_user);
                        /*We change the hour at which the message will be deleted
                        according to the user's utc*/
                        hour_deleted_changed = moment(messages[index].timeDelete).utcOffset(utc_user);
                        
                        console.log("messges created : ",moment(hour_created_changed))
                        console.log("messges created : ",moment(hour_deleted_changed))
                        console.log("messages id : ",messages[index].id_message)
                        let message_index = messages[index].id_message
                        console.log("fzejifez : ",moment.utc(hour_created_changed).toDate())
                        console.log("fzejifez : ",hour_created_changed.utcOffset())

                        //We update the same message with the new values
                        await Message.update({
                            timeDelete: hour_deleted_changed,
                            createdAt: hour_created_changed
                        },
                        {
                            where: {
                                id_message: message_index
                            }
                        })
                        
                    }
                }
            }
            res.status(200).send({
                message: "The request has been made"
            })
        }catch(err){
            res.status(500).send({
                message: "Internal error"
            })
        }
    }
}