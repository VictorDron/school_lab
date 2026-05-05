import { describe, expect, it, vi } from "vitest";

vi.mock("../config/redis.js", () => ({
  redis: {
    get: vi.fn(),
  },
}));

import { parseMentions } from "../services/mention.service.js";

describe("parseMentions", () => {
  it("parses bracket mentions with full display names", () => {
    expect(parseMentions("Oi @[Maria Clara], veja isso")).toEqual([
      { type: "user", displayName: "Maria Clara" },
    ]);
  });

  it("keeps support for @here, @channel and legacy single-word mentions", () => {
    expect(parseMentions("Aviso para @here, @channel e @joao")).toEqual([
      { type: "here" },
      { type: "channel" },
      { type: "user", displayName: "joao" },
    ]);
  });

  it("deduplicates repeated mentions", () => {
    expect(
      parseMentions("@[Ana Maria] falou com @[Ana Maria] e @here @here"),
    ).toEqual([{ type: "user", displayName: "Ana Maria" }, { type: "here" }]);
  });
});
