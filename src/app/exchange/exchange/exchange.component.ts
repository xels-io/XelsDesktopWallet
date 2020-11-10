import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators} from '@angular/forms';

@Component({
  selector: 'app-exchange',
  templateUrl: './exchange.component.html',
  styleUrls: ['./exchange.component.css']
})
export class ExchangeComponent implements OnInit {
  exchangeForm = new FormGroup({
    from: new FormControl('',[
      Validators.required
    ]),
    deposit_amount:new FormControl('',[
      Validators.required
    ])
  })
  constructor() { }

  ngOnInit() {
  }

  exchangeNow(){
    console.log(this.exchangeForm.value)
  }

}
