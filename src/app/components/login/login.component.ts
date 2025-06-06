import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  registrationForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  
  genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' }
  ];
  
  maxDate: Date = new Date();
  isLogin: boolean = true;
  isEmail = false;
  isOtpLogin = false;
  otpSent = false;
  showPassword = false;
  isLoading = false;
  
  // Forgot Password related properties
  isForgotPassword = false;
  forgotPasswordStep: 'mobile' | 'otp' | 'reset' = 'mobile';
  forgotPasswordOtpSent = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(private formBuilder: FormBuilder,
    private authService: AuthService, 
    private messageService: MessageService,
    private router: Router) {
    this.maxDate.setFullYear(this.maxDate.getFullYear()); // Set minimum age to 18
  }

  loadForm(){
    // this.isLogin = !this.isLogin;
  }

  initializeLoginForm(){
    
  }

  ngOnInit() {
    const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?`~]).{6,}$/;
    const NAME_REGEX = /^[a-zA-Z\s]+$/;
    const MOBILE_REGEX = /^[6-9]\d{9}$/;

    this.loginForm = this.formBuilder.group({
  mobileNumber: ['', [Validators.required, this.mobileNumberValidator.bind(this)]],
  password: ['', [Validators.required, Validators.pattern(PASSWORD_REGEX)]],
  otp: [''],
  rememberMe: [false],
  loginWithOtp: [false]
});

    this.loginForm.get('userInput')?.valueChanges.subscribe(value => {
      this.isEmail = value?.includes('@');
      if (this.isEmail) {
        this.loginForm.patchValue({ loginWithOtp: false });
      }
    });
    
    this.loginForm.get('loginWithOtp')?.valueChanges.subscribe(value => {
  const passwordControl = this.loginForm.get('password');
  
  if (value) {
    this.isOtpLogin = true;
    passwordControl?.clearValidators();
    passwordControl?.updateValueAndValidity();
  } else {
    this.isOtpLogin = false;
    passwordControl?.setValidators([Validators.required, Validators.pattern(PASSWORD_REGEX)]);
    passwordControl?.updateValueAndValidity();
  }
});

    this.registrationForm = this.formBuilder.group({
      firstName: ['', [
        Validators.required, 
        Validators.minLength(2), 
        Validators.maxLength(50),
        Validators.pattern(NAME_REGEX)
      ]],
      lastName: ['', [
        Validators.required, 
        Validators.minLength(2), 
        Validators.maxLength(50),
        Validators.pattern(NAME_REGEX)
      ]],
      dob: [null, [Validators.required, this.dateValidator.bind(this)]],
      gender: [null, [Validators.required]],
      mobileNumber: ['', [
        Validators.required, 
        Validators.pattern(MOBILE_REGEX),
        Validators.minLength(10),
        Validators.maxLength(10)
      ]],
      email: ['', [
        Validators.required, 
        Validators.email,
        Validators.maxLength(100)
      ]],
      password: ['', [
        Validators.required, 
        Validators.minLength(6),
        Validators.maxLength(128),
        Validators.pattern(PASSWORD_REGEX)
      ]],
      address: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500)
      ]],
      terms: [false, [Validators.requiredTrue]],
      isDoctor: [false]
    });

    // Initialize Forgot Password Form
    this.forgotPasswordForm = this.formBuilder.group({
      mobileNumber: ['', [Validators.required, this.mobileNumberValidator.bind(this)]],
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/), Validators.minLength(6), Validators.maxLength(6)]],
      newPassword: ['', [Validators.required, Validators.pattern(PASSWORD_REGEX), Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator.bind(this)
    });
  }

  // Password match validator for forgot password form
  passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  // Date validator for registration form
  dateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    
    // Check if date is in future
    if (selectedDate > today) {
      return { futureDate: true };
    }
    
    // Check if user is at least 18 years old
    if (selectedDate > eighteenYearsAgo) {
      return { minimumAge: true };
    }
    
    // Check if date is valid
    if (isNaN(selectedDate.getTime())) {
      return { invalidDate: true };
    }
    
    return null;
  }

  // Mobile number validator
  private mobileNumberValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    
    if (value.includes('@')) return null; // Skip validation for email
    
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(value) ? null : { invalidMobile: true };
  }

  // Helper methods to check validation states
  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  hasFieldError(formGroup: FormGroup, fieldName: string, errorType: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }

  hasFormError(formGroup: FormGroup, errorType: string): boolean {
    return !!(formGroup.hasError(errorType) && (formGroup.dirty || formGroup.touched));
  }

  onLoginSubmit(resendOTP: boolean = false) {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const mobileControl = this.loginForm.get('mobileNumber');
      var formData = this.loginForm.value;

      if (this.isOtpLogin && (!this.otpSent || resendOTP)) {
        
        if (mobileControl?.value.includes('@')) {
          this.isLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Email cannot be used for OTP login' });
          return;
        }
        const mobileRegex = /^[6-9]\d{9}$/;
        if (!mobileRegex.test(mobileControl?.value)) {
          mobileControl?.setErrors({ invalidMobile: true });
          mobileControl?.markAsTouched();
          this.isLoading = false;
          return;
        }
        this.authService.sendOTP(mobileControl?.value).subscribe({
          next: (data: any) => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'OTP Sent to mobile' });
            this.otpSent = true;
            this.isLoading = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.message || 'Failed to send OTP' });
            this.isLoading = false;
          }
        });
      } 
      else if(this.isOtpLogin && this.otpSent){
        this.authService.verifyOTP(formData.mobileNumber, formData.otp).subscribe({
          next: (data) => {
            this.authService.storeTokens(data.data);
            this.authService.setLoggedIn(true);
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Login Successful' });
            this.router.navigate(['']);
            this.isLoading = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.message || 'Invalid OTP' });
            this.isLoading = false;
          }
        });
      }
      else {
        this.authService.loginWithPassword(formData.mobileNumber, formData.password).subscribe({
          next: (data) => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Login Successful' });
            this.authService.storeTokens(data.data);
            this.authService.setLoggedIn(true);
            this.router.navigate(['']);
            this.isLoading = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.message || 'Login failed' });
            this.isLoading = false;
          }
        });
      }
    } else {
      this.markFormGroupTouched(this.loginForm);
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
        },
        error: (error) =>{
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'User registration failed!' });
          console.error('User registration failed:', error)
        } 
      });
    } else {
      this.markFormGroupTouched(this.registrationForm);
    }
  }

  // Forgot Password Methods
  onForgotPasswordClick() {
    this.isForgotPassword = true;
    this.forgotPasswordStep = 'mobile';
    this.forgotPasswordOtpSent = false;
    this.forgotPasswordForm.reset();
  }

  onForgotPasswordSubmit() {
    if (this.forgotPasswordStep === 'mobile') {
      this.sendForgotPasswordOTP();
    } else if (this.forgotPasswordStep === 'otp') {
      this.verifyForgotPasswordOTP();
    } else if (this.forgotPasswordStep === 'reset') {
      this.resetPassword();
    }
  }

  sendForgotPasswordOTP(resend: boolean = false) {
    const mobileNumber = this.forgotPasswordForm.get('mobileNumber')?.value;
    
    if (!mobileNumber) {
      this.forgotPasswordForm.get('mobileNumber')?.markAsTouched();
      return;
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobileNumber)) {
      this.forgotPasswordForm.get('mobileNumber')?.setErrors({ invalidMobile: true });
      this.forgotPasswordForm.get('mobileNumber')?.markAsTouched();
      return;
    }

    this.isLoading = true;

    this.authService.sendForgotPasswordOTP(mobileNumber).subscribe({
      next: (response: any) => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Success', 
          detail: resend ? 'OTP resent successfully' : 'OTP sent to your mobile number' 
        });
        this.forgotPasswordStep = 'otp';
        this.forgotPasswordOtpSent = true;
        this.isLoading = false;
      },
      error: (error) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: error.error?.message || 'Failed to send OTP' 
        });
        this.isLoading = false;
      }
    });
  }

  verifyForgotPasswordOTP() {
    const mobileNumber = this.forgotPasswordForm.get('mobileNumber')?.value;
    const otp = this.forgotPasswordForm.get('otp')?.value;

    if (!otp) {
      this.forgotPasswordForm.get('otp')?.markAsTouched();
      return;
    }

    this.isLoading = true;

    this.authService.verifyForgotPasswordOTP(mobileNumber, otp).subscribe({
      next: (response: any) => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Success', 
          detail: 'OTP verified successfully' 
        });
        this.forgotPasswordStep = 'reset';
        this.isLoading = false;
      },
      error: (error) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: error.error?.message || 'Invalid OTP' 
        });
        this.isLoading = false;
      }
    });
  }

  resetPassword() {
    if (!this.forgotPasswordForm.valid) {
      this.markFormGroupTouched(this.forgotPasswordForm);
      return;
    }

    const formData = this.forgotPasswordForm.value;
    this.isLoading = true;

    this.authService.resetPassword(formData.mobileNumber, formData.newPassword, formData.confirmPassword).subscribe({
      next: (response: any) => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Success', 
          detail: 'Password reset successfully' 
        });
        this.backToLogin();
        this.isLoading = false;
      },
      error: (error) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: error.error?.message || 'Failed to reset password' 
        });
        this.isLoading = false;
      }
    });
  }

  resendForgotPasswordOTP() {
    this.sendForgotPasswordOTP(true);
  }

  backToLogin() {
    this.isForgotPassword = false;
    this.forgotPasswordStep = 'mobile';
    this.forgotPasswordOtpSent = false;
    this.forgotPasswordForm.reset();
  }

  getForgotPasswordButtonText(): string {
    switch (this.forgotPasswordStep) {
      case 'mobile':
        return 'Send OTP';
      case 'otp':
        return 'Verify OTP';
      case 'reset':
        return 'Reset Password';
      default:
        return 'Submit';
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

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleNewPasswordVisibility() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}