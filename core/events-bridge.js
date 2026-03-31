const { eventBus } = require('../../events'); // This might require transpilation or ts-node
const { SermonEventType } = require('../../events/schemas/sermon');
const { v4: uuidv4 } = require('uuid');

/**
 * Events Bridge
 * Allows the legacy CommonJS core to publish events to the TS Event Backbone.
 */
function publishEvent(type, payload, source = 'core') {
  try {
    eventBus.publish({
      type,
      payload,
      id: uuidv4(),
      source,
      timestamp: new Date()
    });
  } catch (e) {
    console.error(`[EventsBridge] Failed to publish event ${type}:`, e.message);
  }
}

module.exports = {
  publishEvent,
  SermonEventType
};
