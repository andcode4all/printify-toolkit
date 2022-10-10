(async () => {
    const { changePrice, fetchPageOfPublishedProducts } = require('./services/printifyService')
    //dollar profit value without decimal point eg: $11.50 should be 1150 || or percentage margin value
    const value = 60
    //can be profit or margin
    const target = 'margin'
    const pageSize = 90
    const pageLimit = null
    const pageNumber = 7

    try {
        const products = await fetchPageOfPublishedProducts(pageSize, pageNumber)
        const productIds = products.data.map(p => p._id)
        console.log(`found ${productIds.length} products`)
        // const productIds = ['61464613962ce064521905be']
        let response = await changePrice(productIds, target, value)
        console.log(`successfully changed price of ${response._body.success.length} products`)
        
    } catch (err) {
        console.log(err.message)
    }
})();

