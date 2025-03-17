import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../../services/local-storage.service';

@Component({
  selector: 'app-loan-schedule',
  templateUrl: './loan-schedule.component.html',
  styleUrls: ['./loan-schedule.component.scss']
})
export class LoanScheduleComponent implements OnInit {
  loanSchedules: any[] = [];
  selectedLoanSchedule: any = null;

  constructor(private storageService: LocalStorageService) { }

  ngOnInit() {
    this.loanSchedules = this.storageService.getItem('loanSchedules') || [];
  }

  onSelectLoan(schedule: any) {
    this.selectedLoanSchedule = schedule;
  }
}
