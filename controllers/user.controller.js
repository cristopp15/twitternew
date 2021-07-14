'use strict'

var User = require('../models/user.model');
var Tweet = require('../models/tweet.model');
var Follow = require('../models/follower.model');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
const {decode} = require('jwt-simple')



function commands(req, res){
    var us = new User();
    var params = req.body;
    var sp = params.command.split(" ")

    if(sp[0].toUpperCase() == 'REGISTER'){
        if(sp.length != 5){
            res.send({message: 'Ingrese los datos necesarios, SINTAXIS: REGISTER name email username password'});
        }else{
            User.findOne({$or:[{email: sp[2]}, {username: sp[3]}]}, (err, userFind) =>{
                if(err){
                    res.status(500).send({message: 'Error general', err});
                }else if(userFind){
                    res.send({message: 'El usuario o el correo ya está en uso'});
                }else{
                    us.name = sp[1];
                    us.email = sp[2];
                    us.username = sp[3];
                    
                    bcrypt.hash(sp[4], null, null, (err, passwordHash)=>{
                        if(err){
                            res.status(500).send({message: 'Error', err});
                        }else if(passwordHash){
                            us.password = passwordHash;

                            us.save((err, userSaved)=>{
                                if(err){
                                    res.status(500).send({message: 'Error general', err});
                                }else if(userSaved){
                                    res.send({message: 'Usuario registrado', user: userSaved});
                                }else{
                                    res.status(404).send({message: 'Error al registrar usuario'});
                                }
                            });
                        }else{
                            res.status(410).send({message: 'Error inesperado'});
                        }
                    })
                }
            })
       
            
        }

    }else if(sp[0].toUpperCase() == 'LOGIN'){
        if(sp.length == 3){
            User.findOne({$or:[{email: sp[1]}, {username: sp[1]}]}, (err, user)=>{
                if(err){
                    res.status(500).send({message: 'Error general', err});
                }else if(user){
                    bcrypt.compare(sp[2], user.password, (err, passworOk)=>{
                        if(err){
                            res.status(500).send({message: 'Error', err})
                        }else if(passworOk){
                            if(params.gettoken = 'true'){
                                res.send({token: jwt.createToken(user)});
                            }else{
                                res.send({message: 'Error al generar TOKEN'});
                            }
                        }else{
                            res.send({message: 'Contraseña incorrecta'})
                        }
                    })
                }else{
                    res.send({message: 'Datos de inicio de sesión incorrectos, SINTAXIS: LOGIN (email||username) password'})
                }
            })
        }else{
            res.send({message: 'Error al iniciar sesión, SINTAXIS: LOGIN (email||username) password'});
        }

    }else if(sp[0].toUpperCase() == 'ADD_TWEET'){
        if(sp.length >= 2){
            var userId = req.user.sub;
            var tweet = new Tweet();
            var twee = "";

            for(var i = 1; i < sp.length; i++){
                var twee = twee + sp[i] + " "; 
            }

            tweet.tweet = twee;

            User.findByIdAndUpdate(userId, {$push:{tweets: tweet}}, {new: true}, (err, tweetAdded)=>{
                if(err){
                    res.status(500).send({message: 'Error general', err});
                }else if(tweetAdded){
                    res.send({message: 'El tweet se publicó correctamente', User: tweetAdded.name, Tweets: tweetAdded.tweets});
                }else{
                    res.status(404).send({message: 'Error',err});
                }
            })
        }else{
            res.send({message: 'Datos insuficientes, SINTAXIS: ADD_TWEET tweet'})
        }

    }else if(sp[0].toUpperCase() == 'DELETE_TWEET'){
        if(sp.length == 2){
            var userId = req.user.sub;
            var tweetId = sp[1];

            User.findOneAndUpdate({_id: userId, "tweets._id": tweetId}, {$pull:{tweets:{_id: tweetId}}}, {new: true}, (err, tweetdeleted)=>{
                if(err){
                    res.status(500).send({message: 'Error general', err});
                }else if(tweetdeleted){
                    res.send({message: 'Tweet eliminado', User: tweetdeleted.name, Tweets: tweetdeleted.tweets});
                }else{
                    res.status(418).send({message: 'ERROR'});
                }
            })
        }else{
            res.send({message: 'Error al eliminar tweet, SINTAXIS: DELETE_TWEET idTweet'})
        }

    }else if(sp[0].toUpperCase() == 'EDIT_TWEET'){
        if(sp.length >= 3){
            var userId = req.user.sub;
            var tweetId = sp[1];
            var twee = "";

            for(let i = 2; i < sp.length; i++){
                twee = twee + sp[i] + " ";
            }

            User.findOne({_id: userId}, (err, userOk)=>{
                if(err){
                    res.status(500).send({message: 'Error general', err});
                }else if(userOk){
                    User.findOneAndUpdate({_id: userId, "tweets._id": tweetId}, {"tweets.$.text": twee}, {new: true}, (err, tweetUpdated)=>{
                        if(err){
                            res.status(500).send({message: 'Error general', err});
                        }else if(tweetUpdated){
                            res.send({message: 'Tweet editado correctamente', User: tweetUpdated.name, Tweets: tweetUpdated.tweets});
                        }else{
                            res.status(418).send({message: 'ERROR'});
                        }
                    })
                }else{
                    res.status(404).send({message: 'ERROR 2'});
                }
            })
        }else{
            res.send({message: 'Error al editar tweet, SINTAXIS: EDIT_TWEET idTweet textoDelTweet'})
        }
    
    }else if(sp[0].toUpperCase() == 'VIEW_TWEETS'){
        if(sp.length == 2){
            
            User.findOne({username: sp[1]}, (err, userK)=>{
                if(err){
                    res.status(500).send({message: 'Error general', err});
                }else if(userK){
                    res.send({message: 'INFO TWEETS', User: userK.name, Username: userK.username, Tweets: userK.tweets});
                }else{
                    res.status(404).send({message: 'ERROR'});
                }
            })
        }else{
            res.send({message: 'Error al mostrar tweets, SINTAXIS: VIEW_TWEETS username'})
        }

    }else if(sp[0].toUpperCase() == 'FOLLOW'){
        if(sp.length == 2){
            var follower = new Follow();
            var user = req.user;

            if(user.username == sp[1]){
                res.send({message: 'Eres tu mismo, no puedes seguirte'});
            }else{
                follower._id = user.sub;
                follower.name = user.name;
                follower.username = user.username;

                User.findOneAndUpdate({username: sp[1], "followers._id": user.sub}, null, {new: true}, (err, userOk)=>{
                    if(err){
                        res.send({message: 'Error general', err});
                    }else if(userOk){
                        res.send({message: 'Ya sigues a este usuario'});
                    }else{
                        User.findOneAndUpdate({username: sp[1]}, {$push:{followers: follower}}, {new: true}, (err, followerOk)=>{
                            if(err){
                                res.status(500).send({message: 'Error general', err});
                            }else if(followerOk){
                                follower._id = followerOk._id;
                                follower.name = followerOk.name;
                                follower.username = followerOk.username;

                                User.findOneAndUpdate({_id: user.sub}, {$push:{follow: follower}}, {new: true}, (err, followOk)=>{
                                    if(err){
                                        res.status(500).send({message: 'Error general', err});
                                    }else if(followOk){
                                        res.send({message: 'COMENZASTE A SEGUIR AL USUARIO', User: followOk.name, Username: followOk.username, Follow: followOk.follow});
                                    }else{
                                        res.send({message: 'Error'});
                                    }
                                })
                            }else{
                                res.send({message: 'Usuario NO EXISTE'});
                            }
                        })
                    }
                })
            }
        }else{
            res.send({message: 'Error al seguir usuario, SINTAXIS: FOLLOW username'})
        }
    }

    else if(sp[0].toUpperCase() == 'UNFOLLOW'){
        if(sp.length == 2){
            var user = req.user;

            if(user.username == sp[1]){
                res.send({message: 'Es imposible realizar esta acción'});
            }else{

                User.findOneAndUpdate({_id: user.sub, "follow.username": sp[1]}, {$pull:{follow:{username: sp[1]}}}, {new: true}, (err, userOk)=>{
                    if(err){
                        res.send({message: 'Error general', err});
                    }else if(userOk){
                        User.findOneAndUpdate({username: sp[1], "followers._id": user.sub}, {$pull:{followers:{_id: user.sub}}}, {new: true}, (err, userdelete)=>{
                            if(err){
                                res.status(500).send({message: 'Error general', err});
                            }else if(userdelete){
                                res.send({message: 'Lo dejaste de seguir', User: userOk.name, Username: userOk.username, Follow: userOk.follow});
                            }else{
                                res.send({message: 'Error'})
                            }
                        })
                    }else{
                        res.send({message: 'No existe o no lo sigues'});
                    }
                })
            } 
        }else{
            res.send({message: 'Error al dejar de seguir usuario, SINTAXIS: UNFOLLOW username'})
        }
    }

    else if(sp[0].toUpperCase() == 'PROFILE'){
        if(sp.length == 2){
            var user = req.user;        

            User.findOne({username: sp[1]}, (err, userOk)=>{
                if(err){
                    res.status(500).send({message: 'Error general', err});
                }else if(userOk){
                    if(userOk.username == user.username){
                        res.send({message: 'PERFIL:', Name: userOk.name,
                                                                Username: userOk.username,
                                                                Email: userOk.email,
                                                                Password: userOk.password,
                                                                Tweets: userOk.tweets,
                                                                Follow: userOk.follow,
                                                                Followers: userOk.followers});
                    }else{
                        res.send({message: 'ERROR, NO ES SU PERFIL '})
                    }
                }else{
                    res.send({message: 'Perfil no encontrado'})
                }
            })
        
        }else{
            res.send({message: 'Error , SINTAXIS: PROFILE username'})
        }
    }

    else{
        res.send({message: 'NO SE RECONOCE EL COMANDO'});
    }
}



module.exports = {
    commands
}