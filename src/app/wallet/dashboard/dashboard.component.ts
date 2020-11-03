import { Component, OnInit, OnDestroy, Input, EventEmitter, Output } from '@angular/core';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';

import { ApiService } from '@shared/services/api.service';
import { GlobalService } from '@shared/services/global.service';
import { ModalService } from '@shared/services/modal.service';
import { WalletInfo } from '@shared/models/wallet-info';
import { TransactionInfo } from '@shared/models/transaction-info';

import { SendComponent } from '../send/send.component';
import { ReceiveComponent } from '../receive/receive.component';
import { TransactionDetailsComponent } from '../transaction-details/transaction-details.component';

import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { TokenService } from '@shared/services/token.service';
import { token_config } from '../../config/token';
import { toInteger } from '@ng-bootstrap/ng-bootstrap/util/util';
import { EthImportComponent } from '../eth-import/eth-import.component';

@Component({
  selector: 'dashboard-component',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit, OnDestroy {
  constructor(
    private apiService: ApiService, 
    private globalService: GlobalService, 
    private modalService: NgbModal, 
    private genericModalService: ModalService, 
    private router: Router, 
    private fb: FormBuilder,
    private Token:TokenService
    ) {
    this.buildStakingForm();
  }

  @Output() closeImport: EventEmitter<boolean> = new EventEmitter();

  public sidechainEnabled: boolean;
  public walletName: string;
  public coinUnit: string;
  public confirmedBalance: number;
  public unconfirmedBalance: number;
  public spendableBalance: number;
  public transactionArray: TransactionInfo[];
  private stakingForm: FormGroup;
  private walletBalanceSubscription: Subscription;
  private walletHistorySubscription: Subscription;
  private stakingInfoSubscription: Subscription;
  public stakingEnabled: boolean;
  public stakingActive: boolean;
  public stakingWeight: number;
  public awaitingMaturity: number = 0;
  public netStakingWeight: number;
  public expectedTime: number;
  public dateTime: string;
  public isStarting: boolean;
  public isStopping: boolean;
  public hasBalance = false;
  public powMiningStarted = false;

  private generalWalletInfoSubscription: Subscription;
  public lastBlockSyncedHeight: number;
  public chainTip: number;
  private isChainSynced: boolean;
  public connectedNodes: number = 0;
  public percentSyncedNumber: number = 0;
  public percentSynced: string;
  blockChainStatus = '';
  connectedNodesStatus = '';

  sels_address:string = '';
  sels:any = 0;
  bels:any = 0;
  bels_address:string = '';
  SelsToken = Object.create(this.Token);
  BelsToken = Object.create(this.Token);
  importBels = true;
  importSels = true;

  ngOnInit() {
    this.sidechainEnabled = this.globalService.getSidechainEnabled();
    this.walletName = this.globalService.getWalletName();
    this.coinUnit = this.globalService.getCoinUnit();
    this.startSubscriptions();
    this.tokenUpdate();
    this.closeImport.subscribe(data=>{
      this.tokenUpdate();
    })
    
  };
  async tokenUpdate(){
    this.SelsToken.initialize(token_config['SELS'].contract,token_config['SELS'].abi,'mainnet')
    this.BelsToken.initialize(token_config['BELS'].contract,token_config['BELS'].abi,'mainnet')
    let belsWallet = this.Token.getLocalWallet(this.walletName,'BELS')
    let selsWallet = this.Token.getLocalWallet(this.walletName,'SELS')
    
    if(belsWallet){
      this.importBels = false;
      this.bels_address = belsWallet.address;
      this.bels = await this.BelsToken.getBalance(belsWallet.address)
    }
    if(selsWallet){
      this.importSels = false;
      this.sels_address = selsWallet.address;
      this.sels = await this.BelsToken.getBalance(selsWallet.address)
    }

  }

  ngOnDestroy() {
    this.cancelSubscriptions();
  }

  private buildStakingForm(): void {
    this.stakingForm = this.fb.group({
      "walletPassword": ["", Validators.required]
    });
  }
  public goToHistory() {
    this.router.navigate(['/wallet/history']);
  }

  public openSendDialog() {
    const modalRef = this.modalService.open(SendComponent, { backdrop: "static", keyboard: false });
  }

  public openReceiveDialog() {
    const modalRef = this.modalService.open(ReceiveComponent, { backdrop: "static", keyboard: false });
  };

  public openEthImportDialog() {
    const modalRef = this.modalService.open(EthImportComponent, { backdrop: "static", keyboard: false });
    let result;
    modalRef.result
            .then((res) => {
              result = res;
              res == 'OK'? this.closeImport.emit(true) : this.closeImport.emit(false); 
            },
            (reason) => {result = result; this.closeImport.emit(false); console.log('cross'); });
  };

  public openTransactionDetailDialog(transaction: TransactionInfo) {
    const modalRef = this.modalService.open(TransactionDetailsComponent, { backdrop: "static", keyboard: false });
    modalRef.componentInstance.transaction = transaction;
  }

  private getWalletBalance() {
    let walletInfo = new WalletInfo(this.globalService.getWalletName());
    this.walletBalanceSubscription = this.apiService.getWalletBalance(walletInfo)
      .subscribe(
        response =>  {
          let balanceResponse = response;
          // TO DO - add account feature instead of using first entry in array
          this.confirmedBalance = balanceResponse.balances[0].amountConfirmed;
          this.unconfirmedBalance = balanceResponse.balances[0].amountUnconfirmed;
          this.spendableBalance = balanceResponse.balances[0].spendableAmount;
          if ((this.confirmedBalance + this.unconfirmedBalance) > 0) {
            this.hasBalance = true;
          } else {
            this.hasBalance = false;
          }
        },
        error => {
          if (error.status === 0) {
            this.cancelSubscriptions();
          } else if (error.status >= 400) {
            if (!error.error.errors[0].message) {
              this.cancelSubscriptions();
              this.startSubscriptions();
            }
          }
        }
      )
    ;
  }

  // todo: add history in seperate service to make it reusable
  private getHistory() {
    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    let historyResponse;
    this.walletHistorySubscription = this.apiService.getWalletHistory(walletInfo)
      .subscribe(
        response => {
          // TO DO - add account feature instead of using first entry in array
          if (!!response.history && response.history[0].transactionsHistory.length > 0) {
            historyResponse = response.history[0].transactionsHistory;
            this.getTransactionInfo(historyResponse);
          }
        },
        error => {
          if (error.status === 0) {
            this.cancelSubscriptions();
          } else if (error.status >= 400) {
            if (!error.error.errors[0].message) {
              this.cancelSubscriptions();
              this.startSubscriptions();
            }
          }
        }
      )
    ;
  };

  private getTransactionInfo(transactions: any) {
    this.transactionArray = [];

    for (let transaction of transactions) {
      let transactionType;
      if (transaction.type === "send") {
        transactionType = "sent";
      } else if (transaction.type === "received") {
        transactionType = "received";
      } else if (transaction.type === "staked") {
        transactionType = "hybrid reward";
      } else if (transaction.type === "mined") {
        transactionType = "pow reward"
      }
      let transactionId = transaction.id;
      let transactionAmount = transaction.amount;
      let transactionFee;
      if (transaction.fee) {
        transactionFee = transaction.fee;
      } else {
        transactionFee = 0;
      }
      let transactionConfirmedInBlock = transaction.confirmedInBlock;
      let transactionTimestamp = transaction.timestamp;

      this.transactionArray.push(new TransactionInfo(transactionType, transactionId, transactionAmount, transactionFee, transactionConfirmedInBlock, transactionTimestamp));
    }
  }

  public startPowMining() {
    const walletData = {
      WalletName: this.globalService.getWalletName(),
    };
    this.apiService.startPowMining(walletData)
    .subscribe(
      response =>  {
        this.powMiningStarted = true;
      },
      error => {
      }
    )
  ;
  }
  public stopPowMining() {
    this.apiService.stopPowMining()
    .subscribe(
      response =>  {
        this.powMiningStarted = false;
      },
      error => {
      }
    )
  ;
  }
  private startStaking() {
    this.isStarting = true;
    this.isStopping = false;
    const walletData = {
      name: this.globalService.getWalletName(),
      password: this.stakingForm.get('walletPassword').value
    };
    this.apiService.startStaking(walletData)
      .subscribe(
        response =>  {
          this.stakingEnabled = true;
          this.stakingForm.patchValue({ walletPassword: "" });
          this.getStakingInfo();
        },
        error => {
          this.isStarting = false;
          this.stakingEnabled = false;
          this.stakingForm.patchValue({ walletPassword: "" });
        }
      )
    ;
  }

  private stopStaking() {
    this.isStopping = true;
    this.isStarting = false;
    this.apiService.stopStaking()
      .subscribe(
        response =>  {
          this.stakingEnabled = false;
        }
      )
    ;
  }

  private getStakingInfo() {
    this.stakingInfoSubscription = this.apiService.getStakingInfo()
      .subscribe(
        response =>  {
          const stakingResponse = response;
          this.stakingEnabled = stakingResponse.enabled;
          this.stakingActive = stakingResponse.staking;
          this.stakingWeight = stakingResponse.weight;
          this.netStakingWeight = stakingResponse.netStakeWeight;
          this.awaitingMaturity = (this.unconfirmedBalance + this.confirmedBalance) - this.spendableBalance;
          this.expectedTime = stakingResponse.expectedTime;
          this.dateTime = this.secondsToString(this.expectedTime);
          if (this.stakingActive) {
            this.isStarting = false;
          } else {
            this.isStopping = false;
          }
        }, error => {
          if (error.status === 0) {
            this.cancelSubscriptions();
          } else if (error.status >= 400) {
            if (!error.error.errors[0].message) {
              this.cancelSubscriptions();
              this.startSubscriptions();
            }
          }
        }
      )
    ;
  }

  private secondsToString(seconds: number) {
    let numDays = Math.floor(seconds / 86400);
    let numHours = Math.floor((seconds % 86400) / 3600);
    let numMinutes = Math.floor(((seconds % 86400) % 3600) / 60);
    let numSeconds = ((seconds % 86400) % 3600) % 60;
    let dateString = "";

    if (numDays > 0) {
      if (numDays > 1) {
        dateString += numDays + " days ";
      } else {
        dateString += numDays + " day ";
      }
    }

    if (numHours > 0) {
      if (numHours > 1) {
        dateString += numHours + " hours ";
      } else {
        dateString += numHours + " hour ";
      }
    }

    if (numMinutes > 0) {
      if (numMinutes > 1) {
        dateString += numMinutes + " minutes ";
      } else {
        dateString += numMinutes + " minute ";
      }
    }

    if (dateString === "") {
      dateString = "Unknown";
    }

    return dateString;
  }

  private cancelSubscriptions() {
    if (this.walletBalanceSubscription) {
      this.walletBalanceSubscription.unsubscribe();
    }

    if(this.walletHistorySubscription) {
      this.walletHistorySubscription.unsubscribe();
    }

    if (this.stakingInfoSubscription) {
      this.stakingInfoSubscription.unsubscribe();
    }
  }

  private startSubscriptions() {
    this.getGeneralWalletInfo();
    this.getWalletBalance();
    this.getHistory();
    if (!this.sidechainEnabled) {
      this.getStakingInfo();
    }
  }

  private getGeneralWalletInfo() {
    let walletInfo = new WalletInfo(this.globalService.getWalletName())
    this.generalWalletInfoSubscription = this.apiService.getGeneralInfo(walletInfo)
      .subscribe(
        response =>  {
          let generalWalletInfoResponse = response;
          this.lastBlockSyncedHeight = generalWalletInfoResponse.lastBlockSyncedHeight;
          this.chainTip = generalWalletInfoResponse.chainTip;
          this.isChainSynced = generalWalletInfoResponse.isChainSynced;
          this.connectedNodes = generalWalletInfoResponse.connectedNodes;

          const processedText = `Processed ${this.lastBlockSyncedHeight || '0'} out of ${this.chainTip} blocks.`;
          this.blockChainStatus = `Synchronizing.  ${processedText}`;

          if (this.connectedNodes == 1) {
              this.connectedNodesStatus = "1 connection";
          } else if (this.connectedNodes >= 0) {
              this.connectedNodesStatus = `${this.connectedNodes} connections`;
          }

          if(!this.isChainSynced) {
            this.percentSynced = "syncing...";
          }
          else {
            this.percentSyncedNumber = ((this.lastBlockSyncedHeight / this.chainTip) * 100);
            if (this.percentSyncedNumber.toFixed(0) === "100" && this.lastBlockSyncedHeight != this.chainTip) {
              this.percentSyncedNumber = 99;
            }

            this.percentSynced = this.percentSyncedNumber.toFixed(0) + '%';

            if (this.percentSynced === '100%') {
              this.blockChainStatus = `Up to date.  ${processedText}`;
            }
          }
        },
        error => {
          if (error.status === 0) {
            this.cancelSubscriptions();
          } else if (error.status >= 400) {
            if (!error.error.errors[0].message) {
              this.cancelSubscriptions();
              this.startSubscriptions();
            }
          }
        }
      )
    ;
  };
}
