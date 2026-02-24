const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || "9cc626bfa899d9b3d0944ce76989703b6a46da2f" // Using secret from .env.local if possible, or I'll just use the env var
});

const owner = "akshitkala";
const repo = "test";

async function pushHero() {
  const content = `
import React from 'react';

export default function Hero() {
  return (
    <section className="bg-blue-600 text-white p-20 text-center">
      <h1 className="text-5xl font-bold">Welcome to Semester Swap</h1>
      <p className="text-xl mt-4">The best place to swap your books and notes.</p>
      <button className="bg-white text-blue-600 px-6 py-2 mt-8 rounded-full font-semibold">
        Get Started
      </button>
    </section>
  );
}
`;

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: "components/Hero.tsx",
      message: "Add Hero component for testing",
      content: Buffer.from(content).toString("base64"),
      branch: "master"
    });
    console.log("Successfully pushed Hero.tsx to akshitkala/test");
  } catch (err) {
    console.error("Failed to push Hero.tsx:", err.message);
  }
}

pushHero();
