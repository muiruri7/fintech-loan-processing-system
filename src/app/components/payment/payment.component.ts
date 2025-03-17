import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LocalStorageService } from '../../services/local-storage.service';
import { PaymentService } from '../../services/payment.service';
import { Router } from '@angular/router';

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
    private paymentService: PaymentService,
    private router: Router
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

  // Helper: get customer info for a loan
  getCustomerByLoan(loanId: number): any {
    const loan = this.loans.find(l => l.id === loanId);
    if (loan) {
      return this.customers.find(c => c.email === loan.customerId);
    }
    return null;
  }

  // Process payment: apply amount to installments (partial/full) and navigate afterwards.
  onSubmit() {
    if (this.paymentForm.invalid) { return; }
    const payment = { ...this.paymentForm.value, id: Date.now() };
    let amountToApply = Number(payment.amountPaid);
    const loanId = payment.loanId;
    const startInstallment = Number(payment.installmentNumber);

    // Retrieve loan schedule record for this loan.
    let loanSchedules = this.storageService.getItem('loanSchedules') || [];
    let scheduleRecord = loanSchedules.find((ls: any) => ls.loanId == loanId);
    if (scheduleRecord) {
      // Iterate over installments from the specified installment number.
      for (let installment of scheduleRecord.schedule) {
        if (installment.installmentNumber < startInstallment) {
          continue;
        }
        if (installment.status === 'Paid') {
          continue;
        }
        let requiredAmount = installment.amount;
        if (amountToApply >= requiredAmount) {
          installment.status = 'Paid';
          amountToApply -= requiredAmount;
          // Set the installment amount to the original value (optional)
        } else if (amountToApply > 0) {
          // Partial payment: reduce required amount by the payment and mark as Partial.
          installment.amount = parseFloat((requiredAmount - amountToApply).toFixed(2));
          installment.status = 'Partial';
          amountToApply = 0;
          break;
        }
        if (amountToApply <= 0) {
          break;
        }
      }
      this.storageService.setItem('loanSchedules', loanSchedules);
    }

    // Save the payment record.
    this.payments.push(payment);
    this.storageService.setItem('payments', this.payments);

    // Notify others that a payment was made.
    this.paymentService.paymentMade();

    // Reset the form.
    this.paymentForm.reset();
    this.paymentForm.patchValue({ paymentDate: new Date().toISOString().substring(0, 10) });

    // Navigate to the Loan Coordinator page.
    this.router.navigate(['/loan-coordinator']);
  }
}
