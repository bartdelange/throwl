import { readFile, writeFile } from 'node:fs/promises';

const [command, source, output, currentDraft] = process.argv.slice(2);
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const snapshot = await readJson(source);

function storeNotes(body) {
  const blocks = [
    ...body.matchAll(
      /<!-- throwl-store-notes -->\s*```json\r?\n([\s\S]*?)\r?\n```/g,
    ),
  ];
  if (blocks.length !== 1)
    throw new Error('Keep one store-notes JSON block in the GitHub draft.');

  const notes = JSON.parse(blocks[0][1]);
  if (!notes?.['en-US']) throw new Error('Store notes must include en-US.');
  for (const [locale, entry] of Object.entries(notes)) {
    const { whatsNew, iosPromotionalText } = entry ?? {};
    if (
      !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(locale) ||
      typeof whatsNew !== 'string' ||
      !whatsNew.trim() ||
      [...whatsNew].length > 500
    ) {
      throw new Error(
        `Invalid locale or What’s New text for ${locale} (maximum 500 characters).`,
      );
    }
    if (
      iosPromotionalText !== undefined &&
      (typeof iosPromotionalText !== 'string' ||
        [...iosPromotionalText].length > 170)
    ) {
      throw new Error(
        `${locale} iOS promotional text must contain at most 170 characters.`,
      );
    }
  }
  return notes;
}

function nativeValue(file, pattern, field) {
  const values = new Set([...file.matchAll(pattern)].map((match) => match[1]));
  if (values.size !== 1)
    throw new Error(
      `Expected one value for ${field} in the tagged build settings.`,
    );
  return values.values().next().value;
}

let result;
if (command === 'snapshot') {
  const { version } = await readJson('apps/throwl/package.json');
  if (
    !snapshot.draft ||
    snapshot.tag_name !== process.env.RELEASE_TAG ||
    snapshot.tag_name !== `v${version}`
  ) {
    throw new Error(
      'Expected the GitHub draft matching the tagged app version.',
    );
  }

  const gradle = await readFile('apps/throwl/android/app/build.gradle', 'utf8');
  const xcode = await readFile(
    'apps/throwl/ios/Throwl.xcodeproj/project.pbxproj',
    'utf8',
  );
  const androidVersion = nativeValue(
    gradle,
    /^\s*versionName\s+"([^"]+)"\s*$/gm,
    'Android version',
  );
  const iosVersion = nativeValue(
    xcode,
    /^\s*MARKETING_VERSION\s*=\s*([\d.]+);\s*$/gm,
    'iOS version',
  );
  if (androidVersion !== version || iosVersion !== version)
    throw new Error('Native versions must match the tag.');

  result = {
    id: snapshot.id,
    body: snapshot.body,
    version,
    androidBuild: nativeValue(
      gradle,
      /^\s*versionCode\s+(\d+)\s*$/gm,
      'Android build',
    ),
    iosBuild: nativeValue(
      xcode,
      /^\s*CURRENT_PROJECT_VERSION\s*=\s*(\d+);\s*$/gm,
      'iOS build',
    ),
    notes: storeNotes(snapshot.body),
  };
} else if (command === 'ready') {
  const draft = await readJson(currentDraft);
  if (
    !draft.draft ||
    draft.id !== snapshot.id ||
    draft.body !== snapshot.body
  ) {
    throw new Error(
      'The GitHub draft changed during preparation. Rerun with the current notes.',
    );
  }
  const body = draft.body.replace(
    /^<!-- throwl-store-status: (?:pending|ready) -->\s*(?:\*\*(?:Production review drafts have not been prepared|Both stores are ready to submit)\.\*\*[^\r\n]*\s*)?/,
    '',
  );
  result = {
    body: `<!-- throwl-store-status: ready -->\n**Both stores are ready to submit.** Open App Store Connect and Play Console to send each release for review.\n\n${body}`,
  };
} else {
  throw new Error('Expected snapshot or ready.');
}
await writeFile(output, JSON.stringify(result));
