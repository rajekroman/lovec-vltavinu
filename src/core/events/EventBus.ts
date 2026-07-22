type EventKey<TEvents extends object> = keyof TEvents & string;
type Listener<TPayload> = (payload: TPayload) => void;

interface QueuedEvent<TEvents extends object> {
  type: EventKey<TEvents>;
  payload: TEvents[EventKey<TEvents>];
}

export class EventBus<TEvents extends object> {
  private readonly listeners = new Map<EventKey<TEvents>, Set<Listener<unknown>>>();
  private readonly queue: QueuedEvent<TEvents>[] = [];

  on<TKey extends EventKey<TEvents>>(
    type: TKey,
    listener: Listener<TEvents[TKey]>,
  ): () => void {
    let group = this.listeners.get(type);

    if (!group) {
      group = new Set();
      this.listeners.set(type, group);
    }

    group.add(listener as Listener<unknown>);

    return () => {
      group?.delete(listener as Listener<unknown>);
    };
  }

  emit<TKey extends EventKey<TEvents>>(type: TKey, payload: TEvents[TKey]): void {
    this.queue.push({ type, payload } as QueuedEvent<TEvents>);
  }

  flush(): void {
    let safetyCounter = 0;

    while (this.queue.length > 0 && safetyCounter < 1000) {
      const event = this.queue.shift();
      safetyCounter += 1;

      if (!event) {
        continue;
      }

      const group = this.listeners.get(event.type);
      if (!group) {
        continue;
      }

      for (const listener of [...group]) {
        listener(event.payload);
      }
    }

    if (safetyCounter >= 1000) {
      this.queue.length = 0;
      throw new Error("EventBus zastavil pravděpodobnou nekonečnou smyčku událostí.");
    }
  }

  clear(): void {
    this.queue.length = 0;
    this.listeners.clear();
  }
}
