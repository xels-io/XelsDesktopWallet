import { Component, OnInit} from '@angular/core';
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
    from: new FormControl(true),
    mnemonic:new FormControl('',[
      Validators.required
    ]),
    sels_pk: new FormControl(''),
    bels_pk: new FormControl('')
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
    if(this.importForm.invalid){
      this.globalService.markFormGroupTouched(this.importForm);
      console.log(this.importForm);
      return;
    }

    let walletname = this.globalService.getWalletName();
    //need to check this.importForm.value.mnemonic here
    let walletHash = this.globalService.mnemonicToHash(this.importForm.value.mnemonic);
    if(this.importForm.value.from != 'pk'){
      let wallet:any = await this.Token.createWalllet(this.importForm.value.mnemonic);
      wallet.privateKey = this.encryption.encrypt(wallet.privateKey);
      this.Token.storeLocally(wallet,walletname,'SELS',walletHash);
      this.Token.storeLocally(wallet,walletname,'BELS',walletHash);
    }else{
      let sWallet = this.Token.createWalletFromPk(this.importForm.value.sels_pk);
      sWallet.privateKey = this.encryption.encrypt(sWallet.privateKey);
      let bWallet = this.Token.createWalletFromPk(this.importForm.value.bels_pk);
      bWallet.privateKey = this.encryption.encrypt(bWallet.privateKey);
      this.Token.storeLocally(sWallet,walletname,'SELS',walletHash);
      this.Token.storeLocally(bWallet,walletname,'BELS',walletHash);
    }
    this.activeModal.close('importEth Done');
  }
  updateBy(){
    this.by_mnemonic = this.importForm.value.from;
    if(this.by_mnemonic){
      this.importForm.controls['sels_pk'].setErrors(null);
      this.importForm.controls['bels_pk'].setErrors(null);
      this.importForm.get('sels_pk').clearValidators();
      this.importForm.get('bels_pk').clearValidators();
    }else{
      this.importForm.get('sels_pk').setValidators(Validators.required)
      this.importForm.get('bels_pk').setValidators(Validators.required)
    }
  }



}
