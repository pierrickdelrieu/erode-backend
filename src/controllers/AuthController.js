require('dotenv').config()
const { User,Message } = require('../models')
const jwt = require('jsonwebtoken');
const jwtconfig = require('../config/jwtConfig.js');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const moment = require("moment");
const crypto = require("crypto")
// -- Functions -- //
// Create a function for creating random string
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

function cypherMessage(content,tagcode){
    const childPython = spawn('python', ['..\\..\\CipherAlgo\\cipher-obf.py', content.toString(), tagcode]);   
    //We create a new Promise because we have to wait for the result to keep our request
    return new Promise((resolve) => {
        childPython.stdout.on('data', (data) => {
            return resolve(data.toString());
        });    
    })
}

// jwt token
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
    //We cipher it
    

    // cypherMessage(secretKey,user.tagcode).then((message) => {
    //     if(message){
    //         User.update({
    //             secretKey: message,
    //             where:{
    //                 username: user.username,
    //                 tagcode: user.tagcode
    //             }
    //         }).then(() => {
    //             return jwt.sign(user,secretKey,{
    //                 expiresIn: "24h"
    //             })
    //         })
    //     }
    // })
}
function createTagCode(){
    min = Math.ceil(1000);
    max = Math.floor(9999);
    return Math.floor(Math.random() * (max - min)) + min;
}



// get2faAuthCode
function get2faAuthCode() {
    const secret = speakeasy.generateSecret({
        name: 'ERØDƎ'
    });
    return{
        otpauth_url: secret.otpauth_url,
        secret: secret.base32
    }
}

// verify2faAuthCode
function verify2faAuthCode(twoFACode, userJson) {
    return speakeasy.totp.verify({
        secret: userJson.doubleFactorAuthenticator,
        encoding: 'base32',
        token: twoFACode
    });
}


module.exports = {

    // Register User
    async register (req, res) {
        //try{
            const {username,password} = req.body;
            if(!username || !password || username.length > 20 || password.length > 50){
                return res.status(400).json({
                    message: "Invalid information"
                })
            }
            let tagcode = createTagCode();
             let isUserAlreadyExist = true
            //We declare maxHoop in order to do a maxium of 10 loop otherwise the database will receive an infinite number of requests.
            let maxHoop = 0;
            while(isUserAlreadyExist && maxHoop < 10){

                const fetchUser = await User.findOne({
                    where: {
                        username: username,
                        tagCode: tagcode
                    }
                })
                if(!fetchUser){
                    isUserAlreadyExist = false;
                    maxHoop = 10;
                }
                maxHoop+=1;
            }
            if(isUserAlreadyExist == false){
                const newUser = await User.create({
                    username: username,
                    tagcode: tagcode,
                    password: password        
                })

                const userJson = newUser.toJSON();
                const token = jwtSignUser(userJson);
                global.token = token;
                //user.token = token;
                res.status(200).json({
                    username: username,
                    tagcode: tagcode,
                    token : token,
                    message: 'Register successful'
                });
            }
            else{
                res.status(500).send({
                    message: "Invalid Information"
                })
            }
        //}
        /*
        catch(err) {
            res.status(500).send({
                message: 'Invalid information ' + err
            });
        };
        */
        
    }, 

    // Login User
    async login (req, res) {
       try{
            const { username, tagcode, password } = req.body;
            if(!username || !tagcode || !password || username.length > 20 || password.length > 50){
                return res.status(400).json({
                    message: "Invalid information"
                })
            }
            const user = await User.findOne({
                where: {
                    username: username,
                    tagcode: tagcode
                }
            }) 
            if (!user) {
                res.status(401).send({
                    message: 'Invalid information'
                });
            }
            else{
                await user.comparePassword(password).then(isMatch => {
                    if (!isMatch) {
                        res.status(401).send({
                            message: 'Invalid information'
                        });
                    }
                    else{

                        const userJson = user.toJSON();
                        const token = jwtSignUser(userJson);
                        global.token = token;
                        if(userJson.isDoubleFactorAuthenticatorEnabled == true){
                            res.status(200).send({
                                is2FAEnabled: true,
                                message: "Your credentials are correct"
                            });
                        }
                        else{
                            res.status(200).send({
                                is2FAEnabled: false,
                                token: token,
                                message: "Your credentials are correct"
                            });
                        }
                    }
                
                })   
            }
        }catch(err){
            res.status(500).send({
                message: 'Internal error'
            });
        };
        
    },

    // Generate 2FA Code
    async twoFAGenerate (req, res) {
        try{
            const userId  = req.user.id_user;
            const checkuser = await User.findOne({
                where: {
                    id_user: userId
                }
            })
            if(checkuser.isDoubleFactorAuthenticatorEnabled == true){
                res.status(200).send({
                    message: "Your 2FA is already enabled"
                })
            }
            else{
                const { otpauth_url, secret } = get2faAuthCode();
                const user = await User.update({
                    doubleFactorAuthenticator: secret,
                }, {
                    where: {
                        id_user: userId
                    }
                });
                if (user==0) {
                    res.status(401).send({
                        message: 'Invalid information'
                    });
                }
                else{
                    const UrlQRCode = await QRCode.toDataURL(otpauth_url);
                    res.send({
                        UrlQRCode: UrlQRCode,
                        message: 'Generate successful'
                    });
                }
            }   
        }
        catch(err){
            res.status(500).send({
                message: 'Invalid information'
            });
        }
    },

    // turn on 2FA
    async twoFAEnable (req, res) {
        try{
            //const { username, tagcode , usertwoFACode } = req.body;
            const userId = req.user.id_user;
            const usertwoFACode = req.body.usertwoFACode;
            const user = await User.findOne({
                where: {
                    // username: username,
                    // tagcode: tagcode
                    id_user: userId
                }
            });
            if (!user) {
                res.status(401).send({
                    message: 'Invalid user information '
                });
            }
            else{
                const userJson = user.toJSON();
                const userCodeValid = verify2faAuthCode(usertwoFACode, userJson);
                if (!userCodeValid) {
                    res.status(401).send({
                        message: 'Invalid code information'
                    });
                }
                else{
                    const updateuser = User.update({
                        isDoubleFactorAuthenticatorEnabled: true,
                    }, {
                        where: {
                            id_user: userJson.id_user
                        }
                    });
                    if (!updateuser) {
                        res.status(401).send({
                            message: 'Invalid update information'
                        });
                    }
                    res.send({
                        message: '2FA enabled'
                    });
                }
            }
        }
        catch(err){
            res.status(500).send({
                message: 'Invalid information'
            });
        }
    },

    // Authenticate 2FA Code
    async twoFAAuthentification (req, res) {
        try{
            const { username, tagcode, password , usertwoFACode } = req.body;
            const user = await User.findOne({
                where: {
                    username: username,
                    tagcode: tagcode
                }
            });
            if (!user) {
                res.status(401).send({
                    message: 'Invalid user information '
                });
            }
            else {
                await user.comparePassword(password).then(isMatch => {
                if (!isMatch) {
                    res.status(401).send({
                        message: 'Invalid information'
                    });
                }
                else{
                    const userJson = user.toJSON();
                    const userCodeValid = verify2faAuthCode(usertwoFACode, userJson);
                    if (!userCodeValid) {
                        res.status(401).send({
                            message: 'Invalid code information'
                        });
                    }
                    else{
                        res.send({
                            token: jwtSignUser(userJson),
                            message: 'Authentication successful'
                        });
                    }
                }
                })
            }
        }
        catch(err){
            res.status(500).send({
                message: 'Invalid information'
            });
        }
    },

    // turn off 2FA
    async twoFADisable (req, res) {
        try{
            const userId = req.user.id_user;
            const usertwoFACode  = req.body.usertwoFACode;
            const user = await User.findOne({
                where: {
                    id_user: userId
                }
            });
            if (!user) {
                res.status(401).send({
                    message: 'Invalid information'
                });
            }
            else{
                const userJson = user.toJSON();
                const userCodeValid = verify2faAuthCode(usertwoFACode, userJson);
                if (!userCodeValid) {
                    res.status(401).send({
                        message: 'Invalid information'
                    });
                }
                else{
                    const updateuser = User.update({
                        isDoubleFactorAuthenticatorEnabled: false,
                        doubleFactorAuthenticator: null,
                    }, {
                        where: {
                            id_user: userJson.id_user
                        }
                    });
                    if (!updateuser) {
                        res.status(401).send({
                            message: 'Invalid information'
                        });
                    }
                    res.send({
                        message: '2FA disabled'
                    });
                }
            }
        }
        catch(err){
            res.status(500).send({
                message: 'Invalid information'
            });
        }
    }
}
