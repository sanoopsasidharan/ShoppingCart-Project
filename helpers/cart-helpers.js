var db =require('../config/connection')
var collection = require('../config/collection')
var objectId=require('mongodb').ObjectId;
const { cartCollection } = require('../config/collection');
module.exports={
    addToCart:(proId,userId)=>{
        let proObj={
            item:objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            var userCart= await db.get().collection(collection.cartCollection).findOne({user:objectId(userId)})
            if(userCart){
                let proExist=userCart.products.findIndex(product=> product.item==proId)
                console.log(proExist);
                if(proExist!=-1){
                    db.get().collection(collection.cartCollection)  
                    .updateOne({user:objectId(userId),'products.item':objectId(proId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }
                    ).then(()=>{
                        resolve()
                    })
                }else{
                db.get().collection(collection.cartCollection)
                .updateOne({user:objectId(userId)},
                {
                    $push:{products:proObj}
                }
                ).then((response)=>{
                    resolve()
                })

                }
            }else{
               let cartObj={
                   user:objectId(userId),
                   products:[proObj]
               }
               db.get().collection(collection.cartCollection).insertOne(cartObj).then((response)=>{
                   resolve()
               })
                
            }
        })
    },
    // showCart:()=>{
    //     return new Promise(async(resolve,reject)=>{
    //       var cartItems=await db.get().collection(collection.cartCollection).find().toArray()
    //       console.log(cartItems);
    //       if(cartItems){
    //           resolve(cartItems)
    //       }else{
    //           console.log('error');
    //       }
    //     })
    // }

    showCart:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems = await db.get().collection(collection.cartCollection).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {

                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
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
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:1,subTotal:{$multiply:['$quantity','$product.price']}

                    }
                }
                
            ]).toArray()
            for(let i = 0; i<cartItems.length;i++){
                if(cartItems[i].product.proOfferPercentage > 0 || cartItems[i].product.cateOfferPercentage > 0){
            
                   if(cartItems[i].product.proOfferPercentage > cartItems[i].product.cateOfferPercentage){
                   
                    cartItems[i].subTotal = Math.round (cartItems[i].product.price * cartItems[i].quantity * 0.01 *(100 - cartItems[i].product.proOfferPercentage))
                    cartItems[i].product.price =Math.round (cartItems[i].product.price * 0.01*(100-cartItems[i].product.proOfferPercentage))
                    console.log('true');
                   }else{
                    
                    cartItems[i].subTotal=Math.round (cartItems[i].product.price * cartItems[i].quantity * 0.01 * (100 - cartItems[i].product.cateOfferPercentage))
                    cartItems[i].product.price =Math.round (cartItems[i].product.price * 0.01*(100-cartItems[i].product.cateOfferPercentage))
                    console.log('fales');
                   }
               }
            }

            resolve(cartItems)
            
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count = 0
            let cart =await db.get().collection(collection.cartCollection).findOne({user:objectId(userId)})

            if(cart){
                count = cart.products.length
                console.log(count);
            }
            resolve(count)
        })
    },
    changeProductCound:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)

        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collection.cartCollection)
                .updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}}
                }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })
            }else{

        
            db.get().collection(collection.cartCollection)  
                    .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
                    {
                        $inc:{'products.$.quantity':details.count}
                    }
                    ).then((response)=>{
                        resolve({status:true})
                    })
                }
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let a = await db.get().collection(collection.cartCollection).findOne({user:objectId(userId)})
          if(a.products.length!=0){

            let total = await db.get().collection(collection.cartCollection).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {

                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
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
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$product.price']}}

                    }
                }
                
            ]).toArray()


            let cartItems = await db.get().collection(collection.cartCollection).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {

                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
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
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:1,subTotal:{$multiply:['$quantity','$product.price']}

                    }
                }
                
            ]).toArray()

            let OfferTotal = 0 
             
            for( let s = 0; s < cartItems.length; s++){

                if(cartItems[s].product.proOfferPercentage > 0 || cartItems[s].product.cateOfferPercentage > 0 ){
                    if(cartItems[s].product.proOfferPercentage > cartItems[s].product.cateOfferPercentage){
                        OfferTotal += Math.round (cartItems[s].product.price * cartItems[s].quantity * 0.01 *(100 - cartItems[s].product.proOfferPercentage))

                    }else{
                        OfferTotal += Math.round (cartItems[s].product.price * cartItems[s].quantity * 0.01 *(100 - cartItems[s].product.cateOfferPercentage))
                    }
                }else{

                    OfferTotal += cartItems[s].subTotal
                }
            }
            


            // console.log(OfferTotal);
            // console.log(cartItems);
            // console.log(total);

            resolve(total[0].total,OfferTotal)
            let OrginalPrice = total[0].total
            // this is the price 
            // resolve({OrginalPrice,OfferTotal})


            // error when cart is empty then didnt open cart 
        }else{
            resolve(0)
        }
            
        })
    },
    placeOrder:(order,products,total,addres)=>{
        return new Promise((resolve,reject)=>{
            let status=order.paymentmethod==='COD'?'placed':'pending'
            let orderObj={
                deliveryDetails:addres[0].address
                // deliveryDetails:{
                //     number:addres[0].number,
                //     address:addres[0].address,
                //     location:addres[0].location,
                //     pincode:addres[0].pincode,
                //     state:addres[0].state
                // }
                ,
                userId:objectId(order.userId),
                paymentmethod:order.paymentmethod,
                products:products,
                totalamount:total,
                status:status,
                date:new Date()
            }

            db.get().collection(collection.orderCollection).insertOne(orderObj).then((response)=>{
                // db.get().collection(collection.cartCollection).deleteOne({user:objectId(order.userId)})
                db.get().collection(collection.cartCollection).updateOne({user:objectId(order.userId)},{$set:{products:[]}})
                console.log('insert oreder response',response.insertedId);
                resolve(response.insertedId)
            })

        })

    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart = await db.get().collection(collection.cartCollection).findOne({user:objectId(userId)})
            if(cart){

                resolve(cart.products)
            }else{
                resolve(null)
            }
           
        })
    },
    getSubTotal:(data)=>{
        console.log(data);
        return new Promise(async(resolve,reject)=>{
            if(data.quantity==1 && data.count==-1){
                resolve(0)
            }else{
                // var cartcollecion=await db.get().collection(collection.cartCollection).findOne({user:objectId(data.user)})
                var subtotal=await db.get().collection(collection.cartCollection).aggregate([
                    {
                        $match:{user:objectId(data.user)}
                    },
                    {
                        $unwind:'$products'
                    },
                    {
                        $project:{
                            item:'$products.item',
                            quantity:'$products.quantity'
                        }
                    },
                    {

                        $match:{item:objectId(data.product)}
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
                        $project:{_id:0, quantity:1,product:{$arrayElemAt:['$product',0]}}
                    },
                    {
                        $project:{product:1,quantity:1,subTotal:{$multiply:['$quantity','$product.price']}}

                    }

                ]).toArray()

                for(let j = 0; j < subtotal.length; j++ ){
                    if(subtotal[j].product.proOfferPercentage > 0 || subtotal[j].product.cateOfferPercentage > 0){
                        if(subtotal[j].product.proOfferPercentage > subtotal[j].product.cateOfferPercentage){
                        
                            subtotal[j].subTotal = Math.round ( subtotal[j].product.price *  subtotal[j].quantity * 0.01 *(100 - subtotal[j].product.proOfferPercentage))

                        }else{
                            
                            subtotal[j].subTotal = Math.round ( subtotal[j].product.price *  subtotal[j].quantity * 0.01 *(100 - subtotal[j].product.cateOfferPercentage))
                        }
                    }
                }

                console.log(subtotal[0].subTotal);
                resolve(subtotal[0].subTotal)

            }
         
        })
    },
    // delete single product in cart 
    deleteProductInCart:(cartId,proId)=>{
        console.log(cartId,proId);
        return new Promise(async(resolve,reject)=>{
            var deleteProduct=await db.get().collection(collection.cartCollection).updateOne({_id:objectId(cartId)},
            {$pull:{products:{item:objectId(proId)}}})
            console.log(deleteProduct);
            if(deleteProduct){
                resolve({status:true})
            }else{
                resolve({status:false})
            }
        })
    }


}