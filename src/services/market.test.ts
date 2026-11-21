import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

async function loadServices() {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test");
  vi.resetModules();
  return import("./api");
}

function respondWith(body: unknown, ok = true, status = 200) {
  fetchMock.mockResolvedValue({
    ok,
    status,
    headers: { get: () => "application/json" },
    json: async () => body,
  });
}

describe("marketplace service", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("maps documented product rows, converting decimal strings to numbers", async () => {
    const { marketService } = await loadServices();
    respondWith({
      success: true,
      data: [
        {
          id: "p1",
          categoryId: "c1",
          productName: "samsung E340",
          description: "slim",
          price: "200000.00",
          quantity: 30,
          status: "available",
          productRating: 5,
          productImage: null,
        },
        { productName: "missing id is dropped" },
      ],
    });

    const response = await marketService.getProducts();

    expect(fetchMock.mock.calls[0][0]).toBe("https://api.test/api/v1/product/get-all-products");
    expect(response.success).toBe(true);
    expect(response.data).toHaveLength(1);
    expect(response.data?.[0]).toMatchObject({ id: "p1", name: "samsung E340", price: 200000, quantity: 30 });
  });

  it("maps categories and purchases with buyer and product details", async () => {
    const { marketService } = await loadServices();
    respondWith({ success: true, data: [{ id: "c1", categoryName: "Phone", description: "d" }] });
    expect((await marketService.getCategories()).data).toEqual([
      { id: "c1", name: "Phone", description: "d" },
    ]);

    respondWith({
      success: true,
      data: [
        {
          id: "o1",
          productId: "p1",
          quantity: 1,
          totalPrice: "200000.00",
          totalAmountPaid: "25000.00",
          totalAmountDue: "175000.00",
          percentage: "12.50",
          purchaseStatus: "in-progress",
          user: { firstName: "Iyanoye", lastName: "George", email: "k@yopmail.com" },
          product: { productName: "samsung E340" },
        },
      ],
    });
    const purchases = await marketService.getPurchases();
    expect(purchases.data?.[0]).toMatchObject({
      buyerName: "Iyanoye George",
      productName: "samsung E340",
      totalAmountDue: 175000,
      percentage: 12.5,
      status: "in-progress",
    });
  });

  it("fails clearly when a list response is not a list", async () => {
    const { marketService } = await loadServices();
    respondWith({ success: true, data: { unexpected: true } });
    const response = await marketService.getProducts();
    expect(response.success).toBe(false);
    expect(response.error).toMatch(/did not contain a list/);
  });

  it("creates a product as multipart without forcing a JSON content type", async () => {
    const { marketService } = await loadServices();
    respondWith({
      success: true,
      data: { id: "p2", productName: "Rice", price: "40000.00", quantity: 10, status: "available" },
    });

    const response = await marketService.createProduct({
      categoryId: "cat 1",
      productName: "Rice",
      description: "Ilaje rice",
      price: 40000,
      quantity: 10,
      productRating: 5,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.test/api/v1/product/create-product/cat%201");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.headers).not.toHaveProperty("Content-Type");
    expect((init.body as FormData).get("productName")).toBe("Rice");
    expect((init.body as FormData).get("price")).toBe("40000");
    expect(response.data).toMatchObject({ id: "p2", price: 40000 });
  });

  it("still sends JSON content type on ordinary requests", async () => {
    const { marketService } = await loadServices();
    respondWith({ success: true, message: "Product deleted successfully" });

    const response = await marketService.deleteProduct("p/1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.test/api/v1/product/delete-product/p%2F1");
    expect(init.method).toBe("DELETE");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(response.success).toBe(true);
  });

  it("surfaces backend errors from failed deletes", async () => {
    const { marketService } = await loadServices();
    respondWith({ success: false, message: "Product not found" }, false, 404);
    const response = await marketService.deleteProduct("nope");
    expect(response).toMatchObject({ success: false, error: "Product not found" });
  });
});
