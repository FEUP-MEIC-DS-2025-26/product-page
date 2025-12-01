const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

// Configura o exportador para enviar dados para o Jaeger
const traceExporter = new OTLPTraceExporter({
  // "jaeger" é o nome do serviço no docker-compose
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger:4318/v1/traces',
});

const sdk = new NodeSDK({
  serviceName: 'mips_backend',
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();