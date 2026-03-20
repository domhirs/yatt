import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';
import hljs from 'highlight.js/lib/core';
import java from 'highlight.js/lib/languages/java';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';

hljs.registerLanguage('java', java);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sql', sql);

@Directive({
  selector: '[appHighlight]',
  standalone: true,
})
export class HighlightDirective implements AfterViewInit {
  @Input('appHighlight') lang = 'java';

  constructor(private readonly el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    this.el.nativeElement.classList.add(`language-${this.lang}`);
    hljs.highlightElement(this.el.nativeElement);
  }
}
