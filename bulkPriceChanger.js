(async () => {
    const { changePrice, fetchPageOfPublishedProducts, sleep, isPublished } = require('./services/printifyService')
    //dollar profit value without decimal point eg: $11.50 should be 1150 || or percentage margin value
    const default_value = 1800
    const sweatshirt_value = 3000
    //can be profit or margin
    const target = 'profit'
    const sweatshirt_target = 'profit'
    const pageSize = 90

    try {
        let pageOfProducts = await fetchPageOfPublishedProducts(pageSize, 1)
        let maxPages = pageOfProducts.last_page
        console.log(`looping over ${maxPages} pages`)

        for(let i = 0; i <= maxPages; i++) {
            if(i > 1) {
                pageOfProducts = await fetchPageOfPublishedProducts(pageSize, i)
            }

            const productIds = []
            const sweatshirtAndHoodieIds = []
            for(let product of pageOfProducts.data) {
                if(!isPublished(product)) {
                    continue
                }
                if(product.tags.includes('Sweatshirts')) {
                    sweatshirtAndHoodieIds.push(product._id)
                } else {
                    productIds.push(product._id)
                }
            }

            console.log(`...found ${sweatshirtAndHoodieIds.length} sweatshirt or hoodies`)
            console.log(`and ${productIds.length} other products from page number ${i}`)

            // console.log(`Sweatshirt and Hoodie IDS: ${sweatshirtAndHoodieIds}`)

            // if(sweatshirtAndHoodieIds.length) {
            //     await changePrice(sweatshirtAndHoodieIds, sweatshirt_target, sweatshirt_value)
            //     await sleep(5000)
            // }
            if(productIds.length) {
                await changePrice(productIds, target, default_value)
                await sleep(5000)
            }
        }
        console.log('**********')
        console.log('**********')
        console.log('**********')
        console.log('Finished!!')
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





