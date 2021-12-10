var db = require('../config/connection')
var collection = require('../config/collection')
var objectId = require('mongodb').ObjectId;

const dotenv = require("dotenv");
dotenv.config();

module.exports = {
    getReportData: (type) => {
        console.log(type);
        const numberOfDays = type === 'Daily' ? 1 : type === 'Weekly' ? 7 : type === 'Monthly' ? 30 : type === 'Yearly' ? 365 : 0
        const dayOfYear = (date) =>
            Math.floor(
                (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
            )
        return new Promise(async (resolve, reject) => {
            let report = await db.get().collection(collection.orderCollection).aggregate(
                [
                    {
                        $match: {
                            date: { $gte: new Date(new Date() - numberOfDays * 60 * 60 * 24 * 1000) }, status: 'Completed'
                        }
                    }
                ]
            ).toArray()
            console.log(report);
            resolve(report)
        })
    },
    SalesReportAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            var orders = await db.get().collection(collection.orderCollection).aggregate([{ $match: { status: 'Completed' } }]).toArray()
            if (orders) {
                resolve(orders)
            } else {
                resolve(null)
            }
        })
    },
    getTotalSales: () => {
        console.log('data base report');
        return new Promise(async (resolve, reject) => {
            var detailts = await db.get().collection(collection.orderCollection).aggregate([
                {
                    $match: {
                        date: { $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000) }, status: 'Completed'
                    }
                },
                {
                    $project: { totalamount: 1, _id: 0 }
                }
            ]).toArray()
            let totalamount = []
            for (let i = 0; i < detailts.length; i++) {
                totalamount.push(detailts[i].totalamount)
            }
            console.log(totalamount);
            resolve(totalamount)
        })
    },
    // weekly sale in chart 
    getWeeklyUsers: async () => {
        const dayOfYear = (date) =>
            Math.floor(
                (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
            )
        return new Promise(async (resolve, reject) => {
            const data = await db.get().collection(collection.orderCollection).aggregate([
                {
                    $match: {
                        $and: [{ status: 'Completed' }],
                        date: { $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000) },
                    },
                },

                { $group: { _id: { $dayOfYear: '$date' }, count: { $sum: 1 } } },
            ]).toArray()

            console.log(data);

            const thisday = dayOfYear(new Date())
            let salesOfLastWeekData = []
            for (let i = 0; i < 8; i++) {
                let count = data.find((d) => d._id === thisday + i - 7)

                if (count) {
                    salesOfLastWeekData.push(count.count)
                } else {
                    salesOfLastWeekData.push(0)
                }
            }

            console.log(salesOfLastWeekData);
            resolve(salesOfLastWeekData)

        })
    },
    // report of order status
    getOrderStatusInGraph: async () => {
        const dayOfYear = (date) =>
            Math.floor(
                (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
            )
        return new Promise(async (resolve, reject) => {
            var statusResult = await db.get().collection(collection.orderCollection).aggregate([
                {
                    $match: { date: { $gte: new Date(new Date() - 365 * 60 * 60 * 24 * 1000) } }
                },
                {
                    $group: { _id: { status: "$status" }, statusDet: { $sum: 1 } }
                },
                {
                    $project: { statusDet: 1, _id: 0 }
                }
            ]).toArray()

            console.log(statusResult);

            let totalamount = []
            for (let i = 0; i < statusResult.length; i++) {
                totalamount.push(statusResult[i].statusDet)
            }

            console.log(totalamount);
            resolve(totalamount)
        })
    },
    // sales new sales report
    getOrdersStatus: () => {
        return new Promise(async (resolve, reject) => {
            const dayOfYear = (date) =>
                Math.floor(
                    (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
                )
            let cancelledOrders = await db.get().collection(collection.orderCollection).aggregate([
                {
                    $match: {
                        date: { $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000) },
                    }
                },
                {
                    $match: { status: 'Cancelled' }
                },
                {
                    $group: { _id: { $dayOfYear: '$date' }, count: { $sum: 1 } }
                }
            ]).toArray()
            const thisday = dayOfYear(new Date())
            let cancelOrder = []
            for (let i = 0; i < 8; i++) {
                let count = cancelledOrders.find((d) => d._id === thisday + i - 7)

                if (count) {
                    cancelOrder.push(count.count)
                } else {
                    cancelOrder.push(0)
                }
            }
            // complete the cancell qury
            let pending = await db.get().collection(collection.orderCollection).aggregate([
                {
                    $match: {
                        date: { $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000) },
                    }
                },
                {
                    $match: { status: 'pending' }
                },
                {
                    $group: { _id: { $dayOfYear: '$date' }, count: { $sum: 1 } }
                }
            ]).toArray()
            let pendingOrder = []
            for (let i = 0; i < 8; i++) {
                let count = pending.find((d) => d._id === thisday + i - 7)

                if (count) {
                    pendingOrder.push(count.count)
                } else {
                    pendingOrder.push(0)
                }
            }

            // complete the pending status
            let placed = await db.get().collection(collection.orderCollection).aggregate([
                {
                    $match: {
                        date: { $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000) },
                    }
                },
                {
                    $match: { status: 'placed' }
                },
                {
                    $group: { _id: { $dayOfYear: '$date' }, count: { $sum: 1 } }
                }
            ]).toArray()
            let placedOrder = []
            for (let i = 0; i < 8; i++) {
                let count = placed.find((d) => d._id === thisday + i - 7)

                if (count) {
                    placedOrder.push(count.count)
                } else {
                    placedOrder.push(0)
                }
            }

            // complete the placed
            let complete = await db.get().collection(collection.orderCollection).aggregate([
                {
                    $match: {
                        date: { $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000) }
                    }
                },
                {
                    $match: { status: 'Completed' }
                },
                {
                    $group: { _id: { $dayOfYear: '$date' }, count: { $sum: 1 } }
                }
            ]).toArray()
            let confirmOrder = []
            for (let i = 0; i < 8; i++) {
                let count = complete.find((d) => d._id === thisday + i - 7)

                if (count) {
                    confirmOrder.push(count.count)
                } else {
                    confirmOrder.push(0)
                }
            }

            // complete the complete status
            let shipping = await db.get().collection(collection.orderCollection).aggregate([
                {
                    $match: {
                        date: { $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000) }
                    }
                },
                {
                    $match: { status: 'Shipping' }
                },
                {
                    $group: { _id: { $dayOfYear: '$date' }, count: { $sum: 1 } }
                }
            ]).toArray()
            let shippingOrder = []
            for (let i = 0; i < 8; i++) {
                let count = shipping.find((d) => d._id === thisday + i - 7)

                if (count) {
                    shippingOrder.push(count.count)
                } else {
                    shippingOrder.push(0)
                }
            }
            // completed shipping
            let process = await db.get().collection(collection.orderCollection).aggregate([
                {
                    $match: {
                        date: { $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000) }
                    }
                },
                {
                    $match: { status: 'Processing' }
                },
                {
                    $group: { _id: { $dayOfYear: '$date' }, count: { $sum: 1 } }
                }
            ]).toArray()
            let processOrder = []
            for (let i = 0; i < 8; i++) {
                let count = process.find((d) => d._id === thisday + i - 7)

                if (count) {
                    processOrder.push(count.count)
                } else {
                    processOrder.push(0)
                }
            }
            let orderData = {
                cancel: cancelOrder,
                pending: pendingOrder,
                process: processOrder,
                complete: confirmOrder,
                shipping: shippingOrder

            }
            console.log(orderData);
            resolve(orderData)


        })
    },
    totalRevanu: () => {
        return new Promise(async(resolve, reject) => {
            const dayOfYear = (date) =>
                Math.floor(
                    (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
                )
           let weeklyRevenu= await db.get().collection(collection.orderCollection).aggregate([
                {
                    $match:{
                        date: { $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000) }
                    }
                },
                {
                    $project:{totalamount:1}
                },
                {
                     $group: { _id:null, total:{$sum:"$totalamount"} }
                }
            ]).toArray()
            resolve(weeklyRevenu)
        })
    },
    totalOrderCompletedCound:()=>{
        return new Promise(async(resolve,reject)=>{
            let complete = await db.get().collection(collection.orderCollection).aggregate([
                
                {
                    $match: { status: 'Completed' }
                },
                {
                    $group: { _id: null, count: { $sum: 1 } }
                }
            ]).toArray()
            
            if(complete){
                resolve(complete)
            }else{
                resolve(null)
            }
           
        })
    }
    

}
