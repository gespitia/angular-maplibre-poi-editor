import { Component } from '@angular/core';
import { AppComponent } from './components/app/app.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppComponent],
  template: '<app-app></app-app>',
})
export class App {}
