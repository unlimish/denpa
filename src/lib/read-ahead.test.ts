import { describe, expect, test } from "bun:test";

import { mayRead, type ReadLimits } from "./read-ahead";

const limits: ReadLimits = {
  ahead: 30,
  earlyBytes: 8 * 1024 * 1024,
  floorBytes: 2 * 1024 * 1024,
  low: 1,
};
const MB = 1024 * 1024;

describe("mayRead", () => {
  test("手元が上限を超えたら待つ", () => {
    expect(
      mayRead({ lead: 31, fed: 0, played: 0, rate: undefined }, limits),
    ).toBe(false);
    expect(mayRead({ lead: 31, fed: 0, played: 0, rate: 1 * MB }, limits)).toBe(
      false,
    );
  });

  test("サーバから流すときは、デコードし始める前だけバイト数で区切る (前のまま)", () => {
    expect(
      mayRead({ lead: 0, fed: 1 * MB, played: 0, rate: undefined }, limits),
    ).toBe(true);
    expect(
      mayRead({ lead: 0, fed: 9 * MB, played: 0, rate: undefined }, limits),
    ).toBe(false);
    expect(
      mayRead({ lead: 5, fed: 500 * MB, played: 0, rate: undefined }, limits),
    ).toBe(true);
  });

  test("Blob は観ている位置より先まで読みすぎない", () => {
    // 平均 0.3MB/秒。30 秒先の 1.5 倍 ≒ 13.5MB まで
    const rate = 0.3 * MB;
    expect(mayRead({ lead: 10, fed: 10 * MB, played: 0, rate }, limits)).toBe(
      true,
    );
    expect(mayRead({ lead: 10, fed: 20 * MB, played: 0, rate }, limits)).toBe(
      false,
    );
    // 観たぶんだけ先へ読める
    expect(mayRead({ lead: 10, fed: 20 * MB, played: 30, rate }, limits)).toBe(
      true,
    );
  });

  test("重い場面で上限に当たっても、手元が尽きる前に読み直す (止まったまま戻らない、にしない)", () => {
    const rate = 0.3 * MB;
    // 平均の2倍の場面: 観た 20 秒で 20 秒先まで 2 倍の速さで読んだ = 上限を超えている
    const state = { fed: 2 * (20 + 30) * rate, played: 20, rate };
    expect(mayRead({ ...state, lead: 5 }, limits)).toBe(false);
    // 手元が 1 秒を切った・使い切った
    expect(mayRead({ ...state, lead: 0.5 }, limits)).toBe(true);
    expect(mayRead({ ...state, lead: 0 }, limits)).toBe(true);
  });

  test("Blob はデコードし始める前でも、頭と最初のキーフレームのぶんは読む", () => {
    expect(
      mayRead({ lead: 0, fed: 1 * MB, played: 0, rate: 1000 }, limits),
    ).toBe(true);
  });
});
