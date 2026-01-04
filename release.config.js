module.exports = {
  // Define the branches that trigger a release
  branches: ['main'],
  plugins: [
    // Analyze commit messages to determine the next version
    '@semantic-release/commit-analyzer',
    // Generate release notes based on the commits
    '@semantic-release/release-notes-generator',
    // Update the CHANGELOG.md file with the release notes
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    // Commit the updated CHANGELOG.md to the repository
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    // Create a GitHub release
    '@semantic-release/github',
  ],
};
