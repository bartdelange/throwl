require 'json'

module StoreReview
  MANUAL_RELEASE = 'MANUAL'
  PLAY_DRAFT_STATE = 'RELEASE_LIFECYCLE_STATE_NOT_SENT_FOR_REVIEW'
  PLAY_PACKAGE = 'com.throwl'

  def self.wait_for_store
    6.times.any? do |attempt|
      sleep(5) if attempt.positive?
      yield
    end
  end

  def self.prepare_ios(app, api, release)
    version_name = release.fetch('version')
    build_number = release.fetch('iosBuild')
    builds = api::Build.all(app_id: app.id, version: version_name, build_number: build_number, platform: 'IOS')
    build = builds.find { |candidate| candidate.processing_state == 'VALID' && !candidate.expired }
    raise "iOS #{version_name} build #{build_number} is unavailable or still processing. Check App Store Connect and retry." unless build

    version_filter = { platform: 'IOS', versionString: version_name }
    version = app.get_app_store_versions(filter: version_filter, includes: 'build').first
    unless version
      api.post_app_store_version(app_id: app.id, attributes: { platform: 'IOS', versionString: version_name, releaseType: MANUAL_RELEASE })
      version = app.get_app_store_versions(filter: version_filter, includes: 'build').first
    end
    raise "Could not read App Store version #{version_name}." unless version

    state = version.app_version_state || version.app_store_state
    unless %w[PREPARE_FOR_SUBMISSION READY_FOR_REVIEW].include?(state)
      raise "App Store version #{version_name} is #{state}. Resolve its existing review state before retrying."
    end
    if state == 'READY_FOR_REVIEW' && version.build&.id != build.id
      raise 'A different iOS build is already attached to the draft review submission.'
    end
    version.select_build(build_id: build.id) if version.build&.id != build.id
    version.update(attributes: { releaseType: MANUAL_RELEASE }) if version.release_type != MANUAL_RELEASE

    localizations = version.get_app_store_version_localizations
    release.fetch('notes').each do |locale, notes|
      localization = localizations.find { |item| item.locale == locale }
      raise "Configure the #{locale} locale in App Store Connect before retrying." unless localization

      attributes = { whatsNew: notes.fetch('whatsNew') }
      attributes[:promotionalText] = notes['iosPromotionalText'] if notes.key?('iosPromotionalText')
      if localization.whats_new != attributes[:whatsNew] ||
         (attributes.key?(:promotionalText) && localization.promotional_text.to_s != attributes[:promotionalText])
        localization.update(attributes: attributes)
      end
    end

    filter = { platform: 'IOS', state: 'READY_FOR_REVIEW' }
    drafts = app.get_review_submissions(filter: filter, includes: 'appStoreVersionForReview,items')
    draft = drafts.find do |item|
      item.app_store_version_for_review&.id == version.id ||
        Array(item.items).any? { |entry| entry.app_store_version&.id == version.id }
    end
    unless draft
      # An earlier attempt can leave an empty draft before the version was attached.
      raise 'Another iOS review draft exists. Review it in App Store Connect before retrying.' if drafts.any? { |item| item.app_store_version_for_review || !Array(item.items).empty? }

      draft = drafts.first || app.create_review_submission(platform: 'IOS')
      draft.add_app_store_version_to_review_items(app_store_version_id: version.id)
    end

    confirmed = wait_for_store do
      selected = app.get_app_store_versions(filter: version_filter, includes: 'build').first
      selected&.build&.id == build.id &&
        selected.release_type == MANUAL_RELEASE &&
        (selected.app_version_state || selected.app_store_state) == 'READY_FOR_REVIEW'
    end
    unless confirmed
      raise 'App Store Connect has not confirmed the expected build in a manual review draft. Check the console and retry.'
    end
    puts "iOS #{version_name} (#{build_number}) is ready for manual submission."
  end

  def self.prepare_android(service, api, release)
    code = Integer(release.fetch('androidBuild'), 10)
    version = release.fetch('version')
    production = "applications/#{PLAY_PACKAGE}/tracks/production"
    existing = service.list_application_track_releases(production).releases || []
    target = existing.find { |item| Array(item.active_artifacts).any? { |artifact| artifact.version_code.to_i == code } }
    if target && target.release_lifecycle_state != PLAY_DRAFT_STATE
      raise "Android build #{code} already has a production release in state #{target.release_lifecycle_state}."
    end
    if existing.any? { |item| item != target && item.release_lifecycle_state != 'RELEASE_LIFECYCLE_STATE_PUBLISHED' }
      raise 'Another Google Play production release is pending. Resolve it in Play Console before retrying.'
    end

    edit = service.insert_edit(PLAY_PACKAGE)
    committed = false
    begin
      internal = service.get_edit_track(PLAY_PACKAGE, edit.id, 'internal')
      unless Array(internal.releases).any? { |item| Array(item.version_codes).map(&:to_i).include?(code) }
        raise "Android build #{code} is no longer on Play Internal. Verify the candidate before preparing production."
      end

      track = service.get_edit_track(PLAY_PACKAGE, edit.id, 'production')
      releases = Array(track.releases)
      if releases.any? { |item| %w[inProgress halted].include?(item.status) || Array(item.version_codes).any? { |value| value.to_i > code } }
        raise 'A staged, halted or newer Google Play release exists. Resolve it before preparing this candidate.'
      end

      notes = release.fetch('notes').map do |locale, entry|
        api::LocalizedText.new(language: locale, text: entry.fetch('whatsNew'))
      end
      target_release = api::TrackRelease.new(name: version, version_codes: [code], release_notes: notes, status: 'completed')
      service.update_edit_track(PLAY_PACKAGE, edit.id, 'production', api::Track.new(track: 'production', releases: [target_release]))
      service.validate_edit(PLAY_PACKAGE, edit.id)
      # Never fall back to Fastlane's automatic commit retry or omit either guard.
      service.commit_edit(PLAY_PACKAGE, edit.id, changes_not_sent_for_review: true, changes_in_review_behavior: 'ERROR_IF_IN_REVIEW')
      committed = true
    ensure
      unless committed
        begin
          service.delete_edit(PLAY_PACKAGE, edit.id)
        rescue Google::Apis::Error
          # Expired or concurrently invalidated edits need no further cleanup.
        end
      end
    end

    saved = wait_for_store do
      Array(service.list_application_track_releases(production).releases).any? do |item|
        item.release_name == version &&
          item.release_lifecycle_state == PLAY_DRAFT_STATE &&
          Array(item.active_artifacts).map { |artifact| artifact.version_code.to_i } == [code]
      end
    end
    raise "Play Console has not confirmed Android build #{code} is waiting for manual review submission. Check Publishing overview." unless saved

    puts "Android #{version} (#{code}) is ready for manual submission."
  end
end

if $PROGRAM_NAME == __FILE__
  platform, path = ARGV
  release = JSON.parse(File.read(path))
  case platform
  when 'ios'
    require 'spaceship'
    api = Spaceship::ConnectAPI
    api.token = api::Token.create(key_id: ENV.fetch('APPLE_KEY_ID'), issuer_id: ENV.fetch('APPLE_ISSUER_ID'), key: ENV.fetch('APPLE_KEY_CONTENT'))
    app = api::App.find(ENV.fetch('DEVELOPER_APP_IDENTIFIER'))
    raise 'App Store Connect app was not found.' unless app

    StoreReview.prepare_ios(app, api, release)
  when 'android'
    require 'base64'
    require 'google/apis/androidpublisher_v3'
    require 'googleauth'
    require 'stringio'
    api = Google::Apis::AndroidpublisherV3
    service = api::AndroidPublisherService.new
    service.authorization = Google::Auth::ServiceAccountCredentials.make_creds(
      json_key_io: StringIO.new(Base64.strict_decode64(ENV.fetch('PLAY_CONFIG_JSON'))),
      scope: api::AUTH_ANDROIDPUBLISHER
    )
    StoreReview.prepare_android(service, api, release)
  else
    raise 'Expected ios or android.'
  end
end
