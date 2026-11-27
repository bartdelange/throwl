require 'minitest/autorun'
require 'ostruct'
require 'google/apis/androidpublisher_v3'
require_relative 'prepare_store_review'

class StoreReviewTest < Minitest::Test
  Play = Google::Apis::AndroidpublisherV3
  Release = {
    'version' => '5.1.2',
    'iosBuild' => '7',
    'androidBuild' => '45',
    'notes' => { 'en-US' => { 'whatsNew' => 'Team games', 'iosPromotionalText' => 'Play as a team' } }
  }.freeze

  class PlayService
    attr_reader :commit_options, :production, :edit_deleted

    def initialize(internal_code)
      @internal_code = internal_code
    end

    def list_application_track_releases(_track)
      releases = if commit_options
                   [OpenStruct.new(
                     release_name: '5.1.2', release_lifecycle_state: StoreReview::PLAY_DRAFT_STATE,
                     active_artifacts: [OpenStruct.new(version_code: 45)]
                   )]
                 else
                   []
                 end
      OpenStruct.new(releases: releases)
    end

    def insert_edit(_package)
      OpenStruct.new(id: 'test-edit')
    end

    def get_edit_track(_package, _edit, track)
      Play::Track.new(releases: [Play::TrackRelease.new(
        status: 'completed', version_codes: [track == 'internal' ? @internal_code : 44]
      )])
    end

    def update_edit_track(_package, _edit, _track, production)
      @production = production
    end

    def validate_edit(_package, _edit); end

    def commit_edit(_package, _edit, **options)
      @commit_options = options
    end

    def delete_edit(_package, _edit)
      @edit_deleted = true
    end
  end

  def test_play_prepares_exact_internal_bundle_and_does_not_send_it_for_review
    service = PlayService.new(45)
    StoreReview.prepare_android(service, Play, Release)

    candidate = service.production.releases.fetch(0)
    assert_equal [45], candidate.version_codes
    assert_equal 'Team games', candidate.release_notes.fetch(0).text
    assert_equal({
      changes_not_sent_for_review: true,
      changes_in_review_behavior: 'ERROR_IF_IN_REVIEW'
    }, service.commit_options)
  end

  def test_play_leaves_production_alone_when_the_requested_internal_bundle_is_missing
    service = PlayService.new(46)
    assert_raises(RuntimeError, /no longer on Play Internal/) do
      StoreReview.prepare_android(service, Play, Release)
    end
    assert_nil service.production
    assert_nil service.commit_options
    assert service.edit_deleted
  end

  def test_apple_attaches_the_tested_build_and_prepares_a_draft_without_submitting
    build = OpenStruct.new(id: 'beta-build', processing_state: 'VALID', expired: false)
    builder = Object.new
    builder.define_singleton_method(:all) do |**options|
      raise 'Wrong iOS build lookup' unless options == { app_id: 'app', version: '5.1.2', build_number: '7', platform: 'IOS' }

      [build]
    end
    api = Module.new
    api.const_set(:Build, builder)
    localization = OpenStruct.new(locale: 'en-US')
    localization.define_singleton_method(:update) do |attributes:|
      self.whats_new = attributes.fetch(:whatsNew)
      self.promotional_text = attributes.fetch(:promotionalText)
    end
    version = OpenStruct.new(id: 'version', app_version_state: 'PREPARE_FOR_SUBMISSION')
    version.define_singleton_method(:select_build) { |build_id:| self.build = build if build.id == build_id }
    version.define_singleton_method(:update) { |attributes:| self.release_type = attributes.fetch(:releaseType) }
    version.define_singleton_method(:get_app_store_version_localizations) { [localization] }

    draft = Object.new
    draft.define_singleton_method(:add_app_store_version_to_review_items) do |app_store_version_id:|
      version.app_version_state = 'READY_FOR_REVIEW' if app_store_version_id == version.id
    end
    app = OpenStruct.new(id: 'app')
    app.define_singleton_method(:get_app_store_versions) { |**| [version] }
    app.define_singleton_method(:get_review_submissions) { |**| [] }
    app.define_singleton_method(:create_review_submission) { |platform:| draft if platform == 'IOS' }

    StoreReview.prepare_ios(app, api, Release)

    assert_equal 'beta-build', version.build.id
    assert_equal 'MANUAL', version.release_type
    assert_equal 'Team games', localization.whats_new
    assert_equal 'Play as a team', localization.promotional_text
    assert_equal 'READY_FOR_REVIEW', version.app_version_state
  end
end
