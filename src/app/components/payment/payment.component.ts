import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LocalStorageService } from '../../services/local-storage.service';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  paymentForm: FormGroup;
  loans: any[] = [];
  customers: any[] = [];
  payments: any[] = [];

  constructor(
    private fb: FormBuilder,
    private storageService: LocalStorageService,
    private paymentService: PaymentService
  ) {
    this.paymentForm = this.fb.group({
      loanId: ['', Validators.required],
      installmentNumber: ['', Validators.required],
      amountPaid: ['', [Validators.required, Validators.min(1)]],
      paymentDate: [new Date().toISOString().substring(0, 10), Validators.required]
    });
  }

  ngOnInit() {
    this.loans = this.storageService.getItem('loans') || [];
    this.customers = this.storageService.getItem('customers') || [];
    this.payments = this.storageService.getItem('payments') || [];
  }

  // Helper method to retrieve customer details for a given loan.
  getCustomerByLoan(loanId: number): any {
    const loan = this.loans.find(l => l.id === loanId);
    if (loan) {
      return this.customers.find(c => c.email === loan.customerId);
    }
    return null;
  }

  onSubmit() {
    if (this.paymentForm.invalid) {
      return;
    }
    const payment = { ...this.paymentForm.value, id: Date.now() };
    this.payments.push(payment);
    this.storageService.setItem('payments', this.payments);

    // Update the corresponding loan schedule to mark the installment as "Paid"
    let loanSchedules = this.storageService.getItem('loanSchedules') || [];
    let scheduleRecord = loanSchedules.find((ls: any) => ls.loanId == payment.loanId);
    if (scheduleRecord) {
      let installment = scheduleRecord.schedule.find((inst: any) => inst.installmentNumber == payment.installmentNumber);
      if (installment) {
        installment.status = 'Paid';
      }
      this.storageService.setItem('loanSchedules', loanSchedules);
    }

    // Notify other components that a payment was made
    this.paymentService.paymentMade();

    this.paymentForm.reset();
    // Reset payment date after form reset
    this.paymentForm.patchValue({ paymentDate: new Date().toISOString().substring(0, 10) });
  }
}
