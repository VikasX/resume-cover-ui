import { categorizeSkills, uniqueSkills } from "./skills";
import { normalizeAnalysis } from "./normalizeAnalysis";
test("categorizes prefixed, case-insensitive, and versioned skills without losing unknown entries", () => {
  const input = [
    "Backend & APIs: Python",
    "PYTHON",
    "React.js",
    "React 19",
    "PostgreSQL",
    "LangChain",
    "Docker",
    "Facilitation",
    "Custom: Tool",
    null,
  ];
  const result = Object.fromEntries(categorizeSkills(input));
  expect(result["Backend & APIs"]).toEqual(["Python"]);
  expect(result.Frontend).toEqual(["React.js"]);
  expect(result.Databases).toEqual(["PostgreSQL"]);
  expect(result["AI / GenAI"]).toEqual(["LangChain"]);
  expect(result["Testing & DevOps"]).toEqual(["Docker"]);
  expect(result["Other / Unclassified"]).toEqual([
    "Facilitation",
    "Custom: Tool",
  ]);
  expect(input[0]).toBe("Backend & APIs: Python");
});
test("handles missing skill arrays and malformed responses", () => {
  expect(uniqueSkills(["ISO 27001", "ISO 9001"])).toEqual([
    "ISO 27001",
    "ISO 9001",
  ]);
  expect(uniqueSkills(undefined)).toEqual([]);
  expect(normalizeAnalysis(null)).toEqual({
    name: "",
    experience: "",
    domain_expertise: [],
    cover_letter: "",
  });
  expect(
    normalizeAnalysis({
      experience: 0,
      domain_expertise: ["Python", 5, ""],
      cover_letter: {},
    }),
  ).toEqual({
    name: "",
    experience: 0,
    domain_expertise: ["Python"],
    cover_letter: "",
  });
});
