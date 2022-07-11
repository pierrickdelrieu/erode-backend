const rsa = require("node-rsa");
const jwt = require('jsonwebtoken');
const { spawn } = require("child_process");
const {Message,Government,User} = require("../models");

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

function cypherMessage(content,tagcode){
    console.log("content : ",content);
    const childPython = spawn('python3', ['..//CipherAlgo//cipher-obf.py', content.toString(), tagcode]);
    //We create a new Promise because we have to wait for the result to keep our request
    childPython.stderr.on('data', (data) => {
        console.log(`les erreurs : ${data}`)
    });
    
    childPython.on('close', (code) => {
        console.log(`child process exited with code ${code}`)
    });
    return new Promise((resolve) => {
        childPython.stdout.on('data', (data) => {
            console.log("data : ",data.toString());
            return resolve(data.toString());
        });    
    })
}


module.exports= {
    async sendMessage(req,res){
        try{
            const {token,content,usernameTarget,tagcodeTarget, time} = req.body;
            console.log(req.body);
            const username = req.user.username;
            const tagcode = req.user.tagcode;
            //Vérifier que username/tagcode et usernameTarget/tagcodeTarget ne sont pas les mêmes.

            //We're searching for the user who are sending the message in order to get its private and public key for enciphering the message
            const user = await User.findOne({
                where: {
                    username: username,
                    tagcode: tagcode
                }
            })
            if(user){
                //We transfer the model user into JSON in order to get the private and public keys
                const userJSON = user.toJSON();

                //We're searching for the user  to whom we want to send a message
                const userTarget = await User.findOne({
                    where: {
                        username: usernameTarget,
                        tagcode: tagcodeTarget
                    }
                })
                console.log(user);
                if(userTarget){
                    const userTargetJSON = userTarget.toJSON();
                    let message_chiffre;
                    
                    //message_chiffre = await cypherMessage(content,userTargetJSON.tagcode).then((message) => {
                        
                        message_chiffre = cypherMessage(content,userTargetJSON.tagcode).then((message) => {
                            if(message){
                                console.log("message chiffré : ",message);
                                //We're creating a pair of RSA key for the message to send
                                const keys = creatingRsaKeys();
                                let publicKey = new rsa();
                                let privateKey = new rsa(); 
            
                                publicKey.importKey(keys[0]);
                                privateKey.importKey(keys[1]);
                                contentEncrypted = publicKey.encrypt(message,"base64");
                                Message.create({
                                    usernameTarget: usernameTarget,
                                    tagCodeTarget: tagcodeTarget,
                                    content: contentEncrypted,
                                    fromUsername: username,
                                    fromTagCode: tagcode,
                                    //We add the moment (in utc) at which the message has been sent to the database
                                    publicKey: keys[0],
                                    privateKey: keys[1],
                                    createdAt: moment.utc().local(),
                                    timeDelete: moment.utc().local().add({
                                        hours: time
                                    })
                                }).then(() => {
                                    res.status(201).send({
                                        message: "Your message has been sent"
                                    })
                                })
                            }
                        });    
                }
                else{
                    res.status(400).send({
                        message: "The message has been lost"
                    })
                }
            }
            else{
                res.status(404).send({
                    message: "The user has not been found"
                })
            }
        }
        catch(err){
            res.status(500).send({
                message: "Internal error " + err
            })
        }
    },

    async getMessage(req,res){
        try{
            const user = await User.findOne({
                where: {
                    username: req.user.username,
                    tagcode: req.user.tagcode
                }
            })

            let contentReturn = "Error"
            if(user){
                userJSON = user.toJSON();
                
                let publicKey = new rsa();
                let privateKey = new rsa();
                //We're searching for all the message  
                const messages = await Message.findOne({
                    //We translate the array of responses to JSON
                    where: {
                        usernameTarget: userJSON.username,
                        tagCodeTarget: userJSON.tagcode,
                        id_message: req.body.id_message
                    }
                })
                console.log("messages : " + messages)
                let messageReturn = null
                const contentDecipheredRsa = privateKey.importKey(messages.privateKey).decrypt(messages.content,"utf8")
                await decypherMessage(contentDecipheredRsa,userJSON.tagcode).then((message) => {

                    if(message){
                        //We remove the final characters which are returned by our enciphering algoritm
                        message = message.replace('\r','');
                        message = message.replace('\n','');

                        

                        if (messages.timeDelete >= moment.utc().local()){
                            contentReturn = "Success"
                            messageReturn = {
                                fromUsername: messages.fromUsername,
                                fromTagCode: messages.fromTagCode,
                                content: message,
                                id: messages.id_message,
                                //We send the difference between the actual hour and the time delete
                                timeSending: moment(messages.createdAt,"YYYY-MM-DD HH:mm:ss").fromNow("mm"),
                                //timeSending: moment.duration(moment.utc().local().diff(moment.duration(messages[indexMessages].createdAt))),
                                timeDelete: moment.utc(moment.duration(moment(messages.timeDelete).diff(moment.utc().local().format("YYYY-MM-DD HH:mm:ss"))).asMilliseconds()).format("HH:mm")
                            }
                        }

                        Message.destroy({
                            where: {
                                id_message: req.body.id_message
                        }})
                    }
                })
                res.status(200).send({
                    item: messageReturn,
                    message: contentReturn                       
                })
            } else{
                res.status(404).send({
                    message: "Error"
                })
            }
        }catch(err){
            res.status(500).send({
                message: "Error" 
            })
        }
    },

    async deleteMessage(req,res){
        try{
            const {token,id_message} = req.body;
            console.log(req.body);
            await Message.findOne({
                where: {
                    id_message: id_message
                }
            }).then((message) => {
                console.log(message);
                if(message){
                    messageJson = message.toJSON();
                    //If the message we're seeking to delete belongs to the user who read it
                    if(req.user.username == messageJson.usernameTarget && req.user.tagcode == messageJson.tagCodeTarget){
                        //We delete the message.
                        Message.destroy({
                            where: {
                                id_message: id_message
                            }
                        }).then((result) => {
                            if(result){
                                res.status(200).send({
                                    message: "Your message has been deleted"
                                })
                            }
                        })
                    }
                    else{
                        res.status(401).send({
                            message: "Error "
                        })
                    }
                }
                else{
                    res.status(400).send({
                        message: "Error"
                    })
                }
            })
        }catch(err){
            res.status(500).send({
                message: "Error"+ err
            })
        }
    }
}