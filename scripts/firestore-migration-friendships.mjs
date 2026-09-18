export const REVIEWED_LEGACY_FRIENDSHIP_RESOLUTIONS = new Map([
  [
    '5maRY5Uz7RfUkpvLOgYr39Hy7mJ2_eA5aK8DG9ybf5xIawEjqJh0LTXG3',
    {
      requester: '5maRY5Uz7RfUkpvLOgYr39Hy7mJ2',
      status: 'accepted',
      userIds: ['5maRY5Uz7RfUkpvLOgYr39Hy7mJ2', 'eA5aK8DG9ybf5xIawEjqJh0LTXG3'],
    },
  ],
]);

export function legacyRequesterId(value, referenceId) {
  return (
    referenceId(value) ??
    (typeof value === 'string' && value.length > 0 ? value : undefined)
  );
}

export function mergeLegacyFriendship(friendships, id, candidate, errors) {
  const prior = friendships.get(id);
  if (
    prior &&
    (prior.status !== candidate.status ||
      prior.requester !== candidate.requester)
  ) {
    const reviewedResolution = REVIEWED_LEGACY_FRIENDSHIP_RESOLUTIONS.get(id);
    if (reviewedResolution) {
      // This exact PROD legacy pair contains reciprocal accepted entries and
      // reciprocal pending entries without chronology metadata. Its accepted
      // resolution was reviewed explicitly; this is not a general precedence
      // rule for other contradictory friendships.
      friendships.set(id, reviewedResolution);
      return;
    }
    errors.push(
      `legacy friendship ${id} is inconsistent between user documents`,
    );
    return;
  }
  friendships.set(id, candidate);
}

export function hasValidPendingRequester(friendship) {
  return (
    friendship.status !== 'pending' ||
    friendship.userIds.includes(friendship.requester)
  );
}
