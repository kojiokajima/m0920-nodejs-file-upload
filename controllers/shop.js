const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit')
const Product = require('../models/Products')
const Order = require('../models/Orders')

exports.getProducts = (req, res, next) => {
  // const isLoggedIn = req.get('Cookie').split(' ')[2].split('=')[1] === 'true'
  Product.find()
    .then((products) => {
      res.render('shop/index', {
        pageTitle: 'Shop Page',
        path: '/',
        products: products,
      })
    })
    .catch((err) => console.log(err))
}

exports.getOneProductById = (req, res, next) => {
  Product.findById(req.params.id)
    .then((product) => {
      res.render('shop/product-detail', {
        pageTitle: product.title,
        path: '/products',
        product: product,
      })
    })
    .catch((err) => console.log(err))
}

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then((user) => {
      const products = user.cart.items
      res.render('shop/cart', {
        pageTitle: 'Your Cart',
        path: '/cart',
        products: products,
      })
    })
    .catch((err) => console.log(err))
}

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId

  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product)
    })
    .then(() => {
      res.redirect('/')
    })
    .catch((err) => console.log(err))
}

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId
  req.user
    .removeFromCart(prodId)
    .then(() => {
      res.redirect('/cart')
    })
    .catch((err) => console.log(err))
}

exports.postOrder = (req, res, next) => {
  // console.log('user: ',req.user)
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(item => {
        return {
          product: { ...item.productId._doc },
          quantity: item.quantity
        }
      })

      const order = new Order({
        products: products,
        user: {
          email: req.user.email,
          userId: req.user //mongoose will only pull out the _id
        }
      })

      return order.save()
    })
    .then(() => {
      return req.user.clearCart()
    })
    .then(() => {
      res.redirect('/orders')
    })
    .catch((err) => console.log(err))
}

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id }).then((order) => {
    res.render('shop/orders', {
      pageTitle: 'Your Order',
      path: '/orders',
      orders: order
    })
  }).catch(err => console.log(err))
}

exports.getInvoice = (req,res,next) => {
  const orderId = req.params.orderId

  Order.findById(orderId).then((order) => {
    if(!order){
      return res.redirect('/')
    }

    if(order.user.userId.toString() !== req.user._id.toString()){
      const error = new Error(err)
      error.httpStatusCode = 401;
      return next(error)
    }

    const invoiceName = 'invoice-' + orderId + '.pdf'
    const invoicePath = path.join('data', 'invoices', invoiceName)

    const pdfDoc = new PDFDocument()
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"')

    pdfDoc.pipe(fs.createWriteStream(invoicePath))
    pdfDoc.pipe(res)

    pdfDoc.fontSize(26).text('Invoice', {
      underline: true
    })
    pdfDoc.text('--------------------------------')
    let totalPrice = 0
    order.products.forEach(prod => {
      totalPrice += prod.quantity * prod.product.price
      pdfDoc.fontSize(14).text(
        prod.product.title + ' - ' + prod.quantity + ' x ' + ' $' + prod.product.price
      )
    })
    pdfDoc.text('--------------------------------')
    pdfDoc.fontSize(20).text('Total Price: $'+ totalPrice)

    pdfDoc.end()

  }).catch(err => console.log(err))
}
