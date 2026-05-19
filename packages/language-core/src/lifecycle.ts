export interface LifecycleHook {
  keyword: string;
  transformsTo: string;
  description: string;
  supportsAsync: boolean;
}

export const LIFECYCLE_HOOKS: LifecycleHook[] = [
  {
    keyword: 'mount',
    transformsTo: 'mounted()',
    description: 'Called after the component is connected to the DOM. Use for initialization, subscriptions, and side effects.',
    supportsAsync: true,
  },
  {
    keyword: 'unmount',
    transformsTo: 'unmounted()',
    description: 'Called before the component is disconnected from the DOM. Use for cleanup, unsubscribing, and releasing resources.',
    supportsAsync: true,
  },
  {
    keyword: 'effect',
    transformsTo: 'effect()',
    description: 'Reactive effect that runs whenever reactive dependencies change. Similar to useEffect but dependency-tracked.',
    supportsAsync: false,
  },
];

export const LIFECYCLE_KEYWORDS = LIFECYCLE_HOOKS.map((h) => h.keyword);

export function findLifecycleHook(keyword: string): LifecycleHook | undefined {
  return LIFECYCLE_HOOKS.find((h) => h.keyword === keyword);
}
