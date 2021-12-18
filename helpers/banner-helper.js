var db = require('../config/connection')
var collection = require('../config/collection')
var objectId = require('mongodb').ObjectId;
const { response } = require('express');

module.exports = {
    addBanner:(banner)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.bannerCollection).insertOne(banner).then((response)=>{
                resolve(response)
                reject(null)
            })
        })
    },
    //find all banner
    getAllBanner:()=>{
        return new Promise(async(resolve,reject)=>{
           var banners = await db.get().collection(collection.bannerCollection).find().toArray()
           if(banners){
               resolve(banners)
           }else{
               resolve(null)
           }
        })
    } 
}