(async () => {
    const { hasPublishingError, fetchAllPublishedProducts, getProductsFromIds, publishDetailsAreCorrect, republishProductsBulk } = require('./services/printifyService')
    try {
        let allProducts = await fetchAllPublishedProducts()
        const productIds = allProducts.map(product => product._id)
        const fullProducts = await getProductsFromIds(productIds)
        let productsForPublishing = {
            ready: [],
            notReady: []
        }
        console.log('Checking publishing settings...')
        for (let product of fullProducts) {
            if (publishDetailsAreCorrect(product)) {
                productsForPublishing.ready.push({ Title: product.name, Id: product._id })
            } else {
                productsForPublishing.notReady.push({ Title: product.name, Id: product._id })
            }
        }
        if (productsForPublishing.notReady.length) {
            console.log(`...the following products had incorrect publish settings: ${JSON.stringify(productsForPublishing.notReady, null, 3)}, they will be skipped`)
        }

        console.log(`Republishing ${productsForPublishing.ready.length} products...`)
        // await republishProductsBulk(productsForPublishing.ready.map(product => product.Id))
        console.log('...finished!')
    } catch (err) {
        console.log(`${err.status}: ${err.message}`)
    }

})();
