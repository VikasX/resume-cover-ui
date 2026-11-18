export function normalizeAnalysis(response) {
  const data = response && typeof response === "object" ? response : {};
  return {
    name: typeof data.name === "string" ? data.name : "",
    experience:
      typeof data.experience === "number" || typeof data.experience === "string"
        ? data.experience
        : "",
    domain_expertise: Array.isArray(data.domain_expertise)
      ? data.domain_expertise.filter(
          (skill) => typeof skill === "string" && skill.trim(),
        )
      : [],
    cover_letter:
      typeof data.cover_letter === "string" ? data.cover_letter : "",
  };
}
