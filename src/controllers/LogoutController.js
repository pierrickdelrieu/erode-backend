require('dotenv').config()
const {User} = require("../models")
//Function for creating random Strings
const crypto = require("crypto")
const jwt = require("jsonwebtoken");
const jwtconfig = require('../config/jwtConfig.js');
const { off } = require('process');
const generateRandomString = (myLength) => {
    const chars =
      "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890'\\_)@=+}:;,";
    const randomArray = Array.from(
      { length: myLength },
      (v, k) => chars[Math.floor(Math.random() * chars.length)]
    );
  
    const randomString = randomArray.join("");
    return randomString;
};

function jwtSignUser(user) {
    //We generate the secretKey
    const secretKey = generateRandomString((Math.floor(Math.random()*(50-30)))+30);
    
    const token = jwt.sign({
        tagcode: user.tagcode,
        username: user.username
    },
    secretKey,{
        expiresIn: "24h"
    })
    if(token){
        // We create the hash sha256 using the TOKEN_KEY
        const sha256Hasher = crypto.createHmac("sha256",process.env.TOKEN_KEY);
        if(sha256Hasher){
            //We hash our token
            const tokenHashed = sha256Hasher.update(token).digest("hex");
            user = User.update({
                token: tokenHashed
            }, {
                where: {
                    username: user.username,
                    tagcode: user.tagcode
                }
            })
            if(user){
                return token
            }
        }
    }
}

// function cypherMessage(content,tagcode){
//     const childPython = spawn('python', ['..\\..\\CipherAlgo\\cipher-obf.py', content.toString(), tagcode]);   
//     //We create a new Promise because we have to wait for the result to keep our request
//     return new Promise((resolve) => {
//         childPython.stdout.on('data', (data) => {
//             return resolve(data.toString());
//         });    
//     })
// }



module.exports = {
    async logout(req, res){
        try{
            const {token} = req.body;
            
            // const user = await User.findOne({
            //     where:{
            //         username: req.user.username,
            //         tagcode: req.user.tagcode
            //     }
            // }).then((user) => {
                const user = await User.findOne({
                    where:{
                        username: req.user.username,
                        tagcode: req.user.tagcode
                    }
                })
                if(user){
                    const userJson = user.toJSON();
                    const token = jwtSignUser(userJson);
                    console.log("token : ",token);
                    if(token){
                        User.update({
                            token: token,
                        },
                        {
                            where:{
                                username: userJson.username,
                                tagcode: userJson.tagcode
                            }
                        }).then(() => {
                            res.status(200).send({
                                message: "The token has been removed"
                            })
                        })
                    }   
                }
                else{
                    res.status(400).send({
                        message: "The user has not been found"
                    })
                }
            // })
            
        }catch(err){
            res.status(500).send({
                message: "Internal error"
            })
        }
    }
}