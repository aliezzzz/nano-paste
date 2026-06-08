import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MobileTabs from "./MobileTabs.vue";

describe("MobileTabs", () => {
  it("renders send, history, favorites and settings tabs", async () => {
    const wrapper = mount(MobileTabs, { props: { activeTab: "send" } });

    expect(wrapper.text()).toContain("发送");
    expect(wrapper.text()).toContain("历史");
    expect(wrapper.text()).toContain("收藏");
    expect(wrapper.text()).toContain("设置");

    await wrapper.get('[data-tab="settings"]').trigger("click");
    expect(wrapper.emitted("switch")?.[0]).toEqual(["settings"]);
  });
});
