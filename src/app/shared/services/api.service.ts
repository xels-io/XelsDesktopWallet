import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, interval, throwError } from 'rxjs';
import { catchError, switchMap, startWith} from 'rxjs/operators';

import { GlobalService } from './global.service';
import { ModalService } from './modal.service';

import { AddressLabel } from '../models/address-label';
import { WalletCreation } from '../models/wallet-creation';
import { WalletRecovery } from '../models/wallet-recovery';
import { WalletLoad } from '../models/wallet-load';
import { WalletInfo } from '../models/wallet-info';
import { SidechainFeeEstimation } from '../models/sidechain-fee-estimation';
import { FeeEstimation } from '../models/fee-estimation';
import { TransactionBuilding } from '../models/transaction-building';
import { TransactionSending } from '../models/transaction-sending';
import { NodeStatus } from '../models/node-status';
import { WalletRescan } from '../models/wallet-rescan';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient, private globalService: GlobalService, private modalService: ModalService, private router: Router) {
    this.setApiUrl();
  };

  private pollingInterval = interval(5000);
  private apiPort;
  private xelsApiUrl;
  private daemonIP;

  setApiUrl() {
    this.apiPort = this.globalService.getApiPort();
    this.daemonIP = this.globalService.getDaemonIP();
    this.xelsApiUrl = 'http://' + this.daemonIP + ':' + this.apiPort + '/api';
  }

  getNodeStatus(silent?: boolean): Observable<NodeStatus> {
    return this.http.get<NodeStatus>(this.xelsApiUrl + '/node/status').pipe(
      catchError(err => this.handleHttpError(err, silent))
    );
  }

  getNodeStatusInterval(silent?: boolean): Observable<NodeStatus> {
    return this.pollingInterval.pipe(
      startWith(0),
      switchMap(() => this.http.get<NodeStatus>(this.xelsApiUrl + '/node/status')),
      catchError(err => this.handleHttpError(err, silent))
    )
  }

  getAddressBookAddresses(): Observable<any> {
    return this.pollingInterval.pipe(
      startWith(0),
      switchMap(() => this.http.get(this.xelsApiUrl + '/AddressBook')),
      catchError(err => this.handleHttpError(err))
    )
  }

  addAddressBookAddress(data: AddressLabel): Observable<any> {
    return this.http.post(this.xelsApiUrl + '/AddressBook/address', JSON.stringify(data)).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  removeAddressBookAddress(label: string): Observable<any> {
    let params = new HttpParams().set('label', label);
    return this.http.delete(this.xelsApiUrl + '/AddressBook/address', { params }).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /**
   * Gets available wallets at the default path
   */
  getWalletFiles(): Observable<any> {
    return this.http.get(this.xelsApiUrl + '/wallet/list-wallets').pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /** Gets the extended public key from a certain wallet */
  getExtPubkey(data: WalletInfo): Observable<any> {
    let params = new HttpParams()
      .set('walletName', data.walletName)
      .set('accountName', 'account 0');

    return this.http.get(this.xelsApiUrl + '/wallet/extpubkey', { params }).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

    /**
    * Get a new mnemonic
    */
  getNewMnemonic(): Observable<any> {
    let params = new HttpParams()
      .set('language', 'English')
      .set('wordCount', '12');

    return this.http.get(this.xelsApiUrl + '/wallet/mnemonic', { params }).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /**
   * Create a new Xels wallet.
   */
  createXelsWallet(data: WalletCreation): Observable<any> {
    return this.http.post(this.xelsApiUrl + '/wallet/create/', JSON.stringify(data)).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /**
   * Recover a Xels wallet.
   */
  recoverXelsWallet(data: WalletRecovery): Observable<any> {
    return this.http.post(this.xelsApiUrl + '/wallet/recover/', JSON.stringify(data)).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /**
   * Load a Xels wallet
   */
  loadXelsWallet(data: WalletLoad): Observable<any> {
    return this.http.post(this.xelsApiUrl + '/wallet/load/', JSON.stringify(data)).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /**
   * Get wallet status info from the API.
   */
  getWalletStatus(): Observable<any> {
    return this.http.get(this.xelsApiUrl + '/wallet/status').pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /**
   * Get general wallet info from the API once.
   */
  getGeneralInfoOnce(data: WalletInfo): Observable<any> {
    let params = new HttpParams().set('Name', data.walletName);
    return this.http.get(this.xelsApiUrl + '/wallet/general-info', { params }).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /**
   * Get general wallet info from the API.
   */
  getGeneralInfo(data: WalletInfo): Observable<any> {
    let params = new HttpParams().set('Name', data.walletName);
    return this.pollingInterval.pipe(
      startWith(0),
      switchMap(() => this.http.get(this.xelsApiUrl + '/wallet/general-info', { params })),
      catchError(err => this.handleHttpError(err))
    )
  }

  /**
   * Get wallet balance info from the API.
   */
  getWalletBalance(data: WalletInfo): Observable<any> {
    let params = new HttpParams()
      .set('walletName', data.walletName)
      .set('accountName', "account 0");
    return this.pollingInterval.pipe(
      startWith(0),
      switchMap(() => this.http.get(this.xelsApiUrl + '/wallet/balance', { params })),
      catchError(err => this.handleHttpError(err))
    )
  }

  /**
   * Get the maximum sendable amount for a given fee from the API
   */
  getMaximumBalance(data): Observable<any> {
    let params = new HttpParams()
      .set('walletName', data.walletName)
      .set('accountName', "account 0")
      .set('feeType', data.feeType)
      .set('allowUnconfirmed', "true");
    return this.http.get(this.xelsApiUrl + '/wallet/maxbalance', { params }).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /**
   * Get a wallets transaction history info from the API.
   */
  getWalletHistory(data: WalletInfo): Observable<any> {
    let params = new HttpParams()
      .set('walletName', data.walletName)
      .set('accountName', "account 0");
    return this.pollingInterval.pipe(
      startWith(0),
      switchMap(() => this.http.get(this.xelsApiUrl + '/wallet/history', { params: params })),
      catchError(err => this.handleHttpError(err))
    )
  }

  /**
   * Get an unused receive address for a certain wallet from the API.
   */
  getUnusedReceiveAddress(data: WalletInfo): Observable<any> {
    let params = new HttpParams()
      .set('walletName', data.walletName)
      .set('accountName', "account 0");
    return this.http.get(this.xelsApiUrl + '/wallet/unusedaddress', { params }).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /**
   * Get multiple unused receive addresses for a certain wallet from the API.
   */
  getUnusedReceiveAddresses(data: WalletInfo, count: string): Observable<any> {
    let params = new HttpParams()
      .set('walletName', data.walletName)
      .set('accountName', "account 0")
      .set('count', count);
    return this.http.get(this.xelsApiUrl + '/wallet/unusedaddresses', { params }).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /**
   * Get get all addresses for an account of a wallet from the API.
   */
  getAllAddresses(data: WalletInfo): Observable<any> {
    let params = new HttpParams()
      .set('walletName', data.walletName)
      .set('accountName', "account 0");
    return this.http.get(this.xelsApiUrl + '/wallet/addresses', { params }).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

    /**
   * Estimate the fee of a transaction
   */
  estimateFee(data: FeeEstimation): Observable<any> {
    let params = new HttpParams()
      .set('walletName', data.walletName)
      .set('accountName', data.accountName)
      .set('recipients[0].destinationAddress', data.recipients[0].destinationAddress)
      .set('recipients[0].amount', data.recipients[0].amount)
      .set('opReturnData', null)
      .set('opReturnAmount', data.recipients[0].amount)
      .set('feeType', data.feeType)
      .set('allowUnconfirmed', "true");
    // return this.http.get(this.xelsApiUrl + '/wallet/estimate-txfee', { params }).pipe(
    //   catchError(err => this.handleHttpError(err))
    // );

    return this.http.post(this.xelsApiUrl + '/wallet/estimate-txfee', {
      'walletName': data.walletName,
      'accountName': data.accountName,
      'recipients': [
        {
          'destinationAddress': data.recipients[0].destinationAddress,
          'amount': data.recipients[0].amount
        }
      ],
      'feeType': data.feeType,
      'allowUnconfirmed': true
     }).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /**
   * Estimate the fee of a sidechain transaction
   */
  estimateSidechainFee(data: SidechainFeeEstimation): Observable<any> {
    return this.http.post(this.xelsApiUrl + '/wallet/estimate-txfee', {
      'walletName': data.walletName,
      'accountName': data.accountName,
      'recipients': [
        {
          'destinationAddress': data.recipients[0].destinationAddress,
          'amount': data.recipients[0].amount
        }
      ],
      'feeType': data.feeType,
      'allowUnconfirmed': true
     }).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /**
   * Build a transaction
   */
  buildTransaction(data: TransactionBuilding): Observable<any> {
    return this.http.post(this.xelsApiUrl + '/wallet/build-transaction', JSON.stringify(data)).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /**
   * Send transaction
   */
  sendTransaction(data: TransactionSending): Observable<any> {
    return this.http.post(this.xelsApiUrl + '/wallet/send-transaction', JSON.stringify(data)).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /** Remove transaction */
  removeTransaction(walletName: string): Observable<any> {
    let params = new HttpParams()
      .set('walletName', walletName)
      .set('all', 'true')
      .set('resync', 'true');
    return this.http.delete(this.xelsApiUrl + '/wallet/remove-transactions', { params }).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /** Rescan wallet from a certain date using remove-transactions */
  rescanWallet(data: WalletRescan): Observable<any> {
    let params = new HttpParams()
      .set('walletName', data.name)
      .set('fromDate', data.fromDate.toDateString())
      .set('reSync', 'true');
    return this.http.delete(this.xelsApiUrl + '/wallet/remove-transactions/', { params }).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }


  startPowMining(data: any): Observable<any> {
    return this.http.post(this.xelsApiUrl + '/mining/startmining', JSON.stringify(data)).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }
  stopPowMining(): Observable<any> {
    return this.http.post(this.xelsApiUrl + '/mining/stopmining', null).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }
  /**
   * Start staking
   */
  startStaking(data: any): Observable<any> {
    return this.http.post(this.xelsApiUrl + '/staking/startstaking', JSON.stringify(data)).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /**
   * Get staking info
   */
  getStakingInfo(): Observable<any> {
    return this.pollingInterval.pipe(
      startWith(0),
      switchMap(() => this.http.get(this.xelsApiUrl + '/staking/getstakinginfo')),
      catchError(err => this.handleHttpError(err))
    )
  }

  /**
    * Stop staking
    */
  stopStaking(): Observable<any> {
    return this.http.post(this.xelsApiUrl + '/staking/stopstaking', 'true').pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /**
   * Send shutdown signal to the daemon
   */
  shutdownNode(): Observable<any> {
    return this.http.post(this.xelsApiUrl + '/node/shutdown', 'corsProtection:true').pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /*
    * Get the active smart contract wallet address.
    */
  getAccountAddress(walletName: string): Observable<any> {
    let params = new HttpParams().set('walletName', walletName);
    return this.http.get(this.xelsApiUrl + '/smartcontractwallet/account-address', { params }).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  getAccountAddresses(walletName: string): any {
    let params = new HttpParams().set('walletName', walletName);
    return this.http.get(this.xelsApiUrl + '/smartcontractwallet/account-addresses', { params }).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /*
    * Get the balance of the active smart contract address.
    */
  getAccountBalance(walletName: string): Observable<any> {
    let params = new HttpParams().set('walletName', walletName);
    return this.http.get(this.xelsApiUrl + '/smartcontractwallet/account-balance', { params }).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /*
    * Get the balance of the active smart contract address.
    */
  getAddressBalance(address: string): Observable<any> {
    let params = new HttpParams().set('address', address);
    return this.pollingInterval.pipe(
      startWith(0),
      switchMap(() => this.http.get(this.xelsApiUrl + '/smartcontractwallet/address-balance', { params })),
      catchError(err => this.handleHttpError(err))
    )
  }

  /*
    * Gets the transaction history of the smart contract account.
    */
  getAccountHistory(walletName: string, address: string): Observable<any> {
    let params = new HttpParams()
      .set('walletName', walletName)
      .set('address', address);
    return this.pollingInterval.pipe(
      startWith(0),
      switchMap(() => this.http.get(this.xelsApiUrl + '/smartcontractwallet/history', { params })),
      catchError(err => this.handleHttpError(err))
    )
  }

  /*
    * Posts a contract creation transaction
    */
  postCreateTransaction(transaction: any): Observable<any> {
    return this.http.post(this.xelsApiUrl + '/smartcontractwallet/create', transaction).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /*
    * Posts a contract call transaction
    */
  postCallTransaction(transaction: any): Observable<any> {
    return this.http.post(this.xelsApiUrl + '/smartcontractwallet/call', transaction).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  /*
    * Returns the receipt for a particular txhash, or empty JSON.
    */
  getReceipt(hash: string): any {
    let params = new HttpParams().set('txHash', hash);
    return this.http.get(this.xelsApiUrl + '/smartcontracts/receipt', { params }).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  private handleHttpError(error: HttpErrorResponse, silent?: boolean) {
    console.log(error);
    if (error.status === 0) {
      if(!silent) {
        this.modalService.openModal(null, null);
        this.router.navigate(['app']);
      }
    } else if (error.status >= 400) {
      if (!error.error.errors[0].message) {
        console.log(error);
      }
      else {
        this.modalService.openModal(null, error.error.errors[0].message);
      }
    }
    return throwError(error);
  }
}
