import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SendPanel from "./SendPanel.vue";

describe("SendPanel", () => {
  it("emits submitted text with a selected topic", async () => {
    const wrapper = mount(SendPanel, {
      props: {
        topicSuggestions: ["工作", "生活"],
      },
    });

    await wrapper.get("#text-title").setValue("标题");
    await wrapper.get('[data-testid="text-topic-select"]').setValue("工作");
    await wrapper.get("#text-content").setValue("内容");
    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("submit")?.[0]?.[0]).toEqual({
      title: "标题",
      content: "内容",
      topic: "工作",
    });
  });

  it("emits a custom topic over selected topic", async () => {
    const wrapper = mount(SendPanel, {
      props: {
        topicSuggestions: ["工作"],
      },
    });

    await wrapper.get('[data-testid="text-topic-select"]').setValue("工作");
    await wrapper.get('[data-testid="text-topic"]').setValue("学习");
    await wrapper.get("#text-content").setValue("内容");
    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("submit")?.[0]?.[0]).toEqual({
      content: "内容",
      topic: "学习",
    });
  });
});
