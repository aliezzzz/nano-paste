import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";
import TopicSelect from "./TopicSelect.vue";

const sampleTopics = [
  { name: "工作", count: 5 },
  { name: "生活", count: 2 },
  { name: "学习", count: 8 },
];

describe("TopicSelect", () => {
  it("renders the current value as trigger label", () => {
    const wrapper = mount(TopicSelect, {
      props: { modelValue: "工作", topics: sampleTopics },
    });
    expect(wrapper.find(".topic-select-label").text()).toBe("工作");
  });

  it("shows placeholder when modelValue is empty", () => {
    const wrapper = mount(TopicSelect, {
      props: { modelValue: "", topics: sampleTopics },
    });
    expect(wrapper.find(".topic-select-label--placeholder").exists()).toBe(true);
  });

  it("opens menu on trigger click", async () => {
    const wrapper = mount(TopicSelect, {
      props: { modelValue: "", topics: sampleTopics },
      attachTo: document.body,
    });
    await wrapper.get("button.topic-select-trigger").trigger("click");
    await nextTick();
    expect(wrapper.find(".topic-select-menu").exists()).toBe(true);
    expect(wrapper.find(".topic-select-input").exists()).toBe(true);
    wrapper.unmount();
  });

  it("filters topics by query (substring)", async () => {
    const wrapper = mount(TopicSelect, {
      props: { modelValue: "", topics: sampleTopics },
      attachTo: document.body,
    });
    await wrapper.get("button.topic-select-trigger").trigger("click");
    await wrapper.get(".topic-select-input").setValue("工");
    await nextTick();
    const options = wrapper.findAll(".topic-select-option");
    const createRow = wrapper.find(".topic-select-option--create");
    const existingOptions = options.filter(
      (o) => !o.classes().includes("topic-select-option--create"),
    );
    expect(createRow.exists()).toBe(false);
    expect(existingOptions.length).toBe(1);
    expect(existingOptions[0]?.text()).toContain("工作");
    wrapper.unmount();
  });

  it("shows a create row when query has no exact match", async () => {
    const wrapper = mount(TopicSelect, {
      props: { modelValue: "", topics: sampleTopics },
      attachTo: document.body,
    });
    await wrapper.get("button.topic-select-trigger").trigger("click");
    await wrapper.get(".topic-select-input").setValue("zz");
    await nextTick();
    const createRow = wrapper.find(".topic-select-option--create");
    expect(createRow.exists()).toBe(true);
    expect(createRow.text()).toContain("zz");
    wrapper.unmount();
  });

  it("emits update:modelValue and create when create row is clicked", async () => {
    const wrapper = mount(TopicSelect, {
      props: { modelValue: "", topics: sampleTopics },
      attachTo: document.body,
    });
    await wrapper.get("button.topic-select-trigger").trigger("click");
    await wrapper.get(".topic-select-input").setValue("bugfix");
    await nextTick();
    await wrapper.find(".topic-select-option--create").trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["bugfix"]);
    expect(wrapper.emitted("create")?.[0]).toEqual(["bugfix"]);
    wrapper.unmount();
  });

  it("emits update:modelValue when existing option is clicked", async () => {
    const wrapper = mount(TopicSelect, {
      props: { modelValue: "", topics: sampleTopics },
      attachTo: document.body,
    });
    await wrapper.get("button.topic-select-trigger").trigger("click");
    await nextTick();
    const options = wrapper.findAll(".topic-select-option");
    await options[0]!.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["工作"]);
    wrapper.unmount();
  });

  it("emits empty string when clear X is clicked", async () => {
    const wrapper = mount(TopicSelect, {
      props: { modelValue: "工作", topics: sampleTopics },
    });
    await wrapper.get(".topic-select-clear").trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([""]);
  });

  it("does not render clear button when modelValue is empty", () => {
    const wrapper = mount(TopicSelect, {
      props: { modelValue: "", topics: sampleTopics },
    });
    expect(wrapper.find(".topic-select-clear").exists()).toBe(false);
  });

  it("Enter on highlighted create row emits create", async () => {
    const wrapper = mount(TopicSelect, {
      props: { modelValue: "", topics: sampleTopics },
      attachTo: document.body,
    });
    await wrapper.get("button.topic-select-trigger").trigger("click");
    await wrapper.get(".topic-select-input").setValue("zz");
    await nextTick();
    await wrapper
      .get(".topic-select-input")
      .trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("create")?.[0]).toEqual(["zz"]);
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["zz"]);
    wrapper.unmount();
  });

  it("shows empty text when topics is empty and query is empty", async () => {
    const wrapper = mount(TopicSelect, {
      props: { modelValue: "", topics: [] },
      attachTo: document.body,
    });
    await wrapper.get("button.topic-select-trigger").trigger("click");
    await nextTick();
    expect(wrapper.find(".topic-select-empty").text()).toContain("还没有话题");
    wrapper.unmount();
  });
});
