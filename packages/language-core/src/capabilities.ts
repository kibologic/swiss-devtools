export const BUILTIN_CAPABILITIES = [
  'network',
  'analytics',
  'payment',
] as const;

export type BuiltinCapability = (typeof BUILTIN_CAPABILITIES)[number];

export interface CapabilityDefinition {
  name: string;
  description: string;
  example: string;
}

export const CAPABILITY_DOCS: Record<string, CapabilityDefinition> = {
  network: {
    name: 'network',
    description: 'Grants access to network APIs. Required for any component that makes HTTP requests.',
    example: "@requires('network')",
  },
  analytics: {
    name: 'analytics',
    description: 'Grants access to analytics tracking. Required for components that emit events to tracking systems.',
    example: "@requires('analytics')",
  },
  payment: {
    name: 'payment',
    description: 'Grants access to payment processing APIs. High-security capability — requires explicit review.',
    example: "@requires('payment')",
  },
};

export const SWISS_DECORATORS = [
  { name: 'requires', description: 'Declare capability requirements for this component.' },
  { name: 'capability', description: 'Register a custom capability.' },
  { name: 'property', description: 'Declare a reflected DOM property.' },
  { name: 'state', description: 'Declare internal reactive state (decorator form).' },
  { name: 'query', description: 'Query the shadow DOM for an element.' },
  { name: 'queryAll', description: 'Query the shadow DOM for all matching elements.' },
  { name: 'event', description: 'Declare a custom DOM event this component emits.' },
  { name: 'provide', description: 'Provide a value to descendant components via dependency injection.' },
  { name: 'inject', description: 'Inject a provided value from an ancestor component.' },
] as const;
