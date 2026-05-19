export interface DirectiveDefinition {
  name: string;
  aliases: string[];
  description: string;
  valueType: 'expression' | 'string' | 'boolean' | 'any';
}

export const DIRECTIVES: DirectiveDefinition[] = [
  {
    name: 'v-if',
    aliases: ['*if'],
    description: 'Conditionally render an element. The element is removed from the DOM when falsy.',
    valueType: 'expression',
  },
  {
    name: 'v-for',
    aliases: ['*for'],
    description: 'Render the element for each item in a list.',
    valueType: 'expression',
  },
  {
    name: 'v-bind',
    aliases: ['*bind'],
    description: 'Two-way data bind an element property to a component field.',
    valueType: 'expression',
  },
];

export const DIRECTIVE_NAMES = DIRECTIVES.flatMap((d) => [d.name, ...d.aliases]);

export function findDirective(name: string): DirectiveDefinition | undefined {
  return DIRECTIVES.find((d) => d.name === name || d.aliases.includes(name));
}
