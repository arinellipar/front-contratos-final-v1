import { renderHook, act } from "@testing-library/react";
import { useCurrencyFormat } from "@/hooks/useNumberFormat";

// Mock para renderHook
const renderHookWithDefaults = (hook: any) => {
  const result = { current: hook() };
  return { result };
};

describe("useNumberFormat", () => {
  test("should format currency correctly", () => {
    const { result } = renderHookWithDefaults(() => useCurrencyFormat(0));

    act(() => {
      result.current.handleChange("60000");
    });

    expect(result.current.rawValue).toBe(60000);
    expect(result.current.formattedValue).toBe("60.000");
  });

  test("should accept comma as thousands separator", () => {
    const { result } = renderHookWithDefaults(() => useCurrencyFormat(0));

    act(() => {
      result.current.handleChange("60,000");
    });

    expect(result.current.rawValue).toBe(60000);
  });

  test("should accept dot as thousands separator", () => {
    const { result } = renderHookWithDefaults(() => useCurrencyFormat(0));

    act(() => {
      result.current.handleChange("60.000");
    });

    expect(result.current.rawValue).toBe(60000);
  });

  test("should handle decimal values with comma", () => {
    const { result } = renderHookWithDefaults(() => useCurrencyFormat(0));

    act(() => {
      result.current.handleChange("60.000,50");
    });

    expect(result.current.rawValue).toBe(60000.5);
  });

  test("should handle decimal values with dot", () => {
    const { result } = renderHookWithDefaults(() => useCurrencyFormat(0));

    act(() => {
      result.current.handleChange("60,000.50");
    });

    expect(result.current.rawValue).toBe(60000.5);
  });

  test("should validate minimum value", () => {
    const { result } = renderHookWithDefaults(() => useCurrencyFormat(0));

    act(() => {
      result.current.handleChange("-100");
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.error).toContain("maior que");
  });

  test("should validate maximum value", () => {
    const { result } = renderHookWithDefaults(() => useCurrencyFormat(0));

    act(() => {
      result.current.handleChange("9999999999");
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.error).toContain("menor que");
  });
});
