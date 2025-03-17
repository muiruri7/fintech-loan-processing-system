import { Component, OnInit, OnDestroy } from '@angular/core';
import { LocalStorageService } from '../../services/local-storage.service';
import { PaymentService } from '../../services/payment.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loan-schedule',
  templateUrl: './loan-schedule.component.html',
  styleUrls: ['./loan-schedule.component.scss']
})
export class LoanScheduleComponent implements OnInit, OnDestroy {
  loanSchedules: any[] = [];
  customers: any[] = [];
  loans: any[] = [];
  selectedLoanSchedule: any = null;
  selectedCustomer: any = null;
  selectedLoan: any = null;
  subscription!: Subscription;

  constructor(
    private storageService: LocalStorageService,
    private paymentService: PaymentService
  ) {}

  ngOnInit() {
    this.loadData();
    // Subscribe to payment events to refresh data
    this.subscription = this.paymentService.paymentMade$.subscribe(() => {
      this.loadData();
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadData() {
    this.loanSchedules = this.storageService.getItem('loanSchedules') || [];
    this.customers = this.storageService.getItem('customers') || [];
    this.loans = this.storageService.getItem('loans') || [];
    // Clear any selected schedule
    this.selectedLoanSchedule = null;
    this.selectedCustomer = null;
    this.selectedLoan = null;
  }

  // Helper: given a loan, return its associated customer.
  getCustomerByLoan(loan: any) {
    return this.customers.find(c => c.email === loan.customerId);
  }

  // Called when "View Schedule" is clicked for a given loan.
  viewSchedule(loan: any) {
    const scheduleRecord = this.loanSchedules.find(ls => ls.loanId === loan.id);
    if (scheduleRecord) {
      this.selectedLoan = loan;
      this.selectedLoanSchedule = scheduleRecord.schedule;
      this.selectedCustomer = this.getCustomerByLoan(loan);
    }
  }
}
