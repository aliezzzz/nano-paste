import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SendPanel from "./SendPanel.vue";

async function selectOption(wrapper: ReturnType<typeof mount>, testId: string, menuTestId: string, optionText: string): Promise<void> {
  await wrapper.get(`[data-testid="${testId}"]`).trigger("click");
  const buttons = wrapper.findAll(`[data-testid="${menuTestId}"] button`);
  const target = buttons.find((b) => b.text().includes(optionText));
  await target?.trigger("click");
}

describe("SendPanel", () => {
  it("emits submitted text with a selected topic", async () => {
    const wrapper = mount(SendPanel, {
      props: {
        topicSuggestions: ["工作", "生活"],
      },
    });

    await wrapper.get("#text-title").setValue("标题");
    await selectOption(wrapper, "text-topic-select", "text-topic-select-menu", "工作");
    await wrapper.get("#text-content").setValue("内容");
    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("submit")?.[0]?.[0]).toEqual({
      title: "标题",
      content: "内容",
      topic: "工作",
      contentKind: "text",
      language: undefined,
    });
  });

  it("emits a custom topic over selected topic", async () => {
    const wrapper = mount(SendPanel, {
      props: {
        topicSuggestions: ["工作"],
      },
    });

    await selectOption(wrapper, "text-topic-select", "text-topic-select-menu", "工作");
    await wrapper.get('[data-testid="text-topic"]').setValue("学习");
    await wrapper.get("#text-content").setValue("内容");
    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("submit")?.[0]?.[0]).toEqual({
      title: undefined,
      content: "内容",
      topic: "学习",
      contentKind: "text",
      language: undefined,
    });
  });

  it("emits code metadata when code mode is selected", async () => {
    const wrapper = mount(SendPanel);

    await wrapper.get("#text-content").setValue("const answer = 42;");
    await wrapper.findAll("button").find((button) => button.text() === "代码片段")?.trigger("click");
    await selectOption(wrapper, "text-language", "text-language-menu", "TypeScript");
    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("submit")?.[0]?.[0]).toEqual({
      content: "const answer = 42;",
      contentKind: "code",
      language: "typescript",
    });
  });

  it("clears inputs when clear version changes", async () => {
    const wrapper = mount(SendPanel, {
      props: {
        topicSuggestions: ["工作"],
        clearVersion: 0,
      },
    });

    await wrapper.get("#text-title").setValue("标题");
    await selectOption(wrapper, "text-topic-select", "text-topic-select-menu", "工作");
    await wrapper.get("#text-content").setValue("const answer = 42;");
    await wrapper.findAll("button").find((button) => button.text() === "代码片段")?.trigger("click");
    await selectOption(wrapper, "text-language", "text-language-menu", "TypeScript");

    await wrapper.setProps({ clearVersion: 1 });

    expect((wrapper.get("#text-title").element as HTMLInputElement).value).toBe("");
    expect((wrapper.get("#text-content").element as HTMLTextAreaElement).value).toBe("");
    expect(wrapper.get('[data-testid="text-topic-select"]').text()).toContain("选择已有话题");
    expect(wrapper.find('[data-testid="text-language"]').exists()).toBe(false);
  });
});
