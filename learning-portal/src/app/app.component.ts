import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { StepDetailComponent } from './components/step-detail/step-detail.component';
import { STAGES } from './data';
import { Task } from './models/step.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SidebarComponent, StepDetailComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <app-sidebar
        [stages]="stages"
        [activeTaskId]="activeTask()?.id ?? null"
        (taskSelected)="selectTask($event)" />
      <app-step-detail [task]="activeTask()" />
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      font-family: 'DM Sans', system-ui, sans-serif;
      background: #070b12;
    }
  `],
})
export class AppComponent {
  readonly stages = STAGES;
  readonly activeTask = signal<Task | null>(null);

  selectTask(task: Task): void {
    this.activeTask.set(task);
  }
}
