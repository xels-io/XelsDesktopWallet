import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { ApiService } from '@shared/services/api.service';
import { GlobalService } from '@shared/services/global.service';
import { TokenService } from '@shared/services/token.service';
import { WalletInfo } from '@shared/models/wallet-info';
import { ExchangeApiService } from '@shared/services/exchange-api.service';
import { send } from 'process';

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
    private exApi:ExchangeApiService
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
      console.log(this.rows);
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
    this.exApi.newOrder(sendData).then(res=>{
      let data = res.data;
    }).catch(err=>{
      console.log(err)
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
