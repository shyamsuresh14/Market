pragma solidity ^0.5.0;

contract Market {
    string public name;
    uint public prodCount = 0;
    mapping(uint => Product) public products;

    struct Product {
        uint id;
        string name;
        uint price;
        address payable owner;
        bool purchased;
    }

    event productCreated(
        uint id,
        string name,
        uint price,
        address payable owner,
        bool purchased
    );

    event productPurchased(
        uint id,
        string name,
        uint price,
        address payable owner,
        bool purchased
    );

    constructor() public{
        name = "My Marketplace";
    }

    function createProduct(string memory _name, uint _price) public{
        require(bytes(_name).length > 0, "no name");
        require(_price > 0, "price not mentioned");
        prodCount++;
        products[prodCount] = Product(prodCount, _name, _price, msg.sender, false);
        emit productCreated(prodCount, _name, _price, msg.sender, false);
    }

    function purchaseProduct(uint _id) public payable{
        Product memory _product = products[_id];
        address payable _seller = _product.owner;

        require(_product.id > 0 && _product.id <= prodCount, "Invalid product");
        require(_seller != msg.sender, "Can't buy your own product");
        require(msg.value >= _product.price, "Not enough money");
        require(!_product.purchased, "Already purchased");

        _product.owner = msg.sender;
        _product.purchased = true;
        products[_id] = _product;
        address(_seller).transfer(msg.value);
        emit productPurchased(prodCount, _product.name, _product.price, msg.sender, true);
    }
}