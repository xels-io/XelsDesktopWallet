import { Injectable } from '@angular/core';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000'
});
api.defaults.headers.common['Authorization'] = 'xels-exchange-allowed-api';

@Injectable({
  providedIn: 'root'
})
export class ExchangeApiService {
  constructor() { }

  newOrder(data) {
    return api.post('/api/new-order',data)
  }
  getOrders(user_code){
    return api.post('/api/getOrders',{user_code});
  }
  getOrder(orderId){
    return api.get('/api/getOrder/'+orderId);
  }
}
