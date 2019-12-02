const Market = artifacts.require("./Market.sol")
require("chai").use(require("chai-as-promised")).should()

contract('Market', ([deployer, seller, buyer]) => {
    let market

    before(async () => {
        market = await Market.deployed()
    }) 

    describe('deployment', async() => {
        it('deploy success', async() => {
            let address = await market.address
            assert.notEqual(address, "0x0"); assert.notEqual(address, "")
            assert.notEqual(address, null); assert.notEqual(address, undefined)
        })
        it('has a name', async() => {
            let name = await market.name()
            assert.equal(name, "My Marketplace")
        })
    })

    describe('productCreation', async() => {
        let result, prodCnt = 0;
        let prodName = "OnePlus 3", price = web3.utils.toWei("1", "Ether")
        before(async() => {
            result = await market.createProduct(prodName, price, {from: seller})
            prodCnt = await market.prodCount()
        })

        it("Product Created", async() => {
            assert.equal(prodCnt, 1)
            let event = result.logs[0].args
            assert.equal(event.id.toNumber(), prodCnt.toNumber(), "id is correct")
            assert.equal(event.name, prodName, "name is correct")
            assert.equal(event.price, price, "price is correct")
            assert.equal(event.owner, seller, "owner is correct")
            assert.equal(event.purchased, false, "purchased is correct")

            await await market.createProduct("", price, {from: seller}).should.be.rejected
            await await market.createProduct(prodName, 0, {from: seller}).should.be.rejected
        })

        it("Product Listed", async() => {
            let product = await market.products(prodCnt)
            assert.equal(product.id.toNumber(), prodCnt.toNumber(), "id is correct")
            assert.equal(product.name, prodName, "name is correct")
            assert.equal(product.price, price, "price is correct")
            assert.equal(product.owner, seller, "owner is correct")
            assert.equal(product.purchased, false, "purchased is correct")
        })

        it("Product Sold", async() => {
            let oldSellerBalance = await web3.eth.getBalance(seller)
            oldSellerBalance = new web3.utils.BN(oldSellerBalance)
            
            let result = await market.purchaseProduct(prodCnt, {from: buyer, value: price})
            let event = result.logs[0].args
            assert.equal(event.id.toNumber(), prodCnt.toNumber(), "id is correct")
            assert.equal(event.name, prodName, "name is correct")
            assert.equal(event.price, price, "price is correct")
            assert.equal(event.owner, buyer, "owner is correct")
            assert.equal(event.purchased, true, "purchased is correct")

            let _price = new web3.utils.BN(price)
            let balanceAfterTransfer = oldSellerBalance.add(_price)
            let newSellerBalance = await web3.eth.getBalance(seller)
            newSellerBalance = new web3.utils.BN(newSellerBalance)

            assert.equal(newSellerBalance.toString(), balanceAfterTransfer.toString())

            await await market.purchaseProduct(54, {from: buyer, value: price}).should.be.rejected  //invalid product
            await await market.purchaseProduct(prodCnt, {from: buyer, value: web3.utils.toWei("0.5")}).should.be.rejected  //not enough money
            await await market.purchaseProduct(prodCnt, {from: deployer, value: price}).should.be.rejected //already bought
            await await market.purchaseProduct(prodCnt, {from: seller, value: price}).should.be.rejected //buyer = seller
        })
    })
})