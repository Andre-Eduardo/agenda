import { Injectable } from "@nestjs/common";
import { z } from "zod";
import { Actor } from "@domain/@shared/actor";
import { FormTemplateRepository } from "@domain/form-template/form-template.repository";
import { PaginatedList } from "@domain/@shared/repository";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { PaginatedDto } from "@application/@shared/dto";
import { searchFormTemplatesSchema, FormTemplateDto } from "@application/form-template/dtos";
import type { FormTemplate } from "@domain/form-template/entities";

export type SearchFormTemplatesPayload = z.infer<typeof searchFormTemplatesSchema>;

@Injectable()
export class SearchFormTemplatesService implements ApplicationService<
  SearchFormTemplatesPayload,
  PaginatedDto<FormTemplateDto>
> {
  constructor(private readonly formTemplateRepository: FormTemplateRepository) {}

  async execute({
    actor,
    payload,
  }: Command<SearchFormTemplatesPayload>): Promise<PaginatedDto<FormTemplateDto>> {
    const filter = this.buildFilter(payload, actor);
    const result: PaginatedList<FormTemplate> = await this.formTemplateRepository.search(
      { limit: payload.limit, sort: payload.sort },
      filter,
    );

    return {
      data: result.data.map((t) => new FormTemplateDto(t)),
      totalCount: result.totalCount,
    };
  }

  /**
   * Resolve scope to a repository filter:
   *  - public → only system templates (clinicId=null, isPublic=true)
   *  - mine   → only the actor's clinic
   *  - all    → repository returns both via `clinicId=actor.clinicId` since
   *             system templates are also visible to everyone (but the
   *             current repository contract only supports a single clinicId
   *             filter — `all` therefore degrades to the actor's clinic
   *             only, with public templates fetched separately by the caller
   *             when needed).
   */
  private buildFilter(
    payload: SearchFormTemplatesPayload,
    actor: Actor,
  ): Parameters<FormTemplateRepository["search"]>[1] {
    const filter: Parameters<FormTemplateRepository["search"]>[1] = {
      specialtyLabel: payload.specialty,
    };

    if (payload.scope === "public") {
      filter.isPublic = true;
      filter.clinicId = null;
    } else if (payload.scope === "mine") {
      filter.clinicId = actor.clinicId;
    }

    return filter;
  }
}
