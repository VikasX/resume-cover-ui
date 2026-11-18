const groups = {
  "Backend & APIs": [
    "python",
    "fastapi",
    "django",
    "flask",
    "nodejs",
    "express",
    "java",
    "spring",
    "c#",
    ".net",
    "golang",
    "go",
    "rust",
    "php",
    "ruby",
    "rails",
    "graphql",
    "grpc",
    "rest",
    "restapi",
    "kafka",
  ],
  Frontend: [
    "react",
    "reactjs",
    "nextjs",
    "vue",
    "vuejs",
    "angular",
    "javascript",
    "typescript",
    "html",
    "html5",
    "css",
    "css3",
    "tailwindcss",
    "tailwind",
    "sass",
    "redux",
    "zustand",
    "svelte",
  ],
  Databases: [
    "sql",
    "mysql",
    "postgres",
    "postgresql",
    "mongodb",
    "redis",
    "sqlite",
    "dynamodb",
    "supabase",
    "prisma",
    "elasticsearch",
    "oracle",
  ],
  "AI / GenAI": [
    "ai",
    "genai",
    "machinelearning",
    "deeplearning",
    "langchain",
    "llamaindex",
    "openai",
    "openaiapi",
    "rag",
    "ragpipelines",
    "llm",
    "llms",
    "tensorflow",
    "pytorch",
    "vectordb",
    "nlp",
  ],
  "Testing & DevOps": [
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "git",
    "githubactions",
    "cicd",
    "jenkins",
    "terraform",
    "jest",
    "vitest",
    "playwright",
    "cypress",
    "pytest",
    "selenium",
    "linux",
  ],
};
const aliases = {
  reactjs: "react",
  vuejs: "vue",
  postgresql: "postgres",
  tailwindcss: "tailwind",
  golang: "go",
};
const canonical = (value) => {
  const normalized = value.toLowerCase().replace(/[\s._/-]/g, "");
  return aliases[normalized] || normalized;
};
const recognized = new Set(Object.values(groups).flat().map(canonical));
const key = (value) => {
  const unversioned = canonical(value.replace(/\s+v?\d+(\.\d+)*$/i, ""));
  // Only known technologies share version aliases; unknown labels stay intact.
  return recognized.has(unversioned) ? unversioned : canonical(value);
};
const categoryNames = [...Object.keys(groups), "Other / Unclassified"];
export function uniqueSkills(skills) {
  const seen = new Set();
  return (Array.isArray(skills) ? skills : [])
    .filter((skill) => typeof skill === "string" && skill.trim())
    .map((skill) => {
      const colon = skill.indexOf(":");
      return colon > -1 &&
        categoryNames.some(
          (category) => key(category) === key(skill.slice(0, colon)),
        )
        ? skill.slice(colon + 1).trim() || skill.trim()
        : skill.trim();
    })
    .filter((skill) => {
      const id = key(skill);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
}
export function categorizeSkills(skills) {
  const result = Object.fromEntries(categoryNames.map((name) => [name, []]));
  uniqueSkills(skills).forEach((skill) => {
    const category =
      Object.entries(groups).find(([, values]) =>
        values.some((value) => key(value) === key(skill)),
      )?.[0] || "Other / Unclassified";
    result[category].push(skill);
  });
  return Object.entries(result).filter(([, values]) => values.length);
}
