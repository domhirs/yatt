import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, Concept } from '../../models/step.model';
import { ProgressService } from '../../services/progress.service';
import { HighlightDirective } from '../../directives/highlight.directive';

@Component({
  selector: 'app-step-detail',
  standalone: true,
  imports: [CommonModule, HighlightDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!task) {
      <div class="welcome">
        <div class="welcome-inner">
          <div class="welcome-icon">&gt;_</div>
          <h1>yatt learning guide</h1>
          <p>Pick a task from the sidebar to get started.</p>
          <p class="welcome-hint">
            Each task contains a description, a checklist, Java code examples,
            and links to the official docs.
          </p>
        </div>
      </div>
    } @else {
      <div class="content">

        <!-- Header -->
        <header class="task-header">
          <span class="task-id">{{ task.id }}</span>
          <h1 class="task-title">{{ task.title }}</h1>
          <div class="header-rule"></div>
        </header>

        <!-- Description -->
        <section class="section">
          <p class="description">{{ task.description }}</p>
        </section>

        <!-- Key Concepts -->
        @if (task.concepts && task.concepts.length > 0) {
          <section class="section">
            <h2 class="section-title">Key Concepts</h2>
            <div class="concepts-grid">
              @for (concept of task.concepts; track concept.term) {
                <div class="concept-card">
                  <span class="concept-term">{{ concept.term }}</span>
                  <p class="concept-body">{{ concept.explanation }}</p>
                </div>
              }
            </div>
          </section>
        }

        <!-- Checklist -->
        @if (task.checklist.length > 0) {
          <section class="section">
            <h2 class="section-title">Checklist</h2>
            <ul class="checklist">
              @for (item of task.checklist; track $index) {
                <li
                  class="checklist-item"
                  [class.checked]="isChecked($index)"
                  (click)="toggle($index)">
                  <span class="checkbox" [class.checked-box]="isChecked($index)"></span>
                  <span class="item-text">{{ item }}</span>
                </li>
              }
            </ul>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="progressPercent()"></div>
            </div>
            <div class="progress-label">
              {{ progressService.completedCount(task.id, task.checklist.length) }}
              / {{ task.checklist.length }} done
            </div>
          </section>
        }

        <!-- Code Examples -->
        @if (task.examples.length > 0) {
          <section class="section">
            <h2 class="section-title">Code Examples</h2>
            @for (example of task.examples; track $index) {
              <div class="code-block">
                <div class="code-header">
                  <span class="window-dots">
                    <i class="dot dot-red"></i>
                    <i class="dot dot-yellow"></i>
                    <i class="dot dot-green"></i>
                  </span>
                  <span class="code-lang">{{ example.lang }}</span>
                  <span class="code-label">{{ example.label }}</span>
                </div>
                <pre class="code-pre"><code
                  [appHighlight]="example.lang">{{ example.code }}</code></pre>
              </div>
            }
          </section>
        }

        <!-- Further Reading -->
        @if (task.links.length > 0) {
          <section class="section">
            <h2 class="section-title">Further Reading</h2>
            <ul class="link-list">
              @for (link of task.links; track link.url) {
                <li>
                  <a [href]="link.url" target="_blank" rel="noopener noreferrer">
                    <span class="link-arrow">↗</span>
                    {{ link.label }}
                  </a>
                </li>
              }
            </ul>
          </section>
        }

      </div>
    }
  `,
  styles: [`
    :host {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* ── Welcome screen ─────────────────────────────── */
    .welcome {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #070b12;
    }

    .welcome-inner {
      text-align: center;
      max-width: 440px;
      padding: 52px 48px;
      background: #0c1220;
      border-radius: 16px;
      border: 1px solid #1a2d4a;
      box-shadow: 0 0 60px rgba(34, 211, 238, 0.04), 0 24px 64px rgba(0, 0, 0, 0.5);
      animation: fade-up 0.5s ease both;
    }

    .welcome-icon {
      font-family: 'JetBrains Mono', monospace;
      font-size: 36px;
      font-weight: 600;
      color: #22d3ee;
      margin-bottom: 24px;
      letter-spacing: -1px;
      animation: glow-pulse 2.5s ease-in-out infinite;
    }

    .welcome-inner h1 {
      font-family: 'Syne', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: #cbd5e1;
      margin: 0 0 14px;
      letter-spacing: -0.3px;
    }

    .welcome-inner p {
      color: #334155;
      margin: 0 0 8px;
      line-height: 1.7;
      font-size: 14px;
    }

    .welcome-hint {
      font-size: 12.5px;
      color: #243048;
    }

    /* ── Main content area ──────────────────────────── */
    .content {
      flex: 1;
      overflow-y: auto;
      padding: 56px 72px 80px;
      background: #070b12;
    }

    /* ── Task header ────────────────────────────────── */
    .task-header {
      margin-bottom: 48px;
    }

    .task-id {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 500;
      color: rgba(34, 211, 238, 0.7);
      background: rgba(34, 211, 238, 0.07);
      border: 1px solid rgba(34, 211, 238, 0.15);
      padding: 3px 10px;
      border-radius: 99px;
      margin-bottom: 20px;
      letter-spacing: 0.5px;
    }

    .task-title {
      font-family: 'Syne', sans-serif;
      font-size: 36px;
      font-weight: 700;
      color: #e2e8f0;
      margin: 0 0 28px;
      line-height: 1.15;
      letter-spacing: -0.5px;
    }

    .header-rule {
      height: 1px;
      background: linear-gradient(90deg, rgba(34, 211, 238, 0.25) 0%, transparent 60%);
    }

    /* ── Sections ───────────────────────────────────── */
    .section {
      background: #0c1220;
      border: 1px solid #142035;
      border-radius: 10px;
      padding: 32px;
      margin-bottom: 28px;
      transition: border-color 0.2s;

      &:hover {
        border-color: rgba(34, 211, 238, 0.12);
      }
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #5a7a98;
      margin: 0 0 24px;
      display: flex;
      align-items: center;
      gap: 8px;

      &::before {
        content: '';
        display: inline-block;
        width: 3px;
        height: 14px;
        background: #22d3ee;
        border-radius: 2px;
        opacity: 0.6;
      }
    }

    .description {
      color: #8892a4;
      line-height: 1.85;
      margin: 0;
      font-size: 16px;
      white-space: pre-line;
    }

    /* ── Key Concepts ───────────────────────────────── */
    .concepts-grid {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .concept-card {
      padding: 20px 24px;
      background: #090f1c;
      border: 1px solid #1a2d4a;
      border-left: 3px solid rgba(34, 211, 238, 0.4);
      border-radius: 6px;
    }

    .concept-term {
      display: block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 600;
      color: #22d3ee;
      margin-bottom: 10px;
      letter-spacing: 0.3px;
    }

    .concept-body {
      color: #6b7e96;
      line-height: 1.8;
      margin: 0;
      font-size: 15px;
      white-space: pre-line;
    }

    /* ── Checklist ──────────────────────────────────── */
    .checklist {
      list-style: none;
      margin: 0 0 28px;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .checklist-item {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 14px 18px;
      border-radius: 7px;
      cursor: pointer;
      border: 1px solid #142035;
      background: #0a1020;
      transition: background 0.15s, border-color 0.15s;
      font-size: 15px;

      &:hover {
        background: #0f1830;
        border-color: rgba(34, 211, 238, 0.2);
      }

      &.checked {
        background: rgba(74, 222, 128, 0.04);
        border-color: rgba(74, 222, 128, 0.15);

        .item-text {
          text-decoration: line-through;
          color: #2a4040;
        }
      }
    }

    .checkbox {
      width: 16px;
      height: 16px;
      min-width: 16px;
      margin-top: 1px;
      border-radius: 4px;
      border: 1.5px solid #1e3050;
      background: transparent;
      transition: all 0.15s;
      position: relative;

      &.checked-box {
        background: rgba(74, 222, 128, 0.15);
        border-color: #4ade80;

        &::after {
          content: '';
          position: absolute;
          left: 3px;
          top: 0px;
          width: 5px;
          height: 9px;
          border: 2px solid #4ade80;
          border-top: none;
          border-left: none;
          transform: rotate(45deg);
        }
      }
    }

    .item-text {
      flex: 1;
      line-height: 1.7;
      color: #7a8da8;
      transition: color 0.15s;
    }

    .progress-bar {
      height: 3px;
      background: #111d33;
      border-radius: 99px;
      margin-bottom: 8px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #22d3ee, #4ade80);
      border-radius: 99px;
      transition: width 0.4s ease;
      box-shadow: 0 0 8px rgba(34, 211, 238, 0.4);
    }

    .progress-label {
      font-size: 11.5px;
      color: #5a8090;
      font-family: 'JetBrains Mono', monospace;
    }

    /* ── Code blocks ────────────────────────────────── */
    .code-block {
      border: 1px solid #142035;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 20px;
      transition: border-color 0.2s;

      &:last-child {
        margin-bottom: 0;
      }

      &:hover {
        border-color: rgba(34, 211, 238, 0.12);
      }
    }

    .code-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 16px;
      background: #0b1525;
      border-bottom: 1px solid #142035;
    }

    .window-dots {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-right: 4px;
    }

    .dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      font-style: normal;
    }

    .dot-red    { background: #3d1a1a; }
    .dot-yellow { background: #3a2f10; }
    .dot-green  { background: #0e2e1a; }

    .code-lang {
      font-size: 10px;
      font-weight: 600;
      color: rgba(34, 211, 238, 0.6);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-family: 'JetBrains Mono', monospace;
      background: rgba(34, 211, 238, 0.07);
      border: 1px solid rgba(34, 211, 238, 0.12);
      padding: 2px 7px;
      border-radius: 4px;
    }

    .code-label {
      font-size: 13px;
      color: #2a3f5a;
      font-family: 'JetBrains Mono', monospace;
    }

    .code-pre {
      margin: 0;
      padding: 0;
      background: #060a12;

      code {
        display: block;
        padding: 24px 24px;
        font-size: 13.5px;
        font-family: 'JetBrains Mono', monospace;
        line-height: 1.7;
        overflow-x: auto;
      }
    }

    /* ── Links ──────────────────────────────────────── */
    .link-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;

      a {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 13px 18px;
        background: #0a1020;
        border: 1px solid #142035;
        border-radius: 7px;
        color: #3d6080;
        text-decoration: none;
        font-size: 15px;
        font-weight: 500;
        transition: background 0.15s, border-color 0.15s, color 0.15s;

        &:hover {
          background: #0f1830;
          border-color: rgba(34, 211, 238, 0.2);
          color: #67c8e0;
        }
      }
    }

    .link-arrow {
      font-size: 14px;
      color: rgba(34, 211, 238, 0.4);
      flex-shrink: 0;
    }
  `],
})
export class StepDetailComponent implements OnChanges {
  @Input() task: Task | null = null;

  constructor(
    readonly progressService: ProgressService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(): void {
    // Re-check when task changes so highlight directive re-runs
    this.cdr.markForCheck();
  }

  isChecked(index: number): boolean {
    if (!this.task) return false;
    return this.progressService.getChecked(this.task.id, this.task.checklist.length)[index];
  }

  toggle(index: number): void {
    if (!this.task) return;
    this.progressService.toggle(this.task.id, index, this.task.checklist.length);
  }

  progressPercent(): number {
    if (!this.task || this.task.checklist.length === 0) return 0;
    const done = this.progressService.completedCount(this.task.id, this.task.checklist.length);
    return Math.round((done / this.task.checklist.length) * 100);
  }
}
