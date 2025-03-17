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
  availableInstallments: any[] = [];

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

    // When the selected loan changes, update the available installment options.
    this.paymentForm.get('loanId')?.valueChanges.subscribe(selectedLoanId => {
      this.updateAvailableInstallments(selectedLoanId);
    });
  }

  // Helper: Returns customer details for a given loan ID.
  getCustomerByLoan(loanId: number): any {
    const loan = this.loans.find(l => l.id === loanId);
    if (loan) {
      return this.customers.find(c => c.email === loan.customerId);
    }
    return null;
  }

  // Updates the available installments dropdown based on the selected loan.
  updateAvailableInstallments(selectedLoanId: number): void {
    const loanSchedules = this.storageService.getItem('loanSchedules') || [];
    const scheduleRecord = loanSchedules.find((ls: any) => ls.loanId == selectedLoanId);
    if (scheduleRecord) {
      // Only include installments that are not fully paid.
      this.availableInstallments = scheduleRecord.schedule.filter((inst: any) => inst.status !== 'Paid');
    } else {
      this.availableInstallments = [];
    }
    // Reset the installmentNumber form control when the loan selection changes.
    this.paymentForm.patchValue({ installmentNumber: '' });
  }

  onSubmit() {
    if (this.paymentForm.invalid) { return; }
    const payment = { ...this.paymentForm.value, id: Date.now() };
    let amountToApply = Number(payment.amountPaid);
    const loanId = payment.loanId;
    const startInstallment = Number(payment.installmentNumber);

    let loanSchedules = this.storageService.getItem('loanSchedules') || [];
    let scheduleRecord = loanSchedules.find((ls: any) => ls.loanId == loanId);
    if (scheduleRecord) {
      // Iterate over installments starting from the selected one.
      for (let installment of scheduleRecord.schedule) {
        if (installment.installmentNumber < startInstallment) { continue; }
        if (installment.status === 'Paid') { continue; }
        let requiredAmount = installment.amount;
        if (amountToApply >= requiredAmount) {
          installment.status = 'Paid';
          amountToApply -= requiredAmount;
        } else if (amountToApply > 0) {
          // Apply partial payment: reduce the remaining amount.
          installment.amount = parseFloat((requiredAmount - amountToApply).toFixed(2));
          installment.status = 'Partial';
          amountToApply = 0;
          break;
        }
        if (amountToApply <= 0) { break; }
      }
      this.storageService.setItem('loanSchedules', loanSchedules);
    }

    this.payments.push(payment);
    this.storageService.setItem('payments', this.payments);
    this.paymentService.paymentMade();

    this.paymentForm.reset();
    this.paymentForm.patchValue({ paymentDate: new Date().toISOString().substring(0, 10) });

    // Navigate to the Loan Coordinator page after successful payment.
    this.router.navigate(['/loan-coordinator']);
  }
}
