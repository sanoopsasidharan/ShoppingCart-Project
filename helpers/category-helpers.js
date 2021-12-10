
var db = require('../config/connection')
var collection = require('../config/collection')
var objectId = require('mongodb').ObjectId;
const { response } = require('express');

module.exports = {

    addCategory: (categoryName,cateOffer) => {
        return new Promise(async (resolve, reject) => {
            var findcategory = await db.get().collection(collection.categoryCollection).findOne({ category: categoryName })
            if (findcategory) {
                resolve({ status: false })
            } else {
                db.get().collection(collection.categoryCollection).insertOne({ category: categoryName,cateOffer:cateOffer}).then((result) => {
                    resolve({ status: true })
                })
            }
        })
    },
    showAllCategory: () => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.categoryCollection).find().toArray()
            resolve(category)
        })
    },
    categoryDetails: (cateId) => {
        return new Promise(async (resolve, reject) => {
            var category = await db.get().collection(collection.categoryCollection).findOne({ _id: objectId(cateId) })
            if (category) {
                resolve(category)
            } else {
                reject(category)
            }
        })
    },
    addSubcategory: (cateName, subcateName) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.categoryCollection).findOne({category: cateName, subcategory:subcateName }).then(async(findsubcate) => {
                if (findsubcate) {
                    resolve({status:false})
                } else {
                    var subcate =await db.get().collection(collection.categoryCollection).updateOne({ category: cateName }, { $push: { subcategory: subcateName } })
                    if (subcate) {
                        resolve({ status: true });
                    } else {
                        resolve({ status: null })
                    }
                }
            })

        })
    },
    deletecategory: (cateId) => {
        return new Promise(async (resolve, reject) => {
            var response = await db.get().collection(collection.categoryCollection).deleteOne(cateId)
            if (response) {
                resolve(response)
            } else {
                reject(null)
            }
        })
    },
    showSubcateAddproduct: (cateName) => {
        return new Promise(async (resolve, reject) => {
            var subcat = await db.get().collection(collection.categoryCollection).findOne({ category: cateName })
            let x = subcat.subcategory
            // console.log(x);
            // console.log(subcat.subcategory);
            // console.log(subcat);
            if (subcat) {
                resolve(subcat.subcategory)
            }
        })
    },
    showAllCategorysubcate: () => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.categoryCollection).find().toArray()
            if (category) {
                resolve(category)
            }
            resolve(null)
        })
    },
    deleteSubcategory: (cateId, subCatname) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.categoryCollection).updateOne({ _id: objectId(cateId) }, { $pull: { subcategory: subCatname } }).then((response) => {
                console.log(response);
                resolve({ status: true })
            })
        })
    },
    // findusercategory:(cateId)=>{
    //     return new Promise(async(resolve,reject)=>{
    //         let subcat = await db.get().collection(collection.categoryCollection).findOne({_id:objectId(cateId)})
    //         console.log(subcat);
    //     })

    // }

    listOfSubcategory: (cateId) => {
        return new Promise(async (resolve, reject) => {
            var subcategory = await db.get().collection(collection.categoryCollection).findOne({ _id: objectId(cateId) })
            if (subcategory) {
                resolve(subcategory)
            } else {
                resolve(null)
            }
        })
    },
    // edit category 
    editCategory: (cateName, newCateName) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.categoryCollection).updateOne({ category: cateName }, { $set: { category: newCateName } }).then((response) => {
                console.log(response);
                db.get().collection(collection.productCollection).update({ category: cateName }, { $set: { category: newCateName } }, { multi: true }).then((response) => {
                    resolve(response)
                })
            })
        })

    }

}
