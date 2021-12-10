var db =require('../config/connection')
var collection = require('../config/collection')
var objectId=require('mongodb').ObjectId;
const { response } = require('express');
const  Razorpay = require('razorpay');
const { resolve } = require('path');

const dotenv=require("dotenv");
dotenv.config();


var instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret,
  });

module.exports={
    getUserOrder:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orders = await db.get().collection(collection.orderCollection)
            .find({userId:objectId(userId)}).sort({_id:-1}).toArray()
            console.log('its orders');
            console.log(orders);
            resolve(orders);

        })
    },
    getOrderProducts:(orderId)=>{
        console.log(orderId);
        return new Promise(async(resolve,reject)=>{
            let orderItems=await db.get().collection(collection.orderCollection).aggregate([
                {
                    $match:{_id:objectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                        status:'$status',
                        totalamount:'$totalamount'

                    }
                },
                {
                    $lookup:{
                        from:collection.productCollection,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        status:1,totalamount:1,item:1,quantity:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            
            resolve(orderItems)
        })
    },
    updateOrderStatus:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            var status =await db.get().collection(collection.orderCollection).updateOne({_id:objectId(orderId)},{$set:{status:'Cancelled'}})
            if(status){
                resolve({status:true})
            }else{
                resolve({status:false})
            }
        })
    },
    // show all orders in admin
    getAllOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            var allOrders = await db.get().collection(collection.orderCollection).find().sort({_id:-1}).toArray()
            if(allOrders){
                resolve(allOrders)
            }else{
                resolve(null)
            }
        })
    },
    // change order status in admin 
    changeOrderStatus:(orderId,statusName)=>{
        return new Promise(async(resolve,reject)=>{
            var changedstatus=await db.get().collection(collection.orderCollection).updateOne({_id:objectId(orderId)},{$set:{status:statusName}})
            if(changedstatus){
                resolve({status:true})
            }else{
                resolve(null)
            }
        })
    },
    generateRazorpay:(orderId,totalPrice)=>{
        return new Promise((resolve,reject)=>{

            var options = {
                amount: totalPrice*100,
                currency: "INR",
                receipt: ''+orderId
              };
              instance.orders.create(options, function(err, order) {
                  console.log('new order id',order);
                  if(err){
                     console.log(err);
                  }else{
                    console.log('new order id',order);
                    resolve(order)

                  }
                  
              });
        })
    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto =require('crypto');
            let hmac = crypto.createHmac('sha256', 'NGRBvZ7b5Yej9B1Wu1HKPwSc');
            hmac.update(details['Payment[razorpay_order_id]']+'|'+details['Payment[razorpay_payment_id]']);
            // console.log(hmac.digest('hex'));
            hmac=hmac.digest('hex')
            if(hmac===details['Payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
              

        })
    },
    OnlinePaymentChangeStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.orderCollection)
            .updateOne({_id:objectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }).then(()=>{
                resolve()
            })
        })
    }
    
    
}