import { ConfigService } from "@nestjs/config";
import { mock } from "jest-mock-extended";
import type { MqttClient } from "mqtt";
import mqtt from "mqtt";
import type { Logger } from "@application/@shared/logger";
import { EnvConfigService } from "@infrastructure/config";
import { MqttClientService } from "../mqtt-client.service";

jest.mock("mqtt");

const mqttConnectMock = mqtt.connect as jest.MockedFunction<typeof mqtt.connect>;

describe("MqttClientService", () => {
  let mockClient: MockMqttClient;
  const config = new EnvConfigService(
    new ConfigService({
      mqtt: {
        brokerUrl: "mqtt://localhost:1883",
        username: "testuser",
        password: "testpass",
      },
    }),
  );
  const logger = mock<Logger>();
  let mqttClientService: MqttClientService;

  type EventHandler = (...args: unknown[]) => void;
  type MockMqttClient = jest.Mocked<MqttClient> & {
    connected: boolean;
    eventHandlers: Map<string, EventHandler>;
  };

  const createMockClient = (): MockMqttClient => {
    const eventHandlers = new Map<string, EventHandler>();

    const onMock: ReturnType<typeof jest.fn> = jest.fn((event: string, cb: EventHandler) => {
      eventHandlers.set(event, cb);

      return onMock as unknown as MqttClient;
    });

    const client = {
      on: onMock,
      end: jest.fn(),
      publish: jest.fn(),
      subscribe: jest.fn(),
      connected: true,
      eventHandlers,
    };

    return client as unknown as MockMqttClient;
  };

  beforeEach(() => {
    mqttClientService = new MqttClientService(config, logger);

    mockClient = createMockClient();

    mqttConnectMock.mockReturnValue(mockClient as never);
    mqttConnectMock.mockClear();

    jest.clearAllMocks();
  });

  const triggerConnectHandler = async () => {
    const initPromise = mqttClientService.onModuleInit();

    const connectHandler = mockClient.eventHandlers.get("connect");

    if (connectHandler) {
      connectHandler();
    }

    await initPromise;
  };

  describe("onModuleInit", () => {
    it("should connect to MQTT broker", async () => {
      await triggerConnectHandler();

      expect(mqttConnectMock).toHaveBeenCalledWith(config.mqtt.brokerUrl, {
        username: config.mqtt.username,
        password: config.mqtt.password,
        clean: true,
        reconnectPeriod: 5000,
      });

      expect(logger.info).toHaveBeenCalledWith(
        `Connecting to MQTT broker: ${config.mqtt.brokerUrl}`,
      );
      expect(logger.info).toHaveBeenCalledWith("Connected to MQTT broker");

      expect(mockClient.on).toHaveBeenCalledWith("connect", expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith("error", expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith("offline", expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith("reconnect", expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith("close", expect.any(Function));
    });

    it("should not connect to broker when no broker url is provided", async () => {
      const configWithoutBroker = new EnvConfigService(
        new ConfigService({
          mqtt: {
            brokerUrl: undefined,
            username: "testuser",
            password: "testpass",
          },
        }),
      );

      const mqttClientServiceWithoutBroker = new MqttClientService(configWithoutBroker, logger);

      await mqttClientServiceWithoutBroker.onModuleInit();

      expect(mqttConnectMock).not.toHaveBeenCalled();
    });

    it("should handle error event", async () => {
      await triggerConnectHandler();

      const errorHandler = mockClient.eventHandlers.get("error");
      const error = new Error("Connection failed");

      errorHandler?.(error);

      expect(logger.error).toHaveBeenCalledWith("MQTT connection error:", error);
    });

    it("should handle offline event", async () => {
      await triggerConnectHandler();

      const offlineHandler = mockClient.eventHandlers.get("offline");

      offlineHandler?.();

      expect(logger.warn).toHaveBeenCalledWith("MQTT client offline");
    });

    it("should handle reconnect event", async () => {
      await triggerConnectHandler();

      const reconnectHandler = mockClient.eventHandlers.get("reconnect");

      reconnectHandler?.();

      expect(logger.info).toHaveBeenCalledWith("MQTT client reconnecting");
    });

    it("should handle close event", async () => {
      await triggerConnectHandler();

      const closeHandler = mockClient.eventHandlers.get("close");

      closeHandler?.();

      expect(logger.info).toHaveBeenCalledWith("MQTT connection closed");
    });
  });

  describe("onModuleDestroy", () => {
    it("should disconnect from broker", async () => {
      await triggerConnectHandler();

      mqttClientService.onModuleDestroy();

      expect(mockClient.end).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith("MQTT client disconnected");
    });
  });

  describe("publish", () => {
    it("should publish to topic", async () => {
      await triggerConnectHandler();

      mqttClientService.publish("test/topic", "message");

      expect(mockClient.publish).toHaveBeenCalledWith(
        "test/topic",
        "message",
        { qos: 1, retain: false },
        expect.any(Function),
      );
    });

    it("should throw when not connected", () => {
      expect(() => mqttClientService.publish("test/topic", "message")).toThrow(
        "MQTT client not connected",
      );
    });

    it("should log error on publish failure", async () => {
      await triggerConnectHandler();

      const error = new Error("Publish failed");

      mockClient.publish.mockImplementation((_, __, ___, callback?) => {
        callback?.(error);

        return mockClient;
      });

      mqttClientService.publish("test/topic", "message");

      expect(logger.error).toHaveBeenCalledWith("Failed to publish to topic test/topic:", error);
    });
  });

  describe("subscribe", () => {
    it("should subscribe to topic", async () => {
      await triggerConnectHandler();

      mqttClientService.subscribe("test/topic");

      expect(mockClient.subscribe).toHaveBeenCalledWith(
        "test/topic",
        { qos: 1 },
        expect.any(Function),
      );
    });

    it("should throw when not connected", () => {
      expect(() => mqttClientService.subscribe("test/topic")).toThrow("MQTT client not connected");
    });

    it("should log error on subscribe failure", async () => {
      await triggerConnectHandler();

      const error = new Error("Subscribe failed");

      mockClient.subscribe.mockImplementation((_, __, callback?) => {
        callback?.(error);

        return mockClient;
      });

      mqttClientService.subscribe("test/topic");

      expect(logger.error).toHaveBeenCalledWith("Failed to subscribe to topic test/topic:", error);
    });
  });

  describe("onMessage", () => {
    it("should register message handler", async () => {
      await triggerConnectHandler();

      const callback = jest.fn();

      mqttClientService.onMessage(callback);

      const messageHandler = mockClient.eventHandlers.get("message") as (
        topic: string,
        message: Buffer,
      ) => void;

      messageHandler("test/topic", Buffer.from("message"));

      expect(callback).toHaveBeenCalledWith("test/topic", Buffer.from("message"));
    });
  });

  describe("isConnected", () => {
    it("should return true when client is connected", async () => {
      await triggerConnectHandler();

      expect(mqttClientService.isConnected()).toBe(true);
    });

    it("should return false when client is not connected", async () => {
      await triggerConnectHandler();

      mockClient.connected = false;

      expect(mqttClientService.isConnected()).toBe(false);
    });

    it("should return false when client is undefined", () => {
      expect(mqttClientService.isConnected()).toBe(false);
    });
  });
});
