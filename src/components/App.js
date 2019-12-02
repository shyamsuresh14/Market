import React, { Component } from 'react';
import Web3 from 'web3';
import BuySell from './BuySell';
import Market from '../abis/Market.json';
//import logo from '../logo.png';
import './App.css';

class App extends Component {
  constructor(props){
    super(props)
    this.state = {
      account: "",
      prodCount: 0,
      products: [],
      loading: true
    }
  }

  async componentWillMount(){
    await this.loadWeb3()
    await this.loadData()
  }
  
  loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  loadData = async () => {
    let accounts = await window.web3.eth.getAccounts()
    this.setState({
      account: accounts[0]
    })
    let networkId = await window.web3.eth.net.getId()
    let networkData = Market.networks[networkId]
    if(networkData){
      let market = window.web3.eth.Contract(Market.abi, networkData.address)
      this.setState({market})
      let prodCount = await market.methods.prodCount().call()
      let products = []
      for(var i = 1; i <= prodCount; i++){
        let product = await market.methods.products(i).call()
        products.push(product)
      }
      this.setState({
        prodCount: prodCount.toNumber(),
        products: products,
        loading: false
      })
    }else{
      window.alert("The contract is not deployed on this network!")
    }
  }

  createProduct = (name, price) => {
    this.setState({loading: true})
    this.state.market.methods.createProduct(name, price).send({from: this.state.account})
    .once("receipt", (receipt) => {
      this.setState({loading: false})
    })
  }

  purchaseProduct = (id, price) => {
    this.setState({loading: true})
    this.state.market.methods.purchaseProduct(id).send({from: this.state.account, value: price})
    .once("receipt", (receipt) => {
      this.setState({loading: false})
    })
  }

  render() {
    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <span className="navbar-brand col-sm-3 col-md-2 mr-0">Marketplace</span>
          <span style={{color: "#FFFFFF"}}>Hello, {this.state.account} &nbsp;</span>
        </nav>

        <div className="container-fluid mt-5">
          {this.state.loading ? <p>Loading...</p> :
          
            <div className="row">
              <main role="main" className="col-lg-12 d-flex text-center">
                <div className="content mr-auto ml-auto">
                  <BuySell createProduct={this.createProduct} 
                    products={this.state.products}
                    purchaseProduct={this.purchaseProduct}/>
                </div>
              </main>
            </div>
          
          }
        </div>
      </div>
    );
  }
}

export default App;
