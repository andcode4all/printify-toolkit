(async () => {
    const superagent = require('superagent');
    const getProductsURL = 'https://printify.com/api/v1/users/7059331/shops/2728905/products'
    const getOneProductURL = 'https://printify.com/api/v1/users/7059331/shops/2728905/products/'
    const republishProductsURL = 'https://printify.com/api/v1/users/7059331/shops/2728905/products/'
    const bearerToken = process.argv[2].includes('Bearer') ? process.argv[2] : `Bearer ${process.argv[2]}`
    let failCount = 0
    let successCount = 0
    const getProductIDs = async () => {
        let products = []
        let promises = []
        let first_page = await superagent.get(`${getProductsURL}?page=1&limit=12&sort=-updated_at`).set('authorization', bearerToken)
        let total_pages = first_page._body.last_page
        for(let i = 1; i <= total_pages; i++) {
            promises.push(superagent.get(`${getProductsURL}?page=${i}&limit=12&sort=-updated_at`).set('authorization', bearerToken))
        }
        let responses = await Promise.all(promises)
        products = [...responses.map(r => r._body.data)]
        for(let res of responses) {
            for(let product of res._body.data) {
                // if(product.dirty || !product.name.includes('Ash, FG, Maroon, Sand')) {
                if(product.dirty) {
                    continue
                } else {
                    products.push(product)
                }
            }
        }
        console.log(`found ${products.length} product IDs`)
        return products.map(p=>p._id)
    }

    const getProductsFromIds = async (ids) => {
        let promises = []
        for(let id of ids){
            if(id) {
                let promise = superagent.get(getOneProductURL+id).set('authorization', bearerToken)
                promises.push(promise)
            }
        }
        return Promise.all(promises)
    }

    const getProducts = async () => {
        let productIds = await getProductIDs()
        let products = await getProductsFromIds(productIds)
        return products.map(product => product._body)
    }

    const republishProducts = async (products) => {

        let promises = products.map(
            product => {
                let productID = product._id
                let republishParams = {
                    automatically_publish: true,
                    out_of_stock_publishing: 2,
                    publish_details: {
                        description: false,
                        inventory: true,
                        mockup: false,
                        name: false,
                        tags: true
                    }
                }
                let requiredPublishParams = ['store_validation', 'decorator_id', 'decorators', 'render_settings', 'blueprint_id', 'store_validation', 'publishing_status', 'publish_action', 'print_provider']
                for(let param of requiredPublishParams) {
                    if(product[param]) {
                        republishParams[param] = product[param]
                    }
                }
                return superagent.put(`${republishProductsURL}${productID}`).send(republishParams).set('authorization', bearerToken)
                .then(
                    () => {
                        successCount++
                    }
                )
                .catch(
                    () => {
                        failCount++
                        console.log(`Failed to republish: ${product.name}`)
                    }
                );
            }
        )
        return Promise.all(promises)
    }


  try {

    let products = await getProducts()
    await republishProducts(products)
    console.log('=======================================')
    console.log('=======================================')
    console.log(`successfully republished ${successCount} listings`)
    console.log(`failed to republish ${failCount} listings`)
    console.log('=======================================')
    console.log('=======================================')
  } catch (err) {
    console.log(err)
  }

})();