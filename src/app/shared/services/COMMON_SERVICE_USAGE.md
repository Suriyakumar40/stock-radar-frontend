# CommonService Usage Guide

## Overview
The `CommonService` is a shared, application-wide singleton service that manages common state and functionality across all components and services in the application.

## Key Features

### 1. Layout Management
- Sidebar state (open/closed)
- Mobile detection
- Screen size management

### 2. User & Authentication
- Current user state
- Authentication status
- User session management

### 3. Theme Management
- Light/dark theme toggle
- Persistent theme storage
- DOM theme application

### 4. Notifications
- Global notification system
- Auto-dismissal
- Multiple notification types

### 5. Global State
- Search functionality
- Quarter/Year selection
- Loading states

### 6. Utility Functions
- Currency formatting
- Percentage formatting
- Number formatting
- Local storage helpers

## How to Use

### 1. Import and Inject
```typescript
import { Component, inject } from '@angular/core';
import { CommonService } from '../../shared/services/common.service';

@Component({...})
export class YourComponent {
  private commonService = inject(CommonService);
}
```

### 2. Access State (Read-only)
```typescript
// Layout state
get sidebarOpen() { return this.commonService.sidebarOpen; }
get isMobile() { return this.commonService.isMobile; }
get loading() { return this.commonService.loading; }

// User state
get currentUser() { return this.commonService.currentUser; }
get isAuthenticated() { return this.commonService.isAuthenticated; }

// Search and filters
get globalSearch() { return this.commonService.globalSearch; }
get selectedQuarter() { return this.commonService.selectedQuarter; }
get selectedYear() { return this.commonService.selectedYear; }

// Computed values
get hasNotifications() { return this.commonService.hasNotifications; }
get isDesktop() { return this.commonService.isDesktop; }
```

### 3. Perform Actions
```typescript
// Layout actions
toggleSidebar() {
  this.commonService.toggleSidebar();
}

closeSidebar() {
  this.commonService.closeSidebar();
}

// Theme actions
toggleTheme() {
  this.commonService.toggleTheme();
}

// Search actions
onSearchChange(query: string) {
  this.commonService.setGlobalSearch(query);
}

// User actions
loginUser(userData: any) {
  this.commonService.setCurrentUser(userData);
}

logout() {
  this.commonService.logout();
}
```

### 4. Show Notifications
```typescript
showSuccess() {
  this.commonService.showSuccessMessage('Operation completed successfully!');
}

showError() {
  this.commonService.showErrorMessage('An error occurred!');
}

showCustomNotification() {
  this.commonService.addNotification({
    message: 'Custom notification',
    type: 'info',
    duration: 5000
  });
}
```

### 5. Use Utility Functions
```typescript
formatPrice(price: number) {
  return this.commonService.formatCurrency(price, 'INR');
}

formatGrowth(value: number) {
  return this.commonService.formatPercentage(value, 2);
}

saveUserPreference(preference: any) {
  this.commonService.setStorageItem('userPreference', preference);
}
```

### 6. In Templates
```html
<!-- Access state in templates -->
<div *ngIf="commonService.loading()">Loading...</div>
<div *ngIf="commonService.isAuthenticated()">Welcome, {{ commonService.currentUser()?.name }}</div>

<!-- Use with computed values -->
<div class="sidebar" [class.open]="commonService.sidebarOpen()">
  <!-- sidebar content -->
</div>

<!-- Show notifications -->
<div *ngFor="let notification of commonService.notifications()">
  {{ notification.message }}
</div>
```

## Component Examples

### Header Component
```typescript
@Component({...})
export class HeaderComponent {
  private commonService = inject(CommonService);

  get searchQuery() { return this.commonService.globalSearch; }
  get selectedQuarter() { return this.commonService.selectedQuarter; }

  toggleSidebar() {
    this.commonService.toggleSidebar();
  }

  onSearchChange(query: string) {
    this.commonService.setGlobalSearch(query);
  }
}
```

### Dashboard Component
```typescript
@Component({...})
export class DashboardComponent {
  private commonService = inject(CommonService);

  get isLoading() { return this.commonService.loading; }
  get currentQuarter() { return this.commonService.selectedQuarter; }

  loadData() {
    this.commonService.setLoading(true);
    // API call here
    this.commonService.setLoading(false);
    this.commonService.showSuccessMessage('Data loaded successfully!');
  }
}
```

### Service Integration
```typescript
@Injectable()
export class YourService {
  private commonService = inject(CommonService);

  processData() {
    this.commonService.setLoading(true);
    
    try {
      // Process data
      this.commonService.showSuccessMessage('Data processed!');
    } catch (error) {
      this.commonService.showErrorMessage('Processing failed!');
    } finally {
      this.commonService.setLoading(false);
    }
  }
}
```

## Benefits

1. **Centralized State**: All common state in one place
2. **Type Safety**: Full TypeScript support with signals
3. **Reactive**: Automatic UI updates when state changes
4. **Consistent**: Same API across all components
5. **Extensible**: Easy to add new functionality
6. **Performant**: Singleton pattern ensures single instance
7. **Testable**: Easy to mock and test

## Migration from App Component

Instead of managing state in app.ts, components now use:

```typescript
// Before (in app.ts)
sidebarOpen = signal<boolean>(false);
toggleSidebar() {
  this.sidebarOpen.update(v => !v);
}

// After (using CommonService)
get sidebarOpen() { return this.commonService.sidebarOpen; }
toggleSidebar() {
  this.commonService.toggleSidebar();
}
```

This service is automatically available across your entire application without any additional setup, thanks to the `providedIn: 'root'` configuration.
