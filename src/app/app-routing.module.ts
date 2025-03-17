import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomersComponent } from './components/customers/customers.component';
import { LoanComponent } from './components/loan/loan.component';
import { LoanScheduleComponent } from './components/loan-schedule/loan-schedule.component';
import { PaymentComponent } from './components/payment/payment.component';

const routes: Routes = [
  { path: '', redirectTo: '/customers', pathMatch: 'full' },
  { path: 'customers', component: CustomersComponent },
  { path: 'loans', component: LoanComponent },
  { path: 'loan-schedule', component: LoanScheduleComponent },
  { path: 'payments', component: PaymentComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
