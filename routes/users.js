var express = require('express');
const { response } = require('../app');
const categoryHelpers = require('../helpers/category-helpers');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
const userHelpers = require('../helpers/user-helpers')
const cartHelpers = require('../helpers/cart-helpers')
const orderHelpers = require('../helpers/order-helper')
const offerAndCouponHelpers = require('../helpers/offer-and-coupone-helper');
const bannerHelper = require('../helpers/banner-helper');
let fs = require('fs')
const dotenv = require("dotenv");
dotenv.config();

// paypal 
const paypal = require('paypal-rest-sdk');

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.client_id,
  'client_secret': process.env.client_secret
});


var logo = false
var blocked = false

const serviceID = process.env.serviceID
const accountSID = process.env.accountSID
const authToken = process.env.authToken
const client = require('twilio')(accountSID, authToken)

const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

let OtpNumberValidation = false

/* GET users listing. */
router.get('/', async (req, res,) => {
  let user
  let cartCount
  if (req.session.loggedIn) {
    user = req.session.user
  } else {
    user = false
  }
  // let user = req.session.user

  if (req.session.loggedIn) {
    cartCount = await cartHelpers.getCartCount(req.session.user._id)
  } else {
    cartCount = false
  }

  var allProducts = await productHelpers.getAllProducts()
  console.log(allProducts);
  var banner = await bannerHelper.getAllBanner()
  await categoryHelpers.showAllCategorysubcate().then((result) => {

    console.log(result);
    res.render('user/userHome', { admin: 0, user, allProducts, result, cartCount, banner });
  })
});

router.post('/', async (req, res) => {
  var cateProduct = await productHelpers.productDividedCategory(req.body.category)
  res.json(cateProduct)
})







// log in user 
router.get('/login', (req, res) => {
  let user = req.session.user
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { admin: 2, user, logo, blocked })
    logo = false
    blocked = false
  }
})


router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    console.log(response, 'hari');
    console.log(response.status);
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user
      console.log(req.session.user);
    }
    res.json(response)

    // if(response.status){
    //   if(response.user.isactive){
    //     req.session.loggedIn=true;
    //   req.session.user = response.user
    //   res.redirect('/')
    //   }else{
    //     blocked = true
    //     res.redirect('/login')
    //   }
    // }else{
    //   console.log('istsdd');
    //   logo=true;
    //   res.redirect('/login')
    // }
  })
})

// singup form
router.get('/signup', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    let user = req.session.user
    res.render('user/signUp', { admin: 2, user })
  }

})

router.post('/signup', (req, res) => {
  req.body.isactive = true;
  userHelpers.doSignup(req.body).then((response) => {
    // convered Inserted id into _id
    let Id = "" + response.insertedId
    res.json(response)
    // res.redirect('/login')
  })
})

// checking for refferal code 
router.post('/checking-refferal', (req, res) => {
  console.log(req.body.code);
  userHelpers.findRefferalCode(req.body.code).then((resp) => {
    res.json(resp)
  })
})


// product list
router.get('/product', async (req, res) => {
  let user
  let cartCount
  if (req.session.loggedIn) {
    user = req.session.user
  } else {
    user = false
  }
  if (req.session.loggedIn) {
    cartCount = await cartHelpers.getCartCount(req.session.user._id)
  } else {
    cartCount = false
  }
  // let user = req.session.user
  var result
  await categoryHelpers.showAllCategorysubcate().then((results) => {
    result = results
    console.log(result);
  })
  //  let cartCount=await cartHelpers.getCartCount(req.session.user._id)
  await userHelpers.usergetAllProducts().then((product) => {
    res.render('user/product', { admin: 0, user, result, product, cartCount })
  })
})

// search products

router.post('/productSearch', async (req, res) => {
  console.log(req.body.searchValue);
  let user
  let cartCount
  if (req.session.loggedIn) {
    user = req.session.user
  } else {
    user = false
  }
  if (req.session.loggedIn) {
    cartCount = await cartHelpers.getCartCount(req.session.user._id)
  } else {
    cartCount = false
  }
  // let user = req.session.user
  var result
  await categoryHelpers.showAllCategorysubcate().then((results) => {
    result = results
    console.log(result);
  })

  await productHelpers.searchProduct(req.body.searchValue).then((product) => {

    res.render('user/product', { admin: 0, user, result, product, cartCount, })
  })

})

// search product in ajax

// router.post('/productSearch',async(req,res)=>{

//   console.log(req.body.searchValue);
//   await productHelpers.searchProduct(req.body.searchValue).then((product)=>{
//     res.json({product})
//   })
// })

// filter product in price range
router.post('/filterProductInPrice', async (req, res) => {
  console.log(req.body.searchValue);
  let user
  let cartCount
  if (req.session.loggedIn) {
    user = req.session.user
  } else {
    user = false
  }
  if (req.session.loggedIn) {
    cartCount = await cartHelpers.getCartCount(req.session.user._id)
  } else {
    cartCount = false
  }
  var result
  await categoryHelpers.showAllCategorysubcate().then((results) => {
    result = results
    console.log(result);
  })

  let mini = parseInt(req.body.miniPrice)
  let maxi = parseInt(req.body.maxPrice)
  console.log(mini, maxi);

  await productHelpers.filterProductInPrice(mini, maxi).then((product) => {
    res.render('user/product', { admin: 0, user, result, product, cartCount, })
  })
})


// show product divied by category

router.get('/cateproduct/', async (req, res) => {
  let user
  let cartCount
  if (req.session.loggedIn) {
    user = req.session.user
  } else {
    user = false
  }

  if (req.session.loggedIn) {
    cartCount = await cartHelpers.getCartCount(req.session.user._id)
  } else {
    cartCount = false
  }

  var result;
  await categoryHelpers.showAllCategorysubcate().then((results) => {
    result = results
  })

  let idOfCat = req.query.id
  await productHelpers.productDividedCategory(idOfCat).then((product) => {
    console.log(product);
    console.log(result);
    res.render('user/product', { admin: 0, user, result, product, cartCount })
    // res.render('user/product-by-category',{admin:0,user,result,product,cartCount})
  })

})
// show the subcategory products

router.get('/subcategory-products/', async (req, res) => {
  let reqId = req.query.id
  let reqcategory = req.query.category
  console.log(reqId);
  console.log(reqcategory);
  let user
  let cartCount
  if (req.session.loggedIn) {
    user = req.session.user
  } else {
    user = false
  }
  if (req.session.loggedIn) {
    cartCount = await cartHelpers.getCartCount(req.session.user._id)
  } else {
    cartCount = false
  }
  var result;
  await categoryHelpers.showAllCategorysubcate().then((results) => {
    result = results
  })
  let product = await productHelpers.getSubProducts(reqcategory, reqId)
  res.render('user/product', { admin: 0, user, result, product, cartCount })
  // res.render('user/product-by-subcategory',{admin:0,user,result,cartCount,subProducts})
})



// product detailts


// router.get('/productdetails/',async(req,res)=>{
//   let user = req.session.user
//   var proId = req.query.id
//   console.log(req.params.id);
//   console.log('is it the product page');
//   var product =await productHelpers.productDetails(proId)
//   console.log(product);
//   res.render('user/productdetails',{admin:0})


// })

router.get('/productdetails/', async (req, res) => {
  let user
  let cartCount
  if (req.session.loggedIn) {
    user = req.session.user
  } else {
    user = false
  }
  if (req.session.loggedIn) {
    cartCount = await cartHelpers.getCartCount(req.session.user._id)
  } else {
    cartCount = false
  }
  // let user = req.session.user
  var proId = req.query.id
  // let cartCount=await cartHelpers.getCartCount(req.session.user._id)
  var result;
  await categoryHelpers.showAllCategorysubcate().then((results) => {
    result = results
  })
  productHelpers.productDetails(proId).then((product) => {

    res.render('user/productdetails', { admin: 0, result, product, user, cartCount })
  }).catch((erorr) => {
    console.log(erorr);
  })
})




// otp validation 

router.get('/otp', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/otplogin', { admin: 2, OtpNumberValidation, blocked })
    OtpNumberValidation = false
    blocked = false
  }
})

router.post('/otp', (req, res) => {

  var Number = req.body.number;
  console.log('ajx');
  console.log(Number);
  userHelpers.numberOtpValidation(Number).then((result) => {

    console.log(result);

    if (result.isactive) {
      if (result.number) {
        client.verify.services(serviceID)
          .verifications
          .create({ to: `+91${result.number}`, channel: 'sms' })
          .then(verification => console.log(verification.status));

        res.render('user/sucessotp', { admin: 2, result })
      } else {
        res.send('not number')
      }
    } else {
      blocked = true
      res.redirect('/otp')
    }

  }).catch((e) => {
    OtpNumberValidation = true
    res.redirect('/otp')

  })


})


// otp validation in ajax
// router.post('/Otpnum',(req,res)=>{
//   console.log(req.body);
//   userHelpers.numberOtpValidation(req.body.number).then((result)=>{
//     if(result.isactive){

//     }else{

//     }

//   }).catch((result)=>{
//     res.json({status:false})
//   })
// })


// registration otp
router.post('/registationOtpchecking', (req, res) => {
  console.log(req.body);
  var number = req.body.number
  client.verify.services(serviceID)
    .verifications
    .create({ to: `+91${number}`, channel: 'sms' })
    .then(verification => console.log(verification.status));
  res.json({ status: true })
})

// registration sucess otp
router.post('/registration-sucess-otp', (req, res) => {
  console.log(req.body);
  var code = req.body.code
  var Number = req.body.number
  client.verify.services(serviceID)
    .verificationChecks
    .create({ to: `+91${Number}`, code: code })
    .then(verification_check => {
      console.log(verification_check.status)
      if (verification_check.valid) {
        res.json({ status: true })
      } else {

        res.json({ status: false })
      }
    });
})



router.post('/sucessotp', (req, res) => {

  var code = req.body.code
  var Number = req.body.number
  console.log(req.body.code + 'code of post');
  console.log(req.body.number + 'number of post');

  client.verify.services(serviceID)
    .verificationChecks
    .create({ to: `+91${Number}`, code: code })
    .then(verification_check => {
      console.log(verification_check.status)

      if (verification_check.valid) {
        userHelpers.numberOtpValidation(Number).then((response) => {
          req.session.loggedIn = true;
          console.log(response);
          req.session.user = response
          // res.redirect('/')
          res.json({ status: true })
        })
      } else {
        // res.redirect('/otp')
        res.json({ status: false })
      }
    });

})


// router.post('/sucessotp',(req,res)=>{

//   var code = req.body.code
//   var Number = req.body.number
//   console.log(req.body.code+'code of post');
//   console.log(req.body.number+'number of post');

//   client.verify.services(serviceID  )
//       .verificationChecks
//       .create({to: `+91${Number}`, code:code})
//       .then(verification_check => {
//         console.log(verification_check.status)
//         if(verification_check.valid){

//           req.session.loggedIn=true;


//           userHelpers.numberOtpValidation(Number).then((response)=>{
//             console.log(response);
//             req.session.user=response
//               res.redirect('/')
//           })



//         }else{
//           res.redirect('/otp')

//         }
//       });

// })

// cart management

router.get('/addtocart/', verifyLogin, async (req, res) => {
  console.log('hwllooo');
  console.log(req.query.cart);
  console.log(req.session.user._id);
  let user = req.session.user
  console.log(user);
  var result;

  await categoryHelpers.showAllCategorysubcate().then((results) => {
    result = results
  })
  let idOfCat = req.query.id
  await productHelpers.addProductShowCategory(idOfCat).then((product) => {
    console.log(product);
    console.log(result);
    //  res.render('user/product-by-category',{admin:3,result,product})
  })
  cartHelpers.addToCart(req.query.cart, req.session.user._id)

  res.render('user/cart', { admin: 0, user, result })
})


// main cart

router.get('/cartmanagement', verifyLogin, async (req, res) => {
  let user = req.session.user
  console.log(req.session.user);
  var result;
  categoryHelpers.showAllCategorysubcate().then((results) => {
    result = results
  })
  let products = await cartHelpers.showCart(req.session.user._id)
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  let total = await cartHelpers.getTotalAmount(req.session.user._id)

  console.log(total);

  res.render('user/cart', { admin: 0, user, result, products, cartCount, total })
})

// delete cart singel product
router.post('/deletecartProduct', (req, res) => {
  cartHelpers.deleteProductInCart(req.body.cartId, req.body.proId).then((response) => {
    res.json(response)
  })
})



router.get('/addTocarts/:id', verifyLogin, async (req, res) => {
  console.log('api calls on comming');

  console.log(req.session.user._id);
  console.log(req.params.id);
  cartHelpers.addToCart(req.params.id, req.session.user._id).then((response) => {
  })
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  console.log(cartCount);
  res.json({ status: true, cartCount })
})

// change product condity in cart page in ajax
router.post('/change-product-cound', (req, res) => {
  console.log(req.body.user);
  cartHelpers.changeProductCound(req.body).then(async (response) => {
    response.total = await cartHelpers.getTotalAmount(req.session.user._id)
    response.subtotal = await cartHelpers.getSubTotal(req.body)
    console.log(response);
    res.json(response)
  })

})

// checkout

router.get('/checkout', verifyLogin, async (req, res) => {
  let user = req.session.user

  var result;
  categoryHelpers.showAllCategorysubcate().then((results) => {
    result = results
  })
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)

  let total = await cartHelpers.getTotalAmount(req.session.user._id)
  console.log(total);

  let addresss = await userHelpers.showAllAddress(req.session.user._id)
  console.log(addresss);
  let coupons = await offerAndCouponHelpers.AvailableCoupons()
  let userProfil = await userHelpers.userDetails(req.session.user._id)

  res.render('user/checkout', { admin: 0, user, result, cartCount, userProfil, addresss, total, coupons })

})

// check Coupon 
router.post('/checkCoupon', verifyLogin, async (req, res) => {
  console.log(req.body);
  offerAndCouponHelpers.checkingVaildCoupone(req.body.cpCode, req.body.total, req.session.user._id).then((response) => {

    res.json(response)
  })
})

// user wallet 
router.post('/useWallet', (req, res) => {
  console.log(req.body);
})

// ajax place order

// router.post('/place-order',async(req,res)=>{
//   console.log(req.body);
//   let products= await cartHelpers.getCartProductList(req.body.userId)
//   let totalPrice= await cartHelpers.getTotalAmount(req.body.userId)
//   cartHelpers.placeOrder(req.body,products,totalPrice).then((response)=>{
//     res.json({status:true})

//   })
// })


router.post('/addAddressCheckout', verifyLogin, (req, res) => {
  console.log(req.body);

  userHelpers.addNewAddress(req.body, req.session.user._id).then((response) => {
    res.json({ status: true })
  })

  // let products= await cartHelpers.getCartProductList(req.body.userId)
  // let totalPrice= await cartHelpers.getTotalAmount(req.body.userId)
  // cartHelpers.placeOrder(req.body,products,totalPrice).then((response)=>{
  //   res.json({status:true})

  // })
})


// single check out page payment
router.post('/productBuy', verifyLogin, async (req, res) => {
  console.log("/productBuy");
  console.log(req.body.productId);

  var singleProduct = true;

  let totalPrice = await productHelpers.findProduct(req.body.productId)
  console.log(totalPrice);
  let product = await cartHelpers.getProduct(req.body.productId)
  let address = await userHelpers.getOneAddress(req.body.adderssId, req.session.user._id)

  if (req.body['paymentmethod'] === "COD") {
    await cartHelpers.placeOrder(req.body, product, totalPrice.OfferTotal, address, singleProduct).then((orderId) => {
    })
    res.json({ CODsuccess: true })
  } else {
    if (totalPrice.OfferTotal != 0) {
      await cartHelpers.placeOrderOnline(req.body, product, totalPrice.OfferTotal, address, req.session.user._id).then((orderId) => {
        orderHelpers.generateRazorpay(orderId, totalPrice.OfferTotal, req.session.user).then((response) => {
          console.log(response.user);
          res.json(response)
        })
      })
    } else {
      req.body.paymentmethod = 'COD'
      cartHelpers.placeOrder(req.body, product, totalPrice.OfferTotal, address, singleProduct).then((orderId) => {
        res.json({ CODsuccess: true })
      })

    }
  }

})

// single product paypal 
router.post('/singleProductPaypal', verifyLogin, async (req, res) => {
  console.log('start single product in paypal');
  console.log(req.body);
  let totalPrice = await productHelpers.findProduct(req.body.productId)
  console.log(totalPrice);
  let product = await cartHelpers.getProduct(req.body.productId)

  let address = await userHelpers.getOneAddress(req.body.addressId, req.session.user._id)



  if (req.body.wallet != '') {

    var walletBalance = totalPrice.OfferTotal - req.body.wallet
    if (walletBalance <= 0) {
      console.log("walletBalance <= 0");
      totalPrice.OfferTotal = 0
      walletBalance = Math.abs(walletBalance)
      console.log(walletBalance);
      await userHelpers.useWalletamount(req.session.user._id, walletBalance)
    } else {
      console.log("walletBalance + 0");
      totalPrice.OfferTotal = totalPrice.OfferTotal - req.body.wallet
      walletBalance = 0
      await userHelpers.useWalletamount(req.session.user._id, walletBalance)
    }
  }
  console.log(req.body);
  console.log(product);
  console.log(totalPrice);
  console.log(address);
  var orderId
  if (totalPrice.OfferTotal != 0) {
    await cartHelpers.placeOrderOnline(req.body, product, totalPrice.OfferTotal, address, req.session.user._id).then((orderId) => {
      console.log(orderId);
      orderId = '' + orderId
      var singleProduct = true
      console.log(orderId);

      const create_payment_json = {
        "intent": "sale",
        "payer": {
          "payment_method": "paypal"
        },
        "redirect_urls": {
          "return_url": "http://localhost:3000/success?price=" + totalPrice.OfferTotal + "&orderId=" + orderId+"&singleProduct="+singleProduct,
          "cancel_url": "http://localhost:3000/checkout"
        },
        "transactions": [{
          "item_list": {
            "items": [{
              "name": "Red Sox Hat",
              "sku": "001",
              "price": totalPrice.OfferTotal,
              "currency": "USD",
              "quantity": 1
            }]
          },
          "amount": {
            "currency": "USD",
            "total": totalPrice.OfferTotal
          },
          "description": "Hat for the best team ever"
        }]
      };

      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          throw error;
        } else {
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === 'approval_url') {
              res.redirect(payment.links[i].href);
            }
          }
        }
      });

    })
  } else {
    req.body.paymentmethod = 'COD'
    cartHelpers.placeOrder(req.body, product, totalPrice.OfferTotal, address).then((orderId) => {
      res.redirect('/orders-success')
    })
  }
})




router.post('/placeOrders', verifyLogin, async (req, res) => {
  var obj = req.body
  console.log('place order req.body');
  console.log(req.body);

  var singleProduct = false

  var couponeValue = await offerAndCouponHelpers.checkCouponVaild(req.body.couponCD, req.session.user._id)

  let products = await cartHelpers.getCartProductList(req.body.userId)
  let totalPrice = await cartHelpers.getTotalAmount(req.body.userId)
  let address = await userHelpers.getOneAddress(req.body.adderssId, req.session.user._id)
  if (couponeValue) {
    //  var sampletotal = await totalPrice.OfferTotal-couponeValue.percentage 
    var sampletotal = Math.round(totalPrice.OfferTotal - (totalPrice.OfferTotal * couponeValue.percentage) / 100)
    console.log(sampletotal);
    totalPrice.OfferTotal = sampletotal
  }



  if (req.body.wallet != '') {

    var walletBalance = totalPrice.OfferTotal - req.body.wallet
    if (walletBalance <= 0) {
      console.log("walletBalance <= 0");
      totalPrice.OfferTotal = 0
      walletBalance = Math.abs(walletBalance)
      console.log(walletBalance);
      await userHelpers.useWalletamount(req.session.user._id, walletBalance)
    } else {
      console.log("walletBalance + 0");
      totalPrice.OfferTotal = totalPrice.OfferTotal - req.body.wallet
      walletBalance = 0
      await userHelpers.useWalletamount(req.session.user._id, walletBalance)
    }
  }
  console.log(totalPrice.OfferTotal);
  //  console.log(req.body['paymentmethod']==='COD');

  if (req.body['paymentmethod'] === "COD") {
    await cartHelpers.placeOrder(req.body, products, totalPrice.OfferTotal, address, singleProduct).then((orderId) => {
    })
    res.json({ CODsuccess: true })
  } else {
    if (totalPrice.OfferTotal != 0) {
      await cartHelpers.placeOrderOnline(req.body, products, totalPrice.OfferTotal, address, req.session.user._id).then((orderId) => {
        orderHelpers.generateRazorpay(orderId, totalPrice.OfferTotal, req.session.user).then((response) => {
          res.json(response)
        })
      })
    } else {
      req.body.paymentmethod = 'COD'
      cartHelpers.placeOrder(req.body, products, totalPrice.OfferTotal, address, singleProduct).then((orderId) => {
        res.json({ CODsuccess: true })
      })

    }
  }
})

// paypal payment 
router.post('/paypal', verifyLogin, async (req, res) => {
  console.log('start paypal');

  let products = await cartHelpers.getCartProductList(req.session.user._id)
  let totalPrice = await cartHelpers.getTotalAmount(req.session.user._id)
  let address = await userHelpers.getOneAddress(req.body.addressId, req.session.user._id)

  var couponeValue = await offerAndCouponHelpers.checkCouponVaild(req.body.couponCD, req.session.user._id)

  if (couponeValue) {
    //  var sampletotal = await totalPrice.OfferTotal-couponeValue.percentage 
    var sampletotal = Math.round(totalPrice.OfferTotal - (totalPrice.OfferTotal * couponeValue.percentage) / 100)
    console.log(sampletotal);
    totalPrice.OfferTotal = sampletotal
  }
  if (req.body.wallet != '') {

    var walletBalance = totalPrice.OfferTotal - req.body.wallet
    if (walletBalance <= 0) {
      console.log("walletBalance <= 0");
      totalPrice.OfferTotal = 0
      walletBalance = Math.abs(walletBalance)
      console.log(walletBalance);
      await userHelpers.useWalletamount(req.session.user._id, walletBalance)
    } else {
      console.log("walletBalance + 0");
      totalPrice.OfferTotal = totalPrice.OfferTotal - req.body.wallet
      walletBalance = 0
      await userHelpers.useWalletamount(req.session.user._id, walletBalance)
    }
  }
  console.log(req.body);
  console.log(products);
  console.log(totalPrice);
  console.log(address);
  var orderId
  if (totalPrice.OfferTotal != 0) {
    await cartHelpers.placeOrderOnline(req.body, products, totalPrice.OfferTotal, address, req.session.user._id).then((orderId) => {
      console.log(orderId);
      orderId = '' + orderId
      var singleProduct = false
      console.log(orderId);

      const create_payment_json = {
        "intent": "sale",
        "payer": {
          "payment_method": "paypal"
        },
        "redirect_urls": {
          "return_url": "http://localhost:3000/success?price=" + totalPrice.OfferTotal + "&orderId=" + orderId+"&singleProduct="+singleProduct,
          "cancel_url": "http://localhost:3000/checkout"
        },
        "transactions": [{
          "item_list": {
            "items": [{
              "name": "Red Sox Hat",
              "sku": "001",
              "price": totalPrice.OfferTotal,
              "currency": "USD",
              "quantity": 1
            }]
          },
          "amount": {
            "currency": "USD",
            "total": totalPrice.OfferTotal
          },
          "description": "Hat for the best team ever"
        }]
      };

      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          throw error;
        } else {
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === 'approval_url') {
              res.redirect(payment.links[i].href);
            }
          }
        }
      });

    })
  } else {
    req.body.paymentmethod = 'COD'
    cartHelpers.placeOrder(req.body, products, totalPrice.OfferTotal, address).then((orderId) => {
      res.redirect('/orders-success')
    })
  }


});

// sucess page in paypal


router.get('/success', verifyLogin, (req, res) => {
  var singleproduct = req.query.singleProduct
  var orderId = req.query.orderId
  console.log(orderId);
  var price = req.query.price
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
      "amount": {
        "currency": "USD",
        "total": price
      }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
      console.log(error.response);
      throw error;
    } else {
      console.log(JSON.stringify(payment));

      orderHelpers.sucessPaypal(req.session.user._id,singleproduct).then(() => {
        orderHelpers.OnlinePaymentChangeStatus(orderId).then(() => {
          res.redirect('/orders-success')
        })
      })
    }
  });
});




// cancel page in paypal
router.get('/cancel', (req, res) => res.send('Cancelled'));


// end paypal

router.post('/verifyPayment', verifyLogin, async (req, res) => {
  orderHelpers.verifyPayment(req.body, req.session.user._id).then(() => {
    console.log('verifyPayment');
    console.log(req.body);
    orderHelpers.OnlinePaymentChangeStatus(req.body['order[receipt]']).then(() => {
      console.log('payment success full');
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log('payment error');
    res.json({ status: false, errMess: '' })
  })
})


// buy now in user side
router.get('/buyNowCheckOut', verifyLogin, async (req, res) => {
  let user = req.session.user

  var result;
  categoryHelpers.showAllCategorysubcate().then((results) => {
    result = results
  })
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)

  let addresss = await userHelpers.showAllAddress(req.session.user._id)
  await productHelpers.findProduct(req.query.id).then((response) => {
    res.render('user/buyNowCheckout', { admin: 0, result, cartCount, user, response, addresss })
  })
})

// buy now checkout page post method
router.post('/buyNowCheckOut', (req, res) => {

  console.log(req.body);
  console.log('called buy now checkoutssssssssssssssssss');

})

// single product chechout page
router.get('/singleProductcheckout', verifyLogin, async (req, res) => {

  let user = req.session.user
  let proId = req.query.id
  var result;
  categoryHelpers.showAllCategorysubcate().then((results) => {
    result = results
  })
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)

  let addresss = await userHelpers.showAllAddress(req.session.user._id)
  let userProfil = await userHelpers.userDetails(req.session.user._id)
  await productHelpers.findProduct(req.query.id).then((total) => {
    console.log(total);
    res.render('user/singleProductCheckout', { admin: 0, user, result, cartCount, userProfil, addresss, total, proId })
  })



})



// order placed
router.get('/orders-success', verifyLogin, async (req, res) => {
  let user = req.session.user
  var result;
  categoryHelpers.showAllCategorysubcate().then((results) => {
    result = results
  })
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  res.render('user/orderSuccessPage', { admin: 0, user, result, cartCount })
})

// orders page 

router.get('/orders-history', verifyLogin, async (req, res) => {

  let user = req.session.user
  var result;
  categoryHelpers.showAllCategorysubcate().then((results) => {
    result = results
  })
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  let orders = await orderHelpers.getUserOrder(req.session.user._id)
  res.render('user/orderHistory', { admin: 0, user, result, cartCount, orders })
})

// viwe order products in order history

router.get('/view-ordered-products/', verifyLogin, async (req, res) => {
  console.log(req.query.id);
  let user = req.session.user
  var result;
  await categoryHelpers.showAllCategorysubcate().then((results) => {
    result = results
  })
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  let products = await orderHelpers.getOrderProducts(req.query.id)
  console.log(products);

  res.render('user/viewOrderedProduct', { admin: 0, result, cartCount, user, products })
})

// cancel order in ajax requst
router.post('/canselOrder', async (req, res) => {
  console.log(req.body.orderId);
  await orderHelpers.updateOrderStatus(req.body.orderId).then((response) => {
    res.json(response)
  })

})

// wishlist in user 
router.get('/wishlist', verifyLogin, async (req, res) => {
  let user = req.session.user
  console.log(req.session.user);
  var result;
  await categoryHelpers.showAllCategorysubcate().then((results) => {
    result = results
  })
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  let wishListItems = await userHelpers.showAllWishlists(req.session.user._id)

  res.render('user/wishlist', { admin: 0, user, result, cartCount, wishListItems })
})

// add to wishlist
router.post('/wishlist', (req, res) => {
  userHelpers.addToWishlist(req.body.proId, req.session.user._id).then((response) => {
    res.json(response)
  })
})

// remove form wishlist
router.post('/removeProductInWishlist', (req, res) => {
  console.log(req.body);
  userHelpers.removeWishlistProduct(req.body.proId, req.session.user._id).then((response) => {
    console.log(response);
    res.json(response)
  })
})


// user profile 
router.get('/userProfile', verifyLogin, async (req, res) => {
  let user = req.session.user
  console.log(req.session.user);
  var result;
  await categoryHelpers.showAllCategorysubcate().then((results) => {
    result = results
  })
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  let userProfil = await userHelpers.userDetails(req.session.user._id)
  let coupons = await offerAndCouponHelpers.AvailableCoupons()
  res.render('user/userProfile', { admin: 0, user, result, cartCount, userProfil, coupons })
})

// edit user Details
router.post('/editUserDetails', verifyLogin, (req, res) => {
  userHelpers.editUserDetails(req.body, req.session.user._id).then((response) => {
    res.json(response)
  }).catch((response) => {
    res.json(response)
  })
})

// edit user password
router.post('/userEditPassword', (req, res) => {

  if (req.body.newPassword === req.body.repeatPassword) {
    userHelpers.eidtUserPassword(req.body, req.session.user._id).then((response) => {
      res.json(response)
    }).catch((response) => {
      res.json(response)
    })
  } else {
    res.json({ erorr: true })
  }
})

// user address management 
router.get('/userAddressManagement', verifyLogin, async (req, res) => {
  let user = req.session.user
  console.log(req.session.user);
  var result;
  await categoryHelpers.showAllCategorysubcate().then((results) => {
    result = results
  })
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  let addresss = await userHelpers.showAllAddress(req.session.user._id)
  console.log(addresss);
  res.render('user/userAddressM', { admin: 0, user, result, cartCount, addresss })

})

// delete user address
router.post('/deleteUserAddress', (req, res) => {
  userHelpers.DeleteUserAddress(req.body._id, req.body.addressId).then((response) => {
    res.json(response)
  }).catch((response) => {
    res.json(response)
  })
})

// add profile pic
router.post('/savePropic', verifyLogin, async (req, res) => {
  var changePic = await userHelpers.changePic(req.session.user._id)
  let image1 = req.body.image1
  let path1 = './public/productimage/image2/' + req.session.user._id + '_1.jpg'
  let img1 = image1.replace(/^data:([A-Za-z+/]+);base64,/, "")
  fs.writeFileSync(path1, img1, { encoding: 'base64' })
  res.redirect('/userProfile')

})

// paypal 
router.get('/paypal', (req, res) => {
  res.render('user/paypal', { admin: 4 })
})






// user logout
router.get('/logout', (req, res) => {
  req.session.loggedIn = false
  res.redirect('/')
})


// sample from validation 
router.get('/sampleForm', (req, res) => {
  res.render('user/otp', { admin: 9 })
})


module.exports = router;
