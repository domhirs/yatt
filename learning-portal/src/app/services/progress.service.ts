import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'yatt-learn-progress';

interface ProgressData {
  checked: Record<string, boolean[]>;
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly data = signal<ProgressData>(this.load());

  /** Expose as readonly signal so components can react to changes. */
  readonly progressData = this.data.asReadonly();

  getChecked(taskId: string, totalItems: number): boolean[] {
    const checked = this.data().checked[taskId];
    if (!checked || checked.length !== totalItems) {
      return new Array(totalItems).fill(false);
    }
    return [...checked];
  }

  toggle(taskId: string, index: number, totalItems: number): void {
    const current = this.getChecked(taskId, totalItems);
    current[index] = !current[index];
    this.data.update(prev => ({
      checked: { ...prev.checked, [taskId]: current },
    }));
    this.save();
  }

  isComplete(taskId: string, totalItems: number): boolean {
    if (totalItems === 0) return false;
    // Reading progressData() inside here makes this reactive in templates.
    const checked = this.progressData().checked[taskId];
    return !!checked && checked.length === totalItems && checked.every(Boolean);
  }

  completedCount(taskId: string, totalItems: number): number {
    const checked = this.progressData().checked[taskId];
    if (!checked) return 0;
    return checked.filter(Boolean).length;
  }

  private load(): ProgressData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { checked: {} };
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed.checked === 'object' ? parsed : { checked: {} };
    } catch {
      return { checked: {} };
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data()));
  }
}
