import { describe, expect, test } from "bun:test";

import { offlineSource } from "./offline-source";

const yes = async () => true;
const no = async () => false;

describe("offlineSource", () => {
  test("H.264 だけの録画は、AV1 を解けない端末でも主を落とす", async () => {
    expect(await offlineSource("/m/番組/番組 #1 [H264].mkv", null, no)).toBe(
      "encoded",
    );
  });

  test("H.264 が主なら AV1 を問い合わせない", async () => {
    let asked = false;
    const ask = async () => {
      asked = true;
      return false;
    };
    await offlineSource("/m/番組/番組 #1 [H264].mkv", null, ask);
    expect(asked).toBe(false);
  });

  test("AV1 が主で、端末が解けるなら主", async () => {
    expect(
      await offlineSource(
        "/m/番組/番組 #1.mkv",
        "/m/番組/番組 #1 [H264].mkv",
        yes,
      ),
    ).toBe("encoded");
  });

  test("AV1 が主で、端末が解けないなら H.264 のもう1本", async () => {
    expect(
      await offlineSource(
        "/m/番組/番組 #1.mkv",
        "/m/番組/番組 #1 [H264].mkv",
        no,
      ),
    ).toBe("alt");
  });

  test("AV1 だけの録画を、AV1 を解けない端末では断る", async () => {
    await expect(
      offlineSource("/m/番組/番組 #1.mkv", null, no),
    ).rejects.toThrow("AV1 を再生できず");
  });
});
