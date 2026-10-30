import { encodedCodec } from "./encoded-codec";

/**
 * 端末に保存するとき、どちらを落とすか。`encoded` は主 (`library_path`)、`alt` はもう1本 (`alt_path`)。
 *
 * **主が何で焼かれているかを先に見る。** 主は AV1 とは限らない — H.264 だけ焼いた録画
 * (設定で H.264 だけを選んだ・AV1 のほうを消した) は H.264 が主で、もう1本は無い。主を
 * AV1 と決め打ちしていた頃は、AV1 を解けない端末 (と判定された iPhone) でその録画を
 * 保存すると「AV1 を再生できず、H.264 のものもありません」と断っていた。H.264 は
 * どの端末でも解けるので、そのまま主を落とせばよい。
 *
 * 主が AV1 なら、端末が解けるときは主、解けなければ H.264 の `alt`、それも無ければ断る
 * (保存できても観られないため)。`av1` は問い合わせの口で、要るときにだけ呼ぶ
 *
 * @param libraryPath 主の置き場 (`library_path`)。無ければ (まだ焼けていない) 主を AV1 とみなす
 * @param altPath もう1本 (`alt_path`)。無ければ null
 */
export async function offlineSource(
  libraryPath: string | null,
  altPath: string | null,
  av1: () => Promise<boolean>,
): Promise<"encoded" | "alt"> {
  if (libraryPath !== null && encodedCodec(libraryPath) === "h264")
    return "encoded";
  if (await av1()) return "encoded";
  if (altPath === null)
    throw new Error("AV1 を再生できず、H.264 のものもありません");
  return "alt";
}
