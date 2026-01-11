import { Component, computed, HostListener, inject, signal, TemplateRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { SidebarComponent } from './core/layout/sidebar/sidebar.component';
import { HeaderComponent } from './core/layout/header/header.component';
import { FundamentalService } from './features/fundamental/services/fundamental.service';
import { CommonService } from './shared/services/common.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  // Inject servicesa
  private commonService = inject(CommonService);

  // Access common service state via getters
  get sidebarOpen() {
    const sidebarState = this.commonService.sidebarOpen;
    return sidebarState;
  }

  get searchQuery() { return this.commonService.globalSearch; }

  today = new Date();

  constructor() { }

  ngOnInit() {
    // Initialize common service
    this.commonService.checkScreenSize();
  }

  @HostListener('window:keydown.escape', [])
  onEscapeKey() {
    // Close sidebar when ESC is pressed
    if (this.commonService.sidebarOpen()) {
      this.commonService.closeSidebar();
    }
  }

  // --- ACTIONS ---

  toggleSidebar() {
    this.commonService.toggleSidebar();
  }

  closeSidebar() {
    this.commonService.closeSidebar();
  }
}

