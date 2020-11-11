import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { GlobalService } from '@shared/services/global.service';
import { TokenService } from '@shared/services/token.service';

@Component({
  selector: 'app-exchange',
  templateUrl: './exchange.component.html',
  styleUrls: ['./exchange.component.css']
})
export class ExchangeComponent implements OnInit {
  received_amount = 0;
  exchangeForm = new FormGroup({
    from: new FormControl('',[
      Validators.required
    ]),
    deposit_amount:new FormControl('',[
      Validators.required
    ])
  })
  constructor(
    private globalService : GlobalService,
    private Token : TokenService
  ) { }

  ngOnInit() {
  }

  exchangeNow(){
    console.log(this.exchangeForm.value)
    let walletName = this.globalService.getWalletName();
    let tokenWallet = this.Token.getLocalWallet(walletName,this.exchangeForm.value.from);
    console.log(walletName,tokenWallet);
  }
  updateReceivedAmount(){
    if(this.exchangeForm.value.deposit_amount>0){
      this.received_amount = this.exchangeForm.value.deposit_amount*0.1;
    }else{
      this.received_amount = 0;
    }
  }

}
