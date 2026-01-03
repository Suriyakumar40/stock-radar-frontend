import { Component, computed, HostListener, inject, signal, TemplateRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { FooterComponent } from './core/layout/footer/footer.component';
import { SidebarComponent } from './core/layout/sidebar/sidebar.component';
import { HeaderComponent } from './core/layout/header/header.component';
import { FundamentalService } from './features/fundamental/services/fundamental.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, HeaderComponent, SidebarComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  // State
  currentView = signal<'indices' | 'industry' | 'rating'>('indices');
  selectedFilterType = signal<string | null>(null);
  selectedFilterValue = signal<string | null>(null);
  detailRatingFilter = signal<string>('ALL');

  // Search State
  searchQuery = signal<string>('');

  // Layout State
  // Default to false for mobile convenience if rendered on small screen initially, 
  // but logic below handles proper checking.
  sidebarOpen = signal<boolean>(false);
  isMobile = signal<boolean>(false);

  today = new Date();

  private stockService = inject(FundamentalService);

  constructor() { }

  ngOnInit() {
  }

  @HostListener('window:keydown.escape', [])
  onEscapeKey() {
    // Close sidebar when ESC is pressed
    if (this.sidebarOpen()) {
      this.closeSidebar();
    }
  }

  // --- ACTIONS ---

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar() {
    // Close sidebar (used by overlay click and ESC key)
    this.sidebarOpen.set(false);
  }
}
