import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoinNotationPipe } from './pipes/coin-notation.pipe';
import { NumberToStringPipe } from './pipes/number-to-string.pipe';
import { AutoFocusDirective } from './directives/auto-focus.directive';
import { PasswordValidationDirective } from './directives/password-validation.directive';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxElectronModule } from 'ngx-electron';
import { NgxQRCodeModule } from 'ngx-qrcode2';
import { NgxPaginationModule } from 'ngx-pagination';
import { ClipboardModule } from 'ngx-clipboard';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { GenericModalComponent } from './components/generic-modal/generic-modal.component';
import { HeaderComponent } from '../header/header.component';
import { HEADER_OFFSET } from '@angular/core/src/render3/interfaces/view';
// import { ChartsModule } from 'ng2-charts';
@NgModule({
  imports: [ 
    CommonModule
  ],
  declarations: [
    CoinNotationPipe,
    NumberToStringPipe,
    AutoFocusDirective,
    PasswordValidationDirective,
    GenericModalComponent,
    HeaderComponent
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
    NgxElectronModule,
    NgxQRCodeModule,
    NgxPaginationModule,
    ClipboardModule,
    GenericModalComponent,
    CoinNotationPipe,
    NumberToStringPipe,
    AutoFocusDirective,
    PasswordValidationDirective,
    HeaderComponent
  ],
  entryComponents: [ GenericModalComponent ]
})

export class SharedModule { }
