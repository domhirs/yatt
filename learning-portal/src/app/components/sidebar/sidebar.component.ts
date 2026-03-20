import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Stage, Story, Task } from '../../models/step.model';
import { ProgressService } from '../../services/progress.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="sidebar">
      <div class="sidebar-header">
        <span class="logo">yatt</span>
        <span class="logo-sub">learning guide</span>
      </div>

      <div class="stages">
        @for (stage of stages; track stage.id) {
          <div class="stage">
            <div class="stage-title">{{ stage.title }}</div>

            @for (story of stage.stories; track story.id) {
              <div class="story">
                <button
                  class="story-toggle"
                  [class.open]="isExpanded(story.id)"
                  (click)="toggleStory(story.id)">
                  <span class="story-id">{{ story.id }}</span>
                  <span class="story-label">{{ storyShortTitle(story) }}</span>
                  <span class="story-count">
                    {{ doneCount(story) }}/{{ story.tasks.length }}
                  </span>
                  <span class="chevron">{{ isExpanded(story.id) ? '▾' : '▸' }}</span>
                </button>

                @if (isExpanded(story.id)) {
                  <ul class="task-list">
                    @for (task of story.tasks; track task.id) {
                      <li
                        class="task-item"
                        [class.active]="activeTaskId === task.id"
                        [class.done]="progressService.isComplete(task.id, task.checklist.length)"
                        (click)="selectTask(task)">
                        <span class="task-check">
                          {{ progressService.isComplete(task.id, task.checklist.length) ? '✓' : '○' }}
                        </span>
                        <span class="task-title">{{ task.title }}</span>
                      </li>
                    }
                  </ul>
                }
              </div>
            }
          </div>
        }
      </div>
    </nav>
  `,
  styles: [`
    .sidebar {
      width: 300px;
      min-width: 300px;
      height: 100vh;
      overflow-y: auto;
      background: #090e1a;
      color: #64748b;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #111d33;
    }

    .sidebar-header {
      padding: 26px 20px 20px;
      border-bottom: 1px solid #111d33;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .logo {
      font-family: 'JetBrains Mono', monospace;
      font-size: 18px;
      font-weight: 600;
      color: #22d3ee;
      letter-spacing: 4px;
      text-transform: uppercase;
      display: inline-flex;
      align-items: baseline;

      &::after {
        content: '_';
        animation: blink 1.2s step-end infinite;
        color: #22d3ee;
        margin-left: 1px;
      }
    }

    .logo-sub {
      font-size: 11px;
      color: #2d4a6a;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 500;
    }

    .stages {
      flex: 1;
      padding: 10px 0;
    }

    .stage-title {
      padding: 16px 20px 5px;
      font-size: 10px;
      font-weight: 600;
      color: #3a5a78;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    .story-toggle {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 20px;
      background: none;
      border: none;
      color: #5a7a98;
      cursor: pointer;
      font-size: 13px;
      text-align: left;
      transition: background 0.18s, color 0.18s;
      font-family: 'DM Sans', sans-serif;
      font-weight: 500;

      &:hover {
        background: rgba(34, 211, 238, 0.03);
        color: #7a96b0;
      }

      &.open {
        color: #22d3ee;
        background: rgba(34, 211, 238, 0.04);
      }
    }

    .story-id {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #3a5a78;
      min-width: 50px;
    }

    .story-toggle.open .story-id {
      color: rgba(34, 211, 238, 0.55);
    }

    .story-label {
      flex: 1;
    }

    .story-count {
      font-size: 11px;
      color: #4a7090;
      font-family: 'JetBrains Mono', monospace;
      background: #0c1526;
      border: 1px solid #1e3550;
      padding: 1px 7px;
      border-radius: 99px;
    }

    .story-toggle.open .story-count {
      color: rgba(34, 211, 238, 0.75);
      border-color: rgba(34, 211, 238, 0.2);
    }

    .chevron {
      font-size: 11px;
      color: #3a5a78;
    }

    .story-toggle.open .chevron {
      color: rgba(34, 211, 238, 0.7);
    }

    .task-list {
      list-style: none;
      margin: 0;
      padding: 2px 0 4px;
    }

    .task-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 6px 20px 6px 30px;
      cursor: pointer;
      font-size: 13px;
      line-height: 1.45;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
      border-left: 2px solid transparent;
      color: #4a6a88;
      font-family: 'DM Sans', sans-serif;

      &:hover {
        background: rgba(255, 255, 255, 0.02);
        color: #6a8aaa;
      }

      &.active {
        background: rgba(34, 211, 238, 0.05);
        border-left-color: #22d3ee;
        color: #67e8f9;
      }
    }

    .task-check {
      font-size: 11px;
      min-width: 14px;
      padding-top: 2px;
      color: #2a4060;
      font-family: 'JetBrains Mono', monospace;
      transition: color 0.15s;
    }

    .task-item.done .task-check {
      color: #22863a;
    }

    .task-item.done .task-title {
      color: #2a4060;
    }

    .task-item.active .task-check {
      color: rgba(34, 211, 238, 0.5);
    }

    .task-title {
      flex: 1;
    }
  `],
})
export class SidebarComponent {
  @Input() stages: Stage[] = [];
  @Input() activeTaskId: string | null = null;
  @Output() taskSelected = new EventEmitter<Task>();

  private readonly expandedStories = signal<Set<string>>(new Set());

  constructor(readonly progressService: ProgressService) {}

  toggleStory(storyId: string): void {
    this.expandedStories.update(set => {
      const next = new Set(set);
      if (next.has(storyId)) {
        next.delete(storyId);
      } else {
        next.add(storyId);
      }
      return next;
    });
  }

  isExpanded(storyId: string): boolean {
    return this.expandedStories().has(storyId);
  }

  selectTask(task: Task): void {
    this.taskSelected.emit(task);
  }

  storyShortTitle(story: Story): string {
    // Strip "S1-001 — " prefix from the title for a cleaner label
    return story.title.replace(/^S\d+-\d+\s*[—-]+\s*/, '');
  }

  doneCount(story: Story): number {
    // Reading progressService.progressData() makes this reactive
    void this.progressService.progressData();
    return story.tasks.filter(t =>
      this.progressService.isComplete(t.id, t.checklist.length)
    ).length;
  }
}
