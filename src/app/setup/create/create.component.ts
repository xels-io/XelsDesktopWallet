import { Component, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';

import { GlobalService } from '@shared/services/global.service';
import { ApiService } from '@shared/services/api.service';
import { ModalService } from '@shared/services/modal.service';

import { PasswordValidationDirective } from '@shared/directives/password-validation.directive';

import { WalletCreation } from '@shared/models/wallet-creation';

@Component({
  selector: 'create-component',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css'],
})

export class CreateComponent implements OnInit {
  constructor(private globalService: GlobalService, private apiService: ApiService, private genericModalService: ModalService, private router: Router, private fb: FormBuilder) {
    this.buildCreateForm();
  }

  public createWalletForm: FormGroup;
  public sidechainEnabled: boolean;
  private newWallet: WalletCreation;
  private mnemonic: string;

  ngOnInit() {
    this.getNewMnemonic();
    this.sidechainEnabled = this.globalService.getSidechainEnabled();
  }

  private buildCreateForm(): void {
    this.createWalletForm = this.fb.group({
      "walletName": ["",
        Validators.compose([
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(24),
          Validators.pattern(/^[a-zA-Z0-9]*$/)
        ])
      ],
      "walletPassphrase" : [""],
      "walletPassword": ["",
      Validators.compose([
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!#$%&'()*+,-./:;<=>?@[\]^_`{|}~])[A-Za-z\d!#$%&'()*+,-./:;<=>?@[\]^_`{|}~]{8,}$/),
        Validators.minLength(8)
        ])
      ],
      "walletPasswordConfirmation": ["", Validators.required],
      "selectNetwork": ["test", Validators.required]
    }, {
      validator: PasswordValidationDirective.MatchPassword
    });

    this.createWalletForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

    this.onValueChanged();
  }

  onValueChanged(data?: any) {
    if (!this.createWalletForm) { return; }
    const form = this.createWalletForm;
    for (const field in this.formErrors) {
      this.formErrors[field] = '';
      const control = form.get(field);
      if (control && control.dirty && !control.valid) {
        const messages = this.validationMessages[field];
        for (const key in control.errors) {
          this.formErrors[field] += messages[key] + ' ';
        }
      }
    }
  }

  formErrors = {
    'walletName': '',
    'walletPassphrase': '',
    'walletPassword': '',
    'walletPasswordConfirmation': ''
  };

  validationMessages = {
    'walletName': {
      'required': 'A wallet name is required.',
      'minlength': 'A wallet name must be at least one character long.',
      'maxlength': 'A wallet name cannot be more than 24 characters long.',
      'pattern': 'Please enter a valid wallet name. [a-Z] and [0-9] are the only characters allowed.'
    },
    'walletPassword': {
      'required': 'A password is required.',
      'pattern': 'A password must contain at least one uppercase letter, one lowercase letter, one number and one special character.',
      'minlength': 'A password must be at least 8 characters long.',
    },
    'walletPasswordConfirmation': {
      'required': 'Confirm your password.',
      'walletPasswordConfirmation': 'Passwords do not match.'
    }
  };

  public onBackClicked() {
    this.router.navigate(["/setup"]);
  }

  public onContinueClicked() {
    if (this.mnemonic) {
      this.newWallet = new WalletCreation(
        this.createWalletForm.get("walletName").value,
        this.mnemonic,
        this.createWalletForm.get("walletPassword").value,
        this.createWalletForm.get("walletPassphrase").value,
      );
      this.router.navigate(['/setup/create/show-mnemonic'], { queryParams : { name: this.newWallet.name, mnemonic: this.newWallet.mnemonic, password: this.newWallet.password, passphrase: this.newWallet.passphrase }});
    }
  }

  private getNewMnemonic() {
    this.apiService.getNewMnemonic()
      .subscribe(
        response => {
          this.mnemonic = response;
        }
      );
  }
}
