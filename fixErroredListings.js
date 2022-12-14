(async () => {
    const { hasPublishingError, fetchAllPublishedProducts, getProductsFromIds, publishDetailsAreCorrect, republishProductsBulk } = require('./services/printifyService')
    try {
        let allProducts = await fetchAllPublishedProducts()
        let erroredlistings = allProducts.filter(product => hasPublishingError(product))
        console.log(`${erroredlistings.lengh} listings found to have errors...`)
        const productIds = erroredlistings.map(product => product._id)
        console.log('1', productIds.includes('6147b9035335a22d365506c0'))
        const fullProducts = await getProductsFromIds(productIds)
        let productsForPublishing = {
            ready: [],
            notReady: []
        }
        console.log('2', fullProducts.some(product => product._id === '6147b9035335a22d365506c0'))

        console.log('Checking publishing settings...')
        for (let product of fullProducts) {
            if (publishDetailsAreCorrect(product) && hasPublishingError(product)) {
                productsForPublishing.ready.push({ Title: product.name, Id: product._id })
            } else {
                productsForPublishing.notReady.push({ Title: product.name, Id: product._id })
            }
        }

        // // console.log(`Found ${erroredlistings.length} products with publishing errors`)
        // // console.log(`Republishing ${erroredlistings.length} products...`)
        console.log('3', productsForPublishing.ready.some(product => product.Id === '6147b9035335a22d365506c0'))

        // console.log(`Found ${productsForPublishing.ready.length} products with publishing errors`)
        // console.log(`Republishing ${productsForPublishing.ready.length} products...`)
        // await republishProductsBulk(productsForPublishing.ready.map(product => product.Id))
        // console.log('...finished!')

    } catch (err) {
        console.log(`${err.status}: ${err.message}`)
    }

})();

