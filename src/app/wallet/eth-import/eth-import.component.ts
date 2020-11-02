import { Component, OnInit } from '@angular/core';
import { GlobalService } from '@shared/services/global.service';
import { ModalService } from '@shared/services/modal.service';


import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, FormControl, Validators} from '@angular/forms';
import { TokenService } from '@shared/services/token.service';
import { EncryptionService } from '@shared/services/encryption.service';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-eth-import',
  templateUrl: './eth-import.component.html',
  styleUrls: ['./eth-import.component.css']
})
export class EthImportComponent implements OnInit {
  by_mnemonic = true;
  importForm = new FormGroup({
    from: new FormControl('mnemonic',[
      Validators.required
    ]),
    mnemonic:new FormControl('',[
      Validators.required
    ]),
    sels_pk: new FormControl('',[
      Validators.required
    ]),
    bels_pk: new FormControl('',[
      Validators.required
    ])
  })
  constructor(
    private globalService: GlobalService, 
    public activeModal: NgbActiveModal, 
    private genericModalService: ModalService,
    private Token: TokenService,
    private encryption:EncryptionService
    ) {}

  ngOnInit() {
  }

  async importNow(){
    let walletname = this.globalService.getWalletName();
    let wallet:any;
    if(this.importForm.value.from != 'pk'){
      wallet = await this.Token.createWalllet(this.importForm.value.mnemonic);
    }else{
      wallet = this.Token.createWalletFromPk(this.importForm.value.pk);
    }
    console.log('comp',wallet);

    if(wallet.privateKey){
      wallet.privateKey = this.encryption.encrypt(wallet.privateKey);
      this.Token.storeLocally(wallet,walletname,'SELS');
      this.Token.storeLocally(wallet,walletname,'BELS');
      console.log('account stored')
    }else{
      console.log('Something went wrong!')
    }

    
  }
  updateBy(){
    if(this.importForm.value.from=='pk'){
      this.by_mnemonic = false;
    }else{
      this.by_mnemonic = true;
    }
  }



}
