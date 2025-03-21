import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { AuthService } from '../../services/auth.service';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'app-login',
  imports: [CommonModule, 
    ReactiveFormsModule, 
    CalendarModule, 
    DropdownModule,
    HttpClientModule,
    ToastModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  providers:[AuthService, MessageService]
})
export class LoginComponent {
loginForm!: FormGroup;
registrationForm!: FormGroup;
  genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' }
  ];
  maxDate: Date = new Date();
  isLogin: boolean = true;
  isEmail = false;
  isOtpLogin = false;
  otpSent = false;

  constructor(private formBuilder: FormBuilder,
    private authService: AuthService, 
    private messageService: MessageService,
    private router: Router) {
    this.maxDate.setFullYear(this.maxDate.getFullYear()); // Set minimum age to 18
  }
  loadForm(){
    this.isLogin = !this.isLogin;
  }
  initializeLoginForm(){
    
  }
  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      mobileNumber: ['', [Validators.required, this.mobileNumberValidator.bind(this)]],
      password: ['', [Validators.required]],
      otp: [''],
      rememberMe: [false],
      loginWithOtp: [false]
    });
    this.loginForm.get('userInput')?.valueChanges.subscribe(value => {
      this.isEmail = value.includes('@');
      if (this.isEmail) {
        this.loginForm.patchValue({ loginWithOtp: false });
      }
    });
    this.loginForm.get('loginWithOtp')?.valueChanges.subscribe(value => {
      if (value) {
        this.isOtpLogin = true;
        this.loginForm.get('password')?.disable();
      } else {
        this.isOtpLogin = false;
        this.loginForm.get('password')?.enable();
      }
    });
    this.registrationForm = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      dob: [null, [Validators.required]],
      gender: [null, [Validators.required]],
      mobileNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      address: ['', [Validators.required]],
      terms: [false],
      isDoctor: [false]
    });
  }
  onLoginSubmit() {
    const mobileControl = this.loginForm.get('mobileNumber');
    var formData = this.loginForm.value;

    if (this.loginForm.valid) {
      if (this.isOtpLogin && !this.otpSent) {
        
        if (mobileControl?.value.includes('@')) {
          // Show error - Email can't use OTP
          return;
        }
        const mobileRegex = /^[6-9]\d{9}$/;
        if (!mobileRegex.test(mobileControl?.value)) {
          mobileControl?.setErrors({ invalidMobile: true });
          return;
        }
        this.authService.sendOTP(mobileControl?.value).subscribe((data: any) =>{
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'OTP Sent to mobile' });
          this.otpSent = true;
        })
      } 
      else if(this.isOtpLogin && this.otpSent){
        this.authService.verifyOTP(formData.mobileNumber, formData.otp).subscribe(data =>{
          this.authService.storeTokens(data.data);
          this.authService.setLoggedIn(true);
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Login Successfull' });
          this.router.navigate(['']);
        });
      }
      else {
        this.authService.loginWithPassword(formData.mobileNumber, formData.password).subscribe(data =>{
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Login Successfull' });
          this.authService.storeTokens(data.data);
          this.authService.setLoggedIn(true);
          this.router.navigate(['']);
        })
      }
    }
   }

  onSubmit() {
    if (this.registrationForm.valid) {
      var formData = this.registrationForm.value;
      this.authService.registerUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        mobileNumber: formData.mobileNumber,
        roleID: formData.isDoctor ? 'bce9f008-d447-4fe2-a29e-d58d579534f0' : '2ac7787b-77d1-465b-9bc0-eee50933697f'
      }).subscribe({
        next: (response) => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Registered Successfully' });
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          // const userId = response.userId;
          
          // this.authService.createUserProfile({
          //   userId,
          //   firstName: formData.firstName,
          //   lastName: formData.lastName,
          //   dob: formData.dob,
          //   gender: formData.gender,
          //   address: formData.address
          // }).subscribe({
          //   next: () => {
          //     console.log('Registration completed');
          //     // Handle success
          //   },
          //   error: (error) => console.error('Profile creation failed:', error)
          // });
        },
        error: (error) =>{
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'User registration failed!' });
          console.error('User registration failed:', error)
        } 
      });
      // Handle form submission
    } else {
      this.markFormGroupTouched(this.registrationForm);
    }
  }
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  private mobileNumberValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    
    if (value.includes('@')) return null; // Skip validation for email
    
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(value) ? null : { invalidMobile: true };
   }
}
