import { Component, OnInit, Input } from '@angular/core';

import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { GlobalService } from '@shared/services/global.service';

import { CoinNotationPipe } from '@shared/pipes/coin-notation.pipe';

@Component({
  selector: 'app-send-confirmation',
  templateUrl: './send-confirmation.component.html',
  styleUrls: ['./send-confirmation.component.css']
})
export class SendConfirmationComponent implements OnInit {

  @Input() transaction: any;
  @Input() transactionFee: any;
  @Input() sidechainEnabled: boolean;
  @Input() opReturnAmount: number;
  @Input() hasOpReturn: boolean;
  constructor(private globalService: GlobalService, public activeModal: NgbActiveModal) { }

  public showDetails: boolean = false;
  public coinUnit: string;

  ngOnInit() {
    this.coinUnit = this.globalService.getCoinUnit();
    this.transactionFee = new CoinNotationPipe().transform(this.transactionFee);
    if (this.hasOpReturn) {
      this.opReturnAmount = new CoinNotationPipe().transform(this.opReturnAmount);
      this.transaction.amount = +this.transaction.recipients[0].amount + +this.transactionFee + +this.opReturnAmount;
    } else {
      this.transaction.amount = +this.transaction.recipients[0].amount + +this.transactionFee;
    }
  }

  toggleDetails() {
    this.showDetails = !this.showDetails;
  }
}
