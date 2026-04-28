import {Injectable, OnModuleInit, OnModuleDestroy} from '@nestjs/common';
import mqtt, {IClientOptions, MqttClient} from 'mqtt';
import {IClientPublishOptions, IClientSubscribeOptions} from 'mqtt/lib/client';
import {Logger} from '@application/@shared/logger';
import {EnvConfigService} from '../config';

@Injectable()
export class MqttClientService implements OnModuleInit, OnModuleDestroy {
    private client!: MqttClient;

    constructor(
        private readonly config: EnvConfigService,
        private readonly logger: Logger
    ) {}

    async onModuleInit(): Promise<void> {
        const brokerUrl = this.getBrokerUrl();
        const options = this.getClientOptions();

        if (!brokerUrl) {
            this.logger.info('MQTT communication not enabled. Broker URL is missing.');

            return;
        }

        this.logger.info(`Connecting to MQTT broker: ${brokerUrl}`);

        await new Promise((resolve) => {
            this.client = mqtt.connect(brokerUrl, options);

            this.client.on('connect', () => {
                this.logger.info('Connected to MQTT broker');
                resolve();
            });

            this.client.on('error', (err) => {
                this.logger.error('MQTT connection error:', err);
                resolve(err);
            });

            this.client.on('offline', () => {
                this.logger.warn('MQTT client offline');
            });

            this.client.on('reconnect', () => {
                this.logger.info('MQTT client reconnecting');
            });

            this.client.on('close', () => {
                this.logger.info('MQTT connection closed');
            });
        });
    }

    onModuleDestroy() {
        if (this.isConnected()) {
            this.client.end();
            this.logger.info('MQTT client disconnected');
        }
    }

    publish(topic: string, payload: string | Buffer, options: IClientPublishOptions = {qos: 1, retain: false}): void {
        if (!this.isConnected()) {
            throw new Error('MQTT client not connected');
        }

        this.client.publish(topic, payload, options, (err) => {
            if (err) {
                this.logger.error(`Failed to publish to topic ${topic}:`, err);
            }
        });
    }

    subscribe(topic: string, options: IClientSubscribeOptions = {qos: 1}): void {
        if (!this.isConnected()) {
            throw new Error('MQTT client not connected');
        }

        this.client.subscribe(topic, options, (err) => {
            if (err) {
                this.logger.error(`Failed to subscribe to topic ${topic}:`, err);
            }
        });
    }

    onMessage(callback: (topic: string, message: Buffer) => void): void {
        this.client.on('message', (topic, message) => {
            callback(topic, message);
        });
    }

    isConnected(): boolean {
        return this.client?.connected ?? false;
    }

    private getBrokerUrl(): string | undefined {
        return this.config.mqtt.brokerUrl;
    }

    private getClientOptions(): IClientOptions {
        return {
            username: this.config.mqtt.username,
            password: this.config.mqtt.password,
            clean: true,
            reconnectPeriod: 5000, // Wait 5 seconds before reconnecting
        };
    }
}
