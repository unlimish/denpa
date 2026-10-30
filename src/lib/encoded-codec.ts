/**
 * 保存先の名前 (`… [H264].mkv`) からコーデックを見分ける (`server/library.ts` の `encodedPath` の逆)。
 *
 * **画面からも使う** (端末に保存するとき、どちらを落とすか。`offline-source.ts`)。
 * `server/library.ts` は設定やファイルを読むので画面からは読み込めない。名前の決まりは
 * あちらにあり、ここは見分けるだけ
 */
export function encodedCodec(path: string): "av1" | "h264" | "mpeg2" {
  // エンコードしない録画は元のTS (`.m2ts`) をそのまま保存先に置く (`recorder.ts`)
  if (/\.m2ts$/i.test(path)) return "mpeg2";
  return / \[H264\]\.mkv$/i.test(path) ? "h264" : "av1";
}
