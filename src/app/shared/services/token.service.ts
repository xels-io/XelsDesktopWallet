import { Injectable } from '@angular/core';
import web3 from 'web3';
//import { hdkey } from 'ethereumjs-wallet';
import hdkey from 'hdkey';
import * as bip39 from 'bip39';
let web3ProviderApi='15851454d7644cff846b1b8701403647';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  contractAddress = '';
  network = '';
  abi;
  gasLimit = 60000;
  contract;
  web3;
  

  initialize(contractAddress,abi,network='mainnet'){
    this.network = network;
    if(network == 'testnet'){
      this.web3 = new web3(new web3.providers.HttpProvider("https://rinkeby.infura.io/v3/"+web3ProviderApi));
    }else{
      this.web3 = new web3(new web3.providers.HttpProvider("https://mainnet.infura.io/v3/"+web3ProviderApi));
    }
    this.contractAddress = contractAddress;
    this.abi = abi;
    this.contract = new this.web3.eth.Contract(abi,contractAddress);
  }

  createWalllet(mnemonic=''){
      return new Promise((resolve,reject)=>{
        bip39.mnemonicToSeed(mnemonic).then(seed=>{
            const root = hdkey.fromMasterSeed(seed);
	        const privateKey = root.privateKey.toString('hex');
            let web3js =  new web3();
            let account = web3js.eth.accounts.privateKeyToAccount("0x" + privateKey);
            let wallet = {address:account.address,privateKey:account.privateKey};
            resolve(wallet) 
        });
      })
  }
  createWalletFromPk(pk){
    let web3js =  new web3();
    let account = web3js.eth.accounts.privateKeyToAccount(pk);
    let wallet = {address:account.address,privateKey:account.privateKey};
    return wallet; 
  }
  storeLocally(wallet,user,token){
      let walletsString = localStorage.getItem('wallets');
      let wallets = {};
      if(walletsString){
        wallets = JSON.parse(walletsString);
      }
      if(!wallets[user]) wallets[user] = {};
      wallets[user][token] = wallet;
      localStorage.setItem('wallets',JSON.stringify(wallets));
  }
  getLocalWallet(user,token){
    let walletsString = localStorage.getItem('wallets');
    let wallets = {};
    if(walletsString){
      wallets = JSON.parse(walletsString);
    }
    if(!wallets[user]) return null;
    
    if(wallets[user][token]){
        return wallets[user][token] 
    }else{
        return null;
    }
  }

  getTotalSupply(){
    let _this = this;
    return new Promise((resolve,reject)=>{
        _this.contract.methods.totalSupply().call()
            .then(function(result){
                _this.fromUnit(result).then(amount=>{
                    resolve(amount);
                })
            }).catch(err=>{
            reject(err)
        });
    })
}

getBalance(address){
    let _this = this;
    return new Promise((resolve,reject)=>{
        _this.contract.methods.balanceOf(address).call()
            .then(function(result){
                _this.fromUnit(result).then(amount=>{
                    return resolve(amount);
                }).catch(err=>{
                    return reject(err)
                })
            }).catch(err=>{
                console.log('Error to find balance')
                console.log(err);
                return reject(err)
        });
    })
}

getDecimals(){
    let _this = this;
    return new Promise((resolve,reject)=>{
        _this.contract.methods.decimals().call().then(decimals=>{
            resolve(decimals);
        });
    })
}

getUnit(){
    return new Promise((resolve,reject)=>{
        this.getDecimals().then(function(res_decimals:string){
            let decimals = parseInt(res_decimals);
            if(decimals != 0){
                let des = '0';
                let floatDes = parseFloat('0.'+des.repeat(decimals-1)+'1');
                resolve(floatDes);
            }else{
                resolve(1);
            }

        })
    });
}

getName(){
    return new Promise((resolve,reject)=>{
        this.contract.methods.name().call().then(name=>{
            resolve(name);
        });
    })
}

toUnit(amount){
    return new Promise((resolve,reject)=>{
        this.getUnit().then(function(res_unit:string){
          let unit = parseInt(res_unit)
            resolve(Math.ceil(amount/unit));
        }).catch(err=>{
            reject(err);
        })
    });

};

fromUnit(amount){
    let _this = this;
    return new Promise((resolve,reject)=>{
        _this.getUnit().then(function(res_unit:string){
          let unit = parseInt(res_unit)
          resolve(amount*unit);
        }).catch(err=>{
            reject(err)
        })
    });

};

getSymbol(){
    return new Promise((resolve,reject)=>{
        this.contract.methods.symbol().call().then(name=>{
            resolve(name);
        });
    })
};

isAddress(address){
    let format = /^0x[0-9a-fA-F]{40}$/;
    return format.test(address);
}


transfer (fromAddress,pKey,toAddress,amount){
    let resData = {
        error : -1,
        message : null,
        txId : null,
    }
    return new Promise((resolve,reject)=>{

        let Tx = require('ethereumjs-tx');

        if(pKey.length==66){
            pKey = pKey.substr(2, pKey.length);
        }

        let fromPkeyB = Buffer.from(pKey,'hex');

        if(this.isAddress(toAddress)){
            toAddress = this.web3.utils.toChecksumAddress(toAddress);
        }
        if(this.web3.utils.isAddress(toAddress)){

            let myContract = this.contract;
            this.toUnit(amount).then(sendAmount=>{
                let data = myContract.methods.transfer(toAddress, sendAmount).encodeABI();
                this.web3.eth.getBalance(fromAddress,(err,res_balance)=>{
                    if(err){
                        reject(err);
                    }else{
                      let balance = parseInt(res_balance);
                        this.web3.eth.getTransactionCount(fromAddress).then(nonce=>{

                            this.web3.eth.getGasPrice()
                                .then((res_gasPrice)=>{
                                    let gasPrice = parseInt(res_gasPrice);
                                    if(balance >= this.gasLimit*gasPrice){
                                        let rawTx = {
                                            "nonce": this.web3.utils.toHex(nonce),
                                            "gasPrice": this.web3.utils.toHex(gasPrice),
                                            "gasLimit": this.web3.utils.toHex(this.gasLimit),
                                            "to": this.contractAddress,
                                            "value": "0x00",
                                            "data": data,
                                            "chainId":this.web3.utils.toHex(1) //mainnet
                                        };
                                        if(this.network !='mainnet'){
                                          rawTx.chainId = this.web3.utils.toHex(4); //4=rinkeby 42=kovan
                                        }

                                        const tx = new Tx(rawTx);
                                        tx.sign(fromPkeyB);
                                        let serializedTx = "0x" + tx.serialize().toString('hex');

                                        this.web3.eth.sendSignedTransaction(serializedTx,(err,res)=>{
                                            if(err){
                                                console.log(err);
                                                resData.error = 1;
                                                resData.message = 'Private key does not match or network error at broadcasting ETH.';

                                                reject(resData);
                                                return false;
                                            }else{
                                                resData.error = 0;
                                                resData.message = 'Token has been sent Successfully.';
                                                resData.txId = res;
                                                resolve(resData);

                                            }
                                        });
                                    }// if balance is available
                                    else{
                                        resData.error = 1;
                                        resData.message = 'Insufficient balance for gas.';
                                        reject(resData);
                                    }

                                }); //getGasPrice

                        })//get nonce
                    }

                });//get balance
            })//amount convert to Unit value

        }// if address is valid
        else{
            resData.error = 1;
            resData.message = `Invalid Address to send (${toAddress})`;
            reject(resData);
        }


    })
}
}
