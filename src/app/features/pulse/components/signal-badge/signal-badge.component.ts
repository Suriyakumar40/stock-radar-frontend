import { Component, input } from '@angular/core';
import { SignalType } from '../../models/signal.model';

@Component({
    selector: 'app-signal-badge',
    standalone: true,
    template: `
        @switch (type()) {
            @case ('ENTRY') {
                <span class="badge bg-success"><i class="bi bi-arrow-up-circle-fill me-1"></i>ENTRY</span>
            }
            @case ('WATCH') {
                <span class="badge bg-warning text-dark"><i class="bi bi-eye-fill me-1"></i>WATCH</span>
            }
            @case ('EXIT') {
                <span class="badge bg-danger"><i class="bi bi-arrow-down-circle-fill me-1"></i>EXIT</span>
            }
        }
        @if (isNew()) {
            <i class="bi bi-stars text-primary ms-1" title="New in the last 2 days"></i>
        }
    `
})
export class SignalBadgeComponent {
    type = input.required<SignalType>();
    isNew = input<boolean>(false);
}
