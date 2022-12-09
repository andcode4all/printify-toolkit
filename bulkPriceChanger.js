(async () => {
    const { changePrice, fetchPageOfPublishedProducts, sleep } = require('./services/printifyService')
    //dollar profit value without decimal point eg: $11.50 should be 1150 || or percentage margin value
    const value = 67
    //can be profit or margin
    const target = 'margin'
    const pageSize = 90

    try {
        let pageOfProducts = await fetchPageOfPublishedProducts(pageSize, 1)
        let maxPages = pageOfProducts.last_page
        for(let i = 1; i <= maxPages; i++) {
            if(i > 1) {
                pageOfProducts = await fetchPageOfPublishedProducts(pageSize, i)
            }
            const productIds = pageOfProducts.data.map(p => p._id)
            // const productIds = ['61464613962ce064521905be']
            console.log(`...found ${productIds.length} products from page number ${i}`)


            if(productIds.length) {
                await changePrice(productIds, target, value)
                await sleep(5000)
            } else {
                console.log('no products found')
            }
        }
    } catch (err) {
        console.log('ERROR: ', err.message)
        console.log('ERROR: ', err)
    }
})();


// (async () => {
//     const { changePrice, fetchPageOfPublishedProducts } = require('./services/printifyService')
//     //dollar profit value without decimal point eg: $11.50 should be 1150 || or percentage margin value
//     const value = 65
//     //can be profit or margin
//     const target = 'margin'
//     const pageSize = 90
//     const pageLimit = null
//     const pageNumber = 8

//     try {
//         const products = await fetchPageOfPublishedProducts(pageSize, pageNumber)
//         const productIds = products.data.map(p => p._id)
//         console.log(`found ${productIds.length} products`)
//         // const productIds = ['61464613962ce064521905be']
//         if(productIds.length) {
//             await changePrice(productIds, target, value)        
//         } else {
//             console.log('no products found')
//         }
//     } catch (err) {
//         console.log('ERROR: ', err.message)
//         console.log('ERROR: ', err)
//     }
// })();





