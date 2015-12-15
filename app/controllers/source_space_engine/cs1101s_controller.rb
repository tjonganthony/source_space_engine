require_dependency "source_space_engine/application_controller"

module SourceSpaceEngine
  class Cs1101sController < ApplicationController
    before_action :set_cs1101, only: [:show]

    # GET /cs1101s
    def index
    end

    def assets
      data = open("#{SourceSpaceEngine::Engine.root}/app/assets/images/"+
        "source_space_engine/#{params[:folders]}/#{params[:filename]}")
      send_data data.read
    end

    def storyXML
      data = open("#{SourceSpaceEngine::Engine.root}/app/assets/"+
        "storyXML/#{params[:filename]}")
      send_data data.read
    end

    private
      # Use callbacks to share common setup or constraints between actions.
      def set_cs1101
        @cs1101 = Cs1101.find(params[:id])
      end

      # Only allow a trusted parameter "white list" through.
      def cs1101_params
        params[:cs1101]
      end
  end
end
