import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeWebsiteInput } from "../lib/url-input.ts";

test("portfolio and public websites normalize to valid URLs", () => {
  assert.equal(normalizeWebsiteInput("pramadion.com"), "https://pramadion.com/");
  assert.equal(normalizeWebsiteInput(" https://pramadion.com/ "), "https://pramadion.com/");
  assert.equal(normalizeWebsiteInput("https://example.com/work?a=1"), "https://example.com/work?a=1");
});

test("tokens and identifiers are not mistaken for website addresses", () => {
  for (const input of [
    "A".repeat(40), "this_looks_like_an_api_key", "secret-token-without-domain",
    "http://localhost/", "https://test_site.com/", "javascript:alert(1)",
    "https://user:password@example.com/", "ftp://example.com/",
    "https://example.com:8080/", "not a website"
  ]) assert.throws(() => normalizeWebsiteInput(input), undefined, input);
});
