import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LocalStorageService } from '../../services/local-storage.service';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  paymentForm: FormGroup;
  loans: any[] = [];
  loanSchedules: any[] = [];
  payments: any[] = [];

  constructor(private fb: FormBuilder, private storageService: LocalStorageService) {
    this.paymentForm = this.fb.group({
      loanId: ['', Validators.required],
      installmentNumber: ['', Validators.required],
      amountPaid: ['', [Validators.required, Validators.min(1)]],
      paymentDate: [new Date().toISOString().substring(0,10), Validators.required]
    });
  }

  ngOnInit() {
    this.loans = this.storageService.getItem('loans') || [];
    this.loanSchedules = this.storageService.getItem('loanSchedules') || [];
    this.payments = this.storageService.getItem('payments') || [];
  }

  onSubmit() {
    const payment = { ...this.paymentForm.value, id: Date.now() };
    this.payments.push(payment);
    this.storageService.setItem('payments', this.payments);

    // Update the corresponding loan schedule
    let scheduleRecord = this.loanSchedules.find(ls => ls.loanId == payment.loanId);
    if (scheduleRecord) {
      let installment = scheduleRecord.schedule.find((inst: any) => inst.installmentNumber == payment.installmentNumber);
      if (installment) {
        installment.status = 'Paid';
      }
      this.storageService.setItem('loanSchedules', this.loanSchedules);
    }

    this.paymentForm.reset();
  }
}
