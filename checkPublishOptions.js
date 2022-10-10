(async (products = null) => {
    const { getProducts, publishDetailsAreCorrect } = require('./services/printifyService')

    try {
        products = products ? products : await getProducts()
        const brokenProducts = products.filter(product => !publishDetailsAreCorrect(product)).map(product => { return {ID: product._id, Name: product.name}})
        if(brokenProducts.length) {
            console.log('the following Products have incorrect publish settings:')
            console.log(JSON.stringify(brokenProducts, null, 3))
        } else {
            console.log('no products found to have broken publish settings!')
        }
    } catch (err) {
        console.log(err.message)
    }
})();

