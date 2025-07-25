import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SfcFormComponent } from './components/sfc-form/sfc-form.component';

const routes: Routes = [
  { path: '', component: SfcFormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SfcRoutingModule { }
