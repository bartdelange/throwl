import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const pending = '<!-- throwl-store-status: pending -->';
const ready = '<!-- throwl-store-status: ready -->';
const readyText =
  '**Both stores are ready to submit.** Open App Store Connect and Play Console to send each release for review.';

function singleMatch(text, pattern, message) {
  const matches = [...text.matchAll(pattern)];
  if (matches.length !== 1) throw new Error(message);
  return matches[0][1];
}

export function readStoreNotes(body) {
  const json = singleMatch(
    body,
    /<!-- throwl-store-notes -->\r?\n```json\r?\n([\s\S]*?)\r?\n```/g,
    'Keep exactly one store-notes JSON block in the GitHub draft.',
  );
  const notes = JSON.parse(json);
  if (!notes?.['en-US'] || Array.isArray(notes)) {
    throw new Error('Store notes must include en-US.');
  }

  for (const [locale, entry] of Object.entries(notes)) {
    if (
      !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(locale) ||
      !entry ||
      typeof entry !== 'object'
    ) {
      throw new Error(`Invalid store locale or entry: ${locale}`);
    }
    const text = entry.whatsNew;
    if (typeof text !== 'string' || !text.trim() || [...text].length > 500) {
      throw new Error(`${locale} What’s New must contain 1–500 characters.`);
    }
    if (
      entry.iosPromotionalText !== undefined &&
      (typeof entry.iosPromotionalText !== 'string' ||
        [...entry.iosPromotionalText].length > 170)
    ) {
      throw new Error(
        `${locale} iOS promotional text must be at most 170 characters.`,
      );
    }
  }
  return notes;
}

export function readReleaseIdentity(tag, appVersion, gradle, xcode) {
  if (!/^v\d+\.\d+\.\d+$/.test(tag) || tag !== `v${appVersion}`) {
    throw new Error('The release tag and app package version must match.');
  }
  const androidBuild = singleMatch(
    gradle,
    /^\s*versionCode\s+(\d+)\s*$/gm,
    'Expected one Android version code.',
  );
  const androidVersion = singleMatch(
    gradle,
    /^\s*versionName\s+"([^"]+)"\s*$/gm,
    'Expected one Android version name.',
  );
  const iosBuilds = [
    ...new Set(
      [...xcode.matchAll(/^\s*CURRENT_PROJECT_VERSION\s*=\s*(\d+);\s*$/gm)].map(
        (match) => match[1],
      ),
    ),
  ];
  if (iosBuilds.length !== 1) throw new Error('iOS build numbers must agree.');
  const iosVersions = [
    ...new Set(
      [...xcode.matchAll(/^\s*MARKETING_VERSION\s*=\s*([\d.]+);\s*$/gm)].map(
        (match) => match[1],
      ),
    ),
  ];
  if (
    androidVersion !== appVersion ||
    iosVersions.length !== 1 ||
    iosVersions[0] !== appVersion
  ) {
    throw new Error(
      'The native marketing versions must match the tagged app version.',
    );
  }
  return { version: appVersion, androidBuild, iosBuild: iosBuilds[0] };
}

const pendingText =
  '**Production review drafts have not been prepared.** Test the uploaded builds, then run Prepare store submissions.';

const pendingHeader = `${pending}\n${pendingText}`;
const readyHeader = `${ready}\n${readyText}`;

export function withDraftStatus(body) {
  return body.startsWith(pendingHeader) ? body : `${pendingHeader}\n\n${body}`;
}

export function draftTemplate() {
  return withDraftStatus(`## Changes

<!-- throwl-store-notes -->
\`\`\`json
{
  "en-US": {
    "whatsNew": "",
    "iosPromotionalText": ""
  }
}
\`\`\`

`);
}

export function markReady(body) {
  if (body.startsWith(readyHeader)) return body;
  if (!body.startsWith(pendingHeader)) {
    throw new Error('The draft is missing its store status header.');
  }
  return readyHeader + body.slice(pendingHeader.length);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [command, source, output] = process.argv.slice(2);
  if (command === 'notes') {
    process.stdout.write(
      await readFile(process.env.THROWL_RELEASE_NOTES_FILE, 'utf8'),
    );
  } else if (command === 'snapshot') {
    const release = JSON.parse(await readFile(source, 'utf8'));
    if (!release.draft || release.tag_name !== process.env.RELEASE_TAG) {
      throw new Error(
        'Expected the GitHub draft for the selected release tag.',
      );
    }
    markReady(release.body);
    if (!/^v\d+\.\d+\.\d+$/.test(release.tag_name)) {
      throw new Error('Expected a version tag such as v5.1.2.');
    }
    const taggedFile = (path) =>
      execFileSync('git', ['show', `refs/tags/${release.tag_name}:${path}`], {
        encoding: 'utf8',
      });
    const identity = readReleaseIdentity(
      release.tag_name,
      JSON.parse(taggedFile('apps/throwl/package.json')).version,
      taggedFile('apps/throwl/android/app/build.gradle'),
      taggedFile('apps/throwl/ios/Throwl.xcodeproj/project.pbxproj'),
    );
    await writeFile(
      output,
      JSON.stringify({
        ...identity,
        id: release.id,
        body: release.body,
        notes: readStoreNotes(release.body),
      }),
    );
  } else if (command === 'ready') {
    const snapshot = JSON.parse(await readFile(source, 'utf8'));
    const current = JSON.parse(await readFile(process.argv[5], 'utf8'));
    if (!current.draft || current.body !== snapshot.body) {
      throw new Error(
        'The GitHub draft changed during preparation. Rerun with the current notes.',
      );
    }
    await writeFile(output, JSON.stringify({ body: markReady(snapshot.body) }));
  } else {
    throw new Error('Expected notes, snapshot or ready.');
  }
}
