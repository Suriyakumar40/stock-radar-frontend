import { Component, signal, TemplateRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { DataTable, ColumnConfig } from '@suriya_40/sketch/data-table';

export interface Employee {
  id: number;
  name: string;
  url: string;
  email: string;
  department: string;
  salary: number;
  active: boolean;
  joinDate: string;
  location: string;
}

export interface PatientDetail {
  salutation?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  contactNumber?: number;
  gender?: string;
  dob?: Date;
  relationship?: string;
  patientType?: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, DataTable],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  @ViewChild('actionTemplate', { static: true }) actionTemplate!: TemplateRef<any>;

  protected readonly title = signal('poc-emr');
  public submitted: boolean = false;
  protected salutationMaster = [
    { id: 'Mrs.', name: 'Mrs.' },
    { id: 'Ms.', name: 'Ms.' },
    { id: 'Mx.', name: 'Mx.' },
    { id: 'Dr.', name: 'Dr.' },
    { id: 'Mst.', name: 'Mst.' },
  ];
  patientDetail: PatientDetail = {};
  data: Array<any> = [];
  columns: Array<ColumnConfig> = [];


  constructor() {
    this.columns = this.generateColumnConfig();
    this.data = this.generateSampleData();
  }

  ngOnInit(): void {
    this.columns = this.columns.map(col => {
      if (col.key === 'actions') {
        col.template = this.actionTemplate;
      }
      return col;
    });
  }

  edit(row: any): void {
  }

  delete(row: any): void {
  }

  private generateSampleData(): Employee[] {
    const departments = ['Marketing', 'Design', 'Operations', 'Legal', 'IT', 'HR', 'Finance', 'Customer Service', 'Engineering'];
    const locations = ['Memphis', 'Oklahoma City', 'Miami', 'Boston', 'Charlotte', 'Indianapolis', 'Milwaukee', 'Baltimore', 'El Paso', 'Omaha', 'Las Vegas', 'Chicago'];
    const firstNames = ['Jason', 'Andrea', 'Helen', 'Ashley', 'Larry', 'Michael', 'Edward', 'Rachel', 'Heather', 'Stephen', 'Janet', 'Rachel'];
    const lastNames = ['Ramirez', 'Nguyen', 'White', 'Phillips', 'Brown', 'Green', 'Rogers', 'Reyes', 'Richardson', 'Allen', 'Ortiz', 'Perez', 'Garcia'];

    const data: Employee[] = [];
    for (let i = 1; i <= 100000; i++) {
      data.push({
        id: i,
        url: `https://example.com/employee/${i}`,
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        email: `employee${i}@company.com`,
        department: departments[Math.floor(Math.random() * departments.length)],
        salary: Math.floor(Math.random() * 100000) + 40000,
        active: Math.random() > 0.1,
        joinDate: this.randomDate(new Date(2020, 0, 1), new Date()).toISOString().split('T')[0],
        location: locations[Math.floor(Math.random() * locations.length)]
      });
    }
    return data;
  }

  private generateColumnConfig(): Array<ColumnConfig> {
    return [
      { key: 'name', label: 'Name', columnClass: 'name', type: 'text', sortable: true, filterable: true },
      { key: 'email', label: 'Email', type: 'text', sortable: true, filterable: true },
      { key: 'department', label: 'Department', type: 'text', sortable: true, filterable: true },
      {
        key: 'salary', label: 'Salary', type: 'currency', symbol: true, sortable: true, filterable: true,
        highlightColumn: {
          type: 'badge',
          getClassFn: (value) => {
            if (value > 100000) return 'badge badge-light-success';
            if (value >= 50000 && value <= 100000) return 'badge badge-light-warning';
            return 'badge badge-light-danger';
          }
        }
      },
      {
        key: 'active', label: 'Active', type: 'boolean', sortable: true, filterable: true,
        displayDataFn(value, row) {
          return value ? 'True' : 'False';
        },
      },
      { key: 'joinDate', label: 'Join Date', type: 'date', format: 'dd-MMM-yyyy', sortable: true, filterable: true },
      { key: 'location', label: 'Location', type: 'text', sortable: true, filterable: true },
      { key: 'actions', label: 'Actions', type: 'text' }
    ];
  }

  private randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }


  onCancel(): void {
    // Handle cancel action
  }

  onSubmit(form: NgForm): void {
    this.submitted = true;
    if (form.valid) {
      // Handle form submission
    }
  }
}
