import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Routes } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarComponent } from './app/components/calendar/calendar.component';
import { PatientsSectionComponent } from './app/components/patients-section/patients-section.component';
import { routes } from './app.routes';
import { HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthGuard } from './app/auth/auth.guard';
import { AuthService } from './app/services/auth.service';
import { AuthInterceptor } from './app/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom([BrowserAnimationsModule, FullCalendarModule, HttpClientModule]),
    AuthGuard,
    AuthService,
    provideAnimations(),
    provideHttpClient(withInterceptors([AuthInterceptor])),
    provideRouter(routes)
  ]
};
