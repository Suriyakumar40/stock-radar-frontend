import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
    imports: [CommonModule, FormsModule],
})
export class SidebarComponent {

    @Input() isOpen = false;

    public selectedMenu = signal<string>('');

    constructor() { }

    ngOnInit() {
        this.selectedMenu.set(window.location.pathname.replace('/', ''));
    }
}