(async () => {
    const { hasPublishingError, fetchAllPublishedProducts, getProductsFromIds, publishDetailsAreCorrect, republishProductsBulk } = require('./services/printifyService')
    try {
        let allProducts = await fetchAllPublishedProducts()
        const productIds = allProducts.map(product => product._id)
        // const productIds = ['627f0337308ccd43ef0e2dc2']
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

        let promises = []
        let pagesize = 200
        let pageCount = 1
        for(let i = 0; i <= productsForPublishing.ready.length; i += pagesize) {
            let page = productsForPublishing.ready.slice(i, i+pagesize)
            console.log(`Page number ${pageCount} contains ${page.length} items`)
            promises.push(republishProductsBulk(page.map(product => product.Id)))
            pageCount++
        }
        await Promise.all(promises)

        console.log('...finished!')
    } catch (err) {
        console.log(`${err.status}: ${err.message}`)
    }

})();
