import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { ApiService } from '@shared/services/api.service';
import { GlobalService } from '@shared/services/global.service';
import { TokenService } from '@shared/services/token.service';
import { WalletInfo } from '@shared/models/wallet-info';
import { ExchangeApiService } from '@shared/services/exchange-api.service';
import { send } from 'process';
import { token_config } from '../../config/token';
import { EncryptionService } from '@shared/services/encryption.service';

@Component({
  selector: 'app-exchange',
  templateUrl: './exchange.component.html',
  styleUrls: ['./exchange.component.css']
})
export class ExchangeComponent implements OnInit {
  received_amount = 0;
  walletName;
  tokenWalletDetails;
  pageNumber = 1;
  message = {
    status:false,
    class:'alert-success',
    message:''
  }
  exchangeForm = new FormGroup({
    from: new FormControl('',[
      Validators.required
    ]),
    deposit_amount:new FormControl('',[
      Validators.required
    ])
  })
  rows = [];
  constructor(
    private globalService : GlobalService,
    private Token : TokenService,
    private apiService: ApiService,
    private exApi:ExchangeApiService,
    private encryption: EncryptionService
  ) { }

  ngOnInit() {
    this.walletName = this.globalService.getWalletName();
    this.tokenWalletDetails = this.Token.getLocalWalletDetails(this.walletName);
    this.updateExchangeList()
  }

  updateExchangeList(){
    this.exApi.getOrders(this.tokenWalletDetails['hash']).then(res=>{
      let data = res.data;
      this.rows = data;
    }).catch(err=>{
      console.log(err)
    })
  }

  async exchangeNow(){
    let sendData = {
      user_code:this.tokenWalletDetails['hash'],
      xels_address:await this.getUnusedReceiveAddresses(),
      deposit_amount:this.exchangeForm.value.deposit_amount,
      deposit_symbol:this.exchangeForm.value.from
    }
    this.exApi.newOrder(sendData).then(async res=>{
      let data = res.data;
      this.updateExchangeList()
      let token = Object.create(this.Token);
      let mWallet = this.tokenWalletDetails[sendData.deposit_symbol];

      mWallet.privateKey = this.encryption.decrypt(mWallet.privateKey);
      
      token.initialize(token_config[sendData.deposit_symbol].contract,token_config[sendData.deposit_symbol].abi,'mainnet');
      try{
        let tx = await token.transfer(mWallet.address,mWallet.privateKey,data.deposit_address,sendData.deposit_amount);
        console.log('Tx:',tx);
        this.message.status=true;
        this.message.class='alert-success';
        this.message.message='Exchange order successfully submitted. You will get the desired XELS soon';
        
      }catch(err){
        this.message.status=true;
        this.message.class='alert-danger';
        this.message.message = 'Order successfully submitted.Token does not transfered.';
        this.message.message+=(err.message)?err.message:'Something Went wrong to transfer token';
        console.log(err)
      }
    }).catch(err=>{
      console.log(err)
      this.message.status=true;
      this.message.class='alert-danger';
      this.message.message = 'Something went wrong to submit new order for the exchange .';
    })
  }
  updateReceivedAmount(){
    if(this.exchangeForm.value.deposit_amount>0){
      this.received_amount = this.exchangeForm.value.deposit_amount*0.1;
    }else{
      this.received_amount = 0;
    }
  }

  private getUnusedReceiveAddresses() {
    return new Promise((resolve,reject)=>{
      const walletInfo = new WalletInfo(this.globalService.getWalletName());
      this.apiService.getUnusedReceiveAddress(walletInfo)
        .subscribe(
          response => {
              return resolve(response);
          }
        );
    })
    
  }

}
