import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoinNotationPipe } from './pipes/coin-notation.pipe';
import { AutoFocusDirective } from './directives/auto-focus.directive';
import { PasswordValidationDirective } from './directives/password-validation.directive';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxElectronModule } from 'ngx-electron';
import { NgxQRCodeModule } from 'ngx-qrcode2';
import { NgxPaginationModule } from 'ngx-pagination';
import { ClipboardModule } from 'ngx-clipboard';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { GenericModalComponent } from './components/generic-modal/generic-modal.component';
import { HeaderComponent } from './../header/header.component';

const Common_Modules =
[
  CommonModule,
  ReactiveFormsModule,
  FormsModule,
  NgbModule,
  NgxElectronModule,
  NgxQRCodeModule,
  NgxPaginationModule,
  ClipboardModule,
];
const COM_ARRAY =
    [
      GenericModalComponent,
      HeaderComponent,
    ];
@NgModule({
  imports: [ CommonModule ],
  declarations: [ CoinNotationPipe, AutoFocusDirective, PasswordValidationDirective, COM_ARRAY],
  // tslint:disable-next-line:max-line-length
  exports: [Common_Modules, CoinNotationPipe, AutoFocusDirective, PasswordValidationDirective, COM_ARRAY  ],
  entryComponents: [ GenericModalComponent ]
})

export class SharedModule { }
