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
];

describe("ItemsPanel", () => {
  it("renders a search box and filters by text content", async () => {
    const wrapper = mount(ItemsPanel, { props: { items } });

    const search = wrapper.get('[data-testid="items-search"]');
    await search.setValue("设计");

    expect(wrapper.text()).toContain("design.png");
    expect(wrapper.text()).not.toContain("会议纪要");
  });

  it("renders favorite items in a distinct quick access section", () => {
    const wrapper = mount(ItemsPanel, { props: { items } });

    expect(wrapper.get('[data-testid="favorite-section"]').text()).toContain("会议纪要");
    expect(wrapper.get('[data-testid="history-section"]').text()).toContain("design.png");
  });

  it("shows actionable empty guidance", () => {
    const wrapper = mount(ItemsPanel, { props: { items: [] } });

    expect(wrapper.text()).toContain("从这里开始");
    expect(wrapper.text()).toContain("粘贴文本");
    expect(wrapper.text()).toContain("拖拽文件");
  });

  it("supports selecting multiple items for batch actions", async () => {
    const wrapper = mount(ItemsPanel, { props: { items } });

    const checkboxes = wrapper.findAll('[data-testid="item-select"]');
    await checkboxes[0].setValue(true);
    await checkboxes[1].setValue(true);

    expect(wrapper.get('[data-testid="batch-bar"]').text()).toContain("已选 2 项");
    await wrapper.get('[data-testid="batch-delete"]').trigger("click");

    expect(wrapper.emitted("item-action")?.map((event) => event[0])).toEqual([
      expect.objectContaining({ id: "text-1", action: "delete" }),
      expect.objectContaining({ id: "file-1", action: "delete" }),
    ]);
  });
});
