(async () => {
    const superagent = require('superagent');
    const getProductsURL = 'https://printify.com/api/v1/users/7059331/shops/2728905/products'
    const getOneProductURL = 'https://printify.com/api/v1/users/7059331/shops/2728905/products/'
    const bulkRepublishProductsURL = 'https://printify.com/api/v1/users/7059331/shops/2728905/products/publish'
    const bearerToken = process.argv[2] === 'Bearer' ? `${process.argv[2]} ${process.argv[3]}` : `Bearer ${process.argv[2]}`

    const getProductIDs = async () => {
        let products = []
        let promises = []
        let first_page = await superagent.get(`${getProductsURL}?page=1&limit=12&sort=-updated_at`).set('authorization', bearerToken)
        console.log('ACCESS GRANTED - EXECUTING SCRIPT')
        let total_pages = first_page._body.last_page
        for(let i = 1; i <= total_pages; i++) {
            promises.push(superagent.get(`${getProductsURL}?page=${i}&limit=12&sort=-updated_at`).set('authorization', bearerToken))
        }
        let responses = await Promise.all(promises)
        products = [...responses.map(r => r._body.data)]
        for(let res of responses) {
            for(let product of res._body.data) {
                // if(product.dirty || !product.name.includes('Ash, FG, Maroon, Sand')) {
                if( product.publishing_status != 'succeeded' || !product.is_visible ) {
                    continue
                } else {
                    products.push(product)
                }
            }
        }
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

    const republishProductsBulk = async (products) => {
        let productIds = products.map(p => p._id)
        let republishParams = {products: productIds}
        await superagent.post(bulkRepublishProductsURL).send(republishParams).set('authorization', bearerToken)
    }

  try {
    let products = await getProducts()
    console.log(`found ${products.length} product IDs`)
    console.log('republishing...')
    await republishProductsBulk(products)
    console.log('=======================================')
    console.log('=======================================')
    console.log(`successfully republished listings`)
    console.log('=======================================')
    console.log('=======================================')
  } catch (err) {
    console.log(err)
  }

})();