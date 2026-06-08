import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SendPanel from "./SendPanel.vue";

describe("SendPanel", () => {
  it("emits normalized tags with submitted text", async () => {
    const wrapper = mount(SendPanel);

    await wrapper.get("#text-title").setValue("标题");
    await wrapper.get("#text-content").setValue("内容");
    await wrapper.get('[data-testid="text-tags"]').setValue("工作, 会议  设计");
    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("submit")?.[0]?.[0]).toEqual({
      title: "标题",
      content: "内容",
      tags: ["工作", "会议", "设计"],
    });
  });
});
