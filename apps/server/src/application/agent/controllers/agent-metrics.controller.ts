import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { Authorize } from "@application/@shared/auth";
import { ApiOperation } from "@application/@shared/openapi/decorators";
import { RecordPermission } from "@domain/auth";
import {
  GetAgentMetricsService,
  AgentMetricsDto,
} from "@application/agent/services/get-agent-metrics.service";

const metricsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

@ApiTags("Agent")
@Controller("agent")
export class AgentMetricsController {
  constructor(private readonly getAgentMetrics: GetAgentMetricsService) {}

  @ApiOperation({
    summary: "Agent observability metrics aggregated over a time range",
    responses: [{ status: 200, description: "Aggregated metrics" }],
  })
  @Authorize(RecordPermission.VIEW)
  @Get("metrics")
  getMetrics(@Query() query: Record<string, string>): Promise<AgentMetricsDto> {
    const parsed = metricsQuerySchema.parse(query);
    const now = new Date();
    const to = parsed.to ? new Date(parsed.to) : now;
    const from = parsed.from
      ? new Date(parsed.from)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return this.getAgentMetrics.execute(from, to);
  }
}
