import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LocalStorageService } from '../../services/local-storage.service';
import { toBase64 } from '../../utils/file-utils';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit {
  customerForm: FormGroup;
  customers: any[] = [];
  isEditing = false;
  editIndex: number | null = null;

  constructor(
    private fb: FormBuilder,
    private storageService: LocalStorageService
  ) {
    this.customerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      dateOfRegistration: [new Date().toISOString().substring(0, 10), Validators.required],
      customerType: ['', Validators.required],
      profileImage: [null]
    });
  }

  ngOnInit() {
    this.customers = this.storageService.getItem('customers') || [];
  }

  // New method to handle file input
  onFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target && target.files && target.files.length > 0) {
      this.customerForm.patchValue({
        profileImage: target.files[0]
      });
    }
  }

  async onSubmit() {
    let newCustomer = this.customerForm.value;

    // Convert profile image file to Base64 if provided
    if (newCustomer.profileImage && newCustomer.profileImage instanceof File) {
      newCustomer.profileImage = await toBase64(newCustomer.profileImage);
    }

    if (this.isEditing && this.editIndex !== null) {
      // Update existing customer
      this.customers[this.editIndex] = newCustomer;
      this.isEditing = false;
      this.editIndex = null;
    } else {
      // Add new customer
      this.customers.push(newCustomer);
    }
    this.storageService.setItem('customers', this.customers);
    this.customerForm.reset();
    // Reset date after form reset
    this.customerForm.patchValue({ dateOfRegistration: new Date().toISOString().substring(0, 10) });
  }

  onEdit(index: number) {
    const customer = this.customers[index];
    this.customerForm.patchValue(customer);
    this.isEditing = true;
    this.editIndex = index;
  }

  onDelete(index: number) {
    this.customers.splice(index, 1);
    this.storageService.setItem('customers', this.customers);
  }
}
