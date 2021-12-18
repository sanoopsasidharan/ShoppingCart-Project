var db = require('../config/connection')
var collection = require('../config/collection')
var objectId = require('mongodb').ObjectId;

const dotenv = require("dotenv");
dotenv.config();
var cc = require('coupon-code');

module.exports = {

    addCategoryOffer: (cateName, cateOffer) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.categoryCollection)
                .updateOne({ category: cateName }, { $set: { cateOffer: true } }).then((updateCateTrue) => {

                    db.get().collection(collection.categoryOfferCollecion).
                        insertOne(cateOffer).then((response) => {
                            let cateOfferId = response.insertedId + ''
                            console.log(cateOfferId);
                            console.log(cateOffer.percentage, cateOffer.expirydate);


                            db.get().collection(collection.productCollection)
                                .updateMany({ category: cateName }, { $set: { cateOfferId: cateOfferId, cateOfferPercentage: cateOffer.percentage, cateOfferExdate: cateOffer.expirydate } })
                                .then((response) => {

                                    resolve({ status: true })
                                    reject({ status: false })
                                })
                        })
                })

        })
    },
    showAllCategoryOffer: () => {
        return new Promise(async (resolve, reject) => {
            var alloffers = await db.get().collection(collection.categoryOfferCollecion).find().toArray()
            if (alloffers) {
                resolve(alloffers)
            } else {
                resolve(null)
            }
        })
    },
    deleteCategoryOffer: (cateOfferId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.categoryOfferCollecion).deleteOne({ _id: objectId(cateOfferId) }).then((response) => {
                resolve({ status: true })
                reject({ status: false })
            })
        })
    },
    // addOfferInCategory:(cateName,cateOffer)=>{
    //     return new Promise((resolve,reject)=>{
    //         db.get().collection(collection.categoryOfferCollecion).updateMany({category:cateName},{$set:{kkm:'sanoop','bike':'fz'}})
    //     })
    // }
    showAllNoCategoryOffers: () => {
        return new Promise(async (resolve, reject) => {
            var categorys = await db.get().collection(collection.categoryCollection).find({ cateOffer: { $ne: true } }).toArray()
            if (categorys) {
                resolve(categorys)
            } else {
                resolve(null)
            }

        })
    },
    showAllProductOffers: () => {
        return new Promise(async (resolve, reject) => {
            var alloffers = await db.get().collection(collection.productOfferCollection).find().toArray()
            if (alloffers) {
                resolve(alloffers)
            } else {
                resolve(null)
            }
        })
    },
    addproductOffer: (offer) => {
        return new Promise(async (resolve, reject) => {
            var response = await db.get().collection(collection.productOfferCollection).insertOne(offer)
            if (response) {
                resolve({ status: true })
            } else {
                resolve({ status: false })
            }
        })
    },
    deleteProductOffer: (productOfferId) => {
        return new Promise(async (resolve, reject) => {
            let response = await db.get().collection(collection.productOfferCollection).deleteOne({ _id: objectId(productOfferId) })
            let removeProOffer = await db.get().collection(collection.productCollection)
                .updateMany({ ProOfferId: productOfferId },
                    { $set: { ProOfferId: '', proOfferName: '', proOfferExpDate: '', proOfferPercentage: 0, proOffer: false } })
            console.log(removeProOffer);
            if (response) {
                resolve({ status: true })
            } else {
                resolve({ status: false })
            }
        })
    },
    getAllProductOffers: () => {
        return new Promise(async (resolve, reject) => {
            var allProductOffers = await db.get().collection(collection.productOfferCollection).find().toArray()
            allProductOffers ? resolve(allProductOffers) : resolve(null)
        })
    },
    addProductOffer: (productOffer) => {
        return new Promise(async (resolve, reject) => {
            var response = await db.get().collection(collection.productCollection)
                .updateOne({ _id: objectId(productOffer.proId) },
                    { $set: { ProOfferId: productOffer.productOfferId, proOfferName: productOffer.ProductOfferName, proOfferExpDate: productOffer.ProductOfferExpirydate, proOfferPercentage: productOffer.ProductOfferPercentage, proOffer: true } })
            response ? resolve({ status: true }) : resolve(null)

        })
    },
    // add new coupon
    addNewCoupon: (coupon) => {
        let code = cc.generate();
        coupon.code = code
        return new Promise((resolve, reject) => {
            db.get().collection(collection.couponCollection).insertOne(coupon).then((response) => {
                resolve({ status: true })
                reject({ status: false })
            })
        })
    },
    // exisiting coupons list 
    exisitingCoupons: () => {
        return new Promise(async (resolve, reject) => {
            var coupons = await db.get().collection(collection.couponCollection).find().sort({ _id: -1 }).toArray()
            if (coupons) {
                resolve(coupons)
            } else {
                resolve(null)
            }

        })
    },
    // delete coupon
    deleteCoupon: (coupId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.couponCollection).deleteOne({ _id: objectId(coupId) }).then((response) => {
                resolve({ status: true })
                reject({ status: false })
            })
        })
    },
    // user side show available coupons 
    AvailableCoupons: () => {
        return new Promise(async (resolve, reject) => {
            var allCoupons = await db.get().collection(collection.couponCollection).find().toArray()
            if (allCoupons) {
                resolve(allCoupons)
            } else {
                resolve(null)
            }
        })
    },
    checkingVaildCoupone: (cpCode,total) => {
        return new Promise(async (resolve, reject) => {
            let userUseCoupone = await db.get().collection(collection.userCollection).findOne({ couponeId: cpCode })
            console.log(userUseCoupone);
            if (userUseCoupone) {
                resolve({ useed: true })
            } else {
                var coupone = await db.get().collection(collection.couponCollection).findOne({ code: cpCode })
                if (coupone) {
                    console.log(coupone);
                    var applycoupon = Math.round (total - (total * coupone.percentage)/100)
                    resolve({ status: true, coupone,applycoupon })
                } else {

                    resolve({ status: false })
                }

            }

        })
    },
    checkCouponVaild: (code) => {
        return new Promise(async(resolve, reject) => {
            var coupone = await db.get().collection(collection.couponCollection).findOne({code:code})
            if(coupone){
                resolve(coupone)
            }else{
                resolve(null)
            }
        })

    }


}