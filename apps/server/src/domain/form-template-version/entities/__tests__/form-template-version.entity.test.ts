import {
  FormTemplateVersion,
  FormTemplateVersionId,
  FormStatus,
} from "../form-template-version.entity";
import { FormTemplateId } from "../../../form-template/entities";
import type { FormDefinitionJson } from "../../../form-template/types";

const SAMPLE_DEFINITION: FormDefinitionJson = {
  id: "test_form",
  name: "Test Form",
  specialty: "PSICOLOGIA",
  sections: [
    {
      id: "sec_1",
      label: "Section 1",
      order: 1,
      fields: [{ id: "field_1", type: "text", label: "Name", order: 1, required: true }],
    },
  ],
};

function makeVersion(
  overrides: Partial<ConstructorParameters<typeof FormTemplateVersion>[0]> = {},
) {
  return FormTemplateVersion.create({
    templateId: FormTemplateId.generate(),
    versionNumber: 1,
    definitionJson: SAMPLE_DEFINITION,
    ...overrides,
  });
}

describe("FormTemplateVersion entity", () => {
  describe("create()", () => {
    it("should create a version with DRAFT status by default", () => {
      const version = makeVersion();

      expect(version.status).toBe(FormStatus.DRAFT);
      expect(version.publishedAt).toBeNull();
      expect(version.id).toBeInstanceOf(FormTemplateVersionId);
    });

    it("should store the definition JSON", () => {
      const version = makeVersion();

      expect(version.definitionJson).toEqual(SAMPLE_DEFINITION);
    });
  });

  describe("publish()", () => {
    it("should set status to PUBLISHED and set publishedAt", () => {
      const version = makeVersion();

      expect(version.isDraft()).toBe(true);

      version.publish();

      expect(version.status).toBe(FormStatus.PUBLISHED);
      expect(version.publishedAt).toBeInstanceOf(Date);
      expect(version.isPublished()).toBe(true);
    });

    it("should be idempotent (calling publish twice does not throw)", () => {
      const version = makeVersion();

      version.publish();
      const firstPublishedAt = version.publishedAt;

      expect(() => version.publish()).not.toThrow();
      expect(version.publishedAt).toBe(firstPublishedAt);
    });
  });

  describe("deprecate()", () => {
    it("should set status to DEPRECATED", () => {
      const version = makeVersion();

      version.publish();
      version.deprecate();

      expect(version.status).toBe(FormStatus.DEPRECATED);
    });

    it("should be idempotent", () => {
      const version = makeVersion();

      version.deprecate();
      expect(() => version.deprecate()).not.toThrow();
    });
  });
});
