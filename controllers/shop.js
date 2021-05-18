const Product = require('../models/Products')

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

exports.postCartDeleteProduct = (req,res,next) => {
    const prodId = req.body.productId
    req.user.removeFromCart(prodId).then(() => {
        res.redirect('/cart')
    }).catch(err => console.log(err))
}
