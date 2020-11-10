import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { SharedModule } from '@shared/shared.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ApiInterceptor } from '@shared/http-interceptors/api-interceptor';
import { LoginComponent } from './login/login.component';
import { SetupModule } from './setup/setup.module';
import { WalletModule } from './wallet/wallet.module';
import { ExchangeComponent } from './exchange/exchange/exchange.component';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    SharedModule,
    SetupModule,
    WalletModule,
    AppRoutingModule
  ],
  declarations: [
    AppComponent,
    LoginComponent,
    ExchangeComponent
  ],
  providers: [ { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true} ],
  bootstrap: [ AppComponent ]
})

export class AppModule { }
