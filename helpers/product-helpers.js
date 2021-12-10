var collection = require('../config/collection')
var db = require('../config/connection')
var objectId = require('mongodb').ObjectId


module.exports = {
    // add product(add user) 

    addUser: (data) => {
        productObj = {
            productname: data.productname,
            manufacturername: data.manufacturername,
            manufacturerbrand: data.manufacturerbrand,
            quantity: parseInt(data.quantity),
            price: parseInt(data.price),
            category: data.category,
            subcategory: data.subcategory,
            productdiscription: data.productdiscription,
            cateOfferPercentage:0,
            proOfferPercentage:0,
            proOffer:false,
            cateOffer:false
        }

        console.log(data);
        return new Promise((resolve, reject) => {
            db.get().collection('product').insertOne(productObj).then((data) => {

                resolve(data)
            })
        })
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection('product').find().sort({_id:-1}).toArray()
            if (products) {
                resolve(products)
            } else {
                response(null)
            }

        })
    },
    deleteProduct: (proId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection('product').deleteOne({ _id: objectId(proId) }).then((response) => {
                resolve(response)
            })
        })

    },
    productDetails: (proId) => {
        return new Promise(async (resolve, reject) => {
            var product = await db.get().collection('product').findOne({ _id: objectId(proId) })
            console.log(product);
            if (product) {

                resolve(product)
            } else {
                reject(null)
            }

        })
    },

    editProduct: (proId) => {
        console.log(proId);
        console.log(proId, 'product');
        return new Promise((resolve, reject) => {
            db.get().collection('product').findOne({ _id: objectId(proId) }).then((product) => {
                resolve(product)
            })


        })

        // },
        // aftedrEditProduct:(proId)=>{
        //     return new Promise((resolve,reject)=>{
        //         db.get().collection('product').updateOne({})
        //     })
    },
    afterEditProduct: (proId, productdetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection('product').updateOne({ _id: objectId(proId) }, {
                $set: {
                    productname: productdetails.productname,
                    manufacturername: productdetails.manufacturername,
                    manufacturerbrand: productdetails.manufacturerbrand,
                    price: parseInt(productdetails.price),
                    productdiscription: productdetails.productdiscription

                }
            }).then((response) => {
                resolve(proId)
            })
        })
    },
    addProductShowCategory: (cateId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.categoryCollection).find().toArray().then((response) => {
                resolve(response)
            })

        })
    },
    productDividedCategory: (cateName) => {
        return new Promise(async (resolve, reject) => {
            var product = await db.get().collection('product').find({ category: cateName }).toArray()
            console.log(product);
            resolve(product)
        })
    },
    getSubProducts: (catName, subCateName) => {
        return new Promise(async (resolve, reject) => {
            var subProducts = await db.get().collection(collection.productCollection).find({ category: catName, subcategory: subCateName }).toArray()
            console.log(subProducts);
            if (subProducts) {
                resolve(subProducts)
            } else {
                resolve(null)
            }
        })
    },
    findProduct: (proId) => {
        return new Promise(async (resolve, reject) => {
            var product = await db.get().collection(collection.productCollection).aggregate([{ $match: { _id: objectId(proId) } }]).toArray();
            if (product) {
                resolve(product)
            } else {
                resolve(null)
            }


        })
    },
    searchProduct: (productName) => {
        return new Promise(async (resolve, reject) => {
            var products = await db.get().collection(collection.productCollection).find({ productname: { $regex: productName } }).toArray()
            if (products) {
                resolve(products)
            } else {
                resolve(null)
            }
        })
    },
    totalProductCount: () => {
        return new Promise(async (resolve, reject) => {
            let totalItems = await db.get().collection(collection.productCollection).find({}).toArray()
            console.log(totalItems.length);
            if (totalItems.length) {
                resolve(totalItems.length)
            } else {
                resolve(null)
            }
        })
    },
    filterProductInPrice:(minimum,maximum)=>{
        return new Promise(async(resolve,reject)=>{
         let product =await db.get().collection(collection.productCollection)
         .aggregate([{$match:{$and:[{price:{$gte:minimum}},{price:{$lte:maximum}}]}}]).toArray()
         console.log(product);
         if(product){
             resolve(product)
         }else{
             resolve(null)
         }
        })
    }


}

