
const $ = require('jquery')

$(function(){
    $('body').on('#republish-button', 'click', () => {
        console.log('WOOT')
    })
})

const republish = async (token) => {
    const superagent = require('superagent');
    const getProductsURL = 'https://printify.com/api/v1/users/7059331/shops/2728905/products'
    const getOneProductURL = 'https://printify.com/api/v1/users/7059331/shops/2728905/products/'
    const republishProductsURL = 'https://printify.com/api/v1/users/7059331/shops/2728905/products/'
    const bearerToken = token
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
        // console.log(productIds.length)
        let products = await getProductsFromIds(productIds)
        return products.map(product => product._body)
    }

    const republishProducts = async (products) => {

        let promises = products.map(
            product => {
                // console.log(product.print_provider.prints)
                // if(!product.print_provider.prints.some(p => p.images)) { return Promise.resolve({status: 500}) }

                // console.log(`${product.name} - ${product.print_provider.prints}`)

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
                // console.log('PARAMS: ', republishParams)
                // return
                return superagent.put(`${republishProductsURL}${productID}`).send(republishParams).set('authorization', bearerToken)
                .then(
                    () => {
                        // console.log(`Successfully republished: ${product.name}`)
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

    // await getProductIDs()
    let products = await getProducts()
    // console.log(products[0].print_provider)
    // console.log('About to republish this many products: ', products.length)
    await republishProducts(products)
    console.log('=======================================')
    console.log('=======================================')
    console.log(`successfully republished ${successCount} listings`)
    console.log(`failed to republish ${failCount} listings`)
    console.log('=======================================')
    console.log('=======================================')
    // console.log(res.map(r => r.status))
  } catch (err) {
    console.log(err)
  }

})();

