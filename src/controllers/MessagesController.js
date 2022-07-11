const rsa = require("node-rsa");
const jwt = require('jsonwebtoken');
const { spawn } = require("child_process");
const { User, Message } = require('../models');
const { checkPrime } = require("crypto");
const moment = require("moment");


function creatingRsaKeys(){
    const key = new rsa().generateKeyPair();
    const publicKey = key.exportKey("public");
    const privateKey = key.exportKey("private");
    return [publicKey,privateKey]
}


async function decypherMessage(contentEnciphered,tagcode){
    const childPython = spawn('python3', ['..//..//CipherAlgo//decipher-obf.py', contentEnciphered.toString(), tagcode]);   
    return new Promise((resolve) => {
        childPython.stdout.on('data', (data) => {
            return resolve(data.toString());
        });
    })
}

module.exports = {
    async getMessages(req,res){
        try{
            const user = await User.findOne({
                where: {
                    username: req.user.username,
                    tagcode: req.user.tagcode
                }
            })
            if(user){
                userJSON = user.toJSON();
                
                //We're searching for all the message  
                const messages = await Message.findAll({
                    //We translate the array of responses to JSON
                    raw: true,
                    where: {
                        usernameTarget: userJSON.username,
                        tagCodeTarget: userJSON.tagcode
                    }
                })
                //If we find at least one message
                let messageReturn = "No messages found"

                if(messages.length > 0){
                    let arrayMessage = [];
                    for(let indexMessages = 0;indexMessages<messages.length;indexMessages+=1){
                        const message = messages[indexMessages];
                            if(message){
                                //We remove the final characters which are returned by our enciphering algoritm

                                if (messages[indexMessages].timeDelete < moment.utc().local()){
                                    Message.destroy({
                                        where: {
                                            id_message: messages[indexMessages].id_message
                                    }})
                                } else {
                                    messageReturn = "Messages found"
                                    let objectMessage = {
                                        fromUsername: messages[indexMessages].fromUsername,
                                        fromTagCode: messages[indexMessages].fromTagCode,
                                        id: messages[indexMessages].id_message,
                                        //We send the difference between the actual hour and the time delete
                                        timeSending: moment(messages[indexMessages].createdAt,"YYYY-MM-DD HH:mm:ss").fromNow("mm"),
                                        //timeSending: moment.duration(moment.utc().local().diff(moment.duration(messages[indexMessages].createdAt))),
                                        timeDelete: moment.utc(moment.duration(moment(messages[indexMessages].timeDelete).diff(moment.utc().local().format("YYYY-MM-DD HH:mm:ss"))).asMilliseconds()).format("HH:mm")
                                    }
                                    arrayMessage.push(objectMessage);
                                }
                            }
                    }
                    res.status(200).send({
                        array: arrayMessage,
                        message: messageReturn                        
                    })
                }
                else{
                    res.status(404).send({
                        message: "No messages found"
                    })
                }
            }  
            else{
                res.status(404).send({
                    message: "The user has not been found"
                })
            }
        }catch(err){
            res.status(500).send({
                message: "Internal error " + err
            })
        }
    }
}