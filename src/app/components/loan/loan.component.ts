import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LocalStorageService } from '../../services/local-storage.service';

@Component({
  selector: 'app-loan',
  templateUrl: './loan.component.html',
  styleUrls: ['./loan.component.scss']
})
export class LoanComponent implements OnInit {
  loanForm: FormGroup;
  customers: any[] = [];
  loans: any[] = [];
  loanSchedules: any[] = [];
  // Predefined loan types
  loanTypes: string[] = ['Personal Loan', 'Auto Loan', 'Mortgage Loan', 'Business Loan', 'Education Loan'];

  constructor(private fb: FormBuilder, private storageService: LocalStorageService) {
    this.loanForm = this.fb.group({
      customerId: ['', Validators.required],
      loanType: ['', Validators.required],
      loanAmount: ['', [Validators.required, Validators.min(1)]],
      interestRate: ['', [Validators.required, Validators.min(0)]],
      duration: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit() {
    this.customers = this.storageService.getItem('customers') || [];
    this.loans = this.storageService.getItem('loans') || [];
    this.loanSchedules = this.storageService.getItem('loanSchedules') || [];
  }

  // Helper method to get customer details by email (customerId)
  getCustomerByEmail(email: string) {
    return this.customers.find(c => c.email === email);
  }

  onSubmit() {
    if (this.loanForm.invalid) {
      return;
    }
    // Create a new loan with a unique ID (using Date.now() for simplicity)
    const loan = { ...this.loanForm.value, id: Date.now() };
    this.loans.push(loan);
    this.storageService.setItem('loans', this.loans);

    // Auto-generate the repayment schedule for this loan
    const schedule = this.generateRepaymentSchedule(loan);
    this.loanSchedules.push({ loanId: loan.id, schedule });
    this.storageService.setItem('loanSchedules', this.loanSchedules);

    // Reset the form for further entries
    this.loanForm.reset();
  }

  generateRepaymentSchedule(loan: any) {
    const monthlyRate = loan.interestRate / 1200; // Convert annual percentage rate to monthly decimal
    const duration = loan.duration;
    const installment = loan.loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -duration));
    let schedule = [];
    let currentDate = new Date();
    for (let i = 1; i <= duration; i++) {
      const dueDate = new Date(currentDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      schedule.push({
        installmentNumber: i,
        dueDate,
        amount: parseFloat(installment.toFixed(2)), // Round to 2 decimals
        status: 'Pending'
      });
    }
    return schedule;
  }
}
