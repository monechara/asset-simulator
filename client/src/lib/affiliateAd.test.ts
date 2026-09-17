import { describe, expect, it } from "vitest";
import {
  MONEX_AD_HREF,
  MONEX_AD_IMPRESSION,
  MONEX_AD_HTML,
} from "./affiliateAd";

describe("Monex affiliate ad", () => {
  it("keeps the issued tracking URLs and required disclosure attributes unchanged", () => {
    expect(MONEX_AD_HREF).toBe(
      "https://h.accesstrade.net/sp/cc?rk=0100n99f00oylp"
    );
    expect(MONEX_AD_IMPRESSION).toBe(
      "https://h.accesstrade.net/sp/rr?rk=0100n99f00oylp"
    );
    expect(MONEX_AD_HTML).toBe(
      '<a href="https://h.accesstrade.net/sp/cc?rk=0100n99f00oylp" rel="nofollow" referrerpolicy="no-referrer-when-downgrade"><img src="https://h.accesstrade.net/sp/rr?rk=0100n99f00oylp" alt="株・投資信託ならネット証券のマネックス" border="0" width="234" height="60"></a>'
    );
  });
});
