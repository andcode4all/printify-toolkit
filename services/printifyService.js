const values = require('../values.json')
const getProductsURL = `https://printify.com/api/v1/users/${values.user_id}/shops/${values.etsy_shop_id}/products`
const getOneProductURL = `https://printify.com/api/v1/users/${values.user_id}/shops/${values.etsy_shop_id}/products/`
// const bulkRepublishProductsURL = `https://printify.com/api/v1/users/${values.user_id}/shops/${values.etsy_shop_id}/products/publish`
const bulkRepublishProductsURL = `https://printify.com/api/v1/users/${values.user_id}/shops/${values.etsy_shop_id}/products/publish-with-details`
const bearerToken = process.argv[2] === 'Bearer' ? `${process.argv[2]} ${process.argv[3]}` : `Bearer ${process.argv[2]}`
const superagent = require('superagent');
const config = require('../config')

    const getProductIDs = async (pageSize = 12, pageLimit) => {
        let products = []
        let promises = []
        let first_page = await superagent.get(`${getProductsURL}?page=1&limit=${pageSize}&sort=-updated_at&filters%5Bstatus%5D=published`).set('authorization', bearerToken)
        console.log('ACCESS GRANTED - EXECUTING SCRIPT')
        console.log(`there is ${first_page._body.last_page} pages of ${pageSize}`)
        let total_pages = pageLimit || first_page._body.last_page
        for(let i = 1; i <= total_pages; i++) {
            promises.push(superagent.get(`${getProductsURL}?page=${i}&limit=${pageSize}&sort=-updated_at&filters%5Bstatus%5D=published`).set('authorization', bearerToken))
        }
        console.log(`fetching ${total_pages} pages of products...`)
        let responses = await Promise.all(promises)
        console.log('...done')
        // responses = [...responses.map(r => r._body.data)]
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

    const fetchPageOfPublishedProducts = async (pageSize = 12, pageNumber) => {
        console.log(`fetching page number ${pageNumber} of ${pageSize} products...`)
        let response = await superagent.get(`${getProductsURL}?page=${pageNumber}&limit=${pageSize}&sort=-updated_at&filters%5Bstatus%5D=published`).set('authorization', bearerToken)
        // console.log(`there is ${response._body.last_page} pages of ${pageSize}`)
        return response._body
    }

    const fetchAllPublishedProducts = async () => {
        const pageSize = 50
        let promises = []
        let first_page = await fetchPageOfPublishedProducts(pageSize, 1)
        let total_pages = first_page.last_page
        let pages = [first_page]
        for(let i = 2; i <= total_pages; i++) {
            promises.push(fetchPageOfPublishedProducts(pageSize, i).then(response => pages.push(response) ))
        }
        await Promise.all(promises)
        let products = []
        for(let page of pages) {
            for(let product of page.data) {
                if(isPublished(product)) {
                    products.push(product)
                }
            }
        }
        return products
    }

    const isPublished = (product) => {
        return ( ['succeeded', 'failed'].includes(product.publishing_status) && product.is_visible )
    }

    const publishDetailsAreCorrect = (product) => {
        let details = product.publish_details
        return (details && !details.description && !details.title && !details.mockup )
    }

    const getProductsFromIds = async (ids) => {
        let promises = []
        for(let id of ids){
            if(id) {
                let promise = superagent.get(getOneProductURL+id).set('authorization', bearerToken).then(response => response._body)
                promises.push(promise)
            }
        }
        console.log(`fetching ${ids.length} product objects...`)
        const response = await Promise.all(promises)
        console.log('...done')
        return response
    }

    const getProducts = async (pageSize = 12, pageLimit, pageNumber) => {
        let productIds = await getProductIDs(pageSize, pageLimit, pageNumber)
        let products = await getProductsFromIds(productIds)
        return products
    }

    const republishProductsBulk = async (productIds) => {
        if(!productIds.length) {
            console.log('no products to change')
            return
        }
        console.log(`Republishing ${productIds.length} products...`)
        let republishParams = {
            products: productIds,
            name: false,
            description: false,
            mockup: false,
            inventory: true,
            tags: true,
            keyFeatures: true,
            shipping_template: false
        }

        return superagent.post(bulkRepublishProductsURL).send(republishParams).set('authorization', bearerToken)
    }

    const changePrice = async (productIds, target, value) => {
        if(!productIds.length) {
            console.log('no products to change')
            return
        }
        console.log(`changing target ${target} of ${productIds.length} products to ${value}`)
        const priceChangeParams = { productIds, target, value }
        let response = await superagent.post(`${config.web_api_url}/users/${values.user_id}/shops/${values.etsy_shop_id}/${config.price_change_path}`).send(priceChangeParams).set('authorization', bearerToken)
        console.log(`successfully changed price of ${response._body.success.length} products`)
        return response
    }

    const hasPublishingError = (product) => {
        return product.log && product.log.publisher && product.log.publisher.error_count > 0
    }


    const sleep = async (ms) => {
        console.log(`waiting ${ms/1000} seconds...`)
        await new Promise(resolve => setTimeout(resolve, ms));
        console.log('...continuing')
        return
    }

    module.exports = {
        getProducts,
        republishProductsBulk,
        changePrice,
        getProductIDs,
        publishDetailsAreCorrect,
        getProductsFromIds,
        fetchPageOfPublishedProducts,
        fetchAllPublishedProducts,
        hasPublishingError,
        sleep,
        isPublished
    }