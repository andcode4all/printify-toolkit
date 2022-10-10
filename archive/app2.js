
(async () => {

    const superagent = require('superagent');
    const getProductsURL = 'https://api.printify.com/v1/shops/2728905/products.json'
    const republishProductsURL = 'https://api.printify.com/v1/shops/2728905/products/:product_id/publish.json'
    const bearerToken = `Bearer ${require('./config.json').printify_token}`

    let failCount = 0
    let successCount = 0

    const getProductIDs = async () => {
        let promises = []
        let products = []
        let pageSize = 5
        let first_page = await superagent.get(`${getProductsURL}?page=1&limit=${pageSize}&sort=-updated_at`).set('authorization', bearerToken)

        let total_pages = first_page.body.last_page

        for(let i = 1; i <= total_pages; i++) {
            promises.push(superagent.get(`${getProductsURL}?page=${i}&limit=${pageSize}&sort=-updated_at`).set('authorization', bearerToken))
        }

        let responses = await Promise.all(promises)
        responses.forEach(res => products = [...products, ...res.body.data])
        // console.log(JSON.stringify(first_page, null, 3))
        return products.filter(product => { return product.external && product.external.handle && product.visible && !product.is_locked }).map(product => product.id)
    }

    const getPagedPromises = async () => {
        let promises = []
        let products = []
        let pageSize = 30
        let first_page = await superagent.get(`${getProductsURL}?page=1&limit=${pageSize}&sort=-updated_at`).set('authorization', bearerToken)

        let total_pages = first_page.body.last_page
        let page
        for(let i = 1; i <= total_pages; i++) {
            page = await superagent.get(`${getProductsURL}?page=${i}&limit=${pageSize}&sort=-updated_at`).set('authorization', bearerToken)
            log(`Starting page ${i}`)

            let ids = page.body.data.filter(product => { return product.external && product.external.handle && product.visible && !product.is_locked }).map(product => product.id)

            await republishProducts(ids)

            log(`Finishing page ${i}`)
            if(i <= total_pages) {
                console.log('Waiting 8 seconds...')
                setTimeout(()=> {}, 8000)
            }
        }
    }


    const republishProducts = async (products_ids) => {
        let url
        let promises = []
        
        products_ids.forEach(
            product_id => {
                
                let republishParams = {
                    title: false,
                    description: false,
                    images: false,
                    variants: true,
                    tags: false
                }

                url = republishProductsURL.replace(':product_id', product_id)
                let promise = superagent.post(url).send(republishParams).set('authorization', bearerToken)
                .then(
                    () => {
                        successCount++
                    }
                )
                .catch(
                    (e) => {
                        failCount++
                        console.log(`Failed to republish: ${product_id}`)
                        console.log(e.message)
                    }
                );
                promises.push(promise)
            }
        )

        return Promise.all(promises)
    }

    const log = (message) => {
        console.log('=======================================')
        console.log(message)
        console.log('=======================================')
    }

  try {
    log('fetching published product IDs from Printify...')
    // let ids = await getProductIDs()
    await getPagedPromises()
    // log(`found ${ids.length} published product IDs`)
    // log(`republishing...`)
    // let ids = ['62672ab526a3c9031e4a6696']
    // await republishProducts(ids)
    console.log('=======================================')
    console.log('=======================================')
    console.log(`successfully republished ${successCount} listings`)
    console.log(`failed to republish ${failCount} listings`)
    console.log('=======================================')
    console.log('=======================================')
  } catch (err) {
    console.log('Error:', err.message)
  }

})();

