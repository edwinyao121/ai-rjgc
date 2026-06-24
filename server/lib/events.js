import { EventEmitter } from 'node:events'

export class WorkOrderEventBus extends EventEmitter {
  constructor() {
    super()
    this.subscribers = new Map()
  }

  subscribe(workOrderId, response, history = []) {
    response.setHeader?.('Content-Type', 'text/event-stream; charset=utf-8')
    response.setHeader?.('Cache-Control', 'no-cache, no-transform')
    response.setHeader?.('Connection', 'keep-alive')
    response.setHeader?.('X-Accel-Buffering', 'no')
    response.flushHeaders?.()

    response.write?.(': connected\n\n')
    for (const event of history) {
      this.writeSse(response, event)
    }

    const subscribers = this.subscribers.get(workOrderId) || new Set()
    subscribers.add(response)
    this.subscribers.set(workOrderId, subscribers)

    response.on?.('close', () => {
      subscribers.delete(response)
      if (subscribers.size === 0) {
        this.subscribers.delete(workOrderId)
      }
    })
  }

  publish(workOrderId, event) {
    const subscribers = this.subscribers.get(workOrderId)
    if (!subscribers) return
    for (const response of subscribers) {
      this.writeSse(response, event)
    }
  }

  writeSse(response, event) {
    response.write?.(`id: ${event.sequence ?? event.id}\n`)
    response.write?.(`event: ${event.type}\n`)
    response.write?.(`data: ${JSON.stringify(event)}\n\n`)
  }
}
