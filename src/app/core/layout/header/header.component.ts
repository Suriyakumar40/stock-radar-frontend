import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-header',
    standalone: true,
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    imports: [CommonModule, FormsModule],
})
export class HeaderComponent {

    @Input() searchQuery: any;
    @Output() toggleSidebar = new EventEmitter<void>();

    constructor() { }

    ngOnInit() {
    }


}