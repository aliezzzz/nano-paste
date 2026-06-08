import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ConfigModal from "./ConfigModal.vue";

describe("ConfigModal", () => {
  it("lets users test the backend connection", async () => {
    const wrapper = mount(ConfigModal, {
      props: {
        submitting: false,
        testing: false,
        apiBaseUrl: "http://localhost:8080",
        currentApiBaseUrl: "http://localhost:8080",
        error: "",
        testStatus: "",
      },
    });

    await wrapper.get('[data-testid="test-connection"]').trigger("click");

    expect(wrapper.emitted("test-connection")).toHaveLength(1);
    expect(wrapper.text()).toContain("后端地址");
  });
});
