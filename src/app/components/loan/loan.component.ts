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

  onSubmit() {
    const loan = { ...this.loanForm.value, id: Date.now() };
    this.loans.push(loan);
    this.storageService.setItem('loans', this.loans);

    // Auto-generate repayment schedule
    const schedule = this.generateRepaymentSchedule(loan);
    this.loanSchedules.push({ loanId: loan.id, schedule });
    this.storageService.setItem('loanSchedules', this.loanSchedules);

    this.loanForm.reset();
  }

  generateRepaymentSchedule(loan: any) {
    const monthlyRate = loan.interestRate / 1200;
    const duration = loan.duration;
    const installment = loan.loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -duration));
    let schedule = [];
    let currentDate = new Date();

    for (let i = 1; i <= duration; i++) {
      currentDate.setMonth(currentDate.getMonth() + 1);
      schedule.push({
        installmentNumber: i,
        dueDate: new Date(currentDate),
        amount: installment,
        status: 'Pending'
      });
    }
    return schedule;
  }
}
