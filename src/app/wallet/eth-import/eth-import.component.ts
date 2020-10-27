import { Component, OnInit } from '@angular/core';
import { GlobalService } from '@shared/services/global.service';
import { ModalService } from '@shared/services/modal.service';


import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, FormControl, Validators} from '@angular/forms';
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
    ) {}

  ngOnInit() {
  }

  importNow(){
    console.log(this.importForm.value);
  }
  updateBy(){
    if(this.importForm.value.from=='pk'){
      this.by_mnemonic = false;
    }else{
      this.by_mnemonic = true;
    }
  }



}
