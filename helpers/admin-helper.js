var collection = require('../config/collection')
var db =require('../config/connection')
const crypto=require("crypto");
var objectId=require('mongodb').ObjectId;
const { resolve } = require('path');
const { rejects } = require('assert');
module.exports={
    adminLogin:(admin)=>{
        return new Promise(async(resolve,reject)=>{
          var adminData = await db.get().collection('admin').findOne(admin)
          if(adminData){
              resolve({status:true})
          }else{
              resolve({status:false})
          }
        })
    }
}