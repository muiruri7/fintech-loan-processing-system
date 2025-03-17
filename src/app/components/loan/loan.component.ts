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
  loanTypes: string[] = ['Personal Loan', 'Auto Loan', 'Mortgage Loan', 'Business Loan', 'Education Loan'];
  isEditingLoan: boolean = false;
  editingLoanId: number | null = null;

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

  // Helper to find a customer by their email (customerId)
  getCustomerByEmail(email: string) {
    return this.customers.find(c => c.email === email);
  }

  // Calculate remaining amount from the loan's schedule (summing unpaid installments)
  getRemainingAmount(loan: any): number {
    const scheduleRecord = this.loanSchedules.find((ls: any) => ls.loanId === loan.id);
    if (scheduleRecord) {
      return scheduleRecord.schedule.reduce((total: number, inst: any) => {
        if (inst.status !== 'Paid') {
          return total + inst.amount;
        }
        return total;
      }, 0);
    }
    return loan.loanAmount;
  }

  // Determine loan status based on its schedule: "Loan Cleared" if all installments are paid; otherwise, "Loan Pending"
  getLoanStatus(loan: any): string {
    const scheduleRecord = this.loanSchedules.find((ls: any) => ls.loanId === loan.id);
    if (scheduleRecord) {
      const allPaid = scheduleRecord.schedule.every((inst: any) => inst.status === 'Paid');
      return allPaid ? 'Loan Cleared' : 'Loan Pending';
    }
    return 'Loan Pending';
  }

  onSubmit() {
    if (this.loanForm.invalid) { return; }
    const formValue = this.loanForm.value;
    if (this.isEditingLoan && this.editingLoanId !== null) {
      // Update existing loan
      const loanIndex = this.loans.findIndex(l => l.id === this.editingLoanId);
      if (loanIndex !== -1) {
        const updatedLoan = { ...formValue, id: this.editingLoanId };
        this.loans[loanIndex] = updatedLoan;
        this.storageService.setItem('loans', this.loans);

        // Update the corresponding loan schedule (for simplicity, re-generate schedule)
        const scheduleIndex = this.loanSchedules.findIndex((ls: any) => ls.loanId === this.editingLoanId);
        if (scheduleIndex !== -1) {
          const newSchedule = this.generateRepaymentSchedule(updatedLoan);
          this.loanSchedules[scheduleIndex].schedule = newSchedule;
          this.storageService.setItem('loanSchedules', this.loanSchedules);
        }
      }
      this.isEditingLoan = false;
      this.editingLoanId = null;
    } else {
      // Add new loan
      const newLoan = { ...formValue, id: Date.now() };
      this.loans.push(newLoan);
      this.storageService.setItem('loans', this.loans);

      const schedule = this.generateRepaymentSchedule(newLoan);
      this.loanSchedules.push({ loanId: newLoan.id, schedule });
      this.storageService.setItem('loanSchedules', this.loanSchedules);
    }
    this.loanForm.reset();
  }

  // Generate repayment schedule using the annuity formula
  generateRepaymentSchedule(loan: any) {
    const schedule = [];
    // Calculate total payable using simple interest:
    // total = principal + (principal * interestRate / 100)
    const total = loan.loanAmount + (loan.loanAmount * loan.interestRate / 100);
    
    // Calculate equal installment amount, rounded to 2 decimals.
    const installmentAmount = parseFloat((total / loan.duration).toFixed(2));
    
    let dueDate = new Date();
    for (let i = 1; i <= loan.duration; i++) {
      // Increment the month for each installment.
      dueDate.setMonth(dueDate.getMonth() + 1);
      schedule.push({
        id: new Date().getTime() + i, // Generate a unique ID for each installment.
        loanId: loan.id,
        installmentNumber: i,
        dueDate: dueDate.toISOString().split('T')[0], // Format date as YYYY-MM-DD.
        amount: installmentAmount,
        status: 'Pending'
      });
    }
    return schedule;
  }

  // Populate the form with the loan's current data for editing
  updateLoan(loan: any) {
    this.loanForm.patchValue(loan);
    this.isEditingLoan = true;
    this.editingLoanId = loan.id;
  }

  // Delete a loan and its associated schedule from LocalStorage
  deleteLoan(loan: any) {
    this.loans = this.loans.filter(l => l.id !== loan.id);
    this.storageService.setItem('loans', this.loans);

    this.loanSchedules = this.loanSchedules.filter((ls: any) => ls.loanId !== loan.id);
    this.storageService.setItem('loanSchedules', this.loanSchedules);
  }
}
