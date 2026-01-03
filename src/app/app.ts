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
  sidebarOpen = signal<boolean>(true);
  isMobile = signal<boolean>(false);

  today = new Date();

  // Dropdown State
  quarters = ['Mar', 'Jun', 'Sep', 'Dec'];
  years = computed(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2022;
    const years = [];
    for (let y = startYear; y <= currentYear; y++) {
      years.push(y);
    }
    return years;
  });

  selectedQuarter = signal('Sep');
  selectedYear = signal(new Date().getFullYear());

  private stockService = inject(FundamentalService);

  constructor() { }

  ngOnInit() {
    this.checkScreenSize();
  }

  @HostListener('window:resize', [])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    // Standard Bootstrap Breakpoint for Large screens
    const isMobileCheck = window.innerWidth < 1024;
    this.isMobile.set(isMobileCheck);
    this.sidebarOpen.set(false);

    // // Auto-close on mobile, auto-open on desktop initial load if preferred, 
    // // or just let the toggle handle it. Here we enforce a smart default.
    // if (isMobileCheck) {
    //   this.sidebarOpen.set(false);
    // } else {
    //   this.sidebarOpen.set(true);
    // }
  }

  // --- ACTIONS ---

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar() {
    // Only used by overlay on mobile
    this.sidebarOpen.set(false);
  }
}
