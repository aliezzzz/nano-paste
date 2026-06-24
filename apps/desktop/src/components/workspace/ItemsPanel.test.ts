import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ItemsPanel from "./ItemsPanel.vue";
import type { ItemView } from "../../types/workspace";

const items: ItemView[] = [
  {
    id: "text-1",
    type: "text",
    title: "会议纪要",
    content: "讨论 NanoPaste 搜索和标签",
    isFavorite: true,
    createdAt: "2026-06-08T10:00:00Z",
    iconSvg: "<svg></svg>",
    tags: ["工作", "会议"],
  },
  {
    id: "file-1",
    type: "file",
    fileName: "design.png",
    fileSize: 2048,
    isFavorite: false,
    createdAt: "2026-06-08T11:00:00Z",
    iconSvg: "<svg></svg>",
    tags: ["设计"],
  },
  {
    id: "code-1",
    type: "text",
    content: "const answer = 42;",
    contentKind: "code",
    language: "typescript",
    topic: "代码",
    isFavorite: false,
    createdAt: "2026-06-08T12:00:00Z",
    iconSvg: "<svg></svg>",
  },
];

describe("ItemsPanel", () => {
  it("renders a search box and filters by text content", async () => {
    const wrapper = mount(ItemsPanel, { props: { items } });

    const search = wrapper.get('[data-testid="items-search"]');
    await search.setValue("设计");

    expect(wrapper.text()).toContain("design.png");
    expect(wrapper.text()).not.toContain("会议纪要");
  });

  it("renders all items together in all mode", () => {
    const wrapper = mount(ItemsPanel, { props: { items } });

    const allSectionText = wrapper.get('[data-testid="all-section"]').text();
    expect(allSectionText).toContain("会议纪要");
    expect(allSectionText).toContain("design.png");
    expect(wrapper.find('[data-testid="favorite-section"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="history-section"]').exists()).toBe(false);
  });

  it("shows only favorite items in favorites mode", () => {
    const wrapper = mount(ItemsPanel, { props: { items, mode: "favorites" } });

    expect(wrapper.text()).toContain("我的收藏");
    expect(wrapper.get('[data-testid="mobile-favorites-section"]').text()).toContain("会议纪要");
    expect(wrapper.text()).not.toContain("design.png");
    expect(wrapper.find('[data-testid="all-section"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="history-section"]').exists()).toBe(false);
  });

  it("emits selected topic from topic filter dropdown", async () => {
    const wrapper = mount(ItemsPanel, {
      props: {
        items,
        topics: [{ name: "工作", count: 2 }],
      },
      attachTo: document.body,
    });

    await wrapper.get('[data-testid="topic-filter-toggle"]').trigger("click");
    await wrapper.get('[data-testid="topic-filter-menu"]').findAll("button")[1].trigger("click");

    expect(wrapper.emitted("select-topic")?.[0]?.[0]).toBe("工作");
  });

  it("shows actionable empty guidance", () => {
    const wrapper = mount(ItemsPanel, { props: { items: [] } });

    expect(wrapper.text()).toContain("从这里开始");
    expect(wrapper.text()).toContain("粘贴文本");
    expect(wrapper.text()).toContain("拖拽文件");
  });

  it("uses content as the title when text has no title", () => {
    const wrapper = mount(ItemsPanel, { props: { items } });

    expect(wrapper.text()).toContain("const answer = 42;");
    expect(wrapper.text()).not.toContain("无标题");
  });

  it("emits code preview action for code items", async () => {
    const wrapper = mount(ItemsPanel, { props: { items } });

    const codeCard = wrapper.findAll("article").find((card) => card.text().includes("const answer = 42;"));
    const previewButton = codeCard?.findAll("button").find((button) => button.text().trim() === "预览");
    await previewButton?.trigger("click");

    const emitted = wrapper.emitted("item-action") ?? [];
    expect(emitted[emitted.length - 1]?.[0]).toEqual(expect.objectContaining({
      id: "code-1",
      action: "preview-code",
      language: "typescript",
    }));
  });

  it("hides sibling footer actions while editing topic", async () => {
    const wrapper = mount(ItemsPanel, { props: { items } });
    const codeCard = wrapper.findAll("article").find((card) => card.text().includes("const answer = 42;"));

    await codeCard?.find(".meta-topic").trigger("click");

    expect(codeCard?.find(".topic-edit").exists()).toBe(true);
    expect(codeCard?.text()).not.toContain("复制");
    expect(codeCard?.text()).not.toContain("预览");
    expect(codeCard?.find(".timestamp").exists()).toBe(false);
    expect(codeCard?.find(".delete-btn").exists()).toBe(false);
  });
});
