import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private paymentMadeSource = new Subject<void>();
  paymentMade$ = this.paymentMadeSource.asObservable();

  // Call this method when a payment is made.
  paymentMade() {
    this.paymentMadeSource.next();
  }
}
