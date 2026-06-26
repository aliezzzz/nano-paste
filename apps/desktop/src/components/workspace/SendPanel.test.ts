import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";
import SendPanel from "./SendPanel.vue";

async function selectTopic(wrapper: ReturnType<typeof mount>, topicName: string): Promise<void> {
  await wrapper.get('[data-testid="text-topic-select"]').trigger("click");
  await nextTick();
  const options = wrapper.findAll(".topic-select-option");
  const target = options.find((b) => b.text().includes(topicName));
  await target?.trigger("click");
}

describe("SendPanel", () => {
  it("emits submitted text with a selected topic", async () => {
    const wrapper = mount(SendPanel, {
      props: {
        topicSuggestions: [
          { name: "工作", count: 1 },
          { name: "生活", count: 1 },
        ],
      },
    });

    await wrapper.get("#text-title").setValue("标题");
    await selectTopic(wrapper, "工作");
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

  it("emits code metadata when code mode is selected", async () => {
    const wrapper = mount(SendPanel);

    await wrapper.get("#text-content").setValue("const answer = 42;");
    await wrapper.findAll("button").find((button) => button.text() === "代码片段")?.trigger("click");
    await wrapper.get('[data-testid="text-language"]').trigger("click");
    await nextTick();
    const langOptions = wrapper.findAll('[data-testid="text-language-menu"] button');
    const ts = langOptions.find((b) => b.text().includes("TypeScript"));
    await ts?.trigger("click");
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
        topicSuggestions: [{ name: "工作", count: 1 }],
        clearVersion: 0,
      },
    });

    await wrapper.get("#text-title").setValue("标题");
    await selectTopic(wrapper, "工作");
    await wrapper.get("#text-content").setValue("const answer = 42;");
    await wrapper.findAll("button").find((button) => button.text() === "代码片段")?.trigger("click");
    await wrapper.get('[data-testid="text-language"]').trigger("click");
    await nextTick();
    const langOptions = wrapper.findAll('[data-testid="text-language-menu"] button');
    const ts = langOptions.find((b) => b.text().includes("TypeScript"));
    await ts?.trigger("click");

    await wrapper.setProps({ clearVersion: 1 });

    expect((wrapper.get("#text-title").element as HTMLInputElement).value).toBe("");
    expect((wrapper.get("#text-content").element as HTMLTextAreaElement).value).toBe("");
    expect(wrapper.get('[data-testid="text-topic-select"]').text()).toContain("选择或创建话题");
    expect(wrapper.find('[data-testid="text-language"]').exists()).toBe(false);
  });

  it("emits a newly created topic when none matches", async () => {
    const wrapper = mount(SendPanel, {
      props: {
        topicSuggestions: [{ name: "工作", count: 1 }],
      },
      attachTo: document.body,
    });

    await wrapper.get('[data-testid="text-topic-select"]').trigger("click");
    await nextTick();
    await wrapper.get(".topic-select-input").setValue("bugfix");
    await nextTick();
    await wrapper.find(".topic-select-option--create").trigger("click");
    await wrapper.get("#text-content").setValue("内容");
    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("submit")?.[0]?.[0]).toMatchObject({
      content: "内容",
      topic: "bugfix",
    });
    wrapper.unmount();
  });
});
