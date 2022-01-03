var collection = require('../config/collection')
var db = require('../config/connection')
// const bcrypt = require('bcrypt')
const crypto = require("crypto");
var objectId = require('mongodb').ObjectId;
const { resolve } = require('path');
const { rejects } = require('assert');
const { response } = require('express');
const { v4: uuidv4 } = require('uuid');

var cc = require('coupon-code');

module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            let code = cc.generate();
            userData.refarralcode = code
            userData.refarralamount = 0
            userData.pic =false
            userData.copArray = []
            console.log(userData.email);
            userData.password = await crypto.createHmac('sha256', userData.password).update('hellos').digest('hex');
            db.get().collection(collection.userCollection).findOne({ $or: [{ number: userData.number }, { email: userData.email }] }).then((findNumber) => {
                if (findNumber) {
                    resolve({ status: false })
                } else {
                    db.get().collection(collection.userCollection).insertOne(userData).then(async(userResponse) => {
                        console.log(userResponse.insertedId)
                        var newUserId =''+userResponse.insertedId
                        let addreObj = {
                            user: objectId(newUserId),
                            address: [{
                                addresId: new objectId(),
                                name: userData.name,
                                number: userData.number,
                                userId: userData.newUserId
                            }]
                        }
                        await db.get().collection(collection.addressCollection).insertOne(addreObj)
                        if(userData.usedRefferalCode !=''){
                            let reffPerson = await db.get().collection(collection.userCollection).findOne({refarralcode:userData.usedRefferalCode})
                            if(reffPerson){
                                var wallet = reffPerson.refarralamount
                                wallet = wallet+100
                                console.log(wallet);
                                console.log('wallet');
                             var updateWallet = await db.get().collection(collection.userCollection).updateOne({refarralcode:userData.usedRefferalCode},{$set:{refarralamount:wallet}})
                             var updateNewuserWallet = await db.get().collection(collection.userCollection).updateOne({_id:objectId(newUserId)},{$set:{refarralamount:50}})
                             console.log(updateNewuserWallet);
                             console.log(updateWallet);

                            }

                        }       
                        resolve({ status: true })
                    })
                }
            })

        })

    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false;
            let response = {}
            let user = await db.get().collection(collection.userCollection).findOne({ email: userData.email })

            if (user) {
                userData.password = await crypto.createHmac('sha256', userData.password).update('hellos').digest('hex');

                if (userData.password === user.password) {
                    response.user = user;
                    response.status = true;
                    if (response.user.isactive) {
                        console.log(response);
                        console.log('response');
                        resolve(response)
                    } else {
                        resolve({ isactive: false })
                    }
                    // console.log(response.user.isactive,'isative');


                    // if(user.isactive){

                    //     response.user=user;
                    //     response.status=true;
                    //     resolve(response)
                    // }else{

                    //     resolve({status:false,blocked:true})
                    //     console.log('error');
                    // }



                } else {
                    resolve({ status: false })
                    console.log('error');
                }

            } else {
                console.log('login failed 1');
                resolve({ status: false })
            }
        })


    },
    usergetAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection('product').find().toArray()

            resolve(products)

        })
    },
    getAllusers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.userCollection).find().sort({_id:-1}).toArray()

            resolve(users)

        })
    },
    blockuser: ((userId) => {
        return new Promise(async (resolve, reject) => {

            await db.get().collection(collection.userCollection).updateOne({ _id: objectId(userId) }, { $set: { isactive: false } }).then((response) => {
                resolve({ status: true, userId });
            })
        })
    }),
    unblockuser: ((userId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.userCollection).updateOne({ _id: objectId(userId) }, { $set: { isactive: true } }).then((response) => {
                resolve({ status: true });
            })
        })
    }),
    numberOtpValidation: (number) => {
        return new Promise(async (resolve, reject) => {

            var result = await db.get().collection(collection.userCollection).findOne({ number: number })
            if (result) {
                resolve(result)
            } else {
                reject(null)
                // resolve(null)

            }

        })
    },

    // showAllAddress:(userId)=>{
    //     return new Promise(async(resolve,reject)=>{

    //        var addres=await db.get().collection(collection.addressCollection).findOne({user:objectId(userId)})
    //        console.log(addres);
    //        if(addres){

    //        }else{

    //        }
    //     })
    // },


    // add new address
    addNewAddress: (address, userId) => {
        let addreObj = {
            user: objectId(userId),
            address: [{
                addresId: new objectId(),
                name: address.name,
                number: address.number,
                address: address.address,
                location: address.location,
                City: address.City,
                pincode: address.pincode,
                state: address.state,
                userId: address.userId
            }]
        }
        let newAddress = {
            addresId: new objectId(),
            name: address.name,
            number: address.number,
            address: address.address,
            location: address.location,
            City: address.City,
            pincode: address.pincode,
            state: address.state,
            userId: address.userId
        }


        return new Promise(async (resolve, reject) => {
            var addres = await db.get().collection(collection.addressCollection).findOne({ user: objectId(userId) })
            if (addres) {
                db.get().collection(collection.addressCollection).updateOne({ user: objectId(userId) },
                    {
                        $push: { address: newAddress }
                    }).then((response) => {
                        console.log(response);
                        resolve()
                    })
            } else {
                await db.get().collection(collection.addressCollection).insertOne(addreObj).then((response) => {
                    console.log(response);
                    resolve()
                })
            }

        })
    },
    showAllAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            var addName = await db.get().collection(collection.addressCollection).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$address'
                },
                {
                    $project: { address: '$address' }
                }
            ]).toArray()

            if (addName) {
                resolve(addName)
            } else {
                resolve(null)
            }
        })
    }


    // find all address
    // showAllAddress:(userId)=>{
    //     return new Promise(async(resolve,reject)=>{
    //         var address = await db.get().collection(collection.addressCollection).findOne({user:objectId(userId)})
    //         console.log(address);
    //         if(address){
    //             resolve(address)
    //         }else{
    //             resolve(null)
    //         }
    //     })
    // }
    ,
    getOneAddress: (addressId, userId) => {
        return new Promise(async (resolve, reject) => {
            //findOne({user:objectId(userId)},{address: {$elemMatch: {addresId:objectId(addressId)}}})
            var addres = await db.get().collection(collection.addressCollection).aggregate([
                {
                    $unwind: "$address"
                },
                {
                    $match: {
                        user: objectId(userId), "address.addresId": objectId(addressId)
                    }
                }
            ]).toArray()
            // .findOne({address:{$elemMatch:{addresId : objectId(addressId)}}})
            // .findone({addresId:{$in:[objectId(addressId)]}})
            // .find({"_id" : {"$in" : [ObjectId("55880c251df42d0466919268")]}});
            // .find({user:objectId(userId)}).toArray()
            // .aggregate([{$match:{user:objectId(userId),addresId:objectId(addressId)}}])

            if (addres) {
                resolve(addres);
            } else {
                resolve(null)
            }
        })
    },
    addToWishlist: (proId, userId) => {
        return new Promise(async (resolve, reject) => {
            let proObj={
                product:objectId(proId),
            }
            var userWishlist = await db.get().collection(collection.wishlistCollection).findOne({ user: objectId(userId) })
 
            if (userWishlist) {

                var wishProduct = await db.get().collection(collection.wishlistCollection).aggregate([
                    {
                        $unwind: "$products"
                    },
                    {
                        $match: {
                            user: objectId(userId), "products.product": objectId(proId)
                        }
                    }
                ]).toArray()


                // var wishProduct = await db.get().collection(collection.wishlistCollection)
                // .findOne({user:objectId(userId)},{products: {$elemMatch: {product:objectId(proId)}}})
                console.log(wishProduct.length===0);
                if (wishProduct.length===0) {

                    db.get().collection(collection.wishlistCollection)
                        .updateOne({ user: objectId(userId) },
                            {
                                $push: { products:proObj}
                            }
                        ).then((response) => {
                            resolve({status:true})
                        })
                   
                } else {
                    resolve({status:false})
                }
            } else {
                let wishObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.wishlistCollection).insertOne(wishObj).then((response) => {
                    resolve({status:true})
                })

            }

        })
    },
    // show user wishlists
    showAllWishlists:(userId)=>{
        return new Promise(async(resolve,reject)=>{
           var wishlists=await db.get().collection(collection.wishlistCollection)
           .aggregate([
               {
                   $match:{user:objectId(userId)}
               },
               {
                   $unwind:'$products'
               },
               {
                   $project:{
                       product:'$products.product'
                   }
               },
               {
                   $lookup:{
                       from:collection.productCollection,
                       localField:'product',
                       foreignField:'_id',
                       as:'product'

                   }
               }
           ]).toArray()
    
           resolve(wishlists)




        //    .aggregate([{$match:{user:objectId(userId)}}]).toArray()
        //    if(wishlists){
        //        resolve(wishlists)
        //    }else{
        //        resolve(null)
        //    }
        })
    },
    removeWishlistProduct:(proId,userId)=>{
        return new Promise(async(resolve,reject)=>{
            var removeProduct = await db.get().collection(collection.wishlistCollection)
            .updateOne({user:objectId(userId)},{$pull:{products:{product:objectId(proId)}}})

            console.log(removeProduct);
            if(removeProduct){
                resolve({status:true})
            }else{
                resolve({status:false})
            }
        })
    },
    DeleteUserAddress:(id,addressId)=>{

        return new Promise ((resolve,rejects)=>{
            db.get().collection(collection.addressCollection).updateOne({_id:objectId(id)},{$pull:{address:{addresId:objectId(addressId)}}}).then((response)=>{
                resolve({status:true})
                rejects({status:false})
            })
        })
    },
    userDetails:(userId)=>{
        return new Promise(async(resolve,rejects)=>{
          var userDetails = await  db.get().collection(collection.userCollection).findOne({_id:objectId(userId)})
          if(userDetails){
              resolve(userDetails)
          }else{
              resolve(null)
          }
        })
    },
    editUserDetails:(user,Id)=>{
        return new Promise( async (resolve,rejects)=>{
           await db.get().collection(collection.userCollection).findOne({_id:objectId(Id)}).then((response)=>{
                user.password = crypto.createHmac('sha256',user.password).update('hellos').digest('hex');

                if (user.password === response.password) {
                    db.get().collection(collection.userCollection).updateOne({ _id: objectId(Id) }, {
                        $set: {
                            name: user.name,
                            email: user.email,
                            number: user.number
                        }
                    }).then((response)=>{
                        resolve({status:true})
                        rejects({status:false})
                    })

                }else{
                   resolve({status:false})
                }
            })
        })
    },
    eidtUserPassword:(user,Id)=>{
        return new Promise(async(resolve,rejects)=>{

           await db.get().collection(collection.userCollection).findOne({_id:objectId(Id)}).then(async(response)=>{

                checkpassword = await crypto.createHmac('sha256', user.password).update('hellos').digest('hex');


                if (checkpassword === response.password){

                    user.newPassword = await crypto.createHmac('sha256', user.newPassword).update('hellos').digest('hex');
                    await db.get().collection(collection.userCollection).updateOne({ _id: objectId(Id)}, {
                        $set:{password:user.newPassword}}).then((response)=>{

                        resolve({status:true})
                        rejects({status:false})
                    })
                }else{
                    resolve({status:false})
                }

            })
        
        })
    },
    // change user profile status 
    changePic:(id)=>{
        return new Promise(async(resolve,reject)=>{
           let change = await  db.get().collection(collection.userCollection).updateOne({_id:objectId(id)},{$set:{pic:true}})
           if(change){
               resolve()
           }else{
               resolve()
           }
        })
    },
    // find refferal coupon 
    findRefferalCode:(CpId)=>{
        return new Promise(async(resolve,reject)=>{
          var respons = await  db.get().collection(collection.userCollection).findOne({refarralcode:CpId})
            if(respons){
                resolve({status:true,CpId})
            }else{
                resolve({status:false})
            }
        })
    },
    useWalletamount:(userId,amount)=>{
        return new Promise(async(resolve,reject)=>{
            let changeWalletAmount = await  db.get().collection(collection.userCollection).updateOne({_id:objectId(userId)},{$set:{refarralamount:amount}})
            console.log('changeWalletAmount');
            console.log(changeWalletAmount);
            resolve(changeWalletAmount)
        })
    },
    showalluserCount:()=>{
        return new Promise(async(resolve,reject)=>{
           var count = await db.get().collection(collection.userCollection).find().toArray()
           if(count.length){
               resolve(count.length)
           }else{
               resolve(null)
           }
        })
    }





}

