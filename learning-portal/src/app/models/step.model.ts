export interface CodeExample {
  lang: string;
  label: string;
  code: string;
}

export interface Link {
  label: string;
  url: string;
}

export interface Concept {
  term: string;
  explanation: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  concepts?: Concept[];
  checklist: string[];
  examples: CodeExample[];
  links: Link[];
}

export interface Story {
  id: string;
  title: string;
  tasks: Task[];
}

export interface Stage {
  id: string;
  title: string;
  stories: Story[];
}
